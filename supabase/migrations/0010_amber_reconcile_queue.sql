-- The daily crawl pages through Amber's live, changing catalog across many
-- ticks spread over roughly 10-15 minutes (rate-limited to 10 req/min).
-- Amber's API gives no stable sort/cursor guarantee, so a listing can shift
-- pages mid-crawl and get skipped entirely for that day — it then looks
-- "gone" and gets misreported as sold on the Sales Snapshot even though it
-- never left the catalog. Spot-checking the 2026-09-13 -> 09-14 diff found
-- this happening to roughly two-thirds of that day's "sold" listings.
--
-- Fix: after the main crawl finishes, re-check each city that has at least
-- one "missing" listing directly against Amber (filtered by
-- location_place_name, which the API does support) before calling anything
-- sold. This table tracks that reconciliation pass per (sync_date, city) so
-- it can also be resumed across ticks, same as the main crawl.

create table if not exists public.amber_reconcile_queue (
  sync_date date not null,
  city text not null,
  status text not null default 'pending', -- 'pending' | 'done'
  next_page int not null default 1,
  -- Candidate rows (full previous-day snapshot rows, as JSON) still unconfirmed
  -- for this city — shrinks as matches are found on Amber's live feed.
  pending_candidates jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (sync_date, city)
);

alter table public.amber_reconcile_queue enable row level security;
-- No policies: only the service-role key (bypasses RLS) can read/write this table.

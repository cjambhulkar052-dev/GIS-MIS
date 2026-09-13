-- Tracks progress of the daily Amber full-catalog crawl across multiple
-- short cron ticks (a single serverless invocation can't fetch all pages
-- within Amber's 10 req/min rate limit for large catalogs).

create table if not exists public.amber_sync_progress (
  sync_date date primary key,
  next_page int not null default 1,
  total_pages int,
  status text not null default 'in_progress', -- 'in_progress' | 'completed'
  updated_at timestamptz not null default now()
);

alter table public.amber_sync_progress enable row level security;
-- No policies: only the service-role key (bypasses RLS) can read/write this table.

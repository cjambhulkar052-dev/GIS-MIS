-- Daily snapshots of Amber inventory, used to detect properties that went
-- from available to sold/unavailable between two consecutive daily runs.
-- Written only by the server-side cron job (service role) — no client access.

create table if not exists public.amber_inventory_snapshots (
  listing_id text not null,
  snapshot_date date not null,
  property_name text not null,
  city text,
  price numeric,
  currency text,
  available boolean not null default true,
  captured_at timestamptz not null default now(),
  primary key (listing_id, snapshot_date)
);

create index if not exists amber_inventory_snapshots_date_idx
  on public.amber_inventory_snapshots (snapshot_date);

alter table public.amber_inventory_snapshots enable row level security;
-- No policies defined: only the service-role key (which bypasses RLS) can
-- read or write this table. The publishable/anon key gets nothing.

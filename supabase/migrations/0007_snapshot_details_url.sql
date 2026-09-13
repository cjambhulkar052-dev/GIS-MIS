-- The Insights drill-down tables (country/city/university) list each
-- property but have no way to open it — Amber already gives us a deep link
-- per listing (partner_inventory_url / partner_link, pre-tagged with this
-- partner's UTM params — see AmberListing.detailsUrl in src/lib/amber-map.ts)
-- but the daily sync never persisted it, only the fields needed for
-- aggregation. Capture it so drill-down rows can link straight to the
-- property on Amber.

alter table public.amber_inventory_snapshots
  add column if not exists details_url text;

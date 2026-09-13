-- The daily sync stores the nearest university's name (see migration 0004)
-- but not the distance to it, so the Insights university drill-down page
-- can't show a "distance from university" column or place an approximate
-- marker for the university itself. Capture the raw string Amber reports
-- (unit varies by region, e.g. "0.2 mi" or "3.2 km") — same value already
-- surfaced as AmberListing.universityDistance for the live Find Rooms UI.

alter table public.amber_inventory_snapshots
  add column if not exists university_distance text;

-- Amber reports a real per-property lat/lng (`location.location_coordinates`)
-- that the daily sync previously discarded, leaving Insights to plot only an
-- approximate city-center bubble. Capturing it lets the country map show
-- individual property pins instead.
--
-- Existing rows (and any snapshot taken before the sync job is updated to
-- populate these) will have null lat/lng — callers must fall back to the
-- city-center lookup in that case.

alter table public.amber_inventory_snapshots
  add column if not exists lat double precision,
  add column if not exists lng double precision;

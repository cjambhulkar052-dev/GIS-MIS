-- Amber reports the nearest university/college per property (see
-- AmberApiDistance via meta.distances) but the daily sync only kept city.
-- Insights needs a university-level drill-down (country -> city -> university
-- -> inventory), so capture the single nearest non-"city center" place the
-- same way src/lib/amber-map.ts's deriveNearestPlace already picks it for
-- the live Find Rooms UI.
--
-- Existing rows (and any snapshot taken before the sync job is updated to
-- populate this) will have a null university.

alter table public.amber_inventory_snapshots
  add column if not exists university text;

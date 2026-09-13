-- Country membership was being inferred purely by matching a listing's
-- (free-text, Amber-supplied) `city` string against our static city->country
-- dictionary (see src/lib/city-geo.ts). Two different real-world cities
-- sharing a name (or a mistagged/unusual city string) would silently get
-- attributed to the wrong country, while the property's real coordinates
-- (already captured — see migration 0003) stayed correct — visibly so once
-- the country map started plotting individual pins, since a mis-attributed
-- property's real coordinates would land on a completely different
-- continent than the rest of the map.
--
-- Amber reports the property's actual country directly
-- (location.country.long_name — see src/lib/amber-map.ts's deriveLocation)
-- but the daily sync never persisted it, only city. Capture it so country
-- membership can be checked directly instead of re-derived from a city name.

alter table public.amber_inventory_snapshots
  add column if not exists country text;

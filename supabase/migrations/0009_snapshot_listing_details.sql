-- The property detail panel (PropertyDetailModal) only had the fields used
-- for aggregation (price, distance, status, coordinates) — nothing that
-- actually describes the listing itself, which is what the panel exists to
-- summarize instead of sending users to Amber's own page for. Amber's
-- partner feed already returns all of this per listing (see mapAmberInventory
-- in src/lib/amber-map.ts, used today by the live Find Rooms UI) but the
-- daily sync never persisted it for the snapshot/reporting side.
--
-- Note: Amber's consumer page also shows House Rules, FAQs, Meet the
-- Residents, Reviews, and a Price Trend chart — none of that is present in
-- the partner API response, so it can't be captured here.

alter table public.amber_inventory_snapshots
  add column if not exists room_type text,
  add column if not exists amenities text[],
  add column if not exists bills_policy text,
  add column if not exists rating numeric,
  add column if not exists available_from date,
  add column if not exists verified boolean,
  add column if not exists instant_book boolean;

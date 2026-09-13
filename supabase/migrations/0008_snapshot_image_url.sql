-- The Insights drill-down property panel (see PropertyDetailModal) shows a
-- photo alongside the structured facts already captured — Amber returns a
-- featured image per listing (images[0].base_path/path, falling back to
-- image_featured_link — see deriveImages in src/lib/amber-map.ts) but the
-- daily sync never persisted it. Capture the one we'd show on a listing
-- card anyway, same source as the live Find Rooms UI.

alter table public.amber_inventory_snapshots
  add column if not exists image_url text;

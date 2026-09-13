import "server-only";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "./supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * The daily cron job is the only writer to `amber_inventory_snapshots` /
 * `amber_sync_progress`, and it runs once a day — so it's safe to reuse
 * query results across requests for a while instead of re-scanning
 * thousands of rows on every page view. The cron job calls
 * `revalidateTag(CATALOG_CACHE_TAG)` once a sync completes, so this window
 * is just a ceiling on staleness, not the normal refresh path.
 */
const CATALOG_CACHE_SECONDS = 900;
export const CATALOG_CACHE_TAG = "amber-catalog";

export interface SnapshotRow {
  listing_id: string;
  snapshot_date: string;
  property_name: string;
  city: string | null;
  /** Amber's own reported country for this property — authoritative, unlike the city-name lookup in city-geo.ts. Null for older rows. */
  country: string | null;
  price: number | null;
  currency: string | null;
  available: boolean;
  /** Real per-property coordinates, when Amber reported them at sync time — null for older rows. */
  lat: number | null;
  lng: number | null;
  /** Nearest university/college Amber reports (excluding "city center") — null for older rows. */
  university: string | null;
  /** Raw distance string to that university, e.g. "0.2 mi" — null for older rows. */
  university_distance: string | null;
  /** Deep link to the property's Amber page — null for older rows (see migration 0007). */
  details_url: string | null;
  /** Featured property photo — null for older rows (see migration 0008). */
  image_url: string | null;
  /** Listing details below — null for older rows (see migration 0009). */
  room_type: string | null;
  amenities: string[] | null;
  bills_policy: string | null;
  rating: number | null;
  available_from: string | null;
  verified: boolean | null;
  instant_book: boolean | null;
}

export interface SoldReport {
  date: string;
  previousDate: string | null;
  noBaseline: boolean;
  soldRows: SnapshotRow[];
  scannedListings: number;
}

/**
 * Supabase/PostgREST caps an unpaginated select at 1000 rows by default —
 * with 4000+ listings a plain `.select("*")` would silently truncate the
 * diff. Page through with `.range()` until a page comes back short.
 */
export async function fetchAllSnapshotRows(
  supabase: AdminClient,
  snapshotDate: string,
): Promise<SnapshotRow[]> {
  const PAGE_SIZE = 1000;
  const all: SnapshotRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("amber_inventory_snapshots")
      .select("*")
      .eq("snapshot_date", snapshotDate)
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(error.message);
    all.push(...((data ?? []) as SnapshotRow[]));
    if (!data || data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return all;
}

/** Every date with a fully-completed crawl, most recent first. */
export async function getCompletedSyncDates(supabase: AdminClient): Promise<string[]> {
  const { data, error } = await supabase
    .from("amber_sync_progress")
    .select("sync_date")
    .eq("status", "completed")
    .order("sync_date", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => r.sync_date as string);
}

export const getCachedCompletedSyncDates = unstable_cache(
  () => getCompletedSyncDates(createAdminClient()),
  ["completed-sync-dates"],
  { revalidate: CATALOG_CACHE_SECONDS, tags: [CATALOG_CACHE_TAG] },
);

/** The most recent completed sync strictly before `date`, or null if none. */
async function getPreviousCompletedDate(
  supabase: AdminClient,
  date: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("amber_sync_progress")
    .select("sync_date")
    .eq("status", "completed")
    .lt("sync_date", date)
    .order("sync_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data?.sync_date as string | undefined) ?? null;
}

/**
 * Properties available on `previousDate` that are gone or unavailable on
 * `date` — the same "sold" definition used by the daily email report.
 */
export async function getSoldForDate(supabase: AdminClient, date: string): Promise<SoldReport> {
  const previousDate = await getPreviousCompletedDate(supabase, date);

  const [dateRows, previousRows] = await Promise.all([
    fetchAllSnapshotRows(supabase, date),
    previousDate ? fetchAllSnapshotRows(supabase, previousDate) : Promise.resolve([]),
  ]);

  const noBaseline = !previousDate || previousRows.length === 0;
  const dateById = new Map(dateRows.map((r) => [r.listing_id, r]));

  const soldRows: SnapshotRow[] = noBaseline
    ? []
    : previousRows.filter((prev) => {
        if (!prev.available) return false;
        const now = dateById.get(prev.listing_id);
        return !now || !now.available;
      });

  return { date, previousDate, noBaseline, soldRows, scannedListings: dateRows.length };
}

export const getCachedSoldForDate = unstable_cache(
  (date: string) => getSoldForDate(createAdminClient(), date),
  ["sold-for-date"],
  { revalidate: CATALOG_CACHE_SECONDS, tags: [CATALOG_CACHE_TAG] },
);

import "server-only";
import type { createAdminClient } from "./supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

export interface SnapshotRow {
  listing_id: string;
  snapshot_date: string;
  property_name: string;
  city: string | null;
  price: number | null;
  currency: string | null;
  available: boolean;
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

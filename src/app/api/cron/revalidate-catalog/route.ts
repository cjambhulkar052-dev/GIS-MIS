import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { CATALOG_CACHE_TAG } from "@/lib/sold-report";

/**
 * The daily cron only busts the catalog cache (see CATALOG_CACHE_TAG) as its
 * very last step, once a full crawl+reconcile cycle completes — and it
 * no-ops entirely once `amber_sync_progress.status` is already "completed"
 * for the day. That leaves no way to pick up a manual correction made
 * directly against the database (e.g. a one-off reconciliation fix) other
 * than waiting out the cache's normal revalidate window. This endpoint just
 * busts that cache on demand.
 */
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  revalidateTag(CATALOG_CACHE_TAG, { expire: 0 });
  return NextResponse.json({ revalidated: true });
}

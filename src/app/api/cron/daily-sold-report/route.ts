import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { Resend } from "resend";
import type { createAdminClient } from "@/lib/supabase/admin";
import { createAdminClient as createAdmin } from "@/lib/supabase/admin";
import {
  fetchAmberInventoryBatch,
  fetchAmberInventoryPage,
  sleep,
  DELAY_BETWEEN_PAGES_MS,
  PAGES_PER_TICK,
  RECONCILE_MAX_PAGES_PER_CITY,
} from "@/lib/amber-sync";
import { mapAmberInventory } from "@/lib/amber-map";
import {
  CATALOG_CACHE_TAG,
  fetchAllSnapshotRows,
  getPreviousCompletedDate,
  getSoldForDate,
  type SnapshotRow,
  type SoldReport,
} from "@/lib/sold-report";

export const maxDuration = 60;

type AdminClient = ReturnType<typeof createAdminClient>;

interface SyncProgress {
  sync_date: string;
  next_page: number;
  total_pages: number | null;
  status: "in_progress" | "reconciling" | "completed";
}

interface ReconcileQueueRow {
  sync_date: string;
  city: string;
  status: "pending" | "done";
  next_page: number;
  pending_candidates: SnapshotRow[];
}

/**
 * Amber's full catalog (thousands of listings, ~87 pages) can't be crawled
 * within one serverless invocation given Amber's 10 req/min rate limit.
 * This endpoint is designed to be called repeatedly (e.g. every minute by
 * cron-job.org during the 9 o'clock hour) and moves through three phases,
 * tracked by `amber_sync_progress.status`:
 *
 *   1. "in_progress" — paging through Amber's full catalog, a few pages
 *      per tick, same as before.
 *   2. "reconciling" — Amber gives no stable sort/cursor guarantee across
 *      the ~10-15 minutes the crawl takes, so a listing can shift pages
 *      mid-crawl and get skipped entirely for that day, making it look
 *      "sold" when it never left the catalog. This phase re-checks every
 *      city that has at least one such "missing" listing directly against
 *      Amber (see amber_reconcile_queue) before anything is called sold.
 *   3. "completed" — the diff against yesterday is now trustworthy; the
 *      report email goes out and the day is done.
 *
 * Calls after phase 3 for the day are cheap no-ops.
 */
function istNow(): { date: string; hour: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return { date: `${get("year")}-${get("month")}-${get("day")}`, hour: Number(get("hour")) };
}

function renderEmailHtml(report: SoldReport): string {
  const { soldRows, noBaseline, previousDate } = report;
  if (noBaseline) {
    return `<p>No previous snapshot to compare against yet — this looks like an early run. Today's inventory has been saved as a baseline; tomorrow's report will show real comparisons.</p>`;
  }
  if (soldRows.length === 0) {
    return `<p>No properties were sold on ${previousDate}.</p>`;
  }
  const rows = soldRows
    .map(
      (r) =>
        `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee">${r.property_name}</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${r.city ?? ""}</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${r.currency ?? ""} ${r.price ?? ""}</td></tr>`,
    )
    .join("");
  return `
    <p>${soldRows.length} propert${soldRows.length === 1 ? "y was" : "ies were"} sold on ${previousDate}:</p>
    <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px">
      <thead><tr>
        <th style="text-align:left;padding:6px 12px;border-bottom:2px solid #ddd">Property</th>
        <th style="text-align:left;padding:6px 12px;border-bottom:2px solid #ddd">City</th>
        <th style="text-align:left;padding:6px 12px;border-bottom:2px solid #ddd">Price</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const force = request.nextUrl.searchParams.get("force") === "true";

  try {
    return await tick(force);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}

async function tick(force: boolean) {
  const supabase = createAdmin();
  const { date: today, hour } = istNow();

  const { data: existing, error: readError } = await supabase
    .from("amber_sync_progress")
    .select("*")
    .eq("sync_date", today)
    .maybeSingle();

  if (readError) {
    return NextResponse.json({ error: readError.message }, { status: 500 });
  }

  let progress = existing as SyncProgress | null;

  if (!progress) {
    if (hour < 9 && !force) {
      return NextResponse.json({ status: "waiting", message: "Not yet 9 AM IST." });
    }
    const { data: created, error: insertError } = await supabase
      .from("amber_sync_progress")
      .insert({ sync_date: today, next_page: 1, status: "in_progress" })
      .select()
      .single();
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    progress = created as SyncProgress;
  }

  if (progress.status === "completed") {
    return NextResponse.json({ status: "completed", message: "Already done for today." });
  }

  if (progress.status === "reconciling") {
    return await reconcileTick(supabase, today);
  }

  return await crawlTick(supabase, today, progress);
}

/** Phase 1: fetch the next batch of catalog pages and upsert them into today's snapshot. */
async function crawlTick(supabase: AdminClient, today: string, progress: SyncProgress) {
  const batch = await fetchAmberInventoryBatch(progress.next_page);
  const mappedRows: SnapshotRow[] = batch.inventories
    .map((inv): SnapshotRow | null => {
      const mapped = mapAmberInventory(inv);
      if (!mapped) return null;
      return {
        listing_id: mapped.id,
        snapshot_date: today,
        property_name: mapped.propertyName,
        city: mapped.city,
        country: mapped.country ?? null,
        price: mapped.price,
        currency: mapped.currency,
        available: inv.available !== false,
        lat: mapped.lat ?? null,
        lng: mapped.lng ?? null,
        university: mapped.university ?? null,
        university_distance: mapped.universityDistance ?? null,
        details_url: mapped.detailsUrl ?? null,
        image_url: mapped.images[0] ?? null,
        room_type: mapped.roomType,
        amenities: mapped.amenities.length > 0 ? mapped.amenities : null,
        bills_policy: mapped.billsPolicy ?? null,
        rating: mapped.rating ?? null,
        available_from: mapped.availableFrom ?? null,
        verified: mapped.verified,
        instant_book: mapped.instantBook,
      };
    })
    .filter((r): r is SnapshotRow => r !== null);

  // Amber's catalog can shift slightly during a multi-minute crawl, so
  // consecutive pages occasionally overlap — dedupe before a single upsert
  // statement, which Postgres refuses if it'd touch the same row twice.
  const rows = Array.from(new Map(mappedRows.map((r) => [r.listing_id, r])).values());

  if (rows.length > 0) {
    const { error: upsertError } = await supabase
      .from("amber_inventory_snapshots")
      .upsert(rows, { onConflict: "listing_id,snapshot_date" });
    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }
  }

  const isDone = !batch.nextPage;
  const { error: progressError } = await supabase
    .from("amber_sync_progress")
    .update({
      next_page: isDone ? progress.next_page : batch.nextPage,
      total_pages: batch.totalPages,
      status: isDone ? "reconciling" : "in_progress",
      updated_at: new Date().toISOString(),
    })
    .eq("sync_date", today);
  if (progressError) {
    return NextResponse.json({ error: progressError.message }, { status: 500 });
  }

  if (!isDone) {
    return NextResponse.json({
      status: "in_progress",
      fetchedThisTick: rows.length,
      resumingAtPage: batch.nextPage,
      totalPages: batch.totalPages,
    });
  }

  // Last catalog page reached — seed the reconciliation queue (DB-only, no
  // Amber calls here) and let the *next* tick spend its Amber-call budget
  // on reconciliation, keeping each invocation's request count bounded.
  return await seedReconcileQueue(supabase, today);
}

/**
 * Finds every listing from yesterday's snapshot that's entirely absent from
 * today's just-finished crawl — regardless of whether it was available or
 * already sold out — groups the candidates by city, and queues one
 * reconciliation row per city. A listing that's still present today but
 * explicitly marked unavailable doesn't need re-checking — that comes
 * straight from Amber, not from crawl completeness. (Missing-but-already-
 * sold-out candidates matter too: left unreconciled, they silently vanish
 * from the total instead of carrying forward as still sold out — see
 * finalizeAndReport's cache-bust comment and the 2026-09-14 incident this
 * was written for.)
 */
async function seedReconcileQueue(supabase: AdminClient, today: string) {
  const previousDate = await getPreviousCompletedDate(supabase, today);

  if (!previousDate) {
    return await finalizeAndReport(supabase, today);
  }

  const [todayRows, previousRows] = await Promise.all([
    fetchAllSnapshotRows(supabase, today),
    fetchAllSnapshotRows(supabase, previousDate),
  ]);

  const todayIds = new Set(todayRows.map((r) => r.listing_id));
  const missing = previousRows.filter((prev) => !todayIds.has(prev.listing_id));

  if (missing.length === 0) {
    return await finalizeAndReport(supabase, today);
  }

  const byCity = new Map<string, SnapshotRow[]>();
  for (const row of missing) {
    const city = row.city ?? "Unknown";
    if (!byCity.has(city)) byCity.set(city, []);
    byCity.get(city)!.push(row);
  }

  const queueRows: ReconcileQueueRow[] = Array.from(byCity.entries()).map(([city, candidates]) => ({
    sync_date: today,
    city,
    status: "pending",
    next_page: 1,
    pending_candidates: candidates,
  }));

  const { error } = await supabase.from("amber_reconcile_queue").upsert(queueRows, {
    onConflict: "sync_date,city",
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    status: "reconciling",
    message: `Queued ${queueRows.length} cities for reconciliation.`,
    candidateListings: missing.length,
  });
}

/**
 * Phase 2: spends this tick's Amber-call budget re-checking pending cities
 * directly against Amber's live feed (filtered by location_place_name,
 * which the partner API does support), before the next tick continues with
 * whatever's left. Two outcomes per candidate:
 *
 *   - Found live: re-inserted into today's snapshot with Amber's *current*
 *     availability (trust fresh data — a previously-sold-out listing found
 *     live might still be sold out, or might not be; a previously-available
 *     one found live corrects the false "sold" read).
 *   - Still not found after exhausting the city (or the per-city page cap):
 *     if it was already sold out yesterday, carry it forward as still sold
 *     out — otherwise it silently vanishes from today's total instead of
 *     just staying counted. If it was available yesterday, leave it absent;
 *     that's a genuine sale and the diff already reads it correctly.
 */
async function reconcileTick(supabase: AdminClient, today: string) {
  const { data: pending, error } = await supabase
    .from("amber_reconcile_queue")
    .select("*")
    .eq("sync_date", today)
    .eq("status", "pending");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const pendingRows = (pending ?? []) as ReconcileQueueRow[];
  if (pendingRows.length === 0) {
    return await finalizeAndReport(supabase, today);
  }

  const upsertRows: SnapshotRow[] = [];
  let requestsLeft = PAGES_PER_TICK;
  let requestsMade = 0;

  for (const row of pendingRows) {
    if (requestsLeft <= 0) break;

    const remainingCandidates = new Map(row.pending_candidates.map((c) => [c.listing_id, c]));
    let page = row.next_page;
    let done = false;

    while (requestsLeft > 0 && remainingCandidates.size > 0) {
      if (requestsMade > 0) await sleep(DELAY_BETWEEN_PAGES_MS);
      const result = await fetchAmberInventoryPage(page, row.city);
      requestsLeft--;
      requestsMade++;

      for (const inv of result.inventories) {
        const id = `amber-${inv.id}`;
        const candidate = remainingCandidates.get(id);
        if (candidate) {
          upsertRows.push({ ...candidate, snapshot_date: today, available: inv.available !== false });
          remainingCandidates.delete(id);
        }
      }

      if (!result.nextPage || remainingCandidates.size === 0 || page >= RECONCILE_MAX_PAGES_PER_CITY) {
        done = true;
        break;
      }
      page = result.nextPage;
    }

    if (done) {
      for (const candidate of remainingCandidates.values()) {
        if (!candidate.available) {
          upsertRows.push({ ...candidate, snapshot_date: today, available: false });
        }
      }
    }

    const { error: updateError } = await supabase
      .from("amber_reconcile_queue")
      .update({
        status: done ? "done" : "pending",
        next_page: page,
        pending_candidates: Array.from(remainingCandidates.values()),
        updated_at: new Date().toISOString(),
      })
      .eq("sync_date", today)
      .eq("city", row.city);
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (!done) break; // out of budget mid-city — resume this exact city next tick
  }

  if (upsertRows.length > 0) {
    const { error: upsertError } = await supabase
      .from("amber_inventory_snapshots")
      .upsert(upsertRows, { onConflict: "listing_id,snapshot_date" });
    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }
  }

  const { count, error: countError } = await supabase
    .from("amber_reconcile_queue")
    .select("*", { count: "exact", head: true })
    .eq("sync_date", today)
    .eq("status", "pending");
  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  if ((count ?? 0) === 0) {
    return await finalizeAndReport(supabase, today);
  }

  return NextResponse.json({
    status: "reconciling",
    reconciledThisTick: upsertRows.length,
    citiesRemaining: count,
  });
}

/** Phase 3: today's snapshot is now trustworthy — diff it, email it, and mark the day done. */
async function finalizeAndReport(supabase: AdminClient, today: string) {
  // Insights/Sales pages cache reads off this same data (see CATALOG_CACHE_TAG),
  // so bust that cache now that today's snapshot is final rather than waiting
  // for it to expire on its own.
  revalidateTag(CATALOG_CACHE_TAG, { expire: 0 });

  const { error: progressError } = await supabase
    .from("amber_sync_progress")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("sync_date", today);
  if (progressError) {
    return NextResponse.json({ error: progressError.message }, { status: 500 });
  }

  const report = await getSoldForDate(supabase, today);

  const recipients = (process.env.DAILY_REPORT_RECIPIENTS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  let emailResult: { id?: string } | { error: string } = { error: "Resend not configured" };
  if (process.env.RESEND_API_KEY && recipients.length > 0) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
      to: recipients,
      subject: `Amber daily sales report — ${report.previousDate ?? today} (${report.noBaseline ? "no baseline" : report.soldRows.length})`,
      html: renderEmailHtml(report),
    });
    emailResult = error ? { error: error.message } : { id: data?.id };
  }

  return NextResponse.json({
    status: "completed",
    today,
    previousDate: report.previousDate,
    scannedListings: report.scannedListings,
    soldCount: report.soldRows.length,
    noBaseline: report.noBaseline,
    emailResult,
  });
}

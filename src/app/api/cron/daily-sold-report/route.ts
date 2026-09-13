import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAmberInventoryBatch } from "@/lib/amber-sync";
import { mapAmberInventory } from "@/lib/amber-map";

export const maxDuration = 60;

interface SnapshotRow {
  listing_id: string;
  snapshot_date: string;
  property_name: string;
  city: string | null;
  price: number | null;
  currency: string | null;
  available: boolean;
}

interface SyncProgress {
  sync_date: string;
  next_page: number;
  total_pages: number | null;
  status: "in_progress" | "completed";
}

/**
 * Amber's full catalog (thousands of listings, ~87 pages) can't be crawled
 * within one serverless invocation given Amber's 10 req/min rate limit.
 * This endpoint is designed to be called repeatedly (e.g. every minute by
 * cron-job.org during the 9 o'clock hour) — each call fetches a few more
 * pages and persists progress in Supabase. Once the last page is reached,
 * that same call runs the diff against yesterday's snapshot and sends the
 * report email. Calls after completion for the day are cheap no-ops.
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

function istDateString(daysAgo: number): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(Date.now() - daysAgo * 86_400_000));
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function renderEmailHtml(soldRows: SnapshotRow[], yesterday: string, noBaseline: boolean): string {
  if (noBaseline) {
    return `<p>No snapshot exists for ${yesterday} yet — this looks like the first run. Today's inventory has been saved as a baseline; tomorrow's report will show real comparisons.</p>`;
  }
  if (soldRows.length === 0) {
    return `<p>No properties were sold on ${yesterday}.</p>`;
  }
  const rows = soldRows
    .map(
      (r) =>
        `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee">${r.property_name}</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${r.city ?? ""}</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${r.currency ?? ""} ${r.price ?? ""}</td></tr>`,
    )
    .join("");
  return `
    <p>${soldRows.length} propert${soldRows.length === 1 ? "y was" : "ies were"} sold on ${yesterday}:</p>
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
  const supabase = createAdminClient();
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

  // Fetch the next batch of pages and upsert them into today's snapshot.
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
        price: mapped.price,
        currency: mapped.currency,
        available: inv.available !== false,
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
      status: isDone ? "completed" : "in_progress",
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

  // Last page reached this tick — diff against yesterday and send the email.
  return await finalizeAndEmail(supabase, today);
}

/**
 * Supabase/PostgREST caps an unpaginated select at 1000 rows by default —
 * with 4000+ listings a plain `.select("*")` would silently truncate the
 * diff. Page through with `.range()` until a page comes back short.
 */
async function fetchAllSnapshotRows(
  supabase: ReturnType<typeof createAdminClient>,
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

async function finalizeAndEmail(
  supabase: ReturnType<typeof createAdminClient>,
  today: string,
) {
  const yesterday = istDateString(1);

  const [yesterdayRows, todayRows] = await Promise.all([
    fetchAllSnapshotRows(supabase, yesterday),
    fetchAllSnapshotRows(supabase, today),
  ]);

  const noBaseline = yesterdayRows.length === 0;
  const todayById = new Map(todayRows.map((r) => [r.listing_id, r]));

  const soldRows: SnapshotRow[] = noBaseline
    ? []
    : yesterdayRows.filter((y) => {
        if (!y.available) return false;
        const now = todayById.get(y.listing_id);
        return !now || !now.available;
      });

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
      subject: `Amber daily sales report — ${yesterday} (${noBaseline ? "no baseline" : soldRows.length})`,
      html: renderEmailHtml(soldRows, yesterday, noBaseline),
    });
    emailResult = error ? { error: error.message } : { id: data?.id };
  }

  return NextResponse.json({
    status: "completed",
    today,
    yesterday,
    scannedListings: todayRows.length,
    soldCount: soldRows.length,
    noBaseline,
    emailResult,
  });
}

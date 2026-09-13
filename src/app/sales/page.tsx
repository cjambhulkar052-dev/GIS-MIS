import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCompletedSyncDates, getSoldForDate } from "@/lib/sold-report";

function formatDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const admin = createAdminClient();
  const dates = await getCompletedSyncDates(admin);
  const { date: requestedDate } = await searchParams;
  const selectedDate = requestedDate && dates.includes(requestedDate) ? requestedDate : dates[0];
  const report = selectedDate ? await getSoldForDate(admin, selectedDate) : null;

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-ink-50/40">
        <section className="border-b border-ink-200 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-10">
            <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
              Sold Properties
            </h1>
            <p className="mt-1 text-sm text-ink-500">
              Daily Amber inventory snapshots — pick a date to see what sold since the day before.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-6 py-8">
          {dates.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
              <p className="text-sm font-medium text-ink-900">No snapshots yet</p>
              <p className="mt-1 text-sm text-ink-500">
                The daily sync hasn&apos;t completed a run yet — check back after the next 9 AM
                IST job.
              </p>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
              {/* Date list */}
              <aside className="h-fit rounded-2xl border border-ink-200 bg-white p-3 lg:sticky lg:top-24">
                <h2 className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-ink-400">
                  Dates
                </h2>
                <nav className="mt-1 flex flex-col gap-1">
                  {dates.map((d) => (
                    <Link
                      key={d}
                      href={`/sales?date=${d}`}
                      className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                        d === selectedDate
                          ? "bg-brand-600 text-white"
                          : "text-ink-600 hover:bg-ink-50"
                      }`}
                    >
                      {formatDate(d)}
                    </Link>
                  ))}
                </nav>
              </aside>

              {/* Report */}
              <div>
                {report && (
                  <>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                      <h2 className="text-lg font-semibold text-ink-900">
                        {formatDate(report.date)}
                      </h2>
                      <p className="text-xs text-ink-400">
                        Scanned {report.scannedListings.toLocaleString()} listings
                        {report.previousDate &&
                          ` · compared against ${formatDate(report.previousDate)}`}
                      </p>
                    </div>

                    {report.noBaseline ? (
                      <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
                        <p className="text-sm font-medium text-ink-900">
                          No earlier snapshot to compare against
                        </p>
                        <p className="mt-1 text-sm text-ink-500">
                          This was the first completed sync at the time, so there&apos;s nothing
                          to diff it against yet.
                        </p>
                      </div>
                    ) : report.soldRows.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
                        <p className="text-sm font-medium text-ink-900">
                          No properties were sold
                        </p>
                        <p className="mt-1 text-sm text-ink-500">
                          Every listing available on {formatDate(report.previousDate!)} was still
                          available on {formatDate(report.date)}.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-ink-200 bg-ink-50/60 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                              <th className="px-4 py-3">Property</th>
                              <th className="px-4 py-3">City</th>
                              <th className="px-4 py-3">Price</th>
                            </tr>
                          </thead>
                          <tbody>
                            {report.soldRows.map((row) => (
                              <tr
                                key={row.listing_id}
                                className="border-b border-ink-100 last:border-0"
                              >
                                <td className="px-4 py-3 font-medium text-ink-900">
                                  {row.property_name}
                                </td>
                                <td className="px-4 py-3 text-ink-600">{row.city ?? "—"}</td>
                                <td className="px-4 py-3 text-ink-600">
                                  {row.currency ?? ""} {row.price ?? "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

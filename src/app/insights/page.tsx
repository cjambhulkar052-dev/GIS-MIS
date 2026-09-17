import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CityMapLoader, type CityMapPoint } from "@/components/city-map-loader";
import { CitySearch } from "@/components/city-search";
import { UniversitySearch } from "@/components/university-search";
import type { CityInsight } from "@/lib/inventory-insights";
import { getCachedInventoryInsights } from "@/lib/inventory-insights";

function formatDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatShortDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export default async function InsightsPage() {
  const insights = await getCachedInventoryInsights();
  const mapPoints: CityMapPoint[] =
    insights?.cities
      .filter((c: CityInsight) => c.lat != null && c.lng != null)
      .map((c: CityInsight) => ({
        city: c.city,
        country: c.country,
        lat: c.lat!,
        lng: c.lng!,
        count: c.count,
      })) ?? [];
  const searchableCities =
    insights?.cities
      .filter((c: CityInsight): c is CityInsight & { country: string } => c.country != null)
      .map((c) => ({ city: c.city, country: c.country })) ?? [];
  const searchableUniversities = insights?.universities ?? [];

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-ink-50/40">
        <section className="border-b border-ink-200 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-3 py-1 text-xs font-medium text-ink-600 shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {insights ? `Live as of ${formatDate(insights.latestDate)}` : "No live sync yet"}
                </span>
                <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink-900">
                  Insights
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-ink-500">
                  A geographic read on the overall Amber catalog — how much inventory is live
                  right now, how much is already sold out, and where it all sits.
                </p>
              </div>
              <div className="flex flex-col gap-4">
                {searchableCities.length > 0 && (
                  <div>
                    <label
                      htmlFor="city-search"
                      className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400"
                    >
                      City
                    </label>
                    <CitySearch id="city-search" cities={searchableCities} />
                  </div>
                )}
                {searchableUniversities.length > 0 && (
                  <div>
                    <label
                      htmlFor="university-search"
                      className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400"
                    >
                      University
                    </label>
                    <UniversitySearch id="university-search" universities={searchableUniversities} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {!insights ? (
          <div className="mx-auto max-w-7xl px-6 py-8">
            <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
              <p className="text-sm font-medium text-ink-900">No snapshots yet</p>
              <p className="mt-1 text-sm text-ink-500">
                The daily sync hasn&apos;t completed a run yet — check back after the next 9 AM
                IST job.
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-7xl px-6 py-8">
            {/* KPI row */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {[
                { label: "Live listings", value: insights.totalAvailable.toLocaleString() },
                {
                  label: "Sold out (overall)",
                  value: `${insights.totalSoldOut.toLocaleString()} · ${insights.soldOutPct}%`,
                },
                { label: "Cities live", value: insights.citiesCovered.toLocaleString() },
                { label: "Countries mapped", value: insights.countriesCovered.toLocaleString() },
                { label: "Sync streak", value: `${insights.syncStreak}d` },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-2xl border border-ink-200 bg-white p-4 shadow-sm shadow-ink-900/5"
                >
                  <p className="text-2xl font-semibold tracking-tight text-ink-900">
                    {kpi.value}
                  </p>
                  <p className="mt-1 text-xs font-medium text-ink-500">{kpi.label}</p>
                </div>
              ))}
            </div>

            {/* Map + top markets */}
            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
              <div className="overflow-hidden rounded-2xl border border-ink-800 bg-ink-900 shadow-xl shadow-ink-900/20">
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                  <div>
                    <h2 className="text-sm font-semibold text-white">Inventory map</h2>
                    <p className="mt-0.5 text-xs text-ink-400">
                      Bubble size = live listings in that city — click to drill in
                    </p>
                  </div>
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-ink-200">
                    {insights.mappedCities} / {insights.citiesCovered} cities plotted
                  </span>
                </div>
                <div className="h-[520px]">
                  <CityMapLoader points={mapPoints} />
                </div>
              </div>

              <div className="rounded-2xl border border-ink-200 bg-white">
                <div className="border-b border-ink-100 px-5 py-4">
                  <h2 className="text-sm font-semibold text-ink-900">Countries</h2>
                  <p className="mt-0.5 text-xs text-ink-500">
                    Click a country for its full inventory
                  </p>
                </div>
                <div className="max-h-[460px] divide-y divide-ink-100 overflow-y-auto">
                  {insights.countries.map((c) => (
                    <Link
                      key={c.country}
                      href={`/insights/country/${encodeURIComponent(c.country)}`}
                      className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-ink-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink-900">
                          {c.country}
                        </p>
                        <p className="text-xs text-ink-500">
                          {c.cityCount} {c.cityCount === 1 ? "city" : "cities"} ·{" "}
                          {c.totalSoldOut.toLocaleString()} sold out
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 text-sm font-semibold text-ink-900">
                        {c.totalAvailable.toLocaleString()}
                        <span className="text-ink-300">→</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Sync health */}
            <div className="mt-6 rounded-2xl border border-ink-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-ink-900">Sync health</h2>
                  <p className="mt-0.5 text-xs text-ink-500">
                    Scanned {insights.scannedListings.toLocaleString()} listings on{" "}
                    {formatDate(insights.latestDate)}
                  </p>
                </div>
                <Link
                  href={`/sales?date=${insights.latestDate}`}
                  className="text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  View sold report →
                </Link>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {insights.recentDates.map((d) => (
                  <Link
                    key={d}
                    href={`/sales?date=${d}`}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      d === insights.latestDate
                        ? "bg-brand-600 text-white"
                        : "bg-ink-50 text-ink-600 hover:bg-ink-100"
                    }`}
                  >
                    {formatShortDate(d)}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

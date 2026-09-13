import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PropertyMapLoader, type PropertyMapPoint } from "@/components/property-map-loader";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCompletedSyncDates } from "@/lib/sold-report";
import { getCountryInventory, summarizeByCity } from "@/lib/inventory-insights";

export default async function CountryInventoryPage({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country: encoded } = await params;
  const country = decodeURIComponent(encoded);

  const admin = createAdminClient();
  const dates = await getCompletedSyncDates(admin);
  const latestDate = dates[0];
  const previousDate = dates[1] ?? null;
  const listings = latestDate
    ? await getCountryInventory(admin, country, latestDate, previousDate)
    : [];
  const available = listings.filter((l) => l.status === "available");
  const sold = listings.filter((l) => l.status === "sold");

  // Amber reports a real per-property lat/lng for most listings — plot each
  // as its own pin on a real street map (OpenStreetMap tiles), colored by
  // availability, instead of an approximate city-center bubble on a vector
  // world map. Rows synced before the daily job started capturing
  // coordinates won't have lat/lng yet; those are simply omitted below.
  const mapPoints: PropertyMapPoint[] = listings
    .filter((l) => l.lat != null && l.lng != null)
    .map((l) => ({
      id: l.listingId,
      label: l.propertyName,
      lat: l.lat!,
      lng: l.lng!,
      status: l.status,
      price: l.price,
      currency: l.currency,
    }));
  const missingCoords = listings.length - mapPoints.length;
  const cities = summarizeByCity(listings);

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-ink-50/40">
        <section className="border-b border-ink-200 bg-white">
          <div className="mx-auto max-w-5xl px-6 py-10">
            <Link
              href="/insights"
              className="text-sm font-medium text-ink-500 transition hover:text-ink-700"
            >
              ← Insights
            </Link>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink-900">{country}</h1>
            {latestDate && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {available.length.toLocaleString()} available
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-ink-400" />
                  {sold.length.toLocaleString()} sold out
                </span>
                <span className="text-xs text-ink-400">as of {latestDate}</span>
              </div>
            )}
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-6 py-8">
          {mapPoints.length > 0 && (
            <div className="mb-6 overflow-hidden rounded-2xl border border-ink-800 bg-ink-900 shadow-xl shadow-ink-900/20">
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <div>
                  <h2 className="text-sm font-semibold text-white">{country} inventory map</h2>
                  <p className="mt-0.5 text-xs text-ink-400">
                    <span className="text-emerald-400">●</span> Available ·{" "}
                    <span className="text-ink-400">●</span> Sold out
                    {missingCoords > 0 &&
                      ` — ${missingCoords.toLocaleString()} ${missingCoords === 1 ? "property is" : "properties are"} awaiting coordinates`}
                  </p>
                </div>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-ink-200">
                  {mapPoints.length.toLocaleString()} {mapPoints.length === 1 ? "property" : "properties"} plotted
                </span>
              </div>
              <div className="h-[520px]">
                <PropertyMapLoader points={mapPoints} highlightCountry={country} />
              </div>
            </div>
          )}

          {!latestDate ? (
            <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
              <p className="text-sm font-medium text-ink-900">No snapshots yet</p>
              <p className="mt-1 text-sm text-ink-500">
                The daily sync hasn&apos;t completed a run yet — check back after the next 9 AM
                IST job.
              </p>
            </div>
          ) : listings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
              <p className="text-sm font-medium text-ink-900">No inventory found</p>
              <p className="mt-1 text-sm text-ink-500">
                We don&apos;t have any mapped listings for {country} yet.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-ink-200 bg-white">
              <div className="border-b border-ink-100 px-5 py-4">
                <h2 className="text-sm font-semibold text-ink-900">Cities</h2>
                <p className="mt-0.5 text-xs text-ink-500">Click a city for its universities</p>
              </div>
              <div className="divide-y divide-ink-100">
                {cities.map((c) => (
                  <Link
                    key={c.city}
                    href={`/insights/country/${encodeURIComponent(country)}/city/${encodeURIComponent(c.city)}`}
                    className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-ink-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink-900">{c.city}</p>
                      <p className="text-xs text-ink-500">
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
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

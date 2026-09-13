import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { UniversityInventoryClient } from "@/components/university-inventory-client";
import { getCachedCompletedSyncDates } from "@/lib/sold-report";
import { getCachedCountryInventory } from "@/lib/inventory-insights";

export default async function UniversityInventoryPage({
  params,
}: {
  params: Promise<{ country: string; city: string; university: string }>;
}) {
  const { country: encodedCountry, city: encodedCity, university: encodedUniversity } = await params;
  const country = decodeURIComponent(encodedCountry);
  const city = decodeURIComponent(encodedCity);
  const university = decodeURIComponent(encodedUniversity);

  const dates = await getCachedCompletedSyncDates();
  const latestDate = dates[0];
  const previousDate = dates[1] ?? null;
  const countryListings = latestDate
    ? await getCachedCountryInventory(country, latestDate, previousDate)
    : [];
  const listings = countryListings.filter(
    (l) => l.city === city && (l.university ?? "Unmapped") === university,
  );
  const available = listings.filter((l) => l.status === "available");
  const sold = listings.filter((l) => l.status === "sold");

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-ink-50/40">
        <section className="border-b border-ink-200 bg-white">
          <div className="mx-auto max-w-5xl px-6 py-10">
            <div className="flex flex-wrap items-center gap-1.5 text-sm text-ink-500">
              <Link
                href={`/insights/country/${encodeURIComponent(country)}`}
                className="font-medium transition hover:text-ink-700"
              >
                {country}
              </Link>
              <span className="text-ink-300">/</span>
              <Link
                href={`/insights/country/${encodeURIComponent(country)}/city/${encodeURIComponent(city)}`}
                className="font-medium transition hover:text-ink-700"
              >
                {city}
              </Link>
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink-900">{university}</h1>
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
                We don&apos;t have any mapped listings near {university} yet.
              </p>
            </div>
          ) : (
            <UniversityInventoryClient university={university} listings={listings} />
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

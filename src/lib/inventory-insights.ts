import "server-only";
import type { createAdminClient } from "./supabase/admin";
import { fetchAllSnapshotRows, getCompletedSyncDates, type SnapshotRow } from "./sold-report";
import { getCityGeo } from "./city-geo";

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * A listing's real country, as Amber itself reported it at sync time.
 * Falls back to the static city-name lookup only for rows synced before
 * that was captured (see migration 0006) — city names collide across
 * countries (e.g. more than one real-world "Cambridge"), so the stored
 * value is authoritative whenever it's present.
 */
function resolveCountry(row: SnapshotRow): string | undefined {
  return row.country ?? getCityGeo(row.city)?.country;
}

export interface CityInsight {
  city: string;
  country?: string;
  lat?: number;
  lng?: number;
  count: number;
  avgPrice: number | null;
  currency: string | null;
}

export interface CountryInsight {
  country: string;
  cityCount: number;
  totalAvailable: number;
  totalSoldOut: number;
}

export interface InventoryInsights {
  latestDate: string;
  syncStreak: number;
  scannedListings: number;
  totalAvailable: number;
  totalSoldOut: number;
  soldOutPct: number;
  citiesCovered: number;
  countriesCovered: number;
  mappedCities: number;
  cities: CityInsight[];
  countries: CountryInsight[];
  recentDates: string[];
  universities: UniversityDirectoryEntry[];
}

export interface UniversityDirectoryEntry {
  university: string;
  city: string;
  country: string;
}

/** Every (university, city, country) triple Amber has tagged in `rows`, for the Insights homepage's university search box. */
function buildUniversityDirectory(rows: SnapshotRow[]): UniversityDirectoryEntry[] {
  const seen = new Map<string, UniversityDirectoryEntry>();

  for (const row of rows) {
    const university = row.university?.trim();
    const city = row.city?.trim();
    const country = resolveCountry(row);
    if (!university || !city || !country) continue;
    const key = `${university}|${city}|${country}`;
    if (!seen.has(key)) seen.set(key, { university, city, country });
  }

  return Array.from(seen.values()).sort((a, b) => a.university.localeCompare(b.university));
}

/**
 * Aggregates the latest completed Amber snapshot into a point-in-time read of
 * the overall catalog — live vs. already sold-out — for the Insights
 * dashboard. This is a snapshot of current state, not a day-over-day diff;
 * "what sold today" lives on the Sales page (see getSoldForDate).
 */
export async function getInventoryInsights(supabase: AdminClient): Promise<InventoryInsights | null> {
  const dates = await getCompletedSyncDates(supabase);
  const latestDate = dates[0];
  if (!latestDate) return null;

  const rows = await fetchAllSnapshotRows(supabase, latestDate);
  const available = rows.filter((r) => r.available);
  const soldOut = rows.filter((r) => !r.available);

  const byCity = new Map<
    string,
    { count: number; priceSum: number; priceCount: number; currency: string | null; country?: string }
  >();

  for (const row of available) {
    const city = row.city?.trim() || "Unknown";
    const bucket = byCity.get(city) ?? {
      count: 0,
      priceSum: 0,
      priceCount: 0,
      currency: null,
      country: resolveCountry(row),
    };
    bucket.count += 1;
    bucket.country ??= resolveCountry(row);
    if (row.price != null) {
      bucket.priceSum += row.price;
      bucket.priceCount += 1;
      bucket.currency ??= row.currency;
    }
    byCity.set(city, bucket);
  }

  const countrySet = new Set<string>();
  let mappedCities = 0;

  const cities: CityInsight[] = Array.from(byCity.entries())
    .map(([city, bucket]) => {
      const geo = getCityGeo(city);
      if (geo) mappedCities += 1;
      const country = bucket.country ?? geo?.country;
      if (country) countrySet.add(country);
      return {
        city,
        country,
        lat: geo?.lat,
        lng: geo?.lng,
        count: bucket.count,
        avgPrice: bucket.priceCount > 0 ? Math.round(bucket.priceSum / bucket.priceCount) : null,
        currency: bucket.currency,
      };
    })
    .sort((a, b) => b.count - a.count);

  const soldOutByCountry = new Map<string, number>();
  for (const row of soldOut) {
    const country = resolveCountry(row);
    if (!country) continue;
    soldOutByCountry.set(country, (soldOutByCountry.get(country) ?? 0) + 1);
  }

  const countryTotals = new Map<string, { cityCount: number; totalAvailable: number }>();
  for (const c of cities) {
    if (!c.country) continue;
    const bucket = countryTotals.get(c.country) ?? { cityCount: 0, totalAvailable: 0 };
    bucket.cityCount += 1;
    bucket.totalAvailable += c.count;
    countryTotals.set(c.country, bucket);
  }

  const countries: CountryInsight[] = Array.from(countryTotals.entries())
    .map(([country, totals]) => ({
      country,
      cityCount: totals.cityCount,
      totalAvailable: totals.totalAvailable,
      totalSoldOut: soldOutByCountry.get(country) ?? 0,
    }))
    .sort((a, b) => b.totalAvailable - a.totalAvailable);

  return {
    latestDate,
    syncStreak: dates.length,
    scannedListings: rows.length,
    totalAvailable: available.length,
    totalSoldOut: soldOut.length,
    soldOutPct: rows.length > 0 ? Math.round((soldOut.length / rows.length) * 100) : 0,
    citiesCovered: byCity.size,
    countriesCovered: countrySet.size,
    mappedCities,
    cities,
    countries,
    recentDates: dates.slice(0, 14),
    universities: buildUniversityDirectory(rows),
  };
}

export interface CountryListingRow {
  listingId: string;
  propertyName: string;
  city: string;
  price: number | null;
  currency: string | null;
  status: "available" | "sold";
  /** Real per-property coordinates, when Amber reported them at sync time. */
  lat: number | null;
  lng: number | null;
  /** Nearest university/college Amber reports, when tagged at sync time. */
  university: string | null;
  /** Raw distance string to that university, e.g. "0.2 mi". */
  universityDistance: string | null;
}

/**
 * Every listing Amber has reported for `country` on `latestDate` or
 * `previousDate`, tagged available/sold, for the Insights country drill-down
 * page. "Sold" covers both a listing Amber itself already marks unavailable
 * (sold out, independent of any day-over-day comparison) and one that was
 * live yesterday but is gone from today's catalog entirely.
 */
export async function getCountryInventory(
  supabase: AdminClient,
  country: string,
  latestDate: string,
  previousDate: string | null,
): Promise<CountryListingRow[]> {
  const [latestRows, previousRows] = await Promise.all([
    fetchAllSnapshotRows(supabase, latestDate),
    previousDate ? fetchAllSnapshotRows(supabase, previousDate) : Promise.resolve([]),
  ]);

  const inCountry = (row: SnapshotRow) => resolveCountry(row) === country;

  const latestById = new Map(latestRows.filter(inCountry).map((r) => [r.listing_id, r]));
  const previousById = new Map(previousRows.filter(inCountry).map((r) => [r.listing_id, r]));

  const allIds = new Set([...latestById.keys(), ...previousById.keys()]);
  const results: CountryListingRow[] = [];

  for (const id of allIds) {
    const latest = latestById.get(id);
    const previous = previousById.get(id);
    const source = latest ?? previous!;
    // Sold covers two cases: Amber itself already reports this listing as
    // unavailable (already sold out, regardless of yesterday's snapshot), or
    // it was live yesterday and has vanished from today's catalog entirely.
    const status: CountryListingRow["status"] = latest?.available ? "available" : "sold";

    results.push({
      listingId: id,
      propertyName: source.property_name,
      city: source.city ?? "Unknown",
      price: source.price,
      currency: source.currency,
      status,
      lat: source.lat,
      lng: source.lng,
      university: source.university,
      universityDistance: source.university_distance,
    });
  }

  return results.sort((a, b) => {
    if (a.status !== b.status) return a.status === "available" ? -1 : 1;
    return a.city.localeCompare(b.city) || a.propertyName.localeCompare(b.propertyName);
  });
}

export interface CityInventoryInsight {
  city: string;
  lat: number | null;
  lng: number | null;
  totalAvailable: number;
  totalSoldOut: number;
}

/** Rolls up a country's listings (from getCountryInventory) by city, for the country drill-down page. */
export function summarizeByCity(listings: CountryListingRow[]): CityInventoryInsight[] {
  const byCity = new Map<
    string,
    { lat: number | null; lng: number | null; available: number; sold: number }
  >();

  for (const l of listings) {
    const bucket = byCity.get(l.city) ?? { lat: l.lat, lng: l.lng, available: 0, sold: 0 };
    if (l.status === "available") bucket.available += 1;
    else bucket.sold += 1;
    if (bucket.lat == null && l.lat != null) {
      bucket.lat = l.lat;
      bucket.lng = l.lng;
    }
    byCity.set(l.city, bucket);
  }

  return Array.from(byCity.entries())
    .map(([city, b]) => ({
      city,
      lat: b.lat,
      lng: b.lng,
      totalAvailable: b.available,
      totalSoldOut: b.sold,
    }))
    .sort((a, b) => b.totalAvailable + b.totalSoldOut - (a.totalAvailable + a.totalSoldOut));
}

export interface UniversityInventoryInsight {
  university: string;
  totalAvailable: number;
  totalSoldOut: number;
}

/** Rolls up a city's listings by nearest university, for the city drill-down page. */
export function summarizeByUniversity(listings: CountryListingRow[]): UniversityInventoryInsight[] {
  const byUniversity = new Map<string, { available: number; sold: number }>();

  for (const l of listings) {
    const key = l.university ?? "Unmapped";
    const bucket = byUniversity.get(key) ?? { available: 0, sold: 0 };
    if (l.status === "available") bucket.available += 1;
    else bucket.sold += 1;
    byUniversity.set(key, bucket);
  }

  return Array.from(byUniversity.entries())
    .map(([university, b]) => ({
      university,
      totalAvailable: b.available,
      totalSoldOut: b.sold,
    }))
    .sort((a, b) => b.totalAvailable + b.totalSoldOut - (a.totalAvailable + a.totalSoldOut));
}

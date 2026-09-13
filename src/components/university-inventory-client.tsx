"use client";

import { useMemo, useState } from "react";
import {
  PropertyMapLoader,
  type PropertyMapPoint,
  type UniversityMapPoint,
} from "@/components/property-map-loader";
import type { CountryListingRow } from "@/lib/inventory-insights";

type StatusFilter = "all" | "available" | "sold";
type SortKey = "price-asc" | "price-desc";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "available", label: "Available" },
  { value: "sold", label: "Sold out" },
];

/** "0.2 mi" / "3.2 km" -> 0.2 / 3.2, for weighting the university's approximate position. */
function parseDistanceValue(distance: string | null): number | undefined {
  if (!distance) return undefined;
  const n = parseFloat(distance);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Amber reports distance-to the university per property, not the
 * university's own coordinates, so its map marker is an approximation: the
 * centroid of every mapped property, weighted more toward properties Amber
 * says are closer. Computed from the full unfiltered list so the marker
 * doesn't jump around as the status filter changes.
 */
function estimateUniversityLocation(
  university: string,
  listings: CountryListingRow[],
): UniversityMapPoint | null {
  const withCoords = listings.filter((l) => l.lat != null && l.lng != null);
  if (withCoords.length === 0) return null;

  let sumLat = 0;
  let sumLng = 0;
  let sumWeight = 0;
  for (const l of withCoords) {
    const distance = parseDistanceValue(l.universityDistance);
    const weight = distance != null && distance > 0 ? 1 / distance : 1;
    sumLat += l.lat! * weight;
    sumLng += l.lng! * weight;
    sumWeight += weight;
  }

  return { label: university, lat: sumLat / sumWeight, lng: sumLng / sumWeight };
}

export function UniversityInventoryClient({
  university,
  listings,
}: {
  university: string;
  listings: CountryListingRow[];
}) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortKey>("price-asc");

  const filtered = useMemo(() => {
    const base = statusFilter === "all" ? listings : listings.filter((l) => l.status === statusFilter);
    return [...base].sort((a, b) => {
      const pa = a.price ?? Number.POSITIVE_INFINITY;
      const pb = b.price ?? Number.POSITIVE_INFINITY;
      return sortBy === "price-asc" ? pa - pb : pb - pa;
    });
  }, [listings, statusFilter, sortBy]);

  const mapPoints: PropertyMapPoint[] = useMemo(
    () =>
      filtered
        .filter((l) => l.lat != null && l.lng != null)
        .map((l) => ({
          id: l.listingId,
          label: l.propertyName,
          lat: l.lat!,
          lng: l.lng!,
          status: l.status,
          price: l.price,
          currency: l.currency,
        })),
    [filtered],
  );

  const universityMarker = useMemo(
    () => estimateUniversityLocation(university, listings),
    [university, listings],
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-ink-200 bg-white p-4">
        <div className="flex rounded-lg border border-ink-200 p-0.5">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === opt.value
                  ? "bg-ink-900 text-white"
                  : "text-ink-600 hover:bg-ink-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className="rounded-lg border border-ink-200 px-3 py-2 text-xs outline-none focus:border-brand-400"
        >
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
        <span className="ml-auto text-xs font-medium text-ink-500">
          {filtered.length.toLocaleString()} of {listings.length.toLocaleString()} properties
        </span>
      </div>

      {mapPoints.length > 0 && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-ink-800 bg-ink-900 shadow-xl shadow-ink-900/20">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <div>
              <h2 className="text-sm font-semibold text-white">{university} inventory map</h2>
              <p className="mt-0.5 text-xs text-ink-400">
                🎓 University (approximate) · <span className="text-emerald-400">●</span> Available ·{" "}
                <span className="text-ink-400">●</span> Sold out
              </p>
            </div>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-ink-200">
              {mapPoints.length.toLocaleString()} plotted
            </span>
          </div>
          <div className="h-[440px]">
            <PropertyMapLoader points={mapPoints} university={universityMarker} />
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
          <p className="text-sm font-medium text-ink-900">No properties match this filter</p>
          <p className="mt-1 text-sm text-ink-500">Try switching back to &ldquo;All&rdquo;.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-200 bg-ink-50/60 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Distance</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.listingId} className="border-b border-ink-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-ink-900">
                    {l.detailsUrl ? (
                      <a
                        href={l.detailsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-brand-600 hover:underline"
                      >
                        {l.propertyName}
                      </a>
                    ) : (
                      l.propertyName
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-600">{l.universityDistance ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-600">
                    {l.price != null ? `${l.currency ?? ""} ${l.price}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        l.status === "available"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-ink-100 text-ink-500"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          l.status === "available" ? "bg-emerald-500" : "bg-ink-400"
                        }`}
                      />
                      {l.status === "available" ? "Available" : "Sold"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

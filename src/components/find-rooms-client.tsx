"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { RoomCard, RoomCardSkeleton } from "@/components/room-card";
import { getAvailableCities, getAvailableRoomTypes, searchAmberListings } from "@/lib/amber";
import type { AmberDataSource, AmberListing, AmberSearchFilters } from "@/lib/types";

const MAX_PRICE_CEILING = 2000;

export function FindRoomsClient() {
  const [listings, setListings] = useState<AmberListing[]>([]);
  const [source, setSource] = useState<AmberDataSource>("mock");
  const [apiError, setApiError] = useState<string | undefined>(undefined);
  const [loading, startSearch] = useTransition();

  const [filterOptions, setFilterOptions] = useState({
    cities: getAvailableCities(),
    roomTypes: getAvailableRoomTypes(),
  });

  const [query, setQuery] = useState("");
  const [city, setCity] = useState<string>("Any");
  const [roomType, setRoomType] = useState<string>("Any");
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE_CEILING);
  const [sortBy, setSortBy] = useState<AmberSearchFilters["sortBy"]>("recommended");

  const filters: AmberSearchFilters = useMemo(
    () => ({
      query: query.trim() || undefined,
      city: city === "Any" ? undefined : city,
      roomType: roomType === "Any" ? undefined : roomType,
      maxPrice: maxPrice < MAX_PRICE_CEILING ? maxPrice : undefined,
      sortBy,
    }),
    [query, city, roomType, maxPrice, sortBy],
  );

  // One unfiltered baseline fetch to discover which cities/room types the
  // connected inventory actually has (falls back to the mock list until then).
  useEffect(() => {
    let cancelled = false;
    searchAmberListings({}).then((result) => {
      if (cancelled || result.listings.length === 0) return;
      setFilterOptions({
        cities: Array.from(new Set(result.listings.map((l) => l.city))).sort(),
        roomTypes: Array.from(new Set(result.listings.map((l) => l.roomType))).sort(),
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    startSearch(async () => {
      const result = await searchAmberListings(filters);
      if (!cancelled) {
        setListings(result.listings);
        setSource(result.source);
        setApiError(result.error);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [filters, startSearch]);

  const cityOptions = ["Any", ...filterOptions.cities];
  const roomTypeOptions = ["Any", ...filterOptions.roomTypes];

  return (
    <main className="flex-1 bg-ink-50/40">
      {/* Page header */}
      <section className="border-b border-ink-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
                Find Rooms
              </h1>
              <p className="mt-1 text-sm text-ink-500">
                Search verified student accommodation sourced from Amber and
                partner operators.
              </p>
            </div>
            {source === "mock" && (
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                {apiError
                  ? `Amber API unavailable (${apiError}) — showing sample inventory`
                  : "Showing sample inventory — connect the Amber API to go live"}
              </span>
            )}
          </div>

          <div className="mt-6">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by city, university, or property name…"
              className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm outline-none transition placeholder:text-ink-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          {/* Filters sidebar */}
          <aside className="h-fit rounded-2xl border border-ink-200 bg-white p-5 lg:sticky lg:top-24">
            <h2 className="text-sm font-semibold text-ink-900">Filters</h2>

            <div className="mt-5">
              <label className="text-xs font-medium text-ink-600">
                City
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              >
                {cityOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5">
              <label className="text-xs font-medium text-ink-600">
                Room type
              </label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              >
                {roomTypeOptions.map((rt) => (
                  <option key={rt} value={rt}>
                    {rt}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-ink-600">
                  Max price
                </label>
                <span className="text-xs font-semibold text-ink-900">
                  {maxPrice >= MAX_PRICE_CEILING ? "No limit" : maxPrice}
                </span>
              </div>
              <input
                type="range"
                min={100}
                max={MAX_PRICE_CEILING}
                step={50}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="mt-2 w-full accent-brand-600"
              />
              <p className="mt-1 text-xs text-ink-400">
                Compares listed price directly — weekly and monthly rates vary by property.
              </p>
            </div>

            <div className="mt-5">
              <label className="text-xs font-medium text-ink-600">
                Sort by
              </label>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as AmberSearchFilters["sortBy"])
                }
                className="mt-1.5 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              >
                <option value="recommended">Recommended</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="rating-desc">Highest rated</option>
              </select>
            </div>

            <button
              onClick={() => {
                setQuery("");
                setCity("Any");
                setRoomType("Any");
                setMaxPrice(MAX_PRICE_CEILING);
                setSortBy("recommended");
              }}
              className="mt-6 w-full rounded-lg border border-ink-200 py-2 text-xs font-semibold text-ink-600 transition hover:bg-ink-50"
            >
              Reset filters
            </button>
          </aside>

          {/* Results */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-ink-500">
                {loading ? "Searching…" : `${listings.length} rooms found`}
              </p>
            </div>

            {loading ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <RoomCardSkeleton key={i} />
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
                <p className="text-sm font-medium text-ink-900">
                  No rooms match these filters
                </p>
                <p className="mt-1 text-sm text-ink-500">
                  Try widening your budget or clearing a filter.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {listings.map((listing) => (
                  <RoomCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

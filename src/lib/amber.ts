import { getMockCities, getMockRoomTypes } from "./amber-mock";
import type { AmberListing, AmberSearchFilters, AmberSearchResult } from "./types";

/**
 * Client-side entry point for Find Rooms. Always calls our own
 * `/api/amber/inventories` route (never the Amber API directly) so the
 * partner UUID stays server-side and requests can be cached/rate-limited
 * in one place — see src/app/api/amber/inventories/route.ts.
 *
 * Amber's API only supports filtering by `location_place_name` and
 * pagination; room type, price band, free-text search, and sorting are
 * applied here on the returned page of results.
 */

function matchesClientFilters(listing: AmberListing, filters: AmberSearchFilters): boolean {
  if (filters.query) {
    const q = filters.query.toLowerCase();
    const haystack = `${listing.propertyName} ${listing.city} ${listing.university ?? ""}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  if (filters.roomType && filters.roomType !== "Any" && listing.roomType !== filters.roomType) {
    return false;
  }
  if (filters.minPrice != null && listing.price < filters.minPrice) return false;
  if (filters.maxPrice != null && listing.price > filters.maxPrice) return false;
  return true;
}

function sortListings(listings: AmberListing[], sortBy: AmberSearchFilters["sortBy"]) {
  const sorted = [...listings];
  switch (sortBy) {
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "rating-desc":
      return sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    default:
      return sorted.sort(
        (a, b) => Number(b.instantBook) - Number(a.instantBook) || (b.rating ?? 0) - (a.rating ?? 0),
      );
  }
}

export async function searchAmberListings(
  filters: AmberSearchFilters = {},
): Promise<AmberSearchResult> {
  const params = new URLSearchParams();
  params.set("limit", "50");
  params.set("p", "1");
  if (filters.city && filters.city !== "Any") {
    params.set("location_place_name", filters.city);
  }

  const res = await fetch(`/api/amber/inventories?${params.toString()}`);
  const body = (await res.json()) as AmberSearchResult;

  const filtered = body.listings.filter((listing) => matchesClientFilters(listing, filters));
  return { ...body, listings: sortListings(filtered, filters.sortBy ?? "recommended") };
}

export function getAvailableCities(): string[] {
  return getMockCities();
}

export function getAvailableRoomTypes(): string[] {
  return getMockRoomTypes();
}

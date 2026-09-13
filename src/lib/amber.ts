import type { AmberListing, AmberSearchFilters } from "./types";

/**
 * Amber inventory service.
 *
 * This module is the single seam between the UI and the Amber Student
 * inventory API. Until the real API key/endpoint is available, it returns
 * realistic mock data shaped like Amber's listing payload so the Find Rooms
 * UI, filters, and sorting can be built and tested end-to-end.
 *
 * To go live:
 *   1. Set AMBER_API_BASE_URL and AMBER_API_KEY in the environment.
 *   2. Replace the body of `searchAmberListings` with a `fetch` call against
 *      the real endpoint, mapping the response into `AmberListing[]`.
 *   3. Everything downstream (RoomCard, filters, sorting) already consumes
 *      the `AmberListing` shape and requires no further changes.
 */

const MOCK_LISTINGS: AmberListing[] = [
  {
    id: "amb-10231",
    propertyName: "Stratford One",
    operator: "Amber Student Living",
    city: "London",
    country: "United Kingdom",
    university: "University College London",
    distanceFromUniversityKm: 3.2,
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1200&auto=format&fit=crop",
    ],
    roomType: "Studio",
    pricePerWeek: 365,
    currency: "GBP",
    billsPolicy: "All bills included",
    amenities: ["Gym", "24/7 Security", "High-speed Wi-Fi", "Study Room"],
    rating: 4.7,
    reviewsCount: 214,
    availableFrom: "2026-09-01",
    genderPreference: "Any",
    verified: true,
    instantBook: true,
  },
  {
    id: "amb-10456",
    propertyName: "Vita Student Manchester",
    operator: "Vita Student",
    city: "Manchester",
    country: "United Kingdom",
    university: "University of Manchester",
    distanceFromUniversityKm: 1.1,
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=1200&auto=format&fit=crop",
    ],
    roomType: "Ensuite",
    pricePerWeek: 245,
    currency: "GBP",
    billsPolicy: "All bills included",
    amenities: ["Cinema Room", "Gym", "Laundry", "On-site Staff"],
    rating: 4.5,
    reviewsCount: 178,
    availableFrom: "2026-09-08",
    genderPreference: "Any",
    verified: true,
    instantBook: false,
  },
  {
    id: "amb-10789",
    propertyName: "Urbanest King's Cross",
    operator: "Urbanest",
    city: "London",
    country: "United Kingdom",
    university: "King's College London",
    distanceFromUniversityKm: 4.6,
    images: [
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=1200&auto=format&fit=crop",
    ],
    roomType: "Private Room",
    pricePerWeek: 298,
    currency: "GBP",
    billsPolicy: "All bills included",
    amenities: ["Rooftop Terrace", "Study Room", "Bike Storage"],
    rating: 4.3,
    reviewsCount: 132,
    availableFrom: "2026-08-25",
    genderPreference: "Female Only",
    verified: true,
    instantBook: true,
  },
  {
    id: "amb-11002",
    propertyName: "Iglu Birmingham Central",
    operator: "Iglu Student",
    city: "Birmingham",
    country: "United Kingdom",
    university: "University of Birmingham",
    distanceFromUniversityKm: 2.4,
    images: [
      "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1522771930-78848d9293e8?q=80&w=1200&auto=format&fit=crop",
    ],
    roomType: "Shared Room",
    pricePerWeek: 165,
    currency: "GBP",
    billsPolicy: "Partial bills included",
    amenities: ["Games Room", "Laundry", "Common Kitchen"],
    rating: 4.1,
    reviewsCount: 96,
    availableFrom: "2026-09-15",
    genderPreference: "Any",
    verified: true,
    instantBook: false,
  },
  {
    id: "amb-11215",
    propertyName: "Scape Melbourne Central",
    operator: "Scape",
    city: "Melbourne",
    country: "Australia",
    university: "University of Melbourne",
    distanceFromUniversityKm: 0.8,
    images: [
      "https://images.unsplash.com/photo-1502672023488-70e25813eb80?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1200&auto=format&fit=crop",
    ],
    roomType: "Studio",
    pricePerWeek: 420,
    currency: "AUD",
    billsPolicy: "All bills included",
    amenities: ["Pool", "Gym", "Co-working Lounge", "24/7 Security"],
    rating: 4.8,
    reviewsCount: 301,
    availableFrom: "2026-07-14",
    genderPreference: "Any",
    verified: true,
    instantBook: true,
  },
  {
    id: "amb-11340",
    propertyName: "The Standard Toronto",
    operator: "The Standard",
    city: "Toronto",
    country: "Canada",
    university: "University of Toronto",
    distanceFromUniversityKm: 1.9,
    images: [
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1484101403633-562f891dc89a?q=80&w=1200&auto=format&fit=crop",
    ],
    roomType: "Ensuite",
    pricePerWeek: 310,
    currency: "CAD",
    billsPolicy: "All bills included",
    amenities: ["Rooftop Terrace", "Gym", "Study Pods"],
    rating: 4.4,
    reviewsCount: 121,
    availableFrom: "2026-08-30",
    genderPreference: "Male Only",
    verified: true,
    instantBook: false,
  },
  {
    id: "amb-11482",
    propertyName: "Base Berlin Mitte",
    operator: "Base Living",
    city: "Berlin",
    country: "Germany",
    university: "Humboldt University of Berlin",
    distanceFromUniversityKm: 2.7,
    images: [
      "https://images.unsplash.com/photo-1560184897-ae75f418493e?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1567016432779-094069958ea5?q=80&w=1200&auto=format&fit=crop",
    ],
    roomType: "Twin Room",
    pricePerWeek: 190,
    currency: "EUR",
    billsPolicy: "Bills excluded",
    amenities: ["Bike Storage", "Common Kitchen", "Laundry"],
    rating: 4.0,
    reviewsCount: 74,
    availableFrom: "2026-09-20",
    genderPreference: "Any",
    verified: false,
    instantBook: false,
  },
  {
    id: "amb-11599",
    propertyName: "Yugo Leeds Sky Plaza",
    operator: "Yugo",
    city: "Leeds",
    country: "United Kingdom",
    university: "University of Leeds",
    distanceFromUniversityKm: 1.4,
    images: [
      "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=1200&auto=format&fit=crop",
    ],
    roomType: "Private Room",
    pricePerWeek: 210,
    currency: "GBP",
    billsPolicy: "All bills included",
    amenities: ["Sky Lounge", "Gym", "Cinema Room", "Study Room"],
    rating: 4.6,
    reviewsCount: 158,
    availableFrom: "2026-09-05",
    genderPreference: "Any",
    verified: true,
    instantBook: true,
  },
];

function matchesFilters(listing: AmberListing, filters: AmberSearchFilters): boolean {
  if (filters.query) {
    const q = filters.query.toLowerCase();
    const haystack =
      `${listing.propertyName} ${listing.city} ${listing.university} ${listing.country}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  if (filters.city && filters.city !== "Any" && listing.city !== filters.city) {
    return false;
  }
  if (filters.roomType && filters.roomType !== "Any" && listing.roomType !== filters.roomType) {
    return false;
  }
  if (filters.minPrice != null && listing.pricePerWeek < filters.minPrice) {
    return false;
  }
  if (filters.maxPrice != null && listing.pricePerWeek > filters.maxPrice) {
    return false;
  }
  return true;
}

function sortListings(listings: AmberListing[], sortBy: AmberSearchFilters["sortBy"]) {
  const sorted = [...listings];
  switch (sortBy) {
    case "price-asc":
      return sorted.sort((a, b) => a.pricePerWeek - b.pricePerWeek);
    case "price-desc":
      return sorted.sort((a, b) => b.pricePerWeek - a.pricePerWeek);
    case "rating-desc":
      return sorted.sort((a, b) => b.rating - a.rating);
    default:
      return sorted.sort((a, b) => Number(b.instantBook) - Number(a.instantBook) || b.rating - a.rating);
  }
}

/**
 * Simulates an Amber inventory search call. Swap this implementation for a
 * real `fetch(process.env.AMBER_API_BASE_URL + "/listings", ...)` once
 * credentials are available — the function signature and return type can
 * stay the same.
 */
export async function searchAmberListings(
  filters: AmberSearchFilters = {},
): Promise<AmberListing[]> {
  await new Promise((resolve) => setTimeout(resolve, 450));
  const filtered = MOCK_LISTINGS.filter((listing) => matchesFilters(listing, filters));
  return sortListings(filtered, filters.sortBy ?? "recommended");
}

export function getAvailableCities(): string[] {
  return Array.from(new Set(MOCK_LISTINGS.map((l) => l.city))).sort();
}

export function getAvailableRoomTypes(): AmberListing["roomType"][] {
  return Array.from(new Set(MOCK_LISTINGS.map((l) => l.roomType)));
}

export const AMBER_INVENTORY_IS_LIVE = false;

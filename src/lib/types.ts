export type BillsPolicy = "All bills included" | "Bills excluded" | "Partial bills included";

export type PriceDuration = "weekly" | "monthly" | "daily";

/**
 * Normalized shape the UI (RoomCard, filters, sorting) consumes — regardless
 * of whether it came from the real Amber API or the local mock fallback.
 * Amber's raw inventory payload doesn't guarantee every field (e.g. no
 * rating/reviews, no university), so most descriptive fields are optional.
 */
export interface AmberListing {
  id: string;
  propertyName: string;
  city: string;
  country?: string;
  /** Nearest university/college Amber reports for this property, e.g. "Southern Methodist University". */
  university?: string;
  /** Raw distance string as Amber reports it (unit varies by region, e.g. "5.9 mi" or "3.2 km"). */
  universityDistance?: string;
  images: string[];
  roomType: string;
  price: number;
  currency: string;
  priceDuration: PriceDuration;
  billsPolicy?: BillsPolicy;
  amenities: string[];
  rating?: number;
  reviewsCount?: number;
  availableFrom?: string;
  genderPreference?: "Any" | "Male Only" | "Female Only";
  verified: boolean;
  instantBook: boolean;
  detailsUrl?: string;
}

export interface AmberSearchFilters {
  query?: string;
  city?: string;
  roomType?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "recommended" | "price-asc" | "price-desc" | "rating-desc";
}

export type AmberDataSource = "amber" | "mock";

export interface AmberSearchResult {
  listings: AmberListing[];
  source: AmberDataSource;
  error?: string;
}

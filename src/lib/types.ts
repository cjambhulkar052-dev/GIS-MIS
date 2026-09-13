export type RoomType =
  | "Studio"
  | "Private Room"
  | "Shared Room"
  | "Ensuite"
  | "Twin Room";

export type BillsPolicy = "All bills included" | "Bills excluded" | "Partial bills included";

export interface AmberListing {
  id: string;
  propertyName: string;
  operator: string;
  city: string;
  country: string;
  university: string;
  distanceFromUniversityKm: number;
  images: string[];
  roomType: RoomType;
  pricePerWeek: number;
  currency: string;
  billsPolicy: BillsPolicy;
  amenities: string[];
  rating: number;
  reviewsCount: number;
  availableFrom: string;
  genderPreference: "Any" | "Male Only" | "Female Only";
  verified: boolean;
  instantBook: boolean;
}

export interface AmberSearchFilters {
  query?: string;
  city?: string;
  roomType?: RoomType | "Any";
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "recommended" | "price-asc" | "price-desc" | "rating-desc";
}

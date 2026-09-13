import type { AmberApiInventory } from "./amber-api-types";
import type { AmberListing, BillsPolicy, PriceDuration } from "./types";

const ROOM_TYPE_LABELS: Record<string, string> = {
  studio: "Studio",
  entire_place: "Entire Place",
  private_room: "Private Room",
  shared_room: "Shared Room",
  private_kitchen: "Private Kitchen",
  private_bathroom: "Private Bathroom",
  shared_kitchen: "Shared Kitchen",
  shared_bathroom: "Shared Bathroom",
  student_accommodation: "Student Accommodation",
  "1b": "1 Bedroom",
  "2b": "2 Bedroom",
  "3b": "3 Bedroom",
};

function toRoomTypeLabel(raw?: string): string {
  if (!raw) return "Room";
  return ROOM_TYPE_LABELS[raw] ?? raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function pickPrimaryRoomType(inv: AmberApiInventory): string {
  const candidates = inv.meta?.unit_types?.filter((t) => t !== "student_accommodation");
  if (candidates && candidates.length > 0) return toRoomTypeLabel(candidates[0]);
  if (inv.meta?.unit_type) return toRoomTypeLabel(inv.meta.unit_type);
  return "Room";
}

/**
 * Prefers Amber's structured `location.locality`/`location.country`; falls
 * back to parsing "Property Name, City" (older/sample payload shape) when
 * the rich location object isn't present.
 */
function deriveLocation(inv: AmberApiInventory): { city: string; country?: string } {
  const locality = inv.location?.locality?.long_name;
  const country = inv.location?.country?.long_name;
  if (locality) return { city: locality, country };

  const parts = inv.name.split(",");
  if (parts.length > 1) return { city: parts[parts.length - 1].trim(), country };
  return { city: inv.location_name ?? "Unknown", country };
}

/**
 * Prefers the coordinates nested under `location` (matches `deriveLocation`);
 * falls back to the legacy top-level field. Not every Amber listing carries
 * coordinates, so callers must handle `undefined`.
 */
function deriveCoordinates(inv: AmberApiInventory): { lat: number; lng: number } | undefined {
  const coords = inv.location?.location_coordinates ?? inv.location_coordinates;
  if (!coords || typeof coords.lat !== "number" || typeof coords.lng !== "number") return undefined;
  return coords;
}

/** Amber dates arrive as dd-mm-yyyy; normalize to ISO (yyyy-mm-dd) for <input type=date> / Date parsing. */
function toIsoDate(ddmmyyyy?: string): string | undefined {
  if (!ddmmyyyy) return undefined;
  const match = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(ddmmyyyy.trim());
  if (!match) return undefined;
  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

const CURRENCY_CODES: Record<string, string> = {
  dollar: "USD",
  pound: "GBP",
  euro: "EUR",
  rupee: "INR",
  cad: "CAD",
  aud: "AUD",
};

function toCurrencyCode(raw: string): string {
  const key = raw.trim().toLowerCase();
  return CURRENCY_CODES[key] ?? raw.toUpperCase();
}

function derivePriceDuration(raw?: string): PriceDuration {
  if (raw === "weekly" || raw === "daily") return raw;
  return "monthly";
}

function deriveBillsPolicy(inv: AmberApiInventory): BillsPolicy | undefined {
  const billsFeature = inv.features?.find((f) => f.type === "bills_included");
  if (!billsFeature) return undefined;
  return billsFeature.values.length > 0 ? "All bills included" : "Bills excluded";
}

/**
 * Feature group `type`s vary a lot by property/vendor (parking,
 * fitness_and_recreation, security, ...) so amenities are every feature
 * value except the "bills_included" group, which is surfaced separately.
 */
function deriveAmenities(inv: AmberApiInventory): string[] {
  const names =
    inv.features
      ?.filter((f) => f.type !== "bills_included")
      .flatMap((f) => f.values.map((v) => v.name.trim()))
      .filter(Boolean) ?? [];
  return Array.from(new Set(names));
}

function deriveRating(inv: AmberApiInventory): number | undefined {
  const scores = inv.meta?.review_summary?.rating;
  if (!scores) return undefined;
  const values = Object.values(scores).filter((v) => typeof v === "number");
  if (values.length === 0) return undefined;
  return Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 10) / 10;
}

/** Nearest non-"city center" place Amber lists (often a university/college). */
function deriveNearestPlace(inv: AmberApiInventory): { place: string; distance: string } | undefined {
  const distances = inv.meta?.distances?.filter((d) => d.place.toLowerCase() !== "city center");
  if (!distances || distances.length === 0) return undefined;
  const parseMiles = (d: string) => parseFloat(d) || Number.POSITIVE_INFINITY;
  return [...distances].sort((a, b) => parseMiles(a.distance) - parseMiles(b.distance))[0];
}

function deriveImages(inv: AmberApiInventory): string[] {
  const fromArray = (inv.images ?? []).map((img) => img.base_path || img.path).filter(Boolean);
  if (fromArray.length > 0) return fromArray;
  return inv.image_featured_link ? [inv.image_featured_link] : [];
}

/**
 * Normalizes one raw Amber inventory (a property, possibly with nested
 * room-level `children`) into the flat shape the UI renders. Returns null
 * for records missing the minimum data needed to display a card.
 */
export function mapAmberInventory(inv: AmberApiInventory): AmberListing | null {
  const price = inv.pricing?.min_price ?? inv.pricing?.price ?? inv.pricing?.min_available_price;
  const currency = inv.pricing?.currency;
  if (!inv.name || price == null || !currency) return null;

  const { city, country } = deriveLocation(inv);
  const coordinates = deriveCoordinates(inv);
  const nearestPlace = deriveNearestPlace(inv);

  return {
    id: `amber-${inv.id}`,
    propertyName: inv.name,
    city,
    country,
    lat: coordinates?.lat,
    lng: coordinates?.lng,
    university: nearestPlace?.place,
    universityDistance: nearestPlace?.distance,
    images: deriveImages(inv),
    roomType: pickPrimaryRoomType(inv),
    price,
    currency: toCurrencyCode(currency),
    priceDuration: derivePriceDuration(inv.pricing?.duration),
    billsPolicy: deriveBillsPolicy(inv),
    amenities: deriveAmenities(inv),
    rating: deriveRating(inv),
    availableFrom: toIsoDate(inv.meta?.min_available_from ?? inv.meta?.available_from),
    verified: Boolean(inv.meta?.is_partnered),
    instantBook: Boolean(inv.meta?.payment),
    detailsUrl: inv.partner_inventory_url ?? inv.partner_link ?? inv.meta?.login_url,
  };
}

export function mapAmberInventories(inventories: AmberApiInventory[]): AmberListing[] {
  return inventories
    .map(mapAmberInventory)
    .filter((listing): listing is AmberListing => listing !== null);
}

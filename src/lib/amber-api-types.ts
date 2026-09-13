/**
 * Raw shapes returned by Amber's Partners Inventories API:
 * GET base.amberstudent.com/api/v0/leads/partners/:partner_uuid/inventories
 *
 * Only the fields we actually read are typed in detail; everything else
 * flows through as `unknown` so a change in a field we don't use doesn't
 * break the build.
 */

export interface AmberApiImage {
  path: string;
  base_path?: string;
  type?: string;
  caption?: string;
  featured?: boolean;
}

export interface AmberApiPricing {
  price?: number;
  deposit?: number;
  currency?: string;
  duration?: string;
  max_price?: number;
  min_price?: number;
  price_per_person?: boolean;
  max_available_price?: number;
  min_available_price?: number;
  available_price?: number;
}

export interface AmberApiDistance {
  place: string;
  distance: string;
}

export interface AmberApiMeta {
  types?: string[];
  unit_type?: string;
  unit_types?: string[];
  payment?: boolean;
  is_partnered?: boolean;
  max_bedroom_count?: number;
  min_bedroom_count?: number;
  bedroom_count?: number;
  max_bathroom_count?: number;
  min_bathroom_count?: number;
  bathroom_count?: number;
  max_available_from?: string;
  min_available_from?: string;
  available_from?: string;
  login_url?: string;
  distances?: AmberApiDistance[];
  review_summary?: {
    rating?: Record<string, number>;
  };
  [key: string]: unknown;
}

export interface AmberApiFeatureValue {
  name: string;
  type?: string;
}

export interface AmberApiFeature {
  name: string;
  type: string;
  values: AmberApiFeatureValue[];
}

export interface AmberApiLocationPart {
  long_name?: string;
  short_name?: string;
}

export interface AmberApiLocation {
  name?: string;
  primary?: string;
  secondary?: string;
  locality?: AmberApiLocationPart;
  country?: AmberApiLocationPart;
  state?: AmberApiLocationPart;
  location_coordinates?: { lat: number; lng: number };
  [key: string]: unknown;
}

export interface AmberApiInventory {
  id: number;
  name: string;
  canonical_name?: string;
  parent_id?: number | null;
  pricing?: AmberApiPricing;
  meta?: AmberApiMeta;
  images?: AmberApiImage[];
  features?: AmberApiFeature[];
  tags?: string[];
  available?: boolean;
  image_featured_link?: string;
  /** Legacy flat field seen in older/sample payloads; prefer `location`. */
  location_name?: string;
  location?: AmberApiLocation;
  location_coordinates?: { lat: number; lng: number } | null;
  /** Deep link to the property's Amber page, pre-tagged with this partner's UTM params. */
  partner_inventory_url?: string;
  /** Generic partner landing link, less specific than `partner_inventory_url`. */
  partner_link?: string;
  children_count?: number;
  children?: AmberApiInventory[];
  created_at?: number;
  updated_at?: number;
}

export interface AmberApiMetaPagination {
  prev: number | null;
  next: number | null;
  limit: number;
  current_page: number;
  count?: number;
  /** Windowed page-number list for pagination UI, e.g. [1,2,3,87] — last element is the final page. */
  pages?: number[];
}

export interface AmberApiResponse {
  message: string;
  data: {
    meta: AmberApiMetaPagination;
    agg?: Record<string, unknown>;
    result: AmberApiInventory[];
  };
}

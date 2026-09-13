/**
 * Amber's country names (as stored in amber_inventory_snapshots.country)
 * occasionally differ from the Natural Earth dataset's `properties.name`
 * used in public/geo/countries-50m.json — alias the ones that don't match
 * verbatim.
 */
const COUNTRY_NAME_ALIASES: Record<string, string> = {
  "United States": "United States of America",
};

/** The name to look up in the countries-50m.json feature collection for a given Amber country string. */
export function toBoundaryName(country: string): string {
  return COUNTRY_NAME_ALIASES[country] ?? country;
}

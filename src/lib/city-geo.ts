/**
 * Approximate city-center coordinates + country for the markets Amber
 * inventory tends to cover. Used only to place cities on the Insights map
 * and roll up a country count — snapshots don't store lat/lng, so this is
 * a best-effort static lookup keyed on the city name Amber reports.
 */
export interface CityGeo {
  lat: number;
  lng: number;
  country: string;
}

const CITY_GEO: Record<string, CityGeo> = {
  // United Kingdom
  london: { lat: 51.5074, lng: -0.1278, country: "United Kingdom" },
  manchester: { lat: 53.4808, lng: -2.2426, country: "United Kingdom" },
  birmingham: { lat: 52.4862, lng: -1.8904, country: "United Kingdom" },
  leeds: { lat: 53.8008, lng: -1.5491, country: "United Kingdom" },
  liverpool: { lat: 53.4084, lng: -2.9916, country: "United Kingdom" },
  sheffield: { lat: 53.3811, lng: -1.4701, country: "United Kingdom" },
  bristol: { lat: 51.4545, lng: -2.5879, country: "United Kingdom" },
  glasgow: { lat: 55.8642, lng: -4.2518, country: "United Kingdom" },
  edinburgh: { lat: 55.9533, lng: -3.1883, country: "United Kingdom" },
  nottingham: { lat: 52.9548, lng: -1.1581, country: "United Kingdom" },
  coventry: { lat: 52.4068, lng: -1.5197, country: "United Kingdom" },
  leicester: { lat: 52.6369, lng: -1.1398, country: "United Kingdom" },
  newcastle: { lat: 54.9783, lng: -1.6178, country: "United Kingdom" },
  cardiff: { lat: 51.4816, lng: -3.1791, country: "United Kingdom" },
  southampton: { lat: 50.9097, lng: -1.4044, country: "United Kingdom" },
  oxford: { lat: 51.752, lng: -1.2577, country: "United Kingdom" },
  cambridge: { lat: 52.2053, lng: 0.1218, country: "United Kingdom" },
  reading: { lat: 51.4543, lng: -0.9781, country: "United Kingdom" },
  bath: { lat: 51.3811, lng: -2.359, country: "United Kingdom" },
  exeter: { lat: 50.7184, lng: -3.5339, country: "United Kingdom" },
  loughborough: { lat: 52.7721, lng: -1.2062, country: "United Kingdom" },
  preston: { lat: 53.7632, lng: -2.7031, country: "United Kingdom" },
  portsmouth: { lat: 50.8198, lng: -1.088, country: "United Kingdom" },
  brighton: { lat: 50.8225, lng: -0.1372, country: "United Kingdom" },
  canterbury: { lat: 51.2802, lng: 1.0789, country: "United Kingdom" },
  norwich: { lat: 52.6309, lng: 1.2974, country: "United Kingdom" },
  plymouth: { lat: 50.3755, lng: -4.1427, country: "United Kingdom" },
  swansea: { lat: 51.6214, lng: -3.9436, country: "United Kingdom" },
  wolverhampton: { lat: 52.5862, lng: -2.1284, country: "United Kingdom" },
  york: { lat: 53.96, lng: -1.0873, country: "United Kingdom" },
  dundee: { lat: 56.462, lng: -2.9707, country: "United Kingdom" },
  aberdeen: { lat: 57.1497, lng: -2.0943, country: "United Kingdom" },
  belfast: { lat: 54.5973, lng: -5.9301, country: "United Kingdom" },
  hull: { lat: 53.7457, lng: -0.3367, country: "United Kingdom" },
  huddersfield: { lat: 53.6458, lng: -1.785, country: "United Kingdom" },
  lancaster: { lat: 54.0466, lng: -2.8007, country: "United Kingdom" },
  middlesbrough: { lat: 54.5742, lng: -1.235, country: "United Kingdom" },
  "stoke-on-trent": { lat: 53.0027, lng: -2.1794, country: "United Kingdom" },
  sunderland: { lat: 54.9069, lng: -1.3838, country: "United Kingdom" },
  derby: { lat: 52.9225, lng: -1.4746, country: "United Kingdom" },

  // Ireland
  dublin: { lat: 53.3498, lng: -6.2603, country: "Ireland" },
  cork: { lat: 51.8985, lng: -8.4756, country: "Ireland" },
  galway: { lat: 53.2707, lng: -9.0568, country: "Ireland" },
  limerick: { lat: 52.6638, lng: -8.6267, country: "Ireland" },

  // Europe
  paris: { lat: 48.8566, lng: 2.3522, country: "France" },
  berlin: { lat: 52.52, lng: 13.405, country: "Germany" },
  munich: { lat: 48.1351, lng: 11.582, country: "Germany" },
  madrid: { lat: 40.4168, lng: -3.7038, country: "Spain" },
  barcelona: { lat: 41.3874, lng: 2.1686, country: "Spain" },
  milan: { lat: 45.4642, lng: 9.19, country: "Italy" },
  rome: { lat: 41.9028, lng: 12.4964, country: "Italy" },
  amsterdam: { lat: 52.3676, lng: 4.9041, country: "Netherlands" },
  vienna: { lat: 48.2082, lng: 16.3738, country: "Austria" },
  warsaw: { lat: 52.2297, lng: 21.0122, country: "Poland" },
  prague: { lat: 50.0755, lng: 14.4378, country: "Czech Republic" },
  budapest: { lat: 47.4979, lng: 19.0402, country: "Hungary" },
  lisbon: { lat: 38.7223, lng: -9.1393, country: "Portugal" },
  athens: { lat: 37.9838, lng: 23.7275, country: "Greece" },
  zurich: { lat: 47.3769, lng: 8.5417, country: "Switzerland" },

  // North America
  "new york": { lat: 40.7128, lng: -74.006, country: "United States" },
  boston: { lat: 42.3601, lng: -71.0589, country: "United States" },
  chicago: { lat: 41.8781, lng: -87.6298, country: "United States" },
  "los angeles": { lat: 34.0522, lng: -118.2437, country: "United States" },
  "san francisco": { lat: 37.7749, lng: -122.4194, country: "United States" },
  toronto: { lat: 43.6532, lng: -79.3832, country: "Canada" },
  vancouver: { lat: 49.2827, lng: -123.1207, country: "Canada" },
  montreal: { lat: 45.5019, lng: -73.5674, country: "Canada" },
  ottawa: { lat: 45.4215, lng: -75.6972, country: "Canada" },

  // Oceania
  melbourne: { lat: -37.8136, lng: 144.9631, country: "Australia" },
  sydney: { lat: -33.8688, lng: 151.2093, country: "Australia" },
  brisbane: { lat: -27.4698, lng: 153.0251, country: "Australia" },
  perth: { lat: -31.9505, lng: 115.8605, country: "Australia" },
  adelaide: { lat: -34.9285, lng: 138.6007, country: "Australia" },
  canberra: { lat: -35.2809, lng: 149.13, country: "Australia" },
  auckland: { lat: -36.8485, lng: 174.7633, country: "New Zealand" },
  wellington: { lat: -41.2865, lng: 174.7762, country: "New Zealand" },

  // Asia / Middle East
  singapore: { lat: 1.3521, lng: 103.8198, country: "Singapore" },
  "kuala lumpur": { lat: 3.139, lng: 101.6869, country: "Malaysia" },
  "hong kong": { lat: 22.3193, lng: 114.1694, country: "Hong Kong" },
  dubai: { lat: 25.2048, lng: 55.2708, country: "United Arab Emirates" },
  doha: { lat: 25.2854, lng: 51.531, country: "Qatar" },
};

/** Case/whitespace-insensitive lookup against the static city registry. */
export function getCityGeo(cityRaw: string | null | undefined): CityGeo | undefined {
  if (!cityRaw) return undefined;
  return CITY_GEO[cityRaw.trim().toLowerCase()];
}

"use client";

import { useMemo } from "react";
import { EntitySearch } from "./entity-search";

export interface CitySearchEntry {
  city: string;
  country: string;
}

/** Text box that jumps straight to a city's Insights drill-down page — an autocompleting shortcut past Countries -> Cities. */
export function CitySearch({ id, cities }: { id?: string; cities: CitySearchEntry[] }) {
  const entries = useMemo(
    () =>
      cities.map((c) => ({
        key: `${c.city}|${c.country}`,
        label: c.city,
        sublabel: c.country,
        href: `/insights/country/${encodeURIComponent(c.country)}/city/${encodeURIComponent(c.city)}`,
      })),
    [cities],
  );

  return (
    <EntitySearch
      id={id}
      placeholder="Jump to a city… e.g. New York"
      entries={entries}
      icon="📍"
      noMatchLabel="city"
    />
  );
}

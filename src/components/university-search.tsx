"use client";

import { useMemo } from "react";
import { EntitySearch } from "./entity-search";

export interface UniversitySearchEntry {
  university: string;
  city: string;
  country: string;
}

/** Text box that jumps straight to a university's Insights drill-down page — an autocompleting shortcut past Countries -> Cities -> Universities. */
export function UniversitySearch({
  id,
  universities,
}: {
  id?: string;
  universities: UniversitySearchEntry[];
}) {
  const entries = useMemo(
    () =>
      universities.map((u) => ({
        key: `${u.university}|${u.city}|${u.country}`,
        label: u.university,
        sublabel: `${u.city}, ${u.country}`,
        href: `/insights/country/${encodeURIComponent(u.country)}/city/${encodeURIComponent(u.city)}/university/${encodeURIComponent(u.university)}`,
      })),
    [universities],
  );

  return (
    <EntitySearch
      id={id}
      placeholder="Jump to a university… e.g. Brooklyn Law School"
      entries={entries}
      icon="🎓"
      noMatchLabel="university"
    />
  );
}

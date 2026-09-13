"use client";

import dynamic from "next/dynamic";
import type { PropertyMapPoint, UniversityMapPoint } from "./property-map";

// Leaflet touches `window` at import time, which breaks Next's server-side
// render pass. `ssr: false` is only valid from inside a Client Component
// (see node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md), so this
// tiny wrapper exists purely so the (server) country page can render a map
// without importing Leaflet itself.
const PropertyMap = dynamic(() => import("./property-map").then((m) => m.PropertyMap), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-ink-800" />,
});

export function PropertyMapLoader({
  points,
  university,
  highlightCountry,
}: {
  points: PropertyMapPoint[];
  university?: UniversityMapPoint | null;
  highlightCountry?: string | null;
}) {
  return <PropertyMap points={points} university={university} highlightCountry={highlightCountry} />;
}

export type { PropertyMapPoint, UniversityMapPoint };

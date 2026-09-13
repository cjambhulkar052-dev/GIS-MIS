"use client";

import dynamic from "next/dynamic";
import type { CityMapPoint } from "./city-map";

// Leaflet touches `window` at import time, which breaks Next's server-side
// render pass. `ssr: false` is only valid from inside a Client Component
// (see node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md), so this
// tiny wrapper exists purely so the (server) Insights page can render a map
// without importing Leaflet itself.
const CityMap = dynamic(() => import("./city-map").then((m) => m.CityMap), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-ink-800" />,
});

export function CityMapLoader({ points }: { points: CityMapPoint[] }) {
  return <CityMap points={points} />;
}

export type { CityMapPoint };

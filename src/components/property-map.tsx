"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import { feature as topojsonFeature } from "topojson-client";
import type { Feature, Geometry } from "geojson";
import { toBoundaryName } from "@/lib/country-boundaries";
import "leaflet/dist/leaflet.css";

export interface PropertyMapPoint {
  id: string;
  label: string;
  lat: number;
  lng: number;
  status: "available" | "sold";
  price?: number | null;
  currency?: string | null;
}

export interface UniversityMapPoint {
  label: string;
  lat: number;
  lng: number;
}

/** Small colored dot — avoids Leaflet's default marker image assets, which webpack/Next don't resolve out of the box. */
function dotIcon(color: string) {
  return L.divIcon({
    html: `<span style="display:block;width:22px;height:22px;border-radius:9999px;background:${color};border:3px solid white;box-shadow:0 1px 5px rgba(15,23,42,0.55)"></span>`,
    className: "",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12],
  });
}

const AVAILABLE_ICON = dotIcon("#10b981"); // emerald-500 — matches the "Available" badge elsewhere on this page
const SOLD_ICON = dotIcon("#94a3b8"); // ink-400 — matches the "Sold" badge

/** Larger, visually distinct marker for the university itself — a graduation cap badge, sized well above any property dot. */
const UNIVERSITY_ICON = L.divIcon({
  html: `<span style="display:flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:9999px;background:#4338ca;border:4px solid white;box-shadow:0 2px 8px rgba(15,23,42,0.6);font-size:20px;line-height:1">🎓</span>`,
  className: "",
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  popupAnchor: [0, -24],
});

interface CountriesTopology {
  type: "Topology";
  objects: { countries: unknown };
}

// Module-level cache: the boundaries file is ~750KB, so fetch it once per
// page load (not once per map instance — country/city/university maps
// mount and unmount as you navigate the drill-down).
let topologyPromise: Promise<CountriesTopology> | null = null;
function loadCountriesTopology(): Promise<CountriesTopology> {
  topologyPromise ??= fetch("/geo/countries-50m.json").then((r) => r.json());
  return topologyPromise;
}

/** Looks up `country`'s outline from the bundled Natural Earth boundaries file, once loaded. */
function useCountryBoundary(country?: string | null): Feature<Geometry> | null {
  const [boundary, setBoundary] = useState<Feature<Geometry> | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!country) {
      Promise.resolve().then(() => {
        if (!cancelled) setBoundary(null);
      });
      return () => {
        cancelled = true;
      };
    }
    loadCountriesTopology().then((topology) => {
      if (cancelled) return;
      const collection = topojsonFeature(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        topology as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (topology.objects as any).countries,
      ) as unknown as { features: Feature<Geometry>[] };
      const target = toBoundaryName(country);
      const match = collection.features.find((f) => f.properties?.name === target);
      setBoundary(match ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [country]);

  return boundary;
}

/**
 * Frames the map to every plotted point and the university marker (whichever
 * are present) on mount/whenever they change. Deliberately ignores the
 * country outline's own bounding box — some countries (the US, Russia, Fiji,
 * ...) have territory crossing the antimeridian, which breaks naive min/max
 * longitude math and would zoom out to nearly the whole globe. The outline
 * is drawn for context only; real property coordinates always make for a
 * sane zoom.
 */
function FitBounds({
  points,
  university,
}: {
  points: PropertyMapPoint[];
  university?: UniversityMapPoint | null;
}) {
  const map = useMap();
  useEffect(() => {
    const all: [number, number][] = points.map((p): [number, number] => [p.lat, p.lng]);
    if (university) all.push([university.lat, university.lng]);
    if (all.length === 0) return;
    if (all.length === 1) {
      map.setView(all[0], 15);
      return;
    }
    const bounds = L.latLngBounds(all);
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 16 });
  }, [points, university, map]);
  return null;
}

/**
 * Real street-level map (OpenStreetMap tiles via Leaflet) with one pin per
 * property, colored by availability. Unlike the vector world/country map
 * used elsewhere in Insights, tiles carry actual street/road detail at any
 * zoom level instead of just coastline/border outlines.
 */
export function PropertyMap({
  points,
  university,
  highlightCountry,
}: {
  points: PropertyMapPoint[];
  /** Optional larger marker for the university itself (an approximate location — Amber only reports distance-to, not coordinates-of). */
  university?: UniversityMapPoint | null;
  /** Draws this country's outline in blue, e.g. "United Kingdom" — matched against a bundled Natural Earth boundaries file. */
  highlightCountry?: string | null;
}) {
  const boundary = useCountryBoundary(highlightCountry);

  const center = useMemo<[number, number]>(() => {
    if (university) return [university.lat, university.lng];
    if (points.length === 0) return [20, 0];
    const lat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
    const lng = points.reduce((sum, p) => sum + p.lng, 0) / points.length;
    return [lat, lng];
  }, [points, university]);

  return (
    <MapContainer
      center={center}
      zoom={12}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={points} university={university} />
      {boundary && (
        <GeoJSON
          data={boundary}
          style={{ color: "#2563eb", weight: 3, fill: false }}
          interactive={false}
        />
      )}
      {university && (
        <Marker position={[university.lat, university.lng]} icon={UNIVERSITY_ICON}>
          <Popup>
            <p className="font-semibold text-ink-900">{university.label}</p>
            <p className="text-xs text-ink-500">Approximate location</p>
          </Popup>
        </Marker>
      )}
      {points.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          icon={p.status === "available" ? AVAILABLE_ICON : SOLD_ICON}
        >
          <Popup>
            <p className="font-semibold text-ink-900">{p.label}</p>
            {p.price != null && (
              <p className="text-ink-600">
                {p.currency ?? ""} {p.price}
              </p>
            )}
            <p className={p.status === "available" ? "text-emerald-600" : "text-ink-500"}>
              {p.status === "available" ? "Available" : "Sold out"}
            </p>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

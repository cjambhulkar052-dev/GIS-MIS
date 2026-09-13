"use client";

import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface CityMapPoint {
  city: string;
  country?: string;
  lat: number;
  lng: number;
  count: number;
}

/** Marker radius on a sqrt scale so a 10x count difference doesn't produce a 10x-area bubble. */
function radiusFor(count: number, maxCount: number): number {
  const min = 8;
  const max = 34;
  if (maxCount <= 0) return min;
  return min + (max - min) * Math.sqrt(count / maxCount);
}

function bubbleIcon(size: number) {
  return L.divIcon({
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:9999px;background:#4f46e5;opacity:0.75;border:2px solid white;box-shadow:0 1px 4px rgba(15,23,42,0.5)"></span>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 2],
  });
}

/**
 * World overview map (OpenStreetMap tiles via Leaflet) — one bubble per
 * city, sized by live listing count. Clicking a bubble drills straight into
 * that city's own inventory map, same destination as the "All cities" list
 * next to it.
 */
export function CityMap({ points }: { points: CityMapPoint[] }) {
  const router = useRouter();
  const maxCount = Math.max(1, ...points.map((p) => p.count));

  return (
    <MapContainer
      center={[20, 10]}
      zoom={2}
      minZoom={2}
      scrollWheelZoom
      worldCopyJump
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.map((p) => (
        <Marker
          key={p.city}
          position={[p.lat, p.lng]}
          icon={bubbleIcon(Math.round(radiusFor(p.count, maxCount) * 2))}
          eventHandlers={
            p.country
              ? {
                  click: () =>
                    router.push(
                      `/insights/country/${encodeURIComponent(p.country!)}/city/${encodeURIComponent(p.city)}`,
                    ),
                }
              : undefined
          }
        >
          <Popup>
            <p className="font-semibold text-ink-900">{p.city}</p>
            {p.country && <p className="text-xs text-ink-500">{p.country}</p>}
            <p className="text-ink-600">{p.count.toLocaleString()} live listings</p>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

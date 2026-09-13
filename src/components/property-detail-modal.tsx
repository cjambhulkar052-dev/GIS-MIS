"use client";

import { useEffect } from "react";
import Image from "next/image";
import type { CountryListingRow } from "@/lib/inventory-insights";

/** Structured "just the facts" view of one property — the internal alternative to sending users off to Amber's consumer-facing listing page for a quick lookup. */
export function PropertyDetailModal({
  listing,
  onClose,
}: {
  listing: CountryListingRow;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const booking = [
    listing.verified ? "Verified" : null,
    listing.instantBook ? "Instant book" : null,
  ].filter(Boolean);

  const rows: { label: string; value: string }[] = [
    { label: "Property", value: listing.propertyName },
    { label: "City", value: listing.city },
    { label: "Room type", value: listing.roomType ?? "—" },
    {
      label: "Price",
      value: listing.price != null ? `${listing.currency ?? ""} ${listing.price}`.trim() : "—",
    },
    { label: "Bills", value: listing.billsPolicy ?? "—" },
    {
      label: "Amenities",
      value: listing.amenities && listing.amenities.length > 0 ? listing.amenities.join(", ") : "—",
    },
    { label: "Rating", value: listing.rating != null ? `${listing.rating} / 5` : "—" },
    {
      label: "Available from",
      value: listing.availableFrom
        ? new Date(`${listing.availableFrom}T00:00:00Z`).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
            timeZone: "UTC",
          })
        : "—",
    },
    { label: "Distance to university", value: listing.universityDistance ?? "—" },
    { label: "Status", value: listing.status === "available" ? "Available" : "Sold" },
    { label: "Booking", value: booking.length > 0 ? booking.join(" · ") : "—" },
  ];
  if (listing.lat != null && listing.lng != null) {
    rows.push({ label: "Coordinates", value: `${listing.lat.toFixed(5)}, ${listing.lng.toFixed(5)}` });
  }

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-ink-900/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-md flex-col overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {listing.imageUrl && (
          <div className="relative h-48 w-full bg-ink-100">
            <Image
              src={listing.imageUrl}
              alt={listing.propertyName}
              fill
              sizes="(min-width: 640px) 448px, 100vw"
              className="object-cover"
            />
          </div>
        )}

        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-100 bg-white px-5 py-4">
          <h2 className="text-sm font-semibold text-ink-900">Property details</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-ink-400 transition hover:bg-ink-50 hover:text-ink-700"
          >
            ✕
          </button>
        </div>

        <table className="w-full text-sm">
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-ink-100 last:border-0">
                <th className="w-2/5 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-400">
                  {r.label}
                </th>
                <td className="px-5 py-3 text-ink-900">{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {listing.detailsUrl && (
          <div className="border-t border-ink-100 px-5 py-4">
            <a
              href={listing.detailsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              View full listing on Amber →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

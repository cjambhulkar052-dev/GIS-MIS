import Image from "next/image";
import type { AmberListing } from "@/lib/types";

const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: "£",
  EUR: "€",
  USD: "$",
  AUD: "A$",
  CAD: "C$",
};

export function RoomCard({ listing }: { listing: AmberListing }) {
  const symbol = CURRENCY_SYMBOLS[listing.currency] ?? listing.currency;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white transition hover:border-brand-200 hover:shadow-lg hover:shadow-ink-900/5">
      <div className="relative h-44 w-full overflow-hidden bg-ink-100">
        <Image
          src={listing.images[0]}
          alt={listing.propertyName}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex gap-2">
          {listing.verified && (
            <span className="rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-emerald-700 shadow-sm">
              Verified
            </span>
          )}
          {listing.instantBook && (
            <span className="rounded-full bg-brand-600/95 px-2.5 py-1 text-xs font-medium text-white shadow-sm">
              Instant book
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-ink-900">
              {listing.propertyName}
            </h3>
            <p className="text-xs text-ink-500">
              {listing.city}, {listing.country}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1 text-xs font-medium text-ink-700">
            <span className="text-amber-500">★</span>
            {listing.rating.toFixed(1)}
            <span className="text-ink-400">({listing.reviewsCount})</span>
          </div>
        </div>

        <p className="mt-2 text-xs text-ink-500">
          {listing.distanceFromUniversityKm} km from {listing.university}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="rounded-md bg-ink-100 px-2 py-1 text-xs font-medium text-ink-600">
            {listing.roomType}
          </span>
          <span className="rounded-md bg-ink-100 px-2 py-1 text-xs font-medium text-ink-600">
            {listing.billsPolicy}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {listing.amenities.slice(0, 3).map((amenity) => (
            <span key={amenity} className="text-xs text-ink-400">
              · {amenity}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-end justify-between pt-4">
          <div>
            <p className="text-lg font-semibold text-ink-900">
              {symbol}
              {listing.pricePerWeek}
              <span className="text-xs font-normal text-ink-500">/week</span>
            </p>
            <p className="text-xs text-ink-400">
              From {new Date(listing.availableFrom).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          <button className="rounded-lg bg-ink-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-brand-700">
            View details
          </button>
        </div>
      </div>
    </div>
  );
}

export function RoomCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-ink-200 bg-white">
      <div className="h-44 w-full bg-ink-100" />
      <div className="space-y-3 p-4">
        <div className="h-3.5 w-3/5 rounded bg-ink-100" />
        <div className="h-3 w-2/5 rounded bg-ink-100" />
        <div className="h-3 w-4/5 rounded bg-ink-100" />
        <div className="mt-4 h-8 w-full rounded bg-ink-100" />
      </div>
    </div>
  );
}

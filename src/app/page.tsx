import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const STATS = [
  { label: "Verified rooms", value: "52,000+" },
  { label: "Partner cities", value: "120+" },
  { label: "Countries covered", value: "35+" },
  { label: "Avg. booking time", value: "< 6 min" },
];

const FEATURES = [
  {
    title: "Live inventory sync",
    description:
      "Pull real-time availability and pricing directly from Amber and other housing partners into one unified feed.",
  },
  {
    title: "Smart filtering & search",
    description:
      "Let students and housing teams filter by university distance, budget, room type, and amenities in seconds.",
  },
  {
    title: "Secure booking & payments",
    description:
      "PCI-compliant checkout with deposit protection, contract generation, and automated confirmations.",
  },
  {
    title: "Partner dashboard",
    description:
      "Give accommodation partners a self-serve console to manage listings, pricing, and occupancy.",
  },
  {
    title: "API-first architecture",
    description:
      "Every listing, booking, and partner action is available over a documented REST API for easy integration.",
  },
  {
    title: "Dedicated support",
    description:
      "A named account manager and 24/7 support desk for both students and housing operators.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Connect your inventory",
    description:
      "Plug in Amber or upload your own property catalog — rooms, pricing, and availability sync automatically.",
  },
  {
    step: "02",
    title: "Students search & compare",
    description:
      "A fast, filterable Find Rooms experience helps students shortlist verified rooms near their university.",
  },
  {
    step: "03",
    title: "Book & manage in one place",
    description:
      "Bookings, payments, and contracts flow into a single partner dashboard — no spreadsheets required.",
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-grid">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white via-white/60 to-white" />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-6 pb-20 pt-16 lg:grid-cols-2 lg:items-center lg:pt-24">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-3 py-1 text-xs font-medium text-ink-600 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                Now integrating Amber inventory
              </span>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
                Student accommodation, sourced and booked like real B2B
                infrastructure.
              </h1>
              <p className="mt-5 max-w-xl text-lg text-ink-600">
                KirayaForex unifies verified room inventory from Amber and
                other housing partners into one searchable platform — built
                for students, universities, and accommodation operators.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/find-rooms"
                  className="rounded-lg bg-brand-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-sm shadow-brand-600/25 transition hover:bg-brand-700"
                >
                  Browse rooms
                </Link>
                <Link
                  href="/login"
                  className="rounded-lg border border-ink-200 bg-white px-5 py-3 text-center text-sm font-semibold text-ink-700 transition hover:border-ink-300 hover:bg-ink-50"
                >
                  Partner log in
                </Link>
              </div>
              <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
                {STATS.map((stat) => (
                  <div key={stat.label}>
                    <div className="text-2xl font-semibold text-ink-900">
                      {stat.value}
                    </div>
                    <div className="text-xs text-ink-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Product mockup card */}
            <div className="relative">
              <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-xl shadow-ink-900/5">
                <div className="flex items-center justify-between border-b border-ink-100 pb-4">
                  <div>
                    <p className="text-xs font-medium text-ink-400">
                      Search results
                    </p>
                    <p className="text-sm font-semibold text-ink-900">
                      Manchester · Sept intake
                    </p>
                  </div>
                  <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
                    38 rooms
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    { name: "Vita Student Manchester", price: "£245/wk", rating: "4.5" },
                    { name: "iQ The Slate Yard", price: "£210/wk", rating: "4.3" },
                    { name: "Urban Student Life", price: "£189/wk", rating: "4.1" },
                  ].map((room) => (
                    <div
                      key={room.name}
                      className="flex items-center justify-between rounded-xl border border-ink-100 bg-ink-50/60 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-ink-900">
                          {room.name}
                        </p>
                        <p className="text-xs text-ink-500">
                          ★ {room.rating} · Verified · Amber
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-ink-900">
                        {room.price}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 hidden rounded-xl border border-ink-200 bg-white px-4 py-3 shadow-lg shadow-ink-900/10 sm:block">
                <p className="text-xs text-ink-400">Sync status</p>
                <p className="flex items-center gap-1.5 text-sm font-semibold text-ink-900">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Amber inventory ready
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Trust bar */}
        <section className="border-y border-ink-100 bg-ink-50/60 py-8">
          <div className="mx-auto max-w-7xl px-6">
            <p className="text-center text-xs font-medium uppercase tracking-wider text-ink-400">
              Built to integrate with the housing partners you already work with
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-ink-400">
              {["Amber", "Vita Student", "Urbanest", "Iglu", "Yugo", "Scape"].map(
                (name) => (
                  <span
                    key={name}
                    className="text-lg font-semibold tracking-tight"
                  >
                    {name}
                  </span>
                ),
              )}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-2xl">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-600">
              Platform
            </h2>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-ink-900">
              Everything a housing marketplace needs, out of the box.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-ink-200 bg-white p-6 transition hover:border-brand-200 hover:shadow-md hover:shadow-brand-900/5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-ink-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-ink-500">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="bg-ink-900 py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="max-w-2xl">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-400">
                How it works
              </h2>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
                From inventory feed to confirmed booking.
              </p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {STEPS.map((item) => (
                <div key={item.step}>
                  <span className="text-sm font-mono text-brand-400">
                    {item.step}
                  </span>
                  <h3 className="mt-3 text-lg font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-ink-300">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="flex flex-col items-center justify-between gap-6 rounded-3xl border border-ink-200 bg-gradient-to-br from-brand-50 via-white to-white p-10 text-center sm:flex-row sm:text-left">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-ink-900">
                Ready to see live Amber inventory in your platform?
              </h2>
              <p className="mt-2 text-sm text-ink-600">
                Browse the current sample catalog now, or log in to your
                partner dashboard.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Link
                href="/find-rooms"
                className="rounded-lg bg-brand-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-sm shadow-brand-600/25 transition hover:bg-brand-700"
              >
                Browse rooms
              </Link>
              <Link
                href="/login"
                className="rounded-lg border border-ink-200 bg-white px-5 py-3 text-center text-sm font-semibold text-ink-700 transition hover:border-ink-300 hover:bg-ink-50"
              >
                Log in
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

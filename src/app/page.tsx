import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const PILLARS = [
  {
    tag: "GIS",
    name: "Geographic Information System",
    description:
      "A system for capturing and visualizing data by location — plotting things on a map so you can read distribution and proximity at a glance, not just as rows in a table.",
    inApp: [
      "World bubble map sized by live listings per city",
      "Country → city → university drill-down with real property pins",
      "Per-property coordinates and distance-to-university",
    ],
    href: "/insights",
    cta: "Open Inventory Insight",
  },
  {
    tag: "MIS",
    name: "Management Information System",
    description:
      "A system that turns raw operational data into the reports a manager actually checks — summaries, counts, and day-over-day change, built for a decision, not a data dump.",
    inApp: [
      "Live vs. sold-out counts and percentages, updated daily",
      "Day-over-day \"what sold\" diffs by property, city, and price",
      "Sync streak and scan health, so you know the numbers are current",
    ],
    href: "/sales",
    cta: "Open Sales Snapshot",
  },
];

const PIPELINE = [
  {
    step: "01",
    title: "Daily sync from Amber",
    description:
      "A rate-limited cron job crawls Amber's partner inventory API every morning and stores a full snapshot — every listing, price, and availability status.",
  },
  {
    step: "02",
    title: "MIS reads it as numbers",
    description:
      "Sales Snapshot diffs today's snapshot against yesterday's to show exactly what sold, and rolls the catalog up into live/sold-out KPIs.",
  },
  {
    step: "03",
    title: "GIS reads it as geography",
    description:
      "Inventory Insight plots the same snapshot on a map, letting you drill from a world view down to one property in one city.",
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
          <div className="relative mx-auto max-w-4xl px-6 pb-16 pt-16 text-center lg:pt-24">
            <span className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-3 py-1 text-xs font-medium text-ink-600 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              GIS + MIS, built on live Amber inventory
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
              The same inventory, read two ways.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-600">
              GIS MIS takes one daily snapshot of Amber&apos;s catalog and gives you
              both halves of its name: management reporting (
              <span className="font-semibold text-ink-800">MIS</span>) and geographic
              visualization (<span className="font-semibold text-ink-800">GIS</span>)
              — two views of the same data, not two separate tools.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/insights"
                className="rounded-lg bg-brand-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-sm shadow-brand-600/25 transition hover:bg-brand-700"
              >
                Open Inventory Insight
              </Link>
              <Link
                href="/sales"
                className="rounded-lg border border-ink-200 bg-white px-5 py-3 text-center text-sm font-semibold text-ink-700 transition hover:border-ink-300 hover:bg-ink-50"
              >
                Open Sales Snapshot
              </Link>
            </div>
          </div>
        </section>

        {/* GIS vs MIS */}
        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="max-w-2xl">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-600">
              The two halves
            </h2>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-ink-900">
              GIS vs. MIS — and where each one lives in this app.
            </p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {PILLARS.map((pillar) => (
              <div
                key={pillar.tag}
                className="flex flex-col rounded-2xl border border-ink-200 bg-white p-6"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-sm font-bold text-brand-600">
                    {pillar.tag}
                  </span>
                  <h3 className="text-lg font-semibold text-ink-900">{pillar.name}</h3>
                </div>
                <p className="mt-4 text-sm text-ink-600">{pillar.description}</p>
                <ul className="mt-4 flex-1 space-y-2">
                  {pillar.inApp.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-ink-600">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href={pillar.href}
                  className="mt-6 text-sm font-semibold text-brand-600 hover:text-brand-700"
                >
                  {pillar.cta} →
                </Link>
              </div>
            ))}
          </div>

          {/* GIS + MIS */}
          <div className="mt-6 rounded-2xl border border-ink-800 bg-ink-900 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-sm font-bold text-white">
                +
              </span>
              <h3 className="text-lg font-semibold text-white">
                GIS + MIS — reporting you navigate, not just read
              </h3>
            </div>
            <p className="mt-4 max-w-3xl text-sm text-ink-300">
              The Insights drill-down is both at once: clicking from a country to a
              city to a university is a geographic navigation — but at every stop,
              what you&apos;re actually reading is a management report (available vs.
              sold, cities covered, listings live). Geography becomes the way you get
              to the number, instead of a filter dropdown next to it.
            </p>
          </div>
        </section>

        {/* Pipeline */}
        <section className="bg-ink-50/60 py-16">
          <div className="mx-auto max-w-7xl px-6">
            <div className="max-w-2xl">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-600">
                How the data gets here
              </h2>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-ink-900">
                One daily snapshot, read two ways.
              </p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {PIPELINE.map((item) => (
                <div key={item.step}>
                  <span className="text-sm font-mono text-brand-600">{item.step}</span>
                  <h3 className="mt-3 text-lg font-semibold text-ink-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-ink-600">{item.description}</p>
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
                Pick your view of today&apos;s catalog.
              </h2>
              <p className="mt-2 text-sm text-ink-600">
                Same daily sync, two ways to read it — geographic or management.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Link
                href="/insights"
                className="rounded-lg bg-brand-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-sm shadow-brand-600/25 transition hover:bg-brand-700"
              >
                Inventory Insight
              </Link>
              <Link
                href="/sales"
                className="rounded-lg border border-ink-200 bg-white px-5 py-3 text-center text-sm font-semibold text-ink-700 transition hover:border-ink-300 hover:bg-ink-50"
              >
                Sales Snapshot
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

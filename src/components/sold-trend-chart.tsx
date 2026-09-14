"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export interface DailySoldCount {
  date: string;
  count: number;
}

function formatShort(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function formatFull(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Rounds a max value up to a "nice" axis ceiling: 1, 2, 5, 10, 20, 50, ... */
function niceCeiling(max: number): number {
  if (max <= 0) return 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
  for (const step of [1, 2, 5, 10]) {
    const candidate = step * magnitude;
    if (candidate >= max) return candidate;
  }
  return 10 * magnitude;
}

const CHART_HEIGHT = 140;
const COLUMN_WIDTH = 32;
const COLUMN_GAP = 8;

/**
 * Sold-per-day bar chart for the Sales Snapshot page — one bar per synced
 * date so a trend across days is visible at a glance, not just today's
 * count. Single series (one hue, no legend box needed — the title names
 * it); every value is direct-labeled, so nothing is gated behind hover.
 */
export function SoldTrendChart({ data }: { data: DailySoldCount[] }) {
  const router = useRouter();
  const [hovered, setHovered] = useState<number | null>(null);

  const max = useMemo(() => niceCeiling(Math.max(...data.map((d) => d.count), 0)), [data]);
  const ticks = useMemo(() => {
    const step = max / 4;
    return [0, step, step * 2, step * 3, max];
  }, [max]);

  if (data.length === 0) return null;

  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-ink-900">Sold per day</h2>
      <p className="mt-0.5 text-xs text-ink-500">
        Properties sold vs. the day before, across the last {data.length} synced days
      </p>

      {/*
        overflow-x-auto forces overflow-y to compute as "auto" too (CSS
        spec: a non-"visible" axis makes the other axis's "visible" compute
        to "auto"), which clips anything a child renders past this box's own
        edges. The extreme y-axis ticks below clamp their translate instead
        of centering past the top/bottom edge like the middle ones; pt-10
        gives the hover tooltip (which sits above its bar) room for the
        worst case — a bar at the top of the scale — instead of clipping it.
      */}
      <div className="mt-5 overflow-x-auto pt-10">
        <div className="flex" style={{ minWidth: data.length * (COLUMN_WIDTH + COLUMN_GAP) + 32 }}>
          {/* Y-axis ticks */}
          <div className="relative mr-2 w-6 shrink-0" style={{ height: CHART_HEIGHT }}>
            {ticks.map((t) => {
              const top = CHART_HEIGHT - (t / max) * CHART_HEIGHT;
              const translate = t === max ? "translate-y-0" : t === 0 ? "-translate-y-full" : "-translate-y-1/2";
              return (
                <span
                  key={t}
                  className={`absolute right-0 ${translate} text-[10px] tabular-nums text-ink-400`}
                  style={{ top }}
                >
                  {Math.round(t)}
                </span>
              );
            })}
          </div>

          {/* Plot area: gridlines + bars */}
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-x-0 top-0" style={{ height: CHART_HEIGHT }}>
              {ticks.map((t) => (
                <div
                  key={t}
                  className="absolute inset-x-0 border-t border-ink-100"
                  style={{ bottom: (t / max) * CHART_HEIGHT }}
                />
              ))}
            </div>

            <div className="flex" style={{ gap: COLUMN_GAP }}>
              {data.map((d, i) => {
                const barHeight = max > 0 ? (d.count / max) * CHART_HEIGHT : 0;
                return (
                  <button
                    key={d.date}
                    type="button"
                    onClick={() => router.push(`/sales?date=${d.date}`)}
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
                    onFocus={() => setHovered(i)}
                    onBlur={() => setHovered((h) => (h === i ? null : h))}
                    className="group relative flex shrink-0 flex-col items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                    style={{ width: COLUMN_WIDTH }}
                    aria-label={`${formatFull(d.date)}: ${d.count} sold`}
                  >
                    {hovered === i && (
                      <div className="pointer-events-none absolute bottom-full z-10 mb-2 whitespace-nowrap rounded-lg bg-ink-900 px-2.5 py-1.5 text-xs shadow-lg">
                        <span className="font-semibold text-white">{d.count} sold</span>
                        <span className="ml-1.5 text-ink-300">{formatFull(d.date)}</span>
                      </div>
                    )}
                    <div className="flex w-full flex-col items-center justify-end" style={{ height: CHART_HEIGHT }}>
                      <span className="mb-1 text-[11px] font-medium tabular-nums text-ink-600">
                        {d.count}
                      </span>
                      <span
                        className={`w-full rounded-t transition-colors ${
                          hovered === i ? "bg-brand-700" : "bg-brand-600"
                        }`}
                        style={{ height: Math.max(barHeight, d.count > 0 ? 2 : 0) }}
                      />
                    </div>
                    <span className="mt-2 text-[10px] text-ink-400">{formatShort(d.date)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

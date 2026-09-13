"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export interface SearchEntry {
  key: string;
  label: string;
  sublabel?: string;
  href: string;
}

/**
 * Autocompleting "jump to X" text box — shared by CitySearch and
 * UniversitySearch, which just adapt their own list into {key, label,
 * sublabel, href} and pick an icon.
 */
export function EntitySearch({
  id,
  placeholder,
  entries,
  icon = "📍",
  noMatchLabel = "match",
}: {
  id?: string;
  placeholder: string;
  entries: SearchEntry[];
  icon?: string;
  noMatchLabel?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const startsWith = entries.filter((e) => e.label.toLowerCase().startsWith(q));
    const contains = entries.filter(
      (e) => !e.label.toLowerCase().startsWith(q) && e.label.toLowerCase().includes(q),
    );
    return [...startsWith, ...contains].slice(0, 8);
  }, [entries, query]);

  function goTo(entry: SearchEntry) {
    router.push(entry.href);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="relative w-full sm:w-80">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (matches.length > 0) goTo(matches[0]);
        }}
      >
        <div className="group relative">
          <svg
            viewBox="0 0 20 20"
            fill="none"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400 transition group-focus-within:text-brand-500"
          >
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.75" />
            <path d="m14 14 4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
          <input
            id={id}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder={placeholder}
            className="w-full rounded-full border border-ink-200 bg-white py-2.5 pl-10 pr-4 text-sm text-ink-900 shadow-sm shadow-ink-900/5 outline-none transition placeholder:text-ink-400 focus:border-brand-400 focus:shadow-md focus:shadow-brand-600/10 focus:ring-4 focus:ring-brand-100"
          />
        </div>
      </form>
      {open && matches.length > 0 && (
        <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-2xl border border-ink-200 bg-white p-1.5 shadow-xl shadow-ink-900/10">
          {matches.map((m) => (
            <button
              key={m.key}
              type="button"
              onMouseDown={() => goTo(m)}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-brand-50"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs">
                {icon}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium text-ink-900">{m.label}</span>
              {m.sublabel && (
                <span className="shrink-0 truncate text-xs text-ink-400">{m.sublabel}</span>
              )}
            </button>
          ))}
        </div>
      )}
      {open && query.trim() && matches.length === 0 && (
        <div className="absolute z-10 mt-2 w-full rounded-2xl border border-dashed border-ink-200 bg-white px-4 py-3 text-xs text-ink-500 shadow-lg">
          No {noMatchLabel} matches &ldquo;{query}&rdquo;.
        </div>
      )}
    </div>
  );
}

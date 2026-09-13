import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2 ${className}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
        G
      </span>
      <span className="text-lg font-semibold tracking-tight text-ink-900">
        GIS MIS
      </span>
    </Link>
  );
}

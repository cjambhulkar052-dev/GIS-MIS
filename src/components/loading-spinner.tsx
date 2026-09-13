/** Full-viewport centered spinner used as the Suspense fallback for data-fetching pages. */
export function LoadingSpinner() {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-3 bg-ink-50/40">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-ink-200 border-t-brand-600" />
      <p className="text-sm font-medium text-ink-500">Loading…</p>
    </div>
  );
}

import { createBrowserClient } from "@supabase/ssr";

/** Supabase client for use in Client Components. Create a fresh one per call — don't cache in a module-level variable. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}

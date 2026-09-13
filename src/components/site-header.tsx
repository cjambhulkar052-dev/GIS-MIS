import Link from "next/link";
import { Logo } from "./logo";
import { signOut } from "@/app/auth/actions";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/find-rooms", label: "Find Rooms" },
];

export async function SiteHeader() {
  let email: string | undefined;
  if (hasSupabaseEnv) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    email = data?.claims?.email as string | undefined;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-6 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-ink-600 transition hover:text-ink-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {email ? (
            <>
              <span className="hidden text-sm text-ink-500 sm:block">{email}</span>
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-ink-50"
                >
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden text-sm font-medium text-ink-600 transition hover:text-ink-900 sm:block"
              >
                Log in
              </Link>
              <Link
                href="/find-rooms"
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-600/20 transition hover:bg-brand-700"
              >
                Browse inventory
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

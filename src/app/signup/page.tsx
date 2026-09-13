"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== repeatPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=/find-rooms`,
      },
    });

    if (error) {
      setError(error.message);
      setSubmitting(false);
      return;
    }

    if (data.session) {
      // Email confirmation is disabled on this project — already signed in.
      router.push("/find-rooms");
      router.refresh();
      return;
    }

    router.push("/signup/success");
  }

  return (
    <main className="flex min-h-screen flex-1">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-ink-950 p-12 text-white lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.35),transparent_45%)]" />
        <div className="relative">
          <Logo className="[&_span:last-child]:text-white" />
        </div>
        <div className="relative max-w-md">
          <p className="text-2xl font-medium leading-snug">
            &ldquo;GIS MIS cut our student housing search time from days
            to minutes — the Amber sync alone was worth switching.&rdquo;
          </p>
          <p className="mt-4 text-sm text-ink-300">
            Head of Accommodation Services, partner university
          </p>
        </div>
        <div className="relative grid grid-cols-3 gap-6 border-t border-white/10 pt-6">
          {[
            { label: "Verified rooms", value: "52,000+" },
            { label: "Partner cities", value: "120+" },
            { label: "Countries", value: "35+" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-lg font-semibold">{stat.value}</div>
              <div className="text-xs text-ink-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-16 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            Set up partner access to GIS MIS.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="text-xs font-medium text-ink-600">
                Work email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                className="mt-1.5 w-full rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div>
              <label htmlFor="password" className="text-xs font-medium text-ink-600">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div>
              <label htmlFor="repeat-password" className="text-xs font-medium text-ink-600">
                Repeat password
              </label>
              <input
                id="repeat-password"
                type="password"
                required
                minLength={6}
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-600/25 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Creating account…" : "Sign up"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-ink-500">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

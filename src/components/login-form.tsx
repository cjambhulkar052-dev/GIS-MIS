"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(searchParams.get("error"));
  const [oauthNotice, setOauthNotice] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setSubmitting(false);
      return;
    }

    router.push("/find-rooms");
    router.refresh();
  }

  async function handleOAuth(provider: "google" | "azure") {
    setOauthNotice(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/find-rooms` },
    });
    if (error) {
      setOauthNotice(
        `${provider === "google" ? "Google" : "Microsoft"} sign-in isn't configured yet.`,
      );
    }
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
            Log in to your account
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            Access your GIS MIS partner dashboard.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              className="flex items-center justify-center gap-2 rounded-lg border border-ink-200 bg-white py-2.5 text-sm font-medium text-ink-700 transition hover:bg-ink-50"
            >
              Google
            </button>
            <button
              type="button"
              onClick={() => handleOAuth("azure")}
              className="flex items-center justify-center gap-2 rounded-lg border border-ink-200 bg-white py-2.5 text-sm font-medium text-ink-700 transition hover:bg-ink-50"
            >
              Microsoft
            </button>
          </div>
          {oauthNotice && (
            <p className="mt-2 text-center text-xs text-ink-400">{oauthNotice}</p>
          )}

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-ink-200" />
            <span className="text-xs text-ink-400">or continue with email</span>
            <div className="h-px flex-1 bg-ink-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="text-xs font-medium text-ink-600"
              >
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
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-xs font-medium text-ink-600"
                >
                  Password
                </label>
                <Link
                  href="/login"
                  className="text-xs font-medium text-brand-600 hover:text-brand-700"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              {submitting ? "Signing in…" : "Log in"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-ink-500">
            New to GIS MIS?{" "}
            <Link
              href="/signup"
              className="font-medium text-brand-600 hover:text-brand-700"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

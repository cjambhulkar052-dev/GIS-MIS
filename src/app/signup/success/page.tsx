import Link from "next/link";
import { Logo } from "@/components/logo";

export default function SignUpSuccessPage() {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm text-center">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
          Check your email
        </h1>
        <p className="mt-3 text-sm text-ink-500">
          We&apos;ve sent a confirmation link to your inbox. Click it to activate
          your account, then log in below.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-600/25 transition hover:bg-brand-700"
        >
          Go to login
        </Link>
      </div>
    </main>
  );
}

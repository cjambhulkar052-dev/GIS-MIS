import Link from "next/link";
import { Logo } from "./logo";

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Find Rooms", href: "/find-rooms" },
      { label: "Partner inventory", href: "/find-rooms" },
      { label: "Log in", href: "/login" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/" },
      { label: "Careers", href: "/" },
      { label: "Contact sales", href: "/" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Help center", href: "/" },
      { label: "API status", href: "/" },
      { label: "Trust & safety", href: "/" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-ink-200 bg-ink-50">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2">
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-ink-500">
              The B2B platform for sourcing, comparing, and booking verified
              student accommodation worldwide.
            </p>
          </div>
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-ink-900">
                {column.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink-500 transition hover:text-ink-900"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-ink-200 pt-6 sm:flex-row">
          <p className="text-xs text-ink-400">
            © {new Date().getFullYear()} KirayaForex, Inc. All rights reserved.
          </p>
          <p className="text-xs text-ink-400">
            Inventory data provided by Amber and verified housing partners.
          </p>
        </div>
      </div>
    </footer>
  );
}

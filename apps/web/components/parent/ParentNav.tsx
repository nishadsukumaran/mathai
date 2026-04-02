"use client";

/**
 * @module components/parent/ParentNav
 *
 * Top navigation bar for the parent portal.
 * Calm, premium feel — not the admin dark theme.
 */

import Link            from "next/link";
import { usePathname } from "next/navigation";
import { signOut }     from "next-auth/react";
import { useSession }  from "next-auth/react";

const NAV_ITEMS = [
  { href: "/parent",     label: "Overview",  icon: "🏠" },
  { href: "/parent/ask", label: "Ask AI",    icon: "🤖" },
];

export default function ParentNav() {
  const pathname          = usePathname();
  const { data: session } = useSession();
  const parentName        = session?.user?.name ?? "Parent";

  return (
    <header className="bg-white border-b border-slate-200 h-14 flex items-center px-6 gap-6 shrink-0 shadow-sm">
      {/* Brand */}
      <div className="flex items-center gap-2">
        <span className="text-indigo-600 font-black text-lg">MathAI</span>
        <span className="text-slate-400 text-sm font-semibold">Parent Portal</span>
      </div>

      {/* Nav links */}
      <nav className="flex items-center gap-1 flex-1">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const isActive = pathname === href || pathname?.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              {icon} {label}
            </Link>
          );
        })}
      </nav>

      {/* User + sign out */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-500 font-medium hidden sm:inline">
          {parentName}
        </span>
        <button
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          className="text-sm text-slate-400 hover:text-red-500 font-semibold transition"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}

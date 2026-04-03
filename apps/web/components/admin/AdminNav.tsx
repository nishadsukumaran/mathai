"use client";

/**
 * @module components/admin/AdminNav
 *
 * Professional admin navigation — operations console style.
 * Dark theme with clear section hierarchy and contextual actions.
 */

import Link            from "next/link";
import { usePathname } from "next/navigation";
import { signOut }     from "next-auth/react";
import { useSession }  from "next-auth/react";

const NAV_SECTIONS = [
  { href: "/admin/dashboard", label: "Overview",  icon: "📊" },
  { href: "/admin/users",     label: "Users",     icon: "👥" },
];

export default function AdminNav() {
  const pathname          = usePathname();
  const { data: session } = useSession();
  const adminName         = session?.user?.name ?? "Admin";

  return (
    <header className="bg-gray-950 text-white shrink-0">
      {/* Top bar */}
      <div className="h-12 flex items-center px-5 gap-5 border-b border-gray-800">
        {/* Brand */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-6 h-6 rounded-md bg-indigo-500 flex items-center justify-center text-[10px] font-black">M</div>
          <span className="font-bold text-sm text-white">MathAI</span>
          <span className="text-[10px] font-semibold text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">ADMIN</span>
        </div>

        {/* Nav links */}
        <nav className="flex items-center gap-1 flex-1">
          {NAV_SECTIONS.map(({ href, label, icon }) => {
            const active = pathname?.startsWith(href);
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  active ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                }`}>
                <span className="text-sm">{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/dashboard"
            className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1">
            ← App
          </Link>
          <span className="text-gray-600">|</span>
          <span className="text-[11px] text-gray-500">{adminName}</span>
          <button onClick={() => void signOut({ callbackUrl: "/auth/signin" })}
            className="text-[11px] text-gray-500 hover:text-white transition font-semibold">
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}

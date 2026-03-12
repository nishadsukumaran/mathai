/**
 * @module components/admin/AdminNav
 *
 * Top navigation bar for the admin area.
 * Shows current admin's name + sign-out, links to admin sections,
 * and a "← Student View" shortcut back to the learning dashboard.
 */

"use client";

import Link     from "next/link";
import { usePathname }  from "next/navigation";
import { signOut }      from "next-auth/react";
import { useSession }   from "next-auth/react";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/users",     label: "Users" },
];

export default function AdminNav() {
  const pathname         = usePathname();
  const { data: session } = useSession();

  // @ts-ignore — extended session type
  const adminName = session?.user?.name ?? "Admin";

  return (
    <header className="bg-gray-900 text-white h-14 flex items-center px-6 gap-6 shrink-0 border-b border-gray-700">
      {/* Brand */}
      <div className="flex items-center gap-2">
        <span className="text-indigo-400 font-black text-lg">MathAI</span>
        <span className="text-gray-500 text-sm font-semibold">Admin</span>
      </div>

      {/* Back to student dashboard */}
      <Link
        href="/dashboard"
        className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400 hover:text-emerald-300 border border-emerald-700 hover:border-emerald-500 px-3 py-1 rounded-lg transition"
        title="Go back to the student learning dashboard"
      >
        <span>←</span>
        <span className="hidden sm:inline">Student View</span>
      </Link>

      {/* Nav links */}
      <nav className="flex items-center gap-1 flex-1">
        {NAV_ITEMS.map(({ href, label }) => {
          const isActive = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={[
                "px-3 py-1.5 rounded-lg text-sm font-semibold transition",
                isActive
                  ? "bg-indigo-600 text-white"
                  : "text-gray-300 hover:text-white hover:bg-gray-700",
              ].join(" ")}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User + sign-out */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-gray-400 hidden md:inline">{adminName}</span>
        <button
          onClick={() => void signOut({ callbackUrl: "/auth/signin" })}
          className="text-gray-400 hover:text-white transition font-semibold"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}

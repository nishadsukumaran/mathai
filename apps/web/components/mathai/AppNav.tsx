/**
 * @module components/mathai/AppNav
 *
 * App-wide navigation for authenticated student users.
 *
 * Mobile  (< md): fixed bottom bar with icon + label per route
 * Desktop (≥ md): fixed left sidebar with icon + label, collapses to icons only
 *
 * Hidden automatically on /auth/* routes.
 */

"use client";

import Link               from "next/link";
import { usePathname }    from "next/navigation";
import { cn }             from "@/lib/utils";

// ─── Nav items ────────────────────────────────────────────────────────────────

// All items appear on BOTH mobile bottom bar and desktop sidebar.
// Profile is in this list (fix for NAV-01 — previously missing from mobile).
const NAV_ITEMS = [
  { href: "/dashboard",   label: "Home",     icon: "🏠", activeIcon: "🏠" },
  { href: "/practice",    label: "Practice", icon: "📚", activeIcon: "📚" },
  { href: "/ask",         label: "Ask AI",   icon: "🤖", activeIcon: "🤖" },
  { href: "/progress",    label: "Progress", icon: "📈", activeIcon: "📈" },
  { href: "/leaderboard", label: "Leaders",  icon: "🏆", activeIcon: "🏆" },
  { href: "/profile",     label: "Profile",  icon: "👤", activeIcon: "👤" },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function AppNav() {
  const pathname = usePathname();

  // Hide on auth routes and landing page
  if (
    pathname === "/" ||
    pathname.startsWith("/auth")
  ) {
    return null;
  }

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard" || pathname === "/"
      : pathname.startsWith(href);

  return (
    <>
      {/* ── Mobile: fixed bottom bar ────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-100 shadow-lg safe-area-pb">
        <div className="flex items-stretch h-16">
          {[...NAV_ITEMS].map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-0.5 text-center transition-colors",
                  active
                    ? "text-indigo-600"
                    : "text-gray-400 hover:text-indigo-400",
                )}
              >
                <span className={cn("text-lg leading-none", active && "scale-110 transition-transform")}>
                  {active ? item.activeIcon : item.icon}
                </span>
                <span className={cn(
                  "text-[9px] font-bold leading-none",
                  active ? "text-indigo-600" : "text-gray-400",
                )}>
                  {item.label}
                </span>
                {active && (
                  <span className="w-1 h-1 rounded-full bg-indigo-600 mt-0.5" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Desktop: fixed left sidebar ────────────────────────────────── */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 z-30 w-20 xl:w-56 flex-col bg-white border-r border-gray-100 shadow-sm py-6">
        {/* Logo */}
        <div className="px-4 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-md shrink-0">
            M
          </div>
          <span className="hidden xl:block font-black text-xl text-gray-800 tracking-tight">
            MathAI
          </span>
        </div>

        {/* Nav links — all items including Profile */}
        <div className="flex-1 flex flex-col gap-1 px-2">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-2xl font-bold text-sm transition-all",
                  active
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "text-gray-500 hover:bg-indigo-50 hover:text-indigo-600",
                )}
              >
                <span className="text-xl shrink-0">{item.icon}</span>
                <span className="hidden xl:block">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </aside>

      {/* ── Desktop: push-right spacer so page content clears the sidebar ─ */}
      {/* Applied via md:pl-20 xl:pl-56 on the page wrapper in layout.tsx */}
    </>
  );
}

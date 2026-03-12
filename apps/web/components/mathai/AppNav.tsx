/**
 * @module components/mathai/AppNav
 *
 * App-wide navigation for authenticated student users.
 *
 * Mobile  (< md): fixed bottom bar with icon + label per route
 *                 + a thin top header bar with brand + sign-out button
 * Desktop (≥ md): fixed left sidebar with icon + label, sign-out pinned at bottom
 *
 * Hidden automatically on /auth/* routes.
 */

"use client";

import Link               from "next/link";
import { usePathname }    from "next/navigation";
import { useSession }     from "next-auth/react";
import { signOut }        from "next-auth/react";
import { useState }       from "react";
import { cn }             from "@/lib/utils";

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: "/dashboard",   label: "Home",     icon: "🏠" },
  { href: "/practice",    label: "Practice", icon: "📚" },
  { href: "/ask",         label: "Ask AI",   icon: "🤖" },
  { href: "/progress",    label: "Progress", icon: "📈" },
  { href: "/leaderboard", label: "Leaders",  icon: "🏆" },
  { href: "/profile",     label: "Profile",  icon: "👤" },
];

const ADMIN_ITEM = { href: "/admin/dashboard", label: "Admin", icon: "⚙️" };

// ─── Component ────────────────────────────────────────────────────────────────

export function AppNav() {
  const pathname            = usePathname();
  const { data: session }   = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role                = (session?.user as any)?.role as string | undefined;
  const [signingOut, setSigningOut] = useState(false);

  // Hide on auth routes, landing page, and admin area (admin has its own nav)
  if (
    pathname === "/" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/admin")
  ) {
    return null;
  }

  // Append admin link for admin users
  const navItems = role === "admin" ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS;

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard" || pathname === "/"
      : pathname.startsWith(href);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut({ callbackUrl: "/auth/signin" });
  };

  return (
    <>
      {/* ── Mobile: thin top header ──────────────────────────────────────── */}
      <header className="md:hidden fixed top-0 inset-x-0 z-30 bg-white border-b border-gray-100 shadow-sm h-11 flex items-center justify-between px-4">
        <span className="font-black text-indigo-600 text-base tracking-tight">MathAI</span>
        <button
          onClick={() => void handleSignOut()}
          disabled={signingOut}
          className="text-xs font-semibold text-gray-400 hover:text-indigo-600 transition disabled:opacity-50"
        >
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </header>

      {/* ── Mobile: fixed bottom bar ─────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-100 shadow-lg safe-area-pb">
        <div className="flex items-stretch h-16">
          {navItems.map((item) => {
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
                  {item.icon}
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

        {/* Nav links */}
        <div className="flex-1 flex flex-col gap-1 px-2">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const isAdminLink = item.href.startsWith("/admin");
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-2xl font-bold text-sm transition-all",
                  active
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : isAdminLink
                      ? "text-amber-600 hover:bg-amber-50 hover:text-amber-700 border border-amber-200"
                      : "text-gray-500 hover:bg-indigo-50 hover:text-indigo-600",
                )}
              >
                <span className="text-xl shrink-0">{item.icon}</span>
                <span className="hidden xl:block">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Sign out — pinned to bottom of sidebar */}
        <div className="px-2 pt-2 border-t border-gray-100 mt-2">
          <button
            onClick={() => void handleSignOut()}
            disabled={signingOut}
            title="Sign out"
            className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl font-bold text-sm text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all disabled:opacity-50"
          >
            <span className="text-xl shrink-0">🚪</span>
            <span className="hidden xl:block">
              {signingOut ? "Signing out…" : "Sign out"}
            </span>
          </button>
        </div>
      </aside>

      {/* ── Desktop: push-right spacer so page content clears the sidebar ─ */}
      {/* Applied via md:pl-20 xl:pl-56 on the page wrapper in layout.tsx */}
    </>
  );
}

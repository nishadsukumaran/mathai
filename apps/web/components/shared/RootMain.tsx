/**
 * @module components/shared/RootMain
 *
 * Client wrapper for the root layout <main> element.
 * Conditionally applies student-sidebar padding so that admin pages
 * (which have their own full-width layout) don't inherit the sidebar offsets.
 *
 * Student routes: pt-11 pb-20 md:pt-0 md:pb-0 md:pl-20 xl:pl-56
 *                 (clears mobile top header + bottom bar; clears desktop sidebar)
 * Admin routes  : no padding (AdminLayout handles its own layout)
 */

"use client";

import { usePathname } from "next/navigation";

export function RootMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // These layouts are self-contained — no student sidebar padding
  const isPublic = pathname === "/" || pathname.startsWith("/features");
  const isAuth   = pathname.startsWith("/auth");
  const isAdmin  = pathname.startsWith("/admin");
  const isParent = pathname.startsWith("/parent");

  // Student routes: clear mobile top header (pt-11) + bottom bar (pb-20) + desktop sidebar (pl)
  // All other route groups manage their own layout
  const padding = (isPublic || isAuth || isAdmin || isParent)
    ? ""
    : "pt-11 pb-20 md:pt-0 md:pb-0 md:pl-20 xl:pl-56";

  return (
    <main className={`${padding} overflow-x-hidden`}>
      {children}
    </main>
  );
}

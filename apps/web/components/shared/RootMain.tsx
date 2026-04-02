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

  // Admin and parent layouts are self-contained — no sidebar padding
  const isAdmin  = pathname.startsWith("/admin");
  const isParent = pathname.startsWith("/parent");

  // Student routes: clear mobile top header (pt-11) + bottom bar (pb-20) + desktop sidebar (pl)
  // Admin/parent routes: no padding — they manage their own layout
  const padding = (isAdmin || isParent)
    ? ""
    : "pt-11 pb-20 md:pt-0 md:pb-0 md:pl-20 xl:pl-56";

  return (
    <main className={`${padding} overflow-x-hidden`}>
      {children}
    </main>
  );
}

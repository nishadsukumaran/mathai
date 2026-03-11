/**
 * @module components/shared/RootMain
 *
 * Client wrapper for the root layout <main> element.
 * Conditionally applies student-sidebar padding so that admin pages
 * (which have their own full-width layout) don't inherit the sidebar offsets.
 *
 * Student routes: pb-20 md:pb-0 md:pl-20 xl:pl-56  (clears mobile bottom bar + desktop sidebar)
 * Admin routes  : no padding (AdminLayout handles its own layout)
 */

"use client";

import { usePathname } from "next/navigation";

export function RootMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin  = pathname.startsWith("/admin");

  return (
    <main className={isAdmin ? "" : "pb-20 md:pb-0 md:pl-20 xl:pl-56"}>
      {children}
    </main>
  );
}

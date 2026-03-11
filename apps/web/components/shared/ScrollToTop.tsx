/**
 * @module components/shared/ScrollToTop
 *
 * Resets the window scroll position to the top on every route change.
 * Next.js App Router does not do this automatically in all cases.
 *
 * Usage: render once inside the root layout, inside Providers.
 */

"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}

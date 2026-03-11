/**
 * @module apps/web/hooks/use-practice-menu
 *
 * Client-side hook for fetching the personalized practice menu.
 * Wraps GET /api/practice/menu.
 *
 * Returns all 5 sections from the API. Views can slice/filter as needed.
 * Gracefully returns null on fetch failure (section simply won't render).
 *
 * USAGE:
 *   const { menu, loading } = usePracticeMenu();
 *   const topThree = menu?.sections.flatMap(s => s.items).slice(0, 3) ?? [];
 */

"use client";

import { useState, useEffect } from "react";
import { clientGet }            from "@/lib/clientApi";
import type { PracticeMenu }    from "@mathai/shared-types";

interface PracticeMenuState {
  menu:    PracticeMenu | null;
  loading: boolean;
  error:   string | null;
}

export function usePracticeMenu() {
  const [state, setState] = useState<PracticeMenuState>({
    menu:    null,
    loading: true,
    error:   null,
  });

  useEffect(() => {
    let cancelled = false;
    void clientGet<PracticeMenu>("/practice/menu").then((data) => {
      if (!cancelled) {
        setState({
          menu:    data,
          loading: false,
          error:   data ? null : "Could not load practice menu",
        });
      }
    });
    return () => { cancelled = true; };
  }, []);

  return state;
}

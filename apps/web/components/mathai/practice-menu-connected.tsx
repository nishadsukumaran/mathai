/**
 * @module components/mathai/practice-menu-connected
 *
 * Fetches the personalised practice menu from GET /api/practice/menu
 * and passes it to PracticeMenuView. Falls back to the mock fixture
 * on error (so the dashboard always shows something useful).
 */

"use client";

import { useEffect, useState } from "react";
import { PracticeMenuView }    from "./practice-menu";
import { clientGet }           from "@/lib/clientApi";
import type { PracticeMenu }   from "@/types";

export function PracticeMenuConnected({ className }: { className?: string }) {
  const [menu,    setMenu]    = useState<PracticeMenu | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    clientGet<PracticeMenu>("/practice/menu").then((data) => {
      if (!cancelled) {
        setMenu(data);      // null = API failed → PracticeMenuView uses mock
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  return <PracticeMenuView menu={menu} loading={loading} className={className} />;
}

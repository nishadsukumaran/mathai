/**
 * @module app/admin/layout
 *
 * Admin area layout segment — intentionally does NOT include AppNav
 * (which is the student sidebar). Admin has its own navigation bar.
 *
 * This layout wraps all /admin/* routes. The middleware.ts guards
 * unauthenticated + non-admin access before this layout even renders.
 */

import type { Metadata } from "next";
import AdminNav          from "@/components/admin/AdminNav";

export const metadata: Metadata = {
  title:       "MathAI Admin",
  description: "MathAI Platform Admin Console",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AdminNav />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

/**
 * @module app/parent/layout
 *
 * Parent portal layout — uses ParentNav instead of student AppNav.
 * force-dynamic: all parent routes require auth session — cannot be prerendered.
 */

export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import ParentNav         from "@/components/parent/ParentNav";

export const metadata: Metadata = {
  title:       "MathAI — Parent Portal",
  description: "Track your child's learning journey with MathAI",
};

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex flex-col">
      <ParentNav />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

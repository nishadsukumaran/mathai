/**
 * @module apps/web/app/practice/page
 *
 * Route entry point for /practice.
 * Server component — performs auth check before rendering.
 * All session logic lives in PracticeContainer.
 */

import { getServerSession } from "next-auth";
import { redirect }         from "next/navigation";
import { authOptions }      from "@/lib/auth";
import { Suspense }         from "react";
import PracticePageContent  from "./PracticePageContent";

export default async function PracticePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/signin?callbackUrl=/practice");

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
          <div className="text-center">
            <div className="text-4xl mb-4 animate-pulse">🚀</div>
            <p className="text-indigo-600 font-semibold">Getting your practice ready...</p>
          </div>
        </div>
      }
    >
      <PracticePageContent />
    </Suspense>
  );
}

/**
 * @module apps/web/app/page
 *
 * Landing page / route entry point.
 * Redirects authenticated students to /dashboard.
 * Shows marketing/onboarding UI for unauthenticated visitors.
 *
 * v0 INSTRUCTIONS: Generate a kid-friendly hero with:
 *   - Large, bright math mascot character
 *   - "Start Learning!" CTA button
 *   - XP/badge teaser visuals
 *   - Clean, colourful, playful aesthetic
 */

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/dashboard");
  }

  // Unauthenticated — show landing page
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
      {/* v0: Replace this placeholder with the full landing page design */}
      <h1 className="text-5xl font-bold text-indigo-700 mb-4">
        Welcome to MathAI! 🧮
      </h1>
      <p className="text-xl text-gray-600 mb-8 max-w-md">
        Your AI-powered math tutor. Earn XP, collect badges, and conquer every grade!
      </p>
      <a
        href="/api/auth/signin"
        className="bg-indigo-600 text-white px-8 py-4 rounded-2xl text-lg font-bold hover:bg-indigo-700 transition"
      >
        Start Learning →
      </a>
    </main>
  );
}

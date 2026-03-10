/**
 * @module apps/web/app/page
 *
 * Landing page / route entry point.
 * Redirects authenticated students to /dashboard.
 * Shows a gamified, kid-friendly hero for unauthenticated visitors.
 */

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex flex-col">
      {/* ── Nav bar ──────────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-8 py-5">
        <span className="text-2xl font-black text-indigo-700 tracking-tight">
          MathAI
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/auth/signin"
            className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition px-4 py-2"
          >
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className="text-sm font-bold bg-indigo-600 text-white px-5 py-2 rounded-xl hover:bg-indigo-700 transition"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 text-center -mt-8">
        <div className="text-8xl mb-6 animate-bounce" style={{ animationDuration: "2s" }}>
          🧮
        </div>
        <h1 className="text-5xl sm:text-6xl font-black text-gray-800 mb-4 leading-tight">
          Math is an <span className="text-indigo-600">adventure</span>
        </h1>
        <p className="text-lg sm:text-xl text-slate-500 max-w-lg mb-10">
          AI-powered lessons, real-time hints, XP rewards, and badges. Your
          personalised math tutor that makes every problem feel like a quest.
        </p>

        <Link
          href="/auth/signup"
          className="bg-indigo-600 text-white px-10 py-4 rounded-2xl text-lg font-black hover:bg-indigo-700 hover:scale-105 transition-all shadow-lg shadow-indigo-200"
        >
          Start Learning Free
        </Link>
      </section>

      {/* ── Feature teasers ──────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pb-16 grid grid-cols-1 sm:grid-cols-3 gap-6">
        <FeatureCard
          emoji="🎯"
          title="Adaptive Practice"
          description="Questions that adapt to your level in real time."
        />
        <FeatureCard
          emoji="✨"
          title="Earn XP & Badges"
          description="Level up, maintain streaks, and collect rare badges."
        />
        <FeatureCard
          emoji="🤖"
          title="AI Tutor"
          description="Step-by-step hints whenever you're stuck — no judgment."
        />
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="text-center py-6 text-xs text-slate-400">
        Built with care for young mathematicians
      </footer>
    </main>
  );
}

/* ─── Sub-components ──────────────────────────────────────────────────────── */

function FeatureCard({
  emoji,
  title,
  description,
}: {
  emoji: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 text-center shadow-sm border border-white/60 hover:shadow-md transition-shadow">
      <div className="text-4xl mb-3">{emoji}</div>
      <p className="font-black text-gray-800 mb-1">{title}</p>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
  );
}

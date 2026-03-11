/**
 * @module apps/web/app/practice/PracticePageContent
 *
 * When a topicId is present in the URL → renders the practice session.
 * When no topicId → renders PracticeHub (topic picker) instead of
 * redirecting to the dashboard (old dead-end behaviour).
 */

"use client";

import { useSearchParams } from "next/navigation";
import Link               from "next/link";
import PracticeContainer  from "@/containers/PracticeContainer";
import { usePracticeMenu } from "@/hooks/use-practice-menu";

export default function PracticePageContent() {
  const params  = useSearchParams();
  const topicId = params.get("topicId");
  const mode    = params.get("mode") ?? "guided";

  if (!topicId) {
    return <PracticeHub />;
  }

  return <PracticeContainer topicId={topicId} mode={mode} />;
}

/* ─── Practice Hub ─────────────────────────────────────────────────────────── */

function PracticeHub() {
  const { menu, loading, error } = usePracticeMenu();

  const sections = menu?.sections ?? [];
  const allItems = sections.flatMap((s) => s.items);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="max-w-2xl mx-auto p-6 space-y-6">

        {/* Header */}
        <header>
          <h1 className="text-2xl font-black text-gray-800">Practice 📚</h1>
          <p className="text-sm text-slate-500 mt-1">Choose a topic to start your session</p>
        </header>

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-slate-100" />
            ))}
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="text-center py-10 bg-white rounded-3xl border border-red-100 shadow-sm">
            <p className="text-2xl mb-2">⚠️</p>
            <p className="font-bold text-gray-700 mb-4">Couldn&apos;t load topics</p>
            <a
              href="/practice"
              className="inline-block bg-indigo-600 text-white px-6 py-2.5 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition"
            >
              Try Again
            </a>
          </div>
        )}

        {/* Topic grid */}
        {!loading && !error && allItems.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allItems.map((item) => (
              <Link
                key={item.topicId}
                href={`/practice?topicId=${item.topicId}`}
                className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all group"
              >
                <div className="text-2xl mb-2">📚</div>
                <p className="font-bold text-gray-800 text-sm leading-snug group-hover:text-indigo-700 transition">
                  {item.topicName}
                </p>
                {item.reason && (
                  <p className="text-xs text-slate-400 mt-0.5 capitalize">
                    {item.reason.replace(/_/g, " ")}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Empty — topics are being generated (happens on first login) */}
        {!loading && !error && allItems.length === 0 && (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-4xl mb-3">⏳</p>
            <p className="font-bold text-gray-700 mb-2">Your topics are being prepared…</p>
            <p className="text-sm text-slate-400 mb-5">
              This only takes a moment. Refresh the page to check — or ask MathAI a question while you wait!
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="/practice"
                className="inline-block bg-indigo-600 text-white px-6 py-2.5 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition"
              >
                Refresh →
              </a>
              <Link
                href="/ask"
                className="inline-block bg-white border-2 border-indigo-200 text-indigo-600 px-6 py-2.5 rounded-2xl font-bold text-sm hover:border-indigo-400 transition"
              >
                Ask MathAI instead
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

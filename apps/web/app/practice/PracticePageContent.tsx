/**
 * @module apps/web/app/practice/PracticePageContent
 *
 * When a topicId is present in the URL → renders the practice session.
 * When no topicId → renders PracticeHub (topic picker).
 *
 * PracticeHub features:
 *  - Search/filter topics by name
 *  - Regenerate topics (calls POST /profile/regenerate-topics)
 *  - Request a custom topic (calls POST /profile/request-topic)
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams }    from "next/navigation";
import Link                   from "next/link";
import PracticeContainer      from "@/containers/PracticeContainer";
import { usePracticeMenu }    from "@/hooks/use-practice-menu";
import { clientPost }         from "@/lib/clientApi";

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
  const { menu, loading, error, refetch } = usePracticeMenu();

  const [searchQuery,    setSearchQuery]    = useState("");
  const [regenerating,   setRegenerating]   = useState(false);
  const [regenMsg,       setRegenMsg]       = useState("");
  const [addTopicInput,  setAddTopicInput]  = useState("");
  const [addingTopic,    setAddingTopic]    = useState(false);
  const [addTopicMsg,    setAddTopicMsg]    = useState<{ text: string; ok: boolean } | null>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  const sections  = menu?.sections ?? [];
  const allItems  = sections.flatMap((s) => s.items);

  // Auto-poll every 5 s while topics are empty (background generation in progress).
  // Gives up after MAX_POLLS attempts to avoid infinite loops on genuine failures.
  const MAX_POLLS = 10;
  const pollCount = useRef(0);
  useEffect(() => {
    if (loading || allItems.length > 0) {
      pollCount.current = 0; // reset counter once topics arrive
      return;
    }
    if (pollCount.current >= MAX_POLLS) return;

    const timer = setTimeout(() => {
      pollCount.current += 1;
      void refetch();
    }, 5_000);

    return () => clearTimeout(timer);
  }, [loading, allItems.length, refetch]);

  // Filter by search query
  const filtered = searchQuery.trim()
    ? allItems.filter((item) =>
        item.topicName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allItems;

  // ── Regenerate topics ──────────────────────────────────────────────────────
  const handleRegenerate = async () => {
    setRegenerating(true);
    setRegenMsg("");
    try {
      const result = await clientPost<{ topicCount: number }>(
        "/profile/regenerate-topics",
        {}
      );
      if (result) {
        setRegenMsg(`Done! ${result.topicCount} topics ready.`);
      } else {
        setRegenMsg("Something went wrong. Please try again.");
      }
      await refetch();
    } catch {
      setRegenMsg("Could not regenerate. Please try again.");
    } finally {
      setRegenerating(false);
      // Clear the success message after 4 seconds
      setTimeout(() => setRegenMsg(""), 4000);
    }
  };

  // ── Add custom topic ───────────────────────────────────────────────────────
  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    const topicName = addTopicInput.trim();
    if (!topicName) return;

    setAddingTopic(true);
    setAddTopicMsg(null);
    try {
      const result = await clientPost<{ topicId: string; topicName: string }>(
        "/profile/request-topic",
        { topicName }
      );
      if (result) {
        setAddTopicMsg({ text: `Added "${result.topicName}" — it's now at the top of your list!`, ok: true });
        setAddTopicInput("");
        await refetch();
      } else {
        setAddTopicMsg({
          text: "No matching topic found. Try a different name — or use Ask AI for any question!",
          ok: false,
        });
      }
    } catch {
      setAddTopicMsg({ text: "Could not add topic. Please try again.", ok: false });
    } finally {
      setAddingTopic(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="max-w-2xl mx-auto p-6 space-y-6">

        {/* Header */}
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-800">Practice 📚</h1>
            <p className="text-sm text-slate-500 mt-1">Choose a topic to start your session</p>
          </div>

          {/* Regenerate button — always visible once menu is loaded or errored */}
          {!loading && (
            <button
              onClick={() => void handleRegenerate()}
              disabled={regenerating}
              className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-indigo-500 border border-indigo-200 hover:border-indigo-400 hover:text-indigo-700 px-3 py-2 rounded-xl transition disabled:opacity-50 bg-white shadow-sm"
              title="Ask AI to reassign your topic list"
            >
              <span>{regenerating ? "⏳" : "🔄"}</span>
              <span className="hidden sm:inline">{regenerating ? "Refreshing…" : "Refresh topics"}</span>
            </button>
          )}
        </header>

        {/* Regen status message */}
        {regenMsg && (
          <p className="text-sm font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2">
            {regenMsg}
          </p>
        )}

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
            <button
              onClick={() => void refetch()}
              className="inline-block bg-indigo-600 text-white px-6 py-2.5 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Has topics — search + grid */}
        {!loading && !error && allItems.length > 0 && (
          <>
            {/* Search filter */}
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics…"
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl border-2 border-gray-100 focus:border-indigo-400 outline-none text-sm font-medium transition bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Topic grid */}
            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filtered.map((item) => (
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
            ) : (
              <p className="text-center text-sm text-gray-400 py-4">
                No topics match &ldquo;{searchQuery}&rdquo;. Try the search below to add it.
              </p>
            )}
          </>
        )}

        {/* Empty state — topics not yet generated */}
        {!loading && !error && allItems.length === 0 && (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-4xl mb-3">⏳</p>
            <p className="font-bold text-gray-700 mb-2">Your topics are being prepared…</p>
            <p className="text-sm text-slate-400 mb-5">
              Tap &ldquo;Refresh topics&rdquo; to generate them now, or ask MathAI a question while you wait!
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => void handleRegenerate()}
                disabled={regenerating}
                className="inline-block bg-indigo-600 text-white px-6 py-2.5 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition disabled:opacity-60"
              >
                {regenerating ? "Generating…" : "Generate my topics →"}
              </button>
              <Link
                href="/ask"
                className="inline-block bg-white border-2 border-indigo-200 text-indigo-600 px-6 py-2.5 rounded-2xl font-bold text-sm hover:border-indigo-400 transition"
              >
                Ask MathAI instead
              </Link>
            </div>
          </div>
        )}

        {/* Add a specific topic ─────────────────────────────────────────────── */}
        {!loading && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-700 text-sm mb-1">
              Want to practice something specific?
            </h2>
            <p className="text-xs text-slate-400 mb-3">
              Type a topic name and we&apos;ll add it to the top of your list.
            </p>
            <form onSubmit={(e) => void handleAddTopic(e)} className="flex gap-2">
              <input
                ref={addInputRef}
                type="text"
                value={addTopicInput}
                onChange={(e) => setAddTopicInput(e.target.value)}
                placeholder="e.g. fractions, long division, algebra…"
                className="flex-1 border-2 border-gray-100 focus:border-indigo-400 rounded-2xl px-4 py-2.5 text-sm outline-none transition"
                disabled={addingTopic}
              />
              <button
                type="submit"
                disabled={addingTopic || !addTopicInput.trim()}
                className="bg-indigo-600 text-white px-4 py-2.5 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition disabled:opacity-50 shrink-0"
              >
                {addingTopic ? "…" : "Add"}
              </button>
            </form>

            {addTopicMsg && (
              <p className={`text-xs font-semibold mt-2 ${addTopicMsg.ok ? "text-emerald-600" : "text-red-500"}`}>
                {addTopicMsg.text}
              </p>
            )}

            {!addTopicMsg && (
              <p className="text-xs text-slate-300 mt-2">
                Can&apos;t find it?{" "}
                <Link href="/ask" className="text-indigo-400 hover:underline font-semibold">
                  Ask MathAI
                </Link>{" "}
                to explain or explore any topic.
              </p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

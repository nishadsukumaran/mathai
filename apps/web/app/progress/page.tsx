/**
 * @module apps/web/app/progress/page
 *
 * Student progress summary — server component.
 */

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

async function fetchProgress(userId: string) {
  return apiFetch(`/progress/${userId}`);
}

async function fetchCurriculum(): Promise<unknown[]> {
  return (await apiFetch<unknown[]>("/curriculum")) ?? [];
}

const REASON_LABEL: Record<string, string> = {
  weak_area:         "Needs work",
  prerequisite_gap:  "Prerequisite gap",
  long_time_no_see:  "Not practised recently",
  ready_for_challenge: "Ready for a challenge",
  quest_requirement: "Quest requirement",
};

export default async function ProgressPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const userId = (session.user as { id?: string }).id ?? "user-alice-001";
  const [progress, curriculum] = await Promise.all([fetchProgress(userId), fetchCurriculum()]);

  const masteryPct = progress
    ? Math.round((progress.masteredTopics / Math.max(progress.totalTopics, 1)) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-3xl mx-auto p-6 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-gray-800">Your Progress 📈</h1>
          <p className="text-sm text-gray-400 mt-1">Track mastery, XP, and what to work on next</p>
        </div>

        {/* Key stats */}
        {progress && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-indigo-100">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Level</p>
              <p className="text-3xl font-black text-indigo-600">{progress.level}</p>
              <p className="text-sm text-gray-500">{progress.levelTitle}</p>
              <div className="mt-3 h-2 bg-indigo-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${Math.round(((progress.totalXp % 500) / 500) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{progress.xpToNextLevel} XP to next level</p>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Streak</p>
              <p className="text-3xl font-black text-orange-500">🔥 {progress.streak}</p>
              <p className="text-sm text-gray-500">days in a row</p>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-green-100">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Topics Mastered</p>
              <p className="text-3xl font-black text-green-500">{progress.masteredTopics}</p>
              <p className="text-sm text-gray-500">of {progress.totalTopics} total</p>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total XP</p>
              <p className="text-3xl font-black text-purple-500">{progress.totalXp}</p>
              <p className="text-sm text-gray-500">lifetime XP</p>
            </div>
          </div>
        )}

        {/* Mastery ring */}
        {progress && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-gray-700">Overall Mastery</p>
              <p className="text-lg font-black text-indigo-600">{masteryPct}%</p>
            </div>
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-green-500 rounded-full transition-all"
                style={{ width: `${masteryPct}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {progress.masteredTopics} mastered · {progress.totalTopics - progress.masteredTopics} remaining
            </p>
          </div>
        )}

        {/* Weak areas */}
        {progress?.weakAreas?.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-700 mb-3">Focus Areas</h2>
            <div className="space-y-3">
              {progress.weakAreas.map((area: { topicId: string; topicName: string; reason: string; priority: number }) => (
                <div key={area.topicId} className="bg-white rounded-xl p-4 shadow-sm border border-red-100 flex items-center gap-4">
                  <span className="text-2xl">🎯</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-700">{area.topicName}</p>
                    <p className="text-xs text-gray-400">{REASON_LABEL[area.reason] ?? area.reason}</p>
                  </div>
                  <Link
                    href={`/practice?topicId=${area.topicId}`}
                    className="text-sm font-bold text-indigo-600 hover:underline whitespace-nowrap"
                  >
                    Practice →
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Curriculum overview */}
        {curriculum.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-700 mb-3">All Topics</h2>
            {curriculum.map((strand: {
              strand: { id: string; name: string; iconEmoji?: string };
              topics: Array<{ id: string; name: string; isUnlocked: boolean; grade: string }>;
            }) => (
              <div key={strand.strand.id} className="mb-4">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
                  {strand.strand.iconEmoji} {strand.strand.name}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {strand.topics.map((topic) => (
                    <div
                      key={topic.id}
                      className={`rounded-xl p-3 border text-sm font-semibold ${
                        topic.isUnlocked
                          ? "bg-white border-indigo-100 text-gray-700"
                          : "bg-gray-50 border-gray-100 text-gray-400"
                      }`}
                    >
                      {topic.isUnlocked ? "✅" : "🔒"} {topic.name}
                      <span className="block text-xs font-normal text-gray-400">Grade {topic.grade}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

      </div>
    </div>
  );
}

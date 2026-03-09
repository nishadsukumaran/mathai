/**
 * @module apps/web/app/dashboard/page
 *
 * Student home screen — server component that fetches from the Express API.
 */

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

async function fetchDashboard(userId: string) {
  return apiFetch(`/dashboard/${userId}`);
}

async function fetchCurriculum(): Promise<unknown[]> {
  return (await apiFetch<unknown[]>("/curriculum")) ?? [];
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const userId = (session.user as { id?: string }).id ?? "user-alice-001";

  const [dashboard, curriculum] = await Promise.all([
    fetchDashboard(userId),
    fetchCurriculum(),
  ]);

  const student      = dashboard?.student;
  const gamification = dashboard?.gamification;
  const progress     = dashboard?.progress;
  const quests       = dashboard?.quests ?? [];

  const xpPercent = gamification
    ? Math.round(gamification.xpProgress * 100)
    : 40;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4 bg-white rounded-2xl p-5 shadow-sm border border-indigo-100">
          <div className="w-14 h-14 rounded-full bg-indigo-200 flex items-center justify-center text-2xl font-bold text-indigo-700">
            {student?.name?.[0] ?? "S"}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-800">
              Welcome back, {student?.name ?? session.user.name ?? "Explorer"}! 👋
            </h1>
            <p className="text-sm text-gray-500">Grade {student?.grade ?? "—"}</p>
          </div>
          {gamification && (
            <div className="text-center">
              <div className="text-2xl font-black text-indigo-600">Lv.{gamification.level}</div>
              <div className="text-xs text-gray-400">{progress?.levelTitle}</div>
            </div>
          )}
        </div>

        {/* XP + Streak */}
        {gamification && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-indigo-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">XP Progress</p>
              <div className="h-3 bg-indigo-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {gamification.xp} XP · {gamification.xpToNextLevel} to next level
              </p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-orange-100 flex items-center gap-3">
              <span className="text-3xl">🔥</span>
              <div>
                <p className="text-2xl font-black text-orange-500">{gamification.streak}</p>
                <p className="text-xs text-gray-400">Day streak</p>
                {gamification.hasStreakShield && (
                  <p className="text-xs text-blue-500">🛡 Shield active</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        {progress && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
              <p className="text-2xl font-black text-green-500">{progress.masteredTopics}</p>
              <p className="text-xs text-gray-400">Topics mastered</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
              <p className="text-2xl font-black text-blue-500">{progress.totalTopics}</p>
              <p className="text-xs text-gray-400">Total topics</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
              <p className="text-2xl font-black text-indigo-500">{gamification?.xp ?? 0}</p>
              <p className="text-xs text-gray-400">Total XP</p>
            </div>
          </div>
        )}

        {/* Daily Quests */}
        <section>
          <h2 className="text-lg font-bold text-gray-700 mb-3">Today&apos;s Quests</h2>
          {quests.length > 0 ? (
            <div className="space-y-3">
              {quests.map((q: {
                id: string;
                quest?: { title: string; description: string; xpReward: number; targetValue: number };
                progressValue: number;
                status: string;
              }) => {
                const target = q.quest?.targetValue ?? 1;
                const pct = Math.min(100, Math.round((q.progressValue / target) * 100));
                return (
                  <div key={q.id} className="bg-white rounded-xl p-4 shadow-sm border border-yellow-100 flex items-center gap-4">
                    <span className="text-2xl">{q.status === "completed" ? "✅" : "⚡"}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-700">{q.quest?.title}</p>
                      <p className="text-xs text-gray-400">{q.quest?.description}</p>
                      <div className="mt-2 h-2 bg-yellow-100 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {q.progressValue}/{target} · {q.quest?.xpReward} XP reward
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700 text-sm">
              No active quests right now. Check back tomorrow!
            </div>
          )}
        </section>

        {/* Recent Badges */}
        {gamification?.recentBadges?.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-700 mb-3">Recent Badges</h2>
            <div className="flex gap-3 flex-wrap">
              {gamification.recentBadges.map((b: { id: string; title: string; category: string }) => (
                <div key={b.id} className="bg-white border border-purple-100 rounded-xl p-3 text-center min-w-[90px] shadow-sm">
                  <div className="text-3xl mb-1">
                    {b.category === "accuracy" ? "🎯" : b.category === "streak" ? "🔥" : b.category === "speed" ? "⚡" : "⭐"}
                  </div>
                  <p className="text-xs font-semibold text-gray-700">{b.title}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Curriculum Topics */}
        <section>
          <h2 className="text-lg font-bold text-gray-700 mb-3">Keep Learning</h2>
          {curriculum.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {curriculum.flatMap((strand: {
                strand: { name: string };
                topics: Array<{ id: string; name: string; iconEmoji?: string; isUnlocked: boolean; grade: string }>;
              }) =>
                strand.topics.map((topic) => (
                  <Link
                    key={topic.id}
                    href={`/practice?topicId=${topic.id}`}
                    className={`bg-white border rounded-xl p-4 flex items-center gap-3 transition hover:shadow-md ${
                      topic.isUnlocked
                        ? "border-indigo-200 hover:border-indigo-400"
                        : "border-gray-100 opacity-50 pointer-events-none"
                    }`}
                  >
                    <span className="text-2xl">{topic.iconEmoji ?? "📚"}</span>
                    <div>
                      <p className="font-semibold text-sm text-gray-700">{topic.name}</p>
                      <p className="text-xs text-gray-400">{strand.strand.name} · Grade {topic.grade}</p>
                    </div>
                    {!topic.isUnlocked && <span className="ml-auto text-gray-300">🔒</span>}
                  </Link>
                ))
              ).slice(0, 6)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {["Fractions", "Multiplication", "Word Problems", "Geometry"].map((t) => (
                <div key={t} className="bg-white border border-gray-200 rounded-xl p-4 font-semibold text-gray-700">{t}</div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

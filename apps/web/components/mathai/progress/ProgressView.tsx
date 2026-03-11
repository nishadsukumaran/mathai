"use client";

/**
 * @module apps/web/components/mathai/progress/ProgressView
 *
 * Pure view component for the student progress screen.
 * Receives ProgressViewData from ProgressContainer — renders only.
 * No fetching, no state.
 */

import Link from "next/link";
import { XPBar, StreakCounter, MasteryRing, BadgeCard } from "@/components/mathai";
import type { ProgressViewData } from "@/types/contracts";

const REASON_LABEL: Record<string, string> = {
  weak_area:           "Needs work",
  prerequisite_gap:    "Prerequisite gap",
  long_time_no_see:    "Not practised recently",
  ready_for_challenge: "Ready for a challenge",
  quest_requirement:   "Quest requirement",
};

function masteryLevelFromPct(
  pct: number
): "not_started" | "emerging" | "developing" | "mastered" | "extended" {
  if (pct >= 95) return "extended";
  if (pct >= 70) return "mastered";
  if (pct >= 40) return "developing";
  if (pct > 0)   return "emerging";
  return "not_started";
}

interface Props {
  data: ProgressViewData;
}

export default function ProgressView({ data }: Props) {
  const {
    xp, streak, masteredTopics, totalTopics,
    totalXp, weakAreas, badges, curriculum,
  } = data;

  const masteryPct    = totalTopics > 0 ? Math.round((masteredTopics / totalTopics) * 100) : 0;
  const overallMastery = masteryLevelFromPct(masteryPct);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-3xl mx-auto p-6 space-y-8">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <header>
          <h1 className="text-2xl font-black text-gray-800">Your Progress 📈</h1>
          <p className="text-sm text-slate-500 mt-1">Track mastery, XP, and what to work on next</p>
        </header>

        {/* ── XP + Streak row ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {xp && <XPBar xp={xp} />}
          {streak && <StreakCounter streak={streak} />}
        </div>

        {/* ── Stats cards ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100 text-center">
            <p className="text-3xl font-black text-emerald-500">{masteredTopics}</p>
            <p className="text-xs text-slate-500 mt-1">Topics mastered</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-blue-100 text-center">
            <p className="text-3xl font-black text-blue-500">{totalTopics}</p>
            <p className="text-xs text-slate-500 mt-1">Total topics</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100 text-center">
            <p className="text-3xl font-black text-purple-500">{totalXp}</p>
            <p className="text-xs text-slate-500 mt-1">Lifetime XP</p>
          </div>
        </div>

        {/* ── Overall Mastery Ring ──────────────────────────────────────── */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-6">
            <MasteryRing level={overallMastery} size={96} showLabel>
              <span className="text-2xl font-black text-indigo-600">{masteryPct}%</span>
            </MasteryRing>
            <div className="flex-1">
              <p className="font-black text-gray-800 text-lg">Overall Mastery</p>
              <p className="text-sm text-slate-500 mt-1">
                {masteredTopics} mastered · {totalTopics - masteredTopics} remaining
              </p>
              <div className="mt-3 h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: `${masteryPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Focus Areas (weak areas) ─────────────────────────────────── */}
        {weakAreas.length > 0 && totalXp > 0 && (
          <section>
            <h2 className="text-lg font-black text-gray-800 mb-4">Focus Areas 🎯</h2>
            <div className="space-y-3">
              {weakAreas.map((area) => (
                <div
                  key={area.topicId}
                  className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-rose-100 hover:shadow-md transition-shadow"
                >
                  <MasteryRing level="emerging" size={48}>
                    <span className="text-lg">🎯</span>
                  </MasteryRing>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 truncate">{area.topicName}</p>
                    <p className="text-xs text-slate-500">{REASON_LABEL[area.reason] ?? area.reason}</p>
                  </div>
                  <Link
                    href={`/practice?topicId=${area.topicId}`}
                    className="rounded-2xl bg-indigo-600 text-white px-4 py-2 text-sm font-bold hover:bg-indigo-700 transition shrink-0"
                  >
                    Practice →
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Badges ───────────────────────────────────────────────────── */}
        {badges.length > 0 && (
          <section>
            <h2 className="text-lg font-black text-gray-800 mb-4">Badges Earned 🏅</h2>
            <div className="space-y-3">
              {badges.map((badge, i) => (
                <BadgeCard key={i} badge={badge} />
              ))}
            </div>
          </section>
        )}

        {/* ── All Topics by Strand ─────────────────────────────────────── */}
        {curriculum.length > 0 && (
          <section>
            <h2 className="text-lg font-black text-gray-800 mb-1">All Topics 📚</h2>
            <p className="text-xs text-slate-400 mb-4">
              🔒 Topics unlock as you complete earlier ones in each strand
            </p>
            {curriculum.map((strand) => (
              <div key={strand.strand.id} className="mb-6">
                <p className="text-sm font-black text-slate-600 uppercase tracking-widest mb-3">
                  {strand.strand.iconEmoji} {strand.strand.name}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {strand.topics.map((topic) => (
                    <Link
                      key={topic.id}
                      href={topic.isUnlocked ? `/practice?topicId=${topic.id}` : "#"}
                      className={`flex items-center gap-3 rounded-2xl p-4 border transition-all ${
                        topic.isUnlocked
                          ? "bg-white border-indigo-100 shadow-sm hover:shadow-md hover:border-indigo-300"
                          : "bg-slate-50 border-slate-100 opacity-60 pointer-events-none"
                      }`}
                    >
                      <MasteryRing
                        level={topic.masteryLevel ?? "not_started"}
                        size={36}
                      >
                        <span className="text-sm">{topic.isUnlocked ? "✅" : "🔒"}</span>
                      </MasteryRing>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-gray-800 truncate">{topic.name}</p>
                        <p className="text-xs text-slate-400">Grade {topic.grade}</p>
                      </div>
                    </Link>
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

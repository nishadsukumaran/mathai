"use client";

/**
 * @module apps/web/components/mathai/progress/ProgressView
 *
 * Student progress screen — clean card-based layout with visual mastery grid.
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

function masteryLevelFromPct(pct: number) {
  if (pct >= 95) return "extended" as const;
  if (pct >= 70) return "mastered" as const;
  if (pct >= 40) return "developing" as const;
  if (pct > 0)   return "emerging" as const;
  return "not_started" as const;
}

const MASTERY_COLOR: Record<string, string> = {
  not_started: "bg-gray-100",
  emerging:    "bg-amber-400",
  developing:  "bg-indigo-400",
  mastered:    "bg-emerald-500",
  extended:    "bg-purple-500",
};

interface Props {
  data: ProgressViewData;
}

export default function ProgressView({ data }: Props) {
  const { xp, streak, masteredTopics, totalTopics, totalXp, weakAreas, badges, curriculum } = data;
  const masteryPct = totalTopics > 0 ? Math.round((masteredTopics / totalTopics) * 100) : 0;
  const overallMastery = masteryLevelFromPct(masteryPct);

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Header ────────────────────────────────────────────────── */}
        <header>
          <h1 className="text-xl font-bold text-gray-900">Your Progress</h1>
          <p className="text-xs text-gray-500 mt-0.5">Track mastery, XP, and what to work on next</p>
        </header>

        {/* ── Empty state for brand new students ─────────────────── */}
        {totalXp === 0 && (
          <div className="bg-white rounded-xl p-8 border border-gray-100 text-center">
            <p className="text-4xl mb-3">📊</p>
            <p className="font-semibold text-gray-700 text-sm">No progress yet</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">Your journey begins with one question.</p>
            <a href="/practice" className="inline-block bg-indigo-600 text-white px-5 py-2 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition active:scale-[0.98]">
              Start Practising →
            </a>
          </div>
        )}

        {/* ── Stat cards ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <p className="text-2xl font-bold text-indigo-600">{masteryPct}%</p>
            <p className="text-[10px] text-gray-400 font-medium uppercase">Mastery</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <p className="text-2xl font-bold text-emerald-500">{masteredTopics}</p>
            <p className="text-[10px] text-gray-400 font-medium uppercase">Mastered</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <p className="text-2xl font-bold text-orange-500">{streak?.currentStreak ?? 0}</p>
            <p className="text-[10px] text-gray-400 font-medium uppercase">Streak</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <p className="text-2xl font-bold text-purple-600">{totalXp}</p>
            <p className="text-[10px] text-gray-400 font-medium uppercase">XP</p>
          </div>
        </div>

        {/* ── XP + Streak detail ──────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {xp && <XPBar xp={xp} />}
          {streak && <StreakCounter streak={streak} />}
        </div>

        {/* ── Overall Mastery ──────────────────────────────────────── */}
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-5">
            <MasteryRing level={overallMastery} size={80} showLabel>
              <span className="text-xl font-bold text-indigo-600">{masteryPct}%</span>
            </MasteryRing>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Overall Mastery</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {masteredTopics} mastered · {totalTopics - masteredTopics} remaining
              </p>
              <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-700" style={{ width: `${masteryPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Focus Areas ──────────────────────────────────────────── */}
        {weakAreas.length > 0 && totalXp > 0 && (
          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Focus Areas</p>
            <div className="space-y-2">
              {weakAreas.map((area) => (
                <div key={area.topicId} className="flex items-center gap-3 bg-white rounded-xl p-3.5 border border-gray-100 hover:border-indigo-200 transition">
                  <MasteryRing level="emerging" size={40}>
                    <span className="text-sm">🎯</span>
                  </MasteryRing>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{area.topicName}</p>
                    <p className="text-[10px] text-gray-400">{REASON_LABEL[area.reason] ?? area.reason}</p>
                  </div>
                  <Link href={`/practice?topicId=${area.topicId}`}
                    className="rounded-lg bg-indigo-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-indigo-700 transition shrink-0">
                    Practice
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Badges ───────────────────────────────────────────────── */}
        {badges.length > 0 && (
          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Badges Earned</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {badges.map((badge, i) => (
                <BadgeCard key={i} badge={badge} />
              ))}
            </div>
          </section>
        )}

        {/* ── Concept Mastery Grid ─────────────────────────────────── */}
        {curriculum.length > 0 && (
          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">All Topics</p>
            <p className="text-[10px] text-gray-300 mb-3">🔒 Topics unlock as you progress</p>

            {/* Color legend */}
            <div className="flex gap-3 mb-4 flex-wrap">
              {[
                { label: "Not started", color: "bg-gray-200" },
                { label: "Emerging",    color: "bg-amber-400" },
                { label: "Developing",  color: "bg-indigo-400" },
                { label: "Mastered",    color: "bg-emerald-500" },
              ].map((l) => (
                <span key={l.label} className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-sm ${l.color}`} />
                  <span className="text-[10px] text-gray-400">{l.label}</span>
                </span>
              ))}
            </div>

            {curriculum.map((strand) => (
              <div key={strand.strand.id} className="mb-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {strand.strand.iconEmoji} {strand.strand.name}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {strand.topics.map((topic) => {
                    const color = MASTERY_COLOR[topic.masteryLevel ?? "not_started"] ?? "bg-gray-100";
                    return (
                      <Link
                        key={topic.id}
                        href={topic.isUnlocked ? `/practice?topicId=${topic.id}` : "#"}
                        className={`rounded-xl p-3 border transition-all ${
                          topic.isUnlocked
                            ? "bg-white border-gray-100 hover:border-indigo-200 hover:shadow-sm"
                            : "bg-gray-50 border-gray-100 opacity-50 pointer-events-none"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-2.5 h-2.5 rounded-sm shrink-0 ${color}`} />
                          <span className="text-xs text-gray-400">
                            {topic.isUnlocked ? "✅" : "🔒"}
                          </span>
                        </div>
                        <p className="font-medium text-xs text-gray-800 truncate">{topic.name}</p>
                        <p className="text-[10px] text-gray-300 mt-0.5">Grade {topic.grade}</p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        )}

      </div>
    </div>
  );
}

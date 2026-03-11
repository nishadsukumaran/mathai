"use client";

/**
 * @module apps/web/app/dashboard/DashboardView
 *
 * Presentation layer for the student dashboard. Uses the v0-designed
 * MathAI components for a rich, gamified visual experience.
 * Data is passed in from the server component page — no fetching here.
 *
 * Layout (top → bottom):
 *   1. Header: avatar + name + profile button + compact XP
 *   2. XP bar (full) + Streak row
 *   3. Ask MathAI card  ← NEW
 *   4. Daily Quests
 *   5. Practice for You (PracticeMenuView)  ← NEW
 *   6. Recent Badges
 *   7. Keep Learning — Topic Grid
 */

import { useState }   from "react";
import Link            from "next/link";
import {
  XPBar,
  StreakCounter,
  QuestCard,
  BadgeChip,
  TopicCard,
}                      from "@/components/mathai";
import { AskCard }                  from "@/components/mathai/ask-card";
import { ProfileModalConnected }    from "@/components/mathai/profile-modal-connected";
import { PracticeMenuConnected }    from "@/components/mathai/practice-menu-connected";
import type {
  XPStatus,
  StreakStatus,
  DailyQuest,
  EarnedBadge,
  TopicSummary,
  Grade,
} from "@/types";

/* ─── Props ────────────────────────────────────────────────────────────────── */

interface DashboardViewProps {
  studentName: string;
  grade:       string;
  xp:          XPStatus | null;
  streak:      StreakStatus | null;
  quests:      DailyQuest[];
  badges:      EarnedBadge[];
  topics:      TopicSummary[];
}

/* ─── Component ────────────────────────────────────────────────────────────── */

export default function DashboardView({
  studentName,
  grade,
  xp,
  streak,
  quests,
  badges,
  topics,
}: DashboardViewProps) {
  const [profileOpen, setProfileOpen] = useState(false);

  // Normalise grade to Grade type — server passes e.g. "4" or "G4"
  const gradeEnum = (grade.startsWith("G") ? grade : `G${grade}`) as Grade;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto p-6 space-y-8">

        {/* ── 1. Header ────────────────────────────────────────────────── */}
        <header className="flex items-center gap-4 bg-white rounded-3xl p-6 shadow-md border border-indigo-100/60">
          {/* Avatar — tap to open profile */}
          <button
            onClick={() => setProfileOpen(true)}
            className="relative w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-3xl font-black text-white shadow-lg hover:scale-105 transition-transform"
            aria-label="Open profile"
          >
            {studentName?.[0]?.toUpperCase() ?? "S"}
            {/* Profile edit hint */}
            <span className="absolute -bottom-1 -right-1 bg-white rounded-full text-xs p-0.5 shadow border border-indigo-100">
              ✏️
            </span>
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black text-gray-800 truncate">
              Welcome back, {studentName}! 👋
            </h1>
            <p className="text-sm text-slate-500">Grade {grade}</p>
          </div>

          {xp && (
            <div className="hidden sm:block">
              <XPBar xp={xp} compact />
            </div>
          )}
        </header>

        {/* ── 2. XP bar (full, mobile) + Streak row ───────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {xp && <XPBar xp={xp} />}
          {streak && <StreakCounter streak={streak} />}
        </div>

        {/* ── 3. Ask MathAI ────────────────────────────────────────────── */}
        <AskCard grade={gradeEnum} />

        {/* ── 4. Daily Quests ──────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-gray-800">Today&apos;s Quests ⚡</h2>
            <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">
              {quests.filter((q) => q.completedAt).length}/{quests.length} done
            </span>
          </div>
          {quests.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quests.map((quest, i) => (
                <QuestCard key={i} quest={quest} />
              ))}
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-700 text-sm text-center">
              No active quests right now — check back tomorrow! 🌟
            </div>
          )}
        </section>

        {/* ── 5. Practice for You ──────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-gray-800">Practice for You 🎯</h2>
            <Link
              href="/practice"
              className="text-xs font-bold text-indigo-500 hover:text-indigo-700 transition"
            >
              See All →
            </Link>
          </div>
          {/* Wave 2: fetches real menu from GET /api/practice/menu */}
          <PracticeMenuConnected />
        </section>

        {/* ── 6. Recent Badges ─────────────────────────────────────────── */}
        {badges.length > 0 && (
          <section>
            <h2 className="text-lg font-black text-gray-800 mb-4">Recent Badges 🏅</h2>
            <div className="flex gap-5 flex-wrap bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              {badges.map((badge, i) => (
                <BadgeChip key={i} badge={badge} size="lg" />
              ))}
            </div>
          </section>
        )}

        {/* ── 7. Keep Learning — Topic Grid ───────────────────────────── */}
        <section>
          <h2 className="text-lg font-black text-gray-800 mb-4">Keep Learning 📚</h2>
          {topics.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {topics.slice(0, 6).map((topic, i) => (
                <Link key={i} href={`/practice?topicId=${topic.iconSlug || "topic"}`}>
                  <TopicCard topic={topic} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {["Fractions", "Multiplication", "Word Problems", "Geometry", "Decimals", "Algebra"].map((t) => (
                <div
                  key={t}
                  className="rounded-3xl bg-white p-6 shadow-md border border-slate-100 text-center"
                >
                  <div className="text-3xl mb-2">📚</div>
                  <p className="font-bold text-gray-700">{t}</p>
                  <p className="text-xs text-slate-400 mt-1">Coming soon</p>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>

      {/* ── Profile modal (portal-style overlay) ─────────────────────── */}
      {profileOpen && (
        <ProfileModalConnected
          onClose={() => setProfileOpen(false)}
        />
      )}
    </div>
  );
}

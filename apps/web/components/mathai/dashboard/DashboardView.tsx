"use client";

/**
 * @module apps/web/components/mathai/dashboard/DashboardView
 *
 * Pure view component for the student home screen.
 * Receives DashboardViewData from DashboardContainer (server) as props.
 * Client-side data (profile, practice menu) is fetched via hooks — this
 * keeps the hot path (auth + core dashboard) fully server-rendered while
 * personalised sections hydrate client-side without blocking the page.
 *
 * Layout — 5 core product actions:
 *   Header        — avatar, name, grade, compact XP strip
 *   1. Continue Learning      — most recent/in-progress topic
 *   2. Ask MathAI             — AskCard (already built)
 *   3. Recommended Practice   — top 3 items from practice menu
 *   4. Daily Mission          — quests + streak combined
 *   5. Progress Summary       — compact XP level + mastery count → /progress
 *
 * Secondary content (badges, full topic grid) lives on /progress and /practice.
 */

import { useState }       from "react";
import Link               from "next/link";
import { XPBar, StreakCounter, QuestCard } from "@/components/mathai";
import { AskCard }         from "@/components/mathai/ask-card";
import { ProfileModal }    from "@/components/mathai/profile-modal";
import { useProfile }      from "@/hooks/use-profile";
import { usePracticeMenu } from "@/hooks/use-practice-menu";

import type { DashboardViewData } from "@/types/contracts";
import type { Grade }             from "@/types";

/* ─── Props ────────────────────────────────────────────────────────────────── */

interface Props {
  data: DashboardViewData;
}

/* ─── Component ────────────────────────────────────────────────────────────── */

export default function DashboardView({ data }: Props) {
  const { student, xp, streak, continueLearning, dailyMission, progressSummary } = data;

  const [profileOpen, setProfileOpen] = useState(false);

  // Client-side: profile (for modal) + practice menu (for recommended section)
  const { profile, loading: profileLoading, save: saveProfile } = useProfile();
  const { menu, loading: menuLoading } = usePracticeMenu();

  // Derive grade for AskCard — normalise "4" → "G4"
  const gradeEnum = (student.grade.startsWith("G") ? student.grade : `G${student.grade}`) as Grade;

  // Top 3 recommended items from the first non-empty section
  const recommendedItems = (menu?.sections ?? [])
    .flatMap((s) => s.items)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto p-6 space-y-8">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <header className="flex items-center gap-4 bg-white rounded-3xl p-6 shadow-md border border-indigo-100/60">
          {/* Avatar — tap to open profile modal */}
          <button
            onClick={() => setProfileOpen(true)}
            className="relative w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-3xl font-black text-white shadow-lg hover:scale-105 transition-transform"
            aria-label="Open profile"
          >
            {student.name?.[0]?.toUpperCase() ?? "S"}
            <span className="absolute -bottom-1 -right-1 bg-white rounded-full text-xs p-0.5 shadow border border-indigo-100">
              ✏️
            </span>
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black text-gray-800 truncate">
              Hey {student.name}! 👋
            </h1>
            <p className="text-sm text-slate-500">Grade {student.grade}</p>
          </div>

          {xp && (
            <div className="hidden sm:block">
              <XPBar xp={xp} compact />
            </div>
          )}
        </header>

        {/* ── Getting Started — shown only to brand-new users (0 XP) ─── */}
        {progressSummary && progressSummary.totalXP === 0 && (
          <section className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-6 text-white shadow-lg">
            <h2 className="font-black text-lg mb-1">Welcome to MathAI! 🎉</h2>
            <p className="text-indigo-200 text-sm mb-4">Here&apos;s how to get started:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                href="/progress"
                className="bg-white/15 hover:bg-white/25 rounded-2xl p-4 transition"
              >
                <p className="text-2xl mb-1">📚</p>
                <p className="font-bold text-sm">Pick a topic</p>
                <p className="text-xs text-indigo-200 mt-0.5">Browse all topics on the Progress page</p>
              </Link>
              <Link
                href="/ask"
                className="bg-white/15 hover:bg-white/25 rounded-2xl p-4 transition"
              >
                <p className="text-2xl mb-1">🤖</p>
                <p className="font-bold text-sm">Ask MathAI</p>
                <p className="text-xs text-indigo-200 mt-0.5">Get step-by-step help on any math question</p>
              </Link>
              <Link
                href="/profile"
                className="bg-white/15 hover:bg-white/25 rounded-2xl p-4 transition"
              >
                <p className="text-2xl mb-1">⚙️</p>
                <p className="font-bold text-sm">Set your grade</p>
                <p className="text-xs text-indigo-200 mt-0.5">Personalise your learning experience</p>
              </Link>
            </div>
          </section>
        )}

        {/* ── 1. Continue Learning ────────────────────────────────────── */}
        <section>
          <h2 className="text-lg font-black text-gray-800 mb-3">Continue Learning 📖</h2>
          {continueLearning ? (
            <div className="bg-white rounded-3xl p-6 shadow-md border border-indigo-100 flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-3xl shrink-0">
                {continueLearning.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-gray-800 text-lg truncate">
                  {continueLearning.topicName}
                </p>
                <p className="text-sm text-slate-500 mt-0.5 capitalize">
                  {continueLearning.masteryLevel.replace("_", " ")}
                </p>
              </div>
              <Link
                href={`/practice?topicId=${continueLearning.topicId}`}
                className="shrink-0 bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-bold hover:bg-indigo-700 transition text-sm"
              >
                {continueLearning.ctaLabel}
              </Link>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-3xl p-6 border border-indigo-100 text-center">
              <p className="text-slate-500 mb-3">No topics started yet — let&apos;s go!</p>
              <Link
                href="/practice"
                className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-2xl font-bold hover:bg-indigo-700 transition text-sm"
              >
                Start your first lesson →
              </Link>
            </div>
          )}
        </section>

        {/* ── 2. Ask MathAI ───────────────────────────────────────────── */}
        <section>
          <h2 className="text-lg font-black text-gray-800 mb-3">Ask MathAI 🤖</h2>
          <AskCard grade={gradeEnum} />
        </section>

        {/* ── 3. Recommended Practice ─────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-black text-gray-800">Recommended Practice 🎯</h2>
            <Link
              href="/practice"
              className="text-xs font-bold text-indigo-500 hover:text-indigo-700 transition"
            >
              See All →
            </Link>
          </div>

          {menuLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : recommendedItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {recommendedItems.map((item) => (
                <Link
                  key={item.topicId}
                  href={`/practice?topicId=${item.topicId}`}
                  className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group"
                >
                  <div className="text-2xl mb-2">📚</div>
                  <p className="font-bold text-gray-800 text-sm leading-snug group-hover:text-indigo-700 transition">
                    {item.topicName}
                  </p>
                  {item.reason && (
                    <p className="text-xs text-slate-400 mt-1 capitalize">
                      {item.reason.replace(/_/g, " ")}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-700 text-sm text-center">
              Complete a few topics and we&apos;ll recommend what to practice next! 🌟
            </div>
          )}
        </section>

        {/* ── 4. Daily Mission ────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-black text-gray-800">Daily Mission ⚡</h2>
            <div className="flex items-center gap-3">
              {/* Streak inline */}
              {streak && (
                <span className="text-sm font-bold text-orange-500 bg-orange-50 px-3 py-1 rounded-full">
                  🔥 {streak.currentStreak} day streak
                </span>
              )}
              <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">
                {dailyMission.completedCount}/{dailyMission.totalCount} done
              </span>
            </div>
          </div>

          {dailyMission.quests.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {dailyMission.quests.map((quest, i) => (
                <QuestCard key={i} quest={quest} />
              ))}
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-700 text-sm text-center">
              No active quests right now — check back tomorrow! 🌟
            </div>
          )}
        </section>

        {/* ── 5. Progress Summary ─────────────────────────────────────── */}
        {progressSummary && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-black text-gray-800">Your Progress 📈</h2>
              <Link
                href="/progress"
                className="text-xs font-bold text-indigo-500 hover:text-indigo-700 transition"
              >
                Full Stats →
              </Link>
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center gap-6">
                {/* Level badge */}
                <div className="shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex flex-col items-center justify-center text-white shadow-lg">
                  <span className="text-xs font-bold opacity-80">Lvl</span>
                  <span className="text-2xl font-black leading-none">{progressSummary.level}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-800">{progressSummary.levelTitle}</p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {progressSummary.totalXP.toLocaleString()} XP total ·{" "}
                    {progressSummary.masteredTopics}/{progressSummary.totalTopics} topics mastered
                  </p>
                  {/* Mini mastery bar */}
                  {progressSummary.totalTopics > 0 && (
                    <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all"
                        style={{
                          width: `${Math.round(
                            (progressSummary.masteredTopics / progressSummary.totalTopics) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

      </div>

      {/* ── Profile modal (portal overlay) ──────────────────────────── */}
      {profileOpen && (
        <ProfileModal
          profile={profile}
          loading={profileLoading}
          onClose={() => setProfileOpen(false)}
          onSave={async (patch) => {
            await saveProfile(patch);
            setProfileOpen(false);
          }}
        />
      )}
    </div>
  );
}

"use client";

/**
 * @module apps/web/components/mathai/dashboard/DashboardView
 *
 * Student home screen — clean card-based layout with clear visual hierarchy.
 */

import { useState }       from "react";
import Link               from "next/link";
import { QuestCard }       from "@/components/mathai";
import { AskCard }         from "@/components/mathai/ask-card";
import { ProfileModal }    from "@/components/mathai/profile-modal";
import { useProfile }      from "@/hooks/use-profile";
import { usePracticeMenu } from "@/hooks/use-practice-menu";
import { NextActionCard }  from "@/components/mathai/next-action-card";
import { PetCompanion }    from "@/components/mathai/pet/PetCompanion";
import { usePetEngine }    from "@/hooks/use-pet-engine";
import { usePet }          from "@/hooks/use-pet";

import { ThemePicker }             from "@/components/mathai/ThemePicker";
import type { DashboardViewData } from "@/types/contracts";
import type { Grade }             from "@/types";

interface Props {
  data: DashboardViewData;
}

export default function DashboardView({ data }: Props) {
  const { student, xp, streak, continueLearning, dailyMission, progressSummary } = data;
  const [profileOpen, setProfileOpen] = useState(false);
  const { profile, loading: profileLoading, save: saveProfile } = useProfile();
  const { menu, loading: menuLoading } = usePracticeMenu();
  const { pet } = usePet();
  const { reaction } = usePetEngine(pet?.personality);
  const gradeEnum = (student.grade.startsWith("G") ? student.grade : `G${student.grade}`) as Grade;
  const recommendedItems = (menu?.sections ?? []).flatMap((s) => s.items).slice(0, 3);

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Header: Greeting + Stats ────────────────────────────────── */}
        <header className="space-y-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setProfileOpen(true)}
              className="relative w-12 h-12 rounded-full theme-hero-gradient flex items-center justify-center text-xl font-black text-white shadow-md hover:scale-105 transition-transform shrink-0"
              aria-label="Open profile"
            >
              {student.name?.[0]?.toUpperCase() ?? "S"}
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">
                Hey {student.name}!
              </h1>
              <p className="text-xs text-gray-500">Grade {student.grade.replace("G", "")}</p>
            </div>
            {/* Floating pet companion — no card, just the character */}
            <PetCompanion reaction={reaction} className="shrink-0 w-14 h-14 flex items-center justify-center" />
          </div>

          {/* Compact stat strip */}
          <div className="grid grid-cols-3 gap-3">
            {/* Level */}
            {progressSummary && (
              <div className="bg-white rounded-2xl p-3 border theme-stat-border text-center">
                <p className="text-lg font-bold" style={{ color: "var(--theme-stat-accent)" }}>{progressSummary.level}</p>
                <p className="text-[10px] text-gray-400 font-medium uppercase">Level</p>
              </div>
            )}
            {/* Streak */}
            <div className="bg-white rounded-2xl p-3 border theme-stat-border text-center">
              <p className="text-lg font-bold theme-streak-text">
                {streak?.currentStreak ?? 0}
              </p>
              <p className="text-[10px] text-gray-400 font-medium uppercase">Day Streak</p>
            </div>
            {/* XP */}
            {xp && (
              <div className="bg-white rounded-2xl p-3 border theme-stat-border text-center">
                <p className="text-lg font-bold theme-xp-text">{xp.totalXP}</p>
                <p className="text-[10px] text-gray-400 font-medium uppercase">Total XP</p>
              </div>
            )}
          </div>
          {/* Compact theme switcher */}
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Theme</p>
            <ThemePicker grade={gradeEnum} variant="compact" />
          </div>
        </header>

        {/* ── Getting Started (0 XP) ──────────────────────────────────── */}
        {progressSummary && progressSummary.totalXP === 0 && (
          <section className="theme-hero-gradient rounded-2xl p-5 text-white">
            <h2 className="font-bold text-base mb-1">Welcome to MathAI!</h2>
            <p className="text-indigo-200 text-xs mb-3">Pick your first action to get started.</p>
            <div className="grid grid-cols-3 gap-2">
              <Link href="/practice" className="bg-white/15 hover:bg-white/25 rounded-xl p-3 transition text-center">
                <p className="text-xl mb-0.5">📚</p>
                <p className="font-semibold text-xs">Practice</p>
              </Link>
              <Link href="/ask" className="bg-white/15 hover:bg-white/25 rounded-xl p-3 transition text-center">
                <p className="text-xl mb-0.5">🤖</p>
                <p className="font-semibold text-xs">Ask AI</p>
              </Link>
              <Link href="/profile" className="bg-white/15 hover:bg-white/25 rounded-xl p-3 transition text-center">
                <p className="text-xl mb-0.5">⚙️</p>
                <p className="font-semibold text-xs">Settings</p>
              </Link>
            </div>
          </section>
        )}

        {/* ── Continue Learning ────────────────────────────────────────── */}
        {continueLearning && (
          <Link
            href={`/practice?topicId=${continueLearning.topicId}`}
            className="block theme-accent-btn rounded-2xl p-5 shadow-md transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center text-2xl shrink-0">
                {continueLearning.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{continueLearning.topicName}</p>
                <p className="text-indigo-200 text-xs mt-0.5 capitalize">
                  {continueLearning.masteryLevel.replace("_", " ")}
                </p>
              </div>
              <span className="text-sm font-bold shrink-0">
                {continueLearning.ctaLabel} →
              </span>
            </div>
          </Link>
        )}

        {/* ── Your Next Step (Learning Brain) ─────────────────────────── */}
        <section>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Recommended</p>
          <NextActionCard />
        </section>

        {/* ── Ask MathAI ──────────────────────────────────────────────── */}
        <section>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Ask a Question</p>
          <AskCard grade={gradeEnum} />
        </section>

        {/* ── Recommended Practice ─────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Practice Topics</p>
            <Link href="/practice" className="text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition">
              See All →
            </Link>
          </div>

          {menuLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-white rounded-xl animate-pulse border border-gray-100" />
              ))}
            </div>
          ) : recommendedItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {recommendedItems.map((item) => (
                <Link
                  key={item.topicId}
                  href={`/practice?topicId=${item.topicId}&mode=${item.suggestedMode ?? "guided"}`}
                  className="bg-white rounded-xl p-4 border border-gray-100 hover:border-indigo-200 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-lg">📚</span>
                    {item.masteryLevel && item.masteryLevel !== "not_started" && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500 capitalize">
                        {item.masteryLevel.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-gray-800 text-sm leading-snug group-hover:text-indigo-600 transition">
                    {item.topicName || "Practice Topic"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                    {item.reason ? item.reason.replace(/_/g, " ") : "Tap to start"}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <Link href="/practice" className="block bg-white border border-dashed rounded-xl p-6 text-center transition" style={{ borderColor: "var(--theme-accent-soft)" }}>
              <p className="text-2xl mb-1 theme-empty-icon">🚀</p>
              <p className="font-semibold text-sm" style={{ color: "var(--theme-accent)" }}>Start your first practice session</p>
            </Link>
          )}
        </section>

        {/* ── Daily Mission ───────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Daily Quests</p>
            <span className="text-xs font-semibold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md">
              {dailyMission.completedCount}/{dailyMission.totalCount}
            </span>
          </div>

          {dailyMission.quests.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {dailyMission.quests.map((quest, i) => (
                <QuestCard key={i} quest={quest} />
              ))}
            </div>
          ) : (
            <div className="bg-white border rounded-xl p-5 text-center theme-stat-border">
              <p className="theme-empty-icon text-2xl mb-1">✨</p>
              <p className="text-gray-400 text-sm">No active quests — check back tomorrow!</p>
            </div>
          )}
        </section>

        {/* ── Progress Summary ─────────────────────────────────────────── */}
        {progressSummary && (
          <Link href="/progress" className="block bg-white rounded-xl p-4 border border-gray-100 hover:border-indigo-200 transition-all">
            <div className="flex items-center gap-4">
              <div className="shrink-0 w-12 h-12 rounded-xl theme-hero-gradient flex flex-col items-center justify-center text-white">
                <span className="text-[10px] font-semibold opacity-80">Lvl</span>
                <span className="text-lg font-bold leading-none">{progressSummary.level}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm">{progressSummary.levelTitle}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {progressSummary.totalXP.toLocaleString()} XP · {progressSummary.masteredTopics}/{progressSummary.totalTopics} mastered
                </p>
                {progressSummary.totalTopics > 0 && (
                  <div className="mt-1.5 h-1.5 theme-progress-track rounded-full overflow-hidden">
                    <div
                      className="h-full theme-progress-bar rounded-full transition-all"
                      style={{ width: `${Math.round((progressSummary.masteredTopics / progressSummary.totalTopics) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
              <span className="text-gray-300 text-sm">→</span>
            </div>
          </Link>
        )}

      </div>

      {/* ── Profile modal ──────────────────────────────────────────── */}
      {profileOpen && (
        <ProfileModal
          profile={profile}
          loading={profileLoading}
          onClose={() => setProfileOpen(false)}
          onSave={async (patch) => { await saveProfile(patch); setProfileOpen(false); }}
        />
      )}
    </div>
  );
}

"use client";

/**
 * @module apps/web/app/leaderboard/LeaderboardView
 *
 * Presentation layer for the leaderboard page.
 * Uses v0-designed MathAI components for a rich, gamified experience.
 */

import { XPBar, StreakCounter } from "@/components/mathai";
import type { XPStatus, StreakStatus } from "@/types";

/* ─── Types ────────────────────────────────────────────────────────────────── */

interface LeaderboardEntry {
  rank: number;
  name: string;
  xp: number;
  level: number;
  streak: number;
  avatar: string;
}

interface LeaderboardViewProps {
  xp: XPStatus | null;
  streak: StreakStatus | null;
  userName: string;
  entries: LeaderboardEntry[];
}

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

const RANK_MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

const RANK_STYLES: Record<number, string> = {
  1: "border-yellow-300 bg-gradient-to-br from-yellow-50 to-amber-50 shadow-md",
  2: "border-slate-300 bg-gradient-to-br from-slate-50 to-gray-50",
  3: "border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50",
};

/* ─── Component ────────────────────────────────────────────────────────────── */

export default function LeaderboardView({
  xp,
  streak,
  userName,
  entries,
}: LeaderboardViewProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50">
      <div className="max-w-2xl mx-auto p-6 space-y-8">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <header className="text-center">
          <h1 className="text-3xl font-black text-gray-800">Leaderboard 🏆</h1>
          <p className="text-sm text-slate-500 mt-1">Top mathematicians this week</p>
          <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-700 text-xs font-bold">
            🔮 Sample data — live rankings coming soon
          </span>
        </header>

        {/* ── Your stats row ───────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl">
              👤
            </div>
            <div className="flex-1">
              <p className="font-black text-lg">{userName}</p>
              <p className="text-indigo-200 text-sm">Keep climbing the ranks!</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {xp && <XPBar xp={xp} />}
            {streak && <StreakCounter streak={streak} />}
          </div>
        </div>

        {/* ── Podium (top 3) ───────────────────────────────────────────── */}
        {entries.length >= 3 && (
          <div className="flex items-end justify-center gap-3 py-4">
            {/* 2nd place */}
            <PodiumCard entry={entries[1]!} height="h-28" />
            {/* 1st place */}
            <PodiumCard entry={entries[0]!} height="h-36" crown />
            {/* 3rd place */}
            <PodiumCard entry={entries[2]!} height="h-24" />
          </div>
        )}

        {/* ── Full rankings ────────────────────────────────────────────── */}
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.rank}
              className={`rounded-2xl p-4 border flex items-center gap-4 transition-all hover:shadow-md ${
                RANK_STYLES[entry.rank] ?? "bg-white border-gray-100 shadow-sm"
              }`}
            >
              <div className="w-10 text-center">
                {RANK_MEDALS[entry.rank] ? (
                  <span className="text-2xl">{RANK_MEDALS[entry.rank]}</span>
                ) : (
                  <span className="text-lg font-black text-slate-400">
                    {entry.rank}
                  </span>
                )}
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-xl">
                {entry.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 truncate">{entry.name}</p>
                <p className="text-xs text-slate-400">
                  Level {entry.level} · 🔥 {entry.streak} day streak
                </p>
              </div>
              <div className="text-right">
                <p className="font-black text-indigo-600 text-lg">{entry.xp}</p>
                <p className="text-xs text-slate-400">XP</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Footer note ──────────────────────────────────────────────── */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center text-sm text-blue-600">
          🔮 Real-time leaderboard coming soon — as more students join, rankings update live!
        </div>

      </div>
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────────────────────────────── */

function PodiumCard({
  entry,
  height,
  crown,
}: {
  entry: LeaderboardEntry;
  height: string;
  crown?: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      {crown && <span className="text-2xl mb-1">👑</span>}
      <div className="w-14 h-14 rounded-full bg-white border-2 border-indigo-200 flex items-center justify-center text-2xl shadow-sm">
        {entry.avatar}
      </div>
      <p className="font-black text-sm text-gray-800 mt-2">{entry.name}</p>
      <p className="text-xs text-indigo-600 font-bold">{entry.xp} XP</p>
      <div
        className={`${height} w-20 bg-gradient-to-t from-indigo-200 to-indigo-100 rounded-t-xl mt-2 flex items-end justify-center pb-2`}
      >
        <span className="text-2xl">{RANK_MEDALS[entry.rank]}</span>
      </div>
    </div>
  );
}

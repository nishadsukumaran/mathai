/**
 * @module apps/web/app/leaderboard/page
 *
 * Leaderboard page — server component that fetches gamification data
 * and passes it to the LeaderboardView presentation component.
 */

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import LeaderboardView from "./LeaderboardView";
import type { XPStatus, StreakStatus } from "@/types";

/* ─── API fetchers ─────────────────────────────────────────────────────────── */

async function fetchGamification(_userId: string) {
  return apiFetch("/gamification/dashboard");
}

/* ─── Mock leaderboard data until the API grows a real endpoint ─────────── */

const MOCK_LEADERBOARD = [
  { rank: 1, name: "Alice",  xp: 850, level: 4, streak: 7,  avatar: "🚀" },
  { rank: 2, name: "Marcus", xp: 720, level: 3, streak: 5,  avatar: "⭐" },
  { rank: 3, name: "Priya",  xp: 680, level: 3, streak: 12, avatar: "🌟" },
  { rank: 4, name: "Leo",    xp: 540, level: 2, streak: 3,  avatar: "🎯" },
  { rank: 5, name: "Zoe",    xp: 490, level: 2, streak: 1,  avatar: "🏆" },
];

/* ─── Data mappers ─────────────────────────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapXP(gamification: any): XPStatus | null {
  if (!gamification) return null;
  const xpInLevel = gamification.xp ?? 0;
  const xpToNext = gamification.xpToNextLevel ?? 500;
  return {
    level: gamification.level ?? 1,
    levelTitle: "Explorer",
    xpInLevel,
    xpToNextLevel: xpToNext,
    progressPct: gamification.xpProgress
      ? Math.round(gamification.xpProgress * 100)
      : Math.round((xpInLevel / Math.max(xpToNext, 1)) * 100),
    totalXP: gamification.xp ?? 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapStreak(gamification: any): StreakStatus | null {
  if (!gamification) return null;
  return {
    currentStreak:  gamification.streak ?? 0,
    longestStreak:  gamification.longestStreak ?? gamification.streak ?? 0,
    lastActiveDate: gamification.lastActiveDate ?? new Date().toISOString().split("T")[0]!,
    shieldActive:   gamification.hasStreakShield ?? false,
  };
}

/* ─── Page ─────────────────────────────────────────────────────────────────── */

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const userId = (session.user as { id?: string }).id ?? "user-alice-001";
  const gamification = await fetchGamification(userId);

  return (
    <LeaderboardView
      xp={mapXP(gamification)}
      streak={mapStreak(gamification)}
      userName={session.user?.name ?? "Explorer"}
      entries={MOCK_LEADERBOARD}
    />
  );
}

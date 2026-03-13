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

/* ─── Level titles — must stay in sync with services/gamification/xp_engine.ts */

const LEVEL_TITLES: Record<number, string> = {
  1:  "Math Seedling",
  2:  "Number Explorer",
  3:  "Problem Solver",
  4:  "Equation Hunter",
  5:  "Fraction Fighter",
  6:  "Math Navigator",
  7:  "Logic Master",
  8:  "Number Ninja",
  9:  "Math Wizard",
  10: "Math Champion",
};

function getLevelTitle(level: number): string {
  return LEVEL_TITLES[level] ?? LEVEL_TITLES[10] ?? "Math Champion";
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
  const level = gamification.level ?? 1;
  return {
    level,
    levelTitle: getLevelTitle(level),
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

  const userId = session.user.id;
  if (!userId) redirect("/auth/signin");

  const gamification = await fetchGamification(userId) as Record<string, unknown> | null;

  // Build current-user entry and insert into the ranked list at the correct position.
  const userName  = session.user?.name ?? "You";
  const userXP    = (gamification?.["xp"] as number | undefined) ?? 0;
  const userLevel = (gamification?.["level"] as number | undefined) ?? 1;
  const userStreak = (gamification?.["streak"] as number | undefined) ?? 0;

  const userEntry = {
    rank:   0,         // placeholder — will be overwritten below
    name:   userName,
    xp:     userXP,
    level:  userLevel,
    streak: userStreak,
    avatar: "🧑‍🎓",
    isCurrentUser: true,
  };

  // Merge current user into mock list, sort by XP desc, then re-rank.
  const allEntries = [
    ...MOCK_LEADERBOARD.map((e) => ({ ...e, isCurrentUser: false })),
    userEntry,
  ]
    .sort((a, b) => b.xp - a.xp)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  return (
    <LeaderboardView
      xp={mapXP(gamification)}
      streak={mapStreak(gamification)}
      userName={userName}
      entries={allEntries}
    />
  );
}

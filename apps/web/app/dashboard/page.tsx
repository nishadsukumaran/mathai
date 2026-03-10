/**
 * @module apps/web/app/dashboard/page
 *
 * Student home screen — server component that fetches data from the Express
 * API and passes it to the DashboardView presentation component.
 *
 * All data-fetching lives here; DashboardView is purely presentational
 * and uses the v0-designed MathAI component library.
 */

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import DashboardView from "./DashboardView";
import type { XPStatus, StreakStatus, DailyQuest, EarnedBadge, TopicSummary } from "@/types";

/* ─── API fetchers ─────────────────────────────────────────────────────────── */

async function fetchDashboard(userId: string) {
  return apiFetch(`/dashboard/${userId}`);
}

async function fetchCurriculum(): Promise<unknown[]> {
  return (await apiFetch<unknown[]>("/curriculum")) ?? [];
}

/* ─── Data mappers: raw API → v0 component prop types ──────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapXP(gamification: any, progress: any): XPStatus | null {
  if (!gamification) return null;
  const xpInLevel = gamification.xp ?? 0;
  const xpToNext = gamification.xpToNextLevel ?? 500;
  return {
    level: gamification.level ?? 1,
    levelTitle: progress?.levelTitle ?? "Explorer",
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
    currentStreak: gamification.streak ?? 0,
    longestStreak: gamification.longestStreak ?? gamification.streak ?? 0,
    shieldActive: gamification.hasStreakShield ?? false,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapQuests(quests: any[]): DailyQuest[] {
  return quests.map((q) => ({
    id: q.id,
    title: q.quest?.title ?? "Quest",
    description: q.quest?.description ?? "",
    currentCount: q.progressValue ?? 0,
    targetCount: q.quest?.targetValue ?? 1,
    xpReward: q.quest?.xpReward ?? 0,
    completedAt: q.status === "completed" ? new Date().toISOString() : null,
  }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapBadges(badges: any[]): EarnedBadge[] {
  return badges.map((b) => ({
    id: b.id,
    name: b.title ?? b.name ?? "Badge",
    description: b.description ?? `${b.category} badge`,
    category: b.category ?? "mastery",
    iconUrl: b.iconUrl ?? undefined,
    earnedAt: b.earnedAt ?? new Date().toISOString(),
    xpBonus: b.xpBonus ?? 10,
  }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTopics(curriculum: any[]): TopicSummary[] {
  const topics: TopicSummary[] = [];
  for (const strand of curriculum) {
    if (!strand?.topics) continue;
    for (const topic of strand.topics) {
      topics.push({
        id: topic.id,
        name: topic.name,
        description: topic.description ?? `${strand.strand?.name ?? ""} topic`,
        iconSlug: topic.id,
        masteryLevel: topic.masteryLevel ?? "not_started",
        isUnlocked: topic.isUnlocked ?? true,
        lessonCount: topic.lessonCount ?? 5,
      });
    }
  }
  return topics;
}

/* ─── Page ─────────────────────────────────────────────────────────────────── */

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const userId = (session.user as { id?: string }).id ?? "user-alice-001";

  const [dashboard, curriculum] = await Promise.all([
    fetchDashboard(userId),
    fetchCurriculum(),
  ]);

  const student = dashboard?.student;
  const gamification = dashboard?.gamification;
  const progress = dashboard?.progress;
  const rawQuests = dashboard?.quests ?? [];

  return (
    <DashboardView
      studentName={student?.name ?? session.user?.name ?? "Explorer"}
      grade={student?.grade ?? "—"}
      xp={mapXP(gamification, progress)}
      streak={mapStreak(gamification)}
      quests={mapQuests(rawQuests)}
      badges={mapBadges(gamification?.recentBadges ?? [])}
      topics={mapTopics(curriculum)}
    />
  );
}

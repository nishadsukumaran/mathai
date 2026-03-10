/**
 * @module apps/web/app/progress/page
 *
 * Student progress summary — server component that fetches data from
 * the Express API and passes it to the ProgressView presentation component.
 *
 * All data-fetching lives here; ProgressView is purely presentational
 * and uses the v0-designed MathAI component library.
 */

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import ProgressView from "./ProgressView";
import type { XPStatus, StreakStatus, EarnedBadge } from "@/types";

/* ─── API fetchers ─────────────────────────────────────────────────────────── */

async function fetchProgress(userId: string) {
  return apiFetch(`/progress/${userId}`);
}

async function fetchCurriculum(): Promise<unknown[]> {
  return (await apiFetch<unknown[]>("/curriculum")) ?? [];
}

/* ─── Data mappers: raw API → v0 component prop types ──────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapXP(progress: any): XPStatus | null {
  if (!progress) return null;
  const xpInLevel = progress.totalXp ? progress.totalXp % 500 : 0;
  const xpToNext = progress.xpToNextLevel ?? 500;
  return {
    level: progress.level ?? 1,
    levelTitle: progress.levelTitle ?? "Explorer",
    xpInLevel,
    xpToNextLevel: xpToNext,
    progressPct: Math.round((xpInLevel / Math.max(xpToNext, 1)) * 100),
    totalXP: progress.totalXp ?? 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapStreak(progress: any): StreakStatus | null {
  if (!progress) return null;
  return {
    currentStreak: progress.streak ?? 0,
    longestStreak: progress.longestStreak ?? progress.streak ?? 0,
    shieldActive: progress.hasStreakShield ?? false,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapBadges(progress: any): EarnedBadge[] {
  const badges = progress?.badges ?? progress?.recentBadges ?? [];
  return badges.map((b: any) => ({
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
function mapCurriculum(curriculum: any[]) {
  return curriculum.map((strand: any) => ({
    strand: {
      id: strand.strand?.id ?? "unknown",
      name: strand.strand?.name ?? "Strand",
      iconEmoji: strand.strand?.iconEmoji,
    },
    topics: (strand.topics ?? []).map((t: any) => ({
      id: t.id,
      name: t.name,
      isUnlocked: t.isUnlocked ?? true,
      grade: t.grade ?? "—",
      masteryLevel: t.masteryLevel,
    })),
  }));
}

/* ─── Page ─────────────────────────────────────────────────────────────────── */

export default async function ProgressPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const userId = (session.user as { id?: string }).id ?? "user-alice-001";
  const [progress, curriculum] = await Promise.all([
    fetchProgress(userId),
    fetchCurriculum(),
  ]);

  return (
    <ProgressView
      xp={mapXP(progress)}
      streak={mapStreak(progress)}
      masteredTopics={progress?.masteredTopics ?? 0}
      totalTopics={progress?.totalTopics ?? 0}
      totalXp={progress?.totalXp ?? 0}
      weakAreas={progress?.weakAreas ?? []}
      badges={mapBadges(progress)}
      curriculum={mapCurriculum(curriculum)}
    />
  );
}

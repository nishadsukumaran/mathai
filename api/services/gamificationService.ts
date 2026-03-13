/**
 * @module api/services/gamificationService
 *
 * Assembles the gamification dashboard — backed by Prisma.
 */

import { BadgeCategory, GamificationDashboard, EarnedBadge } from "@/types";
import { prisma } from "../lib/prisma";
import { xpEngine } from "../../services/gamification/xp_engine";
import { NotFoundError } from "../middlewares/error.middleware";

// Pre-fetched data passed from dashboardController to avoid duplicate queries
type GamificationCtx = {
  profile: Awaited<ReturnType<typeof prisma.studentProfile.upsert>>;
  streak:  Awaited<ReturnType<typeof prisma.streak.findUnique>>;
};

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getGamificationDashboard(userId: string, ctx?: GamificationCtx): Promise<GamificationDashboard> {
  // Use pre-fetched data from controller when available; fall back to own queries
  const profile = ctx?.profile ?? await prisma.studentProfile.upsert({
    where:  { userId },
    create: { userId },
    update: {},
  });

  // Use `ctx !== undefined` (not optional chain) so a null streak from ctx is respected
  const streak = ctx !== undefined ? ctx.streak : await prisma.streak.findUnique({ where: { userId } });

  const studentBadges = await prisma.studentBadge.findMany({
    where:   { userId },
    include: { badge: true },
    orderBy: { awardedAt: "desc" },
  });

  const totalXp    = profile.totalXp;
  const levelInfo  = xpEngine.getLevelForXP(totalXp);
  const xpProgress = xpEngine.getLevelProgress(totalXp);
  const xpToNext   = xpEngine.xpToNextLevel(totalXp);

  const recentBadges: EarnedBadge[] = studentBadges.slice(0, 3).map((sb) => ({
    // Badge fields
    id:          sb.badge.id,
    code:        sb.badge.code,
    title:       sb.badge.title,
    description: sb.badge.description,
    iconUrl:     sb.badge.iconUrl ?? undefined,
    category:    sb.badge.category as BadgeCategory,
    xpReward:    sb.badge.xpReward,
    createdAt:   sb.badge.createdAt,
    // EarnedBadge fields
    userId:      sb.userId,
    badgeId:     sb.badgeId,
    awardedAt:   sb.awardedAt,
  }));

  return {
    xp:              totalXp,
    level:           levelInfo.level,
    xpToNextLevel:   xpToNext,
    xpProgress,
    streak:          streak?.currentStreak ?? 0,
    longestStreak:   streak?.longestStreak ?? 0,
    hasStreakShield:  streak?.hasShield ?? false,
    recentBadges,
    activeQuests:    [], // populated separately by questService
  };
}

export async function getEarnedBadges(userId: string): Promise<EarnedBadge[]> {
  const rows = await prisma.studentBadge.findMany({
    where:   { userId },
    include: { badge: true },
    orderBy: { awardedAt: "desc" },
  });

  return rows.map((sb) => ({
    // Badge fields
    id:          sb.badge.id,
    code:        sb.badge.code,
    title:       sb.badge.title,
    description: sb.badge.description,
    iconUrl:     sb.badge.iconUrl ?? undefined,
    category:    sb.badge.category as BadgeCategory,
    xpReward:    sb.badge.xpReward,
    createdAt:   sb.badge.createdAt,
    // EarnedBadge fields
    userId:      sb.userId,
    badgeId:     sb.badgeId,
    awardedAt:   sb.awardedAt,
  }));
}

export async function getXPSummary(userId: string) {
  const profile = await prisma.studentProfile.findUnique({ where: { userId } });
  if (!profile) throw new NotFoundError("StudentProfile", userId);

  const levelInfo = xpEngine.getLevelForXP(profile.totalXp);
  return {
    totalXp:       profile.totalXp,
    level:         levelInfo.level,
    levelTitle:    levelInfo.label,
    xpProgress:    xpEngine.getLevelProgress(profile.totalXp),
    xpToNextLevel: xpEngine.xpToNextLevel(profile.totalXp),
  };
}

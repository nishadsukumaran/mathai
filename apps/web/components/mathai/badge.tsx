/**
 * @module components/mathai/badge
 *
 * Badge display components.
 *   - BadgeChip   — compact circular badge (for dashboard shelf, small reward displays)
 *   - BadgeCard   — larger card with description (for /progress badge collection)
 *   - LockedBadge — greyed placeholder for unearned badges
 */

import { cn, BADGE_CATEGORY_BG, formatDate } from "@/lib/utils";
import type { EarnedBadge, ComponentSize } from "@/types";

// ─── BadgeChip ────────────────────────────────────────────────────────────────

interface BadgeChipProps {
  badge:      EarnedBadge;
  size?:      ComponentSize;
  showName?:  boolean;
  className?: string;
}

const CHIP_SIZES: Record<ComponentSize, string> = {
  sm: "h-10 w-10 text-lg",
  md: "h-14 w-14 text-2xl",
  lg: "h-20 w-20 text-3xl",
};

const NAME_SIZES: Record<ComponentSize, string> = {
  sm: "text-xs",
  md: "text-xs",
  lg: "text-sm",
};

export function BadgeChip({
  badge,
  size = "md",
  showName = true,
  className,
}: BadgeChipProps) {
  return (
    <div
      className={cn("group flex flex-col items-center gap-1", className)}
      title={`${badge.name}: ${badge.description}\nEarned ${formatDate(badge.earnedAt)} · +${badge.xpBonus} XP`}
    >
      {/* Circle */}
      <div
        className={cn(
          "relative flex items-center justify-center rounded-full",
          "shadow-md transition-transform duration-200 group-hover:scale-110",
          BADGE_CATEGORY_BG[badge.category],
          CHIP_SIZES[size]
        )}
      >
        {/* Icon — use img if URL is set, else emoji fallback by category */}
        {badge.iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={badge.iconUrl}
            alt={badge.name}
            className="h-3/5 w-3/5 object-contain"
          />
        ) : (
          <span aria-hidden="true">
            {BADGE_CATEGORY_EMOJI[badge.category]}
          </span>
        )}
      </div>

      {/* Name */}
      {showName && (
        <p
          className={cn(
            "max-w-[80px] text-center font-semibold leading-tight text-gray-700",
            NAME_SIZES[size]
          )}
        >
          {badge.name}
        </p>
      )}
    </div>
  );
}

// ─── BadgeCard ────────────────────────────────────────────────────────────────

interface BadgeCardProps {
  badge:      EarnedBadge;
  className?: string;
}

export function BadgeCard({ badge, className }: BadgeCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm",
        "border border-slate-100 hover:shadow-md transition-shadow",
        className
      )}
    >
      {/* Icon circle */}
      <div
        className={cn(
          "flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl shadow",
          BADGE_CATEGORY_BG[badge.category]
        )}
      >
        {badge.iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={badge.iconUrl} alt={badge.name} className="h-8 w-8 object-contain" />
        ) : (
          <span aria-hidden="true">{BADGE_CATEGORY_EMOJI[badge.category]}</span>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-800 truncate">{badge.name}</p>
        <p className="text-xs text-slate-500 leading-snug">{badge.description}</p>
        <p className="mt-1 text-xs text-slate-400">
          Earned {formatDate(badge.earnedAt)} ·{" "}
          <span className="font-semibold text-amber-500">+{badge.xpBonus} XP</span>
        </p>
      </div>
    </div>
  );
}

// ─── LockedBadge ──────────────────────────────────────────────────────────────

interface LockedBadgeProps {
  size?:      ComponentSize;
  className?: string;
}

export function LockedBadge({ size = "md", className }: LockedBadgeProps) {
  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-full",
          "bg-slate-200 text-slate-400 shadow-inner",
          CHIP_SIZES[size]
        )}
        aria-label="Locked badge"
      >
        <span aria-hidden="true">🔒</span>
      </div>
      <p className={cn("text-center text-slate-400", NAME_SIZES[size])}>
        ???
      </p>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BADGE_CATEGORY_EMOJI: Record<EarnedBadge["category"], string> = {
  mastery:     "⭐",
  streak:      "🔥",
  session:     "🎯",
  exploration: "🗺️",
  challenge:   "💪",
  persistence: "🏆",
};

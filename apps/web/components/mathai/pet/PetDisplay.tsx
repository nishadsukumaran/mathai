"use client";
/**
 * @module components/mathai/pet/PetDisplay
 *
 * Animated pet avatar that reflects the current personality.
 *
 * - Shows the pet emoji large
 * - Applies the personality's animationClass (bounce, pulse, none)
 * - Renders an aura ring whose color matches personality.auraColor
 * - Adds a streak flame overlay during streak_champion / legendary_streak
 *
 * Size variants:
 *   "sm"  — 56px  (dashboard widget)
 *   "md"  — 80px  (profile page)
 *   "lg"  — 112px (pet home screen)
 */

import type { PersonalityEffects } from "@/types";

interface Props {
  emoji:       string;     // pet emoji from catalog
  name:        string;     // display name (pet name or catalog name)
  effects:     PersonalityEffects;
  size?:       "sm" | "md" | "lg";
  showName?:   boolean;
}

const SIZE_MAP = {
  sm:  { container: "w-14 h-14", text: "text-3xl", label: "text-xs mt-1" },
  md:  { container: "w-20 h-20", text: "text-4xl", label: "text-sm mt-1.5" },
  lg:  { container: "w-28 h-28", text: "text-6xl", label: "text-base mt-2" },
};

const AURA_COLOR_MAP: Record<string, string> = {
  yellow: "ring-yellow-300 shadow-yellow-200",
  orange: "ring-orange-300 shadow-orange-200",
  red:    "ring-red-300    shadow-red-200",
  blue:   "ring-blue-300   shadow-blue-200",
  green:  "ring-green-300  shadow-green-200",
  purple: "ring-purple-300 shadow-purple-200",
};

export function PetDisplay({ emoji, name, effects, size = "sm", showName = false }: Props) {
  const { container, text, label } = SIZE_MAP[size];
  const auraClasses = effects.auraColor
    ? `ring-2 shadow-lg ${AURA_COLOR_MAP[effects.auraColor] ?? "ring-indigo-300 shadow-indigo-200"}`
    : "";

  return (
    <div className="flex flex-col items-center select-none">
      {/* Outer aura ring + animation */}
      <div className={`relative flex items-center justify-center rounded-full bg-white ${container} ${auraClasses}`}>
        {/* Pet emoji */}
        <span
          className={`${text} ${effects.animationClass}`}
          role="img"
          aria-label={`${name} pet`}
        >
          {emoji}
        </span>

        {/* Streak overlay — shown only for streak personalities */}
        {effects.streakIcon && (
          <span className="absolute -top-1 -right-1 text-sm leading-none" aria-hidden>
            {effects.streakIcon}
          </span>
        )}

        {/* Evolved star indicator */}
        {effects.isEvolved && (
          <span className="absolute -bottom-1 -right-1 text-xs leading-none" aria-hidden>
            ⭐
          </span>
        )}
      </div>

      {showName && (
        <p className={`font-semibold text-gray-700 ${label}`}>{name}</p>
      )}
    </div>
  );
}

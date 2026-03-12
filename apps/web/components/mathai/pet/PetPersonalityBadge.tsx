"use client";
/**
 * @module components/mathai/pet/PetPersonalityBadge
 *
 * Small inline badge showing the pet's current personality.
 * Used in pet cards, profile page, and parent dashboard.
 *
 * Props:
 *   personality  — the PersonalityEffects object (label, icon, badgeColor)
 *   size         — "sm" (default) | "md"
 *   showEvolved  — whether to show the evolved star indicator
 */

import type { PersonalityEffects } from "@/types";

interface Props {
  effects:     PersonalityEffects;
  size?:       "sm" | "md";
}

export function PetPersonalityBadge({ effects, size = "sm" }: Props) {
  const textSize  = size === "md" ? "text-sm px-3 py-1"  : "text-xs px-2 py-0.5";
  const iconSize  = size === "md" ? "text-base"           : "text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-semibold ${textSize} ${effects.badgeColor}`}
      title={effects.description}
    >
      <span className={iconSize}>{effects.icon}</span>
      <span>{effects.label}</span>
    </span>
  );
}

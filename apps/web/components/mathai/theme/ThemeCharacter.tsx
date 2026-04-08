/**
 * @module apps/web/components/mathai/theme/ThemeCharacter
 *
 * Theme companion character component.
 * Displays an original character with mood-based animations.
 * Characters are designed to be non-distracting during learning.
 */

"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";
import type { CharacterMood, ThemeCharacter as CharacterType } from "@/lib/theme/types";

interface ThemeCharacterProps {
  /** Override the mood (otherwise uses idle) */
  mood?: CharacterMood;
  /** Size variant */
  size?: "sm" | "md" | "lg" | "xl";
  /** Additional class name */
  className?: string;
  /** Show character name */
  showName?: boolean;
  /** Enable floating animation */
  float?: boolean;
}

const SIZE_CLASSES = {
  sm: "w-10 h-10",
  md: "w-14 h-14",
  lg: "w-20 h-20",
  xl: "w-28 h-28",
};

const ICON_SIZES = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl",
  xl: "text-5xl",
};

/**
 * Character visual representations
 * These are simple, original designs - not resembling any existing IP
 */
const CHARACTER_VISUALS: Record<string, {
  idle: JSX.Element;
  happy: JSX.Element;
  thinking: JSX.Element;
  celebrating: JSX.Element;
  encouraging: JSX.Element;
  color: string;
  bgColor: string;
}> = {
  sparkle: {
    color: "#a855f7",
    bgColor: "#faf5ff",
    idle: <SparkleCharacter expression="neutral" />,
    happy: <SparkleCharacter expression="happy" />,
    thinking: <SparkleCharacter expression="thinking" />,
    celebrating: <SparkleCharacter expression="celebrating" />,
    encouraging: <SparkleCharacter expression="encouraging" />,
  },
  cosmo: {
    color: "#3b82f6",
    bgColor: "#eff6ff",
    idle: <CosmoCharacter expression="neutral" />,
    happy: <CosmoCharacter expression="happy" />,
    thinking: <CosmoCharacter expression="thinking" />,
    celebrating: <CosmoCharacter expression="celebrating" />,
    encouraging: <CosmoCharacter expression="encouraging" />,
  },
  pip: {
    color: "#22c55e",
    bgColor: "#f0fdf4",
    idle: <PipCharacter expression="neutral" />,
    happy: <PipCharacter expression="happy" />,
    thinking: <PipCharacter expression="thinking" />,
    celebrating: <PipCharacter expression="celebrating" />,
    encouraging: <PipCharacter expression="encouraging" />,
  },
  nova: {
    color: "#f59e0b",
    bgColor: "#fffbeb",
    idle: <NovaCharacter expression="neutral" />,
    happy: <NovaCharacter expression="happy" />,
    thinking: <NovaCharacter expression="thinking" />,
    celebrating: <NovaCharacter expression="celebrating" />,
    encouraging: <NovaCharacter expression="encouraging" />,
  },
  orbit: {
    color: "#06b6d4",
    bgColor: "#ecfeff",
    idle: <OrbitCharacter expression="neutral" />,
    happy: <OrbitCharacter expression="happy" />,
    thinking: <OrbitCharacter expression="thinking" />,
    celebrating: <OrbitCharacter expression="celebrating" />,
    encouraging: <OrbitCharacter expression="encouraging" />,
  },
};

export function ThemeCharacter({
  mood = "idle",
  size = "md",
  className,
  showName = false,
  float = false,
}: ThemeCharacterProps) {
  const { theme, animationLevel } = useTheme();
  const character = theme.character;

  if (!character) {
    return null;
  }

  const visuals = CHARACTER_VISUALS[character.id];
  if (!visuals) {
    return null;
  }

  const shouldFloat = float && animationLevel !== "minimal";

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div
        className={cn(
          SIZE_CLASSES[size],
          "rounded-full flex items-center justify-center relative overflow-hidden",
          shouldFloat && "animate-[theme-float_3s_ease-in-out_infinite]",
          mood === "celebrating" && animationLevel !== "minimal" && "animate-[theme-celebrate_0.6s_ease-in-out]"
        )}
        style={{ backgroundColor: visuals.bgColor }}
      >
        <div className={ICON_SIZES[size]}>
          {visuals[mood]}
        </div>
        
        {/* Subtle glow effect for celebrating mood */}
        {mood === "celebrating" && animationLevel !== "minimal" && (
          <div
            className="absolute inset-0 rounded-full animate-pulse opacity-30"
            style={{ backgroundColor: visuals.color }}
          />
        )}
      </div>
      
      {showName && (
        <span className="text-xs font-semibold text-gray-600">{character.name}</span>
      )}
    </div>
  );
}

// ─── Individual Character Components ─────────────────────────────────────────

type Expression = "neutral" | "happy" | "thinking" | "celebrating" | "encouraging";

interface CharacterProps {
  expression: Expression;
}

/**
 * Sparkle - A magical unicorn-inspired creature
 * Soft, round, with a single horn and sparkly mane
 */
function SparkleCharacter({ expression }: CharacterProps) {
  const getEyes = () => {
    switch (expression) {
      case "happy":
      case "celebrating":
        return (
          <>
            <path d="M7 10 Q8 8, 9 10" stroke="#6b21a8" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M15 10 Q16 8, 17 10" stroke="#6b21a8" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </>
        );
      case "thinking":
        return (
          <>
            <circle cx="8" cy="10" r="1.5" fill="#6b21a8" />
            <circle cx="16" cy="10" r="1.5" fill="#6b21a8" />
            <circle cx="9" cy="9" r="0.5" fill="white" />
            <circle cx="17" cy="9" r="0.5" fill="white" />
          </>
        );
      default:
        return (
          <>
            <circle cx="8" cy="10" r="2" fill="#6b21a8" />
            <circle cx="16" cy="10" r="2" fill="#6b21a8" />
            <circle cx="9" cy="9" r="0.8" fill="white" />
            <circle cx="17" cy="9" r="0.8" fill="white" />
          </>
        );
    }
  };

  return (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      {/* Horn */}
      <polygon points="12,1 10,6 14,6" fill="#fbbf24" />
      {/* Head */}
      <ellipse cx="12" cy="13" rx="9" ry="8" fill="#e9d5ff" />
      {/* Cheeks */}
      <circle cx="5" cy="13" r="2" fill="#f9a8d4" opacity="0.5" />
      <circle cx="19" cy="13" r="2" fill="#f9a8d4" opacity="0.5" />
      {/* Eyes */}
      {getEyes()}
      {/* Mouth */}
      {expression === "happy" || expression === "celebrating" ? (
        <path d="M10 15 Q12 17, 14 15" stroke="#6b21a8" strokeWidth="1" fill="none" strokeLinecap="round" />
      ) : expression === "thinking" ? (
        <circle cx="12" cy="15" r="1" fill="#6b21a8" />
      ) : (
        <path d="M10 15 Q12 16, 14 15" stroke="#6b21a8" strokeWidth="1" fill="none" strokeLinecap="round" />
      )}
      {/* Sparkles for celebrating */}
      {expression === "celebrating" && (
        <>
          <circle cx="3" cy="5" r="1" fill="#fbbf24" />
          <circle cx="21" cy="5" r="1" fill="#fbbf24" />
          <circle cx="2" cy="18" r="0.8" fill="#a855f7" />
          <circle cx="22" cy="18" r="0.8" fill="#a855f7" />
        </>
      )}
    </svg>
  );
}

/**
 * Cosmo - A friendly space robot
 * Round head with antenna, digital eyes
 */
function CosmoCharacter({ expression }: CharacterProps) {
  const getEyes = () => {
    switch (expression) {
      case "happy":
      case "celebrating":
        return (
          <>
            <rect x="6" y="9" width="4" height="2" rx="1" fill="#1e40af" />
            <rect x="14" y="9" width="4" height="2" rx="1" fill="#1e40af" />
          </>
        );
      case "thinking":
        return (
          <>
            <rect x="6" y="10" width="4" height="3" rx="1" fill="#1e40af" />
            <rect x="14" y="8" width="4" height="3" rx="1" fill="#1e40af" />
          </>
        );
      default:
        return (
          <>
            <rect x="6" y="9" width="4" height="4" rx="1" fill="#1e40af" />
            <rect x="14" y="9" width="4" height="4" rx="1" fill="#1e40af" />
            <rect x="7" y="10" width="2" height="1" fill="#60a5fa" />
            <rect x="15" y="10" width="2" height="1" fill="#60a5fa" />
          </>
        );
    }
  };

  return (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      {/* Antenna */}
      <line x1="12" y1="1" x2="12" y2="4" stroke="#94a3b8" strokeWidth="2" />
      <circle cx="12" cy="1" r="1.5" fill={expression === "celebrating" ? "#fbbf24" : "#3b82f6"} />
      {/* Head */}
      <circle cx="12" cy="13" r="9" fill="#dbeafe" stroke="#93c5fd" strokeWidth="1" />
      {/* Eyes */}
      {getEyes()}
      {/* Mouth panel */}
      <rect x="8" y="15" width="8" height="3" rx="1" fill="#1e3a8a" />
      {expression === "happy" || expression === "celebrating" ? (
        <path d="M9 16.5 L11 17.5 L13 16.5 L15 17.5" stroke="#60a5fa" strokeWidth="1" fill="none" />
      ) : (
        <rect x="9" y="16" width="6" height="1" fill="#60a5fa" />
      )}
      {/* Side panels */}
      <rect x="1" y="11" width="2" height="4" rx="0.5" fill="#93c5fd" />
      <rect x="21" y="11" width="2" height="4" rx="0.5" fill="#93c5fd" />
      {/* Celebrating stars */}
      {expression === "celebrating" && (
        <>
          <polygon points="3,4 3.5,5.5 5,6 3.5,6.5 3,8 2.5,6.5 1,6 2.5,5.5" fill="#fbbf24" />
          <polygon points="21,4 21.5,5.5 23,6 21.5,6.5 21,8 20.5,6.5 19,6 20.5,5.5" fill="#fbbf24" />
        </>
      )}
    </svg>
  );
}

/**
 * Pip - A forest creature (round, fluffy)
 * Big eyes, leaf-shaped ears, nature-inspired
 */
function PipCharacter({ expression }: CharacterProps) {
  const getEyes = () => {
    switch (expression) {
      case "happy":
      case "celebrating":
        return (
          <>
            <path d="M6 11 Q8 9, 10 11" stroke="#166534" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M14 11 Q16 9, 18 11" stroke="#166534" strokeWidth="2" fill="none" strokeLinecap="round" />
          </>
        );
      case "thinking":
        return (
          <>
            <circle cx="8" cy="10" r="2.5" fill="#166534" />
            <circle cx="16" cy="10" r="2.5" fill="#166534" />
            <circle cx="9" cy="9" r="1" fill="white" />
            <circle cx="17" cy="9" r="1" fill="white" />
          </>
        );
      default:
        return (
          <>
            <circle cx="8" cy="11" r="3" fill="#166534" />
            <circle cx="16" cy="11" r="3" fill="#166534" />
            <circle cx="9" cy="10" r="1.2" fill="white" />
            <circle cx="17" cy="10" r="1.2" fill="white" />
          </>
        );
    }
  };

  return (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      {/* Leaf ears */}
      <ellipse cx="4" cy="6" rx="3" ry="4" fill="#86efac" transform="rotate(-20 4 6)" />
      <ellipse cx="20" cy="6" rx="3" ry="4" fill="#86efac" transform="rotate(20 20 6)" />
      {/* Body */}
      <ellipse cx="12" cy="14" rx="9" ry="8" fill="#bbf7d0" />
      {/* Belly */}
      <ellipse cx="12" cy="16" rx="5" ry="4" fill="#dcfce7" />
      {/* Eyes */}
      {getEyes()}
      {/* Nose */}
      <ellipse cx="12" cy="14" rx="1.5" ry="1" fill="#166534" />
      {/* Mouth */}
      {expression === "happy" || expression === "celebrating" ? (
        <path d="M10 16 Q12 18, 14 16" stroke="#166534" strokeWidth="1" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M10 16 Q12 17, 14 16" stroke="#166534" strokeWidth="1" fill="none" strokeLinecap="round" />
      )}
      {/* Blush */}
      <circle cx="5" cy="13" r="1.5" fill="#f9a8d4" opacity="0.4" />
      <circle cx="19" cy="13" r="1.5" fill="#f9a8d4" opacity="0.4" />
      {/* Celebrating leaves */}
      {expression === "celebrating" && (
        <>
          <ellipse cx="2" cy="20" rx="1.5" ry="2" fill="#86efac" transform="rotate(-30 2 20)" />
          <ellipse cx="22" cy="20" rx="1.5" ry="2" fill="#86efac" transform="rotate(30 22 20)" />
        </>
      )}
    </svg>
  );
}

/**
 * Nova - A friendly math wizard
 * Pointed hat, wise but approachable
 */
function NovaCharacter({ expression }: CharacterProps) {
  const getEyes = () => {
    switch (expression) {
      case "happy":
      case "celebrating":
        return (
          <>
            <path d="M7 11 Q8.5 9, 10 11" stroke="#92400e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M14 11 Q15.5 9, 17 11" stroke="#92400e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </>
        );
      case "thinking":
        return (
          <>
            <circle cx="8.5" cy="10" r="1.5" fill="#92400e" />
            <circle cx="15.5" cy="10" r="1.5" fill="#92400e" />
          </>
        );
      default:
        return (
          <>
            <circle cx="8.5" cy="11" r="2" fill="#92400e" />
            <circle cx="15.5" cy="11" r="2" fill="#92400e" />
            <circle cx="9" cy="10" r="0.7" fill="white" />
            <circle cx="16" cy="10" r="0.7" fill="white" />
          </>
        );
    }
  };

  return (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      {/* Wizard hat */}
      <polygon points="12,0 6,8 18,8" fill="#7c3aed" />
      <ellipse cx="12" cy="8" rx="6" ry="1.5" fill="#6d28d9" />
      {/* Star on hat */}
      <polygon points="12,2 12.3,3.5 14,4 12.3,4.5 12,6 11.7,4.5 10,4 11.7,3.5" fill="#fbbf24" />
      {/* Face */}
      <ellipse cx="12" cy="14" rx="8" ry="7" fill="#fef3c7" />
      {/* Beard */}
      <path d="M6 16 Q12 22, 18 16" fill="#f5f5f4" />
      {/* Eyes */}
      {getEyes()}
      {/* Nose */}
      <ellipse cx="12" cy="13" rx="1" ry="1.5" fill="#fcd34d" />
      {/* Mouth (hidden by beard, just a hint) */}
      {expression === "happy" || expression === "celebrating" ? (
        <path d="M10 15 Q12 16, 14 15" stroke="#92400e" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      ) : null}
      {/* Celebrating sparkles */}
      {expression === "celebrating" && (
        <>
          <circle cx="2" cy="10" r="1" fill="#fbbf24" />
          <circle cx="22" cy="10" r="1" fill="#fbbf24" />
          <circle cx="4" cy="18" r="0.8" fill="#7c3aed" />
          <circle cx="20" cy="18" r="0.8" fill="#7c3aed" />
        </>
      )}
    </svg>
  );
}

/**
 * Orbit - A sleek AI orb
 * Minimalist, tech-inspired for older students
 */
function OrbitCharacter({ expression }: CharacterProps) {
  const getCore = () => {
    switch (expression) {
      case "happy":
      case "celebrating":
        return (
          <ellipse cx="12" cy="12" rx="4" ry="2" fill="#06b6d4">
            <animate attributeName="ry" values="2;3;2" dur="1s" repeatCount="indefinite" />
          </ellipse>
        );
      case "thinking":
        return (
          <>
            <circle cx="12" cy="12" r="3" fill="#06b6d4" />
            <circle cx="12" cy="12" r="1.5" fill="#0891b2" />
          </>
        );
      default:
        return <circle cx="12" cy="12" r="3" fill="#06b6d4" />;
    }
  };

  return (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      {/* Outer ring */}
      <circle cx="12" cy="12" r="10" fill="none" stroke="#cffafe" strokeWidth="2" />
      {/* Inner glow */}
      <circle cx="12" cy="12" r="8" fill="#ecfeff" />
      {/* Orbit rings */}
      <ellipse cx="12" cy="12" rx="7" ry="3" fill="none" stroke="#a5f3fc" strokeWidth="0.5" transform="rotate(-20 12 12)" />
      <ellipse cx="12" cy="12" rx="7" ry="3" fill="none" stroke="#a5f3fc" strokeWidth="0.5" transform="rotate(20 12 12)" />
      {/* Core */}
      {getCore()}
      {/* Orbiting dots */}
      <circle cx="5" cy="10" r="1" fill="#0891b2" />
      <circle cx="19" cy="14" r="1" fill="#0891b2" />
      {/* Celebrating pulses */}
      {expression === "celebrating" && (
        <>
          <circle cx="12" cy="12" r="6" fill="none" stroke="#06b6d4" strokeWidth="0.5" opacity="0.5">
            <animate attributeName="r" values="6;10;6" dur="1s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0;0.5" dur="1s" repeatCount="indefinite" />
          </circle>
        </>
      )}
    </svg>
  );
}

/**
 * Standalone character display for showcasing in theme selector
 */
export function CharacterShowcase({ characterId }: { characterId: string }) {
  const visuals = CHARACTER_VISUALS[characterId];
  if (!visuals) return null;

  return (
    <div
      className="w-16 h-16 rounded-full flex items-center justify-center"
      style={{ backgroundColor: visuals.bgColor }}
    >
      <div className="w-12 h-12">
        {visuals.idle}
      </div>
    </div>
  );
}

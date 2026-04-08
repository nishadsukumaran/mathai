/**
 * @module apps/web/components/mathai/theme/ThemeSelector
 *
 * Theme selector component with visual preview cards.
 * Allows students to pick their preferred learning theme.
 */

"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";
import type { Theme, GradeGroup, AnimationLevel } from "@/lib/theme/types";

interface ThemeSelectorProps {
  className?: string;
  /** Show only recommended themes initially */
  showRecommendedFirst?: boolean;
  /** Compact mode for smaller spaces */
  compact?: boolean;
}

const GRADE_GROUP_LABELS: Record<GradeGroup, string> = {
  elementary: "Grades 1-5",
  middle: "Grades 6-8",
};

const ANIMATION_OPTIONS: { value: AnimationLevel; label: string; icon: string; desc: string }[] = [
  { value: "minimal", label: "Minimal", icon: "M", desc: "Focused learning" },
  { value: "standard", label: "Standard", icon: "S", desc: "Balanced experience" },
  { value: "playful", label: "Playful", icon: "P", desc: "Fun animations" },
];

export function ThemeSelector({ 
  className, 
  showRecommendedFirst = true,
  compact = false,
}: ThemeSelectorProps) {
  const { theme: currentTheme, themes, recommendedThemes, setTheme, animationLevel, setAnimationLevel } = useTheme();
  const [filter, setFilter] = useState<GradeGroup | "all">(showRecommendedFirst ? currentTheme.gradeGroup : "all");
  const [hoveredTheme, setHoveredTheme] = useState<string | null>(null);

  const filteredThemes = useMemo(() => {
    if (filter === "all") return themes;
    return themes.filter((t) => t.gradeGroup === filter);
  }, [themes, filter]);

  const isRecommended = (themeId: string) => recommendedThemes.some((t) => t.id === themeId);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "px-4 py-2 text-sm font-semibold rounded-xl transition",
            filter === "all"
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          All Themes
        </button>
        <button
          onClick={() => setFilter("elementary")}
          className={cn(
            "px-4 py-2 text-sm font-semibold rounded-xl transition",
            filter === "elementary"
              ? "bg-pink-500 text-white"
              : "bg-pink-50 text-pink-600 hover:bg-pink-100"
          )}
        >
          {GRADE_GROUP_LABELS.elementary}
        </button>
        <button
          onClick={() => setFilter("middle")}
          className={cn(
            "px-4 py-2 text-sm font-semibold rounded-xl transition",
            filter === "middle"
              ? "bg-indigo-500 text-white"
              : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
          )}
        >
          {GRADE_GROUP_LABELS.middle}
        </button>
      </div>

      {/* Theme grid */}
      <div className={cn(
        "grid gap-4",
        compact ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      )}>
        {filteredThemes.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            isActive={theme.id === currentTheme.id}
            isHovered={theme.id === hoveredTheme}
            isRecommended={isRecommended(theme.id)}
            compact={compact}
            onSelect={() => setTheme(theme.id)}
            onHover={(isHovered) => setHoveredTheme(isHovered ? theme.id : null)}
          />
        ))}
      </div>

      {/* Animation level selector */}
      <div className="pt-4 border-t border-gray-100">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
          Animation Level
        </p>
        <div className="flex gap-2">
          {ANIMATION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setAnimationLevel(opt.value)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition",
                animationLevel === opt.value
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-100 hover:border-indigo-200"
              )}
            >
              <span className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                animationLevel === opt.value
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-100 text-gray-600"
              )}>
                {opt.icon}
              </span>
              <span className="text-xs font-semibold text-gray-700">{opt.label}</span>
              <span className="text-xs text-gray-400">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ThemeCardProps {
  theme: Theme;
  isActive: boolean;
  isHovered: boolean;
  isRecommended: boolean;
  compact: boolean;
  onSelect: () => void;
  onHover: (isHovered: boolean) => void;
}

function ThemeCard({
  theme,
  isActive,
  isHovered,
  isRecommended,
  compact,
  onSelect,
  onHover,
}: ThemeCardProps) {
  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className={cn(
        "relative text-left rounded-2xl overflow-hidden transition-all duration-200",
        "border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500",
        isActive
          ? "border-indigo-500 ring-2 ring-indigo-200"
          : "border-transparent hover:border-gray-200",
        isHovered && !isActive && "shadow-lg scale-[1.02]"
      )}
      aria-pressed={isActive}
      aria-label={`Select ${theme.name} theme`}
    >
      {/* Preview gradient/image */}
      <div
        className={cn(
          "w-full",
          compact ? "h-20" : "h-28"
        )}
        style={{ background: theme.preview }}
      >
        {/* Character preview (if available) */}
        {theme.character && !compact && (
          <div className="absolute top-2 right-2 w-12 h-12 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
            <ThemeCharacterIcon characterId={theme.character.id} />
          </div>
        )}

        {/* Recommended badge */}
        {isRecommended && (
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-indigo-600">
            Recommended
          </div>
        )}

        {/* Active checkmark */}
        {isActive && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      {/* Theme info */}
      <div className={cn(
        "bg-white",
        compact ? "p-3" : "p-4"
      )}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "font-bold text-gray-800 truncate",
              compact ? "text-sm" : "text-base"
            )}>
              {theme.name}
            </h3>
            {!compact && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                {theme.description}
              </p>
            )}
          </div>
        </div>

        {/* Theme tags */}
        {!compact && (
          <div className="flex flex-wrap gap-1 mt-2">
            {theme.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Color preview dots */}
        <div className="flex gap-1 mt-2">
          <span
            className="w-4 h-4 rounded-full border border-white shadow-sm"
            style={{ backgroundColor: theme.colors.primary }}
            title="Primary"
          />
          <span
            className="w-4 h-4 rounded-full border border-white shadow-sm"
            style={{ backgroundColor: theme.colors.secondary }}
            title="Secondary"
          />
          <span
            className="w-4 h-4 rounded-full border border-white shadow-sm"
            style={{ backgroundColor: theme.colors.success }}
            title="Success"
          />
          <span
            className="w-4 h-4 rounded-full border border-white shadow-sm"
            style={{ backgroundColor: theme.colors.xp }}
            title="XP"
          />
        </div>
      </div>
    </button>
  );
}

/**
 * Simple character icon placeholder
 * In production, these would be SVG illustrations
 */
function ThemeCharacterIcon({ characterId }: { characterId: string }) {
  const iconMap: Record<string, string> = {
    sparkle: "U", // Unicorn
    cosmo: "R",   // Robot
    pip: "F",     // Forest creature
    nova: "W",    // Wizard
    orbit: "O",   // Orb
  };

  const colorMap: Record<string, string> = {
    sparkle: "#a855f7",
    cosmo: "#3b82f6",
    pip: "#22c55e",
    nova: "#f59e0b",
    orbit: "#06b6d4",
  };

  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
      style={{ backgroundColor: colorMap[characterId] || "#6366f1" }}
    >
      {iconMap[characterId] || "?"}
    </div>
  );
}

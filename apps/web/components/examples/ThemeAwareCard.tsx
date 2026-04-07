/**
 * @module components/examples/ThemeAwareCard
 *
 * Example component demonstrating how to use the MathAI Theme System.
 * This shows best practices for consuming themes in custom components.
 */

"use client";

import { useTheme } from "@/lib/theme";
import type { ReactNode } from "react";

interface ThemeAwareCardProps {
  title: string;
  icon?: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "success";
  showCharacter?: boolean;
}

/**
 * Example: A card component that automatically adapts to the current theme
 */
export function ThemeAwareCard({
  title,
  icon,
  children,
  variant = "primary",
  showCharacter = false,
}: ThemeAwareCardProps) {
  const { theme, animationLevel } = useTheme();

  // Determine which color to use based on variant
  const getColorVar = () => {
    switch (variant) {
      case "primary":
        return "var(--theme-primary)";
      case "secondary":
        return "var(--theme-secondary)";
      case "success":
        return "var(--theme-success)";
    }
  };

  return (
    <div
      className={`
        bg-white rounded-2xl p-6 shadow-sm border-2 transition-all
        ${animationLevel === "playful" ? "hover:shadow-lg" : ""}
      `}
      style={{
        borderColor: `var(--theme-surface-border)`,
        backgroundColor: `var(--theme-surface)`,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        {icon && (
          <span
            className="text-2xl rounded-xl p-2 bg-opacity-10"
            style={{ backgroundColor: getColorVar() }}
          >
            {icon}
          </span>
        )}
        <h3
          className="text-lg font-bold"
          style={{ color: `var(--theme-text)` }}
        >
          {title}
        </h3>
      </div>

      {/* Content */}
      <div
        className="text-sm leading-relaxed"
        style={{ color: `var(--theme-text-muted)` }}
      >
        {children}
      </div>

      {/* Optional: Character based on animation level */}
      {showCharacter && animationLevel !== "minimal" && (
        <div
          className={`
            mt-4 pt-4 border-t flex items-center gap-2 text-xs
            ${animationLevel === "playful" ? "animate-pulse" : ""}
          `}
          style={{ borderColor: `var(--theme-surface-border)` }}
        >
          <span className="text-xl">{theme.character ? "✨" : "📚"}</span>
          <span style={{ color: `var(--theme-text-muted)` }}>
            Tip: You&apos;re learning with the {theme.name} theme!
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Example: Button that matches the current theme
 */
export function ThemeButton({
  children,
  onClick,
  variant = "primary",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary";
}) {
  const { animationLevel } = useTheme();

  const baseColor = variant === "primary" ? "var(--theme-primary)" : "var(--theme-secondary)";

  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 rounded-xl font-semibold text-white text-sm
        transition-all
        ${animationLevel === "playful" ? "hover:shadow-lg active:scale-95" : ""}
        hover:opacity-90
      `}
      style={{ backgroundColor: baseColor }}
    >
      {children}
    </button>
  );
}

/**
 * Example: Progress indicator that uses theme colors
 */
export function ThemeProgressBar({ progress }: { progress: number }) {
  const { theme } = useTheme();

  return (
    <div
      className="w-full h-3 rounded-full overflow-hidden bg-gray-200"
      style={{ backgroundColor: `var(--theme-surface-border)` }}
    >
      <div
        className="h-full transition-all duration-500 rounded-full"
        style={{
          width: `${Math.min(progress, 100)}%`,
          backgroundColor: `var(--theme-success)`,
        }}
      />
    </div>
  );
}

/**
 * Example: Stats widget with theme-aware styling
 */
export function ThemeStatsWidget({
  label,
  value,
  unit,
  icon,
}: {
  label: string;
  value: number | string;
  unit?: string;
  icon: string;
}) {
  const { theme, animationLevel } = useTheme();

  return (
    <div
      className={`
        rounded-2xl p-4 text-center
        ${animationLevel === "playful" ? "hover:scale-105" : ""}
        transition-transform
      `}
      style={{
        backgroundColor: `var(--theme-surface)`,
        borderColor: `var(--theme-surface-border)`,
        border: "2px solid",
      }}
    >
      <div className="text-3xl mb-1">{icon}</div>
      <div
        className="text-xs font-bold uppercase tracking-wider mb-1"
        style={{ color: `var(--theme-text-muted)` }}
      >
        {label}
      </div>
      <div
        className="text-2xl font-black"
        style={{ color: `var(--theme-primary)` }}
      >
        {value}
        {unit && (
          <span
            className="text-lg ml-1"
            style={{ color: `var(--theme-text-muted)` }}
          >
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

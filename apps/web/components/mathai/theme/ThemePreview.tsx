/**
 * @module apps/web/components/mathai/theme/ThemePreview
 *
 * Live preview component showing how a theme looks in the app.
 * Renders a miniature version of the dashboard with theme colors applied.
 */

"use client";

import { cn } from "@/lib/utils";
import type { Theme } from "@/lib/theme/types";

interface ThemePreviewProps {
  theme: Theme;
  className?: string;
}

export function ThemePreview({ theme, className }: ThemePreviewProps) {
  const { colors, typography, effects } = theme;

  const borderRadiusClass = {
    rounded: "rounded-lg",
    "more-rounded": "rounded-xl",
    pill: "rounded-2xl",
  }[typography.borderRadius];

  return (
    <div
      className={cn(
        "relative overflow-hidden p-4",
        borderRadiusClass,
        className
      )}
      style={{ background: colors.background }}
    >
      {/* Floating elements for playful themes */}
      {effects.floatingElements && (
        <>
          <div
            className="absolute -top-2 -right-2 w-8 h-8 rounded-full opacity-20 animate-pulse"
            style={{ backgroundColor: colors.secondary }}
          />
          <div
            className="absolute bottom-4 -left-2 w-6 h-6 rounded-full opacity-15 animate-pulse"
            style={{ backgroundColor: colors.primary, animationDelay: "1s" }}
          />
        </>
      )}

      {/* Mini dashboard preview */}
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: colors.primary }}
          >
            A
          </div>
          <div className="flex-1">
            <div
              className="h-2.5 w-20 rounded"
              style={{ backgroundColor: colors.text, opacity: 0.8 }}
            />
            <div
              className="h-1.5 w-12 rounded mt-1"
              style={{ backgroundColor: colors.textMuted, opacity: 0.5 }}
            />
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-1.5">
          {[colors.primary, colors.streak, colors.xp].map((color, i) => (
            <div
              key={i}
              className={cn(
                "p-2 text-center",
                borderRadiusClass,
                effects.glassMorphism ? "backdrop-blur-sm" : ""
              )}
              style={{
                backgroundColor: effects.glassMorphism
                  ? `${colors.surface}80`
                  : colors.surface,
                borderColor: colors.surfaceBorder,
                borderWidth: 1,
                boxShadow: effects.shadows ? "0 2px 8px rgba(0,0,0,0.05)" : "none",
              }}
            >
              <div
                className="text-xs font-bold"
                style={{ color }}
              >
                {i === 0 ? "12" : i === 1 ? "5" : "150"}
              </div>
              <div
                className="text-[8px] mt-0.5"
                style={{ color: colors.textMuted }}
              >
                {i === 0 ? "Level" : i === 1 ? "Streak" : "XP"}
              </div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div
          className={cn("h-2 overflow-hidden", borderRadiusClass)}
          style={{ backgroundColor: colors.surfaceBorder }}
        >
          <div
            className="h-full"
            style={{
              width: "65%",
              background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
            }}
          />
        </div>

        {/* Mini cards */}
        <div className="space-y-1.5">
          {[1, 2].map((i) => (
            <div
              key={i}
              className={cn("p-2 flex items-center gap-2", borderRadiusClass)}
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.surfaceBorder,
                borderWidth: 1,
              }}
            >
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${colors.primary}20` }}
              >
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: colors.primary }}
                />
              </div>
              <div className="flex-1 space-y-1">
                <div
                  className="h-1.5 w-16 rounded"
                  style={{ backgroundColor: colors.text, opacity: 0.6 }}
                />
                <div
                  className="h-1 w-10 rounded"
                  style={{ backgroundColor: colors.textMuted, opacity: 0.4 }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Success indicator */}
        <div className="flex justify-center">
          <div
            className={cn(
              "px-3 py-1 text-[8px] font-bold text-white",
              borderRadiusClass
            )}
            style={{ backgroundColor: colors.success }}
          >
            Correct!
          </div>
        </div>
      </div>

      {/* Character spot (if theme has character) */}
      {theme.character && (
        <div
          className="absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: colors.secondary }}
        >
          {theme.character.name[0]}
        </div>
      )}
    </div>
  );
}

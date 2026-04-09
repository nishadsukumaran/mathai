"use client";

/**
 * @module components/mathai/ThemePicker
 *
 * Standalone theme picker — can be used in profile page, dashboard, or anywhere.
 * Reads/writes theme via useTheme() context. No backend dependency.
 *
 * Two modes:
 *   - full:    4-card grid with descriptions, recommended badge, auto/manual toggle
 *   - compact: single-row horizontal strip for embedding in dashboard
 */

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  useTheme,
  THEMES,
  themeForGrade,
  recommendedThemeForGrade,
  type ThemeId,
} from "@/lib/theme";

// ─── Full picker (profile page) ──────────────────────────────────────────────

interface FullProps {
  grade: string;
  variant?: "full";
}

interface CompactProps {
  grade: string;
  variant: "compact";
}

type Props = FullProps | CompactProps;

export function ThemePicker({ grade, variant = "full" }: Props) {
  const { theme, setTheme } = useTheme();
  const [autoTheme, setAutoTheme] = useState(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem("mathai-theme");
  });

  // Auto-switch theme when grade changes (if auto mode is on)
  useEffect(() => {
    if (autoTheme) setTheme(themeForGrade(grade));
  }, [grade, autoTheme, setTheme]);

  if (variant === "compact") {
    return <CompactPicker grade={grade} theme={theme} setTheme={setTheme} />;
  }

  return (
    <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Theme</p>
          <p className="text-xs text-slate-400 mt-0.5">Personalise how MathAI looks</p>
        </div>
        <button
          onClick={() => {
            const next = !autoTheme;
            setAutoTheme(next);
            if (next) {
              localStorage.removeItem("mathai-theme");
              setTheme(themeForGrade(grade));
            }
          }}
          className={cn(
            "text-xs font-bold px-3 py-1.5 rounded-full border-2 transition",
            autoTheme
              ? "border-emerald-400 bg-emerald-50 text-emerald-600"
              : "border-gray-200 text-gray-400 hover:border-gray-300",
          )}
        >
          {autoTheme ? "Auto (by grade)" : "Manual"}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {THEMES.map((t) => {
          const isRecommended = t.id === recommendedThemeForGrade(grade);
          return (
            <button
              key={t.id}
              onClick={() => { setAutoTheme(false); setTheme(t.id); }}
              className={cn(
                "relative flex items-start gap-3 p-3 rounded-2xl border-2 text-left transition",
                theme === t.id
                  ? "border-current shadow-sm"
                  : "border-gray-100 hover:border-gray-200",
              )}
              style={theme === t.id ? { borderColor: t.accent } : undefined}
            >
              {isRecommended && (
                <span className="absolute -top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200 leading-none">
                  Recommended
                </span>
              )}
              <span className="text-2xl shrink-0">{t.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-gray-800">{t.name}</p>
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ background: t.accent }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{t.description}</p>
                <p className="text-[10px] text-gray-300 mt-1">{t.grades}</p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ─── Compact picker (dashboard embed) ────────────────────────────────────────

function CompactPicker({
  grade,
  theme,
  setTheme,
}: {
  grade: string;
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {THEMES.map((t) => {
        const active = theme === t.id;
        const isRecommended = t.id === recommendedThemeForGrade(grade);
        return (
          <button
            key={t.id}
            onClick={() => {
              localStorage.setItem("mathai-theme", t.id);
              setTheme(t.id);
            }}
            title={`${t.name}${isRecommended ? " (Recommended)" : ""}`}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border-2 transition",
              active
                ? "border-current shadow-sm"
                : "border-transparent hover:border-gray-200",
            )}
            style={active ? { borderColor: t.accent, background: `${t.accent}10` } : undefined}
          >
            <span className="text-sm">{t.icon}</span>
            <span className="hidden sm:inline text-gray-600">{t.name}</span>
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: t.accent }}
            />
          </button>
        );
      })}
    </div>
  );
}

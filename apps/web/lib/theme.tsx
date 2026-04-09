/**
 * @module lib/theme
 *
 * Non-invasive theme system for MathAI.
 *
 * Themes are applied via CSS variables on a `data-theme` attribute on <body>.
 * Components don't change — they inherit themed colors from CSS custom properties.
 *
 * 4 themes:
 *   - magic-garden  (playful, warm — grades 1-5)
 *   - space-buddy   (playful, cool — grades 1-5)
 *   - neo-scholar   (clean, professional — grades 6-8)
 *   - focus-mode    (minimal, no frills — grades 6-8)
 */

"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

// ─── Theme definitions ───────────────────────────────────────────────────────

export type ThemeId = "magic-garden" | "space-buddy" | "neo-scholar" | "focus-mode";

export interface ThemeMeta {
  id:          ThemeId;
  name:        string;
  icon:        string;
  description: string;
  grades:      string;  // display label
  accent:      string;  // preview swatch hex
}

export const THEMES: ThemeMeta[] = [
  {
    id:          "magic-garden",
    name:        "Magic Garden",
    icon:        "🌸",
    description: "Playful and warm — flowers, sunshine, and gentle colors",
    grades:      "Best for Grades 1-2",
    accent:      "#ec4899",
  },
  {
    id:          "space-buddy",
    name:        "Space Buddy",
    icon:        "🚀",
    description: "Cool and adventurous — stars, planets, and deep blues",
    grades:      "Best for Grades 3-5",
    accent:      "#6366f1",
  },
  {
    id:          "neo-scholar",
    name:        "Neo Scholar",
    icon:        "📐",
    description: "Clean and focused — teal accents, calm tones",
    grades:      "Best for Grades 6-7",
    accent:      "#14b8a6",
  },
  {
    id:          "focus-mode",
    name:        "Focus Mode",
    icon:        "🎯",
    description: "Minimal distractions — neutral palette, sharp typography",
    grades:      "Best for Grade 8+",
    accent:      "#64748b",
  },
];

// ─── Grade-based auto-selection ──────────────────────────────────────────────

/**
 * Maps grade to the most appropriate default theme.
 *   G1-G2 → magic-garden  (most playful — warm colors, inviting)
 *   G3-G5 → space-buddy   (playful but calmer — cool adventure vibe)
 *   G6-G7 → neo-scholar   (clean, professional — teal accents)
 *   G8+   → focus-mode    (minimal, mature — neutral palette)
 */
export function themeForGrade(grade: string): ThemeId {
  const num = parseInt(grade.replace(/\D/g, ""), 10);
  if (isNaN(num) || num <= 2) return "magic-garden";
  if (num <= 5)               return "space-buddy";
  if (num <= 7)               return "neo-scholar";
  return "focus-mode";
}

/** Returns the recommended ThemeId for a grade (used for "Recommended" badge in picker) */
export function recommendedThemeForGrade(grade: string): ThemeId {
  return themeForGrade(grade);
}

// ─── LocalStorage key ────────────────────────────────────────────────────────

const STORAGE_KEY = "mathai-theme";

// ─── Context ─────────────────────────────────────────────────────────────────

interface ThemeContextValue {
  theme:    ThemeId;
  setTheme: (id: ThemeId) => void;
  meta:     ThemeMeta;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme:    "space-buddy",
  setTheme: () => {},
  meta:     THEMES[1]!,
});

export function useTheme() {
  return useContext(ThemeContext);
}

// ─── Provider ────────────────────────────────────────────────────────────────

interface Props {
  children:     ReactNode;
  defaultGrade?: string;
}

export function ThemeProvider({ children, defaultGrade }: Props) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    // SSR-safe: no localStorage on server
    if (typeof window === "undefined") {
      return defaultGrade ? themeForGrade(defaultGrade) : "space-buddy";
    }
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
    if (stored && THEMES.some((t) => t.id === stored)) return stored;
    return defaultGrade ? themeForGrade(defaultGrade) : "space-buddy";
  });

  const setTheme = useCallback((id: ThemeId) => {
    setThemeState(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  // Apply data-theme attribute to <body>
  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  const meta = THEMES.find((t) => t.id === theme) ?? THEMES[1]!;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, meta }}>
      {children}
    </ThemeContext.Provider>
  );
}

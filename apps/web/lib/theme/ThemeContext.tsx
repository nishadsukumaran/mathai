/**
 * @module apps/web/lib/theme/ThemeContext
 *
 * Theme context provider for MathAI.
 * Manages theme state, persistence, and CSS variable injection.
 */

"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import type { Theme, ThemeContextValue, AnimationLevel } from "./types";
import { allThemes, defaultThemeId, getThemeById, getThemesByGrade } from "./themes";

const STORAGE_KEY = "mathai-theme";
const ANIMATION_STORAGE_KEY = "mathai-animation-level";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getStoredThemeId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function setStoredThemeId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Storage might be full or disabled
  }
}

function getStoredAnimationLevel(): AnimationLevel | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(ANIMATION_STORAGE_KEY);
    if (stored === "minimal" || stored === "standard" || stored === "playful") {
      return stored;
    }
    return null;
  } catch {
    return null;
  }
}

function setStoredAnimationLevel(level: AnimationLevel): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ANIMATION_STORAGE_KEY, level);
  } catch {
    // Storage might be full or disabled
  }
}

/**
 * Inject theme CSS variables into the document root
 */
function applyThemeToDocument(theme: Theme): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  // Color variables
  root.style.setProperty("--theme-primary", theme.colors.primary);
  root.style.setProperty("--theme-secondary", theme.colors.secondary);
  root.style.setProperty("--theme-background", theme.colors.background);
  root.style.setProperty("--theme-surface", theme.colors.surface);
  root.style.setProperty("--theme-surface-border", theme.colors.surfaceBorder);
  root.style.setProperty("--theme-text", theme.colors.text);
  root.style.setProperty("--theme-text-muted", theme.colors.textMuted);
  root.style.setProperty("--theme-success", theme.colors.success);
  root.style.setProperty("--theme-xp", theme.colors.xp);
  root.style.setProperty("--theme-streak", theme.colors.streak);

  // Typography
  const radiusMap = {
    rounded: "0.75rem",
    "more-rounded": "1rem",
    pill: "9999px",
  };
  root.style.setProperty("--theme-radius", radiusMap[theme.typography.borderRadius]);
  root.style.setProperty("--theme-heading-weight", theme.typography.headingWeight === "black" ? "900" : theme.typography.headingWeight === "extrabold" ? "800" : "700");

  // Effects
  root.style.setProperty("--theme-shadow", theme.effects.shadows ? "0 4px 24px rgba(0,0,0,0.08)" : "none");
  root.style.setProperty("--theme-glass", theme.effects.glassMorphism ? "blur(12px)" : "none");
  root.style.setProperty("--theme-glass-bg", theme.effects.glassMorphism ? "rgba(255,255,255,0.7)" : "transparent");

  // Add theme class to body for conditional styling
  root.setAttribute("data-theme", theme.id);
  root.setAttribute("data-theme-group", theme.gradeGroup);
  root.setAttribute("data-animation-level", theme.animationLevel);
}

interface ThemeProviderProps {
  children: ReactNode;
  /** Override default theme for SSR or testing */
  initialThemeId?: string;
}

export function ThemeProvider({ children, initialThemeId }: ThemeProviderProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [currentThemeId, setCurrentThemeId] = useState<string>(
    initialThemeId ?? defaultThemeId
  );
  const [animationLevel, setAnimationLevelState] = useState<AnimationLevel>("standard");

  // Get current theme object
  const theme = useMemo(() => {
    return getThemeById(currentThemeId) ?? getThemeById(defaultThemeId)!;
  }, [currentThemeId]);

  // Get user's grade from session
  const userGrade = (session?.user as { grade?: string } | undefined)?.grade ?? "G6";

  // Get recommended themes based on grade
  const recommendedThemes = useMemo(() => {
    return getThemesByGrade(userGrade);
  }, [userGrade]);

  // Load theme from storage on mount
  useEffect(() => {
    const storedId = getStoredThemeId();
    const storedAnimation = getStoredAnimationLevel();

    if (storedId && getThemeById(storedId)) {
      setCurrentThemeId(storedId);
    } else {
      // Auto-recommend based on grade
      const recommended = getThemesByGrade(userGrade);
      if (recommended.length > 0) {
        setCurrentThemeId(recommended[0].id);
      }
    }

    if (storedAnimation) {
      setAnimationLevelState(storedAnimation);
    }

    setIsLoading(false);
  }, [userGrade]);

  // Apply theme to document whenever it changes
  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  // Update animation level attribute when it changes
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-animation-level", animationLevel);
    }
  }, [animationLevel]);

  const setTheme = useCallback((themeId: string) => {
    const newTheme = getThemeById(themeId);
    if (newTheme) {
      setCurrentThemeId(themeId);
      setStoredThemeId(themeId);
    }
  }, []);

  const setAnimationLevel = useCallback((level: AnimationLevel) => {
    setAnimationLevelState(level);
    setStoredAnimationLevel(level);
  }, []);

  const value: ThemeContextValue = useMemo(
    () => ({
      theme,
      themes: allThemes,
      recommendedThemes,
      setTheme,
      animationLevel,
      setAnimationLevel,
      isLoading,
    }),
    [theme, recommendedThemes, setTheme, animationLevel, setAnimationLevel, isLoading]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

/**
 * Hook to check if theme system is available
 * Safe to use in components that might render without ThemeProvider
 */
export function useThemeOptional(): ThemeContextValue | null {
  return useContext(ThemeContext);
}

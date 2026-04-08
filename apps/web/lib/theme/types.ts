/**
 * @module apps/web/lib/theme/types
 *
 * Type definitions for the MathAI Theme Builder System.
 * Supports age-aware, character-driven visual experiences.
 */

export type GradeGroup = "elementary" | "middle";

export type AnimationLevel = "minimal" | "standard" | "playful";

export type CharacterMood = "idle" | "happy" | "thinking" | "celebrating" | "encouraging";

export interface ThemeCharacter {
  id: string;
  name: string;
  description: string;
  /** SVG component or image path */
  moods: Record<CharacterMood, string>;
}

export interface ThemeColors {
  /** Primary brand color for the theme */
  primary: string;
  /** Secondary accent color */
  secondary: string;
  /** Background color or gradient */
  background: string;
  /** Card/surface background */
  surface: string;
  /** Card border color */
  surfaceBorder: string;
  /** Primary text color */
  text: string;
  /** Muted/secondary text */
  textMuted: string;
  /** Success state color */
  success: string;
  /** XP/reward color */
  xp: string;
  /** Streak/fire color */
  streak: string;
}

export interface ThemeTypography {
  /** Font weight for headings */
  headingWeight: "bold" | "extrabold" | "black";
  /** Border radius scale: rounded, more-rounded, pill */
  borderRadius: "rounded" | "more-rounded" | "pill";
}

export interface ThemeEffects {
  /** Whether to show soft shadows */
  shadows: boolean;
  /** Glass morphism effect */
  glassMorphism: boolean;
  /** Subtle floating background elements */
  floatingElements: boolean;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  /** Target grade group */
  gradeGroup: GradeGroup;
  /** Preview image or gradient for theme selector */
  preview: string;
  /** Color tokens */
  colors: ThemeColors;
  /** Typography settings */
  typography: ThemeTypography;
  /** Visual effects */
  effects: ThemeEffects;
  /** Animation intensity */
  animationLevel: AnimationLevel;
  /** Optional companion character */
  character?: ThemeCharacter;
  /** Tags for filtering/search */
  tags: string[];
}

export interface ThemeContextValue {
  /** Current active theme */
  theme: Theme;
  /** All available themes */
  themes: Theme[];
  /** Themes filtered by grade */
  recommendedThemes: Theme[];
  /** Set the active theme */
  setTheme: (themeId: string) => void;
  /** Current animation level (can be overridden) */
  animationLevel: AnimationLevel;
  /** Override animation level */
  setAnimationLevel: (level: AnimationLevel) => void;
  /** Whether theme is loading */
  isLoading: boolean;
}

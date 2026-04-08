/**
 * @module apps/web/lib/theme/themes
 *
 * Theme definitions for MathAI.
 * 
 * ELEMENTARY (Grades 1-5): Playful, emotional, character-driven
 * MIDDLE (Grades 6-8): Cool, achievement-driven, cleaner UI
 */

import type { Theme, ThemeCharacter } from "./types";

// ─── Character Definitions ───────────────────────────────────────────────────

export const characters: Record<string, ThemeCharacter> = {
  sparkle: {
    id: "sparkle",
    name: "Sparkle",
    description: "A magical unicorn friend who loves math puzzles",
    moods: {
      idle: "sparkle-idle",
      happy: "sparkle-happy",
      thinking: "sparkle-thinking",
      celebrating: "sparkle-celebrating",
      encouraging: "sparkle-encouraging",
    },
  },
  cosmo: {
    id: "cosmo",
    name: "Cosmo",
    description: "A curious space robot exploring the math universe",
    moods: {
      idle: "cosmo-idle",
      happy: "cosmo-happy",
      thinking: "cosmo-thinking",
      celebrating: "cosmo-celebrating",
      encouraging: "cosmo-encouraging",
    },
  },
  pip: {
    id: "pip",
    name: "Pip",
    description: "A friendly forest creature who finds patterns everywhere",
    moods: {
      idle: "pip-idle",
      happy: "pip-happy",
      thinking: "pip-thinking",
      celebrating: "pip-celebrating",
      encouraging: "pip-encouraging",
    },
  },
  nova: {
    id: "nova",
    name: "Nova",
    description: "A wise math wizard with endless knowledge",
    moods: {
      idle: "nova-idle",
      happy: "nova-happy",
      thinking: "nova-thinking",
      celebrating: "nova-celebrating",
      encouraging: "nova-encouraging",
    },
  },
  orbit: {
    id: "orbit",
    name: "Orbit",
    description: "A sleek AI assistant for focused learners",
    moods: {
      idle: "orbit-idle",
      happy: "orbit-happy",
      thinking: "orbit-thinking",
      celebrating: "orbit-celebrating",
      encouraging: "orbit-encouraging",
    },
  },
};

// ─── Elementary Themes (Grades 1-5) ──────────────────────────────────────────

export const magicGardenTheme: Theme = {
  id: "magic-garden",
  name: "Magic Garden",
  description: "A enchanted garden where numbers bloom like flowers",
  gradeGroup: "elementary",
  preview: "linear-gradient(135deg, #fce7f3 0%, #ddd6fe 50%, #c7d2fe 100%)",
  colors: {
    primary: "#a855f7",
    secondary: "#f472b6",
    background: "linear-gradient(180deg, #fdf4ff 0%, #faf5ff 50%, #f5f3ff 100%)",
    surface: "#ffffff",
    surfaceBorder: "#f3e8ff",
    text: "#581c87",
    textMuted: "#a855f7",
    success: "#22c55e",
    xp: "#eab308",
    streak: "#f97316",
  },
  typography: {
    headingWeight: "black",
    borderRadius: "more-rounded",
  },
  effects: {
    shadows: true,
    glassMorphism: false,
    floatingElements: true,
  },
  animationLevel: "playful",
  character: characters.sparkle,
  tags: ["magical", "flowers", "unicorn", "colorful"],
};

export const spaceExplorerTheme: Theme = {
  id: "space-explorer",
  name: "Space Explorer",
  description: "Blast off into a galaxy of mathematical discoveries",
  gradeGroup: "elementary",
  preview: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)",
  colors: {
    primary: "#818cf8",
    secondary: "#c084fc",
    background: "linear-gradient(180deg, #0f0a1a 0%, #1a1333 50%, #1e1b4b 100%)",
    surface: "rgba(30, 27, 75, 0.8)",
    surfaceBorder: "rgba(129, 140, 248, 0.2)",
    text: "#e0e7ff",
    textMuted: "#a5b4fc",
    success: "#34d399",
    xp: "#fbbf24",
    streak: "#fb923c",
  },
  typography: {
    headingWeight: "bold",
    borderRadius: "rounded",
  },
  effects: {
    shadows: true,
    glassMorphism: true,
    floatingElements: true,
  },
  animationLevel: "playful",
  character: characters.cosmo,
  tags: ["space", "stars", "robot", "adventure"],
};

export const forestAdventureTheme: Theme = {
  id: "forest-adventure",
  name: "Forest Adventure",
  description: "Explore a magical woodland full of number puzzles",
  gradeGroup: "elementary",
  preview: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 50%, #86efac 100%)",
  colors: {
    primary: "#16a34a",
    secondary: "#84cc16",
    background: "linear-gradient(180deg, #f0fdf4 0%, #ecfdf5 50%, #dcfce7 100%)",
    surface: "#ffffff",
    surfaceBorder: "#bbf7d0",
    text: "#14532d",
    textMuted: "#22c55e",
    success: "#22c55e",
    xp: "#facc15",
    streak: "#f97316",
  },
  typography: {
    headingWeight: "extrabold",
    borderRadius: "more-rounded",
  },
  effects: {
    shadows: true,
    glassMorphism: false,
    floatingElements: true,
  },
  animationLevel: "playful",
  character: characters.pip,
  tags: ["nature", "animals", "forest", "adventure"],
};

export const candyWorldTheme: Theme = {
  id: "candy-world",
  name: "Candy World",
  description: "A sweet kingdom where learning tastes like success",
  gradeGroup: "elementary",
  preview: "linear-gradient(135deg, #fef3c7 0%, #fecdd3 50%, #fbcfe8 100%)",
  colors: {
    primary: "#ec4899",
    secondary: "#f97316",
    background: "linear-gradient(180deg, #fffbeb 0%, #fff1f2 50%, #fdf2f8 100%)",
    surface: "#ffffff",
    surfaceBorder: "#fecdd3",
    text: "#9d174d",
    textMuted: "#f472b6",
    success: "#10b981",
    xp: "#fbbf24",
    streak: "#f97316",
  },
  typography: {
    headingWeight: "black",
    borderRadius: "pill",
  },
  effects: {
    shadows: true,
    glassMorphism: false,
    floatingElements: true,
  },
  animationLevel: "playful",
  character: characters.nova,
  tags: ["sweet", "colorful", "fun", "bright"],
};

export const cloudDreamsTheme: Theme = {
  id: "cloud-dreams",
  name: "Cloud Dreams",
  description: "Float through fluffy clouds of mathematical wonder",
  gradeGroup: "elementary",
  preview: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 50%, #7dd3fc 100%)",
  colors: {
    primary: "#0ea5e9",
    secondary: "#a855f7",
    background: "linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%)",
    surface: "rgba(255, 255, 255, 0.9)",
    surfaceBorder: "#bae6fd",
    text: "#0c4a6e",
    textMuted: "#38bdf8",
    success: "#22c55e",
    xp: "#facc15",
    streak: "#fb923c",
  },
  typography: {
    headingWeight: "bold",
    borderRadius: "more-rounded",
  },
  effects: {
    shadows: true,
    glassMorphism: true,
    floatingElements: true,
  },
  animationLevel: "standard",
  character: characters.sparkle,
  tags: ["sky", "clouds", "peaceful", "soft"],
};

// ─── Middle School Themes (Grades 6-8) ───────────────────────────────────────

export const neoScholarTheme: Theme = {
  id: "neo-scholar",
  name: "Neo Scholar",
  description: "Clean, focused design for serious learners",
  gradeGroup: "middle",
  preview: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)",
  colors: {
    primary: "#6366f1",
    secondary: "#8b5cf6",
    background: "#f8fafc",
    surface: "#ffffff",
    surfaceBorder: "#e2e8f0",
    text: "#1e293b",
    textMuted: "#64748b",
    success: "#10b981",
    xp: "#22c55e",
    streak: "#f59e0b",
  },
  typography: {
    headingWeight: "bold",
    borderRadius: "rounded",
  },
  effects: {
    shadows: true,
    glassMorphism: false,
    floatingElements: false,
  },
  animationLevel: "minimal",
  tags: ["clean", "minimal", "focused", "professional"],
};

export const cosmicArenaTheme: Theme = {
  id: "cosmic-arena",
  name: "Cosmic Arena",
  description: "Dark mode with vibrant accents for night owls",
  gradeGroup: "middle",
  preview: "linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e293b 100%)",
  colors: {
    primary: "#06b6d4",
    secondary: "#8b5cf6",
    background: "linear-gradient(180deg, #020617 0%, #0f172a 100%)",
    surface: "rgba(30, 41, 59, 0.8)",
    surfaceBorder: "rgba(6, 182, 212, 0.2)",
    text: "#f1f5f9",
    textMuted: "#94a3b8",
    success: "#22c55e",
    xp: "#fbbf24",
    streak: "#f97316",
  },
  typography: {
    headingWeight: "bold",
    borderRadius: "rounded",
  },
  effects: {
    shadows: true,
    glassMorphism: true,
    floatingElements: false,
  },
  animationLevel: "standard",
  character: characters.orbit,
  tags: ["dark", "space", "cool", "night"],
};

export const focusModeTheme: Theme = {
  id: "focus-mode",
  name: "Focus Mode",
  description: "Distraction-free design for deep concentration",
  gradeGroup: "middle",
  preview: "linear-gradient(135deg, #fafaf9 0%, #f5f5f4 50%, #e7e5e4 100%)",
  colors: {
    primary: "#0f766e",
    secondary: "#0891b2",
    background: "#fafaf9",
    surface: "#ffffff",
    surfaceBorder: "#e7e5e4",
    text: "#1c1917",
    textMuted: "#78716c",
    success: "#16a34a",
    xp: "#22c55e",
    streak: "#ea580c",
  },
  typography: {
    headingWeight: "bold",
    borderRadius: "rounded",
  },
  effects: {
    shadows: false,
    glassMorphism: false,
    floatingElements: false,
  },
  animationLevel: "minimal",
  tags: ["minimal", "calm", "focused", "study"],
};

export const logicLabTheme: Theme = {
  id: "logic-lab",
  name: "Logic Lab",
  description: "A high-tech laboratory for problem solvers",
  gradeGroup: "middle",
  preview: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 50%, #a7f3d0 100%)",
  colors: {
    primary: "#059669",
    secondary: "#0d9488",
    background: "linear-gradient(180deg, #f0fdfa 0%, #ecfdf5 100%)",
    surface: "#ffffff",
    surfaceBorder: "#a7f3d0",
    text: "#064e3b",
    textMuted: "#10b981",
    success: "#22c55e",
    xp: "#fbbf24",
    streak: "#f97316",
  },
  typography: {
    headingWeight: "bold",
    borderRadius: "rounded",
  },
  effects: {
    shadows: true,
    glassMorphism: false,
    floatingElements: false,
  },
  animationLevel: "standard",
  character: characters.orbit,
  tags: ["tech", "science", "green", "smart"],
};

export const masteryLeagueTheme: Theme = {
  id: "mastery-league",
  name: "Mastery League",
  description: "Competitive vibes for achievement hunters",
  gradeGroup: "middle",
  preview: "linear-gradient(135deg, #fef9c3 0%, #fde047 50%, #facc15 100%)",
  colors: {
    primary: "#ca8a04",
    secondary: "#d97706",
    background: "linear-gradient(180deg, #fefce8 0%, #fef9c3 100%)",
    surface: "#ffffff",
    surfaceBorder: "#fde047",
    text: "#713f12",
    textMuted: "#a16207",
    success: "#16a34a",
    xp: "#eab308",
    streak: "#ea580c",
  },
  typography: {
    headingWeight: "extrabold",
    borderRadius: "rounded",
  },
  effects: {
    shadows: true,
    glassMorphism: false,
    floatingElements: false,
  },
  animationLevel: "standard",
  tags: ["gold", "achievement", "competitive", "champion"],
};

// ─── Export All Themes ───────────────────────────────────────────────────────

export const allThemes: Theme[] = [
  // Elementary
  magicGardenTheme,
  spaceExplorerTheme,
  forestAdventureTheme,
  candyWorldTheme,
  cloudDreamsTheme,
  // Middle
  neoScholarTheme,
  cosmicArenaTheme,
  focusModeTheme,
  logicLabTheme,
  masteryLeagueTheme,
];

export const defaultThemeId = "neo-scholar";

export function getThemeById(id: string): Theme | undefined {
  return allThemes.find((t) => t.id === id);
}

export function getThemesByGrade(grade: string): Theme[] {
  const gradeNum = parseInt(grade.replace("G", ""), 10);
  const gradeGroup = gradeNum <= 5 ? "elementary" : "middle";
  return allThemes.filter((t) => t.gradeGroup === gradeGroup);
}

# MathAI Theme System Guide

The MathAI Theme System is a comprehensive, psychology-informed theming solution designed to enhance learning engagement for elementary and middle-school students through personalized visual experiences.

## Overview

The theme system provides:
- **10 Grade-Appropriate Themes**: 5 for elementary (grades 1-5), 5 for middle school (grades 6-8)
- **Companion Characters**: 5 unique SVG characters with multiple mood states
- **Animation Control**: Three levels (minimal, standard, playful) respecting accessibility preferences
- **Automatic Grade Recommendations**: Themes auto-select based on student grade
- **CSS Variable System**: Seamless theme application across the entire app
- **Persistent Storage**: User preferences saved in localStorage

## Theme Architecture

### Core Files

```
lib/theme/
├── types.ts              # TypeScript interfaces for themes, characters, colors
├── themes.ts             # 10 complete theme definitions
├── ThemeContext.tsx      # React context provider
├── theme.css             # Theme-aware CSS utilities
└── index.ts              # Public exports
```

### Component Files

```
components/mathai/theme/
├── ThemeSelector.tsx     # Main theme picker UI
├── ThemePreview.tsx      # Live preview mini-component
├── ThemeCharacter.tsx    # SVG character system with moods
└── index.ts              # Public exports
```

## Quick Start

### 1. Use the Theme Hook

```typescript
import { useTheme } from "@/lib/theme";

export function MyComponent() {
  const { theme, animationLevel, setTheme } = useTheme();
  
  return (
    <div style={{ 
      color: `var(--theme-primary)`,
      backgroundColor: `var(--theme-background)`
    }}>
      Current theme: {theme.name}
    </div>
  );
}
```

### 2. Access CSS Variables

The following CSS variables are automatically injected into the document root:

```css
/* Colors */
--theme-primary           /* Main brand color */
--theme-secondary         /* Accent color */
--theme-background        /* Page background */
--theme-surface           /* Card backgrounds */
--theme-surface-border    /* Card borders */
--theme-text              /* Primary text */
--theme-text-muted        /* Secondary text */
--theme-success           /* Success state */
--theme-xp                /* XP/points color */
--theme-streak            /* Streak color */

/* Typography */
--theme-radius            /* Border radius */
--theme-heading-weight    /* Heading font weight */

/* Effects */
--theme-shadow            /* Shadow depth */
--theme-glass             /* Glass morphism blur */
--theme-glass-bg          /* Glass morphism background */
```

### 3. Tailwind Classes with Themes

Use custom theme utilities in your components:

```tsx
<button className="btn-theme-primary">
  Click me
</button>

<div className="bg-theme-surface border border-theme-surface-border rounded-theme">
  Card content
</div>
```

## Available Themes

### Elementary Themes (Grades 1-5)

1. **Sparkle Quest** - Warm, energetic, rainbow-inspired
2. **Ocean Explorer** - Cool, calm, blue-focused
3. **Forest Friend** - Nature-inspired, green palette
4. **Candy Land** - Playful, pastel colors
5. **Cosmic Adventure** - Space-themed, deep purples and golds

### Middle School Themes (Grades 6-8)

1. **Digital Native** - Modern, tech-forward aesthetic
2. **Urban Groove** - Contemporary, street art vibes
3. **Nature Flow** - Organic, minimalist design
4. **Night Mode** - Dark theme for reduced eye strain
5. **Gradient Horizon** - Contemporary, gradient-forward

## Theme Properties

Each theme includes:

```typescript
interface Theme {
  id: string;                           // Unique identifier
  name: string;                         // Display name
  gradeGroup: "elementary" | "middle";
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    surfaceBorder: string;
    text: string;
    textMuted: string;
    success: string;
    xp: string;
    streak: string;
  };
  typography: {
    headingWeight: "bold" | "extrabold" | "black";
    borderRadius: "rounded" | "more-rounded" | "pill";
  };
  effects: {
    shadows: boolean;
    glassMorphism: boolean;
  };
  character?: {
    id: string;
    featured: boolean;
  };
  animationLevel: AnimationLevel;
  description: string;
  emoji: string;
}
```

## Characters

Five unique companion characters:
- **Sparkle**: Energetic, encouraging
- **Cosmo**: Curious, thoughtful
- **Pip**: Friendly, supportive
- **Nova**: Confident, motivating
- **Orbit**: Playful, fun-loving

Each character has 5 mood states:
- **idle**: Resting state
- **happy**: Positive/satisfied
- **thinking**: Processing/loading
- **celebrating**: Achievement/success
- **encouraging**: Supporting user

## Animation Levels

### Minimal
- No animations or transitions
- Best for students who need reduced motion
- Respects `prefers-reduced-motion` media query

### Standard (Default)
- Subtle transitions and micro-interactions
- Balanced between engagement and accessibility

### Playful
- Full animations, character reactions
- Maximum engagement and fun

## Accessing Themes Programmatically

```typescript
import { 
  allThemes, 
  defaultThemeId, 
  getThemeById, 
  getThemesByGrade 
} from "@/lib/theme/themes";

// Get all themes
const themes = allThemes;

// Get specific theme
const theme = getThemeById("sparkle-quest");

// Get recommended themes for a grade
const elementaryThemes = getThemesByGrade("G3");
```

## Integration Points

### Profile Page
The theme selector is integrated into `/app/profile/ProfilePageContent.tsx` where students can:
- View all available themes
- See personalized recommendations
- Adjust animation levels
- Preview themes in real-time

### Persistence
- Theme preference stored in localStorage with key `mathai-theme`
- Animation level stored with key `mathai-animation-level`
- Auto-recovers if localStorage is cleared

## Customization

### Adding a New Theme

1. Add to `themes.ts`:

```typescript
export const newTheme: Theme = {
  id: "my-theme",
  name: "My Theme",
  gradeGroup: "elementary",
  colors: { /* ... */ },
  typography: { /* ... */ },
  effects: { /* ... */ },
  description: "Description",
  emoji: "🎨",
};

allThemes.push(newTheme);
```

2. Update type definitions if needed in `types.ts`

### Custom Animation Styles

Add custom animations in `theme.css`:

```css
@media (prefers-reduced-motion: no-preference) {
  [data-animation-level="playful"] .fade-in {
    animation: fadeIn 0.3s ease-in;
  }
}
```

## Best Practices

1. **Always use the useTheme hook** instead of direct localStorage access
2. **Use CSS variables** for consistency across components
3. **Respect animation preferences** - check `animationLevel` before adding motion
4. **Test with all themes** when adding new UI elements
5. **Keep theme colors accessible** - maintain sufficient contrast ratios
6. **Use themed components** from the theme package when available

## Accessibility

The theme system includes:
- WCAG AA contrast ratio compliance for all themes
- `prefers-reduced-motion` support
- Clear focus states on interactive elements
- Screen reader-friendly character descriptions
- Semantic HTML in all components

## Troubleshooting

### Theme not applying
- Ensure `ThemeProvider` wraps your component tree in `providers.tsx`
- Check browser console for context error
- Verify localStorage is enabled

### Characters not rendering
- SVG files should be in the expected location
- Check browser DevTools for SVG parsing errors
- Ensure `crossOrigin="anonymous"` for canvas rendering

### Animation not working
- Verify animation level is set correctly
- Check for `prefers-reduced-motion` in system settings
- Inspect computed styles in browser DevTools

## Future Enhancements

- Per-theme custom fonts
- Theme creator/customizer UI
- Social theme sharing
- Seasonal theme variants
- Dynamic theme generation from user preferences

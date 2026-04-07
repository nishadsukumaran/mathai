# Theme System Quick Reference

## Import & Setup

```typescript
// In any client component
import { useTheme } from "@/lib/theme";

export function MyComponent() {
  const { theme, setTheme, animationLevel, setAnimationLevel } = useTheme();
  // Component code...
}
```

## CSS Variables Usage

```tsx
// Colors
<div style={{ color: `var(--theme-primary)` }}>Text</div>
<div style={{ backgroundColor: `var(--theme-surface)` }}>Card</div>

// Utilities
<div className="rounded-theme shadow-theme">Card with radius</div>
<div style={{ borderRadius: `var(--theme-radius)` }}>Themed radius</div>
```

## Common Patterns

### Responsive to Animation Level
```typescript
const { animationLevel } = useTheme();

return (
  <button className={animationLevel === "playful" ? "hover:scale-110" : ""}>
    Click me
  </button>
);
```

### Apply Theme Color
```typescript
const { theme } = useTheme();

return (
  <div style={{ backgroundColor: theme.colors.primary }}>
    Themed content
  </div>
);
```

### Grade-Specific UI
```typescript
const { theme } = useTheme();

if (theme.gradeGroup === "elementary") {
  return <SimplifiedUI />;
}
return <AdvancedUI />;
```

### Show/Hide Character
```typescript
const { theme, animationLevel } = useTheme();

return (
  <>
    {animationLevel !== "minimal" && theme.character && (
      <Character id={theme.character.id} mood="happy" />
    )}
    <Content />
  </>
);
```

## Tailwind Classes with Themes

```tsx
<button className="
  bg-white
  text-theme-text
  border-theme-surface-border
  hover:bg-theme-surface
  rounded-theme
">
  Button
</button>
```

## Theme Object Structure

```typescript
{
  id: string;                    // Unique ID
  name: string;                  // Display name
  emoji: string;                 // Theme emoji
  gradeGroup: "elementary" | "middle";
  colors: {
    primary: string;             // Main color
    secondary: string;           // Accent
    background: string;          // Page background
    surface: string;             // Cards
    surfaceBorder: string;       // Card border
    text: string;                // Primary text
    textMuted: string;           // Secondary text
    success: string;             // Success state
    xp: string;                  // Points color
    streak: string;              // Streak color
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
}
```

## Available Themes

**Elementary**: Sparkle Quest, Ocean Explorer, Forest Friend, Candy Land, Cosmic Adventure  
**Middle**: Digital Native, Urban Groove, Nature Flow, Night Mode, Gradient Horizon

## Function Reference

```typescript
// Get all themes
import { allThemes } from "@/lib/theme/themes";

// Get specific theme by ID
import { getThemeById } from "@/lib/theme/themes";
const theme = getThemeById("sparkle-quest");

// Get themes by grade
import { getThemesByGrade } from "@/lib/theme/themes";
const themes = getThemesByGrade("G3");

// Use theme hook
import { useTheme, useThemeOptional } from "@/lib/theme";
const context = useTheme();              // Throws if no provider
const contextOrNull = useThemeOptional(); // Returns null if no provider
```

## CSS Variables Cheatsheet

| Variable | Usage |
|----------|-------|
| `--theme-primary` | Main brand color |
| `--theme-secondary` | Accent color |
| `--theme-background` | Page background |
| `--theme-surface` | Card/modal background |
| `--theme-surface-border` | Borders |
| `--theme-text` | Primary text |
| `--theme-text-muted` | Secondary text |
| `--theme-success` | Success states |
| `--theme-xp` | Points/rewards |
| `--theme-streak` | Streak/streak counter |
| `--theme-radius` | Border radius size |
| `--theme-heading-weight` | Font weight number |
| `--theme-shadow` | Box shadow |
| `--theme-glass` | Glass morphism blur |
| `--theme-glass-bg` | Glass morphism background |

## HTML Data Attributes

```html
<!-- Automatically set by ThemeProvider -->
<html 
  data-theme="sparkle-quest"
  data-theme-group="elementary"
  data-animation-level="standard"
>
```

Use for CSS targeting:
```css
[data-theme="cosmic-adventure"] .special {
  background: purple;
}

[data-animation-level="playful"] .animated {
  animation: float 2s infinite;
}
```

## Accessibility

- All themes meet WCAG AA contrast
- `prefers-reduced-motion` respected
- Animation levels: `minimal` (none), `standard` (subtle), `playful` (full)
- Screen reader support for characters
- Semantic HTML throughout

## LocalStorage Keys

- `mathai-theme`: Current theme ID
- `mathai-animation-level`: Animation level setting

## Debug

Get current theme info:
```typescript
const { theme, animationLevel } = useTheme();
console.log(theme.name, animationLevel);
```

Check CSS variables in DevTools:
```javascript
getComputedStyle(document.documentElement).getPropertyValue('--theme-primary')
```

## Common Mistakes to Avoid

❌ Using string colors instead of variables
```typescript
// DON'T
<div style={{ color: "#FF6B9D" }}>Text</div>

// DO
<div style={{ color: `var(--theme-primary)` }}>Text</div>
```

❌ Accessing theme outside of component
```typescript
// DON'T
const myTheme = useTheme(); // Error if outside <ThemeProvider>

// DO
function MyComponent() {
  const { theme } = useTheme(); // Correct placement
}
```

❌ Not checking animation level before animating
```typescript
// DON'T
<div className="animate-spin">Loading</div>

// DO
const { animationLevel } = useTheme();
<div className={animationLevel === "playful" ? "animate-spin" : ""}>
  Loading
</div>
```

## Performance Tips

- Use CSS variables for zero re-render theme updates
- Memoize theme object if using in dependencies
- Avoid inline style objects in render
- Use `data` attributes instead of complex selectors

## Resources

- Full Guide: `lib/theme/THEME_SYSTEM_GUIDE.md`
- Implementation Notes: `lib/theme/IMPLEMENTATION_NOTES.md`
- Example Components: `components/examples/`
- Type Definitions: `lib/theme/types.ts`

# MathAI Theme System - Developer Guide

Welcome! This project now includes a comprehensive theme system. This file gives you everything you need to get started.

## 🚀 Quick Start (2 minutes)

### Use themes in any component:

```typescript
import { useTheme } from "@/lib/theme";

export function MyComponent() {
  const { theme, animationLevel } = useTheme();
  
  return (
    <div style={{ color: `var(--theme-primary)` }}>
      Hello from {theme.name}!
    </div>
  );
}
```

That's it! Your component now:
- Automatically adapts to the user's selected theme
- Gets colors from CSS variables
- Respects animation preferences
- Persists user preferences

## 📚 Documentation Structure

### Start Here
- **This file** - Quick overview
- `THEME_QUICK_REFERENCE.md` - Code snippets & cheat sheet
- `THEME_IMPLEMENTATION_SUMMARY.md` - What was built and why

### Deep Dives
- `lib/theme/THEME_SYSTEM_GUIDE.md` - Complete reference (15+ pages)
- `lib/theme/IMPLEMENTATION_NOTES.md` - Architecture & patterns
- `components/examples/` - Working example components

## 🎨 What's Available

### 10 Themes (All Grade-Appropriate)
**Elementary (Grades 1-5)**: Sparkle Quest, Ocean Explorer, Forest Friend, Candy Land, Cosmic Adventure

**Middle School (Grades 6-8)**: Digital Native, Urban Groove, Nature Flow, Night Mode, Gradient Horizon

### CSS Variables
15+ variables automatically available:
- Colors: `--theme-primary`, `--theme-secondary`, `--theme-background`, etc.
- Typography: `--theme-radius`, `--theme-heading-weight`
- Effects: `--theme-shadow`, `--theme-glass`

### Characters
5 unique SVG characters with mood system (idle, happy, thinking, celebrating, encouraging)

### Animation Levels
- **Minimal**: No animations (accessibility first)
- **Standard**: Subtle transitions (default)
- **Playful**: Full animations (maximum engagement)

## 💻 Common Patterns

### Color a Component
```tsx
<button style={{ backgroundColor: `var(--theme-primary)` }}>
  Click me
</button>
```

### Conditional Animation
```tsx
const { animationLevel } = useTheme();

<div className={animationLevel === "playful" ? "animate-spin" : ""}>
  Loading...
</div>
```

### Grade-Specific UI
```tsx
const { theme } = useTheme();

if (theme.gradeGroup === "elementary") {
  return <SimplifiedVersion />;
}
return <AdvancedVersion />;
```

### Show Character
```tsx
import { ThemeCharacter } from "@/components/mathai/theme";

<ThemeCharacter mood="celebrating" />
```

## 🔗 Where It's Integrated

✅ **Profile Page** - Users select their theme here (`/app/profile/`)
✅ **Providers** - ThemeProvider wraps the entire app
✅ **Global Styles** - Theme CSS injected into all pages
✅ **Available Everywhere** - useTheme hook works in any client component

## 📂 File Structure

```
lib/theme/
├── types.ts                    # TypeScript definitions
├── themes.ts                   # 10 theme definitions
├── ThemeContext.tsx            # React context provider
├── theme.css                   # CSS variables
├── index.ts                    # Exports
├── THEME_SYSTEM_GUIDE.md      # Full documentation
└── IMPLEMENTATION_NOTES.md    # Architecture & extensions

components/mathai/theme/
├── ThemeSelector.tsx          # Theme picker UI
├── ThemePreview.tsx           # Preview component
├── ThemeCharacter.tsx         # Character system
└── index.ts                   # Exports

components/examples/
├── ThemeAwareCard.tsx         # Example components
└── ThemeIntegrationExample.tsx # Full page example
```

## 🎯 Next Steps

### For Component Developers
1. Import `useTheme` from `@/lib/theme`
2. Call it to get theme, animationLevel, and setters
3. Use CSS variables for colors
4. Check animationLevel before animating

### For Feature Teams
1. Review `THEME_IMPLEMENTATION_SUMMARY.md` for scope
2. Look at `components/examples/ThemeIntegrationExample.tsx` for patterns
3. Integrate theme selector into new pages
4. Test with all 10 themes

### For Designers
1. All 10 theme palettes defined in `lib/theme/themes.ts`
2. WCAG AA contrast on all themes
3. Character moods in `ThemeCharacter.tsx`
4. Animation levels respect accessibility settings

## 🚦 Testing

When adding theme support to a component:

- [ ] Import and use useTheme hook
- [ ] Test with all 10 themes
- [ ] Verify colors update without page reload
- [ ] Check animation level behavior
- [ ] Verify localStorage persistence
- [ ] Test on mobile and desktop
- [ ] Check WCAG AA contrast

## 🐛 Troubleshooting

**Theme not working?**
→ Check ThemeProvider in `app/providers.tsx`

**CSS variables undefined?**
→ Verify theme import in `app/globals.css`

**Theme not persisting?**
→ Check localStorage is enabled

**Components not animating?**
→ Verify `animationLevel === "playful"` condition

See `IMPLEMENTATION_NOTES.md` troubleshooting section for more.

## 💡 Pro Tips

1. **Use CSS variables for instant theme updates** - No re-renders needed
2. **Check animationLevel before animating** - Respects accessibility settings
3. **Test with all themes** - Catch contrast and layout issues early
4. **Use data attributes for CSS** - `[data-theme="sparkle-quest"]`
5. **Keep it accessible** - All themes meet WCAG AA standards

## 🎓 Key Concepts

### Why CSS Variables?
- Instant theme switching
- No re-renders
- Works with all Tailwind utilities
- Great performance

### Why React Context?
- Global access without prop drilling
- Clean useTheme() hook API
- Familiar React pattern
- Built-in optimization

### Why localStorage + Session?
- User prefs persist
- Auto-recommend by grade
- Privacy-friendly
- Graceful fallbacks

## 📖 Resources

| Resource | Purpose | Size |
|----------|---------|------|
| **THEME_QUICK_REFERENCE.md** | Code snippets | 2 min read |
| **THEME_SYSTEM_GUIDE.md** | Complete guide | 15 min read |
| **IMPLEMENTATION_NOTES.md** | Architecture | 10 min read |
| **ThemeIntegrationExample.tsx** | Working example | 10 min review |
| **ThemeAwareCard.tsx** | Component patterns | 5 min review |

## 🎯 Mission-Critical Files

1. **lib/theme/types.ts** - Type definitions (if adding new features)
2. **lib/theme/themes.ts** - Theme data (if adding new theme)
3. **lib/theme/ThemeContext.tsx** - Provider logic (if extending system)
4. **lib/theme/theme.css** - CSS variables (if adding new variable)
5. **components/mathai/theme/ThemeSelector.tsx** - UI component (if modifying selector)

## 🤝 Contributing

### Adding a New Theme
1. Define theme in `lib/theme/themes.ts`
2. Test with all components
3. Verify WCAG AA contrast
4. Update documentation

### Extending the System
1. Read `IMPLEMENTATION_NOTES.md`
2. Follow existing patterns
3. Add TypeScript types
4. Update documentation

### Using in New Components
1. Import `useTheme` from `@/lib/theme`
2. Follow patterns in `ThemeAwareCard.tsx`
3. Test with all themes
4. Document component API

## ✅ Checklist for New Developers

- [ ] Read this file
- [ ] Review THEME_QUICK_REFERENCE.md
- [ ] Check THEME_IMPLEMENTATION_SUMMARY.md
- [ ] Look at example components
- [ ] Try using useTheme() in a test component
- [ ] Test theme switching on profile page
- [ ] Read full guide for deep dive

## 🎉 You're Ready!

Start integrating themes into your components. The system is production-ready and fully documented.

**Questions?** See the full guides:
- Quick answers: `THEME_QUICK_REFERENCE.md`
- How-to: `lib/theme/THEME_SYSTEM_GUIDE.md`
- Deep dive: `lib/theme/IMPLEMENTATION_NOTES.md`

**Happy theming! 🎨**

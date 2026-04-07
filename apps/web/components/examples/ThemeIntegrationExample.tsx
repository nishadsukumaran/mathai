/**
 * @module components/examples/ThemeIntegrationExample
 *
 * Full page example showing how to integrate the MathAI Theme System
 * into an existing page or dashboard.
 *
 * Copy this pattern when building new pages that should respond to theme changes.
 */

"use client";

import { useTheme } from "@/lib/theme";
import { ThemeAwareCard, ThemeButton, ThemeProgressBar, ThemeStatsWidget } from "./ThemeAwareCard";

/**
 * Example: A full learning dashboard that adapts to the current theme
 */
export function ThemeIntegrationExample() {
  const { theme, animationLevel, setTheme, setAnimationLevel } = useTheme();

  const isPlayful = animationLevel === "playful";

  return (
    <div
      className="min-h-screen p-8"
      style={{ backgroundColor: `var(--theme-background)` }}
    >
      {/* Header with theme info */}
      <header className="max-w-6xl mx-auto mb-12">
        <h1
          className={`
            text-4xl font-black mb-2 text-balance
            ${isPlayful ? "animate-bounce" : ""}
          `}
          style={{ color: `var(--theme-primary)` }}
        >
          Welcome to {theme.name}! 🎨
        </h1>
        <p
          className="text-lg"
          style={{ color: `var(--theme-text-muted)` }}
        >
          {theme.description}
        </p>
      </header>

      <div className="max-w-6xl mx-auto space-y-12">
        {/* Stats Overview */}
        <section>
          <h2
            className="text-2xl font-bold mb-6"
            style={{ color: `var(--theme-text)` }}
          >
            Your Learning Stats
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ThemeStatsWidget
              icon="🎯"
              label="Problems Solved"
              value={247}
            />
            <ThemeStatsWidget
              icon="🔥"
              label="Current Streak"
              value={12}
              unit="days"
            />
            <ThemeStatsWidget
              icon="⭐"
              label="Total XP"
              value={1250}
            />
            <ThemeStatsWidget
              icon="🏆"
              label="Achievements"
              value={8}
            />
          </div>
        </section>

        {/* Progress Sections */}
        <section>
          <h2
            className="text-2xl font-bold mb-6"
            style={{ color: `var(--theme-text)` }}
          >
            Today&apos;s Progress
          </h2>
          <div className="space-y-6">
            {[
              { name: "Algebra", progress: 75 },
              { name: "Geometry", progress: 45 },
              { name: "Fractions", progress: 90 },
            ].map((subject) => (
              <div key={subject.name}>
                <div className="flex justify-between items-center mb-2">
                  <span
                    className="font-semibold"
                    style={{ color: `var(--theme-text)` }}
                  >
                    {subject.name}
                  </span>
                  <span
                    className="text-sm font-bold"
                    style={{ color: `var(--theme-primary)` }}
                  >
                    {subject.progress}%
                  </span>
                </div>
                <ThemeProgressBar progress={subject.progress} />
              </div>
            ))}
          </div>
        </section>

        {/* Info Cards Grid */}
        <section>
          <h2
            className="text-2xl font-bold mb-6"
            style={{ color: `var(--theme-text)` }}
          >
            Tips & Tricks
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ThemeAwareCard
              icon="💡"
              title="Consistent Practice"
              variant="primary"
              showCharacter
            >
              Daily practice helps build strong math foundations. Even 15 minutes a day makes a big difference!
            </ThemeAwareCard>

            <ThemeAwareCard
              icon="🧠"
              title="Think Step by Step"
              variant="secondary"
              showCharacter
            >
              Break complex problems into smaller chunks. Write out each step to avoid mistakes and build confidence.
            </ThemeAwareCard>

            <ThemeAwareCard
              icon="🎉"
              title="Celebrate Progress"
              variant="success"
              showCharacter
            >
              Every mistake is learning! Celebrate your growth and don&apos;t worry about perfection.
            </ThemeAwareCard>
          </div>
        </section>

        {/* Theme Controls Section */}
        <section
          className="rounded-3xl p-8 border-2"
          style={{
            backgroundColor: `var(--theme-surface)`,
            borderColor: `var(--theme-surface-border)`,
          }}
        >
          <h2
            className="text-2xl font-bold mb-6"
            style={{ color: `var(--theme-primary)` }}
          >
            Theme Settings
          </h2>

          <div className="space-y-6">
            {/* Current Theme Info */}
            <div>
              <label
                className="block text-sm font-bold uppercase mb-3"
                style={{ color: `var(--theme-text-muted)` }}
              >
                Current Theme
              </label>
              <div
                className="inline-block rounded-full px-4 py-2 font-bold text-white"
                style={{ backgroundColor: `var(--theme-primary)` }}
              >
                {theme.emoji} {theme.name}
              </div>
            </div>

            {/* Animation Level Info */}
            <div>
              <label
                className="block text-sm font-bold uppercase mb-3"
                style={{ color: `var(--theme-text-muted)` }}
              >
                Animation Level: <strong>{animationLevel}</strong>
              </label>
              <div className="flex gap-2 flex-wrap">
                {(
                  [
                    { value: "minimal", label: "Minimal - Focused" },
                    { value: "standard", label: "Standard - Balanced" },
                    { value: "playful", label: "Playful - Fun" },
                  ] as const
                ).map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setAnimationLevel(value)}
                    className={`
                      px-4 py-2 rounded-lg font-semibold transition-all
                      ${animationLevel === value
                        ? "text-white shadow-lg"
                        : "text-gray-600 border-2"
                      }
                    `}
                    style={
                      animationLevel === value
                        ? { backgroundColor: `var(--theme-primary)` }
                        : { borderColor: `var(--theme-surface-border)` }
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center py-12">
          <p
            className="text-lg mb-6"
            style={{ color: `var(--theme-text-muted)` }}
          >
            Ready to start learning?
          </p>
          <ThemeButton variant="primary">
            Continue Learning →
          </ThemeButton>
        </section>
      </div>

      {/* Footer with theme debug info (development only) */}
      <footer
        className="max-w-6xl mx-auto mt-16 pt-8 border-t text-xs"
        style={{
          borderColor: `var(--theme-surface-border)`,
          color: `var(--theme-text-muted)`,
        }}
      >
        <details>
          <summary className="cursor-pointer hover:opacity-70">
            Theme Debug Info
          </summary>
          <pre className="mt-4 p-4 bg-gray-50 rounded-lg overflow-auto text-xs">
            {JSON.stringify(
              {
                themeId: theme.id,
                themeName: theme.name,
                gradeGroup: theme.gradeGroup,
                animationLevel,
                colorsAvailable: Object.keys(theme.colors),
              },
              null,
              2
            )}
          </pre>
        </details>
      </footer>
    </div>
  );
}

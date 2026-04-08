"use client";

/**
 * @module components/mathai/ThemeAtmosphere
 *
 * Floating decorative SVG layer that gives each theme a visual personality.
 * Renders behind all content (fixed, pointer-events:none, low opacity).
 *
 * Each theme gets its own set of small SVG motifs:
 *   - Magic Garden: flowers, sparkles, sun rays
 *   - Space Buddy:  stars, planets, orbit rings
 *   - Neo Scholar:  geometric shapes, hexagons, angles
 *   - Focus Mode:   minimal dots, thin lines (barely visible)
 */

import { useTheme, type ThemeId } from "@/lib/theme";

// ─── SVG motifs per theme ────────────────────────────────────────────────────

function GardenMotifs() {
  return (
    <>
      {/* Flower top-right */}
      <svg className="absolute top-[8%] right-[6%] w-10 h-10 opacity-[0.08]" viewBox="0 0 40 40" style={{ animation: "theme-float 8s ease-in-out infinite" }}>
        <circle cx="20" cy="12" r="5" fill="var(--theme-accent)" />
        <circle cx="12" cy="20" r="5" fill="var(--theme-accent)" />
        <circle cx="28" cy="20" r="5" fill="var(--theme-accent)" />
        <circle cx="20" cy="28" r="5" fill="var(--theme-accent)" />
        <circle cx="20" cy="20" r="4" fill="#fbbf24" />
      </svg>
      {/* Sparkle mid-left */}
      <svg className="absolute top-[35%] left-[4%] w-6 h-6 opacity-[0.1]" viewBox="0 0 24 24" style={{ animation: "theme-twinkle 4s ease-in-out infinite" }}>
        <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" fill="#fbbf24" />
      </svg>
      {/* Small flower bottom-left */}
      <svg className="absolute bottom-[15%] left-[8%] w-7 h-7 opacity-[0.06]" viewBox="0 0 28 28" style={{ animation: "theme-drift 10s ease-in-out infinite" }}>
        <circle cx="14" cy="8" r="4" fill="var(--theme-accent)" />
        <circle cx="8" cy="14" r="4" fill="var(--theme-accent)" />
        <circle cx="20" cy="14" r="4" fill="var(--theme-accent)" />
        <circle cx="14" cy="20" r="4" fill="var(--theme-accent)" />
        <circle cx="14" cy="14" r="3" fill="#fde68a" />
      </svg>
      {/* Leaf top-left */}
      <svg className="absolute top-[18%] left-[15%] w-8 h-8 opacity-[0.05]" viewBox="0 0 32 32" style={{ animation: "theme-float 12s ease-in-out infinite 2s" }}>
        <ellipse cx="16" cy="16" rx="12" ry="6" fill="#86efac" transform="rotate(-30 16 16)" />
      </svg>
    </>
  );
}

function SpaceMotifs() {
  return (
    <>
      {/* Star top-right */}
      <svg className="absolute top-[10%] right-[8%] w-5 h-5 opacity-[0.12]" viewBox="0 0 20 20" style={{ animation: "theme-twinkle 3s ease-in-out infinite" }}>
        <path d="M10 0 L12.5 7.5 L20 10 L12.5 12.5 L10 20 L7.5 12.5 L0 10 L7.5 7.5 Z" fill="var(--theme-accent)" />
      </svg>
      {/* Planet mid-left */}
      <svg className="absolute top-[30%] left-[5%] w-10 h-10 opacity-[0.07]" viewBox="0 0 40 40" style={{ animation: "theme-float 10s ease-in-out infinite" }}>
        <circle cx="20" cy="20" r="10" fill="var(--theme-accent)" />
        <ellipse cx="20" cy="20" rx="18" ry="5" fill="none" stroke="var(--theme-accent)" strokeWidth="1" opacity="0.5" transform="rotate(-20 20 20)" />
      </svg>
      {/* Small stars scattered */}
      <svg className="absolute top-[55%] right-[12%] w-4 h-4 opacity-[0.1]" viewBox="0 0 16 16" style={{ animation: "theme-twinkle 5s ease-in-out infinite 1s" }}>
        <path d="M8 0 L9.5 6.5 L16 8 L9.5 9.5 L8 16 L6.5 9.5 L0 8 L6.5 6.5 Z" fill="#c4b5fd" />
      </svg>
      {/* Orbit ring bottom-left */}
      <svg className="absolute bottom-[20%] left-[10%] w-12 h-12 opacity-[0.05]" viewBox="0 0 48 48" style={{ animation: "theme-drift 14s ease-in-out infinite" }}>
        <circle cx="24" cy="24" r="20" fill="none" stroke="var(--theme-accent)" strokeWidth="1" strokeDasharray="4 4" />
        <circle cx="24" cy="4" r="3" fill="#a5b4fc" />
      </svg>
    </>
  );
}

function ScholarMotifs() {
  return (
    <>
      {/* Hexagon top-right */}
      <svg className="absolute top-[12%] right-[7%] w-8 h-8 opacity-[0.05]" viewBox="0 0 32 32" style={{ animation: "theme-drift 12s ease-in-out infinite" }}>
        <polygon points="16,2 28,9 28,23 16,30 4,23 4,9" fill="none" stroke="var(--theme-accent)" strokeWidth="1.5" />
      </svg>
      {/* Triangle mid-left */}
      <svg className="absolute top-[40%] left-[5%] w-6 h-6 opacity-[0.04]" viewBox="0 0 24 24" style={{ animation: "theme-float 10s ease-in-out infinite 1s" }}>
        <polygon points="12,2 22,20 2,20" fill="none" stroke="var(--theme-accent)" strokeWidth="1.5" />
      </svg>
      {/* Circle bottom-right */}
      <svg className="absolute bottom-[18%] right-[10%] w-6 h-6 opacity-[0.04]" viewBox="0 0 24 24" style={{ animation: "theme-pulse-soft 6s ease-in-out infinite" }}>
        <circle cx="12" cy="12" r="10" fill="none" stroke="var(--theme-accent)" strokeWidth="1.5" />
      </svg>
    </>
  );
}

function FocusMotifs() {
  // Focus Mode: nearly invisible, just a couple of minimal lines
  return (
    <>
      <svg className="absolute top-[15%] right-[10%] w-6 h-6 opacity-[0.03]" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3" fill="none" stroke="var(--theme-accent)" strokeWidth="1" />
      </svg>
      <svg className="absolute bottom-[25%] left-[8%] w-4 h-4 opacity-[0.025]" viewBox="0 0 16 16">
        <line x1="0" y1="8" x2="16" y2="8" stroke="var(--theme-accent)" strokeWidth="1" />
        <line x1="8" y1="0" x2="8" y2="16" stroke="var(--theme-accent)" strokeWidth="1" />
      </svg>
    </>
  );
}

const MOTIF_MAP: Record<ThemeId, () => React.ReactNode> = {
  "magic-garden": GardenMotifs,
  "space-buddy":  SpaceMotifs,
  "neo-scholar":  ScholarMotifs,
  "focus-mode":   FocusMotifs,
};

// ─── Main component ──────────────────────────────────────────────────────────

export function ThemeAtmosphere() {
  const { theme } = useTheme();
  const Motifs = MOTIF_MAP[theme];

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      <Motifs />
    </div>
  );
}

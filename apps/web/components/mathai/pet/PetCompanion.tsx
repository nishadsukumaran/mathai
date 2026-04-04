"use client";

/**
 * @module components/mathai/pet/PetCompanion
 *
 * Floating 2.5D companion — bare emoji with layered idle animation.
 * No card, no circle holder, no text. Pure living character presence.
 *
 * Animations (all Framer Motion, lightweight):
 *   - Float: gentle y oscillation (3s)
 *   - Breathe: subtle scale pulse (4s)
 *   - Tilt: micro rotation (5s)
 *   - Shadow: synced with float position
 *   - Glow: personality-colored radial aura behind emoji
 *   - Mood overrides: happy/cheering/thinking etc from pet engine
 *
 * All pet details (name, stats, personality) live in PetShowcase on /profile.
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePet } from "@/hooks/use-pet";
import type { PetReaction } from "@/lib/petEngine";
import type { Variants } from "framer-motion";

// ─── Mood animation overrides (play once, idle resumes) ──────────────────────

const MOOD_VARIANTS: Variants = {
  idle:     {},
  happy:    { scale: [1, 1.2, 1], rotate: [0, -8, 8, 0], transition: { duration: 0.5 } },
  cheering: { scale: [1, 1.3, 1], y: [0, -14, 0], transition: { duration: 0.6 } },
  thinking: { rotate: [0, -5, 5, 0], transition: { duration: 1, repeat: 2 } },
  proud:    { scale: [1, 1.15, 1], transition: { duration: 0.4 } },
  excited:  { scale: [1, 1.3, 1], y: [0, -16, 0], rotate: [0, -10, 10, 0], transition: { duration: 0.7 } },
};

// ─── Aura glow colors ────────────────────────────────────────────────────────

const GLOW: Record<string, string> = {
  yellow: "rgba(250,204,21,0.25)", orange: "rgba(251,146,60,0.25)",
  red: "rgba(248,113,113,0.2)", blue: "rgba(96,165,250,0.25)",
  green: "rgba(74,222,128,0.25)", purple: "rgba(167,139,250,0.25)",
};

interface Props {
  reaction: PetReaction;
  className?: string;
}

export function PetCompanion({ reaction, className }: Props) {
  const { pet, catalog, effects, loading } = usePet();
  const [bubble, setBubble] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const lastMsg = useRef<string | undefined>();

  useEffect(() => {
    if (reaction.message && reaction.message !== lastMsg.current) {
      lastMsg.current = reaction.message;
      setBubble(reaction.message);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setBubble(null), 2500);
    } else if (!reaction.message && bubble) {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setBubble(null), 800);
    }
    return () => clearTimeout(timer.current);
  }, [reaction.message]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return null;

  // Egg state
  if (!pet || !catalog || !effects) {
    return (
      <div className={`relative ${className ?? ""}`}>
        <motion.span
          animate={{ y: [0, -4, 0], scale: [1, 1.02, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="text-3xl block select-none cursor-default"
          title="Complete a practice session to hatch your pet!"
        >
          🥚
        </motion.span>
      </div>
    );
  }

  // Active floating companion
  const glow = effects.auraColor ? (GLOW[effects.auraColor] ?? "rgba(129,140,248,0.2)") : "rgba(129,140,248,0.2)";
  const reacting = reaction.mood !== "idle";

  return (
    <a href="/profile#pet" className={`relative group block ${className ?? ""}`}
      title={`${pet.petName ?? catalog.name} — tap for details`}>

      {/* Speech bubble */}
      <AnimatePresence>
        {bubble && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.85 }}
            transition={{ duration: 0.2 }}
            className="absolute -top-9 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
          >
            <div className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-md rounded-full px-3 py-1 text-[11px] font-medium text-gray-600 whitespace-nowrap">
              {bubble}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Aura glow — radial gradient behind pet */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 rounded-full blur-xl pointer-events-none"
        style={{ background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`, transform: "scale(2)" }}
      />

      {/* Pet emoji with layered idle animation */}
      <motion.div
        variants={MOOD_VARIANTS}
        animate={reacting ? reaction.mood : undefined}
        className="relative"
      >
        {/* Float */}
        <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
          {/* Breathe */}
          <motion.div animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
            {/* Tilt */}
            <motion.div animate={{ rotate: [-1.5, 1.5, -1.5] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
              <span className="text-5xl block select-none group-hover:scale-110 transition-transform duration-200"
                role="img" aria-label={`${catalog.name} pet companion`}>
                {catalog.emoji}
              </span>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Dynamic shadow synced with float */}
      <motion.div
        animate={{ scaleX: [1, 0.85, 1], opacity: [0.15, 0.07, 0.15] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-10 h-2 rounded-full bg-black/20 blur-sm pointer-events-none"
      />

      {/* Evolved sparkle */}
      {effects.isEvolved && (
        <motion.span
          animate={{ opacity: [0.7, 1, 0.7], scale: [0.9, 1.1, 0.9] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-1 -right-1 text-xs pointer-events-none" aria-hidden>
          ✨
        </motion.span>
      )}
    </a>
  );
}

"use client";

/**
 * @module components/mathai/pet/PetCompanion
 *
 * Dashboard companion — prominent 2.5D-style pet presence.
 * Shows the pet as a living character with mood, speech, and personality.
 *
 * Receives PetReaction from the pet engine. Pure display — zero logic.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePet } from "@/hooks/use-pet";
import type { PetReaction } from "@/lib/petEngine";
import type { Variants } from "framer-motion";

// ─── Mood animations (applied to the avatar) ────────────────────────────────

const MOOD_VARIANTS: Variants = {
  idle:     { y: [0, -4, 0], transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" } },
  happy:    { scale: [1, 1.15, 1], rotate: [0, -6, 6, 0], transition: { duration: 0.5 } },
  cheering: { scale: [1, 1.2, 1], y: [0, -10, 0], transition: { duration: 0.6 } },
  thinking: { rotate: [0, -4, 4, 0], transition: { duration: 1.2, repeat: Infinity } },
  proud:    { scale: [1, 1.12, 1], transition: { duration: 0.4 } },
  excited:  { scale: [1, 1.25, 1], y: [0, -12, 0], rotate: [0, -8, 8, 0], transition: { duration: 0.7 } },
};

// ─── Aura color map ───���──────────────────────────────────────────────────────

const AURA_BG: Record<string, string> = {
  yellow: "from-yellow-100 to-yellow-50",
  orange: "from-orange-100 to-orange-50",
  red:    "from-red-100 to-red-50",
  blue:   "from-blue-100 to-blue-50",
  green:  "from-green-100 to-green-50",
  purple: "from-purple-100 to-purple-50",
};

interface PetCompanionProps {
  reaction: PetReaction;
  className?: string;
}

export function PetCompanion({ reaction, className }: PetCompanionProps) {
  const { pet, catalog, effects, loading } = usePet();
  const [bubble, setBubble]   = useState<string | null>(null);
  const bubbleTimer           = useRef<ReturnType<typeof setTimeout>>();
  const lastMessageRef        = useRef<string | undefined>(undefined);

  // Show speech bubble on reaction message change
  useEffect(() => {
    if (reaction.message && reaction.message !== lastMessageRef.current) {
      lastMessageRef.current = reaction.message;
      setBubble(reaction.message);
      clearTimeout(bubbleTimer.current);
      bubbleTimer.current = setTimeout(() => setBubble(null), 2500);
    } else if (!reaction.message && bubble) {
      clearTimeout(bubbleTimer.current);
      bubbleTimer.current = setTimeout(() => setBubble(null), 800);
    }
    return () => clearTimeout(bubbleTimer.current);
  }, [reaction.message]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return null;

  // ── Egg state ──────────────────────────────────────────────────────────

  if (!pet || !catalog || !effects) {
    return (
      <div className={className}>
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-4 flex items-center gap-4">
          <motion.span
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-4xl shrink-0"
          >
            🥚
          </motion.span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-amber-800 text-sm">A mystery egg!</p>
            <p className="text-[10px] text-amber-600 mt-0.5">Complete a practice session to hatch it</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Active pet ────���────────────────────────────────────────────────────

  const displayName = pet.petName ?? catalog.name;
  const auraBg = effects.auraColor
    ? AURA_BG[effects.auraColor] ?? "from-indigo-100 to-indigo-50"
    : "from-indigo-100 to-indigo-50";

  return (
    <div className={className}>
      <a href="/profile#pet" className="block group">
        <div className={`relative bg-gradient-to-br ${auraBg} rounded-2xl border border-gray-100 p-4 overflow-hidden hover:shadow-sm transition-shadow`}>

          {/* Speech bubble */}
          <AnimatePresence>
            {bubble && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="absolute -top-1 left-1/2 -translate-x-1/2 z-10"
              >
                <div className="bg-white border border-gray-200 shadow-sm rounded-full px-3 py-1 text-[11px] font-medium text-gray-600 whitespace-nowrap">
                  {bubble}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-4">
            {/* Large animated pet avatar */}
            <motion.div
              variants={MOOD_VARIANTS}
              animate={reaction.mood}
              className="shrink-0"
            >
              <div className="w-16 h-16 rounded-full bg-white/80 flex items-center justify-center shadow-sm relative">
                <span className="text-4xl" role="img" aria-label={`${displayName} pet`}>
                  {catalog.emoji}
                </span>
                {effects.isEvolved && (
                  <span className="absolute -bottom-0.5 -right-0.5 text-xs" aria-hidden>⭐</span>
                )}
                {effects.streakIcon && (
                  <span className="absolute -top-0.5 -right-0.5 text-xs" aria-hidden>{effects.streakIcon}</span>
                )}
              </div>
            </motion.div>

            {/* Pet info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold text-gray-800 text-sm truncate">{displayName}</p>
                {effects.isEvolved && (
                  <span className="text-[9px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded shrink-0">EVOLVED</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs">{effects.icon}</span>
                <span className="text-[11px] text-gray-500 font-medium">{effects.label}</span>
              </div>
              {/* Mini stat strip */}
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-[10px] text-gray-400">
                  <span className="font-semibold text-indigo-600">{Math.round((pet.accuracyRate ?? 0) * 100)}%</span> accuracy
                </span>
                <span className="text-[10px] text-gray-400">
                  <span className="font-semibold text-emerald-600">{pet.questionsAnswered ?? 0}</span> questions
                </span>
              </div>
            </div>

            {/* Arrow to profile */}
            <span className="text-gray-300 text-sm shrink-0 group-hover:text-indigo-400 transition-colors">→</span>
          </div>
        </div>
      </a>
    </div>
  );
}

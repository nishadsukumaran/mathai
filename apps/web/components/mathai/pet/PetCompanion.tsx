"use client";

/**
 * @module components/mathai/pet/PetCompanion
 *
 * Floating companion widget — PURE DISPLAY COMPONENT.
 *
 * Receives a PetReaction from the pet engine (via usePetEngine hook).
 * Renders the avatar, animation, speech bubble, and expandable panel.
 * Contains ZERO behavior logic — all decisions are made by petEngine.ts.
 *
 * Usage:
 *   const { reaction, trigger } = usePetEngine(pet?.personality);
 *   <PetCompanion reaction={reaction} />
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePet } from "@/hooks/use-pet";
import type { PetReaction, PetMood, PetAnimation } from "@/lib/petEngine";

// ─── Framer Motion variants per mood ─────────────────────────────────────────

const ANIMATION_VARIANTS: Record<PetMood, object> = {
  idle:     { y: [0, -3, 0], transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" } },
  happy:    { scale: [1, 1.15, 1], rotate: [0, -5, 5, 0], transition: { duration: 0.5 } },
  cheering: { scale: [1, 1.2, 1], y: [0, -8, 0], transition: { duration: 0.6 } },
  thinking: { rotate: [0, -3, 3, 0], transition: { duration: 1.2, repeat: Infinity } },
  proud:    { scale: [1, 1.1, 1], transition: { duration: 0.4 } },
  excited:  { scale: [1, 1.25, 1], y: [0, -10, 0], rotate: [0, -8, 8, 0], transition: { duration: 0.7 } },
};

// ─── Props ───────────────────────────────────────────────────────────────────

interface PetCompanionProps {
  /** Reaction state from usePetEngine — drives mood, animation, and speech */
  reaction: PetReaction;
  /** Optional className for positioning */
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PetCompanion({ reaction, className }: PetCompanionProps) {
  const { pet, catalog, effects, loading } = usePet();
  const [expanded, setExpanded] = useState(false);
  const [bubble, setBubble]     = useState<string | null>(null);
  const bubbleTimer             = useRef<ReturnType<typeof setTimeout>>();
  const lastMessageRef          = useRef<string | undefined>(undefined);

  // Show speech bubble when reaction.message changes
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

  const toggleExpand = useCallback(() => setExpanded((v) => !v), []);

  if (loading || !pet || !catalog || !effects) return null;

  const displayName = pet.petName ?? catalog.name;
  const emoji       = catalog.emoji;

  return (
    <div className={`relative ${className ?? ""}`}>

      {/* Speech bubble */}
      <AnimatePresence>
        {bubble && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap z-10"
          >
            <div className="bg-white border border-gray-200 shadow-sm rounded-full px-3 py-1 text-xs font-medium text-gray-600">
              {bubble}
            </div>
            <div className="w-2 h-2 bg-white border-r border-b border-gray-200 rotate-45 mx-auto -mt-1" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pet avatar pill */}
      <motion.button
        onClick={toggleExpand}
        variants={ANIMATION_VARIANTS}
        animate={reaction.mood}
        className="flex items-center gap-2 bg-white border border-gray-200 rounded-full pl-1.5 pr-3 py-1 shadow-sm hover:shadow-md transition-shadow cursor-pointer select-none"
        aria-label={`${displayName} — your learning companion`}
        title={`${displayName} (${effects.label})`}
      >
        <span className="relative w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-lg">
          {emoji}
          {effects.isEvolved && (
            <span className="absolute -top-0.5 -right-0.5 text-[8px]" aria-hidden>⭐</span>
          )}
        </span>
        <span className="text-xs font-semibold text-gray-700 leading-none">{displayName}</span>
      </motion.button>

      {/* Expanded detail panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg p-4 z-20"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">{displayName}</p>
                <p className="text-[10px] text-gray-400">{effects.label}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed mb-3">{effects.description}</p>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-gray-50 rounded-lg py-1.5">
                <p className="text-xs font-bold text-indigo-600">{Math.round((pet.accuracyRate ?? 0) * 100)}%</p>
                <p className="text-[9px] text-gray-400">Accuracy</p>
              </div>
              <div className="bg-gray-50 rounded-lg py-1.5">
                <p className="text-xs font-bold text-emerald-600">{pet.questionsAnswered ?? 0}</p>
                <p className="text-[9px] text-gray-400">Questions</p>
              </div>
            </div>
            <a href="/profile#pet" className="block mt-3 text-center text-[10px] font-semibold text-indigo-500 hover:text-indigo-700 transition">
              Manage Pet →
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {expanded && <div className="fixed inset-0 z-10" onClick={() => setExpanded(false)} />}
    </div>
  );
}

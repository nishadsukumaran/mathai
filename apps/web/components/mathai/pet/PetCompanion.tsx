"use client";

/**
 * @module components/mathai/pet/PetCompanion
 *
 * Floating companion widget — the pet lives near the top of the screen
 * as a persistent, reactive learning companion.
 *
 * Features:
 *   - Compact floating state (emoji + name in a pill)
 *   - Expandable detail panel (tap to expand)
 *   - Idle animation (gentle bob + occasional scale)
 *   - Reactive mood states (idle, happy, cheering, thinking, proud)
 *   - Speech bubble with short supportive messages
 *   - Framer Motion only — lightweight, no heavy deps
 *
 * Data: uses usePet() hook (same as PetCard).
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePet } from "@/hooks/use-pet";

// ─── Mood types ──────────────────────────────────────────────────────────────

export type PetMood = "idle" | "happy" | "cheering" | "thinking" | "proud";

// ─── Speech bubble messages per mood ─────────────────────────────────────────

const SPEECH: Record<PetMood, string[]> = {
  idle:     ["Let's learn!", "I'm here for you", "Ready when you are"],
  happy:    ["Nice one!", "You got it!", "Awesome!"],
  cheering: ["Amazing streak!", "Unstoppable!", "Keep going!"],
  thinking: ["Hmm, let's think...", "Take your time", "You can do this"],
  proud:    ["Great recovery!", "Never give up!", "That's the spirit!"],
};

function pickSpeech(mood: PetMood): string {
  const pool = SPEECH[mood];
  return pool[Math.floor(Math.random() * pool.length)]!;
}

// ─── Idle animation variants ─────────────────────────────────────────────────

const idleVariants = {
  idle: {
    y: [0, -3, 0],
    transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
  },
  happy: {
    scale: [1, 1.15, 1],
    rotate: [0, -5, 5, 0],
    transition: { duration: 0.5 },
  },
  cheering: {
    scale: [1, 1.2, 1],
    y: [0, -8, 0],
    transition: { duration: 0.6 },
  },
  thinking: {
    rotate: [0, -3, 3, 0],
    transition: { duration: 1.2, repeat: Infinity },
  },
  proud: {
    scale: [1, 1.1, 1],
    transition: { duration: 0.4 },
  },
};

// ─── Props ───────────────────────────────────────────────────────────────────

interface PetCompanionProps {
  /** Current mood — set from parent based on learning events */
  mood?: PetMood;
  /** Optional className for positioning */
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PetCompanion({ mood = "idle", className }: PetCompanionProps) {
  const { pet, catalog, effects, loading } = usePet();
  const [expanded, setExpanded]   = useState(false);
  const [bubble, setBubble]       = useState<string | null>(null);
  const bubbleTimer               = useRef<ReturnType<typeof setTimeout>>();
  const lastMood                  = useRef<PetMood>(mood);

  // Show speech bubble on mood change (not on every render)
  useEffect(() => {
    if (mood !== lastMood.current && mood !== "idle") {
      lastMood.current = mood;
      const msg = pickSpeech(mood);
      setBubble(msg);
      clearTimeout(bubbleTimer.current);
      bubbleTimer.current = setTimeout(() => setBubble(null), 2500);
    } else if (mood === "idle" && lastMood.current !== "idle") {
      lastMood.current = "idle";
      // Clear bubble when returning to idle
      clearTimeout(bubbleTimer.current);
      bubbleTimer.current = setTimeout(() => setBubble(null), 1000);
    }
    return () => clearTimeout(bubbleTimer.current);
  }, [mood]);

  // Trigger occasional idle speech (every ~30s when idle)
  useEffect(() => {
    if (mood !== "idle") return;
    const interval = setInterval(() => {
      if (Math.random() < 0.3) { // 30% chance each tick
        setBubble(pickSpeech("idle"));
        clearTimeout(bubbleTimer.current);
        bubbleTimer.current = setTimeout(() => setBubble(null), 2500);
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, [mood]);

  const toggleExpand = useCallback(() => setExpanded((v) => !v), []);

  if (loading || !pet || !catalog || !effects) {
    return null; // Don't render placeholder — companion appears when data is ready
  }

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
            {/* Tiny triangle pointer */}
            <div className="w-2 h-2 bg-white border-r border-b border-gray-200 rotate-45 mx-auto -mt-1" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pet avatar — floating pill */}
      <motion.button
        onClick={toggleExpand}
        variants={idleVariants}
        animate={mood}
        className="flex items-center gap-2 bg-white border border-gray-200 rounded-full pl-1.5 pr-3 py-1 shadow-sm hover:shadow-md transition-shadow cursor-pointer select-none"
        aria-label={`${displayName} — your learning companion`}
        title={`${displayName} (${effects.label})`}
      >
        {/* Emoji with aura ring */}
        <span className="relative w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-lg">
          {emoji}
          {effects.isEvolved && (
            <span className="absolute -top-0.5 -right-0.5 text-[8px]" aria-hidden>⭐</span>
          )}
        </span>
        <span className="text-xs font-semibold text-gray-700 leading-none">{displayName}</span>
      </motion.button>

      {/* Expanded panel */}
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

            {/* Mini stats */}
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

      {/* Backdrop to close expanded panel */}
      {expanded && (
        <div className="fixed inset-0 z-10" onClick={() => setExpanded(false)} />
      )}
    </div>
  );
}

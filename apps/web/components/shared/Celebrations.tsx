"use client";

/**
 * @module components/shared/Celebrations
 *
 * Lightweight celebration animations triggered on meaningful learning events.
 * Uses Framer Motion. All animations are <800ms, non-blocking, and subtle.
 */

import { motion, AnimatePresence } from "framer-motion";

// ─── Correct Answer Burst ─────────────────────────────────────────────────────
// Small green checkmark that scales up then fades. Shown on correct answers.

export function CorrectBurst({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 text-lg"
        >
          ✓
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── XP Float ─────────────────────────────────────────────────────────────────
// Floating XP indicator that rises and fades. Replaces the old bounce animation.

export function XPFloat({ amount, show }: { amount: number; show: boolean }) {
  return (
    <AnimatePresence>
      {show && amount > 0 && (
        <motion.div
          initial={{ y: 0, opacity: 1 }}
          animate={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <span className="text-lg font-bold text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full shadow-sm">
            +{amount} XP
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Session Complete Entrance ─────────────────────────────────────────────────
// Wraps the session complete card with a scale-up entrance.

export function SessionCompleteEntrance({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ─── Streak Flame Pulse ───────────────────────────────────────────────────────
// Pulsing flame for streak milestones (3, 7, 14 days).

export function StreakPulse({ streak }: { streak: number }) {
  const isMilestone = streak === 3 || streak === 7 || streak === 14 || streak === 30;
  if (!isMilestone) return null;

  return (
    <motion.span
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.3, 1] }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="inline-block"
    >
      🔥
    </motion.span>
  );
}

// ─── Fade In wrapper ──────────────────────────────────────────────────────────
// Generic fade-in for cards and sections. delay prop for staggered entry.

export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

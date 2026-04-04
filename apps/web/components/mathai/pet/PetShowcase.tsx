"use client";

/**
 * @module components/mathai/pet/PetShowcase
 *
 * Hero active pet view — the pet is the star, not a labeled card.
 *
 * Design:
 *   - Large centered emoji with layered aura glow (160px)
 *   - Evolution badge prominent under avatar
 *   - Progress bar to next personality evaluation
 *   - Compact radial stats (accuracy, speed, independence)
 *   - Name and personality secondary/small
 *   - Link to collection view
 */

import { motion }             from "framer-motion";
import { usePet }              from "@/hooks/use-pet";
import { PetDisplay }          from "./PetDisplay";
import { PetPersonalityBadge } from "./PetPersonalityBadge";

const PERSONALITY_EVAL_INTERVAL = 50; // matches backend

export function PetShowcase() {
  const { pet, catalog, effects, loading, error } = usePet();

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 animate-pulse">
        <div className="w-40 h-40 rounded-full bg-gray-100 mx-auto" />
      </div>
    );
  }

  // Egg state — no pet yet
  if (!pet || !catalog || !effects) {
    return (
      <div className="bg-gradient-to-b from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-8 text-center">
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-7xl mb-4"
        >
          🥚
        </motion.div>
        <p className="font-bold text-amber-800">A mystery egg!</p>
        <p className="text-xs text-amber-600 mt-1">Complete your first practice session to hatch your pet.</p>
      </div>
    );
  }

  if (error) return null;

  const displayName = pet.petName ?? catalog.name;
  const accuracyPct = Math.round((pet.accuracyRate ?? 0) * 100);
  const hintPct     = Math.round((pet.hintUsageRate ?? 0) * 100);
  const retryPct    = Math.round((pet.retrySuccessRate ?? 0) * 100);

  // Progress to next personality evaluation
  const questionsAnswered = pet.questionsAnswered ?? 0;
  const nextEval          = Math.ceil((questionsAnswered + 1) / PERSONALITY_EVAL_INTERVAL) * PERSONALITY_EVAL_INTERVAL;
  const progressToEval    = PERSONALITY_EVAL_INTERVAL > 0
    ? Math.round(((questionsAnswered % PERSONALITY_EVAL_INTERVAL) / PERSONALITY_EVAL_INTERVAL) * 100)
    : 0;
  const questionsToNext   = nextEval - questionsAnswered;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

      {/* Hero area — gradient background with large pet */}
      <div className="bg-gradient-to-b from-indigo-50 via-purple-50 to-white pt-8 pb-4 flex flex-col items-center">
        {/* Large pet avatar */}
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <PetDisplay
            emoji={catalog.emoji}
            name={displayName}
            effects={effects}
            size="xl"
          />
        </motion.div>

        {/* Evolution badge */}
        {effects.isEvolved && (
          <div className="mt-3 flex items-center gap-1.5 bg-amber-100 border border-amber-200 rounded-full px-3 py-1">
            <span className="text-xs">✨</span>
            <span className="text-xs font-bold text-amber-700">Evolved Form</span>
            <span className="text-xs">✨</span>
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="px-6 pb-6 space-y-5">

        {/* Personality + name (secondary) */}
        <div className="text-center -mt-1">
          <PetPersonalityBadge effects={effects} size="md" />
          <p className="text-sm text-gray-500 mt-1.5">{displayName}</p>
          <p className="text-[10px] text-gray-300">{catalog.rarity}</p>
        </div>

        {/* Progress to next evolution check */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Next personality check
            </span>
            <span className="text-[10px] text-gray-400">
              {questionsToNext} question{questionsToNext !== 1 ? "s" : ""} away
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressToEval}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Stats — radial circles */}
        <div className="grid grid-cols-3 gap-3">
          <StatCircle label="Accuracy" value={accuracyPct} color="text-indigo-600" bgColor="stroke-indigo-500" />
          <StatCircle label="Independence" value={Math.max(0, 100 - hintPct)} color="text-emerald-600" bgColor="stroke-emerald-500" />
          <StatCircle label="Retry Success" value={retryPct} color="text-amber-600" bgColor="stroke-amber-500" />
        </div>

        {/* Questions answered */}
        <p className="text-center text-[10px] text-gray-300">
          {questionsAnswered} question{questionsAnswered !== 1 ? "s" : ""} answered
        </p>
      </div>
    </div>
  );
}

// ─── Radial stat circle ──────────────────────────────────────────────────────

function StatCircle({ label, value, color, bgColor }: {
  label: string; value: number; color: string; bgColor: string;
}) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-16 h-16">
        <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
          <circle cx="32" cy="32" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="4" />
          <motion.circle
            cx="32" cy="32" r={radius} fill="none"
            className={bgColor}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-sm font-bold ${color}`}>{value}%</span>
        </div>
      </div>
      <p className="text-[10px] text-gray-400 mt-1 text-center">{label}</p>
    </div>
  );
}

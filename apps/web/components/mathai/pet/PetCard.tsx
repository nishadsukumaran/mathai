"use client";
/**
 * @module components/mathai/pet/PetCard
 *
 * Full pet card — shown on the dashboard and profile page.
 *
 * Displays:
 *   - Pet emoji (animated, with aura)
 *   - Pet name + personality badge
 *   - Short personality description
 *   - Behavior stat bar (accuracy, speed indicator, streak flame)
 *   - Unlocked pets roster with adopt button
 *
 * Data source: usePet() hook (GET /api/pet).
 */

import { useState }              from "react";
import { usePet }                from "@/hooks/use-pet";
import { PetDisplay }            from "./PetDisplay";
import { PetPersonalityBadge }   from "./PetPersonalityBadge";
import type { PetCatalogEntry }  from "@/types";

interface Props {
  /** If true, renders a compact single-row widget instead of the full card. */
  compact?: boolean;
}

export function PetCard({ compact = false }: Props) {
  const { pet, catalog, effects, unlockedPets, loading, error, adoptPet } = usePet();
  const [showRoster, setShowRoster] = useState(false);
  const [adopting, setAdopting]     = useState<string | null>(null);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="rounded-3xl bg-white border border-indigo-100 p-4 animate-pulse flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-indigo-100" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-indigo-100 rounded w-1/3" />
          <div className="h-3 bg-indigo-50 rounded w-1/2" />
        </div>
      </div>
    );
  }

  // ── Error / no pet ───────────────────────────────────────────────────────────
  if (error || !pet || !catalog || !effects) {
    return (
      <div className="rounded-3xl bg-white border border-indigo-100 p-4 text-center text-sm text-gray-400">
        🐾 Adopt a pet to track your learning personality!
      </div>
    );
  }

  const displayName = pet.petName ?? catalog.name;

  // ── Compact widget (for dashboard header) ───────────────────────────────────
  if (compact) {
    return (
      <div className="flex items-center gap-3 bg-white rounded-2xl border border-indigo-100 px-4 py-2 shadow-sm">
        <PetDisplay emoji={catalog.emoji} name={displayName} effects={effects} size="sm" />
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-800 truncate">{displayName}</p>
          <PetPersonalityBadge effects={effects} size="sm" />
        </div>
      </div>
    );
  }

  // ── Full card ────────────────────────────────────────────────────────────────
  const accuracyPct  = Math.round((pet.accuracyRate ?? 0) * 100);
  const hintPct      = Math.round((pet.hintUsageRate ?? 0) * 100);

  return (
    <div className="rounded-3xl bg-white border border-indigo-100 shadow-sm p-5 space-y-4">
      {/* Header row */}
      <div className="flex items-center gap-4">
        <PetDisplay
          emoji={catalog.emoji}
          name={displayName}
          effects={effects}
          size="md"
          showName={false}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-black text-gray-800">{displayName}</h3>
            {effects.isEvolved && (
              <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 font-semibold border border-amber-200">
                ✨ Evolved
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{catalog.name} · {catalog.rarity}</p>
          <div className="mt-1.5">
            <PetPersonalityBadge effects={effects} size="sm" />
          </div>
        </div>
      </div>

      {/* Personality description */}
      <p className="text-sm text-gray-600 leading-relaxed">{effects.description}</p>

      {/* Stat bars */}
      <div className="space-y-2">
        <StatBar label="Accuracy" value={accuracyPct} color="bg-indigo-500" />
        <StatBar
          label="Independent thinking"
          value={Math.max(0, 100 - hintPct)}
          color="bg-emerald-500"
        />
        {(pet.retrySuccessRate ?? 0) > 0 && (
          <StatBar
            label="Retry success"
            value={Math.round((pet.retrySuccessRate ?? 0) * 100)}
            color="bg-orange-400"
          />
        )}
      </div>

      {/* Questions answered */}
      <p className="text-xs text-gray-400 text-right">
        {pet.questionsAnswered ?? 0} questions answered
        {pet.lastEvaluatedAt && (
          <span> · last evaluated {new Date(pet.lastEvaluatedAt).toLocaleDateString()}</span>
        )}
      </p>

      {/* Unlocked pets roster */}
      {unlockedPets.length > 1 && (
        <div className="border-t border-indigo-50 pt-3">
          <button
            onClick={() => setShowRoster((v) => !v)}
            className="text-xs text-indigo-500 font-semibold w-full text-left flex items-center justify-between"
          >
            <span>🐾 My pets ({unlockedPets.length} unlocked)</span>
            <span>{showRoster ? "▲" : "▼"}</span>
          </button>

          {showRoster && (
            <div className="mt-2 grid grid-cols-3 gap-2">
              {unlockedPets.map((p: PetCatalogEntry) => {
                const isActive = p.id === pet.petId;
                return (
                  <button
                    key={p.id}
                    disabled={isActive || adopting === p.id}
                    onClick={async () => {
                      setAdopting(p.id);
                      try { await adoptPet(p.id); } finally { setAdopting(null); }
                    }}
                    title={isActive ? "Active pet" : `Switch to ${p.name}`}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all ${
                      isActive
                        ? "border-indigo-400 bg-indigo-50 cursor-default"
                        : "border-gray-100 bg-white hover:border-indigo-200 hover:bg-indigo-50 cursor-pointer"
                    }`}
                  >
                    <span className="text-2xl">{p.emoji}</span>
                    <span className="text-xs font-medium text-gray-700 leading-tight">{p.name}</span>
                    {isActive && <span className="text-xs text-indigo-500 font-bold">active</span>}
                    {adopting === p.id && <span className="text-xs text-gray-400">…</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Local StatBar sub-component ─────────────────────────────────────────────

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-0.5">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

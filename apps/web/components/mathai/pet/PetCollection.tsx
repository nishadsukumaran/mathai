"use client";

/**
 * @module components/mathai/pet/PetCollection
 *
 * Pet collection grid — shows all pets with collected/locked status.
 *
 * Collected pets: full color, name, rarity badge, equip button
 * Locked pets: faded/silhouette, "????", unlock requirement, lock icon
 * Equipped pet: indigo ring marker
 */

import { useState }             from "react";
import { usePet }               from "@/hooks/use-pet";
import { PET_CATALOG }          from "@/lib/petCatalog";

const RARITY_BADGE: Record<string, { bg: string; text: string }> = {
  common:    { bg: "bg-gray-100",   text: "text-gray-500" },
  rare:      { bg: "bg-indigo-100", text: "text-indigo-600" },
  legendary: { bg: "bg-amber-100",  text: "text-amber-700" },
};

export function PetCollection() {
  const { pet, unlockedPets, currentLevel, loading, adoptPet } = usePet();
  const [adopting, setAdopting] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-32 bg-gray-50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const unlockedIds = new Set(unlockedPets.map((p) => p.id));
  const activePetId = pet?.petId;

  async function handleAdopt(petId: string) {
    if (petId === activePetId || adopting) return;
    setAdopting(petId);
    try { await adoptPet(petId); } finally { setAdopting(null); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Collection
        </p>
        <p className="text-[10px] text-gray-400">
          {unlockedPets.length} / {PET_CATALOG.length} collected
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {PET_CATALOG.map((entry) => {
          const isUnlocked = unlockedIds.has(entry.id);
          const isActive   = entry.id === activePetId;
          const rarity     = RARITY_BADGE[entry.rarity] ?? RARITY_BADGE["common"]!;

          if (isUnlocked) {
            return (
              <button
                key={entry.id}
                onClick={() => handleAdopt(entry.id)}
                disabled={isActive || adopting === entry.id}
                className={`relative rounded-xl p-4 text-center transition active:scale-[0.97] ${
                  isActive
                    ? "bg-indigo-50 border-2 border-indigo-400 shadow-sm"
                    : "bg-white border border-gray-200 hover:border-indigo-300 hover:shadow-sm"
                }`}
              >
                {/* Equipped badge */}
                {isActive && (
                  <span className="absolute top-2 right-2 text-[8px] font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">
                    ACTIVE
                  </span>
                )}

                <span className="text-4xl block mb-2">{entry.emoji}</span>
                <p className="text-xs font-semibold text-gray-800 truncate">{entry.name}</p>
                <span className={`inline-block mt-1 text-[9px] font-semibold px-1.5 py-0.5 rounded capitalize ${rarity.bg} ${rarity.text}`}>
                  {entry.rarity}
                </span>

                {adopting === entry.id && (
                  <p className="text-[9px] text-gray-400 mt-1">Switching...</p>
                )}
              </button>
            );
          }

          // Locked pet
          return (
            <div
              key={entry.id}
              className="rounded-xl p-4 text-center bg-gray-50 border border-gray-100 opacity-60"
            >
              <span className="text-4xl block mb-2 grayscale brightness-50 blur-[1px]">{entry.emoji}</span>
              <p className="text-xs font-semibold text-gray-400">????</p>
              <p className="text-[9px] text-gray-400 mt-1">
                🔒 Level {entry.unlockLevel}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

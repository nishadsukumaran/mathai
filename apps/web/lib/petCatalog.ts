/**
 * @module lib/petCatalog
 *
 * Frontend-safe copy of PET_CATALOG for the collection view.
 * Mirrors the backend catalog in services/gamification/pet_personality_engine.ts.
 */

export const PET_CATALOG = [
  { id: "spark-owl",      name: "Spark Owl",       emoji: "🦉", rarity: "common"    as const, unlockLevel: 1  },
  { id: "math-fox",       name: "Math Fox",        emoji: "🦊", rarity: "common"    as const, unlockLevel: 3  },
  { id: "number-rabbit",  name: "Number Rabbit",   emoji: "🐰", rarity: "common"    as const, unlockLevel: 5  },
  { id: "logic-dragon",   name: "Logic Dragon",    emoji: "🐲", rarity: "rare"      as const, unlockLevel: 6  },
  { id: "fraction-panda",  name: "Fraction Panda",  emoji: "🐼", rarity: "rare"      as const, unlockLevel: 8  },
  { id: "equation-wolf",  name: "Equation Wolf",   emoji: "🐺", rarity: "legendary" as const, unlockLevel: 10 },
] as const;

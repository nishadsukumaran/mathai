/**
 * @module components/mathai/practice-menu
 *
 * Grade-aware AI practice menu — renders a set of PracticeMenuSections
 * each with a horizontal scroll strip of PracticeMenuItems.
 *
 * Wave 1: receives a `menu` prop built from a mock fixture.
 * Wave 2: parent fetches GET /api/practice/menu?grade=G4 and passes result.
 *
 * Clicking a card navigates to /practice?topicId=…&mode=…
 */

"use client";

import { useRouter }   from "next/navigation";
import { cn }          from "@/lib/utils";
import { MasteryRing } from "./mastery-ring";
import type {
  PracticeMenu,
  PracticeMenuSection,
  PracticeMenuItem,
  PracticeMenuSectionType,
  MasteryLevel,
} from "@/types";

// ─── Mock fixture (Wave 1) ────────────────────────────────────────────────────

export const MOCK_PRACTICE_MENU: PracticeMenu = {
  generatedAt: new Date().toISOString(),
  sections: [
    {
      type:     "best_for_you",
      title:    "Best for You",
      subtitle: "Personalised picks based on your progress",
      items: [
        { topicId: "g4-ops-multiplication", topicName: "Multiplication",   iconSlug: "✖️",  masteryLevel: "developing", accuracyPct: 62, suggestedMode: "guided",    reason: "You're getting there!",    isNew: false },
        { topicId: "g4-ops-division",       topicName: "Division",         iconSlug: "➗",  masteryLevel: "emerging",   accuracyPct: 45, suggestedMode: "guided",    reason: "Needs more practice",      isNew: false },
        { topicId: "g4-fractions-compare",  topicName: "Comparing Fractions", iconSlug: "½", masteryLevel: "emerging", accuracyPct: 51, suggestedMode: "guided",  reason: "Weak area spotted",        isNew: false },
      ],
    },
    {
      type:     "revise_this",
      title:    "Revise This",
      subtitle: "Topics you haven't practised recently",
      items: [
        { topicId: "g4-geometry-angles",    topicName: "Angles",           iconSlug: "📐",  masteryLevel: "developing", accuracyPct: 70, suggestedMode: "topic_practice",     reason: "Last practised 5 days ago", isNew: false },
        { topicId: "g4-measurement-area",   topicName: "Area",             iconSlug: "📏",  masteryLevel: "mastered",   accuracyPct: 85, suggestedMode: "topic_practice",     reason: "Keep it sharp!",            isNew: false },
      ],
    },
    {
      type:     "grade_level",
      title:    "Grade 4 Topics",
      subtitle: "All topics at your grade level",
      items: [
        { topicId: "g4-place-value",        topicName: "Place Value",      iconSlug: "🔢",  masteryLevel: "mastered",   accuracyPct: 90, suggestedMode: "review", reason: "Almost mastered!", isNew: false },
        { topicId: "g4-ops-addition",       topicName: "Addition",         iconSlug: "➕",  masteryLevel: "mastered",   accuracyPct: 88, suggestedMode: "topic_practice",     reason: "",                 isNew: false },
        { topicId: "g4-data-graphs",        topicName: "Graphs & Data",    iconSlug: "📊",  masteryLevel: "not_started",accuracyPct: 0,  suggestedMode: "guided",    reason: "Brand new!",       isNew: true  },
      ],
    },
    {
      type:     "challenge",
      title:    "Challenge Zone 🔥",
      subtitle: "Ready for something tough?",
      items: [
        { topicId: "g5-ops-long-division",  topicName: "Long Division",    iconSlug: "🧮",  masteryLevel: "not_started",accuracyPct: 0,  suggestedMode: "daily_challenge", reason: "Grade 5 challenge",        isNew: true  },
        { topicId: "g5-fractions-mixed",    topicName: "Mixed Numbers",    iconSlug: "🔀",  masteryLevel: "not_started",accuracyPct: 0,  suggestedMode: "daily_challenge", reason: "Grade 5 challenge",        isNew: true  },
      ],
    },
    {
      type:     "confidence_booster",
      title:    "Confidence Boost 💪",
      subtitle: "Topics you're great at — stay sharp",
      items: [
        { topicId: "g3-ops-addition",       topicName: "Addition (G3)",    iconSlug: "➕",  masteryLevel: "mastered",   accuracyPct: 95, suggestedMode: "topic_practice",     reason: "You've mastered this!",    isNew: false },
        { topicId: "g3-counting",           topicName: "Counting",         iconSlug: "🔢",  masteryLevel: "extended",   accuracyPct: 98, suggestedMode: "topic_practice",     reason: "Extended level!",          isNew: false },
      ],
    },
  ],
};

// ─── Section accent colours ───────────────────────────────────────────────────

const SECTION_ACCENT: Record<PracticeMenuSectionType, string> = {
  best_for_you:       "text-indigo-600 bg-indigo-50 border-indigo-100",
  revise_this:        "text-amber-600  bg-amber-50  border-amber-100",
  grade_level:        "text-emerald-600 bg-emerald-50 border-emerald-100",
  challenge:          "text-rose-600   bg-rose-50   border-rose-100",
  confidence_booster: "text-purple-600 bg-purple-50 border-purple-100",
  ai_picks:           "text-sky-600    bg-sky-50    border-sky-100",
};

// ─── PracticeMenuCard ─────────────────────────────────────────────────────────

interface PracticeMenuCardProps {
  item:       PracticeMenuItem;
  sectionType: PracticeMenuSectionType;
  onClick:    () => void;
}

function PracticeMenuCard({ item, sectionType, onClick }: PracticeMenuCardProps) {
  const accentCls = SECTION_ACCENT[sectionType];

  return (
    <button
      onClick={onClick}
      className="relative flex-shrink-0 w-40 bg-white rounded-3xl shadow-md border border-gray-100 p-4 text-left hover:shadow-lg hover:-translate-y-0.5 transition-all"
    >
      {/* New badge */}
      {item.isNew && (
        <span className="absolute top-3 right-3 bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">
          NEW
        </span>
      )}

      {/* Icon + mastery ring */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{item.iconSlug}</span>
        <MasteryRing
          level={item.masteryLevel as MasteryLevel}
          size={28}
        />
      </div>

      {/* Name */}
      <p className="font-bold text-gray-800 text-xs leading-tight mb-1 line-clamp-2">
        {item.topicName}
      </p>

      {/* Reason / mode chip */}
      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", accentCls)}>
        {item.suggestedMode === "guided"      && "Guided"}
        {item.suggestedMode === "topic_practice" && "Practice ⏱"}
        {item.suggestedMode === "daily_challenge" && "Challenge 🔥"}
        {item.suggestedMode === "review" && "Review"}
        {item.suggestedMode === "weak_area_booster" && "Boost 💪"}
      </span>
    </button>
  );
}

// ─── PracticeMenuSection ──────────────────────────────────────────────────────

interface PracticeMenuSectionProps {
  section: PracticeMenuSection;
}

function PracticeMenuSectionBlock({ section }: PracticeMenuSectionProps) {
  const router = useRouter();

  if (section.items.length === 0) return null;

  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2 px-1">
        <h3 className="font-black text-gray-800 text-base">{section.title}</h3>
        {section.subtitle && (
          <span className="text-xs text-gray-400 font-medium">{section.subtitle}</span>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {section.items.map((item) => (
          <PracticeMenuCard
            key={item.topicId}
            item={item}
            sectionType={section.type}
            onClick={() =>
              router.push(`/practice?topicId=${item.topicId}&mode=${item.suggestedMode}`)
            }
          />
        ))}
      </div>
    </div>
  );
}

// ─── PracticeMenuView (top-level) ─────────────────────────────────────────────

interface PracticeMenuViewProps {
  /** Pass null or undefined to use the built-in mock fixture */
  menu?:      PracticeMenu | null;
  loading?:   boolean;
  className?: string;
}

export function PracticeMenuView({ menu, loading = false, className }: PracticeMenuViewProps) {
  const data = menu ?? MOCK_PRACTICE_MENU;

  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <div className="h-4 w-32 bg-gray-200 rounded-full mb-3 animate-pulse" />
            <div className="flex gap-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="w-40 h-28 bg-gray-100 rounded-3xl animate-pulse flex-shrink-0" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {data.sections.map((section) => (
        <PracticeMenuSectionBlock key={section.type} section={section} />
      ))}
    </div>
  );
}

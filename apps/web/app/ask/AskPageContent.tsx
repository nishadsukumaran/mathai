/**
 * @module app/ask/AskPageContent
 *
 * Full-page Ask MathAI experience — full question input + full response view
 * (not a slide-up panel like on dashboard — dedicated screen).
 */

"use client";

import { useState, useRef, useCallback, useEffect }  from "react";
import { motion, AnimatePresence }                     from "framer-motion";
import { cn }                from "@/lib/utils";
import { clientPost }        from "@/lib/clientApi";
import { useProfile }        from "@/hooks/use-profile";
import { VisualRenderer }    from "@/components/mathai/visual";
import { ScenePlayer }       from "@/components/scene-engine";
import { MathText }          from "@/components/shared/MathText";
import { dispatchScene, isSceneEligible }  from "@/lib/scene-engine/dispatcher";
import { validateScenePlan }               from "@/lib/scene-engine/validator";
import { useSceneTelemetry }               from "@/hooks/useSceneTelemetry";
import type { ScenePlan }                  from "@/lib/scene-engine/types";
import type { AskMathAIResponse }          from "@/types";

// ─── Grade-based suggestions aligned to Cambridge Primary/Lower Secondary ────
// Each grade maps to Cambridge stage topics so students see relevant questions.

const SUGGESTIONS_BY_GRADE: Record<string, string[]> = {
  G1: [
    "How do I count to 100?",
    "What are tens and ones?",
    "How do I add numbers to 20?",
    "What are number bonds to 10?",
    "How do I take away numbers?",
    "What are 2D shapes like circles and squares?",
    "How do I compare which number is bigger?",
    "How do I use a number line?",
  ],
  G2: [
    "How do I add two-digit numbers?",
    "What is subtraction with regrouping?",
    "How do I count in 2s, 5s, and 10s?",
    "What are halves and quarters?",
    "How do I tell the time on a clock?",
    "What are 3D shapes?",
    "How do I measure length in centimetres?",
    "How do I solve simple word problems?",
  ],
  G3: [
    "How do I multiply numbers?",
    "What are multiplication tables?",
    "How does division work?",
    "What are fractions like 1/2, 1/3, and 1/4?",
    "How do I measure in metres and kilometres?",
    "What are right angles?",
    "How do I read a bar chart?",
    "How do I round numbers to the nearest 10?",
  ],
  G4: [
    "How do I do long multiplication?",
    "What are equivalent fractions?",
    "How do I add and subtract fractions?",
    "What are decimal numbers?",
    "How do I find the perimeter of a shape?",
    "What are lines of symmetry?",
    "How do I read and plot coordinates?",
    "What are factors and multiples?",
  ],
  G5: [
    "How do I multiply and divide decimals?",
    "What are improper fractions and mixed numbers?",
    "How do I calculate the area of a rectangle?",
    "What are percentages and how do they work?",
    "How do I convert between fractions, decimals, and percentages?",
    "What are angles in a triangle?",
    "How do I calculate the mean of a set of numbers?",
    "What are prime numbers and composite numbers?",
  ],
  G6: [
    "How do I divide fractions?",
    "What is ratio and proportion?",
    "How do I calculate the area of a triangle?",
    "What is the order of operations (BODMAS)?",
    "How do I work with negative numbers?",
    "What are algebraic expressions?",
    "How do I calculate the volume of a cuboid?",
    "How does probability work with dice and coins?",
  ],
  G7: [
    "How do I solve linear equations?",
    "What are integers and how do I add/subtract them?",
    "How do I calculate with percentages (increase/decrease)?",
    "What are the properties of parallel and perpendicular lines?",
    "How do I plot and interpret line graphs?",
    "What is the circumference of a circle?",
    "How do I simplify algebraic expressions?",
    "What is the difference between theoretical and experimental probability?",
  ],
  G8: [
    "How do I solve simultaneous equations?",
    "What are indices and powers?",
    "How do I factorise algebraic expressions?",
    "What is Pythagoras' theorem?",
    "How do I calculate the area of a circle?",
    "What are inequalities and how do I solve them?",
    "How do I construct and interpret pie charts?",
    "What are standard form and scientific notation?",
  ],
};

// Fallback for grades not in the map
const FALLBACK_SUGGESTIONS: string[] = SUGGESTIONS_BY_GRADE["G4"] ?? [];

/** Pick N random suggestions based on student's grade, fresh each mount */
function pickSuggestions(grade: string, count: number): string[] {
  const pool: string[] = SUGGESTIONS_BY_GRADE[grade] ?? FALLBACK_SUGGESTIONS;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

type ConversationItem = {
  id:       string;
  question: string;
  response: AskMathAIResponse | null;
  error:    string | null;
  loading:  boolean;
};

interface AskPageContentProps {
  /** If set (from ?q= URL param), auto-submit this question on mount */
  initialQuestion?: string;
}

export default function AskPageContent({ initialQuestion = "" }: AskPageContentProps) {
  const { profile } = useProfile();
  const [question,      setQuestion]      = useState("");
  const [conversation,  setConversation]  = useState<ConversationItem[]>([]);
  const inputRef         = useRef<HTMLTextAreaElement>(null);
  const bottomRef        = useRef<HTMLDivElement>(null);
  const autoSubmittedRef = useRef(false);

  const grade = profile?.grade ?? "G4";

  // Pick 6 random suggestions based on grade — refreshes when grade changes
  const [suggestions, setSuggestions] = useState<string[]>([]);
  useEffect(() => {
    setSuggestions(pickSuggestions(grade, 6));
  }, [grade]);

  async function handleSubmit(overrideQ?: string) {
    const q = (overrideQ !== undefined ? overrideQ : question).trim();
    if (!q) return;

    const id = `${Date.now()}`;
    setConversation((prev) => [
      ...prev,
      { id, question: q, response: null, error: null, loading: true },
    ]);
    setQuestion("");
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 20_000);

    try {
      const data = await clientPost<AskMathAIResponse>(
        "/tutor/ask",
        { question: q, grade },
        { signal: controller.signal },
      );
      clearTimeout(timeout);
      setConversation((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                response: data,
                error:    data ? null : "MathAI couldn't answer right now — please try again.",
                loading:  false,
              }
            : item
        )
      );
    } catch (e) {
      clearTimeout(timeout);
      const isTimeout = e instanceof Error && e.name === "AbortError";
      setConversation((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                error:   isTimeout
                  ? "Request timed out — please try again."
                  : "Connection error. Check your network and try again.",
                loading: false,
              }
            : item
        )
      );
    }
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  }

  // ── Auto-submit when coming from practice "Teach Me" button ─────────────────
  // Runs once on mount; profile grade must be loaded first for a good response.
  useEffect(() => {
    if (!initialQuestion || autoSubmittedRef.current) return;
    // Wait until profile has resolved so the grade is correct in the AI prompt
    if (!profile) return;
    autoSubmittedRef.current = true;
    void handleSubmit(initialQuestion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion, profile]);

  /** Grow the textarea to fit its content, up to max-h-32 (8rem). */
  const autoResize = useCallback((el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 128) + "px";
  }, []);

  return (
    <div
      className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col"
      style={{ minHeight: "100dvh" }}
    >

      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-indigo-100/60 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl shadow">
            🤖
          </div>
          <div className="flex-1">
            <h1 className="font-black text-xl text-gray-800 leading-tight">Ask MathAI</h1>
            <p className="text-xs text-slate-400">
              Grade {grade.replace("G", "")} · Your personal math tutor
            </p>
          </div>
          {conversation.length > 0 && (
            <button
              onClick={() => setConversation([])}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 transition px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 shrink-0"
              title="Start a new conversation"
            >
              New chat ↺
            </button>
          )}
        </div>
      </header>

      {/* Conversation */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">

          {/* Empty state / suggestions */}
          {conversation.length === 0 && (
            <div className="text-center py-8 space-y-6">
              <div className="text-6xl">🤖</div>
              <div>
                <h2 className="font-black text-2xl text-gray-800 mb-2">
                  Hi! I&apos;m MathAI
                </h2>
                <p className="text-slate-500 text-sm">
                  Ask me any math question — I&apos;ll explain it clearly, step by step.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-xl mx-auto">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => void handleSubmit(s)}
                    className="bg-white border border-indigo-100 rounded-2xl p-4 text-sm text-gray-700 font-medium text-left hover:border-indigo-300 hover:shadow-md transition-all"
                  >
                    &ldquo;{s}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Conversation items */}
          {conversation.map((item) => (
            <div key={item.id} className="space-y-4">
              {/* Student question bubble */}
              <div className="flex justify-end">
                <div className="bg-indigo-600 text-white rounded-3xl rounded-br-lg px-5 py-3 max-w-xs sm:max-w-sm shadow-md">
                  <p className="text-sm font-medium">{item.question}</p>
                </div>
              </div>

              {/* AI response */}
              <div className="flex justify-start">
                <div className="flex-1 max-w-2xl space-y-4">
                  {/* Loading */}
                  {item.loading && (
                    <div className="flex items-center gap-3 bg-white rounded-3xl px-5 py-4 shadow-sm border border-indigo-100">
                      <div className="w-5 h-5 rounded-full border-2 border-indigo-300 border-t-indigo-600 animate-spin shrink-0" />
                      <p className="text-indigo-500 font-semibold text-sm">Thinking…</p>
                    </div>
                  )}

                  {/* Error */}
                  {!item.loading && item.error && (
                    <div className="bg-red-50 border border-red-200 rounded-3xl px-5 py-4">
                      <p className="text-red-600 text-sm font-semibold">{item.error}</p>
                    </div>
                  )}

                  {/* Response */}
                  {!item.loading && !item.error && item.response && (
                    <ResponseCard response={item.response} />
                  )}
                </div>
              </div>
            </div>
          ))}

          <div ref={bottomRef} className="h-1" />
        </div>
      </div>

      {/* Input bar — sticky above keyboard on mobile via env(safe-area-inset-bottom) */}
      <div
        className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-gray-100 shadow-lg"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
        <div className="max-w-3xl mx-auto px-4 pt-3">
          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              rows={1}
              value={question}
              onChange={(e) => { setQuestion(e.target.value); autoResize(e.target); }}
              onKeyDown={handleKey}
              placeholder="Ask a math question…"
              className={cn(
                "flex-1 resize-none rounded-2xl px-4 py-3 text-sm font-medium",
                "border-2 border-indigo-100 focus:border-indigo-400 outline-none transition",
                "bg-white shadow-sm max-h-32 overflow-y-auto",
              )}
            />
            <button
              onClick={() => void handleSubmit()}
              disabled={!question.trim()}
              className={cn(
                "px-5 py-3 rounded-2xl font-black text-sm transition shrink-0",
                question.trim()
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed",
              )}
            >
              Ask →
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">
            Press Enter to ask · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ResponseCard — tabbed, single-focus layout
// ═════════════════════════════════════════════════════════════════════════════

type TabId = "steps" | "visual" | "watch";

function ResponseCard({ response }: { response: AskMathAIResponse }) {
  // ── Derived state ──────────────────────────────────────────────────────────
  const answer = String(response.mathData?.result ?? "");
  const hasSteps = (response.steps?.length ?? 0) > 0;

  const visualPlan = response.visualPlan ?? null;
  const hasVisual = visualPlan != null &&
    visualPlan.diagramType !== "none" &&
    visualPlan.diagramType !== "concept_image";

  const sceneEligible = isSceneEligible(response.mathData);

  // ── Tabs ───────────────────────────────────────────────────────────────────
  const tabs: { id: TabId; label: string; show: boolean; primary?: boolean }[] = [
    { id: "steps",  label: "Steps",   show: hasSteps },
    { id: "visual", label: "Visual",  show: hasVisual },
    { id: "watch",  label: "Watch It", show: sceneEligible, primary: true },
  ];
  const visibleTabs = tabs.filter((t) => t.show);

  // Default to first available tab
  const defaultTab = visibleTabs.find((t) => t.id === "steps")?.id
    ?? visibleTabs[0]?.id
    ?? "steps";
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
    >
      {/* ── Answer hero ──────────────────────────────────────────────── */}
      <AnswerHero answer={answer} explanation={response.explanation} />

      {/* ── Action tabs ──────────────────────────────────────────────── */}
      {visibleTabs.length > 0 && (
        <ActionTabs
          tabs={visibleTabs}
          active={activeTab}
          onChange={setActiveTab}
        />
      )}

      {/* ── Content area — one mode at a time ────────────────────────── */}
      <div className="px-5 pb-5">
        <AnimatePresence mode="wait">
          {activeTab === "steps" && hasSteps && (
            <TabPanel key="steps">
              <StepsView steps={response.steps!} />
            </TabPanel>
          )}
          {activeTab === "visual" && hasVisual && (
            <TabPanel key="visual">
              <VisualView plan={visualPlan!} />
            </TabPanel>
          )}
          {activeTab === "watch" && sceneEligible && (
            <TabPanel key="watch">
              <WatchItView question={response.question} mathData={response.mathData} />
            </TabPanel>
          )}
        </AnimatePresence>
      </div>

      {/* ── Encouragement ────────────────────────────────────────────── */}
      {response.encouragement && (
        <div className="px-5 pb-4">
          <p className="text-center text-xs text-indigo-400 font-semibold">
            {response.encouragement}
          </p>
        </div>
      )}
    </motion.div>
  );
}

// ─── Tab panel wrapper (shared enter/exit animation) ─────────────────────────

function TabPanel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

// ─── Answer hero ─────────────────────────────────────────────────────────────

function AnswerHero({ answer, explanation }: { answer: string; explanation: string }) {
  // Extract a short first sentence as the "one-liner"
  const oneLiner = explanation.split(/[.!?]/)[0]?.trim() ?? explanation;

  return (
    <div className="px-6 pt-6 pb-4 text-center">
      {/* Large answer display */}
      {answer && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
          className="mb-3"
        >
          <span className="text-4xl sm:text-5xl font-black text-indigo-600 tabular-nums">
            <MathText text={answer} />
          </span>
        </motion.div>
      )}

      {/* One-line explanation */}
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.3 }}
        className="text-sm text-gray-500 leading-relaxed max-w-md mx-auto"
      >
        <MathText text={oneLiner} />
      </motion.p>
    </div>
  );
}

// ─── Action tabs ─────────────────────────────────────────────────────────────

function ActionTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: TabId; label: string; primary?: boolean }[];
  active: TabId;
  onChange: (id: TabId) => void;
}) {
  return (
    <div className="px-5 pb-3">
      <div className="flex gap-2 justify-center">
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          const isPrimary = tab.primary && !isActive;

          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                "relative px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-[0.96]",
                isActive
                  ? "bg-indigo-600 text-white shadow-sm"
                  : isPrimary
                    ? "bg-violet-50 text-violet-600 hover:bg-violet-100"
                    : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700",
              )}
            >
              {tab.label}
              {isPrimary && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Steps view ──────────────────────────────────────────────────────────────

function StepsView({ steps }: { steps: NonNullable<AskMathAIResponse["steps"]> }) {
  return (
    <div className="space-y-2.5 pt-2">
      {steps.map((step, i) => (
        <motion.div
          key={step.stepNumber}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08, duration: 0.25 }}
          className="flex gap-3 items-start bg-gray-50/80 rounded-2xl px-4 py-3"
        >
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
            {step.stepNumber}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700 leading-relaxed">
              <MathText text={step.instruction} />
            </p>
            {step.formula && (
              <div className="mt-1.5 text-sm bg-white rounded-xl px-3 py-2 text-indigo-700 border border-indigo-100 overflow-x-auto">
                <MathText text={`\\(${step.formula}\\)`} />
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Visual view (static diagrams) ───────────────────────────────────────────

function VisualView({ plan }: { plan: NonNullable<AskMathAIResponse["visualPlan"]> }) {
  return (
    <div className="pt-2">
      <VisualRenderer plan={plan} animated />
    </div>
  );
}

// ─── Watch It view (animated scenes) ─────────────────────────────────────────

function WatchItView({
  question,
  mathData,
}: {
  question: string;
  mathData: AskMathAIResponse["mathData"];
}) {
  const topic = mathData?.type ?? "unknown";
  const telemetry = useSceneTelemetry(question, topic);

  const [state, setState]    = useState<"idle" | "loading" | "playing" | "done">("idle");
  const [plan, setPlan]      = useState<ScenePlan | null>(null);
  const [source, setSource]  = useState<"template" | "ai" | "fallback">("template");

  const loadScene = useCallback(async () => {
    telemetry.buttonClicked();
    setState("loading");

    // 1. Try template
    const dispatch = dispatchScene(mathData, question);
    if (dispatch.plan) {
      const v = validateScenePlan(dispatch.plan, question);
      if (v.valid) {
        setPlan(v.plan);
        setSource("template");
        setState("playing");
        telemetry.planLoaded("template");
        return;
      }
      telemetry.validationFailed(v.issues);
    }

    // 2. Try AI
    if (dispatch.eligible) {
      try {
        const aiPlan = await clientPost<ScenePlan>("/tutor/generate-scene", {
          question, mathData,
        });
        if (aiPlan) {
          const v = validateScenePlan(aiPlan, question);
          setPlan(v.plan);
          setSource(v.valid ? "ai" : "fallback");
          setState("playing");
          telemetry.planLoaded(v.valid ? "ai" : "fallback");
          if (!v.valid) telemetry.validationFailed(v.issues);
          return;
        }
      } catch { /* fall through */ }
    }

    // 3. Fallback
    const { plan: fb } = validateScenePlan(null, question);
    setPlan(fb);
    setSource("fallback");
    setState("playing");
    telemetry.planLoaded("fallback");
  }, [mathData, question, telemetry]);

  // Fire button_shown on mount
  useEffect(() => { telemetry.buttonShown(); }, [telemetry]);

  return (
    <div className="pt-2">
      <AnimatePresence mode="wait">
        {/* ── Idle: CTA ──────────────────────────────────────────── */}
        {state === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="text-center text-xs text-gray-400 mb-3">
              Want to see this visually?
            </p>
            <button
              onClick={loadScene}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-bold text-sm shadow-md shadow-indigo-200/50 hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-[0.97] flex items-center justify-center gap-2.5"
            >
              <span className="text-lg">▶</span>
              Watch It
            </button>
          </motion.div>
        )}

        {/* ── Loading ────────────────────────────────────────────── */}
        {state === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-10 flex flex-col items-center gap-4"
          >
            {/* Shimmer skeleton */}
            <div className="w-full max-w-sm space-y-3">
              <div className="h-3 bg-gray-100 rounded-full animate-pulse" />
              <div className="h-40 bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl animate-pulse" />
              <div className="h-3 bg-gray-100 rounded-full w-2/3 mx-auto animate-pulse" />
            </div>
            <p className="text-sm text-violet-500 font-medium">Building your animation...</p>
          </motion.div>
        )}

        {/* ── Playing ────────────────────────────────────────────── */}
        {(state === "playing" || state === "done") && plan && (
          <motion.div
            key="player"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ScenePlayer plan={plan} />

            {/* End card */}
            <EndCard
              source={source}
              question={question}
              mathType={mathData?.type ?? "unknown"}
              answer={String(mathData?.result ?? "")}
              topicId={mathData?.type ?? "unknown"}
              onReplay={() => {
                telemetry.replay();
                setState("idle");
                setPlan(null);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── End card with learning loop integration ─────────────────────────────────

interface SimilarProblem {
  problem:     string;
  answer:      string;
  steps:       string[];
  explanation: string;
}

interface NextActionRec {
  type:       string;
  topicId:    string;
  topicName?: string;
  reason:     string;
  cta:        string;
  href?:      string;
}

function EndCard({
  source,
  question,
  mathType,
  answer,
  topicId,
  onReplay,
}: {
  source:   string;
  question: string;
  mathType: string;
  answer:   string;
  topicId:  string;
  onReplay: () => void;
}) {
  const [tryState, setTryState] = useState<"idle" | "loading" | "showing" | "revealed">("idle");
  const [similar, setSimilar]   = useState<SimilarProblem | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [nextAction, setNextAction] = useState<NextActionRec | null>(null);
  const [xpEarned, setXpEarned]    = useState(0);
  const consecutiveRef = useRef({ correct: 0, wrong: 0 });
  const startTimeRef   = useRef(Date.now());

  const handleTrySimilar = useCallback(async () => {
    setTryState("loading");
    setNextAction(null);
    try {
      const result = await clientPost<SimilarProblem>("/tutor/similar-problem", {
        problem: question,
        type: mathType,
        answer,
      });
      if (result) {
        setSimilar(result);
        setTryState("showing");
        startTimeRef.current = Date.now();
        emitLoopEvent("similar_problem_attempted", { topic: mathType, question });
      } else {
        setTryState("idle");
      }
    } catch {
      setTryState("idle");
    }
  }, [question, mathType, answer]);

  const handleCheck = useCallback(async () => {
    if (!similar) return;
    setTryState("revealed");

    const isCorrect = userAnswer.trim().toLowerCase() === similar.answer.trim().toLowerCase();
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);

    // Update consecutive counters
    if (isCorrect) {
      consecutiveRef.current = { correct: consecutiveRef.current.correct + 1, wrong: 0 };
    } else {
      consecutiveRef.current = { correct: 0, wrong: consecutiveRef.current.wrong + 1 };
    }

    emitLoopEvent(isCorrect ? "similar_problem_correct" : "similar_problem_wrong", { topic: mathType });

    // Record attempt (feeds mastery model)
    const attemptResult = await clientPost<{ isCorrect: boolean; xpEarned: number }>("/learning/record-attempt", {
      topicId,
      questionText:     similar.problem,
      studentAnswer:    userAnswer.trim(),
      correctAnswer:    similar.answer,
      timeSpentSeconds: timeSpent,
      hintsUsed:        0,
      source:           "ask_similar",
    });
    if (attemptResult?.xpEarned) setXpEarned((prev) => prev + attemptResult.xpEarned);

    // Get next action recommendation
    const action = await clientPost<NextActionRec>("/learning/next-action", {
      topicId,
      isCorrect,
      consecutiveCorrect: consecutiveRef.current.correct,
      consecutiveWrong:   consecutiveRef.current.wrong,
      hasSceneTemplate:   true,
      source:             "ask_similar",
    });
    if (action) setNextAction(action);
  }, [similar, userAnswer, mathType, topicId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.3 }}
      className="mt-4 space-y-3"
    >
      {/* Got it? card */}
      <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-5 text-center space-y-3">
        <p className="text-sm font-semibold text-emerald-700">Got it?</p>

        <div className="flex items-center justify-center gap-2">
          {tryState === "idle" && (
            <button
              onClick={handleTrySimilar}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition active:scale-[0.97]"
            >
              Try one like this
            </button>
          )}
          <button
            onClick={onReplay}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition active:scale-[0.97]"
          >
            Replay
          </button>
        </div>

        {tryState === "loading" && (
          <div className="flex items-center justify-center gap-2 pt-1">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-400 border-t-indigo-700 animate-spin" />
            <span className="text-xs text-indigo-500 font-medium">Creating a problem for you...</span>
          </div>
        )}

        {/* XP earned badge */}
        {xpEarned > 0 && (
          <p className="text-xs text-emerald-600 font-semibold">+{xpEarned} XP earned</p>
        )}
      </div>

      {/* Inline practice problem */}
      {similar && (tryState === "showing" || tryState === "revealed") && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white border border-indigo-100 rounded-2xl p-5 space-y-4"
        >
          {/* Problem */}
          <div>
            <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider mb-1.5">Your turn</p>
            <p className="text-sm font-semibold text-gray-800">
              <MathText text={similar.problem} />
            </p>
          </div>

          {/* Answer input */}
          {tryState === "showing" && (
            <div className="flex gap-2">
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Your answer..."
                className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-center focus:border-indigo-400 outline-none transition"
                onKeyDown={(e) => { if (e.key === "Enter") void handleCheck(); }}
                autoFocus
              />
              <button
                onClick={() => void handleCheck()}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition active:scale-[0.97] shrink-0"
              >
                Check
              </button>
            </div>
          )}

          {/* Reveal + next action */}
          {tryState === "revealed" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {/* Result */}
              <div className={cn(
                "rounded-xl px-4 py-3 text-center",
                userAnswer.trim().toLowerCase() === similar.answer.trim().toLowerCase()
                  ? "bg-emerald-50 border border-emerald-200"
                  : "bg-amber-50 border border-amber-200",
              )}>
                {userAnswer.trim().toLowerCase() === similar.answer.trim().toLowerCase() ? (
                  <p className="text-sm font-bold text-emerald-700">Correct!</p>
                ) : (
                  <div>
                    <p className="text-sm font-bold text-amber-700">
                      The answer is <span className="text-indigo-600">{similar.answer}</span>
                    </p>
                    {userAnswer.trim() && (
                      <p className="text-xs text-amber-600 mt-0.5">You said: {userAnswer}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Steps */}
              {similar.steps.length > 0 && (
                <div className="space-y-1.5">
                  {similar.steps.map((step, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-[10px] font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-xs text-gray-600"><MathText text={step} /></p>
                    </div>
                  ))}
                </div>
              )}

              {/* Next action recommendation */}
              {nextAction && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-4 text-center space-y-2"
                >
                  <p className="text-xs text-indigo-600 leading-relaxed">{nextAction.reason}</p>
                  <div className="flex items-center justify-center gap-2">
                    {/* Primary action */}
                    {nextAction.href ? (
                      <a
                        href={nextAction.href}
                        onClick={() => emitLoopEvent("next_action_clicked", { type: nextAction.type, topic: mathType })}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition active:scale-[0.97]"
                      >
                        {nextAction.cta}
                      </a>
                    ) : (
                      <button
                        onClick={() => {
                          emitLoopEvent("next_action_clicked", { type: nextAction.type, topic: mathType });
                          setTryState("idle");
                          setSimilar(null);
                          setUserAnswer("");
                          void handleTrySimilar();
                        }}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition active:scale-[0.97]"
                      >
                        {nextAction.cta}
                      </button>
                    )}
                    {/* Secondary: try another anyway */}
                    {nextAction.type !== "retry_similar" && (
                      <button
                        onClick={() => {
                          setTryState("idle");
                          setSimilar(null);
                          setUserAnswer("");
                          setNextAction(null);
                        }}
                        className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition active:scale-[0.97]"
                      >
                        Try another
                      </button>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Fallback: try another if no next action loaded yet */}
              {!nextAction && (
                <button
                  onClick={() => {
                    setTryState("idle");
                    setSimilar(null);
                    setUserAnswer("");
                  }}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition active:scale-[0.97]"
                >
                  Try another
                </button>
              )}
            </motion.div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── Loop telemetry ──────────────────────────────────────────────────────────

function emitLoopEvent(event: string, payload: Record<string, unknown> = {}) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[loop:${event}]`, payload);
  }
}

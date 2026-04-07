/**
 * @module lib/scene-engine/visualTelemetry
 *
 * Comprehensive telemetry for visual explanation reliability measurement.
 * Emits structured events ready for analytics providers.
 * Currently logs to console in dev; wire to Posthog/Vercel Analytics in production.
 *
 * Tracks the full visual lifecycle:
 *   gate → offer → click → generate → validate → render → complete/exit
 */

import type { ReliabilityLevel, VisualSource } from "./reliabilityGate";

// ─── Event types ─────────────────────────────────────────────────────────────

type VisualEvent =
  // Gate & offer
  | "visual_gate_result"
  | "visual_cta_shown"
  | "visual_cta_clicked"
  // Generation
  | "visual_source_selected"
  | "scene_generation_started"
  | "scene_generation_succeeded"
  | "scene_generation_failed"
  | "scene_generation_timeout"
  // Validation
  | "scene_validation_passed"
  | "scene_validation_failed"
  // Rendering
  | "scene_render_started"
  | "scene_render_failed"
  // Playback
  | "visual_session_completed"
  | "visual_session_exited_early"
  | "visual_replay_clicked"
  // Fallback
  | "visual_fallback_used"
  // Post-visual learning
  | "similar_problem_started_after_visual"
  | "similar_problem_correct_after_visual";

interface EventContext {
  topicId?:     string;
  mathType?:    string;
  grade?:       string;
  reliability?: ReliabilityLevel;
  source?:      VisualSource;
  durationMs?:  number;
  reason?:      string;
  issues?:      string[];
  [key: string]: unknown;
}

// ─── Event buffer for aggregation ────────────────────────────────────────────

interface EventRecord {
  event:     VisualEvent;
  context:   EventContext;
  timestamp: number;
}

const eventBuffer: EventRecord[] = [];
const MAX_BUFFER = 200;

// ─── Core emit function ──────────────────────────────────────────────────────

function emit(event: VisualEvent, context: EventContext = {}) {
  const record: EventRecord = { event, context, timestamp: Date.now() };

  // Buffer for aggregation
  if (eventBuffer.length >= MAX_BUFFER) eventBuffer.shift();
  eventBuffer.push(record);

  // Development logging
  if (process.env.NODE_ENV === "development") {
    const ctx = Object.entries(context)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
      .join(" ");
    console.log(`[visual:${event}] ${ctx}`);
  }

  // Production: wire analytics provider here
  // posthog?.capture(event, context);
  // window.va?.track(event, context);
}

// ─── Typed emit helpers ──────────────────────────────────────────────────────

export const visualTelemetry = {
  // Gate
  gateResult(ctx: EventContext & { reliability: ReliabilityLevel; source: VisualSource; eligible: boolean }) {
    emit("visual_gate_result", ctx);
  },

  // Offer & click
  ctaShown(ctx: EventContext) {
    emit("visual_cta_shown", ctx);
  },
  ctaClicked(ctx: EventContext) {
    emit("visual_cta_clicked", ctx);
  },

  // Source selection
  sourceSelected(ctx: EventContext & { source: VisualSource }) {
    emit("visual_source_selected", ctx);
  },

  // Generation
  generationStarted(ctx: EventContext & { source: VisualSource }) {
    emit("scene_generation_started", ctx);
  },
  generationSucceeded(ctx: EventContext & { source: VisualSource; durationMs: number }) {
    emit("scene_generation_succeeded", ctx);
  },
  generationFailed(ctx: EventContext & { source: VisualSource; reason: string }) {
    emit("scene_generation_failed", ctx);
  },
  generationTimeout(ctx: EventContext) {
    emit("scene_generation_timeout", ctx);
  },

  // Validation
  validationPassed(ctx: EventContext) {
    emit("scene_validation_passed", ctx);
  },
  validationFailed(ctx: EventContext & { issues: string[] }) {
    emit("scene_validation_failed", ctx);
  },

  // Rendering
  renderStarted(ctx: EventContext) {
    emit("scene_render_started", ctx);
  },
  renderFailed(ctx: EventContext & { reason: string }) {
    emit("scene_render_failed", ctx);
  },

  // Playback
  sessionCompleted(ctx: EventContext) {
    emit("visual_session_completed", ctx);
  },
  sessionExitedEarly(ctx: EventContext & { stepIndex: number; totalSteps: number }) {
    emit("visual_session_exited_early", ctx);
  },
  replayClicked(ctx: EventContext) {
    emit("visual_replay_clicked", ctx);
  },

  // Fallback
  fallbackUsed(ctx: EventContext & { reason: string }) {
    emit("visual_fallback_used", ctx);
  },

  // Post-visual learning
  similarAfterVisual(ctx: EventContext) {
    emit("similar_problem_started_after_visual", ctx);
  },
  similarCorrectAfterVisual(ctx: EventContext) {
    emit("similar_problem_correct_after_visual", ctx);
  },

  // ─── Aggregation helpers ─────────────────────────────────────────────

  /** Get recent events for debugging */
  getRecentEvents(count = 20): EventRecord[] {
    return eventBuffer.slice(-count);
  },

  /** Count events by type in the buffer */
  getEventCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const r of eventBuffer) {
      counts[r.event] = (counts[r.event] ?? 0) + 1;
    }
    return counts;
  },

  /** Success rate for a given math type */
  getSuccessRate(mathType: string): { attempts: number; successes: number; rate: number } {
    const relevant = eventBuffer.filter((r) => r.context.mathType === mathType);
    const attempts = relevant.filter((r) => r.event === "scene_generation_started").length;
    const successes = relevant.filter((r) => r.event === "scene_generation_succeeded").length;
    return { attempts, successes, rate: attempts > 0 ? successes / attempts : 0 };
  },

  /** Gate distribution */
  getGateDistribution(): Record<ReliabilityLevel, number> {
    const dist: Record<ReliabilityLevel, number> = { high: 0, medium: 0, low: 0 };
    for (const r of eventBuffer) {
      if (r.event === "visual_gate_result" && r.context.reliability) {
        dist[r.context.reliability as ReliabilityLevel]++;
      }
    }
    return dist;
  },
};

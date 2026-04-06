"use client";

/**
 * @module components/scene-engine/ScenePlayer
 *
 * Renders a ScenePlan as a Duolingo-style animated math explanation.
 *
 * Architecture:
 *   ScenePlayer (orchestrator)
 *     ├── SVG canvas (800x500 viewBox, responsive)
 *     │   └── StepLayer (renders current step's elements + animations)
 *     │       └── Primitive components (Dot, Bar, NumberLine, etc.)
 *     ├── Narration bar (text below canvas)
 *     └── Controls (progress dots, play/pause, prev/next)
 */

import { motion, AnimatePresence } from "framer-motion";
import { useSceneTimeline }         from "@/hooks/useSceneTimeline";
import { resolveAnimation, PALETTES, type MotionConfig } from "@/lib/scene-engine/presets";
import type {
  ScenePlan, SceneStep, SceneElement, SceneAnimation,
  DotProps, BarProps, NumberLineProps, MathTextProps,
  ArrowProps, BraceProps, GroupProps, PaletteKey,
} from "@/lib/scene-engine/types";

// ═════════════════════════════════════════════════════════════════════════════
// Main component
// ═════════════════════════════════════════════════════════════════════════════

interface ScenePlayerProps {
  plan: ScenePlan;
  className?: string;
}

export function ScenePlayer({ plan, className = "" }: ScenePlayerProps) {
  const timeline = useSceneTimeline(plan);
  const palette = PALETTES[plan.palette];
  const safeIndex = Math.min(timeline.stepIndex, plan.steps.length - 1);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- safeIndex is always within bounds
  const step = plan.steps[safeIndex]!;

  return (
    <div className={`rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm ${className}`}>
      {/* Title bar */}
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full" style={{ background: palette.primary }} />
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {plan.topic}
        </span>
        <span className="text-xs text-gray-300 ml-auto">{plan.title}</span>
      </div>

      {/* SVG Canvas */}
      <div className="relative" style={{ background: palette.bg }}>
        <svg
          viewBox="0 0 800 500"
          className="w-full h-auto"
          role="img"
          aria-label={plan.title}
        >
          <AnimatePresence mode="wait">
            <motion.g
              key={step.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <StepLayer step={step} palette={plan.palette} />
            </motion.g>
          </AnimatePresence>
        </svg>
      </div>

      {/* Narration */}
      {step.narration && (
        <div className="px-5 py-3 border-t border-gray-100 min-h-[52px]">
          <AnimatePresence mode="wait">
            <motion.p
              key={step.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="text-sm text-gray-600 text-center leading-relaxed"
            >
              {step.narration}
            </motion.p>
          </AnimatePresence>
        </div>
      )}

      {/* Controls */}
      <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-3">
        {/* Prev */}
        <button
          onClick={timeline.prev}
          disabled={timeline.stepIndex === 0}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition"
          aria-label="Previous step"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Play/Pause */}
        <button
          onClick={timeline.isPlaying ? timeline.pause : (timeline.isComplete ? timeline.restart : timeline.play)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition"
          aria-label={timeline.isPlaying ? "Pause" : "Play"}
        >
          {timeline.isComplete ? (
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ) : timeline.isPlaying ? (
            <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Next */}
        <button
          onClick={timeline.next}
          disabled={timeline.stepIndex >= timeline.totalSteps - 1}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition"
          aria-label="Next step"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Progress dots */}
        <div className="flex-1 flex items-center justify-center gap-1.5">
          {plan.steps.map((s, i) => (
            <button
              key={s.id}
              onClick={() => timeline.goTo(i)}
              className="group p-0.5"
              aria-label={`Go to step ${i + 1}`}
            >
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === timeline.stepIndex
                    ? "w-6"
                    : i < timeline.stepIndex
                      ? "w-1.5 opacity-60"
                      : "w-1.5 opacity-30"
                } group-hover:opacity-100`}
                style={{ background: i <= timeline.stepIndex ? palette.primary : "#cbd5e1" }}
              />
            </button>
          ))}
        </div>

        {/* Step counter */}
        <span className="text-[10px] text-gray-400 font-medium tabular-nums">
          {timeline.stepIndex + 1}/{timeline.totalSteps}
        </span>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Step renderer — renders all elements in a step with their animations
// ═════════════════════════════════════════════════════════════════════════════

function StepLayer({ step, palette }: { step: SceneStep; palette: PaletteKey }) {
  const animMap = new Map<string, SceneAnimation>();
  for (const a of step.animations) animMap.set(a.target, a);

  return (
    <>
      {step.elements.map((el) => {
        const anim = animMap.get(el.id);
        const motionProps = anim ? resolveAnimation(anim) : {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 0.3 },
        };

        return (
          <PrimitiveRenderer
            key={el.id}
            element={el}
            motionProps={motionProps}
            palette={palette}
          />
        );
      })}
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Primitive dispatcher + SVG components
// ═════════════════════════════════════════════════════════════════════════════

interface PrimitiveRendererProps {
  element:     SceneElement;
  motionProps: MotionConfig;
  palette:     PaletteKey;
}

function PrimitiveRenderer({ element, motionProps, palette }: PrimitiveRendererProps) {
  const p = element.props as Record<string, unknown>;

  switch (element.type) {
    case "dot":        return <DotPrimitive     props={p as unknown as DotProps}        motion={motionProps} />;
    case "bar":        return <BarPrimitive      props={p as unknown as BarProps}        motion={motionProps} />;
    case "numberLine": return <NumberLinePrimitive props={p as unknown as NumberLineProps} motion={motionProps} palette={palette} />;
    case "mathText":   return <MathTextPrimitive props={p as unknown as MathTextProps}   motion={motionProps} />;
    case "arrow":      return <ArrowPrimitive    props={p as unknown as ArrowProps}      motion={motionProps} />;
    case "brace":      return <BracePrimitive    props={p as unknown as BraceProps}      motion={motionProps} />;
    case "group":      return <GroupPrimitive    props={p as unknown as GroupProps}       motion={motionProps} />;
    default:           return null;
  }
}

type MP = MotionConfig;

// ─── Dot ─────────────────────────────────────────────────────────────────────

function DotPrimitive({ props: p, motion: m }: { props: DotProps; motion: MP }) {
  return (
    <motion.g {...m}>
      <circle cx={p.cx} cy={p.cy} r={p.r ?? 12} fill={p.fill ?? "#6366f1"} />
      {p.label && (
        <text x={p.cx} y={p.cy + (p.r ?? 12) + 16} textAnchor="middle" fontSize={12} fill="#64748b" fontWeight="600">
          {p.label}
        </text>
      )}
    </motion.g>
  );
}

// ─── Bar (fraction/proportion) ───────────────────────────────────────────────

function BarPrimitive({ props: p, motion: m }: { props: BarProps; motion: MP }) {
  const divW = p.divisions ? p.width / p.divisions : p.width;
  const filled = p.filledDivisions ?? p.divisions ?? 1;

  return (
    <motion.g {...m}>
      {/* Background */}
      <rect x={p.x} y={p.y} width={p.width} height={p.height} rx={p.rx ?? 4} fill="#e2e8f0" />
      {/* Filled portion */}
      {p.divisions ? (
        Array.from({ length: filled }, (_, i) => (
          <rect
            key={i}
            x={p.x + i * divW + 1}
            y={p.y + 1}
            width={divW - 2}
            height={p.height - 2}
            rx={2}
            fill={p.fill ?? "#6366f1"}
            opacity={0.7}
          />
        ))
      ) : (
        <rect x={p.x} y={p.y} width={p.width} height={p.height} rx={p.rx ?? 4} fill={p.fill ?? "#6366f1"} />
      )}
      {/* Division lines */}
      {p.divisions && Array.from({ length: p.divisions - 1 }, (_, i) => (
        <line
          key={`div-${i}`}
          x1={p.x + (i + 1) * divW}
          y1={p.y}
          x2={p.x + (i + 1) * divW}
          y2={p.y + p.height}
          stroke="#94a3b8"
          strokeWidth={1}
        />
      ))}
      {/* Outline */}
      <rect x={p.x} y={p.y} width={p.width} height={p.height} rx={p.rx ?? 4} fill="none" stroke="#94a3b8" strokeWidth={1.5} />
      {p.label && (
        <text x={p.x + p.width / 2} y={p.y + p.height + 18} textAnchor="middle" fontSize={14} fill="#475569" fontWeight="600">
          {p.label}
        </text>
      )}
    </motion.g>
  );
}

// ─── Number Line ─────────────────────────────────────────────────────────────

function NumberLinePrimitive({ props: p, motion: m, palette }: { props: NumberLineProps; motion: MP; palette: PaletteKey }) {
  const pal = PALETTES[palette];
  const y = p.y1;
  const lineLen = p.x2 - p.x1;
  const range = p.max - p.min;
  const toX = (val: number) => p.x1 + ((val - p.min) / range) * lineLen;
  const tickCount = Math.floor(range / p.step) + 1;

  return (
    <motion.g {...m}>
      {/* Main line */}
      <line x1={p.x1} y1={y} x2={p.x2} y2={y} stroke="#94a3b8" strokeWidth={2} />
      {/* Arrow tip */}
      <polygon points={`${p.x2},${y} ${p.x2 - 8},${y - 5} ${p.x2 - 8},${y + 5}`} fill="#94a3b8" />

      {/* Ticks and labels */}
      {Array.from({ length: tickCount }, (_, i) => {
        const val = p.min + i * p.step;
        const x = toX(val);
        return (
          <g key={i}>
            <line x1={x} y1={y - 6} x2={x} y2={y + 6} stroke="#94a3b8" strokeWidth={1.5} />
            <text x={x} y={y + 22} textAnchor="middle" fontSize={12} fill="#64748b" fontWeight="500">
              {Number.isInteger(val) ? val : val.toFixed(1)}
            </text>
          </g>
        );
      })}

      {/* Markers */}
      {p.markers?.map((mk, i) => {
        const x = toX(mk.value);
        return (
          <g key={`mk-${i}`}>
            <circle cx={x} cy={y} r={7} fill={mk.color ?? pal.primary} />
            {mk.label && (
              <text x={x} y={y - 16} textAnchor="middle" fontSize={12} fill={mk.color ?? pal.primary} fontWeight="700">
                {mk.label}
              </text>
            )}
          </g>
        );
      })}

      {/* Hops (arced arrows above the line) */}
      {p.hops?.map((hop, i) => {
        const x1 = toX(hop.from);
        const x2 = toX(hop.to);
        const midX = (x1 + x2) / 2;
        const arcY = y - 30 - i * 8;
        return (
          <g key={`hop-${i}`}>
            <path
              d={`M ${x1} ${y - 8} Q ${midX} ${arcY} ${x2} ${y - 8}`}
              fill="none"
              stroke={hop.color ?? pal.accent}
              strokeWidth={2}
              markerEnd="url(#arrowhead)"
            />
            {hop.label && (
              <text x={midX} y={arcY - 4} textAnchor="middle" fontSize={11} fill={hop.color ?? pal.accent} fontWeight="600">
                {hop.label}
              </text>
            )}
          </g>
        );
      })}

      {/* Arrowhead marker definition */}
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill={pal.accent} />
        </marker>
      </defs>
    </motion.g>
  );
}

// ─── Math Text ───────────────────────────────────────────────────────────────

function MathTextPrimitive({ props: p, motion: m }: { props: MathTextProps; motion: MP }) {
  return (
    <motion.text
      x={p.x}
      y={p.y}
      textAnchor={p.anchor ?? "middle"}
      fontSize={p.fontSize ?? 24}
      fill={p.color ?? "#1e293b"}
      fontWeight={p.fontWeight ?? "bold"}
      fontFamily="var(--font-nunito), system-ui, sans-serif"
      {...m}
    >
      {p.text}
    </motion.text>
  );
}

// ─── Arrow ───────────────────────────────────────────────────────────────────

function ArrowPrimitive({ props: p, motion: m }: { props: ArrowProps; motion: MP }) {
  const color = p.color ?? "#64748b";

  if (p.curved) {
    const midX = (p.x1 + p.x2) / 2;
    const midY = Math.min(p.y1, p.y2) - (p.curveHeight ?? 40);
    return (
      <motion.g {...m}>
        <path
          d={`M ${p.x1} ${p.y1} Q ${midX} ${midY} ${p.x2} ${p.y2}`}
          fill="none" stroke={color} strokeWidth={p.strokeWidth ?? 2}
        />
        {p.label && (
          <text x={midX} y={midY - 6} textAnchor="middle" fontSize={12} fill={color} fontWeight="600">
            {p.label}
          </text>
        )}
      </motion.g>
    );
  }

  return (
    <motion.g {...m}>
      <line x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} stroke={color} strokeWidth={p.strokeWidth ?? 2} markerEnd="url(#arrowhead)" />
      {p.label && (
        <text x={(p.x1 + p.x2) / 2} y={(p.y1 + p.y2) / 2 - 8} textAnchor="middle" fontSize={12} fill={color} fontWeight="600">
          {p.label}
        </text>
      )}
    </motion.g>
  );
}

// ─── Brace ───────────────────────────────────────────────────────────────────

function BracePrimitive({ props: p, motion: m }: { props: BraceProps; motion: MP }) {
  const color = p.color ?? "#64748b";
  // Bottom brace: horizontal curly brace under the element
  const cy = p.side === "bottom" ? p.y + p.height + 8 : p.y - 8;
  const midX = p.x + p.width / 2;

  return (
    <motion.g {...m}>
      <path
        d={`M ${p.x} ${cy} Q ${p.x + p.width * 0.25} ${cy + 14} ${midX} ${cy + 14} Q ${p.x + p.width * 0.75} ${cy + 14} ${p.x + p.width} ${cy}`}
        fill="none" stroke={color} strokeWidth={2}
      />
      {p.label && (
        <text x={midX} y={cy + 32} textAnchor="middle" fontSize={16} fill={color} fontWeight="700">
          {p.label}
        </text>
      )}
    </motion.g>
  );
}

// ─── Group (container outline) ───────────────────────────────────────────────

function GroupPrimitive({ props: p, motion: m }: { props: GroupProps; motion: MP }) {
  return (
    <motion.g {...m}>
      <rect
        x={p.x} y={p.y} width={p.width} height={p.height}
        rx={p.rx ?? 8}
        fill={p.fill ?? "transparent"}
        stroke={p.outline ? (p.outlineColor ?? "#cbd5e1") : "none"}
        strokeWidth={2}
        strokeDasharray={p.outline ? "6 3" : undefined}
      />
      {p.label && (
        <text x={p.x + p.width / 2} y={p.y - 8} textAnchor="middle" fontSize={13} fill="#64748b" fontWeight="600">
          {p.label}
        </text>
      )}
    </motion.g>
  );
}

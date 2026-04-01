"use client";

/**
 * @module components/mathai/visual/LogicFlow
 *
 * Renders a top-to-bottom flow diagram showing multi-step reasoning.
 * Uses SVG for the connectors and HTML for the node labels.
 * Framer Motion animates node appearance progressively.
 */

import { motion } from "framer-motion";
import type { LogicFlowData } from "@mathai/shared-types";

interface LogicFlowProps {
  data:      LogicFlowData;
  animated?: boolean;
}

const NODE_STYLE: Record<string, { bg: string; border: string; text: string; emoji: string }> = {
  start:    { bg: "bg-indigo-50",  border: "border-indigo-300", text: "text-indigo-700", emoji: "📌" },
  step:     { bg: "bg-white",      border: "border-gray-200",   text: "text-gray-700",   emoji: "📝" },
  decision: { bg: "bg-amber-50",   border: "border-amber-300",  text: "text-amber-700",  emoji: "🤔" },
  result:   { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-700", emoji: "✅" },
};

// Layout constants
const NODE_WIDTH    = 220;
const NODE_HEIGHT   = 48;
const NODE_GAP      = 24;
const LEFT_PADDING  = 20;

export function LogicFlow({ data, animated = true }: LogicFlowProps) {
  if (!data.nodes || data.nodes.length === 0) return null;

  const totalHeight = data.nodes.length * (NODE_HEIGHT + NODE_GAP);
  const svgWidth    = NODE_WIDTH + LEFT_PADDING * 2;

  return (
    <div className="space-y-2">
      {data.title && (
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
          {data.title}
        </p>
      )}

      <div className="relative overflow-x-auto" style={{ minWidth: svgWidth }}>
        {/* SVG connector lines */}
        <svg
          width={svgWidth}
          height={totalHeight}
          className="absolute inset-0 pointer-events-none"
        >
          {data.edges.map((edge, i) => {
            const fromIdx = data.nodes.findIndex((n) => n.id === edge.from);
            const toIdx   = data.nodes.findIndex((n) => n.id === edge.to);
            if (fromIdx < 0 || toIdx < 0) return null;

            const x  = LEFT_PADDING + NODE_WIDTH / 2;
            const y1 = fromIdx * (NODE_HEIGHT + NODE_GAP) + NODE_HEIGHT;
            const y2 = toIdx * (NODE_HEIGHT + NODE_GAP);

            return (
              <g key={i}>
                <line
                  x1={x} y1={y1} x2={x} y2={y2}
                  stroke="#c7d2fe" strokeWidth={2} strokeDasharray="4 4"
                />
                {/* Arrow head */}
                <polygon
                  points={`${x - 5},${y2 - 6} ${x + 5},${y2 - 6} ${x},${y2}`}
                  fill="#818cf8"
                />
                {/* Edge label */}
                {edge.label && (
                  <text
                    x={x + NODE_WIDTH / 2 + 8}
                    y={(y1 + y2) / 2 + 4}
                    fontSize={10}
                    fill="#94a3b8"
                    fontWeight={600}
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* HTML nodes */}
        <div className="relative" style={{ height: totalHeight, width: svgWidth }}>
          {data.nodes.map((node, i) => {
            const style = NODE_STYLE[node.type] ?? NODE_STYLE["step"]!;
            const top   = i * (NODE_HEIGHT + NODE_GAP);

            const nodeEl = (
              <div
                className={`absolute flex items-center gap-2 px-4 rounded-2xl border ${style.bg} ${style.border} shadow-sm`}
                style={{
                  left:   LEFT_PADDING,
                  top,
                  width:  NODE_WIDTH,
                  height: NODE_HEIGHT,
                }}
              >
                <span className="text-sm shrink-0">{style.emoji}</span>
                <span className={`text-xs font-semibold ${style.text} leading-snug line-clamp-2`}>
                  {node.label}
                </span>
              </div>
            );

            if (!animated) return <div key={node.id}>{nodeEl}</div>;

            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay:    i * 0.12,
                  duration: 0.25,
                  ease:     "easeOut",
                }}
              >
                {nodeEl}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

"use client";

/**
 * @module components/explanations/engine/SceneCanvas
 *
 * Renders the static SVG tree for an ExplanationScene. All elements are
 * mounted at once with their final positions — the timeline builder then
 * animates them from hidden/transformed states into view.
 *
 * This component is a pure renderer. It does not handle play state, controls,
 * or animation orchestration. The player is responsible for that.
 */

import { forwardRef, useMemo } from "react";
import type {
  ExplanationScene, VisualElement, BraceElement, ArrowElement,
  TextElement, EquationElement, RectElement, CircleElement,
  LineElement, PathElement,
} from "./scene-types";
import { DEFAULT_PALETTE } from "./scene-types";

interface Props {
  scene:      ExplanationScene;
  className?: string;
}

export const SceneCanvas = forwardRef<SVGSVGElement, Props>(function SceneCanvas(
  { scene, className = "" },
  ref,
) {
  const palette = scene.palette ?? DEFAULT_PALETTE;
  const { width, height } = scene.viewBox;

  // Generate marker defs (arrowheads) only if the scene has arrows
  const hasArrows = useMemo(
    () => scene.elements.some((e) => e.type === "arrow"),
    [scene.elements],
  );

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${width} ${height}`}
      className={`w-full h-auto block ${className}`}
      style={{ background: palette.background }}
      role="img"
      aria-label={scene.title}
    >
      {hasArrows && (
        <defs>
          <marker
            id={`arrowhead-${scene.id}`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={palette.accent} />
          </marker>
        </defs>
      )}

      {scene.elements.map((el) => (
        <ElementNode key={el.id} element={el} scene={scene} />
      ))}
    </svg>
  );
});

// ─── Element renderers ──────────────────────────────────────────────────────

function ElementNode({ element, scene }: { element: VisualElement; scene: ExplanationScene }) {
  const palette = scene.palette ?? DEFAULT_PALETTE;

  switch (element.type) {
    case "text":     return <TextNode element={element} palette={palette} />;
    case "equation": return <EquationNode element={element} palette={palette} />;
    case "rect":     return <RectNode element={element} palette={palette} />;
    case "circle":   return <CircleNode element={element} palette={palette} />;
    case "line":     return <LineNode element={element} palette={palette} />;
    case "path":     return <PathNode element={element} palette={palette} />;
    case "arrow":    return <ArrowNode element={element} palette={palette} sceneId={scene.id} />;
    case "brace":    return <BraceNode element={element} palette={palette} />;
    case "group":    return null; // groups are logical only — children render themselves
  }
}

function TextNode({ element, palette }: { element: TextElement; palette: typeof DEFAULT_PALETTE }) {
  const weight = element.weight === "black" ? 900 : element.weight === "bold" ? 700 : 500;
  return (
    <text
      id={element.id}
      className={element.className}
      x={element.x}
      y={element.y}
      fontSize={element.fontSize ?? 32}
      fontWeight={weight}
      fill={element.color ?? palette.primary}
      textAnchor={element.anchor ?? "middle"}
      fontFamily="var(--font-nunito, system-ui), sans-serif"
      dominantBaseline="central"
    >
      {element.content}
    </text>
  );
}

function EquationNode({ element, palette }: { element: EquationElement; palette: typeof DEFAULT_PALETTE }) {
  const fontSize = element.fontSize ?? 48;
  // Approximate character width so parts can be positioned relative to each other.
  // We use a fixed per-character width based on font size — good enough for
  // monospace-ish layout without measuring text at render time.
  const charWidth = fontSize * 0.55;

  let cursor = 0;
  const positionedParts = element.parts.map((part) => {
    const gap = part.spacing ?? 0;
    const x = element.x + cursor + gap;
    cursor += gap + part.content.length * charWidth;
    return { part, x };
  });

  // Center the whole equation horizontally around element.x
  const totalWidth = cursor;
  const offset = -totalWidth / 2;

  return (
    <g id={element.id}>
      {positionedParts.map(({ part, x }) => {
        const weight = part.weight === "black" ? 900 : part.weight === "bold" ? 700 : 500;
        return (
          <text
            key={part.id}
            id={part.id}
            x={x + offset}
            y={element.y}
            fontSize={fontSize}
            fontWeight={weight}
            fill={part.color ?? palette.primary}
            textAnchor="start"
            fontFamily="var(--font-nunito, system-ui), sans-serif"
            dominantBaseline="central"
          >
            {part.content}
          </text>
        );
      })}
    </g>
  );
}

function RectNode({ element, palette }: { element: RectElement; palette: typeof DEFAULT_PALETTE }) {
  return (
    <rect
      id={element.id}
      className={element.className}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      rx={element.rx ?? 0}
      fill={element.fill ?? "transparent"}
      stroke={element.stroke ?? palette.primary}
      strokeWidth={element.strokeWidth ?? 2}
    />
  );
}

function CircleNode({ element, palette }: { element: CircleElement; palette: typeof DEFAULT_PALETTE }) {
  return (
    <circle
      id={element.id}
      className={element.className}
      cx={element.cx}
      cy={element.cy}
      r={element.r}
      fill={element.fill ?? palette.accent}
      stroke={element.stroke ?? "none"}
      strokeWidth={element.strokeWidth ?? 0}
    />
  );
}

function LineNode({ element, palette }: { element: LineElement; palette: typeof DEFAULT_PALETTE }) {
  return (
    <line
      id={element.id}
      className={element.className}
      x1={element.x1}
      y1={element.y1}
      x2={element.x2}
      y2={element.y2}
      stroke={element.stroke ?? palette.primary}
      strokeWidth={element.strokeWidth ?? 3}
      strokeLinecap="round"
      strokeDasharray={element.dash}
    />
  );
}

function PathNode({ element, palette }: { element: PathElement; palette: typeof DEFAULT_PALETTE }) {
  return (
    <path
      id={element.id}
      className={element.className}
      d={element.d}
      stroke={element.stroke ?? palette.primary}
      strokeWidth={element.strokeWidth ?? 3}
      fill={element.fill ?? "none"}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

function ArrowNode({
  element, palette, sceneId,
}: { element: ArrowElement; palette: typeof DEFAULT_PALETTE; sceneId: string }) {
  // Build a curved or straight path
  const { x1, y1, x2, y2, curved } = element;
  let d: string;
  if (curved) {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2 - 40;
    d = `M ${x1} ${y1} Q ${midX} ${midY}, ${x2} ${y2}`;
  } else {
    d = `M ${x1} ${y1} L ${x2} ${y2}`;
  }

  return (
    <path
      id={element.id}
      className={element.className}
      d={d}
      stroke={element.color ?? palette.accent}
      strokeWidth={element.strokeWidth ?? 3}
      fill="none"
      strokeLinecap="round"
      markerEnd={`url(#arrowhead-${sceneId})`}
    />
  );
}

function BraceNode({ element, palette }: { element: BraceElement; palette: typeof DEFAULT_PALETTE }) {
  // Simple curly brace path: bottom brace connecting (x1,y1) to (x2,y2)
  const { x1, y1, x2, y2 } = element;
  const direction = element.direction ?? "bottom";
  const depth = 14;

  let d: string;
  switch (direction) {
    case "bottom": {
      const midX = (x1 + x2) / 2;
      const baseY = Math.max(y1, y2);
      d = [
        `M ${x1} ${baseY}`,
        `Q ${x1} ${baseY + depth}, ${x1 + depth} ${baseY + depth}`,
        `L ${midX - depth} ${baseY + depth}`,
        `Q ${midX} ${baseY + depth}, ${midX} ${baseY + depth * 1.6}`,
        `Q ${midX} ${baseY + depth}, ${midX + depth} ${baseY + depth}`,
        `L ${x2 - depth} ${baseY + depth}`,
        `Q ${x2} ${baseY + depth}, ${x2} ${baseY}`,
      ].join(" ");
      break;
    }
    case "top": {
      const midX = (x1 + x2) / 2;
      const baseY = Math.min(y1, y2);
      d = [
        `M ${x1} ${baseY}`,
        `Q ${x1} ${baseY - depth}, ${x1 + depth} ${baseY - depth}`,
        `L ${midX - depth} ${baseY - depth}`,
        `Q ${midX} ${baseY - depth}, ${midX} ${baseY - depth * 1.6}`,
        `Q ${midX} ${baseY - depth}, ${midX + depth} ${baseY - depth}`,
        `L ${x2 - depth} ${baseY - depth}`,
        `Q ${x2} ${baseY - depth}, ${x2} ${baseY}`,
      ].join(" ");
      break;
    }
    default:
      d = `M ${x1} ${y1} L ${x2} ${y2}`;
  }

  return (
    <path
      id={element.id}
      className={element.className}
      d={d}
      stroke={element.color ?? palette.muted}
      strokeWidth={element.strokeWidth ?? 2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

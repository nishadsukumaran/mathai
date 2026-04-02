"use client";

/**
 * @module components/shared/MathText
 *
 * Renders text containing LaTeX math expressions using KaTeX.
 * Handles both inline \\(...\\) and display \\[...\\] delimiters.
 *
 * SECURITY NOTE: dangerouslySetInnerHTML is used here intentionally with KaTeX's
 * renderToString, which produces sanitized math markup from LaTeX notation only.
 * KaTeX does NOT evaluate arbitrary HTML — it is a math typesetter that produces
 * a safe, limited subset of HTML (spans with CSS classes). This is the standard
 * React integration pattern recommended by the KaTeX documentation.
 *
 * Usage:
 *   <MathText text="The answer is \\(\\frac{3}{4}\\) because..." />
 *   <MathText text="Solve: \\[x + 3 = 10\\]" />
 */

import katex from "katex";
import "katex/dist/katex.min.css";

interface MathTextProps {
  text:       string;
  className?: string;
}

/**
 * Split text into segments of plain text and LaTeX expressions,
 * then render LaTeX with KaTeX and plain text as-is.
 *
 * Supported delimiters:
 *   \\( ... \\)   → inline math
 *   \\[ ... \\]   → display (block) math
 *   $$ ... $$    → display (block) math (fallback)
 */
export function MathText({ text, className }: MathTextProps) {
  if (!text) return null;

  // Regex matches \(...\), \[...\], or $$...$$
  // Note: uses 'g' flag only (no 's' flag) for ES2015 compat
  const mathRegex = /\\\((.+?)\\\)|\\\[(.+?)\\\]|\$\$(.+?)\$\$/g;

  const parts: Array<{ type: "text" | "inline" | "display"; content: string }> = [];
  let lastIndex = 0;

  for (const match of text.matchAll(mathRegex)) {
    const matchStart = match.index!;

    // Add plain text before this match
    if (matchStart > lastIndex) {
      parts.push({ type: "text", content: text.slice(lastIndex, matchStart) });
    }

    if (match[1] !== undefined) {
      parts.push({ type: "inline", content: match[1] });
    } else if (match[2] !== undefined) {
      parts.push({ type: "display", content: match[2] });
    } else if (match[3] !== undefined) {
      parts.push({ type: "display", content: match[3] });
    }

    lastIndex = matchStart + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.slice(lastIndex) });
  }

  // No math found — return plain text
  if (parts.length === 0 || (parts.length === 1 && parts[0]!.type === "text")) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.type === "text") {
          return <span key={i}>{part.content}</span>;
        }

        try {
          // KaTeX.renderToString produces safe math-only HTML (spans + CSS classes).
          // It does not interpret or pass through arbitrary HTML/JS.
          const html = katex.renderToString(part.content, {
            throwOnError: false,
            displayMode:  part.type === "display",
            trust:        false,
            strict:       false,
          });
          return (
            <span
              key={i}
              className={part.type === "display" ? "block my-2 text-center overflow-x-auto" : ""}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          // KaTeX parse failure — show raw expression in code block
          return (
            <code key={i} className="text-xs bg-gray-100 px-1 rounded">
              {part.content}
            </code>
          );
        }
      })}
    </span>
  );
}

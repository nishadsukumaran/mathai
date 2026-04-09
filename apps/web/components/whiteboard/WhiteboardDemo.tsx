"use client";

/**
 * @module components/whiteboard/WhiteboardDemo
 *
 * Whiteboard Teaching Demo — proof of concept.
 *
 * A SINGLE hardcoded teaching experience for "42 − 18" with borrowing.
 * Not a generic engine, not a renderer, not a platform. One example, done right.
 *
 * ─── How the writing effect works ──────────────────────────────────────────
 *
 * Every text element has a <clipPath> containing a <rect>. On mount, we
 * measure the text's bounding box and size the rect to match — but with
 * width = 0. The text is clipped to nothing, so it's invisible.
 *
 * GSAP then animates the rect's width from 0 to the target width. Because the
 * clip grows left-to-right, the text "appears" as if a pen were moving across
 * the board. This is NOT a fade.
 *
 * ─── How the drawing effect works ──────────────────────────────────────────
 *
 * Every drawable shape (circle, line, arrow, box) has its stroke-dasharray
 * set to the path's total length and stroke-dashoffset set to that same
 * length (making the stroke invisible). GSAP animates stroke-dashoffset to 0,
 * tracing the stroke progressively from start to end.
 *
 * ─── How the timeline is controlled ────────────────────────────────────────
 *
 * A single GSAP master timeline is built on mount, paused. It contains
 * .to() tweens for each write/draw action, small .to({}, {duration: x})
 * pauses between steps to simulate thinking, and .call()s for narration
 * updates. The player calls tl.play(), tl.pause(), tl.restart().
 *
 * ─── Teaching flow (rigid) ─────────────────────────────────────────────────
 *
 *   1. Write "42" then "−18" then the bar
 *   2. Focus on the ones column, show "2 < 8"
 *   3. Circle the 4, arrow to the 2, strike both, write small 3 and 12
 *   4. Solve ones: 12 − 8 = 4
 *   5. Solve tens: 3 − 1 = 2
 *   6. Draw box around the answer "24"
 *
 * Total runtime: ~14 seconds.
 */

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

// ─── Style constants ───────────────────────────────────────────────────────

const INK  = "#1f2937";   // primary marker (dark slate)
const MARK = "#ea580c";   // highlight marker (amber-orange)
const BOARD_BG = "#fafaf5"; // soft off-white board

// All text element IDs (everything we'll "write")
const TEXT_IDS = [
  "t-4", "t-2",             // the "42"
  "t-minus", "t-1", "t-8",  // the "-18"
  "t-less",                 // "2 < 8" callout
  "t-3s", "t-12s",          // borrow notation (small 3 and 12)
  "t-ans-2", "t-ans-4",     // answer "24"
] as const;

// All stroke element IDs (everything we'll "draw")
const STROKE_IDS = [
  "line-bar",     // horizontal line under the problem
  "circle-4",     // circle around the tens-place 4
  "arrow-borrow", // arrow from 4 to 2
  "strike-4",     // diagonal strike through the 4
  "strike-2",     // diagonal strike through the 2
  "box-answer",   // box around the final answer
] as const;

// ─── Component ─────────────────────────────────────────────────────────────

type PlayState = "idle" | "playing" | "paused" | "done";

export function WhiteboardDemo() {
  const svgRef = useRef<SVGSVGElement>(null);
  const tlRef  = useRef<gsap.core.Timeline | null>(null);

  const [playState, setPlayState] = useState<PlayState>("idle");
  const [narration, setNarration] = useState("Press play. We'll solve 42 − 18 together.");

  // ─── Build the timeline on mount ────────────────────────────────────────
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    // ────────────────────────────────────────────────────────────────────
    // Step A: Prepare text clip paths — measure each text, size the clip
    //          rect to match its bounds, start with width 0 (invisible).
    // ────────────────────────────────────────────────────────────────────
    for (const id of TEXT_IDS) {
      const textEl  = svg.querySelector<SVGTextElement>(`#${id}`);
      const clipRect = svg.querySelector<SVGRectElement>(`#clip-${id}-rect`);
      if (!textEl || !clipRect) continue;

      const bbox = textEl.getBBox();
      const pad  = 6; // a little room so characters don't get clipped mid-stroke

      clipRect.setAttribute("x", String(bbox.x - pad));
      clipRect.setAttribute("y", String(bbox.y - pad));
      clipRect.setAttribute("height", String(bbox.height + pad * 2));
      clipRect.setAttribute("width", "0");
      clipRect.dataset["targetWidth"] = String(bbox.width + pad * 2);
    }

    // ────────────────────────────────────────────────────────────────────
    // Step B: Prepare stroke elements — compute length, set dasharray to
    //          length and dashoffset to length (so the stroke is invisible
    //          until we animate dashoffset to 0).
    // ────────────────────────────────────────────────────────────────────
    for (const id of STROKE_IDS) {
      const el = svg.querySelector<SVGGeometryElement>(`#${id}`);
      if (!el) continue;
      const len = el.getTotalLength();
      el.style.strokeDasharray  = String(len);
      el.style.strokeDashoffset = String(len);
    }

    // ────────────────────────────────────────────────────────────────────
    // Step C: Build the master timeline (paused).
    // ────────────────────────────────────────────────────────────────────
    const tl = gsap.timeline({
      paused: true,
      onComplete: () => setPlayState("done"),
    });

    // ── Scoped helpers ──
    const narr = (text: string) => () => setNarration(text);

    /** Write a text element by animating its clip rect width from 0 → full. */
    const write = (id: string, duration = 0.4, at?: string | number) => {
      const clipRect = svg.querySelector<SVGRectElement>(`#clip-${id}-rect`);
      if (!clipRect) return;
      const targetWidth = Number(clipRect.dataset["targetWidth"] ?? 0);
      const vars: gsap.TweenVars = {
        attr: { width: targetWidth },
        duration,
        ease: "none",
      };
      if (at !== undefined) tl.to(clipRect, vars, at);
      else                  tl.to(clipRect, vars);
    };

    /** Draw a stroked shape by animating stroke-dashoffset from full → 0. */
    const draw = (id: string, duration = 0.5, at?: string | number) => {
      const el = svg.querySelector<SVGGeometryElement>(`#${id}`);
      if (!el) return;
      const vars: gsap.TweenVars = {
        strokeDashoffset: 0,
        duration,
        ease: "power1.inOut",
      };
      if (at !== undefined) tl.to(el, vars, at);
      else                  tl.to(el, vars);
    };

    /** Insert a small "thinking" pause — no visual change. */
    const pause = (seconds: number) => tl.to({}, { duration: seconds });

    // ────────────────────────────────────────────────────────────────────
    // STEP 1: Write the problem (42 − 18, horizontal bar)
    // ────────────────────────────────────────────────────────────────────
    tl.call(narr("Let's solve 42 minus 18. First, I'll line up the numbers."));
    write("t-4", 0.32);
    write("t-2", 0.32, "+=0.08");
    pause(0.35);
    write("t-minus", 0.22);
    write("t-1", 0.32, "+=0.05");
    write("t-8", 0.32, "+=0.05");
    pause(0.25);
    draw("line-bar", 0.55);
    pause(0.55);

    // ────────────────────────────────────────────────────────────────────
    // STEP 2: Focus on the ones column, show that 2 < 8
    // ────────────────────────────────────────────────────────────────────
    tl.call(narr("Start with the ones column — 2 minus 8."));
    // Dim the tens column and the minus sign
    tl.to(["#t-4", "#t-1", "#t-minus"], { opacity: 0.3, duration: 0.3 });
    // Pulse the 2 and 8 with a warm glow
    tl.to(["#t-2", "#t-8"], {
      filter: `drop-shadow(0 0 6px ${MARK})`,
      duration: 0.25,
      yoyo: true,
      repeat: 1,
    }, "<");
    pause(0.4);

    tl.call(narr("Hmm — 2 is smaller than 8. We can't subtract yet. Time to borrow."));
    write("t-less", 0.5);
    pause(0.75);

    // ────────────────────────────────────────────────────────────────────
    // STEP 3: Borrow from the tens column
    // ────────────────────────────────────────────────────────────────────
    tl.call(narr("We borrow one ten from the 4 next door."));
    // Fade the "2 < 8" callout and bring the 4 back to full brightness
    tl.to("#t-less", { opacity: 0, duration: 0.3 });
    tl.to("#t-4",    { opacity: 1, duration: 0.25 }, "<");
    draw("circle-4", 0.7, "+=0.1");
    pause(0.3);

    // Arrow from the 4 to the 2 (showing the borrow direction)
    draw("arrow-borrow", 0.5);
    pause(0.3);

    // Convert the 4 → 3
    tl.call(narr("The 4 becomes 3."));
    draw("strike-4", 0.28);
    write("t-3s", 0.32, "+=0.1");
    pause(0.3);

    // Convert the 2 → 12
    tl.call(narr("And the 2 becomes 12."));
    draw("strike-2", 0.28);
    write("t-12s", 0.42, "+=0.1");
    pause(0.55);

    // ────────────────────────────────────────────────────────────────────
    // STEP 4: Solve the ones column (12 − 8 = 4)
    // ────────────────────────────────────────────────────────────────────
    tl.call(narr("Now 12 minus 8 equals 4."));
    // Dim tens-side elements
    tl.to(
      ["#t-4", "#t-1", "#circle-4", "#arrow-borrow", "#t-3s"],
      { opacity: 0.25, duration: 0.3 },
    );
    // Ensure ones-side elements are bright
    tl.to(
      ["#t-12s", "#t-8", "#strike-2", "#t-2"],
      { opacity: 1, duration: 0.2 },
      "<",
    );
    pause(0.2);
    write("t-ans-4", 0.4, "+=0.1");
    tl.to("#t-ans-4", {
      filter: `drop-shadow(0 0 6px ${MARK})`,
      duration: 0.28,
      yoyo: true,
      repeat: 1,
    });
    pause(0.45);

    // ────────────────────────────────────────────────────────────────────
    // STEP 5: Solve the tens column (3 − 1 = 2)
    // ────────────────────────────────────────────────────────────────────
    tl.call(narr("Now the tens: 3 minus 1 equals 2."));
    // Dim ones-side elements, bring back tens-side
    tl.to(
      ["#t-12s", "#t-8", "#t-2", "#strike-2", "#t-ans-4"],
      { opacity: 0.25, duration: 0.3 },
    );
    tl.to(
      ["#t-3s", "#t-1", "#t-4", "#strike-4"],
      { opacity: 1, duration: 0.2 },
      "<",
    );
    pause(0.2);
    write("t-ans-2", 0.4, "+=0.1");
    tl.to("#t-ans-2", {
      filter: `drop-shadow(0 0 6px ${MARK})`,
      duration: 0.28,
      yoyo: true,
      repeat: 1,
    });
    pause(0.45);

    // ────────────────────────────────────────────────────────────────────
    // STEP 6: Final answer — draw a box around "24"
    // ────────────────────────────────────────────────────────────────────
    tl.call(narr("So 42 minus 18 equals 24."));
    // Restore everything except the overused borrow visual
    tl.to(
      [
        "#t-4", "#t-2", "#t-minus", "#t-1", "#t-8", "#line-bar",
        "#t-ans-4", "#t-ans-2", "#t-3s", "#t-12s",
        "#strike-4", "#strike-2",
      ],
      { opacity: 1, duration: 0.4 },
    );
    tl.to(["#circle-4", "#arrow-borrow"], { opacity: 0.2, duration: 0.4 }, "<");
    draw("box-answer", 0.85, "+=0.2");
    pause(1.0);

    tlRef.current = tl;

    return () => {
      tl.kill();
      tlRef.current = null;
    };
  }, []);

  // ─── Controls ──────────────────────────────────────────────────────────

  const handlePlay = () => {
    const tl = tlRef.current;
    if (!tl) return;
    if (playState === "done") {
      handleRestart();
      return;
    }
    tl.play();
    setPlayState("playing");
  };

  const handlePause = () => {
    tlRef.current?.pause();
    setPlayState("paused");
  };

  const handleRestart = () => {
    const tl = tlRef.current;
    if (!tl) return;
    setNarration("Let's solve 42 minus 18 together.");
    tl.restart();
    setPlayState("playing");
  };

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <div className="rounded-3xl border-2 border-slate-200 bg-white shadow-lg overflow-hidden">

        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full" style={{ background: MARK }} />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Whiteboard
          </span>
          <span className="text-xs text-slate-400 ml-auto">Subtraction with borrowing</span>
        </div>

        {/* Whiteboard surface */}
        <div className="p-2 sm:p-3" style={{ background: BOARD_BG }}>
          <svg
            ref={svgRef}
            viewBox="0 0 800 500"
            className="w-full h-auto block"
            role="img"
            aria-label="Solving 42 minus 18 step by step on a whiteboard"
          >
            <defs>
              {TEXT_IDS.map((id) => (
                <clipPath key={id} id={`clip-${id}`}>
                  <rect id={`clip-${id}-rect`} x="0" y="0" width="0" height="0" />
                </clipPath>
              ))}
            </defs>

            {/* ─── Row 1: "4 2" ─── */}
            <text
              id="t-4"
              x="410" y="195"
              fontSize="80" fontWeight="900" fill={INK}
              textAnchor="middle" dominantBaseline="central"
              clipPath="url(#clip-t-4)"
              fontFamily="var(--font-nunito, system-ui), sans-serif"
            >4</text>
            <text
              id="t-2"
              x="490" y="195"
              fontSize="80" fontWeight="900" fill={INK}
              textAnchor="middle" dominantBaseline="central"
              clipPath="url(#clip-t-2)"
              fontFamily="var(--font-nunito, system-ui), sans-serif"
            >2</text>

            {/* ─── Row 2: "− 1 8" ─── */}
            <text
              id="t-minus"
              x="330" y="275"
              fontSize="70" fontWeight="bold" fill={INK}
              textAnchor="middle" dominantBaseline="central"
              clipPath="url(#clip-t-minus)"
              fontFamily="var(--font-nunito, system-ui), sans-serif"
            >−</text>
            <text
              id="t-1"
              x="410" y="275"
              fontSize="80" fontWeight="900" fill={INK}
              textAnchor="middle" dominantBaseline="central"
              clipPath="url(#clip-t-1)"
              fontFamily="var(--font-nunito, system-ui), sans-serif"
            >1</text>
            <text
              id="t-8"
              x="490" y="275"
              fontSize="80" fontWeight="900" fill={INK}
              textAnchor="middle" dominantBaseline="central"
              clipPath="url(#clip-t-8)"
              fontFamily="var(--font-nunito, system-ui), sans-serif"
            >8</text>

            {/* ─── Horizontal bar ─── */}
            <line
              id="line-bar"
              x1="300" y1="322" x2="545" y2="322"
              stroke={INK} strokeWidth="4" strokeLinecap="round"
            />

            {/* ─── "2 < 8" callout (to the right of the problem) ─── */}
            <text
              id="t-less"
              x="610" y="235"
              fontSize="36" fontWeight="bold" fill={MARK}
              textAnchor="start" dominantBaseline="central"
              clipPath="url(#clip-t-less)"
              fontFamily="var(--font-nunito, system-ui), sans-serif"
            >2 &lt; 8</text>

            {/* ─── Borrow notation: small "3" above the 4 ─── */}
            <text
              id="t-3s"
              x="410" y="125"
              fontSize="36" fontWeight="bold" fill={MARK}
              textAnchor="middle" dominantBaseline="central"
              clipPath="url(#clip-t-3s)"
              fontFamily="var(--font-nunito, system-ui), sans-serif"
            >3</text>

            {/* ─── Borrow notation: small "12" above the 2 ─── */}
            <text
              id="t-12s"
              x="490" y="125"
              fontSize="36" fontWeight="bold" fill={MARK}
              textAnchor="middle" dominantBaseline="central"
              clipPath="url(#clip-t-12s)"
              fontFamily="var(--font-nunito, system-ui), sans-serif"
            >12</text>

            {/* ─── Strikes (drawn on top of the digits) ─── */}
            <line
              id="strike-4"
              x1="380" y1="160" x2="440" y2="230"
              stroke={MARK} strokeWidth="4" strokeLinecap="round"
            />
            <line
              id="strike-2"
              x1="462" y1="160" x2="520" y2="230"
              stroke={MARK} strokeWidth="4" strokeLinecap="round"
            />

            {/* ─── Circle around the 4 (the one we're borrowing from) ─── */}
            <ellipse
              id="circle-4"
              cx="410" cy="195" rx="38" ry="46"
              fill="none" stroke={MARK} strokeWidth="3.5"
            />

            {/* ─── Arrow from the 4 to the 2 (short, clear) ─── */}
            {/* Path draws shaft + V-arrowhead as one continuous stroke */}
            <path
              id="arrow-borrow"
              d="M 450 195 L 468 195 M 464 190 L 468 195 L 464 200"
              fill="none" stroke={MARK} strokeWidth="3.5"
              strokeLinecap="round" strokeLinejoin="round"
            />

            {/* ─── Answer row: "2 4" ─── */}
            <text
              id="t-ans-2"
              x="410" y="400"
              fontSize="80" fontWeight="900" fill={INK}
              textAnchor="middle" dominantBaseline="central"
              clipPath="url(#clip-t-ans-2)"
              fontFamily="var(--font-nunito, system-ui), sans-serif"
            >2</text>
            <text
              id="t-ans-4"
              x="490" y="400"
              fontSize="80" fontWeight="900" fill={INK}
              textAnchor="middle" dominantBaseline="central"
              clipPath="url(#clip-t-ans-4)"
              fontFamily="var(--font-nunito, system-ui), sans-serif"
            >4</text>

            {/* ─── Box around the final answer ─── */}
            <path
              id="box-answer"
              d="M 370 350 L 535 350 L 535 450 L 370 450 Z"
              fill="none" stroke={MARK} strokeWidth="3.5"
              strokeLinejoin="round" strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Narration bar */}
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/60 min-h-[68px]">
          <p className="text-sm text-slate-700 leading-relaxed">
            {narration}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-slate-100">
          {playState === "playing" ? (
            <button
              onClick={handlePause}
              className="bg-slate-800 text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-slate-900 transition"
            >
              ❚❚ Pause
            </button>
          ) : (
            <button
              onClick={handlePlay}
              className="text-white font-bold px-5 py-2.5 rounded-xl text-sm transition"
              style={{ background: MARK }}
            >
              ▶ {playState === "done" ? "Replay" : playState === "paused" ? "Resume" : "Play"}
            </button>
          )}
          <button
            onClick={handleRestart}
            className="text-slate-500 font-semibold px-4 py-2.5 rounded-xl text-sm hover:bg-slate-100 transition"
          >
            ↻ Restart
          </button>
          <span className="ml-auto text-xs text-slate-400">~14s</span>
        </div>
      </div>
    </div>
  );
}

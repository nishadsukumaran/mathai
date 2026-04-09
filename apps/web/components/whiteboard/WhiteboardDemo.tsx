"use client";

/**
 * @module components/whiteboard/WhiteboardDemo
 *
 * Whiteboard Teaching Demo — a single hand-crafted teaching experience for
 * "42 − 18" with borrowing. Not an engine, not a renderer, not an abstraction.
 *
 * Refinements in this revision focus on the *feel* of a teacher working on a
 * board. Every change below is in service of that:
 *
 * ─── Writing feel ────────────────────────────────────────────────────────────
 * 1. Kalam handwriting font (loaded via next/font/google) — feels like a
 *    marker pen, not a crisp UI font.
 * 2. Glyph-by-glyph reveal for multi-digit numbers: "12" writes as "1", then
 *    a small pause, then "2". Same for the "2 − 8 = ?" callout, which writes
 *    the equation first, then pauses dramatically, then writes the "?".
 * 3. Pen-tip indicator: a small amber dot that fades in at the start of each
 *    glyph, tracks the write edge, and fades out at the end. Adds the illusion
 *    of a pen being picked up and placed.
 *
 * ─── Borrow transformation feel ──────────────────────────────────────────────
 * 1. The circle around the 4 is a custom SVG path starting at 12 o'clock and
 *    going clockwise (the natural direction for a right-handed teacher), with
 *    a small overshoot at the end so it doesn't look geometrically perfect.
 *    Drawn with a power1.out ease so the pen "slows" as it completes the loop.
 * 2. The borrow arrow is a curved quadratic arcing UP and OVER from the 4 to
 *    above the 2. The curve makes the "passing a ten" gesture causal and
 *    obvious — not just a straight line nudge.
 * 3. Strike → pause → small digit. The timing between striking a digit and
 *    writing its replacement is deliberately sequenced (strike completes,
 *    ~250ms beat, then the new digit writes) so it reads as one teaching
 *    action, not two overlapping events.
 *
 * ─── Attention guidance ──────────────────────────────────────────────────────
 * 1. Soft amber column wash (rounded rect with low-opacity fill + stroke)
 *    behind the currently active column. Fades in/out as focus shifts.
 * 2. Non-active elements dim to 0.28 opacity; active elements stay at 1.
 * 3. The 2 and 8 get a sustained orange drop-shadow glow (0.5s hold on the
 *    peak, not just a quick pulse) at the "2 is smaller than 8" moment so
 *    the student has time to register the problem.
 *
 * ─── Narration ──────────────────────────────────────────────────────────────
 * Only 4 narration updates across the ~17s lesson, placed at TEACHING intent
 * transitions (setup → crisis → resolution → answer). Animation events like
 * "now I'm focusing on this" or "here comes the next column" are silent — the
 * visuals carry that information.
 *
 * ─── Timeline control ───────────────────────────────────────────────────────
 * Single paused GSAP timeline built on mount. Controls: Play / Pause / Restart.
 * Restart calls tl.restart() which rewinds tweens to their captured from-state
 * and re-fires all .call()s, resetting the narration and replaying the scene.
 */

import { useEffect, useRef, useState } from "react";
import { Kalam } from "next/font/google";
import { gsap } from "gsap";

// ─── Handwriting font (module-level so Next.js can optimize) ────────────────
const kalam = Kalam({
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

// ─── Style constants ────────────────────────────────────────────────────────

const INK          = "#1f2937";              // primary marker (dark slate)
const MARK         = "#ea580c";              // highlight marker (amber-orange)
const BOARD_BG     = "#fafaf5";              // soft off-white board
const FOCUS_FILL   = "rgba(234, 88, 12, 0.06)";  // column wash fill
const FOCUS_STROKE = "rgba(234, 88, 12, 0.22)";  // column wash border

// All text elements we'll "write" (glyph-by-glyph for multi-char)
const TEXT_IDS = [
  "t-4", "t-2",                  // the "42"
  "t-minus", "t-1", "t-8",       // the "−18"
  "t-less-eq", "t-less-q",       // "2 − 8 =" + dramatic "?"
  "t-3s",                        // borrow notation: small 3
  "t-12s-1", "t-12s-2",          // borrow notation: small "1" + "2"
  "t-ans-2", "t-ans-4",          // answer "24"
] as const;

// All stroke elements we'll "draw"
const STROKE_IDS = [
  "line-bar",      // horizontal line under the problem
  "circle-4",      // hand-drawn circle around the tens-place 4
  "arrow-borrow",  // curved arrow arcing from 4 to 2
  "strike-4",      // strike through the 4
  "strike-2",      // strike through the 2
  "box-answer",    // box around the final answer
] as const;

// ─── Component ──────────────────────────────────────────────────────────────

type PlayState = "idle" | "playing" | "paused" | "done";

export function WhiteboardDemo() {
  const svgRef = useRef<SVGSVGElement>(null);
  const tlRef  = useRef<gsap.core.Timeline | null>(null);

  const [playState, setPlayState] = useState<PlayState>("idle");
  const [narration, setNarration] = useState("Press play to begin.");

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    // ────────────────────────────────────────────────────────────────────
    // Step A: Measure each text element and size its clip rect to match.
    //          Width starts at 0 (text invisible). Also stash pen-tip
    //          coordinates on the clip rect's dataset for the write helper.
    // ────────────────────────────────────────────────────────────────────
    for (const id of TEXT_IDS) {
      const textEl   = svg.querySelector<SVGTextElement>(`#${id}`);
      const clipRect = svg.querySelector<SVGRectElement>(`#clip-${id}-rect`);
      if (!textEl || !clipRect) continue;

      const bbox = textEl.getBBox();
      const pad  = 6;
      clipRect.setAttribute("x", String(bbox.x - pad));
      clipRect.setAttribute("y", String(bbox.y - pad));
      clipRect.setAttribute("height", String(bbox.height + pad * 2));
      clipRect.setAttribute("width", "0");
      clipRect.dataset["targetWidth"] = String(bbox.width + pad * 2);
      clipRect.dataset["penStartX"]   = String(bbox.x);
      clipRect.dataset["penEndX"]     = String(bbox.x + bbox.width);
      clipRect.dataset["penY"]        = String(bbox.y + bbox.height / 2);
    }

    // ────────────────────────────────────────────────────────────────────
    // Step B: Prepare stroke elements — length-based dash reveal trick.
    // ────────────────────────────────────────────────────────────────────
    for (const id of STROKE_IDS) {
      const el = svg.querySelector<SVGGeometryElement>(`#${id}`);
      if (!el) continue;
      const len = el.getTotalLength();
      el.style.strokeDasharray  = String(len);
      el.style.strokeDashoffset = String(len);
    }

    const penTip = svg.querySelector<SVGCircleElement>("#pen-tip");

    // ────────────────────────────────────────────────────────────────────
    // Step C: Build the master timeline (paused).
    // ────────────────────────────────────────────────────────────────────
    const tl = gsap.timeline({
      paused: true,
      onComplete: () => setPlayState("done"),
    });

    const narr = (text: string) => () => setNarration(text);

    /**
     * Write a glyph by animating its clip rect width 0 → full, with a small
     * pen-tip dot that fades in at the start, tracks the write edge, and
     * fades out at the end. Creates the illusion of a pen laying down ink.
     */
    const write = (
      id: string,
      duration = 0.42,
      opts: { at?: string | number } = {},
    ) => {
      const clipRect = svg.querySelector<SVGRectElement>(`#clip-${id}-rect`);
      if (!clipRect || !penTip) return;

      const targetWidth = Number(clipRect.dataset["targetWidth"] ?? 0);
      const penStartX   = Number(clipRect.dataset["penStartX"] ?? 0);
      const penEndX     = Number(clipRect.dataset["penEndX"] ?? 0);
      const penY        = Number(clipRect.dataset["penY"] ?? 0);

      const base = opts.at !== undefined ? opts.at : ">";

      // 1. Place pen at glyph start
      tl.set(penTip, { attr: { cx: penStartX, cy: penY } }, base);
      // 2. Pen fades in
      tl.to(penTip, { opacity: 0.9, duration: 0.08 }, ">");
      // 3. Clip reveals + pen tracks the leading edge (both start together)
      tl.to(clipRect, {
        attr: { width: targetWidth },
        duration,
        ease: "none",
      }, ">");
      tl.to(penTip, {
        attr: { cx: penEndX },
        duration,
        ease: "none",
      }, "<");
      // 4. Pen lifts
      tl.to(penTip, { opacity: 0, duration: 0.12 }, ">");
    };

    /** Draw a stroked shape by animating stroke-dashoffset full → 0. */
    const draw = (
      id: string,
      duration = 0.5,
      opts: { at?: string | number; ease?: string } = {},
    ) => {
      const el = svg.querySelector<SVGGeometryElement>(`#${id}`);
      if (!el) return;
      const vars: gsap.TweenVars = {
        strokeDashoffset: 0,
        duration,
        ease: opts.ease ?? "power1.inOut",
      };
      if (opts.at !== undefined) tl.to(el, vars, opts.at);
      else                       tl.to(el, vars);
    };

    /** Thinking pause — no visual change, just space. */
    const pause = (seconds: number) => tl.to({}, { duration: seconds });

    // ════════════════════════════════════════════════════════════════════
    // STEP 1: Set up the problem
    // ════════════════════════════════════════════════════════════════════
    tl.call(narr("Let's solve 42 minus 18."));
    pause(0.35);
    write("t-4", 0.42);
    write("t-2", 0.42, { at: "+=0.1" });
    pause(0.35);
    write("t-minus", 0.28);
    write("t-1", 0.42, { at: "+=0.05" });
    write("t-8", 0.42, { at: "+=0.05" });
    pause(0.2);
    draw("line-bar", 0.55);
    pause(0.65);

    // ════════════════════════════════════════════════════════════════════
    // STEP 2: The "2 < 8" realization
    // ════════════════════════════════════════════════════════════════════
    // Fade the tens column into the background, wash the ones column
    tl.to("#focus-ones-col", { opacity: 1, duration: 0.4, ease: "power1.out" });
    tl.to(["#t-4", "#t-1", "#t-minus"], { opacity: 0.32, duration: 0.4 }, "<");

    // Hold a sustained glow on the 2 and 8 so the student has time to see
    // the problem (peak glow for 0.45s, then gentle release)
    tl.to(["#t-2", "#t-8"], {
      filter: `drop-shadow(0 0 10px ${MARK})`,
      duration: 0.5,
      ease: "power2.out",
    });
    tl.to(["#t-2", "#t-8"], {
      filter: `drop-shadow(0 0 0px ${MARK})`,
      duration: 0.55,
      ease: "power2.in",
    }, "+=0.45");
    pause(0.25);

    // The aha: write "2 − 8 =" then PAUSE before the "?"
    tl.call(narr("But 2 is smaller than 8. We need to borrow."));
    write("t-less-eq", 0.75);
    pause(0.5);
    write("t-less-q", 0.38);
    // Pulse the question mark
    tl.to("#t-less-q", {
      filter: `drop-shadow(0 0 12px ${MARK})`,
      duration: 0.3,
      yoyo: true,
      repeat: 1,
    });
    pause(0.5);

    // ════════════════════════════════════════════════════════════════════
    // STEP 3: Borrow from the tens
    // ════════════════════════════════════════════════════════════════════
    // Fade callout and shift focus to the tens column
    tl.to(["#t-less-eq", "#t-less-q"], { opacity: 0, duration: 0.4 });
    tl.to("#focus-ones-col", { opacity: 0, duration: 0.4 }, "<");
    tl.to("#focus-tens-col", { opacity: 1, duration: 0.4 }, "<");
    tl.to("#t-4", { opacity: 1, duration: 0.35 }, "<");
    pause(0.2);

    // Pulse the 4 briefly before circling it — like a teacher tapping it
    tl.to("#t-4", {
      filter: `drop-shadow(0 0 10px ${MARK})`,
      duration: 0.28,
      yoyo: true,
      repeat: 1,
    });

    // Circle the 4 (hand-drawn path, ease-out so it "lands" slowing down)
    draw("circle-4", 0.9, { at: "+=0.15", ease: "power1.out" });
    pause(0.4);

    // The borrow gesture: curved arrow arcing from 4 → above the 2.
    // The 2 brightens back as the arrow reaches it.
    tl.to("#t-2", { opacity: 1, duration: 0.35 });
    draw("arrow-borrow", 0.75, { at: "<", ease: "power2.inOut" });
    pause(0.45);

    // 4 → 3  (strike, beat, write the small "3")
    draw("strike-4", 0.32);
    pause(0.22);
    write("t-3s", 0.42);
    pause(0.45);

    // 2 → 12  (strike, beat, write small "1" then small "2")
    draw("strike-2", 0.32);
    pause(0.22);
    write("t-12s-1", 0.38);
    write("t-12s-2", 0.38, { at: "+=0.08" });
    pause(0.65);

    // ════════════════════════════════════════════════════════════════════
    // STEP 4: Solve the ones column (12 − 8 = 4)
    // ════════════════════════════════════════════════════════════════════
    tl.call(narr("Now 12 minus 8, and 3 minus 1."));
    pause(0.3);
    tl.to("#focus-tens-col", { opacity: 0, duration: 0.4 });
    tl.to("#focus-ones-col", { opacity: 1, duration: 0.4 }, "<");
    // Dim tens side
    tl.to(
      ["#t-4", "#t-1", "#circle-4", "#arrow-borrow", "#t-3s", "#strike-4"],
      { opacity: 0.28, duration: 0.4 },
      "<",
    );
    // Keep ones side bright
    tl.to(
      ["#t-12s-1", "#t-12s-2", "#t-8", "#strike-2", "#t-2"],
      { opacity: 1, duration: 0.3 },
      "<",
    );
    pause(0.3);
    write("t-ans-4", 0.48);
    tl.to("#t-ans-4", {
      filter: `drop-shadow(0 0 10px ${MARK})`,
      duration: 0.35,
      yoyo: true,
      repeat: 1,
    });
    pause(0.5);

    // ════════════════════════════════════════════════════════════════════
    // STEP 5: Solve the tens column (3 − 1 = 2)
    // No narration — the pattern is clear from the previous step.
    // ════════════════════════════════════════════════════════════════════
    tl.to("#focus-ones-col", { opacity: 0, duration: 0.4 });
    tl.to("#focus-tens-col", { opacity: 1, duration: 0.4 }, "<");
    tl.to(
      ["#t-12s-1", "#t-12s-2", "#t-8", "#t-2", "#strike-2", "#t-ans-4"],
      { opacity: 0.28, duration: 0.4 },
      "<",
    );
    tl.to(
      ["#t-3s", "#t-1", "#t-4", "#strike-4"],
      { opacity: 1, duration: 0.3 },
      "<",
    );
    pause(0.3);
    write("t-ans-2", 0.48);
    tl.to("#t-ans-2", {
      filter: `drop-shadow(0 0 10px ${MARK})`,
      duration: 0.35,
      yoyo: true,
      repeat: 1,
    });
    pause(0.55);

    // ════════════════════════════════════════════════════════════════════
    // STEP 6: Final answer
    // ════════════════════════════════════════════════════════════════════
    tl.call(narr("42 minus 18 is 24."));
    tl.to("#focus-tens-col", { opacity: 0, duration: 0.4 });
    // Restore everything to full brightness (except the borrow helpers, which
    // fade to a subtle presence so they don't compete with the answer)
    tl.to(
      [
        "#t-4", "#t-2", "#t-minus", "#t-1", "#t-8", "#line-bar",
        "#t-ans-4", "#t-ans-2", "#t-3s", "#t-12s-1", "#t-12s-2",
        "#strike-4", "#strike-2",
      ],
      { opacity: 1, duration: 0.4 },
      "<",
    );
    tl.to(
      ["#circle-4", "#arrow-borrow"],
      { opacity: 0.22, duration: 0.4 },
      "<",
    );
    draw("box-answer", 0.95, { at: "+=0.2", ease: "power1.inOut" });
    pause(1.1);

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
    setNarration("Let's solve 42 minus 18.");
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

            {/* ─── Column focus washes (behind everything, start hidden) ─── */}
            <rect
              id="focus-tens-col"
              x="370" y="100" width="80" height="325" rx="14"
              fill={FOCUS_FILL}
              stroke={FOCUS_STROKE}
              strokeWidth="1.5"
              style={{ opacity: 0 }}
            />
            <rect
              id="focus-ones-col"
              x="450" y="100" width="80" height="325" rx="14"
              fill={FOCUS_FILL}
              stroke={FOCUS_STROKE}
              strokeWidth="1.5"
              style={{ opacity: 0 }}
            />

            {/* ─── Row 1: "4 2" ─── */}
            <text
              id="t-4"
              x="410" y="195"
              fontSize="84" fontWeight="700" fill={INK}
              textAnchor="middle" dominantBaseline="central"
              clipPath="url(#clip-t-4)"
              fontFamily={kalam.style.fontFamily}
            >4</text>
            <text
              id="t-2"
              x="490" y="195"
              fontSize="84" fontWeight="700" fill={INK}
              textAnchor="middle" dominantBaseline="central"
              clipPath="url(#clip-t-2)"
              fontFamily={kalam.style.fontFamily}
            >2</text>

            {/* ─── Row 2: "− 1 8" ─── */}
            <text
              id="t-minus"
              x="330" y="275"
              fontSize="72" fontWeight="700" fill={INK}
              textAnchor="middle" dominantBaseline="central"
              clipPath="url(#clip-t-minus)"
              fontFamily={kalam.style.fontFamily}
            >−</text>
            <text
              id="t-1"
              x="410" y="275"
              fontSize="84" fontWeight="700" fill={INK}
              textAnchor="middle" dominantBaseline="central"
              clipPath="url(#clip-t-1)"
              fontFamily={kalam.style.fontFamily}
            >1</text>
            <text
              id="t-8"
              x="490" y="275"
              fontSize="84" fontWeight="700" fill={INK}
              textAnchor="middle" dominantBaseline="central"
              clipPath="url(#clip-t-8)"
              fontFamily={kalam.style.fontFamily}
            >8</text>

            {/* ─── Horizontal bar ─── */}
            <line
              id="line-bar"
              x1="300" y1="322" x2="548" y2="322"
              stroke={INK} strokeWidth="4.5" strokeLinecap="round"
            />

            {/* ─── "2 − 8 = ?" callout (two parts for dramatic beat) ─── */}
            <text
              id="t-less-eq"
              x="595" y="235"
              fontSize="38" fontWeight="700" fill={MARK}
              textAnchor="start" dominantBaseline="central"
              clipPath="url(#clip-t-less-eq)"
              fontFamily={kalam.style.fontFamily}
            >2 − 8 =</text>
            <text
              id="t-less-q"
              x="710" y="233"
              fontSize="46" fontWeight="700" fill={MARK}
              textAnchor="start" dominantBaseline="central"
              clipPath="url(#clip-t-less-q)"
              fontFamily={kalam.style.fontFamily}
            >?</text>

            {/* ─── Borrow notation: small "3" above the 4 ─── */}
            <text
              id="t-3s"
              x="410" y="125"
              fontSize="38" fontWeight="700" fill={MARK}
              textAnchor="middle" dominantBaseline="central"
              clipPath="url(#clip-t-3s)"
              fontFamily={kalam.style.fontFamily}
            >3</text>

            {/* ─── Borrow notation: small "1" + "2" above the 2 (glyph-by-glyph) ─── */}
            <text
              id="t-12s-1"
              x="484" y="125"
              fontSize="38" fontWeight="700" fill={MARK}
              textAnchor="middle" dominantBaseline="central"
              clipPath="url(#clip-t-12s-1)"
              fontFamily={kalam.style.fontFamily}
            >1</text>
            <text
              id="t-12s-2"
              x="502" y="125"
              fontSize="38" fontWeight="700" fill={MARK}
              textAnchor="middle" dominantBaseline="central"
              clipPath="url(#clip-t-12s-2)"
              fontFamily={kalam.style.fontFamily}
            >2</text>

            {/*
              ─── Hand-drawn circle around the 4 ───
              Path starts at top (12 o'clock), traces clockwise via 4 arc
              commands, and ends slightly past the start point for a natural
              overshoot. stroke-dasharray reveal traces it with a power1.out
              ease so the pen "slows down" as it lands.
            */}
            <path
              id="circle-4"
              d="M 410 147 A 42 48 0 0 1 452 195 A 42 48 0 0 1 410 243 A 42 48 0 0 1 368 195 A 42 48 0 0 1 416 150"
              fill="none"
              stroke={MARK}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/*
              ─── Curved borrow arrow (arcs above the row from 4 → 2) ───
              Quadratic Bezier from right-of-4 up over the row to above-2.
              The arrowhead is a separate subpath so it draws at the end of
              the stroke reveal, not at the start.
            */}
            <path
              id="arrow-borrow"
              d="M 452 180 Q 466 100 490 155 M 484 148 L 490 155 L 492 146"
              fill="none"
              stroke={MARK}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* ─── Strikes (drawn on top of the digits) ─── */}
            <line
              id="strike-4"
              x1="378" y1="158" x2="442" y2="232"
              stroke={MARK} strokeWidth="4" strokeLinecap="round"
            />
            <line
              id="strike-2"
              x1="460" y1="158" x2="522" y2="232"
              stroke={MARK} strokeWidth="4" strokeLinecap="round"
            />

            {/* ─── Answer row: "2 4" ─── */}
            <text
              id="t-ans-2"
              x="410" y="400"
              fontSize="84" fontWeight="700" fill={INK}
              textAnchor="middle" dominantBaseline="central"
              clipPath="url(#clip-t-ans-2)"
              fontFamily={kalam.style.fontFamily}
            >2</text>
            <text
              id="t-ans-4"
              x="490" y="400"
              fontSize="84" fontWeight="700" fill={INK}
              textAnchor="middle" dominantBaseline="central"
              clipPath="url(#clip-t-ans-4)"
              fontFamily={kalam.style.fontFamily}
            >4</text>

            {/* ─── Answer box ─── */}
            <path
              id="box-answer"
              d="M 370 350 L 535 350 L 535 450 L 370 450 Z"
              fill="none"
              stroke={MARK}
              strokeWidth="4"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* ─── Pen-tip (topmost, starts invisible) ─── */}
            <circle
              id="pen-tip"
              cx="0" cy="0" r="4.5"
              fill={MARK}
              style={{ opacity: 0 }}
            />
          </svg>
        </div>

        {/* Narration */}
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
          <span className="ml-auto text-xs text-slate-400">~17s</span>
        </div>
      </div>
    </div>
  );
}

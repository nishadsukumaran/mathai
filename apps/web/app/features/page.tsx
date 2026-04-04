"use client";

/**
 * @module app/features
 *
 * Deep product features page — explains MathAI with rich visuals,
 * alternating layouts, and persuasive copy.
 */

import Link       from "next/link";
import { motion } from "framer-motion";
import { Navbar }  from "@/components/landing/Navbar";
import { Footer }  from "@/components/landing/Footer";

const fadeUp = {
  hidden:  { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
const scaleIn = {
  hidden:  { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};
const VP = { once: true, margin: "-80px" as any };

// ─── Feature sections data ───────────────────────────��──────────────────────

const HERO_FEATURES = [
  { icon: "🎯", title: "Adaptive Practice",     desc: "AI-powered questions that match each student's level" },
  { icon: "🤖", title: "AI Tutor",              desc: "Step-by-step explanations when students get stuck" },
  { icon: "🎨", title: "Visual Learning",       desc: "Number lines, bar models, and animated diagrams" },
  { icon: "⚡", title: "XP & Rewards",          desc: "Points, streaks, levels, and pet companions" },
  { icon: "👨‍👩‍👧", title: "Parent Dashboard",   desc: "Real-time insights into progress and understanding" },
  { icon: "📊", title: "Progress Analytics",    desc: "Mastery tracking across every topic and skill" },
  { icon: "🧠", title: "Learning Brain",        desc: "Smart recommendations for what to learn next" },
  { icon: "🛡️", title: "Safe & Private",        desc: "No ads, no social features, full data privacy" },
];

interface FeatureSection {
  badge:      string;
  badgeColor: string;
  title:      string;
  desc:       string;
  items:      { icon: string; label: string; text: string }[];
  mockup:     React.ReactNode;
  reversed?:  boolean;
}

const SECTIONS: FeatureSection[] = [
  {
    badge: "Adaptive Practice",
    badgeColor: "text-indigo-600 bg-indigo-50",
    title: "Questions that grow with your child",
    desc: "MathAI's Learning Brain analyzes every answer in real time. When a student struggles, it offers easier problems to rebuild confidence. When they excel, it pushes them further. No two sessions are the same.",
    items: [
      { icon: "📊", label: "Real-time difficulty", text: "Adjusts after every single answer" },
      { icon: "🧠", label: "Pattern detection", text: "Identifies specific misconceptions" },
      { icon: "🎯", label: "Smart recommendations", text: "Suggests the best topic to work on next" },
    ],
    mockup: (
      <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-3xl p-6 border border-indigo-100">
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-3">
          <p className="text-xs font-bold text-gray-400 uppercase mb-2">Current Question</p>
          <p className="font-semibold text-gray-800 mb-3">What is 3/4 + 1/2?</p>
          <div className="grid grid-cols-2 gap-2">
            {["5/6", "1 1/4", "4/6", "5/4"].map((a, i) => (
              <div key={i} className={`py-2.5 rounded-lg border-2 text-center text-sm font-semibold ${i === 1 ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-600"}`}>{a}</div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 px-2">
          <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" style={{ width: "60%" }} />
          </div>
          <span className="text-xs text-gray-400 font-medium">6/10</span>
        </div>
      </div>
    ),
  },
  {
    badge: "AI Tutoring",
    badgeColor: "text-violet-600 bg-violet-50",
    title: "Like having a patient tutor 24/7",
    desc: "When students get stuck, MathAI doesn't just show the answer. It walks through the problem step by step, using the same teaching methods great tutors use — scaffolding, visual aids, and encouraging language.",
    items: [
      { icon: "💬", label: "Step-by-step hints", text: "Progressive guidance, not just answers" },
      { icon: "🎨", label: "Visual explanations", text: "Number lines, bar models, diagrams" },
      { icon: "🌟", label: "Growth mindset", text: "Encouraging language throughout" },
    ],
    reversed: true,
    mockup: (
      <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-3xl p-6 border border-violet-100">
        <div className="space-y-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-base shrink-0">🤖</div>
              <div>
                <p className="text-sm text-gray-700 leading-relaxed">Let&apos;s break this down! To add fractions, we need the same denominator.</p>
                <p className="text-xs text-gray-400 mt-1">Step 1 of 3</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-base shrink-0">🤖</div>
              <div>
                <p className="text-sm text-gray-700 leading-relaxed">3/4 stays the same. Convert 1/2 to 2/4.</p>
                {/* Mini number line */}
                <div className="mt-2 bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-1">
                    <div className="text-[10px] text-gray-400">0</div>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full relative">
                      <div className="absolute left-[50%] top-0 w-0.5 h-2 bg-indigo-400" />
                      <div className="absolute left-[75%] top-0 w-0.5 h-2 bg-violet-500" />
                    </div>
                    <div className="text-[10px] text-gray-400">1</div>
                  </div>
                  <div className="flex justify-between text-[9px] text-gray-400 mt-0.5 px-1">
                    <span>1/2</span><span>3/4</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    badge: "Gamification",
    badgeColor: "text-amber-600 bg-amber-50",
    title: "Rewards that actually motivate",
    desc: "XP points, daily streaks, levels, and a pet companion that grows alongside your child. Every correct answer feels like progress. Every practice session is a step toward the next milestone.",
    items: [
      { icon: "⚡", label: "Experience points", text: "Earn XP for every correct answer" },
      { icon: "🔥", label: "Streaks & milestones", text: "Build momentum with daily practice" },
      { icon: "🐾", label: "Pet companion", text: "Hatch and evolve a companion that grows with you" },
    ],
    mockup: (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 border border-amber-100">
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-3">
          <div className="text-center mb-3">
            <span className="text-4xl">🦉</span>
            <p className="font-bold text-gray-800 text-sm mt-1">Spark Owl</p>
            <p className="text-[10px] text-gray-400">Level 3 · Excited</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-indigo-50 rounded-lg p-2 text-center">
              <p className="text-sm font-bold text-indigo-600">5</p>
              <p className="text-[9px] text-gray-400">Level</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-2 text-center">
              <p className="text-sm font-bold text-orange-500">7</p>
              <p className="text-[9px] text-gray-400">Streak</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-2 text-center">
              <p className="text-sm font-bold text-purple-600">1.2k</p>
              <p className="text-[9px] text-gray-400">XP</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <p className="text-xs font-bold text-emerald-600">+120 XP Earned!</p>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full" style={{ width: "72%" }} />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">280 XP to next level</p>
        </div>
      </div>
    ),
  },
  {
    badge: "Parent Intelligence",
    badgeColor: "text-emerald-600 bg-emerald-50",
    title: "See the full picture, not just grades",
    desc: "The parent dashboard gives you real understanding — not a number on a report card. See which concepts your child has mastered, where they're struggling, and get AI-powered suggestions for how to help.",
    items: [
      { icon: "📈", label: "Mastery tracking", text: "Topic-by-topic progress visualization" },
      { icon: "💡", label: "AI insights", text: "Personalized recommendations for parents" },
      { icon: "💬", label: "Ask MathAI", text: "Get curriculum guidance from the AI tutor" },
    ],
    reversed: true,
    mockup: (
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-6 border border-emerald-100">
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-3">
          <p className="text-xs font-bold text-gray-400 uppercase mb-3">This Week&apos;s Progress</p>
          {[
            { t: "Addition & Subtraction", p: 92, c: "bg-emerald-500" },
            { t: "Multiplication", p: 68, c: "bg-indigo-500" },
            { t: "Fractions", p: 45, c: "bg-amber-500" },
            { t: "Geometry", p: 22, c: "bg-rose-400" },
          ].map((b) => (
            <div key={b.t} className="mb-2.5 last:mb-0">
              <div className="flex justify-between text-xs mb-0.5">
                <span className="text-gray-600 font-medium">{b.t}</span>
                <span className="text-gray-400 font-semibold">{b.p}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${b.c} rounded-full`} style={{ width: `${b.p}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-bold text-emerald-600 mb-1">💡 AI Suggestion</p>
          <p className="text-xs text-gray-600 leading-relaxed">
            Focus on fractions this week — your child is close to a breakthrough
            with equivalent fractions.
          </p>
        </div>
      </div>
    ),
  },
];

// ═════════════════════════════════════════════════════════════════════════════

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-hidden">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="pt-16 sm:pt-24 pb-16 sm:pb-20 relative">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-indigo-50/60 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-50/50 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5 mb-6">
              <span className="text-xs">🚀</span>
              <span className="text-xs font-semibold text-indigo-600">Everything your child needs to love math</span>
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-3xl sm:text-5xl font-black leading-tight tracking-tight mb-5">
              Features built for{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">real learning</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
              MathAI combines adaptive AI tutoring, visual explanations, gamified
              motivation, and parent intelligence into one seamless experience.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── Feature overview grid ────────────────────────────────────── */}
      <section className="pb-20">
        <motion.div
          initial="hidden" whileInView="visible" viewport={VP} variants={stagger}
          className="max-w-5xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          {HERO_FEATURES.map((f, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-center hover:bg-white hover:border-indigo-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
            >
              <span className="text-2xl block mb-2">{f.icon}</span>
              <p className="font-bold text-gray-800 text-sm mb-0.5">{f.title}</p>
              <p className="text-[11px] text-gray-400 leading-snug">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ─�� Deep feature sections ────────────────────────────────────── */}
      {SECTIONS.map((s, idx) => (
        <section key={idx} className={`py-16 sm:py-24 ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
          <div className="max-w-6xl mx-auto px-6">
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center`}>
              {/* Text */}
              <motion.div
                initial="hidden" whileInView="visible" viewport={VP} variants={stagger}
                className={s.reversed ? "order-1 lg:order-2" : ""}
              >
                <motion.span variants={fadeUp} className={`inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4 ${s.badgeColor}`}>
                  {s.badge}
                </motion.span>
                <motion.h2 variants={fadeUp} className="text-2xl sm:text-3xl font-black tracking-tight mb-4">
                  {s.title}
                </motion.h2>
                <motion.p variants={fadeUp} className="text-gray-500 leading-relaxed mb-8">
                  {s.desc}
                </motion.p>
                <motion.div variants={stagger} className="space-y-4">
                  {s.items.map((item, i) => (
                    <motion.div key={i} variants={fadeUp} className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-lg shrink-0">
                        {item.icon}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{item.label}</p>
                        <p className="text-xs text-gray-400">{item.text}</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>

              {/* Mockup */}
              <motion.div
                initial="hidden" whileInView="visible" viewport={VP} variants={scaleIn}
                className={s.reversed ? "order-2 lg:order-1" : ""}
              >
                {s.mockup}
              </motion.div>
            </div>
          </div>
        </section>
      ))}

      {/* ── Safety section ───────────────────────────────────────────── */}
      <section className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={VP} variants={stagger}>
            <motion.span variants={fadeUp} className="inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4 text-emerald-600 bg-emerald-50">
              Safety First
            </motion.span>
            <motion.h2 variants={fadeUp} className="text-2xl sm:text-3xl font-black tracking-tight mb-4">
              Designed with your child&apos;s safety in mind
            </motion.h2>
            <motion.p variants={fadeUp} className="text-gray-500 max-w-xl mx-auto leading-relaxed mb-10">
              MathAI is built from the ground up to be a safe, private learning
              environment. No ads, no social features, no data selling.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={VP} variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-3 gap-5"
          >
            {[
              { icon: "🔒", title: "Encrypted Data",        desc: "All student data encrypted at rest and in transit" },
              { icon: "🚫", title: "No Ads, Ever",          desc: "Zero advertising or third-party trackers" },
              { icon: "👨‍👩‍👧", title: "Parent-Controlled", desc: "Parents manage accounts, PINs, and access" },
            ].map((s, i) => (
              <motion.div key={i} variants={fadeUp} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-shadow">
                <span className="text-3xl block mb-3">{s.icon}</span>
                <p className="font-bold text-gray-800 mb-1">{s.title}</p>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24">
        <motion.div
          initial="hidden" whileInView="visible" viewport={VP} variants={scaleIn}
          className="max-w-4xl mx-auto px-6"
        >
          <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-3xl p-10 sm:p-14 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-black mb-4">
                Ready to see it in action?
              </h2>
              <p className="text-indigo-200 max-w-md mx-auto mb-8">
                Create a free account and let your child try their first
                adaptive practice session today.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/auth/signup"
                  className="w-full sm:w-auto bg-white text-indigo-700 px-8 py-4 rounded-2xl font-bold hover:bg-indigo-50 hover:-translate-y-0.5 transition-all shadow-lg"
                >
                  Create Free Account
                </Link>
                <Link
                  href="/auth/signin"
                  className="w-full sm:w-auto border-2 border-white/30 text-white px-8 py-4 rounded-2xl font-bold hover:bg-white/10 transition-all"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}

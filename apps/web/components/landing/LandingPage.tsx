"use client";

/**
 * @module components/landing/LandingPage
 *
 * Premium landing page for MathAI — modern SaaS feel with playful warmth.
 * All sections in one file to keep the component tree shallow.
 * Uses Framer Motion for scroll-triggered reveals and CSS for infinite floats.
 */

import Link            from "next/link";
import { motion }      from "framer-motion";
import { Navbar }      from "./Navbar";
import { Footer }      from "./Footer";

// ─── Animation helpers ───────────────────────────────────────────────────────

const fadeUp = {
  hidden:  { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const scaleIn = {
  hidden:  { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

const VP = { once: true, margin: "-80px" as any };

// ─── Data ────────────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: "🎯", title: "Adaptive Practice",   desc: "Questions adjust to each student's level in real time — always the right challenge." },
  { icon: "🤖", title: "AI Tutor",            desc: "Step-by-step explanations with visual aids whenever a student gets stuck." },
  { icon: "🎨", title: "Visual Learning",     desc: "Number lines, bar models, and animated diagrams that make abstract concepts click." },
  { icon: "⚡", title: "XP & Streaks",        desc: "Earn points, maintain streaks, and level up — learning feels like a game." },
  { icon: "👨‍👩‍👧", title: "Parent Dashboard",  desc: "Real-time insights into your child's progress, strengths, and areas to grow." },
  { icon: "🛡️", title: "Safe & Private",      desc: "Child-friendly design with no ads, no social features, and full data privacy." },
];

const STEPS = [
  { num: "1", title: "Sign up in seconds",     desc: "Create a parent account and set up your child's profile with their grade level.", icon: "✨" },
  { num: "2", title: "Start practicing",        desc: "Your child picks a topic or lets the AI recommend what to learn next.", icon: "📚" },
  { num: "3", title: "Watch them grow",         desc: "Track mastery, celebrate milestones, and see real progress every week.", icon: "📈" },
];

const MOTIVATION_ITEMS = [
  { icon: "⚡", label: "Earn XP",      desc: "Every correct answer earns experience points" },
  { icon: "🔥", label: "Build Streaks", desc: "Daily practice builds unstoppable momentum" },
  { icon: "🏆", label: "Level Up",     desc: "Progress through levels as mastery grows" },
  { icon: "🐾", label: "Pet Companion", desc: "Hatch and evolve a companion that grows with you" },
];

const PARENT_ITEMS = [
  { icon: "📊", title: "Learning Intelligence", desc: "See exactly what your child understands and where they need support — not just scores, but real insights." },
  { icon: "🧠", title: "AI-Powered Recommendations", desc: "Get personalized suggestions for topics to review, practice schedules, and learning strategies." },
  { icon: "💬", title: "Ask MathAI for Parents", desc: "Not sure how to help? Ask the AI tutor any question about your child's curriculum." },
];

// ─── Floating decorative elements (CSS animated) ─────────────────────────────

const FLOATS = [
  { ch: "π",  x: "8%",  y: "18%", size: "text-2xl", dur: "7s", del: "0s" },
  { ch: "+",  x: "88%", y: "12%", size: "text-3xl", dur: "9s", del: "1s" },
  { ch: "÷",  x: "15%", y: "72%", size: "text-xl",  dur: "8s", del: "2s" },
  { ch: "△",  x: "82%", y: "68%", size: "text-2xl", dur: "6s", del: "0.5s" },
  { ch: "∞",  x: "92%", y: "40%", size: "text-xl",  dur: "10s",del: "3s" },
  { ch: "×",  x: "5%",  y: "45%", size: "text-2xl", dur: "8s", del: "1.5s" },
  { ch: "√",  x: "75%", y: "85%", size: "text-lg",  dur: "7s", del: "2.5s" },
  { ch: "=",  x: "25%", y: "88%", size: "text-xl",  dur: "9s", del: "0.8s" },
  { ch: "✨", x: "50%", y: "8%",  size: "text-sm",  dur: "6s", del: "1.2s" },
  { ch: "◇",  x: "35%", y: "78%", size: "text-lg",  dur: "11s",del: "2s" },
];

// ═════════════════════════════════════════════════════════════════════════════
// Component
// ═════════════════════════════════════════════════════════════════════════════

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-hidden">
      <Navbar />
      <Hero />
      <StatsStrip />
      <FeaturesSection />
      <HowItWorks />
      <MotivationSection />
      <ParentSection />
      <CTASection />
      <Footer />
    </div>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative pt-16 sm:pt-24 pb-20 sm:pb-32 overflow-hidden">
      {/* Gradient mesh background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-100/60 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-100/50 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-pink-50/40 rounded-full blur-3xl" />
      </div>

      {/* Floating math symbols */}
      <div className="absolute inset-0 -z-5 pointer-events-none" aria-hidden>
        {FLOATS.map((f, i) => (
          <span
            key={i}
            className={`absolute ${f.size} text-indigo-300/30 font-bold select-none`}
            style={{
              left: f.x, top: f.y,
              animation: `mathFloat ${f.dur} ease-in-out ${f.del} infinite`,
            }}
          >
            {f.ch}
          </span>
        ))}
      </div>

      <div className="max-w-4xl mx-auto px-6 text-center relative">
        <motion.div initial="hidden" animate="visible" variants={stagger}>
          {/* Badge */}
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5 mb-6">
            <span className="text-xs">✨</span>
            <span className="text-xs font-semibold text-indigo-600">AI-Powered Math Learning for Grades 1–8</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight mb-6"
          >
            Where math becomes{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
              an adventure
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={fadeUp}
            className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Personalized AI tutoring, adaptive practice, and a reward system
            that makes every student excited to learn math — while parents see
            real progress.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/signup"
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-8 py-4 rounded-2xl text-base font-bold hover:shadow-xl hover:shadow-indigo-200/50 hover:-translate-y-0.5 transition-all"
            >
              Start Learning Free
            </Link>
            <Link
              href="/features"
              className="w-full sm:w-auto bg-white border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-2xl text-base font-bold hover:border-indigo-300 hover:text-indigo-600 transition-all"
            >
              Explore Features
            </Link>
          </motion.div>

          {/* Hero visual — app preview mockup */}
          <motion.div
            variants={fadeUp}
            className="mt-16 sm:mt-20 relative mx-auto max-w-2xl"
          >
            <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-2 sm:p-3 shadow-2xl shadow-gray-300/50">
              {/* Browser chrome */}
              <div className="flex items-center gap-1.5 px-3 py-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                <div className="flex-1 mx-3 h-5 bg-slate-700 rounded-md" />
              </div>
              {/* Screen content — stylized dashboard preview */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4">
                {/* Mini header */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">A</div>
                  <div>
                    <div className="h-3 w-28 bg-gray-300 rounded-full" />
                    <div className="h-2 w-16 bg-gray-200 rounded-full mt-1.5" />
                  </div>
                  <div className="ml-auto text-2xl">🦉</div>
                </div>
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="bg-white rounded-xl p-2 sm:p-3 text-center shadow-sm">
                    <p className="text-sm sm:text-lg font-bold text-indigo-600">5</p>
                    <p className="text-[9px] sm:text-[10px] text-gray-400 font-medium">LEVEL</p>
                  </div>
                  <div className="bg-white rounded-xl p-2 sm:p-3 text-center shadow-sm">
                    <p className="text-sm sm:text-lg font-bold text-orange-500">7</p>
                    <p className="text-[9px] sm:text-[10px] text-gray-400 font-medium">STREAK</p>
                  </div>
                  <div className="bg-white rounded-xl p-2 sm:p-3 text-center shadow-sm">
                    <p className="text-sm sm:text-lg font-bold text-purple-600">1,240</p>
                    <p className="text-[9px] sm:text-[10px] text-gray-400 font-medium">XP</p>
                  </div>
                </div>
                {/* Continue card */}
                <div className="bg-indigo-600 rounded-xl p-3 sm:p-4 text-white flex items-center gap-3">
                  <span className="text-xl sm:text-2xl">📐</span>
                  <div className="flex-1 min-w-0">
                    <div className="h-3 w-24 bg-white/30 rounded-full" />
                    <div className="h-2 w-16 bg-white/20 rounded-full mt-1.5" />
                  </div>
                  <span className="text-xs font-bold opacity-80">Continue →</span>
                </div>
              </div>
            </div>

            {/* Floating accents around the mockup */}
            <div className="absolute -top-4 -right-4 sm:-top-6 sm:-right-6 text-2xl sm:text-3xl animate-bounce" style={{ animationDuration: "2.5s" }}>⚡</div>
            <div className="absolute -bottom-3 -left-3 sm:-bottom-5 sm:-left-5 text-xl sm:text-2xl animate-bounce" style={{ animationDuration: "3s", animationDelay: "0.5s" }}>🏆</div>
            <div className="absolute top-1/2 -right-2 sm:-right-4 text-lg sm:text-xl animate-bounce" style={{ animationDuration: "2.8s", animationDelay: "1s" }}>✨</div>
          </motion.div>
        </motion.div>
      </div>

      {/* CSS for floating math symbols */}
      <style jsx>{`
        @keyframes mathFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.3; }
          50%      { transform: translateY(-20px) rotate(8deg); opacity: 0.6; }
        }
      `}</style>
    </section>
  );
}

// ─── Stats strip ─────────────────────────────────────────────────────────────

function StatsStrip() {
  return (
    <motion.section
      initial="hidden" whileInView="visible" viewport={VP} variants={stagger}
      className="border-y border-gray-100 bg-gray-50/50 py-8"
    >
      <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
        {[
          { val: "Grades 1–8", label: "Curriculum coverage" },
          { val: "AI-Powered", label: "Personalized learning" },
          { val: "Real-Time", label: "Progress tracking" },
          { val: "100% Free", label: "To get started" },
        ].map((s, i) => (
          <motion.div key={i} variants={fadeUp}>
            <p className="text-lg font-black text-gray-900">{s.val}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

// ─── Features ────────────────────────────────────────────────────────────────

function FeaturesSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={VP} variants={stagger} className="text-center mb-14">
          <motion.p variants={fadeUp} className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-3">
            Everything they need
          </motion.p>
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-black tracking-tight">
            Built for real learning
          </motion.h2>
          <motion.p variants={fadeUp} className="text-gray-500 mt-3 max-w-lg mx-auto">
            Every feature designed with one goal — helping students build genuine
            math confidence.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden" whileInView="visible" viewport={VP} variants={stagger}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className="bg-white border border-gray-100 rounded-2xl p-6 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50 hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                {f.icon}
              </div>
              <h3 className="font-bold text-gray-900 mb-1.5">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── How it works ────────────────────────────────────────────────────────────

function HowItWorks() {
  return (
    <section className="py-20 sm:py-28 bg-gradient-to-b from-gray-50/80 to-white">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={VP} variants={stagger} className="text-center mb-14">
          <motion.p variants={fadeUp} className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-3">
            Simple to start
          </motion.p>
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-black tracking-tight">
            Up and running in minutes
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden" whileInView="visible" viewport={VP} variants={stagger}
          className="grid grid-cols-1 sm:grid-cols-3 gap-8"
        >
          {STEPS.map((s) => (
            <motion.div key={s.num} variants={fadeUp} className="text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-200 mb-5">
                {s.num}
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">{s.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">{s.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Student motivation ──────────────────────────────────────────────────────

function MotivationSection() {
  return (
    <section className="py-20 sm:py-28 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-50/50 rounded-full blur-3xl -z-10" />

      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text side */}
          <motion.div initial="hidden" whileInView="visible" viewport={VP} variants={stagger}>
            <motion.p variants={fadeUp} className="text-sm font-bold text-amber-600 uppercase tracking-wider mb-3">
              Engagement that works
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
              They&apos;ll <em>want</em> to practice
            </motion.h2>
            <motion.p variants={fadeUp} className="text-gray-500 mb-8 leading-relaxed">
              MathAI&apos;s reward system transforms daily practice from a chore into
              something students look forward to. Earn XP, maintain streaks,
              level up, and hatch a pet companion that evolves as they learn.
            </motion.p>

            <motion.div variants={stagger} className="space-y-4">
              {MOTIVATION_ITEMS.map((m, i) => (
                <motion.div key={i} variants={fadeUp} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-xl shrink-0">
                    {m.icon}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{m.label}</p>
                    <p className="text-sm text-gray-500">{m.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Visual side — gamification preview */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={VP} variants={scaleIn}
            className="relative"
          >
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 sm:p-8 border border-amber-100">
              {/* XP celebration mockup */}
              <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-gray-400 uppercase">Session Complete!</span>
                  <span className="text-sm font-black text-emerald-500">+120 XP</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" style={{ width: "72%" }} />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">1,240 / 1,500 XP to Level 6</p>
              </div>
              {/* Pet + streak preview */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
                  <span className="text-4xl block mb-1">🦉</span>
                  <p className="text-xs font-bold text-gray-700">Spark Owl</p>
                  <p className="text-[10px] text-gray-400">Happy • Lvl 3</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
                  <p className="text-3xl font-black text-orange-500">7</p>
                  <p className="text-xs font-bold text-gray-700">Day Streak</p>
                  <div className="flex justify-center gap-0.5 mt-1">
                    {[1,2,3,4,5,6,7].map(d => (
                      <div key={d} className="w-3 h-3 rounded-full bg-orange-400" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Parent section ──────────────────────────────────────────────────────────

function ParentSection() {
  return (
    <section className="py-20 sm:py-28 bg-gradient-to-b from-white to-emerald-50/30">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Visual side — dashboard preview */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={VP} variants={scaleIn}
            className="order-2 lg:order-1"
          >
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-6 sm:p-8 border border-emerald-100">
              <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold">A</div>
                  <div>
                    <p className="font-bold text-sm text-gray-800">Aryan&apos;s Progress</p>
                    <p className="text-xs text-gray-400">Grade 4 · This week</p>
                  </div>
                </div>
                {/* Mini mastery bars */}
                {[
                  { topic: "Addition & Subtraction", pct: 92, color: "bg-emerald-500" },
                  { topic: "Multiplication", pct: 68, color: "bg-indigo-500" },
                  { topic: "Fractions", pct: 35, color: "bg-amber-500" },
                ].map((t) => (
                  <div key={t.topic} className="mb-2.5 last:mb-0">
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-gray-600 font-medium">{t.topic}</span>
                      <span className="text-gray-400 font-semibold">{t.pct}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${t.color} rounded-full`} style={{ width: `${t.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-xs font-bold text-emerald-600 mb-1">💡 AI Insight</p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Aryan is improving quickly in fractions this week. Consider
                  reviewing word problems to solidify understanding.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Text side */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={VP} variants={stagger}
            className="order-1 lg:order-2"
          >
            <motion.p variants={fadeUp} className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-3">
              For parents
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
              Know exactly how they&apos;re doing
            </motion.h2>
            <motion.p variants={fadeUp} className="text-gray-500 mb-8 leading-relaxed">
              No more wondering if your child really understands what they&apos;re
              learning. MathAI gives you clear, actionable intelligence — not
              just grades.
            </motion.p>

            <motion.div variants={stagger} className="space-y-5">
              {PARENT_ITEMS.map((p, i) => (
                <motion.div key={i} variants={fadeUp} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-xl shrink-0">
                    {p.icon}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{p.title}</p>
                    <p className="text-sm text-gray-500 leading-relaxed">{p.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── CTA ─────────────────────────────────────────────────────────────────────

function CTASection() {
  return (
    <section className="py-20 sm:py-28">
      <motion.div
        initial="hidden" whileInView="visible" viewport={VP} variants={scaleIn}
        className="max-w-4xl mx-auto px-6"
      >
        <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-3xl p-10 sm:p-16 text-center text-white relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />

          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              Ready to start the adventure?
            </h2>
            <p className="text-indigo-200 max-w-lg mx-auto mb-8">
              Join thousands of students building real math confidence with
              AI-powered practice, rewards, and personalized learning paths.
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
  );
}


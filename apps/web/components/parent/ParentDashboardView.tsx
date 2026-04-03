"use client";

/**
 * @module components/parent/ParentDashboardView
 *
 * Parent portal dashboard — premium, calm, actionable intelligence.
 *
 * Sections:
 *   1. Header (name, grade, learning score ring, learning status, confidence)
 *   2. Summary cards (activity, streak, mastery, accuracy)
 *   3. Learning Personality
 *   4. AI Insights with action hints
 *   5. Next Focus recommendation
 *   6. Clustered Mastery Map
 *   7. Recent Highlights
 *   8. Score Breakdown
 */

import type {
  ParentDashboardData,
  TopicMasteryItem,
  LearningStatus,
} from "@/types/parent";

// ─── Config maps ─────────────────────────────────────────────────────────────

const MASTERY_STATUS: Record<string, { label: string; bg: string; text: string }> = {
  not_started:    { label: "Not Started",    bg: "bg-slate-100",   text: "text-slate-500" },
  learning:       { label: "Learning",       bg: "bg-indigo-100",  text: "text-indigo-600" },
  struggling:     { label: "Needs Support",  bg: "bg-amber-100",   text: "text-amber-700" },
  improving:      { label: "Improving",      bg: "bg-emerald-100", text: "text-emerald-700" },
  mastered:       { label: "Mastered",       bg: "bg-green-100",   text: "text-green-700" },
  needs_revision: { label: "Needs Revision", bg: "bg-orange-100",  text: "text-orange-700" },
};

const STATUS_CONFIG: Record<LearningStatus, { label: string; color: string; bg: string; ring: string }> = {
  excellent:       { label: "Excellent",       color: "text-emerald-600", bg: "bg-emerald-50", ring: "#10b981" },
  on_track:        { label: "On Track",        color: "text-indigo-600",  bg: "bg-indigo-50",  ring: "#6366f1" },
  needs_attention: { label: "Needs Attention", color: "text-amber-600",   bg: "bg-amber-50",   ring: "#f59e0b" },
};

const CONFIDENCE_CONFIG = {
  rising:        { label: "Rising",        icon: "📈", color: "text-emerald-600", bg: "bg-emerald-50" },
  stable:        { label: "Stable",        icon: "➡️", color: "text-slate-600",   bg: "bg-slate-50" },
  needs_support: { label: "Needs Support", icon: "💛", color: "text-amber-600",   bg: "bg-amber-50" },
};

const SUPPORT_CONFIG = {
  low:      { label: "On Track",        color: "text-emerald-600", bg: "bg-emerald-50", icon: "✅" },
  moderate: { label: "Some Support",    color: "text-amber-600",   bg: "bg-amber-50",   icon: "📋" },
  high:     { label: "Needs Attention", color: "text-rose-600",    bg: "bg-rose-50",     icon: "🤝" },
};

const INSIGHT_CONFIG: Record<string, { border: string; bg: string }> = {
  strength:    { border: "border-emerald-200", bg: "bg-emerald-50" },
  improvement: { border: "border-indigo-200",  bg: "bg-indigo-50" },
  attention:   { border: "border-amber-200",   bg: "bg-amber-50" },
  suggestion:  { border: "border-blue-200",    bg: "bg-blue-50" },
  celebration: { border: "border-purple-200",  bg: "bg-purple-50" },
};

const BAR_COLORS: Record<string, string> = {
  mastered:       "bg-green-500",
  improving:      "bg-emerald-400",
  learning:       "bg-indigo-400",
  struggling:     "bg-amber-400",
  needs_revision: "bg-orange-400",
};

// ─── Mastery Topic Row (shared sub-component) ────────────────────────────────

function TopicRow({ topic }: { topic: TopicMasteryItem }) {
  const st = MASTERY_STATUS[topic.status] ?? MASTERY_STATUS["learning"]!;
  return (
    <div className="flex items-center gap-4 px-5 py-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-semibold text-gray-700 truncate">{topic.topicName}</p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.bg} ${st.text} shrink-0`}>
            {st.label}
          </span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${BAR_COLORS[topic.status] ?? "bg-indigo-400"}`}
            style={{ width: `${topic.masteryPct}%` }}
          />
        </div>
      </div>
      <div className="text-right shrink-0 w-16">
        <p className="text-sm font-bold text-gray-700">{topic.accuracyPct}%</p>
        <p className="text-[10px] text-slate-400">accuracy</p>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface Props {
  data: ParentDashboardData;
}

export default function ParentDashboardView({ data }: Props) {
  const statusCfg = STATUS_CONFIG[data.learningStatus];
  const conf      = CONFIDENCE_CONFIG[data.confidenceSignal];
  const support   = SUPPORT_CONFIG[data.supportNeed];
  const clusters  = data.masteryClusters;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">

      {/* Back to child picker (useful when parent has multiple children) */}
      <a href="/parent" className="text-xs text-gray-400 hover:text-indigo-500 transition font-medium">
        &larr; All children
      </a>

      {/* ── 1. Header ──────────────────────────────────────────────── */}
      <header className="flex items-center gap-6 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 -mt-4">
        {/* Learning Score Ring */}
        <div className="relative w-20 h-20 shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="3" />
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={statusCfg.ring} strokeWidth="3" strokeDasharray={`${data.learningScore.overall}, 100`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-xl font-black ${statusCfg.color}`}>{data.learningScore.overall}</span>
            <span className="text-[9px] text-slate-400 font-semibold">SCORE</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-black text-gray-800 truncate">
            {data.childName}&apos;s Learning
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{data.childGrade}</p>
        </div>

        {/* Status badges */}
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <div className={`px-3 py-1.5 rounded-xl text-xs font-bold ${statusCfg.bg} ${statusCfg.color}`}>
            {statusCfg.label}
          </div>
          <div className={`px-3 py-1.5 rounded-xl text-xs font-bold ${conf.bg} ${conf.color}`}>
            {conf.icon} {conf.label}
          </div>
          <div className={`px-3 py-1.5 rounded-xl text-xs font-bold ${support.bg} ${support.color}`}>
            {support.icon} {support.label}
          </div>
        </div>
      </header>

      {/* Confidence explanation */}
      {data.confidenceExplanation && (
        <p className="text-sm text-slate-500 -mt-4 px-2 italic">{data.confidenceExplanation}</p>
      )}

      {/* ── 2. Summary Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Today</p>
          <p className="text-2xl font-black text-gray-800">{data.todayActivity.questionsAnswered}</p>
          <p className="text-xs text-slate-500">questions answered</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Streak</p>
          <p className="text-2xl font-black text-orange-500">🔥 {data.streak.current}</p>
          <p className="text-xs text-slate-500">day{data.streak.current !== 1 ? "s" : ""} in a row</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Mastery</p>
          <p className="text-2xl font-black text-indigo-600">{data.learningScore.mastery}%</p>
          <p className="text-xs text-slate-500">avg across topics</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Accuracy</p>
          <p className="text-2xl font-black text-emerald-600">{data.learningScore.accuracy}%</p>
          <p className="text-xs text-slate-500">answer accuracy</p>
        </div>
      </div>

      {/* ── 3. Learning Personality ────────────────────────────────── */}
      {data.learningPersonality.length > 0 && (
        <section>
          <h2 className="text-lg font-black text-gray-800 mb-3">Learning Style 🧩</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.learningPersonality.map((trait, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-start gap-3">
                <span className="text-2xl shrink-0">{trait.icon}</span>
                <div>
                  <p className="text-sm font-bold text-gray-800">{trait.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{trait.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 4. AI Insights with Action Hints ──────────────────────── */}
      {data.insights.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-black text-gray-800">Learning Insights 🧠</h2>
            <p className="text-[10px] text-slate-400 font-medium">{data.insightBasis}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.insights.map((insight) => {
              const style = INSIGHT_CONFIG[insight.type] ?? INSIGHT_CONFIG["suggestion"]!;
              return (
                <div key={insight.id} className={`rounded-2xl border ${style.border} ${style.bg} p-4`}>
                  <div className="flex items-start gap-3">
                    <span className="text-xl shrink-0">{insight.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 leading-relaxed font-medium">
                        {insight.message}
                      </p>
                      {insight.actionHint && (
                        <p className="text-xs text-slate-500 mt-2 flex items-start gap-1.5">
                          <span className="shrink-0 font-bold text-indigo-400">TIP</span>
                          {insight.actionHint}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 5. Next Focus / Recommendation ─────────────────────────── */}
      {data.nextRecommendation && (
        <section>
          <h2 className="text-lg font-black text-gray-800 mb-3">MathAI Recommends Next 🎯</h2>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-indigo-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl text-white shadow-md shrink-0">📚</div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-gray-800 text-base">{data.nextRecommendation.topicName}</p>
                <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{data.nextRecommendation.reason}</p>
                <span className="inline-block mt-2 text-xs font-bold text-indigo-500 bg-indigo-50 px-2.5 py-0.5 rounded-full capitalize">
                  {data.nextRecommendation.actionType.replace(/_/g, " ")}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 6. Clustered Mastery Map ───────────────────────────────── */}
      <section>
        <h2 className="text-lg font-black text-gray-800 mb-3">Concept Mastery 📊</h2>
        <div className="space-y-4">

          {/* Weak areas */}
          {clusters.weakAreas.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-amber-200 overflow-hidden">
              <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-widest">Needs Attention</p>
              </div>
              <div className="divide-y divide-slate-100">
                {clusters.weakAreas.map((t) => <TopicRow key={t.topicId} topic={t} />)}
              </div>
            </div>
          )}

          {/* Improving */}
          {clusters.improving.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-indigo-200 overflow-hidden">
              <div className="px-5 py-2.5 bg-indigo-50 border-b border-indigo-200">
                <p className="text-xs font-bold text-indigo-700 uppercase tracking-widest">Improving</p>
              </div>
              <div className="divide-y divide-slate-100">
                {clusters.improving.map((t) => <TopicRow key={t.topicId} topic={t} />)}
              </div>
            </div>
          )}

          {/* Strong */}
          {clusters.strong.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-green-200 overflow-hidden">
              <div className="px-5 py-2.5 bg-green-50 border-b border-green-200">
                <p className="text-xs font-bold text-green-700 uppercase tracking-widest">Strong Areas</p>
              </div>
              <div className="divide-y divide-slate-100">
                {clusters.strong.map((t) => <TopicRow key={t.topicId} topic={t} />)}
              </div>
            </div>
          )}

          {/* Revision due */}
          {clusters.revisionDue.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-orange-200 overflow-hidden">
              <div className="px-5 py-2.5 bg-orange-50 border-b border-orange-200">
                <p className="text-xs font-bold text-orange-700 uppercase tracking-widest">Revision Due</p>
              </div>
              <div className="divide-y divide-slate-100">
                {clusters.revisionDue.map((t) => <TopicRow key={t.topicId} topic={t} />)}
              </div>
            </div>
          )}

          {clusters.notStarted > 0 && (
            <p className="text-xs text-slate-400 font-medium px-2">
              + {clusters.notStarted} topic{clusters.notStarted !== 1 ? "s" : ""} not started yet
            </p>
          )}
        </div>
      </section>

      {/* ── 7. Recent Highlights ───────────────────────────────────── */}
      {data.recentHighlights.length > 0 && (
        <section>
          <h2 className="text-lg font-black text-gray-800 mb-3">Recent Milestones 🌟</h2>
          <div className="space-y-2">
            {data.recentHighlights.map((h, i) => (
              <div key={i} className="flex items-center gap-3 bg-white rounded-2xl px-5 py-3 shadow-sm border border-slate-100">
                <span className="text-xl shrink-0">{h.icon}</span>
                <p className="text-sm text-gray-700 font-medium flex-1">{h.message}</p>
                <p className="text-xs text-slate-400 shrink-0">
                  {new Date(h.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Ask MathAI for Parents ──────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-black text-gray-800 mb-3">Ask MathAI 🤖</h2>
        <a
          href="/parent/ask"
          className="block bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 text-white hover:opacity-95 transition"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center text-2xl shrink-0">
              🤖
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">Ask MathAI for Parents</p>
              <p className="text-indigo-200 text-xs mt-0.5">
                Get help explaining concepts, understanding your child&apos;s progress, or finding the right approach.
              </p>
            </div>
            <span className="text-sm font-bold shrink-0">Ask →</span>
          </div>
        </a>
      </section>

      {/* ── 8. Score Breakdown ─────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-black text-gray-800 mb-3">Learning Score Breakdown</h2>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 grid grid-cols-5 gap-4 text-center">
          {[
            { label: "Mastery",     value: data.learningScore.mastery,     color: "text-indigo-600" },
            { label: "Consistency", value: data.learningScore.consistency, color: "text-orange-500" },
            { label: "Effort",      value: data.learningScore.effort,      color: "text-purple-600" },
            { label: "Accuracy",    value: data.learningScore.accuracy,    color: "text-emerald-600" },
            { label: "Improvement", value: data.learningScore.improvement, color: "text-blue-600" },
          ].map((item) => (
            <div key={item.label}>
              <p className={`text-xl font-black ${item.color}`}>{item.value}</p>
              <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}

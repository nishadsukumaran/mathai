"use client";

/**
 * @module components/parent/ParentDashboardView
 *
 * Parent portal — intelligent, action-oriented, supportive.
 *
 * Sections:
 *   1. Hero (child name, score ring, status badges)
 *   2. This Week summary
 *   3. Biggest Win callout
 *   4. Needs Attention (top issues)
 *   5. Concept Mastery Map (clustered)
 *   6. How Your Child Learns (personality)
 *   7. Recommended Next Steps (multi-action)
 *   8. Learning Insights
 *   9. Recent Milestones
 *   10. Score Breakdown + Ask MathAI
 */

import Link from "next/link";
import type {
  ParentDashboardData,
  TopicMasteryItem,
  LearningStatus,
  NextStep,
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
  rising:        { label: "Confidence Rising",  icon: "📈", color: "text-emerald-600", bg: "bg-emerald-50" },
  stable:        { label: "Confidence Stable",  icon: "➡️", color: "text-slate-600",   bg: "bg-slate-50" },
  needs_support: { label: "Needs Encouragement", icon: "💛", color: "text-amber-600",   bg: "bg-amber-50" },
};

const SUPPORT_CONFIG = {
  low:      { label: "Independent",     color: "text-emerald-600", bg: "bg-emerald-50" },
  moderate: { label: "Some Support",    color: "text-amber-600",   bg: "bg-amber-50" },
  high:     { label: "Needs Attention", color: "text-rose-600",    bg: "bg-rose-50" },
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

const ACTION_CONFIG: Record<string, { icon: string; label: string }> = {
  practice: { icon: "📝", label: "Start Practice" },
  revision: { icon: "🔄", label: "Quick Revision" },
  explore:  { icon: "🔍", label: "Explore" },
};

// ─── Sub-components ──────────────────────────────────────────────────────────

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

function ClusterSection({
  title, headerBg, headerBorder, headerText, topics,
}: {
  title: string; headerBg: string; headerBorder: string; headerText: string;
  topics: TopicMasteryItem[];
}) {
  if (topics.length === 0) return null;
  return (
    <div className={`bg-white rounded-2xl shadow-sm border ${headerBorder} overflow-hidden`}>
      <div className={`px-5 py-2.5 ${headerBg} border-b ${headerBorder}`}>
        <p className={`text-xs font-bold ${headerText} uppercase tracking-widest`}>{title}</p>
      </div>
      <div className="divide-y divide-slate-100">
        {topics.map((t) => <TopicRow key={t.topicId} topic={t} />)}
      </div>
    </div>
  );
}

function StepCard({ step, childId }: { step: NextStep; childId: string }) {
  const action = ACTION_CONFIG[step.actionType] ?? ACTION_CONFIG["practice"]!;
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-start gap-3">
      <span className="text-xl shrink-0 mt-0.5">{action.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-800">{step.topicName}</p>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{step.reason}</p>
      </div>
      <Link
        href={`/practice?childId=${childId}&topic=${encodeURIComponent(step.topicName)}`}
        className="shrink-0 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl hover:bg-indigo-100 transition"
      >
        {action.label}
      </Link>
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
  const childId   = data.childId ?? "";

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">

      {/* ── 1. Hero ─────────────────────────────────────────────────── */}
      <header className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100">
        <div className="flex items-center gap-5">
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
            <h1 className="text-xl sm:text-2xl font-black text-gray-800 truncate">
              {data.childName}&apos;s Learning
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">{data.childGrade}</p>
            {data.confidenceExplanation && (
              <p className="text-xs text-slate-500 mt-1.5 italic leading-relaxed">{data.confidenceExplanation}</p>
            )}
          </div>

          {/* Open child portal */}
          <Link
            href={`/dashboard`}
            className="hidden sm:flex items-center gap-2 bg-indigo-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition shrink-0"
          >
            Open Portal →
          </Link>
        </div>

        {/* Status badges */}
        <div className="flex flex-wrap gap-2 mt-4">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusCfg.bg} ${statusCfg.color}`}>
            {statusCfg.label}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${conf.bg} ${conf.color}`}>
            {conf.icon} {conf.label}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${support.bg} ${support.color}`}>
            {support.label}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-600">
            🔥 {data.streak.current} day{data.streak.current !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Mobile portal link */}
        <Link
          href={`/dashboard`}
          className="sm:hidden flex items-center justify-center gap-2 mt-4 bg-indigo-600 text-white font-bold text-sm px-4 py-3 rounded-xl hover:bg-indigo-700 transition w-full"
        >
          Open {data.childName}&apos;s Portal →
        </Link>
      </header>

      {/* ── 2. This Week Summary ────────────────────────────────────── */}
      <section>
        <h2 className="text-base font-black text-gray-800 mb-3">This Week</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <SummaryCard label="Questions" value={String(data.thisWeek?.questionsAnswered ?? 0)} sub="answered" />
          <SummaryCard label="Sessions" value={String(data.thisWeek?.sessionsCompleted ?? 0)} sub="completed" />
          <SummaryCard label="Topics" value={String(data.thisWeek?.topicsPracticed ?? 0)} sub="practised" />
          <SummaryCard label="Active" value={`${data.thisWeek?.daysActive ?? 0}/7`} sub="days" />
          <SummaryCard label="Accuracy" value={`${data.learningScore.accuracy}%`} sub="average" accent />
        </div>
      </section>

      {/* ── 3. Biggest Win ──────────────────────────────────────────── */}
      {data.biggestWin && (
        <section className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-200">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">Biggest Win This Week</p>
          <div className="flex items-start gap-3">
            <span className="text-3xl shrink-0">{data.biggestWin.icon}</span>
            <div>
              <p className="text-base font-black text-gray-800">{data.biggestWin.title}</p>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">{data.biggestWin.detail}</p>
            </div>
          </div>
        </section>
      )}

      {/* ── 4. Needs Attention ──────────────────────────────────────── */}
      {(clusters.weakAreas.length > 0 || data.supportNeed === "high") && (
        <section>
          <h2 className="text-base font-black text-gray-800 mb-3">Needs Attention</h2>
          <div className="space-y-3">
            {clusters.weakAreas.slice(0, 2).map((topic) => {
              const st = MASTERY_STATUS[topic.status] ?? MASTERY_STATUS["struggling"]!;
              return (
                <div key={topic.topicId} className="bg-white rounded-2xl p-4 shadow-sm border border-amber-200 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-lg shrink-0">📌</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800">{topic.topicName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>{st.label}</span>
                      <span className="text-xs text-slate-400">{topic.masteryPct}% mastery · {topic.accuracyPct}% accuracy</span>
                    </div>
                  </div>
                  <Link
                    href={`/practice?childId=${childId}&topic=${encodeURIComponent(topic.topicName)}`}
                    className="shrink-0 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl hover:bg-amber-100 transition border border-amber-200"
                  >
                    Practice
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 5. Concept Mastery Map ──────────────────────────────────── */}
      <section>
        <h2 className="text-base font-black text-gray-800 mb-3">Concept Mastery</h2>
        <div className="space-y-4">
          <ClusterSection title="Strong Areas" headerBg="bg-green-50" headerBorder="border-green-200" headerText="text-green-700" topics={clusters.strong} />
          <ClusterSection title="Improving" headerBg="bg-indigo-50" headerBorder="border-indigo-200" headerText="text-indigo-700" topics={clusters.improving} />
          <ClusterSection title="Needs Support" headerBg="bg-amber-50" headerBorder="border-amber-200" headerText="text-amber-700" topics={clusters.weakAreas} />
          <ClusterSection title="Revision Due" headerBg="bg-orange-50" headerBorder="border-orange-200" headerText="text-orange-700" topics={clusters.revisionDue} />
          {clusters.notStarted > 0 && (
            <p className="text-xs text-slate-400 font-medium px-1">
              + {clusters.notStarted} topic{clusters.notStarted !== 1 ? "s" : ""} not started yet
            </p>
          )}
        </div>
      </section>

      {/* ── 6. How Your Child Learns ────────────────────────────────── */}
      {data.learningPersonality.length > 0 && (
        <section>
          <h2 className="text-base font-black text-gray-800 mb-3">How {data.childName} Learns</h2>
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

      {/* ── 7. Recommended Next Steps ───────────────────────────────── */}
      {((data.nextSteps ?? []).length > 0 || data.nextRecommendation) && (
        <section>
          <h2 className="text-base font-black text-gray-800 mb-3">Recommended Next Steps</h2>
          <div className="space-y-3">
            {(data.nextSteps ?? []).map((step, i) => (
              <StepCard key={i} step={step} childId={childId} />
            ))}
            {(data.nextSteps ?? []).length === 0 && data.nextRecommendation && (
              <StepCard
                step={{
                  topicName:  data.nextRecommendation.topicName,
                  reason:     data.nextRecommendation.reason,
                  actionType: data.nextRecommendation.actionType,
                  priority:   1,
                }}
                childId={childId}
              />
            )}
          </div>
        </section>
      )}

      {/* ── 8. Learning Insights ─────────────────────────────────────── */}
      {data.insights.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-black text-gray-800">Insights</h2>
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
                      <p className="text-sm text-gray-700 leading-relaxed font-medium">{insight.message}</p>
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

      {/* ── 9. Recent Milestones ──────────────────────────────────────── */}
      {data.recentHighlights.length > 0 && (
        <section>
          <h2 className="text-base font-black text-gray-800 mb-3">Recent Milestones</h2>
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

      {/* ── 10. Score Breakdown + Actions ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Score breakdown */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Learning Score Breakdown</h2>
          <div className="space-y-3">
            {[
              { label: "Mastery",     value: data.learningScore.mastery,     color: "bg-indigo-500" },
              { label: "Accuracy",    value: data.learningScore.accuracy,    color: "bg-emerald-500" },
              { label: "Consistency", value: data.learningScore.consistency, color: "bg-orange-400" },
              { label: "Effort",      value: data.learningScore.effort,      color: "bg-purple-500" },
              { label: "Improvement", value: data.learningScore.improvement, color: "bg-blue-500" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-semibold w-20">{item.label}</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.value}%` }} />
                </div>
                <span className="text-xs font-bold text-gray-700 w-8 text-right">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ask MathAI */}
        <div className="flex flex-col gap-4">
          <Link
            href="/parent/ask"
            className="flex-1 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-5 text-white hover:opacity-95 transition flex items-center gap-4"
          >
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center text-2xl shrink-0">🤖</div>
            <div className="flex-1">
              <p className="font-bold text-sm">Ask MathAI</p>
              <p className="text-indigo-200 text-xs mt-0.5">Get help explaining concepts or understanding progress.</p>
            </div>
            <span className="text-sm font-bold shrink-0">→</span>
          </Link>

          {/* Quick action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              href={`/practice?childId=${childId}`}
              className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center hover:border-indigo-200 transition"
            >
              <span className="text-xl block mb-1">📝</span>
              <p className="text-xs font-bold text-gray-700">Start Practice</p>
            </Link>
            <Link
              href="/parent"
              className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center hover:border-indigo-200 transition"
            >
              <span className="text-xl block mb-1">👨‍👩‍👧‍👦</span>
              <p className="text-xs font-bold text-gray-700">Switch Child</p>
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}

// ─── Small helpers ──────────────────────────────────────────────────────────

function SummaryCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-100">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-xl sm:text-2xl font-black ${accent ? "text-emerald-600" : "text-gray-800"}`}>{value}</p>
      <p className="text-[10px] text-slate-400">{sub}</p>
    </div>
  );
}

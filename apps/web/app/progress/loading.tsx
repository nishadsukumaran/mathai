export default function ProgressLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 sm:p-8 animate-pulse">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded-lg" />

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 h-24" />
          ))}
        </div>

        {/* Mastery ring + topic list */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 h-48" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 h-16" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 sm:p-8 animate-pulse">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-slate-200" />
          <div className="space-y-2">
            <div className="h-6 w-40 bg-slate-200 rounded-lg" />
            <div className="h-4 w-24 bg-slate-200 rounded-lg" />
          </div>
        </div>

        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 h-24" />
          ))}
        </div>

        {/* Content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 h-64" />
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 h-64" />
        </div>
      </div>
    </div>
  );
}

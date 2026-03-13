export default function LeaderboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 sm:p-8 animate-pulse">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded-lg" />

        {/* Leaderboard rows */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 divide-y divide-slate-100">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <div className="w-8 h-8 rounded-full bg-slate-200" />
              <div className="w-10 h-10 rounded-full bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-slate-200 rounded-lg" />
                <div className="h-3 w-20 bg-slate-200 rounded-lg" />
              </div>
              <div className="h-6 w-16 bg-slate-200 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

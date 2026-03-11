/**
 * @module components/admin/AdminDashboardView
 *
 * Renders platform stats on the admin dashboard.
 */

interface Stats {
  totalUsers:       number;
  activeUsers:      number;
  disabledUsers:    number;
  newUsersToday:    number;
  newUsersThisWeek: number;
  byRole:  { role: string;  count: number }[];
  byGrade: { grade: string; count: number }[];
}

interface Props {
  stats: Stats | null;
}

export default function AdminDashboardView({ stats }: Props) {
  if (!stats) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <p className="text-red-500 font-semibold">
          Could not load dashboard stats — API may be unavailable.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      <h1 className="text-2xl font-black text-gray-900">Platform Overview</h1>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Total Users"      value={stats.totalUsers} />
        <StatCard label="Active"           value={stats.activeUsers}      color="text-green-600" />
        <StatCard label="Disabled"         value={stats.disabledUsers}    color="text-red-500" />
        <StatCard label="New Today"        value={stats.newUsersToday}    color="text-indigo-600" />
        <StatCard label="New This Week"    value={stats.newUsersThisWeek} color="text-indigo-600" />
      </div>

      {/* Role breakdown */}
      <Section title="Users by Role">
        <div className="flex flex-wrap gap-3">
          {stats.byRole.map(r => (
            <div key={r.role} className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2">
              <span className="text-sm font-semibold text-gray-500 capitalize">{r.role}</span>
              <span className="text-lg font-black text-gray-800">{r.count}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Grade breakdown */}
      {stats.byGrade.length > 0 && (
        <Section title="Students by Grade">
          <div className="flex flex-wrap gap-3">
            {stats.byGrade
              .sort((a, b) => a.grade.localeCompare(b.grade))
              .map(g => (
                <div key={g.grade} className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2">
                  <span className="text-sm font-semibold text-gray-500">{g.grade}</span>
                  <span className="text-lg font-black text-gray-800">{g.count}</span>
                </div>
              ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function StatCard({
  label, value, color = "text-gray-900",
}: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 space-y-1">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-3xl font-black ${color}`}>{value.toLocaleString()}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">{title}</h2>
      {children}
    </div>
  );
}

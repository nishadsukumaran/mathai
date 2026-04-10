/**
 * @module components/admin/AdminDashboardView
 *
 * Professional platform operations console.
 * Data-dense, readable, enterprise-quality layout.
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

interface Props { stats: Stats | null; }

const ROLE_COLORS: Record<string, string> = {
  student: "#818cf8", parent: "#34d399", admin: "#f87171", teacher: "#fbbf24",
};
const ROLE_BADGE: Record<string, { bg: string; text: string }> = {
  student: { bg: "bg-indigo-50",  text: "text-indigo-700" },
  parent:  { bg: "bg-emerald-50", text: "text-emerald-700" },
  admin:   { bg: "bg-red-50",     text: "text-red-700" },
  teacher: { bg: "bg-amber-50",   text: "text-amber-700" },
};

export default function AdminDashboardView({ stats }: Props) {
  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-red-500 font-semibold text-sm">Could not load dashboard stats — check API connection.</p>
      </div>
    );
  }

  const activeRate = stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-gray-900">Platform Overview</h1>
        <p className="text-xs text-gray-400 mt-0.5">Real-time platform health and user metrics</p>
      </div>

      {/* Primary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Metric label="Total Users" value={stats.totalUsers} />
        <Metric label="Active" value={stats.activeUsers} accent="text-emerald-600" />
        <Metric label="Active Rate" value={`${activeRate}%`} accent="text-emerald-600" />
        <Metric label="Disabled" value={stats.disabledUsers} accent={stats.disabledUsers > 0 ? "text-red-500" : "text-gray-400"} />
        <Metric label="New Today" value={stats.newUsersToday} accent="text-indigo-600" />
        <Metric label="This Week" value={stats.newUsersThisWeek} accent="text-indigo-600" />
      </div>

      {/* Two-column: roles + grades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Roles */}
        <Card title="Users by Role">
          <div className="space-y-2.5">
            {stats.byRole.map((r) => {
              const pct = stats.totalUsers > 0 ? Math.round((r.count / stats.totalUsers) * 100) : 0;
              const badge = ROLE_BADGE[r.role] ?? { bg: "bg-gray-50", text: "text-gray-700" };
              return (
                <div key={r.role} className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize w-16 text-center ${badge.bg} ${badge.text}`}>
                    {r.role}
                  </span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: ROLE_COLORS[r.role] ?? "#9ca3af" }} />
                  </div>
                  <span className="text-sm font-bold text-gray-800 w-10 text-right">{r.count}</span>
                  <span className="text-[10px] text-gray-400 w-8">{pct}%</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Grades */}
        <Card title="Students by Grade">
          {stats.byGrade.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {stats.byGrade.sort((a, b) => a.grade.localeCompare(b.grade)).map((g) => (
                <div key={g.grade} className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-gray-800">{g.count}</p>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">{g.grade}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-6">No grade data</p>
          )}
        </Card>
      </div>

      {/* Three-column: actions, health, growth */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Quick actions */}
        <Card title="Quick Actions">
          <div className="space-y-1">
            <ActionLink href="/admin/users" icon="👥" label="Manage Users" desc="Search, filter, edit" />
            <ActionLink href="/admin/users?role=parent" icon="👨‍👩‍👧" label="Parent Accounts" desc="View linked families" />
            <ActionLink href="/admin/users?isActive=false" icon="🚫" label="Disabled Accounts" desc={`${stats.disabledUsers} disabled`} />
            <ActionLink href="/admin/users?role=student" icon="🎓" label="All Students" desc="View student roster" />
            <ActionLink href="/admin/voice" icon="🔊" label="Voice Settings" desc="TTS engine & AI voice" />
          </div>
        </Card>

        {/* Health */}
        <Card title="Platform Health">
          <div className="space-y-3">
            <Health label="Active rate" value={`${activeRate}%`} ok={activeRate >= 70} />
            <Health label="Signups today" value={String(stats.newUsersToday)} ok={stats.newUsersToday > 0} />
            <Health label="Signups this week" value={String(stats.newUsersThisWeek)} ok={stats.newUsersThisWeek > 0} />
            <Health label="Disabled accounts" value={String(stats.disabledUsers)} ok={stats.disabledUsers === 0} />
          </div>
        </Card>

        {/* Growth */}
        <Card title="Growth">
          <div className="space-y-3">
            <div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400">Total registered</p>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-lg font-bold text-indigo-600">{stats.newUsersToday}</p>
                <p className="text-[10px] text-gray-400">Today</p>
              </div>
              <div>
                <p className="text-lg font-bold text-indigo-600">{stats.newUsersThisWeek}</p>
                <p className="text-[10px] text-gray-400">This week</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Metric({ label, value, accent = "text-gray-900" }: { label: string; value: number | string; accent?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-0.5 ${accent}`}>{typeof value === "number" ? value.toLocaleString() : value}</p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h2 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">{title}</h2>
      {children}
    </div>
  );
}

function ActionLink({ href, icon, label, desc }: { href: string; icon: string; label: string; desc: string }) {
  return (
    <a href={href} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition">
      <span className="text-sm">{icon}</span>
      <div>
        <p className="text-xs font-semibold text-gray-700">{label}</p>
        <p className="text-[10px] text-gray-400">{desc}</p>
      </div>
    </a>
  );
}

function Health({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${ok ? "bg-emerald-500" : "bg-amber-500"}`} />
        <span className="text-xs text-gray-600">{label}</span>
      </div>
      <span className="text-xs font-bold text-gray-800">{value}</span>
    </div>
  );
}

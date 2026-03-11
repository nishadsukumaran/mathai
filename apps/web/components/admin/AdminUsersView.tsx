/**
 * @module components/admin/AdminUsersView
 *
 * User management list with search, filter, pagination, and per-row actions.
 * "use client" — handles form submission and search state client-side.
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter }               from "next/navigation";
import Link                        from "next/link";

interface UserRow {
  id:             string;
  name:           string;
  email:          string;
  role:           string;
  gradeLevel:     string | null;
  isActive:       boolean;
  createdAt:      string;
  lastLoginAt:    string | null;
  disabledAt:     string | null;
  disabledReason: string | null;
  _count: { practiceSessions: number };
}

interface Props {
  users:       UserRow[];
  total:       number;
  currentPage: number;
  totalPages:  number;
  filters: {
    search:   string;
    role:     string;
    isActive: string;
  };
}

export default function AdminUsersView({ users, total, currentPage, totalPages, filters }: Props) {
  const router        = useRouter();
  const [, startTr]  = useTransition();

  const [search,   setSearch]   = useState(filters.search);
  const [role,     setRole]     = useState(filters.role);
  const [isActive, setIsActive] = useState(filters.isActive);

  function applyFilters(page = 1) {
    const qs = new URLSearchParams();
    if (search)   qs.set("search",   search);
    if (role)     qs.set("role",     role);
    if (isActive) qs.set("isActive", isActive);
    qs.set("page", String(page));
    startTr(() => router.push(`/admin/users?${qs.toString()}`));
  }

  function goPage(p: number) { applyFilters(p); }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total.toLocaleString()} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-48">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Search</label>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && applyFilters()}
            placeholder="Name or email…"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 transition"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Role</label>
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 transition"
          >
            <option value="">All roles</option>
            <option value="student">Student</option>
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="parent">Parent</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
          <select
            value={isActive}
            onChange={e => setIsActive(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 transition"
          >
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Disabled</option>
          </select>
        </div>
        <button
          onClick={() => applyFilters()}
          className="bg-indigo-600 text-white font-bold px-5 py-2 rounded-xl text-sm hover:bg-indigo-700 transition"
        >
          Search
        </button>
        <button
          onClick={() => { setSearch(""); setRole(""); setIsActive(""); startTr(() => router.push("/admin/users")); }}
          className="text-gray-500 hover:text-gray-700 font-semibold text-sm px-3 py-2 rounded-xl border border-gray-200 hover:border-gray-300 transition"
        >
          Reset
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">User</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Role</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Grade</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Sessions</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Joined</th>
              <th className="text-right px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400 font-semibold">
                  No users found
                </td>
              </tr>
            )}
            {users.map(u => (
              <UserRow key={u.id} user={u} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <PageBtn onClick={() => goPage(currentPage - 1)} disabled={currentPage <= 1}>← Prev</PageBtn>
          <span className="text-sm text-gray-500 font-semibold px-3">
            {currentPage} / {totalPages}
          </span>
          <PageBtn onClick={() => goPage(currentPage + 1)} disabled={currentPage >= totalPages}>Next →</PageBtn>
        </div>
      )}
    </div>
  );
}

function UserRow({ user }: { user: UserRow }) {
  return (
    <tr className="hover:bg-gray-50 transition">
      <td className="px-5 py-3">
        <p className="font-semibold text-gray-800">{user.name}</p>
        <p className="text-gray-400 text-xs">{user.email}</p>
      </td>
      <td className="px-4 py-3">
        <RoleBadge role={user.role} />
      </td>
      <td className="px-4 py-3 text-gray-600">
        {user.gradeLevel ?? <span className="text-gray-300">—</span>}
      </td>
      <td className="px-4 py-3">
        {user.isActive
          ? <span className="text-green-600 font-semibold text-xs bg-green-50 px-2 py-0.5 rounded-full">Active</span>
          : <span className="text-red-500 font-semibold text-xs bg-red-50 px-2 py-0.5 rounded-full">Disabled</span>
        }
      </td>
      <td className="px-4 py-3 text-gray-600">
        {user._count.practiceSessions}
      </td>
      <td className="px-4 py-3 text-gray-400 text-xs">
        {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </td>
      <td className="px-5 py-3 text-right">
        <Link
          href={`/admin/users/${user.id}`}
          className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm transition"
        >
          View →
        </Link>
      </td>
    </tr>
  );
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    student: "bg-indigo-50 text-indigo-700",
    admin:   "bg-red-50 text-red-700",
    teacher: "bg-amber-50 text-amber-700",
    parent:  "bg-emerald-50 text-emerald-700",
  };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${styles[role] ?? "bg-gray-100 text-gray-600"}`}>
      {role}
    </span>
  );
}

function PageBtn({ onClick, disabled, children }: { onClick: () => void; disabled: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        "px-4 py-2 rounded-xl text-sm font-semibold border transition",
        disabled
          ? "border-gray-100 text-gray-300 cursor-not-allowed"
          : "border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/**
 * @module components/admin/AdminUserDetailView
 *
 * Admin user detail — edit, enable/disable, reset password.
 * Client component: handles all mutations via clientPost/clientPatch.
 */

"use client";

import { useState }       from "react";
import { useRouter }      from "next/navigation";
import Link               from "next/link";
import { clientPatch, clientPost } from "@/lib/clientApi";

interface StudentProfile {
  totalXp:         number;
  currentLevel:    number;
  streakCount:     number;
  learningPace:    string;
  confidenceLevel: number;
}

interface User {
  id:             string;
  name:           string;
  email:          string;
  role:           string;
  gradeLevel:     string | null;
  isActive:       boolean;
  avatarUrl:      string | null;
  createdAt:      string;
  updatedAt:      string;
  lastLoginAt:    string | null;
  disabledAt:     string | null;
  disabledReason: string | null;
  _count: { practiceSessions: number };
  studentProfile: StudentProfile | null;
}

interface Props { user: User }

export default function AdminUserDetailView({ user }: Props) {
  const router = useRouter();

  // Edit form state
  const [name,       setName]       = useState(user.name);
  const [email,      setEmail]      = useState(user.email);
  const [role,       setRole]       = useState(user.role);
  const [gradeLevel, setGradeLevel] = useState(user.gradeLevel ?? "");
  const [saving,     setSaving]     = useState(false);
  const [saveMsg,    setSaveMsg]    = useState<string | null>(null);

  // Disable/enable state
  const [disableReason, setDisableReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg,     setActionMsg]     = useState<string | null>(null);

  // Reset password state
  const [resetLoading,  setResetLoading]  = useState(false);
  const [tempPassword,  setTempPassword]  = useState<string | null>(null);

  // ── Save edits ──────────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true);
    setSaveMsg(null);
    try {
      await clientPatch(`/admin/users/${user.id}`, {
        name,
        email,
        role,
        gradeLevel: gradeLevel || null,
      });
      setSaveMsg("Saved successfully");
      setTimeout(() => setSaveMsg(null), 3000);
      router.refresh();
    } catch {
      setSaveMsg("Save failed — check console");
    } finally {
      setSaving(false);
    }
  }

  // ── Disable ─────────────────────────────────────────────────────────────────

  async function handleDisable() {
    if (!confirm(`Disable ${user.name}'s account? They will not be able to sign in.`)) return;
    setActionLoading(true);
    setActionMsg(null);
    try {
      await clientPost(`/admin/users/${user.id}/disable`, { reason: disableReason || undefined });
      setActionMsg("Account disabled");
      setTimeout(() => { setActionMsg(null); router.refresh(); }, 1500);
    } catch {
      setActionMsg("Action failed");
    } finally {
      setActionLoading(false);
    }
  }

  // ── Enable ──────────────────────────────────────────────────────────────────

  async function handleEnable() {
    setActionLoading(true);
    setActionMsg(null);
    try {
      await clientPost(`/admin/users/${user.id}/enable`, {});
      setActionMsg("Account enabled");
      setTimeout(() => { setActionMsg(null); router.refresh(); }, 1500);
    } catch {
      setActionMsg("Action failed");
    } finally {
      setActionLoading(false);
    }
  }

  // ── Reset password ──────────────────────────────────────────────────────────

  async function handleResetPassword() {
    if (!confirm(`Reset password for ${user.name}? A temporary password will be generated.`)) return;
    setResetLoading(true);
    setTempPassword(null);
    try {
      const res = await clientPost<{ temporaryPassword: string }>(`/admin/users/${user.id}/reset-password`, {});
      setTempPassword(res?.temporaryPassword ?? null);
    } catch {
      setTempPassword(null);
      alert("Password reset failed");
    } finally {
      setResetLoading(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
      {/* Back nav */}
      <Link href="/admin/users" className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold transition">
        ← Back to Users
      </Link>

      {/* User header */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center text-2xl shrink-0">
          {user.name[0]?.toUpperCase() ?? "?"}
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">{user.name}</h1>
          <p className="text-gray-400 text-sm">{user.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge isActive={user.isActive} />
            <span className="text-xs text-gray-400">
              Joined {fmtDate(user.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <StatMini label="Practice Sessions" value={String(user._count.practiceSessions)} />
        {user.studentProfile && (
          <>
            <StatMini label="Total XP"   value={user.studentProfile.totalXp.toLocaleString()} />
            <StatMini label="Level"      value={String(user.studentProfile.currentLevel)} />
          </>
        )}
        {!user.studentProfile && (
          <StatMini label="Last Login" value={user.lastLoginAt ? fmtDate(user.lastLoginAt) : "Never"} />
        )}
      </div>

      {/* ── Edit form ────────────────────────────────────────────────────────── */}
      <Card title="Account Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Name">
            <input value={name} onChange={e => setName(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Email">
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" className={inputCls} />
          </Field>
          <Field label="Role">
            <select value={role} onChange={e => setRole(e.target.value)} className={inputCls}>
              <option value="student">Student</option>
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="parent">Parent</option>
            </select>
          </Field>
          <Field label="Grade">
            <select value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} className={inputCls}>
              <option value="">— None —</option>
              {["K","G1","G2","G3","G4","G5","G6","G7","G8"].map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 text-white font-bold px-5 py-2 rounded-xl text-sm hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          {saveMsg && (
            <span className={`text-sm font-semibold ${saveMsg.includes("fail") ? "text-red-500" : "text-green-600"}`}>
              {saveMsg}
            </span>
          )}
        </div>
      </Card>

      {/* ── Account status ────────────────────────────────────────────────────── */}
      <Card title="Account Status">
        {user.isActive ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              This account is <span className="text-green-600 font-bold">active</span>. Disabling will prevent the user from signing in.
            </p>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Reason (optional)</label>
              <input
                value={disableReason}
                onChange={e => setDisableReason(e.target.value)}
                placeholder="e.g. Violated community guidelines"
                className={`${inputCls} max-w-sm`}
              />
            </div>
            <button
              onClick={handleDisable}
              disabled={actionLoading}
              className="bg-red-600 text-white font-bold px-5 py-2 rounded-xl text-sm hover:bg-red-700 transition disabled:opacity-50"
            >
              {actionLoading ? "Working…" : "Disable Account"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              This account is <span className="text-red-500 font-bold">disabled</span>
              {user.disabledReason && <> — reason: <em>{user.disabledReason}</em></>}
              {user.disabledAt && <span className="text-gray-400"> (since {fmtDate(user.disabledAt)})</span>}
            </p>
            <button
              onClick={handleEnable}
              disabled={actionLoading}
              className="bg-green-600 text-white font-bold px-5 py-2 rounded-xl text-sm hover:bg-green-700 transition disabled:opacity-50"
            >
              {actionLoading ? "Working…" : "Re-enable Account"}
            </button>
          </div>
        )}
        {actionMsg && (
          <p className="text-sm font-semibold text-gray-700 mt-2">{actionMsg}</p>
        )}
      </Card>

      {/* ── Reset password ────────────────────────────────────────────────────── */}
      <Card title="Reset Password">
        <p className="text-sm text-gray-600 mb-3">
          Generates a temporary password and sets it immediately. Give the password to the user out-of-band; they should change it after logging in.
        </p>
        <button
          onClick={handleResetPassword}
          disabled={resetLoading}
          className="bg-amber-500 text-white font-bold px-5 py-2 rounded-xl text-sm hover:bg-amber-600 transition disabled:opacity-50"
        >
          {resetLoading ? "Resetting…" : "Generate Temporary Password"}
        </button>
        {tempPassword && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Temporary Password</p>
            <p className="font-mono text-lg font-black text-amber-900 select-all">{tempPassword}</p>
            <p className="text-xs text-amber-600 mt-1">Copy this now — it will not be shown again.</p>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 transition bg-white";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">{title}</h2>
      {children}
    </div>
  );
}

function StatMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-xl font-black text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive
    ? <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-600">Active</span>
    : <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500">Disabled</span>;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

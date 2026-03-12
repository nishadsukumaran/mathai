/**
 * @module components/admin/AdminUserDetailView
 *
 * Admin user detail — edit, enable/disable, reset password.
 * Client component: handles all mutations via clientPost/clientPatch.
 */

"use client";

import { useState, useMemo } from "react";
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
  petInsight?: {
    personality: { label: string; icon: string; description: string; isEvolved: boolean };
    insight:     string;
  } | null;
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
  const [resetMode,         setResetMode]         = useState<"auto" | "manual">("auto");
  const [manualPassword,    setManualPassword]    = useState("");
  const [confirmPassword,   setConfirmPassword]   = useState("");
  const [showManualPwd,     setShowManualPwd]     = useState(false);
  const [resetLoading,      setResetLoading]      = useState(false);
  const [tempPassword,      setTempPassword]      = useState<string | null>(null);
  const [resetError,        setResetError]        = useState<string | null>(null);

  // Live complexity checks for manual password
  const complexity = useMemo(() => ({
    length:  manualPassword.length >= 8,
    letter:  /[a-zA-Z]/.test(manualPassword),
    number:  /[0-9]/.test(manualPassword),
    match:   manualPassword.length > 0 && manualPassword === confirmPassword,
  }), [manualPassword, confirmPassword]);

  const manualIsValid =
    complexity.length && complexity.letter && complexity.number && complexity.match;

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
    const isManual = resetMode === "manual";
    const confirmMsg = isManual
      ? `Set a specific password for ${user.name}?`
      : `Auto-generate a new password for ${user.name}?`;
    if (!confirm(confirmMsg)) return;

    setResetLoading(true);
    setTempPassword(null);
    setResetError(null);
    try {
      const body = isManual ? { newPassword: manualPassword } : {};
      const res = await clientPost<{ temporaryPassword: string }>(
        `/admin/users/${user.id}/reset-password`,
        body
      );
      if (res?.temporaryPassword) {
        setTempPassword(res.temporaryPassword);
        // Clear manual fields after success
        setManualPassword("");
        setConfirmPassword("");
      } else {
        setResetError("Reset failed — no password returned.");
      }
    } catch {
      setResetError("Password reset failed. Please try again.");
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

      {/* ── Pet Personality Insight (parent-facing) ───────────────────────── */}
      {user.petInsight && user.role === "student" && (
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-4 flex gap-3 items-start">
          <span className="text-2xl mt-0.5">{user.petInsight.personality.icon}</span>
          <div>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-0.5">
              Pet Personality · {user.petInsight.personality.label}
              {user.petInsight.personality.isEvolved && " ⭐"}
            </p>
            <p className="text-sm text-indigo-900 leading-relaxed">{user.petInsight.insight}</p>
          </div>
        </div>
      )}

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
        <p className="text-sm text-gray-600">
          Set a new password for this user. They should change it after logging in.
        </p>

        {/* Mode toggle */}
        <div className="flex gap-2 mt-1">
          {(["auto", "manual"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setResetMode(m); setTempPassword(null); setResetError(null); }}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold border transition ${
                resetMode === m
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"
              }`}
            >
              {m === "auto" ? "Auto-generate" : "Set manually"}
            </button>
          ))}
        </div>

        {/* Manual entry fields */}
        {resetMode === "manual" && (
          <div className="space-y-3 mt-1">
            {/* New password */}
            <Field label="New password">
              <div className="relative">
                <input
                  type={showManualPwd ? "text" : "password"}
                  value={manualPassword}
                  onChange={e => setManualPassword(e.target.value)}
                  placeholder="Min 8 chars, letters + numbers"
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => setShowManualPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 font-semibold"
                >
                  {showManualPwd ? "Hide" : "Show"}
                </button>
              </div>
            </Field>

            {/* Confirm password */}
            <Field label="Confirm password">
              <input
                type={showManualPwd ? "text" : "password"}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className={`${inputCls} ${
                  confirmPassword.length > 0 && !complexity.match
                    ? "border-red-400 focus:border-red-500"
                    : ""
                }`}
              />
            </Field>

            {/* Live complexity indicators */}
            {manualPassword.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <ComplexityBadge ok={complexity.length}  label="8+ characters" />
                <ComplexityBadge ok={complexity.letter}  label="Contains a letter" />
                <ComplexityBadge ok={complexity.number}  label="Contains a number" />
                <ComplexityBadge ok={complexity.match}   label="Passwords match" />
              </div>
            )}
          </div>
        )}

        {/* Auto-generate description */}
        {resetMode === "auto" && (
          <p className="text-xs text-gray-400">
            A secure 12-character alphanumeric password will be generated and shown to you once.
          </p>
        )}

        {/* Action button */}
        <button
          onClick={() => void handleResetPassword()}
          disabled={resetLoading || (resetMode === "manual" && !manualIsValid)}
          className="bg-amber-500 text-white font-bold px-5 py-2 rounded-xl text-sm hover:bg-amber-600 transition disabled:opacity-50"
        >
          {resetLoading
            ? "Resetting…"
            : resetMode === "auto"
              ? "Generate Password"
              : "Set Password"}
        </button>

        {/* Error */}
        {resetError && (
          <p className="text-sm font-semibold text-red-500">{resetError}</p>
        )}

        {/* Result */}
        {tempPassword && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">
              {resetMode === "auto" ? "Generated Password" : "New Password Set"}
            </p>
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

function ComplexityBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
      ok ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"
    }`}>
      <span>{ok ? "✓" : "○"}</span>
      {label}
    </span>
  );
}

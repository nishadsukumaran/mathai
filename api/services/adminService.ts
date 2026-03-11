/**
 * @module api/services/adminService
 *
 * All admin data-access operations.
 * Controllers call these; this layer is the only place that touches Prisma
 * for admin-specific queries.
 */

import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminUserListItem {
  id:            string;
  name:          string;
  email:         string;
  role:          string;
  gradeLevel:    string | null;
  isActive:      boolean;
  createdAt:     string;
  lastLoginAt:   string | null;
  disabledAt:    string | null;
  disabledReason: string | null;
  _count: {
    practiceSessions: number;
  };
}

export interface AdminUserDetail extends AdminUserListItem {
  avatarUrl:      string | null;
  updatedAt:      string;
  // Student profile extras (null for non-students)
  studentProfile: {
    totalXp:        number;
    currentLevel:   number;
    streakCount:    number;
    learningPace:   string;
    confidenceLevel: number;
  } | null;
}

export interface AdminDashboardStats {
  totalUsers:      number;
  activeUsers:     number;
  disabledUsers:   number;
  newUsersToday:   number;
  newUsersThisWeek: number;
  byRole: { role: string; count: number }[];
  byGrade: { grade: string; count: number }[];
}

export interface UserListOptions {
  search?:   string;
  role?:     string;
  isActive?: boolean;
  page:      number;
  limit:     number;
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<AdminDashboardStats> {
  const now = new Date();
  const todayStart  = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart   = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    activeUsers,
    disabledUsers,
    newUsersToday,
    newUsersThisWeek,
    byRoleRaw,
    byGradeRaw,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { isActive: false } }),
    prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.user.groupBy({ by: ["role"], _count: { id: true } }),
    prisma.user.groupBy({ by: ["gradeLevel"], where: { gradeLevel: { not: null } }, _count: { id: true } }),
  ]);

  return {
    totalUsers,
    activeUsers,
    disabledUsers,
    newUsersToday,
    newUsersThisWeek,
    byRole:  byRoleRaw.map(r => ({ role: r.role, count: r._count.id })),
    byGrade: byGradeRaw.map(r => ({ grade: r.gradeLevel!, count: r._count.id })),
  };
}

// ─── User list ────────────────────────────────────────────────────────────────

export async function listUsers(opts: UserListOptions): Promise<{
  users: AdminUserListItem[];
  total: number;
}> {
  const { search, role, isActive, page, limit } = opts;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (search) {
    where["OR"] = [
      { name:  { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  if (role)             where["role"]     = role;
  if (isActive !== undefined) where["isActive"] = isActive;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id:             true,
        name:           true,
        email:          true,
        role:           true,
        gradeLevel:     true,
        isActive:       true,
        createdAt:      true,
        lastLoginAt:    true,
        disabledAt:     true,
        disabledReason: true,
        _count: {
          select: { practiceSessions: true },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: users.map(u => ({
      ...u,
      gradeLevel:     u.gradeLevel ?? null,
      createdAt:      u.createdAt.toISOString(),
      lastLoginAt:    u.lastLoginAt?.toISOString()  ?? null,
      disabledAt:     u.disabledAt?.toISOString()   ?? null,
      disabledReason: u.disabledReason ?? null,
    })),
    total,
  };
}

// ─── User detail ──────────────────────────────────────────────────────────────

export async function getUserById(id: string): Promise<AdminUserDetail | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id:             true,
      name:           true,
      email:          true,
      role:           true,
      gradeLevel:     true,
      isActive:       true,
      avatarUrl:      true,
      createdAt:      true,
      updatedAt:      true,
      lastLoginAt:    true,
      disabledAt:     true,
      disabledReason: true,
      _count: { select: { practiceSessions: true } },
      studentProfile: {
        select: {
          totalXp:         true,
          currentLevel:    true,
          streakCount:     true,
          learningPace:    true,
          confidenceLevel: true,
        },
      },
    },
  });

  if (!user) return null;

  return {
    ...user,
    gradeLevel:     user.gradeLevel ?? null,
    avatarUrl:      user.avatarUrl  ?? null,
    createdAt:      user.createdAt.toISOString(),
    updatedAt:      user.updatedAt.toISOString(),
    lastLoginAt:    user.lastLoginAt?.toISOString()  ?? null,
    disabledAt:     user.disabledAt?.toISOString()   ?? null,
    disabledReason: user.disabledReason ?? null,
    studentProfile: user.studentProfile ?? null,
  };
}

// ─── Update user ──────────────────────────────────────────────────────────────

export interface UpdateUserPayload {
  name?:       string;
  email?:      string;
  role?:       string;
  gradeLevel?: string | null;
}

export async function updateUser(
  id: string,
  payload: UpdateUserPayload
): Promise<AdminUserDetail | null> {
  // Validate role if provided
  const validRoles = ["student", "parent", "teacher", "admin"];
  if (payload.role && !validRoles.includes(payload.role)) {
    throw new Error(`Invalid role: ${payload.role}`);
  }

  // Email uniqueness check
  if (payload.email) {
    const existing = await prisma.user.findUnique({ where: { email: payload.email } });
    if (existing && existing.id !== id) {
      throw new Error("Email already in use");
    }
  }

  await prisma.user.update({
    where: { id },
    data:  {
      ...(payload.name       !== undefined && { name:       payload.name }),
      ...(payload.email      !== undefined && { email:      payload.email }),
      ...(payload.role       !== undefined && { role:       payload.role as never }),
      ...(payload.gradeLevel !== undefined && { gradeLevel: payload.gradeLevel as never }),
    },
  });

  return getUserById(id);
}

// ─── Enable / Disable ────────────────────────────────────────────────────────

export async function disableUser(
  id: string,
  reason?: string
): Promise<void> {
  await prisma.user.update({
    where: { id },
    data:  {
      isActive:       false,
      disabledAt:     new Date(),
      disabledReason: reason ?? null,
    },
  });
}

export async function enableUser(id: string): Promise<void> {
  await prisma.user.update({
    where: { id },
    data:  {
      isActive:       true,
      disabledAt:     null,
      disabledReason: null,
    },
  });
}

// ─── Reset password ───────────────────────────────────────────────────────────

/**
 * Sets a temporary password for the user.
 * Returns the plain-text temporary password so the admin can communicate
 * it to the user out of band.
 */
export async function resetPassword(
  id: string,
  temporaryPassword?: string
): Promise<string> {
  // Generate a random 12-char password if none provided
  const tmpPwd = temporaryPassword ?? generateTemporaryPassword();
  const hashed = await bcrypt.hash(tmpPwd, 12);

  await prisma.user.update({
    where: { id },
    data:  { hashedPassword: hashed },
  });

  return tmpPwd;
}

function generateTemporaryPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < 12; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/**
 * @module api/services/parentChildService
 *
 * Centralized service for parent-child account management.
 *
 * Operations:
 *   - Create child account with proper linking
 *   - List linked children for a parent
 *   - Validate parent-child access
 *   - Manage child PIN credentials
 *   - Generate kid-friendly usernames
 */

import { prisma }   from "../lib/prisma";
import bcrypt        from "bcryptjs";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CreateChildParams {
  parentId:          string;
  childName:         string;
  grade:             string;
  curriculum:        string;
  schoolName?:       string;
  onboardingGoal?:   string;
  relationshipType?: "guardian" | "mother" | "father" | "other";
  loginMode:         "parent_managed" | "pin_only" | "hybrid";
  pin?:              string;  // raw 4+ digit PIN — will be hashed
}

export interface LinkedChild {
  id:           string;
  name:         string;
  displayName:  string | null;
  grade:        string | null;
  curriculum:   string;
  username:     string | null;
  hasPin:       boolean;
  loginMode:    string;
  linkStatus:   string;
  isPrimary:    boolean;
  lastLoginAt:  Date | null;
}

// ─── Username generation ─────────────────────────────────────────────────────

/**
 * Generate a kid-friendly unique username from a child's name.
 * Format: lowercase-name + 3-digit random suffix (e.g. "aryan-472")
 */
async function generateUsername(childName: string): Promise<string> {
  const base = childName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12);
  const prefix = base || "student";

  // Try up to 5 times to find a unique username
  for (let i = 0; i < 5; i++) {
    const suffix = Math.floor(100 + Math.random() * 900); // 3 digits
    const username = `${prefix}-${suffix}`;
    const exists = await prisma.studentProfile.findUnique({
      where: { username },
      select: { id: true },
    }).catch(() => null);
    if (!exists) return username;
  }

  // Fallback: use timestamp
  return `${prefix}-${Date.now().toString(36).slice(-5)}`;
}

// ─── PIN management ──────────────────────────────────────────────────────────

const PIN_SALT_ROUNDS = 10;

function validatePin(pin: string): string | null {
  if (pin.length < 4) return "PIN must be at least 4 digits";
  if (!/^\d+$/.test(pin)) return "PIN must contain only numbers";
  return null;
}

async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, PIN_SALT_ROUNDS);
}

export async function verifyPin(storedHash: string, inputPin: string): Promise<boolean> {
  return bcrypt.compare(inputPin, storedHash);
}

// ─── Core operations ─────────────────────────────────────────────────────────

/**
 * Create a child account linked to a parent.
 *
 * Creates: User (role=student) + StudentProfile + ParentChildLink
 * Optionally sets up PIN credentials for child direct login.
 */
export async function createChildAccount(params: CreateChildParams): Promise<{
  childId:  string;
  username: string | null;
}> {
  const {
    parentId, childName, grade, curriculum, schoolName,
    onboardingGoal, relationshipType, loginMode, pin,
  } = params;

  // Validate parent exists and is a parent/admin
  const parent = await prisma.user.findUnique({ where: { id: parentId } });
  if (!parent) throw new Error("Parent user not found");

  // Upgrade role to parent if currently student
  if ((parent as any).role === "student") {
    await prisma.user.update({
      where: { id: parentId },
      data:  { role: "parent" as any },
    });
  }

  // Generate username if PIN login is enabled
  let username: string | null = null;
  let hashedPinValue: string | null = null;

  if (loginMode === "pin_only" || loginMode === "hybrid") {
    username = await generateUsername(childName);
    if (pin) {
      const pinError = validatePin(pin);
      if (pinError) throw new Error(pinError);
      hashedPinValue = await hashPin(pin);
    }
  }

  // Create child user — unique email prevents Prisma unique constraint issues
  const childEmail = `${(username ?? childName.toLowerCase().replace(/\s+/g, ""))}.child@mathai.app`;

  const child = await prisma.user.create({
    data: {
      name:       childName.trim(),
      email:      childEmail,
      role:       "student" as any,
      gradeLevel: grade as any,
      isActive:   true,
    },
  });

  // Create student profile
  await prisma.studentProfile.create({
    data: {
      userId:            child.id,
      displayName:       childName.trim(),
      curriculum:        curriculum,
      schoolName:        schoolName?.trim() || null,
      onboardingGoal:    onboardingGoal || null,
      preferredLoginMode: loginMode as any,
      username,
      hashedPin:         hashedPinValue,
    },
  });

  // Create parent-child link
  await prisma.parentChildLink.create({
    data: {
      parentId,
      childId:           child.id,
      relationshipType:  (relationshipType ?? "guardian") as any,
      status:            "active" as any,
      isPrimaryGuardian: true,
    },
  });

  return { childId: child.id, username };
}

/**
 * Get all children linked to a parent.
 */
export async function getLinkedChildren(parentId: string): Promise<LinkedChild[]> {
  const links = await prisma.parentChildLink.findMany({
    where:   { parentId, status: "active" as any },
    include: {
      child: {
        select: {
          id: true, name: true, gradeLevel: true, lastLoginAt: true,
          studentProfile: {
            select: {
              displayName: true, curriculum: true, username: true,
              hashedPin: true, preferredLoginMode: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return links.map((link) => ({
    id:           link.child.id,
    name:         link.child.name,
    displayName:  link.child.studentProfile?.displayName ?? null,
    grade:        link.child.gradeLevel as string | null,
    curriculum:   link.child.studentProfile?.curriculum ?? "cambridge",
    username:     link.child.studentProfile?.username ?? null,
    hasPin:       !!link.child.studentProfile?.hashedPin,
    loginMode:    (link.child.studentProfile?.preferredLoginMode as string) ?? "parent_managed",
    linkStatus:   link.status as string,
    isPrimary:    link.isPrimaryGuardian,
    lastLoginAt:  link.child.lastLoginAt,
  }));
}

/**
 * Validate that a parent has active access to a specific child.
 */
export async function validateParentChildAccess(
  parentId: string,
  childId: string,
): Promise<boolean> {
  const link = await prisma.parentChildLink.findFirst({
    where: {
      parentId,
      childId,
      status: "active" as any,
    },
  });
  return !!link;
}

/**
 * Reset a child's PIN. Parent must have active link to the child.
 */
export async function resetChildPin(
  parentId: string,
  childId: string,
  newPin: string,
): Promise<void> {
  const hasAccess = await validateParentChildAccess(parentId, childId);
  if (!hasAccess) throw new Error("Access denied: no active parent-child link");

  const pinError = validatePin(newPin);
  if (pinError) throw new Error(pinError);

  const hashed = await hashPin(newPin);
  await prisma.studentProfile.update({
    where: { userId: childId },
    data:  { hashedPin: hashed },
  });
}

/**
 * Authenticate a child via username + PIN.
 * Returns the child's user ID if valid, null if not.
 */
export async function authenticateChildPin(
  username: string,
  pin: string,
): Promise<{ userId: string; name: string; grade: string } | null> {
  const profile = await prisma.studentProfile.findUnique({
    where:   { username },
    include: { user: { select: { id: true, name: true, gradeLevel: true, isActive: true } } },
  });

  if (!profile || !profile.hashedPin || !profile.user.isActive) return null;

  const loginModeAllowed = profile.preferredLoginMode === "pin_only" || profile.preferredLoginMode === "hybrid";
  if (!loginModeAllowed) return null;

  const valid = await verifyPin(profile.hashedPin, pin);
  if (!valid) return null;

  return {
    userId: profile.user.id,
    name:   profile.user.name,
    grade:  (profile.user.gradeLevel as string) ?? "G4",
  };
}

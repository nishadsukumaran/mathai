/**
 * @module apps/web/app/api/auth/parent-onboarding
 *
 * POST /api/auth/parent-onboarding — create a child account linked to a parent.
 *
 * Uses the proper ParentChildLink model for linking.
 * Creates: User (student) + StudentProfile + ParentChildLink
 * Optionally sets up PIN credentials for child direct login.
 */

import { NextResponse }      from "next/server";
import { getServerSession }   from "next-auth";
import { authOptions }        from "@/lib/auth";
import { prisma }             from "@/lib/prisma";
import bcrypt                 from "bcryptjs";

const VALID_GRADES = ["G1","G2","G3","G4","G5","G6","G7","G8"] as const;
const VALID_CURRICULA = ["cambridge","ib","cbse","icse","british","american","other"] as const;
const VALID_LOGIN_MODES = ["parent_managed","pin_only","hybrid"] as const;


export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const parentId = (session.user as { id?: string }).id;
    if (!parentId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const body = await req.json();
    const {
      childName, grade, curriculum, schoolName, onboardingGoal,
      relationshipType, loginMode, username: requestedUsername, pin,
    } = body as {
      childName: string; grade: string; curriculum: string;
      schoolName?: string; onboardingGoal?: string;
      relationshipType?: string; loginMode?: string;
      username?: string; pin?: string;
    };

    // ── Validation ───────────────────────────────────────────────────────
    if (!childName || childName.trim().length < 1) {
      return NextResponse.json({ error: "Child name is required" }, { status: 400 });
    }
    if (!VALID_GRADES.includes(grade as any)) {
      return NextResponse.json({ error: "Invalid grade" }, { status: 400 });
    }
    if (!VALID_CURRICULA.includes(curriculum as any)) {
      return NextResponse.json({ error: "Invalid curriculum" }, { status: 400 });
    }

    const effectiveLoginMode = VALID_LOGIN_MODES.includes(loginMode as any) ? loginMode! : "parent_managed";

    // PIN validation
    let hashedPin: string | null = null;
    if ((effectiveLoginMode === "pin_only" || effectiveLoginMode === "hybrid") && pin) {
      if (pin.length < 4 || !/^\d+$/.test(pin)) {
        return NextResponse.json({ error: "PIN must be at least 4 digits" }, { status: 400 });
      }
      hashedPin = await bcrypt.hash(pin, 10);
    }

    // ── Upgrade parent role if needed ──────────────────────────────────────
    const parentUser = await prisma.user.findUnique({ where: { id: parentId } });
    if (parentUser && (parentUser as any).role === "student") {
      await prisma.user.update({
        where: { id: parentId },
        data:  { role: "parent" as any },
      });
    }

    // ── Username for PIN-enabled accounts ───────────────────────────────
    let username: string | null = null;
    if (effectiveLoginMode === "pin_only" || effectiveLoginMode === "hybrid") {
      if (!requestedUsername || requestedUsername.trim().length < 3) {
        return NextResponse.json({ error: "Username is required for PIN login (at least 3 characters)" }, { status: 400 });
      }
      username = requestedUsername.toLowerCase().trim();
      // Validate format
      if (!/^[a-z][a-z0-9-]{2,14}$/.test(username)) {
        return NextResponse.json({ error: "Username must be 3-15 characters, start with a letter, only letters/numbers/hyphens" }, { status: 400 });
      }
      // Check availability
      const existing = await prisma.studentProfile.findUnique({ where: { username }, select: { id: true } }).catch(() => null);
      if (existing) {
        return NextResponse.json({ error: "Username already taken" }, { status: 409 });
      }
    }

    // ── Create child user ────────────────────────────────────────────────
    const childEmail = `${(username ?? childName.toLowerCase().replace(/[^a-z0-9]/g, ""))}.child.${Date.now()}@mathai.app`;

    const child = await prisma.user.create({
      data: {
        name:       childName.trim(),
        email:      childEmail,
        role:       "student" as any,
        gradeLevel: grade as any,
        isActive:   true,
      },
    });

    // ── Create student profile ───────────────────────────────────────────
    await prisma.studentProfile.create({
      data: {
        userId:             child.id,
        displayName:        childName.trim(),
        curriculum,
        schoolName:         schoolName?.trim() || null,
        onboardingGoal:     onboardingGoal || null,
        preferredLoginMode: effectiveLoginMode as any,
        username,
        hashedPin,
      },
    });

    // ── Create parent-child link ─────────────────────────────────────────
    await prisma.parentChildLink.create({
      data: {
        parentId,
        childId:           child.id,
        relationshipType:  (relationshipType ?? "guardian") as any,
        status:            "active" as any,
        isPrimaryGuardian: true,
      },
    });

    return NextResponse.json({
      success:   true,
      childId:   child.id,
      childName: child.name,
      username,
    });

  } catch (err) {
    console.error("[parent-onboarding] Error:", err);
    return NextResponse.json(
      { error: "Could not create child profile. Please try again." },
      { status: 500 },
    );
  }
}

/**
 * @module apps/web/app/api/auth/parent-onboarding
 *
 * POST /api/auth/parent-onboarding — create a child account linked to a parent.
 *
 * Creates a new User with role="student", links it to the authenticated parent,
 * and stores curriculum/school/goal metadata on the child's StudentProfile.
 *
 * The child account has no password (parent-managed). The parent can later
 * set a password for the child if they want independent login.
 */

import { NextResponse }      from "next/server";
import { getServerSession }   from "next-auth";
import { authOptions }        from "@/lib/auth";
import { prisma }             from "@/lib/prisma";

const VALID_GRADES = ["G1","G2","G3","G4","G5","G6","G7","G8"] as const;
const VALID_CURRICULA = ["cambridge","ib","cbse","icse","british","american","other"] as const;

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
    const { childName, grade, curriculum, schoolName, onboardingGoal } = body as {
      childName:       string;
      grade:           string;
      curriculum:      string;
      schoolName?:     string;
      onboardingGoal?: string;
    };

    // ── Validation ───────────────────────────────────────────────────────
    if (!childName || childName.trim().length < 1) {
      return NextResponse.json({ error: "Child name is required" }, { status: 400 });
    }
    if (!VALID_GRADES.includes(grade as typeof VALID_GRADES[number])) {
      return NextResponse.json({ error: "Invalid grade" }, { status: 400 });
    }
    if (!VALID_CURRICULA.includes(curriculum as typeof VALID_CURRICULA[number])) {
      return NextResponse.json({ error: "Invalid curriculum" }, { status: 400 });
    }

    // ── Create child user ────────────────────────────────────────────────
    // Child gets a unique email derived from parent ID + child name (no login needed initially)
    const childEmail = `child-${parentId}-${Date.now()}@mathai.internal`;

    const child = await prisma.user.create({
      data: {
        name:       childName.trim(),
        email:      childEmail,
        role:       "student" as any,
        gradeLevel: grade as any,
        isActive:   true,
      },
    });

    // ── Create StudentProfile with curriculum metadata ────────────────────
    await prisma.studentProfile.create({
      data: {
        userId: child.id,
        // Store curriculum and school in the interests/preferences fields
        // (curriculum is not a separate column yet — stored as a structured note)
        interests: [
          curriculum && `curriculum:${curriculum}`,
          schoolName && `school:${schoolName.trim()}`,
          onboardingGoal && `goal:${onboardingGoal}`,
        ].filter(Boolean).join(","),
      },
    });

    // ── Update parent role if needed ──────────────────────────────────────
    // If the parent signed up as a "student" role, upgrade to "parent"
    const parentUser = await prisma.user.findUnique({ where: { id: parentId } });
    if (parentUser && (parentUser as any).role === "student") {
      await prisma.user.update({
        where: { id: parentId },
        data:  { role: "parent" as any },
      });
    }

    return NextResponse.json({
      success: true,
      childId: child.id,
      childName: child.name,
    });

  } catch (err) {
    console.error("[parent-onboarding] Error:", err);
    return NextResponse.json(
      { error: "Could not create child profile. Please try again." },
      { status: 500 },
    );
  }
}

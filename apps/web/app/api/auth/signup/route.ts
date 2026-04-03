/**
 * @module apps/web/app/api/auth/signup
 *
 * POST /api/auth/signup — create a new user with email + password.
 */

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name, grade, role: requestedRole } = body as {
      email: string;
      password: string;
      name: string;
      grade?: string;
      role?: string;
    };

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Name, email and password are required" },
        { status: 400 }
      );
    }

    const VALID_GRADES = ["G1","G2","G3","G4","G5","G6","G7","G8","G9","G10"] as const;
    const gradeLevel = VALID_GRADES.includes(grade as typeof VALID_GRADES[number])
      ? (grade as string)
      : "G4";

    if (
      password.length < 8 ||
      !/[a-zA-Z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters and include a letter and a number." },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Determine role: parent or student (only these two are allowed from signup)
    const effectiveRole = requestedRole === "parent" ? "parent" : "student";

    const user = await prisma.user.create({
      data: {
        email,
        name,
        hashedPassword,
        role: effectiveRole as any,
        gradeLevel: effectiveRole === "student" ? (gradeLevel as any) : null,
      },
    });

    // Create a StudentProfile for student users only.
    // Parents don't need a StudentProfile — they get one when they create a child.
    if (effectiveRole === "student") {
      await prisma.studentProfile.upsert({
        where:  { userId: user.id },
        create: { userId: user.id },
        update: {},
      });
    }

    // Fire-and-forget: kick off AI topic generation for this grade immediately.
    // Non-blocking — practiceMenuService will also retry on the user's first /practice visit.
    // Uses the internal route (no user JWT needed) authenticated by INTERNAL_SERVICE_SECRET.
    const apiBase =
      process.env["API_BASE_URL"] ??
      process.env["NEXT_PUBLIC_API_BASE_URL"] ??
      "http://localhost:3001/api";
    const internalSecret = process.env["INTERNAL_SERVICE_SECRET"] ?? "";
    void fetch(`${apiBase}/internal/generate-topics`, {
      method:  "POST",
      headers: {
        "Content-Type":     "application/json",
        "X-Service-Secret": internalSecret,
      },
      body: JSON.stringify({ userId: user.id }),
    }).catch(() => { /* non-critical — topics will generate on first /practice visit */ });

    return NextResponse.json(
      { message: "Account created", userId: user.id },
      { status: 201 }
    );
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

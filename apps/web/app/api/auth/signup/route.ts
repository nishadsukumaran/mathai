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
    const { email, password, name, grade } = body as {
      email: string;
      password: string;
      name: string;
      grade?: string;
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

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
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

    const user = await prisma.user.create({
      data: {
        email,
        name,
        hashedPassword,
        role: "student",
        gradeLevel: gradeLevel as any,
      },
    });

    // Create a StudentProfile for the new user, seeding the grade immediately
    // so the practice menu can generate personalised topics right away.
    await prisma.studentProfile.create({
      data: {
        userId: user.id,
        grade:  gradeLevel as any,
      },
    });

    // Fire-and-forget: kick off AI topic generation for this grade immediately.
    // Non-blocking — practiceMenuService will also retry on the user's first /practice visit.
    const apiBase =
      process.env["API_BASE_URL"] ??
      process.env["NEXT_PUBLIC_API_BASE_URL"] ??
      "http://localhost:3001/api";
    void fetch(`${apiBase}/profile/generate-initial-topics`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ userId: user.id }),
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

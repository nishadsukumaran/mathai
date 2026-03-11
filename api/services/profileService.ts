/**
 * @module api/services/profileService
 *
 * Student profile read + update. Backed by Prisma StudentProfile.
 *
 * Endpoints using this service:
 *   GET   /api/profile           → getProfile(userId)
 *   PATCH /api/profile           → updateProfile(userId, patch)
 */

import { prisma }           from "../lib/prisma";
import { NotFoundError }    from "../middlewares/error.middleware";
import { generateAndStore } from "./topicAssignmentService";
import type {
  StudentProfileResponse,
  UpdateProfileRequest,
  LearningPace,
  ExplanationStyle,
  Grade,
} from "@mathai/shared-types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toGrade(raw: string | null | undefined): Grade {
  if (!raw) return "G4" as Grade;
  return (raw.startsWith("G") ? raw : `G${raw}`) as Grade;
}

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Returns the full profile response for a user.
 * Upserts the StudentProfile row if it doesn't exist yet (new users).
 */
export async function getProfile(userId: string): Promise<StudentProfileResponse> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("User", userId);

  const profile = await prisma.studentProfile.upsert({
    where:  { userId },
    create: { userId },
    update: {},
  });

  return {
    id:                       profile.id,
    name:                     user.name,
    grade:                    toGrade((user as Record<string, unknown>)["gradeLevel"] as string),
    avatarUrl:                user.avatarUrl ?? undefined,
    preferredTheme:           profile.preferredTheme,
    learningPace:             profile.learningPace as LearningPace,
    confidenceLevel:          profile.confidenceLevel,
    preferredExplanationStyle:(profile as Record<string, unknown>)["preferredExplanationStyle"] as ExplanationStyle ?? "visual",
    totalXp:                  profile.totalXp,
    currentLevel:             profile.currentLevel,
  };
}

/**
 * Applies a partial patch to the student profile.
 * All fields optional — only provided keys are updated.
 */
export async function updateProfile(
  userId: string,
  patch: UpdateProfileRequest,
): Promise<StudentProfileResponse> {
  // Ensure profile exists
  await prisma.studentProfile.upsert({
    where:  { userId },
    create: { userId },
    update: {},
  });

  // Update User fields (name + gradeLevel live on User)
  const userUpdate: Record<string, unknown> = {};
  if (patch.name)  userUpdate["name"]       = patch.name;
  if (patch.grade) userUpdate["gradeLevel"] = patch.grade;

  if (Object.keys(userUpdate).length > 0) {
    await prisma.user.update({
      where: { id: userId },
      data:  userUpdate,
    });
  }

  // Build profile update payload (StudentProfile table)
  const profileData: Record<string, unknown> = {};
  if (patch.preferredTheme)            profileData["preferredTheme"]            = patch.preferredTheme;
  if (patch.learningPace)              profileData["learningPace"]              = patch.learningPace;
  if (patch.preferredExplanationStyle) profileData["preferredExplanationStyle"] = patch.preferredExplanationStyle;
  if (patch.confidenceLevel !== undefined) {
    // Student-set confidence (1–5) mapped to the 0–100 EWMA scale stored in DB
    // We scale it linearly: 1 → 20, 2 → 40, 3 → 60, 4 → 80, 5 → 100
    profileData["confidenceLevel"] = patch.confidenceLevel * 20;
  }

  if (Object.keys(profileData).length > 0) {
    await prisma.studentProfile.update({
      where: { userId },
      data:  profileData,
    });
  }

  // When grade or learning pace changes, regenerate the AI topic assignment
  // so the next Practice hub visit gets fresh, grade-appropriate topics.
  // Fire-and-forget — we don't block the profile save response on this.
  if (patch.grade || patch.learningPace) {
    void generateAndStore(userId);
  }

  // Return fresh profile
  return getProfile(userId);
}

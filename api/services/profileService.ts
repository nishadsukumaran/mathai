/**
 * @module api/services/profileService
 *
 * Student profile read + update. Backed by Prisma StudentProfile.
 *
 * Endpoints using this service:
 *   GET   /api/profile           → getProfile(userId)
 *   PATCH /api/profile           → updateProfile(userId, patch)
 */

import { prisma }       from "../lib/prisma";
import { NotFoundError } from "../middlewares/error.middleware";
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

  // Update name on User if provided
  if (patch.name) {
    await prisma.user.update({
      where: { id: userId },
      data:  { name: patch.name },
    });
  }

  // Build profile update payload
  const profileData: Record<string, unknown> = {};
  if (patch.preferredTheme)            profileData["preferredTheme"]            = patch.preferredTheme;
  if (patch.learningPace)              profileData["learningPace"]              = patch.learningPace;
  if (patch.preferredExplanationStyle) profileData["preferredExplanationStyle"] = patch.preferredExplanationStyle;

  if (Object.keys(profileData).length > 0) {
    await prisma.studentProfile.update({
      where: { userId },
      data:  profileData,
    });
  }

  // Return fresh profile
  return getProfile(userId);
}

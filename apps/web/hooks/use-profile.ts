/**
 * @module apps/web/hooks/use-profile
 *
 * Client-side hook for reading and updating the student's profile.
 *
 * Used by: ProfileModal inside DashboardView, ProfileModalConnected (deprecated).
 * Wraps GET /api/profile and PATCH /api/profile.
 *
 * Returns the profile, loading/error state, and a `save` action that
 * patches the profile and refreshes local state on success.
 *
 * USAGE:
 *   const { profile, loading, error, save } = useProfile();
 *   await save({ grade: "G5", preferredExplanationStyle: "visual" });
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { clientGet, clientPatch }            from "@/lib/clientApi";

import type { StudentProfileResponse, UpdateProfileRequest } from "@mathai/shared-types";

interface ProfileState {
  profile: StudentProfileResponse | null;
  loading: boolean;
  saving:  boolean;
  error:   string | null;
}

export function useProfile() {
  const [state, setState] = useState<ProfileState>({
    profile: null,
    loading: true,
    saving:  false,
    error:   null,
  });

  // Fetch on mount
  useEffect(() => {
    let cancelled = false;
    void clientGet<StudentProfileResponse>("/profile").then((data) => {
      if (!cancelled) {
        setState((s) => ({
          ...s,
          profile: data,
          loading: false,
          error:   data ? null : "Could not load profile",
        }));
      }
    });
    return () => { cancelled = true; };
  }, []);

  /** Patch profile and optimistically update local state */
  const save = useCallback(async (patch: Partial<UpdateProfileRequest>) => {
    setState((s) => ({ ...s, saving: true, error: null }));
    const updated = await clientPatch<StudentProfileResponse>("/profile", patch);
    setState((s) => ({
      ...s,
      profile: updated ?? s.profile,
      saving:  false,
      error:   updated ? null : "Could not save profile",
    }));
    return updated;
  }, []);

  return { ...state, save };
}

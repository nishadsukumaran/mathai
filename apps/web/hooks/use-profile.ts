/**
 * @module apps/web/hooks/use-profile
 *
 * Client-side hook for reading and updating the student's profile.
 *
 * Used by: ProfileModal inside DashboardView, ProfileModalConnected (deprecated).
 * Wraps GET /api/profile and PATCH /api/profile.
 *
 * Returns the profile, loading/error state, a `save` action, and a `refetch`
 * action that callers can invoke for manual retry.
 *
 * USAGE:
 *   const { profile, loading, error, save, refetch } = useProfile();
 *   await save({ grade: "G5", preferredExplanationStyle: "visual" });
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { clientGet, clientPatch }                   from "@/lib/clientApi";

import type { StudentProfileResponse, UpdateProfileRequest } from "@mathai/shared-types";

const MAX_AUTO_RETRIES  = 2;
const RETRY_DELAY_MS    = 1500;

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

  // Track whether the component is still mounted so we never setState after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  /**
   * Core fetch function — shared between mount and manual refetch.
   * Retries up to MAX_AUTO_RETRIES times on failure with a fixed delay.
   */
  const fetchProfile = useCallback(async () => {
    if (!mountedRef.current) return;
    setState((s) => ({ ...s, loading: true, error: null }));

    let data: StudentProfileResponse | null = null;
    let attempt = 0;

    while (attempt <= MAX_AUTO_RETRIES) {
      data = await clientGet<StudentProfileResponse>("/profile");
      if (data) break;

      attempt++;
      if (attempt <= MAX_AUTO_RETRIES) {
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }

    if (!mountedRef.current) return;
    setState((s) => ({
      ...s,
      profile: data,
      loading: false,
      error:   data ? null : "Could not load profile",
    }));
  }, []);

  // Fetch on mount
  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  /** Patch profile and optimistically update local state */
  const save = useCallback(async (patch: Partial<UpdateProfileRequest>) => {
    setState((s) => ({ ...s, saving: true, error: null }));
    const updated = await clientPatch<StudentProfileResponse>("/profile", patch);
    if (!mountedRef.current) return null;
    setState((s) => ({
      ...s,
      profile: updated ?? s.profile,
      saving:  false,
      error:   updated ? null : "Could not save profile",
    }));
    return updated;
  }, []);

  return { ...state, save, refetch: fetchProfile };
}

/**
 * @module components/mathai/profile-modal-connected
 *
 * Connected wrapper around ProfileModal.
 * Fetches real profile from GET /api/profile on mount,
 * and submits PATCH /api/profile on save.
 *
 * DashboardView should use this component instead of <ProfileModal> directly.
 */

"use client";

import { useEffect, useState }   from "react";
import { ProfileModal }           from "./profile-modal";
import { clientGet, clientPatch } from "@/lib/clientApi";
import type { StudentProfileResponse, UpdateProfileRequest } from "@/types";

interface ProfileModalConnectedProps {
  onClose: () => void;
}

export function ProfileModalConnected({ onClose }: ProfileModalConnectedProps) {
  const [profile, setProfile] = useState<StudentProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    clientGet<StudentProfileResponse>("/profile").then((data) => {
      if (!cancelled) {
        setProfile(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  async function handleSave(patch: Partial<StudentProfileResponse>) {
    const updated = await clientPatch<StudentProfileResponse>("/profile", patch as UpdateProfileRequest);
    if (updated) setProfile(updated);
  }

  return (
    <ProfileModal
      profile={profile}
      loading={loading}
      onClose={onClose}
      onSave={handleSave}
    />
  );
}

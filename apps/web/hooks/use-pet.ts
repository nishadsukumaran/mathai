/**
 * @module apps/web/hooks/use-pet
 *
 * Client-side hook for reading the student's pet + personality.
 * Wraps GET /api/pet — returns the full PetResponse.
 *
 * USAGE:
 *   const { pet, effects, insight, loading, refetch } = usePet();
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { clientGet, clientPost }                    from "@/lib/clientApi";
import type { PetResponse }                         from "@/types";

interface PetState {
  data:    PetResponse | null;
  loading: boolean;
  error:   string | null;
}

export function usePet() {
  const [state, setState] = useState<PetState>({
    data:    null,
    loading: true,
    error:   null,
  });

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchPet = useCallback(async () => {
    if (!mountedRef.current) return;
    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const result = await clientGet<PetResponse>("/pet");
      if (mountedRef.current) {
        setState({ data: result, loading: false, error: null });
      }
    } catch {
      if (mountedRef.current) {
        setState((s) => ({ ...s, loading: false, error: "Could not load pet" }));
      }
    }
  }, []);

  useEffect(() => {
    void fetchPet();
  }, [fetchPet]);

  /** Adopt a new pet or rename the current one. */
  const adoptPet = useCallback(async (petId: string, petName?: string) => {
    const result = await clientPost<PetResponse["pet"]>("/pet/adopt", { petId, petName });
    void fetchPet(); // refresh
    return result;
  }, [fetchPet]);

  return {
    pet:     state.data?.pet     ?? null,
    catalog: state.data?.catalog ?? null,
    effects: state.data?.effects ?? null,
    insight: state.data?.insight ?? null,
    loading: state.loading,
    error:   state.error,
    refetch: fetchPet,
    adoptPet,
  };
}

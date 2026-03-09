/**
 * @module apps/web/lib/api-client
 *
 * Typed API client for all frontend → backend calls.
 * Built on axios with automatic auth header injection.
 *
 * USAGE:
 *   import { apiClient } from "@/lib/api-client";
 *   const { data } = await apiClient.post("/practice/start", { topicId: "...", mode: "guided" });
 *
 * ERROR HANDLING:
 *   All API errors are wrapped in ApiClientError with code + message.
 *   Use in catch blocks to show user-appropriate error messages.
 */

import axios, { AxiosInstance, AxiosError } from "axios";
import { ApiResponse } from "@/types";
import { getSession } from "next-auth/react";

const API_BASE = process.env["NEXT_PUBLIC_API_BASE_URL"] ?? "http://localhost:3001/api";

function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: API_BASE,
    timeout: 15000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Attach auth token from NextAuth session
  client.interceptors.request.use(async (config) => {
    const session = await getSession();
    if (session?.user) {
      // @ts-ignore — NextAuth token is extended with accessToken
      const token = session.accessToken as string | undefined;
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }
    return config;
  });

  // Unwrap API response envelope and throw typed errors
  client.interceptors.response.use(
    (response) => {
      const data = response.data as ApiResponse<unknown>;
      if (!data.success) {
        throw new ApiClientError(data.error.code, data.error.message, data.error.details);
      }
      return response;
    },
    (error: AxiosError) => {
      if (error.response?.data) {
        const data = error.response.data as { error?: { code: string; message: string } };
        if (data.error) {
          throw new ApiClientError(data.error.code, data.error.message);
        }
      }
      throw new ApiClientError("NETWORK_ERROR", error.message ?? "Network error");
    }
  );

  return client;
}

export const apiClient = createApiClient();

export class ApiClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

/**
 * @module apps/web/app/providers
 *
 * Client-side context providers.
 * Separated from layout.tsx because it's a Client Component.
 *
 * PROVIDERS:
 *   SessionProvider  — NextAuth session context
 *   QueryClientProvider — React Query (server state caching)
 *   ThemeProvider — MathAI theme system
 */

"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ThemeProvider } from "@/lib/theme";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: 2,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>{children}</ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}

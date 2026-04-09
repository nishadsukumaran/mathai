/**
 * @module apps/web/app/providers
 *
 * Client-side context providers.
 * Separated from layout.tsx because it's a Client Component.
 *
 * PROVIDERS:
 *   SessionProvider      — NextAuth session context
 *   QueryClientProvider  — React Query (server state caching)
 *   ThemeProvider         — CSS variable theme layer
 */

"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ThemeProvider } from "@/lib/theme";
import { ThemeAtmosphere } from "@/components/mathai/ThemeAtmosphere";

/**
 * Inner wrapper that reads the session grade for auto-theme selection.
 * Must be inside SessionProvider to use useSession.
 */
function ThemeWithSession({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const grade = (session?.user as { grade?: string } | undefined)?.grade;
  return (
    <ThemeProvider defaultGrade={grade}>
      <ThemeAtmosphere />
      {children}
    </ThemeProvider>
  );
}

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
        <ThemeWithSession>{children}</ThemeWithSession>
      </QueryClientProvider>
    </SessionProvider>
  );
}

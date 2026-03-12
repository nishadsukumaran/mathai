/**
 * /ask — Dedicated Ask MathAI page.
 * Full-screen version of the ask experience with conversation history.
 *
 * Supports ?q=<encoded question> to pre-fill and auto-submit a question.
 * Used by the "Teach Me" button in the practice session.
 */

import { getServerSession }  from "next-auth/next";
import { redirect }          from "next/navigation";
import { authOptions }       from "@/lib/auth";
import AskPageContent        from "./AskPageContent";

interface AskPageProps {
  searchParams?: Promise<{ q?: string; topic?: string }>;
}

export default async function AskPage({ searchParams }: AskPageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");

  const params = searchParams ? await searchParams : {};
  const initialQuestion = (() => {
    if (!params?.q) return "";
    try {
      return decodeURIComponent(params.q);
    } catch {
      // Malformed percent-encoding (e.g. bare %) — use raw string rather than crashing
      return params.q;
    }
  })();

  return <AskPageContent initialQuestion={initialQuestion} />;
}

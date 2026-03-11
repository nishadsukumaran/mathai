/**
 * /ask — Dedicated Ask MathAI page.
 * Full-screen version of the ask experience with conversation history.
 */

import { getServerSession }  from "next-auth/next";
import { redirect }          from "next/navigation";
import { authOptions }       from "@/lib/auth";
import AskPageContent        from "./AskPageContent";

export default async function AskPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");

  return <AskPageContent />;
}

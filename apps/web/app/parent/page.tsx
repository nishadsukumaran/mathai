/**
 * @module app/parent/page
 *
 * Parent portal landing — routes based on linked children status.
 *
 * Uses the proper ParentChildLink model for child lookup.
 * No children → onboarding. One child → dashboard. Multiple → child picker (future).
 */

import { redirect }         from "next/navigation";
import { getServerSession }  from "next-auth";
import { authOptions }       from "@/lib/auth";
import { prisma }            from "@/lib/prisma";

export default async function ParentPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/signin?callbackUrl=/parent");

  const parentId = (session.user as { id?: string }).id ?? "";

  // Query proper parent-child links
  let children: Array<{ childId: string }> = [];
  try {
    children = await prisma.parentChildLink.findMany({
      where:   { parentId, status: "active" as any },
      select:  { childId: true },
      orderBy: { createdAt: "asc" },
    });
  } catch {
    // Table may not exist yet if migration hasn't run — fall back to onboarding
  }

  if (children.length === 0) {
    redirect("/parent/onboarding");
  }

  // Single child → direct to dashboard
  redirect(`/parent/dashboard?childId=${children[0]!.childId}`);
}

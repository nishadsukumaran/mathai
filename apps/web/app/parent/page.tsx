/**
 * @module app/parent/page
 *
 * Parent portal landing — routes to onboarding if no child linked,
 * or to the dashboard if a child exists.
 */

import { redirect }         from "next/navigation";
import { getServerSession }  from "next-auth";
import { authOptions }       from "@/lib/auth";
import { prisma }            from "@/lib/prisma";

export default async function ParentPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/signin?callbackUrl=/parent");

  const parentId = (session.user as { id?: string }).id ?? "";

  // Check if this parent has created any child accounts
  // Children are identified as users whose email starts with "child-{parentId}-"
  const children = await prisma.user.findMany({
    where: {
      email: { startsWith: `child-${parentId}-` },
      role:  "student" as any,
    },
    select: { id: true },
    take: 1,
  }).catch(() => []);

  if (children.length === 0) {
    // No children linked — start onboarding
    redirect("/parent/onboarding");
  }

  // Has a child — go to dashboard with the first child's ID
  redirect(`/parent/dashboard?childId=${children[0]!.id}`);
}

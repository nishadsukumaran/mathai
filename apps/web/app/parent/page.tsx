/**
 * @module app/parent/page
 *
 * Parent portal landing — redirects to dashboard for now.
 * When multi-child support is added, this becomes a child picker.
 */

import { redirect }         from "next/navigation";
import { getServerSession }  from "next-auth";
import { authOptions }       from "@/lib/auth";

export default async function ParentPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/signin?callbackUrl=/parent");

  // For now, use the logged-in user's own ID as child ID
  // (allows testing with student accounts too)
  const childId = (session.user as { id?: string }).id ?? "";

  redirect(`/parent/dashboard?childId=${childId}`);
}

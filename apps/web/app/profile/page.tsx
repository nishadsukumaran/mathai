/**
 * /profile — Student profile & settings page.
 */

import { getServerSession }  from "next-auth/next";
import { redirect }          from "next/navigation";
import { authOptions }       from "@/lib/auth";
import ProfilePageContent    from "./ProfilePageContent";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");

  return <ProfilePageContent />;
}

/**
 * @module apps/web/app/page
 *
 * Landing page entry point.
 * Server component: redirects authenticated users, renders public landing for visitors.
 */

import { redirect }        from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions }      from "@/lib/auth";
import { LandingPage }      from "@/components/landing/LandingPage";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/dashboard");
  }

  return <LandingPage />;
}

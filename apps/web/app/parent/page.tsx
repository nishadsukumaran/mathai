/**
 * @module app/parent/page
 *
 * Parent portal landing.
 *   0 children → onboarding
 *   1 child   → direct to dashboard
 *   2+ children → child picker ("Who is learning today?")
 */

import { redirect }         from "next/navigation";
import { getServerSession }  from "next-auth";
import { authOptions }       from "@/lib/auth";
import { prisma }            from "@/lib/prisma";
import Link                  from "next/link";

export default async function ParentPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/signin?callbackUrl=/parent");

  const parentId = (session.user as { id?: string }).id ?? "";

  let children: Array<{ childId: string; child: { id: string; name: string; gradeLevel: string | null } }> = [];
  try {
    children = await prisma.parentChildLink.findMany({
      where:   { parentId, status: "active" as any },
      include: { child: { select: { id: true, name: true, gradeLevel: true } } },
      orderBy: { createdAt: "asc" },
    }) as any;
  } catch {
    // Table may not exist yet — fall back to onboarding
  }

  if (children.length === 0) {
    redirect("/parent/onboarding");
  }

  if (children.length === 1) {
    redirect(`/parent/dashboard?childId=${children[0]!.childId}`);
  }

  // ── 2+ children: render child picker ────────────────────────────────────

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-4xl mb-3">👨‍👩‍👧‍👦</p>
          <h1 className="text-xl font-bold text-gray-900">Who is learning today?</h1>
          <p className="text-sm text-gray-500 mt-1">Choose a child to view their progress</p>
        </div>

        <div className="space-y-3">
          {children.map((link) => {
            const child = link.child;
            const gradeLabel = child.gradeLevel ? `Grade ${(child.gradeLevel as string).replace("G", "")}` : "";
            return (
              <Link
                key={child.id}
                href={`/parent/dashboard?childId=${child.id}`}
                className="flex items-center gap-4 bg-white rounded-xl p-4 border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition active:scale-[0.98]"
              >
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-lg font-bold text-white shrink-0">
                  {child.name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{child.name}</p>
                  {gradeLabel && <p className="text-xs text-gray-400 mt-0.5">{gradeLabel}</p>}
                </div>
                <span className="text-gray-300 text-sm shrink-0">&rarr;</span>
              </Link>
            );
          })}
        </div>

        {/* Add another child */}
        <Link
          href="/parent/onboarding"
          className="mt-6 flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 text-sm font-semibold hover:border-indigo-300 hover:text-indigo-600 transition active:scale-[0.98]"
        >
          <span className="text-lg">+</span> Add another child
        </Link>
      </div>
    </div>
  );
}

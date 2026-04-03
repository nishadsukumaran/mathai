/**
 * @module apps/web/app/api/parent/children
 *
 * GET /api/parent/children — returns the authenticated parent's linked children.
 * Used by ParentNav client component for the child switcher dropdown.
 */

import { NextResponse }     from "next/server";
import { getServerSession }  from "next-auth";
import { authOptions }       from "@/lib/auth";
import { prisma }            from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ children: [] }, { status: 401 });
    }
    const parentId = (session.user as { id?: string }).id ?? "";

    const links = await prisma.parentChildLink.findMany({
      where:   { parentId, status: "active" as any },
      include: { child: { select: { id: true, name: true, gradeLevel: true } } },
      orderBy: { createdAt: "asc" },
    });

    const children = links.map((l) => ({
      id:    l.child.id,
      name:  l.child.name,
      grade: (l.child.gradeLevel as string) ?? null,
    }));

    return NextResponse.json({ children });
  } catch {
    return NextResponse.json({ children: [] });
  }
}

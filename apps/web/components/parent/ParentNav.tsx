"use client";

/**
 * @module components/parent/ParentNav
 *
 * Parent portal navigation with child switcher dropdown.
 * Fetches linked children on mount; shows dropdown when 2+ children exist.
 */

import { useState, useEffect }                         from "react";
import Link                                             from "next/link";
import { usePathname, useSearchParams, useRouter }      from "next/navigation";
import { signOut, useSession }                          from "next-auth/react";

interface LinkedChild {
  id:    string;
  name:  string;
  grade: string | null;
}

const NAV_ITEMS = [
  { href: "/parent",     label: "Overview",  icon: "🏠" },
  { href: "/parent/ask", label: "Ask AI",    icon: "🤖" },
];

export default function ParentNav() {
  const pathname          = usePathname();
  const searchParams      = useSearchParams();
  const router            = useRouter();
  const { data: session } = useSession();
  const parentName        = session?.user?.name ?? "Parent";

  const [children, setChildren]   = useState<LinkedChild[]>([]);
  const [dropOpen, setDropOpen]   = useState(false);

  const activeChildId = searchParams.get("childId");
  const activeChild   = children.find((c) => c.id === activeChildId);
  const isOnboarding  = pathname?.startsWith("/parent/onboarding");

  // Fetch children list (skip on onboarding page)
  useEffect(() => {
    if (isOnboarding) return;
    fetch("/api/parent/children")
      .then((r) => r.json())
      .then((d) => setChildren(d.children ?? []))
      .catch(() => {});
  }, [isOnboarding, pathname]); // refetch when navigating back from onboarding

  function switchChild(childId: string) {
    setDropOpen(false);
    router.push(`/parent/dashboard?childId=${childId}`);
  }

  return (
    <header className="bg-white border-b border-slate-200 h-14 flex items-center px-4 sm:px-6 gap-4 sm:gap-6 shrink-0 shadow-sm">
      {/* Brand */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-indigo-600 font-black text-lg">MathAI</span>
        <span className="text-slate-400 text-sm font-semibold hidden sm:inline">Parent</span>
      </div>

      {/* Nav links */}
      <nav className="flex items-center gap-1">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const isActive = pathname === href || pathname?.startsWith(href + "/");
          return (
            <Link key={href} href={href}
              className={`px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
                isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}>
              {icon} <span className="hidden sm:inline">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Child switcher */}
      {children.length > 0 && !isOnboarding && (
        <div className="relative">
          {children.length === 1 ? (
            /* Single child — show name + add button */
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-600 hidden sm:inline">
                {children[0]!.name}
              </span>
              <Link href="/parent/onboarding" title="Add another child"
                className="w-7 h-7 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition text-sm">
                +
              </Link>
            </div>
          ) : (
            /* Multiple children — dropdown */
            <>
              <button onClick={() => setDropOpen(!dropOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-indigo-300 transition text-xs sm:text-sm font-semibold text-gray-700">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                  {activeChild?.name?.[0]?.toUpperCase() ?? "?"}
                </span>
                <span className="hidden sm:inline max-w-24 truncate">{activeChild?.name ?? "Select child"}</span>
                <span className="text-gray-400 text-[10px]">&#9662;</span>
              </button>

              {dropOpen && (
                <>
                  {/* Backdrop */}
                  <div className="fixed inset-0 z-20" onClick={() => setDropOpen(false)} />
                  {/* Dropdown */}
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-30 py-1 overflow-hidden">
                    {children.map((child) => {
                      const isActive = child.id === activeChildId;
                      return (
                        <button key={child.id} onClick={() => switchChild(child.id)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition ${
                            isActive ? "bg-indigo-50" : "hover:bg-gray-50"
                          }`}>
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            isActive ? "bg-indigo-500 text-white" : "bg-gray-100 text-gray-600"
                          }`}>
                            {child.name?.[0]?.toUpperCase() ?? "?"}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold truncate ${isActive ? "text-indigo-700" : "text-gray-700"}`}>
                              {child.name}
                            </p>
                            {child.grade && (
                              <p className="text-[10px] text-gray-400">Grade {child.grade.replace("G", "")}</p>
                            )}
                          </div>
                          {isActive && <span className="text-indigo-500 text-xs">&#10003;</span>}
                        </button>
                      );
                    })}
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <Link href="/parent/onboarding" onClick={() => setDropOpen(false)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition">
                        <span className="w-6 h-6 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs shrink-0">+</span>
                        <p className="text-xs font-semibold text-gray-500">Add another child</p>
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* User + sign out */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs text-slate-500 font-medium hidden md:inline">{parentName}</span>
        <button onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          className="text-xs text-slate-400 hover:text-red-500 font-semibold transition">
          Sign Out
        </button>
      </div>
    </header>
  );
}

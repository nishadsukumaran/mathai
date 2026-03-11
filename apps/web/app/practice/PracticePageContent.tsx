/**
 * @module apps/web/app/practice/PracticePageContent
 *
 * Thin "use client" shim that reads useSearchParams and passes them
 * to PracticeContainer. Must be inside Suspense (required by Next.js).
 */

"use client";

import { useSearchParams }   from "next/navigation";
import PracticeContainer     from "@/containers/PracticeContainer";

export default function PracticePageContent() {
  const params  = useSearchParams();
  const topicId = params.get("topicId") ?? "g3-ops-multiplication";
  const mode    = params.get("mode")    ?? "guided";

  return <PracticeContainer topicId={topicId} mode={mode} />;
}

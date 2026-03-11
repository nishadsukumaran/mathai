/**
 * @module apps/web/app/practice/PracticePageContent
 *
 * Thin "use client" shim that reads useSearchParams and passes them
 * to PracticeContainer. Must be inside Suspense (required by Next.js).
 */

"use client";

import { useEffect }         from "react";
import { useSearchParams }   from "next/navigation";
import { useRouter }         from "next/navigation";
import PracticeContainer     from "@/containers/PracticeContainer";

export default function PracticePageContent() {
  const params  = useSearchParams();
  const router  = useRouter();
  const topicId = params.get("topicId");
  const mode    = params.get("mode") ?? "guided";

  // Guard: no topicId means someone landed on /practice directly without
  // choosing a topic. Send them to the dashboard to pick one rather than
  // silently defaulting to a hardcoded G3 topic.
  useEffect(() => {
    if (!topicId) {
      router.replace("/dashboard");
    }
  }, [topicId, router]);

  if (!topicId) {
    // Render nothing while the redirect is in flight.
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    );
  }

  return <PracticeContainer topicId={topicId} mode={mode} />;
}

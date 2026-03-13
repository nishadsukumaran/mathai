"use client";

export default function ProgressError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="text-center max-w-sm p-8 bg-white rounded-3xl shadow-md border border-amber-100">
        <p className="text-4xl mb-4">😕</p>
        <h2 className="text-xl font-black text-gray-800 mb-2">
          Could not load progress
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          Something went wrong while loading your progress. Let&apos;s try again!
        </p>
        <button
          onClick={reset}
          className="inline-block bg-indigo-600 text-white font-bold px-6 py-3 rounded-2xl hover:bg-indigo-700 transition min-h-[44px]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

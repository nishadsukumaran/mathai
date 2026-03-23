"use client";

import type { StepPlayerControls, StepPlayerState } from "@/hooks/useStepPlayer";

interface StepControlsProps {
  state: StepPlayerState;
  controls: StepPlayerControls;
}

export function StepControls({ state, controls }: StepControlsProps) {
  const { isPlaying, isComplete, currentStep, totalSteps } = state;

  return (
    <div className="flex items-center justify-center gap-3 py-3 px-4 border-t border-indigo-100">
      <button
        onClick={controls.back}
        disabled={currentStep === 0}
        aria-label="Previous step"
        className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 disabled:opacity-30 transition"
      >
        ⏮ Back
      </button>

      <button
        onClick={isPlaying ? controls.pause : controls.play}
        aria-label={isPlaying ? "Pause" : "Play"}
        className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
      >
        {isPlaying ? "⏸ Pause" : isComplete ? "▶ Play" : "▶ Play"}
      </button>

      <button
        onClick={controls.next}
        disabled={isComplete}
        aria-label="Next step"
        className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 disabled:opacity-30 transition"
      >
        Next ⏭
      </button>

      <button
        onClick={controls.replay}
        aria-label="Replay"
        className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 transition"
      >
        ↻ Replay
      </button>
    </div>
  );
}

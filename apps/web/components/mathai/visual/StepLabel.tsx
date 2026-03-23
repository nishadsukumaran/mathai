"use client";

interface StepLabelProps {
  currentStep: number;
  totalSteps: number;
  label: string;
}

export function StepLabel({ currentStep, totalSteps, label }: StepLabelProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-indigo-100">
      <div aria-live="polite" aria-atomic>
        <span className="text-amber-600 font-semibold text-sm">
          Step {currentStep + 1} of {totalSteps}
        </span>
        <span className="text-gray-600 ml-3 text-sm">{label}</span>
      </div>

      <div className="flex gap-1">
        {Array.from({ length: totalSteps }, (_, i) => (
          <span
            key={i}
            className={`w-6 h-1 rounded-full transition-colors ${
              i <= currentStep ? "bg-green-400" : "bg-gray-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

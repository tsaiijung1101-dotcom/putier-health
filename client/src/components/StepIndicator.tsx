import { Check } from "lucide-react";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps?: number;
}

const STEPS = [
  { label: "基本資料" },
  { label: "症狀勾選" },
  { label: "修復報告" },
];

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0 py-2">
      {STEPS.map((step, index) => {
        const stepNum = index + 1;
        const isCompleted = stepNum < currentStep;
        const isActive = stepNum === currentStep;

        return (
          <div key={stepNum} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`step-dot ${isCompleted ? "completed" : isActive ? "active" : "inactive"}`}
              >
                {isCompleted ? <Check size={14} /> : stepNum}
              </div>
              <span
                className={`text-xs mt-1 font-medium ${
                  isActive ? "text-white" : isCompleted ? "text-[#22C55E]" : "text-white/50"
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`h-0.5 w-12 mx-1 mb-4 transition-all duration-500 ${
                  stepNum < currentStep ? "bg-[#22C55E]" : "bg-white/30"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

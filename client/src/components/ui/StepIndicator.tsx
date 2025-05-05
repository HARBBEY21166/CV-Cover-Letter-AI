import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  step: number;
  currentStep: number;
  label: string;
}

export default function StepIndicator({ step, currentStep, label }: StepIndicatorProps) {
  const isActive = currentStep >= step;
  
  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
          isActive ? "bg-primary text-white" : "bg-gray-200 text-gray-400"
        )}
      >
        {step}
      </div>
      <span className="mt-1 text-xs text-gray-500">{label}</span>
    </div>
  );
}

import { useAssessment } from "@/contexts/AssessmentContext";
import StepIndicator from "@/components/StepIndicator";
import Step1BasicInfo from "@/components/assessment/Step1BasicInfo";
import Step2Symptoms from "@/components/assessment/Step2Symptoms";
import Step3Report from "@/components/assessment/Step3Report";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function Assessment() {
  const { state, setStep } = useAssessment();
  const [, navigate] = useLocation();
  const { step } = state;

  const handleBack = () => {
    if (step === 1) {
      navigate("/");
    } else {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--putier-bg)" }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10 shadow-sm"
        style={{ background: "#1B4965" }}
      >
        <div className="container flex items-center gap-3 py-3">
          <button
            onClick={handleBack}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-white font-bold text-base flex-1">
            {step === 1 ? "基本資料" : step === 2 ? "症狀勾選" : "修復報告"}
          </h1>
          <span className="text-white/60 text-xs">{step}/3</span>
        </div>
        <div className="container pb-1">
          <StepIndicator currentStep={step} />
        </div>
      </div>

      {/* Content */}
      <div className="container py-4">
        {step === 1 && <Step1BasicInfo />}
        {step === 2 && <Step2Symptoms />}
        {step === 3 && <Step3Report />}
      </div>
    </div>
  );
}

import { useState } from "react";
import { useAssessment } from "@/contexts/AssessmentContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SYMPTOM_CATEGORIES } from "../../../../shared/healthData";
import { ChevronRight, ChevronDown, Check, ClipboardList } from "lucide-react";
import { toast } from "sonner";

export default function Step2Symptoms() {
  const { state, toggleSymptom, setCustomDemand, setStep } = useAssessment();
  const { basicInfo, selectedSymptoms, customDemand } = state;
  const gender = basicInfo.gender as "male" | "female" | "";
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(SYMPTOM_CATEGORIES.map(c => c.id))
  );

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const handleNext = () => {
    if (selectedSymptoms.length === 0 && !customDemand.trim()) {
      toast.error("請至少勾選一項保健需求，或在最下方填寫您的自訂保健需求！");
      return;
    }
    setStep(3);
  };

  // Filter categories based on gender
  const visibleCategories = SYMPTOM_CATEGORIES.filter(cat => {
    // Female category only visible to female
    if (cat.id === "female" && gender !== "female") return false;
    return true;
  });

  return (
    <div className="space-y-3 pb-6">
      {/* Info */}
      <div className="putier-card bg-blue-50 border-blue-100">
        <p className="text-sm text-[#1B4965] font-medium">
          請勾選您目前有的保健需求（可多選）
        </p>
        <p className="text-xs text-gray-500 mt-1">
          已選擇 <span className="font-bold text-[#1B4965]">{selectedSymptoms.length}</span> 項保健需求
        </p>
      </div>

      {/* Categories */}
      {visibleCategories.map(category => {
        const isExpanded = expandedCategories.has(category.id);
        const visibleItems = category.items.filter(item => {
          if (item.genderFilter && item.genderFilter !== gender) return false;
          return true;
        });
        const selectedCount = visibleItems.filter(item =>
          selectedSymptoms.includes(item.id)
        ).length;

        return (
          <div key={category.id} className="putier-card p-0 overflow-hidden">
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="text-lg">{category.emoji}</span>
              <div className="flex-1">
                <span className="text-sm font-bold text-[#1B4965]">{category.name}</span>
                {selectedCount > 0 && (
                  <span className="ml-2 text-xs bg-[#22C55E] text-white px-1.5 py-0.5 rounded-full font-medium">
                    {selectedCount}
                  </span>
                )}
              </div>
              {isExpanded ? (
                <ChevronDown size={16} className="text-gray-400" />
              ) : (
                <ChevronRight size={16} className="text-gray-400" />
              )}
            </button>

            {/* Symptoms */}
            {isExpanded && (
              <div className="px-4 pb-3 grid grid-cols-1 gap-2">
                {visibleItems.map(item => {
                  const isSelected = selectedSymptoms.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleSymptom(item.id)}
                      className={`symptom-item ${isSelected ? "selected" : ""}`}
                    >
                      <div
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                          isSelected
                            ? "bg-[#1B4965] border-[#1B4965]"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        {isSelected && <Check size={12} className="text-white" />}
                      </div>
                      <span className="text-sm text-gray-700">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Summary */}
      {selectedSymptoms.length > 0 && (
        <div className="putier-card bg-green-50 border-green-100">
          <p className="text-xs font-bold text-green-700 mb-2">
            ✅ 已選擇 {selectedSymptoms.length} 項保健需求
          </p>
          <div className="flex flex-wrap gap-1">
            {SYMPTOM_CATEGORIES.flatMap(cat =>
              cat.items.filter(item => selectedSymptoms.includes(item.id))
            ).map(item => (
              <span
                key={item.id}
                className="text-xs bg-white border border-green-200 text-green-700 px-2 py-0.5 rounded-full"
              >
                {item.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 其它保健需求 */}
      <div className="putier-card">
        <div className="flex items-center gap-2 mb-2">
          <ClipboardList size={16} className="text-[#1B4965]" />
          <Label className="text-sm font-bold text-[#1B4965]">其他保健需求（選填）</Label>
        </div>
        <p className="text-xs text-gray-400 mb-3">若上面沒有您想改善的症狀，請在此輸入您特別想改善的保健需求...</p>
        <Textarea
          placeholder="例如：希望改善長期偏頭痛、或是提升睡眠品質..."
          value={customDemand}
          onChange={e => setCustomDemand(e.target.value)}
          className="rounded-xl resize-none text-sm bg-white"
          rows={3}
        />
      </div>

      {/* Next Button */}
      <Button
        onClick={handleNext}
        className="w-full h-13 text-base font-bold rounded-xl shadow-lg"
        style={{ background: "#1B4965", color: "white" }}
      >
        下一步：生成修復報告
        <ChevronRight size={18} className="ml-1" />
      </Button>
    </div>
  );
}

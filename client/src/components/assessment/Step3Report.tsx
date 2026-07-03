import { useState, useEffect, useCallback } from "react";
import { useAssessment } from "@/contexts/AssessmentContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  SYMPTOM_CATEGORIES,
  HERX_REACTIONS,
  INGREDIENTS,
  HERX_EXPLANATION,
  CELL_REPAIR_ADVANTAGES,
  calculateDosage,
  calculateBMI,
  calculateDailyWater,
  generateSecretary,
} from "../../../../shared/healthData";
import {
  ChevronDown,
  ChevronUp,
  Share2,
  RefreshCw,
  Minus,
  Plus,
  Heart,
  Droplets,
  Activity,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Helpers ───────────────────────────────────────────────
function calcAge(birthdate: string): number {
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function getIngredient(id: string) {
  return INGREDIENTS.find(i => i.id === id);
}

function getSymptomLabel(id: string): string {
  for (const cat of SYMPTOM_CATEGORIES) {
    const item = cat.items.find(i => i.id === id);
    if (item) return item.label;
  }
  return id;
}

function getCategoryName(symptomId: string): string {
  for (const cat of SYMPTOM_CATEGORIES) {
    if (cat.items.find(i => i.id === symptomId)) return cat.name;
  }
  return "";
}

// ── Accordion ─────────────────────────────────────────────
function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="accordion-item">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="text-sm font-bold text-[#1B4965]">{title}</span>
        {open ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
      </button>
      {open && (
        <div className="px-4 py-3 text-sm text-gray-600 leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────
export default function Step3Report() {
  const { state, setSavedAssessmentId } = useAssessment();
  const { basicInfo, selectedSymptoms } = state;

  const age = calcAge(basicInfo.birthdate);
  const gender = basicInfo.gender as "male" | "female";
  const weight = basicInfo.weight ? parseFloat(basicInfo.weight) : undefined;
  const height = basicInfo.height ? parseFloat(basicInfo.height) : undefined;

  const [setCount, setSetCount] = useState(1);
  const [saved, setSaved] = useState(false);

  // Calculate dosage
  const dosage = calculateDosage(age, gender, selectedSymptoms, weight, setCount);
  const bmiData = weight && height ? calculateBMI(weight, height) : null;
  const waterData = weight ? calculateDailyWater(weight) : null;

  // Secretary message
  const secretaryMsg = generateSecretary(basicInfo.nickname, selectedSymptoms);

  // Get herx reactions for selected symptoms
  const herxData = selectedSymptoms
    .map(symptomId => {
      const reaction = HERX_REACTIONS.find(r => r.symptomId === symptomId);
      if (!reaction) return null;
      return { symptomId, reaction, label: getSymptomLabel(symptomId), category: getCategoryName(symptomId) };
    })
    .filter(Boolean) as Array<{
      symptomId: string;
      reaction: (typeof HERX_REACTIONS)[0];
      label: string;
      category: string;
    }>;

  // Group by category
  const herxByCategory = herxData.reduce<Record<string, typeof herxData>>((acc, item) => {
    const cat = item.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  // Save to DB
  const createAssessment = trpc.assessment.create.useMutation({
    onSuccess: (data) => {
      setSavedAssessmentId(data.id);
      setSaved(true);
    },
    onError: (err) => {
      console.error("Save error:", err);
    },
  });

  const saveReport = useCallback(() => {
    if (saved) return;
    createAssessment.mutate({
      lineId: basicInfo.lineId || undefined,
      nickname: basicInfo.nickname,
      birthdate: basicInfo.birthdate,
      gender,
      height: height ?? undefined,
      weight: weight ?? undefined,
      medications: basicInfo.medications || undefined,
      surgeryHistory: basicInfo.surgeryHistory || undefined,
      selectedSymptoms,
      medicationImages: basicInfo.medicationImages.length > 0
        ? basicInfo.medicationImages
        : undefined,
      recommendedDosage: dosage.dailyCapsules,
      firstSetDays: dosage.firstSetDays,
      setCount,
      bmi: bmiData?.bmi ?? undefined,
      dailyWater: waterData?.ml ?? undefined,
    });
  }, [saved]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    saveReport();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // LINE Share
  const handleLineShare = () => {
    const symptomList = selectedSymptoms.map(id => `• ${getSymptomLabel(id)}`).join("\n");
    // Build per-symptom herx summary
    const herxSummary = selectedSymptoms
      .map(id => {
        const reaction = HERX_REACTIONS.find(r => r.symptomId === id);
        if (!reaction) return null;
        const firstReaction = reaction.possibleReactions[0] || "";
        return `• ${getSymptomLabel(id)}：${firstReaction}`;
      })
      .filter(Boolean)
      .join("\n");

    const text = `🌿 Putier 好轉反應評估報告

👤 ${basicInfo.nickname}（${age}歲 ${gender === "male" ? "男性" : "女性"}）

📋 保健需求：
${symptomList}

✨ 好轉反應預估（節錄）：
${herxSummary || "（依個人體質而異）"}

💊 服用建議：每日 ${dosage.dailyCapsules} 顆
📅 首套天數：${dosage.firstSetDays} 天
⏱ 改善週期：${dosage.improvementCycles}
${bmiData ? `\n📊 BMI：${bmiData.bmi}（${bmiData.category}）` : ""}
${waterData ? `💧 每日建議喝水：${waterData.liters} 公升` : ""}

💚 小秘書提醒：
${secretaryMsg}

#Putier #好轉反應 #細胞修復`;

    const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
    window.open(lineUrl, "_blank");
  };

  return (
    <div className="space-y-4 pb-8">
      {/* 1. Basic Info Summary */}
      <div className="putier-card">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-[#1B4965] flex items-center justify-center">
            <Activity size={14} className="text-white" />
          </div>
          <h2 className="putier-section-title mb-0">基本資料</h2>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-xs text-gray-500">姓名</div>
            <div className="font-bold text-gray-800 mt-0.5">{basicInfo.nickname}</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-xs text-gray-500">年齡</div>
            <div className="font-bold text-gray-800 mt-0.5">{age} 歲</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-xs text-gray-500">性別</div>
            <div className="font-bold text-gray-800 mt-0.5">{gender === "male" ? "♂ 男性" : "♀ 女性"}</div>
          </div>
          {bmiData && (
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-xs text-gray-500">BMI</div>
              <div className="font-bold text-gray-800 mt-0.5">
                {bmiData.bmi} <span className="text-xs font-normal text-gray-500">({bmiData.category})</span>
              </div>
            </div>
          )}
        </div>
        {/* Selected symptoms summary */}
        {selectedSymptoms.length > 0 && (
          <div className="mt-3">
            <div className="text-xs text-gray-500 mb-1.5">保健需求（{selectedSymptoms.length} 項）</div>
            <div className="flex flex-wrap gap-1">
              {selectedSymptoms.map(id => (
                <span
                  key={id}
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: "#EDE9FE", color: "#7C3AED" }}
                >
                  {getSymptomLabel(id)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Dosage Recommendation */}
      <div className="putier-card">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-[#22C55E] flex items-center justify-center">
            <Heart size={14} className="text-white" />
          </div>
          <h2 className="putier-section-title mb-0">服用建議與預估時間</h2>
        </div>

        {/* Dosage highlight */}
        <div
          className="rounded-2xl p-4 mb-3 text-center"
          style={{ background: "linear-gradient(135deg, #1B4965, #2d6a8f)" }}
        >
          <div className="text-white/70 text-xs mb-1">建議每日服用</div>
          <div className="text-white text-4xl font-bold">{dosage.dailyCapsules}</div>
          <div className="text-white/70 text-sm">顆 / 天</div>
        </div>

        {/* Set count adjuster */}
        <div className="bg-gray-50 rounded-xl p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-700">套數調整</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSetCount(s => Math.max(1, s - 1))}
                className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <Minus size={14} />
              </button>
              <span className="text-lg font-bold text-[#1B4965] w-8 text-center">{setCount}</span>
              <button
                onClick={() => setSetCount(s => Math.min(12, s + 1))}
                className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <RefreshCw size={12} />
            <span>1 套 = 60 顆，調整套數後自動重新計算</span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <div className="text-xs text-blue-600 font-medium">首套天數</div>
            <div className="text-2xl font-bold text-[#1B4965] mt-1">{dosage.firstSetDays}</div>
            <div className="text-xs text-blue-600">天</div>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <div className="text-xs text-green-600 font-medium">總顆數</div>
            <div className="text-2xl font-bold text-green-700 mt-1">{setCount * 60}</div>
            <div className="text-xs text-green-600">顆</div>
          </div>
        </div>

        {/* Improvement cycle */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-3">
          <div className="text-xs font-bold text-amber-700 mb-1">⏱ 預計改善週期</div>
          <p className="text-xs text-amber-800 leading-relaxed">{dosage.improvementCycles}</p>
        </div>

        {/* Water guide */}
        {waterData && (
          <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-3 mb-3">
            <div className="flex items-center gap-2 mb-1">
              <Droplets size={14} className="text-cyan-600" />
              <div className="text-xs font-bold text-cyan-700">每日建議喝水量</div>
            </div>
            <div className="text-2xl font-bold text-cyan-700">{waterData.liters} <span className="text-sm font-normal">公升</span></div>
            <p className="text-xs text-cyan-600 mt-1">{waterData.ml} ml / 天（體重 × 35ml）</p>
          </div>
        )}

        {/* Dosage guide */}
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="text-xs font-bold text-gray-700 mb-1">💊 服用指南</div>
          <p className="text-xs text-gray-600 leading-relaxed">{dosage.dosageGuide}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 mt-2">
          <div className="text-xs font-bold text-gray-700 mb-1">💧 喝水指南</div>
          <p className="text-xs text-gray-600 leading-relaxed">{dosage.waterGuide}</p>
        </div>
      </div>

      {/* 3. Herx Reactions */}
      {herxData.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#7C3AED" }}>
              <Sparkles size={14} className="text-white" />
            </div>
            <h2 className="text-base font-bold text-[#1B4965]">症狀對應之好轉反應預估</h2>
          </div>

          {Object.entries(herxByCategory).map(([catName, items]) => (
            <div key={catName}>
              <div className="text-xs font-bold text-purple-600 mb-2 px-1">
                {SYMPTOM_CATEGORIES.find(c => c.name === catName)?.emoji} {catName}
              </div>
              {items.map(({ symptomId, reaction, label }) => (
                <div key={symptomId} className="herx-card mb-3">
                  <div className="herx-card-header">
                    <h3 className="text-sm font-bold">{label}</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {/* Possible reactions */}
                    <div>
                      <div className="text-xs font-bold text-purple-700 mb-1.5">可能好轉反應：</div>
                      <ul className="space-y-1">
                        {reaction.possibleReactions.map((r, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                            <span className="text-purple-400 mt-0.5">•</span>
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Ingredients */}
                    <div>
                      <div className="text-xs font-bold text-purple-700 mb-1.5">原因成分有：</div>
                      <div className="flex flex-wrap gap-1">
                        {reaction.ingredients.map(ingId => {
                          const ing = getIngredient(ingId);
                          return ing ? (
                            <span
                              key={ingId}
                              className="ingredient-tag"
                              style={{ background: ing.color }}
                            >
                              {ing.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>

                    {/* Improvement */}
                    <div>
                      <div className="text-xs font-bold text-purple-700 mb-1.5">身體改善：</div>
                      <p className="text-xs text-gray-600 leading-relaxed">{reaction.improvement}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Secretary */}
          <div className="secretary-box">
            <div className="flex items-start gap-2">
              <div className="text-2xl flex-shrink-0">🤖</div>
              <div>
                <div className="text-xs font-bold text-green-700 mb-1">小秘書溫馨結論</div>
                <p className="text-xs text-green-800 leading-relaxed">{secretaryMsg}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Herx Explanation Accordion */}
      <div>
        <Accordion title={`📚 ${HERX_EXPLANATION.title}`}>
          <div className="space-y-3">
            <div className="whitespace-pre-line text-xs text-gray-600 leading-relaxed">
              {HERX_EXPLANATION.content}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1">
                <BookOpen size={12} />
                文獻出處
              </div>
              {HERX_EXPLANATION.references.map((ref, i) => (
                <p key={i} className="text-xs text-gray-400 mb-1">
                  [{i + 1}] {ref}
                </p>
              ))}
            </div>
          </div>
        </Accordion>
      </div>

      {/* 5. Cell Repair Advantages Accordion */}
      <div>
        <Accordion title={`🔬 ${CELL_REPAIR_ADVANTAGES.title}`}>
          <div className="space-y-3">
            <div className="space-y-2">
              {CELL_REPAIR_ADVANTAGES.technologies.map((tech, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                      style={{ background: "#22C55E" }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-xs font-bold text-[#1B4965]">{tech.name}</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed pl-7">{tech.description}</p>
                </div>
              ))}
            </div>
            <div className="whitespace-pre-line text-xs text-gray-600 leading-relaxed mt-3">
              {CELL_REPAIR_ADVANTAGES.content}
            </div>
          </div>
        </Accordion>
      </div>

      {/* LINE Share Button */}
      <Button
        onClick={handleLineShare}
        className="w-full h-13 text-base font-bold rounded-xl shadow-lg"
        style={{ background: "#06C755", color: "white" }}
      >
        <Share2 size={18} className="mr-2" />
        LINE 分享報告
      </Button>

      {saved && (
        <p className="text-center text-xs text-gray-400">
          ✅ 報告已自動儲存
          {basicInfo.lineId && ` · LINE ID: ${basicInfo.lineId}`}
        </p>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
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
  Home,
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
// Helper: Detect severe conditions
function detectSevereConditions(medications: string, surgicalHistory: string): boolean {
  const severeKeywords = ["愛滋症", "癌症", "洗腎", "紅斑狼瘡", "糖尿病嚴重", "紅斑狼瘡病"];
  const fullText = (medications + surgicalHistory).toLowerCase();
  return severeKeywords.some(keyword => fullText.includes(keyword.toLowerCase()));
}

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
  const [, navigate] = useLocation();
  const { state, setSavedAssessmentId, resetAssessment } = useAssessment();
  const { basicInfo, selectedSymptoms } = state;

  const age = calcAge(basicInfo.birthdate);
  const gender = basicInfo.gender as "male" | "female";
  const weight = basicInfo.weight ? parseFloat(basicInfo.weight) : undefined;
  const height = basicInfo.height ? parseFloat(basicInfo.height) : undefined;

  const [setCount, setSetCount] = useState(1);
  const [saved, setSaved] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const hasSevereCondition = detectSevereConditions(basicInfo.medications || "", basicInfo.surgeryHistory || "");

  // Calculate dosage FIRST
  const dosage = calculateDosage(age, gender, selectedSymptoms, weight, setCount);

  // Calculate days based on severe condition status
  const calculateDays = (sets: number) => {
    const totalCaps = sets * 420;
    if (hasSevereCondition) {
      // For severe conditions, use fixed range lookup table
      const rangeMap: Record<number, { min: number; max: number }> = {
        1: { min: 75, max: 95 },
        2: { min: 150, max: 180 },
        3: { min: 225, max: 260 },
        5: { min: 380, max: 430 },
      };
      const range = rangeMap[sets] || { min: 75, max: 95 }; // Default to 1-set range
      return { min: range.min, max: range.max, isRange: true };
    } else {
      // For normal conditions, return fixed value
      const days = Math.round(totalCaps / dosage.dailyCapsules);
      return { min: days, max: days, isRange: false };
    }
  };

  const daysData = calculateDays(setCount);
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

  // Extract all unique reactions for summary
  const allReactions = Array.from(
    new Set(herxData.flatMap(item => item.reaction.possibleReactions))
  );

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
  }, [saved, dosage, basicInfo, selectedSymptoms, height, weight, bmiData, waterData]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    saveReport();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // LINE Share
  const handleLineShare = () => {
    const symptomList = selectedSymptoms.map(id => `• ${getSymptomLabel(id)}`).join("\n");

    // Build a concise message that fits within LINE's URL length limit (~2000 chars)
    let text = `🌿 Putier 好轉反應評估報告\n\n👤 ${basicInfo.nickname}（${age}歲 ${gender === "male" ? "男性" : "女性"}）\n\n📋 保健需求（${selectedSymptoms.length}項）：\n${symptomList}\n\n💊 每日建議：${dosage.dailyCapsules} 顆\n📅 首套天數：${dosage.firstSetDays} 天\n⏱ 改善週期：${dosage.improvementCycles}`;

    if (bmiData) text += `\n📊 BMI：${bmiData.bmi}（${bmiData.category}）`;
    if (waterData) text += `\n💧 每日喝水：${waterData.liters} 公升`;

    text += `\n\n#Putier #好轉反應 #細胞修復`;

    // Ensure URL stays within safe length limit (LINE returns 400 if URL > ~2000 chars)
    const MAX_TEXT_LENGTH = 300;
    if (text.length > MAX_TEXT_LENGTH) {
      text = text.substring(0, MAX_TEXT_LENGTH - 3) + "...";
    }

    const lineUrl = `https://line.me/R/share?text=${encodeURIComponent(text)}`;
    window.open(lineUrl, "_blank");
  };

  const toggleCategory = (catName: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catName]: !prev[catName]
    }));
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

      {/* 2. Severe Condition Warning */}
      {hasSevereCondition && (
        <div className="putier-card bg-red-50 border-2 border-red-300">
          <div className="flex items-start gap-2 mb-2">
            <span className="text-2xl flex-shrink-0">🚨</span>
            <h3 className="text-sm font-bold text-red-800">專業健康指引（特殊調養對象專屬）</h3>
          </div>
          <p className="text-xs text-red-800 leading-relaxed whitespace-pre-wrap">
            偵測到您目前有較為特殊的身體調養需求（如癌症、洗腎或嚴重血糖波動）。本產品能為您提供此期間極高密度的原料支持，但因重症對象的新陳代謝與生理平衡較為敏感，【強烈建議您採取「分階段、溫和漸進式」的方法，根據自身每天的實際狀態來評估增量】：

- 【第 1 - 3 天（身體開機期）】：每日僅服用 1 顆，讓身體溫和適應。
- 【第 4 - 7 天（基礎修復期）】：若無劇烈好轉反應，可調整為每日 2 顆（早晚各 1）。
- 【第二週起（元氣加壓期）】：若身體狀態良好、適應順暢，可再根據自身實際體感與顧問指導，安心且逐步增量至每日 4-6 顆。

💡 請務必將本食品與您的西藥、化放療或標靶藥物前後【嚴格隔開 2 小時以上】服用，並確保每日充足飲水（洗腎患者請遵照醫囑限水量分次小口飲用）。
          </p>
        </div>
      )}

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

        {/* Set count dropdown selector */}
        <div className="bg-gray-50 rounded-xl p-3 mb-3">
          <label className="text-sm font-bold text-gray-700 block mb-2">選擇產品套數</label>
          <select
            value={setCount}
            onChange={(e) => setSetCount(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:border-[#1B4965] focus:ring-1 focus:ring-[#1B4965]"
          >
            <option value={1}>1 套 (420 顆)</option>
            <option value={2}>2 套 (840 顆)</option>
            <option value={3}>3 套 (1,260 顆)</option>
            <option value={5}>5 套 (2,100 顆)</option>
          </select>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
            <RefreshCw size={12} />
            <span>套數改變時，天數會自動更新</span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <div className="text-xs text-blue-600 font-medium">可服用天數</div>
            <div className="text-2xl font-bold text-[#1B4965] mt-1">
              {daysData.isRange ? `${daysData.min} - ${daysData.max}` : daysData.min}
            </div>
            <div className="text-xs text-blue-600">{daysData.isRange ? "天（預估範圍）" : "天"}</div>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <div className="text-xs text-green-600 font-medium">總顆數</div>
            <div className="text-2xl font-bold text-green-700 mt-1">{setCount * 420}</div>
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

        {/* Regulatory Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mt-3">
          <p className="text-xs text-blue-800 leading-relaxed whitespace-pre-wrap">{dosage.regulatoryNotice}</p>
        </div>
      </div>

      {/* 3. Herx Reactions - Restructured */}
      {herxData.length > 0 && (
        <div className="putier-card space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#7C3AED" }}>
              <Sparkles size={14} className="text-white" />
            </div>
            <h2 className="text-base font-bold text-[#1B4965]">症狀對應之好轉反應預估</h2>
          </div>

          {/* Layer 1: Overall Summary */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <div className="text-xs font-bold text-purple-800 mb-3">✨ 本次可能出現的好轉反應症狀彙整：</div>
            <div className="flex flex-wrap gap-2 mb-3">
              {allReactions.map((reaction, i) => (
                <span key={i} className="inline-block bg-purple-200 text-purple-800 text-xs font-medium px-3 py-1.5 rounded-full">
                  {reaction}
                </span>
              ))}
            </div>
            <p className="text-xs text-purple-700 leading-relaxed">
              💡 <strong>提示：</strong>以上症狀為可能的好轉反應，不一定全部出現，且因人而異。請點擊下方各項保健需求，查看詳細的成分修復機制與改善原理。
            </p>
          </div>

          {/* Layer 2: Detailed Accordion */}
          <div className="space-y-2">
            {Object.entries(herxByCategory).map(([catName, items]) => {
              const isOpen = expandedCategories[catName] || false;
              const catEmoji = SYMPTOM_CATEGORIES.find(c => c.name === catName)?.emoji;
              return (
                <div key={catName} className="border border-purple-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleCategory(catName)}
                    className="w-full px-4 py-3 flex items-center justify-between bg-purple-50 hover:bg-purple-100 transition-colors"
                  >
                    <div className="flex items-center gap-2 text-left">
                      <span className="text-lg">{catEmoji}</span>
                      <span className="text-sm font-bold text-purple-800">{catName}</span>
                      <span className="text-xs text-purple-600 ml-1">({items.length} 項)</span>
                    </div>
                    {isOpen ? (
                      <ChevronUp size={16} className="text-purple-600" />
                    ) : (
                      <ChevronDown size={16} className="text-purple-600" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="p-4 space-y-4 bg-white">
                      {items.map(({ symptomId, reaction, label }) => (
                        <div key={symptomId} className="border-l-4 border-purple-300 pl-4">
                          <h4 className="text-sm font-bold text-purple-800 mb-3">{label}</h4>

                          {/* Possible reactions */}
                          <div className="mb-3">
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
                          <div className="mb-3">
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
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

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
          <div className="space-y-4">
            {CELL_REPAIR_ADVANTAGES.advantages.map((adv, i) => (
              <div key={i} className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-start gap-3 mb-2">
                  <span className="text-2xl flex-shrink-0">{adv.emoji}</span>
                  <h4 className="text-sm font-bold text-[#1B4965]">{adv.title}</h4>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed ml-9">{adv.description}</p>
              </div>
            ))}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-600 font-semibold mb-2">📚 文獻出處：</p>
              <ul className="space-y-1">
                {CELL_REPAIR_ADVANTAGES.references.map((ref, i) => (
                  <li key={i} className="text-xs text-gray-600 leading-relaxed">• {ref}</li>
                ))}
              </ul>
            </div>
          </div>
        </Accordion>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4">
        <Button
          onClick={handleLineShare}
          className="flex-1 bg-[#22C55E] hover:bg-green-600 text-white"
        >
          <Share2 size={14} className="mr-1" />
          LINE 分享
        </Button>
      </div>

      {/* 返回首頁按鈕 */}
      <div className="pt-2 pb-4">
        <Button
          onClick={() => {
            resetAssessment();
            navigate("/");
          }}
          variant="outline"
          className="w-full h-12 text-sm font-bold rounded-xl border-2 border-[#1B4965] text-[#1B4965] hover:bg-[#1B4965]/5"
        >
          <Home size={16} className="mr-2" />
          返回首頁
        </Button>
      </div>
    </div>
  );
}

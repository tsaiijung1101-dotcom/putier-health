import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2 } from "lucide-react";
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
} from "../../../shared/healthData";
import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Share2,
  Sparkles,
  Heart,
  Droplets,
  Activity,
  BookOpen,
  Minus,
  Plus,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function calcAge(birthdate: string): number {
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
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

function getIngredient(id: string) {
  return INGREDIENTS.find(i => i.id === id);
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

export default function Report() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const id = parseInt(params.id || "0");
  const [setCount, setSetCount] = useState(1);

  const { data, isLoading, error } = trpc.assessment.getById.useQuery(
    { id },
    { enabled: !!id }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--putier-bg)" }}>
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-[#1B4965] mx-auto mb-3" />
          <p className="text-sm text-gray-500">載入報告中...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--putier-bg)" }}>
        <div className="text-center px-4">
          <p className="text-gray-500 mb-4">找不到此評估報告</p>
          <Button onClick={() => navigate("/")} style={{ background: "#1B4965", color: "white" }}>
            返回首頁
          </Button>
        </div>
      </div>
    );
  }

  const age = calcAge(data.birthdate);
  const gender = data.gender as "male" | "female";
  const selectedSymptoms = data.selectedSymptoms as string[];
  const weight = data.weight ?? undefined;
  const height = data.height ?? undefined;

  const dosage = calculateDosage(age, gender, selectedSymptoms, weight, setCount);
  const bmiData = weight && height ? calculateBMI(weight, height) : null;
  const waterData = weight ? calculateDailyWater(weight) : null;
  const secretaryMsg = generateSecretary(data.nickname, selectedSymptoms);

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

  const herxByCategory = herxData.reduce<Record<string, typeof herxData>>((acc, item) => {
    const cat = item.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const handleLineShare = () => {
    const symptomList = selectedSymptoms.map(id => `• ${getSymptomLabel(id)}`).join("\n");

    // Build per-symptom herx summary (limit to first 3 for URL safety)
    const herxSummary = selectedSymptoms
      .slice(0, 3)
      .map(id => {
        const reaction = HERX_REACTIONS.find(r => r.symptomId === id);
        if (!reaction) return null;
        const firstReaction = reaction.possibleReactions[0] || "";
        return `• ${getSymptomLabel(id)}：${firstReaction}`;
      })
      .filter(Boolean)
      .join("\n");

    // Build the share text following the exact format spec
    let text = `🌿 Putier 好轉反應評估報告\n\n👤 ${data.nickname}（${age}歲 ${gender === "male" ? "男性" : "女性"}）\n\n📋 保健需求：\n${symptomList}\n\n✨ 好轉反應預估（節錄）：\n${herxSummary || "（依個人體質而異）"}\n\n💊 每日建議：${dosage.dailyCapsules} 顆\n📅 首套天數：${dosage.firstSetDays} 天\n⏱ 改善週期：預計 4-6 個月稍感受到明顯改善，持續服用 3 個月以上以達到最佳效果。`;

    if (bmiData) text += `\n📊 BMI：${bmiData.bmi}（${bmiData.category}）`;
    if (waterData) text += `\n💧 每日喝水：${waterData.liters} 公升`;

    text += `\n\n當身體開始有好轉反應情況，請第一時間與您的推薦人討論用量增減。`;

    // Safety truncation for extreme cases
    const MAX_TEXT_LENGTH = 1000;
    if (text.length > MAX_TEXT_LENGTH) {
      text = text.substring(0, MAX_TEXT_LENGTH - 3) + "...";
    }

    const lineUrl = `https://line.me/R/share?text=${encodeURIComponent(text)}`;
    window.open(lineUrl, "_blank");
  };

  const createdDate = new Date(data.createdAt).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen" style={{ background: "var(--putier-bg)" }}>
      {/* Header */}
      <div className="sticky top-0 z-10 shadow-sm" style={{ background: "#1B4965" }}>
        <div className="container flex items-center gap-3 py-3">
          <button
            onClick={() => navigate(-1 as unknown as string)}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex-1">
            <h1 className="text-white font-bold text-base">{data.nickname} 的修復報告</h1>
            <p className="text-white/60 text-xs">{createdDate}</p>
          </div>
        </div>
      </div>

      <div className="container py-4 space-y-4 pb-8">
        {/* Basic Info */}
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
              <div className="font-bold text-gray-800 mt-0.5">{data.nickname}</div>
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
          {selectedSymptoms.length > 0 && (
            <div className="mt-3">
              <div className="text-xs text-gray-500 mb-1.5">保健需求（{selectedSymptoms.length} 項）</div>
              <div className="flex flex-wrap gap-1">
                {selectedSymptoms.map(id => (
                  <span key={id} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#EDE9FE", color: "#7C3AED" }}>
                    {getSymptomLabel(id)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dosage */}
        <div className="putier-card">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-[#22C55E] flex items-center justify-center">
              <Heart size={14} className="text-white" />
            </div>
            <h2 className="putier-section-title mb-0">服用建議與預估時間</h2>
          </div>
          <div className="rounded-2xl p-4 mb-3 text-center" style={{ background: "linear-gradient(135deg, #1B4965, #2d6a8f)" }}>
            <div className="text-white/70 text-xs mb-1">建議每日服用</div>
            <div className="text-white text-4xl font-bold">{dosage.dailyCapsules}</div>
            <div className="text-white/70 text-sm">顆 / 天</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-700">套數調整</span>
              <div className="flex items-center gap-3">
                <button onClick={() => setSetCount(s => Math.max(1, s - 1))} className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100">
                  <Minus size={14} />
                </button>
                <span className="text-lg font-bold text-[#1B4965] w-8 text-center">{setCount}</span>
                <button onClick={() => setSetCount(s => Math.min(12, s + 1))} className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100">
                  <Plus size={14} />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <RefreshCw size={12} />
              <span>1 套 = 60 顆，調整套數後自動重新計算</span>
            </div>
          </div>
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
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-3">
            <div className="text-xs font-bold text-amber-700 mb-1">⏱ 預計改善週期</div>
            <p className="text-xs text-amber-800 leading-relaxed">{dosage.improvementCycles}</p>
          </div>
          {waterData && (
            <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-3 mb-3">
              <div className="flex items-center gap-2 mb-1">
                <Droplets size={14} className="text-cyan-600" />
                <div className="text-xs font-bold text-cyan-700">每日建議喝水量</div>
              </div>
              <div className="text-2xl font-bold text-cyan-700">{waterData.liters} <span className="text-sm font-normal">公升</span></div>
              <p className="text-xs text-cyan-600 mt-1">{waterData.ml} ml / 天</p>
            </div>
          )}
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-xs font-bold text-gray-700 mb-1">💊 服用指南</div>
            <p className="text-xs text-gray-600 leading-relaxed">{dosage.dosageGuide}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 mt-2">
            <div className="text-xs font-bold text-gray-700 mb-1">💧 喝水指南</div>
            <p className="text-xs text-gray-600 leading-relaxed">{dosage.waterGuide}</p>
          </div>
        </div>

        {/* Herx */}
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
                      <div>
                        <div className="text-xs font-bold text-purple-700 mb-1.5">原因成分有：</div>
                        <div className="flex flex-wrap gap-1">
                          {reaction.ingredients.map(ingId => {
                            const ing = getIngredient(ingId);
                            return ing ? (
                              <span key={ingId} className="ingredient-tag" style={{ background: ing.color }}>
                                {ing.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-purple-700 mb-1.5">身體改善：</div>
                        <p className="text-xs text-gray-600 leading-relaxed">{reaction.improvement}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
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

        <Accordion title={`📚 ${HERX_EXPLANATION.title}`}>
          <div className="space-y-3">
            <div className="whitespace-pre-line text-xs text-gray-600 leading-relaxed">{HERX_EXPLANATION.content}</div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1">
                <BookOpen size={12} />
                文獻出處
              </div>
              {HERX_EXPLANATION.references.map((ref, i) => (
                <p key={i} className="text-xs text-gray-400 mb-1">[{i + 1}] {ref}</p>
              ))}
            </div>
          </div>
        </Accordion>

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

        <Button onClick={handleLineShare} className="w-full h-13 text-base font-bold rounded-xl shadow-lg" style={{ background: "#06C755", color: "white" }}>
          <Share2 size={18} className="mr-2" />
          LINE 分享報告
        </Button>
      </div>
    </div>
  );
}

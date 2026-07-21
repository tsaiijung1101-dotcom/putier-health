import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Activity, Calendar, Coffee, AlertTriangle, CheckCircle, ArrowLeft } from "lucide-react";

export default function ClientProgressReport() {
  const [, navigate] = useLocation();

  // Parse query params manually
  const searchParams = new URLSearchParams(window.location.search);
  const leaderId = searchParams.get("leader_id") || "";
  const clientId = searchParams.get("client_id") || "";

  // Extract client nickname from client_id if encoded
  const clientNickname = clientId.includes("_")
    ? decodeURIComponent(clientId.split("_")[0])
    : "親愛的客戶";

  // Form states
  const [dosage, setDosage] = useState<number>(4);
  const [isCustomDosage, setIsCustomDosage] = useState(false);
  const [customDosage, setCustomDosage] = useState<string>("");

  const [mealOption, setMealOption] = useState<string>("2"); // "2" (早晚), "3" (早中晚), "4" (早中晚睡前), "custom" (進階)
  const [customHours, setCustomHours] = useState<string>("4");
  const [customPills, setCustomPills] = useState<string>("2");

  const [consecutiveDays, setConsecutiveDays] = useState<string>("1");
  const [selectedReactions, setSelectedReactions] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Load from local storage on mount to prefill form
  useEffect(() => {
    if (clientId) {
      const savedDosage = localStorage.getItem(`putier_track_dosage_${clientId}`);
      const savedIsCustom = localStorage.getItem(`putier_track_is_custom_dosage_${clientId}`);
      const savedCustomDosageValue = localStorage.getItem(`putier_track_custom_dosage_value_${clientId}`);
      const savedMealOption = localStorage.getItem(`putier_track_meal_option_${clientId}`);
      const savedCustomHours = localStorage.getItem(`putier_track_custom_hours_${clientId}`);
      const savedCustomPills = localStorage.getItem(`putier_track_custom_pills_${clientId}`);
      const savedDays = localStorage.getItem(`putier_track_days_${clientId}`);

      if (savedIsCustom === "true") {
        setIsCustomDosage(true);
        if (savedCustomDosageValue) {
          setCustomDosage(savedCustomDosageValue);
          setDosage(parseInt(savedCustomDosageValue) || 4);
        }
      } else if (savedDosage) {
        setDosage(parseInt(savedDosage));
      }

      if (savedMealOption) {
        setMealOption(savedMealOption);
      }
      if (savedCustomHours) {
        setCustomHours(savedCustomHours);
      }
      if (savedCustomPills) {
        setCustomPills(savedCustomPills);
      }

      if (savedDays) {
        const nextDay = parseInt(savedDays) + 1;
        setConsecutiveDays(nextDay.toString());
      }
    }
  }, [clientId]);

  const submitReportMutation = trpc.clientProgress.submitReport.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      // Save progress locally to increment days automatically next time
      if (clientId) {
        localStorage.setItem(`putier_track_dosage_${clientId}`, dosage.toString());
        localStorage.setItem(`putier_track_is_custom_dosage_${clientId}`, isCustomDosage.toString());
        localStorage.setItem(`putier_track_custom_dosage_value_${clientId}`, customDosage);
        localStorage.setItem(`putier_track_meal_option_${clientId}`, mealOption);
        localStorage.setItem(`putier_track_custom_hours_${clientId}`, customHours);
        localStorage.setItem(`putier_track_custom_pills_${clientId}`, customPills);
        localStorage.setItem(`putier_track_days_${clientId}`, consecutiveDays);
      }
      toast.success("修復進度提交成功！");
    },
    onError: (err) => {
      toast.error(err.message || "提交失敗，請重試");
    },
  });

  const reactionsList = [
    { id: "sleepy", label: "嗜睡" },
    { id: "energetic", label: "精神變好" },
    { id: "bowel", label: "排便增加" },
    { id: "itchy", label: "皮膚發癢" },
    { id: "sore", label: "身體痠痛" },
    { id: "headache", label: "頭痛" },
    { id: "dry_mouth", label: "口乾舌燥" },
    { id: "bloating", label: "胃脹氣" },
    { id: "normal", label: "無特殊感覺" },
  ];

  const handleToggleReaction = (id: string) => {
    if (id === "normal") {
      // If "no special feeling" is selected, clear other options
      setSelectedReactions(prev => (prev.includes("normal") ? [] : ["normal"]));
      return;
    }

    setSelectedReactions(prev => {
      // Remove "normal" if we select any other reaction
      const filtered = prev.filter(r => r !== "normal");
      if (filtered.includes(id)) {
        return filtered.filter(r => r !== id);
      } else {
        return [...filtered, id];
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaderId) {
      toast.error("缺少推薦人 ID，無法提交");
      return;
    }
    if (!clientId) {
      toast.error("缺少客戶代碼，無法提交");
      return;
    }

    // Validate dosage
    let finalDosage = dosage;
    if (isCustomDosage) {
      const parsedCustomDosage = parseInt(customDosage);
      if (isNaN(parsedCustomDosage) || parsedCustomDosage <= 0) {
        toast.error("請輸入正確的單日服總顆數");
        return;
      }
      finalDosage = parsedCustomDosage;
    }

    const parsedDays = parseInt(consecutiveDays);
    if (isNaN(parsedDays) || parsedDays <= 0) {
      toast.error("請輸入正確的連續服用天數");
      return;
    }

    // Determine meals count and notes formatting
    let finalMeals = 2;
    let finalNotes = notes.trim();

    if (mealOption === "custom") {
      const hours = parseInt(customHours) || 4;
      const pills = parseInt(customPills) || 1;
      // Calculate how many times: ceiling of total dosage / pills per time
      finalMeals = Math.max(1, Math.ceil(finalDosage / pills));
      const prefix = `[進階服用方式：每隔 ${hours} 小時服用 ${pills} 顆]`;
      finalNotes = finalNotes ? `${prefix}\n${finalNotes}` : prefix;
    } else {
      finalMeals = parseInt(mealOption) || 2;
    }

    submitReportMutation.mutate({
      leaderId,
      clientId,
      dosage: finalDosage,
      meals: finalMeals,
      consecutiveDays: parsedDays,
      reactions: selectedReactions,
      notes: finalNotes || undefined,
    });
  };

  if (!leaderId || !clientId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-lg text-center space-y-4">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-800">無效的連結</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            此追蹤連結缺少必要的參數（領導人 ID 或客戶代碼）。請向您的專業健康顧問重新獲取正確的回報連結。
          </p>
        </div>
      </div>
    );
  }

  const computedMeals = mealOption === "custom"
    ? Math.max(1, Math.ceil(dosage / (parseInt(customPills) || 1)))
    : parseInt(mealOption) || 2;

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-xl text-center space-y-6">
          <div className="w-20 h-20 bg-green-50 text-[#22C55E] rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle size={44} className="animate-bounce" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[#1B4965]">🎉 提交成功！</h2>
            <p className="text-sm text-gray-600 font-medium">
              親愛的 {clientNickname}
            </p>
            <p className="text-xs text-gray-400 leading-relaxed px-4">
              您的今日服用記錄與身體反應已成功送出！您的專屬健康顧問會即時在管理後台追蹤您的身體修復動態。
            </p>
          </div>
          <div className="bg-blue-50/50 rounded-xl p-3.5 border border-blue-100 text-left">
            <div className="text-[10px] font-bold text-[#1B4965] mb-1">今日回報明細：</div>
            <div className="text-xs text-gray-500">單日服總顆數：{dosage} 顆 ({mealOption === "custom" ? `每隔 ${customHours} 小時吃 ${customPills} 顆，共 ${computedMeals} 餐` : `分 ${computedMeals} 餐`})</div>
            <div className="text-xs text-gray-500">連續天數：{consecutiveDays} 天</div>
            <div className="text-xs text-gray-500 mt-1">
              身體反應：{selectedReactions.map(r => reactionsList.find(x => x.id === r)?.label || r).join(", ") || "無"}
            </div>
          </div>
          <Button
            onClick={() => setSubmitted(false)}
            className="w-full h-11 rounded-xl bg-[#1B4965] text-white font-bold text-sm"
          >
            再次填寫 / 修改回報
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-[#1B4965] text-white p-6 pt-12 rounded-b-[2.5rem] shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Activity size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black">每日修復進度回報</h1>
            <p className="text-[10px] text-white/70">
              顧問 ID: <span className="font-bold">{leaderId}</span> · 客戶: <span className="font-bold">{clientNickname}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 shadow-md space-y-6">
          {/* 1. 單日服總顆數 */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Coffee size={14} className="text-[#1B4965]" />
              單日服總顆數
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {[2, 4, 6, 8].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    setIsCustomDosage(false);
                    setDosage(val);
                  }}
                  className={`h-11 rounded-xl font-bold text-sm transition-all border ${
                    !isCustomDosage && dosage === val
                      ? "bg-[#1B4965] border-[#1B4965] text-white shadow-md shadow-[#1B4965]/20"
                      : "border-gray-200 text-gray-600 bg-white hover:bg-gray-50"
                  }`}
                >
                  {val} 顆
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setIsCustomDosage(true);
                  if (customDosage) {
                    setDosage(parseInt(customDosage) || 4);
                  }
                }}
                className={`h-11 rounded-xl font-bold text-sm transition-all border ${
                  isCustomDosage
                    ? "bg-[#1B4965] border-[#1B4965] text-white shadow-md shadow-[#1B4965]/20"
                    : "border-gray-200 text-gray-600 bg-white hover:bg-gray-50"
                }`}
              >
                其他
              </button>
            </div>

            {isCustomDosage && (
              <div className="mt-2 flex items-center gap-2 animate-fadeIn">
                <Input
                  type="number"
                  min="1"
                  placeholder="請輸入總顆數"
                  value={customDosage}
                  onChange={e => {
                    setCustomDosage(e.target.value);
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) setDosage(val);
                  }}
                  className="rounded-xl h-10 text-sm font-bold w-full"
                  required
                />
                <span className="text-xs font-bold text-gray-500 flex-shrink-0">顆 / 天</span>
              </div>
            )}
          </div>

          {/* 2. 服用頻率 / 分幾餐 */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Calendar size={14} className="text-[#1B4965]" />
              服用頻率 / 分幾餐
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { val: "2", label: "早晚" },
                { val: "3", label: "早中晚" },
                { val: "4", label: "早中晚睡前" },
                { val: "custom", label: "進階" },
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setMealOption(opt.val)}
                  className={`h-11 px-1 rounded-xl font-bold text-xs transition-all border ${
                    mealOption === opt.val
                      ? "bg-[#1B4965] border-[#1B4965] text-white shadow-md shadow-[#1B4965]/20"
                      : "border-gray-200 text-gray-600 bg-white hover:bg-gray-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {mealOption === "custom" && (
              <div className="mt-3 p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-2.5 animate-fadeIn">
                <div className="text-[10px] font-bold text-gray-400">進階服用排程設定</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500">每隔幾小時</label>
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        min="1"
                        placeholder="小時"
                        value={customHours}
                        onChange={e => setCustomHours(e.target.value)}
                        className="rounded-xl h-9 text-xs font-bold bg-white"
                        required
                      />
                      <span className="text-[10px] font-bold text-gray-400">小時</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500">每次吃幾顆</label>
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        min="1"
                        placeholder="顆數"
                        value={customPills}
                        onChange={e => setCustomPills(e.target.value)}
                        className="rounded-xl h-9 text-xs font-bold bg-white"
                        required
                      />
                      <span className="text-[10px] font-bold text-gray-400">顆</span>
                    </div>
                  </div>
                </div>
                <p className="text-[9px] text-[#1B4965] font-medium leading-relaxed">
                  💡 系統會根據您的單日總顆數 ({isCustomDosage ? (customDosage || "X") : dosage} 顆) 與每次服用量 ({customPills || "Y"} 顆)，自動計算出每日服用次數為 {Math.max(1, Math.ceil((isCustomDosage ? (parseInt(customDosage) || 4) : dosage) / (parseInt(customPills) || 1)))} 次。
                </p>
              </div>
            )}
          </div>

          {/* 3. 連續服用天數 */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700">已連續服用天數</label>
            <Input
              type="number"
              min="1"
              value={consecutiveDays}
              onChange={e => setConsecutiveDays(e.target.value)}
              className="rounded-xl h-11 text-sm border-gray-200 font-bold"
              placeholder="請輸入天數"
              required
            />
          </div>

          {/* 4. 身體反應多選 */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-gray-700">今日身體反應 (多選)</label>
            <div className="grid grid-cols-3 gap-2">
              {reactionsList.map(item => {
                const isSelected = selectedReactions.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleToggleReaction(item.id)}
                    className={`h-10 px-1 rounded-xl text-xs font-medium transition-all border break-all ${
                      isSelected
                        ? "bg-[#22C55E]/10 border-[#22C55E] text-[#22C55E] font-bold"
                        : "border-gray-200 text-gray-500 bg-white hover:bg-gray-50"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. 補充說明 */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700">其他身體狀況補充 (選填)</label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="有任何微小的不適、排毒反應或需要向顧問詢問的問題，都可以在此填寫..."
              className="rounded-2xl min-h-[90px] text-xs border-gray-200 p-3 leading-relaxed"
            />
          </div>

          {/* 提交按鈕 */}
          <Button
            type="submit"
            disabled={submitReportMutation.isPending}
            className="w-full h-12 rounded-xl bg-[#1B4965] hover:bg-[#1B4965]/90 text-white font-bold text-sm transition-transform active:scale-[0.98]"
          >
            {submitReportMutation.isPending ? "提交中..." : "提交今日進度"}
          </Button>
        </form>
      </div>
    </div>
  );
}

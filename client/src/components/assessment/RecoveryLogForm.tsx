import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { COMMON_REACTIONS } from "@shared/healthData";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Activity, Pill, MessageSquare, CheckCircle2 } from "lucide-react";

interface RecoveryLogFormProps {
  lineId: string;
  onSuccess?: () => void;
}

export default function RecoveryLogForm({ lineId, onSuccess }: RecoveryLogFormProps) {
  const [dosage, setDosage] = useState<number>(2);
  const [selectedReactions, setSelectedReactions] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createLog = trpc.recovery.create.useMutation({
    onSuccess: () => {
      toast.success("日誌已成功回報，感謝您提供數據！");
      setSelectedReactions([]);
      setNotes("");
      onSuccess?.();
    },
    onError: (err) => {
      toast.error("回報失敗：" + err.message);
    },
  });

  const toggleReaction = (id: string) => {
    setSelectedReactions(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!lineId) {
      toast.error("無法識別用戶 ID");
      return;
    }
    setIsSubmitting(true);
    try {
      await createLog.mutateAsync({
        lineId,
        dosage,
        reactions: selectedReactions,
        notes,
        reportDate: new Date().toISOString().split("T")[0],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 服用量 */}
      <div className="putier-card">
        <div className="flex items-center gap-2 mb-4">
          <Pill size={18} className="text-[#1B4965]" />
          <Label className="text-base font-bold text-[#1B4965]">今日服用量（顆）</Label>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="60"
            step="1"
            value={dosage}
            onChange={(e) => setDosage(parseInt(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1B4965]"
          />
          <div className="w-16 h-12 flex items-center justify-center bg-[#1B4965] text-white rounded-xl font-bold text-lg">
            {dosage}
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">請填寫您今天實際服用的總顆數（包含早中晚）</p>
      </div>

      {/* 身體反應 */}
      <div className="putier-card">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={18} className="text-[#1B4965]" />
          <Label className="text-base font-bold text-[#1B4965]">今日身體反應</Label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {COMMON_REACTIONS.map((reaction) => (
            <button
              key={reaction.id}
              onClick={() => toggleReaction(reaction.id)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium border-2 transition-all ${
                selectedReactions.includes(reaction.id)
                  ? "border-[#22C55E] bg-[#22C55E]/10 text-[#15803d]"
                  : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200"
              }`}
            >
              {selectedReactions.includes(reaction.id) && <CheckCircle2 size={14} />}
              {reaction.label}
            </button>
          ))}
        </div>
      </div>

      {/* 其他備註 */}
      <div className="putier-card">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare size={18} className="text-[#1B4965]" />
          <Label className="text-base font-bold text-[#1B4965]">其他具體感受（選填）</Label>
        </div>
        <Textarea
          placeholder="例如：精神變好、某部位疼痛減輕、或是其他特殊狀況..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="rounded-xl min-h-[100px] resize-none"
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full h-14 text-lg font-bold rounded-xl shadow-lg"
        style={{ background: "#1B4965", color: "white" }}
      >
        {isSubmitting ? "回報中..." : "提交今日修復日誌"}
      </Button>
      
      <p className="text-center text-xs text-gray-400">
        您的數據將匿名用於 Putier 大數據分析，<br />
        幫助更多人了解細胞修復過程。
      </p>
    </div>
  );
}

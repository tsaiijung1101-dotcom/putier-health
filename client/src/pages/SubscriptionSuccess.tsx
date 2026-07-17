import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2, PartyPopper, ArrowRight, Shield, Zap, ClipboardList, Activity } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function SubscriptionSuccess() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const activateMutation = trpc.subscription.activateMock.useMutation();

  useEffect(() => {
    const activate = async () => {
      try {
        await activateMutation.mutateAsync();
        utils.auth.me.invalidate();
        toast.success("訂閱成功！歡迎加入專業版。");
      } catch (error) {
        console.error("Activation error:", error);
      }
    };
    activate();
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-8 text-center">
      <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6 animate-bounce">
        <CheckCircle2 size={48} className="text-[#22C55E]" />
      </div>
      
      <h1 className="text-2xl font-black text-gray-800 mb-2 flex items-center gap-2">
        支付成功！ <PartyPopper className="text-yellow-500" />
      </h1>
      
      <p className="text-gray-500 text-sm mb-12 leading-relaxed">
        感謝您訂閱 Putier Health 專業版。您的帳戶權限已自動開啟，現在您可以享受所有專屬功能。
      </p>

      <div className="w-full max-w-sm bg-blue-50/50 rounded-3xl p-6 mb-8 text-left border border-blue-100">
        <h3 className="font-bold text-[#1B4965] mb-4 flex items-center gap-2">
          <Zap size={18} className="text-amber-500" />
          接下來您可以...
        </h3>
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm flex-shrink-0">
              <ClipboardList size={16} className="text-[#1B4965]" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">開始首次健康評估</p>
              <p className="text-xs text-gray-500">生成專屬的好轉反應預測報告</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm flex-shrink-0">
              <Activity size={16} className="text-[#22C55E]" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">回報今日修復進度</p>
              <p className="text-xs text-gray-500">紀錄服用量並獲得 AI 小秘書建議</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm flex-shrink-0">
              <Shield size={16} className="text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">隨時查看大數據紀錄</p>
              <p className="text-xs text-gray-500">掌握長期的細胞修復趨勢</p>
            </div>
          </div>
        </div>
      </div>

      <Button
        onClick={async () => {
          await utils.auth.me.invalidate();
          navigate("/");
        }}
        className="w-full max-w-xs h-14 rounded-2xl text-lg font-bold shadow-lg"
        style={{ background: "#1B4965", color: "white" }}
      >
        開始使用專業版
        <ArrowRight className="ml-2" size={20} />
      </Button>
    </div>
  );
}

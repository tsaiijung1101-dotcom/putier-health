import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Zap, BarChart3, Bell, CheckCircle2, ArrowRight, ChevronLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Subscription() {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  const createSession = trpc.subscription.createSession.useMutation();

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      const { url } = await createSession.mutateAsync();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error("無法發起支付，請稍後再試。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-[#1B4965] text-white p-8 pt-12 rounded-b-[3rem] shadow-xl relative">
        <button 
          onClick={() => navigate("/")}
          className="absolute top-10 left-6 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="mt-4">
          <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <ShieldCheck className="text-[#22C55E]" />
            升級專業版
          </h1>
          <p className="text-white/80 text-sm">
            解鎖大數據修復分析，開啟您的精準健康管理之旅。
          </p>
        </div>
      </div>

      <div className="px-6 -mt-8">
        <div className="bg-white rounded-3xl p-6 shadow-lg space-y-8">
          <div className="text-center">
            <div className="inline-block bg-blue-50 text-[#1B4965] px-4 py-1 rounded-full text-xs font-bold mb-2">
              年度訂閱方案
            </div>
            <div className="text-4xl font-black text-[#1B4965]">
              NT$ 2,980 <span className="text-sm font-normal text-gray-400">/ 年</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">每天不到 9 元，換取專業的修復指導</p>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Zap size={18} className="text-yellow-500" />
              專業版專屬功能
            </h3>
            
            <div className="space-y-4">
              {[
                { title: "無限次健康評估報告", desc: "不限次數生成專業好轉反應預測報告", icon: <CheckCircle2 size={16} className="text-[#22C55E]" /> },
                { title: "智能修復日誌分析", desc: "提交日誌後立即獲得 AI 小秘書深度解析", icon: <BarChart3 size={16} className="text-[#22C55E]" /> },
                { title: "修復趨勢預警系統", desc: "自動偵測身體反應趨勢，提供提前預警", icon: <Bell size={16} className="text-[#22C55E]" /> },
                { title: "大數據修復軌跡對比", desc: "與萬名用戶數據對比，掌握您的修復進度", icon: <Zap size={16} className="text-[#22C55E]" /> },
              ].map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="mt-1">{item.icon}</div>
                  <div>
                    <div className="text-sm font-bold text-gray-800">{item.title}</div>
                    <div className="text-xs text-gray-500">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #1B4965 0%, #2a6a91 100%)" }}
          >
            {loading ? "處理中..." : "立即升級專業版"}
            <ArrowRight className="ml-2" size={20} />
          </Button>

          <div className="text-center">
            <p className="text-[10px] text-gray-400">
              安全支付由 Stripe 提供支援。訂閱將在 1 年後自動續約，您可以隨時取消。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

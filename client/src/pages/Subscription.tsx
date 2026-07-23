import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Zap, BarChart3, Bell, CheckCircle2, ArrowRight, ChevronLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useAssessment } from "@/contexts/AssessmentContext";

export default function Subscription() {
  const [, navigate] = useLocation();
  const [couponCode, setCouponCode] = useState("");
  const { state, setLeader } = useAssessment();
  const { leader } = state;

  useEffect(() => {
    if (!leader) {
      toast.error("請先登入您的領導人帳號後再進行升級！");
      navigate("/");
    }
  }, [leader, navigate]);

  const activateCouponMutation = trpc.subscription.activateCoupon.useMutation({
    onSuccess: (res) => {
      if (leader) {
        setLeader({
          ...leader,
          status: "pro",
        });
      }
      toast.success(res.message || "優惠碼啟用成功！已開通 38 天專業版權限。");
      navigate("/");
    },
    onError: (err) => {
      toast.error(err.message || "啟用失敗，請確認優惠碼是否正確");
    }
  });

  const handleActivateCoupon = () => {
    if (!leader || !leader.lineUrl) {
      toast.error("請先登入您的領導人帳號！");
      navigate("/");
      return;
    }
    const trimmed = couponCode.trim();
    if (!trimmed) {
      toast.error("請輸入優惠代碼");
      return;
    }

    activateCouponMutation.mutate({
      lineUrl: leader.lineUrl,
      couponCode: trimmed,
    });
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
          <div className="text-center space-y-3">
            <div className="inline-block bg-amber-50 text-amber-700 border border-amber-200 px-4 py-1 rounded-full text-xs font-bold">
              🔥 內測推廣優惠
            </div>
            <div className="text-xl font-black text-[#1B4965]">
              輸入優惠碼免費啟用 Pro
            </div>
            <p className="text-xs text-gray-400 max-w-xs mx-auto">
              請輸入您的專屬優惠碼（例如：RIWAY38）以立即啟用付費專業版權限。
            </p>
            
            <div className="pt-2 max-w-xs mx-auto">
              <Input
                type="text"
                placeholder="請輸入優惠代碼..."
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="w-full h-11 text-center text-sm font-bold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B4965] uppercase placeholder:normal-case placeholder:font-normal"
              />
            </div>
          </div>

          <div className="space-y-4 border-t border-gray-50 pt-6">
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
            onClick={handleActivateCoupon}
            disabled={activateCouponMutation.isPending}
            className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] bg-[#1B4965] text-white"
            style={{ background: "linear-gradient(135deg, #1B4965 0%, #2a6a91 100%)" }}
          >
            {activateCouponMutation.isPending ? "啟用中..." : "確認啟用優惠碼"}
            <ArrowRight className="ml-2" size={20} />
          </Button>

          <div className="text-center">
            <p className="text-[10px] text-gray-400">
              安全金鑰驗證由系統雲端提供。享有時效到期後，系統將自動恢復為免費版。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

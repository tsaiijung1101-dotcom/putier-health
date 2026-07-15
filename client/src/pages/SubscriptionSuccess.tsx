import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2, PartyPopper, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function SubscriptionSuccess() {
  const [, navigate] = useLocation();

  useEffect(() => {
    toast.success("訂閱成功！歡迎加入專業版。");
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

      <Button
        onClick={() => navigate("/")}
        className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl"
        style={{ background: "#1B4965" }}
      >
        開始使用
        <ArrowRight className="ml-2" size={20} />
      </Button>
    </div>
  );
}

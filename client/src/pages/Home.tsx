import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClipboardList, History, Leaf, Shield, Zap, Star, Activity, Crown, Calendar, Settings } from "lucide-react";
import { useAssessment } from "@/contexts/AssessmentContext";
import { APP_VERSION } from "@shared/version";
import RecoveryLogForm from "@/components/assessment/RecoveryLogForm";
import RecoveryAnalysisDialog from "@/components/assessment/RecoveryAnalysisDialog";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const [, navigate] = useLocation();
  const { resetAssessment } = useAssessment();
  const [showRecordsDialog, setShowRecordsDialog] = useState(false);
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [lineIdInput, setLineIdInput] = useState("");
  const [logLineId, setLogLineId] = useState("");
  const [analysisData, setAnalysisData] = useState<any>(null);

  const analysisQuery = trpc.recovery.getAnalysis.useQuery(
    { lineId: logLineId },
    { enabled: false }
  );

  const handleLogSuccess = async () => {
    setShowLogDialog(false);
    const { data } = await analysisQuery.refetch();
    if (data) {
      setAnalysisData(data);
      setShowAnalysisDialog(true);
    }
  };

  const { data: user } = trpc.auth.me.useQuery();
  const isPro = user?.subscriptionStatus === 'active';

  const handleStartAssessment = () => {
    if (!isPro) {
      navigate("/subscription");
      return;
    }
    resetAssessment();
    navigate("/assessment");
  };

  const handleViewRecords = () => {
    if (lineIdInput.trim()) {
      navigate(`/records?line_id=${encodeURIComponent(lineIdInput.trim())}`);
      setShowRecordsDialog(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--putier-bg)" }}>
      {/* Hero Section */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1B4965 0%, #2d6a8f 100%)" }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white transform translate-x-20 -translate-y-20" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white transform -translate-x-16 translate-y-16" />
        </div>
        <div className="relative container py-10 text-white">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Leaf size={22} className="text-[#22C55E]" />
              </div>
              <span className="text-sm font-medium opacity-80">Putier 細胞修復</span>
            </div>
            {isPro && (
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full shadow-lg border border-amber-300/30 animate-pulse">
                  <Crown size={14} className="text-white" />
                  <span className="text-[10px] font-black text-white tracking-wider uppercase">Pro Member</span>
                </div>
                {user?.subscriptionExpiresAt && (
                  <div className="flex items-center gap-1 mt-1 opacity-60">
                    <Calendar size={10} />
                    <span className="text-[9px]">有效期至 {new Date(user.subscriptionExpiresAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold mb-2 leading-tight">
            好轉反應與修復進度<br />大數據查詢系統
          </h1>
          <p className="text-sm opacity-80 mb-6 leading-relaxed">
            根據您的個人健康狀況，<br />
            生成專屬的細胞修復評估報告
          </p>
          <div className="flex gap-3">
            <Button
              onClick={handleStartAssessment}
              className="flex-1 h-12 text-base font-bold rounded-xl shadow-lg"
              style={{ background: "#22C55E", color: "white" }}
            >
              <ClipboardList size={18} className="mr-2" />
              開始評估
            </Button>
            <Button
              onClick={() => setShowRecordsDialog(true)}
              variant="outline"
              className="flex-1 h-12 text-base font-bold rounded-xl border-white/40 text-white bg-white/10 hover:bg-white/20"
            >
              <History size={18} className="mr-2" />
              查看紀錄
            </Button>
          </div>
          
          <div className="mt-4">
            <Button
              onClick={() => {
                if (!isPro) {
                  navigate("/subscription");
                  return;
                }
                setShowLogDialog(true);
              }}
              className="w-full h-12 text-base font-bold rounded-xl border-2 border-[#22C55E] text-white bg-[#22C55E]/20 hover:bg-[#22C55E]/30 backdrop-blur-sm"
            >
              <Activity size={18} className="mr-2" />
              回報今日修復進度
            </Button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="container py-6">
        <h2 className="text-base font-bold text-[#1B4965] mb-4">評估包含內容</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: <ClipboardList size={20} />, title: "個性化報告", desc: "根據症狀生成專屬建議" },
            { icon: <Shield size={20} />, title: "好轉反應預估", desc: "了解修復過程中的反應" },
            { icon: <Zap size={20} />, title: "服用建議", desc: "精準計算每日服用量" },
            { icon: <Star size={20} />, title: "改善週期", desc: "預估身體修復時程" },
          ].map((item, i) => (
            <div key={i} className="putier-card flex flex-col gap-2">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "#1B4965", color: "white" }}
              >
                {item.icon}
              </div>
              <div>
                <div className="text-sm font-bold text-gray-800">{item.title}</div>
                <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 14 Ingredients */}
      <div className="container pb-6">
        <div className="putier-card">
          <h2 className="text-sm font-bold text-[#1B4965] mb-3">14 種珍貴成分</h2>
          <div className="flex flex-wrap gap-1.5">
            {[
              "鹿胎盤活細胞", "核心鑰鍵", "鹿茸臘萃", "普亞參皂", "鹿角靈芝",
              "褐藻糖膠", "蘋果多酚", "海洋膠原蛋白", "月見草油", "酪梨油",
              "深海鮫精", "蘆薈", "琉璃苣油", "蕃茄紅素",
            ].map((name, i) => (
              <span
                key={i}
                className="text-xs px-2 py-1 rounded-full font-medium"
                style={{ background: "#EDE9FE", color: "#7C3AED" }}
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 6 Technologies */}
      <div className="container pb-8">
        <div className="putier-card">
          <h2 className="text-sm font-bold text-[#1B4965] mb-3">六大高科技技術</h2>
          <div className="space-y-2">
            {[
              "凍乾保存技術 — 零下 60 度保存生物活性",
              "乳化分解技術 — 100% 完整吸收",
              "氮氣活膠囊技術 — 防止成分氧化",
              "腸溶包衣技術 — 吸收率提升 3 倍",
              "生物活性膠囊技術 — 膠原蛋白膠囊外殼",
              "超臨界流體萃取 — 保留 99% 活細胞",
            ].map((tech, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
                <span
                  className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold mt-0.5"
                  style={{ background: "#22C55E" }}
                >
                  {i + 1}
                </span>
                {tech}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer with Version & Hidden Admin Link */}
      <div className="container pb-6">
        <div className="text-center text-xs text-gray-400">
          <p 
            onClick={() => {
              const newCount = clickCount + 1;
              setClickCount(newCount);
              if (newCount >= 5) {
                setClickCount(0);
                if (confirm("偵測到管理員操作，是否進入後台？")) {
                  navigate("/admin");
                }
              }
              // 3秒後重置點擊次數
              setTimeout(() => setClickCount(0), 3000);
            }}
            className="cursor-default select-none active:opacity-50 transition-opacity py-2"
          >
            Putier Health · {APP_VERSION}
          </p>
        </div>
      </div>

      {/* Records Dialog */}
      <Dialog open={showRecordsDialog} onOpenChange={setShowRecordsDialog}>
        <DialogContent className="mx-4 rounded-2xl max-w-[90vw]">
          <DialogHeader>
            <DialogTitle className="text-[#1B4965]">查看客戶紀錄</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-gray-600">請輸入客戶的 LINE ID 以查詢歷史評估紀錄</p>
            <Input
              placeholder="請輸入 LINE ID"
              value={lineIdInput}
              onChange={e => setLineIdInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleViewRecords()}
              className="rounded-xl"
            />
            <Button
              onClick={handleViewRecords}
              disabled={!lineIdInput.trim()}
              className="w-full h-11 rounded-xl font-bold"
              style={{ background: "#1B4965", color: "white" }}
            >
              查詢紀錄
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recovery Log Dialog */}
      <Dialog open={showLogDialog} onOpenChange={setShowLogDialog}>
        <DialogContent className="mx-4 rounded-2xl max-w-[90vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1B4965]">回報今日修復進度</DialogTitle>
          </DialogHeader>
          {!logLineId ? (
            <div className="space-y-4 pt-2">
              <p className="text-sm text-gray-600">請輸入您的 LINE ID 以開始回報</p>
              <Input
                placeholder="請輸入 LINE ID"
                value={lineIdInput}
                onChange={e => setLineIdInput(e.target.value)}
                className="rounded-xl"
              />
              <Button
                onClick={() => setLogLineId(lineIdInput.trim())}
                disabled={!lineIdInput.trim()}
                className="w-full h-11 rounded-xl font-bold"
                style={{ background: "#1B4965", color: "white" }}
              >
                開始回報
              </Button>
            </div>
          ) : (
            <div className="pt-2">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs text-gray-400">LINE ID: {logLineId}</span>
                <button 
                  onClick={() => setLogLineId("")}
                  className="text-xs text-[#1B4965] underline"
                >
                  修改 ID
                </button>
              </div>
              <RecoveryLogForm 
                lineId={logLineId} 
                onSuccess={handleLogSuccess} 
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <RecoveryAnalysisDialog
        open={showAnalysisDialog}
        onOpenChange={setShowAnalysisDialog}
        analysis={analysisData}
      />
    </div>
  );
}

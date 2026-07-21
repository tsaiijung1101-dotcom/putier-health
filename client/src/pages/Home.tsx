import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClipboardList, History, Leaf, Shield, Zap, Star, Activity, Crown, Calendar, Settings, User, Users, Check } from "lucide-react";
import { useAssessment } from "@/contexts/AssessmentContext";
import { APP_VERSION } from "@shared/version";
import RecoveryLogForm from "@/components/assessment/RecoveryLogForm";
import RecoveryAnalysisDialog from "@/components/assessment/RecoveryAnalysisDialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

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
  const [showLeaderLogin, setShowLeaderLogin] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [leaderLineUrl, setLeaderLineUrl] = useState("");
  const [regLineUrl, setRegLineUrl] = useState("");
  const [regFullName, setRegFullName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regCustomLeaderId, setRegCustomLeaderId] = useState("");
  const [regLineId, setRegLineId] = useState("");
  const [regAuthCode, setRegAuthCode] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showTrackingLinkModal, setShowTrackingLinkModal] = useState(false);
  const [clientNameInput, setClientNameInput] = useState("");
  const [generatedTrackUrl, setGeneratedTrackUrl] = useState("");

  const [showUpdateLineModal, setShowUpdateLineModal] = useState(false);
  const [updateFullName, setUpdateFullName] = useState("");
  const [updatePhone, setUpdatePhone] = useState("");
  const [updateNewLineUrl, setUpdateNewLineUrl] = useState("");

  const { state, setLeader } = useAssessment();
  const { leader } = state;
  const isLeaderPro = leader?.status === "pro";

  const updateLineUrlMutation = trpc.auth.updateLineUrl.useMutation({
    onSuccess: () => {
      toast.success("LINE 個人好友網址已成功更新！請使用新網址進行登入。");
      if (updateNewLineUrl) setLeaderLineUrl(updateNewLineUrl);
      setShowUpdateLineModal(false);
      setUpdateFullName("");
      setUpdatePhone("");
      setUpdateNewLineUrl("");
    },
    onError: (err) => {
      toast.error(err.message || "更新失敗，請確認真實姓名與手機號碼是否正確");
    }
  });

  const handleUpdateLineUrl = () => {
    if (!updateFullName.trim()) return toast.error("請輸入真實姓名");
    if (!updatePhone.trim()) return toast.error("請輸入手機號碼");
    if (!updateNewLineUrl.trim()) return toast.error("請輸入新的 LINE 好友網址");

    updateLineUrlMutation.mutate({
      fullName: updateFullName.trim(),
      phone: updatePhone.trim(),
      newLineUrl: updateNewLineUrl.trim(),
    });
  };

  const loginMutation = trpc.auth.leaderLogin.useMutation({
    onSuccess: (user) => {
      if (user) {
        setLeader({
          lineUrl: user.lineUrl,
          name: user.name || "領導人",
          status: user.status || "free",
          expiredAt: user.expiredAt ? (user.expiredAt instanceof Date ? user.expiredAt.toISOString() : String(user.expiredAt)) : null,
          fullName: user.fullName || undefined,
          phone: user.phone || undefined,
          email: user.email || undefined,
          customLeaderId: user.customLeaderId || undefined,
          lineId: user.lineId || undefined,
        });
        setShowLeaderLogin(false);
        toast.success(`領導人登入成功！您的領導人 ID 為: ${user.customLeaderId || '無'}`);
        navigate("/crm");
      } else {
        toast.error("此 LINE 網址尚未註冊，請切換至註冊標籤進行註冊！");
      }
    },
    onError: () => {
      toast.error("登入失敗，請檢查資訊");
    }
  });

  const registerMutation = trpc.auth.leaderRegister.useMutation({
    onSuccess: (user) => {
      if (user) {
        setLeader({
          lineUrl: user.lineUrl,
          name: user.name || "領導人",
          status: user.status || "free",
          expiredAt: user.expiredAt ? (user.expiredAt instanceof Date ? user.expiredAt.toISOString() : String(user.expiredAt)) : null,
          fullName: user.fullName || undefined,
          phone: user.phone || undefined,
          email: user.email || undefined,
          customLeaderId: user.customLeaderId || undefined,
          lineId: user.lineId || undefined,
        });
        setShowLeaderLogin(false);
        toast.success(`領導人註冊並登入成功！您的專屬領導人 ID 為: ${user.customLeaderId || '無'}`);
        navigate("/crm");
      } else {
        toast.error("註冊失敗，伺服器資料庫未就緒");
      }
    },
    onError: (err) => {
      toast.error(err.message || "註冊失敗，請重試");
    }
  });

  const handleLeaderLogin = () => {
    if (!leaderLineUrl) {
      toast.error("請輸入 LINE 網址");
      return;
    }
    loginMutation.mutate({ lineUrl: leaderLineUrl });
  };

  const handleLeaderRegister = () => {
    if (!regLineUrl.trim()) return toast.error("請輸入 LINE 個人好友網址");
    if (!regFullName.trim()) return toast.error("請輸入真實姓名");
    if (!regPhone.trim()) return toast.error("請輸入手機號碼");
    if (!regEmail.trim()) return toast.error("請輸入電子郵件");
    if (!regCustomLeaderId.trim()) return toast.error("請輸入暱稱 (自訂 ID)");
    if (!regLineId.trim()) return toast.error("請輸入 LINE ID 或官方帳號連結");
    if (!agreedTerms) return toast.error("您必須同意個人資料處理與服務條款");

    registerMutation.mutate({
      lineUrl: regLineUrl.trim(),
      fullName: regFullName.trim(),
      phone: regPhone.trim(),
      email: regEmail.trim(),
      customLeaderId: regCustomLeaderId.trim(),
      lineId: regLineId.trim(),
      authCode: regAuthCode.trim() || undefined,
    });
  };

  const handleGenerateTrackLink = () => {
    const randomId = Math.random().toString(36).substring(2, 10);
    const clientId = clientNameInput.trim()
      ? `${encodeURIComponent(clientNameInput.trim())}_${randomId}`
      : randomId;
    const url = `${window.location.origin}/track?leader_id=${leader?.customLeaderId || ""}&client_id=${clientId}`;
    setGeneratedTrackUrl(url);
  };

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
    // 移除 Pro 限制，讓所有人都能開始評估
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
            
            {/* 領導人專區與 Pro 標識 */}
            <div className="flex flex-col items-end gap-2">
              {leader ? (
                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full border border-white/20 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                      <span className="text-[10px] font-bold text-white tracking-wider truncate max-w-[180px]" title={`顧問：${leader.fullName || leader.name} (${leader.customLeaderId || '無ID'})`}>
                        顧問：{leader.fullName || leader.name || '已連動'} ({leader.customLeaderId || '無'})
                      </span>
                    </div>
                    <Button 
                      onClick={() => navigate("/crm")}
                      size="sm"
                      className="h-7 px-3 bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-[#1B4965] border-none rounded-full font-bold shadow-lg"
                    >
                      <Activity size={12} className="mr-1" />
                      <span className="text-[10px]">查看健康紀錄</span>
                    </Button>
                  </div>
                  {isPro && (
                    <div className="flex items-center gap-1.5 px-3 py-0.5 bg-gradient-to-r from-amber-400/20 to-amber-600/20 rounded-full border border-amber-300/30">
                      <Crown size={10} className="text-amber-400" />
                      <span className="text-[9px] font-black text-amber-400 tracking-wider uppercase">Pro</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-end gap-1.5">
                  <div 
                    onClick={() => setShowLeaderLogin(true)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full border border-white/20 cursor-pointer transition-colors"
                  >
                    <User size={14} className="text-white/80" />
                    <span className="text-[10px] font-bold text-white/90 tracking-wider">領導人專區</span>
                  </div>
                  {isPro ? (
                    <div className="flex items-center gap-1.5 px-3 py-0.5 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full shadow-lg border border-amber-300/30">
                      <Crown size={10} className="text-white" />
                      <span className="text-[9px] font-black text-white tracking-wider uppercase">Pro Member</span>
                    </div>
                  ) : (
                    <div 
                      onClick={() => {
                        toast.error("請先登入您的領導人帳號後再進行升級！");
                        setShowLeaderLogin(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-0.5 bg-white/5 hover:bg-white/10 rounded-full cursor-pointer transition-colors"
                    >
                      <Crown size={10} className="text-white/40" />
                      <span className="text-[9px] font-bold text-white/50 tracking-wider uppercase">Upgrade</span>
                    </div>
                  )}
                </div>
              )}
            </div>
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
              className="w-full h-12 text-base font-bold rounded-xl shadow-lg"
              style={{ background: "#22C55E", color: "white" }}
            >
              <ClipboardList size={18} className="mr-2" />
              開始評估
            </Button>
          </div>
          
          <div className="mt-4">
            {isLeaderPro ? (
              <Button
                onClick={() => {
                  setClientNameInput("");
                  setGeneratedTrackUrl("");
                  setShowTrackingLinkModal(true);
                }}
                className="w-full h-12 text-base font-bold rounded-xl border-2 border-[#22C55E] text-white bg-[#22C55E]/20 hover:bg-[#22C55E]/30 backdrop-blur-sm transition-all"
              >
                <Activity size={18} className="mr-2" />
                回報今日修復進度
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setShowUpgradeModal(true);
                }}
                className="w-full h-12 text-base font-bold rounded-xl border-2 border-gray-400 text-gray-300 bg-gray-500/10 hover:bg-gray-500/20 backdrop-blur-sm opacity-60 transition-all"
              >
                <Activity size={18} className="mr-2" />
                🔒 回報今日修復進度
              </Button>
            )}
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

      {/* Leader Auth Dialog */}
      <Dialog open={showLeaderLogin} onOpenChange={setShowLeaderLogin}>
        <DialogContent className="mx-4 rounded-2xl max-w-[90vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1B4965] text-center text-lg">領導人管理系統</DialogTitle>
          </DialogHeader>

          {/* Tab Headers */}
          <div className="flex border-b border-gray-100 mb-4 pt-1">
            <button
              onClick={() => setAuthMode("login")}
              className={`flex-1 pb-2 text-sm font-bold border-b-2 transition-all ${
                authMode === "login"
                  ? "border-[#1B4965] text-[#1B4965]"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              登入
            </button>
            <button
              onClick={() => setAuthMode("register")}
              className={`flex-1 pb-2 text-sm font-bold border-b-2 transition-all ${
                authMode === "register"
                  ? "border-[#1B4965] text-[#1B4965]"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              註冊
            </button>
          </div>

          {authMode === "login" ? (
            /* Login Form */
            <div className="space-y-4 pt-1">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#1B4965]">LINE 個人好友網址</label>
                <Input
                  placeholder="https://line.me/ti/p/..."
                  value={leaderLineUrl}
                  onChange={e => setLeaderLineUrl(e.target.value)}
                  className="rounded-xl"
                />
                <p className="text-[10px] text-gray-400">請輸入您當初註冊的 LINE 好友連結進行登入</p>
              </div>
              <Button
                onClick={handleLeaderLogin}
                disabled={loginMutation.isPending}
                className="w-full h-11 rounded-xl font-bold mt-2"
                style={{ background: "#1B4965", color: "white" }}
              >
                {loginMutation.isPending ? "登入中..." : "確認登入"}
              </Button>
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowLeaderLogin(false);
                    setShowUpdateLineModal(true);
                  }}
                  className="text-xs text-blue-500 hover:text-blue-600 font-bold transition-colors underline"
                >
                  🔗 LINE 好友網址已變更？點此更新
                </button>
              </div>
            </div>
          ) : (
            /* Register Form */
            <div className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1B4965]">真實姓名 <span className="text-red-500">*</span></label>
                <Input
                  placeholder="請輸入您的真實姓名"
                  value={regFullName}
                  onChange={e => setRegFullName(e.target.value)}
                  className="rounded-xl h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1B4965]">手機號碼 <span className="text-red-500">*</span></label>
                <Input
                  type="tel"
                  placeholder="請輸入您的手機號碼"
                  value={regPhone}
                  onChange={e => setRegPhone(e.target.value)}
                  className="rounded-xl h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1B4965]">電子郵件 <span className="text-red-500">*</span></label>
                <Input
                  type="email"
                  placeholder="example@email.com"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  className="rounded-xl h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1B4965]">暱稱 (自訂 ID) <span className="text-red-500">*</span></label>
                <Input
                  placeholder="請輸入您的暱稱（用於網址帶入推薦人，如：小明）"
                  value={regCustomLeaderId}
                  onChange={e => setRegCustomLeaderId(e.target.value)}
                  className="rounded-xl h-9 text-sm"
                />
                <p className="text-[9px] text-gray-400 leading-none">此名稱會用於分享連結的 `leader_id` 參數中，請設定唯一且易辨識的名稱</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1B4965]">LINE 個人好友網址 <span className="text-red-500">*</span></label>
                <Input
                  placeholder="https://line.me/ti/p/..."
                  value={regLineUrl}
                  onChange={e => setRegLineUrl(e.target.value)}
                  className="rounded-xl h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1B4965]">LINE ID 或官方帳號連結 <span className="text-red-500">*</span></label>
                <Input
                  placeholder="請輸入 LINE ID 或官方推薦連結"
                  value={regLineId}
                  onChange={e => setRegLineId(e.target.value)}
                  className="rounded-xl h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1B4965]">訂閱授權碼 (選填)</label>
                <Input
                  placeholder="請輸入系統授權碼（選填）"
                  value={regAuthCode}
                  onChange={e => setRegAuthCode(e.target.value)}
                  className="rounded-xl h-9 text-sm"
                />
              </div>

              {/* 條款同意勾選 */}
              <div className="flex items-start gap-2.5 pt-2 pb-2">
                <button
                  type="button"
                  onClick={() => setAgreedTerms(prev => !prev)}
                  className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                    agreedTerms ? "bg-[#1B4965] border-[#1B4965]" : "border-gray-300 bg-white"
                  }`}
                >
                  {agreedTerms && <Check size={10} className="text-white" />}
                </button>
                <label 
                  className="text-[10px] text-gray-500 leading-tight cursor-pointer select-none"
                  onClick={() => setAgreedTerms(prev => !prev)}
                >
                  我已閱讀並同意 <span className="font-semibold text-[#1B4965] underline">個人資料處理與服務條款</span>
                </label>
              </div>

              <Button
                onClick={handleLeaderRegister}
                disabled={registerMutation.isPending || !agreedTerms}
                className="w-full h-11 rounded-xl font-bold transition-colors"
                style={{ 
                  background: agreedTerms ? "#1B4965" : "#94A3B8", 
                  color: "white",
                  cursor: agreedTerms ? "pointer" : "not-allowed"
                }}
              >
                {registerMutation.isPending ? "註冊中..." : "註冊並登入"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 升級提示 Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="max-w-[360px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#1B4965] flex items-center gap-2">
              <span>🔒 專業版功能限制</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-600 leading-relaxed">
              「客戶每日修復進度追蹤」是為 <span className="font-bold text-[#1B4965]">付費專業版領導人</span> 設計的高級功能。
            </p>
            <div className="bg-[#1B4965]/5 rounded-xl p-3.5 space-y-2 border border-[#1B4965]/10">
              <div className="text-xs font-bold text-[#1B4965] mb-1">升級後您將獲得：</div>
              <div className="text-xs text-gray-600 flex items-center gap-1.5">
                <Check size={12} className="text-[#22C55E]" /> 生成客戶專屬追蹤連結
              </div>
              <div className="text-xs text-gray-600 flex items-center gap-1.5">
                <Check size={12} className="text-[#22C55E]" /> 實時記錄客戶每日服用量與身體反應
              </div>
              <div className="text-xs text-gray-600 flex items-center gap-1.5">
                <Check size={12} className="text-[#22C55E]" /> CRM 後台視覺化管理每日紀錄列表
              </div>
            </div>
            
            {leader ? (
              <div className="space-y-2 pt-2">
                <Button
                  onClick={() => {
                    setShowUpgradeModal(false);
                    navigate("/subscription");
                  }}
                  className="w-full h-11 rounded-xl bg-[#1B4965] hover:bg-[#1B4965]/90 text-white font-bold"
                >
                  立即升級專業版
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowUpgradeModal(false)}
                  className="w-full h-11 rounded-xl text-gray-500 text-xs font-medium"
                >
                  稍後再說
                </Button>
              </div>
            ) : (
              <div className="space-y-2 pt-2">
                <Button
                  onClick={() => {
                    setShowUpgradeModal(false);
                    setShowLeaderLogin(true);
                  }}
                  className="w-full h-11 rounded-xl bg-[#1B4965] hover:bg-[#1B4965]/90 text-white font-bold"
                >
                  立即登入 / 註冊領導人
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowUpgradeModal(false)}
                  className="w-full h-11 rounded-xl text-gray-500 text-xs font-medium"
                >
                  取消
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 生成追蹤連結 Modal */}
      <Dialog open={showTrackingLinkModal} onOpenChange={setShowTrackingLinkModal}>
        <DialogContent className="max-w-[360px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#1B4965] flex items-center gap-2">
              <Crown size={18} className="text-yellow-500" />
              <span>生成客戶追蹤連結</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">客戶名稱/暱稱 (選填)</label>
              <Input
                placeholder="例如：小明"
                value={clientNameInput}
                onChange={e => setClientNameInput(e.target.value)}
                className="rounded-xl h-10 text-sm"
              />
              <p className="text-[10px] text-gray-400">填寫名稱有助於您在後台辨識是哪位客戶提交的進度。</p>
            </div>

            <Button
              onClick={handleGenerateTrackLink}
              className="w-full h-11 rounded-xl bg-[#22C55E] hover:bg-[#22C55E]/90 text-white font-bold"
            >
              生成專屬追蹤連結
            </Button>

            {generatedTrackUrl && (
              <div className="space-y-3 pt-3 border-t border-gray-100">
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                  <div className="text-[10px] font-bold text-gray-400 mb-1">專屬追蹤連結</div>
                  <div className="text-xs text-gray-700 break-all select-all font-mono">
                    {generatedTrackUrl}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedTrackUrl);
                      toast.success("連結複製成功！");
                    }}
                    className="h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
                  >
                    複製連結
                  </Button>
                  <Button
                    onClick={() => {
                      const shareText = `您好！這是您的專屬每日健康修復進度回報連結，請每天服用後點擊此處回報您的服用情況與身體反應：\n${generatedTrackUrl}`;
                      window.open(`https://line.me/R/share?text=${encodeURIComponent(shareText)}`, "_blank");
                    }}
                    className="h-10 rounded-xl bg-[#06C755] hover:bg-[#06C755]/90 text-white font-bold text-xs flex items-center justify-center gap-1"
                  >
                    分享至 LINE
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Update LINE URL Dialog */}
      <Dialog open={showUpdateLineModal} onOpenChange={setShowUpdateLineModal}>
        <DialogContent className="mx-4 rounded-2xl max-w-[90vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1B4965] text-center text-lg flex items-center justify-center gap-1.5">
              <Activity size={18} /> 更新 LINE 好友網址
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1 text-left">
            <p className="text-xs text-gray-500 leading-relaxed bg-amber-50 border border-amber-200/50 p-3 rounded-xl">
              💡 當您的 LINE 加好友條碼/連結更換時，輸入註冊時填寫的<b>真實姓名</b>與<b>手機號碼</b>，即可安全地將您的登入網址更新，確保帳號正常使用。
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1B4965]">真實姓名 <span className="text-red-500">*</span></label>
              <Input
                placeholder="請輸入您的真實姓名"
                value={updateFullName}
                onChange={e => setUpdateFullName(e.target.value)}
                className="rounded-xl h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1B4965]">手機號碼 <span className="text-red-500">*</span></label>
              <Input
                type="tel"
                placeholder="請輸入您的手機號碼"
                value={updatePhone}
                onChange={e => setUpdatePhone(e.target.value)}
                className="rounded-xl h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1B4965]">新的 LINE 個人好友網址 <span className="text-red-500">*</span></label>
              <Input
                placeholder="https://line.me/ti/p/..."
                value={updateNewLineUrl}
                onChange={e => setUpdateNewLineUrl(e.target.value)}
                className="rounded-xl h-9 text-sm"
              />
            </div>
            <Button
              onClick={handleUpdateLineUrl}
              disabled={updateLineUrlMutation.isPending}
              className="w-full h-11 rounded-xl font-bold mt-2 bg-[#1B4965] text-white"
            >
              {updateLineUrlMutation.isPending ? "更新中..." : "確認更新網址"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

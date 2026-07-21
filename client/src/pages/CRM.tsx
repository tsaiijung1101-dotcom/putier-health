import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAssessment } from "@/contexts/AssessmentContext";
import { 
  Users, 
  Search, 
  Star, 
  ChevronRight, 
  ArrowLeft, 
  Calendar,
  User as UserIcon,
  LogOut,
  Activity,
  UserCheck,
  ClipboardList,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function CRM() {
  const [, navigate] = useLocation();
  const { state, logoutLeader } = useAssessment();
  const { leader } = state;
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"assessments" | "progress">("assessments");

  // 權限檢查
  if (!leader) {
    navigate("/");
    return null;
  }

  const isLeaderPro = leader.status === "pro";

  const { data: assessments, isLoading, refetch } = trpc.assessment.getByLeader.useQuery({
    leaderLineUrl: leader.lineUrl
  });

  const { data: progressReports, isLoading: isProgressLoading } = trpc.clientProgress.listByLeader.useQuery(
    { leaderId: leader.customLeaderId || "" },
    { enabled: isLeaderPro && !!leader.customLeaderId }
  );

  const toggleFavorite = trpc.assessment.toggleFavorite.useMutation({
    onSuccess: () => refetch()
  });

  const deleteAssessment = trpc.assessment.delete.useMutation({
    onSuccess: () => {
      toast.success("紀錄已刪除");
      refetch();
    }
  });

  // 統計數據
  const stats = useMemo(() => {
    if (!assessments) return { total: 0, symptoms: 0, male: 0, female: 0 };
    return {
      total: assessments.length,
      symptoms: assessments.reduce((acc: number, curr: any) => acc + (curr.symptoms as string[]).length, 0),
      male: assessments.filter((a: any) => a.gender === 'male').length,
      female: assessments.filter((a: any) => a.gender === 'female').length,
    };
  }, [assessments]);

  // 排序與搜尋邏輯：星號最愛置頂，然後按日期排序
  const filteredData = useMemo(() => {
    if (!assessments) return [];
    return assessments
      .filter((a: any) => 
        a.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.symptoms as string[]).some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a: any, b: any) => {
        // 星號置頂
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        // 日期排序
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [assessments, searchTerm]);

  const handleLogout = () => {
    logoutLeader();
    navigate("/");
    toast.success("已成功登出領導人系統");
  };

  const getAge = (birthdate: string) => {
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };
  const getReactionLabel = (id: string) => {
    const map: Record<string, string> = {
      sleepy: "嗜睡",
      energetic: "精神變好",
      bowel: "排便增加",
      itchy: "皮膚發癢",
      sore: "身體痠痛",
      headache: "頭痛",
      dry_mouth: "口乾舌燥",
      bloating: "胃脹氣",
      normal: "無特殊感覺"
    };
    return map[id] || id;
  };

  const filteredProgressData = useMemo(() => {
    if (!progressReports) return [];
    return progressReports.filter((report: any) => {
      const clientName = report.clientId.includes('_')
        ? decodeURIComponent(report.clientId.split('_')[0])
        : report.clientId;
      return clientName.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [progressReports, searchTerm]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-4 shadow-sm">
        <div className="container max-w-md mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-full">
                <ArrowLeft size={20} />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-[#1B4965]">客戶管理中心</h1>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  目前登入：{leader.fullName || leader.name} ({leader.customLeaderId || '無ID'})
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-red-500">
              <LogOut size={20} />
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input 
              placeholder={activeTab === "assessments" ? "搜尋客戶姓名或症狀..." : "搜尋客戶名稱..."}
              className="pl-9 rounded-xl border-gray-100 bg-gray-50 focus-visible:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Tab Switcher */}
          <div className="flex border-b border-gray-100 mt-4">
            <button
              onClick={() => setActiveTab("assessments")}
              className={`flex-1 pb-2 text-center text-sm font-bold border-b-2 transition-all ${
                activeTab === "assessments"
                  ? "border-[#1B4965] text-[#1B4965]"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              健康評估紀錄
            </button>
            <button
              onClick={() => {
                if (!isLeaderPro) {
                  toast.error("此區塊為專業版專屬功能，請先升級專業版！");
                  return;
                }
                setActiveTab("progress");
              }}
              className={`flex-1 pb-2 text-center text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-1 ${
                activeTab === "progress"
                  ? "border-[#1B4965] text-[#1B4965]"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              客戶修復日誌 {!isLeaderPro && <span className="text-xs">🔒</span>}
            </button>
          </div>
        </div>
      </div>

      <div className="container max-w-md mx-auto px-4 py-6">
        {activeTab === "assessments" ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mb-2">
                  <ClipboardList size={18} className="text-blue-500" />
                </div>
                <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">總評估次數</div>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center mb-2">
                  <Activity size={18} className="text-purple-500" />
                </div>
                <div className="text-2xl font-bold text-gray-800">{stats.symptoms}</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">記錄症狀數</div>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center mb-2">
                  <UserCheck size={18} className="text-indigo-500" />
                </div>
                <div className="text-2xl font-bold text-gray-800">{stats.male}</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">男性記錄</div>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
                <div className="w-8 h-8 bg-pink-50 rounded-lg flex items-center justify-center mb-2">
                  <UserIcon size={18} className="text-pink-500" />
                </div>
                <div className="text-2xl font-bold text-gray-800">{stats.female}</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">女性記錄</div>
              </div>
            </div>

            {/* List Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Users size={18} className="text-blue-500" />
                  客戶紀錄清單
                </h3>
                <div className="text-[10px] font-bold text-gray-400">
                  共 {filteredData.length} 筆
                </div>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
                </div>
              ) : filteredData.length > 0 ? (
                <div className="space-y-4">
                  {filteredData.map((item: any) => {
                    const reportData = item.reportData as any;
                    const age = getAge(item.birthday);
                    
                    return (
                      <div 
                        key={item.id}
                        className={`bg-white rounded-2xl p-5 shadow-sm border transition-all active:scale-[0.99] cursor-pointer ${
                          item.isFavorite ? 'border-yellow-200 bg-yellow-50/30' : 'border-gray-50'
                        }`}
                        onClick={() => navigate(`/report/${item.id}`)}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg ${
                              item.gender === 'male' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'
                            }`}>
                              {item.nickname[0]}
                            </div>
                            <div>
                              <div className="font-bold text-gray-800 flex items-center gap-2">
                                {item.nickname}
                                <Badge variant="outline" className="font-normal text-[10px] px-1.5 h-4 border-gray-200 text-gray-400">
                                  {age} 歲
                                </Badge>
                              </div>
                              <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5 font-medium">
                                <Calendar size={10} />
                                {new Date(item.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite.mutate({ id: item.id, isFavorite: !item.isFavorite });
                              }}
                              className={`p-2 rounded-xl transition-colors ${
                                item.isFavorite ? 'text-yellow-500 bg-yellow-100' : 'text-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              <Star size={20} fill={item.isFavorite ? "currentColor" : "none"} />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("確定要刪除此筆紀錄嗎？")) {
                                  deleteAssessment.mutate({ id: item.id });
                                }
                              }}
                              className="p-2 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-100/50">
                            <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-1">身體指標</div>
                            <div className="text-xs text-gray-700 font-semibold">
                              {item.height ? `${item.height}cm` : '--'} / {item.weight ? `${item.weight}kg` : '--'}
                            </div>
                          </div>
                          <div className="bg-blue-50/30 rounded-xl p-3 border border-blue-100/30">
                            <div className="text-[9px] text-blue-400 font-bold uppercase tracking-wider mb-1">建議服用量</div>
                            <div className="text-xs text-blue-600 font-bold">
                              每日 {reportData?.recommendedDosage || '--'} 顆
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {(item.symptoms as string[]).map((sId, idx) => (
                            <span key={idx} className="px-2 py-1 bg-white text-gray-500 text-[10px] font-bold rounded-lg border border-gray-100">
                              {sId}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center justify-end mt-4 text-[10px] font-bold text-blue-500 gap-1">
                          查看完整報告 <ChevronRight size={12} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users size={32} className="text-gray-200" />
                  </div>
                  <p className="text-gray-400 text-sm font-medium">目前尚無符合的紀錄</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Activity size={18} className="text-[#22C55E]" />
                客戶每日修復日誌
              </h3>
              <div className="text-[10px] font-bold text-gray-400">
                共 {filteredProgressData.length} 筆
              </div>
            </div>

            {isProgressLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
              </div>
            ) : filteredProgressData.length > 0 ? (
              <div className="space-y-4">
                {filteredProgressData.map((report: any) => {
                  const clientName = report.clientId.includes('_')
                    ? decodeURIComponent(report.clientId.split('_')[0])
                    : report.clientId;

                  const reportDate = new Date(report.createdAt).toLocaleString("zh-TW", {
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div key={report.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center font-bold text-md">
                            {clientName[0]}
                          </div>
                          <div>
                            <div className="font-bold text-gray-800">{clientName}</div>
                            <div className="text-[9px] text-gray-400 flex items-center gap-1 mt-0.5 font-medium">
                              <Calendar size={10} />
                              {reportDate}
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-[#22C55E]/10 hover:bg-[#22C55E]/10 text-[#22C55E] border-none text-[10px] rounded-lg font-bold">
                          服用 {report.dosage} 顆 / {report.meals} 餐
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50/50 rounded-xl p-3 border border-gray-100/50">
                        <div>
                          <div className="text-[9px] text-gray-400 font-bold mb-0.5">連續服用天數</div>
                          <div className="font-bold text-gray-700">{report.consecutiveDays} 天</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-gray-400 font-bold mb-0.5">回報來源 ID</div>
                          <div className="text-gray-500 font-mono break-all text-[10px]">
                            {report.clientId.includes('_') ? report.clientId.split('_')[1] : report.clientId}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">今日身體反應</div>
                        <div className="flex flex-wrap gap-1.5">
                          {report.reactions && report.reactions.length > 0 ? (
                            (report.reactions as string[]).map((r: string, idx: number) => (
                              <span
                                key={idx}
                                className={`px-2 py-0.5 text-[10px] font-bold rounded-lg ${
                                  r === 'normal'
                                    ? 'bg-gray-100 text-gray-500'
                                    : 'bg-[#22C55E]/10 text-[#22C55E]'
                                }`}
                              >
                                {getReactionLabel(r)}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">無任何反應</span>
                          )}
                        </div>
                      </div>

                      {report.notes && (
                        <div className="bg-blue-50/40 rounded-xl p-3 border border-blue-100/30 text-xs text-gray-600 leading-relaxed italic">
                          " {report.notes} "
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity size={32} className="text-gray-200" />
                </div>
                <p className="text-gray-400 text-sm font-medium">目前尚無進度回報紀錄</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

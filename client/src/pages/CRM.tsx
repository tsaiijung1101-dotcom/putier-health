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

  // 權限檢查
  if (!leader) {
    navigate("/");
    return null;
  }

  const { data: assessments, isLoading, refetch } = trpc.assessment.listByLeader.useQuery({
    leaderLineUrl: leader.lineUrl
  });

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
      symptoms: assessments.reduce((acc, curr) => acc + (curr.symptoms as string[]).length, 0),
      male: assessments.filter(a => a.gender === 'male').length,
      female: assessments.filter(a => a.gender === 'female').length,
    };
  }, [assessments]);

  // 排序與搜尋邏輯：星號最愛置頂，然後按日期排序
  const filteredData = useMemo(() => {
    if (!assessments) return [];
    return assessments
      .filter(a => 
        a.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.symptoms as string[]).some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a, b) => {
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
              <h1 className="text-xl font-bold text-[#1B4965]">客戶管理中心</h1>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-red-500">
              <LogOut size={20} />
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input 
              placeholder="搜尋客戶姓名或症狀..." 
              className="pl-9 rounded-xl border-gray-100 bg-gray-50 focus-visible:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="container max-w-md mx-auto px-4 py-6">
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
              {filteredData.map((item) => {
                const reportData = item.reportData as any;
                const age = getAge(item.birthday);
                
                return (
                  <div 
                    key={item.id}
                    className={`bg-white rounded-2xl p-5 shadow-sm border transition-all active:scale-[0.99] ${
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
      </div>
    </div>
  );
}

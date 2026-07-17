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
  Filter, 
  MoreVertical,
  Calendar,
  User as UserIcon,
  LogOut
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
  const [filterFavorite, setFilterFavorite] = useState(false);

  // 權限檢查
  if (!leader) {
    navigate("/");
    return null;
  }

  const { data: assessments, isLoading, refetch } = trpc.assessment.getByLeader.useQuery({
    leaderLineUrl: leader.lineUrl
  });

  const toggleFavorite = trpc.assessment.toggleFavorite.useMutation({
    onSuccess: () => refetch()
  });

  const filteredData = useMemo(() => {
    if (!assessments) return [];
    return assessments.filter(a => {
      const matchSearch = a.nickname.toLowerCase().includes(searchTerm.toLowerCase());
      const matchFavorite = filterFavorite ? a.isFavorite : true;
      return matchSearch && matchFavorite;
    });
  }, [assessments, searchTerm, filterFavorite]);

  const handleLogout = () => {
    logoutLeader();
    navigate("/");
    toast.success("已成功登出領導人系統");
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4 shadow-sm">
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

        {/* Leader Profile Card */}
        <div className="bg-gradient-to-r from-[#1B4965] to-[#2d6a8f] rounded-2xl p-4 text-white mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <UserIcon size={24} />
            </div>
            <div>
              <div className="font-bold">{leader.name || "領導人"}</div>
              <div className="text-xs opacity-80">{leader.lineUrl}</div>
            </div>
            <Badge className="ml-auto bg-amber-400 text-[#1B4965] border-none font-bold">
              {leader.status.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input 
              placeholder="搜尋客戶姓名..." 
              className="pl-9 rounded-xl border-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            variant={filterFavorite ? "default" : "outline"} 
            size="icon" 
            className="rounded-xl"
            onClick={() => setFilterFavorite(!filterFavorite)}
            style={filterFavorite ? { background: "#1B4965" } : {}}
          >
            <Star size={18} fill={filterFavorite ? "white" : "none"} />
          </Button>
        </div>
      </div>

      {/* List Section */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-bold text-gray-500">
            共 {filteredData.length} 位客戶
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
          </div>
        ) : filteredData.length > 0 ? (
          <div className="space-y-3">
            {filteredData.map((item) => (
              <div 
                key={item.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 active:scale-[0.98] transition-transform"
                onClick={() => navigate(`/report/${item.id}`)}
              >
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-[#1B4965] font-bold text-lg">
                  {item.nickname[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-800 truncate">{item.nickname}</span>
                    {item.gender === 'female' ? (
                      <Badge className="bg-pink-100 text-pink-600 border-none text-[10px] px-1.5 h-4">女</Badge>
                    ) : (
                      <Badge className="bg-blue-100 text-blue-600 border-none text-[10px] px-1.5 h-4">男</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users size={12} />
                      {(item.symptoms as string[]).length} 項需求
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite.mutate({ id: item.id, isFavorite: !item.isFavorite });
                    }}
                  >
                    <Star 
                      size={20} 
                      className={item.isFavorite ? "text-amber-400" : "text-gray-200"} 
                      fill={item.isFavorite ? "currentColor" : "none"} 
                    />
                  </Button>
                  <ChevronRight size={18} className="text-gray-300" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
              <Users size={40} />
            </div>
            <p className="text-gray-400">暫無客戶資料</p>
          </div>
        )}
      </div>
    </div>
  );
}

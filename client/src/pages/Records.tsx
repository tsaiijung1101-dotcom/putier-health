import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Loader2,
  Search,
  Copy,
  ExternalLink,
  Calendar,
  User,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import { SYMPTOM_CATEGORIES } from "../../../shared/healthData";

function getSymptomLabel(id: string): string {
  for (const cat of SYMPTOM_CATEGORIES) {
    const item = cat.items.find(i => i.id === id);
    if (item) return item.label;
  }
  return id;
}

function calcAge(birthdate: string): number {
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function Records() {
  const [location, navigate] = useLocation();
  const params = new URLSearchParams(location.split("?")[1] || "");
  const initialLineId = params.get("line_id") || "";

  const [lineId, setLineId] = useState(initialLineId);
  const [searchLineId, setSearchLineId] = useState(initialLineId);

  const { data, isLoading, refetch } = trpc.assessment.getByLineId.useQuery(
    { lineId: searchLineId },
    { enabled: !!searchLineId }
  );

  useEffect(() => {
    if (initialLineId) {
      setSearchLineId(initialLineId);
    }
  }, [initialLineId]);

  const handleSearch = () => {
    if (!lineId.trim()) {
      toast.error("請輸入 LINE ID");
      return;
    }
    setSearchLineId(lineId.trim());
    navigate(`/records?line_id=${encodeURIComponent(lineId.trim())}`);
  };

  const handleCopyUrl = () => {
    const url = `${window.location.origin}/records?line_id=${encodeURIComponent(searchLineId)}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("已複製分享連結");
    });
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--putier-bg)" }}>
      {/* Header */}
      <div className="sticky top-0 z-10 shadow-sm" style={{ background: "#1B4965" }}>
        <div className="container flex items-center gap-3 py-3">
          <button
            onClick={() => navigate("/")}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-white font-bold text-base flex-1">查看評估紀錄</h1>
        </div>
      </div>

      <div className="container py-4 space-y-4 pb-8">
        {/* Search */}
        <div className="putier-card">
          <div className="text-sm font-bold text-[#1B4965] mb-3">輸入客戶 LINE ID</div>
          <div className="flex gap-2">
            <Input
              placeholder="請輸入 LINE ID"
              value={lineId}
              onChange={e => setLineId(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              className="rounded-xl flex-1"
            />
            <Button
              onClick={handleSearch}
              className="rounded-xl px-4"
              style={{ background: "#1B4965", color: "white" }}
            >
              <Search size={16} />
            </Button>
          </div>
          {searchLineId && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 truncate">
                {window.location.origin}/records?line_id={searchLineId}
              </div>
              <button
                onClick={handleCopyUrl}
                className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <Copy size={14} className="text-gray-600" />
              </button>
            </div>
          )}
        </div>

        {/* Results */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={28} className="animate-spin text-[#1B4965]" />
          </div>
        )}

        {!isLoading && searchLineId && data && data.length === 0 && (
          <div className="putier-card text-center py-8">
            <ClipboardList size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">找不到此 LINE ID 的評估紀錄</p>
            <p className="text-xs text-gray-400 mt-1">LINE ID: {searchLineId}</p>
          </div>
        )}

        {!isLoading && data && data.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-[#1B4965]">
                找到 {data.length} 筆紀錄
              </div>
              <div className="text-xs text-gray-500">LINE ID: {searchLineId}</div>
            </div>

            {data.map((record) => {
              const age = calcAge(record.birthdate);
              const selectedSymptoms = record.selectedSymptoms as string[];
              const createdDate = new Date(record.createdAt).toLocaleDateString("zh-TW", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div key={record.id} className="putier-card">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-[#1B4965]" />
                        <span className="text-sm font-bold text-gray-800">{record.nickname}</span>
                        <span className="text-xs text-gray-500">
                          {age} 歲 · {record.gender === "male" ? "男性" : "女性"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Calendar size={12} className="text-gray-400" />
                        <span className="text-xs text-gray-400">{createdDate}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/report/${record.id}`)}
                      className="flex items-center gap-1 text-xs text-[#1B4965] font-medium bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <ExternalLink size={12} />
                      查看報告
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-gray-50 rounded-xl p-2 text-center">
                      <div className="text-xs text-gray-500">保健需求</div>
                      <div className="text-base font-bold text-[#1B4965]">{selectedSymptoms.length}</div>
                      <div className="text-xs text-gray-400">項</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-2 text-center">
                      <div className="text-xs text-gray-500">建議顆數</div>
                      <div className="text-base font-bold text-[#1B4965]">{record.recommendedDosage ?? "-"}</div>
                      <div className="text-xs text-gray-400">顆/天</div>
                    </div>
                    {record.bmi ? (
                      <div className="bg-gray-50 rounded-xl p-2 text-center">
                        <div className="text-xs text-gray-500">BMI</div>
                        <div className="text-base font-bold text-[#1B4965]">{record.bmi}</div>
                        <div className="text-xs text-gray-400">指數</div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-xl p-2 text-center">
                        <div className="text-xs text-gray-500">首套天數</div>
                        <div className="text-base font-bold text-[#1B4965]">{record.firstSetDays ?? "-"}</div>
                        <div className="text-xs text-gray-400">天</div>
                      </div>
                    )}
                  </div>

                  {/* Symptoms preview */}
                  {selectedSymptoms.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedSymptoms.slice(0, 5).map(id => (
                        <span
                          key={id}
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: "#EDE9FE", color: "#7C3AED" }}
                        >
                          {getSymptomLabel(id)}
                        </span>
                      ))}
                      {selectedSymptoms.length > 5 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          +{selectedSymptoms.length - 5} 項
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

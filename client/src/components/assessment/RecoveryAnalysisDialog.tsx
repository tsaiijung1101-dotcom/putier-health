import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Info, Lightbulb, TrendingUp, ShieldCheck } from "lucide-react";

interface AnalysisResult {
  title: string;
  explanation: string;
  suggestion: string;
  lifestyleTip: string;
  category: string;
}

interface RecoveryAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: {
    feedbacks: AnalysisResult[];
    dosageAdvice: string;
    bigDataInsight: string;
    trends: string[];
    isHighDosage: boolean;
  } | null;
}

export default function RecoveryAnalysisDialog({ open, onOpenChange, analysis }: RecoveryAnalysisDialogProps) {
  if (!analysis) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mx-4 rounded-3xl max-w-[90vw] max-h-[85vh] overflow-y-auto border-none p-0">
        <div className="bg-gradient-to-b from-[#1B4965] to-[#2a6a91] p-6 text-white relative overflow-hidden">
          <Sparkles className="absolute top-4 right-4 opacity-20" size={60} />
          <DialogHeader>
            <DialogTitle className="text-white text-xl flex items-center gap-2">
              <ShieldCheck className="text-[#22C55E]" />
              今日專屬小秘書分析
            </DialogTitle>
          </DialogHeader>
          <p className="text-white/80 text-sm mt-2">
            根據您今日的回報，我們為您準備了以下細胞修復解析：
          </p>
        </div>

        <div className="p-6 space-y-6 bg-gray-50">
          {/* 趨勢預警 */}
          {analysis.trends.length > 0 && (
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-orange-700 font-bold text-sm mb-2">
                <TrendingUp size={16} />
                趨勢預警
              </div>
              {analysis.trends.map((trend, i) => (
                <p key={i} className="text-orange-600 text-xs leading-relaxed">
                  • {trend}
                </p>
              ))}
            </div>
          )}

          {/* 劑量建議 */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-[#1B4965] font-bold text-sm mb-2">
              <Info size={16} />
              劑量與修復建議
            </div>
            <p className="text-gray-600 text-xs leading-relaxed">
              {analysis.dosageAdvice}
            </p>
          </div>

          {/* 大數據洞察 */}
          <div className="bg-[#22C55E]/5 border border-[#22C55E]/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-[#15803d] font-bold text-sm mb-2">
              <ShieldCheck size={16} />
              大數據修復軌跡參考
            </div>
            <p className="text-gray-600 text-xs leading-relaxed">
              {analysis.bigDataInsight}
            </p>
          </div>

          {/* 反應解析 */}
          <div className="space-y-4">
            <h3 className="text-[#1B4965] font-bold text-sm flex items-center gap-2 px-1">
              <Lightbulb size={16} className="text-yellow-500" />
              生理機制解析
            </h3>
            
            {analysis.feedbacks.length > 0 ? (
              analysis.feedbacks.map((fb, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-800">{fb.title}</span>
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                      {fb.category}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {fb.explanation}
                  </p>
                  <div className="pt-2 border-t border-dashed border-gray-100 mt-2">
                    <p className="text-xs text-[#22C55E] font-medium">
                      💡 生活小貼士：{fb.lifestyleTip}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500">今日身體適應良好，請繼續保持穩定的服用習慣與充足飲水！</p>
              </div>
            )}
          </div>

          <Button 
            onClick={() => onOpenChange(false)}
            className="w-full h-12 rounded-xl font-bold text-white shadow-lg"
            style={{ background: "#1B4965" }}
          >
            我了解了，繼續加油
          </Button>
          
          <p className="text-center text-[10px] text-gray-400">
            ※ 以上分析僅供參考，不具醫療診斷效力。如有極度不適請諮詢專業人員。
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

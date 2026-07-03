import { useState, useRef } from "react";
import { useAssessment } from "@/contexts/AssessmentContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Camera,
  X,
  ChevronRight,
  User,
  Calendar,
  Ruler,
  Weight,
  Pill,
  Scissors,
  Hash,
} from "lucide-react";

export default function Step1BasicInfo() {
  const { state, updateBasicInfo, setStep } = useAssessment();
  const { basicInfo } = state;
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().split("T")[0];

  const handleNext = () => {
    if (!basicInfo.nickname.trim()) {
      toast.error("請填寫暱稱");
      return;
    }
    if (!basicInfo.birthdate) {
      toast.error("請選擇生日");
      return;
    }
    if (basicInfo.birthdate > today) {
      toast.error("生日不可選擇未來日期");
      return;
    }
    if (!basicInfo.gender) {
      toast.error("請選擇性別");
      return;
    }
    setStep(2);
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => formData.append("images", file));

      const res = await fetch("/api/upload/medication-image", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "上傳失敗");

      updateBasicInfo({
        medicationImages: [...basicInfo.medicationImages, ...data.files],
      });
      toast.success(`成功上傳 ${data.files.length} 張圖片`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "上傳失敗";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = basicInfo.medicationImages.filter((_, i) => i !== index);
    updateBasicInfo({ medicationImages: newImages });
  };

  return (
    <div className="space-y-4 pb-6">
      {/* LINE ID */}
      <div className="putier-card">
        <div className="flex items-center gap-2 mb-3">
          <Hash size={16} className="text-[#1B4965]" />
          <Label className="text-sm font-bold text-[#1B4965]">LINE ID（選填）</Label>
        </div>
        <Input
          placeholder="輸入 LINE ID 以便日後查詢紀錄"
          value={basicInfo.lineId}
          onChange={e => updateBasicInfo({ lineId: e.target.value })}
          className="rounded-xl"
        />
        <p className="text-xs text-gray-400 mt-1.5">填寫後可透過 LINE ID 查詢歷史評估紀錄</p>
      </div>

      {/* 暱稱 */}
      <div className="putier-card">
        <div className="flex items-center gap-2 mb-3">
          <User size={16} className="text-[#1B4965]" />
          <Label className="text-sm font-bold text-[#1B4965]">
            暱稱 <span className="text-red-500">*</span>
          </Label>
        </div>
        <Input
          placeholder="請輸入您的暱稱"
          value={basicInfo.nickname}
          onChange={e => updateBasicInfo({ nickname: e.target.value })}
          className="rounded-xl"
        />
      </div>

      {/* 生日 */}
      <div className="putier-card">
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={16} className="text-[#1B4965]" />
          <Label className="text-sm font-bold text-[#1B4965]">
            生日 <span className="text-red-500">*</span>
          </Label>
        </div>
        <Input
          type="date"
          max={today}
          value={basicInfo.birthdate}
          onChange={e => {
            const val = e.target.value;
            if (val > today) {
              toast.error("生日不可選擇未來日期");
              return;
            }
            updateBasicInfo({ birthdate: val });
          }}
          className="rounded-xl"
        />
      </div>

      {/* 性別 */}
      <div className="putier-card">
        <div className="flex items-center gap-2 mb-3">
          <User size={16} className="text-[#1B4965]" />
          <Label className="text-sm font-bold text-[#1B4965]">
            性別 <span className="text-red-500">*</span>
          </Label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: "male", label: "♂ 男性" },
            { value: "female", label: "♀ 女性" },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => updateBasicInfo({ gender: opt.value as "male" | "female" })}
              className={`h-12 rounded-xl border-2 font-bold text-sm transition-all duration-200 ${
                basicInfo.gender === opt.value
                  ? "border-[#1B4965] bg-[#1B4965] text-white shadow-md"
                  : "border-gray-200 bg-white text-gray-600 hover:border-[#1B4965]/40"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 身高體重 */}
      <div className="putier-card">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Ruler size={14} className="text-[#1B4965]" />
              <Label className="text-sm font-bold text-[#1B4965]">身高（選填）</Label>
            </div>
            <div className="relative">
              <Input
                type="number"
                placeholder="cm"
                min={50}
                max={250}
                value={basicInfo.height}
                onChange={e => updateBasicInfo({ height: e.target.value })}
                className="rounded-xl pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">cm</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Weight size={14} className="text-[#1B4965]" />
              <Label className="text-sm font-bold text-[#1B4965]">體重（選填）</Label>
            </div>
            <div className="relative">
              <Input
                type="number"
                placeholder="kg"
                min={20}
                max={300}
                value={basicInfo.weight}
                onChange={e => updateBasicInfo({ weight: e.target.value })}
                className="rounded-xl pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">kg</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">填寫後可計算 BMI 與每日建議喝水量</p>
      </div>

      {/* 用藥情況 */}
      <div className="putier-card">
        <div className="flex items-center gap-2 mb-3">
          <Pill size={16} className="text-[#1B4965]" />
          <Label className="text-sm font-bold text-[#1B4965]">用藥情況（選填）</Label>
        </div>
        <Textarea
          placeholder="請描述目前用藥情況（藥物名稱、劑量等）"
          value={basicInfo.medications}
          onChange={e => updateBasicInfo({ medications: e.target.value })}
          className="rounded-xl resize-none"
          rows={3}
        />
        {/* Image Upload */}
        <div className="mt-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 text-sm text-[#1B4965] font-medium border border-dashed border-[#1B4965]/40 rounded-xl px-4 py-2.5 w-full justify-center hover:bg-[#1B4965]/5 transition-colors disabled:opacity-50"
          >
            <Camera size={16} />
            {uploading ? "上傳中..." : "拍照或選擇藥物圖片（可多張）"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => handleImageUpload(e.target.files)}
          />
        </div>
        {/* Image Preview */}
        {basicInfo.medicationImages.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {basicInfo.medicationImages.map((img, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200">
                <img
                  src={img.url}
                  alt={img.originalName}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 手術史 */}
      <div className="putier-card">
        <div className="flex items-center gap-2 mb-3">
          <Scissors size={16} className="text-[#1B4965]" />
          <Label className="text-sm font-bold text-[#1B4965]">過去手術史（選填）</Label>
        </div>
        <Textarea
          placeholder="請描述過去曾接受的手術（手術名稱、時間等）"
          value={basicInfo.surgeryHistory}
          onChange={e => updateBasicInfo({ surgeryHistory: e.target.value })}
          className="rounded-xl resize-none"
          rows={3}
        />
      </div>

      {/* Next Button */}
      <Button
        onClick={handleNext}
        className="w-full h-13 text-base font-bold rounded-xl shadow-lg"
        style={{ background: "#1B4965", color: "white" }}
      >
        下一步：症狀勾選
        <ChevronRight size={18} className="ml-1" />
      </Button>
    </div>
  );
}

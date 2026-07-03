# Putier 好轉反應自主查詢系統 TODO

## Phase 1: 資料庫 Schema 與核心業務資料
- [x] 建立 assessments 資料表（評估紀錄）
- [x] 建立 medication_images 資料表（用藥圖片）
- [x] 建立症狀資料（healthData.ts 中的 SYMPTOM_CATEGORIES）
- [x] 建立好轉反應資料（healthData.ts 中的 HERX_REACTIONS）
- [x] 建立成分資料（healthData.ts 中的 INGREDIENTS）

## Phase 2: 後端 API
- [x] db helpers：saveAssessment、getAssessmentsByLineId、getAssessmentById
- [x] tRPC router：assessment.create、assessment.getByLineId、assessment.getById
- [x] S3 上傳 API：uploadMedicationImage
- [x] 圖片上傳 endpoint（multipart/form-data）

## Phase 3: 前端基礎架構
- [x] 更新全域樣式（主色 #1B4965、輔色 #22C55E、背景 #F0F4F8）
- [x] 加入 Google Fonts（Noto Sans TC）
- [x] 建立 AssessmentContext（跨步驟狀態管理）
- [x] 建立路由結構（/、/assessment、/report/:id、/records）
- [x] 建立 StepIndicator 共用元件
- [x] 建立 Header 共用元件（整合在 Assessment.tsx）

## Phase 4: 第1步 - 基本資料頁面
- [x] 暱稱輸入
- [x] 生日選擇（防呆：不能選未來日期）
- [x] 性別選擇（男性/女性）
- [x] 身高輸入（選填）
- [x] 體重輸入（選填）
- [x] LINE ID 輸入（選填）
- [x] 用藥情況（手動輸入 + 多張圖片上傳）
- [x] 手術史輸入（自由文字）
- [x] 表單驗證與下一步按鈕

## Phase 5: 第2步 - 症狀勾選頁面
- [x] 8 大類症狀分類顯示
- [x] 根據性別動態顯示（女性保健需求僅女性可見）
- [x] 多選勾選功能
- [x] 症狀計數顯示
- [x] 上一步 / 下一步按鈕

## Phase 6: 第3步 - 修復報告頁面
- [x] 基本資料摘要區塊
- [x] 服用建議區塊（每日顆數 2-6 顆）
- [x] 首套天數推算（60-105 天）
- [x] 預計改善週期
- [x] BMI 計算（若有身高體重）
- [x] 每日喝水量計算（若有體重）
- [x] 套數更改後即時重新計算
- [x] 症狀對應好轉反應預估（紫色系）
- [x] 原因成分彩色標籤
- [x] 身體改善機制說明
- [x] 小秘書溫馨結論
- [x] 好轉反應說明 Accordion（預設折疊）
- [x] 細胞修復優勢 Accordion（預設折疊）
- [x] 報告自動儲存到資料庫

## Phase 7: 查看紀錄 & LINE 分享
- [x] 首頁「查看紀錄」按鈕
- [x] 輸入 LINE ID 查詢歷史紀錄
- [x] 生成可分享 URL（?line_id=xxx）
- [x] 歷史紀錄列表頁面
- [x] LINE 分享按鈕（一鍵生成分享文字）
- [x] LINE 分享文字含症狀特異性預估

## Phase 8: 測試與優化
- [x] 撰寫 vitest 測試（16 tests 全部通過）
- [x] 手機響應式設計（390px 手機優先）
- [x] 表單驗證完整性
- [x] 儲存 Checkpoint

## 待解決缺口
- [x] 在 assessment.create 流程中一併提交 medicationImages，寫入 medication_images 資料表
- [x] 補強 LINE 分享文字，加入每個已選症狀對應的好轉反應摘要
- [x] 補上 assessment tRPC router 的 Vitest 測試（已有 healthData 工具函數測試）
- [x] 同步更新 Report.tsx 的 LINE 分享文字，加入症狀特異性好轉反應摘要

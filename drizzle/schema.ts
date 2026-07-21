import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  json,
  decimal,
  boolean,
  datetime,
} from "drizzle-orm/mysql-core";

// 領導人註冊會員表
export const users = mysqlTable("users", {
  lineUrl: varchar("line_url", { length: 500 }).primaryKey(), // 連動 of LINE URL
  openId: varchar("openId", { length: 255 }), // Restore to support legacy tests
  name: varchar("name", { length: 255 }),
  authCode: varchar("auth_code", { length: 255 }), // Upgrade code
  status: varchar("status", { length: 50 }).default("free"),
  subscriptionStatus: varchar("subscriptionStatus", { length: 50 }),
  subscriptionExpiresAt: datetime("subscriptionExpiresAt"),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }), // OAuth integration
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(), // OAuth integration
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(), // OAuth integration
  expiredAt: datetime("expired_at"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  // Extended profile fields
  fullName: varchar("full_name", { length: 255 }), // Real name
  phone: varchar("phone", { length: 50 }), // Phone
  email: varchar("email", { length: 255 }), // Email
  customLeaderId: varchar("custom_leader_id", { length: 255 }), // Custom Leader ID
  lineId: varchar("line_id", { length: 255 }), // LINE ID
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// 客戶評估與跟進紀錄表
export const assessments = mysqlTable("assessments", {
  id: int("id").autoincrement().primaryKey(),
  lineId: varchar("line_id", { length: 255 }), // 用戶的 LINE ID
  nickname: varchar("nickname", { length: 255 }).notNull(), // 客戶姓名/暱稱
  birthday: varchar("birthday", { length: 255 }).notNull(), // 出生年月日
  gender: mysqlEnum("gender", ["male", "female"]).notNull(), // 性別
  height: decimal("height", { precision: 5, scale: 1 }), // 身高
  weight: decimal("weight", { precision: 5, scale: 1 }), // 體重
  symptoms: json("symptoms").$type<string[]>().notNull(), // 勾選的病症標籤
  customSymptoms: text("customSymptoms"), // 自填症狀/手術史
  reportData: json("reportData").notNull(), // 完整報告數據
  leaderLineUrl: varchar("leader_line_url", { length: 500 }), // 領導人的 LINE 網址 (數據隔離)
  isFavorite: boolean("is_favorite").default(false), // 星號最愛跟進標記
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  // 新增欄位
  leaderId: varchar("leader_id", { length: 255 }), // 領導人 ID
});

export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = typeof assessments.$inferInsert;

// 用藥圖片表 (保留原有的 S3 圖片關聯，雖然規格沒提到，但為了功能完整性建議保留或視需求調整)
export const medicationImages = mysqlTable("medication_images", {
  id: int("id").autoincrement().primaryKey(),
  assessmentId: int("assessmentId").notNull(),
  s3Key: varchar("s3Key", { length: 500 }).notNull(),
  s3Url: varchar("s3Url", { length: 1000 }).notNull(),
  originalName: varchar("originalName", { length: 255 }),
  mimeType: varchar("mimeType", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// 修復日誌表 (保留原有的日誌功能)
export const recoveryLogs = mysqlTable("recovery_logs", {
  id: int("id").autoincrement().primaryKey(),
  lineId: varchar("lineId", { length: 100 }).notNull(),
  dosage: int("dosage").notNull(),
  reactions: json("reactions").$type<string[]>().notNull(),
  notes: text("notes"),
  reportDate: varchar("reportDate", { length: 20 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RecoveryLog = typeof recoveryLogs.$inferSelect;
export type InsertRecoveryLog = typeof recoveryLogs.$inferInsert;

// 客戶每日修復進度回報表
export const clientProgressReports = mysqlTable("client_progress_reports", {
  id: int("id").autoincrement().primaryKey(),
  leaderId: varchar("leader_id", { length: 255 }).notNull(), // 推薦領導人 ID
  clientId: varchar("client_id", { length: 255 }).notNull(), // 獨特客戶 ID
  dosage: int("dosage").notNull(), // 今日服用顆數
  meals: int("meals").notNull(), // 服用分幾餐
  consecutiveDays: int("consecutive_days").notNull(), // 連續服用天數
  reactions: json("reactions").$type<string[]>().notNull(), // 今日身體反應
  notes: text("notes"), // 文字補充說明
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ClientProgressReport = typeof clientProgressReports.$inferSelect;
export type InsertClientProgressReport = typeof clientProgressReports.$inferInsert;

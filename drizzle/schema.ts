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
  lineUrl: varchar("line_url", { length: 500 }).primaryKey(), // 連動的 LINE 好友網址
  name: varchar("name", { length: 255 }),
  authCode: varchar("auth_code", { length: 255 }), // 訂閱授權碼
  status: varchar("status", { length: 50 }).default("free"),
  expiredAt: datetime("expired_at"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// 客戶評估與跟進紀錄表
export const assessments = mysqlTable("assessments", {
  id: int("id").autoincrement().primaryKey(),
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

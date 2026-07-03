import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  json,
  float,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// 評估紀錄主表
export const assessments = mysqlTable("assessments", {
  id: int("id").autoincrement().primaryKey(),
  lineId: varchar("lineId", { length: 100 }),
  nickname: varchar("nickname", { length: 100 }).notNull(),
  birthdate: varchar("birthdate", { length: 20 }).notNull(), // YYYY-MM-DD
  gender: mysqlEnum("gender", ["male", "female"]).notNull(),
  height: float("height"), // cm, optional
  weight: float("weight"), // kg, optional
  medications: text("medications"), // 用藥情況文字
  surgeryHistory: text("surgeryHistory"), // 手術史
  // 勾選的症狀 JSON array of symptom IDs
  selectedSymptoms: json("selectedSymptoms").$type<string[]>().notNull(),
  // 報告計算結果快照
  recommendedDosage: int("recommendedDosage"), // 建議每日顆數
  firstSetDays: int("firstSetDays"), // 首套天數
  setCount: int("setCount").default(1), // 套數
  bmi: float("bmi"), // BMI 值
  dailyWater: float("dailyWater"), // 每日喝水量 ml
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = typeof assessments.$inferInsert;

// 用藥圖片表
export const medicationImages = mysqlTable("medication_images", {
  id: int("id").autoincrement().primaryKey(),
  assessmentId: int("assessmentId").notNull(),
  s3Key: varchar("s3Key", { length: 500 }).notNull(),
  s3Url: varchar("s3Url", { length: 1000 }).notNull(),
  originalName: varchar("originalName", { length: 255 }),
  mimeType: varchar("mimeType", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MedicationImage = typeof medicationImages.$inferSelect;
export type InsertMedicationImage = typeof medicationImages.$inferInsert;

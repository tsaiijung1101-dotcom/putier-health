import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users, assessments, medicationImages, InsertAssessment, recoveryLogs, InsertRecoveryLog, User } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const connection = await mysql.createConnection({
        uri: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: true,
        },
      });
      _db = drizzle(connection);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.lineUrl) throw new Error("User lineUrl is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { 
      lineUrl: user.lineUrl,
      name: user.name,
      authCode: user.authCode,
      status: user.status ?? 'free',
      expiredAt: user.expiredAt
    };
    
    const updateSet: Partial<User> = {
      name: user.name,
      authCode: user.authCode,
      status: user.status ?? 'free',
      expiredAt: user.expiredAt
    };

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByLineUrl(lineUrl: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.lineUrl, lineUrl)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ── Assessment helpers ────────────────────────────────────

export async function saveAssessment(data: InsertAssessment): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(assessments).values(data);
  // @ts-ignore - mysql2 returns insertId
  return result[0].insertId as number;
}

export async function getAssessmentsByLeaderLineUrl(leaderLineUrl: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(assessments)
    .where(eq(assessments.leaderLineUrl, leaderLineUrl))
    .orderBy(desc(assessments.createdAt));
}

export async function toggleFavoriteAssessment(id: number, isFavorite: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(assessments).set({ isFavorite }).where(eq(assessments.id, id));
}

export async function getAssessmentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(assessments).where(eq(assessments.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function saveMedicationImage(data: {
  assessmentId: number;
  s3Key: string;
  s3Url: string;
  originalName?: string;
  mimeType?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(medicationImages).values(data);
}

export async function getMedicationImagesByAssessmentId(assessmentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(medicationImages)
    .where(eq(medicationImages.assessmentId, assessmentId));
}

// ── Recovery Log helpers ──────────────────────────────────

export async function saveRecoveryLog(data: InsertRecoveryLog): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(recoveryLogs).values(data);
  // @ts-ignore - mysql2 returns insertId
  return result[0].insertId as number;
}

export async function getRecoveryLogsByLineId(lineId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(recoveryLogs)
    .where(eq(recoveryLogs.lineId, lineId))
    .orderBy(desc(recoveryLogs.createdAt));
}

export async function updateUserSubscription(openId: string, data: {
  subscriptionStatus: string;
  subscriptionExpiresAt?: Date | null;
  stripeCustomerId?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  console.log(`[DB] Updating subscription for ${openId} to ${data.subscriptionStatus}`);
  
  // Try to update first
  const result = await db.update(users).set(data).where(eq(users.openId, openId));
  
  // If no rows affected, the user might not exist, so insert them
  // @ts-ignore - mysql2 returns affectedRows
  if (result[0].affectedRows === 0) {
    console.log(`[DB] User ${openId} not found during subscription update, creating new user`);
    await db.insert(users).values({
      openId,
      ...data
    });
  }
  
  console.log(`[DB] Subscription update process completed for ${openId}`);
}

import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, assessments, medicationImages, InsertAssessment, recoveryLogs, InsertRecoveryLog } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
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

export async function getAssessmentsByLineId(lineId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(assessments)
    .where(eq(assessments.lineId, lineId))
    .orderBy(desc(assessments.createdAt));
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

import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users, assessments, medicationImages, InsertAssessment, recoveryLogs, InsertRecoveryLog, User, clientProgressReports, InsertClientProgressReport, ClientProgressReport } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: any = null;

// Global in-memory fallback state to persist data across requests when MySQL is unavailable
const memUsers = new Map<string, any>();
const memAssessments: any[] = [];
const memMedicationImages: any[] = [];
const memRecoveryLogs: any[] = [];
const memClientProgressReports: any[] = [];

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
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available. Falling back to in-memory store.");
    const existing = memUsers.get(user.lineUrl);
    const updated = {
      ...existing,
      ...user,
      id: existing?.id ?? (memUsers.size + 1),
      createdAt: existing?.createdAt ?? new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
    memUsers.set(user.lineUrl, updated);
    if (user.openId) {
      memUsers.set(user.openId, updated);
    }
    return;
  }

  try {
    const values: InsertUser = { 
      lineUrl: user.lineUrl,
      name: user.name,
      authCode: user.authCode,
      status: user.status ?? 'free',
      expiredAt: user.expiredAt,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      customLeaderId: user.customLeaderId,
      lineId: user.lineId,
    };
    
    const updateSet: Partial<User> = {
      name: user.name,
      authCode: user.authCode,
      status: user.status ?? 'free',
      expiredAt: user.expiredAt,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      customLeaderId: user.customLeaderId,
      lineId: user.lineId,
    };

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByCustomLeaderId(customLeaderId: string) {
  const db = await getDb();
  if (!db) {
    let found: any = undefined;
    memUsers.forEach(u => {
      if (u.customLeaderId === customLeaderId) {
        found = u;
      }
    });
    return found;
  }
  const result = await db.select().from(users).where(eq(users.customLeaderId, customLeaderId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByLineUrl(lineUrl: string) {
  const db = await getDb();
  if (!db) {
    return memUsers.get(lineUrl);
  }
  const result = await db.select().from(users).where(eq(users.lineUrl, lineUrl)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    return memUsers.get(openId);
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByFullNameAndPhone(fullName: string, phone: string) {
  const db = await getDb();
  if (!db) {
    let found: any = undefined;
    memUsers.forEach(u => {
      if (u.fullName === fullName && u.phone === phone) {
        found = u;
      }
    });
    return found;
  }
  const result = await db.select().from(users).where(and(eq(users.fullName, fullName), eq(users.phone, phone))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    let found: any = undefined;
    memUsers.forEach(u => {
      if (u.email === email) {
        found = u;
      }
    });
    return found;
  }
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByLineId(lineId: string) {
  const db = await getDb();
  if (!db) {
    let found: any = undefined;
    memUsers.forEach(u => {
      if (u.lineId === lineId) {
        found = u;
      }
    });
    return found;
  }
  const result = await db.select().from(users).where(eq(users.lineId, lineId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserLineUrl(oldLineUrl: string, newLineUrl: string) {
  const db = await getDb();
  if (!db) {
    const user = memUsers.get(oldLineUrl);
    if (user) {
      user.lineUrl = newLineUrl;
      memUsers.delete(oldLineUrl);
      memUsers.set(newLineUrl, user);
      if (user.openId) {
        memUsers.set(user.openId, user);
      }
    }
    memAssessments.forEach(a => {
      if (a.leaderLineUrl === oldLineUrl) {
        a.leaderLineUrl = newLineUrl;
      }
    });
    return;
  }

  await db.update(users).set({ lineUrl: newLineUrl }).where(eq(users.lineUrl, oldLineUrl));
  await db.update(assessments).set({ leaderLineUrl: newLineUrl }).where(eq(assessments.leaderLineUrl, oldLineUrl));
}

// ── Assessment helpers ────────────────────────────────────

export async function saveAssessment(data: InsertAssessment): Promise<number> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save assessment: database not available. Falling back to in-memory store.");
    const id = memAssessments.length + 1;
    const record = {
      ...data,
      id,
      isFavorite: false,
      createdAt: new Date(),
    };
    memAssessments.push(record);
    return id;
  }
  const result = await db.insert(assessments).values(data);
  // @ts-ignore - mysql2 returns insertId
  return result[0].insertId as number;
}

export async function getAssessmentsByLineId(lineId: string) {
  const db = await getDb();
  if (!db) {
    return memAssessments
      .filter(a => a.lineId === lineId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  return db
    .select()
    .from(assessments)
    .where(eq(assessments.lineId, lineId))
    .orderBy(desc(assessments.createdAt));
}

export async function getAssessmentsByLeaderLineUrl(leaderLineUrl: string) {
  const db = await getDb();
  if (!db) {
    return memAssessments
      .filter(a => a.leaderLineUrl === leaderLineUrl)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  return db
    .select()
    .from(assessments)
    .where(eq(assessments.leaderLineUrl, leaderLineUrl))
    .orderBy(desc(assessments.createdAt));
}

export async function toggleFavoriteAssessment(id: number, isFavorite: boolean) {
  const db = await getDb();
  if (!db) {
    const item = memAssessments.find(a => a.id === id);
    if (item) item.isFavorite = isFavorite;
    return;
  }
  await db.update(assessments).set({ isFavorite }).where(eq(assessments.id, id));
}

export async function deleteAssessment(id: number) {
  const db = await getDb();
  if (!db) {
    const idx = memAssessments.findIndex(a => a.id === id);
    if (idx !== -1) memAssessments.splice(idx, 1);
    return;
  }
  await db.delete(assessments).where(eq(assessments.id, id));
}

export async function getAssessmentById(id: number) {
  const db = await getDb();
  if (!db) {
    return memAssessments.find(a => a.id === id);
  }
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
  if (!db) {
    memMedicationImages.push({
      ...data,
      id: memMedicationImages.length + 1,
      createdAt: new Date(),
    });
    return;
  }
  await db.insert(medicationImages).values(data);
}

export async function getMedicationImagesByAssessmentId(assessmentId: number) {
  const db = await getDb();
  if (!db) {
    return memMedicationImages.filter(img => img.assessmentId === assessmentId);
  }
  return db
    .select()
    .from(medicationImages)
    .where(eq(medicationImages.assessmentId, assessmentId));
}

// ── Recovery Log helpers ──────────────────────────────────

export async function saveRecoveryLog(data: InsertRecoveryLog): Promise<number> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save recovery log: database not available. Falling back to in-memory store.");
    const id = memRecoveryLogs.length + 1;
    memRecoveryLogs.push({
      ...data,
      id,
      createdAt: new Date(),
    });
    return id;
  }
  const result = await db.insert(recoveryLogs).values(data);
  // @ts-ignore - mysql2 returns insertId
  return result[0].insertId as number;
}

export async function getRecoveryLogsByLineId(lineId: string) {
  const db = await getDb();
  if (!db) {
    return memRecoveryLogs
      .filter(l => l.lineId === lineId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
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
  if (!db) {
    console.log(`[DB] Updating subscription for ${openId} in-memory to ${data.subscriptionStatus}`);
    const existing = memUsers.get(openId);
    if (existing) {
      Object.assign(existing, data);
    } else {
      memUsers.set(openId, {
        openId,
        lineUrl: `https://line.me/ti/p/mock_${openId}`,
        name: "Mock Leader",
        status: data.subscriptionStatus === 'active' ? 'pro' : 'free',
        expiredAt: data.subscriptionExpiresAt ?? null,
        ...data,
      });
    }
    return;
  }
  
  console.log(`[DB] Updating subscription for ${openId} to ${data.subscriptionStatus}`);
  const result = await db.update(users).set(data).where(eq(users.openId, openId));
  // @ts-ignore - mysql2 returns affectedRows
  if (result[0].affectedRows === 0) {
    console.log(`[DB] User ${openId} not found during subscription update, creating new user`);
    await db.insert(users).values({
      openId,
      ...data
    } as any);
  }
  console.log(`[DB] Subscription update process completed for ${openId}`);
}

export async function updateUserSubscriptionByLineUrl(lineUrl: string, data: {
  subscriptionStatus: string;
  subscriptionExpiresAt?: Date | null;
  stripeCustomerId?: string;
  status?: string;
  expiredAt?: Date | null;
}) {
  const db = await getDb();
  if (!db) {
    console.log(`[DB] Updating subscription for ${lineUrl} in-memory to ${data.subscriptionStatus}`);
    const existing = memUsers.get(lineUrl);
    if (existing) {
      Object.assign(existing, data);
      if (data.status) existing.status = data.status;
      if (data.expiredAt !== undefined) existing.expiredAt = data.expiredAt;
    }
    return;
  }
  
  console.log(`[DB] Updating subscription for ${lineUrl} to ${data.subscriptionStatus}`);
  const updateData = {
    ...data,
    status: data.status || (data.subscriptionStatus === 'active' ? 'pro' : 'free'),
    expiredAt: data.expiredAt || data.subscriptionExpiresAt,
  };
  await db.update(users).set(updateData).where(eq(users.lineUrl, lineUrl));
}

// ── Client Progress Report helpers ────────────────────────

export async function saveClientProgressReport(data: InsertClientProgressReport): Promise<number> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save client progress report: database not available. Falling back to in-memory store.");
    const id = memClientProgressReports.length + 1;
    memClientProgressReports.push({
      ...data,
      id,
      createdAt: new Date(),
    });
    return id;
  }
  const result = await db.insert(clientProgressReports).values(data);
  // @ts-ignore - mysql2 returns insertId
  return result[0].insertId as number;
}

export async function getClientProgressReportsByLeaderId(leaderId: string) {
  const db = await getDb();
  if (!db) {
    return memClientProgressReports
      .filter(r => r.leaderId === leaderId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  return db
    .select()
    .from(clientProgressReports)
    .where(eq(clientProgressReports.leaderId, leaderId))
    .orderBy(desc(clientProgressReports.createdAt));
}

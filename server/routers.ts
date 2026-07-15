import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  saveAssessment,
  getAssessmentsByLineId,
  getAssessmentById,
  getMedicationImagesByAssessmentId,
  saveMedicationImage,
  saveRecoveryLog,
  getRecoveryLogsByLineId,
  getUserByOpenId,
  updateUserSubscription,
} from "./db";
import { getInstantFeedback } from "@shared/recoveryAnalysis";
import { createCheckoutSession } from "./stripe";
import { appendRow } from "./googleSheets";

// ── Assessment Router ─────────────────────────────────────
const assessmentRouter = router({
  create: publicProcedure
    .input(
      z.object({
        lineId: z.string().optional(),
        nickname: z.string().min(1),
        birthdate: z.string(), // YYYY-MM-DD
        gender: z.enum(["male", "female"]),
        height: z.number().optional(),
        weight: z.number().optional(),
        medications: z.string().optional(),
        surgeryHistory: z.string().optional(),
        selectedSymptoms: z.array(z.string()),
        medicationImages: z.array(z.object({
          key: z.string(),
          url: z.string(),
          originalName: z.string(),
          mimeType: z.string(),
        })).optional(),
        recommendedDosage: z.number().optional(),
        firstSetDays: z.number().optional(),
        setCount: z.number().optional(),
        bmi: z.number().optional(),
        dailyWater: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const id = await saveAssessment({
        lineId: input.lineId ?? null,
        nickname: input.nickname,
        birthdate: input.birthdate,
        gender: input.gender,
        height: input.height ?? null,
        weight: input.weight ?? null,
        medications: input.medications ?? null,
        surgeryHistory: input.surgeryHistory ?? null,
        selectedSymptoms: input.selectedSymptoms,
        recommendedDosage: input.recommendedDosage ?? null,
        firstSetDays: input.firstSetDays ?? null,
        setCount: input.setCount ?? 1,
        bmi: input.bmi ?? null,
        dailyWater: input.dailyWater ?? null,
      });
      // Save medication images if any
      if (input.medicationImages && input.medicationImages.length > 0) {
        await Promise.all(
          input.medicationImages.map(img =>
            saveMedicationImage({
              assessmentId: id,
              s3Key: img.key,
              s3Url: img.url,
              originalName: img.originalName,
              mimeType: img.mimeType,
            })
          )
        );
      }

      // 同步到 Google Sheets
      await appendRow('評估報告!A:M', [
        new Date().toLocaleString('zh-TW'),
        input.lineId || '匿名',
        input.nickname,
        input.birthdate,
        input.gender === 'male' ? '男' : '女',
        input.bmi || 'N/A',
        input.dailyWater || 'N/A',
        input.selectedSymptoms.join(', '),
        input.recommendedDosage || 'N/A',
        input.firstSetDays || 'N/A',
        input.medications || '無',
        input.surgeryHistory || '無',
        `ID: ${id}`
      ]);

      return { id };
    }),

  getByLineId: publicProcedure
    .input(z.object({ lineId: z.string().min(1) }))
    .query(async ({ input }) => {
      return getAssessmentsByLineId(input.lineId);
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const assessment = await getAssessmentById(input.id);
      if (!assessment) return null;
      const images = await getMedicationImagesByAssessmentId(input.id);
      return { ...assessment, images };
    }),
});

// ── App Router ────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(async ({ ctx }) => {
      const user = ctx.user;
      if (!user) return null;
      const dbUser = await getUserByOpenId(user.openId);
      return dbUser || user;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  assessment: assessmentRouter,
  recovery: router({
    create: publicProcedure
      .input(
        z.object({
          lineId: z.string().min(1),
          dosage: z.number().min(0),
          reactions: z.array(z.string()),
          notes: z.string().optional(),
          reportDate: z.string(), // YYYY-MM-DD
        })
      )
      .mutation(async ({ input }) => {
        const id = await saveRecoveryLog({
          lineId: input.lineId,
          dosage: input.dosage,
          reactions: input.reactions,
          notes: input.notes ?? null,
          reportDate: input.reportDate,
        });

        // 同步到 Google Sheets
        await appendRow('修復日誌!A:F', [
          new Date().toLocaleString('zh-TW'),
          input.lineId,
          input.dosage,
          input.reactions.join(', '),
          input.notes || '無',
          input.reportDate
        ]);

        return { id };
      }),
    getByLineId: publicProcedure
      .input(z.object({ lineId: z.string().min(1) }))
      .query(async ({ input }) => {
        return getRecoveryLogsByLineId(input.lineId);
      }),
    getAnalysis: publicProcedure
      .input(z.object({ lineId: z.string().min(1) }))
      .query(async ({ input }) => {
        const logs = await getRecoveryLogsByLineId(input.lineId);
        if (logs.length === 0) return null;

        const latestLog = logs[0];
        const analysis = getInstantFeedback(latestLog.reactions as string[], latestLog.dosage);

        // 趨勢分析：檢查是否連續 3 天出現特定反應
        const recentLogs = logs.slice(0, 7);
        const trends: string[] = [];

        const reactionCounts: Record<string, number> = {};
        recentLogs.forEach(log => {
          (log.reactions as string[]).forEach(r => {
            reactionCounts[r] = (reactionCounts[r] || 0) + 1;
          });
        });

        Object.entries(reactionCounts).forEach(([reaction, count]) => {
          if (count >= 3) {
            if (reaction === 'fatigue') trends.push("您已連續多日感到疲倦，這是肝臟深層排毒的黃金期，請保持耐心。");
            if (reaction === 'joint_pain') trends.push("持續的關節反應代表微循環正在深層疏通，請務必多喝溫水協助代謝。");
          }
        });

        return {
          ...analysis,
          trends,
          bigDataInsight: analysis.bigDataInsight,
          lastReportDate: latestLog.reportDate
        };
      }),
  }),
  subscription: router({
    createSession: publicProcedure.mutation(async ({ ctx }) => {
      const user = ctx.user;
      if (!user) throw new Error("Unauthorized");
      return createCheckoutSession(user.openId, user.email || undefined);
    }),
    activateMock: publicProcedure.mutation(async ({ ctx }) => {
      const user = ctx.user;
      if (!user) throw new Error("Unauthorized");
      
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      
      await updateUserSubscription(user.openId, {
        subscriptionStatus: 'active',
        subscriptionExpiresAt: expiresAt,
        stripeCustomerId: 'mock_customer_id',
      });
      
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;

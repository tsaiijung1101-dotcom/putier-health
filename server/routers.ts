import { getSessionCookieOptions, COOKIE_NAME } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  saveAssessment,
  getAssessmentsByLeaderLineUrl,
  getAssessmentsByLineId,
  getAssessmentById,
  getMedicationImagesByAssessmentId,
  saveMedicationImage,
  saveRecoveryLog,
  getRecoveryLogsByLineId,
  getUserByLineUrl,
  upsertUser,
  toggleFavoriteAssessment,
  updateUserSubscription,
  getUserByOpenId,
  deleteAssessment,
  getUserByCustomLeaderId,
  saveClientProgressReport,
  getClientProgressReportsByLeaderId,
  getUserByFullNameAndPhone,
  updateUserLineUrl,
  updateUserSubscriptionByLineUrl,
} from "./db";
import { getInstantFeedback } from "@shared/recoveryAnalysis";
import { createCheckoutSession } from "./stripe";
import { appendRow } from "./googleSheets";

// ── Assessment Router ─────────────────────────────────────
const assessmentRouter = router({
  create: publicProcedure
    .input(
      z.object({
        leaderLineUrl: z.string().optional(),
        leaderId: z.string().optional(),
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
        reportData: z.any(),
      })
    )
    .mutation(async ({ input }) => {
      let resolvedLeaderLineUrl = input.leaderLineUrl ?? null;
      if (input.leaderId) {
        const leader = await getUserByCustomLeaderId(input.leaderId);
        if (leader) {
          resolvedLeaderLineUrl = leader.lineUrl;
        }
      }

      const id = await saveAssessment({
        leaderLineUrl: resolvedLeaderLineUrl,
        leaderId: input.leaderId ?? null,
        lineId: input.lineId ?? null,
        nickname: input.nickname,
        birthday: input.birthdate,
        gender: input.gender,
        height: input.height?.toString() ?? null,
        weight: input.weight?.toString() ?? null,
        customSymptoms: (input.medications || "") + " | " + (input.surgeryHistory || ""),
        symptoms: input.selectedSymptoms,
        reportData: input.reportData,
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

      // 同步到 Google Sheets (加上容錯處理，讀取 reportData 內部欄位)
      try {
        const symptomsText = input.selectedSymptoms.join(', ') + 
          (input.reportData?.customDemand ? ` | 自訂需求: ${input.reportData.customDemand}` : "");
        const dosageText = `${input.reportData?.recommendedDosage || 'N/A'} 顆/天` +
          (input.reportData?.accelerate ? " [⚡ 加速修復]" : "");

        await appendRow('評估報告!A:M', [
          new Date().toLocaleString('zh-TW'),
          input.lineId || '匿名',
          input.nickname,
          input.birthdate,
          input.gender === 'male' ? '男' : '女',
          input.reportData?.bmi || 'N/A',
          input.reportData?.dailyWater || 'N/A',
          symptomsText,
          dosageText,
          input.reportData?.firstSetDays || 'N/A',
          input.medications || '無',
          input.surgeryHistory || '無',
          `ID: ${id}`
        ]);
      } catch (error) {
        console.error("[Google Sheets Sync Error] 評估報告同步失敗:", error);
      }

      return { id };
    }),

  getByLineId: publicProcedure
    .input(z.object({ lineId: z.string().min(1) }))
    .query(async ({ input }) => {
      return getAssessmentsByLineId(input.lineId);
    }),

  getByLeader: publicProcedure
    .input(z.object({ leaderLineUrl: z.string().min(1) }))
    .query(async ({ input }) => {
      return getAssessmentsByLeaderLineUrl(input.leaderLineUrl);
    }),

  toggleFavorite: publicProcedure
    .input(z.object({ id: z.number(), isFavorite: z.boolean() }))
    .mutation(async ({ input }) => {
      await toggleFavoriteAssessment(input.id, input.isFavorite);
      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteAssessment(input.id);
      return { success: true };
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
      if (!user || !user.openId) return null;
      const dbUser = await getUserByOpenId(user.openId);
      return dbUser || user;
    }),
    leaderLogin: publicProcedure
      .input(z.object({ lineUrl: z.string().min(1) }))
      .mutation(async ({ input }) => {
        const user = await getUserByLineUrl(input.lineUrl);
        return user || null;
      }),
    leaderRegister: publicProcedure
      .input(
        z.object({
          lineUrl: z.string().min(1),
          fullName: z.string().min(1),
          phone: z.string().min(1),
          email: z.string().email(),
          customLeaderId: z.string().min(1),
          lineId: z.string().min(1),
          authCode: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const existingById = await getUserByCustomLeaderId(input.customLeaderId);
        if (existingById) {
          throw new Error("此自訂領導人 ID 已被他人使用");
        }

        const existingByUrl = await getUserByLineUrl(input.lineUrl);
        if (existingByUrl) {
          throw new Error("此 LINE 個人好友網址已被註冊");
        }

        await upsertUser({
          lineUrl: input.lineUrl,
          name: input.fullName,
          authCode: input.authCode,
          status: input.authCode ? 'pro' : 'free',
          fullName: input.fullName,
          phone: input.phone,
          email: input.email,
          customLeaderId: input.customLeaderId,
          lineId: input.lineId,
        });

        const user = await getUserByLineUrl(input.lineUrl);

        // 同步領導人註冊資訊到 Google Sheets (加上容錯處理)
        try {
          await appendRow('領導人名冊!A:G', [
            new Date().toLocaleString('zh-TW'),
            input.fullName,
            input.phone,
            input.email,
            input.customLeaderId,
            input.lineId,
            input.lineUrl
          ]);
        } catch (error) {
          console.error("[Google Sheets Sync Error] 領導人註冊同步失敗:", error);
        }

        return user;
      }),
    updateLineUrl: publicProcedure
      .input(
        z.object({
          fullName: z.string().min(1),
          phone: z.string().min(1),
          newLineUrl: z.string().min(1),
        })
      )
      .mutation(async ({ input }) => {
        const user = await getUserByFullNameAndPhone(input.fullName, input.phone);
        if (!user) {
          throw new Error("找不到符合此真實姓名與手機號碼的領導人帳號");
        }

        if (user.lineUrl !== input.newLineUrl) {
          const conflictUser = await getUserByLineUrl(input.newLineUrl);
          if (conflictUser) {
            throw new Error("此新的 LINE 個人好友網址已被其他帳號註冊，請輸入您個人的新網址");
          }
          await updateUserLineUrl(user.lineUrl, input.newLineUrl);
        }

        return { success: true };
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

        // 同步到 Google Sheets (加上容錯處理)
        try {
          await appendRow('修復日誌!A:F', [
            new Date().toLocaleString('zh-TW'),
            input.lineId,
            input.dosage,
            input.reactions.join(', '),
            input.notes || '無',
            input.reportDate
          ]);
        } catch (error) {
          console.error("[Google Sheets Sync Error] 修復日誌同步失敗:", error);
        }

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
        recentLogs.forEach((log: any) => {
          (log.reactions as string[]).forEach((r: any) => {
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
      if (!user || !user.openId) throw new Error("Unauthorized");
      return createCheckoutSession(user.openId, user.email || undefined);
    }),
    activateMock: publicProcedure
      .input(z.object({ lineUrl: z.string().min(1) }))
      .mutation(async ({ input }) => {
        const user = await getUserByLineUrl(input.lineUrl);
        if (!user) throw new Error("找不到該領導人帳號");

        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);

        await updateUserSubscriptionByLineUrl(user.lineUrl, {
          subscriptionStatus: 'active',
          subscriptionExpiresAt: expiresAt,
          stripeCustomerId: 'mock_customer_id',
        });

        return { success: true };
      }),
    activateCoupon: publicProcedure
      .input(
        z.object({
          lineUrl: z.string().min(1),
          couponCode: z.string().min(1),
        })
      )
      .mutation(async ({ input }) => {
        if (input.couponCode.trim() !== "RIWAY38") {
          throw new Error("優惠碼錯誤，請輸入正確的優惠碼！");
        }

        const user = await getUserByLineUrl(input.lineUrl);
        if (!user) throw new Error("找不到該領導人帳號，請先登入");

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 38);

        await updateUserSubscriptionByLineUrl(user.lineUrl, {
          subscriptionStatus: 'active',
          subscriptionExpiresAt: expiresAt,
          stripeCustomerId: 'coupon_riway38',
        });

        return { success: true, message: "優惠碼兌換成功！已享有 38 天專業版時效。" };
      }),
  }),
  clientProgress: router({
    submitReport: publicProcedure
      .input(z.object({
        leaderId: z.string().min(1),
        clientId: z.string().min(1),
        dosage: z.number(),
        meals: z.number(),
        consecutiveDays: z.number(),
        reactions: z.array(z.string()),
        notes: z.string().optional()
      }))
      .mutation(async ({ input }) => {
        const id = await saveClientProgressReport({
          leaderId: input.leaderId,
          clientId: input.clientId,
          dosage: input.dosage,
          meals: input.meals,
          consecutiveDays: input.consecutiveDays,
          reactions: input.reactions,
          notes: input.notes ?? null,
        });

        try {
          await appendRow('客戶每日追蹤!A:H', [
            new Date().toLocaleString('zh-TW'),
            input.leaderId,
            input.clientId,
            input.dosage.toString(),
            input.meals.toString(),
            input.consecutiveDays.toString(),
            input.reactions.join(', '),
            input.notes ?? ''
          ]);
        } catch (error) {
          console.error("[Google Sheets Sync Error] 客戶追蹤回報同步失敗:", error);
        }

        return { id };
      }),
    
    listByLeader: publicProcedure
      .input(z.object({ leaderId: z.string().min(1) }))
      .query(async ({ input }) => {
        return getClientProgressReportsByLeaderId(input.leaderId);
      }),
  }),
});

export type AppRouter = typeof appRouter;

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
} from "./db";

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
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  assessment: assessmentRouter,
});

export type AppRouter = typeof appRouter;

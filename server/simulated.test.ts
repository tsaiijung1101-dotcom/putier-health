import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import type { TrpcContext } from "./_core/context";

// Mock the DB module using global variables to easily reset them
vi.mock("./db", () => {
  (globalThis as any).mockUsers = new Map<string, any>();
  (globalThis as any).mockAssessments = [] as any[];

  return {
    getDb: vi.fn(),
    upsertUser: vi.fn(async (user: any) => {
      (globalThis as any).mockUsers.set(user.lineUrl, {
        ...user,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }),
    getUserByLineUrl: vi.fn(async (lineUrl: string) => {
      return (globalThis as any).mockUsers.get(lineUrl);
    }),
    getUserByCustomLeaderId: vi.fn(async (customLeaderId: string) => {
      for (const user of (globalThis as any).mockUsers.values()) {
        if (user.customLeaderId === customLeaderId) {
          return user;
        }
      }
      return undefined;
    }),
    getUserByEmail: vi.fn(async (email: string) => {
      for (const user of (globalThis as any).mockUsers.values()) {
        if (user.email === email) {
          return user;
        }
      }
      return undefined;
    }),
    getUserByLineId: vi.fn(async (lineId: string) => {
      for (const user of (globalThis as any).mockUsers.values()) {
        if (user.lineId === lineId) {
          return user;
        }
      }
      return undefined;
    }),
    getUserByFullNameAndPhone: vi.fn(async (fullName: string, phone: string) => {
      for (const user of (globalThis as any).mockUsers.values()) {
        if (user.fullName === fullName && user.phone === phone) {
          return user;
        }
      }
      return undefined;
    }),
    saveAssessment: vi.fn(async (assessment: any) => {
      const id = (globalThis as any).mockAssessments.length + 1;
      const record = { ...assessment, id, createdAt: new Date() };
      (globalThis as any).mockAssessments.push(record);
      return id;
    }),
    getAssessmentsByLineId: vi.fn(async (lineId: string) => {
      return (globalThis as any).mockAssessments.filter((a: any) => a.lineId === lineId);
    }),
    saveMedicationImage: vi.fn(),
    getMedicationImagesByAssessmentId: vi.fn(() => []),
    saveClientProgressReport: vi.fn(async (report: any) => {
      if (!(globalThis as any).mockProgressReports) {
        (globalThis as any).mockProgressReports = [];
      }
      const id = (globalThis as any).mockProgressReports.length + 1;
      const record = { ...report, id, createdAt: new Date() };
      (globalThis as any).mockProgressReports.push(record);
      return id;
    }),
    getClientProgressReportsByLeaderId: vi.fn(async (leaderId: string) => {
      if (!(globalThis as any).mockProgressReports) return [];
      return (globalThis as any).mockProgressReports.filter((r: any) => r.leaderId === leaderId);
    }),
  };
});

// Mock Google Sheets helper to avoid network requests during test
vi.mock("./googleSheets", () => ({
  appendRow: vi.fn(async () => {}),
}));

function createMockContext(): TrpcContext {
  return {
    req: {
      protocol: "https",
      headers: {},
    } as any,
    res: {} as any,
    user: null,
  };
}

describe("領導人註冊與登入模擬測試", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).mockUsers?.clear();
    if ((globalThis as any).mockAssessments) {
      (globalThis as any).mockAssessments.length = 0;
    }
  });

  it("1. 模擬註冊領導人 A（免費版）與功能驗證", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // 1-1. 註冊領導人 A (免費版，不帶 authCode)
    const registerResult = await caller.auth.leaderRegister({
      fullName: "領導人代號A",
      lineUrl: "https://line.me/ti/p/leaderA",
      phone: "0912345678",
      email: "leaderA@test.com",
      customLeaderId: "leaderA",
      lineId: "leaderA_line",
    });

    expect(registerResult).toBeDefined();
    expect(registerResult?.fullName).toBe("領導人代號A");
    expect(registerResult?.status).toBe("free");
    expect(db.upsertUser).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: "領導人代號A",
        status: "free",
        customLeaderId: "leaderA",
      })
    );

    // 1-2. 登入領導人 A
    const loginResult = await caller.auth.leaderLogin({
      lineUrl: "https://line.me/ti/p/leaderA",
    });
    expect(loginResult).toBeDefined();
    expect(loginResult?.fullName).toBe("領導人代號A");
    expect(loginResult?.status).toBe("free");
  });

  it("2. 模擬註冊領導人 B（付費版）與功能驗證", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // 2-1. 註冊領導人 B (付費版，帶 authCode)
    const registerResult = await caller.auth.leaderRegister({
      fullName: "領導人代號B",
      lineUrl: "https://line.me/ti/p/leaderB",
      phone: "0987654321",
      email: "leaderB@test.com",
      customLeaderId: "leaderB",
      lineId: "leaderB_line",
      authCode: "pro_auth_code_123",
    });

    expect(registerResult).toBeDefined();
    expect(registerResult?.fullName).toBe("領導人代號B");
    expect(registerResult?.status).toBe("pro"); // authCode matches pro status
    expect(db.upsertUser).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: "領導人代號B",
        status: "pro",
        customLeaderId: "leaderB",
      })
    );
  });

  it("3. 模擬客戶評估表單自動帶入並關聯領導人 ID 的邏輯", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // 先註冊領導人 A 供客戶關聯
    await caller.auth.leaderRegister({
      fullName: "領導人代號A",
      lineUrl: "https://line.me/ti/p/leaderA",
      phone: "0912345678",
      email: "leaderA@test.com",
      customLeaderId: "leaderA",
      lineId: "leaderA_line",
    });

    // 模擬客戶小明在評估時填寫了 leaderId = "leaderA" 且輸入了自己的 LINE ID
    const assessmentResult = await caller.assessment.create({
      leaderId: "leaderA",
      lineId: "client_xiaoming_line",
      nickname: "客戶小明",
      birthdate: "1995-05-10",
      gender: "male",
      height: 175,
      weight: 70,
      selectedSymptoms: ["fatigue"],
      reportData: { recommendedDosage: 3, firstSetDays: 140 },
    });

    expect(assessmentResult).toBeDefined();
    expect(assessmentResult.id).toBe(1);

    // 驗證 saveAssessment 是否被正確調用，並且 resolved 了 leaderA 的 lineUrl 與客戶自己的 lineId
    expect(db.saveAssessment).toHaveBeenCalledWith(
      expect.objectContaining({
        nickname: "客戶小明",
        leaderId: "leaderA",
        lineId: "client_xiaoming_line",
        leaderLineUrl: "https://line.me/ti/p/leaderA", // 自動關聯查找到的 lineUrl
      })
    );

    // 驗證能否依據客戶的 LINE ID 查詢到該筆評估紀錄
    const getRecordsResult = await caller.assessment.getByLineId({
      lineId: "client_xiaoming_line"
    });
    expect(getRecordsResult).toHaveLength(1);
    expect(getRecordsResult[0]?.nickname).toBe("客戶小明");
  });

  it("4. 驗證重複註冊時的阻擋邏輯", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // 註冊第一個
    await caller.auth.leaderRegister({
      fullName: "領導人代號A",
      lineUrl: "https://line.me/ti/p/leaderA",
      phone: "0912345678",
      email: "leaderA@test.com",
      customLeaderId: "leaderA",
      lineId: "leaderA_line",
    });

    // 註冊重複的自訂領導人 ID
    await expect(
      caller.auth.leaderRegister({
        fullName: "另一位領導人",
        lineUrl: "https://line.me/ti/p/leaderA2",
        phone: "0922222222",
        email: "leaderA2@test.com",
        customLeaderId: "leaderA", // 重複
        lineId: "leaderA2_line",
      })
    ).rejects.toThrow("此自訂領導人 ID 已被他人使用");

    // 註冊重複的 LINE 好友網址
    await expect(
      caller.auth.leaderRegister({
        fullName: "另一位領導人",
        lineUrl: "https://line.me/ti/p/leaderA", // 重複
        phone: "0922222222",
        email: "leaderA2@test.com",
        customLeaderId: "leaderA2",
        lineId: "leaderA2_line",
      })
    ).rejects.toThrow("此 LINE 個人好友網址已被註冊");

    // 註冊重複的姓名與電話
    await expect(
      caller.auth.leaderRegister({
        fullName: "領導人代號A", // 重複姓名
        lineUrl: "https://line.me/ti/p/leaderA3",
        phone: "0912345678", // 重複電話
        email: "leaderA3@test.com",
        customLeaderId: "leaderA3",
        lineId: "leaderA3_line",
      })
    ).rejects.toThrow("此姓名與電話組合已被註冊，請勿重複註冊");

    // 註冊重複的電子郵件
    await expect(
      caller.auth.leaderRegister({
        fullName: "另一位領導人",
        lineUrl: "https://line.me/ti/p/leaderA4",
        phone: "0922222222",
        email: "leaderA@test.com", // 重複 email
        customLeaderId: "leaderA4",
        lineId: "leaderA4_line",
      })
    ).rejects.toThrow("此電子郵件已被註冊，請更換電子郵件");

    // 註冊重複的 LINE ID
    await expect(
      caller.auth.leaderRegister({
        fullName: "另一位領導人",
        lineUrl: "https://line.me/ti/p/leaderA5",
        phone: "0922222222",
        email: "leaderA5@test.com",
        customLeaderId: "leaderA5",
        lineId: "leaderA_line", // 重複 lineId
      })
    ).rejects.toThrow("此 LINE ID 已被註冊，請更換 LINE ID");
  });

  it("5. 模擬客戶每日修復進度回報與領導人後台查詢", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // 5-1. 客戶小明提交今日修復進度
    const submitResult = await caller.clientProgress.submitReport({
      leaderId: "leaderA",
      clientId: "client_xiaoming_a8f9x2",
      dosage: 4,
      meals: 2,
      consecutiveDays: 5,
      reactions: ["sleepy", "energetic"],
      notes: "今天感覺比較容易疲倦，但精神還是不錯",
    });

    expect(submitResult).toBeDefined();
    expect(submitResult.id).toBe(1);

    // 驗證 saveClientProgressReport 是否被正確調用
    expect(db.saveClientProgressReport).toHaveBeenCalledWith(
      expect.objectContaining({
        leaderId: "leaderA",
        clientId: "client_xiaoming_a8f9x2",
        dosage: 4,
        meals: 2,
        consecutiveDays: 5,
        reactions: ["sleepy", "energetic"],
        notes: "今天感覺比較容易疲倦，但精神還是不錯",
      })
    );

    // 5-2. 領導人 A 查詢旗下客戶所回報的每日紀錄清單
    const getReportsResult = await caller.clientProgress.listByLeader({
      leaderId: "leaderA"
    });

    expect(getReportsResult).toHaveLength(1);
    expect(getReportsResult[0]?.clientId).toBe("client_xiaoming_a8f9x2");
    expect(getReportsResult[0]?.dosage).toBe(4);
    expect(getReportsResult[0]?.consecutiveDays).toBe(5);
  });
});

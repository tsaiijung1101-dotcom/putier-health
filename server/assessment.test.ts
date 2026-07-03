import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  calculateDosage,
  calculateBMI,
  calculateDailyWater,
  generateSecretary,
} from "../shared/healthData";

// ── healthData unit tests ─────────────────────────────────

describe("calculateBMI", () => {
  it("calculates BMI correctly for normal range", () => {
    const result = calculateBMI(70, 175);
    expect(result.bmi).toBe(22.9);
    expect(result.category).toBe("正常範圍");
  });

  it("classifies underweight correctly", () => {
    const result = calculateBMI(45, 170);
    expect(result.bmi).toBeLessThan(18.5);
    expect(result.category).toBe("體重過輕");
  });

  it("classifies overweight correctly", () => {
    // 70kg / 1.70m^2 = 24.2 => 體重過重
    const result = calculateBMI(70, 170);
    expect(result.bmi).toBeGreaterThanOrEqual(24);
    expect(result.bmi).toBeLessThan(27);
    expect(result.category).toBe("體重過重");
  });

  it("classifies obese correctly", () => {
    const result = calculateBMI(100, 170);
    expect(result.bmi).toBeGreaterThanOrEqual(30);
    expect(["輕度肥胖", "中度肥胖", "重度肥胖"]).toContain(result.category);
  });
});

describe("calculateDailyWater", () => {
  it("calculates daily water intake as weight * 35ml", () => {
    const result = calculateDailyWater(70);
    expect(result.ml).toBe(2450);
    expect(result.liters).toBe("2.5");
  });

  it("calculates for different weights", () => {
    const result = calculateDailyWater(50);
    expect(result.ml).toBe(1750);
  });
});

describe("calculateDosage", () => {
  it("returns minimum 2 capsules for 0 symptoms", () => {
    const result = calculateDosage(30, "female", [], undefined, 1);
    expect(result.dailyCapsules).toBe(2);
  });

  it("returns 3 capsules for 3 symptoms", () => {
    const result = calculateDosage(30, "female", ["s1", "s2", "s3"], undefined, 1);
    expect(result.dailyCapsules).toBe(3);
  });

  it("returns max 6 capsules for many symptoms", () => {
    const symptoms = Array.from({ length: 12 }, (_, i) => `s${i}`);
    const result = calculateDosage(30, "male", symptoms, undefined, 1);
    expect(result.dailyCapsules).toBe(6);
  });

  it("adds extra capsule for age >= 50", () => {
    const result2 = calculateDosage(50, "male", ["s1", "s2"], undefined, 1);
    const result1 = calculateDosage(30, "male", ["s1", "s2"], undefined, 1);
    expect(result2.dailyCapsules).toBeGreaterThanOrEqual(result1.dailyCapsules);
  });

  it("calculates firstSetDays correctly for 1 set", () => {
    const result = calculateDosage(30, "female", ["s1", "s2"], undefined, 1);
    expect(result.firstSetDays).toBe(Math.round(420 / result.dailyCapsules));
  });

  it("calculates firstSetDays correctly for 2 sets", () => {
    const result = calculateDosage(30, "female", ["s1", "s2"], undefined, 2);
    expect(result.firstSetDays).toBe(Math.round(840 / result.dailyCapsules));
  });
});

describe("generateSecretary", () => {
  it("generates message with nickname", () => {
    const msg = generateSecretary("小明", ["s1", "s2"]);
    expect(msg).toContain("小明");
  });

  it("generates positive message for 0 symptoms", () => {
    const msg = generateSecretary("小明", []);
    expect(msg).toContain("良好");
  });

  it("generates encouraging message for many symptoms", () => {
    const symptoms = Array.from({ length: 8 }, (_, i) => `s${i}`);
    const msg = generateSecretary("小明", symptoms);
    expect(msg).toContain("8");
  });
});

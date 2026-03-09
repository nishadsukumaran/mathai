/**
 * @test services/gamification/streak_engine
 *
 * Tests for all streak tracking scenarios.
 * Date manipulation is controlled via fixed dates to ensure determinism.
 */

import { StreakEngine, STREAK_MILESTONES } from "@/services/gamification/streak_engine";

describe("StreakEngine", () => {
  let engine: StreakEngine;

  beforeEach(() => {
    engine = new StreakEngine();
    // Fix "today" for deterministic tests
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-03-08T10:00:00Z")); // a Saturday
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ─── First login ────────────────────────────────────────────────────────────

  it("starts a streak of 1 on first ever login", () => {
    const result = engine.processLogin(null, 0);
    expect(result.currentStreak).toBe(1);
    expect(result.isStreakAlive).toBe(true);
    expect(result.streakBroken).toBe(false);
  });

  // ─── Same day ────────────────────────────────────────────────────────────────

  it("maintains streak without incrementing on same calendar day", () => {
    const today = new Date("2025-03-08T08:00:00Z"); // earlier same day
    const result = engine.processLogin(today, 5);
    expect(result.currentStreak).toBe(5); // unchanged
    expect(result.streakBroken).toBe(false);
  });

  // ─── Consecutive day ─────────────────────────────────────────────────────────

  it("increments streak on consecutive calendar day", () => {
    const yesterday = new Date("2025-03-07T10:00:00Z");
    const result = engine.processLogin(yesterday, 4);
    expect(result.currentStreak).toBe(5);
    expect(result.isStreakAlive).toBe(true);
    expect(result.streakBroken).toBe(false);
  });

  // ─── Broken streak ───────────────────────────────────────────────────────────

  it("resets streak to 1 when a day is missed", () => {
    const twoDaysAgo = new Date("2025-03-06T10:00:00Z");
    const result = engine.processLogin(twoDaysAgo, 10);
    expect(result.currentStreak).toBe(1);
    expect(result.streakBroken).toBe(true);
    expect(result.isStreakAlive).toBe(false);
  });

  it("resets streak to 1 after a week of inactivity", () => {
    const lastWeek = new Date("2025-03-01T10:00:00Z");
    const result = engine.processLogin(lastWeek, 14);
    expect(result.currentStreak).toBe(1);
    expect(result.streakBroken).toBe(true);
  });

  // ─── Milestones ─────────────────────────────────────────────────────────────

  it("detects 3-day streak milestone", () => {
    const yesterday = new Date("2025-03-07");
    const result = engine.processLogin(yesterday, 2); // will be 3
    expect(result.milestoneReached).toBe(3);
    expect(result.xpBonus).toBe(STREAK_MILESTONES[3]!.xpBonus);
  });

  it("detects 7-day streak milestone", () => {
    const yesterday = new Date("2025-03-07");
    const result = engine.processLogin(yesterday, 6); // will be 7
    expect(result.milestoneReached).toBe(7);
  });

  it("returns null milestone for non-milestone days", () => {
    const yesterday = new Date("2025-03-07");
    const result = engine.processLogin(yesterday, 4); // will be 5, not a milestone
    expect(result.milestoneReached).toBeNull();
    expect(result.xpBonus).toBe(0);
  });

  // ─── Streak shield ───────────────────────────────────────────────────────────

  it("consumes shield and preserves streak when shield is available", () => {
    const { newStreak, shieldConsumed } = engine.applyStreakShield(10, true);
    expect(newStreak).toBe(10);
    expect(shieldConsumed).toBe(true);
  });

  it("does not use shield when not available", () => {
    const { newStreak, shieldConsumed } = engine.applyStreakShield(10, false);
    expect(newStreak).toBe(10);
    expect(shieldConsumed).toBe(false);
  });
});

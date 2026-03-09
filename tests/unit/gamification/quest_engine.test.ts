/**
 * @test services/gamification/quest_engine
 *
 * Tests for daily/weekly quest generation and progress tracking.
 * All tests are pure — no DB, fully deterministic except for ID suffix.
 */

import {
  QuestEngine,
  DAILY_QUEST_TEMPLATES,
  WEEKLY_QUEST_TEMPLATES,
  QuestMetric,
} from "@/services/gamification/quest_engine";
import { DailyQuest } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeQuest(overrides: Partial<DailyQuest> = {}): DailyQuest {
  return {
    id: "test-quest-001",
    title: "Answer 5 Questions Correctly",
    description: "Get 5 right today!",
    targetCount: 5,
    currentCount: 0,
    xpReward: 20,
    expiresAt: new Date(Date.now() + 86_400_000),
    ...overrides,
  };
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe("QuestEngine", () => {
  let engine: QuestEngine;

  beforeEach(() => {
    engine = new QuestEngine();
  });

  // ── generateDailyQuests() ────────────────────────────────────────────────────

  describe("generateDailyQuests", () => {
    it("generates exactly 3 daily quests", () => {
      const quests = engine.generateDailyQuests("student-001");
      expect(quests).toHaveLength(3);
    });

    it("each quest starts at currentCount = 0", () => {
      const quests = engine.generateDailyQuests("student-001");
      for (const q of quests) {
        expect(q.currentCount).toBe(0);
      }
    });

    it("each quest has a completedAt of undefined (not yet done)", () => {
      const quests = engine.generateDailyQuests("student-001");
      for (const q of quests) {
        expect(q.completedAt).toBeUndefined();
      }
    });

    it("quests expire at or before midnight today", () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(23, 59, 59, 999);

      const quests = engine.generateDailyQuests("student-001");
      for (const q of quests) {
        expect(q.expiresAt.getTime()).toBeLessThanOrEqual(midnight.getTime() + 1000);
      }
    });

    it("quest titles and descriptions come from DAILY_QUEST_TEMPLATES", () => {
      const knownTitles = new Set(DAILY_QUEST_TEMPLATES.map((t) => t.title));
      const quests = engine.generateDailyQuests("student-001");
      for (const q of quests) {
        expect(knownTitles.has(q.title)).toBe(true);
      }
    });

    it("each quest has xpReward > 0", () => {
      const quests = engine.generateDailyQuests("student-001");
      for (const q of quests) {
        expect(q.xpReward).toBeGreaterThan(0);
      }
    });

    it("each quest has targetCount >= 1", () => {
      const quests = engine.generateDailyQuests("student-001");
      for (const q of quests) {
        expect(q.targetCount).toBeGreaterThanOrEqual(1);
      }
    });

    it("does not return duplicate quest titles", () => {
      // Run multiple times since selection is random
      for (let i = 0; i < 10; i++) {
        const quests = engine.generateDailyQuests("student-001");
        const titles = quests.map((q) => q.title);
        const uniqueTitles = new Set(titles);
        // With 5 templates and choosing 3, duplicates are possible if selectTemplates
        // doesn't deduplicate — this documents the current behaviour
        // (the implementation shuffles and slices, so duplicates shouldn't appear)
        expect(uniqueTitles.size).toBe(titles.length);
      }
    });
  });

  // ── generateWeeklyQuests() ───────────────────────────────────────────────────

  describe("generateWeeklyQuests", () => {
    it("generates up to 2 weekly quests", () => {
      const quests = engine.generateWeeklyQuests("student-001");
      expect(quests.length).toBeGreaterThanOrEqual(1);
      expect(quests.length).toBeLessThanOrEqual(2);
    });

    it("weekly quests have higher xpReward than most daily quests", () => {
      const weekly = engine.generateWeeklyQuests("student-001");
      for (const q of weekly) {
        expect(q.xpReward).toBeGreaterThanOrEqual(50);
      }
    });

    it("weekly quests expire on a Monday", () => {
      const quests = engine.generateWeeklyQuests("student-001");
      for (const q of quests) {
        // getDay() === 1 is Monday
        expect(q.expiresAt.getDay()).toBe(1);
      }
    });

    it("quest titles come from WEEKLY_QUEST_TEMPLATES", () => {
      const knownTitles = new Set(WEEKLY_QUEST_TEMPLATES.map((t) => t.title));
      const quests = engine.generateWeeklyQuests("student-001");
      for (const q of quests) {
        expect(knownTitles.has(q.title)).toBe(true);
      }
    });
  });

  // ── updateProgress() ─────────────────────────────────────────────────────────

  describe("updateProgress", () => {
    it("increments currentCount by the given amount", () => {
      const quest = makeQuest({ currentCount: 0, targetCount: 5 });
      const { quest: updated } = engine.updateProgress(quest, 2);
      expect(updated.currentCount).toBe(2);
    });

    it("does not exceed targetCount", () => {
      const quest = makeQuest({ currentCount: 4, targetCount: 5 });
      const { quest: updated } = engine.updateProgress(quest, 10);
      expect(updated.currentCount).toBe(5);
    });

    it("marks quest as completed when currentCount reaches targetCount", () => {
      const quest = makeQuest({ currentCount: 4, targetCount: 5 });
      const { quest: updated, justCompleted } = engine.updateProgress(quest, 1);
      expect(updated.completedAt).toBeInstanceOf(Date);
      expect(justCompleted).toBe(true);
    });

    it("marks justCompleted=false when target not yet reached", () => {
      const quest = makeQuest({ currentCount: 2, targetCount: 5 });
      const { justCompleted } = engine.updateProgress(quest, 1);
      expect(justCompleted).toBe(false);
    });

    it("is idempotent — already-completed quest is not re-completed", () => {
      const completedAt = new Date(Date.now() - 1000);
      const quest = makeQuest({
        currentCount: 5,
        targetCount: 5,
        completedAt,
      });
      const { quest: updated, justCompleted } = engine.updateProgress(quest, 5);
      expect(justCompleted).toBe(false);
      // completedAt should remain unchanged
      expect(updated.completedAt).toEqual(completedAt);
      // currentCount should not increase beyond target
      expect(updated.currentCount).toBe(5);
    });

    it("single increment of 1 on fresh quest increments correctly", () => {
      const quest = makeQuest({ currentCount: 0, targetCount: 5 });
      const { quest: updated, justCompleted } = engine.updateProgress(quest, 1);
      expect(updated.currentCount).toBe(1);
      expect(justCompleted).toBe(false);
    });

    it("completing a 1-target quest in one step works", () => {
      const quest = makeQuest({ currentCount: 0, targetCount: 1 });
      const { quest: updated, justCompleted } = engine.updateProgress(quest, 1);
      expect(updated.currentCount).toBe(1);
      expect(justCompleted).toBe(true);
      expect(updated.completedAt).toBeInstanceOf(Date);
    });

    it("does not mutate the original quest object", () => {
      const quest = makeQuest({ currentCount: 0, targetCount: 5 });
      const original = { ...quest };
      engine.updateProgress(quest, 3);
      expect(quest.currentCount).toBe(original.currentCount);
    });
  });

  // ── DAILY_QUEST_TEMPLATES integrity ─────────────────────────────────────────

  describe("DAILY_QUEST_TEMPLATES", () => {
    it("has at least 3 templates (enough for daily generation)", () => {
      expect(DAILY_QUEST_TEMPLATES.length).toBeGreaterThanOrEqual(3);
    });

    it("all templates are type 'daily'", () => {
      for (const t of DAILY_QUEST_TEMPLATES) {
        expect(t.type).toBe("daily");
      }
    });

    it("no duplicate template IDs", () => {
      const ids = DAILY_QUEST_TEMPLATES.map((t) => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("all QuestMetric values are valid", () => {
      const validMetrics = Object.values(QuestMetric);
      for (const t of DAILY_QUEST_TEMPLATES) {
        expect(validMetrics).toContain(t.metric);
      }
    });
  });

  // ── WEEKLY_QUEST_TEMPLATES integrity ────────────────────────────────────────

  describe("WEEKLY_QUEST_TEMPLATES", () => {
    it("all templates are type 'weekly'", () => {
      for (const t of WEEKLY_QUEST_TEMPLATES) {
        expect(t.type).toBe("weekly");
      }
    });

    it("weekly quests have higher xpReward than daily quests on average", () => {
      const dailyAvg = DAILY_QUEST_TEMPLATES.reduce((s, t) => s + t.xpReward, 0) / DAILY_QUEST_TEMPLATES.length;
      const weeklyAvg = WEEKLY_QUEST_TEMPLATES.reduce((s, t) => s + t.xpReward, 0) / WEEKLY_QUEST_TEMPLATES.length;
      expect(weeklyAvg).toBeGreaterThan(dailyAvg);
    });
  });
});

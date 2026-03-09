/**
 * @test e2e/learning_flow
 *
 * End-to-end tests for the core learning experience using Playwright.
 *
 * Covers:
 *   1. Login → Dashboard
 *   2. Start a practice session
 *   3. Answer questions (correct + incorrect paths)
 *   4. Use hint escalation
 *   5. See XP award animation
 *   6. Complete session → XP summary screen
 *
 * Run: npx playwright test tests/e2e/
 * Requires: local dev server at http://localhost:3000
 */

import { test, expect } from "@playwright/test";

const BASE_URL = process.env["E2E_BASE_URL"] ?? "http://localhost:3000";
const TEST_EMAIL = "dev@mathai.test";

test.describe("Core Learning Flow", () => {

  test.beforeEach(async ({ page }) => {
    // TODO: Set up authenticated session via API route
    // await page.goto(`${BASE_URL}/api/auth/test-signin?email=${TEST_EMAIL}`);
  });

  test("student can view their dashboard", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page).toHaveTitle(/MathAI/);
    // TODO: Assert XP bar is visible
    // TODO: Assert daily quests section is visible
    // await expect(page.locator("[data-testid='xp-bar']")).toBeVisible();
    test.fixme(); // Remove when auth is set up
  });

  test("student can start a practice session", async ({ page }) => {
    await page.goto(`${BASE_URL}/practice?topicId=g4-fractions-add&mode=guided`);
    // TODO: Assert question card is visible
    // await expect(page.locator("[data-testid='question-card']")).toBeVisible();
    test.fixme();
  });

  test("correct answer shows XP animation", async ({ page }) => {
    await page.goto(`${BASE_URL}/practice?topicId=g4-fractions-add`);
    // TODO: Fill in answer, click submit, assert XP animation appears
    // await page.fill("[data-testid='answer-input']", "3/4");
    // await page.click("[data-testid='submit-btn']");
    // await expect(page.locator("[data-testid='xp-animation']")).toBeVisible();
    test.fixme();
  });

  test("hint button escalates through 3 levels", async ({ page }) => {
    await page.goto(`${BASE_URL}/practice?topicId=g4-fractions-add`);
    // TODO: Submit wrong answer → click hint → repeat × 3, assert hint text changes
    test.fixme();
  });

  test("completing session shows XP summary screen", async ({ page }) => {
    // TODO: Complete all 10 questions, assert summary screen with total XP
    test.fixme();
  });

  test("daily quest updates as student answers questions", async ({ page }) => {
    // TODO: Start on dashboard, note quest progress, complete questions, check quest advances
    test.fixme();
  });

  test("streak increments on daily login", async ({ page }) => {
    // TODO: Check streak counter on dashboard, compare to previous session
    test.fixme();
  });
});

test.describe("Accessibility", () => {
  test("practice screen is keyboard navigable", async ({ page }) => {
    await page.goto(`${BASE_URL}/practice?topicId=g4-fractions-add`);
    // TODO: Tab through all interactive elements, check focus indicators
    test.fixme();
  });

  test("question text meets minimum font size for readability", async ({ page }) => {
    await page.goto(`${BASE_URL}/practice?topicId=g4-fractions-add`);
    // TODO: Measure font size of question text, assert >= 18px
    test.fixme();
  });
});

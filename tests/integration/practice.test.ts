/**
 * @test integration/practice
 *
 * Integration tests for the full practice session API flow.
 * Tests the full request → service → response cycle.
 *
 * These tests require the API server to be running with a test DB.
 * Set DATABASE_URL_TEST in your .env.test file.
 *
 * TODO: Set up test DB and supertest setup file before running.
 */

// import request from "supertest";
// import app from "@/api/app";

describe("Practice API — Integration", () => {
  // TODO: Set up test database and auth token before implementing

  describe("POST /api/practice/start", () => {
    it.todo("returns a session with questions for a valid topicId");
    it.todo("returns 400 for missing topicId");
    it.todo("returns 401 without auth token");
    it.todo("returns 10 questions by default");
    it.todo("returns the requested number of questions when questionCount is provided");
  });

  describe("POST /api/practice/submit", () => {
    it.todo("returns isCorrect=true and xpAwarded for a correct answer");
    it.todo("returns isCorrect=false and xpAwarded=0 for a wrong answer");
    it.todo("returns xpAwarded=6 for a retry success");
    it.todo("returns 400 for missing sessionId");
    it.todo("detects level-up and includes it in response");
    it.todo("marks session as complete when all questions are answered");
  });

  describe("POST /api/practice/hint", () => {
    it.todo("returns level 1 hint on first hint request");
    it.todo("returns level 2 hint on second hint request for same question");
    it.todo("returns level 3 hint on third hint request");
    it.todo("hint text is non-empty and does not contain the answer");
  });

  describe("POST /api/practice/explanation", () => {
    it.todo("returns stepByStep array with at least 2 steps");
    it.todo("returns a non-empty summary");
    it.todo("returns conceptLinks array");
  });
});

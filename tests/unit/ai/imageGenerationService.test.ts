/**
 * @test ai/services/imageGenerationService
 *
 * Tests cache hits, cache misses with rate limiting, rate limit enforcement,
 * AI generation failures, and daily counter resets.
 */

// ─── Mock: Prisma ─────────────────────────────────────────────────────────────

const mockFindUnique = jest.fn();
const mockStudentFindUnique = jest.fn();
const mockStudentUpdate = jest.fn();
const mockConceptCreate = jest.fn();

jest.mock("../../../api/lib/prisma", () => ({
  prisma: {
    conceptImage: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      create: (...args: unknown[]) => mockConceptCreate(...args),
    },
    studentProfile: {
      findUnique: (...args: unknown[]) => mockStudentFindUnique(...args),
      update: (...args: unknown[]) => mockStudentUpdate(...args),
    },
  },
}));

// ─── Mock: Vercel AI generateText ────────────────────────────────────────────

const mockGenerateText = jest.fn();

jest.mock("ai", () => ({
  generateText: (...args: unknown[]) => mockGenerateText(...args),
}));

// ─── Mock: Vercel Blob put ────────────────────────────────────────────────────

const mockPut = jest.fn();

jest.mock("@vercel/blob", () => ({
  put: (...args: unknown[]) => mockPut(...args),
}));

// ─── Import after mocks ───────────────────────────────────────────────────────

import { generateConceptImage } from "../../../ai/services/imageGenerationService";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BASE_REQUEST = {
  imagePrompt: "A colorful number line showing addition",
  conceptKey: "addition-number-line",
  grade: "G3",
  altText: "Number line showing 3 + 4 = 7",
  caption: "Adding on a number line",
  userId: "user-abc-123",
};

const CACHED_IMAGE = {
  conceptKey: "addition-number-line",
  grade: "G3",
  imageUrl: "https://blob.vercel-storage.com/concept-images/addition-number-line-G3.png",
  altText: "Number line showing 3 + 4 = 7",
  caption: "Adding on a number line",
  prompt: "Educational illustration for children (grade G3): A colorful number line. Simple, colorful, clear. White background. No text in image.",
};

function makeProfile(overrides: {
  imageGensToday?: number;
  imageGenDate?: Date | null;
}) {
  return {
    imageGensToday: overrides.imageGensToday ?? 0,
    imageGenDate: overrides.imageGenDate ?? null,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("generateConceptImage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Cache HIT ───────────────────────────────────────────────────────────────

  describe("cache HIT", () => {
    it("returns cached result without calling generateText", async () => {
      mockFindUnique.mockResolvedValueOnce(CACHED_IMAGE);

      const result = await generateConceptImage(BASE_REQUEST);

      expect(result).not.toBeNull();
      expect(result!.cached).toBe(true);
      expect(result!.imageUrl).toBe(CACHED_IMAGE.imageUrl);
      expect(result!.altText).toBe(CACHED_IMAGE.altText);
      expect(result!.caption).toBe(CACHED_IMAGE.caption);
      expect(result!.prompt).toBe(CACHED_IMAGE.prompt);
      expect(mockGenerateText).not.toHaveBeenCalled();
    });

    it("does not check rate limit on cache hit", async () => {
      mockFindUnique.mockResolvedValueOnce(CACHED_IMAGE);

      await generateConceptImage(BASE_REQUEST);

      expect(mockStudentFindUnique).not.toHaveBeenCalled();
      expect(mockStudentUpdate).not.toHaveBeenCalled();
    });

    it("queries cache with correct conceptKey and grade", async () => {
      mockFindUnique.mockResolvedValueOnce(CACHED_IMAGE);

      await generateConceptImage({ ...BASE_REQUEST, grade: "G5", conceptKey: "fractions" });

      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { conceptKey_grade: { conceptKey: "fractions", grade: "G5" } },
      });
    });
  });

  // ── Cache MISS + within rate limit ──────────────────────────────────────────

  describe("cache MISS + within rate limit", () => {
    const TODAY = new Date().toISOString().slice(0, 10);
    const BLOB_URL = "https://blob.vercel-storage.com/concept-images/addition-number-line-G3.png";

    beforeEach(() => {
      // Cache miss
      mockFindUnique.mockResolvedValue(null);
      // Profile exists with 5 gens today (under limit of 10)
      mockStudentFindUnique.mockResolvedValue(
        makeProfile({ imageGensToday: 5, imageGenDate: new Date(TODAY) })
      );
      mockStudentUpdate.mockResolvedValue({});
      // AI returns an image file
      mockGenerateText.mockResolvedValue({
        files: [{ base64: Buffer.from("fake-image-data").toString("base64") }],
      });
      // Blob upload returns URL
      mockPut.mockResolvedValue({ url: BLOB_URL });
      // DB create succeeds
      mockConceptCreate.mockResolvedValue({});
    });

    it("calls generateText when cache misses", async () => {
      await generateConceptImage(BASE_REQUEST);

      expect(mockGenerateText).toHaveBeenCalledTimes(1);
    });

    it("uploads image to Vercel Blob with correct path", async () => {
      await generateConceptImage(BASE_REQUEST);

      expect(mockPut).toHaveBeenCalledWith(
        "concept-images/addition-number-line-G3.png",
        expect.any(Buffer),
        { access: "public", contentType: "image/png" }
      );
    });

    it("creates DB record with correct fields", async () => {
      await generateConceptImage(BASE_REQUEST);

      expect(mockConceptCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            conceptKey: "addition-number-line",
            grade: "G3",
            imageUrl: BLOB_URL,
            altText: BASE_REQUEST.altText,
            caption: BASE_REQUEST.caption,
          }),
        })
      );
    });

    it("returns result with cached: false and correct imageUrl", async () => {
      const result = await generateConceptImage(BASE_REQUEST);

      expect(result).not.toBeNull();
      expect(result!.cached).toBe(false);
      expect(result!.imageUrl).toBe(BLOB_URL);
      expect(result!.altText).toBe(BASE_REQUEST.altText);
      expect(result!.caption).toBe(BASE_REQUEST.caption);
    });

    it("increments imageGensToday counter for same-day generation", async () => {
      await generateConceptImage(BASE_REQUEST);

      expect(mockStudentUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: BASE_REQUEST.userId },
          data: expect.objectContaining({ imageGensToday: { increment: 1 } }),
        })
      );
    });
  });

  // ── Rate limit exceeded ──────────────────────────────────────────────────────

  describe("rate limit exceeded", () => {
    const TODAY = new Date().toISOString().slice(0, 10);

    beforeEach(() => {
      mockFindUnique.mockResolvedValue(null);
      mockStudentFindUnique.mockResolvedValue(
        makeProfile({ imageGensToday: 10, imageGenDate: new Date(TODAY) })
      );
    });

    it("returns null when imageGensToday >= 10", async () => {
      const result = await generateConceptImage(BASE_REQUEST);

      expect(result).toBeNull();
    });

    it("never calls generateText when rate limit is exceeded", async () => {
      await generateConceptImage(BASE_REQUEST);

      expect(mockGenerateText).not.toHaveBeenCalled();
    });

    it("never calls Blob put when rate limit is exceeded", async () => {
      await generateConceptImage(BASE_REQUEST);

      expect(mockPut).not.toHaveBeenCalled();
    });

    it("returns null when profile does not exist", async () => {
      mockStudentFindUnique.mockResolvedValueOnce(null);

      const result = await generateConceptImage(BASE_REQUEST);

      expect(result).toBeNull();
      expect(mockGenerateText).not.toHaveBeenCalled();
    });
  });

  // ── AI generation failure ────────────────────────────────────────────────────

  describe("AI generation failure (graceful degradation)", () => {
    beforeEach(() => {
      mockFindUnique.mockResolvedValue(null);
      const TODAY = new Date().toISOString().slice(0, 10);
      mockStudentFindUnique.mockResolvedValue(
        makeProfile({ imageGensToday: 3, imageGenDate: new Date(TODAY) })
      );
      mockStudentUpdate.mockResolvedValue({});
    });

    it("returns null when generateText throws", async () => {
      mockGenerateText.mockRejectedValueOnce(new Error("AI service unavailable"));

      const result = await generateConceptImage(BASE_REQUEST);

      expect(result).toBeNull();
    });

    it("returns null when AI response contains no files", async () => {
      mockGenerateText.mockResolvedValueOnce({ files: [] });

      const result = await generateConceptImage(BASE_REQUEST);

      expect(result).toBeNull();
    });

    it("returns null when AI response files is undefined", async () => {
      mockGenerateText.mockResolvedValueOnce({});

      const result = await generateConceptImage(BASE_REQUEST);

      expect(result).toBeNull();
    });

    it("does not create a DB record when AI fails", async () => {
      mockGenerateText.mockRejectedValueOnce(new Error("timeout"));

      await generateConceptImage(BASE_REQUEST);

      expect(mockConceptCreate).not.toHaveBeenCalled();
    });
  });

  // ── New day resets counter ───────────────────────────────────────────────────

  describe("new day resets daily counter", () => {
    const YESTERDAY = new Date(Date.now() - 86_400_000);
    const BLOB_URL = "https://blob.vercel-storage.com/concept-images/addition-number-line-G3.png";

    beforeEach(() => {
      mockFindUnique.mockResolvedValue(null);
      // Profile has 9 gens from YESTERDAY (at limit if same day, but new day resets)
      mockStudentFindUnique.mockResolvedValue(
        makeProfile({ imageGensToday: 9, imageGenDate: YESTERDAY })
      );
      mockStudentUpdate.mockResolvedValue({});
      mockGenerateText.mockResolvedValue({
        files: [{ base64: Buffer.from("img").toString("base64") }],
      });
      mockPut.mockResolvedValue({ url: BLOB_URL });
      mockConceptCreate.mockResolvedValue({});
    });

    it("resets counter to 1 when imageGenDate is a previous day", async () => {
      await generateConceptImage(BASE_REQUEST);

      expect(mockStudentUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: BASE_REQUEST.userId },
          data: expect.objectContaining({ imageGensToday: 1 }),
        })
      );
    });

    it("allows generation even with 9 gens recorded from yesterday", async () => {
      const result = await generateConceptImage(BASE_REQUEST);

      expect(result).not.toBeNull();
      expect(result!.cached).toBe(false);
    });

    it("proceeds with generation after resetting counter", async () => {
      await generateConceptImage(BASE_REQUEST);

      expect(mockGenerateText).toHaveBeenCalledTimes(1);
    });
  });

  // ── Grade mapping ────────────────────────────────────────────────────────────

  describe("grade mapping (toPrismaGrade)", () => {
    const TODAY = new Date().toISOString().slice(0, 10);
    const BLOB_URL = "https://blob.vercel-storage.com/concept-images/foo-K.png";

    beforeEach(() => {
      mockFindUnique.mockResolvedValue(null);
      mockStudentFindUnique.mockResolvedValue(
        makeProfile({ imageGensToday: 0, imageGenDate: new Date(TODAY) })
      );
      mockStudentUpdate.mockResolvedValue({});
      mockGenerateText.mockResolvedValue({
        files: [{ base64: Buffer.from("img").toString("base64") }],
      });
      mockPut.mockResolvedValue({ url: BLOB_URL });
      mockConceptCreate.mockResolvedValue({});
    });

    it("maps grade 'K' correctly to prisma grade 'K'", async () => {
      await generateConceptImage({ ...BASE_REQUEST, grade: "K", conceptKey: "foo" });

      expect(mockConceptCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ grade: "K" }),
        })
      );
    });

    it("clamps grade above G8 to G8", async () => {
      await generateConceptImage({ ...BASE_REQUEST, grade: "G9", conceptKey: "foo" });

      expect(mockConceptCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ grade: "G8" }),
        })
      );
    });

    it("defaults unknown grade to G4", async () => {
      await generateConceptImage({ ...BASE_REQUEST, grade: "INVALID", conceptKey: "foo" });

      expect(mockConceptCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ grade: "G4" }),
        })
      );
    });
  });
});

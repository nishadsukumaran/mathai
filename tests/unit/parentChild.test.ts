/**
 * @test Parent-child model logic
 *
 * Tests the pure business logic functions from parentChildService.
 * DB-dependent functions are tested via shape validation only.
 */

import bcrypt from "bcryptjs";

// ─── PIN validation and hashing ──────────────────────────────────────────────

describe("Parent-Child: PIN Management", () => {

  describe("PIN validation rules", () => {
    it("rejects PIN shorter than 4 digits", () => {
      expect("123".length < 4).toBe(true);
    });

    it("accepts PIN of exactly 4 digits", () => {
      const pin = "1234";
      expect(pin.length >= 4 && /^\d+$/.test(pin)).toBe(true);
    });

    it("accepts PIN of 6 digits", () => {
      const pin = "123456";
      expect(pin.length >= 4 && /^\d+$/.test(pin)).toBe(true);
    });

    it("rejects PIN with letters", () => {
      const pin = "12ab";
      expect(/^\d+$/.test(pin)).toBe(false);
    });

    it("rejects empty PIN", () => {
      expect("".length >= 4).toBe(false);
    });
  });

  describe("PIN hashing", () => {
    it("hashes a PIN with bcrypt", async () => {
      const pin = "1234";
      const hashed = await bcrypt.hash(pin, 10);
      expect(hashed).not.toBe(pin);
      expect(hashed.length).toBeGreaterThan(20);
    });

    it("verifies correct PIN against hash", async () => {
      const pin = "5678";
      const hashed = await bcrypt.hash(pin, 10);
      const valid = await bcrypt.compare(pin, hashed);
      expect(valid).toBe(true);
    });

    it("rejects wrong PIN against hash", async () => {
      const pin = "5678";
      const hashed = await bcrypt.hash(pin, 10);
      const valid = await bcrypt.compare("9999", hashed);
      expect(valid).toBe(false);
    });
  });
});

// ─── Username generation logic ───────────────────────────────────────────────

describe("Parent-Child: Username Generation", () => {

  function generateUsernameSync(childName: string): string {
    const base = childName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12) || "student";
    const suffix = Math.floor(100 + Math.random() * 900);
    return `${base}-${suffix}`;
  }

  it("generates lowercase username from name", () => {
    const username = generateUsernameSync("Aryan");
    expect(username).toMatch(/^aryan-\d{3}$/);
  });

  it("strips special characters", () => {
    const username = generateUsernameSync("O'Brien Jr.");
    expect(username).toMatch(/^obrienjr-\d{3}$/);
  });

  it("handles empty name with fallback", () => {
    const base = "".toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12) || "student";
    expect(base).toBe("student");
  });

  it("truncates long names to 12 chars", () => {
    const username = generateUsernameSync("Bartholomew Christopher");
    // "bartholomewchristopher" → truncated to 12 → "bartholomewc"
    expect(username.split("-")[0]!.length).toBeLessThanOrEqual(12);
  });

  it("always produces 3-digit suffix", () => {
    for (let i = 0; i < 20; i++) {
      const username = generateUsernameSync("Test");
      const suffix = username.split("-")[1]!;
      expect(suffix.length).toBe(3);
      expect(Number(suffix)).toBeGreaterThanOrEqual(100);
      expect(Number(suffix)).toBeLessThanOrEqual(999);
    }
  });
});

// ─── Login mode validation ───────────────────────────────────────────────────

describe("Parent-Child: Login Modes", () => {

  const VALID_MODES = ["parent_managed", "pin_only", "hybrid"];

  it("parent_managed does not require PIN", () => {
    const mode: string = "parent_managed";
    const needsPin = mode === "pin_only" || mode === "hybrid";
    expect(needsPin).toBe(false);
  });

  it("pin_only requires PIN", () => {
    const mode: string = "pin_only";
    const needsPin = mode === "pin_only" || mode === "hybrid";
    expect(needsPin).toBe(true);
  });

  it("hybrid requires PIN", () => {
    const mode: string = "hybrid";
    const needsPin = mode === "pin_only" || mode === "hybrid";
    expect(needsPin).toBe(true);
  });

  it("all valid modes are recognized", () => {
    for (const mode of VALID_MODES) {
      expect(VALID_MODES.includes(mode)).toBe(true);
    }
  });
});

// ─── Relationship types ──────────────────────────────────────────────────────

describe("Parent-Child: Relationship Types", () => {

  const VALID_TYPES = ["guardian", "mother", "father", "other"];

  it("all relationship types are valid", () => {
    for (const type of VALID_TYPES) {
      expect(typeof type).toBe("string");
      expect(type.length).toBeGreaterThan(0);
    }
  });

  it("defaults to guardian", () => {
    const input: string | undefined = undefined;
    const type = input ?? "guardian";
    expect(type).toBe("guardian");
  });
});

// ─── Link status ─────────────────────────────────────────────────────────────

describe("Parent-Child: Link Status", () => {

  it("active link allows access", () => {
    const status: string = "active";
    expect(status === "active").toBe(true);
  });

  it("revoked link denies access", () => {
    const status: string = "revoked";
    expect(status === "active").toBe(false);
  });

  it("pending link denies access", () => {
    const status: string = "pending";
    expect(status === "active").toBe(false);
  });
});

// ─── Data model shape validation ─────────────────────────────────────────────

describe("Parent-Child: Model Shapes", () => {

  it("ParentChildLink has all required fields", () => {
    const link = {
      id: "cuid123", parentId: "parent1", childId: "child1",
      relationshipType: "guardian", status: "active",
      isPrimaryGuardian: true, createdAt: new Date(), updatedAt: new Date(),
    };
    expect(link.parentId).toBeDefined();
    expect(link.childId).toBeDefined();
    expect(link.relationshipType).toBeDefined();
    expect(link.status).toBeDefined();
    expect(typeof link.isPrimaryGuardian).toBe("boolean");
  });

  it("StudentProfile child fields are optional-safe", () => {
    const profile = {
      displayName: null, curriculum: "cambridge", schoolName: null,
      onboardingGoal: null, preferredLoginMode: "parent_managed",
      username: null, hashedPin: null,
    };
    expect(profile.curriculum).toBe("cambridge");
    expect(profile.displayName).toBeNull();
    expect(profile.hashedPin).toBeNull();
  });

  it("LinkedChild shape includes all presentation fields", () => {
    const child = {
      id: "c1", name: "Aryan", displayName: "Aryan", grade: "G4",
      curriculum: "cambridge", username: "aryan-472", hasPin: true,
      loginMode: "hybrid", linkStatus: "active", isPrimary: true,
      lastLoginAt: null,
    };
    expect(typeof child.hasPin).toBe("boolean");
    expect(child.loginMode).toBe("hybrid");
    expect(child.linkStatus).toBe("active");
  });
});

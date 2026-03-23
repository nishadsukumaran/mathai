import type { Config } from "jest";

const config: Config = {
  projects: [
    // ── Default project: all tests except hook tests ──────────────────────────
    {
      displayName: "unit",
      preset: "ts-jest",
      testEnvironment: "node",
      rootDir: ".",
      testMatch: [
        "<rootDir>/tests/**/*.test.ts",
        "!<rootDir>/tests/unit/hooks/**/*.test.ts",
      ],
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/$1",
      },
      transform: {
        "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.json" }],
      },
    },
    // ── Hook tests: needs DOM lib for the "use client" hooks ──────────────────
    {
      displayName: "hooks",
      preset: "ts-jest",
      testEnvironment: "node",
      rootDir: ".",
      testMatch: ["<rootDir>/tests/unit/hooks/**/*.test.ts"],
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/$1",
      },
      transform: {
        "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.test-hooks.json" }],
      },
    },
  ],
  collectCoverageFrom: [
    "ai/**/*.ts",
    "curriculum/**/*.ts",
    "services/**/*.ts",
    "api/services/**/*.ts",
    "!**/*.d.ts",
    "!**/node_modules/**",
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};

export default config;

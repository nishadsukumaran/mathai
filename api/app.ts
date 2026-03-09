/**
 * api/app.ts
 *
 * Express application factory.
 * Separated from server.ts so the app can be imported by tests
 * without binding to a port.
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import router from "./routes/index";
import { errorMiddleware } from "./middlewares/error.middleware";
import { rateLimitMiddleware } from "./middlewares/rateLimit.middleware";

const app = express();

// ─── Security ──────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    credentials: true,
  })
);

// ─── Body parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

// ─── Logging ───────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// ─── Rate limiting ─────────────────────────────────────────────────────────
app.use(rateLimitMiddleware);

// ─── Routes ────────────────────────────────────────────────────────────────
app.use("/api", router);

// ─── 404 catch-all ────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// ─── Global error handler ─────────────────────────────────────────────────
app.use(errorMiddleware);

export default app;

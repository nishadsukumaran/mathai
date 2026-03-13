/**
 * api/app.ts
 *
 * Express application factory.
 * Separated from server.ts so the app can be imported by tests
 * without binding to a port.
 */

import express from "express";
import compression from "compression";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import router from "./routes/index";
import { errorMiddleware } from "./middlewares/error.middleware";
import { rateLimitMiddleware } from "./middlewares/rateLimit.middleware";

const app = express();

// ─── Security ──────────────────────────────────────────────────────────────
app.use(helmet());

// ─── Compression ───────────────────────────────────────────────────────────
app.use(compression());

// ─── CORS — accept Vercel frontend + localhost dev ─────────────────────────
// CORS_ORIGIN may be a comma-separated list of allowed origins, e.g.:
//   https://mathai.aiops.ae,https://mathai.vercel.app
const ALLOWED_ORIGINS: string[] = [
  ...(process.env.CORS_ORIGIN ?? "").split(",").map((o) => o.trim()),
  ...(process.env.NEXT_PUBLIC_APP_URL ?? "").split(",").map((o) => o.trim()),
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      // Allow requests with no origin (curl, health checks, server-to-server)
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
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

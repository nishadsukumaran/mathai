/**
 * api/server.ts
 *
 * Entry point — binds the Express app to a port.
 *
 * Production:  node dist/api/server.js   (Render sets PORT automatically)
 * Development: npx tsx api/server.ts
 */

import app from "./app";
import { startTopicHealthJob } from "./services/topicHealthService";

const PORT = Number(process.env.PORT ?? 3001);
const HOST = "0.0.0.0"; // Required for Render / Docker — listens on all interfaces

app.listen(PORT, HOST, () => {
  console.log(`[api] MathAI API running on ${HOST}:${PORT}`);
  console.log(`[api] Health: http://${HOST}:${PORT}/api/health`);
  console.log(`[api] Env: ${process.env.NODE_ENV ?? "development"}`);

  // Background job: detect and fix students whose topic lists are empty
  // (can happen when AI generation silently fails on a Render cold start at signup).
  startTopicHealthJob();
});

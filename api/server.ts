/**
 * api/server.ts
 *
 * Entry point — binds the Express app to a port.
 * Run: npx ts-node api/server.ts
 */

import app from "./app";

const PORT = Number(process.env.PORT ?? 3001);

app.listen(PORT, () => {
  console.log(`[api] MathAI API running on http://localhost:${PORT}/api`);
  console.log(`[api] Health: http://localhost:${PORT}/api/health`);
});

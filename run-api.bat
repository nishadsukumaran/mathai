@echo off
REM Starts the MathAI Express API server on port 3001.
REM Run this in a separate terminal alongside run-dev.bat (Next.js on port 3000).

SET PATH=C:\Program Files\nodejs;%PATH%
cd /d "C:\Users\NishadSukumaran\.claude\projects\MathAI"

SET DATABASE_URL=postgresql://postgres.raenvmoefhuitxwnratf:Nwq3Hw73otgyAbMJ@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
SET NODE_ENV=development
SET AI_PROVIDER=mock
SET PORT=3001
SET NEXT_PUBLIC_APP_URL=http://localhost:3000

echo [api] Starting MathAI Express API on port 3001...
"C:\Program Files\nodejs\node.exe" node_modules\.bin\ts-node --project tsconfig.json api/server.ts

@echo off
SET PATH=C:\Program Files\nodejs;%PATH%
cd /d "C:\Users\NishadSukumaran\.claude\projects\MathAI"
SET DATABASE_URL=postgresql://postgres.raenvmoefhuitxwnratf:Nwq3Hw73otgyAbMJ@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
"C:\Program Files\nodejs\node.exe" node_modules\prisma\build\index.js db push --schema=database/schema/schema.prisma --accept-data-loss > dbpush-out.txt 2> dbpush-err.txt
echo Exit: %ERRORLEVEL% >> dbpush-out.txt

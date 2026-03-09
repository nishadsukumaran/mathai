@echo off
SET PATH=C:\Program Files\nodejs;%PATH%
cd /d "C:\Users\NishadSukumaran\.claude\projects\MathAI"
SET DATABASE_URL=postgresql://postgres.raenvmoefhuitxwnratf:Nwq3Hw73otgyAbMJ@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
"C:\Program Files\nodejs\node.exe" node_modules\prisma\build\index.js migrate deploy --schema=database/schema/schema.prisma > migrate-out.txt 2> migrate-err.txt
echo Exit: %ERRORLEVEL% >> migrate-out.txt

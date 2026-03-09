@echo off
SET PATH=C:\Program Files\nodejs;%PATH%
cd /d "C:\Users\NishadSukumaran\.claude\projects\MathAI"
"C:\Program Files\nodejs\node.exe" --require "./patch-path.js" node_modules\prisma\build\index.js generate --schema=database/schema/schema.prisma > debug-prisma2-out.txt 2> debug-prisma2-err.txt
echo Exit: %ERRORLEVEL% >> debug-prisma2-out.txt

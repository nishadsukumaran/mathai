@echo off
SET PATH=C:\Program Files\nodejs;%PATH%
cd /d "C:\Users\NishadSukumaran\.claude\projects\MathAI"
SET DEBUG=prisma*
SET NODE_OPTIONS=--stack-trace-limit=50
"C:\Program Files\nodejs\node.exe" node_modules\prisma\build\index.js generate --schema=database/schema/schema.prisma > debug-prisma3-out.txt 2> debug-prisma3-err.txt
echo Exit: %ERRORLEVEL% >> debug-prisma3-out.txt

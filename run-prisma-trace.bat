@echo off
SET PATH=C:\Program Files\nodejs;%PATH%
cd /d "C:\Users\NishadSukumaran\.claude\projects\MathAI"
"C:\Program Files\nodejs\node.exe" trace-prisma.js > "prisma-trace-out.txt" 2> "prisma-trace-err.txt"
echo Exit: %ERRORLEVEL% >> "prisma-trace-out.txt"

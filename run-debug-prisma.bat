@echo off
SET PATH=C:\Program Files\nodejs;%PATH%
cd /d "C:\Users\NishadSukumaran\.claude\projects\MathAI"
"C:\Program Files\nodejs\node.exe" debug-prisma.js > debug-prisma-out.txt 2> debug-prisma-err.txt
echo Exit: %ERRORLEVEL% >> debug-prisma-out.txt

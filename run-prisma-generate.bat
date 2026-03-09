@echo off
SET PATH=C:\Program Files\nodejs;%PATH%
cd /d "C:\Users\NishadSukumaran\.claude\projects\MathAI"
"C:\Program Files\nodejs\node.exe" "node_modules\prisma\build\index.js" generate --schema=database/schema/schema.prisma > "prisma-gen-out.txt" 2> "prisma-gen-err.txt"
echo Exit: %ERRORLEVEL% >> "prisma-gen-out.txt"

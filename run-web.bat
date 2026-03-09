@echo off
REM Starts the MathAI Next.js web app on port 3002.
REM Run this in a separate terminal alongside run-api.bat (Express API on port 3001).
REM Port 3000 is reserved by Docker/WSL on this machine.

SET PATH=C:\Program Files\nodejs;%PATH%
cd /d "C:\Users\NishadSukumaran\.claude\projects\MathAI\apps\web"

echo [web] Starting MathAI Next.js on port 3002...
"C:\Program Files\nodejs\node.exe" ..\..\node_modules\next\dist\bin\next dev -p 3002

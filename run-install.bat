@echo off
SET PATH=C:\Program Files\nodejs;%PATH%
cd /d "C:\Users\NishadSukumaran\.claude\projects\MathAI"
"C:\Program Files\nodejs\node.exe" "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" install --legacy-peer-deps > "C:\Users\NishadSukumaran\.claude\projects\MathAI\npm-install.log" 2>&1

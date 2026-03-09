@echo off
SET PATH=C:\Program Files\nodejs;%PATH%
cd /d "C:\Users\NishadSukumaran\.claude\projects\MathAI\apps\web"
"C:\Program Files\nodejs\node.exe" "C:\Users\NishadSukumaran\.claude\projects\MathAI\node_modules\next\dist\bin\next" dev > "C:\Users\NishadSukumaran\.claude\projects\MathAI\dev-errors.log" 2>&1

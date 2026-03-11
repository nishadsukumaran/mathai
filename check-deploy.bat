@echo off
SET REPO=C:\Users\NishadSukumaran\.claude\projects\MathAI
cd /d "%REPO%\apps\web"
echo Checking latest deployments...
"C:\Program Files\nodejs\node.exe" "%APPDATA%\npm\node_modules\vercel\dist\index.js" ls --token="%VERCEL_TOKEN%" 2>nul || (
  echo Trying without token...
  "C:\Program Files\nodejs\node.exe" "%APPDATA%\npm\node_modules\vercel\dist\index.js" ls
)

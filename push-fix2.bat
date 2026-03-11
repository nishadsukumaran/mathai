@echo off
SET GIT=C:\Program Files\Git\bin\git.exe
SET REPO=C:\Users\NishadSukumaran\.claude\projects\MathAI

"%GIT%" -C "%REPO%" add apps/web/vercel.json
"%GIT%" -C "%REPO%" rm vercel.json 2>nul
"%GIT%" -C "%REPO%" status
"%GIT%" -C "%REPO%" commit -m "chore: move vercel.json to apps/web (correct monorepo root)"
"%GIT%" -C "%REPO%" push origin main
echo Done!

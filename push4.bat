@echo off
SET REPO=C:\Users\NishadSukumaran\.claude\projects\MathAI
SET GIT=C:\Program Files\Git\bin\git.exe

"%GIT%" -C "%REPO%" add apps/web/tsconfig.json
"%GIT%" -C "%REPO%" commit -m "fix: add baseUrl to web tsconfig so @/* paths resolve from apps/web"
"%GIT%" -C "%REPO%" push origin main
echo Exit code: %ERRORLEVEL%

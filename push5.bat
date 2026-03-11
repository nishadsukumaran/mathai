@echo off
SET REPO=C:\Users\NishadSukumaran\.claude\projects\MathAI
SET GIT=C:\Program Files\Git\bin\git.exe

"%GIT%" -C "%REPO%" add apps/web/app/auth/error/page.tsx
"%GIT%" -C "%REPO%" commit -m "fix: use || instead of ?? for auth error fallback to handle empty string"
"%GIT%" -C "%REPO%" push origin main
echo Exit code: %ERRORLEVEL%

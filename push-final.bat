@echo off
SET REPO=C:\Users\NishadSukumaran\.claude\projects\MathAI
SET GIT=C:\Program Files\Git\bin\git.exe

"%GIT%" -C "%REPO%" add package.json package-lock.json apps/web/next.config.ts
"%GIT%" -C "%REPO%" commit -m "fix: postinstall prisma generate, clean lockfile, remove deprecated eslint config"
"%GIT%" -C "%REPO%" push origin main
echo Exit: %ERRORLEVEL%

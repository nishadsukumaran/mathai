@echo off
SET REPO=C:\Users\NishadSukumaran\.claude\projects\MathAI
SET NPM=C:\Program Files\nodejs\npm.cmd
SET GIT=C:\Program Files\Git\bin\git.exe

cd /d "%REPO%"

echo [1] Deleting lockfile for clean regeneration...
if exist package-lock.json del package-lock.json

echo [2] Running npm install (will regenerate lockfile + run postinstall/prisma generate)...
"%NPM%" install --legacy-peer-deps
if errorlevel 1 (echo npm install FAILED && exit /b 1)

echo [3] Staging all changed files...
"%GIT%" -C "%REPO%" add package.json package-lock.json apps/web/next.config.ts

echo [4] Committing...
"%GIT%" -C "%REPO%" commit -m "fix: postinstall prisma generate, clean lockfile, remove deprecated eslint config"

echo [5] Pushing...
"%GIT%" -C "%REPO%" push origin main

echo Done! Exit: %ERRORLEVEL%

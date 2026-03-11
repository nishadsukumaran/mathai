@echo off
SET REPO=C:\Users\NishadSukumaran\.claude\projects\MathAI
SET NPM=C:\Program Files\nodejs\npm.cmd
SET GIT=C:\Program Files\Git\bin\git.exe

cd /d "%REPO%"

echo [1/4] Deleting package-lock.json for clean regeneration...
if exist package-lock.json del package-lock.json

echo [2/4] Running npm install...
"%NPM%" install --legacy-peer-deps
if errorlevel 1 (echo npm install failed && exit /b 1)

echo [3/4] Staging changes...
"%GIT%" -C "%REPO%" add package.json package-lock.json

echo [4/4] Committing and pushing...
"%GIT%" -C "%REPO%" commit -m "fix: add postcss-selector-parser and postcss-nested to root devDeps"
"%GIT%" -C "%REPO%" push origin main

echo Done!

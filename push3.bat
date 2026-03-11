@echo off
SET REPO=C:\Users\NishadSukumaran\.claude\projects\MathAI
SET GIT=C:\Program Files\Git\bin\git.exe

"%GIT%" -C "%REPO%" add package.json package-lock.json
"%GIT%" -C "%REPO%" commit -m "fix: add postcss-selector-parser and postcss-nested to root devDeps"
"%GIT%" -C "%REPO%" push origin main
echo Exit code: %ERRORLEVEL%

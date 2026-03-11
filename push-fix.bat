@echo off
SET GIT=C:\Program Files\Git\bin\git.exe
SET REPO=C:\Users\NishadSukumaran\.claude\projects\MathAI

"%GIT%" -C "%REPO%" add package.json package-lock.json .npmrc
"%GIT%" -C "%REPO%" status
"%GIT%" -C "%REPO%" commit -m "fix: add postcss to root devDeps to resolve workspace hoisting issue"
"%GIT%" -C "%REPO%" push origin main
echo Done!

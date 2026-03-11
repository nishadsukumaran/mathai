@echo off
SET REPO=C:\Users\NishadSukumaran\.claude\projects\MathAI
SET GIT=C:\Program Files\Git\bin\git.exe

echo Last 5 commits:
"%GIT%" -C "%REPO%" log --oneline -5

echo.
echo Git status:
"%GIT%" -C "%REPO%" status --short

echo.
echo Lock file exists?
if exist "%REPO%\package-lock.json" (echo YES) else (echo NO)

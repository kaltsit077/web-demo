@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [!] 未找到 Node.js，请先安装: https://nodejs.org/
  pause
  exit /b 1
)

echo.
echo  启动 789罗德岛学院 …
echo.
node scripts\dev-server.mjs %*
if errorlevel 1 pause

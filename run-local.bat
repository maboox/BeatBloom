@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Please install Node.js 24 LTS, then run npm ci --ignore-scripts.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Run npm ci --ignore-scripts once, then start this launcher again.
  pause
  exit /b 1
)
call npm.cmd run dev -- --open

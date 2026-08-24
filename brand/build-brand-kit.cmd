@echo off
REM ============================================================
REM  Rich-Land Developers - regenerate the entire branding kit
REM  Double-click this file (or run it) to rebuild every asset
REM  from the master richlandlogo.png.
REM
REM  Requires: Node.js and ffmpeg on PATH.
REM ============================================================

echo.
echo Building Rich-Land Developers brand kit...
echo.

cd /d "%~dp0.."
node scripts\build-brand-kit.js

echo.
echo Done. Assets are in brand\dist\ and apps\web\public\brand\.
echo.
pause

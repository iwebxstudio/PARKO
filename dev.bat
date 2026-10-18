@echo off
title PARKO Launcher
echo ===================================================
echo             PARKO Development Launcher             
echo ===================================================
echo.

echo [+] Starting Backend (API)...
start "PARKO Backend (NestJS)" cmd /k "cd backend && npm run start:dev"

echo [+] Starting Frontend (React)...
start "PARKO Frontend (Vite)" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo [OK] Both services are starting in new windows!
echo      - Press Ctrl+C in those windows to stop them.
echo ===================================================
pause

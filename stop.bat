@echo off
chcp 65001 >nul
title PARKO — Stop System
color 0E
echo ==============================================================================
echo    PARKO — Stopping System
echo ==============================================================================
echo.
docker compose down || docker-compose down
echo.
echo [OK] PARKO has stopped.
pause

@echo off
chcp 65001 >nul
title PARKO — Start System
color 0A
echo ==============================================================================
echo    PARKO — Smart Parking Management System (ລະບົບຄຸ້ມຄອງລານຈອດລົດ)
echo ==============================================================================
echo.

:: 1. Check if Docker is running
docker info >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo [ERROR] Docker Desktop is not running!
    echo         ກະລຸນາເປີດໂປຣແກຣມ Docker Desktop ແລ້ວລອງໃໝ່ອີກຄັ້ງ.
    echo.
    pause
    exit /b 1
)

echo [*] Starting PARKO Services via Docker Compose...
echo.

:: 2. Run docker compose up -d
docker compose up -d || docker-compose up -d

if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo.
    echo [ERROR] Failed to start containers. Please check error messages above.
    pause
    exit /b 1
)

echo.
echo ==============================================================================
echo [SUCCESS] PARKO is starting in background!
echo.
echo  - Frontend UI:  http://localhost:39741
echo  - HTTPS UI:     https://localhost:39742
echo  - Admin Login:  admin / admin123
echo  - Staff Login:  staff / staff123
echo ==============================================================================
echo.

:: 3. Open browser automatically
timeout /t 5 >nul
start http://localhost:39741

echo Opening browser at http://localhost:39741...
echo Press any key to close this launcher window.
pause >nul

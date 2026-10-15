@echo off
chcp 65001 >nul
title EC module launcher
echo ==============================================
echo  EC module (ecommerce) starting...
echo  1) docker deps: mysql, redis, checkpoints
echo  2) api  -^> http://localhost:8010
echo  3) web  -^> http://localhost:3000
echo ==============================================
docker start ecommerce-operation-assistant-mysql-1 ecommerce-operation-assistant-redis-1 ecommerce-operation-assistant-agent-checkpoints-1
echo Waiting 5s for docker services...
timeout /t 5 /nobreak >nul
start "ec-api-8010" cmd /k "cd /d D:\python_student\ecommerce-operation-assistant\api && .venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8010"
start "ec-web-3000" cmd /k "cd /d D:\python_student\ecommerce-operation-assistant\web && npm run dev"
echo.
echo If a window says "error while attempting to bind",
echo that service is already running - just close it.
echo.
timeout /t 10 /nobreak >nul
start http://localhost:3000
echo EC module started. Close the two black windows
echo (ec-api / ec-web) to stop those two.
timeout /t 10 /nobreak >nul

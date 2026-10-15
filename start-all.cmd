@echo off
chcp 65001 >nul
title Ecom-Assistant-Launcher
set ROOT=D:\python_student\ecommerce-operation-assistant
set API=%ROOT%\api
set WEB=%ROOT%\web

echo ==========================================
echo   AI Ecommerce Operation Assistant
echo ==========================================
echo.

echo [1/5] Starting base containers (mysql / redis / agent-checkpoints)...
cd /d "%ROOT%"
docker compose up -d mysql redis agent-checkpoints
echo.

echo [2/5] Starting backend API (8000)...
start "API-8000" cmd /k "cd /d %API% && .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

echo [3/5] Starting generation scheduler...
start "scheduler-gen" cmd /k "cd /d %API% && .\.venv\Scripts\python.exe -m app.worker.generation_scheduler"

echo [4/5] Starting Celery worker (Agent)...
start "celery-agent" cmd /k "cd /d %API% && .\.venv\Scripts\python.exe -m celery -A app.worker.celery_app.celery_app worker -l INFO -P solo -Q generation,agent,agent.workflow,maintenance"

echo [5/5] Starting frontend (3000)...
start "web-3000" cmd /k "cd /d %WEB% && npm run dev"

echo.
echo   All 4 windows launched. This window can be closed.
echo   Open: http://127.0.0.1:3000   (do NOT use 172.18.48.1)
echo.
pause

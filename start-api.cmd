@echo off
chcp 65001 >nul
title API-8010
cd /d D:\python_student\ecommerce-operation-assistant\api
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8010

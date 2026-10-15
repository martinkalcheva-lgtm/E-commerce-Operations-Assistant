@echo off
chcp 65001 >nul
title scheduler-gen
cd /d D:\python_student\ecommerce-operation-assistant\api
.\.venv\Scripts\python.exe -m app.worker.generation_scheduler

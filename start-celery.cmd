@echo off
chcp 65001 >nul
title celery-agent
cd /d D:\python_student\ecommerce-operation-assistant\api
.\.venv\Scripts\python.exe -m celery -A app.worker.celery_app.celery_app worker -l INFO -P solo -Q generation,agent,agent.workflow,maintenance

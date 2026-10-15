@echo off
chcp 65001 >nul
title EC module stopper
echo Stopping EC module docker services...
docker stop ecommerce-operation-assistant-mysql-1 ecommerce-operation-assistant-redis-1 ecommerce-operation-assistant-agent-checkpoints-1
echo Docker services stopped.
echo Now manually close the two windows titled:
echo   ec-api-8010
echo   ec-web-3000
timeout /t 10 /nobreak >nul

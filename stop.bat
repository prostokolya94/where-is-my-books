@echo off
setlocal
cd /d "%~dp0"

echo Останавливаю PostgreSQL...
docker-compose down
echo.
echo Готово. Данные в Docker volume сохранены.
pause

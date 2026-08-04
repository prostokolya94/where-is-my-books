@echo off
setlocal
cd /d "%~dp0"

title Where Is My Books - Launcher

echo ============================================
echo   Where Is My Books - запуск приложения
echo ============================================
echo.

if not exist "backend\node_modules" (
    echo Первый запуск: устанавливаю зависимости...
    call npm install
    if errorlevel 1 goto :fail
    call npm --prefix backend install
    if errorlevel 1 goto :fail
    call npm --prefix frontend install
    if errorlevel 1 goto :fail
)

echo Запускаю сервер и интерфейс...
start "WIMB - where-is-my-books" cmd /k "npm run dev"

echo Жду, пока поднимется бэкенд (localhost:3001)...
:wait
curl -s -o nul --max-time 2 http://localhost:3001/api/categories
if errorlevel 1 (
    timeout /t 1 /nobreak >nul
    goto :wait
)

echo Бэкенд готов. Открываю браузер...
start "" "http://localhost:5173"
echo.
echo Приложение открыто: http://localhost:5173
echo Окно с логами сервера не закрывайте - для остановки приложения закройте его.
timeout /t 8 /nobreak >nul
exit /b 0

:fail
echo.
echo Ошибка установки зависимостей. Запустите вручную: npm run setup
pause
exit /b 1

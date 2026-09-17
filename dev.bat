@echo off
setlocal
cd /d "%~dp0"

title Where Is My Books - Dev

echo ============================================
echo   Where Is My Books - локальная разработка
echo ============================================
echo.

:: 1. Docker / Postgres
echo Проверяю Docker...
docker version -q >nul 2>&1
if errorlevel 1 (
    echo [!] Docker не найден или не запущен.
    echo     Установите Docker Desktop и запустите его перед использованием этого скрипта.
    echo     https://docs.docker.com/desktop/install/windows-install/
    pause
    exit /b 1
)

echo Запускаю PostgreSQL через Docker Compose...
docker-compose up -d
if errorlevel 1 (
    echo [!] Ошибка запуска Docker Compose.
    pause
    exit /b 1
)

echo Жду, пока PostgreSQL поднимется (порт 5432)...
set "READY=0"
set /a "ATTEMPTS=0"
:pgwait
set /a ATTEMPTS+=1
if %ATTEMPTS% GTR 30 (
    echo [!] PostgreSQL не ответил за 30 секунд. Проверьте docker-compose.yml.
    pause
    exit /b 1
)
docker exec wimb-postgres pg_isready -U postgres -q >nul 2>&1
if errorlevel 1 (
    timeout /t 1 /nobreak >nul
    goto :pgwait
)
echo     PostgreSQL готов.
echo.

:: 2. Зависимости (первый запуск)
if not exist "backend\node_modules" (
    echo Первый запуск: устанавливаю зависимости...
    call npm run setup
    if errorlevel 1 (
        echo [!] Ошибка установки зависимостей.
        pause
        exit /b 1
    )
    echo.
)

:: 3. Бэкенд + фронтенд
echo Запускаю бэкенд и фронтенд...
echo.
start "WIMB Dev" cmd /k "npm run dev"

echo Жду, пока бэкенд поднимется (localhost:3001)...
:backendwait
curl -s -o nul --max-time 2 http://localhost:3001/api/auth/me >nul 2>&1
if errorlevel 1 (
    timeout /t 1 /nobreak >nul
    goto :backendwait
)
echo     Бэкенд готов.
echo.

echo Открываю браузер...
start "" "http://localhost:5173"
echo.
echo ============================================
echo   Приложение: http://localhost:5173
echo   PostgreSQL: localhost:5432 (postgres/postgres/books)
echo ============================================
echo.
echo Для остановки:
echo   - закройте окно "WIMB Dev"
echo   - в этой консоли нажмите любую клавишу
echo.
pause

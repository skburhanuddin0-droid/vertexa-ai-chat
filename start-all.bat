@echo off
REM ==========================================
REM  VERTEXA - Local Development Startup
REM ==========================================
echo ========================================
echo  VERTEXA - Local Mode
echo ========================================
echo.

REM --- Force .env.local to use localhost ---
echo Configuring frontend for LOCAL mode...
powershell -Command "(Get-Content '%cd%\frontend\.env.local') -replace 'VITE_API_URL=.*', 'VITE_API_URL=http://localhost:8000' | Set-Content '%cd%\frontend\.env.local'"
echo   VITE_API_URL = http://localhost:8000
echo.

REM --- Start Ollama ---
echo Starting Ollama LLM Server...
start "Ollama" cmd /k "cd %cd% && ollama serve"

echo Waiting for Ollama to respond...
set /a attempts=0
:wait_loop
curl -s http://localhost:11434 >nul 2>&1
if %errorlevel%==0 (
    echo [OK] Ollama is up.
    echo.
    echo Checking for available models...
    ollama list >nul 2>&1
    if %errorlevel%==0 (
        echo [OK] Models available.
    ) else (
        echo [INFO] No models found. Pulling qwen3:4b...
        echo.
        ollama pull qwen3:4b
    )
    goto ollama_ready
) else (
    set /a attempts+=1
    if %attempts% GEQ 15 (
        echo [WARNING] Ollama did not respond after 15 seconds, continuing anyway.
        goto ollama_ready
    ) else (
        timeout /t 1 /nobreak >nul
        goto wait_loop
    )
)

:ollama_ready
echo.

REM --- Start Backend ---
echo Starting Backend API Server (port 8000)...
start "Backend API" cmd /k "cd %cd% && C:/Users/skbur/Ai_Project/venv/Scripts/python.exe server.py"
timeout /t 3 /nobreak >nul

REM --- Start Frontend ---
echo Starting Frontend Dev Server (port 3000)...
start "Frontend UI" cmd /k "cd %cd%/frontend && npm run dev"

echo.
echo ========================================
echo  All Services Started (LOCAL MODE)
echo ========================================
echo.
echo   Backend API : http://localhost:8000
echo   Frontend UI : http://localhost:3000
echo.
echo   Open http://localhost:3000 in your browser!
echo   Press Ctrl+C in any window to stop.
echo ========================================

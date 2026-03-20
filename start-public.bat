@echo off
REM ==========================================
REM  VERTEXA - Public Access Startup (ngrok)
REM  (Access from phone or share with friends)
REM ==========================================
echo ========================================
echo  VERTEXA - Public Mode (ngrok)
echo ========================================
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
echo.

REM --- Run ngrok tunnel helper ---
echo ========================================
echo  Starting ngrok tunnels...
echo ========================================
echo.
echo  This will:
echo   1. Create HTTPS tunnels for API and Frontend
echo   2. Auto-update .env.local
echo   3. Start the Frontend with the correct config
echo.

C:/Users/skbur/Ai_Project/venv/Scripts/python.exe tunnel_helper.py

REM --- After script exits, restore local mode ---
echo.
echo Restoring local mode in .env.local...
powershell -Command "(Get-Content '%cd%\frontend\.env.local') -replace 'VITE_API_URL=.*', 'VITE_API_URL=http://localhost:8000' | Set-Content '%cd%\frontend\.env.local'"
echo Done. Use start-all.bat for local-only mode.
pause

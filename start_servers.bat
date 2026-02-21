@echo off
echo ============================================
echo   Architectural Thesis Advisor AI - Server Start
echo ============================================
echo.

echo [1/2] Starting Backend Server (FastAPI, port 8000)...
start "Backend - FastAPI (port 8000)" cmd /k "cd /d "%~dp0backend" && call venv\Scripts\activate.bat && echo. && echo [Backend] Server starting... && python -m uvicorn app.main:app --reload --port 8000"

timeout /t 3 /nobreak > nul

echo [2/2] Starting Frontend Server (Vite, port 5173)...
start "Frontend - Vite (port 5173)" cmd /k "cd /d "%~dp0frontend" && echo. && echo [Frontend] Server starting... && npm run dev"

echo.
echo ============================================
echo   Both servers are launching!
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:5173
echo ============================================
echo.
echo Close this window anytime. Server windows will stay open.
timeout /t 5

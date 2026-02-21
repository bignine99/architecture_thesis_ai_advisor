@echo off
cd /d "%~dp0backend"
call venv\Scripts\activate
echo [Backend] Starting FastAPI server on port 8000...
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

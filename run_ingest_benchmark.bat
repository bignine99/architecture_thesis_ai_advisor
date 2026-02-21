@echo off
cd /d "%~dp0backend"
set PYTHONUTF8=1
call venv\Scripts\activate.bat
python -m app.ingest_benchmark
pause

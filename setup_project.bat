@echo off
echo Starting Project Setup...

echo.
echo Checking Python...
python --version
if errorlevel 1 goto NoPython

echo.
echo Checking Node...
node -v
if errorlevel 1 goto NoNode

echo.
echo Creating Directories...
if not exist "frontend" mkdir frontend
if not exist "backend" mkdir backend
if not exist "data" mkdir data
if not exist "docs" mkdir docs

echo.
echo Setting up Backend...
cd backend
if not exist "venv" (
    echo Creating venv...
    python -m venv venv
)
echo Activating venv and installing requirements...
call venv\Scripts\activate
pip install -r requirements.txt
cd ..

echo.
echo Setting up Frontend...
cd frontend
if exist "package.json" (
    echo Frontend already initialized.
) else (
    echo Initializing Vite React TS app...
    echo Note: You may need to press Enter or type 'y' if prompted.
    call npm create vite@latest . -- --template react-ts
    echo Installing dependencies...
    call npm install
)
cd ..

echo.
echo Setup Complete!
echo You can now run the backend with: cd backend && venv\Scripts\activate && uvicorn app.main:app --reload
echo And the frontend with: cd frontend && npm run dev
pause
exit /b 0

:NoPython
echo Python not found! Please install Python.
pause
exit /b 1

:NoNode
echo Node not found! Please install Node.js.
pause
exit /b 1

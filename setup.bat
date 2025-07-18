@echo off
echo 🚀 Starting APS Viewer Application...

REM Check if .env files exist
if not exist "backend\.env" (
    echo ❌ Backend .env file not found. Please copy backend\.env.example to backend\.env and configure it.
    pause
    exit /b 1
)

if not exist "frontend\.env" (
    echo ⚠️  Frontend .env file not found. Copying example...
    copy "frontend\.env.example" "frontend\.env"
)

REM Install dependencies if node_modules don't exist
if not exist "backend\node_modules" (
    echo 📦 Installing backend dependencies...
    cd backend
    npm install
    cd ..
)

if not exist "frontend\node_modules" (
    echo 📦 Installing frontend dependencies...
    cd frontend
    npm install
    cd ..
)

REM Create uploads directory if it doesn't exist
if not exist "backend\uploads" mkdir "backend\uploads"

echo ✅ Setup complete!
echo.
echo 🎯 Next steps:
echo 1. Configure backend\.env with your APS credentials
echo 2. Start backend: cd backend ^&^& npm start
echo 3. Start frontend: cd frontend ^&^& npm run dev
echo 4. Open http://localhost:5173 in your browser
echo.
echo 📚 For detailed setup instructions, see README.md
pause

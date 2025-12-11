#!/bin/bash

echo "🎧 Запуск AudioBook Library..."
echo ""

# Start backend in background
echo "🚀 Запуск Backend (http://localhost:8000)..."
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 3

# Start frontend
echo "🚀 Запуск Frontend (http://localhost:3000)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Приложение запущено!"
echo ""
echo "  Backend:  http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo "  Frontend: http://localhost:3000"
echo ""
echo "Для остановки нажмите Ctrl+C"
echo ""

# Wait for Ctrl+C
trap "echo ''; echo '🛑 Остановка...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT

wait


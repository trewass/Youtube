#!/bin/bash

echo "🎧 AudioBook Library - Setup Script"
echo "===================================="
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 не найден. Установите Python 3.11+"
    exit 1
fi

echo "✅ Python найден: $(python3 --version)"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не найден. Установите Node.js 18+"
    exit 1
fi

echo "✅ Node.js найден: $(node --version)"

# Check ffmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo "⚠️  ffmpeg не найден. Установите ffmpeg для конвертации аудио:"
    echo "   macOS: brew install ffmpeg"
    echo "   Ubuntu: sudo apt install ffmpeg"
else
    echo "✅ ffmpeg найден"
fi

echo ""
echo "📦 Установка зависимостей Backend..."
cd backend

# Create virtual environment
python3 -m venv venv

# Activate and install
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo ""
echo "✅ Backend зависимости установлены"

cd ..

echo ""
echo "📦 Установка зависимостей Frontend..."
cd frontend

npm install

echo ""
echo "✅ Frontend зависимости установлены"

cd ..

# Create .env files if they don't exist
if [ ! -f "backend/.env" ]; then
    echo ""
    echo "📝 Создание .env файла..."
    cp backend/.env.example backend/.env
    echo "⚠️  Не забудьте настроить OPENAI_API_KEY в backend/.env"
fi

if [ ! -f "frontend/.env" ]; then
    cp frontend/.env.example frontend/.env
fi

echo ""
echo "✅ Установка завершена!"
echo ""
echo "Для запуска приложения:"
echo "  Backend:  cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo "  Frontend: cd frontend && npm run dev"
echo ""
echo "Или используйте: ./start.sh"


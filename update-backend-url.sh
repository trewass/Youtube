#!/bin/bash

# Скрипт для быстрого обновления URL бэкенда

if [ -z "$1" ]; then
    echo "❌ Ошибка: URL не указан!"
    echo ""
    echo "Использование:"
    echo "  ./update-backend-url.sh https://your-backend.up.railway.app"
    exit 1
fi

BACKEND_URL="$1"

echo "🔧 Обновление backend URL..."
echo ""

# Обновляем .env.production
cat > frontend/.env.production << ENVFILE
# Production API URL
VITE_API_URL=$BACKEND_URL
ENVFILE

echo "✅ Обновлен frontend/.env.production"
echo "   URL: $BACKEND_URL"
echo ""

# Коммитим и пушим
git add frontend/.env.production
git commit -m "Update backend URL to Railway deployment"
git push origin main

echo ""
echo "✅ Изменения запушены в GitHub!"
echo "🚀 Vercel автоматически передеплоит frontend"
echo ""
echo "📝 Следующие шаги:"
echo "   1. Добавь в Railway Variables:"
echo "      CORS_ORIGINS=https://твой-vercel-url.vercel.app"
echo "   2. Открой Vercel URL на iPhone"
echo "   3. Добавь на домашний экран!"
echo ""

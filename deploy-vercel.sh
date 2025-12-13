#!/bin/bash

# Vercel Deployment Script
# Триггерит новый деплой на Vercel

echo "🚀 Triggering Vercel Deployment..."

# Проверяем что мы в правильной директории
if [ ! -d "frontend" ]; then
    echo "❌ Error: frontend directory not found"
    echo "Please run this script from the project root"
    exit 1
fi

# Проверяем что все изменения закоммичены
if [[ -n $(git status -s) ]]; then
    echo "⚠️  Warning: You have uncommitted changes"
    git status -s
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Показываем последние коммиты
echo ""
echo "📝 Latest commits:"
git log --oneline -3

# Триггерим пустой коммит для форсирования деплоя
echo ""
echo "Creating trigger commit..."
git commit --allow-empty -m "chore: trigger Vercel deployment [$(date '+%Y-%m-%d %H:%M:%S')]"

# Пушим в origin/main
echo ""
echo "Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Deployment triggered!"
echo ""
echo "🔗 Check status at: https://vercel.com/dashboard"
echo "   Your project deployments will update in ~30 seconds"
echo ""
echo "⏱️  Build usually takes 2-3 minutes"
echo "💡 Tip: You can also redeploy from Vercel Dashboard → Deployments → ... → Redeploy"

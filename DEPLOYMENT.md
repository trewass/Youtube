# 🚀 Деплой на Vercel + Railway

Это приложение состоит из двух частей:
- **Frontend** (React + Vite) → развертывается на **Vercel**
- **Backend** (FastAPI + Python) → развертывается на **Railway**

## 📦 Часть 1: Деплой Backend на Railway

### Шаг 1: Создание проекта на Railway

1. Перейди на [railway.app](https://railway.app)
2. Зарегистрируйся через GitHub
3. Нажми **"New Project"**
4. Выбери **"Deploy from GitHub repo"**
5. Выбери свой репозиторий **Youtube-mp3**
6. Railway автоматически определит Python проект

### Шаг 2: Настройка переменных окружения

В Railway перейди в Settings → Variables и добавь:

```bash
# Database (Railway предоставит PostgreSQL, но пока используем SQLite)
DATABASE_URL=sqlite:///./audiobooks.db

# OpenAI API
OPENAI_API_KEY=твой-ключ-openai

# Storage paths
AUDIO_STORAGE_PATH=./storage/audio
TEMP_STORAGE_PATH=./storage/temp

# Audio settings
AUDIO_FORMAT=mp3
AUDIO_QUALITY=192

# Python
PYTHONUNBUFFERED=1
```

### Шаг 3: Настройка Root Directory

В Railway Settings → Build:
- **Root Directory**: `/backend`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Шаг 4: Деплой

1. Railway автоматически начнет деплой
2. Дождись завершения (2-3 минуты)
3. Скопируй URL твоего бэкенда (например: `https://your-app.up.railway.app`)

---

## 🌐 Часть 2: Деплой Frontend на Vercel

### Шаг 1: Обновление API URL

Открой файл `/frontend/src/lib/api.ts` и замени:

```typescript
const API_URL = 'https://your-backend-url.up.railway.app/api'
```

Вместо `your-backend-url` подставь URL из Railway.

### Шаг 2: Обновление vercel.json

Открой `/vercel.json` и замени URL бэкенда:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-backend-url.up.railway.app/api/:path*"
    }
  ]
}
```

### Шаг 3: Деплой на Vercel

**Вариант A: Через GitHub (рекомендуется)**

1. Запуш код в GitHub:
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git branch -M main
   git remote add origin https://github.com/твой-username/Youtube-mp3.git
   git push -u origin main
   ```

2. Перейди на [vercel.com](https://vercel.com)
3. Зарегистрируйся через GitHub
4. Нажми **"Add New Project"**
5. Выбери свой репозиторий **Youtube-mp3**
6. Настройки проекта:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

7. Нажми **"Deploy"**
8. Дождись завершения (1-2 минуты)

**Вариант B: Через Vercel CLI**

```bash
# Установка Vercel CLI
npm install -g vercel

# Деплой
cd /Users/aleksandrkoza/Projects/Youtube-mp3
vercel

# При первом запуске ответь на вопросы:
# Set up and deploy? [Y/n]: Y
# Which scope? Выбери свой аккаунт
# Link to existing project? [y/N]: N
# What's your project's name? youtube-audiobooks
# In which directory is your code located? ./frontend
# Want to override settings? [y/N]: y
# Build Command: npm run build
# Output Directory: dist
# Development Command: npm run dev

# После успешного деплоя получишь URL
```

---

## ✅ Проверка

### Backend (Railway)
Открой: `https://your-backend-url.up.railway.app/health`

Должен вернуться:
```json
{"status": "ok"}
```

### Frontend (Vercel)
Открой: `https://your-app.vercel.app`

Приложение должно загрузиться и работать!

---

## 🔧 Настройка домена (опционально)

### Для Vercel (Frontend)
1. В Vercel → Settings → Domains
2. Добавь свой домен
3. Настрой DNS записи

### Для Railway (Backend)
1. В Railway → Settings → Networking
2. Добавь Custom Domain
3. Настрой DNS записи

---

## 📝 После деплоя

### Обновление CORS на бэкенде

В `backend/app/main.py` обнови CORS:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-app.vercel.app",  # Твой Vercel URL
        "http://localhost:5173",        # Для локальной разработки
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Закоммить и запушить изменения - Railway автоматически передеплоит.

---

## 🎉 Готово!

Твое приложение теперь доступно онлайн:
- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-backend-url.up.railway.app

---

## 🐛 Troubleshooting

### Backend не работает
- Проверь логи в Railway Dashboard
- Убедись что все переменные окружения установлены
- Проверь что Root Directory = `/backend`

### Frontend не подключается к API
- Проверь что API URL правильный в `frontend/src/lib/api.ts`
- Проверь CORS настройки на бэкенде
- Открой Developer Tools → Network и посмотри ошибки

### База данных
- SQLite будет работать, но данные будут сбрасываться при рестарте
- Для production рекомендуется PostgreSQL (Railway предоставляет бесплатно)
- Инструкция по миграции на PostgreSQL отдельно

---

## 💡 Рекомендации для Production

1. **База данных**: Перейти на PostgreSQL
2. **Файловое хранилище**: Использовать S3 или Cloudflare R2
3. **CORS**: Указать конкретные домены
4. **Environment Variables**: Хранить ключи в безопасности
5. **Мониторинг**: Настроить логирование и алерты

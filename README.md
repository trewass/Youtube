# AudioBook Library - YouTube to Audio Converter

Приложение для конвертации видео-аудиокниг с YouTube в удобную аудио библиотеку с AI-поддержкой.

## Возможности

- 📚 Парсинг YouTube каналов и плейлистов
- 🎵 Автоматическая конвертация видео в аудио формат
- 📱 Работа оффлайн на мобильных устройствах (PWA)
- 📝 Система заметок к аудиокнигам
- 🤖 AI-ассистент для обсуждения и анализа текстов
- 🎨 Организация по авторам и плейлистам
- 📖 Автоматическая генерация описаний книг

## Технологический стек

### Backend
- Python 3.11+
- FastAPI - веб-фреймворк
- yt-dlp - скачивание с YouTube
- ffmpeg - конвертация аудио
- SQLAlchemy - ORM
- PostgreSQL - база данных

### Frontend
- React 18
- TypeScript
- PWA (Progressive Web App)
- TailwindCSS - стилизация

### AI
- OpenAI API для генерации описаний и обсуждений

## Установка

### Требования
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- ffmpeg

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend
```bash
cd frontend
npm install
```

## Конфигурация

Создайте `.env` файл в корне проекта:
```
DATABASE_URL=postgresql://user:password@localhost/audiobooks
OPENAI_API_KEY=your_openai_api_key
YOUTUBE_COOKIE_FILE=path/to/cookies.txt  # опционально
AUDIO_STORAGE_PATH=./storage/audio
```

## Запуск

### Development
```bash
# Backend
cd backend
uvicorn app.main:app --reload

# Frontend
cd frontend
npm run dev
```

### Production
```bash
# Backend
cd backend
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker

# Frontend
cd frontend
npm run build
npm run preview
```

## Использование

1. Откройте приложение в браузере
2. Добавьте ссылку на YouTube канал
3. Приложение автоматически загрузит все плейлисты
4. Выберите плейлист для скачивания
5. Аудиофайлы будут доступны оффлайн
6. Используйте AI-ассистента для анализа текстов

## Структура проекта

```
Youtube-mp3/
├── backend/              # Python FastAPI backend
│   ├── app/
│   │   ├── api/         # API endpoints
│   │   ├── core/        # Конфигурация
│   │   ├── models/      # Database models
│   │   ├── services/    # Бизнес-логика
│   │   └── main.py      # Entry point
│   └── requirements.txt
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/  # React компоненты
│   │   ├── pages/       # Страницы
│   │   ├── services/    # API клиенты
│   │   └── App.tsx
│   └── package.json
└── storage/             # Файловое хранилище
    └── audio/           # Аудиофайлы
```

## License

MIT



# 🏗️ Архитектура проекта

## Общая структура

```
Youtube-mp3/
├── backend/              # Python FastAPI сервер
│   ├── app/
│   │   ├── api/         # API endpoints (роутеры)
│   │   ├── core/        # Конфигурация, database
│   │   ├── models/      # SQLAlchemy модели
│   │   ├── services/    # Бизнес-логика
│   │   └── main.py      # Точка входа
│   └── requirements.txt
│
├── frontend/            # React + TypeScript
│   ├── src/
│   │   ├── components/  # React компоненты
│   │   ├── pages/       # Страницы приложения
│   │   ├── lib/         # API клиент, утилиты
│   │   └── App.tsx      # Главный компонент
│   └── package.json
│
└── storage/             # Файловое хранилище
    ├── audio/           # Скачанные аудиофайлы
    └── temp/            # Временные файлы
```

## Backend (Python FastAPI)

### Слои архитектуры

```
┌─────────────────────────────────────┐
│         API Layer (Routes)          │
│    channels / playlists / notes     │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Service Layer (Logic)          │
│  youtube_service / ai_service       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Data Layer (Models)            │
│   SQLAlchemy ORM / Database         │
└─────────────────────────────────────┘
```

### Компоненты Backend

#### 1. API Endpoints (`app/api/`)

**channels.py**
- `POST /api/channels/` - Добавление канала
- `GET /api/channels/` - Список каналов
- `GET /api/channels/{id}` - Информация о канале
- `GET /api/channels/{id}/playlists` - Плейлисты канала
- `DELETE /api/channels/{id}` - Удаление канала

**playlists.py**
- `GET /api/playlists/` - Все плейлисты
- `GET /api/playlists/{id}` - Конкретный плейлист
- `POST /api/playlists/{id}/sync` - Синхронизация видео
- `GET /api/playlists/{id}/audiobooks` - Аудиокниги плейлиста
- `DELETE /api/playlists/{id}` - Удаление

**audiobooks.py**
- `GET /api/audiobooks/` - Список аудиокниг
- `GET /api/audiobooks/{id}` - Конкретная аудиокнига
- `POST /api/audiobooks/{id}/download` - Скачивание
- `POST /api/audiobooks/{id}/generate-summary` - Генерация описания
- `DELETE /api/audiobooks/{id}` - Удаление

**notes.py**
- `POST /api/notes/` - Создание заметки
- `GET /api/notes/` - Список заметок
- `GET /api/notes/{id}` - Конкретная заметка
- `PUT /api/notes/{id}` - Обновление
- `DELETE /api/notes/{id}` - Удаление

**ai_chat.py**
- `POST /api/ai/discuss` - Обсуждение с AI
- `GET /api/ai/discussion/{note_id}` - История обсуждения

#### 2. Services (`app/services/`)

**youtube_service.py**
- Работа с yt-dlp
- Парсинг каналов и плейлистов
- Скачивание и конвертация видео
- Извлечение метаданных

**ai_service.py**
- Интеграция с OpenAI API
- Генерация описаний книг
- Обсуждение цитат
- Извлечение автора из названия

#### 3. Models (`app/models/`)

**Схема базы данных:**

```sql
Channel
├─ id (PK)
├─ youtube_id (unique)
├─ title
├─ description
├─ thumbnail_url
└─ channel_url

Playlist
├─ id (PK)
├─ youtube_id (unique)
├─ title
├─ description
├─ author
├─ channel_id (FK → Channel)
└─ thumbnail_url

Audiobook
├─ id (PK)
├─ youtube_id (unique)
├─ title
├─ description
├─ ai_summary
├─ audio_file_path
├─ duration
├─ is_downloaded
├─ is_converted
├─ download_progress
└─ playlist_id (FK → Playlist)

Note
├─ id (PK)
├─ content
├─ quote
├─ timestamp
├─ ai_discussion (JSON)
└─ audiobook_id (FK → Audiobook)
```

**Связи:**
- Channel 1:N Playlist
- Playlist 1:N Audiobook
- Audiobook 1:N Note

#### 4. Core (`app/core/`)

**config.py**
- Настройки приложения
- Переменные окружения
- Пути к файлам

**database.py**
- Подключение к БД
- Session management
- Dependency injection

### Потоки данных Backend

#### Добавление канала
```
1. User → POST /api/channels/ {"url": "..."}
2. youtube_service.get_channel_info(url)
3. Channel → Database
4. youtube_service.get_channel_playlists(url)
5. For each playlist:
   - ai_service.extract_author(title)
   - Playlist → Database
6. Return Channel + Playlists
```

#### Скачивание аудиокниги
```
1. User → POST /api/audiobooks/{id}/download
2. Background Task:
   - youtube_service.download_audio(url, path)
   - ffmpeg converts to MP3
   - Update Audiobook.audio_file_path
   - ai_service.generate_summary(title, desc)
   - Update Audiobook.ai_summary
3. Return download started
```

#### AI обсуждение
```
1. User → POST /api/ai/discuss {quote, context, history}
2. ai_service.discuss_quote()
   - Build OpenAI messages
   - Add history if exists
   - Call GPT-4
3. Update Note.ai_discussion (JSON)
4. Return AI response + updated history
```

## Frontend (React + TypeScript)

### Архитектура компонентов

```
App
├── Router
│   ├── Layout (Header + Nav)
│   │   ├── HomePage
│   │   ├── ChannelsPage
│   │   ├── PlaylistsPage
│   │   ├── AudiobooksPage
│   │   └── AudiobookDetailPage
│   │       ├── AudioPlayer
│   │       ├── NotesList
│   │       └── AIChat
```

### Структура frontend

#### 1. Pages (`src/pages/`)

**HomePage.tsx**
- Приветственная страница
- Описание функций
- Инструкции

**ChannelsPage.tsx**
- Список каналов
- Форма добавления канала
- Управление каналами

**PlaylistsPage.tsx**
- Плейлисты выбранного канала
- Синхронизация плейлистов
- Навигация к аудиокнигам

**AudiobooksPage.tsx**
- Список аудиокниг плейлиста
- Скачивание аудио
- Прогресс скачивания

**AudiobookDetailPage.tsx**
- Аудио плеер
- Список заметок
- AI чат
- Создание заметок

#### 2. Components (`src/components/`)

**Layout.tsx**
- Общий макет приложения
- Header с названием
- Bottom navigation (mobile-first)

#### 3. API Client (`src/lib/api.ts`)

**Сервисы:**
- `channelsApi` - работа с каналами
- `playlistsApi` - плейлисты
- `audiobooksApi` - аудиокниги
- `notesApi` - заметки
- `aiApi` - AI функции

**Типизация:**
- TypeScript интерфейсы для всех моделей
- Типобезопасные API вызовы
- Автоматическая валидация

### Управление состоянием

```
Component State (useState)
├── Local UI state
├── Forms data
└── Loading states

API State
├── Server data fetching
├── Caching
└── Optimistic updates

PWA State
├── Service Worker
├── Cache Storage
└── Offline mode
```

### PWA Features

#### Service Worker
- Кеширование статики (JS, CSS, HTML)
- Кеширование API ответов
- Кеширование аудиофайлов
- Offline fallback

#### Manifest
- Название и иконки
- Цвета темы
- Display mode (standalone)
- Установка на домашний экран

## Технологический стек

### Backend
| Технология | Версия | Назначение |
|------------|--------|------------|
| Python | 3.11+ | Язык программирования |
| FastAPI | 0.109+ | Web framework |
| SQLAlchemy | 2.0+ | ORM |
| yt-dlp | latest | YouTube парсинг |
| OpenAI API | 1.10+ | AI функции |
| FFmpeg | latest | Аудио конвертация |

### Frontend
| Технология | Версия | Назначение |
|------------|--------|------------|
| React | 18+ | UI фреймворк |
| TypeScript | 5.3+ | Типизация |
| Vite | 5+ | Build tool |
| TailwindCSS | 3+ | Стилизация |
| Axios | 1.6+ | HTTP клиент |
| Vite PWA | 0.17+ | PWA поддержка |

## Производительность

### Backend оптимизации
- **Async/Await** - асинхронная обработка
- **Background Tasks** - фоновые задачи для скачивания
- **Connection Pooling** - пул соединений к БД
- **Caching** - кеширование метаданных

### Frontend оптимизации
- **Code Splitting** - разделение бандла
- **Lazy Loading** - отложенная загрузка компонентов
- **Service Worker** - кеширование ресурсов
- **Optimistic UI** - оптимистичные обновления

### Хранилище
- **Структурированное хранение** - по плейлистам
- **Эффективные форматы** - MP3 с оптимальным битрейтом
- **Очистка** - удаление временных файлов

## Безопасность

### API Security
- CORS настройки
- Валидация входных данных (Pydantic)
- Обработка ошибок
- Rate limiting (планируется)

### Data Security
- Локальное хранение
- Безопасное хранение API ключей
- Нет отправки персональных данных

## Расширяемость

### Добавление новых функций

**Новый API endpoint:**
```python
# 1. Создать router в app/api/
# 2. Определить Pydantic модели
# 3. Добавить бизнес-логику
# 4. Зарегистрировать в main.py
```

**Новая страница:**
```typescript
// 1. Создать компонент в src/pages/
// 2. Добавить route в App.tsx
// 3. Создать API функции если нужно
// 4. Добавить навигацию
```

### Масштабирование

**Horizontal scaling:**
- Load balancer перед backend
- Несколько инстансов FastAPI
- Shared database
- Shared file storage (S3)

**Vertical scaling:**
- Больше CPU для конвертации
- Больше RAM для кеширования
- Быстрый SSD для хранилища

## Мониторинг и отладка

### Backend
- Console логи (uvicorn)
- FastAPI /docs - Swagger UI
- Database inspection

### Frontend
- Browser DevTools
- React DevTools
- Network tab для API
- Console для ошибок

### Production
- Logging framework (планируется)
- Error tracking (Sentry)
- Analytics (опционально)
- Health checks



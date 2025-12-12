from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.api import channels, playlists, audiobooks, notes, ai_chat, stream
from app.core.config import settings
from app.core.database import engine
from app.models import Base

# Создание таблиц
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AudioBook Library API",
    description="API для конвертации YouTube видео в аудиокниги",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене указать конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files (audio storage)
if os.path.exists(settings.AUDIO_STORAGE_PATH):
    app.mount("/audio", StaticFiles(directory=settings.AUDIO_STORAGE_PATH), name="audio")

# API Routes
app.include_router(channels.router, prefix="/api/channels", tags=["Channels"])
app.include_router(playlists.router, prefix="/api/playlists", tags=["Playlists"])
app.include_router(audiobooks.router, prefix="/api/audiobooks", tags=["Audiobooks"])
app.include_router(notes.router, prefix="/api/notes", tags=["Notes"])
app.include_router(ai_chat.router, prefix="/api/ai", tags=["AI"])
app.include_router(stream.router, prefix="/api", tags=["Stream"])

@app.get("/")
async def root():
    return {
        "message": "AudioBook Library API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/api/health")
async def api_health():
    import datetime
    return {
        "status": "ok", 
        "service": "audiobook-api",
        "version": "1.0.1",
        "deployed_at": datetime.datetime.now().isoformat(),
        "build": "railway-auto-deploy"
    }


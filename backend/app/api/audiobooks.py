from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
import os
from datetime import datetime

from app.core.database import get_db
from app.models.audiobook import Audiobook
from app.services.youtube_service import youtube_service
from app.services.ai_service import ai_service
from app.core.config import settings

router = APIRouter()


class AudiobookResponse(BaseModel):
    id: int
    youtube_id: str
    title: str
    description: str | None
    ai_summary: str | None
    thumbnail_url: str | None
    is_downloaded: bool
    is_converted: bool
    download_progress: float
    duration: float | None
    audio_file_path: str | None
    
    class Config:
        from_attributes = True


def download_and_convert(audiobook_id: int, db: Session):
    """Background task для скачивания и конвертации"""
    audiobook = db.query(Audiobook).filter(Audiobook.id == audiobook_id).first()
    if not audiobook:
        return
    
    try:
        # Создаем директорию для плейлиста
        playlist_dir = os.path.join(
            settings.AUDIO_STORAGE_PATH,
            f"playlist_{audiobook.playlist_id}"
        )
        os.makedirs(playlist_dir, exist_ok=True)
        
        # Безопасное имя файла
        safe_filename = "".join(c for c in audiobook.title if c.isalnum() or c in (' ', '-', '_')).rstrip()
        output_path = os.path.join(playlist_dir, f"{safe_filename}_{audiobook.youtube_id}")
        
        # Скачиваем и конвертируем
        result = youtube_service.download_audio(audiobook.video_url, output_path)
        
        # Конвертируем абсолютный путь в URL для API
        # Из: /full/path/storage/audio/playlist_X/file.mp3
        # В: /audio/playlist_X/file.mp3
        file_path = result['file_path']
        if settings.AUDIO_STORAGE_PATH in file_path:
            # Получаем относительный путь от storage/audio
            relative_path = file_path.replace(settings.AUDIO_STORAGE_PATH, '').lstrip('/')
            audiobook.audio_file_path = f"/audio/{relative_path}"
        else:
            audiobook.audio_file_path = file_path
        
        audiobook.duration = result.get('duration')
        audiobook.is_downloaded = True
        audiobook.is_converted = True
        audiobook.download_progress = 100.0
        
        if os.path.exists(result['file_path']):
            audiobook.file_size = os.path.getsize(result['file_path'])
        
        # Генерируем AI описание
        if not audiobook.ai_summary:
            summary = ai_service.generate_book_summary(
                audiobook.title,
                audiobook.description or ""
            )
            if summary:
                audiobook.ai_summary = summary
        
        db.commit()
        
    except Exception as e:
        print(f"Error downloading audiobook {audiobook_id}: {e}")
        audiobook.download_progress = 0.0
        audiobook.is_downloaded = False
        db.commit()


@router.get("/", response_model=List[AudiobookResponse])
async def get_audiobooks(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Получение всех аудиокниг"""
    audiobooks = db.query(Audiobook).offset(skip).limit(limit).all()
    return audiobooks


@router.get("/{audiobook_id}", response_model=AudiobookResponse)
async def get_audiobook(audiobook_id: int, db: Session = Depends(get_db)):
    """Получение информации об аудиокниге"""
    audiobook = db.query(Audiobook).filter(Audiobook.id == audiobook_id).first()
    if not audiobook:
        raise HTTPException(status_code=404, detail="Audiobook not found")
    return audiobook


@router.post("/{audiobook_id}/download")
async def download_audiobook(
    audiobook_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Скачивание и конвертация аудиокниги"""
    audiobook = db.query(Audiobook).filter(Audiobook.id == audiobook_id).first()
    if not audiobook:
        raise HTTPException(status_code=404, detail="Audiobook not found")
    
    if audiobook.is_downloaded:
        return {"message": "Already downloaded", "audiobook": audiobook}
    
    # Запускаем скачивание в фоне
    audiobook.download_progress = 1.0
    db.commit()
    
    background_tasks.add_task(download_and_convert, audiobook_id, db)
    
    return {"message": "Download started", "audiobook_id": audiobook_id}


@router.post("/{audiobook_id}/generate-summary")
async def generate_summary(audiobook_id: int, db: Session = Depends(get_db)):
    """Генерация AI описания для аудиокниги"""
    audiobook = db.query(Audiobook).filter(Audiobook.id == audiobook_id).first()
    if not audiobook:
        raise HTTPException(status_code=404, detail="Audiobook not found")
    
    summary = ai_service.generate_book_summary(
        audiobook.title,
        audiobook.description or ""
    )
    
    if summary:
        audiobook.ai_summary = summary
        db.commit()
        db.refresh(audiobook)
    
    return {"summary": summary}


@router.delete("/{audiobook_id}")
async def delete_audiobook(audiobook_id: int, db: Session = Depends(get_db)):
    """Удаление аудиокниги"""
    audiobook = db.query(Audiobook).filter(Audiobook.id == audiobook_id).first()
    if not audiobook:
        raise HTTPException(status_code=404, detail="Audiobook not found")
    
    # Удаляем файл если он существует
    if audiobook.audio_file_path and os.path.exists(audiobook.audio_file_path):
        try:
            os.remove(audiobook.audio_file_path)
        except Exception as e:
            print(f"Error deleting file: {e}")
    
    db.delete(audiobook)
    db.commit()
    
    return {"message": "Audiobook deleted successfully"}


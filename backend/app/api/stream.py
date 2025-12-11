from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse, StreamingResponse
from sqlalchemy.orm import Session
import yt_dlp

from app.core.database import get_db
from app.models.audiobook import Audiobook

router = APIRouter()


@router.get("/stream/{audiobook_id}")
async def stream_audio(audiobook_id: int, db: Session = Depends(get_db)):
    """
    Получить stream URL для аудио без скачивания файла.
    Возвращает redirect на прямой YouTube audio stream.
    """
    # Получаем audiobook
    audiobook = db.query(Audiobook).filter(Audiobook.id == audiobook_id).first()
    if not audiobook:
        raise HTTPException(status_code=404, detail="Audiobook not found")
    
    try:
        # Опции для получения stream URL без скачивания
        ydl_opts = {
            'format': 'bestaudio/best',
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,  # Нужна полная информация
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Получаем информацию о видео
            info = ydl.extract_info(audiobook.video_url, download=False)
            
            # Получаем прямой URL на аудио stream
            if 'url' in info:
                stream_url = info['url']
            elif 'formats' in info:
                # Находим лучший аудио формат
                audio_formats = [f for f in info['formats'] if f.get('acodec') != 'none']
                if audio_formats:
                    # Берём формат с лучшим битрейтом
                    best_audio = max(audio_formats, key=lambda f: f.get('abr', 0) or 0)
                    stream_url = best_audio['url']
                else:
                    raise HTTPException(status_code=404, detail="No audio stream found")
            else:
                raise HTTPException(status_code=404, detail="Stream URL not available")
            
            # Возвращаем redirect на stream URL
            # YouTube stream URLs временные, действуют несколько часов
            return RedirectResponse(url=stream_url)
            
    except Exception as e:
        print(f"Error getting stream URL: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get stream URL: {str(e)}"
        )


@router.get("/stream-info/{audiobook_id}")
async def get_stream_info(audiobook_id: int, db: Session = Depends(get_db)):
    """
    Получить информацию о stream (для debugging).
    Возвращает доступные форматы и URLs.
    """
    audiobook = db.query(Audiobook).filter(Audiobook.id == audiobook_id).first()
    if not audiobook:
        raise HTTPException(status_code=404, detail="Audiobook not found")
    
    try:
        ydl_opts = {
            'format': 'bestaudio/best',
            'quiet': True,
            'no_warnings': True,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(audiobook.video_url, download=False)
            
            # Возвращаем полезную информацию
            return {
                "title": info.get('title'),
                "duration": info.get('duration'),
                "formats_count": len(info.get('formats', [])),
                "has_direct_url": 'url' in info,
                "audio_formats": [
                    {
                        "format_id": f.get('format_id'),
                        "ext": f.get('ext'),
                        "abr": f.get('abr'),
                        "filesize": f.get('filesize'),
                    }
                    for f in info.get('formats', [])
                    if f.get('acodec') != 'none'
                ][:5]  # Показываем только топ-5
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from app.core.database import get_db
from app.models.playlist import Playlist
from app.models.audiobook import Audiobook
from app.services.youtube_service import youtube_service
from app.services.ai_service import ai_service

router = APIRouter()


class PlaylistResponse(BaseModel):
    id: int
    youtube_id: str
    title: str
    description: str | None
    thumbnail_url: str | None
    author: str | None
    channel_id: int
    
    class Config:
        from_attributes = True


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
    
    class Config:
        from_attributes = True


@router.get("/", response_model=List[PlaylistResponse])
async def get_playlists(db: Session = Depends(get_db)):
    """Получение всех плейлистов"""
    playlists = db.query(Playlist).all()
    return playlists


@router.get("/{playlist_id}", response_model=PlaylistResponse)
async def get_playlist(playlist_id: int, db: Session = Depends(get_db)):
    """Получение информации о плейлисте"""
    playlist = db.query(Playlist).filter(Playlist.id == playlist_id).first()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return playlist


@router.post("/{playlist_id}/sync")
async def sync_playlist(
    playlist_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Синхронизация плейлиста - загрузка информации о всех видео"""
    playlist = db.query(Playlist).filter(Playlist.id == playlist_id).first()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    try:
        # Получаем все видео из плейлиста
        videos = youtube_service.get_playlist_videos(playlist.playlist_url)
        
        for video_data in videos:
            # Проверяем, не существует ли уже такое видео
            existing_audiobook = db.query(Audiobook).filter(
                Audiobook.youtube_id == video_data['youtube_id']
            ).first()
            
            if not existing_audiobook:
                audiobook = Audiobook(
                    youtube_id=video_data['youtube_id'],
                    title=video_data['title'],
                    description=video_data.get('description'),
                    thumbnail_url=video_data.get('thumbnail_url'),
                    video_url=video_data['video_url'],
                    duration=video_data.get('duration'),
                    playlist_id=playlist.id,
                    is_downloaded=False,
                    is_converted=False,
                )
                db.add(audiobook)
        
        db.commit()
        
        return {"message": f"Synced {len(videos)} videos", "count": len(videos)}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error syncing playlist: {str(e)}")


@router.get("/{playlist_id}/audiobooks", response_model=List[AudiobookResponse])
async def get_playlist_audiobooks(playlist_id: int, db: Session = Depends(get_db)):
    """Получение всех аудиокниг плейлиста"""
    playlist = db.query(Playlist).filter(Playlist.id == playlist_id).first()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    return playlist.audiobooks


@router.delete("/{playlist_id}")
async def delete_playlist(playlist_id: int, db: Session = Depends(get_db)):
    """Удаление плейлиста"""
    playlist = db.query(Playlist).filter(Playlist.id == playlist_id).first()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    db.delete(playlist)
    db.commit()
    
    return {"message": "Playlist deleted successfully"}



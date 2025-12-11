from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from app.core.database import get_db
from app.models.channel import Channel
from app.models.playlist import Playlist
from app.services.youtube_service import youtube_service
from app.services.ai_service import ai_service

router = APIRouter()


class ChannelCreate(BaseModel):
    url: str


class ChannelResponse(BaseModel):
    id: int
    youtube_id: str
    title: str
    description: str | None
    thumbnail_url: str | None
    channel_url: str
    
    class Config:
        from_attributes = True


class PlaylistResponse(BaseModel):
    id: int
    youtube_id: str
    title: str
    description: str | None
    thumbnail_url: str | None
    author: str | None
    
    class Config:
        from_attributes = True


@router.post("/", response_model=ChannelResponse)
async def add_channel(channel_data: ChannelCreate, db: Session = Depends(get_db)):
    """Добавление YouTube канала и парсинг его плейлистов"""
    try:
        print(f"[DEBUG] Получен запрос на добавление канала: {channel_data.url}")
        
        # Получаем информацию о канале
        print("[DEBUG] Получение информации о канале...")
        channel_info = youtube_service.get_channel_info(channel_data.url)
        print(f"[DEBUG] Канал найден: {channel_info.get('title')}")
        
        # Проверяем, не добавлен ли уже этот канал
        existing_channel = db.query(Channel).filter(
            Channel.youtube_id == channel_info['youtube_id']
        ).first()
        
        if existing_channel:
            print(f"[DEBUG] Канал уже существует: {existing_channel.title}")
            return existing_channel
        
        # Создаем канал
        channel = Channel(**channel_info)
        db.add(channel)
        db.commit()
        db.refresh(channel)
        print(f"[DEBUG] Канал создан с ID: {channel.id}")
        
        # Парсим плейлисты канала (это может занять время)
        print("[DEBUG] Парсинг плейлистов...")
        playlists_data = youtube_service.get_channel_playlists(channel_data.url)
        print(f"[DEBUG] Найдено плейлистов: {len(playlists_data)}")
        
        for idx, playlist_data in enumerate(playlists_data):
            print(f"[DEBUG] Обработка плейлиста {idx+1}/{len(playlists_data)}: {playlist_data['title']}")
            
            # Не используем AI для извлечения автора при первом добавлении
            # (можно сделать позже через отдельный endpoint)
            playlist_data['author'] = None
            playlist_data['channel_id'] = channel.id
            
            # Проверяем, не существует ли уже такой плейлист
            existing_playlist = db.query(Playlist).filter(
                Playlist.youtube_id == playlist_data['youtube_id']
            ).first()
            
            if not existing_playlist:
                playlist = Playlist(**playlist_data)
                db.add(playlist)
        
        db.commit()
        print("[DEBUG] Все плейлисты сохранены")
        
        return channel
    
    except Exception as e:
        print(f"[ERROR] Ошибка при добавлении канала: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error adding channel: {str(e)}")


@router.get("/", response_model=List[ChannelResponse])
async def get_channels(db: Session = Depends(get_db)):
    """Получение всех добавленных каналов"""
    channels = db.query(Channel).all()
    return channels


@router.get("/{channel_id}", response_model=ChannelResponse)
async def get_channel(channel_id: int, db: Session = Depends(get_db)):
    """Получение информации о канале"""
    channel = db.query(Channel).filter(Channel.id == channel_id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    return channel


@router.get("/{channel_id}/playlists", response_model=List[PlaylistResponse])
async def get_channel_playlists(channel_id: int, db: Session = Depends(get_db)):
    """Получение всех плейлистов канала"""
    channel = db.query(Channel).filter(Channel.id == channel_id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    return channel.playlists


@router.post("/{channel_id}/sync-playlists")
async def sync_channel_playlists(channel_id: int, db: Session = Depends(get_db)):
    """Принудительная синхронизация плейлистов канала"""
    channel = db.query(Channel).filter(Channel.id == channel_id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    try:
        print(f"[DEBUG] Синхронизация плейлистов для канала: {channel.title}")
        
        # Парсим плейлисты канала
        playlists_data = youtube_service.get_channel_playlists(channel.channel_url)
        print(f"[DEBUG] Найдено плейлистов: {len(playlists_data)}")
        
        added_count = 0
        for playlist_data in playlists_data:
            # Проверяем, не существует ли уже такой плейлист
            existing_playlist = db.query(Playlist).filter(
                Playlist.youtube_id == playlist_data['youtube_id']
            ).first()
            
            if not existing_playlist:
                playlist_data['author'] = None
                playlist_data['channel_id'] = channel.id
                playlist = Playlist(**playlist_data)
                db.add(playlist)
                added_count += 1
                print(f"[DEBUG] Добавлен новый плейлист: {playlist_data['title']}")
        
        db.commit()
        print(f"[DEBUG] Синхронизация завершена. Добавлено новых плейлистов: {added_count}")
        
        return {
            "message": "Playlists synced successfully",
            "total_found": len(playlists_data),
            "added": added_count
        }
    
    except Exception as e:
        print(f"[ERROR] Ошибка синхронизации плейлистов: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error syncing playlists: {str(e)}")


@router.delete("/{channel_id}")
async def delete_channel(channel_id: int, db: Session = Depends(get_db)):
    """Удаление канала"""
    channel = db.query(Channel).filter(Channel.id == channel_id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    db.delete(channel)
    db.commit()
    
    return {"message": "Channel deleted successfully"}


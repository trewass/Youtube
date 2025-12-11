from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean, Float
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class Audiobook(Base):
    __tablename__ = "audiobooks"

    id = Column(Integer, primary_key=True, index=True)
    youtube_id = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    ai_summary = Column(Text, nullable=True)  # AI-генерированное описание
    thumbnail_url = Column(String, nullable=True)
    
    # Audio file info
    audio_file_path = Column(String, nullable=True)
    duration = Column(Float, nullable=True)  # в секундах
    file_size = Column(Integer, nullable=True)  # в байтах
    
    # Status
    is_downloaded = Column(Boolean, default=False)
    is_converted = Column(Boolean, default=False)
    download_progress = Column(Float, default=0.0)  # 0-100%
    
    # Video info
    video_url = Column(String, nullable=False)
    upload_date = Column(DateTime, nullable=True)
    
    playlist_id = Column(Integer, ForeignKey("playlists.id"), nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    playlist = relationship("Playlist", back_populates="audiobooks")
    notes = relationship("Note", back_populates="audiobook", cascade="all, delete-orphan")


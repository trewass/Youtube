from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    quote = Column(Text, nullable=True)  # Цитата из аудиокниги
    timestamp = Column(Float, nullable=True)  # Временная метка в аудио (секунды)
    
    # AI conversation
    ai_discussion = Column(Text, nullable=True)  # JSON с историей обсуждения
    
    audiobook_id = Column(Integer, ForeignKey("audiobooks.id"), nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    audiobook = relationship("Audiobook", back_populates="notes")



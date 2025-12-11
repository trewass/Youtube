from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite:///./audiobooks.db"
    
    # OpenAI
    OPENAI_API_KEY: Optional[str] = None
    
    # YouTube
    YOUTUBE_COOKIE_FILE: Optional[str] = None
    
    # Storage
    AUDIO_STORAGE_PATH: str = "./storage/audio"
    TEMP_STORAGE_PATH: str = "./storage/temp"
    
    # Audio settings
    AUDIO_FORMAT: str = "mp3"
    AUDIO_QUALITY: str = "192"  # kbps
    
    # API
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "AudioBook Library"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

# Создание директорий если их нет
os.makedirs(settings.AUDIO_STORAGE_PATH, exist_ok=True)
os.makedirs(settings.TEMP_STORAGE_PATH, exist_ok=True)


import yt_dlp
import os
from typing import Dict, List, Optional
from app.core.config import settings


class YouTubeService:
    def __init__(self):
        self.ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': True,
            'ignoreerrors': True,
            'no_check_certificate': True,
            'socket_timeout': 30,
        }
        
        if settings.YOUTUBE_COOKIE_FILE and os.path.exists(settings.YOUTUBE_COOKIE_FILE):
            self.ydl_opts['cookiefile'] = settings.YOUTUBE_COOKIE_FILE

    def get_channel_info(self, channel_url: str) -> Dict:
        """Получение информации о канале"""
        print(f"[YouTube Service] Получение информации о канале: {channel_url}")
        
        ydl_opts = {
            **self.ydl_opts,
            'extract_flat': 'in_playlist',
            'playlistend': 1,  # Берем только первое видео для быстрой проверки
        }
        
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(channel_url, download=False)
                
                channel_id = info.get('channel_id') or info.get('uploader_id') or info.get('id')
                channel_title = info.get('channel') or info.get('uploader') or info.get('title', 'Unknown Channel')
                
                print(f"[YouTube Service] Канал найден: {channel_title} (ID: {channel_id})")
                
                return {
                    'youtube_id': channel_id,
                    'title': channel_title,
                    'description': info.get('description', '')[:500],  # Ограничиваем длину
                    'thumbnail_url': self._get_best_thumbnail(info.get('thumbnails', [])),
                    'channel_url': channel_url,
                }
        except Exception as e:
            print(f"[YouTube Service ERROR] Ошибка получения информации о канале: {e}")
            raise

    def get_channel_playlists(self, channel_url: str) -> List[Dict]:
        """Получение всех плейлистов канала"""
        print(f"[YouTube Service] Получение плейлистов для: {channel_url}")
        
        # Формируем URL для плейлистов канала
        if '/channel/' in channel_url:
            playlists_url = channel_url.rstrip('/') + '/playlists'
        elif '/@' in channel_url:
            playlists_url = channel_url.rstrip('/') + '/playlists'
        else:
            playlists_url = channel_url
        
        ydl_opts = {
            **self.ydl_opts,
            'extract_flat': 'in_playlist',
            'playlistend': 50,  # Ограничиваем количество плейлистов
        }
        
        playlists = []
        
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                print(f"[YouTube Service] Извлечение информации о плейлистах...")
                info = ydl.extract_info(playlists_url, download=False)
                
                # Если это список плейлистов
                if 'entries' in info and info['entries']:
                    print(f"[YouTube Service] Найдено entries: {len([e for e in info['entries'] if e])}")
                    for entry in info['entries']:
                        # Entries могут быть типа 'url' или 'playlist' - оба варианта нам подходят
                        if entry and entry.get('id'):
                            playlist_data = {
                                'youtube_id': entry.get('id'),
                                'title': entry.get('title', 'Unnamed Playlist'),
                                'description': (entry.get('description') or '')[:500],
                                'thumbnail_url': self._get_best_thumbnail(entry.get('thumbnails', [])),
                                'playlist_url': entry.get('url') or f"https://www.youtube.com/playlist?list={entry.get('id')}",
                            }
                            playlists.append(playlist_data)
                            print(f"[YouTube Service] Найден плейлист: {playlist_data['title']}")
                else:
                    print(f"[YouTube Service] Плейлисты не найдены или это не канал")
                    
        except Exception as e:
            print(f"[YouTube Service ERROR] Ошибка получения плейлистов: {e}")
            import traceback
            traceback.print_exc()
        
        print(f"[YouTube Service] Всего найдено плейлистов: {len(playlists)}")
        return playlists

    def get_playlist_videos(self, playlist_url: str) -> List[Dict]:
        """Получение всех видео из плейлиста"""
        ydl_opts = {
            **self.ydl_opts,
            'extract_flat': 'in_playlist',
        }
        
        videos = []
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(playlist_url, download=False)
            
            if 'entries' in info:
                for entry in info['entries']:
                    if entry:
                        video_data = {
                            'youtube_id': entry.get('id'),
                            'title': entry.get('title'),
                            'description': entry.get('description', ''),
                            'thumbnail_url': self._get_best_thumbnail(entry.get('thumbnails', [])),
                            'video_url': entry.get('url') or f"https://www.youtube.com/watch?v={entry.get('id')}",
                            'duration': entry.get('duration'),
                            'upload_date': entry.get('upload_date'),
                        }
                        videos.append(video_data)
        
        return videos

    def download_audio(self, video_url: str, output_path: str, progress_callback=None) -> Dict:
        """Скачивание аудио из видео"""
        ydl_opts = {
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': settings.AUDIO_FORMAT,
                'preferredquality': settings.AUDIO_QUALITY,
            }],
            'outtmpl': output_path,
            'quiet': False,
            'no_warnings': False,
        }
        
        if progress_callback:
            ydl_opts['progress_hooks'] = [progress_callback]
        
        if settings.YOUTUBE_COOKIE_FILE and os.path.exists(settings.YOUTUBE_COOKIE_FILE):
            ydl_opts['cookiefile'] = settings.YOUTUBE_COOKIE_FILE
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=True)
            
            return {
                'title': info.get('title'),
                'duration': info.get('duration'),
                'file_path': f"{output_path}.{settings.AUDIO_FORMAT}",
            }

    def _get_best_thumbnail(self, thumbnails: List[Dict]) -> Optional[str]:
        """Получение лучшего превью"""
        if not thumbnails:
            return None
        
        # Сортируем по качеству
        sorted_thumbnails = sorted(
            thumbnails,
            key=lambda x: x.get('height', 0) * x.get('width', 0),
            reverse=True
        )
        
        return sorted_thumbnails[0].get('url') if sorted_thumbnails else None


# Singleton instance
youtube_service = YouTubeService()


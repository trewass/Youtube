import axios from 'axios'

// Определяем API URL в зависимости от окружения
const getApiUrl = () => {
  // В продакшене на Vercel используем относительный путь или переменную окружения
  if (import.meta.env.PROD) {
    // Если есть переменная окружения - используем её
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL
    }
    // Иначе используем относительный путь (тот же домен)
    return ''
  }
  // В разработке используем localhost
  return import.meta.env.VITE_API_URL || 'http://localhost:8000'
}

const API_BASE_URL = getApiUrl()

console.log('API Base URL:', API_BASE_URL || 'Same origin')

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Добавляем обработчик ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error)
    if (error.response) {
      console.error('Response error:', error.response.status, error.response.data)
    } else if (error.request) {
      console.error('Request error:', error.request)
    } else {
      console.error('Error:', error.message)
    }
    return Promise.reject(error)
  }
)

// Types
export interface Channel {
  id: number
  youtube_id: string
  title: string
  description?: string
  thumbnail_url?: string
  channel_url: string
}

export interface Playlist {
  id: number
  youtube_id: string
  title: string
  description?: string
  thumbnail_url?: string
  author?: string
  channel_id: number
}

export interface Audiobook {
  id: number
  youtube_id: string
  title: string
  description?: string
  ai_summary?: string
  thumbnail_url?: string
  is_downloaded: boolean
  is_converted: boolean
  download_progress: number
  duration?: number
  audio_file_path?: string
  playlist_id: number
}

export interface Note {
  id: number
  content: string
  quote?: string
  timestamp?: number
  audiobook_id: number
  ai_discussion?: string
}

export interface ChatMessage {
  role: string
  content: string
}

// Channels API
export const channelsApi = {
  addChannel: (url: string) =>
    api.post<Channel>('/api/channels/', { url }),

  getChannels: () =>
    api.get<Channel[]>('/api/channels/'),

  getChannel: (channelId: number) =>
    api.get<Channel>(`/api/channels/${channelId}`),

  getChannelPlaylists: (channelId: number) =>
    api.get<Playlist[]>(`/api/channels/${channelId}/playlists`),

  deleteChannel: (channelId: number) =>
    api.delete(`/api/channels/${channelId}`),
}

// Playlists API
export const playlistsApi = {
  getPlaylists: () =>
    api.get<Playlist[]>('/api/playlists/'),

  getPlaylist: (playlistId: number) =>
    api.get<Playlist>(`/api/playlists/${playlistId}`),

  syncPlaylist: (playlistId: number) =>
    api.post(`/api/playlists/${playlistId}/sync`),

  getPlaylistAudiobooks: (playlistId: number) =>
    api.get<Audiobook[]>(`/api/playlists/${playlistId}/audiobooks`),

  deletePlaylist: (playlistId: number) =>
    api.delete(`/api/playlists/${playlistId}`),
}

// Audiobooks API
export const audiobooksApi = {
  getAudiobooks: (skip = 0, limit = 100) =>
    api.get<Audiobook[]>('/api/audiobooks/', { params: { skip, limit } }),

  getAudiobook: (audiobookId: number) =>
    api.get<Audiobook>(`/api/audiobooks/${audiobookId}`),

  downloadAudiobook: (audiobookId: number) =>
    api.post(`/api/audiobooks/${audiobookId}/download`),

  generateSummary: (audiobookId: number) =>
    api.post(`/api/audiobooks/${audiobookId}/generate-summary`),

  deleteAudiobook: (audiobookId: number) =>
    api.delete(`/api/audiobooks/${audiobookId}`),
}

// Notes API
export const notesApi = {
  createNote: (data: {
    content: string
    quote?: string
    timestamp?: number
    audiobook_id: number
  }) =>
    api.post<Note>('/api/notes/', data),

  getNotes: (audiobookId?: number) =>
    api.get<Note[]>('/api/notes/', { params: { audiobook_id: audiobookId } }),

  getNote: (noteId: number) =>
    api.get<Note>(`/api/notes/${noteId}`),

  updateNote: (noteId: number, data: {
    content?: string
    quote?: string
    timestamp?: number
  }) =>
    api.put<Note>(`/api/notes/${noteId}`, data),

  deleteNote: (noteId: number) =>
    api.delete(`/api/notes/${noteId}`),
}

// AI API
export const aiApi = {
  discussQuote: (data: {
    quote: string
    context?: string
    note_id?: number
    history?: ChatMessage[]
  }) =>
    api.post<{
      response: string
      history: ChatMessage[]
    }>('/api/ai/discuss', data),

  getDiscussionHistory: (noteId: number) =>
    api.get<{ history: ChatMessage[] }>(`/api/ai/discussion/${noteId}`),
}

export default api



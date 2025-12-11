import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Play, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { playlistsApi, audiobooksApi, Playlist, Audiobook } from '../lib/api'

export default function AudiobooksPage() {
  const { playlistId } = useParams<{ playlistId: string }>()
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [audiobooks, setAudiobooks] = useState<Audiobook[]>([])
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState<number | null>(null)
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<number>>(new Set())
  const navigate = useNavigate()

  const toggleDescription = (audiobookId: number) => {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(audiobookId)) {
        newSet.delete(audiobookId)
      } else {
        newSet.add(audiobookId)
      }
      return newSet
    })
  }

  useEffect(() => {
    if (playlistId) {
      loadPlaylist()
      loadAudiobooks()
    }
  }, [playlistId])

  const loadPlaylist = async () => {
    try {
      const response = await playlistsApi.getPlaylist(Number(playlistId))
      setPlaylist(response.data)
    } catch (error) {
      console.error('Error loading playlist:', error)
    }
  }

  const loadAudiobooks = async () => {
    try {
      setLoading(true)
      const response = await playlistsApi.getPlaylistAudiobooks(Number(playlistId))
      setAudiobooks(response.data)
    } catch (error) {
      console.error('Error loading audiobooks:', error)
      alert('Ошибка загрузки аудиокниг')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (audiobookId: number) => {
    try {
      setDownloading(audiobookId)
      await audiobooksApi.downloadAudiobook(audiobookId)
      alert('Скачивание начато! Это может занять некоторое время.')
      
      // Poll for status update
      const interval = setInterval(async () => {
        try {
          const response = await audiobooksApi.getAudiobook(audiobookId)
          const updated = response.data
          
          setAudiobooks(prev => 
            prev.map(ab => ab.id === audiobookId ? updated : ab)
          )
          
          if (updated.is_downloaded && updated.is_converted) {
            clearInterval(interval)
            setDownloading(null)
          }
        } catch (error) {
          console.error('Error polling status:', error)
        }
      }, 3000)
      
      // Clear interval after 5 minutes
      setTimeout(() => {
        clearInterval(interval)
        setDownloading(null)
      }, 300000)
      
    } catch (error) {
      console.error('Error downloading audiobook:', error)
      alert('Ошибка скачивания')
      setDownloading(null)
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return ''
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}ч ${minutes}м` : `${minutes}м`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/playlists/${playlist?.channel_id}`)}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="text-3xl font-bold">{playlist?.title}</h2>
          {playlist?.author && (
            <p className="text-primary-400">Автор: {playlist.author}</p>
          )}
        </div>
      </div>

      {/* Audiobooks */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-400">Загрузка аудиокниг...</p>
        </div>
      ) : audiobooks.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>Аудиокниги не найдены</p>
          <p className="text-sm mt-2">Сначала синхронизируйте плейлист</p>
        </div>
      ) : (
        <div className="space-y-4">
          {audiobooks.map((audiobook) => (
            <div key={audiobook.id} className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors">
              <div className="p-4 flex gap-4">
                {audiobook.thumbnail_url && (
                  <img
                    src={audiobook.thumbnail_url}
                    alt={audiobook.title}
                    className="w-32 h-20 rounded object-cover flex-shrink-0"
                  />
                )}
                
                <div className="flex-1 space-y-2 min-w-0">
                  <h3 className="font-semibold text-lg">{audiobook.title}</h3>
                  
                  {audiobook.ai_summary && (
                    <button
                      onClick={() => toggleDescription(audiobook.id)}
                      className="flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 transition-colors"
                    >
                      {expandedDescriptions.has(audiobook.id) ? (
                        <>
                          <ChevronUp size={16} />
                          <span>Скрыть описание</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown size={16} />
                          <span>Показать описание</span>
                        </>
                      )}
                    </button>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    {audiobook.duration && (
                      <span>{formatDuration(audiobook.duration)}</span>
                    )}
                    {audiobook.is_downloaded && (
                      <span className="text-green-500 flex items-center gap-1">
                        <CheckCircle size={16} />
                        Скачано
                      </span>
                    )}
                    {downloading === audiobook.id && (
                      <span className="text-blue-500">
                        Скачивание: {audiobook.download_progress.toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {audiobook.is_downloaded ? (
                    <button
                      onClick={() => navigate(`/audiobook/${audiobook.id}`)}
                      className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
                    >
                      <Play size={18} />
                      Открыть
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDownload(audiobook.id)}
                      disabled={downloading === audiobook.id}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                    >
                      <Download size={18} />
                      {downloading === audiobook.id ? 'Скачивание...' : 'Скачать'}
                    </button>
                  )}
                </div>
              </div>
              
              {/* Collapsible description */}
              {audiobook.ai_summary && expandedDescriptions.has(audiobook.id) && (
                <div className="px-4 pb-4 pt-0">
                  <div className="bg-gray-900/50 rounded-lg p-4 border-l-4 border-primary-500">
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {audiobook.ai_summary}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw, BookOpen, Trash2 } from 'lucide-react'
import { channelsApi, playlistsApi, Channel, Playlist } from '../lib/api'

export default function PlaylistsPage() {
  const { channelId } = useParams<{ channelId: string }>()
  const [channel, setChannel] = useState<Channel | null>(null)
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState<number | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (channelId) {
      loadChannel()
      loadPlaylists()
    }
  }, [channelId])

  const loadChannel = async () => {
    try {
      const response = await channelsApi.getChannel(Number(channelId))
      setChannel(response.data)
    } catch (error) {
      console.error('Error loading channel:', error)
    }
  }

  const loadPlaylists = async () => {
    try {
      setLoading(true)
      const response = await channelsApi.getChannelPlaylists(Number(channelId))
      setPlaylists(response.data)
    } catch (error) {
      console.error('Error loading playlists:', error)
      alert('Ошибка загрузки плейлистов')
    } finally {
      setLoading(false)
    }
  }

  const handleSyncPlaylist = async (playlistId: number) => {
    try {
      setSyncing(playlistId)
      await playlistsApi.syncPlaylist(playlistId)
      alert('Плейлист синхронизирован!')
    } catch (error) {
      console.error('Error syncing playlist:', error)
      alert('Ошибка синхронизации плейлиста')
    } finally {
      setSyncing(null)
    }
  }

  const handleDeletePlaylist = async (playlistId: number) => {
    if (!confirm('Удалить плейлист?')) return

    try {
      await playlistsApi.deletePlaylist(playlistId)
      loadPlaylists()
    } catch (error) {
      console.error('Error deleting playlist:', error)
      alert('Ошибка удаления плейлиста')
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={() => navigate('/channels')}
          className="p-2 hover:bg-gray-800 active:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
        >
          <ArrowLeft size={20} className="sm:w-6 sm:h-6" />
        </button>
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold line-clamp-1">{channel?.title}</h2>
          <p className="text-sm sm:text-base text-gray-400">Плейлисты канала</p>
        </div>
      </div>

      {/* Playlists */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-400">Загрузка плейлистов...</p>
        </div>
      ) : playlists.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>Плейлисты не найдены</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {playlists.map((playlist) => (
            <div key={playlist.id} className="bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-primary-500 transition-all">
              {playlist.thumbnail_url && (
                <img
                  src={playlist.thumbnail_url}
                  alt={playlist.title}
                  className="w-full h-40 sm:h-48 object-cover"
                />
              )}
              
              <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                <div>
                  <h3 className="font-semibold text-base sm:text-lg line-clamp-2">
                    {playlist.title}
                  </h3>
                  {playlist.author && (
                    <p className="text-primary-400 text-xs sm:text-sm mt-1">
                      {playlist.author}
                    </p>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => handleSyncPlaylist(playlist.id)}
                    disabled={syncing === playlist.id}
                    className="flex-1 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-xs sm:text-sm font-medium"
                  >
                    <RefreshCw size={14} className={`sm:w-4 sm:h-4 ${syncing === playlist.id ? 'animate-spin' : ''}`} />
                    {syncing === playlist.id ? 'Синхронизация...' : 'Синхронизировать'}
                  </button>
                  
                  <button
                    onClick={() => navigate(`/audiobooks/${playlist.id}`)}
                    className="flex-1 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm font-medium"
                  >
                    <BookOpen size={14} className="sm:w-4 sm:h-4" />
                    Аудиокниги
                  </button>
                  
                  <button
                    onClick={() => handleDeletePlaylist(playlist.id)}
                    className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white p-2 rounded-lg transition-colors sm:hidden"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeletePlaylist(playlist.id)}
                    className="hidden sm:block bg-red-600 hover:bg-red-700 active:bg-red-800 text-white p-2 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


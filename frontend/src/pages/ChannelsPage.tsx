import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, FolderOpen } from 'lucide-react'
import { channelsApi, Channel } from '../lib/api'

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(false)
  const [addingChannel, setAddingChannel] = useState(false)
  const [channelUrl, setChannelUrl] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadChannels()
  }, [])

  const loadChannels = async () => {
    try {
      setLoading(true)
      const response = await channelsApi.getChannels()
      setChannels(response.data)
    } catch (error) {
      console.error('Error loading channels:', error)
      alert('Ошибка загрузки каналов')
    } finally {
      setLoading(false)
    }
  }

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!channelUrl.trim()) return

    try {
      setAddingChannel(true)
      await channelsApi.addChannel(channelUrl)
      setChannelUrl('')
      loadChannels()
      alert('Канал успешно добавлен!')
    } catch (error) {
      console.error('Error adding channel:', error)
      alert('Ошибка добавления канала')
    } finally {
      setAddingChannel(false)
    }
  }

  const handleDeleteChannel = async (channelId: number) => {
    if (!confirm('Вы уверены? Это удалит канал и все его плейлисты.')) return

    try {
      await channelsApi.deleteChannel(channelId)
      loadChannels()
    } catch (error) {
      console.error('Error deleting channel:', error)
      alert('Ошибка удаления канала')
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold">YouTube Каналы</h2>
        <p className="text-xs sm:text-sm text-gray-400 mt-2">
          Добавьте каналы с аудиокнигами из YouTube для создания своей библиотеки
        </p>
      </div>

      {/* Add channel form */}
      <form onSubmit={handleAddChannel} className="bg-gray-800 rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4">
        <h3 className="text-lg sm:text-xl font-semibold">Добавить канал</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={channelUrl}
            onChange={(e) => setChannelUrl(e.target.value)}
            placeholder="https://www.youtube.com/@channel_name"
            className="flex-1 bg-gray-700 text-white px-3 sm:px-4 py-2.5 sm:py-2 text-sm sm:text-base rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={addingChannel}
          />
          <button
            type="submit"
            disabled={addingChannel}
            className="bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-semibold py-2.5 sm:py-2 px-4 sm:px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <Plus size={20} />
            {addingChannel ? 'Добавление...' : 'Добавить'}
          </button>
        </div>
        <p className="text-xs sm:text-sm text-gray-400">
          Поддерживаются ссылки вида: youtube.com/@channel или youtube.com/channel/ID
        </p>
      </form>

      {/* Channels list */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-400">Загрузка каналов...</p>
        </div>
      ) : channels.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>Нет добавленных каналов</p>
          <p className="text-sm mt-2">Добавьте первый канал, чтобы начать</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          {channels.map((channel) => (
            <div key={channel.id} className="bg-gray-800 rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="flex gap-3 sm:gap-4">
                {channel.thumbnail_url && (
                  <img
                    src={channel.thumbnail_url}
                    alt={channel.title}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-xl font-semibold line-clamp-2">{channel.title}</h3>
                  {channel.description && (
                    <p className="text-xs sm:text-sm text-gray-400 mt-1 line-clamp-2">
                      {channel.description}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => navigate(`/playlists/${channel.id}`)}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white py-2.5 sm:py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base font-medium"
                >
                  <FolderOpen size={16} className="sm:w-[18px] sm:h-[18px]" />
                  Плейлисты
                </button>
                <button
                  onClick={() => handleDeleteChannel(channel.id)}
                  className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white p-2.5 sm:p-2 rounded-lg transition-colors"
                  title="Удалить канал"
                >
                  <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


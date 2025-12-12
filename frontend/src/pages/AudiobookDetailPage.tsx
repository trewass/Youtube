import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, MessageSquare, Trash2, Send, Mic, MicOff, Download, CheckCircle, WifiOff } from 'lucide-react'
import { audiobooksApi, notesApi, aiApi, Audiobook, Note, ChatMessage } from '../lib/api'
import { audioStorage } from '../lib/audioStorage'
import { useAudioSource } from '../lib/useAudioSource'

export default function AudiobookDetailPage() {
  const { audiobookId } = useParams<{ audiobookId: string }>()
  const [audiobook, setAudiobook] = useState<Audiobook | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddNote, setShowAddNote] = useState(false)
  const [newNote, setNewNote] = useState({ content: '', quote: '' })
  const [chatNote, setChatNote] = useState<Note | null>(null)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [chatMessage, setChatMessage] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
  const [isDownloadingOffline, setIsDownloadingOffline] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [isCachedLocally, setIsCachedLocally] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const navigate = useNavigate()
  
  // Используем хук для определения источника аудио
  const audioSource = useAudioSource(audiobook)

  const checkCachedStatus = async () => {
    if (!audiobook) return
    try {
      const cached = await audioStorage.hasAudio(audiobook.id)
      setIsCachedLocally(cached)
    } catch (error) {
      console.error('Error checking cache status:', error)
    }
  }

  useEffect(() => {
    if (audiobookId) {
      loadAudiobook()
      loadNotes()
    }
  }, [audiobookId])

  useEffect(() => {
    // Проверяем статус кэша при изменении аудиокниги
    if (audiobook) {
      checkCachedStatus()
    }
  }, [audiobook])

  useEffect(() => {
    // Инициализация Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognitionInstance = new SpeechRecognition()
      recognitionInstance.continuous = false
      recognitionInstance.interimResults = false
      recognitionInstance.lang = 'ru-RU'
      
      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript
        setNewNote(prev => ({ ...prev, content: prev.content + (prev.content ? ' ' : '') + transcript }))
        setIsRecording(false)
      }
      
      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsRecording(false)
        if (event.error === 'no-speech') {
          alert('Речь не распознана. Попробуйте еще раз.')
        } else if (event.error === 'not-allowed') {
          alert('Доступ к микрофону запрещен. Разрешите доступ в настройках браузера.')
        }
      }
      
      recognitionInstance.onend = () => {
        setIsRecording(false)
      }
      
      setRecognition(recognitionInstance)
    }
    
    return () => {
      if (recognition) {
        recognition.stop()
      }
    }
  }, [audiobookId])

  const loadAudiobook = async () => {
    try {
      setLoading(true)
      const response = await audiobooksApi.getAudiobook(Number(audiobookId))
      setAudiobook(response.data)
    } catch (error) {
      console.error('Error loading audiobook:', error)
      alert('Ошибка загрузки аудиокниги')
    } finally {
      setLoading(false)
    }
  }

  const loadNotes = async () => {
    try {
      const response = await notesApi.getNotes(Number(audiobookId))
      setNotes(response.data)
    } catch (error) {
      console.error('Error loading notes:', error)
    }
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newNote.content.trim()) return

    try {
      const currentTime = audioRef.current?.currentTime
      
      await notesApi.createNote({
        content: newNote.content,
        quote: newNote.quote || undefined,
        timestamp: currentTime,
        audiobook_id: Number(audiobookId),
      })
      
      setNewNote({ content: '', quote: '' })
      setShowAddNote(false)
      loadNotes()
    } catch (error) {
      console.error('Error adding note:', error)
      alert('Ошибка добавления заметки')
    }
  }

  const handleStartRecording = () => {
    if (!recognition) {
      alert('Голосовой ввод не поддерживается в вашем браузере')
      return
    }

    try {
      setIsRecording(true)
      recognition.start()
    } catch (error) {
      console.error('Error starting recognition:', error)
      setIsRecording(false)
    }
  }

  const handleStopRecording = () => {
    if (recognition && isRecording) {
      recognition.stop()
      setIsRecording(false)
    }
  }

  const handleDownloadForOffline = async () => {
    if (!audiobook || !audiobook.audio_file_path) {
      alert('Аудиофайл еще не готов. Сначала скачайте его на сервер.')
      return
    }

    if (isCachedLocally) {
      if (confirm('Файл уже скачан. Удалить и скачать заново?')) {
        await audioStorage.deleteAudio(audiobook.id)
        setIsCachedLocally(false)
      } else {
        return
      }
    }

    try {
      setIsDownloadingOffline(true)
      setDownloadProgress(0)

      // Получаем URL файла
      const audioUrl = audiobook.audio_file_path.startsWith('http')
        ? audiobook.audio_file_path
        : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${audiobook.audio_file_path}`

      // Скачиваем и сохраняем в IndexedDB
      await audioStorage.downloadAndSave(
        audiobook.id,
        audioUrl,
        audiobook.title,
        (progress) => {
          setDownloadProgress(progress)
        }
      )

      setIsCachedLocally(true)
      alert('✅ Аудиокнига скачана на устройство! Теперь доступна офлайн.')
      
      // Обновляем источник аудио
      audioSource.refresh()
    } catch (error: any) {
      console.error('Error downloading for offline:', error)
      alert(`Ошибка скачивания: ${error.message || 'Неизвестная ошибка'}`)
    } finally {
      setIsDownloadingOffline(false)
      setDownloadProgress(0)
    }
  }

  const handleDeleteOffline = async () => {
    if (!audiobook) return
    
    if (!confirm('Удалить скачанный файл с устройства?')) return

    try {
      await audioStorage.deleteAudio(audiobook.id)
      setIsCachedLocally(false)
      alert('Файл удален с устройства')
      audioSource.refresh()
    } catch (error) {
      console.error('Error deleting offline file:', error)
      alert('Ошибка удаления файла')
    }
  }

  const handleDeleteNote = async (noteId: number) => {
    if (!confirm('Удалить заметку?')) return

    try {
      await notesApi.deleteNote(noteId)
      loadNotes()
      if (chatNote?.id === noteId) {
        setChatNote(null)
        setChatHistory([])
      }
    } catch (error) {
      console.error('Error deleting note:', error)
      alert('Ошибка удаления заметки')
    }
  }

  const handleStartChat = async (note: Note) => {
    setChatNote(note)
    setChatMessage('') // Очищаем поле ввода при переключении заметки

    if (note.ai_discussion) {
      try {
        const response = await aiApi.getDiscussionHistory(note.id)
        if (response.data.history && Array.isArray(response.data.history)) {
          setChatHistory(response.data.history)
        } else {
          setChatHistory([])
        }
      } catch (error) {
        console.error('Error loading chat history:', error)
        setChatHistory([])
      }
    } else {
      setChatHistory([])
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!chatMessage.trim() || !chatNote) return

    try {
      setChatLoading(true)

      // Если это первое сообщение и нет истории, отправляем цитату с вопросом
      // Если есть история, отправляем только новый вопрос
      const response = await aiApi.discussQuote({
        quote: chatNote.quote || chatNote.content,
        context: chatMessage.trim(),
        note_id: chatNote.id,
        history: chatHistory.length > 0 ? chatHistory : undefined,
      })
      
      setChatHistory(response.data.history)
      setChatMessage('')
    } catch (error: any) {
      console.error('Error sending message:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Неизвестная ошибка'
      alert(`Ошибка отправки сообщения: ${errorMessage}`)
    } finally {
      setChatLoading(false)
    }
  }

  const formatTimestamp = (seconds?: number) => {
    if (!seconds) return ''
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  if (loading || !audiobook) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={() => navigate(`/audiobooks/${audiobook.playlist_id}`)}
          className="p-2 hover:bg-gray-800 active:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
        >
          <ArrowLeft size={20} className="sm:w-6 sm:h-6" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-2xl font-bold line-clamp-2">{audiobook.title}</h2>
          {audiobook.ai_summary && (
            <p className="text-xs sm:text-sm text-gray-400 mt-1 line-clamp-2">{audiobook.ai_summary}</p>
          )}
        </div>
      </div>

      {/* Audio Player */}
      {audiobook.audio_file_path && (
        <div className="bg-gray-800 rounded-lg p-3 sm:p-6 space-y-3">
          {/* Статус офлайн скачивания */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isCachedLocally ? (
                <>
                  <CheckCircle size={20} className="text-green-500" />
                  <span className="text-sm text-green-400">Скачано на устройство</span>
                  <button
                    onClick={handleDeleteOffline}
                    className="text-xs text-red-400 hover:text-red-300 ml-2"
                  >
                    Удалить
                  </button>
                </>
              ) : (
                <>
                  <WifiOff size={20} className="text-yellow-500" />
                  <span className="text-sm text-gray-400">Только онлайн</span>
                </>
              )}
            </div>
            
            {!isCachedLocally && (
              <button
                onClick={handleDownloadForOffline}
                disabled={isDownloadingOffline || !navigator.onLine}
                className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
              >
                {isDownloadingOffline ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Скачиваю... {downloadProgress.toFixed(0)}%</span>
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    <span>Скачать для офлайн</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Прогресс скачивания */}
          {isDownloadingOffline && (
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          )}

          <audio
            ref={audioRef}
            controls
            className="w-full"
            src={audioSource.url || (audiobook.audio_file_path?.startsWith('http') 
              ? audiobook.audio_file_path 
              : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${audiobook.audio_file_path}`)}
          >
            Ваш браузер не поддерживает аудио элемент.
          </audio>
          
          {audioSource.isCached && (
            <p className="text-xs text-green-400 text-center">
              🎧 Воспроизведение из локального хранилища (офлайн)
            </p>
          )}
        </div>
      )}

      {/* Notes Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Notes List */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-semibold">Заметки</h3>
            <button
              onClick={() => setShowAddNote(!showAddNote)}
              className="bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white p-2 rounded-lg transition-colors"
            >
              <Plus size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>

          {showAddNote && (
            <form onSubmit={handleAddNote} className="bg-gray-800 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
              <input
                type="text"
                value={newNote.quote}
                onChange={(e) => setNewNote({ ...newNote, quote: e.target.value })}
                placeholder="Цитата (опционально)"
                className="w-full bg-gray-700 text-white px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <div className="relative">
                <textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  placeholder="Ваша заметка... (или нажмите микрофон для голосового ввода)"
                  rows={3}
                  className="w-full bg-gray-700 text-white px-3 sm:px-4 py-2 pr-10 sm:pr-12 text-sm sm:text-base rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="button"
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  className={`absolute right-2 top-2 p-2 rounded-lg transition-colors ${
                    isRecording
                      ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                      : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                  }`}
                  title={isRecording ? 'Остановить запись' : 'Начать голосовой ввод'}
                >
                  {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
              </div>
              {isRecording && (
                <p className="text-xs text-red-400 animate-pulse">Идет запись... Говорите</p>
              )}
              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white py-2.5 sm:py-2 rounded-lg transition-colors text-sm sm:text-base font-medium"
              >
                Добавить заметку
              </button>
            </form>
          )}

          {notes.length === 0 ? (
            <p className="text-sm sm:text-base text-gray-400 text-center py-6 sm:py-8">Заметок пока нет</p>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className={`bg-gray-800 rounded-lg p-3 sm:p-4 space-y-2 cursor-pointer hover:ring-2 hover:ring-primary-500 active:bg-gray-750 transition-all ${
                    chatNote?.id === note.id ? 'ring-2 ring-primary-500' : ''
                  }`}
                  onClick={() => handleStartChat(note)}
                >
                  {note.quote && (
                    <blockquote className="text-xs sm:text-sm text-gray-300 italic border-l-2 border-primary-500 pl-2 sm:pl-3">
                      "{note.quote}"
                    </blockquote>
                  )}
                  <p className="text-sm sm:text-base text-gray-100">{note.content}</p>
                  <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-500">
                    {note.timestamp && (
                      <span>{formatTimestamp(note.timestamp)}</span>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStartChat(note)
                        }}
                        className="text-primary-400 hover:text-primary-300 active:text-primary-200 p-1"
                      >
                        <MessageSquare size={14} className="sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteNote(note.id)
                        }}
                        className="text-red-400 hover:text-red-300 active:text-red-200 p-1"
                      >
                        <Trash2 size={14} className="sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Chat */}
        <div className="bg-gray-800 rounded-lg p-3 sm:p-4 flex flex-col h-[400px] sm:h-[500px] lg:h-[600px]">
          <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">AI Обсуждение</h3>
          
          {!chatNote ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <p className="text-sm sm:text-base text-center px-4">Выберите заметку для обсуждения</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                {chatHistory.map((msg, index) => (
                  <div
                    key={index}
                    className={`p-2.5 sm:p-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-primary-600 ml-6 sm:ml-8'
                        : 'bg-gray-700 mr-6 sm:mr-8'
                    }`}
                  >
                    <p className="text-xs sm:text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                ))}
                {chatLoading && (
                  <div className="bg-gray-700 p-2.5 sm:p-3 rounded-lg mr-6 sm:mr-8">
                    <p className="text-xs sm:text-sm text-gray-400">AI печатает...</p>
                  </div>
                )}
              </div>
              
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Задайте вопрос..."
                  disabled={chatLoading}
                  className="flex-1 bg-gray-700 text-white px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={chatLoading}
                  className="bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white p-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Send size={18} className="sm:w-5 sm:h-5" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}


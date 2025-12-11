import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, MessageSquare, Trash2, Send, Wifi, WifiOff, Download } from 'lucide-react'
import { audiobooksApi, notesApi, aiApi, Audiobook, Note, ChatMessage } from '../lib/api'
import { audioStorage } from '../lib/audioStorage'
import { useAudioSource, AudioSource } from '../lib/useAudioSource'

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
  const audioRef = useRef<HTMLAudioElement>(null)
  const navigate = useNavigate()

  // Smart audio source
  const audioSource = useAudioSource(audiobook)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    if (audiobookId) {
      loadAudiobook()
      loadNotes()
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

    if (note.ai_discussion) {
      try {
        const response = await aiApi.getDiscussionHistory(note.id)
        setChatHistory(response.data.history)
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

      const response = await aiApi.discussQuote({
        quote: chatNote.quote || chatNote.content,
        context: chatMessage,
        note_id: chatNote.id,
        history: chatHistory.length > 0 ? chatHistory : undefined,
      })

      setChatHistory(response.data.history)
      setChatMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Ошибка отправки сообщения')
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
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-800 active:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
        >
          <ArrowLeft size={20} className="sm:w-6 sm:h-6" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-2xl font-bold line-clamp-2">{audiobook.title}</h2>
          {audiobook.ai_summary && (
            <p className="text-xs sm:text-sm text-gray-400 mt-1 line-clamp-2">{audiobook.ai_summary}</p>
          )}
          {!audiobook.ai_summary && (
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Слушайте аудио, делайте заметки и обсуждайте с AI
            </p>
          )}
        </div>
      </div>

      {/* Audio Player */}
      {audiobook.audio_file_path && (
        <div className="bg-gray-800 rounded-lg p-3 sm:p-6">
          <audio
            ref={audioRef}
            controls
            className="w-full"
            src={audiobook.audio_file_path}
          >
            Ваш браузер не поддерживает аудио элемент.
          </audio>
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
              <textarea
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                placeholder="Ваша заметка..."
                rows={3}
                className="w-full bg-gray-700 text-white px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
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
                  className={`bg-gray-800 rounded-lg p-3 sm:p-4 space-y-2 cursor-pointer hover:ring-2 hover:ring-primary-500 active:bg-gray-750 transition-all ${chatNote?.id === note.id ? 'ring-2 ring-primary-500' : ''
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
                    className={`p-2.5 sm:p-3 rounded-lg ${msg.role === 'user'
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


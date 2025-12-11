import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, MessageSquare, Trash2, Send } from 'lucide-react'
import { audiobooksApi, notesApi, aiApi, Audiobook, Note, ChatMessage } from '../lib/api'

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/audiobooks/${audiobook.playlist_id}`)}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{audiobook.title}</h2>
          {audiobook.ai_summary && (
            <p className="text-gray-400 mt-1">{audiobook.ai_summary}</p>
          )}
        </div>
      </div>

      {/* Audio Player */}
      {audiobook.audio_file_path && (
        <div className="bg-gray-800 rounded-lg p-6">
          <audio
            ref={audioRef}
            controls
            className="w-full"
            src={`http://localhost:8000${audiobook.audio_file_path}`}
          >
            Ваш браузер не поддерживает аудио элемент.
          </audio>
        </div>
      )}

      {/* Notes Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Notes List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Заметки</h3>
            <button
              onClick={() => setShowAddNote(!showAddNote)}
              className="bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-lg transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>

          {showAddNote && (
            <form onSubmit={handleAddNote} className="bg-gray-800 rounded-lg p-4 space-y-3">
              <input
                type="text"
                value={newNote.quote}
                onChange={(e) => setNewNote({ ...newNote, quote: e.target.value })}
                placeholder="Цитата (опционально)"
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <textarea
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                placeholder="Ваша заметка..."
                rows={3}
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors"
              >
                Добавить заметку
              </button>
            </form>
          )}

          {notes.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Заметок пока нет</p>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className={`bg-gray-800 rounded-lg p-4 space-y-2 cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all ${
                    chatNote?.id === note.id ? 'ring-2 ring-primary-500' : ''
                  }`}
                  onClick={() => handleStartChat(note)}
                >
                  {note.quote && (
                    <blockquote className="text-sm text-gray-300 italic border-l-2 border-primary-500 pl-3">
                      "{note.quote}"
                    </blockquote>
                  )}
                  <p className="text-gray-100">{note.content}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    {note.timestamp && (
                      <span>{formatTimestamp(note.timestamp)}</span>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStartChat(note)
                        }}
                        className="text-primary-400 hover:text-primary-300"
                      >
                        <MessageSquare size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteNote(note.id)
                        }}
                        className="text-red-400 hover:text-red-300"
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

        {/* AI Chat */}
        <div className="bg-gray-800 rounded-lg p-4 flex flex-col h-[600px]">
          <h3 className="text-xl font-semibold mb-4">AI Обсуждение</h3>
          
          {!chatNote ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <p>Выберите заметку для обсуждения</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {chatHistory.map((msg, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-primary-600 ml-8'
                        : 'bg-gray-700 mr-8'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                ))}
                {chatLoading && (
                  <div className="bg-gray-700 p-3 rounded-lg mr-8">
                    <p className="text-sm text-gray-400">AI печатает...</p>
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
                  className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={chatLoading}
                  className="bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Send size={20} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}


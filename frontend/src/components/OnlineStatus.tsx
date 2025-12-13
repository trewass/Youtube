import { useState, useEffect } from 'react'
import { Wifi, WifiOff } from 'lucide-react'

export default function OnlineStatus() {
    const [isOnline, setIsOnline] = useState(navigator.onLine)
    const [showNotification, setShowNotification] = useState(false)
    const [justWentOnline, setJustWentOnline] = useState(false)

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true)
            setJustWentOnline(true)
            setShowNotification(true)

            // Скрываем уведомление через 3 секунды
            setTimeout(() => {
                setShowNotification(false)
                setJustWentOnline(false)
            }, 3000)
        }

        const handleOffline = () => {
            setIsOnline(false)
            setShowNotification(true)
            setJustWentOnline(false)
        }

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        // Показываем уведомление если уже офлайн
        if (!navigator.onLine) {
            setShowNotification(true)
        }

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    // Автоматически скрываем онлайн уведомление
    useEffect(() => {
        if (isOnline && !justWentOnline) {
            setShowNotification(false)
        }
    }, [isOnline, justWentOnline])

    if (!showNotification) return null

    return (
        <div
            className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm transition-all duration-300 ${isOnline
                    ? 'bg-green-500/90 text-white'
                    : 'bg-red-500/90 text-white'
                }`}
            style={{
                animation: 'slideInRight 0.3s ease-out',
            }}
        >
            {isOnline ? (
                <Wifi size={20} className="animate-pulse" />
            ) : (
                <WifiOff size={20} className="animate-pulse" />
            )}

            <div className="flex flex-col">
                <span className="text-sm font-semibold">
                    {isOnline ? 'Подключено' : 'Офлайн режим'}
                </span>
                <span className="text-xs opacity-90">
                    {isOnline
                        ? 'Интернет подключение восстановлено'
                        : 'Доступны только скачанные аудиокниги'
                    }
                </span>
            </div>

            {!isOnline && (
                <button
                    onClick={() => setShowNotification(false)}
                    className="ml-2 text-white/80 hover:text-white transition-colors"
                    aria-label="Закрыть"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            )}

            <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
        </div>
    )
}

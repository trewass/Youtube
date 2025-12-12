import { ReactNode, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Library, FolderOpen } from 'lucide-react'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  
  useEffect(() => {
    console.log('📍 Current route:', location.pathname)
  }, [location])
  
  const isActive = (path: string) => location.pathname === path
  
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <h1 className="text-lg sm:text-2xl font-bold text-primary-400 flex items-center gap-2">
            <span>🎧</span>
            <span className="hidden xs:inline">AudioBook Library</span>
            <span className="xs:hidden">AudioBooks</span>
          </h1>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-20 sm:pb-24">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 z-20 safe-area-bottom">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex justify-around">
            <Link
              to="/"
              className={`flex flex-col items-center py-2.5 sm:py-3 px-3 sm:px-4 transition-colors min-w-0 ${
                isActive('/') ? 'text-primary-400' : 'text-gray-400 active:text-gray-200'
              }`}
            >
              <Home size={22} className="sm:w-6 sm:h-6" />
              <span className="text-[10px] sm:text-xs mt-0.5 sm:mt-1">Главная</span>
            </Link>
            
            <Link
              to="/channels"
              className={`flex flex-col items-center py-2.5 sm:py-3 px-3 sm:px-4 transition-colors min-w-0 ${
                isActive('/channels') ? 'text-primary-400' : 'text-gray-400 active:text-gray-200'
              }`}
            >
              <FolderOpen size={22} className="sm:w-6 sm:h-6" />
              <span className="text-[10px] sm:text-xs mt-0.5 sm:mt-1">Каналы</span>
            </Link>
            
            <Link
              to="/library"
              className={`flex flex-col items-center py-2.5 sm:py-3 px-3 sm:px-4 transition-colors min-w-0 ${
                isActive('/library') ? 'text-primary-400' : 'text-gray-400 active:text-gray-200'
              }`}
            >
              <Library size={22} className="sm:w-6 sm:h-6" />
              <span className="text-[10px] sm:text-xs mt-0.5 sm:mt-1">Библиотека</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  )
}


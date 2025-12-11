import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Library, FolderOpen } from 'lucide-react'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  
  const isActive = (path: string) => location.pathname === path
  
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-primary-400">
            🎧 AudioBook Library
          </h1>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6 pb-20">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex justify-around">
            <Link
              to="/"
              className={`flex flex-col items-center py-3 px-4 transition-colors ${
                isActive('/') ? 'text-primary-400' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Home size={24} />
              <span className="text-xs mt-1">Главная</span>
            </Link>
            
            <Link
              to="/channels"
              className={`flex flex-col items-center py-3 px-4 transition-colors ${
                isActive('/channels') ? 'text-primary-400' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <FolderOpen size={24} />
              <span className="text-xs mt-1">Каналы</span>
            </Link>
            
            <Link
              to="/library"
              className={`flex flex-col items-center py-3 px-4 transition-colors ${
                isActive('/library') ? 'text-primary-400' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Library size={24} />
              <span className="text-xs mt-1">Библиотека</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  )
}


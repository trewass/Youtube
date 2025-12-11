import { Link } from 'react-router-dom'
import { Youtube, BookOpen, MessageSquare, Download } from 'lucide-react'
import type { ReactNode } from 'react'

export default function HomePage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Hero section */}
      <div className="text-center space-y-3 sm:space-y-4">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold px-4">
          Добро пожаловать в AudioBook Library
        </h2>
        <p className="text-gray-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-4">
          Превратите YouTube-каналы с аудиокнигами в удобную оффлайн библиотеку
          с AI-ассистентом для обсуждения прочитанного
        </p>
      </div>

      {/* Features */}
      <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mt-8 sm:mt-12">
        <FeatureCard
          icon={<Youtube size={32} />}
          title="Парсинг YouTube"
          description="Добавьте ссылку на канал и автоматически получите все плейлисты и видео"
        />
        
        <FeatureCard
          icon={<Download size={32} />}
          title="Оффлайн доступ"
          description="Скачивайте аудио и слушайте без интернета на любом устройстве"
        />
        
        <FeatureCard
          icon={<BookOpen size={32} />}
          title="Заметки"
          description="Делайте заметки к понравившимся фразам и моментам"
        />
        
        <FeatureCard
          icon={<MessageSquare size={32} />}
          title="AI-ассистент"
          description="Обсуждайте смысл цитат с искусственным интеллектом"
        />
      </div>

      {/* CTA */}
      <div className="text-center mt-8 sm:mt-12">
        <Link
          to="/channels"
          className="inline-block bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-semibold py-3 px-6 sm:px-8 rounded-lg transition-colors text-sm sm:text-base"
        >
          Добавить канал YouTube
        </Link>
      </div>

      {/* Instructions */}
      <div className="mt-12 sm:mt-16 bg-gray-800 rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4">
        <h3 className="text-lg sm:text-xl font-semibold">Как использовать:</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm sm:text-base text-gray-300">
          <li>Перейдите в раздел "Каналы" и добавьте ссылку на YouTube канал</li>
          <li>Приложение автоматически загрузит все плейлисты канала</li>
          <li>Синхронизируйте интересующий плейлист для получения списка видео</li>
          <li>Скачайте аудио из видео и слушайте оффлайн</li>
          <li>Делайте заметки и обсуждайте их с AI-ассистентом</li>
        </ol>
      </div>
    </div>
  )
}

interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 sm:p-6 space-y-2 sm:space-y-3 hover:bg-gray-750 transition-colors">
      <div className="text-primary-400">{icon}</div>
      <h3 className="text-lg sm:text-xl font-semibold">{title}</h3>
      <p className="text-sm sm:text-base text-gray-400">{description}</p>
    </div>
  )
}


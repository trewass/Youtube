import { Link } from 'react-router-dom'
import { Youtube, BookOpen, MessageSquare, Download } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Hero section */}
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold">
          Добро пожаловать в AudioBook Library
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Превратите YouTube-каналы с аудиокнигами в удобную оффлайн библиотеку
          с AI-ассистентом для обсуждения прочитанного
        </p>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-2 gap-6 mt-12">
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
      <div className="text-center mt-12">
        <Link
          to="/channels"
          className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
        >
          Добавить канал YouTube
        </Link>
      </div>

      {/* Instructions */}
      <div className="mt-16 bg-gray-800 rounded-lg p-6 space-y-4">
        <h3 className="text-xl font-semibold">Как использовать:</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-300">
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
    <div className="bg-gray-800 rounded-lg p-6 space-y-3 hover:bg-gray-750 transition-colors">
      <div className="text-primary-400">{icon}</div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  )
}


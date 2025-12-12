import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Логирование для диагностики
console.log('🚀 App starting...')
console.log('Environment:', import.meta.env.MODE)
console.log('API URL:', import.meta.env.VITE_API_URL || 'Same origin')

// Обработка ошибок рендеринга
const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

try {
  console.log('✅ Rendering app...')
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
  console.log('✅ App rendered successfully')
} catch (error) {
  console.error('❌ Failed to render app:', error)
  rootElement.innerHTML = `
    <div style="padding: 20px; text-align: center; color: red; background: #111827; min-height: 100vh; display: flex; align-items: center; justify-content: center; flex-direction: column;">
      <h1 style="color: #ef4444;">Ошибка загрузки приложения</h1>
      <p style="color: #9ca3af; margin-top: 10px;">${error instanceof Error ? error.message : 'Unknown error'}</p>
      <p style="color: #6b7280; margin-top: 20px; font-size: 14px;">Проверьте консоль браузера (F12) для деталей.</p>
      <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer;">
        Перезагрузить страницу
      </button>
    </div>
  `
}



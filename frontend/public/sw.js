// Service Worker для PWA
const CACHE_NAME = 'audiobook-library-v1';
const AUDIO_CACHE = 'audiobook-audio-v1';

// Файлы для кеширования при установке
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  
  // Активируем новый SW сразу
  self.skipWaiting();
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Удаляем старые кеши
          if (cacheName !== CACHE_NAME && cacheName !== AUDIO_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Активируем SW для всех клиентов
  self.clients.claim();
});

// Обработка запросов
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Пропускаем не-GET запросы
  if (request.method !== 'GET') {
    return;
  }
  
  // Пропускаем chrome-extension и другие протоколы
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Стратегия для аудиофайлов: Cache First
  if (url.pathname.startsWith('/audio/') || url.pathname.endsWith('.mp3')) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[SW] Serving audio from cache:', url.pathname);
            return cachedResponse;
          }
          
          return fetch(request).then((networkResponse) => {
            // Кешируем успешные аудио-запросы
            if (networkResponse.ok) {
              console.log('[SW] Caching audio:', url.pathname);
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
    return;
  }
  
  // Стратегия для API: Network First, fallback to Cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Кешируем GET запросы к API
          if (networkResponse.ok && request.method === 'GET') {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, networkResponse.clone());
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Если сеть недоступна - пробуем кеш
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              console.log('[SW] Serving API from cache (offline):', url.pathname);
              return cachedResponse;
            }
            
            // Возвращаем пустой ответ для офлайн режима
            return new Response(
              JSON.stringify({ 
                error: 'Offline', 
                message: 'Нет подключения к интернету' 
              }),
              {
                headers: { 'Content-Type': 'application/json' },
                status: 503
              }
            );
          });
        })
    );
    return;
  }
  
  // Стратегия для статических файлов: Cache First
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(request).then((networkResponse) => {
        // Кешируем успешные ответы
        if (networkResponse.ok) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, networkResponse.clone());
          });
        }
        return networkResponse;
      });
    }).catch(() => {
      // Fallback для офлайн режима
      if (request.destination === 'document') {
        return caches.match('/');
      }
      
      return new Response('Офлайн режим', {
        status: 503,
        statusText: 'Service Unavailable'
      });
    })
  );
});

// Слушаем сообщения от клиента
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Команда для очистки кеша
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

// Фоновая синхронизация (когда появляется интернет)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(
      // Здесь можно синхронизировать данные с сервером
      Promise.resolve()
    );
  }
});

console.log('[SW] Service Worker loaded');

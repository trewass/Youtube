// Service Worker для полноценной офлайн работы
const CACHE_NAME = 'audiobook-library-v1';
const OFFLINE_URL = '/offline.html';

// Ресурсы для кэширования
const STATIC_CACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // CSS и JS файлы будут кэшироваться автоматически
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static resources');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Installation complete');
        return self.skipWaiting();
      })
  );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Activation complete');
        return self.clients.claim();
      })
  );
});

// Обработка запросов
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Обработка навигационных запросов (HTML страницы)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return caches.open(CACHE_NAME)
            .then((cache) => {
              return cache.match(OFFLINE_URL);
            });
        })
    );
    return;
  }

  // Обработка статических ресурсов (CSS, JS, изображения)
  if (request.destination === 'style' || 
      request.destination === 'script' || 
      request.destination === 'image' ||
      request.destination === 'font') {
    
    event.respondWith(
      caches.open(CACHE_NAME)
        .then((cache) => {
          return cache.match(request)
            .then((response) => {
              if (response) {
                console.log('[SW] Serving from cache:', request.url);
                return response;
              }
              
              return fetch(request)
                .then((fetchResponse) => {
                  if (fetchResponse && fetchResponse.status === 200) {
                    cache.put(request, fetchResponse.clone());
                  }
                  return fetchResponse;
                })
                .catch(() => {
                  console.log('[SW] Failed to fetch:', request.url);
                  return null;
                });
            });
        })
    );
    return;
  }

  // Обработка API запросов с fallback на кэш
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          return caches.open(CACHE_NAME)
            .then((cache) => {
              return cache.match(request)
                .then((response) => {
                  if (response) {
                    console.log('[SW] Serving API from cache:', request.url);
                    return response;
                  }
                  
                  // Возвращаем заглушку для API запросов
                  return new Response(
                    JSON.stringify({ 
                      error: 'Офлайн режим', 
                      message: 'Данные недоступны без подключения к интернету',
                      offline: true 
                    }),
                    {
                      status: 503,
                      statusText: 'Service Unavailable',
                      headers: { 'Content-Type': 'application/json' }
                    }
                  );
                });
            });
        })
    );
    return;
  }

  // Обработка аудио файлов
  if (url.pathname.startsWith('/audio/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          return caches.open(CACHE_NAME)
            .then((cache) => {
              return cache.match(request);
            });
        })
    );
    return;
  }

  // Для всех остальных запросов используем стандартную стратегию
  event.respondWith(
    fetch(request)
      .catch(() => {
        return caches.match(request);
      })
  );
});


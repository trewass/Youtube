/* eslint-disable no-undef */
/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

// Константы
const CACHE_NAME = 'audiobook-library-v2'
const AUDIO_DB_NAME = 'audiobook-library'
const AUDIO_STORE_NAME = 'audio'
const OFFLINE_URL = '/offline.html'

// Precache всех статических ресурсов (будет заполнено Workbox при сборке)
precacheAndRoute(self.__WB_MANIFEST || [])

// Очистка старых кэшей
cleanupOutdatedCaches()

// Кэшировать offline страницу при установке
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...')

    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                OFFLINE_URL,
                '/',
            ])
        })
    )

    // Активировать немедленно
    self.skipWaiting()
})

self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...')
    event.waitUntil(self.clients.claim())
})

// Обработка сообщений от клиента
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data)

    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting()
    }
})

// ========================================
// СТРАТЕГИИ КЭШИРОВАНИЯ
// ========================================

// API запросы: NetworkFirst с fallback на cache
registerRoute(
    ({ url }) => url.pathname.startsWith('/api/'),
    new NetworkFirst({
        cacheName: 'api-cache',
        plugins: [
            new CacheableResponsePlugin({
                statuses: [0, 200],
            }),
            new ExpirationPlugin({
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24 часа
            }),
        ],
    })
)

// Изображения: CacheFirst с длительным хранением
registerRoute(
    ({ request }) => request.destination === 'image',
    new CacheFirst({
        cacheName: 'images-cache',
        plugins: [
            new CacheableResponsePlugin({
                statuses: [0, 200],
            }),
            new ExpirationPlugin({
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 дней
            }),
        ],
    })
)

// CSS и JS: StaleWhileRevalidate для быстрой загрузки
registerRoute(
    ({ request }) =>
        request.destination === 'style' ||
        request.destination === 'script',
    new StaleWhileRevalidate({
        cacheName: 'assets-cache',
    })
)

// Fonts: CacheFirst с долгим хранением
registerRoute(
    ({ request }) => request.destination === 'font',
    new CacheFirst({
        cacheName: 'fonts-cache',
        plugins: [
            new CacheableResponsePlugin({
                statuses: [0, 200],
            }),
            new ExpirationPlugin({
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 год
            }),
        ],
    })
)

// ========================================
// АУДИО ФАЙЛЫ - КАСТОМНАЯ ОБРАБОТКА
// ========================================

// Обработка аудио через IndexedDB
registerRoute(
    ({ request }) => {
        const url = new URL(request.url)
        // Проверяем audio destination или расширение файла
        return request.destination === 'audio' ||
            /\.(mp3|wav|m4a|ogg|opus|webm)$/i.test(url.pathname) ||
            url.pathname.includes('/audio/')
    },
    async ({ event, request }) => {
        try {
            // Пытаемся получить из IndexedDB
            const audioId = extractAudioId(request.url)

            if (audioId) {
                const cachedAudio = await getAudioFromIndexedDB(audioId)
                if (cachedAudio) {
                    console.log('[SW] Serving audio from IndexedDB:', audioId)

                    // Обработка Range Requests для seek
                    if (request.headers.has('range')) {
                        return handleRangeRequest(request, cachedAudio)
                    }

                    return new Response(cachedAudio, {
                        status: 200,
                        statusText: 'OK',
                        headers: {
                            'Content-Type': 'audio/mpeg',
                            'Content-Length': cachedAudio.size,
                            'Accept-Ranges': 'bytes',
                        },
                    })
                }
            }

            // Если нет в IndexedDB - пробуем сеть
            console.log('[SW] Audio not in IndexedDB, fetching from network')
            const response = await fetch(request)

            // Кэшируем ответ в Cache API для последующих запросов
            if (response.ok) {
                const cache = await caches.open('audio-cache')
                cache.put(request, response.clone())
            }

            return response
        } catch (error) {
            console.error('[SW] Error serving audio:', error)

            // Fallback: пробуем получить из Cache API
            const cachedResponse = await caches.match(request)
            if (cachedResponse) {
                return cachedResponse
            }

            // Если ничего не помогло
            return new Response('Audio not available offline', {
                status: 503,
                statusText: 'Service Unavailable',
            })
        }
    }
)

// ========================================
// НАВИГАЦИЯ - OFFLINE FALLBACK
// ========================================

// Для навигационных запросов показываем offline.html если нет сети
const navigationRoute = new NavigationRoute(
    async ({ event }) => {
        try {
            const response = await fetch(event.request)
            return response
        } catch (error) {
            console.log('[SW] Navigation request failed, showing offline page')
            const cache = await caches.open(CACHE_NAME)
            const cachedResponse = await cache.match(OFFLINE_URL)
            return cachedResponse || new Response('Offline')
        }
    }
)

registerRoute(navigationRoute)

// ========================================
// HELPER ФУНКЦИИ
// ========================================

/**
 * Извлекает ID аудиокниги из URL
 */
function extractAudioId(url) {
    try {
        const urlObj = new URL(url)

        // Пробуем разные паттерны
        // /api/stream/123
        const streamMatch = urlObj.pathname.match(/\/api\/stream\/(\d+)/)
        if (streamMatch) {
            return parseInt(streamMatch[1])
        }

        // /audio/123
        const audioMatch = urlObj.pathname.match(/\/audio\/(\d+)/)
        if (audioMatch) {
            return parseInt(audioMatch[1])
        }

        // Из query параметров
        const params = new URLSearchParams(urlObj.search)
        if (params.has('id')) {
            return parseInt(params.get('id'))
        }

        return null
    } catch (error) {
        console.error('[SW] Error extracting audio ID:', error)
        return null
    }
}

/**
 * Получает аудио из IndexedDB
 */
async function getAudioFromIndexedDB(audioId) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(AUDIO_DB_NAME, 1)

        request.onerror = () => reject(request.error)

        request.onsuccess = () => {
            const db = request.result

            if (!db.objectStoreNames.contains(AUDIO_STORE_NAME)) {
                resolve(null)
                return
            }

            const transaction = db.transaction(AUDIO_STORE_NAME, 'readonly')
            const store = transaction.objectStore(AUDIO_STORE_NAME)
            const getRequest = store.get(audioId)

            getRequest.onerror = () => reject(getRequest.error)
            getRequest.onsuccess = () => {
                const record = getRequest.result
                resolve(record?.blob || null)
            }
        }
    })
}

/**
 * Обработка Range Requests для поддержки seek в аудио
 */
function handleRangeRequest(request, blob) {
    const rangeHeader = request.headers.get('range')
    const matches = rangeHeader.match(/bytes=(\d+)-(\d*)/)

    if (!matches) {
        return new Response(blob, {
            status: 200,
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': blob.size,
                'Accept-Ranges': 'bytes',
            },
        })
    }

    const start = parseInt(matches[1])
    const end = matches[2] ? parseInt(matches[2]) : blob.size - 1
    const slicedBlob = blob.slice(start, end + 1)

    return new Response(slicedBlob, {
        status: 206,
        statusText: 'Partial Content',
        headers: {
            'Content-Type': 'audio/mpeg',
            'Content-Length': slicedBlob.size,
            'Content-Range': `bytes ${start}-${end}/${blob.size}`,
            'Accept-Ranges': 'bytes',
        },
    })
}

// ========================================
// BACKGROUND SYNC (опционально)
// ========================================

// Можно добавить background sync для заметок/данных
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag)

    if (event.tag === 'sync-notes') {
        event.waitUntil(syncNotes())
    }
})

async function syncNotes() {
    console.log('[SW] Syncing notes...')
    // Логика синхронизации заметок
}

// ========================================
// PUSH NOTIFICATIONS (опционально)
// ========================================

self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received')

    const options = {
        body: event.data?.text() || 'Новое уведомление',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
    }

    event.waitUntil(
        self.registration.showNotification('AudioBook Library', options)
    )
})

console.log('[SW] Service Worker loaded successfully! 🚀')

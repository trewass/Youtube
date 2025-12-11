// Empty Service Worker - removes all caches and unregisters itself

self.addEventListener('install', (event) => {
  console.log('[SW] Installing empty SW to cleanup...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Cleaning up all caches...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[SW] Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('[SW] All caches cleared. Unregistering...');
      return self.registration.unregister();
    }).then(() => {
      console.log('[SW] Cleanup complete. Reloading page...');
      return self.clients.matchAll();
    }).then((clients) => {
      clients.forEach((client) => client.navigate(client.url));
    })
  );
});

// Don't handle any fetch events
self.addEventListener('fetch', (event) => {
  return;
});

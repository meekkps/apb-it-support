/* APB IT Support 2026 - Service Worker
   Cache-first strategy ສຳລັບໄຟລ໌ static, network-first ສຳລັບ API */

const CACHE_NAME = 'apb-it-v1';
const ASSETS = [
  './',
  './APB_IT_Support_2026.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap'
];

// Install: cache ໄຟລ໌ຫຼັກ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch((err) => {
        console.warn('SW: cache.addAll partial fail', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: ລົບ cache ເກົ່າ
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// Fetch: cache-first ສຳລັບ static, network-first ສຳລັບ Supabase
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Supabase API: network-first (ບໍ່ cache)
  if (url.includes('supabase.co') || url.includes('script.google.com')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ offline: true }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((res) => {
        // Cache ໄຟລ໌ໃໝ່ສຳເລັດ
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return res;
      }).catch(() => {
        // Offline ແລະ ບໍ່ມີ cache → return ໜ້າຫຼັກ
        if (event.request.mode === 'navigate') {
          return caches.match('./APB_IT_Support_2026.html');
        }
      });
    })
  );
});

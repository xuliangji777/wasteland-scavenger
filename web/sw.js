const CACHE_NAME = 'moshitu-rpg-v28';
const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/game.js',
  './js/rpg_world.js',
  './js/data.js',
  './js/audio.js',
  './js/fx.js',
  './js/storage.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Lazy runtime cache-first for heavy media under assets/ so initial load is never starved
  if (url.pathname.includes('/assets/')) {
    const isRetry = url.searchParams.has('retry');
    e.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        if (!isRetry) {
          const cached = await cache.match(req, { ignoreSearch: true });
          if (cached) return cached;
        }
        try {
          const res = await fetch(req);
          if (res && res.ok) {
            cache.put(req, res.clone());
          }
          return res;
        } catch (err) {
          const fallback = await cache.match(req, { ignoreSearch: true });
          if (fallback) return fallback;
          throw err;
        }
      })
    );
    return;
  }

  // Network-first for lightweight HTML/CSS/JS shell, falling back to cache offline
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }))
  );
});

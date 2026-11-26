const CACHE_NAME = 'moshitu-rpg-v7';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/data.js',
  './js/audio.js',
  './js/fx.js',
  './js/storage.js',
  './js/rpg_world.js',
  './js/game.js',
  './manifest.json',
  './icon.svg',
  './assets/app_icon.png',
  './assets/bg_town.jpg',
  './assets/bg_wasteland.jpg',
  './assets/bg_ruins.jpg',
  './assets/bg_swamp.jpg',
  './assets/bg_interior.jpg',
  './assets/bg_cave.jpg',
  './assets/bg_battle.jpg',
  './assets/bg_crucible.jpg',
  './assets/portrait_hero.jpg',
  './assets/portrait_laohuang.jpg',
  './assets/portrait_yinshi.jpg',
  './assets/sprites/hero.png',
  './assets/sprites/npc_merchant.png',
  './assets/sprites/npc_hermit.png',
  './assets/sprites/shrine.png',
  './assets/sprites/enemy_beast.png',
  './assets/sprites/enemy_mech.png',
  './assets/sprites/enemy_demon.png',
  './assets/sprites/chest.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
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
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});

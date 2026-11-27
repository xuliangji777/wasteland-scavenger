const CACHE_NAME = 'moshitu-rpg-v21';
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
  './assets/icons_items.png',
  './assets/icons_gear.png',
  './assets/icons_skills.png',
  './assets/bg_town.jpg',
  './assets/bg_wasteland.jpg',
  './assets/bg_ruins.jpg',
  './assets/bg_swamp.jpg',
  './assets/bg_interior.jpg',
  './assets/bg_cave.jpg',
  './assets/bg_battle.jpg',
  './assets/bg_crucible.jpg',
  './assets/bg_worldmap.jpg',
  './assets/bg_armory.jpg',
  './assets/portrait_hero.jpg',
  './assets/portrait_laohuang.jpg',
  './assets/portrait_yinshi.jpg',
  './assets/sprites/wuxing_ink_wheel.png',
  './assets/sprites/capture_ink_vortex.png',
  './assets/sprites/hero.png',
  './assets/sprites/hero_walk.png',
  './assets/sprites/hero_battle.png',
  './assets/sprites/crucible_vessel.png',
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

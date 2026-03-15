/* --- OFFLINE ENGINE: SHADOW CACHE --- */
const CACHE_NAME = 'ledger-shadow-v3';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './lang.js',
    './manifest.json',
    './img/splash.png',
    './img/icon.png'
];

// Instalacja i cache'owanie zasobów
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS_TO_CACHE))
    );
});

// Aktywacja i czyszczenie starego cache'u
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        })
    );
});

// Przechwytywanie zapytań (Strategia: Cache first)
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});

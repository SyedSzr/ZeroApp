const CACHE = 'zero-v3';
const ASSETS = ['/', '/index.html', '/js/data.js', '/js/store.js', '/js/components.js', '/js/screens.js', '/js/app.js', '/manifest.json'];

self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))));
self.addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))));

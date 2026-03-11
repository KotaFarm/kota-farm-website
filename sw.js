// ============================================================
//  Service Worker — Kota Natural Farm
//  Strategy: Cache shell eagerly, images/assets on first visit.
//  Serves cached content when offline; updates cache in background.
// ============================================================

var CACHE_NAME = 'kota-farm-v1';

// App shell — cached on install for instant repeat loads
var SHELL_URLS = [
    '/',
    '/index.html',
    '/produce.html',
    '/css/styles.css',
    '/js/main.js',
    '/gallery-config.js',
    '/plants-config.js',
    '/vegetables-config.js',
    '/site-images/hero-background.jpeg',
    '/site-images/community-workshop.jpeg',
    '/site-images/farm-overview.jpeg'
];

// Install — cache the app shell
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(SHELL_URLS);
        }).then(function() {
            return self.skipWaiting();
        })
    );
});

// Activate — clean up old caches
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(
                keys.filter(function(key) { return key !== CACHE_NAME; })
                    .map(function(key) { return caches.delete(key); })
            );
        }).then(function() {
            return self.clients.claim();
        })
    );
});

// Fetch — stale-while-revalidate for shell, cache-first for assets
self.addEventListener('fetch', function(event) {
    var url = new URL(event.request.url);

    // Only handle same-origin GET requests
    if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

    // For navigation requests (HTML pages) — network first, fallback to cache
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).then(function(response) {
                var clone = response.clone();
                caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, clone); });
                return response;
            }).catch(function() {
                return caches.match(event.request).then(function(cached) {
                    return cached || caches.match('/index.html');
                });
            })
        );
        return;
    }

    // For images/videos — cache first, then network (saves bandwidth)
    if (url.pathname.match(/\.(jpeg|jpg|png|gif|webp|mp4|webm|svg)$/i)) {
        event.respondWith(
            caches.match(event.request).then(function(cached) {
                if (cached) return cached;
                return fetch(event.request).then(function(response) {
                    if (response.ok) {
                        var clone = response.clone();
                        caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, clone); });
                    }
                    return response;
                });
            })
        );
        return;
    }

    // For CSS/JS/config — stale-while-revalidate (fast + fresh)
    event.respondWith(
        caches.match(event.request).then(function(cached) {
            var fetchPromise = fetch(event.request).then(function(response) {
                if (response.ok) {
                    var clone = response.clone();
                    caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, clone); });
                }
                return response;
            });
            return cached || fetchPromise;
        })
    );
});

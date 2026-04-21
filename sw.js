// ============================================================
//  Service Worker — Kota Natural Farm
//  Strategy: Cache shell eagerly, images/assets on first visit.
//  Serves cached content when offline; updates cache in background.
//
//  Bump CACHE_NAME whenever you want every returning visitor to
//  wipe their local cache. Do this after:
//    - A round of image re-encoding (e.g. JPEG → WebP)
//    - A big CSS or JS change that returning visitors must pick up
//    - A change to SHELL_URLS below
// ============================================================

var CACHE_NAME = 'kota-farm-v5';

// App shell — cached on install for instant repeat loads.
//
// These URLs must exist at the exact path listed (service worker will
// fail to install if any 404s), so keep this list conservative — only
// the critical-path assets for the homepage and produce page.
//
// Images here reference .webp versions where available. The originals
// (.jpeg) stay on disk as a fallback for anyone bypassing the SW.
var SHELL_URLS = [
    '/',
    '/index.html',
    '/produce.html',
    '/css/styles.css',
    '/js/main.js',
    '/gallery-config.js',
    '/plants-config.js',
    '/vegetables-config.js',
    '/gallery/the-land/farm-sunset.webp',
    '/site-images/community-workshop.webp',
    '/site-images/farm-overview.webp'
];

// Cap the image cache so a long-browsing visitor doesn't quietly push
// tens of MB into Cache Storage. Images are keyed by full URL, and
// we evict the oldest when we cross the cap. 80 is comfortably more
// than any single session needs (hero + gallery + a blog post).
var IMAGE_CACHE_MAX = 80;

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

    // For images/videos — cache first, then network (saves bandwidth).
    // After caching, prune down to IMAGE_CACHE_MAX entries so we never
    // grow unboundedly on a long browsing session.
    if (url.pathname.match(/\.(jpeg|jpg|png|gif|webp|avif|mp4|webm|svg)$/i)) {
        event.respondWith(
            caches.match(event.request).then(function(cached) {
                if (cached) return cached;
                return fetch(event.request).then(function(response) {
                    if (response.ok) {
                        var clone = response.clone();
                        caches.open(CACHE_NAME).then(function(cache) {
                            cache.put(event.request, clone).then(function() {
                                trimImageCache(cache);
                            });
                        });
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

// Keep the image cache from growing without bound. Called after each
// successful image cache.put(). Cache.keys() returns entries in the
// order they were added, so deleting the first ones evicts the oldest.
function trimImageCache(cache) {
    cache.keys().then(function(keys) {
        var imageKeys = keys.filter(function(req) {
            return /\.(jpeg|jpg|png|gif|webp|avif|mp4|webm|svg)$/i.test(new URL(req.url).pathname);
        });
        var excess = imageKeys.length - IMAGE_CACHE_MAX;
        if (excess <= 0) return;
        for (var i = 0; i < excess; i++) {
            cache.delete(imageKeys[i]);
        }
    });
}

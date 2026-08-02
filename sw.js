const CACHE_NAME = "psstore-v5";

self.addEventListener("install", e => {
    self.skipWaiting();
});

self.addEventListener("activate", e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Network first for everything — no caching of HTML/JS/CSS
// This ensures latest code always loads
self.addEventListener("fetch", e => {
    const url = new URL(e.request.url);

    // Only cache images
    if (url.pathname.startsWith("/images/")) {
        e.respondWith(
            caches.open(CACHE_NAME).then(cache =>
                cache.match(e.request).then(cached =>
                    cached || fetch(e.request).then(res => {
                        cache.put(e.request, res.clone());
                        return res;
                    })
                )
            )
        );
        return;
    }

    // Everything else — network first, no cache
    e.respondWith(fetch(e.request));
});

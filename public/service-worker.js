// Very tiny offline-first cache (static shell)
const CACHE = "static-v1";
const ASSETS = ["/", "/index.html"];

// Install: warm the cache
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first, fallback to cache
self.addEventListener("fetch", (event) => {
  const req = event.request;
  event.respondWith(
    fetch(req).catch(() => caches.match(req).then((res) => res || caches.match("/")))
  );
});

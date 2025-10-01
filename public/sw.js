// Increment this version number whenever you want to force cache refresh
const CACHE_VERSION = "babysteps-v2";
const CACHE_NAME = `${CACHE_VERSION}-${new Date().toISOString().split("T")[0]}`;

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Clean up old caches
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter(
              (name) => name.startsWith("babysteps-") && name !== CACHE_NAME
            )
            .map((name) => caches.delete(name))
        );
      })
      .then(() => clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Don't cache API requests
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Use network-first strategy for HTML pages
  if (event.request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the fresh response
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if offline
          return caches.match(event.request);
        })
    );
    return;
  }

  // Use cache-first for other static assets (images, fonts, etc.)
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      if (cached) {
        // Return cached but fetch in background to update cache
        fetch(event.request)
          .then((response) => {
            if (response.status === 200) {
              cache.put(event.request, response.clone());
            }
          })
          .catch(() => {});
        return cached;
      }
      const response = await fetch(event.request);
      if (
        response.status === 200 &&
        event.request.url.startsWith(self.location.origin)
      ) {
        cache.put(event.request, response.clone());
      }
      return response;
    })
  );
});

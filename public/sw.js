self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", () => {
  clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.open("babysteps-static-v1").then(async (cache) => {
      const cached = await cache.match(event.request);
      if (cached) {
        return cached;
      }
      const response = await fetch(event.request);
      if (response.status === 200 && event.request.url.startsWith(self.location.origin)) {
        cache.put(event.request, response.clone());
      }
      return response;
    })
  );
});

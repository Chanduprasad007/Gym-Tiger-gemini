// Gym Tiger PWA Service Worker for Offline Handling & Installability
const CACHE_NAME = "gym-tiger-v1";
const ASSETS_TO_CACHE = [
  "./",
  "index.html",
  "manifest.json",
  "gym_tiger_icon.svg"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Pre-caching assets...");
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("Removing legacy cache:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  // Bypass external APIs and WebSocket traffic
  const url = e.request.url;
  if (
    e.request.method !== "GET" || 
    url.includes("/api/") || 
    url.includes("firestore.googleapis.com") || 
    url.includes("firebaseinit") ||
    url.includes("browser-sync") ||
    url.includes("/socket.io/") ||
    url.includes("vitest")
  ) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Quietly fail for offline networking issues
      });
    })
  );
});

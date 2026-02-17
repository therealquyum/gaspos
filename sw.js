const CACHE_NAME = "gas-pos-cache-v1";
const urlsToCache = [
  "./",
  "./index.html",
  "./script.js",
  "./manifest.json",
  "./style.css"
];

// Install service worker and cache files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// Activate service worker
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Fetch cached files
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
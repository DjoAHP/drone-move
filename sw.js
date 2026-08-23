/* sw.js — cache l'app shell de DroneMove pour un usage hors ligne */

const CACHE_NAME = "dronemove-shell-v4";
const SHELL_FILES = [
  "./",
  "./index.html?v=3",
  "./style.css",
  "./app.js",
  "./db.js",
  "./manifest.json?v=3",
  "./icons/icon-maskable.svg?v=3"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // On ne met jamais en cache les appels au CDN de JSZip (utilisé seulement à l'export/import) :
  // on tente le réseau, sinon on laisse échouer sans casser le reste de l'app.
  if (req.url.includes("cdn.jsdelivr.net")) {
    event.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }

  if (req.method !== "GET") return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() => cached);
    })
  );
});

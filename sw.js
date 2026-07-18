// ECLIPSE — service worker (offline režim)
const CACHE = "eclipse-v10";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/styles.css",
  "./js/config.js",
  "./js/sun.js",
  "./js/weather.js",
  "./js/eclipse.js",
  "./js/trip.js",
  "./js/store.js",
  "./js/ar.js",
  "./js/views.js",
  "./js/app.js",
  "./assets/cover.jpg",
  "./assets/paper.svg",
  "./assets/favicon-32.png",
  "./assets/icon-180.jpg",
  "./assets/icon-192.jpg",
  "./assets/icon-512.jpg",
  "./assets/icon-maskable-512.jpg"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Cizí původ (počasí API, Supabase, CDN) — jen síť, necachovat.
  if (url.origin !== self.location.origin) return;

  // Aplikační soubory — nejdřív cache, pak síť (a doplň cache).
  e.respondWith(
    caches.match(req).then((cached) => {
      const net = fetch(req).then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});

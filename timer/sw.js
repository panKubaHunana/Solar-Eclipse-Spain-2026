// Hodinové cinknutí — service worker (offline režim + push notifikace)
const CACHE = "hourly-chime-v1";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/styles.css",
  "./js/config.js",
  "./js/app.js",
  "./assets/favicon-32.png",
  "./assets/icon-180.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/icon-maskable-512.png"
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
  if (url.origin !== self.location.origin) return;

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

// ---- Push notifikace ------------------------------------------------
self.addEventListener("push", (e) => {
  let data = { title: "🔔 Celá hodina", body: "Ding! Je " + new Date().toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" }) + "." };
  if (e.data) {
    try { data = { ...data, ...e.data.json() }; } catch (_) { data.body = e.data.text(); }
  }

  const options = {
    body: data.body,
    icon: "./assets/icon-192.png",
    badge: "./assets/favicon-32.png",
    vibrate: [200, 100, 200],
    tag: "hourly-chime",
    renotify: true,
    data: { url: "./index.html" }
  };

  e.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || "./index.html", self.location.href).href;
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const c of clients) {
        if (c.url === url && "focus" in c) return c.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});

// Když prohlížeč sám obnoví push subskripci (např. vypršel klíč), pošli appce
// zprávu, aby mohla novou subskripci zase odeslat na server.
self.addEventListener("pushsubscriptionchange", (e) => {
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      clients.forEach((c) => c.postMessage({ type: "resubscribe" }));
    })
  );
});

/* Cap 110 · Feuille de riz : mise en cache pour l'usage hors ligne.
   Ne met en cache que les fichiers du site lui-même (même origine, requêtes GET). */
const VERSION = "cap110-riz-b7ef28331b";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest?v=b7ef28331b",
  "./style.css?v=b7ef28331b",
  "./data.js?v=b7ef28331b",
  "./art.js?v=b7ef28331b",
  "./app.js?v=b7ef28331b",
  "./instrument-sans-latin-400-normal.woff2",
  "./instrument-sans-latin-500-normal.woff2",
  "./instrument-sans-latin-600-normal.woff2",
  "./instrument-sans-latin-700-normal.woff2",
  "./jetbrains-mono-latin-400-normal.woff2",
  "./jetbrains-mono-latin-500-normal.woff2",
  "./unbounded-latin-500-normal.woff2",
  "./unbounded-latin-600-normal.woff2",
  "./unbounded-latin-700-normal.woff2",
  "./unbounded-latin-800-normal.woff2",
  "./logo.svg?v=b7ef28331b",
  "./favicon-32.png?v=b7ef28331b",
  "./apple-touch-icon.png?v=b7ef28331b",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("cap110-riz-") && k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Pages : réseau d'abord (pour recevoir les mises à jour), cache si hors ligne
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put("./index.html", copy)); }
          return res;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Fichiers versionnés (css, js, polices, icônes) : cache d'abord
  event.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok && res.type === "basic") { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
      return res;
    }))
  );
});

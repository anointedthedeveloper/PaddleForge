const CACHE_NAME = "paddleforge-v2";
const OFFLINE_URL = "/offline.html";

const PRECACHE = [
  "/",
  "/offline.html",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// Install: precache core assets
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// Activate: remove old caches
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for static, network-first for pages
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);

  // Network-first for Next.js page navigations
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
          return res;
        })
        .catch(() =>
          caches.match(e.request).then((cached) => cached || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  // Cache-first for static assets (_next/static, icons, manifest)
  if (
    url.pathname.startsWith("/_next/static") ||
    url.pathname.startsWith("/icons") ||
    url.pathname === "/manifest.json"
  ) {
    e.respondWith(
      caches.match(e.request).then(
        (cached) =>
          cached ||
          fetch(e.request).then((res) => {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
            return res;
          })
      )
    );
    return;
  }

  // Stale-while-revalidate for everything else
  e.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(e.request).then((cached) => {
        const fetched = fetch(e.request).then((res) => {
          cache.put(e.request, res.clone());
          return res;
        }).catch(() => cached);
        return cached || fetched;
      })
    )
  );
});

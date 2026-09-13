/* PadelMatch · Service Worker
 * Estrategia:
 *   - Navegaciones (documentos): network-first con fallback a /offline
 *   - Estaticos de Next (/_next/static): cache-first (inmutables)
 *   - Otros GET same-origin: stale-while-revalidate
 * No cachea llamadas a Supabase ni /api.
 */
const VERSION = "v1";
// La app vive bajo /padelmatch (next.config.mjs -> basePath). El service
// worker no pasa por el router de Next, asi que las rutas van a mano.
const BASE_PATH = "/padelmatch";
const STATIC_CACHE = `pm-static-${VERSION}`;
const RUNTIME_CACHE = `pm-runtime-${VERSION}`;
const OFFLINE_URL = `${BASE_PATH}/offline`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL, `${BASE_PATH}/manifest.webmanifest`])),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => ![STATIC_CACHE, RUNTIME_CACHE].includes(k))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isSupabase(url) {
  return url.hostname.endsWith(".supabase.co") || url.hostname.endsWith(".supabase.in");
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (isSupabase(url) || url.pathname.startsWith("/api/")) return;
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match(OFFLINE_URL))),
    );
    return;
  }

  if (
    url.pathname.startsWith(`${BASE_PATH}/_next/static`) ||
    url.pathname.startsWith(`${BASE_PATH}/icons/`)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(request, copy));
            return res;
          }),
      ),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});

/* Web Push: muestra la notificacion y enfoca/abre la app al tocarla. */
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "PadelMatch", body: event.data.text() };
  }
  event.waitUntil(
    self.registration.showNotification(payload.title || "PadelMatch", {
      body: payload.body || "",
      icon: `${BASE_PATH}/icons/icon-192.png`,
      badge: `${BASE_PATH}/icons/icon-192.png`,
      data: { url: payload.url || BASE_PATH },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || BASE_PATH;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(target) && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(target);
    }),
  );
});

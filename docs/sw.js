// ReCall service worker — installability + an offline shell. Deliberately NETWORK-FIRST.
//
// A cache-first worker on a repo that deploys several times a day is a trap: Margaret's
// phone would keep serving a stale app.js long after a fix shipped, and she has no idea
// what a hard refresh is. So: always try the network, fall back to cache only when the
// network fails. Slightly slower start, never a stuck version.
//
// Photos and Firestore data are NOT cached here — Firestore's own persistent cache
// already handles offline reads.

const CACHE = 'recall-shell-v1';
const SHELL = ['./', './index.html', './styles.css', './app.js', './manifest.webmanifest', './icon-192.png'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Only our own origin. Never intercept Firestore, the AI vendors, or the CDN import map.
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html')))
  );
});

/* Fair Paws service worker: makes the web app work offline after the first visit.
 *
 * - Pages (navigations): network first, so a new deploy is picked up; the last good copy is the fallback.
 * - Everything else from this site (hashed JS, fonts, SQLite wasm, icons): cache first.
 *
 * Bump CACHE when you change unhashed files (icons, manifest) to force a refresh.
 */
const CACHE = 'fairpaws-v1';
const PAGE = '/index.html';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(request.mode === 'navigate' ? networkFirstPage(request) : cacheFirst(request));
});

async function networkFirstPage(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    // Every route is the same single-page shell, so one cached copy serves them all.
    if (response.ok) cache.put(PAGE, response.clone());
    return response;
  } catch {
    return (await cache.match(PAGE)) ?? Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

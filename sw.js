/* BalanceOS service worker.
   Strategy:
   - App code (HTML / JSX / CSS / manifest): NETWORK-FIRST so an online launch
     always gets the latest build; cache is only the offline fallback. This is
     what makes updates actually reach an installed home-screen app.
   - Heavy, rarely-changing files (vendor libs, images, icons): CACHE-FIRST for
     speed; refreshed in the background.
   Bump CACHE on each release so the new worker re-precaches cleanly. */
const CACHE = "balanceos-v28";
const PRECACHE = [
  "./", "index.html", "styles.css", "mobile.css", "app.jsx", "haptics.js",
  "vendor/react.production.min.js", "vendor/react-dom.production.min.js", "vendor/babel.min.js",
  "components/icons.jsx", "components/shell.jsx",
  "screens/home.jsx", "screens/habits.jsx", "screens/community.jsx",
  "screens/profile.jsx", "screens/extra.jsx", "screens/intro.jsx",
  "assets/sphere.png", "assets/sphere-mid.png", "assets/sphere-large.png",
  "assets/sphere-glass.png", "assets/quote-decoration.png",
  "manifest.webmanifest",
  "icons/apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png",
];

// Big, immutable-ish files → cache-first. Everything else → network-first.
const CACHE_FIRST = /\/(vendor|assets|icons)\//;

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(PRECACHE.map((u) => cache.add(u).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  if (new URL(request.url).origin !== self.location.origin) return; // pass through cross-origin

  if (CACHE_FIRST.test(new URL(request.url).pathname)) {
    // Cache-first for heavy assets.
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(request, { ignoreSearch: true });
      if (hit) return hit;
      const res = await fetch(request);
      if (res && res.ok) cache.put(request, res.clone());
      return res;
    })());
    return;
  }

  // Network-first for app code → always fresh when online.
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await fetch(request, { cache: "no-cache" });
      if (res && res.ok) cache.put(request, res.clone());
      return res;
    } catch (err) {
      const hit = await cache.match(request, { ignoreSearch: true });
      if (hit) return hit;
      if (request.mode === "navigate") {
        return (await cache.match("index.html")) || (await cache.match("./"));
      }
      throw err;
    }
  })());
});

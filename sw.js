/* BalanceOS service worker — offline shell + instant relaunch.
   Strategy: stale-while-revalidate for same-origin requests — serve from cache
   immediately (fast, offline-capable) while refreshing the cache in the
   background, so the installed app self-updates when online. Navigations fall
   back to the cached shell when offline. */
const CACHE = "balanceos-v2";
const ASSETS = [
  "./", "index.html", "styles.css", "mobile.css", "app.jsx",
  "vendor/react.production.min.js", "vendor/react-dom.production.min.js", "vendor/babel.min.js",
  "components/icons.jsx", "components/shell.jsx",
  "screens/home.jsx", "screens/habits.jsx", "screens/community.jsx",
  "screens/profile.jsx", "screens/extra.jsx", "screens/intro.jsx",
  "assets/sphere.png", "assets/sphere-mid.png", "assets/sphere-large.png",
  "assets/sphere-glass.png", "assets/quote-decoration.png",
  "manifest.webmanifest",
  "icons/apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Cache each asset independently so one missing file can't abort install.
    await Promise.all(ASSETS.map((u) => cache.add(u).catch(() => {})));
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
  if (new URL(request.url).origin !== self.location.origin) return; // let cross-origin pass through

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request, { ignoreSearch: true });
    const network = fetch(request)
      .then((res) => {
        if (res && res.ok) cache.put(request, res.clone());
        return res;
      })
      .catch(() => null);

    // Serve cache first if present; otherwise wait for the network.
    const fresh = cached || (await network);
    if (fresh) return fresh;

    // Offline + uncached navigation → return the app shell.
    if (request.mode === "navigate") {
      return (await cache.match("index.html")) || (await cache.match("./"));
    }
    return new Response("", { status: 504, statusText: "offline" });
  })());
});

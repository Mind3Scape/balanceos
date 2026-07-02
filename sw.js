/* BalanceOS service worker.
   Strategy:
   - App code (HTML / JSX / CSS / manifest): NETWORK-FIRST so an online launch
     always gets the latest build; cache is only the offline fallback. This is
     what makes updates actually reach an installed home-screen app.
   - Heavy, rarely-changing files (vendor libs, images, icons): CACHE-FIRST for
     speed; refreshed in the background.
   Bump CACHE on each release so the new worker re-precaches cleanly. */
const CACHE = "balanceos-v465";
const PRECACHE = [
  "./", "index.html", "styles.css", "mobile.css", "haptics.js", "telegram.js", "aikey.js", "store.js", "supabase.js", "cloud.js",
  "vendor/react.production.min.js", "vendor/react-dom.production.min.js",
  "vendor/supabase-2.108.2.umd.js",
  // Precompiled UI (no Babel shipped). This list is AUTO-GENERATED from scripts/build.js
  // FILES on every build — do not edit between the markers (a file move would otherwise
  // silently break the offline precache).
  /* BUILD_PRECACHE_START */
  "build/components/icons.js?v=v465",
  "build/components/shell.js?v=v465",
  "build/core/aliases.js?v=v465",
  "build/core/home-kit.js?v=v465",
  "build/core/habits-kit.js?v=v465",
  "build/core/profile-kit.js?v=v465",
  "build/core/community-kit.js?v=v465",
  "build/core/extra-kit.js?v=v465",
  "build/screens/demo/profile.js?v=v465",
  "build/screens/demo/extra.js?v=v465",
  "build/screens/intro.js?v=v465",
  "build/screens/live/economy_live.js?v=v465",
  "build/screens/live/shared_live.js?v=v465",
  "build/screens/live/home_live.js?v=v465",
  "build/screens/live/habits_live.js?v=v465",
  "build/screens/live/profile_live.js?v=v465",
  "build/screens/live/community_live.js?v=v465",
  "build/screens/live/home_extra_live.js?v=v465",
  "build/screens/live/habits_extra_live.js?v=v465",
  "build/screens/live/profile_extra_live.js?v=v465",
  "build/screens/live/community_extra_live.js?v=v465",
  "build/screens/live/extra_live.js?v=v465",
  "build/app.js?v=v465",
  /* BUILD_PRECACHE_END */
  "assets/sphere.png",
  "manifest.webmanifest",
  "icons/apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png",
];

// Big, immutable files (vendor libs, images, icons) → cache-first, ignoring any query.
const CACHE_FIRST = /\/(vendor|assets|icons)\//;
// Precompiled UI: every build/*.js URL carries a ?v=APP_VERSION stamp and is immutable for
// that version, so it's served cache-first KEYED BY THE FULL URL (?v= included). A version
// bump changes the key → automatic cache miss → fresh network fetch, with NO ignoreSearch
// skew that could pair new HTML with stale JS mid-deploy. This removes the per-cold-start
// round-trip these 24 files used to cost under the old network-first rule.
const BUILD_FIRST = /\/build\//;

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

  const path = new URL(request.url).pathname;

  if (BUILD_FIRST.test(path)) {
    // Versioned build/*.js → cache-first, EXACT (version-keyed) match so a new ?v=
    // is a clean miss → fresh fetch, never a stale hit.
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(request);
      if (hit) return hit;
      const res = await fetch(request);
      if (res && res.ok) cache.put(request, res.clone());
      return res;
    })());
    return;
  }

  if (CACHE_FIRST.test(path)) {
    // Cache-first for heavy assets (query-agnostic).
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

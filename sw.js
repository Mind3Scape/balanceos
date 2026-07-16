/* BalanceOS service worker.
   Strategy:
   - App code (HTML / JSX / CSS / manifest): NETWORK-FIRST so an online launch
     always gets the latest build; cache is only the offline fallback. This is
     what makes updates actually reach an installed home-screen app.
   - Heavy, rarely-changing files (vendor libs, images, icons): CACHE-FIRST for
     speed; refreshed in the background.
   Bump CACHE on each release so the new worker re-precaches cleanly. */
const CACHE = "balanceos-v794";
const PRECACHE = [
  "./", "index.html", "styles.css", "mobile.css", "haptics.js", "telegram.js", "aikey.js", "store.js", "supabase.js", "cloud.js",
  "vendor/react.production.min.js", "vendor/react-dom.production.min.js",
  "vendor/supabase-2.108.2.umd.js",
  // Precompiled UI (no Babel shipped). This list is AUTO-GENERATED from scripts/build.js
  // FILES on every build — do not edit between the markers (a file move would otherwise
  // silently break the offline precache).
  /* BUILD_PRECACHE_START */
  "build/components/icons.js?v=v794",
  "build/components/shell.js?v=v794",
  "build/core/aliases.js?v=v794",
  "build/core/confetti.js?v=v794",
  "build/core/home-kit.js?v=v794",
  "build/core/habits-kit.js?v=v794",
  "build/core/profile-kit.js?v=v794",
  "build/core/community-kit.js?v=v794",
  "build/core/extra-kit.js?v=v794",
  "build/screens/demo/profile.js?v=v794",
  "build/screens/demo/extra.js?v=v794",
  "build/screens/intro.js?v=v794",
  "build/screens/live/economy_live.js?v=v794",
  "build/screens/live/shared_live.js?v=v794",
  "build/screens/live/home_live.js?v=v794",
  "build/screens/live/habits_live.js?v=v794",
  "build/screens/live/profile_live.js?v=v794",
  "build/screens/live/community_live.js?v=v794",
  "build/screens/live/circle_room_live.js?v=v794",
  "build/screens/live/habit_standard_live.js?v=v794",
  "build/screens/live/home_extra_live.js?v=v794",
  "build/screens/live/habits_extra_live.js?v=v794",
  "build/screens/live/profile_extra_live.js?v=v794",
  "build/screens/live/community_extra_live.js?v=v794",
  "build/screens/live/extra_live.js?v=v794",
  "build/app.js?v=v794",
  /* BUILD_PRECACHE_END */
  "assets/sphere.png",
  // Лица-мемоджи в precache («секунда на лицах»): activate стирает старый кэш целиком, и без этого
  // списка после КАЖДОГО релиза аватарки ехали по сети заново на «Я»/Друзьях/Вселенной.
  "assets/people/m1.png", "assets/people/m2.png", "assets/people/m3.png", "assets/people/m4.png", "assets/people/m5.png", "assets/people/m6.png",
  "assets/people/m7.png", "assets/people/m8.png", "assets/people/m9.png", "assets/people/m10.png", "assets/people/m11.png", "assets/people/m12.png",
  "assets/people/m13.png", "assets/people/m14.png", "assets/people/m15.png", "assets/people/m16.png", "assets/people/m17.png", "assets/people/m18.png",
  "manifest.webmanifest",
  "icons/apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png",
];

// Big, immutable files (vendor libs, images, icons) → cache-first, ignoring any query.
const CACHE_FIRST = /\/(vendor|assets|icons)\//;
// Precompiled UI: every build/*.js URL carries a ?v=APP_VERSION stamp. Served
// stale-while-revalidate (see fetch handler): the cached copy paints instantly, while a
// background refetch keeps the cache honest so a stale first fetch can't pin old code.
const BUILD_FIRST = /\/build\//;

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // {cache:"reload"} bypasses the browser HTTP cache so a fresh SW never precaches a
    // stale copy the browser was still holding (one source of "version bumped but the
    // screen didn't"). CDN-edge staleness is separately covered by SWR in fetch below.
    await Promise.all(PRECACHE.map((u) =>
      fetch(u, { cache: "reload" }).then((res) => { if (res && res.ok) return cache.put(u, res); }).catch(() => {})
    ));
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
    // Versioned build/*.js → STALE-WHILE-REVALIDATE. Serve the cached copy instantly (fast
    // cold start), but ALWAYS refetch in the background and overwrite the cache. This
    // self-heals the case where the very first fetch of a ?v= URL hit a stale CDN edge and
    // pinned old bytes: the next launch's background refresh (CDN now fresh) replaces them,
    // so a version bump can no longer leave one screen stuck on old code. Conditional
    // requests make an unchanged file a cheap 304, so the cost is negligible.
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(request);
      const net = fetch(request, { cache: "no-cache" }).then((res) => {
        if (res && res.ok) cache.put(request, res.clone());
        return res;
      }).catch(() => null);
      return hit || (await net) || fetch(request);
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

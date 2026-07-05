/* Precompile the in-browser JSX → plain JS so the app ships NO Babel Standalone
   (3 MB) and does ZERO runtime compilation.

   Faithfulness to the old in-browser setup (Babel Standalone ran each script via
   global eval): top-level `function`/`var` must stay GLOBAL so files can share
   them (e.g. SysCard defined in profile.jsx, used in community.jsx), while
   `const`/`let` must NOT collide across files (shell.jsx and app.jsx both do
   `const {useState}=React`). We reproduce that by (a) loading each build/*.js as
   a plain GLOBAL <script> (no IIFE), and (b) transform-block-scoping → const/let
   become `var` (redeclaration is allowed, and they still go global). JSX only —
   async/arrows are left intact (no regenerator), since target browsers support them.

   Run before each deploy:  node scripts/build.js  */
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const Babel = require(path.join(root, "vendor", "babel.min.js"));

// Same order as the old <script> tags in index.html.
const FILES = [
  "components/icons.jsx", "components/shell.jsx",
  // core/ — the NEUTRAL shared toolkit (no demo/live branching). Loads after the
  // framework, before any screen that uses it, so both demos AND the live app share ONE copy.
  "core/aliases.jsx",
  "core/home-kit.jsx", "core/habits-kit.jsx", "core/profile-kit.jsx",
  "core/community-kit.jsx", "core/extra-kit.jsx",
  "screens/demo/home.jsx", "screens/demo/habits.jsx", "screens/demo/community.jsx",
  "screens/demo/profile.jsx", "screens/demo/extra.jsx", "screens/intro.jsx",
  // live-only forks of the mode-aware bricks (the *Live versions) — load before the
  // live screens that call them. economy_live = the forked LIVE gamification economy
  // (XP / levels / achievements); MUST load before every live screen that reads it.
  "screens/live/economy_live.jsx",
  "screens/live/shared_live.jsx",
  "screens/live/home_live.jsx",
  "screens/live/habits_live.jsx",
  "screens/live/profile_live.jsx",
  "screens/live/community_live.jsx",
  "screens/live/home_extra_live.jsx",
  "screens/live/habits_extra_live.jsx",
  "screens/live/profile_extra_live.jsx",
  "screens/live/community_extra_live.jsx",
  "screens/live/extra_live.jsx",
  "app.jsx",
];

let total = 0;
for (const f of FILES) {
  const src = fs.readFileSync(path.join(root, f), "utf8");
  const out = Babel.transform(src, {
    presets: ["react"],
    plugins: ["transform-block-scoping"],   // const/let → var: global, no cross-file collisions
    // Э4: compact+без комментариев = −40% байт на ПАРС каждого холодного старта Telegram.
    // Имена НЕ минифицируются (глобальная схема var/function между файлами не тронута).
    compact: true,
    comments: false,
  }).code + "\n";
  const outPath = path.join(root, "build", f.replace(/\.jsx$/, ".js"));
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, out);
  total += out.length;
  console.log("built", f, "→ build/" + f.replace(/\.jsx$/, ".js"), "(" + out.length + " B)");
}
console.log("done —", FILES.length, "files,", (total / 1024).toFixed(0), "KB total (no Babel shipped)");

// Cache-bust: stamp index.html's build/*.js URLs with the current APP_VERSION so a
// new deploy can NEVER be served stale from an HTTP / Telegram-webview cache.
const appSrc = fs.readFileSync(path.join(root, "app.jsx"), "utf8");
const ver = (appSrc.match(/APP_VERSION\s*=\s*"(v\d+)"/) || [])[1] || "v0";
let html = fs.readFileSync(path.join(root, "index.html"), "utf8");
html = html.replace(/(src="build\/[^"?]+\.js)(\?v=[^"]*)?"/g, `$1?v=${ver}"`);
// Also stamp the root stylesheets + config/runtime scripts (NOT the vendored libs — those
// are immutable & version-pinned in their filename — and NOT build/* which is handled above)
// so a deploy can't be served stale from a plain HTTP / webview cache on the no-SW path either.
const ROOT_STAMPED = ["styles.css", "mobile.css", "telegram.js", "aikey.js", "supabase.js", "store.js", "cloud.js", "haptics.js"];
for (const f of ROOT_STAMPED) {
  const esc = f.replace(/\./g, "\\.");
  html = html.replace(new RegExp(`((?:src|href)="${esc})(\\?v=[^"]*)?"`, "g"), `$1?v=${ver}"`);
}
fs.writeFileSync(path.join(root, "index.html"), html);
console.log("stamped index.html build + root URLs with", ver);

// Same cache-bust for the service worker. Its CACHE name is the version it purges on
// activate — if it never moves, the install/activate re-precache never fires and a bad
// deploy can be served stale offline. Stamp it from APP_VERSION every build too.
let sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
sw = sw.replace(/const CACHE = "balanceos-[^"]*";/, `const CACHE = "balanceos-${ver}";`);
// Regenerate the build/*.js precache list straight from FILES, so moving/adding a source
// file can NEVER leave a stale or missing offline-cache entry behind.
// The lazy demo bundle (home/habits/community) is injected on demand by loadDemoBundle()
// in shell.jsx, so it's NOT precached — a live-only user never downloads it. (The SW still
// caches each file on its first demo-entry fetch via the build/* cache-first rule.)
// Keep this list in sync with loadDemoBundle's file list in components/shell.jsx.
const LAZY_DEMO = ["screens/demo/home.jsx", "screens/demo/habits.jsx", "screens/demo/community.jsx"];
// Stamp the precache entries with ?v=${ver} too, so they match the version-keyed
// cache-first lookup in sw.js EXACTLY (the SW serves build/*.js by full URL incl. ?v=).
const precacheBlock = FILES.filter((f) => !LAZY_DEMO.includes(f)).map((f) => `  "build/${f.replace(/\.jsx$/, ".js")}?v=${ver}",`).join("\n");
sw = sw.replace(
  /\/\* BUILD_PRECACHE_START \*\/[\s\S]*?\/\* BUILD_PRECACHE_END \*\//,
  `/* BUILD_PRECACHE_START */\n${precacheBlock}\n  /* BUILD_PRECACHE_END */`
);
fs.writeFileSync(path.join(root, "sw.js"), sw);
console.log("stamped sw.js CACHE with", ver, "+ regenerated precache (" + FILES.length + " build files)");

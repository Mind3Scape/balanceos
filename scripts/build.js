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
  "core/home-kit.jsx", "core/habits-kit.jsx", "core/profile-kit.jsx",
  "core/community-kit.jsx", "core/extra-kit.jsx",
  "screens/home.jsx", "screens/habits.jsx", "screens/community.jsx",
  "screens/profile.jsx", "screens/extra.jsx", "screens/intro.jsx",
  // live-only forks of the mode-aware bricks (the *Live versions) — load before the
  // live screens that call them.
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
    compact: false,
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
fs.writeFileSync(path.join(root, "index.html"), html);
console.log("stamped index.html build URLs with", ver);

// Same cache-bust for the service worker. Its CACHE name is the version it purges on
// activate — if it never moves, the install/activate re-precache never fires and a bad
// deploy can be served stale offline. Stamp it from APP_VERSION every build too.
let sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
sw = sw.replace(/const CACHE = "balanceos-[^"]*";/, `const CACHE = "balanceos-${ver}";`);
fs.writeFileSync(path.join(root, "sw.js"), sw);
console.log("stamped sw.js CACHE with", ver);

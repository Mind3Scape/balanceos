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
  "screens/home.jsx", "screens/habits.jsx", "screens/community.jsx",
  "screens/profile.jsx", "screens/extra.jsx", "screens/intro.jsx",
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

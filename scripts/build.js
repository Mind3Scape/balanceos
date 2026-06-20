/* Precompile the in-browser JSX → plain JS so the app ships NO Babel Standalone
   (3 MB) and does ZERO runtime compilation. Each file is wrapped in an IIFE to
   reproduce Babel-Standalone's per-script isolation (files share only via the
   `window` globals they already export), so behaviour is identical — just fast.

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
  const out = Babel.transform(src, { presets: ["react"], compact: false }).code;
  const wrapped = "(function(){\n" + out + "\n})();\n";
  const outPath = path.join(root, "build", f.replace(/\.jsx$/, ".js"));
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, wrapped);
  total += wrapped.length;
  console.log("built", f, "→ build/" + f.replace(/\.jsx$/, ".js"), "(" + wrapped.length + " B)");
}
console.log("done —", FILES.length, "files,", (total / 1024).toFixed(0), "KB total (no Babel shipped)");

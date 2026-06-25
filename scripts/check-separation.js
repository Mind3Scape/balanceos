/* check-separation.js — automated test of the live↔demo wall.
   Fails if any file in core/ or screens/live/ references a top-level name that is
   defined ONLY in screens/demo/ (i.e. live would depend on the demo product).
   Catches every binding form: function / const / let / var AND destructuring
   (`const { useState: useHS } = React`) AND array destructuring.

   Run:  node scripts/check-separation.js   (exit 0 = wall intact, exit 1 = leak)
   Layers:
     framework  components/*, screens/intro.jsx, app.jsx  — shared engine (fine to use)
     core/      neutral shared toolkit                     — fine to use
     screens/live/  the live product
     screens/demo/  the demo product (frozen)              — live must NOT reach here */
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(root, f), "utf8");
const ls = d => fs.existsSync(path.join(root, d))
  ? fs.readdirSync(path.join(root, d)).filter(f => f.endsWith(".jsx")).map(f => d + "/" + f) : [];

const FRAMEWORK = ["components/icons.jsx", "components/shell.jsx", "screens/intro.jsx", "app.jsx"];
const CORE = ls("core");
const LIVE = ls("screens/live");
const DEMO = ls("screens/demo");

const ANCHOR = /^(?:async\s+)?function\s+([A-Za-z0-9_$]+)|^(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*[=;]/;
function topDefs(src) {
  const s = new Set();
  for (const l of src.split("\n")) {
    let m = l.match(ANCHOR);
    if (m) { s.add(m[1] || m[2]); continue; }
    m = l.match(/^(?:const|let|var)\s*\{([^}]*)\}/);        // object destructure
    if (m) { m[1].split(",").forEach(p => { const nm = (p.split(":")[1] || p.split(":")[0]).trim().replace(/\s.*$/, ""); if (/^[A-Za-z_$][\w$]*$/.test(nm)) s.add(nm); }); continue; }
    m = l.match(/^(?:const|let|var)\s*\[([^\]]*)\]/);         // array destructure
    if (m) { m[1].split(",").forEach(p => { const nm = p.trim(); if (/^[A-Za-z_$][\w$]*$/.test(nm)) s.add(nm); }); }
  }
  return s;
}
function tokens(src) {
  const noComments = src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");
  return new Set(noComments.match(/[A-Za-z_$][A-Za-z0-9_$]*/g) || []);
}

const fw = new Set(), core = new Set(), live = new Set(), demo = new Map();
for (const f of FRAMEWORK) for (const n of topDefs(read(f))) fw.add(n);
for (const f of CORE) for (const n of topDefs(read(f))) core.add(n);
for (const f of LIVE) for (const n of topDefs(read(f))) live.add(n);
for (const f of DEMO) for (const n of topDefs(read(f))) if (!demo.has(n)) demo.set(n, f);

const demoOnly = new Map();
for (const [n, f] of demo) if (!fw.has(n) && !core.has(n) && !live.has(n)) demoOnly.set(n, f);

const leaks = [];
for (const f of [...CORE, ...LIVE]) {
  const tk = tokens(read(f));
  for (const n of tk) if (demoOnly.has(n)) leaks.push(f + "  →  " + n + "  (defined only in " + demoOnly.get(n) + ")");
}

if (!leaks.length) {
  console.log("✅ wall intact — core/ and screens/live/ reference NO demo-only name (" + demoOnly.size + " demo-only names checked).");
  process.exit(0);
} else {
  console.log("❌ " + leaks.length + " LEAK(S) — live/core reach into demo:");
  for (const l of [...new Set(leaks)]) console.log("   " + l);
  process.exit(1);
}

/* Cinematic onboarding for BalanceOS.
   ONE protagonist: a Siri-style glass orb (you). It changes size + inner mist color
   with each scene. Decorative layers cross-fade around it. Particles persist. */

var {
  useState: useIS,
  useEffect: useIE,
  useRef: useIR,
  useMemo: useIM
} = React;
function useT() {
  var [t, setT] = useIS(0);
  useIE(() => {
    var raf,
      s = performance.now();
    var tick = now => {
      setT((now - s) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return t;
}

/* ─── SIRI ORB ────────────────────────────────────────────────────
   Glassy translucent sphere with internal swirling mist (3 colored
   blobs orbiting + gooey blur) and a clean specular highlight.
   Color tint comes from `tint` (an array of 3 colors). Size from `r`. */
var __ORB_ID = 0;
function SiriOrb({
  r,
  tint,
  t,
  intensity = 1
}) {
  var uid = useIM(() => "orb" + ++__ORB_ID, []);
  t = typeof t === "number" && isFinite(t) ? t : 0; // guard against NaN time
  var breath = 1 + Math.sin(t * 0.9) * 0.025;
  var R = (typeof r === "number" && isFinite(r) ? r : 34) * breath;

  // Soft internal lights — radial-gradient discs (feathered, NO SVG filter).
  // Each blob slowly CYCLES through the state's palette at its own phase, so the
  // colours continuously blend and mix inside the orb (Siri-style living fluid).
  // Vivid analogous flow palette from the state's main hue → blobs show DISTINCT
  // colours that drift and mix (Siri-style living fluid), not one flat tone.
  var main = tint && tint[1] || "#7aa4d0";
  var lite = tint && tint[0] || "#cfe1ff";
  var flow = [hueShift(main, 30), lite, hueShift(main, -34), hueShift(main, 66), main];
  var FN = flow.length;
  var DN = 5;
  var discs = Array.from({
    length: DN
  }, (_, i) => {
    var ci = (i + t * 0.16) % FN; // colours slowly rotate through the blobs
    var a = Math.floor(ci),
      f = ci - a;
    return {
      col: lerpColor(flow[a % FN], flow[(a + 1) % FN], f),
      rad: R * (0.44 + 0.16 * Math.sin(i * 1.7 + 0.5)),
      ox: Math.cos(t * (0.34 + i * 0.07) + i * 1.7) * R * 0.27,
      oy: Math.sin(t * (0.41 + i * 0.05) + i * 2.3) * R * 0.25
    };
  });
  var coreX = Math.cos(t * 0.4) * R * 0.07;
  var coreY = Math.sin(t * 0.33) * R * 0.07;
  // the heart of the orb also cycles hue, so the whole orb visibly shifts colour
  var cc = (t * 0.13 % FN + FN) % FN,
    ca = Math.floor(cc);
  var coreMid = lerpColor(flow[ca % FN], flow[(ca + 1) % FN], cc - ca);
  return /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("clipPath", {
    id: uid + "-clip"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "0",
    cy: "0",
    r: R * 0.98
  })), /*#__PURE__*/React.createElement("radialGradient", {
    id: uid + "-glass",
    cx: "35%",
    cy: "30%",
    r: "80%"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "rgba(255,255,255,0.5)"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "55%",
    stopColor: "rgba(255,255,255,0.04)"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "rgba(0,0,0,0.28)"
  })), /*#__PURE__*/React.createElement("linearGradient", {
    id: uid + "-base",
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#46557a"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#27324c"
  })), /*#__PURE__*/React.createElement("radialGradient", {
    id: uid + "-rim",
    cx: "50%",
    cy: "50%",
    r: "50%"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "80%",
    stopColor: "rgba(255,255,255,0)"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "96%",
    stopColor: "rgba(255,255,255,0.45)"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "rgba(255,255,255,0)"
  })), /*#__PURE__*/React.createElement("radialGradient", {
    id: uid + "-aura",
    cx: "50%",
    cy: "50%",
    r: "50%"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: tint[0],
    stopOpacity: 0.5 * intensity
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "60%",
    stopColor: tint[1],
    stopOpacity: 0.14 * intensity
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: tint[2],
    stopOpacity: "0"
  })), /*#__PURE__*/React.createElement("radialGradient", {
    id: uid + "-core",
    cx: "50%",
    cy: "50%",
    r: "58%"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: tint[0],
    stopOpacity: "0.97"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "38%",
    stopColor: coreMid,
    stopOpacity: "0.82"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: tint[2],
    stopOpacity: "0"
  })), discs.map((d, i) => /*#__PURE__*/React.createElement("radialGradient", {
    key: i,
    id: `${uid}-d${i}`,
    cx: "50%",
    cy: "50%",
    r: "50%"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: d.col,
    stopOpacity: "0.92"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: d.col,
    stopOpacity: "0"
  }))), /*#__PURE__*/React.createElement("radialGradient", {
    id: uid + "-spec",
    cx: "50%",
    cy: "50%",
    r: "50%"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#fff",
    stopOpacity: "0.72"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#fff",
    stopOpacity: "0"
  }))), /*#__PURE__*/React.createElement("circle", {
    cx: "0",
    cy: "0",
    r: R * 3.6,
    fill: `url(#${uid}-aura)`
  }), /*#__PURE__*/React.createElement("g", {
    clipPath: `url(#${uid}-clip)`
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "0",
    cy: "0",
    r: R,
    fill: `url(#${uid}-base)`
  }), discs.map((d, i) => /*#__PURE__*/React.createElement("circle", {
    key: i,
    cx: d.ox,
    cy: d.oy,
    r: d.rad,
    fill: `url(#${uid}-d${i})`
  })), /*#__PURE__*/React.createElement("circle", {
    cx: coreX,
    cy: coreY,
    r: R * 0.98,
    fill: `url(#${uid}-core)`
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "0",
    cy: "0",
    r: R,
    fill: `url(#${uid}-glass)`
  })), /*#__PURE__*/React.createElement("circle", {
    cx: "0",
    cy: "0",
    r: R,
    fill: `url(#${uid}-rim)`
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "0",
    cy: "0",
    r: R,
    fill: "none",
    stroke: "rgba(255,255,255,0.08)",
    strokeWidth: "0.5"
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: -R * 0.30,
    cy: -R * 0.40,
    rx: R * 0.34,
    ry: R * 0.22,
    fill: `url(#${uid}-spec)`
  }), /*#__PURE__*/React.createElement("circle", {
    cx: -R * 0.22,
    cy: -R * 0.34,
    r: R * 0.055,
    fill: "#fff",
    opacity: "0.92"
  }));
}

/* ─── STATE ORB (reusable) ────────────────────────────────────────
   The exact same glass orb as onboarding, packaged for use elsewhere
   (e.g. the Home state widget) so the product reads as one object.
   Derives a 3-stop inner-mist tint from a single mood color. */
function tintFromMood(hex) {
  var h = hex && hex[0] === "#" && hex.length >= 7 ? hex : "#7AA4D0";
  var p = [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  var mix = (a, b, k) => Math.round(a + (b - a) * k);
  var toHex = arr => "#" + arr.map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("");
  var light = toHex(p.map(v => mix(v, 255, 0.60)));
  var deep = toHex(p.map((v, i) => mix(v, [16, 26, 46][i], 0.60)));
  return [light, h, deep];
}
function StateOrb({
  size = 76,
  tint,
  intensity = 1.15
}) {
  var t = useT();
  var R = 34;
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "-58 -58 116 116",
    width: size,
    height: size,
    style: {
      overflow: "visible",
      display: "block"
    }
  }, /*#__PURE__*/React.createElement(SiriOrb, {
    r: R,
    tint: tint,
    t: t,
    intensity: intensity
  }));
}

/* Static, non-animated glass orb — same look, frozen at `seed`. Cheap to
   render many (e.g. the 7-day mood trail). Clipped to a clean circle. */
function StaticOrb({
  size = 22,
  tint,
  seed = 0,
  intensity = 0.25
}) {
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "-42 -42 84 84",
    width: size,
    height: size,
    style: {
      overflow: "hidden",
      borderRadius: "50%",
      display: "block"
    }
  }, /*#__PURE__*/React.createElement(SiriOrb, {
    r: 34,
    tint: tint,
    t: seed,
    intensity: intensity
  }));
}

/* ─── PARTICLES ──────────────────────────────────────────────── */
var PARTICLE_COUNT = 32;
function useParticles() {
  return useIM(() => Array.from({
    length: PARTICLE_COUNT
  }, (_, i) => ({
    i,
    seed: Math.random() * 1000,
    hue: i % 5
  })), []);
}
function targetFor(mode, p, t, R) {
  var a0 = p.i / PARTICLE_COUNT * Math.PI * 2 + p.seed * 0.001;
  switch (mode) {
    case "awake":
      {
        var r = 100 + p.i * 37 % 50 - t * 5 % 25;
        return [Math.cos(a0 + t * 0.05) * Math.max(R + 20, r), Math.sin(a0 + t * 0.05) * Math.max(R + 20, r), 1];
      }
    case "comfort":
      {
        var stragglers = p.i % 5 === 0;
        var rr = stragglers ? 120 : R + 24 + Math.sin(t * 0.8 + p.seed) * 2;
        return [Math.cos(a0 + t * 0.18) * rr, Math.sin(a0 + t * 0.18) * rr, stragglers ? 0.4 : 1];
      }
    case "state":
      {
        var baseR = R + 12 + p.i % 6 * 14;
        var wave = Math.sin(t * 1.6 - baseR * 0.05) * 8;
        var _rr = baseR + wave;
        return [Math.cos(a0 + t * 0.08) * _rr, Math.sin(a0 + t * 0.08) * _rr, 1];
      }
    case "compound":
      {
        var phase = (p.i * 0.18 + t * 0.18) % 1;
        var _rr2 = 130 - phase * (130 - R - 4);
        var a = a0 + phase * Math.PI * 2;
        return [Math.cos(a) * _rr2, Math.sin(a) * _rr2, 0.4 + (1 - phase) * 0.9];
      }
    case "together":
      {
        var k = p.i % 4;
        var cs = [[0, 0], [Math.cos(t * 0.35) * 85, Math.sin(t * 0.35) * 85], [Math.cos(t * 0.35 + 2.1) * 95, Math.sin(t * 0.35 + 2.1) * 70], [Math.cos(t * 0.35 + 4.2) * 80, Math.sin(t * 0.35 + 4.2) * 95]];
        var [cx, cy] = cs[k];
        var lr = 14 + p.i % 3 * 5;
        var la = a0 * 3 + t * 0.7;
        return [cx + Math.cos(la) * lr, cy + Math.sin(la) * lr, 0.7];
      }
    default:
      {
        var _rr3 = R + 12 + p.i % 7 * 3 + Math.sin(t + p.seed) * 2;
        return [Math.cos(a0 + t * 0.4) * _rr3, Math.sin(a0 + t * 0.4) * _rr3, 0.55];
      }
  }
}
function ParticleField({
  mode,
  t,
  prevMode,
  blend,
  R,
  dark = true
}) {
  var ps = useParticles();
  var colors = dark ? ["#ffffff", "#cfe1ff", "#9bbfe8", "#7aa4d0", "#e6eeff"] : ["#3f5f8a", "#4f7bb0", "#6f9ad1", "#345070", "#5e8fbf"];
  return /*#__PURE__*/React.createElement("g", null, ps.map(p => {
    var [tx, ty, op] = targetFor(mode, p, t, R);
    var x = tx,
      y = ty,
      o = op;
    if (prevMode && blend < 1) {
      var [px, py, pop] = targetFor(prevMode, p, t, R);
      x = px + (tx - px) * blend;
      y = py + (ty - py) * blend;
      o = pop + (op - pop) * blend;
    }
    var c = colors[p.hue];
    return /*#__PURE__*/React.createElement("g", {
      key: p.i
    }, /*#__PURE__*/React.createElement("circle", {
      cx: x,
      cy: y,
      r: 2.4,
      fill: c,
      opacity: o * 0.35,
      style: {
        filter: "blur(3px)"
      }
    }), /*#__PURE__*/React.createElement("circle", {
      cx: x,
      cy: y,
      r: 1,
      fill: c,
      opacity: Math.min(1, o)
    }));
  }));
}

/* ─── DECOR LAYERS ──────────────────────────────────────────────── */
/* Shared "possibilities" beyond the comfort zone — dim & out of reach in the
   weak-state scene, lit & reachable once the state grows strong. */
var POSS = [{
  a: 0.4,
  r: 122
}, {
  a: 1.7,
  r: 134
}, {
  a: 3.0,
  r: 118
}, {
  a: 4.3,
  r: 130
}, {
  a: 5.6,
  r: 124
}];
function LayerComfort({
  t,
  alpha,
  R,
  dark = true
}) {
  if (alpha <= 0) return null;
  var zoneR = R + 28;
  var zoneFill = dark ? "rgba(150,175,210,0.055)" : "rgba(70,110,160,0.06)";
  var boundary = dark ? "rgba(255,255,255,0.32)" : "rgba(40,70,110,0.30)";
  var possC = dark ? "#93a6c0" : "#8398b5";
  return /*#__PURE__*/React.createElement("g", {
    opacity: alpha
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "0",
    cy: "0",
    r: zoneR,
    fill: zoneFill
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "0",
    cy: "0",
    r: zoneR,
    fill: "none",
    stroke: boundary,
    strokeWidth: "1",
    strokeDasharray: "3 5"
  }), POSS.map((p, i) => {
    var x = Math.cos(p.a + t * 0.04) * p.r,
      y = Math.sin(p.a + t * 0.04) * p.r;
    return /*#__PURE__*/React.createElement("circle", {
      key: i,
      cx: x,
      cy: y,
      r: "3",
      fill: possC,
      opacity: "0.3"
    });
  }));
}
function LayerState({
  t,
  alpha,
  dark = true
}) {
  if (alpha <= 0) return null;
  var wave = dark ? "rgba(180,210,255,0.6)" : "rgba(70,130,200,0.55)";
  var boundary = dark ? "rgba(180,210,255,0.38)" : "rgba(70,130,200,0.4)";
  var halo = dark ? "#bfe0ff" : "#7fb4ec";
  var core = dark ? "#dcefff" : "#2f6fb0";
  return /*#__PURE__*/React.createElement("g", {
    opacity: alpha
  }, [0, 1, 2, 3].map(i => {
    var phase = (t * 0.45 + i * 0.25) % 1;
    var r = 24 + phase * 140;
    return /*#__PURE__*/React.createElement("circle", {
      key: i,
      cx: "0",
      cy: "0",
      r: r,
      fill: "none",
      stroke: wave,
      strokeOpacity: (1 - phase) * 0.9,
      strokeWidth: "1.2"
    });
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "0",
    cy: "0",
    r: "122",
    fill: "none",
    stroke: boundary,
    strokeWidth: "1",
    strokeDasharray: "3 6"
  }), POSS.map((p, i) => {
    var x = Math.cos(p.a + t * 0.04) * p.r,
      y = Math.sin(p.a + t * 0.04) * p.r;
    return /*#__PURE__*/React.createElement("g", {
      key: i
    }, /*#__PURE__*/React.createElement("circle", {
      cx: x,
      cy: y,
      r: "9",
      fill: halo,
      opacity: "0.2",
      style: {
        filter: "blur(4px)"
      }
    }), /*#__PURE__*/React.createElement("circle", {
      cx: x,
      cy: y,
      r: "3.4",
      fill: core,
      opacity: "0.95"
    }));
  }));
}
function LayerCompound({
  t,
  alpha,
  dark = true
}) {
  if (alpha <= 0) return null;
  var stroke = dark ? "rgba(180,210,255,0.22)" : "rgba(60,110,180,0.30)";
  return /*#__PURE__*/React.createElement("g", {
    opacity: alpha
  }, [0, 1].map(arm => {
    var d = "";
    for (var i = 0; i < 110; i++) {
      var k = i / 110;
      var a = arm * Math.PI + k * Math.PI * 4 + t * 0.18;
      var r = 130 * (1 - k);
      d += (i === 0 ? "M" : "L") + (Math.cos(a) * r).toFixed(1) + " " + (Math.sin(a) * r).toFixed(1) + " ";
    }
    return /*#__PURE__*/React.createElement("path", {
      key: arm,
      d: d,
      fill: "none",
      stroke: stroke,
      strokeWidth: "1"
    });
  }));
}
function LayerTogether({
  t,
  alpha,
  dark = true
}) {
  if (alpha <= 0) return null;
  // Three companions held at FIXED points around you (top, lower-left,
  // lower-right) — they breathe gently in place instead of whirling chaotically,
  // each linked to the centre by a clean line. (Memoji faces land here next.)
  // Young, hatless companions — each a memoji set INSIDE a glass orb (cohesive
  // with your central orb), the trio slowly orbiting around you.
  // One guy + two women (one in glasses), young & hatless. They float cleanly
  // with just a soft glow + a link to you — no hard orb frames or outlines.
  var TOP = -Math.PI / 2;
  var PICS = ["./assets/people/m13.png", "./assets/people/m2.png", "./assets/people/m5.png"];
  var friends = (dark ? ["#cfe1ff", "#9bbfe8", "#a9c4e8"] : ["#5a85bd", "#4f7bb0", "#6f9ad1"]).map((c, i) => ({
    c,
    pic: PICS[i],
    a: TOP + i * (Math.PI * 2 / 3)
  }));
  return /*#__PURE__*/React.createElement("g", {
    opacity: alpha
  }, friends.map((f, i) => {
    var rr = 95 + Math.sin(t * 0.9 + i * 2.1) * 4; // gentle breathing
    var ang = f.a + t * 0.08; // slow orbit around you
    var x = Math.cos(ang) * rr,
      y = Math.sin(ang) * rr;
    return /*#__PURE__*/React.createElement("g", {
      key: i
    }, /*#__PURE__*/React.createElement("line", {
      x1: "0",
      y1: "0",
      x2: x,
      y2: y,
      stroke: f.c,
      strokeOpacity: dark ? 0.32 : 0.38,
      strokeWidth: "1"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: x,
      cy: y,
      r: "22",
      fill: f.c,
      opacity: dark ? 0.2 : 0.24,
      style: {
        filter: "blur(8px)"
      }
    }), /*#__PURE__*/React.createElement("image", {
      href: f.pic,
      x: x - 23,
      y: y - 23,
      width: "46",
      height: "46",
      preserveAspectRatio: "xMidYMid meet"
    }));
  }));
}

/* Habit ecosystem — chaotic ellipses, mono blue */
var HABITS = [{
  e: "🏃",
  c: "#cfe1ff",
  a: 78,
  b: 55,
  tilt: 0.15,
  period: 5.5,
  ph: 0.0
}, {
  e: "🧘",
  c: "#b5d0ee",
  a: 95,
  b: 95,
  tilt: 0.00,
  period: 8.0,
  ph: 1.2
}, {
  e: "📚",
  c: "#9bbfe8",
  a: 110,
  b: 42,
  tilt: -0.40,
  period: 6.2,
  ph: 2.4
}, {
  e: "🥗",
  c: "#dde8f7",
  a: 60,
  b: 88,
  tilt: 0.70,
  period: 4.4,
  ph: 3.6
}, {
  e: "🙏",
  c: "#7aa4d0",
  a: 120,
  b: 70,
  tilt: -0.90,
  period: 9.0,
  ph: 4.8
}, {
  e: "✍️",
  c: "#cfe1ff",
  a: 70,
  b: 70,
  tilt: 0.30,
  period: 3.6,
  ph: 0.6
}, {
  e: "💧",
  c: "#a6c6e8",
  a: 100,
  b: 38,
  tilt: 1.20,
  period: 7.1,
  ph: 1.8
}, {
  e: "🥊",
  c: "#e6eeff",
  a: 50,
  b: 105,
  tilt: -0.20,
  period: 5.0,
  ph: 3.0
}];
function habitPos(h, t) {
  var theta = t / h.period * Math.PI * 2 + h.ph;
  var x0 = Math.cos(theta) * h.a,
    y0 = Math.sin(theta) * h.b;
  var co = Math.cos(h.tilt),
    si = Math.sin(h.tilt);
  return [x0 * co - y0 * si, x0 * si + y0 * co];
}
function LayerHabits({
  t,
  alpha,
  dark = true
}) {
  if (alpha <= 0) return null;
  var orbit = dark ? "rgba(255,255,255,0.05)" : "rgba(40,70,110,0.10)";
  var nodeFill = dark ? "rgba(10,18,32,0.92)" : "#ffffff";
  return /*#__PURE__*/React.createElement("g", {
    opacity: alpha
  }, HABITS.map((h, i) => /*#__PURE__*/React.createElement("ellipse", {
    key: "o" + i,
    cx: "0",
    cy: "0",
    rx: h.a,
    ry: h.b,
    transform: `rotate(${(h.tilt * 180 / Math.PI).toFixed(1)})`,
    fill: "none",
    stroke: orbit,
    strokeWidth: "1",
    strokeDasharray: "1 4"
  })), HABITS.map((h, i) => {
    var stamps = [];
    for (var s = 1; s <= 6; s++) {
      var [tx, ty] = habitPos(h, t - s * 0.08);
      stamps.push(/*#__PURE__*/React.createElement("circle", {
        key: "t" + i + s,
        cx: tx,
        cy: ty,
        r: 3 - s * 0.25,
        fill: h.c,
        opacity: 0.4 - s * 0.06,
        style: {
          filter: "blur(1.2px)"
        }
      }));
    }
    return /*#__PURE__*/React.createElement("g", {
      key: "tr" + i
    }, stamps);
  }), HABITS.map((h, i) => {
    var [x, y] = habitPos(h, t);
    return /*#__PURE__*/React.createElement("g", {
      key: "h" + i
    }, /*#__PURE__*/React.createElement("circle", {
      cx: x,
      cy: y,
      r: "15",
      fill: h.c,
      opacity: "0.20",
      style: {
        filter: "blur(5px)"
      }
    }), /*#__PURE__*/React.createElement("circle", {
      cx: x,
      cy: y,
      r: "12",
      fill: nodeFill,
      stroke: h.c,
      strokeOpacity: "0.7",
      strokeWidth: "1"
    }), /*#__PURE__*/React.createElement("text", {
      x: x,
      y: y + 4.5,
      textAnchor: "middle",
      fontSize: "12"
    }, h.e));
  }));
}

/* ─── STAGE ─────────────────────────────────────────────────────── */
/* Per-mode orb behaviour: size + tint colors for inner mist */
var SCENE = {
  awake: {
    size: 40,
    intensity: 0.85,
    tint: ["#dbe6f6", "#7aa4d0", "#2c4d76"]
  },
  comfort: {
    size: 26,
    intensity: 0.40,
    tint: ["#aebccd", "#5f7088", "#171f2c"]
  },
  state: {
    size: 54,
    intensity: 1.35,
    tint: ["#cfe8ff", "#5ea8e8", "#1f4a78"]
  },
  compound: {
    size: 56,
    intensity: 1.0,
    tint: ["#dde8f7", "#8fb5dc", "#1f3a60"]
  },
  together: {
    size: 54,
    intensity: 0.95,
    tint: ["#cfe1ff", "#a6c0e2", "#2a4670"]
  },
  habits: {
    size: 52,
    intensity: 1.1,
    tint: ["#cfe1ff", "#7aa4d0", "#1a2c48"]
  },
  mood: {
    size: 56,
    intensity: 0.62,
    tint: ["#e8f0ff", "#9bbfe8", "#2c4d76"]
  }
};
function lerp(a, b, k) {
  return a + (b - a) * k;
}
function lerpArr(a, b, k) {
  return a.map((v, i) => lerp(v, b[i], k));
}
function lerpColor(a, b, k) {
  // hex like "#rrggbb" — tolerate bad inputs so a stray undefined never crashes
  if (!a || typeof a !== "string" || a[0] !== "#" || a.length < 7) a = "#7aa4d0";
  if (!b || typeof b !== "string" || b[0] !== "#" || b.length < 7) b = "#7aa4d0";
  if (!isFinite(k)) k = 0;
  var pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
  var pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
  var m = lerpArr(pa, pb, k).map(v => Math.round(v).toString(16).padStart(2, "0")).join("");
  return "#" + m;
}
// Rotate a hex colour's hue by `deg` degrees (keeps S/L) — used to build a vivid
// analogous palette inside the orb so its colours visibly differ and mix.
function hueShift(hex, deg) {
  if (!hex || typeof hex !== "string" || hex[0] !== "#" || hex.length < 7) return "#7aa4d0";
  var r = parseInt(hex.slice(1, 3), 16) / 255,
    g = parseInt(hex.slice(3, 5), 16) / 255,
    b = parseInt(hex.slice(5, 7), 16) / 255;
  var mx = Math.max(r, g, b),
    mn = Math.min(r, g, b);
  var h,
    s,
    l = (mx + mn) / 2;
  if (mx === mn) {
    h = s = 0;
  } else {
    var d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h /= 6;
  }
  h = (h + deg / 360) % 1;
  if (h < 0) h += 1;
  var hk = (p, q, x) => {
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  var R, G, B;
  if (s === 0) {
    R = G = B = l;
  } else {
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s,
      p = 2 * l - q;
    R = hk(p, q, h + 1 / 3);
    G = hk(p, q, h);
    B = hk(p, q, h - 1 / 3);
  }
  var to = v => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, "0");
  return "#" + to(R) + to(G) + to(B);
}

// Onboarding state slider: a clean rainbow (red → orange → yellow → green → blue)
// paired with a morphing mood face + a native word. Centre = «Ровно». The orb
// takes the colour; the face is the hero. One value 0..1 drives all three.
var MOOD_SPECTRUM_STOPS = ["#FF5A5F", "#FF9F43", "#FFCE3A", "#34C759", "#19B6E8"];
var MOOD_FACES = ["😣", "😞", "😕", "😐", "🙂", "😄", "🤩"];
var MOOD_WORDS = ["Тяжело", "Плохо", "Так себе", "Нормально", "Неплохо", "Хорошо", "Отлично"];
function moodSpectrum(v) {
  var x = Math.max(0, Math.min(1, isFinite(v) ? v : 0.5)) * (MOOD_SPECTRUM_STOPS.length - 1);
  var i = Math.min(MOOD_SPECTRUM_STOPS.length - 2, Math.floor(x));
  return lerpColor(MOOD_SPECTRUM_STOPS[i], MOOD_SPECTRUM_STOPS[i + 1], x - i);
}
function moodBucket(v) {
  return Math.max(0, Math.min(MOOD_FACES.length - 1, Math.floor((isFinite(v) ? v : 0.5) * MOOD_FACES.length)));
}
// Mute a colour heavily toward its own luminance-grey: keeps the hue but strips the
// saturation, so the orb only WHISPERS the mood colour (no multi-hue shimmer/flicker).
function muteGrey(hex, k) {
  var p = [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  var g = p[0] * 0.299 + p[1] * 0.587 + p[2] * 0.114;
  var to = arr => "#" + arr.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
  return to(p.map(v => v + (g - v) * k));
}
function Stage({
  mode,
  prevMode,
  blend,
  dark = true,
  tintOverride
}) {
  var t = useT();
  var cur = SCENE[mode];
  var prev = prevMode ? SCENE[prevMode] : null;
  var k = prev ? blend : 1;
  var size = prev ? lerp(prev.size, cur.size, k) : cur.size;
  var intensity = prev ? lerp(prev.intensity, cur.intensity, k) : cur.intensity;
  // The mood slide drives the orb tint from its slider (so colour morphs live);
  // every other scene keeps its fixed palette. Transitions still blend cleanly.
  var curTint = mode === "mood" && tintOverride ? tintOverride : cur.tint;
  var prevTint = prevMode === "mood" && tintOverride ? tintOverride : prev ? prev.tint : null;
  var tint = prev ? curTint.map((c, i) => lerpColor(prevTint[i], c, k)) : curTint;
  var aComfort = mode === "comfort" ? 1 : prevMode === "comfort" ? 1 - blend : 0;
  var aState = mode === "state" ? 1 : prevMode === "state" ? 1 - blend : 0;
  var aComp = mode === "compound" ? 1 : prevMode === "compound" ? 1 - blend : 0;
  var aTog = mode === "together" ? 1 : prevMode === "together" ? 1 - blend : 0;
  var aHab = mode === "habits" ? 1 : prevMode === "habits" ? 1 - blend : 0;
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "-160 -160 320 320",
    style: {
      width: 320,
      height: 320,
      overflow: "visible",
      transition: "filter 0.6s"
    }
  }, /*#__PURE__*/React.createElement(LayerComfort, {
    t: t,
    alpha: aComfort,
    R: size,
    dark: dark
  }), /*#__PURE__*/React.createElement(LayerState, {
    t: t,
    alpha: aState,
    dark: dark
  }), /*#__PURE__*/React.createElement(LayerCompound, {
    t: t,
    alpha: aComp,
    dark: dark
  }), /*#__PURE__*/React.createElement(LayerTogether, {
    t: t,
    alpha: aTog,
    dark: dark
  }), /*#__PURE__*/React.createElement(LayerHabits, {
    t: t,
    alpha: aHab,
    dark: dark
  }), /*#__PURE__*/React.createElement(ParticleField, {
    mode: mode,
    t: t,
    prevMode: prevMode,
    blend: blend,
    R: size,
    dark: dark
  }), /*#__PURE__*/React.createElement(SiriOrb, {
    r: size,
    tint: tint,
    t: t,
    intensity: intensity
  }));
}

/* StarField bg */
function StarField({
  count = 60,
  opacity = 0.45,
  dark = true
}) {
  var ref = useIR(null);
  useIE(() => {
    if (!ref.current) return;
    var cvs = ref.current;
    var ctx = cvs.getContext("2d");
    var dpr = window.devicePixelRatio || 1;
    var r = cvs.getBoundingClientRect();
    cvs.width = r.width * dpr;
    cvs.height = r.height * dpr;
    var rgb = dark ? "255,255,255" : "90,120,160";
    var stars = Array.from({
      length: count
    }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.2 + 0.3,
      p: Math.random() * Math.PI * 2,
      s: Math.random() * 0.5 + 0.4
    }));
    var raf,
      start = performance.now();
    var draw = now => {
      var t = (now - start) / 1000;
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      stars.forEach(s => {
        var tw = 0.4 + Math.sin(t * s.s + s.p) * 0.6;
        ctx.beginPath();
        ctx.arc(s.x * cvs.width, s.y * cvs.height, s.r * dpr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb},${tw * opacity})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [dark]);
  return /*#__PURE__*/React.createElement("canvas", {
    ref: ref,
    style: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      pointerEvents: "none"
    }
  });
}
function Reveal({
  k,
  children,
  delay = 0,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      animation: `introReveal 0.9s ${delay}s ease both`,
      ...style
    }
  }, children);
}
function IntroScreen() {
  var {
    navigate
  } = useNav();
  var [step, setStep] = useIS(0);
  var [prev, setPrev] = useIS(null);
  var [blendStart, setBlendStart] = useIS(0);
  var t = useT();
  var blend = Math.min(1, (t - blendStart) / 1.2);
  var effectivePrev = blend < 1 ? prev : null;

  // Onboarding state slider: 0 = heavy, 0.5 = base/ровно, 1 = on the rise. The orb
  // tint EASES toward the value each frame so the colour flows instead of snapping.
  var [moodVal, setMoodVal] = useIS(0.78); // start already on «Хорошо» — turn up to «Отлично» or down
  var moodEase = useIR({
    t: 0,
    val: 0.78
  });
  var me = moodEase.current;
  var mdt = Math.max(0, Math.min(0.05, t - me.t));
  me.t = t;
  me.val += (moodVal - me.val) * Math.min(1, mdt * 9);
  var moodTint = tintFromMood(muteGrey(moodSpectrum(me.val), 0.8)); // еле-еле single-hue cast, no shimmer
  var moodMain = moodSpectrum(moodVal); // crisp colour for the track fill
  var moodIdx = moodBucket(moodVal);
  var moodFace = MOOD_FACES[moodIdx];
  var moodWordTxt = MOOD_WORDS[moodIdx];
  var trackRef = useIR(null);
  var moodDrag = useIR(false);
  var lastBucket = useIR(moodBucket(0.78));
  var moodHaptic = () => {
    try {
      if (window.tgHaptic) window.tgHaptic("light");else if (navigator.vibrate) navigator.vibrate(7);
    } catch (_) {}
  };
  // Radial gauge: map a pointer to a value 0..1 along a 180° arc (viewBox 300×172,
  // centre 150,150). Below the centre line snaps to the nearer end. Haptic ticks
  // each time the value crosses into a new state bucket.
  var setMoodFromArc = (clientX, clientY) => {
    var el = trackRef.current;
    if (!el) return;
    var r = el.getBoundingClientRect();
    var sx = (clientX - r.left) / r.width * 300;
    var sy = (clientY - r.top) / r.height * 172;
    var dx = sx - 150,
      dy = 150 - sy;
    var v;
    if (dy <= 0) v = dx < 0 ? 0 : 1;else v = Math.max(0, Math.min(1, 1 - Math.atan2(dy, dx) / Math.PI));
    setMoodVal(v);
    var b = moodBucket(v);
    if (b !== lastBucket.current) {
      lastBucket.current = b;
      moodHaptic();
    }
  };
  var slides = [{
    mode: "awake",
    eyebrow: "Состояние",
    title: "Ты не видишь мир таким, какой он есть",
    sub: "Ты видишь мир таким, в каком состоянии находишься.",
    glow: "rgba(160,200,240,0.46)"
  }, {
    mode: "comfort",
    eyebrow: "Когда сил мало",
    title: "В слабом состоянии мир сжимается",
    sub: "Всё кажется невозможным. Ты живёшь в узком круге привычного — на автопилоте.",
    glow: "rgba(96,120,150,0.34)"
  }, {
    mode: "state",
    eyebrow: "Когда ты наполнен",
    title: "В сильном — раскрывается",
    sub: "Граница раздвигается сама. Ты видишь решения, которые были рядом всё это время.",
    glow: "rgba(160,205,245,0.52)"
  }, {
    mode: "compound",
    eyebrow: "Твой выбор",
    title: "Состоянием можно управлять",
    sub: "Не обстоятельствами, а собой. Большинство отдают этот выбор страхам и чужому мнению — здесь ты учишься выбирать сам.",
    glow: "rgba(180,210,240,0.45)"
  }, {
    mode: "together",
    eyebrow: "Не в одиночку",
    title: "С близкими — пространство шире",
    sub: "Рядом со своими граница раздвигается дальше. Объединяйтесь в команды, делитесь привычками, держите друг друга.",
    glow: "rgba(150,185,225,0.42)"
  }, {
    mode: "mood",
    eyebrow: "Точка отсчёта",
    title: "Как ты сейчас?",
    sub: "Подвинь точку к своему состоянию — отсюда и начнём.",
    glow: "rgba(180,210,240,0.45)"
  }];
  var cur = slides[step];
  var last = step === slides.length - 1;

  // First frame plays on its own meaning. For the first ~2.6s the focus sits on
  // the top line ("ты не видишь мир таким, какой он есть"); then it SWAPS — the
  // top line shrinks to a caption while the bottom line ("…в каком состоянии
  // находишься") grows bold into the headline. The truer line takes over.
  var swapScene = step === 0;
  // First-frame focus swap, driven PER FRAME off the animation clock (no CSS
  // transition on font-size/weight/wrap → no re-rasterisation flicker). `sp`
  // eases 0→1 with zero velocity at both ends (smootherstep), so the scale
  // flows in and gently settles. The morph itself is transform:scale (GPU).
  var clamp01 = x => x < 0 ? 0 : x > 1 ? 1 : x;
  var smootherstep = x => {
    x = clamp01(x);
    return x * x * x * (x * (x * 6 - 15) + 10);
  };
  var SWAP_AT = 2.8,
    SWAP_DUR = 3.1;
  var sp = swapScene ? smootherstep((t - blendStart - SWAP_AT) / SWAP_DUR) : 0;
  var go = next => {
    if (next === step) return;
    setPrev(slides[step].mode);
    setBlendStart(t);
    setStep(next);
  };
  var finish = () => {
    if (window.tgHaptic) {
      try {
        window.tgHaptic("light");
      } catch (e) {}
    }
    navigate("signup");
  };

  // Theme-aware: follows the .theme-light / .theme-dark wrapper from the frame.
  var wrapRef = useIR(null);
  var [dark, setDark] = useIS(true);
  useIE(() => {
    var n = wrapRef.current;
    while (n && !(n.classList && (n.classList.contains("theme-light") || n.classList.contains("theme-dark")))) n = n.parentElement;
    if (n && n.classList.contains("theme-light")) setDark(false);
  }, []);
  var pal = dark ? {
    bg: `radial-gradient(circle at 50% 38%, ${cur.glow} 0%, transparent 55%), radial-gradient(ellipse at 50% 100%, rgba(20,35,60,0.6) 0%, transparent 60%), #060912`,
    title: "#fff",
    sub: "rgba(255,255,255,0.66)",
    eyebrow: "rgba(255,255,255,0.55)",
    eyebrowStrong: "#bcd8ff",
    barOn: "rgba(255,255,255,0.85)",
    barDone: "rgba(255,255,255,0.65)",
    barTrack: "rgba(255,255,255,0.12)",
    btnBg: "#fff",
    btnFg: "#0a0a0a",
    btnShadow: "0 0 40px rgba(255,255,255,0.15)",
    ghost: "rgba(255,255,255,0.5)",
    count: "rgba(255,255,255,0.4)",
    moodBorder: "rgba(255,255,255,0.08)",
    moodText: "#fff",
    moodTile: "rgba(150,190,240,0.10)"
  } : {
    bg: `radial-gradient(circle at 50% 36%, ${cur.glow} 0%, transparent 52%), radial-gradient(ellipse at 50% 104%, rgba(176,202,238,0.6) 0%, transparent 60%), linear-gradient(180deg,#eef2fb 0%,#e2e9f5 100%)`,
    title: "#15233c",
    sub: "rgba(21,35,60,0.62)",
    eyebrow: "rgba(21,35,60,0.5)",
    eyebrowStrong: "#2f5e96",
    barOn: "rgba(21,35,60,0.72)",
    barDone: "rgba(21,35,60,0.5)",
    barTrack: "rgba(21,35,60,0.12)",
    btnBg: "#0f1b2e",
    btnFg: "#fff",
    btnShadow: "0 10px 26px rgba(20,40,80,0.2)",
    ghost: "rgba(21,35,60,0.45)",
    count: "rgba(21,35,60,0.4)",
    moodBorder: "rgba(20,40,80,0.1)",
    moodText: "#15233c",
    moodTile: "rgba(70,120,190,0.07)"
  };
  return /*#__PURE__*/React.createElement("div", {
    ref: wrapRef,
    className: "page-in",
    style: {
      height: "100%",
      color: pal.title,
      position: "relative",
      overflow: "hidden",
      background: pal.bg,
      transition: "background 1.4s ease",
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement(StarField, {
    count: dark ? 60 : 34,
    opacity: dark ? 0.45 : 0.5,
    dark: dark
  }), /*#__PURE__*/React.createElement("div", {
    className: "tap",
    "aria-label": "\u041D\u0430\u0437\u0430\u0434",
    onClick: () => {
      if (step > 0) go(step - 1);
    },
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 120,
      width: "33%",
      zIndex: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "tap",
    "aria-label": "\u0412\u043F\u0435\u0440\u0451\u0434",
    onClick: () => {
      last ? finish() : go(step + 1);
    },
    style: {
      position: "absolute",
      right: 0,
      top: 0,
      bottom: 120,
      width: "33%",
      zIndex: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      padding: "max(72px, calc(var(--tg-top-inset, 0px) + 14px)) 24px 0",
      display: "flex",
      gap: 4,
      zIndex: 2,
      pointerEvents: "none"
    }
  }, slides.map((_, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      flex: 1,
      height: 2.5,
      borderRadius: 999,
      background: i < step ? pal.barDone : pal.barTrack,
      position: "relative",
      overflow: "hidden"
    }
  }, i === step && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: pal.barOn,
      animation: "introBar 5.2s linear forwards"
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "grid",
      placeItems: "center",
      position: "relative",
      zIndex: 2,
      pointerEvents: "none"
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      inset: 0,
      margin: "auto",
      width: 168,
      height: 168,
      borderRadius: "50%",
      border: "1.5px solid " + (dark ? "rgba(180,210,255,0.38)" : "rgba(90,130,190,0.32)"),
      animation: "orbBurst 1.5s 0.25s ease-out both",
      pointerEvents: "none"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      animation: "orbIntro 0.9s cubic-bezier(0.22,0.8,0.32,1) both"
    }
  }, /*#__PURE__*/React.createElement(Stage, {
    mode: cur.mode,
    prevMode: effectivePrev,
    blend: blend,
    dark: dark,
    tintOverride: moodTint
  })), cur.mode === "mood" && /*#__PURE__*/React.createElement("div", {
    key: moodIdx,
    style: {
      position: "absolute",
      inset: 0,
      display: "grid",
      placeItems: "center",
      pointerEvents: "none",
      zIndex: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 50,
      lineHeight: 1,
      animation: "moodFacePop 0.42s cubic-bezier(0.34,1.56,0.64,1) both",
      filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.35))"
    }
  }, moodFace))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      padding: "0 28px",
      textAlign: "center",
      zIndex: 2,
      minHeight: 150,
      pointerEvents: "none"
    }
  }, /*#__PURE__*/React.createElement(Reveal, {
    k: "eb" + step,
    delay: 0.1,
    style: {
      marginBottom: 11
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      fontSize: 11.5,
      letterSpacing: 2.4,
      textTransform: "uppercase",
      fontWeight: 700,
      color: pal.eyebrowStrong
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 5,
      height: 5,
      borderRadius: "50%",
      background: pal.eyebrowStrong,
      boxShadow: `0 0 8px ${pal.eyebrowStrong}`
    }
  }), cur.eyebrow)), swapScene ?
  /*#__PURE__*/
  /* First frame — focus SWAPS from the premise to the truth. Both lines
     are absolutely anchored around the centre (premise grows UP, truth
     grows DOWN), so the gap between them stays put and nothing reflows.
     Each phrase is locked to exactly two lines. */
  React.createElement(Reveal, {
    k: "swap0",
    delay: 0.22
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      height: 132,
      maxWidth: 344,
      margin: "0 auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: "calc(50% + 8px)",
      transformOrigin: "center bottom",
      transform: `scale(${(1 - sp * 0.38).toFixed(4)})`,
      opacity: 1 - sp * 0.58,
      willChange: "transform, opacity",
      fontFamily: "var(--bos-title-font)",
      fontSize: 23,
      fontWeight: 600,
      lineHeight: 1.24,
      letterSpacing: "-0.4px",
      color: pal.title
    }
  }, "\u0422\u044B \u043D\u0435 \u0432\u0438\u0434\u0438\u0448\u044C \u043C\u0438\u0440 \u0442\u0430\u043A\u0438\u043C,", /*#__PURE__*/React.createElement("br", null), "\u043A\u0430\u043A\u043E\u0439 \u043E\u043D \u0435\u0441\u0442\u044C"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      top: "calc(50% + 8px)",
      transformOrigin: "center top",
      transform: `scale(${(0.62 + sp * 0.38).toFixed(4)})`,
      willChange: "transform, opacity",
      fontFamily: "var(--bos-title-font)",
      fontSize: 23,
      fontWeight: 600,
      lineHeight: 1.24,
      letterSpacing: "-0.4px",
      color: pal.title
    }
  }, [["Ты", "видишь", "мир", "таким,"], ["в", "каком", "состоянии", "находишься"]].map((lineWords, li) => /*#__PURE__*/React.createElement("div", {
    key: li
  }, lineWords.map((w, wi) => {
    var idx = (li === 0 ? 0 : 4) + wi;
    var lit = clamp01((sp - idx / 8 * 0.6) / 0.32);
    return /*#__PURE__*/React.createElement("span", {
      key: wi,
      style: {
        opacity: 0.4 + lit * 0.6
      }
    }, wi < lineWords.length - 1 ? w + " " : w);
  })))))) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Reveal, {
    k: "ti" + step,
    delay: 0.25
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--bos-title-font)",
      fontSize: 30,
      fontWeight: 600,
      lineHeight: 1.12,
      letterSpacing: "-0.8px",
      textWrap: "balance",
      maxWidth: 300,
      margin: "0 auto",
      color: pal.title
    }
  }, cur.title)), cur.sub && /*#__PURE__*/React.createElement(Reveal, {
    k: "su" + step,
    delay: 0.45,
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      color: pal.sub,
      lineHeight: 1.55,
      textWrap: "pretty",
      maxWidth: 312,
      margin: "0 auto"
    }
  }, cur.sub)))), cur.mode === "mood" && /*#__PURE__*/React.createElement(Reveal, {
    k: "moodslider",
    delay: 0.5,
    style: {
      position: "relative",
      padding: "2px 24px 0",
      zIndex: 2
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center",
      marginBottom: 2
    }
  }, /*#__PURE__*/React.createElement("div", {
    key: moodIdx,
    style: {
      background: dark ? "rgba(255,255,255,0.1)" : "#fff",
      color: pal.title,
      fontSize: 15,
      fontWeight: 700,
      letterSpacing: "-0.2px",
      padding: "7px 18px",
      borderRadius: 999,
      boxShadow: dark ? "none" : "0 3px 12px rgba(20,40,80,0.12)",
      animation: "moodWordPop 0.32s cubic-bezier(0.34,1.56,0.64,1) both"
    }
  }, moodWordTxt)), /*#__PURE__*/React.createElement("div", {
    ref: trackRef,
    className: "tap",
    onPointerDown: e => {
      moodDrag.current = true;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (_) {}
      setMoodFromArc(e.clientX, e.clientY);
      moodHaptic();
    },
    onPointerMove: e => {
      if (moodDrag.current) setMoodFromArc(e.clientX, e.clientY);
    },
    onPointerUp: () => {
      moodDrag.current = false;
    },
    onPointerCancel: () => {
      moodDrag.current = false;
    },
    style: {
      position: "relative",
      maxWidth: 320,
      margin: "0 auto",
      touchAction: "none",
      cursor: "pointer",
      userSelect: "none",
      WebkitUserSelect: "none"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 300 172",
    style: {
      width: "100%",
      display: "block",
      overflow: "visible"
    }
  }, Array.from({
    length: 15
  }).map((_, i) => {
    var tv = i / 14,
      phi = (1 - tv) * Math.PI,
      c = Math.cos(phi),
      s = Math.sin(phi);
    var near = Math.abs(tv - me.val) < 0.05;
    return /*#__PURE__*/React.createElement("line", {
      key: i,
      x1: 150 + 99 * c,
      y1: 150 - 99 * s,
      x2: 150 + 113 * c,
      y2: 150 - 113 * s,
      stroke: near ? moodMain : dark ? "rgba(255,255,255,0.22)" : "rgba(21,35,60,0.16)",
      strokeWidth: near ? 2.6 : 1.4,
      strokeLinecap: "round"
    });
  }), /*#__PURE__*/React.createElement("path", {
    d: "M 38 150 A 112 112 0 0 1 262 150",
    fill: "none",
    stroke: dark ? "rgba(255,255,255,0.12)" : "rgba(21,35,60,0.09)",
    strokeWidth: "6",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M 38 150 A 112 112 0 0 1 262 150",
    fill: "none",
    stroke: moodMain,
    strokeWidth: "6",
    strokeLinecap: "round",
    strokeDasharray: Math.PI * 112,
    strokeDashoffset: Math.PI * 112 * (1 - me.val)
  }), /*#__PURE__*/React.createElement("circle", {
    cx: 150 + 112 * Math.cos((1 - me.val) * Math.PI),
    cy: 150 - 112 * Math.sin((1 - me.val) * Math.PI),
    r: "16",
    fill: dark ? "#fff" : "#0a0a0a",
    style: {
      filter: "drop-shadow(0 3px 9px rgba(0,0,0,0.28))"
    }
  }), /*#__PURE__*/React.createElement("circle", {
    cx: 150 + 112 * Math.cos((1 - me.val) * Math.PI),
    cy: 150 - 112 * Math.sin((1 - me.val) * Math.PI),
    r: "5",
    fill: moodMain
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      left: "8%",
      bottom: 2,
      fontSize: 18,
      opacity: 0.5,
      pointerEvents: "none"
    }
  }, MOOD_FACES[0]), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      right: "8%",
      bottom: 2,
      fontSize: 18,
      opacity: 0.5,
      pointerEvents: "none"
    }
  }, MOOD_FACES[MOOD_FACES.length - 1]))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      padding: "20px 24px 28px",
      zIndex: 2
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => cur.mode === "mood" || last ? finish() : go(step + 1),
    className: "tap",
    style: {
      width: "100%",
      background: pal.btnBg,
      color: pal.btnFg,
      border: 0,
      borderRadius: 999,
      padding: 16,
      fontSize: 15,
      fontWeight: 600,
      letterSpacing: "-0.1px",
      boxShadow: pal.btnShadow
    }
  }, cur.mode === "mood" ? "Продолжить" : step === 0 ? "Начать" : "Далее"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("signup"),
    className: "tap",
    style: {
      background: "transparent",
      border: 0,
      color: pal.ghost,
      fontSize: 12
    }
  }, "\u041F\u0440\u043E\u043F\u0443\u0441\u0442\u0438\u0442\u044C"))), /*#__PURE__*/React.createElement("style", null, `
        @keyframes introReveal { from { opacity: 0; transform: translateY(14px); filter: blur(6px); } to { opacity: 1; transform: translateY(0); filter: blur(0); } }
        @keyframes introBar { from { width: 0; } to { width: 100%; } }
        @keyframes moodFacePop { 0% { opacity: 0; transform: scale(0.5); } 60% { opacity: 1; transform: scale(1.08); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes moodWordPop { 0% { opacity: 0; transform: scale(0.82) translateY(4px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes orbIntro { 0% { opacity: 0; transform: scale(0.9); } 55% { opacity: 1; } 100% { opacity: 1; transform: scale(1); } }
        @keyframes orbBurst { 0% { opacity: 0.4; transform: scale(0.55); } 70% { opacity: 0.1; } 100% { opacity: 0; transform: scale(1.7); } }
      `));
}
Object.assign(window, {
  IntroScreen,
  SiriOrb,
  StateOrb,
  StaticOrb,
  tintFromMood
});

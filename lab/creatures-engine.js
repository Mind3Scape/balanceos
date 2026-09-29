/* BalanceOS · Существа v8 — движок живых аватаров (ванильный JS, без зависимостей).
   Личность детерминирована seed'ом: форма, цвет, глаза, характер И ФИЗИКА ТЕЛА (жёсткость и
   затухание пружин — желейка колышется, тревожный дёргается, соня тянется). Жизнь спонтанна:
   секвенсор актов с паузами, пружинная физика + баллистика прыжков, саккады глаз, внимание к
   пальцу/курсору, взгляды друг на друга. Эмоции без рта — геометрией век.
   Глаза лежат НА СФЕРЕ: взгляд вбок/вверх = глаза съезжают по поверхности и сжимаются в
   перспективе (дальний сильнее) — отсюда объёмный «грок-взгляд ввысь». */
(function (root) {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var UID = 0;
  var GRAV = 1100;       // гравитация прыжков, юниты viewBox/с²
  var BASE_Y = 4;        // тело чуть ниже центра — место для прыжков и тени
  var PTR_HOLD = 2600;   // сколько внимание держится после последнего касания, мс

  function hash(s) { s = "" + (s == null ? "x" : s); var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }
  function rng(seed) { var h = hash(seed) || 1; return function () { h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0; return h / 4294967296; }; }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function rand(a, b) { return a + (b - a) * Math.random(); }
  function f2(v) { return "" + Math.round(v * 100) / 100; }
  function f3(v) { return "" + Math.round(v * 1000) / 1000; }
  function now() { return (typeof performance !== "undefined" ? performance : Date).now(); }
  function mixHex(a, b, t) {
    var A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16), o = "#";
    for (var s = 16; s >= 0; s -= 8) { var x = (A >> s) & 255, y = (B >> s) & 255, v = Math.round(x + (y - x) * t); o += (v < 16 ? "0" : "") + v.toString(16); }
    return o;
  }
  function reducedMotion() { try { return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); } catch (e) { return false; } }

  // Фирменные градиенты приложения (пилюли David): свет la→lb, тьма da→db; ink — цвет глаз.
  var GRADS = [
    { la: "#F8B5F1", lb: "#FCF2D9", da: "#F3E3F7", db: "#FCF6DD", ink: "#262230" },
    { la: "#F79B85", lb: "#FCEFC5", da: "#F6C3AE", db: "#FCEFC9", ink: "#262230" },
    { la: "#F1AB4D", lb: "#FBF2C3", da: "#F0AC5C", db: "#FBF2C4", ink: "#262230" },
    { la: "#98F5E5", lb: "#C7FDF1", da: "#BFF8EF", db: "#E7FDF2", ink: "#262230" },
    { la: "#93AFF4", lb: "#C5E4FB", da: "#AAC4F8", db: "#DCEDFC", ink: "#262230" },
    { la: "#B7A8F8", lb: "#C2BDFC", da: "#BDB4FB", db: "#CBC5FD", ink: "#262230" },
    { la: "#FA35DF", lb: "#F7C4C4", da: "#F9587F", db: "#F5A469", ink: "#262230" },
    { la: "#A814C8", lb: "#E39763", da: "#C316CB", db: "#E09A76", ink: "#FFFFFF" },
    { la: "#3A1795", lb: "#9C59CF", da: "#272A6E", db: "#C08272", ink: "#FFFFFF" },
    { la: "#1A1D9E", lb: "#2B2FE3", da: "#1D4EDC", db: "#3F6EE0", ink: "#FFFFFF" },
    { la: "#260B58", lb: "#3B1DC9", da: "#0F1B4D", db: "#182A66", ink: "#FFFFFF" },
    { la: "#240A46", lb: "#2F0D55", da: "#220F33", db: "#3D1247", ink: "#FFFFFF" }
  ];
  var INK_L = { a: "#3A3B43", b: "#141519", ink: "#FFFFFF" };
  var INK_D = { a: "#232429", b: "#0B0B0E", ink: "#FFFFFF" };
  function lum(hex) { var n = parseInt(hex.slice(1), 16); return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; }

  /* ── ФОРМЫ — мягкий словарь bloub ── */
  function smoothClosed(pts) {
    var N = pts.length, d = "M" + f2(pts[0][0]) + " " + f2(pts[0][1]);
    for (var j = 0; j < N; j++) {
      var p0 = pts[(j + N - 1) % N], p1 = pts[j], p2 = pts[(j + 1) % N], p3 = pts[(j + 2) % N];
      d += "C" + f2(p1[0] + (p2[0] - p0[0]) / 6) + " " + f2(p1[1] + (p2[1] - p0[1]) / 6) + " " + f2(p2[0] - (p3[0] - p1[0]) / 6) + " " + f2(p2[1] - (p3[1] - p1[1]) / 6) + " " + f2(p2[0]) + " " + f2(p2[1]);
    }
    return d + "Z";
  }
  function polar(rf, n, sx, sy) {
    var pts = [], b = { minX: 1e9, maxX: -1e9, minY: 1e9, maxY: -1e9 };
    for (var i = 0; i < n; i++) {
      var th = (i / n) * Math.PI * 2 - Math.PI / 2, r = rf(th), x = Math.cos(th) * r * sx, y = Math.sin(th) * r * sy;
      pts.push([x, y]);
      if (x < b.minX) b.minX = x; if (x > b.maxX) b.maxX = x; if (y < b.minY) b.minY = y; if (y > b.maxY) b.maxY = y;
    }
    b.d = smoothClosed(pts); return b;
  }
  function stadium(w, h) {
    var d;
    if (h >= w) { var s = h - w; d = "M" + f2(-w) + " " + f2(s) + "L" + f2(-w) + " " + f2(-s) + "A" + f2(w) + " " + f2(w) + " 0 0 1 " + f2(w) + " " + f2(-s) + "L" + f2(w) + " " + f2(s) + "A" + f2(w) + " " + f2(w) + " 0 0 1 " + f2(-w) + " " + f2(s) + "Z"; }
    else { var t = w - h; d = "M" + f2(-t) + " " + f2(-h) + "L" + f2(t) + " " + f2(-h) + "A" + f2(h) + " " + f2(h) + " 0 0 1 " + f2(t) + " " + f2(h) + "L" + f2(-t) + " " + f2(h) + "A" + f2(h) + " " + f2(h) + " 0 0 1 " + f2(-t) + " " + f2(-h) + "Z"; }
    return { d: d, minX: -w, maxX: w, minY: -h, maxY: h };
  }
  function buildShape(r) {
    var pick = function (a, b) { return a + (b - a) * r(); };
    var wp = function (t) { return t[Math.floor(r() * t.length) % t.length]; };
    var shape = wp(["circle", "circle", "pebble", "pebble", "pebble", "squircle", "squircle", "capsule", "cloud", "cloud", "drop", "egg", "bean"]);
    var sx = pick(0.96, 1.05), sy = pick(0.96, 1.05), b, faceY = 0, dxMax = 15.5;
    if (shape === "circle") { var R = pick(32, 34.5); b = polar(function () { return R; }, 28, sx, sy); }
    else if (shape === "egg") { var Re = pick(31, 33.5); b = polar(function (th) { return Re * (1 + 0.1 * Math.sin(th)); }, 32, sx * 0.95, sy * 1.03); faceY = -3; }
    else if (shape === "squircle") { var Rs = pick(31, 33.5), n = pick(3, 4.2); b = polar(function (th) { var c = Math.abs(Math.cos(th)), s = Math.abs(Math.sin(th)); return Rs / Math.pow(Math.pow(c, n) + Math.pow(s, n), 1 / n); }, 40, sx * 0.97, sy * 0.97); }
    else if (shape === "pebble") { var Rp = pick(31, 33.5), a1 = pick(0.05, 0.08), a2 = pick(0.025, 0.05), p1 = pick(0, 6.28), p2 = pick(0, 6.28), k1 = 2 + Math.floor(r() * 2), k2 = 4 + Math.floor(r() * 2); b = polar(function (th) { return Rp * (1 + a1 * Math.sin(k1 * th + p1) + a2 * Math.sin(k2 * th + p2)); }, 28, sx, sy); }
    else if (shape === "capsule") { b = stadium(pick(23, 25.5), pick(33, 35.5)); faceY = -5; dxMax = b.maxX - 10; }
    else if (shape === "bean") { b = stadium(pick(35, 37.5), pick(25.5, 27.5)); faceY = -2; dxMax = 17; }
    else if (shape === "cloud") { var Rc = pick(30.5, 33), ph = pick(0, 6.28), bA = pick(0.09, 0.13); b = polar(function (th) { return Rc * (1 + bA * Math.abs(Math.sin(2.5 * th + ph)) - bA * 0.35); }, 34, sx, sy); }
    else { var Rd = pick(29.5, 31.5), sg = pick(0.42, 0.55), am = pick(0.16, 0.22); b = polar(function (th) { var d0 = Math.atan2(Math.sin(th + Math.PI / 2), Math.cos(th + Math.PI / 2)); return Rd * (1 + am * Math.exp(-(d0 * d0) / (2 * sg * sg))); }, 34, sx, sy); faceY = 4; }
    b.shape = shape; b.faceY = faceY; b.dxMax = dxMax; b.halfW = (b.maxX - b.minX) / 2;
    return b;
  }

  /* ── ХАРАКТЕРЫ: склонности (веса актов), темп, размах, базовое лицо и ФИЗИКА ТЕЛА (k/c). ── */
  var PERSONAS = {
    dreamer:    { name: "Мечтатель",  about: "то и дело уплывает взглядом ввысь", acts: { dreamUp: 6, lookAround: 2, sigh: 1, think: 1, glanceNear: 2 }, k: 90, c: 13, tempo: 0.8, amp: 1.0, base: { up: 0.12 }, blink: 5.5, attn: "follow", attnP: 0.6 },
    joyful:     { name: "Весельчак",  about: "смеётся глазами, скачет и кружится", acts: { laugh: 3, hop: 3, wiggle: 3, spin: 1, glanceNear: 3, dreamUp: 1 }, k: 210, c: 12, tempo: 1.25, amp: 1.15, base: {}, blink: 4, attn: "follow", attnP: 1 },
    curious:    { name: "Любопытный", about: "подаётся вперёд, всё рассматривает", acts: { lean: 4, lookAround: 3, surprise: 2, glanceNear: 4, peek: 2 }, k: 170, c: 15, tempo: 1.15, amp: 1.05, base: {}, blink: 4, attn: "stare", attnP: 1 },
    sleepy:     { name: "Соня",       about: "клюёт носом, зевает, вздрагивает", acts: { doze: 5, yawn: 3, sigh: 1, lookAround: 1 }, k: 55, c: 12, tempo: 0.6, amp: 0.9, base: { up: 0.42, lo: 0.04 }, blink: 7, attn: "follow", attnP: 0.3 },
    skeptic:    { name: "Скептик",    about: "щурится и косится по сторонам", acts: { suspicious: 5, shakeNo: 2, glanceNear: 2, lookAround: 1 }, k: 140, c: 19, tempo: 0.9, amp: 0.85, base: { up: 0.22, lo: 0.08, asym: 0.05 }, blink: 5, attn: "follow", attnP: 0.7 },
    shy:        { name: "Скромняга",  about: "смущается и отводит взгляд", acts: { shy: 5, peek: 3, glanceNear: 1, think: 1 }, k: 120, c: 16, tempo: 1, amp: 0.8, base: { up: 0.1 }, blink: 4, attn: "avoid", attnP: 0.9 },
    proud:      { name: "Гордец",     about: "задирает нос и красуется", acts: { proud: 5, nodYes: 2, dreamUp: 2, lookAround: 1 }, k: 110, c: 17, tempo: 0.8, amp: 1.1, base: { up: 0.26 }, blink: 6, attn: "follow", attnP: 0.5 },
    melancholy: { name: "Меланхолик", about: "грустит, вздыхает, смотрит в пол", acts: { sigh: 5, dreamUp: 2, think: 1, lookAround: 1 }, k: 60, c: 13, tempo: 0.7, amp: 0.9, base: { up: 0.2, tilt: 0.4 }, blink: 5, attn: "follow", attnP: 0.5 },
    nervous:    { name: "Тревожный",  about: "вздрагивает от всего и озирается", acts: { startle: 3, lookAround: 4, shiver: 3, glanceNear: 3 }, k: 320, c: 17, tempo: 1.4, amp: 1, base: { es: 1.06 }, blink: 2.8, attn: "follow", attnP: 1 },
    thinker:    { name: "Мыслитель",  about: "думает, кивает, и вдруг — идея!", acts: { think: 5, nodYes: 2, dreamUp: 2, lookAround: 1 }, k: 100, c: 16, tempo: 0.85, amp: 0.95, base: { up: 0.14, tilt: -0.18 }, blink: 5, attn: "follow", attnP: 0.6 },
    jelly:      { name: "Желейка",    about: "колышется от каждого движения", acts: { jiggle: 5, hop: 2, laugh: 2, glanceNear: 2 }, k: 150, c: 6, tempo: 1.05, amp: 1.05, base: {}, blink: 4.5, attn: "follow", attnP: 0.9 }
  };
  var PERSONA_TABLE = ["dreamer", "dreamer", "joyful", "joyful", "curious", "curious", "sleepy", "skeptic", "shy", "proud", "melancholy", "nervous", "thinker", "thinker", "jelly", "joyful", "curious"];

  /* ── ЭМОЦИИ БЕЗ РТА: up — верхнее веко, lo — нижнее, smile — нижнее веко аркой (улыбка глазами),
     tilt — наклон верхнего века (+ наружу вниз = грусть, − внутрь вниз = сосредоточенность),
     es — размер глаз, asym — один глаз прищурен сильнее. ── */
  var EMO = {
    calm:       { up: 0.06 },
    happy:      { smile: 0.8 },
    laugh:      { smile: 1, es: 1.02 },
    surprised:  { es: 1.32 },
    curious:    { es: 1.12, asym: -0.08 },
    dreamy:     { up: 0.16, es: 1.04 },
    proud:      { up: 0.36, lo: 0.04 },
    focused:    { up: 0.24, lo: 0.06, tilt: -0.65 },
    suspicious: { up: 0.36, lo: 0.2, tilt: -0.15, asym: 0.12 },
    shy:        { up: 0.1, smile: 0.5, tilt: 0.25, es: 0.94 },
    sad:        { up: 0.26, tilt: 0.9, es: 0.96 },
    sleepy:     { up: 0.5, tilt: 0.05 },
    bored:      { up: 0.42, lo: 0.08, tilt: 0.2, asym: 0.05 },
    scared:     { up: 0.04, tilt: 0.6, es: 0.76 }
  };
  var LID = ["up", "lo", "smile", "tilt", "es", "asym"];
  var EYES = { pill: [11.2, 23.5], dot: [17, 17], tall: [9.6, 26], soft: [15, 19] };

  function params(seed, forcePersona) {
    var r = rng(seed);
    var pick = function (a, b) { return a + (b - a) * r(); };
    var wp = function (t) { return t[Math.floor(r() * t.length) % t.length]; };
    var pal = Math.floor(r() * GRADS.length) % GRADS.length;
    var sh = buildShape(r);
    var persona = wp(PERSONA_TABLE);
    if (forcePersona && PERSONAS[forcePersona]) persona = forcePersona;
    var eyeType = wp(["pill", "pill", "pill", "dot", "dot", "tall", "soft"]);
    var E = EYES[eyeType], s = pick(0.95, 1.15);
    var dx = Math.max(Math.min(pick(12, 15.5), sh.dxMax + 1.5), E[0] * s / 2 + 4.8);
    return { seed: seed, pal: pal, sh: sh, persona: persona, eyeType: eyeType, eyeW: E[0], eyeH: E[1], eyeS: s, dx: dx,
      faceY: sh.faceY + pick(-6, -1), tempo: pick(0.86, 1.18), amp: pick(0.86, 1.18),
      lxb: pick(-0.1, 0.1), lyb: pick(-0.08, 0.04), lidb: pick(-0.04, 0.07), side: r() < 0.5 ? -1 : 1, breath: pick(3.8, 5.6) };
  }

  /* ── ГЕОМЕТРИЯ ГЛАЗА С ВЕКАМИ: форма (капсула/эллипс) ∩ верхнее веко (прямая с наклоном)
     ∩ нижнее веко (прямая + арка улыбки); моргание сводит края к линии смыкания. ── */
  function eyePath(cx, cy, w, h, up, lo, smile, tilt, side, blink) {
    var N = 16, hw = w / 2, hh = h / 2, T = [], B = [], i;
    var sE = smile <= 0 ? 0 : smile >= 1 ? 1 : smile * smile * (3 - 2 * smile);   // улыбка включается плавно, без «надкуса»
    for (i = 0; i <= N; i++) {
      var u = -1 + (2 * i) / N, x = cx + u * hw, q = Math.sqrt(Math.max(0, 1 - u * u)), top, bot;
      if (hh >= hw) { top = cy - (hh - hw) - hw * q; bot = cy + (hh - hw) + hw * q; } else { top = cy - hh * q; bot = cy + hh * q; }
      var t = u * side;
      var lu = cy - hh + up * h + tilt * t * 0.42 * h;
      var ll = cy + hh - lo * h;
      var tt = Math.max(top, lu), bb = Math.min(bot, ll);
      // УЛЫБКА ГЛАЗАМИ: низ глаза подтягивается к дуге, параллельной верхнему краю, — получается «^»
      // с утончёнными концами, а не пилюля с выемкой.
      if (sE > 0) { var arc = tt + Math.max(h * 0.36, 2.4) * (0.4 + 0.6 * (1 - u * u)); if (arc < bb) bb += (arc - bb) * Math.sqrt(sE); }
      if (bb < tt) { var m0 = (Math.min(Math.max(lu, top), bot) + Math.max(Math.min(ll, bot), top)) / 2; tt = bb = m0; }
      if (blink > 0) { var m = tt + (bb - tt) * 0.62; tt += (m - tt) * blink; bb += (m - bb) * blink; }
      T.push(x, tt); B.push(x, bb);
    }
    var s = "M" + f2(T[0]) + " " + f2(T[1]);
    for (i = 2; i < T.length; i += 2) s += "L" + f2(T[i]) + " " + f2(T[i + 1]);
    for (i = B.length - 2; i >= 0; i -= 2) s += "L" + f2(B[i]) + " " + f2(B[i + 1]);
    return s + "Z";
  }

  /* ── АКТЫ: цепочки шагов { d: мс, to: цели каналов, emo, kick: импульс скорости, jump: высота, fn }.
     d — направление (±1). Каналы тела масштабируются размахом, взгляд и веки — нет. ── */
  var AMP_CH = { bx: 1, by: 1, rot: 1, sq: 1 };
  var ACTS = {
    idle: function () { return [{ d: rand(1200, 2600), idle: true }]; },
    lookAround: function (c, d) {
      var st = [], n = 2 + Math.floor(Math.random() * 3);
      for (var i = 0; i < n; i++) { d = -d; st.push({ d: rand(180, 260), to: { lx: rand(0.35, 0.95) * d, ly: rand(-0.6, 0.35) } }); st.push({ d: rand(450, 1100) }); }
      st.push({ d: 500, to: { lx: 0, ly: 0 } }); return st;
    },
    dreamUp: function (c, d) { return [
      { d: 180, to: { ly: 0.15, sq: -0.035 } },
      { d: 950, to: { lx: 0.72 * d, ly: -0.9, rot: -5 * d, by: -2.2, sq: 0.035 }, emo: "dreamy" },
      { d: rand(2200, 4200) },
      { d: 750, to: { lx: 0, ly: 0, rot: 0, by: 0, sq: 0 }, emo: "base" }]; },
    lean: function (c, d) { return [
      { d: 200, to: { lx: -0.2 * d, sq: -0.03 } },
      { d: 560, to: { lx: 0.85 * d, ly: -0.1, bx: 5 * d, rot: 9 * d, sq: 0 }, emo: "curious" },
      { d: rand(1300, 2400) },
      { d: 420, to: { lx: 0.1 * d, ly: 0, bx: 1 * d, rot: 2 * d }, emo: "happy" },
      { d: 900 },
      { d: 600, to: { lx: 0, bx: 0, rot: 0 }, emo: "base" }]; },
    hop: function () { return [
      { d: 190, to: { sq: -0.15, by: 2 } },
      { d: 10, to: { sq: 0, by: 0 }, jump: 12, emo: "happy" },
      { d: 700 },
      { d: 600, emo: "base" }]; },
    laugh: function (c, d) { return [
      { d: 140, emo: "laugh", to: { sq: -0.05 } },
      { d: 300, to: { sq: 0 }, jump: 4.5 },
      { d: 300, jump: 4 },
      { d: 340, jump: 3.2 },
      { d: 380, to: { rot: 5 * d } },
      { d: 380, to: { rot: -4 * d } },
      { d: 700, to: { rot: 0 }, emo: "happy" },
      { d: 700, emo: "base" }]; },
    wiggle: function (c, d) {
      var st = [{ d: 160, emo: "happy" }];
      for (var i = 0; i < 4; i++) st.push({ d: 230, to: { rot: (i % 2 ? -1 : 1) * 10 * d, bx: (i % 2 ? -1 : 1) * 2.5 * d, sq: i % 2 ? 0.03 : -0.03 } });
      st.push({ d: 500, to: { rot: 0, bx: 0, sq: 0 } }); st.push({ d: 800, emo: "base" }); return st;
    },
    spin: function (c, d) { return [
      { d: 200, to: { sq: -0.14, by: 1.5 }, emo: "happy" },
      { d: 10, to: { sq: 0, by: 0, rot: 360 * d }, jump: 9 },
      { d: 900 },
      { d: 10, fn: function (c) { c.unwrapRot(); } },
      { d: 700, emo: "base" }]; },
    surprise: function (c, d) { return [
      { d: 10, emo: "surprised", jump: 5, to: { lx: 0.15 * d, ly: -0.1 } },
      { d: rand(900, 1500) },
      { d: 10, fn: function (c) { c.forceBlink(); } },
      { d: 500, to: { lx: 0, ly: 0 }, emo: "base" }]; },
    startle: function (c, d) { return [
      { d: 10, emo: "surprised", kick: { rot: 160 * d, sq: -1.2 }, to: { lx: 0.8 * d } },
      { d: 170, to: { lx: -0.8 * d } },
      { d: 170, to: { lx: 0.6 * d }, kick: { rot: -140 * d } },
      { d: 220, to: { lx: 0 } },
      { d: 10, fn: function (c) { c.forceBlink(true); } },
      { d: 900, emo: "base" }]; },
    shiver: function () {
      var st = [{ d: 10, emo: "scared" }];
      for (var i = 0; i < 5; i++) st.push({ d: 70, kick: { rot: (i % 2 ? -1 : 1) * 120 } });
      st.push({ d: 600 }); st.push({ d: 500, emo: "base" }); return st;
    },
    doze: function (c, d) { return [
      { d: 1300, emo: "sleepy", to: { ly: 0.2 } },
      { d: 1900, to: { up: 0.88, rot: 7 * d, by: 2, sq: -0.04, ly: 0.35 } },
      { d: rand(900, 2000) },
      { d: 10, emo: "surprised", to: { rot: -2 * d, by: 0, sq: 0, ly: 0 }, jump: 3 },
      { d: 380, to: { lx: -0.6 * d } },
      { d: 380, to: { lx: 0.5 * d } },
      { d: 600, to: { lx: 0, rot: 0 }, emo: "base" }]; },
    yawn: function (c, d) { return [
      { d: 900, to: { sq: 0.15, by: -1.5, rot: -3 * d, up: 0.96, ly: -0.3 } },
      { d: 500 },
      { d: 420, to: { sq: -0.05, by: 0.5, rot: 0, ly: 0 }, emo: "sleepy" },
      { d: 700, to: { sq: 0, by: 0 } },
      { d: 700, emo: "base" }]; },
    sigh: function (c, d) { return [
      { d: 1200, emo: "sad", to: { ly: 0.55, lx: 0.3 * d, sq: -0.05, by: 1.5 } },
      { d: rand(1400, 2400) },
      { d: 600, to: { sq: 0.06, by: -0.5 } },
      { d: 900, to: { sq: -0.06, by: 1.8 } },
      { d: 900, to: { sq: 0, by: 0, ly: 0, lx: 0 }, emo: "base" }]; },
    suspicious: function (c, d) { return [
      { d: 600, emo: "suspicious", to: { lx: 0.78 * d, bx: -2 * d, rot: -3 * d } },
      { d: rand(1400, 2200) },
      { d: 260, to: { lx: -0.78 * d, bx: 2 * d, rot: 3 * d } },
      { d: rand(900, 1500) },
      { d: 600, to: { lx: 0, bx: 0, rot: 0 }, emo: "base" }]; },
    shy: function (c, d) { return [
      { d: 700, emo: "shy", to: { lx: 0.55 * d, ly: 0.5, sq: -0.06, by: 1.5, rot: 4 * d } },
      { d: rand(1300, 2200) },
      { d: 220, to: { lx: 0, ly: 0.05 } },
      { d: 520 },
      { d: 300, to: { lx: 0.6 * d, ly: 0.45 } },
      { d: 900 },
      { d: 700, to: { lx: 0, ly: 0, sq: 0, by: 0, rot: 0 }, emo: "base" }]; },
    peek: function (c, d) { return [
      { d: 420, to: { lx: 0.95 * d, bx: 7 * d, rot: 10 * d, ly: -0.1 }, emo: "curious" },
      { d: rand(1100, 1800) },
      { d: 220, to: { lx: 0, bx: 0, rot: 0, ly: 0 } },
      { d: 10, fn: function (c) { c.forceBlink(); } },
      { d: 500, emo: "base" }]; },
    proud: function (c, d) { return [
      { d: 700, emo: "proud", to: { sq: 0.07, by: -1.5, rot: -3 * d, ly: -0.35, lx: 0.2 * d } },
      { d: rand(2000, 3200) },
      { d: 700, to: { sq: 0, by: 0, rot: 0, ly: 0, lx: 0 }, emo: "base" }]; },
    think: function (c, d) { return [
      { d: 550, emo: "focused", to: { lx: 0.55 * d, ly: -0.55 } },
      { d: rand(1200, 1900) },
      { d: 600, to: { lx: -0.3 * d, ly: -0.62 } },
      { d: rand(900, 1500) },
      { d: 200, to: { by: 1.8, ly: 0, lx: 0 } },
      { d: 200, to: { by: 0 } },
      { d: 10, emo: "happy", jump: 3.5, to: { ly: -0.15 } },
      { d: 1000 },
      { d: 600, to: { ly: 0 }, emo: "base" }]; },
    nodYes: function () { return [
      { d: 10, emo: "happy" },
      { d: 190, to: { by: 2.5, rot: 2, ly: 0.25 } }, { d: 190, to: { by: 0, rot: 0, ly: 0 } },
      { d: 190, to: { by: 2.5, rot: 2, ly: 0.25 } }, { d: 300, to: { by: 0, rot: 0, ly: 0 } },
      { d: 700, emo: "base" }]; },
    shakeNo: function (c, d) { return [
      { d: 10, emo: "suspicious" },
      { d: 150, to: { rot: -8 * d, lx: 0.4 * d } }, { d: 150, to: { rot: 8 * d, lx: -0.4 * d } },
      { d: 150, to: { rot: -6 * d, lx: 0.3 * d } }, { d: 150, to: { rot: 5 * d, lx: -0.25 * d } },
      { d: 400, to: { rot: 0, lx: 0 } }, { d: 600, emo: "base" }]; },
    jiggle: function (c, d) { return [
      { d: 10, emo: "happy", kick: { sq: 1.6 } }, { d: 260, kick: { sq: -1.5 } }, { d: 260, kick: { sq: 1.3 } },
      { d: 300, kick: { rot: 90 * d } }, { d: 900 }, { d: 600, emo: "base" }]; },
    glanceNear: function (c, d) {
      var other = c.pickNeighbor();
      if (!other) return ACTS.lookAround(c, d);
      return [
        { d: 10, fn: function (c) { c.lookAtCreature(other); if (Math.random() < 0.6) other.notice(c); } },
        { d: rand(1100, 2000) },
        { d: 500, to: { lx: 0, ly: 0, rot: 0 } }];
    },
    // реакции на касание
    tapCurious: function () { return [{ d: 10, emo: "surprised", jump: 4, to: { lx: 0, ly: 0 } }, { d: 700 }, { d: 500, emo: "happy", to: { sq: 0.05, by: -1 } }, { d: 900 }, { d: 600, to: { sq: 0, by: 0 }, emo: "base" }]; },
    tapShy: function (c, d) { return [{ d: 10, emo: "surprised", kick: { sq: -1 } }, { d: 240 }].concat(ACTS.shy(c, d)); },
    wake: function (c, d) { return [{ d: 10, emo: "surprised", jump: 5, to: { rot: 0, by: 0, ly: 0 } }, { d: 350, to: { lx: -0.6 * d } }, { d: 350, to: { lx: 0.6 * d } }, { d: 400, to: { lx: 0 } }, { d: 10, fn: function (c) { c.forceBlink(true); } }, { d: 700, emo: "base" }]; },
    tapSkeptic: function (c, d) { return [{ d: 400, emo: "suspicious", to: { lx: 0, ly: 0, bx: -2 * d, rot: -4 * d } }, { d: 1400 }, { d: 600, to: { bx: 0, rot: 0 }, emo: "base" }]; },
    cheer: function () { return [{ d: 10, emo: "happy", jump: 3 }, { d: 1400 }, { d: 900, emo: "base" }]; },
    idea: function () { return [{ d: 10, emo: "surprised", jump: 6, to: { ly: -0.4 } }, { d: 500 }, { d: 10, emo: "happy" }, { d: 1100 }, { d: 600, to: { ly: 0 }, emo: "base" }]; },
    tapDream: function (c, d) { return [{ d: 10, fn: function (c) { c.forceBlink(true); } }, { d: 400, emo: "happy" }, { d: 700 }].concat(ACTS.dreamUp(c, d)); }
  };
  var REACT = { joyful: "laugh", curious: "tapCurious", shy: "tapShy", nervous: "startle", sleepy: "wake", skeptic: "tapSkeptic", proud: "proud", melancholy: "cheer", thinker: "idea", jelly: "jiggle", dreamer: "tapDream" };
  var EPS = { bx: 0.03, by: 0.03, rot: 0.05, sq: 0.001, lx: 0.002, ly: 0.002, up: 0.002, lo: 0.002, smile: 0.002, tilt: 0.003, es: 0.001, asym: 0.002, sacx: 0.002, sacy: 0.002 };

  /* ── СУЩЕСТВО ── */
  function Creature(host, seed, o) {
    this.host = host; this.o = o || {}; this.size = this.o.size || 56;
    this.p = params(seed, this.o.persona);
    this.P = PERSONAS[this.p.persona];
    this.tempo = this.P.tempo * this.p.tempo; this.amp = this.P.amp * this.p.amp;
    this.live = !!this.o.animate && !reducedMotion();
    this.uid = ++UID;
    this.makeChannels();
    var b = this.P.base || {};
    this.base = { up: clamp((b.up || 0) + this.p.lidb, 0, 0.7), lo: b.lo || 0, smile: b.smile || 0, tilt: b.tilt || 0, es: b.es || 1, asym: b.asym || 0 };
    this.tgt = { bx: 0, by: 0, rot: 0, sq: 0, lx: 0, ly: 0, sacx: 0, sacy: 0 };
    this.setEmo("base", true);
    var t = now();
    this.queue = []; this.inIdle = true; this.air = false; this.blinkT = -1; this.blinkQ = 0; this.blinkDur = 150;
    this.nextBlink = t + rand(400, 3500); this.nextSac = t + rand(300, 1500); this.stepEnd = t + rand(200, 2600);
    this.visible = true; this.rect = null; this.rectAt = 0; this.sleeping = false; this.wakeAt = 0; this.lastT = t; this.last = {};
    this.build();
    this.render(t);
    if (this.live) register(this);
  }
  var CP = Creature.prototype;
  CP.makeChannels = function () {
    var P = this.P, t = this.tempo, ch = {};
    var kb = P.k * t, cb = P.c * Math.sqrt(t);
    var kl = Math.max(160, P.k * 2.4) * t, cl = 2 * Math.sqrt(kl) * 0.78;
    var kd = 260 * t, cd = 2 * Math.sqrt(kd) * 0.92;
    function mk(k, c) { return { x: 0, v: 0, t: 0, k: k, c: c }; }
    ch.bx = mk(kb, cb); ch.by = mk(kb, cb); ch.rot = mk(kb, cb); ch.sq = mk(kb * 1.3, cb * 0.9);
    ch.lx = mk(kl, cl); ch.ly = mk(kl, cl);
    for (var i = 0; i < LID.length; i++) ch[LID[i]] = mk(kd, cd);
    ch.sacx = mk(900, 55); ch.sacy = mk(900, 55);
    this.ch = ch; this.keys = Object.keys(ch);
  };
  CP.setEmo = function (name, instant, fromAct) {
    var lock = this.o.emotion && EMO[this.o.emotion];
    var e = lock || (name === "base" || !EMO[name] ? this.base : EMO[name]);
    if (fromAct) this.actEmo = name;
    for (var i = 0; i < LID.length; i++) {
      var k = LID[i], v = e[k] == null ? (k === "es" ? 1 : 0) : e[k];
      if (k === "up" && !lock && name !== "base") v = clamp(v + this.p.lidb * 0.5, 0, 1);
      // круглые глаза с опущенным веком читаются «недовольно» — им веко легче
      if (k === "up" && (this.p.eyeType === "dot" || this.p.eyeType === "soft")) v *= 0.65;
      this.tgt[k] = v;
      if (instant) { this.ch[k].x = v; this.ch[k].v = 0; }
    }
  };
  CP.runStep = function (st) {
    var k;
    if (st.emo) this.setEmo(st.emo, false, true);
    if (st.to) for (k in st.to) { if (this.o.emotion && LID.indexOf(k) >= 0) continue; this.tgt[k] = st.to[k] * (AMP_CH[k] ? this.amp : 1); }
    if (st.kick) for (k in st.kick) this.ch[k].v += st.kick[k] * (AMP_CH[k] ? this.amp : 1);
    if (st.jump) this.jump(st.jump * this.amp);
    if (st.fn) st.fn(this);
  };
  CP.pickAct = function () {
    var acts = this.o.emotion ? { lookAround: 3, dreamUp: 1, idle: 2 } : this.P.acts, keys = Object.keys(acts), tot = 0, i;
    for (i = 0; i < keys.length; i++) if (keys[i] !== this.lastAct) tot += acts[keys[i]];
    var r = Math.random() * tot;
    for (i = 0; i < keys.length; i++) { if (keys[i] === this.lastAct) continue; r -= acts[keys[i]]; if (r <= 0) return keys[i]; }
    return keys[0];
  };
  CP.plan = function () {
    var drift = Math.random() < 0.45 ? { lx: rand(-0.3, 0.3), ly: rand(-0.22, 0.14) } : { lx: 0, ly: 0 };
    this.queue.push({ d: rand(700, 2800), idle: true, to: drift });
    var name = this.pickAct(); this.lastAct = name;
    var d = Math.random() < 0.62 ? this.p.side : -this.p.side;   // у каждого своя «любимая сторона»
    this.queue = this.queue.concat(ACTS[name](this, d), [{ d: 10, to: { bx: 0, by: 0, rot: 0, sq: 0, lx: 0, ly: 0 }, emo: "base" }]);
  };
  CP.advance = function (t) {
    if (!this.queue.length) this.plan();
    var st = this.queue.shift();
    this.inIdle = !!st.idle;
    this.runStep(st);
    this.stepEnd = t + (st.d || 0) / this.tempo;
  };
  CP.jump = function (h) { this.air = true; this.ch.by.v = -Math.sqrt(2 * GRAV * Math.max(1, h)); this.ch.sq.v += 0.9; };
  CP.unwrapRot = function () { var k = Math.round(this.tgt.rot / 360) * 360; this.ch.rot.x -= k; this.tgt.rot -= k; };
  CP.startBlink = function (t) { this.blinkT = t; this.blinkDur = (this.P.blink >= 6.5 || this.ch.up.x > 0.4) ? 280 : rand(130, 170); this.blinkQ = Math.random() < 0.18 ? 1 : 0; };
  CP.forceBlink = function (dbl) { this.startBlink(now()); if (dbl) this.blinkQ = 1; this.sleeping = false; };
  CP.blinkVal = function (t) {
    if (this.blinkT < 0) return 0;
    var u = (t - this.blinkT) / this.blinkDur;
    if (u < 0) return 0;
    if (u >= 1) {
      if (this.blinkQ > 0) { this.blinkQ--; this.blinkT = t + 70; }
      else { this.blinkT = -1; this.nextBlink = t + this.P.blink * 1000 * rand(0.5, 1.5); }
      return 0;
    }
    return u < 0.38 ? Math.pow(u / 0.38, 1.6) : 1 - Math.pow((u - 0.38) / 0.62, 0.8);
  };
  CP.attend = function (t) {
    if (t - PTR.t >= PTR_HOLD || !this.rect || this.o.noAttention) {
      if (this.attnEmo) { this.attnEmo = false; this.setEmo(this.actEmo || "base"); }
      this.attn = null; return;
    }
    if (this.attnSession !== PTR.session) { this.attnSession = PTR.session; this.interested = Math.random() < this.P.attnP; this.attnFrom = t + rand(40, 380) / this.tempo; }
    if (!this.interested || t < this.attnFrom) return;
    var r = this.rect, dx = PTR.x - r.cx, dy = PTR.y - r.cy, inside = dx * dx + dy * dy < r.w * r.w * 0.25;
    var lx = inside ? 0 : clamp(dx / (Math.abs(dx) + r.w * 1.1), -1, 1) * 1.15;
    var ly = inside ? 0 : clamp(dy / (Math.abs(dy) + r.w * 1.1), -1, 1);
    var at = { lx: lx, ly: ly, until: t + 300 }, mode = this.P.attn;
    if (mode === "stare") { at.bx = lx * 4; at.rot = lx * 3.2; at.es = 0.1; }
    else if (mode === "avoid" && t - this.attnFrom > 800) {
      at.lx = -lx * 0.8; at.ly = 0.5; at.rot = -lx * 4;
      if (!this.attnEmo) { this.attnEmo = true; this.setEmo("shy"); }
    } else at.rot = lx * 2;
    this.attn = at;
  };
  CP.update = function (dt, t) {
    if (t >= this.stepEnd) this.advance(t);
    if (this.blinkT < 0 && t >= this.nextBlink) this.startBlink(t);
    if (this.size >= 44 && t >= this.nextSac) { this.tgt.sacx = rand(-0.08, 0.08); this.tgt.sacy = rand(-0.05, 0.05); this.nextSac = t + rand(450, 2200) / this.tempo; }
    this.attend(t);
    var a = this.attn && this.attn.until > t ? this.attn : null, ch = this.ch, T = this.tgt, i, k;
    ch.lx.t = a ? a.lx : T.lx; ch.ly.t = a ? a.ly : T.ly;
    ch.bx.t = T.bx + (a && a.bx ? a.bx : 0); ch.rot.t = T.rot + (a && a.rot ? a.rot : 0);
    ch.by.t = T.by; ch.sq.t = T.sq; ch.sacx.t = T.sacx; ch.sacy.t = T.sacy;
    for (i = 0; i < LID.length; i++) { k = LID[i]; ch[k].t = T[k] + (a && a[k] ? a[k] : 0); }
    var n = Math.max(1, Math.ceil(dt / 0.0084)), h = dt / n, s, c;
    for (s = 0; s < n; s++) {
      for (i = 0; i < this.keys.length; i++) {
        k = this.keys[i]; c = ch[k];
        if (k === "by" && this.air) {
          c.v += GRAV * h; c.x += c.v * h;
          if (c.v > 0 && c.x >= c.t) { var imp = c.v; c.x = c.t; c.v = 0; this.air = false; ch.sq.v -= imp * 0.0068; }
          continue;
        }
        c.v += (-c.k * (c.x - c.t) - c.c * c.v) * h; c.x += c.v * h;
      }
    }
  };
  CP.isSettled = function () {
    if (this.air || this.blinkT >= 0) return false;
    for (var i = 0; i < this.keys.length; i++) { var k = this.keys[i], c = this.ch[k]; if (Math.abs(c.v) > EPS[k] * 6 || Math.abs(c.x - c.t) > EPS[k]) return false; }
    return true;
  };
  CP.tick = function (t, ptrOn) {
    var dt = clamp((t - this.lastT) / 1000, 0, 0.05); this.lastT = t;
    if (this.sleeping && t < this.wakeAt && !ptrOn) return;
    this.update(dt, t);
    this.render(t);
    if (this.isSettled()) { this.sleeping = true; this.wakeAt = Math.min(this.stepEnd, this.nextBlink, this.size >= 44 ? this.nextSac : 1e15); }
    else this.sleeping = false;
  };
  CP.react = function () {
    if (!this.live) return;
    var d = Math.random() < 0.5 ? -1 : 1, T = this.tgt;
    T.bx = T.by = T.rot = T.sq = 0;
    this.queue = ACTS[REACT[this.p.persona] || "surprise"](this, d).concat([{ d: 10, to: { bx: 0, by: 0, rot: 0, sq: 0, lx: 0, ly: 0 }, emo: "base" }]);
    this.stepEnd = 0; this.sleeping = false; this.wakeAt = 0;
    try { if (root.Telegram && root.Telegram.WebApp && root.Telegram.WebApp.HapticFeedback) root.Telegram.WebApp.HapticFeedback.impactOccurred("light"); else if (root.tgHaptic) root.tgHaptic("light"); } catch (e) {}
  };
  CP.notice = function (from) {
    if (!this.live || !this.inIdle || this.o.emotion) return;
    var self = this, P = this.p.persona, react;
    if (P === "shy") react = [{ d: 300, emo: "shy", to: { lx: -0.5, ly: 0.45 } }, { d: 1100 }];
    else if (P === "skeptic") react = [{ d: 400, emo: "suspicious" }, { d: 1300 }];
    else if (P === "nervous") react = [{ d: 10, emo: "surprised", kick: { rot: 120 } }, { d: 900 }];
    else if (P === "joyful" || P === "jelly") react = [{ d: 10, emo: "happy", jump: 3 }, { d: 1100 }];
    else react = [{ d: 10, emo: "happy" }, { d: 1100 }];
    this.queue = [{ d: rand(200, 600), idle: true }, { d: 10, fn: function () { self.lookAtCreature(from); } }, { d: rand(500, 900) }]
      .concat(react, [{ d: 500, to: { lx: 0, ly: 0, rot: 0 }, emo: "base" }]);
    this.stepEnd = 0; this.sleeping = false;
  };
  CP.lookAtCreature = function (other) {
    var a = this.host.getBoundingClientRect(), b = other.host.getBoundingClientRect();
    var dx = (b.left + b.width / 2) - (a.left + a.width / 2), dy = (b.top + b.height / 2) - (a.top + a.height / 2), w = a.width || 1;
    this.tgt.lx = clamp(dx / (Math.abs(dx) + w * 0.9), -1, 1) * 1.1;
    this.tgt.ly = clamp(dy / (Math.abs(dy) + w * 0.9), -1, 1) * 0.9;
    this.tgt.rot = this.tgt.lx * 3 * this.amp;
  };
  CP.pickNeighbor = function () {
    var cand = [], i;
    for (i = 0; i < REG.length; i++) if (REG[i] !== this && REG[i].visible && !REG[i].o.emotion) cand.push(REG[i]);
    if (!cand.length) return null;
    var me = this.host.getBoundingClientRect(), best = null, bd = 1e12;
    for (i = 0; i < 6 && cand.length; i++) {
      var c = cand.splice(Math.floor(Math.random() * cand.length), 1)[0], r = c.host.getBoundingClientRect();
      var dx = r.left - me.left, dy = r.top - me.top, d2 = dx * dx + dy * dy;
      if (d2 < bd) { bd = d2; best = c; }
    }
    return best && bd < Math.pow(me.width * 4, 2) ? best : null;
  };

  /* ── СБОРКА SVG ── */
  function el(tag, attrs) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  CP.build = function () {
    var o = this.o, p = this.p, host = this.host, size = this.size, dark = !!o.dark, id = "cr8_" + this.uid;
    var ink = o.color === "ink", G = ink ? (dark ? INK_D : INK_L) : GRADS[p.pal];
    var ca = ink ? G.a : (dark ? G.da : G.la), cb = ink ? G.b : (dark ? G.db : G.lb);
    this.eyeColor = G.ink;
    var tint = ink ? "#9AA0B4" : ca, bg, darkBody = lum(mixHex(ca, cb, 0.5)) < 0.36;
    if (o.bare) bg = "transparent";
    else if (o.bg === "neutral") bg = dark ? (darkBody ? "#3A3B43" : "#2A2B31") : "#EDEEF2";
    else if (dark && ink) bg = "#3A3B43";
    else if (dark && darkBody) bg = mixHex(mixHex(ca, "#FFFFFF", 0.42), "#16161B", 0.5);   // тёмному телу — светлее окно, иначе сливается
    else bg = dark ? mixHex(tint, "#16161B", 0.8) : mixHex(tint, "#FFFFFF", 0.8);
    var hs = host.style;
    hs.width = hs.height = size + "px"; hs.borderRadius = "50%"; hs.overflow = "hidden"; hs.flexShrink = "0"; hs.background = bg;
    if (!hs.position) hs.position = "relative";
    var svg = el("svg", { viewBox: "-50 -50 100 100", width: size, height: size, "aria-hidden": "true" });
    svg.style.cssText = "position:absolute;inset:0;display:block;overflow:visible";
    if (this.live) { svg.setAttribute("class", "cr8-breathe"); svg.style.setProperty("--cr8-br", p.breath.toFixed(2) + "s"); svg.style.setProperty("--cr8-bo", "-" + (hash(p.seed) % 5000) + "ms"); }
    var defs = el("defs", {});
    var lg = el("linearGradient", { id: id + "g", x1: "0", y1: "0", x2: "0", y2: "1" });
    lg.appendChild(el("stop", { offset: "0", "stop-color": ca })); lg.appendChild(el("stop", { offset: "1", "stop-color": cb }));
    defs.appendChild(lg);
    var vol = o.material !== "flat";
    if (vol) {
      var rg = el("radialGradient", { id: id + "v", cx: "0.36", cy: "0.28", r: "0.92" });
      rg.appendChild(el("stop", { offset: "0", "stop-color": "#FFFFFF", "stop-opacity": ink ? "0.05" : "0.09" }));
      rg.appendChild(el("stop", { offset: "0.45", "stop-color": "#FFFFFF", "stop-opacity": "0" }));
      rg.appendChild(el("stop", { offset: "1", "stop-color": "#000000", "stop-opacity": dark ? "0.34" : "0.2" }));
      defs.appendChild(rg);
    }
    svg.appendChild(defs);
    this.shadow = null;
    if (!o.bare && size >= 40) { this.shadow = el("ellipse", { cx: "0", cy: f2(p.sh.maxY + BASE_Y + 3.4), rx: "20", ry: "3.2", fill: dark ? "#000000" : "#1C1C30" }); svg.appendChild(this.shadow); }
    this.body = el("g", {});
    var bp = el("path", { d: p.sh.d, fill: "url(#" + id + "g)" });
    if (dark) { bp.setAttribute("stroke", darkBody ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.08)"); bp.setAttribute("stroke-width", "0.8"); }
    this.body.appendChild(bp);
    if (vol) this.body.appendChild(el("path", { d: p.sh.d, fill: "url(#" + id + "v)" }));
    var sw = clamp(150 / size, 1.4, 3.4);
    this.sw = sw;
    this.eyeL = el("path", { fill: this.eyeColor, stroke: this.eyeColor, "stroke-width": f2(sw), "stroke-linejoin": "round" });
    this.eyeR = el("path", { fill: this.eyeColor, stroke: this.eyeColor, "stroke-width": f2(sw), "stroke-linejoin": "round" });
    this.body.appendChild(this.eyeL); this.body.appendChild(this.eyeR);
    svg.appendChild(this.body);
    host.appendChild(svg);
    host.__cr8 = this;
    this.svg = svg;
  };
  CP.setA = function (node, key, attr, val) { if (this.last[key] !== val) { this.last[key] = val; node.setAttribute(attr, val); } };
  CP.render = function (t) {
    var ch = this.ch, p = this.p, sh = p.sh;
    var stretch = clamp(Math.abs(ch.by.v) * 0.0011 + Math.abs(ch.bx.v) * 0.0005, 0, 0.16);
    var sq = clamp(ch.sq.x + stretch, -0.32, 0.32), sY = 1 + sq, sX = 1 - sq * 0.72;
    var lookX = ch.lx.x + ch.sacx.x + p.lxb, lookY = ch.ly.x + ch.sacy.x + p.lyb;
    var bx = ch.bx.x + lookX * 1.4, rot = ch.rot.x + lookX * 1.5, by = ch.by.x + BASE_Y, P = sh.maxY;
    this.setA(this.body, "b", "transform", "translate(" + f2(bx) + " " + f2(by) + ") rotate(" + f2(rot) + ") translate(0 " + f2(P) + ") scale(" + f3(sX) + " " + f3(sY) + ") translate(0 " + f2(-P) + ")");
    if (this.shadow) {
      var lift = clamp(-ch.by.x / 16, -0.2, 1), k = 1 - lift * 0.45;
      this.setA(this.shadow, "sx", "cx", f2(bx * 0.6));
      this.setA(this.shadow, "sr", "rx", f2(sh.halfW * 0.7 * k * sX));
      this.setA(this.shadow, "sy", "ry", f2(3.2 * k));
      this.setA(this.shadow, "so", "opacity", f3((this.o.dark ? 0.4 : 0.13) * (1 - lift * 0.55)));
    }
    // глаза на сфере
    var yaw = clamp(lookX, -1.15, 1.15) * 0.62, pitch = clamp(lookY, -1.15, 1.15) * 0.58;
    var Rf = Math.min(sh.halfW, (sh.maxY - sh.minY) / 2) * 0.97;
    var a = Math.asin(clamp(p.dx / Rf, -0.85, 0.85));
    var ey = p.faceY + Rf * Math.sin(pitch) * 0.85, hS = Math.max(0.45, Math.cos(pitch));
    var blink = this.blinkVal(t), sw = this.sw;
    var up = ch.up.x, lo = clamp(ch.lo.x, 0, 1), sm = clamp(ch.smile.x, 0, 1), tl = ch.tilt.x, es = ch.es.x, as = ch.asym.x, smE = sm * sm * (3 - 2 * sm);
    for (var side = -1; side <= 1; side += 2) {
      var yi = clamp(yaw + side * a, -1.3, 1.3), ex = Rf * Math.sin(yi), wS = Math.max(0.3, Math.cos(yi));
      var w = p.eyeW * p.eyeS * es * wS, h = p.eyeH * p.eyeS * es * hS;
      // улыбка расширяет и уплощает глаз — тогда верхний край даёт широкую дугу «^», а не бугорок
      w *= 1 + 0.6 * smE; h *= 1 - 0.32 * smE;
      w = Math.max(0.5, w - sw); h = Math.max(0.5, h - sw);
      // глаз никогда не вылезает за силуэт (узкие капсулы, крайние углы взгляда)
      var limX = sh.halfW * 0.9 - w / 2 - sw, ex2 = clamp(ex, -limX, limX);
      var ey2 = clamp(ey, sh.minY * 0.9 + h / 2 + sw, sh.maxY * 0.8 - h / 2 - sw);
      var d = eyePath(ex2, ey2, w, h, clamp(up - side * as, 0, 1), lo, sm, tl, side, blink);
      if (side < 0) this.setA(this.eyeL, "l", "d", d); else this.setA(this.eyeR, "r", "d", d);
    }
  };
  CP.destroy = function () { unregister(this); if (this.svg && this.svg.parentNode) this.svg.parentNode.removeChild(this.svg); this.host.__cr8 = null; };

  /* ── ОБЩИЙ ЦИКЛ: один rAF на всех, спящие не тикают, невидимые (IntersectionObserver) тоже;
     при перегрузке мелкие существа обновляются реже. ── */
  var REG = [], rafId = 0, frameNo = 0, costEMA = 0, io = null, listening = false;
  var PTR = { x: -1e4, y: -1e4, t: -1e9, session: 0 };
  function register(c) {
    REG.push(c);
    if (!io && typeof IntersectionObserver !== "undefined") io = new IntersectionObserver(function (es) {
      for (var i = 0; i < es.length; i++) { var cr = es[i].target.__cr8; if (cr) { cr.visible = es[i].isIntersecting; if (cr.visible) cr.sleeping = false; } }
    }, { rootMargin: "80px" });
    if (io) io.observe(c.host);
    listen();
    if (!rafId && typeof requestAnimationFrame !== "undefined") rafId = requestAnimationFrame(loop);
  }
  function unregister(c) {
    var i = REG.indexOf(c); if (i >= 0) REG.splice(i, 1);
    if (io) io.unobserve(c.host);
    if (!REG.length && rafId) { cancelAnimationFrame(rafId); rafId = 0; }
  }
  function loop(t) {
    rafId = requestAnimationFrame(loop);
    if (document.hidden) return;
    frameNo++;
    var t0 = now(), ptrOn = t - PTR.t < PTR_HOLD, i, c;
    if (ptrOn) for (i = 0; i < REG.length; i++) {
      c = REG[i];
      if (c.visible && t - c.rectAt > 140) { var r = c.host.getBoundingClientRect(); c.rect = { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width }; c.rectAt = t; }
    }
    var skip = costEMA > 10 ? 3 : costEMA > 6 ? 2 : 1;
    for (i = 0; i < REG.length; i++) {
      c = REG[i];
      if (!c.visible) continue;
      if (skip > 1 && c.size < 44 && (frameNo + c.uid) % skip) continue;
      c.tick(t, ptrOn && c.interested !== false);
    }
    costEMA = costEMA * 0.9 + (now() - t0) * 0.1;
  }
  function listen() {
    if (listening || typeof window === "undefined") return;
    listening = true;
    var mv = function (e) { var t = now(); if (t - PTR.t > PTR_HOLD) PTR.session++; PTR.x = e.clientX; PTR.y = e.clientY; PTR.t = t; };
    window.addEventListener("pointermove", mv, { passive: true });
    window.addEventListener("pointerdown", function (e) {
      mv(e);
      var hit = null, best = 1e12;
      for (var i = 0; i < REG.length; i++) {
        var c = REG[i]; if (!c.visible) continue;
        var r = c.host.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), d2 = dx * dx + dy * dy;
        if (d2 <= r.width * r.width * 0.25 && d2 < best) { best = d2; hit = c; }
      }
      if (hit) hit.react();
    }, { passive: true });
  }
  function injectCSS() {
    if (typeof document === "undefined" || document.getElementById("cr8-css")) return;
    var s = document.createElement("style"); s.id = "cr8-css";
    s.textContent = ".cr8-breathe{transform-origin:50% 90%;animation:cr8Breathe var(--cr8-br,4.6s) ease-in-out var(--cr8-bo,0s) infinite}" +
      "@keyframes cr8Breathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.02,.982)}}" +
      "@media (prefers-reduced-motion:reduce){.cr8-breathe{animation:none}}";
    (document.head || document.documentElement).appendChild(s);
  }
  injectCSS();

  root.Creatures = {
    mount: function (host, seed, opts) { return new Creature(host, seed, opts); },
    params: params, PERSONAS: PERSONAS, EMO: EMO,
    stats: function () { var awake = 0; for (var i = 0; i < REG.length; i++) if (!REG[i].sleeping && REG[i].visible) awake++; return { total: REG.length, awake: awake, costMs: Math.round(costEMA * 100) / 100 }; }
  };
})(typeof window !== "undefined" ? window : this);

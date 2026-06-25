/* core/aliases.jsx — the per-file React.useState aliases, defined ONCE here for the
   whole app. Each demo screen historically did its own `const { useState: useX } = React`
   (to avoid redeclaring `useState`, since the build globalises every top-level binding).
   The core toolkit + the live screens reuse those same names, so they must live in the
   shared engine — otherwise live would depend on a demo file just for `useHS`/`useP`/…
   Loaded first among core/, before any kit or screen that calls them. */
const { useState: useHomeState } = React; // was screens/home.jsx
const { useState: useHS } = React;        // was screens/habits.jsx
const { useState: useCS } = React;        // was screens/community.jsx
const { useState: useP } = React;         // was screens/profile.jsx
const { useState: useM } = React;         // was screens/extra.jsx

/* ── Shared orb clock ──────────────────────────────────────────────────────────
   ONE requestAnimationFrame loop drives EVERY animated orb in the live app, replacing the
   old per-orb 60fps loops (useT / useAIT each started their own). The mist/drift re-render
   is throttled to ~30fps (visually identical) and PAUSED while the tab/app is hidden, so a
   backgrounded orb costs nothing. Each subscriber gets time in SECONDS since IT mounted, so
   mount-relative animations (e.g. OrbitField's bloom-in) still start at 0 → drop-in for the
   old useT / useAIT. (The cinematic onboarding keeps its own 60fps useT in intro.jsx.) */
let _orbRAF = null, _orbLastMs = 0;
const _orbSubs = new Set();
function _orbTick(now) {
  _orbRAF = requestAnimationFrame(_orbTick);
  if (now - _orbLastMs < 33) return;          // ~30 fps gate on the broadcast/re-render
  _orbLastMs = now;
  const sec = now / 1000;
  _orbSubs.forEach((s) => { if (s.t0 == null) s.t0 = sec; try { s.cb(sec - s.t0); } catch (e) {} });
}
function _orbStart() {
  if (_orbRAF == null && _orbSubs.size && !(typeof document !== "undefined" && document.hidden))
    _orbRAF = requestAnimationFrame(_orbTick);
}
function _orbStop() { if (_orbRAF != null) { cancelAnimationFrame(_orbRAF); _orbRAF = null; } }
if (typeof document !== "undefined")
  document.addEventListener("visibilitychange", () => { if (document.hidden) _orbStop(); else _orbStart(); });
function useOrbClock() {
  const [t, setT] = React.useState(0);
  React.useEffect(() => {
    const sub = { cb: setT, t0: null };
    _orbSubs.add(sub); _orbStart();
    return () => { _orbSubs.delete(sub); if (!_orbSubs.size) _orbStop(); };
  }, []);
  return t;
}

/* Value-equality for the orb tint array ([light, mid, deep]). tintFromMood() returns a FRESH
   array each call, so React.memo on the orb leaves needs this to actually skip an unchanged mood. */
function _orbTintEq(a, b) {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
/* props-equal for the SiriOrb-family leaves (SiriOrb / StateOrb / StaticOrb). */
function _siriPropsEq(a, b) {
  return a.size === b.size && a.r === b.r && a.seed === b.seed
    && a.intensity === b.intensity && a.t === b.t && _orbTintEq(a.tint, b.tint);
}

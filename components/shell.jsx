/* Shared UI bits + iPhone frame for BalanceOS */
const { useState, useRef, useEffect } = React;

/* ── Lazy demo bundle ──────────────────────────────────────────────────────────
   The three PURE-demo screen files (home / habits / community — ~370 KB, incl. the
   208 KB community) are NOT shipped in index.html and NOT precached: the LIVE app
   never renders them. They're injected on demand the first time the user heads into
   demo OR fresh mode (both render the frozen SCREENS, not LIVE_SCREENS), then the SW
   caches them so later entries are instant. profile.js + extra.js DO stay statically
   loaded — they hold symbols the live app itself uses (SignUpScreen / OnboardingScreen
   for onboarding; bosAiBrief / AchievementUnlock at runtime). Idempotent; resets on
   failure so a retry can re-attempt. */
let _demoBundleP = null;
function loadDemoBundle() {
  if (typeof HomeScreen === "function" && typeof HabitsScreen === "function" && typeof CommunityScreen === "function") return Promise.resolve();
  if (_demoBundleP) return _demoBundleP;
  const v = (typeof APP_VERSION !== "undefined") ? APP_VERSION : "";
  const inject = (src) => new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src; s.onload = res; s.onerror = () => rej(new Error("demo bundle failed: " + src));
    document.head.appendChild(s);
  });
  // Sequential, in the same order the old static <script> tags used (home → habits → community).
  _demoBundleP = ["home", "habits", "community"]
    .reduce((chain, n) => chain.then(() => inject("build/screens/demo/" + n + ".js?v=" + v)), Promise.resolve())
    .catch((e) => { _demoBundleP = null; try { console.warn(e); } catch (_) {} throw e; });
  return _demoBundleP;
}

// Status bar (we draw our own so we can switch between dark/light)
function StatusBar({ dark = false }) {
  return (
    <div className={"status-bar " + (dark ? "dark" : "light")}>
      <span>9:41</span>
      <div className="right">
        <svg width="18" height="11" viewBox="0 0 18 11" fill="currentColor"><rect x="0" y="6" width="3" height="5" rx="0.5"/><rect x="5" y="4" width="3" height="7" rx="0.5"/><rect x="10" y="2" width="3" height="9" rx="0.5"/><rect x="15" y="0" width="3" height="11" rx="0.5"/></svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M1.3 4.2a10 10 0 0 1 13.4 0"/><path d="M3.5 6.6a7 7 0 0 1 9 0"/><path d="M5.7 9a4 4 0 0 1 4.6 0"/><circle cx="8" cy="10.6" r="0.9" fill="currentColor" stroke="none"/></svg>
        <svg width="27" height="13" viewBox="0 0 27 13" fill="none"><rect x="0.5" y="0.5" width="22" height="12" rx="3" stroke="currentColor" opacity="0.5"/><rect x="2" y="2" width="19" height="9" rx="1.6" fill="currentColor"/><rect x="23.5" y="4" width="2" height="5" rx="1" fill="currentColor" opacity="0.5"/></svg>
      </div>
    </div>
  );
}

/*
 * Phone frame.
 * Now applies a `theme-light` / `theme-dark` class on the inner page so
 * design tokens are scoped per-screen. The status bar text colour follows
 * the theme automatically (you can still override with the `statusDark` prop
 * for screens that have their own colored hero).
 */
function Phone({ children, tabBar = null, theme = "light", hasTabBar = false, statusDark, fullBleed = false }) {
  const dark = theme === "dark";
  const sbDark = statusDark === undefined ? dark : statusDark;
  return (
    <div className="dc-phone" style={{
      width: 402, height: 874,
      borderRadius: 51,
      background: dark ? "#0a0a0a" : "#f1f1f1",
      position: "relative",
      overflow: "hidden",
      boxShadow: "0 30px 60px rgba(0,0,0,0.25)",
    }}>
      <StatusBar dark={sbDark} />
      <div className={"bos-page " + (dark ? "theme-dark" : "theme-light") + ((hasTabBar || tabBar) ? "" : " no-tabbar") + (fullBleed ? " full-bleed" : "")}>
        {children}
      </div>
      {tabBar}
    </div>
  );
}

// App-level navigation context
const NavCtx = React.createContext(null);

function NavProvider({ children, initial = "home" }) {
  const [route, setRoute] = useState(initial);
  const [params, setParams] = useState({});
  const navigate = (r, p = {}) => { setRoute(r); setParams(p); };
  return <NavCtx.Provider value={{ route, params, navigate }}>{children}</NavCtx.Provider>;
}
const useNav = () => React.useContext(NavCtx);

// Bottom tab bar. `tabs` — необязательный список {id, icon}: live передаёт свой состав
// (без «Привычек», с «Я»), демо живёт на прежнем дефолте. Ширина линзы следует за
// числом вкладок инлайном (CSS-дефолт рассчитан на 4).
function TabBar({ active, dark = false, onTab, style, tabs: tabsProp }) {
  const tabs = (tabsProp && tabsProp.length) ? tabsProp : [
    { id: "home", icon: "Home" },
    { id: "habits", icon: "Bolt" },
    { id: "community", icon: "Group" },
    { id: "ai", icon: "Sparkles" },
  ];
  const idx = Math.max(0, tabs.findIndex(t => t.id === active));
  return (
    <div className={"bos-tabbar " + (dark ? "dark" : "")} style={style}>
      {/* Liquid-glass selection lens: the TRACK springs between tabs (translateX), while the
          inner droplet replays a stretch-and-settle morph on every change (key→remount) — the
          «жидкое стекло» cue. Two layers so position and morph never fight over `transform`. */}
      <span className="bos-tab-lens-track" style={{ width: "calc((100% - 24px) / " + tabs.length + ")", transform: "translateX(" + (idx * 100) + "%)" }}>
        <span key={idx} className="bos-tab-lens" />
      </span>
      {tabs.map(t => (
        <button key={t.id} className={"tab tap " + (active === t.id ? "active" : "")}
          data-haptic="selection"
          onClick={() => onTab(t.id)}>
          {React.createElement(I[t.icon], { size: 24, filled: active === t.id })}
        </button>
      ))}
    </div>
  );
}

/* iOS-app swipe-action circle colors, theme-adaptive. Light circles are pure
   white so they read as raised buttons over the grey reveal-track (below). */
function swipeTone(tone, dark) {
  if (tone === "delete") return dark ? { bg: "rgba(255,255,255,0.12)", fg: "#FF453A" } : { bg: "#fff", fg: "#FF3B30" };
  if (tone === "share")  return dark ? { bg: "rgba(255,255,255,0.14)", fg: "#ffffff" } : { bg: "#fff", fg: "#0a0a0a" };
  return dark ? { bg: "#ffffff", fg: "#0a0a0a" } : { bg: "#0a0a0a", fg: "#ffffff" }; // done
}

/* Swipe-to-reveal row actions, styled as iOS-app round icon buttons. Drag a row
   left to expose the actions; a tap on a closed row passes through to its own
   onClick, a tap on an open row closes it; vertical drags fall through to scroll. */
function SwipeRow({ children, actions = [], rowBg = "#fff", actionWidth = 64, actionSize = 40, dark = false, trackBg }) {
  const [open, setOpen] = useState(false);
  const [dx, setDx] = useState(0);
  const [releasing, setReleasing] = useState(true);
  const d = useRef(null);
  const justDragged = useRef(false);
  const W = actions.length * actionWidth;
  // The reveal-track sits BEHIND the (white) row; making it the grey page
  // background gives an iOS-grouped-list feel — the row lifts to show the
  // surface beneath, instead of white-on-white where the buttons vanish.
  const track = trackBg || (dark ? "#0a0a0a" : "#f1f1f1");

  const close = () => { setReleasing(true); setOpen(false); setDx(0); };

  const onDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    d.current = { x0: e.clientX, y0: e.clientY, base: open ? -W : 0, active: false, id: e.pointerId, last: open ? -W : 0 };
  };
  const onMove = (e) => {
    const c = d.current; if (!c || c.id !== e.pointerId) return;
    const ddx = e.clientX - c.x0, ddy = e.clientY - c.y0;
    if (!c.active) {
      if (Math.abs(ddx) < 8 && Math.abs(ddy) < 8) return;
      if (Math.abs(ddy) >= Math.abs(ddx)) { d.current = null; return; } // vertical → let the list scroll
      c.active = true;
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
    }
    const now = performance.now();
    if (c.lastT != null) { const dt = now - c.lastT; if (dt > 0) c.vx = (e.clientX - c.lastX) / dt; }
    c.lastX = e.clientX; c.lastT = now;
    const nx = Math.max(-W - 24, Math.min(0, c.base + ddx));
    c.last = nx;
    setReleasing(false); setDx(nx);
    if (e.cancelable) e.preventDefault();
  };
  const onUp = () => {
    const c = d.current; if (!c) return; d.current = null;
    if (!c.active) return;
    justDragged.current = true;
    window.setTimeout(() => { justDragged.current = false; }, 80);
    // Flick left → open, flick right → close; otherwise settle by position (35%).
    const v = c.vx || 0;
    const shouldOpen = v < -0.35 ? true : v > 0.35 ? false : c.last < -W * 0.35;
    if (shouldOpen && !open) { try { if (window.tgHaptic) tgHaptic("rigid"); } catch (_) {} } // crisp detent on commit-to-open
    setReleasing(true); setOpen(shouldOpen); setDx(shouldOpen ? -W : 0);
  };
  const onClickCapture = (e) => {
    if (e.target.closest && e.target.closest("[data-swipe-actions]")) return; // let action buttons fire
    if (justDragged.current) { e.stopPropagation(); e.preventDefault(); justDragged.current = false; return; }
    if (open) { e.stopPropagation(); e.preventDefault(); close(); } // tap a revealed row → close, don't navigate
  };

  const offset = releasing ? (open ? -W : 0) : dx;
  return (
    // Root stays TRANSPARENT — the reveal-track is painted by the actions layer below (which only
    // mounts during a swipe). A permanent `background: track` (#0a0a0a in dark) leaked at the
    // rounded corners on first load: useThemeFlag flips light→dark after mount and the `.page-in`
    // entrance transform briefly breaks the parent's border-radius clip → black flash. No bg → nothing to leak.
    <div style={{ position: "relative", overflow: "hidden", touchAction: "pan-y", background: "transparent" }}
      onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
      onClickCapture={onClickCapture}>
      {/* Render the action buttons only while open or actively swiping — never
          when the row is closed — so they can't flash through during a tab
          fade-in (they used to peek as a compositing artifact of the animation). */}
      {(open || dx < 0) && (
      <div data-swipe-actions="" style={{ position: "absolute", top: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", background: track, isolation: "isolate", zIndex: 0 }}>
        {actions.map((a, i) => {
          const ts = swipeTone(a.tone, dark);
          return (
            <button key={a.key || i} className="tap" aria-label={a.label} title={a.label} onClick={(e) => { e.stopPropagation(); close(); a.onAction && a.onAction(); }}
              style={{ width: actionWidth, border: 0, background: "transparent",
                display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
              <span style={{ width: actionSize, height: actionSize, borderRadius: "50%", background: ts.bg, display: "grid", placeItems: "center",
                boxShadow: dark ? "none" : "0 1px 3px rgba(0,0,0,0.10)" }}>
                {React.createElement(a.icon, { size: Math.max(14, Math.round(actionSize * 0.46)), color: ts.fg, strokeWidth: a.tone === "done" ? 2.6 : 2, style: { display: "block" } })}
              </span>
            </button>
          );
        })}
      </div>
      )}
      {/* The WHITE row itself rounds its trailing (right) corners as it slides away,
          so it reads like a card peeling off — the grey beneath is just the
          background flowing through (no rounding on the track). */}
      <div style={{ position: "relative", background: rowBg, overflow: "hidden", transform: "translateX(" + offset + "px)",
        borderTopRightRadius: offset < 0 ? 16 : 0, borderBottomRightRadius: offset < 0 ? 16 : 0,
        transition: releasing ? "transform 0.3s cubic-bezier(0.32,0.72,0,1), border-radius 0.25s ease" : "none",
        /* Promote to a compositing layer ONLY during the gesture. A permanent willChange:transform
           layer escapes the parent's border-radius+overflow clip in WebKit → the dark reveal-track
           leaks at the rounded corners (and flickers as the layer is created/destroyed). At rest we
           drop the layer so the parent clips the row cleanly. */
        willChange: (open || !releasing) ? "transform" : "auto" }}>
        {children}
      </div>
    </div>
  );
}

/* ── Bottom sheet (iOS-style) ───────────────────────────────────────────────
   Slides up from the bottom over a dimmed backdrop, with a grabber you can drag
   down (or tap the backdrop) to dismiss. Opened app-wide via useSheet(). */
const SheetCtx = React.createContext({ open: () => {}, close: () => {} });
const useSheet = () => React.useContext(SheetCtx);

function BottomSheet({ open, onClose, children, dark = false }) {
  const [render, setRender] = useState(open);
  const [shown, setShown] = useState(false);
  const [dragY, setDragY] = useState(0);
  const drag = useRef(null);

  useEffect(() => {
    if (open) {
      setRender(true);
      // setTimeout (not rAF) so it still animates while the tab is backgrounded.
      const t = window.setTimeout(() => setShown(true), 20);
      return () => window.clearTimeout(t);
    }
    if (render) {
      setShown(false);
      const t = window.setTimeout(() => { setRender(false); setDragY(0); }, 340);
      return () => window.clearTimeout(t);
    }
  }, [open]); // eslint-disable-line

  // Класс на body, пока ЛЮБАЯ шторка на экране: плавающие элементы-порталы (например «+»/«Готово»
  // режима тряски, z-index 7000 на body) прячутся по CSS и не светятся поверх шторки.
  useEffect(() => {
    if (!render) return;
    try { document.body.classList.add("bos-sheet-open"); } catch (e) {}
    return () => { try { document.body.classList.remove("bos-sheet-open"); } catch (e) {} };
  }, [render]);

  if (!render) return null;

  const onDown = (e) => {
    drag.current = { y0: e.clientY, id: e.pointerId, dy: 0 };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
  };
  const onMove = (e) => {
    const c = drag.current; if (!c || c.id !== e.pointerId) return;
    c.dy = Math.max(0, e.clientY - c.y0);
    // Soft tick the instant you've dragged far enough that releasing will dismiss (110px).
    if (!c.passed && c.dy > 110) { c.passed = true; try { if (window.tgHaptic) tgHaptic("light"); } catch (_) {} }
    else if (c.passed && c.dy <= 110) { c.passed = false; }
    setDragY(c.dy);
  };
  const onUp = () => {
    const c = drag.current; if (!c) return; drag.current = null;
    if (c.dy > 110) onClose(); else setDragY(0);
  };

  return (
    <div className="bos-sheet-root">
      <div className="bos-sheet-backdrop" onClick={onClose} style={{ opacity: shown ? 1 : 0 }} />
      <div className={"bos-sheet " + (dark ? "is-dark " : "") + (shown ? "is-up" : "")}
        style={shown ? { transform: "translateY(" + dragY + "px)", transition: drag.current ? "none" : undefined } : undefined}>
        <div className="bos-sheet-handle" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          <div className="bos-sheet-grab" />
        </div>
        {children}
      </div>
    </div>
  );
}

/*
 * Page header — uses the theme-* class on a parent for colors. Pass `dark`
 * only when the screen is on a custom dark hero where the parent class
 * isn't .theme-dark.
 */
function PageHeader({ title, onBack, right, dark }) {
  return (
    <div className="page-header" style={{ color: dark ? "#fff" : undefined }}>
      {onBack && !(typeof window !== "undefined" && window.__TG) ? (
        // Inside Telegram the native Back button (driven from app.jsx's nav stack) already
        // shows on every pushed screen — so we hide our in-app chevron to avoid two "backs".
        // The 40px spacer stays, keeping the title centred. PWA/browser keeps the chevron.
        <button onClick={onBack} className="icon-btn tap" aria-label="Назад"
          style={dark ? { background: "rgba(255,255,255,0.06)", color: "#fff" } : undefined}>
          <I.ChevronLeft size={20} />
        </button>
      ) : <span style={{ width: 40 }} />}
      <h1>{title}</h1>
      {right ? <div style={{ width: 40, display: "flex", justifyContent: "flex-end" }}>{right}</div> : <span style={{ width: 40 }} />}
    </div>
  );
}

// Toggle switch. `small` — тонкий вариант для форм-шторок (David: «тоненькие тоглы, поаккуратнее»).
function Switch({ on, onChange, dark = false, small = false }) {
  const W = small ? 42 : 50, H = small ? 26 : 30, K = small ? 20 : 24;
  return (
    <button onClick={() => onChange(!on)} className="tap hit44" data-haptic="selection" style={{
      width: W, height: H, borderRadius: 999, flexShrink: 0,
      background: on ? "#0a0a0a" : (dark ? "#3f3f46" : "#d4d4d4"),
      border: 0, position: "relative", padding: 0,
      transition: "background 0.18s",
    }}>
      <span style={{
        position: "absolute", top: 3, left: 3,
        width: K, height: K, borderRadius: "50%",
        background: "#fff",
        // GPU transform (was animating non-composited `left`) with an iOS-spring settle.
        transform: on ? "translateX(" + (W - K - 6) + "px)" : "translateX(0)",
        transition: "transform 0.28s cubic-bezier(0.34, 1.4, 0.64, 1)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        willChange: "transform",
      }} />
    </button>
  );
}

// Segmented (Build / Quit etc). `small` → компактный .tab-pill-sm (тонкие менюшки в шторках).
function Segmented({ options, value, onChange, small = false }) {
  return (
    <div className={"tab-pill" + (small ? " tab-pill-sm" : "")}>
      {options.map(o => (
        <button key={o.value} className={"tap " + (value === o.value ? "active" : "")}
          onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* Count-up number — tweens to `value` on mount (from 0) and whenever it changes.
   Driven by setInterval, NOT requestAnimationFrame, so it animates even in a
   backgrounded tab / hidden preview (where rAF + CSS transitions freeze). */
function CountUp({ value, duration = 800, decimals = 0 }) {
  const target = Number(value) || 0;
  const [disp, setDisp] = useState(0);
  const fromRef = useRef(0);
  const timerRef = useRef(null);
  useEffect(() => {
    const start = fromRef.current;
    if (start === target) { setDisp(target); return; }
    const steps = 28;
    let i = 0;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      i++;
      const t = i / steps;
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic — fast then settle
      setDisp(start + (target - start) * eased);
      if (i >= steps) { clearInterval(timerRef.current); timerRef.current = null; fromRef.current = target; setDisp(target); }
    }, duration / steps);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [target]); // eslint-disable-line
  return <>{decimals ? Number(disp).toFixed(decimals) : Math.round(disp)}</>;
}

/* ── XP reward banner — modelled on the gold "Посмотреть демо" CTA: ONE golden
   surface, dark ink, soft gold shadow, a faint concentric "influence ripple" on
   the back for depth (single tone, not multi-colour). Big XP number + an
   understated, capped multiplier line. The first thing the eye lands on when a
   share sheet opens. Reused by ShareAppSheet (+150) & ShareHabitSheet (+75). */
function XPRewardCard({ amount = 150, reason = "когда друг начнёт пользоваться приложением", dark = false, mode = "app", circleNow = 2, circleGoal = 3, circleBonus = 300, flat = false }) {
  const ink = "#0a0a0a";
  const inkSub = "rgba(0,0,0,0.62)";
  const left = Math.max(0, circleGoal - circleNow);
  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 22, padding: "16px 17px",
      background: "linear-gradient(135deg, #FEDE34, #EF9F14)", color: ink,
      boxShadow: "0 12px 30px rgba(254,222,52,0.34)" }}>
      {!flat && <div aria-hidden style={{ position: "absolute", right: -34, top: -38, width: 168, height: 168, borderRadius: "50%",
        border: "20px solid rgba(255,255,255,0.18)", boxShadow: "0 0 0 20px rgba(255,255,255,0.09)", pointerEvents: "none" }} />}
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 13 }}>
        <span style={{ width: 46, height: 46, borderRadius: 14, background: "rgba(255,255,255,0.6)", display: "grid", placeItems: "center", flexShrink: 0 }}>
          <I.Sparkles size={23} color={ink} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 33, fontWeight: 800, letterSpacing: "-1.2px", lineHeight: 1 }}>+<CountUp value={amount} /></span>
            <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.3px" }}>XP</span>
          </div>
          <div style={{ fontSize: 12.5, color: inkSub, marginTop: 3, lineHeight: 1.35 }}>{reason}</div>
        </div>
      </div>
      {mode === "app" ? (
        /* App invite — invite 3 friends → a lump bonus. Plain XP, no ×/%. */
        <div style={{ position: "relative", marginTop: 13, paddingTop: 12, borderTop: "1px solid rgba(0,0,0,0.10)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 12.5, fontWeight: 700 }}>
            <span>Приглашено друзей</span>
            <span>{circleNow} из {circleGoal}</span>
          </div>
          <div style={{ height: 6, background: "rgba(0,0,0,0.14)", borderRadius: 999, overflow: "hidden", marginTop: 6 }}>
            <span style={{ display: "block", height: "100%", width: Math.min(100, Math.max(8, circleNow / circleGoal * 100)) + "%", background: ink, borderRadius: 999 }} />
          </div>
          <div style={{ fontSize: 12, color: inkSub, lineHeight: 1.4, marginTop: 8 }}>
            {left > 0
              ? <>Ещё <b style={{ color: ink }}>{left}</b> — и получишь <b style={{ color: ink }}>+{circleBonus} XP</b> разом.</>
              : <>Все приглашены — <b style={{ color: ink }}>+{circleBonus} XP</b> твои!</>}
          </div>
        </div>
      ) : (
        /* Habit invite — reinforce that doing it together is worth more. */
        <div style={{ position: "relative", marginTop: 13, paddingTop: 12, borderTop: "1px solid rgba(0,0,0,0.10)", fontSize: 12, color: inkSub, lineHeight: 1.4 }}>
          А когда ведёте привычку вместе — каждая отметка приносит <b style={{ color: ink }}>+15 XP</b> вместо +10.
        </div>
      )}
    </div>
  );
}

Object.assign(window, { Phone, StatusBar, NavProvider, useNav, TabBar, PageHeader, Switch, Segmented, NavCtx, SwipeRow, SheetCtx, useSheet, BottomSheet, CountUp, XPRewardCard });

/* ── Moods used across Home / Mood picker / Calendar ─────────────────
   Colors are saturated so the orb gradient (white → c → deep(c) → black)
   reads as a vivid sphere instead of a pastel disc. */
const MOOD_OPTIONS = [
  { i: "🤩", t: "Энергия",     c: "#FFC22E" },
  { i: "😊", t: "Радость",      c: "#5BC57E" },
  { i: "😌", t: "Спокойствие",  c: "#5FA8FF" },
  { i: "😣", t: "Тревога",      c: "#FF5C6F" },
  { i: "😔", t: "Упадок",       c: "#6B7A99" },
  { i: "😮‍💨", t: "Усталость",   c: "#8B8FA3" },
];
// Map the onboarding state-slider (0..1 valence, set in intro.jsx) → one of the
// app's mood options, so the state the user picked at signup shows in the home
// widget right away. Returns null when nothing was picked (→ caller's default).
// 0..1 valence (the onboarding dial AND the Home state slider) → index into MOOD_OPTIONS. ONE
// source of truth so every state UI maps identically; the slider stores this index, so the
// calendar / week-trail / MoodWidget keep reading dayMoods unchanged.
function bosMoodIdxFromValence(v) {
  v = (typeof v === "number" && isFinite(v)) ? v : 0.5;
  return v >= 0.80 ? 0   // Энергия
       : v >= 0.60 ? 1   // Радость
       : v >= 0.40 ? 2   // Спокойствие
       : v >= 0.22 ? 5   // Усталость
       :             4;  // Упадок
}
const _onbMood = () => {
  const v = window.__bosOnbMood;
  if (typeof v !== "number") return null;
  return MOOD_OPTIONS[bosMoodIdxFromValence(v)];
};

/* ── App-wide ephemeral state ───────────────────────────────────────
   Theme, current mood, enabled home widgets, day-mood history.
   Lives at App root, read anywhere via useApp(). */
const AppStateCtx = React.createContext(null);
const useApp = () => React.useContext(AppStateCtx);

/* Life-balance spheres — master list + sensible core default. The wheel and
   Settings both read from this so they stay in sync. */
const ALL_SPHERES = [
  { id: "body",   l: "Тело",    e: "💪", v: 0.78 },
  { id: "mind",   l: "Разум",   e: "🧠", v: 0.62 },
  { id: "career", l: "Карьера", e: "💼", v: 0.85 },
  { id: "money",  l: "Деньги",  e: "💰", v: 0.55 },
  { id: "family", l: "Семья",   e: "👪", v: 0.70 },
  { id: "friends",l: "Друзья",  e: "👥", v: 0.45 },
  { id: "spirit", l: "Дух",     e: "🧘", v: 0.68 },
  { id: "rest",   l: "Отдых",   e: "🌙", v: 0.40 },
];
const DEFAULT_SPHERES = ["body", "mind", "career", "money", "friends", "rest"];

/* ── Shared habit / goal / team store ───────────────────────────────
   ONE source of truth for every screen. Seeded from the demo data and
   held in ordinary React state, so a full reload always snaps back to
   this pristine demo (intentional — no persistence, easy to present). */
const SEED_HABITS = [
  { id: 1, emoji: "🙏", name: "Помогать другим", done: true,  streak: 12, friends: [{name:"Анна",initials:"А",color:"#F4A574"},{name:"Марк",initials:"М",color:"#7FB3F2"}] },
  { id: 2, emoji: "🧘🏼‍♀️", name: "Медитация", done: true, streak: 27, duration: 10, friends: [{name:"Лена",initials:"Л",color:"#B89AF0"},{name:"Вик",initials:"В",color:"#74CFE0"},{name:"Том",initials:"Т",color:"#76D3A0"},{name:"Катя",initials:"К",color:"#F291AC"},{name:"Игорь",initials:"И",color:"#7FB3F2"},{name:"Соня",initials:"С",color:"#F5C56B"}] },
  { id: 3, emoji: "🏃🏼‍♀️", name: "Утренняя пробежка", done: true, streak: 5, duration: 25, friends: [{name:"Анна",initials:"А",color:"#F4A574"}] },
  { id: 4, emoji: "📚", name: "Читать книгу", done: false, streak: 3, duration: 20 },
  { id: 5, emoji: "✍🏼", name: "Бумажный дневник", done: false, streak: 8, duration: 5 },
  { id: 6, emoji: "🥊", name: "Бокс", done: true, streak: 9, duration: 30, friends: [{name:"Марк",initials:"М",color:"#7FB3F2"}] },
  { id: 7, emoji: "🥗", name: "Здоровое питание", done: true, streak: 15 },
];
const SEED_GOALS = [
  { id: 1, emoji: "🥊", name: "100 раундов бокса", current: 62,  target: 100, unit: "раундов", deadline: "1 авг", habitIds: [6] },
  { id: 2, emoji: "📖", name: "Прочитать 24 книги", current: 8,  target: 24,  unit: "книг",   deadline: "31 дек", habitIds: [4] },
  { id: 3, emoji: "🎯", name: "Пробежать марафон",  current: 4,  target: 22,  unit: "недель", deadline: "14 окт", habitIds: [3, 7] },
  { id: 4, emoji: "🧘🏼‍♀️", name: "300 дней медитации", current: 187, target: 300, unit: "дней", deadline: "в след. году", habitIds: [2] },
];
const SEED_TEAMS = [
  { _id: "seed-1", name: "Команда создателей", vis: "public", emblem: "✨", goal: "50 добрых дел", target: 50, current: 31, unit: "дел", date: "1 — 31 дек", progress: 0.62, accent: "#fef3c7",
    members: [
      { name: "Ник",     initials: "Н",  color: "#7FB3F2", pct: 19, streak: 6,  todayDone: 1, todayTotal: 4 },
      { name: "Светлана", initials: "С",  color: "#F4A574", pct: 50, streak: 12, todayDone: 2, todayTotal: 4 },
      { name: "Вадим",    initials: "В",  color: "#74CFE0", pct: 92, streak: 21, todayDone: 4, todayTotal: 4 },
      { name: "Сергей",   initials: "Сг", color: "#76D3A0", pct: 67, streak: 9,  todayDone: 3, todayTotal: 4 },
    ],
    habits: [
      { id: 201, emoji: "🙏", name: "Добрые дела",         isMain: true,  doneToday: 3, total: 4, weekPct: 0.78, week: [1,1,0,1,1,1,1] },
      { id: 202, emoji: "🧘🏼‍♀️", name: "Групповая медитация", isMain: false, doneToday: 2, total: 4, weekPct: 0.65, week: [1,0,1,1,0,1,1] },
      { id: 203, emoji: "📖", name: "Читаем вместе",        isMain: false, doneToday: 1, total: 4, weekPct: 0.42, week: [0,1,0,1,0,0,1] },
      { id: 204, emoji: "🥗", name: "Здоровое питание",     isMain: false, doneToday: 3, total: 4, weekPct: 0.81, week: [1,1,1,1,0,1,1] },
    ] },
  { _id: "seed-2", name: "Добрые дела", vis: "private", emblem: "🌱", goal: "21-дневный спринт доброты", target: 21, current: 9, unit: "дней", date: "1 — 21 апр", progress: 0.41, accent: "#d6f3df",
    members: [
      { name: "Анна", initials: "А", color: "#F4A574", pct: 33, streak: 4, todayDone: 1, todayTotal: 2 },
      { name: "Миша", initials: "М", color: "#B89AF0", pct: 71, streak: 15, todayDone: 2, todayTotal: 2 },
    ],
    habits: [
      { id: 211, emoji: "🌱", name: "Доброе дело дня", isMain: true,  doneToday: 2, total: 2, weekPct: 0.70, week: [1,1,1,0,1,1,0] },
      { id: 212, emoji: "💬", name: "Поддержать друга", isMain: false, doneToday: 1, total: 2, weekPct: 0.50, week: [1,0,1,0,1,0,1] },
    ] },
];
/* Demo day-mood history (calendar dots). Extracted so enterDemo() can restore it. */
const SEED_DAYMOODS = { 21: 0, 22: 1, 23: 4, 24: 5, 25: 1, 26: 3, 27: 0, 28: 1 };
/* Demo journal — per-day sub-state #tags (+ optional free note). Day → {tags, note}. */
const SEED_DAYNOTES = {
  28: { tags: ["благодарность", "забота"], note: "" },
  27: { tags: ["спорт", "продуктивно"], note: "Рано встал — много успел до завтрака." },
  25: { tags: ["встреча_с_друзьями"], note: "" },
  23: { tags: ["дедлайн", "недосып"], note: "" },
};

// New-item id source. Module-level → resets to 1000 on every reload alongside the seeds.
let _bosNextId = 1000;
const _nid = () => ++_bosNextId;
// Stable GLOBAL id for a habit/goal's cloud row. The local _nid is a per-session counter
// that resets to 1000 + collides across users/sessions, so it can NOT key cloud rows.
// The habits.id column is `text`, so any string works.
const _uuid = () => { try { if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID(); } catch (e) {} return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10); };
// Because _nid resets to 1000 and is reissued every session, two DIFFERENT habits/goals could end up
// with the SAME local id. That broke BOTH the list's React keys (the duplicate tile silently didn't
// render — David: «создаю привычку, в списке нет, а на орбитах есть») AND toggle/remove-by-id (a tap
// marked the twin too). On profile hydration: give every item its own permanent cloudId and a UNIQUE
// local id, and lift the counter above them all so freshly created items never collide either.
function _uniqLocal(arr) {
  arr = arr || [];
  arr.forEach(function (x) { if (x) { var n = Number(x.id); if (isFinite(n) && n >= _bosNextId) _bosNextId = n; } }); // seed counter above max existing id
  var seen = {};
  arr.forEach(function (x) {
    if (!x) return;
    if (x.cloudId == null) x.cloudId = _uuid();
    if (x.id == null || seen[x.id] != null) x.id = _nid(); // duplicate/missing → fresh id (guaranteed > all)
    seen[x.id] = 1;
  });
  return arr;
}
// «Дела»-списки хранятся ЛОКАЛЬНО и раньше брали id из _nid() (счётчик, что сбрасывается в 1000
// каждую загрузку) → первый новый список после перезагрузки получал 1001 и СТАЛКИВАЛСЯ с уже
// сохранённым 1001: два списка с одним id → правка/удаление задевали ОБА («дубли», «всё удаляется»).
// Теперь новые id = _uuid() (не сталкиваются никогда), а этот нормализатор ЛЕЧИТ старые снимки:
// любой пропущенный или повторный id (списка или дела) переписывается на свежий uuid при загрузке.
const _bosNormLists = (arr) => {
  const seen = {};
  return (Array.isArray(arr) ? arr : []).map((l) => {
    let id = l && l.id;
    if (id == null || seen[id]) id = _uuid();
    seen[id] = 1;
    const tseen = {};
    const tasks = (Array.isArray(l && l.tasks) ? l.tasks : []).map((t) => {
      let tid = t && t.id;
      if (tid == null || tseen[tid]) tid = _uuid();
      tseen[tid] = 1;
      return { ...t, id: tid };
    });
    return { ...l, id, tasks };
  });
};

/* Home widgets: full for the demo; minimal for a fresh new user — don't overwhelm.
   Stat cards / calendar / team / energy stay off until there's something to show. */
const DEMO_WIDGETS  = { quote: true, mood: true, streak: true,  level: true,  calendar: true,  team: true,  energy: true,  ai: true,  weather: false, books: false };
const FRESH_WIDGETS = { quote: true, mood: true, streak: false, level: true, calendar: false, team: false, energy: false, ai: false, weather: false, books: false };

/* Promo render (the 3-phone marketing composite in promo.html): keep the filled
   demo data, but start with the guided tour already "done" so no intro sheet
   auto-rises over the screens — they must read clean in the small welcome image.
   Inert for real users (the flag is only ever set by promo.html's iframes). */
const IS_PROMO = (() => { try { return new URLSearchParams(window.location.search).get("promo") === "1"; } catch (e) { return false; } })();

// ── Referral / invite link (Telegram-bot deep-link) ──────────────────────────
// The live app is a Telegram Mini App; an invite link is t.me/<bot>?startapp=ref_<uid>.
// Tapping it opens the Mini App with start_param = "ref_<uid>", which enterLive reads to
// record who referred the new user (profiles.referred_by → the invitee shows up on the
// inviter's orbit + «Друзья»). The PWA fallback uses a plain ?ref= query. ONE place to
// change the bot. (Requires the bot to be a configured Mini App in BotFather so startapp
// passes start_param.)
var BOS_BOT_USERNAME = "BalanceOS8_bot";
function bosInviteLink(uid) {
  return "https://t.me/" + BOS_BOT_USERNAME + (uid ? "?startapp=ref_" + uid : "");
}
// Team INVITE deep-link: t.me/<bot>?startapp=team_<cloudId>. Opening it launches the Mini
// App with start_param="team_<cloudId>", which the live hydration decodes (bosJoinTeamId)
// and joins via joinViaLink. startapp allows [A-Za-z0-9_-] — a uuid cloudId fits.
function bosTeamInviteLink(cloudId) {
  return "https://t.me/" + BOS_BOT_USERNAME + (cloudId ? "?startapp=team_" + cloudId : "");
}
// The referral id that brought THIS user in: from the Telegram start_param ("ref_<uid>")
// when launched via the bot deep-link, else the web ?ref= query. Null if organic.
function bosReferralId() {
  try {
    var sp = window.__TG && window.__TG.initDataUnsafe && window.__TG.initDataUnsafe.start_param;
    if (sp) {
      if (/^ref_/.test(sp)) return sp.slice(4);
      // A shared-habit link can ALSO carry the referrer: hb_<code>__<refcode> — so sharing a
      // habit attributes the friend on the inviter's orbit too (one start_param, two jobs).
      if (/^hb_/.test(sp)) { var pp = sp.indexOf("__"); if (pp >= 0) return sp.slice(pp + 2); }
    }
  } catch (e) {}
  try { var q = new URLSearchParams(window.location.search).get("ref"); if (q) return q; } catch (e) {}
  return null;
}
// The team to auto-join on launch: from the Telegram start_param ("team_<cloudId>") when
// opened via a team deep-link, else the web ?team= query. Null if neither.
function bosJoinTeamId() {
  try { var sp = window.__TG && window.__TG.initDataUnsafe && window.__TG.initDataUnsafe.start_param; if (sp && /^team_/.test(sp)) return sp.slice(5); } catch (e) {}
  try { var q = new URLSearchParams(window.location.search).get("team"); if (q) return q; } catch (e) {}
  return null;
}
// SHARED HABIT (habit buddy, NOT a team — David: «свою привычку сделать общей с другом,
// видеть прогресс друг друга на календарике»). Link: t.me/<bot>?startapp=hb_<code>, with an
// optional __<refcode> tail so the same link also attributes the referral. enterLive decodes
// the code (bosJoinSharedHabitId) → bosCloud.joinSharedHabit joins the SAME shared habit.
function bosSharedHabitLink(code, refCode) {
  if (!code) return "https://t.me/" + BOS_BOT_USERNAME;
  return "https://t.me/" + BOS_BOT_USERNAME + "?startapp=hb_" + code + (refCode ? "__" + refCode : "");
}
function bosJoinSharedHabitId() {
  try {
    var sp = window.__TG && window.__TG.initDataUnsafe && window.__TG.initDataUnsafe.start_param;
    if (sp && /^hb_/.test(sp)) { var rest = sp.slice(3); var pp = rest.indexOf("__"); return pp >= 0 ? rest.slice(0, pp) : rest; }
  } catch (e) {}
  try { var q = new URLSearchParams(window.location.search).get("habit"); if (q) return q; } catch (e) {}
  return null;
}
// Open Telegram's NATIVE share/forward picker with an invite link — the privacy-safe way to
// reach contacts in a Mini App (the user picks chats; we never read the contact list). Returns
// true if handled; callers (ShareAppSheetLive, ShareHabitSheetLive, habits-kit) fall back to
// copy-to-clipboard when false. Team share already calls openTelegramLink directly; this gives
// the app-referral + habit-share buttons the same native picker instead of a silent copy.
function bosShare(url, text) {
  var tg = null;
  try { tg = window.__TG || (window.Telegram && window.Telegram.WebApp) || null; } catch (e) {}
  try { if (tg && tg.openTelegramLink) { tg.openTelegramLink("https://t.me/share/url?url=" + encodeURIComponent(url) + "&text=" + encodeURIComponent(text || "")); return true; } } catch (e) {}
  try { if (navigator.share) { navigator.share({ url: url, text: text || "" }); return true; } } catch (e) {}
  return false;
}
// A short, link-safe code for a shared habit (7 chars a–z0–9). Math.random is fine in the
// browser; collisions are astronomically unlikely for one user's handful of shared habits.
function bosGenShareCode() {
  var s = "", a = "abcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 7; i++) s += a.charAt(Math.floor(Math.random() * a.length));
  return s;
}

/* ── T0.2 — bulletproof, date-keyed habit model (LIVE profiles only) ──
   A live habit records each completion as a date key in `h.log` ({ "2026-06-23": true }) —
   an idempotent UPSERT by (habit, day). `done` and `streak` are DERIVED from that log, so a
   new day clears yesterday's checkmarks while the streak & XP history persist; toggling the
   same day twice can't double-count or corrupt anything. The demo stays a frozen showcase
   (curated `done`/`streak`), untouched by all of this. At T1 the same log syncs to Supabase. */
// The post-signup state dial (onb-mood) is shown to a LIVE Telegram user EXACTLY ONCE — the
// first entry after registration. We persist a flag the moment they finish it, so every later
// entry skips straight to home (David: «первый раз при входе, дальше не показывается»). Demo is
// exempt: it always shows the dial, so the demo entry paths never read or write this flag.
function bosDialSeen() { try { return localStorage.getItem("bos:dialSeen") === "1"; } catch (e) { return false; } }
function bosMarkDialSeen() { try { localStorage.setItem("bos:dialSeen", "1"); } catch (e) {} }
function bosTodayKey(d) {
  var x = d || new Date();
  // local-date key (not UTC) so "today" matches the user's own clock
  var m = x.getMonth() + 1, day = x.getDate();
  return x.getFullYear() + "-" + (m < 10 ? "0" + m : m) + "-" + (day < 10 ? "0" + day : day);
}
function bosDayKeyOffset(n) { var x = new Date(); x.setDate(x.getDate() - n); return bosTodayKey(x); }
// Consecutive-day streak from a {dateKey:true} log: counts back from today, or from yesterday
// if today isn't done yet (an open day doesn't break a streak — only a fully missed day does).
function bosStreak(log) {
  if (!log) return 0;
  var start = log[bosTodayKey()] ? 0 : 1;
  if (start === 1 && !log[bosDayKeyOffset(1)]) return 0;
  var n = 0;
  for (var i = start; i < 3650; i++) { if (log[bosDayKeyOffset(i)]) n++; else break; }
  return n;
}
// How many distinct days the user has logged their state. Mood index 0 (Спокойствие) is a
// REAL entry, so presence is tested with != null, never truthiness.
function bosMoodDays(dayMoods) {
  if (!dayMoods) return 0;
  // count only REAL logged days (YYYY-MM-DD keys) — never a demo seed's numeric keys
  var n = 0; for (var k in dayMoods) { if (Object.prototype.hasOwnProperty.call(dayMoods, k) && dayMoods[k] != null && /^\d{4}-\d{2}-\d{2}$/.test(k)) n++; }
  return n;
}
// Consecutive days of state check-in up to today (or yesterday if today's still open) — the
// "🔥 дней подряд" headline for the state widget. Same shape as bosStreak but != null aware.
function bosMoodStreak(dayMoods) {
  if (!dayMoods) return 0;
  var has = function (i) { return dayMoods[bosDayKeyOffset(i)] != null; };
  var start = has(0) ? 0 : 1;
  if (start === 1 && !has(1)) return 0;
  var n = 0; for (var i = start; i < 3650; i++) { if (has(i)) n++; else break; }
  return n;
}
// Bonus XP for HOLDING the state streak: every full 7-day run of consecutive check-ins pays
// +50 ("удержал неделю — бонус"). Scans ~1y of history; stable & monotonic with the data.
function bosMoodStreakBonusXP(dayMoods) {
  if (!dayMoods) return 0;
  var weeks = 0, run = 0;
  for (var i = 0; i < 400; i++) {
    if (dayMoods[bosDayKeyOffset(i)] != null) run++;
    else { weeks += Math.floor(run / 7); run = 0; }
  }
  weeks += Math.floor(run / 7);
  return weeks * 50;
}
// Russian day-word for a count (1 день, 2 дня, 5 дней) — for streak labels.
function bosRuDays(n) {
  var a = Math.abs(n) % 100, b = n % 10;
  if (a > 10 && a < 20) return "дней";
  if (b === 1) return "день";
  if (b >= 2 && b <= 4) return "дня";
  return "дней";
}
// Total earned XP for a live profile. Every habit completion is +10 XP. Engagement also
// pays: +5 per day you check in your state, +10 per day you write a journal line — so
// the orb/journal "pay" XP, which the app communicates. Monotonic (just counts of entries).
function bosTotalXP(habits, extras) {
  var n = 0;
  (habits || []).forEach(function (h) { if (h && h.log) n += Object.keys(h.log).length; });
  var xp = n * 10;
  if (extras) {
    xp += Object.keys(extras.moods || {}).length * 5;              // +5 за отметку состояния
    xp += bosMoodStreakBonusXP(extras.moods);                      // +50 за каждую удержанную неделю состояния
    var notes = extras.notes || {};
    Object.keys(notes).forEach(function (k) {                       // +10 за запись в дневник
      var e = notes[k];
      if (e && (((e.note != null) && ("" + e.note).trim()) || (e.tags && e.tags.length))) xp += 10;
    });
  }
  return xp;
}
// BASE live XP = real actions only (habits + state + journal + state-week bonus). This is the
// foundation for achievement conditions, so badge XP never feeds back into "reach level N".
function bosBaseXP(app) { return app ? bosTotalXP(app.habits, { moods: app.dayMoods, notes: app.dayNotes }) : 0; }
// Displayed live XP = base + bonus XP from unlocked achievements — use this everywhere a level
// or XP total is SHOWN, so achievements really push the user forward.
function bosLiveXP(app) { return bosBaseXP(app) + (typeof bosAchievementBonusXP === "function" ? bosAchievementBonusXP(app) : 0); }
// XP → level. Each level costs a little more than the last (100, 150, 200…): a gentle curve
// so the first wins come fast and later levels feel earned.
function bosLevelInfo(xp) {
  xp = xp || 0;
  var L = 1, floor = 0, step = 100;
  while (xp >= floor + step) { floor += step; L++; step += 50; }
  return { level: L, xp: xp, floor: floor, next: floor + step, into: xp - floor, span: step, pct: Math.max(2, Math.round(((xp - floor) / step) * 100)) };
}
// Highest current streak across a profile's habits (the "🔥 Серия" headline number).
function bosMaxStreak(habits) { var m = 0; (habits || []).forEach(function (h) { if (h && h.streak > m) m = h.streak; }); return m; }

/* ── Achievements ────────────────────────────────────────────────────────────
   Real, persisted milestone badges for LIVE users — earned from real signals, each
   pays bonus XP, and a freshly-unlocked one pops a celebration. Conditions use BASE
   xp (bosBaseXP), so a badge's XP can never cascade-unlock the next "reach level N".
   Paced against the real XP→time curve so there's always a next thing, never too often. */
function bosCareDays(app) {
  var days = {}, k;
  var dm = (app && app.dayMoods) || {};
  for (k in dm) { if (dm[k] != null && /^\d{4}-\d{2}-\d{2}$/.test(k)) days[k] = 1; }
  var dn = (app && app.dayNotes) || {};
  for (k in dn) { var e = dn[k]; if (/^\d{4}-\d{2}-\d{2}$/.test(k) && e && (((e.note != null) && ("" + e.note).trim()) || (e.tags && e.tags.length))) days[k] = 1; }
  return Object.keys(days).length;
}
var BOS_ACHIEVEMENTS = [
  { id: "first_habit", i: "🌱", t: "Первый шаг",        d: "Создал первую привычку",                       xp: 30,   accent: "#7FB37F", how: "Создай первую привычку",                  test: function (c) { return c.habits >= 1; } },
  { id: "week_state",  i: "🔥", t: "Неделя с собой",     d: "7 дней подряд отмечал состояние",               xp: 60,   accent: "#FF8A5B", how: "Отмечай состояние 7 дней подряд",         test: function (c) { return c.moodStreak >= 7; } },
  { id: "lvl5",        i: "⚡", t: "Разогрев",           d: "Достиг 5 уровня",                              xp: 75,   accent: "#FEDE34", how: "Дойди до 5 уровня",                       test: function (c) { return c.level >= 5; } },
  { id: "habit21",     i: "📿", t: "Привычка прижилась", d: "Держал привычку 21 день подряд",               xp: 120,  accent: "#9BCBA0", how: "Держи привычку 21 день подряд",           test: function (c) { return c.habitStreak >= 21; } },
  { id: "care30",      i: "🧠", t: "Месяц с собой",      d: "30 дней наблюдал состояние или вёл дневник",    xp: 120,  accent: "#7FB5FF", how: "30 дней отмечай состояние или пиши дневник", test: function (c) { return c.careDays >= 30; } },
  { id: "team",        i: "🤝", t: "Не один",            d: "Собрал команду или позвал друга",              xp: 100,  accent: "#5FA8FF", how: "Создай команду или пригласи друга",       test: function (c) { return c.teams >= 1 || c.friends >= 1; } },
  { id: "lvl10",       i: "🏅", t: "Уверенный",          d: "Достиг 10 уровня",                             xp: 150,  accent: "#FEDE34", how: "Дойди до 10 уровня",                      test: function (c) { return c.level >= 10; } },
  { id: "care100",     i: "🗓️", t: "100 дней пути",      d: "100 дней заботы о себе",                       xp: 250,  accent: "#7FB5FF", how: "100 дней отмечай состояние или дневник",  test: function (c) { return c.careDays >= 100; } },
  { id: "habit60",     i: "💎", t: "Несгибаемый",        d: "Держал привычку 60 дней подряд",               xp: 300,  accent: "#9BD0FF", how: "Держи привычку 60 дней подряд",           test: function (c) { return c.habitStreak >= 60; } },
  { id: "goal",        i: "🎯", t: "Цель достигнута",    d: "Довёл цель до конца",                          xp: 200,  accent: "#FF8A5B", how: "Заверши хотя бы одну цель",               test: function (c) { return c.goalsDone >= 1; } },
  { id: "lvl15",       i: "🌟", t: "Глубже",             d: "Достиг 15 уровня",                             xp: 350,  accent: "#FEDE34", how: "Дойди до 15 уровня",                      test: function (c) { return c.level >= 15; } },
  { id: "care180",     i: "🏔️", t: "Полгода роста",      d: "180 дней заботы о себе",                       xp: 450,  accent: "#A8E0E8", how: "Полгода отмечай состояние или дневник",   test: function (c) { return c.careDays >= 180; } },
  { id: "lvl20",       i: "🌍", t: "Вершина",            d: "Достиг 20 уровня",                             xp: 600,  accent: "#FEDE34", how: "Дойди до 20 уровня",                      test: function (c) { return c.level >= 20; } },
  { id: "year",        i: "👑", t: "Год пути",           d: "365 дней заботы о себе",                       xp: 800,  accent: "#E8C86A", how: "Год отмечай состояние или дневник",       test: function (c) { return c.careDays >= 365; } },
  { id: "lvl25",       i: "⭐", t: "Только начало",      d: "Достиг 25 уровня — для кого-то это лишь старт", xp: 1000, accent: "#C9B8FF", how: "Дойди до 25 уровня",                      test: function (c) { return c.level >= 25; } },
];
function bosAchContext(app) {
  var habits = (app && app.habits) || [];
  var teams = ((app && app.teams) || []).filter(function (t) { return t && (t.joined || t.cloudId); }).length;
  var goalsDone = ((app && app.goals) || []).filter(function (g) { return g && g.target && (g.current || 0) >= g.target; }).length;
  var friends = 0; try { friends = (app && (app.invitedCount || app.friendsCount)) || 0; } catch (e) {}
  return {
    level: bosLevelInfo(bosBaseXP(app)).level,
    careDays: bosCareDays(app),
    moodStreak: bosMoodStreak(app && app.dayMoods),
    habitStreak: bosMaxStreak(habits),
    habits: habits.length, teams: teams, friends: friends, goalsDone: goalsDone,
  };
}
// Full ladder with each badge's .earned for the current live profile.
function bosEarnedAchievements(app) {
  var c = bosAchContext(app);
  return BOS_ACHIEVEMENTS.map(function (a) { return Object.assign({}, a, { earned: !!a.test(c) }); });
}
// Total bonus XP from unlocked achievements — added on top of base XP for the shown level.
function bosAchievementBonusXP(app) {
  var c = bosAchContext(app), sum = 0;
  for (var i = 0; i < BOS_ACHIEVEMENTS.length; i++) { if (BOS_ACHIEVEMENTS[i].test(c)) sum += BOS_ACHIEVEMENTS[i].xp || 0; }
  return sum;
}
function bosEarnedAchIds(app) {
  var c = bosAchContext(app), ids = [];
  for (var i = 0; i < BOS_ACHIEVEMENTS.length; i++) { if (BOS_ACHIEVEMENTS[i].test(c)) ids.push(BOS_ACHIEVEMENTS[i].id); }
  return ids;
}
function bosAchById(id) { for (var i = 0; i < BOS_ACHIEVEMENTS.length; i++) { if (BOS_ACHIEVEMENTS[i].id === id) return BOS_ACHIEVEMENTS[i]; } return null; }
// Re-derive a live habit's `done`/`streak` from its log for TODAY. Also migrates a pre-model
// habit (had `done`, no `log`) forward so a currently-checked habit isn't lost on upgrade.
function bosRollHabit(h) {
  if (!h) return h;
  // `done` is derived STRICTLY from whether TODAY is in the log, so a habit checked on a
  // previous day shows unchecked once the date rolls over (streak/XP still come from the log).
  // (Removed a "migrate done→today" line that RE-STAMPED today on every roll — it made any
  //  log-less `done:true` habit look permanently completed and never reset overnight.)
  var tk = bosTodayKey();
  var log = h.log ? Object.assign({}, h.log) : {};
  return Object.assign({}, h, { log: log, done: !!log[tk], streak: bosStreak(log) });
}

/* ── User avatar — pick a Memoji, an Emoji, or keep the default face. ──
   Value: null/"default" → assets/sphere.png; "m1".."m18" → assets/people/mN.png;
   "emoji:🦊" → that emoji on a soft disc. Persisted per profile; shown everywhere
   the user's face appears. At T1 other users' avatars come down the same field. */
const BOS_MEMOJI = ["default", "m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11", "m12", "m13", "m14", "m15", "m16", "m17", "m18"];
const BOS_EMOJI_AVATARS = ["🦊", "🐼", "🐨", "🦁", "🐯", "🐵", "🐸", "🐙", "🦄", "🐲", "🌟", "🔥", "🌈", "🍀", "🌸", "⚡", "💎", "🚀", "🎧", "🧠", "❤️", "🦋"];
/* Стартовая аватарка = случайное ЛИЦО-эмодзи (David: «у всех одно лицо — люди не понимают,
   что аватарку можно менять»). ТОЛЬКО лица; зверей/предметы человек выберет сам в профиле.
   Присваивается один раз тем, кто ещё НИКОГДА не выбирал (avatar == null); вручную
   выбранная сфера («default») уважается и не трогается. */
const BOS_FACE_AVATARS = ["😀", "😃", "😄", "😁", "😊", "🙂", "😉", "😌", "😎", "🤓", "🥳", "🤩", "🥰", "😇", "🤠", "😋", "😜", "🤪", "🤗", "🤭", "🙃", "😏", "🧐", "🫡"];
function bosRandomFaceAvatar() { return "emoji:" + BOS_FACE_AVATARS[Math.floor(Math.random() * BOS_FACE_AVATARS.length)]; }
function bosAvatarBg(avatar) {
  if (!avatar || avatar === "default") return "url(./assets/sphere.png) center/cover no-repeat";
  if (("" + avatar).indexOf("emoji:") === 0) return "linear-gradient(150deg,#eef1f6,#d3d9e4)";
  if (/^m\d+$/.test(avatar)) return "url(./assets/people/" + avatar + ".png) center/cover no-repeat";
  return "url(./assets/sphere.png) center/cover no-repeat";
}
function BosAvatar({ avatar, size, style, bare }) {
  size = size || 44;
  var isEmoji = avatar && ("" + avatar).indexOf("emoji:") === 0;
  // `bare`: when an emoji avatar sits ON a glossy mood orb, float the glyph on a
  // TRANSPARENT disc (no grey plate) so the sphere shows through — the emoji reads as
  // a face on the orb. Without `bare` (normal list/header chips) the soft disc stays.
  var bg = (bare && isEmoji) ? "transparent" : bosAvatarBg(avatar);
  var base = Object.assign({ width: size, height: size, borderRadius: "50%", flexShrink: 0, background: bg }, style || {});
  if (isEmoji) return <div style={Object.assign(base, { display: "grid", placeItems: "center", fontSize: Math.round(size * 0.56), lineHeight: 1, textShadow: bare ? "0 1px 4px rgba(0,0,0,0.3)" : "none" })}>{("" + avatar).slice(6)}</div>;
  return <div style={base} />;
}

/* The big "you" orb — your face rendered AS a glossy mood sphere (used in the home &
   profile orbit centres and the small hero orbs). Three cases, so an EMOJI avatar never
   sits on the default face nor on a flat grey plate:
     • memoji  → your photo fills the orb
     • emoji   → the glyph floats on a CLEAN glassy MOOD sphere — no sphere.png face behind
     • default → the app's default face (sphere.png), tinted by the current mood
   `tint` is tintFromMood(...) = [light, mid, dark]. The caller positions this and adds the
   outer drop shadow / glow; here we only paint the orb body + its inner glassy shading. */
function BosOrbFace({ avatar, size, tint, style }) {
  size = size || 80;
  var isEmoji = avatar && ("" + avatar).indexOf("emoji:") === 0;
  var isMemoji = avatar && /^m\d+$/.test(avatar);
  var t0 = (tint && tint[0]) || "#ffd97a", t2 = (tint && tint[2]) || "#d97757";
  var base = Object.assign({ width: size, height: size, borderRadius: "50%", flexShrink: 0, position: "relative", overflow: "hidden" }, style || {});
  if (isMemoji) return <div style={Object.assign(base, { background: "url(./assets/people/" + avatar + ".png) center/cover no-repeat", boxShadow: "inset -3px -5px 12px rgba(0,0,0,0.22)" })} />;
  if (isEmoji) return (
    <div style={Object.assign(base, {
      background: "radial-gradient(circle at 33% 27%, rgba(255,255,255,0.9), rgba(255,255,255,0) 44%), radial-gradient(circle at 50% 52%, " + t0 + ", " + t2 + ")",
      boxShadow: "inset -4px -7px 16px rgba(0,0,0,0.22), inset 3px 4px 12px rgba(255,255,255,0.22)",
      display: "grid", placeItems: "center" })}>
      <span style={{ fontSize: Math.round(size * 0.5), lineHeight: 1, textShadow: "0 1px 5px rgba(0,0,0,0.3)" }}>{("" + avatar).slice(6)}</span>
    </div>
  );
  return <div style={Object.assign(base, { background: "url(./assets/sphere.png) center/cover no-repeat, radial-gradient(circle at 30% 30%, " + t0 + ", " + t2 + ")", boxShadow: "inset -3px -5px 12px rgba(0,0,0,0.22)" })} />;
}

function AppProvider({ children }) {
  const [mood, setMood] = useState(MOOD_OPTIONS[1]);
  const [dayMoods, setDayMoods] = useState(SEED_DAYMOODS);
  const [dayNotes, setDayNotes] = useState(SEED_DAYNOTES);
  const [widgets, setWidgets] = useState(DEMO_WIDGETS);
  // v528 (секция Д): СВОБОДНАЯ сетка главной — раскладка { order: ["w:hero","h:<id>","g:<id>",...], hidden: [...] };
  // null = ещё не мигрирована из widgets (home_live построит дефолт при первом входе в новую главную).
  const [homeLayout, setHomeLayout] = useState(null);
  const [wheelSpheres, setWheelSpheres] = useState(DEFAULT_SPHERES);
  // "auto" = follow per-route DARK_ROUTES; "light" / "dark" force everywhere. Stays "auto"
  // (= light, DARK_ROUTES is empty) by default — we polish the LIGHT theme end-to-end first,
  // THEN revisit dark (David's call). Dark is still reachable via the Settings toggle.
  // ЗАПОМИНАЕТСЯ: выбор темы переживает перезапуск (localStorage) — иначе тумблер «Тёмная
  // тема» тихо сбрасывался при каждом открытии мини-аппа.
  const [themeOverride, setThemeOverride] = useState(() => { try { return localStorage.getItem("bos:theme") || "auto"; } catch (e) { return "auto"; } });
  useEffect(() => { try { localStorage.setItem("bos:theme", themeOverride); } catch (e) {} }, [themeOverride]);

  // ПРОГРЕВ ЛИЦ в свободную минуту после старта: 18 мемоджи + сфера декодируются заранее, пока
  // никто не смотрит — первое появление дисков во Вселенной / людей на «Я» больше не декодирует
  // PNG посреди анимации (микро-фризы зум-въезда). URL те же самые, ничего не подменяется.
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const warm = (src) => { const im = new Image(); im.src = src; if (im.decode) im.decode().catch(() => {}); };
        for (let i = 1; i <= 18; i++) warm("./assets/people/m" + i + ".png");
        warm("./assets/sphere.png");
      } catch (e) {}
    }, 2500);
    return () => clearTimeout(t);
  }, []);

  // Demo vs. fresh-start experience. Default = demo (a reload always lands on the
  // pristine filled demo). The signup screen flips this via enterDemo/enterFresh.
  const [mode, setMode] = useState("demo");      // "demo" | "fresh"
  const [pendingAch, setPendingAch] = useState(null); // a freshly-unlocked achievement to celebrate
  const [pendingDayClose, setPendingDayClose] = useState(null); // today's Daily Balance just closed → one calm completion reveal
  const [pendingJoinWelcome, setPendingJoinWelcome] = useState(null); // freshly-joined shared habit / team via invite link → greet «X позвал тебя»
  const [userName, setUserName] = useState("Павел");
  const [avatar, setAvatar] = useState(null); // null = default Memoji (assets/sphere.png)
  // Guided coach-mark tour. -1 = off; 0..N = current stop. Started on entering demo.
  const [tourStep, setTourStep] = useState(-1);
  const [tourMode, setTourMode] = useState("demo"); // "demo" | "fresh"

  // ── Fresh-user onboarding (replaces the old forced coach-mark tour) ──
  // onbWelcome: the gentle 3-step iOS bottom-sheet welcome, shown once on the
  // first home screen. onbTab: a one-time intro sheet that rises when the user
  // FIRST opens a given tab themselves — unobtrusive, but nobody gets lost.
  const [onbWelcome, setOnbWelcome] = useState(false);
  const [onbTab, setOnbTab] = useState(null);
  const seenTabs = useRef({});
  const showTabIntro = (route) => {
    if (seenTabs.current[route]) return;
    seenTabs.current[route] = true;
    setOnbTab(route);
  };
  // Per-screen spotlight guide (demo): a demo intro sheet's "Показать детально"
  // launches just that screen's stops; on finish the tour returns to the screen.
  const [tourScreen, setTourScreen] = useState(null);
  const startScreenTour = (key) => { setTourScreen(key); setTourStep(0); };
  // Once the guided tour is finished OR dismissed once, NOTHING auto-pops again — no
  // per-tab sheet jumps in your face. The whole guide is one all-or-nothing thing.
  const [guideDone, setGuideDone] = useState(IS_PROMO);
  const finishGuide = () => { setGuideDone(true); setTourScreen(null); setTourStep(-1); setOnbTab(null); };

  // Shared habit / goal store + mutators (the app's single source of truth).
  const [habits, setHabits] = useState(SEED_HABITS);
  const [goals, setGoals] = useState(SEED_GOALS);
  // v598: локальный todo-виджет «Дела» — списки-вкладки со своими делами (разовые дела).
  // ТОЛЬКО локально (в телефоне): в облачный снапшот НЕ уходит; синк устройств — отдельный этап.
  const [taskLists, setTaskLists] = useState([]);

  // Demo/fresh: simple boolean flip (curated showcase). Live: idempotent date-keyed
  // UPSERT into the habit's log, with done/streak re-derived from it (T0.2).
  // Live cloud sync is per-action (fire-and-forget, guarded): local stays the source of
  // truth, the row write is a background mirror. cloudId = the habit's stable cloud key.
  const _liveCloud = () => mode === "live" && window.bosCloud && window.bosCloud.enabled();
  const toggleHabit = (id) => setHabits(hs => hs.map(h => {
    if (h.id !== id) return h;
    if (mode !== "live") return { ...h, done: !h.done };
    var tk = bosTodayKey();
    var log = h.log ? Object.assign({}, h.log) : {};
    var on; if (log[tk]) { delete log[tk]; on = false; } else { log[tk] = true; on = true; }
    try { if (h.cloudId && _liveCloud()) window.bosCloud.toggleHabitLog(h.cloudId, tk, on); } catch (e) {}
    // УМНЫЙ ПУШ: отметил привычку с напоминанием → гасим сегодняшний пуш (бот не дёрнет зря).
    try { if (on && h.reminder && h.reminder.on && _liveCloud() && window.bosCloud.markReminderDone) window.bosCloud.markReminderDone(h.cloudId || h.id); } catch (e) {}
    // SHARED habit (habit buddy): mirror today's mark to the shared log so the friend sees it.
    try { if (h.shareCode && _liveCloud() && window.bosCloud.setSharedLog) window.bosCloud.setSharedLog(h.shareCode, tk, on); } catch (e) {}
    // TEAM habit adopted onto your personal list: mirror today's mark to the team log so the team
    // goal counts it — отмечаешь у себя, идёт в командный счёт (David: «приходит как личная»).
    try { if (h.teamHabitId && _liveCloud() && window.bosCloud.toggleTeamHabitToday) window.bosCloud.toggleTeamHabitToday(h.teamHabitId, on); } catch (e) {}
    return Object.assign({}, h, { log: log, done: !!log[tk], streak: bosStreak(log) });
  }));
  const addHabit = (h) => {
    const nh = { id: _nid(), done: false, streak: 0, ...h, cloudId: (h && h.cloudId) || _uuid() };
    setHabits(hs => [...hs, nh]);
    try { if (_liveCloud()) window.bosCloud.upsertHabit(nh); } catch (e) {}
    return nh;
  };
  const updateHabit = (id, patch) => setHabits(hs => hs.map(h => {
    if (h.id !== id) return h;
    const u = { ...h, ...patch };
    try { if (u.cloudId && _liveCloud()) window.bosCloud.upsertHabit(u); } catch (e) {}
    return u;
  }));
  const removeHabit = (id) => {
    setHabits(hs => {
      const h = hs.find(x => x.id === id);
      try { if (h && h.cloudId && _liveCloud()) window.bosCloud.deleteHabit(h.cloudId); } catch (e) {}
      // Удалить и напоминание из облака, чтобы не приходил пуш по несуществующей привычке.
      try { if (h && _liveCloud() && window.bosCloud.deleteReminder) window.bosCloud.deleteReminder(h.cloudId || h.id); } catch (e) {}
      return hs.filter(x => x.id !== id);
    });
    // Аудит #3: убрать удалённую привычку из habitIds всех целей — иначе остаётся «мёртвая
    // ссылка» и цель молча теряет её вклад. Чистим связь и миррорим цель в облако.
    setGoals(gs => gs.map(g => {
      if (!Array.isArray(g.habitIds) || g.habitIds.indexOf(id) < 0) return g;
      const ng = { ...g, habitIds: g.habitIds.filter(x => x !== id) };
      try { if (ng.cloudId && _liveCloud()) window.bosCloud.upsertGoal(ng); } catch (e) {}
      return ng;
    }));
  };
  // Drag-to-reorder: apply the new id order, renumber `sort`, and mirror the moved rows to the
  // cloud (loadHabits orders by sort, so the order persists across sessions — David's account).
  const reorderHabits = (orderedIds) => setHabits(hs => {
    const by = {}; hs.forEach(h => { by[h.id] = h; });
    const next = [];
    (orderedIds || []).forEach(id => { if (by[id]) { next.push(by[id]); delete by[id]; } });
    hs.forEach(h => { if (by[h.id]) next.push(h); }); // keep any not in the list, in place
    const out = next.map((h, i) => (h.sort === i ? h : { ...h, sort: i }));
    try { if (_liveCloud()) out.forEach((h, i) => { const old = hs.find(x => x.id === h.id); if (h.cloudId && (!old || old.sort !== i)) window.bosCloud.upsertHabit(h); }); } catch (e) {}
    return out;
  });

  // Live profiles: when the app (re)gains focus, re-derive today's checkmarks from each
  // habit's log — a habit checked yesterday shows unchecked today, while streak/XP persist.
  // No-op unless something actually changed, so it won't churn renders or saves.
  useEffect(() => {
    if (mode !== "live") return;
    const roll = () => setHabits(hs => {
      const next = hs.map(bosRollHabit);
      const changed = next.some((h, i) => h.done !== hs[i].done || h.streak !== hs[i].streak);
      return changed ? next : hs;
    });
    roll();
    window.addEventListener("focus", roll);
    document.addEventListener("visibilitychange", roll);
    return () => { window.removeEventListener("focus", roll); document.removeEventListener("visibilitychange", roll); };
  }, [mode]);

  // Разовая (за сессию) синхронизация в облако: (1) часовой пояс в профиль — для вечернего
  // чек-ина (даже если привычек нет); (2) расписание напоминаний — чтобы серверный планировщик
  // слал пуши и для привычек, заведённых ДО фичи. Graceful: нет колонок/таблиц → тихий no-op.
  const _remSyncedRef = useRef(false);
  const _tzSyncedRef = useRef(false);
  const [_pushTick, _setPushTick] = useState(0);
  // Тумблер «Push-уведомления» РЕАЛЬНО гейтит бот-пуши (был плацебо — писал в localStorage, никто не
  // читал). Публикуем расписание с active = pushOn: OFF → в habit_reminders active:false → функция
  // remind (select active=true) пропускает → бот молчит. Смена тумблера шлёт bos:pushChanged →
  // перепубликуем все напоминания с новым флагом сразу (не ждём следующего запуска).
  useEffect(() => {
    const f = () => { _remSyncedRef.current = false; _setPushTick(t => t + 1); };
    try { window.addEventListener("bos:pushChanged", f); } catch (e) {}
    return () => { try { window.removeEventListener("bos:pushChanged", f); } catch (e) {} };
  }, []);
  useEffect(() => {
    if (mode !== "live" || !_liveCloud()) return;
    const tz = -(new Date().getTimezoneOffset()); // Москва UTC+3 → +180
    if (!_tzSyncedRef.current && window.bosCloud.saveTz) { _tzSyncedRef.current = true; try { window.bosCloud.saveTz(tz); } catch (e) {} }
    if (!_remSyncedRef.current && window.bosCloud.upsertReminder && habits && habits.length) {
      _remSyncedRef.current = true;
      var _pushOn = true; try { _pushOn = localStorage.getItem("bos:push:" + persistId) !== "0"; } catch (e) {}
      habits.filter(h => h && h.reminder && h.reminder.on && !h.shelved).forEach(h => {
        try { window.bosCloud.upsertReminder(h.cloudId || h.id, { name: h.name, emoji: h.emoji, time: (h.reminder.time || "09:00"), days: Array.isArray(h.days) ? h.days : null, tzOffset: tz, active: _pushOn }); } catch (e) {}
      });
    }
  }, [mode, habits, _pushTick]);

  const addGoal = (g) => {
    const ng = { id: _nid(), current: 0, ...g, cloudId: (g && g.cloudId) || _uuid() };
    setGoals(gs => [...gs, ng]);
    try { if (_liveCloud()) window.bosCloud.upsertGoal(ng); } catch (e) {}
    return ng;
  };
  const updateGoal = (id, patch) => setGoals(gs => gs.map(g => {
    if (g.id !== id) return g;
    const u = { ...g, ...patch };
    try { if (u.cloudId && _liveCloud()) window.bosCloud.upsertGoal(u); } catch (e) {}
    return u;
  }));
  const removeGoal = (id) => {
    // Аудит #4: освободить «только внутри цели» привычки, иначе после удаления цели они
    // становятся невидимыми призраками (нигде не видно, не удалить, но копят XP). Снимаем
    // goalOnly/goalId → привычка снова видна на главной. (Промоушен в круг уже делает это сам.)
    setHabits(hs => hs.map(h => {
      if (h.goalId !== id) return h;
      const nh = { ...h, goalOnly: false, goalId: null };
      try { if (nh.cloudId && _liveCloud()) window.bosCloud.upsertHabit(nh); } catch (e) {}
      return nh;
    }));
    setGoals(gs => {
      const g = gs.find(x => x.id === id);
      try { if (g && g.cloudId && _liveCloud()) window.bosCloud.deleteGoal(g.cloudId); } catch (e) {}
      return gs.filter(x => x.id !== id);
    });
  };
  const reorderGoals = (orderedIds) => setGoals(gs => {
    const by = {}; gs.forEach(g => { by[g.id] = g; });
    const next = [];
    (orderedIds || []).forEach(id => { if (by[id]) { next.push(by[id]); delete by[id]; } });
    gs.forEach(g => { if (by[g.id]) next.push(g); });
    const out = next.map((g, i) => (g.sort === i ? g : { ...g, sort: i }));
    try { if (_liveCloud()) out.forEach((g, i) => { const old = gs.find(x => x.id === g.id); if (g.cloudId && (!old || old.sort !== i)) window.bosCloud.upsertGoal(g); }); } catch (e) {}
    return out;
  });

  const [teams, setTeams] = useState(SEED_TEAMS);
  // New teams go to the TOP so the just-created one is immediately visible.
  const addTeam = (t) => { const nt = { progress: 0, members: [], habits: [], ...t, _id: _nid() }; setTeams(ts => [nt, ...ts]); return nt; };
  const removeTeam = (id) => setTeams(ts => ts.filter(t => t._id !== id));
  // Teams persist in the snapshot blob (no per-row sort), so reorder is just the array order.
  const reorderTeams = (orderedIds) => setTeams(ts => {
    const by = {}; ts.forEach(t => { by[t._id] = t; });
    const next = [];
    (orderedIds || []).forEach(id => { if (by[id]) { next.push(by[id]); delete by[id]; } });
    ts.forEach(t => { if (by[t._id]) next.push(t); });
    return next;
  });
  const updateTeam = (id, patch) => setTeams(ts => ts.map(t => t._id === id ? { ...t, ...patch } : t));
  const addTeamHabit = (teamId, h) => setTeams(ts => ts.map(t => {
    if (t._id !== teamId) return t;
    const nh = { id: _nid(), doneToday: 0, total: (t.members?.length || 1), weekPct: 0, isMain: false, week: [0,0,0,0,0,0,0], ...h };
    let habits = t.habits || [];
    if (nh.isMain) habits = habits.map(x => ({ ...x, isMain: false })); // only one anchor
    return { ...t, habits: [...habits, nh] };
  }));
  const removeTeamHabit = (teamId, habitId) => setTeams(ts => ts.map(t => t._id === teamId ? { ...t, habits: (t.habits || []).filter(h => h.id !== habitId) } : t));

  // ── Заработанные бонусы челленджей = ПОСТОЯННАЯ копилка (David) ──────────────
  // Бонус челленджа уходит в XP НАВСЕГДА: достиг — заработал, дальше хоть пропусти день, хоть удали
  // привычку — бонус твой. Поэтому НЕ derived-из-текущего-состояния, а ЗАФИКСИРОВАННЫЙ набор {key:bonus}.
  // Критерий = СЕРИЯ ПОДРЯД (David: челлендж = продержаться N дней подряд, чтобы заходить каждый день):
  // как только серия привычки достигает `days` (или цель/команда достигает target) — фиксируем бонус ОДИН
  // раз по key. Хранится в localStorage → переживает перезагрузку и удаление привычки. bosLiveXPLive
  // читает app.claimedChallenges и прибавляет сумму к XP.
  const [claimedChallenges, setClaimedChallenges] = useState(() => { try { return JSON.parse(localStorage.getItem("bos:claimedXP") || "{}") || {}; } catch (e) { return {}; } });
  useEffect(() => {
    if (mode !== "live") return;
    var add = null;
    (habits || []).forEach(function (h) { var c = h && h.challenge; if (!c || !c.key || claimedChallenges[c.key]) return; var need = c.days | 0; if (need > 0 && bosStreak(h.log) >= need) { add = add || {}; add[c.key] = c.bonus | 0; } });
    (goals || []).forEach(function (g) { var c = g && g.challenge; if (!c || !c.key || claimedChallenges[c.key]) return; if (g.target > 0 && (g.current || 0) >= g.target) { add = add || {}; add[c.key] = c.bonus | 0; } });
    (teams || []).forEach(function (t) { var c = t && t.challenge; if (!c || !c.key || claimedChallenges[c.key]) return; if (t.target > 0 && (t.current || 0) >= t.target) { add = add || {}; add[c.key] = c.bonus | 0; } });
    // ИДЕАЛЬНЫЙ ДЕНЬ +30 (реально, David: «начисляй как обещали»): все активные привычки на сегодня
    // отмечены → кладём в копилку per-day ключ НАВСЕГДА (не отберётся, если завтра пропустишь). Совпадает
    // с условием поп-апа «день закрыт» на главной. Суммируется в bosChallengeBonusXPLive.
    var _act = (habits || []).filter(function (h) { return h && !h.shelved && !h.goalOnly; });
    if (_act.length && _act.every(function (h) { return h.done; })) { var _pk = "perfectday:" + bosTodayKey(); if (!claimedChallenges[_pk]) { add = add || {}; add[_pk] = 30; } }
    if (add) { var merged = Object.assign({}, claimedChallenges, add); setClaimedChallenges(merged); try { localStorage.setItem("bos:claimedXP", JSON.stringify(merged)); } catch (e) {} if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} } }
  }, [habits, goals, teams]);

  // ── XP-КОШЕЛЁК (копилка) ────────────────────────────────────────────
  // Две РАЗНЫЕ величины (David: «из копилки тратим, но трата НЕ обнуляет уровень»):
  //   • УРОВЕНЬ = всё, что заработано за всё время (bosLiveXPLive) — только растёт, трата его не касается.
  //   • КОШЕЛЁК = заработано − потрачено = сколько сейчас можно потратить.
  // spentXP = сумма всего потраченного (только растёт). Живёт в localStorage И в облачном блобе, поэтому
  // копилка едет за пользователем на другое устройство. spendXP(n) списывает n из кошелька.
  const [spentXP, setSpentXP] = useState(() => { try { return parseInt(localStorage.getItem("bos:spentXP") || "0", 10) || 0; } catch (e) { return 0; } });
  const spendXP = (amount, ref, meta) => {
    var a = Math.max(0, amount | 0); if (!a) return false;
    setSpentXP(function (prev) { var next = (prev | 0) + a; try { localStorage.setItem("bos:spentXP", String(next)); } catch (e) {} return next; });
    // Этап 1 «Серверная правда»: трата дублируется строкой в серверный ЖУРНАЛ (xp_ledger)
    // через надёжную очередь — офлайн доедет позже, повтор не спишет дважды (ref).
    try {
      if (mode === "live" && window.bosCloud && window.bosCloud.enabled() && window.bosCloud.spendLedger) {
        window.bosCloud.spendLedger({ amount: a, ref: (ref || null), kind: (meta && meta.kind) || "spend", meta: meta || {} });
      }
    } catch (e) {}
    if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} }
    return true;
  };

  // Разовый ПОСТОЯННЫЙ подарок XP (Основатель / особые события): кладёт ключ в ту же копилку
  // claimedChallenges, что и завершённый челлендж — идемпотентно по ключу, переживает
  // перезагрузку и сливается ОБЪЕДИНЕНИЕМ между устройствами (не отберётся). Это НЕ трата —
  // только растит уровень (как обещанный бонус за достижение).
  const grantBonusXP = (key, amount) => {
    if (!key || !((amount | 0) > 0)) return false;
    setClaimedChallenges(function (prev) {
      if (prev && prev[key]) return prev;                 // уже подарено — не дублируем
      var merged = Object.assign({}, prev); merged[key] = amount | 0;
      try { localStorage.setItem("bos:claimedXP", JSON.stringify(merged)); } catch (e) {}
      return merged;
    });
    if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} }
    return true;
  };

  // Отразить трату, УЖЕ проведённую на сервере (бронь bos_book_offer сама пишет в xp_ledger) —
  // двигаем локальный счётчик кошелька БЕЗ второй записи в журнал. Уровень трата не трогает.
  const noteSpentXP = (amount) => {
    var a = Math.max(0, amount | 0); if (!a) return;
    setSpentXP(function (prev) { var next = (prev | 0) + a; try { localStorage.setItem("bos:spentXP", String(next)); } catch (e) {} return next; });
  };

  // СЕЙФ (Этап 1): «получено у партнёра» и «постучался в круг» раньше жили ТОЛЬКО в
  // localStorage — потеря телефона их стирала. Теперь едут в облачный блоб (extras);
  // события ниже дёргают пересохранение, слияние при входе — union (полученное не отменяется).
  const [extrasTick, setExtrasTick] = useState(0);
  useEffect(() => {
    const bump = () => setExtrasTick((t) => t + 1);
    window.addEventListener("bos:partnersChanged", bump);
    window.addEventListener("bos:circlesKnocked", bump);
    window.addEventListener("bos:discoveryChanged", bump);
    return () => { window.removeEventListener("bos:partnersChanged", bump); window.removeEventListener("bos:circlesKnocked", bump); window.removeEventListener("bos:discoveryChanged", bump); };
  }, []);
  const _walletExtras = () => {
    var out = { redeemedPartners: {}, knockedCircles: {} };
    try { out.redeemedPartners = JSON.parse(localStorage.getItem("bos:redeemedPartners") || "{}") || {}; } catch (e) {}
    try { out.knockedCircles = JSON.parse(localStorage.getItem("bos:knockedCircles") || "{}") || {}; } catch (e) {}
    // v594: архив едет в облачный снимок — переживает переустановку и синкается между устройствами
    // (до этого жил ТОЛЬКО в localStorage и терялся вместе с телефоном).
    try { out.archived = JSON.parse(localStorage.getItem("bos:archived") || "null") || {}; } catch (e) {}
    // v670: скрытые/прожитые карточки ленты «Открытий» — тем же union-путём (скрытие навсегда).
    try { out.discoveryDismissed = JSON.parse(localStorage.getItem("bos:discoveryDismissed") || "{}") || {}; } catch (e) {}
    try { out.discoverySeen = JSON.parse(localStorage.getItem("bos:discoverySeen") || "{}") || {}; } catch (e) {}
    return out;
  };

  // ── Local-first persistence (the spine) ────────────────────────────
  // A real user's life is saved under their profile id; the demo (id = null) is
  // intentionally NEVER persisted, so a reload always reseeds Павел's showcase.
  // Today this is localStorage; the cloud (Supabase) later mirrors the same
  // snapshot behind the very same bosStore.save call — AppProvider won't change.
  const [persistId, setPersistId] = useState(null);
  // L1 — the AI "login brief" (personal summary + suggestion pills) for LIVE users.
  // Computed once per login from the real context; cached so it shows instantly.
  const [aiBrief, setAiBrief] = useState(null);
  // Referral count (people who registered via your invite link) — loaded from the cloud so
  // the LIVE economy can pay real XP per invited friend. 0 for demo/fresh.
  const [invitedCount, setInvitedCount] = useState(0);
  // Team-goal winnings (settled XP from staked team goals you reached) — loaded from the cloud
  // ledger so the LIVE economy can lift your level by it. 0 for demo/fresh.
  const [teamGoalXP, setTeamGoalXP] = useState(0);
  const saveTimer = useRef(null);
  // Dedupe cloud writes: only mirror to the cloud when the content ACTUALLY changed (David: «каждая
  // отметка зря переписывает облако — пиши только при реальном изменении»). A habit check-in changes
  // `habits` (synced as ROWS) but NOT the blob/profile, so without this guard every tap pointlessly
  // re-upserted user_state + profiles → wasted writes + table bloat. localStorage still saves every time.
  const lastCloudBlobRef = useRef(null);
  const lastCloudProfRef = useRef(null);
  const lastPubRef = useRef(null); // подпись последней опубликованной «орбиты» (Вселенная) — дедуп записей
  // True while a live login is hydrating from the cloud — blocks the autosave below so
  // empty/just-defaulted local state can't race ahead and overwrite real cloud data.
  const hydratingRef = useRef(false);
  // Always holds the latest state so an unload/background flush writes what's on screen
  // right now (a stale effect-closure would miss the very last tap).
  const latestRef = useRef(null);
  latestRef.current = { persistId, userName, avatar, habits, goals, teams, dayMoods, dayNotes, widgets, homeLayout, wheelSpheres, claimedChallenges, spentXP, taskLists };
  useEffect(() => {
    if (!persistId || !window.bosStore) return;
    if (hydratingRef.current) return; // don't persist until the cloud load has reconciled
    // ЛОКАЛЬНО — СРАЗУ и синхронно (David: «телефон главный»; отметка не должна теряться, даже если
    // Telegram убьёт webview до дебаунса). localStorage.setItem синхронен и дёшев (данные — килобайты),
    // серия тапов = серия мелких записей, это ок. РАНЬШЕ эта запись сидела в 400мс-дебаунсе → последние
    // тапы могли не успеть на диск при жёстком закрытии → «прокликал 24, вернулся — 5». Облако осталось
    // с дебаунсом ниже (сеть дорогая; строки привычек и так уходят из мутаторов upsertHabit/toggleHabitLog).
    window.bosStore.save(persistId, { savedAt: Date.now(), userName, avatar, habits, goals, teams, dayMoods, dayNotes, widgets, homeLayout, wheelSpheres, taskLists });
    if (saveTimer.current) clearTimeout(saveTimer.current);
    // Debounce ТОЛЬКО облачного зеркала: серия тапов коалесится в одну сетевую запись.
    saveTimer.current = setTimeout(() => {
      try {
        if (window.bosCloud && window.bosCloud.enabled()) {
          // Profile (name/avatar) — write only when it changed (it almost never does per tap).
          var _prof = (userName || "") + " " + (avatar || "");
          if (_prof !== lastCloudProfRef.current) { window.bosCloud.saveProfile({ username: userName, avatar: avatar }); lastCloudProfRef.current = _prof; }
          // D2 — mirror the blob across devices. Habits/goals are NO LONGER here: they sync as rows
          // (habits/habit_logs/goals) so the blob can't balloon with date-keyed logs. Write only when
          // the blob's content actually changed → a habit check-in no longer re-upserts user_state.
          var _extras = _walletExtras();
          var _blobStr = JSON.stringify({ teams, dayMoods, dayNotes, widgets, homeLayout, wheelSpheres, claimedChallenges, spentXP, extras: _extras });
          if (_blobStr !== lastCloudBlobRef.current) { window.bosCloud.saveSnapshot({ teams, dayMoods, dayNotes, widgets, homeLayout, wheelSpheres, claimedChallenges, spentXP, extras: _extras }); lastCloudBlobRef.current = _blobStr; }
        }
      } catch (e) {}
    }, 400);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [persistId, userName, avatar, habits, goals, teams, dayMoods, dayNotes, widgets, homeLayout, wheelSpheres, claimedChallenges, spentXP, taskLists, extrasTick]);

  // Flush synchronously when the app is backgrounded/closed: the 400 ms debounce above
  // would otherwise lose the very last check-in if the user swipes the app away. localStorage
  // is synchronous (always lands); the cloud write is best-effort and re-syncs next open.
  useEffect(() => {
    const flush = () => {
      const s = latestRef.current;
      if (!s || !s.persistId || !window.bosStore || hydratingRef.current) return;
      try {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        window.bosStore.save(s.persistId, { savedAt: Date.now(), userName: s.userName, avatar: s.avatar, habits: s.habits, goals: s.goals, teams: s.teams, dayMoods: s.dayMoods, dayNotes: s.dayNotes, widgets: s.widgets, homeLayout: s.homeLayout, wheelSpheres: s.wheelSpheres, taskLists: s.taskLists });
        if (window.bosCloud && window.bosCloud.enabled()) {
          var _extras = _walletExtras();
          var _blobStr = JSON.stringify({ teams: s.teams, dayMoods: s.dayMoods, dayNotes: s.dayNotes, widgets: s.widgets, homeLayout: s.homeLayout, wheelSpheres: s.wheelSpheres, claimedChallenges: s.claimedChallenges, spentXP: s.spentXP, extras: _extras });
          if (_blobStr !== lastCloudBlobRef.current) { window.bosCloud.saveSnapshot({ teams: s.teams, dayMoods: s.dayMoods, dayNotes: s.dayNotes, widgets: s.widgets, homeLayout: s.homeLayout, wheelSpheres: s.wheelSpheres, claimedChallenges: s.claimedChallenges, spentXP: s.spentXP, extras: _extras }); lastCloudBlobRef.current = _blobStr; }
        }
      } catch (e) {}
    };
    const onVis = () => { if (document.visibilityState === "hidden") flush(); };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVis);
    return () => { window.removeEventListener("pagehide", flush); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  // ── Публичная «орбита» для Вселенной ────────────────────────────────
  // Каждый пользователь публикует свою орбиту (уровень + ЗНАЧКИ привычек {эмодзи,цвет} + числа целей/людей),
  // чтобы друзья видели её у себя во «Вселенной». Раньше это делалось ТОЛЬКО на экране «Я» (ProfileLive),
  // поэтому друг, ни разу не открывший профиль, оставался пустым (без привычек на орбите). Публикуем на
  // уровне провайдера — при любом заходе и изменении привычек/уровня орбита в облаке остаётся свежей.
  // Дедуп по подписи → лишних записей нет. Пусто/дефолт-пользователь не публикуется (нет persistId).
  useEffect(() => {
    if (mode !== "live" || !persistId || hydratingRef.current) return;
    if (!(window.bosCloud && window.bosCloud.enabled() && window.bosCloud.savePublicStats)) return;
    var appLike = { habits, goals, teams, dayMoods, dayNotes, claimedChallenges, spentXP, invitedCount, teamGoalXP };
    var _xp = (typeof bosLiveXPLive === "function") ? bosLiveXPLive(appLike) : 0;
    var _li = (typeof bosLevelInfoLive === "function") ? bosLevelInfoLive(_xp) : { level: 1, pct: 2 };
    var pubHabits = (habits || []).map(function (h) { return { e: h.emoji, c: h.color }; });
    var sig = JSON.stringify(pubHabits) + "|" + _li.level + "|" + _li.pct + "|" + (goals || []).length + "|" + (invitedCount | 0);
    if (sig === lastPubRef.current) return;
    var t = setTimeout(function () {
      try { window.bosCloud.savePublicStats({ level: _li.level, lvlPct: _li.pct, habits: pubHabits, goals: (goals || []).length, people: invitedCount | 0 }); lastPubRef.current = sig; } catch (e) {}
    }, 600);
    return function () { clearTimeout(t); };
  }, [mode, persistId, habits, goals, invitedCount, teamGoalXP, claimedChallenges, spentXP, dayMoods]);

  // L1 — the home AI line refreshes on REAL game events, not on every app-open: a NEW DAY,
  // or after you actually played (checked habits / logged state). Same day + same game
  // state → instant cached line, NO AI call. A burst of check-ins is debounced into ONE
  // call once the activity settles. (The chat reads live state separately, per message.)
  const _briefSignal = (mode === "live")
    ? [
        (typeof bosTodayKey === "function") ? bosTodayKey() : "",
        (habits || []).filter((h) => h && h.done).length,        // habits checked today
        (habits || []).length,                                    // added / removed a habit
        (typeof bosTodayKey === "function" && dayMoods) ? (dayMoods[bosTodayKey()] ?? "_") : "_", // state logged
      ].join("|")
    : "";
  useEffect(() => {
    if (mode !== "live") { setAiBrief(null); return; }
    const cacheKey = "bos:brief:" + (persistId || "live");
    let cached = null;
    try { const raw = localStorage.getItem(cacheKey); if (raw) { cached = JSON.parse(raw); setAiBrief(cached); } } catch (e) {}
    if (typeof bosAiBriefLive !== "function") return;
    // Nothing material moved since the last line → keep the cached line, spend NO call.
    if (cached && cached.signal === _briefSignal) return;
    let on = true;
    const today = _briefSignal.split("|")[0];
    const sameDay = !!(cached && cached.signal && cached.signal.split("|")[0] === today);
    // New day / first line → refresh now. A same-day check-in → wait ~8s so four quick
    // checks become ONE call, not four ("after you did something", not "on every tap").
    const tid = setTimeout(() => {
      bosAiBriefLive({ mode: "live", userName, mood, habits, goals, dayMoods, dayNotes }).then((brief) => {
        if (!on || !brief) return;
        brief.signal = _briefSignal;
        setAiBrief(brief);
        try { localStorage.setItem(cacheKey, JSON.stringify(brief)); } catch (e) {}
      }).catch(() => {});
    }, sameDay ? 8000 : 0);
    return () => { on = false; clearTimeout(tid); };
  }, [mode, persistId, _briefSignal]);

  // ── Entry modes ───────────────────────────────────────────────────
  // enterDemo: fill everything with the seed demo (Павел's filled life).
  // enterFresh: wipe to a clean slate, like a brand-new first user.
  const enterDemo = () => {
    setMode("demo"); setUserName("Павел"); setAvatar(null);
    setHabits(SEED_HABITS); setGoals(SEED_GOALS); setTeams(SEED_TEAMS);
    setDayMoods(SEED_DAYMOODS); setDayNotes(SEED_DAYNOTES); setMood(MOOD_OPTIONS[1]); setWheelSpheres(DEFAULT_SPHERES); setWidgets(DEMO_WIDGETS);
    setCommunityView({ networkUnlocked: true, discTab: "teams", section: "discover", commTab: "network" });
    // Demo greets each screen with its own intro sheet → clear "seen" so home
    // (and every tab) shows one. No forced linear tour anymore.
    setOnbWelcome(false); setOnbTab(null); seenTabs.current = {}; setTourStep(-1); setTourScreen(null); setGuideDone(false);
    setPersistId(null); // demo is ephemeral — never written to disk
  };
  const enterFresh = (name = "") => {
    setMode("fresh"); setUserName((name || "").trim()); setAvatar(null);
    setHabits([]); setGoals([]); setTeams([]);
    setDayMoods({}); setDayNotes({}); setMood(_onbMood() || MOOD_OPTIONS[2]); setWheelSpheres(DEFAULT_SPHERES); setWidgets(FRESH_WIDGETS); setHomeLayout(null); setTaskLists([]);
    setCommunityView({ networkUnlocked: false, discTab: "teams", section: "discover", commTab: "network" });
    // Arm the welcome sheets; mark home as already-introduced so only the OTHER
    // tabs trigger a contextual intro when the user first opens them.
    setOnbWelcome(true); setOnbTab(null); seenTabs.current = { home: true }; setTourStep(-1); setTourScreen(null); setGuideDone(false);
    setPersistId(null); // the new-user experience is a DEMO too — never persisted
  };

  // ── Real account — the THIRD door: "Войти через Telegram" ──────────
  // Demo (Павел) and fresh (new-user onboarding) stay untouched showcases that
  // never persist. THIS is the live app: identity = the Telegram user (inside
  // Telegram), or a stable local id as a browser/dev fallback, so everything is
  // saved for real under that profile. The cloud (Supabase) binds to the verified
  // Telegram id at T1 — same persistId, same code, no rewrite of this provider.
  const enterLive = () => {
    var tgUser = null;
    try { tgUser = window.__TG && window.__TG.initDataUnsafe && window.__TG.initDataUnsafe.user; } catch (e) {}
    var pid = (tgUser && tgUser.id) ? ("tg:" + tgUser.id) : "live:local";
    var name = (tgUser && (tgUser.first_name || tgUser.username)) || "";
    setMode("live");
    var saved = (window.bosStore && window.bosStore.has(pid)) ? window.bosStore.load(pid) : null;
    // Стартовое лицо: аватар ещё НИ РАЗУ не выбирался (null) → случайное эмодзи-лицо вместо
    // общей серой сферы. Один раз: дальше выбор сохранён локально + в облаке. Ручной выбор
    // (включая «default»-сферу из пикера) не перебивается.
    var _av0 = (saved ? (saved.avatar || avatar) : avatar) || null;
    var _avWasEmpty = !_av0;
    if (_avWasEmpty && typeof bosRandomFaceAvatar === "function") _av0 = bosRandomFaceAvatar();
    if (saved) {
      setUserName(saved.userName || name); setAvatar(_av0);
      setHabits(_uniqLocal((saved.habits || []).map(bosRollHabit))); setGoals(_uniqLocal(saved.goals || [])); setTeams(saved.teams || []); setTaskLists(_bosNormLists(saved.taskLists));
      setDayMoods(saved.dayMoods || {}); setDayNotes(saved.dayNotes || {});
      setWheelSpheres(saved.wheelSpheres || DEFAULT_SPHERES); setWidgets(saved.widgets || FRESH_WIDGETS); setHomeLayout(saved.homeLayout || null);
      // Restore today's state (the orb) from the saved per-day record, so reopening lands
      // in the mood the user last set today instead of snapping back to neutral.
      var _tkS = (typeof bosTodayKey === "function") ? bosTodayKey() : null;
      var _miS = (_tkS && saved.dayMoods) ? saved.dayMoods[_tkS] : undefined;
      // dayMoods stores a BOS_STATE valence index (0..6, written by the state slider) — NOT a
      // MOOD_OPTIONS index. Resolve it as BOS_STATE so the orb reflects the REAL logged state on
      // reload/sync. (Bug: MOOD_OPTIONS[5] === «Усталость», so a good pick like «Хорошо» (BOS_STATE 5)
      // reloaded as «Усталость» → David: «каждый день говорит усталость, хотя выбираю другое».)
      var _stS = (_miS != null && typeof bosStateResolve === "function") ? bosStateResolve(_miS) : null;
      setMood(_stS || _onbMood() || MOOD_OPTIONS[2]);
    } else {
      setUserName(name); setAvatar(_av0);
      setHabits([]); setGoals([]); setTeams([]);
      setDayMoods({}); setDayNotes({}); setMood(_onbMood() || MOOD_OPTIONS[2]); setWheelSpheres(DEFAULT_SPHERES); setWidgets(FRESH_WIDGETS); setHomeLayout(null); setTaskLists([]);
    }
    setCommunityView({ networkUnlocked: false, discTab: "teams", section: "discover", commTab: "network" });
    // First-time real users get the welcome sheets; returning ones skip straight in.
    setOnbWelcome(!saved); setOnbTab(null); seenTabs.current = { home: true }; setTourStep(-1); setTourScreen(null); setGuideDone(!!saved);
    setPersistId(pid); // from here on, every change is saved under this real profile
    // ── Cloud (T1): sign in (Telegram identity or anonymous web fallback) and sync the
    // profile in the background. Fully guarded — if cloud is off/unreachable, stays local.
    try {
      if (window.bosCloud && window.bosCloud.enabled()) {
        // Hold off autosave until the cloud load reconciles — otherwise the empty/just-set
        // local state could save first and overwrite real cloud data with blanks.
        hydratingRef.current = true;
        var _doneHydrate = function () { hydratingRef.current = false; };
        setTimeout(_doneHydrate, 9000); // hard safety: never get stuck not-saving
        var _refBy = (typeof bosReferralId === "function") ? bosReferralId() : null;
        var _joinTeamId = (typeof bosJoinTeamId === "function") ? bosJoinTeamId() : null; // Telegram start_param=team_<id> OR web ?team=
        var _joinShareId = (typeof bosJoinSharedHabitId === "function") ? bosJoinSharedHabitId() : null; // start_param=hb_<code> → join the SAME shared habit
        var _locName = saved ? (saved.userName || name) : name;
        var _locAv = _av0;
        window.bosCloud.signIn(_refBy).then(function (u) {
          if (!u) { _doneHydrate(); return; }
          var _myUid = u && u.id; // моя РЕАЛЬНАЯ облачная id — для гарда «открыл собственную ссылку»
          window.bosCloud.loadProfile().then(function (prof) {
            if (prof && (prof.username || prof.avatar)) {
              if (prof.username) setUserName(prof.username);
              if (prof.avatar) setAvatar(prof.avatar);
              // Само-миграция старожилов: имя в облаке есть, аватара НЕТ (никогда не менял) →
              // закрепляем свежее случайное лицо и в облаке — Вселенная/круги увидят его сразу.
              else if (_avWasEmpty && _av0) window.bosCloud.saveProfile({ username: prof.username || _locName, avatar: _av0 });
            } else {
              window.bosCloud.saveProfile({ username: _locName, avatar: _locAv });
              // Мост приглашения: самый первый вход (профиля ещё не было), и сервер уже
              // записал «кто привёл» (referred_by из ссылки) → тёплое «X зовёт тебя» вместо
              // безликого входа. Не показываем, когда человек пришёл по ссылке В привычку
              // или В совместную цель — там его встречает своё, более конкретное приветствие.
              try {
                if (prof && prof.referred_by && !_joinTeamId && !_joinShareId && window.bosCloud.myInviter && !localStorage.getItem("bos:refWelcomed:" + pid)) {
                  window.bosCloud.myInviter().then(function (inv) {
                    if (!inv || !inv.username) return;
                    try { localStorage.setItem("bos:refWelcomed:" + pid, "1"); } catch (e2) {}
                    setPendingJoinWelcome({ kind: "app", name: inv.username, inviterName: inv.username, inviterAvatar: inv.avatar || "default" });
                  });
                }
              } catch (e) {}
            }
          });
          // D2 — cross-device data: whichever side saved last wins. Cloud newer →
          // hydrate this device from it; otherwise push our local life up to the cloud.
          window.bosCloud.loadSnapshot().then(function (snap) {
            // Merge two day-maps: `winner` keeps its values; `filler` only adds days the
            // winner is missing (never overwrites, never lets null/"" erase a real value).
            // So neither device's logged days are ever lost — only a same-day conflict
            // defers to the winner (the side that saved more recently). Mood index 0 is a
            // valid value (Спокойствие), so we test `== null`, never truthiness.
            function bosMergeDayMap(winner, filler) {
              var out = Object.assign({}, winner || {});
              if (filler) Object.keys(filler).forEach(function (k) {
                var fv = filler[k];
                if (fv == null || fv === "") return;
                if (out[k] == null || out[k] === "") out[k] = fv;
              });
              return out;
            }
            var localAt = saved ? (saved.savedAt || 0) : 0;
            var cloudAt = (snap && snap.savedAt) || 0;
            // Migration seed for habits/goals = whatever we have right now (an old pre-rows
            // user has them in the cloud blob; else the local copy). Captured before state moves.
            var _seedHabits = (snap && snap.data && Array.isArray(snap.data.habits) && snap.data.habits) || (saved && saved.habits) || [];
            var _seedGoals  = (snap && snap.data && Array.isArray(snap.data.goals)  && snap.data.goals)  || (saved && saved.goals)  || [];
            // Day-level merge (see bosMergeDayMap) so a 2nd device never erases the other's
            // logged days; the timestamp only decides who wins a same-day conflict.
            var _localMoods = (saved && saved.dayMoods) || {};
            var _localNotes = (saved && saved.dayNotes) || {};
            var _cloudMoods = (snap && snap.data && snap.data.dayMoods) || {};
            var _cloudNotes = (snap && snap.data && snap.data.dayNotes) || {};
            // XP-КОШЕЛЁК между устройствами: заработанные бонусы (claimedChallenges) СЛИВАЕМ (объединение —
            // никогда не теряем заработанное, поэтому уровень не падает при входе с другого телефона);
            // потрачено (spentXP) берём МАКСИМУМ (трата только копится, «возврата» при переходе быть не может).
            // Старые снимки без этих полей → облачная часть пустая → берётся локальная копия (регресса нет).
            var _mClaimed = Object.assign({}, (snap && snap.data && snap.data.claimedChallenges) || {}, claimedChallenges || {});
            if (Object.keys(_mClaimed).length !== Object.keys(claimedChallenges || {}).length) { setClaimedChallenges(_mClaimed); try { localStorage.setItem("bos:claimedXP", JSON.stringify(_mClaimed)); } catch (e) {} }
            var _mSpent = Math.max((snap && snap.data && (snap.data.spentXP | 0)) || 0, spentXP | 0);
            if (_mSpent !== (spentXP | 0)) { setSpentXP(_mSpent); try { localStorage.setItem("bos:spentXP", String(_mSpent)); } catch (e) {} }
            // СЕЙФ (Этап 1): «получено у партнёра» / «постучался в круг» — union облака и телефона
            // (полученное не отменяется). События будят открытые экраны перерисоваться.
            try {
              var _cx = (snap && snap.data && snap.data.extras) || null;
              if (_cx) {
                var _lr = {}; try { _lr = JSON.parse(localStorage.getItem("bos:redeemedPartners") || "{}") || {}; } catch (e0) {}
                localStorage.setItem("bos:redeemedPartners", JSON.stringify(Object.assign({}, _cx.redeemedPartners || {}, _lr)));
                var _lk = {}; try { _lk = JSON.parse(localStorage.getItem("bos:knockedCircles") || "{}") || {}; } catch (e1) {}
                localStorage.setItem("bos:knockedCircles", JSON.stringify(Object.assign({}, _cx.knockedCircles || {}, _lk)));
                // v594: архив из облака — union с локальным (локальные пометки главнее при споре).
                if (_cx.archived && typeof _cx.archived === "object") {
                  var _la = {}; try { _la = JSON.parse(localStorage.getItem("bos:archived") || "null") || {}; } catch (e2) {}
                  localStorage.setItem("bos:archived", JSON.stringify(Object.assign({}, _cx.archived, _la)));
                  window.dispatchEvent(new Event("bos:archivedChanged"));
                }
                // v670: «Открытия» — union скрытых/прожитых карточек (локальное скрытие главнее — не воскресает).
                var _ddC = {}; try { _ddC = JSON.parse(localStorage.getItem("bos:discoveryDismissed") || "{}") || {}; } catch (ed1) {}
                localStorage.setItem("bos:discoveryDismissed", JSON.stringify(Object.assign({}, _cx.discoveryDismissed || {}, _ddC)));
                var _dsC = {}; try { _dsC = JSON.parse(localStorage.getItem("bos:discoverySeen") || "{}") || {}; } catch (ed2) {}
                localStorage.setItem("bos:discoverySeen", JSON.stringify(Object.assign({}, _cx.discoverySeen || {}, _dsC)));
                window.dispatchEvent(new Event("bos:discoveryChanged"));
                window.dispatchEvent(new Event("bos:partnersChanged"));
                window.dispatchEvent(new Event("bos:circlesKnocked"));
              }
            } catch (e) {}
            if (snap && snap.data && cloudAt >= localAt) {
              var d = snap.data;
              // habits/goals are NO LONGER in the blob — they're loaded from rows below.
              // v594 (пропажа «Крипто монстров»): ПУСТОЙ список кругов из облака НЕ затирает
              // непустой локальный — зеркало F2 для этой ветки (v587 прикрыл только «local wins»).
              // Отравленный ранее пустой снапшот при каждой загрузке разносил пустоту по
              // устройствам. Правду о членстве восстановит сверка ниже (myTeamsLive).
              var _locTeams = (saved && saved.teams) || [];
              var _teamsHeld = Array.isArray(d.teams) && !d.teams.length && _locTeams.length > 0;
              if (Array.isArray(d.teams) && !_teamsHeld) setTeams(d.teams);
              var _mMoods = bosMergeDayMap(_cloudMoods, _localMoods); // cloud wins, local fills gaps
              var _mNotes = bosMergeDayMap(_cloudNotes, _localNotes);
              setDayMoods(_mMoods);
              setDayNotes(_mNotes);
              // keep the orb in sync with today's restored state
              try { var _tk = (typeof bosTodayKey === "function") ? bosTodayKey() : null; var _mi = _tk ? _mMoods[_tk] : undefined; if (_mi != null && MOOD_OPTIONS[_mi]) setMood(MOOD_OPTIONS[_mi]); } catch (e) {}
              if (d.wheelSpheres) setWheelSpheres(d.wheelSpheres);
              // F-layout (David: «переставил блоки главной, потом через время всё вернулось»):
              // loadSnapshot резолвится ПО СЕТИ, спустя секунды после входа, и применяет облачный снимок
              // В КОНЦЕ. Если за эти секунды пользователь ПОМЕНЯЛ раскладку/виджеты — автосейв на время
              // гидрации выключен, значит его правка ещё НЕ в localStorage (localAt старый) → cloudAt>=localAt
              // и облачное затирало свежую живую правку. Сверяем ТЕКУЩЕЕ в памяти (latestRef) со стартовым
              // снапшотом: если на ЭТОМ устройстве раскладку/виджеты трогали после входа — не затираем.
              // Обычная кросс-девайс синхронизация цела (не трогали → применяется облачное).
              var _liveW = (latestRef.current && latestRef.current.widgets) || null;
              var _liveL = (latestRef.current && latestRef.current.homeLayout) || null;
              var _wEditedLive = !!(saved && saved.widgets) && JSON.stringify(_liveW) !== JSON.stringify(saved.widgets);
              var _lEditedLive = !!(saved && saved.homeLayout) && JSON.stringify(_liveL) !== JSON.stringify(saved.homeLayout);
              if (d.widgets && !_wEditedLive) setWidgets(d.widgets);
              if (d.homeLayout && !_lEditedLive) setHomeLayout(d.homeLayout);
              // If local held days the cloud lacked, push the union up so the cloud is whole too.
              // (v594: и если мы удержали локальные круги от пустого облака — лечим облачный снимок сразу.)
              if (_teamsHeld || Object.keys(_mMoods).length > Object.keys(_cloudMoods).length || Object.keys(_mNotes).length > Object.keys(_cloudNotes).length) {
                window.bosCloud.saveSnapshot({ teams: (Array.isArray(d.teams) && !_teamsHeld) ? d.teams : _locTeams, dayMoods: _mMoods, dayNotes: _mNotes, wheelSpheres: d.wheelSpheres, widgets: d.widgets, homeLayout: d.homeLayout || (saved && saved.homeLayout) || null, claimedChallenges: _mClaimed, spentXP: _mSpent });
              }
            } else {
              var src = saved || {};
              var _mMoods2 = bosMergeDayMap(_localMoods, _cloudMoods); // local wins, cloud fills gaps
              var _mNotes2 = bosMergeDayMap(_localNotes, _cloudNotes);
              setDayMoods(_mMoods2);
              setDayNotes(_mNotes2);
              // F2: локально «новее» по времени, но НЕ затираем облачное ПУСТЫМ. Свежий-но-пустой local =
              // почти всегда офлайн-первый-вход/переустановка (дефолт с новым savedAt), а не намеренная
              // очистка. Для teams/widgets/homeLayout берём НЕПУСТОЕ: если у нас пусто, а в облаке есть —
              // сохраняем облачное И подтягиваем в UI (иначе круги/раскладка исчезнут со ВСЕХ устройств,
              // а membership интерфейс сам не восстанавливает → «пропали мои круги»).
              var _cd = (snap && snap.data) || {};
              var _keepTeams = (src.teams && src.teams.length) ? src.teams : (Array.isArray(_cd.teams) ? _cd.teams : (src.teams || []));
              var _keepWidgets = src.widgets || _cd.widgets;
              var _keepLayout = src.homeLayout || _cd.homeLayout || null;
              if (!(src.teams && src.teams.length) && Array.isArray(_cd.teams) && _cd.teams.length) setTeams(_cd.teams);
              if (!src.widgets && _cd.widgets) setWidgets(_cd.widgets);
              if (!src.homeLayout && _cd.homeLayout) setHomeLayout(_cd.homeLayout);
              window.bosCloud.saveSnapshot({ teams: _keepTeams, dayMoods: _mMoods2, dayNotes: _mNotes2, wheelSpheres: src.wheelSpheres || _cd.wheelSpheres, widgets: _keepWidgets, homeLayout: _keepLayout, claimedChallenges: _mClaimed, spentXP: _mSpent });
            }
            // Reconciliation done → allow autosave again (the join below should persist).
            _doneHydrate();
            // МУЛЬТИПЛЕЕР-СИНК круга (David 2026-07-11: «у друга старое имя/иконка/цвет совместной цели»).
            // Раньше общую таблицу teams НИКТО не перечитывал — каждый показывал СВОЙ кэш-снапшот, и правки
            // владельца до участников не доходили; цвет вообще не уходил в облако. Теперь после входа
            // накладываем свежие ОБЩИЕ поля круга поверх кэша по cloudId. СТРОГО безопасно: (1) только для
            // кругов, где Я УЧАСТНИК (role member) — владельца не трогаем, его локальное = источник правды,
            // чтобы не откатить его правку; (2) правим только уже существующие круги, ничего не добавляем и
            // не удаляем; (3) null (обрыв сети) не трогает ничего; (4) участие/отметки/локальный id не касаем.
            try {
              if (window.bosCloud && window.bosCloud.myTeamsLive) {
                window.bosCloud.myTeamsLive().then(function (list) {
                  if (!Array.isArray(list)) return; // null = сеть не дозвонилась → кэш не трогаем
                  setTeams(function (ts) {
                    return (ts || []).map(function (t) {
                      if (!t || !t.cloudId) return t;
                      var found = null, role = null;
                      for (var i = 0; i < list.length; i++) { if (list[i] && list[i].team && list[i].team.id === t.cloudId) { found = list[i].team; role = list[i].role; break; } }
                      if (!found || role === "owner") return t; // владельца НЕ трогаем
                      var g = (found.goal && typeof found.goal === "object") ? found.goal : {};
                      var patch = {};
                      if (found.name != null) patch.name = found.name;
                      if (found.emblem != null) patch.emblem = found.emblem;
                      if (found.vis != null) patch.vis = found.vis;
                      if (g.accent != null) patch.accent = g.accent;
                      if (g.type != null) patch.type = g.type;
                      if (g.unit != null) patch.unit = g.unit;
                      if (g.target != null) patch.target = g.target; else if (found.goal_target != null) patch.target = found.goal_target;
                      if (g.title != null) patch.goal = g.title; else if (found.goal_kind != null) patch.goal = found.goal_kind;
                      if (g.stake != null) patch.stake = g.stake;
                      if (found.circleBalanceOn != null) patch.circleBalanceOn = found.circleBalanceOn;
                      return Object.assign({}, t, patch);
                    });
                  });
                }).catch(function () {});
              }
            } catch (e) {}
            // ── Habits/goals live as ROWS now. Load them; if rows are empty, migrate the
            // seed (old blob / local) into rows ONCE. null = load failed → keep local copy.
            try {
              window.bosCloud.loadHabits().then(function (rows) {
                if (rows === null) return;
                // «ТЕЛЕФОН — ГЛАВНЫЙ» (David, фикс потери счётчика 24→5): облако НЕ перезаписывает уже
                // существующие локальные привычки — устаревшая облачная копия (напр. counts=5, пока свежий
                // локальный =24 ещё летел вверх) затирала прогресс. Есть данные локально → они и есть правда,
                // телефон сам синкает их ВВЕРХ. Облачные строки применяем ТОЛЬКО для ВОССТАНОВЛЕНИЯ на пустом
                // устройстве (новый телефон / переустановка / потеря localStorage). Та же философия, что v594 у кругов.
                if (rows.length) { setHabits(function (prev) { return (prev && prev.length) ? prev : rows.map(function (h) { return bosRollHabit(Object.assign({ id: _nid() }, h)); }); }); return; }
                if (!_seedHabits.length) return;
                // CONFIRM truly-empty before migrating local habits → rows. A transient false-empty
                // read (auth/RLS race just after sign-in) once re-ran this migration on an account that
                // ALREADY had rows → DUPLICATE habits (David spotted dupes in a test account). Re-read
                // after a beat; seed ONLY if STILL empty (and the re-read didn't error). A real account
                // returns its rows here and we just hydrate them — no second copy.
                return new Promise(function (res) { setTimeout(res, 800); })
                  .then(function () { return window.bosCloud.loadHabits(); })
                  .then(function (rows2) {
                    if (rows2 === null) return;
                    // «Телефон — главный» и здесь: не затираем существующие локальные привычки (см. выше).
                    if (rows2.length) { setHabits(function (prev) { return (prev && prev.length) ? prev : rows2.map(function (h) { return bosRollHabit(Object.assign({ id: _nid() }, h)); }); }); return; }
                    var wi = _seedHabits.map(function (h) { return Object.assign({ id: _nid() }, h, { cloudId: h.cloudId || _uuid() }); });
                    setHabits(wi.map(bosRollHabit));
                    wi.forEach(function (h) { try { window.bosCloud.upsertHabit(h); var lg = h.log || {}; Object.keys(lg).forEach(function (day) { if (lg[day]) window.bosCloud.toggleHabitLog(h.cloudId, day, true); }); } catch (e) {} });
                  });
              }).then(function () {
                // hb_<code> link → join the SAME shared habit (a buddy, NOT a team): append it
                // to your habits (so it appears) AFTER hydration so the load can't clobber it;
                // your check-ins then mirror to the shared log → you both see the calendar.
                if (!_joinShareId || !window.bosCloud.joinSharedHabit) return;
                return window.bosCloud.joinSharedHabit(_joinShareId).then(function (sh) {
                  if (!sh) return;
                  // Своя же привычка (открыл собственную ссылку hb_<code>) — НЕ заводим вторую копию и не
                  // показываем «X зовёт вступить»: ты уже владелец и участник (баг «дублируюсь дважды»).
                  if (sh.owner_id && _myUid && sh.owner_id === _myUid) { try { history.replaceState(null, "", window.location.pathname); } catch (e) {} return; }
                  setHabits(function (prev) {
                    if ((prev || []).some(function (x) { return x.shareCode === _joinShareId; })) return prev || [];
                    var nh = bosRollHabit({ id: _nid(), cloudId: _uuid(), name: sh.name || "Привычка", emoji: sh.emoji || "✨", color: sh.color || null, shareCode: _joinShareId, log: {}, done: false, streak: 0, days: [1, 1, 1, 1, 1, 1, 1], goalPerDay: 1 });
                    try { window.bosCloud.upsertHabit(nh); } catch (e) {}
                    return [nh].concat(prev || []);
                  });
                  // Greet the friend: «X позвал тебя вести «привычка» вместе» (the silent join was confusing).
                  setPendingJoinWelcome({ kind: "habit", name: sh.name || "Привычка", emoji: sh.emoji || "✨", color: sh.color || null, inviterName: sh.ownerName || "", inviterAvatar: sh.ownerAvatar || "default" });
                  try { history.replaceState(null, "", window.location.pathname); } catch (e) {}
                });
              });
              window.bosCloud.loadGoals().then(function (rows) {
                if (rows === null) return;
                // «Телефон — главный» (как у привычек): облако не затирает локальные цели/их прогресс,
                // только восстанавливает на пустом устройстве.
                if (rows.length) { setGoals(function (prev) { return (prev && prev.length) ? prev : rows.map(function (g) { return Object.assign({ id: _nid() }, g); }); }); return; }
                if (!_seedGoals.length) return;
                // Same dup-guard as habits: confirm truly-empty (re-read after a beat) before migrating
                // local goals → rows, so a transient false-empty read can't create a second copy.
                return new Promise(function (res) { setTimeout(res, 800); })
                  .then(function () { return window.bosCloud.loadGoals(); })
                  .then(function (rows2) {
                    if (rows2 === null) return;
                    if (rows2.length) { setGoals(function (prev) { return (prev && prev.length) ? prev : rows2.map(function (g) { return Object.assign({ id: _nid() }, g); }); }); return; }
                    var wg = _seedGoals.map(function (g) { return Object.assign({ id: _nid() }, g, { cloudId: g.cloudId || _uuid() }); });
                    setGoals(wg);
                    wg.forEach(function (g) { try { window.bosCloud.upsertGoal(g); } catch (e) {} });
                  });
              });
            } catch (e) {}
            // ?team= invite link → БОЛЬШЕ НЕ вступаем молча (brief 2026-07-11, Слой 0):
            // сначала ПРЕВЬЮ круга и явное «Вступить» (JoinWelcomeLive kind="team-invite" →
            // acceptTeamInvite). Членство появляется только после согласия человека.
            if (_joinTeamId) {
              (window.bosCloud.myTeamIds ? window.bosCloud.myTeamIds() : Promise.resolve([])).then(function (ids) {
                if ((ids || []).indexOf(_joinTeamId) >= 0) { try { history.replaceState(null, "", window.location.pathname); } catch (e) {} return; }
                var _preview = function (row) {
                  setPendingJoinWelcome({ kind: "team-invite", teamId: _joinTeamId, name: (row && row.name) || "Круг в BalanceOS", emoji: (row && (row.emblem || row.emoji)) || "✨", membersN: row ? ((row.members_n | 0) || null) : null });
                };
                window.bosCloud.teamById(_joinTeamId).then(function (row) {
                  if (row) { _preview(row); return; }
                  // приватный круг до вступления не читается (RLS) → безопасное серверное превью
                  // (bos_team_preview из patch_help_trust_p0.sql); до патча — общая карточка.
                  var c = window.bosCloud._client && window.bosCloud._client();
                  if (c) c.rpc("bos_team_preview", { t: _joinTeamId }).then(function (r) { _preview((r && !r.error && r.data) || null); }).catch(function () { _preview(null); });
                  else _preview(null);
                }).catch(function () { _preview(null); });
              }).catch(function () {});
            }
            // ── СВЕРКА С ЧЛЕНСТВОМ (v594, после пропажи «Крипто монстров») ──────────
            // Список кругов на экране мог разойтись с правдой облака (отравленный пустой
            // снапшот, старые гонки). Членство в team_members + мои teams-строки = источник
            // правды: чего не хватает — ДОБАВЛЯЕМ (круг сам возвращается на устройство),
            // чей cloudId облако точно не знает — убираем (кроме вступаемого по ссылке —
            // гонка с joinViaLink). null = не дозвонились → НЕ трогаем ничего (урок v583).
            try {
              if (window.bosCloud.myTeamsLive) window.bosCloud.myTeamsLive().then(function (mem) {
                if (!mem) return;
                setTeams(function (prev) {
                  var p = prev || [];
                  var have = {}; p.forEach(function (x) { if (x && x.cloudId) have[x.cloudId] = 1; });
                  var truth = {}; mem.forEach(function (m) { if (m && m.team) truth[m.team.id] = 1; });
                  var add = [];
                  mem.forEach(function (m) {
                    var row = m && m.team; if (!row || have[row.id]) return;
                    add.push({ _id: "cloud-" + row.id, cloudId: row.id, joined: m.role !== "owner", name: row.name || "Совместная цель", emblem: row.emblem || "✨", accent: "#dbe9ff", vis: row.vis, goal: row.goal || "", goalKind: row.goal_kind || null, target: row.goal_target || 0, current: 0, progress: 0, members: [], habits: [] });
                  });
                  var keep = p.filter(function (x) { return !x.cloudId || truth[x.cloudId] || (_joinTeamId && x.cloudId === _joinTeamId); });
                  if (!add.length && keep.length === p.length) return prev;
                  return add.concat(keep);
                });
              });
            } catch (e) {}
          }).catch(_doneHydrate);
        }).catch(_doneHydrate);
      }
    } catch (e) {}
  };
  const startTour = (mode) => { setTourMode(mode || "demo"); setTourStep(0); };
  const endTour = () => setTourStep(-1);

  // ── Achievements: detect freshly-unlocked badges (live) and pop a celebration ──
  // Seen ids persist per-profile in localStorage. First sight of a profile SEEDS the set
  // with whatever's already earned (no retroactive spam) — only genuinely NEW unlocks pop.
  // LIVE-only effect: reads the forked LIVE economy (screens/live/economy_live.jsx) via a
  // typeof-guarded global lookup, so the framework never hard-depends on the live file —
  // if it's absent the effect simply no-ops (no celebration). Demo never reaches here (gate).
  const clearPendingAch = () => setPendingAch(null);
  const clearPendingDayClose = () => setPendingDayClose(null);
  const clearPendingJoinWelcome = () => setPendingJoinWelcome(null);
  // Инвайт в круг (kind="team-invite"): вступление ТОЛЬКО по явному «Вступить» с превью
  // (brief 2026-07-11). Отказ ничего не публикует и не оставляет заявки.
  const acceptTeamInvite = (teamId) => {
    setPendingJoinWelcome(null);
    try { history.replaceState(null, "", window.location.pathname); } catch (e) {}
    if (!(teamId && window.bosCloud && window.bosCloud.enabled() && window.bosCloud.joinViaLink)) return;
    window.bosCloud.joinViaLink(teamId).then(function (row) {
      if (!row) return;
      var lt = { _id: "cloud-" + row.id, cloudId: row.id, joined: true, name: row.name, emblem: row.emblem || "✨", accent: "#dbe9ff", vis: row.vis, goal: "", members: [], target: row.goal_target || 0, current: 0, progress: 0 };
      setTeams(function (prev) { return (prev || []).some(function (x) { return x.cloudId === row.id; }) ? prev : [lt].concat(prev || []); });
      if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} }
    }).catch(function () {});
  };
  const declineTeamInvite = () => {
    setPendingJoinWelcome(null);
    try { history.replaceState(null, "", window.location.pathname); } catch (e) {}
  };

  // ── Daily Balance: one calm completion reveal per real day ──────────────────
  // The XP bonus for a perfect day is still handled by claimedChallenges above. This
  // effect is only the user-facing closure moment: состояние + ход + смысл/связь.
  // Persist a per-profile/day seen key so reloads and hydration never replay it.
  const dayCloseSeenRef = useRef({});
  useEffect(() => {
    if (mode !== "live" || !persistId || typeof bosDailyBalanceLive !== "function") return;
    if (hydratingRef.current) return;
    var db = bosDailyBalanceLive({ habits: habits, teams: teams, dayMoods: dayMoods, dayNotes: dayNotes });
    if (!db || !db.complete || !db.today) return;
    var key = "bos:dayclose:" + persistId + ":" + db.today;
    var seen = false;
    try { seen = localStorage.getItem(key) === "1"; } catch (e) {}
    if (seen || dayCloseSeenRef.current[key]) return;
    dayCloseSeenRef.current[key] = true;
    try { localStorage.setItem(key, "1"); } catch (e2) {}
    setPendingDayClose({ day: db.today, balance: db, ts: Date.now() });
  }, [mode, persistId, habits, teams, dayMoods, dayNotes]);

  // ── «Пульс дня» → общий баланс окружения ────────────────────────────────────
  // Отметил состояние → одна цифра-тон (0..6) уезжает в day_pulse. Читается ТОЛЬКО
  // серверным агрегатом от ≥3 влившихся (приватность в данных, patch_day_pulse.sql).
  // show_face — настройка «показывать меня в круге» (точка у лица), хранится локально.
  const pulseSentRef = useRef(null);
  useEffect(() => {
    if (mode !== "live" || !persistId) return;
    if (hydratingRef.current) return;
    try {
      const tk = (typeof bosTodayKey === "function") ? bosTodayKey() : null;
      const b = (tk && dayMoods) ? dayMoods[tk] : null;
      if (b == null) return;
      let show = false; try { show = localStorage.getItem("bos:pulseFaces") === "1"; } catch (e) {}
      const key = persistId + ":" + tk + ":" + b + ":" + (show ? 1 : 0);
      if (pulseSentRef.current === key) return;
      pulseSentRef.current = key;
      if (window.bosCloud && window.bosCloud.enabled && window.bosCloud.enabled() && window.bosCloud.savePulse) window.bosCloud.savePulse(tk, b, show);
    } catch (e) {}
  }, [mode, persistId, dayMoods]);

  const achSeenRef = useRef({ pid: null, ids: null });
  useEffect(() => {
    if (mode !== "live" || !persistId || typeof bosEarnedAchIdsLive !== "function") return;
    var KEY = "bos:ach:" + persistId;
    var earned = bosEarnedAchIdsLive({ habits: habits, goals: goals, dayMoods: dayMoods, dayNotes: dayNotes, teams: teams, invitedCount: invitedCount });
    var store = achSeenRef.current;
    if (store.pid !== persistId) {
      var saved = null; try { var raw = localStorage.getItem(KEY); if (raw) saved = JSON.parse(raw); } catch (e) {}
      store = achSeenRef.current = { pid: persistId, ids: Array.isArray(saved) ? saved.slice() : null };
    }
    // No baseline yet, or still hydrating cloud data → ABSORB current as "seen", never pop
    // (so existing badges don't fire retroactively on login / a fresh device).
    if (store.ids === null || hydratingRef.current) {
      var base = store.ids || [];
      earned.forEach(function (id) { if (base.indexOf(id) < 0) base.push(id); });
      achSeenRef.current = { pid: persistId, ids: base };
      try { localStorage.setItem(KEY, JSON.stringify(base)); } catch (e2) {}
      return;
    }
    var fresh = earned.filter(function (id) { return store.ids.indexOf(id) < 0; });
    if (fresh.length) {
      var next = store.ids.concat(fresh);
      achSeenRef.current = { pid: persistId, ids: next };
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch (e3) {}
      var a = (typeof bosAchByIdLive === "function") ? bosAchByIdLive(fresh[0]) : null;
      if (a) setPendingAch(a);
    }
  }, [mode, persistId, habits, goals, dayMoods, dayNotes, teams, invitedCount]);

  // Load the referral count (registered invitees) for LIVE users → feeds real referral XP in
  // the live economy. Refreshes on login and whenever teams change (a proxy for "the circle
  // may have grown"). Demo/fresh stay at 0.
  useEffect(() => {
    if (mode !== "live" || !persistId || !(window.bosCloud && window.bosCloud.enabled() && window.bosCloud.invitedPeople)) { setInvitedCount(0); return; }
    var on = true;
    // МГНОВЕННО из кэша (иначе уровень/кольцо XP на секунду показывают меньшее и «прыгают» —
    // David: «подгружает какой-то другой уровень»); облако тихо подтверждает следом.
    try { var c = parseInt(localStorage.getItem("bos:cache:inv:" + persistId) || "", 10); if (isFinite(c) && c > 0) setInvitedCount(c); } catch (e) {}
    window.bosCloud.invitedPeople().then(function (list) {
      if (!on || !Array.isArray(list)) return;
      // «Пусто = правда»-защита: invitedPeople при обрыве возвращает [] → обнуление счётчика роняло бы
      // уровень/кольцо XP «на глазах» (David: «подгружает другой уровень»). Приглашённые не исчезают,
      // поэтому пустой ответ ПРИ ненулевом кэше игнорируем (у нового юзера кэша нет → 0 проходит честно).
      if (!list.length) { var _pc = parseInt(localStorage.getItem("bos:cache:inv:" + persistId) || "", 10); if (isFinite(_pc) && _pc > 0) return; }
      setInvitedCount(list.length);
      try { localStorage.setItem("bos:cache:inv:" + persistId, "" + list.length); } catch (e) {}
    }).catch(function () {});
    return function () { on = false; };
  }, [mode, persistId, teams]);

  // Load my team-goal winnings (settled XP) for LIVE users → feeds real team-goal XP in the live
  // economy (lifts the DISPLAYED level). `refreshTeamGoalXP` is also exposed in context so the team
  // detail can re-pull the moment a goal settles. Refreshes on login + whenever teams change.
  const refreshTeamGoalXP = function () {
    if (mode !== "live" || !persistId || !(window.bosCloud && window.bosCloud.enabled() && window.bosCloud.myTeamGoalXP)) { setTeamGoalXP(0); return; }
    // Кэш → мгновенно; облако → тихое обновление (без «прыжка» уровня при входе).
    try { var c = parseInt(localStorage.getItem("bos:cache:tgxp:" + persistId) || "", 10); if (isFinite(c) && c > 0) setTeamGoalXP(c); } catch (e) {}
    window.bosCloud.myTeamGoalXP().then(function (xp) {
      setTeamGoalXP(xp || 0);
      try { localStorage.setItem("bos:cache:tgxp:" + persistId, "" + (xp || 0)); } catch (e) {}
    }).catch(function () {});
  };
  useEffect(function () { refreshTeamGoalXP(); }, [mode, persistId, teams]);

  // Community tab/section view-state lives here so navigating into a detail
  // screen and back doesn't reset it (the screen unmounts on push/pop).
  const [communityView, setCommunityViewRaw] = useState({ section: "discover", discTab: "teams", commTab: "network", networkUnlocked: false });
  const setCommunityView = (patch) => setCommunityViewRaw(v => ({ ...v, ...patch }));

  // ── «Дела»: локальный todo-виджет главной (списки-вкладки, разовые дела). Без облака. ──
  const addTaskList = (name, color) => {
    const nl = { id: _uuid(), name: ((name || "").trim() || "Список"), color: color || "#0a0a0a", tasks: [] };
    setTaskLists(ls => [...ls, nl]);
    return nl;
  };
  const updateTaskList = (id, patch) => setTaskLists(ls => ls.map(l => l.id === id ? { ...l, ...patch } : l));
  const removeTaskList = (id) => setTaskLists(ls => ls.filter(l => l.id !== id));
  const addTask = (listId, text) => {
    const t = (text || "").trim(); if (!t) return null;
    const nt = { id: _uuid(), text: t, done: false };
    setTaskLists(ls => ls.map(l => l.id === listId ? { ...l, tasks: [...(l.tasks || []), nt] } : l));
    return nt;
  };
  const toggleTask = (listId, taskId) => setTaskLists(ls => ls.map(l => l.id !== listId ? l : { ...l, tasks: (l.tasks || []).map(t => t.id === taskId ? { ...t, done: !t.done } : t) }));
  const removeTask = (listId, taskId) => setTaskLists(ls => ls.map(l => l.id !== listId ? l : { ...l, tasks: (l.tasks || []).filter(t => t.id !== taskId) }));
  const updateTask = (listId, taskId, patch) => setTaskLists(ls => ls.map(l => l.id !== listId ? l : { ...l, tasks: (l.tasks || []).map(t => t.id === taskId ? { ...t, ...patch } : t) }));

  return <AppStateCtx.Provider value={{
    mood, setMood,
    dayMoods, setDayMoods,
    dayNotes, setDayNotes,
    widgets, setWidgets, homeLayout, setHomeLayout,
    wheelSpheres, setWheelSpheres,
    themeOverride, setThemeOverride,
    mode, persistId, userName, setUserName, avatar, setAvatar, enterDemo, enterFresh, enterLive,
    aiBrief, invitedCount, teamGoalXP, refreshTeamGoalXP,
    claimedChallenges, spentXP, spendXP, grantBonusXP, noteSpentXP,
    pendingAch, clearPendingAch,
    pendingDayClose, clearPendingDayClose,
    pendingJoinWelcome, clearPendingJoinWelcome, acceptTeamInvite, declineTeamInvite,
    tourStep, setTourStep, startTour, endTour, tourMode,
    onbWelcome, setOnbWelcome, onbTab, setOnbTab, showTabIntro,
    tourScreen, startScreenTour, guideDone, finishGuide,
    habits, goals,
    toggleHabit, addHabit, updateHabit, removeHabit, reorderHabits,
    addGoal, updateGoal, removeGoal, reorderGoals,
    taskLists, addTaskList, updateTaskList, removeTaskList, addTask, toggleTask, removeTask, updateTask,
    teams, addTeam, removeTeam, updateTeam, reorderTeams, addTeamHabit, removeTeamHabit,
    communityView, setCommunityView,
  }}>{children}</AppStateCtx.Provider>;
}

Object.assign(window, { MOOD_OPTIONS, ALL_SPHERES, DEFAULT_SPHERES, AppStateCtx, useApp, AppProvider });

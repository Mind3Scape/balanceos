/* Shared UI bits + iPhone frame for BalanceOS */
const { useState, useRef, useEffect } = React;

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

// Bottom tab bar
function TabBar({ active, dark = false, onTab, style }) {
  const tabs = [
    { id: "home", icon: "Home" },
    { id: "habits", icon: "Bolt" },
    { id: "community", icon: "Group" },
    { id: "ai", icon: "Sparkles" },
  ];
  const idx = Math.max(0, tabs.findIndex(t => t.id === active));
  return (
    <div className={"bos-tabbar " + (dark ? "dark" : "")} style={style}>
      {/* Liquid-glass selection lens — springs between tabs. */}
      <span className="bos-tab-lens" style={{ transform: "translateX(" + (idx * 100) + "%)" }} />
      {tabs.map(t => (
        <button key={t.id} className={"tab tap " + (active === t.id ? "active" : "")}
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
function SwipeRow({ children, actions = [], rowBg = "#fff", actionWidth = 64, dark = false, trackBg }) {
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
    setReleasing(true); setOpen(shouldOpen); setDx(shouldOpen ? -W : 0);
  };
  const onClickCapture = (e) => {
    if (e.target.closest && e.target.closest("[data-swipe-actions]")) return; // let action buttons fire
    if (justDragged.current) { e.stopPropagation(); e.preventDefault(); justDragged.current = false; return; }
    if (open) { e.stopPropagation(); e.preventDefault(); close(); } // tap a revealed row → close, don't navigate
  };

  const offset = releasing ? (open ? -W : 0) : dx;
  return (
    <div style={{ position: "relative", overflow: "hidden", touchAction: "pan-y", background: track }}
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
              <span style={{ width: 40, height: 40, borderRadius: "50%", background: ts.bg, display: "grid", placeItems: "center",
                boxShadow: dark ? "none" : "0 1px 3px rgba(0,0,0,0.10)" }}>
                {React.createElement(a.icon, { size: 18, color: ts.fg, strokeWidth: a.tone === "done" ? 2.6 : 2, style: { display: "block" } })}
              </span>
            </button>
          );
        })}
      </div>
      )}
      {/* The WHITE row itself rounds its trailing (right) corners as it slides away,
          so it reads like a card peeling off — the grey beneath is just the
          background flowing through (no rounding on the track). */}
      <div style={{ position: "relative", background: rowBg, transform: "translateX(" + offset + "px)",
        borderTopRightRadius: offset < 0 ? 16 : 0, borderBottomRightRadius: offset < 0 ? 16 : 0,
        transition: releasing ? "transform 0.3s cubic-bezier(0.32,0.72,0,1), border-radius 0.25s ease" : "none", willChange: "transform" }}>
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

  if (!render) return null;

  const onDown = (e) => {
    drag.current = { y0: e.clientY, id: e.pointerId, dy: 0 };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
  };
  const onMove = (e) => {
    const c = drag.current; if (!c || c.id !== e.pointerId) return;
    c.dy = Math.max(0, e.clientY - c.y0);
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
      {onBack ? (
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

// Toggle switch
function Switch({ on, onChange, dark = false }) {
  return (
    <button onClick={() => onChange(!on)} className="tap" style={{
      width: 50, height: 30, borderRadius: 999,
      background: on ? "#0a0a0a" : (dark ? "#3f3f46" : "#d4d4d4"),
      border: 0, position: "relative", padding: 0,
      transition: "background 0.18s",
    }}>
      <span style={{
        position: "absolute", top: 3, left: on ? 23 : 3,
        width: 24, height: 24, borderRadius: "50%",
        background: "#fff",
        transition: "left 0.2s ease",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
}

// Segmented (Build / Quit etc)
function Segmented({ options, value, onChange }) {
  return (
    <div className="tab-pill">
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
function XPRewardCard({ amount = 150, reason = "когда друг начнёт пользоваться приложением", dark = false, mode = "app", circleNow = 2, circleGoal = 3, circleBonus = 300 }) {
  const ink = "#0a0a0a";
  const inkSub = "rgba(0,0,0,0.62)";
  const left = Math.max(0, circleGoal - circleNow);
  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 20, padding: "16px 17px",
      background: "linear-gradient(135deg, #FEDE34 0%, #FFC400 100%)", color: ink,
      boxShadow: "0 12px 30px rgba(254,222,52,0.34)" }}>
      <div aria-hidden style={{ position: "absolute", right: -34, top: -38, width: 168, height: 168, borderRadius: "50%",
        border: "20px solid rgba(255,255,255,0.18)", boxShadow: "0 0 0 20px rgba(255,255,255,0.09)", pointerEvents: "none" }} />
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
const _onbMood = () => {
  const v = window.__bosOnbMood;
  if (typeof v !== "number") return null;
  return v >= 0.80 ? MOOD_OPTIONS[0]   // Энергия
       : v >= 0.60 ? MOOD_OPTIONS[1]   // Радость
       : v >= 0.40 ? MOOD_OPTIONS[2]   // Спокойствие
       : v >= 0.22 ? MOOD_OPTIONS[5]   // Усталость
       :             MOOD_OPTIONS[4];  // Упадок
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

/* Home widgets: full for the demo; minimal for a fresh new user — don't overwhelm.
   Stat cards / calendar / team / energy stay off until there's something to show. */
const DEMO_WIDGETS  = { quote: true, mood: true, streak: true,  level: true,  calendar: true,  team: true,  energy: true,  ai: true,  weather: false, books: false };
const FRESH_WIDGETS = { quote: true, mood: true, streak: false, level: true, calendar: false, team: false, energy: false, ai: false, weather: false, books: false };

/* Promo render (the 3-phone marketing composite in promo.html): keep the filled
   demo data, but start with the guided tour already "done" so no intro sheet
   auto-rises over the screens — they must read clean in the small welcome image.
   Inert for real users (the flag is only ever set by promo.html's iframes). */
const IS_PROMO = (() => { try { return new URLSearchParams(window.location.search).get("promo") === "1"; } catch (e) { return false; } })();

function AppProvider({ children }) {
  const [mood, setMood] = useState(MOOD_OPTIONS[1]);
  const [dayMoods, setDayMoods] = useState(SEED_DAYMOODS);
  const [dayNotes, setDayNotes] = useState(SEED_DAYNOTES);
  const [widgets, setWidgets] = useState(DEMO_WIDGETS);
  const [wheelSpheres, setWheelSpheres] = useState(DEFAULT_SPHERES);
  // "auto" = follow per-route DARK_ROUTES; "light" / "dark" force everywhere.
  const [themeOverride, setThemeOverride] = useState("auto");

  // Demo vs. fresh-start experience. Default = demo (a reload always lands on the
  // pristine filled demo). The signup screen flips this via enterDemo/enterFresh.
  const [mode, setMode] = useState("demo");      // "demo" | "fresh"
  const [userName, setUserName] = useState("Павел");
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

  const toggleHabit = (id) => setHabits(hs => hs.map(h => h.id === id ? { ...h, done: !h.done } : h));
  const addHabit = (h) => { const nh = { id: _nid(), done: false, streak: 0, ...h }; setHabits(hs => [...hs, nh]); return nh; };
  const updateHabit = (id, patch) => setHabits(hs => hs.map(h => h.id === id ? { ...h, ...patch } : h));
  const removeHabit = (id) => setHabits(hs => hs.filter(h => h.id !== id));

  const addGoal = (g) => { const ng = { id: _nid(), current: 0, ...g }; setGoals(gs => [...gs, ng]); return ng; };
  const updateGoal = (id, patch) => setGoals(gs => gs.map(g => g.id === id ? { ...g, ...patch } : g));
  const removeGoal = (id) => setGoals(gs => gs.filter(g => g.id !== id));

  const [teams, setTeams] = useState(SEED_TEAMS);
  // New teams go to the TOP so the just-created one is immediately visible.
  const addTeam = (t) => { const nt = { progress: 0, members: [], habits: [], ...t, _id: _nid() }; setTeams(ts => [nt, ...ts]); return nt; };
  const removeTeam = (id) => setTeams(ts => ts.filter(t => t._id !== id));
  const updateTeam = (id, patch) => setTeams(ts => ts.map(t => t._id === id ? { ...t, ...patch } : t));
  const addTeamHabit = (teamId, h) => setTeams(ts => ts.map(t => {
    if (t._id !== teamId) return t;
    const nh = { id: _nid(), doneToday: 0, total: (t.members?.length || 1), weekPct: 0, isMain: false, week: [0,0,0,0,0,0,0], ...h };
    let habits = t.habits || [];
    if (nh.isMain) habits = habits.map(x => ({ ...x, isMain: false })); // only one anchor
    return { ...t, habits: [...habits, nh] };
  }));
  const removeTeamHabit = (teamId, habitId) => setTeams(ts => ts.map(t => t._id === teamId ? { ...t, habits: (t.habits || []).filter(h => h.id !== habitId) } : t));

  // ── Local-first persistence (the spine) ────────────────────────────
  // A real user's life is saved under their profile id; the demo (id = null) is
  // intentionally NEVER persisted, so a reload always reseeds Павел's showcase.
  // Today this is localStorage; the cloud (Supabase) later mirrors the same
  // snapshot behind the very same bosStore.save call — AppProvider won't change.
  const [persistId, setPersistId] = useState(null);
  const saveTimer = useRef(null);
  useEffect(() => {
    if (!persistId || !window.bosStore) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    // Debounce: a flurry of taps coalesces into one write.
    saveTimer.current = setTimeout(() => {
      window.bosStore.save(persistId, { userName, habits, goals, teams, dayMoods, dayNotes, widgets, wheelSpheres });
    }, 400);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [persistId, userName, habits, goals, teams, dayMoods, dayNotes, widgets, wheelSpheres]);

  // ── Entry modes ───────────────────────────────────────────────────
  // enterDemo: fill everything with the seed demo (Павел's filled life).
  // enterFresh: wipe to a clean slate, like a brand-new first user.
  const enterDemo = () => {
    setMode("demo"); setUserName("Павел");
    setHabits(SEED_HABITS); setGoals(SEED_GOALS); setTeams(SEED_TEAMS);
    setDayMoods(SEED_DAYMOODS); setDayNotes(SEED_DAYNOTES); setMood(MOOD_OPTIONS[1]); setWheelSpheres(DEFAULT_SPHERES); setWidgets(DEMO_WIDGETS);
    setCommunityView({ networkUnlocked: true, discTab: "teams", section: "discover", commTab: "network" });
    // Demo greets each screen with its own intro sheet → clear "seen" so home
    // (and every tab) shows one. No forced linear tour anymore.
    setOnbWelcome(false); setOnbTab(null); seenTabs.current = {}; setTourStep(-1); setTourScreen(null); setGuideDone(false);
    setPersistId(null); // demo is ephemeral — never written to disk
  };
  const enterFresh = (name = "") => {
    setMode("fresh"); setUserName((name || "").trim());
    setHabits([]); setGoals([]); setTeams([]);
    setDayMoods({}); setDayNotes({}); setMood(_onbMood() || MOOD_OPTIONS[2]); setWheelSpheres(DEFAULT_SPHERES); setWidgets(FRESH_WIDGETS);
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
    if (saved) {
      setUserName(saved.userName || name);
      setHabits(saved.habits || []); setGoals(saved.goals || []); setTeams(saved.teams || []);
      setDayMoods(saved.dayMoods || {}); setDayNotes(saved.dayNotes || {});
      setWheelSpheres(saved.wheelSpheres || DEFAULT_SPHERES); setWidgets(saved.widgets || FRESH_WIDGETS);
      setMood(_onbMood() || MOOD_OPTIONS[2]); // live mood isn't persisted yet — start neutral
    } else {
      setUserName(name);
      setHabits([]); setGoals([]); setTeams([]);
      setDayMoods({}); setDayNotes({}); setMood(_onbMood() || MOOD_OPTIONS[2]); setWheelSpheres(DEFAULT_SPHERES); setWidgets(FRESH_WIDGETS);
    }
    setCommunityView({ networkUnlocked: false, discTab: "teams", section: "discover", commTab: "network" });
    // First-time real users get the welcome sheets; returning ones skip straight in.
    setOnbWelcome(!saved); setOnbTab(null); seenTabs.current = { home: true }; setTourStep(-1); setTourScreen(null); setGuideDone(!!saved);
    setPersistId(pid); // from here on, every change is saved under this real profile
  };
  const startTour = (mode) => { setTourMode(mode || "demo"); setTourStep(0); };
  const endTour = () => setTourStep(-1);

  // Community tab/section view-state lives here so navigating into a detail
  // screen and back doesn't reset it (the screen unmounts on push/pop).
  const [communityView, setCommunityViewRaw] = useState({ section: "discover", discTab: "teams", commTab: "network", networkUnlocked: false });
  const setCommunityView = (patch) => setCommunityViewRaw(v => ({ ...v, ...patch }));

  return <AppStateCtx.Provider value={{
    mood, setMood,
    dayMoods, setDayMoods,
    dayNotes, setDayNotes,
    widgets, setWidgets,
    wheelSpheres, setWheelSpheres,
    themeOverride, setThemeOverride,
    mode, persistId, userName, enterDemo, enterFresh, enterLive,
    tourStep, setTourStep, startTour, endTour, tourMode,
    onbWelcome, setOnbWelcome, onbTab, setOnbTab, showTabIntro,
    tourScreen, startScreenTour, guideDone, finishGuide,
    habits, goals,
    toggleHabit, addHabit, updateHabit, removeHabit,
    addGoal, updateGoal, removeGoal,
    teams, addTeam, removeTeam, updateTeam, addTeamHabit, removeTeamHabit,
    communityView, setCommunityView,
  }}>{children}</AppStateCtx.Provider>;
}

Object.assign(window, { MOOD_OPTIONS, ALL_SPHERES, DEFAULT_SPHERES, AppStateCtx, useApp, AppProvider });

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

/* iOS-app swipe-action circle colors, theme-adaptive. */
function swipeTone(tone, dark) {
  if (tone === "delete") return dark ? { bg: "rgba(255,255,255,0.12)", fg: "#FF453A" } : { bg: "#f0f0f2", fg: "#FF3B30" };
  if (tone === "share")  return dark ? { bg: "rgba(255,255,255,0.14)", fg: "#ffffff" } : { bg: "#eceef2", fg: "#0a0a0a" };
  return dark ? { bg: "#ffffff", fg: "#0a0a0a" } : { bg: "#0a0a0a", fg: "#ffffff" }; // done
}

/* Swipe-to-reveal row actions, styled as iOS-app round icon buttons. Drag a row
   left to expose the actions; a tap on a closed row passes through to its own
   onClick, a tap on an open row closes it; vertical drags fall through to scroll. */
function SwipeRow({ children, actions = [], rowBg = "#fff", actionWidth = 64, dark = false }) {
  const [open, setOpen] = useState(false);
  const [dx, setDx] = useState(0);
  const [releasing, setReleasing] = useState(true);
  const d = useRef(null);
  const justDragged = useRef(false);
  const W = actions.length * actionWidth;

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
    <div style={{ position: "relative", overflow: "hidden", touchAction: "pan-y" }}
      onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
      onClickCapture={onClickCapture}>
      <div data-swipe-actions="" style={{ position: "absolute", top: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", background: rowBg, isolation: "isolate", zIndex: 0 }}>
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
      <div style={{ position: "relative", background: rowBg, transform: "translateX(" + offset + "px)",
        transition: releasing ? "transform 0.3s cubic-bezier(0.32,0.72,0,1)" : "none", willChange: "transform" }}>
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

Object.assign(window, { Phone, StatusBar, NavProvider, useNav, TabBar, PageHeader, Switch, Segmented, NavCtx, SwipeRow, SheetCtx, useSheet, BottomSheet, CountUp });

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
  { id: 1, emoji: "🙏", name: "Помогать другим", done: true,  streak: 12, friends: [{name:"Анна",initials:"А",color:"#e8c8a8"},{name:"Марк",initials:"М",color:"#a8b9d4"}] },
  { id: 2, emoji: "🧘🏼‍♀️", name: "Медитация", done: true, streak: 27, duration: 10, friends: [{name:"Лена",initials:"Л",color:"#d4b8e8"},{name:"Вик",initials:"В",color:"#a8d4e8"},{name:"Том",initials:"Т",color:"#b8e8c8"}] },
  { id: 3, emoji: "🏃🏼‍♀️", name: "Утренняя пробежка", done: true, streak: 5, duration: 25, friends: [{name:"Анна",initials:"А",color:"#e8c8a8"}] },
  { id: 4, emoji: "📚", name: "Читать книгу", done: false, streak: 3, duration: 20 },
  { id: 5, emoji: "✍🏼", name: "Бумажный дневник", done: false, streak: 8, duration: 5 },
  { id: 6, emoji: "🥊", name: "Бокс", done: true, streak: 9, duration: 30, friends: [{name:"Марк",initials:"М",color:"#a8b9d4"}] },
  { id: 7, emoji: "🥗", name: "Здоровое питание", done: true, streak: 15 },
];
const SEED_GOALS = [
  { id: 1, emoji: "🥊", name: "100 раундов бокса", current: 62,  target: 100, unit: "раундов", deadline: "1 авг" },
  { id: 2, emoji: "📖", name: "Прочитать 24 книги", current: 8,  target: 24,  unit: "книг",   deadline: "31 дек" },
  { id: 3, emoji: "🎯", name: "Пробежать марафон",  current: 4,  target: 22,  unit: "недель", deadline: "14 окт" },
  { id: 4, emoji: "🧘🏼‍♀️", name: "300 дней медитации", current: 187, target: 300, unit: "дней", deadline: "в след. году" },
];
const SEED_TEAMS = [
  { _id: "seed-1", name: "Команда креаторов", emblem: "✨", goal: "50 добрых дел", date: "1 — 31 дек", progress: 0.62, accent: "#fef3c7",
    members: [
      { name: "Ник",     initials: "Н",  color: "#a8b9d4", pct: 19, streak: 6,  todayDone: 1, todayTotal: 4 },
      { name: "Светлана", initials: "С",  color: "#e8c8a8", pct: 50, streak: 12, todayDone: 2, todayTotal: 4 },
      { name: "Вадим",    initials: "В",  color: "#a8d4e8", pct: 92, streak: 21, todayDone: 4, todayTotal: 4 },
      { name: "Сергей",   initials: "Сг", color: "#c8e8a8", pct: 67, streak: 9,  todayDone: 3, todayTotal: 4 },
    ],
    habits: [
      { id: 201, emoji: "🙏", name: "Добрые дела",         isMain: true,  doneToday: 3, total: 4, weekPct: 0.78, week: [1,1,0,1,1,1,1] },
      { id: 202, emoji: "🧘🏼‍♀️", name: "Групповая медитация", isMain: false, doneToday: 2, total: 4, weekPct: 0.65, week: [1,0,1,1,0,1,1] },
      { id: 203, emoji: "📖", name: "Читаем вместе",        isMain: false, doneToday: 1, total: 4, weekPct: 0.42, week: [0,1,0,1,0,0,1] },
      { id: 204, emoji: "🥗", name: "Здоровое питание",     isMain: false, doneToday: 3, total: 4, weekPct: 0.81, week: [1,1,1,1,0,1,1] },
    ] },
  { _id: "seed-2", name: "Добрые дела", emblem: "🌱", goal: "21-дневный спринт доброты", date: "1 — 21 апр", progress: 0.41, accent: "#d6f3df",
    members: [
      { name: "Анна", initials: "А", color: "#e8a8c8", pct: 33, streak: 4, todayDone: 1, todayTotal: 2 },
      { name: "Миша", initials: "М", color: "#a8e8d4", pct: 71, streak: 15, todayDone: 2, todayTotal: 2 },
    ],
    habits: [
      { id: 211, emoji: "🌱", name: "Доброе дело дня", isMain: true,  doneToday: 2, total: 2, weekPct: 0.70, week: [1,1,1,0,1,1,0] },
      { id: 212, emoji: "💬", name: "Поддержать друга", isMain: false, doneToday: 1, total: 2, weekPct: 0.50, week: [1,0,1,0,1,0,1] },
    ] },
];
// New-item id source. Module-level → resets to 1000 on every reload alongside the seeds.
let _bosNextId = 1000;
const _nid = () => ++_bosNextId;

function AppProvider({ children }) {
  const [mood, setMood] = useState(MOOD_OPTIONS[1]);
  const [dayMoods, setDayMoods] = useState({
    21: 0, 22: 1, 23: 4, 24: 5, 25: 1, 26: 3, 27: 0, 28: 1,
  });
  const [widgets, setWidgets] = useState({
    quote: true, mood: true, streak: true, level: true,
    calendar: true, team: true, energy: true, ai: true,
    weather: false, books: false,
  });
  const [wheelSpheres, setWheelSpheres] = useState(DEFAULT_SPHERES);
  // "auto" = follow per-route DARK_ROUTES; "light" / "dark" force everywhere.
  const [themeOverride, setThemeOverride] = useState("auto");

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

  // Community tab/section view-state lives here so navigating into a detail
  // screen and back doesn't reset it (the screen unmounts on push/pop).
  const [communityView, setCommunityViewRaw] = useState({ section: "discover", discTab: "teams", commTab: "courses", networkUnlocked: false });
  const setCommunityView = (patch) => setCommunityViewRaw(v => ({ ...v, ...patch }));

  return <AppStateCtx.Provider value={{
    mood, setMood,
    dayMoods, setDayMoods,
    widgets, setWidgets,
    wheelSpheres, setWheelSpheres,
    themeOverride, setThemeOverride,
    habits, goals,
    toggleHabit, addHabit, updateHabit, removeHabit,
    addGoal, updateGoal, removeGoal,
    teams, addTeam, removeTeam, updateTeam, addTeamHabit, removeTeamHabit,
    communityView, setCommunityView,
  }}>{children}</AppStateCtx.Provider>;
}

Object.assign(window, { MOOD_OPTIONS, ALL_SPHERES, DEFAULT_SPHERES, AppStateCtx, useApp, AppProvider });

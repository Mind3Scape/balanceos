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
function TabBar({ active, dark = false, onTab }) {
  const tabs = [
    { id: "home", icon: "Home" },
    { id: "habits", icon: "Bolt" },
    { id: "community", icon: "Group" },
    { id: "ai", icon: "Sparkles" },
  ];
  return (
    <div className={"bos-tabbar " + (dark ? "dark" : "")}>
      {tabs.map(t => (
        <button key={t.id} className={"tab tap " + (active === t.id ? "active" : "")}
          onClick={() => onTab(t.id)}>
          {React.createElement(I[t.icon], { size: 24, filled: active === t.id })}
        </button>
      ))}
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

Object.assign(window, { Phone, StatusBar, NavProvider, useNav, TabBar, PageHeader, Switch, Segmented, NavCtx });

/* ── Moods used across Home / Mood picker / Calendar ─────────────────
   Colors are saturated so the orb gradient (white → c → deep(c) → black)
   reads as a vivid sphere instead of a pastel disc. */
const MOOD_OPTIONS = [
  { i: "😌", t: "Спокойствие", c: "#5FA8FF" },
  { i: "⚡️", t: "Энергия",     c: "#FFC22E" },
  { i: "😔", t: "Упадок",      c: "#8B8FA3" },
  { i: "😤", t: "Стресс",      c: "#FF5C6F" },
  { i: "🙂", t: "Ровно",       c: "#3FC57E" },
  { i: "🔥", t: "В огне",      c: "#FF7A2E" },
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

  return <AppStateCtx.Provider value={{
    mood, setMood,
    dayMoods, setDayMoods,
    widgets, setWidgets,
    wheelSpheres, setWheelSpheres,
    themeOverride, setThemeOverride,
  }}>{children}</AppStateCtx.Provider>;
}

Object.assign(window, { MOOD_OPTIONS, ALL_SPHERES, DEFAULT_SPHERES, AppStateCtx, useApp, AppProvider });

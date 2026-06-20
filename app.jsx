/* ──────────────────────────────────────────────────────────────────────────
   BalanceOS — single full-screen phone (iPhone PWA build)

   The original "BalanceOS App.html" was a *design canvas*: ~30 phone mockups
   laid out in scrollable strips. This entry instead renders ONE phone, scaled
   to fill the real device viewport, with the full navigation graph + native
   iOS-style push / pop / fade transitions. All screen + component code is
   reused verbatim from the design bundle.
   ────────────────────────────────────────────────────────────────────────── */
const { useState, useRef, useEffect, useCallback } = React;

/* Route maps — copied verbatim from the design canvas so behaviour matches. */
const DARK_ROUTES = new Set([
  "profile", "settings", "support",
  "onboarding", "intro", "signup", "levels", "mood", "focus", "level-up", "ai-chat",
]);
const TAB_ROUTES = new Set(["home", "habits", "community", "ai"]);
const FULLBLEED_ROUTES = new Set(["intro", "onboarding", "signup"]);

// Root (html/body) background per screen — matches each screen's own base
// colour so the home-indicator safe area is never a mismatched dark bar
// (belt-and-suspenders alongside the full-height, no-fixed layout).
const ROOT_BG = {
  intro: "#060912", onboarding: "#060912", signup: "#0a0a0a",
  mood: "#050505", focus: "#05060a", levels: "#0a0a0a", "level-up": "#0a0a0a",
  "ai-chat": "#0a0a0a", profile: "#0a0a0a", settings: "#0a0a0a", support: "#0a0a0a",
};

const SCREENS = {
  home: () => HomeScreen,
  habits: () => HabitsScreen,
  "habit-settings": () => HabitSettingsScreen,
  "goal-settings": () => GoalSettingsScreen,
  "info": () => InfoScreen,
  "icon-picker": () => IconPickerScreen,
  "home-customize": () => HomeCustomizeScreen,
  levels: () => LevelsScreen,
  "habit-detail": () => HabitDetailScreen,
  "goal-detail": () => GoalDetailScreen,
  mood: () => MoodScreen,
  journal: () => JournalScreen,
  focus: () => FocusScreen,
  "level-up": () => LevelUpScreen,
  "ai-chat": () => AIChatScreen,
  community: () => CommunityScreen,
  "team-create": () => TeamCreateScreen,
  "team-detail": () => TeamDetailScreen,
  "team-settings": () => TeamSettingsScreen,
  "course-detail": () => CourseDetailScreen,
  "contact-detail": () => ContactDetailScreen,
  profile: () => ProfileScreen,
  settings: () => SettingsScreen,
  notifications: () => NotificationsScreen,
  history: () => HistoryScreen,
  support: () => SupportScreen,
  ai: () => AIScreen,
  onboarding: () => IntroScreen,
  intro: () => IntroScreen,
  signup: () => SignUpScreen,
};

/* Design tokens (from the canvas "Tweaks" defaults). Applied once so screens
   read the intended accent / radius / sphere-glow / check colour. */
const TWEAK_DEFAULTS = {
  accent: "#FEDE34",
  palette: ["#FEDE34", "#0a0a0a", "#f1f1f1"],
  canvas: "#ffffff",
  radius: 27,
  titleFont: "sans",
  density: "regular",
  showAvatars: true,
  sphereGlow: 100,
  checkColor: "#232323",
};
const FONT_STACKS = {
  serif: "ui-serif, 'New York', 'Source Serif 4', Georgia, serif",
  sans: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Manrope', system-ui, sans-serif",
  mono: "'SF Mono', Menlo, monospace",
};
const DENSITY_PAD = { compact: "10px 14px", regular: "14px 16px", comfy: "18px 20px" };

function applyTweaks(t) {
  const r = document.documentElement;
  r.style.setProperty("--accent", t.accent);
  r.style.setProperty("--bg", t.palette[2]);
  r.style.setProperty("--ink", t.palette[1]);
  r.style.setProperty("--bos-radius", t.radius + "px");
  r.style.setProperty("--bos-title-font", FONT_STACKS[t.titleFont] || FONT_STACKS.sans);
  r.style.setProperty("--bos-row-pad", DENSITY_PAD[t.density] || DENSITY_PAD.regular);
  r.style.setProperty("--bos-sphere-glow", (t.sphereGlow / 100).toString());
  r.style.setProperty("--bos-avatars", t.showAvatars ? "inline-flex" : "none");
  r.style.setProperty("--check-color", t.checkColor || t.accent);
}

const START_ROUTE = "intro"; // cinematic onboarding is the best "hand it to a friend" opener

// True when launched from the iOS home screen (installed PWA). There we let the
// REAL system status bar show; in a browser tab we draw our own so the mockup
// still looks complete.
const IS_STANDALONE =
  (typeof window !== "undefined") &&
  ((window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
    window.navigator.standalone === true);

// Build tag — shown as a faint watermark bottom-right + logged to console.
const APP_VERSION = "v58";
try { console.log("BalanceOS build", APP_VERSION); } catch (e) {}

/* Animation class names per navigation direction. */
const ANIM = {
  push: { out: "anim-push-out", in: "anim-push-in" },
  pop: { out: "anim-pop-out", in: "anim-pop-in" },
  fade: { out: "anim-fade-out", in: "anim-fade-in" },
};

/* ── Guided tour (coach marks) — runs once on entering the demo ────────────────
   Hybrid form: a welcome card framing the ecosystem, then a moving spotlight that
   lights each REAL tab in turn (the tour drives the tab bar), then a closing card.
   Skippable at every step. Mounted in the phone shell so it survives tab fades. */
const TOUR_STOPS = [
  { kind: "card", emoji: "✨", title: "Это не просто трекер привычек",
    body: "BalanceOS — платформа: привычки, команды, наставники, курсы и ИИ. Уровень растёт — и открывается всё больше. Покажу за минуту.", cta: "Показать" },
  { kind: "spot", tab: "home", sel: '.bos-tabbar button:nth-of-type(1)', radius: 16, eyebrow: "Главная", title: "Твой экран дня",
    body: "Виджеты состояния, баланса и серий. Соберёшь под себя — что важно, то и наверху." },
  { kind: "spot", tab: "home", sel: '[data-tour="aihints"]', radius: 22, eyebrow: "Подсказки ИИ", title: "Совет под твой день",
    body: "Подсказки наверху — от ИИ. Чем больше контекста о себе ты заполняешь, тем точнее и полезнее они становятся." },
  { kind: "spot", tab: "home", sel: '[data-tour="state"]', radius: 20, eyebrow: "Состояние", title: "Отметь, как ты сейчас",
    body: "Раз в день отмечай своё состояние — и приложение подстроится под тебя: цвет, тон, акценты дня." },
  { kind: "spot", tab: "home", sel: '[data-tour="level"]', radius: 18, eyebrow: "Геймификация", title: "Уровень растёт за привычки",
    body: "Каждая отметка качает уровень. Чем выше — тем больше открывается: наставники, контакты, возможности." },
  { kind: "spot", tab: "habits", sel: '.bos-tabbar button:nth-of-type(2)', radius: 16, eyebrow: "Привычки и цели", title: "Тут ты всё создаёшь",
    body: "Твоя личная система. Привычки и цели живут здесь." },
  { kind: "spot", tab: "habits", sel: '[data-tour="add"]', radius: 999, eyebrow: "Создать", title: "Жми «плюс»",
    body: "Добавляй привычки и цели. Любую можно делать одному — или вместе с друзьями, поддерживая серии." },
  { kind: "spot", tab: "community", sel: '.bos-tabbar button:nth-of-type(3)', radius: 16, eyebrow: "Сообщество", title: "Здесь живёт экосистема",
    body: "Команды, курсы и наставники. Привычки вместе держат сильнее." },
  { kind: "spot", tab: "community", discTab: "network", sel: '[data-tour="impact"]', radius: 20, eyebrow: "Нетворк · твой вклад", title: "Помогай другим",
    body: "С ростом уровня ты сам сможешь помогать кругу — вести, консультировать, делиться тем, что умеешь. Каждое доброе дело — твой вклад." },
  { kind: "spot", tab: "community", discTab: "network", sel: '[data-tour="contacts"]', radius: 20, eyebrow: "Нетворк · контакты", title: "Заказывай помощь других",
    body: "А баллы за привычки трать на людей вокруг: запишись к человеку, попади в его карточку, закажи услугу. Так растёте вместе." },
  { kind: "spot", tab: "ai", sel: '.bos-tabbar button:nth-of-type(4)', radius: 16, eyebrow: "Помощник", title: "ИИ всегда под рукой",
    body: "Совет, разбор дня, план на завтра. Он держит в уме твой контекст." },
  { kind: "card", emoji: "🌟", title: "Готово — это твоё пространство",
    body: "Отмечай состояние, расти в уровне, открывай людей. Чем дальше — тем больше возможностей. Поехали.", cta: "Начать" },
];

function GuidedTour({ step, setStep, endTour, navigate, setCommunityView, dark }) {
  const rootRef = useRef(null);
  const [spot, setSpot] = useState(null); // {cx, cy, top, w, shellH}
  const stop = (step >= 0 && step < TOUR_STOPS.length) ? TOUR_STOPS[step] : null;

  // Drive the tab bar so each "tab" stop shows the real section behind the dim.
  useEffect(() => {
    if (stop && stop.kind === "spot") {
      navigate(stop.tab);
      if (stop.discTab && setCommunityView) setCommunityView({ section: "discover", discTab: stop.discTab });
    }
  }, [step]); // eslint-disable-line

  // Measure the active tab button so the spotlight hole + caret land on it.
  useEffect(() => {
    if (!stop || stop.kind !== "spot") { setSpot(null); return undefined; }
    let raf2;
    const measure = () => {
      const shell = rootRef.current && rootRef.current.parentElement;
      if (!shell) return;
      const el = shell.querySelector(stop.sel);
      if (!el) return;
      try { el.scrollIntoView({ block: "center", inline: "nearest" }); } catch (_) {}
      const s = shell.getBoundingClientRect(), b = el.getBoundingClientRect();
      setSpot({ x: b.left - s.left, y: b.top - s.top, w: b.width, h: b.height, sw: s.width, sh: s.height });
    };
    const t = window.setTimeout(measure, 400); // after the tab fade settles
    const raf = requestAnimationFrame(() => { raf2 = requestAnimationFrame(measure); });
    window.addEventListener("resize", measure);
    return () => { window.clearTimeout(t); cancelAnimationFrame(raf); cancelAnimationFrame(raf2); window.removeEventListener("resize", measure); };
  }, [step]); // eslint-disable-line

  if (!stop) return null;
  const last = step >= TOUR_STOPS.length - 1;
  const next = () => { if (last) { endTour(); navigate("home"); } else setStep(step + 1); };
  const skip = () => { endTour(); navigate("home"); };

  const dots = (
    <div style={{ display: "flex", gap: 5, justifyContent: "center", marginTop: 14 }}>
      {TOUR_STOPS.map((_, i) => (
        <span key={i} style={{ width: i === step ? 16 : 5, height: 5, borderRadius: 999, background: i === step ? "#FEDE34" : (dark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.18)"), transition: "width 0.3s, background 0.3s" }} />
      ))}
    </div>
  );
  const cardBg = dark ? "rgba(26,26,30,0.97)" : "rgba(255,255,255,0.98)";
  const titleC = dark ? "#fff" : "#0a0a0a";
  const bodyC = dark ? "rgba(255,255,255,0.62)" : "rgba(0,0,0,0.55)";
  const ghostC = dark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.4)";
  const tourStyle = (
    <style>{`
      @keyframes bosTourPop { from { opacity: 0; transform: scale(0.93) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      @keyframes bosTourRing { 0% { transform: scale(0.75); opacity: 0.9; } 100% { transform: scale(1.55); opacity: 0; } }
      .bos-tour-pop { animation: bosTourPop 0.42s cubic-bezier(0.34,1.56,0.64,1) both; }
    `}</style>
  );

  // ── Centered welcome / closing card ──
  if (stop.kind === "card") {
    return (
      <div ref={rootRef} style={{ position: "absolute", inset: 0, zIndex: 500, display: "grid", placeItems: "center", padding: 28, background: "rgba(4,6,12,0.62)", backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)" }}>
        <div className="bos-tour-pop" style={{ width: "100%", maxWidth: 320, background: cardBg, borderRadius: 28, padding: "30px 24px 22px", textAlign: "center", boxShadow: "0 30px 70px rgba(0,0,0,0.45)", border: dark ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
          <div style={{ fontSize: 46, lineHeight: 1, marginBottom: 14 }}>{stop.emoji}</div>
          <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif", fontSize: 22, fontWeight: 700, letterSpacing: "-0.4px", color: titleC, lineHeight: 1.2 }}>{stop.title}</div>
          <div style={{ fontSize: 14.5, color: bodyC, lineHeight: 1.5, marginTop: 10 }}>{stop.body}</div>
          <button onClick={next} className="tap" style={{ width: "100%", marginTop: 22, background: "linear-gradient(135deg,#FEDE34,#FFC400)", color: "#0a0a0a", border: 0, borderRadius: 999, padding: 15, fontSize: 15.5, fontWeight: 700 }}>{stop.cta}</button>
          {!last && <button onClick={skip} className="tap" style={{ width: "100%", marginTop: 8, background: "transparent", border: 0, color: ghostC, fontSize: 13, padding: 8 }}>Пропустить</button>}
          {dots}
        </div>
        {tourStyle}
      </div>
    );
  }

  // ── Element spotlight (cutout + tooltip) ──
  const pad = 6;
  const cutout = spot ? { left: spot.x - pad, top: spot.y - pad, width: spot.w + pad * 2, height: spot.h + pad * 2 } : null;
  const tcx = spot ? spot.x + spot.w / 2 : 200;                       // target centre x
  const below = spot ? (spot.y + spot.h / 2) < spot.sh * 0.5 : false; // card below a top-half target, else above
  const cardTop = (spot && below) ? (spot.y + spot.h + pad + 14) : undefined;
  const cardBottom = (spot && !below) ? (spot.sh - spot.y + pad + 14) : (spot ? undefined : 110);
  const caretLeft = spot ? Math.max(16, Math.min(tcx - 21, spot.sw - 28 - 22)) : 180;
  return (
    <div ref={rootRef} style={{ position: "absolute", inset: 0, zIndex: 500 }}>
      {/* tap blocker (and a flat dim until the target is measured) */}
      <div style={{ position: "absolute", inset: 0, background: cutout ? "transparent" : "rgba(4,6,12,0.62)" }} />
      {/* cutout: dims everything except the target via a huge ring-shadow */}
      {cutout && <div style={{ position: "absolute", left: cutout.left, top: cutout.top, width: cutout.width, height: cutout.height, borderRadius: stop.radius, boxShadow: "0 0 0 9999px rgba(4,6,12,0.66)", border: "1.5px solid rgba(254,222,52,0.85)", transition: "all 0.34s cubic-bezier(0.32,0.72,0,1)", pointerEvents: "none" }} />}
      <div className="bos-tour-pop" style={{ position: "absolute", left: 14, right: 14, top: cardTop, bottom: cardBottom, background: cardBg, borderRadius: 22, padding: "16px 18px 14px", boxShadow: "0 24px 60px rgba(0,0,0,0.45)", border: dark ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase", color: "#E0A500" }}>{stop.eyebrow}</div>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.3px", color: titleC, marginTop: 3 }}>{stop.title}</div>
        <div style={{ fontSize: 13.5, color: bodyC, lineHeight: 1.45, marginTop: 6 }}>{stop.body}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
          <button onClick={skip} className="tap" style={{ background: "transparent", border: 0, color: ghostC, fontSize: 13, padding: "6px 4px" }}>Пропустить</button>
          <button onClick={next} className="tap" style={{ background: dark ? "#fff" : "#0a0a0a", color: dark ? "#0a0a0a" : "#fff", border: 0, borderRadius: 999, padding: "9px 20px", fontSize: 14, fontWeight: 600 }}>{last ? "Готово" : "Далее"}</button>
        </div>
        {dots}
        {below
          ? <span aria-hidden style={{ position: "absolute", top: -7, left: caretLeft, width: 14, height: 14, background: cardBg, transform: "rotate(45deg)", borderRadius: 3, borderLeft: dark ? "1px solid rgba(255,255,255,0.08)" : "none", borderTop: dark ? "1px solid rgba(255,255,255,0.08)" : "none" }} />
          : <span aria-hidden style={{ position: "absolute", bottom: -7, left: caretLeft, width: 14, height: 14, background: cardBg, transform: "rotate(45deg)", borderRadius: 3, borderRight: dark ? "1px solid rgba(255,255,255,0.08)" : "none", borderBottom: dark ? "1px solid rgba(255,255,255,0.08)" : "none" }} />}
      </div>
      {tourStyle}
    </div>
  );
}

function PhoneApp() {
  const app = useApp();
  const [frames, setFrames] = useState([{ route: START_ROUTE, params: {}, id: 0 }]);
  const [anim, setAnim] = useState(null); // { dir, prevFrame }
  const idRef = useRef(1);

  // Interactive edge-swipe-back: drag from the left edge to pop, finger-tracked.
  const [drag, setDrag] = useState(null); // { dx, w, releasing } during/just-after a drag
  const dragRef = useRef(null);
  const stackRef = useRef(null);
  const EDGE_ZONE = 32;  // px from the left edge that arms the gesture (roomier = easier to start)
  const DRAG_THRESH = 7; // px of travel before we lock to a horizontal drag

  // App-wide bottom sheet (share, etc.), opened from any screen via useSheet().
  const [sheet, setSheet] = useState(null);
  const sheetApi = React.useMemo(() => ({
    open: (node) => setSheet(node),
    close: () => setSheet(null),
  }), []);

  useEffect(() => {
    applyTweaks(TWEAK_DEFAULTS);
    // Reveal the app and fade the launch splash once mounted.
    const id = requestAnimationFrame(() => document.body.classList.add("app-ready"));
    return () => cancelAnimationFrame(id);
  }, []);

  const navigate = useCallback((next, np = {}) => {
    setFrames((prev) => {
      const idx = prev.findIndex((f) => f.route === next);
      // Re-navigating to the current screen → just refresh its params, no transition.
      if (idx === prev.length - 1) {
        const copy = prev.slice();
        copy[idx] = { ...copy[idx], params: np || {} };
        return copy;
      }
      const cur = prev[prev.length - 1];
      let dir, nextFrames;
      if (idx >= 0) {
        dir = "pop";
        nextFrames = prev.slice(0, idx + 1);
      } else if (TAB_ROUTES.has(next)) {
        dir = "fade";
        nextFrames = [{ route: next, params: np || {}, id: idRef.current++ }];
      } else {
        dir = "push";
        nextFrames = [...prev, { route: next, params: np || {}, id: idRef.current++ }];
      }
      setAnim({ dir, prevFrame: cur });
      return nextFrames;
    });
  }, []);

  // Pop one screen off the stack — used by Telegram's native Back button.
  const goBack = useCallback(() => {
    setFrames((prev) => {
      if (prev.length <= 1) return prev;
      setAnim({ dir: "pop", prevFrame: prev[prev.length - 1] });
      return prev.slice(0, -1);
    });
  }, []);

  const top = frames[frames.length - 1];

  const themeFor = (route) =>
    app.themeOverride === "dark" ? true
      : app.themeOverride === "light" ? false
        : DARK_ROUTES.has(route);

  const topDark = themeFor(top.route);
  const topInTabs = TAB_ROUTES.has(top.route);

  // Keep the iOS status-bar tint + the root background in sync with the screen,
  // so the home-indicator safe area never shows a stray black bar.
  useEffect(() => {
    const bg = ROOT_BG[top.route] || (topDark ? "#0a0a0a" : "#f1f1f1");
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", bg);
    document.documentElement.style.background = bg;
    document.body.style.background = bg;
    if (window.tgHeader) window.tgHeader(bg); // match Telegram's chrome to the screen
  }, [top.route, topDark]);

  // Telegram Mini App: show the native Back button on any pushed screen and let
  // it pop our stack; hidden at a tab root. No-op in a normal browser.
  useEffect(() => {
    if (window.tgBackButton) window.tgBackButton(frames.length > 1, goBack);
  }, [frames.length, goBack]);

  // Safety net: clear the transition even if `animationend` never fires — e.g.
  // the installed PWA is backgrounded mid-animation (iOS freezes the animation
  // clock), or a throttled tab. Without this, a stuck `anim` would freeze the
  // page stack and block the edge-swipe gesture (which needs a settled state).
  useEffect(() => {
    if (!anim) return undefined;
    const t = window.setTimeout(() => setAnim(null), 520);
    return () => window.clearTimeout(t);
  }, [anim]);

  const renderLayer = (frame, animClass, onEnd) => {
    const dark = themeFor(frame.route);
    const inTabs = TAB_ROUTES.has(frame.route);
    const full = FULLBLEED_ROUTES.has(frame.route);
    const Comp = (SCREENS[frame.route] && SCREENS[frame.route]()) || HomeScreen;
    const cls =
      "bos-page " + (dark ? "theme-dark" : "theme-light") +
      (inTabs ? "" : " no-tabbar") + (full ? " full-bleed" : "") +
      (animClass ? " " + animClass : "");
    return (
      <div key={frame.id} className={cls} onAnimationEnd={onEnd}>
        <NavCtx.Provider value={{ route: frame.route, params: frame.params, navigate }}>
          <Comp />
        </NavCtx.Provider>
      </div>
    );
  };

  const renderDragLayer = (frame, style, dimStyle) => {
    const dark = themeFor(frame.route);
    const inTabs = TAB_ROUTES.has(frame.route);
    const full = FULLBLEED_ROUTES.has(frame.route);
    const Comp = (SCREENS[frame.route] && SCREENS[frame.route]()) || HomeScreen;
    const cls =
      "bos-page " + (dark ? "theme-dark" : "theme-light") +
      (inTabs ? "" : " no-tabbar") + (full ? " full-bleed" : "");
    return (
      <div key={frame.id} className={cls} style={style}>
        <NavCtx.Provider value={{ route: frame.route, params: frame.params, navigate }}>
          <Comp />
        </NavCtx.Provider>
        {dimStyle && <div className="bos-drag-dim" style={dimStyle} />}
      </div>
    );
  };

  const clearAnim = () => setAnim(null);

  // ── Edge-swipe-back gesture (pointer events → works with touch AND mouse) ──
  const canPop = frames.length > 1 && !anim;
  const prevFrame = frames.length > 1 ? frames[frames.length - 2] : null;

  const onDragStart = (e) => {
    if (!canPop || drag) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (e.clientX > EDGE_ZONE) return;
    dragRef.current = {
      id: e.pointerId, x0: e.clientX, y0: e.clientY,
      w: (stackRef.current && stackRef.current.clientWidth) || window.innerWidth || 1,
      active: false, dx: 0,
    };
  };
  const onDragMove = (e) => {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x0, dy = e.clientY - d.y0;
    if (!d.active) {
      if (Math.abs(dx) < DRAG_THRESH && Math.abs(dy) < DRAG_THRESH) return;
      if (Math.abs(dy) > Math.abs(dx)) { dragRef.current = null; return; } // vertical → let it scroll
      d.active = true;
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
    }
    // Track horizontal velocity (px/ms) so a quick flick can complete the pop.
    const now = performance.now();
    if (d.lastT != null) { const dt = now - d.lastT; if (dt > 0) d.vx = (e.clientX - d.lastX) / dt; }
    d.lastX = e.clientX; d.lastT = now;
    d.dx = Math.max(0, Math.min(dx, d.w));
    if (e.cancelable) e.preventDefault();
    setDrag({ dx: d.dx, w: d.w, releasing: false });
  };
  const onDragEnd = (e) => {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    dragRef.current = null;
    if (!d.active) return;
    // Go back on a clear rightward flick OR a third of the way across — so a quick
    // short swipe still completes instead of snapping shut (felt "harsh" before).
    const pop = (d.vx || 0) > 0.4 || d.dx > d.w * 0.3;
    setDrag({ dx: pop ? d.w : 0, w: d.w, releasing: true });
    window.setTimeout(() => {
      if (pop) setFrames((f) => (f.length > 1 ? f.slice(0, -1) : f));
      setDrag(null);
    }, 300);
  };

  const p = drag ? Math.max(0, Math.min(drag.dx / drag.w, 1)) : 0;
  const dragTrans = drag && drag.releasing
    ? "transform 0.3s var(--ios-ease), opacity 0.3s var(--ios-ease)"
    : "none";
  const destTab = drag && prevFrame && TAB_ROUTES.has(prevFrame.route) ? prevFrame.route : null;

  return (
    <SheetCtx.Provider value={sheetApi}>
    <div className="fit-root">
      <div className={"phone-shell " + (topDark ? "is-dark" : "is-light")}>
        <div
          className="page-stack"
          ref={stackRef}
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
        >
          {drag && prevFrame ? (
            <React.Fragment>
              {renderDragLayer(
                prevFrame,
                { transform: "translateX(" + (-24 * (1 - p)).toFixed(2) + "%)", transition: dragTrans, zIndex: 1 },
                { opacity: 0.18 * (1 - p), transition: dragTrans }
              )}
              {renderDragLayer(
                top,
                { transform: "translateX(" + drag.dx + "px)", transition: dragTrans, zIndex: 2, boxShadow: "-12px 0 40px rgba(0,0,0,0.18)" },
                null
              )}
            </React.Fragment>
          ) : (
            <React.Fragment>
              {anim && renderLayer(anim.prevFrame, ANIM[anim.dir].out)}
              {renderLayer(top, anim ? ANIM[anim.dir].in : "", anim ? clearAnim : undefined)}
            </React.Fragment>
          )}
        </div>
        {/* No fake status bar. iOS draws the real one in an installed PWA; in a
            browser or Telegram the OS / Telegram owns the top bar, so we stay clean. */}
        {!drag && topInTabs && (
          <TabBar key="tabbar" active={top.route} dark={topDark} onTab={(id) => navigate(id)} />
        )}
        {destTab && (
          <TabBar key="tabbar-drag" active={destTab} dark={themeFor(destTab)}
            onTab={(id) => navigate(id)} style={{ opacity: p, transition: dragTrans }} />
        )}
        <div className="bos-version">{APP_VERSION}</div>
        <BottomSheet open={!!sheet} onClose={sheetApi.close} dark={topDark}>{sheet}</BottomSheet>
        <GuidedTour step={app.tourStep} setStep={app.setTourStep} endTour={app.endTour} navigate={navigate} setCommunityView={app.setCommunityView} dark={topDark} />
      </div>
    </div>
    </SheetCtx.Provider>
  );
}

function Root() {
  return (
    <AppProvider>
      <PhoneApp />
    </AppProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);

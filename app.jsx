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
  mood: () => MoodScreen,
  journal: () => JournalScreen,
  focus: () => FocusScreen,
  "level-up": () => LevelUpScreen,
  "ai-chat": () => AIChatScreen,
  community: () => CommunityScreen,
  "team-create": () => TeamCreateScreen,
  "team-detail": () => TeamDetailScreen,
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
const APP_VERSION = "v33";
try { console.log("BalanceOS build", APP_VERSION); } catch (e) {}

/* Animation class names per navigation direction. */
const ANIM = {
  push: { out: "anim-push-out", in: "anim-push-in" },
  pop: { out: "anim-pop-out", in: "anim-pop-in" },
  fade: { out: "anim-fade-out", in: "anim-fade-in" },
};

function PhoneApp() {
  const app = useApp();
  const [frames, setFrames] = useState([{ route: START_ROUTE, params: {}, id: 0 }]);
  const [anim, setAnim] = useState(null); // { dir, prevFrame }
  const idRef = useRef(1);

  // Interactive edge-swipe-back: drag from the left edge to pop, finger-tracked.
  const [drag, setDrag] = useState(null); // { dx, w, releasing } during/just-after a drag
  const dragRef = useRef(null);
  const stackRef = useRef(null);
  const EDGE_ZONE = 26;  // px from the left edge that arms the gesture
  const DRAG_THRESH = 8; // px of travel before we lock to a horizontal drag

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
  }, [top.route, topDark]);

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
    d.dx = Math.max(0, Math.min(dx, d.w));
    if (e.cancelable) e.preventDefault();
    setDrag({ dx: d.dx, w: d.w, releasing: false });
  };
  const onDragEnd = (e) => {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    dragRef.current = null;
    if (!d.active) return;
    const pop = d.dx > d.w * 0.4;
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
        {/* Real OS status bar on installed app; drawn one only in a browser tab. */}
        {!IS_STANDALONE && <StatusBar dark={topDark} />}
        {!drag && topInTabs && (
          <TabBar key="tabbar" active={top.route} dark={topDark} onTab={(id) => navigate(id)} />
        )}
        {destTab && (
          <TabBar key="tabbar-drag" active={destTab} dark={themeFor(destTab)}
            onTab={(id) => navigate(id)} style={{ opacity: p, transition: dragTrans }} />
        )}
        <div className="bos-version">{APP_VERSION}</div>
        <BottomSheet open={!!sheet} onClose={sheetApi.close} dark={topDark}>{sheet}</BottomSheet>
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

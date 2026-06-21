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
// Cinematic / immersive screens stay dark always. The settings/profile/levels/
// achievements cluster now FOLLOWS the app theme (light in light, dark in dark).
// Onboarding/intro/signup now FOLLOW the app theme (light by default, dark when
// the user forces dark) — each already ships both palettes. Only the cinematic
// in-app immersive screens stay always-dark.
const DARK_ROUTES = new Set([
  "mood", "focus", "level-up", "ai-chat",
]);
const TAB_ROUTES = new Set(["home", "habits", "community", "ai"]);
const FULLBLEED_ROUTES = new Set(["intro", "onboarding", "signup"]);

// Root (html/body) background per screen — matches each screen's own base
// colour so the home-indicator safe area is never a mismatched dark bar
// (belt-and-suspenders alongside the full-height, no-fixed layout).
const ROOT_BG = {
  mood: "#050505", focus: "#05060a", "level-up": "#0a0a0a", "ai-chat": "#0a0a0a",
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
  "team-chat": () => TeamChatScreen,
  "team-settings": () => TeamSettingsScreen,
  "course-detail": () => CourseDetailScreen,
  "contact-detail": () => ContactDetailScreen,
  profile: () => ProfileScreen,
  achievements: () => AchievementsScreen,
  guide: () => GuideScreen,
  manifest: () => ManifestScreen,
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
  serif: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
  sans: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif",
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
const APP_VERSION = "v85";
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
  { kind: "spot", tab: "home", sel: '[data-tour="level"]', radius: 18, eyebrow: "Геймификация", title: "Уровень растёт с первого дня",
    body: "Каждая отметка с самого начала качает опыт и уровень. Загляни — покажу, как это устроено." },
  { kind: "peek", tab: "levels", eyebrow: "Геймификация", title: "Опыт, ачивки, награды",
    body: "Вот сердце прогресса: сверху — за что капает XP, ниже — ачивки (открывают новые круги людей) и награды за кредиты. Растёшь — открывается больше." },
  { kind: "peek", tab: "achievements", eyebrow: "Ачивки вживую", title: "Каждая открывает свой круг",
    body: "Вот они: «Перегрузка» открыла наставников по фокусу, «Капитан команды» — лидеров. Каждая ачивка — ключ к новым людям и +уровень доступа." },
  { kind: "spot", tab: "habits", sel: '.bos-tabbar button:nth-of-type(2)', radius: 16, eyebrow: "Привычки и цели", title: "Тут ты всё создаёшь",
    body: "Твоя личная система. Привычки и цели живут здесь." },
  { kind: "spot", tab: "habits", sel: '[data-tour="presets"]', radius: 16, eyebrow: "Шаблоны", title: "Листай готовые привычки",
    body: "Сверху — карусель пресетов: листай её вбок и тапни любую, чтобы добавить привычку за секунду." },
  { kind: "spot", tab: "habits", sel: '[data-tour="add"]', radius: 999, eyebrow: "Создать", title: "Жми «плюс»",
    body: "Или собери свою с нуля. Любую привычку можно делать одному — или вместе с друзьями, поддерживая серии." },
  { kind: "spot", tab: "community", sel: '.bos-tabbar button:nth-of-type(3)', radius: 16, eyebrow: "Сообщество", title: "Здесь живёт экосистема",
    body: "Команды, курсы и наставники. Привычки вместе держат сильнее." },
  { kind: "spot", tab: "community", view: { section: "discover", discTab: "teams" }, sel: '[data-tour="make-team"]', radius: 18, eyebrow: "Команды", title: "Создавай свои команды",
    body: "Объедини семью, друзей или клиентов тренинга. У каждой — общая цель, чат и статистика. Заглянем, как собрать." },
  { kind: "spot", tab: "team-create", sel: '[data-tour="team-modes"]', radius: 18, eyebrow: "Режимы команды", title: "Как двигать общую цель",
    body: "Общий счёт, серия у каждого или гонка — выбираешь формат. А двигают цель привычки самих участников." },
  { kind: "spot", tab: "team-create", sel: '[data-tour="team-stakes"]', radius: 18, eyebrow: "Геймификация", title: "Ставка на опыт",
    body: "Все скидывают XP в общий банк. Дошли до цели — он возвращается ×2. Не дошли — сгорает. Вот это азарт." },
  { kind: "spot", tab: "team-detail", sel: '[data-tour="team-chat"]', radius: 18, eyebrow: "Внутри команды", title: "Статистика и чат",
    body: "Лидерборд по вкладу, прогресс, живые цифры — тренеру видно каждого. А вот и общий чат ↓" },
  { kind: "peek", tab: "team-chat", eyebrow: "Чат команды", title: "Команда на связи",
    body: "Заглянем внутрь: переписка, фото, взаимная поддержка — так команда держит общий ритм вместе." },
  { kind: "spot", tab: "community", view: { section: "discover", discTab: "network" }, sel: '[data-tour="impact"]', radius: 20, eyebrow: "Нетворк · твой вклад", title: "Стань тем, к кому идут",
    body: "С ростом уровня ты сам помогаешь кругу — ведёшь, консультируешь, делишься тем, что умеешь. Каждое доброе дело растит твой вклад и репутацию." },
  { kind: "spot", tab: "community", view: { section: "discover", discTab: "network" }, sel: '[data-tour="contacts"]', radius: 20, eyebrow: "Нетворк · контакты", title: "Заказывай помощь других",
    body: "А баллы за привычки трать на людей вокруг: запишись к человеку, попади в его карточку, закажи услугу наставника. Так растёте вместе." },
  { kind: "spot", tab: "community", view: { section: "community", commTab: "courses" }, sel: '[data-tour="course"]', radius: 20, eyebrow: "Курсы", title: "Ускорители роста",
    body: "Курсы и интенсивы поднимают уровень и открывают новые круги контактов — как ключи: прошёл курс → получил ачивку → доступ к людям выше." },
  { kind: "spot", tab: "ai", sel: '.bos-tabbar button:nth-of-type(4)', radius: 16, eyebrow: "Помощник", title: "ИИ всегда под рукой",
    body: "Совет, разбор дня, план на завтра. Он держит в уме твой контекст." },
  { kind: "card", emoji: "🌟", title: "Готово — это твоё пространство",
    body: "Отмечай состояние, расти в уровне, открывай людей. Чем дальше — тем больше возможностей. Поехали.", cta: "Начать" },
];

/* Per-screen slices of the tour, launched from a demo intro sheet's "Показать
   детально". The welcome/closing cards and the redundant "this is the X tab"
   spots are skipped — the sheet already introduces the screen. */
const SCREEN_TOURS = {
  home: TOUR_STOPS.slice(2, 7),        // aihints, state, level, levels-peek, ach-peek
  habits: TOUR_STOPS.slice(8, 10),     // presets, add
  community: TOUR_STOPS.slice(11, 19), // make-team … course (teams, chat, network, courses)
  ai: [],
};

/* GuidedTour renders ONE screen's stops (SCREEN_TOURS[tourScreen]); the demo
   greets each screen with a sheet, and "Показать детально" launches these. On
   finish it returns to that screen's base tab, leaving the user free to explore. */
function GuidedTour({ step, setStep, endTour, navigate, setCommunityView, tourScreen, dark }) {
  const STOPS = SCREEN_TOURS[tourScreen] || [];
  const baseTab = TAB_ROUTES.has(tourScreen) ? tourScreen : "home";
  const rootRef = useRef(null);
  const [spot, setSpot] = useState(null); // {cx, cy, top, w, shellH}
  const prevCtxRef = useRef(null);        // last stop's tab|view — detect page switches
  const stop = (step >= 0 && step < STOPS.length) ? STOPS[step] : null;
  const ctxKey = stop ? stop.tab + "|" + (stop.view ? (stop.view.discTab || stop.view.commTab || stop.view.section || "") : "") : "";

  // Drive the tab bar so each "tab" stop shows the real section behind the dim.
  useEffect(() => {
    if (stop && (stop.kind === "spot" || stop.kind === "peek")) {
      navigate(stop.tab, {}, { instant: true });   // instant: no fade/slide under the dim
      if (stop.view && setCommunityView) setCommunityView(stop.view);
    }
  }, [step]); // eslint-disable-line

  // Measure the target so the spotlight hole + caret land on it. Robust to tab
  // fades and page scroll: re-measure each frame until the layout is STABLE, then
  // commit once. On a context switch (different tab/view) clear the old highlight
  // first, so it fades in fresh at the new spot instead of sliding across the
  // screen and visibly "catching up" (the laggy/glitchy adjust on the contacts page).
  useEffect(() => {
    if (!stop || stop.kind !== "spot") { setSpot(null); return undefined; }
    const sameCtx = prevCtxRef.current === ctxKey;
    prevCtxRef.current = ctxKey;
    if (!sameCtx) setSpot(null); // drop the stale highlight during the page switch

    let raf, cancelled = false, frames = 0, stable = 0, lastKey = "";
    const tick = () => {
      if (cancelled) return;
      frames++;
      const shell = rootRef.current && rootRef.current.parentElement;
      const el = shell && shell.querySelector(stop.sel);
      if (el) {
        try { el.scrollIntoView({ block: "center", inline: "nearest" }); } catch (_) {}
        const s = shell.getBoundingClientRect(), b = el.getBoundingClientRect();
        const m = { x: b.left - s.left, y: b.top - s.top, w: b.width, h: b.height, sw: s.width, sh: s.height };
        const key = [m.x, m.y, m.w, m.h].map(n => Math.round(n)).join(",");
        if (key === lastKey) stable++; else { stable = 0; lastKey = key; }
        if (sameCtx) setSpot(m);                 // same page → track live (smooth slide)
        if (stable >= 2) { setSpot(m); return; }  // settled → commit (reveals on a switch)
      }
      if (frames > 130) return;                  // hard cap (~2s) so it never spins
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener("resize", tick);
    return () => { cancelled = true; cancelAnimationFrame(raf); window.removeEventListener("resize", tick); };
  }, [step]); // eslint-disable-line

  if (!stop) return null;
  const last = step >= STOPS.length - 1;
  const next = () => { if (last) { endTour(); navigate(baseTab); } else setStep(step + 1); };
  const skip = () => { endTour(); navigate(baseTab); };

  const dots = (
    <div style={{ display: "flex", gap: 5, justifyContent: "center", marginTop: 14 }}>
      {STOPS.map((_, i) => (
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
      @keyframes bosTourCut { from { opacity: 0; } to { opacity: 1; } }
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

  // ── Peek: open a real screen and show a bottom tooltip with NO dim, so the
  //    screen stays fully alive (e.g. the team chat in action — "feel it"). ──
  if (stop.kind === "peek") {
    return (
      <div ref={rootRef} style={{ position: "absolute", inset: 0, zIndex: 500, pointerEvents: "none" }}>
        {/* transparent blocker: taps don't escape, but the screen reads bright */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "auto", background: "transparent" }} />
        <div className="bos-tour-pop" style={{ position: "absolute", left: 14, right: 14, bottom: "max(20px, calc(var(--bos-safe-bottom, 0px) + 14px))", background: cardBg, borderRadius: 22, padding: "16px 18px 14px", boxShadow: "0 24px 60px rgba(0,0,0,0.5)", border: dark ? "1px solid rgba(255,255,255,0.08)" : "none", pointerEvents: "auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase", color: "#E0A500" }}>{stop.eyebrow}</div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.3px", color: titleC, marginTop: 3 }}>{stop.title}</div>
          <div style={{ fontSize: 13.5, color: bodyC, lineHeight: 1.45, marginTop: 6 }}>{stop.body}</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
            <button onClick={skip} className="tap" style={{ background: "transparent", border: 0, color: ghostC, fontSize: 13, padding: "10px 14px", margin: "-4px -8px" }}>Пропустить</button>
            <button onClick={next} className="tap" style={{ background: dark ? "#fff" : "#0a0a0a", color: dark ? "#0a0a0a" : "#fff", border: 0, borderRadius: 999, padding: "10px 22px", fontSize: 14, fontWeight: 600 }}>{last ? "Готово" : "Далее"}</button>
          </div>
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
      <div style={{ position: "absolute", inset: 0, background: cutout ? "transparent" : "rgba(4,6,12,0.66)" }} />
      {/* cutout: dims everything except the target via a huge ring-shadow */}
      {cutout && <div key={ctxKey} style={{ position: "absolute", left: cutout.left, top: cutout.top, width: cutout.width, height: cutout.height, borderRadius: stop.radius, boxShadow: "0 0 0 9999px rgba(4,6,12,0.66)", border: "1.5px solid rgba(254,222,52,0.85)", transition: "all 0.34s cubic-bezier(0.32,0.72,0,1)", pointerEvents: "none" }} />}
      <div className="bos-tour-pop" style={{ position: "absolute", left: 14, right: 14, top: cardTop, bottom: cardBottom, background: cardBg, borderRadius: 22, padding: "16px 18px 14px", boxShadow: "0 24px 60px rgba(0,0,0,0.45)", border: dark ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase", color: "#E0A500" }}>{stop.eyebrow}</div>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.3px", color: titleC, marginTop: 3 }}>{stop.title}</div>
        <div style={{ fontSize: 13.5, color: bodyC, lineHeight: 1.45, marginTop: 6 }}>{stop.body}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
          <button onClick={skip} className="tap" style={{ background: "transparent", border: 0, color: ghostC, fontSize: 13, padding: "10px 14px", margin: "-4px -8px" }}>Пропустить</button>
          <button onClick={next} className="tap" style={{ background: dark ? "#fff" : "#0a0a0a", color: dark ? "#0a0a0a" : "#fff", border: 0, borderRadius: 999, padding: "10px 22px", fontSize: 14, fontWeight: 600 }}>{last ? "Готово" : "Далее"}</button>
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

/* ── Fresh-user onboarding: gentle iOS bottom-sheets ───────────────────────────
   Replaces the old forced coach-mark tour. Three calm "what is this" sheets rise
   on the first home screen; then, when the user opens a tab THEMSELVES for the
   first time, a one-line intro sheet rises to orient them — never a forced march. */
const WELCOME_SHEETS = [
  { eyebrow: "Добро пожаловать", title: "Это не трекер. Это платформа.",
    body: "Привычки, люди и рост — в одном месте. Маленькие шаги каждый день складываются в большое.",
    pills: [ { emoji: "⚡", label: "Привычки" }, { emoji: "👥", label: "Команды" }, { emoji: "🎓", label: "Тренинги" } ] },
  { eyebrow: "Вместе", title: "Привычки — с близкими",
    body: "Делай привычки вдвоём, собирай команды, проходи тренинги с наставниками. Вместе — крепче.",
    pills: [ { emoji: "👥", label: "Команды" }, { emoji: "🤝", label: "Вдвоём" }, { emoji: "💬", label: "Чат" } ] },
  { eyebrow: "Твой темп", title: "Расти, как тебе удобно",
    body: "Выполняй привычки — уровень растёт, открываются люди и возможности. Гид «Что дальше?» ждёт внизу.",
    pills: [ { emoji: "🏆", label: "Уровни" }, { emoji: "🧭", label: "Наставники" }, { emoji: "🎁", label: "Награды" } ] },
];

const TAB_INTROS = {
  habits: { eyebrow: "Практика", title: "Тут ты всё создаёшь",
    body: "Привычки и цели живут здесь. Делай их один или вместе с близкими, держа общую серию.",
    pills: [ { emoji: "⚡", label: "Привычки" }, { emoji: "🎯", label: "Цели" }, { emoji: "👥", label: "Вместе" } ] },
  community: { eyebrow: "Сообщество", title: "Сердце приложения",
    body: "Команды с близкими, курсы и тренинги, нетворк наставников. Вместе держим ритм сильнее.",
    pills: [
      { emoji: "👥", label: "Команды", view: { section: "discover", discTab: "teams" } },
      { emoji: "🎓", label: "Курсы", view: { section: "community", commTab: "courses" } },
      { emoji: "🧭", label: "Нетворк", view: { section: "discover", discTab: "network" } },
    ] },
  ai: { eyebrow: "Помощник", title: "ИИ всегда рядом",
    body: "Совет, разбор дня, план на завтра — Balance держит в уме твой контекст и подсказывает по делу.",
    pills: [ { emoji: "💡", label: "Совет дня" }, { emoji: "📊", label: "Разбор" }, { emoji: "🗓️", label: "План" } ] },
};

/* Demo intros — richer per-screen sheets shown when the demo user opens each tab.
   Same look as the fresh intros, but each (except AI) offers "Показать детально"
   → that screen's button-by-button spotlights (SCREEN_TOURS). */
const DEMO_INTROS = {
  home: { eyebrow: "Главная", title: "Твой экран дня", detail: true,
    body: "Состояние, баланс, серии и уровень — что важно, то наверху. Собери под себя.",
    pills: [ { emoji: "😌", label: "Состояние" }, { emoji: "🔥", label: "Серии" }, { emoji: "🏆", label: "Уровень" } ] },
  habits: { eyebrow: "Практика", title: "Тут ты всё создаёшь", detail: true,
    body: "Привычки и цели — одному или вместе. Шаблоны для быстрого старта.",
    pills: [ { emoji: "⚡", label: "Привычки" }, { emoji: "🎯", label: "Цели" }, { emoji: "👥", label: "Вместе" } ] },
  community: { eyebrow: "Сообщество", title: "Сердце экосистемы", detail: true,
    body: "Команды с близкими, нетворк наставников, курсы. Самая глубина — здесь.",
    pills: [ { emoji: "👥", label: "Команды" }, { emoji: "🧭", label: "Нетворк" }, { emoji: "🎓", label: "Курсы" } ] },
  ai: { eyebrow: "Помощник", title: "ИИ всегда рядом", detail: false,
    body: "Совет, разбор дня, план на завтра — держит в уме твой контекст и подсказывает по делу.",
    pills: [ { emoji: "💡", label: "Совет" }, { emoji: "📊", label: "Разбор" }, { emoji: "🗓️", label: "План" } ] },
};

/* The same brand orb on every onboarding sheet — identical size, position and
   tint on every step, so it reads as ONE persistent orb while only the text
   changes (orb-continuity). Pills below carry the per-screen meaning via colourful
   iOS emoji. (Richer bespoke imagery is a later design pass, together with David.) */
function OnbHero() {
  return (
    <div style={{ height: 92, display: "grid", placeItems: "center", margin: "0 auto" }}>
      <StaticOrb size={88} tint={tintFromMood("#5FA8FF")} seed={2.0} intensity={0.5} />
    </div>
  );
}

/* Presentational content for one onboarding bottom-sheet. Fixed minHeight + a
   top-anchored hero + reserved body height → every sheet is the SAME size, so
   nothing jumps between steps. `pills` (always shown) surface the key things on
   the screen; a pill with onClick jumps there. */
function OnbSheet({ eyebrow, title, body, pills, cta, onCta, onSkip, skipLabel = "Я разберусь сам", total, index, dark }) {
  const titleC = dark ? "#fff" : "#0a0a0a";
  const bodyC = dark ? "rgba(255,255,255,0.62)" : "rgba(0,0,0,0.56)";
  const ghostC = dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.38)";
  const pillBg = dark ? "rgba(255,255,255,0.08)" : "#f0f1f4";
  return (
    <div style={{ padding: "4px 22px 8px", textAlign: "center", minHeight: 454, display: "flex", flexDirection: "column" }}>
      <div style={{ marginTop: 4, marginBottom: 14 }}>
        <OnbHero />
      </div>
      {eyebrow && <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase", color: "#E0A500" }}>{eyebrow}</div>}
      {/* Title + body heights are RESERVED (2 lines / 3 lines) so a 1-line title or
         a shorter body never changes the sheet's overall height — every step is the
         same size, the hero never jumps. */}
      <div style={{ minHeight: 60, marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif", fontSize: 25, fontWeight: 700, letterSpacing: "-0.5px", color: titleC, lineHeight: 1.18 }}>{title}</div>
      </div>
      <div style={{ fontSize: 15.5, color: bodyC, lineHeight: 1.5, marginTop: 9, maxWidth: 330, marginLeft: "auto", marginRight: "auto", minHeight: 70 }}>{body}</div>
      {pills && pills.length > 0 && (
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 16 }}>
          {pills.map((p, i) => {
            const st = { background: pillBg, border: 0, borderRadius: 999, padding: "8px 13px 8px 11px", fontSize: 13.5, fontWeight: 600, color: titleC, display: "inline-flex", alignItems: "center", gap: 6 };
            const inner = <><span style={{ fontSize: 14.5, lineHeight: 1 }}>{p.emoji}</span> {p.label}</>;
            return p.onClick
              ? <button key={i} onClick={p.onClick} className="tap" style={st}>{inner}</button>
              : <span key={i} style={st}>{inner}</span>;
          })}
        </div>
      )}
      <div style={{ flex: 1, minHeight: 14 }} />
      <button onClick={onCta} className="tap" style={{ width: "100%", marginTop: 16, background: dark ? "#fff" : "#0a0a0a", color: dark ? "#0a0a0a" : "#fff", border: 0, borderRadius: 999, padding: 16, fontSize: 16, fontWeight: 600 }}>{cta}</button>
      {onSkip
        ? <button onClick={onSkip} className="tap" style={{ width: "100%", marginTop: 6, background: "transparent", border: 0, color: ghostC, fontSize: 13.5, padding: 9 }}>{skipLabel}</button>
        : (total > 1 ? <div style={{ marginTop: 6, height: 34 }} /> : null)}
      {total > 1 && (
        <div style={{ display: "flex", gap: 5, justifyContent: "center", marginTop: 12 }}>
          {Array.from({ length: total }).map((_, i) => (
            <span key={i} style={{ width: i === index ? 16 : 5, height: 5, borderRadius: 999, background: i === index ? (dark ? "#fff" : "#0a0a0a") : (dark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.16)"), transition: "width 0.3s" }} />
          ))}
        </div>
      )}
    </div>
  );
}

function FreshOnboarding({ app, dark }) {
  const welcome = !!app.onbWelcome;
  const [wStep, setWStep] = useState(0);
  useEffect(() => { if (welcome) setWStep(0); }, [welcome]);

  // Demo greets each screen with the richer DEMO_INTROS (offering "Показать
   // детально"); a fresh user gets the calm TAB_INTROS.
  const intros = app.mode === "demo" ? DEMO_INTROS : TAB_INTROS;
  const tabKey = app.onbTab;
  const tab = (!welcome && tabKey) ? intros[tabKey] : null;
  // Keep the last tab content mounted through the close animation (so it slides
  // down with text intact instead of emptying first).
  const lastTab = useRef(null);
  if (tab) lastTab.current = tab;
  const tabView = tab || lastTab.current;

  const closeWelcome = () => app.setOnbWelcome(false);
  const closeTab = () => app.setOnbTab(null);

  const ws = WELCOME_SHEETS[wStep] || WELCOME_SHEETS[0];
  const lastW = wStep >= WELCOME_SHEETS.length - 1;

  return (
    <React.Fragment>
      <BottomSheet open={welcome} onClose={closeWelcome} dark={dark}>
        <OnbSheet eyebrow={ws.eyebrow} title={ws.title} body={ws.body} pills={ws.pills} dark={dark}
          total={WELCOME_SHEETS.length} index={wStep}
          cta={lastW ? "Начать" : "Дальше"}
          onCta={() => { if (lastW) closeWelcome(); else setWStep(wStep + 1); }}
          onSkip={lastW ? null : closeWelcome} />
      </BottomSheet>
      <BottomSheet open={!!tab} onClose={closeTab} dark={dark}>
        {tabView && <OnbSheet eyebrow={tabView.eyebrow} title={tabView.title} body={tabView.body} dark={dark}
          cta={tabView.detail ? "Показать детально" : "Понятно"}
          onCta={tabView.detail ? () => { app.startScreenTour(tabKey); closeTab(); } : closeTab}
          onSkip={tabView.detail ? closeTab : undefined}
          skipLabel="Осмотрюсь сам"
          pills={tabView.pills && tabView.pills.map(p => ({ emoji: p.emoji, label: p.label, onClick: p.view ? () => { app.setCommunityView(p.view); closeTab(); } : undefined }))} />}
      </BottomSheet>
    </React.Fragment>
  );
}

/* ── "О приложении" — one beautiful page describing the whole product. Opened
   from the home "Что дальше?" banner (fresh users); links out to the manifest. */
function GuideScreen() {
  const { navigate } = useNav();
  const FEATURES = [
    { e: "🌱", t: "Привычки и цели", b: "Твоя личная система. Маленькие шаги, что ведут к большой цели — каждый день." },
    { e: "👥", t: "Вместе с близкими", b: "Общие привычки и команды — семья, друзья, клиенты тренинга. Общая цель, чат и статистика." },
    { e: "🎓", t: "Тренинги и курсы", b: "Проходи программы наставников, получай ачивки и открывай новые круги людей." },
    { e: "🧭", t: "Нетворк и наставники", b: "С ростом уровня открывается круг людей: наставники, услуги, помощь. Баллы за привычки тратишь на них." },
    { e: "✨", t: "ИИ-помощник", b: "Совет, разбор дня, план на завтра — Balance держит в уме твой контекст." },
    { e: "🏆", t: "Уровни и награды", b: "Каждый шаг даёт опыт. Уровень растёт — открываются возможности, ачивки и новые люди." },
  ];
  return (
    <div className="page-in" style={{ padding: "0 16px 28px" }}>
      <PageHeader title="О приложении" onBack={() => navigate("home")} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "6px 6px 20px" }}>
        <StaticOrb size={108} tint={tintFromMood("#46a6ff")} seed={1.6} intensity={0.6} />
        <div style={{ fontFamily: "var(--bos-title-font)", fontSize: 27, fontWeight: 800, letterSpacing: "-0.6px", color: "var(--text)", marginTop: 14, lineHeight: 1.15 }}>BalanceOS — это экосистема</div>
        <div style={{ fontSize: 15, color: "var(--text-3)", marginTop: 10, lineHeight: 1.55, maxWidth: 332 }}>Не просто трекер привычек, а место, где ты растёшь вместе с близкими: общие привычки, команды, тренинги, цели и ИИ-помощник — в одном приложении.</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {FEATURES.map((f, i) => (
          <div key={i} style={{ background: "var(--card)", borderRadius: 20, padding: 16, boxShadow: "var(--card-shadow)", display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: "var(--surface-3)", display: "grid", placeItems: "center", fontSize: 24, flexShrink: 0 }}>{f.e}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16.5, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.2px" }}>{f.t}</div>
              <div style={{ fontSize: 13.5, color: "var(--text-3)", marginTop: 4, lineHeight: 1.5 }}>{f.b}</div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => navigate("manifest")} className="tap"
        style={{ width: "100%", marginTop: 16, background: "#0a0a0a", color: "#fff", border: 0, borderRadius: 20, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, textAlign: "left" }}>
        <div style={{ width: 44, height: 44, borderRadius: 13, background: "rgba(255,255,255,0.1)", display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0 }}>📜</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Прочитать манифест</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>Во что мы верим и зачем всё это</div>
        </div>
        <I.ChevronRight size={20} color="rgba(255,255,255,0.6)" />
      </button>
      <button onClick={() => navigate("home")} className="tap" style={{ width: "100%", marginTop: 10, background: "transparent", border: 0, color: "var(--text-4)", fontSize: 14.5, fontWeight: 500, padding: 12 }}>Начать пользоваться →</button>
    </div>
  );
}

function PhoneApp() {
  const app = useApp();
  // Optional deep link: ?screen=home opens straight to a screen (skips intro).
  // Used by the promo composite and for sharing a direct link to a view.
  const startRoute = (() => {
    try { const s = new URLSearchParams(window.location.search).get("screen"); return (s && SCREENS[s]) ? s : START_ROUTE; }
    catch (e) { return START_ROUTE; }
  })();
  const [frames, setFrames] = useState([{ route: startRoute, params: {}, id: 0 }]);
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

  const navigate = useCallback((next, np = {}, opts = {}) => {
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
        // onboarding → signup cross-fades (the orb visually "flows" from one
        // screen into the other) instead of sliding in as a separate card.
        dir = (next === "signup" && cur.route === "intro") ? "fade" : "push";
        nextFrames = [...prev, { route: next, params: np || {}, id: idRef.current++ }];
      }
      // opts.instant → swap with NO page animation (used by the guided tour, so
      // the page changes UNDER the dim instead of fading/sliding into view = no flash).
      setAnim(opts.instant ? null : { dir, prevFrame: cur });
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

  // The first time the user opens a tab THEMSELVES, raise a one-time intro sheet
  // for that page. Fresh: calm intro (home pre-seen — welcome covers it). Demo:
  // richer intro with "Показать детально" (home included). Never while the
  // welcome sequence or a spotlight tour is running.
  useEffect(() => {
    if (TAB_ROUTES.has(top.route) && !app.onbWelcome && app.tourStep < 0 && (app.mode === "fresh" || app.mode === "demo")) {
      app.showTabIntro(top.route);
    }
  }, [top.route, app.mode, app.onbWelcome, app.tourStep]); // eslint-disable-line

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
          className={"page-stack" + (app.tourStep >= 0 ? " tour-active" : "")}
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
        <FreshOnboarding app={app} dark={topDark} />
        <GuidedTour step={app.tourStep} setStep={app.setTourStep} endTour={app.endTour} navigate={navigate} setCommunityView={app.setCommunityView} tourScreen={app.tourScreen} dark={topDark} />
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

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
const DARK_ROUTES = new Set([]);
const TAB_ROUTES = new Set(["home", "habits", "community", "ai"]);
// LIVE-меню после слияния Главной и «Привычек» (David): вкладки Главная · Сообщество · ИИ · Я.
// «Привычки» в live больше не вкладка (все карточки живут на главной, navigate("habits") → home),
// «Я» — четвёртая справа, прячется тумблером в настройках (bos:profileTab). Демо живёт на старом
// TAB_ROUTES/дефолте TabBar — его не трогаем.
const LIVE_TAB_ROUTES = new Set(["home", "community", "ai", "profile"]);
// Иконки-семья «система колец» (солнце · орбита · искры · ты-в-кольце) ОТКАЧЕНА до
// согласования (David: «перерисуй и согласуй прежде чем делать») — черновые Sun/OrbitPeople/
// PersonRing остались в icons.jsx; после отмашки по новому макету просто заменить имена тут.
// Порядок вкладок (David 2026-07-04): Главная → ИИ → Сообщество → Я (сначала мой день,
// потом помощник по нему, потом люди/экосистема, потом Я). ИИ и Сообщество поменяны местами.
const LIVE_TABS_BASE = [
  { id: "home", icon: "Home" },
  { id: "ai", icon: "Sparkles" },
  { id: "community", icon: "Group" },
];
const LIVE_TAB_PROFILE = { id: "profile", icon: "Person" };
const FULLBLEED_ROUTES = new Set(["intro", "onboarding", "signup", "onb-mood"]);

// Root (html/body) background per screen — matches each screen's own base
// colour so the home-indicator safe area is never a mismatched dark bar
// (belt-and-suspenders alongside the full-height, no-fixed layout).
const ROOT_BG = {
  mood: "#f2f3f6", "ai-chat": "#fafafa",
};
// В ТЁМНОЙ теме светлые подложки выше НЕЛЬЗЯ применять — html/body/шапка Telegram на миг
// красились белым при переходе («белое мигание», David). Тёмные аналоги:
const ROOT_BG_DARK = {
  "ai-chat": "#0f0f12", mood: "#0a0b0e",
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
  // The state dial moved here — it runs AFTER «С чего начнём» (the signup buttons navigate to
  // it with {moodOnly:true, next}). Same IntroScreen component, in mood-only mode.
  "onb-mood": () => IntroScreen,
};

/* ── LIVE (real Telegram user) screen overrides ──────────────────────────────
   The live app is being separated from the two demos: for mode==="live" we render
   dedicated screens from screens/live/* ; demo & fresh keep using SCREENS above,
   which stay FROZEN. A route with no live override safely falls back to its demo
   screen, so the fork can land one screen at a time. */
// The LIVE app's OWN screens (real Telegram user). No demo fallback — every live route
// has a real live component; if one were ever missing that's a build bug to fix, not a
// reason to silently show a demo screen. Routes NOT listed here (intro/signup/guide —
// the shared entry & info screens) fall through to SCREENS in resolveScreen below.
const LIVE_SCREENS = {
  home: () => HomeLive,
  habits: () => HabitsLive,
  community: () => CommunityLive,
  "team-detail": () => TeamDetailLive,
  profile: () => ProfileLive,
  ai: () => AILive,
  "habit-detail": () => HabitDetailLive,
  "goal-detail": () => GoalDetailLive,
  mood: () => MoodLive,
  // David: «ощущения и дневник — одно и то же». LIVE merges them into ONE menu —
  // both routes open MoodLive (state picker + the day's journal note), so the AI's
  // "записать рефлексию" suggestion lands on the same screen where you log state.
  // (Demo keeps its separate JournalScreen, frozen.)
  journal: () => MoodLive,
  // ДОМ состояния (дизайн Б «Погода дня», 2026-07-16): неделя, линия месяца, связи, записи.
  // Двери: виджет «Состояние» на главной + «Неделя →» из шторки отметки.
  state: () => StateScreenLive,
  "ai-chat": () => AIChatLive,
  "habit-settings": () => HabitSettingsLive,
  "goal-settings": () => GoalSettingsLive,
  info: () => InfoLive,
  "home-customize": () => HomeCustomizeLive,
  // «team-create» retired — круг создаётся единой формой goal-settings (тумблер «вести вместе»).
  // Компонент TeamCreateLive оставлен дремать в community_extra (на случай отката), но недостижим.
  "team-settings": () => TeamSettingsLive,
  "team-chat": () => TeamChatLive,
  // Кабинет ведущего — дверь-компас в шапке комнаты круга (макет К, только владелец).
  "team-cabinet": () => CircleCabinetLive,
  // Привычка круга — ОТДЕЛЬНАЯ страница (стандарт-лесенка, как личная деталь), не шторка.
  "team-habit": () => CircleHabitDetailLive,
  // Человек в круге — тоже страница (кадр 3), не шторка.
  "team-person": () => CirclePersonDetailLive,
  levels: () => LevelsLive,
  "course-detail": () => CourseDetailLive,
  "partner-detail": () => PartnerDetailLive,
  "partners-all": () => PartnersAllLive,
  "contact-detail": () => ContactDetailLive,
  "net-person": () => NetPersonDetailLive,
  settings: () => SettingsLive,
  friends: () => FriendsLive,
  notifications: () => NotificationsLive,
  history: () => HistoryLive,
  support: () => SupportLive,
  achievements: () => AchievementsLive,
  manifest: () => ManifestLive,
  "icon-picker": () => IconPickerLive,
  // Гид-мануал по экономике (v531) — live-версия «Как устроен Balance»; демо-GuideScreen не тронут.
  guide: () => GuideLive,
};
function resolveScreen(route, mode) {
  if (mode === "live" && LIVE_SCREENS[route]) return LIVE_SCREENS[route]();
  // Fallback for an unknown route: in LIVE it must resolve to a live screen (HomeLive),
  // never a demo global — those are lazy-loaded and may not exist yet. Demo/fresh land on
  // the demo home (its bundle is guaranteed loaded before either mode is entered).
  return (SCREENS[route] && SCREENS[route]()) || (mode === "live" ? HomeLive : HomeScreen);
}

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

// Auto-resume a logged-in Telegram user straight to home (skip the intro) on reopen.
// LIVE now: this bot is the REAL app (onboarding shown ONCE, then auto-login). The DEMO
// lives on a SEPARATE bot whose Mini App URL carries ?demo=1 — there we never auto-resume,
// so the showcase (intro + Павел) plays every time. (See memory: balanceos-two-bot-end-state.)
const AUTO_RESUME_TG = true;

// True when this launch is the DEMO bot: its Mini App URL is «…/?demo=1» (David sets it in
// BotFather). Re-checked at call time (Telegram's start_param can arrive a beat after load).
function bosIsDemoBot() {
  try {
    var q = new URLSearchParams(window.location.search);
    var d = q.get("demo");
    if (d === "1" || d === "true") return true;
    var sp = (window.__TG && window.__TG.initDataUnsafe && window.__TG.initDataUnsafe.start_param) || "";
    return /^demo\b/.test(sp);
  } catch (e) { return false; }
}

// True when launched from the iOS home screen (installed PWA). There we let the
// REAL system status bar show; in a browser tab we draw our own so the mockup
// still looks complete.
const IS_STANDALONE =
  (typeof window !== "undefined") &&
  ((window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
    window.navigator.standalone === true);

// Build tag — also the cache-bust stamp (build.js reads it) AND the LIVE product version
// shown in the badge for a real Telegram user. Bumped on every live deploy.
const APP_VERSION = "v843";
// DEMO product version — shown in the badge for the two demos (Павел / чистый лист) and the
// shared onboarding. NOT a fake freeze: it only moves when we actually change demo code; we
// don't, so it stands still — honestly. Live (APP_VERSION) runs ahead on its own.
const DEMO_VERSION = "v191";
try { console.log("BalanceOS build", APP_VERSION, "(demo", DEMO_VERSION + ")"); } catch (e) {}

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
    body: "Вот сердце прогресса: сверху — за что капает XP, ниже — ачивки (открывают новые круги людей) и награды за XP. Растёшь — открывается больше." },
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
  { kind: "spot", tab: "team-detail", sel: '[data-tour="team-chat"]', radius: 18, eyebrow: "Внутри команды", title: "Статистика и чат",
    body: "Лидерборд по вкладу, прогресс, живые цифры — тренеру видно каждого. А вот и общий чат ↓" },
  { kind: "peek", tab: "team-chat", eyebrow: "Чат команды", title: "Команда на связи",
    body: "Заглянем внутрь: переписка, фото, взаимная поддержка — так команда держит общий ритм вместе." },
  { kind: "spot", tab: "community", view: { section: "community", commTab: "network", networkUnlocked: true }, sel: '[data-tour="impact"]', radius: 20, eyebrow: "Нетворк · твой вклад", title: "Стань тем, к кому идут",
    body: "С ростом уровня ты сам помогаешь кругу — ведёшь, консультируешь, делишься тем, что умеешь. Каждое доброе дело растит твой вклад и репутацию." },
  { kind: "spot", tab: "community", view: { section: "community", commTab: "network", networkUnlocked: true }, sel: '[data-tour="contacts"]', radius: 20, eyebrow: "Нетворк · контакты", title: "Заказывай помощь других",
    body: "А XP за привычки трать на людей вокруг: запишись к человеку, попади в его карточку, закажи услугу наставника. Так растёте вместе." },
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
// Extra stops layered onto the sliced base tour.
const HOME_SHARE_STOP = { kind: "spot", tab: "home", sel: '[data-tour="share-app"]', radius: 20, eyebrow: "Качай уровень", title: "Начни с простого — поделись",
  body: "Поделись приложением: +150 XP за каждого друга, а соберёшь троих — ещё +300 XP сверху.", cta: "Показать «Поделиться»", openShare: true };
// Dive into a SHARED habit so the demo shows the «кто с тобой» competition.
const HABIT_PEEK_STOP = { kind: "peek", tab: "habit-detail", params: { habit: { id: 1, emoji: "🙏", name: "Помогать другим", streak: 12, friends: [{ name: "Анна", initials: "А", color: "#F4A574" }, { name: "Марк", initials: "М", color: "#7FB3F2" }] }, from: "habits" }, eyebrow: "Внутри привычки", title: "Кто с тобой — соревнование",
  body: "Заходишь в привычку — видишь, кто её делает с тобой, серии у каждого и кто лидирует. Азарт держит ритм." };
// The natural referral: while CREATING a habit you can invite any friend → +XP.
const HABIT_INVITE_STOP = { kind: "spot", tab: "habit-settings", params: { mode: "create" }, sel: '[data-tour="invite-friend"]', radius: 18, eyebrow: "Вместе с другом", title: "Создавая — позови друга",
  body: "Привычку можно вести вместе с другом. Он присоединится — ты получишь +75 XP, и друг теперь в приложении." };
// The heart of the economy — a small focus on the influence MULTIPLIER.
const INFLUENCE_MULT_STOP = { kind: "spot", tab: "levels", sel: '[data-tour="influence-mult"]', radius: 18, eyebrow: "Множитель влияния", title: "Вовлекаешь — растёшь быстрее",
  body: "Главный секрет простой: чем больше друзей рядом, тем больше XP. Привычку делаешь один — +10, с другом — +15. А пригласишь троих в приложение — получишь +300 XP разом." };

// Shown at the END of the habits guide (right after creating a habit): flips the
// home hero deck to the balance wheel and explains habits → balance, AI-sorted.
const BALANCE_WHEEL_STOP = { kind: "spot", tab: "home", heroPage: 1, sel: '[data-tour="balance-wheel"]', radius: 14, eyebrow: "Баланс жизни", title: "Привычки питают твой баланс",
  body: "Каждая привычка, что ты заводишь, ложится в одну из сфер жизни — тело, разум, карьера, отношения. ИИ сам относит её в нужную сферу и ведёт твой баланс: видно, где густо, а где проседает (оранжевое просит внимания)." };

const SCREEN_TOURS = {
  home: [...TOUR_STOPS.slice(2, 6), INFLUENCE_MULT_STOP, TOUR_STOPS[6], HOME_SHARE_STOP],  // aihints, state, level, levels-peek, MULTIPLIER, ach-peek, share
  habits: [...TOUR_STOPS.slice(8, 10), HABIT_INVITE_STOP, HABIT_PEEK_STOP, BALANCE_WHEEL_STOP],  // presets, add, invite-while-creating, leaderboard peek, balance wheel (habits→balance)
  community: TOUR_STOPS.slice(11, 19),                    // make-team … course (teams, chat, network, courses)
  ai: [
    { kind: "spot", tab: "ai", sel: '[data-tour="ai-hero"]', radius: 24, eyebrow: "Чтение дня", title: "Главный инсайт дня",
      body: "Каждый день ИИ читает твои отметки и состояние — и выдаёт главное: что заметил и что сделать. Жми «Почему?» — покажет логику." },
    { kind: "spot", tab: "ai", sel: '[data-tour="ai-insights"]', radius: 18, eyebrow: "Подсказки", title: "Рекомендации под тебя",
      body: "Ежедневные советы: перенести привычку, опереться на друга, перезагрузиться. Тапни любую — раскроется и можно принять." },
    { kind: "spot", tab: "ai", sel: '[data-tour="ai-chat-btn"]', radius: 999, eyebrow: "Чат", title: "Спроси что угодно",
      body: "А тут — живой чат. Спланировать день, разобрать неделю, спросить совет: ИИ держит в уме весь твой контекст." },
    { kind: "card", emoji: "🧭", title: "Где узнать больше",
      body: "«О приложении» и манифест — во что мы верим и зачем всё это — всегда живут в профиле, в Настройках. Открыть «О приложении» сейчас?",
      cta: "Открыть «О приложении»", openAbout: true, alt: "Позже" },
  ],
};

/* GuidedTour renders ONE screen's stops (SCREEN_TOURS[tourScreen]); the demo
   greets each screen with a sheet, and "Показать детально" launches these. On
   finish it returns to that screen's base tab, leaving the user free to explore. */
function GuidedTour({ step, setStep, endTour, navigate, setCommunityView, openSheet, tourScreen, dark, onAdvance, onDismiss, lastScreen }) {
  const STOPS = SCREEN_TOURS[tourScreen] || [];
  const baseTab = TAB_ROUTES.has(tourScreen) ? tourScreen : "home";
  const rootRef = useRef(null);
  const [spot, setSpot] = useState(null); // {cx, cy, top, w, shellH}
  const [revealed, setRevealed] = useState(false); // this step's target measured → show the card
  const [late, setLate] = useState(false); // fallback: target never measured → reveal the card anyway
  const prevCtxRef = useRef(null);        // last stop's tab|view — detect page switches
  const stop = (step >= 0 && step < STOPS.length) ? STOPS[step] : null;
  const ctxKey = stop ? stop.tab + "|" + (stop.view ? (stop.view.discTab || stop.view.commTab || stop.view.section || "") : "") : "";

  // Drive the tab bar so each "tab" stop shows the real section behind the dim.
  useEffect(() => {
    if (stop && (stop.kind === "spot" || stop.kind === "peek")) {
      navigate(stop.tab, stop.params || {}, { instant: true });   // instant: no fade/slide under the dim
      if (stop.view && setCommunityView) setCommunityView(stop.view);
      // Flip the home hero deck to the page a stop wants (e.g. the balance wheel),
      // and back to the reading page (0) for every other stop.
      if (typeof window !== "undefined" && window.__bosHeroPage) window.__bosHeroPage(stop.heroPage != null ? stop.heroPage : 0);
    }
  }, [step]); // eslint-disable-line

  // Measure the target so the spotlight hole + caret land on it. Robust to tab
  // fades and page scroll: re-measure each frame until the layout is STABLE, then
  // commit once. On a context switch (different tab/view) clear the old highlight
  // first, so it fades in fresh at the new spot instead of sliding across the
  // screen and visibly "catching up" (the laggy/glitchy adjust on the contacts page).
  useEffect(() => {
    if (!stop || stop.kind !== "spot") { setSpot(null); setRevealed(false); setLate(false); return undefined; }
    const sameCtx = prevCtxRef.current === ctxKey;
    prevCtxRef.current = ctxKey;
    // Cross-screen: drop the stale highlight so it fades in fresh instead of sliding
    // across to catch up. Same-screen: keep it so the hole glides to the next target.
    if (!sameCtx) setSpot(null);
    // Hide the tooltip card until THIS step's target is measured, so it always lands at
    // its final spot — never parked at the bottom (or the old spot) and then jumping.
    setRevealed(false);
    setLate(false);

    let raf, startTimer, cancelled = false, frames = 0, stable = 0, lastKey = "", lastSet = "", committed = false, scrolled = false;
    // Safety net: if the target is NEVER found (unmounted / bad selector), reveal the
    // card on its own so the user isn't stranded. The moment the target IS found we
    // cancel this — otherwise a slow first render flashes the card centred, then it
    // visibly jumps onto the target. Generous window for the race.
    const lateTimer = setTimeout(() => { if (!cancelled) setLate(true); }, 2400);
    const tick = () => {
      if (cancelled) return;
      frames++;
      const shell = rootRef.current && rootRef.current.parentElement;
      const el = shell && shell.querySelector(stop.sel);
      if (el) {
        clearTimeout(lateTimer);   // target exists — never fall back to the centred card
        // Scroll into view ONCE. Doing it every frame keeps nudging the layout, so the
        // rect never settles and the spotlight commits mid-shift, then glides — the
        // "Создавай свои команды" jump. One scroll, then let it settle.
        if (!scrolled) { try { el.scrollIntoView({ block: "center", inline: "nearest" }); } catch (_) {} scrolled = true; }
        const s = shell.getBoundingClientRect(), b = el.getBoundingClientRect();
        const m = { x: b.left - s.left, y: b.top - s.top, w: b.width, h: b.height, sw: s.width, sh: s.height };
        const key = [m.x, m.y, m.w, m.h].map(n => Math.round(n)).join(",");
        if (key === lastKey) stable++; else { stable = 0; lastKey = key; }
        const apply = () => { if (key !== lastSet) { setSpot(m); lastSet = key; } };
        // Hold the FIRST reveal until the layout is stable for several frames (much
        // longer on a cross-screen switch, where the new screen + its lists/avatars
        // are still reflowing) so the spotlight lands ONCE at its final spot — no jump.
        if (stable >= (sameCtx ? 4 : 12) || frames > 90) { if (!committed) setRevealed(true); committed = true; }
        // After the reveal, keep tracking late layout shifts so the hole can never end
        // up half-covering the target; the cutout's CSS transition smooths each nudge.
        if (committed) apply();
      }
      if (frames > 240) return;                  // window for late shifts, then stop
      raf = requestAnimationFrame(tick);
    };
    // On a cross-screen switch, wait a beat for the new screen/view to mount and
    // settle BEFORE the first measurement, so we never read a mid-animation position.
    const beginDelay = sameCtx ? 0 : 300;
    startTimer = setTimeout(() => { if (!cancelled) raf = requestAnimationFrame(tick); }, beginDelay);
    window.addEventListener("resize", tick);
    return () => { cancelled = true; cancelAnimationFrame(raf); clearTimeout(lateTimer); clearTimeout(startTimer); window.removeEventListener("resize", tick); };
  }, [step]); // eslint-disable-line

  if (!stop) return null;
  const last = step >= STOPS.length - 1;
  const resetHero = () => { if (typeof window !== "undefined" && window.__bosHeroPage) window.__bosHeroPage(0); };
  const next = () => {
    if (last) {
      // This screen's spotlights are done → flow straight into the NEXT screen's
      // sheet + spotlights (one continuous guide), or finish if this was the last.
      resetHero();
      // The closing "Где узнать больше" card sends the user straight into the
      // «О приложении» page (and ends the guide for good) so they SEE where it lives.
      if (stop.openAbout) { if (onDismiss) onDismiss(); navigate("guide"); return; }
      if (onAdvance) onAdvance(tourScreen); else { endTour(); navigate(baseTab); }
    } else setStep(step + 1);
  };
  // Skipping ONCE dismisses the whole guide for the session — it never pops again.
  const skip = () => { resetHero(); if (onDismiss) onDismiss(baseTab); else { endTour(); navigate(baseTab); } };

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
        <div className="bos-tour-pop" style={{ width: "100%", maxWidth: 320, background: cardBg, borderRadius: 22, padding: "30px 24px 22px", textAlign: "center", boxShadow: "0 30px 70px rgba(0,0,0,0.45)", border: dark ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
          <div style={{ fontSize: 46, lineHeight: 1, marginBottom: 14 }}>{stop.emoji}</div>
          <div style={{ fontFamily: "var(--bos-title-font)", fontSize: 22, fontWeight: 700, letterSpacing: "-0.4px", color: titleC, lineHeight: 1.2 }}>{stop.title}</div>
          <div style={{ fontSize: 14.5, color: bodyC, lineHeight: 1.5, marginTop: 10 }}>{stop.body}</div>
          <button onClick={next} className="tap" style={{ width: "100%", marginTop: 22, background: "linear-gradient(135deg,#FEDE34,#EF9F14)", color: "#0a0a0a", border: 0, borderRadius: 999, padding: 15, fontSize: 15.5, fontWeight: 700 }}>{stop.cta}</button>
          {(!last || stop.alt) && <button onClick={skip} className="tap" style={{ width: "100%", marginTop: 8, background: "transparent", border: 0, color: ghostC, fontSize: 13, padding: 8 }}>{stop.alt || "Пропустить"}</button>}
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
            <button onClick={next} className="tap" style={{ background: dark ? "#fff" : "#0a0a0a", color: dark ? "#0a0a0a" : "#fff", border: 0, borderRadius: 999, padding: "10px 22px", fontSize: 14, fontWeight: 600 }}>{(last && lastScreen) ? (stop.cta || "Готово") : "Далее"}</button>
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
      {/* tap blocker — transparent while measuring (no black flash); the dim arrives
          WITH the cutout as one reveal. Flat dim only in the rare never-found fallback. */}
      <div style={{ position: "absolute", inset: 0, background: (!cutout && late) ? "rgba(4,6,12,0.62)" : "transparent" }} />
      {/* cutout: dims everything except the target via a huge ring-shadow */}
      {cutout && <div key={ctxKey} style={{ position: "absolute", left: cutout.left, top: cutout.top, width: cutout.width, height: cutout.height, borderRadius: stop.radius, boxShadow: "0 0 0 9999px rgba(4,6,12,0.66)", border: "1.5px solid rgba(254,222,52,0.85)", transition: "all 0.34s cubic-bezier(0.32,0.72,0,1)", animation: "bosTourCut 0.3s ease both", pointerEvents: "none" }} />}
      {/* tooltip card — only once THIS step's target is measured (or the fallback fires),
          so it lands at its final spot instead of parked at the old spot then jumping. */}
      {(revealed || late) && (
      <div key={step} className="bos-tour-pop" style={{ position: "absolute", left: 14, right: 14, top: cardTop, bottom: cardBottom, background: cardBg, borderRadius: 22, padding: "16px 18px 14px", boxShadow: "0 24px 60px rgba(0,0,0,0.45)", border: dark ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase", color: "#E0A500" }}>{stop.eyebrow}</div>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.3px", color: titleC, marginTop: 3 }}>{stop.title}</div>
        <div style={{ fontSize: 13.5, color: bodyC, lineHeight: 1.45, marginTop: 6 }}>{stop.body}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
          <button onClick={skip} className="tap" style={{ background: "transparent", border: 0, color: ghostC, fontSize: 13, padding: "10px 14px", margin: "-4px -8px" }}>Пропустить</button>
          <button onClick={next} className="tap" style={{ background: dark ? "#fff" : "#0a0a0a", color: dark ? "#0a0a0a" : "#fff", border: 0, borderRadius: 999, padding: "10px 22px", fontSize: 14, fontWeight: 600 }}>{(last && lastScreen) ? (stop.cta || "Готово") : "Далее"}</button>
        </div>
        {dots}
        {below
          ? <span aria-hidden style={{ position: "absolute", top: -7, left: caretLeft, width: 14, height: 14, background: cardBg, transform: "rotate(45deg)", borderRadius: 3, borderLeft: dark ? "1px solid rgba(255,255,255,0.08)" : "none", borderTop: dark ? "1px solid rgba(255,255,255,0.08)" : "none" }} />
          : <span aria-hidden style={{ position: "absolute", bottom: -7, left: caretLeft, width: 14, height: 14, background: cardBg, transform: "rotate(45deg)", borderRadius: 3, borderRight: dark ? "1px solid rgba(255,255,255,0.08)" : "none", borderBottom: dark ? "1px solid rgba(255,255,255,0.08)" : "none" }} />}
      </div>
      )}
      {tourStyle}
    </div>
  );
}

/* ── Fresh-user onboarding: gentle iOS bottom-sheets ───────────────────────────
   Replaces the old forced coach-mark tour. Three calm "what is this" sheets rise
   on the first home screen; then, when the user opens a tab THEMSELVES for the
   first time, a one-line intro sheet rises to orient them — never a forced march. */
const WELCOME_SHEETS = [
  { hero: "🚀", g: "rocket", eyebrow: "Добро пожаловать", title: "Это не трекер. Это платформа.",
    body: "Привычки, люди и рост — в одном месте. Маленькие шаги каждый день складываются в большое.",
    pills: [ { emoji: "⚡", g: "lightning", label: "Привычки" }, { emoji: "👥", g: "users", label: "Команды" }, { emoji: "🎓", g: "gradcap", label: "Тренинги" } ] },
  { hero: "🤗", g: "handheart", eyebrow: "Вместе", title: "Привычки — с близкими",
    body: "Делай привычки вдвоём, собирай команды, проходи тренинги с наставниками. Вместе — крепче.",
    pills: [ { emoji: "👥", g: "users", label: "Команды" }, { emoji: "🤝", g: "handshake", label: "Вдвоём" }, { emoji: "💬", g: "chat", label: "Чат" } ] },
  { hero: "🌱", g: "plant", eyebrow: "Твой темп", title: "Расти, как тебе удобно",
    body: "Выполняй привычки — уровень растёт, открываются люди и возможности. Гид «Что дальше?» ждёт внизу.",
    pills: [ { emoji: "🏆", g: "trophy", label: "Уровни" }, { emoji: "🧭", g: "compass", label: "Наставники" }, { emoji: "🎁", g: "gift", label: "Награды" } ] },
];

const TAB_INTROS = {
  habits: { hero: "🎯", g: "target", eyebrow: "Практика", title: "Тут ты всё создаёшь",
    body: "Привычки и цели живут здесь. Делай их один или вместе с близкими, держа общую серию.",
    pills: [ { emoji: "⚡", g: "lightning", label: "Привычки" }, { emoji: "🎯", g: "target", label: "Цели" }, { emoji: "👥", g: "users", label: "Вместе" } ] },
  community: { hero: "💛", g: "heart", eyebrow: "Сообщество", title: "Сердце приложения",
    body: "Слева — круги с близкими. Дальше — люди, партнёры и тренинги. Вместе держим ритм сильнее.",
    pills: [
      { emoji: "👥", g: "users", label: "Круги", view: { section: "discover", discTab: "teams" } },
      { emoji: "🧭", g: "compass", label: "Люди", view: { section: "community", commTab: "network" } },
      { emoji: "🎓", g: "gradcap", label: "Тренинги", view: { section: "community", commTab: "courses" } },
    ] },
  ai: { g: "sparkle", eyebrow: "Помощник", title: "ИИ всегда рядом",
    body: "Совет, разбор дня, план на завтра — Balance держит в уме твой контекст и подсказывает по делу.",
    pills: [ { emoji: "💡", g: "lightbulb", label: "Совет дня" }, { emoji: "📊", g: "chartbar", label: "Разбор" }, { emoji: "🗓️", g: "calendar", label: "План" } ] },
};

/* Demo intros — richer per-screen sheets shown when the demo user opens each tab.
   Same look as the fresh intros, but each (except AI) offers "Показать детально"
   → that screen's button-by-button spotlights (SCREEN_TOURS). */
const DEMO_INTROS = {
  home: { hero: "☀️", eyebrow: "Главная", title: "Твой экран дня", detail: true,
    body: "Состояние, баланс, серии и уровень — что важно, то наверху. Собери под себя.",
    pills: [ { emoji: "😌", label: "Состояние" }, { emoji: "🔥", label: "Серии" }, { emoji: "🏆", label: "Уровень" }, { emoji: "🤝", label: "Круг влияния" } ] },
  habits: { hero: "🎯", eyebrow: "Практика", title: "Тут ты всё создаёшь", detail: true,
    body: "Привычки и цели — одному или вместе. Шаблоны для быстрого старта.",
    pills: [ { emoji: "⚡", label: "Привычки" }, { emoji: "🎯", label: "Цели" }, { emoji: "👥", label: "Вместе" } ] },
  community: { hero: "💛", eyebrow: "Сообщество", title: "Сердце экосистемы", detail: true,
    body: "Слева команды с близкими, справа — нетворк, курсы и партнёры. Самая глубина здесь.",
    pills: [ { emoji: "👥", label: "Команды" }, { emoji: "🧭", label: "Нетворк" }, { emoji: "🎓", label: "Курсы" } ] },
  ai: { eyebrow: "Помощник", title: "ИИ всегда рядом", detail: true,
    body: "Совет, разбор дня, план на завтра — держит в уме твой контекст и подсказывает по делу.",
    pills: [ { emoji: "💡", label: "Совет" }, { emoji: "📊", label: "Разбор" }, { emoji: "🗓️", label: "План" } ] },
};

/* The same brand orb on every onboarding sheet — identical size, position and
   tint on every step, so it reads as ONE persistent orb while only the text
   changes (orb-continuity). Pills below carry the per-screen meaning via colourful
   iOS emoji. (Richer bespoke imagery is a later design pass, together with David.) */
function OnbHero({ emoji, glyph, dark }) {
  // A bright, topical emoji per sheet (replacing the brand orb) — it floats in the
  // SAME soft glow the orb sat in, so the hero still reads as one designed object,
  // just expressive of what THIS screen is about. Falls back to the orb if a sheet
  // doesn't name an emoji.
  if (!emoji && !glyph) {
    return (
      <div style={{ height: 92, display: "grid", placeItems: "center", margin: "0 auto" }}>
        <StaticOrb size={88} tint={tintFromMood("#5FA8FF")} seed={2.0} intensity={0.5} />
      </div>
    );
  }
  return (
    <div style={{ height: 92, display: "grid", placeItems: "center", margin: "0 auto" }}>
      {glyph && typeof BosGlyph !== "undefined"
        ? <BosGlyph key={glyph} id={glyph} size={62} color={dark ? "#fff" : "#0a0a0a"} className="onb-emoji" />
        : <span key={emoji} className="onb-emoji" style={{ fontSize: 64, lineHeight: 1 }}>{emoji}</span>}
    </div>
  );
}

/* Presentational content for one onboarding bottom-sheet. Fixed minHeight + a
   top-anchored hero + reserved body height → every sheet is the SAME size, so
   nothing jumps between steps. `pills` (always shown) surface the key things on
   the screen; a pill with onClick jumps there. */
function OnbSheet({ hero, heroGlyph, eyebrow, title, body, pills, cta, onCta, onSkip, skipLabel = "Я разберусь сам", total, index, dark }) {
  const titleC = dark ? "#fff" : "#0a0a0a";
  const bodyC = dark ? "rgba(255,255,255,0.62)" : "rgba(0,0,0,0.56)";
  const ghostC = dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.38)";
  const pillBg = dark ? "rgba(255,255,255,0.08)" : "#f0f1f4";
  return (
    <div style={{ padding: "4px 22px 8px", textAlign: "center", minHeight: 454, display: "flex", flexDirection: "column" }}>
      <div style={{ marginTop: 4, marginBottom: 14 }}>
        <OnbHero emoji={hero} glyph={heroGlyph} dark={dark} />
      </div>
      {eyebrow && <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase", color: "#E0A500" }}>{eyebrow}</div>}
      {/* Title + body heights are RESERVED (2 lines / 3 lines) so a 1-line title or
         a shorter body never changes the sheet's overall height — every step is the
         same size, the hero never jumps. */}
      <div style={{ minHeight: 60, marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "var(--bos-title-font)", fontSize: 25, fontWeight: 700, letterSpacing: "-0.5px", color: titleC, lineHeight: 1.18 }}>{title}</div>
      </div>
      <div style={{ fontSize: 15.5, color: bodyC, lineHeight: 1.5, marginTop: 9, maxWidth: 330, marginLeft: "auto", marginRight: "auto", minHeight: 70 }}>{body}</div>
      {pills && pills.length > 0 && (
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 16 }}>
          {pills.map((p, i) => {
            const st = { background: pillBg, border: 0, borderRadius: 999, padding: "8px 13px 8px 11px", fontSize: 13.5, fontWeight: 600, color: titleC, display: "inline-flex", alignItems: "center", gap: 6 };
            const inner = <>{p.g && typeof BosGlyph !== "undefined"
              ? <BosGlyph id={p.g} size={15} color={titleC} />
              : <span style={{ fontSize: 14.5, lineHeight: 1 }}>{p.emoji}</span>} {p.label}</>;
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
        <OnbSheet hero={ws.hero} heroGlyph={ws.g} eyebrow={ws.eyebrow} title={ws.title} body={ws.body} pills={ws.pills} dark={dark}
          total={WELCOME_SHEETS.length} index={wStep}
          cta={lastW ? "Начать" : "Дальше"}
          onCta={() => { if (lastW) closeWelcome(); else setWStep(wStep + 1); }}
          onSkip={lastW ? null : closeWelcome} />
      </BottomSheet>
      <BottomSheet open={!!tab} onClose={() => app.finishGuide()} dark={dark}>
        {tabView && <OnbSheet hero={tabView.hero} heroGlyph={tabView.g} eyebrow={tabView.eyebrow} title={tabView.title} body={tabView.body} dark={dark}
          cta={tabView.detail ? "Показать детально" : "Понятно"}
          onCta={tabView.detail ? () => { app.startScreenTour(tabKey); closeTab(); } : () => app.finishGuide()}
          onSkip={tabView.detail ? () => app.finishGuide() : undefined}
          skipLabel="Сам разберусь"
          pills={tabView.pills && tabView.pills.map(p => ({ emoji: p.emoji, g: p.g, label: p.label, onClick: p.view ? () => { app.setCommunityView(p.view); app.finishGuide(); } : undefined }))} />}
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
    { e: "🧭", t: "Нетворк и наставники", b: "С ростом уровня открывается круг людей: наставники, услуги, помощь. XP за привычки тратишь на них." },
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
          <div key={i} style={{ background: "var(--card)", borderRadius: 22, padding: 16, boxShadow: "var(--card-shadow)", display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: "var(--surface-3)", display: "grid", placeItems: "center", fontSize: 24, flexShrink: 0 }}>{f.e}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16.5, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.2px" }}>{f.t}</div>
              <div style={{ fontSize: 13.5, color: "var(--text-3)", marginTop: 4, lineHeight: 1.5 }}>{f.b}</div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => navigate("manifest")} className="tap"
        style={{ width: "100%", marginTop: 16, background: "#0a0a0a", color: "#fff", border: 0, borderRadius: 22, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, textAlign: "left" }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(255,255,255,0.1)", display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0 }}>📜</div>
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
  // frame.id → scrollTop of that screen. Saved when a screen is buried (navigate away)
  // and restored when its frame re-surfaces to the top (back / swipe) → you land at the
  // SAME place you left, not scrolled to the top. New screens have no entry → start at top.
  const scrollPos = useRef({});
  const EDGE_ZONE = 32;  // px from the left edge that arms the gesture (roomier = easier to start)
  const DRAG_THRESH = 7; // px of travel before we lock to a horizontal drag

  // App-wide bottom sheet (share, etc.), opened from any screen via useSheet().
  const [sheet, setSheet] = useState(null);
  const sheetApi = React.useMemo(() => ({
    open: (node) => setSheet(node),
    close: () => setSheet(null),
  }), []);

  // «Эффект стекла» (David): bos:glass="0" → body.bos-noglass, CSS глушит все
  // backdrop-размытия (экономия GPU на слабых телефонах). Дефолт — ВКЛ.
  useEffect(() => {
    const apply = () => { try { document.body.classList.toggle("bos-noglass", localStorage.getItem("bos:glass") === "0"); } catch (e) {} };
    apply();
    window.addEventListener("bos:glassChanged", apply);
    return () => window.removeEventListener("bos:glassChanged", apply);
  }, []);

  // (Тумблер «Чёрные иконки» убран по просьбе David — механизм bos:monoIcons больше не применяется.)

  // ── LIVE-вкладки (слияние Главной и «Привычек») ─────────────────────────────
  // Тумблер «Вкладка „Я“ внизу» живёт в настройках (bos:profileTab, дефолт ВКЛ).
  const [profTabPref, setProfTabPref] = useState(() => {
    try { return localStorage.getItem("bos:profileTab") !== "0"; } catch (e) { return true; }
  });
  useEffect(() => {
    const f = () => { try { setProfTabPref(localStorage.getItem("bos:profileTab") !== "0"); } catch (e) {} };
    window.addEventListener("bos:profileTabChanged", f);
    return () => window.removeEventListener("bos:profileTabChanged", f);
  }, []);
  const isLive = app.mode === "live";
  // Защита от запертой двери: сводка дня (hero с аватаром) — единственный второй путь в «Я».
  // Если её убрали с доски, вкладка «Я» показывается принудительно, что бы ни стояло в тумблере.
  const heroHidden = !!(app.homeLayout && Array.isArray(app.homeLayout.order) && app.homeLayout.order.indexOf("w:hero") < 0);
  const liveTabs = React.useMemo(
    () => (profTabPref || heroHidden) ? LIVE_TABS_BASE.concat([LIVE_TAB_PROFILE]) : LIVE_TABS_BASE,
    [profTabPref, heroHidden]
  );
  const tabSet = isLive ? LIVE_TAB_ROUTES : TAB_ROUTES;
  // navigate — стабильный useCallback, поэтому актуальный режим/набор вкладок читаем через ref.
  const tabSetRef = useRef(tabSet); tabSetRef.current = tabSet;
  const isLiveRef = useRef(isLive); isLiveRef.current = isLive;

  useEffect(() => {
    applyTweaks(TWEAK_DEFAULTS);
    const reveal = () => document.body.classList.add("app-ready");
    // Real-app auto-login (this bot). Inside Telegram, a RETURNING user (we already hold a saved
    // profile for their tg id) skips the intro and lands straight on home. A FIRST-TIME user
    // falls through to the intro — so onboarding shows exactly ONCE, then auto-login forever after.
    // The DEMO bot (?demo=1) and a plain browser (no Telegram → for our own testing) always get
    // the normal intro flow. telegram.js is deferred, so window.__TG can arrive a beat after mount.
    if (AUTO_RESUME_TG && !bosIsDemoBot()) {
      let tries = 0, raf = 0, settled = false;
      const decide = () => {
        if (settled) return;
        let tg = null; try { tg = window.__TG; } catch (e) {}
        const user = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;
        if (user) {
          settled = true;
          // Returning only: a stored snapshot for this tg id means onboarding already happened.
          let returning = false;
          try { returning = !!(window.bosStore && window.bosStore.has("tg:" + user.id)); } catch (e) {}
          if (returning) { try { app.enterLive(); setFrames([{ route: "home", params: {}, id: idRef.current++ }]); } catch (e) {} }
          reveal(); return; // first-timer → intro stays on screen (shown once)
        }
        if (tg === null || tries > 30) { settled = true; reveal(); return; }
        tries++; raf = requestAnimationFrame(decide);
      };
      decide();
      return () => { settled = true; if (raf) cancelAnimationFrame(raf); };
    }
    const id = requestAnimationFrame(reveal);
    return () => cancelAnimationFrame(id);
  }, []);

  const navigate = useCallback((next, np = {}, opts = {}) => {
    // Save the scroll position of the screen we're leaving (the current top layer),
    // keyed by its frame id, so a later back/swipe to it lands where we left off.
    try {
      const _els = stackRef.current ? stackRef.current.querySelectorAll(".bos-page") : null;
      const _el = _els && _els[_els.length - 1];
      if (_el && _el.dataset.fid != null) scrollPos.current[_el.dataset.fid] = _el.scrollTop;
    } catch (e) {}
    // Live: страница «Привычки» слита с главной — любая старая дорожка ведёт на доску.
    if (next === "habits" && isLiveRef.current) next = "home";
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
      } else if (tabSetRef.current.has(next) && !(next === "profile" && np && np.from)) {
        // Вкладка → корень (стек заменяется). ИСКЛЮЧЕНИЕ (David: «свайп назад с „Я“ исчез»):
        // «Я» с параметром from (тап по аватарке и другие внутренние входы) — обычный PUSH
        // поверх текущего экрана, свайп/назад возвращают на главную. Тап по ВКЛАДКЕ «Я»
        // идёт без from → корень, как у остальных вкладок.
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

  // Restore a screen's saved scroll when its frame re-surfaces to the top (back / swipe).
  // A freshly pushed screen has no saved entry → it stays at the top, as expected.
  useEffect(() => {
    const id = top.id;
    if (scrollPos.current[id] == null) return;
    const y = scrollPos.current[id];
    const apply = () => { try { const el = stackRef.current && stackRef.current.querySelector('.bos-page[data-fid="' + id + '"]'); if (el) el.scrollTop = y; } catch (e) {} };
    const r1 = requestAnimationFrame(() => { apply(); requestAnimationFrame(apply); });
    const t = window.setTimeout(apply, 90); // catch screens whose content grows a beat after mount
    return () => { cancelAnimationFrame(r1); window.clearTimeout(t); };
  }, [top.id]);

  const themeFor = (route) =>
    app.themeOverride === "dark" ? true
      : app.themeOverride === "light" ? false
        : DARK_ROUTES.has(route);

  const topDark = themeFor(top.route);
  const topInTabs = tabSet.has(top.route);

  // Keep the iOS status-bar tint + the root background in sync with the screen,
  // so the home-indicator safe area never shows a stray black bar.
  useEffect(() => {
    const bg = topDark ? (ROOT_BG_DARK[top.route] || "#0a0a0a") : (ROOT_BG[top.route] || "#f1f1f1");
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
    // Only the demo's HOME sheet auto-rises — the single door into the guided tour,
    // which then drives ITSELF across the other screens. Nothing pops up on a manual
    // tab switch anymore (the annoying part), and once the guide is done/dismissed it
    // never shows again. Fresh users get the gentle welcome sheets and explore freely.
    if (top.route === "home" && app.mode === "demo" && !app.onbWelcome && !app.guideDone && app.tourStep < 0) {
      app.showTabIntro("home");
    }
  }, [top.route, app.mode, app.onbWelcome, app.tourStep, app.guideDone]); // eslint-disable-line

  // Guided tour chaining (demo): a screen's spotlights finish → advance to the NEXT
  // screen (navigate + raise its sheet); the last screen → finish. One continuous
  // flow the user takes once — or skips once, which dismisses the whole thing.
  const advanceGuide = (fromKey) => {
    const order = ["home", "habits", "community", "ai"];
    const nxt = order[order.indexOf(fromKey) + 1];
    app.endTour();
    if (nxt) { navigate(nxt, {}, { instant: true }); app.setOnbTab(nxt); }
    else { app.finishGuide(); navigate("home"); }
  };
  const dismissGuide = (toTab) => { app.finishGuide(); if (toTab) navigate(toTab, {}, { instant: true }); };

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
    const inTabs = tabSet.has(frame.route);
    const full = FULLBLEED_ROUTES.has(frame.route);
    const Comp = resolveScreen(frame.route, app.mode);
    const cls =
      "bos-page " + (dark ? "theme-dark" : "theme-light") +
      (inTabs ? "" : " no-tabbar") + (full ? " full-bleed" : "") +
      (animClass ? " " + animClass : "");
    return (
      <div key={frame.id} data-fid={frame.id} className={cls} onAnimationEnd={onEnd}>
        <NavCtx.Provider value={{ route: frame.route, params: frame.params, navigate }}>
          <BosErrorBoundary>
            <Comp />
          </BosErrorBoundary>
        </NavCtx.Provider>
      </div>
    );
  };

  const renderDragLayer = (frame, style, dimStyle) => {
    const dark = themeFor(frame.route);
    const inTabs = tabSet.has(frame.route);
    const full = FULLBLEED_ROUTES.has(frame.route);
    const Comp = resolveScreen(frame.route, app.mode);
    const cls =
      "bos-page " + (dark ? "theme-dark" : "theme-light") +
      (inTabs ? "" : " no-tabbar") + (full ? " full-bleed" : "");
    return (
      <div key={frame.id} data-fid={frame.id} className={cls} style={style}>
        <NavCtx.Provider value={{ route: frame.route, params: frame.params, navigate }}>
          <BosErrorBoundary>
            <Comp />
          </BosErrorBoundary>
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
  const destTab = drag && prevFrame && tabSet.has(prevFrame.route) ? prevFrame.route : null;

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
          <TabBar key="tabbar" active={top.route} dark={topDark} onTab={(id) => navigate(id)} tabs={isLive ? liveTabs : undefined} />
        )}
        {destTab && (
          <TabBar key="tabbar-drag" active={destTab} dark={themeFor(destTab)}
            onTab={(id) => navigate(id)} style={{ opacity: p, transition: dragTrans }} tabs={isLive ? liveTabs : undefined} />
        )}
        <div className="bos-version">{app.mode === "live" ? APP_VERSION : DEMO_VERSION}</div>
        <BottomSheet open={!!sheet} onClose={sheetApi.close} dark={topDark}>{sheet}</BottomSheet>
        <FreshOnboarding app={app} dark={topDark} />
        <GuidedTour step={app.tourStep} setStep={app.setTourStep} endTour={app.endTour} navigate={navigate} setCommunityView={app.setCommunityView} openSheet={sheetApi.open} tourScreen={app.tourScreen} dark={topDark} onAdvance={advanceGuide} onDismiss={dismissGuide} lastScreen={app.tourScreen === "ai"} />
        {/* «Швейцар» приветственных поп-апов (David: «не больше одного за раз, остальные в
            очередь»): пока идёт онбординг или открыта обычная шторка — ничего не всплывает
            (pending-состояния просто ЖДУТ, они не сбрасываются); потом приглашение; ачивка —
            последней. Каждый следующий монтируется только после закрытия предыдущего. */}
        {!app.onbWelcome && !sheet && app.pendingJoinWelcome && typeof JoinWelcomeLive === "function" && <JoinWelcomeLive info={app.pendingJoinWelcome} onClose={app.clearPendingJoinWelcome} />}
        {!app.onbWelcome && !sheet && !app.pendingJoinWelcome && app.pendingDayClose && typeof DayCloseSheetLive === "function" && <DayCloseSheetLive info={app.pendingDayClose} onClose={app.clearPendingDayClose} navigate={navigate} />}
        {!app.onbWelcome && !sheet && !app.pendingJoinWelcome && !app.pendingDayClose && app.pendingLevelUp && typeof LevelUpSheetLive === "function" && <LevelUpSheetLive info={app.pendingLevelUp} onClose={app.clearPendingLevelUp} />}
        {/* Залёты круга: предупреждение «2 из 3» или прощание «круг отпустил» — после уровня, до ачивки. */}
        {!app.onbWelcome && !sheet && !app.pendingJoinWelcome && !app.pendingDayClose && !app.pendingLevelUp && app.pendingCircleStrike && typeof CircleStrikeSheetLive === "function" && <CircleStrikeSheetLive info={app.pendingCircleStrike} onClose={app.clearPendingCircleStrike} navigate={navigate} />}
        {!app.onbWelcome && !sheet && !app.pendingJoinWelcome && !app.pendingDayClose && !app.pendingLevelUp && !app.pendingCircleStrike && app.pendingAch && typeof AchievementSheetLive === "function" && <AchievementSheetLive ach={app.pendingAch} onClose={app.clearPendingAch} />}
      </div>
    </div>
    </SheetCtx.Provider>
  );
}

/* Circuit breaker. One screen throwing during render (a malformed cloud row, an
   unexpected null, a future code path nobody anticipated) used to white-screen the
   WHOLE app with no way back — undebuggable remotely. This catches it and shows a
   calm recovery card instead. Wrapped per-screen (chrome survives, just that screen
   shows the card) AND once around the whole app (last resort). */
class BosErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err, info) { try { console.error("BalanceOS screen crash:", err, info); } catch (e) {} }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "32px", background: "#fafafa", color: "#1c1c1e", zIndex: 9 }}>
        <div style={{ fontSize: "44px", marginBottom: "14px" }}>🌫️</div>
        <div style={{ fontSize: "19px", fontWeight: 650, letterSpacing: "-0.02em", marginBottom: "8px" }}>Что-то сбилось</div>
        <div style={{ fontSize: "15px", lineHeight: 1.5, color: "#8a8a8e", maxWidth: "260px", marginBottom: "24px" }}>Твои данные на месте. Обновим экран — и продолжим.</div>
        <button onClick={() => { try { window.location.reload(); } catch (e) {} }}
          style={{ border: "none", borderRadius: "14px", padding: "13px 30px", fontSize: "16px", fontWeight: 600, color: "#fff", background: "linear-gradient(180deg,#2c2c2e,#1c1c1e)", boxShadow: "0 6px 18px rgba(0,0,0,0.18)", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
          Обновить
        </button>
      </div>
    );
  }
}

function Root() {
  return (
    <AppProvider>
      <BosErrorBoundary>
        <PhoneApp />
      </BosErrorBoundary>
    </AppProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);

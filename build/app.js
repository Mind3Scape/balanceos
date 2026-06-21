/* ──────────────────────────────────────────────────────────────────────────
   BalanceOS — single full-screen phone (iPhone PWA build)

   The original "BalanceOS App.html" was a *design canvas*: ~30 phone mockups
   laid out in scrollable strips. This entry instead renders ONE phone, scaled
   to fill the real device viewport, with the full navigation graph + native
   iOS-style push / pop / fade transitions. All screen + component code is
   reused verbatim from the design bundle.
   ────────────────────────────────────────────────────────────────────────── */
var {
  useState,
  useRef,
  useEffect,
  useCallback
} = React;

/* Route maps — copied verbatim from the design canvas so behaviour matches. */
// Cinematic / immersive screens stay dark always. The settings/profile/levels/
// achievements cluster now FOLLOWS the app theme (light in light, dark in dark).
// Onboarding/intro/signup now FOLLOW the app theme (light by default, dark when
// the user forces dark) — each already ships both palettes. Only the cinematic
// in-app immersive screens stay always-dark.
var DARK_ROUTES = new Set(["mood", "focus", "level-up", "ai-chat"]);
var TAB_ROUTES = new Set(["home", "habits", "community", "ai"]);
var FULLBLEED_ROUTES = new Set(["intro", "onboarding", "signup"]);

// Root (html/body) background per screen — matches each screen's own base
// colour so the home-indicator safe area is never a mismatched dark bar
// (belt-and-suspenders alongside the full-height, no-fixed layout).
var ROOT_BG = {
  mood: "#050505",
  focus: "#05060a",
  "level-up": "#0a0a0a",
  "ai-chat": "#0a0a0a"
};
var SCREENS = {
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
  signup: () => SignUpScreen
};

/* Design tokens (from the canvas "Tweaks" defaults). Applied once so screens
   read the intended accent / radius / sphere-glow / check colour. */
var TWEAK_DEFAULTS = {
  accent: "#FEDE34",
  palette: ["#FEDE34", "#0a0a0a", "#f1f1f1"],
  canvas: "#ffffff",
  radius: 27,
  titleFont: "sans",
  density: "regular",
  showAvatars: true,
  sphereGlow: 100,
  checkColor: "#232323"
};
var FONT_STACKS = {
  serif: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
  sans: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif",
  mono: "'SF Mono', Menlo, monospace"
};
var DENSITY_PAD = {
  compact: "10px 14px",
  regular: "14px 16px",
  comfy: "18px 20px"
};
function applyTweaks(t) {
  var r = document.documentElement;
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
var START_ROUTE = "intro"; // cinematic onboarding is the best "hand it to a friend" opener

// True when launched from the iOS home screen (installed PWA). There we let the
// REAL system status bar show; in a browser tab we draw our own so the mockup
// still looks complete.
var IS_STANDALONE = typeof window !== "undefined" && (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true);

// Build tag — shown as a faint watermark bottom-right + logged to console.
var APP_VERSION = "v91";
try {
  console.log("BalanceOS build", APP_VERSION);
} catch (e) {}

/* Animation class names per navigation direction. */
var ANIM = {
  push: {
    out: "anim-push-out",
    in: "anim-push-in"
  },
  pop: {
    out: "anim-pop-out",
    in: "anim-pop-in"
  },
  fade: {
    out: "anim-fade-out",
    in: "anim-fade-in"
  }
};

/* ── Guided tour (coach marks) — runs once on entering the demo ────────────────
   Hybrid form: a welcome card framing the ecosystem, then a moving spotlight that
   lights each REAL tab in turn (the tour drives the tab bar), then a closing card.
   Skippable at every step. Mounted in the phone shell so it survives tab fades. */
var TOUR_STOPS = [{
  kind: "card",
  emoji: "✨",
  title: "Это не просто трекер привычек",
  body: "BalanceOS — платформа: привычки, команды, наставники, курсы и ИИ. Уровень растёт — и открывается всё больше. Покажу за минуту.",
  cta: "Показать"
}, {
  kind: "spot",
  tab: "home",
  sel: '.bos-tabbar button:nth-of-type(1)',
  radius: 16,
  eyebrow: "Главная",
  title: "Твой экран дня",
  body: "Виджеты состояния, баланса и серий. Соберёшь под себя — что важно, то и наверху."
}, {
  kind: "spot",
  tab: "home",
  sel: '[data-tour="aihints"]',
  radius: 22,
  eyebrow: "Подсказки ИИ",
  title: "Совет под твой день",
  body: "Подсказки наверху — от ИИ. Чем больше контекста о себе ты заполняешь, тем точнее и полезнее они становятся."
}, {
  kind: "spot",
  tab: "home",
  sel: '[data-tour="state"]',
  radius: 20,
  eyebrow: "Состояние",
  title: "Отметь, как ты сейчас",
  body: "Раз в день отмечай своё состояние — и приложение подстроится под тебя: цвет, тон, акценты дня."
}, {
  kind: "spot",
  tab: "home",
  sel: '[data-tour="level"]',
  radius: 18,
  eyebrow: "Геймификация",
  title: "Уровень растёт с первого дня",
  body: "Каждая отметка с самого начала качает опыт и уровень. Загляни — покажу, как это устроено."
}, {
  kind: "peek",
  tab: "levels",
  eyebrow: "Геймификация",
  title: "Опыт, ачивки, награды",
  body: "Вот сердце прогресса: сверху — за что капает XP, ниже — ачивки (открывают новые круги людей) и награды за XP. Растёшь — открывается больше."
}, {
  kind: "peek",
  tab: "achievements",
  eyebrow: "Ачивки вживую",
  title: "Каждая открывает свой круг",
  body: "Вот они: «Перегрузка» открыла наставников по фокусу, «Капитан команды» — лидеров. Каждая ачивка — ключ к новым людям и +уровень доступа."
}, {
  kind: "spot",
  tab: "habits",
  sel: '.bos-tabbar button:nth-of-type(2)',
  radius: 16,
  eyebrow: "Привычки и цели",
  title: "Тут ты всё создаёшь",
  body: "Твоя личная система. Привычки и цели живут здесь."
}, {
  kind: "spot",
  tab: "habits",
  sel: '[data-tour="presets"]',
  radius: 16,
  eyebrow: "Шаблоны",
  title: "Листай готовые привычки",
  body: "Сверху — карусель пресетов: листай её вбок и тапни любую, чтобы добавить привычку за секунду."
}, {
  kind: "spot",
  tab: "habits",
  sel: '[data-tour="add"]',
  radius: 999,
  eyebrow: "Создать",
  title: "Жми «плюс»",
  body: "Или собери свою с нуля. Любую привычку можно делать одному — или вместе с друзьями, поддерживая серии."
}, {
  kind: "spot",
  tab: "community",
  sel: '.bos-tabbar button:nth-of-type(3)',
  radius: 16,
  eyebrow: "Сообщество",
  title: "Здесь живёт экосистема",
  body: "Команды, курсы и наставники. Привычки вместе держат сильнее."
}, {
  kind: "spot",
  tab: "community",
  view: {
    section: "discover",
    discTab: "teams"
  },
  sel: '[data-tour="make-team"]',
  radius: 18,
  eyebrow: "Команды",
  title: "Создавай свои команды",
  body: "Объедини семью, друзей или клиентов тренинга. У каждой — общая цель, чат и статистика. Заглянем, как собрать."
}, {
  kind: "spot",
  tab: "team-create",
  sel: '[data-tour="team-modes"]',
  radius: 18,
  eyebrow: "Режимы команды",
  title: "Как двигать общую цель",
  body: "Общий счёт, серия у каждого или гонка — выбираешь формат. А двигают цель привычки самих участников."
}, {
  kind: "spot",
  tab: "team-create",
  sel: '[data-tour="team-stakes"]',
  radius: 18,
  eyebrow: "Геймификация",
  title: "Ставка на опыт",
  body: "Все скидывают XP в общий банк. Дошли до цели — он возвращается ×2. Не дошли — сгорает. Вот это азарт."
}, {
  kind: "spot",
  tab: "team-detail",
  sel: '[data-tour="team-chat"]',
  radius: 18,
  eyebrow: "Внутри команды",
  title: "Статистика и чат",
  body: "Лидерборд по вкладу, прогресс, живые цифры — тренеру видно каждого. А вот и общий чат ↓"
}, {
  kind: "peek",
  tab: "team-chat",
  eyebrow: "Чат команды",
  title: "Команда на связи",
  body: "Заглянем внутрь: переписка, фото, взаимная поддержка — так команда держит общий ритм вместе."
}, {
  kind: "spot",
  tab: "community",
  view: {
    section: "discover",
    discTab: "network"
  },
  sel: '[data-tour="impact"]',
  radius: 20,
  eyebrow: "Нетворк · твой вклад",
  title: "Стань тем, к кому идут",
  body: "С ростом уровня ты сам помогаешь кругу — ведёшь, консультируешь, делишься тем, что умеешь. Каждое доброе дело растит твой вклад и репутацию."
}, {
  kind: "spot",
  tab: "community",
  view: {
    section: "discover",
    discTab: "network"
  },
  sel: '[data-tour="contacts"]',
  radius: 20,
  eyebrow: "Нетворк · контакты",
  title: "Заказывай помощь других",
  body: "А XP за привычки трать на людей вокруг: запишись к человеку, попади в его карточку, закажи услугу наставника. Так растёте вместе."
}, {
  kind: "spot",
  tab: "community",
  view: {
    section: "community",
    commTab: "courses"
  },
  sel: '[data-tour="course"]',
  radius: 20,
  eyebrow: "Курсы",
  title: "Ускорители роста",
  body: "Курсы и интенсивы поднимают уровень и открывают новые круги контактов — как ключи: прошёл курс → получил ачивку → доступ к людям выше."
}, {
  kind: "spot",
  tab: "ai",
  sel: '.bos-tabbar button:nth-of-type(4)',
  radius: 16,
  eyebrow: "Помощник",
  title: "ИИ всегда под рукой",
  body: "Совет, разбор дня, план на завтра. Он держит в уме твой контекст."
}, {
  kind: "card",
  emoji: "🌟",
  title: "Готово — это твоё пространство",
  body: "Отмечай состояние, расти в уровне, открывай людей. Чем дальше — тем больше возможностей. Поехали.",
  cta: "Начать"
}];

/* Per-screen slices of the tour, launched from a demo intro sheet's "Показать
   детально". The welcome/closing cards and the redundant "this is the X tab"
   spots are skipped — the sheet already introduces the screen. */
// Extra stops layered onto the sliced base tour.
var HOME_SHARE_STOP = {
  kind: "spot",
  tab: "home",
  sel: '[data-tour="share-app"]',
  radius: 20,
  eyebrow: "Качай уровень",
  title: "Начни с простого — поделись",
  body: "Хочешь быстро поднять уровень? Поделись приложением: +150 XP за каждого друга — и выше множитель на весь твой XP. Покажу, как это выглядит ↓",
  cta: "Показать «Поделиться»",
  openShare: true
};
// Dive into a SHARED habit so the demo shows the «кто с тобой» competition.
var HABIT_PEEK_STOP = {
  kind: "peek",
  tab: "habit-detail",
  params: {
    habit: {
      id: 1,
      emoji: "🙏",
      name: "Помогать другим",
      streak: 12,
      friends: [{
        name: "Анна",
        initials: "А",
        color: "#e8c8a8"
      }, {
        name: "Марк",
        initials: "М",
        color: "#a8b9d4"
      }]
    },
    from: "habits"
  },
  eyebrow: "Внутри привычки",
  title: "Кто с тобой — соревнование",
  body: "Заходишь в привычку — видишь, кто её делает с тобой, серии у каждого и кто лидирует. Азарт держит ритм."
};
// The natural referral: while CREATING a habit you can invite any friend → +XP.
var HABIT_INVITE_STOP = {
  kind: "spot",
  tab: "habit-settings",
  params: {
    mode: "create"
  },
  sel: '[data-tour="invite-friend"]',
  radius: 18,
  eyebrow: "Вместе с другом",
  title: "Создавая — позови друга",
  body: "Любую привычку можно делать вдвоём. Друг присоединился → +75 XP тебе, и он уже в приложении. Так растёшь ты — и твой круг."
};
// The heart of the economy — a small focus on the influence MULTIPLIER.
var INFLUENCE_MULT_STOP = {
  kind: "spot",
  tab: "levels",
  sel: '[data-tour="influence-mult"]',
  radius: 18,
  eyebrow: "Множитель влияния",
  title: "Вовлекаешь — растёшь быстрее всех",
  body: "Вот главный секрет: чем больше друзей в деле, тем выше множитель на ВЕСЬ твой XP — растёт с кругом до ×1.25 (дальше потолок, чтобы игра была честной). Привёл людей — растёшь быстрее одиночки даже на тех же привычках."
};

// The balance wheel lives on home hero page 2 — the demo flips the deck to it and
// makes clear the AI sorts every habit into the right life-sphere automatically.
var BALANCE_WHEEL_STOP = {
  kind: "spot",
  tab: "home",
  heroPage: 1,
  sel: '[data-tour="balance-wheel"]',
  radius: 14,
  eyebrow: "Колесо баланса",
  title: "ИИ раскладывает жизнь по сферам",
  body: "Это твоё колесо баланса: тело, разум, карьера, отношения, отдых. ИИ сам относит каждую привычку к нужной сфере и следит, где густо, а где проседает — оранжевое значит, что эта часть жизни просит внимания."
};
var SCREEN_TOURS = {
  home: [BALANCE_WHEEL_STOP, ...TOUR_STOPS.slice(2, 6), INFLUENCE_MULT_STOP, TOUR_STOPS[6], HOME_SHARE_STOP],
  // wheel, aihints, state, level, levels-peek, MULTIPLIER, ach-peek, share
  habits: [...TOUR_STOPS.slice(8, 10), HABIT_INVITE_STOP, HABIT_PEEK_STOP],
  // presets, add, invite-while-creating, leaderboard peek
  community: TOUR_STOPS.slice(11, 19),
  // make-team … course (teams, chat, network, courses)
  ai: [{
    kind: "spot",
    tab: "ai",
    sel: '[data-tour="ai-hero"]',
    radius: 24,
    eyebrow: "Чтение дня",
    title: "Главный инсайт дня",
    body: "Каждый день ИИ читает твои отметки и состояние — и выдаёт главное: что заметил и что сделать. Жми «Почему?» — покажет логику."
  }, {
    kind: "spot",
    tab: "ai",
    sel: '[data-tour="ai-insights"]',
    radius: 18,
    eyebrow: "Подсказки",
    title: "Рекомендации под тебя",
    body: "Ежедневные советы: перенести привычку, опереться на друга, перезагрузиться. Тапни любую — раскроется и можно принять."
  }, {
    kind: "spot",
    tab: "ai",
    sel: '[data-tour="ai-chat-btn"]',
    radius: 999,
    eyebrow: "Чат",
    title: "Спроси что угодно",
    body: "А тут — живой чат. Спланировать день, разобрать неделю, спросить совет: ИИ держит в уме весь твой контекст."
  }]
};

/* GuidedTour renders ONE screen's stops (SCREEN_TOURS[tourScreen]); the demo
   greets each screen with a sheet, and "Показать детально" launches these. On
   finish it returns to that screen's base tab, leaving the user free to explore. */
function GuidedTour({
  step,
  setStep,
  endTour,
  navigate,
  setCommunityView,
  openSheet,
  tourScreen,
  dark
}) {
  var STOPS = SCREEN_TOURS[tourScreen] || [];
  var baseTab = TAB_ROUTES.has(tourScreen) ? tourScreen : "home";
  var rootRef = useRef(null);
  var [spot, setSpot] = useState(null); // {cx, cy, top, w, shellH}
  var prevCtxRef = useRef(null); // last stop's tab|view — detect page switches
  var stop = step >= 0 && step < STOPS.length ? STOPS[step] : null;
  var ctxKey = stop ? stop.tab + "|" + (stop.view ? stop.view.discTab || stop.view.commTab || stop.view.section || "" : "") : "";

  // Drive the tab bar so each "tab" stop shows the real section behind the dim.
  useEffect(() => {
    if (stop && (stop.kind === "spot" || stop.kind === "peek")) {
      navigate(stop.tab, stop.params || {}, {
        instant: true
      }); // instant: no fade/slide under the dim
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
    if (!stop || stop.kind !== "spot") {
      setSpot(null);
      return undefined;
    }
    var sameCtx = prevCtxRef.current === ctxKey;
    prevCtxRef.current = ctxKey;
    if (!sameCtx) setSpot(null); // drop the stale highlight during the page switch

    var raf,
      cancelled = false,
      frames = 0,
      stable = 0,
      lastKey = "",
      lastSet = "",
      committed = false;
    var tick = () => {
      if (cancelled) return;
      frames++;
      var shell = rootRef.current && rootRef.current.parentElement;
      var el = shell && shell.querySelector(stop.sel);
      if (el) {
        try {
          el.scrollIntoView({
            block: "center",
            inline: "nearest"
          });
        } catch (_) {}
        var s = shell.getBoundingClientRect(),
          b = el.getBoundingClientRect();
        var m = {
          x: b.left - s.left,
          y: b.top - s.top,
          w: b.width,
          h: b.height,
          sw: s.width,
          sh: s.height
        };
        var key = [m.x, m.y, m.w, m.h].map(n => Math.round(n)).join(",");
        if (key === lastKey) stable++;else {
          stable = 0;
          lastKey = key;
        }
        var apply = () => {
          if (key !== lastSet) {
            setSpot(m);
            lastSet = key;
          }
        };
        if (stable >= 2) committed = true;
        // Reveal once stable (fades in at the right place after a context switch),
        // then KEEP following late layout shifts (avatars/lists settling, async
        // reflow) so the highlight can't end up half-covering the target — the
        // make-team CTA used to. The cutout's CSS transition smooths each nudge.
        if (sameCtx || committed) apply();
      }
      if (frames > 200) return; // ~3.3s window for late shifts, then stop
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener("resize", tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", tick);
    };
  }, [step]); // eslint-disable-line

  if (!stop) return null;
  var last = step >= STOPS.length - 1;
  var resetHero = () => {
    if (typeof window !== "undefined" && window.__bosHeroPage) window.__bosHeroPage(0);
  };
  var next = () => {
    if (last) {
      // A stop can open a real bottom sheet as its finale (e.g. demonstrate
      // "Поделиться приложением" so the influence/XP reward is felt, not just told).
      if (stop.openShare && openSheet) {
        try {
          openSheet(React.createElement(ShareAppSheet, {
            dark
          }));
        } catch (_) {}
      }
      resetHero();
      endTour();
      navigate(baseTab);
    } else setStep(step + 1);
  };
  var skip = () => {
    resetHero();
    endTour();
    navigate(baseTab);
  };
  var dots = /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 5,
      justifyContent: "center",
      marginTop: 14
    }
  }, STOPS.map((_, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      width: i === step ? 16 : 5,
      height: 5,
      borderRadius: 999,
      background: i === step ? "#FEDE34" : dark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.18)",
      transition: "width 0.3s, background 0.3s"
    }
  })));
  var cardBg = dark ? "rgba(26,26,30,0.97)" : "rgba(255,255,255,0.98)";
  var titleC = dark ? "#fff" : "#0a0a0a";
  var bodyC = dark ? "rgba(255,255,255,0.62)" : "rgba(0,0,0,0.55)";
  var ghostC = dark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.4)";
  var tourStyle = /*#__PURE__*/React.createElement("style", null, `
      @keyframes bosTourPop { from { opacity: 0; transform: scale(0.93) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      @keyframes bosTourRing { 0% { transform: scale(0.75); opacity: 0.9; } 100% { transform: scale(1.55); opacity: 0; } }
      @keyframes bosTourCut { from { opacity: 0; } to { opacity: 1; } }
      .bos-tour-pop { animation: bosTourPop 0.42s cubic-bezier(0.34,1.56,0.64,1) both; }
    `);

  // ── Centered welcome / closing card ──
  if (stop.kind === "card") {
    return /*#__PURE__*/React.createElement("div", {
      ref: rootRef,
      style: {
        position: "absolute",
        inset: 0,
        zIndex: 500,
        display: "grid",
        placeItems: "center",
        padding: 28,
        background: "rgba(4,6,12,0.62)",
        backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "bos-tour-pop",
      style: {
        width: "100%",
        maxWidth: 320,
        background: cardBg,
        borderRadius: 28,
        padding: "30px 24px 22px",
        textAlign: "center",
        boxShadow: "0 30px 70px rgba(0,0,0,0.45)",
        border: dark ? "1px solid rgba(255,255,255,0.08)" : "none"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 46,
        lineHeight: 1,
        marginBottom: 14
      }
    }, stop.emoji), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
        fontSize: 22,
        fontWeight: 700,
        letterSpacing: "-0.4px",
        color: titleC,
        lineHeight: 1.2
      }
    }, stop.title), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14.5,
        color: bodyC,
        lineHeight: 1.5,
        marginTop: 10
      }
    }, stop.body), /*#__PURE__*/React.createElement("button", {
      onClick: next,
      className: "tap",
      style: {
        width: "100%",
        marginTop: 22,
        background: "linear-gradient(135deg,#FEDE34,#FFC400)",
        color: "#0a0a0a",
        border: 0,
        borderRadius: 999,
        padding: 15,
        fontSize: 15.5,
        fontWeight: 700
      }
    }, stop.cta), !last && /*#__PURE__*/React.createElement("button", {
      onClick: skip,
      className: "tap",
      style: {
        width: "100%",
        marginTop: 8,
        background: "transparent",
        border: 0,
        color: ghostC,
        fontSize: 13,
        padding: 8
      }
    }, "\u041F\u0440\u043E\u043F\u0443\u0441\u0442\u0438\u0442\u044C"), dots), tourStyle);
  }

  // ── Peek: open a real screen and show a bottom tooltip with NO dim, so the
  //    screen stays fully alive (e.g. the team chat in action — "feel it"). ──
  if (stop.kind === "peek") {
    return /*#__PURE__*/React.createElement("div", {
      ref: rootRef,
      style: {
        position: "absolute",
        inset: 0,
        zIndex: 500,
        pointerEvents: "none"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        inset: 0,
        pointerEvents: "auto",
        background: "transparent"
      }
    }), /*#__PURE__*/React.createElement("div", {
      className: "bos-tour-pop",
      style: {
        position: "absolute",
        left: 14,
        right: 14,
        bottom: "max(20px, calc(var(--bos-safe-bottom, 0px) + 14px))",
        background: cardBg,
        borderRadius: 22,
        padding: "16px 18px 14px",
        boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
        border: dark ? "1px solid rgba(255,255,255,0.08)" : "none",
        pointerEvents: "auto"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 1.4,
        textTransform: "uppercase",
        color: "#E0A500"
      }
    }, stop.eyebrow), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 18,
        fontWeight: 700,
        letterSpacing: "-0.3px",
        color: titleC,
        marginTop: 3
      }
    }, stop.title), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13.5,
        color: bodyC,
        lineHeight: 1.45,
        marginTop: 6
      }
    }, stop.body), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 14
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: skip,
      className: "tap",
      style: {
        background: "transparent",
        border: 0,
        color: ghostC,
        fontSize: 13,
        padding: "10px 14px",
        margin: "-4px -8px"
      }
    }, "\u041F\u0440\u043E\u043F\u0443\u0441\u0442\u0438\u0442\u044C"), /*#__PURE__*/React.createElement("button", {
      onClick: next,
      className: "tap",
      style: {
        background: dark ? "#fff" : "#0a0a0a",
        color: dark ? "#0a0a0a" : "#fff",
        border: 0,
        borderRadius: 999,
        padding: "10px 22px",
        fontSize: 14,
        fontWeight: 600
      }
    }, last ? stop.cta || "Готово" : "Далее")), dots), tourStyle);
  }

  // ── Element spotlight (cutout + tooltip) ──
  var pad = 6;
  var cutout = spot ? {
    left: spot.x - pad,
    top: spot.y - pad,
    width: spot.w + pad * 2,
    height: spot.h + pad * 2
  } : null;
  var tcx = spot ? spot.x + spot.w / 2 : 200; // target centre x
  var below = spot ? spot.y + spot.h / 2 < spot.sh * 0.5 : false; // card below a top-half target, else above
  var cardTop = spot && below ? spot.y + spot.h + pad + 14 : undefined;
  var cardBottom = spot && !below ? spot.sh - spot.y + pad + 14 : spot ? undefined : 110;
  var caretLeft = spot ? Math.max(16, Math.min(tcx - 21, spot.sw - 28 - 22)) : 180;
  return /*#__PURE__*/React.createElement("div", {
    ref: rootRef,
    style: {
      position: "absolute",
      inset: 0,
      zIndex: 500
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: cutout ? "transparent" : "rgba(4,6,12,0.66)"
    }
  }), cutout && /*#__PURE__*/React.createElement("div", {
    key: ctxKey,
    style: {
      position: "absolute",
      left: cutout.left,
      top: cutout.top,
      width: cutout.width,
      height: cutout.height,
      borderRadius: stop.radius,
      boxShadow: "0 0 0 9999px rgba(4,6,12,0.66)",
      border: "1.5px solid rgba(254,222,52,0.85)",
      transition: "all 0.34s cubic-bezier(0.32,0.72,0,1)",
      pointerEvents: "none"
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "bos-tour-pop",
    style: {
      position: "absolute",
      left: 14,
      right: 14,
      top: cardTop,
      bottom: cardBottom,
      background: cardBg,
      borderRadius: 22,
      padding: "16px 18px 14px",
      boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
      border: dark ? "1px solid rgba(255,255,255,0.08)" : "none"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 1.4,
      textTransform: "uppercase",
      color: "#E0A500"
    }
  }, stop.eyebrow), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      letterSpacing: "-0.3px",
      color: titleC,
      marginTop: 3
    }
  }, stop.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: bodyC,
      lineHeight: 1.45,
      marginTop: 6
    }
  }, stop.body), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: skip,
    className: "tap",
    style: {
      background: "transparent",
      border: 0,
      color: ghostC,
      fontSize: 13,
      padding: "10px 14px",
      margin: "-4px -8px"
    }
  }, "\u041F\u0440\u043E\u043F\u0443\u0441\u0442\u0438\u0442\u044C"), /*#__PURE__*/React.createElement("button", {
    onClick: next,
    className: "tap",
    style: {
      background: dark ? "#fff" : "#0a0a0a",
      color: dark ? "#0a0a0a" : "#fff",
      border: 0,
      borderRadius: 999,
      padding: "10px 22px",
      fontSize: 14,
      fontWeight: 600
    }
  }, last ? stop.cta || "Готово" : "Далее")), dots, below ? /*#__PURE__*/React.createElement("span", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      top: -7,
      left: caretLeft,
      width: 14,
      height: 14,
      background: cardBg,
      transform: "rotate(45deg)",
      borderRadius: 3,
      borderLeft: dark ? "1px solid rgba(255,255,255,0.08)" : "none",
      borderTop: dark ? "1px solid rgba(255,255,255,0.08)" : "none"
    }
  }) : /*#__PURE__*/React.createElement("span", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      bottom: -7,
      left: caretLeft,
      width: 14,
      height: 14,
      background: cardBg,
      transform: "rotate(45deg)",
      borderRadius: 3,
      borderRight: dark ? "1px solid rgba(255,255,255,0.08)" : "none",
      borderBottom: dark ? "1px solid rgba(255,255,255,0.08)" : "none"
    }
  })), tourStyle);
}

/* ── Fresh-user onboarding: gentle iOS bottom-sheets ───────────────────────────
   Replaces the old forced coach-mark tour. Three calm "what is this" sheets rise
   on the first home screen; then, when the user opens a tab THEMSELVES for the
   first time, a one-line intro sheet rises to orient them — never a forced march. */
var WELCOME_SHEETS = [{
  eyebrow: "Добро пожаловать",
  title: "Это не трекер. Это платформа.",
  body: "Привычки, люди и рост — в одном месте. Маленькие шаги каждый день складываются в большое.",
  pills: [{
    emoji: "⚡",
    label: "Привычки"
  }, {
    emoji: "👥",
    label: "Команды"
  }, {
    emoji: "🎓",
    label: "Тренинги"
  }]
}, {
  eyebrow: "Вместе",
  title: "Привычки — с близкими",
  body: "Делай привычки вдвоём, собирай команды, проходи тренинги с наставниками. Вместе — крепче.",
  pills: [{
    emoji: "👥",
    label: "Команды"
  }, {
    emoji: "🤝",
    label: "Вдвоём"
  }, {
    emoji: "💬",
    label: "Чат"
  }]
}, {
  eyebrow: "Твой темп",
  title: "Расти, как тебе удобно",
  body: "Выполняй привычки — уровень растёт, открываются люди и возможности. Гид «Что дальше?» ждёт внизу.",
  pills: [{
    emoji: "🏆",
    label: "Уровни"
  }, {
    emoji: "🧭",
    label: "Наставники"
  }, {
    emoji: "🎁",
    label: "Награды"
  }]
}];
var TAB_INTROS = {
  habits: {
    eyebrow: "Практика",
    title: "Тут ты всё создаёшь",
    body: "Привычки и цели живут здесь. Делай их один или вместе с близкими, держа общую серию.",
    pills: [{
      emoji: "⚡",
      label: "Привычки"
    }, {
      emoji: "🎯",
      label: "Цели"
    }, {
      emoji: "👥",
      label: "Вместе"
    }]
  },
  community: {
    eyebrow: "Сообщество",
    title: "Сердце приложения",
    body: "Команды с близкими, курсы и тренинги, нетворк наставников. Вместе держим ритм сильнее.",
    pills: [{
      emoji: "👥",
      label: "Команды",
      view: {
        section: "discover",
        discTab: "teams"
      }
    }, {
      emoji: "🎓",
      label: "Курсы",
      view: {
        section: "community",
        commTab: "courses"
      }
    }, {
      emoji: "🧭",
      label: "Нетворк",
      view: {
        section: "discover",
        discTab: "network"
      }
    }]
  },
  ai: {
    eyebrow: "Помощник",
    title: "ИИ всегда рядом",
    body: "Совет, разбор дня, план на завтра — Balance держит в уме твой контекст и подсказывает по делу.",
    pills: [{
      emoji: "💡",
      label: "Совет дня"
    }, {
      emoji: "📊",
      label: "Разбор"
    }, {
      emoji: "🗓️",
      label: "План"
    }]
  }
};

/* Demo intros — richer per-screen sheets shown when the demo user opens each tab.
   Same look as the fresh intros, but each (except AI) offers "Показать детально"
   → that screen's button-by-button spotlights (SCREEN_TOURS). */
var DEMO_INTROS = {
  home: {
    eyebrow: "Главная",
    title: "Твой экран дня",
    detail: true,
    body: "Состояние, баланс, серии и уровень — что важно, то наверху. Собери под себя.",
    pills: [{
      emoji: "😌",
      label: "Состояние"
    }, {
      emoji: "🔥",
      label: "Серии"
    }, {
      emoji: "🏆",
      label: "Уровень"
    }, {
      emoji: "🤝",
      label: "Влияние ×1.25"
    }]
  },
  habits: {
    eyebrow: "Практика",
    title: "Тут ты всё создаёшь",
    detail: true,
    body: "Привычки и цели — одному или вместе. Шаблоны для быстрого старта.",
    pills: [{
      emoji: "⚡",
      label: "Привычки"
    }, {
      emoji: "🎯",
      label: "Цели"
    }, {
      emoji: "👥",
      label: "Вместе"
    }]
  },
  community: {
    eyebrow: "Сообщество",
    title: "Сердце экосистемы",
    detail: true,
    body: "Команды с близкими, нетворк наставников, курсы. Самая глубина — здесь.",
    pills: [{
      emoji: "👥",
      label: "Команды"
    }, {
      emoji: "🧭",
      label: "Нетворк"
    }, {
      emoji: "🎓",
      label: "Курсы"
    }]
  },
  ai: {
    eyebrow: "Помощник",
    title: "ИИ всегда рядом",
    detail: true,
    body: "Совет, разбор дня, план на завтра — держит в уме твой контекст и подсказывает по делу.",
    pills: [{
      emoji: "💡",
      label: "Совет"
    }, {
      emoji: "📊",
      label: "Разбор"
    }, {
      emoji: "🗓️",
      label: "План"
    }]
  }
};

/* The same brand orb on every onboarding sheet — identical size, position and
   tint on every step, so it reads as ONE persistent orb while only the text
   changes (orb-continuity). Pills below carry the per-screen meaning via colourful
   iOS emoji. (Richer bespoke imagery is a later design pass, together with David.) */
function OnbHero() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 92,
      display: "grid",
      placeItems: "center",
      margin: "0 auto"
    }
  }, /*#__PURE__*/React.createElement(StaticOrb, {
    size: 88,
    tint: tintFromMood("#5FA8FF"),
    seed: 2.0,
    intensity: 0.5
  }));
}

/* Presentational content for one onboarding bottom-sheet. Fixed minHeight + a
   top-anchored hero + reserved body height → every sheet is the SAME size, so
   nothing jumps between steps. `pills` (always shown) surface the key things on
   the screen; a pill with onClick jumps there. */
function OnbSheet({
  eyebrow,
  title,
  body,
  pills,
  cta,
  onCta,
  onSkip,
  skipLabel = "Я разберусь сам",
  total,
  index,
  dark
}) {
  var titleC = dark ? "#fff" : "#0a0a0a";
  var bodyC = dark ? "rgba(255,255,255,0.62)" : "rgba(0,0,0,0.56)";
  var ghostC = dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.38)";
  var pillBg = dark ? "rgba(255,255,255,0.08)" : "#f0f1f4";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "4px 22px 8px",
      textAlign: "center",
      minHeight: 454,
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement(OnbHero, null)), eyebrow && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: 1.4,
      textTransform: "uppercase",
      color: "#E0A500"
    }
  }, eyebrow), /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: 60,
      marginTop: 6,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
      fontSize: 25,
      fontWeight: 700,
      letterSpacing: "-0.5px",
      color: titleC,
      lineHeight: 1.18
    }
  }, title)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15.5,
      color: bodyC,
      lineHeight: 1.5,
      marginTop: 9,
      maxWidth: 330,
      marginLeft: "auto",
      marginRight: "auto",
      minHeight: 70
    }
  }, body), pills && pills.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      justifyContent: "center",
      flexWrap: "wrap",
      marginTop: 16
    }
  }, pills.map((p, i) => {
    var st = {
      background: pillBg,
      border: 0,
      borderRadius: 999,
      padding: "8px 13px 8px 11px",
      fontSize: 13.5,
      fontWeight: 600,
      color: titleC,
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    };
    var inner = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14.5,
        lineHeight: 1
      }
    }, p.emoji), " ", p.label);
    return p.onClick ? /*#__PURE__*/React.createElement("button", {
      key: i,
      onClick: p.onClick,
      className: "tap",
      style: st
    }, inner) : /*#__PURE__*/React.createElement("span", {
      key: i,
      style: st
    }, inner);
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 14
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: onCta,
    className: "tap",
    style: {
      width: "100%",
      marginTop: 16,
      background: dark ? "#fff" : "#0a0a0a",
      color: dark ? "#0a0a0a" : "#fff",
      border: 0,
      borderRadius: 999,
      padding: 16,
      fontSize: 16,
      fontWeight: 600
    }
  }, cta), onSkip ? /*#__PURE__*/React.createElement("button", {
    onClick: onSkip,
    className: "tap",
    style: {
      width: "100%",
      marginTop: 6,
      background: "transparent",
      border: 0,
      color: ghostC,
      fontSize: 13.5,
      padding: 9
    }
  }, skipLabel) : total > 1 ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      height: 34
    }
  }) : null, total > 1 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 5,
      justifyContent: "center",
      marginTop: 12
    }
  }, Array.from({
    length: total
  }).map((_, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      width: i === index ? 16 : 5,
      height: 5,
      borderRadius: 999,
      background: i === index ? dark ? "#fff" : "#0a0a0a" : dark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.16)",
      transition: "width 0.3s"
    }
  }))));
}
function FreshOnboarding({
  app,
  dark
}) {
  var welcome = !!app.onbWelcome;
  var [wStep, setWStep] = useState(0);
  useEffect(() => {
    if (welcome) setWStep(0);
  }, [welcome]);

  // Demo greets each screen with the richer DEMO_INTROS (offering "Показать
  // детально"); a fresh user gets the calm TAB_INTROS.
  var intros = app.mode === "demo" ? DEMO_INTROS : TAB_INTROS;
  var tabKey = app.onbTab;
  var tab = !welcome && tabKey ? intros[tabKey] : null;
  // Keep the last tab content mounted through the close animation (so it slides
  // down with text intact instead of emptying first).
  var lastTab = useRef(null);
  if (tab) lastTab.current = tab;
  var tabView = tab || lastTab.current;
  var closeWelcome = () => app.setOnbWelcome(false);
  var closeTab = () => app.setOnbTab(null);
  var ws = WELCOME_SHEETS[wStep] || WELCOME_SHEETS[0];
  var lastW = wStep >= WELCOME_SHEETS.length - 1;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(BottomSheet, {
    open: welcome,
    onClose: closeWelcome,
    dark: dark
  }, /*#__PURE__*/React.createElement(OnbSheet, {
    eyebrow: ws.eyebrow,
    title: ws.title,
    body: ws.body,
    pills: ws.pills,
    dark: dark,
    total: WELCOME_SHEETS.length,
    index: wStep,
    cta: lastW ? "Начать" : "Дальше",
    onCta: () => {
      if (lastW) closeWelcome();else setWStep(wStep + 1);
    },
    onSkip: lastW ? null : closeWelcome
  })), /*#__PURE__*/React.createElement(BottomSheet, {
    open: !!tab,
    onClose: closeTab,
    dark: dark
  }, tabView && /*#__PURE__*/React.createElement(OnbSheet, {
    eyebrow: tabView.eyebrow,
    title: tabView.title,
    body: tabView.body,
    dark: dark,
    cta: tabView.detail ? "Показать детально" : "Понятно",
    onCta: tabView.detail ? () => {
      app.startScreenTour(tabKey);
      closeTab();
    } : closeTab,
    onSkip: tabView.detail ? closeTab : undefined,
    skipLabel: "\u041E\u0441\u043C\u043E\u0442\u0440\u044E\u0441\u044C \u0441\u0430\u043C",
    pills: tabView.pills && tabView.pills.map(p => ({
      emoji: p.emoji,
      label: p.label,
      onClick: p.view ? () => {
        app.setCommunityView(p.view);
        closeTab();
      } : undefined
    }))
  })));
}

/* ── "О приложении" — one beautiful page describing the whole product. Opened
   from the home "Что дальше?" banner (fresh users); links out to the manifest. */
function GuideScreen() {
  var {
    navigate
  } = useNav();
  var FEATURES = [{
    e: "🌱",
    t: "Привычки и цели",
    b: "Твоя личная система. Маленькие шаги, что ведут к большой цели — каждый день."
  }, {
    e: "👥",
    t: "Вместе с близкими",
    b: "Общие привычки и команды — семья, друзья, клиенты тренинга. Общая цель, чат и статистика."
  }, {
    e: "🎓",
    t: "Тренинги и курсы",
    b: "Проходи программы наставников, получай ачивки и открывай новые круги людей."
  }, {
    e: "🧭",
    t: "Нетворк и наставники",
    b: "С ростом уровня открывается круг людей: наставники, услуги, помощь. XP за привычки тратишь на них."
  }, {
    e: "✨",
    t: "ИИ-помощник",
    b: "Совет, разбор дня, план на завтра — Balance держит в уме твой контекст."
  }, {
    e: "🏆",
    t: "Уровни и награды",
    b: "Каждый шаг даёт опыт. Уровень растёт — открываются возможности, ачивки и новые люди."
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      padding: "0 16px 28px"
    }
  }, /*#__PURE__*/React.createElement(PageHeader, {
    title: "\u041E \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0438",
    onBack: () => navigate("home")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      padding: "6px 6px 20px"
    }
  }, /*#__PURE__*/React.createElement(StaticOrb, {
    size: 108,
    tint: tintFromMood("#46a6ff"),
    seed: 1.6,
    intensity: 0.6
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--bos-title-font)",
      fontSize: 27,
      fontWeight: 800,
      letterSpacing: "-0.6px",
      color: "var(--text)",
      marginTop: 14,
      lineHeight: 1.15
    }
  }, "BalanceOS \u2014 \u044D\u0442\u043E \u044D\u043A\u043E\u0441\u0438\u0441\u0442\u0435\u043C\u0430"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      color: "var(--text-3)",
      marginTop: 10,
      lineHeight: 1.55,
      maxWidth: 332
    }
  }, "\u041D\u0435 \u043F\u0440\u043E\u0441\u0442\u043E \u0442\u0440\u0435\u043A\u0435\u0440 \u043F\u0440\u0438\u0432\u044B\u0447\u0435\u043A, \u0430 \u043C\u0435\u0441\u0442\u043E, \u0433\u0434\u0435 \u0442\u044B \u0440\u0430\u0441\u0442\u0451\u0448\u044C \u0432\u043C\u0435\u0441\u0442\u0435 \u0441 \u0431\u043B\u0438\u0437\u043A\u0438\u043C\u0438: \u043E\u0431\u0449\u0438\u0435 \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0438, \u043A\u043E\u043C\u0430\u043D\u0434\u044B, \u0442\u0440\u0435\u043D\u0438\u043D\u0433\u0438, \u0446\u0435\u043B\u0438 \u0438 \u0418\u0418-\u043F\u043E\u043C\u043E\u0449\u043D\u0438\u043A \u2014 \u0432 \u043E\u0434\u043D\u043E\u043C \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0438.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, FEATURES.map((f, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      background: "var(--card)",
      borderRadius: 20,
      padding: 16,
      boxShadow: "var(--card-shadow)",
      display: "flex",
      gap: 14,
      alignItems: "flex-start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 46,
      height: 46,
      borderRadius: 14,
      background: "var(--surface-3)",
      display: "grid",
      placeItems: "center",
      fontSize: 24,
      flexShrink: 0
    }
  }, f.e), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16.5,
      fontWeight: 600,
      color: "var(--text)",
      letterSpacing: "-0.2px"
    }
  }, f.t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: "var(--text-3)",
      marginTop: 4,
      lineHeight: 1.5
    }
  }, f.b))))), /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("manifest"),
    className: "tap",
    style: {
      width: "100%",
      marginTop: 16,
      background: "#0a0a0a",
      color: "#fff",
      border: 0,
      borderRadius: 20,
      padding: "18px 20px",
      display: "flex",
      alignItems: "center",
      gap: 14,
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 44,
      height: 44,
      borderRadius: 13,
      background: "rgba(255,255,255,0.1)",
      display: "grid",
      placeItems: "center",
      fontSize: 22,
      flexShrink: 0
    }
  }, "\uD83D\uDCDC"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700
    }
  }, "\u041F\u0440\u043E\u0447\u0438\u0442\u0430\u0442\u044C \u043C\u0430\u043D\u0438\u0444\u0435\u0441\u0442"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "rgba(255,255,255,0.6)",
      marginTop: 2
    }
  }, "\u0412\u043E \u0447\u0442\u043E \u043C\u044B \u0432\u0435\u0440\u0438\u043C \u0438 \u0437\u0430\u0447\u0435\u043C \u0432\u0441\u0451 \u044D\u0442\u043E")), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 20,
    color: "rgba(255,255,255,0.6)"
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("home"),
    className: "tap",
    style: {
      width: "100%",
      marginTop: 10,
      background: "transparent",
      border: 0,
      color: "var(--text-4)",
      fontSize: 14.5,
      fontWeight: 500,
      padding: 12
    }
  }, "\u041D\u0430\u0447\u0430\u0442\u044C \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C\u0441\u044F \u2192"));
}
function PhoneApp() {
  var app = useApp();
  // Optional deep link: ?screen=home opens straight to a screen (skips intro).
  // Used by the promo composite and for sharing a direct link to a view.
  var startRoute = (() => {
    try {
      var s = new URLSearchParams(window.location.search).get("screen");
      return s && SCREENS[s] ? s : START_ROUTE;
    } catch (e) {
      return START_ROUTE;
    }
  })();
  var [frames, setFrames] = useState([{
    route: startRoute,
    params: {},
    id: 0
  }]);
  var [anim, setAnim] = useState(null); // { dir, prevFrame }
  var idRef = useRef(1);

  // Interactive edge-swipe-back: drag from the left edge to pop, finger-tracked.
  var [drag, setDrag] = useState(null); // { dx, w, releasing } during/just-after a drag
  var dragRef = useRef(null);
  var stackRef = useRef(null);
  var EDGE_ZONE = 32; // px from the left edge that arms the gesture (roomier = easier to start)
  var DRAG_THRESH = 7; // px of travel before we lock to a horizontal drag

  // App-wide bottom sheet (share, etc.), opened from any screen via useSheet().
  var [sheet, setSheet] = useState(null);
  var sheetApi = React.useMemo(() => ({
    open: node => setSheet(node),
    close: () => setSheet(null)
  }), []);
  useEffect(() => {
    applyTweaks(TWEAK_DEFAULTS);
    // Reveal the app and fade the launch splash once mounted.
    var id = requestAnimationFrame(() => document.body.classList.add("app-ready"));
    return () => cancelAnimationFrame(id);
  }, []);
  var navigate = useCallback((next, np = {}, opts = {}) => {
    setFrames(prev => {
      var idx = prev.findIndex(f => f.route === next);
      // Re-navigating to the current screen → just refresh its params, no transition.
      if (idx === prev.length - 1) {
        var copy = prev.slice();
        copy[idx] = {
          ...copy[idx],
          params: np || {}
        };
        return copy;
      }
      var cur = prev[prev.length - 1];
      var dir, nextFrames;
      if (idx >= 0) {
        dir = "pop";
        nextFrames = prev.slice(0, idx + 1);
      } else if (TAB_ROUTES.has(next)) {
        dir = "fade";
        nextFrames = [{
          route: next,
          params: np || {},
          id: idRef.current++
        }];
      } else {
        // onboarding → signup cross-fades (the orb visually "flows" from one
        // screen into the other) instead of sliding in as a separate card.
        dir = next === "signup" && cur.route === "intro" ? "fade" : "push";
        nextFrames = [...prev, {
          route: next,
          params: np || {},
          id: idRef.current++
        }];
      }
      // opts.instant → swap with NO page animation (used by the guided tour, so
      // the page changes UNDER the dim instead of fading/sliding into view = no flash).
      setAnim(opts.instant ? null : {
        dir,
        prevFrame: cur
      });
      return nextFrames;
    });
  }, []);

  // Pop one screen off the stack — used by Telegram's native Back button.
  var goBack = useCallback(() => {
    setFrames(prev => {
      if (prev.length <= 1) return prev;
      setAnim({
        dir: "pop",
        prevFrame: prev[prev.length - 1]
      });
      return prev.slice(0, -1);
    });
  }, []);
  var top = frames[frames.length - 1];
  var themeFor = route => app.themeOverride === "dark" ? true : app.themeOverride === "light" ? false : DARK_ROUTES.has(route);
  var topDark = themeFor(top.route);
  var topInTabs = TAB_ROUTES.has(top.route);

  // Keep the iOS status-bar tint + the root background in sync with the screen,
  // so the home-indicator safe area never shows a stray black bar.
  useEffect(() => {
    var bg = ROOT_BG[top.route] || (topDark ? "#0a0a0a" : "#f1f1f1");
    var m = document.querySelector('meta[name="theme-color"]');
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
    var t = window.setTimeout(() => setAnim(null), 520);
    return () => window.clearTimeout(t);
  }, [anim]);
  var renderLayer = (frame, animClass, onEnd) => {
    var dark = themeFor(frame.route);
    var inTabs = TAB_ROUTES.has(frame.route);
    var full = FULLBLEED_ROUTES.has(frame.route);
    var Comp = SCREENS[frame.route] && SCREENS[frame.route]() || HomeScreen;
    var cls = "bos-page " + (dark ? "theme-dark" : "theme-light") + (inTabs ? "" : " no-tabbar") + (full ? " full-bleed" : "") + (animClass ? " " + animClass : "");
    return /*#__PURE__*/React.createElement("div", {
      key: frame.id,
      className: cls,
      onAnimationEnd: onEnd
    }, /*#__PURE__*/React.createElement(NavCtx.Provider, {
      value: {
        route: frame.route,
        params: frame.params,
        navigate
      }
    }, /*#__PURE__*/React.createElement(Comp, null)));
  };
  var renderDragLayer = (frame, style, dimStyle) => {
    var dark = themeFor(frame.route);
    var inTabs = TAB_ROUTES.has(frame.route);
    var full = FULLBLEED_ROUTES.has(frame.route);
    var Comp = SCREENS[frame.route] && SCREENS[frame.route]() || HomeScreen;
    var cls = "bos-page " + (dark ? "theme-dark" : "theme-light") + (inTabs ? "" : " no-tabbar") + (full ? " full-bleed" : "");
    return /*#__PURE__*/React.createElement("div", {
      key: frame.id,
      className: cls,
      style: style
    }, /*#__PURE__*/React.createElement(NavCtx.Provider, {
      value: {
        route: frame.route,
        params: frame.params,
        navigate
      }
    }, /*#__PURE__*/React.createElement(Comp, null)), dimStyle && /*#__PURE__*/React.createElement("div", {
      className: "bos-drag-dim",
      style: dimStyle
    }));
  };
  var clearAnim = () => setAnim(null);

  // ── Edge-swipe-back gesture (pointer events → works with touch AND mouse) ──
  var canPop = frames.length > 1 && !anim;
  var prevFrame = frames.length > 1 ? frames[frames.length - 2] : null;
  var onDragStart = e => {
    if (!canPop || drag) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (e.clientX > EDGE_ZONE) return;
    dragRef.current = {
      id: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      w: stackRef.current && stackRef.current.clientWidth || window.innerWidth || 1,
      active: false,
      dx: 0
    };
  };
  var onDragMove = e => {
    var d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    var dx = e.clientX - d.x0,
      dy = e.clientY - d.y0;
    if (!d.active) {
      if (Math.abs(dx) < DRAG_THRESH && Math.abs(dy) < DRAG_THRESH) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        dragRef.current = null;
        return;
      } // vertical → let it scroll
      d.active = true;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (_) {}
    }
    // Track horizontal velocity (px/ms) so a quick flick can complete the pop.
    var now = performance.now();
    if (d.lastT != null) {
      var dt = now - d.lastT;
      if (dt > 0) d.vx = (e.clientX - d.lastX) / dt;
    }
    d.lastX = e.clientX;
    d.lastT = now;
    d.dx = Math.max(0, Math.min(dx, d.w));
    if (e.cancelable) e.preventDefault();
    setDrag({
      dx: d.dx,
      w: d.w,
      releasing: false
    });
  };
  var onDragEnd = e => {
    var d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    dragRef.current = null;
    if (!d.active) return;
    // Go back on a clear rightward flick OR a third of the way across — so a quick
    // short swipe still completes instead of snapping shut (felt "harsh" before).
    var pop = (d.vx || 0) > 0.4 || d.dx > d.w * 0.3;
    setDrag({
      dx: pop ? d.w : 0,
      w: d.w,
      releasing: true
    });
    window.setTimeout(() => {
      if (pop) setFrames(f => f.length > 1 ? f.slice(0, -1) : f);
      setDrag(null);
    }, 300);
  };
  var p = drag ? Math.max(0, Math.min(drag.dx / drag.w, 1)) : 0;
  var dragTrans = drag && drag.releasing ? "transform 0.3s var(--ios-ease), opacity 0.3s var(--ios-ease)" : "none";
  var destTab = drag && prevFrame && TAB_ROUTES.has(prevFrame.route) ? prevFrame.route : null;
  return /*#__PURE__*/React.createElement(SheetCtx.Provider, {
    value: sheetApi
  }, /*#__PURE__*/React.createElement("div", {
    className: "fit-root"
  }, /*#__PURE__*/React.createElement("div", {
    className: "phone-shell " + (topDark ? "is-dark" : "is-light")
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-stack" + (app.tourStep >= 0 ? " tour-active" : ""),
    ref: stackRef,
    onPointerDown: onDragStart,
    onPointerMove: onDragMove,
    onPointerUp: onDragEnd,
    onPointerCancel: onDragEnd
  }, drag && prevFrame ? /*#__PURE__*/React.createElement(React.Fragment, null, renderDragLayer(prevFrame, {
    transform: "translateX(" + (-24 * (1 - p)).toFixed(2) + "%)",
    transition: dragTrans,
    zIndex: 1
  }, {
    opacity: 0.18 * (1 - p),
    transition: dragTrans
  }), renderDragLayer(top, {
    transform: "translateX(" + drag.dx + "px)",
    transition: dragTrans,
    zIndex: 2,
    boxShadow: "-12px 0 40px rgba(0,0,0,0.18)"
  }, null)) : /*#__PURE__*/React.createElement(React.Fragment, null, anim && renderLayer(anim.prevFrame, ANIM[anim.dir].out), renderLayer(top, anim ? ANIM[anim.dir].in : "", anim ? clearAnim : undefined))), !drag && topInTabs && /*#__PURE__*/React.createElement(TabBar, {
    key: "tabbar",
    active: top.route,
    dark: topDark,
    onTab: id => navigate(id)
  }), destTab && /*#__PURE__*/React.createElement(TabBar, {
    key: "tabbar-drag",
    active: destTab,
    dark: themeFor(destTab),
    onTab: id => navigate(id),
    style: {
      opacity: p,
      transition: dragTrans
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "bos-version"
  }, APP_VERSION), /*#__PURE__*/React.createElement(BottomSheet, {
    open: !!sheet,
    onClose: sheetApi.close,
    dark: topDark
  }, sheet), /*#__PURE__*/React.createElement(FreshOnboarding, {
    app: app,
    dark: topDark
  }), /*#__PURE__*/React.createElement(GuidedTour, {
    step: app.tourStep,
    setStep: app.setTourStep,
    endTour: app.endTour,
    navigate: navigate,
    setCommunityView: app.setCommunityView,
    openSheet: sheetApi.open,
    tourScreen: app.tourScreen,
    dark: topDark
  }))));
}
function Root() {
  return /*#__PURE__*/React.createElement(AppProvider, null, /*#__PURE__*/React.createElement(PhoneApp, null));
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(Root, null));

/* HOME — LIVE-only fork of HomeScreen (real Telegram user, app.mode === "live"
   is ALWAYS true here). The demo/fresh branches are stripped: no segmented
   Привычки/Цели toggle, no demo balance-wheel / demo stat strip / demo MoodWidget,
   no fresh «Что дальше?» banner. Everything else reuses the shared core/ toolkit
   (HeroOrbFace, HabitCheck, HabitRing, AvatarStack, bosPill* helpers) + the live
   forks in screens/live/shared_live.jsx (HomeHeroSwipeLive, MoodWidgetLive,
   ShareAppSheetLive, ShareHabitSheetLive) + framework (SwipeRow, BosOrbFace, I,
   hooks, the bos* helpers).

   The home is a CUSTOMIZABLE WIDGET BOARD: every block under the greeting is a widget
   rendered through BosReorderList — long-press → jiggle → drag to reorder (order saved
   in widgets.order, which already syncs to the cloud), a glass «−» badge removes a widget,
   and a «+» tile opens the «available widgets» sheet to add one back. Visibility is a single
   per-id flag (widgets[id] !== false); removing just flips it to false and the widget
   reappears in the «+» sheet — nothing is ever deleted. The ONLY new top-level declaration
   in this file is `function HomeLive`. */
/* Один упавший виджет НЕ роняет всю главную (день наплыва): тихо схлопывается. */
class WidgetBoundaryLive extends React.Component {
  constructor(p) {
    super(p);
    this.state = {
      dead: false
    };
  }
  static getDerivedStateFromError() {
    return {
      dead: true
    };
  }
  componentDidCatch(e) {
    try {
      console.error("widget crash:", this.props.wid, e);
    } catch (e2) {}
  }
  render() {
    return this.state.dead ? null : this.props.children;
  }
}

/* «Быстрое добавление» — лента челленджей, ПЕРЕЕХАВШАЯ со страницы «Привычки» (слияние
   с главной): те же чипы CHALLENGE_STARTERS с XP-бонусом, тот же путь согласия
   (ChallengeIntroSheet → bosCommitChallenge). Горизонтальный скролл, уходит за край с
   маской — как жила наверху «Привычек». Виджет w:quick, снимается минусом/в галерее. */
function HomeQuickStripLive({
  isDark
}) {
  var {
    navigate
  } = useNav();
  var {
    open: openSheet
  } = useSheet();
  var app = useApp();
  var list = typeof CHALLENGE_STARTERS !== "undefined" && Array.isArray(CHALLENGE_STARTERS) ? CHALLENGE_STARTERS : [];
  if (!list.length) return null;
  var chipText = isDark ? "var(--text)" : "var(--text-2)";
  var start = c => {
    if (window.tgHaptic) {
      try {
        window.tgHaptic("light");
      } catch (e) {}
    }
    if (typeof ChallengeIntroSheet === "function" && typeof bosCommitChallenge === "function") {
      openSheet(/*#__PURE__*/React.createElement(ChallengeIntroSheet, {
        c: c,
        dark: isDark,
        onStart: () => bosCommitChallenge(app, c, {
          navigate,
          openSheet
        })
      }));
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      overflowX: "auto",
      scrollbarWidth: "none",
      WebkitOverflowScrolling: "touch",
      touchAction: "pan-x",
      padding: "2px 1px",
      margin: "0 -1px",
      WebkitMaskImage: "linear-gradient(90deg, #000 88%, transparent)",
      maskImage: "linear-gradient(90deg, #000 88%, transparent)"
    }
  }, list.map((c, i) => /*#__PURE__*/React.createElement("button", {
    key: c.key || i,
    className: "tap",
    "data-no-haptic": true,
    onClick: () => start(c),
    style: {
      ...(typeof bosChipGlass === "function" ? bosChipGlass(isDark) : {
        background: "var(--surface-3)"
      }),
      borderRadius: 999,
      padding: "7px 9px 7px 11px",
      border: 0,
      flexShrink: 0,
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      whiteSpace: "nowrap",
      cursor: "pointer",
      animation: "briefPop 0.4s cubic-bezier(0.22,0.9,0.3,1.2) both " + i * 0.03 + "s"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      lineHeight: 1
    }
  }, c.i), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: chipText
    }
  }, c.t), c.kind === "together" && /*#__PURE__*/React.createElement(I.Users, {
    size: 12,
    color: chipText,
    style: {
      opacity: 0.55,
      marginLeft: -2
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      fontWeight: 800,
      color: "#9a6800",
      background: "rgba(245,180,30,0.18)",
      borderRadius: 999,
      padding: "2px 6px",
      letterSpacing: "-0.2px",
      lineHeight: 1.3
    }
  }, "+", c.bonus, " XP"))));
}
function HomeLive() {
  var {
    navigate
  } = useNav();
  var {
    open: openSheet,
    close: closeSheet
  } = useSheet();
  var app = useApp();
  // Меню «Стиль карточек» — открывается из галереи: шторка закрывается, панель встаёт
  // под «+» в шапке, и смена формы/отметок видна ВЖИВУЮ на карточках доски.
  var [styleOpen, setStyleOpen] = React.useState(false);
  var widgets = app?.widgets || {};
  var mood = app?.mood;
  var wrapRef = React.useRef(null);
  var isDark = useThemeFlag(wrapRef);
  // Habits + goals come from the shared app store, so a check here shows up
  // on the Habits tab too (and vice versa). Скрытые с личных страниц копии привычек круга
  // (shelved, Г) и «только внутри цели» (goalOnly) на доску и в счёт дня не попадают.
  var habits = (app?.habits || []).filter(h => !h.shelved && !h.goalOnly);
  var goals = app?.goals || [];
  // David: «унифицировать» — виджеты привычек/целей на главной = ТЕ ЖЕ плитки, что на «Привычках», и
  // слушают ТОТ ЖЕ стиль (форма/тоглы из шестерёнки). Хуки → главная перерисовывается при смене стиля.
  var cardStyle = useBosCardStyle();
  var goalStyle = useBosGoalStyle();
  var teams = app?.teams || [];
  // Универсальная кнопка «+» в шапке главной (David: «нужна явная кнопка создать привычку») —
  // открывает то же меню Привычку/Цель/Команду, что и «+» на странице Привычки. Плюс простой
  // СТАРТ для нового юзера ниже (0 привычек/целей/команд → один понятный шаг).
  var [createOpen, setCreateOpen] = React.useState(false);
  var addBtnRef = React.useRef(null);
  var trulyNew = habits.length === 0 && goals.length === 0 && teams.length === 0;
  var userName = app?.userName ?? "";
  // Greeting follows the user's OWN local clock — real morning for whoever opens
  // it in the morning, evening in the evening. No server sync needed: each device
  // already knows its local time.
  var _hr = new Date().getHours();
  var greeting = _hr < 5 ? "Доброй ночи" : _hr < 12 ? "Доброе утро" : _hr < 18 ? "Добрый день" : _hr < 23 ? "Добрый вечер" : "Доброй ночи";
  // Date line under the greeting — the device's REAL current date in Russian
  // ("Вторник · 28 апреля"). Live always shows the real date.
  var _todayLabel = "Вторник · 28 апреля";
  var _calLabel = "28 апр"; // short form for the Calendar card
  try {
    var _wd = new Intl.DateTimeFormat("ru-RU", {
      weekday: "long"
    }).format(new Date());
    var _dm = new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "long"
    }).format(new Date());
    _todayLabel = _wd.charAt(0).toUpperCase() + _wd.slice(1) + " · " + _dm;
    _calLabel = new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "short"
    }).format(new Date()).replace(".", "");
  } catch (e) {}
  // A real Telegram user with no habits yet gets the get-started hero + an engaging
  // level BANNER instead of the dense stat strip.
  var isNewbie = habits.length === 0;
  var toggle = app?.toggleHabit || (() => {});
  var remove = app?.removeHabit || (() => {});
  var removeGoal = app?.removeGoal || (() => {});
  var doneCount = habits.filter(h => h.done).length;
  var totalCount = habits.length;
  var ringPct = totalCount ? doneCount / totalCount : 0;
  // Daily XP — real and legible: each habit is +10, closing the whole day adds
  // the +30 "ideal day" bonus. Show what's earned vs. what's still on the table.
  var XP_PER_HABIT = 10,
    XP_IDEAL_DAY = 30;
  var leftCount = Math.max(0, totalCount - doneCount);
  var dayAllDone = totalCount > 0 && leftCount === 0;
  var xpEarnedToday = doneCount * XP_PER_HABIT + (dayAllDone ? XP_IDEAL_DAY : 0);
  var ruHab = n => {
    var m = n % 10,
      h = n % 100;
    return m === 1 && h !== 11 ? "привычку" : m >= 2 && m <= 4 && (h < 10 || h >= 20) ? "привычки" : "привычек";
  };
  var ruTeam = n => {
    var m = n % 10,
      h = n % 100;
    return m === 1 && h !== 11 ? "цель" : m >= 2 && m <= 4 && (h < 10 || h >= 20) ? "цели" : "целей";
  };
  // Live profiles get REAL numbers from the date-keyed habit model.
  var _liveXP = bosLiveXPLive(app);
  var _lvl = bosLevelInfoLive(_liveXP);
  var dayStreak = bosMaxStreak(habits);
  // Витрина для «Вселенной»: при каждом заходе на Главную (открывается каждую сессию) пишем свой
  // ПУБЛИЧНЫЙ уровень + ЗНАЧКИ привычек (эмодзи+цвет, БЕЗ названий) → у друзей в их Вселенной
  // светятся твои РЕАЛЬНЫЕ планеты. `people` НЕ шлём — его знает экран «Я» (invitedPeople), а
  // cloud.js мержит с последней витриной, так что оно не затрётся. habits обязан быть МАССИВОМ
  // объектов {e,c}: число (как было) склад молча превращал в пустую орбиту и стирал витрину «Я».
  React.useEffect(() => {
    if (!(window.bosCloud && window.bosCloud.enabled() && window.bosCloud.savePublicStats)) return;
    var t = setTimeout(() => {
      try {
        window.bosCloud.savePublicStats({
          level: _lvl.level,
          lvlPct: _lvl.pct,
          habits: habits.map(h => ({
            e: h.emoji,
            c: h.color
          })),
          goals: (app?.goals || []).length
        });
      } catch (e) {}
    }, 1200);
    return () => clearTimeout(t);
  }, [_lvl.level, habits.length, (app?.goals || []).length]);
  // FOMO invite copy — the REAL next reward you're leaving on the table (honest: real XP, real
  // proximity to the next circle milestone; no fake countdowns).
  var _invited = app?.invitedCount || 0;
  var _inviteMiles = [{
    n: 3,
    b: 300
  }, {
    n: 7,
    b: 700
  }, {
    n: 15,
    b: 1500
  }, {
    n: 30,
    b: 3000
  }];
  var _nextInviteMile = _inviteMiles.find(m => m.n > _invited);
  var _inviteFomo = _invited === 0 ? "Первый друг = +150 XP, трое = +300 сверху. Не упусти 🔥" : _nextInviteMile ? "Ещё " + (_nextInviteMile.n - _invited) + " до +" + _nextInviteMile.b + " XP бонусом 🔥" : "+150 XP за каждого нового друга";

  // Bell red dot — REAL events only (секция Б): заявки в мои круги, новые участники,
  // пришедшие по моей ссылке, «тебя приняли», непрочитанные чаты. Один общий сборщик
  // bosNotifHasFreshLive (shared_live, кэш 10 мин); погас/зажёгся — по событию
  // bos:notifSeenChanged из шторки уведомлений. Облако выключено → точки нет.
  var [hasUnread, setHasUnread] = React.useState(false);
  var [notifTick, setNotifTick] = React.useState(0);
  React.useEffect(() => {
    var f = () => setNotifTick(t => t + 1);
    window.addEventListener("bos:notifSeenChanged", f);
    return () => window.removeEventListener("bos:notifSeenChanged", f);
  }, []);
  React.useEffect(() => {
    if (!(window.bosCloud && window.bosCloud.enabled()) || typeof bosNotifHasFreshLive !== "function") {
      setHasUnread(false);
      return;
    }
    var on = true;
    bosNotifHasFreshLive(app).then(v => {
      if (on) setHasUnread(!!v);
    }).catch(() => {
      if (on) setHasUnread(false);
    });
    return () => {
      on = false;
    };
  }, [teams, notifTick]);
  var showBellDot = hasUnread;

  // Celebration when a habit gets completed: float +XP near the avatar ring,
  // sparkle burst when the whole day closes (doneCount reaches total).
  var [celebrate, setCelebrate] = React.useState(null);
  var prevDoneRef = React.useRef(doneCount);
  React.useEffect(() => {
    if (doneCount > prevDoneRef.current) {
      var full = totalCount > 0 && doneCount === totalCount;
      // Per-habit XP now pops on the checkmark (HabitCheck); the big top-of-screen
      // celebration is reserved for the DAY-CLOSE moment so it never double-pops.
      if (full) {
        setCelebrate({
          xp: totalCount * 10 + 30,
          full: true,
          key: Date.now() + ":" + doneCount
        });
        if (window.tgHaptic) {
          try {
            window.tgHaptic("heavy");
          } catch (e) {}
        }
        var t = window.setTimeout(() => setCelebrate(null), 2000);
        prevDoneRef.current = doneCount;
        return () => window.clearTimeout(t);
      }
    }
    prevDoneRef.current = doneCount;
  }, [doneCount, totalCount]);

  // Theme tokens
  var cardBg = isDark ? "rgba(39,39,42,0.55)" : "#fff";
  var cardBorder = "0";
  var chipBg = isDark ? "rgba(255,255,255,0.06)" : "var(--surface-3)";
  var iconBg = isDark ? "rgba(255,255,255,0.06)" : "var(--surface-3)";
  var bellIcon = isDark ? "#fff" : "#0a0a0a";
  var dividerLn = isDark ? "rgba(255,255,255,0.06)" : "var(--line)";
  var moodGrad = c => isDark ? `linear-gradient(135deg, ${c}66 0%, ${c}22 60%, rgba(255,255,255,0.02) 100%)` : `linear-gradient(135deg, ${c} 0%, ${c}66 60%, var(--card-fade) 100%)`;
  var cardShadow = isDark ? "none" : "0 1px 2px rgba(0,0,0,0.04)";
  var rowBg = isDark ? "#1b1b1e" : "#ffffff"; // opaque so swipe actions stay hidden until revealed

  // ── v528 (секция Д): СВОБОДНАЯ сетка — виджеты и плитки привычек/целей ВПЕРЕМЕШКУ
  // (iOS-паттерн). Раскладка = app.homeLayout { order: ["w:hero","h:<id>","g:<id>",...],
  // hidden: [...] }; видимость решает ПРИСУТСТВИЕ в order (widgets{} больше не источник).
  // Первый вход без раскладки → миграция из старых widgets{} (контейнеры «Привычки»/«Цели»
  // раскрываются в плитки на своих местах).
  var DEFAULT_ORDER = BOS_HOME_WIDGETS.map(w => w.id);
  var isWidgetOn = id => id === "invite" ? widgets.invite === true : widgets[id] !== false;
  var layoutObj = app?.homeLayout;
  var buildMigratedOrder = () => {
    var out = [];
    var savedW = (Array.isArray(widgets.order) ? widgets.order : []).filter(id => DEFAULT_ORDER.includes(id) || id === "habits" || id === "goals");
    var wOrder = [...savedW, ...["hero", "week", "habits", "goals", "team", "invite"].filter(id => !savedW.includes(id))];
    wOrder.forEach(id => {
      if (id === "habits") {
        habits.forEach(h => out.push("h:" + h.id));
        return;
      }
      if (id === "goals") {
        goals.forEach(g => out.push("g:" + g.id));
        return;
      }
      if (isWidgetOn(id)) out.push("w:" + id);
    });
    return out;
  };
  var teamKey = t => typeof bosTeamKeyLive === "function" ? bosTeamKeyLive(t) : "t:" + (t.cloudId || t._id || t.id);
  var effLayout = React.useMemo(() => {
    var base = layoutObj && Array.isArray(layoutObj.order) ? layoutObj : {
      order: buildMigratedOrder(),
      hidden: []
    };
    var hidden = Array.isArray(base.hidden) ? base.hidden : [];
    var seen = {};
    var alive = k => {
      if (k.startsWith("h:")) return habits.some(h => "h:" + h.id === k);
      if (k.startsWith("g:")) return goals.some(g => "g:" + g.id === k);
      if (k.startsWith("t:")) return teams.some(t => teamKey(t) === k);
      if (k.startsWith("w:")) return BOS_HOME_WIDGETS.some(w => "w:" + w.id === k);
      return false;
    };
    var order = base.order.filter(k => {
      if (seen[k] || !alive(k)) return false;
      seen[k] = 1;
      return true;
    });
    // Добор НОВЫХ привычек/целей/кругов: сразу на главную — после последней плитки своего вида.
    var insertAfterLast = (pref, key) => {
      var at = -1;
      order.forEach((k, i) => {
        if (k.indexOf(pref) === 0) at = i;
      });
      if (at >= 0) order.splice(at + 1, 0, key);else order.push(key);
    };
    habits.forEach(h => {
      var k = "h:" + h.id;
      if (!seen[k] && hidden.indexOf(k) < 0) {
        insertAfterLast("h:", k);
        seen[k] = 1;
      }
    });
    goals.forEach(g => {
      var k = "g:" + g.id;
      if (!seen[k] && hidden.indexOf(k) < 0) {
        insertAfterLast("g:", k);
        seen[k] = 1;
      }
    });
    // Совместные цели — тоже ПЛИТКАМИ на доске (David: «захочу цель на главной»); прежний
    // авто-виджет «Вместе» больше не добавляем сами — он остался в галерее как сводка по желанию.
    teams.forEach(t => {
      var k = teamKey(t);
      if (!seen[k] && hidden.indexOf(k) < 0) {
        insertAfterLast("t:", k);
        seen[k] = 1;
      }
    });
    // «Быстрое добавление» (w:quick, лента челленджей со стр. «Привычки») добирается САМО —
    // как плитки, а не как виджеты: у существующих юзеров order давно персистнут без него.
    // Правило видимости: НЕ в hidden. Встаёт сразу после сводки (hero) или в начало доски.
    if (!seen["w:quick"] && hidden.indexOf("w:quick") < 0) {
      var hi = order.indexOf("w:hero");
      order.splice(hi >= 0 ? hi + 1 : 0, 0, "w:quick");
      seen["w:quick"] = 1;
    }
    return {
      order,
      hidden
    };
  }, [layoutObj, habits, goals, teams, widgets]);
  var saveLayout = patch => {
    if (app?.setHomeLayout) app.setHomeLayout({
      ...effLayout,
      ...patch
    });
  };
  // Миграция фиксируется ОДИН раз (иначе шторка «+» видела бы пустой layout). Гидрация из
  // облака позже спокойно перекроет это своим сохранённым homeLayout.
  React.useEffect(() => {
    if (!layoutObj && !trulyNew && app?.setHomeLayout) app.setHomeLayout(effLayout);
  }, [!!layoutObj, trulyNew]);
  var hideKey = k => saveLayout({
    order: effLayout.order.filter(x => x !== k),
    hidden: effLayout.hidden.indexOf(k) < 0 ? effLayout.hidden.concat([k]) : effLayout.hidden
  });

  // Each widget's content. Returns null when a widget is ON but has nothing to show
  // right now (e.g. mood logged today with <2 days of history) — it then drops off the
  // board but stays «on» (not offered in the add sheet). No per-widget marginTop: the
  // board's gap owns the spacing.
  var nodeOf = id => {
    if (id === "hero") {
      return /*#__PURE__*/React.createElement("div", {
        "data-tour": "aihints",
        style: {
          position: "relative"
        }
      }, /*#__PURE__*/React.createElement(HomeHeroSwipeLive, {
        navigate: navigate,
        doneCount: doneCount,
        totalCount: totalCount,
        ringPct: ringPct,
        isDark: isDark
      }), celebrate && /*#__PURE__*/React.createElement("div", {
        key: celebrate.key,
        "aria-hidden": true,
        style: {
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 6,
          overflow: "visible"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          position: "absolute",
          top: 66,
          right: 16,
          whiteSpace: "nowrap",
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          background: "#0a0a0a",
          color: "#FEDE34",
          fontSize: celebrate.full ? 13 : 12,
          fontWeight: 800,
          padding: celebrate.full ? "7px 12px" : "5px 10px",
          borderRadius: 999,
          boxShadow: "0 8px 22px rgba(0,0,0,0.3)",
          animation: "bosXpPop 1.15s cubic-bezier(0.22,1,0.36,1) forwards"
        }
      }, "\u2726 +", celebrate.xp, " XP", celebrate.full ? " · день закрыт" : ""), celebrate.full && [0, 1, 2, 3, 4, 5, 6, 7].map(i => {
        var a = i / 8 * Math.PI * 2;
        return /*#__PURE__*/React.createElement("span", {
          key: i,
          style: {
            position: "absolute",
            top: 52,
            right: 52,
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "#FEDE34",
            boxShadow: "0 0 6px #FEDE34",
            animation: "bosSpark 0.9s ease-out forwards",
            ["--sx"]: Math.cos(a) * 44 + "px",
            ["--sy"]: Math.sin(a) * 44 + "px"
          }
        });
      })));
    }
    if (id === "level") {
      // Gold LEVEL banner — turns the bare stat into a hook ("every habit is XP — learn how to grow").
      return /*#__PURE__*/React.createElement("div", {
        style: {
          borderRadius: 22,
          overflow: "hidden",
          transform: "translateZ(0)",
          boxShadow: "0 10px 26px rgba(239,159,20,0.30)"
        }
      }, /*#__PURE__*/React.createElement(SwipeRow, {
        rowBg: "linear-gradient(135deg,#FEDE34,#EF9F14)",
        dark: isDark,
        actions: [{
          key: "hide",
          tone: "delete",
          label: "Убрать",
          icon: I.X,
          onAction: () => hideKey("w:level")
        }]
      }, /*#__PURE__*/React.createElement("button", {
        onClick: () => navigate("levels"),
        className: "tap",
        style: {
          width: "100%",
          border: 0,
          padding: "15px 17px",
          background: "transparent",
          color: "#0a0a0a",
          display: "flex",
          alignItems: "center",
          gap: 13,
          textAlign: "left"
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          width: 44,
          height: 44,
          borderRadius: 14,
          background: "rgba(255,255,255,0.5)",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          fontSize: 22
        }
      }, "\uD83C\uDFC6"), /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1,
          minWidth: 0
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          alignItems: "baseline",
          gap: 6
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 15.5,
          fontWeight: 700,
          letterSpacing: "-0.2px"
        }
      }, "\u0423\u0440\u043E\u0432\u0435\u043D\u044C ", _lvl.level), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11.5,
          fontWeight: 700,
          opacity: 0.55
        }
      }, _liveXP, " XP")), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 12.5,
          color: "rgba(0,0,0,0.62)",
          marginTop: 2,
          lineHeight: 1.35
        }
      }, "\u041A\u0430\u0436\u0434\u0430\u044F \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0430 \u2014 \u044D\u0442\u043E \u043E\u043F\u044B\u0442. \u0423\u0437\u043D\u0430\u0439, \u043A\u0430\u043A \u0440\u0430\u0441\u0442\u0438 \u2192"), /*#__PURE__*/React.createElement("span", {
        style: {
          display: "block",
          height: 5,
          borderRadius: 999,
          background: "rgba(0,0,0,0.14)",
          overflow: "hidden",
          marginTop: 8
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          display: "block",
          height: "100%",
          width: _lvl.pct + "%",
          borderRadius: 999,
          background: "rgba(0,0,0,0.82)"
        }
      }))), /*#__PURE__*/React.createElement(I.ChevronRight, {
        size: 20,
        color: "rgba(0,0,0,0.45)"
      }))));
    }
    if (id === "quick") {
      // Лента челленджей (быстрое добавление) — переехала со страницы «Привычки».
      return /*#__PURE__*/React.createElement(HomeQuickStripLive, {
        isDark: isDark
      });
    }
    if (id === "week") {
      // «Эта неделя» replaces the old date card (the date already shows in the greeting). A 7-day
      // activity strip; tap → history. Title lives INSIDE the card («всё внутри блоков»).
      var _wk = typeof bosWeekKeys === "function" ? bosWeekKeys() : [];
      var _active = habits.length ? _wk.filter(k => habits.some(h => h.log && h.log[k])).length : 0;
      return /*#__PURE__*/React.createElement("button", {
        className: "tap",
        onClick: () => navigate("history"),
        style: {
          width: "100%",
          background: cardBg,
          border: cardBorder,
          borderRadius: 22,
          padding: "14px 15px",
          textAlign: "left",
          boxShadow: cardShadow,
          color: "var(--text)"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 14.5,
          fontWeight: 600,
          letterSpacing: "-0.2px"
        }
      }, "\u042D\u0442\u0430 \u043D\u0435\u0434\u0435\u043B\u044F"), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 12,
          color: "var(--text-4)",
          fontWeight: 500
        }
      }, _active, " \u0438\u0437 7 \u203A")), /*#__PURE__*/React.createElement(HomeWeekStripLive, {
        habits: habits,
        isDark: isDark
      }));
    }
    if (id === "team") {
      // «Команды» — its own full-width widget (David picked variant A: teams separate). Glass tile
      // + standard grey glass discs for emblems; tap → community.
      return /*#__PURE__*/React.createElement("button", {
        className: "tap",
        onClick: () => navigate("community"),
        style: {
          width: "100%",
          background: cardBg,
          border: cardBorder,
          borderRadius: 22,
          padding: "14px 15px",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          gap: 12,
          boxShadow: cardShadow,
          color: "var(--text)"
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          width: 40,
          height: 40,
          borderRadius: 13,
          background: BOS_TILE_SHEEN + ", " + iconBg,
          boxShadow: bosTileGlass(isDark),
          display: "grid",
          placeItems: "center",
          fontSize: 20,
          flexShrink: 0
        }
      }, "\uD83D\uDC65"), /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1,
          minWidth: 0
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 14.5,
          fontWeight: 600,
          color: "var(--text)",
          letterSpacing: "-0.2px"
        }
      }, "\u0412\u043C\u0435\u0441\u0442\u0435"), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 12,
          color: "var(--text-4)",
          marginTop: 1
        }
      }, teams.length ? teams.length + " " + ruTeam(teams.length) + " · ведёте вместе" : "Создай первую совместную цель")), teams.length > 0 ? /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          flexShrink: 0
        }
      }, teams.slice(0, 4).map((t, i) => /*#__PURE__*/React.createElement("span", {
        key: t._id || i,
        title: t.name,
        style: {
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "linear-gradient(150deg, var(--disc-a, #eef1f6), var(--disc-b, #dadfe7))",
          boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.08), 0 0 0 2px " + (isDark ? "#0a0a0a" : "#fff"),
          marginLeft: i ? -9 : 0,
          display: "grid",
          placeItems: "center",
          fontSize: 15,
          lineHeight: 1
        }
      }, bosIcon(t.emblem || "👥", 15, t.accent)))) : /*#__PURE__*/React.createElement("span", {
        style: {
          width: 30,
          height: 30,
          borderRadius: "50%",
          background: "var(--cta, #0a0a0a)",
          color: "var(--cta-ink, #fff)",
          display: "grid",
          placeItems: "center",
          flexShrink: 0
        }
      }, /*#__PURE__*/React.createElement(I.Plus, {
        size: 16
      })));
    }
    if (id === "mood") {
      // State check-in (not logged today) → the once-a-day slider; logged + ≥2 days → streak widget.
      var _tk = typeof bosTodayKey === "function" ? bosTodayKey() : "";
      var _loggedToday = !!(app?.dayMoods && app.dayMoods[_tk] != null);
      var _hideAction = [{
        key: "hide",
        tone: "delete",
        label: "Убрать",
        icon: I.X,
        onAction: () => hideKey("w:mood")
      }];
      if (!_loggedToday) {
        return /*#__PURE__*/React.createElement("div", {
          style: {
            borderRadius: 22,
            overflow: "hidden",
            boxShadow: cardShadow,
            transform: "translateZ(0)"
          }
        }, /*#__PURE__*/React.createElement(SwipeRow, {
          rowBg: rowBg,
          dark: isDark,
          actions: _hideAction
        }, /*#__PURE__*/React.createElement(StateSliderLive, {
          app: app,
          isDark: isDark
        })));
      }
      if (mood && typeof bosMoodDays === "function" && bosMoodDays(app?.dayMoods) >= 2) {
        return /*#__PURE__*/React.createElement("div", {
          style: {
            borderRadius: 22,
            overflow: "hidden",
            boxShadow: cardShadow,
            transform: "translateZ(0)"
          }
        }, /*#__PURE__*/React.createElement(SwipeRow, {
          rowBg: rowBg,
          dark: isDark,
          actions: _hideAction
        }, /*#__PURE__*/React.createElement(MoodWidgetLive, {
          mood: mood,
          app: app,
          isDark: isDark,
          navigate: navigate,
          flush: true
        })));
      }
      return null;
    }
    if (id === "invite") {
      // Invite / share — GOLD banner (David: «как баннер уровня»): same reward-gold language as the
      // level banner, dark ink on gold. The «+150 XP» badge flips to a dark pill for contrast on gold.
      return /*#__PURE__*/React.createElement("div", {
        style: {
          borderRadius: 22,
          overflow: "hidden",
          transform: "translateZ(0)",
          boxShadow: "0 10px 26px rgba(239,159,20,0.30)"
        }
      }, /*#__PURE__*/React.createElement(SwipeRow, {
        rowBg: "linear-gradient(135deg,#FEDE34,#EF9F14)",
        dark: isDark,
        actions: [{
          key: "hide",
          tone: "delete",
          label: "Убрать",
          icon: I.X,
          onAction: () => hideKey("w:invite")
        }]
      }, /*#__PURE__*/React.createElement("button", {
        "data-tour": "share-app",
        className: "tap",
        onClick: () => openSheet(/*#__PURE__*/React.createElement(ShareAppSheetLive, {
          dark: isDark
        })),
        style: {
          width: "100%",
          padding: "15px 17px",
          border: 0,
          position: "relative",
          background: "transparent",
          color: "#0a0a0a",
          display: "flex",
          alignItems: "center",
          gap: 13,
          textAlign: "left"
        }
      }, /*#__PURE__*/React.createElement("div", {
        "aria-hidden": true,
        style: {
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at 86% 8%, rgba(255,255,255,0.4) 0%, transparent 55%)",
          pointerEvents: "none"
        }
      }), /*#__PURE__*/React.createElement("span", {
        style: {
          width: 44,
          height: 44,
          borderRadius: 14,
          background: "rgba(255,255,255,0.5)",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          color: "#0a0a0a",
          position: "relative"
        }
      }, /*#__PURE__*/React.createElement(I.Share, {
        size: 20
      })), /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1,
          minWidth: 0,
          position: "relative"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 7
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 15.5,
          fontWeight: 700,
          color: "#0a0a0a",
          letterSpacing: "-0.2px"
        }
      }, "\u041F\u043E\u0437\u043E\u0432\u0438 \u0441\u0432\u043E\u0438\u0445"), /*#__PURE__*/React.createElement("span", {
        style: {
          display: "inline-flex",
          alignItems: "center",
          fontSize: 10.5,
          fontWeight: 800,
          color: "#FEDE34",
          background: "#0a0a0a",
          padding: "2px 8px",
          borderRadius: 999,
          flexShrink: 0
        }
      }, "+150 XP")), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 12.5,
          color: "rgba(0,0,0,0.62)",
          marginTop: 3,
          lineHeight: 1.35,
          fontWeight: 500
        }
      }, _inviteFomo)), /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          flexShrink: 0,
          position: "relative"
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          width: 34,
          height: 34,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.55)",
          border: "2px solid rgba(255,255,255,0.6)",
          display: "grid",
          placeItems: "center",
          color: "#0a0a0a"
        }
      }, /*#__PURE__*/React.createElement(I.Plus, {
        size: 16,
        strokeWidth: 2.5
      }))))));
    }
    return null;
  };

  // Виджеты рендерим по layout; упавший/пустой (nodeOf → null, напр. mood без истории) просто
  // не показывается, но МЕСТО в order держит — вернётся сам, когда появится контент.
  var nodes = {};
  effLayout.order.forEach(k => {
    if (k.indexOf("w:") !== 0) return;
    var id = k.slice(2);
    try {
      var n = nodeOf(id);
      if (n != null) nodes[id] = n;
    } catch (e) {}
  });
  var keyVisible = k => k.indexOf("w:") === 0 ? nodes[k.slice(2)] != null : true;
  var visibleKeys = effLayout.order.filter(keyVisible);
  var onReorderKeys = newVisible => {
    var vi = 0;
    var merged = effLayout.order.map(k => keyVisible(k) ? newVisible[vi++] : k);
    saveLayout({
      order: merged
    });
  };
  var gridCtl = React.useRef(null);
  var openAddSheet = () => openSheet(/*#__PURE__*/React.createElement(AddWidgetSheetLive, {
    defs: BOS_HOME_WIDGETS,
    dark: isDark,
    onStyle: () => {
      closeSheet();
      setStyleOpen(true);
    }
  }));
  // Плитка/виджет по ключу. Плитки — ГОЛЫЕ (те же HabitTileLive/GoalTileLive, что на
  // «Привычках»); long-press ловит сетка → меню (Поделиться / Переставить / Убрать с главной).
  var tileFor = k => {
    if (k.indexOf("w:") === 0) {
      var id = k.slice(2);
      return nodes[id] ? /*#__PURE__*/React.createElement(WidgetBoundaryLive, {
        wid: id
      }, nodes[id]) : null;
    }
    if (k.indexOf("h:") === 0) {
      var h = habits.find(x => "h:" + x.id === k);
      return h ? /*#__PURE__*/React.createElement(HabitTileLive, {
        habit: h,
        from: "home"
      }) : null;
    }
    if (k.indexOf("g:") === 0) {
      var g = goals.find(x => "g:" + x.id === k);
      return g ? /*#__PURE__*/React.createElement(GoalTileLive, {
        goal: g,
        from: "home"
      }) : null;
    }
    if (k.indexOf("t:") === 0) {
      var t = teams.find(x => teamKey(x) === k);
      return t && typeof TeamTileLive === "function" ? /*#__PURE__*/React.createElement(TeamTileLive, {
        team: t,
        from: "home"
      }) : null;
    }
    return null;
  };
  var onCellLongPress = k => {
    var enterRe = () => {
      if (gridCtl.current && gridCtl.current.enterReorder) gridCtl.current.enterReorder();
    };
    if (k.indexOf("w:") === 0) {
      enterRe();
      return;
    } // виджет: зажал → сразу тряска (iOS)
    if (k.indexOf("h:") === 0) {
      var h = habits.find(x => "h:" + x.id === k);
      if (!h) {
        enterRe();
        return;
      }
      openSheet(/*#__PURE__*/React.createElement(HabitTileMenuLive, {
        habit: h,
        dark: isDark,
        onShare: () => openSheet(/*#__PURE__*/React.createElement(ShareHabitSheetLive, {
          habit: h,
          dark: isDark
        })),
        onReorder: enterRe,
        deleteIcon: /*#__PURE__*/React.createElement(I.X, {
          size: 18
        }),
        deleteLabel: "\u0423\u0431\u0440\u0430\u0442\u044C \u0441 \u0433\u043B\u0430\u0432\u043D\u043E\u0439",
        onDelete: () => hideKey(k)
      }));
      return;
    }
    if (k.indexOf("g:") === 0) {
      var g = goals.find(x => "g:" + x.id === k);
      if (!g) {
        enterRe();
        return;
      }
      openSheet(/*#__PURE__*/React.createElement(HabitTileMenuLive, {
        habit: g,
        dark: isDark,
        kindLabel: "\u0426\u0435\u043B\u044C",
        onShare: () => openSheet(/*#__PURE__*/React.createElement(ShareGoalSheetLive, {
          goal: g,
          dark: isDark
        })),
        onReorder: enterRe,
        deleteIcon: /*#__PURE__*/React.createElement(I.X, {
          size: 18
        }),
        deleteLabel: "\u0423\u0431\u0440\u0430\u0442\u044C \u0441 \u0433\u043B\u0430\u0432\u043D\u043E\u0439",
        onDelete: () => hideKey(k)
      }));
      return;
    }
    if (k.indexOf("t:") === 0) {
      // Круг: то же меню; «Убрать с главной» прячет ПЛИТКУ (сам круг живёт на «Привычках»
      // и в «Сообществе»), «Поделиться» — та же шторка-приглашение, что на странице Привычки.
      var t = teams.find(x => teamKey(x) === k);
      if (!t) {
        enterRe();
        return;
      }
      openSheet(/*#__PURE__*/React.createElement(HabitTileMenuLive, {
        habit: {
          name: t.name,
          emoji: t.emblem || "👥",
          color: t.accent || t.color
        },
        dark: isDark,
        kindLabel: "\u0421\u043E\u0432\u043C\u0435\u0441\u0442\u043D\u0430\u044F \u0446\u0435\u043B\u044C",
        onShare: () => openSheet(/*#__PURE__*/React.createElement(TeamShareSheet, {
          team: t
        })),
        onReorder: enterRe,
        deleteIcon: /*#__PURE__*/React.createElement(I.X, {
          size: 18
        }),
        deleteLabel: "\u0423\u0431\u0440\u0430\u0442\u044C \u0441 \u0433\u043B\u0430\u0432\u043D\u043E\u0439",
        onDelete: () => hideKey(k)
      }));
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    ref: wrapRef,
    className: "page-in",
    style: {
      padding: "0 12px 24px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "4px 4px 12px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-4)",
      letterSpacing: 0.4
    }
  }, _todayLabel), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 24,
      fontWeight: 800,
      color: "var(--text)",
      letterSpacing: "-0.6px",
      marginTop: 2,
      fontFamily: "var(--bos-title-font)"
    }
  }, userName ? greeting + ", " + userName : greeting + " 👋")), /*#__PURE__*/React.createElement("button", {
    ref: addBtnRef,
    onClick: () => {
      setCreateOpen(true);
      if (window.tgHaptic) {
        try {
          window.tgHaptic("light");
        } catch (e) {}
      }
    },
    className: "tap hit44",
    "aria-label": "\u0421\u043E\u0437\u0434\u0430\u0442\u044C",
    "aria-haspopup": "menu",
    "aria-expanded": createOpen,
    title: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C",
    style: {
      width: 40,
      height: 40,
      borderRadius: 999,
      ...(typeof bosChipGlass === "function" ? bosChipGlass(isDark) : {
        background: "var(--surface-3)"
      }),
      color: isDark ? "#fff" : "var(--text)",
      border: 0,
      display: "grid",
      placeItems: "center",
      flexShrink: 0,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(I.Plus, {
    size: 20,
    strokeWidth: 2.4,
    style: {
      transition: "transform 0.34s cubic-bezier(0.34,1.5,0.4,1)",
      transform: createOpen ? "rotate(45deg)" : "none"
    }
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("notifications", {
      from: "home"
    }),
    className: "tap hit44",
    "aria-label": "\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F",
    style: {
      width: 40,
      height: 40,
      borderRadius: 999,
      ...(typeof bosChipGlass === "function" ? bosChipGlass(isDark) : {
        background: "var(--surface-3)"
      }),
      border: 0,
      padding: 0,
      display: "grid",
      placeItems: "center",
      flexShrink: 0,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      display: "grid",
      placeItems: "center"
    }
  }, /*#__PURE__*/React.createElement(I.Bell, {
    size: 20,
    strokeWidth: 2,
    color: bellIcon
  }), showBellDot && /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: -2,
      right: -2,
      width: 8,
      height: 8,
      borderRadius: "50%",
      background: "var(--accent-red)",
      border: "2px solid " + (isDark ? "#0a0a0a" : "#fff")
    }
  })))), /*#__PURE__*/React.createElement(CreateMenuLive, {
    open: createOpen,
    onClose: () => setCreateOpen(false),
    anchorRef: addBtnRef,
    navigate: navigate
  }), typeof CardStyleMenuLive === "function" && /*#__PURE__*/React.createElement(CardStyleMenuLive, {
    open: styleOpen,
    onClose: () => setStyleOpen(false),
    anchorRef: addBtnRef
  }), trulyNew ? /*#__PURE__*/React.createElement(WidgetBoundaryLive, {
    wid: "hero"
  }, (() => {
    try {
      return nodeOf("hero");
    } catch (e) {
      return null;
    }
  })()) : visibleKeys.length > 0 ? /*#__PURE__*/React.createElement(BosReorderGrid, {
    ids: visibleKeys,
    cols: 2,
    gap: 12,
    ctlRef: gridCtl,
    onReorder: onReorderKeys,
    onLongPress: onCellLongPress,
    onAdd: openAddSheet,
    addLabel: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043D\u0430 \u0433\u043B\u0430\u0432\u043D\u0443\u044E",
    spanFull: k => {
      // Виджеты — во всю ширину; плитки решают сами по своей форме (как на «Привычках»).
      if (!k || k.indexOf("w:") === 0) return true;
      if (k.indexOf("g:") === 0 || k.indexOf("t:") === 0) return goalStyle.form === "banner";
      return cardStyle.form === "rect";
    },
    renderItem: (k, {
      mode
    }) => /*#__PURE__*/React.createElement("div", {
      style: {
        position: "relative",
        height: "100%"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        pointerEvents: mode ? "none" : "auto",
        height: "100%"
      }
    }, tileFor(k)), mode && /*#__PURE__*/React.createElement(WidgetMinusLive, {
      onRemove: () => hideKey(k)
    }))
  }) : /*#__PURE__*/React.createElement("button", {
    onClick: openAddSheet,
    className: "tap",
    style: {
      marginTop: 40,
      width: "100%",
      borderRadius: 22,
      padding: "28px 16px",
      border: "1.5px dashed var(--line)",
      background: "transparent",
      color: "var(--text-3)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 10,
      fontSize: 14,
      fontWeight: 600,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 46,
      height: 46,
      borderRadius: "50%",
      display: "grid",
      placeItems: "center",
      background: BOS_TILE_SHEEN + ", var(--surface-3)",
      boxShadow: bosTileGlass(isDark),
      color: "var(--text)"
    }
  }, /*#__PURE__*/React.createElement(I.Plus, {
    size: 20,
    strokeWidth: 2.5
  })), "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0432\u0438\u0434\u0436\u0435\u0442\u044B \u043D\u0430 \u0433\u043B\u0430\u0432\u043D\u0443\u044E"));
}

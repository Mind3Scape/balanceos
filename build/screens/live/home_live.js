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
function HomeLive() {
  var {
    navigate
  } = useNav();
  var {
    open: openSheet
  } = useSheet();
  var app = useApp();
  var widgets = app?.widgets || {};
  var mood = app?.mood;
  var wrapRef = React.useRef(null);
  var isDark = useThemeFlag(wrapRef);
  // Habits + goals come from the shared app store, so a check here shows up
  // on the Habits tab too (and vice versa).
  var habits = app?.habits || [];
  var goals = app?.goals || [];
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
    return m === 1 && h !== 11 ? "команда" : m >= 2 && m <= 4 && (h < 10 || h >= 20) ? "команды" : "команд";
  };
  // Live profiles get REAL numbers from the date-keyed habit model.
  var _liveXP = bosLiveXPLive(app);
  var _lvl = bosLevelInfoLive(_liveXP);
  var dayStreak = bosMaxStreak(habits);
  // Витрина для «Вселенной»: при каждом заходе на Главную (открывается каждую сессию) пишем свой
  // ПУБЛИЧНЫЙ уровень + размер системы → у друзей в их Вселенной светятся твои РЕАЛЬНЫЕ данные, а не
  // дефолт. Тот же расчёт уровня, что на «Я»; без колонок pub_* — cloud.js тихо no-op'ит. (Профиль «Я»
  // пишет то же при заходе туда; запись идемпотентна — повтор тем же значением безвреден.)
  React.useEffect(() => {
    if (!(window.bosCloud && window.bosCloud.enabled() && window.bosCloud.savePublicStats)) return;
    var t = setTimeout(() => {
      try {
        window.bosCloud.savePublicStats({
          level: _lvl.level,
          habits: (app?.habits || []).length,
          goals: (app?.goals || []).length
        });
      } catch (e) {}
    }, 1200);
    return () => clearTimeout(t);
  }, [_lvl.level, (app?.habits || []).length, (app?.goals || []).length]);
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

  // Bell red dot — only light it when there are REAL unread team-chat messages —
  // same signal NotificationsScreen uses (loadMessages per cloud team vs. the
  // per-team "bos:chatread:" timestamp). If the cloud is off or nothing's unread,
  // the dot stays hidden (no fake alert).
  var [hasUnread, setHasUnread] = React.useState(false);
  React.useEffect(() => {
    if (!(window.bosCloud && window.bosCloud.enabled())) {
      setHasUnread(false);
      return;
    }
    var on = true;
    (async () => {
      try {
        var me = await window.bosCloud.uid();
        var cloudTeams = (app?.teams || []).filter(t => t.cloudId);
        var _loop = async function () {
            var rows = await window.bosCloud.loadMessages(t.cloudId);
            if (!Array.isArray(rows) || !rows.length) return 0; // continue
            var lastRead = Number(localStorage.getItem("bos:chatread:" + t.cloudId) || 0);
            if (rows.some(r => r && r.user_id !== me && new Date(r.created_at).getTime() > lastRead)) {
              if (on) setHasUnread(true);
              return {
                v: void 0
              };
            }
          },
          _ret;
        for (var t of cloudTeams) {
          _ret = await _loop();
          if (_ret === 0) continue;
          if (_ret) return _ret.v;
        }
        if (on) setHasUnread(false);
      } catch (e) {
        if (on) setHasUnread(false);
      }
    })();
    return () => {
      on = false;
    };
  }, [teams]);
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

  // ── Widget board plumbing ────────────────────────────────────────────────────
  var DEFAULT_ORDER = BOS_HOME_WIDGETS.map(w => w.id);
  // «invite» (Позови своих) is OFF by default on the home board (David: «убираем с главной / скрой
  // по дефолту») — the invite path lives in «Найти». Still re-addable via the widget sheet (opt-in:
  // needs widgets.invite === true). Every other widget: on unless explicitly hidden.
  var isWidgetOn = id => id === "invite" ? widgets.invite === true : widgets[id] !== false;
  var hideWidget = id => app.setWidgets({
    ...widgets,
    [id]: false
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
          onAction: () => hideWidget("level")
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
      }, "\u041A\u043E\u043C\u0430\u043D\u0434\u044B"), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 12,
          color: "var(--text-4)",
          marginTop: 1
        }
      }, teams.length ? teams.length + " " + ruTeam(teams.length) + " · ведёте вместе" : "Создай свою первую")), teams.length > 0 ? /*#__PURE__*/React.createElement("div", {
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
          background: "linear-gradient(150deg,#eef1f6,#dadfe7)",
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
          background: "#0a0a0a",
          color: "#fff",
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
        onAction: () => hideWidget("mood")
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
    if (id === "habits") {
      // «Всё внутри блоков» (David): the «Привычки» title lives INSIDE one grouped card, with the
      // habit rows stacked below it (hairline dividers, per-row swipe kept). HOME ONLY — the
      // Habits tab keeps its fuller separate-card view untouched.
      return /*#__PURE__*/React.createElement("div", {
        style: {
          background: cardBg,
          border: cardBorder,
          borderRadius: 22,
          boxShadow: cardShadow,
          overflow: "hidden",
          color: "var(--text)",
          transform: "translateZ(0)"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "13px 15px 11px"
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 14.5,
          fontWeight: 600,
          letterSpacing: "-0.2px"
        }
      }, "\u041F\u0440\u0438\u0432\u044B\u0447\u043A\u0438"), habits.length > 0 && /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 12,
          color: "var(--text-4)",
          fontWeight: 500
        }
      }, doneCount, " \u0438\u0437 ", totalCount)), habits.length === 0 ? /*#__PURE__*/React.createElement("button", {
        className: "tap",
        onClick: () => navigate("habit-settings", {
          mode: "create"
        }),
        style: {
          width: "100%",
          background: "transparent",
          border: 0,
          padding: "6px 20px 26px",
          color: "var(--text)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 10
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          width: 52,
          height: 52,
          borderRadius: 16,
          background: iconBg,
          display: "grid",
          placeItems: "center",
          fontSize: 26
        }
      }, "\uD83C\uDF31"), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 15,
          fontWeight: 600
        }
      }, "\u0417\u0434\u0435\u0441\u044C \u0431\u0443\u0434\u0443\u0442 \u0442\u0432\u043E\u0438 \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0438"), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 12.5,
          color: "var(--text-4)",
          lineHeight: 1.45,
          maxWidth: 235
        }
      }, "\u041D\u0430\u0447\u043D\u0438 \u0441 \u043E\u0434\u043D\u043E\u0439 \u043C\u0430\u043B\u0435\u043D\u044C\u043A\u043E\u0439 \u2014 \u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440, \u0441\u0442\u0430\u043A\u0430\u043D \u0432\u043E\u0434\u044B \u0443\u0442\u0440\u043E\u043C."), /*#__PURE__*/React.createElement("span", {
        style: {
          marginTop: 4,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: isDark ? "#fff" : "#0a0a0a",
          color: isDark ? "#0a0a0a" : "#fff",
          borderRadius: 999,
          padding: "9px 16px",
          fontSize: 14,
          fontWeight: 600
        }
      }, /*#__PURE__*/React.createElement(I.Plus, {
        size: 15,
        strokeWidth: 2.5
      }), " \u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0443")) : /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          flexDirection: "column"
        }
      }, habits.map((h, hi) => /*#__PURE__*/React.createElement("div", {
        key: h.id,
        style: {
          borderTop: hi ? "1px solid " + dividerLn : "0"
        }
      }, /*#__PURE__*/React.createElement(SwipeRow, {
        rowBg: rowBg,
        dark: isDark,
        actions: [{
          key: "share",
          tone: "share",
          label: "Поделиться",
          icon: I.Share,
          onAction: () => openSheet(/*#__PURE__*/React.createElement(ShareHabitSheetLive, {
            habit: h,
            dark: isDark
          }))
        }, {
          key: "del",
          tone: "delete",
          label: "Удалить",
          icon: I.X,
          onAction: () => bosConfirmDelete(openSheet, {
            title: "Удалить привычку?",
            message: "«" + h.name + "» и вся история отметок удалятся навсегда.",
            confirmLabel: "Удалить",
            onConfirm: () => remove(h.id)
          })
        }]
      }, /*#__PURE__*/React.createElement("div", {
        className: "tap",
        onClick: () => navigate("habit-detail", {
          habit: h,
          from: "home"
        }),
        style: {
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "12px 15px"
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          width: 38,
          height: 38,
          borderRadius: 13,
          background: BOS_TILE_SHEEN + ", " + (h.color ? h.color + "26" : iconBg),
          boxShadow: bosTileGlass(isDark),
          display: "grid",
          placeItems: "center",
          fontSize: 19,
          flexShrink: 0
        }
      }, bosIcon(h.emoji, 21, h.color)), /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1,
          minWidth: 0
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 15.5,
          fontWeight: 600,
          color: "var(--text)",
          letterSpacing: "-0.2px"
        }
      }, h.name), (h.shareCode || h.duration > 0) && /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginTop: 3,
          flexWrap: "wrap",
          fontSize: 11,
          color: "var(--text-4)"
        }
      }, h.duration > 0 && /*#__PURE__*/React.createElement("span", {
        style: {
          display: "inline-flex",
          alignItems: "center",
          gap: 3
        }
      }, /*#__PURE__*/React.createElement(I.Clock, {
        size: 11
      }), " ", h.duration, " \u043C\u0438\u043D"), /*#__PURE__*/React.createElement(HabitBuddyAvatarsLive, {
        habit: h,
        size: 16,
        max: 5
      }), typeof CircleFacesLive === "function" && /*#__PURE__*/React.createElement(CircleFacesLive, {
        habit: h,
        size: 16,
        max: 5
      }))), h.duration > 0 && !h.done && !(h.goalPerDay > 1) && /*#__PURE__*/React.createElement(HabitRing, {
        habit: h,
        dark: isDark,
        onComplete: () => {
          if (!h.done) toggle(h.id);
        }
      }), h.goalPerDay > 1 ? /*#__PURE__*/React.createElement(HabitCountCheck, {
        habit: h,
        app: app,
        xp: XP_PER_HABIT
      }) : /*#__PURE__*/React.createElement(HabitCheck, {
        done: h.done,
        onToggle: () => toggle(h.id),
        xp: XP_PER_HABIT,
        float: true
      })))))));
    }
    if (id === "goals") {
      // Grouped «Цели» card — title INSIDE, goal rows below (hairline dividers). HOME ONLY.
      return /*#__PURE__*/React.createElement("div", {
        style: {
          background: cardBg,
          border: cardBorder,
          borderRadius: 22,
          boxShadow: cardShadow,
          overflow: "hidden",
          color: "var(--text)",
          transform: "translateZ(0)"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "13px 15px 11px"
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 14.5,
          fontWeight: 600,
          letterSpacing: "-0.2px"
        }
      }, "\u0426\u0435\u043B\u0438"), goals.length > 0 && /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 12,
          color: "var(--text-4)",
          fontWeight: 500
        }
      }, goals.length)), goals.length === 0 ? /*#__PURE__*/React.createElement("button", {
        className: "tap",
        onClick: () => navigate("goal-settings", {
          mode: "create"
        }),
        style: {
          width: "100%",
          background: "transparent",
          border: 0,
          padding: "6px 20px 26px",
          color: "var(--text)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 10
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          width: 52,
          height: 52,
          borderRadius: 16,
          background: iconBg,
          display: "grid",
          placeItems: "center",
          fontSize: 26
        }
      }, "\uD83C\uDFAF"), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 15,
          fontWeight: 600
        }
      }, "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u0446\u0435\u043B\u0435\u0439"), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 12.5,
          color: "var(--text-4)",
          lineHeight: 1.45,
          maxWidth: 235
        }
      }, "\u0411\u043E\u043B\u044C\u0448\u0430\u044F \u0446\u0435\u043B\u044C \u2014 \u044D\u0442\u043E \u043C\u0430\u043B\u0435\u043D\u044C\u043A\u0438\u0435 \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0438, \u0441\u043B\u043E\u0436\u0435\u043D\u043D\u044B\u0435 \u0432\u043C\u0435\u0441\u0442\u0435."), /*#__PURE__*/React.createElement("span", {
        style: {
          marginTop: 4,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: isDark ? "#fff" : "#0a0a0a",
          color: isDark ? "#0a0a0a" : "#fff",
          borderRadius: 999,
          padding: "9px 16px",
          fontSize: 14,
          fontWeight: 600
        }
      }, /*#__PURE__*/React.createElement(I.Plus, {
        size: 15,
        strokeWidth: 2.5
      }), " \u041F\u043E\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u0446\u0435\u043B\u044C")) : /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          flexDirection: "column"
        }
      }, goals.map((g, gi) => {
        var pct = g.target ? g.current / g.target : 0;
        return /*#__PURE__*/React.createElement("div", {
          key: g.id,
          style: {
            borderTop: gi ? "1px solid " + dividerLn : "0"
          }
        }, /*#__PURE__*/React.createElement(SwipeRow, {
          rowBg: rowBg,
          dark: isDark,
          actions: [{
            key: "share",
            tone: "share",
            label: "Поделиться",
            icon: I.Share,
            onAction: () => openSheet(/*#__PURE__*/React.createElement(ShareGoalSheetLive, {
              goal: g,
              dark: isDark
            }))
          }, {
            key: "del",
            tone: "delete",
            label: "Удалить",
            icon: I.X,
            onAction: () => bosConfirmDelete(openSheet, {
              title: "Удалить цель?",
              message: "«" + g.name + "» удалится навсегда.",
              confirmLabel: "Удалить",
              onConfirm: () => removeGoal(g.id)
            })
          }]
        }, /*#__PURE__*/React.createElement("div", {
          className: "tap",
          onClick: () => navigate("goal-detail", {
            goal: g,
            from: "home"
          }),
          style: {
            padding: "13px 15px",
            color: "var(--text)",
            cursor: "pointer"
          }
        }, /*#__PURE__*/React.createElement("div", {
          style: {
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 10
          }
        }, /*#__PURE__*/React.createElement("span", {
          style: {
            width: 36,
            height: 36,
            borderRadius: 13,
            background: BOS_TILE_SHEEN + ", " + (g.color ? g.color + "26" : iconBg),
            boxShadow: bosTileGlass(isDark),
            display: "grid",
            placeItems: "center",
            fontSize: 18
          }
        }, bosIcon(g.emoji, 20, g.color)), /*#__PURE__*/React.createElement("div", {
          style: {
            flex: 1
          }
        }, /*#__PURE__*/React.createElement("div", {
          style: {
            fontSize: 15.5,
            color: "var(--text)",
            fontWeight: 600
          }
        }, g.name), /*#__PURE__*/React.createElement("div", {
          style: {
            fontSize: 11,
            color: "var(--text-4)"
          }
        }, g.current, " / ", g.target, " ", g.unit)), /*#__PURE__*/React.createElement("span", {
          style: {
            fontSize: 14,
            fontWeight: 700,
            color: "var(--text-2)"
          }
        }, Math.round(pct * 100), "%")), /*#__PURE__*/React.createElement("div", {
          className: "bos-progress"
        }, /*#__PURE__*/React.createElement("span", {
          style: {
            width: pct * 100 + "%",
            background: "linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0) 72%), " + (g.color || "#0a0a0a")
          }
        })))));
      })));
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
          onAction: () => hideWidget("invite")
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

  // Saved order (only known ids), with any new/missing widget ids appended so they still appear.
  var savedOrder = (Array.isArray(widgets.order) ? widgets.order : []).filter(id => DEFAULT_ORDER.includes(id));
  var fullOrder = [...savedOrder, ...DEFAULT_ORDER.filter(id => !savedOrder.includes(id))];
  var nodes = {};
  fullOrder.forEach(id => {
    if (isWidgetOn(id)) {
      var n = nodeOf(id);
      if (n != null) nodes[id] = n;
    }
  });
  var visibleIds = fullOrder.filter(id => nodes[id] != null);

  // Reorder commits the new VISIBLE order back into the full order, keeping any hidden ids in
  // place — so a removed-then-re-added widget returns to roughly where it was.
  var onReorderWidgets = newVisible => {
    var vi = 0;
    var merged = fullOrder.map(id => visibleIds.indexOf(id) >= 0 ? newVisible[vi++] : id);
    app.setWidgets({
      ...widgets,
      order: merged
    });
  };
  var openAddSheet = () => openSheet(/*#__PURE__*/React.createElement(AddWidgetSheetLive, {
    defs: BOS_HOME_WIDGETS,
    dark: isDark
  }));
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
      background: "transparent",
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
  }), trulyNew ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("habit-settings", {
      mode: "create"
    }),
    className: "tap",
    style: {
      width: "100%",
      border: 0,
      borderRadius: 22,
      padding: "28px 20px",
      cursor: "pointer",
      textAlign: "center",
      background: cardBg,
      boxShadow: cardShadow,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 12,
      color: "var(--text)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 60,
      height: 60,
      borderRadius: 18,
      background: BOS_TILE_SHEEN + ", var(--surface-3)",
      boxShadow: bosTileGlass(isDark),
      display: "grid",
      placeItems: "center",
      fontSize: 30
    }
  }, "\uD83C\uDF31"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      letterSpacing: "-0.3px"
    }
  }, "\u0421\u043E\u0437\u0434\u0430\u0439 \u043F\u0435\u0440\u0432\u0443\u044E \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0443"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: "var(--text-4)",
      lineHeight: 1.45,
      maxWidth: 270
    }
  }, "\u041D\u0430\u0447\u043D\u0438 \u0441 \u043E\u0434\u043D\u043E\u0439 \u043C\u0430\u043B\u0435\u043D\u044C\u043A\u043E\u0439 \u2014 \u0441\u0442\u0430\u043A\u0430\u043D \u0432\u043E\u0434\u044B \u0438\u043B\u0438 5 \u043C\u0438\u043D\u0443\u0442 \u0447\u0442\u0435\u043D\u0438\u044F. \u041E\u0441\u0442\u0430\u043B\u044C\u043D\u043E\u0435 \u0441\u043E\u0431\u0435\u0440\u0451\u0442\u0441\u044F \u043F\u043E \u0445\u043E\u0434\u0443."), /*#__PURE__*/React.createElement("span", {
    style: {
      marginTop: 4,
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      background: isDark ? "#fff" : "#0a0a0a",
      color: isDark ? "#0a0a0a" : "#fff",
      borderRadius: 999,
      padding: "11px 20px",
      fontSize: 15,
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement(I.Plus, {
    size: 17,
    strokeWidth: 2.6
  }), " \u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0443")), nodes["hero"] || null) : visibleIds.length > 0 ? /*#__PURE__*/React.createElement(BosReorderList, {
    ids: visibleIds,
    gap: 12,
    onReorder: onReorderWidgets,
    onAdd: openAddSheet,
    addLabel: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0432\u0438\u0434\u0436\u0435\u0442",
    renderItem: (id, {
      mode
    }) => /*#__PURE__*/React.createElement("div", {
      style: {
        position: "relative"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        pointerEvents: mode ? "none" : "auto"
      }
    }, nodes[id]), mode && /*#__PURE__*/React.createElement(WidgetMinusLive, {
      onRemove: () => hideWidget(id)
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

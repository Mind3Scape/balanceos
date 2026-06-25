/* HOME — LIVE-only fork of HomeScreen (real Telegram user, app.mode === "live"
   is ALWAYS true here). The demo/fresh branches are stripped: no segmented
   Привычки/Цели toggle, no demo balance-wheel / demo stat strip / demo MoodWidget,
   no fresh «Что дальше?» banner. Everything else reuses the shared core/ toolkit
   (HeroOrbFace, HabitCheck, HabitRing, AvatarStack, bosPill* helpers) + the live
   forks in screens/live/shared_live.jsx (HomeHeroSwipeLive, MoodWidgetLive,
   ShareAppSheetLive, ShareHabitSheetLive) + framework (SwipeRow, BosOrbFace, I,
   hooks, the bos* helpers). The ONLY new top-level
   declaration in this file is `function HomeLive`. */
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
  // The gold level banner is the live home's XP hero — on by default, but the user can
  // swipe it away (David: "я всё понял про уровни, хочу только привычки") → widgets.level
  // = false; re-addable in «Виджеты главного».
  var _showLevelBanner = widgets.level !== false;
  var dayStreak = bosMaxStreak(habits);
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
    onClick: () => navigate("notifications", {
      from: "home"
    }),
    className: "tap",
    style: {
      width: 42,
      height: 42,
      borderRadius: 14,
      background: iconBg,
      border: 0,
      display: "grid",
      placeItems: "center",
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement(I.Bell, {
    size: 18,
    color: bellIcon
  }), showBellDot && /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 8,
      right: 8,
      width: 8,
      height: 8,
      borderRadius: "50%",
      background: "var(--accent-red)",
      border: "2px solid " + (isDark ? "#0a0a0a" : "#fff")
    }
  }))), /*#__PURE__*/React.createElement("div", {
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
  }))), _showLevelBanner && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      borderRadius: 22,
      overflow: "hidden",
      boxShadow: "0 10px 26px rgba(239,159,20,0.30)"
    }
  }, /*#__PURE__*/React.createElement(SwipeRow, {
    rowBg: "linear-gradient(135deg,#FEDE34,#EF9F14)",
    dark: isDark,
    actions: [{
      key: "hide",
      tone: "delete",
      label: "Убрать",
      icon: I.Trash,
      onAction: () => app.setWidgets({
        ...widgets,
        level: false
      })
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
  })))), (widgets.calendar !== false || widgets.team !== false) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: widgets.calendar !== false && widgets.team !== false ? "1fr 1fr" : "1fr",
      gap: 8,
      marginTop: 8
    }
  }, widgets.calendar !== false && /*#__PURE__*/React.createElement("button", {
    className: "tap",
    onClick: () => navigate("history"),
    style: {
      background: cardBg,
      border: cardBorder,
      borderRadius: 22,
      padding: "14px 14px 12px",
      textAlign: "left",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      boxShadow: cardShadow,
      color: "var(--text)"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1,
      fontWeight: 600
    }
  }, "\u041A\u0430\u043B\u0435\u043D\u0434\u0430\u0440\u044C"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: "var(--text-2)",
      marginTop: 4,
      fontWeight: 500
    }
  }, _calLabel)), /*#__PURE__*/React.createElement(I.Calendar, {
    size: 28,
    color: isDark ? "rgba(255,255,255,0.7)" : "#787878",
    strokeWidth: 1.5
  })), widgets.team !== false && /*#__PURE__*/React.createElement("button", {
    className: "tap",
    onClick: () => navigate("community"),
    style: {
      background: cardBg,
      border: cardBorder,
      borderRadius: 22,
      padding: "14px 14px 12px",
      textAlign: "left",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      boxShadow: cardShadow,
      color: "var(--text)"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1,
      fontWeight: 600
    }
  }, "\u041A\u043E\u043C\u0430\u043D\u0434\u044B"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: "var(--text-2)",
      marginTop: 4,
      fontWeight: 500
    }
  }, teams.length ? teams.length + " " + ruTeam(teams.length) : "Создай команду")), teams.length > 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex"
    }
  }, teams.slice(0, 4).map((t, i) => /*#__PURE__*/React.createElement("span", {
    key: t._id || i,
    title: t.name,
    style: {
      width: 28,
      height: 28,
      borderRadius: "50%",
      background: t.accent || "var(--surface-3)",
      border: "2px solid " + (isDark ? "#0a0a0a" : "#fff"),
      marginLeft: i ? -10 : 0,
      display: "grid",
      placeItems: "center",
      fontSize: 14,
      lineHeight: 1
    }
  }, t.emblem || "👥"))) : /*#__PURE__*/React.createElement("span", {
    style: {
      width: 30,
      height: 30,
      borderRadius: "50%",
      background: isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)",
      display: "grid",
      placeItems: "center",
      color: "var(--text-3)"
    }
  }, /*#__PURE__*/React.createElement(I.Plus, {
    size: 16
  })))), widgets.mood !== false && (() => {
    var _tk = typeof bosTodayKey === "function" ? bosTodayKey() : "";
    var _loggedToday = !!(app?.dayMoods && app.dayMoods[_tk] != null);
    var _hideAction = [{
      key: "hide",
      tone: "delete",
      label: "Убрать",
      icon: I.Trash,
      onAction: () => app.setWidgets({
        ...widgets,
        mood: false
      })
    }];
    if (!_loggedToday) {
      return /*#__PURE__*/React.createElement("div", {
        style: {
          marginTop: 16,
          borderRadius: 22,
          overflow: "hidden",
          boxShadow: cardShadow
        }
      }, /*#__PURE__*/React.createElement(SwipeRow, {
        rowBg: rowBg,
        dark: isDark,
        actions: _hideAction
      }, /*#__PURE__*/React.createElement(StatePromptLive, {
        app: app,
        isDark: isDark
      })));
    }
    if (mood && typeof bosMoodDays === "function" && bosMoodDays(app?.dayMoods) >= 2) {
      return /*#__PURE__*/React.createElement("div", {
        style: {
          marginTop: 16,
          borderRadius: 22,
          overflow: "hidden",
          boxShadow: cardShadow
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
  })(), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 16,
      color: "var(--text-3)",
      padding: "0 4px"
    }
  }, "\u041F\u0440\u0438\u0432\u044B\u0447\u043A\u0438"), habits.length === 0 ? /*#__PURE__*/React.createElement("button", {
    className: "tap",
    onClick: () => navigate("habit-settings", {
      mode: "create"
    }),
    style: {
      marginTop: 10,
      width: "100%",
      background: cardBg,
      border: cardBorder,
      borderRadius: 22,
      padding: "30px 20px",
      boxShadow: cardShadow,
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
      fontSize: 16,
      fontWeight: 600
    }
  }, "\u0417\u0434\u0435\u0441\u044C \u0431\u0443\u0434\u0443\u0442 \u0442\u0432\u043E\u0438 \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0438"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
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
      marginTop: 10,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      color: "var(--text)"
    }
  }, habits.map(h => /*#__PURE__*/React.createElement("div", {
    key: h.id,
    style: {
      borderRadius: 22,
      overflow: "hidden",
      boxShadow: cardShadow
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
      icon: I.Trash,
      onAction: () => remove(h.id)
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
      padding: "14px 16px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 14,
      background: h.color ? h.color + "26" : iconBg,
      display: "grid",
      placeItems: "center",
      fontSize: 20,
      flexShrink: 0
    }
  }, h.emoji), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 600,
      color: "var(--text)",
      letterSpacing: "-0.2px"
    }
  }, h.name), (h.friends?.length || h.duration) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginTop: 3,
      flexWrap: "wrap",
      fontSize: 11,
      color: "var(--text-4)"
    }
  }, h.duration && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 3
    }
  }, /*#__PURE__*/React.createElement(I.Clock, {
    size: 11
  }), " ", h.duration, " \u043C\u0438\u043D"), h.friends?.length > 0 && /*#__PURE__*/React.createElement(AvatarStack, {
    people: h.friends,
    size: 16,
    max: 3,
    label: false
  }), h.friends?.length > 0 && /*#__PURE__*/React.createElement("span", null, "\u0441\u043E\u0432\u043C\u0435\u0441\u0442\u043D\u043E"))), h.duration && !h.done && /*#__PURE__*/React.createElement(HabitRing, {
    habit: h,
    dark: isDark,
    onComplete: () => {
      if (!h.done) toggle(h.id);
    }
  }), /*#__PURE__*/React.createElement(HabitCheck, {
    done: h.done,
    onToggle: () => toggle(h.id),
    xp: XP_PER_HABIT,
    float: true
  })))))), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 16,
      color: "var(--text-3)",
      padding: "0 4px"
    }
  }, "\u0426\u0435\u043B\u0438"), goals.length === 0 ? /*#__PURE__*/React.createElement("button", {
    className: "tap",
    onClick: () => navigate("goal-settings", {
      mode: "create"
    }),
    style: {
      marginTop: 10,
      width: "100%",
      background: cardBg,
      border: cardBorder,
      borderRadius: 22,
      padding: "30px 20px",
      boxShadow: cardShadow,
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
      fontSize: 16,
      fontWeight: 600
    }
  }, "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u0446\u0435\u043B\u0435\u0439"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
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
      marginTop: 10,
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, goals.map(g => {
    var pct = g.target ? g.current / g.target : 0;
    return /*#__PURE__*/React.createElement("div", {
      key: g.id,
      style: {
        borderRadius: 22,
        overflow: "hidden",
        boxShadow: cardShadow
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
        icon: I.Trash,
        onAction: () => removeGoal(g.id)
      }]
    }, /*#__PURE__*/React.createElement("div", {
      className: "tap",
      onClick: () => navigate("goal-detail", {
        goal: g,
        from: "home"
      }),
      style: {
        background: cardBg,
        border: cardBorder,
        padding: 14,
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
        width: 38,
        height: 38,
        borderRadius: 14,
        background: iconBg,
        display: "grid",
        placeItems: "center",
        fontSize: 18
      }
    }, g.emoji), /*#__PURE__*/React.createElement("div", {
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
        width: pct * 100 + "%"
      }
    })))));
  })), widgets.invite !== false && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      borderRadius: 22,
      overflow: "hidden",
      boxShadow: "0 10px 26px rgba(20,40,80,0.28)"
    }
  }, /*#__PURE__*/React.createElement(SwipeRow, {
    rowBg: "linear-gradient(135deg, #34508c 0%, #1d2c4d 100%)",
    dark: isDark,
    actions: [{
      key: "hide",
      tone: "delete",
      label: "Убрать",
      icon: I.Trash,
      onAction: () => app.setWidgets({
        ...widgets,
        invite: false
      })
    }]
  }, /*#__PURE__*/React.createElement("button", {
    "data-tour": "share-app",
    className: "tap",
    onClick: () => openSheet(/*#__PURE__*/React.createElement(ShareAppSheetLive, {
      dark: isDark
    })),
    style: {
      width: "100%",
      padding: "16px 18px",
      border: 0,
      position: "relative",
      background: "transparent",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      gap: 14,
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      inset: 0,
      background: "radial-gradient(circle at 86% 10%, rgba(255,255,255,0.16) 0%, transparent 52%)",
      pointerEvents: "none"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 44,
      height: 44,
      borderRadius: 14,
      background: "rgba(255,255,255,0.14)",
      display: "grid",
      placeItems: "center",
      flexShrink: 0,
      color: "#fff",
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
      color: "#fff",
      letterSpacing: "-0.2px"
    }
  }, "\u041F\u043E\u0437\u043E\u0432\u0438 \u0441\u0432\u043E\u0438\u0445"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      fontSize: 10.5,
      fontWeight: 800,
      color: "#0a0a0a",
      background: "linear-gradient(135deg, #FEDE34, #EF9F14)",
      padding: "2px 8px",
      borderRadius: 999,
      flexShrink: 0
    }
  }, "+150 XP")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "rgba(255,255,255,0.85)",
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
      background: "rgba(255,255,255,0.16)",
      border: "2px solid rgba(255,255,255,0.3)",
      display: "grid",
      placeItems: "center",
      color: "#fff"
    }
  }, /*#__PURE__*/React.createElement(I.Plus, {
    size: 16,
    strokeWidth: 2.5
  })))))));
}

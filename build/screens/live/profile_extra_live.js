/* PROFILE SUB-SCREENS — LIVE-only forks (real Telegram user, app.mode === "live"
   is ALWAYS true here). Every demo ("Павел") and fresh branch is stripped: no
   curated April-2026 calendar, no scripted sample notifications, no demo
   ACHIEVEMENTS/courses ladder, no demo-only settings rows. Everything is real —
   real history from each habit's log, real Telegram sign-in, the real
   bosEarnedAchievements / BOS_ACHIEVEMENTS ladder, real cloud notifications.

   Reuses the shared globals from profile.jsx (SysCard, SysBtn, OrbitField,
   EditProfileSheet, InfoSheet, FeedbackSheet, AvatarPickerSheet, DayRing) + the
   app-wide globals (PageHeader, Switch, I, hooks useApp/useNav/useSheet, every
   bos* helper, BOS_ACHIEVEMENTS / bosEarnedAchievements, MOOD_OPTIONS, StaticOrb,
   tintFromMood, window.StateOrb, window.ALL_SPHERES / DEFAULT_SPHERES). useP is
   the file-local React.useState alias already defined in profile.jsx.

   TYPOGRAPHY (iOS Headline polish): PRIMARY labels (settings-row labels,
   notification titles, history entry titles, achievement names, section titles)
   carry fontWeight: 600 + color: "var(--text)". Already-700 weights and
   secondary/caption text are left untouched.

   The ONLY new top-level declarations in this file are the seven `…Live`
   components below: SettingsLive, NotificationsLive, HistoryLive, SupportLive,
   AchievementsLive, ManifestLive, IconPickerLive. (GuideScreen is NOT defined in
   profile.jsx — it lives in app.jsx — so no GuideLive fork is made here.) */

function SettingsLive() {
  var {
    navigate
  } = useNav();
  var app = useApp();
  var {
    open: openSheet
  } = useSheet();
  var routeDark = app?.themeOverride !== "light"; // settings is a dark route unless globally forced light
  // Push is a REAL saved setting for live users — persisted to localStorage by profile id,
  // and it gates the Telegram push the bot sends.
  var pushKey = "bos:push:" + (app?.persistId || "live");
  var [push, setPush] = useP(() => {
    try {
      var v = localStorage.getItem(pushKey);
      return v == null ? true : v === "1";
    } catch (e) {
      return true;
    }
  });
  var setPushPersist = on => {
    setPush(on);
    try {
      localStorage.setItem(pushKey, on ? "1" : "0");
    } catch (e) {}
  };
  var isDark = app?.themeOverride === "dark";
  var setDark = on => app?.setThemeOverride(on ? "dark" : "light");
  var wheel = app?.wheelSpheres || window.DEFAULT_SPHERES || [];
  var setWheel = arr => app?.setWheelSpheres && app.setWheelSpheres(arr);
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      padding: "0 16px 24px"
    }
  }, /*#__PURE__*/React.createElement(PageHeader, {
    title: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438",
    onBack: () => navigate("profile")
  }), /*#__PURE__*/React.createElement("div", {
    className: "section-label"
  }, "\u0410\u043A\u043A\u0430\u0443\u043D\u0442"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      marginTop: 8
    }
  }, [{
    label: "Редактировать профиль",
    icon: I.Pencil,
    on: () => openSheet(/*#__PURE__*/React.createElement(EditProfileSheet, {
      dark: routeDark
    }))
  }, {
    label: "Вход через Telegram",
    icon: I.Globe,
    on: () => openSheet(/*#__PURE__*/React.createElement(InfoSheet, {
      title: "\u0412\u0445\u043E\u0434 \u0447\u0435\u0440\u0435\u0437 Telegram",
      body: "\u0422\u044B \u0432\u0445\u043E\u0434\u0438\u0448\u044C \u0447\u0435\u0440\u0435\u0437 \u0441\u0432\u043E\u0439 \u0430\u043A\u043A\u0430\u0443\u043D\u0442 Telegram \u2014 \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u044B\u0439 \u043F\u0430\u0440\u043E\u043B\u044C \u043D\u0435 \u043D\u0443\u0436\u0435\u043D. \u0422\u0432\u043E\u0438 \u0434\u0430\u043D\u043D\u044B\u0435 \u043F\u0440\u0438\u0432\u044F\u0437\u0430\u043D\u044B \u043A \u043D\u0435\u043C\u0443 \u0438 \u043F\u0435\u0440\u0435\u043D\u043E\u0441\u044F\u0442\u0441\u044F \u043C\u0435\u0436\u0434\u0443 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430\u043C\u0438.",
      cta: "\u041F\u043E\u043D\u044F\u0442\u043D\u043E",
      dark: routeDark
    }))
  }].map((r, i) => /*#__PURE__*/React.createElement(SysBtn, {
    key: i,
    onClick: r.on,
    style: {
      padding: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bos-sys-chip-bg",
    style: {
      width: 32,
      height: 32,
      borderRadius: "50%",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, React.createElement(r.icon, {
    size: 16
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 15,
      fontWeight: 600,
      color: "var(--text)"
    }
  }, r.label), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 16,
    className: "bos-sys-text-2"
  })))), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, "\u041F\u0440\u0435\u0434\u043F\u043E\u0447\u0442\u0435\u043D\u0438\u044F"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      marginTop: 8
    }
  }, [
  // Push is real & persisted (gates Telegram push). "Звук" had no consumer and
  // was demo-only — dropped so a real user never meets a toggle that does nothing.
  {
    label: "Push-уведомления",
    icon: I.Bell,
    val: push,
    set: setPushPersist
  }, {
    label: "Тёмная тема",
    icon: I.Eye,
    val: isDark,
    set: setDark
  }].map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "bos-sys-card",
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bos-sys-chip-bg",
    style: {
      width: 32,
      height: 32,
      borderRadius: "50%",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, React.createElement(r.icon, {
    size: 16
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 15,
      fontWeight: 600,
      color: "var(--text)"
    }
  }, r.label), /*#__PURE__*/React.createElement(Switch, {
    on: r.val,
    onChange: r.set,
    dark: isDark
  })))), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, "\u0413\u043B\u0430\u0432\u043D\u044B\u0439 \u044D\u043A\u0440\u0430\u043D"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(SysBtn, {
    onClick: () => navigate("home-customize"),
    style: {
      padding: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bos-sys-chip-bg",
    style: {
      width: 32,
      height: 32,
      borderRadius: "50%",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(I.Home, {
    size: 16
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 15,
      fontWeight: 600,
      color: "var(--text)"
    }
  }, "\u0412\u0438\u0434\u0436\u0435\u0442\u044B \u043D\u0430 \u0433\u043B\u0430\u0432\u043D\u043E\u043C"), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 16,
    className: "bos-sys-text-2"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, "\u041A\u043E\u043B\u0435\u0441\u043E \u0431\u0430\u043B\u0430\u043D\u0441\u0430"), /*#__PURE__*/React.createElement(SysCard, {
    style: {
      padding: 14,
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-2",
    style: {
      fontSize: 12.5,
      lineHeight: 1.45,
      marginBottom: 12
    }
  }, "\u0412\u044B\u0431\u0435\u0440\u0438 \u0441\u0444\u0435\u0440\u044B, \u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u0445\u043E\u0447\u0435\u0448\u044C \u0432\u0438\u0434\u0435\u0442\u044C \u0432 \u043A\u043E\u043B\u0435\u0441\u0435 \u043D\u0430 \u0433\u043B\u0430\u0432\u043D\u043E\u0439."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 8
    }
  }, (window.ALL_SPHERES || []).map(s => {
    var sel = wheel.includes(s.id);
    var toggle = () => {
      if (sel) {
        if (wheel.length > 3) setWheel(wheel.filter(x => x !== s.id));
      } else setWheel([...wheel, s.id]);
    };
    return /*#__PURE__*/React.createElement("button", {
      key: s.id,
      onClick: toggle,
      className: "tap",
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "8px 13px",
        borderRadius: 999,
        fontSize: 13.5,
        cursor: "pointer",
        background: sel ? "#FEDE34" : "var(--surface-3)",
        color: sel ? "#0a0a0a" : "var(--text-2)",
        border: 0,
        fontWeight: sel ? 600 : 500
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 15
      }
    }, s.e), s.l);
  }))), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, "\u041E \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0438"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(SysBtn, {
    onClick: () => navigate("guide", {
      from: "settings"
    }),
    style: {
      padding: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bos-sys-chip-bg",
    style: {
      width: 32,
      height: 32,
      borderRadius: "50%",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(I.Compass, {
    size: 16
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 15,
      fontWeight: 600,
      color: "var(--text)"
    }
  }, "\u041E \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0438"), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 16,
    className: "bos-sys-text-2"
  })), /*#__PURE__*/React.createElement(SysBtn, {
    onClick: () => navigate("manifest", {
      from: "settings"
    }),
    style: {
      padding: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bos-sys-chip-bg",
    style: {
      width: 32,
      height: 32,
      borderRadius: "50%",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(I.Sparkles, {
    size: 16
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 15,
      fontWeight: 600,
      color: "var(--text)"
    }
  }, "\u041C\u0430\u043D\u0438\u0444\u0435\u0441\u0442"), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 16,
    className: "bos-sys-text-2"
  })), ["Политика конфиденциальности", "Условия использования", "Версия 2.4.1"].map((l, i, a) => i < a.length - 1 ? /*#__PURE__*/React.createElement(SysBtn, {
    key: i,
    onClick: () => openSheet(/*#__PURE__*/React.createElement(InfoSheet, {
      title: l,
      body: "Мы храним только то, что нужно приложению: твои привычки, состояние и записи. Они привязаны к твоему аккаунту Telegram. Полные документы — на сайте проекта.",
      cta: "\u0413\u043E\u0442\u043E\u0432\u043E",
      dark: routeDark
    })),
    style: {
      padding: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 15,
      fontWeight: 600,
      color: "var(--text)"
    }
  }, l), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 16,
    className: "bos-sys-text-2"
  })) : /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "bos-sys-card",
    style: {
      padding: 14,
      fontSize: 15
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bos-sys-text-2"
  }, l)))));
}
function NotificationsLive() {
  var {
    navigate,
    params
  } = useNav();
  var app = typeof useApp === "function" ? useApp() : null;
  // LIVE: real notifications computed from the cloud — unread team-chat messages.
  // Nothing scripted ever reaches a real user, so there is no sample list.
  var [liveItems, setLiveItems] = React.useState([]);
  React.useEffect(() => {
    if (!(window.bosCloud && window.bosCloud.enabled())) return;
    var on = true;
    (async () => {
      try {
        var me = await window.bosCloud.uid();
        var teams = (app?.teams || []).filter(t => t.cloudId);
        var out = [];
        var _loop = async function () {
          var rows = await window.bosCloud.loadMessages(t.cloudId);
          if (!Array.isArray(rows) || !rows.length) return 1; // continue
          var lastRead = Number(localStorage.getItem("bos:chatread:" + t.cloudId) || 0);
          var unread = rows.filter(r => r && r.user_id !== me && new Date(r.created_at).getTime() > lastRead);
          if (unread.length) {
            var last = unread[unread.length - 1];
            var word = unread.length === 1 ? "новое сообщение" : unread.length < 5 ? "новых сообщения" : "новых сообщений";
            out.push({
              i: "💬",
              t: unread.length + " " + word + " в «" + t.name + "»",
              b: last.text || "📷 Фото",
              w: "сейчас",
              new: true,
              goChat: t
            });
          }
        };
        for (var t of teams) {
          if (await _loop()) continue;
        }
        if (on) setLiveItems(out);
      } catch (e) {}
    })();
    return () => {
      on = false;
    };
  }, []);
  var shown = liveItems;
  var clearAll = () => setLiveItems([]);
  var tap = (n, idx) => {
    if (n.goChat) {
      try {
        localStorage.setItem("bos:chatread:" + n.goChat.cloudId, String(Date.now()));
      } catch (e) {}
      navigate("team-chat", {
        team: n.goChat
      });
    } else if (n.go) navigate(n.go);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      padding: "0 16px 24px"
    }
  }, /*#__PURE__*/React.createElement(PageHeader, {
    title: "\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F",
    onBack: () => navigate(params?.from || "profile"),
    right: shown.length > 0 ? /*#__PURE__*/React.createElement("button", {
      onClick: clearAll,
      className: "tap bos-sys-text-2",
      style: {
        background: "transparent",
        border: 0,
        fontSize: 13
      }
    }, "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C") : null
  }), shown.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-3",
    style: {
      textAlign: "center",
      padding: "60px 20px",
      fontSize: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 34,
      marginBottom: 10
    }
  }, "\uD83D\uDD14"), "\u041D\u043E\u0432\u044B\u0445 \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u0439 \u043D\u0435\u0442") : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, shown.map((n, i) => /*#__PURE__*/React.createElement(SysCard, {
    key: i,
    onClick: () => tap(n, i),
    style: {
      padding: 14,
      display: "flex",
      gap: 12,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 26
    }
  }, n.i), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600,
      fontSize: 15,
      color: "var(--text)"
    }
  }, n.t), n.new && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: "#FEDE34"
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-2",
    style: {
      fontSize: 13,
      marginTop: 2
    }
  }, n.b), /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-3",
    style: {
      fontSize: 11,
      marginTop: 6
    }
  }, n.w)), n.go && /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 16,
    className: "bos-sys-text-3",
    style: {
      alignSelf: "center"
    }
  })))));
}
function HistoryLive() {
  var {
    navigate
  } = useNav();
  var app = useApp();

  // Detect theme from wrapper class so all calendar visuals stay coherent.
  var wrapRef = React.useRef(null);
  var [isDark, setIsDark] = useP(false);
  React.useEffect(() => {
    var el = wrapRef.current;
    if (!el) return;
    var n = el.parentElement;
    while (n && !n.classList.contains("theme-light") && !n.classList.contains("theme-dark")) n = n.parentElement;
    setIsDark(!!(n && n.classList.contains("theme-dark")));
  }, []);

  // Theme tokens shared across the page
  var TH = isDark ? {
    cellEmpty: "rgba(255,255,255,0.05)",
    cellIdle: "rgba(255,255,255,0.10)",
    ringTrack: "rgba(255,255,255,0.13)",
    cellSelBg: "rgba(255,255,255,0.16)",
    todayBg: "rgba(255,255,255,0.14)",
    todayFg: "#fff",
    cellBorder: "rgba(255,255,255,0.10)",
    cellText: "#fff",
    cellMuted: "rgba(255,255,255,0.45)",
    yellowFill: "linear-gradient(160deg, #FEDE34, #EF9F14)",
    yellow: "#FEDE34",
    chipBg: "rgba(255,255,255,0.06)",
    progressBg: "rgba(255,255,255,0.08)",
    iconBg: "rgba(255,255,255,0.06)",
    outlineSel: "#fff",
    outlineToday: "rgba(255,255,255,0.45)",
    moodText: "rgba(0,0,0,0.75)" // emoji bg is colored so dark text reads
  } : {
    cellEmpty: "transparent",
    cellIdle: "#f5f5f5",
    ringTrack: "rgba(0,0,0,0.09)",
    cellSelBg: "rgba(0,0,0,0.07)",
    todayBg: "rgba(0,0,0,0.07)",
    todayFg: "var(--text)",
    cellBorder: "rgba(0,0,0,0.06)",
    cellText: "var(--text)",
    cellMuted: "var(--text-4)",
    yellowFill: "linear-gradient(160deg, #FEDE34, #EF9F14)",
    yellow: "#FEDE34",
    chipBg: "var(--surface-3)",
    progressBg: "var(--surface-3)",
    iconBg: "var(--surface-3)",
    outlineSel: "#0a0a0a",
    outlineToday: "rgba(0,0,0,0.35)",
    moodText: "rgba(0,0,0,0.75)"
  };

  // LIVE walks the user's REAL calendar (today = now).
  var MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  var DIM = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  var _now = new Date();
  var CUR_M = _now.getMonth();
  var year = _now.getFullYear();
  var today = _now.getDate();
  var _leap = y => y % 4 === 0 && y % 100 !== 0 || y % 400 === 0;
  var [mIdx, setMIdx] = useP(CUR_M);
  var monthName = MONTHS[mIdx];
  var daysInMonth = mIdx === 1 && _leap(year) ? 29 : DIM[mIdx];
  // Real weekday of the 1st of the shown month.
  var startWeekday = new Date(year, mIdx, 1).getDay();
  var isCurMonth = mIdx === CUR_M;
  var isFuture = mIdx > CUR_M;
  var lastLogged = isCurMonth ? today : daysInMonth; // past months fully logged; this one up to today

  // A day's completion = share of the user's habits logged on that real date.
  // h.log is keyed by local ISO date ("2026-06-23"); 0 habits → null (nothing to show).
  var liveHabits = app?.habits || [];
  var iso = d => year + "-" + (mIdx + 1 < 10 ? "0" : "") + (mIdx + 1) + "-" + (d < 10 ? "0" : "") + d;
  var completion = d => {
    if (isFuture || d > lastLogged) return null;
    if (!liveHabits.length) return null;
    var k = iso(d);
    var done = liveHabits.reduce((s, h) => s + (h && h.log && h.log[k] ? 1 : 0), 0);
    return done / liveHabits.length;
  };
  var [selDay, setSelDay] = useP(today);
  var cellStyle = pct => {
    if (pct == null) return {
      background: TH.cellEmpty,
      border: "1px dashed " + TH.cellBorder,
      color: TH.cellMuted
    };
    if (pct === 0) return {
      background: TH.cellIdle,
      color: TH.cellMuted
    };
    if (pct < 1) {
      var h = Math.round(pct * 100);
      // Fill rises from the bottom (amber → yellow) with a crisp level line on
      // top — reads instantly as "how full the day is", no diagonal.
      return {
        background: `linear-gradient(to top, #EF9F14 0%, #FEDE34 ${h}%, ${TH.cellIdle} ${h}%)`,
        color: TH.cellText
      };
    }
    return {
      background: "linear-gradient(to top, #EF9F14, #FEDE34)",
      color: "#0a0a0a"
    };
  };
  var blanks = Array.from({
    length: startWeekday
  }, (_, i) => ({
    blank: true,
    key: "b" + i
  }));
  var days = Array.from({
    length: daysInMonth
  }, (_, i) => ({
    d: i + 1,
    key: "d" + (i + 1)
  }));
  var cells = [...blanks, ...days];
  var weekday = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

  // The live user's REAL habits + whether each was logged on the selected date.
  var liveDayHabits = d => liveHabits.map(h => ({
    e: h.emoji || "✨",
    n: h.name || "Привычка",
    on: !!(h && h.log && h.log[iso(d)])
  }));
  var dayHabits = liveDayHabits(selDay);
  var selPct = completion(selDay);

  // Stats — REAL across all logged history.
  var totalDone, perfectDays, bestStreak;
  totalDone = liveHabits.reduce((s, h) => s + (h && h.log ? Object.keys(h.log).length : 0), 0);
  bestStreak = typeof bosMaxStreak === "function" ? bosMaxStreak(liveHabits) : 0;
  // A "perfect day" = a date on which every habit was logged. Gather all logged dates,
  // then count those where the done-count equals the number of habits.
  var allDates = {};
  liveHabits.forEach(h => {
    if (h && h.log) Object.keys(h.log).forEach(k => {
      allDates[k] = (allDates[k] || 0) + 1;
    });
  });
  perfectDays = liveHabits.length ? Object.keys(allDates).filter(k => allDates[k] >= liveHabits.length).length : 0;
  // Empty state: no habits at all, OR habits but not a single logged day yet.
  var liveHasHistory = liveHabits.length > 0 && totalDone > 0;
  var showEmpty = !liveHasHistory;
  return /*#__PURE__*/React.createElement("div", {
    ref: wrapRef,
    className: "page-in",
    style: {
      padding: "0 16px 24px"
    }
  }, /*#__PURE__*/React.createElement(PageHeader, {
    title: "\u0418\u0441\u0442\u043E\u0440\u0438\u044F",
    onBack: () => navigate("home")
  }), showEmpty ?
  /*#__PURE__*/
  /* No history yet — honest empty state, never a fake calendar. */
  React.createElement("div", {
    className: "bos-sys-text-3",
    style: {
      textAlign: "center",
      padding: "70px 24px",
      fontSize: 14,
      lineHeight: 1.55
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 38,
      marginBottom: 12
    }
  }, "\uD83D\uDDD3\uFE0F"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 600,
      color: "var(--text)",
      marginBottom: 6
    }
  }, "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u0438\u0441\u0442\u043E\u0440\u0438\u0438"), "\u041E\u0442\u043C\u0435\u0447\u0430\u0439 \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0438, \u0438 \u0442\u0443\u0442 \u043F\u043E\u044F\u0432\u0438\u0442\u0441\u044F \u0442\u0432\u043E\u0439 \u0440\u0438\u0442\u043C.") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 8
    }
  }, [{
    l: "Лучшая серия",
    v: bestStreak + "д"
  }, {
    l: "Идеальных дней",
    v: perfectDays
  }, {
    l: "Всего привычек",
    v: Math.round(totalDone)
  }].map((s, i) => /*#__PURE__*/React.createElement(SysCard, {
    key: i,
    style: {
      padding: "12px 14px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-3",
    style: {
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 1,
      fontWeight: 600
    }
  }, s.l), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 700,
      marginTop: 2,
      letterSpacing: "-0.4px"
    }
  }, s.v)))), /*#__PURE__*/React.createElement(SysCard, {
    style: {
      padding: 16,
      marginTop: 12,
      borderRadius: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setMIdx(m => Math.max(0, m - 1)),
    className: "tap",
    style: {
      background: TH.chipBg,
      border: 0,
      borderRadius: 999,
      width: 32,
      height: 32,
      display: "grid",
      placeItems: "center",
      color: "inherit",
      opacity: mIdx === 0 ? 0.35 : 1
    }
  }, /*#__PURE__*/React.createElement(I.ChevronLeft, {
    size: 16
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      letterSpacing: "-0.3px"
    }
  }, monthName, " ", year), /*#__PURE__*/React.createElement("button", {
    onClick: () => setMIdx(m => Math.min(11, m + 1)),
    className: "tap",
    style: {
      background: TH.chipBg,
      border: 0,
      borderRadius: 999,
      width: 32,
      height: 32,
      display: "grid",
      placeItems: "center",
      color: "inherit",
      opacity: mIdx === 11 ? 0.35 : 1
    }
  }, /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 16
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(7, 1fr)",
      gap: 4,
      marginTop: 14
    }
  }, weekday.map((w, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "bos-sys-text-3",
    style: {
      textAlign: "center",
      fontSize: 10.5,
      fontWeight: 600,
      letterSpacing: 0.6
    }
  }, w))), /*#__PURE__*/React.createElement("svg", {
    width: "0",
    height: "0",
    "aria-hidden": true,
    style: {
      position: "absolute"
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: "calRing",
    x1: "0",
    y1: "0",
    x2: "1",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0",
    stopColor: "#FEDE34"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "1",
    stopColor: "#EF9F14"
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(7, 1fr)",
      gap: 4,
      marginTop: 6
    }
  }, cells.map(c => {
    if (c.blank) return /*#__PURE__*/React.createElement("span", {
      key: c.key,
      "aria-hidden": true,
      style: {
        aspectRatio: "1/1"
      }
    });
    var pct = completion(c.d);
    var future = pct == null;
    var isSelected = selDay === c.d;
    var isToday = isCurMonth && c.d === today;
    return /*#__PURE__*/React.createElement("button", {
      key: c.key,
      onClick: () => setSelDay(c.d),
      className: "tap",
      style: {
        aspectRatio: "1/1",
        border: 0,
        borderRadius: "50%",
        padding: 0,
        display: "grid",
        placeItems: "center",
        position: "relative",
        fontSize: 13,
        fontWeight: isToday ? 700 : 500,
        cursor: "pointer",
        background: "transparent",
        color: future ? TH.cellMuted : isToday ? TH.todayFg : TH.cellText
      }
    }, isToday && /*#__PURE__*/React.createElement("span", {
      "aria-hidden": true,
      style: {
        position: "absolute",
        width: "62%",
        aspectRatio: "1/1",
        borderRadius: "50%",
        background: TH.todayBg
      }
    }), isSelected && !isToday && /*#__PURE__*/React.createElement("span", {
      "aria-hidden": true,
      style: {
        position: "absolute",
        width: "66%",
        aspectRatio: "1/1",
        borderRadius: "50%",
        border: "1.5px solid " + (isDark ? "rgba(255,255,255,0.42)" : "rgba(0,0,0,0.28)")
      }
    }), future ? /*#__PURE__*/React.createElement("span", {
      "aria-hidden": true,
      style: {
        position: "absolute",
        inset: "17%",
        borderRadius: "50%",
        border: "1px dashed " + TH.cellBorder
      }
    }) : /*#__PURE__*/React.createElement(DayRing, {
      pct: pct,
      track: TH.ringTrack,
      glow: pct === 1
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        position: "relative",
        zIndex: 1
      }
    }, c.d), (() => {
      // Live moods are written by ISO date key (bosTodayKey, e.g. "2026-06-24");
      // iso() above produces the same local ISO key.
      if (!isCurMonth || pct == null) return null;
      var mkey = iso(c.d);
      var mi = app?.dayMoods?.[mkey];
      if (mi == null) return null;
      var dm = MOOD_OPTIONS[mi];
      if (!dm) return null;
      return /*#__PURE__*/React.createElement("span", {
        "aria-hidden": true,
        style: {
          position: "absolute",
          top: 0,
          right: 0,
          lineHeight: 0
        }
      }, /*#__PURE__*/React.createElement(StaticOrb, {
        size: 10,
        tint: tintFromMood(dm.c),
        seed: 1.2,
        intensity: 0.55
      }));
    })());
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bos-sys-text-3",
    style: {
      fontSize: 11
    }
  }, "\u041C\u0435\u043D\u044C\u0448\u0435"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 7,
      alignItems: "center"
    }
  }, [0, 0.25, 0.5, 0.75, 1].map((p, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      position: "relative",
      width: 16,
      height: 16,
      display: "inline-block"
    }
  }, /*#__PURE__*/React.createElement(DayRing, {
    pct: p,
    track: TH.ringTrack,
    sw: 3.4,
    glow: p === 1
  })))), /*#__PURE__*/React.createElement("span", {
    className: "bos-sys-text-3",
    style: {
      fontSize: 11
    }
  }, "\u0411\u043E\u043B\u044C\u0448\u0435"))), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22,
      padding: "0 4px"
    }
  }, monthName, " ", selDay, " \xB7 ", selPct == null ? "Будущее" : selPct === 1 ? "Идеальный день ✨" : selPct === 0 ? "Пропущен" : `${Math.round(selPct * 100)}%`), /*#__PURE__*/React.createElement(SysCard, {
    style: {
      marginTop: 8,
      borderRadius: 22,
      overflow: "hidden",
      padding: 0
    }
  }, selPct == null ? /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-3",
    style: {
      padding: 24,
      textAlign: "center",
      fontSize: 14
    }
  }, "\u042D\u0442\u043E\u0442 \u0434\u0435\u043D\u044C \u0435\u0449\u0451 \u043D\u0435 \u043D\u0430\u0441\u0442\u0443\u043F\u0438\u043B.") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "14px 16px",
      display: "flex",
      alignItems: "center",
      gap: 12,
      borderBottom: "1px solid var(--line)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-2",
    style: {
      fontSize: 13
    }
  }, Math.round(selPct * dayHabits.length), " \u0438\u0437 ", dayHabits.length, " \u043F\u0440\u0438\u0432\u044B\u0447\u0435\u043A"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      height: 8,
      background: TH.progressBg,
      borderRadius: 999,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      height: "100%",
      width: selPct * 100 + "%",
      background: TH.yellowFill,
      borderRadius: 999
    }
  }))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 20,
      fontWeight: 700,
      letterSpacing: "-0.4px"
    }
  }, Math.round(selPct * 100), "%")), (() => {
    var dkey = iso(selDay);
    var dm = app?.dayMoods?.[dkey] != null ? MOOD_OPTIONS[app.dayMoods[dkey]] : null;
    if (!dm) return null;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        borderBottom: "1px solid var(--line)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 36,
        height: 36,
        display: "grid",
        placeItems: "center",
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement(StaticOrb, {
      size: 34,
      tint: tintFromMood(dm.c),
      seed: 1.2,
      intensity: 0.7
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "bos-sys-text-3",
      style: {
        fontSize: 10.5,
        textTransform: "uppercase",
        letterSpacing: 1,
        fontWeight: 600
      }
    }, "\u0421\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15,
        fontWeight: 600,
        color: "var(--text)",
        marginTop: 2
      }
    }, dm.t)));
  })(), (() => {
    var nkey = iso(selDay);
    var dn = app?.dayNotes?.[nkey];
    if (!dn || !(dn.tags && dn.tags.length || dn.note)) return null;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "12px 16px",
        borderBottom: "1px solid var(--line)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "bos-sys-text-3",
      style: {
        fontSize: 10.5,
        textTransform: "uppercase",
        letterSpacing: 1,
        fontWeight: 600
      }
    }, "\u0416\u0443\u0440\u043D\u0430\u043B"), dn.tags && dn.tags.length > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        marginTop: 8
      }
    }, dn.tags.map((tg, k) => /*#__PURE__*/React.createElement("span", {
      key: k,
      style: {
        fontSize: 12.5,
        padding: "5px 10px",
        borderRadius: 999,
        background: TH.iconBg
      }
    }, "#", tg))), dn.note && /*#__PURE__*/React.createElement("div", {
      className: "bos-sys-text-2",
      style: {
        fontSize: 14,
        marginTop: 8,
        lineHeight: 1.45
      }
    }, dn.note));
  })(), dayHabits.map((h, i) => {
    // The habit's OWN logged state for this date.
    var done = h.on;
    return /*#__PURE__*/React.createElement("div", {
      key: i
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 36,
        height: 36,
        borderRadius: 14,
        background: TH.iconBg,
        display: "grid",
        placeItems: "center",
        fontSize: 18,
        flexShrink: 0
      }
    }, h.e), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        fontSize: 15,
        fontWeight: 600,
        color: "var(--text)",
        letterSpacing: "-0.2px"
      }
    }, h.n), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 26,
        height: 26,
        borderRadius: "50%",
        background: done ? "var(--check-color, var(--accent))" : "transparent",
        border: done ? 0 : "2px solid " + (isDark ? "rgba(255,255,255,0.35)" : "var(--text-5)"),
        display: "grid",
        placeItems: "center"
      }
    }, done && /*#__PURE__*/React.createElement(I.Check, {
      size: 14,
      strokeWidth: 2.5,
      color: "#fff"
    }))), i < dayHabits.length - 1 && /*#__PURE__*/React.createElement("div", {
      className: "divider"
    }));
  })))));
}
function SupportLive() {
  var {
    navigate
  } = useNav();
  var app = useApp();
  var {
    open: openSheet
  } = useSheet();
  var routeDark = app?.themeOverride !== "light";
  var [q, setQ] = useP("");
  var [openFaq, setOpenFaq] = useP(null);
  var FAQ = [{
    q: "Как работают серии",
    a: "Серия прибавляет день за каждый день, когда ты выполнил хотя бы одну привычку. Пропустишь день — серия обнуляется, но история остаётся."
  }, {
    q: "Приглашение команды",
    a: "Открой команду → шестерёнка → раздел «Участники» → выбери друга из подсказок. Он получит уведомление и сможет присоединиться к общей цели."
  }, {
    q: "Конфиденциальность и данные",
    a: "Твои данные о привычках видны только тебе. В команде друзья видят лишь отметки по общим привычкам — не личные."
  }, {
    q: "Подключение Apple Health",
    a: "Настройки → Привязанные аккаунты. После подключения шаги и тренировки будут автоматически отмечать связанные привычки."
  }, {
    q: "Отмена подписки",
    a: "Подписка управляется в App Store: Настройки телефона → Apple ID → Подписки → BalanceOS → Отменить."
  }].filter(f => !q || f.q.toLowerCase().includes(q.toLowerCase()));
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      padding: "0 16px 24px"
    }
  }, /*#__PURE__*/React.createElement(PageHeader, {
    title: "\u041F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0430 \u0438 \u043F\u043E\u043C\u043E\u0449\u044C",
    onBack: () => navigate("profile")
  }), /*#__PURE__*/React.createElement(SysCard, {
    style: {
      padding: 14,
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(I.Search, {
    size: 18,
    className: "bos-sys-text-2"
  }), /*#__PURE__*/React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "\u041F\u043E\u0438\u0441\u043A \u043F\u043E \u0441\u0442\u0430\u0442\u044C\u044F\u043C",
    className: "bos-sys-text-2",
    style: {
      flex: 1,
      border: 0,
      outline: 0,
      background: "transparent",
      fontSize: 15,
      color: "inherit"
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, "\u041F\u043E\u043F\u0443\u043B\u044F\u0440\u043D\u044B\u0435 \u0442\u0435\u043C\u044B"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      marginTop: 8
    }
  }, FAQ.map((f, i) => /*#__PURE__*/React.createElement("div", {
    key: i
  }, /*#__PURE__*/React.createElement(SysBtn, {
    onClick: () => setOpenFaq(o => o === f.q ? null : f.q),
    style: {
      padding: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 15,
      fontWeight: 600,
      color: "var(--text)"
    }
  }, f.q), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 16,
    className: "bos-sys-text-2",
    style: {
      transform: openFaq === f.q ? "rotate(90deg)" : "none",
      transition: "transform 0.2s"
    }
  })), openFaq === f.q && /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-2",
    style: {
      fontSize: 13.5,
      lineHeight: 1.55,
      padding: "10px 16px 2px"
    }
  }, f.a))), FAQ.length === 0 && /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-3",
    style: {
      fontSize: 14,
      padding: "8px 4px"
    }
  }, "\u041D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E. \u041D\u0430\u043F\u0438\u0448\u0438 \u043D\u0430\u043C \u043D\u0438\u0436\u0435.")), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, "\u0421\u0432\u044F\u0436\u0438\u0442\u0435\u0441\u044C \u0441 \u043D\u0430\u043C\u0438"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10,
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(SysCard, {
    onClick: () => openSheet(/*#__PURE__*/React.createElement(FeedbackSheetLive, {
      title: "\u041D\u0430\u043F\u0438\u0441\u0430\u0442\u044C \u043D\u0430\u043C",
      dark: routeDark
    })),
    style: {
      padding: 18,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 6,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(I.Mail, {
    size: 20
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: "var(--text)"
    }
  }, "\u041D\u0430\u043F\u0438\u0441\u0430\u0442\u044C \u043D\u0430\u043C"), /*#__PURE__*/React.createElement("span", {
    className: "bos-sys-text-2",
    style: {
      fontSize: 12
    }
  }, "support@balanceos.app")), /*#__PURE__*/React.createElement(SysCard, {
    onClick: () => openSheet(/*#__PURE__*/React.createElement(FeedbackSheetLive, {
      title: "\u0427\u0430\u0442 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0438",
      dark: routeDark
    })),
    style: {
      padding: 18,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 6,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(I.MessageCircle, {
    size: 20
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: "var(--text)"
    }
  }, "\u0427\u0430\u0442 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0438"), /*#__PURE__*/React.createElement("span", {
    className: "bos-sys-text-2",
    style: {
      fontSize: 12
    }
  }, "\u041E\u0442\u0432\u0435\u0442 \u0432 \u0441\u0440\u0435\u0434\u043D\u0435\u043C 5 \u043C\u0438\u043D"))));
}
function AchievementsLive() {
  var {
    navigate,
    params
  } = useNav();
  var app = typeof useApp === "function" ? useApp() : null;
  var back = params?.from || "profile";
  // LIVE: achievements earned by real signals — the real bosEarnedAchievements ladder.
  var LIST = bosEarnedAchievements(app);
  var earned = LIST.filter(a => a.earned);
  var locked = LIST.filter(a => !a.earned);
  // Live ladder grants bonus XP per badge; total earned bonus is the hero number.
  var _achXP = earned.reduce((s, a) => s + (a.xp || 0), 0);
  // LIVE "circles of contacts" = real people you actually invited (referral circle).
  var [invited, setInvited] = React.useState(0);
  React.useEffect(() => {
    var on = true;
    try {
      if (window.bosCloud && window.bosCloud.enabled()) {
        window.bosCloud.invitedPeople().then(list => {
          if (on && Array.isArray(list)) setInvited(list.length);
        }).catch(() => {});
      }
    } catch (e) {}
    return () => {
      on = false;
    };
  }, []);
  var circles = invited;
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      padding: "0 16px 24px"
    }
  }, /*#__PURE__*/React.createElement(PageHeader, {
    title: "\u0414\u043E\u0441\u0442\u0438\u0436\u0435\u043D\u0438\u044F",
    onBack: () => navigate(back)
  }), /*#__PURE__*/React.createElement(SysCard, {
    style: {
      padding: 18,
      borderRadius: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-3",
    style: {
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 1.2,
      fontWeight: 700
    }
  }, "\u0422\u0432\u043E\u0438 \u0430\u0447\u0438\u0432\u043A\u0438"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 8,
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 30,
      fontWeight: 800,
      letterSpacing: "-0.6px"
    }
  }, earned.length), /*#__PURE__*/React.createElement("span", {
    className: "bos-sys-text-2",
    style: {
      fontSize: 14
    }
  }, "\u0438\u0437 ", LIST.length, " \u043E\u0442\u043A\u0440\u044B\u0442\u043E")), /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-2",
    style: {
      fontSize: 13,
      lineHeight: 1.5,
      marginTop: 6
    }
  }, "\u0414\u043E\u0441\u0442\u0438\u0436\u0435\u043D\u0438\u044F \u0437\u0430 \u0443\u0440\u043E\u0432\u043D\u0438, \u0441\u0435\u0440\u0438\u0438 \u0438 \u0437\u0430\u0431\u043E\u0442\u0443 \u043E \u0441\u0435\u0431\u0435. \u041A\u0430\u0436\u0434\u043E\u0435 \u0434\u0430\u0451\u0442 \u0431\u043E\u043D\u0443\u0441 XP", _achXP > 0 ? /*#__PURE__*/React.createElement(React.Fragment, null, " \u2014 \u0442\u044B \u0443\u0436\u0435 \u0437\u0430\u0440\u0430\u0431\u043E\u0442\u0430\u043B ", /*#__PURE__*/React.createElement("b", null, "+", _achXP, " XP"), ".") : /*#__PURE__*/React.createElement(React.Fragment, null, " \u2014 \u043E\u0442\u043A\u0440\u043E\u0439 \u043F\u0435\u0440\u0432\u043E\u0435.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginTop: 12,
      flexWrap: "wrap"
    }
  }, earned.map((a, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      width: 34,
      height: 34,
      borderRadius: 14,
      background: a.accent + "26",
      display: "grid",
      placeItems: "center",
      fontSize: 18
    }
  }, a.i)))), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22,
      padding: "0 4px"
    }
  }, "\u041E\u0442\u043A\u0440\u044B\u0442\u043E"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      marginTop: 8
    }
  }, earned.map((a, i) => /*#__PURE__*/React.createElement(SysCard, {
    key: i,
    className: "tap",
    onClick: () => navigate("community"),
    style: {
      padding: 14,
      display: "flex",
      alignItems: "center",
      gap: 13,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 46,
      height: 46,
      borderRadius: 14,
      background: a.accent + "26",
      display: "grid",
      placeItems: "center",
      fontSize: 24,
      flexShrink: 0
    }
  }, a.i), /*#__PURE__*/React.createElement("div", {
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
  }, a.t), /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-3",
    style: {
      fontSize: 12,
      marginTop: 2
    }
  }, a.d), /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-2",
    style: {
      fontSize: 12,
      marginTop: 5,
      fontWeight: 600,
      display: "inline-flex",
      alignItems: "center",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement(I.Sparkles, {
    size: 11,
    color: a.accent
  }), " ", a.xp ? "+" + a.xp + " XP" : "открыл: " + a.opens)), /*#__PURE__*/React.createElement("span", {
    className: "bos-sys-text-3",
    style: {
      fontSize: 11,
      flexShrink: 0
    }
  }, a.date)))), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22,
      padding: "0 4px"
    }
  }, "\u0412 \u043F\u0443\u0442\u0438"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      marginTop: 8
    }
  }, locked.map((a, i) => /*#__PURE__*/React.createElement(SysCard, {
    key: i,
    className: "tap",
    onClick: () => navigate("community"),
    style: {
      padding: 14,
      display: "flex",
      alignItems: "center",
      gap: 13,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 46,
      height: 46,
      borderRadius: 14,
      background: "var(--card-2)",
      display: "grid",
      placeItems: "center",
      fontSize: 22,
      flexShrink: 0,
      filter: "grayscale(1)",
      opacity: 0.45
    }
  }, a.i), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15.5,
      fontWeight: 600,
      color: "var(--text)",
      letterSpacing: "-0.2px",
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, a.t, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11
    }
  }, "\uD83D\uDD12")), /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-3",
    style: {
      fontSize: 12,
      marginTop: 2
    }
  }, "\u041A\u0430\u043A \u043E\u0442\u043A\u0440\u044B\u0442\u044C: ", a.how || a.req), /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-2",
    style: {
      fontSize: 12,
      marginTop: 5,
      fontWeight: 500
    }
  }, a.xp ? "+" + a.xp + " XP" : "→ откроет: " + a.opens)), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 16,
    className: "bos-sys-text-3",
    style: {
      flexShrink: 0
    }
  })))));
}

// Manifesto — the full philosophical text behind the onboarding, for those who
// want to read it whole. Reached from Settings → «О приложении». No mode-specific
// behaviour in the original, so the live fork is a faithful copy with the Headline
// stanza weight kept as-is (already 600).
function ManifestLive() {
  var {
    navigate,
    params
  } = useNav();
  var Orb = window.StateOrb;
  var stanzas = [["Ты — точка.", "Точка внимания внутри бесконечного количества возможных вариантов жизни."], ["Ты не видишь мир таким, какой он есть.", "Ты видишь его таким, в каком состоянии находишься."], [null, "Большинство людей не выбирают своё состояние. Они позволяют новостям, обстоятельствам, страхам и чужому мнению выбирать его за них."], [null, "Тебе кажется, что твоей жизнью управляют обстоятельства. Но обстоятельства не определяют твои решения — их определяет твоё состояние."], [null, "В одном состоянии всё кажется невозможным. В другом — ты видишь решения, которые были рядом всё это время."], ["Это пространство — для одного.", "Научиться управлять своим состоянием. Расширять восприятие. Видеть больше возможностей. И осознанно выбирать направление движения."], [null, "Твоя жизнь не определяется тем, что происходит вокруг. Она определяется тем, из какого состояния ты встречаешь происходящее."], ["Путешествие начинается внутри.", "Это пространство учит главному: управлять не обстоятельствами, а собой."]];
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      padding: "0 22px 44px"
    }
  }, /*#__PURE__*/React.createElement(PageHeader, {
    title: "\u041C\u0430\u043D\u0438\u0444\u0435\u0441\u0442",
    onBack: () => navigate(params?.from || "settings")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      placeItems: "center",
      margin: "6px 0 22px"
    }
  }, Orb ? /*#__PURE__*/React.createElement(Orb, {
    size: 94,
    tint: ["#cfe1ff", "#7aa4d0", "#1a2c48"],
    intensity: 1
  }) : null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 26
    }
  }, stanzas.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i
  }, s[0] && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20.5,
      fontWeight: 600,
      letterSpacing: "-0.4px",
      lineHeight: 1.26,
      color: "var(--text)"
    }
  }, s[0]), s[1] && /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-2",
    style: {
      fontSize: 15.5,
      lineHeight: 1.62,
      marginTop: s[0] ? 8 : 0
    }
  }, s[1])))));
}
function IconPickerLive() {
  var {
    navigate,
    params
  } = useNav();
  var list = ["☀️", "🤸🏼‍♀️", "📖", "🙏", "🧭", "⌨️", "🦶", "🚭", "🌚", "👟", "🧁", "📞", "🥊", "🧘🏼‍♀️", "🏃🏼‍♀️", "📚", "✍🏼", "🥗", "💧", "🧊", "🔥", "🎯", "🎨", "🎵", "🌱", "☕"];
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      padding: "0 16px 24px"
    }
  }, /*#__PURE__*/React.createElement(PageHeader, {
    title: "\u0412\u044B\u0431\u0435\u0440\u0438 \u0438\u043A\u043E\u043D\u043A\u0443",
    onBack: () => navigate("habit-settings", params)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(5,1fr)",
      gap: 10
    }
  }, list.map((e, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    className: "tap",
    onClick: () => navigate("habit-settings", {
      ...params,
      picked: e
    }),
    style: {
      aspectRatio: "1/1",
      background: "var(--card)",
      border: 0,
      borderRadius: 14,
      fontSize: 28,
      boxShadow: "var(--card-shadow)"
    }
  }, e))));
}

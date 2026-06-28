/* PROFILE SUB-SCREENS — LIVE-only forks (real Telegram user, app.mode === "live"
   is ALWAYS true here). Every demo ("Павел") and fresh branch is stripped: no
   curated April-2026 calendar, no scripted sample notifications, no demo
   ACHIEVEMENTS/courses ladder, no demo-only settings rows. Everything is real —
   real history from each habit's log, real Telegram sign-in, the real
   bosEarnedAchievementsLive / BOS_ACHIEVEMENTS_LIVE ladder, real cloud notifications.

   Reuses the shared core/ toolkit (SysCard, SysBtn, OrbitField, EditProfileSheet,
   InfoSheet, AvatarPickerSheet, DayRing) + the FeedbackSheetLive fork (shared_live.jsx)
   + framework (PageHeader, Switch, I, hooks useApp/useNav/useSheet, every
   bos* helper, BOS_ACHIEVEMENTS_LIVE / bosEarnedAchievementsLive, MOOD_OPTIONS, StaticOrb,
   tintFromMood, window.StateOrb, window.ALL_SPHERES / DEFAULT_SPHERES). useP is the
   React.useState alias now defined once in core/aliases.jsx.

   TYPOGRAPHY (iOS Headline polish): PRIMARY labels (settings-row labels,
   notification titles, history entry titles, achievement names, section titles)
   carry fontWeight: 600 + color: "var(--text)". Already-700 weights and
   secondary/caption text are left untouched.

   The ONLY new top-level declarations in this file are the seven `…Live`
   components below: SettingsLive, NotificationsLive, HistoryLive, SupportLive,
   AchievementsLive, ManifestLive, IconPickerLive. (GuideScreen is NOT defined in
   profile.jsx — it lives in app.jsx — so no GuideLive fork is made here.) */

// LIVE state-history sheet (Settings → «История состояния»): the user's REAL day-keyed
// mood marks, newest first. Honest empty state — never a fake calendar.
// Unified STATE + JOURNAL history (David: «состояние и дневник — одно и то же»): every day
// that has a mood mark OR a written note/tags, newest first, each row showing the state and
// the day's journal note together. Honest empty state.
function StateHistorySheetLive({
  app,
  dark = false
}) {
  var moods = typeof MOOD_OPTIONS !== "undefined" ? MOOD_OPTIONS : [];
  var dm = app && app.dayMoods || {};
  var dn = app && app.dayNotes || {};
  var keys = {};
  Object.keys(dm).forEach(k => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(k) && dm[k] != null) keys[k] = 1;
  });
  Object.keys(dn).forEach(k => {
    var e = dn[k];
    if (/^\d{4}-\d{2}-\d{2}$/.test(k) && e && (e.note != null && ("" + e.note).trim() || e.tags && e.tags.length)) keys[k] = 1;
  });
  var entries = Object.keys(keys).sort().reverse().map(k => {
    var e = dn[k] || {};
    return {
      key: k,
      m: dm[k] != null ? moods[dm[k]] || null : null,
      note: ("" + (e.note || "")).trim(),
      tags: e.tags || []
    };
  });
  var streak = typeof bosMoodStreak === "function" ? bosMoodStreak(dm) : 0;
  var C = dark ? {
    text: "#fff",
    sub: "rgba(255,255,255,0.5)",
    tile: "rgba(255,255,255,0.07)"
  } : {
    text: "#0a0a0a",
    sub: "rgba(0,0,0,0.5)",
    tile: "#f4f4f6"
  };
  var fmt = k => {
    try {
      var a = k.split("-");
      return new Intl.DateTimeFormat("ru-RU", {
        day: "numeric",
        month: "long"
      }).format(new Date(+a[0], +a[1] - 1, +a[2]));
    } catch (e) {
      return k;
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "2px 20px 22px",
      color: C.text
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 700,
      letterSpacing: "-0.3px"
    }
  }, "\u0418\u0441\u0442\u043E\u0440\u0438\u044F \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u044F"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: C.sub,
      marginTop: 3
    }
  }, entries.length ? "Дней с записью: " + entries.length + (streak >= 2 ? "  ·  🔥 " + streak + " " + (typeof bosRuDays === "function" ? bosRuDays(streak) : "дней") + " подряд" : "") : "Здесь будут твои состояния и записи дневника")), entries.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "26px 6px",
      color: C.sub,
      fontSize: 14,
      lineHeight: 1.5
    }
  }, "\u041F\u043E\u043A\u0430 \u043F\u0443\u0441\u0442\u043E \u2014 \u043E\u0442\u043C\u0435\u0442\u044C \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435 \u043D\u0430 \u0433\u043B\u0430\u0432\u043D\u043E\u043C \u044D\u043A\u0440\u0430\u043D\u0435.") : /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      maxHeight: "52vh",
      overflowY: "auto"
    }
  }, entries.map((e, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
      padding: "11px 12px",
      background: C.tile,
      borderRadius: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 36,
      height: 36,
      borderRadius: "50%",
      background: e.m ? "linear-gradient(160deg, " + e.m.c + ", " + e.m.c + "99)" : "rgba(127,181,255,0.18)",
      display: "grid",
      placeItems: "center",
      fontSize: 18,
      flexShrink: 0,
      marginTop: 1
    }
  }, e.m ? e.m.i : "📝"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 600
    }
  }, e.m ? e.m.t : "Запись дня"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: C.sub,
      marginTop: 1
    }
  }, fmt(e.key)), e.note && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: C.text,
      marginTop: 6,
      lineHeight: 1.4,
      whiteSpace: "pre-wrap"
    }
  }, e.note), !e.note && e.tags.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: C.sub,
      marginTop: 5
    }
  }, e.tags.map(t => "#" + ("" + t).replace(/_/g, " ")).join("  ")))))));
}

// LIVE friends sheet (Settings → «Друзья»): the REAL people you invited (referral circle)
// from the cloud. Honest — name + avatar only, no fabricated profiles; empty state nudges to
// invite. No tap-through to ContactDetailLive (that screen is a curated mock).
function FriendsSheetLive({
  dark = false
}) {
  var [people, setPeople] = React.useState(null); // null = loading
  React.useEffect(() => {
    var on = true;
    if (window.bosCloud && window.bosCloud.enabled() && window.bosCloud.invitedPeople) {
      window.bosCloud.invitedPeople().then(list => {
        if (on) setPeople(Array.isArray(list) ? list : []);
      }).catch(() => {
        if (on) setPeople([]);
      });
    } else setPeople([]);
    return () => {
      on = false;
    };
  }, []);
  var C = dark ? {
    text: "#fff",
    sub: "rgba(255,255,255,0.5)",
    tile: "rgba(255,255,255,0.07)"
  } : {
    text: "#0a0a0a",
    sub: "rgba(0,0,0,0.5)",
    tile: "#f4f4f6"
  };
  var _COLORS = ["#e8c8a8", "#a8b9d4", "#d4b8e8", "#a8d4e8", "#b8e8c8", "#e8b8d4", "#d4c8e8"];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "2px 20px 22px",
      color: C.text
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 700,
      letterSpacing: "-0.3px"
    }
  }, "\u0414\u0440\u0443\u0437\u044C\u044F"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: C.sub,
      marginTop: 3
    }
  }, "\u041A\u043E\u0433\u043E \u0442\u044B \u043F\u0440\u0438\u0433\u043B\u0430\u0441\u0438\u043B \u0432 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435")), people === null ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, [0, 1].map(i => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 12px",
      background: C.tile,
      borderRadius: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bos-skel",
    style: {
      width: 38,
      height: 38,
      borderRadius: "50%",
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "bos-skel",
    style: {
      display: "block",
      width: "45%",
      height: 12,
      borderRadius: 6
    }
  })))) : people.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "22px 8px",
      color: C.sub,
      fontSize: 14,
      lineHeight: 1.5
    }
  }, "\u041F\u043E\u043A\u0430 \u043D\u0438\u043A\u043E\u0433\u043E. \u041F\u0440\u0438\u0433\u043B\u0430\u0441\u0438 \u0434\u0440\u0443\u0433\u0430 \u043F\u043E \u0441\u0441\u044B\u043B\u043A\u0435 \u0441 \u0433\u043B\u0430\u0432\u043D\u043E\u0433\u043E \u044D\u043A\u0440\u0430\u043D\u0430 \u2014 \u0437\u0430 \u043A\u0430\u0436\u0434\u043E\u0433\u043E +XP \u043A \u0443\u0440\u043E\u0432\u043D\u044E.") : /*#__PURE__*/React.createElement("div", {
    className: "bos-acc-in",
    style: {
      marginTop: 14,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      maxHeight: "52vh",
      overflowY: "auto"
    }
  }, people.map((p, i) => {
    var nm = p && p.username ? p.username : "Друг";
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        background: C.tile,
        borderRadius: 14
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 38,
        height: 38,
        borderRadius: "50%",
        background: _COLORS[i % _COLORS.length],
        display: "grid",
        placeItems: "center",
        fontSize: 16,
        fontWeight: 700,
        color: "rgba(0,0,0,0.55)",
        flexShrink: 0
      }
    }, nm.charAt(0).toUpperCase()), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15,
        fontWeight: 600
      }
    }, nm), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: C.sub,
        marginTop: 1
      }
    }, "\u0412 \u0442\u0432\u043E\u0451\u043C \u043A\u0440\u0443\u0433\u0435")));
  })));
}
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
  // «Обучение» cards on the Habits screen — ON shows them, OFF hides (restore after «Скрыть»).
  var [learnOn, setLearnOn] = React.useState(() => !(typeof bosLearnHidden === "function" && bosLearnHidden()));
  var setLearnPersist = on => {
    setLearnOn(on);
    if (typeof bosSetLearnHidden === "function") bosSetLearnHidden(!on);
  };
  // Grouped iOS-style sections (v279 reno): ONE card per group, hairline-divided rows inside.
  // Helpers are plain render-fns (not components) so toggling never remounts the list.
  var PRIVACY_BODY = "Мы храним только то, что нужно приложению: твои привычки, состояние и записи. Они привязаны к твоему аккаунту Telegram. Полные документы — на сайте проекта.";
  var chip = icon => /*#__PURE__*/React.createElement("span", {
    className: "bos-sys-chip-bg",
    style: {
      width: 30,
      height: 30,
      borderRadius: "50%",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, React.createElement(icon, {
    size: 16,
    color: "var(--text)"
  }));
  var row = (icon, label, onClick, last) => /*#__PURE__*/React.createElement("button", {
    key: label,
    onClick: onClick,
    className: "tap",
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      width: "100%",
      background: "transparent",
      border: 0,
      borderBottom: last ? "none" : "0.5px solid var(--line)",
      cursor: "pointer",
      textAlign: "left",
      padding: "13px 14px"
    }
  }, icon ? chip(icon) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 15,
      fontWeight: 600,
      color: "var(--text)"
    }
  }, label), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 16,
    className: "bos-sys-text-2"
  }));
  var toggleRow = (icon, label, val, set, last) => /*#__PURE__*/React.createElement("div", {
    key: label,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 14px",
      borderBottom: last ? "none" : "0.5px solid var(--line)"
    }
  }, chip(icon), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 15,
      fontWeight: 600,
      color: "var(--text)"
    }
  }, label), /*#__PURE__*/React.createElement(Switch, {
    on: val,
    onChange: set,
    dark: isDark
  }));
  var group = (title, rows) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: title
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-card",
    style: {
      marginTop: 8,
      padding: 0,
      overflow: "hidden"
    }
  }, rows));
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      padding: "0 16px 24px"
    }
  }, /*#__PURE__*/React.createElement(PageHeader, {
    title: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438",
    onBack: () => navigate("profile")
  }), group("Профиль", [row(I.Pencil, "Редактировать профиль", () => openSheet(/*#__PURE__*/React.createElement(EditProfileSheet, {
    dark: routeDark
  }))), row(I.Globe, "Вход через Telegram", () => openSheet(/*#__PURE__*/React.createElement(InfoSheet, {
    title: "\u0412\u0445\u043E\u0434 \u0447\u0435\u0440\u0435\u0437 Telegram",
    body: "\u0422\u044B \u0432\u0445\u043E\u0434\u0438\u0448\u044C \u0447\u0435\u0440\u0435\u0437 \u0441\u0432\u043E\u0439 \u0430\u043A\u043A\u0430\u0443\u043D\u0442 Telegram \u2014 \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u044B\u0439 \u043F\u0430\u0440\u043E\u043B\u044C \u043D\u0435 \u043D\u0443\u0436\u0435\u043D. \u0422\u0432\u043E\u0438 \u0434\u0430\u043D\u043D\u044B\u0435 \u043F\u0440\u0438\u0432\u044F\u0437\u0430\u043D\u044B \u043A \u043D\u0435\u043C\u0443 \u0438 \u043F\u0435\u0440\u0435\u043D\u043E\u0441\u044F\u0442\u0441\u044F \u043C\u0435\u0436\u0434\u0443 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430\u043C\u0438.",
    cta: "\u041F\u043E\u043D\u044F\u0442\u043D\u043E",
    dark: routeDark
  })), true)]), group("Предпочтения", [toggleRow(I.Eye, "Тёмная тема", isDark, setDark), toggleRow(I.Bell, "Push-уведомления", push, setPushPersist), toggleRow(I.Book, "Карточки-подсказки", learnOn, setLearnPersist, true)]), group("Главный экран", [row(I.Home, "Виджеты на главном", () => navigate("home-customize"), true)]), group("О приложении", [row(I.Sparkles, "Манифест", () => navigate("manifest", {
    from: "settings"
  })), row(null, "Политика конфиденциальности", () => openSheet(/*#__PURE__*/React.createElement(InfoSheet, {
    title: "\u041F\u043E\u043B\u0438\u0442\u0438\u043A\u0430 \u043A\u043E\u043D\u0444\u0438\u0434\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u0438",
    body: PRIVACY_BODY,
    cta: "\u0413\u043E\u0442\u043E\u0432\u043E",
    dark: routeDark
  }))), row(null, "Условия использования", () => openSheet(/*#__PURE__*/React.createElement(InfoSheet, {
    title: "\u0423\u0441\u043B\u043E\u0432\u0438\u044F \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u044F",
    body: PRIVACY_BODY,
    cta: "\u0413\u043E\u0442\u043E\u0432\u043E",
    dark: routeDark
  })), true)]), /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-3",
    style: {
      textAlign: "center",
      padding: "16px 14px 2px",
      fontSize: 13
    }
  }, "\u0412\u0435\u0440\u0441\u0438\u044F ", APP_VERSION));
}
function NotificationsLive() {
  var {
    navigate,
    params
  } = useNav();
  var app = typeof useApp === "function" ? useApp() : null;
  // LIVE: real notifications computed from the cloud — unread team-chat messages.
  // Nothing scripted ever reaches a real user, so there is no sample list.
  var [liveItems, setLiveItems] = React.useState(null); // null = still loading (skeleton); [] = loaded-empty
  React.useEffect(() => {
    if (!(window.bosCloud && window.bosCloud.enabled())) {
      setLiveItems([]);
      return;
    }
    var teams = (app?.teams || []).filter(t => t.cloudId);
    if (!teams.length) {
      setLiveItems([]);
      return;
    } // no cloud teams → no notifications, skip the skeleton
    var on = true;
    (async () => {
      try {
        var me = await window.bosCloud.uid();
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
      } catch (e) {
        if (on) setLiveItems([]);
      }
    })();
    return () => {
      on = false;
    };
  }, []);
  var loading = liveItems === null;
  var shown = liveItems || [];
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
  }), loading ? /*#__PURE__*/React.createElement("div", {
    className: "bos-acc-in",
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, [0, 1].map(i => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "bos-sys-card",
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bos-skel",
    style: {
      width: 38,
      height: 38,
      borderRadius: "50%",
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bos-skel",
    style: {
      display: "block",
      width: "60%",
      height: 12,
      borderRadius: 6
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "bos-skel",
    style: {
      display: "block",
      width: "40%",
      height: 10,
      borderRadius: 6,
      marginTop: 7
    }
  }))))) : shown.length === 0 ? /*#__PURE__*/React.createElement("div", {
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
  // «Компактно» (minimalist, default) ↔ «Подробно» — the SAME eye toggle as the habit-detail
  // calendar (David: «минималистичный вид + переключение как в привычках»).
  var [compact, setCompact] = useP(true);
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
  // Heat-cell tokens for the squircle calendar — graphite fill by completion, grey glass rings,
  // no gold (David: золото на дне не подходит → серое стекло; единый язык с деталью привычки).
  var cellFut = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.025)";
  var todayRingC = isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.42)";
  var selRingC = isDark ? "rgba(255,255,255,0.42)" : "rgba(0,0,0,0.28)";

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
    title: "\u041A\u0430\u043B\u0435\u043D\u0434\u0430\u0440\u044C",
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
  }, "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u0438\u0441\u0442\u043E\u0440\u0438\u0438"), "\u041E\u0442\u043C\u0435\u0447\u0430\u0439 \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0438, \u0438 \u0442\u0443\u0442 \u043F\u043E\u044F\u0432\u0438\u0442\u0441\u044F \u0442\u0432\u043E\u0439 \u0440\u0438\u0442\u043C.") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(StatTrioLive, {
    isDark: isDark,
    card: {
      background: "var(--card)",
      boxShadow: "var(--card-shadow)",
      transform: "translateZ(0)"
    },
    items: [{
      l: "Лучшая",
      v: bestStreak,
      suf: "д",
      icon: /*#__PURE__*/React.createElement(I.Flame, {
        size: 14,
        color: "var(--text-4)"
      })
    }, {
      l: "Идеальных",
      v: perfectDays,
      suf: "",
      icon: /*#__PURE__*/React.createElement(I.Trophy, {
        size: 14,
        color: "var(--text-4)"
      })
    }, {
      l: "Отметок",
      v: Math.round(totalDone),
      suf: "",
      icon: /*#__PURE__*/React.createElement(I.ChartBar, {
        size: 14,
        color: "var(--text-4)"
      })
    }]
  }), /*#__PURE__*/React.createElement(SysCard, {
    style: {
      padding: 16,
      marginTop: 12,
      borderRadius: 22,
      transform: "translateZ(0)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12
    }
  }, compact ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      letterSpacing: "-0.3px"
    }
  }, monthName, " ", year) : /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("button", {
    onClick: () => setCompact(c => !c),
    className: "tap",
    "aria-label": compact ? "Подробно" : "Компактно",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      background: TH.chipBg,
      border: 0,
      borderRadius: 999,
      padding: "5px 11px",
      color: "var(--text-2)",
      fontSize: 12,
      fontWeight: 600,
      cursor: "pointer",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(I.Eye, {
    size: 14,
    color: "var(--text-3)"
  }), compact ? "Подробно" : "Компактно")), !compact && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setMIdx(m => Math.max(0, m - 1)),
    disabled: mIdx === 0,
    "data-haptic": "selection",
    className: "tap hit44",
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
      fontSize: 16,
      fontWeight: 700,
      letterSpacing: "-0.3px"
    }
  }, monthName, " ", year), /*#__PURE__*/React.createElement("button", {
    onClick: () => setMIdx(m => Math.min(11, m + 1)),
    disabled: mIdx === 11,
    "data-haptic": "selection",
    className: "tap hit44",
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
  }))), !compact && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(7, 1fr)",
      gap: 6,
      maxWidth: 300,
      width: "100%",
      margin: "14px auto 0"
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
  }, w))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(7, 1fr)",
      gap: 6,
      maxWidth: 300,
      width: "100%",
      margin: compact ? "0 auto" : "6px auto 0"
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
    var fut = pct == null;
    var isSelected = selDay === c.d;
    var isToday = isCurMonth && c.d === today;
    var filled = !fut && pct > 0;
    var bg = fut ? cellFut : pct <= 0 ? TH.cellIdle : bosCellFill("#0a0a0a", pct);
    var ink = fut ? TH.cellMuted : pct <= 0 ? TH.cellText : bosCellInk("#0a0a0a", pct, isDark);
    var ring = isToday ? todayRingC : !compact && isSelected ? selRingC : null;
    var sh = [filled ? bosCellGlass(isDark) : "", ring ? "0 0 0 1.6px " + ring : ""].filter(Boolean).join(", ") || "none";
    return /*#__PURE__*/React.createElement("button", {
      key: c.key,
      onClick: compact ? undefined : () => setSelDay(c.d),
      className: "tap",
      style: {
        aspectRatio: "1/1",
        border: 0,
        borderRadius: "30%",
        padding: 0,
        display: "grid",
        placeItems: "center",
        position: "relative",
        fontSize: 12.5,
        fontWeight: isToday ? 700 : 500,
        cursor: compact ? "default" : "pointer",
        background: bg,
        boxShadow: sh,
        color: ink
      }
    }, !compact && !fut && /*#__PURE__*/React.createElement("span", {
      style: {
        position: "relative",
        zIndex: 1
      }
    }, c.d));
  })), !compact && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bos-sys-text-3",
    style: {
      fontSize: 11
    }
  }, "\u041C\u0435\u043D\u044C\u0448\u0435"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 5,
      alignItems: "center"
    }
  }, [0, 0.25, 0.5, 0.75, 1].map((p, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      width: 15,
      height: 15,
      borderRadius: "30%",
      background: p <= 0 ? TH.cellIdle : bosCellFill("#0a0a0a", p),
      boxShadow: p > 0 ? bosCellGlass(isDark) : "none"
    }
  }))), /*#__PURE__*/React.createElement("span", {
    className: "bos-sys-text-3",
    style: {
      fontSize: 11
    }
  }, "\u0411\u043E\u043B\u044C\u0448\u0435"))), !compact && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
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
      padding: 0,
      transform: "translateZ(0)"
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
      background: bosCellFill("#0a0a0a", 1),
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
        ...bosChipGlass(isDark)
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
        borderRadius: 13,
        background: BOS_TILE_SHEEN + ", " + (isDark ? "rgba(255,255,255,0.06)" : "var(--surface-3)"),
        boxShadow: bosTileGlass(isDark),
        display: "grid",
        placeItems: "center",
        fontSize: 18,
        flexShrink: 0
      }
    }, bosIcon(h.e, 18, null)), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        fontSize: 15,
        fontWeight: 600,
        color: "var(--text)",
        letterSpacing: "-0.2px"
      }
    }, h.n), /*#__PURE__*/React.createElement("span", {
      className: "check-btn " + (done ? "" : "unchecked"),
      style: {
        width: 26,
        height: 26
      }
    }, done && /*#__PURE__*/React.createElement(I.Check, {
      size: 14,
      strokeWidth: 2.5,
      color: "#fff"
    }))), i < dayHabits.length - 1 && /*#__PURE__*/React.createElement("div", {
      className: "divider"
    }));
  }))))));
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
    onClick: () => setOpenFaq(o => o === f.q ? null : f.q)
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
  var {
    open: openSheet
  } = useSheet();
  var dark = app?.themeOverride === "dark";
  var back = params?.from || "profile";
  // LIVE: achievements earned by real signals — the real bosEarnedAchievementsLive ladder.
  var LIST = bosEarnedAchievementsLive(app);
  var byId = {};
  LIST.forEach(a => {
    byId[a.id] = a;
  });
  var earnedN = LIST.filter(a => a.earned).length;
  var _achXP = LIST.filter(a => a.earned).reduce((s, a) => s + (a.xp || 0), 0);
  // Category ladders — each badge grows within its branch (Apple-Fitness-style award grid).
  // Emoji art for now (David: native custom art later); grouped by what earns it.
  var CATS = [{
    t: "Старт",
    ids: ["first_habit"]
  }, {
    t: "Уровни",
    ids: ["lvl5", "lvl10", "lvl15", "lvl20", "lvl25"]
  }, {
    t: "Серии привычек",
    ids: ["habit21", "habit60"]
  }, {
    t: "Забота о себе",
    ids: ["week_state", "care30", "care100", "care180", "year"]
  }, {
    t: "Цели и команда",
    ids: ["goal", "team"]
  }];
  var showDetail = a => openSheet(/*#__PURE__*/React.createElement(InfoSheet, {
    dark: dark,
    title: a.t,
    body: (a.earned ? "Открыто ✓\n\n" : "Как открыть: " + (a.how || "") + "\n\n") + a.d + (a.xp ? "  ·  +" + a.xp + " XP" : ""),
    cta: "\u0413\u043E\u0442\u043E\u0432\u043E"
  }));
  var tile = a => /*#__PURE__*/React.createElement("button", {
    key: a.id,
    onClick: () => showDetail(a),
    className: "tap",
    "aria-label": a.t,
    style: {
      border: 0,
      background: "transparent",
      padding: 0,
      cursor: "pointer",
      display: "grid",
      placeItems: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: "100%",
      maxWidth: 58,
      aspectRatio: "1",
      borderRadius: 16,
      display: "grid",
      placeItems: "center",
      fontSize: 27,
      position: "relative",
      background: a.earned ? a.accent + "26" : "var(--card-2)",
      boxShadow: a.earned ? "inset 0 0 0 1.5px " + a.accent + "55" : "none",
      filter: a.earned ? "none" : "grayscale(1)",
      opacity: a.earned ? 1 : 0.5
    }
  }, a.i, !a.earned && /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      right: -2,
      bottom: -2,
      width: 18,
      height: 18,
      borderRadius: "50%",
      background: "var(--card)",
      display: "grid",
      placeItems: "center",
      fontSize: 9
    }
  }, "\uD83D\uDD12")));
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      padding: "0 16px 24px"
    }
  }, /*#__PURE__*/React.createElement(PageHeader, {
    title: "\u0414\u043E\u0441\u0442\u0438\u0436\u0435\u043D\u0438\u044F",
    onBack: () => navigate(back)
  }), CATS.map(cat => {
    var items = cat.ids.map(id => byId[id]).filter(Boolean);
    if (!items.length) return null;
    var got = items.filter(a => a.earned).length;
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: cat.t
    }, /*#__PURE__*/React.createElement("div", {
      className: "section-label",
      style: {
        marginTop: 22,
        padding: "0 4px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline"
      }
    }, /*#__PURE__*/React.createElement("span", null, cat.t), /*#__PURE__*/React.createElement("span", {
      className: "bos-sys-text-3",
      style: {
        fontWeight: 600,
        fontSize: 12
      }
    }, got, "/", items.length)), /*#__PURE__*/React.createElement(SysCard, {
      style: {
        padding: "16px 14px",
        marginTop: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: 12
      }
    }, items.map(tile))));
  }));
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

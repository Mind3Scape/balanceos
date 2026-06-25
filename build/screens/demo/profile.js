/* PROFILE / SETTINGS + sub-screens: Notifications, Support, Settings, Login/SignUp, Onboarding, AI/Insights.
   All system screens use semantic classes (.bos-sys-*) so they look right in BOTH light and dark themes. */
var {
  useState: useP
} = React;

/* Theme-aware helpers used across system screens.
   In the dark theme the .bos-sys-card class flips its own bg & text. */
function FeedbackSheet({
  title = "Написать в поддержку",
  dark = false
}) {
  var app = typeof useApp === "function" ? useApp() : null;
  var isLive = app?.mode === "live";
  var {
    close
  } = useSheet();
  var C = sheetColors(dark);
  var [txt, setTxt] = useP("");
  var [sent, setSent] = useP(false);
  // LIVE: actually hand the message to a real channel (the support email composer) —
  // never a fake "delivered". DEMO: keep the showcase success animation.
  var send = () => {
    if (isLive) {
      var body = (txt || "").trim();
      if (!body) return;
      try {
        var url = "mailto:" + BOS_SUPPORT_EMAIL + "?subject=" + encodeURIComponent("BalanceOS · " + title) + "&body=" + encodeURIComponent(body);
        if (window.__TG && window.__TG.openLink) window.__TG.openLink(url);else window.location.href = url;
      } catch (e) {}
      close();
      return;
    }
    setSent(true);
    window.setTimeout(close, 1000);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "2px 20px 6px",
      color: C.text
    }
  }, sent ? /*#__PURE__*/React.createElement(SheetDone, {
    C: C,
    label: "\u041E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E"
  }) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 19,
      fontWeight: 700,
      textAlign: "center"
    }
  }, title), /*#__PURE__*/React.createElement("textarea", {
    value: txt,
    onChange: e => setTxt(e.target.value),
    placeholder: "\u041E\u043F\u0438\u0448\u0438 \u0432\u043E\u043F\u0440\u043E\u0441\u2026",
    rows: 4,
    style: {
      width: "100%",
      marginTop: 14,
      background: C.field,
      border: "1px solid " + C.line,
      borderRadius: 14,
      padding: 12,
      fontSize: 14,
      color: C.text,
      fontFamily: "inherit",
      resize: "none",
      outline: "none",
      boxSizing: "border-box"
    }
  }), isLive && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: C.sub,
      marginTop: 8,
      lineHeight: 1.45
    }
  }, "\u041E\u0442\u043A\u0440\u043E\u0435\u0442\u0441\u044F \u043F\u0438\u0441\u044C\u043C\u043E \u043D\u0430 ", BOS_SUPPORT_EMAIL, " \u2014 \u043E\u0442\u043F\u0440\u0430\u0432\u044C \u0435\u0433\u043E, \u0438 \u043C\u044B \u043E\u0442\u0432\u0435\u0442\u0438\u043C."), /*#__PURE__*/React.createElement("button", {
    onClick: send,
    disabled: isLive && !txt.trim(),
    className: "tap",
    style: {
      width: "100%",
      marginTop: 12,
      background: C.btn,
      color: C.btnFg,
      border: 0,
      borderRadius: 999,
      padding: 13,
      fontSize: 15,
      fontWeight: 600,
      opacity: isLive && !txt.trim() ? 0.5 : 1
    }
  }, isLive ? "Написать письмо" : "Отправить")));
}

/* A few demo "invited people" (Memoji) so the multiplayer orbit reads in DEMO too —
   in the live Telegram app these are real people from your referral circle (T1). */
var DEMO_ORBIT_PEOPLE = [{
  avatar: "m12"
}, {
  avatar: "m14"
}, {
  avatar: "m7"
}, {
  avatar: "m3"
}, {
  avatar: "m8"
}];

/* Orbit field — YOUR personal cosmos, the same liquid-glass solar system as the
   onboarding finale, but real and yours. You sit in the centre; concentric glowing
   rings carry your habits and the people you bring in.
   · Habits are placed by STRENGTH (streak): the strongest sits on the inner ring,
     bigger and brighter; a brand-new one starts on the 3rd ring, small. Прокачиваешь —
     она перетекает ближе к центру и растёт.
   · People (your referral circle) ride the rings by invite order — the first you
     invited sits closest.
   · As habits/people accumulate, outer rings drift past the frame "into the distance".
   Dark starfield + mood-tinted core glow so it feels full-screen and alive. Animated
   on a real clock (useT) like onboarding; reflected in demo with sample people. */
function ProfileScreen() {
  var {
    navigate
  } = useNav();
  var app = typeof useApp === "function" ? useApp() : null;
  var {
    open: openSheet
  } = useSheet();
  var openAvatar = () => openSheet(/*#__PURE__*/React.createElement(AvatarPickerSheet, {
    dark: app?.themeOverride === "dark"
  }));
  var _isLive = app?.mode !== "demo"; // live AND fresh = real data; only demo is curated
  var _xp = _isLive ? bosLiveXP(app) : 0;
  var _li = bosLevelInfo(_xp);
  var lvlNum = app?.mode === "demo" ? 7 : _isLive ? _li.level : 1;
  var lvlPct = app?.mode === "demo" ? 72 : _isLive ? _li.pct : 2;

  // Real multiplayer: pull the people you've actually invited (referral circle) from
  // the cloud and put them on your orbit. Demo shows sample faces so it still reads.
  var [livePeople, setLivePeople] = React.useState([]);
  React.useEffect(() => {
    if (!_isLive) return;
    var on = true;
    try {
      if (window.bosCloud && window.bosCloud.enabled()) {
        window.bosCloud.invitedPeople().then(list => {
          if (on && Array.isArray(list)) setLivePeople(list.map(p => ({
            avatar: p && p.avatar || "default"
          })));
        }).catch(() => {});
      }
    } catch (e) {}
    return () => {
      on = false;
    };
  }, [_isLive]);
  var orbitPeople = app?.mode === "demo" ? DEMO_ORBIT_PEOPLE : livePeople;

  // Achievements badge — REAL earned set + emojis for live; curated 4/8 for demo.
  var _liveAch = _isLive ? bosEarnedAchievements(app).filter(a => a.earned) : [];
  var _achTotal = _isLive ? BOS_ACHIEVEMENTS.length : 8;
  var _achEarnedN = _isLive ? _liveAch.length : 4;
  var _achEmojis = _isLive ? _liveAch.slice(0, 3).map(a => a.i) : ["⚡", "🧘", "🤝"];
  var _achCircles = _isLive ? livePeople.length : 3;
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      padding: "0 16px 24px"
    }
  }, /*#__PURE__*/React.createElement(PageHeader, {
    onBack: () => navigate("home"),
    title: ""
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement(OrbitField, {
    avatar: app?.avatar,
    habits: app?.habits || [],
    people: orbitPeople,
    levelPct: lvlPct,
    onTap: openAvatar,
    moodC: app?.mood?.c,
    dark: app?.themeOverride === "dark"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      marginTop: 2,
      background: "#0a0a0a",
      color: "#FEDE34",
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: 0.3,
      padding: "4px 12px",
      borderRadius: 999
    }
  }, /*#__PURE__*/React.createElement(I.Sparkles, {
    size: 11
  }), " \u0423\u0440\u043E\u0432\u0435\u043D\u044C ", lvlNum), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--bos-title-font)",
      fontWeight: 700,
      fontSize: 28,
      marginTop: 14
    }
  }, app?.mode === "demo" ? "Павел Хиллсон" : app?.userName || "Ты"), app?.mode === "demo" && /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-2",
    style: {
      fontSize: 14
    }
  }, "tomhill@mail.com"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center",
      gap: 8,
      marginTop: 14
    }
  }, (app?.mode === "demo" ? [{
    l: "Уровень",
    v: "7"
  }, {
    l: "До 8 ур.",
    v: "72%"
  }, {
    l: "Опыт",
    v: "1 240"
  }] : [{
    l: "Уровень",
    v: "" + lvlNum
  }, {
    l: "До " + (lvlNum + 1) + " ур.",
    v: lvlPct + "%"
  }, {
    l: "Опыт",
    v: "" + _xp
  }]).map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "bos-sys-card",
    style: {
      padding: "8px 16px",
      borderRadius: 22,
      minWidth: 72
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-3",
    style: {
      fontSize: 10,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      fontWeight: 600
    }
  }, s.l), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      letterSpacing: "-0.4px",
      marginTop: 1
    }
  }, s.v))))), /*#__PURE__*/React.createElement(SysCard, {
    className: "tap",
    onClick: () => navigate("achievements", {
      from: "profile"
    }),
    style: {
      marginTop: 22,
      padding: 14,
      display: "flex",
      alignItems: "center",
      gap: 13,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 42,
      height: 42,
      borderRadius: 14,
      background: "rgba(254,222,52,0.16)",
      display: "grid",
      placeItems: "center",
      fontSize: 22,
      flexShrink: 0
    }
  }, "\uD83C\uDFC5"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 600
    }
  }, "\u0414\u043E\u0441\u0442\u0438\u0436\u0435\u043D\u0438\u044F"), /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-3",
    style: {
      fontSize: 12.5,
      marginTop: 2
    }
  }, _isLive ? _achEarnedN + " из " + _achTotal + (_achCircles > 0 ? " · " + _achCircles + (_achCircles === 1 ? " приглашён" : " приглашено") : _achEarnedN === 0 ? " · открой первую" : "") : "4 из 8 · открыли 3 круга контактов")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      marginRight: 4
    }
  }, _achEmojis.map((e, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      width: 26,
      height: 26,
      borderRadius: 8,
      background: "var(--card-2)",
      display: "grid",
      placeItems: "center",
      fontSize: 13,
      marginLeft: i ? -7 : 0,
      border: "1.5px solid var(--card)"
    }
  }, e))), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 18,
    className: "bos-sys-text-2"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      marginTop: 12
    }
  }, [{
    id: "settings",
    icon: I.Settings,
    label: "Настройки"
  }, {
    id: "notifications",
    icon: I.Bell,
    label: "Уведомления"
  }, {
    id: "history",
    icon: I.Clock,
    label: "История"
  }, {
    id: "ai",
    icon: I.Sparkles,
    label: "ИИ-инсайты"
  }, {
    id: "support",
    icon: I.Help,
    label: "Поддержка и помощь"
  }].map(r => /*#__PURE__*/React.createElement(SysBtn, {
    key: r.id,
    onClick: () => navigate(r.id, {
      from: "profile"
    })
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
      fontSize: 16,
      fontWeight: 500
    }
  }, r.label), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 18,
    className: "bos-sys-text-2"
  }))), /*#__PURE__*/React.createElement(SysBtn, {
    onClick: () => navigate("onboarding", {
      from: "profile"
    }),
    style: {
      color: "var(--accent-red)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 32,
      height: 32,
      borderRadius: "50%",
      display: "grid",
      placeItems: "center",
      flexShrink: 0,
      background: "rgba(239,68,68,0.12)"
    }
  }, /*#__PURE__*/React.createElement(I.Logout, {
    size: 16
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 16,
      fontWeight: 600
    }
  }, "\u0412\u044B\u0439\u0442\u0438"))));
}
function SettingsScreen() {
  var {
    navigate
  } = useNav();
  var app = useApp();
  var {
    open: openSheet
  } = useSheet();
  var routeDark = app?.themeOverride !== "light"; // settings is a dark route unless globally forced light
  var isLive = app?.mode === "live";
  // Push is a REAL saved setting for live users — persisted to localStorage by profile id,
  // and it gates the Telegram push the bot sends. Demo keeps an in-memory toggle for show.
  var pushKey = "bos:push:" + (app?.persistId || "live");
  var [push, setPush] = useP(() => {
    if (!isLive) return true;
    try {
      var v = localStorage.getItem(pushKey);
      return v == null ? true : v === "1";
    } catch (e) {
      return true;
    }
  });
  var setPushPersist = on => {
    setPush(on);
    if (isLive) {
      try {
        localStorage.setItem(pushKey, on ? "1" : "0");
      } catch (e) {}
    }
  };
  var [sound, setSound] = useP(true); // demo-only switch (nothing reads it); hidden for live
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
  }, (isLive
  // LIVE: real Telegram users have no password and no separately-linked Google/Apple —
  // one honest row explains how the sign-in actually works. No fake "Google подключён".
  ? [{
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
  }] : [{
    label: "Редактировать профиль",
    icon: I.Pencil,
    on: () => openSheet(/*#__PURE__*/React.createElement(EditProfileSheet, {
      dark: routeDark
    }))
  }, {
    label: "Пароль",
    icon: I.Lock,
    on: () => openSheet(/*#__PURE__*/React.createElement(InfoSheet, {
      title: "\u0421\u043C\u0435\u043D\u0438\u0442\u044C \u043F\u0430\u0440\u043E\u043B\u044C",
      body: "\u041F\u0440\u0438\u0448\u043B\u0451\u043C \u0441\u0441\u044B\u043B\u043A\u0443 \u0434\u043B\u044F \u0441\u043C\u0435\u043D\u044B \u043F\u0430\u0440\u043E\u043B\u044F \u043D\u0430 \u0442\u0432\u043E\u044E \u043F\u043E\u0447\u0442\u0443 \u2014 \u043E\u0442\u043A\u0440\u043E\u0439 \u0435\u0451 \u043D\u0430 \u044D\u0442\u043E\u043C \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0435.",
      cta: "\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u0441\u0441\u044B\u043B\u043A\u0443",
      dark: routeDark
    }))
  }, {
    label: "Привязанные аккаунты",
    icon: I.Globe,
    on: () => openSheet(/*#__PURE__*/React.createElement(InfoSheet, {
      title: "\u041F\u0440\u0438\u0432\u044F\u0437\u0430\u043D\u043D\u044B\u0435 \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u044B",
      body: "Google \u2014 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0451\u043D. Apple \u2014 \u043D\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0451\u043D. \u0427\u0435\u0440\u0435\u0437 \u043D\u0438\u0445 \u043C\u043E\u0436\u043D\u043E \u0432\u0445\u043E\u0434\u0438\u0442\u044C \u0431\u0435\u0437 \u043F\u0430\u0440\u043E\u043B\u044F.",
      cta: "\u0413\u043E\u0442\u043E\u0432\u043E",
      dark: routeDark
    }))
  }]).map((r, i) => /*#__PURE__*/React.createElement(SysBtn, {
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
      fontSize: 15
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
  // Push is real & persisted for live (gates Telegram push); in-memory for demo.
  {
    label: "Push-уведомления",
    icon: I.Bell,
    val: push,
    set: isLive ? setPushPersist : setPush
  },
  // "Звук" has no consumer yet → keep it only in the demo showcase, hide for live
  // so a real user never meets a toggle that does nothing.
  ...(isLive ? [] : [{
    label: "Звук",
    icon: I.Volume,
    val: sound,
    set: setSound
  }]), {
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
      fontSize: 15
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
      fontSize: 15
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
        fontWeight: 500,
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
      fontSize: 15
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
      fontSize: 15
    }
  }, "\u041C\u0430\u043D\u0438\u0444\u0435\u0441\u0442"), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 16,
    className: "bos-sys-text-2"
  })), ["Политика конфиденциальности", "Условия использования", "Версия 2.4.1"].map((l, i, a) => i < a.length - 1 ? /*#__PURE__*/React.createElement(SysBtn, {
    key: i,
    onClick: () => openSheet(/*#__PURE__*/React.createElement(InfoSheet, {
      title: l,
      body: isLive ? "Мы храним только то, что нужно приложению: твои привычки, состояние и записи. Они привязаны к твоему аккаунту Telegram. Полные документы — на сайте проекта." : "Это демо-макет BalanceOS. Полный текст документа появится в релизной версии приложения.",
      cta: "\u0413\u043E\u0442\u043E\u0432\u043E",
      dark: routeDark
    })),
    style: {
      padding: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 15
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
function NotificationsScreen() {
  var {
    navigate,
    params
  } = useNav();
  var app = typeof useApp === "function" ? useApp() : null;
  var live = app?.mode === "live";
  var [items, setItems] = useP([{
    i: "🔥",
    t: "7 дней подряд!",
    b: "Ты в огне — продолжай завтра.",
    w: "Только что",
    new: true
  }, {
    i: "👥",
    t: "Ник пригласил тебя в «Команду создателей»",
    b: "Нажми, чтобы принять и присоединиться к цели.",
    w: "2 ч",
    new: true,
    go: "community"
  }, {
    i: "🧘🏼‍♀️",
    t: "Напоминание о медитации",
    b: "Твоя сегодняшняя сессия в 09:30.",
    w: "5 ч"
  }, {
    i: "✨",
    t: "Готов новый ИИ-инсайт",
    b: "Вечером у тебя самая высокая энергия.",
    w: "1 д",
    go: "ai"
  }, {
    i: "📚",
    t: "Новый курс: Основы привычек",
    b: "2 минуты — начни когда угодно.",
    w: "2 д",
    go: "community"
  }]);
  // LIVE: real notifications computed from the cloud — unread team-chat messages.
  // Demo keeps its sample list above; nothing fake reaches a real user.
  var [liveItems, setLiveItems] = React.useState([]);
  React.useEffect(() => {
    if (!live || !(window.bosCloud && window.bosCloud.enabled())) return;
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
  }, [live]);
  var shown = live ? liveItems : items;
  var clearAll = () => {
    if (live) setLiveItems([]);else setItems([]);
  };
  var tap = (n, idx) => {
    if (!live) setItems(list => list.map((x, j) => j === idx ? {
      ...x,
      new: false
    } : x));
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
      fontSize: 15
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

/* One calendar day-ring: faint track + progress arc (shared #calRing gradient).
   pct 0..1; `glow` lights a full ring up for a perfect day. */
function HistoryScreen() {
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
  var isLive = app?.mode !== "demo"; // live AND fresh = real history; only demo is curated
  var MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  var DIM = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  // DEMO walks a synthetic April-2026; LIVE walks the user's REAL calendar (today = now).
  var _now = new Date();
  var CUR_M = isLive ? _now.getMonth() : 3; // April is "this month" in the demo
  var year = isLive ? _now.getFullYear() : 2026;
  var today = isLive ? _now.getDate() : 28;
  var _leap = y => y % 4 === 0 && y % 100 !== 0 || y % 400 === 0;
  var [mIdx, setMIdx] = useP(CUR_M);
  var monthName = MONTHS[mIdx];
  var daysInMonth = isLive && mIdx === 1 && _leap(year) ? 29 : DIM[mIdx];
  // LIVE: real weekday of the 1st of the shown month; DEMO: its stable synthetic offset.
  var startWeekday = isLive ? new Date(year, mIdx, 1).getDay() : (mIdx * 3 + 3) % 7;
  var isCurMonth = mIdx === CUR_M;
  var isFuture = mIdx > CUR_M;
  var lastLogged = isCurMonth ? today : daysInMonth; // past months fully logged; this one up to today

  // LIVE: a day's completion = share of the user's habits logged on that real date.
  // h.log is keyed by local ISO date ("2026-06-23"); 0 habits → null (nothing to show).
  var liveHabits = app?.habits || [];
  var iso = d => year + "-" + (mIdx + 1 < 10 ? "0" : "") + (mIdx + 1) + "-" + (d < 10 ? "0" : "") + d;
  var completion = d => {
    if (isLive) {
      if (isFuture || d > lastLogged) return null;
      if (!liveHabits.length) return null;
      var k = iso(d);
      var done = liveHabits.reduce((s, h) => s + (h && h.log && h.log[k] ? 1 : 0), 0);
      return done / liveHabits.length;
    }
    if (isFuture || d > lastLogged) return null;
    var v = (Math.sin((d + mIdx * 7) * 13.37) + 1) / 2;
    return Math.round(v * 6) / 6;
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

  // Curated demo habit row vs. the live user's REAL habits (done-state resolved per day below).
  var demoDayHabits = [{
    e: "🙏",
    n: "Помогать другим",
    on: true
  }, {
    e: "🧘🏼‍♀️",
    n: "Медитация",
    on: true
  }, {
    e: "🏃🏼‍♀️",
    n: "Утренняя пробежка",
    on: true
  }, {
    e: "📚",
    n: "Читать книгу",
    on: false
  }, {
    e: "✍🏼",
    n: "Бумажный дневник",
    on: false
  }, {
    e: "🥊",
    n: "Бокс",
    on: true
  }];
  // For LIVE day-detail: each real habit + whether it was logged on the selected date.
  var liveDayHabits = d => liveHabits.map(h => ({
    e: h.emoji || "✨",
    n: h.name || "Привычка",
    on: !!(h && h.log && h.log[iso(d)])
  }));
  var dayHabits = isLive ? liveDayHabits(selDay) : demoDayHabits;
  var selPct = completion(selDay);

  // Stats — REAL for live (across all logged history), curated for demo.
  var totalDone, perfectDays, bestStreak;
  if (isLive) {
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
  } else {
    totalDone = days.reduce((s, d) => s + (completion(d.d) || 0) * demoDayHabits.length, 0);
    perfectDays = days.filter(d => completion(d.d) === 1).length;
    bestStreak = 21;
  }
  // LIVE empty state: no habits at all, OR habits but not a single logged day yet.
  var liveHasHistory = liveHabits.length > 0 && totalDone > 0;
  var showEmpty = isLive && !liveHasHistory;
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
  /* LIVE & no history yet — honest empty state, never a fake calendar. */
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
      // Live/fresh moods are written by ISO date key (bosTodayKey, e.g. "2026-06-24");
      // demo seeds them by day-of-month. iso() above produces the same local ISO key.
      if (!isCurMonth || pct == null) return null;
      var mkey = isLive ? iso(c.d) : c.d;
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
    var dkey = isLive ? iso(selDay) : selDay;
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
        fontWeight: 500,
        marginTop: 2
      }
    }, dm.t)));
  })(), (() => {
    var nkey = isLive ? iso(selDay) : selDay;
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
    // Live: the habit's OWN logged state for this date; demo: ordered fill.
    var done = isLive ? h.on : i < Math.round(selPct * dayHabits.length);
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
function SupportScreen() {
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
      fontSize: 15
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
    onClick: () => openSheet(/*#__PURE__*/React.createElement(FeedbackSheet, {
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
      fontWeight: 500
    }
  }, "\u041D\u0430\u043F\u0438\u0441\u0430\u0442\u044C \u043D\u0430\u043C"), /*#__PURE__*/React.createElement("span", {
    className: "bos-sys-text-2",
    style: {
      fontSize: 12
    }
  }, "support@balanceos.app")), /*#__PURE__*/React.createElement(SysCard, {
    onClick: () => openSheet(/*#__PURE__*/React.createElement(FeedbackSheet, {
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
      fontWeight: 500
    }
  }, "\u0427\u0430\u0442 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0438"), /*#__PURE__*/React.createElement("span", {
    className: "bos-sys-text-2",
    style: {
      fontSize: 12
    }
  }, "\u041E\u0442\u0432\u0435\u0442 \u0432 \u0441\u0440\u0435\u0434\u043D\u0435\u043C 5 \u043C\u0438\u043D"))));
}
function AIScreen() {
  var {
    navigate
  } = useNav();
  var app = useApp();
  var t = useAIT();
  var [ask, setAsk] = useP("");
  // Interactivity: which insight/pattern is expanded, which insights were accepted,
  // and whether the hero's "why" reasoning panel is open. Makes the screen feel live.
  var [openInsight, setOpenInsight] = useP(null);
  var [accepted, setAccepted] = useP({});
  var [openPattern, setOpenPattern] = useP(null);
  var [showWhy, setShowWhy] = useP(false);
  var [health, setHealth] = useP(false); // Apple Health mock-connect (fresh user)
  // Same orb DNA as intro — pulled into the AI hub
  var orbTint = ["#cfe1ff", "#7aa4d0", "#1a2c48"];

  // ── New user: near-empty AI — calm intro + connect Apple Health, no fake data ──
  if (app?.mode === "fresh") {
    return /*#__PURE__*/React.createElement("div", {
      className: "page-in",
      style: {
        padding: "0 12px 24px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "4px 4px 14px"
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "var(--text-4)",
        letterSpacing: 0.4
      }
    }, "\u0422\u0432\u043E\u0439 \u043F\u043E\u043C\u043E\u0449\u043D\u0438\u043A"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 22,
        fontWeight: 700,
        color: "var(--text)",
        letterSpacing: "-0.5px",
        marginTop: 2
      }
    }, "Balance AI"))), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(160deg, #0e1a2e 0%, #0a1424 100%)",
        borderRadius: 22,
        padding: "26px 22px 28px",
        color: "#fff",
        textAlign: "center"
      }
    }, /*#__PURE__*/React.createElement("div", {
      "aria-hidden": true,
      style: {
        position: "absolute",
        inset: 0,
        background: "radial-gradient(circle at 80% 20%, rgba(180,210,255,0.18) 0%, transparent 40%), radial-gradient(circle at 10% 90%, rgba(120,160,210,0.15) 0%, transparent 40%)"
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "relative",
        display: "grid",
        placeItems: "center"
      }
    }, /*#__PURE__*/React.createElement("svg", {
      viewBox: "-80 -80 160 160",
      width: "112",
      height: "112",
      style: {
        overflow: "visible"
      }
    }, /*#__PURE__*/React.createElement(SiriOrb, {
      r: 42,
      tint: orbTint,
      t: t,
      intensity: 1
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "var(--bos-title-font)",
        fontSize: 21,
        lineHeight: 1.25,
        marginTop: 4,
        letterSpacing: "-0.3px"
      }
    }, "\u041F\u0440\u0438\u0432\u0435\u0442! \u042F \u0442\u0432\u043E\u0439 \u0418\u0418-\u043F\u043E\u043C\u043E\u0449\u043D\u0438\u043A."), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: "rgba(255,255,255,0.7)",
        marginTop: 8,
        lineHeight: 1.5,
        maxWidth: 270
      }
    }, "\u041F\u043E\u043A\u0430 \u044F \u043F\u043E\u0447\u0442\u0438 \u043D\u0438\u0447\u0435\u0433\u043E \u043E \u0442\u0435\u0431\u0435 \u043D\u0435 \u0437\u043D\u0430\u044E. \u0414\u0430\u0439 \u043D\u0435\u043C\u043D\u043E\u0433\u043E \u0434\u0430\u043D\u043D\u044B\u0445 \u2014 \u0438 \u044F \u043D\u0430\u0447\u043D\u0443 \u043F\u043E\u0434\u0441\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u0442\u043E\u0447\u043D\u043E \u043F\u043E\u0434 \u0442\u0435\u0431\u044F."))), /*#__PURE__*/React.createElement("div", {
      style: {
        background: "var(--card)",
        borderRadius: 22,
        padding: 16,
        marginTop: 12,
        boxShadow: "var(--card-shadow)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 13
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 46,
        height: 46,
        borderRadius: 14,
        background: "linear-gradient(135deg,#ff5a6e,#ff2d55)",
        display: "grid",
        placeItems: "center",
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement(I.Heart, {
      size: 24,
      color: "#fff",
      fill: "#fff"
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15.5,
        fontWeight: 600,
        color: "var(--text)"
      }
    }, "\u0421\u0432\u044F\u0437\u0430\u0442\u044C Apple \u0417\u0434\u043E\u0440\u043E\u0432\u044C\u0435"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        color: "var(--text-4)",
        marginTop: 2,
        lineHeight: 1.45
      }
    }, "\u041F\u043E\u0434\u0442\u044F\u043D\u0443 \u0441\u043E\u043D, \u0434\u0432\u0438\u0436\u0435\u043D\u0438\u0435 \u0438 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435 \u2014 \u0441\u043E\u0432\u0435\u0442\u044B \u0441\u0442\u0430\u043D\u0443\u0442 \u0442\u043E\u0447\u043D\u044B\u043C\u0438 \u0441 \u043F\u0435\u0440\u0432\u043E\u0433\u043E \u0434\u043D\u044F."))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 6,
        marginTop: 13,
        flexWrap: "wrap"
      }
    }, [["😴", "Сон"], ["🚶", "Движение"], ["❤️", "Пульс"], ["🧠", "Состояние"]].map((s, i) => /*#__PURE__*/React.createElement("span", {
      key: i,
      style: {
        fontSize: 12,
        fontWeight: 500,
        color: "var(--text-2)",
        background: "var(--surface-3)",
        borderRadius: 999,
        padding: "5px 11px",
        display: "inline-flex",
        alignItems: "center",
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("span", null, s[0]), s[1]))), health ? /*#__PURE__*/React.createElement("div", {
      className: "bos-acc-in",
      style: {
        marginTop: 13,
        fontSize: 12.5,
        color: "#1e6b3a",
        background: "#e5f5ea",
        borderRadius: 14,
        padding: "11px 13px",
        display: "flex",
        alignItems: "center",
        gap: 9,
        lineHeight: 1.4
      }
    }, /*#__PURE__*/React.createElement(I.Check, {
      size: 16,
      strokeWidth: 2.5
    }), " \u0414\u043E\u0441\u0442\u0443\u043F \u0437\u0430\u043F\u0440\u043E\u0441\u0438\u043C \u043F\u0440\u0438 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0435 \u043D\u0430 iPhone \u2014 \u0442\u043E\u0433\u0434\u0430 \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u044F \u0432\u043A\u043B\u044E\u0447\u0438\u0442\u0441\u044F.") : /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        setHealth(true);
        if (window.tgHaptic) tgHaptic("light");
      },
      className: "tap",
      style: {
        width: "100%",
        marginTop: 13,
        background: "#0a0a0a",
        color: "#fff",
        border: 0,
        borderRadius: 999,
        padding: 13,
        fontSize: 14.5,
        fontWeight: 600
      }
    }, "\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u0442\u044C")), /*#__PURE__*/React.createElement("button", {
      onClick: () => navigate("ai-chat", {
        prompt: "Расскажу немного о себе и своих целях"
      }),
      className: "tap",
      style: {
        width: "100%",
        marginTop: 10,
        background: "var(--card)",
        border: 0,
        borderRadius: 22,
        padding: 16,
        boxShadow: "var(--card-shadow)",
        display: "flex",
        alignItems: "center",
        gap: 13,
        textAlign: "left",
        color: "var(--text)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 46,
        height: 46,
        borderRadius: 14,
        background: "var(--surface-3)",
        display: "grid",
        placeItems: "center",
        fontSize: 22,
        flexShrink: 0
      }
    }, "\uD83D\uDCAC"), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15.5,
        fontWeight: 600
      }
    }, "\u0420\u0430\u0441\u0441\u043A\u0430\u0437\u0430\u0442\u044C \u043E \u0441\u0435\u0431\u0435"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        color: "var(--text-4)",
        marginTop: 2,
        lineHeight: 1.45
      }
    }, "\u041F\u0430\u0440\u0430 \u043C\u0438\u043D\u0443\u0442 \u2014 \u0438 \u0418\u0418 \u0443\u0437\u043D\u0430\u0435\u0442 \u0442\u0432\u043E\u0438 \u0446\u0435\u043B\u0438 \u0438 \u0440\u0438\u0442\u043C \u0434\u043D\u044F.")), /*#__PURE__*/React.createElement(I.ChevronRight, {
      size: 18,
      color: "var(--text-4)"
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: "center",
        fontSize: 12,
        color: "var(--text-4)",
        marginTop: 18,
        padding: "0 24px",
        lineHeight: 1.5
      }
    }, "\u0418\u043D\u0441\u0430\u0439\u0442\u044B \u0438 \u0437\u0430\u043A\u043E\u043D\u043E\u043C\u0435\u0440\u043D\u043E\u0441\u0442\u0438 \u043F\u043E\u044F\u0432\u044F\u0442\u0441\u044F \u0437\u0434\u0435\u0441\u044C, \u043A\u043E\u0433\u0434\u0430 \u043D\u0430\u0431\u0435\u0440\u0451\u0442\u0441\u044F \u043D\u0435\u043C\u043D\u043E\u0433\u043E \u0434\u0430\u043D\u043D\u044B\u0445."));
  }

  // ── LIVE user: a REAL coach hub, driven by live data + the AI login-brief ──
  // No scripted "Павел" insights here — everything below is computed from THIS
  // person's own habits, state, XP and the brief the AI generated for them at login.
  // The demo (Павел) keeps its rich scripted showcase further down, untouched.
  if (app?.mode === "live") {
    var brief = app.aiBrief || null;
    var liveHabits = app.habits || [];
    var doneToday = liveHabits.filter(h => h && h.done).length;
    var maxStreak = typeof bosMaxStreak === "function" ? bosMaxStreak(liveHabits) : 0;
    var liveXP = typeof bosLiveXP === "function" ? bosLiveXP(app) : 0;
    var lvl = typeof bosLevelInfo === "function" ? bosLevelInfo(liveXP) : {
      level: 1
    };
    var moodName = app.mood && app.mood.t || "";
    var moodIcon = app.mood && app.mood.i || "";
    // ONE real line about the user today: prefer the AI brief summary; otherwise
    // derive a specific, TRUE line from their actual completion / streak / state.
    var briefSummary = brief && brief.summary && ("" + brief.summary).trim() || "";
    // A brand-new live user (no habits AND no real brief) gets an HONEST empty
    // state below — a check-in / start-chatting invite, never invented advice.
    var isBlank = liveHabits.length === 0 && !briefSummary;

    // The hero orb tint follows the user's CURRENT state colour — the same mood tint
    // the home hero orb uses (tintFromMood(app.mood.c)) — so it reads as "you, right now".
    var moodC = app.mood && app.mood.c;
    var liveTint = moodC && typeof tintFromMood === "function" ? tintFromMood(moodC) : orbTint;
    var headline = briefSummary;
    if (!headline) {
      if (doneToday > 0 && liveHabits.length) headline = "Сегодня закрыто " + doneToday + " из " + liveHabits.length + ". Хороший темп — давай удержим его.";else if (maxStreak >= 2) headline = "Твоя серия — " + maxStreak + " дн. подряд. Одно небольшое действие сейчас её продлит.";else if (liveHabits.length) headline = "Новый день начался. Выбери одну привычку, с которой стартуешь.";else if (moodName) headline = "Состояние сейчас — «" + moodName + "». Начнём с одного маленького шага под него.";else headline = "Я рядом. Расскажи, как ты, — и наметим один маленький шаг на сегодня.";
    }
    // The brief's optional one-line next-step hint, shown softly under the headline.
    var hint = brief && brief.hint && ("" + brief.hint).trim() || "";

    // Real next-step suggestions = the brief pills ({ i: emoji, t: text }). The pill
    // text doubles as the chat prompt — the same contract the chat itself uses.
    // Fallback to context-aware prompts so a returning user never sees an empty list.
    var pills = brief && Array.isArray(brief.pills) && brief.pills.length ? brief.pills.slice(0, 4) : [];
    if (!pills.length && !isBlank && typeof buildQuickPrompts === "function") pills = buildQuickPrompts(app).slice(0, 4);
    var planPrompt = "Помоги составить простой план на сегодня по моим привычкам.";

    // «Следующие шаги» route to REAL features, not always the chat. New pills carry
    // { label, kind:"action"|"chat", route?, params?, prompt? }. action → open that
    // screen; chat → open the chat primed with prompt. Legacy/string pills (the old
    // { i, t } brief shape) gracefully fall back to a chat entry on their text.
    var pillLabel = p => typeof p === "string" ? p : p && (p.label || p.t) || "";
    var goPill = p => {
      if (p && p.kind === "action" && p.route) return navigate(p.route, p.params || {});
      if (p && p.kind === "chat") return navigate("ai-chat", {
        prompt: p.prompt || pillLabel(p)
      });
      navigate("ai-chat", {
        prompt: pillLabel(p)
      });
    };
    return /*#__PURE__*/React.createElement("div", {
      className: "page-in",
      style: {
        padding: "0 12px 24px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "4px 4px 14px"
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "var(--text-4)",
        letterSpacing: 0.4
      }
    }, (app.userName || "").trim() ? "Персонально · для " + app.userName.trim() : "Твой помощник"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 22,
        fontWeight: 700,
        color: "var(--text)",
        letterSpacing: "-0.5px",
        marginTop: 2
      }
    }, "Balance AI")), /*#__PURE__*/React.createElement("button", {
      "data-tour": "ai-chat-btn",
      onClick: () => navigate("ai-chat"),
      className: "tap",
      style: {
        height: 36,
        padding: "0 14px",
        borderRadius: 999,
        background: "#0a0a0a",
        color: "#fff",
        border: 0,
        fontSize: 13,
        fontWeight: 500,
        display: "inline-flex",
        alignItems: "center",
        gap: 6
      }
    }, /*#__PURE__*/React.createElement(I.MessageCircle, {
      size: 14
    }), " \u0427\u0430\u0442")), /*#__PURE__*/React.createElement("div", {
      "data-tour": "ai-hero",
      style: {
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(160deg, #0e1a2e 0%, #0a1424 100%)",
        borderRadius: 22,
        padding: "22px 22px 24px",
        color: "#fff"
      }
    }, /*#__PURE__*/React.createElement("div", {
      "aria-hidden": true,
      style: {
        position: "absolute",
        inset: 0,
        background: "radial-gradient(circle at 80% 20%, rgba(180,210,255,0.18) 0%, transparent 40%), radial-gradient(circle at 10% 90%, rgba(120,160,210,0.15) 0%, transparent 40%)"
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 16,
        alignItems: "center",
        position: "relative"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flexShrink: 0,
        width: 112,
        height: 112,
        display: "grid",
        placeItems: "center"
      }
    }, /*#__PURE__*/React.createElement("svg", {
      viewBox: "-80 -80 160 160",
      width: "112",
      height: "112",
      style: {
        overflow: "visible"
      }
    }, /*#__PURE__*/React.createElement(SiriOrb, {
      r: 42,
      tint: liveTint,
      t: t,
      intensity: 1
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "rgba(180,210,255,0.85)",
        fontWeight: 600,
        letterSpacing: 1.4,
        textTransform: "uppercase"
      }
    }, moodName ? "Сейчас · " + (moodIcon ? moodIcon + " " : "") + moodName : "Сегодня"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "var(--bos-title-font)",
        fontSize: 19,
        lineHeight: 1.28,
        marginTop: 6,
        letterSpacing: "-0.3px"
      }
    }, headline), hint && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        color: "rgba(255,255,255,0.7)",
        marginTop: 8,
        lineHeight: 1.5
      }
    }, hint))), !isBlank && /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 6,
        marginTop: 16,
        position: "relative"
      }
    }, [["Сегодня", liveHabits.length ? doneToday + "/" + liveHabits.length : "—"], ["Серия", maxStreak ? maxStreak + " дн" : "—"], ["Уровень", lvl.level]].map((s, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        flex: 1,
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 14,
        padding: "10px 8px",
        textAlign: "center"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 17,
        fontWeight: 700,
        letterSpacing: "-0.3px"
      }
    }, s[1]), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: "rgba(255,255,255,0.6)",
        marginTop: 2,
        letterSpacing: 0.4
      }
    }, s[0])))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8,
        marginTop: 16,
        position: "relative"
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => navigate("ai-chat", {
        prompt: planPrompt
      }),
      className: "tap",
      style: {
        flex: 1,
        background: "var(--card)",
        color: "#0a1424",
        border: 0,
        borderRadius: 999,
        padding: "12px 14px",
        fontSize: 14,
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6
      }
    }, /*#__PURE__*/React.createElement(I.Sparkles, {
      size: 15
    }), " \u041F\u043E\u0441\u0442\u0440\u043E\u0438\u0442\u044C \u043F\u043B\u0430\u043D"), /*#__PURE__*/React.createElement("button", {
      onClick: () => navigate("ai-chat"),
      className: "tap",
      style: {
        background: "rgba(255,255,255,0.1)",
        color: "#fff",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 999,
        padding: "12px 16px",
        fontSize: 14,
        fontWeight: 500,
        display: "inline-flex",
        alignItems: "center",
        gap: 6
      }
    }, /*#__PURE__*/React.createElement(I.MessageCircle, {
      size: 14
    }), " \u041F\u043E\u0433\u043E\u0432\u043E\u0440\u0438\u0442\u044C"))), isBlank ?
    /*#__PURE__*/
    /* HONEST empty state for a brand-new live user — no fake recommendations.
       Two real first steps: check in your state, or just start a conversation. */
    React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      onClick: () => navigate("mood"),
      className: "tap",
      style: {
        width: "100%",
        marginTop: 12,
        background: "var(--card)",
        border: 0,
        borderRadius: 22,
        padding: 16,
        boxShadow: "var(--card-shadow)",
        display: "flex",
        alignItems: "center",
        gap: 13,
        textAlign: "left",
        color: "var(--text)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 46,
        height: 46,
        borderRadius: 14,
        background: "linear-gradient(135deg,#e9f1ff,#cfe1ff)",
        display: "grid",
        placeItems: "center",
        fontSize: 22,
        flexShrink: 0
      }
    }, "\uD83E\uDDED"), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15.5,
        fontWeight: 600
      }
    }, "\u041E\u0442\u043C\u0435\u0442\u0438\u0442\u044C \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        color: "var(--text-4)",
        marginTop: 2,
        lineHeight: 1.45
      }
    }, "\u041F\u0430\u0440\u0430 \u0441\u0435\u043A\u0443\u043D\u0434 \u2014 \u0438 \u0441\u043E\u0432\u0435\u0442\u044B \u043D\u0430\u0447\u043D\u0443\u0442 \u043F\u043E\u0434\u0441\u0442\u0440\u0430\u0438\u0432\u0430\u0442\u044C\u0441\u044F \u043F\u043E\u0434 \u0442\u0435\u0431\u044F.")), /*#__PURE__*/React.createElement(I.ChevronRight, {
      size: 18,
      color: "var(--text-4)"
    })), /*#__PURE__*/React.createElement("button", {
      onClick: () => navigate("ai-chat", {
        prompt: "Расскажу немного о себе и своих целях"
      }),
      className: "tap",
      style: {
        width: "100%",
        marginTop: 10,
        background: "var(--card)",
        border: 0,
        borderRadius: 22,
        padding: 16,
        boxShadow: "var(--card-shadow)",
        display: "flex",
        alignItems: "center",
        gap: 13,
        textAlign: "left",
        color: "var(--text)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 46,
        height: 46,
        borderRadius: 14,
        background: "var(--surface-3)",
        display: "grid",
        placeItems: "center",
        fontSize: 22,
        flexShrink: 0
      }
    }, "\uD83D\uDCAC"), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15.5,
        fontWeight: 600
      }
    }, "\u0420\u0430\u0441\u0441\u043A\u0430\u0437\u0430\u0442\u044C \u043E \u0441\u0435\u0431\u0435"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        color: "var(--text-4)",
        marginTop: 2,
        lineHeight: 1.45
      }
    }, "\u041F\u0430\u0440\u0430 \u043C\u0438\u043D\u0443\u0442 \u2014 \u0438 \u0418\u0418 \u0443\u0437\u043D\u0430\u0435\u0442 \u0442\u0432\u043E\u0438 \u0446\u0435\u043B\u0438 \u0438 \u0440\u0438\u0442\u043C \u0434\u043D\u044F.")), /*#__PURE__*/React.createElement(I.ChevronRight, {
      size: 18,
      color: "var(--text-4)"
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: "center",
        fontSize: 12,
        color: "var(--text-4)",
        marginTop: 18,
        padding: "0 24px",
        lineHeight: 1.5
      }
    }, "\u041F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0438 \u043F\u043E\u044F\u0432\u044F\u0442\u0441\u044F \u0437\u0434\u0435\u0441\u044C, \u043A\u0430\u043A \u0442\u043E\u043B\u044C\u043A\u043E \u043D\u0430\u0431\u0435\u0440\u0451\u0442\u0441\u044F \u043D\u0435\u043C\u043D\u043E\u0433\u043E \u0442\u0432\u043E\u0438\u0445 \u0434\u0430\u043D\u043D\u044B\u0445.")) : (
    /* Real next-step suggestions — the AI brief pills as tappable cards.
       Tap → open the chat already primed with that step. */
    pills.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: "section-label",
      style: {
        marginTop: 18,
        color: "var(--text-3)",
        padding: "0 4px"
      }
    }, "\u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0435 \u0448\u0430\u0433\u0438"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 8,
        marginTop: 8
      }
    }, pills.map((p, i) => {
      var isChat = !p || typeof p === "string" || p.kind !== "action";
      return /*#__PURE__*/React.createElement("button", {
        key: i,
        onClick: () => goPill(p),
        className: "tap",
        style: {
          width: "100%",
          background: "var(--card)",
          borderRadius: 22,
          boxShadow: "var(--card-shadow)",
          border: 0,
          padding: 14,
          display: "flex",
          alignItems: "center",
          gap: 12,
          textAlign: "left",
          color: "var(--text)"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          width: 44,
          height: 44,
          borderRadius: 14,
          background: "linear-gradient(135deg, #e9f1ff, #cfe1ff)",
          display: "grid",
          placeItems: "center",
          fontSize: 22,
          flexShrink: 0
        }
      }, p && p.i || "✨"), /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1,
          minWidth: 0
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 14.5,
          fontWeight: 600,
          color: "var(--text)"
        }
      }, pillLabel(p)), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 12.5,
          color: "var(--text-4)",
          marginTop: 2,
          lineHeight: 1.45
        }
      }, isChat ? "Обсудить с помощником →" : "Открыть →")), /*#__PURE__*/React.createElement(I.ChevronRight, {
        size: 18,
        color: "var(--text-4)",
        style: {
          flexShrink: 0
        }
      }));
    })))), /*#__PURE__*/React.createElement("div", {
      className: "section-label",
      style: {
        marginTop: 18,
        color: "var(--text-3)",
        padding: "0 4px"
      }
    }, "\u0421\u043F\u0440\u043E\u0441\u0438 \u0447\u0442\u043E \u0443\u0433\u043E\u0434\u043D\u043E"), /*#__PURE__*/React.createElement("div", {
      style: {
        background: "var(--card)",
        borderRadius: 22,
        padding: 14,
        marginTop: 8,
        boxShadow: "var(--card-shadow)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "2px 6px"
      }
    }, /*#__PURE__*/React.createElement("input", {
      value: ask,
      onChange: e => setAsk(e.target.value),
      placeholder: "\u0421\u043F\u0440\u043E\u0441\u0438\u0442\u044C Balance AI\u2026",
      onKeyDown: e => e.key === "Enter" && navigate("ai-chat", ask.trim() ? {
        prompt: ask
      } : {}),
      style: {
        flex: 1,
        border: 0,
        outline: 0,
        background: "transparent",
        color: "var(--text)",
        fontSize: 14,
        padding: "10px 6px"
      }
    }), /*#__PURE__*/React.createElement("button", {
      onClick: () => navigate("ai-chat", ask.trim() ? {
        prompt: ask
      } : {}),
      className: "tap",
      style: {
        width: 36,
        height: 36,
        borderRadius: "50%",
        background: "#0a0a0a",
        border: 0,
        color: "#fff",
        display: "grid",
        placeItems: "center"
      }
    }, /*#__PURE__*/React.createElement(I.Send, {
      size: 14
    })))));
  }
  var insights = [{
    i: "🌅",
    t: "Перенеси «Чтение» на вечер",
    b: "В 21:00 ты доводишь дело до конца в 2 раза чаще, чем в 7 утра.",
    lift: "+38%",
    why: "За 14 дней утром ты доводил до конца 31% дел, а вечером — 66%. Вечером у тебя стабильнее.",
    stats: [["📊", "14 дней"], ["🌙", "×2,1 вечером"]],
    action: "Перенести на 21:00",
    doneText: "Перенесено на вечер"
  }, {
    i: "🤝",
    t: "Опирайся на Лену",
    b: "Привычки с Леной держат серию 91%. Сегодня она онлайн.",
    lift: "+24%",
    why: "Парные привычки с Леной держатся на 91% против 64%, когда ты один. Совместный день почти не пропускается.",
    stats: [["🤝", "91% вместе"], ["🟢", "онлайн"]],
    action: "Позвать Лену",
    doneText: "Лена приглашена"
  }, {
    i: "🧘",
    t: "Двухминутная перезагрузка",
    b: "По понедельникам падение 60%. Начни с 2-минутной медитации перед первой задачей.",
    lift: "+19%",
    why: "Понедельник — твой самый слабый день (−60%). Короткий старт на 2 минуты поднимает выполнение всего дня на 19%.",
    stats: [["📉", "Пн −60%"], ["⏱", "2 мин"]],
    action: "Поставить на завтра",
    doneText: "Добавлено на завтра"
  }];
  var patterns = [{
    t: "Спокойные дни = глубокое чтение",
    b: "Когда ты спокоен, читаешь почти вдвое больше.",
    c: "#cfe1ff",
    d: "За месяц: 7 спокойных дней → в среднем 23 страницы за сессию. В тревожные дни — 9. Состояние сильно влияет на чтение."
  }, {
    t: "Кардио после 17:00",
    b: "Тренировки после 17:00 завершаются в 84% случаев.",
    c: "#9bbfe8",
    d: "Из 12 вечерних тренировок завершены 10. Утренних — только 5 из 11. Твоё тело явно «вечернее» для нагрузки."
  }, {
    t: "Групповые дни сильнее",
    b: "Когда команда отмечается, +1,4× к выполнению.",
    c: "#7aa4d0",
    d: "Когда команда отмечается до полудня, ты и сам чаще закрываешь день. Общий ритм незаметно тянет вперёд."
  }];

  // Tiny 7-day completion sparkline
  var week = [0.4, 0.65, 0.55, 0.8, 0.72, 0.9, 0.78];
  var days = ["П", "В", "С", "Ч", "П", "С", "В"];
  var quickPrompts = ["Спланируй мою идеальную среду", "Почему я пропустил пробежки на этой неделе?", "Предложи план сна на 2 недели", "Какой мой следующий рубеж?"];
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      padding: "0 12px 24px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "4px 4px 14px"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-4)",
      letterSpacing: 0.4
    }
  }, "\u041F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u043E \xB7 \u0434\u043B\u044F \u041F\u0430\u0432\u043B\u0430"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 700,
      color: "var(--text)",
      letterSpacing: "-0.5px",
      marginTop: 2
    }
  }, "Balance AI")), /*#__PURE__*/React.createElement("button", {
    "data-tour": "ai-chat-btn",
    onClick: () => navigate("ai-chat"),
    className: "tap",
    style: {
      height: 36,
      padding: "0 14px",
      borderRadius: 999,
      background: "#0a0a0a",
      color: "#fff",
      border: 0,
      fontSize: 13,
      fontWeight: 500,
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(I.MessageCircle, {
    size: 14
  }), " \u0427\u0430\u0442")), /*#__PURE__*/React.createElement("div", {
    "data-tour": "ai-hero",
    style: {
      position: "relative",
      overflow: "hidden",
      background: "linear-gradient(160deg, #0e1a2e 0%, #0a1424 100%)",
      borderRadius: 22,
      padding: "22px 22px 24px",
      color: "#fff"
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      inset: 0,
      background: "radial-gradient(circle at 80% 20%, rgba(180,210,255,0.18) 0%, transparent 40%), radial-gradient(circle at 10% 90%, rgba(120,160,210,0.15) 0%, transparent 40%)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 16,
      alignItems: "center",
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0,
      width: 120,
      height: 120,
      display: "grid",
      placeItems: "center"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "-80 -80 160 160",
    width: "120",
    height: "120",
    style: {
      overflow: "visible"
    }
  }, /*#__PURE__*/React.createElement(SiriOrb, {
    r: 42,
    tint: orbTint,
    t: t,
    intensity: 1
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "rgba(180,210,255,0.85)",
      fontWeight: 600,
      letterSpacing: 1.4,
      textTransform: "uppercase"
    }
  }, "\u0427\u0442\u0435\u043D\u0438\u0435 \u0434\u043D\u044F"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--bos-title-font)",
      fontSize: 22,
      lineHeight: 1.2,
      marginTop: 6,
      letterSpacing: "-0.3px"
    }
  }, "\u0422\u044B \u0441\u043F\u043E\u043A\u043E\u0439\u043D\u0435\u0435", /*#__PURE__*/React.createElement("br", null), "\u043F\u043E\u0441\u043B\u0435 \u043F\u0440\u043E\u0433\u0443\u043B\u043E\u043A."), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "rgba(255,255,255,0.7)",
      marginTop: 8,
      lineHeight: 1.5
    }
  }, "\u041F\u043E \u0441\u0440\u0435\u0434\u0430\u043C \u0442\u044B \u0433\u0443\u043B\u044F\u0435\u0448\u044C \u0438 \u043C\u0435\u0434\u0438\u0442\u0438\u0440\u0443\u0435\u0448\u044C. \u041D\u0430\u0441\u0442\u0440\u043E\u0435\u043D\u0438\u0435 \u0440\u0430\u0441\u0442\u0451\u0442 \u043D\u0430 41%."))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginTop: 16,
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("ai-chat"),
    className: "tap",
    style: {
      flex: 1,
      background: "var(--card)",
      color: "#0a1424",
      border: 0,
      borderRadius: 999,
      padding: "11px 14px",
      fontSize: 13,
      fontWeight: 600,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(I.Sparkles, {
    size: 14
  }), " \u0421\u043F\u043B\u0430\u043D\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0434\u0435\u043D\u044C"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowWhy(v => !v),
    className: "tap",
    style: {
      background: showWhy ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)",
      color: "#fff",
      border: "1px solid rgba(255,255,255,0.15)",
      borderRadius: 999,
      padding: "11px 14px",
      fontSize: 13,
      fontWeight: 500,
      display: "inline-flex",
      alignItems: "center",
      gap: 5
    }
  }, "\u041F\u043E\u0447\u0435\u043C\u0443? ", /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 13,
    style: {
      transform: showWhy ? "rotate(90deg)" : "none",
      transition: "transform 0.2s"
    }
  }))), showWhy && /*#__PURE__*/React.createElement("div", {
    className: "bos-acc-in",
    style: {
      marginTop: 12,
      padding: "12px 14px",
      background: "rgba(255,255,255,0.08)",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: 14,
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: "rgba(180,210,255,0.85)"
    }
  }, "\u041A\u0430\u043A \u044F \u044D\u0442\u043E \u0432\u0438\u0436\u0443"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "rgba(255,255,255,0.82)",
      marginTop: 6,
      lineHeight: 1.5
    }
  }, "\u0421\u043C\u043E\u0442\u0440\u044E \u043D\u0430 14 \u0434\u043D\u0435\u0439 \u0442\u0432\u043E\u0438\u0445 \u043E\u0442\u043C\u0435\u0442\u043E\u043A \u0438 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u044F. \u041F\u043E\u0441\u043B\u0435 \u043F\u0440\u043E\u0433\u0443\u043B\u043E\u043A \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D\u0438\u0435 \u0440\u0430\u0441\u0442\u0451\u0442 \u043D\u0430 41%, \u0430 \u0441\u043E\u043D \u2014 \u043D\u0430 0,6 \u0447. \u0421\u0432\u044F\u0437\u044C \u0443\u0441\u0442\u043E\u0439\u0447\u0438\u0432\u0430\u044F \u2014 \u043F\u043E\u044D\u0442\u043E\u043C\u0443 \u043F\u0440\u043E\u0433\u0443\u043B\u043A\u0438 \u0441\u0435\u0439\u0447\u0430\u0441 \u0432 \u043F\u0440\u0438\u043E\u0440\u0438\u0442\u0435\u0442\u0435."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginTop: 10,
      flexWrap: "wrap"
    }
  }, [["🚶", "14 прогулок"], ["😌", "+41% настроение"], ["😴", "+0,6 ч сон"]].map((s, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      fontSize: 11.5,
      fontWeight: 600,
      color: "#fff",
      background: "rgba(255,255,255,0.12)",
      borderRadius: 999,
      padding: "4px 9px",
      display: "inline-flex",
      alignItems: "center",
      gap: 5
    }
  }, /*#__PURE__*/React.createElement("span", null, s[0]), s[1]))))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--card)",
      borderRadius: 22,
      padding: "14px 16px 12px",
      marginTop: 12,
      boxShadow: "var(--card-shadow)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1,
      fontWeight: 600
    }
  }, "\u0417\u0430 7 \u0434\u043D\u0435\u0439"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      marginTop: 2,
      letterSpacing: "-0.3px"
    }
  }, "\u0412\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u0435 +12% ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#3b9c5a",
      fontSize: 13,
      fontWeight: 600
    }
  }, "\u2191"))), /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("history"),
    className: "tap",
    style: {
      background: "transparent",
      border: 0,
      color: "var(--text-3)",
      fontSize: 13,
      fontWeight: 500,
      display: "flex",
      alignItems: "center",
      gap: 4
    }
  }, "\u0418\u0441\u0442\u043E\u0440\u0438\u044F ", /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 14
  }))), /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 320 70",
    width: "100%",
    height: "70",
    style: {
      display: "block",
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: "sparkFill",
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#7aa4d0",
    stopOpacity: "0.35"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#7aa4d0",
    stopOpacity: "0"
  }))), (() => {
    var W = 320,
      H = 60,
      pad = 18;
    var xs = week.map((_, i) => pad + i * (W - pad * 2) / (week.length - 1));
    var ys = week.map(v => H - v * (H - 8) - 4);
    var path = xs.map((x, i) => (i ? "L" : "M") + x.toFixed(1) + " " + ys[i].toFixed(1)).join(" ");
    var fill = `M ${xs[0]} ${H} L ` + xs.map((x, i) => x.toFixed(1) + " " + ys[i].toFixed(1)).join(" L ") + ` L ${xs[xs.length - 1]} ${H} Z`;
    return /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
      d: fill,
      fill: "url(#sparkFill)"
    }), /*#__PURE__*/React.createElement("path", {
      d: path,
      fill: "none",
      stroke: "#3a6ba0",
      strokeWidth: "2",
      strokeLinejoin: "round",
      strokeLinecap: "round"
    }), xs.map((x, i) => /*#__PURE__*/React.createElement("circle", {
      key: i,
      cx: x,
      cy: ys[i],
      r: i === xs.length - 1 ? 3.5 : 2,
      fill: i === xs.length - 1 ? "#0a1424" : "#7aa4d0"
    })), xs.map((x, i) => /*#__PURE__*/React.createElement("text", {
      key: "l" + i,
      x: x,
      y: 68,
      fontSize: "9",
      fill: "rgba(0,0,0,0.45)",
      textAnchor: "middle"
    }, days[i])));
  })())), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 18,
      color: "var(--text-3)",
      padding: "0 4px"
    }
  }, "\u0414\u043B\u044F \u0442\u0435\u0431\u044F \u0441\u0435\u0433\u043E\u0434\u043D\u044F"), /*#__PURE__*/React.createElement("div", {
    "data-tour": "ai-insights",
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      marginTop: 8
    }
  }, insights.map((p, i) => {
    var isOpen = openInsight === i;
    var isDone = !!accepted[i];
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        background: "var(--card)",
        borderRadius: 22,
        boxShadow: "var(--card-shadow)",
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setOpenInsight(isOpen ? null : i),
      className: "tap",
      style: {
        width: "100%",
        background: "transparent",
        border: 0,
        padding: 14,
        display: "flex",
        alignItems: "center",
        gap: 12,
        textAlign: "left",
        color: "var(--text)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 44,
        height: 44,
        borderRadius: 14,
        background: isDone ? "linear-gradient(135deg,#d6f3df,#bfe9cd)" : "linear-gradient(135deg, #e9f1ff, #cfe1ff)",
        display: "grid",
        placeItems: "center",
        fontSize: 22,
        flexShrink: 0
      }
    }, isDone ? /*#__PURE__*/React.createElement(I.Check, {
      size: 20,
      color: "#1e6b3a",
      strokeWidth: 3
    }) : p.i), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14.5,
        fontWeight: 600,
        color: "var(--text)"
      }
    }, p.t), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        color: "#1e6b3a",
        background: "#e5f5ea",
        padding: "2px 7px",
        borderRadius: 999
      }
    }, isDone ? "Принято" : p.lift)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        color: "var(--text-4)",
        marginTop: 3,
        lineHeight: 1.45
      }
    }, isDone ? p.doneText : p.b)), /*#__PURE__*/React.createElement(I.ChevronRight, {
      size: 18,
      color: "var(--text-4)",
      style: {
        flexShrink: 0,
        transform: isOpen ? "rotate(90deg)" : "none",
        transition: "transform 0.2s"
      }
    })), isOpen && /*#__PURE__*/React.createElement("div", {
      className: "bos-acc-in",
      style: {
        padding: "0 14px 14px 70px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        color: "var(--text-3)",
        lineHeight: 1.5
      }
    }, p.why), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 6,
        marginTop: 10,
        flexWrap: "wrap"
      }
    }, p.stats.map((s, si) => /*#__PURE__*/React.createElement("span", {
      key: si,
      style: {
        fontSize: 11.5,
        fontWeight: 600,
        color: "var(--text-2)",
        background: "var(--surface-3)",
        borderRadius: 999,
        padding: "4px 9px",
        display: "inline-flex",
        alignItems: "center",
        gap: 5
      }
    }, /*#__PURE__*/React.createElement("span", null, s[0]), s[1]))), !isDone && /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8,
        marginTop: 12
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        setAccepted(a => ({
          ...a,
          [i]: true
        }));
        if (window.tgHaptic) tgHaptic("light");
      },
      className: "tap",
      style: {
        flex: 1,
        background: "#0a0a0a",
        color: "#fff",
        border: 0,
        borderRadius: 999,
        padding: "10px 14px",
        fontSize: 13,
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6
      }
    }, /*#__PURE__*/React.createElement(I.Check, {
      size: 14,
      strokeWidth: 2.5
    }), " ", p.action), /*#__PURE__*/React.createElement("button", {
      onClick: () => navigate("ai-chat", {
        prompt: p.t
      }),
      className: "tap",
      style: {
        background: "var(--surface-3)",
        color: "var(--text-2)",
        border: 0,
        borderRadius: 999,
        padding: "10px 14px",
        fontSize: 13,
        fontWeight: 500
      }
    }, "\u041E\u0431\u0441\u0443\u0434\u0438\u0442\u044C"))));
  })), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 18,
      color: "var(--text-3)",
      padding: "0 4px"
    }
  }, "\u0417\u0430\u043A\u043E\u043D\u043E\u043C\u0435\u0440\u043D\u043E\u0441\u0442\u0438"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8,
      marginTop: 8
    }
  }, patterns.map((p, i) => {
    var isOpen = openPattern === i;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      onClick: () => setOpenPattern(isOpen ? null : i),
      className: "tap",
      style: {
        background: "var(--card)",
        borderRadius: 22,
        padding: 14,
        border: 0,
        textAlign: "left",
        boxShadow: "var(--card-shadow)",
        position: "relative",
        overflow: "hidden",
        gridColumn: i === 2 || isOpen ? "span 2" : "auto"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        top: -10,
        right: -10,
        width: 60,
        height: 60,
        borderRadius: "50%",
        background: p.c,
        opacity: 0.35,
        filter: "blur(8px)"
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 600,
        color: "var(--text)",
        position: "relative"
      }
    }, p.t), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "var(--text-4)",
        marginTop: 4,
        lineHeight: 1.45,
        position: "relative"
      }
    }, p.b), isOpen && /*#__PURE__*/React.createElement("div", {
      className: "bos-acc-in",
      style: {
        fontSize: 12,
        color: "var(--text-3)",
        marginTop: 9,
        paddingTop: 9,
        borderTop: "1px solid var(--line)",
        lineHeight: 1.5,
        position: "relative"
      }
    }, p.d));
  })), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 18,
      color: "var(--text-3)",
      padding: "0 4px"
    }
  }, "\u0421\u043F\u0440\u043E\u0441\u0438 \u0447\u0442\u043E \u0443\u0433\u043E\u0434\u043D\u043E"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--card)",
      borderRadius: 22,
      padding: 14,
      marginTop: 8,
      boxShadow: "var(--card-shadow)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6,
      marginBottom: 12
    }
  }, quickPrompts.map((q, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => navigate("ai-chat", {
      prompt: q
    }),
    className: "tap",
    style: {
      fontSize: 12,
      padding: "7px 12px",
      borderRadius: 999,
      background: "var(--surface-3)",
      border: 0,
      color: "var(--text-2)",
      letterSpacing: "-0.1px"
    }
  }, q))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 6px 0",
      borderTop: "1px solid var(--line)"
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: ask,
    onChange: e => setAsk(e.target.value),
    placeholder: "\u0421\u043F\u0440\u043E\u0441\u0438\u0442\u044C Balance AI\u2026",
    onKeyDown: e => e.key === "Enter" && navigate("ai-chat", ask.trim() ? {
      prompt: ask
    } : {}),
    style: {
      flex: 1,
      border: 0,
      outline: 0,
      background: "transparent",
      color: "var(--text)",
      fontSize: 14,
      padding: "10px 6px"
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("ai-chat", ask.trim() ? {
      prompt: ask
    } : {}),
    className: "tap",
    style: {
      width: 36,
      height: 36,
      borderRadius: "50%",
      background: "#0a0a0a",
      border: 0,
      color: "#fff",
      display: "grid",
      placeItems: "center"
    }
  }, /*#__PURE__*/React.createElement(I.Send, {
    size: 14
  })))));
}

// Local time hook for the orb animation on the AI screen
function OnboardingScreen() {
  var {
    navigate
  } = useNav();
  var [step, setStep] = useP(0);
  var slides = [{
    t: "Всё начинается с тебя",
    s: "Начни с внутреннего состояния — каждая привычка вырастает из него."
  }, {
    t: "Твоё состояние решает",
    s: "Всё, что ты делаешь, исходит из того, как ты себя чувствуешь. Сначала настройся."
  }, {
    t: "Добавь то, на что есть силы сегодня",
    s: "Будем идти маленькими шагами. Лучше медленно, чем до выгорания."
  }, {
    t: "Овладей своим состоянием — открой свою жизнь.",
    s: ""
  }];
  if (step >= slides.length) {
    return /*#__PURE__*/React.createElement("div", {
      className: "page-in",
      style: {
        padding: "100px 24px 24px",
        color: "#fff",
        height: "100%",
        display: "flex",
        flexDirection: "column"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: "center",
        marginTop: 60
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 130,
        height: 130,
        borderRadius: "50%",
        background: "url(./assets/sphere.png) center/cover no-repeat",
        margin: "0 auto",
        boxShadow: "0 0 60px rgba(255,222,52,0.3)"
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 22,
        fontWeight: 600,
        marginTop: 24
      }
    }, "\u041A\u0430\u043A\u043E\u0435 \u0443 \u0442\u0435\u0431\u044F \u0441\u0435\u0439\u0447\u0430\u0441 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435?"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        color: "#9f9fa9",
        marginTop: 6
      }
    }, "\u0412\u044B\u0431\u0435\u0440\u0438 \u043E\u0434\u043D\u043E, \u0447\u0442\u043E\u0431\u044B \u043D\u0430\u0447\u0430\u0442\u044C. \u041C\u043E\u0436\u043D\u043E \u0432\u0441\u0435\u0433\u0434\u0430 \u043F\u043E\u043C\u0435\u043D\u044F\u0442\u044C.")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(2,1fr)",
        gap: 10,
        marginTop: 30
      }
    }, [{
      i: "😌",
      t: "Спокойствие"
    }, {
      i: "⚡️",
      t: "Энергия"
    }, {
      i: "😔",
      t: "Упадок"
    }, {
      i: "😤",
      t: "Стресс"
    }, {
      i: "🙂",
      t: "Ровно"
    }, {
      i: "🔥",
      t: "В огне"
    }].map((s, i) => /*#__PURE__*/React.createElement("button", {
      key: i,
      onClick: () => navigate("signup"),
      className: "tap",
      style: {
        background: "rgba(39,39,42,0.55)",
        border: "1px solid rgba(63,63,70,0.4)",
        borderRadius: 22,
        padding: 16,
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 30
      }
    }, s.i), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14
      }
    }, s.t)))));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      height: "100%",
      display: "flex",
      flexDirection: "column",
      color: "#fff",
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      textAlign: "center",
      padding: "0 8px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 110,
      height: 110,
      borderRadius: "50%",
      background: "url(./assets/sphere.png) center/cover no-repeat",
      boxShadow: "0 0 80px rgba(255,222,52,0.25)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--bos-title-font)",
      fontSize: 22,
      fontWeight: 500,
      marginTop: 60,
      lineHeight: 1.3,
      maxWidth: 280
    }
  }, slides[step].t), slides[step].s && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: "#9f9fa9",
      marginTop: 14,
      maxWidth: 280,
      lineHeight: 1.5
    }
  }, slides[step].s)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center",
      gap: 6,
      marginBottom: 20
    }
  }, slides.map((_, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      width: i === step ? 22 : 6,
      height: 6,
      borderRadius: 999,
      background: i === step ? "#fff" : "rgba(255,255,255,0.25)",
      transition: "all 0.2s"
    }
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: () => setStep(step + 1),
    className: "tap",
    style: {
      background: "var(--card)",
      color: "#000",
      border: 0,
      borderRadius: 999,
      padding: "16px 24px",
      fontSize: 16,
      fontWeight: 500
    }
  }, step === slides.length - 1 ? "Начать" : "Далее"), /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("signup"),
    className: "tap",
    style: {
      background: "transparent",
      color: "#9f9fa9",
      border: 0,
      padding: 12,
      fontSize: 13,
      marginTop: 6
    }
  }, "\u041F\u0440\u043E\u043F\u0443\u0441\u0442\u0438\u0442\u044C"));
}
function SignUpScreen() {
  var {
    navigate
  } = useNav();
  var [name, setName] = useP("");
  var [email, setEmail] = useP("");
  var [pwd, setPwd] = useP("");
  var wrapRef = React.useRef(null);
  var [dark, setDark] = useP(true);
  React.useEffect(() => {
    var n = wrapRef.current;
    while (n && !(n.classList && (n.classList.contains("theme-light") || n.classList.contains("theme-dark")))) n = n.parentElement;
    if (n && n.classList.contains("theme-light")) setDark(false);
  }, []);
  var pal = dark ? {
    bg: "#0a0a0e",
    text: "#fff",
    sub: "#9f9fa9",
    sheet: "rgba(14,14,14,0.94)",
    sheetBorder: "1px solid rgba(255,255,255,0.06)",
    inputBg: "rgba(255,255,255,0.06)",
    inputBorder: "1px solid rgba(255,255,255,0.1)",
    inputText: "#fff",
    btnBg: "#f1f1f1",
    btnFg: "#0a0a0a",
    line: "rgba(255,255,255,0.12)",
    socialBg: "rgba(255,255,255,0.06)",
    socialBorder: "1px solid rgba(255,255,255,0.1)",
    socialText: "#fff",
    glow: "0 0 60px rgba(255,222,52,0.2)"
  } : {
    bg: "linear-gradient(180deg,#f5f6f8 0%,#eceef2 100%)",
    text: "#15233c",
    sub: "rgba(21,35,60,0.6)",
    sheet: "#ffffff",
    sheetBorder: "1px solid rgba(0,0,0,0.05)",
    inputBg: "#f2f5fa",
    inputBorder: "1px solid rgba(0,0,0,0.08)",
    inputText: "#15233c",
    btnBg: "#0f1b2e",
    btnFg: "#fff",
    line: "rgba(0,0,0,0.1)",
    socialBg: "#f2f5fa",
    socialBorder: "1px solid rgba(0,0,0,0.08)",
    socialText: "#15233c",
    glow: "0 10px 40px rgba(120,150,200,0.25)"
  };
  var inp = {
    background: pal.inputBg,
    border: pal.inputBorder,
    borderRadius: 14,
    padding: "14px 16px",
    color: pal.inputText,
    fontSize: 16,
    outline: 0
  };
  var app = useApp ? useApp() : null;
  var {
    open: openSheet
  } = useSheet();
  var goDemo = () => {
    app?.enterDemo?.();
    navigate("home");
  };
  // Fresh start: enter empty mode and let the gentle bottom-sheet welcome take
  // over on home (no more forced coach-mark tour).
  var goFresh = () => {
    app?.enterFresh?.(name);
    navigate("home");
  };
  // The real door: sign in with the Telegram account → everything persists.
  var goLive = () => {
    app?.enterLive?.();
    navigate("home");
  };
  return /*#__PURE__*/React.createElement("div", {
    ref: wrapRef,
    className: "page-in",
    style: {
      height: "100%",
      color: pal.text,
      display: "flex",
      flexDirection: "column",
      background: pal.bg,
      position: "relative",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      padding: "max(64px, calc(var(--tg-top-inset, 0px) + 22px)) 24px 12px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: 118,
      height: 118,
      display: "grid",
      placeItems: "center",
      animation: "suOrbIn 0.8s cubic-bezier(0.22,0.8,0.32,1) both"
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      width: 158,
      height: 158,
      borderRadius: "50%",
      background: dark ? "radial-gradient(circle, rgba(200,205,218,0.4), transparent 64%)" : "radial-gradient(circle, rgba(180,188,205,0.42), transparent 66%)",
      filter: "blur(8px)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      borderRadius: "50%",
      background: dark ? "linear-gradient(160deg,#474c57,#24262e)" : "linear-gradient(160deg,#eef1f6,#c8cedb)",
      boxShadow: dark ? "inset 0 3px 10px rgba(255,255,255,0.16), inset 0 -10px 20px rgba(0,0,0,0.32), 0 16px 40px rgba(0,0,0,0.4)" : "inset 0 3px 10px rgba(255,255,255,0.9), inset 0 -12px 22px rgba(70,80,100,0.22), 0 16px 38px rgba(120,130,150,0.35)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 9,
      borderRadius: "50%",
      overflow: "hidden",
      animation: "suFaceIn 0.5s 0.46s ease both"
    }
  }, /*#__PURE__*/React.createElement(BosAvatar, {
    avatar: app?.avatar,
    size: 100,
    bare: true
  })), /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      inset: 0,
      borderRadius: "50%",
      boxShadow: dark ? "inset 0 0 0 1px rgba(255,255,255,0.12)" : "inset 0 0 0 1px rgba(255,255,255,0.55)",
      background: "radial-gradient(circle at 33% 24%, rgba(255,255,255,0.6), transparent 40%)",
      pointerEvents: "none"
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => openSheet(/*#__PURE__*/React.createElement(AvatarPickerSheet, {
      dark: dark
    })),
    className: "tap",
    "aria-label": "\u0421\u043C\u0435\u043D\u0438\u0442\u044C \u0430\u0432\u0430\u0442\u0430\u0440",
    style: {
      position: "absolute",
      right: -2,
      bottom: -2,
      width: 32,
      height: 32,
      borderRadius: "50%",
      background: pal.btnBg,
      color: pal.btnFg,
      border: "2.5px solid " + (dark ? "#0a0a0e" : "#eceef2"),
      display: "grid",
      placeItems: "center",
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      animation: "suFaceIn 0.4s 0.7s ease both"
    }
  }, /*#__PURE__*/React.createElement(I.Pencil, {
    size: 14
  })), /*#__PURE__*/React.createElement("style", null, `@keyframes suOrbIn{0%{opacity:0;transform:translateY(-14px) scale(1.34)}45%{opacity:1}100%{opacity:1;transform:translateY(0) scale(1)}}@keyframes suFaceIn{from{opacity:0;transform:scale(0.82)}to{opacity:1;transform:scale(1)}}@keyframes suTextIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes suSheetIn{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)}}`)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--bos-title-font)",
      fontSize: 27,
      fontWeight: 700,
      letterSpacing: "-0.6px",
      marginTop: 24,
      textAlign: "center",
      animation: "suTextIn 0.6s 0.5s ease both"
    }
  }, "\u0421 \u0447\u0435\u0433\u043E \u043D\u0430\u0447\u043D\u0451\u043C?"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: pal.sub,
      marginTop: 8,
      textAlign: "center",
      maxWidth: 286,
      lineHeight: 1.5,
      animation: "suTextIn 0.6s 0.6s ease both"
    }
  }, "\u0417\u0430\u0433\u043B\u044F\u043D\u0438 \u0432 \u0433\u043E\u0442\u043E\u0432\u044B\u0439 \u043F\u0440\u0438\u043C\u0435\u0440 \u2014 \u0438\u043B\u0438 \u043D\u0430\u0447\u043D\u0438 \u0441\u0432\u043E\u0439 \u043F\u0443\u0442\u044C \u0441 \u0447\u0438\u0441\u0442\u043E\u0433\u043E \u043B\u0438\u0441\u0442\u0430.")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: pal.sheet,
      borderTop: pal.sheetBorder,
      borderRadius: "33px 33px 0 0",
      padding: "24px 22px calc(26px + var(--tg-bottom-inset, 0px))",
      animation: "suSheetIn 0.62s 0.56s cubic-bezier(0.22,0.8,0.32,1) both"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 600,
      letterSpacing: "0.6px",
      textTransform: "uppercase",
      color: pal.sub,
      margin: "2px 0 11px 4px"
    }
  }, "\u0414\u0435\u043C\u043E \u2014 \u043F\u0440\u043E\u0441\u0442\u043E \u043F\u043E\u0441\u043C\u043E\u0442\u0440\u0435\u0442\u044C"), /*#__PURE__*/React.createElement("button", {
    onClick: goDemo,
    className: "tap",
    style: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: 13,
      textAlign: "left",
      background: "linear-gradient(135deg, #FEDE34, #EF9F14)",
      color: "#0a0a0a",
      border: 0,
      borderRadius: 22,
      padding: "15px 16px",
      boxShadow: "0 12px 30px rgba(254,222,52,0.32)",
      marginBottom: 11
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 44,
      height: 44,
      borderRadius: 14,
      background: "rgba(255,255,255,0.55)",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(I.Sparkles, {
    size: 23,
    color: "#0a0a0a"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      letterSpacing: "-0.3px"
    }
  }, "\u041F\u043E\u0441\u043C\u043E\u0442\u0440\u0435\u0442\u044C \u0434\u0435\u043C\u043E"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "rgba(0,0,0,0.6)",
      marginTop: 2,
      lineHeight: 1.35
    }
  }, "\u0417\u0430\u043F\u043E\u043B\u043D\u0435\u043D\u043D\u044B\u0439 \u043F\u0440\u0438\u043C\u0435\u0440 \u2014 \u043A\u0430\u043A \u0443 \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0433\u043E \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F")), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 20,
    color: "rgba(0,0,0,0.5)"
  })), /*#__PURE__*/React.createElement("button", {
    onClick: goFresh,
    className: "tap",
    style: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: 13,
      textAlign: "left",
      background: pal.btnBg,
      color: pal.btnFg,
      border: 0,
      borderRadius: 22,
      padding: "15px 16px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 44,
      height: 44,
      borderRadius: 14,
      background: dark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.22)",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(I.Plus, {
    size: 22,
    color: pal.btnFg
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      letterSpacing: "-0.3px"
    }
  }, "\u041D\u0430\u0447\u0430\u0442\u044C \u0441 \u0447\u0438\u0441\u0442\u043E\u0433\u043E \u043B\u0438\u0441\u0442\u0430"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      opacity: 0.6,
      marginTop: 2,
      lineHeight: 1.35
    }
  }, "\u041F\u0443\u0441\u0442\u043E\u0435 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u2014 \u043F\u043E\u043F\u0440\u043E\u0431\u043E\u0432\u0430\u0442\u044C \u043A\u0430\u043A \u043D\u043E\u0432\u0438\u0447\u043E\u043A")), /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: 0.5,
      display: "flex",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 20,
    color: pal.btnFg
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 600,
      letterSpacing: "0.6px",
      textTransform: "uppercase",
      color: pal.sub,
      margin: "24px 0 11px 4px"
    }
  }, "\u0412\u043E\u0439\u0442\u0438 \u043F\u043E-\u043D\u0430\u0441\u0442\u043E\u044F\u0449\u0435\u043C\u0443"), /*#__PURE__*/React.createElement("button", {
    onClick: goLive,
    className: "tap",
    style: {
      position: "relative",
      overflow: "hidden",
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 9,
      background: "linear-gradient(150deg, #20242c 0%, #0a0a0a 62%)",
      color: "#fff",
      border: "1px solid rgba(255,255,255,0.09)",
      borderRadius: 999,
      padding: "16px 18px",
      fontSize: 15.5,
      fontWeight: 600,
      letterSpacing: "-0.1px",
      boxShadow: "0 14px 32px rgba(0,0,0,0.30)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      left: 14,
      top: "50%",
      transform: "translateY(-50%)",
      width: 32,
      height: 32,
      borderRadius: "50%",
      background: "radial-gradient(120% 120% at 32% 26%, #43b6ea, #229ED9 58%, #1b8ec3)",
      display: "grid",
      placeItems: "center",
      flexShrink: 0,
      boxShadow: "0 2px 8px rgba(34,158,217,0.55), inset 0 1px 1px rgba(255,255,255,0.45)"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "17",
    height: "17",
    viewBox: "0 0 24 24",
    fill: "#fff",
    "aria-hidden": true,
    style: {
      transform: "translateX(-0.5px)"
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"
  }))), "\u0412\u043E\u0439\u0442\u0438 \u0447\u0435\u0440\u0435\u0437 Telegram", /*#__PURE__*/React.createElement("span", {
    className: "bos-shine",
    "aria-hidden": true,
    style: {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      width: "42%",
      pointerEvents: "none",
      background: "linear-gradient(105deg, transparent, rgba(255,255,255,0.20) 50%, transparent)",
      transform: "translateX(-160%) skewX(-18deg)",
      animation: "bosShine 5s ease-in-out 1.4s infinite"
    }
  }))));
}
function IconPickerScreen() {
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

/* ─── ACHIEVEMENTS — ачивки как ключи: курс / уровень / доброе дело → значок →
   открывает новый круг контактов. Витрина «ощущения» экосистемы. ─── */
var ACHIEVEMENTS = [{
  i: "⚡",
  t: "Перегрузка пройдена",
  d: "Курс «Перегрузка» · 3 дня",
  earned: true,
  opens: "наставники по фокусу",
  date: "16 мар",
  accent: "#FEDE34"
}, {
  i: "🧘",
  t: "Голос медитации",
  d: "Провёл 10 групповых сессий",
  earned: true,
  opens: "практики медитации",
  date: "2 апр",
  accent: "#5BC57E"
}, {
  i: "🤝",
  t: "Капитан команды",
  d: "Довёл команду до общей цели",
  earned: true,
  opens: "лидеры команд",
  date: "21 мар",
  accent: "#5FA8FF"
}, {
  i: "🔥",
  t: "Месяц без пропусков",
  d: "Серия привычек 30 дней",
  earned: true,
  opens: "+1 уровень доступа",
  date: "12 апр",
  accent: "#FF8A5B"
}, {
  i: "🚀",
  t: "Прорыв",
  d: "Пройди курс «Прорыв» · 7 дней",
  earned: false,
  opens: "продвинутые наставники",
  req: "курс «Прорыв»",
  accent: "#9bd0ff"
}, {
  i: "🏃",
  t: "Марафонец",
  d: "Заверши «Марафон» · 21 день",
  earned: false,
  opens: "тренеры по привычкам",
  req: "курс «Марафон»",
  accent: "#85e3a8"
}, {
  i: "💼",
  t: "Профи-консультант",
  d: "Достигни 10 уровня",
  earned: false,
  opens: "профи-консультанты",
  req: "ещё 3 уровня",
  accent: "#c9b8ff"
}, {
  i: "🌍",
  t: "Хранитель ретрита",
  d: "Достигни 20 уровня",
  earned: false,
  opens: "организаторы ретритов",
  req: "уровень 20",
  accent: "#a8e8e0"
}];
function AchievementsScreen() {
  var {
    navigate,
    params
  } = useNav();
  var app = typeof useApp === "function" ? useApp() : null;
  var back = params?.from || "profile";
  var isLive = app?.mode !== "demo"; // live AND fresh = real signals; only demo is curated
  // LIVE/fresh: achievements earned by real signals; DEMO: the curated showcase list.
  var LIST = isLive ? bosEarnedAchievements(app) : ACHIEVEMENTS;
  var earned = LIST.filter(a => a.earned);
  var locked = LIST.filter(a => !a.earned);
  // Live ladder grants bonus XP per badge; total earned bonus is the hero number.
  var _achXP = isLive ? earned.reduce((s, a) => s + (a.xp || 0), 0) : 0;
  // LIVE "circles of contacts" = real people you actually invited (referral circle).
  var [invited, setInvited] = React.useState(0);
  React.useEffect(() => {
    if (!isLive) return;
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
  }, [isLive]);
  // Demo's framing: each non-"+1 level" earned badge opened a circle. Live: real invited count.
  var circles = isLive ? invited : earned.filter(a => a.opens && !a.opens.startsWith("+")).length;
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
  }, isLive ? /*#__PURE__*/React.createElement(React.Fragment, null, "\u0414\u043E\u0441\u0442\u0438\u0436\u0435\u043D\u0438\u044F \u0437\u0430 \u0443\u0440\u043E\u0432\u043D\u0438, \u0441\u0435\u0440\u0438\u0438 \u0438 \u0437\u0430\u0431\u043E\u0442\u0443 \u043E \u0441\u0435\u0431\u0435. \u041A\u0430\u0436\u0434\u043E\u0435 \u0434\u0430\u0451\u0442 \u0431\u043E\u043D\u0443\u0441 XP", _achXP > 0 ? /*#__PURE__*/React.createElement(React.Fragment, null, " \u2014 \u0442\u044B \u0443\u0436\u0435 \u0437\u0430\u0440\u0430\u0431\u043E\u0442\u0430\u043B ", /*#__PURE__*/React.createElement("b", null, "+", _achXP, " XP"), ".") : /*#__PURE__*/React.createElement(React.Fragment, null, " \u2014 \u043E\u0442\u043A\u0440\u043E\u0439 \u043F\u0435\u0440\u0432\u043E\u0435.")) : /*#__PURE__*/React.createElement(React.Fragment, null, "\u0410\u0447\u0438\u0432\u043A\u0438 \u2014 \u044D\u0442\u043E \u043A\u043B\u044E\u0447\u0438: \u0437\u0430 \u043A\u0443\u0440\u0441\u044B, \u0443\u0440\u043E\u0432\u043D\u0438 \u0438 \u0434\u043E\u0431\u0440\u044B\u0435 \u0434\u0435\u043B\u0430. \u0423\u0436\u0435 \u043E\u0442\u043A\u0440\u044B\u043B\u0438 ", /*#__PURE__*/React.createElement("b", null, circles, " \u043A\u0440\u0443\u0433\u0430 \u043A\u043E\u043D\u0442\u0430\u043A\u0442\u043E\u0432"), ".")), /*#__PURE__*/React.createElement("div", {
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
// want to read it whole. Reached from Settings → «О приложении».
function ManifestScreen() {
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
Object.assign(window, {
  ProfileScreen,
  SettingsScreen,
  NotificationsScreen,
  HistoryScreen,
  SupportScreen,
  AIScreen,
  OnboardingScreen,
  SignUpScreen,
  IconPickerScreen,
  AchievementsScreen,
  ACHIEVEMENTS,
  ManifestScreen
});

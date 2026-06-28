/* COMMUNITY — LIVE-only fork of CommunityScreen + TeamDetailScreen (real Telegram
   user, app.mode === "live" is ALWAYS true here). Giving the live user its OWN
   screen files keeps the two demo modes ('demo' / 'fresh') frozen — future live
   edits can never break the showcase.

   What the demo/fresh branches contributed (all stripped here):
   • CommunityLive — drops the fabricated Нетворк people list (YourImpactCard +
     the curated `network` array + their message/booking buttons) and the demo-only
     Партнёры marketplace tab + its `partners` array. Live Нетворк ALWAYS shows the
     honest NetworkLockedLive banner (real XP paths, no fake people); the secondary
     scope bar is just Нетворк + Курсы. Курсы are real (kept), with live cohort
     windows computed from today. Teams + cloud "Открытые команды рядом" discovery
     are kept.
   • TeamDetailLive — drops the demo team calendar, demo activity feed, demo chat
     line, the fabricated leaderboard (contribution %, 👑 leader, expandable
     per-member habit chips) and the DEFAULT_TEAM_HABITS seed. Live keeps the REAL
     cloud roster (window.bosCloud.teamMembers → BOS_TEAM_PALETTE colours + dark
     initials), real team habits (teamHabitsFull / toggleTeamHabitToday), owner
     join-request approvals, leave/delete, and the share-link sheet.

   Everything else reuses the shared core/ toolkit (BOS_TEAM_PALETTE, AvatarStack,
   ConfirmActionSheet, TeamShareSheet, TeamHabitSheet, TeamRing) +
   the live forks in shared_live.jsx (NetworkLockedLive, PeopleMonthCalendarLive,
   CloudTeamsDiscoverLive) +
   framework (BosAvatar, PageHeader, the icon object I, the bos* helpers, window.bosCloud,
   hooks useApp/useNav/useSheet, and useCS = React.useState). The ONLY new top-level
   declarations in this file are `function CommunityLive` and `function TeamDetailLive`. */

// LIVE team card — shows the REAL cloud roster (member count + real avatars) for a team you're
// in, not the stale local t.members (that mismatch was «3 снаружи / 0 внутри»). AvatarStack
// already caps at 5 faces + a «+N» overflow chip (iOS-style) and uses each member's real
// avatar. Local-only teams fall back to their own members; empty cloud team = honest «ты один».
function LiveTeamCard({
  t,
  navigate
}) {
  var tgt = t.target || 0;
  var cur = t.current != null ? t.current : Math.round((t.progress || 0) * tgt);
  var gp = tgt > 0 ? Math.min(1, cur / tgt) : t.progress || 0;
  var palette = typeof BOS_TEAM_PALETTE !== "undefined" ? BOS_TEAM_PALETTE : ["#7FB3F2"];
  var _cloud = !!(t.cloudId && window.bosCloud && window.bosCloud.enabled() && window.bosCloud.teamMembers);
  var [roster, setRoster] = React.useState(null); // null = not loaded yet
  React.useEffect(() => {
    if (!_cloud) return;
    var on = true;
    window.bosCloud.teamMembers(t.cloudId).then(mem => {
      if (!on || !Array.isArray(mem)) return;
      setRoster(mem.map((m, j) => ({
        name: m.name || "Участник",
        avatar: m.avatar,
        initials: (m.name || "У").slice(0, 1).toUpperCase(),
        color: palette[j % palette.length]
      })));
    }).catch(() => {
      if (on) setRoster([]);
    });
    return () => {
      on = false;
    };
  }, [t.cloudId]);
  var _loading = _cloud && roster === null; // cloud roster not back yet → skeleton, never «ты один»
  var members = _cloud ? roster || [] : t.members || [];
  var count = members.length;
  var ruPart = n => {
    var m = n % 10,
      h = n % 100;
    return m === 1 && h !== 11 ? "участник" : m >= 2 && m <= 4 && (h < 10 || h >= 20) ? "участника" : "участников";
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "team-card",
    style: {
      ["--team-accent"]: t.accent,
      borderRadius: 22,
      padding: 18,
      position: "relative",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    className: "team-card__emblem",
    style: {
      position: "absolute",
      top: -10,
      right: -6,
      fontSize: 110,
      lineHeight: 1,
      pointerEvents: "none",
      transform: "rotate(8deg)"
    }
  }, bosIcon(t.emblem, 88, t.accent)), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 700,
      fontSize: 18,
      color: "var(--text)",
      letterSpacing: "-0.4px"
    }
  }, t.name), /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0,
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      fontSize: 10.5,
      fontWeight: 600,
      color: "var(--text-3)",
      background: "var(--card-track)",
      padding: "2px 8px",
      borderRadius: 999
    }
  }, t.vis === "public" ? "🌐 Открытая" : "🔒 Приватная")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-2)",
      marginTop: 6,
      fontWeight: 500
    }
  }, "\uD83C\uDFAF ", t.goal), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-3)",
      marginTop: 2,
      minHeight: 16
    }
  }, t.date, _loading ? "" : " · " + count + " " + ruPart(count)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 14,
      fontSize: 11,
      color: "var(--text-3)",
      textTransform: "uppercase",
      letterSpacing: 1,
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement("span", null, t.target ? "К цели" : "Прогресс команды"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text)"
    }
  }, t.target ? cur + " / " + tgt + " " + (t.unit || "") : Math.round(gp * 100) + "%")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      height: 8,
      borderRadius: 999,
      background: "var(--card-track)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "team-card__fill",
    style: {
      display: "block",
      height: "100%",
      width: gp * 100 + "%",
      borderRadius: 999
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      marginTop: 14,
      gap: 8
    }
  }, _loading ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex"
    }
  }, [0, 1, 2].map(i => /*#__PURE__*/React.createElement("span", {
    key: i,
    className: "bos-skel",
    style: {
      width: 28,
      height: 28,
      borderRadius: "50%",
      marginLeft: i ? -10 : 0,
      border: "2px solid var(--card)"
    }
  }))) : count > 0 ? /*#__PURE__*/React.createElement(PeopleStackLive, {
    people: members,
    size: 28,
    max: 5
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-4)"
    }
  }, "\u041F\u043E\u043A\u0430 \u0442\u044B \u043E\u0434\u0438\u043D \u2014 \u043F\u043E\u0437\u043E\u0432\u0438 \u0434\u0440\u0443\u0437\u0435\u0439"), /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("team-detail", {
      team: t
    }),
    className: "tap team-card__cta",
    style: {
      marginLeft: "auto",
      border: 0,
      borderRadius: 999,
      padding: "11px 18px",
      fontSize: 13.5,
      fontWeight: 600
    }
  }, "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043A\u043E\u043C\u0430\u043D\u0434\u0443"))));
}
function CommunityLive() {
  var {
    navigate
  } = useNav();
  var app = useApp();
  // View-state (section / sub-tabs / network unlock) lives in the shared store so
  // it survives navigating into a detail screen and back (the screen remounts).
  var cv = app?.communityView || {
    section: "discover",
    discTab: "teams",
    commTab: "network",
    networkUnlocked: false
  };
  var {
    section,
    discTab,
    commTab
  } = cv;
  var setView = patch => app?.setCommunityView(patch);
  var resolve = (v, cur) => typeof v === "function" ? v(cur) : v;
  var setSection = v => setView({
    section: resolve(v, section)
  });
  var setCommTab = v => setView({
    commTab: resolve(v, commTab)
  });

  // LIVE has no Партнёры tab — if a stale view left commTab on "partners" (e.g. it was
  // selected before, or carried from another mode), fall back to "network" so the
  // content area is never blank.
  var commTabEff = commTab === "partners" ? "network" : commTab;

  // Real level for the live user — never the demo's curated 8/1240/2000. The
  // typeof guard keeps this safe if the XP helpers aren't loaded yet.
  var _commLvl = typeof bosLiveXPLive === "function" && typeof bosLevelInfoLive === "function" ? bosLevelInfoLive(bosLiveXPLive(app)) : null;
  var userLevel = _commLvl ? _commLvl.level : 1;
  var xpInLevel = _commLvl ? _commLvl.into : 0;
  var xpForNext = _commLvl ? _commLvl.span : 2000;
  var levelsLeft = Math.max(0, 10 - userLevel);
  var weeksToUnlock = Math.max(1, levelsLeft);
  var teams = app?.teams || []; // shared store — "Создать команду" adds here

  // Upcoming cohort window: a "D — D MMM" range that starts `startIn` days from the
  // REAL today and runs `days` long, so dates are never stale.
  var _ruMon = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  var _cohortWindow = (startIn, days) => {
    var a = new Date();
    a.setHours(0, 0, 0, 0);
    a.setDate(a.getDate() + startIn);
    var b = new Date(a);
    b.setDate(b.getDate() + (days - 1));
    return a.getMonth() === b.getMonth() ? a.getDate() + " — " + b.getDate() + " " + _ruMon[b.getMonth()] : a.getDate() + " " + _ruMon[a.getMonth()] + " — " + b.getDate() + " " + _ruMon[b.getMonth()];
  };
  var courses = [{
    id: "overload",
    i: "⚡",
    accent: "#fef3c7",
    t: "Перегрузка",
    d: "Перенастрой мышление и очисти негативные убеждения.",
    price: "110 000 ₽",
    lvl: "Интенсив",
    length: "3 дня",
    cohort: _cohortWindow(12, 3)
  }, {
    id: "breakthrough",
    i: "🚀",
    accent: "#dbe9ff",
    t: "Прорыв",
    d: "Открой новые пути и преодолей пределы.",
    price: "110 000 ₽",
    lvl: "Продвинутый",
    length: "7 дней",
    cohort: _cohortWindow(33, 7)
  }, {
    id: "marathon",
    i: "🏃🏼‍♀️",
    accent: "#d6f3df",
    t: "Марафон",
    d: "21-дневная программа устойчивых привычек.",
    price: "110 000 ₽",
    lvl: "Базовый",
    length: "21 день",
    cohort: _cohortWindow(54, 21)
  }];
  return /*#__PURE__*/React.createElement("div", {
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
      flex: 1,
      fontSize: 22,
      fontWeight: 700,
      letterSpacing: "-0.5px",
      color: "var(--text)"
    }
  }, "\u0421\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E"), /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("team-create"),
    className: "tap",
    style: {
      background: "#0a0a0a",
      color: "#fff",
      border: 0,
      borderRadius: 999,
      padding: "10px 14px",
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontSize: 13,
      fontWeight: 500,
      boxShadow: "0 4px 14px rgba(0,0,0,0.18)"
    }
  }, /*#__PURE__*/React.createElement(I.Plus, {
    size: 16
  }), " \u041D\u043E\u0432\u0430\u044F \u043A\u043E\u043C\u0430\u043D\u0434\u0430")), /*#__PURE__*/React.createElement("div", {
    className: "tab-pill",
    style: {
      background: "var(--card-2)"
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "tap " + (section === "discover" ? "active" : ""),
    onClick: () => setSection("discover")
  }, "\u041A\u043E\u043C\u0430\u043D\u0434\u044B"), /*#__PURE__*/React.createElement("button", {
    className: "tap " + (section === "community" ? "active" : ""),
    onClick: () => setSection("community")
  }, "\u0421\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E")), section === "community" && /*#__PURE__*/React.createElement("div", {
    className: "tab-pill tab-pill-sm",
    style: {
      background: "var(--card-2)",
      marginTop: 10,
      marginBottom: 14
    }
  }, [{
    id: "network",
    t: "Нетворк"
  }, {
    id: "courses",
    t: "Курсы"
  }].map(tb => /*#__PURE__*/React.createElement("button", {
    key: tb.id,
    className: "tap " + (commTabEff === tb.id ? "active" : ""),
    "data-tour": tb.id === "network" ? "network" : undefined,
    onClick: () => setCommTab(tb.id)
  }, tb.t))), section === "discover" && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12,
      marginTop: 14
    }
  }, teams.map((t, i) => /*#__PURE__*/React.createElement(LiveTeamCard, {
    key: t._id || i,
    t: t,
    navigate: navigate
  })), teams.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "8px 18px 2px",
      color: "var(--text-4)",
      fontSize: 13.5,
      lineHeight: 1.5
    }
  }, "\u041A\u043E\u043C\u0430\u043D\u0434\u044B \u2014 \u044D\u0442\u043E \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0438 \u0432\u043C\u0435\u0441\u0442\u0435 \u0441 \u0434\u0440\u0443\u0437\u044C\u044F\u043C\u0438. \u0421\u043E\u0437\u0434\u0430\u0439 \u043F\u0435\u0440\u0432\u0443\u044E \u0438\u043B\u0438 \u0434\u043E\u0436\u0434\u0438\u0441\u044C \u043F\u0440\u0438\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u044F."), /*#__PURE__*/React.createElement("button", {
    "data-tour": "make-team",
    onClick: () => navigate("team-create"),
    className: "tap team-new-cta",
    style: {
      color: "#fff",
      border: 0,
      borderRadius: 22,
      padding: 18,
      display: "flex",
      alignItems: "center",
      gap: 14,
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 48,
      height: 48,
      borderRadius: "50%",
      background: "rgba(255,222,52,0.15)",
      display: "grid",
      placeItems: "center"
    }
  }, /*#__PURE__*/React.createElement(I.Plus, {
    size: 22,
    color: "#FEDE34"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600,
      fontSize: 16
    }
  }, "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043A\u043E\u043C\u0430\u043D\u0434\u0443"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      opacity: 0.65,
      marginTop: 2
    }
  }, "\u041F\u0440\u0438\u0433\u043B\u0430\u0441\u0438 \u0434\u0440\u0443\u0437\u0435\u0439, \u043F\u043E\u0441\u0442\u0430\u0432\u044C \u043E\u0431\u0449\u0443\u044E \u0446\u0435\u043B\u044C, \u0432\u044B\u0441\u0442\u0440\u0430\u0438\u0432\u0430\u0439\u0442\u0435 \u0441\u0435\u0440\u0438\u0438 \u0432\u043C\u0435\u0441\u0442\u0435.")), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 18
  })), /*#__PURE__*/React.createElement(CloudTeamsDiscoverLive, {
    app: app
  })), section === "community" && commTabEff === "network" &&
  /*#__PURE__*/
  // The unlocked Network body (a curated people list + booking buttons) is
  // FABRICATED content — demo-only. The live user gets the honest locked banner
  // instead (real XP paths, no fabricated people), until a real network exists.
  React.createElement("div", {
    style: {
      marginTop: 2
    }
  }, /*#__PURE__*/React.createElement(NetworkLockedLive, {
    navigate: navigate,
    live: true,
    level: userLevel,
    xp: xpInLevel,
    xpMax: xpForNext,
    levelsLeft: levelsLeft,
    weeks: weeksToUnlock,
    onUnlock: () => {},
    onSwitchToCommunity: () => {
      setSection("community");
      setCommTab("courses");
    }
  })), section === "community" && commTabEff === "courses" && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12,
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      overflow: "hidden",
      borderRadius: 22,
      padding: "16px 18px",
      background: "linear-gradient(135deg, #FEDE34, #EF9F14)",
      boxShadow: "0 8px 22px rgba(239,159,20,0.32)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      top: -46,
      right: -28,
      width: 168,
      height: 168,
      borderRadius: "50%",
      background: "radial-gradient(circle, rgba(255,255,255,0.5), transparent 66%)",
      pointerEvents: "none"
    }
  }), /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      top: 15,
      right: 17,
      fontSize: 38,
      lineHeight: 1,
      pointerEvents: "none"
    }
  }, "\uD83C\uDFC6"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: 1.4,
      textTransform: "uppercase",
      color: "rgba(58,42,0,0.6)"
    }
  }, "\u0417\u0430\u0447\u0435\u043C \u043F\u0440\u043E\u0445\u043E\u0434\u0438\u0442\u044C \u043A\u0443\u0440\u0441\u044B"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 19,
      fontWeight: 800,
      letterSpacing: "-0.4px",
      color: "#3a2a00",
      marginTop: 4,
      maxWidth: 220,
      lineHeight: 1.2
    }
  }, "\u041A\u0430\u0436\u0434\u044B\u0439 \u043A\u0443\u0440\u0441 \u2014 \u0446\u0435\u043B\u044B\u0439 \u0443\u0440\u043E\u0432\u0435\u043D\u044C"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "rgba(58,42,0,0.8)",
      marginTop: 6,
      lineHeight: 1.42,
      maxWidth: 244
    }
  }, "\u0410\u0447\u0438\u0432\u043A\u0430, \u0431\u043E\u043B\u044C\u0448\u043E\u0439 \u043E\u043F\u044B\u0442 \u0438 \u0434\u043E\u0441\u0442\u0443\u043F \u043A \u043D\u043E\u0432\u044B\u043C \u043B\u044E\u0434\u044F\u043C. \u0421\u0430\u043C\u044B\u0439 \u0431\u044B\u0441\u0442\u0440\u044B\u0439 \u0440\u043E\u0441\u0442."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 7,
      marginTop: 13,
      flexWrap: "wrap"
    }
  }, [["🏆", "+Уровень"], ["🎖️", "Ачивка"], ["⚡", "+2000 XP"]].map(([e, l], i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      background: "rgba(255,255,255,0.55)",
      borderRadius: 999,
      padding: "6px 11px",
      fontSize: 12.5,
      fontWeight: 700,
      color: "#3a2a00"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      lineHeight: 1
    }
  }, e), l))))), courses.map((c, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    "data-tour": i === 0 ? "course" : undefined,
    onClick: () => navigate("course-detail", {
      course: c
    }),
    className: "tap",
    style: {
      background: "var(--card)",
      borderRadius: 22,
      padding: 16,
      boxShadow: "var(--card-shadow)",
      border: 0,
      textAlign: "left",
      color: "var(--text)",
      display: "block",
      width: "100%"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      fontSize: 17,
      color: "var(--text)",
      letterSpacing: "-0.3px"
    }
  }, c.t), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      padding: "2px 8px",
      background: "var(--card-2)",
      borderRadius: 999,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 0.6,
      fontWeight: 600
    }
  }, c.lvl)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-3)",
      marginTop: 6,
      lineHeight: 1.45
    }
  }, c.d), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-4)",
      marginTop: 6,
      display: "flex",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u23F1 ", c.length), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCC5 ", c.cohort))), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 46,
      height: 46,
      borderRadius: "50%",
      background: c.accent,
      display: "grid",
      placeItems: "center",
      fontSize: 22,
      flexShrink: 0
    }
  }, c.i)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderTop: "1px solid var(--line)",
      paddingTop: 12,
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1,
      fontWeight: 600
    }
  }, "\u0421\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u044C"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      marginTop: 2,
      color: "var(--text)"
    }
  }, c.price)), /*#__PURE__*/React.createElement("span", {
    style: {
      background: "#0a0a0a",
      color: "#fff",
      borderRadius: 999,
      padding: "10px 18px",
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontSize: 13,
      fontWeight: 500
    }
  }, "\u041E \u043A\u0443\u0440\u0441\u0435 ", /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 14
  })))))));
}

/* Per-team stale-while-revalidate cache (roster / habits / anchor-progress / goal) so
   re-opening a team renders INSTANTLY from the last-known data instead of flashing through
   a skeleton every time (David: «каждый раз вижу обновление экрана, дёргать не нравится»).
   Keyed by cloudId; the effects below still revalidate in the background. */
var _bosTeamCache = {};
function _bosTeamGet(k) {
  return k && _bosTeamCache[k] !== undefined ? _bosTeamCache[k] : null;
}
function _bosTeamPut(k, v) {
  if (k) {
    _bosTeamCache[k] = v;
  }
  return v;
}
function TeamDetailLive() {
  var {
    navigate,
    params
  } = useNav();
  var app = useApp();
  var {
    open: openSheet
  } = useSheet();
  var passed = params?.team || {
    _id: "seed-1",
    name: "Команда создателей",
    emblem: "✨",
    accent: "#fef3c7",
    goal: "50 добрых дел за месяц",
    date: "1 — 31 дек",
    progress: 0,
    members: []
  };
  // Read the LIVE team from the store so a just-added habit appears immediately.
  var t = (app?.teams || []).find(x => x._id === passed._id) || passed;
  var accent = t.accent || "#fef3c7";
  var isDark = app?.themeOverride === "dark";
  // The goal MODE — shown as a chip so the team's rule (общий счёт / серия / гонка) is ALWAYS
  // visible, not hidden behind the async cloud progress (David: «не вижу их отражение»).
  var teamModeMeta = {
    collective: {
      e: "🌊",
      t: "Общий счёт"
    },
    streak: {
      e: "🔥",
      t: "Серия у каждого"
    },
    race: {
      e: "🏁",
      t: "Гонка"
    }
  }[t.type || "collective"];
  // LIVE = real user: honest data or empty, NEVER fake standings/activity/calendar —
  // even for a team without a cloud link yet.

  // Real team-chat preview + unread badge for LIVE cloud teams. Guarded on the cloud
  // being enabled AND the team having a cloudId — a freshly-created local team has
  // neither yet, so this stays inert until it syncs.
  var _chatLive = !!(window.bosCloud && window.bosCloud.enabled() && t.cloudId);
  var _readKey = t.cloudId ? "bos:chatread:" + t.cloudId : null;
  var [chatPeek, setChatPeek] = React.useState(null); // { last, unread } for live teams
  React.useEffect(() => {
    if (!_chatLive) return;
    var on = true;
    (async () => {
      try {
        var me = await window.bosCloud.uid();
        var rows = await window.bosCloud.loadMessages(t.cloudId);
        if (!on || !Array.isArray(rows)) return;
        // Compare each message's server created_at to the stored read-marker created_at —
        // SAME time base on both sides (a device clock drifts vs the server, so on skewed
        // phones a Date.now() compare would stick or never show the badge).
        var lastReadRaw = _readKey && localStorage.getItem(_readKey) || 0;
        var lastReadMs = lastReadRaw ? new Date(lastReadRaw).getTime() : 0;
        var last = rows.length ? rows[rows.length - 1] : null;
        var lastText = last ? last.text || (last.image_url ? "📷 Фото" : "") : "";
        var unread = rows.filter(r => r && r.user_id !== me && new Date(r.created_at).getTime() > lastReadMs).length;
        // Carry the last message's created_at so markChatRead can store it as the read marker
        // (same time base as messages). No messages yet → null → everything counts as read.
        setChatPeek({
          last: lastText,
          unread: unread,
          lastAt: last ? last.created_at : null
        });
      } catch (e) {}
    })();
    return () => {
      on = false;
    };
  }, [_chatLive, t.cloudId]);
  var markChatRead = () => {
    // Store the LAST loaded message's created_at (server time base) — NOT Date.now() (device
    // clock). If nothing was loaded yet, store "" so the next compare treats all as read.
    try {
      if (_readKey) localStorage.setItem(_readKey, chatPeek && chatPeek.lastAt ? String(chatPeek.lastAt) : "");
    } catch (e) {}
    setChatPeek(p => p ? {
      ...p,
      unread: 0
    } : p);
  };

  // LIVE teams: load the REAL roster (real names + avatars + roles) from the cloud, so the
  // member list is honest — real teammates, no fabricated standings until real progress exists.
  var _rosterLive = !!(window.bosCloud && window.bosCloud.enabled() && t.cloudId);
  var [cloudRoster, setCloudRoster] = React.useState(() => _bosTeamGet("roster:" + t.cloudId));
  var [meId, setMeId] = React.useState(null); // current user's cloud id — to find myself in the roster
  var [rosterTick, setRosterTick] = React.useState(0);
  React.useEffect(() => {
    if (!_rosterLive) {
      setMeId(null);
      return;
    }
    var on = true;
    window.bosCloud.uid().then(id => {
      if (on) setMeId(id || null);
    }).catch(() => {});
    return () => {
      on = false;
    };
  }, [_rosterLive, t.cloudId]);
  React.useEffect(() => {
    if (!_rosterLive) return;
    var on = true;
    window.bosCloud.teamMembers(t.cloudId).then(mem => {
      if (!on || !Array.isArray(mem)) return;
      var palette = BOS_TEAM_PALETTE;
      // owner first, then members, in join order
      var sorted = mem.slice().sort((a, b) => a.role === "owner" ? -1 : b.role === "owner" ? 1 : 0);
      setCloudRoster(_bosTeamPut("roster:" + t.cloudId, sorted.map((m, i) => ({
        id: m.id,
        name: m.name || "Участник",
        avatar: m.avatar,
        role: m.role,
        initials: (m.name || "У").slice(0, 1).toUpperCase(),
        color: palette[i % palette.length]
      }))));
    }).catch(() => {});
    return () => {
      on = false;
    };
  }, [_rosterLive, t.cloudId, rosterTick]);
  // E: the CREATOR sees pending join requests here and approves / rejects them.
  // Derive ownership from the REAL roster role, so a creator opening their team on a
  // second device (where t.joined may be truthy after cloud hydration) still gets the
  // gear + approval panel. Fall back to the old !t.joined heuristic only until the
  // roster + my id have loaded.
  var _meMember = meId && Array.isArray(cloudRoster) ? cloudRoster.find(m => m.id === meId) : null;
  var _isOwner = _meMember ? _meMember.role === "owner" : !t.joined;
  var [pending, setPending] = React.useState([]);
  React.useEffect(() => {
    if (!(_rosterLive && _isOwner) || !window.bosCloud.pendingRequests) return;
    var on = true;
    window.bosCloud.pendingRequests(t.cloudId).then(p => {
      if (on) setPending(Array.isArray(p) ? p : []);
    }).catch(() => {});
    return () => {
      on = false;
    };
  }, [_rosterLive, _isOwner, t.cloudId, rosterTick]);
  var approveReq = uid => {
    window.bosCloud.approveMember(t.cloudId, uid).then(ok => {
      if (ok) {
        setPending(p => p.filter(x => x.id !== uid));
        setRosterTick(n => n + 1);
      }
    });
  };
  var rejectReq = uid => {
    window.bosCloud.rejectMember(t.cloudId, uid).then(ok => {
      if (ok) setPending(p => p.filter(x => x.id !== uid));
    });
  };

  // REAL shared team habits for live teams (from the cloud): real names + per-member completion.
  var [liveTeamHabits, setLiveTeamHabits] = React.useState(() => _bosTeamGet("habits:" + t.cloudId));
  var [habitsTick, setHabitsTick] = React.useState(0);
  var [mainProg, setMainProg] = React.useState(() => _bosTeamGet("mainprog:" + t.cloudId)); // per-member day-map for the anchor habit (who did which day)
  var [goalProg, setGoalProg] = React.useState(() => _bosTeamGet("goal:" + t.cloudId)); // team-goal progress COMPUTED from habit marks (current + per-member contribution)
  var [settlements, setSettlements] = React.useState(null); // { user_id: {xp, won} } — team-goal XP payouts (cloud ledger)
  var settledRef = React.useRef(false); // settle-once guard (per mount per reached goal)
  React.useEffect(() => {
    if (!_rosterLive || !window.bosCloud.teamHabitsFull) return;
    var on = true;
    window.bosCloud.teamHabitsFull(t.cloudId).then(hs => {
      if (on) setLiveTeamHabits(_bosTeamPut("habits:" + t.cloudId, Array.isArray(hs) ? hs : []));
    }).catch(() => {});
    return () => {
      on = false;
    };
  }, [_rosterLive, t.cloudId, habitsTick]);
  var toggleMyTeamHabit = h => {
    if (!h || !h.id) return;
    // Derive the next state INSIDE the updater from the CURRENT item x (not the captured
    // outer h) so a fast double-tap can't double-count, and clamp doneToday to [0, total].
    setLiveTeamHabits(list => (list || []).map(x => {
      if (x.id !== h.id) return x;
      var next = !x.doneByMe;
      var cap = Number.isFinite(x.total) ? x.total : x.doneToday + 1;
      var doneToday = Math.max(0, Math.min(cap, x.doneToday + (next ? 1 : -1)));
      return {
        ...x,
        doneByMe: next,
        doneToday: doneToday
      };
    }));
    if (window.tgHaptic) {
      try {
        window.tgHaptic("light");
      } catch (e) {}
    }
    window.bosCloud.toggleTeamHabitToday(h.id, !h.doneByMe).then(() => setHabitsTick(n => n + 1));
  };
  var addTeamHabitCloud = h => {
    var first = !(liveTeamHabits && liveTeamHabits.length);
    window.bosCloud.addTeamHabit(t.cloudId, {
      ...h,
      isMain: h && h.isMain || first
    }).then(() => setHabitsTick(n => n + 1));
  };
  // A CLOUD team's roster lives in the cloud; the passed-in t.members is a STALE local
  // cache (the «3 снаружи / 0 внутри» mismatch). Until the real roster loads we show a
  // skeleton — NEVER the stale members, which used to flash phantom people for a beat
  // (David: «проскакивает заполненный демо-вариант»). Mirrors the teamHabits gate below.
  var _rosterLoading = _rosterLive && cloudRoster === null;
  var members = _rosterLive ? cloudRoster || [] : t.members?.length ? t.members : [];
  var ranked = members; // live: roster order (owner first), no contribution sort
  // Live: real cloud habits when synced, else the team's own habits, else empty.
  var teamHabits = _rosterLive ? liveTeamHabits || [] : Array.isArray(t.habits) ? t.habits : [];
  var main = teamHabits.find(h => h.isMain);
  var others = teamHabits.filter(h => !h.isMain);
  // Per-person "who did which day" for the team ANCHOR habit → feeds the SAME month calendar
  // the personal/shared habits use (data already per-user in team_habit_logs). Light poll.
  var _tCalKey = (d, mi) => {
    var y = new Date().getFullYear();
    return y + "-" + String(mi + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
  };
  var _mainId = main && main.id;
  React.useEffect(() => {
    var on = true;
    if (!_rosterLive || !_mainId || !window.bosCloud.teamHabitProgress) {
      setMainProg(null);
      return;
    }
    var load = () => window.bosCloud.teamHabitProgress(t.cloudId, _mainId).then(d => {
      if (on && d && d.members) setMainProg(_bosTeamPut("mainprog:" + t.cloudId, d.members));
    }).catch(() => {});
    load();
    var iv = setInterval(load, 20000);
    return () => {
      on = false;
      clearInterval(iv);
    };
  }, [_rosterLive, t.cloudId, _mainId, habitsTick]);
  // Team GOAL progress — computed from the habit marks per mode (collective/streak/race).
  React.useEffect(() => {
    var on = true;
    if (!_rosterLive || !t.cloudId || !window.bosCloud.teamGoalProgress) {
      setGoalProg(null);
      return;
    }
    var load = () => window.bosCloud.teamGoalProgress(t.cloudId).then(d => {
      if (on && d) setGoalProg(_bosTeamPut("goal:" + t.cloudId, d));
    }).catch(() => {});
    load();
    var iv = setInterval(load, 20000);
    return () => {
      on = false;
      clearInterval(iv);
    };
  }, [_rosterLive, t.cloudId, habitsTick]);
  // PAYOUT — when a STAKED goal is reached, OPEN the bank: idempotently settle MY row (co-op:
  // +stake; race: leader +bank), refresh the global team-goal XP so the level lifts, then read
  // everyone's payouts for the card. Settle runs once per mount (settledRef); the read re-runs on
  // each goalProg poll so other members' payouts appear as they open the team. Unlock-only —
  // nothing is ever deducted, so missing the goal just means the bank never opened.
  React.useEffect(() => {
    if (!_rosterLive || !t.cloudId || !window.bosCloud.settleTeamGoal) return;
    if (!goalProg || !goalProg.done || !(goalProg.stake > 0)) return;
    var on = true;
    var loadSettle = () => window.bosCloud.teamSettlements(t.cloudId).then(s => {
      if (on) setSettlements(s || {});
    }).catch(() => {});
    if (settledRef.current) {
      loadSettle();
    } else {
      settledRef.current = true;
      window.bosCloud.settleTeamGoal(t.cloudId).then(res => {
        if (!on) return;
        loadSettle();
        if (res && res.settled && app && app.refreshTeamGoalXP) app.refreshTeamGoalXP();
      }).catch(loadSettle);
    }
    return () => {
      on = false;
    };
  }, [_rosterLive, t.cloudId, goalProg]);
  var openAddHabit = () => openSheet(/*#__PURE__*/React.createElement(TeamHabitSheet, {
    team: t,
    members: members,
    onAdd: h => {
      if (_rosterLive) addTeamHabitCloud(h);else app?.addTeamHabit(t._id, h);
    }
  }));
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      padding: "0 16px 24px"
    }
  }, /*#__PURE__*/React.createElement(PageHeader, {
    title: "\u041A\u043E\u043C\u0430\u043D\u0434\u0430",
    onBack: () => navigate("community"),
    right: /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8,
        alignItems: "center"
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => openSheet(/*#__PURE__*/React.createElement(TeamShareSheetLive, {
        team: t
      })),
      className: "tap",
      title: "\u041F\u043E\u0434\u0435\u043B\u0438\u0442\u044C\u0441\u044F \u043A\u043E\u043C\u0430\u043D\u0434\u043E\u0439",
      style: {
        width: 40,
        height: 40,
        borderRadius: "50%",
        background: "var(--surface-3)",
        border: 0,
        display: "grid",
        placeItems: "center"
      }
    }, /*#__PURE__*/React.createElement(I.Share, {
      size: 18
    })), _isOwner && /*#__PURE__*/React.createElement(EditGlassButtonLive, {
      onClick: () => navigate("team-settings", {
        team: t
      })
    }))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      background: `linear-gradient(165deg, rgba(255,255,255,0.5), rgba(255,255,255,0.1) 46%, rgba(255,255,255,0) 72%), linear-gradient(135deg, ${accent} 0%, ${accent}66 60%, var(--card-fade) 100%)`,
      color: "var(--text)",
      borderRadius: 22,
      padding: 20,
      position: "relative",
      overflow: "hidden",
      boxShadow: "inset 0 1px 0.5px rgba(255,255,255,0.7), inset 0 0 0 0.7px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.06)",
      transform: "translateZ(0)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      top: -14,
      right: -10,
      fontSize: 150,
      lineHeight: 1,
      opacity: 0.28,
      pointerEvents: "none",
      filter: "saturate(0.9)",
      transform: "rotate(8deg)"
    }
  }, bosIcon(t.emblem || "✨", 116, t.accent)), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 700,
      letterSpacing: "-0.5px",
      color: "var(--text)"
    }
  }, t.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: "var(--text-2)",
      marginTop: 6,
      fontWeight: 500
    }
  }, "\uD83C\uDFAF ", t.goal), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-3)",
      marginTop: 2
    }
  }, t.date), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6,
      marginTop: 9
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      fontSize: 11.5,
      fontWeight: 600,
      color: "var(--text-2)",
      background: "rgba(255,255,255,0.5)",
      padding: "4px 10px",
      borderRadius: 999
    }
  }, t.vis === "public" ? "🌐 Открытая · видна всем" : "🔒 Приватная · по приглашению"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      fontSize: 11.5,
      fontWeight: 600,
      color: "var(--text-2)",
      background: "rgba(255,255,255,0.5)",
      padding: "4px 10px",
      borderRadius: 999
    }
  }, teamModeMeta.e, " ", teamModeMeta.t)), (() => {
    // Goal progress is COMPUTED FROM THE HABIT MARKS (David) via teamGoalProgress —
    // current + each member's contribution. Falls back to the local team fields until
    // it loads (or pre-SQL). Mode-aware label: общий счёт / серия у каждого / гонка.
    var gpd = goalProg;
    var unit = gpd && gpd.unit || t.unit || "";
    var tgt = gpd && gpd.target || t.target || 0;
    var cur = gpd ? gpd.current : t.current != null ? t.current : Math.round((t.progress || 0) * tgt);
    var done = tgt > 0 && cur >= tgt;
    var gp = tgt > 0 ? Math.min(1, cur / tgt) : t.progress || 0;
    var gType = gpd && gpd.type || t.type || "collective";
    var modeLabel = {
      streak: "Серия у каждого",
      race: "Гонка — лидер",
      collective: "Общий счёт"
    }[gType] || "Общий счёт";
    var contrib = gpd && Array.isArray(gpd.members) ? gpd.members : [];
    // Optional XP STAKE → bank. Unlock-only: reaching the goal OPENS the payout (co-op: each
    // gets stake; race: the leader takes the whole bank). Per-member payout = ledger truth if
    // settled, else the rule (contrib[0] is the race leader — sorted by value desc).
    var isRace = gType === "race";
    var stake = gpd && gpd.stake || t.stake || 0;
    var bank = gpd && gpd.bank || stake * Math.max(1, contrib.length || members.length);
    var payFor = (m, i) => {
      if (!done || stake <= 0) return 0;
      if (settlements && settlements[m.id]) return settlements[m.id].xp || 0;
      return isRace ? i === 0 ? bank : 0 : stake;
    };
    var myPay = done && stake > 0 ? contrib.reduce((acc, m, i) => acc + (m.me ? payFor(m, i) : 0), 0) : 0;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 14
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: "var(--text-3)",
        textTransform: "uppercase",
        letterSpacing: 1,
        fontWeight: 600
      }
    }, done ? "Цель достигнута 🎉" : modeLabel), tgt > 0 && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 15,
        fontWeight: 700,
        color: "var(--text)"
      }
    }, cur, " / ", tgt, " ", unit)), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 9,
        background: "rgba(255,255,255,0.55)",
        borderRadius: 999,
        overflow: "hidden",
        marginTop: 6
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "block",
        height: "100%",
        width: gp * 100 + "%",
        background: done ? "linear-gradient(90deg,#FEDE34,#EF9F14)" : "var(--card-fill)",
        borderRadius: 999,
        transition: "width 0.6s ease"
      }
    })), tgt > 0 && !done && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: "var(--text-3)",
        marginTop: 6
      }
    }, "\u041E\u0441\u0442\u0430\u043B\u043E\u0441\u044C ", Math.max(0, tgt - cur), " ", unit, " \u2014 \u0437\u0430\u043A\u0440\u043E\u0435\u043C \u0432\u043C\u0435\u0441\u0442\u0435"), stake > 0 && !done && /*#__PURE__*/React.createElement("div", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        marginTop: 8,
        fontSize: 11.5,
        fontWeight: 600,
        color: "var(--text-2)",
        background: "rgba(255,255,255,0.5)",
        padding: "4px 11px",
        borderRadius: 999
      }
    }, /*#__PURE__*/React.createElement("span", null, "\uD83E\uDE99 \u0411\u0430\u043D\u043A ", bank, " XP"), /*#__PURE__*/React.createElement("span", {
      style: {
        color: "var(--text-3)",
        fontWeight: 500
      }
    }, "\xB7 ", isRace ? "лидер забирает всё" : `дойдём — каждому +${stake}`)), done && stake > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 11,
        padding: "11px 13px",
        borderRadius: 16,
        background: "linear-gradient(135deg,#FEDE34,#EF9F14)",
        color: "#0a0a0a"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 800,
        letterSpacing: "-0.2px"
      }
    }, "\uD83C\uDF89 \u0426\u0435\u043B\u044C \u0434\u043E\u0441\u0442\u0438\u0433\u043D\u0443\u0442\u0430!"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        fontWeight: 600,
        marginTop: 3,
        lineHeight: 1.4
      }
    }, isRace ? myPay > 0 ? `Ты лидер гонки — весь банк твой: +${myPay} XP 👑` : `Банк ${bank} XP забрал лидер гонки` : `Банк раскрыт — тебе +${myPay || stake} XP, и столько же каждому`)), contrib.length > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 7,
        marginTop: 11,
        flexWrap: "wrap"
      }
    }, contrib.map((m, i) => {
      var pay = payFor(m, i);
      return /*#__PURE__*/React.createElement("span", {
        key: m.id,
        style: {
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "rgba(255,255,255,0.55)",
          borderRadius: 999,
          padding: "3px 10px 3px 3px"
        }
      }, /*#__PURE__*/React.createElement(BuddyFaceLive, {
        avatar: m.avatar,
        name: m.name,
        size: 20
      }), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11.5,
          fontWeight: 600,
          color: "var(--text-2)"
        }
      }, m.me ? "Ты" : (m.name || "").split(" ")[0], " \xB7 ", m.value), pay > 0 && /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 10,
          fontWeight: 800,
          color: "#7a5300",
          background: "rgba(254,222,52,0.95)",
          borderRadius: 999,
          padding: "1px 6px"
        }
      }, "+", pay, isRace ? " 👑" : ""));
    })));
  })())), /*#__PURE__*/React.createElement(StatTrioLive, {
    isDark: isDark,
    card: {
      background: "var(--card)",
      boxShadow: "var(--card-shadow)",
      marginTop: 12,
      transform: "translateZ(0)"
    },
    items: [{
      l: "Привычки",
      v: teamHabits.length,
      suf: "",
      icon: /*#__PURE__*/React.createElement(I.ChartBar, {
        size: 14,
        color: "var(--text-4)"
      })
    }, {
      l: "Участники",
      v: _rosterLoading ? 0 : members.length,
      suf: "",
      icon: /*#__PURE__*/React.createElement(I.Users, {
        size: 14,
        color: "var(--text-4)"
      })
    }, {
      l: "Серия",
      v: 0,
      text: "—",
      icon: /*#__PURE__*/React.createElement(I.Flame, {
        size: 14,
        color: "var(--text-4)"
      })
    }]
  }), /*#__PURE__*/React.createElement("button", {
    "data-tour": "team-chat",
    onClick: () => {
      markChatRead();
      navigate("team-chat", {
        team: t
      });
    },
    className: "tap",
    style: {
      width: "100%",
      marginTop: 12,
      background: "var(--card)",
      border: 0,
      borderRadius: 22,
      padding: 14,
      boxShadow: "var(--card-shadow)",
      display: "flex",
      alignItems: "center",
      gap: 13,
      textAlign: "left",
      color: "var(--text)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 44,
      height: 44,
      borderRadius: 14,
      background: BOS_TILE_SHEEN + ", var(--surface-3)",
      boxShadow: bosTileGlass(isDark),
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
  }, "\u0427\u0430\u0442 \u043A\u043E\u043C\u0430\u043D\u0434\u044B"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-4)",
      marginTop: 2,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, _chatLive ? chatPeek ? chatPeek.last || "Пока пусто — напишите первыми" : "…" : "Пока пусто — напишите первыми")), _chatLive && chatPeek && chatPeek.unread > 0 ? /*#__PURE__*/React.createElement("span", {
    style: {
      background: "#FF3B30",
      color: "#fff",
      fontSize: 11,
      fontWeight: 700,
      borderRadius: 999,
      minWidth: 20,
      height: 20,
      padding: "0 6px",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, chatPeek.unread > 99 ? "99+" : chatPeek.unread) : null, /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 18,
    color: "var(--text-4)"
  })), main && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22,
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: "#FEDE34"
    }
  }), " \u0413\u043B\u0430\u0432\u043D\u0430\u044F \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0430"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: BOS_TILE_SHEEN + ", var(--card)",
      borderRadius: 22,
      padding: 18,
      marginTop: 8,
      color: "var(--text)",
      position: "relative",
      overflow: "hidden",
      boxShadow: bosTileGlass(isDark) + ", var(--card-shadow)",
      transform: "translateZ(0)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 48,
      height: 48,
      borderRadius: 14,
      background: BOS_TILE_SHEEN + ", " + (main.color ? main.color + "26" : "var(--surface-3)"),
      boxShadow: bosTileGlass(isDark),
      display: "grid",
      placeItems: "center",
      fontSize: 26,
      flexShrink: 0
    }
  }, bosIcon(main.emoji, 26, main.color)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 1.4,
      color: "var(--text-4)",
      display: "inline-flex",
      alignItems: "center",
      gap: 5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: "#EF9F14"
    }
  }), "\u042F\u043A\u043E\u0440\u044C \u043A\u043E\u043C\u0430\u043D\u0434\u044B"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      letterSpacing: "-0.4px",
      marginTop: 3,
      color: "var(--text)"
    }
  }, main.name))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: "var(--text-2)"
    }
  }, "\u0421\u0435\u0433\u043E\u0434\u043D\u044F"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--text-3)"
    }
  }, main.doneToday, " \u0438\u0437 ", main.total, " \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u043E\u0432 \u2713")), (() => {
    var denom = main.total || 1;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        height: 8,
        background: "var(--surface-3)",
        borderRadius: 999,
        overflow: "hidden",
        marginTop: 6
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "block",
        height: "100%",
        width: Math.min(100, main.doneToday / denom * 100) + "%",
        background: bosCellFill("#0a0a0a", 1),
        borderRadius: 999
      }
    }));
  })(), (() => {
    var todayK = new Date().toISOString().slice(0, 10);
    var doneSet = {};
    (mainProg || []).forEach(m => {
      if (m.days && m.days[todayK]) doneSet[m.id] = true;
    });
    var faces = Array.isArray(members) && members.length ? members : null;
    if (!faces) return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 5,
        marginTop: 12,
        flexWrap: "wrap"
      }
    }, Array.from({
      length: Math.max(0, main.total)
    }).map((_, i) => /*#__PURE__*/React.createElement("span", {
      key: i,
      style: {
        width: 22,
        height: 22,
        borderRadius: "50%",
        background: i < main.doneToday ? "#0a0a0a" : "var(--surface-3)",
        display: "grid",
        placeItems: "center",
        color: "#fff",
        fontSize: 11,
        fontWeight: 700
      }
    }, i < main.doneToday ? "✓" : "")));
    var FCAP = 10; // full-width card fits ~10 faces, then a «+N» disc for the rest
    var fShown = faces.slice(0, FCAP),
      fExtra = faces.length - fShown.length;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 7,
        marginTop: 12,
        flexWrap: "wrap"
      }
    }, fShown.map(m => {
      var did = !!doneSet[m.id] || m.id === meId && main.doneByMe;
      return /*#__PURE__*/React.createElement("span", {
        key: m.id,
        style: {
          position: "relative",
          display: "block",
          opacity: did ? 1 : 0.4
        }
      }, /*#__PURE__*/React.createElement(BuddyFaceLive, {
        avatar: m.avatar,
        name: m.name,
        size: 28
      }), did && /*#__PURE__*/React.createElement("span", {
        style: {
          position: "absolute",
          right: -1,
          bottom: -1,
          width: 13,
          height: 13,
          borderRadius: "50%",
          background: "#0a0a0a",
          color: "#fff",
          fontSize: 8,
          fontWeight: 800,
          display: "grid",
          placeItems: "center",
          boxShadow: "0 0 0 1.5px var(--card)"
        }
      }, "\u2713"));
    }), fExtra > 0 && /*#__PURE__*/React.createElement("span", {
      style: {
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: "rgba(0,0,0,0.16)",
        color: "var(--text)",
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: "-0.5px",
        display: "grid",
        placeItems: "center"
      }
    }, "+", fExtra));
  })(), _rosterLive && /*#__PURE__*/React.createElement("button", {
    onClick: () => toggleMyTeamHabit(main),
    className: "tap",
    style: {
      width: "100%",
      marginTop: 14,
      border: main.doneByMe ? "1.5px solid var(--line)" : 0,
      borderRadius: 999,
      padding: "11px 14px",
      fontSize: 14,
      fontWeight: 600,
      background: main.doneByMe ? "transparent" : "#0a0a0a",
      color: main.doneByMe ? "var(--text-2)" : "#fff"
    }
  }, main.doneByMe ? "✓ Сделано сегодня" : "Отметить сегодня"))), _rosterLive && main && mainProg && mainProg.length > 0 && /*#__PURE__*/React.createElement(PeopleMonthCalendarLive, {
    people: mainProg.map(m => ({
      name: m.me ? "Ты" : m.name,
      initials: m.me ? "Я" : (m.name || "У").charAt(0).toUpperCase(),
      color: "#FEDE34",
      you: !!m.me,
      avatar: m.avatar
    })),
    dayFrac: (pi, d, mi) => mainProg[pi] && mainProg[pi].days[_tCalKey(d, mi)] ? 1 : 0,
    label: "Кто отметил «" + main.name + "»"
  }), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, "\u041F\u0440\u0438\u0432\u044B\u0447\u043A\u0438 \u043A\u043E\u043C\u0430\u043D\u0434\u044B (", others.length, ")"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      marginTop: 8
    }
  }, teamHabits.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-4)",
      padding: "4px 2px 8px",
      lineHeight: 1.5
    }
  }, "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u043E\u0431\u0449\u0438\u0445 \u043F\u0440\u0438\u0432\u044B\u0447\u0435\u043A. \u0414\u043E\u0431\u0430\u0432\u044C \u043F\u0435\u0440\u0432\u0443\u044E \u2014 \u043E\u043D\u0430 \u0441\u0442\u0430\u043D\u0435\u0442 \u044F\u043A\u043E\u0440\u0435\u043C \u043A\u043E\u043C\u0430\u043D\u0434\u044B."), others.map((h, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      background: "var(--card)",
      borderRadius: 22,
      padding: 14,
      display: "flex",
      alignItems: "center",
      gap: 12,
      boxShadow: "var(--card-shadow)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 14,
      background: BOS_TILE_SHEEN + ", " + (h.color ? h.color + "26" : "var(--surface-3)"),
      boxShadow: bosTileGlass(isDark),
      display: "grid",
      placeItems: "center",
      fontSize: 22,
      flexShrink: 0
    }
  }, bosIcon(h.emoji, 22, h.color)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 600,
      color: "var(--text)"
    }
  }, h.name), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginTop: 7
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      maxWidth: 110,
      height: 5,
      borderRadius: 999,
      background: "var(--surface-3)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      height: "100%",
      width: Math.round((h.weekPct || 0) * 100) + "%",
      background: "#0a0a0a",
      borderRadius: 999
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-4)"
    }
  }, Math.round((h.weekPct || 0) * 100), "% \u0437\u0430 \u043D\u0435\u0434\u0435\u043B\u044E"))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "right",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: "var(--text)"
    }
  }, h.doneToday, "/", h.total), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1
    }
  }, "\u0441\u0435\u0433\u043E\u0434\u043D\u044F")), _rosterLive && /*#__PURE__*/React.createElement("button", {
    onClick: () => toggleMyTeamHabit(h),
    className: "check-btn tap " + (h.doneByMe ? "" : "unchecked"),
    "aria-label": "\u041E\u0442\u043C\u0435\u0442\u0438\u0442\u044C",
    style: {
      flexShrink: 0,
      width: 34,
      height: 34,
      "--check-color": "#0a0a0a"
    }
  }, h.doneByMe && /*#__PURE__*/React.createElement(I.Check, {
    size: 16,
    color: "#fff",
    strokeWidth: 3
  })))), /*#__PURE__*/React.createElement("button", {
    onClick: openAddHabit,
    className: "tap",
    style: {
      background: "transparent",
      border: "1px dashed rgba(0,0,0,0.18)",
      borderRadius: 22,
      padding: 14,
      color: "var(--text-3)",
      fontSize: 14,
      fontWeight: 500
    }
  }, "+ \u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0443 \u043A\u043E\u043C\u0430\u043D\u0434\u044B")), _isOwner && pending.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, "\u0417\u0430\u044F\u0432\u043A\u0438 \u043D\u0430 \u0432\u0441\u0442\u0443\u043F\u043B\u0435\u043D\u0438\u0435 (", pending.length, ")"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      marginTop: 8
    }
  }, pending.map((p, pi) => /*#__PURE__*/React.createElement("div", {
    key: p.id,
    style: {
      background: "var(--card)",
      borderRadius: 22,
      boxShadow: "var(--card-shadow)",
      padding: 12,
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(BuddyFaceLive, {
    avatar: p.avatar,
    name: p.name,
    size: 40
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 600,
      color: "var(--text)"
    }
  }, p.name || "Гость"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-4)",
      marginTop: 1
    }
  }, "\u0445\u043E\u0447\u0435\u0442 \u0432\u0441\u0442\u0443\u043F\u0438\u0442\u044C")), /*#__PURE__*/React.createElement("button", {
    onClick: () => approveReq(p.id),
    className: "tap",
    style: {
      flexShrink: 0,
      background: "#0a0a0a",
      color: "#fff",
      border: 0,
      borderRadius: 999,
      padding: "8px 14px",
      fontSize: 13,
      fontWeight: 600
    }
  }, "\u041F\u0440\u0438\u043D\u044F\u0442\u044C"), /*#__PURE__*/React.createElement("button", {
    onClick: () => rejectReq(p.id),
    className: "tap",
    "aria-label": "\u041E\u0442\u043A\u043B\u043E\u043D\u0438\u0442\u044C",
    style: {
      flexShrink: 0,
      background: "var(--surface-3)",
      color: "var(--text-3)",
      border: 0,
      borderRadius: 999,
      width: 34,
      height: 34,
      fontSize: 16,
      lineHeight: 1
    }
  }, "\u2715"))))), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, "\u0423\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0438", _rosterLoading ? "" : " (" + members.length + ")"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      marginTop: 8
    }
  }, _rosterLoading && [0, 1].map(i => /*#__PURE__*/React.createElement("div", {
    key: "sk" + i,
    style: {
      background: "var(--card)",
      borderRadius: 22,
      boxShadow: "var(--card-shadow)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 12,
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bos-skel",
    style: {
      width: 40,
      height: 40,
      borderRadius: "50%"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bos-skel",
    style: {
      display: "block",
      width: "42%",
      height: 12,
      borderRadius: 6
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "bos-skel",
    style: {
      display: "block",
      width: "26%",
      height: 10,
      borderRadius: 6,
      marginTop: 7
    }
  }))))), !_rosterLoading && ranked.map((m, i) => {
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        background: "var(--card)",
        borderRadius: 22,
        boxShadow: "var(--card-shadow)",
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: "100%",
        padding: 12,
        display: "flex",
        alignItems: "center",
        gap: 12,
        textAlign: "left",
        color: "var(--text)"
      }
    }, /*#__PURE__*/React.createElement(BuddyFaceLive, {
      avatar: m.avatar,
      name: m.name,
      size: 40
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15,
        fontWeight: 600,
        color: "var(--text)"
      }
    }, m.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "var(--text-4)",
        marginTop: 2
      }
    }, m.role === "owner" ? "Создатель команды" : "Участник"))));
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => bosConfirmExitTeam({
      app,
      team: t,
      isOwner: _isOwner,
      navigate,
      openSheet
    }),
    className: "tap",
    style: {
      width: "100%",
      marginTop: 26,
      background: "transparent",
      border: 0,
      color: "var(--accent-red)",
      padding: 14,
      fontSize: 15,
      fontWeight: 600,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 7
    }
  }, _isOwner ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(I.Trash, {
    size: 17
  }), " \u0423\u0434\u0430\u043B\u0438\u0442\u044C \u043A\u043E\u043C\u0430\u043D\u0434\u0443") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(I.Logout, {
    size: 17
  }), " \u041F\u043E\u043A\u0438\u043D\u0443\u0442\u044C \u043A\u043E\u043C\u0430\u043D\u0434\u0443")));
}

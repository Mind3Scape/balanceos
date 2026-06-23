/* HOME — theme-aware. Streaks, AI bell, customizable widgets, deeper hierarchy */
var {
  useState: useHomeState
} = React;

/* Detect dark/light theme from wrapper class */
function useThemeFlag(ref) {
  var [isDark, setIsDark] = React.useState(false);
  React.useEffect(() => {
    var el = ref.current;
    if (!el) return;
    var n = el.parentElement;
    while (n && !n.classList.contains("theme-light") && !n.classList.contains("theme-dark")) n = n.parentElement;
    setIsDark(!!(n && n.classList.contains("theme-dark")));
  }, []);
  return isDark;
}

/* Balance Wheel — 8-axis radar of life areas with iOS-style icons + zone colors */
function zoneColor(v) {
  if (v >= 0.70) return "#34C759"; // зелёная зона — в балансе
  if (v >= 0.52) return "#FFC400"; // нейтрально
  return "#FF8A3D"; // оранжевая зона — дефицит, выпирает
}
function BalanceWheel({
  size = 122,
  isDark = false
}) {
  var uid = React.useMemo(() => "bw" + Math.random().toString(36).slice(2, 7), []);
  var app = useApp ? useApp() : null;
  var enabled = app?.wheelSpheres && app.wheelSpheres.length >= 3 ? app.wheelSpheres : window.DEFAULT_SPHERES || [];
  var axes = (window.ALL_SPHERES || []).filter(s => enabled.includes(s.id));
  var cx = size / 2,
    cy = size / 2,
    r = size * 0.40;
  var pad = 30;
  var W = size + pad * 2;
  var ang = i => i / axes.length * Math.PI * 2 - Math.PI / 2;
  var pt = (i, v, rad = r) => [cx + Math.cos(ang(i)) * rad * v, cy + Math.sin(ang(i)) * rad * v];
  var poly = axes.map((a, i) => {
    var [x, y] = pt(i, a.v);
    return (i ? "L" : "M") + x.toFixed(1) + "," + y.toFixed(1);
  }).join(" ") + "Z";
  var grid = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.055)";
  var chipFill = isDark ? "#1d1d20" : "#ffffff";
  return /*#__PURE__*/React.createElement("svg", {
    width: W,
    height: W,
    viewBox: `${-pad} ${-pad} ${W} ${W}`,
    style: {
      overflow: "visible",
      display: "block"
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("radialGradient", {
    id: uid + "-fill",
    cx: "50%",
    cy: "46%",
    r: "60%"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#FFD64A",
    stopOpacity: "0.46"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#FF9F45",
    stopOpacity: "0.12"
  }))), /*#__PURE__*/React.createElement("circle", {
    cx: cx,
    cy: cy,
    r: r,
    fill: "none",
    stroke: grid,
    strokeWidth: "1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: cx,
    cy: cy,
    r: r * 0.7,
    fill: "none",
    stroke: isDark ? "rgba(52,199,89,0.38)" : "rgba(52,199,89,0.34)",
    strokeWidth: "1",
    strokeDasharray: "2.5 4.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: poly,
    fill: `url(#${uid}-fill)`,
    stroke: "#FFB020",
    strokeWidth: "1.7",
    strokeLinejoin: "round"
  }), axes.map((a, i) => {
    var [x, y] = pt(i, a.v);
    return /*#__PURE__*/React.createElement("circle", {
      key: i,
      cx: x,
      cy: y,
      r: "2.5",
      fill: zoneColor(a.v),
      stroke: chipFill,
      strokeWidth: "1.2"
    });
  }), axes.map((a, i) => {
    var [ox, oy] = pt(i, 1.26);
    return /*#__PURE__*/React.createElement("text", {
      key: i,
      x: ox,
      y: oy,
      fontSize: "14",
      textAnchor: "middle",
      dominantBaseline: "central"
    }, a.e);
  }));
}

/* Hero swipe deck — page 1: today's reading, page 2: Balance Wheel */
function HomeHeroSwipe({
  navigate,
  doneCount,
  totalCount,
  ringPct,
  isDark
}) {
  var [page, setPage] = useHomeState(0);
  // Ring grows from 0 on appear (and eases to its new value on change).
  var [ringShown, setRingShown] = useHomeState(0);
  React.useEffect(() => {
    var t = setTimeout(() => setRingShown(ringPct), 80);
    return () => clearTimeout(t);
  }, [ringPct]);
  // Stable global handle so the guided tour can flip this deck (e.g. to the
  // balance wheel) — always calls the latest setPage via a ref.
  var setPageRef = React.useRef(setPage);
  setPageRef.current = setPage;
  React.useEffect(() => {
    window.__bosHeroPage = p => setPageRef.current(p);
    return () => {
      if (window.__bosHeroPage) window.__bosHeroPage = null;
    };
  }, []);
  var heroApp = useApp ? useApp() : null;
  // The avatar ring + the glow under it follow the current state orb's colour.
  var mood = heroApp?.mood;
  var moodTint = mood && typeof tintFromMood === "function" ? tintFromMood(mood.c) : null;
  var fresh = heroApp?.mode === "fresh";
  var enabledW = heroApp?.wheelSpheres && heroApp.wheelSpheres.length >= 3 ? heroApp.wheelSpheres : window.DEFAULT_SPHERES || [];
  var wAxes = (window.ALL_SPHERES || []).filter(s => enabledW.includes(s.id));
  var avgBalance = wAxes.length ? Math.round(wAxes.reduce((s, a) => s + a.v, 0) / wAxes.length * 100) : 0;
  var weakSpheres = [...wAxes].sort((a, b) => a.v - b.v).slice(0, 2);
  var startX = React.useRef(null);
  var onTouchStart = e => {
    startX.current = e.touches[0].clientX;
  };
  var onTouchEnd = e => {
    if (startX.current == null) return;
    var dx = e.changedTouches[0].clientX - startX.current;
    if (dx < -40 && page < 1) setPage(page + 1);
    if (dx > 40 && page > 0) setPage(page - 1);
    startX.current = null;
  };
  var chipBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.85)";
  var chipBd = isDark ? "0" : "1px solid rgba(0,0,0,0.05)";
  var cardBg = isDark ? "linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)" : "linear-gradient(160deg, #ffffff 0%, #f5f5f5 100%)";
  var cardBd = isDark ? "0" : "1px solid rgba(0,0,0,0.04)";
  var ringBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  var dotIdle = isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.18)";
  var dotActive = isDark ? "#fff" : "#0a0a0a";
  // Demo "Balance AI" daily brief — one short line that follows the user's
  // current state (like the orb) + the day's progress. Replaces the old quote.
  var AI_BRIEF = {
    "Энергия": "Энергии много — берись за самое важное сейчас.",
    "Радость": "Ты в ресурсе — отличный день, чтобы закрыть серию.",
    "Спокойствие": "Спокойствие — твоё время для глубокого чтения.",
    "Тревога": "Начни с двух минут дыхания — и день станет легче.",
    "Упадок": "Сделай одно маленькое дело — этого сегодня достаточно.",
    "Усталость": "Сбавь темп: закрой одну привычку — и довольно."
  };
  var aiBrief = totalCount && doneCount >= totalCount ? "День закрыт — ты в потоке. Так держи ритм." : AI_BRIEF[mood && mood.t] || "Чтение легче даётся вечером — оставь его на потом.";
  var _pages = [/* Page 1: fresh → compact AI-hints + avatar; demo → quote + avatar + chips */
  fresh ? /*#__PURE__*/React.createElement("div", {
    key: "hints",
    style: {
      position: "relative",
      padding: 16,
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 13,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1.2
    }
  }, "\u041F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0438 \u0418\u0418"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-2)",
      marginTop: 3,
      lineHeight: 1.4,
      letterSpacing: "-0.1px"
    }
  }, "\u041F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0438 \u0441\u0442\u0430\u043D\u0443\u0442 \u0442\u043E\u0447\u043D\u0435\u0435, \u043A\u043E\u0433\u0434\u0430 \u0440\u0430\u0441\u0441\u043A\u0430\u0436\u0435\u0448\u044C \u043E \u0441\u0435\u0431\u0435.")), /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("profile"),
    className: "tap",
    title: "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043F\u0440\u043E\u0444\u0438\u043B\u044C",
    style: {
      flexShrink: 0,
      position: "relative",
      width: 54,
      height: 54,
      background: "transparent",
      border: 0,
      padding: 0,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "54",
    height: "54",
    viewBox: "0 0 54 54",
    style: {
      position: "absolute",
      inset: 0,
      transform: "rotate(-90deg)"
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "27",
    cy: "27",
    r: "23",
    stroke: ringBg,
    strokeWidth: "3",
    fill: "none"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "27",
    cy: "27",
    r: "23",
    stroke: "#FEDE34",
    strokeWidth: "3",
    fill: "none",
    strokeLinecap: "round",
    strokeDasharray: 2 * Math.PI * 23,
    strokeDashoffset: 2 * Math.PI * 23 * (1 - ringShown),
    style: {
      transition: "stroke-dashoffset 0.7s cubic-bezier(0.22,0.61,0.36,1)"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 5,
      borderRadius: "50%",
      background: `url(./assets/sphere.png) center/cover no-repeat, radial-gradient(circle at 30% 30%, ${moodTint ? moodTint[0] : "#ffd97a"}, ${moodTint ? moodTint[2] : "#d97757"})`,
      boxShadow: `inset -3px -5px 12px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.08)${moodTint ? `, 0 0 13px ${moodTint[1]}55` : ""}`
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6
    }
  }, [{
    i: "✨",
    t: "ИИ: спланируй день"
  }, {
    i: "🧭",
    t: "С чего начать"
  }, {
    i: "🧘🏼‍♀️",
    t: "Медитация 5 мин"
  }, {
    i: "🩺",
    t: "Связать здоровье"
  }].map((c, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => navigate("ai"),
    className: "tap",
    style: {
      padding: "6px 12px",
      fontSize: 12,
      color: "var(--text-2)",
      background: chipBg,
      border: chipBd,
      borderRadius: 999,
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", null, c.i), c.t)))) : /*#__PURE__*/React.createElement("div", {
    key: "quote",
    style: {
      position: "relative",
      height: "100%",
      padding: 18,
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      alignItems: "flex-start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1.2,
      display: "inline-flex",
      alignItems: "center",
      gap: 5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#E0A500"
    }
  }, "\u2726"), " \u0421\u043E\u0432\u0435\u0442 \u0434\u043D\u044F"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: "var(--text-2)",
      marginTop: 5,
      lineHeight: 1.42,
      letterSpacing: "-0.1px"
    }
  }, aiBrief)), /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("profile"),
    className: "tap",
    title: "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043F\u0440\u043E\u0444\u0438\u043B\u044C",
    style: {
      flexShrink: 0,
      position: "relative",
      width: 72,
      height: 72,
      background: "transparent",
      border: 0,
      padding: 0,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "72",
    height: "72",
    viewBox: "0 0 72 72",
    style: {
      position: "absolute",
      inset: 0,
      transform: "rotate(-90deg)"
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "36",
    cy: "36",
    r: "32",
    stroke: ringBg,
    strokeWidth: "3.5",
    fill: "none"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "36",
    cy: "36",
    r: "32",
    stroke: "#FEDE34",
    strokeWidth: "3.5",
    fill: "none",
    strokeLinecap: "round",
    strokeDasharray: 2 * Math.PI * 32,
    strokeDashoffset: 2 * Math.PI * 32 * (1 - ringShown),
    style: {
      transition: "stroke-dashoffset 0.7s cubic-bezier(0.22,0.61,0.36,1)"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 6,
      borderRadius: "50%",
      background: `url(./assets/sphere.png) center/cover no-repeat, radial-gradient(circle at 30% 30%, ${moodTint ? moodTint[0] : "#ffd97a"}, ${moodTint ? moodTint[2] : "#d97757"})`,
      boxShadow: `inset -3px -5px 12px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.08)${moodTint ? `, 0 0 13px ${moodTint[1]}55` : ""}`
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      bottom: -2,
      right: -4,
      background: "#0a0a0a",
      color: "#FEDE34",
      fontSize: 9,
      fontWeight: 700,
      padding: "2px 6px",
      borderRadius: 999,
      border: "2px solid " + (isDark ? "#0a0a0a" : "#fff")
    }
  }, doneCount, "/", totalCount))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6,
      marginTop: "auto",
      paddingTop: 12,
      paddingBottom: 14
    }
  }, [{
    i: "✨",
    t: "ИИ: спланируй день"
  }, {
    i: "🔮",
    t: "Познай себя"
  }, {
    i: "🧘🏼‍♀️",
    t: "Медитация 5 мин"
  }, {
    i: "📖",
    t: "Открыть дневник"
  }].map((c, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => navigate("ai"),
    className: "tap",
    style: {
      padding: "6px 12px",
      fontSize: 12,
      color: "var(--text-2)",
      background: chipBg,
      border: chipBd,
      borderRadius: 999,
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", null, c.i), c.t)))),
  /*#__PURE__*/
  /* Page 2: Balance — clean radar (kept) + per-sphere breakdown that fills the
     space and shows what each sphere is + its % level. Original card height. */
  React.createElement("div", {
    key: "wheel",
    "data-tour": "balance-wheel",
    style: {
      position: "relative",
      height: "100%",
      padding: "14px 16px 14px 8px",
      boxSizing: "border-box",
      display: "flex",
      gap: 6,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(BalanceWheel, {
    size: 112,
    isDark: isDark
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1.2
    }
  }, "\u0411\u0430\u043B\u0430\u043D\u0441 \u0436\u0438\u0437\u043D\u0438"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 20,
      color: "var(--text)",
      fontWeight: 700,
      letterSpacing: "-0.6px",
      lineHeight: 1
    }
  }, /*#__PURE__*/React.createElement(CountUp, {
    value: avgBalance
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: "var(--text-4)"
    }
  }, "%"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5
    }
  }, wAxes.map((a, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 7
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      width: 15,
      textAlign: "center",
      flexShrink: 0
    }
  }, a.e), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      width: 48,
      flexShrink: 0,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, a.l), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      height: 5,
      borderRadius: 999,
      background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.055)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      height: "100%",
      width: Math.round(a.v * 100) + "%",
      borderRadius: 999,
      background: zoneColor(a.v)
    }
  })))))))];
  // Fresh new user: only the quote/avatar page (no balance wheel until there's data).
  var pages = fresh ? _pages.slice(0, 1) : _pages;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: cardBg,
      border: cardBd,
      borderRadius: 28,
      position: "relative",
      overflow: "hidden",
      boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
    },
    onTouchStart: onTouchStart,
    onTouchEnd: onTouchEnd
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      width: "200%",
      transform: `translateX(${-page * 50}%)`,
      transition: "transform 0.45s cubic-bezier(0.22,0.61,0.36,1)",
      minHeight: fresh ? 128 : 196
    }
  }, pages.map((p, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      width: "50%",
      flexShrink: 0
    }
  }, p))), pages.length > 1 && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      bottom: 14,
      left: 0,
      right: 0,
      display: "flex",
      justifyContent: "center",
      gap: 5
    }
  }, pages.map((_, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => setPage(i),
    className: "tap",
    style: {
      width: i === page ? 18 : 6,
      height: 6,
      borderRadius: 999,
      background: i === page ? dotActive : dotIdle,
      border: 0,
      transition: "all 0.3s",
      padding: 0
    }
  }))));
}
function HomeScreen() {
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
  var [tab, setTab] = useHomeState("habits");
  // Habits + goals come from the shared app store, so a check here shows up
  // on the Habits tab too (and vice versa).
  var habits = app?.habits || [];
  var goals = app?.goals || [];
  var teams = app?.teams || [];
  var userName = app?.userName ?? "";
  var toggle = app?.toggleHabit || (() => {});
  var remove = app?.removeHabit || (() => {});
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
  var dayStreak = app?.mode === "fresh" ? 0 : 27;

  // Celebration when a habit gets completed: float +XP near the avatar ring,
  // sparkle burst when the whole day closes (doneCount reaches total).
  var [celebrate, setCelebrate] = React.useState(null);
  var prevDoneRef = React.useRef(doneCount);
  React.useEffect(() => {
    if (doneCount > prevDoneRef.current) {
      var full = totalCount > 0 && doneCount === totalCount;
      setCelebrate({
        xp: full ? totalCount * 10 + 30 : 10,
        full,
        key: Date.now() + ":" + doneCount
      });
      if (window.tgHaptic) {
        try {
          window.tgHaptic(full ? "heavy" : "light");
        } catch (e) {}
      }
      var t = window.setTimeout(() => setCelebrate(null), full ? 2000 : 1200);
      prevDoneRef.current = doneCount;
      return () => window.clearTimeout(t);
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
  }, "\u0412\u0442\u043E\u0440\u043D\u0438\u043A \xB7 28 \u0430\u043F\u0440\u0435\u043B\u044F"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 24,
      fontWeight: 800,
      color: "var(--text)",
      letterSpacing: "-0.6px",
      marginTop: 2,
      fontFamily: "var(--bos-title-font)"
    }
  }, userName ? "Доброе утро, " + userName : "Доброе утро 👋")), /*#__PURE__*/React.createElement("button", {
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
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 8,
      right: 10,
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
  }, /*#__PURE__*/React.createElement(HomeHeroSwipe, {
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
  }))), widgets.mood !== false && mood && /*#__PURE__*/React.createElement(MoodWidget, {
    mood: mood,
    app: app,
    isDark: isDark,
    navigate: navigate
  }), (widgets.streak !== false || widgets.level !== false) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: widgets.streak !== false && widgets.level !== false ? "1.2fr 1fr 1fr" : widgets.streak !== false || widgets.level !== false ? "1fr 1fr" : "1fr",
      gap: 8,
      marginTop: 12
    }
  }, widgets.streak !== false && /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("history"),
    className: "tap",
    style: {
      background: cardBg,
      border: cardBorder,
      borderRadius: 18,
      padding: "12px 14px",
      textAlign: "left",
      display: "flex",
      flexDirection: "column",
      gap: 6,
      boxShadow: cardShadow,
      color: "var(--text)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16
    }
  }, "\uD83D\uDD25"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1,
      fontWeight: 600
    }
  }, "\u0421\u0435\u0440\u0438\u044F")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 700,
      color: "var(--text)",
      letterSpacing: "-0.5px"
    }
  }, /*#__PURE__*/React.createElement(CountUp, {
    value: dayStreak
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: "var(--text-4)"
    }
  }, " \u0434\u043D."))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: cardBg,
      border: cardBorder,
      borderRadius: 18,
      padding: "12px 14px",
      display: "flex",
      flexDirection: "column",
      gap: 6,
      boxShadow: cardShadow,
      color: "var(--text)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1,
      fontWeight: 600
    }
  }, "\u0421\u0435\u0433\u043E\u0434\u043D\u044F"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 22,
      fontWeight: 700,
      letterSpacing: "-0.5px"
    }
  }, /*#__PURE__*/React.createElement(CountUp, {
    value: doneCount
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--text-4)"
    }
  }, "/ ", totalCount))), widgets.level !== false && /*#__PURE__*/React.createElement("button", {
    "data-tour": "level",
    onClick: () => navigate("levels"),
    className: "tap",
    style: {
      background: "linear-gradient(135deg,#FEDE34,#EF9F14)",
      border: 0,
      borderRadius: 18,
      padding: "12px 14px",
      textAlign: "left",
      display: "flex",
      flexDirection: "column",
      gap: 6,
      color: "#0a0a0a"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 1,
      fontWeight: 700,
      opacity: 0.7
    }
  }, "\u0423\u0440\u043E\u0432\u0435\u043D\u044C"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 22,
      fontWeight: 800,
      letterSpacing: "-0.5px"
    }
  }, /*#__PURE__*/React.createElement(CountUp, {
    value: app?.mode === "fresh" ? 1 : 7
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      opacity: 0.62,
      fontWeight: 700
    }
  }, app?.mode === "fresh" ? "0 XP" : "1 240 XP")), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      height: 4,
      borderRadius: 999,
      background: "rgba(0,0,0,0.16)",
      overflow: "hidden",
      marginTop: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      height: "100%",
      width: (app?.mode === "fresh" ? 4 : 83) + "%",
      borderRadius: 999,
      background: "rgba(0,0,0,0.82)"
    }
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
      borderRadius: 18,
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
  }, "28 \u0430\u043F\u0440")), /*#__PURE__*/React.createElement(I.Calendar, {
    size: 28,
    color: isDark ? "rgba(255,255,255,0.7)" : "#787878",
    strokeWidth: 1.5
  })), widgets.team !== false && /*#__PURE__*/React.createElement("button", {
    className: "tap",
    onClick: () => navigate("community"),
    style: {
      background: cardBg,
      border: cardBorder,
      borderRadius: 18,
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
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "tab-pill",
    style: {
      background: isDark ? "rgba(255,255,255,0.06)" : "#e8e8e8"
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "tap " + (tab === "habits" ? "active" : ""),
    onClick: () => setTab("habits")
  }, "\u041F\u0440\u0438\u0432\u044B\u0447\u043A\u0438"), /*#__PURE__*/React.createElement("button", {
    className: "tap " + (tab === "goals" ? "active" : ""),
    onClick: () => setTab("goals")
  }, "\u0426\u0435\u043B\u0438"))), tab === "habits" ? habits.length === 0 ? /*#__PURE__*/React.createElement("button", {
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
      borderRadius: 18,
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
      onAction: () => openSheet(/*#__PURE__*/React.createElement(ShareHabitSheet, {
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
      borderRadius: 12,
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
      color: "var(--text-2)",
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
  }), /*#__PURE__*/React.createElement("button", {
    className: "check-btn " + (h.done ? "" : "unchecked"),
    "data-no-haptic": true,
    onClick: e => {
      e.stopPropagation();
      toggle(h.id);
    }
  }, h.done && /*#__PURE__*/React.createElement(I.Check, {
    size: 18,
    strokeWidth: 2.5,
    color: "#fff"
  }))))))) : goals.length === 0 ? /*#__PURE__*/React.createElement("button", {
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
      className: "tap",
      onClick: () => navigate("goal-detail", {
        goal: g,
        from: "home"
      }),
      style: {
        background: cardBg,
        border: cardBorder,
        borderRadius: 18,
        padding: 14,
        boxShadow: cardShadow,
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
        borderRadius: 11,
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
        fontSize: 15,
        color: "var(--text-2)",
        fontWeight: 500
      }
    }, g.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "var(--text-4)"
      }
    }, g.current, " / ", g.target, " ", g.unit)), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14,
        fontWeight: 600,
        color: "var(--text-2)"
      }
    }, Math.round(pct * 100), "%")), /*#__PURE__*/React.createElement("div", {
      className: "bos-progress"
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: pct * 100 + "%"
      }
    })));
  })), app?.mode === "fresh" && /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("guide"),
    className: "tap",
    "data-no-haptic": true,
    style: {
      marginTop: 12,
      width: "100%",
      textAlign: "left",
      border: isDark ? "0" : "1px solid rgba(70,120,190,0.14)",
      borderRadius: 22,
      padding: "15px 16px",
      background: isDark ? "linear-gradient(135deg, rgba(122,164,208,0.20), rgba(122,164,208,0.05))" : "linear-gradient(135deg, #eef3fc 0%, #dfe9f8 100%)",
      color: "var(--text)",
      display: "flex",
      alignItems: "center",
      gap: 13
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 44,
      height: 44,
      borderRadius: 14,
      background: isDark ? "rgba(255,255,255,0.08)" : "#fff",
      display: "grid",
      placeItems: "center",
      flexShrink: 0,
      fontSize: 22,
      boxShadow: isDark ? "none" : "0 2px 8px rgba(120,150,200,0.2)"
    }
  }, "\uD83E\uDDED"), /*#__PURE__*/React.createElement("div", {
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
  }, "\u0427\u0442\u043E \u0434\u0430\u043B\u044C\u0448\u0435?"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-3)",
      marginTop: 2,
      lineHeight: 1.4
    }
  }, "\u041A\u043E\u043C\u0430\u043D\u0434\u044B, \u0442\u0440\u0435\u043D\u0438\u043D\u0433\u0438, \u0446\u0435\u043B\u0438 \u2014 \u043E\u0431\u043E \u0432\u0441\u0451\u043C \u043A\u043E\u0440\u043E\u0442\u043A\u043E \u043D\u0430 \u043E\u0434\u043D\u043E\u0439 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435")), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 20,
    color: "var(--text-4)"
  })), widgets.energy !== false && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      padding: 16,
      background: cardBg,
      border: cardBorder,
      borderRadius: 22,
      boxShadow: cardShadow,
      color: "var(--text)",
      display: "flex",
      alignItems: "center",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: 66,
      height: 66,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 66 66",
    style: {
      width: 66,
      height: 66,
      transform: "rotate(-90deg)"
    },
    "aria-hidden": true
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "33",
    cy: "33",
    r: "28",
    fill: "none",
    stroke: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.07)",
    strokeWidth: "7"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "33",
    cy: "33",
    r: "28",
    fill: "none",
    stroke: "url(#bosEnergyGrad)",
    strokeWidth: "7",
    strokeLinecap: "round",
    strokeDasharray: 2 * Math.PI * 28,
    strokeDashoffset: 2 * Math.PI * 28 * (1 - Math.max(0.04, ringPct)),
    style: {
      transition: "stroke-dashoffset 0.9s cubic-bezier(0.32,0.72,0,1)"
    }
  }), /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: "bosEnergyGrad",
    x1: "0",
    y1: "0",
    x2: "1",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0",
    stopColor: "#FFB02E"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "1",
    stopColor: "#FF7A59"
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      display: "grid",
      placeItems: "center",
      fontSize: 17,
      fontWeight: 700,
      color: "var(--text)"
    }
  }, /*#__PURE__*/React.createElement(CountUp, {
    value: Math.round(ringPct * 100)
  }), "%")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-4)",
      letterSpacing: 1.2,
      textTransform: "uppercase",
      fontWeight: 600
    }
  }, "XP \u0441\u0435\u0433\u043E\u0434\u043D\u044F"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 27,
      fontWeight: 700,
      marginTop: 1,
      letterSpacing: "-0.5px",
      color: "var(--text)"
    }
  }, "+", /*#__PURE__*/React.createElement(CountUp, {
    value: xpEarnedToday
  }), " ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: "var(--text-4)"
    }
  }, "XP")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-4)",
      lineHeight: 1.4,
      marginTop: 3
    }
  }, totalCount === 0 ? "Заведи привычку — и начни копить XP сегодня." : dayAllDone ? "Идеальный день! Все привычки закрыты — +30 XP сверху." : /*#__PURE__*/React.createElement(React.Fragment, null, "\u0415\u0449\u0451 ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: "var(--text-2)"
    }
  }, "+", leftCount * XP_PER_HABIT, " XP"), " \u0437\u0430 ", leftCount, " ", ruHab(leftCount), ". \u0410 \u0437\u0430\u043A\u0440\u043E\u0435\u0448\u044C \u0432\u0441\u0435 \u2014 \u0435\u0449\u0451 ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: "var(--text-2)"
    }
  }, "+30"), " \u0437\u0430 \u0438\u0434\u0435\u0430\u043B\u044C\u043D\u044B\u0439 \u0434\u0435\u043D\u044C.")))), /*#__PURE__*/React.createElement("button", {
    "data-tour": "share-app",
    className: "tap",
    onClick: () => openSheet(/*#__PURE__*/React.createElement(ShareAppSheet, {
      dark: isDark
    })),
    style: {
      marginTop: 12,
      width: "100%",
      background: cardBg,
      border: cardBorder,
      borderRadius: 22,
      padding: "16px 18px",
      boxShadow: cardShadow,
      color: "var(--text)",
      display: "flex",
      alignItems: "center",
      gap: 14,
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 44,
      height: 44,
      borderRadius: 14,
      background: iconBg,
      display: "grid",
      placeItems: "center",
      flexShrink: 0,
      color: "var(--text-2)"
    }
  }, /*#__PURE__*/React.createElement(I.Share, {
    size: 20
  })), /*#__PURE__*/React.createElement("div", {
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
  }, "\u041F\u043E\u0434\u0435\u043B\u0438\u0442\u044C\u0441\u044F \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435\u043C"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-4)",
      marginTop: 2
    }
  }, "\u041F\u043E\u0437\u043E\u0432\u0438 \u0434\u0440\u0443\u0437\u0435\u0439 \u2014 \u0432\u043C\u0435\u0441\u0442\u0435 \u0432 \u0431\u0430\u043B\u0430\u043D\u0441\u0435")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexShrink: 0
    }
  }, [{
    c: "#e8c8a8",
    i: "А"
  }, {
    c: "#a8d4e8",
    i: "В"
  }, {
    c: "#d4b8e8",
    i: "Л"
  }].map((p, idx) => /*#__PURE__*/React.createElement("span", {
    key: idx,
    style: {
      width: 30,
      height: 30,
      borderRadius: "50%",
      background: p.c,
      border: "2px solid " + (isDark ? "#0a0a0a" : "#fff"),
      marginLeft: idx ? -10 : 0,
      display: "grid",
      placeItems: "center",
      fontSize: 12,
      fontWeight: 700,
      color: "rgba(0,0,0,0.55)"
    }
  }, p.i)))));
}

/* ── Share-the-app sheet (slides up from the home "Поделиться приложением") ── */
function ShareAppSheet({
  dark = false
}) {
  var {
    close
  } = useSheet();
  var app = typeof useApp === "function" ? useApp() : null;
  var invited = app?.mode === "demo" ? 2 : 0; // demo: 1 away from the 3-milestone
  var [copied, setCopied] = useHomeState(false);
  // The real, live web app — works on any phone, also opens fine from Telegram.
  var APP_URL = "https://mind3scape.github.io/balanceos";
  var copyLink = () => {
    try {
      navigator.clipboard.writeText(APP_URL);
    } catch (e) {}
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
    if (window.tgHaptic) {
      try {
        window.tgHaptic("light");
      } catch (e) {}
    }
  };
  var shareLink = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "BalanceOS",
          text: "Держим баланс вместе — BalanceOS",
          url: APP_URL
        });
        return;
      }
    } catch (e) {
      return;
    }
    copyLink();
  };
  var C = dark ? {
    text: "#fff",
    sub: "rgba(255,255,255,0.5)",
    tile: "rgba(255,255,255,0.08)",
    line: "rgba(255,255,255,0.09)"
  } : {
    text: "#0a0a0a",
    sub: "rgba(0,0,0,0.5)",
    tile: "#f1f1f3",
    line: "rgba(0,0,0,0.06)"
  };
  var friends = [{
    name: "Катя",
    i: "К",
    c: "#f0c8a8"
  }, {
    name: "Дима",
    i: "Д",
    c: "#a8c0e8"
  }, {
    name: "Соня",
    i: "С",
    c: "#e8b8d4"
  }, {
    name: "Ник",
    i: "Н",
    c: "#b8e8c8"
  }, {
    name: "Аля",
    i: "А",
    c: "#d4c8e8"
  }];
  var targets = [{
    e: "💬",
    t: "Сообщения"
  }, {
    e: "🔗",
    t: "Ссылка"
  }, {
    e: "📷",
    t: "Истории"
  }, {
    e: "•••",
    t: "Ещё"
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "2px 20px 0",
      color: C.text
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 64,
      height: 64,
      borderRadius: "50%",
      margin: "0 auto 12px",
      background: "radial-gradient(circle at 37% 29%, #ffffff 0%, #dbe6f6 14%, #7aa4d0 46%, #3f5f86 72%, #243b5c 100%)",
      boxShadow: "0 8px 24px rgba(122,164,208,0.42)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 700,
      letterSpacing: "-0.3px"
    }
  }, "\u041F\u043E\u0434\u0435\u043B\u0438\u0442\u044C\u0441\u044F BalanceOS"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: C.sub,
      marginTop: 3
    }
  }, "\u0412\u043C\u0435\u0441\u0442\u0435 \u0434\u0435\u0440\u0436\u0430\u0442\u044C \u0431\u0430\u043B\u0430\u043D\u0441 \u043F\u0440\u043E\u0449\u0435 \u2014 \u043F\u043E\u0437\u043E\u0432\u0438 \u0434\u0440\u0443\u0433\u0430")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(XPRewardCard, {
    amount: 150,
    reason: "\u043A\u043E\u0433\u0434\u0430 \u0434\u0440\u0443\u0433 \u043D\u0430\u0447\u043D\u0451\u0442 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C\u0441\u044F \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435\u043C",
    dark: dark
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      background: C.tile,
      borderRadius: 14,
      padding: "11px 14px",
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16
    }
  }, "\uD83D\uDD17"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      fontSize: 14,
      color: C.text,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, "mind3scape.github.io/balanceos"), /*#__PURE__*/React.createElement("button", {
    onClick: copyLink,
    className: "tap",
    style: {
      background: copied ? "#34C759" : dark ? "#fff" : "#0a0a0a",
      color: copied ? "#fff" : dark ? "#0a0a0a" : "#fff",
      border: 0,
      borderRadius: 999,
      padding: "7px 14px",
      fontSize: 13,
      fontWeight: 600,
      transition: "background 0.2s",
      whiteSpace: "nowrap"
    }
  }, copied ? "Скопировано ✓" : "Копировать")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: C.sub,
      textTransform: "uppercase",
      letterSpacing: 1,
      fontWeight: 600,
      margin: "20px 0 12px"
    }
  }, "\u041F\u0440\u0435\u0434\u043B\u043E\u0436\u0438\u0442\u044C \u0434\u0440\u0443\u0437\u044C\u044F\u043C"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      overflowX: "auto",
      margin: "0 -20px",
      padding: "0 20px 4px",
      scrollbarWidth: "none"
    }
  }, friends.map((p, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    className: "tap",
    "data-no-haptic": true,
    style: {
      background: "transparent",
      border: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 7,
      flexShrink: 0,
      width: 56,
      color: C.text
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 54,
      height: 54,
      borderRadius: "50%",
      background: p.c,
      display: "grid",
      placeItems: "center",
      fontSize: 19,
      fontWeight: 700,
      color: "rgba(0,0,0,0.55)"
    }
  }, p.i), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: C.sub
    }
  }, p.name)))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: C.line,
      margin: "18px 0"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      gap: 8
    }
  }, targets.map((t, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: shareLink,
    className: "tap",
    style: {
      flex: 1,
      background: "transparent",
      border: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 7,
      color: C.text
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 54,
      height: 54,
      borderRadius: "50%",
      background: C.tile,
      display: "grid",
      placeItems: "center",
      fontSize: 22
    }
  }, t.e), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: C.sub
    }
  }, t.t)))), /*#__PURE__*/React.createElement("button", {
    className: "tap",
    onClick: close,
    style: {
      width: "100%",
      marginTop: 22,
      background: dark ? "#fff" : "#0a0a0a",
      color: dark ? "#0a0a0a" : "#fff",
      border: 0,
      borderRadius: 999,
      padding: 15,
      fontSize: 15,
      fontWeight: 600
    }
  }, "\u0413\u043E\u0442\u043E\u0432\u043E"));
}

/* Home customization screen — pick widgets (wired to global app.widgets) */
function HomeCustomizeScreen() {
  var {
    navigate
  } = useNav();
  var app = useApp();
  var widgets = app?.widgets || {};
  var isDark = app?.themeOverride === "dark";
  var setOne = (id, v) => app?.setWidgets({
    ...widgets,
    [id]: v
  });
  // Only widgets that REALLY exist and are wired into the home render. The old
  // quote/ai/weather/books toggles did nothing — removed so every switch works.
  var opts = [{
    id: "mood",
    i: "💭",
    t: "Состояние",
    d: "Твоё самочувствие — нажми, чтобы обновить"
  }, {
    id: "streak",
    i: "🔥",
    t: "Счётчик серии",
    d: "Дней подряд"
  }, {
    id: "level",
    i: "🏆",
    t: "Уровень и опыт",
    d: "Прогресс и награды"
  }, {
    id: "calendar",
    i: "📅",
    t: "Календарь",
    d: "Сегодняшняя дата"
  }, {
    id: "team",
    i: "👥",
    t: "Команды",
    d: "Активные команды"
  }, {
    id: "energy",
    i: "⚡",
    t: "XP за день",
    d: "Сколько опыта набрал сегодня"
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      padding: "0 16px 24px"
    }
  }, /*#__PURE__*/React.createElement(PageHeader, {
    title: "\u0412\u0438\u0434\u0436\u0435\u0442\u044B \u0433\u043B\u0430\u0432\u043D\u043E\u0433\u043E",
    onBack: () => navigate("settings")
  }), /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-3",
    style: {
      fontSize: 13,
      marginBottom: 14,
      lineHeight: 1.5,
      padding: "0 2px"
    }
  }, "\u0412\u043A\u043B\u044E\u0447\u0430\u0439 \u0438 \u0432\u044B\u043A\u043B\u044E\u0447\u0430\u0439 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0438 \u043D\u0430 \u0433\u043B\u0430\u0432\u043D\u043E\u043C. \u0421\u0432\u043E\u0434\u043A\u0430 \u0438 \u0430\u0432\u0430\u0442\u0430\u0440 \u0441\u0432\u0435\u0440\u0445\u0443 \u2014 \u0432\u0441\u0435\u0433\u0434\u0430 \u043D\u0430 \u043C\u0435\u0441\u0442\u0435."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, opts.map(o => /*#__PURE__*/React.createElement("div", {
    key: o.id,
    className: "bos-sys-card",
    style: {
      padding: 14,
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bos-sys-chip-bg",
    style: {
      width: 38,
      height: 38,
      borderRadius: 11,
      display: "grid",
      placeItems: "center",
      fontSize: 18,
      flexShrink: 0
    }
  }, o.i), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 500
    }
  }, o.t), /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-3",
    style: {
      fontSize: 12
    }
  }, o.d)), /*#__PURE__*/React.createElement(Switch, {
    on: widgets[o.id] !== false,
    onChange: v => setOne(o.id, v),
    dark: isDark
  })))));
}
window.HomeScreen = HomeScreen;
window.HomeCustomizeScreen = HomeCustomizeScreen;

/* MoodWidget — breathing aurora orb + last-7-days mood trail.
   Theme-aware: in dark, deeper inky background with luminous orb;
   in light, soft pastel band with the same orb. */
function MoodWidget({
  mood,
  app,
  isDark,
  navigate
}) {
  // Last 7 days (mock); use real app.dayMoods if present
  var today = 28;
  var last7 = [22, 23, 24, 25, 26, 27, 28].map(d => ({
    d,
    m: app?.dayMoods && app.dayMoods[d] != null ? MOOD_OPTIONS[app.dayMoods[d]] : null,
    today: d === today
  }));
  var logged = last7.filter(d => d.m).length;
  var sameAsToday = last7.filter(d => d.m && d.m.t === mood.t).length;

  // hex deepener for orb gradients
  var deep = (hex, amt = 0.45) => {
    if (!hex || hex[0] !== "#") return "#222";
    var h = hex.slice(1);
    if (h.length === 3) h = h.split("").map(c => c + c).join("");
    var n = parseInt(h, 16);
    var r = Math.max(0, (n >> 16 & 255) * (1 - amt)) | 0;
    var g = Math.max(0, (n >> 8 & 255) * (1 - amt)) | 0;
    var b = Math.max(0, (n & 255) * (1 - amt)) | 0;
    return "#" + (r << 16 | g << 8 | b).toString(16).padStart(6, "0");
  };
  var bg = isDark ? `linear-gradient(160deg, #1a1a1d 0%, #0d0d10 100%)` : `#ffffff`;
  var border = isDark ? "0" : "1px solid rgba(0,0,0,0.04)";
  var labelMuted = isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.50)";
  var subMuted = isDark ? "rgba(255,255,255,0.60)" : "rgba(0,0,0,0.55)";
  var titleColor = isDark ? "#fff" : "var(--text)";
  var trailIdle = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  var trailRing = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.28)"; // soft grey, not a harsh black ring
  var chipBg = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)";
  var fresh = app?.mode === "fresh";
  return /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("mood"),
    className: "tap",
    "data-tour": "state",
    style: {
      marginTop: 12,
      width: "100%",
      border,
      textAlign: "left",
      background: bg,
      borderRadius: 22,
      padding: 18,
      position: "relative",
      overflow: "hidden",
      boxShadow: isDark ? "none" : "0 1px 2px rgba(0,0,0,0.04)",
      display: "block"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 16,
      alignItems: "center",
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      flexShrink: 0,
      width: 72,
      height: 72,
      display: "grid",
      placeItems: "center"
    }
  }, /*#__PURE__*/React.createElement(StateOrb, {
    size: 72,
    tint: tintFromMood(mood.c),
    intensity: isDark ? 1.25 : 1.05
  })), /*#__PURE__*/React.createElement("div", {
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
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: labelMuted,
      textTransform: "uppercase",
      letterSpacing: 1.4,
      fontWeight: 600
    }
  }, "\u0421\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435 \xB7 \u0441\u0435\u0439\u0447\u0430\u0441"), sameAsToday >= 2 && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      color: isDark ? "#FEDE34" : "#8a6a00",
      background: isDark ? "rgba(254,222,52,0.14)" : "rgba(254,222,52,0.35)",
      borderRadius: 999,
      padding: "2px 7px",
      letterSpacing: 0.4,
      whiteSpace: "nowrap"
    }
  }, "\u2728 +", sameAsToday * 10, " XP")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
      fontSize: 26,
      fontWeight: 600,
      lineHeight: 1.1,
      letterSpacing: "-0.6px",
      marginTop: 4,
      color: titleColor
    }
  }, fresh ? "Как ты сейчас?" : mood.t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: subMuted,
      marginTop: 4
    }
  }, fresh ? "Нажми, чтобы отметить первое состояние." : "Нажми, чтобы обновить — сфера следует за твоим состоянием."))), !fresh && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      paddingTop: 14,
      borderTop: "1px solid " + (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"),
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8
    }
  }, last7.map((d, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 4
    }
  }, d.m ? /*#__PURE__*/React.createElement("span", {
    "aria-label": d.m.t,
    style: {
      width: 22,
      height: 22,
      borderRadius: "50%",
      display: "block",
      boxShadow: d.today ? `0 0 0 2px ${trailRing}` : "none"
    }
  }, /*#__PURE__*/React.createElement(StaticOrb, {
    size: 22,
    tint: tintFromMood(d.m.c),
    seed: 1.2,
    intensity: 0.25
  })) : /*#__PURE__*/React.createElement("span", {
    style: {
      width: 22,
      height: 22,
      borderRadius: "50%",
      background: trailIdle,
      boxShadow: d.today ? `0 0 0 2px ${trailRing}` : "none"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      color: labelMuted,
      fontWeight: 600
    }
  }, ["В", "П", "В", "С", "Ч", "П", "С"][(d.d - 22 + 1) % 7]))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: 0.3,
      color: subMuted,
      background: chipBg,
      borderRadius: 999,
      padding: "4px 9px",
      flexShrink: 0
    }
  }, logged, "/7 \u043E\u0442\u043C\u0435\u0447\u0435\u043D\u043E")));
}

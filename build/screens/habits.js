/* HABITS & GOALS screen + HABIT SETTINGS (create/edit) */
var {
  useState: useHS
} = React;
var EMOJI_CHIPS = [{
  i: "☀️",
  t: "Подъём в 5:00"
}, {
  i: "🤸🏼‍♀️",
  t: "Йога"
}, {
  i: "📖",
  t: "Чтение"
}, {
  i: "🙏",
  t: "Помощь"
}, {
  i: "🧭",
  t: "Вклад в миссию"
}, {
  i: "⌨️",
  t: "Кодинг"
}, {
  i: "🦶",
  t: "10 000 шагов"
}, {
  i: "🚭",
  t: "Не курить"
}, {
  i: "🌚",
  t: "Сон в 21:00"
}, {
  i: "👟",
  t: "Бег"
}, {
  i: "🧁",
  t: "Без сахара"
}, {
  i: "📞",
  t: "Чаще звонить родителям"
}];

/* Avatar stack — small face pile showing who else is doing this habit.
   Soft pastels with enough saturation to read as real colours (the old set
   was so pale it looked grey). Dark initials still sit readably on top, and
   these same hues drive the shared-habit calendar rings so each person is
   recognisable at a glance — blue = Марк, peach = Анна, etc. */
var AVATAR_PALETTE = ["#7FB3F2", "#F4A574", "#76D3A0", "#B89AF0", "#F291AC", "#74CFE0", "#F5C56B"];

/* Per-habit accent. `null` = base (neutral gray, the project default); a value
   softly tints the icon tile everywhere and fills the stats grid. Kept to calm
   iOS-system hues so coloured habits still read cohesive with the gray ones. */
var HABIT_COLORS = [{
  id: "base",
  val: null
}, {
  id: "blue",
  val: "#0A84FF"
}, {
  id: "green",
  val: "#34C759"
}, {
  id: "amber",
  val: "#FF9500"
}, {
  id: "purple",
  val: "#AF52DE"
}, {
  id: "pink",
  val: "#FF2D55"
}, {
  id: "teal",
  val: "#30B0C7"
}];
var HABIT_COLOR_NAMES = {
  "#0A84FF": "Океан",
  "#34C759": "Лес",
  "#FF9500": "Янтарь",
  "#AF52DE": "Аметист",
  "#FF2D55": "Маджента",
  "#30B0C7": "Бирюза"
};

/* ── Inline habit timer ───────────────────────────────────────────────────────
   A segmented "bezel" ring that ticks in place — replaces the old solid play
   button AND the separate dark focus screen. Tap to start a real countdown right
   in the row (хопс — пошло), tap again to pause (хопс — стоп). The bezel is N
   segments (≈ a chunk of the duration each); they light up as the timer fills,
   and on completion the habit auto-checks. Same radial-tick DNA as the mood dial,
   liquid-glass and iOS-native. */
function fmtClock(sec) {
  var s = Math.max(0, Math.ceil(sec));
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
}
function ringHaptic(kind) {
  try {
    if (window.tgHaptic) window.tgHaptic(kind);else if (navigator.vibrate) navigator.vibrate(kind === "success" ? [10, 40, 12] : 7);
  } catch (_) {}
}
function HabitRing({
  habit,
  dark,
  onComplete
}) {
  var total = Math.max(1, Math.round(habit?.duration || 1)) * 60; // seconds
  var [running, setRunning] = React.useState(false);
  var [elapsed, setElapsed] = React.useState(0);
  var done = elapsed >= total;
  React.useEffect(() => {
    if (!running) return;
    var base = elapsed,
      start = Date.now(); // timestamp-based → no drift
    var id = setInterval(() => {
      var e = base + (Date.now() - start) / 1000;
      if (e >= total) {
        setElapsed(total);
        setRunning(false);
        ringHaptic("success");
        onComplete && onComplete();
      } else setElapsed(e);
    }, 200);
    return () => clearInterval(id);
  }, [running]);
  var frac = Math.min(1, elapsed / total);
  var toggle = e => {
    e.stopPropagation();
    ringHaptic("light");
    setRunning(r => !r);
  };

  // segmented "dashed ring": SEG arcs along the circle with small gaps, lighting
  // up as the timer fills (segment 0 lights the instant you start → immediate feel)
  var SEG = Math.min(12, Math.max(5, Math.round(habit?.duration || 6)));
  var size = 38,
    cx = size / 2,
    cy = size / 2,
    R = 14.5;
  var accent = habit?.color || (dark ? "#ffffff" : "#0a0a0a");
  var dim = dark ? "rgba(255,255,255,0.20)" : "rgba(10,10,10,0.14)";
  var pitch = 360 / SEG,
    gap = pitch * 0.36;
  var arc = (a0, a1) => {
    var p = d => {
      var a = d * Math.PI / 180;
      return [(cx + R * Math.cos(a)).toFixed(2), (cy + R * Math.sin(a)).toFixed(2)];
    };
    var [x0, y0] = p(a0),
      [x1, y1] = p(a1);
    return "M " + x0 + " " + y0 + " A " + R + " " + R + " 0 " + (a1 - a0 > 180 ? 1 : 0) + " 1 " + x1 + " " + y1;
  };
  // live fill: every segment has a dim base; an accent overlay covers exactly the
  // elapsed share — whole for passed segments, PARTIAL for the current one, so you
  // literally watch it fill with time (no pulse, no guessing).
  var pos = frac * SEG;
  var base = [],
    fill = [];
  for (var i = 0; i < SEG; i++) {
    var a0 = -90 + i * pitch + gap / 2,
      a1 = -90 + (i + 1) * pitch - gap / 2;
    base.push(/*#__PURE__*/React.createElement("path", {
      key: "b" + i,
      d: arc(a0, a1),
      fill: "none",
      stroke: dim,
      strokeWidth: "2.4",
      strokeLinecap: "round"
    }));
    var f = Math.max(0, Math.min(1, pos - i));
    if (f > 0.001) fill.push(/*#__PURE__*/React.createElement("path", {
      key: "f" + i,
      d: arc(a0, a0 + (a1 - a0) * f),
      fill: "none",
      stroke: accent,
      strokeWidth: "2.4",
      strokeLinecap: "round"
    }));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      flexShrink: 0
    }
  }, (running || elapsed > 0 && !done) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      fontVariantNumeric: "tabular-nums",
      letterSpacing: "-0.3px",
      color: "var(--text-3)"
    }
  }, fmtClock(total - elapsed)), /*#__PURE__*/React.createElement("button", {
    onClick: toggle,
    className: "tap",
    "data-no-haptic": true,
    "aria-label": running ? "Пауза" : "Старт",
    style: {
      position: "relative",
      width: size,
      height: size,
      borderRadius: "50%",
      background: "transparent",
      border: 0,
      padding: 0,
      flexShrink: 0,
      display: "grid",
      placeItems: "center",
      color: accent
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 " + size + " " + size,
    style: {
      position: "absolute",
      inset: 0
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: cx,
    cy: cy,
    r: R - 4.5,
    fill: dark ? "rgba(255,255,255,0.06)" : "rgba(10,10,10,0.045)"
  }), base, fill), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      display: "grid",
      placeItems: "center",
      transform: running || done ? "none" : "translateX(0.5px)"
    }
  }, done ? /*#__PURE__*/React.createElement(I.Check, {
    size: 14,
    strokeWidth: 3
  }) : running ? /*#__PURE__*/React.createElement(I.Pause, {
    size: 13
  }) : /*#__PURE__*/React.createElement(I.Play, {
    size: 12
  }))));
}
function AvatarStack({
  people = [],
  size = 18,
  max = 3,
  label = true
}) {
  if (!people.length) return null;
  var visible = people.slice(0, max);
  var overflow = people.length - visible.length;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex"
    }
  }, visible.map((p, i) =>
  // Real avatar (the Memoji/Emoji the person chose) when they have one — so faces
  // stay consistent everywhere; initials disc only as a fallback.
  p.avatar && typeof BosAvatar === "function" ? /*#__PURE__*/React.createElement(BosAvatar, {
    key: i,
    avatar: p.avatar,
    size: size,
    style: {
      border: "1.5px solid #fff",
      marginLeft: i ? -size * 0.35 : 0,
      boxShadow: "0 1px 2px rgba(0,0,0,0.08)"
    }
  }) : /*#__PURE__*/React.createElement("div", {
    key: i,
    title: p.name,
    style: {
      width: size,
      height: size,
      borderRadius: "50%",
      background: p.color || AVATAR_PALETTE[i % AVATAR_PALETTE.length],
      border: "1.5px solid #fff",
      marginLeft: i ? -size * 0.35 : 0,
      display: "grid",
      placeItems: "center",
      fontSize: size * 0.5,
      fontWeight: 700,
      color: "rgba(0,0,0,0.55)",
      boxShadow: "0 1px 2px rgba(0,0,0,0.08)"
    }
  }, p.initials || p.name?.[0])), overflow > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      width: size,
      height: size,
      borderRadius: "50%",
      background: "var(--surface-3, #e9e9e9)",
      border: "1.5px solid #fff",
      marginLeft: -size * 0.35,
      display: "grid",
      placeItems: "center",
      fontSize: size * 0.42,
      fontWeight: 700,
      color: "var(--text-3, #555)"
    }
  }, "+", overflow)), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-4, #71717a)"
    }
  }, "\u0441 ", people[0].name.split(" ")[0], people.length > 1 ? ` +${people.length - 1}` : ""));
}

/* ── Share-a-habit sheet (slides up from a row's swipe "Поделиться") ───────── */
function ShareHabitSheet({
  habit,
  dark = false
}) {
  var {
    close
  } = useSheet();
  var app = typeof useApp === "function" ? useApp() : null;
  var _isLive = app?.mode === "live";
  // The real, live web app — same invite link the «Поделиться приложением» sheet uses.
  // LIVE: tagged with ?ref=<uid> so the invite credits you (orbit + XP). FUTURE bot swap:
  // t.me/<bot>?startapp=ref_<uid> — the uid already flows here, one-line change later.
  var APP_URL = "https://mind3scape.github.io/balanceos";
  var [shareUrl, setShareUrl] = React.useState(APP_URL);
  React.useEffect(() => {
    var on = true;
    if (_isLive && window.bosCloud && window.bosCloud.uid) {
      window.bosCloud.uid().then(id => {
        if (on && id) setShareUrl(APP_URL + "?ref=" + id);
      }).catch(() => {});
    } else {
      setShareUrl(APP_URL);
    }
    return () => {
      on = false;
    };
  }, [_isLive]);
  var shareLink = () => {
    // Inside Telegram → native contact picker; else Web Share; else clipboard.
    if (window.bosShare) window.bosShare(shareUrl, "Делаем привычку «" + (habit?.name || "") + "» вместе в BalanceOS");else {
      try {
        navigator.clipboard.writeText(shareUrl);
      } catch (e) {}
    }
    if (window.tgHaptic) {
      try {
        window.tgHaptic("light");
      } catch (e) {}
    }
  };
  var C = dark ? {
    text: "#fff",
    sub: "rgba(255,255,255,0.5)",
    tile: "rgba(255,255,255,0.08)",
    line: "rgba(255,255,255,0.09)",
    ring: "#1c1c1e"
  } : {
    text: "#0a0a0a",
    sub: "rgba(0,0,0,0.5)",
    tile: "#f1f1f3",
    line: "rgba(0,0,0,0.06)",
    ring: "#fff"
  };
  // Soft pastel palette so each real friend chip still gets a pleasant colour.
  var _FCOLORS = ["#e8c8a8", "#a8b9d4", "#d4b8e8", "#a8d4e8", "#b8e8c8", "#e8b8d4", "#d4c8e8"];
  var _demoFriends = [{
    name: "Анна",
    i: "А",
    c: "#e8c8a8",
    on: true
  }, {
    name: "Марк",
    i: "М",
    c: "#a8b9d4",
    on: true
  }, {
    name: "Лена",
    i: "Л",
    c: "#d4b8e8",
    on: false
  }, {
    name: "Вик",
    i: "В",
    c: "#a8d4e8",
    on: false
  }, {
    name: "Том",
    i: "Т",
    c: "#b8e8c8",
    on: false
  }];
  // LIVE: the user's REAL invited people (referral circle). Demo keeps the 5 faces.
  var [friends, setFriends] = useHS(_isLive ? [] : _demoFriends);
  React.useEffect(() => {
    if (!_isLive || !(window.bosCloud && window.bosCloud.enabled())) return;
    var on = true;
    try {
      window.bosCloud.invitedPeople().then(list => {
        if (!on || !Array.isArray(list)) return;
        setFriends(list.map((p, idx) => {
          var nm = p && p.username ? p.username : "Друг";
          return {
            name: nm,
            i: nm.charAt(0).toUpperCase(),
            c: _FCOLORS[idx % _FCOLORS.length],
            on: false
          };
        }));
      }).catch(() => {});
    } catch (e) {}
    return () => {
      on = false;
    };
  }, [_isLive]);
  var toggleF = idx => setFriends(f => f.map((x, i) => i === idx ? {
    ...x,
    on: !x.on
  } : x));
  // LIVE share targets: only the two that map to a REAL action (OS share sheet /
  // clipboard copy of the invite link). Demo keeps the full curated row.
  var targets = _isLive ? [{
    e: "💬",
    t: "Сообщения"
  }, {
    e: "🔗",
    t: "Ссылка"
  }] : [{
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
      width: 56,
      height: 56,
      borderRadius: 16,
      background: C.tile,
      display: "grid",
      placeItems: "center",
      fontSize: 30,
      margin: "0 auto 10px"
    }
  }, habit?.emoji || "✨"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 700,
      letterSpacing: "-0.3px"
    }
  }, "\u041F\u043E\u0434\u0435\u043B\u0438\u0442\u044C\u0441\u044F \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u043E\u0439"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: C.sub,
      marginTop: 3
    }
  }, "\xAB", habit?.name || "Привычка", "\xBB \u2014 \u0437\u043E\u0432\u0438\u0442\u0435 \u0434\u0440\u0443\u0437\u0435\u0439 \u0434\u0435\u043B\u0430\u0442\u044C \u0432\u043C\u0435\u0441\u0442\u0435")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(XPRewardCard, {
    amount: 75,
    reason: "\u043A\u043E\u0433\u0434\u0430 \u0434\u0440\u0443\u0433 \u043F\u0440\u0438\u0441\u043E\u0435\u0434\u0438\u043D\u0438\u0442\u0441\u044F \u043A \u044D\u0442\u043E\u0439 \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0435",
    mode: "habit",
    dark: dark
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: C.sub,
      textTransform: "uppercase",
      letterSpacing: 1,
      fontWeight: 600,
      margin: "22px 0 12px"
    }
  }, "\u0414\u0435\u043B\u0430\u0442\u044C \u0432\u043C\u0435\u0441\u0442\u0435"), _isLive && friends.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: C.sub,
      lineHeight: 1.45,
      padding: "2px 2px 4px"
    }
  }, "\u041F\u043E\u043A\u0430 \u043D\u0435\u043A\u043E\u0433\u043E \u043F\u043E\u0437\u0432\u0430\u0442\u044C \u2014 \u043F\u0440\u0438\u0433\u043B\u0430\u0441\u0438 \u0434\u0440\u0443\u0433\u0430 \u043F\u043E \u0441\u0441\u044B\u043B\u043A\u0435 \u043D\u0438\u0436\u0435.") : /*#__PURE__*/React.createElement("div", {
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
    onClick: () => toggleF(i),
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
      position: "relative",
      width: 54,
      height: 54,
      borderRadius: "50%",
      background: p.c,
      display: "grid",
      placeItems: "center",
      fontSize: 19,
      fontWeight: 700,
      color: "rgba(0,0,0,0.55)",
      opacity: p.on ? 1 : 0.45,
      transition: "opacity 0.2s"
    }
  }, p.i, p.on && /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      right: -2,
      bottom: -2,
      width: 20,
      height: 20,
      borderRadius: "50%",
      background: "#34c759",
      border: "2px solid " + C.ring,
      display: "grid",
      placeItems: "center"
    }
  }, /*#__PURE__*/React.createElement(I.Check, {
    size: 11,
    strokeWidth: 3,
    color: "#fff"
  }))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: C.sub
    }
  }, p.name))), /*#__PURE__*/React.createElement("button", {
    className: "tap",
    onClick: shareLink,
    style: {
      background: "transparent",
      border: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 7,
      flexShrink: 0,
      width: 56,
      color: C.sub
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 54,
      height: 54,
      borderRadius: "50%",
      border: "1.5px dashed " + C.sub,
      display: "grid",
      placeItems: "center"
    }
  }, /*#__PURE__*/React.createElement(I.Plus, {
    size: 20
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12
    }
  }, "\u041F\u043E\u0437\u0432\u0430\u0442\u044C"))), /*#__PURE__*/React.createElement("div", {
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
function HabitsScreen() {
  var {
    navigate
  } = useNav();
  var {
    open: openSheet
  } = useSheet();
  var app = useApp();
  var wrapRef = React.useRef(null);
  var [isDark, setIsDark] = useHS(false);
  React.useEffect(() => {
    var el = wrapRef.current;
    if (!el) return;
    var n = el.parentElement;
    while (n && !n.classList.contains("theme-light") && !n.classList.contains("theme-dark")) n = n.parentElement;
    setIsDark(!!(n && n.classList.contains("theme-dark")));
  }, []);

  // Theme tokens — solid surfaces, NO borders. Match Home dark style.
  var TH = isDark ? {
    cardBg: "linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
    chipBg: "rgba(255,255,255,0.06)",
    chipBd: "0",
    iconBg: "rgba(255,255,255,0.08)",
    divider: "rgba(255,255,255,0.06)",
    chipText: "var(--text)",
    plusIcon: "rgba(255,255,255,0.5)",
    pillBg: "rgba(255,255,255,0.06)",
    addBtnBg: "#fff",
    addBtnFg: "#0a0a0a",
    playBtnBg: "#fff",
    playBtnFg: "#0a0a0a"
  } : {
    cardBg: "#fff",
    chipBg: "#fff",
    chipBd: "1px solid rgba(0,0,0,0.05)",
    iconBg: "var(--surface-3)",
    divider: "var(--line)",
    chipText: "var(--text-2)",
    plusIcon: "#999",
    pillBg: "#e8e8e8",
    addBtnBg: "#0a0a0a",
    addBtnFg: "#fff",
    playBtnBg: "var(--text-2)",
    playBtnFg: "#fff"
  };
  var cardShadow = isDark ? "none" : "0 1px 2px rgba(0,0,0,0.04)";
  var [tab, setTab] = useHS("habits");
  // Shared store — same list the Home screen reads/writes.
  var habits = app?.habits || [];
  var goals = app?.goals || [];
  var toggle = app?.toggleHabit || (() => {});
  var remove = app?.removeHabit || (() => {});
  var rowBg = isDark ? "#141414" : "#ffffff"; // opaque so swipe actions stay hidden until revealed

  return /*#__PURE__*/React.createElement("div", {
    ref: wrapRef,
    className: "page-in",
    style: {
      padding: "0 12px 24px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    "data-tour": "presets",
    style: {
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1.2,
      fontWeight: 600,
      marginBottom: 8,
      padding: "0 4px"
    }
  }, "\u0411\u044B\u0441\u0442\u0440\u043E\u0435 \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u0438\u0435"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      overflowX: "auto",
      scrollbarWidth: "none",
      WebkitOverflowScrolling: "touch",
      touchAction: "pan-x",
      margin: "0 -12px",
      padding: "0 12px 2px"
    }
  }, EMOJI_CHIPS.map((c, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    className: "tap",
    "data-no-haptic": true,
    onClick: () => navigate("habit-settings", {
      mode: "create",
      preset: c
    }),
    style: {
      background: TH.chipBg,
      borderRadius: 999,
      padding: "8px 12px",
      fontSize: 13,
      color: TH.chipText,
      border: TH.chipBd,
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      whiteSpace: "nowrap",
      flexShrink: 0,
      boxShadow: cardShadow
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      lineHeight: 1
    }
  }, c.i), c.t, " ", /*#__PURE__*/React.createElement(I.Plus, {
    size: 12,
    color: TH.plusIcon
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "tab-pill",
    style: {
      background: TH.pillBg,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "tap " + (tab === "habits" ? "active" : ""),
    onClick: () => setTab("habits")
  }, "\u041F\u0440\u0438\u0432\u044B\u0447\u043A\u0438"), /*#__PURE__*/React.createElement("button", {
    className: "tap " + (tab === "goals" ? "active" : ""),
    onClick: () => setTab("goals")
  }, "\u0426\u0435\u043B\u0438")), /*#__PURE__*/React.createElement("button", {
    "data-tour": "add",
    onClick: () => navigate(tab === "habits" ? "habit-settings" : "goal-settings", {
      mode: "create"
    }),
    className: "tap",
    title: tab === "habits" ? "Добавить привычку" : "Добавить цель",
    style: {
      width: 44,
      height: 44,
      borderRadius: 999,
      background: TH.addBtnBg,
      color: TH.addBtnFg,
      border: 0,
      display: "grid",
      placeItems: "center",
      boxShadow: isDark ? "none" : "0 4px 14px rgba(0,0,0,0.18)"
    }
  }, /*#__PURE__*/React.createElement(I.Plus, {
    size: 18,
    strokeWidth: 2.2
  }))), tab === "habits" ? habits.length === 0 ? /*#__PURE__*/React.createElement("button", {
    className: "tap",
    onClick: () => navigate("habit-settings", {
      mode: "create"
    }),
    style: {
      marginTop: 12,
      width: "100%",
      background: TH.cardBg,
      border: 0,
      borderRadius: 22,
      padding: "34px 20px",
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
      width: 54,
      height: 54,
      borderRadius: 16,
      background: TH.iconBg,
      display: "grid",
      placeItems: "center",
      fontSize: 27
    }
  }, "\uD83C\uDF31"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 600
    }
  }, "\u0417\u0434\u0435\u0441\u044C \u0431\u0443\u0434\u0443\u0442 \u0442\u0432\u043E\u0438 \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0438"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: "var(--text-4)",
      lineHeight: 1.45,
      maxWidth: 250
    }
  }, "\u041D\u0430\u0447\u043D\u0438 \u0441 \u043E\u0434\u043D\u043E\u0439 \u043C\u0430\u043B\u0435\u043D\u044C\u043A\u043E\u0439. \u0415\u0451 \u043C\u043E\u0436\u043D\u043E \u0434\u0435\u043B\u0430\u0442\u044C \u043E\u0434\u043D\u043E\u043C\u0443 \u0438\u043B\u0438 \u0432\u043C\u0435\u0441\u0442\u0435 \u0441 \u0434\u0440\u0443\u0437\u044C\u044F\u043C\u0438."), /*#__PURE__*/React.createElement("span", {
    style: {
      marginTop: 6,
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      background: TH.addBtnBg,
      color: TH.addBtnFg,
      borderRadius: 999,
      padding: "10px 18px",
      fontSize: 14.5,
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement(I.Plus, {
    size: 16,
    strokeWidth: 2.5
  }), " \u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0443")) : /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
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
      from: "habits"
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
      background: h.color ? h.color + "26" : TH.iconBg,
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
  }), /*#__PURE__*/React.createElement(HabitCheck, {
    done: h.done,
    onToggle: () => toggle(h.id),
    xp: 10
  })))))) : goals.length === 0 ? /*#__PURE__*/React.createElement("button", {
    className: "tap",
    onClick: () => navigate("goal-settings", {
      mode: "create"
    }),
    style: {
      marginTop: 12,
      width: "100%",
      background: TH.cardBg,
      border: 0,
      borderRadius: 22,
      padding: "34px 20px",
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
      width: 54,
      height: 54,
      borderRadius: 16,
      background: TH.iconBg,
      display: "grid",
      placeItems: "center",
      fontSize: 27
    }
  }, "\uD83C\uDFAF"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 600
    }
  }, "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u0446\u0435\u043B\u0435\u0439"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: "var(--text-4)",
      lineHeight: 1.45,
      maxWidth: 250
    }
  }, "\u0426\u0435\u043B\u044C \u2014 \u044D\u0442\u043E \u0432\u0435\u0440\u0448\u0438\u043D\u0430, \u043A \u043A\u043E\u0442\u043E\u0440\u043E\u0439 \u0432\u0435\u0434\u0443\u0442 \u0442\u0432\u043E\u0438 \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0438. \u041F\u043E\u0441\u0442\u0430\u0432\u044C \u043F\u0435\u0440\u0432\u0443\u044E."), /*#__PURE__*/React.createElement("span", {
    style: {
      marginTop: 6,
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      background: TH.addBtnBg,
      color: TH.addBtnFg,
      borderRadius: 999,
      padding: "10px 18px",
      fontSize: 14.5,
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement(I.Plus, {
    size: 16,
    strokeWidth: 2.5
  }), " \u041F\u043E\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u0446\u0435\u043B\u044C")) : /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      color: "var(--text)"
    }
  }, goals.map(g => {
    var pct = g.target > 0 ? g.current / g.target : 0;
    return /*#__PURE__*/React.createElement("div", {
      key: g.id,
      style: {
        borderRadius: 18,
        overflow: "hidden",
        boxShadow: cardShadow,
        background: TH.cardBg
      }
    }, /*#__PURE__*/React.createElement("button", {
      className: "tap",
      onClick: () => navigate("goal-detail", {
        goal: g,
        from: "habits"
      }),
      style: {
        width: "100%",
        background: "transparent",
        border: 0,
        padding: "14px 16px",
        textAlign: "left",
        color: "var(--text)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 14
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 40,
        height: 40,
        borderRadius: 12,
        background: TH.iconBg,
        display: "grid",
        placeItems: "center",
        fontSize: 20,
        flexShrink: 0
      }
    }, g.emoji), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15.5,
        color: "var(--text-2)",
        letterSpacing: "-0.2px",
        fontWeight: 500
      }
    }, g.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "var(--text-4)",
        marginTop: 3,
        display: "flex",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("span", null, g.current, " / ", g.target, " ", g.unit), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, "\u0434\u043E ", g.deadline))), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14,
        fontWeight: 700,
        color: "var(--text-2)",
        flexShrink: 0
      }
    }, Math.round(pct * 100), "%")), /*#__PURE__*/React.createElement("div", {
      className: "bos-progress",
      style: {
        marginTop: 10
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: Math.min(1, pct) * 100 + "%"
      }
    }))));
  })), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22,
      padding: "0 4px"
    }
  }, "\u041E\u0431\u0443\u0447\u0435\u043D\u0438\u0435"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10
    }
  }, [{
    topic: "habits-basics",
    emoji: "🌱",
    t: "Основы привычек",
    d: "5 мин",
    b: "Почему маленькое лучше большого — и как не пропускать дважды."
  }, {
    topic: "goals-101",
    emoji: "🎯",
    t: "Ставь хорошие цели",
    d: "5 мин",
    b: "Результат или процесс: что отслеживать и когда."
  }].map((c, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => navigate("info", {
      topic: c.topic
    }),
    className: "tap",
    style: {
      background: TH.cardBg,
      border: 0,
      borderRadius: 22,
      padding: 16,
      textAlign: "left",
      boxShadow: cardShadow,
      position: "relative",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      gap: 8,
      minHeight: 144,
      color: "var(--text)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 12,
      background: TH.iconBg,
      display: "grid",
      placeItems: "center",
      fontSize: 20
    }
  }, c.emoji), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 600,
      color: "var(--text)",
      lineHeight: 1.2
    }
  }, c.t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-4)",
      lineHeight: 1.45
    }
  }, c.b), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: "auto",
      fontSize: 11,
      color: "var(--text-4)"
    }
  }, /*#__PURE__*/React.createElement("span", null, c.d, " \u0447\u0442\u0435\u043D\u0438\u044F"), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 14
  }))))));
}

/* Clean, Apple-style emoji set for habit / goal icons — single-glyph, no skin-
   tone or gender modifiers so they read consistently across the grid. */
var HABIT_ICONS = ["🏃", "🚶", "🚴", "🏊", "💪", "🧘", "🤸", "🧗", "📖", "📚", "✍️", "🎨", "🎵", "🎸", "💻", "🧠", "🙏", "🧊", "💧", "🥗", "🍎", "☕", "🚭", "😴", "☀️", "🌙", "🔥", "🌱", "⭐", "🎯", "❤️", "🧭"];

/* Weekday model — index 0..6 = Пн..Вс. `days` on a habit is a 7-long 0/1 mask;
   all-1 means «каждый день». Helpers below summarise it for the UI. */
var WEEKDAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
function daysSummary(days) {
  var on = days.filter(Boolean).length;
  if (on === 7) return "Каждый день";
  if (on === 0) return "Не выбрано";
  if (on === 5 && days[0] && days[1] && days[2] && days[3] && days[4]) return "По будням";
  if (on === 2 && days[5] && days[6]) return "По выходным";
  return WEEKDAY_LABELS.filter((_, i) => days[i]).join(", ");
}

/* Invite share sheet for a freshly-created SHARED habit — same shape as community's
   TeamShareSheet (copy + OS share), but the link carries both ?team= (so a friend
   joins the mini-team on open) and &ref= (so they're credited as your referral). */
function HabitInviteShareSheet({
  habit,
  link
}) {
  var [copied, setCopied] = useHS(false);
  var copyLink = () => {
    try {
      navigator.clipboard.writeText(link);
    } catch (e) {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
    if (window.tgHaptic) {
      try {
        window.tgHaptic("light");
      } catch (e) {}
    }
  };
  var shareLink = () => {
    if (window.bosShare ? !window.bosShare(link, "Делаем привычку «" + (habit?.name || "") + "» вместе в BalanceOS") : true) copyLink();
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "2px 20px 0",
      color: "var(--text)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 64,
      height: 64,
      borderRadius: 18,
      margin: "0 auto 12px",
      background: habit?.color ? habit.color + "26" : "var(--surface-3)",
      display: "grid",
      placeItems: "center",
      fontSize: 34
    }
  }, habit?.emoji || "✨"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 700,
      letterSpacing: "-0.3px"
    }
  }, "\u0417\u043E\u0432\u0438\u0442\u0435 \u0434\u0440\u0443\u0433\u0430"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: "var(--text-3)",
      marginTop: 4,
      maxWidth: 290,
      marginInline: "auto",
      lineHeight: 1.45
    }
  }, "\xAB", habit?.name || "Привычка", "\xBB \u0442\u0435\u043F\u0435\u0440\u044C \u0441\u043E\u0432\u043C\u0435\u0441\u0442\u043D\u0430\u044F \u2014 \u043E\u0442\u043F\u0440\u0430\u0432\u044C \u0441\u0441\u044B\u043B\u043A\u0443, \u0438 \u0434\u0440\u0443\u0433 \u043F\u0440\u0438\u0441\u043E\u0435\u0434\u0438\u043D\u0438\u0442\u0441\u044F.")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      display: "flex",
      alignItems: "center",
      gap: 10,
      background: "var(--surface-3)",
      borderRadius: 14,
      padding: "11px 8px 11px 14px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      fontSize: 13,
      color: "var(--text-2)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, link), /*#__PURE__*/React.createElement("button", {
    onClick: copyLink,
    className: "tap",
    style: {
      flexShrink: 0,
      border: 0,
      background: "var(--text)",
      color: "var(--card)",
      borderRadius: 999,
      padding: "8px 15px",
      fontSize: 12.5,
      fontWeight: 600
    }
  }, copied ? "Готово" : "Копировать")), /*#__PURE__*/React.createElement("button", {
    onClick: shareLink,
    className: "tap",
    style: {
      width: "100%",
      marginTop: 12,
      border: 0,
      borderRadius: 999,
      padding: 14,
      background: "var(--text)",
      color: "var(--card)",
      fontSize: 15,
      fontWeight: 600,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(I.Share, {
    size: 18
  }), " \u041F\u043E\u0434\u0435\u043B\u0438\u0442\u044C\u0441\u044F"), /*#__PURE__*/React.createElement("div", {
    style: {
      height: "max(8px, var(--tg-bottom-inset, 0px))"
    }
  }));
}
function HabitSettingsScreen() {
  var {
    navigate,
    params
  } = useNav();
  var {
    open: openSheet
  } = useSheet();
  var app = useApp();
  var editing = params?.mode === "edit";
  var preset = params?.preset; // quick-add chip → {i: emoji, t: label}
  var [name, setName] = useHS(editing ? params.habit.name : preset?.t || "Прогулка");
  var [iconPick, setIconPick] = useHS(editing ? params.habit.emoji : preset?.i || "👟");
  var [showIcons, setShowIcons] = useHS(false);
  var [color, setColor] = useHS(editing ? params.habit.color ?? null : preset?.color ?? null);
  var [goal, setGoal] = useHS(editing ? params.habit.goalPerDay || 1 : 1);
  // Days-of-week schedule — 7-long 0/1 mask, Пн..Вс. Default = every day.
  var [days, setDays] = useHS(editing && Array.isArray(params.habit.days) && params.habit.days.length === 7 ? params.habit.days.slice() : preset && Array.isArray(preset.days) && preset.days.length === 7 ? preset.days.slice() : [1, 1, 1, 1, 1, 1, 1]);
  var toggleDay = i => setDays(d => d.map((v, j) => j === i ? v ? 0 : 1 : v));
  // Reminder — a single setting: on/off + a time. Seeded from the habit when editing.
  var [reminderOn, setReminderOn] = useHS(editing ? !!(params.habit.reminder && params.habit.reminder.on) : true);
  var [reminderTime, setReminderTime] = useHS(editing && params.habit.reminder && params.habit.reminder.time ? params.habit.reminder.time : preset?.time || "09:00");
  var [shareOn, setShareOn] = useHS(true);
  var [inviteNote, setInviteNote] = useHS(""); // gentle inline note if the invite step can't run
  var [sharedTeam, setSharedTeam] = useHS(null); // the mini-team backing this shared habit (created once)
  var _isLive = app?.mode === "live";

  // Turn this habit into a SHARED one: a private mini-team + a main team-habit, then
  // hand back the {team, link} so we can open the share sheet. Created at most once
  // (cached in sharedTeam). Returns null + sets a gentle note if the cloud isn't ready.
  var ensureSharedTeam = async () => {
    if (sharedTeam) return sharedTeam;
    var nm = name.trim() || "Новая привычка";
    if (!window.bosCloud || !window.bosCloud.enabled()) {
      setInviteNote("Чтобы звать друзей, войди через Telegram.");
      return null;
    }
    try {
      var team = await window.bosCloud.createTeam({
        name: nm,
        emblem: iconPick,
        vis: "private"
      });
      if (!team || !team.id) {
        setInviteNote("Не удалось создать общую привычку — попробуй ещё раз.");
        return null;
      }
      try {
        await window.bosCloud.addTeamHabit(team.id, {
          name: nm,
          emoji: iconPick,
          isMain: true
        });
      } catch (e) {}
      var ref = "";
      try {
        ref = (await window.bosCloud.uid()) || "";
      } catch (e) {}
      var link = location.origin + location.pathname + "?team=" + team.id + (ref ? "&ref=" + ref : "");
      var made = {
        team,
        link
      };
      setSharedTeam(made);
      setInviteNote("");
      return made;
    } catch (e) {
      setInviteNote("Не удалось создать общую привычку — попробуй ещё раз.");
      return null;
    }
  };
  // Invite-now (the «Пригласить» button on live): build the shared team and open the
  // real share sheet. Falls back to a plain referral link if the team step fails.
  var inviteFriend = async () => {
    if (window.tgHaptic) {
      try {
        window.tgHaptic("light");
      } catch (e) {}
    }
    var made = await ensureSharedTeam();
    if (made) {
      openSheet(/*#__PURE__*/React.createElement(HabitInviteShareSheet, {
        habit: {
          name: name.trim() || "Новая привычка",
          emoji: iconPick,
          color
        },
        link: made.link
      }));
      return;
    }
    // Fallback: still let them share a plain referral link so the button is never dead.
    if (window.bosCloud && window.bosCloud.enabled()) {
      try {
        var ref = (await window.bosCloud.uid()) || "";
        var link = location.origin + location.pathname + (ref ? "?ref=" + ref : "");
        setInviteNote("");
        openSheet(/*#__PURE__*/React.createElement(HabitInviteShareSheet, {
          habit: {
            name: name.trim() || "Новая привычка",
            emoji: iconPick,
            color
          },
          link: link
        }));
      } catch (e) {}
    }
  };
  // Soft pastel palette so each real friend chip still gets a pleasant colour.
  var _FCOLORS = ["#e8c8a8", "#a8b9d4", "#d4b8e8", "#a8d4e8", "#b8e8c8", "#e8b8d4", "#d4c8e8"];
  // LIVE: real invited people (referral circle), nothing pre-selected. Demo keeps the 4 faces.
  var [shareFriends, setShareFriends] = useHS(_isLive ? [] : [{
    name: "Анна",
    i: "А",
    c: "#e8c8a8",
    on: true
  }, {
    name: "Марк",
    i: "М",
    c: "#a8b9d4",
    on: true
  }, {
    name: "Лена",
    i: "Л",
    c: "#d4b8e8",
    on: false
  }, {
    name: "Вик",
    i: "В",
    c: "#a8d4e8",
    on: false
  }]);
  React.useEffect(() => {
    if (!_isLive || !(window.bosCloud && window.bosCloud.enabled())) return;
    var on = true;
    try {
      window.bosCloud.invitedPeople().then(list => {
        if (!on || !Array.isArray(list)) return;
        setShareFriends(list.map((p, idx) => {
          var nm = p && p.username ? p.username : "Друг";
          return {
            name: nm,
            i: nm.charAt(0).toUpperCase(),
            c: _FCOLORS[idx % _FCOLORS.length],
            on: false
          };
        }));
      }).catch(() => {});
    } catch (e) {}
    return () => {
      on = false;
    };
  }, [_isLive]);
  var [type, setType] = useHS("build");
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      padding: "0 16px 24px"
    }
  }, /*#__PURE__*/React.createElement(PageHeader, {
    title: editing ? "Изменить привычку" : "Новая привычка",
    onBack: () => navigate("habits")
  }), /*#__PURE__*/React.createElement("div", {
    className: "section-label"
  }, "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435"), /*#__PURE__*/React.createElement("input", {
    className: "bos-input",
    value: name,
    onChange: e => setName(e.target.value),
    style: {
      marginTop: 8
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, "\u0418\u043A\u043E\u043D\u043A\u0430 \u0438 \u0446\u0432\u0435\u0442"), /*#__PURE__*/React.createElement("button", {
    className: "tap",
    "data-no-haptic": true,
    onClick: () => setShowIcons(v => !v),
    style: {
      width: "100%",
      background: "#fff",
      border: 0,
      borderRadius: 16,
      padding: 12,
      display: "flex",
      alignItems: "center",
      gap: 12,
      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 50,
      height: 50,
      borderRadius: 12,
      background: color ? color + "26" : "var(--surface-3)",
      display: "grid",
      placeItems: "center",
      fontSize: 26,
      transition: "background 0.2s"
    }
  }, iconPick), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "left",
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      fontSize: 16
    }
  }, name || "Привычка"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-4)"
    }
  }, color ? HABIT_COLOR_NAMES[color] : "Базовый", " \xB7 ", showIcons ? "выбери иконку" : "сменить иконку")), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 18,
    color: "var(--text-4)",
    style: {
      transform: showIcons ? "rotate(90deg)" : "none",
      transition: "transform 0.2s"
    }
  })), showIcons && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(6,1fr)",
      gap: 8,
      marginTop: 10
    }
  }, HABIT_ICONS.map(e => {
    var on = e === iconPick;
    return /*#__PURE__*/React.createElement("button", {
      key: e,
      className: "tap",
      "data-no-haptic": true,
      onClick: () => {
        setIconPick(e);
        setShowIcons(false);
      },
      style: {
        aspectRatio: "1/1",
        borderRadius: 14,
        fontSize: 24,
        border: 0,
        cursor: "pointer",
        background: on ? color || "#0a0a0a" : "var(--surface-3)",
        boxShadow: on ? "0 3px 10px rgba(0,0,0,0.18)" : "none",
        transform: on ? "scale(1.06)" : "none",
        transition: "transform 0.12s, background 0.12s"
      }
    }, e);
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      marginTop: 12,
      padding: "2px 2px 0",
      flexWrap: "wrap"
    }
  }, HABIT_COLORS.map(c => /*#__PURE__*/React.createElement("button", {
    key: c.id,
    className: "tap",
    "data-no-haptic": true,
    onClick: () => setColor(c.val),
    style: {
      width: 34,
      height: 34,
      borderRadius: "50%",
      background: c.val || "var(--surface-3)",
      border: 0,
      display: "grid",
      placeItems: "center",
      cursor: "pointer",
      boxShadow: color === c.val ? "0 0 0 2px var(--bg), 0 0 0 4px var(--text)" : c.val ? "none" : "inset 0 0 0 1px rgba(0,0,0,0.12)"
    }
  }, color === c.val && /*#__PURE__*/React.createElement(I.Check, {
    size: 15,
    strokeWidth: 3,
    color: c.val ? "#fff" : "var(--text-2)"
  })))), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, "\u0426\u0435\u043B\u044C"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#fff",
      borderRadius: 18,
      padding: 16,
      marginTop: 8,
      boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 600
    }
  }, goal, " ", goal === 1 ? "раз" : "раз(а)"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-4)"
    }
  }, "\u0438\u043B\u0438 \u0431\u043E\u043B\u044C\u0448\u0435 \u0432 \u0434\u0435\u043D\u044C")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setGoal(Math.max(1, goal - 1)),
    className: "tap",
    style: {
      width: 32,
      height: 32,
      borderRadius: 999,
      background: "var(--surface-3)",
      border: 0
    }
  }, "\u2212"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setGoal(goal + 1),
    className: "tap",
    style: {
      width: 32,
      height: 32,
      borderRadius: 999,
      background: "var(--surface-3)",
      border: 0
    }
  }, "\uFF0B"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      paddingTop: 14,
      borderTop: "1px solid rgba(0,0,0,0.06)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--text-3)"
    }
  }, "\u0414\u043D\u0438 \u043D\u0435\u0434\u0435\u043B\u0438"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--text-2)",
      fontWeight: 600
    }
  }, daysSummary(days))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      justifyContent: "space-between"
    }
  }, WEEKDAY_LABELS.map((w, i) => {
    var on = !!days[i];
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      className: "tap",
      "data-no-haptic": true,
      onClick: () => toggleDay(i),
      "aria-pressed": on,
      style: {
        flex: 1,
        aspectRatio: "1/1",
        maxWidth: 40,
        borderRadius: "50%",
        border: 0,
        cursor: "pointer",
        fontSize: 12.5,
        fontWeight: 600,
        letterSpacing: "-0.2px",
        background: on ? color || "#0a0a0a" : "var(--surface-3)",
        color: on ? "#fff" : "var(--text-4)",
        boxShadow: on ? "0 2px 6px rgba(0,0,0,0.14)" : "none",
        transform: on ? "scale(1.04)" : "none",
        transition: "transform 0.12s, background 0.12s, color 0.12s"
      }
    }, w);
  })))), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, "\u041D\u0430\u043F\u043E\u043C\u0438\u043D\u0430\u043D\u0438\u044F"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#fff",
      borderRadius: 18,
      padding: 16,
      marginTop: 8,
      boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      fontSize: 14,
      color: "var(--text-2)",
      lineHeight: 1.4
    }
  }, "\u041D\u0430\u043F\u043E\u043C\u0438\u043D\u0430\u0442\u044C \u043A\u0430\u0436\u0434\u044B\u0439 \u0434\u0435\u043D\u044C", /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-4)",
      marginTop: 2
    }
  }, reminderOn ? "Тихий пуш в выбранное время." : "Без напоминаний — отмечай когда удобно.")), /*#__PURE__*/React.createElement(Switch, {
    on: reminderOn,
    onChange: setReminderOn
  })), reminderOn && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      marginTop: 14,
      paddingTop: 14,
      borderTop: "1px solid rgba(0,0,0,0.06)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      fontSize: 14,
      color: "var(--text-2)"
    }
  }, /*#__PURE__*/React.createElement(I.Clock, {
    size: 16,
    color: "var(--text-3)"
  }), " \u0412\u0440\u0435\u043C\u044F"), /*#__PURE__*/React.createElement("input", {
    type: "time",
    value: reminderTime,
    onChange: e => setReminderTime(e.target.value || "09:00"),
    style: {
      border: 0,
      outline: 0,
      background: "var(--surface-3)",
      borderRadius: 999,
      padding: "8px 14px",
      fontSize: 16,
      fontWeight: 600,
      color: "var(--text)",
      fontVariantNumeric: "tabular-nums",
      letterSpacing: "-0.2px",
      WebkitAppearance: "none",
      appearance: "none",
      textAlign: "center"
    }
  }))), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 8
    }
  }, "\u041F\u043E\u0434\u0435\u043B\u0438\u0442\u044C\u0441\u044F \u0441 \u0434\u0440\u0443\u0433\u043E\u043C"), /*#__PURE__*/React.createElement("div", {
    "data-tour": "invite-friend",
    style: {
      background: "#fff",
      borderRadius: 18,
      padding: 16,
      marginTop: 8,
      boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      fontSize: 14,
      color: "var(--text-2)",
      lineHeight: 1.4
    }
  }, "\u0414\u0435\u043B\u0430\u0442\u044C \u044D\u0442\u043E \u0432\u043C\u0435\u0441\u0442\u0435", /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-4)",
      marginTop: 2
    }
  }, "\u0414\u0440\u0443\u0437\u044C\u044F \u0432\u0438\u0434\u044F\u0442, \u043A\u043E\u0433\u0434\u0430 \u0442\u044B \u043E\u0442\u043C\u0435\u0447\u0430\u0435\u0448\u044C\u0441\u044F. \u041E\u043D\u0438 \u043C\u043E\u0433\u0443\u0442 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0430\u0442\u044C \u0438\u043B\u0438 \u043F\u043E\u0434\u0442\u043E\u043B\u043A\u043D\u0443\u0442\u044C.")), /*#__PURE__*/React.createElement(Switch, {
    on: shareOn,
    onChange: setShareOn
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      borderRadius: 14,
      padding: "11px 12px",
      background: "#edfaf0",
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 30,
      height: 30,
      borderRadius: "50%",
      background: "#d6f3df",
      display: "grid",
      placeItems: "center",
      flexShrink: 0,
      fontSize: 15
    }
  }, "\uD83E\uDD1D"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "#1a7a3a",
      lineHeight: 1.4
    }
  }, /*#__PURE__*/React.createElement("b", null, "+75 XP"), ", \u043A\u043E\u0433\u0434\u0430 \u0434\u0440\u0443\u0433 \u043F\u0440\u0438\u0441\u043E\u0435\u0434\u0438\u043D\u0438\u0442\u0441\u044F. \u0410 \u0432\u0435\u0434\u0451\u0442\u0435 \u0432\u043C\u0435\u0441\u0442\u0435 \u2014 \u043A\u0430\u0436\u0434\u044B\u0439 \u0448\u0430\u0433 ", /*#__PURE__*/React.createElement("b", null, "+15"), " \u0432\u043C\u0435\u0441\u0442\u043E +10.")), shareOn && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginTop: 14,
      flexWrap: "wrap",
      alignItems: "center"
    }
  }, _isLive && shareFriends.length === 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: "var(--text-4)",
      lineHeight: 1.4
    }
  }, "\u041F\u043E\u043A\u0430 \u043D\u0435\u043A\u043E\u0433\u043E \u0432\u044B\u0431\u0440\u0430\u0442\u044C \u2014 \u043F\u0440\u0438\u0433\u043B\u0430\u0441\u0438 \u0434\u0440\u0443\u0433\u0430 \u043F\u043E \u0441\u0441\u044B\u043B\u043A\u0435."), shareFriends.map((p, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => setShareFriends(fs => fs.map((x, j) => j === i ? {
      ...x,
      on: !x.on
    } : x)),
    className: "tap",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "5px 11px 5px 5px",
      borderRadius: 999,
      background: p.on ? "#0a0a0a" : "var(--surface-3)",
      color: p.on ? "#fff" : "var(--text-3)",
      border: 0,
      fontSize: 12,
      fontWeight: 500
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 22,
      height: 22,
      borderRadius: "50%",
      background: p.c,
      display: "grid",
      placeItems: "center",
      fontSize: 11,
      fontWeight: 700,
      color: "rgba(0,0,0,0.55)"
    }
  }, p.i), p.name, p.on && /*#__PURE__*/React.createElement(I.Check, {
    size: 12,
    strokeWidth: 3
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      // LIVE: make it REAL — create a shared mini-team + habit and open the share sheet.
      if (_isLive) {
        inviteFriend();
        return;
      }
      // DEMO: cycle through the sample pool so the showcase stays lively.
      setShareFriends(fs => {
        var pool = [{
          name: "Соня",
          i: "С",
          c: "#e8b8d4"
        }, {
          name: "Дима",
          i: "Д",
          c: "#a8c0e8"
        }, {
          name: "Аля",
          i: "А",
          c: "#d4c8e8"
        }];
        var next = pool.find(p => !fs.some(f => f.name === p.name));
        return next ? [...fs, {
          ...next,
          on: true
        }] : fs;
      });
    },
    className: "tap",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "5px 11px",
      borderRadius: 999,
      background: "transparent",
      border: "1px dashed rgba(0,0,0,0.18)",
      color: "var(--text-3)",
      fontSize: 12,
      fontWeight: 500
    }
  }, /*#__PURE__*/React.createElement(I.Plus, {
    size: 12
  }), " \u041F\u0440\u0438\u0433\u043B\u0430\u0441\u0438\u0442\u044C")), shareOn && _isLive && inviteNote && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      fontSize: 12.5,
      color: "var(--text-4)",
      lineHeight: 1.4,
      padding: "0 2px"
    }
  }, inviteNote)), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, "\u0422\u0438\u043F \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0438"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(Segmented, {
    value: type,
    onChange: setType,
    options: [{
      value: "build",
      label: "Развивать"
    }, {
      value: "quit",
      label: "Бросить"
    }]
  })), /*#__PURE__*/React.createElement("button", {
    className: "bos-btn",
    style: {
      marginTop: 20
    },
    onClick: async () => {
      var nm = name.trim() || "Новая привычка";
      // Persist the full schedule + reminder on the habit. These extra fields ride
      // along into the live snapshot (addHabit/updateHabit spread whatever you pass).
      var base = {
        emoji: iconPick,
        name: nm,
        color,
        days: days.slice(),
        // 7-long Пн..Вс mask
        goalPerDay: goal,
        reminder: {
          on: reminderOn,
          time: reminderTime
        }
      };
      // SHARED habit: on live, if sharing is on, spin up the mini-team + team-habit and
      // open the share sheet. Guarded — if anything fails, the habit is still saved.
      if (_isLive && shareOn) {
        var made = await ensureSharedTeam();
        if (made && made.team) {
          base.shared = true;
          base.teamId = made.team.id;
        }
        if (editing) app?.updateHabit(params.habit.id, base);else app?.addHabit(base);
        navigate("habits"); // the sheet lives above the router, so it stays open over the list
        if (made && made.link) {
          openSheet(/*#__PURE__*/React.createElement(HabitInviteShareSheet, {
            habit: {
              name: nm,
              emoji: iconPick,
              color
            },
            link: made.link
          }));
        }
        return;
      }
      if (editing) app?.updateHabit(params.habit.id, base);else app?.addHabit(base);
      navigate("habits");
    }
  }, editing ? "Сохранить" : "Добавить привычку"), editing && /*#__PURE__*/React.createElement("button", {
    className: "tap",
    onClick: () => {
      app?.removeHabit(params.habit.id);
      navigate("habits");
    },
    style: {
      width: "100%",
      background: "transparent",
      border: 0,
      color: "var(--accent-red)",
      padding: 14,
      marginTop: 6,
      fontSize: 15
    }
  }, "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0443"));
}
window.HabitsScreen = HabitsScreen;
window.HabitSettingsScreen = HabitSettingsScreen;
window.AvatarStack = AvatarStack;
window.ShareHabitSheet = ShareHabitSheet;

/* Inline month calendar in the app's style — pick a goal PERIOD by tapping a
   start day, then an end day (like a booking date range). The distance between
   them is the goal's срок. Returns "14 окт – 21 ноя". 2026 demo year. */
function DeadlineCalendar({
  onPick,
  isLive = false
}) {
  var MON_SHORT = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  var MON_TITLE = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  var DAYS_IN = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  // LIVE: real calendar anchored to today. DEMO: frozen "today" = 28 апр 2026 (the showcase date).
  var _now = new Date();
  var TODAY_M = isLive ? _now.getMonth() : 3,
    TODAY_D = isLive ? _now.getDate() : 28,
    YEAR = isLive ? _now.getFullYear() : 2026;
  var [m, setM] = useHS(TODAY_M);
  var [start, setStart] = useHS(null); // { m, d }
  var [end, setEnd] = useHS(null);
  var startWeekday = (m * 3 + 3) % 7; // same synthetic alignment the app's other calendars use
  var cells = [];
  for (var i = 0; i < startWeekday; i++) cells.push(null);
  for (var d = 1; d <= DAYS_IN[m]; d++) cells.push(d);
  var idx = p => p.m * 40 + p.d; // monotonic, for ordering
  var doy = p => DAYS_IN.slice(0, p.m).reduce((a, b) => a + b, 0) + p.d; // day-of-year, for duration
  var past = d => m === TODAY_M && d < TODAY_D;
  var eqp = (p, d) => p && p.m === m && p.d === d;
  var inRange = d => start && end && idx({
    m,
    d
  }) > idx(start) && idx({
    m,
    d
  }) < idx(end);
  var fmt = p => `${p.d} ${MON_SHORT[p.m]}`;
  var pick = d => {
    var p = {
      m,
      d
    };
    if (!start || end) {
      setStart(p);
      setEnd(null);
      return;
    } // begin a fresh range
    if (idx(p) <= idx(start)) {
      setStart(p);
      setEnd(null);
      return;
    } // tapped before start → restart
    setEnd(p); // complete the range
  };
  var span = start && end ? doy(end) - doy(start) : 0;
  var durTxt = span <= 0 ? "" : span < 14 ? `${span} дн.` : span < 60 ? `${Math.round(span / 7)} нед.` : `${Math.round(span / 30)} мес.`;
  var hint = !start ? "Выберите начало срока" : !end ? "Теперь — дату окончания" : `${fmt(start)} – ${fmt(end)} · ${durTxt}`;
  var pager = dir => /*#__PURE__*/React.createElement("button", {
    className: "tap",
    "data-no-haptic": true,
    disabled: dir < 0 ? m <= TODAY_M : m >= 11,
    onClick: () => setM(Math.max(TODAY_M, Math.min(11, m + dir))),
    style: {
      width: 30,
      height: 30,
      borderRadius: 999,
      border: 0,
      background: "var(--surface-3)",
      opacity: (dir < 0 ? m <= TODAY_M : m >= 11) ? 0.3 : 1,
      display: "grid",
      placeItems: "center"
    }
  }, /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 16,
    style: dir < 0 ? {
      transform: "rotate(180deg)"
    } : undefined
  }));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#fff",
      borderRadius: 18,
      padding: 14,
      marginTop: 10,
      boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12
    }
  }, pager(-1), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 600,
      color: "var(--text)"
    }
  }, MON_TITLE[m], " ", YEAR), pager(1)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(7,1fr)",
      gap: 3,
      marginBottom: 4
    }
  }, ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"].map(w => /*#__PURE__*/React.createElement("div", {
    key: w,
    style: {
      textAlign: "center",
      fontSize: 10.5,
      color: "var(--text-4)",
      fontWeight: 600
    }
  }, w))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(7,1fr)",
      gap: 3
    }
  }, cells.map((d, i) => {
    if (d === null) return /*#__PURE__*/React.createElement("div", {
      key: i
    });
    var ends = eqp(start, d) || eqp(end, d);
    var mid = inRange(d);
    var today = m === TODAY_M && d === TODAY_D;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      className: "tap",
      "data-no-haptic": true,
      disabled: past(d),
      onClick: () => pick(d),
      style: {
        aspectRatio: "1/1",
        border: 0,
        borderRadius: ends ? 999 : mid ? 7 : 10,
        cursor: past(d) ? "default" : "pointer",
        background: ends ? "#0a0a0a" : mid ? "rgba(10,10,10,0.08)" : "transparent",
        color: ends ? "#fff" : "var(--text)",
        opacity: past(d) ? 0.3 : 1,
        fontSize: 13.5,
        fontWeight: ends || today ? 700 : 400,
        boxShadow: today && !ends ? "inset 0 0 0 1.5px rgba(0,0,0,0.16)" : "none"
      }
    }, d);
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      marginTop: 12,
      paddingTop: 11,
      borderTop: "1px solid rgba(0,0,0,0.06)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: start && end ? "var(--text)" : "var(--text-4)",
      fontWeight: start && end ? 600 : 400,
      minWidth: 0
    }
  }, hint), /*#__PURE__*/React.createElement("button", {
    className: "tap",
    disabled: !(start && end),
    onClick: () => onPick(`${fmt(start)} – ${fmt(end)}`),
    style: {
      flexShrink: 0,
      background: start && end ? "#0a0a0a" : "var(--surface-3)",
      color: start && end ? "#fff" : "var(--text-4)",
      border: 0,
      borderRadius: 999,
      padding: "8px 16px",
      fontSize: 13,
      fontWeight: 600
    }
  }, "\u0413\u043E\u0442\u043E\u0432\u043E")));
}

/* ─── GOAL SETTINGS — create / edit a goal ─────────────────────── */
function GoalSettingsScreen() {
  var {
    navigate,
    params
  } = useNav();
  var app = useApp();
  var editing = params?.mode === "edit";
  var g0 = editing ? params.goal : null;
  var [name, setName] = useHS(g0?.name || "Пробежать марафон");
  var [iconPick, setIconPick] = useHS(g0?.emoji || "🎯");
  var [showIcons, setShowIcons] = useHS(false);
  var [target, setTarget] = useHS(g0?.target || 22);
  var [unit, setUnit] = useHS(g0?.unit || "недель");
  var [deadline, setDeadline] = useHS(g0?.deadline || "Месяц");
  var [showCal, setShowCal] = useHS(false);
  var [linkHabit, setLinkHabit] = useHS(true);
  // REAL for every mode — the user's own habits, none pre-selected. Demo's store is
  // already seeded with sample habits, so the showcase still reads.
  var [linkedHabits, setLinkedHabits] = useHS(() => (app?.habits || []).map(h => ({
    e: h.emoji || "✨",
    n: h.name,
    on: false
  })));
  var toggleLinked = i => setLinkedHabits(hs => hs.map((h, j) => j === i ? {
    ...h,
    on: !h.on
  } : h));
  var QUICK_TERMS = ["Неделя", "Месяц", "1 год"];
  var svoyActive = showCal || !!deadline && !QUICK_TERMS.includes(deadline); // custom date/range → highlight «Свой срок»

  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      padding: "0 16px 24px"
    }
  }, /*#__PURE__*/React.createElement(PageHeader, {
    title: editing ? "Изменить цель" : "Новая цель",
    onBack: () => navigate("habits")
  }), /*#__PURE__*/React.createElement("div", {
    className: "section-label"
  }, "\u0427\u0435\u0433\u043E \u0442\u044B \u0445\u043E\u0447\u0435\u0448\u044C"), /*#__PURE__*/React.createElement("input", {
    className: "bos-input",
    value: name,
    onChange: e => setName(e.target.value),
    style: {
      marginTop: 8
    },
    placeholder: "\u043D\u0430\u043F\u0440. \u041F\u0440\u043E\u0431\u0435\u0436\u0430\u0442\u044C \u043C\u0430\u0440\u0430\u0444\u043E\u043D"
  }), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, "\u0418\u043A\u043E\u043D\u043A\u0430"), /*#__PURE__*/React.createElement("button", {
    className: "tap",
    "data-no-haptic": true,
    onClick: () => setShowIcons(v => !v),
    style: {
      marginTop: 8,
      width: "100%",
      background: "#fff",
      border: 0,
      borderRadius: 16,
      padding: 12,
      display: "flex",
      alignItems: "center",
      gap: 12,
      boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 50,
      height: 50,
      borderRadius: 12,
      background: "#e8e8e8",
      display: "grid",
      placeItems: "center",
      fontSize: 26
    }
  }, iconPick), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "left",
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      fontSize: 16
    }
  }, name || "Цель"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-4)"
    }
  }, showIcons ? "выбери иконку" : "нажми, чтобы изменить")), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 18,
    color: "var(--text-4)",
    style: {
      transform: showIcons ? "rotate(90deg)" : "none",
      transition: "transform 0.2s"
    }
  })), showIcons && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(6,1fr)",
      gap: 8,
      marginTop: 10
    }
  }, HABIT_ICONS.map(e => {
    var on = e === iconPick;
    return /*#__PURE__*/React.createElement("button", {
      key: e,
      className: "tap",
      "data-no-haptic": true,
      onClick: () => {
        setIconPick(e);
        setShowIcons(false);
      },
      style: {
        aspectRatio: "1/1",
        borderRadius: 14,
        fontSize: 24,
        border: 0,
        cursor: "pointer",
        background: on ? "#0a0a0a" : "var(--surface-3)",
        boxShadow: on ? "0 3px 10px rgba(0,0,0,0.18)" : "none",
        transform: on ? "scale(1.06)" : "none",
        transition: "transform 0.12s, background 0.12s"
      }
    }, e);
  })), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, "\u0426\u0435\u043B\u044C (\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435)"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#fff",
      borderRadius: 18,
      padding: 16,
      marginTop: 8,
      boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    inputMode: "numeric",
    pattern: "[0-9]*",
    value: target,
    onChange: e => setTarget(parseInt(e.target.value.replace(/\D/g, "")) || 0),
    className: "goal-num",
    style: {
      flex: "0 0 90px",
      fontSize: 28,
      fontWeight: 700,
      color: "var(--text)",
      border: 0,
      outline: 0,
      background: "transparent",
      padding: 0
    }
  }), /*#__PURE__*/React.createElement("input", {
    value: unit,
    onChange: e => setUnit(e.target.value),
    style: {
      flex: 1,
      minWidth: 0,
      fontSize: 18,
      color: "var(--text-3)",
      border: 0,
      outline: 0,
      background: "transparent",
      padding: "4px 0"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-4)",
      marginTop: 6
    }
  }, "\u041E\u0442 \u044D\u0442\u043E\u0433\u043E \u0447\u0438\u0441\u043B\u0430 \u0431\u0443\u0434\u0435\u0442 \u0441\u0447\u0438\u0442\u0430\u0442\u044C\u0441\u044F \u043F\u0440\u043E\u0433\u0440\u0435\u0441\u0441 \u0446\u0435\u043B\u0438.")), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, "\u0421\u0440\u043E\u043A"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#fff",
      borderRadius: 18,
      padding: "14px 16px",
      marginTop: 8,
      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(I.Calendar, {
    size: 18,
    color: "var(--text-3)"
  }), /*#__PURE__*/React.createElement("input", {
    value: deadline,
    onChange: e => setDeadline(e.target.value),
    placeholder: "\u043D\u0430\u043F\u0440. 14 \u043E\u043A\u0442",
    style: {
      flex: 1,
      fontSize: 16,
      border: 0,
      outline: 0,
      background: "transparent"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowCal(v => !v),
    className: "tap",
    "data-no-haptic": true,
    style: {
      flex: 1,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      borderRadius: 999,
      padding: "8px 4px",
      fontSize: 12.5,
      whiteSpace: "nowrap",
      background: svoyActive ? "#0a0a0a" : "#fff",
      color: svoyActive ? "#fff" : "var(--text-3)",
      border: svoyActive ? "0" : "1px solid rgba(0,0,0,0.06)"
    }
  }, /*#__PURE__*/React.createElement(I.Calendar, {
    size: 12
  }), " \u0421\u0432\u043E\u0439 \u0441\u0440\u043E\u043A"), QUICK_TERMS.map(q => {
    var active = !showCal && deadline === q;
    return /*#__PURE__*/React.createElement("button", {
      key: q,
      onClick: () => {
        setDeadline(q);
        setShowCal(false);
      },
      className: "tap",
      "data-no-haptic": true,
      style: {
        flex: 1,
        borderRadius: 999,
        padding: "8px 4px",
        fontSize: 12.5,
        whiteSpace: "nowrap",
        textAlign: "center",
        background: active ? "#0a0a0a" : "#fff",
        color: active ? "#fff" : "var(--text-3)",
        border: active ? "0" : "1px solid rgba(0,0,0,0.06)"
      }
    }, q);
  })), showCal && /*#__PURE__*/React.createElement(DeadlineCalendar, {
    isLive: app?.mode === "live",
    onPick: s => {
      setDeadline(s);
      setShowCal(false);
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, "\u041F\u0440\u0438\u0432\u044F\u0437\u0430\u0442\u044C \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0443"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#fff",
      borderRadius: 18,
      padding: 16,
      marginTop: 8,
      boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: "var(--text-2)",
      lineHeight: 1.4
    }
  }, "\u041F\u043E\u0434\u043A\u0440\u0435\u043F\u0438 \u044D\u0442\u0443 \u0446\u0435\u043B\u044C \u0435\u0436\u0435\u0434\u043D\u0435\u0432\u043D\u043E\u0439 \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u043E\u0439"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-4)",
      marginTop: 2
    }
  }, "\u041A\u0430\u0436\u0434\u0430\u044F \u043E\u0442\u043C\u0435\u0442\u043A\u0430 \u043F\u0440\u0438\u0431\u043B\u0438\u0436\u0430\u0435\u0442 \u043A \u0446\u0435\u043B\u0438.")), /*#__PURE__*/React.createElement(Switch, {
    on: linkHabit,
    onChange: setLinkHabit
  })), linkHabit && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginTop: 14,
      flexWrap: "wrap",
      alignItems: "center"
    }
  }, linkedHabits.length === 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: "var(--text-4)",
      lineHeight: 1.4
    }
  }, "\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u0441\u043E\u0437\u0434\u0430\u0439 \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0443 \u2014 \u043F\u043E\u0442\u043E\u043C \u043F\u0440\u0438\u0432\u044F\u0436\u0435\u0448\u044C \u0435\u0451 \u043A \u0446\u0435\u043B\u0438."), linkedHabits.map((h, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    className: "tap",
    "data-no-haptic": true,
    onClick: () => toggleLinked(i),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "5px 11px 5px 5px",
      borderRadius: 999,
      background: h.on ? "#0a0a0a" : "#e8e8e8",
      color: h.on ? "#fff" : "var(--text-3)",
      border: 0,
      fontSize: 12,
      fontWeight: 500,
      transition: "background 0.15s, color 0.15s"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 22,
      height: 22,
      borderRadius: "50%",
      background: "#fff",
      display: "grid",
      placeItems: "center",
      fontSize: 13
    }
  }, h.e), h.n, h.on && /*#__PURE__*/React.createElement(I.Check, {
    size: 12,
    strokeWidth: 3
  }))), /*#__PURE__*/React.createElement("button", {
    className: "tap",
    onClick: () => navigate("habit-settings", {
      mode: "create"
    }),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "5px 11px",
      borderRadius: 999,
      background: "transparent",
      border: "1px dashed rgba(0,0,0,0.18)",
      color: "var(--text-3)",
      fontSize: 12,
      fontWeight: 500
    }
  }, /*#__PURE__*/React.createElement(I.Plus, {
    size: 12
  }), " \u041D\u043E\u0432\u0430\u044F \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0430"))), /*#__PURE__*/React.createElement("button", {
    className: "bos-btn",
    style: {
      marginTop: 20
    },
    onClick: () => {
      var data = {
        emoji: iconPick,
        name: name.trim() || "Новая цель",
        target: Math.max(1, target),
        unit,
        deadline
      };
      if (editing) app?.updateGoal(g0.id, data);else app?.addGoal(data);
      navigate("habits");
    }
  }, editing ? "Сохранить" : "Создать цель"), editing && /*#__PURE__*/React.createElement("button", {
    className: "tap",
    onClick: () => {
      app?.removeGoal(g0.id);
      navigate("habits");
    },
    style: {
      width: "100%",
      background: "transparent",
      border: 0,
      color: "var(--accent-red)",
      padding: 14,
      marginTop: 6,
      fontSize: 15
    }
  }, "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0446\u0435\u043B\u044C"));
}

/* ─── INFO SCREEN — knowledge articles ─────────────────────────── */
var INFO_TOPICS = {
  "habits-basics": {
    emoji: "🌱",
    eyebrow: "5 мин чтения",
    title: "Основы привычек",
    lede: "Привычки держатся не на силе воли. Они держатся на том, чтобы одно маленькое действие давалось почти без усилий — и так каждый день, пока мозг не перестанет спрашивать «зачем».",
    sections: [{
      i: "1",
      h: "Сделай крошечным",
      b: "Если не вытянешь её в самый трудный день — она слишком большая. Две минуты медитации каждый день лучше, чем полчаса раз в неделю. Закрепится — будешь растить."
    }, {
      i: "2",
      h: "Привяжи её",
      b: "Поставь новую привычку поверх того, что уже делаешь: «После того как налью утренний кофе, я напишу одну строку в дневник». Старая привычка становится пусковым сигналом."
    }, {
      i: "3",
      h: "Отмечай, чтобы видеть движение",
      b: "Серия — это твоё обещание самому себе, и его видно. Отмечай привычку даже в трудный день — пусть даже по минимуму. Не рви цепочку."
    }, {
      i: "4",
      h: "Никогда не пропускай дважды",
      b: "Один срыв — это восстановление. Два — новый паттерн. Если пропустил день, твоя единственная задача завтра — появиться, хотя бы частично. Восстанавливайся, а не начинай заново."
    }, {
      i: "5",
      h: "Обустрой пространство",
      b: "Поставь кроссовки у двери. Убери снеки с глаз долой. Привычки живут в окружении — сделай хорошие очевидными, а плохие — незаметными."
    }],
    pull: "«Ты не поднимаешься до уровня своих целей. Ты падаешь до уровня своих систем.»",
    next: {
      topic: "goals-101",
      t: "Ставь хорошие цели",
      e: "🎯"
    }
  },
  "goals-101": {
    emoji: "🎯",
    eyebrow: "5 мин чтения",
    title: "Ставь хорошие цели",
    lede: "Цель — это вопрос, на который отвечают твои привычки. Задай вопрос правильно — и ежедневная работа сама знает, что делать.",
    sections: [{
      i: "1",
      h: "Результат против процесса",
      b: "«Пробежать марафон» — это результат. «Бегать 4 раза в неделю» — это процесс. Цель-результат задаёт направление; отслеживай процесс, чтобы реально двигаться."
    }, {
      i: "2",
      h: "Сделай конкретной",
      b: "«Быть здоровее» — это желание. «Спать 7,5 часов 6 ночей в неделю к июлю» — это цель. Конкретно значит измеримо, со сроком и честно."
    }, {
      i: "3",
      h: "Разбей на недели",
      b: "Цель на 12 недель — это просто 12 недельных целей, сложенных вместе. Раздели гору на холмы, которые можно преодолеть за неделю."
    }, {
      i: "4",
      h: "Привяжи одну привычку",
      b: "Каждой цели нужна ежедневная опора. Если не можешь назвать привычку, которая продвигает цель, она будет дрейфовать."
    }, {
      i: "5",
      h: "Празднуй малое",
      b: "Половина пути — это настоящий рубеж. Признай это. Мозг, который получает награду за усилия, появляется и завтра."
    }],
    pull: "«Результаты — это мечты. Привычки — это действие.»",
    next: {
      topic: "habits-basics",
      t: "Основы привычек",
      e: "🌱"
    }
  }
};
function InfoScreen() {
  var {
    navigate,
    params
  } = useNav();
  var topic = INFO_TOPICS[params?.topic] || INFO_TOPICS["habits-basics"];
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      padding: "0 16px 24px"
    }
  }, /*#__PURE__*/React.createElement(PageHeader, {
    title: topic.title,
    onBack: () => navigate("habits")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#fff",
      borderRadius: 24,
      padding: "22px 20px",
      boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 56,
      height: 56,
      borderRadius: 16,
      background: "#e8e8e8",
      display: "grid",
      placeItems: "center",
      fontSize: 30,
      marginBottom: 12
    }
  }, topic.emoji), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1.4,
      fontWeight: 600
    }
  }, topic.eyebrow), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--bos-title-font)",
      fontSize: 28,
      lineHeight: 1.15,
      letterSpacing: "-0.5px",
      marginTop: 4,
      color: "var(--text)"
    }
  }, topic.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      color: "var(--text-3)",
      marginTop: 12,
      lineHeight: 1.55,
      letterSpacing: "-0.1px"
    }
  }, topic.lede)), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#0a0a0a",
      color: "#fff",
      borderRadius: 22,
      padding: "20px 22px",
      marginTop: 12,
      position: "relative",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      top: -10,
      right: -10,
      fontSize: 100,
      opacity: 0.06,
      fontFamily: "var(--bos-title-font)",
      lineHeight: 1
    }
  }, "\""), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--bos-title-font)",
      fontSize: 18,
      lineHeight: 1.4,
      position: "relative"
    }
  }, topic.pull)), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, topic.sections.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      background: "#fff",
      borderRadius: 22,
      padding: 18,
      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      display: "flex",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 32,
      height: 32,
      borderRadius: "50%",
      background: "#0a0a0a",
      color: "#fff",
      display: "grid",
      placeItems: "center",
      fontSize: 13,
      fontWeight: 700,
      flexShrink: 0
    }
  }, s.i), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 600,
      color: "var(--text)",
      letterSpacing: "-0.2px"
    }
  }, s.h), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: "var(--text-3)",
      marginTop: 6,
      lineHeight: 1.55,
      textWrap: "pretty"
    }
  }, s.b))))), /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate(params?.topic === "goals-101" ? "goal-settings" : "habit-settings", {
      mode: "create"
    }),
    className: "tap",
    style: {
      width: "100%",
      background: "#0a0a0a",
      color: "#fff",
      border: 0,
      borderRadius: 999,
      padding: 16,
      fontSize: 15,
      fontWeight: 600,
      marginTop: 18
    }
  }, params?.topic === "goals-101" ? "Поставить цель" : "Создать привычку"), topic.next && /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("info", {
      topic: topic.next.topic
    }),
    className: "tap",
    style: {
      marginTop: 12,
      width: "100%",
      background: "transparent",
      border: 0,
      padding: 0,
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#fff",
      borderRadius: 18,
      padding: 14,
      display: "flex",
      alignItems: "center",
      gap: 12,
      boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 12,
      background: "#e8e8e8",
      display: "grid",
      placeItems: "center",
      fontSize: 20
    }
  }, topic.next.e), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1.2,
      fontWeight: 600
    }
  }, "\u0414\u0430\u043B\u0435\u0435"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 500
    }
  }, topic.next.t)), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 18,
    color: "var(--text-4)"
  }))));
}
window.GoalSettingsScreen = GoalSettingsScreen;
window.InfoScreen = InfoScreen;

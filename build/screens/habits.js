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

/* Avatar stack — small face pile showing who else is doing this habit */
var AVATAR_PALETTE = ["#a8b9d4", "#e8c8a8", "#a8d4e8", "#d4b8e8", "#b8e8c8", "#e8b8b8", "#c8c8e8"];

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
  }, visible.map((p, i) => /*#__PURE__*/React.createElement("div", {
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
  var [friends, setFriends] = useHS([{
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
  }]);
  var toggleF = idx => setFriends(f => f.map((x, i) => i === idx ? {
    ...x,
    on: !x.on
  } : x));
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
  }, "\u0414\u0435\u043B\u0430\u0442\u044C \u0432\u043C\u0435\u0441\u0442\u0435"), /*#__PURE__*/React.createElement("div", {
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
    style: {
      padding: "4px 4px 12px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-4)",
      letterSpacing: 0.4
    }
  }, "\u0422\u0432\u043E\u0439 \u0434\u0435\u043D\u044C"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 24,
      fontWeight: 800,
      letterSpacing: "-0.6px",
      color: "var(--text)",
      marginTop: 2,
      fontFamily: "var(--bos-title-font)"
    }
  }, "\u041F\u0440\u0430\u043A\u0442\u0438\u043A\u0430")), /*#__PURE__*/React.createElement("div", {
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
      background: TH.cardBg,
      borderRadius: 22,
      overflow: "hidden",
      boxShadow: cardShadow,
      color: "var(--text)"
    }
  }, habits.map((h, idx) => /*#__PURE__*/React.createElement("div", {
    key: h.id
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
  }), h.friends?.length > 0 && /*#__PURE__*/React.createElement("span", null, "\u0441\u043E\u0432\u043C\u0435\u0441\u0442\u043D\u043E"))), h.duration && !h.done && /*#__PURE__*/React.createElement("button", {
    className: "tap",
    "data-no-haptic": true,
    onClick: e => {
      e.stopPropagation();
      navigate("focus", {
        habit: h
      });
    },
    style: {
      width: 30,
      height: 30,
      borderRadius: "50%",
      background: TH.playBtnBg,
      border: 0,
      color: TH.playBtnFg,
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(I.Play, {
    size: 11
  })), /*#__PURE__*/React.createElement("button", {
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
  })))), idx < habits.length - 1 && /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: TH.divider
    }
  })))) : goals.length === 0 ? /*#__PURE__*/React.createElement("button", {
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
      background: TH.cardBg,
      borderRadius: 22,
      overflow: "hidden",
      boxShadow: cardShadow,
      color: "var(--text)"
    }
  }, goals.map((g, idx) => {
    var pct = g.current / g.target;
    return /*#__PURE__*/React.createElement("div", {
      key: g.id
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
        width: pct * 100 + "%"
      }
    }))), idx < goals.length - 1 && /*#__PURE__*/React.createElement("div", {
      style: {
        height: 1,
        background: TH.divider
      }
    }));
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
function HabitSettingsScreen() {
  var {
    navigate,
    params
  } = useNav();
  var app = useApp();
  var editing = params?.mode === "edit";
  var preset = params?.preset; // quick-add chip → {i: emoji, t: label}
  var [name, setName] = useHS(editing ? params.habit.name : preset?.t || "Прогулка");
  var [iconPick, setIconPick] = useHS(editing ? params.habit.emoji : preset?.i || "👟");
  var [color, setColor] = useHS(editing ? params.habit.color ?? null : null);
  var [goal, setGoal] = useHS(1);
  var [reminderOn, setReminderOn] = useHS(true);
  var [shareOn, setShareOn] = useHS(true);
  var [shareFriends, setShareFriends] = useHS([{
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
    onClick: () => navigate("icon-picker", {
      current: iconPick,
      onPick: "habit-icon"
    }),
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
  }, color ? HABIT_COLOR_NAMES[color] : "Базовый", " \xB7 \u0441\u043C\u0435\u043D\u0438\u0442\u044C \u0438\u043A\u043E\u043D\u043A\u0443")), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 18,
    color: "var(--text-4)"
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
      display: "flex",
      gap: 8,
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "chip"
  }, /*#__PURE__*/React.createElement(I.Refresh, {
    size: 14
  }), " \u0415\u0436\u0435\u0434\u043D\u0435\u0432\u043D\u043E"), /*#__PURE__*/React.createElement("span", {
    className: "chip"
  }, /*#__PURE__*/React.createElement(I.Calendar, {
    size: 14
  }), " \u041A\u0430\u0436\u0434\u044B\u0439 \u0434\u0435\u043D\u044C"))), /*#__PURE__*/React.createElement("div", {
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
      color: "var(--text-3)",
      lineHeight: 1.4
    }
  }, "\u041D\u0435 \u0437\u0430\u0431\u0443\u0434\u044C \u0432\u044B\u0434\u0435\u043B\u0438\u0442\u044C \u0432\u0440\u0435\u043C\u044F \u043D\u0430 \u0442\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043A\u0443 \u0441\u0435\u0433\u043E\u0434\u043D\u044F."), /*#__PURE__*/React.createElement(Switch, {
    on: reminderOn,
    onChange: setReminderOn
  })), reminderOn && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "chip"
  }, /*#__PURE__*/React.createElement(I.Clock, {
    size: 14
  }), " 09:30"), /*#__PURE__*/React.createElement("span", {
    className: "chip"
  }, /*#__PURE__*/React.createElement(I.Bell, {
    size: 14
  }), " \u041A\u0430\u0436\u0434\u044B\u0439 \u0434\u0435\u043D\u044C"))), /*#__PURE__*/React.createElement("button", {
    className: "tap",
    style: {
      width: "100%",
      background: "transparent",
      border: 0,
      color: "var(--text-2)",
      padding: 14,
      fontSize: 15,
      fontWeight: 500
    }
  }, "+ \u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043D\u0430\u043F\u043E\u043C\u0438\u043D\u0430\u043D\u0438\u0435"), /*#__PURE__*/React.createElement("div", {
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
      flexWrap: "wrap"
    }
  }, shareFriends.map((p, i) => /*#__PURE__*/React.createElement("button", {
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
    onClick: () => setShareFriends(fs => {
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
    }),
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
  }), " \u041F\u0440\u0438\u0433\u043B\u0430\u0441\u0438\u0442\u044C"))), /*#__PURE__*/React.createElement("div", {
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
    className: "bos-btn light",
    style: {
      marginTop: 28
    },
    onClick: () => {
      var nm = name.trim() || "Новая привычка";
      if (editing) app?.updateHabit(params.habit.id, {
        emoji: iconPick,
        name: nm,
        color
      });else app?.addHabit({
        emoji: iconPick,
        name: nm,
        color
      });
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
  var [target, setTarget] = useHS(g0?.target || 22);
  var [unit, setUnit] = useHS(g0?.unit || "недель");
  var [deadline, setDeadline] = useHS(g0?.deadline || "14 окт");
  var [linkHabit, setLinkHabit] = useHS(true);
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
    onClick: () => navigate("icon-picker", {
      current: iconPick,
      onPick: "goal-icon"
    }),
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
  }, "\u041D\u0430\u0436\u043C\u0438, \u0447\u0442\u043E\u0431\u044B \u0438\u0437\u043C\u0435\u043D\u0438\u0442\u044C")), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 18,
    color: "var(--text-4)"
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
  }, "\u042D\u0442\u043E \u0431\u0443\u0434\u0435\u0442 \u0437\u043D\u0430\u043C\u0435\u043D\u0430\u0442\u0435\u043B\u0435\u043C \u043F\u0440\u043E\u0433\u0440\u0435\u0441\u0441\u0430 \u043D\u0430 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0435 \u0446\u0435\u043B\u0438.")), /*#__PURE__*/React.createElement("div", {
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
      marginTop: 8,
      flexWrap: "wrap"
    }
  }, ["Эта неделя", "Этот месяц", "3 месяца", "1 год"].map((q, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => setDeadline(q),
    className: "tap",
    style: {
      background: "#fff",
      border: "1px solid rgba(0,0,0,0.05)",
      borderRadius: 999,
      padding: "6px 12px",
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, q))), /*#__PURE__*/React.createElement("div", {
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
  }, "\u041A\u0430\u0436\u0434\u0430\u044F \u043E\u0442\u043C\u0435\u0442\u043A\u0430 \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u043F\u0440\u043E\u0434\u0432\u0438\u0433\u0430\u0435\u0442 \u0446\u0435\u043B\u044C.")), /*#__PURE__*/React.createElement(Switch, {
    on: linkHabit,
    onChange: setLinkHabit
  })), linkHabit && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginTop: 14,
      flexWrap: "wrap"
    }
  }, [{
    e: "🏃🏼‍♀️",
    n: "утренняя пробежка",
    on: true
  }, {
    e: "🧘🏼‍♀️",
    n: "медитация",
    on: false
  }, {
    e: "📚",
    n: "читать книгу",
    on: false
  }].map((h, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    className: "tap",
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
      fontWeight: 500
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
    className: "bos-btn light",
    style: {
      marginTop: 28
    },
    onClick: () => {
      var data = {
        emoji: iconPick,
        name: name.trim() || "Новая цель",
        target,
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
    lede: "Привычки — это не о силе воли. Это о снижении сопротивления одному маленькому действию — каждый день — пока мозг не перестанет спрашивать «зачем».",
    sections: [{
      i: "1",
      h: "Сделай крошечным",
      b: "Если не можешь сделать это в самый худой день — это слишком большое. Две минуты медитации лучше тридцати раз в неделю. Когда привычка закрепится — её можно растить."
    }, {
      i: "2",
      h: "Привяжи её",
      b: "Поставь новую привычку поверх того, что уже делаешь: «После того как налью утренний кофе, я напишу одну строку в дневник». Старая привычка становится пусковым сигналом."
    }, {
      i: "3",
      h: "Отслеживай, чтобы видеть импульс",
      b: "Серия — это видимое обещание самому себе. Отмечай привычку даже в самый худой день — даже если сделал только мини-версию. Не рви цепочку."
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

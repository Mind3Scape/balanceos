/* HABITS — LIVE-only fork of HabitsScreen (real Telegram user, app.mode === "live"
   is ALWAYS true here). Unlike the HOME screen, this screen KEEPS its own
   «Привычки / Цели» segmented switcher (that toggle is correct here), the
   «Быстрое добавление» quick-add chips and the «Обучение» cards — those are not
   demo-only. The only thing the live fork hard-codes is the iOS-weight primary
   typography: the habit NAME and the goal NAME always render at fontWeight 600 +
   color var(--text) (the `_isLive ? …` ternaries collapse to the live branch).
   Everything else reuses the shared core/ toolkit (EMOJI_CHIPS, HabitRing,
   AvatarStack) + the shared_live.jsx forks (ShareHabitSheetLive, HabitWeekStrip +
   bosHabitColor/BOS_APPLE_COLORS) + framework (SwipeRow, HabitCheck, I, hooks
   useApp/useNav/useSheet). The ONLY new top-level declaration in this file is
   `function HabitsLive`. */
function HabitsLive() {
  var {
    navigate
  } = useNav();
  var {
    open: openSheet
  } = useSheet();
  var app = useApp();
  // Real Telegram user → iOS-weight primary labels are ALWAYS on here.
  var wrapRef = React.useRef(null);
  var [isDark, setIsDark] = React.useState(false);
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

  // «Обучение» cards can be hidden once read (David) — persisted, restorable from Settings.
  var [learnHidden, setLearnHidden] = React.useState(() => typeof bosLearnHidden === "function" ? bosLearnHidden() : false);
  React.useEffect(() => {
    var sync = () => setLearnHidden(typeof bosLearnHidden === "function" ? bosLearnHidden() : false);
    window.addEventListener("bos:learnchange", sync);
    return () => window.removeEventListener("bos:learnchange", sync);
  }, []);
  var hideLearn = () => {
    if (typeof bosSetLearnHidden === "function") bosSetLearnHidden(true);
    setLearnHidden(true);
  };
  var showLearn = () => {
    if (typeof bosSetLearnHidden === "function") bosSetLearnHidden(false);
    setLearnHidden(false);
  };
  // Shared store — same list the Home screen reads/writes.
  var habits = app?.habits || [];
  var goals = app?.goals || [];
  var toggle = app?.toggleHabit || (() => {});
  var remove = app?.removeHabit || (() => {});
  var removeGoal = app?.removeGoal || (() => {});
  var rowBg = isDark ? "#141414" : "#ffffff"; // opaque so swipe actions stay hidden until revealed
  // The floating «+» is the ONE universal create entry — it opens a small menu (B1).
  var [createOpen, setCreateOpen] = React.useState(false);
  var addBtnRef = React.useRef(null);
  return /*#__PURE__*/React.createElement("div", {
    ref: wrapRef,
    className: "page-in",
    style: {
      padding: "0 12px 24px"
    }
  }, /*#__PURE__*/React.createElement(CreateMenuLive, {
    open: createOpen,
    onClose: () => setCreateOpen(false),
    anchorRef: addBtnRef,
    navigate: navigate
  }), /*#__PURE__*/React.createElement("div", {
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
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      overflowX: "auto",
      scrollbarWidth: "none",
      WebkitOverflowScrolling: "touch",
      touchAction: "pan-x",
      padding: "3px 52px 3px 4px",
      WebkitMaskImage: "radial-gradient(circle at calc(100% - 22px) 50%, transparent 30px, #000 50px)",
      maskImage: "radial-gradient(circle at calc(100% - 22px) 50%, transparent 30px, #000 50px)"
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
  })))), /*#__PURE__*/React.createElement("button", {
    ref: addBtnRef,
    "data-tour": "add",
    onClick: () => {
      setCreateOpen(true);
      if (window.tgHaptic) {
        try {
          window.tgHaptic("light");
        } catch (e) {}
      }
    },
    className: "tap",
    title: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C",
    "aria-haspopup": "menu",
    "aria-expanded": createOpen,
    style: {
      position: "absolute",
      top: "50%",
      right: 0,
      transform: "translateY(-50%)",
      width: 44,
      height: 44,
      borderRadius: 999,
      background: TH.addBtnBg,
      color: TH.addBtnFg,
      border: 0,
      display: "grid",
      placeItems: "center",
      boxShadow: isDark ? "0 2px 10px rgba(0,0,0,0.5)" : "0 3px 10px rgba(0,0,0,0.12)"
    }
  }, /*#__PURE__*/React.createElement(I.Plus, {
    size: 18,
    strokeWidth: 2.2,
    style: {
      transition: "transform 0.34s cubic-bezier(0.34,1.5,0.4,1)",
      transform: createOpen ? "rotate(45deg)" : "none"
    }
  })))), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 2,
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
      from: "habits"
    }),
    style: {
      padding: "14px 16px"
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
      borderRadius: 14,
      background: h.color ? h.color + "26" : TH.iconBg,
      display: "grid",
      placeItems: "center",
      fontSize: 20,
      flexShrink: 0
    }
  }, bosIcon(h.emoji, 22, h.color)), /*#__PURE__*/React.createElement("div", {
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
  }, h.name), (h.friends?.length > 0 || h.duration > 0) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      marginTop: 3,
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
  }), " ", h.duration, " \u043C\u0438\u043D"), h.duration > 0 && h.friends?.length > 0 && /*#__PURE__*/React.createElement("span", null, "\xB7"), h.friends?.length > 0 && /*#__PURE__*/React.createElement("span", null, "\u0432\u043C\u0435\u0441\u0442\u0435"))), h.duration > 0 && !h.done && !(h.goalPerDay > 1) && /*#__PURE__*/React.createElement(HabitRing, {
    habit: h,
    dark: isDark,
    onComplete: () => {
      if (!h.done) toggle(h.id);
    }
  }), h.goalPerDay > 1 ? /*#__PURE__*/React.createElement(HabitCountCheck, {
    habit: h,
    app: app,
    xp: 10
  }) : /*#__PURE__*/React.createElement(HabitCheck, {
    done: h.done,
    onToggle: () => toggle(h.id),
    xp: 10,
    float: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement(HabitWeekStrip, {
    habit: h
  }), /*#__PURE__*/React.createElement(HabitBuddyAvatarsLive, {
    habit: h,
    size: 22,
    max: 5
  }))))))), /*#__PURE__*/React.createElement("div", {
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
      marginTop: 10,
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
        borderRadius: 22,
        overflow: "hidden",
        boxShadow: cardShadow,
        background: TH.cardBg
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
        borderRadius: 14,
        background: g.color ? g.color + "26" : TH.iconBg,
        display: "grid",
        placeItems: "center",
        fontSize: 20,
        flexShrink: 0
      }
    }, bosIcon(g.emoji, 20, g.color)), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15.5,
        color: "var(--text)",
        letterSpacing: "-0.2px",
        fontWeight: 600
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
        width: Math.min(1, pct) * 100 + "%",
        background: "linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0) 72%), " + (g.color || "#0a0a0a")
      }
    })))));
  })), !learnHidden ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 16,
      padding: "0 4px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u041E\u0431\u0443\u0447\u0435\u043D\u0438\u0435"), /*#__PURE__*/React.createElement("button", {
    onClick: hideLearn,
    className: "tap",
    "data-no-haptic": true,
    "aria-label": "\u0421\u043A\u0440\u044B\u0442\u044C \u043E\u0431\u0443\u0447\u0435\u043D\u0438\u0435",
    style: {
      background: "transparent",
      border: 0,
      color: "var(--text-4)",
      fontSize: 13,
      fontWeight: 600,
      padding: "2px 2px",
      textTransform: "none",
      letterSpacing: 0,
      lineHeight: 1,
      display: "inline-flex",
      alignItems: "center",
      gap: 4
    }
  }, "\u0421\u043A\u0440\u044B\u0442\u044C ", /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      transform: "rotate(-90deg)"
    }
  }, /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 13
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      overflowX: "auto",
      margin: "8px -12px 0",
      padding: "0 28px 4px 16px",
      scrollbarWidth: "none"
    }
  }, [{
    topic: "habits-basics",
    emoji: "🌱",
    accent: "#34C759",
    t: "Основы привычек",
    b: "Почему маленькое сильнее большого — и как не пропускать дважды."
  }, {
    topic: "goals-101",
    emoji: "🎯",
    accent: "#FF9500",
    t: "Хорошие цели",
    b: "Результат или процесс: что отслеживать и когда."
  }, {
    topic: "teams-101",
    emoji: "🤝",
    accent: "#0A84FF",
    t: "Командные привычки",
    b: "Один общий якорь, общая серия и поддержка вместо контроля."
  }].map((c, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => navigate("info", {
      topic: c.topic
    }),
    className: "tap",
    style: {
      flexShrink: 0,
      width: 168,
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
      minHeight: 150,
      color: "var(--text)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 14,
      background: "var(--surface-3)",
      display: "grid",
      placeItems: "center",
      fontSize: 20,
      position: "relative"
    }
  }, c.emoji), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15.5,
      fontWeight: 600,
      color: "var(--text)",
      lineHeight: 1.2,
      position: "relative"
    }
  }, c.t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-4)",
      lineHeight: 1.45,
      position: "relative"
    }
  }, c.b), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 4,
      marginTop: "auto",
      fontSize: 12,
      fontWeight: 600,
      color: "var(--text-3)",
      position: "relative"
    }
  }, "\u0427\u0438\u0442\u0430\u0442\u044C ", /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 13
  })))))) : /*#__PURE__*/React.createElement("button", {
    onClick: showLearn,
    className: "tap",
    "data-no-haptic": true,
    "aria-label": "\u0420\u0430\u0441\u043A\u0440\u044B\u0442\u044C \u043E\u0431\u0443\u0447\u0435\u043D\u0438\u0435",
    style: {
      marginTop: 22,
      width: "100%",
      background: "transparent",
      border: 0,
      padding: "0 4px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "section-label",
    style: {
      color: "var(--text-3)"
    }
  }, "\u041E\u0431\u0443\u0447\u0435\u043D\u0438\u0435"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      color: "var(--text-4)",
      fontSize: 13,
      fontWeight: 600
    }
  }, "\u0420\u0430\u0441\u043A\u0440\u044B\u0442\u044C ", /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      transform: "rotate(90deg)"
    }
  }, /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 13
  })))));
}

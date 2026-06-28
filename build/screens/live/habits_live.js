/* HABITS — LIVE-only fork of HabitsScreen (real Telegram user, app.mode === "live"
   is ALWAYS true here). Redesigned (David) so the whole screen reads as ONE block
   language (iOS-26 «всё в блоках»):
     1. «Быстрое добавление» — chips + the black universal «+» wrapped in ONE white
        block (the «+» opens CreateMenuLive → Привычку / Цель / Команду).
     2. A TRIAD segmented switcher «Привычки · Цели · Команды» sits DIRECTLY UNDER
        that block and swaps the page between the three lists. No big duplicate title,
        no «Сегодня» section labels — the triad already names the context (David).
        «Команды» reuses LiveTeamCard (from community_live.jsx) so teams you created /
        joined also live here, not only on the Сообщество tab (coexist for now).
     3. «Обучение» is a THIN disclosure block: a slim header row when collapsed, it
        expands in place into a full block of 3 guide rows. Reuses bosLearnHidden so the
        Settings toggle still flips it.
   The live fork hard-codes the iOS-weight primary typography (habit / goal NAME at
   fontWeight 600 + var(--text)). Everything else reuses the shared core/ toolkit
   (EMOJI_CHIPS, HabitRing, AvatarStack) + shared_live.jsx (CreateMenuLive,
   ShareHabitSheetLive, HabitWeekStrip, bosTileGlass/BOS_TILE_SHEEN, HabitBuddyAvatarsLive)
   + community_live.jsx (LiveTeamCard) + framework (SwipeRow, HabitCheck, I, hooks).
   New top-level names in this file: `function HabitsLive`, `_bosHabitsTab`,
   `_bosSetHabitsTab` (the active-triad-tab memory, survives navigate-in-and-back). */
var _bosHabitsTab = function () {
  try {
    return localStorage.getItem("bos:habitsTab") || "habits";
  } catch (e) {
    return "habits";
  }
}();
function _bosSetHabitsTab(t) {
  _bosHabitsTab = t;
  try {
    localStorage.setItem("bos:habitsTab", t);
  } catch (e) {}
}

// Quick-add presets per triad tab (David: «при переключении на Цели/Команды всплывают подходящие
// пилюли»). Habits reuse the shared EMOJI_CHIPS; goals & teams get their own context presets.
//   GOAL preset → {i,t,target,unit,deadline} seeds goal-settings.
//   TEAM preset → {i,t,accent,goalType,goalTitle,target,unit} seeds team-create. Three themes:
//   семья · челленджи для друзей · личностный рост.
var GOAL_CHIPS = [{
  i: "🏃",
  t: "Пробежать марафон",
  target: 42,
  unit: "км",
  deadline: "1 год"
}, {
  i: "📚",
  t: "Прочитать 12 книг",
  target: 12,
  unit: "книг",
  deadline: "1 год"
}, {
  i: "💪",
  t: "Прийти в форму",
  target: 12,
  unit: "недель",
  deadline: "Месяц"
}, {
  i: "🧘",
  t: "100 дней практики",
  target: 100,
  unit: "дней",
  deadline: "Месяц"
}, {
  i: "🗣️",
  t: "Выучить язык",
  target: 6,
  unit: "месяцев",
  deadline: "1 год"
}, {
  i: "💰",
  t: "Накопить подушку",
  target: 6,
  unit: "месяцев",
  deadline: "1 год"
}, {
  i: "🚭",
  t: "Бросить курить",
  target: 90,
  unit: "дней",
  deadline: "Месяц"
}];
var TEAM_CHIPS = [
// вклад в окружение (David: фокус на вклад, не «семейные дела»)
{
  i: "🤝",
  t: "Вклад в окружение",
  accent: "#E59B9B",
  goalType: "collective",
  goalTitle: "Добрые дела",
  target: 50,
  unit: "дел"
}, {
  i: "🫶",
  t: "Забота о близких",
  accent: "#F0A24E",
  goalType: "collective",
  goalTitle: "Тёплые дела",
  target: 30,
  unit: "дел"
},
// челленджи для друзей
{
  i: "🔥",
  t: "30 дней спорта",
  accent: "#F0564C",
  goalType: "streak",
  goalTitle: "Спорт каждый день",
  target: 30,
  unit: "дней"
}, {
  i: "🏁",
  t: "Беговой вызов",
  accent: "#19B89B",
  goalType: "race",
  goalTitle: "100 км бега",
  target: 100,
  unit: "км"
}, {
  i: "💧",
  t: "Без сахара вместе",
  accent: "#54C3E4",
  goalType: "streak",
  goalTitle: "Дни без сахара",
  target: 21,
  unit: "дней"
},
// личностный рост
{
  i: "🧘",
  t: "Осознанность",
  accent: "#7F9AF2",
  goalType: "collective",
  goalTitle: "Минуты медитации",
  target: 1000,
  unit: "мин"
}, {
  i: "📖",
  t: "Книжный клуб",
  accent: "#8676E6",
  goalType: "collective",
  goalTitle: "Прочитано глав",
  target: 100,
  unit: "глав"
}];
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
    chipBg: "rgba(255,255,255,0.08)",
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
    chipBg: "#F1F1F5",
    chipBd: "0",
    iconBg: "var(--surface-3)",
    divider: "var(--line)",
    chipText: "var(--text-2)",
    plusIcon: "#aaa",
    pillBg: "#e8e8e8",
    addBtnBg: "#0a0a0a",
    addBtnFg: "#fff",
    playBtnBg: "var(--text-2)",
    playBtnFg: "#fff"
  };
  var cardShadow = isDark ? "none" : "0 1px 2px rgba(0,0,0,0.04)";

  // «Обучение» can be collapsed (David) — persisted, also flipped from Settings.
  var [learnHidden, setLearnHidden] = React.useState(() => typeof bosLearnHidden === "function" ? bosLearnHidden() : false);
  React.useEffect(() => {
    var sync = () => setLearnHidden(typeof bosLearnHidden === "function" ? bosLearnHidden() : false);
    window.addEventListener("bos:learnchange", sync);
    return () => window.removeEventListener("bos:learnchange", sync);
  }, []);
  var toggleLearn = () => {
    var next = !learnHidden;
    if (typeof bosSetLearnHidden === "function") bosSetLearnHidden(next);
    setLearnHidden(next);
    if (window.tgHaptic) {
      try {
        window.tgHaptic("light");
      } catch (e) {}
    }
  };

  // Shared store — same lists the Home / Community screens read/write.
  var habits = app?.habits || [];
  var goals = app?.goals || [];
  var teams = app?.teams || [];
  var toggle = app?.toggleHabit || (() => {});
  var remove = app?.removeHabit || (() => {});
  var removeGoal = app?.removeGoal || (() => {});
  var rowBg = isDark ? "#141414" : "#ffffff"; // opaque so swipe actions stay hidden until revealed

  // TRIAD — which of Привычки / Цели / Команды is shown. Kept in a module var so it
  // survives navigating into a detail screen and back (the screen remounts).
  var [tab, setTabState] = React.useState(_bosHabitsTab);
  var setTab = t => {
    _bosSetHabitsTab(t);
    setTabState(t);
    if (window.tgHaptic) {
      try {
        window.tgHaptic("selection");
      } catch (e) {}
    }
  };

  // The black «+» is the ONE universal create entry — it opens a small menu (Привычку / Цель / Команду).
  var [createOpen, setCreateOpen] = React.useState(false);
  var addBtnRef = React.useRef(null);

  // «Быстрое добавление» now sits ABOVE the triad (David) and its chips FOLLOW the active tab:
  // Привычки → habit presets, Цели → goal presets, Команды → team presets. The chips re-mount on
  // tab change (key={tab}) so they pop in (briefPop). Each chip routes to the matching create screen
  // with its preset (habit-settings / goal-settings / team-create).
  var QA = tab === "goals" ? {
    chips: GOAL_CHIPS,
    go: c => navigate("goal-settings", {
      mode: "create",
      preset: c
    })
  } : tab === "teams" ? {
    chips: TEAM_CHIPS,
    go: c => navigate("team-create", {
      preset: c
    })
  } : {
    chips: EMOJI_CHIPS,
    go: c => navigate("habit-settings", {
      mode: "create",
      preset: c
    })
  };
  var quickAddBlock = /*#__PURE__*/React.createElement("div", {
    style: {
      background: TH.cardBg,
      borderRadius: 20,
      boxShadow: cardShadow,
      padding: "12px 13px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1.2,
      fontWeight: 600,
      marginBottom: 9,
      padding: "0 2px"
    }
  }, "\u0411\u044B\u0441\u0442\u0440\u043E\u0435 \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u0438\u0435"), /*#__PURE__*/React.createElement("div", {
    key: tab,
    style: {
      display: "flex",
      gap: 8,
      overflowX: "auto",
      scrollbarWidth: "none",
      WebkitOverflowScrolling: "touch",
      touchAction: "pan-x",
      padding: "3px 2px"
    }
  }, QA.chips.map((c, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    className: "tap",
    "data-no-haptic": true,
    onClick: () => QA.go(c),
    style: {
      ...(typeof bosChipGlass === "function" ? bosChipGlass(isDark) : {
        background: TH.chipBg
      }),
      borderRadius: 999,
      padding: "8px 12px",
      fontSize: 13,
      color: TH.chipText,
      border: 0,
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      whiteSpace: "nowrap",
      flexShrink: 0,
      animation: "briefPop 0.4s cubic-bezier(0.22,0.9,0.3,1.2) both " + i * 0.035 + "s"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      lineHeight: 1
    }
  }, c.i), c.t, " ", /*#__PURE__*/React.createElement(I.Plus, {
    size: 12,
    color: TH.plusIcon
  })))));
  var TRIAD = [{
    id: "habits",
    t: "Привычки"
  }, {
    id: "goals",
    t: "Цели"
  }, {
    id: "teams",
    t: "Команды"
  }];
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
    style: {
      marginBottom: 12
    }
  }, quickAddBlock), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "tab-pill",
    style: {
      flex: 1,
      marginBottom: 0,
      background: isDark ? "rgba(255,255,255,0.07)" : "#E6E6EA"
    }
  }, TRIAD.map(s => /*#__PURE__*/React.createElement("button", {
    key: s.id,
    className: "tap " + (tab === s.id ? "active" : ""),
    onClick: () => setTab(s.id),
    style: {
      fontSize: 14,
      fontWeight: tab === s.id ? 600 : 500,
      letterSpacing: "-0.2px",
      padding: "11px 4px",
      boxShadow: tab === s.id ? isDark ? "0 1px 4px rgba(0,0,0,0.45)" : "0 1px 3px rgba(0,0,0,0.14)" : "none"
    }
  }, s.t))), /*#__PURE__*/React.createElement("button", {
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
      flexShrink: 0,
      width: 44,
      height: 44,
      borderRadius: 999,
      ...(typeof bosChipGlass === "function" ? bosChipGlass(isDark) : {
        background: TH.chipBg
      }),
      color: isDark ? "#fff" : "var(--text)",
      border: 0,
      display: "grid",
      placeItems: "center"
    }
  }, /*#__PURE__*/React.createElement(I.Plus, {
    size: 20,
    strokeWidth: 2.2,
    style: {
      transition: "transform 0.34s cubic-bezier(0.34,1.5,0.4,1)",
      transform: createOpen ? "rotate(45deg)" : "none"
    }
  }))), tab === "habits" && (habits.length === 0 ? /*#__PURE__*/React.createElement("button", {
    className: "tap",
    onClick: () => navigate("habit-settings", {
      mode: "create"
    }),
    style: {
      width: "100%",
      background: TH.cardBg,
      border: 0,
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
  }, "\u0412\u044B\u0431\u0435\u0440\u0438 \u0448\u0430\u0431\u043B\u043E\u043D \u0432\u044B\u0448\u0435, \u043D\u0430\u0436\u043C\u0438 \xAB+\xBB \u0438\u043B\u0438 \u0441\u043E\u0437\u0434\u0430\u0439 \u0441\u0432\u043E\u044E \u2014 \u043E\u0434\u043D\u043E\u043C\u0443 \u0438\u043B\u0438 \u0432\u043C\u0435\u0441\u0442\u0435 \u0441 \u0434\u0440\u0443\u0437\u044C\u044F\u043C\u0438.")) : /*#__PURE__*/React.createElement(BosReorderList, {
    ids: habits.map(h => h.id),
    onReorder: o => {
      if (app && app.reorderHabits) app.reorderHabits(o);
    },
    renderItem: (id, ctx) => {
      var h = habits.find(x => x.id === id);
      if (!h) return null;
      var inner = /*#__PURE__*/React.createElement("div", {
        className: ctx.mode ? "" : "tap",
        onClick: ctx.mode ? undefined : () => navigate("habit-detail", {
          habit: h,
          from: "habits"
        }),
        style: {
          padding: "14px 16px",
          pointerEvents: ctx.mode ? "none" : "auto"
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
          background: BOS_TILE_SHEEN + ", " + (h.color ? h.color + "26" : TH.iconBg),
          boxShadow: bosTileGlass(isDark),
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
          display: "flex",
          alignItems: "center",
          gap: 7
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 16,
          fontWeight: 600,
          color: "var(--text)",
          letterSpacing: "-0.2px",
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        }
      }, h.name), h.teamHabitId && /*#__PURE__*/React.createElement("span", {
        title: "\u041A\u043E\u043C\u0430\u043D\u0434\u043D\u0430\u044F \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0430",
        style: {
          flexShrink: 0,
          display: "inline-flex",
          alignItems: "center",
          gap: 3,
          fontSize: 10,
          fontWeight: 700,
          color: "var(--text-4)",
          background: "var(--surface-3)",
          padding: "2px 7px",
          borderRadius: 999
        }
      }, /*#__PURE__*/React.createElement(I.Users, {
        size: 10
      }), " \u041A\u043E\u043C\u0430\u043D\u0434\u043D\u0430\u044F")), (h.friends?.length > 0 || h.duration > 0) && /*#__PURE__*/React.createElement("div", {
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
      })));
      if (ctx.mode) return /*#__PURE__*/React.createElement("div", {
        style: {
          borderRadius: 22,
          overflow: "hidden",
          boxShadow: cardShadow,
          background: rowBg
        }
      }, inner);
      return /*#__PURE__*/React.createElement("div", {
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
          icon: I.X,
          onAction: () => bosConfirmDelete(openSheet, {
            title: "Удалить привычку?",
            message: "«" + h.name + "» и вся история отметок удалятся навсегда.",
            confirmLabel: "Удалить",
            onConfirm: () => remove(h.id)
          })
        }]
      }, inner));
    }
  })), tab === "goals" && (goals.length === 0 ? /*#__PURE__*/React.createElement("button", {
    className: "tap",
    onClick: () => navigate("goal-settings", {
      mode: "create"
    }),
    style: {
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
  }), " \u041F\u043E\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u0446\u0435\u043B\u044C")) : /*#__PURE__*/React.createElement(BosReorderList, {
    ids: goals.map(g => g.id),
    onReorder: o => {
      if (app && app.reorderGoals) app.reorderGoals(o);
    },
    renderItem: (id, ctx) => {
      var g = goals.find(x => x.id === id);
      if (!g) return null;
      var pct = g.target > 0 ? g.current / g.target : 0;
      var inner = /*#__PURE__*/React.createElement("div", {
        className: ctx.mode ? "" : "tap",
        onClick: ctx.mode ? undefined : () => navigate("goal-detail", {
          goal: g,
          from: "habits"
        }),
        style: {
          padding: "14px 16px",
          textAlign: "left",
          color: "var(--text)",
          pointerEvents: ctx.mode ? "none" : "auto"
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
          background: BOS_TILE_SHEEN + ", " + (g.color ? g.color + "26" : TH.iconBg),
          boxShadow: bosTileGlass(isDark),
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
      })));
      if (ctx.mode) return /*#__PURE__*/React.createElement("div", {
        style: {
          borderRadius: 22,
          overflow: "hidden",
          boxShadow: cardShadow,
          background: TH.cardBg
        }
      }, inner);
      return /*#__PURE__*/React.createElement("div", {
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
          icon: I.X,
          onAction: () => bosConfirmDelete(openSheet, {
            title: "Удалить цель?",
            message: "«" + g.name + "» удалится навсегда.",
            confirmLabel: "Удалить",
            onConfirm: () => removeGoal(g.id)
          })
        }]
      }, inner));
    }
  })), tab === "teams" && (teams.length === 0 ? /*#__PURE__*/React.createElement("button", {
    className: "tap",
    onClick: () => navigate("team-create"),
    style: {
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
  }, "\uD83E\uDD1D"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 600
    }
  }, "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u043A\u043E\u043C\u0430\u043D\u0434"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: "var(--text-4)",
      lineHeight: 1.45,
      maxWidth: 250
    }
  }, "\u041A\u043E\u043C\u0430\u043D\u0434\u0430 \u2014 \u044D\u0442\u043E \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0438 \u0432\u043C\u0435\u0441\u0442\u0435 \u0441 \u0434\u0440\u0443\u0437\u044C\u044F\u043C\u0438: \u043E\u0431\u0449\u0438\u0439 \u044F\u043A\u043E\u0440\u044C, \u043E\u0431\u0449\u0430\u044F \u0441\u0435\u0440\u0438\u044F \u0438 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0430."), /*#__PURE__*/React.createElement("span", {
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
  }), " \u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043A\u043E\u043C\u0430\u043D\u0434\u0443")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(BosReorderList, {
    ids: teams.map(t => t._id),
    gap: 12,
    onReorder: o => {
      if (app && app.reorderTeams) app.reorderTeams(o);
    },
    renderItem: (id, ctx) => {
      var t = teams.find(x => x._id === id);
      if (!t) return null;
      return /*#__PURE__*/React.createElement("div", {
        style: {
          pointerEvents: ctx.mode ? "none" : "auto"
        }
      }, /*#__PURE__*/React.createElement(LiveTeamCard, {
        t: t,
        navigate: navigate
      }));
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("team-create"),
    className: "tap team-new-cta",
    style: {
      marginTop: 12,
      width: "100%",
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
  }, "\u041F\u0440\u0438\u0433\u043B\u0430\u0441\u0438 \u0434\u0440\u0443\u0437\u0435\u0439, \u043F\u043E\u0441\u0442\u0430\u0432\u044C\u0442\u0435 \u043E\u0431\u0449\u0443\u044E \u0446\u0435\u043B\u044C, \u0432\u044B\u0441\u0442\u0440\u0430\u0438\u0432\u0430\u0439\u0442\u0435 \u0441\u0435\u0440\u0438\u0438 \u0432\u043C\u0435\u0441\u0442\u0435.")), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 18
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      background: TH.cardBg,
      borderRadius: 18,
      boxShadow: cardShadow,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: toggleLearn,
    className: "tap",
    "data-no-haptic": true,
    "aria-expanded": !learnHidden,
    "aria-label": learnHidden ? "Раскрыть обучение" : "Свернуть обучение",
    style: {
      width: "100%",
      background: "transparent",
      border: 0,
      padding: "13px 15px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 11,
      fontSize: 14.5,
      fontWeight: 600,
      color: "var(--text-2)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 10,
      background: TH.iconBg,
      display: "grid",
      placeItems: "center",
      fontSize: 16
    }
  }, "\uD83C\uDF93"), "\u041E\u0431\u0443\u0447\u0435\u043D\u0438\u0435"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      color: "var(--text-4)",
      fontSize: 13,
      fontWeight: 500
    }
  }, learnHidden ? "Раскрыть" : "Свернуть", /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      transform: learnHidden ? "rotate(90deg)" : "rotate(-90deg)",
      transition: "transform 0.3s cubic-bezier(0.34,1.3,0.4,1)"
    }
  }, /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 14
  })))), !learnHidden && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "0 13px 6px"
    }
  }, [{
    topic: "habits-basics",
    emoji: "🌱",
    t: "Основы привычек",
    b: "Почему маленькое сильнее большого — и как не пропускать дважды."
  }, {
    topic: "goals-101",
    emoji: "🎯",
    t: "Хорошие цели",
    b: "Результат или процесс: что отслеживать и когда."
  }, {
    topic: "teams-101",
    emoji: "🤝",
    t: "Командные привычки",
    b: "Один общий якорь, общая серия и поддержка вместо контроля."
  }].map((c, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => navigate("info", {
      topic: c.topic
    }),
    className: "tap",
    style: {
      width: "100%",
      background: "transparent",
      border: 0,
      borderTop: i ? "1px solid " + TH.divider : "0",
      padding: "12px 4px",
      display: "flex",
      alignItems: "center",
      gap: 12,
      textAlign: "left",
      color: "var(--text)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 36,
      height: 36,
      borderRadius: 12,
      background: TH.iconBg,
      display: "grid",
      placeItems: "center",
      fontSize: 18,
      flexShrink: 0
    }
  }, c.emoji), /*#__PURE__*/React.createElement("div", {
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
  }, c.t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-4)",
      marginTop: 2,
      lineHeight: 1.4
    }
  }, c.b)), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 15,
    color: "var(--text-4)"
  }))))));
}

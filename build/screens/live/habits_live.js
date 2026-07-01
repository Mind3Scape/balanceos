/* HABITS — LIVE-only fork (real Telegram user, app.mode === "live" is ALWAYS true here).
   ONE block language (iOS-26 «всё в блоках»), as redesigned by David:
     1. Шапка: лента ЧЕЛЛЕНДЖЕЙ (популярные привычка/цель/«вместе»-пресеты с XP-наградой,
        горизонтальный скролл) + универсальный «+» справа (CreateMenuLive → Привычку / Цель;
        круг = тумблер «Идти к цели вместе» внутри цели). «Быстрого добавления» и переключателя
        Привычки/Цели больше НЕТ — их David убрал.
     2. ОДНА сетка квадратных плиток: привычки И цели ВПЕРЕМЕШКУ, общий drag-реордер (порядок
        в bos:practiceOrder, ключи "h<id>"/"g<id>"). Плитка цели зеркалит привычку (иконка + %,
        имя, полоска прогресса снизу вместо недельных точек). Долгое нажатие → меню плитки
        (Поделиться / Переставить / Удалить). teams (LiveTeamCard) — пока ниже сетки.
     3. «Обучение» — тонкий disclosure-блок (bosLearnHidden, тот же флаг что в Настройках).
   Reuses shared core/ + shared_live.jsx (CreateMenuLive, ShareHabitSheetLive/ShareGoalSheetLive,
   HabitWeekStrip, BosReorderGrid, bosConfirmDelete, bosTileGlass/BOS_TILE_SHEEN, HabitBuddyAvatarsLive,
   CircleFacesLive) + community_live.jsx (LiveTeamCard) + framework (HabitCheck/HabitCountCheck/
   HabitRing, I, hooks). Top-level names here: HabitTileMenuLive, HabitsLive, bosLoadPracticeOrder,
   bosSavePracticeOrder, CHALLENGE_STARTERS. */

// «ЧЕЛЛЕНДЖИ» — витрина-лента наверху стр. Привычки (David: «не голые пресеты, а самые ПОПУЛЯРНЫЕ
// привычки/цели/„вместе"-челленджи, у каждой виден XP-БОНУС — быстрое добавление ЧЕЛЛЕНДЖЕЙ»). Тап →
// создание заполнено пресетом. `bonus` = РЕАЛЬНЫЙ XP за ЗАВЕРШЕНИЕ челленджа (David: «в конце, когда закрыл
// срок»). Создание метит привычку/цель/команду `challenge {key,bonus,days}`; AppProvider (shell.jsx)
// фиксирует бонус в ПОСТОЯННУЮ копилку claimedChallenges, как только серия привычки достигла `days` ПОДРЯД
// (или цель/команда достигла target) — раз заработал, бонус навсегда (пропуск/удаление его не отбирают).
// bosChallengeBonusXPLive суммирует копилку. kind: habit | goal | together
// (together = цель с тумблером «Идти к цели вместе»). preset-поля совпадают с тем, что читает создание.
var CHALLENGE_STARTERS = [{
  i: "🔥",
  t: "Холодный душ",
  kind: "habit",
  key: "cold",
  bonus: 50,
  days: 30,
  color: "#0a0a0a"
}, {
  i: "💪",
  t: "30 дней спорта",
  kind: "together",
  key: "sport30",
  bonus: 75,
  target: 30,
  unit: "дней"
}, {
  i: "💧",
  t: "Вода каждый день",
  kind: "habit",
  key: "water",
  bonus: 30,
  days: 21,
  color: "#34C759"
}, {
  i: "📚",
  t: "Книга за месяц",
  kind: "goal",
  key: "book",
  bonus: 40,
  target: 1,
  unit: "книга",
  deadline: "Месяц"
}, {
  i: "🏃",
  t: "Бег вместе",
  kind: "together",
  key: "runtog",
  bonus: 75,
  target: 30,
  unit: "км"
}, {
  i: "🧘",
  t: "10 минут тишины",
  kind: "habit",
  key: "silence",
  bonus: 30,
  days: 21,
  color: "#AF52DE"
}, {
  i: "🌅",
  t: "Ранний подъём",
  kind: "habit",
  key: "wake",
  bonus: 40,
  days: 21,
  color: "#FF9500"
}, {
  i: "🚭",
  t: "Без сахара",
  kind: "habit",
  key: "nosugar",
  bonus: 50,
  days: 30,
  color: "#FF2D55"
}];

/* Long-press menu for a habit TILE (David: квадратные плитки 2-в-ряд → горизонтальный свайп
   конфликтует с сеткой, поэтому действия живут в шторке-меню). One sheet, three rows: Поделиться /
   Переставить плитки (entering the grid jiggle-mode) / Удалить. «swap» actions open their own sheet
   so we just let openSheet replace this menu (no down-then-up flicker); «leave» closes first. */
function HabitTileMenuLive({
  habit,
  dark,
  onShare,
  onReorder,
  onDelete,
  kindLabel = "Привычка"
}) {
  var {
    close
  } = useSheet();
  var swap = fn => () => {
    if (window.tgHaptic) {
      try {
        window.tgHaptic("light");
      } catch (e) {}
    }
    if (fn) fn();
  };
  var leave = fn => () => {
    if (window.tgHaptic) {
      try {
        window.tgHaptic("light");
      } catch (e) {}
    }
    close();
    if (fn) fn();
  };
  var Row = ({
    icon,
    label,
    onClick,
    danger
  }) => /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    className: "tap",
    style: {
      width: "100%",
      border: 0,
      borderRadius: 16,
      padding: "14px 15px",
      background: dark ? "rgba(255,255,255,0.06)" : "var(--surface-2)",
      color: danger ? "#FF3B30" : "var(--text)",
      display: "flex",
      alignItems: "center",
      gap: 13,
      fontSize: 15.5,
      fontWeight: 600,
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 24,
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, icon), label);
  var reorderIcon = /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M7 5v14M7 5L4 8M7 5l3 3M17 19V5M17 19l-3-3M17 19l3-3"
  }));
  var sheen = typeof BOS_TILE_SHEEN !== "undefined" ? BOS_TILE_SHEEN + ", " : "";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "2px 16px 0",
      color: "var(--text)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "2px 4px 14px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 13,
      background: sheen + (habit.color ? habit.color + "26" : "var(--surface-3)"),
      display: "grid",
      placeItems: "center",
      fontSize: 20,
      flexShrink: 0
    }
  }, bosIcon(habit.emoji, 22, habit.color)), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16.5,
      fontWeight: 700,
      letterSpacing: "-0.3px",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, habit.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-4)",
      marginTop: 1
    }
  }, kindLabel))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Row, {
    icon: /*#__PURE__*/React.createElement(I.Share, {
      size: 18
    }),
    label: "\u041F\u043E\u0434\u0435\u043B\u0438\u0442\u044C\u0441\u044F",
    onClick: swap(onShare)
  }), /*#__PURE__*/React.createElement(Row, {
    icon: reorderIcon,
    label: "\u041F\u0435\u0440\u0435\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u043F\u043B\u0438\u0442\u043A\u0438",
    onClick: leave(onReorder)
  }), /*#__PURE__*/React.createElement(Row, {
    icon: /*#__PURE__*/React.createElement(I.Trash, {
      size: 18
    }),
    label: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C",
    onClick: swap(onDelete),
    danger: true
  })), /*#__PURE__*/React.createElement("button", {
    onClick: close,
    className: "tap",
    style: {
      width: "100%",
      marginTop: 10,
      border: 0,
      borderRadius: 999,
      padding: 14,
      background: dark ? "rgba(255,255,255,0.06)" : "var(--surface-3)",
      color: "var(--text)",
      fontSize: 15.5,
      fontWeight: 600
    }
  }, "\u041E\u0442\u043C\u0435\u043D\u0430"), /*#__PURE__*/React.createElement("div", {
    style: {
      height: "max(8px, var(--tg-bottom-inset, 0px))"
    }
  }));
}

// Один ОБЩИЙ порядок для смешанного списка «привычки + цели» (David: «цели появляются среди привычек,
// человек сам расставляет как хочет»). Храним массив ключей "h<id>"/"g<id>" в localStorage; новые
// элементы (которых ещё нет в сохранённом порядке) дописываются в конец в естественном порядке.
function bosLoadPracticeOrder() {
  try {
    return JSON.parse(localStorage.getItem("bos:practiceOrder") || "[]") || [];
  } catch (e) {
    return [];
  }
}
function bosSavePracticeOrder(keys) {
  try {
    localStorage.setItem("bos:practiceOrder", JSON.stringify(keys || []));
  } catch (e) {}
}
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

  // Привычки и цели — ОДИН смешанный список плиток (David). Переключателя Привычки/Цели больше нет;
  // тип выбирается при создании («+» → Привычку/Круг), а карточки потом стоят вперемешку. orderTick
  // форсит пересборку общего порядка после перетаскивания.
  var [orderTick, setOrderTick] = React.useState(0);

  // The black «+» is the ONE universal create entry — it opens a small menu (Привычку / Цель / Команду).
  var [createOpen, setCreateOpen] = React.useState(false);
  var addBtnRef = React.useRef(null);

  // Стиль карточек (форма + тоглы) — шестерёнка слева от «+». Дефолт = текущий вид; запоминается.
  var [cardStyle, setCardStyle] = React.useState(bosLoadCardStyle);
  var [styleOpen, setStyleOpen] = React.useState(false);
  var gearBtnRef = React.useRef(null);
  React.useEffect(() => {
    var h = () => setCardStyle(bosLoadCardStyle());
    window.addEventListener("bos:cardStyleChanged", h);
    return () => window.removeEventListener("bos:cardStyleChanged", h);
  }, []);

  // Habit TILES (2-per-row grid) — long-press opens the tile menu (Поделиться / Переставить / Удалить);
  // «Переставить» flips the grid into jiggle/drag-reorder via this controller ref (set by BosReorderGrid).
  var gridCtl = React.useRef(null);
  var onTileLongPress = key => {
    var openReorder = () => {
      if (gridCtl.current) gridCtl.current.enterReorder();
    };
    if (("" + key)[0] === "g") {
      var g = goals.find(x => "g" + x.id === key);
      if (!g) return;
      openSheet(/*#__PURE__*/React.createElement(HabitTileMenuLive, {
        habit: g,
        dark: isDark,
        kindLabel: "\u0426\u0435\u043B\u044C",
        onShare: () => openSheet(/*#__PURE__*/React.createElement(ShareGoalSheetLive, {
          goal: g,
          dark: isDark
        })),
        onReorder: openReorder,
        onDelete: () => bosConfirmDelete(openSheet, {
          title: "Удалить цель?",
          message: "«" + g.name + "» удалится навсегда.",
          confirmLabel: "Удалить",
          onConfirm: () => removeGoal(g.id)
        })
      }));
      return;
    }
    var h = habits.find(x => "h" + x.id === key);
    if (!h) return;
    openSheet(/*#__PURE__*/React.createElement(HabitTileMenuLive, {
      habit: h,
      dark: isDark,
      onShare: () => openSheet(/*#__PURE__*/React.createElement(ShareHabitSheetLive, {
        habit: h,
        dark: isDark
      })),
      onReorder: openReorder,
      onDelete: () => bosConfirmDelete(openSheet, {
        title: "Удалить привычку?",
        message: "«" + h.name + "» и вся история отметок удалятся навсегда.",
        confirmLabel: "Удалить",
        onConfirm: () => remove(h.id)
      })
    }));
  };

  // Тап по пилюле-челленджу → создание заполнено пресетом. habit → создание привычки; goal → цель;
  // together → цель с включённым «Идти к цели вместе» (можно сразу звать людей).
  var startChallenge = c => {
    if (window.tgHaptic) {
      try {
        window.tgHaptic("light");
      } catch (e) {}
    }
    // challenge {key,bonus,days} едет в пресет → создание кладёт его на привычку/цель/команду. Бонус
    // фиксируется в копилку (shell.jsx) только когда челлендж ЗАВЕРШЁН: привычка — серия `days` ПОДРЯД;
    // цель/команда — достигнут target. Заработанный бонус остаётся навсегда (David).
    var ch = {
      key: c.key,
      bonus: c.bonus,
      days: c.days
    };
    if (c.kind === "habit") {
      navigate("habit-settings", {
        mode: "create",
        preset: {
          i: c.i,
          t: c.t,
          color: c.color,
          challenge: ch
        }
      });
    } else {
      navigate("goal-settings", {
        mode: "create",
        circleOn: c.kind === "together",
        preset: {
          i: c.i,
          t: c.t,
          target: c.target,
          unit: c.unit,
          deadline: c.deadline,
          goalType: "collective",
          challenge: ch
        }
      });
    }
  };

  // Смешанный список: привычки + цели в едином порядке (ключи "h<id>"/"g<id>"), отсортированы по
  // сохранённому порядку перестановки; новые элементы — в конец.
  var entries = React.useMemo(() => {
    var all = habits.map(h => ({
      k: "h" + h.id,
      type: "h",
      item: h
    })).concat(goals.map(g => ({
      k: "g" + g.id,
      type: "g",
      item: g
    })));
    var saved = bosLoadPracticeOrder();
    if (saved && saved.length) {
      var pos = {};
      saved.forEach((k, i) => {
        pos[k] = i;
      });
      return all.map((e, i) => ({
        e: e,
        i: i
      })).sort((a, b) => (pos[a.e.k] != null ? pos[a.e.k] : 1000 + a.i) - (pos[b.e.k] != null ? pos[b.e.k] : 1000 + b.i)).map(x => x.e);
    }
    return all;
  }, [habits, goals, orderTick]);

  // ПЛИТКА ПРИВЫЧКИ — форма+тоглы из cardStyle. ЛИЦА переехали в ВЕРХНИЙ ряд к контролу (David: убрать
  // пустое место внизу — все плитки одной высоты). marks: неделя / месяц-грядка / нет. rect = строка.
  var habitTile = (h, ctx) => {
    var rect = cardStyle.form === "rect";
    var onOpen = ctx.mode ? undefined : () => navigate("habit-detail", {
      habit: h,
      from: "habits"
    });
    var control = h.duration > 0 && !(h.goalPerDay > 1) ? /*#__PURE__*/React.createElement(HabitTimerCheck, {
      habit: h,
      app: app,
      xp: 10
    }) : h.goalPerDay > 1 ? /*#__PURE__*/React.createElement(HabitCountCheck, {
      habit: h,
      app: app,
      xp: 10
    }) : /*#__PURE__*/React.createElement(HabitCheck, {
      done: h.done,
      onToggle: () => toggle(h.id),
      xp: 10,
      float: true
    });
    var ctrl = /*#__PURE__*/React.createElement("span", {
      onPointerDown: e => e.stopPropagation(),
      onClick: e => e.stopPropagation(),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        flexShrink: 0
      }
    }, control);
    var faces = cardStyle.faces ? /*#__PURE__*/React.createElement("span", {
      style: {
        display: "flex",
        alignItems: "center",
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement(HabitBuddyAvatarsLive, {
      habit: h,
      size: rect ? 16 : 18,
      max: rect ? 5 : 3
    }), typeof CircleFacesLive === "function" && /*#__PURE__*/React.createElement(CircleFacesLive, {
      habit: h,
      size: rect ? 16 : 18,
      max: rect ? 5 : 3
    })) : null;
    var sq = cardStyle.cells === "square";
    var marks = cardStyle.marks === "week" ? /*#__PURE__*/React.createElement(HabitWeekStrip, {
      habit: h,
      fill: true,
      square: sq
    }) : cardStyle.marks === "month" ? /*#__PURE__*/React.createElement(HabitMonthMini, {
      habit: h,
      square: sq
    }) : null;
    var icon = /*#__PURE__*/React.createElement("span", {
      style: {
        width: 38,
        height: 38,
        borderRadius: 13,
        background: BOS_TILE_SHEEN + ", " + (h.color ? h.color + "26" : TH.iconBg),
        boxShadow: bosTileGlass(isDark),
        display: "grid",
        placeItems: "center",
        fontSize: 19,
        flexShrink: 0
      }
    }, bosIcon(h.emoji, 21, h.color));
    if (rect) {
      return /*#__PURE__*/React.createElement("div", {
        className: ctx.mode ? "" : "tap",
        onClick: onOpen,
        style: {
          background: rowBg,
          borderRadius: 18,
          boxShadow: cardShadow,
          padding: "11px 14px",
          display: "flex",
          alignItems: "center",
          gap: 13,
          pointerEvents: ctx.mode ? "none" : "auto",
          overflow: "hidden"
        }
      }, icon, /*#__PURE__*/React.createElement("div", {
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
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        }
      }, h.name), marks && /*#__PURE__*/React.createElement("div", {
        style: {
          marginTop: 8
        }
      }, marks)), faces, ctrl);
    }
    var compact = cardStyle.marks === "none";
    return /*#__PURE__*/React.createElement("div", {
      className: ctx.mode ? "" : "tap",
      onClick: onOpen,
      style: {
        background: rowBg,
        borderRadius: 22,
        boxShadow: cardShadow,
        padding: "13px 13px 12px",
        minHeight: compact ? undefined : 146,
        display: "flex",
        flexDirection: "column",
        pointerEvents: ctx.mode ? "none" : "auto",
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 8
      }
    }, icon, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        flexShrink: 0
      }
    }, faces, ctrl)), cardStyle.name && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 10,
        fontSize: 15,
        fontWeight: 600,
        color: "var(--text)",
        letterSpacing: "-0.2px",
        lineHeight: 1.25,
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden"
      }
    }, h.name), marks && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: "auto",
        paddingTop: 12
      }
    }, marks));
  };

  // ПЛИТКА ЦЕЛИ — та же логика форм/тоглов. «Отметки» у цели = полоска прогресса (показываем пока
  // marks ≠ «нет»). Недельной/месячной сетки у цели нет — прогресс её замена. Лица тоже наверх.
  var goalTile = (g, ctx) => {
    var rect = cardStyle.form === "rect";
    var pct = g.target > 0 ? Math.min(1, (g.current || 0) / g.target) : 0;
    var gc = g.color || "#0a0a0a";
    var onOpen = ctx.mode ? undefined : () => navigate("goal-detail", {
      goal: g,
      from: "habits"
    });
    var faces = cardStyle.faces ? /*#__PURE__*/React.createElement("span", {
      style: {
        display: "flex",
        alignItems: "center",
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement(HabitBuddyAvatarsLive, {
      habit: g,
      size: rect ? 16 : 18,
      max: rect ? 5 : 3
    }), typeof CircleFacesLive === "function" && /*#__PURE__*/React.createElement(CircleFacesLive, {
      habit: g,
      size: rect ? 16 : 18,
      max: rect ? 5 : 3
    })) : null;
    var pctEl = /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 700,
        color: "var(--text-3)",
        fontVariantNumeric: "tabular-nums",
        flexShrink: 0,
        paddingTop: rect ? 0 : 2
      }
    }, Math.round(pct * 100), "%");
    var progress = cardStyle.marks !== "none" ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginBottom: 5
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        fontWeight: 700,
        color: "var(--text-4)",
        textTransform: "uppercase",
        letterSpacing: 0.7
      }
    }, "\u0426\u0435\u043B\u044C"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 600,
        color: "var(--text-3)",
        fontVariantNumeric: "tabular-nums"
      }
    }, g.current || 0, " / ", g.target, " ", g.unit || "")), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 7,
        borderRadius: 999,
        background: "var(--card-track)",
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "block",
        height: "100%",
        width: pct * 100 + "%",
        borderRadius: 999,
        background: "linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0) 72%), " + gc
      }
    }))) : null;
    var icon = /*#__PURE__*/React.createElement("span", {
      style: {
        width: 38,
        height: 38,
        borderRadius: 13,
        background: BOS_TILE_SHEEN + ", " + (g.color ? g.color + "26" : TH.iconBg),
        boxShadow: bosTileGlass(isDark),
        display: "grid",
        placeItems: "center",
        fontSize: 19,
        flexShrink: 0
      }
    }, bosIcon(g.emoji || "🎯", 21, g.color));
    if (rect) {
      return /*#__PURE__*/React.createElement("div", {
        className: ctx.mode ? "" : "tap",
        onClick: onOpen,
        style: {
          background: rowBg,
          borderRadius: 18,
          boxShadow: cardShadow,
          padding: "11px 14px",
          display: "flex",
          alignItems: "center",
          gap: 13,
          pointerEvents: ctx.mode ? "none" : "auto",
          overflow: "hidden"
        }
      }, icon, /*#__PURE__*/React.createElement("div", {
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
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        }
      }, g.name), progress && /*#__PURE__*/React.createElement("div", {
        style: {
          marginTop: 8
        }
      }, progress)), faces, pctEl);
    }
    var compact = cardStyle.marks === "none";
    return /*#__PURE__*/React.createElement("div", {
      className: ctx.mode ? "" : "tap",
      onClick: onOpen,
      style: {
        background: rowBg,
        borderRadius: 22,
        boxShadow: cardShadow,
        padding: "13px 13px 12px",
        minHeight: compact ? undefined : 146,
        display: "flex",
        flexDirection: "column",
        pointerEvents: ctx.mode ? "none" : "auto",
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 8
      }
    }, icon, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        flexShrink: 0
      }
    }, faces, pctEl)), cardStyle.name && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 10,
        fontSize: 15,
        fontWeight: 600,
        color: "var(--text)",
        letterSpacing: "-0.2px",
        lineHeight: 1.25,
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden"
      }
    }, g.name), progress && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: "auto",
        paddingTop: 12
      }
    }, progress));
  };
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
  }), typeof CardStyleMenuLive === "function" && /*#__PURE__*/React.createElement(CardStyleMenuLive, {
    open: styleOpen,
    onClose: () => setStyleOpen(false),
    anchorRef: gearBtnRef,
    value: cardStyle,
    onChange: s => {
      bosSaveCardStyle(s);
      setCardStyle(s);
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: "flex",
      gap: 8,
      overflowX: "auto",
      scrollbarWidth: "none",
      WebkitOverflowScrolling: "touch",
      touchAction: "pan-x",
      padding: "2px 1px",
      WebkitMaskImage: "linear-gradient(90deg, #000 88%, transparent)",
      maskImage: "linear-gradient(90deg, #000 88%, transparent)"
    }
  }, CHALLENGE_STARTERS.map((c, i) => {
    var xp = c.bonus;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      className: "tap",
      "data-no-haptic": true,
      onClick: () => startChallenge(c),
      style: {
        ...(typeof bosChipGlass === "function" ? bosChipGlass(isDark) : {
          background: TH.chipBg
        }),
        borderRadius: 999,
        padding: "7px 9px 7px 11px",
        border: 0,
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        whiteSpace: "nowrap",
        animation: "briefPop 0.4s cubic-bezier(0.22,0.9,0.3,1.2) both " + i * 0.03 + "s"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 15,
        lineHeight: 1
      }
    }, c.i), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 600,
        color: TH.chipText
      }
    }, c.t), c.kind === "together" && /*#__PURE__*/React.createElement(I.Users, {
      size: 12,
      color: TH.chipText,
      style: {
        opacity: 0.55,
        marginLeft: -2
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10.5,
        fontWeight: 800,
        color: "#9a6800",
        background: "rgba(245,180,30,0.18)",
        borderRadius: 999,
        padding: "2px 6px",
        letterSpacing: "-0.2px",
        lineHeight: 1.3
      }
    }, "+", xp, " XP"));
  })), /*#__PURE__*/React.createElement("button", {
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
  })), /*#__PURE__*/React.createElement("button", {
    ref: gearBtnRef,
    onClick: () => {
      setStyleOpen(true);
      if (window.tgHaptic) {
        try {
          window.tgHaptic("light");
        } catch (e) {}
      }
    },
    className: "tap",
    title: "\u0421\u0442\u0438\u043B\u044C \u043A\u0430\u0440\u0442\u043E\u0447\u0435\u043A",
    "aria-haspopup": "menu",
    "aria-expanded": styleOpen,
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
  }, /*#__PURE__*/React.createElement(I.Settings, {
    size: 19,
    strokeWidth: 2
  }))), entries.length === 0 ? /*#__PURE__*/React.createElement("button", {
    className: "tap",
    onClick: () => {
      setCreateOpen(true);
      if (window.tgHaptic) {
        try {
          window.tgHaptic("light");
        } catch (e) {}
      }
    },
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
  }, "\u0417\u0434\u0435\u0441\u044C \u0431\u0443\u0434\u0443\u0442 \u0442\u0432\u043E\u0438 \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0438 \u0438 \u0446\u0435\u043B\u0438"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: "var(--text-4)",
      lineHeight: 1.45,
      maxWidth: 260
    }
  }, "\u041D\u0430\u0436\u043C\u0438 \xAB+\xBB \u0432\u0432\u0435\u0440\u0445\u0443 \u2014 \u0437\u0430\u0432\u0435\u0434\u0438 \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0443 \u0438\u043B\u0438 \u0441\u043E\u0431\u0435\u0440\u0438 \u043A\u0440\u0443\u0433. \u041A\u0430\u0440\u0442\u043E\u0447\u043A\u0438 \u043F\u043E\u0442\u043E\u043C \u0440\u0430\u0441\u0441\u0442\u0430\u0432\u0438\u0448\u044C \u043A\u0430\u043A \u0443\u0434\u043E\u0431\u043D\u043E.")) : /*#__PURE__*/React.createElement(BosReorderGrid, {
    ids: entries.map(e => e.k),
    onReorder: keys => {
      bosSavePracticeOrder(keys);
      setOrderTick(t => t + 1);
    },
    onLongPress: onTileLongPress,
    ctlRef: gridCtl,
    cols: cardStyle.form === "rect" ? 1 : 2,
    gap: 12,
    renderItem: (k, ctx) => {
      var e = entries.find(x => x.k === k);
      if (!e) return null;
      return e.type === "g" ? goalTile(e.item, ctx) : habitTile(e.item, ctx);
    }
  }), teams.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, teams.map(t => /*#__PURE__*/React.createElement(LiveTeamCard, {
    key: t._id,
    t: t,
    navigate: navigate
  }))), /*#__PURE__*/React.createElement("div", {
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

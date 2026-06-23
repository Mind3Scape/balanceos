/* MORE SCREENS — habit detail, mood check-in, journal, focus timer, level-up modal, AI chat */
var {
  useState: useM
} = React;

/* HABIT DETAIL — per-habit statistics. Opened by tapping a habit on Home or
   Habits (the check-circle there still toggles done; the row drills in here).
   Theme-adaptive; numbers derive deterministically from the habit's streak so
   they never flicker; "Изменить" opens the edit form. Back returns to the exact
   tab we came from (params.from) — no more snapping to the wrong tab. */
function HabitDetailScreen() {
  var {
    navigate,
    params
  } = useNav();
  var app = typeof useApp === "function" ? useApp() : null;
  var back = params?.from || "habits";
  var seed = params?.habit || {
    id: 0,
    emoji: "🏃🏼‍♀️",
    name: "Утренняя пробежка",
    streak: 12
  };
  // Live copy from the shared store so streak / done reflect taps made elsewhere.
  var h = app?.habits && app.habits.find(x => x.id === seed.id) || seed;
  var isDark = app?.themeOverride === "dark";
  var Count = typeof CountUp !== "undefined" ? CountUp : ({
    value
  }) => value;
  var streak = h.streak || 0;
  // Deterministic derived stats — stable per habit, never random.
  var best = Math.max(streak, 27);
  var total = streak * 9 + (h.id || 1) * 7 + 40;
  var rate = Math.min(98, 58 + streak * 2);

  // Neutral by default (cohesive with the gray tiles outside); the habit's own
  // colour only if the user picked one — it tints the tile and fills the grid.
  var ringColor = h.color || "#FFC400"; // gold by default (matches the main calendar), or the habit's colour
  var tileBg = h.color ? h.color + "26" : isDark ? "rgba(255,255,255,0.06)" : "var(--surface-3)";
  var emptyBd = isDark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.12)";

  // 5-week grid: most recent `streak` days done; older days a fixed scatter
  // seeded by habit id (stable across renders — no Math.random flicker).
  var cells = Array.from({
    length: 35
  }, (_, i) => {
    var fromEnd = 34 - i;
    if (fromEnd < streak) return true;
    return (i * 7 + (h.id || 1) * 13) % 10 > 6;
  });
  var WD = ["П", "В", "С", "Ч", "П", "С", "В"];
  // For timed habits the day-ring fills relative to MINUTES spent that day, so a
  // 30-min session reads fuller than a 10-min one. Deterministic per cell.
  var MIN_FACTORS = [1, 0.5, 1.5, 1, 2, 0.8, 3, 1.2, 0.7, 1];
  var dayMins = i => h.duration ? Math.round(h.duration * MIN_FACTORS[(i * 5 + (h.id || 1) * 3) % MIN_FACTORS.length]) : 0;

  // ── Shared habit → a roster (you + friends) with deterministic streaks, shared
  //    by BOTH the leaderboard and the calendar so the rings match the standings.
  var isShared = h.friends?.length > 0;
  var mkStreak = seed => 3 + Math.abs(seed) * 7 % 24; // deterministic 3..26
  var roster = isShared ? [{
    name: "Ты",
    initials: "Я",
    color: h.color || "#FFC400",
    streak,
    you: true
  }, ...h.friends.map((f, i) => ({
    name: f.name,
    initials: f.initials || (f.name || "?")[0],
    color: f.color,
    streak: mkStreak((f.name || "X").charCodeAt(0) + i * 5 + (h.id || 1))
  }))] : [];
  // Each person's own 5-week pattern: recent `streak` days done, older scattered by
  // a per-person seed. Your row reuses the main `cells`, so it always matches above.
  var personCells = p => p.you ? cells : Array.from({
    length: 35
  }, (_, i) => {
    var fromEnd = 34 - i;
    if (fromEnd < p.streak) return true;
    return (i * 7 + (p.name || "X").charCodeAt(0) * 13 + (h.id || 1) * 5) % 10 > 6;
  });
  // Everyone (you + friends) with their own 5-week pattern. Scales past the old
  // 3-ring limit: `selPerson` = null → "Вся команда"; an index → that person's days.
  // (David's flow: I see the team, tap Марк, see exactly which days HE closed.)
  var fullRoster = roster.map(p => ({
    ...p,
    cells: personCells(p)
  }));
  var [selPerson, setSelPerson] = useM(null);
  var selP = selPerson != null && fullRoster[selPerson] ? fullRoster[selPerson] : null;
  // Per-day team participation — the "Вся команда" view for big circles (5–30 people)
  // where individual rings would be unreadable: the ring fills by how many showed up.
  var aggCount = cells.map((_, i) => fullRoster.filter(p => p.cells[i]).length);
  var aggFrac = cells.map((_, i) => fullRoster.length ? aggCount[i] / fullRoster.length : 0);
  // ONE common team ring (the density fill below) + per-person rings on tap — no more
  // stacked concentric rings (unreadable past 3, David cut them). Works for any size.
  // People + per-day completion feeding the shared PeopleMonthCalendar (same calendar
  // the team uses → one consistent look). dayFrac: did this person do the habit that day.
  var calPeople = isShared ? fullRoster.map(p => ({
    name: p.name,
    initials: p.initials,
    color: p.color,
    you: p.you
  })) : [{
    name: "Ты",
    initials: "Я",
    color: h.color || "#FFC400",
    you: true
  }];
  var habitFrac = (pi, d, mi) => {
    var p = isShared ? fullRoster[pi] : {
      you: true,
      streak
    };
    var lvl = p.you ? Math.min(1, Math.max(0.4, (rate || 70) / 100)) : Math.min(1, (p.streak || 10) / 26);
    var n = Math.sin(d * 9.137 + pi * 53.7 + mi * 21.3 + (h.id || 1) * 7.1) * 43758.5453;
    var r = n - Math.floor(n);
    return lvl * 0.55 + r * 0.5 > 0.55 ? 1 : 0; // a single habit on a given day → done or not
  };
  var card = isDark ? {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)"
  } : {
    background: "#fff",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      padding: "0 16px 24px"
    }
  }, /*#__PURE__*/React.createElement(PageHeader, {
    dark: isDark,
    title: "",
    onBack: () => navigate(back),
    right: /*#__PURE__*/React.createElement("button", {
      onClick: () => navigate("habit-settings", {
        mode: "edit",
        habit: h
      }),
      className: "tap",
      style: {
        background: "transparent",
        border: 0,
        fontSize: 15,
        fontWeight: 500,
        color: "var(--text-2)"
      }
    }, "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "6px 0 22px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 88,
      height: 88,
      borderRadius: 24,
      margin: "0 auto",
      background: tileBg,
      display: "grid",
      placeItems: "center",
      boxShadow: isDark ? "inset 0 1px 0 rgba(255,255,255,0.08)" : "inset 0 1px 0 rgba(255,255,255,0.6)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 44
    }
  }, h.emoji)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 26,
      fontWeight: 700,
      marginTop: 16,
      letterSpacing: "-0.5px"
    }
  }, h.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-4)",
      marginTop: 3
    }
  }, "\u0415\u0436\u0435\u0434\u043D\u0435\u0432\u043D\u043E", h.duration ? ` · ${h.duration} мин` : "", h.done ? " · выполнено сегодня" : "")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 8
    }
  }, [{
    l: "Серия",
    v: streak,
    suf: "д",
    i: "🔥"
  }, {
    l: "Лучшая",
    v: best,
    suf: "д",
    i: "🏆"
  }, {
    l: "Всего",
    v: total,
    suf: "",
    i: "📊"
  }].map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      ...card,
      borderRadius: 18,
      padding: "14px 8px",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17
    }
  }, s.i), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 21,
      fontWeight: 700,
      marginTop: 5,
      letterSpacing: "-0.5px"
    }
  }, /*#__PURE__*/React.createElement(Count, {
    value: s.v
  }), s.suf), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1,
      fontWeight: 600,
      marginTop: 3
    }
  }, s.l)))), isShared && (() => {
    var people = [...roster].sort((a, b) => b.streak - a.streak);
    var maxStreak = Math.max(...people.map(p => p.streak), 1);
    var myRank = people.findIndex(p => p.you) + 1;
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: "section-label",
      style: {
        marginTop: 22
      }
    }, "\u041A\u0442\u043E \u0441 \u0442\u043E\u0431\u043E\u0439 \xB7 \u0441\u043E\u0440\u0435\u0432\u043D\u043E\u0432\u0430\u043D\u0438\u0435"), /*#__PURE__*/React.createElement("div", {
      style: {
        ...card,
        borderRadius: 18,
        padding: 8,
        marginTop: 8
      }
    }, people.map((p, i) => {
      var fi = fullRoster.findIndex(x => x.name === p.name);
      var sel = selPerson === fi;
      return /*#__PURE__*/React.createElement("div", {
        key: i,
        onClick: () => setSelPerson(sel ? null : fi),
        className: "tap",
        style: {
          display: "flex",
          alignItems: "center",
          gap: 11,
          padding: "9px 8px",
          borderRadius: 12,
          cursor: "pointer",
          transition: "background 0.15s",
          background: sel ? isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)" : p.you ? isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.035)" : "transparent",
          boxShadow: sel ? `inset 0 0 0 1.5px ${p.color}` : "none"
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          width: 22,
          textAlign: "center",
          fontSize: i === 0 ? 15 : 13,
          fontWeight: 700,
          color: i === 0 ? "#E0A500" : "var(--text-4)"
        }
      }, i === 0 ? "👑" : i + 1), /*#__PURE__*/React.createElement("span", {
        style: {
          width: 34,
          height: 34,
          borderRadius: "50%",
          background: p.color,
          display: "grid",
          placeItems: "center",
          fontSize: 13,
          fontWeight: 700,
          color: "rgba(0,0,0,0.55)",
          flexShrink: 0
        }
      }, p.initials), /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1,
          minWidth: 0
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 14.5,
          fontWeight: p.you ? 700 : 500,
          color: "var(--text)"
        }
      }, p.name), /*#__PURE__*/React.createElement("div", {
        style: {
          height: 5,
          background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
          borderRadius: 999,
          marginTop: 5,
          overflow: "hidden"
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          display: "block",
          height: "100%",
          width: p.streak / maxStreak * 100 + "%",
          background: i === 0 ? "linear-gradient(90deg,#FFC400,#FF8A5B)" : isDark ? "rgba(255,255,255,0.42)" : "rgba(0,0,0,0.35)",
          borderRadius: 999
        }
      }))), /*#__PURE__*/React.createElement("span", {
        style: {
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          flexShrink: 0
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 13
        }
      }, "\uD83D\uDD25"), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 15,
          fontWeight: 700,
          color: "var(--text)"
        }
      }, p.streak)));
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "var(--text-4)",
        textAlign: "center",
        padding: "8px 4px 4px",
        lineHeight: 1.4
      }
    }, selP ? `Внизу — дни, когда ${selP.you ? "ты отмечал" : selP.name + " отмечал"} привычку. Нажми ещё раз, чтобы снять.` : myRank === 1 ? "Ты лидируешь! Нажми на любого — внизу покажу его дни." : `Ты на ${myRank}-м месте. Нажми на любого — внизу покажу его дни.`)));
  })(), /*#__PURE__*/React.createElement(PeopleMonthCalendar, {
    people: calPeople,
    dayFrac: habitFrac,
    label: "\u041A\u0430\u043B\u0435\u043D\u0434\u0430\u0440\u044C \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0438",
    selPerson: isShared ? selPerson : undefined,
    onSelPerson: isShared ? setSelPerson : undefined
  }), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, "\u0418\u043D\u0441\u0430\u0439\u0442"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...card,
      borderRadius: 18,
      padding: 14,
      marginTop: 8,
      display: "flex",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(I.Sparkles, {
    size: 18,
    color: h.color || (isDark ? "#fff" : "#0a0a0a")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      fontSize: 13,
      color: "var(--text-2)",
      lineHeight: 1.5
    }
  }, streak >= 7 ? `Серия уже ${streak} дней — это работает на автопилоте. Не разрывай цепочку сегодня.` : `Ещё ${Math.max(1, 7 - streak)} дн. — и привычка станет автоматической. Сейчас самый важный момент.`)), /*#__PURE__*/React.createElement("button", {
    onClick: () => app?.toggleHabit && app.toggleHabit(h.id),
    className: "bos-btn",
    style: {
      marginTop: 22,
      background: h.done ? isDark ? "rgba(255,255,255,0.1)" : "var(--surface-3)" : undefined,
      color: h.done ? "var(--text-2)" : undefined
    }
  }, h.done ? "✓ Выполнено сегодня" : "Отметить выполненной"));
}

/* GOAL DETAIL — progress ring, the habits it's built from (cross-linked into
   their own stats), a pace hint, and a +1 to nudge progress. Opened by tapping
   a goal on Home or Habits. Back returns to the origin tab (params.from). */
function GoalDetailScreen() {
  var {
    navigate,
    params
  } = useNav();
  var app = typeof useApp === "function" ? useApp() : null;
  var back = params?.from || "habits";
  var seed = params?.goal || {
    id: 0,
    emoji: "🎯",
    name: "Цель",
    current: 0,
    target: 1,
    unit: "",
    deadline: ""
  };
  var g = app?.goals && app.goals.find(x => x.id === seed.id) || seed;
  var isDark = app?.themeOverride === "dark";
  var Count = typeof CountUp !== "undefined" ? CountUp : ({
    value
  }) => value;
  var pct = g.target ? Math.min(1, (g.current || 0) / g.target) : 0;
  var remaining = Math.max(0, (g.target || 0) - (g.current || 0));
  var done = pct >= 1;
  var linked = (app?.habits || []).filter(h => (g.habitIds || []).includes(h.id));
  var card = isDark ? {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)"
  } : {
    background: "#fff",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
  };
  var ringTrack = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.07)";
  var R = 54,
    CIRC = 2 * Math.PI * R;
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      padding: "0 16px 24px"
    }
  }, /*#__PURE__*/React.createElement(PageHeader, {
    dark: isDark,
    title: "",
    onBack: () => navigate(back),
    right: /*#__PURE__*/React.createElement("button", {
      onClick: () => navigate("goal-settings", {
        mode: "edit",
        goal: g
      }),
      className: "tap",
      style: {
        background: "transparent",
        border: 0,
        fontSize: 15,
        fontWeight: 500,
        color: "var(--text-2)"
      }
    }, "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "6px 0 18px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: 170,
      height: 170,
      margin: "0 auto"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "170",
    height: "170",
    viewBox: "0 0 140 140",
    style: {
      transform: "rotate(-90deg)"
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: "goalGrad",
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
  }))), /*#__PURE__*/React.createElement("circle", {
    cx: "70",
    cy: "70",
    r: R,
    fill: "none",
    stroke: ringTrack,
    strokeWidth: "13"
  }), pct > 0 && /*#__PURE__*/React.createElement("circle", {
    cx: "70",
    cy: "70",
    r: R,
    fill: "none",
    stroke: "url(#goalGrad)",
    strokeWidth: "13",
    strokeLinecap: "round",
    strokeDasharray: CIRC,
    strokeDashoffset: CIRC * (1 - pct),
    style: {
      transition: "stroke-dashoffset 0.6s ease",
      ...(done ? {
        filter: "drop-shadow(0 0 6px rgba(239,159,20,0.5))"
      } : {})
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      display: "grid",
      placeItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 34,
      lineHeight: 1
    }
  }, g.emoji), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 28,
      fontWeight: 800,
      marginTop: 4,
      letterSpacing: "-0.5px"
    }
  }, /*#__PURE__*/React.createElement(Count, {
    value: Math.round(pct * 100)
  }), "%")))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 700,
      marginTop: 14,
      letterSpacing: "-0.4px"
    }
  }, g.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-4)",
      marginTop: 3
    }
  }, /*#__PURE__*/React.createElement(Count, {
    value: g.current || 0
  }), " \u0438\u0437 ", g.target, " ", g.unit, " \xB7 \u0434\u043E ", g.deadline)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 8
    }
  }, [{
    l: "Осталось",
    v: remaining,
    i: "🎯"
  }, {
    l: "Сделано",
    v: g.current || 0,
    i: "✅"
  }, {
    l: "Срок",
    text: g.deadline,
    i: "📅"
  }].map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      ...card,
      borderRadius: 18,
      padding: "14px 6px",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16
    }
  }, s.i), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: s.text ? 13.5 : 21,
      fontWeight: 700,
      marginTop: 6,
      letterSpacing: "-0.4px"
    }
  }, s.text ? s.text : /*#__PURE__*/React.createElement(Count, {
    value: s.v
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1,
      fontWeight: 600,
      marginTop: 3
    }
  }, s.l)))), linked.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, "\u0421\u043A\u043B\u0430\u0434\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u0438\u0437 \u043F\u0440\u0438\u0432\u044B\u0447\u0435\u043A"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...card,
      borderRadius: 18,
      marginTop: 8,
      overflow: "hidden"
    }
  }, linked.map((h, i) => /*#__PURE__*/React.createElement("div", {
    key: h.id
  }, /*#__PURE__*/React.createElement("button", {
    className: "tap",
    onClick: () => navigate("habit-detail", {
      habit: h,
      from: "goal-detail"
    }),
    style: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 14px",
      background: "transparent",
      border: 0,
      textAlign: "left",
      color: "var(--text)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 11,
      background: h.color ? h.color + "26" : isDark ? "rgba(255,255,255,0.06)" : "var(--surface-3)",
      display: "grid",
      placeItems: "center",
      fontSize: 19,
      flexShrink: 0
    }
  }, h.emoji), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      color: "var(--text-2)",
      fontWeight: 500
    }
  }, h.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-4)",
      marginTop: 1
    }
  }, "\uD83D\uDD25 ", h.streak || 0, "\u0434 \u0441\u0435\u0440\u0438\u044F")), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 17,
    color: "var(--text-4)"
  })), i < linked.length - 1 && /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)"
    }
  }))))), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, "\u041F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0430"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...card,
      borderRadius: 18,
      padding: 14,
      marginTop: 8,
      display: "flex",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(I.Sparkles, {
    size: 18,
    color: isDark ? "#fff" : "#0a0a0a"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      fontSize: 13,
      color: "var(--text-2)",
      lineHeight: 1.5
    }
  }, done ? `Цель достигнута 🎉 «${g.name}» закрыта — можно поставить новую планку.` : pct >= 0.8 ? `Финишная прямая — осталось ${remaining} ${g.unit}. Не сбавляй до ${g.deadline}.` : pct >= 0.5 ? `Больше половины пути. ${linked[0] ? `Главный двигатель — «${linked[0].name}»: не разрывай серию.` : "Держи темп."}` : `${linked[0] ? `Каждая отметка «${linked[0].name}» приближает к цели. ` : "Начало положено. "}Осталось ${remaining} ${g.unit} до ${g.deadline}.`)), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (!done && app?.updateGoal) app.updateGoal(g.id, {
        current: Math.min(g.target, (g.current || 0) + 1)
      });
    },
    className: "bos-btn",
    style: {
      marginTop: 22,
      background: done ? isDark ? "rgba(255,255,255,0.1)" : "var(--surface-3)" : undefined,
      color: done ? "var(--text-2)" : undefined
    }
  }, done ? "✓ Цель достигнута" : "+1 к прогрессу"));
}

/* MOOD CHECK-IN — quick state pulse */
/* MOOD CHECK-IN — fullscreen, edge-to-edge black with a centered aurora
   vignette so top/bottom stay pure black. State is represented entirely by
   colored orbs (no emoji). Includes a consistency-streak bonus strip. */
/* Contextual sub-state hashtags per mood — tap to journal without typing a word. */
var MOOD_TAGS = {
  "Энергия": ["выспался", "спорт", "продуктивно", "вдохновение", "цель", "музыка", "свежесть", "кофе"],
  "Радость": ["встреча_с_друзьями", "успех", "благодарность", "природа", "любовь", "смех", "забота", "хорошая_новость"],
  "Спокойствие": ["медитация", "тишина", "прогулка", "баланс", "выспался", "чтение", "дыхание", "природа"],
  "Тревога": ["дедлайн", "неопределённость", "недосып", "перегруз", "ожидание", "новости", "конфликт", "здоровье"],
  "Упадок": ["усталость", "одиночество", "переутомление", "неудача", "пасмурно", "рутина", "недосып", "сомнения"],
  "Усталость": ["недосып", "перегруз", "много_задач", "дорога", "экраны", "стресс", "нет_отдыха", "мало_движения"]
};
function MoodScreen() {
  var {
    navigate
  } = useNav();
  var app = useApp ? useApp() : null;
  var moods = typeof MOOD_OPTIONS !== "undefined" ? MOOD_OPTIONS : [{
    i: "😌",
    t: "Спокойствие",
    c: "#cfe1ff"
  }, {
    i: "⚡️",
    t: "Энергия",
    c: "#fef3c7"
  }, {
    i: "😔",
    t: "Упадок",
    c: "#e3e3e3"
  }, {
    i: "😤",
    t: "Стресс",
    c: "#fde2e2"
  }, {
    i: "🙂",
    t: "Ровно",
    c: "#d6f3df"
  }, {
    i: "🔥",
    t: "В огне",
    c: "#ffe1c8"
  }];
  var [picked, setPicked] = useM(app?.mood?.t ? moods.findIndex(m => m.t === app.mood.t) : -1);
  var [note, setNote] = useM("");
  var [tags, setTags] = useM([]);

  // Breathing time
  var [t, setT] = useM(0);
  React.useEffect(() => {
    var raf,
      s = performance.now();
    var tick = now => {
      setT((now - s) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  var breath = 1 + Math.sin(t * 0.8) * 0.04;
  var pulse = 1 + Math.sin(t * 1.3) * 0.06;
  var cur = picked >= 0 ? moods[picked] : null;
  var tint = cur ? cur.c : "#6a7a92";

  // Consistency mock — how many recent days had a mood logged
  var streak = (() => {
    if (!app?.dayMoods) return 3;
    return Object.keys(app.dayMoods).length;
  })();
  var bonusXP = streak * 5;
  var sameStateStreak = (() => {
    if (!cur || !app?.dayMoods) return 0;
    var days = Object.entries(app.dayMoods).sort(([a], [b]) => b - a);
    var s = 0;
    for (var [, mi] of days) {
      if (moods[mi]?.t === cur.t) s++;else break;
    }
    return s;
  })();
  var TODAY = 28;
  var moodTags = cur ? MOOD_TAGS[cur.t] || [] : [];
  var toggleTag = tg => setTags(ts => ts.includes(tg) ? ts.filter(x => x !== tg) : [...ts, tg]);
  var onSave = () => {
    if (picked < 0 || !app) return navigate("home");
    // Live → key by the REAL date (so check-ins accumulate per day & pay XP); demo → curated day.
    var dayKey = app.mode === "live" && typeof bosTodayKey === "function" ? bosTodayKey() : TODAY;
    app.setMood && app.setMood(moods[picked]);
    app.setDayMoods && app.setDayMoods({
      ...(app.dayMoods || {}),
      [dayKey]: picked
    });
    app.setDayNotes && app.setDayNotes({
      ...(app.dayNotes || {}),
      [dayKey]: {
        tags,
        note: note.trim()
      }
    });
    navigate("home");
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "mood-fullscreen",
    style: {
      position: "absolute",
      inset: 0,
      color: "#fff",
      overflow: "hidden",
      background: "#000",
      display: "flex",
      flexDirection: "column",
      ["--mood-tint"]: tint
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      background: `radial-gradient(70% 45% at 50% 42%, ${tint}55 0%, ${tint}22 30%, transparent 65%)`,
      transition: "background 0.6s ease"
    }
  }), /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      background: "linear-gradient(180deg, #000 0%, transparent 18%, transparent 80%, #000 100%)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      zIndex: 2,
      padding: "60px 20px 0",
      display: "flex",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("home"),
    className: "tap",
    style: {
      width: 40,
      height: 40,
      borderRadius: 999,
      background: "rgba(255,255,255,0.07)",
      border: 0,
      color: "#fff",
      display: "grid",
      placeItems: "center",
      padding: 0
    }
  }, /*#__PURE__*/React.createElement(I.ChevronLeft, {
    size: 18
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      textAlign: "center",
      fontSize: 11,
      letterSpacing: 1.6,
      textTransform: "uppercase",
      color: "rgba(255,255,255,0.5)",
      fontWeight: 600
    }
  }, "\u041E\u0442\u043C\u0435\u0442\u043A\u0430 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u044F"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      zIndex: 2,
      flex: cur ? "0 0 auto" : 1,
      display: "grid",
      placeItems: "center",
      padding: "12px 20px 0",
      minHeight: cur ? 132 : 220,
      transition: "min-height 0.4s ease"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: cur ? 156 : 220,
      height: cur ? 156 : 220,
      display: "grid",
      placeItems: "center",
      transition: "width 0.4s ease, height 0.4s ease"
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      inset: -40,
      borderRadius: "50%",
      background: `radial-gradient(circle, ${tint}80 0%, ${tint}33 35%, transparent 70%)`,
      opacity: 0.85 * pulse,
      filter: "blur(20px)",
      transform: `scale(${pulse})`,
      transition: "background 0.6s ease"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      transform: `scale(${breath})`,
      transition: "transform 0.15s"
    }
  }, /*#__PURE__*/React.createElement(StateOrb, {
    size: cur ? 140 : 196,
    tint: tintFromMood(tint),
    intensity: cur ? 1.3 : 0.7
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      zIndex: 2,
      padding: "0 24px",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
      fontSize: 30,
      fontWeight: 600,
      lineHeight: 1.1,
      letterSpacing: "-0.6px",
      minHeight: 36
    }
  }, cur ? cur.t : "Как оно ощущается\u00A0сейчас?"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "rgba(255,255,255,0.55)",
      marginTop: 6,
      lineHeight: 1.5
    }
  }, cur ? "Отметь, что за этим стоит — или просто сохрани." : "Каждый цвет — это состояние. Выбери подходящее.")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      zIndex: 2,
      padding: cur ? "14px 20px 0" : "26px 20px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(6, 1fr)",
      gap: 8
    }
  }, moods.map((m, idx) => {
    var active = picked === idx;
    return /*#__PURE__*/React.createElement("button", {
      key: idx,
      onClick: () => {
        setPicked(idx);
        setTags([]);
        setNote("");
      },
      className: "tap",
      "aria-label": m.t,
      style: {
        background: "transparent",
        border: 0,
        padding: "6px 2px 8px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        color: "#fff",
        cursor: "pointer"
      }
    }, /*#__PURE__*/React.createElement("span", {
      "aria-hidden": true,
      style: {
        borderRadius: "50%",
        boxShadow: active ? `0 0 0 2px #fff, 0 0 18px ${m.c}aa` : "none",
        transform: active ? "scale(1.08)" : "scale(1)",
        transition: "transform 0.25s, box-shadow 0.25s"
      }
    }, /*#__PURE__*/React.createElement(StaticOrb, {
      size: 38,
      tint: tintFromMood(m.c),
      seed: 1.2,
      intensity: 0.3
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: 0.3,
        opacity: active ? 1 : 0.6,
        textAlign: "center",
        lineHeight: 1.1
      }
    }, m.t));
  }))), cur ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      zIndex: 2,
      margin: "16px 20px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 8,
      marginBottom: 11
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      color: "rgba(255,255,255,0.5)",
      fontWeight: 600
    }
  }, "\u0427\u0442\u043E \u0437\u0430 \u044D\u0442\u0438\u043C \u0441\u0442\u043E\u0438\u0442?"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "rgba(255,255,255,0.3)"
    }
  }, "\u043F\u043E \u0436\u0435\u043B\u0430\u043D\u0438\u044E")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 8
    }
  }, moodTags.map(tg => {
    var on = tags.includes(tg);
    return /*#__PURE__*/React.createElement("button", {
      key: tg,
      onClick: () => toggleTag(tg),
      className: "tap",
      "data-no-haptic": true,
      style: {
        padding: "8px 13px",
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 500,
        border: 0,
        cursor: "pointer",
        background: on ? "#fff" : "rgba(255,255,255,0.08)",
        color: on ? "#0a0a0a" : "rgba(255,255,255,0.72)",
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        transition: "background 0.18s, color 0.18s"
      }
    }, on && /*#__PURE__*/React.createElement("span", {
      style: {
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: tint
      }
    }), tg.replace(/_/g, " "));
  })), /*#__PURE__*/React.createElement("textarea", {
    value: note,
    onChange: e => setNote(e.target.value),
    placeholder: "\u041E\u043F\u0438\u0448\u0438, \u0447\u0442\u043E \u0447\u0443\u0432\u0441\u0442\u0432\u0443\u0435\u0448\u044C \u0441\u0435\u0439\u0447\u0430\u0441\u2026",
    style: {
      width: "100%",
      marginTop: 12,
      background: "rgba(0,0,0,0.25)",
      border: "1px solid rgba(255,255,255,0.10)",
      boxShadow: "inset 0 1px 4px rgba(0,0,0,0.35)",
      borderRadius: 14,
      padding: "12px 14px",
      color: "#fff",
      fontSize: 16,
      fontFamily: "inherit",
      lineHeight: 1.4,
      outline: 0,
      minHeight: 50,
      resize: "none",
      boxSizing: "border-box",
      display: "block"
    }
  })) : /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      zIndex: 2,
      margin: "18px 20px 0",
      padding: "12px 14px",
      background: "rgba(255,255,255,0.045)",
      borderRadius: 16,
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 36,
      borderRadius: 999,
      background: "rgba(254,222,52,0.14)",
      display: "grid",
      placeItems: "center",
      color: "#FEDE34",
      fontSize: 18
    }
  }, "\u2728"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      color: "rgba(255,255,255,0.45)",
      fontWeight: 600
    }
  }, "\u0414\u043D\u0435\u0432\u043D\u0438\u043A \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u044F"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "rgba(255,255,255,0.9)",
      marginTop: 3,
      lineHeight: 1.35
    }
  }, "\u0412\u044B\u0431\u0435\u0440\u0438 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435 \u2014 \u043F\u043E\u0434\u0441\u043A\u0430\u0436\u0443 \u0441\u043B\u043E\u0432\u0430, \u0447\u0442\u043E\u0431\u044B \u043E\u0442\u043C\u0435\u0442\u0438\u0442\u044C, \u0447\u0442\u043E \u0437\u0430 \u043D\u0438\u043C \u0441\u0442\u043E\u0438\u0442."))), cur && /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      flex: 1,
      minHeight: 6
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      zIndex: 2,
      padding: "14px 20px 28px"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onSave,
    disabled: picked < 0,
    className: "tap",
    style: {
      width: "100%",
      background: picked < 0 ? "rgba(255,255,255,0.08)" : "#fff",
      color: picked < 0 ? "rgba(255,255,255,0.4)" : "#0a0a0a",
      border: 0,
      borderRadius: 999,
      padding: 16,
      fontSize: 15,
      fontWeight: 600,
      letterSpacing: "-0.1px",
      transition: "all 0.2s"
    }
  }, picked < 0 ? "Выбери состояние" : "Сохранить отметку")));
}

/* Darken a hex color by amount (0–1) — used to deepen orb gradients. */
function darken(hex, amt = 0.4) {
  if (!hex || hex[0] !== "#") return "#222";
  var h = hex.slice(1);
  if (h.length === 3) h = h.split("").map(c => c + c).join("");
  var n = parseInt(h, 16);
  var r = Math.max(0, (n >> 16 & 255) * (1 - amt)) | 0;
  var g = Math.max(0, (n >> 8 & 255) * (1 - amt)) | 0;
  var b = Math.max(0, (n & 255) * (1 - amt)) | 0;
  return "#" + (r << 16 | g << 8 | b).toString(16).padStart(6, "0");
}

/* JOURNAL / DAILY REFLECTION */
function JournalScreen() {
  var {
    navigate
  } = useNav();
  var [a, setA] = useM("");
  var [b, setB] = useM("");
  var [c, setC] = useM("");
  var past = [{
    date: "27 апр",
    w: "Сохранил серию даже после долгого дня.",
    g: "Не гнать себя во второй половине дня."
  }, {
    date: "26 апр",
    w: "Помог Нику с пробежкой.",
    g: "Читать 30 минут перед сном."
  }, {
    date: "25 апр",
    w: "Заметил, что спокойнее в групповые дни.",
    g: "Спланировать завтра сегодня вечером."
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      padding: "0 16px 24px"
    }
  }, /*#__PURE__*/React.createElement(PageHeader, {
    title: "\u0415\u0436\u0435\u0434\u043D\u0435\u0432\u043D\u0430\u044F \u0440\u0435\u0444\u043B\u0435\u043A\u0441\u0438\u044F",
    onBack: () => navigate("home")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#fff",
      borderRadius: 22,
      padding: 18,
      boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1.4,
      fontWeight: 600
    }
  }, "28 \u0430\u043F\u0440 \xB7 \u0412\u0442\u043E\u0440\u043D\u0438\u043A"), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 16,
      color: "var(--text-2)"
    }
  }, "\u0427\u0442\u043E \u043F\u0440\u043E\u0448\u043B\u043E \u0445\u043E\u0440\u043E\u0448\u043E?"), /*#__PURE__*/React.createElement("textarea", {
    value: a,
    onChange: e => setA(e.target.value),
    placeholder: "\u041C\u0430\u043A\u0441\u0438\u043C\u0443\u043C \u0442\u0440\u0438 \u0441\u0442\u0440\u043E\u043A\u0438.",
    style: {
      width: "100%",
      background: "var(--surface-3)",
      border: 0,
      borderRadius: 12,
      padding: 12,
      marginTop: 8,
      fontSize: 14,
      fontFamily: "inherit",
      outline: 0,
      minHeight: 70,
      resize: "none"
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 16,
      color: "var(--text-2)"
    }
  }, "\u0427\u0442\u043E \u043F\u043E\u043C\u0435\u0448\u0430\u043B\u043E?"), /*#__PURE__*/React.createElement("textarea", {
    value: b,
    onChange: e => setB(e.target.value),
    placeholder: "\u041E\u0434\u043D\u043E \u0447\u0435\u0441\u0442\u043D\u043E\u0435 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u0435.",
    style: {
      width: "100%",
      background: "var(--surface-3)",
      border: 0,
      borderRadius: 12,
      padding: 12,
      marginTop: 8,
      fontSize: 14,
      fontFamily: "inherit",
      outline: 0,
      minHeight: 70,
      resize: "none"
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 16,
      color: "var(--text-2)"
    }
  }, "\u041E\u0434\u043D\u0430 \u0432\u0435\u0449\u044C \u043D\u0430 \u0437\u0430\u0432\u0442\u0440\u0430"), /*#__PURE__*/React.createElement("textarea", {
    value: c,
    onChange: e => setC(e.target.value),
    placeholder: "\u0427\u0435\u043C \u043C\u0435\u043D\u044C\u0448\u0435, \u0442\u0435\u043C \u043B\u0443\u0447\u0448\u0435.",
    style: {
      width: "100%",
      background: "var(--surface-3)",
      border: 0,
      borderRadius: 12,
      padding: 12,
      marginTop: 8,
      fontSize: 14,
      fontFamily: "inherit",
      outline: 0,
      minHeight: 70,
      resize: "none"
    }
  })), /*#__PURE__*/React.createElement("button", {
    className: "bos-btn",
    style: {
      marginTop: 16
    },
    onClick: () => navigate("home")
  }, "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \xB7 +15 XP"), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, "\u041F\u0440\u043E\u0448\u043B\u044B\u0435 \u0437\u0430\u043F\u0438\u0441\u0438"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      marginTop: 8
    }
  }, past.map((p, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      background: "#fff",
      borderRadius: 14,
      padding: 14,
      boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-4)",
      fontWeight: 600
    }
  }, p.date), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      marginTop: 6,
      color: "var(--text-2)"
    }
  }, /*#__PURE__*/React.createElement("b", null, "\u041F\u043E\u0431\u0435\u0434\u0430:"), " ", p.w), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      marginTop: 4,
      color: "var(--text-3)"
    }
  }, /*#__PURE__*/React.createElement("b", null, "\u0417\u0430\u0432\u0442\u0440\u0430:"), " ", p.g)))));
}

/* FOCUS SESSION — pomodoro-ish */
/* (FocusScreen removed — habit sessions now run inline as a segmented ring timer
   right in the habit row; see HabitRing in habits.jsx.) */

/* LEVEL-UP modal screen — celebratory in-app moment */
function LevelUpScreen() {
  var {
    navigate
  } = useNav();
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      height: "100%",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      padding: 24,
      position: "relative",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "radial-gradient(circle at 50% 30%, rgba(255,222,52,0.25), transparent 60%)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#FEDE34",
      textTransform: "uppercase",
      letterSpacing: 2,
      fontWeight: 700
    }
  }, "\u041D\u043E\u0432\u044B\u0439 \u0443\u0440\u043E\u0432\u0435\u043D\u044C"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 110,
      fontWeight: 800,
      letterSpacing: "-4px",
      lineHeight: 1,
      marginTop: 6,
      background: "linear-gradient(135deg,#FEDE34,#EF9F14)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent"
    }
  }, "8"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 600,
      marginTop: 8
    }
  }, "\u0421\u043E\u0441\u0440\u0435\u0434\u043E\u0442\u043E\u0447\u0435\u043D\u043D\u044B\u0439"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: "#9f9fa9",
      marginTop: 14,
      maxWidth: 280,
      lineHeight: 1.5
    }
  }, "\u0422\u044B \u0437\u0430\u0440\u0430\u0431\u043E\u0442\u0430\u043B ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: "#FEDE34"
    }
  }, "+250 XP"), " \u0438 \u043E\u0442\u043A\u0440\u044B\u043B \u043D\u043E\u0432\u044B\u0439 \u0443\u0440\u043E\u0432\u0435\u043D\u044C \u043D\u0430\u0433\u0440\u0430\u0434."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginTop: 24
    }
  }, ["🔥", "🏆", "✨"].map((e, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      width: 50,
      height: 50,
      borderRadius: 14,
      background: "rgba(255,255,255,0.08)",
      border: "1px solid rgba(255,255,255,0.1)",
      display: "grid",
      placeItems: "center",
      fontSize: 26
    }
  }, e)))), /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("levels"),
    className: "tap",
    style: {
      background: "#FEDE34",
      color: "#0a0a0a",
      border: 0,
      borderRadius: 999,
      padding: 16,
      fontSize: 16,
      fontWeight: 600
    }
  }, "\u0417\u0430\u0431\u0440\u0430\u0442\u044C \u043D\u0430\u0433\u0440\u0430\u0434\u044B"), /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("home"),
    className: "tap",
    style: {
      background: "transparent",
      color: "#9f9fa9",
      border: 0,
      padding: 12,
      fontSize: 13,
      marginTop: 6
    }
  }, "\u041F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u044C"));
}

/* AI CHAT — rich conversational coach with structured AI replies */

/* Tiny calm sphere — same blue DNA as intro/AI orb. No asset image, no glow. */
function ChatSphere({
  size = 28
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: size,
      height: size,
      borderRadius: "50%",
      flexShrink: 0,
      background: "radial-gradient(circle at 32% 28%, #ffffff 0%, #cfe1ff 18%, #8eb0d8 50%, #2c4d76 85%, #0a1424 100%)",
      boxShadow: "inset -2px -3px 5px rgba(0,0,0,0.25)"
    }
  });
}

/* The mentor speaks THROUGH the orb of your current state — so its avatar in the
   chat is tinted by your mood (same glass-orb DNA as onboarding). Cheap CSS orb
   so we can render one per message without animating dozens of SVG filters. */
function StateChatOrb({
  size = 28,
  tint
}) {
  var c = tint && tint.length === 3 ? tint : ["#cfe1ff", "#7aa4d0", "#2c4d76"];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: size,
      height: size,
      borderRadius: "50%",
      flexShrink: 0,
      background: "radial-gradient(circle at 32% 28%, #ffffff 0%, " + c[0] + " 20%, " + c[1] + " 52%, " + c[2] + " 86%, #0a1424 100%)",
      boxShadow: "inset -2px -3px 5px rgba(0,0,0,0.28)"
    }
  });
}

/* Context-aware quick prompts (the pills under the chat). A blank-slate user gets
   newcomer-friendly openers; once habits/mood/goals exist, the chips turn personal —
   protect the strongest live streak, match low energy, break a goal down. */
function buildQuickPrompts(app) {
  try {
    var habits = app && app.habits || [];
    var goals = app && app.goals || [];
    var moodT = app && app.mood && app.mood.t || "";
    if (!habits.length) {
      return [{
        i: "🌱",
        t: "С чего мне начать?"
      }, {
        i: "✨",
        t: "Предложи первую привычку"
      }, {
        i: "🌊",
        t: "Хочу меньше тревоги"
      }, {
        i: "🧭",
        t: "Помоги навести порядок в дне"
      }];
    }
    var chips = [];
    var atRisk = habits.filter(h => !h.done && (h.streak || 0) > 0).sort((a, b) => (b.streak || 0) - (a.streak || 0))[0];
    if (atRisk) chips.push({
      i: "🔥",
      t: "Не сорвать «" + (atRisk.name || "привычку") + "»"
    });
    var low = /устал|упад|трев|стресс|тяж|нет сил/i.test(moodT);
    chips.push(low ? {
      i: "💤",
      t: "Сегодня мало сил"
    } : {
      i: "🌙",
      t: "Спланируй вечер"
    });
    if (goals.length) chips.push({
      i: "🎯",
      t: "Разбей цель на шаги"
    });
    chips.push({
      i: "🧭",
      t: "Что сейчас важнее всего?"
    });
    return chips.slice(0, 4);
  } catch (e) {
    return [{
      i: "🌙",
      t: "Спланируй вечер"
    }, {
      i: "✨",
      t: "Предложи привычку"
    }, {
      i: "🌊",
      t: "Хочу меньше тревоги"
    }, {
      i: "🧭",
      t: "С чего начать?"
    }];
  }
}

/* Bar chart used inside an AI insight bubble */
function MiniBars({
  data,
  color = "#0a0a0a",
  height = 60,
  textMuted = "rgba(0,0,0,0.5)",
  barIdle = "rgba(0,0,0,0.12)"
}) {
  var max = Math.max(...data.map(d => d.v));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      gap: 6,
      height,
      marginTop: 10
    }
  }, data.map((d, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      borderRadius: 4,
      height: d.v / max * (height - 16),
      background: d.h ? color : barIdle,
      transition: "height 0.4s"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: textMuted,
      letterSpacing: 0.5
    }
  }, d.l))));
}

/* ── Live AI via OpenRouter ─────────────────────────────────────────────────
   Uses the key from aikey.js (window.OPENROUTER_KEY). No key → graceful canned
   replies so the demo still feels alive. Browser-direct call (OpenRouter allows
   it); the key is the user's capped test key on a free model, by their choice. */
var AI_SYSTEM = ["Ты — тихий внутренний наставник внутри приложения для баланса, состояния и привычек.", "У тебя нет имени и нет бренда. Никогда не называй себя «Balance», «ассистентом», «ИИ» или продуктом. Если спросят, как тебя зовут — мягко уйди от ответа: имя не важно, считай меня голосом, который помогает тебе вернуться к себе.", "", "ОТКУДА ТЫ ГОВОРИШЬ.", "В тебе соединились две школы — стоицизм и дзен, — но без эзотерики и тумана. Только то, что работает в материальной реальности: в обычном дне, в теле, в делах, в отношениях, в деньгах и усталости.", "Из стоицизма: отделяй то, что в твоей власти, от того, что нет, и вкладывайся только в первое. Цени поступок, а не результат, который тебе не принадлежит. Спокойно прими то, что нельзя изменить, и действуй там, где можно. Иногда — взгляд сверху: будет ли это важно через год.", "Из дзена: возвращай человека в это мгновение, потому что жизнь только здесь. Между тем, что случилось, и тем, как ты ответишь, есть промежуток — в нём вся свобода. Ум новичка: меньше ярлыков, больше живого внимания. «Руби дрова, носи воду» — смысл живёт не в великом замысле, а в следующем простом действии, сделанном целиком.", "", "КАК ТЫ ГОВОРИШЬ.", "— По-русски, на «ты». Спокойно, тепло, по-человечески. Без канцелярита, без морализаторства свысока, без сюсюканья и без дешёвых аффирмаций.", "— Коротко. Обычно 2–4 предложения. Это чат в телефоне, а не лекция. Никаких длинных списков, если человек сам не попросил.", "— Сначала по-настоящему увидь человека и его состояние — честно, без лести. Потом помогай.", "— Давай ОДНО, а не десять: либо один маленький реальный шаг (часто на 2–5 минут), либо одну точную мысль, которая меняет угол зрения. Не вываливай всё сразу.", "— Не бойся сказать неудобную правду — но мягко, как друг, который на твоей стороне. Сильный инсайт называет то, что человек смутно чувствовал, но не мог сформулировать.", "— Иногда вместо совета задай один точный вопрос, от которого человек сам увидит выход.", "", "НА ЧТО ОПИРАЕШЬСЯ.", "Тебе дают живой контекст человека: имя, состояние, привычки, серии, цели, уровень. Вплетай это естественно — но никогда не зачитывай списком и не выдумывай того, чего не знаешь.", "", "ЧЕГО НЕ ДЕЛАЕШЬ.", "Не ставишь диагнозы и не заменяешь врача или психолога — если звучит что-то тяжёлое или опасное, мягко предложи обратиться к специалисту и побудь рядом словом. Не стыдишь за срывы и пропуски — помогаешь вернуться без чувства вины. Не уходишь в мистику, гороскопы и пустые духовные лозунги: ты стоишь ногами на земле.", "", "Твоя суперсила — превращать хаос и «всё или ничего» в одно ясное действие здесь и сейчас, а иногда — в одну мысль, после которой день видится по-другому."].join("\n");

// Build a compact, live snapshot of the user for the model — so replies are personal
// and on-point, not generic. Woven into the system message, never shown to the user.
function buildAiContext(app) {
  try {
    if (!app) return "";
    var parts = [];
    var name = (app.userName || "").trim();
    if (name) parts.push("Имя: " + name + ".");
    if (app.mood && app.mood.t) parts.push("Сейчас по ощущениям: " + app.mood.t + ".");
    var habits = app.habits || [];
    if (habits.length) {
      var done = habits.filter(function (h) {
        return h.done;
      }).length;
      var list = habits.slice(0, 8).map(function (h) {
        return (h.emoji ? h.emoji + " " : "") + (h.name || "") + (h.streak ? " (серия " + h.streak + ")" : "") + (h.done ? " — сегодня сделано" : "");
      }).join("; ");
      parts.push("Привычки сегодня " + done + "/" + habits.length + ": " + list + ".");
    } else {
      parts.push("Привычек пока нет — помоги выбрать первую: маленькую, конкретную и реалистичную.");
    }
    var goals = (app.goals || []).map(function (g) {
      return g.name || g.title;
    }).filter(Boolean).slice(0, 5);
    if (goals.length) parts.push("Цели: " + goals.join("; ") + ".");
    if (app.mode === "live" && typeof bosTotalXP === "function") {
      var xp = bosTotalXP(habits, {
        moods: app.dayMoods,
        notes: app.dayNotes
      });
      var li = typeof bosLevelInfo === "function" ? bosLevelInfo(xp) : null;
      if (li) parts.push("Уровень " + li.level + " (" + xp + " XP).");
    }
    if (!parts.length) return "";
    return "Контекст пользователя прямо сейчас (опирайся на него, но не зачитывай как список):\n" + parts.join(" ");
  } catch (e) {
    return "";
  }
}
var AI_DEMO = ["Слышу тебя. Давай отделим то, что в твоей власти, от того, что нет — и тронем только первое. Что здесь зависит от тебя прямо сейчас?", "Не обязательно решать всё разом. Назови одно маленькое действие на пять минут — и сделай только его. Остальное подождёт.", "Сначала состояние, потом задачи. Сделай один медленный вдох и просто заметь, как оно ощущается в теле — без оценок.", "Хорошая мысль. Будет ли это важно через год? Если да — сделаем первый шаг сегодня. Если нет — отпустим без вины."];
// fetch with an abort timeout so a slow/stuck model never hangs the chat or brief.
async function aiFetch(url, opts, ms) {
  var ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
  var tid = ctl ? setTimeout(() => {
    try {
      ctl.abort();
    } catch (e) {}
  }, ms || 22000) : null;
  try {
    return await fetch(url, ctl ? Object.assign({}, opts, {
      signal: ctl.signal
    }) : opts);
  } finally {
    if (tid) clearTimeout(tid);
  }
}
// Low-level transport: send a raw `messages` array to the model and return its text
// (or null). Proxy (server key) → direct (dev key) → null. Reused by chat AND brief.
async function aiRaw(messages) {
  var W = typeof window !== "undefined" ? window : {};
  var sbUrl = (W.SUPABASE_URL || "").replace(/\/$/, "");
  var sbKey = W.SUPABASE_ANON_KEY || "";
  if (sbUrl && sbKey) {
    try {
      var res = await aiFetch(sbUrl + "/functions/v1/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + sbKey,
          "apikey": sbKey
        },
        body: JSON.stringify({
          messages
        })
      });
      if (res.ok) {
        var data = await res.json();
        var t = data && data.reply;
        if (t && t.trim()) return t.trim();
      }
    } catch (e) {/* fall through */}
  }
  var key = W.OPENROUTER_KEY || "";
  if (key) {
    var model = W.OPENROUTER_MODEL || "openai/gpt-oss-20b:free";
    try {
      var _res = await aiFetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + key,
          "HTTP-Referer": "https://mind3scape.github.io/balanceos",
          "X-Title": "BalanceOS"
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: 500,
          temperature: 0.7
        })
      });
      if (_res.ok) {
        var _data = await _res.json();
        var _t = _data && _data.choices && _data.choices[0] && _data.choices[0].message && _data.choices[0].message.content;
        if (_t && _t.trim()) return _t.trim();
      }
    } catch (e) {/* fall through */}
  }
  return null;
}
async function aiReply(history, ctx) {
  var sys = AI_SYSTEM + (ctx ? "\n\n" + ctx : "");
  var messages = [{
    role: "system",
    content: sys
  }].concat((history || []).filter(m => m && m.t).map(m => ({
    role: m.who === "me" ? "user" : "assistant",
    content: m.t
  })));
  var t = await aiRaw(messages);
  if (t && t.trim()) return t.trim();
  // No working backend → graceful canned reply so the chat still feels alive.
  await new Promise(r => setTimeout(r, 900));
  return AI_DEMO[Math.floor(Math.random() * AI_DEMO.length)];
}

/* ── L1 · LOGIN BRIEF ────────────────────────────────────────────────────────
   Once at login the mentor reads the user's real context and returns a compact
   JSON "brief": a personal summary for the home banner, 3–4 tappable suggestion
   pills, a one-line greeting and a small next-step hint. We NEVER hard-depend on
   the model — a heuristic brief is always computed first, and the AI just refines
   it. So live users always get something personal, even offline. */
var BRIEF_SYSTEM = ["Ты — тот же тихий наставник (стоицизм + дзен, в материальной реальности, без имени).", "Тебе дают живой контекст человека. Сгенерируй для главного экрана приложения короткий персональный «бриф».", "Верни СТРОГО валидный JSON (и больше ничего) такой формы:", '{ "greeting": "тёплое личное приветствие, 3–6 слов", "summary": "ОДНО предложение «именно тебе сегодня» — опирается на состояние/привычки/серии, по-русски на «ты», без воды", "pills": [ { "i": "эмодзи", "t": "короткое действие-подсказка, ≤4 слов" } ], "hint": "один маленький конкретный следующий шаг" }', "pills: ровно 3–4 штуки, разные, тапабельные (это станет кнопками-подсказками). Без кавычек-ёлочек внутри строк. Только JSON."].join("\n");
function bosUnescape(s) {
  try {
    return JSON.parse('"' + ("" + s).replace(/"/g, '\\"') + '"');
  } catch (e) {
    return s;
  }
}
function bosBriefFromObj(obj) {
  var out = {};
  if (typeof obj.summary === "string" && obj.summary.trim()) out.summary = obj.summary.trim();
  if (typeof obj.greeting === "string" && obj.greeting.trim()) out.greeting = obj.greeting.trim();
  if (typeof obj.hint === "string" && obj.hint.trim()) out.hint = obj.hint.trim();
  if (Array.isArray(obj.pills)) {
    out.pills = obj.pills.map(p => typeof p === "string" ? {
      i: "✨",
      t: p
    } : {
      i: p && p.i || "✨",
      t: p && (p.t || p.text || p.label) || ""
    }).filter(p => p.t && ("" + p.t).trim()).slice(0, 4).map(p => ({
      i: ("" + p.i).slice(0, 3) || "✨",
      t: ("" + p.t).trim().slice(0, 40)
    }));
  }
  if (!out.summary && (!out.pills || !out.pills.length)) return null;
  return out;
}
// Parse the model's reply into a clean brief object (or null). Two passes: a clean
// JSON.parse, then a SALVAGE pass (regex) for truncated/partial output — free models
// often stop mid-JSON, but their summary is usually complete, so we still use it.
function bosParseBrief(raw) {
  if (!raw) return null;
  try {
    var s = raw.indexOf("{"),
      e = raw.lastIndexOf("}");
    if (s >= 0 && e > s) {
      var out = bosBriefFromObj(JSON.parse(raw.slice(s, e + 1)));
      if (out) return out;
    }
  } catch (e) {/* salvage below */}
  try {
    var _out = {};
    var sm = raw.match(/"summary"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (sm) _out.summary = bosUnescape(sm[1]).trim();
    var hm = raw.match(/"hint"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (hm) _out.hint = bosUnescape(hm[1]).trim();
    var gm = raw.match(/"greeting"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (gm) _out.greeting = bosUnescape(gm[1]).trim();
    var pills = [];
    var re = /\{\s*"i"\s*:\s*"([^"]*)"\s*,\s*"t"\s*:\s*"((?:[^"\\]|\\.)*)"\s*\}/g;
    var m;
    while ((m = re.exec(raw)) && pills.length < 4) pills.push({
      i: (m[1] || "✨").slice(0, 3),
      t: bosUnescape(m[2]).trim().slice(0, 40)
    });
    if (pills.length) _out.pills = pills.filter(p => p.t);
    if (_out.summary || _out.pills && _out.pills.length) return _out;
  } catch (e) {}
  return null;
}

// Always-available baseline brief from local context (mood line + contextual pills).
function bosHeuristicBrief(app) {
  var summary = "";
  try {
    var habits = app && app.habits || [];
    var done = habits.filter(h => h.done).length;
    var moodT = app && app.mood && app.mood.t || "";
    var M = {
      "Энергия": "Энергии много — берись за самое важное прямо сейчас.",
      "Радость": "Ты в ресурсе — отличный день, чтобы закрыть серию.",
      "Спокойствие": "Спокойствие — твоё время для одного глубокого дела.",
      "Тревога": "Начни с двух минут дыхания — и день станет легче.",
      "Упадок": "Сделай одно маленькое дело — этого сегодня достаточно.",
      "Усталость": "Сбавь темп: закрой одну привычку — и довольно."
    };
    if (habits.length && done >= habits.length) summary = "День закрыт — ты в потоке. Так держи ритм.";else if (M[moodT]) summary = M[moodT];else if (!habits.length) summary = "Начнём с малого: выбери одну привычку, с которой стартуешь.";else summary = "Одно маленькое действие сейчас сдвинет весь день.";
  } catch (e) {
    summary = "Один маленький шаг — и день сдвинется.";
  }
  return {
    summary,
    pills: typeof buildQuickPrompts === "function" ? buildQuickPrompts(app) : [],
    greeting: "",
    hint: "",
    source: "heuristic"
  };
}

// The login brief: heuristic baseline, refined by the real AI when reachable.
async function bosAiBrief(app) {
  var base = bosHeuristicBrief(app);
  try {
    var ctx = typeof buildAiContext === "function" ? buildAiContext(app) : "";
    var user = (ctx || "Контекста почти нет — человек только начинает в приложении.") + "\n\nСгенерируй бриф. Верни ТОЛЬКО JSON.";
    var raw = await aiRaw([{
      role: "system",
      content: BRIEF_SYSTEM
    }, {
      role: "user",
      content: user
    }]);
    var parsed = bosParseBrief(raw);
    if (parsed) {
      var out = Object.assign({}, base, parsed, {
        source: "ai",
        at: Date.now()
      });
      // Free model often truncates → too few AI pills. Keep them, top up from heuristic.
      if (!out.pills || out.pills.length < 3) {
        var have = {};
        (out.pills || []).forEach(p => {
          have[p.t] = 1;
        });
        out.pills = (out.pills || []).concat((base.pills || []).filter(p => !have[p.t])).slice(0, 4);
      }
      return out;
    }
  } catch (e) {/* keep heuristic */}
  return Object.assign({}, base, {
    at: Date.now()
  });
}
function AIChatScreen() {
  var {
    navigate,
    params
  } = useNav();
  var app = typeof useApp === "function" ? useApp() : null;
  // The mentor's avatar = the orb of your CURRENT state (mood-tinted). Your own
  // avatar sits up top (it's your conversation). Your messages carry no avatar.
  var stateTint = typeof tintFromMood === "function" ? tintFromMood(app && app.mood && app.mood.c) : null;
  // A real, personal opener: time-of-day greeting + the user's name. Demo keeps its
  // richer scripted intro (summary + sample chat); live/fresh get a clean real start.
  var _demoChat = app?.mode === "demo";
  var _name = (app?.userName || "").trim();
  var _hr = function () {
    try {
      return new Date().getHours();
    } catch (e) {
      return 12;
    }
  }();
  var _greet = _hr < 5 ? "Доброй ночи" : _hr < 12 ? "Доброе утро" : _hr < 18 ? "Добрый день" : _hr < 23 ? "Добрый вечер" : "Доброй ночи";
  var _hello = _greet + (_name ? ", " + _name : "") + ". Я рядом. Расскажи, как ты сейчас или что на уме — и начнём с одного маленького шага.";
  // Resolve current theme from the iOS frame wrapper so this screen looks
  // right under both .theme-light and .theme-dark.
  var wrapRef = React.useRef(null);
  var [isDark, setIsDark] = useM(false);
  React.useEffect(() => {
    var el = wrapRef.current;
    if (!el) return;
    var n = el.parentElement;
    while (n && !n.classList.contains("theme-light") && !n.classList.contains("theme-dark")) n = n.parentElement;
    setIsDark(!!(n && n.classList.contains("theme-dark")));
  }, []);

  // Theme tokens for chat bubbles & chrome
  var TH = isDark ? {
    bg: "#0a0a0a",
    text: "#fff",
    muted: "rgba(255,255,255,0.5)",
    dim: "rgba(255,255,255,0.35)",
    border: "transparent",
    aiBubble: "rgba(255,255,255,0.06)",
    aiBubbleBorder: "0",
    aiCard: "rgba(255,255,255,0.06)",
    aiCardBorder: "0",
    cardDivider: "1px solid rgba(255,255,255,0.08)",
    chip: "rgba(255,255,255,0.06)",
    chipBorder: "0",
    composer: "rgba(255,255,255,0.08)",
    composerBorder: "0",
    iconBtn: "rgba(255,255,255,0.06)",
    iconBtnBorder: "0",
    skipBg: "rgba(255,255,255,0.06)",
    skipBorder: "0",
    typingDot: "rgba(255,255,255,0.7)",
    accentBg: "rgba(255,255,255,0.06)",
    insightBg: "rgba(255,255,255,0.06)",
    statValue: "#fff",
    primary: "#fff",
    primaryFg: "#0a0a0a",
    meBubble: "#0a0a0a",
    meText: "#fff"
  } : {
    bg: "#fafafa",
    text: "var(--text)",
    muted: "var(--text-4)",
    dim: "var(--text-5)",
    border: "var(--line)",
    aiBubble: "#fff",
    aiBubbleBorder: "1px solid var(--line)",
    aiCard: "#fff",
    aiCardBorder: "1px solid var(--line)",
    cardDivider: "1px solid var(--line)",
    chip: "#fff",
    chipBorder: "1px solid var(--line)",
    composer: "#fff",
    composerBorder: "1px solid var(--line)",
    iconBtn: "#fff",
    iconBtnBorder: "1px solid var(--line)",
    skipBg: "var(--surface-3)",
    skipBorder: 0,
    typingDot: "rgba(0,0,0,0.45)",
    accentBg: "var(--surface-3)",
    insightBg: "var(--surface-3)",
    statValue: "var(--text)",
    primary: "#0a0a0a",
    primaryFg: "#fff",
    meBubble: "#0a0a0a",
    meText: "#fff"
  };

  // Each message: { who, kind, t, ...cardData }
  var [msgs, setMsgs] = useM(_demoChat ? [{
    who: "ai",
    kind: "greeting",
    t: "Доброе утро, Павел ☀️"
  }, {
    who: "ai",
    kind: "summary",
    title: "Сегодня, пока что",
    body: "Ты прошёл 60%. Состояние: ⚡ Энергия. Осталась одна привычка до полудня — от неё зависит утренняя серия.",
    stats: [{
      l: "Готово",
      v: "3/5"
    }, {
      l: "Серия",
      v: "12д"
    }, {
      l: "XP",
      v: "+92"
    }]
  }, {
    who: "me",
    t: "Сегодня мало энергии. Может, просто пропустить пробежку?"
  }, {
    who: "ai",
    kind: "text",
    t: "Пропустить — нормально, но не обязательно выбирать между «всё» и «ничего». Хочешь версию поменьше?"
  }, {
    who: "ai",
    kind: "suggestion",
    title: "Попробуй вместо этого",
    body: "Замени «утреннюю пробежку» на 7-минутную прогулку. Серия останется, а вечером ты себе скажешь спасибо.",
    action: {
      label: "Заменить на сегодня",
      icon: "swap"
    }
  }, {
    who: "ai",
    kind: "insight",
    title: "Паттерны энергии · 7 дней",
    body: "Дни с низкой энергией чаще всего в понедельники. Три из последних четырёх. Перестроить неделю?",
    chart: [{
      l: "Пн",
      v: 32,
      h: true
    }, {
      l: "Вт",
      v: 78
    }, {
      l: "Ср",
      v: 88
    }, {
      l: "Чт",
      v: 64
    }, {
      l: "Пт",
      v: 92
    }, {
      l: "Сб",
      v: 70
    }, {
      l: "Вс",
      v: 58
    }]
  }] : [{
    who: "ai",
    kind: "greeting",
    t: _hello
  }]);
  var [draft, setDraft] = useM("");
  var [typing, setTyping] = useM(false);
  var scrollRef = React.useRef(null);
  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs, typing]);
  var send = text => {
    var t = (text ?? draft).trim();
    if (!t) return;
    var history = [...msgs, {
      who: "me",
      t
    }];
    setMsgs(history);
    setDraft("");
    setTyping(true);
    aiReply(history, buildAiContext(app)).then(reply => {
      setTyping(false);
      setMsgs(m => [...m, {
        who: "ai",
        kind: "text",
        t: reply
      }]);
    }).catch(() => {
      setTyping(false);
      setMsgs(m => [...m, {
        who: "ai",
        kind: "text",
        t: AI_DEMO[Math.floor(Math.random() * AI_DEMO.length)]
      }]);
    });
  };

  // A prompt passed in from the AI tab / quick chips → auto-send it on open.
  React.useEffect(() => {
    if (!params?.prompt) return;
    var t = window.setTimeout(() => send(params.prompt), 350);
    return () => window.clearTimeout(t);
  }, []); // eslint-disable-line

  var renderAI = (m, i) => {
    if (m.kind === "greeting") {
      return /*#__PURE__*/React.createElement("div", {
        key: i,
        style: {
          display: "flex",
          gap: 10,
          alignItems: "flex-end",
          animation: "msgIn 0.4s ease both"
        }
      }, /*#__PURE__*/React.createElement(StateChatOrb, {
        size: 28,
        tint: stateTint
      }), /*#__PURE__*/React.createElement("div", {
        style: {
          background: TH.aiBubble,
          border: TH.aiBubbleBorder,
          borderRadius: 18,
          borderBottomLeftRadius: 4,
          padding: "10px 14px",
          fontSize: 14,
          color: TH.text
        }
      }, m.t));
    }
    if (m.kind === "text") {
      return /*#__PURE__*/React.createElement("div", {
        key: i,
        style: {
          display: "flex",
          gap: 10,
          alignItems: "flex-end",
          animation: "msgIn 0.4s ease both"
        }
      }, /*#__PURE__*/React.createElement(StateChatOrb, {
        size: 28,
        tint: stateTint
      }), /*#__PURE__*/React.createElement("div", {
        style: {
          maxWidth: "78%",
          background: TH.aiBubble,
          border: TH.aiBubbleBorder,
          borderRadius: 18,
          borderBottomLeftRadius: 4,
          padding: "10px 14px",
          fontSize: 14,
          color: TH.text,
          lineHeight: 1.45
        }
      }, m.t));
    }
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        animation: "msgIn 0.4s ease both"
      }
    }, /*#__PURE__*/React.createElement(StateChatOrb, {
      size: 28,
      tint: stateTint
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        background: TH.aiCard,
        border: TH.aiCardBorder,
        borderRadius: 18,
        borderTopLeftRadius: 4,
        padding: 14,
        color: TH.text,
        maxWidth: "85%",
        backdropFilter: "blur(20px)"
      }
    }, m.kind === "summary" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        letterSpacing: 1.4,
        textTransform: "uppercase",
        color: TH.muted,
        fontWeight: 600
      }
    }, m.title), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        lineHeight: 1.5,
        marginTop: 6
      }
    }, m.body), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(3,1fr)",
        gap: 6,
        marginTop: 12,
        paddingTop: 10,
        borderTop: TH.cardDivider
      }
    }, m.stats.map((s, j) => /*#__PURE__*/React.createElement("div", {
      key: j,
      style: {
        textAlign: "center"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 18,
        fontWeight: 600,
        color: TH.statValue,
        letterSpacing: "-0.3px"
      }
    }, s.v), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: TH.muted,
        letterSpacing: 0.5
      }
    }, s.l))))), m.kind === "suggestion" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 24,
        height: 24,
        borderRadius: 8,
        background: TH.accentBg,
        display: "grid",
        placeItems: "center",
        fontSize: 14
      }
    }, "\uD83D\uDCA1"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        letterSpacing: 1.4,
        textTransform: "uppercase",
        color: TH.muted,
        fontWeight: 600
      }
    }, m.title)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        lineHeight: 1.5,
        marginTop: 8
      }
    }, m.body), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8,
        marginTop: 12
      }
    }, /*#__PURE__*/React.createElement("button", {
      className: "tap",
      onClick: () => navigate("habits"),
      style: {
        flex: 1,
        background: TH.primary,
        color: TH.primaryFg,
        border: 0,
        borderRadius: 12,
        padding: "10px 14px",
        fontSize: 13,
        fontWeight: 600
      }
    }, m.action.label), /*#__PURE__*/React.createElement("button", {
      className: "tap",
      style: {
        background: TH.skipBg,
        color: TH.text,
        border: TH.skipBorder,
        borderRadius: 12,
        padding: "10px 14px",
        fontSize: 13
      }
    }, "\u041F\u0440\u043E\u043F\u0443\u0441\u0442\u0438\u0442\u044C"))), m.kind === "insight" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 24,
        height: 24,
        borderRadius: 8,
        background: TH.insightBg,
        display: "grid",
        placeItems: "center",
        fontSize: 14
      }
    }, "\uD83D\uDCCA"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        letterSpacing: 1.4,
        textTransform: "uppercase",
        color: TH.muted,
        fontWeight: 600
      }
    }, m.title)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        lineHeight: 1.5,
        marginTop: 8
      }
    }, m.body), /*#__PURE__*/React.createElement(MiniBars, {
      data: m.chart,
      color: TH.text,
      textMuted: TH.muted,
      barIdle: isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.10)"
    }), /*#__PURE__*/React.createElement("button", {
      className: "tap",
      style: {
        width: "100%",
        marginTop: 10,
        background: TH.skipBg,
        color: TH.text,
        border: TH.skipBorder,
        borderRadius: 12,
        padding: "10px 14px",
        fontSize: 13,
        fontWeight: 500
      }
    }, "\u041F\u0435\u0440\u0435\u043D\u0435\u0441\u0442\u0438 \u043F\u043E\u043D\u0435\u0434\u0435\u043B\u044C\u043D\u0438\u043A\u0438 \u2192"))));
  };
  var renderMe = (m, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      alignSelf: "flex-end",
      maxWidth: "78%",
      animation: "msgIn 0.4s ease both"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: TH.meBubble,
      color: TH.meText,
      borderRadius: 18,
      borderBottomRightRadius: 4,
      padding: "10px 14px",
      fontSize: 14,
      lineHeight: 1.45,
      fontWeight: 500
    }
  }, m.t));
  return /*#__PURE__*/React.createElement("div", {
    ref: wrapRef,
    className: "page-in",
    style: {
      height: "calc(100% + 90px)",
      margin: "-60px 0 -30px",
      color: TH.text,
      display: "flex",
      flexDirection: "column",
      background: TH.bg
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "62px 16px 12px",
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "tap",
    onClick: () => navigate("ai"),
    style: {
      width: 36,
      height: 36,
      background: TH.iconBtn,
      border: TH.iconBtnBorder,
      borderRadius: "50%",
      color: TH.text,
      display: "grid",
      placeItems: "center"
    }
  }, /*#__PURE__*/React.createElement(I.ChevronLeft, {
    size: 18
  })), /*#__PURE__*/React.createElement(BosAvatar, {
    avatar: app && app.avatar,
    size: 36,
    style: {
      boxShadow: "0 2px 8px rgba(0,0,0,0.18)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 600,
      letterSpacing: "-0.2px"
    }
  }, _name || "Ты"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: TH.muted,
      display: "flex",
      alignItems: "center",
      gap: 5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: "#85e3a8"
    }
  }), " \u043D\u0430\u0441\u0442\u0430\u0432\u043D\u0438\u043A \u0441\u043B\u0443\u0448\u0430\u0435\u0442")), /*#__PURE__*/React.createElement("button", {
    className: "tap",
    style: {
      width: 36,
      height: 36,
      background: TH.iconBtn,
      border: TH.iconBtnBorder,
      borderRadius: "50%",
      color: TH.text,
      display: "grid",
      placeItems: "center"
    }
  }, /*#__PURE__*/React.createElement(I.More, {
    size: 18
  }))), /*#__PURE__*/React.createElement("div", {
    ref: scrollRef,
    className: "screen-scroll",
    style: {
      flex: 1,
      padding: "16px 14px",
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      alignSelf: "center",
      fontSize: 10,
      letterSpacing: 1.5,
      color: TH.dim,
      textTransform: "uppercase"
    }
  }, "\u0421\u0435\u0433\u043E\u0434\u043D\u044F \xB7 09:14"), msgs.map((m, i) => m.who === "ai" ? renderAI(m, i) : renderMe(m, i)), typing && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      alignItems: "flex-end"
    }
  }, /*#__PURE__*/React.createElement(StateChatOrb, {
    size: 28,
    tint: stateTint
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      background: TH.aiBubble,
      border: TH.aiBubbleBorder,
      borderRadius: 18,
      borderBottomLeftRadius: 4,
      padding: "12px 14px",
      display: "flex",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: TH.typingDot,
      animation: "typingDot 1.2s 0s ease-in-out infinite"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: TH.typingDot,
      animation: "typingDot 1.2s 0.2s ease-in-out infinite"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: TH.typingDot,
      animation: "typingDot 1.2s 0.4s ease-in-out infinite"
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "0 14px 8px",
      display: "flex",
      gap: 6,
      overflowX: "auto"
    }
  }, (app && app.mode === "live" && app.aiBrief && Array.isArray(app.aiBrief.pills) && app.aiBrief.pills.length ? app.aiBrief.pills.slice(0, 4) : buildQuickPrompts(app)).map((s, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => send(s.t),
    className: "tap",
    "data-no-haptic": true,
    style: {
      flexShrink: 0,
      background: TH.chip,
      border: TH.chipBorder,
      borderRadius: 999,
      padding: "8px 14px",
      fontSize: 12,
      color: TH.text,
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", null, s.i), " ", s.t))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 14px 16px",
      display: "flex",
      gap: 8,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "tap",
    style: {
      width: 40,
      height: 40,
      borderRadius: "50%",
      background: TH.iconBtn,
      border: TH.iconBtnBorder,
      color: TH.text,
      display: "grid",
      placeItems: "center"
    }
  }, /*#__PURE__*/React.createElement(I.Plus, {
    size: 18
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      background: TH.composer,
      border: TH.composerBorder,
      borderRadius: 999,
      padding: "10px 16px",
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: draft,
    onChange: e => setDraft(e.target.value),
    onKeyDown: e => e.key === "Enter" && send(),
    placeholder: "\u041D\u0430\u043F\u0438\u0448\u0438 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435\u2026",
    style: {
      flex: 1,
      border: 0,
      outline: 0,
      background: "transparent",
      color: TH.text,
      fontSize: 16
    }
  }), /*#__PURE__*/React.createElement("button", {
    className: "tap",
    style: {
      background: "transparent",
      border: 0,
      color: TH.muted,
      padding: 0,
      display: "grid",
      placeItems: "center"
    }
  }, /*#__PURE__*/React.createElement(I.Mic, {
    size: 16
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: () => send(),
    className: "tap",
    style: {
      width: 44,
      height: 44,
      borderRadius: "50%",
      background: TH.primary,
      border: 0,
      display: "grid",
      placeItems: "center"
    }
  }, /*#__PURE__*/React.createElement(I.Send, {
    size: 16,
    color: TH.primaryFg
  }))), /*#__PURE__*/React.createElement("style", null, `
        @keyframes msgIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes typingDot {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-3px); }
        }
      `));
}
Object.assign(window, {
  HabitDetailScreen,
  GoalDetailScreen,
  MoodScreen,
  JournalScreen,
  LevelUpScreen,
  AIChatScreen
});

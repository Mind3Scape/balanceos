/* EXTRA — LIVE-only forks of the detail / mood / journal / AI-chat screens (real
   Telegram user, app.mode === "live" is ALWAYS true here). Giving the live user its
   OWN screen files keeps the two demo modes ('demo' / 'fresh') frozen — future live
   edits can never break the showcase. Precedent: screens/live/home_live.jsx (HomeLive),
   screens/live/community_live.jsx (CommunityLive + TeamDetailLive).

   What the demo/fresh branches contributed (all stripped here):
   • HabitDetailLive — drops the fabricated "friendly competition" (isShared roster +
     mkStreak + leaderboard + per-person aggregate rings + the demo calendar scatter).
     Live has no real per-friend logs client-side, so it ALWAYS shows the honest SOLO
     view: real streak/best/total from the check-in log (h.log) and the real per-habit
     month calendar keyed by today's year.
   • GoalDetailLive — identical to the original minus the demo streak fallback: the
     linked-habit streak is ALWAYS the real bosStreak(h.log).
   • MoodLive — the save ALWAYS keys by the REAL date (bosTodayKey()), never the frozen
     demo day (TODAY = 28).
   • JournalLive — drops the frozen showcase entries (demoPast) + the demo header date +
     the demo "+15 XP" save; ALWAYS the real header date, the real saved-notes list
     (app.dayNotes) and the honest live save (+10 XP only when there's text).
   • AIChatLive — drops the scripted demo seed (greeting/summary/suggestion/insight
     sample turns) and the frozen demo time divider. Keeps the REAL proxy path:
     aiReplyLive → bosParseAction action-cards → AI_LIVE_FALLBACK, with the live chat
     persisted on-device.

   Reuses the shared core/ toolkit (AI engine AI_SYSTEM/AI_LIVE_FALLBACK/aiRaw,
   bosParseAction, StateChatOrb, MiniBars, buildQuickPrompts, MOOD_TAGS,
   journalDateLabel) + the live forks in shared_live.jsx (aiReplyLive,
   buildAiContextLive, PeopleMonthCalendarLive) + framework (bos* helpers,
   StateOrb/StaticOrb, CountUp, MOOD_OPTIONS, PageHeader, the icon object I, hooks).
   The ONLY new top-level
   declarations in this file are exactly: StatTrioLive, HabitDetailLive, GoalDetailLive,
   MoodLive, JournalLive, AIChatLive. */

/* One native stat row — three figures sharing a single card under hairline dividers, with
   thin line icons (not emoji) and SF numerals. Replaces the three "boxy" emoji cards that
   read as vibe-coded (David: «три блока серия/лучшая/всего выглядят как вайп-кодинг»). Used by
   BOTH habit + goal detail so the whole app keeps one rhythm. `items`: {icon, l, v, suf?, text?}. */
function StatTrioLive({
  items,
  card,
  isDark
}) {
  var Count = typeof CountUp !== "undefined" ? CountUp : ({
    value
  }) => value;
  var div = isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.11)";
  var sufStyle = {
    fontSize: 11,
    color: "var(--text-4)",
    fontWeight: 600,
    marginLeft: 1
  };
  // ПОД СТЕКЛО (David: «верхний блок в стекло, чтобы гармонировал с нижним календарём, иконки
  // выразительнее — сейчас нет ощущения разграничения»): тот же sheen+glass-тень, что у иконки-тайла,
  // разделители жирнее. Icon в линию со значением; все значения одного кегля (16px) — ровный низ.
  var glassBg = (typeof BOS_TILE_SHEEN !== "undefined" ? BOS_TILE_SHEEN + ", " : "") + (isDark ? "rgba(255,255,255,0.06)" : "var(--surface-3)");
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: glassBg,
      boxShadow: typeof bosTileGlass === "function" ? bosTileGlass(isDark) : card && card.boxShadow || "none",
      borderRadius: 18,
      padding: "13px 0",
      display: "flex",
      alignItems: "stretch"
    }
  }, items.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      flex: 1,
      minWidth: 0,
      padding: "0 6px",
      borderLeft: i > 0 ? "0.5px solid " + div : "none",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 5
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 5,
      color: "var(--text)",
      fontWeight: 700,
      fontSize: 17,
      letterSpacing: "-0.3px",
      lineHeight: 1
    }
  }, s.icon, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "baseline",
      minWidth: 0
    }
  }, s.text ? s.text : /*#__PURE__*/React.createElement(Count, {
    value: s.v
  }), !s.text && s.suf ? /*#__PURE__*/React.createElement("span", {
    style: sufStyle
  }, s.suf) : null)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9.5,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 0.8,
      fontWeight: 600,
      lineHeight: 1
    }
  }, s.l))));
}

/* HABIT DETAIL — LIVE. Real per-habit statistics from the check-in log (h.log =
   {dateKey:true}). Opened by tapping a habit on Home/Habits. Numbers derive from the
   real log so they never flicker; "Изменить" opens the edit form; Back returns to the
   exact tab we came from (params.from). */
function HabitDetailLive() {
  var {
    navigate,
    params
  } = useNav();
  var app = typeof useApp === "function" ? useApp() : null;
  var {
    open: openSheet
  } = typeof useSheet === "function" ? useSheet() : {
    open: () => {}
  };
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

  // Real stats from the check-in log (h.log = {dateKey:true}).
  var _log = h.log || {};
  var _logDays = Object.keys(_log).filter(k => _log[k] && /^\d{4}-\d{2}-\d{2}$/.test(k)).sort();
  var _bestRun = days => {
    if (!days.length) return 0;
    var b = 1,
      c = 1;
    for (var i = 1; i < days.length; i++) {
      var diff = Math.round((new Date(days[i] + "T00:00:00") - new Date(days[i - 1] + "T00:00:00")) / 86400000);
      if (diff === 1) {
        c++;
        if (c > b) b = c;
      } else if (diff > 1) c = 1;
    }
    return b;
  };
  var streak = typeof bosStreak === "function" ? bosStreak(_log) : h.streak || 0;
  var best = Math.max(streak, _bestRun(_logDays));
  var total = _logDays.length;

  // Neutral by default (cohesive with the gray tiles outside); the habit's own
  // colour only if the user picked one — it tints the tile and fills the grid.
  var tileBg = h.color ? h.color + "20" : isDark ? "rgba(255,255,255,0.06)" : "var(--surface-3)";

  // SHARED habit (buddy): pull BOTH members' real day-maps so the month calendar AND the
  // «Вместе» card show WHO did WHICH day, each in their own colour-coded track (David:
  // «на календаре у кого какой день»). Solo habit → just you. Light poll so a friend's
  // fresh mark turns up. The SAME PeopleMonthCalendar the team uses → one consistent look.
  // Cache-backed (stale-while-revalidate): seeds from the last-known members instantly, so the
  // «Вместе» card + month calendar don't flash/jump on every enter/exit (David: «мигания»).
  var buddies = useBuddyMembersLive(h.shareCode);
  var _shared = !!(buddies && buddies.length > 1);
  var _calYear = new Date().getFullYear();
  var _calKey = (d, mi) => _calYear + "-" + String(mi + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
  var calPeople = _shared ? buddies.map(m => ({
    name: m.me ? "Ты" : m.name,
    initials: m.me ? "Я" : (m.name || "Д").charAt(0).toUpperCase(),
    color: h.color || "#0a0a0a",
    you: !!m.me,
    avatar: m.avatar
  })) : [{
    name: "Ты",
    initials: "Я",
    color: h.color || "#0a0a0a",
    you: true
  }];
  // For a SHARED habit, YOUR row reads the PERSONAL log (h.log) — the complete source of truth for
  // your own check-ins — while buddies read the cloud shared log. Without this YOUR calendar showed
  // only today (David: «серия 4, а на календаре только сегодня»): check-ins aren't mirrored into
  // shared_habit_logs, so buddies[me].days was empty for your past days even though the streak (from
  // h.log) was right. (Mirroring check-ins so BUDDIES see your days is a separate, deeper fix.)
  var habitFrac = _shared ? (pi, d, mi) => {
    var m = buddies[pi];
    if (!m) return 0;
    var k = _calKey(d, mi);
    return (m.me ? _log[k] || m.days[k] : m.days[k]) ? 1 : 0;
  } : (pi, d, mi) => _log[_calKey(d, mi)] ? 1 : 0;
  var card = isDark ? {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)"
  } : {
    background: "#fff",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
  };

  // Tap-to-mark from the calendar's TODAY cell — the ONE completion control now (David removed the
  // bottom button: «некуда тыкнуть, тапаешь день — бумс»). Quantitative habits (goalPerDay>1) fill
  // tap-by-tap; the FULL count flips done + grants XP (same rule as HabitCountCheck). Haptics:
  // light per step, success at completion.
  var _isQuant = (h.goalPerDay || 1) > 1;
  var _qGoal = Math.max(1, h.goalPerDay || 1);
  var _todayK = typeof bosTodayKey === "function" ? bosTodayKey() : new Date().toISOString().slice(0, 10);
  var _qCount = h.done ? _qGoal : h.counts && h.counts[_todayK] || 0;
  var _markToday = () => {
    if (!app) return;
    if (_isQuant) {
      var cur = h.done ? _qGoal : h.counts && h.counts[_todayK] || 0;
      var next = h.done ? 0 : Math.min(_qGoal, cur + 1);
      if (next === cur) return;
      var willDone = next >= _qGoal;
      var counts = Object.assign({}, h.counts || {});
      counts[_todayK] = next;
      if (app.updateHabit) app.updateHabit(h.id, {
        counts
      });
      if (willDone !== !!h.done && app.toggleHabit) app.toggleHabit(h.id);
      if (window.tgHaptic) {
        try {
          window.tgHaptic(willDone ? "success" : "light");
        } catch (_) {}
      }
    } else {
      if (app.toggleHabit) app.toggleHabit(h.id);
      if (window.tgHaptic) {
        try {
          window.tgHaptic(h.done ? "light" : "success");
        } catch (_) {}
      }
    }
  };
  var _todayTap = {
    pct: h.done ? 1 : _isQuant ? Math.max(0, Math.min(1, _qCount / _qGoal)) : 0,
    hint: h.done ? null : _isQuant ? _qCount > 0 ? String(_qCount) : "+" : "+",
    onTap: _markToday
  };

  // BACKFILL «вместе»: push YOUR existing personal-log days into the shared log so buddies see your
  // WHOLE streak, not just marks made from now on (toggleHabit already mirrors TODAY going forward;
  // older days predate that / never landed). Idempotent (upsert ignoreDuplicates), best-effort, once
  // per shared habit on open. Your buddy's app does the same for their days → you both see everything.
  React.useEffect(function () {
    if (!h.shareCode || !(window.bosCloud && window.bosCloud.setSharedLogBulk)) return;
    var days = Object.keys(_log).filter(function (k) {
      return _log[k] && /^\d{4}-\d{2}-\d{2}$/.test(k);
    });
    if (days.length) {
      try {
        window.bosCloud.setSharedLogBulk(h.shareCode, days);
      } catch (e) {}
    }
  }, [h.shareCode]);
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      padding: "0 16px 24px"
    }
  }, /*#__PURE__*/React.createElement(PageHeader, {
    dark: isDark,
    title: "",
    onBack: () => navigate(back),
    right: /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => openSheet(/*#__PURE__*/React.createElement(ShareHabitSheetLive, {
        habit: h,
        dark: isDark
      })),
      className: "tap",
      "data-haptic": "selection",
      "aria-label": "\u0412\u0435\u0441\u0442\u0438 \u0432\u043C\u0435\u0441\u0442\u0435",
      title: "\u0412\u0435\u0441\u0442\u0438 \u0432\u043C\u0435\u0441\u0442\u0435",
      style: {
        width: 40,
        height: 40,
        borderRadius: "50%",
        border: 0,
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
        color: isDark ? "#fff" : "var(--text)",
        background: BOS_TILE_SHEEN + ", " + (isDark ? "rgba(255,255,255,0.10)" : "var(--surface-3)"),
        boxShadow: bosTileGlass(isDark)
      }
    }, /*#__PURE__*/React.createElement(I.Share, {
      size: 16,
      strokeWidth: 2
    })), /*#__PURE__*/React.createElement(EditGlassButtonLive, {
      onClick: () => navigate("habit-settings", {
        mode: "edit",
        habit: h
      })
    }))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "6px 0 12px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 88,
      height: 88,
      borderRadius: 22,
      margin: "0 auto",
      display: "grid",
      placeItems: "center",
      background: BOS_TILE_SHEEN + ", " + tileBg,
      boxShadow: bosTileGlass(isDark)
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 44
    }
  }, bosIcon(h.emoji, 40, h.color))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 26,
      fontWeight: 700,
      color: "var(--text)",
      marginTop: 16,
      letterSpacing: "-0.5px"
    }
  }, h.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-4)",
      marginTop: 3
    }
  }, "\u0415\u0436\u0435\u0434\u043D\u0435\u0432\u043D\u043E", h.duration ? ` · ${h.duration} мин` : "", h.done ? " · выполнено сегодня" : "")), /*#__PURE__*/React.createElement(StatTrioLive, {
    isDark: isDark,
    card: card,
    items: [{
      l: "Серия",
      v: streak,
      suf: "д",
      icon: /*#__PURE__*/React.createElement(I.Flame, {
        size: 16,
        filled: true,
        color: h.color || (isDark ? "#fff" : "#0a0a0a")
      })
    }, {
      l: "Лучшая",
      v: best,
      suf: "д",
      icon: /*#__PURE__*/React.createElement(I.Trophy, {
        size: 16,
        strokeWidth: 2,
        color: h.color || (isDark ? "#fff" : "#0a0a0a")
      })
    }, {
      l: "Всего",
      v: total,
      suf: "",
      icon: /*#__PURE__*/React.createElement(I.ChartBar, {
        size: 16,
        strokeWidth: 2,
        color: h.color || (isDark ? "#fff" : "#0a0a0a")
      })
    }]
  }), /*#__PURE__*/React.createElement(PeopleMonthCalendarLive, {
    people: calPeople,
    dayFrac: habitFrac,
    label: "\u041A\u0430\u043B\u0435\u043D\u0434\u0430\u0440\u044C \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0438",
    todayTap: _todayTap
  }));
}

/* GOAL DETAIL — LIVE. Progress ring, the habits it's built from (cross-linked into
   their own stats), a pace hint, and a +1 to nudge progress. Linked-habit streaks are
   ALWAYS the real bosStreak(h.log). Back returns to the origin tab (params.from). */
function GoalDetailLive() {
  var {
    navigate,
    params
  } = useNav();
  var app = typeof useApp === "function" ? useApp() : null;
  var {
    open: openSheet
  } = typeof useSheet === "function" ? useSheet() : {
    open: () => {}
  };
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

  // Прогресс цели = из её привычек (если привязаны), иначе ручной current. Единый движок bosGoalProgress.
  var prog = typeof bosGoalProgress === "function" ? bosGoalProgress(g, app?.habits || []) : {
    pct: g.target ? Math.min(1, (g.current || 0) / g.target) : 0,
    current: g.current || 0,
    done: (g.current || 0) >= (g.target || 0),
    fromHabits: false
  };
  var cur = prog.current;
  var pct = prog.pct;
  var remaining = Math.max(0, (g.target || 0) - cur);
  var done = prog.done;
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
  var goalColor = g.color || "#0a0a0a"; // goal fill = its chosen colour, default black (b&w base)

  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      padding: "0 16px 24px"
    }
  }, /*#__PURE__*/React.createElement(PageHeader, {
    dark: isDark,
    title: "",
    onBack: () => navigate(back),
    right: /*#__PURE__*/React.createElement(EditGlassButtonLive, {
      onClick: () => navigate("goal-settings", {
        mode: "edit",
        goal: g
      })
    })
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
  }, /*#__PURE__*/React.createElement("circle", {
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
    stroke: goalColor,
    strokeWidth: "13",
    strokeLinecap: "round",
    strokeDasharray: CIRC,
    strokeDashoffset: CIRC * (1 - pct),
    style: {
      transition: "stroke-dashoffset 0.6s ease",
      ...(done ? {
        filter: "drop-shadow(0 0 6px " + goalColor + "80)"
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
  }, bosIcon(g.emoji, 32, g.color)), /*#__PURE__*/React.createElement("div", {
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
      color: "var(--text)",
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
    value: cur
  }), " \u0438\u0437 ", g.target, " ", g.unit, g.deadline ? " · до " + g.deadline : "")), /*#__PURE__*/React.createElement(StatTrioLive, {
    isDark: isDark,
    card: card,
    items: [{
      l: "Осталось",
      v: remaining,
      icon: /*#__PURE__*/React.createElement(I.Target, {
        size: 16,
        strokeWidth: 2,
        color: g.color || (isDark ? "#fff" : "#0a0a0a")
      })
    }, {
      l: "Сделано",
      v: cur,
      icon: /*#__PURE__*/React.createElement(I.Check, {
        size: 16,
        strokeWidth: 2.4,
        color: g.color || (isDark ? "#fff" : "#0a0a0a")
      })
    }, {
      l: "Срок",
      text: g.deadline,
      icon: /*#__PURE__*/React.createElement(I.Calendar, {
        size: 16,
        strokeWidth: 2,
        color: g.color || (isDark ? "#fff" : "#0a0a0a")
      })
    }]
  }), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, "\u0421\u043A\u043B\u0430\u0434\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u0438\u0437 \u043F\u0440\u0438\u0432\u044B\u0447\u0435\u043A"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...card,
      borderRadius: 22,
      marginTop: 8,
      overflow: "hidden"
    }
  }, linked.map((h, i) => /*#__PURE__*/React.createElement("div", {
    key: h.id,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 14px",
      borderTop: i ? "1px solid " + (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)") : 0
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (app?.toggleHabit) app.toggleHabit(h.id);
      if (window.tgHaptic) {
        try {
          window.tgHaptic("light");
        } catch (e) {}
      }
    },
    className: "tap",
    "aria-label": "\u041E\u0442\u043C\u0435\u0442\u0438\u0442\u044C \u0441\u0435\u0433\u043E\u0434\u043D\u044F",
    style: {
      width: 30,
      height: 30,
      borderRadius: "50%",
      flexShrink: 0,
      border: 0,
      display: "grid",
      placeItems: "center",
      cursor: "pointer",
      background: h.done ? h.color || goalColor : isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)",
      boxShadow: h.done ? "none" : "inset 0 0 0 1.5px " + (isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.14)")
    }
  }, h.done && /*#__PURE__*/React.createElement(I.Check, {
    size: 16,
    strokeWidth: 3,
    color: "#fff"
  })), /*#__PURE__*/React.createElement("button", {
    className: "tap",
    onClick: () => navigate("habit-detail", {
      habit: h,
      from: "goal-detail"
    }),
    style: {
      flex: 1,
      minWidth: 0,
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: 0,
      background: "transparent",
      border: 0,
      textAlign: "left",
      color: "var(--text)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 34,
      height: 34,
      borderRadius: 12,
      background: h.color ? h.color + "26" : isDark ? "rgba(255,255,255,0.06)" : "var(--surface-3)",
      display: "grid",
      placeItems: "center",
      fontSize: 17,
      flexShrink: 0
    }
  }, bosIcon(h.emoji, 18, h.color)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      color: "var(--text)",
      fontWeight: 600,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, h.name, h.goalOnly && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      color: "var(--text-4)",
      marginLeft: 7
    }
  }, "\xB7 \u0432 \u0446\u0435\u043B\u0438")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-4)",
      marginTop: 1
    }
  }, "\uD83D\uDD25 ", typeof bosStreak === "function" ? bosStreak(h.log) : h.streak || 0, "\u0434 \u0441\u0435\u0440\u0438\u044F")), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 16,
    color: "var(--text-4)"
  })))), linked.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "14px 14px 2px",
      fontSize: 13,
      color: "var(--text-4)",
      lineHeight: 1.5
    }
  }, "\u0426\u0435\u043B\u044C \u043D\u0430\u043F\u043E\u043B\u043D\u044F\u044E\u0442 \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0438, \u0432\u0435\u0434\u0443\u0449\u0438\u0435 \u043A \u043D\u0435\u0439. \u0414\u043E\u0431\u0430\u0432\u044C \u043F\u0435\u0440\u0432\u0443\u044E \u2014 \u0438 \u043A\u043E\u043B\u044C\u0446\u043E \u043D\u0430\u0447\u043D\u0451\u0442 \u0440\u0430\u0441\u0442\u0438 \u0441\u0430\u043C\u043E."), /*#__PURE__*/React.createElement("button", {
    className: "tap",
    onClick: () => navigate("habit-settings", {
      mode: "create",
      goalFor: {
        id: g.id,
        name: g.name
      }
    }),
    style: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 14px",
      borderTop: linked.length ? "1px solid " + (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)") : 0,
      background: "transparent",
      border: 0,
      color: "var(--text-2)",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 30,
      height: 30,
      borderRadius: "50%",
      flexShrink: 0,
      display: "grid",
      placeItems: "center",
      border: "1.5px dashed " + (isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.18)")
    }
  }, /*#__PURE__*/React.createElement(I.Plus, {
    size: 15,
    strokeWidth: 2.4,
    color: isDark ? "#fff" : "var(--text-2)"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14.5,
      fontWeight: 600
    }
  }, "\u041F\u0440\u0438\u0432\u044B\u0447\u043A\u0430 \u0434\u043B\u044F \u044D\u0442\u043E\u0439 \u0446\u0435\u043B\u0438"))), /*#__PURE__*/React.createElement("button", {
    className: "tap",
    onClick: () => {
      var go = () => {
        if (typeof bosPromoteGoalToCircle === "function") bosPromoteGoalToCircle(app, g, {
          navigate,
          from: back,
          onShare: t => openSheet(/*#__PURE__*/React.createElement(TeamShareSheetLive, {
            team: t
          }))
        });
      };
      if (typeof ConfirmActionSheet === "function") {
        openSheet(/*#__PURE__*/React.createElement(ConfirmActionSheet, {
          emoji: "\uD83D\uDC65",
          title: "\u0412\u0435\u0441\u0442\u0438 \u0446\u0435\u043B\u044C \u0432\u043C\u0435\u0441\u0442\u0435?",
          message: "«" + g.name + "» станет общим кругом: твои привычки перейдут в него, и ты позовёшь людей. Отмечаешь у себя — идёт в общий счёт.",
          confirmLabel: "\u041F\u043E\u0437\u0432\u0430\u0442\u044C \u043B\u044E\u0434\u0435\u0439",
          confirmIcon: I.Users,
          onConfirm: go
        }));
      } else {
        go();
      }
    },
    style: {
      ...card,
      borderRadius: 22,
      padding: 14,
      marginTop: 22,
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: 12,
      border: 0,
      textAlign: "left",
      cursor: "pointer",
      color: "var(--text)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 13,
      background: g.color ? g.color + "22" : isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(I.Users, {
    size: 19,
    color: g.color || (isDark ? "#fff" : "#0a0a0a")
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 600
    }
  }, "\u0418\u0434\u0442\u0438 \u043A \u0446\u0435\u043B\u0438 \u0432\u043C\u0435\u0441\u0442\u0435"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-4)",
      marginTop: 1,
      lineHeight: 1.4
    }
  }, "\u041F\u043E\u0437\u0432\u0430\u0442\u044C \u043B\u044E\u0434\u0435\u0439 \u2014 \u0446\u0435\u043B\u044C \u0441\u0442\u0430\u043D\u0435\u0442 \u043E\u0431\u0449\u0438\u043C \u043A\u0440\u0443\u0433\u043E\u043C.")), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 17,
    color: "var(--text-4)"
  })), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, "\u041F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0430"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...card,
      borderRadius: 22,
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
  }, done ? `Цель достигнута 🎉 «${g.name}» закрыта — можно поставить новую планку.` : pct >= 0.8 ? `Финишная прямая — осталось ${remaining} ${g.unit}.${g.deadline ? " Не сбавляй до " + g.deadline + "." : ""}` : pct >= 0.5 ? `Больше половины пути. ${linked[0] ? `Главный двигатель — «${linked[0].name}»: не разрывай серию.` : "Держи темп."}` : `${linked[0] ? `Каждая отметка «${linked[0].name}» приближает к цели. ` : "Начни с первой привычки. "}Осталось ${remaining} ${g.unit}${g.deadline ? " до " + g.deadline : ""}.`)), done && /*#__PURE__*/React.createElement("button", {
    className: "bos-btn",
    style: {
      marginTop: 22,
      background: isDark ? "rgba(255,255,255,0.1)" : "var(--surface-3)",
      color: "var(--text-2)"
    }
  }, "\u2713 \u0426\u0435\u043B\u044C \u0434\u043E\u0441\u0442\u0438\u0433\u043D\u0443\u0442\u0430"));
}

/* MOOD CHECK-IN — LIVE. Fullscreen state pulse; the check-in ALWAYS keys by the REAL
   date (bosTodayKey()) so marks accumulate per day & pay XP. State is colored orbs (no
   emoji), plus contextual sub-state #hashtags (MOOD_TAGS) and an optional note. */
function MoodLive() {
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
  var moodTags = cur ? MOOD_TAGS[cur.t] || [] : [];
  var toggleTag = tg => setTags(ts => ts.includes(tg) ? ts.filter(x => x !== tg) : [...ts, tg]);
  var onSave = () => {
    if (picked < 0 || !app) return navigate("home");
    // Key by the REAL date (so check-ins accumulate per day & pay XP).
    var dayKey = typeof bosTodayKey === "function" ? bosTodayKey() : new Date().toISOString().slice(0, 10);
    app.setMood && app.setMood(moods[picked]);
    app.setDayMoods && app.setDayMoods({
      ...(app.dayMoods || {}),
      [dayKey]: picked
    });
    if (app.setDayNotes) {
      var prev = (app.dayNotes || {})[dayKey] || {};
      app.setDayNotes({
        ...(app.dayNotes || {}),
        [dayKey]: {
          tags: tags && tags.length ? tags : prev.tags || [],
          note: note.trim() || prev.note || ""
        }
      });
    }
    navigate("home");
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "mood-fullscreen",
    style: {
      position: "absolute",
      inset: 0,
      color: "var(--text)",
      overflow: "hidden",
      background: "linear-gradient(180deg, #ffffff 0%, #f2f3f6 100%)",
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
      background: `radial-gradient(70% 45% at 50% 42%, ${tint}59 0%, ${tint}24 32%, transparent 66%)`,
      transition: "background 0.6s ease"
    }
  }), /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      background: "linear-gradient(180deg, #ffffff 0%, transparent 18%, transparent 82%, #f2f3f6 100%)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      zIndex: 2,
      padding: "60px 20px 0",
      display: "flex",
      alignItems: "center"
    }
  }, !(typeof window !== "undefined" && window.__TG) ? /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("home"),
    className: "tap",
    style: {
      width: 40,
      height: 40,
      borderRadius: 999,
      background: "rgba(0,0,0,0.05)",
      border: 0,
      color: "var(--text)",
      display: "grid",
      placeItems: "center",
      padding: 0
    }
  }, /*#__PURE__*/React.createElement(I.ChevronLeft, {
    size: 18
  })) : /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      textAlign: "center",
      fontSize: 11,
      letterSpacing: 1.6,
      textTransform: "uppercase",
      color: "var(--text-4)",
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
      background: `radial-gradient(circle, ${tint}59 0%, ${tint}1f 35%, transparent 70%)`,
      opacity: 0.8 * pulse,
      filter: "blur(22px)",
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
      fontFamily: "var(--bos-title-font)",
      fontSize: 30,
      fontWeight: 600,
      color: "var(--text)",
      lineHeight: 1.1,
      letterSpacing: "-0.6px",
      minHeight: 36
    }
  }, cur ? cur.t : "Как оно ощущается сейчас?"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-3)",
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
      className: "tap hit44",
      "data-haptic": "selection",
      "aria-label": m.t,
      style: {
        background: "transparent",
        border: 0,
        padding: "6px 2px 8px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        color: "var(--text)",
        cursor: "pointer"
      }
    }, /*#__PURE__*/React.createElement("span", {
      "aria-hidden": true,
      style: {
        borderRadius: "50%",
        boxShadow: active ? `0 0 0 2px #0a0a0a, 0 0 16px ${m.c}99` : "none",
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
      color: "var(--text-4)",
      fontWeight: 600
    }
  }, "\u0427\u0442\u043E \u0437\u0430 \u044D\u0442\u0438\u043C \u0441\u0442\u043E\u0438\u0442?"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-5)"
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
        background: on ? "#0a0a0a" : "var(--surface-3)",
        color: on ? "#fff" : "var(--text-3)",
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
      background: "var(--surface-3)",
      border: "1px solid var(--line)",
      boxShadow: "inset 0 1px 2px rgba(0,0,0,0.04)",
      borderRadius: 14,
      padding: "12px 14px",
      color: "var(--text)",
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
      background: "var(--surface-3)",
      borderRadius: 14,
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
      color: "var(--text-4)",
      fontWeight: 600
    }
  }, "\u0414\u043D\u0435\u0432\u043D\u0438\u043A \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u044F"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-2)",
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
      background: picked < 0 ? "var(--surface-3)" : "#0a0a0a",
      color: picked < 0 ? "var(--text-4)" : "#fff",
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

/* JOURNAL / DAILY REFLECTION — LIVE. Real past notes from app.dayNotes (newest first),
   the real header date from the user's clock, and the honest live save (+10 XP only
   when there's text). Drops the frozen demo showcase entries entirely. */
function JournalLive() {
  var {
    navigate
  } = useNav();
  var app = typeof useApp === "function" ? useApp() : null;
  var [a, setA] = useM("");
  var [b, setB] = useM("");
  var [c, setC] = useM("");

  // REAL past notes from app.dayNotes (any day with a written note or tags), newest
  // first; honest empty state when there are none.
  var livePast = (() => {
    var notes = app && app.dayNotes || {};
    return Object.keys(notes).map(k => ({
      key: k,
      e: notes[k]
    })).filter(({
      e
    }) => e && (e.note != null && ("" + e.note).trim() || e.tags && e.tags.length)).sort((x, y) => ("" + y.key).localeCompare("" + x.key)).map(({
      key,
      e
    }) => ({
      date: journalDateLabel(key),
      text: ("" + (e.note || "")).trim(),
      tags: e.tags || []
    }));
  })();

  // Header date from the user's real clock.
  var todayKey = typeof bosTodayKey === "function" ? bosTodayKey() : "";
  var WDAYS = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
  var liveHeader = (() => {
    try {
      var d = new Date();
      return journalDateLabel(bosTodayKey(d)) + " · " + WDAYS[d.getDay()];
    } catch (e) {
      return "";
    }
  })();

  // Persist into dayNotes[todayKey] as {tags, note} — the SAME shape the XP formula
  // rewards (+10/day for a journal note) and the calendar reads. Keep any tags a mood
  // check-in already logged today, so we don't wipe them.
  var liveSave = () => {
    if (!app || !app.setDayNotes || !todayKey) return navigate("home");
    var parts = [];
    if (a.trim()) parts.push("Хорошо: " + a.trim());
    if (b.trim()) parts.push("Помешало: " + b.trim());
    if (c.trim()) parts.push("Завтра: " + c.trim());
    var note = parts.join("\n");
    if (note) {
      var prev = app.dayNotes && app.dayNotes[todayKey] || {};
      app.setDayNotes({
        ...(app.dayNotes || {}),
        [todayKey]: {
          tags: prev.tags || [],
          note
        }
      });
    }
    navigate("home");
  };
  var hasText = a.trim() || b.trim() || c.trim();
  // Honest XP: a journal note awards +10 XP/day (mood check-in is a separate +5). Only
  // promise XP once there's something to save — an empty save earns nothing.
  var saveLabel = hasText ? "Сохранить · +10 XP" : "Сохранить";
  var past = livePast;
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
      boxShadow: "var(--card-shadow)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1.4,
      fontWeight: 600
    }
  }, liveHeader), /*#__PURE__*/React.createElement("div", {
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
      borderRadius: 14,
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
      borderRadius: 14,
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
      borderRadius: 14,
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
    onClick: () => liveSave()
  }, saveLabel), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, "\u041F\u0440\u043E\u0448\u043B\u044B\u0435 \u0437\u0430\u043F\u0438\u0441\u0438"), past.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#fff",
      borderRadius: 14,
      padding: 18,
      marginTop: 8,
      boxShadow: "var(--card-shadow)",
      fontSize: 14,
      color: "var(--text-4)",
      textAlign: "center",
      lineHeight: 1.5
    }
  }, "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u0437\u0430\u043F\u0438\u0441\u0435\u0439 \u2014 \u043F\u0435\u0440\u0432\u0430\u044F \u043F\u043E\u044F\u0432\u0438\u0442\u0441\u044F \u0437\u0434\u0435\u0441\u044C.") : /*#__PURE__*/React.createElement("div", {
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
      boxShadow: "var(--card-shadow)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text)",
      fontWeight: 600
    }
  }, p.date), p.text && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      marginTop: 6,
      color: "var(--text-2)",
      whiteSpace: "pre-line",
      lineHeight: 1.45
    }
  }, p.text), p.tags && p.tags.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6,
      marginTop: p.text ? 8 : 6
    }
  }, p.tags.map((tg, j) => /*#__PURE__*/React.createElement("span", {
    key: j,
    style: {
      fontSize: 12,
      color: "var(--text-3)",
      background: "var(--surface-3)",
      borderRadius: 999,
      padding: "3px 9px"
    }
  }, "#", ("" + tg).replace(/_/g, " "))))))));
}

/* AI CHAT — LIVE. The real conversational coach: every reply goes through the proxy
   (aiReply → aiRaw → Edge Function), action-cards are parsed out via bosParseAction,
   and AI_LIVE_FALLBACK is the honest "try again" when the model returns nothing. The
   live chat persists on-device (private). Drops the scripted demo seed + demo time. */
function AIChatLive() {
  var {
    navigate,
    params
  } = useNav();
  var app = typeof useApp === "function" ? useApp() : null;
  // The mentor's avatar = the orb of your CURRENT state (mood-tinted). Your own
  // avatar sits up top (it's your conversation). Your messages carry no avatar.
  var stateTint = typeof tintFromMood === "function" ? tintFromMood(app && app.mood && app.mood.c) : null;
  // A real, personal opener: time-of-day greeting + the user's name.
  var _name = (app?.userName || "").trim();
  var _hr = function () {
    try {
      return new Date().getHours();
    } catch (e) {
      return 12;
    }
  }();
  var _greet = _hr < 5 ? "Доброй ночи" : _hr < 12 ? "Доброе утро" : _hr < 18 ? "Добрый день" : _hr < 23 ? "Добрый вечер" : "Доброй ночи";
  // The chat date divider — the user's REAL current time, never a hard-coded string.
  var _dateLabel = function () {
    try {
      var d = new Date();
      var mm = d.getMinutes();
      return "Сегодня · " + d.getHours() + ":" + (mm < 10 ? "0" + mm : mm);
    } catch (e) {
      return "Сегодня";
    }
  }();
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

  // Each message: { who, kind, t, ...cardData }. Live chats persist LOCALLY on the
  // device (private — never leaves the phone), so a real user never loses them.
  var _aiChatKey = "bos:aichat:" + (app?.persistId || "live");
  var [msgs, setMsgs] = useM(function () {
    try {
      var raw = localStorage.getItem(_aiChatKey);
      if (raw) {
        var arr = JSON.parse(raw);
        if (arr && arr.length) return arr;
      }
    } catch (e) {}
    return [{
      who: "ai",
      kind: "greeting",
      t: _hello
    }];
  });
  var [draft, setDraft] = useM("");
  var [typing, setTyping] = useM(false);
  var scrollRef = React.useRef(null);
  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs, typing]);

  // Persist the live AI chat locally so it survives reloads & reopening (on-device, private).
  React.useEffect(() => {
    try {
      localStorage.setItem(_aiChatKey, JSON.stringify(msgs));
    } catch (e) {}
  }, [msgs, _aiChatKey]);

  // Split a reply on blank lines into separate human-feeling bubbles, then drop them
  // in one after another with a small stagger (a real person texts in bursts, not one
  // wall). Single-paragraph replies stay a single bubble. Caps at 4 to avoid spam.
  // Returns the ms after which the last bubble lands, so a follow-up action card can
  // be dropped in right after the text (not in the middle of a multi-part reply).
  var appendReply = reply => {
    var parts = ("" + reply).split(/\n{2,}/).map(s => s.trim()).filter(Boolean).slice(0, 4);
    if (parts.length <= 1) {
      setMsgs(m => [...m, {
        who: "ai",
        kind: "text",
        t: parts[0] || ("" + reply).trim()
      }]);
      return 0;
    }
    setMsgs(m => [...m, {
      who: "ai",
      kind: "text",
      t: parts[0]
    }]);
    parts.slice(1).forEach((p, k) => {
      window.setTimeout(() => setMsgs(m => [...m, {
        who: "ai",
        kind: "text",
        t: p
      }]), (k + 1) * 520);
    });
    return (parts.length - 1) * 520;
  };
  var send = text => {
    if (typing) return;
    var t = (text ?? draft).trim();
    if (!t) return;
    var history = [...msgs, {
      who: "me",
      t
    }];
    setMsgs(history);
    setDraft("");
    setTyping(true);
    aiReplyLive(history, buildAiContextLive(app)).then(reply => {
      setTyping(false);
      var parsed = bosParseAction(reply);
      var body = parsed.text && parsed.text.trim() ? parsed.text : parsed.action ? "" : reply || AI_LIVE_FALLBACK;
      var after = body ? appendReply(body) : 0;
      if (parsed.action) window.setTimeout(() => setMsgs(m => [...m, {
        who: "ai",
        kind: "actioncard",
        action: parsed.action,
        aid: bosAid()
      }]), after + 360);
    }).catch(() => {
      setTyping(false);
      setMsgs(m => [...m, {
        who: "ai",
        kind: "text",
        t: AI_LIVE_FALLBACK
      }]);
    });
  };

  // Tap a suggestion pill. New contract: kind:"action" → open a real screen (route +
  // params); kind:"chat" → seed the conversation. Legacy {i,t} pills (heuristic chips)
  // have no kind → treated as chat, sending their text.
  var tapPill = p => {
    if (p && p.kind === "action" && p.route) {
      navigate(p.route, p.params || {});
      return;
    }
    send(p && (p.prompt || p.t) || "");
  };

  // A priming prompt (from a quick pill / profile / the AI hub) auto-sends ONCE when the
  // chat opens, then is CONSUMED so it can never replay. Only the top frame stays mounted,
  // so leaving the chat (tap an action card → mood / journal / habit-settings) and coming
  // BACK re-mounts this screen; without consuming, the same prompt would re-fire on every
  // re-entry and duplicate the message (the canvas-swap-bug family — a mount/effect race).
  // We strip it from THIS frame's params immediately — navigating to the current route just
  // refreshes its params (no transition, no remount) — so any later mount sees no prompt.
  // The thread is already restored from localStorage, so returning shows the real
  // conversation instead of replaying the opener.
  React.useEffect(() => {
    var primer = params && params.prompt;
    if (!primer) return;
    navigate("ai-chat", {}); // consume: the priming prompt fires exactly once
    var t = window.setTimeout(() => send(primer), 350);
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
          borderRadius: 22,
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
          borderRadius: 22,
          borderBottomLeftRadius: 4,
          padding: "10px 14px",
          fontSize: 14,
          color: TH.text,
          lineHeight: 1.45
        }
      }, m.t));
    }
    if (m.kind === "actioncard") {
      var a = m.action || {};
      if (a.type === "open") {
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
        }), /*#__PURE__*/React.createElement("button", {
          className: "tap",
          onClick: () => navigate(a.route),
          style: {
            flex: 1,
            maxWidth: "85%",
            textAlign: "left",
            background: TH.aiCard,
            border: TH.aiCardBorder,
            borderRadius: 22,
            borderTopLeftRadius: 4,
            padding: "13px 16px",
            color: TH.text,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10
          }
        }, /*#__PURE__*/React.createElement("span", {
          style: {
            fontSize: 14,
            fontWeight: 600
          }
        }, a.label || "Открыть"), /*#__PURE__*/React.createElement("span", {
          style: {
            fontSize: 17,
            color: TH.muted
          }
        }, "\u2192")));
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
          maxWidth: "85%",
          background: TH.aiCard,
          border: TH.aiCardBorder,
          borderRadius: 22,
          borderTopLeftRadius: 4,
          padding: 14,
          color: TH.text
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 10
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          width: 40,
          height: 40,
          borderRadius: 14,
          background: a.color ? a.color + "26" : "var(--surface-3)",
          display: "grid",
          placeItems: "center",
          fontSize: 22,
          flexShrink: 0
        }
      }, a.emoji || "✨"), /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1,
          minWidth: 0
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 10.5,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          color: TH.muted,
          fontWeight: 600
        }
      }, "\u041D\u043E\u0432\u0430\u044F \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0430"), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 16,
          fontWeight: 600,
          color: TH.text,
          letterSpacing: "-0.3px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }
      }, a.name))), a.time && /*#__PURE__*/React.createElement("div", {
        style: {
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          marginTop: 11,
          background: TH.accentBg,
          borderRadius: 999,
          padding: "5px 11px",
          fontSize: 12.5,
          color: TH.text
        }
      }, "\u23F0 \u043D\u0430\u043F\u043E\u043C\u0438\u043D\u0430\u043D\u0438\u0435 \u0432 ", a.time), a.why && /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 13,
          lineHeight: 1.5,
          marginTop: 10,
          color: TH.muted
        }
      }, a.why), /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          gap: 8,
          marginTop: 14
        }
      }, /*#__PURE__*/React.createElement("button", {
        className: "tap",
        onClick: () => navigate("habit-settings", {
          mode: "create",
          preset: {
            i: a.emoji || "✨",
            t: a.name,
            color: a.color || null,
            time: a.time || null
          }
        }),
        style: {
          flex: 1,
          background: TH.primary,
          color: TH.primaryFg,
          border: 0,
          borderRadius: 14,
          padding: "11px 14px",
          fontSize: 14,
          fontWeight: 600
        }
      }, "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0443"), /*#__PURE__*/React.createElement("button", {
        className: "tap",
        "data-no-haptic": true,
        onClick: () => setMsgs(mm => mm.filter(x => x.aid !== m.aid)),
        style: {
          background: TH.skipBg,
          color: TH.text,
          border: TH.skipBorder,
          borderRadius: 14,
          padding: "11px 14px",
          fontSize: 14
        }
      }, "\u041D\u0435 \u0441\u0435\u0439\u0447\u0430\u0441"))));
    }
    // Rich AI cards (summary / suggestion / insight) — kept for any persisted message of
    // that shape; live replies are plain text + action-cards, but this keeps old/loaded
    // transcripts rendering correctly.
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
        borderRadius: 22,
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
        borderRadius: 14,
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
        borderRadius: 14,
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
        borderRadius: 14,
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
      borderRadius: 22,
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
      height: 54,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("div", {
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
  }, _dateLabel), msgs.map((m, i) => m.who === "ai" ? renderAI(m, i) : renderMe(m, i)), typing && /*#__PURE__*/React.createElement("div", {
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
      borderRadius: 22,
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
  }, (app && app.aiBrief && Array.isArray(app.aiBrief.pills) && app.aiBrief.pills.length ? app.aiBrief.pills.slice(0, 4) : buildQuickPrompts(app)).map((s, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => tapPill(s),
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
  }, /*#__PURE__*/React.createElement("span", null, s.i), " ", s.label || s.t))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 14px 16px",
      display: "flex",
      gap: 8,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
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
  })), /*#__PURE__*/React.createElement("button", {
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

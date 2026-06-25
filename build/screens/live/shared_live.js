/* screens/live/shared_live.jsx — CLEAN live-only forks of the mode-aware bricks the
   live screens used to borrow from the demo files. Each is the LIVE path only, renamed
   with a *Live suffix, so editing live can never reach into the demo originals (which
   keep their own demo/fresh branches). References only framework + core + live — never a
   demo-defined name. Loaded after core/ and the framework, before the live screen files.
   v197 — live ↔ demo ↔ core split, phase 2. */

/* aiReply → live-only: no demo `AI_DEMO` canned line. Empty model reply → honest fallback. */
async function aiReplyLive(history, ctx) {
  var sys = AI_SYSTEM + (ctx ? "\n\n" + ctx : "");
  var recent = (history || []).filter(m => m && m.t).slice(-AI_HISTORY_TURNS);
  var messages = [{
    role: "system",
    content: sys
  }].concat(recent.map(m => ({
    role: m.who === "me" ? "user" : "assistant",
    content: m.t
  })));
  var t = await aiRaw(messages);
  if (t && t.trim()) return t.trim();
  await new Promise(r => setTimeout(r, 900));
  return AI_LIVE_FALLBACK;
}

/* buildAiContext → live-only: always weave in the real level/XP line (was gated on mode). */
function buildAiContextLive(app) {
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
    if (typeof bosTotalXPLive === "function") {
      var xp = bosTotalXPLive(habits, {
        moods: app.dayMoods,
        notes: app.dayNotes
      });
      var li = typeof bosLevelInfoLive === "function" ? bosLevelInfoLive(xp) : null;
      if (li) parts.push("Уровень " + li.level + " (" + xp + " XP).");
    }
    if (!parts.length) return "";
    return "Контекст пользователя прямо сейчас (опирайся на него, но не зачитывай как список):\n" + parts.join(" ");
  } catch (e) {
    return "";
  }
}

/* FeedbackSheet → live-only: hands the message to the real support email composer
   (no demo "delivered" success animation). */
function FeedbackSheetLive({
  title = "Написать в поддержку",
  dark = false
}) {
  var {
    close
  } = useSheet();
  var C = sheetColors(dark);
  var [txt, setTxt] = React.useState("");
  var send = () => {
    var body = (txt || "").trim();
    if (!body) return;
    try {
      var url = "mailto:" + BOS_SUPPORT_EMAIL + "?subject=" + encodeURIComponent("BalanceOS · " + title) + "&body=" + encodeURIComponent(body);
      if (window.__TG && window.__TG.openLink) window.__TG.openLink(url);else window.location.href = url;
    } catch (e) {}
    close();
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "2px 20px 6px",
      color: C.text
    }
  }, /*#__PURE__*/React.createElement("div", {
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
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: C.sub,
      marginTop: 8,
      lineHeight: 1.45
    }
  }, "\u041E\u0442\u043A\u0440\u043E\u0435\u0442\u0441\u044F \u043F\u0438\u0441\u044C\u043C\u043E \u043D\u0430 ", BOS_SUPPORT_EMAIL, " \u2014 \u043E\u0442\u043F\u0440\u0430\u0432\u044C \u0435\u0433\u043E, \u0438 \u043C\u044B \u043E\u0442\u0432\u0435\u0442\u0438\u043C."), /*#__PURE__*/React.createElement("button", {
    onClick: send,
    disabled: !txt.trim(),
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
      opacity: !txt.trim() ? 0.5 : 1
    }
  }, "\u041D\u0430\u043F\u0438\u0441\u0430\u0442\u044C \u043F\u0438\u0441\u044C\u043C\u043E"));
}

/* DeadlineCalendar → live-only: always the REAL calendar anchored to today (the demo's
   frozen 28-апр-2026 showcase date is gone). */
function DeadlineCalendarLive({
  onPick
}) {
  var MON_SHORT = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  var MON_TITLE = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  var DAYS_IN = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  var _now = new Date();
  var TODAY_M = _now.getMonth(),
    TODAY_D = _now.getDate(),
    YEAR = _now.getFullYear();
  var [m, setM] = React.useState(TODAY_M);
  var [start, setStart] = React.useState(null);
  var [end, setEnd] = React.useState(null);
  var startWeekday = (m * 3 + 3) % 7;
  var cells = [];
  for (var i = 0; i < startWeekday; i++) cells.push(null);
  for (var d = 1; d <= DAYS_IN[m]; d++) cells.push(d);
  var idx = p => p.m * 40 + p.d;
  var doy = p => DAYS_IN.slice(0, p.m).reduce((a, b) => a + b, 0) + p.d;
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
    }
    if (idx(p) <= idx(start)) {
      setStart(p);
      setEnd(null);
      return;
    }
    setEnd(p);
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
      borderRadius: 22,
      padding: 14,
      marginTop: 10,
      boxShadow: "var(--card-shadow)"
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

/* PeopleMonthCalendar → live-only: always the REAL calendar (demo's frozen showcase date gone). */
function PeopleMonthCalendarLive({
  people = [],
  dayFrac,
  label = "Календарь",
  granular = false,
  selPerson: selProp,
  onSelPerson
}) {
  var app = typeof useApp === "function" ? useApp() : null;
  var isDark = app?.themeOverride === "dark";
  var MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  var _nowCal = new Date();
  var CUR_M = _nowCal.getMonth(),
    today = _nowCal.getDate(),
    year = _nowCal.getFullYear();
  var solo = people.length <= 1;
  var [mIdx, setMIdx] = React.useState(CUR_M);
  var [selInner, setSelInner] = React.useState(solo ? 0 : null);
  var selPerson = selProp !== undefined ? selProp : selInner;
  var setSelPerson = v => {
    if (onSelPerson) onSelPerson(v);else setSelInner(v);
  };
  var [selDay, setSelDay] = React.useState(today);
  var daysInMonth = new Date(year, mIdx + 1, 0).getDate();
  var startWeekday = new Date(year, mIdx, 1).getDay();
  var isCurMonth = mIdx === CUR_M;
  var lastLogged = isCurMonth ? today : mIdx > CUR_M ? 0 : daysInMonth;
  var future = d => mIdx > CUR_M || d > lastLogged;
  var pf = (pi, d) => future(d) ? null : dayFrac(pi, d, mIdx);
  var allFrac = d => {
    if (future(d)) return null;
    var v = people.map((_, i) => pf(i, d));
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
  };
  var dayPct = d => selPerson == null ? allFrac(d) : pf(selPerson, d);
  var track = isDark ? "rgba(255,255,255,0.13)" : "rgba(0,0,0,0.09)";
  var selColor = selPerson == null ? "#FEDE34" : people[selPerson]?.color || "#FEDE34";
  var todayBg = isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.07)";
  var selRing = isDark ? "rgba(255,255,255,0.42)" : "rgba(0,0,0,0.28)";
  var chipBg = isDark ? "rgba(255,255,255,0.07)" : "var(--surface-3)";
  var chip = active => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "5px 11px 5px 6px",
    borderRadius: 999,
    background: active ? isDark ? "#fff" : "#0a0a0a" : chipBg,
    color: active ? isDark ? "#0a0a0a" : "#fff" : "var(--text-2)",
    border: 0,
    flexShrink: 0,
    fontSize: 13,
    fontWeight: active ? 700 : 500,
    whiteSpace: "nowrap",
    cursor: "pointer"
  });
  var weekday = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  var cells = [...Array.from({
    length: startWeekday
  }, (_, i) => ({
    blank: true,
    key: "b" + i
  })), ...Array.from({
    length: daysInMonth
  }, (_, i) => ({
    d: i + 1,
    key: "d" + (i + 1)
  }))];
  var selActive = future(selDay) ? null : people.filter((_, i) => (pf(i, selDay) ?? 0) >= 0.5).length;
  var selAvg = future(selDay) ? null : Math.round((allFrac(selDay) || 0) * 100);
  var selName = selPerson != null && people[selPerson] ? people[selPerson].name : null;
  return /*#__PURE__*/React.createElement(React.Fragment, null, label && /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--card)",
      borderRadius: 22,
      padding: 16,
      marginTop: label ? 8 : 0,
      boxShadow: "var(--card-shadow)"
    }
  }, !solo && /*#__PURE__*/React.createElement("div", {
    className: "screen-scroll",
    style: {
      display: "flex",
      gap: 7,
      overflowX: "auto",
      paddingBottom: 2,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setSelPerson(null),
    className: "tap",
    style: chip(selPerson == null)
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 18,
      height: 18,
      borderRadius: "50%",
      background: isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.1)",
      display: "grid",
      placeItems: "center",
      fontSize: 10
    }
  }, "\uD83D\uDC65"), "\u0412\u0441\u0435"), people.map((m, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => setSelPerson(i),
    className: "tap",
    style: chip(selPerson === i)
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 18,
      height: 18,
      borderRadius: "50%",
      background: m.color,
      display: "grid",
      placeItems: "center",
      fontSize: 9,
      fontWeight: 700,
      color: "rgba(0,0,0,0.6)"
    }
  }, m.initials), m.you ? "Ты" : (m.name || "").split(" ")[0]))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setMIdx(m => Math.max(0, m - 1)),
    className: "tap",
    style: {
      background: chipBg,
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
      fontSize: 16,
      fontWeight: 700,
      letterSpacing: "-0.3px"
    }
  }, MONTHS[mIdx], " ", year), /*#__PURE__*/React.createElement("button", {
    onClick: () => setMIdx(m => Math.min(11, m + 1)),
    className: "tap",
    style: {
      background: chipBg,
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
      gridTemplateColumns: "repeat(7,1fr)",
      gap: 4,
      marginTop: 14
    }
  }, weekday.map((w, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      textAlign: "center",
      fontSize: 10.5,
      fontWeight: 600,
      letterSpacing: 0.6,
      color: "var(--text-4)"
    }
  }, w))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(7,1fr)",
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
    var pct = dayPct(c.d);
    var fut = pct == null;
    var isToday = isCurMonth && c.d === today;
    var isSel = selDay === c.d;
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
        color: fut ? "var(--text-4)" : isDark ? "#fff" : "var(--text)"
      }
    }, isToday && /*#__PURE__*/React.createElement("span", {
      "aria-hidden": true,
      style: {
        position: "absolute",
        width: "62%",
        aspectRatio: "1/1",
        borderRadius: "50%",
        background: todayBg
      }
    }), isSel && !isToday && /*#__PURE__*/React.createElement("span", {
      "aria-hidden": true,
      style: {
        position: "absolute",
        width: "66%",
        aspectRatio: "1/1",
        borderRadius: "50%",
        border: "1.5px solid " + selRing
      }
    }), fut ? /*#__PURE__*/React.createElement("span", {
      "aria-hidden": true,
      style: {
        position: "absolute",
        inset: "17%",
        borderRadius: "50%",
        border: "1px dashed " + (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)")
      }
    }) : /*#__PURE__*/React.createElement(TeamRing, {
      pct: pct,
      color: selColor,
      track: track,
      glow: pct === 1
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        position: "relative",
        zIndex: 1
      }
    }, c.d));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      paddingTop: 13,
      borderTop: "1px solid var(--line)",
      fontSize: 12.5,
      color: "var(--text-3)",
      lineHeight: 1.45
    }
  }, future(selDay) ? `${MONTHS[mIdx]} ${selDay} — ещё впереди` : solo ? /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", {
    style: {
      color: "var(--text)"
    }
  }, MONTHS[mIdx], " ", selDay), " \xB7 ", (dayPct(selDay) || 0) > 0 ? "выполнено ✓" : "пропущено") : selPerson == null ? /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", {
    style: {
      color: "var(--text)"
    }
  }, MONTHS[mIdx], " ", selDay), " \xB7 \u043E\u0442\u043C\u0435\u0442\u0438\u043B\u043E\u0441\u044C ", selActive, " \u0438\u0437 ", people.length, granular && selAvg != null ? ` · ${selAvg}%` : "") : /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", {
    style: {
      color: "var(--text)"
    }
  }, selName), " \xB7 ", MONTHS[mIdx], " ", selDay, " \xB7 ", granular ? `${Math.round((dayPct(selDay) || 0) * 100)}% привычек` : (dayPct(selDay) || 0) > 0 ? "отмечался ✓" : "пропустил"))));
}

/* NetworkLocked → live-only: the REAL ways to climb (habits / state / team). No demo
   premium-course showcase, no dev "instant unlock" bypass. */
function NetworkLockedLive({
  navigate,
  level,
  xp,
  xpMax,
  levelsLeft
}) {
  var xpPct = Math.max(0, Math.min(1, xp / xpMax));
  var ruLvl = n => {
    var m = n % 10,
      h = n % 100;
    return m === 1 && h !== 11 ? "уровень" : m >= 2 && m <= 4 && (h < 10 || h >= 20) ? "уровня" : "уровней";
  };
  var progPct = ((10 - levelsLeft - 1 + xpPct) / 10 * 100).toFixed(1);
  var paths = [{
    i: "🔥",
    t: "Закрывай привычки",
    d: "Каждый день с галочкой — это опыт и шаг к цели.",
    cta: "К привычкам",
    action: () => navigate("home"),
    meta: "+10 XP / день",
    accent: "#FEDE34"
  }, {
    i: "🌤️",
    t: "Отмечай состояние",
    d: "Отметка и пара строк в дневнике дают опыт каждый день.",
    cta: "Отметить сейчас",
    action: () => navigate("mood"),
    meta: "+15 XP / день",
    accent: "#9bd0ff"
  }, {
    i: "🤝",
    t: "Собери команду",
    d: "Общие привычки с друзьями тоже идут в твой опыт — и так веселее.",
    cta: "Создать команду",
    action: () => navigate("team-create"),
    meta: "Привычки вместе",
    accent: "#85e3a8"
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12,
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      overflow: "hidden",
      borderRadius: 22,
      padding: "16px 18px",
      background: "linear-gradient(145deg, #26406e 0%, #182c4f 52%, #0c1730 100%)",
      boxShadow: "0 10px 26px rgba(12,23,48,0.42)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      inset: 0,
      background: "radial-gradient(circle at 82% 18%, rgba(150,185,255,0.30) 0%, transparent 46%), radial-gradient(circle at 12% 96%, rgba(120,160,220,0.16) 0%, transparent 44%)",
      pointerEvents: "none"
    }
  }), /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      top: 15,
      right: 18,
      fontSize: 34,
      lineHeight: 1,
      pointerEvents: "none"
    }
  }, "\uD83D\uDC51"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 1.4,
      textTransform: "uppercase",
      color: "rgba(160,196,255,0.9)"
    }
  }, "\u041D\u0435\u0442\u0432\u043E\u0440\u043A \xB7 \u043E\u0442\u043A\u0440\u043E\u0435\u0442\u0441\u044F \u0441 10 \u0443\u0440\u043E\u0432\u043D\u044F"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 700,
      letterSpacing: "-0.4px",
      color: "#fff",
      marginTop: 4,
      maxWidth: 215,
      lineHeight: 1.18
    }
  }, "\u0417\u0430\u043A\u0440\u044B\u0442\u044B\u0439 \u043A\u0440\u0443\u0433 \u0441\u0432\u043E\u0438\u0445"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "rgba(255,255,255,0.74)",
      marginTop: 6,
      lineHeight: 1.4,
      maxWidth: 248
    }
  }, "\u0416\u0438\u0432\u044B\u0435 \u0432\u0441\u0442\u0440\u0435\u0447\u0438 \u0438 \u043F\u043E\u043C\u043E\u0449\u044C \u0440\u044F\u0434\u043E\u043C \u2014 \u0441 \u043B\u044E\u0434\u044C\u043C\u0438 \u0442\u0432\u043E\u0435\u0433\u043E \u0433\u043E\u0440\u043E\u0434\u0430."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13.5,
      fontWeight: 700,
      color: "#fff"
    }
  }, "\u0423\u0440\u043E\u0432\u0435\u043D\u044C ", level, " \u2192 10"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: "rgba(255,255,255,0.72)"
    }
  }, "\u043E\u0441\u0442\u0430\u043B\u043E\u0441\u044C ", levelsLeft, " ", ruLvl(levelsLeft))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 9,
      borderRadius: 999,
      background: "rgba(255,255,255,0.13)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      height: "100%",
      width: progPct + "%",
      background: "linear-gradient(90deg, #FEDE34, #EF9F14)",
      borderRadius: 999
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 7,
      marginTop: 13
    }
  }, [["🤝", "Наставники"], ["💎", "Услуги за XP"]].map(([e, l], i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      background: "rgba(255,255,255,0.13)",
      borderRadius: 999,
      padding: "6px 11px",
      fontSize: 12.5,
      fontWeight: 700,
      color: "#fff"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      lineHeight: 1
    }
  }, e), l))))), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 6
    }
  }, "3 \u0441\u043F\u043E\u0441\u043E\u0431\u0430 \u043E\u0442\u043A\u0440\u044B\u0442\u044C"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, paths.map((p, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: p.action,
    className: "tap",
    style: {
      background: "var(--card)",
      border: 0,
      borderRadius: 22,
      padding: 16,
      boxShadow: "var(--card-shadow)",
      display: "flex",
      alignItems: "center",
      gap: 14,
      textAlign: "left",
      position: "relative",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 44,
      height: 44,
      borderRadius: 14,
      background: `linear-gradient(135deg, ${p.accent}66, ${p.accent}22)`,
      display: "grid",
      placeItems: "center",
      fontSize: 22,
      flexShrink: 0,
      position: "relative"
    }
  }, p.i), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 600,
      color: "var(--text)"
    }
  }, p.t), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      padding: "2px 7px",
      borderRadius: 999,
      background: `${p.accent}33`,
      color: "#0a0a0a",
      letterSpacing: 0.2
    }
  }, p.meta)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-4)",
      marginTop: 4,
      lineHeight: 1.45
    }
  }, p.d)), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 18,
    color: "var(--text-4)",
    style: {
      position: "relative"
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--card)",
      borderRadius: 22,
      padding: "14px 16px",
      boxShadow: "var(--card-shadow)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement(I.Help, {
    size: 14,
    color: "var(--text-3)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: "var(--text-2)",
      letterSpacing: 0.2
    }
  }, "\u041F\u043E\u0447\u0435\u043C\u0443 \u041D\u0435\u0442\u0432\u043E\u0440\u043A \u0437\u0430\u043A\u0440\u044B\u0442?")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-4)",
      lineHeight: 1.5
    }
  }, "\u041D\u0430\u043C \u0432\u0430\u0436\u043D\u044B \u043B\u044E\u0434\u0438, \u043F\u0440\u0435\u0434\u0430\u043D\u043D\u044B\u0435 \u0434\u0435\u043B\u0443, \u0430 \u043D\u0435 \u0441\u043B\u0443\u0447\u0430\u0439\u043D\u044B\u0439 \u0448\u0443\u043C. \u041A\u043E\u0433\u0434\u0430 \u0432\u0445\u043E\u0434 \u043D\u0443\u0436\u043D\u043E \u0437\u0430\u0441\u043B\u0443\u0436\u0438\u0442\u044C, \u0437\u0434\u0435\u0441\u044C \u043E\u0441\u0442\u0430\u044E\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u0442\u0435, \u0441 \u043A\u0435\u043C \u043F\u0440\u0430\u0432\u0434\u0430 \u0445\u043E\u0447\u0435\u0442\u0441\u044F \u043F\u043E\u0437\u043D\u0430\u043A\u043E\u043C\u0438\u0442\u044C\u0441\u044F.")));
}

/* ShareAppSheet → live-only: the user's REAL referral circle + ?ref=<uid> invite link
   (no demo sample faces, no demo "истории/ещё" share targets). */
function ShareAppSheetLive({
  dark = false
}) {
  var {
    close
  } = useSheet();
  var APP_URL = typeof bosInviteLink === "function" ? bosInviteLink(null) : "https://t.me/BalanceOS8_bot";
  var [copied, setCopied] = React.useState(false);
  var [shareUrl, setShareUrl] = React.useState(APP_URL);
  React.useEffect(() => {
    var on = true;
    if (window.bosCloud && window.bosCloud.uid) {
      window.bosCloud.uid().then(id => {
        if (on && id) setShareUrl(typeof bosInviteLink === "function" ? bosInviteLink(id) : APP_URL + "?ref=" + id);
      }).catch(() => {});
    }
    return () => {
      on = false;
    };
  }, []);
  var copyLink = () => {
    try {
      navigator.clipboard.writeText(shareUrl);
    } catch (e) {}
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
    if (window.tgHaptic) {
      try {
        window.tgHaptic("light");
      } catch (e) {}
    }
  };
  var shareLink = () => {
    if (window.bosShare ? !window.bosShare(shareUrl, "Держим баланс вместе — BalanceOS") : true) copyLink();else if (window.tgHaptic) {
      try {
        window.tgHaptic("light");
      } catch (e) {}
    }
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
  var _FCOLORS = ["#f0c8a8", "#a8c0e8", "#e8b8d4", "#b8e8c8", "#d4c8e8", "#a8d4e8", "#e8d0a8"];
  var [liveFriends, setLiveFriends] = React.useState([]);
  React.useEffect(() => {
    if (!(window.bosCloud && window.bosCloud.enabled())) return;
    var on = true;
    try {
      window.bosCloud.invitedPeople().then(list => {
        if (!on || !Array.isArray(list)) return;
        setLiveFriends(list.map((p, idx) => {
          var nm = p && p.username ? p.username : "Друг";
          return {
            name: nm,
            i: nm.charAt(0).toUpperCase(),
            c: _FCOLORS[idx % _FCOLORS.length]
          };
        }));
      }).catch(() => {});
    } catch (e) {}
    return () => {
      on = false;
    };
  }, []);
  var friends = liveFriends;
  // Real referral progress → the live milestone the user is ACTUALLY working toward
  // (no fake "2 из 3"; a fresh user honestly sees "0 из 3"). Same CIRCLE_MILESTONES as community.
  var _nextMile = [{
    n: 3,
    bonus: 300
  }, {
    n: 7,
    bonus: 700
  }, {
    n: 15,
    bonus: 1500
  }, {
    n: 30,
    bonus: 3000
  }].find(m => m.n > friends.length) || {
    n: 30,
    bonus: 3000
  };
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
    dark: dark,
    circleNow: friends.length,
    circleGoal: _nextMile.n,
    circleBonus: _nextMile.bonus
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
  }, "t.me/BalanceOS8_bot"), /*#__PURE__*/React.createElement("button", {
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
  }, copied ? "Скопировано ✓" : "Копировать")), friends.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: C.sub,
      textTransform: "uppercase",
      letterSpacing: 1,
      fontWeight: 600,
      margin: "20px 0 12px"
    }
  }, "\u0422\u0432\u043E\u0439 \u043A\u0440\u0443\u0433"), /*#__PURE__*/React.createElement("div", {
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
    onClick: shareLink,
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
      color: C.sub,
      maxWidth: 56,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, p.name)))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: C.line,
      margin: "18px 0"
    }
  })), /*#__PURE__*/React.createElement("button", {
    onClick: shareLink,
    className: "tap",
    style: {
      width: "100%",
      marginTop: friends.length > 0 ? 4 : 18,
      border: 0,
      borderRadius: 16,
      padding: "15px 16px",
      background: "#229ED9",
      color: "#fff",
      fontSize: 15.5,
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 9
    }
  }, /*#__PURE__*/React.createElement(I.Send, {
    size: 18
  }), " \u041F\u043E\u0434\u0435\u043B\u0438\u0442\u044C\u0441\u044F \u0432 Telegram"), /*#__PURE__*/React.createElement("button", {
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

/* ShareHabitSheet → live-only: REAL referral circle + ?ref=<uid> link (no demo friends,
   no demo "истории/ещё" targets). */
function ShareHabitSheetLive({
  habit,
  dark = false
}) {
  var {
    close
  } = useSheet();
  var APP_URL = typeof bosInviteLink === "function" ? bosInviteLink(null) : "https://t.me/BalanceOS8_bot";
  var [shareUrl, setShareUrl] = React.useState(APP_URL);
  React.useEffect(() => {
    var on = true;
    if (window.bosCloud && window.bosCloud.uid) {
      window.bosCloud.uid().then(id => {
        if (on && id) setShareUrl(typeof bosInviteLink === "function" ? bosInviteLink(id) : APP_URL + "?ref=" + id);
      }).catch(() => {});
    }
    return () => {
      on = false;
    };
  }, []);
  var shareLink = () => {
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
  var _FCOLORS = ["#e8c8a8", "#a8b9d4", "#d4b8e8", "#a8d4e8", "#b8e8c8", "#e8b8d4", "#d4c8e8"];
  var [friends, setFriends] = React.useState([]);
  React.useEffect(() => {
    if (!(window.bosCloud && window.bosCloud.enabled())) return;
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
  }, []);
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
      borderRadius: 14,
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
  }, "\u0414\u0435\u043B\u0430\u0442\u044C \u0432\u043C\u0435\u0441\u0442\u0435"), friends.length === 0 ? /*#__PURE__*/React.createElement("div", {
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
  }), /*#__PURE__*/React.createElement("button", {
    onClick: shareLink,
    className: "tap",
    style: {
      width: "100%",
      border: 0,
      borderRadius: 16,
      padding: "15px 16px",
      background: "#229ED9",
      color: "#fff",
      fontSize: 15.5,
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 9
    }
  }, /*#__PURE__*/React.createElement(I.Send, {
    size: 18
  }), " \u041F\u043E\u0434\u0435\u043B\u0438\u0442\u044C\u0441\u044F \u0432 Telegram"), /*#__PURE__*/React.createElement("button", {
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

/* MoodWidget → live-only: real per-day mood trail (Пн→Вс), real streak chip + XP copy.
   No demo numeric-days showcase, no fresh-user empty state (live always has the trail). */
// LIVE daily state CHECK-IN prompt (David: once a day, in-app card — no push).
// Sits ABOVE habits when today's state isn't logged yet; one tap on a mood orb logs
// it (setMood + setDayMoods, keyed by the real day) and the slot flips to the widget.
// Flush (no own margin/radius/shadow) so it drops cleanly into a SwipeRow wrapper.
function StatePromptLive({
  app,
  isDark
}) {
  var moods = typeof MOOD_OPTIONS !== "undefined" ? MOOD_OPTIONS : [];
  var log = i => {
    if (!app) return;
    var dayKey = typeof bosTodayKey === "function" ? bosTodayKey() : new Date().toISOString().slice(0, 10);
    app.setMood && app.setMood(moods[i]);
    app.setDayMoods && app.setDayMoods({
      ...(app.dayMoods || {}),
      [dayKey]: i
    });
    if (window.tgHaptic) {
      try {
        window.tgHaptic("light");
      } catch (e) {}
    }
  };
  var bg = isDark ? "linear-gradient(160deg, #1a1a1d 0%, #0d0d10 100%)" : "#ffffff";
  var titleColor = isDark ? "#fff" : "var(--text)";
  var labelMuted = isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.5)";
  var subMuted = isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.55)";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      background: bg,
      padding: 18,
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
      fontSize: 11,
      color: labelMuted,
      textTransform: "uppercase",
      letterSpacing: 1.4,
      fontWeight: 600
    }
  }, "\u041E\u0442\u043C\u0435\u0442\u044C \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      color: isDark ? "#9fd5a8" : "#3f7a46",
      background: "rgba(90,168,90,0.16)",
      borderRadius: 999,
      padding: "2px 8px"
    }
  }, "+5 XP")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--bos-title-font)",
      fontSize: 23,
      fontWeight: 600,
      lineHeight: 1.12,
      letterSpacing: "-0.5px",
      marginTop: 5,
      color: titleColor
    }
  }, "\u041A\u0430\u043A \u0442\u044B \u0441\u0435\u0439\u0447\u0430\u0441?"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: subMuted,
      marginTop: 4
    }
  }, "\u041E\u0434\u0438\u043D \u0442\u0430\u043F \u2014 \u0438 \u0434\u0435\u043D\u044C \u0437\u0430\u043F\u0438\u0441\u0430\u043D. \u0422\u0430\u043A \u0440\u0430\u0441\u0442\u0451\u0442 \u0441\u0435\u0440\u0438\u044F."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginTop: 14,
      justifyContent: "space-between"
    }
  }, moods.map((m, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    className: "tap",
    "data-no-haptic": true,
    onClick: () => log(i),
    title: m.t,
    "aria-label": m.t,
    style: {
      flex: 1,
      background: "transparent",
      border: 0,
      padding: 0,
      display: "grid",
      placeItems: "center",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 46,
      height: 46,
      borderRadius: "50%",
      background: "linear-gradient(160deg, " + m.c + ", " + m.c + "99)",
      display: "grid",
      placeItems: "center",
      fontSize: 23,
      boxShadow: isDark ? "inset 0 0 0 1px rgba(255,255,255,0.08)" : "0 1px 3px rgba(0,0,0,0.08)"
    }
  }, m.i)))));
}

// LIVE share-a-goal sheet — the goal twin of ShareHabitSheetLive, kept minimal: share
// the app by your referral link with a line about the goal (goals aren't team-joined
// like habits, so no "do together" roster here).
function ShareGoalSheetLive({
  goal,
  dark = false
}) {
  var APP_URL = typeof bosInviteLink === "function" ? bosInviteLink(null) : "https://t.me/BalanceOS8_bot";
  var [shareUrl, setShareUrl] = React.useState(APP_URL);
  React.useEffect(() => {
    var on = true;
    if (window.bosCloud && window.bosCloud.uid) {
      window.bosCloud.uid().then(id => {
        if (on && id) setShareUrl(typeof bosInviteLink === "function" ? bosInviteLink(id) : APP_URL + "?ref=" + id);
      }).catch(() => {});
    }
    return () => {
      on = false;
    };
  }, []);
  var doShare = () => {
    var msg = "Иду к цели «" + (goal?.name || "") + "» в BalanceOS — попробуй со мной";
    if (window.bosShare) window.bosShare(shareUrl, msg);else {
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
    btnBg: "#fff",
    btnFg: "#0a0a0a"
  } : {
    text: "#0a0a0a",
    sub: "rgba(0,0,0,0.5)",
    tile: "#f1f1f3",
    btnBg: "#0a0a0a",
    btnFg: "#fff"
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "2px 20px 22px",
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
      borderRadius: 14,
      background: C.tile,
      display: "grid",
      placeItems: "center",
      fontSize: 30,
      margin: "0 auto 10px"
    }
  }, goal?.emoji || "🎯"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 700,
      letterSpacing: "-0.3px"
    }
  }, "\u041F\u043E\u0434\u0435\u043B\u0438\u0442\u044C\u0441\u044F \u0446\u0435\u043B\u044C\u044E"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: C.sub,
      marginTop: 3
    }
  }, "\xAB", goal?.name || "Цель", "\xBB \u2014 \u0440\u0430\u0441\u0441\u043A\u0430\u0436\u0438, \u043A \u0447\u0435\u043C\u0443 \u0438\u0434\u0451\u0448\u044C")), /*#__PURE__*/React.createElement("button", {
    onClick: doShare,
    className: "tap",
    style: {
      marginTop: 18,
      width: "100%",
      border: 0,
      borderRadius: 16,
      padding: "15px 16px",
      background: C.btnBg,
      color: C.btnFg,
      fontSize: 15.5,
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(I.Share, {
    size: 17
  }), " \u041F\u043E\u0434\u0435\u043B\u0438\u0442\u044C\u0441\u044F \u0441\u0441\u044B\u043B\u043A\u043E\u0439"));
}
function MoodWidgetLive({
  mood,
  app,
  isDark,
  navigate,
  flush = false
}) {
  var _WD = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  var _monOff = (new Date().getDay() + 6) % 7; // 0=Пн … 6=Вс — TODAY's slot in the week
  var last7 = [0, 1, 2, 3, 4, 5, 6].map(i => {
    var off = _monOff - i; // days ago (negative = a day later this week)
    var key = typeof bosDayKeyOffset === "function" ? bosDayKeyOffset(off) : "";
    var di = app?.dayMoods && app.dayMoods[key] != null ? app.dayMoods[key] : null;
    return {
      key,
      today: i === _monOff,
      future: off < 0,
      wd: _WD[i],
      m: di != null && MOOD_OPTIONS[di] ? MOOD_OPTIONS[di] : null
    };
  });
  var logged = last7.filter(d => d.m).length;
  var bg = isDark ? `linear-gradient(160deg, #1a1a1d 0%, #0d0d10 100%)` : `#ffffff`;
  var border = isDark ? "0" : "1px solid rgba(0,0,0,0.04)";
  var labelMuted = isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.50)";
  var subMuted = isDark ? "rgba(255,255,255,0.60)" : "rgba(0,0,0,0.55)";
  var titleColor = isDark ? "#fff" : "var(--text)";
  var trailIdle = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  var trailRing = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.28)";
  var chipBg = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)";
  var _moodStreak = typeof bosMoodStreak === "function" ? bosMoodStreak(app?.dayMoods) : 0;
  return /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("mood"),
    className: "tap",
    "data-tour": "state",
    style: {
      marginTop: flush ? 0 : 12,
      width: "100%",
      border: flush ? "0" : border,
      textAlign: "left",
      background: bg,
      borderRadius: flush ? 0 : 22,
      padding: 18,
      position: "relative",
      overflow: "hidden",
      boxShadow: flush ? "none" : isDark ? "none" : "0 1px 2px rgba(0,0,0,0.04)",
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
  }, "\u0421\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435 \xB7 \u0441\u0435\u0439\u0447\u0430\u0441"), _moodStreak >= 2 && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      color: isDark ? "#FF9A62" : "#a4541b",
      background: "rgba(255,138,91,0.16)",
      borderRadius: 999,
      padding: "2px 8px",
      letterSpacing: 0.3,
      whiteSpace: "nowrap"
    }
  }, "\uD83D\uDD25 ", _moodStreak, " ", bosRuDays(_moodStreak), " \u043F\u043E\u0434\u0440\u044F\u0434")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--bos-title-font)",
      fontSize: 26,
      fontWeight: 600,
      lineHeight: 1.1,
      letterSpacing: "-0.6px",
      marginTop: 4,
      color: titleColor
    }
  }, mood.t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: subMuted,
      marginTop: 4
    }
  }, "\u041E\u0442\u043C\u0435\u0447\u0430\u0439 \u043A\u0430\u0436\u0434\u044B\u0439 \u0434\u0435\u043D\u044C: +5 XP, +10 \u0441\u043E \u0441\u0442\u0440\u043E\u043A\u043E\u0439 \u0432 \u0434\u043D\u0435\u0432\u043D\u0438\u043A. \u0423\u0434\u0435\u0440\u0436\u0438\u0448\u044C \u043D\u0435\u0434\u0435\u043B\u044E \u043F\u043E\u0434\u0440\u044F\u0434 \u2014 \u0431\u043E\u043D\u0443\u0441 +50 XP."))), /*#__PURE__*/React.createElement("div", {
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
      gap: 4,
      opacity: d.future ? 0.4 : 1
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
  }, d.wd))), /*#__PURE__*/React.createElement("span", {
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

/* HomeHeroSwipe → live-only: the real new user's hero — page 1 ONLY (the demo's balance
   wheel / orbit 2nd page was removed). newbie (no habits) → "С чего начать" hints; else →
   AI-brief summary + action pills. Avatar ring follows the mood orb. No swipe deck. */
function HomeHeroSwipeLive({
  navigate,
  doneCount,
  totalCount,
  ringPct,
  isDark
}) {
  var [ringShown, setRingShown] = React.useState(0);
  React.useEffect(() => {
    var t = setTimeout(() => setRingShown(ringPct), 80);
    return () => clearTimeout(t);
  }, [ringPct]);
  var heroApp = useApp ? useApp() : null;
  var mood = heroApp?.mood;
  var moodTint = mood && typeof tintFromMood === "function" ? tintFromMood(mood.c) : null;
  // Live newbie = a real Telegram user who just signed in and has no habits yet.
  var newbie = (heroApp?.habits?.length || 0) === 0;
  var chipBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.85)";
  var chipBd = isDark ? "0" : "1px solid rgba(0,0,0,0.05)";
  var cardBg = isDark ? "linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)" : "linear-gradient(160deg, #ffffff 0%, #f5f5f5 100%)";
  var cardBd = isDark ? "0" : "1px solid rgba(0,0,0,0.04)";
  var ringBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  var AI_BRIEF = {
    "Энергия": "Энергии много — берись за самое важное сейчас.",
    "Радость": "Ты в ресурсе — отличный день, чтобы закрыть серию.",
    "Спокойствие": "Спокойствие — твоё время для глубокого чтения.",
    "Тревога": "Начни с двух минут дыхания — и день станет легче.",
    "Упадок": "Сделай одно маленькое дело — этого сегодня достаточно.",
    "Усталость": "Сбавь темп: закрой одну привычку — и довольно."
  };
  var aiBrief = totalCount && doneCount >= totalCount ? "День закрыт — ты в потоке. Так держи ритм." : AI_BRIEF[mood && mood.t] || "Чтение легче даётся вечером — оставь его на потом.";
  // For LIVE the summary + pills come from the AI login brief (heuristic fallback if absent).
  var _liveBrief = heroApp?.aiBrief || null;
  var _homeSummary = _liveBrief && _liveBrief.summary || aiBrief;
  var _livePills = _liveBrief && Array.isArray(_liveBrief.pills) && _liveBrief.pills.length ? _liveBrief.pills.slice(0, 4) : null;
  var _pillsKey = _livePills ? _livePills.map(bosPillLabel).join("|") : "live";
  var page1 = newbie ? /*#__PURE__*/React.createElement("div", {
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
      letterSpacing: 1.2,
      display: "inline-flex",
      alignItems: "center",
      gap: 5
    }
  }, /*#__PURE__*/React.createElement(I.Sparkles, {
    size: 12,
    color: "#E0A500",
    filled: true,
    strokeWidth: 0
  }), " \u0421 \u0447\u0435\u0433\u043E \u043D\u0430\u0447\u0430\u0442\u044C"), /*#__PURE__*/React.createElement("div", {
    key: _homeSummary,
    style: {
      fontSize: 13.5,
      color: "var(--text-2)",
      marginTop: 3,
      lineHeight: 1.4,
      letterSpacing: "-0.1px",
      animation: _liveBrief ? "briefFade 0.5s ease both" : undefined
    }
  }, _liveBrief ? _homeSummary : "Расскажи о себе — и я подскажу, с каких привычек начать.")), /*#__PURE__*/React.createElement("button", {
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
  })), /*#__PURE__*/React.createElement(HeroOrbFace, {
    avatar: heroApp?.avatar,
    inset: 5,
    size: 44,
    moodTint: moodTint
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6
    }
  }, [{
    i: "🙋",
    t: "Рассказать о себе",
    go: () => navigate("ai-chat", {
      prompt: "Я хочу рассказать о себе — задай мне пару коротких вопросов и подскажи, с каких привычек начать."
    })
  }, {
    i: "➕",
    t: "Создать привычку",
    go: () => navigate("habit-settings", {
      mode: "create"
    })
  }, {
    i: "🧭",
    t: "Как всё устроено",
    go: () => navigate("guide")
  }, {
    i: "✨",
    t: "Спросить ИИ",
    go: () => navigate("ai-chat")
  }].map((c, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: c.go,
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
  }, /*#__PURE__*/React.createElement(I.Sparkles, {
    size: 12,
    color: "#E0A500",
    filled: true,
    strokeWidth: 0
  }), " \u041F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0438 \u0434\u043B\u044F \u0442\u0435\u0431\u044F"), /*#__PURE__*/React.createElement("div", {
    key: _homeSummary,
    style: {
      fontSize: 14,
      color: "var(--text-2)",
      marginTop: 5,
      lineHeight: 1.42,
      letterSpacing: "-0.1px",
      animation: "briefFade 0.5s ease both"
    }
  }, _homeSummary)), /*#__PURE__*/React.createElement("button", {
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
  })), /*#__PURE__*/React.createElement(HeroOrbFace, {
    avatar: heroApp?.avatar,
    inset: 6,
    size: 60,
    moodTint: moodTint
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
    key: _pillsKey,
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6,
      marginTop: "auto",
      paddingTop: 12,
      paddingBottom: 14
    }
  }, (_livePills || [{
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
  }]).map((c, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => bosRoutePill(navigate, c),
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
      gap: 6,
      animation: _livePills ? "briefPop 0.45s cubic-bezier(0.22,0.9,0.3,1.2) both " + i * 0.06 + "s" : undefined
    }
  }, /*#__PURE__*/React.createElement("span", null, bosPillIcon(c)), bosPillLabel(c)))));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: cardBg,
      border: cardBd,
      borderRadius: 22,
      position: "relative",
      overflow: "hidden",
      boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      width: "100%",
      minHeight: 196
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      flexShrink: 0
    }
  }, page1)));
}

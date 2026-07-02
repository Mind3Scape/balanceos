function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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

/* Learning-cards visibility (Habits → «Обучение»). One persisted flag: hide once read,
   restore from Settings → Предпочтения. Synced across screens via a window event so the
   habits screen reacts the moment Settings flips it (David: «прочитал — хочу убрать»). */
function bosLearnHidden() {
  try {
    return localStorage.getItem("bos:hideLearn") === "1";
  } catch (e) {
    return false;
  }
}
function bosSetLearnHidden(v) {
  try {
    localStorage.setItem("bos:hideLearn", v ? "1" : "0");
  } catch (e) {}
  try {
    window.dispatchEvent(new Event("bos:learnchange"));
  } catch (e) {}
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
        borderRadius: ends ? 999 : mid ? 7 : 999,
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

/* ONE soft, glossy completion-fill — the calendar AND the week strip share it, so the whole app
   speaks one colour (David: «заливки слишком яркие; рассинхрон с мягкой иконкой; чёрный прям
   чёрный; и хочется градиент с лёгким блеском Liquid-Glass, а не сплошняк»). A light TOP sheen over
   a directional tint of the habit's colour `hx`, intensity by p (0..1). Capped well below full
   saturation → soft, never neon; black lands as a soft graphite, not pure black. */
function bosCellFill(hx, p) {
  if (!(hx && hx[0] === "#" && hx.length >= 7)) hx = "#0a0a0a";
  var bot = 0.30 + 0.55 * Math.max(0, Math.min(1, p)); // bottom alpha — PRESENT, caps ~0.85 (never full)
  var top = bot * 0.6; // lighter top → directional sheen
  var hex = function (a) {
    return Math.round(a * 255).toString(16).padStart(2, "0");
  };
  return "linear-gradient(180deg, " + hx + hex(top) + ", " + hx + hex(bot) + ")";
}
// Осветлить hex к белому на amt (0..1) → МЯГКАЯ ПАСТЕЛЬ. Наши BOS_APPLE_COLORS средне-насыщенные;
// заливать карточку целиком ими = «убого» (David). Осветляем до партнёрской пастели (#B9D4FF-класс),
// сохраняя палитру. ЕДИНЫЙ тон для заливки карточек целей/команд = язык карточек «Потратить XP».
function bosLightenHex(hx, amt) {
  if (!(hx && hx[0] === "#" && hx.length >= 7)) return hx || "#eef1f6";
  var k = Math.max(0, Math.min(1, amt));
  var r = parseInt(hx.slice(1, 3), 16),
    g = parseInt(hx.slice(3, 5), 16),
    b = parseInt(hx.slice(5, 7), 16);
  var mk = function (c) {
    return Math.round(c + (255 - c) * k).toString(16).padStart(2, "0");
  };
  return "#" + mk(r) + mk(g) + mk(b);
}
// Пустая клетка календаря = МЯГКИЙ тон цвета привычки (David: «пустые дни должны стать мягко-
// зелёными/любой цвет, а не серыми»). Цвет на низкой альфе → еле-еле в тон; фолбэк серый.
// Стеклянное кольцо «СЕГОДНЯ» — ЕДИНОЕ внутри (календарь) и снаружи (страйп на карточке), David:
// «текущий день выделен одинаково, кольцом стекла, без плюсика». Светлый внутр. блик + тонкий контур
// + мягкая тень = вид стеклянного чекбокса; читается и на белом, и на цветной клетке.
function bosTodayRing(isDark, accent) {
  // Контур кольца окрашивается в ТОН привычки (David: «должно подстраиваться под выбранный тон, а не
  // оставаться серым»). Реальный цвет → контур в этот цвет; нейтральный (чёрный/серый/нет) → мягкий графит.
  var real = accent && accent[0] === "#" && accent.length === 7 && ("" + accent).toLowerCase() !== "#0a0a0a" && accent !== "#8E8E93";
  if (isDark) {
    var dr = real ? ", 0 0 0 1.4px " + accent + "b3" : "";
    return "inset 0 0 0 1.5px rgba(255,255,255,0.44)" + dr + ", 0 1px 2px rgba(0,0,0,0.30)";
  }
  var ring = real ? accent + "a6" : "rgba(10,10,10,0.17)";
  return "inset 0 0 0 1.5px rgba(255,255,255,0.95), 0 0 0 1.4px " + ring + ", 0 1px 2.5px rgba(0,0,0,0.10)";
}
function bosCellEmpty(accent, isDark, mul) {
  mul = mul == null ? 1 : mul; // 1=пустой день (~19-23%); <1 = слабее (будущее/соседний месяц)
  if (accent && accent[0] === "#" && accent.length === 7) {
    var a = Math.max(3, Math.round((isDark ? 0x3a : 0x30) * mul));
    return accent + ("0" + a.toString(16)).slice(-2);
  }
  return isDark ? "rgba(255,255,255," + (0.10 * mul).toFixed(3) + ")" : "rgba(0,0,0," + (0.06 * mul).toFixed(3) + ")";
}
// Glass edge for a filled tile — a soft top highlight + a faint contour, so each cell reads like the
// habit's ICON tile (David: «как у иконки — осветление сверху, переход, виден контур; не сливается,
// и не плоский серый»). Light catches the top; the contour keeps it off the background.
function bosCellGlass(isDark) {
  return isDark ? "inset 0 1px 0.5px rgba(255,255,255,0.16), inset 0 0 0 0.6px rgba(255,255,255,0.06)" : "inset 0 1px 0.5px rgba(255,255,255,0.5), inset 0 0 0 0.6px rgba(0,0,0,0.06)";
}
// Glass for the habit/goal ICON tiles — a BRIGHTER specular top + soft edge + depth than the small
// day-cell glass (David: «на главной иконке привычки стекло еле видно — чуть светлее и заметнее, и
// так ВЕЗДЕ где привычки видны»). Pair with BOS_TILE_SHEEN on the background.
function bosTileGlass(isDark) {
  return isDark ? "inset 0 1.5px 0.5px rgba(255,255,255,0.22), inset 0 0 0 0.7px rgba(255,255,255,0.07), 0 1px 2px rgba(0,0,0,0.18)" : "inset 0 1.5px 0.5px rgba(255,255,255,0.92), inset 0 0 0 0.7px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.05)";
}
var BOS_TILE_SHEEN = "linear-gradient(165deg, rgba(255,255,255,0.55), rgba(255,255,255,0.12) 46%, rgba(255,255,255,0) 72%)";
// Grey GLASS pill — the «Быстрое добавление» chip look (grey base) + a soft glass sheen + bright
// top edge. ONE source so the home hero pills and the Habits quick-add chips stay identical
// (David: стекло на пилюли + континьюити). Spread into a chip's inline style; pair with border:0.
function bosChipGlass(isDark) {
  return {
    background: BOS_TILE_SHEEN + ", " + (isDark ? "rgba(255,255,255,0.08)" : "#F1F1F5"),
    boxShadow: isDark ? "inset 0 0.5px 0.5px rgba(255,255,255,0.12), inset 0 0 0 0.5px rgba(255,255,255,0.05)" : "inset 0 1px 0.5px rgba(255,255,255,0.95), inset 0 0 0 0.5px rgba(0,0,0,0.05)"
  };
}
// Метрика цели/круга — СТАНДАРТНЫЙ iOS-выбор (нативный <select> = колесо на iPhone), чтобы единицу
// ВЫБИРАЛИ, а не печатали (David: «дай выбор маленьким стандартным ios-меню, не чтобы я сам писал»).
// Если у объекта единица не из списка (старые данные) — она добавляется первой, чтобы не потерялась.
// Единица прогресса цели/команды — ТРИ простых режима (David: «Count, Time, Custom Unit» → по-русски):
// Количество (unit="раз") / Время (unit="мин") / Своя единица (unit=свой текст). Раньше был список из 13
// — перегруз. Режим выводится из unit. ОДИН компонент → одинаково в целях и командах.
function bosUnitMode(unit) {
  var u = ("" + (unit || "")).toLowerCase().trim();
  if (u === "" || u === "раз") return "count";
  if (u === "мин" || u === "минут" || u === "ч" || u === "час" || u === "часов") return "time";
  return "custom";
}
function BosUnitSelectLive({
  value,
  onChange
}) {
  // Режим — ЛОКАЛЬНОЕ состояние (источник правды для сегментов): иначе пустой «custom» (unit="") тут же
  // прочитался бы как «count» и режим «Своя» не открылся бы. Синхронизируем с value, но пустой custom держим.
  var _s = React.useState(function () {
    return bosUnitMode(value);
  });
  var mode = _s[0],
    setMode = _s[1];
  React.useEffect(function () {
    if (!(mode === "custom" && !value)) setMode(bosUnitMode(value));
  }, [value]);
  var pick = function (m) {
    if (m === mode) return;
    setMode(m);
    onChange(m === "count" ? "раз" : m === "time" ? "мин" : bosUnitMode(value) === "custom" ? value : "");
  };
  var seg = function (m, label) {
    var on = mode === m;
    return /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "tap",
      "data-no-haptic": true,
      onClick: function () {
        pick(m);
      },
      "aria-label": label,
      style: {
        flex: 1,
        minWidth: 0,
        border: 0,
        borderRadius: 9,
        padding: "8px 4px",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        background: on ? "#fff" : "transparent",
        color: on ? "#0a0a0a" : "var(--text-3)",
        boxShadow: on ? "0 1px 3px rgba(0,0,0,0.10)" : "none",
        transition: "background 0.15s"
      }
    }, label);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4,
      background: "var(--surface-3)",
      borderRadius: 12,
      padding: 3
    }
  }, seg("count", "Количество"), seg("time", "Время"), seg("custom", "Своя")), mode === "custom" && /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: value || "",
    onChange: function (e) {
      onChange(e.target.value);
    },
    placeholder: "\u043D\u0430\u043F\u0440. \u043A\u043D\u0438\u0433, \u043A\u043C, \u0441\u0442\u0430\u043A\u0430\u043D\u043E\u0432",
    "aria-label": "\u0421\u0432\u043E\u044F \u0435\u0434\u0438\u043D\u0438\u0446\u0430",
    style: {
      width: "100%",
      boxSizing: "border-box",
      marginTop: 8,
      border: 0,
      outline: 0,
      background: "var(--surface-3)",
      borderRadius: 12,
      padding: "10px 14px",
      fontSize: 15,
      fontWeight: 600,
      color: "var(--text)"
    }
  }));
}
// Number ink for a filled day in «подробно» — contrast over the fill (white on dark hues, ink on
// light hues). Favours dark text when borderline (the top sheen lightens the centre).
function bosCellInk(hx, p, isDark) {
  if (!(hx && hx[0] === "#" && hx.length >= 7)) hx = "#0a0a0a";
  var a = (0.30 + 0.55 * Math.max(0, Math.min(1, p))) * 0.82;
  var ch = isDark ? 30 : 255;
  var r = parseInt(hx.slice(1, 3), 16),
    g = parseInt(hx.slice(3, 5), 16),
    b = parseInt(hx.slice(5, 7), 16);
  var lum = 0.299 * (r * a + ch * (1 - a)) + 0.587 * (g * a + ch * (1 - a)) + 0.114 * (b * a + ch * (1 - a));
  return lum > 170 ? "var(--text)" : "#fff";
}

/* PeopleMonthCalendar → live-only: always the REAL calendar (demo's frozen showcase date gone). */
function PeopleMonthCalendarLive({
  people = [],
  dayFrac,
  label = "Календарь",
  granular = false,
  selPerson: selProp,
  onSelPerson,
  todayTap
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
  var [compact, setCompact] = React.useState(true); // «красиво» (default, just cells) ↔ «подробно» по глазику
  var [view, setView] = React.useState("month"); // Неделя · Месяц · Год — один кружок-день в трёх масштабах (David)
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
  // «Все» (aggregate) tints in the habit's OWN colour, not a hardcoded yellow (David: «база чёрная
  // — и агрегат должен быть чёрным: полная заливка если все отметились, частичная если не все»).
  var aggColor = people[0] && people[0].color || "#0a0a0a";
  var selColor = selPerson == null ? aggColor : people[selPerson]?.color || aggColor;
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
  // Edges show the adjacent months' days as BARELY-grey discs (David: «едва серенькие выпирания
  // слева и справа — что там тоже какие-то дни») instead of empty blanks.
  var _prevDays = new Date(year, mIdx, 0).getDate();
  var _lead = Array.from({
    length: startWeekday
  }, (_, i) => ({
    adj: true,
    d: _prevDays - startWeekday + 1 + i,
    key: "p" + i
  }));
  var _main = Array.from({
    length: daysInMonth
  }, (_, i) => ({
    d: i + 1,
    key: "d" + (i + 1)
  }));
  var _used = (startWeekday + daysInMonth) % 7;
  var _trail = Array.from({
    length: _used === 0 ? 0 : 7 - _used
  }, (_, i) => ({
    adj: true,
    d: i + 1,
    key: "n" + i
  }));
  var cells = [..._lead, ..._main, ..._trail];
  var selActive = future(selDay) ? null : people.filter((_, i) => (pf(i, selDay) ?? 0) >= 0.5).length;
  var selAvg = future(selDay) ? null : Math.round((allFrac(selDay) || 0) * 100);
  var selName = selPerson != null && people[selPerson] ? people[selPerson].name : null;

  // Ripple — a wave that radiates from the tapped TODAY cell across the whole grid (David: «как в
  // Ripples — волны расходятся по квадратикам от того, на который тапнул»). Web-Animations API,
  // staggered by grid distance; auto-cleans, no React state churn.
  var gridRef = React.useRef(null);
  var weekGridRef = React.useRef(null); // «Неделя»-грядка имеет СВОЙ ref → волна расходится и здесь.
  var todayIdx = startWeekday + today - 1; // flat index of «today» within the month `cells`
  var triggerRipple = (originIdx, gridEl) => {
    var grid = gridEl || gridRef.current;
    if (!grid) return;
    var cols = 7,
      kids = grid.children;
    var or = Math.floor(originIdx / cols),
      oc = originIdx % cols;
    for (var i = 0; i < kids.length; i++) {
      var el = kids[i];
      if (!el || el.getAttribute("aria-hidden")) continue;
      var dist = Math.hypot(Math.floor(i / cols) - or, i % cols - oc);
      try {
        // Волна = не только размер, но и лёгкий БЛЕСК (осветление) проходящий по клетке (David).
        el.animate([{
          transform: "scale(1)",
          filter: "brightness(1)"
        }, {
          transform: "scale(1.18)",
          filter: "brightness(1.32)"
        }, {
          transform: "scale(1)",
          filter: "brightness(1)"
        }], {
          duration: 430,
          delay: dist * 42,
          easing: "cubic-bezier(0.22,0.9,0.3,1.2)"
        });
      } catch (_) {}
    }
  };
  // Волна работает в ОБОИХ масштабах: «Месяц» → его сетка; «Неделя» → 5-нед грядка (свой ref + индекс
  // сегодня = строка current-week). Раньше fireToday всегда бил по gridRef месяца, которого в недельном
  // виде НЕТ в DOM → в «Неделе» волны не было (David: «волна во всех видах и внутри»).
  var fireToday = () => {
    setSelDay(today);
    if (view === "week") {
      var wi = weeksData.findIndex(w => w.isToday);
      triggerRipple(wi < 0 ? 28 : wi, weekGridRef.current);
    } else triggerRipple(todayIdx, gridRef.current);
    if (todayTap && todayTap.onTap) todayTap.onTap();
  };

  // ── «Месяц · Год» — тот же кружок-день в двух масштабах (David; неделя живёт на карточке). Год =
  //    «грядка» с начала года до сегодня; месяцы СКРЫТЫ пока не нажат глазик («Подробно»).
  var MO_ABBR = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
  var yearScrollRef = React.useRef(null);
  var yearData = React.useMemo(() => {
    var jan1 = new Date(year, 0, 1);
    var wd0 = (jan1.getDay() + 6) % 7; // Mon-first offset of Jan 1
    var tot = Math.round((new Date(year, CUR_M, today) - jan1) / 86400000) + 1; // days Jan 1 → today
    var cols = Math.ceil((wd0 + tot) / 7);
    var firstCol = {},
      slots = [],
      colLabel = {};
    for (var c = 0; c < cols; c++) for (var r = 0; r < 7; r++) {
      var off = c * 7 + r - wd0;
      if (off < 0 || off >= tot) {
        slots.push(null);
        continue;
      }
      var dt = new Date(year, 0, 1 + off),
        m = dt.getMonth();
      if (firstCol[m] === undefined) {
        firstCol[m] = c;
        colLabel[c] = MO_ABBR[m];
      }
      slots.push({
        m,
        d: dt.getDate()
      });
    }
    return {
      cols,
      slots,
      colLabel
    };
  }, [year, CUR_M, today]);
  var yearPct = (m, d) => {
    if (selPerson == null) {
      var v = people.map((_, i) => dayFrac(i, d, m) || 0);
      return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
    }
    return dayFrac(selPerson, d, m) || 0;
  };
  // «Неделя» = ТЕКУЩАЯ неделя одной строкой (7 кружков Пн..Вс) — ровно как полоска на КАРТОЧКЕ,
  // континьюити карта↔деталь (David: «в недельном виде месячные кружочки» → 5×7 читалось как месяц).
  // Грядка-эффект теперь живёт ТОЛЬКО в «Месяце»/«Годе»; неделя — лаконичная строка, сегодня тап-отметка.
  var weeksData = React.useMemo(() => {
    var N = 1,
      now = new Date(year, CUR_M, today),
      dow = (now.getDay() + 6) % 7;
    var mon = new Date(now);
    mon.setDate(now.getDate() - dow);
    var out = [];
    for (var w = 0; w < N; w++) for (var c = 0; c < 7; c++) {
      var d = new Date(mon);
      d.setDate(mon.getDate() + (w - (N - 1)) * 7 + c);
      out.push({
        d: d.getDate(),
        m: d.getMonth(),
        isToday: d.getMonth() === CUR_M && d.getDate() === today && d.getFullYear() === year,
        future: d.getTime() > now.getTime()
      });
    }
    return out;
  }, [year, CUR_M, today]);
  React.useEffect(() => {
    if (view === "year" && yearScrollRef.current) yearScrollRef.current.scrollLeft = yearScrollRef.current.scrollWidth;
  }, [view]);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--card)",
      borderRadius: 22,
      padding: 14,
      boxShadow: "var(--card-shadow)",
      marginTop: label ? 12 : 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 2,
      background: chipBg,
      borderRadius: 12,
      padding: 3,
      flex: 1
    }
  }, [["week", "Неделя"], ["month", "Месяц"], ["year", "Год"]].map(([v, l]) => /*#__PURE__*/React.createElement("button", {
    key: v,
    onClick: () => setView(v),
    className: "tap",
    style: {
      flex: 1,
      border: 0,
      borderRadius: 9,
      padding: "6px 0",
      fontSize: 13,
      fontWeight: view === v ? 700 : 500,
      cursor: "pointer",
      background: view === v ? isDark ? "#fff" : "#0a0a0a" : "transparent",
      color: view === v ? isDark ? "#0a0a0a" : "#fff" : "var(--text-2)"
    }
  }, l))), /*#__PURE__*/React.createElement("button", {
    onClick: () => setCompact(c => !c),
    className: "tap",
    "aria-label": compact ? "Подробно" : "Компактно",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      background: chipBg,
      border: 0,
      borderRadius: 999,
      padding: "7px 11px",
      color: "var(--text-2)",
      fontSize: 12,
      fontWeight: 600,
      cursor: "pointer",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(I.Eye, {
    size: 14,
    color: "var(--text-3)"
  }), compact ? "Подробно" : "Компактно")), !solo && /*#__PURE__*/React.createElement("div", {
    className: "screen-scroll",
    style: {
      display: "flex",
      gap: 7,
      overflowX: "auto",
      paddingBottom: 2,
      marginBottom: 12
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
  }, /*#__PURE__*/React.createElement(BuddyFaceLive, {
    avatar: m.avatar,
    name: m.name,
    size: 18
  }), m.you ? "Ты" : (m.name || "").split(" ")[0]))), view === "week" && /*#__PURE__*/React.createElement("div", {
    ref: weekGridRef,
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(7,1fr)",
      gap: 7,
      width: "100%",
      maxWidth: 300,
      margin: "0 auto"
    }
  }, weeksData.map((wd, i) => {
    var hx = selColor && selColor[0] === "#" && selColor.length >= 7 ? selColor : "#0a0a0a";
    var itx = !!(todayTap && wd.isToday && (solo || selPerson == null || people[selPerson] && people[selPerson].you));
    var pct = wd.future ? null : itx ? todayTap.pct : yearPct(wd.m, wd.d);
    var fut = pct == null;
    var filled = !fut && pct > 0;
    var done = !fut && pct >= 1;
    var bg = fut ? bosCellEmpty(hx, isDark, 0.42) : pct <= 0 ? itx ? bosCellFill(hx, 0.14) : bosCellEmpty(hx, isDark) : bosCellFill(hx, pct);
    // Сегодня = единое стеклянное кольцо (bosTodayRing) в ТОНЕ привычки, как снаружи; без «+».
    var sh = [filled ? bosCellGlass(isDark) : "", wd.isToday ? bosTodayRing(isDark, hx) : ""].filter(Boolean).join(", ") || "none";
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      onClick: itx ? fireToday : undefined,
      className: "tap",
      style: {
        aspectRatio: "1/1",
        border: 0,
        borderRadius: "50%",
        padding: 0,
        background: bg,
        boxShadow: sh,
        cursor: itx ? "pointer" : "default",
        display: "grid",
        placeItems: "center",
        color: "#fff",
        fontWeight: 800,
        fontSize: 13
      }
    }, itx && done ? /*#__PURE__*/React.createElement(I.Check, {
      size: 15,
      strokeWidth: 3,
      color: "#fff"
    }) : null);
  })), view === "month" && !compact && /*#__PURE__*/React.createElement("div", {
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
      fontSize: 15,
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
  }))), view === "month" && !compact && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(7,1fr)",
      gap: 6,
      maxWidth: 252,
      width: "100%",
      margin: "12px auto 0"
    }
  }, weekday.map((w, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      textAlign: "center",
      fontSize: 9.5,
      fontWeight: 600,
      letterSpacing: 0.3,
      color: "var(--text-4)"
    }
  }, w))), view === "month" && /*#__PURE__*/React.createElement("div", {
    ref: gridRef,
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(7,1fr)",
      gap: 6,
      maxWidth: 252,
      width: "100%",
      margin: compact ? "0 auto" : "6px auto 0"
    }
  }, cells.map(c => {
    // Соседние месяцы (prev/next) = еле заметный ПОЛНЫЙ кружок (David: «продолжить еле заметными
    // кружочками слева и справа, чтобы месяц был ближе к ГРЯДКЕ»). Полный размер достраивает
    // прямоугольник-грядку; opacity ниже пустого дня (track) → месяц мягко «бледнеет» по краям,
    // но клетка-кружок не рвётся на точки — бесшовное продолжение бесконечной грядки.
    if (c.adj) return /*#__PURE__*/React.createElement("span", {
      key: c.key,
      "aria-hidden": true,
      style: {
        aspectRatio: "1/1",
        borderRadius: "50%",
        background: bosCellEmpty(selColor, isDark, 0.3)
      }
    });
    var isToday = isCurMonth && c.d === today;
    // TODAY is the single tap-to-mark control now (David removed the bottom button — «тапаешь
    // день, бумс»). Interactive only in YOUR view (solo / «Все» / your own chip) — never on a
    // buddy's filter — and it always shows YOUR state, since the tap marks your check-in.
    var itx = !!(todayTap && isToday && (solo || selPerson == null || people[selPerson] && people[selPerson].you));
    var pct = itx ? todayTap.pct : dayPct(c.d);
    var fut = pct == null;
    var isSel = selDay === c.d;
    var hx = selColor && selColor[0] === "#" && selColor.length >= 7 ? selColor : "#0a0a0a";
    var done = !fut && pct >= 1;
    var filled = !fut && pct > 0;
    // Empty interactive today = a faint accent wash + accent ring + «+», so it reads «tap me».
    var bg = fut ? bosCellEmpty(hx, isDark, 0.42) : pct <= 0 ? itx ? bosCellFill(hx, 0.14) : bosCellEmpty(hx, isDark) : bosCellFill(hx, pct);
    // One COHESIVE today-glyph colour (David: «цвет цифры прыгает с чёрного на белый на 4→5 —
    // бред; пусть пока копится и в конце ВСЕГДА белый; „+" пусть остаётся в цвете обводки»).
    // Filled today = ALWAYS white number/✓ (never flips) + soft shadow so it reads on any fill;
    // empty today = accent «+» (harmonises with the ring). Non-today keeps the heat-map ink.
    var ink = fut ? "var(--text-4)" : pct <= 0 ? itx ? hx : "var(--text)" : itx ? "#fff" : bosCellInk(hx, pct, isDark);
    var todayGlow = itx && filled ? "0 0.5px 1.5px rgba(0,0,0,0.55)" : "none";
    // Сегодня = единое СТЕКЛЯННОЕ кольцо (bosTodayRing) — как на внешнем страйпе (David); выбранный
    // день (не сегодня) — тонкая обводка selRing. Без accent-зелёного/серого разнобоя.
    var shadow = [filled ? bosCellGlass(isDark) : "", isToday ? bosTodayRing(isDark, hx) : !compact && isSel ? "0 0 0 1.6px " + selRing : ""].filter(Boolean).join(", ") || "none";
    var onClick = itx ? fireToday : compact ? undefined : () => setSelDay(c.d);
    return /*#__PURE__*/React.createElement("button", _extends({
      key: c.key
    }, itx ? {
      "data-no-haptic": ""
    } : {}, {
      onClick: onClick,
      className: "tap",
      style: {
        aspectRatio: "1/1",
        border: 0,
        borderRadius: "50%",
        padding: 0,
        display: "grid",
        placeItems: "center",
        fontSize: 11,
        fontWeight: isToday ? 700 : 500,
        cursor: itx || !compact ? "pointer" : "default",
        background: bg,
        boxShadow: shadow,
        color: ink,
        position: "relative"
      }
    }), itx && done ? /*#__PURE__*/React.createElement(I.Check, {
      size: 15,
      strokeWidth: 3,
      color: ink,
      style: {
        filter: todayGlow !== "none" ? "drop-shadow(0 0.5px 1px rgba(0,0,0,0.5))" : "none"
      }
    }) : !compact && !fut && /*#__PURE__*/React.createElement("span", null, c.d));
  })), view === "year" && /*#__PURE__*/React.createElement("div", {
    ref: yearScrollRef,
    className: "screen-scroll",
    style: {
      overflowX: "auto",
      paddingBottom: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: yearData.cols * 14,
      margin: "0 auto"
    }
  }, !compact && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      marginBottom: 7
    }
  }, Array.from({
    length: yearData.cols
  }, (_, c) => /*#__PURE__*/React.createElement("div", {
    key: c,
    style: {
      width: 14,
      flexShrink: 0,
      fontSize: 11,
      fontWeight: 600,
      color: "var(--text-4)",
      whiteSpace: "nowrap",
      overflow: "visible"
    }
  }, yearData.colLabel[c] || ""))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateRows: "repeat(7, 11px)",
      gridAutoFlow: "column",
      gridAutoColumns: "11px",
      gap: 3
    }
  }, yearData.slots.map((s, i) => {
    if (!s) return /*#__PURE__*/React.createElement("span", {
      key: i,
      "aria-hidden": true,
      style: {
        width: 11,
        height: 11
      }
    });
    var hx = selColor && selColor[0] === "#" && selColor.length >= 7 ? selColor : "#0a0a0a";
    var pct = yearPct(s.m, s.d);
    var filled = pct > 0;
    var isToday = s.m === CUR_M && s.d === today;
    var bg = pct <= 0 ? track : bosCellFill(hx, pct);
    // «Сегодня» = тот же нейтральный серый ободок, что в «Месяце»/«Неделе»/на карточке —
    // континьюити (David: «почему дату на годовом выделяем оранжевым — должно быть гармонично»).
    var todayRingY = isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.48)";
    var sh = [filled ? bosCellGlass(isDark) : "", isToday ? "0 0 0 1.6px " + todayRingY : ""].filter(Boolean).join(", ") || "none";
    return /*#__PURE__*/React.createElement("span", {
      key: i,
      title: (MONTHS[s.m] || "") + " " + s.d,
      style: {
        width: 11,
        height: 11,
        borderRadius: "50%",
        background: bg,
        boxShadow: sh
      }
    });
  })))), view === "month" && !compact && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      paddingTop: 12,
      borderTop: "1px solid var(--line)",
      fontSize: 12,
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
    t: "Делайте вместе",
    d: "Общие цели и привычки с друзьями тоже идут в твой опыт — и так веселее.",
    cta: "Цель вместе",
    action: () => navigate("goal-settings", {
      mode: "create",
      circleOn: true
    }),
    meta: "Вместе с друзьями",
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
      (window.bosCloud.inviteCode ? window.bosCloud.inviteCode() : window.bosCloud.uid()).then(code => {
        if (on && code) setShareUrl(typeof bosInviteLink === "function" ? bosInviteLink(code) : APP_URL + "?ref=" + code);
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
  }, "+150 XP \u0437\u0430 \u0434\u0440\u0443\u0433\u0430 \u2014 \u0438 \u0431\u043E\u043D\u0443\u0441\u044B \u043A\u0440\u0443\u0433\u0430 \u0434\u043E +3000 XP \uD83D\uDD25")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(XPRewardCard, {
    amount: 150,
    reason: "\u043A\u043E\u0433\u0434\u0430 \u0434\u0440\u0443\u0433 \u043D\u0430\u0447\u043D\u0451\u0442 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C\u0441\u044F \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435\u043C",
    dark: dark,
    circleNow: friends.length,
    circleGoal: _nextMile.n,
    circleBonus: _nextMile.bonus,
    flat: true
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
      minWidth: 0,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: C.sub,
      fontWeight: 600
    }
  }, "\u0422\u0432\u043E\u044F \u043B\u0438\u0447\u043D\u0430\u044F \u0441\u0441\u044B\u043B\u043A\u0430"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: C.text,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      marginTop: 1
    }
  }, ("" + shareUrl).replace(/^https?:\/\//, ""))), /*#__PURE__*/React.createElement("button", {
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
  }, copied ? "Скопировано ✓" : "Копировать")), /*#__PURE__*/React.createElement("button", {
    onClick: shareLink,
    className: "tap",
    style: {
      width: "100%",
      marginTop: 18,
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
/* Invite banner (live) — the «Позови друга» reward card. A LIVE fork of XPRewardCard so
   the corner gets our ORBIT motif with little MEMOJI faces «orbiting» instead of a plain
   radial wash (David: «классно бы — орбиты с лицами участников, ощущение „вместе"»). The
   shared XPRewardCard stays untouched → demo pixel-identical. */
/* ── Shared-habit BUDDY data: stale-while-revalidate cache ─────────────────────
   Avatars must appear INSTANTLY and never flash on re-entry (David: «мигания совсем не
   нравятся, аватар должен отображаться прям реально»). A module-level cache holds the last
   members[] per shareCode; a component seeds its state FROM the cache synchronously (no
   null→data pop-in), then revalidates in the background and re-renders ONLY if the data
   actually changed (no poll churn, no flicker). */
var _bosBuddyCache = {};
function _bosBuddySig(ms) {
  if (!ms) return "";
  try {
    return ms.map(function (m) {
      return m.id + ":" + (m.avatar || "") + ":" + (m.name || "") + ":" + (m.value != null ? m.value : "") + ":" + Object.keys(m.days || {}).length;
    }).join("|");
  } catch (e) {
    return "" + (ms && ms.length);
  }
}
function useBuddyMembersLive(code) {
  var st = React.useState(function () {
    return code && _bosBuddyCache[code] || null;
  });
  var members = st[0],
    setMembers = st[1];
  React.useEffect(function () {
    if (!code) {
      setMembers(null);
      return;
    }
    if (_bosBuddyCache[code]) setMembers(_bosBuddyCache[code]); // instant from cache — no flash
    if (!(window.bosCloud && window.bosCloud.enabled() && window.bosCloud.sharedHabitProgress)) return;
    var on = true;
    var load = function () {
      window.bosCloud.sharedHabitProgress(code).then(function (d) {
        if (!on || !d || !d.members) return;
        var changed = _bosBuddySig(_bosBuddyCache[code]) !== _bosBuddySig(d.members);
        _bosBuddyCache[code] = d.members;
        if (changed) setMembers(d.members); // swap ONLY when something really changed
      }).catch(function () {});
    };
    load();
    var iv = setInterval(load, 25000);
    return function () {
      on = false;
      clearInterval(iv);
    };
  }, [code]);
  return members;
}

/* Circle (team) members for a personal habit linked to a circle via teamId. Cache-backed like
   useBuddyMembersLive — instant, no flash. Powers the unified FACES marker on personal cards that
   REPLACES the old grey «Командная» бейдж (David: маркёр круга = ЛИЦА, не бейдж). */
var _bosCircleCache = {};
function useCircleMembersLive(teamId) {
  var st = React.useState(function () {
    return teamId && _bosCircleCache[teamId] || null;
  });
  var members = st[0],
    setMembers = st[1];
  React.useEffect(function () {
    if (!teamId) {
      setMembers(null);
      return;
    }
    if (_bosCircleCache[teamId]) setMembers(_bosCircleCache[teamId]); // instant from cache
    if (!(window.bosCloud && window.bosCloud.enabled() && window.bosCloud.teamMembers)) return;
    var on = true;
    var sig = function (a) {
      return (a || []).map(function (m) {
        return (m.id || "") + ":" + (m.avatar || "") + ":" + (m.name || "");
      }).join("|");
    };
    var load = function () {
      window.bosCloud.teamMembers(teamId).then(function (mem) {
        if (!on || !Array.isArray(mem)) return;
        var changed = sig(_bosCircleCache[teamId]) !== sig(mem);
        _bosCircleCache[teamId] = mem;
        if (changed) setMembers(mem); // swap only on real change
      }).catch(function () {});
    };
    load();
    var iv = setInterval(load, 25000);
    return function () {
      on = false;
      clearInterval(iv);
    };
  }, [teamId]);
  return members;
}
// My uid (module-cached) so circle faces show the OTHER people you share with — solo circle → no
// others → no faces (honest «пока один», как у привычек-вместе), не серый бейдж.
var _bosMyUidCache = null;
function CircleFacesLive({
  habit,
  size,
  max
}) {
  size = size || 22;
  max = max || 5;
  var teamId = habit && habit.teamId;
  var members = useCircleMembersLive(teamId);
  var uidSt = React.useState(_bosMyUidCache);
  var myUid = uidSt[0],
    setMyUid = uidSt[1];
  React.useEffect(function () {
    if (myUid != null) return;
    if (window.bosCloud && window.bosCloud.enabled() && window.bosCloud.uid) {
      window.bosCloud.uid().then(function (u) {
        if (u) {
          _bosMyUidCache = u;
          setMyUid(u);
        }
      }).catch(function () {});
    }
  }, []);
  if (!teamId) return null;
  var others = (members || []).filter(function (m) {
    return !myUid || m.id !== myUid;
  });
  if (!others.length) return null;
  return React.createElement(PeopleStackLive, {
    people: others,
    size: size,
    max: max
  });
}

/* The ONE live avatar chip — a person's chosen avatar on a STANDARDISED soft-grey disc, so faces
   read cleanly and never blend into white cards (David: «на сероватом фоне классно, на белом
   сливаются — стандартизируй на сером»). We show ONLY what the person picked — emoji or memoji
   photo; base users (no custom avatar) get the clean grey disc. No mood/state tint at this level —
   simple, consistent, beautiful everywhere. (`name` kept for call-site compatibility.) */
function BuddyFaceLive({
  avatar,
  name,
  size
}) {
  size = size || 24;
  var a = "" + (avatar || "");
  var disc = {
    width: size,
    height: size,
    borderRadius: "50%",
    flexShrink: 0,
    background: "linear-gradient(150deg, #eef1f6, #dadfe7)",
    boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.07)"
  };
  if (/^m\d+$/.test(a)) return /*#__PURE__*/React.createElement("div", {
    style: Object.assign({}, disc, {
      background: "url(./assets/people/" + a + ".png) center/cover no-repeat, linear-gradient(150deg,#eef1f6,#dadfe7)",
      boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.10)"
    })
  });
  if (a.indexOf("emoji:") === 0) return /*#__PURE__*/React.createElement("div", {
    style: Object.assign({}, disc, {
      display: "grid",
      placeItems: "center",
      fontSize: Math.round(size * 0.54),
      lineHeight: 1
    })
  }, a.slice(6));
  // No custom avatar → the person's first initial on the SAME grey disc, so it's never a blank
  // circle (David: «густой серый кружочек неприкольно — пиши первый инициал ника»). A real avatar
  // always wins above; this is only the fallback. Muted slate ink, one letter — NOT colourful.
  var initial = ("" + (name || "")).trim().charAt(0).toUpperCase();
  if (!initial) return /*#__PURE__*/React.createElement("div", {
    style: disc
  });
  return /*#__PURE__*/React.createElement("div", {
    style: Object.assign({}, disc, {
      display: "grid",
      placeItems: "center",
      color: "#5b6473",
      fontWeight: 600,
      fontSize: Math.round(size * 0.44),
      letterSpacing: "-0.2px",
      lineHeight: 1,
      fontFamily: "-apple-system, system-ui, sans-serif"
    })
  }, initial);
}
function HabitInviteBannerLive({
  amount = 75,
  habit
}) {
  var ink = "#0a0a0a",
    inkSub = "rgba(0,0,0,0.62)";
  // Plain gold banner — orbits/memoji removed (David: «орбиты убрать, оставить просто золотые баннеры»).
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      overflow: "hidden",
      borderRadius: 22,
      padding: "16px 17px",
      background: "linear-gradient(135deg, #FEDE34, #EF9F14)",
      color: ink,
      boxShadow: "0 12px 30px rgba(254,222,52,0.34)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      display: "flex",
      alignItems: "center",
      gap: 13
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 46,
      height: 46,
      borderRadius: 14,
      background: "rgba(255,255,255,0.6)",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(I.Sparkles, {
    size: 23,
    color: ink
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 33,
      fontWeight: 800,
      letterSpacing: "-1.2px",
      lineHeight: 1
    }
  }, "+", /*#__PURE__*/React.createElement(CountUp, {
    value: amount
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 17,
      fontWeight: 800,
      letterSpacing: "-0.3px"
    }
  }, "XP")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: inkSub,
      marginTop: 3,
      lineHeight: 1.35
    }
  }, "\u043A\u043E\u0433\u0434\u0430 \u0434\u0440\u0443\u0433 \u043F\u0440\u0438\u0441\u043E\u0435\u0434\u0438\u043D\u0438\u0442\u0441\u044F \u043A \u044D\u0442\u043E\u0439 \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0435"))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      marginTop: 13,
      paddingTop: 12,
      borderTop: "1px solid rgba(0,0,0,0.10)",
      fontSize: 12,
      color: inkSub,
      lineHeight: 1.4
    }
  }, "\u0410 \u043A\u043E\u0433\u0434\u0430 \u0432\u0435\u0434\u0451\u0442\u0435 \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0443 \u0432\u043C\u0435\u0441\u0442\u0435 \u2014 \u043A\u0430\u0436\u0434\u0430\u044F \u043E\u0442\u043C\u0435\u0442\u043A\u0430 \u043F\u0440\u0438\u043D\u043E\u0441\u0438\u0442 ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: ink
    }
  }, "+15 XP"), " \u0432\u043C\u0435\u0441\u0442\u043E +10."));
}

/* Welcome modal shown when you open an invite LINK and land in a shared habit / team — so the
   join is never silent (David: «человек не понимает, что его позвали»). Rendered at app root
   from app.pendingJoinWelcome (mirrors AchievementUnlock). Spring-in glass card. LIVE only. */
function JoinWelcomeLive({
  info,
  onClose
}) {
  var [open, setOpen] = React.useState(false);
  var closingRef = React.useRef(false);
  React.useEffect(() => {
    var t = window.setTimeout(() => setOpen(true), 10);
    return () => window.clearTimeout(t);
  }, []);
  if (!info) return null;
  var isDark = !!(typeof document !== "undefined" && document.querySelector(".bos-page.theme-dark"));
  var isTeam = info.kind === "team";
  var inviter = (info.inviterName || "").trim();
  var close = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    setOpen(false);
    window.setTimeout(() => {
      try {
        onClose && onClose();
      } catch (e) {}
    }, 340);
  };
  // Standardized GREY glass tile — never the habit's random colour (David: «серенькая, с эффектом
  // стекла, никакой отсебятины»). The inviter's STANDARD avatar (real photo or initial) rides the
  // corner — one «вы вдвоём на привычке» scene, not an avatar-stacked-over-a-square.
  var tileInk = isDark ? "#e8e8ea" : "#3a3a3e";
  var tileBg = isDark ? "linear-gradient(165deg,#3a3a3e,#2a2a2e)" : "linear-gradient(165deg,#f1f1f4,#e1e1e6)";
  var glyph = typeof bosIcon === "function" ? bosIcon(info.emoji || (isTeam ? "✨" : "🌿"), 38, tileInk) : info.emoji || "✨";
  return /*#__PURE__*/React.createElement(BottomSheet, {
    open: open,
    onClose: close,
    dark: isDark
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "2px 22px 26px",
      textAlign: "center",
      color: "var(--text)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center",
      marginBottom: 2
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: 76,
      height: 76
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 76,
      height: 76,
      borderRadius: 21,
      background: BOS_TILE_SHEEN + ", " + tileBg,
      boxShadow: typeof bosTileGlass === "function" ? bosTileGlass(isDark) : "0 6px 16px rgba(0,0,0,0.10)",
      display: "grid",
      placeItems: "center",
      fontSize: 37
    }
  }, glyph), !isTeam && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      right: -8,
      bottom: -6,
      borderRadius: "50%",
      boxShadow: "0 0 0 3px var(--card, #fff)"
    }
  }, /*#__PURE__*/React.createElement(BuddyFaceLive, {
    avatar: info.inviterAvatar || "default",
    name: inviter,
    size: 34
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1.4,
      fontWeight: 700,
      marginTop: 14
    }
  }, isTeam ? "Команда" : "Совместная привычка"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 23,
      fontWeight: 800,
      letterSpacing: "-0.5px",
      color: "var(--text)",
      marginTop: 3
    }
  }, info.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: "var(--text-3)",
      marginTop: 8,
      lineHeight: 1.5,
      padding: "0 6px",
      textWrap: "balance"
    }
  }, isTeam ? (inviter ? inviter + " зовёт в команду" : "Тебя позвали в команду") + " — ведите цели вместе, виден прогресс каждого." : (inviter ? inviter + " зовёт вести вместе" : "Тебя позвали вести вместе") + " — будете видеть отметки друг друга и держать ритм."), !isTeam && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 13,
      background: isDark ? "rgba(255,255,255,0.06)" : "#f4f4f6",
      borderRadius: 17,
      padding: "13px 15px",
      marginTop: 18,
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 42,
      height: 42,
      borderRadius: 13,
      background: "linear-gradient(135deg,#FEDE34,#EF9F14)",
      display: "grid",
      placeItems: "center",
      flexShrink: 0,
      boxShadow: "0 5px 13px rgba(239,159,20,0.34), inset 0 1px 0.5px rgba(255,255,255,0.6)"
    }
  }, /*#__PURE__*/React.createElement(I.Bolt, {
    size: 22,
    color: "#fff",
    filled: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: "var(--text)",
      letterSpacing: "-0.2px"
    }
  }, "+15 XP \u0437\u0430 \u043A\u0430\u0436\u0434\u0443\u044E \u0441\u043E\u0432\u043C\u0435\u0441\u0442\u043D\u0443\u044E \u043E\u0442\u043C\u0435\u0442\u043A\u0443"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-4)",
      marginTop: 2
    }
  }, "\u0432\u043C\u0435\u0441\u0442\u043E +10, \u043A\u043E\u0433\u0434\u0430 \u0432\u0435\u0434\u0451\u0448\u044C \u043E\u0434\u0438\u043D"))), /*#__PURE__*/React.createElement("button", {
    onClick: close,
    className: "bos-btn",
    style: {
      marginTop: 20
    }
  }, isTeam ? "Отлично!" : "Веду вместе!")));
}

/* Achievement celebration — the gold «достижение открыто» moment as our STANDARD iOS sheet
   (David: «достижения делаешь не в нашем стиле который поп-ап — лучше в iOS-шторку»). Was a
   centered popup (demo AchievementUnlock); now slides up over a dimmed backdrop with a grabber,
   swipe-down to dismiss — the SAME BottomSheet idiom as JoinWelcomeLive. Rendered at app root
   from app.pendingAch. LIVE. */
function AchievementSheetLive({
  ach,
  onClose
}) {
  var [open, setOpen] = React.useState(false);
  var closingRef = React.useRef(false);
  React.useEffect(() => {
    var t = window.setTimeout(() => setOpen(true), 10);
    return () => window.clearTimeout(t);
  }, []);
  if (!ach) return null;
  var isDark = !!(typeof document !== "undefined" && document.querySelector(".bos-page.theme-dark"));
  var accent = "#FEDE34";
  var close = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    setOpen(false);
    window.setTimeout(() => {
      try {
        onClose && onClose();
      } catch (e) {}
    }, 340);
  };
  return /*#__PURE__*/React.createElement(BottomSheet, {
    open: open,
    onClose: close,
    dark: isDark
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "8px 24px 26px",
      textAlign: "center",
      color: "var(--text)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 90,
      height: 90,
      borderRadius: 24,
      background: "linear-gradient(158deg, #FFDC4A 0%, #F4A81E 100%)",
      display: "grid",
      placeItems: "center",
      fontSize: 46,
      boxShadow: "inset 0 2px 1px rgba(255,255,255,0.65), inset 0 0 0 0.7px rgba(180,120,0,0.28), 0 8px 18px rgba(0,0,0,0.13)",
      animation: "achEmblem 0.55s cubic-bezier(0.34,1.56,0.64,1) 0.08s both"
    }
  }, bosIcon(ach.i, 46, null))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "#C98A00",
      textTransform: "uppercase",
      letterSpacing: 1.8,
      fontWeight: 800,
      marginTop: 20
    }
  }, "\u0414\u043E\u0441\u0442\u0438\u0436\u0435\u043D\u0438\u0435 \u043E\u0442\u043A\u0440\u044B\u0442\u043E"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 26,
      fontWeight: 800,
      letterSpacing: "-0.6px",
      color: "var(--text)",
      marginTop: 6,
      lineHeight: 1.1
    }
  }, ach.t), ach.d && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      color: "var(--text-3)",
      lineHeight: 1.5,
      maxWidth: 270,
      margin: "10px auto 0",
      textWrap: "balance"
    }
  }, ach.d), ach.xp ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-block",
      marginTop: 20,
      background: "linear-gradient(180deg,#FEDE34,#EF9F14)",
      color: "#4a3800",
      fontWeight: 800,
      fontSize: 14.5,
      borderRadius: 999,
      padding: "8px 18px"
    }
  }, "+", ach.xp, " XP") : null, /*#__PURE__*/React.createElement("button", {
    onClick: close,
    className: "bos-btn",
    style: {
      marginTop: 22
    }
  }, "\u041A\u043B\u0430\u0441\u0441!")));
}

/* Деталь достижения из СПИСКА (тап по медали) — тот же стиль, что у шторки-открытия: ЗОЛОТОЙ
   квадрат-тайл (или серый-замок, если ещё закрыто), БЕЗ свечения, аккуратный текст. Рендерится
   через openSheet (шторка-чрома снаружи). Заменяет прежний текстовый InfoSheet. LIVE. */
function AchievementDetailSheetLive({
  ach,
  dark
}) {
  var sheet = typeof useSheet === "function" ? useSheet() : null;
  var close = () => {
    try {
      if (sheet && sheet.close) sheet.close();
    } catch (e) {}
  };
  if (!ach) return null;
  var earned = !!ach.earned;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "8px 24px 22px",
      textAlign: "center",
      color: "var(--text)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 84,
      height: 84,
      borderRadius: 22,
      position: "relative",
      display: "grid",
      placeItems: "center",
      fontSize: 42,
      background: earned ? "linear-gradient(158deg, #FFDC4A 0%, #F4A81E 100%)" : "var(--card-2)",
      boxShadow: earned ? "inset 0 2px 1px rgba(255,255,255,0.65), inset 0 0 0 0.7px rgba(180,120,0,0.28), 0 8px 18px rgba(0,0,0,0.13)" : "inset 0 0 0 1px var(--line)",
      filter: earned ? "none" : "grayscale(1)",
      opacity: earned ? 1 : 0.55
    }
  }, bosIcon(ach.i, 42, null), !earned && /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      right: -3,
      bottom: -3,
      width: 24,
      height: 24,
      borderRadius: "50%",
      background: "var(--card)",
      boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
      display: "grid",
      placeItems: "center",
      fontSize: 12
    }
  }, "\uD83D\uDD12"))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: earned ? "#C98A00" : "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1.8,
      fontWeight: 800,
      marginTop: 18
    }
  }, earned ? "Достижение открыто" : "Ещё закрыто"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 24,
      fontWeight: 800,
      letterSpacing: "-0.5px",
      marginTop: 6,
      lineHeight: 1.1,
      color: "var(--text)"
    }
  }, ach.t), ach.d && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      color: "var(--text-3)",
      lineHeight: 1.5,
      maxWidth: 280,
      margin: "10px auto 0",
      textWrap: "balance"
    }
  }, ach.d), !earned && ach.how && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: "var(--text-4)",
      lineHeight: 1.45,
      maxWidth: 280,
      margin: "9px auto 0",
      textWrap: "balance"
    }
  }, "\u041A\u0430\u043A \u043E\u0442\u043A\u0440\u044B\u0442\u044C: ", ach.how), ach.xp ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-block",
      marginTop: 18,
      background: earned ? "linear-gradient(180deg,#FEDE34,#EF9F14)" : "var(--card-2)",
      color: earned ? "#4a3800" : "var(--text-3)",
      fontWeight: 800,
      fontSize: 14,
      borderRadius: 999,
      padding: "7px 16px"
    }
  }, "+", ach.xp, " XP") : null, /*#__PURE__*/React.createElement("button", {
    onClick: close,
    className: "bos-btn",
    style: {
      marginTop: 20
    }
  }, "\u0413\u043E\u0442\u043E\u0432\u043E"));
}

/* Stage-2 dedup (David): нажал «Вести у себя», а такая привычка уже есть → спросить — ПРИВЯЗАТЬ
   существующую (без дубля, серия/время сохранятся) или завести отдельную для команды. LIVE. */
function TeamAdoptChoiceLive({
  dupeName,
  onLink,
  onCreate
}) {
  var {
    close
  } = useSheet();
  var go = fn => {
    try {
      fn && fn();
    } catch (e) {}
    if (window.tgHaptic) {
      try {
        window.tgHaptic("success");
      } catch (_) {}
    }
    close();
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "2px 22px 14px",
      color: "var(--text)",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 800,
      letterSpacing: "-0.3px"
    }
  }, "\u0423 \u0442\u0435\u0431\u044F \u0443\u0436\u0435 \u0435\u0441\u0442\u044C \u0442\u0430\u043A\u0430\u044F"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: "var(--text-3)",
      marginTop: 7,
      lineHeight: 1.5,
      textWrap: "balance"
    }
  }, "\xAB", dupeName, "\xBB \u0443\u0436\u0435 \u0432 \u0442\u0432\u043E\u0438\u0445 \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0430\u0445. \u041F\u0440\u0438\u0432\u044F\u0437\u0430\u0442\u044C \u0435\u0451 \u043A \u043A\u043E\u043C\u0430\u043D\u0434\u0435 \u2014 \u0441\u0435\u0440\u0438\u044F \u0438 \u0442\u0432\u043E\u0451 \u0432\u0440\u0435\u043C\u044F \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u0442\u0441\u044F. \u0418\u043B\u0438 \u0437\u0430\u0432\u0435\u0441\u0442\u0438 \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u0443\u044E \u0434\u043B\u044F \u043A\u043E\u043C\u0430\u043D\u0434\u044B."), /*#__PURE__*/React.createElement("button", {
    className: "bos-btn",
    style: {
      marginTop: 18
    },
    onClick: () => go(onLink)
  }, "\u041F\u0440\u0438\u0432\u044F\u0437\u0430\u0442\u044C \xAB", dupeName, "\xBB"), /*#__PURE__*/React.createElement("button", {
    className: "tap",
    onClick: () => go(onCreate),
    style: {
      width: "100%",
      marginTop: 6,
      background: "transparent",
      border: 0,
      color: "var(--text-3)",
      padding: 13,
      fontSize: 14.5,
      fontWeight: 600,
      cursor: "pointer"
    }
  }, "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043D\u043E\u0432\u0443\u044E \u0434\u043B\u044F \u043A\u043E\u043C\u0430\u043D\u0434\u044B"));
}

/* Real shared-habit buddies (cloud) for the habit CARDS — fills the side slot with the ACTUAL
   people you share the habit with (their real avatars), replacing the legacy empty h.friends.
   Falls back to h.friends only for a local (no-shareCode) habit. LIVE only. */
// Overlapping stack of REAL buddy faces with a graceful overflow: show up to `max` people, then a
// matching «+N» disc for everyone who didn't fit (David: «не 23 кружка — до пяти, потом +N»). 5
// reads cleanly on the compact cards; 10+ crowds them.
/* Generic overlapping people stack — faces (BuddyFaceLive) + a matching «+N» overflow disc, driven
   by a people array. ONE circle-of-people logic shared by multiplayer habits AND teams (David:
   «кружочки людей как в мультиплеере — то же самое в командах, по единой логике»). */
function PeopleStackLive({
  people = [],
  size = 24,
  max = 5
}) {
  var list = (people || []).filter(Boolean);
  if (!list.length) return null;
  var shown = list.slice(0, max),
    extra = list.length - shown.length;
  var ov = Math.round(size * 0.32); // overlap proportional to size
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center"
    },
    "aria-hidden": true
  }, shown.map((m, i) => /*#__PURE__*/React.createElement("span", {
    key: m.id != null ? m.id : i,
    style: {
      marginLeft: i ? -ov : 0,
      borderRadius: "50%",
      boxShadow: "0 0 0 2px var(--card, #fff)",
      display: "block"
    }
  }, /*#__PURE__*/React.createElement(BuddyFaceLive, {
    avatar: m.avatar,
    name: m.name,
    size: size
  }))), extra > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: -ov,
      width: size,
      height: size,
      borderRadius: "50%",
      background: "rgba(0,0,0,0.58)",
      color: "#fff",
      fontSize: Math.round(size * 0.4),
      fontWeight: 700,
      letterSpacing: "-0.5px",
      display: "grid",
      placeItems: "center",
      boxShadow: "0 0 0 2px var(--card, #fff)"
    }
  }, "+", extra));
}

// ── ЦЕЛЬ, НАПОЛНЯЕМАЯ ПРИВЫЧКАМИ ────────────────────────────────────────────
// Единый движок прогресса цели (David: «цель раскладывается на привычки, ведёшь их → растёт цель»,
// как в командной цели). Если к цели привязаны привычки (goal.habitIds) — кольцо НАПОЛНЯЕТСЯ их
// отметками (сумма = общий счёт, зеркало collective-режима команды), считается ЛОКАЛЬНО из h.log →
// работает офлайн. Нет привязки → падаем на ручной goal.current (старые «голые» цели живут как раньше).
function bosGoalMarks(h) {
  try {
    return h && h.log ? Object.keys(h.log).length : 0;
  } catch (e) {
    return 0;
  }
}
function bosGoalProgress(goal, habits) {
  var target = goal && goal.target || 0;
  var ids = goal && goal.habitIds || [];
  var linked = ids.length ? (habits || []).filter(function (h) {
    return ids.indexOf(h.id) >= 0;
  }) : [];
  var fromHabits = linked.length > 0;
  var raw = fromHabits ? linked.reduce(function (a, h) {
    return a + bosGoalMarks(h);
  }, 0) : goal && goal.current || 0;
  var current = target > 0 ? Math.min(raw, target) : raw; // кольцо не переполняем
  var pct = target > 0 ? Math.min(1, current / target) : 0;
  return {
    current: current,
    target: target,
    pct: pct,
    done: target > 0 && current >= target,
    fromHabits: fromHabits,
    linked: linked
  };
}

// ПРЕВРАЩЕНИЕ ЦЕЛИ В КРУГ «НА МЕСТЕ» (David: «тумблер соло↔вместе на той же цели, без пересоздания»).
// Цель СТАНОВИТСЯ кругом, ПЕРЕНОСЯ всё: имя/значок/цель/срок + СВОИ ПРИВЫЧКИ (они уходят в круг как
// командные, а личные копии линкуются teamId/teamHabitId → отметка у себя миррорится в командный счёт,
// тот же механизм, что у команд тренера). Переиспользует проверенный путь createTeam/addTeamHabit.
// goalLike = { id, name, emoji, color, target, unit, deadline, habitIds, challenge }. opts = { navigate,
// from, onShare(team) }. Локально работает офлайн (addTeam кладёт привычки в t.habits); облако — если включено.
function bosPromoteGoalToCircle(app, goalLike, opts) {
  opts = opts || {};
  if (!app || !goalLike) return null;
  var vis = opts.vis || "private",
    type = opts.type || "collective",
    stake = Math.max(0, opts.stake || 0);
  var linked = (app.habits || []).filter(function (h) {
    return (goalLike.habitIds || []).indexOf(h.id) >= 0;
  });
  var teamObj = {
    name: goalLike.name || "Цель",
    emblem: goalLike.emoji || "🎯",
    accent: goalLike.color || BOS_GREY,
    vis: vis,
    goal: (goalLike.target || 0) + " " + (goalLike.unit || ""),
    type: type,
    target: goalLike.target || 0,
    current: 0,
    unit: goalLike.unit || "",
    stake: stake,
    date: goalLike.deadline || "Этот месяц",
    progress: 0,
    members: [],
    habits: linked.map(function (h, i) {
      return {
        name: h.name,
        emoji: h.emoji,
        isMain: i === 0
      };
    })
  };
  if (goalLike.challenge) teamObj.challenge = goalLike.challenge;
  var nt = app.addTeam(teamObj);
  // Личные привычки цели теперь принадлежат кругу: teamId связывает, goalOnly снимаем (пусть видно),
  // goalId чистим (цели больше нет). teamHabitId долетит из облака (миррор отметок в командный лог).
  linked.forEach(function (h) {
    app.updateHabit(h.id, {
      teamId: nt._id,
      goalId: null,
      goalOnly: false
    });
  });
  if (goalLike.id != null && app.removeGoal) app.removeGoal(goalLike.id); // цель → круг (не остаётся дублем)
  if (opts.navigate) opts.navigate("team-detail", {
    team: nt,
    from: opts.from || "habits"
  });
  (async function () {
    try {
      if (window.bosCloud && window.bosCloud.enabled()) {
        var row = await window.bosCloud.createTeam({
          name: nt.name,
          emblem: teamObj.emblem,
          vis: vis,
          goalKind: nt.goal,
          goalTarget: nt.target,
          goal: {
            type: type,
            target: nt.target,
            unit: nt.unit,
            title: nt.name,
            stake: stake
          }
        });
        if (row && row.id) {
          if (app.updateTeam) app.updateTeam(nt._id, {
            cloudId: row.id
          });
          for (var i = 0; i < linked.length; i++) {
            var th = await window.bosCloud.addTeamHabit(row.id, {
              name: linked[i].name,
              emoji: linked[i].emoji,
              isMain: i === 0,
              goalPerDay: linked[i].goalPerDay
            });
            if (th && th.id && app.updateHabit) app.updateHabit(linked[i].id, {
              teamId: row.id,
              teamHabitId: th.id
            });
          }
          if (opts.onShare) opts.onShare(Object.assign({}, nt, {
            cloudId: row.id
          }));
          return;
        }
      }
    } catch (e) {}
    // офлайн/превью → круг живёт локально, шторка приглашения всё равно. setTimeout — чтобы открыться
    // ПОСЛЕ возможного close() подтверждающей шторки (иначе синхронный onShare закрылся бы сразу).
    if (opts.onShare) setTimeout(function () {
      opts.onShare(nt);
    }, 0);
  })();
  return nt;
}

// МИНИ-ОРБИТА для карточки цели/круга (David: «превью — вокруг чего цель, а не просто смайлик;
// орбиты наполняются привычками и людьми»). Центр = значок цели, вокруг — её привычки (эмодзи) на
// внутреннем кольце и люди (лица) на внешнем. МЕДЛЕННО КРУТИТСЯ (David передумал «пусть статично» →
// «не крутятся»): CSS bosSpin/bosSpinR, кольца в разные стороны, диски counter-rotate = прямые.
// Дёшево (только transform, GPU). habits=[{emoji,color}], people=[{avatar,name}].
function GoalOrbitMini({
  centerEmoji,
  centerColor,
  habits = [],
  people = [],
  size = 128,
  dark = false,
  fade = false
}) {
  var C = size / 2;
  var cR = Math.round(size * 0.19); // центр-диск (радиус)
  var r1 = size * 0.315,
    r2 = size * 0.455; // радиусы колец (привычки / люди)
  var hbAll = (habits || []).filter(Boolean),
    ppAll = (people || []).filter(Boolean);
  var ringLine = dark ? "rgba(255,255,255,0.13)" : "rgba(10,10,10,0.09)";
  var accent = centerColor || (dark ? "#fff" : "#0a0a0a");
  var ring = function (R) {
    return /*#__PURE__*/React.createElement("span", {
      "aria-hidden": true,
      style: {
        position: "absolute",
        left: C - R,
        top: C - R,
        width: R * 2,
        height: R * 2,
        borderRadius: "50%",
        border: "1px solid " + ringLine
      }
    });
  };
  var place = function (items, R, sz, off, render, spin) {
    return items.map(function (it, i) {
      var ang = i / Math.max(1, items.length) * Math.PI * 2 - Math.PI / 2 + off;
      var x = C + Math.cos(ang) * R,
        y = C + Math.sin(ang) * R;
      return /*#__PURE__*/React.createElement("span", {
        key: i,
        style: {
          position: "absolute",
          left: Math.round(x - sz / 2),
          top: Math.round(y - sz / 2),
          width: sz,
          height: sz,
          animation: spin || undefined
        }
      }, render(it));
    });
  };
  var hSz = Math.max(16, Math.round(size * 0.16));
  var pSz = Math.max(16, Math.round(size * 0.155));
  // МУЛЬТИ-КОЛЬЦА: колец СТОЛЬКО, сколько нужно реальному числу элементов (David: «количество колец
  // реальное; 10 привычек → 3-4 кольца, не 2»). Привычки заполняют кольца от центра наружу, люди — на
  // кольцах дальше. Каждое кольцо вмещает сколько влезает по окружности; ВНЕШНИЕ кольца выходят за бокс —
  // их просто обрежет карточка (overflow:hidden). Размер/шаг колец НЕ меняем (David: «размер устраивает»).
  var ringStep = size * 0.14,
    r0 = size * 0.315;
  var buildRings = function (items, startK, dSz) {
    var out = [],
      k = startK,
      idx = 0;
    while (idx < items.length && k < 9) {
      var R = r0 + k * ringStep;
      var cap = Math.max(1, Math.floor(2 * Math.PI * R / (dSz * 3.0))); // разреженно (David: 4→1 кольцо, 10→3-4 кольца)
      out.push({
        R: R,
        k: k,
        items: items.slice(idx, idx + cap)
      });
      idx += cap;
      k++;
    }
    return {
      rings: out,
      nextK: k
    };
  };
  var hRings = buildRings(hbAll, 0, hSz);
  var pRings = buildRings(ppAll, hRings.nextK, pSz);
  // РАЗМЕР эмодзи задаём ЯВНО через fontSize на диске: bosIcon для эмодзи (не sf-символов) игнорит
  // size и возвращает голую строку → иначе эмодзи наследует крупный шрифт карточки и ВЫЛЕЗАЕТ за
  // кружок (баг David). Для sf-символов bosIcon отдаёт SVG нужного размера — fontSize им не мешает.
  var hIcon = Math.round(hSz * 0.52),
    cIcon = Math.round(cR * 0.96); // David: иконки чуть меньше кружков — больше «воздуха» вокруг
  // ЕДИНЫЙ серый глянцевый диск — тот же язык, что у OrbitField на «Я»/настройках (#eef1f6→#dadfe7 +
  // BOS_TILE_SHEEN). David: «кружочки должны быть стандартизированы как на странице настроек», без
  // разнобоя (то цветной-прозрачный, то белый). И привычки, и центр = один диск.
  var sheen = typeof BOS_TILE_SHEEN !== "undefined" ? BOS_TILE_SHEEN + ", " : "";
  var discBg = sheen + (dark ? "linear-gradient(160deg, #464c58, #30353f)" : "linear-gradient(160deg, #eef1f6, #dadfe7)");
  var discShadow = typeof bosTileGlass === "function" ? bosTileGlass(dark) : "0 1px 3px rgba(0,0,0,0.12)";
  // Центр = ПОДЛОЖКА ИКОНКИ ЦЕЛИ → красится в НАСЫЩЕННЫЙ тон цвета цели (David: «цвет должен влиять на
  // подложку иконки цели»). Реальный цвет → тон + белый глиф; нейтральный → тот же серый диск. Привычки/
  // люди на кольцах остаются серыми (они не цель).
  var cReal = typeof centerColor === "string" && centerColor[0] === "#" && centerColor.length === 7 && centerColor.toLowerCase() !== "#0a0a0a" && centerColor !== BOS_GREY;
  var centerBg = cReal ? sheen + (typeof bosLightenHex === "function" ? bosLightenHex(centerColor, 0.25) : centerColor) : discBg;
  var centerInk = cReal ? "#fff" : null;
  // ОРБИТА КРУТИТСЯ: соседние кольца — в РАЗНЫЕ стороны, внешние медленнее (спокойно). Диски
  // counter-rotate на ту же длительность → эмодзи/лица стоят прямо. bosSpin/bosSpinR — keyframes
  // (mobile.css). БЕЗ radial-маски: лишнее просто обрезается карточкой (David: «просто обрезалось»).
  var renderRing = function (R, k, items, dSz, iconSz, isPeople) {
    var cw = k % 2 === 0,
      dir = cw ? "bosSpin" : "bosSpinR",
      rev = cw ? "bosSpinR" : "bosSpin",
      dur = 34 + k * 7 + "s";
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: (isPeople ? "p" : "h") + k
    }, ring(R), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        inset: 0,
        animation: dir + " " + dur + " linear infinite",
        willChange: "transform"
      }
    }, place(items, R, dSz, k * 0.35, function (it) {
      return isPeople ? /*#__PURE__*/React.createElement("span", {
        style: {
          display: "block",
          borderRadius: "50%"
        }
      }, typeof BuddyFaceLive === "function" ? /*#__PURE__*/React.createElement(BuddyFaceLive, {
        avatar: it.avatar,
        name: it.name,
        size: dSz
      }) : null) : /*#__PURE__*/React.createElement("span", {
        style: {
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          background: discBg,
          boxShadow: discShadow,
          display: "grid",
          placeItems: "center",
          fontSize: iconSz,
          lineHeight: 1
        }
      }, typeof bosIcon === "function" ? bosIcon(it.emoji, iconSz, null) : it.emoji || "✨");
    }, rev + " " + dur + " linear infinite")));
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: size,
      height: size,
      flexShrink: 0
    },
    "aria-hidden": true
  }, hRings.rings.map(function (rg) {
    return renderRing(rg.R, rg.k, rg.items, hSz, hIcon, false);
  }), pRings.rings.map(function (rg) {
    return renderRing(rg.R, rg.k, rg.items, pSz, hIcon, true);
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      left: C - cR,
      top: C - cR,
      width: cR * 2,
      height: cR * 2,
      borderRadius: "50%",
      background: centerBg,
      boxShadow: discShadow,
      display: "grid",
      placeItems: "center",
      fontSize: cIcon,
      lineHeight: 1
    }
  }, typeof bosIcon === "function" ? bosIcon(centerEmoji || "🎯", cIcon, centerInk) : centerEmoji || "🎯"));
}

// Shared-habit buddies for the habit CARDS — real cloud members (no legacy h.friends letter-avatars,
// those were fake seed personas). Delegates to PeopleStackLive so cards + teams share one logic.
function HabitBuddyAvatarsLive({
  habit,
  size = 22,
  max = 5
}) {
  var code = habit && habit.shareCode;
  var members = useBuddyMembersLive(code); // cache-backed → instant, no flash on re-entry
  if (!code) return null;
  var others = (members || []).filter(m => !m.me);
  if (!others.length) return null;
  return /*#__PURE__*/React.createElement(PeopleStackLive, {
    people: others,
    size: size,
    max: max
  });
}
function ShareHabitSheetLive({
  habit,
  dark = false
}) {
  var {
    close
  } = useSheet();
  var app = typeof useApp === "function" ? useApp() : null;
  var APP_URL = typeof bosInviteLink === "function" ? bosInviteLink(null) : "https://t.me/BalanceOS8_bot";
  var [shareUrl, setShareUrl] = React.useState(APP_URL);
  // Build the invite link. For a SAVED habit on the live cloud → a SHARED-HABIT link
  // (hb_<code>__<ref>): the friend joins the SAME habit and you see each other's calendar.
  // The code is created once and remembered on the habit; the link still carries your ref
  // so the friend also lands in your orbit. Otherwise → the plain app-referral link.
  React.useEffect(() => {
    var on = true;
    (async () => {
      var ref = null;
      try {
        ref = window.bosCloud && window.bosCloud.inviteCode ? await window.bosCloud.inviteCode() : null;
      } catch (e) {}
      if (habit && habit.id && window.bosCloud && window.bosCloud.enabled() && typeof bosSharedHabitLink === "function" && window.bosCloud.createSharedHabit) {
        var code = habit.shareCode;
        if (!code && typeof bosGenShareCode === "function") code = bosGenShareCode();
        if (code) {
          try {
            await window.bosCloud.createSharedHabit({
              code: code,
              name: habit.name,
              emoji: habit.emoji,
              color: habit.color
            });
          } catch (e) {}
          try {
            if (!habit.shareCode && app && app.updateHabit) app.updateHabit(habit.id, {
              shareCode: code
            });
          } catch (e) {}
          if (on) {
            setShareUrl(bosSharedHabitLink(code, ref));
            return;
          }
        }
      }
      if (on) setShareUrl(typeof bosInviteLink === "function" ? bosInviteLink(ref) : APP_URL);
    })();
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
  }, bosIcon(habit?.emoji || "✨", 30, habit?.color)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 700,
      letterSpacing: "-0.3px"
    }
  }, "\u041F\u043E\u0437\u043E\u0432\u0438 \u0434\u0440\u0443\u0433\u0430"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: C.sub,
      marginTop: 3,
      lineHeight: 1.4
    }
  }, "\xAB", habit?.name || "Привычка", "\xBB \u0432\u043C\u0435\u0441\u0442\u0435 \u2014 \u0431\u043E\u043B\u044C\u0448\u0435 XP. \u041E\u0442\u043F\u0440\u0430\u0432\u044C \u0441\u0441\u044B\u043B\u043A\u0443, \u0438 \u0434\u0440\u0443\u0433 \u043F\u0440\u0438\u0441\u043E\u0435\u0434\u0438\u043D\u0438\u0442\u0441\u044F.")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(HabitInviteBannerLive, {
    amount: 75,
    habit: habit
  })), /*#__PURE__*/React.createElement("button", {
    onClick: shareLink,
    className: "tap",
    style: {
      width: "100%",
      marginTop: 20,
      border: 0,
      borderRadius: 999,
      padding: 15,
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

/* Shared-habit «Вместе» card — the multiplayer view for a habit buddy. Each member (you +
   friend) with their REAL avatar (BosAvatar), today's ✓, and a Пн→Вс strip of their marked
   days in the habit's colour — you literally see each other's progress on the calendar
   (David: «видеть прогресс друг друга на календарике»). Reads the cloud shared logs; quietly
   waits while the friend hasn't joined. Rendered only when the habit carries a shareCode. */
function SharedBuddiesLive({
  habit,
  isDark,
  members: membersProp
}) {
  var code = habit && habit.shareCode;
  var {
    open: openSheet
  } = typeof useSheet === "function" ? useSheet() : {
    open: () => {}
  };
  // Cache-backed (no flash); when the parent already provides members, skip the fetch entirely.
  var fetched = useBuddyMembersLive(membersProp ? null : code);
  var accent = typeof bosHabitColor === "function" ? bosHabitColor(habit) : habit.color || "#0a0a0a";
  var today = typeof bosTodayKey === "function" ? bosTodayKey() : "";
  var keys = typeof bosWeekKeys === "function" ? bosWeekKeys() : [];
  var members = membersProp || fetched || [];
  var emptyCell = typeof bosCellEmpty === "function" ? bosCellEmpty(accent, isDark) : isDark ? "rgba(255,255,255,0.13)" : "rgba(0,0,0,0.08)";
  var card = isDark ? {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)"
  } : {
    background: "#fff",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
  };
  // Owner-only swipe-remove (David: «свайп влево → убрать человека из привычки»). Optimistic: hide
  // at once + prune the shared cache; if the server (RLS) refuses — you're not the owner, or the SQL
  // patch isn't applied yet — removeSharedHabitMember returns false (0 rows) and we restore the row.
  var iAmOwner = members.some(function (m) {
    return m.me && m.isOwner;
  });
  var [removed, setRemoved] = React.useState({});
  var removeMember = m => {
    if (!code || !m || m.me || removed[m.id]) return;
    setRemoved(function (r) {
      var n = Object.assign({}, r);
      n[m.id] = true;
      return n;
    });
    try {
      if (_bosBuddyCache[code]) _bosBuddyCache[code] = _bosBuddyCache[code].filter(function (x) {
        return x.id !== m.id;
      });
    } catch (e) {}
    if (window.tgHaptic) {
      try {
        window.tgHaptic("warning");
      } catch (e) {}
    }
    var cl = window.bosCloud;
    if (cl && cl.removeSharedHabitMember) {
      cl.removeSharedHabitMember(code, m.id).then(function (ok) {
        if (!ok) setRemoved(function (r) {
          var n = Object.assign({}, r);
          delete n[m.id];
          return n;
        });
      }).catch(function () {
        setRemoved(function (r) {
          var n = Object.assign({}, r);
          delete n[m.id];
          return n;
        });
      });
    }
  };
  var visible = members.filter(function (m) {
    return !removed[m.id];
  });
  var hasBuddies = visible.length >= 2;
  var invite = () => {
    try {
      openSheet(/*#__PURE__*/React.createElement(ShareHabitSheetLive, {
        habit: habit,
        dark: isDark
      }));
    } catch (e) {}
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      ...card,
      borderRadius: 22,
      padding: 14,
      marginTop: 12
    }
  }, hasBuddies ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      letterSpacing: "-0.2px",
      color: "var(--text-2)",
      marginBottom: 10
    }
  }, "\u0412\u043C\u0435\u0441\u0442\u0435 \xB7 ", visible.length), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, visible.map(m => {
    var doneToday = !!m.days[today];
    // Each person sits on a SUBTLE chip (David: «капельку выделять людей»), distinct from the
    // grey week-squares; the OWNER can swipe a buddy (never yourself) → a SMALLER «Убрать»
    // circle with breathing room, and the slid corner matches the chip radius (16).
    // OPAQUE chip — so it composites IDENTICALLY for everyone. A translucent chip
    // looked lighter on the white card («Ты») but darker inside the owner's SwipeRow
    // (its reveal-track is grey #f1f1f1) → David: «я светло-серый, другой почему-то
    // серее; пусть все одним цветом». One solid grey fixes the mismatch.
    var chipBg = isDark ? "#202022" : "#F4F4F6";
    var rowInner = /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "9px 12px"
      }
    }, /*#__PURE__*/React.createElement(BuddyFaceLive, {
      avatar: m.avatar,
      name: m.name,
      size: 38
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 7,
        fontSize: 14.5,
        fontWeight: 600,
        color: "var(--text)"
      }
    }, m.me ? "Ты" : m.name, doneToday && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        color: accent
      }
    }, "\u2713 \u0441\u0435\u0433\u043E\u0434\u043D\u044F")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 5,
        marginTop: 6
      }
    }, keys.map((k, j) => /*#__PURE__*/React.createElement("span", {
      key: j,
      style: {
        width: 16,
        height: 16,
        borderRadius: "50%",
        background: m.days[k] ? bosCellFill(accent, 1) : emptyCell,
        boxShadow: m.days[k] ? bosCellGlass(isDark) : "none"
      }
    })))));
    return iAmOwner && !m.me ? /*#__PURE__*/React.createElement("div", {
      key: m.id,
      style: {
        borderRadius: 16,
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement(SwipeRow, {
      rowBg: chipBg,
      dark: isDark,
      actionWidth: 52,
      actionSize: 30,
      actions: [{
        key: "rm",
        tone: "delete",
        label: "Убрать",
        icon: I.X,
        onAction: () => bosConfirmDelete(openSheet, {
          title: "Убрать " + (m.name || "человека") + "?",
          message: "Вы перестанете вести эту привычку вместе — историю друг друга больше не увидите.",
          confirmLabel: "Убрать",
          onConfirm: () => removeMember(m)
        })
      }]
    }, rowInner)) : /*#__PURE__*/React.createElement("div", {
      key: m.id,
      style: {
        borderRadius: 16,
        background: chipBg
      }
    }, rowInner);
  })), /*#__PURE__*/React.createElement("button", {
    onClick: invite,
    className: "tap",
    "data-haptic": "selection",
    style: {
      width: "100%",
      marginTop: 14,
      paddingTop: 12,
      background: "transparent",
      border: 0,
      borderTop: "1px solid var(--line)",
      borderRadius: 0,
      display: "flex",
      alignItems: "center",
      gap: 10,
      cursor: "pointer",
      color: "var(--text-2)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 28,
      height: 28,
      borderRadius: "50%",
      background: accent + "1f",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(I.Plus, {
    size: 15,
    color: accent,
    strokeWidth: 2.5
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13.5,
      fontWeight: 600
    }
  }, "\u041F\u043E\u0437\u0432\u0430\u0442\u044C \u0435\u0449\u0451"), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 16,
    color: "var(--text-4)",
    style: {
      marginLeft: "auto"
    }
  }))) :
  /*#__PURE__*/
  // No buddy yet → the invite IS this block (tappable), not a separate bottom button (David:
  // «нижняя кнопка не нужна — кликаю по блоку с цепочкой; и про XP расскажи»).
  React.createElement("button", {
    onClick: invite,
    className: "tap",
    "data-haptic": "selection",
    style: {
      width: "100%",
      textAlign: "left",
      background: "transparent",
      border: 0,
      padding: 0,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 12,
      color: "var(--text)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 42,
      height: 42,
      borderRadius: 14,
      background: accent + "1f",
      display: "grid",
      placeItems: "center",
      fontSize: 20,
      flexShrink: 0
    }
  }, "\uD83D\uDD17"), /*#__PURE__*/React.createElement("div", {
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
  }, "\u0412\u0435\u0434\u0438 \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0443 \u0432\u043C\u0435\u0441\u0442\u0435"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-3)",
      marginTop: 2,
      lineHeight: 1.4
    }
  }, "\u041F\u043E\u0437\u043E\u0432\u0438 \u0434\u0440\u0443\u0433\u0430: ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: "var(--text-2)"
    }
  }, "+75 XP"), ", \u0438 \u043A\u0430\u0436\u0434\u0430\u044F \u043E\u0442\u043C\u0435\u0442\u043A\u0430 \u0432\u043C\u0435\u0441\u0442\u0435 \u2014 ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: "var(--text-2)"
    }
  }, "+15 XP"), " \u0432\u043C\u0435\u0441\u0442\u043E +10.")), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 18,
    color: "var(--text-4)"
  })));
}

/* MoodWidget → live-only: real per-day mood trail (Пн→Вс), real streak chip + XP copy.
   No demo numeric-days showcase, no fresh-user empty state (live always has the trail). */
// LIVE daily state CHECK-IN prompt (David: once a day, in-app card — no push).
// Sits ABOVE habits when today's state isn't logged yet; one tap on a mood orb logs
// it (setMood + setDayMoods, keyed by the real day) and the slot flips to the widget.
// Flush (no own margin/radius/shadow) so it drops cleanly into a SwipeRow wrapper.
// Daily state CHECK-IN — a SWIPE SPINNER (David: «адаптируй крутилку с онбординга, где
// свайпаем и личико меняется»). Scrub the glass orb left↔right and it morphs through the 6
// moods (same StateOrb + tintFromMood as the onboarding dial), the face + word change with a
// haptic notch per mood; «Отметить» logs the day. Logs the real MOOD_OPTIONS index, so the
// week-trail / calendar / MoodWidget keep reading it unchanged.
// Compact, TAP-based state check-in (David: свайп-орб конфликтовал со свайпом карточки и был
// «слишком объёмный», кнопка-гигант). One tidy row of mood faces — TAP yours and it logs
// instantly (+5 XP, success-haptic). No horizontal scrub → lives happily inside the card's
// SwipeRow (swipe still reveals «Убрать», a tap just logs). Logs the real MOOD_OPTIONS index,
// so the week-trail / calendar / MoodWidget keep reading it unchanged.
function StatePromptLive({
  app,
  isDark
}) {
  var moods = typeof MOOD_OPTIONS !== "undefined" ? MOOD_OPTIONS : [];
  var pick = i => {
    if (!app) return;
    var dayKey = typeof bosTodayKey === "function" ? bosTodayKey() : new Date().toISOString().slice(0, 10);
    app.setMood && app.setMood(moods[i]);
    app.setDayMoods && app.setDayMoods({
      ...(app.dayMoods || {}),
      [dayKey]: i
    });
    if (window.tgHaptic) {
      try {
        window.tgHaptic("success");
      } catch (e) {}
    }
  };
  var bg = isDark ? "linear-gradient(160deg, #1a1a1d 0%, #0d0d10 100%)" : "#ffffff";
  var titleColor = isDark ? "#fff" : "var(--text)";
  var subMuted = isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.5)";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      background: bg,
      padding: "15px 16px 16px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--bos-title-font)",
      fontSize: 18,
      fontWeight: 600,
      letterSpacing: "-0.4px",
      color: titleColor
    }
  }, "\u041A\u0430\u043A \u0442\u044B \u0441\u0435\u0439\u0447\u0430\u0441?"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      color: isDark ? "#9fd5a8" : "#3f7a46",
      background: "rgba(90,168,90,0.16)",
      borderRadius: 999,
      padding: "2px 8px",
      flexShrink: 0
    }
  }, "+5 XP")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      gap: 6,
      marginTop: 12
    }
  }, moods.map((mm, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    className: "tap",
    "aria-label": mm.t,
    onClick: () => pick(i),
    style: {
      width: 46,
      height: 46,
      flexShrink: 0,
      border: 0,
      borderRadius: "50%",
      padding: 0,
      cursor: "pointer",
      background: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.55), rgba(255,255,255,0) 60%), " + (mm.c || "#5BC57E"),
      boxShadow: "0 3px 8px " + (mm.c || "#5BC57E") + "44",
      display: "grid",
      placeItems: "center",
      fontSize: 23,
      lineHeight: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.2))"
    }
  }, mm.i)))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: subMuted,
      marginTop: 10,
      textAlign: "center"
    }
  }, "\u041D\u0430\u0436\u043C\u0438 \u043D\u0430 \u0441\u0432\u043E\u0451 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D\u0438\u0435"));
}

// Daily state CHECK-IN v2 — the onboarding «крутилка» reborn as a CONTAINED iOS slider (David:
// «тонкий блок, бегунок ездит ВНУТРИ желобка, лицо-человечек внутри орба меняется; старт ВСЕГДА по
// центру = нейтрально, слева негатив → справа позитив»). The capsule track captures its OWN pointer
// (stopPropagation + setPointerCapture) so the horizontal drag never fights the card's SwipeRow —
// the earlier free-scrub orb did, which is exactly why it was pulled. Release = log (+5 XP), mapping
// the 0..1 valence → real MOOD_OPTIONS index, so calendar / week-trail / MoodWidget read it unchanged.
function StateSliderLive({
  app,
  isDark
}) {
  var [val, setVal] = React.useState(0.78); // start at «Хорошо» (David), not neutral middle
  var trackRef = React.useRef(null);
  var dragRef = React.useRef(false);
  var lastBkt = React.useRef(typeof moodBucket === "function" ? moodBucket(0.78) : 5);
  var idx = typeof moodBucket === "function" ? moodBucket(val) : 5;
  var face = typeof MOOD_FACES !== "undefined" && MOOD_FACES[idx] || "🙂";
  var word = typeof MOOD_WORDS !== "undefined" && MOOD_WORDS[idx] || "Хорошо";
  var tint = typeof tintFromMood === "function" && typeof moodSpectrum === "function" ? tintFromMood(moodSpectrum(val)) : ["#cfe1ff", "#7aa4d0", "#2c4d76"];
  var PAD = 12; // keep the 22px thumb inside the track ends

  var setFromX = clientX => {
    var el = trackRef.current;
    if (!el) return;
    var r = el.getBoundingClientRect();
    var v = (clientX - r.left - PAD) / Math.max(1, r.width - 2 * PAD);
    v = Math.max(0, Math.min(1, v));
    var b = typeof moodBucket === "function" ? moodBucket(v) : 3;
    if (b !== lastBkt.current) {
      lastBkt.current = b;
      if (window.tgHaptic) {
        try {
          window.tgHaptic("selection");
        } catch (e) {}
      }
    }
    setVal(v);
  };
  var commit = () => {
    if (!app) return;
    var dayKey = typeof bosTodayKey === "function" ? bosTodayKey() : new Date().toISOString().slice(0, 10);
    var mi = typeof bosMoodIdxFromValence === "function" ? bosMoodIdxFromValence(val) : 1;
    app.setMood && app.setMood(MOOD_OPTIONS[mi]);
    app.setDayMoods && app.setDayMoods({
      ...(app.dayMoods || {}),
      [dayKey]: mi
    });
    if (window.tgHaptic) {
      try {
        window.tgHaptic("success");
      } catch (e) {}
    }
  };
  var bg = isDark ? "linear-gradient(160deg, #1a1a1d 0%, #0d0d10 100%)" : "#ffffff";
  var titleColor = isDark ? "#fff" : "var(--text)";
  var labelMuted = isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.45)";
  var trackBg = isDark ? "rgba(255,255,255,0.10)" : "#e7e7ea";
  var trackGlass = isDark ? "inset 0 1px 2px rgba(0,0,0,0.45)" : "inset 0 1.5px 3px rgba(0,0,0,0.09), inset 0 -1px 0 rgba(255,255,255,0.65)";
  var endLabel = isDark ? "rgba(255,255,255,0.42)" : "#a8a8ae";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      background: bg,
      padding: "10px 14px 12px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 11
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: 58,
      height: 58,
      flexShrink: 0,
      display: "grid",
      placeItems: "center"
    }
  }, /*#__PURE__*/React.createElement(StateOrb, {
    size: 58,
    tint: tint,
    intensity: isDark ? 1.25 : 1.08
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      display: "grid",
      placeItems: "center",
      pointerEvents: "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    key: idx,
    style: {
      fontSize: 23,
      lineHeight: 1,
      filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.28))",
      animation: "bosFacePop 0.4s cubic-bezier(0.34,1.56,0.64,1) both"
    }
  }, face))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 1.4,
      color: labelMuted,
      fontWeight: 600
    }
  }, "\u041A\u0430\u043A \u0442\u044B \u0441\u0435\u0439\u0447\u0430\u0441?"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      color: isDark ? "#9fd5a8" : "#3f7a46",
      background: "rgba(90,168,90,0.16)",
      borderRadius: 999,
      padding: "2px 8px",
      flexShrink: 0
    }
  }, "+5 XP")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--bos-title-font)",
      fontSize: 19,
      fontWeight: 600,
      letterSpacing: "-0.4px",
      color: titleColor,
      lineHeight: 1.15,
      marginTop: 2
    }
  }, word))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    ref: trackRef,
    onPointerDown: e => {
      e.stopPropagation();
      dragRef.current = true;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (_) {}
      setFromX(e.clientX);
    },
    onPointerMove: e => {
      if (!dragRef.current) return;
      e.stopPropagation();
      setFromX(e.clientX);
    },
    onPointerUp: e => {
      e.stopPropagation();
      if (dragRef.current) {
        dragRef.current = false;
        commit();
      }
    },
    onPointerCancel: () => {
      dragRef.current = false;
    },
    style: {
      position: "relative",
      height: 24,
      touchAction: "none",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      top: "50%",
      transform: "translateY(-50%)",
      height: 7,
      borderRadius: 999,
      background: trackBg,
      boxShadow: trackGlass
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      top: "50%",
      transform: "translateY(-50%)",
      width: "calc(" + PAD + "px + " + val + " * (100% - " + 2 * PAD + "px))",
      height: 7,
      borderRadius: 999,
      background: "linear-gradient(90deg, " + tint[0] + ", " + tint[1] + ")",
      opacity: 0.92
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: "50%",
      left: "calc(" + PAD + "px + " + val + " * (100% - " + 2 * PAD + "px))",
      width: 22,
      height: 22,
      borderRadius: "50%",
      background: "radial-gradient(circle at 35% 30%, #fff, #eef0f3)",
      boxShadow: "0 2px 7px rgba(0,0,0,0.28), inset 0 0 0 0.7px rgba(0,0,0,0.06)",
      transform: "translate(-50%,-50%)",
      transition: dragRef.current ? "none" : "left 0.12s ease"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: 7,
      padding: "0 2px",
      fontSize: 10.5,
      letterSpacing: 0.4,
      textTransform: "uppercase",
      color: endLabel,
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u043D\u0435\u043F\u0440\u0438\u044F\u0442\u043D\u043E"), /*#__PURE__*/React.createElement("span", null, "\u043F\u0440\u0438\u044F\u0442\u043D\u043E"))));
}

/* Universal create menu (B1) — a small iOS-style glass popover that springs out of the
   floating «+», offering Привычку · Цель · Команду and routing to the existing create
   flows. Reuses the app's own spring + glass vocabulary (no new lib); portaled above
   everything with a light dim behind. Rendered purely off `open` (+ a measured anchor
   position) so it opens AND closes reliably — no internal timers to get wedged; the
   entrance springs via the bosMenuPop keyframe, and tapping the dim or an item closes it. */
// ONE delete-confirm for the whole live app (David: «везде спрашивай „это безвозвратно?", и
// иконка удаления — единый крестик»). Wraps the core iOS ConfirmActionSheet (red ⚠️ circle +
// destructive button + Отмена) — the same sheet teams already use for leave/delete. Call it
// from any SwipeRow «Удалить» onAction with the item's openSheet.
function bosConfirmDelete(openSheet, opts) {
  opts = opts || {};
  if (typeof openSheet !== "function") {
    if (opts.onConfirm) try {
      opts.onConfirm();
    } catch (e) {}
    return;
  }
  try {
    openSheet(/*#__PURE__*/React.createElement(ConfirmActionSheet, {
      emoji: opts.emoji || "⚠️",
      title: opts.title || "Удалить?",
      message: opts.message || "Это действие нельзя отменить.",
      confirmLabel: opts.confirmLabel || "Удалить",
      confirmIcon: I.X,
      onConfirm: opts.onConfirm || (() => {})
    }));
  } catch (e) {
    if (opts.onConfirm) try {
      opts.onConfirm();
    } catch (e2) {}
  }
}

/* Long-press → jiggle → drag-to-reorder list (iOS-26). David: «зажал блок — он задрожал —
   могу передвинуть; порядок запоминается в моём аккаунте». NORMAL mode: items render via
   renderItem(id, {mode:false, dragging:false}) — your SwipeRow card, tap navigates. A ~420ms
   long-press held STILL (a sideways flick stays a SwipeRow swipe, a vertical drag stays a page
   scroll — both cancel the press) flips to REORDER mode: every card jiggles, SwipeRow/tap are
   dropped (renderItem gets {mode:true}); dragging a card live-reorders the others. Each drop
   commits via onReorder(orderedIds) and «Готово» leaves the mode. Per-drag rect snapshot →
   variable-height cards reorder correctly. Window-level pointer listeners survive the
   normal→reorder re-render so a single press flows straight into a drag. */
function BosReorderList({
  ids,
  onReorder,
  renderItem,
  gap = 8,
  onAdd,
  addLabel
}) {
  var [mode, setMode] = React.useState(false);
  var [order, setOrder] = React.useState(ids);
  var [drag, setDrag] = React.useState({
    id: null,
    from: -1,
    to: -1,
    dy: 0,
    slot: 0
  });
  var refs = React.useRef({});
  var g = React.useRef(null); // live gesture (avoids stale closures)
  var idsKey = (ids || []).join("|");
  // Resync to the store order whenever it changes AND we're not mid-gesture (add / delete / load).
  React.useEffect(() => {
    if (!g.current) setOrder(ids || []);
  }, [idsKey]);
  var onDown = id => e => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (g.current) return; // one finger at a time
    var startY = e.clientY,
      startX = e.clientX;
    var curOrder = order.slice();
    var from = curOrder.indexOf(id);
    var gc = {
      id,
      from,
      to: from,
      startY,
      startX,
      fired: false,
      order: curOrder
    };
    var cleanup = () => {
      if (gc.longTimer) {
        clearTimeout(gc.longTimer);
        gc.longTimer = null;
      }
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      if (g.current === gc) g.current = null;
    };
    var begin = () => {
      gc.fired = true;
      if (!mode) setMode(true);
      var snap = {};
      curOrder.forEach(iid => {
        var el = refs.current[iid];
        if (el) {
          var r = el.getBoundingClientRect();
          snap[iid] = {
            top: r.top,
            h: r.height
          };
        }
      });
      gc.snap = snap;
      var slot = (snap[id] ? snap[id].h : 72) + gap;
      gc.slot = slot;
      setDrag({
        id,
        from,
        to: from,
        dy: 0,
        slot
      });
      if (window.tgHaptic) {
        try {
          window.tgHaptic("medium");
        } catch (e2) {}
      }
    };
    var onMove = e2 => {
      var y = e2.clientY,
        x = e2.clientX;
      if (!gc.fired) {
        if (Math.abs(y - startY) > 10 || Math.abs(x - startX) > 10) cleanup();
        return;
      }
      if (e2.cancelable) e2.preventDefault();
      var dy = y - startY;
      var me = gc.snap[id];
      if (!me) return;
      var center = me.top + dy + me.h / 2;
      var to = from;
      if (dy > 0) {
        for (var i = from + 1; i < curOrder.length; i++) {
          var s = gc.snap[curOrder[i]];
          if (s && center > s.top + s.h / 2) to = i;else break;
        }
      } else if (dy < 0) {
        for (var _i = from - 1; _i >= 0; _i--) {
          var _s2 = gc.snap[curOrder[_i]];
          if (_s2 && center < _s2.top + _s2.h / 2) to = _i;else break;
        }
      }
      gc.to = to;
      setDrag({
        id,
        from,
        to,
        dy,
        slot: gc.slot
      });
    };
    var onUp = () => {
      var fired = gc.fired,
        gto = gc.to;
      cleanup();
      if (fired) {
        if (gto !== from && gto >= 0) {
          var next = curOrder.slice();
          var [x] = next.splice(from, 1);
          next.splice(gto, 0, x);
          setOrder(next);
          try {
            onReorder && onReorder(next);
          } catch (e2) {}
          if (window.tgHaptic) {
            try {
              window.tgHaptic("light");
            } catch (e2) {}
          }
        }
        setDrag({
          id: null,
          from: -1,
          to: -1,
          dy: 0,
          slot: 0
        });
      }
    };
    g.current = gc;
    window.addEventListener("pointermove", onMove, {
      passive: false
    });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    if (mode) begin();else gc.longTimer = setTimeout(begin, 420);
  };
  var done = () => {
    setMode(false);
    setDrag({
      id: null,
      from: -1,
      to: -1,
      dy: 0,
      slot: 0
    });
  };
  var shiftOf = idx => {
    var {
      from,
      to,
      slot
    } = drag;
    if (from < 0 || to < 0) return 0;
    if (from < to && idx > from && idx <= to) return -slot;
    if (to < from && idx >= to && idx < from) return slot;
    return 0;
  };
  var dark = !!(typeof document !== "undefined" && document.querySelector(".bos-page.theme-dark"));
  return /*#__PURE__*/React.createElement(React.Fragment, null, mode && ReactDOM.createPortal(/*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      bottom: "calc(var(--bos-safe-bottom, 0px) + 94px)",
      left: 0,
      right: 0,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: 10,
      zIndex: 7000,
      pointerEvents: "none"
    }
  }, onAdd && /*#__PURE__*/React.createElement("button", {
    onClick: onAdd,
    className: "tap",
    "data-haptic": "selection",
    "aria-label": addLabel || "Добавить виджет",
    style: {
      pointerEvents: "auto",
      width: 44,
      height: 44,
      borderRadius: "50%",
      border: 0,
      display: "grid",
      placeItems: "center",
      cursor: "pointer",
      color: dark ? "#fff" : "var(--text)",
      background: BOS_TILE_SHEEN + ", " + (dark ? "rgba(64,64,68,0.96)" : "rgba(255,255,255,0.97)"),
      boxShadow: "0 10px 26px rgba(0,0,0,0.30), inset 0 1px 1px rgba(255,255,255,0.9), inset 0 0 0 0.5px rgba(0,0,0,0.08)",
      animation: "bosMenuPop 0.32s cubic-bezier(0.34,1.5,0.4,1) both"
    }
  }, /*#__PURE__*/React.createElement(I.Plus, {
    size: 20,
    strokeWidth: 2.6
  })), /*#__PURE__*/React.createElement("button", {
    onClick: done,
    className: "tap",
    "data-haptic": "selection",
    "aria-label": "\u0413\u043E\u0442\u043E\u0432\u043E \u2014 \u0432\u044B\u0439\u0442\u0438 \u0438\u0437 \u0440\u0435\u0436\u0438\u043C\u0430 \u043F\u0435\u0440\u0435\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0438",
    style: {
      pointerEvents: "auto",
      border: 0,
      background: "#0a0a0a",
      color: "#fff",
      borderRadius: 999,
      padding: "11px 22px",
      fontSize: 14,
      fontWeight: 600,
      boxShadow: "0 10px 26px rgba(0,0,0,0.36)",
      cursor: "pointer",
      animation: "bosMenuPop 0.32s cubic-bezier(0.34,1.5,0.4,1) both"
    }
  }, "\u0413\u043E\u0442\u043E\u0432\u043E")), typeof document !== "undefined" && document.querySelector(".page-stack") || document.body), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap,
      color: "var(--text)"
    }
  }, order.map((id, idx) => {
    var isDrag = drag.id === id;
    return /*#__PURE__*/React.createElement("div", {
      key: id,
      ref: el => {
        refs.current[id] = el;
      },
      onPointerDown: onDown(id),
      style: {
        position: "relative",
        touchAction: mode ? "none" : "auto",
        transform: isDrag ? "translateY(" + drag.dy + "px) scale(1.03)" : "translateY(" + shiftOf(idx) + "px)",
        transition: isDrag ? "none" : "transform 0.22s cubic-bezier(0.2,0,0,1)",
        zIndex: isDrag ? 40 : 1,
        willChange: mode ? "transform" : "auto"
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: mode && !isDrag ? "bos-jiggle" : "",
      style: {
        animationDelay: -(idx % 5) * 0.045 + "s",
        borderRadius: 22,
        boxShadow: isDrag ? "0 16px 34px rgba(20,30,60,0.22)" : "none"
      }
    }, renderItem(id, {
      mode,
      dragging: isDrag
    })));
  })));
}

/* Long-press → context menu → optional jiggle/drag reorder, but laid out as a 2-COLUMN GRID of
   square tiles (David: «привычки квадратными плитками по 2 в ряд»). Mirrors BosReorderList's proven
   press/drag machinery, but: (1) the container is a CSS grid; (2) the dragged tile follows the
   finger in 2D; (3) the OTHER tiles slide to their new slots via a per-drag rect snapshot, so the
   shift math works in two dimensions (Δx AND Δy), not just vertically.
   NORMAL press: renderItem(id,{mode:false}) → a tap navigates; a press held STILL ~480ms fires
   onLongPress(id) (the parent opens the tile menu: Поделиться / Переставить / Удалить) and swallows
   the trailing click so the tile doesn't ALSO navigate. Reorder is entered DELIBERATELY from that
   menu (enterReorder, exposed via ctlRef) — a grid has no obvious drag-handle, so we don't want a
   stray hold to start dragging. In REORDER mode every tile jiggles and a press begins a drag at
   once; «Готово» (floating, portal'd like BosReorderList) leaves the mode. */
function BosReorderGrid({
  ids,
  onReorder,
  renderItem,
  onLongPress,
  ctlRef,
  cols = 2,
  gap = 12,
  spanFull
}) {
  var [mode, setMode] = React.useState(false);
  var [order, setOrder] = React.useState(ids);
  var [drag, setDrag] = React.useState({
    id: null,
    from: -1,
    to: -1,
    dx: 0,
    dy: 0
  });
  var refs = React.useRef({});
  var g = React.useRef(null); // live gesture (avoids stale closures)
  var idsKey = (ids || []).join("|");
  React.useEffect(() => {
    if (!g.current) setOrder(ids || []);
  }, [idsKey]);
  // Let the parent flip us into reorder mode from the long-press menu («Переставить плитки»).
  React.useEffect(() => {
    if (ctlRef) ctlRef.current = {
      enterReorder: () => setMode(true),
      exit: () => setMode(false)
    };
  }, [ctlRef]);
  var onDown = id => e => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (g.current) return; // one finger at a time
    var startY = e.clientY,
      startX = e.clientX;
    var curOrder = order.slice();
    var from = curOrder.indexOf(id);
    var gc = {
      id,
      from,
      to: from,
      startY,
      startX,
      fired: false,
      order: curOrder
    };
    var cleanup = () => {
      if (gc.longTimer) {
        clearTimeout(gc.longTimer);
        gc.longTimer = null;
      }
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      if (g.current === gc) g.current = null;
    };
    // Held-still long-press in NORMAL mode → open the tile menu. Mark the gesture consumed and
    // swallow the trailing click so the tile doesn't navigate into the detail screen too.
    var popMenu = () => {
      gc.fired = true;
      if (window.tgHaptic) {
        try {
          window.tgHaptic("medium");
        } catch (e2) {}
      }
      var swallow = ev => {
        ev.stopPropagation();
        ev.preventDefault();
        window.removeEventListener("click", swallow, true);
      };
      window.addEventListener("click", swallow, true);
      setTimeout(() => {
        try {
          window.removeEventListener("click", swallow, true);
        } catch (e2) {}
      }, 800);
      if (onLongPress) {
        try {
          onLongPress(id);
        } catch (e2) {}
      }
      cleanup();
    };
    // Press in REORDER mode → begin a drag at once (snapshot every tile's rect for 2D shifts).
    var begin = () => {
      gc.fired = true;
      var snap = {};
      curOrder.forEach(iid => {
        var el = refs.current[iid];
        if (el) {
          var r = el.getBoundingClientRect();
          snap[iid] = {
            left: r.left,
            top: r.top,
            w: r.width,
            h: r.height
          };
        }
      });
      gc.snap = snap;
      setDrag({
        id,
        from,
        to: from,
        dx: 0,
        dy: 0
      });
      if (window.tgHaptic) {
        try {
          window.tgHaptic("medium");
        } catch (e2) {}
      }
    };
    var onMove = e2 => {
      var y = e2.clientY,
        x = e2.clientX;
      if (!gc.fired) {
        if (Math.abs(y - startY) > 10 || Math.abs(x - startX) > 10) cleanup();
        return;
      }
      if (!gc.snap) return; // a popMenu press has no drag
      if (e2.cancelable) e2.preventDefault();
      var dx = x - startX,
        dy = y - startY;
      // target slot = the tile whose CENTRE is nearest the finger (2D)
      var to = gc.from,
        best = Infinity;
      for (var i = 0; i < curOrder.length; i++) {
        var s = gc.snap[curOrder[i]];
        if (!s) continue;
        var cx = s.left + s.w / 2,
          cy = s.top + s.h / 2;
        var d = (cx - x) * (cx - x) + (cy - y) * (cy - y);
        if (d < best) {
          best = d;
          to = i;
        }
      }
      gc.to = to;
      setDrag({
        id,
        from: gc.from,
        to,
        dx,
        dy
      });
    };
    var onUp = () => {
      var fired = gc.fired,
        gto = gc.to,
        gfrom = gc.from,
        dragging = !!gc.snap;
      cleanup();
      if (fired && dragging) {
        if (gto !== gfrom && gto >= 0) {
          var next = curOrder.slice();
          var [x] = next.splice(gfrom, 1);
          next.splice(gto, 0, x);
          setOrder(next);
          try {
            onReorder && onReorder(next);
          } catch (e2) {}
          if (window.tgHaptic) {
            try {
              window.tgHaptic("light");
            } catch (e2) {}
          }
        }
        setDrag({
          id: null,
          from: -1,
          to: -1,
          dx: 0,
          dy: 0
        });
      }
    };
    g.current = gc;
    window.addEventListener("pointermove", onMove, {
      passive: false
    });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    if (mode) begin();else gc.longTimer = setTimeout(popMenu, 480);
  };
  var done = () => {
    setMode(false);
    setDrag({
      id: null,
      from: -1,
      to: -1,
      dx: 0,
      dy: 0
    });
  };

  // 2D shift for the non-dragged tiles — slide each to the slot it WOULD occupy once the dragged
  // tile lands at `to`. Uses the drag-time rect snapshot, so it's a grid-correct Δx/Δy (not just Δy).
  var shiftOf = idx => {
    var gc = g.current;
    if (!gc || !gc.snap || drag.from < 0 || drag.to < 0 || drag.from === drag.to) return {
      x: 0,
      y: 0
    };
    var myId = order[idx];
    if (myId === drag.id) return {
      x: 0,
      y: 0
    };
    var virtual = order.slice();
    var fi = virtual.indexOf(drag.id);
    if (fi < 0) return {
      x: 0,
      y: 0
    };
    virtual.splice(fi, 1);
    virtual.splice(drag.to, 0, drag.id);
    var slot = virtual.indexOf(myId);
    var cur = gc.snap[myId],
      tgt = gc.snap[order[slot]];
    if (!cur || !tgt) return {
      x: 0,
      y: 0
    };
    return {
      x: tgt.left - cur.left,
      y: tgt.top - cur.top
    };
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, mode && ReactDOM.createPortal(/*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      bottom: "calc(var(--bos-safe-bottom, 0px) + 94px)",
      left: 0,
      right: 0,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: 10,
      zIndex: 7000,
      pointerEvents: "none"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: done,
    className: "tap",
    "data-haptic": "selection",
    "aria-label": "\u0413\u043E\u0442\u043E\u0432\u043E \u2014 \u0432\u044B\u0439\u0442\u0438 \u0438\u0437 \u0440\u0435\u0436\u0438\u043C\u0430 \u043F\u0435\u0440\u0435\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0438",
    style: {
      pointerEvents: "auto",
      border: 0,
      background: "#0a0a0a",
      color: "#fff",
      borderRadius: 999,
      padding: "11px 22px",
      fontSize: 14,
      fontWeight: 600,
      boxShadow: "0 10px 26px rgba(0,0,0,0.36)",
      cursor: "pointer",
      animation: "bosMenuPop 0.32s cubic-bezier(0.34,1.5,0.4,1) both"
    }
  }, "\u0413\u043E\u0442\u043E\u0432\u043E")), typeof document !== "undefined" && document.querySelector(".page-stack") || document.body), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(" + cols + ", 1fr)",
      gap,
      color: "var(--text)"
    }
  }, order.map((id, idx) => {
    var isDrag = drag.id === id;
    var sh = isDrag ? {
      x: 0,
      y: 0
    } : shiftOf(idx);
    return /*#__PURE__*/React.createElement("div", {
      key: id,
      ref: el => {
        refs.current[id] = el;
      },
      onPointerDown: onDown(id),
      style: {
        position: "relative",
        touchAction: mode ? "none" : "auto",
        gridColumn: spanFull && spanFull(id) ? "1 / -1" : undefined,
        transform: isDrag ? "translate(" + drag.dx + "px, " + drag.dy + "px) scale(1.045)" : "translate(" + sh.x + "px, " + sh.y + "px)",
        transition: isDrag ? "none" : "transform 0.24s cubic-bezier(0.2,0,0,1)",
        zIndex: isDrag ? 40 : 1,
        willChange: mode ? "transform" : "auto"
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: mode && !isDrag ? "bos-jiggle" : "",
      style: {
        animationDelay: -(idx % 5) * 0.045 + "s",
        borderRadius: 22,
        boxShadow: isDrag ? "0 16px 34px rgba(20,30,60,0.22)" : "none"
      }
    }, renderItem(id, {
      mode,
      dragging: isDrag
    })));
  })));
}

/* The home widget CATALOGUE — one source of truth shared by the board (home_live), the add
   sheet, and the «Виджеты главного» settings screen (home_extra_live). `var` so it's global
   across the built files. id = the widgets[id] visibility flag; order lives in widgets.order. */
// Блок «Уровень» УЕХАЛ с главной на страницу «Я» (David: «золотой баннер уровня перенести внутрь Я»)
// → его нет в списке виджетов главной. Кейс id==="level" в home_live остаётся, но не рендерится
// (нет в DEFAULT_ORDER → отфильтровывается), чтобы откат был лёгким.
var BOS_HOME_WIDGETS = [{
  id: "hero",
  t: "Подсказки",
  d: "ИИ-сводка дня и аватар",
  emoji: "✨"
}, {
  id: "week",
  t: "Эта неделя",
  d: "Недельная активность",
  emoji: "📅"
}, {
  id: "team",
  t: "Команды",
  d: "Твои команды",
  emoji: "👥"
},
// «Состояние» (mood-слайдер + виджет-состояние с упоминанием дневника) ВРЕМЕННО СКРЫТ (David) —
// убран из списка → кейс id==="mood" в home_live не рендерится. Вернуть = добавить строку обратно.
{
  id: "habits",
  t: "Привычки",
  d: "Список привычек на день",
  emoji: "🌱"
}, {
  id: "goals",
  t: "Цели",
  d: "Твои цели",
  emoji: "🎯"
}, {
  id: "invite",
  t: "Позови своих",
  d: "Приглашай друзей — +XP",
  emoji: "📣"
}];

/* iOS-style «−» remove badge for the home widget board — a small GLASS circle pinned to the
   block's top-left (same reflective material as the pencil button). Stops the pointer so a tap
   removes the widget instead of starting a drag. David: «минус в кружочке-стекле слева сверху». */
function WidgetMinusLive({
  onRemove
}) {
  var app = typeof useApp === "function" ? useApp() : null;
  var dark = app?.themeOverride === "dark";
  return /*#__PURE__*/React.createElement("button", {
    onPointerDown: e => e.stopPropagation(),
    onClick: e => {
      e.stopPropagation();
      if (window.tgHaptic) {
        try {
          window.tgHaptic("rigid");
        } catch (_) {}
      }
      onRemove();
    },
    className: "tap",
    "aria-label": "\u0423\u0431\u0440\u0430\u0442\u044C \u0432\u0438\u0434\u0436\u0435\u0442 \u0441 \u0433\u043B\u0430\u0432\u043D\u043E\u0439",
    style: {
      position: "absolute",
      top: -7,
      left: -7,
      zIndex: 30,
      width: 27,
      height: 27,
      borderRadius: "50%",
      border: 0,
      display: "grid",
      placeItems: "center",
      cursor: "pointer",
      color: dark ? "#fff" : "var(--text)",
      background: BOS_TILE_SHEEN + ", " + (dark ? "rgba(64,64,68,0.96)" : "rgba(255,255,255,0.97)"),
      boxShadow: "0 2px 9px rgba(0,0,0,0.24), inset 0 1px 1px rgba(255,255,255,0.9), inset 0 0 0 0.5px rgba(0,0,0,0.08)"
    }
  }, /*#__PURE__*/React.createElement(I.Minus, {
    size: 16,
    strokeWidth: 3
  }));
}

/* Bottom sheet to turn home widgets ON/OFF — one glassy place to manage the board (David: «шторка
   с виджетами, которые можно включить или выключить, со стеклом»). Reads app.widgets live, so the
   board behind updates as you flip switches. `defs` = the full catalogue [{ id, t, d, emoji }]; LIVE. */
function AddWidgetSheetLive({
  defs = [],
  dark = false
}) {
  var app = typeof useApp === "function" ? useApp() : null;
  var widgets = app?.widgets || {};
  // «invite» is opt-in (off by default, matches the home board); everything else ON unless hidden.
  var isOn = id => id === "invite" ? widgets.invite === true : widgets[id] !== false;
  var toggle = id => {
    app?.setWidgets({
      ...(app.widgets || {}),
      [id]: !isOn(id)
    });
    if (window.tgHaptic) {
      try {
        window.tgHaptic("light");
      } catch (_) {}
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "2px 18px 8px",
      color: "var(--text)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 800,
      letterSpacing: "-0.3px"
    }
  }, "\u0412\u0438\u0434\u0436\u0435\u0442\u044B \u0433\u043B\u0430\u0432\u043D\u043E\u0439"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-3)",
      marginTop: 5
    }
  }, "\u0427\u0442\u043E \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u043D\u0430 \u0433\u043B\u0430\u0432\u043D\u043E\u0439")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, defs.map(o => {
    var on = isOn(o.id);
    return /*#__PURE__*/React.createElement("div", {
      key: o.id,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 13,
        width: "100%",
        padding: 12,
        borderRadius: 18,
        background: BOS_TILE_SHEEN + ", " + (dark ? "rgba(255,255,255,0.06)" : "var(--surface-3)"),
        boxShadow: bosTileGlass(dark)
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 40,
        height: 40,
        borderRadius: 13,
        display: "grid",
        placeItems: "center",
        fontSize: 20,
        flexShrink: 0,
        background: BOS_TILE_SHEEN + ", " + (dark ? "rgba(255,255,255,0.08)" : "#fff"),
        boxShadow: bosTileGlass(dark),
        opacity: on ? 1 : 0.5,
        transition: "opacity 0.2s"
      }
    }, o.emoji), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0,
        opacity: on ? 1 : 0.55,
        transition: "opacity 0.2s"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15.5,
        fontWeight: 600
      }
    }, o.t), o.d && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        color: "var(--text-4)",
        marginTop: 1
      }
    }, o.d)), /*#__PURE__*/React.createElement(Switch, {
      on: on,
      onChange: () => toggle(o.id)
    }));
  })));
}
function CreateMenuLive({
  open,
  onClose,
  anchorRef,
  navigate
}) {
  var [pos, setPos] = React.useState(null);
  React.useEffect(() => {
    if (open && anchorRef && anchorRef.current) {
      var r = anchorRef.current.getBoundingClientRect();
      setPos({
        right: Math.round(window.innerWidth - r.right),
        top: Math.round(r.bottom + 10)
      });
    }
  }, [open]);
  if (!open || !pos) return null;
  // «+» = создать ПРИВЫЧКУ или ЦЕЛЬ (David: «Цель» понятнее новичку, чем «Круг»; круг = тумблер
  // «Идти к цели вместе» ВНУТРИ создания цели). Монохромные SVG-иконки в стекле: огонёк-серия =
  // привычка, флажок-вершина = цель. Тот же компонент на главной И на стр. Привычки → меню одинаковое.
  var items = [{
    icon: I.Flame,
    label: "Привычку",
    go: () => navigate("habit-settings", {
      mode: "create"
    })
  }, {
    icon: I.Flag,
    label: "Цель",
    go: () => navigate("goal-settings", {
      mode: "create"
    })
  }];
  return ReactDOM.createPortal(/*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 8000,
      background: "rgba(18,22,38,0.16)",
      animation: "dimIn 0.18s ease both"
    }
  }, /*#__PURE__*/React.createElement("div", {
    role: "menu",
    onClick: e => e.stopPropagation(),
    style: {
      position: "fixed",
      right: pos.right,
      top: pos.top,
      transformOrigin: "top right",
      animation: "bosMenuPop 0.34s cubic-bezier(0.34,1.5,0.4,1) both",
      minWidth: 212,
      padding: 7,
      borderRadius: 22,
      background: "rgba(255,255,255,0.74)",
      WebkitBackdropFilter: "blur(34px) saturate(180%)",
      backdropFilter: "blur(34px) saturate(180%)",
      border: "0.5px solid rgba(255,255,255,0.7)",
      boxShadow: "0 16px 44px rgba(20,30,60,0.26)"
    }
  }, items.map((it, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    role: "menuitem",
    "data-haptic": "selection",
    onClick: () => {
      onClose();
      it.go();
    },
    className: "tap",
    style: {
      display: "flex",
      alignItems: "center",
      gap: 13,
      width: "100%",
      padding: "12px 14px",
      border: 0,
      background: "transparent",
      borderRadius: 16,
      fontSize: 16,
      fontWeight: 600,
      color: "#0a0a0a",
      cursor: "pointer",
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": true,
    style: {
      width: 30,
      height: 30,
      borderRadius: 9,
      background: "rgba(10,10,10,0.05)",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, React.createElement(it.icon, {
    size: 18,
    color: "#0a0a0a",
    strokeWidth: 1.9
  })), it.label)))), document.body);
}

// ─── СТИЛЬ КАРТОЧЕК страницы «Привычки» ───────────────────────────────────────────────────────────
// David: «формы + тоглы внутри». Дефолт = ТЕКУЩИЙ вид (квадрат, неделя, имя+лица) — не меняем, человек
// сам покрутит. Запоминается в localStorage; смена шлёт событие → список перерисовывается вживую.
var BOS_CARD_STYLE_DEFAULT = {
  form: "square",
  name: true,
  marks: "week",
  faces: true,
  cells: "round"
};
function bosLoadCardStyle() {
  try {
    var s = JSON.parse(localStorage.getItem("bos:cardStyle") || "null");
    if (s && typeof s === "object") return Object.assign({}, BOS_CARD_STYLE_DEFAULT, s);
  } catch (e) {}
  return Object.assign({}, BOS_CARD_STYLE_DEFAULT);
}
function bosSaveCardStyle(s) {
  try {
    localStorage.setItem("bos:cardStyle", JSON.stringify(s));
  } catch (e) {}
  try {
    window.dispatchEvent(new Event("bos:cardStyleChanged"));
  } catch (e) {}
}

// СТИЛЬ ЦЕЛЕЙ — ОТДЕЛЬНЫЙ от привычек (David: «карточки целей и привычек должны отличаться; в
// шестерёнке — стиль привычек И стиль целей, у целей другие пресеты»). База = ВЫСОКИЙ БАННЕР (как
// цель выглядела изначально). form: banner (полноширинный высокий) | square (2-в-ряд минимал).
// orbits = мини-орбита (привычки+люди вокруг цели-превью). name/progress — тоглы. Тот же event.
var BOS_GOAL_STYLE_DEFAULT = {
  form: "banner",
  name: true,
  orbits: false,
  progress: true
};
function bosLoadGoalStyle() {
  try {
    var s = JSON.parse(localStorage.getItem("bos:goalStyle") || "null");
    if (s && typeof s === "object") return Object.assign({}, BOS_GOAL_STYLE_DEFAULT, s);
  } catch (e) {}
  return Object.assign({}, BOS_GOAL_STYLE_DEFAULT);
}
function bosSaveGoalStyle(s) {
  try {
    localStorage.setItem("bos:goalStyle", JSON.stringify(s));
  } catch (e) {}
  try {
    window.dispatchEvent(new Event("bos:cardStyleChanged"));
  } catch (e) {}
}

// Месячная «грядка» для превью карточки — последние 5 недель (35 клеток) хитмапом по логу привычки.
// Тот же язык клеток, что у недельной полоски и календаря (bosCellFill/bosCellGlass) → континуити.
function HabitMonthMini({
  habit,
  square = false
}) {
  var app = typeof useApp === "function" ? useApp() : null;
  var isDark = app && app.themeOverride === "dark";
  if (!habit) return null;
  var accent = bosHabitColor(habit);
  var log = habit.log || {};
  var keys = [],
    base = new Date();
  for (var i = 34; i >= 0; i--) {
    var d = new Date(base.getTime());
    d.setDate(d.getDate() - i);
    keys.push(d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2));
  }
  var doneFill = bosCellFill(accent, 1);
  var empty = typeof bosCellEmpty === "function" ? bosCellEmpty(accent, isDark) : isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)";
  var radius = square ? 4 : "50%"; // David: везде КРУЖКИ по умолчанию; квадраты — по тоглу
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(7, 1fr)",
      gap: 3,
      width: "100%",
      maxWidth: 154
    }
  }, keys.map(function (k, i) {
    var fl = !!log[k];
    return /*#__PURE__*/React.createElement("span", {
      key: i,
      style: {
        aspectRatio: "1/1",
        borderRadius: radius,
        background: fl ? doneFill : empty,
        boxShadow: fl ? bosCellGlass(isDark) : "none"
      }
    });
  }));
}

// Меню шестерёнки — ДВЕ вкладки: «Привычки» и «Цели» (David: у каждого свой стиль/пресеты). Само
// грузит и сохраняет оба стиля (bosSaveCardStyle/bosSaveGoalStyle → event → список перерисовывается).
// Привычки: форма квадрат/строка + отметки/клетки/лица/название. Цели: форма БАННЕР/квадрат + орбиты
// (мини-орбита привычек+людей) + прогресс + название. Всплывашка у шестерёнки (как CreateMenuLive).
function CardStyleMenuLive({
  open,
  onClose,
  anchorRef
}) {
  var [pos, setPos] = React.useState(null);
  var [tab, setTab] = React.useState("habits");
  var [hs, setHs] = React.useState(bosLoadCardStyle);
  var [gs, setGs] = React.useState(bosLoadGoalStyle);
  React.useEffect(() => {
    if (!open) return;
    setHs(bosLoadCardStyle());
    setGs(bosLoadGoalStyle());
    if (anchorRef && anchorRef.current) {
      var r = anchorRef.current.getBoundingClientRect();
      setPos({
        right: Math.round(window.innerWidth - r.right),
        top: Math.round(r.bottom + 10)
      });
    }
  }, [open]);
  if (!open || !pos) return null;
  var setH = patch => {
    var n = Object.assign({}, hs, patch);
    setHs(n);
    bosSaveCardStyle(n);
  };
  var setG = patch => {
    var n = Object.assign({}, gs, patch);
    setGs(n);
    bosSaveGoalStyle(n);
  };
  var SQ = /*#__PURE__*/React.createElement("svg", {
    width: "34",
    height: "20",
    viewBox: "0 0 34 20",
    fill: "none"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "2",
    y: "3",
    width: "13",
    height: "14",
    rx: "3",
    stroke: "#0a0a0a",
    strokeWidth: "1.6"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "19",
    y: "3",
    width: "13",
    height: "14",
    rx: "3",
    stroke: "#0a0a0a",
    strokeWidth: "1.6"
  }));
  var RC = /*#__PURE__*/React.createElement("svg", {
    width: "34",
    height: "20",
    viewBox: "0 0 34 20",
    fill: "none"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "2",
    y: "2.5",
    width: "30",
    height: "6.5",
    rx: "2.5",
    stroke: "#0a0a0a",
    strokeWidth: "1.6"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "2",
    y: "11",
    width: "30",
    height: "6.5",
    rx: "2.5",
    stroke: "#0a0a0a",
    strokeWidth: "1.6"
  }));
  var BN = /*#__PURE__*/React.createElement("svg", {
    width: "34",
    height: "20",
    viewBox: "0 0 34 20",
    fill: "none"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "2",
    y: "3",
    width: "30",
    height: "14",
    rx: "3",
    stroke: "#0a0a0a",
    strokeWidth: "1.6"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "8",
    cy: "10",
    r: "2.4",
    stroke: "#0a0a0a",
    strokeWidth: "1.4"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "14",
    y: "7",
    width: "15",
    height: "2",
    rx: "1",
    fill: "#0a0a0a"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "14",
    y: "12",
    width: "10",
    height: "2",
    rx: "1",
    fill: "#0a0a0a",
    opacity: "0.5"
  }));
  var formBtn = (key, label, icon, cur, onPick) => /*#__PURE__*/React.createElement("button", {
    key: key,
    onClick: () => onPick(key),
    className: "tap",
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 7,
      padding: "13px 6px",
      borderRadius: 14,
      border: cur === key ? "1.5px solid #0a0a0a" : "1.5px solid rgba(10,10,10,0.12)",
      background: cur === key ? "rgba(10,10,10,0.05)" : "transparent",
      cursor: "pointer"
    }
  }, icon, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: "#0a0a0a"
    }
  }, label));
  // Компактный сегмент — СВОЙ (шаренный .tab-pill с padding 18px не влезал в 258px).
  var seg = (val, opts, onPick) => /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4,
      background: "rgba(10,10,10,0.05)",
      borderRadius: 12,
      padding: 4
    }
  }, opts.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.v,
    onClick: () => onPick(o.v),
    className: "tap",
    style: {
      flex: 1,
      minWidth: 0,
      border: 0,
      borderRadius: 9,
      padding: "7px 4px",
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer",
      whiteSpace: "nowrap",
      background: val === o.v ? "#fff" : "transparent",
      color: val === o.v ? "#0a0a0a" : "rgba(10,10,10,0.5)",
      boxShadow: val === o.v ? "0 1px 3px rgba(0,0,0,0.08)" : "none"
    }
  }, o.l)));
  var toggleRow = (label, on, onCh) => /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "9px 2px",
      fontSize: 14.5,
      fontWeight: 500,
      color: "#0a0a0a"
    }
  }, /*#__PURE__*/React.createElement("span", null, label), /*#__PURE__*/React.createElement(Switch, {
    on: on,
    onChange: onCh
  }));
  var divider = /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: "rgba(10,10,10,0.08)",
      margin: "13px 0 10px"
    }
  });
  return ReactDOM.createPortal(/*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 8000,
      background: "rgba(18,22,38,0.16)",
      animation: "dimIn 0.18s ease both"
    }
  }, /*#__PURE__*/React.createElement("div", {
    role: "menu",
    onClick: e => e.stopPropagation(),
    style: {
      position: "fixed",
      right: pos.right,
      top: pos.top,
      transformOrigin: "top right",
      animation: "bosMenuPop 0.34s cubic-bezier(0.34,1.5,0.4,1) both",
      width: 258,
      padding: 14,
      borderRadius: 22,
      background: "rgba(255,255,255,0.86)",
      WebkitBackdropFilter: "blur(34px) saturate(180%)",
      backdropFilter: "blur(34px) saturate(180%)",
      border: "0.5px solid rgba(255,255,255,0.7)",
      boxShadow: "0 16px 44px rgba(20,30,60,0.26)",
      color: "#0a0a0a"
    }
  }, seg(tab, [{
    v: "habits",
    l: "Привычки"
  }, {
    v: "goals",
    l: "Цели"
  }], setTab), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 12
    }
  }), tab === "habits" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, formBtn("square", "Квадрат", SQ, hs.form, k => setH({
    form: k
  })), formBtn("rect", "Строка", RC, hs.form, k => setH({
    form: k
  }))), divider, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      marginBottom: 8,
      color: "rgba(10,10,10,0.5)"
    }
  }, "\u041E\u0442\u043C\u0435\u0442\u043A\u0438"), seg(hs.marks, [{
    v: "none",
    l: "Нет"
  }, {
    v: "week",
    l: "Неделя"
  }, {
    v: "month",
    l: "Месяц"
  }], v => setH({
    marks: v
  })), hs.marks !== "none" && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, seg(hs.cells || "round", [{
    v: "round",
    l: "Кружки"
  }, {
    v: "square",
    l: "Квадраты"
  }], v => setH({
    cells: v
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6
    }
  }, toggleRow("Лица друзей", hs.faces, v => setH({
    faces: v
  })), hs.form === "square" && toggleRow("Название", hs.name, v => setH({
    name: v
  })))) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, formBtn("banner", "Баннер", BN, gs.form, k => setG({
    form: k
  })), formBtn("square", "Квадрат", SQ, gs.form, k => setG({
    form: k
  }))), divider, /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 0
    }
  }, toggleRow("Орбиты вокруг цели", gs.orbits, v => setG({
    orbits: v
  })), toggleRow("Прогресс", gs.progress, v => setG({
    progress: v
  })), toggleRow("Название", gs.name, v => setG({
    name: v
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "rgba(10,10,10,0.42)",
      lineHeight: 1.4,
      padding: "4px 2px 0"
    }
  }, "\u041E\u0440\u0431\u0438\u0442\u044B \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u044E\u0442 \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0438 \u0438 \u043B\u044E\u0434\u0435\u0439 \u0432\u043E\u043A\u0440\u0443\u0433 \u0446\u0435\u043B\u0438 \u2014 \u043F\u0440\u0435\u0432\u044C\u044E, \u0432\u043E\u043A\u0440\u0443\u0433 \u0447\u0435\u0433\u043E \u043E\u043D\u0430.")))), document.body);
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
    (async () => {
      var ref = null;
      try {
        ref = window.bosCloud && window.bosCloud.inviteCode ? await window.bosCloud.inviteCode() : null;
      } catch (e) {}
      // Круг цели = тот же ОБЩИЙ механизм, что у привычек-вместе: shareCode + createSharedHabit,
      // ссылка hb_<code> → друг вступает в ТОТ ЖЕ круг → его лицо появляется на твоей цели.
      var code = goal && goal.shareCode;
      if (code && window.bosCloud && window.bosCloud.enabled() && window.bosCloud.createSharedHabit && typeof bosSharedHabitLink === "function") {
        try {
          await window.bosCloud.createSharedHabit({
            code: code,
            name: goal.name,
            emoji: goal.emoji,
            color: goal.color
          });
        } catch (e) {}
        if (on) {
          setShareUrl(bosSharedHabitLink(code, ref));
          return;
        }
      }
      if (on) setShareUrl(ref && typeof bosInviteLink === "function" ? bosInviteLink(ref) : APP_URL);
    })();
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
  }, bosIcon(goal?.emoji || "🎯", 30, goal?.color)), /*#__PURE__*/React.createElement("div", {
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
  // Rebuilt only when the day-mood map (or today's slot) changes — not on every parent
  // re-render (this widget re-renders on any Home state change).
  var last7 = React.useMemo(() => [0, 1, 2, 3, 4, 5, 6].map(i => {
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
  }), [app?.dayMoods, _monOff]);
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
  }, /*#__PURE__*/React.createElement(MiniOrb, {
    size: 22,
    tint: tintFromMood(d.m.c)
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

/* Home-hero avatar — David: «орб-состояние из-под аватарки убрать, поставить наш стандартный
   кружок со стеклом». A STATIC grey glass disc (the SAME material as the people discs and the
   pencil button), holding the user's REAL avatar (photo / memoji / emoji / default face via
   BosAvatar). The tile sheen + a bright top rim sit ON TOP so it reads as glass — no mood tint,
   no animated orb. Drop-in for HeroOrbFace (same avatar / inset / size props). */
function HeroAvatarGlassLive({
  avatar,
  inset = 6,
  size = 60
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset,
      borderRadius: "50%",
      overflow: "hidden",
      background: "linear-gradient(150deg, #eef1f6, #dadfe7)",
      boxShadow: "0 2px 7px rgba(0,0,0,0.12)"
    }
  }, /*#__PURE__*/React.createElement(BosAvatar, {
    avatar: avatar,
    size: size,
    style: {
      position: "absolute",
      inset: 0,
      borderRadius: "50%"
    }
  }), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      inset: 0,
      borderRadius: "50%",
      pointerEvents: "none",
      background: BOS_TILE_SHEEN,
      boxShadow: "inset 0 1px 1.5px rgba(255,255,255,0.9), inset 0 -3px 6px rgba(0,0,0,0.07), inset 0 0 0 0.5px rgba(0,0,0,0.06)"
    }
  }));
}

/* Account avatar for the «Сводка от ИИ» hero — the glass disc + a MINIMALIST XP-to-next-level
   ring (gold light→dark + glass sheen). David: «верни аватар в блок сводки — это главный блок с
   фишкой ИИ; колечко минималистичное = XP до уровня». Tap → profile (orbits + settings). */
function HeroAccountAvatarLive({
  navigate,
  avatar,
  pct = 0,
  size = 60,
  isDark,
  level = 0
}) {
  var r = size / 2 - 2; // ring radius (strokeWidth 2.5, ~1.25 margin each side)
  var C = 2 * Math.PI * r;
  var off = C * (1 - (pct || 0) / 100);
  var lvlSz = Math.round(size * 0.34); // level badge ≈ a third of the avatar
  return /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("profile"),
    className: "tap",
    title: "\u041F\u0440\u043E\u0444\u0438\u043B\u044C",
    "aria-label": "\u041F\u0440\u043E\u0444\u0438\u043B\u044C, \u043E\u0440\u0431\u0438\u0442\u044B \u0438 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438",
    style: {
      flexShrink: 0,
      position: "relative",
      width: size,
      height: size,
      background: "transparent",
      border: 0,
      padding: 0,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 " + size + " " + size,
    style: {
      position: "absolute",
      inset: 0,
      transform: "rotate(-90deg)",
      zIndex: 2
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: "bosXpRingH",
    x1: "0",
    y1: "0",
    x2: "1",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0",
    stopColor: "#FFE777"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "0.5",
    stopColor: "#F4B72A"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "1",
    stopColor: "#E08A00"
  })), /*#__PURE__*/React.createElement("linearGradient", {
    id: "bosXpSheenH",
    x1: "0",
    y1: "0",
    x2: "1",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0",
    stopColor: "rgba(255,255,255,0.82)"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "0.45",
    stopColor: "rgba(255,255,255,0)"
  }))), /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    stroke: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
    strokeWidth: "2.5",
    fill: "none"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    stroke: "url(#bosXpRingH)",
    strokeWidth: "2.5",
    fill: "none",
    strokeLinecap: "round",
    strokeDasharray: C,
    strokeDashoffset: off,
    style: {
      transition: "stroke-dashoffset 0.7s cubic-bezier(0.22,0.61,0.36,1)"
    }
  }), /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    stroke: "url(#bosXpSheenH)",
    strokeWidth: "2.5",
    fill: "none",
    strokeLinecap: "round",
    strokeDasharray: C,
    strokeDashoffset: off,
    style: {
      mixBlendMode: "screen"
    }
  })), /*#__PURE__*/React.createElement(HeroAvatarGlassLive, {
    avatar: avatar,
    inset: 7,
    size: size - 14
  }), level > 0 && (() => {
    var bc = size / 2 + r * 0.7071; // точка на кольце под углом 45° (низ-право)
    return /*#__PURE__*/React.createElement("span", {
      "aria-hidden": true,
      style: {
        position: "absolute",
        left: bc - lvlSz / 2,
        top: bc - lvlSz / 2,
        zIndex: 3,
        minWidth: lvlSz,
        height: lvlSz,
        padding: "0 4px",
        boxSizing: "border-box",
        borderRadius: 999,
        background: "linear-gradient(180deg,#FFE777,#F4B72A)",
        color: "#4a3800",
        fontSize: Math.round(lvlSz * 0.56),
        fontWeight: 800,
        lineHeight: lvlSz - 3 + "px",
        textAlign: "center",
        letterSpacing: "-0.3px",
        border: "1.5px solid var(--card)",
        boxShadow: "0 1px 3px rgba(224,138,0,0.5), inset 0 1px 0.5px rgba(255,255,255,0.6)"
      }
    }, level);
  })());
}

/* HomeHeroSwipe → live-only: the real new user's hero — page 1 ONLY (the demo's balance
   wheel / orbit 2nd page was removed). newbie (no habits) → "С чего начать" hints; else →
   AI-brief summary + action pills. The account avatar (XP ring) lives here — the main AI block. */
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
  // Pills use bosChipGlass(isDark) — grey glass, identical to the Habits «Быстрое добавление» chips.
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
  // XP-to-next-level percent for the minimalist avatar ring (today's progress lives in the
  // «Привычки» card + «Эта неделя», so the ring is freed for level progress — David's call).
  var _heroXp = typeof bosLiveXPLive === "function" ? bosLiveXPLive(heroApp) : 0;
  var _heroLI = (typeof bosLevelInfoLive === "function" ? bosLevelInfoLive(_heroXp) : null) || {};
  var _heroPct = _heroLI.pct || 0;
  var _heroLevel = _heroLI.level || 0;
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
    key: _homeSummary,
    style: {
      fontSize: 13,
      fontWeight: 400,
      color: "var(--text)",
      lineHeight: 1.45,
      letterSpacing: "-0.1px",
      animation: _liveBrief ? "briefFade 0.5s ease both" : undefined
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-block",
      verticalAlign: "-2px",
      marginRight: 6
    }
  }, /*#__PURE__*/React.createElement(I.Sparkles, {
    size: 13,
    color: "#EF9F14",
    filled: true,
    strokeWidth: 0
  })), _liveBrief ? _homeSummary : "Расскажи о себе — и я подскажу, с каких привычек начать.")), /*#__PURE__*/React.createElement(HeroAccountAvatarLive, {
    navigate: navigate,
    avatar: heroApp?.avatar,
    pct: _heroPct,
    level: _heroLevel,
    size: 56,
    isDark: isDark
  })), /*#__PURE__*/React.createElement("div", {
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
      ...bosChipGlass(isDark),
      border: 0,
      minWidth: 0,
      maxWidth: "calc(50% - 3px)",
      borderRadius: 999,
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0
    }
  }, c.i), /*#__PURE__*/React.createElement("span", {
    style: {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, c.t))))) : /*#__PURE__*/React.createElement("div", {
    key: "quote",
    style: {
      position: "relative",
      padding: 16,
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    key: _homeSummary,
    style: {
      fontSize: 13,
      fontWeight: 400,
      color: "var(--text)",
      lineHeight: 1.45,
      letterSpacing: "-0.1px",
      animation: "briefFade 0.5s ease both"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-block",
      verticalAlign: "-2px",
      marginRight: 6
    }
  }, /*#__PURE__*/React.createElement(I.Sparkles, {
    size: 13,
    color: "#EF9F14",
    filled: true,
    strokeWidth: 0
  })), _homeSummary)), /*#__PURE__*/React.createElement(HeroAccountAvatarLive, {
    navigate: navigate,
    avatar: heroApp?.avatar,
    pct: _heroPct,
    level: _heroLevel,
    size: 64,
    isDark: isDark
  })), /*#__PURE__*/React.createElement("div", {
    key: _pillsKey,
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6,
      marginTop: 14
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
      ...bosChipGlass(isDark),
      border: 0,
      minWidth: 0,
      maxWidth: "calc(50% - 3px)",
      borderRadius: 999,
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      animation: _livePills ? "briefPop 0.45s cubic-bezier(0.22,0.9,0.3,1.2) both " + i * 0.06 + "s" : undefined
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0
    }
  }, bosPillIcon(c)), /*#__PURE__*/React.createElement("span", {
    style: {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, bosPillLabel(c))))));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: cardBg,
      border: cardBd,
      borderRadius: 22,
      position: "relative",
      overflow: "hidden",
      transform: "translateZ(0)",
      boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      width: "100%"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      flexShrink: 0
    }
  }, page1)));
}

/* CloudTeamsDiscoverLive — live-only fork of core's CloudTeamsDiscover. Same cloud fetch
   + join flow, but QUIET while loading: for a real user the «open teams nearby» result is
   usually empty, and the core version shows a skeleton that then collapses to nothing —
   a flash-then-vanish at the page bottom (David: «показывает на секунду, потом исчезает»).
   Here it stays silent until real teams arrive, then the section appears once, below the
   create-CTA, shifting nothing above it. The frozen demo keeps core's CloudTeamsDiscover. */
function CloudTeamsDiscoverLive({
  app
}) {
  var [list, setList] = React.useState(null);
  var [busy, setBusy] = React.useState({});
  var [requested, setRequested] = React.useState({});
  React.useEffect(() => {
    var on = true;
    try {
      if (window.bosCloud && window.bosCloud.enabled()) {
        window.bosCloud.discoverTeams().then(ts => {
          if (on) setList(Array.isArray(ts) ? ts : []);
        }).catch(() => {
          if (on) setList([]);
        });
      } else setList([]);
    } catch (e) {
      setList([]);
    }
    return () => {
      on = false;
    };
  }, []);
  // While LOADING (null) → render nothing (no promissory skeleton that pops then collapses).
  // Once LOADED-EMPTY ([]) → a warm, HONEST invite: «Найти» is the community pulse, so the live
  // section shouldn't read as a dead blank — but we never fabricate circles that don't exist.
  if (!list) return null;
  if (!list.length) return /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: "var(--text-4)",
      padding: "4px 4px 8px"
    }
  }, "\uD83C\uDF10 \u041E\u0442\u043A\u0440\u044B\u0442\u044B\u0435 \u043A\u0440\u0443\u0433\u0438"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--card)",
      borderRadius: 22,
      padding: "22px 18px",
      boxShadow: "var(--card-shadow)",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 30,
      lineHeight: 1
    }
  }, "\uD83C\uDF31"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 600,
      color: "var(--text)",
      marginTop: 9,
      letterSpacing: "-0.2px"
    }
  }, "\u0417\u0434\u0435\u0441\u044C \u043E\u0436\u0438\u0432\u0443\u0442 \u043A\u0440\u0443\u0433\u0438 \u043B\u044E\u0434\u0435\u0439"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-4)",
      marginTop: 5,
      lineHeight: 1.45,
      maxWidth: 250,
      margin: "5px auto 0"
    }
  }, "\u041D\u0430\u0447\u043D\u0438 \u0447\u0435\u043B\u043B\u0435\u043D\u0434\u0436 \u0432\u044B\u0448\u0435 \u0438\u043B\u0438 \u043F\u043E\u0437\u043E\u0432\u0438 \u0434\u0440\u0443\u0433\u0430 \u2014 \u0438 \u0432\u0430\u0448 \u043A\u0440\u0443\u0433 \u043F\u043E\u044F\u0432\u0438\u0442\u0441\u044F \u0442\u0443\u0442 \u043F\u0435\u0440\u0432\u044B\u043C.")));
  // Send a JOIN REQUEST («из поиска — по заявке»). The creator approves it later; pre-SQL
  // (no approval system yet) the call falls back to an instant join.
  var join = t => {
    setBusy(b => Object.assign({}, b, {
      [t.id]: true
    }));
    try {
      window.bosCloud.requestJoin(t.id).then(res => {
        setBusy(b => Object.assign({}, b, {
          [t.id]: false
        }));
        if (!res) return;
        if (res.pending) {
          setRequested(r => Object.assign({}, r, {
            [t.id]: true
          }));
          return;
        }
        // fallback: actually joined → add to my teams + drop from the discover list
        window.bosCloud.teamMembers(t.id).then(mem => {
          if (app && app.addTeam) app.addTeam({
            cloudId: t.id,
            joined: true,
            name: t.name,
            emblem: t.emblem || "✨",
            accent: "#dbe9ff",
            vis: t.vis,
            goal: "Общая цель",
            target: t.goalTarget || 0,
            current: 0,
            unit: "",
            date: "",
            progress: 0,
            members: (mem || []).map(m => ({
              name: m.name || "Участник",
              initials: (m.name || "?").slice(0, 1),
              color: "#cfe1ff",
              avatar: m.avatar,
              pct: 0
            }))
          });
          setList(l => (l || []).filter(x => x.id !== t.id));
        });
      });
    } catch (e) {
      setBusy(b => Object.assign({}, b, {
        [t.id]: false
      }));
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: "var(--text-4)",
      padding: "4px 4px 8px"
    }
  }, "\uD83C\uDF10 \u041E\u0442\u043A\u0440\u044B\u0442\u044B\u0435 \u043A\u0440\u0443\u0433\u0438"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, list.map(t => /*#__PURE__*/React.createElement("div", {
    key: t.id,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      background: "var(--card)",
      borderRadius: 22,
      padding: 14,
      boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 44,
      height: 44,
      borderRadius: 14,
      background: "linear-gradient(150deg, #eef1f6, #dadfe7)",
      boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.06)",
      display: "grid",
      placeItems: "center",
      fontSize: 24,
      flexShrink: 0
    }
  }, bosIcon(t.emblem || "✨", 24, null)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15.5,
      fontWeight: 600,
      color: "var(--text)"
    }
  }, t.name), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      fontSize: 11,
      fontWeight: 600,
      color: "var(--text-2)",
      ...bosChipGlass(false),
      padding: "3px 9px",
      borderRadius: 999
    }
  }, "\uD83C\uDF10 \u041E\u0442\u043A\u0440\u044B\u0442\u0430\u044F \xB7 ", t.members, " \u0443\u0447\u0430\u0441\u0442."))), /*#__PURE__*/React.createElement("button", {
    onClick: () => join(t),
    disabled: busy[t.id] || requested[t.id],
    className: "tap",
    style: {
      flexShrink: 0,
      background: busy[t.id] || requested[t.id] ? "var(--card-2)" : "#0a0a0a",
      color: busy[t.id] || requested[t.id] ? "var(--text-3)" : "#fff",
      border: 0,
      borderRadius: 999,
      padding: "9px 16px",
      fontSize: 13,
      fontWeight: 600,
      whiteSpace: "nowrap"
    }
  }, requested[t.id] ? "Заявка отправлена" : busy[t.id] ? "…" : "Вступить")))));
}

/* ЗАСЕВ «НАЙТИ» — курируемая витрина челленджей-кругов ДО запуска (ноль органики TG → без засева
   раздел пуст и мёртв). Это ШАБЛОНЫ: «Начать» создаёт ТВОЙ круг из шаблона (копия в «Целях») +
   якорь-практику в «Привычках» — тот же движок круга, что у курса и цели-с-кругом. Честно: БЕЗ
   фейковых счётчиков участников (твой старт = соло-копия); реальные открытые круги других людей
   показывает CloudTeamsDiscoverLive ниже. seedId на круге = защита от дубля. LIVE only. */
// Курируемая витрина «Найти» — разные сферы и разные метрики (не только км; David: «метрики у
// каждого свои»), у каждого крючок-почему. Цвета ВЫКЛ — эмблемы на сером стекле как везде.
// reward = ПРИЗ XP за финиш челленджа (David: «хочу награду за финиш»). Реализован через
// ПРОВЕРЕННУЮ механику командной XP-ставки: круг создаётся со stake=reward (unlock-only, без
// списания) → дошёл до цели → settleTeamGoal начисляет приз, уровень растёт (тот же путь, что
// David тестировал живьём на командных целях). Никакой новой XP-проводки.
// Лесенка СРОКОВ от нескольких дней до месяца (David: «привычки как от нескольких дней, так и
// месячные, и экспа соответственно»). Бонус за финиш растёт с длительностью: 3д→60 … 30д→300.
// Срок ВСЕГДА виден на карточке — это и есть условие, за которое открывается бонус.
var SEED_CIRCLES = [{
  id: "seed-spark",
  name: "Разогрев",
  emblem: "⚡",
  goalText: "3 дня",
  target: 3,
  unit: "дня",
  type: "streak",
  reward: 60,
  hook: "Три дня подряд — поймай ритм",
  practice: {
    name: "Мой первый шаг",
    emoji: "⚡"
  }
}, {
  id: "seed-week",
  name: "Неделя силы",
  emblem: "💪",
  goalText: "7 дней",
  target: 7,
  unit: "дней",
  type: "streak",
  reward: 120,
  hook: "Семь дней без пропусков",
  practice: {
    name: "Зарядка",
    emoji: "💪"
  }
}, {
  id: "seed-steps",
  name: "10 000 шагов",
  emblem: "👟",
  goalText: "14 дней",
  target: 14,
  unit: "дней",
  type: "collective",
  reward: 200,
  hook: "Две недели движения — счёт общий",
  practice: {
    name: "Прогулка",
    emoji: "👟"
  }
}, {
  id: "seed-morning",
  name: "Утро чемпионов",
  emblem: "🌅",
  goalText: "21 день",
  target: 21,
  unit: "дней",
  type: "streak",
  reward: 250,
  hook: "Вставай раньше — задаёшь тон дню",
  practice: {
    name: "Ранний подъём",
    emoji: "⏰"
  }
}, {
  id: "seed-meditate",
  name: "Тихий час",
  emblem: "🧘",
  goalText: "30 дней",
  target: 30,
  unit: "дней",
  type: "streak",
  reward: 300,
  hook: "5 минут тишины каждый день — месяц",
  practice: {
    name: "Медитация",
    emoji: "🧘"
  }
}, {
  id: "seed-read",
  name: "Книжный клуб",
  emblem: "📚",
  goalText: "месяц",
  target: 30,
  unit: "дней",
  type: "collective",
  reward: 300,
  hook: "По главе в день — за месяц целая книга",
  practice: {
    name: "Чтение",
    emoji: "📖"
  }
}];
function SeedCirclesShowcaseLive({
  app,
  navigate
}) {
  var start = s => {
    if (window.tgHaptic) {
      try {
        window.tgHaptic("success");
      } catch (e) {}
    }
    var existing = (app?.teams || []).find(t => t.seedId === s.id);
    if (existing) {
      navigate("team-detail", {
        team: existing
      });
      return;
    } // уже начал → просто в круг
    var teamObj = {
      name: s.name,
      emblem: s.emblem,
      accent: s.accent,
      vis: "private",
      seedId: s.id,
      goal: s.goalText,
      type: s.type,
      target: s.target || 0,
      current: 0,
      unit: s.unit || "",
      stake: s.reward || 0,
      date: "",
      progress: 0,
      members: [] // ПРИЗ за финиш = ставка (unlock-only, без списания)
    };
    var nt = app?.addTeam(teamObj); // круг → сразу в «Целях» (офлайн-ок)
    var practiceHabit = {
      name: s.practice.name,
      emoji: s.practice.emoji,
      color: null,
      days: [1, 1, 1, 1, 1, 1, 1],
      goalPerDay: 1,
      reminder: {
        on: false,
        time: "09:00"
      },
      log: {}
    };
    var opened = false;
    try {
      if (nt && window.bosCloud && window.bosCloud.enabled()) {
        window.bosCloud.createTeam({
          name: s.name,
          emblem: s.emblem,
          vis: "private",
          goalKind: s.goalText,
          goalTarget: s.target || 0,
          goal: {
            type: s.type,
            target: s.target || 0,
            unit: s.unit || "",
            title: s.name,
            stake: s.reward || 0
          }
        }).then(async row => {
          if (row && row.id) {
            if (app.updateTeam) app.updateTeam(nt._id, {
              cloudId: row.id
            });
            var th = null;
            try {
              th = await window.bosCloud.addTeamHabit(row.id, {
                name: s.practice.name,
                emoji: s.practice.emoji,
                isMain: true
              });
            } catch (e) {}
            app?.addHabit({
              ...practiceHabit,
              teamId: row.id,
              teamHabitId: th && th.id
            });
          } else {
            app?.addHabit(practiceHabit);
          }
          navigate("team-detail", {
            team: {
              ...nt,
              cloudId: row && row.id
            }
          });
        }).catch(() => {
          app?.addHabit(practiceHabit);
          navigate("team-detail", {
            team: nt
          });
        });
        opened = true;
      }
    } catch (e) {}
    if (!opened) {
      app?.addHabit(practiceHabit);
      navigate("team-detail", {
        team: nt
      });
    } // офлайн/превью
  };
  // Honest XP framing: the practice habit a challenge plants earns the SAME +10 XP per day as
  // any habit (bosTotalXPLive). So «давать экспу за челлендж» = surface that real reward — no
  // fabricated bonus. Gold pill = the app's reward/XP language (level badge, achievement XP).
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      padding: "4px 4px 10px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: "var(--text-4)"
    }
  }, "\uD83D\uDD25 \u0427\u0435\u043B\u043B\u0435\u043D\u0434\u0436\u0438"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-4)"
    }
  }, "\u0432\u0441\u0442\u0443\u043F\u0430\u0439 \u0437\u0430 \u0441\u0435\u043A\u0443\u043D\u0434\u0443 \u2192")), /*#__PURE__*/React.createElement("div", {
    className: "bos-hscroll",
    style: {
      display: "flex",
      gap: 11,
      overflowX: "auto",
      padding: "0 0 4px",
      scrollSnapType: "x proximity",
      WebkitOverflowScrolling: "touch"
    }
  }, SEED_CIRCLES.map(s => {
    var joined = (app?.teams || []).some(t => t.seedId === s.id);
    return /*#__PURE__*/React.createElement("div", {
      key: s.id,
      className: "tap",
      onClick: () => start(s),
      style: {
        flex: "0 0 auto",
        width: 162,
        scrollSnapAlign: "start",
        background: "var(--card)",
        borderRadius: 22,
        padding: 14,
        boxShadow: "var(--card-shadow)",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 44,
        height: 44,
        borderRadius: 14,
        background: "linear-gradient(150deg, #eef1f6, #dadfe7)",
        boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.06)",
        display: "grid",
        placeItems: "center",
        fontSize: 23,
        flexShrink: 0
      }
    }, bosIcon(s.emblem, 23, null)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15,
        fontWeight: 600,
        color: "var(--text)",
        letterSpacing: "-0.2px",
        marginTop: 11,
        lineHeight: 1.25
      }
    }, s.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: "var(--text-4)",
        marginTop: 3,
        lineHeight: 1.35,
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
        minHeight: 31
      }
    }, s.hook), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minHeight: 10
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        alignSelf: "flex-start",
        display: "flex",
        flexDirection: "column",
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        alignSelf: "flex-start",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        ...bosChipGlass(false),
        padding: "3px 9px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        color: "var(--text-2)"
      }
    }, "\u23F1 ", s.goalText), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        background: "#0a0a0a",
        color: "#FEDE34",
        fontWeight: 700,
        fontSize: 11,
        letterSpacing: "0.2px",
        borderRadius: 999,
        padding: "3px 9px"
      }
    }, "+", s.reward, " XP"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10.5,
        color: "var(--text-4)",
        fontWeight: 600
      }
    }, "\u0437\u0430 \u0444\u0438\u043D\u0438\u0448"))), /*#__PURE__*/React.createElement("span", {
      style: {
        marginTop: 9,
        fontSize: 12.5,
        fontWeight: 600,
        color: joined ? "var(--text-4)" : "var(--text-2)",
        display: "inline-flex",
        alignItems: "center",
        gap: 2
      }
    }, joined ? "Открыть" : "Начать", " ", /*#__PURE__*/React.createElement(I.ChevronRight, {
      size: 14
    })));
  })));
}

/* ПАРТНЁРЫ — «на что потратить XP». David: не скидки (как в старом демо), а ЖИВЫЕ БЕСПЛАТНЫЕ вещи
   (медитация, бачата, бокс…), которые стоят XP из копилки. Нужно, чтобы человек СРАЗУ видел, ради чего
   копит: «о, на это я мог бы потратить экспу». Доступно СРАЗУ (в отличие от Нетворка — тот с 10 уровня).
   Партнёрская выдача пока плейсхолдер (как курсы): забрал → «покажи на входе». Отмеченное живёт в
   localStorage (bos:redeemedPartners), трата (spentXP) — в копилке через app.spendXP. */
// accent = НАСЫЩЕННЫЙ пастель (не блёклый — David: карточки читались серовато). about/address/dates/duration
// кормят детальную страницу партнёра. Адреса/даты — ПЛЕЙСХОЛДЕР (David: «потенциальный адрес/даты»).
var BOS_PARTNERS = [{
  id: "medit",
  name: "Открытая медитация",
  emblem: "🧘",
  accent: "#B9D4FF",
  cost: 250,
  tags: ["Ум", "Покой"],
  what: "Час осознанности с гидом в студии",
  about: "Спокойная групповая практика: дыхание, сканирование тела и тишина под руководством гида. Новичкам — самое то, опыт не нужен.",
  address: "Студия «Тишина» · ул. Пушкина, 12",
  dates: "Пн и Чт · 19:00",
  duration: "60 мин",
  limit: "до 12 мест",
  perk: "Ачивка «Тихий ум»"
}, {
  id: "bachata",
  name: "Урок бачаты",
  emblem: "💃",
  accent: "#FFC7DD",
  cost: 350,
  tags: ["Танец", "Тело"],
  what: "Первое занятие в танцевальной студии",
  about: "Базовые шаги и связки бачаты в лёгкой атмосфере. Партнёр не нужен — распределят на месте, менять можно свободно.",
  address: "Танцстудия «Ритмо» · пр. Мира, 8",
  dates: "Вт и Сб · 20:00",
  duration: "75 мин",
  limit: "до 20 пар",
  perk: "Ачивка «Первый танец»"
}, {
  id: "box",
  name: "Пробный бокс",
  emblem: "🥊",
  accent: "#FFCFAD",
  cost: 400,
  tags: ["Сила", "Энергия"],
  what: "Тренировка с личным тренером",
  about: "Постановка техники, работа на лапах и мешке под присмотром тренера. Бинты и перчатки выдают на месте.",
  address: "Зал «Ринг» · ул. Лесная, 3",
  dates: "По будням · 18:00–21:00",
  duration: "60 мин",
  limit: "до 8 мест",
  perk: "Ачивка «Первый раунд»"
}, {
  id: "yoga",
  name: "Йога на рассвете",
  emblem: "🧘‍♀️",
  accent: "#BFEECF",
  cost: 250,
  tags: ["Тело", "Гибкость"],
  what: "Утренняя практика в парке",
  about: "Мягкая виньяса на свежем воздухе — встречаем рассвет и бережно тянемся. Коврик можно взять на месте.",
  address: "Парк Горького · южный вход",
  dates: "Сб и Вс · 7:30",
  duration: "50 мин",
  limit: "до 30 мест",
  perk: "Ачивка «Рассвет»"
}, {
  id: "coffee",
  name: "Кофе-встреча",
  emblem: "☕",
  accent: "#F0DCB0",
  cost: 150,
  tags: ["Отдых", "Люди"],
  what: "Чашка в партнёрской кофейне",
  about: "Спешелти-кофе и тёплое знакомство с людьми из твоего круга. Приходи один — уйдёшь не один.",
  address: "Кофейня «Зерно» · ул. Кофейная, 1",
  dates: "Каждый день · 9:00–20:00",
  duration: "—",
  limit: "до 6 гостей",
  perk: "Ачивка «Свой круг»"
}, {
  id: "art",
  name: "Арт-вечер",
  emblem: "🎨",
  accent: "#D8C4FF",
  cost: 300,
  tags: ["Творчество", "Поток"],
  what: "Живопись с нуля, без опыта",
  about: "Вечер интуитивной живописи: холст, краски и никакого «правильно». Всё для работы выдают на месте.",
  address: "Арт-пространство «Мазок» · ул. Радужная, 5",
  dates: "Пт · 19:00",
  duration: "120 мин",
  limit: "до 15 мест",
  perk: "Ачивка «Первый мазок»"
}];
function bosLoadRedeemedPartners() {
  try {
    return JSON.parse(localStorage.getItem("bos:redeemedPartners") || "{}") || {};
  } catch (e) {
    return {};
  }
}
// Общий помощник: пометить партнёра полученным (списание XP делает вызывающий через app.spendXP).
function bosMarkPartnerRedeemed(id) {
  var n = Object.assign({}, bosLoadRedeemedPartners(), {
    [id]: true
  });
  try {
    localStorage.setItem("bos:redeemedPartners", JSON.stringify(n));
  } catch (e) {}
  try {
    window.dispatchEvent(new Event("bos:partnersChanged"));
  } catch (e) {}
  return n;
}

// Горизонтальная лента партнёров про ТРАТУ XP. Цветные карточки-впечатления (см. ниже). Тап по карточке →
// нативная страница партнёра PartnerDetailLive (описание, адрес, даты, кнопка «Получить»).
function PartnersShowcaseLive({
  app,
  navigate,
  from = "community"
}) {
  var [redeemed, setRedeemed] = React.useState(bosLoadRedeemedPartners);
  React.useEffect(function () {
    var h = function () {
      setRedeemed(bosLoadRedeemedPartners());
    };
    window.addEventListener("bos:partnersChanged", h); // деталь-страница выкупила → карточка тут же ✓
    return function () {
      window.removeEventListener("bos:partnersChanged", h);
    };
  }, []);
  var openPartner = p => {
    if (window.tgHaptic) {
      try {
        window.tgHaptic("selection");
      } catch (e) {}
    }
    navigate("partner-detail", {
      partner: p,
      from: from
    });
  };
  // Карточки НАМЕРЕННО другого вида, чем привычки/челленджи (David: «партнёры — это НЕ привычки»). Привычка/
  // челлендж = белый тайл + серый значок. Партнёр = ЦВЕТНАЯ карточка целиком (насыщенный accent + светлый
  // градиент сверху для глубины + КРУПНЫЙ эмодзи без серого тайла) → «карточка-впечатление», отдельный вид.
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      padding: "4px 4px 10px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: "var(--text-4)"
    }
  }, "\uD83C\uDF81 \u041F\u043E\u0442\u0440\u0430\u0442\u0438\u0442\u044C XP"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-4)"
    }
  }, "\u0436\u0438\u0432\u043E\u0435 \u043E\u0442 \u043F\u0430\u0440\u0442\u043D\u0451\u0440\u043E\u0432 \u2192")), /*#__PURE__*/React.createElement("div", {
    className: "bos-hscroll",
    style: {
      display: "flex",
      gap: 11,
      overflowX: "auto",
      padding: "3px 0 18px",
      scrollSnapType: "x proximity",
      WebkitOverflowScrolling: "touch"
    }
  }, BOS_PARTNERS.map(p => {
    var got = !!redeemed[p.id];
    return /*#__PURE__*/React.createElement("div", {
      key: p.id,
      className: "tap",
      onClick: () => openPartner(p),
      style: {
        flex: "0 0 auto",
        width: 170,
        scrollSnapAlign: "start",
        borderRadius: 22,
        padding: 15,
        background: "linear-gradient(158deg, rgba(255,255,255,0.5), rgba(255,255,255,0) 58%), " + p.accent,
        boxShadow: "0 4px 11px rgba(50,40,20,0.10), inset 0 0 0 0.5px rgba(255,255,255,0.55)",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 36,
        lineHeight: 1
      }
    }, p.emblem), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15.5,
        fontWeight: 700,
        color: "#1b1b1f",
        marginTop: 12,
        letterSpacing: "-0.2px",
        lineHeight: 1.2
      }
    }, p.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: "rgba(27,27,31,0.62)",
        marginTop: 3,
        lineHeight: 1.35,
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
        minHeight: 31
      }
    }, p.what), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minHeight: 12
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: "rgba(255,255,255,0.82)",
        color: "#0a0a0a",
        fontWeight: 800,
        fontSize: 11.5,
        borderRadius: 999,
        padding: "4px 10px"
      }
    }, "\uD83E\uDE99 ", p.cost), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 700,
        color: got ? "#1E8E4E" : "#0a0a0a",
        display: "inline-flex",
        alignItems: "center",
        gap: 2
      }
    }, got ? /*#__PURE__*/React.createElement(I.Check, {
      size: 14,
      strokeWidth: 3
    }) : /*#__PURE__*/React.createElement(React.Fragment, null, "\u041E\u0442\u043A\u0440\u044B\u0442\u044C ", /*#__PURE__*/React.createElement(I.ChevronRight, {
      size: 13
    })))));
  })));
}

// СТРАНИЦА ПАРТНЁРА — нативная деталь (iOS-стиль): цветной hero в тон партнёру + крупный эмодзи, описание,
// сгруппированная карточка «где / когда / сколько» (line-иконки, hairline-разделители) и ЛИПКАЯ frosted-
// кнопка «Получить за N XP» внизу. Заменяет прежнюю шторку (David: хочу ПОПАДАТЬ на страницу с адресом/
// датами). Списывает копилку app.spendXP; bosMarkPartnerRedeemed помечает получённым + шлёт событие, чтобы
// карточки в лентах сразу встали ✓.
function PartnerDetailLive() {
  var {
    navigate,
    params
  } = useNav();
  var app = typeof useApp === "function" ? useApp() : null;
  var p = params && params.partner || BOS_PARTNERS[0];
  var back = params && params.from || "community";
  var isDark = app && app.themeOverride === "dark";
  var [got, setGot] = React.useState(function () {
    return !!bosLoadRedeemedPartners()[p.id];
  });
  var balance = typeof bosLiveSpendableXPLive === "function" ? bosLiveSpendableXPLive(app) : 0;
  var afford = balance >= p.cost;
  var redeem = () => {
    if (got || !afford) return;
    if (app && typeof app.spendXP === "function" && app.spendXP(p.cost)) {
      bosMarkPartnerRedeemed(p.id);
      setGot(true);
      if (window.tgHaptic) {
        try {
          window.tgHaptic("success");
        } catch (e) {}
      }
    }
  };
  var info = [{
    icon: /*#__PURE__*/React.createElement(I.MapPin, {
      size: 16,
      strokeWidth: 2
    }),
    l: "Где",
    v: p.address
  }, {
    icon: /*#__PURE__*/React.createElement(I.Calendar, {
      size: 16,
      strokeWidth: 2
    }),
    l: "Когда",
    v: p.dates
  }, {
    icon: /*#__PURE__*/React.createElement(I.Clock, {
      size: 16,
      strokeWidth: 2
    }),
    l: "Сколько",
    v: p.duration
  }].filter(r => r.v && r.v !== "—");
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      paddingBottom: 112
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      background: "linear-gradient(180deg, rgba(255,255,255,0.26), rgba(255,255,255,0) 44%), " + p.accent,
      marginTop: "calc(-1 * max(60px, var(--tg-top-inset, env(safe-area-inset-top, 0px))))",
      padding: "calc(max(60px, var(--tg-top-inset, env(safe-area-inset-top, 0px))) + 14px) 22px 30px",
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate(back),
    className: "tap",
    "aria-label": "\u041D\u0430\u0437\u0430\u0434",
    style: {
      width: 38,
      height: 38,
      borderRadius: "50%",
      border: 0,
      background: "rgba(255,255,255,0.55)",
      display: "grid",
      placeItems: "center",
      cursor: "pointer",
      color: "#1b1b1f"
    }
  }, /*#__PURE__*/React.createElement(I.ChevronLeft, {
    size: 20,
    strokeWidth: 2.4
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 60,
      lineHeight: 1,
      marginTop: 18
    }
  }, p.emblem), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 27,
      fontWeight: 800,
      color: "#161619",
      letterSpacing: "-0.6px",
      marginTop: 14,
      lineHeight: 1.05
    }
  }, p.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      color: "rgba(22,22,25,0.62)",
      marginTop: 5,
      lineHeight: 1.4
    }
  }, p.what), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginTop: 13,
      flexWrap: "wrap"
    }
  }, p.tags.map((t, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      background: "rgba(255,255,255,0.6)",
      borderRadius: 999,
      padding: "4px 11px",
      fontSize: 11.5,
      color: "#2a2a30",
      fontWeight: 600
    }
  }, t)), p.limit && /*#__PURE__*/React.createElement("span", {
    style: {
      background: "rgba(255,255,255,0.6)",
      borderRadius: 999,
      padding: "4px 11px",
      fontSize: 11.5,
      color: "#2a2a30",
      fontWeight: 600,
      display: "inline-flex",
      alignItems: "center",
      gap: 4
    }
  }, "\uD83D\uDC65 ", p.limit), p.perk && /*#__PURE__*/React.createElement("span", {
    style: {
      background: "rgba(255,255,255,0.92)",
      borderRadius: 999,
      padding: "4px 11px",
      fontSize: 11.5,
      color: "#0a0a0a",
      fontWeight: 700,
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      boxShadow: "0 2px 6px rgba(0,0,0,0.08)"
    }
  }, "\uD83C\uDFC5 ", p.perk))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "20px 16px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      color: "var(--text-2)",
      lineHeight: 1.5
    }
  }, p.about), info.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--card)",
      borderRadius: 18,
      marginTop: 18,
      boxShadow: "var(--card-shadow)",
      overflow: "hidden"
    }
  }, info.map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 13,
      padding: "13px 15px",
      borderTop: i ? "1px solid var(--line)" : 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 9,
      background: "var(--surface-3)",
      display: "grid",
      placeItems: "center",
      color: "var(--text-3)",
      flexShrink: 0
    }
  }, r.icon), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-4)",
      fontWeight: 600
    }
  }, r.l), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      color: "var(--text)",
      marginTop: 1,
      fontWeight: 500
    }
  }, r.v))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 9,
      marginTop: 15,
      padding: "0 2px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      lineHeight: 1.4
    }
  }, "\uD83E\uDE99"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-3)",
      lineHeight: 1.45
    }
  }, "\u041F\u043B\u0430\u0442\u0438\u0448\u044C ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: "var(--text-2)"
    }
  }, p.cost, " XP"), " \u0438\u0437 \u043A\u043E\u043F\u0438\u043B\u043A\u0438 \u2014 \u043D\u0435 \u0434\u0435\u043D\u044C\u0433\u0430\u043C\u0438. \u0423\u0440\u043E\u0432\u0435\u043D\u044C \u043E\u0442 \u0442\u0440\u0430\u0442\u044B \u043D\u0435 \u043F\u0430\u0434\u0430\u0435\u0442."))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      left: 0,
      right: 0,
      bottom: 0,
      padding: "12px 16px calc(14px + var(--tg-bottom-inset, 0px))",
      background: isDark ? "rgba(18,20,26,0.8)" : "rgba(244,244,246,0.82)",
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)",
      borderTop: "1px solid var(--line)",
      zIndex: 5
    }
  }, got ? /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(52,199,89,0.14)",
      color: "#1E8E4E",
      borderRadius: 16,
      padding: "13px",
      textAlign: "center",
      fontWeight: 700,
      display: "flex",
      flexDirection: "column",
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      fontSize: 15
    }
  }, /*#__PURE__*/React.createElement(I.Check, {
    size: 17,
    strokeWidth: 3
  }), " \u041F\u043E\u043B\u0443\u0447\u0435\u043D\u043E"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 500,
      color: "var(--text-3)"
    }
  }, "\u041F\u043E\u043A\u0430\u0436\u0438 \u044D\u0442\u043E\u0442 \u044D\u043A\u0440\u0430\u043D \u043D\u0430 \u0432\u0445\u043E\u0434\u0435 \u043A \u043F\u0430\u0440\u0442\u043D\u0451\u0440\u0443")) : /*#__PURE__*/React.createElement("button", {
    onClick: redeem,
    disabled: !afford,
    className: "tap",
    style: {
      width: "100%",
      background: afford ? "#0a0a0a" : "var(--surface-3)",
      color: afford ? "#fff" : "var(--text-4)",
      border: 0,
      borderRadius: 16,
      padding: 16,
      fontSize: 16,
      fontWeight: 700
    }
  }, afford ? "Получить за " + p.cost + " XP" : "Нужно ещё " + (p.cost - balance) + " XP")));
}

/* «Собери свой круг» — пресеты СОЗДАНИЯ кругов под темы жизни (David: «пресеты кругов для семьи,
   тренингов и т.д. — их место во вкладке НАЙТИ, не на странице привычек»). Раньше были чипами в
   «Быстром добавлении» на Целях (терялись в конце ленты) → переехали сюда заметными карточками,
   тем же размером/языком, что «Челленджи». Тап → форма создания круга, заполненная пресетом
   (goal-settings + circleOn) → пользователь зовёт людей и правит под себя. */
var CIRCLE_STARTERS = [{
  i: "🤝",
  t: "Вклад в окружение",
  goalType: "collective",
  goalTitle: "Добрые дела",
  target: 50,
  unit: "дел",
  hook: "Делаем добро вместе — счёт общий"
}, {
  i: "🫶",
  t: "Забота о близких",
  goalType: "collective",
  goalTitle: "Тёплые дела",
  target: 30,
  unit: "дел",
  hook: "Маленькие знаки внимания семье"
}, {
  i: "🔥",
  t: "30 дней спорта",
  goalType: "streak",
  goalTitle: "Спорт каждый день",
  target: 30,
  unit: "дней",
  hook: "Держим серию все вместе"
}, {
  i: "🏁",
  t: "Беговой вызов",
  goalType: "collective",
  goalTitle: "100 км бега",
  target: 100,
  unit: "км",
  hook: "Набегаем 100 км вместе — счёт общий"
}, {
  i: "💧",
  t: "Без сахара вместе",
  goalType: "streak",
  goalTitle: "Дни без сахара",
  target: 21,
  unit: "дней",
  hook: "21 день чистоты — рядом легче"
}, {
  i: "🧘",
  t: "Осознанность",
  goalType: "collective",
  goalTitle: "Минуты медитации",
  target: 1000,
  unit: "мин",
  hook: "Копим минуты тишины на всех"
}, {
  i: "📖",
  t: "Книжный клуб",
  goalType: "collective",
  goalTitle: "Прочитано глав",
  target: 100,
  unit: "глав",
  hook: "Читаем и обсуждаем вместе"
}];
function CircleStartersShowcaseLive({
  navigate
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      padding: "4px 4px 10px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: "var(--text-4)"
    }
  }, "\uD83E\uDD1D \u0421\u043E\u0431\u0435\u0440\u0438 \u0441\u0432\u043E\u0439 \u043A\u0440\u0443\u0433"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-4)"
    }
  }, "\u0441 \u0434\u0440\u0443\u0437\u044C\u044F\u043C\u0438 \u0437\u0430 \u0441\u0435\u043A\u0443\u043D\u0434\u0443 \u2192")), /*#__PURE__*/React.createElement("div", {
    className: "bos-hscroll",
    style: {
      display: "flex",
      gap: 11,
      overflowX: "auto",
      padding: "0 0 4px",
      scrollSnapType: "x proximity",
      WebkitOverflowScrolling: "touch"
    }
  }, CIRCLE_STARTERS.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.t,
    className: "tap",
    onClick: () => {
      if (window.tgHaptic) {
        try {
          window.tgHaptic("selection");
        } catch (e) {}
      }
      navigate("goal-settings", {
        mode: "create",
        circleOn: true,
        preset: s
      });
    },
    style: {
      flex: "0 0 auto",
      width: 162,
      scrollSnapAlign: "start",
      background: "var(--card)",
      borderRadius: 22,
      padding: 14,
      boxShadow: "var(--card-shadow)",
      cursor: "pointer",
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 44,
      height: 44,
      borderRadius: 14,
      background: "linear-gradient(150deg, #eef1f6, #dadfe7)",
      boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.06)",
      display: "grid",
      placeItems: "center",
      fontSize: 23,
      flexShrink: 0
    }
  }, bosIcon(s.i, 23, null)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 600,
      color: "var(--text)",
      letterSpacing: "-0.2px",
      marginTop: 11,
      lineHeight: 1.25
    }
  }, s.t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-4)",
      marginTop: 3,
      lineHeight: 1.35,
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical",
      overflow: "hidden",
      minHeight: 31
    }
  }, s.hook), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 10
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      alignSelf: "flex-start",
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      ...bosChipGlass(false),
      padding: "3px 9px",
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 600,
      color: "var(--text-2)"
    }
  }, "\uD83C\uDFAF ", s.target, " ", s.unit), /*#__PURE__*/React.createElement("span", {
    style: {
      marginTop: 9,
      fontSize: 12.5,
      fontWeight: 600,
      color: "var(--text-2)",
      display: "inline-flex",
      alignItems: "center",
      gap: 2
    }
  }, "\u0421\u043E\u0437\u0434\u0430\u0442\u044C ", /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 14
  }))))));
}

/* «Твои люди» — РЕАЛЬНАЯ жизнь в «Найти» (David: «сама жизнь должна быть по-настоящему»): живые
   аватары людей из ТВОИХ кругов (cloud teamMembers, дедуп, без себя). НЕ выдумка: если кругов/людей
   нет — секция СКРЫТА. Кэш в модульной переменной → мгновенно при повторном входе. Тап → в общий круг. */
var _bosFriendsAggCache = null;
function CircleFriendsStripLive({
  app,
  navigate
}) {
  var [friends, setFriends] = React.useState(_bosFriendsAggCache);
  var teamSig = app && app.teams ? app.teams.filter(function (t) {
    return t.cloudId;
  }).map(function (t) {
    return t.cloudId;
  }).join(",") : "";
  React.useEffect(function () {
    var on = true;
    if (!(window.bosCloud && window.bosCloud.enabled() && window.bosCloud.teamMembers)) {
      setFriends([]);
      return;
    }
    var teams = (app && app.teams || []).filter(function (t) {
      return t.cloudId;
    });
    if (!teams.length) {
      setFriends([]);
      return;
    }
    (async function () {
      var myId = null;
      try {
        myId = await window.bosCloud.uid();
      } catch (e) {}
      var seen = {},
        out = [];
      for (var i = 0; i < teams.length; i++) {
        try {
          var mem = await window.bosCloud.teamMembers(teams[i].cloudId);
          (mem || []).forEach(function (m) {
            if (!m || !m.id || m.id === myId || seen[m.id]) return;
            seen[m.id] = 1;
            out.push({
              id: m.id,
              name: m.name || "Друг",
              avatar: m.avatar,
              team: teams[i]
            });
          });
        } catch (e) {}
      }
      if (on) {
        _bosFriendsAggCache = out;
        setFriends(out);
      }
    })();
    return function () {
      on = false;
    };
  }, [teamSig]);
  if (!friends || !friends.length) return null;
  var shown = friends.slice(0, 8),
    extra = friends.length - shown.length;
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: "var(--text-4)",
      padding: "4px 4px 8px"
    }
  }, "\uD83D\uDC65 \u0422\u0432\u043E\u0438 \u043B\u044E\u0434\u0438"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--card)",
      borderRadius: 22,
      padding: 14,
      boxShadow: "var(--card-shadow)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "bos-hscroll",
    style: {
      display: "flex",
      gap: 12,
      overflowX: "auto",
      paddingBottom: 2
    }
  }, shown.map(function (f) {
    return /*#__PURE__*/React.createElement("button", {
      key: f.id,
      className: "tap",
      onClick: function () {
        navigate("team-detail", {
          team: f.team
        });
      },
      style: {
        flex: "0 0 auto",
        width: 60,
        background: "transparent",
        border: 0,
        padding: 0,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6
      }
    }, /*#__PURE__*/React.createElement(BuddyFaceLive, {
      avatar: f.avatar,
      name: f.name,
      size: 48
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11.5,
        color: "var(--text-2)",
        fontWeight: 500,
        maxWidth: 60,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, (f.name || "").split(" ")[0]));
  }), extra > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      flex: "0 0 auto",
      alignSelf: "flex-start",
      width: 48,
      height: 48,
      borderRadius: "50%",
      background: "var(--surface-3)",
      display: "grid",
      placeItems: "center",
      fontSize: 13,
      fontWeight: 700,
      color: "var(--text-2)"
    }
  }, "+", extra)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-4)",
      marginTop: 11,
      lineHeight: 1.4
    }
  }, "\u0412\u044B \u0443\u0436\u0435 \u0432\u0435\u0434\u0451\u0442\u0435 \u0432\u043C\u0435\u0441\u0442\u0435 \u2014 \u0437\u0430\u0433\u043B\u044F\u043D\u0438 \u0432 \u043E\u0431\u0449\u0438\u0439 \u043A\u0440\u0443\u0433.")));
}

/* «Живые круги» — витрина населённого приложения (David: «хочу увидеть живые круги чисто чтоб
   создавать иллюзию... сама жизнь должна быть по-настоящему»). Это ПРИМЕРЫ: настоящие лица-мемоджи
   + живой счёт «N отметились сегодня» дают ощущение, что круги идут прямо сейчас. Тап НЕ обманывает
   фейковым «вступить» — ведёт в форму создания ПРЕД-ЗАПОЛНЕННУЮ (собери такой же круг). */
var LIVING_CIRCLES = [{
  i: "🏃",
  t: "Утренние пробежки",
  hook: "Выходят на рассвете — вместе проще не проспать",
  faces: ["m3", "m7", "m11", "m2", "m15"],
  total: 18,
  today: 9,
  preset: {
    i: "🏃",
    t: "Утренние пробежки",
    accent: "#EAEAEF",
    goalType: "streak",
    goalTitle: "Бегать по утрам",
    target: 30,
    unit: "дней"
  }
}, {
  i: "🧘",
  t: "Тишина по утрам",
  hook: "5 минут медитации — никто не сходит с дистанции",
  faces: ["m8", "m4", "m12", "m6", "m17", "m10"],
  total: 24,
  today: 13,
  preset: {
    i: "🧘",
    t: "Тишина по утрам",
    accent: "#EAEAEF",
    goalType: "streak",
    goalTitle: "Медитировать каждый день",
    target: 21,
    unit: "дней"
  }
}, {
  i: "📚",
  t: "Книжный клуб",
  hook: "Глава в день и живое обсуждение в чате круга",
  faces: ["m5", "m9", "m1", "m14"],
  total: 11,
  today: 4,
  preset: {
    i: "📚",
    t: "Книжный клуб",
    accent: "#EAEAEF",
    goalType: "collective",
    goalTitle: "Прочитать вместе",
    target: 12,
    unit: "книг"
  }
}, {
  i: "💧",
  t: "Восемь стаканов",
  hook: "Пьют воду и держат друг друга в тонусе",
  faces: ["m13", "m16", "m2", "m7"],
  total: 9,
  today: 6,
  preset: {
    i: "💧",
    t: "Восемь стаканов",
    accent: "#EAEAEF",
    goalType: "collective",
    goalTitle: "Пить воду",
    target: 30,
    unit: "дней"
  }
}];

// Overlapping memoji faces — the visual «жизнь» of a circle. Each face gets a card-coloured ring
// so the stack reads cleanly; «+N» disc closes the overflow up to the circle's total.
function LivingCircleFaces({
  faces,
  total
}) {
  var shown = (faces || []).slice(0, 5);
  var extra = (total || shown.length) - shown.length;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center"
    }
  }, shown.map(function (a, i) {
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        marginLeft: i ? -9 : 0,
        borderRadius: "50%",
        boxShadow: "0 0 0 2px var(--card)",
        position: "relative",
        zIndex: shown.length - i
      }
    }, /*#__PURE__*/React.createElement(BuddyFaceLive, {
      avatar: a,
      name: "",
      size: 26
    }));
  }), extra > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: -9,
      width: 26,
      height: 26,
      borderRadius: "50%",
      background: "var(--surface-3)",
      boxShadow: "0 0 0 2px var(--card)",
      display: "grid",
      placeItems: "center",
      fontSize: 10.5,
      fontWeight: 700,
      color: "var(--text-2)"
    }
  }, "+", extra));
}
function LivingCirclesShowcaseLive({
  navigate
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      padding: "4px 4px 10px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: "var(--text-4)"
    }
  }, "\u2728 \u0416\u0438\u0432\u044B\u0435 \u043A\u0440\u0443\u0433\u0438"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-4)"
    }
  }, "\u043B\u044E\u0434\u0438 \u0432\u0435\u0434\u0443\u0442 \u0438\u0445 \u0432\u043C\u0435\u0441\u0442\u0435")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, LIVING_CIRCLES.map(function (s) {
    return /*#__PURE__*/React.createElement("button", {
      key: s.t,
      onClick: function () {
        navigate("goal-settings", {
          mode: "create",
          preset: s.preset,
          circleOn: true
        });
      },
      className: "tap",
      style: {
        textAlign: "left",
        width: "100%",
        background: "var(--card)",
        borderRadius: 22,
        padding: 14,
        boxShadow: "var(--card-shadow)",
        border: 0,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 11,
        color: "var(--text)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 46,
        height: 46,
        borderRadius: 14,
        background: "linear-gradient(150deg, #eef1f6, #dadfe7)",
        boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.06)",
        display: "grid",
        placeItems: "center",
        fontSize: 24,
        flexShrink: 0
      }
    }, bosIcon(s.i, 24, null)), /*#__PURE__*/React.createElement("div", {
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
    }, s.t), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "var(--text-4)",
        marginTop: 2,
        lineHeight: 1.35,
        display: "-webkit-box",
        WebkitLineClamp: 1,
        WebkitBoxOrient: "vertical",
        overflow: "hidden"
      }
    }, s.hook))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement(LivingCircleFaces, {
      faces: s.faces,
      total: s.total
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: "var(--text-4)",
        fontWeight: 500
      }
    }, /*#__PURE__*/React.createElement("b", {
      style: {
        color: "var(--text-2)",
        fontWeight: 700
      }
    }, s.today), " \u043E\u0442\u043C\u0435\u0442\u0438\u043B\u0438\u0441\u044C \u0441\u0435\u0433\u043E\u0434\u043D\u044F")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: "var(--text-4)"
      }
    }, s.total, " \u0432 \u043A\u0440\u0443\u0433\u0435"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 600,
        color: "var(--text-2)",
        display: "inline-flex",
        alignItems: "center",
        gap: 2
      }
    }, "\u0421\u043E\u0431\u0440\u0430\u0442\u044C \u0442\u0430\u043A\u043E\u0439 ", /*#__PURE__*/React.createElement(I.ChevronRight, {
      size: 14
    }))));
  })));
}

/* «Позови своих» — ЭЛЕГАНТНАЯ интеграция контактов для Telegram-приложения (David: «красиво
   интегрировать контакты, гениальное решение по смыслу»): НЕ скрейпим список контактов (приватность),
   а открываем РОДНОЙ выбор чата Telegram (ShareAppSheetLive → t.me/share/url). Друг переходит по
   реф-ссылке, вступает — и появляется в «Твои люди». Тот же реферальный движок, что на Главной. */
function InviteFriendsCardLive({
  isDark
}) {
  var sheet = typeof useSheet === "function" ? useSheet() : null;
  var openInvite = function () {
    try {
      if (sheet && sheet.open && typeof ShareAppSheetLive === "function") sheet.open(/*#__PURE__*/React.createElement(ShareAppSheetLive, {
        dark: isDark
      }));
    } catch (e) {}
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("button", {
    onClick: openInvite,
    className: "tap",
    style: {
      width: "100%",
      position: "relative",
      overflow: "hidden",
      border: 0,
      borderRadius: 22,
      padding: 16,
      background: "linear-gradient(135deg, #FEDE34, #EF9F14)",
      boxShadow: "0 8px 22px rgba(239,159,20,0.3)",
      color: "#0a0a0a",
      display: "flex",
      alignItems: "center",
      gap: 13,
      textAlign: "left",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      inset: 0,
      background: "radial-gradient(circle at 86% 8%, rgba(255,255,255,0.4) 0%, transparent 55%)",
      pointerEvents: "none"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 44,
      height: 44,
      borderRadius: 14,
      background: "rgba(255,255,255,0.5)",
      display: "grid",
      placeItems: "center",
      flexShrink: 0,
      color: "#0a0a0a",
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement(I.Share, {
    size: 20
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 7,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15.5,
      fontWeight: 700,
      color: "#0a0a0a",
      letterSpacing: "-0.2px"
    }
  }, "\u041F\u043E\u0437\u043E\u0432\u0438 \u0441\u0432\u043E\u0438\u0445"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      fontSize: 10.5,
      fontWeight: 800,
      color: "#FEDE34",
      background: "#0a0a0a",
      padding: "2px 8px",
      borderRadius: 999,
      flexShrink: 0
    }
  }, "+150 XP")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "rgba(0,0,0,0.62)",
      marginTop: 3,
      lineHeight: 1.35,
      fontWeight: 500
    }
  }, "\u041F\u0440\u0438\u0433\u043B\u0430\u0441\u0438 \u0434\u0440\u0443\u0437\u0435\u0439 \u043F\u0440\u044F\u043C\u043E \u0438\u0437 Telegram \u2014 \u0438 \u043E\u043D\u0438 \u043F\u043E\u044F\u0432\u044F\u0442\u0441\u044F \u0432 \xAB\u0422\u0432\u043E\u0438 \u043B\u044E\u0434\u0438\xBB.")), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      color: "#0a0a0a",
      opacity: 0.55,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 18
  }))));
}

/* ВСЕЛЕННАЯ — отдаляемся от СВОЕЙ системы и видим МНОЖЕСТВО ДРУГИХ, у каждого СВОЯ (David: «много
   отдельных солнечных систем; у каждого СТОЛЬКО колец СКОЛЬКО ЕСТЬ на самом деле, заполненных его
   реальными привычками/целями/друзьями; системы НЕ должны соприкасаться; рассыпать можно по всему
   экрану; в стиль приложения; не бутафория»). Поэтому каждая система = мини-космос НАШЕГО языка
   (стеклянные планеты на концентрических кольцах OrbitField-стиля): ТВОЯ заполнена РЕАЛЬНО — кольцо
   привычек (эмодзи) + кольцо целей + кольцо друзей (аватары); чужие = их аватар + кольца их мира
   (интерьер приватен — показываем структуру, не выдумываем чужие привычки; реальные планеты подключим
   когда появится публичный профиль). Упаковка БЕЗ НАЛОЖЕНИЙ по всему экрану (рандом + проверка
   расстояний). Кольца медленно крутятся, аватары/эмодзи контр-вращаются (ровные). Портал в body. */
var _bosUniverseCache = null;
function _bosHashU(s) {
  s = "" + (s || "x");
  var h = 2166136261;
  for (var i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = h * 16777619 >>> 0;
  }
  return h;
}
function _bosSm(x) {
  x = x < 0 ? 0 : x > 1 ? 1 : x;
  return x * x * (3 - 2 * x);
} // smoothstep 0..1
function _bosLp(a, b, k) {
  return a + (b - a) * k;
}
function UniverseFieldLive({
  app,
  people,
  from,
  onClose
}) {
  var isDark = app && app.themeOverride === "dark";
  var [friends, setFriends] = React.useState(_bosUniverseCache);
  React.useEffect(function () {
    var on = true;
    var seed = Array.isArray(people) ? people : [];
    if (!(window.bosCloud && window.bosCloud.enabled())) {
      setFriends(seed);
      return;
    }
    (async function () {
      var out = [],
        myId = null;
      try {
        myId = await window.bosCloud.uid();
      } catch (e) {}
      // ВСЕ пользователи вселенной: каждый с опубликованной витриной орбиты, АНОНИМНО (аватар+уровень+
      // значки привычек, без имён/связи — David: «показываем всех всем, супер-анонимно»).
      try {
        if (window.bosCloud.allPublic) {
          var all = await window.bosCloud.allPublic(240);
          (all || []).forEach(function (p) {
            if (p && p.id && p.id !== myId) out.push(p);
          });
        }
      } catch (e) {}
      // Фолбэк (нет allPublic / пусто — напр. старый кэш): показать хотя бы своих (приглашённые + круги),
      // тоже анонимно. Дотягиваем их публичные орбиты по id.
      if (!out.length) {
        var seen = {};
        try {
          if (window.bosCloud.invitedPeople) {
            var inv = await window.bosCloud.invitedPeople();
            (inv || []).forEach(function (p) {
              if (!p) return;
              var id = p.id || p.user_id;
              if (id && id !== myId && !seen[id]) {
                seen[id] = 1;
                out.push({
                  id: id,
                  avatar: p.avatar,
                  name: ""
                });
              }
            });
          }
        } catch (e) {}
        try {
          var teams = (app && app.teams || []).filter(function (t) {
            return t.cloudId;
          });
          for (var i = 0; i < teams.length; i++) {
            var mem = await window.bosCloud.teamMembers(teams[i].cloudId);
            (mem || []).forEach(function (m) {
              if (m && m.id && m.id !== myId && !seen[m.id]) {
                seen[m.id] = 1;
                out.push({
                  id: m.id,
                  avatar: m.avatar,
                  name: ""
                });
              }
            });
          }
        } catch (e) {}
        try {
          if (window.bosCloud.profilesPublic && out.length) {
            var st = (await window.bosCloud.profilesPublic(out.map(function (o) {
              return o.id;
            }))) || {};
            out.forEach(function (o) {
              var s = st[o.id] || {};
              o.level = s.level || 0;
              o.lvlPct = s.lvlPct || 2;
              o.habits = Array.isArray(s.habits) ? s.habits : [];
              o.goals = s.goals || 0;
              o.people = s.people || 0;
            });
          }
        } catch (e) {}
      }
      if (on) {
        _bosUniverseCache = out;
        setFriends(out);
      }
    })();
    return function () {
      on = false;
    };
  }, []);
  var list = Array.isArray(friends) ? friends : [];
  var bg = isDark ? "radial-gradient(125% 95% at 50% 42%, #1b2336 0%, #0e1422 52%, #070b14 100%)" : "radial-gradient(125% 95% at 50% 42%, #fbfcff 0%, #eef1f8 52%, #e4e9f2 100%)";
  var titleC = isDark ? "rgba(220,230,255,0.7)" : "rgba(40,52,74,0.55)";
  var subC = isDark ? "rgba(200,215,255,0.5)" : "rgba(40,52,74,0.42)";

  // Твой РЕАЛЬНЫЙ уровень/прогресс — кормит OrbitField (золотое кольцо + цифра) идентично стр. «Я».
  var _ux = typeof bosLiveXPLive === "function" ? bosLiveXPLive(app) : 0;
  var _ul = typeof bosLevelInfoLive === "function" ? bosLevelInfoLive(_ux) : {
    level: 1,
    pct: 2
  };
  var lvlNum = _ul.level,
    lvlPct = _ul.pct;

  // Чужая система = ТОТ ЖЕ настоящий OrbitField, что у тебя на «Я» (David: «должны быть прямо такие же,
  // а сейчас иконки криво»). Поэтому НЕ рисуем отдельную bead-схему — готовим данные под OrbitField и
  // рендерим его уменьшенным. Размер растёт с объёмом (больше привычек+людей → крупнее система).
  function buildSystem(s) {
    var hb = Array.isArray(s.habits) ? s.habits : [];
    var peopleN = s.people || 0;
    var weight = Math.min(hb.length + peopleN, 16);
    var size = Math.round(122 + Math.min(weight, 14) * 5.4); // диаметр системы на экране, ~122..198px
    // habits → объекты, которые читает OrbitField (.emoji/.color/.streak/.id); люди → обезличенные лица.
    var habits = hb.slice(0, 12).map(function (h, i) {
      return {
        emoji: h && h.e || "✨",
        color: h && h.c,
        streak: 0,
        id: "ph" + i
      };
    });
    var people = [];
    for (var pi = 0; pi < Math.min(peopleN, 10); pi++) people.push({
      avatar: null,
      name: ""
    });
    // footprint < size/2: видимая орбита заметно меньше своего 300-бокса (значки в пределах ~внутренних
    // поясов), поэтому ужимаем зону размещения, чтобы во «Вселенную» влезало больше систем без наезда.
    return {
      s: s,
      size: size,
      level: s.level || 0,
      lvlPct: s.lvlPct || 2,
      habits: habits,
      people: people,
      weight: weight,
      footprint: Math.round(size * 0.42 + 8)
    };
  }

  // Размер ТВОЕЙ орбиты берём со стр. «Я» (measured rect) → overlay рисует её копию ТЕХ ЖЕ размеров на
  // ТОМ ЖЕ месте. Fallback (не из «Я»): ширина страницы × 300 (как в OrbitField).
  var W = typeof window !== "undefined" && window.innerWidth || 390;
  var H = typeof window !== "undefined" && window.innerHeight || 780;
  // РАСКЛАДКА = ЧЕСТНАЯ HONEYCOMB-СЕТКА (как главное меню Apple Watch): гексагональные кольца вокруг
  // центра (ты — в центре, index 0; далее кольца по 6, 12, 18…), идеально СИММЕТРИЧНО, каждая система
  // в своей ячейке (спейсинг ровно 1). Линза fish() ниже раздувает центр, сохраняя симметрию.
  var layout = React.useMemo(function () {
    var others = list.slice(0, 240).map(function (f) {
      return buildSystem(f);
    }).sort(function (a, b) {
      return b.weight - a.weight;
    });
    var AX = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]]; // 6 направлений гекс-соседей
    function hexAt(index) {
      // index 0 = центр, далее по кольцам
      if (index <= 0) return {
        q: 0,
        r: 0
      };
      var k = 1;
      while (index > 3 * k * (k + 1)) k++; // номер кольца
      var idxInRing = index - (3 * (k - 1) * k + 1); // позиция внутри кольца (0..6k-1)
      var q = AX[4][0] * k,
        r = AX[4][1] * k; // старт кольца — угол
      var side = Math.floor(idxInRing / k),
        step = idxInRing % k;
      for (var s = 0; s < side; s++) {
        q += AX[s][0] * k;
        r += AX[s][1] * k;
      }
      q += AX[side][0] * step;
      r += AX[side][1] * step;
      return {
        q: q,
        r: r
      };
    }
    var nodes = others.map(function (sp, j) {
      var h = hexAt(j + 1); // axial → плоскость, спейсинг ровно 1
      return {
        sp: sp,
        fx: h.q + h.r * 0.5,
        fy: h.r * 0.8660254
      };
    });
    return {
      nodes: nodes
    };
  }, [friends]);

  // ЛИНЗА (fisheye, как главное меню Apple Watch): поле тесно упаковано, а в центре экрана — «лупа».
  // Кто под ней — раздут и с раскрытыми кольцами; вокруг всё жмётся плотно (минимум белого). Двигаешь
  // пальцем — под лупу въезжает другая система, раздувается, соседи липнут к ней. cam = точка поля под
  // центром экрана (норм. единицы); z = зум. Открытие — мягкий зум-ин (shown). Тач/мышь; тап = закрыть.
  var [cam, setCam] = React.useState({
    x: 0,
    y: 0,
    z: 1,
    anim: true
  });
  var [shown, setShown] = React.useState(false);
  React.useEffect(function () {
    var a = requestAnimationFrame(function () {
      var b = requestAnimationFrame(function () {
        setShown(true);
      });
      vp.current._raf2 = b;
    });
    var tm = setTimeout(function () {
      setShown(true);
    }, 80); // фолбэк: rAF бывает throttled (фон/headless)
    return function () {
      cancelAnimationFrame(a);
      if (vp.current._raf2) cancelAnimationFrame(vp.current._raf2);
      clearTimeout(tm);
    };
  }, []);
  var vp = React.useRef({
    pts: {},
    mode: null,
    sd: 1,
    ox: 0,
    oy: 0,
    oz: 1,
    sx: 0,
    sy: 0,
    moved: 0
  });
  function _cZ(z) {
    return z < 0.55 ? 0.55 : z > 3 ? 3 : z;
  }
  var introK = shown ? 1 : 0.9;
  // ШАГ между центрами и ДИАМЕТР орбиты — РАЗНЫЕ: видимый кластер планет заметно меньше 300-бокса,
  // поэтому боксы кладём с перекрытием (шаг = PACK×диаметр, PACK<0.5) → сами орбиты впритык, минимум
  // белого (соты). Магнификация мягкая (орбиты не расползаются): центр MC, край ME.
  var SIZB = 178 * cam.z * introK; // диаметр орбиты (px) при mag=1
  var PACK = 0.55; // шаг = PACK×диаметр — теснота упаковки
  var SPB = SIZB * PACK;
  var SIG = 150 * cam.z * introK; // радиус «лупы» (px)
  var MC = 1.85,
    ME = 0.72; // магнификация: центр / край
  function fish(fx, fy) {
    var vx = fx - cam.x,
      vy = fy - cam.y,
      rf = Math.sqrt(vx * vx + vy * vy),
      rpx = rf * SPB;
    var q = rpx / SIG,
      mag = ME + (MC - ME) / (1 + q * q);
    var R = ME * rpx + (MC - ME) * SIG * Math.atan(q); // радиальное отображение «лупы»
    var ux = rf > 0.001 ? vx / rf : 0,
      uy = rf > 0.001 ? vy / rf : 0;
    return {
      sx: W / 2 + ux * R,
      sy: H / 2 + uy * R,
      size: SIZB * mag,
      mag: mag
    };
  }
  function uDown(e) {
    var g = vp.current;
    g.pts[e.pointerId] = {
      x: e.clientX,
      y: e.clientY
    };
    var ids = Object.keys(g.pts);
    if (ids.length === 1) {
      g.mode = "pan";
      g.sx = e.clientX;
      g.sy = e.clientY;
      g.ox = cam.x;
      g.oy = cam.y;
      g.moved = 0;
    } else if (ids.length >= 2) {
      g.mode = "pinch";
      var a = g.pts[ids[0]],
        b = g.pts[ids[1]];
      g.sd = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      g.oz = cam.z;
    }
    setCam(function (v) {
      return {
        x: v.x,
        y: v.y,
        z: v.z,
        anim: false
      };
    });
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
  }
  function uMove(e) {
    var g = vp.current;
    if (!g.pts[e.pointerId]) return;
    g.pts[e.pointerId] = {
      x: e.clientX,
      y: e.clientY
    };
    var ids = Object.keys(g.pts);
    if (g.mode === "pinch" && ids.length >= 2) {
      var a = g.pts[ids[0]],
        b = g.pts[ids[1]];
      var nz = _cZ(g.oz * (Math.hypot(a.x - b.x, a.y - b.y) / g.sd));
      setCam(function (v) {
        return {
          x: v.x,
          y: v.y,
          z: nz,
          anim: false
        };
      });
    } else if (g.mode === "pan" && ids.length === 1) {
      var ps = 178 * 0.55 * g.oz;
      var dx = e.clientX - g.sx,
        dy = e.clientY - g.sy;
      g.moved = Math.max(g.moved, Math.abs(dx) + Math.abs(dy));
      setCam(function (v) {
        return {
          x: g.ox - dx / ps,
          y: g.oy - dy / ps,
          z: v.z,
          anim: false
        };
      });
    }
  }
  function uUp(e) {
    var g = vp.current;
    var tap = g.mode === "pan" && g.moved < 6 && Object.keys(g.pts).length === 1;
    delete g.pts[e.pointerId];
    if (!Object.keys(g.pts).length) g.mode = null;
    setCam(function (v) {
      return {
        x: v.x,
        y: v.y,
        z: v.z,
        anim: true
      };
    });
    if (tap) {
      try {
        onClose && onClose();
      } catch (_) {}
    }
  }
  function uWheel(e) {
    var nz = _cZ(cam.z * (1 - (e.deltaY || 0) * 0.0012));
    setCam(function (v) {
      return {
        x: v.x,
        y: v.y,
        z: nz,
        anim: false
      };
    });
  }
  var plural = list.length === 1 ? "система" : list.length >= 2 && list.length <= 4 ? "системы" : "систем";
  var sub = friends == null ? "" : list.length ? list.length + " " + plural + " рядом — у каждого своя орбита" : "пока только твоя система — позови своих";
  // РАСКРЫТИЕ колец — ГРАДИЕНТ по близости к центру ЛИНЗЫ (David: «я — целиком; ближайшие приоткрыты,
  // привычки читаются; дальше меньше; совсем далеко — иконки»). Плавно от центра (mag высок → 1) к
  // краю (→ 0). Широкий диапазон 0.9 → тает через несколько колец, а не резко.
  function openMag(mag) {
    return _bosSm((mag - 0.98) / 0.9);
  }
  // Твоя система — с РЕАЛЬНЫМИ привычками/людьми/уровнем; стоит в центре поля (fx=fy=0).
  var _bs = typeof bosStreak === "function" ? bosStreak : function () {
    return 0;
  };
  var youHabits = (app && app.habits || []).slice(0, 12).map(function (h) {
    return {
      emoji: h.emoji || "✨",
      color: h.color,
      streak: _bs(h.log),
      id: h.id
    };
  });
  var youPeople = Array.isArray(people) ? people.slice(0, 10) : [];
  var youSp = {
    s: {
      avatar: app && app.avatar,
      name: app && app.userName || ""
    },
    level: lvlNum,
    lvlPct: lvlPct,
    habits: youHabits,
    people: youPeople
  };
  var allNodes = [{
    sp: youSp,
    fx: 0,
    fy: 0,
    you: true
  }].concat(layout.nodes);
  var node = /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 300,
      overflow: "hidden",
      background: bg,
      animation: "bosUniFade 0.5s ease both"
    }
  }, /*#__PURE__*/React.createElement("style", null, "@keyframes bosUniFade{from{opacity:0}to{opacity:1}}@keyframes bosSpinCW{from{transform:translate(-50%,-50%) rotate(0)}to{transform:translate(-50%,-50%) rotate(360deg)}}@keyframes bosSpinFaceCW{from{transform:rotate(0)}to{transform:rotate(360deg)}}@keyframes bosSpinFaceCCW{from{transform:rotate(0)}to{transform:rotate(-360deg)}}@keyframes bosUniPop{from{opacity:0;transform:translate(-50%,-50%) scale(0.4)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}"), /*#__PURE__*/React.createElement("div", {
    onPointerDown: uDown,
    onPointerMove: uMove,
    onPointerUp: uUp,
    onPointerCancel: uUp,
    onWheel: uWheel,
    style: {
      position: "absolute",
      inset: 0,
      touchAction: "none",
      cursor: "grab"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      pointerEvents: "none"
    }
  }, allNodes.map(function (nd, i) {
    var f = fish(nd.fx, nd.fy);
    if (f.sx < -f.size || f.sx > W + f.size || f.sy < -f.size || f.sy > H + f.size) return null;
    var sp = nd.sp,
      k = f.size / 300,
      openV = openMag(f.mag);
    return /*#__PURE__*/React.createElement("div", {
      key: nd.you ? "you" : "o" + i,
      style: {
        position: "absolute",
        left: f.sx.toFixed(1) + "px",
        top: f.sy.toFixed(1) + "px",
        pointerEvents: "none",
        zIndex: Math.round(f.mag * 100)
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        width: 300,
        height: 300,
        left: -150,
        top: -150,
        transform: "scale(" + k.toFixed(3) + ")",
        transformOrigin: "150px 150px"
      }
    }, typeof OrbitField === "function" ? /*#__PURE__*/React.createElement(OrbitField, {
      avatar: sp.s && sp.s.avatar,
      name: sp.s && sp.s.name || "",
      habits: sp.habits,
      people: sp.people,
      levelPct: sp.lvlPct,
      moodC: nd.you ? app && app.mood && app.mood.c : undefined,
      dark: isDark,
      hideLevelArc: !!nd.you,
      editable: false,
      levelBadge: sp.level,
      open: openV
    }) : null));
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: "calc(18px + var(--tg-top-inset, 0px))",
      left: 0,
      right: 0,
      textAlign: "center",
      pointerEvents: "none"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 2,
      textTransform: "uppercase",
      color: titleC
    }
  }, "\u0412\u0441\u0435\u043B\u0435\u043D\u043D\u0430\u044F"), sub ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: subC,
      marginTop: 3
    }
  }, sub) : null), friends != null && list.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      top: "calc(50% + 96px)",
      textAlign: "center",
      padding: "0 44px",
      color: subC,
      fontSize: 13.5,
      lineHeight: 1.5,
      pointerEvents: "none"
    }
  }, "\u041F\u043E\u0437\u043E\u0432\u0438 \u043F\u0435\u0440\u0432\u044B\u0445 \u2014 \u0438 \u0440\u044F\u0434\u043E\u043C \u0441 \u0442\u0432\u043E\u0435\u0439 \u043F\u043E\u044F\u0432\u044F\u0442\u0441\u044F \u0438\u0445 \u0441\u043E\u043B\u043D\u0435\u0447\u043D\u044B\u0435 \u0441\u0438\u0441\u0442\u0435\u043C\u044B."), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C",
    className: "tap",
    style: {
      position: "absolute",
      top: "calc(14px + var(--tg-top-inset, 0px))",
      right: 16,
      width: 36,
      height: 36,
      borderRadius: "50%",
      border: 0,
      background: isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.82)",
      color: isDark ? "#fff" : "var(--text)",
      display: "grid",
      placeItems: "center",
      boxShadow: isDark ? "none" : "0 2px 8px rgba(0,0,0,0.12)",
      WebkitBackdropFilter: "blur(8px)",
      backdropFilter: "blur(8px)"
    }
  }, /*#__PURE__*/React.createElement(I.X, {
    size: 18
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      bottom: "calc(22px + var(--tg-bottom-inset, 0px))",
      left: 0,
      right: 0,
      textAlign: "center",
      fontSize: 12,
      color: subC,
      pointerEvents: "none"
    }
  }, "\u043A\u043E\u0441\u043D\u0438\u0441\u044C, \u0447\u0442\u043E\u0431\u044B \u0432\u0435\u0440\u043D\u0443\u0442\u044C\u0441\u044F"));
  // Portal to <body> so position:fixed escapes the page-stack's CSS transform.
  return typeof ReactDOM !== "undefined" && ReactDOM.createPortal ? ReactDOM.createPortal(node, document.body) : node;
}

/* ── Привычки-страница: нижняя полоска недели + Apple-палитра (live-only, v235). The
   HOME card stays the compact row — only the Привычки-page card grows this strip.
   Colours = the Apple JOURNAL palette (David found it: «такие же цвета, как в Журнале») —
   muted warm→cool tints, softer & more refined than the raw system colours. ── */
var BOS_APPLE_COLORS = ["#A06A86", "#F0564C", "#E08AC4", "#E59B9B", "#CBA98D", "#F0A24E", "#19B89B", "#54C3E4", "#4A6CD6", "#84A4B8", "#7F9AF2", "#8676E6"];

// 7 LOCAL day-keys for the CURRENT week, Пн→Вс (left→right) — matches the strip order.
function bosWeekKeys() {
  var now = new Date();
  now.setHours(0, 0, 0, 0);
  var dow = (now.getDay() + 6) % 7; // Mon=0 … Sun=6
  var mon = new Date(now);
  mon.setDate(now.getDate() - dow);
  var out = [];
  for (var i = 0; i < 7; i++) {
    var d = new Date(mon);
    d.setDate(mon.getDate() + i);
    out.push(bosTodayKey(d));
  }
  return out;
}

// A habit's accent: its chosen colour, else the app's BLACK (the black-and-white theme,
// David) — the week-strip renders it as a soft graphite gradient (the generic top-light
// overlay turns #0a0a0a into ~#404040→#0a0a0a). NOT a random Apple colour: «стандартный
// должен быть чёрный, не фиолетовый».
function bosHabitColor(habit) {
  return habit && habit.color ? habit.color : "#0a0a0a";
}

// Week-strip: 7 rounded cells Пн→Вс. Filled (a soft top-light gradient over the accent) =
// closed that day; faint same-hue tint = not closed — so the whole row stays ONE colour
// family (David). NO «today» marker on purpose: the current day is already obvious, a ring
// only added noise. Display-only; reads the REAL date-log (same source as the streak).
function HabitWeekStrip({
  habit,
  fill = true,
  square = false
}) {
  // Same cell language as the month calendar (continuity): circle, glossy accent when done,
  // neutral track when empty, a subtle ring on today — карточка ↔ деталь = один кружок-день.
  // fill=true (карточка) → клетки тянутся во всю ширину (крупнее, карточка плотнее/квадратнее).
  var app = typeof useApp === "function" ? useApp() : null;
  var isDark = app && app.themeOverride === "dark";
  var keys = bosWeekKeys();
  var todayK = typeof bosTodayKey === "function" ? bosTodayKey() : null;
  // Ripple OUTSIDE the habit: completing a habit from the LIST sends a wave radiating BOTH ways
  // from today's weekday cell (David: «снаружи привычки, когда полностью закрываю — клёвая волна в
  // обе стороны от сегодняшнего дня»). Fires only on the done false→true flip (covers binary AND
  // quantitative-at-full). Web-Animations, staggered by distance from today; auto-cleans.
  var stripRef = React.useRef(null);
  var doneNow = !!(habit && habit.done);
  var prevDone = React.useRef(doneNow);
  React.useEffect(function () {
    if (doneNow && !prevDone.current && stripRef.current) {
      var ti = keys.indexOf(todayK),
        kids = stripRef.current.children;
      for (var i = 0; i < kids.length; i++) {
        var dist = ti >= 0 ? Math.abs(i - ti) : 0;
        try {
          kids[i].animate([{
            transform: "scale(1)",
            filter: "brightness(1)"
          }, {
            transform: "scale(1.32)",
            filter: "brightness(1.35)"
          }, {
            transform: "scale(1)",
            filter: "brightness(1)"
          }], {
            duration: 440,
            delay: dist * 55,
            easing: "cubic-bezier(0.22,0.9,0.3,1.2)"
          });
        } catch (e) {}
      }
    }
    prevDone.current = doneNow;
  }, [doneNow]);
  if (!habit) return null;
  var accent = bosHabitColor(habit);
  var log = habit.log || {};
  var doneFill = bosCellFill(accent, 1); // SAME soft glossy fill as the month calendar (continuity)
  var empty = typeof bosCellEmpty === "function" ? bosCellEmpty(accent, isDark) : isDark ? "rgba(255,255,255,0.13)" : "rgba(0,0,0,0.08)";
  var cell = fill ? {
    flex: 1,
    aspectRatio: "1/1",
    minWidth: 0
  } : {
    width: 20,
    height: 20,
    flexShrink: 0
  };
  return /*#__PURE__*/React.createElement("div", {
    ref: stripRef,
    "aria-hidden": true,
    style: {
      display: "flex",
      gap: fill ? 7 : 6,
      width: fill ? "100%" : "auto"
    }
  }, keys.map(function (k, i) {
    var fl = !!log[k];
    // Сегодня = единое СТЕКЛЯННОЕ кольцо (то же, что в календаре) в ТОНЕ привычки; заполненный день — своя стекло-заливка.
    var sh = [fl ? bosCellGlass(isDark) : "", k === todayK ? bosTodayRing(isDark, accent) : ""].filter(Boolean).join(", ") || "none";
    return /*#__PURE__*/React.createElement("span", {
      key: i,
      style: {
        ...cell,
        borderRadius: square ? 5 : "50%",
        background: fl ? doneFill : empty,
        boxShadow: sh
      }
    });
  }));
}

/* Aggregate «Эта неделя» strip for the HOME — 7 cells Пн→Вс. A cell is filled (the SAME soft
   glass graphite as the per-habit strip) if ANY habit was closed that day; today carries a gold
   ring. Each cell shows weekday + date number. Display-only; reads the real per-habit date-log.
   The parent card taps → history. LIVE only. */
// «Эта неделя» на главной. НОВЫЙ дизайн (референс David) = КРУЖОЧКИ: залитый глянцевый круг =
// выполнено, ПУНКТИРНЫЙ = сегодня (ещё не отмечено), тусклый диск = пусто; подпись дня снизу — всё в
// наших цветах (графит-стекло) и обеих темах. СТАРЫЙ виджет (квадраты-squircle) сохранён НИЖЕ как
// HomeWeekStripClassicLive — вернуть = поставить BOS_HOME_WEEK_STYLE = "squares" (одна строка).
var BOS_HOME_WEEK_STYLE = "circles"; // "circles" (новый) | "squares" (старый, архив)
function HomeWeekStripLive(props) {
  if (BOS_HOME_WEEK_STYLE === "squares") return /*#__PURE__*/React.createElement(HomeWeekStripClassicLive, props);
  var habits = props.habits || [],
    isDark = props.isDark;
  var keys = typeof bosWeekKeys === "function" ? bosWeekKeys() : [];
  var todayK = typeof bosTodayKey === "function" ? bosTodayKey() : null;
  var WD = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  // ТОЛЬКО ГРАДИЕНТЫ, без обводок (David). Выполнено = глянцевый графит-круг; пусто = тусклый
  // градиент-диск; СЕГОДНЯ = вертикальная «капсула»-подсветка за днём (удлинённая, как на референсе),
  // а не кольцо-строчка. Кружки МЕНЬШЕ (28px), капсула чуть уже ячейки → дышит.
  var doneFill = typeof bosCellFill === "function" ? bosCellFill("#0a0a0a", 1) : "#0a0a0a";
  var doneGlass = typeof bosCellGlass === "function" ? bosCellGlass(isDark) : "0 1px 3px rgba(0,0,0,0.18)";
  var emptyFill = isDark ? "linear-gradient(160deg, rgba(255,255,255,0.10), rgba(255,255,255,0.03))" : "linear-gradient(160deg, #eef0f4, #e1e4ea)";
  var emptyInset = isDark ? "inset 0 1px 1px rgba(255,255,255,0.06)" : "inset 0 1px 2px rgba(0,0,0,0.06)";
  var todayCap = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex"
    }
  }, keys.map(function (k, i) {
    var on = habits.length > 0 && habits.some(function (h) {
      return h.log && h.log[k];
    });
    var isToday = k === todayK;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        flex: 1,
        minWidth: 0,
        display: "flex",
        justifyContent: "center"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        padding: "8px 7px 6px",
        borderRadius: 18,
        background: isToday ? todayCap : "transparent"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: on ? doneFill : emptyFill,
        boxShadow: on ? doneGlass : emptyInset
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        fontWeight: 600,
        color: isToday ? "var(--text-2)" : "var(--text-4)",
        letterSpacing: "0.2px"
      }
    }, WD[i])));
  }));
}
function HomeWeekStripClassicLive({
  habits = [],
  isDark
}) {
  var keys = typeof bosWeekKeys === "function" ? bosWeekKeys() : [];
  var todayK = typeof bosTodayKey === "function" ? bosTodayKey() : null;
  var WD = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  var empty = isDark ? "rgba(255,255,255,0.07)" : "#f1f2f5";
  var fill = typeof bosCellFill === "function" ? bosCellFill("#0a0a0a", 1) : "#0a0a0a";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6
    }
  }, keys.map((k, i) => {
    var on = habits.length > 0 && habits.some(h => h.log && h.log[k]);
    var isToday = k === todayK;
    var dayNum = parseInt(("" + k).slice(-2), 10) || "";
    // Today = a GREY glass outline (David: золотой не подходит) — matches the grey today-ring on
    // the habit-detail week strip; the inset highlight gives it the glassy edge.
    var todayRing = isDark ? "0 0 0 1.5px rgba(255,255,255,0.5), inset 0 1px 1px rgba(255,255,255,0.12)" : "0 0 0 1.5px rgba(0,0,0,0.32), inset 0 1px 1.5px rgba(255,255,255,0.85)";
    var sh = [on && typeof bosCellGlass === "function" ? bosCellGlass(isDark) : "", isToday ? todayRing : ""].filter(Boolean).join(", ") || "none";
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        flex: 1,
        aspectRatio: "1/1",
        borderRadius: "30%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        background: on ? fill : empty,
        boxShadow: sh
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9,
        fontWeight: 600,
        color: on ? "rgba(255,255,255,0.72)" : "var(--text-4)"
      }
    }, WD[i]), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        fontWeight: 700,
        color: on ? "#fff" : "var(--text)",
        fontVariantNumeric: "tabular-nums"
      }
    }, dayNum));
  }));
}

// Names for the live Apple palette (the create-screen picker label). Includes the old
// core #0A84FF so habits made before the v235 palette still read a colour name.
var BOS_APPLE_COLOR_NAMES = {
  "#A06A86": "Сливовый",
  "#F0564C": "Коралловый",
  "#E08AC4": "Орхидея",
  "#E59B9B": "Лосось",
  "#CBA98D": "Глина",
  "#F0A24E": "Оранжевый",
  "#19B89B": "Мятный",
  "#54C3E4": "Голубой",
  "#4A6CD6": "Синий",
  "#84A4B8": "Грифельный",
  "#7F9AF2": "Барвинок",
  "#8676E6": "Индиго",
  /* legacy system hues — kept so habits made before the Journal palette still read a name */
  "#34C759": "Зелёный",
  "#007AFF": "Синий",
  "#0A84FF": "Синий",
  "#FF9500": "Оранжевый",
  "#AF52DE": "Фиолетовый",
  "#FF2D55": "Розовый",
  "#30B0C7": "Бирюзовый",
  "#5856D6": "Индиго",
  "#FF3B30": "Красный",
  "#FFCC00": "Жёлтый"
};

// Neutral DEFAULT colour — a soft grey (David: «дефолтный цвет серый», в духе наших серых стеклянных
// кружков). Lives at the head of the palette next to «Чёрный».
var BOS_GREY = "#8E8E93";
// A glassy colour swatch — a glossy sphere: bright top-left specular + soft bottom inner shadow over
// the colour, so every picker circle reads «в стекле» (David's example). Returns {background,boxShadow};
// `selected` adds the white-gap halo ring in the swatch's own colour. ONE source → identical everywhere.
function bosColorSwatch(hx, selected) {
  var raw = typeof hx === "string" && hx[0] === "#" ? hx : BOS_GREY;
  // Свотч = СТЕКЛЯННЫЙ кружок (верт. блик + стекло-тень), НЕ глянцевый шар (David). Тон = МЯГКАЯ
  // ПАСТЕЛЬ = ровно тот цвет, что выйдет на карточке. Серый(станд) → СВЕТЛО-серый (базовый нейтраль,
  // «который везде»), чёрный → графит — оба различимы и отражают выбор.
  var isBlack = raw.toLowerCase() === "#0a0a0a";
  var isGrey = raw === BOS_GREY;
  var tone = isBlack ? "#3b3f47" : isGrey ? "#e9ebf0" : typeof bosLightenHex === "function" ? bosLightenHex(raw, 0.42) : raw;
  var sheen = "linear-gradient(180deg, rgba(255,255,255,0.4), rgba(255,255,255,0.06) 58%, rgba(255,255,255,0) 85%)";
  var glass = typeof bosTileGlass === "function" ? bosTileGlass(false) : "inset 0 1px 1px rgba(255,255,255,0.7), 0 1px 2px rgba(0,0,0,0.1)";
  var ring = isGrey ? "#c2c7d2" : raw;
  return {
    background: sheen + ", " + tone,
    boxShadow: (selected ? "0 0 0 2px #fff, 0 0 0 4px " + ring + ", " : "") + glass // кольцо 2px (как у колеса), не 1px «кривое»
  };
}
/* THE colour picker — ONE component for привычки / цели / команды so the choice is pixel-identical
   everywhere (David: «определись с палитрой основной»). Custom wheel + Серый + Чёрный + the Apple
   palette (BOS_APPLE_COLORS — the habit colours David likes), every circle glassy (bosColorSwatch). */
function BosColorPickerLive({
  value,
  onChange
}) {
  var isHex = typeof value === "string" && value[0] === "#";
  var custom = isHex && value !== "#0a0a0a" && value !== BOS_GREY && !BOS_APPLE_COLORS.includes(value);
  var sheen = "linear-gradient(180deg, rgba(255,255,255,0.4), rgba(255,255,255,0.06) 58%, rgba(255,255,255,0) 85%)"; // верт. стекло, не шар (David)
  var glass = typeof bosTileGlass === "function" ? bosTileGlass(false) : "inset 0 1px 1px rgba(255,255,255,0.7), 0 1px 2px rgba(0,0,0,0.1)";
  var base = {
    width: 32,
    height: 32,
    borderRadius: "50%",
    border: 0,
    flexShrink: 0,
    cursor: "pointer",
    transition: "box-shadow 0.15s"
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginTop: 8,
      overflowX: "auto",
      overflowY: "hidden",
      scrollbarWidth: "none",
      WebkitOverflowScrolling: "touch",
      padding: "10px 8px"
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "tap",
    "data-haptic": "selection",
    style: {
      position: "relative",
      width: 32,
      height: 32,
      borderRadius: "50%",
      flexShrink: 0,
      cursor: "pointer",
      background: sheen + ", conic-gradient(from 0deg, #FF3B30, #FF9500, #FFCC00, #34C759, #30B0C7, #007AFF, #AF52DE, #FF2D55, #FF3B30)",
      boxShadow: (custom ? "0 0 0 2px #fff, 0 0 0 4px var(--text-3), " : "") + glass
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "color",
    value: isHex ? value : BOS_GREY,
    onChange: e => onChange(e.target.value),
    "aria-label": "\u0421\u0432\u043E\u0439 \u0446\u0432\u0435\u0442",
    style: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      opacity: 0,
      border: 0,
      padding: 0,
      cursor: "pointer"
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 1,
      height: 26,
      background: "var(--line)",
      flexShrink: 0
    }
  }), [{
    c: BOS_GREY,
    l: "Серый (стандарт)"
  }, {
    c: "#0a0a0a",
    l: "Чёрный"
  }].map(n => /*#__PURE__*/React.createElement("button", {
    key: n.c,
    type: "button",
    className: "tap",
    "data-haptic": "selection",
    onClick: () => onChange(n.c),
    "aria-label": n.l,
    style: {
      ...base,
      ...bosColorSwatch(n.c, value === n.c)
    }
  })), BOS_APPLE_COLORS.map(c => /*#__PURE__*/React.createElement("button", {
    key: c,
    type: "button",
    className: "tap",
    "data-haptic": "selection",
    onClick: () => onChange(c),
    "aria-label": BOS_APPLE_COLOR_NAMES[c] || "Цвет",
    style: {
      ...base,
      ...bosColorSwatch(c, value === c)
    }
  })));
}

// Pull the LAST emoji grapheme a user typed, so the icon picker can BE the system emoji
// keyboard (David: «открывается клавиатура с эмодзи», not a fixed grid). Intl.Segmenter
// keeps multi-codepoint emoji (🧘‍♀️) whole; Extended_Pictographic filters out letters.
function bosExtractEmoji(s) {
  if (!s) return "";
  var picks;
  try {
    picks = Array.from(new Intl.Segmenter(undefined, {
      granularity: "grapheme"
    }).segment(s), function (x) {
      return x.segment;
    });
  } catch (e) {
    picks = Array.from(s);
  }
  for (var i = picks.length - 1; i >= 0; i--) {
    if (/\p{Extended_Pictographic}/u.test(picks[i])) return picks[i];
  }
  return "";
}

/* Emoji PANEL (live) — opens STRAIGHT on emojis. The iOS system keyboard can't be forced
   into emoji mode (it opened on ABC — David: «непонятно что делать»), so the icon tile
   opens this own sheet instead: categorised grid, tap → onPick + close. */
var BOS_EMOJI_CATS = [{
  ic: "😀",
  list: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😋", "😜", "🤪", "🤗", "🤔", "🤨", "😐", "😏", "😌", "😔", "😴", "😎", "🤓", "🧐", "🥳", "🤯", "😤", "😡", "🥺", "😱", "🤝", "🙏", "💪", "🧠", "👀", "🗣️", "👍", "👎", "👏", "🙌", "✌️", "🤞", "🔥"]
}, {
  ic: "🐶",
  list: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🦆", "🦅", "🦉", "🐝", "🦋", "🐢", "🐍", "🐙", "🦀", "🐬", "🐳", "🐠", "🌱", "🌿", "☘️", "🍀", "🌳", "🌲", "🌵", "🌴", "🌷", "🌸", "🌹", "🌻", "🌼", "🍁", "🌙", "⭐", "☀️", "🌈", "❄️", "💧"]
}, {
  ic: "🍎",
  list: ["🍎", "🍏", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🥑", "🥦", "🥕", "🌽", "🥗", "🍞", "🧀", "🥚", "🍳", "🥩", "🍗", "🍔", "🍟", "🍕", "🌮", "🍜", "🍣", "🍱", "🍦", "🍰", "🎂", "🍫", "🍬", "🍭", "☕", "🍵", "🥤", "🧃", "🍷", "🍺", "💊", "🥛", "🧂"]
}, {
  ic: "⚽",
  list: ["⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏉", "🎱", "🏓", "🏸", "🥊", "🥋", "⛳", "🏌️", "🏃", "🚶", "🧗", "🚴", "🏊", "🏄", "🧘", "🤸", "⛹️", "🏋️", "🤾", "🚣", "⛷️", "🏂", "🏆", "🥇", "🥈", "🥉", "🎯", "🎮", "🎲", "🎸", "🎹", "🎵", "🎨", "📷", "🎬", "✍️", "📖", "📚", "💻", "🧩", "♟️", "🎤"]
}, {
  ic: "✈️",
  list: ["🚗", "🚕", "🚙", "🚌", "🏎️", "🚓", "🚑", "🚒", "🚲", "🛴", "🛵", "🏍️", "✈️", "🚀", "🚁", "⛵", "🚤", "🚢", "🏠", "🏡", "🏢", "🏥", "🏦", "🏨", "🏫", "⛪", "🗼", "🗽", "🏔️", "⛰️", "🌋", "🏕️", "🏖️", "🏝️", "🌅", "🌆", "🌃", "🌉", "🗺️", "🧭", "⛺", "🚩"]
}, {
  ic: "💡",
  list: ["⌚", "📱", "💻", "⌨️", "🖥️", "🖨️", "🕹️", "💡", "🔦", "🕯️", "📷", "🎥", "📺", "📻", "⏰", "⏱️", "⌛", "💰", "💳", "💎", "🔧", "🔨", "🧰", "🔑", "🔒", "🛏️", "🚿", "🛁", "🧴", "🧹", "🧺", "🧸", "🎁", "🎈", "🎀", "📦", "✏️", "📝", "📌", "📎", "📏", "✂️", "🗑️", "🔋", "🧲"]
}, {
  ic: "❤️",
  list: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💖", "💗", "💕", "❣️", "💔", "✨", "⭐", "🌟", "💫", "⚡", "✅", "☑️", "✔️", "❌", "➕", "➖", "❓", "❗", "💯", "🔥", "🎉", "🎊", "🏁", "🚩", "♻️", "⚠️", "🔔", "💤", "🆗", "🆕", "🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "⚫", "⚪", "🟤"]
}];
/* SF-Symbols-style glyphs. Apple's REAL SF Symbols are licence-locked to Apple platforms
   and can't ship on the web — these are faithful look-alikes: clean rounded line icons on
   the same 24-grid as the UI set `I`. This map ADDS the shapes `I` lacks (fitness, food,
   nature, hobbies…); bosSymCmp resolves BOS_SF first, then falls back to `I`, so the picker
   offers ~47 icons across every habit/goal/team category. David: «настоящие iOS-символы,
   и их мало» → больше и ближе к стандарту. (`Icon` is the shared wrapper from icons.jsx.) */
var BOS_SF = {
  Flame: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
    d: "M12 3c.4 3 2.2 4.2 3.4 5.8A6 6 0 1 1 6.5 12c0-1.4.5-2.4 1.2-3.2.2 1.1.9 1.8 1.8 2C10.8 9 11 6 12 3z"
  })),
  Drop: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
    d: "M12 3c3 3.8 6 7 6 10.4A6 6 0 1 1 6 13.4C6 10 9 6.8 12 3z"
  })),
  Leaf: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
    d: "M5 21C4 12 9 4 20 4c0 11-7 16-15 16z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M9 17c3-4 6-6 9-7.5"
  })),
  Bed: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
    d: "M3 19V8M3 13h13a4 4 0 0 1 4 4v2M7 13v-1.5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 12 11.5V13"
  })),
  Sun: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7"
  })),
  Sunrise: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
    d: "M3 18.5h18M6.5 18.5a5.5 5.5 0 0 1 11 0M12 3.5V8M5 11l1.6 1.6M19 11l-1.6 1.6M2 15h2M20 15h2M9 8.5L12 5.5l3 3"
  })),
  Star: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
    d: "M12 3.6l2.6 5.2 5.8.9-4.2 4.1 1 5.7L12 16.8 6.8 19.5l1-5.7L3.6 9.7l5.8-.9L12 3.6z"
  })),
  Mountain: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
    d: "M3 20l5.5-10 3.5 5 2.2-3.5L21 20z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8 10.5l1.6-2.8"
  })),
  Tree: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
    d: "M12 3.5c2.8 0 4.6 2.2 4.6 4.6 1.9.2 3 1.6 3 3.2 0 1.5-1.2 2.7-3 2.7H7.4c-1.8 0-3-1.2-3-2.7 0-1.6 1.1-3 3-3.2 0-2.4 1.8-4.6 4.6-4.6z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 14v6.5M9 19.5h6"
  })),
  Sprout: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
    d: "M12 21v-7.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 14C12 10.4 9.1 8 5.5 8 5.5 11.6 8.4 14 12 14z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 12.5c0-3.1 2.6-5.5 6.5-5.5 0 3.1-2.9 5.5-6.5 5.5z"
  })),
  Snowflake: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
    d: "M12 3v18M4.2 7.5l15.6 9M19.8 7.5L4.2 16.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M9.7 4.3L12 6l2.3-1.7M14.3 19.7L12 18l-2.3 1.7M5.7 8.9l.2 2.8M5.7 8.9l-2.7.7M18.3 15.1l-.2-2.8M18.3 15.1l2.7-.7M18.3 8.9l-.2 2.8M18.3 8.9l2.7.7M5.7 15.1l.2-2.8M5.7 15.1l-2.7-.7"
  })),
  Bicycle: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("circle", {
    cx: "6",
    cy: "17",
    r: "3.3"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "18",
    cy: "17",
    r: "3.3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M6 17l4-7h4M9.5 10l3 4.5M12 10l2.5-2.5"
  })),
  Activity: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
    d: "M3 12.5h3.5l2-5.5 3.5 11 2.2-5.5H21"
  })),
  Cup: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
    d: "M5 8h11v5a4.5 4.5 0 0 1-4.5 4.5h-2A4.5 4.5 0 0 1 5 13V8z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16 9.5h1.8a2.2 2.2 0 0 1 0 4.4H16"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8.2 3.2c-.5.9.5 1.7 0 2.6M11.5 3.2c-.5.9.5 1.7 0 2.6"
  })),
  Apple: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
    d: "M12 7.5c-1-1.8-3.2-2.2-4.8-1C5.8 7.7 5.4 10 6.4 12.8s2.6 5 4.1 5c.7 0 1-.4 1.5-.4s.8.4 1.5.4c1.5 0 3.1-2.2 4.1-5s.6-5.1-.8-6.3c-1.6-1.2-3.8-.8-4.8 1z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 7.5c.2-1.8 1.3-2.9 2.8-3.3"
  })),
  Pill: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("rect", {
    x: "2.5",
    y: "9",
    width: "12",
    height: "6.5",
    rx: "3.25",
    transform: "rotate(-45 8.5 12.25)"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M6.3 8.7l4.6 4.6"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "16.5",
    cy: "15.5",
    r: "5"
  })),
  Music: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
    d: "M9 18V6l11-2.2V16"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "6.2",
    cy: "18",
    r: "2.8"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "17.2",
    cy: "16",
    r: "2.8"
  })),
  Headphones: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
    d: "M4.5 14v-1.5a7.5 7.5 0 0 1 15 0V14"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "13.5",
    width: "4",
    height: "6.5",
    rx: "2"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "17",
    y: "13.5",
    width: "4",
    height: "6.5",
    rx: "2"
  })),
  Palette: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
    d: "M12 3a9 9 0 0 0 0 18c1.2 0 2-1 2-2 0-.6-.3-1-.6-1.4-.3-.4-.6-.8-.6-1.4 0-1.1.9-2 2-2h1.5A4.7 4.7 0 0 0 21 9.5C21 5.9 16.9 3 12 3z"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "8",
    cy: "11",
    r: "1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "8.5",
    r: "1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "16",
    cy: "11",
    r: "1"
  })),
  Camera: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "7.5",
    width: "18",
    height: "12.5",
    rx: "3"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "13.5",
    r: "3.2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8.5 7.5L9.7 5h4.6l1.2 2.5"
  })),
  Game: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("rect", {
    x: "2",
    y: "8",
    width: "20",
    height: "9.5",
    rx: "4.75"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M7 11v3.2M5.4 12.6h3.2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "16",
    cy: "11.6",
    r: "1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "18.4",
    cy: "14",
    r: "1"
  })),
  Gift: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("rect", {
    x: "3.5",
    y: "9.5",
    width: "17",
    height: "10.5",
    rx: "1.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3.5 13.5h17M12 9.5V20"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 9.5C9.3 9.5 7.5 8.6 7.5 7.2 7.5 6 8.6 5.4 9.7 6c1.4.8 2.3 3.5 2.3 3.5s.9-2.7 2.3-3.5c1.1-.6 2.2 0 2.2 1.2 0 1.4-1.8 2.3-4.5 2.3z"
  })),
  Dollar: p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M14.7 9.3C14.1 8.3 13.1 8 12 8c-1.6 0-2.6 1-2.6 2.1 0 1 .8 1.7 2.6 2 1.9.3 2.7 1 2.7 2.1 0 1.1-1 2-2.7 2-1.1 0-2.1-.4-2.7-1.4M12 6.4v11.2"
  }))
};
// Curated order, grouped by category — what the picker shows. Each name resolves through
// bosSymCmp (BOS_SF first, then the UI set I).
var BOS_SYMBOLS = ["Heart", "Activity", "Dumbbell", "Bicycle", "Flame", "Drop", "Bed", "Pill", "Apple", "Cup", "Bulb", "Book", "Pencil", "Music", "Headphones", "Palette", "Mic", "Sun", "Sunrise", "Moon", "Clock", "Bell", "Calendar", "Target", "Trophy", "Flag", "Sparkles", "Star", "Sprout", "ChartBar", "Users", "Globe", "MapPin", "Mountain", "Tree", "Camera", "Game", "Gift", "Compass", "Briefcase", "Wallet", "Dollar", "Home", "Phone", "Mail", "Snowflake"];
function bosSymCmp(nm) {
  return typeof BOS_SF !== "undefined" && BOS_SF[nm] || (window.I || {})[nm] || null;
}

// Render a habit/goal/team icon. A "sf:<Name>" sentinel → the monochrome glyph in `color`;
// anything else (a normal emoji string) is returned UNCHANGED, so existing data and the
// DEMO stay pixel-identical. Used at every live icon site so a chosen symbol shows up
// everywhere, never as raw "sf:…" text.
function bosIcon(val, size, color) {
  if (typeof val === "string" && val.slice(0, 3) === "sf:") {
    var Cmp = bosSymCmp(val.slice(3));
    if (Cmp) return React.createElement(Cmp, {
      size: size || 22,
      color: color || "currentColor",
      strokeWidth: 1.85
    });
    return null;
  }
  return val || "";
}
function EmojiPickerLive({
  onPick,
  accent = "#0a0a0a",
  current,
  embedded = false
}) {
  var {
    close
  } = useSheet();
  var [mode, setMode] = React.useState(typeof current === "string" && current.slice(0, 3) === "sf:" ? "symbol" : "emoji");
  var [cat, setCat] = React.useState(0);
  // embedded = живёт ВНУТРИ другой шторки (напр. создание командной привычки) → не закрывать
  // общий sheet-хост на выбор, просто вернуть значок (one-sheet host рендерит одну шторку).
  var pick = e => {
    if (onPick) onPick(e);
    if (window.tgHaptic) {
      try {
        window.tgHaptic("light");
      } catch (_) {}
    }
    if (!embedded) close();
  };
  var symColor = typeof accent === "string" && accent[0] === "#" ? accent : "#0a0a0a";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "2px 10px 6px",
      color: "#0a0a0a"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      fontSize: 17,
      fontWeight: 700,
      marginBottom: 12
    }
  }, "\u0412\u044B\u0431\u0435\u0440\u0438 \u0438\u043A\u043E\u043D\u043A\u0443"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4,
      padding: 3,
      background: "var(--surface-3)",
      borderRadius: 12,
      marginBottom: 12
    }
  }, [["emoji", "Эмодзи"], ["symbol", "Символы"]].map(m => /*#__PURE__*/React.createElement("button", {
    key: m[0],
    className: "tap",
    "data-no-haptic": true,
    onClick: () => setMode(m[0]),
    style: {
      flex: 1,
      height: 34,
      borderRadius: 9,
      border: 0,
      fontSize: 13.5,
      fontWeight: 600,
      cursor: "pointer",
      background: mode === m[0] ? "#fff" : "transparent",
      color: mode === m[0] ? "#0a0a0a" : "var(--text-3)",
      boxShadow: mode === m[0] ? "0 1px 3px rgba(0,0,0,0.10)" : "none",
      transition: "background 0.15s"
    }
  }, m[1]))), mode === "symbol" ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(6, 1fr)",
      gap: 6,
      maxHeight: 264,
      overflowY: "auto",
      WebkitOverflowScrolling: "touch",
      padding: "2px 0"
    }
  }, BOS_SYMBOLS.map((nm, i) => {
    var Cmp = bosSymCmp(nm);
    if (!Cmp) return null;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      className: "tap",
      "data-no-haptic": true,
      onClick: () => pick("sf:" + nm),
      "aria-label": nm,
      style: {
        aspectRatio: "1 / 1",
        borderRadius: 14,
        border: 0,
        background: "var(--surface-3)",
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
        padding: 0
      }
    }, /*#__PURE__*/React.createElement(Cmp, {
      size: 23,
      color: symColor,
      strokeWidth: 2
    }));
  })) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4,
      marginBottom: 10
    }
  }, BOS_EMOJI_CATS.map((c, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    className: "tap",
    "data-no-haptic": true,
    onClick: () => setCat(i),
    "aria-label": "Категория " + (i + 1),
    style: {
      flex: 1,
      height: 38,
      borderRadius: 11,
      border: 0,
      fontSize: 19,
      cursor: "pointer",
      background: i === cat ? "var(--surface-3)" : "transparent"
    }
  }, c.ic))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(8, 1fr)",
      gap: 2,
      maxHeight: 248,
      overflowY: "auto",
      WebkitOverflowScrolling: "touch"
    }
  }, BOS_EMOJI_CATS[cat].list.map((e, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    className: "tap",
    "data-no-haptic": true,
    onClick: () => pick(e),
    style: {
      aspectRatio: "1 / 1",
      borderRadius: 10,
      border: 0,
      background: "transparent",
      fontSize: 25,
      cursor: "pointer",
      padding: 0
    }
  }, e)))));
}

/* LIVE avatar picker — the SAME rich emoji panel as habit/goal/team creation (BOS_EMOJI_CATS,
   category row + 8-col grid), with Memoji as the second tab. David: «не наш урезанный выбор —
   богатый как при создании привычек; слева эмодзи, справа мемодзи». SF-symbols are intentionally
   omitted here (they don't render as an avatar face). Lives live-only so it can use the rich panel;
   the shared core AvatarPickerSheet (demo + edit-profile sheet) stays untouched. */
function AvatarPickerSheetLive({
  dark = false
}) {
  var app = typeof useApp === "function" ? useApp() : null;
  var {
    close
  } = useSheet();
  var C = typeof sheetColors === "function" ? sheetColors(dark) : {
    text: "#0a0a0a",
    sub: "rgba(0,0,0,0.5)",
    field: "#f4f4f6",
    btn: "#0a0a0a",
    btnFg: "#fff"
  };
  var cur = "" + (app?.avatar || "");
  var [tab, setTab] = React.useState(cur.indexOf("emoji:") === 0 ? "emoji" : "memoji");
  var [cat, setCat] = React.useState(0);
  var pick = val => {
    try {
      app && app.setAvatar && app.setAvatar(val);
    } catch (e) {}
    if (window.tgHaptic) {
      try {
        window.tgHaptic("light");
      } catch (e) {}
    }
  };
  var CATS = typeof BOS_EMOJI_CATS !== "undefined" ? BOS_EMOJI_CATS : [];
  var MEMO = typeof BOS_MEMOJI !== "undefined" ? BOS_MEMOJI : [];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "2px 16px 8px",
      color: C.text
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 19,
      fontWeight: 700,
      textAlign: "center"
    }
  }, "\u0410\u0432\u0430\u0442\u0430\u0440"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: C.sub,
      textAlign: "center",
      marginTop: 3,
      lineHeight: 1.4
    }
  }, "\u0412\u044B\u0431\u0435\u0440\u0438 \u043B\u0438\u0446\u043E \u2014 \u042D\u043C\u043E\u0434\u0437\u0438 \u0438\u043B\u0438 \u041C\u0435\u043C\u043E\u0434\u0436\u0438. \u0421\u043C\u0435\u043D\u0438\u0442\u044C \u043C\u043E\u0436\u043D\u043E \u043A\u043E\u0433\u0434\u0430 \u0443\u0433\u043E\u0434\u043D\u043E."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      background: C.field,
      borderRadius: 999,
      padding: 4,
      margin: "14px auto 12px",
      width: "fit-content"
    }
  }, [["emoji", "Эмодзи"], ["memoji", "Мемоджи"]].map(function (m) {
    return /*#__PURE__*/React.createElement("button", {
      key: m[0],
      onClick: () => setTab(m[0]),
      className: "tap",
      "data-no-haptic": true,
      style: {
        border: 0,
        borderRadius: 999,
        padding: "7px 22px",
        fontSize: 13.5,
        fontWeight: 600,
        cursor: "pointer",
        background: tab === m[0] ? C.btn : "transparent",
        color: tab === m[0] ? C.btnFg : C.sub
      }
    }, m[1]);
  })), tab === "emoji" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4,
      marginBottom: 10
    }
  }, CATS.map(function (c, i) {
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      className: "tap",
      "data-no-haptic": true,
      onClick: () => setCat(i),
      "aria-label": "Категория " + (i + 1),
      style: {
        flex: 1,
        height: 38,
        borderRadius: 11,
        border: 0,
        fontSize: 19,
        cursor: "pointer",
        background: i === cat ? C.field : "transparent"
      }
    }, c.ic);
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(8, 1fr)",
      gap: 2,
      maxHeight: 248,
      overflowY: "auto",
      WebkitOverflowScrolling: "touch"
    }
  }, (CATS[cat] ? CATS[cat].list : []).map(function (e, i) {
    var v = "emoji:" + e;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      className: "tap",
      "data-no-haptic": true,
      onClick: () => pick(v),
      style: {
        aspectRatio: "1 / 1",
        borderRadius: 10,
        border: 0,
        background: cur === v ? C.field : "transparent",
        fontSize: 25,
        cursor: "pointer",
        padding: 0
      }
    }, e);
  }))) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(5,1fr)",
      gap: 13,
      maxHeight: 296,
      overflowY: "auto",
      padding: "2px 2px 4px"
    }
  }, MEMO.map(function (m) {
    var val = m === "default" ? null : m;
    var sel = m === "default" ? !cur || cur === "default" : cur === m;
    return /*#__PURE__*/React.createElement("button", {
      key: m,
      onClick: () => pick(val),
      className: "tap",
      "aria-label": "\u0410\u0432\u0430\u0442\u0430\u0440",
      style: {
        padding: 0,
        border: 0,
        background: "transparent",
        display: "grid",
        placeItems: "center",
        justifySelf: "center"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        borderRadius: "50%",
        padding: 3,
        boxShadow: sel ? "0 0 0 2.5px " + C.text : "none"
      }
    }, /*#__PURE__*/React.createElement(BosAvatar, {
      avatar: val,
      size: 52,
      style: {
        border: "2px solid " + (dark ? "#1c1c1e" : "#fff")
      }
    })));
  })), /*#__PURE__*/React.createElement("button", {
    onClick: close,
    className: "tap",
    style: {
      width: "100%",
      marginTop: 16,
      background: C.btn,
      color: C.btnFg,
      border: 0,
      borderRadius: 999,
      padding: 13,
      fontSize: 15,
      fontWeight: 600
    }
  }, "\u0413\u043E\u0442\u043E\u0432\u043E"));
}

/* Count check (live) — for habits whose DAILY goal is >1 (e.g. 20 отжиманий). Tap = +1,
   long-press = −1; a ring (big goals) or radial SEGMENTS (≤6) fill with the count. The day
   is marked done — and XP granted — ONLY at the FULL count (David: «экспа только за
   закрытие полной привычки»). Done flips through the shared toggleHabit (XP derives from
   the date-log); the running count lives in habit.counts[dayKey] via updateHabit (no XP). */
function HabitCountCheck({
  habit,
  app,
  xp = 10
}) {
  var goal = Math.max(2, habit.goalPerDay || 2);
  var today = bosTodayKey();
  var isDone = !!habit.done;
  var count = isDone ? goal : habit.counts && habit.counts[today] || 0;
  var accent = bosHabitColor(habit);
  var isDark = !!(typeof document !== "undefined" && document.querySelector(".bos-page.theme-dark"));
  var [tick, setTick] = React.useState(0);
  var btnRef = React.useRef(null);
  var lpTimer = React.useRef(null);
  var suppress = React.useRef(false);
  var apply = raw => {
    var next = Math.max(0, Math.min(goal, raw));
    if (next === count) return;
    var willDone = next >= goal;
    var counts = Object.assign({}, habit.counts || {});
    counts[today] = next;
    if (app && app.updateHabit) app.updateHabit(habit.id, {
      counts
    });
    if (willDone !== isDone && app && app.toggleHabit) app.toggleHabit(habit.id); // flips done + XP
    if (willDone && !isDone) setTick(function (t) {
      return t + 1;
    }); // XP pop
    if (window.tgHaptic) {
      try {
        window.tgHaptic(willDone ? "success" : "light");
      } catch (_) {}
    }
  };
  var startLP = e => {
    e.stopPropagation();
    suppress.current = false;
    lpTimer.current = setTimeout(function () {
      suppress.current = true;
      if (window.tgHaptic) {
        try {
          window.tgHaptic("rigid");
        } catch (_) {}
      }
      apply(count - 1);
    }, 480);
  };
  var endLP = () => {
    if (lpTimer.current) {
      clearTimeout(lpTimer.current);
      lpTimer.current = null;
    }
  };
  var onClick = e => {
    e.stopPropagation();
    if (suppress.current) {
      suppress.current = false;
      return;
    }
    apply(isDone ? 0 : count + 1);
  };

  // Ring geometry is 44px, but the LAYOUT box stays 30px — the ring renders as an OVERFLOWING overlay
  // so the disc lines up EXACTLY with the plain 30px checks in the column (David: «центрируй
  // относительно других» — раньше 44px-бокс смещал кружок на 7px влево). On full completion the ring
  // DISAPPEARS → only the standard graphite checkmark remains, identical to every other habit.
  var SIZE = 44,
    CX = SIZE / 2,
    R = 19.5,
    sw = 3,
    C = 2 * Math.PI * R;
  var track = isDark ? "rgba(255,255,255,0.16)" : "rgba(10,10,10,0.10)";
  var ringEls;
  if (goal <= 7) {
    var pitch = 360 / goal,
      gap = Math.min(22, pitch * 0.34);
    var pt = deg => {
      var a = deg * Math.PI / 180;
      return [(CX + R * Math.cos(a)).toFixed(2), (CX + R * Math.sin(a)).toFixed(2)];
    };
    var segs = [];
    for (var i = 0; i < goal; i++) {
      var a0 = -90 + i * pitch + gap / 2,
        a1 = -90 + (i + 1) * pitch - gap / 2;
      var p0 = pt(a0),
        p1 = pt(a1);
      segs.push(/*#__PURE__*/React.createElement("path", {
        key: i,
        d: "M " + p0[0] + " " + p0[1] + " A " + R + " " + R + " 0 0 1 " + p1[0] + " " + p1[1],
        fill: "none",
        stroke: i < count ? accent : track,
        strokeWidth: sw,
        strokeLinecap: "round",
        style: {
          transition: "stroke 0.25s ease"
        }
      }));
    }
    ringEls = segs;
  } else {
    ringEls = [/*#__PURE__*/React.createElement("circle", {
      key: "t",
      cx: CX,
      cy: CX,
      r: R,
      fill: "none",
      stroke: track,
      strokeWidth: sw
    }), /*#__PURE__*/React.createElement("circle", {
      key: "p",
      cx: CX,
      cy: CX,
      r: R,
      fill: "none",
      stroke: accent,
      strokeWidth: sw,
      strokeLinecap: "round",
      strokeDasharray: C.toFixed(2),
      strokeDashoffset: (C * (1 - count / goal)).toFixed(2),
      transform: "rotate(-90 " + CX + " " + CX + ")",
      style: {
        transition: "stroke-dashoffset 0.4s ease"
      }
    })];
  }

  // Center disc = the SAME 30px glass check as everywhere. DONE → standard checked glass + ✓ (no
  // --check-color override → same graphite as the plain checks). In progress → grey glass + count.
  var disc = isDone ? /*#__PURE__*/React.createElement("span", {
    className: "check-btn",
    style: {
      width: 30,
      height: 30
    }
  }, /*#__PURE__*/React.createElement(I.Check, {
    size: 16,
    strokeWidth: 2.8,
    color: "#fff"
  })) : /*#__PURE__*/React.createElement("span", {
    className: "check-btn unchecked",
    style: {
      width: 30,
      height: 30
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: count > 0 ? accent : "var(--text-4)",
      fontSize: 12.5,
      fontWeight: 700,
      lineHeight: 1,
      fontVariantNumeric: "tabular-nums"
    }
  }, count));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      flexShrink: 0,
      width: 30,
      height: 30,
      display: "grid",
      placeItems: "center"
    }
  }, /*#__PURE__*/React.createElement(XpFloat, {
    tick: tick,
    xp: xp,
    anchorRef: btnRef
  }), /*#__PURE__*/React.createElement("button", {
    ref: btnRef,
    className: "tap hit44",
    "data-no-haptic": true,
    onClick: onClick,
    onPointerDown: startLP,
    onPointerUp: endLP,
    onPointerLeave: endLP,
    onPointerCancel: endLP,
    "aria-label": "Прогресс " + count + " из " + goal + ", тап +1, удержание −1",
    style: {
      position: "relative",
      border: 0,
      background: "transparent",
      padding: 0,
      width: 30,
      height: 30,
      display: "grid",
      placeItems: "center",
      cursor: "pointer",
      overflow: "visible"
    }
  }, !isDone && /*#__PURE__*/React.createElement("svg", {
    width: SIZE,
    height: SIZE,
    viewBox: "0 0 " + SIZE + " " + SIZE,
    style: {
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      pointerEvents: "none",
      overflow: "visible"
    }
  }, ringEls), disc));
}

// TIMER-привычка — тот же ЯЗЫК, что у количественной (HabitCountCheck): 30px стеклянный диск в центре +
// 44px кольцо-оверлей, НО вместо счётчика внутри — кнопка ▶/⏸, а вместо колец-долей — СЕКЦИИ, которые
// наполняются по мере хода времени (David: «плей и секции внутри нашего кружочка, вместо кольца»). Тап по
// диску = старт/пауза; секции заливаются accent'ом в реальном времени; дошёл до конца → done + XP + ✓
// (кольцо исчезает, остаётся стандартная галочка, как у всех). Тап по готовому = снять отметку и сбросить.
function HabitTimerCheck({
  habit,
  app,
  xp = 10
}) {
  var total = Math.max(1, Math.round(habit.duration || 1)) * 60; // секунды
  var isDone = !!habit.done;
  var accent = bosHabitColor(habit);
  var isDark = !!(typeof document !== "undefined" && document.querySelector(".bos-page.theme-dark"));
  var [running, setRunning] = React.useState(false);
  var [elapsed, setElapsed] = React.useState(0);
  var [tick, setTick] = React.useState(0);
  var [showTime, setShowTime] = React.useState(false); // David: старт → ⏸ пару секунд → потом ТИКАЮЩЕЕ время
  var btnRef = React.useRef(null);
  var done = isDone || total > 0 && elapsed >= total;
  var frac = isDone ? 1 : Math.min(1, elapsed / total);

  // Тикаем по МЕТКАМ ВРЕМЕНИ (не по счёту тиков) → нет дрейфа, даже если вкладка «спит».
  React.useEffect(() => {
    if (!running) return;
    var base = elapsed,
      start = Date.now();
    var id = setInterval(() => {
      var e = base + (Date.now() - start) / 1000;
      if (e >= total) {
        setElapsed(total);
        setRunning(false);
        setTick(t => t + 1);
        if (window.tgHaptic) {
          try {
            window.tgHaptic("success");
          } catch (_) {}
        }
        if (!habit.done && app && app.toggleHabit) app.toggleHabit(habit.id); // flips done + XP
      } else setElapsed(e);
    }, 200);
    return () => clearInterval(id);
  }, [running]);

  // Пошёл таймер → сначала ⏸ (видно, что можно остановить), через 2.5с диск переключается на тикающее
  // оставшееся время. Пауза/сброс → обратно к значку. (David: «полосочки stop, потом тикает время».)
  React.useEffect(() => {
    if (!running) {
      setShowTime(false);
      return;
    }
    var t = setTimeout(() => setShowTime(true), 2500);
    return () => clearTimeout(t);
  }, [running]);
  var onClick = e => {
    e.stopPropagation();
    if (done) {
      // тап по готовому → снять отметку и обнулить таймер (как счётчик: done → 0)
      if (isDone && app && app.toggleHabit) app.toggleHabit(habit.id);
      setElapsed(0);
      setRunning(false);
      if (window.tgHaptic) {
        try {
          window.tgHaptic("light");
        } catch (_) {}
      }
      return;
    }
    if (window.tgHaptic) {
      try {
        window.tgHaptic("light");
      } catch (_) {}
    }
    setRunning(r => !r);
  };

  // Та же геометрия, что у HabitCountCheck (44px кольцо-оверлей над 30px-боксом → диск не съезжает).
  var SIZE = 44,
    CX = SIZE / 2,
    R = 19.5,
    sw = 3;
  var track = isDark ? "rgba(255,255,255,0.16)" : "rgba(10,10,10,0.10)";
  // Секции: число ~ по длительности (5..12), как в прежнем таймере. База — тускло, поверх — accent ровно
  // на пройденную долю (целые секции + ЧАСТИЧНАЯ текущая), поэтому реально видно, как оно наполняется.
  var SEG = Math.min(12, Math.max(5, Math.round(habit.duration || 6)));
  var pitch = 360 / SEG,
    gap = Math.min(22, pitch * 0.34);
  var pt = deg => {
    var a = deg * Math.PI / 180;
    return [(CX + R * Math.cos(a)).toFixed(2), (CX + R * Math.sin(a)).toFixed(2)];
  };
  var arc = (a0, a1) => {
    var p0 = pt(a0),
      p1 = pt(a1);
    return "M " + p0[0] + " " + p0[1] + " A " + R + " " + R + " 0 " + (a1 - a0 > 180 ? 1 : 0) + " 1 " + p1[0] + " " + p1[1];
  };
  var pos = frac * SEG;
  var ringEls = [];
  for (var i = 0; i < SEG; i++) {
    var a0 = -90 + i * pitch + gap / 2,
      a1 = -90 + (i + 1) * pitch - gap / 2;
    ringEls.push(/*#__PURE__*/React.createElement("path", {
      key: "b" + i,
      d: arc(a0, a1),
      fill: "none",
      stroke: track,
      strokeWidth: sw,
      strokeLinecap: "round"
    }));
  }
  for (var _i2 = 0; _i2 < SEG; _i2++) {
    var _a = -90 + _i2 * pitch + gap / 2,
      _a2 = -90 + (_i2 + 1) * pitch - gap / 2;
    var f = Math.max(0, Math.min(1, pos - _i2));
    if (f > 0.001) ringEls.push(/*#__PURE__*/React.createElement("path", {
      key: "f" + _i2,
      d: arc(_a, _a + (_a2 - _a) * f),
      fill: "none",
      stroke: accent,
      strokeWidth: sw,
      strokeLinecap: "round",
      style: {
        transition: "d 0.2s linear"
      }
    }));
  }

  // Оставшееся время m:ss (округляем вверх, чтобы «0:00» показалось только в самом конце).
  var remain = Math.max(0, Math.ceil(total - elapsed));
  var mmss = Math.floor(remain / 60) + ":" + (remain % 60 < 10 ? "0" : "") + remain % 60;
  // Диск = тот же 30px .check-btn. DONE → ✓. Идёт: первые ~2.5с ⏸, потом ТИКАЮЩЕЕ время. Иначе ▶ (старт/пауза).
  var disc = done ? /*#__PURE__*/React.createElement("span", {
    className: "check-btn",
    style: {
      width: 30,
      height: 30
    }
  }, /*#__PURE__*/React.createElement(I.Check, {
    size: 16,
    strokeWidth: 2.8,
    color: "#fff"
  })) : /*#__PURE__*/React.createElement("span", {
    className: "check-btn unchecked",
    style: {
      width: 30,
      height: 30,
      color: accent
    }
  }, running ? showTime ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: mmss.length > 4 ? 8 : 9.5,
      fontWeight: 800,
      letterSpacing: "-0.6px",
      fontVariantNumeric: "tabular-nums",
      lineHeight: 1
    }
  }, mmss) : /*#__PURE__*/React.createElement(I.Pause, {
    size: 13
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      display: "grid",
      placeItems: "center",
      transform: "translateX(0.5px)"
    }
  }, /*#__PURE__*/React.createElement(I.Play, {
    size: 12
  })));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      flexShrink: 0,
      width: 30,
      height: 30,
      display: "grid",
      placeItems: "center"
    }
  }, /*#__PURE__*/React.createElement(XpFloat, {
    tick: tick,
    xp: xp,
    anchorRef: btnRef
  }), /*#__PURE__*/React.createElement("button", {
    ref: btnRef,
    className: "tap hit44",
    "data-no-haptic": true,
    onClick: onClick,
    "aria-label": running ? "Пауза таймера" : done ? "Готово, снять отметку" : "Старт таймера " + Math.round(total / 60) + " минут",
    style: {
      position: "relative",
      border: 0,
      background: "transparent",
      padding: 0,
      width: 30,
      height: 30,
      display: "grid",
      placeItems: "center",
      cursor: "pointer",
      overflow: "visible"
    }
  }, !done && /*#__PURE__*/React.createElement("svg", {
    width: SIZE,
    height: SIZE,
    viewBox: "0 0 " + SIZE + " " + SIZE,
    style: {
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      pointerEvents: "none",
      overflow: "visible"
    }
  }, ringEls), disc));
}

/* Edit affordance — a ROUND glass pencil icon (NOT a text pill), the iOS way (David: «зачем
   писать „Изменить" — сделай иконку-карандаш в кружочке с тем же отражением, что у главной
   иконки привычки; стандартизировать по всему приложению»). One button for habit / goal / team
   (team = owner only). Same size as the header back button (.icon-btn 40px circle), with the hero
   tile's glass (BOS_TILE_SHEEN + bosTileGlass) so it reads as that nice reflective tile. */
function EditGlassButtonLive({
  onClick,
  label = "Изменить"
}) {
  var app = typeof useApp === "function" ? useApp() : null;
  var dark = app?.themeOverride === "dark";
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    className: "tap",
    "data-haptic": "selection",
    "aria-label": label,
    title: label,
    style: {
      width: 40,
      height: 40,
      borderRadius: "50%",
      border: 0,
      display: "grid",
      placeItems: "center",
      cursor: "pointer",
      color: dark ? "#fff" : "var(--text)",
      background: BOS_TILE_SHEEN + ", " + (dark ? "rgba(255,255,255,0.10)" : "var(--surface-3)"),
      boxShadow: bosTileGlass(dark)
    }
  }, /*#__PURE__*/React.createElement(I.Pencil, {
    size: 16,
    strokeWidth: 2
  }));
}

/* Team share — LIVE fork of core TeamShareSheet. The ONLY change: the invite link is a
   TELEGRAM deep-link t.me/<bot>?startapp=team_<cloudId> (not the github.io/?team= web URL,
   which can't open the Mini App from Telegram). The launch path decodes that start_param
   → joinViaLink. A local team without a cloudId falls back to the plain bot link. */
function TeamShareSheetLive({
  team
}) {
  var [copied, setCopied] = React.useState(false);
  var {
    close
  } = typeof useSheet === "function" ? useSheet() : {};
  var isPublic = team?.vis === "public";
  var link = team && team.cloudId && typeof bosTeamInviteLink === "function" ? bosTeamInviteLink(team.cloudId) : typeof bosInviteLink === "function" ? bosInviteLink(null) : "https://t.me/BalanceOS8_bot";
  var shareText = "Вести привычки вместе — веселее, и за совместные привычки больше XP ✨ Залетай в команду «" + (team?.name || "") + "» в BalanceOS";
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
  var shareTelegram = () => {
    var url = "https://t.me/share/url?url=" + encodeURIComponent(link) + "&text=" + encodeURIComponent(shareText);
    if (window.tgHaptic) {
      try {
        window.tgHaptic("light");
      } catch (e) {}
    }
    try {
      if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.openTelegramLink) {
        window.Telegram.WebApp.openTelegramLink(url);
        return;
      }
    } catch (e) {}
    try {
      window.open(url, "_blank");
    } catch (e) {}
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
      width: 60,
      height: 60,
      borderRadius: 16,
      margin: "0 auto 12px",
      background: BOS_TILE_SHEEN + ", var(--surface-3)",
      boxShadow: bosTileGlass(false),
      display: "grid",
      placeItems: "center",
      fontSize: 32
    }
  }, bosIcon(team?.emblem || "✨", 32, null)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 700,
      letterSpacing: "-0.3px"
    }
  }, "\u041F\u043E\u0437\u0432\u0430\u0442\u044C \u0432\u043C\u0435\u0441\u0442\u0435"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: "var(--text-3)",
      marginTop: 6,
      maxWidth: 290,
      marginInline: "auto",
      lineHeight: 1.45
    }
  }, "\u0412\u0435\u0441\u0442\u0438 \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0438 \u0432\u043C\u0435\u0441\u0442\u0435 \u2014 \u0432\u0435\u0441\u0435\u043B\u0435\u0435, \u0438 \u0437\u0430 \u0441\u043E\u0432\u043C\u0435\u0441\u0442\u043D\u044B\u0435 \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0438 \u0431\u043E\u043B\u044C\u0448\u0435 XP \u2728"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      marginTop: 10,
      fontSize: 11.5,
      fontWeight: 600,
      color: "var(--text-3)",
      background: "var(--surface-3)",
      padding: "4px 11px",
      borderRadius: 999
    }
  }, isPublic ? "🌐 Открытый · по ссылке сразу присоединятся" : "🔒 Приватный · войдут только по этой ссылке")), /*#__PURE__*/React.createElement("div", {
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
      background: "#0a0a0a",
      color: "#fff",
      borderRadius: 999,
      padding: "8px 15px",
      fontSize: 12.5,
      fontWeight: 600
    }
  }, copied ? "Готово" : "Копировать")), /*#__PURE__*/React.createElement("button", {
    onClick: shareTelegram,
    className: "tap",
    style: {
      width: "100%",
      marginTop: 18,
      border: 0,
      borderRadius: 999,
      padding: 15,
      background: "#229ED9",
      color: "#fff",
      fontSize: 15.5,
      fontWeight: 600,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 9
    }
  }, /*#__PURE__*/React.createElement(I.Send, {
    size: 18
  }), " \u041F\u043E\u0434\u0435\u043B\u0438\u0442\u044C\u0441\u044F \u0432 Telegram"), /*#__PURE__*/React.createElement("button", {
    onClick: () => close && close(),
    className: "tap",
    style: {
      width: "100%",
      marginTop: 12,
      background: "#0a0a0a",
      color: "#fff",
      border: 0,
      borderRadius: 999,
      padding: 15,
      fontSize: 15,
      fontWeight: 600
    }
  }, "\u0413\u043E\u0442\u043E\u0432\u043E"), /*#__PURE__*/React.createElement("div", {
    style: {
      height: "max(8px, var(--tg-bottom-inset, 0px))"
    }
  }));
}

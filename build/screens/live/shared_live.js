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

/* Гарантия МИКСА чипов-подсказок (David): среди четырёх всегда 1-2 «действия»
   (kind:"action" → реальный экран: состояние / создать привычку / цель) и 1-2
   «разговора» (открывают чат). ИИ-чипы без kind считаются чатом; недостающие
   действия добираются из реального состояния пользователя — никакой бутафории.
   Используют: экран ИИ, чипы в чате, ИИ-сводка на главной. */
function bosMixPillsLive(pills, app) {
  var isAct = p => p && p.kind === "action" && p.route;
  var src = Array.isArray(pills) ? pills.filter(Boolean) : [];
  var fill = [];
  try {
    var tk = typeof bosTodayKey === "function" ? bosTodayKey() : "";
    var moodSet = !!(app && app.dayMoods && app.dayMoods[tk] != null);
    var nHabits = (app && app.habits || []).length;
    if (!moodSet) fill.push({
      kind: "action",
      i: "🧭",
      label: "Отметить состояние",
      t: "Отметить состояние",
      route: "mood",
      params: null
    });
    var hLbl = nHabits ? "Ещё привычка" : "Создать привычку";
    fill.push({
      kind: "action",
      i: "➕",
      label: hLbl,
      t: hLbl,
      route: "habit-settings",
      params: {
        mode: "create"
      }
    });
    fill.push({
      kind: "action",
      i: "🌟",
      label: "Поставить цель",
      t: "Поставить цель",
      route: "goal-settings",
      params: {
        mode: "create"
      }
    });
  } catch (e) {}
  var seen = {};
  var key = p => (p && (p.label || p.t || p.prompt) || "") + "";
  var uniq = arr => arr.filter(p => {
    var k = key(p);
    return p && k && !seen[k] && (seen[k] = 1);
  });
  var chats = uniq(src.filter(p => !isAct(p)));
  var acts = uniq(src.filter(isAct).concat(fill));
  // Переплетаем: разговор, действие, разговор, действие; хвост — из остатков.
  var out = [];
  for (var k = 0; k < 2; k++) {
    if (chats[k]) out.push(chats[k]);
    if (acts[k]) out.push(acts[k]);
  }
  var rest = chats.slice(2).concat(acts.slice(2));
  for (var _k = 0; out.length < 4 && _k < rest.length; _k++) out.push(rest[_k]);
  return out.slice(0, 4);
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
      background: "var(--card, #fff)",
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
// Читаемая «чернильная» краска цифры/таймера НА СТЕКЛЯННОМ диске. В светлой теме — сам цвет
// привычки (по умолчанию графит #0a0a0a: отлично читается на светлом диске). В тёмной тёмный
// цвет НЕВИДИМ на тёмном диске (David: «цифра чёрная — не видно»), поэтому поднимаем светлоту:
// чем темнее цвет, тем сильнее осветляем к белому; уже светлые оттенки не трогаем.
function bosReadableInk(hx, isDark) {
  if (!isDark) return hx || "#0a0a0a";
  if (!(hx && hx[0] === "#" && hx.length >= 7)) return "rgba(255,255,255,0.92)";
  var r = parseInt(hx.slice(1, 3), 16),
    g = parseInt(hx.slice(3, 5), 16),
    b = parseInt(hx.slice(5, 7), 16);
  var lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum < 0.6 ? bosLightenHex(hx, 0.82 - lum * 0.5) : hx;
}
/* Смесь двух hex-цветов: hx→to на t (0..1). ФУНДАМЕНТ тема-зависимой тонировки (David:
   «цвета с пикера должны чуть отличаться в тёмной»): светлая тема осветляет к белому
   (bosLightenHex), тёмная — углубляет к тёмной подложке (bosMixHex к #101014 и т.п.),
   сохраняя оттенок насыщенным, без «засветки» пастелью. */
function bosMixHex(hx, to, t) {
  if (!(hx && hx[0] === "#" && hx.length >= 7)) return hx || "#333";
  if (!(to && to[0] === "#" && to.length >= 7)) return hx;
  var k = Math.max(0, Math.min(1, t));
  var pr = function (s, i) {
    return parseInt(s.slice(i, i + 2), 16);
  };
  var mk = function (a, b) {
    return Math.round(a + (b - a) * k).toString(16).padStart(2, "0");
  };
  return "#" + mk(pr(hx, 1), pr(to, 1)) + mk(pr(hx, 3), pr(to, 3)) + mk(pr(hx, 5), pr(to, 5));
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
  // Тёмный блик приглушён (0.22→0.12) — David: «стекло слишком ярко засвечено».
  return isDark ? "inset 0 1px 0.5px rgba(255,255,255,0.12), inset 0 0 0 0.7px rgba(255,255,255,0.06), 0 1px 2px rgba(0,0,0,0.18)" : "inset 0 1.5px 0.5px rgba(255,255,255,0.92), inset 0 0 0 0.7px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.05)";
}
// Блик тема-зависимый: в тёмной CSS-переменные гасят белый градиент (David: «пересвечено»),
// в светлой фолбэки держат прежний вид. ОДНО место — все плитки/чипы/кнопки сразу.
var BOS_TILE_SHEEN = "linear-gradient(165deg, var(--sheen-a, rgba(255,255,255,0.55)), var(--sheen-b, rgba(255,255,255,0.12)) 46%, rgba(255,255,255,0) 72%)";
// КРУГЛОЕ стекло — для ДИСКА ВНУТРИ КОЛЬЦА (свотч пикера в кольце выбора, центр орбиты в кольце
// прогресса). Направленный блик выбеливал ВЕРХ цветного круга — верхний край таял в светлый зазор,
// и кольцо казалось сверху дальше, чем снизу (David). Здесь блик радиальный и ГАСНЕТ ДО КРАЁВ
// (closest-side от точки 50%/38% докасается ровно до верхней кромки, где уже прозрачен): свет
// по-прежнему «сверху», но силуэт круга остаётся чётким по всей окружности → зазор до кольца
// читается одинаковым со всех сторон. Плитки/пилюли не трогаем — у них BOS_TILE_SHEEN.
var BOS_ORB_SHEEN = "radial-gradient(closest-side at 50% 38%, var(--sheen-a, rgba(255,255,255,0.5)), rgba(255,255,255,0.07) 66%, rgba(255,255,255,0) 92%)";
// Пара к BOS_ORB_SHEEN: РАВНОМЕРНАЯ стекло-тень круга. У bosTileGlass верхняя белая кромка +
// капля-тень ВНИЗ — на круге в кольце обе тоже «сдвигали» его оптически. Тут ободок и ореол
// одинаковы по всей окружности.
function bosOrbGlass(isDark) {
  return isDark ? "inset 0 0 1px rgba(255,255,255,0.10), inset 0 0 0 0.7px rgba(255,255,255,0.06), 0 0 2px rgba(0,0,0,0.22)" : "inset 0 0 1px rgba(255,255,255,0.85), inset 0 0 0 0.7px rgba(0,0,0,0.05), 0 0 2px rgba(0,0,0,0.07)";
}
// Grey GLASS pill — the «Быстрое добавление» chip look (grey base) + a soft glass sheen + bright
// top edge. ONE source so the home hero pills and the Habits quick-add chips stay identical
// (David: стекло на пилюли + континьюити). Spread into a chip's inline style; pair with border:0.
function bosChipGlass(isDark) {
  return {
    background: BOS_TILE_SHEEN + ", " + (isDark ? "rgba(255,255,255,0.07)" : "#F1F1F5"),
    boxShadow: isDark ? "inset 0 0.5px 0.5px rgba(255,255,255,0.08), inset 0 0 0 0.5px rgba(255,255,255,0.04)" : "inset 0 1px 0.5px rgba(255,255,255,0.95), inset 0 0 0 0.5px rgba(0,0,0,0.05)"
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
  levelsLeft,
  onTraining = null
}) {
  var {
    open: _openSheet
  } = typeof useSheet === "function" ? useSheet() : {
    open: () => {}
  };
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
    action: () => _openSheet(/*#__PURE__*/React.createElement(GoalFormSheetLive, {
      mode: "create",
      circleOn: true,
      navigate: navigate
    })),
    meta: "Вместе с друзьями",
    accent: "#85e3a8"
  }, {
    // Быстрая дверь (David: «нигде не упоминаем, что часть контактов открывается
    // после тренингов»): ачивка тренинга открывает свой круг сразу, без уровня.
    i: "🎓",
    t: "Пройди тренинг",
    d: "Ачивка тренинга сразу открывает свой круг контактов — не дожидаясь 10 уровня.",
    cta: "К тренингам",
    action: onTraining || (() => navigate("community")),
    meta: "Ключ к людям",
    accent: "#d8c4ff"
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
  }, paths.length, " \u0441\u043F\u043E\u0441\u043E\u0431\u0430 \u043E\u0442\u043A\u0440\u044B\u0442\u044C"), /*#__PURE__*/React.createElement("div", {
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
/* Кэш лиц ПЕРЕЖИВАЕТ перезапуск (localStorage): при входе кружочки людей на карточках
   встают МГНОВЕННО из последнего известного состава, облако тихо освежает следом
   (David: «секундная подгрузка людей бросается в глаза»). */
var _bosBuddyCache = function () {
  try {
    return JSON.parse(localStorage.getItem("bos:cache:buddies") || "{}") || {};
  } catch (e) {
    return {};
  }
}();
function _bosBuddyCachePersist() {
  try {
    localStorage.setItem("bos:cache:buddies", JSON.stringify(_bosBuddyCache));
  } catch (e) {}
}
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
        if (changed) {
          setMembers(d.members);
          _bosBuddyCachePersist();
        } // swap ONLY when something really changed
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
var _bosCircleCache = function () {
  try {
    return JSON.parse(localStorage.getItem("bos:cache:circles") || "{}") || {};
  } catch (e) {
    return {};
  }
}();
function _bosCircleCachePersist() {
  try {
    localStorage.setItem("bos:cache:circles", JSON.stringify(_bosCircleCache));
  } catch (e) {}
}
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
        if (changed) {
          setMembers(mem);
          _bosCircleCachePersist();
        } // swap only on real change
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
  // Свой uid берём СИНХРОННО (после авторизации cloud._uid уже известен) → фильтр «не я» верен с
  // ПЕРВОГО рендера, и свой аватар НЕ мелькает среди чужих (David: «на секунду появляется мой аватар,
  // лица дёргаются»). Фолбэк — async-догрузка, если авторизация ещё в полёте.
  var uidSt = React.useState(function () {
    if (_bosMyUidCache != null) return _bosMyUidCache;
    var u = window.bosCloud && window.bosCloud.uidSync ? window.bosCloud.uidSync() : null;
    if (u) _bosMyUidCache = u;
    return u != null ? u : null;
  });
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
  // Пока свой uid НЕ известен (редко — авторизация ещё в полёте) — лица НЕ показываем: иначе среди
  // чужих мелькнёт свой и потом отфильтруется (дёрганье). Дождёмся uid → покажем уже без себя.
  if (myUid == null) return null;
  var others = (members || []).filter(function (m) {
    return m.id !== myUid;
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
    background: "linear-gradient(150deg, var(--disc-a, #eef1f6), var(--disc-b, #dadfe7))",
    boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.07)"
  };
  if (/^m\d+$/.test(a)) return /*#__PURE__*/React.createElement("div", {
    style: Object.assign({}, disc, {
      background: "url(./assets/people/" + a + ".png) center/cover no-repeat, linear-gradient(150deg, var(--disc-a, #eef1f6), var(--disc-b, #dadfe7))",
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
      color: "var(--disc-ink, #5b6473)",
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

/* ── УВЕДОМЛЕНИЯ (секция Б плана) ─────────────────────────────────────────────
   События собираются из УЖЕ читаемых облачных данных — никаких новых таблиц и SQL:
   · заявки в мои круги (pendingRequests — только владельцу, с Принять/Отклонить),
   · новые участники моих кругов (дифф ростера против «виденных»),
   · пришедшие по моей реферальной ссылке (дифф invitedPeople),
   · «тебя приняли» (мой стук bos:knockedCircles + я уже член → круг по teamById),
   · непрочитанные сообщения чатов (прежний механизм bos:chatread).
   Прочитанность живёт на телефоне: bos:notifseen:<uid> = { inv:[ids], members:{[teamId]:[ids]} }.
   ПЕРВЫЙ взгляд поглощает текущее состояние БЕЗ событий (как ачивки — не спамим задним
   числом). Заявки не «прочитываются» — требуют решения и живут до Принять/Отклонить. */
function bosNotifSeenGet(uid) {
  try {
    return JSON.parse(localStorage.getItem("bos:notifseen:" + (uid || "local")) || "{}") || {};
  } catch (e) {
    return {};
  }
}
function bosNotifSeenSet(uid, patch) {
  try {
    var cur = bosNotifSeenGet(uid);
    localStorage.setItem("bos:notifseen:" + (uid || "local"), JSON.stringify(Object.assign(cur, patch)));
  } catch (e) {}
}
/* Полный сбор для шторки. Возвращает { requests, joined, invited, accepted, chats, absorb };
   absorb скармливается bosNotifAbsorbLive ПОСЛЕ показа (метит виденное, гасит точку). */
async function bosNotifCollectLive(app) {
  var out = {
    requests: [],
    joined: [],
    invited: [],
    accepted: [],
    buddies: [],
    chats: [],
    absorb: null
  };
  if (!(window.bosCloud && window.bosCloud.enabled())) return out;
  var me = null;
  try {
    me = await window.bosCloud.uid();
  } catch (e) {}
  var seen = bosNotifSeenGet(me);
  var teams = (app?.teams || []).filter(t => t.cloudId);
  var shHabits = (app?.habits || []).filter(h => h && h.shareCode);
  var absorb = {
    inv: [],
    members: {},
    buddies: {}
  };
  await Promise.all([
  // Заявки — только в круги, где я владелец (создатель, не joined).
  ...teams.filter(t => !t.joined).map(async t => {
    try {
      var reqs = await window.bosCloud.pendingRequests(t.cloudId);
      (reqs || []).forEach(r => out.requests.push({
        team: t,
        user: r
      }));
    } catch (e) {}
  }),
  // Новые участники: дифф свежего ростера против «виденных» id.
  ...teams.map(async t => {
    try {
      var ms = await window.bosCloud.teamMembers(t.cloudId);
      var real = (ms || []).filter(m => m && m.role !== "pending");
      var known = seen.members && seen.members[t.cloudId];
      if (Array.isArray(known)) real.forEach(m => {
        if (m.id !== me && known.indexOf(m.id) < 0) out.joined.push({
          team: t,
          user: m
        });
      });
      absorb.members[t.cloudId] = real.map(m => m.id);
    } catch (e) {}
  }),
  // Пришедшие по моей ссылке в приложение.
  (async () => {
    try {
      var inv = await window.bosCloud.invitedPeople();
      var known = seen.inv;
      if (Array.isArray(known)) (inv || []).forEach(p => {
        if (known.indexOf(p.id) < 0) out.invited.push({
          user: p
        });
      });
      absorb.inv = (inv || []).map(p => p.id);
    } catch (e) {}
  })(),
  // «Тебя приняли»: стучался (knockedCircles) и уже член → покажем круг.
  (async () => {
    var knocked = {};
    try {
      knocked = JSON.parse(localStorage.getItem("bos:knockedCircles") || "{}") || {};
    } catch (e) {}
    var ids = Object.keys(knocked).filter(k => knocked[k]);
    var mineIds = {};
    teams.forEach(t => {
      mineIds[t.cloudId] = true;
    });
    await Promise.all(ids.map(async id => {
      if (mineIds[id]) {
        bosNotifKnockResolved(id);
        return;
      } // уже открыл круг сам
      try {
        var ms = await window.bosCloud.teamMembers(id);
        var mine = (ms || []).find(m => m && m.id === me);
        if (mine && mine.role !== "pending") {
          var row = window.bosCloud.teamById ? await window.bosCloud.teamById(id) : null;
          if (row) out.accepted.push({
            row: row
          });
        }
      } catch (e) {}
    }));
  })(),
  // Совместные ПРИВЫЧКИ (buddy по shareCode): дифф участников против «виденных» —
  // «X теперь ведёт привычку с тобой» (David: друг вступил в привычку — а у обоих тишина).
  ...shHabits.map(async h => {
    try {
      if (!window.bosCloud.sharedHabitProgress) return;
      var d = await window.bosCloud.sharedHabitProgress(h.shareCode);
      var ms = d && d.members || [];
      var known = seen.buddies && seen.buddies[h.shareCode];
      if (Array.isArray(known)) ms.forEach(m => {
        if (m && m.id !== me && known.indexOf(m.id) < 0) out.buddies.push({
          habit: h,
          user: m
        });
      });
      absorb.buddies[h.shareCode] = ms.map(m => m && m.id).filter(Boolean);
    } catch (e) {}
  }),
  // Непрочитанные чаты. Новый путь — ЛЁГКИЙ count-запрос (cloud.unreadMessages) вместо
  // полной ленты на каждый круг; старый полный fetch остаётся фолбэком.
  ...teams.map(async t => {
    try {
      var lastRead = Number(localStorage.getItem("bos:chatread:" + t.cloudId) || 0);
      if (window.bosCloud.unreadMessages) {
        var u = await window.bosCloud.unreadMessages(t.cloudId, lastRead);
        if (u && u.count) out.chats.push({
          team: t,
          count: u.count,
          last: u.last
        });
        if (u) return; // null → облако споткнулось, попробуем фолбэк ниже
      }
      var rows = await window.bosCloud.loadMessages(t.cloudId);
      if (!Array.isArray(rows) || !rows.length) return;
      var unread = rows.filter(r => r && r.user_id !== me && new Date(r.created_at).getTime() > lastRead);
      if (unread.length) out.chats.push({
        team: t,
        count: unread.length,
        last: unread[unread.length - 1]
      });
    } catch (e) {}
  })]);
  out.absorb = absorb;
  return out;
}
/* Пометить показанное виденным (вступившие + рефералы; заявки и чаты живут по своим
   правилам) и разбудить точку колокольчика. */
function bosNotifAbsorbLive(absorb) {
  if (!absorb) return;
  var me = null;
  try {
    me = window.bosCloud && window.bosCloud.uidSync && window.bosCloud.uidSync();
  } catch (e) {}
  var cur = bosNotifSeenGet(me);
  var members = Object.assign({}, cur.members || {}, absorb.members || {});
  var buddies = Object.assign({}, cur.buddies || {}, absorb.buddies || {});
  bosNotifSeenSet(me, {
    inv: absorb.inv || cur.inv || [],
    members: members,
    buddies: buddies
  });
  try {
    localStorage.removeItem("bos:cache:notifdot:" + (me || "local"));
  } catch (e) {}
  try {
    window.dispatchEvent(new Event("bos:notifSeenChanged"));
  } catch (e) {}
}
/* Разрешить «стук»: заявку приняли и человек открыл круг (или круг уже у него). */
function bosNotifKnockResolved(teamId) {
  try {
    var k = JSON.parse(localStorage.getItem("bos:knockedCircles") || "{}") || {};
    if (k[teamId]) {
      delete k[teamId];
      localStorage.setItem("bos:knockedCircles", JSON.stringify(k));
      window.dispatchEvent(new Event("bos:circlesKnocked"));
    }
  } catch (e) {}
}
/* Точка колокольчика: тот же полный сбор, но с кэшем на 10 минут — главная не дёргает
   облако каждый заход. Сброс кэша — по bos:notifSeenChanged (шторка показала/решила). */
async function bosNotifHasFreshLive(app) {
  if (!(window.bosCloud && window.bosCloud.enabled())) return false;
  var me = null;
  try {
    me = window.bosCloud.uidSync && window.bosCloud.uidSync();
  } catch (e) {}
  var KEY = "bos:cache:notifdot:" + (me || "local");
  try {
    var c = JSON.parse(localStorage.getItem(KEY) || "null");
    if (c && Date.now() - c.at < 10 * 60 * 1000) return !!c.v;
  } catch (e) {}
  var d = await bosNotifCollectLive(app);
  var has = !!(d.requests.length || d.joined.length || d.invited.length || d.accepted.length || d.buddies.length || d.chats.length);
  try {
    localStorage.setItem(KEY, JSON.stringify({
      v: has,
      at: Date.now()
    }));
  } catch (e) {}
  // Первый взгляд: если «виденных» ещё нет вообще — тихо поглотим базу, чтобы у
  // старожила не вспыхнула точка задним числом на всю историю.
  var seen = bosNotifSeenGet(me);
  if (!Array.isArray(seen.inv) && d.absorb) bosNotifAbsorbLive(d.absorb);
  return has;
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
  var isApp = info.kind === "app"; // «X зовёт тебя» — пришёл по ссылке друга просто в приложение
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
  }, isApp ?
  /*#__PURE__*/
  // Человек зовёт человека — по центру ЛИЦО зовущего, без служебной плитки.
  React.createElement(BuddyFaceLive, {
    avatar: info.inviterAvatar || "default",
    name: inviter,
    size: 76
  }) : /*#__PURE__*/React.createElement("div", {
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
  }, isApp ? "Тебя пригласили" : isTeam ? "Совместная цель" : "Совместная привычка"), /*#__PURE__*/React.createElement("div", {
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
  }, isApp ? (inviter || "Друг") + " зовёт вести привычки и цели вместе. Вы уже на одной орбите — начни со своей первой привычки." : isTeam ? (inviter ? inviter + " зовёт вести цель вместе" : "Тебя позвали вести цель вместе") + " — виден прогресс каждого." : (inviter ? inviter + " зовёт вести вместе" : "Тебя позвали вести вместе") + " — будете видеть отметки друг друга и держать ритм."), !isTeam && !isApp && /*#__PURE__*/React.createElement("div", {
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
  }, isApp ? "Начали!" : isTeam ? "Отлично!" : "Веду вместе!")));
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
  }, "\xAB", dupeName, "\xBB \u0443\u0436\u0435 \u0432 \u0442\u0432\u043E\u0438\u0445 \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0430\u0445. \u041F\u0440\u0438\u0432\u044F\u0437\u0430\u0442\u044C \u0435\u0451 \u043A \u043E\u0431\u0449\u0435\u0439 \u0446\u0435\u043B\u0438 \u2014 \u0441\u0435\u0440\u0438\u044F \u0438 \u0442\u0432\u043E\u0451 \u0432\u0440\u0435\u043C\u044F \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u0442\u0441\u044F. \u0418\u043B\u0438 \u0437\u0430\u0432\u0435\u0441\u0442\u0438 \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u0443\u044E."), /*#__PURE__*/React.createElement("button", {
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
  }, "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043D\u043E\u0432\u0443\u044E \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u043E"));
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
  // opts.route — вызывающий может остаться НА СВОЁМ экране (same-route → params-refresh,
  // без перехода): деталь цели передаёт "goal-detail" и блок «Люди» вырастает на месте.
  if (opts.navigate) opts.navigate(opts.route || "team-detail", {
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
/* ПУЛЬС КРУГА (David): орбита — живой индикатор. habits[].done → спутник ЗАГОРАЕТСЯ тоном
   ЦВЕТА ПРИВЫЧКИ (habits[].color, фолбэк — цвет цели); progress (0..1) → тонкое кольцо
   прогресса вокруг центра в цвет цели; people[].active → колечко «сегодня в деле» у лица.
   Одна механика на личную цель И команду: чего нет в данных — просто не рисуется. */
function GoalOrbitMini({
  centerEmoji,
  centerColor,
  habits = [],
  people = [],
  size = 128,
  dark = false,
  fade = false,
  progress = null
}) {
  var C = size / 2;
  var cR = Math.round(size * 0.19); // центр-диск (радиус)
  var r1 = size * 0.315,
    r2 = size * 0.455; // радиусы колец (привычки / люди)
  var hbAll = (habits || []).filter(Boolean),
    ppAll = (people || []).filter(Boolean);
  // «ГОНКА ОРБИТ» (мягкая версия идеи David «кто раньше пришёл — тот ближе к цели»):
  // люди раскладываются по своим кольцам в порядке СЕГОДНЯШНЕГО вклада — лидер дня ближе
  // к центру. Только порядок внутри людских колец: привычки остаются ближними, кольца не
  // перестраиваются, композиция не дёргается.
  ppAll = ppAll.slice().sort(function (a, b) {
    var pa = typeof a.progress === "number" ? a.progress : a.active ? 1 : 0;
    var pb = typeof b.progress === "number" ? b.progress : b.active ? 1 : 0;
    return pb - pa;
  });
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
  var hSz = Math.max(16, Math.round(size * 0.15));
  var pSz = Math.max(16, Math.round(size * 0.145));
  // МУЛЬТИ-КОЛЬЦА: колец СТОЛЬКО, сколько нужно реальному числу элементов (David: «количество колец
  // реальное; 10 привычек → 3-4 кольца, не 2»). Привычки заполняют кольца от центра наружу, люди — на
  // кольцах дальше. Каждое кольцо вмещает сколько влезает по окружности; ВНЕШНИЕ кольца выходят за бокс —
  // их просто обрежет карточка (overflow:hidden). ШАГ колец РАЗВЕДЁН (0.14→0.16) — спутники соседних
  // колец не наезжают. Ближнее кольцо ПРИВЯЗАНО к внешнему краю кольца прогресса цели (cR+5) + радиус
  // спутника + 3px (David: «кружочки ближнего кольца пересекают кольцо заполнения цели»): гарантия
  // зазора при ЛЮБОМ размере, но не ближе 0.315·size. Кружки чуть уменьшены (0.16→0.15) — всё влезает.
  var progOuter = cR + 5; // внешний край кольца прогресса цели (кольцо ниже: left/top = C-cR-5, толщина ~3px)
  var ringStep = size * 0.16,
    r0 = Math.max(size * 0.315, progOuter + hSz / 2 + 3);
  // ИЕРАРХИЯ РАЗМЕРОВ (David: «ближе к центру — больше, дальше — чуть меньше, и не
  // пересекаться»): размер спутника плавно убывает с номером кольца (×0.9 за кольцо).
  // Центр остаётся крупнейшим; лица на дальних кольцах автоматически мельче привычек
  // ближних и перестают наезжать.
  var szFor = function (base, k) {
    return Math.max(14, Math.round(base * Math.pow(0.9, k)));
  };
  var buildRings = function (items, startK, dSz) {
    var out = [],
      k = startK,
      idx = 0;
    while (idx < items.length && k < 9) {
      var R = r0 + k * ringStep;
      var sk = szFor(dSz, k);
      var cap = Math.max(1, Math.floor(2 * Math.PI * R / (sk * 3.0))); // разреженно (David: 4→1 кольцо, 10→3-4 кольца)
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
  var discBg = sheen + (dark ? "linear-gradient(160deg, #464c58, #30353f)" : "linear-gradient(160deg, var(--disc-a, #eef1f6), var(--disc-b, #dadfe7))");
  var discShadow = typeof bosTileGlass === "function" ? bosTileGlass(dark) : "0 1px 3px rgba(0,0,0,0.12)";
  // ЦЕНТР живёт внутри кольца прогресса → круглое стекло (блик внутри, тень равномерная):
  // направленный блик выбеливал верх и кольцо казалось несимметричным (David). Спутники на
  // линиях орбит — без охватывающего кольца, их стекло не трогаем (вид устраивает).
  var orbSheen = typeof BOS_ORB_SHEEN !== "undefined" ? BOS_ORB_SHEEN + ", " : sheen;
  var orbShadow = typeof bosOrbGlass === "function" ? bosOrbGlass(dark) : discShadow;
  // Центр = ПОДЛОЖКА ИКОНКИ ЦЕЛИ → красится в НАСЫЩЕННЫЙ тон цвета цели (David: «цвет должен влиять на
  // подложку иконки цели»). Реальный цвет → тон + белый глиф; нейтральный → тот же серый диск. Привычки/
  // люди на кольцах остаются серыми (они не цель).
  var cReal = typeof centerColor === "string" && centerColor[0] === "#" && centerColor.length === 7 && centerColor.toLowerCase() !== "#0a0a0a" && centerColor !== BOS_GREY;
  // ТЕМА-ЗАВИСИМАЯ тонировка (David: «цвета с пикера в тёмной должны чуть отличаться»):
  // светлая — осветляем к белому (пастель), тёмная — углубляем к тёмной подложке
  // (насыщенный глубокий тон, без «засветки»).
  var centerBg = cReal ? orbSheen + (dark ? typeof bosMixHex === "function" ? bosMixHex(centerColor, "#101014", 0.22) : centerColor : typeof bosLightenHex === "function" ? bosLightenHex(centerColor, 0.25) : centerColor) : orbSheen + (dark ? "linear-gradient(160deg, #464c58, #30353f)" : "linear-gradient(160deg, var(--disc-a, #eef1f6), var(--disc-b, #dadfe7))");
  var centerInk = cReal ? "#fff" : null;
  // Цвет цели красит и КРУЖОЧКИ ПРИВЫЧЕК на орбитах (David: «пикер применяет цвет во всём
  // блоке»). Светлая: светлый тон; тёмная: тёмный тон того же оттенка. Лица людей не трогаем.
  var hDiscBg = cReal ? sheen + (dark ? typeof bosMixHex === "function" ? bosMixHex(centerColor, "#17181d", 0.62) : centerColor : typeof bosLightenHex === "function" ? bosLightenHex(centerColor, 0.62) : centerColor) : discBg;
  // ОРБИТА КРУТИТСЯ: соседние кольца — в РАЗНЫЕ стороны, внешние медленнее (спокойно). Диски
  // counter-rotate на ту же длительность → эмодзи/лица стоят прямо. bosSpin/bosSpinR — keyframes
  // (mobile.css). БЕЗ radial-маски: лишнее просто обрезается карточкой (David: «просто обрезалось»).
  var renderRing = function (R, k, items, dSz, iconSz, isPeople) {
    // Скорость = РОВНО КАК ВО ВСЕЛЕННОЙ (David: «сделай как в режиме вселенной»). Вселенная: spinT = 0.7×сек
    // (useUniSpin), OrbitField spin(ring0)=0.06 → 0.042 рад/с → полный оборот ~150с; внешние кольца
    // ×(1+0.18k) медленнее. В CSS-длительность оборота это 150с + 27с/кольцо (было 76 — вдвое быстрее).
    var cw = k % 2 === 0,
      dir = cw ? "bosSpin" : "bosSpinR",
      rev = cw ? "bosSpinR" : "bosSpin",
      dur = 150 + k * 27 + "s";
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
      if (isPeople) {
        // ПУЛЬС 2.0: кольцо человека — ЕГО зона ответственности, заполняется долей
        // закрытых им сегодня привычек круга (progress 0..1 → дуга в цвет цели);
        // центр показывает общий счёт. Нет данных о доле → active-фолбэк: отметился
        // (его «всё» = одна отметка) → полное кольцо. Тот же язык, что кольцо центра.
        var pp = typeof it.progress === "number" && isFinite(it.progress) ? Math.max(0, Math.min(1, it.progress)) : it.active ? 1 : 0;
        return /*#__PURE__*/React.createElement("span", {
          style: {
            position: "relative",
            display: "block",
            width: "100%",
            height: "100%"
          }
        }, typeof BuddyFaceLive === "function" ? /*#__PURE__*/React.createElement(BuddyFaceLive, {
          avatar: it.avatar,
          name: it.name,
          size: dSz
        }) : null, pp > 0 && /*#__PURE__*/React.createElement("span", {
          "aria-hidden": true,
          style: {
            position: "absolute",
            inset: -3,
            borderRadius: "50%",
            pointerEvents: "none",
            background: "conic-gradient(" + accent + " " + Math.round(pp * 360) + "deg, " + (dark ? "rgba(255,255,255,0.16)" : "rgba(10,10,10,0.10)") + " 0)",
            WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1.6px))",
            mask: "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1.6px))"
          }
        }));
      }
      // ПУЛЬС: привычка ЗАКРЫТА сегодня → спутник загорается тоном СВОЕГО цвета
      // (фолбэк — цвет цели) + мягкое свечение; не закрыта → приглушённый тон цели.
      var hc = typeof it.color === "string" && it.color[0] === "#" && it.color.length >= 7 && it.color.toLowerCase() !== "#0a0a0a" && it.color !== BOS_GREY ? it.color : cReal ? centerColor : null;
      var lit = !!it.done && !!hc;
      var bg = lit ? sheen + (dark ? bosMixHex(hc, "#101014", 0.2) : bosLightenHex(hc, 0.28)) : hDiscBg;
      var glow = lit ? discShadow + ", 0 0 10px " + hc + (dark ? "59" : "59") : discShadow;
      return /*#__PURE__*/React.createElement("span", {
        style: {
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          background: bg,
          boxShadow: glow,
          transition: "background 0.45s ease, box-shadow 0.45s ease",
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
    var s = szFor(hSz, rg.k);
    return renderRing(rg.R, rg.k, rg.items, s, Math.round(s * 0.52), false);
  }), pRings.rings.map(function (rg) {
    var s = szFor(pSz, rg.k);
    return renderRing(rg.R, rg.k, rg.items, s, Math.round(s * 0.52), true);
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      left: C - cR,
      top: C - cR,
      width: cR * 2,
      height: cR * 2,
      borderRadius: "50%",
      background: centerBg,
      boxShadow: progress != null && progress >= 1 ? orbShadow + ", 0 0 13px " + accent + (dark ? "66" : "4d") : orbShadow,
      transition: "box-shadow 0.5s ease",
      display: "grid",
      placeItems: "center",
      fontSize: cIcon,
      lineHeight: 1
    }
  }, typeof bosIcon === "function" ? bosIcon(centerEmoji || "🎯", cIcon, centerInk) : centerEmoji || "🎯"), progress != null && /*#__PURE__*/React.createElement("span", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      left: C - cR - 5,
      top: C - cR - 5,
      width: (cR + 5) * 2,
      height: (cR + 5) * 2,
      borderRadius: "50%",
      pointerEvents: "none",
      background: "conic-gradient(" + accent + " " + Math.round(Math.max(0, Math.min(1, progress)) * 360) + "deg, " + (dark ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.65)") + " 0)",
      WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2.4px))",
      mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2.4px))"
    }
  }));
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
        color: bosReadableInk(accent, isDark)
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
    className: "bos-reorder-float",
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
  spanFull,
  onAdd,
  addLabel,
  onGear
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
    className: "bos-reorder-float",
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
    "aria-label": addLabel || "Добавить",
    style: {
      pointerEvents: "auto",
      width: 44,
      height: 44,
      borderRadius: "50%",
      border: 0,
      display: "grid",
      placeItems: "center",
      cursor: "pointer",
      color: typeof document !== "undefined" && document.querySelector(".bos-page.theme-dark") ? "#fff" : "var(--text)",
      background: BOS_TILE_SHEEN + ", " + (typeof document !== "undefined" && document.querySelector(".bos-page.theme-dark") ? "rgba(64,64,68,0.96)" : "rgba(255,255,255,0.97)"),
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
  }, "\u0413\u043E\u0442\u043E\u0432\u043E"), onGear && /*#__PURE__*/React.createElement("button", {
    onClick: onGear,
    className: "tap",
    "data-haptic": "selection",
    "aria-label": "\u041E\u0444\u043E\u0440\u043C\u043B\u0435\u043D\u0438\u0435",
    style: {
      pointerEvents: "auto",
      width: 44,
      height: 44,
      borderRadius: "50%",
      border: 0,
      display: "grid",
      placeItems: "center",
      cursor: "pointer",
      color: typeof document !== "undefined" && document.querySelector(".bos-page.theme-dark") ? "#fff" : "var(--text)",
      background: BOS_TILE_SHEEN + ", " + (typeof document !== "undefined" && document.querySelector(".bos-page.theme-dark") ? "rgba(64,64,68,0.96)" : "rgba(255,255,255,0.97)"),
      boxShadow: "0 10px 26px rgba(0,0,0,0.30), inset 0 1px 1px rgba(255,255,255,0.9), inset 0 0 0 0.5px rgba(0,0,0,0.08)",
      animation: "bosMenuPop 0.32s cubic-bezier(0.34,1.5,0.4,1) both"
    }
  }, /*#__PURE__*/React.createElement(I.Settings, {
    size: 20,
    strokeWidth: 2
  }))), typeof document !== "undefined" && document.querySelector(".page-stack") || document.body), /*#__PURE__*/React.createElement("div", {
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
},
// Лента челленджей ПЕРЕЕХАЛА со страницы «Привычки» (слияние с главной, David): готовые
// привычки/цели/«вместе» с XP-бонусом одной строкой чипов. Добирается на доску сама
// (как плитки) — правило видимости «НЕ в hidden», см. effLayout в home_live.
{
  id: "quick",
  t: "Быстрое добавление",
  d: "Челленджи с бонусом XP",
  emoji: "⚡"
}, {
  id: "week",
  t: "Эта неделя",
  d: "Недельная активность",
  emoji: "📅"
},
// «Состояние» СКРЫТО до согласованного макета (David: «нарисуй, как оно должно выглядеть,
// где быть и как себя вести — в масштабе человека и мультиплеера, а не тяп-ляп»). Кейс
// id==="mood" в home_live жив; вернуть = строка {id:"mood"} сюда + добор в effLayout.
{
  id: "team",
  t: "Вместе",
  d: "Ваши совместные цели",
  emoji: "👥"
},
// v528 (Д): контейнеры «Привычки»/«Цели» УБРАНЫ — плитки привычек и целей теперь СВОБОДНЫЕ
// элементы сетки главной (homeLayout, ключи h:<id>/g:<id>), их не включают из галереи.
{
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

/* ЕДИНАЯ ГАЛЕРЕЯ ГЛАВНОГО ЭКРАНА — полный каталог того, что может жить на доске: виджеты,
   привычки, цели и совместные цели. Одна логика для шторки «+» (AddWidgetSheetLive) и страницы
   настроек «Главный экран» (HomeCustomizeLive) — никакого дрейфа. Правила видимости:
   - виджет включён = "w:<id>" есть в order (виджеты сами на доску не добираются);
   - плитка включена = её ключ НЕ в hidden (добор в home_live сам держит живые плитки на доске).
   Поэтому у плиток тумблер честно показывает «на главной», даже если ключ ещё не персистнут. */
function HomeGalleryContentLive({
  dark = false,
  onStyle = null
}) {
  var app = typeof useApp === "function" ? useApp() : null;
  var layout = app && app.homeLayout && Array.isArray(app.homeLayout.order) ? app.homeLayout : {
    order: [],
    hidden: []
  };
  var hidden = Array.isArray(layout.hidden) ? layout.hidden : [];
  var inOrder = k => layout.order.indexOf(k) >= 0;
  var haptic = () => {
    if (window.tgHaptic) {
      try {
        window.tgHaptic("light");
      } catch (e) {}
    }
  };
  var setL = (order, hid) => {
    if (app && app.setHomeLayout) {
      app.setHomeLayout({
        order,
        hidden: hid
      });
      haptic();
    }
  };
  var toggleWidget = id => {
    var k = "w:" + id;
    // «Быстрое добавление» добирается на доску само (как плитки) → его вкл = НЕ в hidden.
    if (id === "quick") {
      toggleTile(k);
      return;
    }
    if (inOrder(k)) setL(layout.order.filter(x => x !== k), hidden.indexOf(k) < 0 ? hidden.concat([k]) : hidden);else setL(layout.order.concat([k]), hidden.filter(x => x !== k));
  };
  var widgetOn = id => id === "quick" ? hidden.indexOf("w:quick") < 0 : inOrder("w:" + id);
  var tileOn = k => hidden.indexOf(k) < 0;
  var toggleTile = k => {
    if (tileOn(k)) setL(layout.order.filter(x => x !== k), hidden.concat([k]));else setL(inOrder(k) ? layout.order : layout.order.concat([k]), hidden.filter(x => x !== k));
  };
  var defs = typeof BOS_HOME_WIDGETS !== "undefined" ? BOS_HOME_WIDGETS : [];
  // shelved-копии круга (Г) и goalOnly в каталоге доски не участвуют — они спрятаны со страниц.
  var habits = (app && app.habits || []).filter(h => !h.shelved && !h.goalOnly);
  var goals = app && app.goals || [];
  var teams = app && app.teams || [];
  // Локальный фолбэк для страницы настроек: там доски за шторкой нет, меню стиля
  // открывается прямо по месту (на доске шторка закрывается — это делает onStyle).
  var [styleHere, setStyleHere] = React.useState(false);
  var openStyle = () => {
    haptic();
    if (onStyle) onStyle();else setStyleHere(true);
  };
  // Компактная библиотека (David: «прям компактнее, много места в высоту») — строки-миниатюры:
  // одна карточка на секцию, волосяные разделители, малые тумблеры.
  var kicker = txt => /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      letterSpacing: 0.9,
      textTransform: "uppercase",
      color: "var(--text-4)",
      padding: "12px 4px 5px"
    }
  }, txt);
  var row = ({
    key,
    icon,
    name,
    sub,
    on,
    onToggle
  }, i, arr) => /*#__PURE__*/React.createElement("div", {
    key: key,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      width: "100%",
      padding: "6.5px 10px",
      borderTop: i ? "0.5px solid " + (dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.055)") : "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 28,
      height: 28,
      borderRadius: 9,
      display: "grid",
      placeItems: "center",
      fontSize: 15,
      flexShrink: 0,
      background: dark ? "rgba(255,255,255,0.08)" : "#fff",
      boxShadow: bosTileGlass(dark),
      opacity: on ? 1 : 0.5,
      transition: "opacity 0.2s"
    }
  }, icon), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      opacity: on ? 1 : 0.55,
      transition: "opacity 0.2s",
      display: "flex",
      alignItems: "baseline",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      whiteSpace: "nowrap",
      flexShrink: 0,
      maxWidth: "100%",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, name), sub && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-4)",
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, sub)), /*#__PURE__*/React.createElement(Switch, {
    small: true,
    on: on,
    onChange: onToggle,
    dark: dark
  }));
  // Секции — СТЕКЛЯННО-СЕРЫЕ карточки в стиле приложения (David: «шторка не в наш стиль
  // цветов» — белые карточки на белой шторке сливались; тон = как чипы/плитки, surface-3).
  var card = items => /*#__PURE__*/React.createElement("div", {
    style: {
      background: BOS_TILE_SHEEN + ", " + (dark ? "rgba(255,255,255,0.06)" : "var(--surface-3)"),
      borderRadius: 14,
      boxShadow: bosTileGlass(dark),
      overflow: "hidden"
    }
  }, items.map((it, i, arr) => row(it, i, arr)));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      color: "var(--text)"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: openStyle,
    className: "tap",
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      width: "100%",
      padding: "8px 10px",
      border: 0,
      cursor: "pointer",
      textAlign: "left",
      color: "var(--text)",
      marginTop: 2,
      background: BOS_TILE_SHEEN + ", " + (dark ? "rgba(255,255,255,0.06)" : "var(--surface-3)"),
      borderRadius: 14,
      boxShadow: bosTileGlass(dark)
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 28,
      height: 28,
      borderRadius: 9,
      display: "grid",
      placeItems: "center",
      flexShrink: 0,
      background: dark ? "rgba(255,255,255,0.08)" : "#fff",
      boxShadow: bosTileGlass(dark)
    }
  }, /*#__PURE__*/React.createElement(I.Settings, {
    size: 15,
    color: "var(--text)"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      display: "flex",
      alignItems: "baseline",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 600
    }
  }, "\u0421\u0442\u0438\u043B\u044C \u043A\u0430\u0440\u0442\u043E\u0447\u0435\u043A"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-4)"
    }
  }, "\u0444\u043E\u0440\u043C\u044B, \u043E\u0442\u043C\u0435\u0442\u043A\u0438, \u043B\u0438\u0446\u0430")), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 15,
    color: "var(--text-4)"
  })), !onStyle && typeof CardStyleMenuLive === "function" && /*#__PURE__*/React.createElement(CardStyleMenuLive, {
    open: styleHere,
    onClose: () => setStyleHere(false),
    anchorRef: null
  }), kicker("Виджеты"), card(defs.map(o => ({
    key: "w:" + o.id,
    icon: o.emoji,
    name: o.t,
    sub: o.d,
    on: widgetOn(o.id),
    onToggle: () => toggleWidget(o.id)
  }))), habits.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, kicker("Привычки"), card(habits.map(h => {
    var k = "h:" + h.id;
    return {
      key: k,
      icon: typeof bosIcon === "function" ? bosIcon(h.emoji || "🌱", 15, h.color) : h.emoji || "🌱",
      name: h.name,
      sub: null,
      on: tileOn(k),
      onToggle: () => toggleTile(k)
    };
  }))), goals.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, kicker("Цели"), card(goals.map(g => {
    var k = "g:" + g.id;
    return {
      key: k,
      icon: typeof bosIcon === "function" ? bosIcon(g.emoji || "🎯", 15, g.color) : g.emoji || "🎯",
      name: g.name,
      sub: null,
      on: tileOn(k),
      onToggle: () => toggleTile(k)
    };
  }))), teams.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, kicker("Совместные цели"), card(teams.map(t => {
    var k = typeof bosTeamKeyLive === "function" ? bosTeamKeyLive(t) : "t:" + (t.cloudId || t._id || t.id);
    var n = Array.isArray(t.members) ? t.members.length : 0;
    return {
      key: k,
      icon: typeof bosIcon === "function" ? bosIcon(t.emblem || "👥", 15, t.accent) : t.emblem || "👥",
      name: t.name,
      sub: "Вместе" + (n ? " · " + n : ""),
      on: tileOn(k),
      onToggle: () => toggleTile(k)
    };
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-4)",
      lineHeight: 1.45,
      padding: "12px 4px 0",
      textAlign: "center"
    }
  }, "\u0412\u0441\u0451 \u044D\u0442\u043E \u2014 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0438 \u0433\u043B\u0430\u0432\u043D\u043E\u0439. \u0417\u0430\u0436\u043C\u0438 \u043B\u044E\u0431\u0443\u044E \u043F\u0440\u044F\u043C\u043E \u043D\u0430 \u0433\u043B\u0430\u0432\u043D\u043E\u0439, \u0447\u0442\u043E\u0431\u044B \u043F\u0435\u0440\u0435\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u0438\u043B\u0438 \u0443\u0431\u0440\u0430\u0442\u044C."));
}

/* Шторка «+» на главной — тонкая обёртка над единой галереей (см. HomeGalleryContentLive).
   bos-sheet-scroll: каталог длинный (все привычки и цели), тело шторки скроллится само. */
function AddWidgetSheetLive({
  defs = [],
  dark = false,
  onStyle = null
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "bos-sheet-scroll",
    style: {
      paddingLeft: 18,
      paddingRight: 18,
      paddingBottom: 8,
      color: "var(--text)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      marginBottom: 2
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 19,
      fontWeight: 800,
      letterSpacing: "-0.3px"
    }
  }, "\u0413\u043B\u0430\u0432\u043D\u044B\u0439 \u044D\u043A\u0440\u0430\u043D"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-3)",
      marginTop: 3
    }
  }, "\u0421\u043E\u0431\u0435\u0440\u0438 \u0441\u0432\u043E\u0439: \u0432\u0438\u0434\u0436\u0435\u0442\u044B, \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0438 \u0438 \u0446\u0435\u043B\u0438")), /*#__PURE__*/React.createElement(HomeGalleryContentLive, {
    dark: dark,
    onStyle: onStyle
  }));
}

/* «+» (Главная и Привычки) — КЛАССИЧЕСКИЙ стеклянный поповер (David: «нравилась небольшая
   стеклянная менюшка — привычку или цель, не перегружало; верни»). Три пункта: Привычку / Цель
   (наши формы-шторки) + тихий третий «Готовый челлендж» → шторка-каталог пресетов по категориям
   (CreatePickerSheetLive custom={false} — без верхних строк «своё», они уже здесь). */
function CreateMenuLive({
  open,
  onClose,
  anchorRef,
  navigate
}) {
  var {
    open: _openSheet
  } = typeof useSheet === "function" ? useSheet() : {
    open: () => {}
  };
  var _app = typeof useApp === "function" ? useApp() : null;
  var isDark = _app?.themeOverride === "dark"; // тёмная тема: тёмное стекло вместо белого
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
  var items = [{
    icon: I.Flame,
    label: "Привычку",
    go: () => _openSheet(/*#__PURE__*/React.createElement(HabitFormSheetLive, {
      mode: "create",
      navigate: navigate
    }))
  }, {
    icon: I.Flag,
    label: "Цель",
    go: () => _openSheet(/*#__PURE__*/React.createElement(GoalFormSheetLive, {
      mode: "create",
      navigate: navigate
    }))
  }, {
    icon: I.Bolt,
    label: "Готовый челлендж",
    go: () => {
      if (typeof CreatePickerSheetLive === "function") _openSheet(/*#__PURE__*/React.createElement(CreatePickerSheetLive, {
        navigate: navigate,
        custom: false
      }));
    }
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
      // Плотный фон (David: «не делай слишком прозрачным — мешает читать что в меню»): почти
      // непрозрачное стекло вместо полупрозрачного, содержимое читается на любом фоне.
      background: isDark ? "rgba(28,29,34,0.97)" : "rgba(255,255,255,0.97)",
      WebkitBackdropFilter: "blur(22px) saturate(150%)",
      backdropFilter: "blur(22px) saturate(150%)",
      border: "0.5px solid " + (isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.06)"),
      boxShadow: "0 16px 44px rgba(0,0,0," + (isDark ? "0.55" : "0.20") + ")"
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
      borderTop: i === 2 ? "0.5px solid " + (isDark ? "rgba(255,255,255,0.10)" : "rgba(10,10,10,0.08)") : 0,
      // тонкая черта отделяет «готовое» от «своего»
      fontSize: 16,
      fontWeight: 600,
      color: isDark ? "#f2f2f5" : "#0a0a0a",
      cursor: "pointer",
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": true,
    style: {
      width: 30,
      height: 30,
      borderRadius: 9,
      background: isDark ? "rgba(255,255,255,0.10)" : "rgba(10,10,10,0.05)",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, React.createElement(it.icon, {
    size: 18,
    color: isDark ? "#f2f2f5" : "#0a0a0a",
    strokeWidth: 1.9
  })), it.label)))), document.body);
}

/* Серый фон ШТОРКИ (David: «подложки белые, а бэкграунд слегка серенький — как на всех
   страницах»): абсолютный слой под содержимым, за ручкой-गрэбом (zIndex -1). */
function SheetGreyBgLive() {
  // data-sheet-grey = маркер: CSS-правило .bos-sheet:has([data-sheet-grey]) красит СAMУ панель
  // шторки в серый — тогда серый доходит до скруглённого верха (ручки) и не кончается при
  // прокрутке (старый absolute-слой ехал вместе с контентом → белые полосы, баг David).
  // Сам слой остаётся фолбэком для старых webview без :has(). В тёмной теме var(--bg) НЕ
  // переключается (.theme-dark задаёт фон напрямую) — тёмный цвет задаём сами.
  var app = typeof useApp === "function" ? useApp() : null;
  var dark = app?.themeOverride === "dark";
  return /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    "data-sheet-grey": true,
    style: {
      position: "absolute",
      inset: 0,
      zIndex: -1,
      background: dark ? "#151517" : "var(--bg, #f2f2f4)",
      borderRadius: "24px 24px 0 0"
    }
  });
}

/* Шапка ШТОРКИ-ФОРМЫ (iOS-модалка): слева круглая стеклянная «✕» (закрыть), справа «✓»
   (сохранить) — не нужно листать до низа (David). Единая для привычки И цели. */
function SheetFormHeadLive({
  title,
  onClose,
  onDone
}) {
  var app = typeof useApp === "function" ? useApp() : null;
  var dark = app?.themeOverride === "dark";
  var glass = {
    width: 38,
    height: 38,
    borderRadius: "50%",
    border: 0,
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    flexShrink: 0,
    color: dark ? "#fff" : "var(--text)",
    background: BOS_TILE_SHEEN + ", " + (dark ? "rgba(255,255,255,0.10)" : "#fff"),
    boxShadow: bosTileGlass(dark)
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "2px 0 4px"
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClose,
    className: "tap",
    "data-haptic": "selection",
    "aria-label": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C",
    style: glass
  }, /*#__PURE__*/React.createElement(I.X, {
    size: 17,
    strokeWidth: 2.2
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      textAlign: "center",
      fontSize: 18,
      fontWeight: 700,
      letterSpacing: "-0.3px",
      color: "var(--text)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, title), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onDone,
    className: "tap",
    "data-haptic": "light",
    "aria-label": "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C",
    style: glass
  }, /*#__PURE__*/React.createElement(I.Check, {
    size: 18,
    strokeWidth: 2.5
  })));
}

// ─── СТИЛЬ КАРТОЧЕК страницы «Привычки» ───────────────────────────────────────────────────────────
// David: «формы + тоглы внутри». Дефолт = ТЕКУЩИЙ вид (квадрат, неделя, имя+лица) — не меняем, человек
// сам покрутит. Запоминается в localStorage; смена шлёт событие → список перерисовывается вживую.
var BOS_CARD_STYLE_DEFAULT = {
  form: "rect",
  name: true,
  marks: "none",
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
  orbits: true,
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

// ─── ОБЩИЕ ПЛИТКИ привычки/цели (David: «унифицировать») ──────────────────────────────────────────
// Плитки вынесены СЮДА из HabitsLive и стали самодостаточными (тема/стиль/хендлеры через хуки), чтобы
// и страница «Привычки», и виджеты ГЛАВНОЙ рисовали ОДНО И ТО ЖЕ и слушали ОДИН стиль. Настройки в
// шестерёнке теперь влияют на оба экрана. `from` = откуда открыт detail (habits/home). ctx.mode —
// режим перестановки сетки (на «Привычках»); на главной всегда false.
function useBosCardStyle() {
  var st = React.useState(bosLoadCardStyle),
    s = st[0],
    setS = st[1];
  React.useEffect(function () {
    var h = function () {
      setS(bosLoadCardStyle());
    };
    window.addEventListener("bos:cardStyleChanged", h);
    return function () {
      window.removeEventListener("bos:cardStyleChanged", h);
    };
  }, []);
  return s;
}
function useBosGoalStyle() {
  var st = React.useState(bosLoadGoalStyle),
    s = st[0],
    setS = st[1];
  React.useEffect(function () {
    var h = function () {
      setS(bosLoadGoalStyle());
    };
    window.addEventListener("bos:cardStyleChanged", h);
    return function () {
      window.removeEventListener("bos:cardStyleChanged", h);
    };
  }, []);
  return s;
}
// Тема-производные плиток — ТЕ ЖЕ значения, что были в HabitsLive (rowBg/cardShadow/iconBg).
function bosTileTheme(isDark) {
  return {
    rowBg: isDark ? "#141414" : "#ffffff",
    cardShadow: isDark ? "none" : "0 1px 2px rgba(0,0,0,0.04)",
    iconBg: isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)"
  };
}
// ЕДИНЫЙ «скин» карточки цели/команды (вынесен из HabitsLive.goalSkin, самодостаточен по isDark).
function bosGoalSkin(color, isDark) {
  var th = bosTileTheme(isDark);
  var accent = color && ("" + color).toLowerCase() !== "#0a0a0a" && color !== "#8E8E93" ? color : null;
  if (!accent) return {
    hasColor: false,
    accent: isDark ? "#e8e8ea" : "#0a0a0a",
    bg: th.rowBg,
    shadow: th.cardShadow,
    txt: "var(--text)",
    sub: "var(--text-4)",
    lbl: "var(--text-4)",
    val: "var(--text-3)",
    track: isDark ? "rgba(255,255,255,0.12)" : "rgba(10,10,10,0.07)",
    fill: isDark ? "#e6e6ea" : "#0a0a0a",
    iconBg: BOS_TILE_SHEEN + ", " + th.iconBg,
    iconInk: null
  };
  if (isDark) return {
    hasColor: true,
    accent: accent,
    bg: "linear-gradient(180deg, rgba(255,255,255,0.13), rgba(255,255,255,0) 62%), " + (typeof bosMixHex === "function" ? bosMixHex(accent, "#0d0f14", 0.24) : accent),
    shadow: "0 4px 12px rgba(0,0,0,0.45), inset 0 0 0 0.5px rgba(255,255,255,0.10)",
    txt: "#fff",
    sub: "rgba(255,255,255,0.72)",
    lbl: "rgba(255,255,255,0.6)",
    val: "rgba(255,255,255,0.85)",
    track: "rgba(0,0,0,0.35)",
    fill: typeof bosLightenHex === "function" ? bosLightenHex(accent, 0.18) : accent,
    iconBg: BOS_TILE_SHEEN + ", " + accent,
    iconInk: "#fff"
  };
  var soft = typeof bosLightenHex === "function" ? bosLightenHex(accent, 0.52) : accent;
  return {
    hasColor: true,
    accent: accent,
    bg: "linear-gradient(180deg, rgba(255,255,255,0.5), rgba(255,255,255,0) 62%), " + soft,
    shadow: "0 4px 11px rgba(50,40,20,0.10), inset 0 0 0 0.5px rgba(255,255,255,0.55)",
    txt: "#1b1b1f",
    sub: "rgba(27,27,31,0.58)",
    lbl: "rgba(27,27,31,0.5)",
    val: "rgba(27,27,31,0.72)",
    track: "rgba(255,255,255,0.55)",
    fill: accent,
    iconBg: BOS_TILE_SHEEN + ", " + (typeof bosLightenHex === "function" ? bosLightenHex(accent, 0.25) : accent),
    iconInk: "#fff"
  };
}
function HabitTileLive({
  habit,
  ctx = {
    mode: false
  },
  from = "habits"
}) {
  var app = typeof useApp === "function" ? useApp() : null;
  var navigate = (typeof useNav === "function" ? useNav() : {}).navigate || function () {};
  var isDark = !!(app && app.themeOverride === "dark");
  var cardStyle = useBosCardStyle();
  var th = bosTileTheme(isDark),
    rowBg = th.rowBg,
    cardShadow = th.cardShadow;
  var toggle = app && app.toggleHabit || function () {};
  var h = habit;
  var rect = cardStyle.form === "rect";
  var onOpen = ctx.mode ? undefined : () => navigate("habit-detail", {
    habit: h,
    from: from
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
    float: true,
    color: h.color,
    dark: isDark
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
    size: rect ? 16 : 20,
    max: rect ? 5 : 3
  }), typeof CircleFacesLive === "function" && /*#__PURE__*/React.createElement(CircleFacesLive, {
    habit: h,
    size: rect ? 16 : 20,
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
      background: BOS_TILE_SHEEN + ", " + (h.color ? h.color + "26" : th.iconBg),
      boxShadow: bosTileGlass(isDark),
      display: "grid",
      placeItems: "center",
      fontSize: 19,
      flexShrink: 0
    }
  }, bosIcon(h.emoji, 21, h.color));
  var chip = typeof ChallengeProgressChip === "function" ? /*#__PURE__*/React.createElement(ChallengeProgressChip, {
    habit: h
  }) : null;
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
    }, h.name), chip, marks && /*#__PURE__*/React.createElement("div", {
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
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8
    }
  }, icon, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexShrink: 0
    }
  }, faces, ctrl)), chip, cardStyle.name && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "auto",
      paddingTop: 10,
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
      marginTop: cardStyle.name ? 7 : "auto",
      paddingTop: cardStyle.name ? 0 : 12
    }
  }, marks));
}
/* Стабильный ключ плитки круга для homeLayout: облачный id живёт дольше локального. */
function bosTeamKeyLive(t) {
  if (!t) return "t:";
  var id = t.cloudId != null && t.cloudId !== "" ? t.cloudId : t._id != null ? t._id : t.id;
  return "t:" + id;
}

/* ПЛИТКА КРУГА (совместной цели) — вынесена из habits_live в ОБЩИЙ компонент, потому что
   теперь живёт и на ГЛАВНОЙ (ключи t:<id> в homeLayout), не только на «Привычках».
   Та же форма, что плитка цели (goalStyle: баннер/квадрат + орбиты + прогресс), но эмблема,
   ЛИЦА участников и командный счёт; ест stale-while-revalidate кэш детали (_bosTeamGet). */
function TeamTileLive({
  team: t,
  ctx = {
    mode: false
  },
  from = "habits"
}) {
  var app = typeof useApp === "function" ? useApp() : null;
  var navigate = (typeof useNav === "function" ? useNav() : {}).navigate || function () {};
  var isDark = !!(app && app.themeOverride === "dark");
  var goalStyle = useBosGoalStyle();
  var habits = app && app.habits || [];
  var banner = goalStyle.form === "banner";
  var _ck = t.cloudId || null;
  var _cHabits = _ck && typeof _bosTeamGet === "function" ? _bosTeamGet("habits:" + _ck) : null;
  var _cRoster = _ck && typeof _bosTeamGet === "function" ? _bosTeamGet("roster:" + _ck) : null;
  var _cGoal = _ck && typeof _bosTeamGet === "function" ? _bosTeamGet("goal:" + _ck) : null;
  var tHabits = Array.isArray(_cHabits) && _cHabits.length ? _cHabits : Array.isArray(t.habits) ? t.habits : [];
  var tgt = _cGoal && _cGoal.target || t.target || 0;
  var cur = _cGoal && _cGoal.current != null ? _cGoal.current : t.current != null ? t.current : Math.round((t.progress || 0) * tgt);
  var pct = tgt > 0 ? Math.min(1, cur / tgt) : t.progress || 0;
  var sk = bosGoalSkin(t.accent || t.color, isDark);
  var onOpen = ctx.mode ? undefined : () => navigate("team-detail", {
    team: t,
    from: from
  });
  // t.members из облачного списка бывает ЧИСЛОМ (count), из снапшота — массивом лиц: guard.
  var members = Array.isArray(_cRoster) && _cRoster.length ? _cRoster : Array.isArray(t.members) ? t.members : [];
  // Пульс: привычка done горит своим цветом (моя локальная копия по teamHabitId), кольцо
  // человека = доля закрытых им сегодня привычек круга (todayUsers из кэша детали).
  var _tk = typeof bosTodayKey === "function" ? bosTodayKey() : null;
  var orbitHabits = tHabits.map(h => {
    var mine = h && h.id != null ? (habits || []).find(x => x.teamHabitId === h.id) : null;
    return {
      emoji: h && h.emoji,
      color: mine && mine.color || h && h.color || null,
      done: mine ? !!mine.done : !!(h && h.doneByMe)
    };
  });
  var _pt = tHabits.length || 0;
  var _anyTU = tHabits.some(h => h && Array.isArray(h.todayUsers));
  var orbitPeople = members.filter(Boolean).map(m => {
    var progress = null;
    if (_pt && _anyTU && m.id != null) progress = tHabits.filter(h => h && Array.isArray(h.todayUsers) && h.todayUsers.indexOf(m.id) !== -1).length / _pt;
    return {
      avatar: m.avatar,
      name: m.name,
      active: !!(_tk && m.days && m.days[_tk]),
      progress
    };
  });
  var orbit = goalStyle.orbits && typeof GoalOrbitMini === "function" ? /*#__PURE__*/React.createElement(GoalOrbitMini, {
    centerEmoji: t.emblem || "👥",
    centerColor: t.accent || t.color,
    habits: orbitHabits,
    people: orbitPeople,
    size: banner ? 132 : 152,
    dark: isDark,
    fade: true,
    progress: pct
  }) : null;
  var faces = !orbit && members.length ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(PeopleStackLive, {
    people: members,
    size: 20,
    max: 3
  })) : null;
  var pctEl = /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 800,
      color: sk.hasColor ? sk.txt : sk.accent,
      fontVariantNumeric: "tabular-nums",
      flexShrink: 0
    }
  }, Math.round(pct * 100), "%");
  var valTxt = t.target ? cur + " / " + tgt + " " + (t.unit || "") : Math.round(pct * 100) + "%";
  var progBar = goalStyle.progress ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
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
      color: sk.lbl,
      textTransform: "uppercase",
      letterSpacing: 0.7
    }
  }, "\u0426\u0435\u043B\u044C"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      color: sk.val,
      fontVariantNumeric: "tabular-nums"
    }
  }, valTxt)), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 7,
      borderRadius: 999,
      background: sk.track,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      height: "100%",
      width: pct * 100 + "%",
      borderRadius: 999,
      background: sk.hasColor ? sk.fill : "linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0) 72%), " + sk.accent
    }
  }))) : null;
  var icon = /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 13,
      background: sk.iconBg,
      boxShadow: bosTileGlass(isDark),
      display: "grid",
      placeItems: "center",
      fontSize: 20,
      flexShrink: 0
    }
  }, bosIcon(t.emblem || "👥", 22, sk.hasColor ? sk.iconInk : t.accent || t.color));
  if (banner) {
    return /*#__PURE__*/React.createElement("div", {
      className: ctx.mode ? "" : "tap",
      onClick: onOpen,
      style: {
        background: sk.bg,
        borderRadius: 22,
        boxShadow: sk.shadow,
        padding: 16,
        display: "flex",
        alignItems: "center",
        gap: 14,
        minHeight: 116,
        pointerEvents: ctx.mode ? "none" : "auto",
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: 11
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 12
      }
    }, !orbit && icon, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, goalStyle.name && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 16,
        fontWeight: 700,
        color: sk.txt,
        letterSpacing: "-0.3px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, t.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: sk.sub,
        marginTop: 1
      }
    }, "\u0412\u043C\u0435\u0441\u0442\u0435", members.length ? " · " + members.length : "")), !orbit && (faces || pctEl)), progBar), orbit);
  }
  return /*#__PURE__*/React.createElement("div", {
    className: ctx.mode ? "" : "tap",
    onClick: onOpen,
    style: {
      background: sk.bg,
      borderRadius: 22,
      boxShadow: sk.shadow,
      padding: "13px 13px 12px",
      height: orbit ? 146 : undefined,
      minHeight: 146,
      boxSizing: "border-box",
      position: "relative",
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
      justifyContent: "flex-start",
      textAlign: "left",
      pointerEvents: ctx.mode ? "none" : "auto",
      overflow: "hidden"
    }
  }, orbit ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      pointerEvents: "none"
    }
  }, orbit), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "auto",
      position: "relative",
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: 8
    }
  }, goalStyle.name ? /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      fontSize: 14,
      fontWeight: 600,
      color: sk.txt,
      letterSpacing: "-0.2px",
      lineHeight: 1.2,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, t.name) : /*#__PURE__*/React.createElement("span", null), goalStyle.progress && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 800,
      color: sk.hasColor ? sk.txt : sk.accent,
      fontVariantNumeric: "tabular-nums",
      flexShrink: 0
    }
  }, Math.round(pct * 100), "%"))) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8
    }
  }, icon, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexShrink: 0
    }
  }, faces, pctEl)), goalStyle.name && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      fontSize: 15,
      fontWeight: 600,
      color: sk.txt,
      letterSpacing: "-0.2px",
      lineHeight: 1.25,
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical",
      overflow: "hidden"
    }
  }, t.name), progBar && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "auto",
      paddingTop: 12
    }
  }, progBar)));
}
function GoalTileLive({
  goal,
  ctx = {
    mode: false
  },
  from = "habits"
}) {
  var app = typeof useApp === "function" ? useApp() : null;
  var navigate = (typeof useNav === "function" ? useNav() : {}).navigate || function () {};
  var isDark = !!(app && app.themeOverride === "dark");
  var goalStyle = useBosGoalStyle();
  var habits = app && app.habits || [];
  var g = goal;
  var banner = goalStyle.form === "banner";
  var gp = typeof bosGoalProgress === "function" ? bosGoalProgress(g, habits) : {
    pct: g.target > 0 ? Math.min(1, (g.current || 0) / g.target) : 0,
    current: g.current || 0
  };
  var pct = gp.pct;
  var curVal = gp.current;
  var sk = bosGoalSkin(g.color, isDark);
  var onOpen = ctx.mode ? undefined : () => navigate("goal-detail", {
    goal: g,
    from: from
  });
  var orbit = goalStyle.orbits && typeof GoalCardOrbit === "function" ? /*#__PURE__*/React.createElement(GoalCardOrbit, {
    goal: g,
    habits: habits,
    size: banner ? 132 : 152,
    dark: isDark,
    fade: true,
    progress: pct
  }) : null;
  var pctEl = /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 800,
      color: sk.hasColor ? sk.txt : sk.accent,
      fontVariantNumeric: "tabular-nums",
      flexShrink: 0
    }
  }, Math.round(pct * 100), "%");
  var icon = /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 13,
      background: sk.iconBg,
      boxShadow: bosTileGlass(isDark),
      display: "grid",
      placeItems: "center",
      fontSize: 20,
      flexShrink: 0
    }
  }, bosIcon(g.emoji || "🎯", 22, sk.hasColor ? sk.iconInk : g.color));
  var progBar = goalStyle.progress ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
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
      color: sk.lbl,
      textTransform: "uppercase",
      letterSpacing: 0.7
    }
  }, "\u0426\u0435\u043B\u044C"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      color: sk.val,
      fontVariantNumeric: "tabular-nums"
    }
  }, curVal, " / ", g.target, " ", g.unit || "")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 7,
      borderRadius: 999,
      background: sk.track,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      height: "100%",
      width: pct * 100 + "%",
      borderRadius: 999,
      background: sk.hasColor ? sk.fill : "linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0) 72%), " + sk.accent
    }
  }))) : null;
  if (banner) {
    return /*#__PURE__*/React.createElement("div", {
      className: ctx.mode ? "" : "tap",
      onClick: onOpen,
      style: {
        background: sk.bg,
        borderRadius: 22,
        boxShadow: sk.shadow,
        padding: 16,
        display: "flex",
        alignItems: "center",
        gap: 14,
        minHeight: 116,
        pointerEvents: ctx.mode ? "none" : "auto",
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: 11
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 12
      }
    }, !orbit && icon, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, goalStyle.name && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 16,
        fontWeight: 700,
        color: sk.txt,
        letterSpacing: "-0.3px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, g.name), g.deadline && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: sk.sub,
        marginTop: 1
      }
    }, "\u0434\u043E ", g.deadline)), !orbit && pctEl), progBar), orbit);
  }
  return /*#__PURE__*/React.createElement("div", {
    className: ctx.mode ? "" : "tap",
    onClick: onOpen,
    style: {
      background: sk.bg,
      borderRadius: 22,
      boxShadow: sk.shadow,
      padding: "13px 13px 12px",
      height: orbit ? 146 : undefined,
      minHeight: 146,
      boxSizing: "border-box",
      position: "relative",
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
      justifyContent: "flex-start",
      textAlign: "left",
      pointerEvents: ctx.mode ? "none" : "auto",
      overflow: "hidden"
    }
  }, orbit ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      pointerEvents: "none"
    }
  }, orbit), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "auto",
      position: "relative",
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: 8
    }
  }, goalStyle.name ? /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      fontSize: 14,
      fontWeight: 600,
      color: sk.txt,
      letterSpacing: "-0.2px",
      lineHeight: 1.2,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, g.name) : /*#__PURE__*/React.createElement("span", null), goalStyle.progress && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 800,
      color: sk.hasColor ? sk.txt : sk.accent,
      fontVariantNumeric: "tabular-nums",
      flexShrink: 0
    }
  }, Math.round(pct * 100), "%"))) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8
    }
  }, icon, pctEl), goalStyle.name && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      fontSize: 15,
      fontWeight: 600,
      color: sk.txt,
      letterSpacing: "-0.2px",
      lineHeight: 1.25,
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical",
      overflow: "hidden"
    }
  }, g.name), progBar && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "auto",
      paddingTop: 12
    }
  }, progBar)));
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
  // «Общий вид» (David: «общие визуальные настройки в шестерёнке»): эффект стекла — тот же
  // глобальный тумблер bos:glass, что в настройках профиля, но под рукой прямо из тряски.
  var [glassOn, setGlassOn] = React.useState(() => {
    try {
      return localStorage.getItem("bos:glass") !== "0";
    } catch (e) {
      return true;
    }
  });
  var setGlass = v => {
    setGlassOn(v);
    try {
      localStorage.setItem("bos:glass", v ? "1" : "0");
    } catch (e) {}
    try {
      window.dispatchEvent(new Event("bos:glassChanged"));
    } catch (e) {}
  };
  React.useEffect(() => {
    if (!open) return;
    setHs(bosLoadCardStyle());
    setGs(bosLoadGoalStyle());
    // Без якоря (открытие из галереи/настроек) — паркуемся под шапкой справа, доска видна.
    if (anchorRef && anchorRef.current) {
      var r = anchorRef.current.getBoundingClientRect();
      setPos({
        right: Math.round(window.innerWidth - r.right),
        top: Math.round(r.bottom + 10)
      });
    } else setPos({
      right: 12,
      top: 78
    });
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
    width: "30",
    height: "18",
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
    width: "30",
    height: "18",
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
    width: "30",
    height: "18",
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
  // Компактнее (David: «тумблеры поменьше, блок компактнее»): узкая панель, малые тумблеры, сжатые поля.
  var formBtn = (key, label, icon, cur, onPick) => /*#__PURE__*/React.createElement("button", {
    key: key,
    onClick: () => onPick(key),
    className: "tap",
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 5,
      padding: "9px 6px",
      borderRadius: 12,
      border: cur === key ? "1.5px solid #0a0a0a" : "1.5px solid rgba(10,10,10,0.12)",
      background: cur === key ? "rgba(10,10,10,0.05)" : "transparent",
      cursor: "pointer"
    }
  }, icon, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 600,
      color: "#0a0a0a"
    }
  }, label));
  // Компактный сегмент — СВОЙ (шаренный .tab-pill с padding 18px не влезал в узкую панель).
  var seg = (val, opts, onPick) => /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4,
      background: "rgba(10,10,10,0.05)",
      borderRadius: 11,
      padding: 3
    }
  }, opts.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.v,
    onClick: () => onPick(o.v),
    className: "tap",
    style: {
      flex: 1,
      minWidth: 0,
      border: 0,
      borderRadius: 8,
      padding: "5.5px 4px",
      fontSize: 12.5,
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
      padding: "6px 2px",
      fontSize: 13.5,
      fontWeight: 500,
      color: "#0a0a0a"
    }
  }, /*#__PURE__*/React.createElement("span", null, label), /*#__PURE__*/React.createElement(Switch, {
    small: true,
    on: on,
    onChange: onCh
  }));
  var divider = /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: "rgba(10,10,10,0.08)",
      margin: "10px 0 8px"
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
      width: 236,
      padding: 11,
      borderRadius: 20,
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
  }, {
    v: "app",
    l: "Общий вид"
  }], setTab), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 9
    }
  }), tab === "habits" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 7
    }
  }, formBtn("rect", "Строка", RC, hs.form, k => setH({
    form: k
  })), formBtn("square", "Квадрат", SQ, hs.form, k => setH({
    form: k
  }))), divider, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 600,
      marginBottom: 6,
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
  })))) : tab === "goals" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 7
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
  }, "\u041E\u0440\u0431\u0438\u0442\u044B \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u044E\u0442 \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0438 \u0438 \u043B\u044E\u0434\u0435\u0439 \u0432\u043E\u043A\u0440\u0443\u0433 \u0446\u0435\u043B\u0438 \u2014 \u043F\u0440\u0435\u0432\u044C\u044E, \u0432\u043E\u043A\u0440\u0443\u0433 \u0447\u0435\u0433\u043E \u043E\u043D\u0430.")) : /*#__PURE__*/React.createElement(React.Fragment, null, toggleRow("Эффект стекла", glassOn, setGlass), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "rgba(10,10,10,0.42)",
      lineHeight: 1.4,
      padding: "4px 2px 0"
    }
  }, "\u0421\u0442\u0435\u043A\u043B\u044F\u043D\u043D\u044B\u0435 \u0431\u043B\u0438\u043A\u0438 \u043D\u0430 \u043F\u043B\u0438\u0442\u043A\u0430\u0445 \u0438 \u0434\u0438\u0441\u043A\u0430\u0445. \u0412\u044B\u043A\u043B\u044E\u0447\u0438 \u2014 \u0441\u0442\u0430\u043D\u0435\u0442 \u043F\u043B\u043E\u0441\u043A\u043E \u0438 \u043B\u0435\u0433\u0447\u0435 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0443.")))), document.body);
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
      background: "linear-gradient(150deg, var(--disc-a, #eef1f6), var(--disc-b, #dadfe7))",
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
    onClick: () => navigate("profile", {
      from: "home"
    }),
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
  var {
    open: _openSheet
  } = typeof useSheet === "function" ? useSheet() : {
    open: () => {}
  };
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
  var _livePills = _liveBrief && Array.isArray(_liveBrief.pills) && _liveBrief.pills.length ? typeof bosMixPillsLive === "function" ? bosMixPillsLive(_liveBrief.pills.slice(0, 4), heroApp) : _liveBrief.pills.slice(0, 4) : null;
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
    go: () => _openSheet(/*#__PURE__*/React.createElement(HabitFormSheetLive, {
      mode: "create",
      navigate: navigate
    }))
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
  }, (_livePills || (typeof bosMixPillsLive === "function" ? bosMixPillsLive : x => x)([{
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
  }], heroApp)).map((c, i) => /*#__PURE__*/React.createElement("button", {
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
  app,
  query,
  onCount
}) {
  var isDark = app?.themeOverride === "dark";
  var [list, setList] = React.useState(null);
  var [busy, setBusy] = React.useState({});
  var [requested, setRequested] = React.useState({});
  // query → режим ПОИСКА: ищем открытые круги по имени (cloud.searchTeams) вместо витрины;
  // onCount сообщает родителю, сколько нашлось (для честной пустышки «ничего не нашлось»).
  React.useEffect(() => {
    var on = true;
    var q = ("" + (query || "")).trim();
    try {
      if (window.bosCloud && window.bosCloud.enabled()) {
        var p = q && window.bosCloud.searchTeams ? window.bosCloud.searchTeams(q) : window.bosCloud.discoverTeams();
        p.then(ts => {
          if (!on) return;
          var arr = Array.isArray(ts) ? ts : [];
          setList(arr);
          if (onCount) onCount(arr.length);
        }).catch(() => {
          if (!on) return;
          setList([]);
          if (onCount) onCount(0);
        });
      } else {
        setList([]);
        if (onCount) onCount(0);
      }
    } catch (e) {
      setList([]);
      if (onCount) onCount(0);
    }
    return () => {
      on = false;
    };
  }, [query]);
  // While LOADING (null) → render nothing (no promissory skeleton that pops then collapses).
  // Once LOADED-EMPTY ([]) → a warm, HONEST invite: «Найти» is the community pulse, so the live
  // section shouldn't read as a dead blank — but we never fabricate circles that don't exist.
  // В режиме поиска пустышка не нужна — родитель показывает общую «ничего не нашлось».
  if (!list) return null;
  if (query && !list.length) return null;
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
      background: "linear-gradient(150deg, var(--disc-a, #eef1f6), var(--disc-b, #dadfe7))",
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
      ...bosChipGlass(isDark),
      padding: "3px 9px",
      borderRadius: 999
    }
  }, "\uD83C\uDF10 \u041E\u0442\u043A\u0440\u044B\u0442\u0430\u044F \xB7 ", t.members, " \u0443\u0447\u0430\u0441\u0442."))), /*#__PURE__*/React.createElement("button", {
    onClick: () => join(t),
    disabled: busy[t.id] || requested[t.id],
    className: "tap",
    style: {
      flexShrink: 0,
      background: busy[t.id] || requested[t.id] ? "var(--card-2)" : "var(--cta, #0a0a0a)",
      color: busy[t.id] || requested[t.id] ? "var(--text-3)" : "var(--cta-ink, #fff)",
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
/* Старт челленджа-круга — ОБЩАЯ логика (v526: её зовут и плитки новой мозаики «Найти»,
   и прежняя горизонтальная витрина): круг в «Цели» + практика в «Привычки» + облако. */
function bosStartSeedCircleLive(app, navigate, s) {
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
      on: false
    }
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
}

/* v526: витрина больше НЕ в ленте «Найти» (её место заняла мозаика CircleTileLive с теми же данными и bosStartSeedCircleLive); компонент оставлен на случай возврата. */
function SeedCirclesShowcaseLive({
  app,
  navigate
}) {
  var isDark = app?.themeOverride === "dark";
  var start = s => bosStartSeedCircleLive(app, navigate, s);
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
        background: "linear-gradient(150deg, var(--disc-a, #eef1f6), var(--disc-b, #dadfe7))",
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
        ...bosChipGlass(isDark),
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
// used = СКОЛЬКО ЛЮДЕЙ уже потратили XP у этого партнёра (David: «серенький человечек + число,
// незаметненько, но чтобы считывалось») — социальное доказательство на карточке и чипом в детали.
var BOS_PARTNERS = [{
  id: "medit",
  name: "Открытая медитация",
  emblem: "🧘",
  accent: "#B9D4FF",
  cost: 250,
  used: 150,
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
  used: 350,
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
  used: 70,
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
  used: 210,
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
  used: 480,
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
  used: 50,
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

// КАРТА ПАРТНЁРОВ (v543, David: «карта должна быть РЕАЛЬНАЯ Яндекс, а не бутафорская»).
// РЕАЛЬНАЯ Яндекс.Карта (JS API 2.1, ключ из mapkey.js → window.BOS_YANDEX_KEY), лениво грузится
// при показе; пины партнёров (эмодзи), тап → нативная деталь партнёра. Пока город один — Москва.
// РЕЗЕРВ: если Яндекс не загрузился (офлайн / нет ключа / домен) — под картой ЖИВЁТ прежняя
// СТИЛИЗОВАННАЯ карта (парк/река/дороги + пины), так экран НИКОГДА не «сломается».
// Реальные координаты 6 партнёров по центру Москвы (у самих партнёров geo пока нет).
var BOS_PARTNER_PINS = {
  medit: [19, 47],
  bachata: [45, 41],
  box: [73, 43],
  yoga: [80, 67],
  coffee: [31, 71],
  art: [56, 78]
};
var BOS_PARTNER_GEO = {
  medit: [55.7658, 37.6384],
  bachata: [55.7797, 37.6335],
  box: [55.7770, 37.5890],
  yoga: [55.7304, 37.6017],
  coffee: [55.7636, 37.5920],
  art: [55.7415, 37.6100]
};
// Ленивая загрузка Яндекс JS API 2.1 — один общий промис на всё приложение.
function bosLoadYandexMaps() {
  if (typeof window === "undefined") return Promise.reject();
  if (window.__bosYmapsPromise) return window.__bosYmapsPromise;
  var key = window.BOS_YANDEX_KEY;
  if (!key) return window.__bosYmapsPromise = Promise.reject(new Error("no key"));
  window.__bosYmapsPromise = new Promise(function (resolve, reject) {
    if (window.ymaps && window.ymaps.Map) {
      resolve(window.ymaps);
      return;
    }
    var s = document.getElementById("bos-ymaps");
    if (!s) {
      s = document.createElement("script");
      s.id = "bos-ymaps";
      s.src = "https://api-maps.yandex.ru/2.1/?apikey=" + encodeURIComponent(key) + "&lang=ru_RU";
      s.async = true;
      document.head.appendChild(s);
    }
    s.addEventListener("load", function () {
      window.ymaps ? window.ymaps.ready(function () {
        resolve(window.ymaps);
      }) : reject(new Error("ymaps missing"));
    });
    s.addEventListener("error", function () {
      reject(new Error("ymaps load error"));
    });
  });
  return window.__bosYmapsPromise;
}
function PartnersMapLive({
  app,
  navigate,
  compact = false,
  from = "community"
}) {
  var isDark = app && app.themeOverride === "dark";
  var H = compact ? 156 : 232;
  var open = p => {
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
  var [ready, setReady] = React.useState(false); // Яндекс встал и отрисовался
  var mapRef = React.useRef(null);
  var mapObj = React.useRef(null);
  React.useEffect(function () {
    var alive = true;
    bosLoadYandexMaps().then(function (ymaps) {
      if (!alive || !mapRef.current || mapObj.current) return;
      try {
        var map = new ymaps.Map(mapRef.current, {
          center: [55.752, 37.615],
          zoom: compact ? 11 : 12,
          controls: compact ? [] : ["zoomControl"]
        }, {
          suppressMapOpenBlock: true,
          yandexMapDisablePoiInteractivity: true
        });
        map.behaviors.disable("scrollZoom");
        if (compact) map.behaviors.disable(["drag", "multiTouch"]);
        var Pin = ymaps.templateLayoutFactory.createClass('<div style="position:relative;transform:translate(-50%,-100%);width:' + (compact ? 34 : 38) + 'px;height:' + (compact ? 34 : 38) + 'px;border-radius:12px;background:#fff;box-shadow:0 3px 9px rgba(20,30,20,0.30);display:grid;place-items:center;font-size:' + (compact ? 17 : 19) + 'px;">$[properties.emoji]<span style="position:absolute;bottom:-4px;left:50%;transform:translateX(-50%) rotate(45deg);width:9px;height:9px;background:#fff;border-radius:2px;"></span></div>');
        BOS_PARTNERS.forEach(function (p) {
          var g = BOS_PARTNER_GEO[p.id];
          if (!g) return;
          var pm = new ymaps.Placemark(g, {
            emoji: p.emblem,
            hintContent: p.name
          }, {
            iconLayout: Pin,
            iconShape: {
              type: "Rectangle",
              coordinates: [[-18, -38], [18, 2]]
            }
          });
          pm.events.add("click", function () {
            open(p);
          });
          map.geoObjects.add(pm);
        });
        try {
          map.setBounds(map.geoObjects.getBounds(), {
            checkZoomRange: true,
            zoomMargin: compact ? 24 : 40
          });
        } catch (e) {}
        mapObj.current = map;
        if (alive) setReady(true);
      } catch (e) {/* оставляем стилизованный резерв */}
    }).catch(function () {/* нет ключа/офлайн → стилизованный резерв */});
    return function () {
      alive = false;
      try {
        if (mapObj.current) {
          mapObj.current.destroy();
          mapObj.current = null;
        }
      } catch (e) {}
    };
  }, [compact]);
  var land = isDark ? "radial-gradient(120% 90% at 20% 10%, #1b2430, #141b24 60%, #10151c)" : "radial-gradient(120% 90% at 20% 10%, #f3f6ef, #e9efe6 60%, #e3ebe0)";
  var park = isDark ? "#1e2c22" : "#d7ead0";
  var river = isDark ? "#17293b" : "#bcd8f2";
  var roadA = isDark ? "rgba(255,255,255,0.09)" : "#ffffff";
  var roadB = isDark ? "rgba(255,255,255,0.05)" : "#e7e2d6";
  var bub = isDark ? "#232a33" : "#ffffff";
  var chipBg = isDark ? "rgba(20,27,24,0.6)" : "rgba(255,255,255,0.72)";
  var chipInk = isDark ? "#dfe7dd" : "#2b3a2b";
  var sz = compact ? 32 : 38;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 22,
      overflow: "hidden",
      boxShadow: "var(--card-shadow)",
      position: "relative",
      height: H,
      background: land
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 366 232",
    preserveAspectRatio: "none",
    style: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%"
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M-10 168 Q55 138 120 168 T250 168 Q300 186 262 242 L-10 242 Z",
    fill: park
  }), /*#__PURE__*/React.createElement("path", {
    d: "M-10 66 C90 44 120 134 230 112 S360 168 400 134 L400 162 C360 196 320 132 230 145 S90 78 -10 100 Z",
    fill: river,
    opacity: "0.9"
  }), /*#__PURE__*/React.createElement("g", {
    stroke: roadA,
    strokeWidth: "6",
    fill: "none",
    opacity: "0.9",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M34 -10 C50 66 26 140 60 250"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M-10 48 C110 66 220 40 400 78"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M-10 182 C120 170 260 198 400 182"
  })), /*#__PURE__*/React.createElement("g", {
    stroke: roadB,
    strokeWidth: "2",
    fill: "none",
    opacity: "0.8"
  }, /*#__PURE__*/React.createElement("ellipse", {
    cx: "183",
    cy: "120",
    rx: "140",
    ry: "86"
  }))), BOS_PARTNERS.map(p => {
    var pos = BOS_PARTNER_PINS[p.id];
    if (!pos) return null;
    return /*#__PURE__*/React.createElement("div", {
      key: p.id,
      className: "tap",
      onClick: () => open(p),
      "aria-label": p.name,
      style: {
        position: "absolute",
        left: pos[0] + "%",
        top: pos[1] + "%",
        transform: "translate(-50%,-100%)",
        cursor: "pointer",
        zIndex: 2
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        inset: -2,
        borderRadius: 14,
        background: typeof bosMixHex === "function" && isDark ? bosMixHex(p.accent, "#101014", 0.42) : p.accent,
        zIndex: -1
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        width: sz,
        height: sz,
        borderRadius: 12,
        background: bub,
        display: "grid",
        placeItems: "center",
        fontSize: Math.round(sz * 0.52),
        boxShadow: "0 3px 8px rgba(20,30,20,0.22)"
      }
    }, p.emblem));
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: "50%",
      top: "54%",
      transform: "translate(-50%,-50%)",
      zIndex: 2
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: -11,
      borderRadius: "50%",
      background: "rgba(46,124,246,0.18)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 16,
      height: 16,
      borderRadius: "50%",
      background: "#2E7CF6",
      border: "2.5px solid #fff",
      boxShadow: "0 1px 4px rgba(0,0,0,0.25)"
    }
  })), /*#__PURE__*/React.createElement("div", {
    ref: mapRef,
    "aria-hidden": !ready,
    style: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      zIndex: 2,
      opacity: ready ? 1 : 0,
      pointerEvents: ready ? "auto" : "none",
      transition: "opacity 0.35s ease"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 12,
      left: 12,
      right: 12,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      zIndex: 4,
      pointerEvents: "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: chipInk,
      background: chipBg,
      backdropFilter: "blur(6px)",
      WebkitBackdropFilter: "blur(6px)",
      padding: "5px 10px",
      borderRadius: 999
    }
  }, "\uD83D\uDDFA \u0420\u044F\u0434\u043E\u043C \xB7 \u041C\u043E\u0441\u043A\u0432\u0430"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: chipInk,
      background: chipBg,
      backdropFilter: "blur(6px)",
      WebkitBackdropFilter: "blur(6px)",
      padding: "5px 10px",
      borderRadius: 999
    }
  }, BOS_PARTNERS.length, " \u043C\u0435\u0441\u0442 \u043F\u043E\u0431\u043B\u0438\u0437\u043E\u0441\u0442\u0438")));
}

// Горизонтальная лента партнёров про ТРАТУ XP. Цветные карточки-впечатления (см. ниже). Тап по карточке →
// нативная страница партнёра PartnerDetailLive (описание, адрес, даты, кнопка «Получить»).
function PartnersShowcaseLive({
  app,
  navigate,
  from = "community",
  onAll
}) {
  var isDarkP = app?.themeOverride === "dark"; // тёмная: глубокие тона карточек (David)
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
  }, "\uD83C\uDF81 \u041F\u0430\u0440\u0442\u043D\u0451\u0440\u044B \xB7 \u043F\u043E\u0442\u0440\u0430\u0442\u0438\u0442\u044C XP"), onAll ?
  /*#__PURE__*/
  /* Обзор «Все» (v526): правый край = «Все ›» на полный раздел-чип. */
  React.createElement("button", {
    onClick: onAll,
    className: "tap",
    "data-haptic": "selection",
    style: {
      border: 0,
      background: "transparent",
      padding: 0,
      fontSize: 12.5,
      fontWeight: 600,
      color: "var(--text-3)",
      display: "inline-flex",
      alignItems: "center",
      gap: 1,
      cursor: "pointer"
    }
  }, "\u0412\u0441\u0435 ", /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 13,
    color: "var(--text-4)"
  })) : /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (window.tgHaptic) {
        try {
          window.tgHaptic("selection");
        } catch (e) {}
      }
      navigate("partners-all", {
        from: from
      });
    },
    className: "tap",
    style: {
      border: 0,
      background: "transparent",
      padding: 0,
      fontSize: 11.5,
      fontWeight: 600,
      color: "var(--text-3)",
      display: "inline-flex",
      alignItems: "center",
      gap: 3,
      cursor: "pointer"
    }
  }, "\u0436\u0438\u0432\u043E\u0435 \u043E\u0442 \u043F\u0430\u0440\u0442\u043D\u0451\u0440\u043E\u0432 ", /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 12,
    strokeWidth: 2.4
  }))), /*#__PURE__*/React.createElement("div", {
    className: "bos-hscroll",
    style: {
      display: "flex",
      gap: 11,
      overflowX: "auto",
      padding: "3px 12px 18px 4px",
      margin: "0 -12px 0 0",
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
        background: isDarkP ? "linear-gradient(158deg, rgba(255,255,255,0.10), rgba(255,255,255,0) 58%), " + (typeof bosMixHex === "function" ? bosMixHex(p.accent, "#101014", 0.52) : p.accent) : "linear-gradient(158deg, rgba(255,255,255,0.5), rgba(255,255,255,0) 58%), " + p.accent,
        boxShadow: isDarkP ? "0 4px 12px rgba(0,0,0,0.4), inset 0 0 0 0.5px rgba(255,255,255,0.09)" : "0 4px 11px rgba(50,40,20,0.10), inset 0 0 0 0.5px rgba(255,255,255,0.55)",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 36,
        lineHeight: 1
      }
    }, p.emblem), p.used > 0 && /*#__PURE__*/React.createElement("span", {
      title: p.used + " человек посетили",
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 3.5,
        fontSize: 11,
        fontWeight: 600,
        color: isDarkP ? "rgba(255,255,255,0.5)" : "rgba(27,27,31,0.48)",
        paddingTop: 3,
        whiteSpace: "nowrap"
      }
    }, /*#__PURE__*/React.createElement(I.Users, {
      size: 11.5,
      strokeWidth: 2.2
    }), " \u043F\u043E\u0441\u0435\u0442\u0438\u043B\u0438 ", p.used)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15.5,
        fontWeight: 700,
        color: isDarkP ? "#fff" : "#1b1b1f",
        marginTop: 12,
        letterSpacing: "-0.2px",
        lineHeight: 1.2
      }
    }, p.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: isDarkP ? "rgba(255,255,255,0.66)" : "rgba(27,27,31,0.62)",
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
        background: isDarkP ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.82)",
        color: isDarkP ? "#fff" : "#0a0a0a",
        fontWeight: 800,
        fontSize: 11.5,
        borderRadius: 999,
        padding: "4px 10px"
      }
    }, "\uD83E\uDE99 ", p.cost), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 700,
        color: got ? isDarkP ? "#7dd89b" : "#1E8E4E" : isDarkP ? "#fff" : "#0a0a0a",
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

// СЕТКА ВСЕХ ПАРТНЁРОВ (2-в-ряд) — ОБЩАЯ для страницы «партнёры-все» и чипа «Партнёры»
// в Сообществе (David: «каждой категории место»). Тап → та же деталь партнёра.
function PartnersGridLive({
  app,
  navigate,
  from = "community"
}) {
  var isDark = app && app.themeOverride === "dark";
  var [redeemed, setRedeemed] = React.useState(bosLoadRedeemedPartners);
  React.useEffect(function () {
    var h = function () {
      setRedeemed(bosLoadRedeemedPartners());
    };
    window.addEventListener("bos:partnersChanged", h);
    return function () {
      window.removeEventListener("bos:partnersChanged", h);
    };
  }, []);
  var open = p => {
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
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 11
    }
  }, BOS_PARTNERS.map(p => {
    var got = !!redeemed[p.id];
    return /*#__PURE__*/React.createElement("div", {
      key: p.id,
      className: "tap",
      onClick: () => open(p),
      style: {
        borderRadius: 22,
        padding: 15,
        minHeight: 172,
        background: isDark ? "linear-gradient(158deg, rgba(255,255,255,0.10), rgba(255,255,255,0) 58%), " + (typeof bosMixHex === "function" ? bosMixHex(p.accent, "#101014", 0.52) : p.accent) : "linear-gradient(158deg, rgba(255,255,255,0.5), rgba(255,255,255,0) 58%), " + p.accent,
        boxShadow: isDark ? "0 4px 12px rgba(0,0,0,0.4), inset 0 0 0 0.5px rgba(255,255,255,0.09)" : "0 4px 11px rgba(50,40,20,0.10), inset 0 0 0 0.5px rgba(255,255,255,0.55)",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 34,
        lineHeight: 1
      }
    }, p.emblem), p.used > 0 && /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 3.5,
        fontSize: 10.5,
        fontWeight: 600,
        color: isDark ? "rgba(255,255,255,0.5)" : "rgba(27,27,31,0.48)",
        paddingTop: 3,
        whiteSpace: "nowrap"
      }
    }, /*#__PURE__*/React.createElement(I.Users, {
      size: 11,
      strokeWidth: 2.2
    }), " ", p.used)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15,
        fontWeight: 700,
        color: isDark ? "#fff" : "#1b1b1f",
        marginTop: 11,
        letterSpacing: "-0.2px",
        lineHeight: 1.2
      }
    }, p.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: isDark ? "rgba(255,255,255,0.66)" : "rgba(27,27,31,0.62)",
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
        minHeight: 10
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
        background: isDark ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.82)",
        color: isDark ? "#fff" : "#0a0a0a",
        fontWeight: 800,
        fontSize: 11.5,
        borderRadius: 999,
        padding: "4px 10px"
      }
    }, "\uD83E\uDE99 ", p.cost), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 700,
        color: got ? isDark ? "#7dd89b" : "#1E8E4E" : isDark ? "#fff" : "#0a0a0a",
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
  }));
}

// СТРАНИЦА «ВСЕ ПАРТНЁРЫ» — вертикальная сетка ВСЕХ живых впечатлений. David: «живое от партнёров»
// намекало на страницу со всеми партнёрами, а её не было (мёртвая ссылка). Тот же вид карточек, что
// в ленте PartnersShowcaseLive, но 2-в-ряд и целиком; тап → та же деталь. Открывается по «живое от партнёров →».
function PartnersAllLive() {
  var {
    navigate,
    params
  } = useNav();
  var app = typeof useApp === "function" ? useApp() : null;
  var back = params && params.from || "community";
  var isDark = app && app.themeOverride === "dark";
  var balance = typeof bosLiveSpendableXPLive === "function" ? bosLiveSpendableXPLive(app) : 0;
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      padding: "0 16px 24px"
    }
  }, /*#__PURE__*/React.createElement(PageHeader, {
    dark: isDark,
    title: "\u041F\u0430\u0440\u0442\u043D\u0451\u0440\u044B",
    onBack: () => navigate(back),
    right: /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 13,
        fontWeight: 700,
        color: "var(--text)"
      }
    }, "\uD83E\uDE99 ", balance)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-4)",
      padding: "0 2px 14px",
      lineHeight: 1.45
    }
  }, "\u0416\u0438\u0432\u044B\u0435 \u0432\u043F\u0435\u0447\u0430\u0442\u043B\u0435\u043D\u0438\u044F \u043E\u0442 \u043F\u0430\u0440\u0442\u043D\u0451\u0440\u043E\u0432 \u2014 \u0442\u0440\u0430\u0442\u044C \u0437\u0430\u0440\u0430\u0431\u043E\u0442\u0430\u043D\u043D\u044B\u0439 XP \u043D\u0430 \u0442\u043E, \u0447\u0442\u043E \u043F\u0440\u043E\u0438\u0441\u0445\u043E\u0434\u0438\u0442 \u0432\u0436\u0438\u0432\u0443\u044E."), /*#__PURE__*/React.createElement(PartnersGridLive, {
    app: app,
    navigate: navigate,
    from: "partners-all"
  }));
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
    if (app && typeof app.spendXP === "function" && app.spendXP(p.cost, "partner:" + p.id, {
      kind: "spend_partner",
      name: p.name,
      cost: p.cost
    })) {
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
      background: isDark ? "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0) 44%), " + (typeof bosMixHex === "function" ? bosMixHex(p.accent, "#101014", 0.48) : p.accent) : "linear-gradient(180deg, rgba(255,255,255,0.26), rgba(255,255,255,0) 44%), " + p.accent,
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
      background: isDark ? "rgba(0,0,0,0.32)" : "rgba(255,255,255,0.55)",
      display: "grid",
      placeItems: "center",
      cursor: "pointer",
      color: isDark ? "#fff" : "#1b1b1f"
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
      color: isDark ? "#fff" : "#161619",
      letterSpacing: "-0.6px",
      marginTop: 14,
      lineHeight: 1.05
    }
  }, p.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      color: isDark ? "rgba(255,255,255,0.7)" : "rgba(22,22,25,0.62)",
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
      background: isDark ? "rgba(255,255,255,0.13)" : "rgba(255,255,255,0.6)",
      borderRadius: 999,
      padding: "4px 11px",
      fontSize: 11.5,
      color: isDark ? "rgba(255,255,255,0.9)" : "#2a2a30",
      fontWeight: 600
    }
  }, t)), p.used > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      background: isDark ? "rgba(255,255,255,0.13)" : "rgba(255,255,255,0.6)",
      borderRadius: 999,
      padding: "4px 11px",
      fontSize: 11.5,
      color: isDark ? "rgba(255,255,255,0.72)" : "rgba(42,42,48,0.72)",
      fontWeight: 600,
      display: "inline-flex",
      alignItems: "center",
      gap: 5
    }
  }, /*#__PURE__*/React.createElement(I.Users, {
    size: 12,
    strokeWidth: 2.2
  }), " \u043F\u043E\u0441\u0435\u0442\u0438\u043B\u0438 ", p.used), p.limit && /*#__PURE__*/React.createElement("span", {
    style: {
      background: isDark ? "rgba(255,255,255,0.13)" : "rgba(255,255,255,0.6)",
      borderRadius: 999,
      padding: "4px 11px",
      fontSize: 11.5,
      color: isDark ? "rgba(255,255,255,0.9)" : "#2a2a30",
      fontWeight: 600,
      display: "inline-flex",
      alignItems: "center",
      gap: 4
    }
  }, "\uD83D\uDC65 ", p.limit), p.perk && /*#__PURE__*/React.createElement("span", {
    style: {
      background: isDark ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.92)",
      borderRadius: 999,
      padding: "4px 11px",
      fontSize: 11.5,
      color: isDark ? "#fff" : "#0a0a0a",
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
/* v526: витрина больше НЕ в ленте — пресеты едят плитки мозаики. */
function CircleStartersShowcaseLive({
  navigate
}) {
  var {
    open: _openSheet
  } = typeof useSheet === "function" ? useSheet() : {
    open: () => {}
  };
  var isDark = !!(typeof document !== "undefined" && document.querySelector(".bos-page.theme-dark"));
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
      _openSheet(/*#__PURE__*/React.createElement(GoalFormSheetLive, {
        mode: "create",
        circleOn: true,
        preset: s,
        navigate: navigate
      }));
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
      background: "linear-gradient(150deg, var(--disc-a, #eef1f6), var(--disc-b, #dadfe7))",
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
      ...bosChipGlass(isDark),
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
   создавать иллюзию... сама жизнь должна быть по-настоящему»). Это ПРИМЕРЫ КУРИРУЕМЫХ публичных
   кругов: настоящие лица-мемоджи + живой счёт «N отметились сегодня». Тап → ШТОРКА круга
   (LivingCircleSheetLive): орбита с привычками и людьми (как на карточках целей), описание,
   привычки круга и кнопка «Постучаться» — заявка «будет рассмотрена» (David: тап НЕ должен
   уводить в создание такой же командной цели). habits кормят орбиту и чипы. */
var LIVING_CIRCLES = [{
  id: "lc-run",
  i: "🏃",
  t: "Утренние пробежки",
  hook: "Выходят на рассвете — вместе проще не проспать",
  about: "Круг тех, кто начинает день с пробежки. Дистанция любая — важно выйти. Отметки складываются в общую серию, а по воскресеньям делятся маршрутами.",
  faces: ["m3", "m7", "m11", "m2", "m15"],
  total: 18,
  today: 9,
  since: "2025-10-26",
  together: {
    emoji: "🏃",
    text: "8 400 пробежек вместе"
  },
  habits: [{
    emoji: "🏃",
    name: "Пробежка"
  }, {
    emoji: "🌅",
    name: "Ранний подъём"
  }, {
    emoji: "🧦",
    name: "Разминка"
  }],
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
  id: "lc-calm",
  i: "🧘",
  t: "Тишина по утрам",
  hook: "5 минут медитации — никто не сходит с дистанции",
  about: "Спокойный круг: пять минут тишины до телефона и новостей. Здесь не соревнуются — просто держат ритм вместе и делятся, что помогает не съезжать.",
  faces: ["m8", "m4", "m12", "m6", "m17", "m10"],
  total: 24,
  today: 13,
  since: "2026-01-17",
  together: {
    emoji: "🧘",
    text: "3 100 практик вместе"
  },
  habits: [{
    emoji: "🧘",
    name: "Медитация"
  }, {
    emoji: "📓",
    name: "Дневник"
  }],
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
  id: "lc-book",
  i: "📚",
  t: "Книжный клуб",
  hook: "Глава в день и живое обсуждение в чате круга",
  about: "Читают по главе в день — за месяц выходит целая книга. Раз в неделю голосуют за следующую и обсуждают прочитанное. Отставать не страшно: догоняют вместе.",
  faces: ["m5", "m9", "m1", "m14"],
  total: 11,
  today: 4,
  since: "2026-03-30",
  together: {
    emoji: "📚",
    text: "7 книг прочитано вместе"
  },
  habits: [{
    emoji: "📖",
    name: "Глава в день"
  }, {
    emoji: "✍️",
    name: "Заметка о прочитанном"
  }],
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
  id: "lc-water",
  i: "💧",
  t: "Восемь стаканов",
  hook: "Пьют воду и держат друг друга в тонусе",
  about: "Самый простой круг: восемь стаканов воды в день. Идеален как первый общий ритуал — лёгкий, но каждый день видно, кто в строю.",
  faces: ["m13", "m16", "m2", "m7"],
  total: 9,
  today: 6,
  since: "2026-05-24",
  together: {
    emoji: "💧",
    text: "12 000 стаканов вместе"
  },
  habits: [{
    emoji: "💧",
    name: "Стакан воды"
  }],
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

// «Постучаться» — заявки живут локально (bos:knockedCircles), чтобы кнопка честно помнила
// «Заявка отправлена» между входами. Публичные круги курируются — реальный approve появится
// вместе с настоящими публичными кругами; пока это витрина-пример.
function bosLoadKnockedCircles() {
  try {
    return JSON.parse(localStorage.getItem("bos:knockedCircles") || "{}") || {};
  } catch (e) {
    return {};
  }
}
function bosMarkKnockedCircle(id) {
  var n = Object.assign({}, bosLoadKnockedCircles(), {
    [id]: true
  });
  try {
    localStorage.setItem("bos:knockedCircles", JSON.stringify(n));
  } catch (e) {}
  try {
    window.dispatchEvent(new Event("bos:circlesKnocked"));
  } catch (e) {}
  return n;
}

/* ── ЕДИНЫЙ ЯЗЫК КАРТОЧЕК «Найти» (v526, по одобренному макету) ────────────────
   Одна плитка круга для ВСЕХ видов (живой / челлендж / пресет): стекло-плитка эмодзи →
   название → живая мета. Вместо трёх разных горизонтальных лент — вертикальная мозаика
   2 колонки, как на макете. Партнёры сознательно ДРУГИЕ (цветная «карточка-впечатление»). */
function CircleTileLive({
  emoji,
  title,
  meta,
  joined,
  onTap
}) {
  var isDark = !!(typeof document !== "undefined" && document.querySelector(".bos-page.theme-dark"));
  return /*#__PURE__*/React.createElement("button", {
    onClick: onTap,
    className: "tap",
    style: {
      background: "var(--card)",
      border: 0,
      borderRadius: 18,
      padding: 13,
      textAlign: "left",
      color: "var(--text)",
      boxShadow: "var(--card-shadow)",
      display: "flex",
      flexDirection: "column",
      gap: 9,
      minWidth: 0,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 13,
      background: BOS_TILE_SHEEN + ", linear-gradient(150deg, var(--disc-a, #eef1f6), var(--disc-b, #dadfe8))",
      boxShadow: typeof bosTileGlass === "function" ? bosTileGlass(isDark) : "none",
      display: "grid",
      placeItems: "center",
      fontSize: 20
    }
  }, typeof bosIcon === "function" ? bosIcon(emoji, 20, null) : emoji), /*#__PURE__*/React.createElement("span", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      fontSize: 14,
      fontWeight: 600,
      letterSpacing: "-0.2px",
      lineHeight: 1.25
    }
  }, title), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      fontSize: 11.5,
      color: joined ? "#34C759" : "var(--text-4)",
      marginTop: 3,
      lineHeight: 1.35
    }
  }, joined ? "Ты в деле ✓" : meta)));
}
/* Мозаика плиток кругов: 2 колонки, опциональный кикер с «Все ›». */
function CirclesMosaicLive({
  kicker,
  onAll,
  children
}) {
  return /*#__PURE__*/React.createElement("div", null, kicker && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      padding: "4px 4px 9px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: "var(--text-4)"
    }
  }, kicker), onAll && /*#__PURE__*/React.createElement("button", {
    onClick: onAll,
    className: "tap",
    "data-haptic": "selection",
    style: {
      border: 0,
      background: "transparent",
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      gap: 1,
      fontSize: 12.5,
      fontWeight: 600,
      color: "var(--text-3)",
      padding: 0
    }
  }, "\u0412\u0441\u0435 ", /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 13,
    color: "var(--text-4)"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10
    }
  }, children));
}
/* Баннер «Люди» для обзора «Все» — ЗАМЕТНЫЙ (David: «суть нравится, но тоненький и в
   незаметном месте»): глубокая тёмная карточка-космос с заголовком, размытыми строками-
   ОБЕЩАНИЯМИ (описывают будущее «знакомство по делам», НЕ выдуманных людей) и пилюлей-
   замком. Тап → чип «Люди». */
function NetworkPeekLive({
  unlocked,
  onOpen
}) {
  var rows = [["🤝", "Похожая структура привычек"], ["🔥", "Такой же ритм — спорт по утрам"], ["🧩", "Знакомство по делам, не по ленте"]];
  return /*#__PURE__*/React.createElement("button", {
    onClick: onOpen,
    className: "tap",
    style: {
      position: "relative",
      width: "100%",
      border: 0,
      borderRadius: 22,
      padding: "17px 16px 15px",
      textAlign: "left",
      overflow: "hidden",
      cursor: "pointer",
      background: "radial-gradient(130% 120% at 82% -10%, rgba(120,140,255,0.28), transparent 52%), radial-gradient(90% 90% at 12% 110%, rgba(55,244,250,0.12), transparent 55%), #0a0a0a",
      boxShadow: "0 10px 26px rgba(10,10,20,0.28), inset 0 0 0 0.5px rgba(255,255,255,0.10)"
    }
  }, [[14, 22, 2], [62, 12, 1.5], [84, 30, 2], [38, 16, 1.2], [74, 66, 1.6]].map(([x, y, r], i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    "aria-hidden": true,
    style: {
      position: "absolute",
      left: x + "%",
      top: y + "%",
      width: r * 2,
      height: r * 2,
      borderRadius: "50%",
      background: "rgba(255,255,255,0.5)",
      pointerEvents: "none"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 800,
      letterSpacing: 1.4,
      textTransform: "uppercase",
      color: "rgba(255,255,255,0.55)"
    }
  }, "\uD83E\uDDED \u041D\u0435\u0442\u0432\u043E\u0440\u043A \xB7 \u043A\u043E\u043D\u0442\u0430\u043A\u0442\u044B"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 19,
      fontWeight: 800,
      letterSpacing: "-0.4px",
      color: "#fff",
      marginTop: 4,
      lineHeight: 1.2
    }
  }, "\u041B\u044E\u0434\u0438, \u0441 \u043A\u043E\u0442\u043E\u0440\u044B\u043C\u0438 \u043F\u043E \u043F\u0443\u0442\u0438"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "rgba(255,255,255,0.62)",
      marginTop: 4,
      lineHeight: 1.4,
      maxWidth: 250
    }
  }, "\u0417\u043D\u0430\u043A\u043E\u043C\u0441\u0442\u0432\u0430 \u043F\u043E \u0440\u0438\u0442\u043C\u0443 \u0438 \u0434\u0435\u043B\u0430\u043C. \u041E\u0442\u043A\u0440\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u0443\u0440\u043E\u0432\u043D\u0435\u043C, \u0430 \u0447\u0430\u0441\u0442\u044C \u043A\u0440\u0443\u0433\u043E\u0432 \u2014 \u0442\u0440\u0435\u043D\u0438\u043D\u0433\u0430\u043C\u0438."), /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      filter: "blur(3px)",
      opacity: 0.55,
      pointerEvents: "none",
      marginTop: 12,
      display: "flex",
      flexDirection: "column",
      gap: 7
    }
  }, rows.map(([e, t], i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 26,
      height: 26,
      borderRadius: "50%",
      background: "rgba(255,255,255,0.14)",
      display: "grid",
      placeItems: "center",
      fontSize: 13,
      flexShrink: 0
    }
  }, e), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: "rgba(255,255,255,0.75)"
    }
  }, t)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 13
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontSize: 12.5,
      fontWeight: 700,
      padding: "8px 14px",
      borderRadius: 999,
      color: "#fff",
      background: "rgba(255,255,255,0.12)",
      boxShadow: "inset 0 0 0 0.5px rgba(255,255,255,0.22)"
    }
  }, "\uD83D\uDD12 ", unlocked ? "Скоро здесь" : "Откроется с 10 уровня"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 2,
      fontSize: 12.5,
      fontWeight: 600,
      color: "rgba(255,255,255,0.75)"
    }
  }, "\u0417\u0430\u0433\u043B\u044F\u043D\u0443\u0442\u044C ", /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 14,
    color: "rgba(255,255,255,0.6)"
  })))));
}

/* Возраст круга «живёт N дней» — ЖИВАЯ метрика (David: «прикольная метрика типа круг живёт
   252 дня; большие общие вещи, которые кто-то ведёт»): растёт сама от даты рождения круга,
   с правильным русским склонением. */
function bosCircleDays(since) {
  if (!since) return null;
  var ms = Date.parse(since);
  if (isNaN(ms)) return null;
  return Math.max(1, Math.floor((Date.now() - ms) / 86400000));
}
function bosRuDays(n) {
  var a = n % 10,
    b = n % 100;
  if (a === 1 && b !== 11) return "день";
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return "дня";
  return "дней";
}

/* КАРТОЧКА живого круга (v541, David: «карточка нашего размера + чипы + прикольные метрики;
   одну с чипами, другую с орбитой — сравним вживую»): СТАНДАРТНЫЙ размер (как карточка тренинга),
   вся живая инфа — ЧИПАМИ вместо строк вразброс. Метрики: зелёный «сегодня N в деле» (пульс),
   золотой «живёт N дней» (история), стеклянный «8 400 пробежек вместе» (большое общее).
   variant="chips" — лица сверху + чипы, без орбиты. variant="orbit" — то же слева + настоящая
   орбита GoalOrbitMini справа. Тап → та же шторка-превью с «Постучаться». */
function LivingCircleCardLive({
  circle: s,
  onTap,
  w = null,
  variant = "chips"
}) {
  var isDark = !!(typeof document !== "undefined" && document.querySelector(".bos-page.theme-dark"));
  var people = (s.faces || []).map(function (a) {
    return {
      avatar: a,
      name: ""
    };
  });
  var days = bosCircleDays(s.since);
  var glass = typeof bosChipGlass === "function" ? bosChipGlass(isDark) : {
    background: "var(--card-2)"
  };
  var chipBase = {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    padding: "5px 10px",
    fontSize: 11.5,
    fontWeight: 600,
    whiteSpace: "nowrap"
  };
  // Живой ЗЕЛЁНЫЙ чип «сегодня N в деле» — пульс круга (вместо сухой строки «18 человек · …»).
  var liveChip = /*#__PURE__*/React.createElement("span", {
    style: {
      ...chipBase,
      background: isDark ? "rgba(52,199,89,0.15)" : "#E7F7EC",
      color: isDark ? "#7dd89b" : "#1E8E4E",
      boxShadow: isDark ? "none" : "inset 0 0 0 0.5px rgba(30,142,78,0.14)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: "50%",
      background: "#34C759",
      boxShadow: "0 0 0 3px rgba(52,199,89,0.16)"
    }
  }), "\u0441\u0435\u0433\u043E\u0434\u043D\u044F ", s.today, " \u0432 \u0434\u0435\u043B\u0435");
  // ЗОЛОТОЙ чип «живёт N дней» — история круга (David: «круг живёт 252 дня»).
  var ageChip = days ? /*#__PURE__*/React.createElement("span", {
    style: {
      ...chipBase,
      background: isDark ? "linear-gradient(150deg, rgba(255,214,102,0.16), rgba(239,159,20,0.14))" : "linear-gradient(150deg,#FFF7E6,#FFEFC9)",
      color: isDark ? "#f0c86a" : "#8a6a00",
      boxShadow: isDark ? "none" : "inset 0 0 0 0.5px rgba(214,168,40,0.30)"
    }
  }, "\uD83D\uDCC5 \u0436\u0438\u0432\u0451\u0442 ", days, " ", bosRuDays(days)) : null;
  // СТЕКЛЯННЫЙ чип «большое общее» — что круг наработал вместе (David: «большие общие вещи»).
  var togetherChip = s.together ? /*#__PURE__*/React.createElement("span", {
    style: {
      ...chipBase,
      ...glass,
      color: "var(--text-2)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12
    }
  }, typeof bosIcon === "function" ? bosIcon(s.together.emoji, 12, null) : s.together.emoji), s.together.text) : null;
  var habitChips = /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 5,
      marginTop: 8,
      flexWrap: "wrap"
    }
  }, (s.habits || []).slice(0, variant === "orbit" ? 2 : 3).map(function (h, i) {
    return /*#__PURE__*/React.createElement("span", {
      key: i,
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        ...glass,
        padding: "4px 9px 4px 6px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        color: "var(--text-2)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12
      }
    }, typeof bosIcon === "function" ? bosIcon(h.emoji, 12, null) : h.emoji), h.name);
  }));
  var cardBase = {
    width: w || "100%",
    ...(w ? {
      flex: "0 0 auto",
      scrollSnapAlign: "start"
    } : {}),
    background: "var(--card)",
    border: 0,
    borderRadius: 22,
    padding: 16,
    boxShadow: "var(--card-shadow)",
    textAlign: "left",
    color: "var(--text)",
    cursor: "pointer",
    overflow: "hidden"
  };
  if (variant === "orbit") {
    // Тот же СТАНДАРТНЫЙ размер, но справа — настоящая орбита (привычки + лица кружат вокруг).
    return /*#__PURE__*/React.createElement("button", {
      onClick: onTap,
      className: "tap",
      style: {
        ...cardBase,
        display: "flex",
        alignItems: "center",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 16.5,
        fontWeight: 700,
        letterSpacing: "-0.3px",
        lineHeight: 1.2
      }
    }, s.t), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "var(--text-3)",
        marginTop: 6,
        lineHeight: 1.4,
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden"
      }
    }, s.hook), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 6,
        marginTop: 9,
        flexWrap: "wrap"
      }
    }, liveChip, ageChip)), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 108,
        height: 108,
        flexShrink: 0,
        display: "grid",
        placeItems: "center"
      }
    }, typeof GoalOrbitMini === "function" ? /*#__PURE__*/React.createElement(GoalOrbitMini, {
      centerEmoji: s.i,
      centerColor: null,
      habits: s.habits || [],
      people: people,
      size: 108,
      dark: isDark
    }) : /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 36
      }
    }, s.i)));
  }
  // variant "chips" — лица сверху, вся живая инфа ЧИПАМИ, без орбиты.
  return /*#__PURE__*/React.createElement("button", {
    onClick: onTap,
    className: "tap",
    style: {
      ...cardBase,
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 11
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 44,
      height: 44,
      borderRadius: 14,
      background: BOS_TILE_SHEEN + ", linear-gradient(150deg, var(--disc-a, #eef1f6), var(--disc-b, #dadfe8))",
      boxShadow: typeof bosTileGlass === "function" ? bosTileGlass(isDark) : "none",
      display: "grid",
      placeItems: "center",
      fontSize: 22,
      flexShrink: 0
    }
  }, typeof bosIcon === "function" ? bosIcon(s.i, 22, null) : s.i), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      fontSize: 16.5,
      fontWeight: 700,
      letterSpacing: "-0.3px",
      lineHeight: 1.15
    }
  }, s.t), typeof PeopleStackLive === "function" && /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(PeopleStackLive, {
    people: people,
    size: 26,
    max: 3
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-3)",
      marginTop: 10,
      lineHeight: 1.4,
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical",
      overflow: "hidden"
    }
  }, s.hook), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginTop: 11,
      flexWrap: "wrap"
    }
  }, liveChip, ageChip, togetherChip), habitChips);
}

/* ШТОРКА старта челленджа (v527, David: «шторка вступления угрожающая, как удалить — не в
   тему»): ТЁПЛОЕ приглашение вместо confirm-модалки — эмблема в стекле, что получишь
   (круг + ежедневная практика + приз), «Начать» как праздник, «Не сейчас» тихой строкой. */
function ChallengeStartSheetLive({
  seed: s,
  onStart
}) {
  var sheet = typeof useSheet === "function" ? useSheet() : null;
  var isDark = !!(typeof document !== "undefined" && document.querySelector(".bos-page.theme-dark"));
  var close = () => {
    try {
      if (sheet && sheet.close) sheet.close();
    } catch (e) {}
  };
  var rows = [["🌱", "Круг появится в «Целях» — зови своих"], [s.practice && s.practice.emoji || "🔥", "Практика «" + (s.practice && s.practice.name || "каждый день") + "» — в «Привычках»"], ["⚡", "+" + (s.reward || 0) + " XP за финиш — пропуск не сжигает бонус"]];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "2px 22px 26px",
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
      width: 76,
      height: 76,
      borderRadius: 21,
      background: BOS_TILE_SHEEN + ", linear-gradient(150deg, var(--disc-a, #eef1f6), var(--disc-b, #dadfe8))",
      boxShadow: typeof bosTileGlass === "function" ? bosTileGlass(isDark) : "none",
      display: "grid",
      placeItems: "center",
      fontSize: 37
    }
  }, typeof bosIcon === "function" ? bosIcon(s.emblem, 37, null) : s.emblem)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1.4,
      fontWeight: 700,
      marginTop: 14
    }
  }, "\u0427\u0435\u043B\u043B\u0435\u043D\u0434\u0436 \xB7 ", s.goalText), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 23,
      fontWeight: 800,
      letterSpacing: "-0.5px",
      marginTop: 3
    }
  }, s.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: "var(--text-3)",
      marginTop: 8,
      lineHeight: 1.5,
      padding: "0 6px",
      textWrap: "balance"
    }
  }, s.hook), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 9,
      marginTop: 16,
      textAlign: "left"
    }
  }, rows.map(function (r, i) {
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 11,
        background: isDark ? "rgba(255,255,255,0.06)" : "#f4f4f6",
        borderRadius: 15,
        padding: "11px 13px"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 19,
        flexShrink: 0
      }
    }, r[0]), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13.5,
        fontWeight: 600,
        color: "var(--text-2)",
        lineHeight: 1.35
      }
    }, r[1]));
  })), /*#__PURE__*/React.createElement("button", {
    onClick: function () {
      close();
      onStart();
    },
    className: "bos-btn",
    style: {
      marginTop: 20
    }
  }, "\u041D\u0430\u0447\u0430\u0442\u044C"), /*#__PURE__*/React.createElement("button", {
    onClick: close,
    className: "tap",
    style: {
      display: "block",
      margin: "12px auto 0",
      border: 0,
      background: "transparent",
      fontSize: 13.5,
      fontWeight: 600,
      color: "var(--text-4)",
      cursor: "pointer"
    }
  }, "\u041D\u0435 \u0441\u0435\u0439\u0447\u0430\u0441"));
}

/* ШТОРКА живого круга — «заглянуть внутрь»: орбита (привычки круга + лица на кольцах — тот же
   GoalOrbitMini, что на карточках целей), о чём круг, чипы привычек и «Постучаться в круг».
   Тап по «Постучаться» → «Заявка отправлена — её рассмотрят». Внизу тихая ссылка «Собрать
   похожий круг» (прежнее действие карточки) — для тех, кто хочет свой. */
function LivingCircleSheetLive({
  circle: s,
  navigate
}) {
  var {
    open: openSheet,
    close
  } = useSheet();
  var app = typeof useApp === "function" ? useApp() : null;
  var isDark = app && app.themeOverride === "dark";
  var [knocked, setKnocked] = React.useState(function () {
    return !!bosLoadKnockedCircles()[s.id];
  });
  var knock = () => {
    if (knocked) return;
    bosMarkKnockedCircle(s.id);
    setKnocked(true);
    if (window.tgHaptic) {
      try {
        window.tgHaptic("success");
      } catch (e) {}
    }
  };
  var people = (s.faces || []).map(function (a) {
    return {
      avatar: a,
      name: ""
    };
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "bos-sheet-scroll",
    style: {
      paddingTop: 2,
      paddingLeft: 20,
      paddingRight: 20,
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 190,
      height: 190,
      margin: "2px auto 0",
      display: "grid",
      placeItems: "center"
    }
  }, typeof GoalOrbitMini === "function" ? /*#__PURE__*/React.createElement(GoalOrbitMini, {
    centerEmoji: s.i,
    centerColor: null,
    habits: s.habits || [],
    people: people,
    size: 190,
    dark: isDark
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 56
    }
  }, s.i)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 21,
      fontWeight: 700,
      letterSpacing: "-0.4px",
      color: "var(--text)",
      marginTop: 10
    }
  }, s.t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-4)",
      marginTop: 5,
      fontWeight: 500
    }
  }, s.total, " \u0432 \u043A\u0440\u0443\u0433\u0435 \xB7 ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: "var(--text-2)",
      fontWeight: 700
    }
  }, s.today), " \u043E\u0442\u043C\u0435\u0442\u0438\u043B\u0438\u0441\u044C \u0441\u0435\u0433\u043E\u0434\u043D\u044F"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: "var(--text-3)",
      lineHeight: 1.5,
      marginTop: 12,
      textAlign: "left"
    }
  }, s.about || s.hook), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 7,
      marginTop: 14,
      flexWrap: "wrap",
      justifyContent: "flex-start"
    }
  }, (s.habits || []).map(function (h, i) {
    return /*#__PURE__*/React.createElement("span", {
      key: i,
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        ...bosChipGlass(isDark),
        padding: "6px 12px 6px 8px",
        borderRadius: 999,
        fontSize: 12.5,
        fontWeight: 600,
        color: "var(--text-2)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14
      }
    }, bosIcon(h.emoji, 14, null)), h.name);
  })), knocked ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      background: "rgba(52,199,89,0.14)",
      color: "#1E8E4E",
      borderRadius: 16,
      padding: "13px",
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
  }), " \u0417\u0430\u044F\u0432\u043A\u0430 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0430"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 500,
      color: "var(--text-3)"
    }
  }, "\u041A\u0440\u0443\u0433 \u0435\u0451 \u0440\u0430\u0441\u0441\u043C\u043E\u0442\u0440\u0438\u0442 \u2014 \u043E\u0442\u0432\u0435\u0442 \u043F\u0440\u0438\u0434\u0451\u0442 \u0441\u044E\u0434\u0430.")) : /*#__PURE__*/React.createElement("button", {
    onClick: knock,
    className: "tap",
    style: {
      width: "100%",
      marginTop: 18,
      background: "var(--cta, #0a0a0a)",
      color: "var(--cta-ink, #fff)",
      border: 0,
      borderRadius: 999,
      padding: 15,
      fontSize: 15.5,
      fontWeight: 600,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(I.Users, {
    size: 17
  }), " \u041F\u043E\u0441\u0442\u0443\u0447\u0430\u0442\u044C\u0441\u044F \u0432 \u043A\u0440\u0443\u0433"), /*#__PURE__*/React.createElement("button", {
    onClick: function () {
      openSheet(/*#__PURE__*/React.createElement(GoalFormSheetLive, {
        mode: "create",
        circleOn: true,
        preset: s.preset,
        navigate: navigate
      }));
    },
    className: "tap",
    style: {
      width: "100%",
      background: "transparent",
      border: 0,
      color: "var(--text-3)",
      padding: "12px",
      marginTop: 6,
      fontSize: 13.5,
      fontWeight: 600
    }
  }, "\u0421\u043E\u0431\u0440\u0430\u0442\u044C \u043F\u043E\u0445\u043E\u0436\u0438\u0439 \u043A\u0440\u0443\u0433 \u2192"));
}

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
  var {
    open: _openSheet
  } = typeof useSheet === "function" ? useSheet() : {
    open: () => {}
  };
  var [knockedMap, setKnockedMap] = React.useState(bosLoadKnockedCircles);
  React.useEffect(function () {
    // «Постучался» в шторке → карточка под ней сразу показывает «Заявка отправлена»
    // (то же событие-зеркало, что у партнёров bos:partnersChanged).
    var h = function () {
      setKnockedMap(bosLoadKnockedCircles());
    };
    window.addEventListener("bos:circlesKnocked", h);
    return function () {
      window.removeEventListener("bos:circlesKnocked", h);
    };
  }, []);
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
        if (window.tgHaptic) {
          try {
            window.tgHaptic("selection");
          } catch (e) {}
        }
        _openSheet(/*#__PURE__*/React.createElement(LivingCircleSheetLive, {
          circle: s,
          navigate: navigate
        }));
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
        background: "linear-gradient(150deg, var(--disc-a, #eef1f6), var(--disc-b, #dadfe7))",
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
        color: knockedMap[s.id] ? "#1E8E4E" : "var(--text-2)",
        display: "inline-flex",
        alignItems: "center",
        gap: 3
      }
    }, knockedMap[s.id] ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(I.Check, {
      size: 13,
      strokeWidth: 3
    }), " \u0417\u0430\u044F\u0432\u043A\u0430 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0430") : /*#__PURE__*/React.createElement(React.Fragment, null, "\u0417\u0430\u0433\u043B\u044F\u043D\u0443\u0442\u044C ", /*#__PURE__*/React.createElement(I.ChevronRight, {
      size: 14
    })))));
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
// СТАТИЧНЫЙ диск дальней системы (иконка): аватар + одно золотое кольцо уровня + бейдж. БЕЗ часов и
// SVG-орбиты → не крутится, не ре-рендерится на 30fps (главная оптимизация: дальних систем много,
// им не нужна анимация). Вид совпадает со свёрнутым OrbitField → переход бесшовный.
function UniDiscLive({
  avatar,
  level,
  lvlPct,
  size,
  dark
}) {
  var av = "" + (avatar || "");
  var isMemoji = /^m\d+$/.test(av),
    isEmoji = av.indexOf("emoji:") === 0;
  // Блик кружка Вселенной ТЕМА-ЗАВИСИМ (David: «в тёмной кружочки не адаптировались»): в тёмной
  // яркий белый градиент (0.55) выбеливал графитовый диск → приглушаем почти в ноль.
  var SHEEN = dark ? "linear-gradient(165deg, rgba(255,255,255,0.14), rgba(255,255,255,0.04) 46%, rgba(255,255,255,0) 72%)" : "linear-gradient(165deg, rgba(255,255,255,0.55), rgba(255,255,255,0.12) 46%, rgba(255,255,255,0) 72%)";
  var bg = SHEEN + ", " + (isMemoji ? "url(./assets/people/" + av + ".png) center/cover no-repeat, " : !isEmoji ? "url(./assets/sphere.png) center/cover no-repeat, " : "") + "linear-gradient(150deg, var(--disc-a, #eef1f6), var(--disc-b, #dadfe7))";
  // Верхняя белая кромка диска тоже гаснет в тёмной (была 0.9 — резкий блик).
  var discSh = dark ? "inset 0 1px 0.5px rgba(255,255,255,0.10), inset 0 0 0 0.6px rgba(255,255,255,0.05), 0 4px 12px rgba(0,0,0,0.30)" : "inset 0 1.5px 0.5px rgba(255,255,255,0.9), inset 0 0 0 0.6px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.14)";
  var badge = size * 0.34;
  // Кольцо-прогресс уровня УБРАНО (David: «перегружает») — остаётся только цифра уровня.
  // Inset 0.12 сохранён → размер лица и стык с раскрытой орбитой не изменились.
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: size,
      height: size
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: size * 0.12,
      borderRadius: "50%",
      background: bg,
      boxShadow: discSh,
      display: "grid",
      placeItems: "center",
      fontSize: size * 0.42,
      lineHeight: 1
    }
  }, isEmoji ? av.slice(6) : null), level > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      right: size * 0.05,
      bottom: size * 0.05,
      minWidth: badge,
      height: badge,
      padding: "0 " + size * 0.03 + "px",
      boxSizing: "border-box",
      borderRadius: 999,
      background: "linear-gradient(180deg,#FFE777,#F4B72A)",
      color: "#4a3800",
      fontSize: size * 0.2,
      fontWeight: 800,
      lineHeight: 1,
      display: "grid",
      placeItems: "center",
      border: "1.5px solid var(--card)",
      fontFamily: "-apple-system, system-ui, sans-serif"
    }
  }, level));
}
// Мемоизированные обёртки для Вселенной. Смысл: при ПАНЕ позиция+размер системы идут через transform
// её ОБЁРТКИ (дёшево, GPU), а тяжёлая графика (OrbitField / диск) НЕ перерисовывается, пока не изменились
// её реальные пропы (open квантуется до ступеней, spinT тикает медленно ~7fps). Это и убирает «лаг линзы»
// при перетаскивании — раньше все орбиты перерисовывали всю графику на КАЖДЫЙ кадр пана.
function _uniOrbitEq(a, b) {
  return a.avatar === b.avatar && a.habits === b.habits && a.people === b.people && a.levelPct === b.levelPct && a.moodC === b.moodC && a.dark === b.dark && a.levelBadge === b.levelBadge && a.open === b.open && a.spinT === b.spinT && a.minimal === b.minimal && a.hideLevelArc === b.hideLevelArc && a.hideLevelRing === b.hideLevelRing;
}
var UniOrbitMemo = typeof OrbitField === "function" && React.memo ? React.memo(OrbitField, _uniOrbitEq) : OrbitField;
var UniDiscMemo = React.memo ? React.memo(UniDiscLive) : UniDiscLive;

// ОБЩИЙ тикер вращения Вселенной (~10fps, пауза в фоне): раньше spin был state РОДИТЕЛЯ и каждый
// тик пересобирал ВСЁ поле; теперь на тик перерисовываются ТОЛЬКО раскрытые орбиты-подписчики.
var _uniSpinSubs = new Set();
var _uniSpinTimer = null;
function _uniSpinStart() {
  if (_uniSpinTimer != null) return;
  _uniSpinTimer = setInterval(function () {
    if (typeof document !== "undefined" && document.hidden) return;
    var v = performance.now() / 1000 * 0.7; // та же спокойная скорость, что была
    _uniSpinSubs.forEach(function (fn) {
      try {
        fn(v);
      } catch (e) {}
    });
  }, 100);
}
function _uniSpinStop() {
  if (_uniSpinTimer != null) {
    clearInterval(_uniSpinTimer);
    _uniSpinTimer = null;
  }
}
function useUniSpin(active) {
  var st = React.useState(0),
    v = st[0],
    setV = st[1];
  React.useEffect(function () {
    if (!active) return;
    _uniSpinSubs.add(setV);
    _uniSpinStart();
    return function () {
      _uniSpinSubs.delete(setV);
      if (!_uniSpinSubs.size) _uniSpinStop();
    };
  }, [active]);
  return active ? v : 0;
}
// Одна РАСКРЫТАЯ система: подписка на тикер только пока spinOn (глубоко под линзой). open=1 —
// геометрия печётся раз, живое раскрытие едет CSS-переменными (--uK/--uO/--uA) с обёртки.
function UniSpinOrbit({
  sp,
  moodC,
  isDark,
  spinOn
}) {
  var spin = useUniSpin(spinOn);
  if (!UniOrbitMemo) return null;
  return /*#__PURE__*/React.createElement(UniOrbitMemo, {
    avatar: sp.s && sp.s.avatar,
    name: sp.s && sp.s.name || "",
    habits: sp.habits,
    people: sp.people,
    levelPct: sp.lvlPct,
    moodC: moodC,
    dark: isDark,
    hideLevelArc: true,
    hideLevelRing: true,
    editable: false,
    levelBadge: sp.level,
    open: 1,
    minimal: true,
    spinT: spin
  });
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
  // Тёмная Вселенная = почти ЧЁРНЫЙ космос (David), с еле заметной глубиной к центру.
  var bg = isDark ? "radial-gradient(125% 95% at 50% 42%, #14161d 0%, #0a0b10 52%, #030304 100%)" : "radial-gradient(125% 95% at 50% 42%, #fbfcff 0%, #eef1f8 52%, #e4e9f2 100%)";
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
        r: 0,
        k: 0
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
        r: r,
        k: k
      };
    }
    var nodes = others.map(function (sp, j) {
      var h = hexAt(j + 1); // axial → плоскость, спейсинг ровно 1
      return {
        sp: sp,
        fx: h.q + h.r * 0.5,
        fy: h.r * 0.8660254,
        ring: h.k
      };
    });
    return {
      nodes: nodes
    };
  }, [friends]);

  // ЛИНЗА (fisheye, как главное меню Apple Watch): поле тесно упаковано, а в центре экрана — «лупа».
  // ─── ДВИЖОК БЕЗ REACT НА КАЖДЫЙ КАДР ───────────────────────────────────────────────
  // Урок «лага линзы»: раньше пан/зум шли через setState → React пересобирал ВСЕ ~240 систем
  // каждый кадр, а раскрытие колец квантовалось ступенями (лица шли «лесенкой»). Теперь камера
  // живёт в ref, и ОДИН rAF-цикл пишет transform + CSS-переменные (--uK/--uO/--uA — раскрытие
  // колец и размер лица) НАПРЯМУЮ в DOM — плавно, 60fps, без единого ре-рендера. React
  // пересобирает поле только по camQ (~6 раз/с) ради СТРУКТУРЫ: диск↔орбита (с гистерезисом)
  // и вкл/выкл вращения. В покое не происходит ВООБЩЕ ничего (записи скипаются по сигнатуре).
  var camRef = React.useRef({
    x: 0,
    y: 0,
    z: 1
  });
  var [camQ, setCamQ] = React.useState({
    x: 0,
    y: 0,
    z: 1
  }); // квантованная камера — только для структуры
  var [introDone, setIntroDone] = React.useState(false); // после каскада появления pop-анимации гасим
  var introRef = React.useRef(0);
  var nodeEls = React.useRef({}); // key → DOM-обёртка системы (loop пишет transform/vars сюда)
  var nodeSig = React.useRef({}); // key → последняя записанная сигнатура (скип одинаковых записей)
  var lodRef = React.useRef({}); // key → "disc"|"orbit" (гистерезис переключения)
  var nodesRef = React.useRef([]);
  function _cZ(z) {
    return z < 0.55 ? 0.55 : z > 3 ? 3 : z;
  }
  var PACK = 0.9,
    MC = 1.85,
    ME = 0.72; // упаковка сот и магнификация линзы: центр/край
  // Геометрия одной системы из камеры. ВАЖНО: q = rf·(178·PACK/235) — НЕ зависит от зума/intro
  // (они сокращаются) → раскрытость определяется только расстоянием до линзы. Этим пользуется
  // и React-структура (LOD по camQ), и rAF-цикл (плавные значения по camRef).
  function calcNode(fx, fy, cam, introK) {
    var SIZB = 178 * cam.z * introK,
      SPB = SIZB * PACK,
      SIG = 235 * cam.z * introK;
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
  // Стили одной системы (единая математика для rAF-цикла И для inline-рендера, чтобы редкий
  // React-рендер писал РОВНО те же значения и ничего не дёргалось).
  // Диск масштабируется НЕПРЕРЫВНО от openV — лицо диска и лицо орбиты совпадают при ЛЮБОМ
  // моменте переключения LOD (раньше стык был точечно подогнан под фикс-порог).
  function nodeVisual(fx, fy, cam, introK) {
    var f = calcNode(fx, fy, cam, introK);
    var openV = openMag(f.mag);
    var off = f.sx < -f.size || f.sx > W + f.size || f.sy < -f.size || f.sy > H + f.size;
    var uA = _bosLp(2.6, 1.05, openV);
    var dscale = f.size * 0.2 * uA / 110; // 0.2 = 60px аватар / 300px бокс орбиты
    var oscale = f.size / 300;
    return {
      f: f,
      openV: openV,
      off: off,
      uA: uA,
      dscale: dscale,
      oscale: oscale,
      zi: Math.round(f.mag * 100)
    };
  }
  React.useEffect(function () {
    var raf,
      t0 = null,
      lastQ = 0;
    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (t0 == null) t0 = now;
      var ip = (now - t0) / 820;
      if (ip > 1) ip = 1;
      introRef.current = ip;
      var introK = _bosLp(1.34, 1, _bosSm(ip)); // зум-аут входа: ты крупно → поле «разгорается»
      var cam = camRef.current;
      var nodes = nodesRef.current,
        els = nodeEls.current,
        sigs = nodeSig.current;
      for (var i = 0; i < nodes.length; i++) {
        var nd = nodes[i],
          el = els[nd.key];
        if (!el) continue;
        var v = nodeVisual(nd.fx, nd.fy, cam, introK);
        if (v.off) {
          if (sigs[nd.key] !== "hide") {
            el.style.display = "none";
            sigs[nd.key] = "hide";
          }
          continue;
        }
        var disc = el.getAttribute("data-lod") === "disc";
        var tf = "translate(" + v.f.sx.toFixed(1) + "px," + v.f.sy.toFixed(1) + "px) scale(" + (disc ? v.dscale : v.oscale).toFixed(4) + ")";
        var sig = tf + "|" + v.zi + "|" + v.openV.toFixed(3);
        if (sigs[nd.key] === sig) continue; // покой = ноль записей в DOM
        if (sigs[nd.key] === "hide") el.style.display = "";
        el.style.transform = tf;
        el.style.zIndex = v.zi;
        if (!disc) {
          el.style.setProperty("--uK", _bosLp(0.3, 1, v.openV).toFixed(4));
          el.style.setProperty("--uO", v.openV.toFixed(3));
          el.style.setProperty("--uA", v.uA.toFixed(4));
        }
        sigs[nd.key] = sig;
      }
      // Квантованная камера для структуры (LOD/вращение) — не чаще ~6 раз/с и только если сдвинулась.
      if (now - lastQ > 160) {
        lastQ = now;
        setCamQ(function (p) {
          var c = camRef.current;
          return p.x === c.x && p.y === c.y && p.z === c.z ? p : {
            x: c.x,
            y: c.y,
            z: c.z
          };
        });
      }
    }
    raf = requestAnimationFrame(frame);
    return function () {
      cancelAnimationFrame(raf);
    };
  }, []);
  React.useEffect(function () {
    var t = setTimeout(function () {
      setIntroDone(true);
    }, 2000);
    return function () {
      clearTimeout(t);
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
  function uDown(e) {
    var g = vp.current;
    g.pts[e.pointerId] = {
      x: e.clientX,
      y: e.clientY
    };
    var ids = Object.keys(g.pts);
    var cam = camRef.current;
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
    var cam = camRef.current;
    // Пишем ПРЯМО в ref — rAF-цикл подхватит на ближайшем кадре (ни одного setState на пан).
    if (g.mode === "pinch" && ids.length >= 2) {
      var a = g.pts[ids[0]],
        b = g.pts[ids[1]];
      camRef.current = {
        x: cam.x,
        y: cam.y,
        z: _cZ(g.oz * (Math.hypot(a.x - b.x, a.y - b.y) / g.sd))
      };
    } else if (g.mode === "pan" && ids.length === 1) {
      var ps = 178 * PACK * g.oz;
      var dx = e.clientX - g.sx,
        dy = e.clientY - g.sy;
      g.moved = Math.max(g.moved, Math.abs(dx) + Math.abs(dy));
      camRef.current = {
        x: g.ox - dx / ps,
        y: g.oy - dy / ps,
        z: cam.z
      };
    }
  }
  function uUp(e) {
    var g = vp.current;
    var tap = g.mode === "pan" && g.moved < 6 && Object.keys(g.pts).length === 1;
    delete g.pts[e.pointerId];
    if (!Object.keys(g.pts).length) g.mode = null;
    var c = camRef.current;
    setCamQ({
      x: c.x,
      y: c.y,
      z: c.z
    }); // жест кончился → структура сразу догоняет
    if (tap) {
      try {
        onClose && onClose();
      } catch (_) {}
    }
  }
  function uWheel(e) {
    var c = camRef.current;
    camRef.current = {
      x: c.x,
      y: c.y,
      z: _cZ(c.z * (1 - (e.deltaY || 0) * 0.0012))
    };
  }
  var plural = list.length === 1 ? "система" : list.length >= 2 && list.length <= 4 ? "системы" : "систем";
  var sub = friends == null ? "" : list.length ? list.length + " " + plural + " рядом — у каждого своя орбита" : "пока только твоя система — позови своих";
  // РАСКРЫТИЕ колец — ГРАДИЕНТ по близости к центру ЛИНЗЫ (David: «я — целиком; ближайшие приоткрыты,
  // привычки читаются; дальше меньше; совсем далеко — иконки»). Плавно от центра (mag высок → 1) к
  // краю (→ 0). Широкий диапазон 0.9 → тает через несколько колец, а не резко.
  function openMag(mag) {
    return _bosSm((mag - 0.98) / 0.9);
  }
  // Твоя система — с РЕАЛЬНЫМИ привычками/людьми/уровнем; стоит в центре поля (fx=fy=0). Мемоизируем,
  // чтобы ссылки на habits/people/sp были СТАБИЛЬНЫ между кадрами → мемо-обёртка не перерисовывает.
  var _bs = typeof bosStreak === "function" ? bosStreak : function () {
    return 0;
  };
  var youHabits = React.useMemo(function () {
    return (app && app.habits || []).slice(0, 12).map(function (h) {
      return {
        emoji: h.emoji || "✨",
        color: h.color,
        streak: _bs(h.log),
        id: h.id
      };
    });
  }, [app]);
  var youPeople = React.useMemo(function () {
    return Array.isArray(people) ? people.slice(0, 10) : [];
  }, [people]);
  var youSp = React.useMemo(function () {
    return {
      s: {
        avatar: app && app.avatar,
        name: app && app.userName || ""
      },
      level: lvlNum,
      lvlPct: lvlPct,
      habits: youHabits,
      people: youPeople
    };
  }, [app, lvlNum, lvlPct, youHabits, youPeople]);
  var allNodes = React.useMemo(function () {
    return [{
      sp: youSp,
      fx: 0,
      fy: 0,
      you: true,
      ring: 0,
      key: "you"
    }].concat(layout.nodes.map(function (n, j) {
      return {
        sp: n.sp,
        fx: n.fx,
        fy: n.fy,
        ring: n.ring,
        key: "o" + j
      };
    }));
  }, [youSp, layout]);
  nodesRef.current = allNodes; // rAF-цикл всегда видит свежий список
  var node = /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 300,
      overflow: "hidden",
      background: bg,
      animation: "bosUniFade 0.5s ease both"
    }
  }, /*#__PURE__*/React.createElement("style", null, "@keyframes bosUniFade{from{opacity:0}to{opacity:1}}@keyframes bosSysPop{from{opacity:0;transform:scale(0.5)}to{opacity:1;transform:scale(1)}}"), /*#__PURE__*/React.createElement("div", {
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
  }, allNodes.map(function (nd) {
    var sp = nd.sp,
      key = nd.key;
    var vq = nodeVisual(nd.fx, nd.fy, camQ, 1); // структура: LOD/вращение (зум сокращается — см. calcNode)
    var prev = lodRef.current[key];
    var lod = vq.openV > (prev === "orbit" ? 0.10 : 0.14) ? "orbit" : "disc";
    lodRef.current[key] = lod;
    var vNow = nodeVisual(nd.fx, nd.fy, camRef.current, _bosLp(1.34, 1, _bosSm(introRef.current)));
    var delay = Math.min((nd.ring || 0) * 0.14, 1.0) + _bosHashU(key) % 100 / 100 * 0.15;
    var pop = introDone ? "none" : "bosSysPop 0.55s cubic-bezier(0.34,1.35,0.5,1) " + delay.toFixed(2) + "s both";
    var style = {
      position: "absolute",
      left: 0,
      top: 0,
      transformOrigin: "0px 0px",
      pointerEvents: "none",
      display: vNow.off ? "none" : undefined,
      zIndex: vNow.zi,
      transform: "translate(" + vNow.f.sx.toFixed(1) + "px," + vNow.f.sy.toFixed(1) + "px) scale(" + (lod === "disc" ? vNow.dscale : vNow.oscale).toFixed(4) + ")"
    };
    if (lod !== "disc") {
      style["--uK"] = _bosLp(0.3, 1, vNow.openV).toFixed(4);
      style["--uO"] = vNow.openV.toFixed(3);
      style["--uA"] = vNow.uA.toFixed(4);
    }
    nodeSig.current[key] = null; // рендер переписал inline-стили → цикл обновит сигнатуру заново
    return /*#__PURE__*/React.createElement("div", {
      key: key,
      ref: function (el) {
        if (el) nodeEls.current[key] = el;else {
          delete nodeEls.current[key];
          delete nodeSig.current[key];
        }
      },
      "data-lod": lod,
      style: style
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        transformOrigin: "0px 0px",
        animation: pop
      }
    }, lod === "disc" ? /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        left: -55,
        top: -55
      }
    }, UniDiscMemo ? /*#__PURE__*/React.createElement(UniDiscMemo, {
      avatar: sp.s && sp.s.avatar,
      level: sp.level,
      lvlPct: sp.lvlPct,
      size: 110,
      dark: isDark
    }) : null) : /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        left: -150,
        top: -150,
        width: 300,
        height: 300
      }
    }, /*#__PURE__*/React.createElement(UniSpinOrbit, {
      sp: sp,
      moodC: nd.you ? app && app.mood && app.mood.c : undefined,
      isDark: isDark,
      spinOn: vq.openV > 0.45
    }))));
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
  // Круглое стекло: блик внутри, края чистые — иначе выбеленный верх сливался с белым зазором
  // кольца выбора и кольцо казалось несимметричным (David). Тень — равномерная, без капли вниз.
  var sheen = typeof BOS_ORB_SHEEN !== "undefined" ? BOS_ORB_SHEEN : "linear-gradient(180deg, rgba(255,255,255,0.4), rgba(255,255,255,0.06) 58%, rgba(255,255,255,0) 85%)";
  var glass = typeof bosOrbGlass === "function" ? bosOrbGlass(false) : "inset 0 0 1px rgba(255,255,255,0.7), 0 0 2px rgba(0,0,0,0.1)";
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
  var sheen = typeof BOS_ORB_SHEEN !== "undefined" ? BOS_ORB_SHEEN : "linear-gradient(180deg, rgba(255,255,255,0.4), rgba(255,255,255,0.06) 58%, rgba(255,255,255,0) 85%)"; // круглое стекло: края чистые → кольцо выбора симметрично (David)
  var glass = typeof bosOrbGlass === "function" ? bosOrbGlass(false) : "inset 0 0 1px rgba(255,255,255,0.7), 0 0 2px rgba(0,0,0,0.1)";
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
      color: count > 0 ? bosReadableInk(accent, isDark) : "var(--text-4)",
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
      color: bosReadableInk(accent, isDark)
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
  var shareText = "Вести привычки вместе — веселее, и за совместные привычки больше XP ✨ Присоединяйся к «" + (team?.name || "") + "» в BalanceOS";
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

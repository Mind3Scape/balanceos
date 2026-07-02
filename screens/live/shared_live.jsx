/* screens/live/shared_live.jsx — CLEAN live-only forks of the mode-aware bricks the
   live screens used to borrow from the demo files. Each is the LIVE path only, renamed
   with a *Live suffix, so editing live can never reach into the demo originals (which
   keep their own demo/fresh branches). References only framework + core + live — never a
   demo-defined name. Loaded after core/ and the framework, before the live screen files.
   v197 — live ↔ demo ↔ core split, phase 2. */

/* aiReply → live-only: no demo `AI_DEMO` canned line. Empty model reply → honest fallback. */
async function aiReplyLive(history, ctx) {
  const sys = AI_SYSTEM + (ctx ? ("\n\n" + ctx) : "");
  const recent = (history || []).filter((m) => m && m.t).slice(-AI_HISTORY_TURNS);
  const messages = [{ role: "system", content: sys }].concat(
    recent.map((m) => ({ role: m.who === "me" ? "user" : "assistant", content: m.t }))
  );
  const t = await aiRaw(messages);
  if (t && t.trim()) return t.trim();
  await new Promise((r) => setTimeout(r, 900));
  return AI_LIVE_FALLBACK;
}

/* Гарантия МИКСА чипов-подсказок (David): среди четырёх всегда 1-2 «действия»
   (kind:"action" → реальный экран: состояние / создать привычку / цель) и 1-2
   «разговора» (открывают чат). ИИ-чипы без kind считаются чатом; недостающие
   действия добираются из реального состояния пользователя — никакой бутафории.
   Используют: экран ИИ, чипы в чате, ИИ-сводка на главной. */
function bosMixPillsLive(pills, app) {
  const isAct = (p) => p && p.kind === "action" && p.route;
  const src = Array.isArray(pills) ? pills.filter(Boolean) : [];
  const fill = [];
  try {
    const tk = (typeof bosTodayKey === "function") ? bosTodayKey() : "";
    const moodSet = !!(app && app.dayMoods && app.dayMoods[tk] != null);
    const nHabits = ((app && app.habits) || []).length;
    if (!moodSet) fill.push({ kind: "action", i: "🧭", label: "Отметить состояние", t: "Отметить состояние", route: "mood", params: null });
    const hLbl = nHabits ? "Ещё привычка" : "Создать привычку";
    fill.push({ kind: "action", i: "➕", label: hLbl, t: hLbl, route: "habit-settings", params: { mode: "create" } });
    fill.push({ kind: "action", i: "🌟", label: "Поставить цель", t: "Поставить цель", route: "goal-settings", params: { mode: "create" } });
  } catch (e) {}
  const seen = {};
  const key = (p) => ((p && (p.label || p.t || p.prompt)) || "") + "";
  const uniq = (arr) => arr.filter((p) => { const k = key(p); return p && k && !seen[k] && (seen[k] = 1); });
  const chats = uniq(src.filter((p) => !isAct(p)));
  const acts = uniq(src.filter(isAct).concat(fill));
  // Переплетаем: разговор, действие, разговор, действие; хвост — из остатков.
  const out = [];
  for (let k = 0; k < 2; k++) { if (chats[k]) out.push(chats[k]); if (acts[k]) out.push(acts[k]); }
  const rest = chats.slice(2).concat(acts.slice(2));
  for (let k = 0; out.length < 4 && k < rest.length; k++) out.push(rest[k]);
  return out.slice(0, 4);
}

/* Learning-cards visibility (Habits → «Обучение»). One persisted flag: hide once read,
   restore from Settings → Предпочтения. Synced across screens via a window event so the
   habits screen reacts the moment Settings flips it (David: «прочитал — хочу убрать»). */
function bosLearnHidden() { try { return localStorage.getItem("bos:hideLearn") === "1"; } catch (e) { return false; } }
function bosSetLearnHidden(v) { try { localStorage.setItem("bos:hideLearn", v ? "1" : "0"); } catch (e) {} try { window.dispatchEvent(new Event("bos:learnchange")); } catch (e) {} }

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
      var done = habits.filter(function (h) { return h.done; }).length;
      var list = habits.slice(0, 8).map(function (h) {
        return (h.emoji ? h.emoji + " " : "") + (h.name || "") +
          (h.streak ? " (серия " + h.streak + ")" : "") + (h.done ? " — сегодня сделано" : "");
      }).join("; ");
      parts.push("Привычки сегодня " + done + "/" + habits.length + ": " + list + ".");
    } else {
      parts.push("Привычек пока нет — помоги выбрать первую: маленькую, конкретную и реалистичную.");
    }
    var goals = (app.goals || []).map(function (g) { return g.name || g.title; }).filter(Boolean).slice(0, 5);
    if (goals.length) parts.push("Цели: " + goals.join("; ") + ".");
    if (typeof bosTotalXPLive === "function") {
      var xp = bosTotalXPLive(habits, { moods: app.dayMoods, notes: app.dayNotes }); var li = (typeof bosLevelInfoLive === "function") ? bosLevelInfoLive(xp) : null;
      if (li) parts.push("Уровень " + li.level + " (" + xp + " XP).");
    }
    if (!parts.length) return "";
    return "Контекст пользователя прямо сейчас (опирайся на него, но не зачитывай как список):\n" + parts.join(" ");
  } catch (e) { return ""; }
}

/* FeedbackSheet → live-only: hands the message to the real support email composer
   (no demo "delivered" success animation). */
function FeedbackSheetLive({ title = "Написать в поддержку", dark = false }) {
  const { close } = useSheet();
  const C = sheetColors(dark);
  const [txt, setTxt] = React.useState("");
  const send = () => {
    const body = (txt || "").trim();
    if (!body) return;
    try {
      const url = "mailto:" + BOS_SUPPORT_EMAIL + "?subject=" + encodeURIComponent("BalanceOS · " + title) + "&body=" + encodeURIComponent(body);
      if (window.__TG && window.__TG.openLink) window.__TG.openLink(url);
      else window.location.href = url;
    } catch (e) {}
    close();
  };
  return (
    <div style={{ padding: "2px 20px 6px", color: C.text }}>
      <div style={{ fontSize: 19, fontWeight: 700, textAlign: "center" }}>{title}</div>
      <textarea value={txt} onChange={e => setTxt(e.target.value)} placeholder="Опиши вопрос…" rows={4} style={{ width: "100%", marginTop: 14, background: C.field, border: "1px solid " + C.line, borderRadius: 14, padding: 12, fontSize: 14, color: C.text, fontFamily: "inherit", resize: "none", outline: "none", boxSizing: "border-box" }}/>
      <div style={{ fontSize: 12, color: C.sub, marginTop: 8, lineHeight: 1.45 }}>Откроется письмо на {BOS_SUPPORT_EMAIL} — отправь его, и мы ответим.</div>
      <button onClick={send} disabled={!txt.trim()} className="tap" style={{ width: "100%", marginTop: 12, background: C.btn, color: C.btnFg, border: 0, borderRadius: 999, padding: 13, fontSize: 15, fontWeight: 600, opacity: !txt.trim() ? 0.5 : 1 }}>Написать письмо</button>
    </div>
  );
}

/* DeadlineCalendar → live-only: always the REAL calendar anchored to today (the demo's
   frozen 28-апр-2026 showcase date is gone). */
function DeadlineCalendarLive({ onPick }) {
  const MON_SHORT = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  const MON_TITLE = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  const DAYS_IN = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const _now = new Date();
  const TODAY_M = _now.getMonth(), TODAY_D = _now.getDate(), YEAR = _now.getFullYear();
  const [m, setM] = React.useState(TODAY_M);
  const [start, setStart] = React.useState(null);
  const [end, setEnd] = React.useState(null);
  const startWeekday = (m * 3 + 3) % 7;
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= DAYS_IN[m]; d++) cells.push(d);
  const idx = (p) => p.m * 40 + p.d;
  const doy = (p) => DAYS_IN.slice(0, p.m).reduce((a, b) => a + b, 0) + p.d;
  const past = (d) => m === TODAY_M && d < TODAY_D;
  const eqp = (p, d) => p && p.m === m && p.d === d;
  const inRange = (d) => start && end && idx({ m, d }) > idx(start) && idx({ m, d }) < idx(end);
  const fmt = (p) => `${p.d} ${MON_SHORT[p.m]}`;
  const pick = (d) => {
    const p = { m, d };
    if (!start || end) { setStart(p); setEnd(null); return; }
    if (idx(p) <= idx(start)) { setStart(p); setEnd(null); return; }
    setEnd(p);
  };
  const span = start && end ? doy(end) - doy(start) : 0;
  const durTxt = span <= 0 ? "" : span < 14 ? `${span} дн.` : span < 60 ? `${Math.round(span / 7)} нед.` : `${Math.round(span / 30)} мес.`;
  const hint = !start ? "Выберите начало срока" : !end ? "Теперь — дату окончания" : `${fmt(start)} – ${fmt(end)} · ${durTxt}`;
  const pager = (dir) => (
    <button className="tap" data-no-haptic disabled={dir < 0 ? m <= TODAY_M : m >= 11} onClick={() => setM(Math.max(TODAY_M, Math.min(11, m + dir)))}
      style={{ width: 30, height: 30, borderRadius: 999, border: 0, background: "var(--surface-3)", opacity: (dir < 0 ? m <= TODAY_M : m >= 11) ? 0.3 : 1, display: "grid", placeItems: "center" }}><I.ChevronRight size={16} style={dir < 0 ? { transform: "rotate(180deg)" } : undefined} /></button>
  );
  return (
    <div style={{ background: "var(--card, #fff)", borderRadius: 22, padding: 14, marginTop: 10, boxShadow: "var(--card-shadow)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        {pager(-1)}
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{MON_TITLE[m]} {YEAR}</div>
        {pager(1)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, marginBottom: 4 }}>
        {["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"].map((w) => (
          <div key={w} style={{ textAlign: "center", fontSize: 10.5, color: "var(--text-4)", fontWeight: 600 }}>{w}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const ends = eqp(start, d) || eqp(end, d);
          const mid = inRange(d);
          const today = m === TODAY_M && d === TODAY_D;
          return (
            <button key={i} className="tap" data-no-haptic disabled={past(d)} onClick={() => pick(d)}
              style={{ aspectRatio: "1/1", border: 0, borderRadius: ends ? 999 : (mid ? 7 : 999), cursor: past(d) ? "default" : "pointer",
                background: ends ? "#0a0a0a" : (mid ? "rgba(10,10,10,0.08)" : "transparent"),
                color: ends ? "#fff" : "var(--text)", opacity: past(d) ? 0.3 : 1,
                fontSize: 13.5, fontWeight: (ends || today) ? 700 : 400,
                boxShadow: (today && !ends) ? "inset 0 0 0 1.5px rgba(0,0,0,0.16)" : "none" }}>{d}</button>
          );
        })}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 12, paddingTop: 11, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 12.5, color: (start && end) ? "var(--text)" : "var(--text-4)", fontWeight: (start && end) ? 600 : 400, minWidth: 0 }}>{hint}</div>
        <button className="tap" disabled={!(start && end)} onClick={() => onPick(`${fmt(start)} – ${fmt(end)}`)}
          style={{ flexShrink: 0, background: (start && end) ? "#0a0a0a" : "var(--surface-3)", color: (start && end) ? "#fff" : "var(--text-4)", border: 0, borderRadius: 999, padding: "8px 16px", fontSize: 13, fontWeight: 600 }}>Готово</button>
      </div>
    </div>
  );
}

/* ONE soft, glossy completion-fill — the calendar AND the week strip share it, so the whole app
   speaks one colour (David: «заливки слишком яркие; рассинхрон с мягкой иконкой; чёрный прям
   чёрный; и хочется градиент с лёгким блеском Liquid-Glass, а не сплошняк»). A light TOP sheen over
   a directional tint of the habit's colour `hx`, intensity by p (0..1). Capped well below full
   saturation → soft, never neon; black lands as a soft graphite, not pure black. */
function bosCellFill(hx, p) {
  if (!(hx && hx[0] === "#" && hx.length >= 7)) hx = "#0a0a0a";
  var bot = 0.30 + 0.55 * Math.max(0, Math.min(1, p));  // bottom alpha — PRESENT, caps ~0.85 (never full)
  var top = bot * 0.6;                                    // lighter top → directional sheen
  var hex = function (a) { return Math.round(a * 255).toString(16).padStart(2, "0"); };
  return "linear-gradient(180deg, " + hx + hex(top) + ", " + hx + hex(bot) + ")";
}
// Осветлить hex к белому на amt (0..1) → МЯГКАЯ ПАСТЕЛЬ. Наши BOS_APPLE_COLORS средне-насыщенные;
// заливать карточку целиком ими = «убого» (David). Осветляем до партнёрской пастели (#B9D4FF-класс),
// сохраняя палитру. ЕДИНЫЙ тон для заливки карточек целей/команд = язык карточек «Потратить XP».
function bosLightenHex(hx, amt) {
  if (!(hx && hx[0] === "#" && hx.length >= 7)) return hx || "#eef1f6";
  var k = Math.max(0, Math.min(1, amt));
  var r = parseInt(hx.slice(1, 3), 16), g = parseInt(hx.slice(3, 5), 16), b = parseInt(hx.slice(5, 7), 16);
  var mk = function (c) { return Math.round(c + (255 - c) * k).toString(16).padStart(2, "0"); };
  return "#" + mk(r) + mk(g) + mk(b);
}
/* Смесь двух hex-цветов: hx→to на t (0..1). ФУНДАМЕНТ тема-зависимой тонировки (David:
   «цвета с пикера должны чуть отличаться в тёмной»): светлая тема осветляет к белому
   (bosLightenHex), тёмная — углубляет к тёмной подложке (bosMixHex к #101014 и т.п.),
   сохраняя оттенок насыщенным, без «засветки» пастелью. */
function bosMixHex(hx, to, t) {
  if (!(hx && hx[0] === "#" && hx.length >= 7)) return hx || "#333";
  if (!(to && to[0] === "#" && to.length >= 7)) return hx;
  var k = Math.max(0, Math.min(1, t));
  var pr = function (s, i) { return parseInt(s.slice(i, i + 2), 16); };
  var mk = function (a, b) { return Math.round(a + (b - a) * k).toString(16).padStart(2, "0"); };
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
  var real = accent && accent[0] === "#" && accent.length === 7 &&
             ("" + accent).toLowerCase() !== "#0a0a0a" && accent !== "#8E8E93";
  if (isDark) {
    var dr = real ? (", 0 0 0 1.4px " + accent + "b3") : "";
    return "inset 0 0 0 1.5px rgba(255,255,255,0.44)" + dr + ", 0 1px 2px rgba(0,0,0,0.30)";
  }
  var ring = real ? (accent + "a6") : "rgba(10,10,10,0.17)";
  return "inset 0 0 0 1.5px rgba(255,255,255,0.95), 0 0 0 1.4px " + ring + ", 0 1px 2.5px rgba(0,0,0,0.10)";
}
function bosCellEmpty(accent, isDark, mul) {
  mul = (mul == null) ? 1 : mul; // 1=пустой день (~19-23%); <1 = слабее (будущее/соседний месяц)
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
  return isDark
    ? "inset 0 1px 0.5px rgba(255,255,255,0.16), inset 0 0 0 0.6px rgba(255,255,255,0.06)"
    : "inset 0 1px 0.5px rgba(255,255,255,0.5), inset 0 0 0 0.6px rgba(0,0,0,0.06)";
}
// Glass for the habit/goal ICON tiles — a BRIGHTER specular top + soft edge + depth than the small
// day-cell glass (David: «на главной иконке привычки стекло еле видно — чуть светлее и заметнее, и
// так ВЕЗДЕ где привычки видны»). Pair with BOS_TILE_SHEEN on the background.
function bosTileGlass(isDark) {
  // Тёмный блик приглушён (0.22→0.12) — David: «стекло слишком ярко засвечено».
  return isDark
    ? "inset 0 1px 0.5px rgba(255,255,255,0.12), inset 0 0 0 0.7px rgba(255,255,255,0.06), 0 1px 2px rgba(0,0,0,0.18)"
    : "inset 0 1.5px 0.5px rgba(255,255,255,0.92), inset 0 0 0 0.7px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.05)";
}
// Блик тема-зависимый: в тёмной CSS-переменные гасят белый градиент (David: «пересвечено»),
// в светлой фолбэки держат прежний вид. ОДНО место — все плитки/чипы/кнопки сразу.
const BOS_TILE_SHEEN = "linear-gradient(165deg, var(--sheen-a, rgba(255,255,255,0.55)), var(--sheen-b, rgba(255,255,255,0.12)) 46%, rgba(255,255,255,0) 72%)";
// Grey GLASS pill — the «Быстрое добавление» chip look (grey base) + a soft glass sheen + bright
// top edge. ONE source so the home hero pills and the Habits quick-add chips stay identical
// (David: стекло на пилюли + континьюити). Spread into a chip's inline style; pair with border:0.
function bosChipGlass(isDark) {
  return {
    background: BOS_TILE_SHEEN + ", " + (isDark ? "rgba(255,255,255,0.07)" : "#F1F1F5"),
    boxShadow: isDark
      ? "inset 0 0.5px 0.5px rgba(255,255,255,0.08), inset 0 0 0 0.5px rgba(255,255,255,0.04)"
      : "inset 0 1px 0.5px rgba(255,255,255,0.95), inset 0 0 0 0.5px rgba(0,0,0,0.05)",
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
function BosUnitSelectLive({ value, onChange }) {
  // Режим — ЛОКАЛЬНОЕ состояние (источник правды для сегментов): иначе пустой «custom» (unit="") тут же
  // прочитался бы как «count» и режим «Своя» не открылся бы. Синхронизируем с value, но пустой custom держим.
  var _s = React.useState(function () { return bosUnitMode(value); });
  var mode = _s[0], setMode = _s[1];
  React.useEffect(function () { if (!(mode === "custom" && !value)) setMode(bosUnitMode(value)); }, [value]);
  var pick = function (m) {
    if (m === mode) return;
    setMode(m);
    onChange(m === "count" ? "раз" : m === "time" ? "мин" : (bosUnitMode(value) === "custom" ? value : ""));
  };
  var seg = function (m, label) {
    var on = mode === m;
    return <button type="button" className="tap" data-no-haptic onClick={function () { pick(m); }} aria-label={label}
      style={{ flex: 1, minWidth: 0, border: 0, borderRadius: 9, padding: "8px 4px", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        background: on ? "#fff" : "transparent", color: on ? "#0a0a0a" : "var(--text-3)", boxShadow: on ? "0 1px 3px rgba(0,0,0,0.10)" : "none", transition: "background 0.15s" }}>{label}</button>;
  };
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ display: "flex", gap: 4, background: "var(--surface-3)", borderRadius: 12, padding: 3 }}>
        {seg("count", "Количество")}{seg("time", "Время")}{seg("custom", "Своя")}
      </div>
      {mode === "custom" && (
        <input type="text" value={value || ""} onChange={function (e) { onChange(e.target.value); }} placeholder="напр. книг, км, стаканов" aria-label="Своя единица"
          style={{ width: "100%", boxSizing: "border-box", marginTop: 8, border: 0, outline: 0, background: "var(--surface-3)", borderRadius: 12, padding: "10px 14px", fontSize: 15, fontWeight: 600, color: "var(--text)" }} />
      )}
    </div>
  );
}
// Number ink for a filled day in «подробно» — contrast over the fill (white on dark hues, ink on
// light hues). Favours dark text when borderline (the top sheen lightens the centre).
function bosCellInk(hx, p, isDark) {
  if (!(hx && hx[0] === "#" && hx.length >= 7)) hx = "#0a0a0a";
  var a = (0.30 + 0.55 * Math.max(0, Math.min(1, p))) * 0.82;
  var ch = isDark ? 30 : 255;
  var r = parseInt(hx.slice(1, 3), 16), g = parseInt(hx.slice(3, 5), 16), b = parseInt(hx.slice(5, 7), 16);
  var lum = 0.299 * (r * a + ch * (1 - a)) + 0.587 * (g * a + ch * (1 - a)) + 0.114 * (b * a + ch * (1 - a));
  return lum > 170 ? "var(--text)" : "#fff";
}

/* PeopleMonthCalendar → live-only: always the REAL calendar (demo's frozen showcase date gone). */
function PeopleMonthCalendarLive({ people = [], dayFrac, label = "Календарь", granular = false, selPerson: selProp, onSelPerson, todayTap }) {
  const app = (typeof useApp === "function") ? useApp() : null;
  const isDark = app?.themeOverride === "dark";
  const MONTHS = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
  const _nowCal = new Date();
  const CUR_M = _nowCal.getMonth(), today = _nowCal.getDate(), year = _nowCal.getFullYear();
  const solo = people.length <= 1;
  const [mIdx, setMIdx] = React.useState(CUR_M);
  const [selInner, setSelInner] = React.useState(solo ? 0 : null);
  const selPerson = selProp !== undefined ? selProp : selInner;
  const setSelPerson = (v) => { if (onSelPerson) onSelPerson(v); else setSelInner(v); };
  const [selDay, setSelDay] = React.useState(today);
  const [compact, setCompact] = React.useState(true); // «красиво» (default, just cells) ↔ «подробно» по глазику
  const [view, setView] = React.useState("month"); // Неделя · Месяц · Год — один кружок-день в трёх масштабах (David)
  const daysInMonth = new Date(year, mIdx + 1, 0).getDate();
  const startWeekday = new Date(year, mIdx, 1).getDay();
  const isCurMonth = mIdx === CUR_M;
  const lastLogged = isCurMonth ? today : (mIdx > CUR_M ? 0 : daysInMonth);
  const future = (d) => mIdx > CUR_M || d > lastLogged;
  const pf = (pi, d) => (future(d) ? null : dayFrac(pi, d, mIdx));
  const allFrac = (d) => { if (future(d)) return null; const v = people.map((_, i) => pf(i, d)); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0; };
  const dayPct = (d) => (selPerson == null ? allFrac(d) : pf(selPerson, d));
  const track = isDark ? "rgba(255,255,255,0.13)" : "rgba(0,0,0,0.09)";
  // «Все» (aggregate) tints in the habit's OWN colour, not a hardcoded yellow (David: «база чёрная
  // — и агрегат должен быть чёрным: полная заливка если все отметились, частичная если не все»).
  const aggColor = (people[0] && people[0].color) || "#0a0a0a";
  const selColor = selPerson == null ? aggColor : (people[selPerson]?.color || aggColor);
  const todayBg = isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.07)";
  const selRing = isDark ? "rgba(255,255,255,0.42)" : "rgba(0,0,0,0.28)";
  const chipBg = isDark ? "rgba(255,255,255,0.07)" : "var(--surface-3)";
  const chip = (active) => ({ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px 5px 6px", borderRadius: 999, background: active ? (isDark ? "#fff" : "#0a0a0a") : chipBg, color: active ? (isDark ? "#0a0a0a" : "#fff") : "var(--text-2)", border: 0, flexShrink: 0, fontSize: 13, fontWeight: active ? 700 : 500, whiteSpace: "nowrap", cursor: "pointer" });
  const weekday = ["Вс","Пн","Вт","Ср","Чт","Пт","Сб"];
  // Edges show the adjacent months' days as BARELY-grey discs (David: «едва серенькие выпирания
  // слева и справа — что там тоже какие-то дни») instead of empty blanks.
  const _prevDays = new Date(year, mIdx, 0).getDate();
  const _lead = Array.from({ length: startWeekday }, (_, i) => ({ adj: true, d: _prevDays - startWeekday + 1 + i, key: "p" + i }));
  const _main = Array.from({ length: daysInMonth }, (_, i) => ({ d: i + 1, key: "d" + (i + 1) }));
  const _used = (startWeekday + daysInMonth) % 7;
  const _trail = Array.from({ length: _used === 0 ? 0 : 7 - _used }, (_, i) => ({ adj: true, d: i + 1, key: "n" + i }));
  const cells = [..._lead, ..._main, ..._trail];
  const selActive = future(selDay) ? null : people.filter((_, i) => (pf(i, selDay) ?? 0) >= 0.5).length;
  const selAvg = future(selDay) ? null : Math.round((allFrac(selDay) || 0) * 100);
  const selName = (selPerson != null && people[selPerson]) ? people[selPerson].name : null;

  // Ripple — a wave that radiates from the tapped TODAY cell across the whole grid (David: «как в
  // Ripples — волны расходятся по квадратикам от того, на который тапнул»). Web-Animations API,
  // staggered by grid distance; auto-cleans, no React state churn.
  const gridRef = React.useRef(null);
  const weekGridRef = React.useRef(null); // «Неделя»-грядка имеет СВОЙ ref → волна расходится и здесь.
  const todayIdx = startWeekday + today - 1; // flat index of «today» within the month `cells`
  const triggerRipple = (originIdx, gridEl) => {
    const grid = gridEl || gridRef.current; if (!grid) return;
    const cols = 7, kids = grid.children;
    const or = Math.floor(originIdx / cols), oc = originIdx % cols;
    for (let i = 0; i < kids.length; i++) {
      const el = kids[i]; if (!el || el.getAttribute("aria-hidden")) continue;
      const dist = Math.hypot(Math.floor(i / cols) - or, (i % cols) - oc);
      try {
        // Волна = не только размер, но и лёгкий БЛЕСК (осветление) проходящий по клетке (David).
        el.animate([{ transform: "scale(1)", filter: "brightness(1)" }, { transform: "scale(1.18)", filter: "brightness(1.32)" }, { transform: "scale(1)", filter: "brightness(1)" }],
          { duration: 430, delay: dist * 42, easing: "cubic-bezier(0.22,0.9,0.3,1.2)" });
      } catch (_) {}
    }
  };
  // Волна работает в ОБОИХ масштабах: «Месяц» → его сетка; «Неделя» → 5-нед грядка (свой ref + индекс
  // сегодня = строка current-week). Раньше fireToday всегда бил по gridRef месяца, которого в недельном
  // виде НЕТ в DOM → в «Неделе» волны не было (David: «волна во всех видах и внутри»).
  const fireToday = () => {
    setSelDay(today);
    if (view === "week") { const wi = weeksData.findIndex((w) => w.isToday); triggerRipple(wi < 0 ? 28 : wi, weekGridRef.current); }
    else triggerRipple(todayIdx, gridRef.current);
    if (todayTap && todayTap.onTap) todayTap.onTap();
  };

  // ── «Месяц · Год» — тот же кружок-день в двух масштабах (David; неделя живёт на карточке). Год =
  //    «грядка» с начала года до сегодня; месяцы СКРЫТЫ пока не нажат глазик («Подробно»).
  const MO_ABBR = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
  const yearScrollRef = React.useRef(null);
  const yearData = React.useMemo(() => {
    const jan1 = new Date(year, 0, 1);
    const wd0 = (jan1.getDay() + 6) % 7;                                  // Mon-first offset of Jan 1
    const tot = Math.round((new Date(year, CUR_M, today) - jan1) / 86400000) + 1; // days Jan 1 → today
    const cols = Math.ceil((wd0 + tot) / 7);
    const firstCol = {}, slots = [], colLabel = {};
    for (let c = 0; c < cols; c++) for (let r = 0; r < 7; r++) {
      const off = c * 7 + r - wd0;
      if (off < 0 || off >= tot) { slots.push(null); continue; }
      const dt = new Date(year, 0, 1 + off), m = dt.getMonth();
      if (firstCol[m] === undefined) { firstCol[m] = c; colLabel[c] = MO_ABBR[m]; }
      slots.push({ m, d: dt.getDate() });
    }
    return { cols, slots, colLabel };
  }, [year, CUR_M, today]);
  const yearPct = (m, d) => {
    if (selPerson == null) { const v = people.map((_, i) => dayFrac(i, d, m) || 0); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0; }
    return dayFrac(selPerson, d, m) || 0;
  };
  // «Неделя» = ТЕКУЩАЯ неделя одной строкой (7 кружков Пн..Вс) — ровно как полоска на КАРТОЧКЕ,
  // континьюити карта↔деталь (David: «в недельном виде месячные кружочки» → 5×7 читалось как месяц).
  // Грядка-эффект теперь живёт ТОЛЬКО в «Месяце»/«Годе»; неделя — лаконичная строка, сегодня тап-отметка.
  const weeksData = React.useMemo(() => {
    const N = 1, now = new Date(year, CUR_M, today), dow = (now.getDay() + 6) % 7;
    const mon = new Date(now); mon.setDate(now.getDate() - dow);
    const out = [];
    for (let w = 0; w < N; w++) for (let c = 0; c < 7; c++) {
      const d = new Date(mon); d.setDate(mon.getDate() + (w - (N - 1)) * 7 + c);
      out.push({ d: d.getDate(), m: d.getMonth(), isToday: d.getMonth() === CUR_M && d.getDate() === today && d.getFullYear() === year, future: d.getTime() > now.getTime() });
    }
    return out;
  }, [year, CUR_M, today]);
  React.useEffect(() => { if (view === "year" && yearScrollRef.current) yearScrollRef.current.scrollLeft = yearScrollRef.current.scrollWidth; }, [view]);

  return (
    <>
      <div style={{ background: "var(--card)", borderRadius: 22, padding: 14, boxShadow: "var(--card-shadow)", marginTop: label ? 12 : 0 }}>
        {/* Без заголовка (David: «„Календарь привычки“ убрать — и так понятно»). Переключатель Месяц·Год
            (неделя живёт на карточке) + глазик «Компактно/Подробно» — РАБОТАЕТ В ОБОИХ режимах:
            по умолчанию минимализм (без подписей/чисел), по глазику — месяцы/числа. */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 2, background: chipBg, borderRadius: 12, padding: 3, flex: 1 }}>
            {[["week", "Неделя"], ["month", "Месяц"], ["year", "Год"]].map(([v, l]) => (
              <button key={v} onClick={() => setView(v)} className="tap" style={{ flex: 1, border: 0, borderRadius: 9, padding: "6px 0", fontSize: 13, fontWeight: view === v ? 700 : 500, cursor: "pointer", background: view === v ? (isDark ? "#fff" : "#0a0a0a") : "transparent", color: view === v ? (isDark ? "#0a0a0a" : "#fff") : "var(--text-2)" }}>{l}</button>
            ))}
          </div>
          <button onClick={() => setCompact((c) => !c)} className="tap" aria-label={compact ? "Подробно" : "Компактно"}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: chipBg, border: 0, borderRadius: 999, padding: "7px 11px", color: "var(--text-2)", fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
            <I.Eye size={14} color="var(--text-3)" />{compact ? "Подробно" : "Компактно"}
          </button>
        </div>
        {!solo && (
          <div className="screen-scroll" style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 2, marginBottom: 12 }}>
            <button onClick={() => setSelPerson(null)} className="tap" style={chip(selPerson == null)}>
              <span style={{ width: 18, height: 18, borderRadius: "50%", background: isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.1)", display: "grid", placeItems: "center", fontSize: 10 }}>👥</span>
              Все
            </button>
            {people.map((m, i) => (
              <button key={i} onClick={() => setSelPerson(i)} className="tap" style={chip(selPerson === i)}>
                <BuddyFaceLive avatar={m.avatar} name={m.name} size={18} />
                {m.you ? "Ты" : (m.name || "").split(" ")[0]}
              </button>
            ))}
          </div>
        )}

        {view === "week" && (
          <div ref={weekGridRef} style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 7, width: "100%", maxWidth: 300, margin: "0 auto" }}>
            {weeksData.map((wd, i) => {
              const hx = (selColor && selColor[0] === "#" && selColor.length >= 7) ? selColor : "#0a0a0a";
              const itx = !!(todayTap && wd.isToday && (solo || selPerson == null || (people[selPerson] && people[selPerson].you)));
              const pct = wd.future ? null : (itx ? todayTap.pct : yearPct(wd.m, wd.d));
              const fut = pct == null;
              const filled = !fut && pct > 0;
              const done = !fut && pct >= 1;
              const bg = fut ? bosCellEmpty(hx, isDark, 0.42) : (pct <= 0 ? (itx ? bosCellFill(hx, 0.14) : bosCellEmpty(hx, isDark)) : bosCellFill(hx, pct));
              // Сегодня = единое стеклянное кольцо (bosTodayRing) в ТОНЕ привычки, как снаружи; без «+».
              const sh = [filled ? bosCellGlass(isDark) : "", wd.isToday ? bosTodayRing(isDark, hx) : ""].filter(Boolean).join(", ") || "none";
              return (
                <button key={i} onClick={itx ? fireToday : undefined} className="tap" style={{ aspectRatio: "1/1", border: 0, borderRadius: "50%", padding: 0, background: bg, boxShadow: sh, cursor: itx ? "pointer" : "default", display: "grid", placeItems: "center", color: "#fff", fontWeight: 800, fontSize: 13 }}>
                  {itx && done ? <I.Check size={15} strokeWidth={3} color="#fff" /> : null}
                </button>
              );
            })}
          </div>
        )}

        {view === "month" && !compact && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button onClick={() => setMIdx((m) => Math.max(0, m - 1))} className="tap" style={{ background: chipBg, border: 0, borderRadius: 999, width: 32, height: 32, display: "grid", placeItems: "center", color: "inherit", opacity: mIdx === 0 ? 0.35 : 1 }}><I.ChevronLeft size={16} /></button>
            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.3px" }}>{MONTHS[mIdx]} {year}</div>
            <button onClick={() => setMIdx((m) => Math.min(11, m + 1))} className="tap" style={{ background: chipBg, border: 0, borderRadius: 999, width: 32, height: 32, display: "grid", placeItems: "center", color: "inherit", opacity: mIdx === 11 ? 0.35 : 1 }}><I.ChevronRight size={16} /></button>
          </div>
        )}

        {view === "month" && !compact && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6, maxWidth: 252, width: "100%", margin: "12px auto 0" }}>
            {weekday.map((w, i) => <div key={i} style={{ textAlign: "center", fontSize: 9.5, fontWeight: 600, letterSpacing: 0.3, color: "var(--text-4)" }}>{w}</div>)}
          </div>
        )}
        {/* Day cells — CIRCLES (день = кружок; люди = чипы выше), залитые хитмапом по выполнению.
            «Красиво» прячет числа/подписи/навигацию для глазастой сетки. */}
        {view === "month" && (
        <div ref={gridRef} style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6, maxWidth: 252, width: "100%", margin: compact ? "0 auto" : "6px auto 0" }}>
          {cells.map((c) => {
            // Соседние месяцы (prev/next) = еле заметный ПОЛНЫЙ кружок (David: «продолжить еле заметными
            // кружочками слева и справа, чтобы месяц был ближе к ГРЯДКЕ»). Полный размер достраивает
            // прямоугольник-грядку; opacity ниже пустого дня (track) → месяц мягко «бледнеет» по краям,
            // но клетка-кружок не рвётся на точки — бесшовное продолжение бесконечной грядки.
            if (c.adj) return <span key={c.key} aria-hidden style={{ aspectRatio: "1/1", borderRadius: "50%", background: bosCellEmpty(selColor, isDark, 0.3) }} />;
            const isToday = isCurMonth && c.d === today;
            // TODAY is the single tap-to-mark control now (David removed the bottom button — «тапаешь
            // день, бумс»). Interactive only in YOUR view (solo / «Все» / your own chip) — never on a
            // buddy's filter — and it always shows YOUR state, since the tap marks your check-in.
            const itx = !!(todayTap && isToday && (solo || selPerson == null || (people[selPerson] && people[selPerson].you)));
            const pct = itx ? todayTap.pct : dayPct(c.d);
            const fut = pct == null;
            const isSel = selDay === c.d;
            const hx = (selColor && selColor[0] === "#" && selColor.length >= 7) ? selColor : "#0a0a0a";
            const done = !fut && pct >= 1;
            const filled = !fut && pct > 0;
            // Empty interactive today = a faint accent wash + accent ring + «+», so it reads «tap me».
            const bg = fut ? bosCellEmpty(hx, isDark, 0.42)
              : (pct <= 0 ? (itx ? bosCellFill(hx, 0.14) : bosCellEmpty(hx, isDark)) : bosCellFill(hx, pct));
            // One COHESIVE today-glyph colour (David: «цвет цифры прыгает с чёрного на белый на 4→5 —
            // бред; пусть пока копится и в конце ВСЕГДА белый; „+" пусть остаётся в цвете обводки»).
            // Filled today = ALWAYS white number/✓ (never flips) + soft shadow so it reads on any fill;
            // empty today = accent «+» (harmonises with the ring). Non-today keeps the heat-map ink.
            const ink = fut ? "var(--text-4)" : (pct <= 0 ? (itx ? hx : "var(--text)") : (itx ? "#fff" : bosCellInk(hx, pct, isDark)));
            const todayGlow = (itx && filled) ? "0 0.5px 1.5px rgba(0,0,0,0.55)" : "none";
            // Сегодня = единое СТЕКЛЯННОЕ кольцо (bosTodayRing) — как на внешнем страйпе (David); выбранный
            // день (не сегодня) — тонкая обводка selRing. Без accent-зелёного/серого разнобоя.
            const shadow = [filled ? bosCellGlass(isDark) : "", isToday ? bosTodayRing(isDark, hx) : ((!compact && isSel) ? ("0 0 0 1.6px " + selRing) : "")].filter(Boolean).join(", ") || "none";
            const onClick = itx ? fireToday : (compact ? undefined : () => setSelDay(c.d));
            return (
              <button key={c.key} {...(itx ? { "data-no-haptic": "" } : {})} onClick={onClick} className="tap" style={{
                aspectRatio: "1/1", border: 0, borderRadius: "50%", padding: 0, display: "grid", placeItems: "center",
                fontSize: 11, fontWeight: isToday ? 700 : 500, cursor: (itx || !compact) ? "pointer" : "default",
                background: bg, boxShadow: shadow, color: ink, position: "relative" }}>
                {(itx && done)
                  ? <I.Check size={15} strokeWidth={3} color={ink} style={{ filter: todayGlow !== "none" ? "drop-shadow(0 0.5px 1px rgba(0,0,0,0.5))" : "none" }} />
                  : (!compact && !fut && <span>{c.d}</span>)}
              </button>
            );
          })}
        </div>
        )}

        {/* Год — «грядка» с начала года до сегодня: столбцы = недели, строки = дни недели (Пн↑Вс),
            месяцы сверху. Тот же кружок-день и заливка-хитмап. Открывается прокрученной к сегодня. */}
        {view === "year" && (
          <div ref={yearScrollRef} className="screen-scroll" style={{ overflowX: "auto", paddingBottom: 4 }}>
            <div style={{ minWidth: yearData.cols * 14, margin: "0 auto" }}>
              {/* Месяцы — только в «Подробно» (по глазику); по умолчанию грядка минималистичная (David). */}
              {!compact && (
                <div style={{ display: "flex", marginBottom: 7 }}>
                  {Array.from({ length: yearData.cols }, (_, c) => (
                    <div key={c} style={{ width: 14, flexShrink: 0, fontSize: 11, fontWeight: 600, color: "var(--text-4)", whiteSpace: "nowrap", overflow: "visible" }}>{yearData.colLabel[c] || ""}</div>
                  ))}
                </div>
              )}
              <div style={{ display: "grid", gridTemplateRows: "repeat(7, 11px)", gridAutoFlow: "column", gridAutoColumns: "11px", gap: 3 }}>
                {yearData.slots.map((s, i) => {
                  if (!s) return <span key={i} aria-hidden style={{ width: 11, height: 11 }} />;
                  const hx = (selColor && selColor[0] === "#" && selColor.length >= 7) ? selColor : "#0a0a0a";
                  const pct = yearPct(s.m, s.d);
                  const filled = pct > 0;
                  const isToday = s.m === CUR_M && s.d === today;
                  const bg = pct <= 0 ? track : bosCellFill(hx, pct);
                  // «Сегодня» = тот же нейтральный серый ободок, что в «Месяце»/«Неделе»/на карточке —
                  // континьюити (David: «почему дату на годовом выделяем оранжевым — должно быть гармонично»).
                  const todayRingY = isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.48)";
                  const sh = [filled ? bosCellGlass(isDark) : "", isToday ? ("0 0 0 1.6px " + todayRingY) : ""].filter(Boolean).join(", ") || "none";
                  return <span key={i} title={(MONTHS[s.m] || "") + " " + s.d} style={{ width: 11, height: 11, borderRadius: "50%", background: bg, boxShadow: sh }} />;
                })}
              </div>
            </div>
          </div>
        )}

        {view === "month" && !compact && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)", fontSize: 12, color: "var(--text-3)", lineHeight: 1.45 }}>
            {future(selDay) ? `${MONTHS[mIdx]} ${selDay} — ещё впереди`
              : solo
                ? <span><b style={{ color: "var(--text)" }}>{MONTHS[mIdx]} {selDay}</b> · {(dayPct(selDay) || 0) > 0 ? "выполнено ✓" : "пропущено"}</span>
                : selPerson == null
                  ? <span><b style={{ color: "var(--text)" }}>{MONTHS[mIdx]} {selDay}</b> · отметилось {selActive} из {people.length}{granular && selAvg != null ? ` · ${selAvg}%` : ""}</span>
                  : <span><b style={{ color: "var(--text)" }}>{selName}</b> · {MONTHS[mIdx]} {selDay} · {granular ? `${Math.round((dayPct(selDay) || 0) * 100)}% привычек` : ((dayPct(selDay) || 0) > 0 ? "отмечался ✓" : "пропустил")}</span>}
          </div>
        )}
      </div>
    </>
  );
}

/* NetworkLocked → live-only: the REAL ways to climb (habits / state / team). No demo
   premium-course showcase, no dev "instant unlock" bypass. */
function NetworkLockedLive({ navigate, level, xp, xpMax, levelsLeft }) {
  const { open: _openSheet } = (typeof useSheet === "function") ? useSheet() : { open: () => {} };
  const xpPct = Math.max(0, Math.min(1, xp / xpMax));
  const ruLvl = (n) => { const m = n % 10, h = n % 100; return (m === 1 && h !== 11) ? "уровень" : (m >= 2 && m <= 4 && (h < 10 || h >= 20)) ? "уровня" : "уровней"; };
  const progPct = ((10 - levelsLeft - 1 + xpPct) / 10 * 100).toFixed(1);
  const paths = [
    {
      i: "🔥", t: "Закрывай привычки",
      d: "Каждый день с галочкой — это опыт и шаг к цели.",
      cta: "К привычкам", action: () => navigate("home"),
      meta: "+10 XP / день",
      accent: "#FEDE34",
    },
    {
      i: "🌤️", t: "Отмечай состояние",
      d: "Отметка и пара строк в дневнике дают опыт каждый день.",
      cta: "Отметить сейчас", action: () => navigate("mood"),
      meta: "+15 XP / день",
      accent: "#9bd0ff",
    },
    {
      i: "🤝", t: "Делайте вместе",
      d: "Общие цели и привычки с друзьями тоже идут в твой опыт — и так веселее.",
      cta: "Цель вместе", action: () => _openSheet(<GoalFormSheetLive mode="create" circleOn={true} navigate={navigate} />),
      meta: "Вместе с друзьями",
      accent: "#85e3a8",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
      <div style={{ position: "relative", overflow: "hidden", borderRadius: 22, padding: "16px 18px",
        background: "linear-gradient(145deg, #26406e 0%, #182c4f 52%, #0c1730 100%)",
        boxShadow: "0 10px 26px rgba(12,23,48,0.42)" }}>
        <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 82% 18%, rgba(150,185,255,0.30) 0%, transparent 46%), radial-gradient(circle at 12% 96%, rgba(120,160,220,0.16) 0%, transparent 44%)", pointerEvents: "none" }} />
        <div aria-hidden style={{ position: "absolute", top: 15, right: 18, fontSize: 34, lineHeight: 1, pointerEvents: "none" }}>👑</div>
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase", color: "rgba(160,196,255,0.9)" }}>Нетворк · откроется с 10 уровня</div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.4px", color: "#fff", marginTop: 4, maxWidth: 215, lineHeight: 1.18 }}>Закрытый круг своих</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.74)", marginTop: 6, lineHeight: 1.4, maxWidth: 248 }}>Живые встречи и помощь рядом — с людьми твоего города.</div>

          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: "#fff" }}>Уровень {level} → 10</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.72)" }}>осталось {levelsLeft} {ruLvl(levelsLeft)}</span>
            </div>
            <div style={{ height: 9, borderRadius: 999, background: "rgba(255,255,255,0.13)", overflow: "hidden" }}>
              <span style={{ display: "block", height: "100%", width: progPct + "%", background: "linear-gradient(90deg, #FEDE34, #EF9F14)", borderRadius: 999 }} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 7, marginTop: 13 }}>
            {[["🤝", "Наставники"], ["💎", "Услуги за XP"]].map(([e, l], i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.13)", borderRadius: 999, padding: "6px 11px", fontSize: 12.5, fontWeight: 700, color: "#fff" }}>
                <span style={{ fontSize: 13, lineHeight: 1 }}>{e}</span>{l}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="section-label" style={{ marginTop: 6 }}>3 способа открыть</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {paths.map((p, i) => (
          <button key={i} onClick={p.action} className="tap" style={{
            background: "var(--card)", border: 0, borderRadius: 22, padding: 16,
            boxShadow: "var(--card-shadow)",
            display: "flex", alignItems: "center", gap: 14, textAlign: "left",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 14,
              background: `linear-gradient(135deg, ${p.accent}66, ${p.accent}22)`,
              display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0, position: "relative",
            }}>{p.i}</div>
            <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{p.t}</span>
                <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 999, background: `${p.accent}33`, color: "#0a0a0a", letterSpacing: 0.2 }}>{p.meta}</span>
              </div>
              <div style={{ fontSize: 12.5, color: "var(--text-4)", marginTop: 4, lineHeight: 1.45 }}>{p.d}</div>
            </div>
            <I.ChevronRight size={18} color="var(--text-4)" style={{ position: "relative" }}/>
          </button>
        ))}
      </div>

      <div style={{ background: "var(--card)", borderRadius: 22, padding: "14px 16px", boxShadow: "var(--card-shadow)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <I.Help size={14} color="var(--text-3)"/>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", letterSpacing: 0.2 }}>Почему Нетворк закрыт?</span>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text-4)", lineHeight: 1.5 }}>
          Нам важны люди, преданные делу, а не случайный шум. Когда вход нужно заслужить, здесь остаются только те, с кем правда хочется познакомиться.
        </div>
      </div>
    </div>
  );
}

/* ShareAppSheet → live-only: the user's REAL referral circle + ?ref=<uid> invite link
   (no demo sample faces, no demo "истории/ещё" share targets). */
function ShareAppSheetLive({ dark = false }) {
  const { close } = useSheet();
  const APP_URL = (typeof bosInviteLink === "function") ? bosInviteLink(null) : "https://t.me/BalanceOS8_bot";
  const [copied, setCopied] = React.useState(false);
  const [shareUrl, setShareUrl] = React.useState(APP_URL);
  React.useEffect(() => {
    let on = true;
    if (window.bosCloud && window.bosCloud.uid) {
      (window.bosCloud.inviteCode ? window.bosCloud.inviteCode() : window.bosCloud.uid()).then((code) => { if (on && code) setShareUrl((typeof bosInviteLink === "function") ? bosInviteLink(code) : (APP_URL + "?ref=" + code)); }).catch(() => {});
    }
    return () => { on = false; };
  }, []);
  const copyLink = () => {
    try { navigator.clipboard.writeText(shareUrl); } catch (e) {}
    setCopied(true); window.setTimeout(() => setCopied(false), 1600);
    if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} }
  };
  const shareLink = () => {
    if (window.bosShare ? !window.bosShare(shareUrl, "Держим баланс вместе — BalanceOS") : true) copyLink();
    else if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} }
  };
  const C = dark
    ? { text: "#fff", sub: "rgba(255,255,255,0.5)", tile: "rgba(255,255,255,0.08)", line: "rgba(255,255,255,0.09)" }
    : { text: "#0a0a0a", sub: "rgba(0,0,0,0.5)", tile: "#f1f1f3", line: "rgba(0,0,0,0.06)" };
  const _FCOLORS = ["#f0c8a8", "#a8c0e8", "#e8b8d4", "#b8e8c8", "#d4c8e8", "#a8d4e8", "#e8d0a8"];
  const [liveFriends, setLiveFriends] = React.useState([]);
  React.useEffect(() => {
    if (!(window.bosCloud && window.bosCloud.enabled())) return;
    let on = true;
    try {
      window.bosCloud.invitedPeople().then((list) => {
        if (!on || !Array.isArray(list)) return;
        setLiveFriends(list.map((p, idx) => {
          const nm = (p && p.username) ? p.username : "Друг";
          return { name: nm, i: nm.charAt(0).toUpperCase(), c: _FCOLORS[idx % _FCOLORS.length] };
        }));
      }).catch(() => {});
    } catch (e) {}
    return () => { on = false; };
  }, []);
  const friends = liveFriends;
  // Real referral progress → the live milestone the user is ACTUALLY working toward
  // (no fake "2 из 3"; a fresh user honestly sees "0 из 3"). Same CIRCLE_MILESTONES as community.
  const _nextMile = [{ n: 3, bonus: 300 }, { n: 7, bonus: 700 }, { n: 15, bonus: 1500 }, { n: 30, bonus: 3000 }].find((m) => m.n > friends.length) || { n: 30, bonus: 3000 };
  return (
    <div style={{ padding: "2px 20px 0", color: C.text }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", margin: "0 auto 12px",
          background: "radial-gradient(circle at 37% 29%, #ffffff 0%, #dbe6f6 14%, #7aa4d0 46%, #3f5f86 72%, #243b5c 100%)",
          boxShadow: "0 8px 24px rgba(122,164,208,0.42)" }} />
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.3px" }}>Поделиться BalanceOS</div>
        <div style={{ fontSize: 14, color: C.sub, marginTop: 3 }}>+150 XP за друга — и бонусы круга до +3000 XP 🔥</div>
      </div>

      <div style={{ marginTop: 18 }}>
        <XPRewardCard amount={150} reason="когда друг начнёт пользоваться приложением" dark={dark} circleNow={friends.length} circleGoal={_nextMile.n} circleBonus={_nextMile.bonus} flat />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.tile, borderRadius: 14, padding: "11px 14px", marginTop: 14 }}>
        <span style={{ fontSize: 16 }}>🔗</span>
        <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
          <div style={{ fontSize: 11, color: C.sub, fontWeight: 600 }}>Твоя личная ссылка</div>
          <div style={{ fontSize: 13.5, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>{("" + shareUrl).replace(/^https?:\/\//, "")}</div>
        </div>
        <button onClick={copyLink} className="tap" style={{ background: copied ? "#34C759" : (dark ? "#fff" : "#0a0a0a"), color: copied ? "#fff" : (dark ? "#0a0a0a" : "#fff"), border: 0, borderRadius: 999, padding: "7px 14px", fontSize: 13, fontWeight: 600, transition: "background 0.2s", whiteSpace: "nowrap" }}>{copied ? "Скопировано ✓" : "Копировать"}</button>
      </div>

      {/* ONE clear, labelled primary action — Telegram's native "forward to a contact"
          picker with the bot invite link. Friends list removed (David: «всё равно шлётся
          через Telegram» → лишний выбор, минималистично). */}
      <button onClick={shareLink} className="tap" style={{
        width: "100%", marginTop: 18, border: 0, borderRadius: 16, padding: "15px 16px",
        background: "#229ED9", color: "#fff", fontSize: 15.5, fontWeight: 600,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
      }}>
        <I.Send size={18} /> Поделиться в Telegram
      </button>

      <button className="tap" onClick={close} style={{ width: "100%", marginTop: 22, background: dark ? "#fff" : "#0a0a0a", color: dark ? "#0a0a0a" : "#fff", border: 0, borderRadius: 999, padding: 15, fontSize: 15, fontWeight: 600 }}>Готово</button>
    </div>
  );
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
var _bosBuddyCache = (function () { try { return JSON.parse(localStorage.getItem("bos:cache:buddies") || "{}") || {}; } catch (e) { return {}; } })();
function _bosBuddyCachePersist() { try { localStorage.setItem("bos:cache:buddies", JSON.stringify(_bosBuddyCache)); } catch (e) {} }
function _bosBuddySig(ms) {
  if (!ms) return "";
  try { return ms.map(function (m) { return m.id + ":" + (m.avatar || "") + ":" + (m.name || "") + ":" + (m.value != null ? m.value : "") + ":" + Object.keys(m.days || {}).length; }).join("|"); }
  catch (e) { return "" + (ms && ms.length); }
}
function useBuddyMembersLive(code) {
  var st = React.useState(function () { return (code && _bosBuddyCache[code]) || null; });
  var members = st[0], setMembers = st[1];
  React.useEffect(function () {
    if (!code) { setMembers(null); return; }
    if (_bosBuddyCache[code]) setMembers(_bosBuddyCache[code]); // instant from cache — no flash
    if (!(window.bosCloud && window.bosCloud.enabled() && window.bosCloud.sharedHabitProgress)) return;
    var on = true;
    var load = function () {
      window.bosCloud.sharedHabitProgress(code).then(function (d) {
        if (!on || !d || !d.members) return;
        var changed = _bosBuddySig(_bosBuddyCache[code]) !== _bosBuddySig(d.members);
        _bosBuddyCache[code] = d.members;
        if (changed) { setMembers(d.members); _bosBuddyCachePersist(); }  // swap ONLY when something really changed
      }).catch(function () {});
    };
    load();
    var iv = setInterval(load, 25000);
    return function () { on = false; clearInterval(iv); };
  }, [code]);
  return members;
}

/* Circle (team) members for a personal habit linked to a circle via teamId. Cache-backed like
   useBuddyMembersLive — instant, no flash. Powers the unified FACES marker on personal cards that
   REPLACES the old grey «Командная» бейдж (David: маркёр круга = ЛИЦА, не бейдж). */
var _bosCircleCache = (function () { try { return JSON.parse(localStorage.getItem("bos:cache:circles") || "{}") || {}; } catch (e) { return {}; } })();
function _bosCircleCachePersist() { try { localStorage.setItem("bos:cache:circles", JSON.stringify(_bosCircleCache)); } catch (e) {} }
function useCircleMembersLive(teamId) {
  var st = React.useState(function () { return (teamId && _bosCircleCache[teamId]) || null; });
  var members = st[0], setMembers = st[1];
  React.useEffect(function () {
    if (!teamId) { setMembers(null); return; }
    if (_bosCircleCache[teamId]) setMembers(_bosCircleCache[teamId]); // instant from cache
    if (!(window.bosCloud && window.bosCloud.enabled() && window.bosCloud.teamMembers)) return;
    var on = true;
    var sig = function (a) { return (a || []).map(function (m) { return (m.id || "") + ":" + (m.avatar || "") + ":" + (m.name || ""); }).join("|"); };
    var load = function () {
      window.bosCloud.teamMembers(teamId).then(function (mem) {
        if (!on || !Array.isArray(mem)) return;
        var changed = sig(_bosCircleCache[teamId]) !== sig(mem);
        _bosCircleCache[teamId] = mem;
        if (changed) { setMembers(mem); _bosCircleCachePersist(); } // swap only on real change
      }).catch(function () {});
    };
    load();
    var iv = setInterval(load, 25000);
    return function () { on = false; clearInterval(iv); };
  }, [teamId]);
  return members;
}
// My uid (module-cached) so circle faces show the OTHER people you share with — solo circle → no
// others → no faces (honest «пока один», как у привычек-вместе), не серый бейдж.
var _bosMyUidCache = null;
function CircleFacesLive({ habit, size, max }) {
  size = size || 22; max = max || 5;
  var teamId = habit && habit.teamId;
  var members = useCircleMembersLive(teamId);
  var uidSt = React.useState(_bosMyUidCache);
  var myUid = uidSt[0], setMyUid = uidSt[1];
  React.useEffect(function () {
    if (myUid != null) return;
    if (window.bosCloud && window.bosCloud.enabled() && window.bosCloud.uid) {
      window.bosCloud.uid().then(function (u) { if (u) { _bosMyUidCache = u; setMyUid(u); } }).catch(function () {});
    }
  }, []);
  if (!teamId) return null;
  var others = (members || []).filter(function (m) { return !myUid || m.id !== myUid; });
  if (!others.length) return null;
  return React.createElement(PeopleStackLive, { people: others, size: size, max: max });
}

/* The ONE live avatar chip — a person's chosen avatar on a STANDARDISED soft-grey disc, so faces
   read cleanly and never blend into white cards (David: «на сероватом фоне классно, на белом
   сливаются — стандартизируй на сером»). We show ONLY what the person picked — emoji or memoji
   photo; base users (no custom avatar) get the clean grey disc. No mood/state tint at this level —
   simple, consistent, beautiful everywhere. (`name` kept for call-site compatibility.) */
function BuddyFaceLive({ avatar, name, size }) {
  size = size || 24;
  var a = "" + (avatar || "");
  var disc = { width: size, height: size, borderRadius: "50%", flexShrink: 0,
    background: "linear-gradient(150deg, #eef1f6, #dadfe7)",
    boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.07)" };
  if (/^m\d+$/.test(a)) return <div style={Object.assign({}, disc, { background: "url(./assets/people/" + a + ".png) center/cover no-repeat, linear-gradient(150deg,#eef1f6,#dadfe7)", boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.10)" })} />;
  if (a.indexOf("emoji:") === 0) return <div style={Object.assign({}, disc, { display: "grid", placeItems: "center", fontSize: Math.round(size * 0.54), lineHeight: 1 })}>{a.slice(6)}</div>;
  // No custom avatar → the person's first initial on the SAME grey disc, so it's never a blank
  // circle (David: «густой серый кружочек неприкольно — пиши первый инициал ника»). A real avatar
  // always wins above; this is only the fallback. Muted slate ink, one letter — NOT colourful.
  var initial = ("" + (name || "")).trim().charAt(0).toUpperCase();
  if (!initial) return <div style={disc} />;
  return <div style={Object.assign({}, disc, { display: "grid", placeItems: "center", color: "#5b6473", fontWeight: 600, fontSize: Math.round(size * 0.44), letterSpacing: "-0.2px", lineHeight: 1, fontFamily: "-apple-system, system-ui, sans-serif" })}>{initial}</div>;
}

function HabitInviteBannerLive({ amount = 75, habit }) {
  const ink = "#0a0a0a", inkSub = "rgba(0,0,0,0.62)";
  // Plain gold banner — orbits/memoji removed (David: «орбиты убрать, оставить просто золотые баннеры»).
  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 22, padding: "16px 17px",
      background: "linear-gradient(135deg, #FEDE34, #EF9F14)", color: ink,
      boxShadow: "0 12px 30px rgba(254,222,52,0.34)" }}>
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 13 }}>
        <span style={{ width: 46, height: 46, borderRadius: 14, background: "rgba(255,255,255,0.6)", display: "grid", placeItems: "center", flexShrink: 0 }}>
          <I.Sparkles size={23} color={ink} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 33, fontWeight: 800, letterSpacing: "-1.2px", lineHeight: 1 }}>+<CountUp value={amount} /></span>
            <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.3px" }}>XP</span>
          </div>
          <div style={{ fontSize: 12.5, color: inkSub, marginTop: 3, lineHeight: 1.35 }}>когда друг присоединится к этой привычке</div>
        </div>
      </div>
      <div style={{ position: "relative", marginTop: 13, paddingTop: 12, borderTop: "1px solid rgba(0,0,0,0.10)", fontSize: 12, color: inkSub, lineHeight: 1.4 }}>
        А когда ведёте привычку вместе — каждая отметка приносит <b style={{ color: ink }}>+15 XP</b> вместо +10.
      </div>
    </div>
  );
}

/* Welcome modal shown when you open an invite LINK and land in a shared habit / team — so the
   join is never silent (David: «человек не понимает, что его позвали»). Rendered at app root
   from app.pendingJoinWelcome (mirrors AchievementUnlock). Spring-in glass card. LIVE only. */
function JoinWelcomeLive({ info, onClose }) {
  const [open, setOpen] = React.useState(false);
  const closingRef = React.useRef(false);
  React.useEffect(() => { const t = window.setTimeout(() => setOpen(true), 10); return () => window.clearTimeout(t); }, []);
  if (!info) return null;
  const isDark = !!(typeof document !== "undefined" && document.querySelector(".bos-page.theme-dark"));
  const isTeam = info.kind === "team";
  const inviter = (info.inviterName || "").trim();
  const close = () => {
    if (closingRef.current) return; closingRef.current = true;
    setOpen(false);
    window.setTimeout(() => { try { onClose && onClose(); } catch (e) {} }, 340);
  };
  // Standardized GREY glass tile — never the habit's random colour (David: «серенькая, с эффектом
  // стекла, никакой отсебятины»). The inviter's STANDARD avatar (real photo or initial) rides the
  // corner — one «вы вдвоём на привычке» scene, not an avatar-stacked-over-a-square.
  const tileInk = isDark ? "#e8e8ea" : "#3a3a3e";
  const tileBg = isDark ? "linear-gradient(165deg,#3a3a3e,#2a2a2e)" : "linear-gradient(165deg,#f1f1f4,#e1e1e6)";
  const glyph = (typeof bosIcon === "function") ? bosIcon(info.emoji || (isTeam ? "✨" : "🌿"), 38, tileInk) : (info.emoji || "✨");

  return (
    <BottomSheet open={open} onClose={close} dark={isDark}>
      <div style={{ padding: "2px 22px 26px", textAlign: "center", color: "var(--text)" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 2 }}>
          <div style={{ position: "relative", width: 76, height: 76 }}>
            <div style={{ width: 76, height: 76, borderRadius: 21, background: BOS_TILE_SHEEN + ", " + tileBg, boxShadow: (typeof bosTileGlass === "function" ? bosTileGlass(isDark) : "0 6px 16px rgba(0,0,0,0.10)"), display: "grid", placeItems: "center", fontSize: 37 }}>{glyph}</div>
            {!isTeam && (
              <div style={{ position: "absolute", right: -8, bottom: -6, borderRadius: "50%", boxShadow: "0 0 0 3px var(--card, #fff)" }}>
                <BuddyFaceLive avatar={info.inviterAvatar || "default"} name={inviter} size={34} />
              </div>
            )}
          </div>
        </div>
        <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1.4, fontWeight: 700, marginTop: 14 }}>{isTeam ? "Команда" : "Совместная привычка"}</div>
        <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: "-0.5px", color: "var(--text)", marginTop: 3 }}>{info.name}</div>
        <div style={{ fontSize: 13.5, color: "var(--text-3)", marginTop: 8, lineHeight: 1.5, padding: "0 6px", textWrap: "balance" }}>
          {isTeam
            ? ((inviter ? inviter + " зовёт в команду" : "Тебя позвали в команду") + " — ведите цели вместе, виден прогресс каждого.")
            : ((inviter ? inviter + " зовёт вести вместе" : "Тебя позвали вести вместе") + " — будете видеть отметки друг друга и держать ритм.")}
        </div>
        {!isTeam && (
          <div style={{ display: "flex", alignItems: "center", gap: 13, background: isDark ? "rgba(255,255,255,0.06)" : "#f4f4f6", borderRadius: 17, padding: "13px 15px", marginTop: 18, textAlign: "left" }}>
            <span style={{ width: 42, height: 42, borderRadius: 13, background: "linear-gradient(135deg,#FEDE34,#EF9F14)", display: "grid", placeItems: "center", flexShrink: 0, boxShadow: "0 5px 13px rgba(239,159,20,0.34), inset 0 1px 0.5px rgba(255,255,255,0.6)" }}>
              <I.Bolt size={22} color="#fff" filled />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.2px" }}>+15 XP за каждую совместную отметку</div>
              <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2 }}>вместо +10, когда ведёшь один</div>
            </div>
          </div>
        )}
        <button onClick={close} className="bos-btn" style={{ marginTop: 20 }}>{isTeam ? "Отлично!" : "Веду вместе!"}</button>
      </div>
    </BottomSheet>
  );
}

/* Achievement celebration — the gold «достижение открыто» moment as our STANDARD iOS sheet
   (David: «достижения делаешь не в нашем стиле который поп-ап — лучше в iOS-шторку»). Was a
   centered popup (demo AchievementUnlock); now slides up over a dimmed backdrop with a grabber,
   swipe-down to dismiss — the SAME BottomSheet idiom as JoinWelcomeLive. Rendered at app root
   from app.pendingAch. LIVE. */
function AchievementSheetLive({ ach, onClose }) {
  const [open, setOpen] = React.useState(false);
  const closingRef = React.useRef(false);
  React.useEffect(() => { const t = window.setTimeout(() => setOpen(true), 10); return () => window.clearTimeout(t); }, []);
  if (!ach) return null;
  const isDark = !!(typeof document !== "undefined" && document.querySelector(".bos-page.theme-dark"));
  const accent = "#FEDE34";
  const close = () => {
    if (closingRef.current) return; closingRef.current = true;
    setOpen(false);
    window.setTimeout(() => { try { onClose && onClose(); } catch (e) {} }, 340);
  };
  return (
    <BottomSheet open={open} onClose={close} dark={isDark}>
      {/* ЗОЛОТОЙ квадрат-тайл БЕЗ свечения (David: «сам квадратик золотым, свечения не нужно»);
          текст с воздухом — кикер → крупный титул → описание (узкая колонка, balance) → XP → кнопка. */}
      <div style={{ padding: "8px 24px 26px", textAlign: "center", color: "var(--text)" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ width: 90, height: 90, borderRadius: 24, background: "linear-gradient(158deg, #FFDC4A 0%, #F4A81E 100%)", display: "grid", placeItems: "center", fontSize: 46, boxShadow: "inset 0 2px 1px rgba(255,255,255,0.65), inset 0 0 0 0.7px rgba(180,120,0,0.28), 0 8px 18px rgba(0,0,0,0.13)", animation: "achEmblem 0.55s cubic-bezier(0.34,1.56,0.64,1) 0.08s both" }}>{bosIcon(ach.i, 46, null)}</div>
        </div>
        <div style={{ fontSize: 11.5, color: "#C98A00", textTransform: "uppercase", letterSpacing: 1.8, fontWeight: 800, marginTop: 20 }}>Достижение открыто</div>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.6px", color: "var(--text)", marginTop: 6, lineHeight: 1.1 }}>{ach.t}</div>
        {ach.d && <div style={{ fontSize: 14.5, color: "var(--text-3)", lineHeight: 1.5, maxWidth: 270, margin: "10px auto 0", textWrap: "balance" }}>{ach.d}</div>}
        {ach.xp ? <div style={{ display: "inline-block", marginTop: 20, background: "linear-gradient(180deg,#FEDE34,#EF9F14)", color: "#4a3800", fontWeight: 800, fontSize: 14.5, borderRadius: 999, padding: "8px 18px" }}>+{ach.xp} XP</div> : null}
        <button onClick={close} className="bos-btn" style={{ marginTop: 22 }}>Класс!</button>
      </div>
    </BottomSheet>
  );
}

/* Деталь достижения из СПИСКА (тап по медали) — тот же стиль, что у шторки-открытия: ЗОЛОТОЙ
   квадрат-тайл (или серый-замок, если ещё закрыто), БЕЗ свечения, аккуратный текст. Рендерится
   через openSheet (шторка-чрома снаружи). Заменяет прежний текстовый InfoSheet. LIVE. */
function AchievementDetailSheetLive({ ach, dark }) {
  const sheet = (typeof useSheet === "function") ? useSheet() : null;
  const close = () => { try { if (sheet && sheet.close) sheet.close(); } catch (e) {} };
  if (!ach) return null;
  const earned = !!ach.earned;
  return (
    <div style={{ padding: "8px 24px 22px", textAlign: "center", color: "var(--text)" }}>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ width: 84, height: 84, borderRadius: 22, position: "relative", display: "grid", placeItems: "center", fontSize: 42,
          background: earned ? "linear-gradient(158deg, #FFDC4A 0%, #F4A81E 100%)" : "var(--card-2)",
          boxShadow: earned ? "inset 0 2px 1px rgba(255,255,255,0.65), inset 0 0 0 0.7px rgba(180,120,0,0.28), 0 8px 18px rgba(0,0,0,0.13)" : "inset 0 0 0 1px var(--line)",
          filter: earned ? "none" : "grayscale(1)", opacity: earned ? 1 : 0.55 }}>
          {bosIcon(ach.i, 42, null)}
          {!earned && <span style={{ position: "absolute", right: -3, bottom: -3, width: 24, height: 24, borderRadius: "50%", background: "var(--card)", boxShadow: "0 2px 6px rgba(0,0,0,0.15)", display: "grid", placeItems: "center", fontSize: 12 }}>🔒</span>}
        </div>
      </div>
      <div style={{ fontSize: 11.5, color: earned ? "#C98A00" : "var(--text-4)", textTransform: "uppercase", letterSpacing: 1.8, fontWeight: 800, marginTop: 18 }}>{earned ? "Достижение открыто" : "Ещё закрыто"}</div>
      <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px", marginTop: 6, lineHeight: 1.1, color: "var(--text)" }}>{ach.t}</div>
      {ach.d && <div style={{ fontSize: 14.5, color: "var(--text-3)", lineHeight: 1.5, maxWidth: 280, margin: "10px auto 0", textWrap: "balance" }}>{ach.d}</div>}
      {!earned && ach.how && <div style={{ fontSize: 13.5, color: "var(--text-4)", lineHeight: 1.45, maxWidth: 280, margin: "9px auto 0", textWrap: "balance" }}>Как открыть: {ach.how}</div>}
      {ach.xp ? <div style={{ display: "inline-block", marginTop: 18, background: earned ? "linear-gradient(180deg,#FEDE34,#EF9F14)" : "var(--card-2)", color: earned ? "#4a3800" : "var(--text-3)", fontWeight: 800, fontSize: 14, borderRadius: 999, padding: "7px 16px" }}>+{ach.xp} XP</div> : null}
      <button onClick={close} className="bos-btn" style={{ marginTop: 20 }}>Готово</button>
    </div>
  );
}

/* Stage-2 dedup (David): нажал «Вести у себя», а такая привычка уже есть → спросить — ПРИВЯЗАТЬ
   существующую (без дубля, серия/время сохранятся) или завести отдельную для команды. LIVE. */
function TeamAdoptChoiceLive({ dupeName, onLink, onCreate }) {
  const { close } = useSheet();
  const go = (fn) => { try { fn && fn(); } catch (e) {} if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (_) {} } close(); };
  return (
    <div style={{ padding: "2px 22px 14px", color: "var(--text)", textAlign: "center" }}>
      <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.3px" }}>У тебя уже есть такая</div>
      <div style={{ fontSize: 13.5, color: "var(--text-3)", marginTop: 7, lineHeight: 1.5, textWrap: "balance" }}>«{dupeName}» уже в твоих привычках. Привязать её к команде — серия и твоё время сохранятся. Или завести отдельную для команды.</div>
      <button className="bos-btn" style={{ marginTop: 18 }} onClick={() => go(onLink)}>Привязать «{dupeName}»</button>
      <button className="tap" onClick={() => go(onCreate)} style={{ width: "100%", marginTop: 6, background: "transparent", border: 0, color: "var(--text-3)", padding: 13, fontSize: 14.5, fontWeight: 600, cursor: "pointer" }}>Создать новую для команды</button>
    </div>
  );
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
function PeopleStackLive({ people = [], size = 24, max = 5 }) {
  const list = (people || []).filter(Boolean);
  if (!list.length) return null;
  const shown = list.slice(0, max), extra = list.length - shown.length;
  const ov = Math.round(size * 0.32); // overlap proportional to size
  return (
    <div style={{ display: "flex", alignItems: "center" }} aria-hidden>
      {shown.map((m, i) => (
        <span key={m.id != null ? m.id : i} style={{ marginLeft: i ? -ov : 0, borderRadius: "50%", boxShadow: "0 0 0 2px var(--card, #fff)", display: "block" }}>
          <BuddyFaceLive avatar={m.avatar} name={m.name} size={size} />
        </span>
      ))}
      {extra > 0 && <span style={{ marginLeft: -ov, width: size, height: size, borderRadius: "50%", background: "rgba(0,0,0,0.58)", color: "#fff", fontSize: Math.round(size * 0.4), fontWeight: 700, letterSpacing: "-0.5px", display: "grid", placeItems: "center", boxShadow: "0 0 0 2px var(--card, #fff)" }}>+{extra}</span>}
    </div>
  );
}

// ── ЦЕЛЬ, НАПОЛНЯЕМАЯ ПРИВЫЧКАМИ ────────────────────────────────────────────
// Единый движок прогресса цели (David: «цель раскладывается на привычки, ведёшь их → растёт цель»,
// как в командной цели). Если к цели привязаны привычки (goal.habitIds) — кольцо НАПОЛНЯЕТСЯ их
// отметками (сумма = общий счёт, зеркало collective-режима команды), считается ЛОКАЛЬНО из h.log →
// работает офлайн. Нет привязки → падаем на ручной goal.current (старые «голые» цели живут как раньше).
function bosGoalMarks(h) { try { return h && h.log ? Object.keys(h.log).length : 0; } catch (e) { return 0; } }
function bosGoalProgress(goal, habits) {
  var target = (goal && goal.target) || 0;
  var ids = (goal && goal.habitIds) || [];
  var linked = ids.length ? (habits || []).filter(function (h) { return ids.indexOf(h.id) >= 0; }) : [];
  var fromHabits = linked.length > 0;
  var raw = fromHabits ? linked.reduce(function (a, h) { return a + bosGoalMarks(h); }, 0) : ((goal && goal.current) || 0);
  var current = target > 0 ? Math.min(raw, target) : raw; // кольцо не переполняем
  var pct = target > 0 ? Math.min(1, current / target) : 0;
  return { current: current, target: target, pct: pct, done: target > 0 && current >= target, fromHabits: fromHabits, linked: linked };
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
  var vis = opts.vis || "private", type = opts.type || "collective", stake = Math.max(0, opts.stake || 0);
  var linked = (app.habits || []).filter(function (h) { return (goalLike.habitIds || []).indexOf(h.id) >= 0; });
  var teamObj = {
    name: goalLike.name || "Цель", emblem: goalLike.emoji || "🎯", accent: goalLike.color || BOS_GREY, vis: vis,
    goal: (goalLike.target || 0) + " " + (goalLike.unit || ""), type: type,
    target: goalLike.target || 0, current: 0, unit: goalLike.unit || "", stake: stake,
    date: goalLike.deadline || "Этот месяц", progress: 0, members: [],
    habits: linked.map(function (h, i) { return { name: h.name, emoji: h.emoji, isMain: i === 0 }; }),
  };
  if (goalLike.challenge) teamObj.challenge = goalLike.challenge;
  var nt = app.addTeam(teamObj);
  // Личные привычки цели теперь принадлежат кругу: teamId связывает, goalOnly снимаем (пусть видно),
  // goalId чистим (цели больше нет). teamHabitId долетит из облака (миррор отметок в командный лог).
  linked.forEach(function (h) { app.updateHabit(h.id, { teamId: nt._id, goalId: null, goalOnly: false }); });
  if (goalLike.id != null && app.removeGoal) app.removeGoal(goalLike.id); // цель → круг (не остаётся дублем)
  if (opts.navigate) opts.navigate("team-detail", { team: nt, from: opts.from || "habits" });
  (async function () {
    try {
      if (window.bosCloud && window.bosCloud.enabled()) {
        var row = await window.bosCloud.createTeam({ name: nt.name, emblem: teamObj.emblem, vis: vis, goalKind: nt.goal, goalTarget: nt.target, goal: { type: type, target: nt.target, unit: nt.unit, title: nt.name, stake: stake } });
        if (row && row.id) {
          if (app.updateTeam) app.updateTeam(nt._id, { cloudId: row.id });
          for (var i = 0; i < linked.length; i++) {
            var th = await window.bosCloud.addTeamHabit(row.id, { name: linked[i].name, emoji: linked[i].emoji, isMain: i === 0, goalPerDay: linked[i].goalPerDay });
            if (th && th.id && app.updateHabit) app.updateHabit(linked[i].id, { teamId: row.id, teamHabitId: th.id });
          }
          if (opts.onShare) opts.onShare(Object.assign({}, nt, { cloudId: row.id }));
          return;
        }
      }
    } catch (e) {}
    // офлайн/превью → круг живёт локально, шторка приглашения всё равно. setTimeout — чтобы открыться
    // ПОСЛЕ возможного close() подтверждающей шторки (иначе синхронный onShare закрылся бы сразу).
    if (opts.onShare) setTimeout(function () { opts.onShare(nt); }, 0);
  })();
  return nt;
}

// МИНИ-ОРБИТА для карточки цели/круга (David: «превью — вокруг чего цель, а не просто смайлик;
// орбиты наполняются привычками и людьми»). Центр = значок цели, вокруг — её привычки (эмодзи) на
// внутреннем кольце и люди (лица) на внешнем. МЕДЛЕННО КРУТИТСЯ (David передумал «пусть статично» →
// «не крутятся»): CSS bosSpin/bosSpinR, кольца в разные стороны, диски counter-rotate = прямые.
// Дёшево (только transform, GPU). habits=[{emoji,color}], people=[{avatar,name}].
function GoalOrbitMini({ centerEmoji, centerColor, habits = [], people = [], size = 128, dark = false, fade = false }) {
  var C = size / 2;
  var cR = Math.round(size * 0.19);            // центр-диск (радиус)
  var r1 = size * 0.315, r2 = size * 0.455;    // радиусы колец (привычки / люди)
  var hbAll = (habits || []).filter(Boolean), ppAll = (people || []).filter(Boolean);
  var ringLine = dark ? "rgba(255,255,255,0.13)" : "rgba(10,10,10,0.09)";
  var accent = centerColor || (dark ? "#fff" : "#0a0a0a");
  var ring = function (R) { return <span aria-hidden style={{ position: "absolute", left: C - R, top: C - R, width: R * 2, height: R * 2, borderRadius: "50%", border: "1px solid " + ringLine }} />; };
  var place = function (items, R, sz, off, render, spin) {
    return items.map(function (it, i) {
      var ang = (i / Math.max(1, items.length)) * Math.PI * 2 - Math.PI / 2 + off;
      var x = C + Math.cos(ang) * R, y = C + Math.sin(ang) * R;
      return <span key={i} style={{ position: "absolute", left: Math.round(x - sz / 2), top: Math.round(y - sz / 2), width: sz, height: sz, animation: spin || undefined }}>{render(it)}</span>;
    });
  };
  var hSz = Math.max(16, Math.round(size * 0.16));
  var pSz = Math.max(16, Math.round(size * 0.155));
  // МУЛЬТИ-КОЛЬЦА: колец СТОЛЬКО, сколько нужно реальному числу элементов (David: «количество колец
  // реальное; 10 привычек → 3-4 кольца, не 2»). Привычки заполняют кольца от центра наружу, люди — на
  // кольцах дальше. Каждое кольцо вмещает сколько влезает по окружности; ВНЕШНИЕ кольца выходят за бокс —
  // их просто обрежет карточка (overflow:hidden). Размер/шаг колец НЕ меняем (David: «размер устраивает»).
  var ringStep = size * 0.14, r0 = size * 0.315;
  var buildRings = function (items, startK, dSz) {
    var out = [], k = startK, idx = 0;
    while (idx < items.length && k < 9) {
      var R = r0 + k * ringStep;
      var cap = Math.max(1, Math.floor((2 * Math.PI * R) / (dSz * 3.0))); // разреженно (David: 4→1 кольцо, 10→3-4 кольца)
      out.push({ R: R, k: k, items: items.slice(idx, idx + cap) });
      idx += cap; k++;
    }
    return { rings: out, nextK: k };
  };
  var hRings = buildRings(hbAll, 0, hSz);
  var pRings = buildRings(ppAll, hRings.nextK, pSz);
  // РАЗМЕР эмодзи задаём ЯВНО через fontSize на диске: bosIcon для эмодзи (не sf-символов) игнорит
  // size и возвращает голую строку → иначе эмодзи наследует крупный шрифт карточки и ВЫЛЕЗАЕТ за
  // кружок (баг David). Для sf-символов bosIcon отдаёт SVG нужного размера — fontSize им не мешает.
  var hIcon = Math.round(hSz * 0.52), cIcon = Math.round(cR * 0.96); // David: иконки чуть меньше кружков — больше «воздуха» вокруг
  // ЕДИНЫЙ серый глянцевый диск — тот же язык, что у OrbitField на «Я»/настройках (#eef1f6→#dadfe7 +
  // BOS_TILE_SHEEN). David: «кружочки должны быть стандартизированы как на странице настроек», без
  // разнобоя (то цветной-прозрачный, то белый). И привычки, и центр = один диск.
  var sheen = (typeof BOS_TILE_SHEEN !== "undefined" ? BOS_TILE_SHEEN + ", " : "");
  var discBg = sheen + (dark ? "linear-gradient(160deg, #464c58, #30353f)" : "linear-gradient(160deg, #eef1f6, #dadfe7)");
  var discShadow = (typeof bosTileGlass === "function" ? bosTileGlass(dark) : "0 1px 3px rgba(0,0,0,0.12)");
  // Центр = ПОДЛОЖКА ИКОНКИ ЦЕЛИ → красится в НАСЫЩЕННЫЙ тон цвета цели (David: «цвет должен влиять на
  // подложку иконки цели»). Реальный цвет → тон + белый глиф; нейтральный → тот же серый диск. Привычки/
  // люди на кольцах остаются серыми (они не цель).
  var cReal = typeof centerColor === "string" && centerColor[0] === "#" && centerColor.length === 7 && centerColor.toLowerCase() !== "#0a0a0a" && centerColor !== BOS_GREY;
  // ТЕМА-ЗАВИСИМАЯ тонировка (David: «цвета с пикера в тёмной должны чуть отличаться»):
  // светлая — осветляем к белому (пастель), тёмная — углубляем к тёмной подложке
  // (насыщенный глубокий тон, без «засветки»).
  var centerBg = cReal
    ? (sheen + (dark
        ? ((typeof bosMixHex === "function") ? bosMixHex(centerColor, "#101014", 0.22) : centerColor)
        : ((typeof bosLightenHex === "function") ? bosLightenHex(centerColor, 0.25) : centerColor)))
    : discBg;
  var centerInk = cReal ? "#fff" : null;
  // Цвет цели красит и КРУЖОЧКИ ПРИВЫЧЕК на орбитах (David: «пикер применяет цвет во всём
  // блоке»). Светлая: светлый тон; тёмная: тёмный тон того же оттенка. Лица людей не трогаем.
  var hDiscBg = cReal
    ? (sheen + (dark
        ? ((typeof bosMixHex === "function") ? bosMixHex(centerColor, "#17181d", 0.62) : centerColor)
        : ((typeof bosLightenHex === "function") ? bosLightenHex(centerColor, 0.62) : centerColor)))
    : discBg;
  // ОРБИТА КРУТИТСЯ: соседние кольца — в РАЗНЫЕ стороны, внешние медленнее (спокойно). Диски
  // counter-rotate на ту же длительность → эмодзи/лица стоят прямо. bosSpin/bosSpinR — keyframes
  // (mobile.css). БЕЗ radial-маски: лишнее просто обрезается карточкой (David: «просто обрезалось»).
  var renderRing = function (R, k, items, dSz, iconSz, isPeople) {
    // Темп «галактики» замедлен ~на 30% (David: «слишком быстро крутится»).
    var cw = (k % 2 === 0), dir = cw ? "bosSpin" : "bosSpinR", rev = cw ? "bosSpinR" : "bosSpin", dur = (44 + k * 9) + "s";
    return (
      <React.Fragment key={(isPeople ? "p" : "h") + k}>
        {ring(R)}
        <div style={{ position: "absolute", inset: 0, animation: dir + " " + dur + " linear infinite", willChange: "transform" }}>
          {place(items, R, dSz, k * 0.35, function (it) {
            return isPeople
              ? <span style={{ display: "block", borderRadius: "50%" }}>{typeof BuddyFaceLive === "function" ? <BuddyFaceLive avatar={it.avatar} name={it.name} size={dSz} /> : null}</span>
              : <span style={{ width: "100%", height: "100%", borderRadius: "50%", background: hDiscBg, boxShadow: discShadow, display: "grid", placeItems: "center", fontSize: iconSz, lineHeight: 1 }}>{typeof bosIcon === "function" ? bosIcon(it.emoji, iconSz, null) : (it.emoji || "✨")}</span>;
          }, rev + " " + dur + " linear infinite")}
        </div>
      </React.Fragment>
    );
  };
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }} aria-hidden>
      {hRings.rings.map(function (rg) { return renderRing(rg.R, rg.k, rg.items, hSz, hIcon, false); })}
      {pRings.rings.map(function (rg) { return renderRing(rg.R, rg.k, rg.items, pSz, hIcon, true); })}
      {/* центр = значок цели, СТАТИЧНЫЙ по центру */}
      <span style={{ position: "absolute", left: C - cR, top: C - cR, width: cR * 2, height: cR * 2, borderRadius: "50%", background: centerBg, boxShadow: discShadow, display: "grid", placeItems: "center", fontSize: cIcon, lineHeight: 1 }}>{typeof bosIcon === "function" ? bosIcon(centerEmoji || "🎯", cIcon, centerInk) : (centerEmoji || "🎯")}</span>
    </div>
  );
}

// Shared-habit buddies for the habit CARDS — real cloud members (no legacy h.friends letter-avatars,
// those were fake seed personas). Delegates to PeopleStackLive so cards + teams share one logic.
function HabitBuddyAvatarsLive({ habit, size = 22, max = 5 }) {
  const code = habit && habit.shareCode;
  const members = useBuddyMembersLive(code); // cache-backed → instant, no flash on re-entry
  if (!code) return null;
  const others = (members || []).filter((m) => !m.me);
  if (!others.length) return null;
  return <PeopleStackLive people={others} size={size} max={max} />;
}

function ShareHabitSheetLive({ habit, dark = false }) {
  const { close } = useSheet();
  const app = (typeof useApp === "function") ? useApp() : null;
  const APP_URL = (typeof bosInviteLink === "function") ? bosInviteLink(null) : "https://t.me/BalanceOS8_bot";
  const [shareUrl, setShareUrl] = React.useState(APP_URL);
  // Build the invite link. For a SAVED habit on the live cloud → a SHARED-HABIT link
  // (hb_<code>__<ref>): the friend joins the SAME habit and you see each other's calendar.
  // The code is created once and remembered on the habit; the link still carries your ref
  // so the friend also lands in your orbit. Otherwise → the plain app-referral link.
  React.useEffect(() => {
    let on = true;
    (async () => {
      let ref = null;
      try { ref = (window.bosCloud && window.bosCloud.inviteCode) ? await window.bosCloud.inviteCode() : null; } catch (e) {}
      if (habit && habit.id && window.bosCloud && window.bosCloud.enabled() && typeof bosSharedHabitLink === "function" && window.bosCloud.createSharedHabit) {
        let code = habit.shareCode;
        if (!code && typeof bosGenShareCode === "function") code = bosGenShareCode();
        if (code) {
          try { await window.bosCloud.createSharedHabit({ code: code, name: habit.name, emoji: habit.emoji, color: habit.color }); } catch (e) {}
          try { if (!habit.shareCode && app && app.updateHabit) app.updateHabit(habit.id, { shareCode: code }); } catch (e) {}
          if (on) { setShareUrl(bosSharedHabitLink(code, ref)); return; }
        }
      }
      if (on) setShareUrl((typeof bosInviteLink === "function") ? bosInviteLink(ref) : APP_URL);
    })();
    return () => { on = false; };
  }, []);
  const shareLink = () => {
    if (window.bosShare) window.bosShare(shareUrl, "Делаем привычку «" + (habit?.name || "") + "» вместе в BalanceOS");
    else { try { navigator.clipboard.writeText(shareUrl); } catch (e) {} }
    if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} }
  };
  const C = dark
    ? { text: "#fff", sub: "rgba(255,255,255,0.5)", tile: "rgba(255,255,255,0.08)", line: "rgba(255,255,255,0.09)", ring: "#1c1c1e" }
    : { text: "#0a0a0a", sub: "rgba(0,0,0,0.5)", tile: "#f1f1f3", line: "rgba(0,0,0,0.06)", ring: "#fff" };
  return (
    <div style={{ padding: "2px 20px 0", color: C.text }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: C.tile, display: "grid", placeItems: "center", fontSize: 30, margin: "0 auto 10px" }}>{bosIcon(habit?.emoji || "✨", 30, habit?.color)}</div>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.3px" }}>Позови друга</div>
        <div style={{ fontSize: 14, color: C.sub, marginTop: 3, lineHeight: 1.4 }}>«{habit?.name || "Привычка"}» вместе — больше XP. Отправь ссылку, и друг присоединится.</div>
      </div>

      <div style={{ marginTop: 16 }}>
        <HabitInviteBannerLive amount={75} habit={habit} />
      </div>

      <button onClick={shareLink} className="tap" style={{
        width: "100%", marginTop: 20, border: 0, borderRadius: 999, padding: 15,
        background: "#229ED9", color: "#fff", fontSize: 15.5, fontWeight: 600,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
      }}>
        <I.Send size={18} /> Поделиться в Telegram
      </button>

      <button className="tap" onClick={close} style={{ width: "100%", marginTop: 22, background: dark ? "#fff" : "#0a0a0a", color: dark ? "#0a0a0a" : "#fff", border: 0, borderRadius: 999, padding: 15, fontSize: 15, fontWeight: 600 }}>Готово</button>
    </div>
  );
}

/* Shared-habit «Вместе» card — the multiplayer view for a habit buddy. Each member (you +
   friend) with their REAL avatar (BosAvatar), today's ✓, and a Пн→Вс strip of their marked
   days in the habit's colour — you literally see each other's progress on the calendar
   (David: «видеть прогресс друг друга на календарике»). Reads the cloud shared logs; quietly
   waits while the friend hasn't joined. Rendered only when the habit carries a shareCode. */
function SharedBuddiesLive({ habit, isDark, members: membersProp }) {
  const code = habit && habit.shareCode;
  const { open: openSheet } = (typeof useSheet === "function") ? useSheet() : { open: () => {} };
  // Cache-backed (no flash); when the parent already provides members, skip the fetch entirely.
  const fetched = useBuddyMembersLive(membersProp ? null : code);
  const accent = (typeof bosHabitColor === "function") ? bosHabitColor(habit) : (habit.color || "#0a0a0a");
  const today = (typeof bosTodayKey === "function") ? bosTodayKey() : "";
  const keys = (typeof bosWeekKeys === "function") ? bosWeekKeys() : [];
  const members = membersProp || fetched || [];
  const emptyCell = (typeof bosCellEmpty === "function") ? bosCellEmpty(accent, isDark) : (isDark ? "rgba(255,255,255,0.13)" : "rgba(0,0,0,0.08)");
  const card = isDark ? { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" } : { background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" };
  // Owner-only swipe-remove (David: «свайп влево → убрать человека из привычки»). Optimistic: hide
  // at once + prune the shared cache; if the server (RLS) refuses — you're not the owner, or the SQL
  // patch isn't applied yet — removeSharedHabitMember returns false (0 rows) and we restore the row.
  const iAmOwner = members.some(function (m) { return m.me && m.isOwner; });
  const [removed, setRemoved] = React.useState({});
  const removeMember = (m) => {
    if (!code || !m || m.me || removed[m.id]) return;
    setRemoved(function (r) { var n = Object.assign({}, r); n[m.id] = true; return n; });
    try { if (_bosBuddyCache[code]) _bosBuddyCache[code] = _bosBuddyCache[code].filter(function (x) { return x.id !== m.id; }); } catch (e) {}
    if (window.tgHaptic) { try { window.tgHaptic("warning"); } catch (e) {} }
    var cl = window.bosCloud;
    if (cl && cl.removeSharedHabitMember) {
      cl.removeSharedHabitMember(code, m.id).then(function (ok) {
        if (!ok) setRemoved(function (r) { var n = Object.assign({}, r); delete n[m.id]; return n; });
      }).catch(function () { setRemoved(function (r) { var n = Object.assign({}, r); delete n[m.id]; return n; }); });
    }
  };
  const visible = members.filter(function (m) { return !removed[m.id]; });
  const hasBuddies = visible.length >= 2;
  const invite = () => { try { openSheet(<ShareHabitSheetLive habit={habit} dark={isDark} />); } catch (e) {} };
  return (
    <div style={{ ...card, borderRadius: 22, padding: 14, marginTop: 12 }}>
      {hasBuddies ? (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.2px", color: "var(--text-2)", marginBottom: 10 }}>Вместе · {visible.length}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {visible.map((m) => {
              const doneToday = !!m.days[today];
              // Each person sits on a SUBTLE chip (David: «капельку выделять людей»), distinct from the
              // grey week-squares; the OWNER can swipe a buddy (never yourself) → a SMALLER «Убрать»
              // circle with breathing room, and the slid corner matches the chip radius (16).
              // OPAQUE chip — so it composites IDENTICALLY for everyone. A translucent chip
              // looked lighter on the white card («Ты») but darker inside the owner's SwipeRow
              // (its reveal-track is grey #f1f1f1) → David: «я светло-серый, другой почему-то
              // серее; пусть все одним цветом». One solid grey fixes the mismatch.
              const chipBg = isDark ? "#202022" : "#F4F4F6";
              const rowInner = (
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 12px" }}>
                  <BuddyFaceLive avatar={m.avatar} name={m.name} size={38} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 14.5, fontWeight: 600, color: "var(--text)" }}>
                      {m.me ? "Ты" : m.name}
                      {doneToday && <span style={{ fontSize: 11, fontWeight: 700, color: accent }}>✓ сегодня</span>}
                    </div>
                    <div style={{ display: "flex", gap: 5, marginTop: 6 }}>
                      {keys.map((k, j) => (
                        <span key={j} style={{ width: 16, height: 16, borderRadius: "50%", background: m.days[k] ? bosCellFill(accent, 1) : emptyCell, boxShadow: m.days[k] ? bosCellGlass(isDark) : "none" }} />
                      ))}
                    </div>
                  </div>
                </div>
              );
              return (iAmOwner && !m.me)
                ? (
                  <div key={m.id} style={{ borderRadius: 16, overflow: "hidden" }}>
                    <SwipeRow rowBg={chipBg} dark={isDark} actionWidth={52} actionSize={30}
                      actions={[{ key: "rm", tone: "delete", label: "Убрать", icon: I.X, onAction: () => bosConfirmDelete(openSheet, { title: "Убрать " + (m.name || "человека") + "?", message: "Вы перестанете вести эту привычку вместе — историю друг друга больше не увидите.", confirmLabel: "Убрать", onConfirm: () => removeMember(m) }) }]}>
                      {rowInner}
                    </SwipeRow>
                  </div>
                )
                : <div key={m.id} style={{ borderRadius: 16, background: chipBg }}>{rowInner}</div>;
            })}
          </div>
          {/* Always offer to invite MORE — even with buddies (David: «хочу звать ещё, даже если уже поделился»). */}
          <button onClick={invite} className="tap" data-haptic="selection" style={{ width: "100%", marginTop: 14, paddingTop: 12, background: "transparent", border: 0, borderTop: "1px solid var(--line)", borderRadius: 0, display: "flex", alignItems: "center", gap: 10, cursor: "pointer", color: "var(--text-2)" }}>
            <span style={{ width: 28, height: 28, borderRadius: "50%", background: accent + "1f", display: "grid", placeItems: "center", flexShrink: 0 }}><I.Plus size={15} color={accent} strokeWidth={2.5} /></span>
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>Позвать ещё</span>
            <I.ChevronRight size={16} color="var(--text-4)" style={{ marginLeft: "auto" }} />
          </button>
        </>
      ) : (
        // No buddy yet → the invite IS this block (tappable), not a separate bottom button (David:
        // «нижняя кнопка не нужна — кликаю по блоку с цепочкой; и про XP расскажи»).
        <button onClick={invite} className="tap" data-haptic="selection" style={{ width: "100%", textAlign: "left", background: "transparent", border: 0, padding: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, color: "var(--text)" }}>
          <span style={{ width: 42, height: 42, borderRadius: 14, background: accent + "1f", display: "grid", placeItems: "center", fontSize: 20, flexShrink: 0 }}>🔗</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text)" }}>Веди привычку вместе</div>
            <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 2, lineHeight: 1.4 }}>Позови друга: <b style={{ color: "var(--text-2)" }}>+75 XP</b>, и каждая отметка вместе — <b style={{ color: "var(--text-2)" }}>+15 XP</b> вместо +10.</div>
          </div>
          <I.ChevronRight size={18} color="var(--text-4)" />
        </button>
      )}
    </div>
  );
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
function StatePromptLive({ app, isDark }) {
  const moods = (typeof MOOD_OPTIONS !== "undefined") ? MOOD_OPTIONS : [];
  const pick = (i) => {
    if (!app) return;
    const dayKey = (typeof bosTodayKey === "function") ? bosTodayKey() : new Date().toISOString().slice(0, 10);
    app.setMood && app.setMood(moods[i]);
    app.setDayMoods && app.setDayMoods({ ...(app.dayMoods || {}), [dayKey]: i });
    if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} }
  };
  const bg = isDark ? "linear-gradient(160deg, #1a1a1d 0%, #0d0d10 100%)" : "#ffffff";
  const titleColor = isDark ? "#fff" : "var(--text)";
  const subMuted = isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.5)";

  return (
    <div style={{ width: "100%", background: bg, padding: "15px 16px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontFamily: "var(--bos-title-font)", fontSize: 18, fontWeight: 600, letterSpacing: "-0.4px", color: titleColor }}>Как ты сейчас?</div>
        <span style={{ fontSize: 10, fontWeight: 700, color: isDark ? "#9fd5a8" : "#3f7a46", background: "rgba(90,168,90,0.16)", borderRadius: 999, padding: "2px 8px", flexShrink: 0 }}>+5 XP</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 6, marginTop: 12 }}>
        {moods.map((mm, i) => (
          <button key={i} className="tap" aria-label={mm.t} onClick={() => pick(i)}
            style={{ width: 46, height: 46, flexShrink: 0, border: 0, borderRadius: "50%", padding: 0, cursor: "pointer",
              background: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.55), rgba(255,255,255,0) 60%), " + (mm.c || "#5BC57E"),
              boxShadow: "0 3px 8px " + (mm.c || "#5BC57E") + "44", display: "grid", placeItems: "center", fontSize: 23, lineHeight: 1 }}>
            <span style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.2))" }}>{mm.i}</span>
          </button>
        ))}
      </div>
      <div style={{ fontSize: 11.5, color: subMuted, marginTop: 10, textAlign: "center" }}>Нажми на своё настроение</div>
    </div>
  );
}

// Daily state CHECK-IN v2 — the onboarding «крутилка» reborn as a CONTAINED iOS slider (David:
// «тонкий блок, бегунок ездит ВНУТРИ желобка, лицо-человечек внутри орба меняется; старт ВСЕГДА по
// центру = нейтрально, слева негатив → справа позитив»). The capsule track captures its OWN pointer
// (stopPropagation + setPointerCapture) so the horizontal drag never fights the card's SwipeRow —
// the earlier free-scrub orb did, which is exactly why it was pulled. Release = log (+5 XP), mapping
// the 0..1 valence → real MOOD_OPTIONS index, so calendar / week-trail / MoodWidget read it unchanged.
function StateSliderLive({ app, isDark }) {
  const [val, setVal] = React.useState(0.78);          // start at «Хорошо» (David), not neutral middle
  const trackRef = React.useRef(null);
  const dragRef = React.useRef(false);
  const lastBkt = React.useRef((typeof moodBucket === "function") ? moodBucket(0.78) : 5);
  const idx = (typeof moodBucket === "function") ? moodBucket(val) : 5;
  const face = (typeof MOOD_FACES !== "undefined" && MOOD_FACES[idx]) || "🙂";
  const word = (typeof MOOD_WORDS !== "undefined" && MOOD_WORDS[idx]) || "Хорошо";
  const tint = (typeof tintFromMood === "function" && typeof moodSpectrum === "function")
    ? tintFromMood(moodSpectrum(val)) : ["#cfe1ff", "#7aa4d0", "#2c4d76"];
  const PAD = 12;                                       // keep the 22px thumb inside the track ends

  const setFromX = (clientX) => {
    const el = trackRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    let v = (clientX - r.left - PAD) / Math.max(1, r.width - 2 * PAD);
    v = Math.max(0, Math.min(1, v));
    const b = (typeof moodBucket === "function") ? moodBucket(v) : 3;
    if (b !== lastBkt.current) { lastBkt.current = b; if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} } }
    setVal(v);
  };
  const commit = () => {
    if (!app) return;
    const dayKey = (typeof bosTodayKey === "function") ? bosTodayKey() : new Date().toISOString().slice(0, 10);
    const mi = (typeof bosMoodIdxFromValence === "function") ? bosMoodIdxFromValence(val) : 1;
    app.setMood && app.setMood(MOOD_OPTIONS[mi]);
    app.setDayMoods && app.setDayMoods({ ...(app.dayMoods || {}), [dayKey]: mi });
    if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} }
  };

  const bg = isDark ? "linear-gradient(160deg, #1a1a1d 0%, #0d0d10 100%)" : "#ffffff";
  const titleColor = isDark ? "#fff" : "var(--text)";
  const labelMuted = isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.45)";
  const trackBg = isDark ? "rgba(255,255,255,0.10)" : "#e7e7ea";
  const trackGlass = isDark
    ? "inset 0 1px 2px rgba(0,0,0,0.45)"
    : "inset 0 1.5px 3px rgba(0,0,0,0.09), inset 0 -1px 0 rgba(255,255,255,0.65)";
  const endLabel = isDark ? "rgba(255,255,255,0.42)" : "#a8a8ae";

  return (
    <div style={{ width: "100%", background: bg, padding: "10px 14px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <div style={{ position: "relative", width: 58, height: 58, flexShrink: 0, display: "grid", placeItems: "center" }}>
          <StateOrb size={58} tint={tint} intensity={isDark ? 1.25 : 1.08} />
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none" }}>
            <span key={idx} style={{ fontSize: 23, lineHeight: 1, filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.28))", animation: "bosFacePop 0.4s cubic-bezier(0.34,1.56,0.64,1) both" }}>{face}</span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.4, color: labelMuted, fontWeight: 600 }}>Как ты сейчас?</div>
            <span style={{ fontSize: 10, fontWeight: 700, color: isDark ? "#9fd5a8" : "#3f7a46", background: "rgba(90,168,90,0.16)", borderRadius: 999, padding: "2px 8px", flexShrink: 0 }}>+5 XP</span>
          </div>
          <div style={{ fontFamily: "var(--bos-title-font)", fontSize: 19, fontWeight: 600, letterSpacing: "-0.4px", color: titleColor, lineHeight: 1.15, marginTop: 2 }}>{word}</div>
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        {/* iOS-слайдер: ТОНКАЯ дорожка (7px) + бегунок 22px НАД ней (David: «толстоват и высоковат» —
            убрали толстый желобок-капсулу). Заливка слева в цвет настроения. Интерактивная зона
            повыше дорожки для удобного тача. */}
        <div ref={trackRef}
          onPointerDown={(e) => { e.stopPropagation(); dragRef.current = true; try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {} setFromX(e.clientX); }}
          onPointerMove={(e) => { if (!dragRef.current) return; e.stopPropagation(); setFromX(e.clientX); }}
          onPointerUp={(e) => { e.stopPropagation(); if (dragRef.current) { dragRef.current = false; commit(); } }}
          onPointerCancel={() => { dragRef.current = false; }}
          style={{ position: "relative", height: 24, touchAction: "none", cursor: "pointer" }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: "50%", transform: "translateY(-50%)", height: 7, borderRadius: 999, background: trackBg, boxShadow: trackGlass }} />
          <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: "calc(" + PAD + "px + " + val + " * (100% - " + (2 * PAD) + "px))", height: 7, borderRadius: 999, background: "linear-gradient(90deg, " + tint[0] + ", " + tint[1] + ")", opacity: 0.92 }} />
          <div style={{ position: "absolute", top: "50%", left: "calc(" + PAD + "px + " + val + " * (100% - " + (2 * PAD) + "px))", width: 22, height: 22, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%, #fff, #eef0f3)", boxShadow: "0 2px 7px rgba(0,0,0,0.28), inset 0 0 0 0.7px rgba(0,0,0,0.06)", transform: "translate(-50%,-50%)", transition: dragRef.current ? "none" : "left 0.12s ease" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7, padding: "0 2px", fontSize: 10.5, letterSpacing: 0.4, textTransform: "uppercase", color: endLabel, fontWeight: 600 }}>
          <span>неприятно</span><span>приятно</span>
        </div>
      </div>
    </div>
  );
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
  if (typeof openSheet !== "function") { if (opts.onConfirm) try { opts.onConfirm(); } catch (e) {} return; }
  try {
    openSheet(
      <ConfirmActionSheet
        emoji={opts.emoji || "⚠️"}
        title={opts.title || "Удалить?"}
        message={opts.message || "Это действие нельзя отменить."}
        confirmLabel={opts.confirmLabel || "Удалить"}
        confirmIcon={I.X}
        onConfirm={opts.onConfirm || (() => {})}
      />
    );
  } catch (e) { if (opts.onConfirm) try { opts.onConfirm(); } catch (e2) {} }
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
function BosReorderList({ ids, onReorder, renderItem, gap = 8, onAdd, addLabel }) {
  const [mode, setMode] = React.useState(false);
  const [order, setOrder] = React.useState(ids);
  const [drag, setDrag] = React.useState({ id: null, from: -1, to: -1, dy: 0, slot: 0 });
  const refs = React.useRef({});
  const g = React.useRef(null); // live gesture (avoids stale closures)
  const idsKey = (ids || []).join("|");
  // Resync to the store order whenever it changes AND we're not mid-gesture (add / delete / load).
  React.useEffect(() => { if (!g.current) setOrder(ids || []); }, [idsKey]);

  const onDown = (id) => (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (g.current) return; // one finger at a time
    const startY = e.clientY, startX = e.clientX;
    const curOrder = order.slice();
    const from = curOrder.indexOf(id);
    const gc = { id, from, to: from, startY, startX, fired: false, order: curOrder };
    const cleanup = () => {
      if (gc.longTimer) { clearTimeout(gc.longTimer); gc.longTimer = null; }
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      if (g.current === gc) g.current = null;
    };
    const begin = () => {
      gc.fired = true;
      if (!mode) setMode(true);
      const snap = {};
      curOrder.forEach((iid) => { const el = refs.current[iid]; if (el) { const r = el.getBoundingClientRect(); snap[iid] = { top: r.top, h: r.height }; } });
      gc.snap = snap;
      const slot = (snap[id] ? snap[id].h : 72) + gap;
      gc.slot = slot;
      setDrag({ id, from, to: from, dy: 0, slot });
      if (window.tgHaptic) { try { window.tgHaptic("medium"); } catch (e2) {} }
    };
    const onMove = (e2) => {
      const y = e2.clientY, x = e2.clientX;
      if (!gc.fired) { if (Math.abs(y - startY) > 10 || Math.abs(x - startX) > 10) cleanup(); return; }
      if (e2.cancelable) e2.preventDefault();
      const dy = y - startY;
      const me = gc.snap[id]; if (!me) return;
      const center = me.top + dy + me.h / 2;
      let to = from;
      if (dy > 0) { for (let i = from + 1; i < curOrder.length; i++) { const s = gc.snap[curOrder[i]]; if (s && center > s.top + s.h / 2) to = i; else break; } }
      else if (dy < 0) { for (let i = from - 1; i >= 0; i--) { const s = gc.snap[curOrder[i]]; if (s && center < s.top + s.h / 2) to = i; else break; } }
      gc.to = to;
      setDrag({ id, from, to, dy, slot: gc.slot });
    };
    const onUp = () => {
      const fired = gc.fired, gto = gc.to;
      cleanup();
      if (fired) {
        if (gto !== from && gto >= 0) {
          const next = curOrder.slice(); const [x] = next.splice(from, 1); next.splice(gto, 0, x);
          setOrder(next);
          try { onReorder && onReorder(next); } catch (e2) {}
          if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e2) {} }
        }
        setDrag({ id: null, from: -1, to: -1, dy: 0, slot: 0 });
      }
    };
    g.current = gc;
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    if (mode) begin(); else gc.longTimer = setTimeout(begin, 420);
  };

  const done = () => { setMode(false); setDrag({ id: null, from: -1, to: -1, dy: 0, slot: 0 }); };

  const shiftOf = (idx) => {
    const { from, to, slot } = drag;
    if (from < 0 || to < 0) return 0;
    if (from < to && idx > from && idx <= to) return -slot;
    if (to < from && idx >= to && idx < from) return slot;
    return 0;
  };

  const dark = !!(typeof document !== "undefined" && document.querySelector(".bos-page.theme-dark"));
  return (
    <>
      {/* «Готово» FLOATS (iOS edit-mode style, David): portal'd into the app viewport box (.page-stack,
          position:absolute inset:0) so it floats over everything and never pushes the list down — it
          stays glued there through scroll until tapped to leave jiggle. Pinned BOTTOM-CENTER above the
          tab bar: в Telegram top-right прятался ПОД нативными кнопками TG («нужно ниже») — снизу у TG
          нативных кнопок нет, а --bos-safe-bottom учитывает и TG-инсет → не перекроется. */}
      {mode && ReactDOM.createPortal(
        <div style={{
          position: "absolute", bottom: "calc(var(--bos-safe-bottom, 0px) + 94px)", left: 0, right: 0,
          display: "flex", justifyContent: "center", alignItems: "center", gap: 10, zIndex: 7000, pointerEvents: "none",
        }}>
          {/* «+» — opens the widget on/off sheet straight from edit mode (David: добавлять виджеты
             было «аж в настройках» → теперь стеклянный плюсик рядом с «Готово»). Home board only (onAdd). */}
          {onAdd && (
            <button onClick={onAdd} className="tap" data-haptic="selection" aria-label={addLabel || "Добавить виджет"} style={{
              pointerEvents: "auto", width: 44, height: 44, borderRadius: "50%", border: 0, display: "grid", placeItems: "center", cursor: "pointer",
              color: dark ? "#fff" : "var(--text)", background: BOS_TILE_SHEEN + ", " + (dark ? "rgba(64,64,68,0.96)" : "rgba(255,255,255,0.97)"),
              boxShadow: "0 10px 26px rgba(0,0,0,0.30), inset 0 1px 1px rgba(255,255,255,0.9), inset 0 0 0 0.5px rgba(0,0,0,0.08)",
              animation: "bosMenuPop 0.32s cubic-bezier(0.34,1.5,0.4,1) both",
            }}><I.Plus size={20} strokeWidth={2.6} /></button>
          )}
          <button onClick={done} className="tap" data-haptic="selection" aria-label="Готово — выйти из режима перестановки" style={{
            pointerEvents: "auto", border: 0, background: "#0a0a0a", color: "#fff", borderRadius: 999, padding: "11px 22px",
            fontSize: 14, fontWeight: 600, boxShadow: "0 10px 26px rgba(0,0,0,0.36)", cursor: "pointer",
            animation: "bosMenuPop 0.32s cubic-bezier(0.34,1.5,0.4,1) both",
          }}>Готово</button>
        </div>,
        (typeof document !== "undefined" && document.querySelector(".page-stack")) || document.body
      )}
      <div style={{ display: "flex", flexDirection: "column", gap, color: "var(--text)" }}>
        {order.map((id, idx) => {
          const isDrag = drag.id === id;
          return (
            <div key={id} ref={(el) => { refs.current[id] = el; }}
              onPointerDown={onDown(id)}
              style={{ position: "relative", touchAction: mode ? "none" : "auto",
                transform: isDrag ? "translateY(" + drag.dy + "px) scale(1.03)" : "translateY(" + shiftOf(idx) + "px)",
                transition: isDrag ? "none" : "transform 0.22s cubic-bezier(0.2,0,0,1)",
                zIndex: isDrag ? 40 : 1, willChange: mode ? "transform" : "auto" }}>
              <div className={mode && !isDrag ? "bos-jiggle" : ""} style={{ animationDelay: (-(idx % 5) * 0.045) + "s", borderRadius: 22, boxShadow: isDrag ? "0 16px 34px rgba(20,30,60,0.22)" : "none" }}>
                {renderItem(id, { mode, dragging: isDrag })}
              </div>
            </div>
          );
        })}
      </div>
      {/* (The in-list «+ Добавить» tile moved to the floating glass «+» next to «Готово» above —
         David: «плюсик в кружочке рядом с Готово» открывает шторку вкл/выкл виджетов.) */}
    </>
  );
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
function BosReorderGrid({ ids, onReorder, renderItem, onLongPress, ctlRef, cols = 2, gap = 12, spanFull }) {
  const [mode, setMode] = React.useState(false);
  const [order, setOrder] = React.useState(ids);
  const [drag, setDrag] = React.useState({ id: null, from: -1, to: -1, dx: 0, dy: 0 });
  const refs = React.useRef({});
  const g = React.useRef(null); // live gesture (avoids stale closures)
  const idsKey = (ids || []).join("|");
  React.useEffect(() => { if (!g.current) setOrder(ids || []); }, [idsKey]);
  // Let the parent flip us into reorder mode from the long-press menu («Переставить плитки»).
  React.useEffect(() => { if (ctlRef) ctlRef.current = { enterReorder: () => setMode(true), exit: () => setMode(false) }; }, [ctlRef]);

  const onDown = (id) => (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (g.current) return; // one finger at a time
    const startY = e.clientY, startX = e.clientX;
    const curOrder = order.slice();
    const from = curOrder.indexOf(id);
    const gc = { id, from, to: from, startY, startX, fired: false, order: curOrder };
    const cleanup = () => {
      if (gc.longTimer) { clearTimeout(gc.longTimer); gc.longTimer = null; }
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      if (g.current === gc) g.current = null;
    };
    // Held-still long-press in NORMAL mode → open the tile menu. Mark the gesture consumed and
    // swallow the trailing click so the tile doesn't navigate into the detail screen too.
    const popMenu = () => {
      gc.fired = true;
      if (window.tgHaptic) { try { window.tgHaptic("medium"); } catch (e2) {} }
      const swallow = (ev) => { ev.stopPropagation(); ev.preventDefault(); window.removeEventListener("click", swallow, true); };
      window.addEventListener("click", swallow, true);
      setTimeout(() => { try { window.removeEventListener("click", swallow, true); } catch (e2) {} }, 800);
      if (onLongPress) { try { onLongPress(id); } catch (e2) {} }
      cleanup();
    };
    // Press in REORDER mode → begin a drag at once (snapshot every tile's rect for 2D shifts).
    const begin = () => {
      gc.fired = true;
      const snap = {};
      curOrder.forEach((iid) => { const el = refs.current[iid]; if (el) { const r = el.getBoundingClientRect(); snap[iid] = { left: r.left, top: r.top, w: r.width, h: r.height }; } });
      gc.snap = snap;
      setDrag({ id, from, to: from, dx: 0, dy: 0 });
      if (window.tgHaptic) { try { window.tgHaptic("medium"); } catch (e2) {} }
    };
    const onMove = (e2) => {
      const y = e2.clientY, x = e2.clientX;
      if (!gc.fired) { if (Math.abs(y - startY) > 10 || Math.abs(x - startX) > 10) cleanup(); return; }
      if (!gc.snap) return; // a popMenu press has no drag
      if (e2.cancelable) e2.preventDefault();
      const dx = x - startX, dy = y - startY;
      // target slot = the tile whose CENTRE is nearest the finger (2D)
      let to = gc.from, best = Infinity;
      for (let i = 0; i < curOrder.length; i++) {
        const s = gc.snap[curOrder[i]]; if (!s) continue;
        const cx = s.left + s.w / 2, cy = s.top + s.h / 2;
        const d = (cx - x) * (cx - x) + (cy - y) * (cy - y);
        if (d < best) { best = d; to = i; }
      }
      gc.to = to;
      setDrag({ id, from: gc.from, to, dx, dy });
    };
    const onUp = () => {
      const fired = gc.fired, gto = gc.to, gfrom = gc.from, dragging = !!gc.snap;
      cleanup();
      if (fired && dragging) {
        if (gto !== gfrom && gto >= 0) {
          const next = curOrder.slice(); const [x] = next.splice(gfrom, 1); next.splice(gto, 0, x);
          setOrder(next);
          try { onReorder && onReorder(next); } catch (e2) {}
          if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e2) {} }
        }
        setDrag({ id: null, from: -1, to: -1, dx: 0, dy: 0 });
      }
    };
    g.current = gc;
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    if (mode) begin(); else gc.longTimer = setTimeout(popMenu, 480);
  };

  const done = () => { setMode(false); setDrag({ id: null, from: -1, to: -1, dx: 0, dy: 0 }); };

  // 2D shift for the non-dragged tiles — slide each to the slot it WOULD occupy once the dragged
  // tile lands at `to`. Uses the drag-time rect snapshot, so it's a grid-correct Δx/Δy (not just Δy).
  const shiftOf = (idx) => {
    const gc = g.current;
    if (!gc || !gc.snap || drag.from < 0 || drag.to < 0 || drag.from === drag.to) return { x: 0, y: 0 };
    const myId = order[idx];
    if (myId === drag.id) return { x: 0, y: 0 };
    const virtual = order.slice(); const fi = virtual.indexOf(drag.id); if (fi < 0) return { x: 0, y: 0 };
    virtual.splice(fi, 1); virtual.splice(drag.to, 0, drag.id);
    const slot = virtual.indexOf(myId);
    const cur = gc.snap[myId], tgt = gc.snap[order[slot]];
    if (!cur || !tgt) return { x: 0, y: 0 };
    return { x: tgt.left - cur.left, y: tgt.top - cur.top };
  };

  return (
    <>
      {/* «Готово» FLOATS (same portal as BosReorderList — pinned bottom-centre above the tab bar). */}
      {mode && ReactDOM.createPortal(
        <div style={{ position: "absolute", bottom: "calc(var(--bos-safe-bottom, 0px) + 94px)", left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 10, zIndex: 7000, pointerEvents: "none" }}>
          <button onClick={done} className="tap" data-haptic="selection" aria-label="Готово — выйти из режима перестановки" style={{
            pointerEvents: "auto", border: 0, background: "#0a0a0a", color: "#fff", borderRadius: 999, padding: "11px 22px",
            fontSize: 14, fontWeight: 600, boxShadow: "0 10px 26px rgba(0,0,0,0.36)", cursor: "pointer",
            animation: "bosMenuPop 0.32s cubic-bezier(0.34,1.5,0.4,1) both",
          }}>Готово</button>
        </div>,
        (typeof document !== "undefined" && document.querySelector(".page-stack")) || document.body
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(" + cols + ", 1fr)", gap, color: "var(--text)" }}>
        {order.map((id, idx) => {
          const isDrag = drag.id === id;
          const sh = isDrag ? { x: 0, y: 0 } : shiftOf(idx);
          return (
            <div key={id} ref={(el) => { refs.current[id] = el; }} onPointerDown={onDown(id)}
              style={{ position: "relative", touchAction: mode ? "none" : "auto",
                gridColumn: (spanFull && spanFull(id)) ? "1 / -1" : undefined,
                transform: isDrag ? "translate(" + drag.dx + "px, " + drag.dy + "px) scale(1.045)" : "translate(" + sh.x + "px, " + sh.y + "px)",
                transition: isDrag ? "none" : "transform 0.24s cubic-bezier(0.2,0,0,1)",
                zIndex: isDrag ? 40 : 1, willChange: mode ? "transform" : "auto" }}>
              <div className={mode && !isDrag ? "bos-jiggle" : ""} style={{ animationDelay: (-(idx % 5) * 0.045) + "s", borderRadius: 22, boxShadow: isDrag ? "0 16px 34px rgba(20,30,60,0.22)" : "none" }}>
                {renderItem(id, { mode, dragging: isDrag })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* The home widget CATALOGUE — one source of truth shared by the board (home_live), the add
   sheet, and the «Виджеты главного» settings screen (home_extra_live). `var` so it's global
   across the built files. id = the widgets[id] visibility flag; order lives in widgets.order. */
// Блок «Уровень» УЕХАЛ с главной на страницу «Я» (David: «золотой баннер уровня перенести внутрь Я»)
// → его нет в списке виджетов главной. Кейс id==="level" в home_live остаётся, но не рендерится
// (нет в DEFAULT_ORDER → отфильтровывается), чтобы откат был лёгким.
var BOS_HOME_WIDGETS = [
  { id: "hero",    t: "Подсказки",    d: "ИИ-сводка дня и аватар",   emoji: "✨" },
  { id: "week",    t: "Эта неделя",   d: "Недельная активность",     emoji: "📅" },
  { id: "team",    t: "Команды",      d: "Твои команды",             emoji: "👥" },
  // «Состояние» (mood-слайдер + виджет-состояние с упоминанием дневника) ВРЕМЕННО СКРЫТ (David) —
  // убран из списка → кейс id==="mood" в home_live не рендерится. Вернуть = добавить строку обратно.
  { id: "habits",  t: "Привычки",     d: "Список привычек на день",  emoji: "🌱" },
  { id: "goals",   t: "Цели",         d: "Твои цели",                emoji: "🎯" },
  { id: "invite",  t: "Позови своих", d: "Приглашай друзей — +XP",   emoji: "📣" },
];

/* iOS-style «−» remove badge for the home widget board — a small GLASS circle pinned to the
   block's top-left (same reflective material as the pencil button). Stops the pointer so a tap
   removes the widget instead of starting a drag. David: «минус в кружочке-стекле слева сверху». */
function WidgetMinusLive({ onRemove }) {
  const app = (typeof useApp === "function") ? useApp() : null;
  const dark = app?.themeOverride === "dark";
  return (
    <button onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => { e.stopPropagation(); if (window.tgHaptic) { try { window.tgHaptic("rigid"); } catch (_) {} } onRemove(); }}
      className="tap" aria-label="Убрать виджет с главной"
      style={{ position: "absolute", top: -7, left: -7, zIndex: 30, width: 27, height: 27, borderRadius: "50%",
        border: 0, display: "grid", placeItems: "center", cursor: "pointer", color: dark ? "#fff" : "var(--text)",
        background: BOS_TILE_SHEEN + ", " + (dark ? "rgba(64,64,68,0.96)" : "rgba(255,255,255,0.97)"),
        boxShadow: "0 2px 9px rgba(0,0,0,0.24), inset 0 1px 1px rgba(255,255,255,0.9), inset 0 0 0 0.5px rgba(0,0,0,0.08)" }}>
      <I.Minus size={16} strokeWidth={3} />
    </button>
  );
}

/* Bottom sheet to turn home widgets ON/OFF — one glassy place to manage the board (David: «шторка
   с виджетами, которые можно включить или выключить, со стеклом»). Reads app.widgets live, so the
   board behind updates as you flip switches. `defs` = the full catalogue [{ id, t, d, emoji }]; LIVE. */
function AddWidgetSheetLive({ defs = [], dark = false }) {
  const app = (typeof useApp === "function") ? useApp() : null;
  const widgets = app?.widgets || {};
  // «invite» is opt-in (off by default, matches the home board); everything else ON unless hidden.
  const isOn = (id) => (id === "invite") ? (widgets.invite === true) : (widgets[id] !== false);
  const toggle = (id) => { app?.setWidgets({ ...(app.widgets || {}), [id]: !isOn(id) }); if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (_) {} } };
  return (
    <div style={{ padding: "2px 18px 8px", color: "var(--text)" }}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.3px" }}>Виджеты главной</div>
        <div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 5 }}>Что показывать на главной</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {defs.map((o) => {
          const on = isOn(o.id);
          return (
            <div key={o.id} style={{
              display: "flex", alignItems: "center", gap: 13, width: "100%",
              padding: 12, borderRadius: 18,
              background: BOS_TILE_SHEEN + ", " + (dark ? "rgba(255,255,255,0.06)" : "var(--surface-3)"),
              boxShadow: bosTileGlass(dark) }}>
              <span style={{ width: 40, height: 40, borderRadius: 13, display: "grid", placeItems: "center", fontSize: 20, flexShrink: 0,
                background: BOS_TILE_SHEEN + ", " + (dark ? "rgba(255,255,255,0.08)" : "#fff"), boxShadow: bosTileGlass(dark), opacity: on ? 1 : 0.5, transition: "opacity 0.2s" }}>{o.emoji}</span>
              <div style={{ flex: 1, minWidth: 0, opacity: on ? 1 : 0.55, transition: "opacity 0.2s" }}>
                <div style={{ fontSize: 15.5, fontWeight: 600 }}>{o.t}</div>
                {o.d && <div style={{ fontSize: 12.5, color: "var(--text-4)", marginTop: 1 }}>{o.d}</div>}
              </div>
              <Switch on={on} onChange={() => toggle(o.id)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* «+» (Главная и Привычки) — КЛАССИЧЕСКИЙ стеклянный поповер (David: «нравилась небольшая
   стеклянная менюшка — привычку или цель, не перегружало; верни»). Три пункта: Привычку / Цель
   (наши формы-шторки) + тихий третий «Готовый челлендж» → шторка-каталог пресетов по категориям
   (CreatePickerSheetLive custom={false} — без верхних строк «своё», они уже здесь). */
function CreateMenuLive({ open, onClose, anchorRef, navigate }) {
  const { open: _openSheet } = (typeof useSheet === "function") ? useSheet() : { open: () => {} };
  const _app = (typeof useApp === "function") ? useApp() : null;
  const isDark = _app?.themeOverride === "dark"; // тёмная тема: тёмное стекло вместо белого
  const [pos, setPos] = React.useState(null);
  React.useEffect(() => {
    if (open && anchorRef && anchorRef.current) {
      const r = anchorRef.current.getBoundingClientRect();
      setPos({ right: Math.round(window.innerWidth - r.right), top: Math.round(r.bottom + 10) });
    }
  }, [open]);
  if (!open || !pos) return null;
  const items = [
    { icon: I.Flame, label: "Привычку", go: () => _openSheet(<HabitFormSheetLive mode="create" navigate={navigate} />) },
    { icon: I.Flag,  label: "Цель",     go: () => _openSheet(<GoalFormSheetLive mode="create" navigate={navigate} />) },
    { icon: I.Bolt,  label: "Готовый челлендж", go: () => { if (typeof CreatePickerSheetLive === "function") _openSheet(<CreatePickerSheetLive navigate={navigate} custom={false} />); } },
  ];
  return ReactDOM.createPortal(
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 8000, background: "rgba(18,22,38,0.16)", animation: "dimIn 0.18s ease both" }}>
      <div role="menu" onClick={(e) => e.stopPropagation()} style={{
        position: "fixed", right: pos.right, top: pos.top, transformOrigin: "top right",
        animation: "bosMenuPop 0.34s cubic-bezier(0.34,1.5,0.4,1) both",
        minWidth: 212, padding: 7, borderRadius: 22,
        background: isDark ? "rgba(38,40,46,0.78)" : "rgba(255,255,255,0.74)",
        WebkitBackdropFilter: "blur(34px) saturate(180%)", backdropFilter: "blur(34px) saturate(180%)",
        border: "0.5px solid " + (isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.7)"), boxShadow: "0 16px 44px rgba(0,0,0," + (isDark ? "0.5" : "0.26") + ")",
      }}>
        {items.map((it, i) => (
          <button key={i} role="menuitem" data-haptic="selection" onClick={() => { onClose(); it.go(); }} className="tap" style={{
            display: "flex", alignItems: "center", gap: 13, width: "100%",
            padding: "12px 14px", border: 0, background: "transparent", borderRadius: 16,
            borderTop: i === 2 ? ("0.5px solid " + (isDark ? "rgba(255,255,255,0.10)" : "rgba(10,10,10,0.08)")) : 0, // тонкая черта отделяет «готовое» от «своего»
            fontSize: 16, fontWeight: 600, color: isDark ? "#f2f2f5" : "#0a0a0a", cursor: "pointer", textAlign: "left",
          }}>
            <span aria-hidden style={{ width: 30, height: 30, borderRadius: 9, background: isDark ? "rgba(255,255,255,0.10)" : "rgba(10,10,10,0.05)", display: "grid", placeItems: "center", flexShrink: 0 }}>{React.createElement(it.icon, { size: 18, color: isDark ? "#f2f2f5" : "#0a0a0a", strokeWidth: 1.9 })}</span>
            {it.label}
          </button>
        ))}
      </div>
    </div>,
    document.body
  );
}

/* Серый фон ШТОРКИ (David: «подложки белые, а бэкграунд слегка серенький — как на всех
   страницах»): абсолютный слой под содержимым, за ручкой-गрэбом (zIndex -1). */
function SheetGreyBgLive() {
  // data-sheet-grey = маркер: CSS-правило .bos-sheet:has([data-sheet-grey]) красит СAMУ панель
  // шторки в серый — тогда серый доходит до скруглённого верха (ручки) и не кончается при
  // прокрутке (старый absolute-слой ехал вместе с контентом → белые полосы, баг David).
  // Сам слой остаётся фолбэком для старых webview без :has(). В тёмной теме var(--bg) НЕ
  // переключается (.theme-dark задаёт фон напрямую) — тёмный цвет задаём сами.
  const app = (typeof useApp === "function") ? useApp() : null;
  const dark = app?.themeOverride === "dark";
  return <div aria-hidden data-sheet-grey style={{ position: "absolute", inset: 0, zIndex: -1, background: dark ? "#151517" : "var(--bg, #f2f2f4)", borderRadius: "24px 24px 0 0" }} />;
}

/* Шапка ШТОРКИ-ФОРМЫ (iOS-модалка): слева круглая стеклянная «✕» (закрыть), справа «✓»
   (сохранить) — не нужно листать до низа (David). Единая для привычки И цели. */
function SheetFormHeadLive({ title, onClose, onDone }) {
  const app = (typeof useApp === "function") ? useApp() : null;
  const dark = app?.themeOverride === "dark";
  const glass = { width: 38, height: 38, borderRadius: "50%", border: 0, display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0, color: dark ? "#fff" : "var(--text)", background: BOS_TILE_SHEEN + ", " + (dark ? "rgba(255,255,255,0.10)" : "#fff"), boxShadow: bosTileGlass(dark) };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "2px 0 4px" }}>
      <button type="button" onClick={onClose} className="tap" data-haptic="selection" aria-label="Закрыть" style={glass}><I.X size={17} strokeWidth={2.2} /></button>
      <div style={{ flex: 1, minWidth: 0, textAlign: "center", fontSize: 18, fontWeight: 700, letterSpacing: "-0.3px", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
      <button type="button" onClick={onDone} className="tap" data-haptic="light" aria-label="Сохранить" style={glass}><I.Check size={18} strokeWidth={2.5} /></button>
    </div>
  );
}

// ─── СТИЛЬ КАРТОЧЕК страницы «Привычки» ───────────────────────────────────────────────────────────
// David: «формы + тоглы внутри». Дефолт = ТЕКУЩИЙ вид (квадрат, неделя, имя+лица) — не меняем, человек
// сам покрутит. Запоминается в localStorage; смена шлёт событие → список перерисовывается вживую.
var BOS_CARD_STYLE_DEFAULT = { form: "square", name: true, marks: "week", faces: true, cells: "round" };
function bosLoadCardStyle() { try { var s = JSON.parse(localStorage.getItem("bos:cardStyle") || "null"); if (s && typeof s === "object") return Object.assign({}, BOS_CARD_STYLE_DEFAULT, s); } catch (e) {} return Object.assign({}, BOS_CARD_STYLE_DEFAULT); }
function bosSaveCardStyle(s) { try { localStorage.setItem("bos:cardStyle", JSON.stringify(s)); } catch (e) {} try { window.dispatchEvent(new Event("bos:cardStyleChanged")); } catch (e) {} }

// СТИЛЬ ЦЕЛЕЙ — ОТДЕЛЬНЫЙ от привычек (David: «карточки целей и привычек должны отличаться; в
// шестерёнке — стиль привычек И стиль целей, у целей другие пресеты»). База = ВЫСОКИЙ БАННЕР (как
// цель выглядела изначально). form: banner (полноширинный высокий) | square (2-в-ряд минимал).
// orbits = мини-орбита (привычки+люди вокруг цели-превью). name/progress — тоглы. Тот же event.
var BOS_GOAL_STYLE_DEFAULT = { form: "banner", name: true, orbits: false, progress: true };
function bosLoadGoalStyle() { try { var s = JSON.parse(localStorage.getItem("bos:goalStyle") || "null"); if (s && typeof s === "object") return Object.assign({}, BOS_GOAL_STYLE_DEFAULT, s); } catch (e) {} return Object.assign({}, BOS_GOAL_STYLE_DEFAULT); }
function bosSaveGoalStyle(s) { try { localStorage.setItem("bos:goalStyle", JSON.stringify(s)); } catch (e) {} try { window.dispatchEvent(new Event("bos:cardStyleChanged")); } catch (e) {} }

// Месячная «грядка» для превью карточки — последние 5 недель (35 клеток) хитмапом по логу привычки.
// Тот же язык клеток, что у недельной полоски и календаря (bosCellFill/bosCellGlass) → континуити.
function HabitMonthMini({ habit, square = false }) {
  var app = (typeof useApp === "function") ? useApp() : null;
  var isDark = app && app.themeOverride === "dark";
  if (!habit) return null;
  var accent = bosHabitColor(habit);
  var log = habit.log || {};
  var keys = [], base = new Date();
  for (var i = 34; i >= 0; i--) { var d = new Date(base.getTime()); d.setDate(d.getDate() - i); keys.push(d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2)); }
  var doneFill = bosCellFill(accent, 1);
  var empty = (typeof bosCellEmpty === "function") ? bosCellEmpty(accent, isDark) : (isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)");
  var radius = square ? 4 : "50%"; // David: везде КРУЖКИ по умолчанию; квадраты — по тоглу
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, width: "100%", maxWidth: 154 }}>
      {keys.map(function (k, i) { var fl = !!log[k]; return <span key={i} style={{ aspectRatio: "1/1", borderRadius: radius, background: fl ? doneFill : empty, boxShadow: fl ? bosCellGlass(isDark) : "none" }} />; })}
    </div>
  );
}

// Меню шестерёнки — ДВЕ вкладки: «Привычки» и «Цели» (David: у каждого свой стиль/пресеты). Само
// грузит и сохраняет оба стиля (bosSaveCardStyle/bosSaveGoalStyle → event → список перерисовывается).
// Привычки: форма квадрат/строка + отметки/клетки/лица/название. Цели: форма БАННЕР/квадрат + орбиты
// (мини-орбита привычек+людей) + прогресс + название. Всплывашка у шестерёнки (как CreateMenuLive).
function CardStyleMenuLive({ open, onClose, anchorRef }) {
  const [pos, setPos] = React.useState(null);
  const [tab, setTab] = React.useState("habits");
  const [hs, setHs] = React.useState(bosLoadCardStyle);
  const [gs, setGs] = React.useState(bosLoadGoalStyle);
  React.useEffect(() => {
    if (!open) return;
    setHs(bosLoadCardStyle()); setGs(bosLoadGoalStyle());
    if (anchorRef && anchorRef.current) { const r = anchorRef.current.getBoundingClientRect(); setPos({ right: Math.round(window.innerWidth - r.right), top: Math.round(r.bottom + 10) }); }
  }, [open]);
  if (!open || !pos) return null;
  const setH = (patch) => { const n = Object.assign({}, hs, patch); setHs(n); bosSaveCardStyle(n); };
  const setG = (patch) => { const n = Object.assign({}, gs, patch); setGs(n); bosSaveGoalStyle(n); };
  const SQ = (<svg width="34" height="20" viewBox="0 0 34 20" fill="none"><rect x="2" y="3" width="13" height="14" rx="3" stroke="#0a0a0a" strokeWidth="1.6" /><rect x="19" y="3" width="13" height="14" rx="3" stroke="#0a0a0a" strokeWidth="1.6" /></svg>);
  const RC = (<svg width="34" height="20" viewBox="0 0 34 20" fill="none"><rect x="2" y="2.5" width="30" height="6.5" rx="2.5" stroke="#0a0a0a" strokeWidth="1.6" /><rect x="2" y="11" width="30" height="6.5" rx="2.5" stroke="#0a0a0a" strokeWidth="1.6" /></svg>);
  const BN = (<svg width="34" height="20" viewBox="0 0 34 20" fill="none"><rect x="2" y="3" width="30" height="14" rx="3" stroke="#0a0a0a" strokeWidth="1.6" /><circle cx="8" cy="10" r="2.4" stroke="#0a0a0a" strokeWidth="1.4" /><rect x="14" y="7" width="15" height="2" rx="1" fill="#0a0a0a" /><rect x="14" y="12" width="10" height="2" rx="1" fill="#0a0a0a" opacity="0.5" /></svg>);
  const formBtn = (key, label, icon, cur, onPick) => (
    <button key={key} onClick={() => onPick(key)} className="tap" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 7, padding: "13px 6px", borderRadius: 14, border: cur === key ? "1.5px solid #0a0a0a" : "1.5px solid rgba(10,10,10,0.12)", background: cur === key ? "rgba(10,10,10,0.05)" : "transparent", cursor: "pointer" }}>
      {icon}<span style={{ fontSize: 12, fontWeight: 600, color: "#0a0a0a" }}>{label}</span>
    </button>
  );
  // Компактный сегмент — СВОЙ (шаренный .tab-pill с padding 18px не влезал в 258px).
  const seg = (val, opts, onPick) => (
    <div style={{ display: "flex", gap: 4, background: "rgba(10,10,10,0.05)", borderRadius: 12, padding: 4 }}>
      {opts.map((o) => (
        <button key={o.v} onClick={() => onPick(o.v)} className="tap" style={{ flex: 1, minWidth: 0, border: 0, borderRadius: 9, padding: "7px 4px", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", background: val === o.v ? "#fff" : "transparent", color: val === o.v ? "#0a0a0a" : "rgba(10,10,10,0.5)", boxShadow: val === o.v ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>{o.l}</button>
      ))}
    </div>
  );
  const toggleRow = (label, on, onCh) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 2px", fontSize: 14.5, fontWeight: 500, color: "#0a0a0a" }}>
      <span>{label}</span><Switch on={on} onChange={onCh} />
    </div>
  );
  const divider = <div style={{ height: 1, background: "rgba(10,10,10,0.08)", margin: "13px 0 10px" }} />;
  return ReactDOM.createPortal(
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 8000, background: "rgba(18,22,38,0.16)", animation: "dimIn 0.18s ease both" }}>
      <div role="menu" onClick={(e) => e.stopPropagation()} style={{ position: "fixed", right: pos.right, top: pos.top, transformOrigin: "top right", animation: "bosMenuPop 0.34s cubic-bezier(0.34,1.5,0.4,1) both", width: 258, padding: 14, borderRadius: 22, background: "rgba(255,255,255,0.86)", WebkitBackdropFilter: "blur(34px) saturate(180%)", backdropFilter: "blur(34px) saturate(180%)", border: "0.5px solid rgba(255,255,255,0.7)", boxShadow: "0 16px 44px rgba(20,30,60,0.26)", color: "#0a0a0a" }}>
        {/* Вкладки: Привычки / Цели */}
        {seg(tab, [{ v: "habits", l: "Привычки" }, { v: "goals", l: "Цели" }], setTab)}
        <div style={{ height: 12 }} />
        {tab === "habits" ? (
          <>
            <div style={{ display: "flex", gap: 8 }}>{formBtn("square", "Квадрат", SQ, hs.form, (k) => setH({ form: k }))}{formBtn("rect", "Строка", RC, hs.form, (k) => setH({ form: k }))}</div>
            {divider}
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: "rgba(10,10,10,0.5)" }}>Отметки</div>
            {seg(hs.marks, [{ v: "none", l: "Нет" }, { v: "week", l: "Неделя" }, { v: "month", l: "Месяц" }], (v) => setH({ marks: v }))}
            {hs.marks !== "none" && <div style={{ marginTop: 8 }}>{seg(hs.cells || "round", [{ v: "round", l: "Кружки" }, { v: "square", l: "Квадраты" }], (v) => setH({ cells: v }))}</div>}
            <div style={{ marginTop: 6 }}>
              {toggleRow("Лица друзей", hs.faces, (v) => setH({ faces: v }))}
              {hs.form === "square" && toggleRow("Название", hs.name, (v) => setH({ name: v }))}
            </div>
          </>
        ) : (
          <>
            <div style={{ display: "flex", gap: 8 }}>{formBtn("banner", "Баннер", BN, gs.form, (k) => setG({ form: k }))}{formBtn("square", "Квадрат", SQ, gs.form, (k) => setG({ form: k }))}</div>
            {divider}
            <div style={{ marginTop: 0 }}>
              {toggleRow("Орбиты вокруг цели", gs.orbits, (v) => setG({ orbits: v }))}
              {toggleRow("Прогресс", gs.progress, (v) => setG({ progress: v }))}
              {toggleRow("Название", gs.name, (v) => setG({ name: v }))}
            </div>
            <div style={{ fontSize: 11.5, color: "rgba(10,10,10,0.42)", lineHeight: 1.4, padding: "4px 2px 0" }}>Орбиты показывают привычки и людей вокруг цели — превью, вокруг чего она.</div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

// LIVE share-a-goal sheet — the goal twin of ShareHabitSheetLive, kept minimal: share
// the app by your referral link with a line about the goal (goals aren't team-joined
// like habits, so no "do together" roster here).
function ShareGoalSheetLive({ goal, dark = false }) {
  const APP_URL = (typeof bosInviteLink === "function") ? bosInviteLink(null) : "https://t.me/BalanceOS8_bot";
  const [shareUrl, setShareUrl] = React.useState(APP_URL);
  React.useEffect(() => {
    let on = true;
    (async () => {
      let ref = null;
      try { ref = (window.bosCloud && window.bosCloud.inviteCode) ? await window.bosCloud.inviteCode() : null; } catch (e) {}
      // Круг цели = тот же ОБЩИЙ механизм, что у привычек-вместе: shareCode + createSharedHabit,
      // ссылка hb_<code> → друг вступает в ТОТ ЖЕ круг → его лицо появляется на твоей цели.
      var code = goal && goal.shareCode;
      if (code && window.bosCloud && window.bosCloud.enabled() && window.bosCloud.createSharedHabit && typeof bosSharedHabitLink === "function") {
        try { await window.bosCloud.createSharedHabit({ code: code, name: goal.name, emoji: goal.emoji, color: goal.color }); } catch (e) {}
        if (on) { setShareUrl(bosSharedHabitLink(code, ref)); return; }
      }
      if (on) setShareUrl((ref && typeof bosInviteLink === "function") ? bosInviteLink(ref) : APP_URL);
    })();
    return () => { on = false; };
  }, []);
  const doShare = () => {
    const msg = "Иду к цели «" + (goal?.name || "") + "» в BalanceOS — попробуй со мной";
    if (window.bosShare) window.bosShare(shareUrl, msg);
    else { try { navigator.clipboard.writeText(shareUrl); } catch (e) {} }
    if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} }
  };
  const C = dark
    ? { text: "#fff", sub: "rgba(255,255,255,0.5)", tile: "rgba(255,255,255,0.08)", btnBg: "#fff", btnFg: "#0a0a0a" }
    : { text: "#0a0a0a", sub: "rgba(0,0,0,0.5)", tile: "#f1f1f3", btnBg: "#0a0a0a", btnFg: "#fff" };
  return (
    <div style={{ padding: "2px 20px 22px", color: C.text }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: C.tile, display: "grid", placeItems: "center", fontSize: 30, margin: "0 auto 10px" }}>{bosIcon(goal?.emoji || "🎯", 30, goal?.color)}</div>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.3px" }}>Поделиться целью</div>
        <div style={{ fontSize: 14, color: C.sub, marginTop: 3 }}>«{goal?.name || "Цель"}» — расскажи, к чему идёшь</div>
      </div>
      <button onClick={doShare} className="tap" style={{ marginTop: 18, width: "100%", border: 0, borderRadius: 16, padding: "15px 16px", background: C.btnBg, color: C.btnFg, fontSize: 15.5, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <I.Share size={17} /> Поделиться ссылкой
      </button>
    </div>
  );
}

function MoodWidgetLive({ mood, app, isDark, navigate, flush = false }) {
  const _WD = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const _monOff = (new Date().getDay() + 6) % 7; // 0=Пн … 6=Вс — TODAY's slot in the week
  // Rebuilt only when the day-mood map (or today's slot) changes — not on every parent
  // re-render (this widget re-renders on any Home state change).
  const last7 = React.useMemo(() => [0, 1, 2, 3, 4, 5, 6].map(i => {
    const off = _monOff - i; // days ago (negative = a day later this week)
    const key = (typeof bosDayKeyOffset === "function") ? bosDayKeyOffset(off) : "";
    const di = (app?.dayMoods && app.dayMoods[key] != null) ? app.dayMoods[key] : null;
    return { key, today: i === _monOff, future: off < 0, wd: _WD[i], m: (di != null && MOOD_OPTIONS[di]) ? MOOD_OPTIONS[di] : null };
  }), [app?.dayMoods, _monOff]);
  const logged = last7.filter(d => d.m).length;
  const bg = isDark ? `linear-gradient(160deg, #1a1a1d 0%, #0d0d10 100%)` : `#ffffff`;
  const border = isDark ? "0" : "1px solid rgba(0,0,0,0.04)";
  const labelMuted = isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.50)";
  const subMuted   = isDark ? "rgba(255,255,255,0.60)" : "rgba(0,0,0,0.55)";
  const titleColor = isDark ? "#fff" : "var(--text)";
  const trailIdle  = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const trailRing  = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.28)";
  const chipBg     = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)";
  const _moodStreak = (typeof bosMoodStreak === "function") ? bosMoodStreak(app?.dayMoods) : 0;

  return (
    <button onClick={() => navigate("mood")} className="tap" data-tour="state"
      style={{
        marginTop: flush ? 0 : 12, width: "100%", border: flush ? "0" : border, textAlign: "left",
        background: bg,
        borderRadius: flush ? 0 : 22, padding: 18,
        position: "relative", overflow: "hidden",
        boxShadow: flush ? "none" : (isDark ? "none" : "0 1px 2px rgba(0,0,0,0.04)"),
        display: "block",
      }}>
      <div style={{ display: "flex", gap: 16, alignItems: "center", position: "relative" }}>
        <div style={{ position: "relative", flexShrink: 0, width: 72, height: 72, display: "grid", placeItems: "center" }}>
          <StateOrb size={72} tint={tintFromMood(mood.c)} intensity={isDark ? 1.25 : 1.05} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ fontSize: 11, color: labelMuted, textTransform: "uppercase", letterSpacing: 1.4, fontWeight: 600 }}>Состояние · сейчас</div>
            {_moodStreak >= 2 && (
              <span style={{ fontSize: 10, fontWeight: 700, color: isDark ? "#FF9A62" : "#a4541b", background: "rgba(255,138,91,0.16)", borderRadius: 999, padding: "2px 8px", letterSpacing: 0.3, whiteSpace: "nowrap" }}>
                🔥 {_moodStreak} {bosRuDays(_moodStreak)} подряд
              </span>
            )}
          </div>
          <div style={{ fontFamily: "var(--bos-title-font)", fontSize: 26, fontWeight: 600, lineHeight: 1.1, letterSpacing: "-0.6px", marginTop: 4, color: titleColor }}>{mood.t}</div>
          <div style={{ fontSize: 12, color: subMuted, marginTop: 4 }}>Отмечай каждый день: +5 XP, +10 со строкой в дневник. Удержишь неделю подряд — бонус +50 XP.</div>
        </div>
      </div>

      <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid " + (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"), display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        {last7.map((d, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, opacity: d.future ? 0.4 : 1 }}>
            {d.m ? (
              <span aria-label={d.m.t} style={{
                width: 22, height: 22, borderRadius: "50%", display: "block",
                boxShadow: d.today ? `0 0 0 2px ${trailRing}` : "none",
              }}>
                <MiniOrb size={22} tint={tintFromMood(d.m.c)} />
              </span>
            ) : (
              <span style={{
                width: 22, height: 22, borderRadius: "50%",
                background: trailIdle,
                boxShadow: d.today ? `0 0 0 2px ${trailRing}` : "none",
              }}/>
            )}
            <span style={{ fontSize: 9, color: labelMuted, fontWeight: 600 }}>{d.wd}</span>
          </div>
        ))}
        <span style={{
          fontSize: 10, fontWeight: 600, letterSpacing: 0.3,
          color: subMuted, background: chipBg, borderRadius: 999, padding: "4px 9px",
          flexShrink: 0,
        }}>
          {logged}/7 отмечено
        </span>
      </div>
    </button>
  );
}

/* Home-hero avatar — David: «орб-состояние из-под аватарки убрать, поставить наш стандартный
   кружок со стеклом». A STATIC grey glass disc (the SAME material as the people discs and the
   pencil button), holding the user's REAL avatar (photo / memoji / emoji / default face via
   BosAvatar). The tile sheen + a bright top rim sit ON TOP so it reads as glass — no mood tint,
   no animated orb. Drop-in for HeroOrbFace (same avatar / inset / size props). */
function HeroAvatarGlassLive({ avatar, inset = 6, size = 60 }) {
  return (
    <div style={{ position: "absolute", inset, borderRadius: "50%", overflow: "hidden",
      background: "linear-gradient(150deg, #eef1f6, #dadfe7)", boxShadow: "0 2px 7px rgba(0,0,0,0.12)" }}>
      <BosAvatar avatar={avatar} size={size} style={{ position: "absolute", inset: 0, borderRadius: "50%" }} />
      <span aria-hidden style={{ position: "absolute", inset: 0, borderRadius: "50%", pointerEvents: "none",
        background: BOS_TILE_SHEEN,
        boxShadow: "inset 0 1px 1.5px rgba(255,255,255,0.9), inset 0 -3px 6px rgba(0,0,0,0.07), inset 0 0 0 0.5px rgba(0,0,0,0.06)" }} />
    </div>
  );
}

/* Account avatar for the «Сводка от ИИ» hero — the glass disc + a MINIMALIST XP-to-next-level
   ring (gold light→dark + glass sheen). David: «верни аватар в блок сводки — это главный блок с
   фишкой ИИ; колечко минималистичное = XP до уровня». Tap → profile (orbits + settings). */
function HeroAccountAvatarLive({ navigate, avatar, pct = 0, size = 60, isDark, level = 0 }) {
  const r = size / 2 - 2;              // ring radius (strokeWidth 2.5, ~1.25 margin each side)
  const C = 2 * Math.PI * r;
  const off = C * (1 - (pct || 0) / 100);
  const lvlSz = Math.round(size * 0.34); // level badge ≈ a third of the avatar
  return (
    <button onClick={() => navigate("profile")} className="tap" title="Профиль" aria-label="Профиль, орбиты и настройки"
      style={{ flexShrink: 0, position: "relative", width: size, height: size, background: "transparent", border: 0, padding: 0, cursor: "pointer" }}>
      <svg width={size} height={size} viewBox={"0 0 " + size + " " + size} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)", zIndex: 2 }}>
        <defs>
          <linearGradient id="bosXpRingH" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFE777"/><stop offset="0.5" stopColor="#F4B72A"/><stop offset="1" stopColor="#E08A00"/></linearGradient>
          <linearGradient id="bosXpSheenH" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="rgba(255,255,255,0.82)"/><stop offset="0.45" stopColor="rgba(255,255,255,0)"/></linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"} strokeWidth="2.5" fill="none"/>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="url(#bosXpRingH)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={off} style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.22,0.61,0.36,1)" }}/>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="url(#bosXpSheenH)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={off} style={{ mixBlendMode: "screen" }}/>
      </svg>
      {/* Disc pulled IN from the ring (inset 7 → ~4px card-colour gap) so the gold ring and the glass
          circle read as two distinct elements — without the gap the disc sat flush under the ring and
          the glass was invisible (David: «дать колечку чуть пространства от кружочка со стеклом»). */}
      <HeroAvatarGlassLive avatar={avatar} inset={7} size={size - 14} />
      {/* Цифра текущего УРОВНЯ — золотой бейдж, ЦЕНТРИРОВАННЫЙ на самом кольце в нижне-ПРАВОЙ точке
          (45°), а не у края аватара (David: «чуть правее снизу, по центру кольца — так не перекрывает
          лицо»). bc = точка окружности кольца на 45°; бейдж ставим центром на неё. */}
      {level > 0 && (() => {
        const bc = size / 2 + r * 0.7071;   // точка на кольце под углом 45° (низ-право)
        return (
          <span aria-hidden style={{ position: "absolute", left: bc - lvlSz / 2, top: bc - lvlSz / 2, zIndex: 3, minWidth: lvlSz, height: lvlSz, padding: "0 4px", boxSizing: "border-box", borderRadius: 999, background: "linear-gradient(180deg,#FFE777,#F4B72A)", color: "#4a3800", fontSize: Math.round(lvlSz * 0.56), fontWeight: 800, lineHeight: (lvlSz - 3) + "px", textAlign: "center", letterSpacing: "-0.3px", border: "1.5px solid var(--card)", boxShadow: "0 1px 3px rgba(224,138,0,0.5), inset 0 1px 0.5px rgba(255,255,255,0.6)" }}>{level}</span>
        );
      })()}
    </button>
  );
}

/* HomeHeroSwipe → live-only: the real new user's hero — page 1 ONLY (the demo's balance
   wheel / orbit 2nd page was removed). newbie (no habits) → "С чего начать" hints; else →
   AI-brief summary + action pills. The account avatar (XP ring) lives here — the main AI block. */
function HomeHeroSwipeLive({ navigate, doneCount, totalCount, ringPct, isDark }) {
  const { open: _openSheet } = (typeof useSheet === "function") ? useSheet() : { open: () => {} };
  const [ringShown, setRingShown] = React.useState(0);
  React.useEffect(() => { const t = setTimeout(() => setRingShown(ringPct), 80); return () => clearTimeout(t); }, [ringPct]);
  const heroApp = useApp ? useApp() : null;
  const mood = heroApp?.mood;
  const moodTint = (mood && typeof tintFromMood === "function") ? tintFromMood(mood.c) : null;
  // Live newbie = a real Telegram user who just signed in and has no habits yet.
  const newbie = (heroApp?.habits?.length || 0) === 0;
  // Pills use bosChipGlass(isDark) — grey glass, identical to the Habits «Быстрое добавление» chips.
  const cardBg   = isDark
    ? "linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)"
    : "linear-gradient(160deg, #ffffff 0%, #f5f5f5 100%)";
  const cardBd   = isDark ? "0" : "1px solid rgba(0,0,0,0.04)";
  const ringBg   = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const AI_BRIEF = {
    "Энергия":     "Энергии много — берись за самое важное сейчас.",
    "Радость":     "Ты в ресурсе — отличный день, чтобы закрыть серию.",
    "Спокойствие": "Спокойствие — твоё время для глубокого чтения.",
    "Тревога":     "Начни с двух минут дыхания — и день станет легче.",
    "Упадок":      "Сделай одно маленькое дело — этого сегодня достаточно.",
    "Усталость":   "Сбавь темп: закрой одну привычку — и довольно.",
  };
  const aiBrief = (totalCount && doneCount >= totalCount)
    ? "День закрыт — ты в потоке. Так держи ритм."
    : (AI_BRIEF[mood && mood.t] || "Чтение легче даётся вечером — оставь его на потом.");
  // For LIVE the summary + pills come from the AI login brief (heuristic fallback if absent).
  const _liveBrief = heroApp?.aiBrief || null;
  const _homeSummary = (_liveBrief && _liveBrief.summary) || aiBrief;
  const _livePills = (_liveBrief && Array.isArray(_liveBrief.pills) && _liveBrief.pills.length)
    ? ((typeof bosMixPillsLive === "function") ? bosMixPillsLive(_liveBrief.pills.slice(0, 4), heroApp) : _liveBrief.pills.slice(0, 4)) : null;
  const _pillsKey = _livePills ? _livePills.map(bosPillLabel).join("|") : "live";
  // XP-to-next-level percent for the minimalist avatar ring (today's progress lives in the
  // «Привычки» card + «Эта неделя», so the ring is freed for level progress — David's call).
  const _heroXp = (typeof bosLiveXPLive === "function") ? bosLiveXPLive(heroApp) : 0;
  const _heroLI = ((typeof bosLevelInfoLive === "function") ? bosLevelInfoLive(_heroXp) : null) || {};
  const _heroPct = _heroLI.pct || 0;
  const _heroLevel = _heroLI.level || 0;

  const page1 = newbie ? (
    <div key="hints" style={{ position: "relative", padding: 16, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 13, alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div key={_homeSummary} style={{ fontSize: 13, fontWeight: 400, color: "var(--text)", lineHeight: 1.45, letterSpacing: "-0.1px", animation: _liveBrief ? "briefFade 0.5s ease both" : undefined }}><span style={{ display: "inline-block", verticalAlign: "-2px", marginRight: 6 }}><I.Sparkles size={13} color="#EF9F14" filled strokeWidth={0} /></span>{_liveBrief ? _homeSummary : "Расскажи о себе — и я подскажу, с каких привычек начать."}</div>
        </div>
        <HeroAccountAvatarLive navigate={navigate} avatar={heroApp?.avatar} pct={_heroPct} level={_heroLevel} size={56} isDark={isDark} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {[
          { i: "🙋", t: "Рассказать о себе", go: () => navigate("ai-chat", { prompt: "Я хочу рассказать о себе — задай мне пару коротких вопросов и подскажи, с каких привычек начать." }) },
          { i: "➕", t: "Создать привычку",  go: () => _openSheet(<HabitFormSheetLive mode="create" navigate={navigate} />) },
          { i: "🧭", t: "Как всё устроено",  go: () => navigate("guide") },
          { i: "✨", t: "Спросить ИИ",        go: () => navigate("ai-chat") },
        ].map((c, i) => (
          <button key={i} onClick={c.go} className="tap" style={{
            padding: "6px 12px", fontSize: 12, color: "var(--text-2)",
            ...bosChipGlass(isDark), border: 0, minWidth: 0, maxWidth: "calc(50% - 3px)",
            borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 6,
          }}><span style={{ flexShrink: 0 }}>{c.i}</span><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.t}</span></button>
        ))}
      </div>
    </div>
  ) : (
    <div key="quote" style={{ position: "relative", padding: 16, boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div key={_homeSummary} style={{ fontSize: 13, fontWeight: 400, color: "var(--text)", lineHeight: 1.45, letterSpacing: "-0.1px", animation: "briefFade 0.5s ease both" }}>
            <span style={{ display: "inline-block", verticalAlign: "-2px", marginRight: 6 }}><I.Sparkles size={13} color="#EF9F14" filled strokeWidth={0} /></span>{_homeSummary}
          </div>
        </div>
        <HeroAccountAvatarLive navigate={navigate} avatar={heroApp?.avatar} pct={_heroPct} level={_heroLevel} size={64} isDark={isDark} />
      </div>
      <div key={_pillsKey} style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
        {(_livePills || ((typeof bosMixPillsLive === "function") ? bosMixPillsLive : (x) => x)([
          { i: "✨", t: "ИИ: спланируй день" },
          { i: "🔮", t: "Познай себя" },
          { i: "🧘🏼‍♀️", t: "Медитация 5 мин" },
          { i: "📖", t: "Открыть дневник" },
        ], heroApp)).map((c, i) => (
          <button key={i} onClick={() => bosRoutePill(navigate, c)} className="tap" style={{
            padding: "6px 12px", fontSize: 12, color: "var(--text-2)",
            ...bosChipGlass(isDark), border: 0, minWidth: 0, maxWidth: "calc(50% - 3px)",
            borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 6,
            animation: _livePills ? ("briefPop 0.45s cubic-bezier(0.22,0.9,0.3,1.2) both " + (i * 0.06) + "s") : undefined,
          }}><span style={{ flexShrink: 0 }}>{bosPillIcon(c)}</span><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{bosPillLabel(c)}</span></button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{
      background: cardBg,
      border: cardBd,
      borderRadius: 22, position: "relative", overflow: "hidden", transform: "translateZ(0)",
      boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
    }}>
      <div style={{ display: "flex", width: "100%" }}>
        <div style={{ width: "100%", flexShrink: 0 }}>{page1}</div>
      </div>
    </div>
  );
}

/* CloudTeamsDiscoverLive — live-only fork of core's CloudTeamsDiscover. Same cloud fetch
   + join flow, but QUIET while loading: for a real user the «open teams nearby» result is
   usually empty, and the core version shows a skeleton that then collapses to nothing —
   a flash-then-vanish at the page bottom (David: «показывает на секунду, потом исчезает»).
   Here it stays silent until real teams arrive, then the section appears once, below the
   create-CTA, shifting nothing above it. The frozen demo keeps core's CloudTeamsDiscover. */
function CloudTeamsDiscoverLive({ app }) {
  const [list, setList] = React.useState(null);
  const [busy, setBusy] = React.useState({});
  const [requested, setRequested] = React.useState({});
  React.useEffect(() => {
    let on = true;
    try {
      if (window.bosCloud && window.bosCloud.enabled()) {
        window.bosCloud.discoverTeams().then((ts) => { if (on) setList(Array.isArray(ts) ? ts : []); }).catch(() => { if (on) setList([]); });
      } else setList([]);
    } catch (e) { setList([]); }
    return () => { on = false; };
  }, []);
  // While LOADING (null) → render nothing (no promissory skeleton that pops then collapses).
  // Once LOADED-EMPTY ([]) → a warm, HONEST invite: «Найти» is the community pulse, so the live
  // section shouldn't read as a dead blank — but we never fabricate circles that don't exist.
  if (!list) return null;
  if (!list.length) return (
    <div style={{ marginTop: 6 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-4)", padding: "4px 4px 8px" }}>🌐 Открытые круги</div>
      <div style={{ background: "var(--card)", borderRadius: 22, padding: "22px 18px", boxShadow: "var(--card-shadow)", textAlign: "center" }}>
        <div style={{ fontSize: 30, lineHeight: 1 }}>🌱</div>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text)", marginTop: 9, letterSpacing: "-0.2px" }}>Здесь оживут круги людей</div>
        <div style={{ fontSize: 12.5, color: "var(--text-4)", marginTop: 5, lineHeight: 1.45, maxWidth: 250, margin: "5px auto 0" }}>Начни челлендж выше или позови друга — и ваш круг появится тут первым.</div>
      </div>
    </div>
  );
  // Send a JOIN REQUEST («из поиска — по заявке»). The creator approves it later; pre-SQL
  // (no approval system yet) the call falls back to an instant join.
  const join = (t) => {
    setBusy((b) => Object.assign({}, b, { [t.id]: true }));
    try {
      window.bosCloud.requestJoin(t.id).then((res) => {
        setBusy((b) => Object.assign({}, b, { [t.id]: false }));
        if (!res) return;
        if (res.pending) { setRequested((r) => Object.assign({}, r, { [t.id]: true })); return; }
        // fallback: actually joined → add to my teams + drop from the discover list
        window.bosCloud.teamMembers(t.id).then((mem) => {
          if (app && app.addTeam) app.addTeam({
            cloudId: t.id, joined: true, name: t.name, emblem: t.emblem || "✨", accent: "#dbe9ff",
            vis: t.vis, goal: "Общая цель", target: t.goalTarget || 0,
            current: 0, unit: "", date: "", progress: 0,
            members: (mem || []).map((m) => ({ name: m.name || "Участник", initials: (m.name || "?").slice(0, 1), color: "#cfe1ff", avatar: m.avatar, pct: 0 })),
          });
          setList((l) => (l || []).filter((x) => x.id !== t.id));
        });
      });
    } catch (e) { setBusy((b) => Object.assign({}, b, { [t.id]: false })); }
  };
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-4)", padding: "4px 4px 8px" }}>🌐 Открытые круги</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {list.map((t) => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--card)", borderRadius: 22, padding: 14, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
            <span style={{ width: 44, height: 44, borderRadius: 14, background: "linear-gradient(150deg, #eef1f6, #dadfe7)", boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.06)", display: "grid", placeItems: "center", fontSize: 24, flexShrink: 0 }}>{bosIcon(t.emblem || "✨", 24, null)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15.5, fontWeight: 600, color: "var(--text)" }}>{t.name}</div>
              <div style={{ marginTop: 5 }}><span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "var(--text-2)", ...bosChipGlass(false), padding: "3px 9px", borderRadius: 999 }}>🌐 Открытая · {t.members} участ.</span></div>
            </div>
            <button onClick={() => join(t)} disabled={busy[t.id] || requested[t.id]} className="tap" style={{ flexShrink: 0, background: (busy[t.id] || requested[t.id]) ? "var(--card-2)" : "#0a0a0a", color: (busy[t.id] || requested[t.id]) ? "var(--text-3)" : "#fff", border: 0, borderRadius: 999, padding: "9px 16px", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>{requested[t.id] ? "Заявка отправлена" : busy[t.id] ? "…" : "Вступить"}</button>
          </div>
        ))}
      </div>
    </div>
  );
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
const SEED_CIRCLES = [
  { id: "seed-spark",    name: "Разогрев",       emblem: "⚡", goalText: "3 дня",   target: 3,  unit: "дня",  type: "streak",     reward: 60,  hook: "Три дня подряд — поймай ритм",          practice: { name: "Мой первый шаг", emoji: "⚡" } },
  { id: "seed-week",     name: "Неделя силы",    emblem: "💪", goalText: "7 дней",  target: 7,  unit: "дней", type: "streak",     reward: 120, hook: "Семь дней без пропусков",               practice: { name: "Зарядка",        emoji: "💪" } },
  { id: "seed-steps",    name: "10 000 шагов",   emblem: "👟", goalText: "14 дней", target: 14, unit: "дней", type: "collective", reward: 200, hook: "Две недели движения — счёт общий",      practice: { name: "Прогулка",       emoji: "👟" } },
  { id: "seed-morning",  name: "Утро чемпионов", emblem: "🌅", goalText: "21 день", target: 21, unit: "дней", type: "streak",     reward: 250, hook: "Вставай раньше — задаёшь тон дню",       practice: { name: "Ранний подъём",  emoji: "⏰" } },
  { id: "seed-meditate", name: "Тихий час",      emblem: "🧘", goalText: "30 дней", target: 30, unit: "дней", type: "streak",     reward: 300, hook: "5 минут тишины каждый день — месяц",     practice: { name: "Медитация",      emoji: "🧘" } },
  { id: "seed-read",     name: "Книжный клуб",   emblem: "📚", goalText: "месяц",   target: 30, unit: "дней", type: "collective", reward: 300, hook: "По главе в день — за месяц целая книга", practice: { name: "Чтение",         emoji: "📖" } },
];
function SeedCirclesShowcaseLive({ app, navigate }) {
  const start = (s) => {
    if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} }
    const existing = (app?.teams || []).find((t) => t.seedId === s.id);
    if (existing) { navigate("team-detail", { team: existing }); return; } // уже начал → просто в круг
    const teamObj = {
      name: s.name, emblem: s.emblem, accent: s.accent, vis: "private", seedId: s.id,
      goal: s.goalText, type: s.type, target: s.target || 0, current: 0, unit: s.unit || "",
      stake: s.reward || 0, date: "", progress: 0, members: [],   // ПРИЗ за финиш = ставка (unlock-only, без списания)
    };
    const nt = app?.addTeam(teamObj);                    // круг → сразу в «Целях» (офлайн-ок)
    const practiceHabit = { name: s.practice.name, emoji: s.practice.emoji, color: null, days: [1, 1, 1, 1, 1, 1, 1], goalPerDay: 1, reminder: { on: false, time: "09:00" }, log: {} };
    let opened = false;
    try {
      if (nt && window.bosCloud && window.bosCloud.enabled()) {
        window.bosCloud.createTeam({ name: s.name, emblem: s.emblem, vis: "private", goalKind: s.goalText, goalTarget: s.target || 0, goal: { type: s.type, target: s.target || 0, unit: s.unit || "", title: s.name, stake: s.reward || 0 } })
          .then(async (row) => {
            if (row && row.id) {
              if (app.updateTeam) app.updateTeam(nt._id, { cloudId: row.id });
              let th = null; try { th = await window.bosCloud.addTeamHabit(row.id, { name: s.practice.name, emoji: s.practice.emoji, isMain: true }); } catch (e) {}
              app?.addHabit({ ...practiceHabit, teamId: row.id, teamHabitId: th && th.id });
            } else { app?.addHabit(practiceHabit); }
            navigate("team-detail", { team: { ...nt, cloudId: row && row.id } });
          })
          .catch(() => { app?.addHabit(practiceHabit); navigate("team-detail", { team: nt }); });
        opened = true;
      }
    } catch (e) {}
    if (!opened) { app?.addHabit(practiceHabit); navigate("team-detail", { team: nt }); } // офлайн/превью
  };
  // Honest XP framing: the practice habit a challenge plants earns the SAME +10 XP per day as
  // any habit (bosTotalXPLive). So «давать экспу за челлендж» = surface that real reward — no
  // fabricated bonus. Gold pill = the app's reward/XP language (level badge, achievement XP).
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "4px 4px 10px" }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-4)" }}>🔥 Челленджи</span>
        <span style={{ fontSize: 11.5, color: "var(--text-4)" }}>вступай за секунду →</span>
      </div>
      {/* Горизонтальная лента, не вертикальная стена (David: «много челленджей не делай — в ленте
          должна быть и сама жизнь»). Карточки скроллятся вбок, оставляя место живым кругам ниже. */}
      <div className="bos-hscroll" style={{ display: "flex", gap: 11, overflowX: "auto", padding: "0 0 4px", scrollSnapType: "x proximity", WebkitOverflowScrolling: "touch" }}>
        {SEED_CIRCLES.map((s) => {
          const joined = (app?.teams || []).some((t) => t.seedId === s.id);
          return (
            <div key={s.id} className="tap" onClick={() => start(s)} style={{ flex: "0 0 auto", width: 162, scrollSnapAlign: "start", background: "var(--card)", borderRadius: 22, padding: 14, boxShadow: "var(--card-shadow)", cursor: "pointer", display: "flex", flexDirection: "column" }}>
              <span style={{ width: 44, height: 44, borderRadius: 14, background: "linear-gradient(150deg, #eef1f6, #dadfe7)", boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.06)", display: "grid", placeItems: "center", fontSize: 23, flexShrink: 0 }}>{bosIcon(s.emblem, 23, null)}</span>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.2px", marginTop: 11, lineHeight: 1.25 }}>{s.name}</div>
              <div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 3, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: 31 }}>{s.hook}</div>
              <div style={{ flex: 1, minHeight: 10 }} />
              {/* Срок (условие бонуса) + награда. Duration chip = серое стекло «⏱ N дней»; reward =
                  графит+золото «+N XP» (язык XP-бейджа, David: бейдж был кривой/мутный). Вместе они
                  читаются как «продержись N дней → +N XP за финиш». */}
              <div style={{ alignSelf: "flex-start", display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 4, ...bosChipGlass(false), padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 600, color: "var(--text-2)" }}>⏱ {s.goalText}</span>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", background: "#0a0a0a", color: "#FEDE34", fontWeight: 700, fontSize: 11, letterSpacing: "0.2px", borderRadius: 999, padding: "3px 9px" }}>+{s.reward} XP</span>
                  <span style={{ fontSize: 10.5, color: "var(--text-4)", fontWeight: 600 }}>за финиш</span>
                </div>
              </div>
              <span style={{ marginTop: 9, fontSize: 12.5, fontWeight: 600, color: joined ? "var(--text-4)" : "var(--text-2)", display: "inline-flex", alignItems: "center", gap: 2 }}>{joined ? "Открыть" : "Начать"} <I.ChevronRight size={14}/></span>
            </div>
          );
        })}
      </div>
    </div>
  );
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
var BOS_PARTNERS = [
  { id: "medit",   name: "Открытая медитация", emblem: "🧘", accent: "#B9D4FF", cost: 250, used: 150, tags: ["Ум", "Покой"],
    what: "Час осознанности с гидом в студии",
    about: "Спокойная групповая практика: дыхание, сканирование тела и тишина под руководством гида. Новичкам — самое то, опыт не нужен.",
    address: "Студия «Тишина» · ул. Пушкина, 12", dates: "Пн и Чт · 19:00", duration: "60 мин", limit: "до 12 мест", perk: "Ачивка «Тихий ум»" },
  { id: "bachata", name: "Урок бачаты",        emblem: "💃", accent: "#FFC7DD", cost: 350, used: 350, tags: ["Танец", "Тело"],
    what: "Первое занятие в танцевальной студии",
    about: "Базовые шаги и связки бачаты в лёгкой атмосфере. Партнёр не нужен — распределят на месте, менять можно свободно.",
    address: "Танцстудия «Ритмо» · пр. Мира, 8", dates: "Вт и Сб · 20:00", duration: "75 мин", limit: "до 20 пар", perk: "Ачивка «Первый танец»" },
  { id: "box",     name: "Пробный бокс",       emblem: "🥊", accent: "#FFCFAD", cost: 400, used: 70, tags: ["Сила", "Энергия"],
    what: "Тренировка с личным тренером",
    about: "Постановка техники, работа на лапах и мешке под присмотром тренера. Бинты и перчатки выдают на месте.",
    address: "Зал «Ринг» · ул. Лесная, 3", dates: "По будням · 18:00–21:00", duration: "60 мин", limit: "до 8 мест", perk: "Ачивка «Первый раунд»" },
  { id: "yoga",    name: "Йога на рассвете",   emblem: "🧘‍♀️", accent: "#BFEECF", cost: 250, used: 210, tags: ["Тело", "Гибкость"],
    what: "Утренняя практика в парке",
    about: "Мягкая виньяса на свежем воздухе — встречаем рассвет и бережно тянемся. Коврик можно взять на месте.",
    address: "Парк Горького · южный вход", dates: "Сб и Вс · 7:30", duration: "50 мин", limit: "до 30 мест", perk: "Ачивка «Рассвет»" },
  { id: "coffee",  name: "Кофе-встреча",       emblem: "☕", accent: "#F0DCB0", cost: 150, used: 480, tags: ["Отдых", "Люди"],
    what: "Чашка в партнёрской кофейне",
    about: "Спешелти-кофе и тёплое знакомство с людьми из твоего круга. Приходи один — уйдёшь не один.",
    address: "Кофейня «Зерно» · ул. Кофейная, 1", dates: "Каждый день · 9:00–20:00", duration: "—", limit: "до 6 гостей", perk: "Ачивка «Свой круг»" },
  { id: "art",     name: "Арт-вечер",          emblem: "🎨", accent: "#D8C4FF", cost: 300, used: 50, tags: ["Творчество", "Поток"],
    what: "Живопись с нуля, без опыта",
    about: "Вечер интуитивной живописи: холст, краски и никакого «правильно». Всё для работы выдают на месте.",
    address: "Арт-пространство «Мазок» · ул. Радужная, 5", dates: "Пт · 19:00", duration: "120 мин", limit: "до 15 мест", perk: "Ачивка «Первый мазок»" },
];
function bosLoadRedeemedPartners() { try { return JSON.parse(localStorage.getItem("bos:redeemedPartners") || "{}") || {}; } catch (e) { return {}; } }
// Общий помощник: пометить партнёра полученным (списание XP делает вызывающий через app.spendXP).
function bosMarkPartnerRedeemed(id) { var n = Object.assign({}, bosLoadRedeemedPartners(), { [id]: true }); try { localStorage.setItem("bos:redeemedPartners", JSON.stringify(n)); } catch (e) {} try { window.dispatchEvent(new Event("bos:partnersChanged")); } catch (e) {} return n; }

// Горизонтальная лента партнёров про ТРАТУ XP. Цветные карточки-впечатления (см. ниже). Тап по карточке →
// нативная страница партнёра PartnerDetailLive (описание, адрес, даты, кнопка «Получить»).
function PartnersShowcaseLive({ app, navigate, from = "community" }) {
  const [redeemed, setRedeemed] = React.useState(bosLoadRedeemedPartners);
  React.useEffect(function () {
    var h = function () { setRedeemed(bosLoadRedeemedPartners()); };
    window.addEventListener("bos:partnersChanged", h); // деталь-страница выкупила → карточка тут же ✓
    return function () { window.removeEventListener("bos:partnersChanged", h); };
  }, []);
  const openPartner = (p) => {
    if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} }
    navigate("partner-detail", { partner: p, from: from });
  };
  // Карточки НАМЕРЕННО другого вида, чем привычки/челленджи (David: «партнёры — это НЕ привычки»). Привычка/
  // челлендж = белый тайл + серый значок. Партнёр = ЦВЕТНАЯ карточка целиком (насыщенный accent + светлый
  // градиент сверху для глубины + КРУПНЫЙ эмодзи без серого тайла) → «карточка-впечатление», отдельный вид.
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "4px 4px 10px" }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-4)" }}>🎁 Потратить XP</span>
        <span style={{ fontSize: 11.5, color: "var(--text-4)" }}>живое от партнёров →</span>
      </div>
      {/* padding-bottom 18 — иначе overflow-y (авто из-за overflow-x) СРЕЗАЕТ тень карточек в серую
          полосу «внизу обрезается» (David). Тень мягкая, чтобы не мутить фон. */}
      <div className="bos-hscroll" style={{ display: "flex", gap: 11, overflowX: "auto", padding: "3px 0 18px", scrollSnapType: "x proximity", WebkitOverflowScrolling: "touch" }}>
        {BOS_PARTNERS.map((p) => {
          const got = !!redeemed[p.id];
          return (
            <div key={p.id} className="tap" onClick={() => openPartner(p)} style={{ flex: "0 0 auto", width: 170, scrollSnapAlign: "start", borderRadius: 22, padding: 15, background: "linear-gradient(158deg, rgba(255,255,255,0.5), rgba(255,255,255,0) 58%), " + p.accent, boxShadow: "0 4px 11px rgba(50,40,20,0.10), inset 0 0 0 0.5px rgba(255,255,255,0.55)", cursor: "pointer", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {/* Человечек-счётчик — В ВЕРХНЕМ углу, не в нижнем ряду (David: там он ужимал
                  пилюлю цены и сам не читался). Тихий, но на свободном воздухе — считывается. */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <span style={{ fontSize: 36, lineHeight: 1 }}>{p.emblem}</span>
                {p.used > 0 && <span title={p.used + " человек посетили"} style={{ display: "inline-flex", alignItems: "center", gap: 3.5, fontSize: 11, fontWeight: 600, color: "rgba(27,27,31,0.48)", paddingTop: 3, whiteSpace: "nowrap" }}><I.Users size={11.5} strokeWidth={2.2} /> посетили {p.used}</span>}
              </div>
              <div style={{ fontSize: 15.5, fontWeight: 700, color: "#1b1b1f", marginTop: 12, letterSpacing: "-0.2px", lineHeight: 1.2 }}>{p.name}</div>
              <div style={{ fontSize: 11.5, color: "rgba(27,27,31,0.62)", marginTop: 3, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: 31 }}>{p.what}</div>
              <div style={{ flex: 1, minHeight: 12 }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.82)", color: "#0a0a0a", fontWeight: 800, fontSize: 11.5, borderRadius: 999, padding: "4px 10px" }}>🪙 {p.cost}</span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: got ? "#1E8E4E" : "#0a0a0a", display: "inline-flex", alignItems: "center", gap: 2 }}>{got ? <I.Check size={14} strokeWidth={3}/> : <>Открыть <I.ChevronRight size={13}/></>}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// СТРАНИЦА ПАРТНЁРА — нативная деталь (iOS-стиль): цветной hero в тон партнёру + крупный эмодзи, описание,
// сгруппированная карточка «где / когда / сколько» (line-иконки, hairline-разделители) и ЛИПКАЯ frosted-
// кнопка «Получить за N XP» внизу. Заменяет прежнюю шторку (David: хочу ПОПАДАТЬ на страницу с адресом/
// датами). Списывает копилку app.spendXP; bosMarkPartnerRedeemed помечает получённым + шлёт событие, чтобы
// карточки в лентах сразу встали ✓.
function PartnerDetailLive() {
  const { navigate, params } = useNav();
  const app = (typeof useApp === "function") ? useApp() : null;
  const p = (params && params.partner) || BOS_PARTNERS[0];
  const back = (params && params.from) || "community";
  const isDark = app && app.themeOverride === "dark";
  const [got, setGot] = React.useState(function () { return !!bosLoadRedeemedPartners()[p.id]; });
  const balance = (typeof bosLiveSpendableXPLive === "function") ? bosLiveSpendableXPLive(app) : 0;
  const afford = balance >= p.cost;
  const redeem = () => {
    if (got || !afford) return;
    if (app && typeof app.spendXP === "function" && app.spendXP(p.cost)) {
      bosMarkPartnerRedeemed(p.id); setGot(true);
      if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} }
    }
  };
  const info = [
    { icon: <I.MapPin size={16} strokeWidth={2} />, l: "Где", v: p.address },
    { icon: <I.Calendar size={16} strokeWidth={2} />, l: "Когда", v: p.dates },
    { icon: <I.Clock size={16} strokeWidth={2} />, l: "Сколько", v: p.duration },
  ].filter((r) => r.v && r.v !== "—");
  return (
    <div className="page-in" style={{ paddingBottom: 112 }}>
      {/* HERO — цвет партнёра, крупный эмодзи; круглая полупрозрачная «назад» поверх. */}
      {/* FULL-BLEED: цвет тянется до самого верха (перекрывает 60px safe-area .bos-page отрицательным
          margin'ом), поэтому НЕТ белой полосы сверху; квадратный верх теперь у самого края экрана. */}
      <div style={{ position: "relative", background: "linear-gradient(180deg, rgba(255,255,255,0.26), rgba(255,255,255,0) 44%), " + p.accent, marginTop: "calc(-1 * max(60px, var(--tg-top-inset, env(safe-area-inset-top, 0px))))", padding: "calc(max(60px, var(--tg-top-inset, env(safe-area-inset-top, 0px))) + 14px) 22px 30px", borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}>
        <button onClick={() => navigate(back)} className="tap" aria-label="Назад" style={{ width: 38, height: 38, borderRadius: "50%", border: 0, background: "rgba(255,255,255,0.55)", display: "grid", placeItems: "center", cursor: "pointer", color: "#1b1b1f" }}>
          <I.ChevronLeft size={20} strokeWidth={2.4} />
        </button>
        <div style={{ fontSize: 60, lineHeight: 1, marginTop: 18 }}>{p.emblem}</div>
        <div style={{ fontSize: 27, fontWeight: 800, color: "#161619", letterSpacing: "-0.6px", marginTop: 14, lineHeight: 1.05 }}>{p.name}</div>
        <div style={{ fontSize: 14.5, color: "rgba(22,22,25,0.62)", marginTop: 5, lineHeight: 1.4 }}>{p.what}</div>
        {/* Чипы = «характеристики» (David: хочу больше и по делу): что развивает (Ум/Покой), ограничение
            мест (👥 exclusivity/urgency), НАГРАДА в приложении (🏅 ачивка) и социальное доказательство
            (серый человечек — сколько людей уже потратили тут свою XP). */}
        <div style={{ display: "flex", gap: 6, marginTop: 13, flexWrap: "wrap" }}>
          {p.tags.map((t, i) => <span key={i} style={{ background: "rgba(255,255,255,0.6)", borderRadius: 999, padding: "4px 11px", fontSize: 11.5, color: "#2a2a30", fontWeight: 600 }}>{t}</span>)}
          {/* «посетили N» — понятное слово вместо «уже N» (David: «уже 150 — вообще непонятно»). */}
          {p.used > 0 && <span style={{ background: "rgba(255,255,255,0.6)", borderRadius: 999, padding: "4px 11px", fontSize: 11.5, color: "rgba(42,42,48,0.72)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}><I.Users size={12} strokeWidth={2.2} /> посетили {p.used}</span>}
          {p.limit && <span style={{ background: "rgba(255,255,255,0.6)", borderRadius: 999, padding: "4px 11px", fontSize: 11.5, color: "#2a2a30", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>👥 {p.limit}</span>}
          {p.perk && <span style={{ background: "rgba(255,255,255,0.92)", borderRadius: 999, padding: "4px 11px", fontSize: 11.5, color: "#0a0a0a", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4, boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}>🏅 {p.perk}</span>}
        </div>
      </div>

      <div style={{ padding: "20px 16px 0" }}>
        <div style={{ fontSize: 15, color: "var(--text-2)", lineHeight: 1.5 }}>{p.about}</div>

        {info.length > 0 && (
          <div style={{ background: "var(--card)", borderRadius: 18, marginTop: 18, boxShadow: "var(--card-shadow)", overflow: "hidden" }}>
            {info.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 15px", borderTop: i ? "1px solid var(--line)" : 0 }}>
                <span style={{ width: 30, height: 30, borderRadius: 9, background: "var(--surface-3)", display: "grid", placeItems: "center", color: "var(--text-3)", flexShrink: 0 }}>{r.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11.5, color: "var(--text-4)", fontWeight: 600 }}>{r.l}</div>
                  <div style={{ fontSize: 14.5, color: "var(--text)", marginTop: 1, fontWeight: 500 }}>{r.v}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "flex-start", gap: 9, marginTop: 15, padding: "0 2px" }}>
          <span style={{ fontSize: 15, lineHeight: 1.4 }}>🪙</span>
          <div style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.45 }}>Платишь <b style={{ color: "var(--text-2)" }}>{p.cost} XP</b> из копилки — не деньгами. Уровень от траты не падает.</div>
        </div>
      </div>

      {/* Липкий frosted action-bar — нативный низ. */}
      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, padding: "12px 16px calc(14px + var(--tg-bottom-inset, 0px))", background: isDark ? "rgba(18,20,26,0.8)" : "rgba(244,244,246,0.82)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", borderTop: "1px solid var(--line)", zIndex: 5 }}>
        {got ? (
          <div style={{ background: "rgba(52,199,89,0.14)", color: "#1E8E4E", borderRadius: 16, padding: "13px", textAlign: "center", fontWeight: 700, display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, fontSize: 15 }}><I.Check size={17} strokeWidth={3} /> Получено</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-3)" }}>Покажи этот экран на входе к партнёру</span>
          </div>
        ) : (
          <button onClick={redeem} disabled={!afford} className="tap" style={{ width: "100%", background: afford ? "#0a0a0a" : "var(--surface-3)", color: afford ? "#fff" : "var(--text-4)", border: 0, borderRadius: 16, padding: 16, fontSize: 16, fontWeight: 700 }}>
            {afford ? ("Получить за " + p.cost + " XP") : ("Нужно ещё " + (p.cost - balance) + " XP")}
          </button>
        )}
      </div>
    </div>
  );
}

/* «Собери свой круг» — пресеты СОЗДАНИЯ кругов под темы жизни (David: «пресеты кругов для семьи,
   тренингов и т.д. — их место во вкладке НАЙТИ, не на странице привычек»). Раньше были чипами в
   «Быстром добавлении» на Целях (терялись в конце ленты) → переехали сюда заметными карточками,
   тем же размером/языком, что «Челленджи». Тап → форма создания круга, заполненная пресетом
   (goal-settings + circleOn) → пользователь зовёт людей и правит под себя. */
const CIRCLE_STARTERS = [
  { i: "🤝", t: "Вклад в окружение", goalType: "collective", goalTitle: "Добрые дела",       target: 50,   unit: "дел",   hook: "Делаем добро вместе — счёт общий" },
  { i: "🫶", t: "Забота о близких",   goalType: "collective", goalTitle: "Тёплые дела",       target: 30,   unit: "дел",   hook: "Маленькие знаки внимания семье" },
  { i: "🔥", t: "30 дней спорта",     goalType: "streak",     goalTitle: "Спорт каждый день", target: 30,   unit: "дней",  hook: "Держим серию все вместе" },
  { i: "🏁", t: "Беговой вызов",      goalType: "collective", goalTitle: "100 км бега",       target: 100,  unit: "км",    hook: "Набегаем 100 км вместе — счёт общий" },
  { i: "💧", t: "Без сахара вместе",  goalType: "streak",     goalTitle: "Дни без сахара",    target: 21,   unit: "дней",  hook: "21 день чистоты — рядом легче" },
  { i: "🧘", t: "Осознанность",       goalType: "collective", goalTitle: "Минуты медитации",  target: 1000, unit: "мин",   hook: "Копим минуты тишины на всех" },
  { i: "📖", t: "Книжный клуб",       goalType: "collective", goalTitle: "Прочитано глав",    target: 100,  unit: "глав",  hook: "Читаем и обсуждаем вместе" },
];
function CircleStartersShowcaseLive({ navigate }) {
  const { open: _openSheet } = (typeof useSheet === "function") ? useSheet() : { open: () => {} };
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "4px 4px 10px" }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-4)" }}>🤝 Собери свой круг</span>
        <span style={{ fontSize: 11.5, color: "var(--text-4)" }}>с друзьями за секунду →</span>
      </div>
      <div className="bos-hscroll" style={{ display: "flex", gap: 11, overflowX: "auto", padding: "0 0 4px", scrollSnapType: "x proximity", WebkitOverflowScrolling: "touch" }}>
        {CIRCLE_STARTERS.map((s) => (
          <div key={s.t} className="tap" onClick={() => { if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} } _openSheet(<GoalFormSheetLive mode="create" circleOn={true} preset={s} navigate={navigate} />); }}
            style={{ flex: "0 0 auto", width: 162, scrollSnapAlign: "start", background: "var(--card)", borderRadius: 22, padding: 14, boxShadow: "var(--card-shadow)", cursor: "pointer", display: "flex", flexDirection: "column" }}>
            <span style={{ width: 44, height: 44, borderRadius: 14, background: "linear-gradient(150deg, #eef1f6, #dadfe7)", boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.06)", display: "grid", placeItems: "center", fontSize: 23, flexShrink: 0 }}>{bosIcon(s.i, 23, null)}</span>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.2px", marginTop: 11, lineHeight: 1.25 }}>{s.t}</div>
            <div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 3, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: 31 }}>{s.hook}</div>
            <div style={{ flex: 1, minHeight: 10 }} />
            <span style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 4, ...bosChipGlass(false), padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 600, color: "var(--text-2)" }}>🎯 {s.target} {s.unit}</span>
            <span style={{ marginTop: 9, fontSize: 12.5, fontWeight: 600, color: "var(--text-2)", display: "inline-flex", alignItems: "center", gap: 2 }}>Создать <I.ChevronRight size={14}/></span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* «Твои люди» — РЕАЛЬНАЯ жизнь в «Найти» (David: «сама жизнь должна быть по-настоящему»): живые
   аватары людей из ТВОИХ кругов (cloud teamMembers, дедуп, без себя). НЕ выдумка: если кругов/людей
   нет — секция СКРЫТА. Кэш в модульной переменной → мгновенно при повторном входе. Тап → в общий круг. */
var _bosFriendsAggCache = null;
function CircleFriendsStripLive({ app, navigate }) {
  var [friends, setFriends] = React.useState(_bosFriendsAggCache);
  var teamSig = (app && app.teams ? app.teams.filter(function (t) { return t.cloudId; }).map(function (t) { return t.cloudId; }).join(",") : "");
  React.useEffect(function () {
    var on = true;
    if (!(window.bosCloud && window.bosCloud.enabled() && window.bosCloud.teamMembers)) { setFriends([]); return; }
    var teams = (app && app.teams || []).filter(function (t) { return t.cloudId; });
    if (!teams.length) { setFriends([]); return; }
    (async function () {
      var myId = null; try { myId = await window.bosCloud.uid(); } catch (e) {}
      var seen = {}, out = [];
      for (var i = 0; i < teams.length; i++) {
        try {
          var mem = await window.bosCloud.teamMembers(teams[i].cloudId);
          (mem || []).forEach(function (m) {
            if (!m || !m.id || m.id === myId || seen[m.id]) return;
            seen[m.id] = 1; out.push({ id: m.id, name: m.name || "Друг", avatar: m.avatar, team: teams[i] });
          });
        } catch (e) {}
      }
      if (on) { _bosFriendsAggCache = out; setFriends(out); }
    })();
    return function () { on = false; };
  }, [teamSig]);
  if (!friends || !friends.length) return null;
  var shown = friends.slice(0, 8), extra = friends.length - shown.length;
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-4)", padding: "4px 4px 8px" }}>👥 Твои люди</div>
      <div style={{ background: "var(--card)", borderRadius: 22, padding: 14, boxShadow: "var(--card-shadow)" }}>
        <div className="bos-hscroll" style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 2 }}>
          {shown.map(function (f) {
            return (
              <button key={f.id} className="tap" onClick={function () { navigate("team-detail", { team: f.team }); }}
                style={{ flex: "0 0 auto", width: 60, background: "transparent", border: 0, padding: 0, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <BuddyFaceLive avatar={f.avatar} name={f.name} size={48} />
                <span style={{ fontSize: 11.5, color: "var(--text-2)", fontWeight: 500, maxWidth: 60, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(f.name || "").split(" ")[0]}</span>
              </button>
            );
          })}
          {extra > 0 && <div style={{ flex: "0 0 auto", alignSelf: "flex-start", width: 48, height: 48, borderRadius: "50%", background: "var(--surface-3)", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700, color: "var(--text-2)" }}>+{extra}</div>}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text-4)", marginTop: 11, lineHeight: 1.4 }}>Вы уже ведёте вместе — загляни в общий круг.</div>
      </div>
    </div>
  );
}

/* «Живые круги» — витрина населённого приложения (David: «хочу увидеть живые круги чисто чтоб
   создавать иллюзию... сама жизнь должна быть по-настоящему»). Это ПРИМЕРЫ КУРИРУЕМЫХ публичных
   кругов: настоящие лица-мемоджи + живой счёт «N отметились сегодня». Тап → ШТОРКА круга
   (LivingCircleSheetLive): орбита с привычками и людьми (как на карточках целей), описание,
   привычки круга и кнопка «Постучаться» — заявка «будет рассмотрена» (David: тап НЕ должен
   уводить в создание такой же командной цели). habits кормят орбиту и чипы. */
const LIVING_CIRCLES = [
  { id: "lc-run", i: "🏃", t: "Утренние пробежки", hook: "Выходят на рассвете — вместе проще не проспать",
    about: "Круг тех, кто начинает день с пробежки. Дистанция любая — важно выйти. Отметки складываются в общую серию, а по воскресеньям делятся маршрутами.",
    faces: ["m3", "m7", "m11", "m2", "m15"], total: 18, today: 9,
    habits: [{ emoji: "🏃", name: "Пробежка" }, { emoji: "🌅", name: "Ранний подъём" }, { emoji: "🧦", name: "Разминка" }],
    preset: { i: "🏃", t: "Утренние пробежки", accent: "#EAEAEF", goalType: "streak", goalTitle: "Бегать по утрам", target: 30, unit: "дней" } },
  { id: "lc-calm", i: "🧘", t: "Тишина по утрам", hook: "5 минут медитации — никто не сходит с дистанции",
    about: "Спокойный круг: пять минут тишины до телефона и новостей. Здесь не соревнуются — просто держат ритм вместе и делятся, что помогает не съезжать.",
    faces: ["m8", "m4", "m12", "m6", "m17", "m10"], total: 24, today: 13,
    habits: [{ emoji: "🧘", name: "Медитация" }, { emoji: "📓", name: "Дневник" }],
    preset: { i: "🧘", t: "Тишина по утрам", accent: "#EAEAEF", goalType: "streak", goalTitle: "Медитировать каждый день", target: 21, unit: "дней" } },
  { id: "lc-book", i: "📚", t: "Книжный клуб", hook: "Глава в день и живое обсуждение в чате круга",
    about: "Читают по главе в день — за месяц выходит целая книга. Раз в неделю голосуют за следующую и обсуждают прочитанное. Отставать не страшно: догоняют вместе.",
    faces: ["m5", "m9", "m1", "m14"], total: 11, today: 4,
    habits: [{ emoji: "📖", name: "Глава в день" }, { emoji: "✍️", name: "Заметка о прочитанном" }],
    preset: { i: "📚", t: "Книжный клуб", accent: "#EAEAEF", goalType: "collective", goalTitle: "Прочитать вместе", target: 12, unit: "книг" } },
  { id: "lc-water", i: "💧", t: "Восемь стаканов", hook: "Пьют воду и держат друг друга в тонусе",
    about: "Самый простой круг: восемь стаканов воды в день. Идеален как первый общий ритуал — лёгкий, но каждый день видно, кто в строю.",
    faces: ["m13", "m16", "m2", "m7"], total: 9, today: 6,
    habits: [{ emoji: "💧", name: "Стакан воды" }],
    preset: { i: "💧", t: "Восемь стаканов", accent: "#EAEAEF", goalType: "collective", goalTitle: "Пить воду", target: 30, unit: "дней" } },
];

// «Постучаться» — заявки живут локально (bos:knockedCircles), чтобы кнопка честно помнила
// «Заявка отправлена» между входами. Публичные круги курируются — реальный approve появится
// вместе с настоящими публичными кругами; пока это витрина-пример.
function bosLoadKnockedCircles() { try { return JSON.parse(localStorage.getItem("bos:knockedCircles") || "{}") || {}; } catch (e) { return {}; } }
function bosMarkKnockedCircle(id) { var n = Object.assign({}, bosLoadKnockedCircles(), { [id]: true }); try { localStorage.setItem("bos:knockedCircles", JSON.stringify(n)); } catch (e) {} try { window.dispatchEvent(new Event("bos:circlesKnocked")); } catch (e) {} return n; }

/* ШТОРКА живого круга — «заглянуть внутрь»: орбита (привычки круга + лица на кольцах — тот же
   GoalOrbitMini, что на карточках целей), о чём круг, чипы привычек и «Постучаться в круг».
   Тап по «Постучаться» → «Заявка отправлена — её рассмотрят». Внизу тихая ссылка «Собрать
   похожий круг» (прежнее действие карточки) — для тех, кто хочет свой. */
function LivingCircleSheetLive({ circle: s, navigate }) {
  const { open: openSheet, close } = useSheet();
  const app = (typeof useApp === "function") ? useApp() : null;
  const isDark = app && app.themeOverride === "dark";
  const [knocked, setKnocked] = React.useState(function () { return !!bosLoadKnockedCircles()[s.id]; });
  const knock = () => {
    if (knocked) return;
    bosMarkKnockedCircle(s.id); setKnocked(true);
    if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} }
  };
  const people = (s.faces || []).map(function (a) { return { avatar: a, name: "" }; });
  return (
    <div style={{ padding: "2px 20px 20px", maxHeight: "82vh", overflowY: "auto", WebkitOverflowScrolling: "touch", textAlign: "center" }}>
      {/* Орбита — круг живёт: в центре его значок, на кольцах привычки и люди. */}
      <div style={{ width: 190, height: 190, margin: "2px auto 0", display: "grid", placeItems: "center" }}>
        {typeof GoalOrbitMini === "function"
          ? <GoalOrbitMini centerEmoji={s.i} centerColor={null} habits={s.habits || []} people={people} size={190} dark={isDark} />
          : <span style={{ fontSize: 56 }}>{s.i}</span>}
      </div>
      <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: "-0.4px", color: "var(--text)", marginTop: 10 }}>{s.t}</div>
      <div style={{ fontSize: 12.5, color: "var(--text-4)", marginTop: 5, fontWeight: 500 }}>
        {s.total} в круге · <b style={{ color: "var(--text-2)", fontWeight: 700 }}>{s.today}</b> отметились сегодня
      </div>
      <div style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.5, marginTop: 12, textAlign: "left" }}>{s.about || s.hook}</div>

      {/* Привычки круга — что здесь ведут (серое стекло, как чипы «Быстрого добавления»). */}
      <div style={{ display: "flex", gap: 7, marginTop: 14, flexWrap: "wrap", justifyContent: "flex-start" }}>
        {(s.habits || []).map(function (h, i) {
          return (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, ...bosChipGlass(isDark), padding: "6px 12px 6px 8px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, color: "var(--text-2)" }}>
              <span style={{ fontSize: 14 }}>{bosIcon(h.emoji, 14, null)}</span>{h.name}
            </span>
          );
        })}
      </div>

      {/* Постучаться — заявка на вступление; круги курируются, ответ «рассмотрят». */}
      {knocked ? (
        <div style={{ marginTop: 18, background: "rgba(52,199,89,0.14)", color: "#1E8E4E", borderRadius: 16, padding: "13px", fontWeight: 700, display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, fontSize: 15 }}><I.Check size={17} strokeWidth={3} /> Заявка отправлена</span>
          <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-3)" }}>Круг её рассмотрит — ответ придёт сюда.</span>
        </div>
      ) : (
        <button onClick={knock} className="tap" style={{ width: "100%", marginTop: 18, background: "var(--cta, #0a0a0a)", color: "var(--cta-ink, #fff)", border: 0, borderRadius: 999, padding: 15, fontSize: 15.5, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <I.Users size={17} /> Постучаться в круг
        </button>
      )}

      {/* Тихая вторая дорога — прежнее действие карточки: собрать свой такой же. */}
      <button onClick={function () { openSheet(<GoalFormSheetLive mode="create" circleOn={true} preset={s.preset} navigate={navigate} />); }} className="tap"
        style={{ width: "100%", background: "transparent", border: 0, color: "var(--text-3)", padding: "12px", marginTop: 6, fontSize: 13.5, fontWeight: 600 }}>
        Собрать похожий круг →
      </button>
    </div>
  );
}

// Overlapping memoji faces — the visual «жизнь» of a circle. Each face gets a card-coloured ring
// so the stack reads cleanly; «+N» disc closes the overflow up to the circle's total.
function LivingCircleFaces({ faces, total }) {
  var shown = (faces || []).slice(0, 5);
  var extra = (total || shown.length) - shown.length;
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {shown.map(function (a, i) {
        return (
          <div key={i} style={{ marginLeft: i ? -9 : 0, borderRadius: "50%", boxShadow: "0 0 0 2px var(--card)", position: "relative", zIndex: shown.length - i }}>
            <BuddyFaceLive avatar={a} name="" size={26} />
          </div>
        );
      })}
      {extra > 0 && (
        <div style={{ marginLeft: -9, width: 26, height: 26, borderRadius: "50%", background: "var(--surface-3)", boxShadow: "0 0 0 2px var(--card)", display: "grid", placeItems: "center", fontSize: 10.5, fontWeight: 700, color: "var(--text-2)" }}>+{extra}</div>
      )}
    </div>
  );
}

function LivingCirclesShowcaseLive({ navigate }) {
  const { open: _openSheet } = (typeof useSheet === "function") ? useSheet() : { open: () => {} };
  const [knockedMap, setKnockedMap] = React.useState(bosLoadKnockedCircles);
  React.useEffect(function () {
    // «Постучался» в шторке → карточка под ней сразу показывает «Заявка отправлена»
    // (то же событие-зеркало, что у партнёров bos:partnersChanged).
    var h = function () { setKnockedMap(bosLoadKnockedCircles()); };
    window.addEventListener("bos:circlesKnocked", h);
    return function () { window.removeEventListener("bos:circlesKnocked", h); };
  }, []);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "4px 4px 10px" }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-4)" }}>✨ Живые круги</span>
        <span style={{ fontSize: 11.5, color: "var(--text-4)" }}>люди ведут их вместе</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {LIVING_CIRCLES.map(function (s) {
          return (
            <button key={s.t} onClick={function () { if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} } _openSheet(<LivingCircleSheetLive circle={s} navigate={navigate} />); }} className="tap"
              style={{ textAlign: "left", width: "100%", background: "var(--card)", borderRadius: 22, padding: 14, boxShadow: "var(--card-shadow)", border: 0, cursor: "pointer", display: "flex", flexDirection: "column", gap: 11, color: "var(--text)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 46, height: 46, borderRadius: 14, background: "linear-gradient(150deg, #eef1f6, #dadfe7)", boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.06)", display: "grid", placeItems: "center", fontSize: 24, flexShrink: 0 }}>{bosIcon(s.i, 24, null)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15.5, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.2px" }}>{s.t}</div>
                  <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{s.hook}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <LivingCircleFaces faces={s.faces} total={s.total} />
                <span style={{ fontSize: 12, color: "var(--text-4)", fontWeight: 500 }}><b style={{ color: "var(--text-2)", fontWeight: 700 }}>{s.today}</b> отметились сегодня</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "var(--text-4)" }}>{s.total} в круге</span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: knockedMap[s.id] ? "#1E8E4E" : "var(--text-2)", display: "inline-flex", alignItems: "center", gap: 3 }}>
                  {knockedMap[s.id] ? <><I.Check size={13} strokeWidth={3} /> Заявка отправлена</> : <>Заглянуть <I.ChevronRight size={14} /></>}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* «Позови своих» — ЭЛЕГАНТНАЯ интеграция контактов для Telegram-приложения (David: «красиво
   интегрировать контакты, гениальное решение по смыслу»): НЕ скрейпим список контактов (приватность),
   а открываем РОДНОЙ выбор чата Telegram (ShareAppSheetLive → t.me/share/url). Друг переходит по
   реф-ссылке, вступает — и появляется в «Твои люди». Тот же реферальный движок, что на Главной. */
function InviteFriendsCardLive({ isDark }) {
  var sheet = (typeof useSheet === "function") ? useSheet() : null;
  var openInvite = function () { try { if (sheet && sheet.open && typeof ShareAppSheetLive === "function") sheet.open(<ShareAppSheetLive dark={isDark} />); } catch (e) {} };
  return (
    <div>
      <button onClick={openInvite} className="tap" style={{ width: "100%", position: "relative", overflow: "hidden", border: 0, borderRadius: 22, padding: 16, background: "linear-gradient(135deg, #FEDE34, #EF9F14)", boxShadow: "0 8px 22px rgba(239,159,20,0.3)", color: "#0a0a0a", display: "flex", alignItems: "center", gap: 13, textAlign: "left", cursor: "pointer" }}>
        <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 86% 8%, rgba(255,255,255,0.4) 0%, transparent 55%)", pointerEvents: "none" }} />
        <span style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(255,255,255,0.5)", display: "grid", placeItems: "center", flexShrink: 0, color: "#0a0a0a", position: "relative" }}><I.Share size={20} /></span>
        <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
            <span style={{ fontSize: 15.5, fontWeight: 700, color: "#0a0a0a", letterSpacing: "-0.2px" }}>Позови своих</span>
            <span style={{ display: "inline-flex", alignItems: "center", fontSize: 10.5, fontWeight: 800, color: "#FEDE34", background: "#0a0a0a", padding: "2px 8px", borderRadius: 999, flexShrink: 0 }}>+150 XP</span>
          </div>
          <div style={{ fontSize: 12.5, color: "rgba(0,0,0,0.62)", marginTop: 3, lineHeight: 1.35, fontWeight: 500 }}>Пригласи друзей прямо из Telegram — и они появятся в «Твои люди».</div>
        </div>
        <span style={{ position: "relative", color: "#0a0a0a", opacity: 0.55, flexShrink: 0 }}><I.ChevronRight size={18} /></span>
      </button>
    </div>
  );
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
function _bosHashU(s) { s = "" + (s || "x"); var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0; } return h; }
function _bosSm(x) { x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); }   // smoothstep 0..1
function _bosLp(a, b, k) { return a + (b - a) * k; }
// СТАТИЧНЫЙ диск дальней системы (иконка): аватар + одно золотое кольцо уровня + бейдж. БЕЗ часов и
// SVG-орбиты → не крутится, не ре-рендерится на 30fps (главная оптимизация: дальних систем много,
// им не нужна анимация). Вид совпадает со свёрнутым OrbitField → переход бесшовный.
function UniDiscLive({ avatar, level, lvlPct, size, dark }) {
  var av = "" + (avatar || "");
  var isMemoji = /^m\d+$/.test(av), isEmoji = av.indexOf("emoji:") === 0;
  var SHEEN = "linear-gradient(165deg, rgba(255,255,255,0.55), rgba(255,255,255,0.12) 46%, rgba(255,255,255,0) 72%)";
  var bg = SHEEN + ", " + (isMemoji ? "url(./assets/people/" + av + ".png) center/cover no-repeat, " : (!isEmoji ? "url(./assets/sphere.png) center/cover no-repeat, " : "")) + "linear-gradient(150deg,#eef1f6,#dadfe7)";
  var badge = size * 0.34;
  // Кольцо-прогресс уровня УБРАНО (David: «перегружает») — остаётся только цифра уровня.
  // Inset 0.12 сохранён → размер лица и стык с раскрытой орбитой не изменились.
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <div style={{ position: "absolute", inset: size * 0.12, borderRadius: "50%", background: bg, boxShadow: "inset 0 1.5px 0.5px rgba(255,255,255,0.9), inset 0 0 0 0.6px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.14)", display: "grid", placeItems: "center", fontSize: size * 0.42, lineHeight: 1 }}>
        {isEmoji ? av.slice(6) : null}
      </div>
      {/* Цифра уровня — grid-центрирование (была line-height с border → визуально съезжала). */}
      {level > 0 && <span style={{ position: "absolute", right: size * 0.05, bottom: size * 0.05, minWidth: badge, height: badge, padding: "0 " + (size * 0.03) + "px", boxSizing: "border-box", borderRadius: 999, background: "linear-gradient(180deg,#FFE777,#F4B72A)", color: "#4a3800", fontSize: size * 0.2, fontWeight: 800, lineHeight: 1, display: "grid", placeItems: "center", border: "1.5px solid var(--card)", fontFamily: "-apple-system, system-ui, sans-serif" }}>{level}</span>}
    </div>
  );
}
// Мемоизированные обёртки для Вселенной. Смысл: при ПАНЕ позиция+размер системы идут через transform
// её ОБЁРТКИ (дёшево, GPU), а тяжёлая графика (OrbitField / диск) НЕ перерисовывается, пока не изменились
// её реальные пропы (open квантуется до ступеней, spinT тикает медленно ~7fps). Это и убирает «лаг линзы»
// при перетаскивании — раньше все орбиты перерисовывали всю графику на КАЖДЫЙ кадр пана.
function _uniOrbitEq(a, b) {
  return a.avatar === b.avatar && a.habits === b.habits && a.people === b.people && a.levelPct === b.levelPct
    && a.moodC === b.moodC && a.dark === b.dark && a.levelBadge === b.levelBadge && a.open === b.open
    && a.spinT === b.spinT && a.minimal === b.minimal && a.hideLevelArc === b.hideLevelArc
    && a.hideLevelRing === b.hideLevelRing;
}
var UniOrbitMemo = (typeof OrbitField === "function" && React.memo) ? React.memo(OrbitField, _uniOrbitEq) : OrbitField;
var UniDiscMemo = React.memo ? React.memo(UniDiscLive) : UniDiscLive;

// ОБЩИЙ тикер вращения Вселенной (~10fps, пауза в фоне): раньше spin был state РОДИТЕЛЯ и каждый
// тик пересобирал ВСЁ поле; теперь на тик перерисовываются ТОЛЬКО раскрытые орбиты-подписчики.
var _uniSpinSubs = new Set();
var _uniSpinTimer = null;
function _uniSpinStart() {
  if (_uniSpinTimer != null) return;
  _uniSpinTimer = setInterval(function () {
    if (typeof document !== "undefined" && document.hidden) return;
    var v = (performance.now() / 1000) * 0.7;   // та же спокойная скорость, что была
    _uniSpinSubs.forEach(function (fn) { try { fn(v); } catch (e) {} });
  }, 100);
}
function _uniSpinStop() { if (_uniSpinTimer != null) { clearInterval(_uniSpinTimer); _uniSpinTimer = null; } }
function useUniSpin(active) {
  var st = React.useState(0), v = st[0], setV = st[1];
  React.useEffect(function () {
    if (!active) return;
    _uniSpinSubs.add(setV); _uniSpinStart();
    return function () { _uniSpinSubs.delete(setV); if (!_uniSpinSubs.size) _uniSpinStop(); };
  }, [active]);
  return active ? v : 0;
}
// Одна РАСКРЫТАЯ система: подписка на тикер только пока spinOn (глубоко под линзой). open=1 —
// геометрия печётся раз, живое раскрытие едет CSS-переменными (--uK/--uO/--uA) с обёртки.
function UniSpinOrbit({ sp, moodC, isDark, spinOn }) {
  var spin = useUniSpin(spinOn);
  if (!UniOrbitMemo) return null;
  return <UniOrbitMemo avatar={sp.s && sp.s.avatar} name={(sp.s && sp.s.name) || ""} habits={sp.habits} people={sp.people} levelPct={sp.lvlPct} moodC={moodC} dark={isDark} hideLevelArc={true} hideLevelRing={true} editable={false} levelBadge={sp.level} open={1} minimal={true} spinT={spin} />;
}
function UniverseFieldLive({ app, people, from, onClose }) {
  var isDark = app && app.themeOverride === "dark";
  var [friends, setFriends] = React.useState(_bosUniverseCache);
  React.useEffect(function () {
    var on = true;
    var seed = Array.isArray(people) ? people : [];
    if (!(window.bosCloud && window.bosCloud.enabled())) { setFriends(seed); return; }
    (async function () {
      var out = [], myId = null;
      try { myId = await window.bosCloud.uid(); } catch (e) {}
      // ВСЕ пользователи вселенной: каждый с опубликованной витриной орбиты, АНОНИМНО (аватар+уровень+
      // значки привычек, без имён/связи — David: «показываем всех всем, супер-анонимно»).
      try {
        if (window.bosCloud.allPublic) {
          var all = await window.bosCloud.allPublic(240);
          (all || []).forEach(function (p) { if (p && p.id && p.id !== myId) out.push(p); });
        }
      } catch (e) {}
      // Фолбэк (нет allPublic / пусто — напр. старый кэш): показать хотя бы своих (приглашённые + круги),
      // тоже анонимно. Дотягиваем их публичные орбиты по id.
      if (!out.length) {
        var seen = {};
        try { if (window.bosCloud.invitedPeople) { var inv = await window.bosCloud.invitedPeople(); (inv || []).forEach(function (p) { if (!p) return; var id = p.id || p.user_id; if (id && id !== myId && !seen[id]) { seen[id] = 1; out.push({ id: id, avatar: p.avatar, name: "" }); } }); } } catch (e) {}
        try { var teams = (app && app.teams || []).filter(function (t) { return t.cloudId; }); for (var i = 0; i < teams.length; i++) { var mem = await window.bosCloud.teamMembers(teams[i].cloudId); (mem || []).forEach(function (m) { if (m && m.id && m.id !== myId && !seen[m.id]) { seen[m.id] = 1; out.push({ id: m.id, avatar: m.avatar, name: "" }); } }); } } catch (e) {}
        try { if (window.bosCloud.profilesPublic && out.length) { var st = await window.bosCloud.profilesPublic(out.map(function (o) { return o.id; })) || {}; out.forEach(function (o) { var s = st[o.id] || {}; o.level = s.level || 0; o.lvlPct = s.lvlPct || 2; o.habits = Array.isArray(s.habits) ? s.habits : []; o.goals = s.goals || 0; o.people = s.people || 0; }); } } catch (e) {}
      }
      if (on) { _bosUniverseCache = out; setFriends(out); }
    })();
    return function () { on = false; };
  }, []);
  var list = Array.isArray(friends) ? friends : [];
  var bg = isDark ? "radial-gradient(125% 95% at 50% 42%, #1b2336 0%, #0e1422 52%, #070b14 100%)" : "radial-gradient(125% 95% at 50% 42%, #fbfcff 0%, #eef1f8 52%, #e4e9f2 100%)";
  var titleC = isDark ? "rgba(220,230,255,0.7)" : "rgba(40,52,74,0.55)";
  var subC = isDark ? "rgba(200,215,255,0.5)" : "rgba(40,52,74,0.42)";

  // Твой РЕАЛЬНЫЙ уровень/прогресс — кормит OrbitField (золотое кольцо + цифра) идентично стр. «Я».
  var _ux = (typeof bosLiveXPLive === "function") ? bosLiveXPLive(app) : 0;
  var _ul = (typeof bosLevelInfoLive === "function") ? bosLevelInfoLive(_ux) : { level: 1, pct: 2 };
  var lvlNum = _ul.level, lvlPct = _ul.pct;

  // Чужая система = ТОТ ЖЕ настоящий OrbitField, что у тебя на «Я» (David: «должны быть прямо такие же,
  // а сейчас иконки криво»). Поэтому НЕ рисуем отдельную bead-схему — готовим данные под OrbitField и
  // рендерим его уменьшенным. Размер растёт с объёмом (больше привычек+людей → крупнее система).
  function buildSystem(s) {
    var hb = Array.isArray(s.habits) ? s.habits : [];
    var peopleN = s.people || 0;
    var weight = Math.min(hb.length + peopleN, 16);
    var size = Math.round(122 + Math.min(weight, 14) * 5.4);   // диаметр системы на экране, ~122..198px
    // habits → объекты, которые читает OrbitField (.emoji/.color/.streak/.id); люди → обезличенные лица.
    var habits = hb.slice(0, 12).map(function (h, i) { return { emoji: (h && h.e) || "✨", color: h && h.c, streak: 0, id: "ph" + i }; });
    var people = [];
    for (var pi = 0; pi < Math.min(peopleN, 10); pi++) people.push({ avatar: null, name: "" });
    // footprint < size/2: видимая орбита заметно меньше своего 300-бокса (значки в пределах ~внутренних
    // поясов), поэтому ужимаем зону размещения, чтобы во «Вселенную» влезало больше систем без наезда.
    return { s: s, size: size, level: s.level || 0, lvlPct: s.lvlPct || 2, habits: habits, people: people, weight: weight, footprint: Math.round(size * 0.42 + 8) };
  }

  // Размер ТВОЕЙ орбиты берём со стр. «Я» (measured rect) → overlay рисует её копию ТЕХ ЖЕ размеров на
  // ТОМ ЖЕ месте. Fallback (не из «Я»): ширина страницы × 300 (как в OrbitField).
  var W = (typeof window !== "undefined" && window.innerWidth) || 390;
  var H = (typeof window !== "undefined" && window.innerHeight) || 780;
  // РАСКЛАДКА = ЧЕСТНАЯ HONEYCOMB-СЕТКА (как главное меню Apple Watch): гексагональные кольца вокруг
  // центра (ты — в центре, index 0; далее кольца по 6, 12, 18…), идеально СИММЕТРИЧНО, каждая система
  // в своей ячейке (спейсинг ровно 1). Линза fish() ниже раздувает центр, сохраняя симметрию.
  var layout = React.useMemo(function () {
    var others = list.slice(0, 240).map(function (f) { return buildSystem(f); }).sort(function (a, b) { return b.weight - a.weight; });
    var AX = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];   // 6 направлений гекс-соседей
    function hexAt(index) {                                          // index 0 = центр, далее по кольцам
      if (index <= 0) return { q: 0, r: 0, k: 0 };
      var k = 1; while (index > 3 * k * (k + 1)) k++;                // номер кольца
      var idxInRing = index - (3 * (k - 1) * k + 1);                 // позиция внутри кольца (0..6k-1)
      var q = AX[4][0] * k, r = AX[4][1] * k;                        // старт кольца — угол
      var side = Math.floor(idxInRing / k), step = idxInRing % k;
      for (var s = 0; s < side; s++) { q += AX[s][0] * k; r += AX[s][1] * k; }
      q += AX[side][0] * step; r += AX[side][1] * step;
      return { q: q, r: r, k: k };
    }
    var nodes = others.map(function (sp, j) {
      var h = hexAt(j + 1);                                          // axial → плоскость, спейсинг ровно 1
      return { sp: sp, fx: h.q + h.r * 0.5, fy: h.r * 0.8660254, ring: h.k };
    });
    return { nodes: nodes };
  }, [friends]);

  // ЛИНЗА (fisheye, как главное меню Apple Watch): поле тесно упаковано, а в центре экрана — «лупа».
  // ─── ДВИЖОК БЕЗ REACT НА КАЖДЫЙ КАДР ───────────────────────────────────────────────
  // Урок «лага линзы»: раньше пан/зум шли через setState → React пересобирал ВСЕ ~240 систем
  // каждый кадр, а раскрытие колец квантовалось ступенями (лица шли «лесенкой»). Теперь камера
  // живёт в ref, и ОДИН rAF-цикл пишет transform + CSS-переменные (--uK/--uO/--uA — раскрытие
  // колец и размер лица) НАПРЯМУЮ в DOM — плавно, 60fps, без единого ре-рендера. React
  // пересобирает поле только по camQ (~6 раз/с) ради СТРУКТУРЫ: диск↔орбита (с гистерезисом)
  // и вкл/выкл вращения. В покое не происходит ВООБЩЕ ничего (записи скипаются по сигнатуре).
  var camRef = React.useRef({ x: 0, y: 0, z: 1 });
  var [camQ, setCamQ] = React.useState({ x: 0, y: 0, z: 1 }); // квантованная камера — только для структуры
  var [introDone, setIntroDone] = React.useState(false);      // после каскада появления pop-анимации гасим
  var introRef = React.useRef(0);
  var nodeEls = React.useRef({});   // key → DOM-обёртка системы (loop пишет transform/vars сюда)
  var nodeSig = React.useRef({});   // key → последняя записанная сигнатура (скип одинаковых записей)
  var lodRef = React.useRef({});    // key → "disc"|"orbit" (гистерезис переключения)
  var nodesRef = React.useRef([]);
  function _cZ(z) { return z < 0.55 ? 0.55 : z > 3 ? 3 : z; }
  var PACK = 0.9, MC = 1.85, ME = 0.72;               // упаковка сот и магнификация линзы: центр/край
  // Геометрия одной системы из камеры. ВАЖНО: q = rf·(178·PACK/235) — НЕ зависит от зума/intro
  // (они сокращаются) → раскрытость определяется только расстоянием до линзы. Этим пользуется
  // и React-структура (LOD по camQ), и rAF-цикл (плавные значения по camRef).
  function calcNode(fx, fy, cam, introK) {
    var SIZB = 178 * cam.z * introK, SPB = SIZB * PACK, SIG = 235 * cam.z * introK;
    var vx = fx - cam.x, vy = fy - cam.y, rf = Math.sqrt(vx * vx + vy * vy), rpx = rf * SPB;
    var q = rpx / SIG, mag = ME + (MC - ME) / (1 + q * q);
    var R = ME * rpx + (MC - ME) * SIG * Math.atan(q);           // радиальное отображение «лупы»
    var ux = rf > 0.001 ? vx / rf : 0, uy = rf > 0.001 ? vy / rf : 0;
    return { sx: W / 2 + ux * R, sy: H / 2 + uy * R, size: SIZB * mag, mag: mag };
  }
  // Стили одной системы (единая математика для rAF-цикла И для inline-рендера, чтобы редкий
  // React-рендер писал РОВНО те же значения и ничего не дёргалось).
  // Диск масштабируется НЕПРЕРЫВНО от openV — лицо диска и лицо орбиты совпадают при ЛЮБОМ
  // моменте переключения LOD (раньше стык был точечно подогнан под фикс-порог).
  function nodeVisual(fx, fy, cam, introK) {
    var f = calcNode(fx, fy, cam, introK);
    var openV = openMag(f.mag);
    var off = (f.sx < -f.size || f.sx > W + f.size || f.sy < -f.size || f.sy > H + f.size);
    var uA = _bosLp(2.6, 1.05, openV);
    var dscale = (f.size * 0.2 * uA) / 110;            // 0.2 = 60px аватар / 300px бокс орбиты
    var oscale = f.size / 300;
    return { f: f, openV: openV, off: off, uA: uA, dscale: dscale, oscale: oscale, zi: Math.round(f.mag * 100) };
  }
  React.useEffect(function () {
    var raf, t0 = null, lastQ = 0;
    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (t0 == null) t0 = now;
      var ip = (now - t0) / 820; if (ip > 1) ip = 1;
      introRef.current = ip;
      var introK = _bosLp(1.34, 1, _bosSm(ip));       // зум-аут входа: ты крупно → поле «разгорается»
      var cam = camRef.current;
      var nodes = nodesRef.current, els = nodeEls.current, sigs = nodeSig.current;
      for (var i = 0; i < nodes.length; i++) {
        var nd = nodes[i], el = els[nd.key];
        if (!el) continue;
        var v = nodeVisual(nd.fx, nd.fy, cam, introK);
        if (v.off) { if (sigs[nd.key] !== "hide") { el.style.display = "none"; sigs[nd.key] = "hide"; } continue; }
        var disc = el.getAttribute("data-lod") === "disc";
        var tf = "translate(" + v.f.sx.toFixed(1) + "px," + v.f.sy.toFixed(1) + "px) scale(" + (disc ? v.dscale : v.oscale).toFixed(4) + ")";
        var sig = tf + "|" + v.zi + "|" + v.openV.toFixed(3);
        if (sigs[nd.key] === sig) continue;            // покой = ноль записей в DOM
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
        setCamQ(function (p) { var c = camRef.current; return (p.x === c.x && p.y === c.y && p.z === c.z) ? p : { x: c.x, y: c.y, z: c.z }; });
      }
    }
    raf = requestAnimationFrame(frame);
    return function () { cancelAnimationFrame(raf); };
  }, []);
  React.useEffect(function () { var t = setTimeout(function () { setIntroDone(true); }, 2000); return function () { clearTimeout(t); }; }, []);
  var vp = React.useRef({ pts: {}, mode: null, sd: 1, ox: 0, oy: 0, oz: 1, sx: 0, sy: 0, moved: 0 });
  function uDown(e) {
    var g = vp.current; g.pts[e.pointerId] = { x: e.clientX, y: e.clientY }; var ids = Object.keys(g.pts);
    var cam = camRef.current;
    if (ids.length === 1) { g.mode = "pan"; g.sx = e.clientX; g.sy = e.clientY; g.ox = cam.x; g.oy = cam.y; g.moved = 0; }
    else if (ids.length >= 2) { g.mode = "pinch"; var a = g.pts[ids[0]], b = g.pts[ids[1]]; g.sd = Math.hypot(a.x - b.x, a.y - b.y) || 1; g.oz = cam.z; }
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
  }
  function uMove(e) {
    var g = vp.current; if (!g.pts[e.pointerId]) return; g.pts[e.pointerId] = { x: e.clientX, y: e.clientY }; var ids = Object.keys(g.pts);
    var cam = camRef.current;
    // Пишем ПРЯМО в ref — rAF-цикл подхватит на ближайшем кадре (ни одного setState на пан).
    if (g.mode === "pinch" && ids.length >= 2) { var a = g.pts[ids[0]], b = g.pts[ids[1]]; camRef.current = { x: cam.x, y: cam.y, z: _cZ(g.oz * (Math.hypot(a.x - b.x, a.y - b.y) / g.sd)) }; }
    else if (g.mode === "pan" && ids.length === 1) { var ps = 178 * PACK * g.oz; var dx = e.clientX - g.sx, dy = e.clientY - g.sy; g.moved = Math.max(g.moved, Math.abs(dx) + Math.abs(dy)); camRef.current = { x: g.ox - dx / ps, y: g.oy - dy / ps, z: cam.z }; }
  }
  function uUp(e) {
    var g = vp.current; var tap = (g.mode === "pan" && g.moved < 6 && Object.keys(g.pts).length === 1);
    delete g.pts[e.pointerId]; if (!Object.keys(g.pts).length) g.mode = null;
    var c = camRef.current;
    setCamQ({ x: c.x, y: c.y, z: c.z });               // жест кончился → структура сразу догоняет
    if (tap) { try { onClose && onClose(); } catch (_) {} }
  }
  function uWheel(e) { var c = camRef.current; camRef.current = { x: c.x, y: c.y, z: _cZ(c.z * (1 - (e.deltaY || 0) * 0.0012)) }; }

  var plural = list.length === 1 ? "система" : (list.length >= 2 && list.length <= 4 ? "системы" : "систем");
  var sub = (friends == null) ? "" : (list.length ? (list.length + " " + plural + " рядом — у каждого своя орбита") : "пока только твоя система — позови своих");
  // РАСКРЫТИЕ колец — ГРАДИЕНТ по близости к центру ЛИНЗЫ (David: «я — целиком; ближайшие приоткрыты,
  // привычки читаются; дальше меньше; совсем далеко — иконки»). Плавно от центра (mag высок → 1) к
  // краю (→ 0). Широкий диапазон 0.9 → тает через несколько колец, а не резко.
  function openMag(mag) { return _bosSm((mag - 0.98) / 0.9); }
  // Твоя система — с РЕАЛЬНЫМИ привычками/людьми/уровнем; стоит в центре поля (fx=fy=0). Мемоизируем,
  // чтобы ссылки на habits/people/sp были СТАБИЛЬНЫ между кадрами → мемо-обёртка не перерисовывает.
  var _bs = (typeof bosStreak === "function") ? bosStreak : function () { return 0; };
  var youHabits = React.useMemo(function () { return ((app && app.habits) || []).slice(0, 12).map(function (h) { return { emoji: h.emoji || "✨", color: h.color, streak: _bs(h.log), id: h.id }; }); }, [app]);
  var youPeople = React.useMemo(function () { return Array.isArray(people) ? people.slice(0, 10) : []; }, [people]);
  var youSp = React.useMemo(function () { return { s: { avatar: app && app.avatar, name: (app && app.userName) || "" }, level: lvlNum, lvlPct: lvlPct, habits: youHabits, people: youPeople }; }, [app, lvlNum, lvlPct, youHabits, youPeople]);
  var allNodes = React.useMemo(function () {
    return [{ sp: youSp, fx: 0, fy: 0, you: true, ring: 0, key: "you" }]
      .concat(layout.nodes.map(function (n, j) { return { sp: n.sp, fx: n.fx, fy: n.fy, ring: n.ring, key: "o" + j }; }));
  }, [youSp, layout]);
  nodesRef.current = allNodes; // rAF-цикл всегда видит свежий список
  var node = (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, overflow: "hidden", background: bg, animation: "bosUniFade 0.5s ease both" }}>
      <style>{"@keyframes bosUniFade{from{opacity:0}to{opacity:1}}@keyframes bosSysPop{from{opacity:0;transform:scale(0.5)}to{opacity:1;transform:scale(1)}}"}</style>
      {/* Жесты: пинч-зум + перетаскивание + колесо; чистый тап (без сдвига) закрывает. */}
      <div onPointerDown={uDown} onPointerMove={uMove} onPointerUp={uUp} onPointerCancel={uUp} onWheel={uWheel} style={{ position: "absolute", inset: 0, touchAction: "none", cursor: "grab" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {/* Каждая система: ДАЛЬНИЕ = лёгкий статичный диск UniDiscLive; БЛИЖНИЕ = живой OrbitField
              (open=1, раскрытие едет через CSS-переменные с rAF-цикла — см. движок выше). LOD
              переключается с ГИСТЕРЕЗИСОМ по camQ, а размеры диска и лица орбиты — одна непрерывная
              формула → стык бесшовный в любой момент. Появление: bosSysPop-каскад «космос загорается»
              (ты → кольцо за кольцом, лёгкий джиттер внутри кольца); после каскада анимация гасится,
              чтобы смена LOD/въезд в кадр не «подпрыгивали». Inline-стили считаются из ТЕХ ЖЕ
              camRef/introRef, что пишет цикл → редкий React-рендер ничего не сдвигает. */}
          {allNodes.map(function (nd) {
            var sp = nd.sp, key = nd.key;
            var vq = nodeVisual(nd.fx, nd.fy, camQ, 1); // структура: LOD/вращение (зум сокращается — см. calcNode)
            var prev = lodRef.current[key];
            var lod = vq.openV > (prev === "orbit" ? 0.10 : 0.14) ? "orbit" : "disc";
            lodRef.current[key] = lod;
            var vNow = nodeVisual(nd.fx, nd.fy, camRef.current, _bosLp(1.34, 1, _bosSm(introRef.current)));
            var delay = Math.min((nd.ring || 0) * 0.14, 1.0) + ((_bosHashU(key) % 100) / 100) * 0.15;
            var pop = introDone ? "none" : ("bosSysPop 0.55s cubic-bezier(0.34,1.35,0.5,1) " + delay.toFixed(2) + "s both");
            var style = {
              position: "absolute", left: 0, top: 0, transformOrigin: "0px 0px", pointerEvents: "none",
              display: vNow.off ? "none" : undefined, zIndex: vNow.zi,
              transform: "translate(" + vNow.f.sx.toFixed(1) + "px," + vNow.f.sy.toFixed(1) + "px) scale(" + (lod === "disc" ? vNow.dscale : vNow.oscale).toFixed(4) + ")",
            };
            if (lod !== "disc") { style["--uK"] = _bosLp(0.3, 1, vNow.openV).toFixed(4); style["--uO"] = vNow.openV.toFixed(3); style["--uA"] = vNow.uA.toFixed(4); }
            nodeSig.current[key] = null; // рендер переписал inline-стили → цикл обновит сигнатуру заново
            return (
              <div key={key} ref={function (el) { if (el) nodeEls.current[key] = el; else { delete nodeEls.current[key]; delete nodeSig.current[key]; } }} data-lod={lod} style={style}>
                <div style={{ transformOrigin: "0px 0px", animation: pop }}>
                  {lod === "disc" ? (
                    <div style={{ position: "absolute", left: -55, top: -55 }}>
                      {UniDiscMemo ? <UniDiscMemo avatar={sp.s && sp.s.avatar} level={sp.level} lvlPct={sp.lvlPct} size={110} dark={isDark} /> : null}
                    </div>
                  ) : (
                    <div style={{ position: "absolute", left: -150, top: -150, width: 300, height: 300 }}>
                      <UniSpinOrbit sp={sp} moodC={nd.you ? (app && app.mood && app.mood.c) : undefined} isDark={isDark} spinOn={vq.openV > 0.45} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ position: "absolute", top: "calc(18px + var(--tg-top-inset, 0px))", left: 0, right: 0, textAlign: "center", pointerEvents: "none" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: titleC }}>Вселенная</div>
        {sub ? <div style={{ fontSize: 13, color: subC, marginTop: 3 }}>{sub}</div> : null}
      </div>
      {friends != null && list.length === 0 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: "calc(50% + 96px)", textAlign: "center", padding: "0 44px", color: subC, fontSize: 13.5, lineHeight: 1.5, pointerEvents: "none" }}>Позови первых — и рядом с твоей появятся их солнечные системы.</div>
      )}
      <button onClick={onClose} aria-label="Закрыть" className="tap" style={{ position: "absolute", top: "calc(14px + var(--tg-top-inset, 0px))", right: 16, width: 36, height: 36, borderRadius: "50%", border: 0, background: isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.82)", color: isDark ? "#fff" : "var(--text)", display: "grid", placeItems: "center", boxShadow: isDark ? "none" : "0 2px 8px rgba(0,0,0,0.12)", WebkitBackdropFilter: "blur(8px)", backdropFilter: "blur(8px)" }}><I.X size={18} /></button>
      <div style={{ position: "absolute", bottom: "calc(22px + var(--tg-bottom-inset, 0px))", left: 0, right: 0, textAlign: "center", fontSize: 12, color: subC, pointerEvents: "none" }}>коснись, чтобы вернуться</div>
    </div>
  );
  // Portal to <body> so position:fixed escapes the page-stack's CSS transform.
  return (typeof ReactDOM !== "undefined" && ReactDOM.createPortal) ? ReactDOM.createPortal(node, document.body) : node;
}

/* ── Привычки-страница: нижняя полоска недели + Apple-палитра (live-only, v235). The
   HOME card stays the compact row — only the Привычки-page card grows this strip.
   Colours = the Apple JOURNAL palette (David found it: «такие же цвета, как в Журнале») —
   muted warm→cool tints, softer & more refined than the raw system colours. ── */
const BOS_APPLE_COLORS = ["#A06A86", "#F0564C", "#E08AC4", "#E59B9B", "#CBA98D", "#F0A24E", "#19B89B", "#54C3E4", "#4A6CD6", "#84A4B8", "#7F9AF2", "#8676E6"];

// 7 LOCAL day-keys for the CURRENT week, Пн→Вс (left→right) — matches the strip order.
function bosWeekKeys() {
  var now = new Date(); now.setHours(0, 0, 0, 0);
  var dow = (now.getDay() + 6) % 7;            // Mon=0 … Sun=6
  var mon = new Date(now); mon.setDate(now.getDate() - dow);
  var out = [];
  for (var i = 0; i < 7; i++) { var d = new Date(mon); d.setDate(mon.getDate() + i); out.push(bosTodayKey(d)); }
  return out;
}

// A habit's accent: its chosen colour, else the app's BLACK (the black-and-white theme,
// David) — the week-strip renders it as a soft graphite gradient (the generic top-light
// overlay turns #0a0a0a into ~#404040→#0a0a0a). NOT a random Apple colour: «стандартный
// должен быть чёрный, не фиолетовый».
function bosHabitColor(habit) {
  return (habit && habit.color) ? habit.color : "#0a0a0a";
}

// Week-strip: 7 rounded cells Пн→Вс. Filled (a soft top-light gradient over the accent) =
// closed that day; faint same-hue tint = not closed — so the whole row stays ONE colour
// family (David). NO «today» marker on purpose: the current day is already obvious, a ring
// only added noise. Display-only; reads the REAL date-log (same source as the streak).
function HabitWeekStrip({ habit, fill = true, square = false }) {
  // Same cell language as the month calendar (continuity): circle, glossy accent when done,
  // neutral track when empty, a subtle ring on today — карточка ↔ деталь = один кружок-день.
  // fill=true (карточка) → клетки тянутся во всю ширину (крупнее, карточка плотнее/квадратнее).
  var app = (typeof useApp === "function") ? useApp() : null;
  var isDark = app && app.themeOverride === "dark";
  var keys = bosWeekKeys();
  var todayK = (typeof bosTodayKey === "function") ? bosTodayKey() : null;
  // Ripple OUTSIDE the habit: completing a habit from the LIST sends a wave radiating BOTH ways
  // from today's weekday cell (David: «снаружи привычки, когда полностью закрываю — клёвая волна в
  // обе стороны от сегодняшнего дня»). Fires only on the done false→true flip (covers binary AND
  // quantitative-at-full). Web-Animations, staggered by distance from today; auto-cleans.
  var stripRef = React.useRef(null);
  var doneNow = !!(habit && habit.done);
  var prevDone = React.useRef(doneNow);
  React.useEffect(function () {
    if (doneNow && !prevDone.current && stripRef.current) {
      var ti = keys.indexOf(todayK), kids = stripRef.current.children;
      for (var i = 0; i < kids.length; i++) {
        var dist = ti >= 0 ? Math.abs(i - ti) : 0;
        try { kids[i].animate([{ transform: "scale(1)", filter: "brightness(1)" }, { transform: "scale(1.32)", filter: "brightness(1.35)" }, { transform: "scale(1)", filter: "brightness(1)" }], { duration: 440, delay: dist * 55, easing: "cubic-bezier(0.22,0.9,0.3,1.2)" }); } catch (e) {}
      }
    }
    prevDone.current = doneNow;
  }, [doneNow]);
  if (!habit) return null;
  var accent = bosHabitColor(habit);
  var log = habit.log || {};
  var doneFill = bosCellFill(accent, 1);   // SAME soft glossy fill as the month calendar (continuity)
  var empty = (typeof bosCellEmpty === "function") ? bosCellEmpty(accent, isDark) : (isDark ? "rgba(255,255,255,0.13)" : "rgba(0,0,0,0.08)");
  var cell = fill ? { flex: 1, aspectRatio: "1/1", minWidth: 0 } : { width: 20, height: 20, flexShrink: 0 };
  return (
    <div ref={stripRef} aria-hidden style={{ display: "flex", gap: fill ? 7 : 6, width: fill ? "100%" : "auto" }}>
      {keys.map(function (k, i) {
        var fl = !!log[k];
        // Сегодня = единое СТЕКЛЯННОЕ кольцо (то же, что в календаре) в ТОНЕ привычки; заполненный день — своя стекло-заливка.
        var sh = [fl ? bosCellGlass(isDark) : "", (k === todayK) ? bosTodayRing(isDark, accent) : ""].filter(Boolean).join(", ") || "none";
        return <span key={i} style={{ ...cell, borderRadius: square ? 5 : "50%", background: fl ? doneFill : empty, boxShadow: sh }} />;
      })}
    </div>
  );
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
  if (BOS_HOME_WEEK_STYLE === "squares") return <HomeWeekStripClassicLive {...props} />;
  var habits = props.habits || [], isDark = props.isDark;
  var keys = (typeof bosWeekKeys === "function") ? bosWeekKeys() : [];
  var todayK = (typeof bosTodayKey === "function") ? bosTodayKey() : null;
  var WD = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  // ТОЛЬКО ГРАДИЕНТЫ, без обводок (David). Выполнено = глянцевый графит-круг; пусто = тусклый
  // градиент-диск; СЕГОДНЯ = вертикальная «капсула»-подсветка за днём (удлинённая, как на референсе),
  // а не кольцо-строчка. Кружки МЕНЬШЕ (28px), капсула чуть уже ячейки → дышит.
  var doneFill = (typeof bosCellFill === "function") ? bosCellFill("#0a0a0a", 1) : "#0a0a0a";
  var doneGlass = (typeof bosCellGlass === "function") ? bosCellGlass(isDark) : "0 1px 3px rgba(0,0,0,0.18)";
  var emptyFill = isDark ? "linear-gradient(160deg, rgba(255,255,255,0.10), rgba(255,255,255,0.03))" : "linear-gradient(160deg, #eef0f4, #e1e4ea)";
  var emptyInset = isDark ? "inset 0 1px 1px rgba(255,255,255,0.06)" : "inset 0 1px 2px rgba(0,0,0,0.06)";
  var todayCap = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)";
  return (
    <div style={{ display: "flex" }}>
      {keys.map(function (k, i) {
        var on = habits.length > 0 && habits.some(function (h) { return h.log && h.log[k]; });
        var isToday = k === todayK;
        return (
          <div key={i} style={{ flex: 1, minWidth: 0, display: "flex", justifyContent: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "8px 7px 6px", borderRadius: 18, background: isToday ? todayCap : "transparent" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: on ? doneFill : emptyFill, boxShadow: on ? doneGlass : emptyInset }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: isToday ? "var(--text-2)" : "var(--text-4)", letterSpacing: "0.2px" }}>{WD[i]}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
function HomeWeekStripClassicLive({ habits = [], isDark }) {
  const keys = (typeof bosWeekKeys === "function") ? bosWeekKeys() : [];
  const todayK = (typeof bosTodayKey === "function") ? bosTodayKey() : null;
  const WD = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const empty = isDark ? "rgba(255,255,255,0.07)" : "#f1f2f5";
  const fill = (typeof bosCellFill === "function") ? bosCellFill("#0a0a0a", 1) : "#0a0a0a";
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {keys.map((k, i) => {
        const on = habits.length > 0 && habits.some((h) => h.log && h.log[k]);
        const isToday = k === todayK;
        const dayNum = parseInt(("" + k).slice(-2), 10) || "";
        // Today = a GREY glass outline (David: золотой не подходит) — matches the grey today-ring on
        // the habit-detail week strip; the inset highlight gives it the glassy edge.
        const todayRing = isDark ? "0 0 0 1.5px rgba(255,255,255,0.5), inset 0 1px 1px rgba(255,255,255,0.12)" : "0 0 0 1.5px rgba(0,0,0,0.32), inset 0 1px 1.5px rgba(255,255,255,0.85)";
        const sh = [on && typeof bosCellGlass === "function" ? bosCellGlass(isDark) : "", isToday ? todayRing : ""].filter(Boolean).join(", ") || "none";
        return (
          <div key={i} style={{ flex: 1, aspectRatio: "1/1", borderRadius: "30%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1, background: on ? fill : empty, boxShadow: sh }}>
            <span style={{ fontSize: 9, fontWeight: 600, color: on ? "rgba(255,255,255,0.72)" : "var(--text-4)" }}>{WD[i]}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: on ? "#fff" : "var(--text)", fontVariantNumeric: "tabular-nums" }}>{dayNum}</span>
          </div>
        );
      })}
    </div>
  );
}

// Names for the live Apple palette (the create-screen picker label). Includes the old
// core #0A84FF so habits made before the v235 palette still read a colour name.
const BOS_APPLE_COLOR_NAMES = { "#A06A86": "Сливовый", "#F0564C": "Коралловый", "#E08AC4": "Орхидея", "#E59B9B": "Лосось", "#CBA98D": "Глина", "#F0A24E": "Оранжевый", "#19B89B": "Мятный", "#54C3E4": "Голубой", "#4A6CD6": "Синий", "#84A4B8": "Грифельный", "#7F9AF2": "Барвинок", "#8676E6": "Индиго",
  /* legacy system hues — kept so habits made before the Journal palette still read a name */
  "#34C759": "Зелёный", "#007AFF": "Синий", "#0A84FF": "Синий", "#FF9500": "Оранжевый", "#AF52DE": "Фиолетовый", "#FF2D55": "Розовый", "#30B0C7": "Бирюзовый", "#5856D6": "Индиго", "#FF3B30": "Красный", "#FFCC00": "Жёлтый" };

// Neutral DEFAULT colour — a soft grey (David: «дефолтный цвет серый», в духе наших серых стеклянных
// кружков). Lives at the head of the palette next to «Чёрный».
const BOS_GREY = "#8E8E93";
// A glassy colour swatch — a glossy sphere: bright top-left specular + soft bottom inner shadow over
// the colour, so every picker circle reads «в стекле» (David's example). Returns {background,boxShadow};
// `selected` adds the white-gap halo ring in the swatch's own colour. ONE source → identical everywhere.
function bosColorSwatch(hx, selected) {
  var raw = (typeof hx === "string" && hx[0] === "#") ? hx : BOS_GREY;
  // Свотч = СТЕКЛЯННЫЙ кружок (верт. блик + стекло-тень), НЕ глянцевый шар (David). Тон = МЯГКАЯ
  // ПАСТЕЛЬ = ровно тот цвет, что выйдет на карточке. Серый(станд) → СВЕТЛО-серый (базовый нейтраль,
  // «который везде»), чёрный → графит — оба различимы и отражают выбор.
  var isBlack = raw.toLowerCase() === "#0a0a0a";
  var isGrey = raw === BOS_GREY;
  var tone = isBlack ? "#3b3f47" : (isGrey ? "#e9ebf0" : ((typeof bosLightenHex === "function") ? bosLightenHex(raw, 0.42) : raw));
  var sheen = "linear-gradient(180deg, rgba(255,255,255,0.4), rgba(255,255,255,0.06) 58%, rgba(255,255,255,0) 85%)";
  var glass = (typeof bosTileGlass === "function") ? bosTileGlass(false) : "inset 0 1px 1px rgba(255,255,255,0.7), 0 1px 2px rgba(0,0,0,0.1)";
  var ring = isGrey ? "#c2c7d2" : raw;
  return {
    background: sheen + ", " + tone,
    boxShadow: (selected ? "0 0 0 2px #fff, 0 0 0 4px " + ring + ", " : "") + glass, // кольцо 2px (как у колеса), не 1px «кривое»
  };
}
/* THE colour picker — ONE component for привычки / цели / команды so the choice is pixel-identical
   everywhere (David: «определись с палитрой основной»). Custom wheel + Серый + Чёрный + the Apple
   palette (BOS_APPLE_COLORS — the habit colours David likes), every circle glassy (bosColorSwatch). */
function BosColorPickerLive({ value, onChange }) {
  const isHex = typeof value === "string" && value[0] === "#";
  const custom = isHex && value !== "#0a0a0a" && value !== BOS_GREY && !BOS_APPLE_COLORS.includes(value);
  const sheen = "linear-gradient(180deg, rgba(255,255,255,0.4), rgba(255,255,255,0.06) 58%, rgba(255,255,255,0) 85%)"; // верт. стекло, не шар (David)
  const glass = (typeof bosTileGlass === "function") ? bosTileGlass(false) : "inset 0 1px 1px rgba(255,255,255,0.7), 0 1px 2px rgba(0,0,0,0.1)";
  const base = { width: 32, height: 32, borderRadius: "50%", border: 0, flexShrink: 0, cursor: "pointer", transition: "box-shadow 0.15s" };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, overflowX: "auto", overflowY: "hidden", scrollbarWidth: "none", WebkitOverflowScrolling: "touch", padding: "10px 8px" }}>
      <label className="tap" data-haptic="selection" style={{ position: "relative", width: 32, height: 32, borderRadius: "50%", flexShrink: 0, cursor: "pointer",
        background: sheen + ", conic-gradient(from 0deg, #FF3B30, #FF9500, #FFCC00, #34C759, #30B0C7, #007AFF, #AF52DE, #FF2D55, #FF3B30)",
        boxShadow: (custom ? "0 0 0 2px #fff, 0 0 0 4px var(--text-3), " : "") + glass }}>
        <input type="color" value={isHex ? value : BOS_GREY} onChange={(e) => onChange(e.target.value)} aria-label="Свой цвет"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, border: 0, padding: 0, cursor: "pointer" }} />
      </label>
      <span style={{ width: 1, height: 26, background: "var(--line)", flexShrink: 0 }} />
      {[{ c: BOS_GREY, l: "Серый (стандарт)" }, { c: "#0a0a0a", l: "Чёрный" }].map((n) => (
        <button key={n.c} type="button" className="tap" data-haptic="selection" onClick={() => onChange(n.c)} aria-label={n.l}
          style={{ ...base, ...bosColorSwatch(n.c, value === n.c) }} />
      ))}
      {BOS_APPLE_COLORS.map((c) => (
        <button key={c} type="button" className="tap" data-haptic="selection" onClick={() => onChange(c)} aria-label={BOS_APPLE_COLOR_NAMES[c] || "Цвет"}
          style={{ ...base, ...bosColorSwatch(c, value === c) }} />
      ))}
    </div>
  );
}

// Pull the LAST emoji grapheme a user typed, so the icon picker can BE the system emoji
// keyboard (David: «открывается клавиатура с эмодзи», not a fixed grid). Intl.Segmenter
// keeps multi-codepoint emoji (🧘‍♀️) whole; Extended_Pictographic filters out letters.
function bosExtractEmoji(s) {
  if (!s) return "";
  var picks;
  try { picks = Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(s), function (x) { return x.segment; }); }
  catch (e) { picks = Array.from(s); }
  for (var i = picks.length - 1; i >= 0; i--) { if (/\p{Extended_Pictographic}/u.test(picks[i])) return picks[i]; }
  return "";
}

/* Emoji PANEL (live) — opens STRAIGHT on emojis. The iOS system keyboard can't be forced
   into emoji mode (it opened on ABC — David: «непонятно что делать»), so the icon tile
   opens this own sheet instead: categorised grid, tap → onPick + close. */
const BOS_EMOJI_CATS = [
  { ic: "😀", list: ["😀","😃","😄","😁","😆","😅","😂","🙂","🙃","😉","😊","😇","🥰","😍","🤩","😘","😋","😜","🤪","🤗","🤔","🤨","😐","😏","😌","😔","😴","😎","🤓","🧐","🥳","🤯","😤","😡","🥺","😱","🤝","🙏","💪","🧠","👀","🗣️","👍","👎","👏","🙌","✌️","🤞","🔥"] },
  { ic: "🐶", list: ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🐔","🐧","🐦","🦆","🦅","🦉","🐝","🦋","🐢","🐍","🐙","🦀","🐬","🐳","🐠","🌱","🌿","☘️","🍀","🌳","🌲","🌵","🌴","🌷","🌸","🌹","🌻","🌼","🍁","🌙","⭐","☀️","🌈","❄️","💧"] },
  { ic: "🍎", list: ["🍎","🍏","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🥑","🥦","🥕","🌽","🥗","🍞","🧀","🥚","🍳","🥩","🍗","🍔","🍟","🍕","🌮","🍜","🍣","🍱","🍦","🍰","🎂","🍫","🍬","🍭","☕","🍵","🥤","🧃","🍷","🍺","💊","🥛","🧂"] },
  { ic: "⚽", list: ["⚽","🏀","🏈","⚾","🎾","🏐","🏉","🎱","🏓","🏸","🥊","🥋","⛳","🏌️","🏃","🚶","🧗","🚴","🏊","🏄","🧘","🤸","⛹️","🏋️","🤾","🚣","⛷️","🏂","🏆","🥇","🥈","🥉","🎯","🎮","🎲","🎸","🎹","🎵","🎨","📷","🎬","✍️","📖","📚","💻","🧩","♟️","🎤"] },
  { ic: "✈️", list: ["🚗","🚕","🚙","🚌","🏎️","🚓","🚑","🚒","🚲","🛴","🛵","🏍️","✈️","🚀","🚁","⛵","🚤","🚢","🏠","🏡","🏢","🏥","🏦","🏨","🏫","⛪","🗼","🗽","🏔️","⛰️","🌋","🏕️","🏖️","🏝️","🌅","🌆","🌃","🌉","🗺️","🧭","⛺","🚩"] },
  { ic: "💡", list: ["⌚","📱","💻","⌨️","🖥️","🖨️","🕹️","💡","🔦","🕯️","📷","🎥","📺","📻","⏰","⏱️","⌛","💰","💳","💎","🔧","🔨","🧰","🔑","🔒","🛏️","🚿","🛁","🧴","🧹","🧺","🧸","🎁","🎈","🎀","📦","✏️","📝","📌","📎","📏","✂️","🗑️","🔋","🧲"] },
  { ic: "❤️", list: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","💖","💗","💕","❣️","💔","✨","⭐","🌟","💫","⚡","✅","☑️","✔️","❌","➕","➖","❓","❗","💯","🔥","🎉","🎊","🏁","🚩","♻️","⚠️","🔔","💤","🆗","🆕","🔴","🟠","🟡","🟢","🔵","🟣","⚫","⚪","🟤"] },
];
/* SF-Symbols-style glyphs. Apple's REAL SF Symbols are licence-locked to Apple platforms
   and can't ship on the web — these are faithful look-alikes: clean rounded line icons on
   the same 24-grid as the UI set `I`. This map ADDS the shapes `I` lacks (fitness, food,
   nature, hobbies…); bosSymCmp resolves BOS_SF first, then falls back to `I`, so the picker
   offers ~47 icons across every habit/goal/team category. David: «настоящие iOS-символы,
   и их мало» → больше и ближе к стандарту. (`Icon` is the shared wrapper from icons.jsx.) */
const BOS_SF = {
  Flame: (p) => <Icon {...p}><path d="M12 3c.4 3 2.2 4.2 3.4 5.8A6 6 0 1 1 6.5 12c0-1.4.5-2.4 1.2-3.2.2 1.1.9 1.8 1.8 2C10.8 9 11 6 12 3z"/></Icon>,
  Drop: (p) => <Icon {...p}><path d="M12 3c3 3.8 6 7 6 10.4A6 6 0 1 1 6 13.4C6 10 9 6.8 12 3z"/></Icon>,
  Leaf: (p) => <Icon {...p}><path d="M5 21C4 12 9 4 20 4c0 11-7 16-15 16z"/><path d="M9 17c3-4 6-6 9-7.5"/></Icon>,
  Bed: (p) => <Icon {...p}><path d="M3 19V8M3 13h13a4 4 0 0 1 4 4v2M7 13v-1.5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 12 11.5V13"/></Icon>,
  Sun: (p) => <Icon {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7"/></Icon>,
  Sunrise: (p) => <Icon {...p}><path d="M3 18.5h18M6.5 18.5a5.5 5.5 0 0 1 11 0M12 3.5V8M5 11l1.6 1.6M19 11l-1.6 1.6M2 15h2M20 15h2M9 8.5L12 5.5l3 3"/></Icon>,
  Star: (p) => <Icon {...p}><path d="M12 3.6l2.6 5.2 5.8.9-4.2 4.1 1 5.7L12 16.8 6.8 19.5l1-5.7L3.6 9.7l5.8-.9L12 3.6z"/></Icon>,
  Mountain: (p) => <Icon {...p}><path d="M3 20l5.5-10 3.5 5 2.2-3.5L21 20z"/><path d="M8 10.5l1.6-2.8"/></Icon>,
  Tree: (p) => <Icon {...p}><path d="M12 3.5c2.8 0 4.6 2.2 4.6 4.6 1.9.2 3 1.6 3 3.2 0 1.5-1.2 2.7-3 2.7H7.4c-1.8 0-3-1.2-3-2.7 0-1.6 1.1-3 3-3.2 0-2.4 1.8-4.6 4.6-4.6z"/><path d="M12 14v6.5M9 19.5h6"/></Icon>,
  Sprout: (p) => <Icon {...p}><path d="M12 21v-7.5"/><path d="M12 14C12 10.4 9.1 8 5.5 8 5.5 11.6 8.4 14 12 14z"/><path d="M12 12.5c0-3.1 2.6-5.5 6.5-5.5 0 3.1-2.9 5.5-6.5 5.5z"/></Icon>,
  Snowflake: (p) => <Icon {...p}><path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5L4.2 16.5"/><path d="M9.7 4.3L12 6l2.3-1.7M14.3 19.7L12 18l-2.3 1.7M5.7 8.9l.2 2.8M5.7 8.9l-2.7.7M18.3 15.1l-.2-2.8M18.3 15.1l2.7-.7M18.3 8.9l-.2 2.8M18.3 8.9l2.7.7M5.7 15.1l.2-2.8M5.7 15.1l-2.7-.7"/></Icon>,
  Bicycle: (p) => <Icon {...p}><circle cx="6" cy="17" r="3.3"/><circle cx="18" cy="17" r="3.3"/><path d="M6 17l4-7h4M9.5 10l3 4.5M12 10l2.5-2.5"/></Icon>,
  Activity: (p) => <Icon {...p}><path d="M3 12.5h3.5l2-5.5 3.5 11 2.2-5.5H21"/></Icon>,
  Cup: (p) => <Icon {...p}><path d="M5 8h11v5a4.5 4.5 0 0 1-4.5 4.5h-2A4.5 4.5 0 0 1 5 13V8z"/><path d="M16 9.5h1.8a2.2 2.2 0 0 1 0 4.4H16"/><path d="M8.2 3.2c-.5.9.5 1.7 0 2.6M11.5 3.2c-.5.9.5 1.7 0 2.6"/></Icon>,
  Apple: (p) => <Icon {...p}><path d="M12 7.5c-1-1.8-3.2-2.2-4.8-1C5.8 7.7 5.4 10 6.4 12.8s2.6 5 4.1 5c.7 0 1-.4 1.5-.4s.8.4 1.5.4c1.5 0 3.1-2.2 4.1-5s.6-5.1-.8-6.3c-1.6-1.2-3.8-.8-4.8 1z"/><path d="M12 7.5c.2-1.8 1.3-2.9 2.8-3.3"/></Icon>,
  Pill: (p) => <Icon {...p}><rect x="2.5" y="9" width="12" height="6.5" rx="3.25" transform="rotate(-45 8.5 12.25)"/><path d="M6.3 8.7l4.6 4.6"/><circle cx="16.5" cy="15.5" r="5"/></Icon>,
  Music: (p) => <Icon {...p}><path d="M9 18V6l11-2.2V16"/><circle cx="6.2" cy="18" r="2.8"/><circle cx="17.2" cy="16" r="2.8"/></Icon>,
  Headphones: (p) => <Icon {...p}><path d="M4.5 14v-1.5a7.5 7.5 0 0 1 15 0V14"/><rect x="3" y="13.5" width="4" height="6.5" rx="2"/><rect x="17" y="13.5" width="4" height="6.5" rx="2"/></Icon>,
  Palette: (p) => <Icon {...p}><path d="M12 3a9 9 0 0 0 0 18c1.2 0 2-1 2-2 0-.6-.3-1-.6-1.4-.3-.4-.6-.8-.6-1.4 0-1.1.9-2 2-2h1.5A4.7 4.7 0 0 0 21 9.5C21 5.9 16.9 3 12 3z"/><circle cx="8" cy="11" r="1"/><circle cx="12" cy="8.5" r="1"/><circle cx="16" cy="11" r="1"/></Icon>,
  Camera: (p) => <Icon {...p}><rect x="3" y="7.5" width="18" height="12.5" rx="3"/><circle cx="12" cy="13.5" r="3.2"/><path d="M8.5 7.5L9.7 5h4.6l1.2 2.5"/></Icon>,
  Game: (p) => <Icon {...p}><rect x="2" y="8" width="20" height="9.5" rx="4.75"/><path d="M7 11v3.2M5.4 12.6h3.2"/><circle cx="16" cy="11.6" r="1"/><circle cx="18.4" cy="14" r="1"/></Icon>,
  Gift: (p) => <Icon {...p}><rect x="3.5" y="9.5" width="17" height="10.5" rx="1.5"/><path d="M3.5 13.5h17M12 9.5V20"/><path d="M12 9.5C9.3 9.5 7.5 8.6 7.5 7.2 7.5 6 8.6 5.4 9.7 6c1.4.8 2.3 3.5 2.3 3.5s.9-2.7 2.3-3.5c1.1-.6 2.2 0 2.2 1.2 0 1.4-1.8 2.3-4.5 2.3z"/></Icon>,
  Dollar: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M14.7 9.3C14.1 8.3 13.1 8 12 8c-1.6 0-2.6 1-2.6 2.1 0 1 .8 1.7 2.6 2 1.9.3 2.7 1 2.7 2.1 0 1.1-1 2-2.7 2-1.1 0-2.1-.4-2.7-1.4M12 6.4v11.2"/></Icon>,
};
// Curated order, grouped by category — what the picker shows. Each name resolves through
// bosSymCmp (BOS_SF first, then the UI set I).
const BOS_SYMBOLS = [
  "Heart", "Activity", "Dumbbell", "Bicycle", "Flame", "Drop", "Bed", "Pill", "Apple", "Cup",
  "Bulb", "Book", "Pencil", "Music", "Headphones", "Palette", "Mic",
  "Sun", "Sunrise", "Moon", "Clock", "Bell", "Calendar",
  "Target", "Trophy", "Flag", "Sparkles", "Star", "Sprout", "ChartBar",
  "Users", "Globe", "MapPin", "Mountain", "Tree", "Camera", "Game", "Gift", "Compass",
  "Briefcase", "Wallet", "Dollar", "Home", "Phone", "Mail", "Snowflake",
];
function bosSymCmp(nm) { return (typeof BOS_SF !== "undefined" && BOS_SF[nm]) || (window.I || {})[nm] || null; }

// Render a habit/goal/team icon. A "sf:<Name>" sentinel → the monochrome glyph in `color`;
// anything else (a normal emoji string) is returned UNCHANGED, so existing data and the
// DEMO stay pixel-identical. Used at every live icon site so a chosen symbol shows up
// everywhere, never as raw "sf:…" text.
function bosIcon(val, size, color) {
  if (typeof val === "string" && val.slice(0, 3) === "sf:") {
    var Cmp = bosSymCmp(val.slice(3));
    if (Cmp) return React.createElement(Cmp, { size: size || 22, color: color || "currentColor", strokeWidth: 1.85 });
    return null;
  }
  return val || "";
}

function EmojiPickerLive({ onPick, accent = "#0a0a0a", current, embedded = false }) {
  const { close } = useSheet();
  const [mode, setMode] = React.useState((typeof current === "string" && current.slice(0, 3) === "sf:") ? "symbol" : "emoji");
  const [cat, setCat] = React.useState(0);
  // embedded = живёт ВНУТРИ другой шторки (напр. создание командной привычки) → не закрывать
  // общий sheet-хост на выбор, просто вернуть значок (one-sheet host рендерит одну шторку).
  const pick = (e) => { if (onPick) onPick(e); if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (_) {} } if (!embedded) close(); };
  const symColor = (typeof accent === "string" && accent[0] === "#") ? accent : "#0a0a0a";
  return (
    <div style={{ padding: "2px 10px 6px", color: "#0a0a0a" }}>
      <div style={{ textAlign: "center", fontSize: 17, fontWeight: 700, marginBottom: 12 }}>Выбери иконку</div>
      {/* Toggle — colourful ЭМОДЗИ (left, default) / monochrome iOS-style СИМВОЛЫ (right). David
          flipped the order: emoji first. */}
      <div style={{ display: "flex", gap: 4, padding: 3, background: "var(--surface-3)", borderRadius: 12, marginBottom: 12 }}>
        {[["emoji", "Эмодзи"], ["symbol", "Символы"]].map((m) => (
          <button key={m[0]} className="tap" data-no-haptic onClick={() => setMode(m[0])}
            style={{ flex: 1, height: 34, borderRadius: 9, border: 0, fontSize: 13.5, fontWeight: 600, cursor: "pointer",
              background: mode === m[0] ? "#fff" : "transparent", color: mode === m[0] ? "#0a0a0a" : "var(--text-3)",
              boxShadow: mode === m[0] ? "0 1px 3px rgba(0,0,0,0.10)" : "none", transition: "background 0.15s" }}>{m[1]}</button>
        ))}
      </div>
      {mode === "symbol" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6, maxHeight: 264, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "2px 0" }}>
          {BOS_SYMBOLS.map((nm, i) => {
            var Cmp = bosSymCmp(nm);
            if (!Cmp) return null;
            return (
              <button key={i} className="tap" data-no-haptic onClick={() => pick("sf:" + nm)} aria-label={nm}
                style={{ aspectRatio: "1 / 1", borderRadius: 14, border: 0, background: "var(--surface-3)", display: "grid", placeItems: "center", cursor: "pointer", padding: 0 }}>
                <Cmp size={23} color={symColor} strokeWidth={2} />
              </button>
            );
          })}
        </div>
      ) : (<>
        <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
          {BOS_EMOJI_CATS.map((c, i) => (
            <button key={i} className="tap" data-no-haptic onClick={() => setCat(i)} aria-label={"Категория " + (i + 1)}
              style={{ flex: 1, height: 38, borderRadius: 11, border: 0, fontSize: 19, cursor: "pointer", background: i === cat ? "var(--surface-3)" : "transparent" }}>{c.ic}</button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 2, maxHeight: 248, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
          {BOS_EMOJI_CATS[cat].list.map((e, i) => (
            <button key={i} className="tap" data-no-haptic onClick={() => pick(e)} style={{ aspectRatio: "1 / 1", borderRadius: 10, border: 0, background: "transparent", fontSize: 25, cursor: "pointer", padding: 0 }}>{e}</button>
          ))}
        </div>
      </>)}
    </div>
  );
}

/* LIVE avatar picker — the SAME rich emoji panel as habit/goal/team creation (BOS_EMOJI_CATS,
   category row + 8-col grid), with Memoji as the second tab. David: «не наш урезанный выбор —
   богатый как при создании привычек; слева эмодзи, справа мемодзи». SF-symbols are intentionally
   omitted here (they don't render as an avatar face). Lives live-only so it can use the rich panel;
   the shared core AvatarPickerSheet (demo + edit-profile sheet) stays untouched. */
function AvatarPickerSheetLive({ dark = false }) {
  const app = (typeof useApp === "function") ? useApp() : null;
  const { close } = useSheet();
  const C = (typeof sheetColors === "function") ? sheetColors(dark) : { text: "#0a0a0a", sub: "rgba(0,0,0,0.5)", field: "#f4f4f6", btn: "#0a0a0a", btnFg: "#fff" };
  const cur = "" + (app?.avatar || "");
  const [tab, setTab] = React.useState(cur.indexOf("emoji:") === 0 ? "emoji" : "memoji");
  const [cat, setCat] = React.useState(0);
  const pick = (val) => { try { app && app.setAvatar && app.setAvatar(val); } catch (e) {} if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} } };
  const CATS = (typeof BOS_EMOJI_CATS !== "undefined") ? BOS_EMOJI_CATS : [];
  const MEMO = (typeof BOS_MEMOJI !== "undefined") ? BOS_MEMOJI : [];
  return (
    <div style={{ padding: "2px 16px 8px", color: C.text }}>
      <div style={{ fontSize: 19, fontWeight: 700, textAlign: "center" }}>Аватар</div>
      <div style={{ fontSize: 12.5, color: C.sub, textAlign: "center", marginTop: 3, lineHeight: 1.4 }}>Выбери лицо — Эмодзи или Мемоджи. Сменить можно когда угодно.</div>
      <div style={{ display: "flex", gap: 6, background: C.field, borderRadius: 999, padding: 4, margin: "14px auto 12px", width: "fit-content" }}>
        {[["emoji", "Эмодзи"], ["memoji", "Мемоджи"]].map(function (m) {
          return <button key={m[0]} onClick={() => setTab(m[0])} className="tap" data-no-haptic style={{ border: 0, borderRadius: 999, padding: "7px 22px", fontSize: 13.5, fontWeight: 600, cursor: "pointer", background: tab === m[0] ? C.btn : "transparent", color: tab === m[0] ? C.btnFg : C.sub }}>{m[1]}</button>;
        })}
      </div>
      {tab === "emoji" ? (
        <>
          <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
            {CATS.map(function (c, i) {
              return <button key={i} className="tap" data-no-haptic onClick={() => setCat(i)} aria-label={"Категория " + (i + 1)}
                style={{ flex: 1, height: 38, borderRadius: 11, border: 0, fontSize: 19, cursor: "pointer", background: i === cat ? C.field : "transparent" }}>{c.ic}</button>;
            })}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 2, maxHeight: 248, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
            {(CATS[cat] ? CATS[cat].list : []).map(function (e, i) {
              var v = "emoji:" + e;
              return <button key={i} className="tap" data-no-haptic onClick={() => pick(v)} style={{ aspectRatio: "1 / 1", borderRadius: 10, border: 0, background: cur === v ? C.field : "transparent", fontSize: 25, cursor: "pointer", padding: 0 }}>{e}</button>;
            })}
          </div>
        </>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 13, maxHeight: 296, overflowY: "auto", padding: "2px 2px 4px" }}>
          {MEMO.map(function (m) {
            var val = m === "default" ? null : m;
            var sel = m === "default" ? (!cur || cur === "default") : cur === m;
            return (
              <button key={m} onClick={() => pick(val)} className="tap" aria-label="Аватар" style={{ padding: 0, border: 0, background: "transparent", display: "grid", placeItems: "center", justifySelf: "center" }}>
                <div style={{ borderRadius: "50%", padding: 3, boxShadow: sel ? "0 0 0 2.5px " + C.text : "none" }}>
                  <BosAvatar avatar={val} size={52} style={{ border: "2px solid " + (dark ? "#1c1c1e" : "#fff") }} />
                </div>
              </button>
            );
          })}
        </div>
      )}
      <button onClick={close} className="tap" style={{ width: "100%", marginTop: 16, background: C.btn, color: C.btnFg, border: 0, borderRadius: 999, padding: 13, fontSize: 15, fontWeight: 600 }}>Готово</button>
    </div>
  );
}

/* Count check (live) — for habits whose DAILY goal is >1 (e.g. 20 отжиманий). Tap = +1,
   long-press = −1; a ring (big goals) or radial SEGMENTS (≤6) fill with the count. The day
   is marked done — and XP granted — ONLY at the FULL count (David: «экспа только за
   закрытие полной привычки»). Done flips through the shared toggleHabit (XP derives from
   the date-log); the running count lives in habit.counts[dayKey] via updateHabit (no XP). */
function HabitCountCheck({ habit, app, xp = 10 }) {
  const goal = Math.max(2, habit.goalPerDay || 2);
  const today = bosTodayKey();
  const isDone = !!habit.done;
  const count = isDone ? goal : ((habit.counts && habit.counts[today]) || 0);
  const accent = bosHabitColor(habit);
  const isDark = !!(typeof document !== "undefined" && document.querySelector(".bos-page.theme-dark"));
  const [tick, setTick] = React.useState(0);
  const btnRef = React.useRef(null);
  const lpTimer = React.useRef(null);
  const suppress = React.useRef(false);

  const apply = (raw) => {
    const next = Math.max(0, Math.min(goal, raw));
    if (next === count) return;
    const willDone = next >= goal;
    const counts = Object.assign({}, habit.counts || {});
    counts[today] = next;
    if (app && app.updateHabit) app.updateHabit(habit.id, { counts });
    if (willDone !== isDone && app && app.toggleHabit) app.toggleHabit(habit.id); // flips done + XP
    if (willDone && !isDone) setTick(function (t) { return t + 1; });             // XP pop
    if (window.tgHaptic) { try { window.tgHaptic(willDone ? "success" : "light"); } catch (_) {} }
  };
  const startLP = (e) => { e.stopPropagation(); suppress.current = false; lpTimer.current = setTimeout(function () { suppress.current = true; if (window.tgHaptic) { try { window.tgHaptic("rigid"); } catch (_) {} } apply(count - 1); }, 480); };
  const endLP = () => { if (lpTimer.current) { clearTimeout(lpTimer.current); lpTimer.current = null; } };
  const onClick = (e) => { e.stopPropagation(); if (suppress.current) { suppress.current = false; return; } apply(isDone ? 0 : count + 1); };

  // Ring geometry is 44px, but the LAYOUT box stays 30px — the ring renders as an OVERFLOWING overlay
  // so the disc lines up EXACTLY with the plain 30px checks in the column (David: «центрируй
  // относительно других» — раньше 44px-бокс смещал кружок на 7px влево). On full completion the ring
  // DISAPPEARS → only the standard graphite checkmark remains, identical to every other habit.
  const SIZE = 44, CX = SIZE / 2, R = 19.5, sw = 3, C = 2 * Math.PI * R;
  const track = isDark ? "rgba(255,255,255,0.16)" : "rgba(10,10,10,0.10)";

  let ringEls;
  if (goal <= 7) {
    const pitch = 360 / goal, gap = Math.min(22, pitch * 0.34);
    const pt = (deg) => { const a = deg * Math.PI / 180; return [(CX + R * Math.cos(a)).toFixed(2), (CX + R * Math.sin(a)).toFixed(2)]; };
    const segs = [];
    for (let i = 0; i < goal; i++) {
      const a0 = -90 + i * pitch + gap / 2, a1 = -90 + (i + 1) * pitch - gap / 2;
      const p0 = pt(a0), p1 = pt(a1);
      segs.push(<path key={i} d={"M " + p0[0] + " " + p0[1] + " A " + R + " " + R + " 0 0 1 " + p1[0] + " " + p1[1]} fill="none" stroke={i < count ? accent : track} strokeWidth={sw} strokeLinecap="round" style={{ transition: "stroke 0.25s ease" }} />);
    }
    ringEls = segs;
  } else {
    ringEls = [
      <circle key="t" cx={CX} cy={CX} r={R} fill="none" stroke={track} strokeWidth={sw} />,
      <circle key="p" cx={CX} cy={CX} r={R} fill="none" stroke={accent} strokeWidth={sw} strokeLinecap="round" strokeDasharray={C.toFixed(2)} strokeDashoffset={(C * (1 - count / goal)).toFixed(2)} transform={"rotate(-90 " + CX + " " + CX + ")"} style={{ transition: "stroke-dashoffset 0.4s ease" }} />,
    ];
  }

  // Center disc = the SAME 30px glass check as everywhere. DONE → standard checked glass + ✓ (no
  // --check-color override → same graphite as the plain checks). In progress → grey glass + count.
  const disc = isDone
    ? <span className="check-btn" style={{ width: 30, height: 30 }}><I.Check size={16} strokeWidth={2.8} color="#fff" /></span>
    : <span className="check-btn unchecked" style={{ width: 30, height: 30 }}><span style={{ color: count > 0 ? accent : "var(--text-4)", fontSize: 12.5, fontWeight: 700, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{count}</span></span>;

  return (
    <div style={{ position: "relative", flexShrink: 0, width: 30, height: 30, display: "grid", placeItems: "center" }}>
      <XpFloat tick={tick} xp={xp} anchorRef={btnRef} />
      <button ref={btnRef} className="tap hit44" data-no-haptic onClick={onClick}
        onPointerDown={startLP} onPointerUp={endLP} onPointerLeave={endLP} onPointerCancel={endLP}
        aria-label={"Прогресс " + count + " из " + goal + ", тап +1, удержание −1"}
        style={{ position: "relative", border: 0, background: "transparent", padding: 0, width: 30, height: 30, display: "grid", placeItems: "center", cursor: "pointer", overflow: "visible" }}>
        {/* ring OVERFLOWS the 30px box (centered on the disc) so it never shifts the disc off the column */}
        {!isDone && <svg width={SIZE} height={SIZE} viewBox={"0 0 " + SIZE + " " + SIZE} style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", pointerEvents: "none", overflow: "visible" }}>{ringEls}</svg>}
        {disc}
      </button>
    </div>
  );
}

// TIMER-привычка — тот же ЯЗЫК, что у количественной (HabitCountCheck): 30px стеклянный диск в центре +
// 44px кольцо-оверлей, НО вместо счётчика внутри — кнопка ▶/⏸, а вместо колец-долей — СЕКЦИИ, которые
// наполняются по мере хода времени (David: «плей и секции внутри нашего кружочка, вместо кольца»). Тап по
// диску = старт/пауза; секции заливаются accent'ом в реальном времени; дошёл до конца → done + XP + ✓
// (кольцо исчезает, остаётся стандартная галочка, как у всех). Тап по готовому = снять отметку и сбросить.
function HabitTimerCheck({ habit, app, xp = 10 }) {
  const total = Math.max(1, Math.round(habit.duration || 1)) * 60; // секунды
  const isDone = !!habit.done;
  const accent = bosHabitColor(habit);
  const isDark = !!(typeof document !== "undefined" && document.querySelector(".bos-page.theme-dark"));
  const [running, setRunning] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  const [tick, setTick] = React.useState(0);
  const [showTime, setShowTime] = React.useState(false); // David: старт → ⏸ пару секунд → потом ТИКАЮЩЕЕ время
  const btnRef = React.useRef(null);
  const done = isDone || (total > 0 && elapsed >= total);
  const frac = isDone ? 1 : Math.min(1, elapsed / total);

  // Тикаем по МЕТКАМ ВРЕМЕНИ (не по счёту тиков) → нет дрейфа, даже если вкладка «спит».
  React.useEffect(() => {
    if (!running) return;
    const base = elapsed, start = Date.now();
    const id = setInterval(() => {
      const e = base + (Date.now() - start) / 1000;
      if (e >= total) {
        setElapsed(total); setRunning(false); setTick((t) => t + 1);
        if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (_) {} }
        if (!habit.done && app && app.toggleHabit) app.toggleHabit(habit.id); // flips done + XP
      } else setElapsed(e);
    }, 200);
    return () => clearInterval(id);
  }, [running]);

  // Пошёл таймер → сначала ⏸ (видно, что можно остановить), через 2.5с диск переключается на тикающее
  // оставшееся время. Пауза/сброс → обратно к значку. (David: «полосочки stop, потом тикает время».)
  React.useEffect(() => {
    if (!running) { setShowTime(false); return; }
    const t = setTimeout(() => setShowTime(true), 2500);
    return () => clearTimeout(t);
  }, [running]);

  const onClick = (e) => {
    e.stopPropagation();
    if (done) { // тап по готовому → снять отметку и обнулить таймер (как счётчик: done → 0)
      if (isDone && app && app.toggleHabit) app.toggleHabit(habit.id);
      setElapsed(0); setRunning(false);
      if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (_) {} }
      return;
    }
    if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (_) {} }
    setRunning((r) => !r);
  };

  // Та же геометрия, что у HabitCountCheck (44px кольцо-оверлей над 30px-боксом → диск не съезжает).
  const SIZE = 44, CX = SIZE / 2, R = 19.5, sw = 3;
  const track = isDark ? "rgba(255,255,255,0.16)" : "rgba(10,10,10,0.10)";
  // Секции: число ~ по длительности (5..12), как в прежнем таймере. База — тускло, поверх — accent ровно
  // на пройденную долю (целые секции + ЧАСТИЧНАЯ текущая), поэтому реально видно, как оно наполняется.
  const SEG = Math.min(12, Math.max(5, Math.round(habit.duration || 6)));
  const pitch = 360 / SEG, gap = Math.min(22, pitch * 0.34);
  const pt = (deg) => { const a = deg * Math.PI / 180; return [(CX + R * Math.cos(a)).toFixed(2), (CX + R * Math.sin(a)).toFixed(2)]; };
  const arc = (a0, a1) => { const p0 = pt(a0), p1 = pt(a1); return "M " + p0[0] + " " + p0[1] + " A " + R + " " + R + " 0 " + ((a1 - a0 > 180) ? 1 : 0) + " 1 " + p1[0] + " " + p1[1]; };
  const pos = frac * SEG;
  const ringEls = [];
  for (let i = 0; i < SEG; i++) {
    const a0 = -90 + i * pitch + gap / 2, a1 = -90 + (i + 1) * pitch - gap / 2;
    ringEls.push(<path key={"b" + i} d={arc(a0, a1)} fill="none" stroke={track} strokeWidth={sw} strokeLinecap="round" />);
  }
  for (let i = 0; i < SEG; i++) {
    const a0 = -90 + i * pitch + gap / 2, a1 = -90 + (i + 1) * pitch - gap / 2;
    const f = Math.max(0, Math.min(1, pos - i));
    if (f > 0.001) ringEls.push(<path key={"f" + i} d={arc(a0, a0 + (a1 - a0) * f)} fill="none" stroke={accent} strokeWidth={sw} strokeLinecap="round" style={{ transition: "d 0.2s linear" }} />);
  }

  // Оставшееся время m:ss (округляем вверх, чтобы «0:00» показалось только в самом конце).
  const remain = Math.max(0, Math.ceil(total - elapsed));
  const mmss = Math.floor(remain / 60) + ":" + (remain % 60 < 10 ? "0" : "") + (remain % 60);
  // Диск = тот же 30px .check-btn. DONE → ✓. Идёт: первые ~2.5с ⏸, потом ТИКАЮЩЕЕ время. Иначе ▶ (старт/пауза).
  const disc = done
    ? <span className="check-btn" style={{ width: 30, height: 30 }}><I.Check size={16} strokeWidth={2.8} color="#fff" /></span>
    : <span className="check-btn unchecked" style={{ width: 30, height: 30, color: accent }}>
        {running
          ? (showTime
              ? <span style={{ fontSize: mmss.length > 4 ? 8 : 9.5, fontWeight: 800, letterSpacing: "-0.6px", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{mmss}</span>
              : <I.Pause size={13} />)
          : <span style={{ display: "grid", placeItems: "center", transform: "translateX(0.5px)" }}><I.Play size={12} /></span>}
      </span>;

  return (
    <div style={{ position: "relative", flexShrink: 0, width: 30, height: 30, display: "grid", placeItems: "center" }}>
      <XpFloat tick={tick} xp={xp} anchorRef={btnRef} />
      <button ref={btnRef} className="tap hit44" data-no-haptic onClick={onClick}
        aria-label={running ? "Пауза таймера" : (done ? "Готово, снять отметку" : "Старт таймера " + Math.round(total / 60) + " минут")}
        style={{ position: "relative", border: 0, background: "transparent", padding: 0, width: 30, height: 30, display: "grid", placeItems: "center", cursor: "pointer", overflow: "visible" }}>
        {!done && <svg width={SIZE} height={SIZE} viewBox={"0 0 " + SIZE + " " + SIZE} style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", pointerEvents: "none", overflow: "visible" }}>{ringEls}</svg>}
        {disc}
      </button>
    </div>
  );
}

/* Edit affordance — a ROUND glass pencil icon (NOT a text pill), the iOS way (David: «зачем
   писать „Изменить" — сделай иконку-карандаш в кружочке с тем же отражением, что у главной
   иконки привычки; стандартизировать по всему приложению»). One button for habit / goal / team
   (team = owner only). Same size as the header back button (.icon-btn 40px circle), with the hero
   tile's glass (BOS_TILE_SHEEN + bosTileGlass) so it reads as that nice reflective tile. */
function EditGlassButtonLive({ onClick, label = "Изменить" }) {
  const app = (typeof useApp === "function") ? useApp() : null;
  const dark = app?.themeOverride === "dark";
  return (
    <button onClick={onClick} className="tap" data-haptic="selection" aria-label={label} title={label}
      style={{
        width: 40, height: 40, borderRadius: "50%", border: 0, display: "grid", placeItems: "center", cursor: "pointer",
        color: dark ? "#fff" : "var(--text)",
        background: BOS_TILE_SHEEN + ", " + (dark ? "rgba(255,255,255,0.10)" : "var(--surface-3)"),
        boxShadow: bosTileGlass(dark),
      }}>
      <I.Pencil size={16} strokeWidth={2} />
    </button>
  );
}

/* Team share — LIVE fork of core TeamShareSheet. The ONLY change: the invite link is a
   TELEGRAM deep-link t.me/<bot>?startapp=team_<cloudId> (not the github.io/?team= web URL,
   which can't open the Mini App from Telegram). The launch path decodes that start_param
   → joinViaLink. A local team without a cloudId falls back to the plain bot link. */
function TeamShareSheetLive({ team }) {
  const [copied, setCopied] = React.useState(false);
  const { close } = (typeof useSheet === "function") ? useSheet() : {};
  const isPublic = team?.vis === "public";
  const link = (team && team.cloudId && typeof bosTeamInviteLink === "function")
    ? bosTeamInviteLink(team.cloudId)
    : ((typeof bosInviteLink === "function") ? bosInviteLink(null) : "https://t.me/BalanceOS8_bot");
  const shareText = "Вести привычки вместе — веселее, и за совместные привычки больше XP ✨ Залетай в команду «" + (team?.name || "") + "» в BalanceOS";
  const copyLink = () => { try { navigator.clipboard.writeText(link); } catch (e) {} setCopied(true); setTimeout(() => setCopied(false), 1600); if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} } };
  const shareTelegram = () => {
    const url = "https://t.me/share/url?url=" + encodeURIComponent(link) + "&text=" + encodeURIComponent(shareText);
    if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} }
    try { if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.openTelegramLink) { window.Telegram.WebApp.openTelegramLink(url); return; } } catch (e) {}
    try { window.open(url, "_blank"); } catch (e) {}
  };
  return (
    <div style={{ padding: "2px 20px 0", color: "var(--text)" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 60, height: 60, borderRadius: 16, margin: "0 auto 12px", background: BOS_TILE_SHEEN + ", var(--surface-3)", boxShadow: bosTileGlass(false), display: "grid", placeItems: "center", fontSize: 32 }}>{bosIcon(team?.emblem || "✨", 32, null)}</div>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.3px" }}>Позвать вместе</div>
        <div style={{ fontSize: 13.5, color: "var(--text-3)", marginTop: 6, maxWidth: 290, marginInline: "auto", lineHeight: 1.45 }}>
          Вести привычки вместе — веселее, и за совместные привычки больше XP ✨
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 10, fontSize: 11.5, fontWeight: 600, color: "var(--text-3)", background: "var(--surface-3)", padding: "4px 11px", borderRadius: 999 }}>
          {isPublic ? "🌐 Открытый · по ссылке сразу присоединятся" : "🔒 Приватный · войдут только по этой ссылке"}
        </div>
      </div>
      <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 10, background: "var(--surface-3)", borderRadius: 14, padding: "11px 8px 11px 14px" }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: "var(--text-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{link}</span>
        <button onClick={copyLink} className="tap" style={{ flexShrink: 0, border: 0, background: "#0a0a0a", color: "#fff", borderRadius: 999, padding: "8px 15px", fontSize: 12.5, fontWeight: 600 }}>{copied ? "Готово" : "Копировать"}</button>
      </div>
      <button onClick={shareTelegram} className="tap" style={{ width: "100%", marginTop: 18, border: 0, borderRadius: 999, padding: 15, background: "#229ED9", color: "#fff", fontSize: 15.5, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
        <I.Send size={18}/> Поделиться в Telegram
      </button>
      <button onClick={() => close && close()} className="tap" style={{ width: "100%", marginTop: 12, background: "#0a0a0a", color: "#fff", border: 0, borderRadius: 999, padding: 15, fontSize: 15, fontWeight: 600 }}>Готово</button>
      <div style={{ height: "max(8px, var(--tg-bottom-inset, 0px))" }} />
    </div>
  );
}

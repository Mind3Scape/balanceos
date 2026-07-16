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

/* ── Живые SVG-иконки для чипов вместо эмодзи (David: эмодзи «режут глаза» на спокойном
   монохромном чроме — палитра бел/чёрн/золото). Иконки — одноцветные линии из набора I.
   МАРШРУТ важнее эмодзи: «Отметить состояние» и «Как всё устроено» делят 🧭, но зовут
   разные иконки (Smile / Compass). Демо не трогаем — меняем только live-рендеры чипов. */
// mood: раньше «Smile» — ЗАЛИВНАЯ морда-лицо, David: «ужасно, целиком заливка выскакивает». Заменено на
// «Sun» (свет — под «свет орба»), чистый залив-силуэт без лица.
var BOS_PILL_ICON_BY_ROUTE = { mood: "Sun", "habit-settings": "Plus", "goal-settings": "Target", guide: "Compass", "ai-chat": "Sparkles" };
var BOS_PILL_ICON_BY_EMOJI = {
  "✨": "Sparkles", "🔮": "Bulb", "🧭": "Compass", "➕": "Plus", "🌟": "Target", "🙋": "Person",
  "📖": "Book", "📚": "Book", "🧘": "Moon", "🧘🏼‍♀️": "Moon", "🔥": "Flame", "💪": "Dumbbell",
  "💧": "Droplet", "🏃": "Sneaker", "🌅": "Sun", "🚭": "Ban",
};
function bosPillIconName(pill) {
  if (!pill || typeof pill === "string") return "Sparkles";
  if (pill.kind === "action" && pill.route && BOS_PILL_ICON_BY_ROUTE[pill.route]) return BOS_PILL_ICON_BY_ROUTE[pill.route];
  return BOS_PILL_ICON_BY_EMOJI[pill.i || ""] || "Sparkles";
}
function bosPillGlyphLive(pill, opts) {
  var o = opts || {};
  if (typeof I === "undefined") return (typeof bosPillIcon === "function") ? bosPillIcon(pill) : "✨";
  var Cmp = I[bosPillIconName(pill)] || I.Sparkles;
  // ЗАЛИВНЫЕ (filled) + strokeWidth 0 — David: контурные тонкие иконки на малом размере не
  // читаются (лампочка не читалась как лампочка). Сплошной силуэт «садится» лучше.
  return <Cmp size={o.size || 15} color={o.color || "var(--text-2)"} filled strokeWidth={0} />;
}
// Общий рендер ЗАЛИВНОЙ иконки по имени из набора I (для секций вне чипов: сферы колеса,
// «Следующие шаги», «Обучение», «Скоро»). Возвращает элемент или null (тогда вызывающий даёт fallback).
function bosIconEl(name, opts) {
  var o = opts || {};
  if (typeof I === "undefined" || !name || !I[name]) return null;
  var Cmp = I[name];
  return <Cmp size={o.size || 18} color={o.color || "var(--text-2)"} filled strokeWidth={0} />;
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

/* ИИ-СВОДКА для главной (David: «сводка должна быть РЕАЛЬНАЯ, а при недоступном ИИ — заготовки как
   сейчас»). Пайплайн (стейт+кэш+сигнал+эффект) уже живёт в shell.jsx, но раньше звал `bosAiBrief`
   из ДЕМО-бандла (live его не грузит) → эффект всегда падал, и показывалась заготовка. Это ЖИВАЯ
   версия: спрашивает у ИИ-прокси ОДНУ тёплую фразу по реальному состоянию. Получилось → real; не
   получилось (ключ исчерпан/офлайн) → null → главная берёт заготовку AI_BRIEF, как раньше. Только
   summary — плитки/маршруты не трогаем (без риска). Кэш/частота — на стороне эффекта (≈1 раз в день). */
var BRIEF_SYSTEM_LIVE = "Ты — тёплый, внимательный наставник в приложении привычек BalanceOS. По контексту пользователя дай РОВНО ОДНУ короткую фразу на сегодня (до 90 символов): живое наблюдение или мягкую подсказку. По-русски, по-доброму, конкретно, без общих слов и воды. Верни ТОЛЬКО фразу — без кавычек, без префиксов, без списков.";
function bosCleanBriefLine(raw) {
  if (!raw) return "";
  var s = ("" + raw).trim();
  s = (s.split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean)[0]) || "";
  s = s.replace(/^["'«»•\*\-\d\.\)\s]+/, "").replace(/["'«»\s]+$/, "").trim();
  if (s.length > 140) s = s.slice(0, 138).trim() + "…";
  return s;
}
async function bosAiBriefLive(app) {
  try {
    if (typeof aiRaw !== "function" || typeof buildAiContextLive !== "function") return null;
    var ctx = buildAiContextLive(app);
    if (!ctx) return null;
    var raw = await aiRaw([{ role: "system", content: BRIEF_SYSTEM_LIVE }, { role: "user", content: ctx }]);
    var summary = bosCleanBriefLine(raw);
    if (!summary) return null; // ИИ недоступен/пусто → главная возьмёт заготовку AI_BRIEF
    return { summary: summary };
  } catch (e) { return null; }
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
function bosCellFill(hx, p, isDark) {
  if (typeof bosCanonColor === "function") hx = bosCanonColor(hx);
  if (!(hx && hx[0] === "#" && hx.length >= 7)) hx = "#0a0a0a";
  var pp = Math.max(0, Math.min(1, p));
  if (isDark === undefined) isDark = !!(typeof document !== "undefined" && document.querySelector(".bos-page.theme-dark"));
  if (isDark) {
    // ТЁМНАЯ: закрашенный день — ЯРКИЙ, «светящийся», в тон чекбоксу (David: «в референсе точки яркие,
    // а у нас тусклые — альфа гасит цвет на тёмном»). Плотный цвет + светлый верхний блик, НЕ альфа.
    var low = ("" + hx).toLowerCase();
    if (low === "#0a0a0a" || low === "#8e8e93") {
      // Нейтраль (Стандарт/серый) в тёмной → СВЕТЛЫЙ день (графит инвертируется в белый), иначе не видно на тёмном.
      var wb = 0.60 + 0.34 * pp, wt = Math.min(1, wb + 0.13);
      return "linear-gradient(180deg, rgba(247,249,252," + wt.toFixed(2) + "), rgba(212,219,230," + wb.toFixed(2) + "))";
    }
    var deep = 0.44 * (1 - pp); // p=1 → чистый яркий цвет; меньше p → глубже к подложке
    var base = (typeof bosMixHex === "function") ? bosMixHex(hx, "#181a20", deep) : hx;
    var top = (typeof bosLightenHex === "function") ? bosLightenHex(base, 0.17) : base;
    return "linear-gradient(180deg, " + top + ", " + base + ")";
  }
  var bot = 0.30 + 0.55 * pp;  // СВЕТЛАЯ — мягкая альфа, как было (не трогаем)
  var topA = bot * 0.6;
  var hx2 = function (a) { return Math.round(a * 255).toString(16).padStart(2, "0"); };
  return "linear-gradient(180deg, " + hx + hx2(topA) + ", " + hx + hx2(bot) + ")";
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
// Читаемая «чернильная» краска цифры/таймера НА СТЕКЛЯННОМ диске. В светлой теме — сам цвет
// привычки (по умолчанию графит #0a0a0a: отлично читается на светлом диске). В тёмной тёмный
// цвет НЕВИДИМ на тёмном диске (David: «цифра чёрная — не видно»), поэтому поднимаем светлоту:
// чем темнее цвет, тем сильнее осветляем к белому; уже светлые оттенки не трогаем.
function bosReadableInk(hx, isDark) {
  if (!isDark) return hx || "#0a0a0a";
  if (!(hx && hx[0] === "#" && hx.length >= 7)) return "rgba(255,255,255,0.92)";
  var r = parseInt(hx.slice(1, 3), 16), g = parseInt(hx.slice(3, 5), 16), b = parseInt(hx.slice(5, 7), 16);
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
  var pr = function (s, i) { return parseInt(s.slice(i, i + 2), 16); };
  var mk = function (a, b) { return Math.round(a + (b - a) * k).toString(16).padStart(2, "0"); };
  return "#" + mk(pr(hx, 1), pr(to, 1)) + mk(pr(hx, 3), pr(to, 3)) + mk(pr(hx, 5), pr(to, 5));
}
// Яркость цвета (0..1) — для выбора контрастного текста поверх него.
function bosLum(hx) {
  if (!(hx && hx[0] === "#" && hx.length >= 7)) return 1;
  var r = parseInt(hx.slice(1, 3), 16), g = parseInt(hx.slice(3, 5), 16), b = parseInt(hx.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}
// ЕДИНЫЙ premium-рецепт hero-шапки карточки ЦЕЛИ (личной И общей — David: «это одно и то же»):
// не бледная выбеленная заливка, а НАСТОЯЩИЙ диагональный градиент цвета цели (светлее→глубже) +
// мягкое сияние сверху; текст/кнопки/чипы адаптируются к яркости (тёмный текст на светлом тоне,
// белый — на глубоком). Нейтральная цель (без цвета) → деликатный серый градиент, не плоскота.
// Возвращает готовые токены, чтобы обе карточки выглядели идентично и «богаче партнёрской».
function bosGoalHero(color, isDark) {
  // СТАНДАРТИЗАЦИЯ ПО ТОНАМ (David: «цвет внутри и снаружи должен совпадать»): hero берёт ТОТ ЖЕ
  // тон, что плитка цели bosGoalSkin — светлая тема bosLightenHex(accent,0.52) + ТЁМНЫЙ текст,
  // тёмная тема bosMixHex(accent,#0d0f14,0.24) + белый. Никакого адаптивного «то тёмный, то белый»
  // (из-за него деталь не совпадала с плиткой). Hero = та же плитка, только крупнее и с градиентом.
  if (typeof bosCanonColor === "function") color = bosCanonColor(color);
  var accent = (color && ("" + color).toLowerCase() !== "#0a0a0a" && color !== "#8E8E93" && color !== "#EAEAEF" && color !== (typeof BOS_GREY !== "undefined" ? BOS_GREY : "#8E8E93")) ? color : null;
  if (!accent) {
    return {
      bg: isDark
        ? "radial-gradient(135% 100% at 50% -12%, rgba(255,255,255,0.06), rgba(255,255,255,0) 60%), linear-gradient(157deg, #26262e 0%, #191920 100%)"
        : "radial-gradient(135% 100% at 50% -12%, rgba(255,255,255,0.6), rgba(255,255,255,0) 60%), linear-gradient(157deg, #F2F2F6 0%, #E4E4EC 100%)",
      ink: isDark ? "#fff" : "#16161a", sub: isDark ? "rgba(255,255,255,0.72)" : "rgba(22,22,26,0.56)",
      btnBg: isDark ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.75)", btnInk: isDark ? "#fff" : "#1b1b1f",
      chipBg: isDark ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.7)", chipInk: isDark ? "rgba(255,255,255,0.92)" : "#26262c",
      chipAiBg: isDark ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.95)", chipAiInk: isDark ? "#cdd8f0" : "#3a5a8c",
      onDark: isDark,
    };
  }
  if (isDark) {
    var d1 = bosMixHex(accent, "#0d0f14", 0.16), d2 = bosMixHex(accent, "#0d0f14", 0.30);
    return {
      bg: "radial-gradient(135% 100% at 50% -12%, rgba(255,255,255,0.16), rgba(255,255,255,0) 58%), linear-gradient(157deg, " + d1 + " 0%, " + d2 + " 100%)",
      ink: "#fff", sub: "rgba(255,255,255,0.74)",
      btnBg: "rgba(255,255,255,0.18)", btnInk: "#fff",
      chipBg: "rgba(255,255,255,0.16)", chipInk: "rgba(255,255,255,0.95)",
      chipAiBg: "rgba(255,255,255,0.92)", chipAiInk: "#3a5a8c",
      onDark: true,
    };
  }
  var soft = bosLightenHex(accent, 0.52); // = тон светлой плитки цели
  var top = bosLightenHex(accent, 0.60);
  var low = bosLightenHex(accent, 0.45);
  return {
    bg: "radial-gradient(135% 100% at 50% -12%, rgba(255,255,255,0.5), rgba(255,255,255,0) 60%), linear-gradient(157deg, " + top + " 0%, " + soft + " 52%, " + low + " 100%)",
    ink: "#1b1b1f", sub: "rgba(27,27,31,0.56)",
    btnBg: "rgba(255,255,255,0.72)", btnInk: "#1b1b1f",
    chipBg: "rgba(255,255,255,0.62)", chipInk: "#26262c",
    chipAiBg: "rgba(255,255,255,0.95)", chipAiInk: "#3a5a8c",
    onDark: false,
  };
}
// Пустая клетка календаря = МЯГКИЙ тон цвета привычки (David: «пустые дни должны стать мягко-
// зелёными/любой цвет, а не серыми»). Цвет на низкой альфе → еле-еле в тон; фолбэк серый.
// Стеклянное кольцо «СЕГОДНЯ» — ЕДИНОЕ внутри (календарь) и снаружи (страйп на карточке), David:
// «текущий день выделен одинаково, кольцом стекла, без плюсика». Светлый внутр. блик + тонкий контур
// + мягкая тень = вид стеклянного чекбокса; читается и на белом, и на цветной клетке.
function bosTodayRing(isDark, accent) {
  if (typeof bosCanonColor === "function") accent = bosCanonColor(accent);
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
  if (typeof bosCanonColor === "function") accent = bosCanonColor(accent);
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
// СТЕКЛЯННОЕ КОЛЬЦО-заполнение дня (David v660): день — не залитый диск, а кольцо, что заполняется
// по мере выполнения (как кольца активности Apple) — читается честнее. Стекло = светлый внутренний
// блик + мягкий тонкий контур; тон = цвет привычки (нейтраль → графит/светлый). Только неделя/месяц
// и виджет главной; в годовом виде кольца слишком мелкие → там остаются точки (bosCellFill). pct 0..1.
function bosDayRing(pct, accent, isDark, opts) {
  opts = opts || {};
  pct = Math.max(0, Math.min(1, (typeof pct === "number" && isFinite(pct)) ? pct : 0));
  if (typeof bosCanonColor === "function") accent = bosCanonColor(accent);
  var neutral = !(accent && accent[0] === "#" && accent.length >= 7) || ("" + accent).toLowerCase() === "#0a0a0a" || accent === "#8E8E93";
  var arc = neutral ? (isDark ? "#eef1f7" : "#2e323b") : accent;
  var track = isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.08)";
  var R = 15.4, C = 2 * Math.PI * R, sw = opts.sw || 4.6;
  var dash = (pct * C).toFixed(2), gap = (C + 0.6).toFixed(2);
  var sheen = isDark ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.82)";
  return (
    <svg viewBox="0 0 40 40" width="100%" height="100%" style={{ display: "block", overflow: "visible" }}>
      <circle cx="20" cy="20" r={R} fill="none" stroke={track} strokeWidth={sw} />
      {pct > 0 ? <circle cx="20" cy="20" r={R} fill="none" stroke={arc} strokeWidth={sw} strokeLinecap="round" strokeDasharray={dash + " " + gap} transform="rotate(-90 20 20)" /> : null}
      <circle cx="20" cy="20" r={R - sw / 2 + 0.3} fill="none" stroke={sheen} strokeWidth="0.7" />
      {opts.today ? <circle cx="20" cy="20" r={R + sw / 2 + 1.1} fill="none" stroke={isDark ? "rgba(255,255,255,0.42)" : "rgba(10,10,10,0.24)"} strokeWidth="1.1" />
        : (opts.sel ? <circle cx="20" cy="20" r={R + sw / 2 + 1.1} fill="none" stroke={isDark ? "rgba(255,255,255,0.26)" : "rgba(10,10,10,0.15)"} strokeWidth="1" /> : null)}
    </svg>
  );
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
// КРУГЛОЕ стекло — для ДИСКА ВНУТРИ КОЛЬЦА (свотч пикера в кольце выбора, центр орбиты в кольце
// прогресса). Направленный блик выбеливал ВЕРХ цветного круга — верхний край таял в светлый зазор,
// и кольцо казалось сверху дальше, чем снизу (David). Здесь блик радиальный и ГАСНЕТ ДО КРАЁВ
// (closest-side от точки 50%/38% докасается ровно до верхней кромки, где уже прозрачен): свет
// по-прежнему «сверху», но силуэт круга остаётся чётким по всей окружности → зазор до кольца
// читается одинаковым со всех сторон. Плитки/пилюли не трогаем — у них BOS_TILE_SHEEN.
const BOS_ORB_SHEEN = "radial-gradient(closest-side at 50% 38%, var(--sheen-a, rgba(255,255,255,0.5)), rgba(255,255,255,0.07) 66%, rgba(255,255,255,0) 92%)";
// Пара к BOS_ORB_SHEEN: РАВНОМЕРНАЯ стекло-тень круга. У bosTileGlass верхняя белая кромка +
// капля-тень ВНИЗ — на круге в кольце обе тоже «сдвигали» его оптически. Тут ободок и ореол
// одинаковы по всей окружности.
function bosOrbGlass(isDark) {
  return isDark
    ? "inset 0 0 1px rgba(255,255,255,0.10), inset 0 0 0 0.7px rgba(255,255,255,0.06), 0 0 2px rgba(0,0,0,0.22)"
    : "inset 0 0 1px rgba(255,255,255,0.85), inset 0 0 0 0.7px rgba(0,0,0,0.05), 0 0 2px rgba(0,0,0,0.07)";
}
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

/* Стекло ФУНКЦИОНАЛЬНОГО чрома (верхние кнопки +/колокол) — ТОТ ЖЕ рецепт, что у «Вселенной»
   и карандашика на странице «Я» (David 2026-07-15: «у них стекло читается, а у пилюли в шапке —
   нет, сделай так же»).
   Разница была НЕ в размытии, а в БЛИКЕ. Тут стоял градиент сверху вниз — ровная белёсая заливка,
   которую глаз читает матовым пластиком. У «Вселенной»/карандаша — BOS_TILE_SHEEN: диагональная
   полоса света под 165°, гаснущая к 72% высоты. Именно косой отблеск читается как «стекло поймало
   свет». Поэтому блик и кант (bosTileGlass) взяты у них один в один; размытие оставлено — у них
   его нет и не нужно (лежат на статике), а чром плавает над едущим контентом. */
function bosGlassChrome(isDark) {
  // David 2026-07-15 (второй заход): «кнопки белые, а Вселенная и карандашик прозрачные».
  // Он поймал 12 уровней яркости. Блик я уже взял у эталона, а БАЗУ — нет: тут стоял белый
  // rgba(255,255,255,0.72), и на фоне страницы #f2f2f7 он давал композит #FBFBFD — почти
  // белую наклейку. У эталона база СЕРАЯ и непрозрачная: var(--surface-3) = #efefef. Разница
  // и читалась как «эти белые, а те прозрачные»: серое сливается с фоном и кажется стеклом,
  // белое — лежит поверх. Теперь база та же. Размытие убрано осознанно: у эталона его нет,
  // а под непрозрачной базой оно всё равно ничего не делает.
  // ИТОГ: этот рецепт теперь ПОБУКВЕННО равен «Вселенной»/карандашу (shared_live: EditGlassButtonLive).
  return {
    background: BOS_TILE_SHEEN + ", " + (isDark ? "rgba(255,255,255,0.10)" : "var(--surface-3)"),
    boxShadow: bosTileGlass(isDark),
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
function PeopleMonthCalendarLive({ people = [], dayFrac, label = "Календарь", granular = false, selPerson: selProp, onSelPerson, todayTap, bare = false, defaultView = "month", tintInk = null, hidePicker = false, schedDays = null }) {
  // «Дни недели»: schedDays = 7-маска Пн..Вс. Чужой (не назначенный) пустой день рисуется
  // ПРИГЛУШЁННЫМ — он и не ожидался, пропуск не читается как провал. Отмеченный день в любом
  // случае показывается в полную силу (сделал в выходной — молодец, это честная отметка).
  const _sched = (typeof bosDaysMask === "function") ? bosDaysMask(schedDays) : null;
  const _offMon = (monIdx) => !!(_sched && !_sched[monIdx]);
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
  const [view, setView] = React.useState(defaultView); // Неделя · Месяц · Год — один кружок-день в трёх масштабах (David). defaultView — проп на экран (детальная привычка = «year»), у целей/личного остаётся «month» → соседи не задеты.
  const [scopeOpen, setScopeOpen] = React.useState(false); // Пилюля срока: свёрнута → «текущий срок ⌄», тап раскрывает Неделя|Месяц|Год, выбор сворачивает.
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
  // На тонированной карточке (tintInk задан) пилюля срока/сегмент/глазик — матовое стекло в тон, не серый чип.
  const chip2 = tintInk ? (isDark ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.5)") : chipBg;
  const lblCol = tintInk || "var(--text)";
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
  const yearGridRef = React.useRef(null); // «Год»-грядка тоже свой ref → волна расходится и в годовом виде (David: «волны и во внутренней карточке»).
  const todayIdx = startWeekday + today - 1; // flat index of «today» within the month `cells`
  const triggerRipple = (originIdx, gridEl, colMajor = false) => {
    const grid = gridEl || gridRef.current; if (!grid) return;
    const kids = grid.children;
    // Месяц/Неделя — 7 КОЛОНОК, ряд-мажор. Год — 7 РЯДОВ, колонка-мажор (грядка). Позицию клетки
    // считаем по раскладке, чтобы волна расходилась геометрически верно в любом масштабе.
    const rc = (idx) => colMajor ? { r: idx % 7, c: Math.floor(idx / 7) } : { r: Math.floor(idx / 7), c: idx % 7 };
    const o = rc(originIdx);
    for (let i = 0; i < kids.length; i++) {
      const el = kids[i]; if (!el || el.getAttribute("aria-hidden")) continue;
      const p = rc(i);
      const dist = Math.hypot(p.r - o.r, p.c - o.c);
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
  // rippleToday = ТОЛЬКО волна от сегодня в текущем виде (месяц/неделя/год), без отметки.
  const rippleToday = () => {
    setSelDay(today);
    if (view === "week") { const wi = weeksData.findIndex((w) => w.isToday); triggerRipple(wi < 0 ? 28 : wi, weekGridRef.current); }
    else if (view === "year") { const yi = yearData.slots.findIndex((s) => s && s.m === CUR_M && s.d === today); if (yi >= 0) triggerRipple(yi, yearGridRef.current, true); }
    else triggerRipple(todayIdx, gridRef.current);
  };
  // Тап по КЛЕТКЕ сегодня = просто отметка; ВОЛНУ пускает pct-эффект ниже — единый источник ряби для
  // клетки И кольца-чекбокса сверху, и только при ПРОДВИЖЕНИИ вперёд (не при снятии).
  const fireToday = () => { setSelDay(today); if (todayTap && todayTap.onTap) todayTap.onTap(); };

  // ── «Месяц · Год» — тот же кружок-день в двух масштабах (David; неделя живёт на карточке). Год =
  //    «грядка» с начала года до сегодня; месяцы СКРЫТЫ пока не нажат глазик («Подробно»).
  const MO_ABBR = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
  const yearScrollRef = React.useRef(null);
  const yearData = React.useMemo(() => {
    const jan1 = new Date(year, 0, 1);
    const wd0 = (jan1.getDay() + 6) % 7;                                  // Mon-first offset of Jan 1
    // Грядка идёт с начала года ДО СЕГОДНЯ: сегодня — край-«фронтир» (как в contribution-графике GitHub),
    // последний столбец = текущая неполная неделя. Узнаваемо и честно — David: «люди привыкли, так норм».
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
  // Волна — ТОЛЬКО при ПРОДВИЖЕНИИ сегодня вперёд: галочка поставлена / +1 к счёту (pct ВЫРОС). Снятие
  // галочки или −1 (pct упал) волну НЕ пускают — иначе нелогично (David: «убрать чекбокс не должно давать
  // волну»). Единый источник для клетки И кольца-чекбокса сверху (оба меняют todayTap.pct).
  const _prevPctRef = React.useRef(null);
  React.useEffect(() => {
    const pct = todayTap ? todayTap.pct : null;
    const prev = _prevPctRef.current;
    _prevPctRef.current = pct;
    if (prev != null && pct != null && pct > prev) rippleToday();
  }, [todayTap && todayTap.pct]);

  return (
    <>
      <div style={bare ? { padding: 0 } : { background: "var(--card)", borderRadius: 22, padding: 14, boxShadow: "var(--card-shadow)", marginTop: label ? 12 : 0 }}>
        {/* Без заголовка (David: «„Календарь привычки“ убрать — и так понятно»). Переключатель Месяц·Год
            (неделя живёт на карточке) + глазик «Компактно/Подробно» — РАБОТАЕТ В ОБОИХ режимах:
            по умолчанию минимализм (без подписей/чисел), по глазику — месяцы/числа. */}
        {/* Компактный переключатель масштаба (David): сегменты + глазик-кнопка (только иконка,
            залита когда «Подробно»). Чипы людей переехали ВНИЗ, под календарь. */}
        <div style={{ display: "flex", gap: 7, alignItems: "center", marginBottom: 12 }}>
          {!scopeOpen && (
            /* Период СЛЕВА — как в макете («Декабрь 2025» / «2025 год»), контролы справа. */
            <div style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 700, letterSpacing: "-0.3px", color: lblCol, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {view === "year" ? (year + " год") : (view === "week" ? "Эта неделя" : (MONTHS[mIdx] + " " + year))}
            </div>
          )}
          {!scopeOpen ? (
            /* Тихая пилюля СПРАВА (David: «год должен быть справа, как в макете»): срок + галка ⌄. Тап
               раскрывает сегмент. Это НЕ «глазик» (глаз = плотность, отдельная ось). */
            <button onClick={() => setScopeOpen(true)} className="tap" data-no-haptic aria-label="Сменить срок"
              style={{ display: "inline-flex", alignItems: "center", gap: 5, border: 0, cursor: "pointer", background: chip2, color: tintInk || "var(--text-2)", padding: "6px 12px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, letterSpacing: "-0.2px", flexShrink: 0 }}>
              {({ week: "Неделя", month: "Месяц", year: "Год" })[view]}
              <span style={{ fontSize: 11, opacity: 0.55, transform: "translateY(-1px)" }}>⌄</span>
            </button>
          ) : (
            /* Раскрытый сегмент занимает строку; выбор срока сворачивает обратно. Пружинный pop (WAAPI). */
            <div style={{ flex: 1, minWidth: 0 }}>
              <div ref={(el) => { if (el) { try { el.animate([{ opacity: 0, transform: "scale(0.75)" }, { opacity: 1, transform: "scale(1)" }], { duration: 260, easing: "cubic-bezier(0.2,1.3,0.4,1)" }); } catch (_) {} } }}
                style={{ display: "flex", gap: 2, background: chip2, borderRadius: 11, padding: 2.5 }}>
                {[["week", "Неделя"], ["month", "Месяц"], ["year", "Год"]].map(([v, l]) => (
                  <button key={v} onClick={() => { setView(v); setScopeOpen(false); }} className="tap" style={{ flex: 1, border: 0, borderRadius: 9, padding: "5px 0", fontSize: 12.5, fontWeight: view === v ? 700 : 500, cursor: "pointer", background: view === v ? (isDark ? "#fff" : "#0a0a0a") : "transparent", color: view === v ? (isDark ? "#0a0a0a" : "#fff") : (tintInk || "var(--text-2)"), transition: "background 0.15s" }}>{l}</button>
                ))}
              </div>
            </div>
          )}
          <button onClick={() => setCompact((c) => !c)} className="tap" aria-label={compact ? "Подробно" : "Компактно"}
            style={{ display: "grid", placeItems: "center", background: compact ? chip2 : (isDark ? "#fff" : "#0a0a0a"), border: 0, borderRadius: 999, width: 32, height: 32, cursor: "pointer", flexShrink: 0, transition: "background 0.15s" }}>
            <I.Eye size={15} filled={!compact} color={compact ? (tintInk || "var(--text-3)") : (isDark ? "#0a0a0a" : "#fff")} />
          </button>
        </div>

        {view === "week" && (
          <div ref={weekGridRef} style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 7, width: "100%", maxWidth: 300, margin: "0 auto" }}>
            {weeksData.map((wd, i) => {
              const hx = (selColor && selColor[0] === "#" && selColor.length >= 7) ? selColor : "#0a0a0a";
              const itx = !!(todayTap && wd.isToday && (solo || selPerson == null || (people[selPerson] && people[selPerson].you)));
              const pct = wd.future ? null : (itx ? todayTap.pct : yearPct(wd.m, wd.d));
              const fut = pct == null;
              const filled = !fut && pct > 0;
              const done = !fut && pct >= 1;
              const bg = fut ? bosCellEmpty(hx, isDark, 0.42) : (pct <= 0 ? (itx ? bosCellFill(hx, 0.14, isDark) : bosCellEmpty(hx, isDark)) : bosCellFill(hx, pct, isDark));
              // Сегодня = единое стеклянное кольцо (bosTodayRing) в ТОНЕ привычки, как снаружи; без «+».
              const sh = [filled ? bosCellGlass(isDark) : "", wd.isToday ? bosTodayRing(isDark, hx) : ""].filter(Boolean).join(", ") || "none";
              var wchk = (hx && hx[0] === "#" && ("" + hx).toLowerCase() !== "#0a0a0a" && hx !== "#8E8E93") ? hx : "var(--text)";
              const wOff = _offMon(i) && !(pct > 0);
              return (
                <button key={i} onClick={itx ? fireToday : undefined} className="tap" style={{ aspectRatio: "1/1", border: 0, borderRadius: "50%", padding: 0, background: "transparent", cursor: itx ? "pointer" : "default", position: "relative", display: "grid", placeItems: "center" }}>
                  <span aria-hidden style={{ position: "absolute", inset: 0, opacity: wOff ? 0.38 : 1 }}>{bosDayRing(fut ? 0 : Math.max(pct || 0, 0), hx, isDark, { today: wd.isToday })}</span>
                  {itx && done ? <span style={{ position: "relative", zIndex: 1, display: "grid", placeItems: "center" }}><I.Check size={13} strokeWidth={3} color={wchk} /></span> : null}
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
          {cells.map((c, _ci) => {
            // Соседние месяцы (prev/next) = еле заметный ПОЛНЫЙ кружок (David: «продолжить еле заметными
            // кружочками слева и справа, чтобы месяц был ближе к ГРЯДКЕ»). Полный размер достраивает
            // прямоугольник-грядку; opacity ниже пустого дня (track) → месяц мягко «бледнеет» по краям,
            // но клетка-кружок не рвётся на точки — бесшовное продолжение бесконечной грядки.
            if (c.adj) return <span key={c.key} aria-hidden style={{ aspectRatio: "1/1", opacity: 0.5, display: "grid", placeItems: "center" }}>{bosDayRing(0, selColor, isDark, {})}</span>;
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
              : (pct <= 0 ? (itx ? bosCellFill(hx, 0.14, isDark) : bosCellEmpty(hx, isDark)) : bosCellFill(hx, pct, isDark));
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
            var mchk = (hx && hx[0] === "#" && ("" + hx).toLowerCase() !== "#0a0a0a" && hx !== "#8E8E93") ? hx : "var(--text)";
            var ringInk = fut ? "var(--text-4)" : "var(--text)";
            // Сетка месяца начинается с ВС (startWeekday по getDay) → Пн-first индекс = (кол+6)%7.
            var mOff = _offMon((_ci % 7 + 6) % 7) && !(pct > 0);
            return (
              <button key={c.key} {...(itx ? { "data-no-haptic": "" } : {})} onClick={onClick} className="tap" style={{
                aspectRatio: "1/1", border: 0, borderRadius: "50%", padding: 0, display: "grid", placeItems: "center",
                fontSize: 11, fontWeight: isToday ? 700 : 500, cursor: (itx || !compact) ? "pointer" : "default",
                background: "transparent", color: ringInk, position: "relative" }}>
                <span aria-hidden style={{ position: "absolute", inset: 0, opacity: mOff ? 0.38 : 1 }}>{bosDayRing(fut ? 0 : Math.max(pct || 0, 0), hx, isDark, { today: isToday, sel: (!compact && isSel && !isToday) })}</span>
                {(itx && done)
                  ? <span style={{ position: "relative", zIndex: 1, display: "grid", placeItems: "center" }}><I.Check size={14} strokeWidth={3} color={mchk} /></span>
                  : (!compact && !fut && <span style={{ position: "relative", zIndex: 1 }}>{c.d}</span>)}
              </button>
            );
          })}
        </div>
        )}

        {/* Год — «грядка» с начала года до сегодня: столбцы = недели, строки = дни недели (Пн↑Вс),
            месяцы сверху. Тот же кружок-день и заливка-хитмап. Открывается прокрученной к сегодня. */}
        {/* Год — «грядка» с начала года до сегодня, ближе к референсу: крупнее кружки (13px) + фикс-
            подписи дней недели слева (Пн..Вс), не скроллятся; месяцы сверху по глазику. Наш кружок-
            чекбокс (bosCellFill+glass+кольцо сегодня), как на главной. */}
        {view === "year" && (
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 3, paddingTop: !compact ? 29 : 4, flexShrink: 0 }}>
              {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((w, i) => <div key={i} style={{ height: 13, fontSize: 9, lineHeight: "13px", color: "var(--text-4)", fontWeight: 600, letterSpacing: "-0.3px" }}>{w}</div>)}
            </div>
            <div ref={yearScrollRef} className="screen-scroll" style={{ overflowX: "auto", paddingBottom: 4, flex: 1 }}>
              {/* padding = воздух вокруг грядки, чтобы КОЛЬЦО сегодня (box-shadow) не обрезалось краем
                  скролла (David: «колесо вокруг сегодняшнего дня обрезается»). paddingTop согласован с
                  подписями дней слева (29/4) → строки не разъезжаются. */}
              <div style={{ minWidth: yearData.cols * 16, padding: "4px 5px 2px 2px" }}>
                {!compact && (
                  <div style={{ display: "flex", marginBottom: 8, height: 17 }}>
                    {Array.from({ length: yearData.cols }, (_, c) => (
                      <div key={c} style={{ width: 16, flexShrink: 0, fontSize: 11, fontWeight: 600, color: "var(--text-4)", whiteSpace: "nowrap", overflow: "visible" }}>{yearData.colLabel[c] || ""}</div>
                    ))}
                  </div>
                )}
                <div ref={yearGridRef} style={{ display: "grid", gridTemplateRows: "repeat(7, 13px)", gridAutoFlow: "column", gridAutoColumns: "13px", gap: 3 }}>
                  {yearData.slots.map((s, i) => {
                    if (!s) return <span key={i} aria-hidden style={{ width: 13, height: 13 }} />;
                    const hx = (selColor && selColor[0] === "#" && selColor.length >= 7) ? selColor : "#0a0a0a";
                    const isToday = s.m === CUR_M && s.d === today;
                    // Сегодня в «Годе» — тоже ЖИВАЯ клетка: тап отмечает и пускает волну по грядке (David:
                    // «волны и во внутренней карточке»). Интерактив только в СВОём фильтре (solo/«Все»/твой чип).
                    const itx = !!(todayTap && isToday && (solo || selPerson == null || (people[selPerson] && people[selPerson].you)));
                    const pct = itx ? todayTap.pct : yearPct(s.m, s.d);
                    const filled = pct > 0;
                    const bg = pct <= 0 ? (itx ? bosCellFill(hx, 0.14, isDark) : track) : bosCellFill(hx, pct, isDark);
                    const todayRingY = isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.48)";
                    // Кольцо сегодня — ВНУТРЕННЕЕ (inset): рисуется внутри клетки → НЕ обрезается краем
                    // горизонтального скролла (David: «колесо вокруг сегодня обрезается»). Нейтральный тон
                    // виден и на пустой клетке, и на залитой (в отличие от hx, который сливается с заливкой).
                    const sh = [filled ? bosCellGlass(isDark) : "", isToday ? ("inset 0 0 0 1.6px " + todayRingY) : ""].filter(Boolean).join(", ") || "none";
                    // Грядка колонко-мажорная (7 строк Пн..Вс) → i%7 = Пн-first день недели.
                    const yOff = _offMon(i % 7) && !filled;
                    const yst = { width: 13, height: 13, borderRadius: "50%", background: bg, boxShadow: sh, opacity: yOff ? 0.38 : 1 };
                    if (itx) return <button key={i} onClick={fireToday} data-no-haptic className="tap" title={(MONTHS[s.m] || "") + " " + s.d} style={{ ...yst, border: 0, padding: 0, cursor: "pointer" }} />;
                    return <span key={i} title={(MONTHS[s.m] || "") + " " + s.d} style={yst} />;
                  })}
                </div>
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
        {/* Чипы людей — ПОД календарём (David: «под, а не над»), с разделителем. Фильтруют, чей heat-map.
            hidePicker → скрыты, когда выбором управляет ВНЕШНИЙ слайдер лиц (круг: не дублируем людей). */}
        {!solo && !hidePicker && (
          <div className="screen-scroll" style={{ display: "flex", gap: 7, overflowX: "auto", paddingTop: 12, marginTop: 12, borderTop: "1px solid var(--line)" }}>
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
      </div>
    </>
  );
}

/* ЕДИНЫЙ РАСКРЫВАЮЩИЙСЯ БЛОК (David: «привычки/календарь/люди в одном блоке, который раскрывается
   по выбранной категории; свёрнутые показывают краткую сводку»). Аккордеон: одна секция открыта,
   тап по свёрнутой раскрывает её (и сворачивает прежнюю). sections = [{key, icon, title, summary,
   render}]. Используется и на общей цели (TeamDetailLive), и на личной (GoalDetailPersonalLive). */
function BosSectionsAccordionLive({ sections, dark, defaultOpen }) {
  const list = (sections || []).filter(Boolean);
  const [open, setOpen] = React.useState(defaultOpen !== undefined ? defaultOpen : (list[0] && list[0].key));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
      {list.map((s) => {
        const isOpen = open === s.key;
        return (
          <div key={s.key} style={{ background: "var(--card)", borderRadius: 22, boxShadow: "var(--card-shadow)", overflow: "hidden" }}>
            <button onClick={() => setOpen(isOpen ? null : s.key)} className="tap" data-haptic="selection" aria-expanded={isOpen}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 15px", background: "transparent", border: 0, cursor: "pointer", textAlign: "left" }}>
              <span style={{ width: 32, height: 32, borderRadius: 10, background: dark ? "rgba(255,255,255,0.07)" : "var(--surface-3)", display: "grid", placeItems: "center", flexShrink: 0, color: "var(--text-3)" }}>{s.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15.5, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.2px" }}>{s.title}</div>
                {!isOpen && s.summary != null && <div style={{ fontSize: 12.5, color: "var(--text-4)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.summary}</div>}
              </div>
              <span aria-hidden style={{ flexShrink: 0, display: "grid", placeItems: "center", transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.22s", color: "var(--text-4)" }}><I.ChevronRight size={18} /></span>
            </button>
            {isOpen && <div style={{ borderTop: "1px solid " + (dark ? "rgba(255,255,255,0.07)" : "var(--line)") }}>{typeof s.render === "function" ? s.render() : s.render}</div>}
          </div>
        );
      })}
    </div>
  );
}

/* NetworkLocked → live-only: the REAL ways to climb (habits / state / team). No demo
   premium-course showcase, no dev "instant unlock" bypass. */
function NetworkLockedLive({ navigate, level, xp, xpMax, levelsLeft, onTraining = null }) {
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
      meta: "+5…15 XP / день",
      accent: "#9bd0ff",
    },
    {
      i: "🤝", t: "Делайте вместе",
      d: "Общие цели и привычки с друзьями тоже идут в твой опыт — и так веселее.",
      cta: "Цель вместе", action: () => _openSheet(<GoalFormSheetLive mode="create" circleOn={true} navigate={navigate} />),
      meta: "Вместе с друзьями",
      accent: "#85e3a8",
    },
    // «Пройди тренинг» убрано (David: тренинги убраны из раздела).
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
      <div style={{ position: "relative", overflow: "hidden", borderRadius: 22, padding: "16px 18px",
        background: "linear-gradient(145deg, #171719 0%, #050505 100%)",
        boxShadow: "0 10px 26px rgba(0,0,0,0.30)" }}>
        <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 82% 16%, rgba(254,222,52,0.24) 0%, transparent 46%)", pointerEvents: "none" }} />
        <div aria-hidden style={{ position: "absolute", top: 17, right: 19, opacity: 0.78, pointerEvents: "none" }}><I.Lock size={26} color="#FEDE34" /></div>
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase", color: "#D9B234" }}>Нетворк · откроется с 10 уровня</div>
          <div style={{ fontSize: 20, fontWeight: 750, letterSpacing: "-0.4px", color: "#fff", marginTop: 4, maxWidth: 245, lineHeight: 1.18 }}>Люди по конкретной задаче</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.68)", marginTop: 6, lineHeight: 1.4, maxWidth: 270 }}>Ищи подтверждённый навык, отправляй запрос и фиксируй состоявшееся дело.</div>

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
            {[["◎", "Навык"], ["✓", "Подтверждено делами"]].map(([e, l], i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.13)", borderRadius: 999, padding: "6px 11px", fontSize: 12.5, fontWeight: 700, color: "#fff" }}>
                <span style={{ fontSize: 13, lineHeight: 1 }}>{e}</span>{l}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="section-label" style={{ marginTop: 6 }}>{paths.length} способа открыть</div>
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
          Уровень защищает пространство от случайного шума, но не доказывает квалификацию. Навык открывается шире только после реальных дел у своих.
        </div>
      </div>
    </div>
  );
}

/* ── НЕТВОРК · LIVE (v642) ──────────────────────────────────────────────────────
   Настоящий нетворк, открывается с 10 уровня. Лесенка «что ты можешь предложить» — не
   выдуманные люди, а честная карта вкладов, которая раскрывается уровнем. */
var BOS_NET_TIERS = [
  { lvl: 3,  i: "🧠", t: "Разбор привычек",   d: "Помоги другому найти, что мешает" },
  { lvl: 5,  i: "🧘", t: "Практика для группы", d: "Проведи короткую сессию" },
  { lvl: 8,  i: "🏃", t: "Поддержка по темпу", d: "Держи кого-то в ритме" },
  { lvl: 10, i: "💼", t: "Поделиться опытом",  d: "Час твоего опыта — кому это нужно" },
  { lvl: 15, i: "🎯", t: "Наставничество",     d: "Сопровождение на месяц" },
  { lvl: 20, i: "🌍", t: "Собрать своих",      d: "Встреча или ретрит сообщества" },
];

// ISO-неделя ('2026-W28') — ключ периода для лимита слотов и броней.
function bosNetWeek(d) {
  d = d ? new Date(d) : new Date();
  // Канонический период брони — UTC-неделя. Сервер считает тем же способом:
  // клиент не выбирает соседнюю неделю на границе часовых поясов.
  var t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  var day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  var ys = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  var wk = Math.ceil((((t - ys) / 86400000) + 1) / 7);
  return t.getUTCFullYear() + "-W" + ("0" + wk).slice(-2);
}

// Единый SVG-глиф безопасного каталога помощи. Emoji остаётся только legacy-полем
// в БД; интерфейс всех карточек рисует ту же монохромную iOS-семью иконок.
function BosHelpOfferIconLive({ offer, size, color }) {
  var byTitle = {
    "Поддержать привычку": "Leaf", "Позвать на прогулку": "Foot",
    "Помочь вернуться в ритм": "Refresh", "Провести первую тренировку": "Dumbbell",
    "Провести дыхание или медитацию": "Moon", "Разобрать неделю": "Calendar",
    "Собрать маленькую встречу": "Users", "Показать навык на практике": "Bulb",
    "Провести совместный фокус-час": "Clock", "Разобрать конкретную задачу": "Target"
  };
  var skillIcon = offer && offer.kind === "skill_offer" ? bosNetSkillForOffer(offer).icon : null;
  var interactionIcon = offer && offer.kind === "skill_offer" ? bosNetInteraction(offer.interaction_key).icon : null;
  var IconCmp = typeof I !== "undefined" && I[skillIcon || interactionIcon || byTitle[(offer && offer.title) || ""] || "Heart"];
  return IconCmp ? <IconCmp size={size || 18} color={color || "var(--text-2)"} /> : null;
}
function bosHelpOfferTitleText(offer) {
  if (offer && offer.kind === "skill_offer") return offer.title || offer.outcome_title || "Применить навык";
  if (offer && offer.title === "Показать навык на практике" && /^Навык\s*·\s*/.test(offer.descr || "")) return offer.descr;
  return (offer && offer.title) || "Формат помощи";
}

/* ── Навыки и серьёзный Нетворк ─────────────────────────────────────────────
   Привычка отвечает на «что я повторяю», навык — на «что я умею делать»,
   предложение — на «какой ограниченный результат я готов дать другому».
   Каталог широкий, но структурный: публичную карточку нельзя превратить в доску
   случайных объявлений или обещаний из регулируемых областей. */
var BOS_SKILL_GROUPS = [
  { key: "product", title: "Продукт и бизнес", icon: "Briefcase", skills: [
    ["product_strategy", "Продуктовая стратегия"], ["customer_research", "Исследования пользователей"],
    ["project_management", "Управление проектами"], ["entrepreneurship", "Предпринимательство"],
    ["sales", "Продажи"], ["service_design", "Сервис-дизайн"]
  ] },
  { key: "design", title: "Дизайн и творчество", icon: "Pencil", skills: [
    ["product_design", "Продуктовый дизайн"], ["graphic_design", "Графический дизайн"],
    ["motion_design", "Моушн-дизайн"], ["photography", "Фотография"],
    ["video", "Видео"], ["writing", "Тексты и редактура"]
  ] },
  { key: "technology", title: "Технологии и AI", icon: "Bolt", skills: [
    ["frontend", "Frontend-разработка"], ["backend", "Backend-разработка"],
    ["mobile", "Мобильная разработка"], ["data", "Аналитика данных"],
    ["ai_automation", "AI и автоматизация"], ["no_code", "No-code инструменты"]
  ] },
  { key: "growth", title: "Рост и коммуникация", icon: "ChartBar", skills: [
    ["marketing", "Маркетинг"], ["content", "Контент"], ["public_speaking", "Публичные выступления"],
    ["negotiation", "Переговоры"], ["career_navigation", "Карьерная навигация"],
    ["community_building", "Развитие сообществ"]
  ] },
  { key: "learning", title: "Обучение и языки", icon: "Book", skills: [
    ["english", "Английский язык"], ["language_practice", "Языковая практика"],
    ["tutoring", "Объяснение сложного"], ["learning_design", "Дизайн обучения"],
    ["study_systems", "Системы обучения"], ["research", "Работа с исследованиями"]
  ] },
  { key: "practice", title: "Тело и практики", icon: "Dumbbell", skills: [
    ["running", "Бег"], ["strength", "Силовые тренировки"], ["mobility", "Мобильность и растяжка"],
    ["yoga", "Йога"], ["meditation", "Медитация"], ["breathwork", "Дыхательные практики"]
  ] },
  { key: "life", title: "Организация жизни", icon: "Calendar", skills: [
    ["planning", "Личное планирование"], ["focus", "Фокус и глубокая работа"],
    ["facilitation", "Фасилитация встреч"], ["event_making", "Организация событий"],
    ["travel_orientation", "Ориентация в новом городе"], ["home_organization", "Организация пространства"]
  ] }
];
var BOS_SKILL_CATALOG = [];
BOS_SKILL_GROUPS.forEach(function (g) { (g.skills || []).forEach(function (s) { BOS_SKILL_CATALOG.push({ key: s[0], title: s[1], group: g.key, groupTitle: g.title, icon: g.icon }); }); });
function bosSkillDef(key, title) {
  for (var i = 0; i < BOS_SKILL_CATALOG.length; i++) if (BOS_SKILL_CATALOG[i].key === key) return BOS_SKILL_CATALOG[i];
  return { key: key || "skill", title: title || "Навык", group: "other", groupTitle: "Навык", icon: "Bulb" };
}
var BOS_NET_INTERACTIONS = [
  { key: "question", title: "Ответить на вопрос", icon: "MessageCircle", mins: [30, 45], outcome: "Разобрать конкретный вопрос" },
  { key: "review", title: "Дать разбор", icon: "Eye", mins: [30, 45], outcome: "Разобрать работу и дать обратную связь" },
  { key: "diagnostic", title: "Разложить ситуацию", icon: "Search", mins: [30, 45], outcome: "Найти узкое место и следующий шаг" },
  { key: "plan", title: "Собрать план", icon: "Target", mins: [30, 45], outcome: "Собрать понятный план действий" },
  { key: "demo", title: "Показать на практике", icon: "Play", mins: [30, 45], outcome: "Показать подход на живом примере" },
  { key: "together", title: "Сделать вместе", icon: "Users", mins: [30, 45], outcome: "Сделать первый рабочий шаг вместе" },
  { key: "practice", title: "Провести практику", icon: "Sparkles", mins: [30, 45], outcome: "Провести короткую практику" },
  { key: "sprint", title: "Сопроводить спринт", icon: "Flag", mins: [30, 45], outcome: "Запустить короткий спринт и сверить результат" }
];
function bosNetInteraction(key) {
  for (var i = 0; i < BOS_NET_INTERACTIONS.length; i++) if (BOS_NET_INTERACTIONS[i].key === key) return BOS_NET_INTERACTIONS[i];
  return BOS_NET_INTERACTIONS[0];
}
function bosNetSkillForOffer(o) {
  return bosSkillDef(o && (o.skill_key || (o.skill && o.skill.skill_key)), o && (o.skill_title || (o.skill && o.skill.title)));
}
function bosNetEvidence(o) {
  return Math.max(0, (o && (o.evidence_count != null ? o.evidence_count : o.completed_count)) | 0);
}
function bosNetWhenText(o) {
  var t = (o && o.when_text) || "30 мин";
  if (!/(онлайн|рядом)/i.test(t)) t += " · " + ((o && o.mode === "nearby") ? "рядом" : "онлайн");
  return t;
}
function bosNetSlotsText(n) {
  n = Math.max(1, n | 0); var d = n % 10, h = n % 100;
  var w = (d === 1 && h !== 11) ? "место" : (d >= 2 && d <= 4 && (h < 12 || h > 14)) ? "места" : "мест";
  return n + " " + w + "/нед";
}
function bosNetPreviewPeople() {
  return [
    { ownerId: "preview-maria", name: "Мария", avatar: "m3", level: 14, preview: true, evidence: 7, peopleCount: 5, offers: [
      { id: "preview-product", owner_id: "preview-maria", kind: "skill_offer", skill_key: "product_design", skill_title: "Продуктовый дизайн", interaction_key: "review", title: "Разобрать первый экран продукта", descr: "Увидишь, что мешает сценарию считываться, и получишь 3 точечных шага.", when_text: "30 мин · онлайн", mode: "online", slots_week: 2, status: "confirmed", visibility: "all", evidence_count: 7, preview: true }
    ] },
    { ownerId: "preview-anton", name: "Антон", avatar: "m7", level: 18, preview: true, evidence: 11, peopleCount: 8, offers: [
      { id: "preview-ai", owner_id: "preview-anton", kind: "skill_offer", skill_key: "ai_automation", skill_title: "AI и автоматизация", interaction_key: "plan", title: "Собрать сценарий автоматизации", descr: "Разложим один повторяющийся процесс и соберём реалистичную схему без магии.", when_text: "45 мин · онлайн", mode: "online", slots_week: 1, status: "confirmed", visibility: "all", evidence_count: 11, preview: true }
    ] },
    { ownerId: "preview-lena", name: "Лена", avatar: "m11", level: 12, preview: true, evidence: 5, peopleCount: 4, offers: [
      { id: "preview-english", owner_id: "preview-lena", kind: "skill_offer", skill_key: "english", skill_title: "Английский язык", interaction_key: "practice", title: "Провести разговорную практику", descr: "Короткий разговор вокруг твоей реальной ситуации и одна зона роста после созвона.", when_text: "30 мин · онлайн", mode: "online", slots_week: 3, status: "confirmed", visibility: "all", evidence_count: 5, preview: true }
    ] }
  ];
}

/* НЕТВОРК · LIVE (v643): твоя карточка ПУБЛИКУЕТ пользу (структурные предложения — цена XP,
   расписание, лимит мест/неделю) + витрина реальных людей ≥10 задизайненными карточками
   (NetPersonCardLive → детали с бронью). Пусто честно, пока никто не опубликовал. */
function NetworkLive({ navigate, app, level, isDark }) {
  const [view, setView] = React.useState("find");
  const [query, setQuery] = React.useState("");
  const [group, setGroup] = React.useState("all");
  const [people, setPeople] = React.useState(null);
  const [preview, setPreview] = React.useState(false);
  const [loadError, setLoadError] = React.useState(false);
  const [tick, setTick] = React.useState(0);
  React.useEffect(function () {
    var on = true;
    (async function () {
      var C = window.bosCloud, myId = null, offers = [], profileMap = {}, failed = false;
      if (C && C.enabled && C.enabled()) {
        try { myId = await C.uid(); } catch (e) {}
        try {
          if (C.netSkillOffers) {
            var sr = await C.netSkillOffers({ limit: 240 });
            if (sr && sr.status === "error") failed = true;
            offers = Array.isArray(sr) ? sr : ((sr && sr.offers) || []);
          } else if (C.netOffers) offers = (await C.netOffers(240)) || [];
        } catch (e) { offers = []; failed = true; }
        offers = offers.filter(function (o) { return o && o.owner_id && o.owner_id !== myId && o.kind === "skill_offer" && o.status === "confirmed" && o.visibility === "all" && o.active !== false; });
        if (C.netSkillEvidence && offers.length) {
          try { await Promise.all(offers.slice(0, 80).map(async function (o) { var er = await C.netSkillEvidence(o.owner_id, o.skill_id); var ev = er && er.evidence; if (ev) { o.evidence_count = ev.completed_episodes | 0; o.people_count = (ev.unique_people != null ? ev.unique_people : ev.completed_episodes) | 0; o.role_confirmations = ev.role_confirmations | 0; } })); } catch (e) {}
        }
        var ids = []; offers.forEach(function (o) { if (ids.indexOf(o.owner_id) < 0) ids.push(o.owner_id); });
        try {
          if (ids.length && C.netProfiles) {
            var pr = await C.netProfiles(ids); var rows = Array.isArray(pr) ? pr : ((pr && pr.profiles) || []);
            rows.forEach(function (p) { if (p && p.id) profileMap[p.id] = p; });
          } else if (C.allPublic) {
            var pv = (await C.allPublic(240)) || []; pv.forEach(function (p) { profileMap[p.id] = p; });
          }
        } catch (e) {}
      }
      var byOwner = {};
      offers.forEach(function (o) { (byOwner[o.owner_id] = byOwner[o.owner_id] || []).push(o); });
      var hidden = []; try { hidden = JSON.parse(localStorage.getItem("bos:network:hidden") || "[]") || []; } catch (e) {}
      var real = Object.keys(byOwner).filter(function (oid) { return hidden.indexOf(oid) < 0; }).map(function (oid) {
        var p = profileMap[oid] || {}, os = byOwner[oid];
        return { ownerId: oid, name: p.username || p.name || "Участник", avatar: p.avatar || "default", level: p.level || 10, offers: os, evidence: os.reduce(function (n, o) { return Math.max(n, bosNetEvidence(o)); }, 0), peopleCount: os.reduce(function (n, o) { return Math.max(n, (o.people_count | 0)); }, 0) };
      });
      if (!on) return;
      if (real.length) { setPeople(real); setPreview(false); setLoadError(false); }
      else { setPeople(bosNetPreviewPeople().filter(function (p) { return hidden.indexOf(p.ownerId) < 0; })); setPreview(true); setLoadError(failed); }
    })();
    return function () { on = false; };
  }, [tick]);

  var q = query.trim().toLowerCase();
  var shown = (people || []).filter(function (p) {
    var os = p.offers || [];
    var groupOk = group === "all" || os.some(function (o) { return bosNetSkillForOffer(o).group === group; });
    if (!groupOk) return false;
    if (!q) return true;
    var hay = [p.name].concat(os.map(function (o) { var s = bosNetSkillForOffer(o); return [s.title, s.groupTitle, o.title, o.descr, bosNetInteraction(o.interaction_key).title].join(" "); })).join(" ").toLowerCase();
    return hay.indexOf(q) >= 0;
  });
  var groups = [{ key: "all", title: "Все" }].concat(BOS_SKILL_GROUPS.slice(0, 6));
  var segment = function (key, label, IconCmp) {
    var on = view === key;
    return <button key={key} onClick={function () { setView(key); }} className="tap hit44" style={{ flex: 1, minHeight: 42, border: 0, borderRadius: 13, background: on ? "var(--card)" : "transparent", color: on ? "var(--text)" : "var(--text-4)", boxShadow: on ? "var(--card-shadow)" : "none", fontSize: 12.5, fontWeight: on ? 750 : 650, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}>{IconCmp ? <IconCmp size={14} /> : null}{label}</button>;
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 10 }}>
      <div style={{ display: "flex", gap: 4, background: "var(--surface-3)", borderRadius: 16, padding: 4 }}>
        {segment("find", "Найти", I.Search)}{segment("skills", "Мои навыки", I.Bulb)}{segment("requests", "Запросы", I.MessageCircle)}
      </div>

      {view === "find" ? <React.Fragment>
        <div style={{ position: "relative", overflow: "hidden", borderRadius: 24, padding: "17px 16px 16px", background: "linear-gradient(145deg,#171719 0%,#050505 100%)", color: "#fff", boxShadow: "0 10px 28px rgba(0,0,0,0.22)" }}>
          <div aria-hidden style={{ position: "absolute", width: 170, height: 170, borderRadius: "50%", right: -75, top: -92, background: "radial-gradient(circle,rgba(254,222,52,0.32),rgba(254,222,52,0.04) 55%,transparent 72%)" }} />
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1.3, textTransform: "uppercase", color: "#E9BD32" }}>Нетворк · подтверждено делами</div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.55px", lineHeight: 1.13, marginTop: 5 }}>Что тебе сейчас нужно?</div>
            <div style={{ position: "relative", marginTop: 13 }}>
              <I.Search size={18} color="rgba(255,255,255,0.58)" style={{ position: "absolute", left: 13, top: 13 }} />
              <input value={query} onChange={function (e) { setQuery(e.target.value); }} aria-label="Поиск по навыкам и задачам" placeholder="Навык, задача или человек" style={{ width: "100%", height: 44, border: "1px solid rgba(255,255,255,0.09)", borderRadius: 14, background: "rgba(255,255,255,0.10)", color: "#fff", padding: "0 14px 0 40px", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.52)", marginTop: 9, lineHeight: 1.4 }}>Уровень открывает доступ. Качество подтверждают только состоявшиеся дела.</div>
          </div>
        </div>

        <div className="bos-hscroll" style={{ display: "flex", gap: 7, overflowX: "auto", padding: "0 1px 3px" }}>
          {groups.map(function (g) { var on = group === g.key; return <button key={g.key} onClick={function () { setGroup(g.key); }} className="tap hit44" style={{ minHeight: 40, flexShrink: 0, border: on ? "1px solid #D7A719" : "1px solid var(--line)", borderRadius: 999, background: on ? "rgba(254,222,52,0.24)" : "var(--card)", color: on ? "var(--text)" : "var(--text-3)", padding: "8px 13px", fontSize: 12.5, fontWeight: on ? 750 : 650, cursor: "pointer", boxShadow: on ? "none" : "var(--card-shadow)" }}>{g.title}</button>; })}
        </div>

        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "2px 3px 0" }}>
          <div className="section-label" style={{ margin: 0 }}>{q ? "Подходит тебе" : "Люди и навыки"}</div>
          <span style={{ fontSize: 11.5, color: "var(--text-4)" }}>{shown.length}</span>
        </div>
        {preview ? <div style={{ display: "flex", alignItems: "flex-start", gap: 9, borderRadius: 15, background: "rgba(254,222,52,0.15)", border: "1px solid rgba(215,167,25,0.28)", padding: "10px 12px" }}><I.Eye size={16} color="#A97900" style={{ flexShrink: 0, marginTop: 1 }} /><div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.42 }}><b style={{ color: "var(--text-2)" }}>{loadError ? "Нетворк сейчас не загрузился." : "Пример наполнения."}</b> {loadError ? "Ниже только демонстрационные карточки — реальные данные не подменяем." : "Реальные карточки появятся здесь после публикации подтверждённых навыков."}</div></div> : null}
        {people === null ? <div style={{ background: "var(--card)", borderRadius: 22, padding: 18, boxShadow: "var(--card-shadow)", fontSize: 13, color: "var(--text-4)" }}>Загружаем Нетворк…</div>
          : shown.length ? <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{shown.map(function (p) { return <NetPersonCardLive key={p.ownerId} person={p} viewerLevel={level} navigate={navigate} />; })}</div>
          : <div style={{ background: "var(--card)", borderRadius: 22, padding: 20, boxShadow: "var(--card-shadow)", textAlign: "center" }}><I.Search size={24} color="var(--text-4)" /><div style={{ fontSize: 15, fontWeight: 750, marginTop: 8 }}>Пока нет точного совпадения</div><div style={{ fontSize: 12.5, color: "var(--text-4)", marginTop: 4, lineHeight: 1.45 }}>Попробуй описать задачу короче или выбери другую область.</div></div>}
      </React.Fragment> : null}

      {view === "skills" ? <SkillsWorkbenchLive app={app} level={level} onChanged={function () { setTick(function (n) { return n + 1; }); }} /> : null}
      {view === "requests" ? <NetworkEpisodesLive app={app} onChanged={function () { setTick(function (n) { return n + 1; }); }} /> : null}
    </div>
  );
}

/* Свободный редактор предложения УДАЛЁН (brief 2026-07-11, Слой 0): произвольный текст +
   произвольная цена = обходной путь мимо безопасного каталога. Единственная дверь —
   AddHelpFormatSheetLive (community_live.jsx): каталог, границы, подтверждение кругом. */

/* Карточка человека в Нетворке (reuse дизайна): аватар, уровень, превью предложений.
   Тап → детали с бронью. Аноним (имён пока нет — честно). */
function NetPersonCardLive({ person, viewerLevel, navigate }) {
  const offers = (person.offers || []).slice();
  const first = offers[0] || {};
  const skill = bosNetSkillForOffer(first);
  const interaction = bosNetInteraction(first.interaction_key);
  const evidence = Math.max(person.evidence | 0, bosNetEvidence(first));
  return (
    <button onClick={function () { navigate("net-person", { person: person }); }} className="tap" style={{ width: "100%", border: 0, textAlign: "left", background: "var(--card)", borderRadius: 23, padding: 0, boxShadow: "var(--card-shadow)", cursor: "pointer", color: "var(--text)", overflow: "hidden" }}>
      <div style={{ padding: "14px 15px 12px", display: "flex", gap: 11, alignItems: "center" }}>
        {typeof BosAvatar === "function" ? <BosAvatar avatar={person.avatar} size={46} style={{ flexShrink: 0 }} /> : null}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 750, fontSize: 16, color: "var(--text)" }}>{person.name || "Участник"}</span>
            <span style={{ fontSize: 9.5, fontWeight: 800, color: "#8A6500", background: "rgba(254,222,52,0.24)", borderRadius: 999, padding: "3px 7px", letterSpacing: 0.3 }}>L{person.level | 0}</span>
            {person.preview ? <span style={{ fontSize: 9, fontWeight: 800, color: "var(--text-4)", background: "var(--surface-3)", borderRadius: 999, padding: "3px 7px", letterSpacing: 0.5, textTransform: "uppercase" }}>пример</span> : null}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "var(--text-4)", marginTop: 3 }}><I.Check size={12} color="#B08714" />{evidence ? (evidence + " подтверждённых дел" + ((person.peopleCount | 0) ? (" · " + person.peopleCount + " человек") : "")) : "Навык открыт после дел в кругах"}</div>
        </div>
        <I.ChevronRight size={18} color="var(--text-4)" />
      </div>
      {first.id ? <div style={{ margin: "0 8px 8px", borderRadius: 18, padding: "13px 13px 12px", background: "linear-gradient(145deg,var(--surface-3),rgba(254,222,52,0.10))", border: "1px solid rgba(215,167,25,0.16)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 36, height: 36, borderRadius: 12, background: "var(--card)", display: "grid", placeItems: "center", flexShrink: 0, boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}><BosHelpOfferIconLive offer={first} size={18} /></span>
          <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 10.5, color: "var(--text-4)", fontWeight: 750, textTransform: "uppercase", letterSpacing: 0.55 }}>{skill.title}</div><div style={{ fontSize: 15, fontWeight: 750, color: "var(--text)", marginTop: 2, lineHeight: 1.23 }}>{bosHelpOfferTitleText(first)}</div></div>
        </div>
        {first.descr ? <div style={{ fontSize: 12.2, color: "var(--text-3)", lineHeight: 1.43, marginTop: 9 }}>{first.descr}</div> : null}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
          {[interaction.title, bosNetWhenText(first), bosNetSlotsText(first.slots_week)].map(function (x, i) { return <span key={i} style={{ borderRadius: 999, padding: "5px 8px", background: i === 0 ? "rgba(254,222,52,0.22)" : "var(--card)", fontSize: 10.5, fontWeight: 700, color: i === 0 ? "#806000" : "var(--text-3)" }}>{x}</span>; })}
        </div>
        {offers.length > 1 ? <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 9 }}>Ещё {offers.length - 1} {offers.length - 1 === 1 ? "применение навыка" : "применения навыков"}</div> : null}
      </div> : null}
    </button>
  );
}

/* Детали человека в Нетворке (reuse дизайна ContactDetailLive): герой + Предложения с бронью.
   Выдуманные отзывы/рейтинг/история НЕ показываем — только реальное. Маршрут "net-person". */
function NetPersonDetailLegacyLive() {
  const { navigate, params } = useNav();
  const app = (typeof useApp === "function") ? useApp() : null;
  const person = (params && params.person) || { ownerId: null, avatar: "default", level: 10, offers: [] };
  const week = bosNetWeek();
  const viewerLevel = (typeof bosLiveXPLive === "function" && typeof bosLevelInfoLive === "function") ? bosLevelInfoLive(bosLiveXPLive(app)).level : 1;
  const offers = (person.offers || []).slice().sort(function (a, b) { return ((a.min_level | 0) - (b.min_level | 0)); });
  const balance = (typeof bosLiveSpendableXPLive === "function") ? bosLiveSpendableXPLive(app) : 0;

  const [taken, setTaken] = React.useState({});
  const [mine, setMine] = React.useState({});
  const [busyId, setBusyId] = React.useState(null);
  React.useEffect(function () {
    var on = true;
    (async function () {
      var C = window.bosCloud; if (!(C && C.enabled && C.enabled())) return;
      var tk = {};
      try { for (var i = 0; i < offers.length; i++) { tk[offers[i].id] = await C.netOfferTaken(offers[i].id, week); } } catch (e) {}
      if (on) setTaken(tk);
      try { var mb = (await C.netMyBookings()) || []; var mm = {}; mb.forEach(function (b) { if (b.week === week) mm[b.offer_id] = true; }); if (on) setMine(mm); } catch (e) {}
    })();
    return function () { on = false; };
  }, [person.ownerId]);

  const book = async function (o) {
    if (busyId) return;
    var C = window.bosCloud; if (!(C && C.enabled && C.enabled() && C.netBook)) return;
    setBusyId(o.id);
    var earned = (typeof bosLiveXPLive === "function") ? bosLiveXPLive(app) : null;
    var res = null; try { res = await C.netBook(o.id, week, earned); } catch (e) {}
    setBusyId(null);
    if (res && res.ok) {
      if (!res.dup && (o.price_xp | 0) > 0 && app && typeof app.noteSpentXP === "function") app.noteSpentXP(o.price_xp);
      setMine(function (m) { var nn = Object.assign({}, m); nn[o.id] = true; return nn; });
      setTaken(function (t) { var nn = Object.assign({}, t); nn[o.id] = (nn[o.id] | 0) + (res.dup ? 0 : 1); return nn; });
      if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} }
    } else {
      if (window.tgHaptic) { try { window.tgHaptic("error"); } catch (e) {} }
    }
  };

  return (
    <div className="page-in" style={{ padding: "0 0 28px" }}>
      {/* HERO */}
      <div style={{ background: "linear-gradient(160deg, rgba(120,140,255,0.22) 0%, rgba(120,140,255,0.06) 60%, transparent 100%)", margin: "-60px 0 0", padding: "60px 16px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", paddingTop: 4, paddingBottom: 14 }}>
          <button onClick={function () { navigate("community"); }} className="tap" style={{ width: 40, height: 40, borderRadius: 999, background: "var(--card)", border: 0, display: "grid", placeItems: "center", padding: 0, boxShadow: "var(--card-shadow)" }}><I.ChevronLeft size={18} /></button>
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          {typeof BosAvatar === "function" ? <BosAvatar avatar={person.avatar} size={64} style={{ flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.10)" }} /> : null}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.5px" }}>Участник</span>
              <span style={{ fontSize: 10, fontWeight: 700, background: "#0a0a0a", color: "#FEDE34", borderRadius: 999, padding: "2px 8px", letterSpacing: 0.4 }}>L{person.level | 0}</span>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 4 }}>Дошёл до Нетворка · помогает окружению</div>
          </div>
        </div>
      </div>

      <div style={{ padding: "14px 16px 0", display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ fontSize: 14 }}>🪙</span>
        <span style={{ fontSize: 12.5, color: "var(--text-4)" }}>Твоя копилка: <b style={{ color: "var(--text-2)" }}>{balance} XP</b></span>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1.4, fontWeight: 700, marginBottom: 10 }}>Предложения</div>
        {offers.length === 0 ? (
          <div style={{ background: "var(--card)", borderRadius: 22, padding: 18, boxShadow: "var(--card-shadow)", fontSize: 13, color: "var(--text-4)" }}>Пока нет активных предложений.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {offers.map(function (o) {
              var slots = (o.slots_week | 0) || 1;
              var tk = taken[o.id] | 0;
              var full = tk >= slots;
              var locked = (viewerLevel | 0) < (o.min_level | 0);
              var booked = !!mine[o.id];
              var affordable = balance >= (o.price_xp | 0);
              var serverUnavailable = (o.min_level | 0) > 1 || (o.price_xp | 0) > 0;
              return (
                <div key={o.id} style={{ background: "var(--card)", borderRadius: 22, padding: 14, boxShadow: "var(--card-shadow)", opacity: (locked && !booked) ? 0.6 : 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ width: 42, height: 42, borderRadius: 14, background: "var(--surface-3)", display: "grid", placeItems: "center", flexShrink: 0 }}><BosHelpOfferIconLive offer={o} size={20} /></span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{bosHelpOfferTitleText(o)}</span>
                        {locked ? <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-4)", background: "var(--surface-3)", borderRadius: 999, padding: "2px 7px" }}>🔒 L{o.min_level}</span> : null}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2 }}>{(o.descr ? (o.descr + " · ") : "") + (o.when_text ? (o.when_text + " · ") : "") + slots + "/нед"}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", flexShrink: 0 }}>{o.price_xp > 0 ? (o.price_xp + " XP") : "Бесплатно"}</div>
                  </div>
                  <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    {booked ? (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, color: "#1E8E4E", background: "rgba(52,199,89,0.14)", borderRadius: 999, padding: "7px 13px" }}><I.Check size={13} strokeWidth={3} /> Ты записан на этой неделе</div>
                    ) : serverUnavailable ? (
                      <div style={{ fontSize: 12.5, color: "var(--text-4)" }}>Запись откроется после серверного кошелька</div>
                    ) : locked ? (
                      <div style={{ fontSize: 12.5, color: "var(--text-4)" }}>Откроется с {o.min_level} уровня</div>
                    ) : full ? (
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: "#FF9F0A" }}>Занято на этой неделе — вернись в следующую</div>
                    ) : !affordable ? (
                      <div style={{ fontSize: 12.5, color: "var(--text-4)" }}>Нужно ещё {(o.price_xp - balance)} XP</div>
                    ) : (
                      <button onClick={function () { book(o); }} disabled={busyId === o.id} className="tap" style={{ background: "#0a0a0a", color: "#fff", border: 0, borderRadius: 999, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{busyId === o.id ? "…" : (o.price_xp > 0 ? ("Записаться за " + o.price_xp + " XP") : "Записаться")}</button>
                    )}
                    {!booked && !locked && !serverUnavailable ? <span style={{ fontSize: 11.5, color: "var(--text-5)" }}>{Math.max(0, slots - tk)} из {slots} свободно</span> : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* Детальный профиль Нетворка: публичное имя раскрывается только здесь, после осознанного
   входа в раздел. Вместо рейтинга — проверяемые дела и число разных людей. */
function NetPersonDetailLive() {
  const { navigate, params } = useNav();
  const { open: openSheet } = (typeof useSheet === "function") ? useSheet() : { open: function () {} };
  const person = (params && params.person) || { ownerId: null, name: "Участник", avatar: "default", level: 10, offers: [] };
  const offers = (person.offers || []).filter(function (o) { return o && o.kind === "skill_offer"; });
  const skills = [];
  offers.forEach(function (o) { var s = bosNetSkillForOffer(o); if (!skills.some(function (x) { return x.key === s.key; })) skills.push(s); });
  const evidence = Math.max(person.evidence | 0, offers.reduce(function (n, o) { return Math.max(n, bosNetEvidence(o)); }, 0));
  const ask = function (o) { openSheet(<NetworkRequestSheetLive person={person} offer={o} />); };
  return (
    <div className="page-in" style={{ padding: "0 0 30px" }}>
      <div style={{ position: "relative", overflow: "hidden", background: "linear-gradient(155deg,#171719,#050505)", color: "#fff", margin: "-60px 0 0", padding: "60px 16px 20px" }}>
        <div aria-hidden style={{ position: "absolute", width: 220, height: 220, borderRadius: "50%", top: -100, right: -100, background: "radial-gradient(circle,rgba(254,222,52,0.28),transparent 68%)" }} />
        <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 4, paddingBottom: 17 }}>
          <button onClick={function () { navigate("community"); }} aria-label="Назад" className="tap hit44" style={{ width: 40, height: 40, border: 0, borderRadius: 999, background: "rgba(255,255,255,0.10)", color: "#fff", display: "grid", placeItems: "center" }}><I.ChevronLeft size={19} /></button>
          <button onClick={function () { openSheet(<NetworkSafetySheetLive person={person} onHidden={function () { navigate("community"); }} />); }} aria-label="Действия" className="tap hit44" style={{ width: 40, height: 40, border: 0, borderRadius: 999, background: "rgba(255,255,255,0.10)", color: "#fff", display: "grid", placeItems: "center" }}><I.More size={18} /></button>
        </div>
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 14 }}>
          {typeof BosAvatar === "function" ? <BosAvatar avatar={person.avatar} size={68} style={{ flexShrink: 0, boxShadow: "0 0 0 2px rgba(255,255,255,0.14)" }} /> : null}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}><span style={{ fontSize: 23, fontWeight: 800, letterSpacing: "-0.55px" }}>{person.name || "Участник"}</span><span style={{ fontSize: 9.5, color: "#17120A", background: "#FEDE34", borderRadius: 999, padding: "3px 8px", fontWeight: 850 }}>L{person.level | 0}</span>{person.preview ? <span style={{ fontSize: 9, color: "rgba(255,255,255,0.62)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 999, padding: "3px 8px", fontWeight: 750, textTransform: "uppercase" }}>пример</span> : null}</div>
            <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.62)", marginTop: 5, lineHeight: 1.4 }}>{evidence ? (evidence + " состоявшихся дел" + ((person.peopleCount | 0) ? (" · " + person.peopleCount + " человек") : "")) : "Навыки подтверждены общими кругами"}</div>
          </div>
        </div>
        <div style={{ position: "relative", display: "flex", gap: 6, overflowX: "auto", marginTop: 15 }}>
          {skills.map(function (s) { return <span key={s.key} style={{ flexShrink: 0, borderRadius: 999, padding: "6px 10px", background: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.84)", fontSize: 11.5, fontWeight: 700 }}>{s.title}</span>; })}
        </div>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        <div className="section-label" style={{ marginBottom: 10 }}>Чем может помочь</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {offers.map(function (o) {
            var s = bosNetSkillForOffer(o), it = bosNetInteraction(o.interaction_key), ev = Math.max(bosNetEvidence(o), person.evidence | 0);
            return <div key={o.id} style={{ background: "var(--card)", borderRadius: 22, padding: 15, boxShadow: "var(--card-shadow)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 11 }}><span style={{ width: 42, height: 42, borderRadius: 14, background: "linear-gradient(145deg,rgba(254,222,52,0.26),var(--surface-3))", display: "grid", placeItems: "center", flexShrink: 0 }}><BosHelpOfferIconLive offer={o} size={20} /></span><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 10.5, color: "#9A7200", fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.55 }}>{s.title}</div><div style={{ fontSize: 16, fontWeight: 750, lineHeight: 1.24, marginTop: 2 }}>{bosHelpOfferTitleText(o)}</div></div></div>
              {o.descr ? <div style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.48, marginTop: 10 }}>{o.descr}</div> : null}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 11 }}>{[it.title, bosNetWhenText(o), bosNetSlotsText(o.slots_week)].map(function (x, i) { return <span key={i} style={{ borderRadius: 999, background: "var(--surface-3)", padding: "5px 8px", fontSize: 10.5, fontWeight: 700, color: "var(--text-3)" }}>{x}</span>; })}</div>
              <div style={{ marginTop: 12, paddingTop: 11, borderTop: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}><span style={{ fontSize: 11.5, color: "var(--text-4)", display: "inline-flex", alignItems: "center", gap: 5 }}><I.Check size={13} color="#B08714" />{ev ? (ev + " подтверждений опытом") : "Подтверждено окружением"}</span><button onClick={function () { ask(o); }} className="tap hit44" style={{ minHeight: 40, border: 0, borderRadius: 999, background: "#0a0a0a", color: "#fff", padding: "9px 15px", fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}>Запросить</button></div>
            </div>;
          })}
        </div>

        <div style={{ marginTop: 13, background: "var(--card)", borderRadius: 22, padding: 15, boxShadow: "var(--card-shadow)" }}>
          <div style={{ fontSize: 14.5, fontWeight: 750 }}>Почему это не рейтинг</div>
          <div style={{ display: "flex", gap: 10, marginTop: 11 }}>
            {[{ i: I.Users, t: "Разные люди", d: "Один и тот же друг не может бесконечно накручивать доверие" }, { i: I.Check, t: "Обе стороны", d: "Дело засчитывается, только когда завершение подтвердили оба" }].map(function (x) { var X = x.i; return <div key={x.t} style={{ flex: 1, minWidth: 0, borderRadius: 15, background: "var(--surface-3)", padding: 11 }}><X size={16} color="#A67A00" /><div style={{ fontSize: 12, fontWeight: 750, marginTop: 7 }}>{x.t}</div><div style={{ fontSize: 10.5, color: "var(--text-4)", lineHeight: 1.38, marginTop: 3 }}>{x.d}</div></div>; })}
          </div>
        </div>
      </div>
    </div>
  );
}

function NetworkRequestSheetLive({ person, offer }) {
  var s = (typeof useSheet === "function") ? useSheet() : { close: function () {} };
  var it = bosNetInteraction(offer && offer.interaction_key), skill = bosNetSkillForOffer(offer || {});
  var choices = ["Понять, с чего начать", "Получить обратную связь", "Собрать следующий шаг", "Разобрать конкретную ситуацию"];
  var _ch = React.useState(choices[0]), choice = _ch[0], setChoice = _ch[1];
  var _n = React.useState(""), note = _n[0], setNote = _n[1];
  var _b = React.useState(false), busy = _b[0], setBusy = _b[1];
  var _e = React.useState(""), error = _e[0], setError = _e[1];
  var _ok = React.useState(false), sent = _ok[0], setSent = _ok[1];
  var send = async function () {
    if (busy) return; setBusy(true); setError("");
    if (offer && offer.preview) { setTimeout(function () { setBusy(false); setSent(true); }, 300); return; }
    var C = window.bosCloud, res = null;
    try { if (C && C.netRequestSkillOffer) res = await C.netRequestSkillOffer(offer.id, choice + (note.trim() ? (" · " + note.trim()) : "")); } catch (e) {}
    setBusy(false);
    if (res && res.ok) { setSent(true); if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} } }
    else setError("Не удалось отправить запрос. Проверь соединение или попробуй позже.");
  };
  if (sent) return <div className="bos-sheet-scroll" style={{ padding: "14px 18px 22px", textAlign: "center", color: "var(--text)" }}>{typeof SheetGreyBgLive === "function" && <SheetGreyBgLive />}<div style={{ width: 58, height: 58, borderRadius: "50%", background: "linear-gradient(135deg,#FEDE34,#EF9F14)", display: "grid", placeItems: "center", margin: "10px auto 14px" }}><I.Check size={26} color="#0a0a0a" strokeWidth={2.4} /></div><div style={{ fontSize: 21, fontWeight: 800 }}>Запрос отправлен</div><div style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.48, margin: "7px auto 16px", maxWidth: 300 }}>{person.name || "Участник"} увидит задачу и сможет принять или вежливо отказаться. После принятия вы сможете открыть контакт и согласовать детали.</div>{offer.preview ? <div style={{ fontSize: 11.5, color: "#8A6500", background: "rgba(254,222,52,0.18)", borderRadius: 13, padding: 10, marginBottom: 12 }}>Это демонстрационный сценарий — реальный запрос не отправлен.</div> : null}<button onClick={s.close} className="tap hit44" style={{ width: "100%", minHeight: 48, border: 0, borderRadius: 16, background: "#0a0a0a", color: "#fff", fontSize: 14.5, fontWeight: 800 }}>Готово</button></div>;
  return <div className="bos-sheet-scroll" style={{ padding: "2px 16px 18px", color: "var(--text)" }}>
    {typeof SheetGreyBgLive === "function" && <SheetGreyBgLive />}
    <div style={typeof _dSTitle !== "undefined" ? _dSTitle : { fontSize: 21, fontWeight: 800 }}>Запросить помощь</div>
    <div style={typeof _dSSub !== "undefined" ? _dSSub : { fontSize: 13, color: "var(--text-4)" }}>{skill.title} · {it.title.toLowerCase()}</div>
    <div style={{ marginTop: 15, borderRadius: 18, background: "var(--card)", padding: 13, boxShadow: "var(--card-shadow)", display: "flex", alignItems: "center", gap: 11 }}><BosAvatar avatar={person.avatar} size={42} /><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14.5, fontWeight: 750 }}>{person.name || "Участник"}</div><div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2 }}>{bosHelpOfferTitleText(offer)}</div></div></div>
    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.7, textTransform: "uppercase", color: "var(--text-4)", margin: "17px 2px 8px" }}>Какой результат нужен</div>
    <div role="radiogroup" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>{choices.map(function (x) { var on = choice === x; return <button key={x} onClick={function () { setChoice(x); }} role="radio" aria-checked={on} className="tap hit44" style={{ minHeight: 48, border: on ? "1px solid #D7A719" : "1px solid transparent", borderRadius: 14, background: on ? "rgba(254,222,52,0.22)" : "var(--card)", color: "var(--text)", boxShadow: on ? "none" : "var(--card-shadow)", padding: "9px 10px", textAlign: "left", fontSize: 11.8, lineHeight: 1.3, fontWeight: on ? 750 : 650 }}>{x}</button>; })}</div>
    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.7, textTransform: "uppercase", color: "var(--text-4)", margin: "17px 2px 8px" }}>Контекст · необязательно</div>
    <textarea value={note} maxLength={180} onChange={function (e) { setNote(e.target.value); }} placeholder="Одна конкретная ситуация, без личных данных" style={{ width: "100%", minHeight: 86, resize: "none", border: "1px solid var(--line)", borderRadius: 16, background: "var(--card)", color: "var(--text)", padding: 12, boxSizing: "border-box", fontSize: 13, lineHeight: 1.4, outline: "none" }} />
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, margin: "6px 2px 0", fontSize: 10.5, color: "var(--text-4)" }}><span>Без оплаты и обещаний результата</span><span>{note.length}/180</span></div>
    {error ? <div role="alert" style={{ marginTop: 10, borderRadius: 13, background: "rgba(255,59,48,0.10)", color: "#C8443A", padding: 10, fontSize: 11.5 }}>{error}</div> : null}
    <button onClick={send} disabled={busy} className="tap hit44" style={{ width: "100%", minHeight: 49, marginTop: 14, border: 0, borderRadius: 16, background: "linear-gradient(135deg,#FEDE34,#EF9F14)", color: "#0a0a0a", fontSize: 14.5, fontWeight: 850, boxShadow: "0 5px 15px rgba(239,159,20,0.28)" }}>{busy ? "Отправляем…" : "Отправить запрос"}</button>
  </div>;
}

function NetworkSafetySheetLive({ person, onHidden }) {
  var s = (typeof useSheet === "function") ? useSheet() : { close: function () {} };
  var _r = React.useState(null), reason = _r[0], setReason = _r[1];
  var _ok = React.useState(false), done = _ok[0], setDone = _ok[1];
  var reasons = [["spam", "Спам или реклама"], ["unsafe", "Опасное обещание"], ["misleading_skill", "Навык описан вводяще в заблуждение"], ["harassment", "Оскорбление или давление"], ["other", "Другое нарушение"]];
  var hide = async function (block) {
    try { var a = JSON.parse(localStorage.getItem("bos:network:hidden") || "[]"); if (a.indexOf(person.ownerId) < 0) a.push(person.ownerId); localStorage.setItem("bos:network:hidden", JSON.stringify(a)); } catch (e) {}
    if (block && window.bosCloud && window.bosCloud.netBlockUser && !person.preview) try { await window.bosCloud.netBlockUser(person.ownerId); } catch (e) {}
    s.close(); if (onHidden) onHidden();
  };
  var report = async function () { if (!reason) return; if (window.bosCloud && window.bosCloud.netReportUser && !person.preview) try { await window.bosCloud.netReportUser(person.ownerId, reason, { source: "network_profile" }); } catch (e) {} setDone(true); };
  return <div className="bos-sheet-scroll" style={{ padding: "2px 16px 18px", color: "var(--text)" }}>{typeof SheetGreyBgLive === "function" && <SheetGreyBgLive />}<div style={_dSTitle}>Безопасность</div><div style={_dSSub}>{person.name || "Участник"} · действия видны только тебе и модерации</div>
    {done ? <div style={{ textAlign: "center", padding: "26px 8px 8px" }}><I.Check size={28} color="#A67A00" /><div style={{ fontSize: 18, fontWeight: 800, marginTop: 10 }}>Жалоба отправлена</div><div style={{ fontSize: 12.5, color: "var(--text-4)", marginTop: 5 }}>Карточку можно также скрыть или заблокировать.</div></div> : <React.Fragment>
      <div style={{ marginTop: 16, borderRadius: 18, background: "var(--card)", boxShadow: "var(--card-shadow)", overflow: "hidden" }}><button onClick={function () { hide(false); }} className="tap hit44" style={{ width: "100%", minHeight: 52, border: 0, background: "transparent", color: "var(--text)", display: "flex", alignItems: "center", gap: 11, padding: "10px 13px", textAlign: "left" }}><I.Eye size={18} /><span style={{ flex: 1, fontSize: 13.5, fontWeight: 700 }}>Больше не показывать карточку</span></button><button onClick={function () { hide(true); }} className="tap hit44" style={{ width: "100%", minHeight: 52, border: 0, borderTop: "1px solid var(--line)", background: "transparent", color: "#C8443A", display: "flex", alignItems: "center", gap: 11, padding: "10px 13px", textAlign: "left" }}><I.Ban size={18} /><span style={{ flex: 1, fontSize: 13.5, fontWeight: 700 }}>Заблокировать друг друга</span></button></div>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.7, textTransform: "uppercase", color: "var(--text-4)", margin: "18px 2px 8px" }}>Пожаловаться</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>{reasons.map(function (r) { var on = reason === r[0]; return <button key={r[0]} onClick={function () { setReason(r[0]); }} className="tap hit44" style={{ minHeight: 47, border: on ? "1px solid #D7A719" : "1px solid transparent", borderRadius: 14, background: on ? "rgba(254,222,52,0.20)" : "var(--card)", color: "var(--text)", textAlign: "left", padding: "10px 12px", fontSize: 12.5, fontWeight: on ? 750 : 650, boxShadow: on ? "none" : "var(--card-shadow)" }}>{r[1]}</button>; })}</div>
    </React.Fragment>}
    <button onClick={done ? s.close : report} disabled={!done && !reason} className="tap hit44" style={{ width: "100%", minHeight: 48, marginTop: 14, border: 0, borderRadius: 16, background: done ? "#0a0a0a" : (reason ? "#0a0a0a" : "var(--surface-3)"), color: (done || reason) ? "#fff" : "var(--text-4)", fontSize: 14, fontWeight: 800 }}>{done ? "Готово" : "Отправить жалобу"}</button>
  </div>;
}

function SkillsWorkbenchLive({ app, level, onChanged }) {
  var s = (typeof useSheet === "function") ? useSheet() : { open: function () {} };
  var _sk = React.useState(null), skills = _sk[0], setSkills = _sk[1];
  var _of = React.useState([]), offers = _of[0], setOffers = _of[1];
  var _er = React.useState(""), error = _er[0], setError = _er[1];
  var _t = React.useState(0), tick = _t[0], setTick = _t[1];
  var refresh = function () { setTick(function (n) { return n + 1; }); if (onChanged) onChanged(); };
  React.useEffect(function () {
    var on = true, C = window.bosCloud;
    if (!(C && C.enabled && C.enabled())) { setSkills([]); return; }
    Promise.all([
      C.loadMySkills ? C.loadMySkills() : Promise.resolve({ status: "error", skills: [] }),
      C.netMySkillOffers ? C.netMySkillOffers({ includePaused: true }) : Promise.resolve({ status: "error", offers: [] })
    ]).then(async function (r) { if (!on) return; var mine = (r[0] && r[0].skills) || []; if (C.netSkillEvidence && mine.length) { try { await Promise.all(mine.map(async function (sk) { var er = await C.netSkillEvidence(sk.id); var ev = er && er.evidence; if (ev) { sk.confirmations_count = ev.role_confirmations | 0; sk.evidence_count = ev.completed_episodes | 0; sk.people_count = (ev.unique_people != null ? ev.unique_people : ev.completed_episodes) | 0; sk.state = ev.state || sk.state; } })); } catch (e) {} } if (!on) return; setSkills(mine); setOffers((r[1] && r[1].offers) || []); }).catch(function () { if (on) setSkills([]); });
    return function () { on = false; };
  }, [tick]);
  var openSkill = function () { s.open(<AddSkillSheetLive onDone={refresh} />); };
  var editOffer = function (skill, offer) { s.open(<SkillOfferEditorSheetLive skill={skill} offer={offer || null} onDone={refresh} />); };
  var publish = async function (offer) { setError(""); var C = window.bosCloud, r = null; try { if (C && C.netPublishSkillOffer) r = await C.netPublishSkillOffer(offer.id); } catch (e) {} if (r && r.ok) refresh(); else setError((r && r.err === "not_eligible") ? "Сначала нужны подтверждения роли и состоявшиеся дела с разными людьми." : "Публикация пока недоступна. Проверь прогресс навыка."); };
  var pause = async function (offer) { setError(""); var C = window.bosCloud, r = null; try { if (C && C.netPauseSkillOffer) r = await C.netPauseSkillOffer(offer.id, true); } catch (e) {} if (r && r.ok) refresh(); else setError("Не удалось приостановить предложение."); };
  return <React.Fragment>
    <div style={{ borderRadius: 23, padding: 16, background: "linear-gradient(145deg,#171719,#050505)", color: "#fff", boxShadow: "0 9px 25px rgba(0,0,0,0.22)" }}><div style={{ display: "flex", alignItems: "center", gap: 12 }}><span style={{ width: 44, height: 44, borderRadius: 15, background: "rgba(254,222,52,0.16)", display: "grid", placeItems: "center" }}><I.Bulb size={21} color="#FEDE34" /></span><div style={{ flex: 1 }}><div style={{ fontSize: 18, fontWeight: 800 }}>Навык — не привычка</div><div style={{ fontSize: 12, color: "rgba(255,255,255,0.58)", lineHeight: 1.42, marginTop: 3 }}>Навык отвечает на «что я умею дать другому» и подтверждается реальными делами.</div></div></div><button onClick={openSkill} className="tap hit44" style={{ width: "100%", minHeight: 45, marginTop: 14, border: "1px solid rgba(254,222,52,0.30)", borderRadius: 15, background: "rgba(254,222,52,0.12)", color: "#FEDE34", fontSize: 13.5, fontWeight: 800 }}>＋ Добавить навык</button></div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 5, padding: "0 2px" }}>{[["1", "Заявить"], ["2", "Показать своим"], ["3", "Подтвердить делами"], ["4", "Открыть шире"]].map(function (x, i) { return <div key={x[0]} style={{ textAlign: "center" }}><div style={{ height: 3, borderRadius: 999, background: i === 0 ? "#D7A719" : "var(--line)" }} /><div style={{ fontSize: 9.5, color: "var(--text-4)", marginTop: 6, lineHeight: 1.25 }}>{x[1]}</div></div>; })}</div>
    {error ? <div role="alert" style={{ borderRadius: 14, background: "rgba(255,59,48,0.09)", color: "#C8443A", padding: "10px 12px", fontSize: 11.5 }}>{error}</div> : null}
    {skills === null ? <div style={{ background: "var(--card)", borderRadius: 20, padding: 16, color: "var(--text-4)" }}>Загружаем навыки…</div> : skills.length ? <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>{skills.map(function (sk) {
      var def = bosSkillDef(sk.skill_key || sk.key, sk.title), offer = offers.filter(function (o) { return o.skill_id === sk.id || (o.skill_key && o.skill_key === def.key); })[0];
      var confirmations = Math.max(0, sk.confirmations_count | 0), episodes = Math.max(0, sk.evidence_count | 0), peopleN = Math.max(0, sk.people_count | 0);
      var published = !!(offer && offer.visibility === "all" && offer.status === "confirmed" && offer.active !== false);
      var eligible = sk.state === "trusted" || (confirmations >= 2 && episodes >= 2 && peopleN >= 2);
      var canPublish = eligible && (level | 0) >= 10;
      var DefIcon = I[def.icon] || I.Bulb;
      return <div key={sk.id || def.key} style={{ background: "var(--card)", borderRadius: 21, padding: 14, boxShadow: "var(--card-shadow)" }}><div style={{ display: "flex", gap: 11, alignItems: "center" }}><span style={{ width: 40, height: 40, borderRadius: 13, background: "var(--surface-3)", display: "grid", placeItems: "center" }}><DefIcon size={19} /></span><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 15, fontWeight: 750 }}>{def.title}</div><div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 2 }}>{published ? "Открыт в Нетворке" : eligible ? "Готов к публикации" : offer ? "Практика у своих" : "Заявлен"}</div></div>{published ? <span style={{ fontSize: 9.5, fontWeight: 800, color: "#7B5A00", background: "rgba(254,222,52,0.25)", borderRadius: 999, padding: "4px 8px" }}>В НЕТВОРКЕ</span> : null}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginTop: 12 }}>{[[confirmations, "роль", 2], [episodes, "дела", 2], [peopleN, "люди", 2]].map(function (x) { var done = x[0] >= x[2]; return <div key={x[1]} style={{ borderRadius: 13, background: done ? "rgba(254,222,52,0.17)" : "var(--surface-3)", padding: "8px 7px", textAlign: "center" }}><div style={{ fontSize: 13, fontWeight: 800, color: done ? "#8A6500" : "var(--text-2)" }}>{x[0]}/{x[2]}</div><div style={{ fontSize: 9.5, color: "var(--text-4)", marginTop: 2 }}>{x[1]}</div></div>; })}</div>
        <div style={{ display: "flex", gap: 7, marginTop: 10 }}><button onClick={function () { if (!offer || !canPublish || published) editOffer(sk, offer); else publish(offer); }} className="tap hit44" style={{ flex: 1, minHeight: 43, border: 0, borderRadius: 14, background: canPublish && offer && !published ? "linear-gradient(135deg,#FEDE34,#EF9F14)" : "var(--surface-3)", color: canPublish && offer && !published ? "#0a0a0a" : "var(--text-2)", fontSize: 12.5, fontWeight: 800 }}>{!offer ? "Оформить применение" : published ? "Настроить" : eligible && (level | 0) < 10 ? "Нетворк с 10 уровня" : canPublish ? ((offer.status === "confirmed" && offer.visibility === "all") ? "Возобновить" : "Открыть в Нетворке") : "Настроить и показать своим"}</button>{published ? <button onClick={function () { pause(offer); }} className="tap hit44" style={{ minHeight: 43, border: 0, borderRadius: 14, background: "var(--surface-3)", color: "var(--text-4)", padding: "8px 12px", fontSize: 11.5, fontWeight: 750 }}>Пауза</button> : null}</div></div>;
    })}</div> : <div style={{ background: "var(--card)", borderRadius: 22, padding: "18px 16px", boxShadow: "var(--card-shadow)" }}><div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}><span style={{ width: 40, height: 40, borderRadius: 14, background: "var(--surface-3)", display: "grid", placeItems: "center" }}><I.Plus size={18} /></span><div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 750 }}>Начни с одного навыка</div><div style={{ fontSize: 12.5, color: "var(--text-4)", lineHeight: 1.46, marginTop: 4 }}>Не перечисляй всё, что когда-либо пробовал. Выбери то, что готов применить для конкретного человека уже сейчас.</div></div></div><button onClick={openSkill} className="tap hit44" style={{ width: "100%", minHeight: 44, marginTop: 12, border: 0, borderRadius: 14, background: "var(--surface-3)", color: "var(--text)", fontSize: 13, fontWeight: 800 }}>Выбрать из каталога</button></div>}
    <div style={{ borderRadius: 17, background: "rgba(254,222,52,0.13)", border: "1px solid rgba(215,167,25,0.23)", padding: "11px 12px", fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.46 }}><b style={{ color: "var(--text-2)" }}>Зачем тогда помощь кругу?</b> Она помогает прямо сейчас и доказывает надёжность. Если дело связано с навыком, оно ещё и строит доказательство для Нетворка. XP не покупает и не заменяет доверие.</div>
  </React.Fragment>;
}

function AddSkillSheetLive({ onDone }) {
  var s = (typeof useSheet === "function") ? useSheet() : { close: function () {} };
  var _q = React.useState(""), q = _q[0], setQ = _q[1];
  var _g = React.useState("all"), group = _g[0], setGroup = _g[1];
  var _sel = React.useState(null), selected = _sel[0], setSelected = _sel[1];
  var _b = React.useState(false), busy = _b[0], setBusy = _b[1];
  var _e = React.useState(""), error = _e[0], setError = _e[1];
  var shown = BOS_SKILL_CATALOG.filter(function (x) { return (group === "all" || x.group === group) && (!q.trim() || (x.title + " " + x.groupTitle).toLowerCase().indexOf(q.trim().toLowerCase()) >= 0); });
  var save = async function () { if (!selected || busy) return; setBusy(true); setError(""); var r = null; try { if (window.bosCloud && window.bosCloud.claimSkill) r = await window.bosCloud.claimSkill(selected.key); } catch (e) {} setBusy(false); if (r && r.ok) { if (onDone) onDone(r.skill || r); s.close(); } else setError("Не удалось добавить навык. Возможно, серверная миграция ещё не применена."); };
  return <div className="bos-sheet-scroll" style={{ padding: "2px 16px 18px", color: "var(--text)" }}>{typeof SheetGreyBgLive === "function" && <SheetGreyBgLive />}<div style={_dSTitle}>Добавить навык</div><div style={_dSSub}>выбери способность, которую готов применить для другого человека</div>
    <div style={{ position: "relative", marginTop: 15 }}><I.Search size={17} color="var(--text-4)" style={{ position: "absolute", left: 13, top: 13 }} /><input value={q} onChange={function (e) { setQ(e.target.value); }} placeholder="Найти навык" style={{ width: "100%", height: 44, border: "1px solid var(--line)", borderRadius: 14, background: "var(--card)", color: "var(--text)", padding: "0 12px 0 40px", boxSizing: "border-box", outline: "none", fontSize: 13.5 }} /></div>
    <div className="bos-hscroll" style={{ display: "flex", gap: 6, overflowX: "auto", padding: "10px 0 3px" }}>{[{ key: "all", title: "Все" }].concat(BOS_SKILL_GROUPS).map(function (g) { var on = group === g.key; return <button key={g.key} onClick={function () { setGroup(g.key); }} className="tap hit44" style={{ minHeight: 38, flexShrink: 0, border: on ? "1px solid #D7A719" : "1px solid var(--line)", borderRadius: 999, background: on ? "rgba(254,222,52,0.20)" : "var(--card)", color: "var(--text-3)", padding: "7px 11px", fontSize: 11.5, fontWeight: 700 }}>{g.title}</button>; })}</div>
    <div style={{ marginTop: 9, background: "var(--card)", borderRadius: 18, boxShadow: "var(--card-shadow)", overflow: "hidden", maxHeight: 340, overflowY: "auto" }}>{shown.map(function (x, i) { var on = selected && selected.key === x.key, X = I[x.icon] || I.Bulb; return <button key={x.key} onClick={function () { setSelected(x); }} className="tap hit44" style={{ width: "100%", minHeight: 52, border: 0, borderTop: i ? "1px solid var(--line)" : 0, background: on ? "rgba(254,222,52,0.16)" : "transparent", color: "var(--text)", display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", textAlign: "left" }}><span style={{ width: 32, height: 32, borderRadius: 11, background: "var(--surface-3)", display: "grid", placeItems: "center" }}><X size={16} /></span><span style={{ flex: 1 }}><span style={{ display: "block", fontSize: 13.5, fontWeight: 700 }}>{x.title}</span><span style={{ display: "block", fontSize: 10.5, color: "var(--text-4)", marginTop: 2 }}>{x.groupTitle}</span></span><span style={{ width: 21, height: 21, borderRadius: "50%", display: "grid", placeItems: "center", border: on ? "1px solid #D7A719" : "1px solid var(--line)", background: on ? "#FEDE34" : "transparent" }}>{on ? <I.Check size={11} color="#0a0a0a" strokeWidth={2.6} /> : null}</span></button>; })}</div>
    <div style={{ fontSize: 10.8, color: "var(--text-4)", lineHeight: 1.42, margin: "10px 2px 0" }}>Не нашёл точное название? Каталог расширяется через модерацию — публичные навыки нельзя вписать от балды.</div>{error ? <div role="alert" style={{ marginTop: 9, borderRadius: 13, background: "rgba(255,59,48,0.09)", color: "#C8443A", padding: 10, fontSize: 11.5 }}>{error}</div> : null}
    <button onClick={save} disabled={!selected || busy} className="tap hit44" style={{ width: "100%", minHeight: 48, marginTop: 13, border: 0, borderRadius: 16, background: selected ? "linear-gradient(135deg,#FEDE34,#EF9F14)" : "var(--surface-3)", color: selected ? "#0a0a0a" : "var(--text-4)", fontSize: 14, fontWeight: 850 }}>{busy ? "Добавляем…" : "Добавить навык"}</button>
  </div>;
}

function SkillOfferEditorSheetLive({ skill, offer, onDone }) {
  var s = (typeof useSheet === "function") ? useSheet() : { close: function () {} };
  var def = bosSkillDef(skill && (skill.skill_key || skill.key), skill && skill.title);
  var _it = React.useState((offer && offer.interaction_key) || "review"), itKey = _it[0], setItKey = _it[1];
  var _out = React.useState((offer && offer.outcome_key) || "clear_next_step"), outcome = _out[0], setOutcome = _out[1];
  var initialMinutes = offer && parseInt(offer.when_text, 10); if ([30,45,60].indexOf(initialMinutes) < 0) initialMinutes = 30;
  var _min = React.useState(initialMinutes), mins = _min[0], setMins = _min[1];
  var _mode = React.useState((offer && offer.mode) || ((offer && /рядом/i.test(offer.when_text || "")) ? "nearby" : "online")), mode = _mode[0], setMode = _mode[1];
  var _slots = React.useState((offer && offer.slots_week) || 2), slots = _slots[0], setSlots = _slots[1];
  var _b = React.useState(false), busy = _b[0], setBusy = _b[1];
  var _e = React.useState(""), error = _e[0], setError = _e[1];
  var outcomes = [{ key: "clear_next_step", title: "Понятный следующий шаг", descr: "Человек уйдёт с одним конкретным действием." }, { key: "three_recommendations", title: "Разбор и 3 рекомендации", descr: "Короткая обратная связь без обещания результата." }, { key: "working_first_result", title: "Первый результат вместе", descr: "Во встрече появится рабочий черновик или практика." }];
  var selectedOutcome = outcomes.filter(function (x) { return x.key === outcome; })[0] || outcomes[0], it = bosNetInteraction(itKey);
  var title = outcome === "three_recommendations" ? ("Разобрать задачу по «" + def.title + "»") : outcome === "working_first_result" ? ("Сделать первый шаг в «" + def.title + "»") : (it.outcome + " · " + def.title);
  var save = async function () { if (busy) return; setBusy(true); setError(""); var r = null; try { if (window.bosCloud && window.bosCloud.netUpsertSkillOffer) r = await window.bosCloud.netUpsertSkillOffer({ id: offer && offer.id, skill_id: skill.id, skill_key: def.key, interaction_key: itKey, outcome_key: outcome, mode: mode, title: title, descr: selectedOutcome.descr, when_text: mins + " мин", slots_week: slots }); } catch (e) {} setBusy(false); if (r && r.ok) { if (onDone) onDone(r.offer || r); s.close(); } else setError("Не удалось сохранить применение навыка."); };
  var chip = function (on) { return { minHeight: 42, border: on ? "1px solid #D7A719" : "1px solid transparent", borderRadius: 13, background: on ? "rgba(254,222,52,0.21)" : "var(--card)", color: "var(--text)", boxShadow: on ? "none" : "var(--card-shadow)", fontSize: 11.5, fontWeight: on ? 760 : 650, padding: "8px 9px" }; };
  return <div className="bos-sheet-scroll" style={{ padding: "2px 16px 18px", color: "var(--text)" }}>{typeof SheetGreyBgLive === "function" && <SheetGreyBgLive />}<div style={_dSTitle}>{offer ? "Настроить применение" : "Применить навык"}</div><div style={_dSSub}>{def.title} · сначала это увидят твои круги</div>
    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.7, textTransform: "uppercase", color: "var(--text-4)", margin: "16px 2px 8px" }}>Формат взаимодействия</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>{BOS_NET_INTERACTIONS.map(function (x) { return <button key={x.key} onClick={function () { setItKey(x.key); }} className="tap hit44" style={chip(itKey === x.key)}>{x.title}</button>; })}</div>
    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.7, textTransform: "uppercase", color: "var(--text-4)", margin: "17px 2px 8px" }}>Что человек получит</div><div style={{ display: "flex", flexDirection: "column", gap: 7 }}>{outcomes.map(function (x) { var on = outcome === x.key; return <button key={x.key} onClick={function () { setOutcome(x.key); }} className="tap hit44" style={{ minHeight: 52, border: on ? "1px solid #D7A719" : "1px solid transparent", borderRadius: 15, background: on ? "rgba(254,222,52,0.18)" : "var(--card)", color: "var(--text)", boxShadow: on ? "none" : "var(--card-shadow)", padding: "10px 12px", textAlign: "left" }}><span style={{ display: "block", fontSize: 13, fontWeight: 750 }}>{x.title}</span><span style={{ display: "block", fontSize: 10.5, color: "var(--text-4)", marginTop: 3 }}>{x.descr}</span></button>; })}</div>
    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.7, textTransform: "uppercase", color: "var(--text-4)", margin: "17px 2px 8px" }}>Границы</div><div style={{ background: "var(--card)", borderRadius: 18, boxShadow: "var(--card-shadow)", padding: 11 }}><div style={{ fontSize: 10.5, color: "var(--text-4)", fontWeight: 700, marginBottom: 6 }}>Время</div><div style={{ display: "flex", gap: 6 }}>{[30,45,60].map(function (x) { return <button key={x} onClick={function () { setMins(x); }} className="tap hit44" style={Object.assign({ flex: 1 }, chip(mins === x))}>{x} мин</button>; })}</div><div style={{ fontSize: 10.5, color: "var(--text-4)", fontWeight: 700, margin: "11px 0 6px" }}>Где</div><div style={{ display: "flex", gap: 6 }}>{[["online","Онлайн"],["nearby","Рядом"]].map(function (x) { return <button key={x[0]} onClick={function () { setMode(x[0]); }} className="tap hit44" style={Object.assign({ flex: 1 }, chip(mode === x[0]))}>{x[1]}</button>; })}</div><div style={{ fontSize: 10.5, color: "var(--text-4)", fontWeight: 700, margin: "11px 0 6px" }}>Мест в неделю</div><div style={{ display: "flex", gap: 6 }}>{[1,2,3,4,5].map(function (x) { return <button key={x} onClick={function () { setSlots(x); }} className="tap hit44" style={Object.assign({ flex: 1 }, chip(slots === x))}>{x}</button>; })}</div></div>
    <div style={{ marginTop: 12, borderRadius: 16, background: "rgba(254,222,52,0.15)", padding: 12 }}><div style={{ fontSize: 10.5, color: "#8A6500", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 800 }}>Так увидит человек</div><div style={{ fontSize: 14.5, fontWeight: 750, marginTop: 5 }}>{title}</div><div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 3 }}>{selectedOutcome.descr} · {mins} мин · {mode === "online" ? "онлайн" : "рядом"}</div></div>
    <div style={{ fontSize: 10.8, color: "var(--text-4)", lineHeight: 1.42, margin: "9px 2px 0" }}>Свободного объявления нет: формат, результат и границы выбираются из безопасной структуры. После дел у своих появится кнопка «Открыть в Нетворке».</div>{error ? <div role="alert" style={{ marginTop: 9, borderRadius: 13, background: "rgba(255,59,48,0.09)", color: "#C8443A", padding: 10, fontSize: 11.5 }}>{error}</div> : null}
    <button onClick={save} disabled={busy} className="tap hit44" style={{ width: "100%", minHeight: 49, marginTop: 13, border: 0, borderRadius: 16, background: "linear-gradient(135deg,#FEDE34,#EF9F14)", color: "#0a0a0a", fontSize: 14.5, fontWeight: 850 }}>{busy ? "Сохраняем…" : "Сохранить для своих"}</button>
  </div>;
}

function NetworkEpisodesLegacyLive({ app, onChanged }) {
  var sheet = (typeof useSheet === "function") ? useSheet() : { open: function () {} };
  var _tab = React.useState("incoming"), tab = _tab[0], setTab = _tab[1];
  var _in = React.useState(null), incoming = _in[0], setIncoming = _in[1];
  var _out = React.useState(null), outgoing = _out[0], setOutgoing = _out[1];
  var _t = React.useState(0), tick = _t[0], setTick = _t[1];
  var refresh = function () { setTick(function (n) { return n + 1; }); if (onChanged) onChanged(); };
  React.useEffect(function () { var on = true, C = window.bosCloud; if (!(C && C.enabled && C.enabled())) { setIncoming([]); setOutgoing([]); return; } Promise.all([C.netIncomingSkillEpisodes ? C.netIncomingSkillEpisodes({ limit: 50 }) : Promise.resolve({ episodes: [] }), C.netOutgoingSkillEpisodes ? C.netOutgoingSkillEpisodes({ limit: 50 }) : Promise.resolve({ episodes: [] })]).then(async function (r) { if (!on) return; var ins = (r[0] && r[0].episodes) || [], outs = (r[1] && r[1].episodes) || [], ids = []; ins.concat(outs).forEach(function (x) { [x.owner_id, x.booker_id].forEach(function (id) { if (id && ids.indexOf(id) < 0) ids.push(id); }); }); if (C.netProfiles && ids.length) { try { var pr = await C.netProfiles(ids), pm = {}; ((pr && pr.profiles) || []).forEach(function (p) { pm[p.id] = p; }); ins.forEach(function (x) { x.other_profile = pm[x.booker_id] || null; }); outs.forEach(function (x) { x.other_profile = pm[x.owner_id] || null; }); } catch (e) {} } if (!on) return; setIncoming(ins); setOutgoing(outs); }).catch(function () { if (on) { setIncoming([]); setOutgoing([]); } }); return function () { on = false; }; }, [tick]);
  var list = tab === "incoming" ? incoming : outgoing;
  var mutate = async function (row, action) { var C = window.bosCloud, fn = action === "accept" ? C.netAcceptSkillEpisode : action === "decline" ? C.netDeclineSkillEpisode : action === "cancel" ? C.netCancelSkillEpisode : action === "provider_done" ? C.netMarkSkillProviderDone : C.netMarkSkillRecipientDone; var r = null; try { if (fn) r = await fn(row.id); } catch (e) {} if (r && r.ok) refresh(); };
  return <React.Fragment><div style={{ background: "var(--card)", borderRadius: 22, padding: 15, boxShadow: "var(--card-shadow)" }}><div style={{ fontSize: 18, fontWeight: 800 }}>Запрос — не мгновенная бронь</div><div style={{ fontSize: 12.5, color: "var(--text-4)", lineHeight: 1.45, marginTop: 5 }}>Сначала человек принимает задачу. Потом вы согласуете детали, делаете дело и оба подтверждаете завершение.</div><div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 5, marginTop: 13 }}>{[["1","Запрос"],["2","Принят"],["3","Дело"],["4","Оба подтвердили"]].map(function (x, i) { return <div key={x[0]} style={{ textAlign: "center" }}><div style={{ width: 25, height: 25, borderRadius: "50%", margin: "0 auto", display: "grid", placeItems: "center", background: i === 0 ? "#FEDE34" : "var(--surface-3)", fontSize: 10.5, fontWeight: 850 }}>{x[0]}</div><div style={{ fontSize: 9.3, color: "var(--text-4)", lineHeight: 1.2, marginTop: 5 }}>{x[1]}</div></div>; })}</div></div>
    <div style={{ display: "flex", gap: 4, background: "var(--surface-3)", borderRadius: 15, padding: 4 }}><button onClick={function () { setTab("incoming"); }} className="tap hit44" style={{ flex: 1, minHeight: 40, border: 0, borderRadius: 12, background: tab === "incoming" ? "var(--card)" : "transparent", color: tab === "incoming" ? "var(--text)" : "var(--text-4)", boxShadow: tab === "incoming" ? "var(--card-shadow)" : "none", fontSize: 12.5, fontWeight: 750 }}>Ко мне</button><button onClick={function () { setTab("outgoing"); }} className="tap hit44" style={{ flex: 1, minHeight: 40, border: 0, borderRadius: 12, background: tab === "outgoing" ? "var(--card)" : "transparent", color: tab === "outgoing" ? "var(--text)" : "var(--text-4)", boxShadow: tab === "outgoing" ? "var(--card-shadow)" : "none", fontSize: 12.5, fontWeight: 750 }}>От меня</button></div>
    {list === null ? <div style={{ padding: 16, color: "var(--text-4)" }}>Загружаем запросы…</div> : list.length ? <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>{list.map(function (row) { var o = row.offer || row.network_offers || {}, st = row.status || "requested", provider = tab === "incoming"; return <div key={row.id} style={{ background: "var(--card)", borderRadius: 20, padding: 14, boxShadow: "var(--card-shadow)" }}><div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ width: 36, height: 36, borderRadius: 12, background: "var(--surface-3)", display: "grid", placeItems: "center" }}><BosHelpOfferIconLive offer={o} size={17} /></span><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 750 }}>{bosHelpOfferTitleText(o)}</div><div style={{ fontSize: 10.8, color: "var(--text-4)", marginTop: 2 }}>{st === "requested" ? "Ждёт ответа" : st === "accepted" ? "Принят · можно согласовать детали" : (st === "done" || st === "completed") ? "Состоялось · подтверждено обоими" : st === "declined" ? "Отклонён" : st === "cancelled" ? "Отменён" : st}</div></div></div>{row.request_note ? <div style={{ marginTop: 9, borderRadius: 13, background: "var(--surface-3)", padding: 9, fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.4 }}>{row.request_note}</div> : null}<div style={{ display: "flex", gap: 7, marginTop: 10, flexWrap: "wrap" }}>{provider && st === "requested" ? <React.Fragment><button onClick={function () { mutate(row,"accept"); }} className="tap hit44" style={{ flex: 1, minHeight: 41, border: 0, borderRadius: 13, background: "#0a0a0a", color: "#fff", fontSize: 12, fontWeight: 800 }}>Принять</button><button onClick={function () { mutate(row,"decline"); }} className="tap hit44" style={{ minHeight: 41, border: 0, borderRadius: 13, background: "var(--surface-3)", color: "var(--text-3)", padding: "8px 12px", fontSize: 12, fontWeight: 750 }}>Отказать</button></React.Fragment> : st === "accepted" ? <React.Fragment><button onClick={function () { sheet.open(<NetworkEpisodeContactSheetLive episode={row} />); }} className="tap hit44" style={{ minHeight: 41, border: 0, borderRadius: 13, background: "var(--surface-3)", color: "var(--text-2)", padding: "8px 12px", fontSize: 12, fontWeight: 800 }}>Связаться</button><button onClick={function () { mutate(row, provider ? "provider_done" : "recipient_done"); }} className="tap hit44" style={{ flex: 1, minHeight: 41, border: 0, borderRadius: 13, background: "linear-gradient(135deg,#FEDE34,#EF9F14)", color: "#0a0a0a", fontSize: 12, fontWeight: 850 }}>С моей стороны состоялось</button></React.Fragment> : !provider && st === "requested" ? <button onClick={function () { mutate(row,"cancel"); }} className="tap hit44" style={{ flex: 1, minHeight: 41, border: 0, borderRadius: 13, background: "var(--surface-3)", color: "var(--text-3)", fontSize: 12, fontWeight: 750 }}>Отменить запрос</button> : null}</div></div>; })}</div> : <div style={{ background: "var(--card)", borderRadius: 21, padding: "19px 16px", boxShadow: "var(--card-shadow)", textAlign: "center" }}><I.MessageCircle size={24} color="var(--text-4)" /><div style={{ fontSize: 15, fontWeight: 750, marginTop: 8 }}>{tab === "incoming" ? "К тебе пока не обращались" : "Ты пока ничего не запросил"}</div><div style={{ fontSize: 12, color: "var(--text-4)", lineHeight: 1.43, marginTop: 4 }}>{tab === "incoming" ? "Запросы появятся после публикации подтверждённого навыка." : "Найди человека по задаче и отправь короткий структурный запрос."}</div></div>}
  </React.Fragment>;
}

function NetworkEpisodesLive({ app, onChanged }) {
  var sheet = (typeof useSheet === "function") ? useSheet() : { open: function () {} };
  var _tab = React.useState("incoming"), tab = _tab[0], setTab = _tab[1];
  var _in = React.useState(null), incoming = _in[0], setIncoming = _in[1];
  var _out = React.useState(null), outgoing = _out[0], setOutgoing = _out[1];
  var _err = React.useState(false), loadError = _err[0], setLoadError = _err[1];
  var _tick = React.useState(0), tick = _tick[0], setTick = _tick[1];
  var refresh = function () { setTick(function (n) { return n + 1; }); if (onChanged) onChanged(); };
  React.useEffect(function () {
    var on = true, C = window.bosCloud;
    if (!(C && C.enabled && C.enabled())) { setIncoming([]); setOutgoing([]); return; }
    Promise.all([
      C.netIncomingSkillEpisodes ? C.netIncomingSkillEpisodes({ limit: 50 }) : Promise.resolve({ status: "error", episodes: [] }),
      C.netOutgoingSkillEpisodes ? C.netOutgoingSkillEpisodes({ limit: 50 }) : Promise.resolve({ status: "error", episodes: [] })
    ]).then(async function (r) {
      if (!on) return;
      var ins = (r[0] && r[0].episodes) || [], outs = (r[1] && r[1].episodes) || [];
      setLoadError((r[0] && r[0].status === "error") || (r[1] && r[1].status === "error"));
      var ids = [];
      ins.concat(outs).forEach(function (x) { [x.owner_id, x.booker_id].forEach(function (id) { if (id && ids.indexOf(id) < 0) ids.push(id); }); });
      if (C.netProfiles && ids.length) {
        try {
          var pr = await C.netProfiles(ids), pm = {};
          ((pr && pr.profiles) || []).forEach(function (p) { pm[p.id] = p; });
          ins.forEach(function (x) { x.other_profile = pm[x.booker_id] || null; });
          outs.forEach(function (x) { x.other_profile = pm[x.owner_id] || null; });
        } catch (e) {}
      }
      if (on) { setIncoming(ins); setOutgoing(outs); }
    }).catch(function () { if (on) { setLoadError(true); setIncoming([]); setOutgoing([]); } });
    return function () { on = false; };
  }, [tick]);
  var mutate = async function (row, action) {
    var C = window.bosCloud, fn = action === "accept" ? C.netAcceptSkillEpisode : action === "decline" ? C.netDeclineSkillEpisode : action === "cancel" ? C.netCancelSkillEpisode : action === "provider_done" ? C.netMarkSkillProviderDone : C.netMarkSkillRecipientDone;
    var r = null; try { if (fn) r = await fn(row.id); } catch (e) {}
    if (r && r.ok) refresh();
  };
  var list = tab === "incoming" ? incoming : outgoing;
  var statusText = function (st) { return st === "requested" ? "Ждёт ответа" : st === "accepted" ? "Принят · можно согласовать детали" : (st === "done" || st === "completed") ? "Состоялось · подтверждено обоими" : st === "declined" ? "Отклонён" : st === "cancelled" ? "Отменён" : st; };
  var tabButton = function (key, label) { var on = tab === key; return <button onClick={function () { setTab(key); }} className="tap hit44" style={{ flex: 1, minHeight: 40, border: 0, borderRadius: 12, background: on ? "var(--card)" : "transparent", color: on ? "var(--text)" : "var(--text-4)", boxShadow: on ? "var(--card-shadow)" : "none", fontSize: 12.5, fontWeight: 750 }}>{label}</button>; };
  return <React.Fragment>
    <div style={{ background: "var(--card)", borderRadius: 22, padding: 15, boxShadow: "var(--card-shadow)" }}>
      <div style={{ fontSize: 18, fontWeight: 800 }}>Запрос — не мгновенная бронь</div>
      <div style={{ fontSize: 12.5, color: "var(--text-4)", lineHeight: 1.45, marginTop: 5 }}>Сначала человек принимает задачу. Потом вы согласуете детали, делаете дело и оба подтверждаете завершение.</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 5, marginTop: 13 }}>{[["1","Запрос"],["2","Принят"],["3","Дело"],["4","Оба подтвердили"]].map(function (x, i) { return <div key={x[0]} style={{ textAlign: "center" }}><div style={{ width: 25, height: 25, borderRadius: "50%", margin: "0 auto", display: "grid", placeItems: "center", background: i === 0 ? "#FEDE34" : "var(--surface-3)", fontSize: 10.5, fontWeight: 850 }}>{x[0]}</div><div style={{ fontSize: 9.3, color: "var(--text-4)", lineHeight: 1.2, marginTop: 5 }}>{x[1]}</div></div>; })}</div>
    </div>
    <div style={{ display: "flex", gap: 4, background: "var(--surface-3)", borderRadius: 15, padding: 4 }}>{tabButton("incoming", "Ко мне")}{tabButton("outgoing", "От меня")}</div>
    {loadError ? <div style={{ borderRadius: 14, background: "rgba(255,59,48,0.08)", color: "#B64A42", padding: "10px 12px", fontSize: 11.5 }}>Запросы не загрузились. Здесь не показываем выдуманные состояния.</div> : null}
    {list === null ? <div style={{ padding: 16, color: "var(--text-4)" }}>Загружаем запросы…</div> : list.length ? <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>{list.map(function (row) {
      var o = row.network_offers || row.offer || {}, st = row.status || "requested", provider = tab === "incoming", p = row.other_profile;
      var myDone = provider ? !!row.provider_done_at : !!row.recipient_done_at;
      return <div key={row.id} style={{ background: "var(--card)", borderRadius: 20, padding: 14, boxShadow: "var(--card-shadow)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {p ? <BosAvatar avatar={p.avatar || "default"} size={38} /> : <span style={{ width: 38, height: 38, borderRadius: 12, background: "var(--surface-3)", display: "grid", placeItems: "center" }}><BosHelpOfferIconLive offer={o} size={17} /></span>}
          <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 750 }}>{p && p.name ? (p.name + " · ") : ""}{bosHelpOfferTitleText(o)}</div><div style={{ fontSize: 10.8, color: "var(--text-4)", marginTop: 2 }}>{statusText(st)}</div></div>
        </div>
        {row.request_note ? <div style={{ marginTop: 9, borderRadius: 13, background: "var(--surface-3)", padding: 9, fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.4 }}>{row.request_note}</div> : null}
        <div style={{ display: "flex", gap: 7, marginTop: 10, flexWrap: "wrap" }}>
          {provider && st === "requested" ? <React.Fragment><button onClick={function () { mutate(row,"accept"); }} className="tap hit44" style={{ flex: 1, minHeight: 41, border: 0, borderRadius: 13, background: "#0a0a0a", color: "#fff", fontSize: 12, fontWeight: 800 }}>Принять</button><button onClick={function () { mutate(row,"decline"); }} className="tap hit44" style={{ minHeight: 41, border: 0, borderRadius: 13, background: "var(--surface-3)", color: "var(--text-3)", padding: "8px 12px", fontSize: 12, fontWeight: 750 }}>Отказать</button></React.Fragment> : null}
          {!provider && st === "requested" ? <button onClick={function () { mutate(row,"cancel"); }} className="tap hit44" style={{ flex: 1, minHeight: 41, border: 0, borderRadius: 13, background: "var(--surface-3)", color: "var(--text-3)", fontSize: 12, fontWeight: 750 }}>Отменить запрос</button> : null}
          {st === "accepted" ? <React.Fragment><button onClick={function () { sheet.open(<NetworkEpisodeContactSheetLive episode={row} />); }} className="tap hit44" style={{ minHeight: 41, border: 0, borderRadius: 13, background: "var(--surface-3)", color: "var(--text-2)", padding: "8px 12px", fontSize: 12, fontWeight: 800 }}>Связаться</button><button disabled={myDone} onClick={function () { mutate(row, provider ? "provider_done" : "recipient_done"); }} className="tap hit44" style={{ flex: 1, minHeight: 41, border: 0, borderRadius: 13, background: myDone ? "var(--surface-3)" : "linear-gradient(135deg,#FEDE34,#EF9F14)", color: myDone ? "var(--text-4)" : "#0a0a0a", fontSize: 12, fontWeight: 850 }}>{myDone ? "Ждём подтверждения второй стороны" : "С моей стороны состоялось"}</button></React.Fragment> : null}
        </div>
      </div>;
    })}</div> : <div style={{ background: "var(--card)", borderRadius: 21, padding: "19px 16px", boxShadow: "var(--card-shadow)", textAlign: "center" }}><I.MessageCircle size={24} color="var(--text-4)" /><div style={{ fontSize: 15, fontWeight: 750, marginTop: 8 }}>{tab === "incoming" ? "К тебе пока не обращались" : "Ты пока ничего не запросил"}</div><div style={{ fontSize: 12, color: "var(--text-4)", lineHeight: 1.43, marginTop: 4 }}>{tab === "incoming" ? "Запросы появятся после публикации навыка или практики у своих." : "Найди человека по задаче и отправь короткий структурный запрос."}</div></div>}
  </React.Fragment>;
}

function NetworkEpisodeContactSheetLive({ episode }) {
  var s = (typeof useSheet === "function") ? useSheet() : { close: function () {} };
  var _c = React.useState(null), contact = _c[0], setContact = _c[1];
  var _e = React.useState(""), error = _e[0], setError = _e[1];
  React.useEffect(function () { var on = true, C = window.bosCloud; if (!(C && C.netSkillEpisodeContact)) { setError("Контакт пока недоступен."); return; } C.netSkillEpisodeContact(episode && episode.id).then(function (r) { if (!on) return; if (r && r.status === "ready" && r.contact) setContact(r.contact); else setError("Контакт откроется только после принятия запроса."); }).catch(function () { if (on) setError("Не удалось загрузить контакт."); }); return function () { on = false; }; }, [episode && episode.id]);
  var openTelegram = function () { var url = contact && contact.telegram_url; if (!url) return; try { if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.openTelegramLink) window.Telegram.WebApp.openTelegramLink(url); else window.location.href = url; } catch (e) {} };
  return <div className="bos-sheet-scroll" style={{ padding: "6px 16px 20px", color: "var(--text)", textAlign: "center" }}>{typeof SheetGreyBgLive === "function" && <SheetGreyBgLive />}
    <div style={{ width: 56, height: 56, borderRadius: "50%", margin: "10px auto 12px", background: "var(--surface-3)", display: "grid", placeItems: "center" }}>{contact ? <BosAvatar avatar={contact.avatar || "default"} size={52} /> : <I.MessageCircle size={23} color="var(--text-4)" />}</div>
    <div style={{ fontSize: 20, fontWeight: 800 }}>{contact ? (contact.first_name || "Участник") : "Согласовать детали"}</div>
    <div style={{ fontSize: 12.5, color: "var(--text-4)", lineHeight: 1.47, margin: "6px auto 15px", maxWidth: 300 }}>{error || "Запрос принят. Теперь можно договориться о времени и перейти к делу в личном чате Telegram."}</div>
    {contact && contact.telegram_url ? <button onClick={openTelegram} className="tap hit44" style={{ width: "100%", minHeight: 49, border: 0, borderRadius: 16, background: "#0a0a0a", color: "#fff", fontSize: 14.5, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}><I.Send size={17} /> Открыть Telegram</button> : <button onClick={s.close} className="tap hit44" style={{ width: "100%", minHeight: 48, border: 0, borderRadius: 16, background: "var(--surface-3)", color: "var(--text-2)", fontSize: 14, fontWeight: 800 }}>Закрыть</button>}
    <div style={{ fontSize: 10.5, color: "var(--text-5)", lineHeight: 1.4, marginTop: 10 }}>Контакт доступен только участникам принятого запроса и исчезает после взаимной блокировки.</div>
  </div>;
}

/* «Основатель» (само-прыжок на L10) УДАЛЁН (brief 2026-07-11, Слой 0): кнопка начисляла себе
   XP до 10 уровня и открывала публикацию «всем» — обход лестницы доверия. Бейдж 🏛 у уже
   забравших (bos:founder=1) остаётся — см. isFounder в NetworkLive. */

/* ShareAppSheet → live-only: the user's REAL referral circle + ?ref=<uid> invite link
   (no demo sample faces, no demo "истории/ещё" share targets). */
/* ── Unified share sheet (v595) ────────────────────────────────────────────────
   ODNA shtorka for the whole app: share the APP, a HABIT or a GOAL. Only the centre of
   the orbit, the words and the colour change — the rest is identical. Built from the REAL
   parts David asked for (no approximations): real Memoji (./assets/people/mN.png), the app's
   real ORBIT ring look (thin rgba(92,120,165) rings), SOLID matte fills (no "plasticine"
   gloss / no gradients-from-nowhere), the real theme (sheetColors), and the real native
   Telegram share (bosShare). ONE button «Поделиться», no copy-link (David). */
function ShareHeroLive({ kind, subject, dark, appCenter, heroVariant }) {
  const isApp = kind === "app";
  const col = (subject && subject.color) || "#0a0a0a";
  // Glass vocabulary lifted from the Вселенная: a frosted sheen + bright top rim on every face,
  // matte-glass threads that softly pulse. Real Memoji (./assets/people) — young, clean faces.
  const linkCore = dark ? "rgba(214,220,232,0.5)" : "rgba(120,130,152,0.5)";
  const linkShine = "rgba(255,255,255,0.7)";
  const sheen = dark
    ? "linear-gradient(150deg, rgba(255,255,255,0.22), rgba(255,255,255,0.05) 46%, rgba(255,255,255,0) 72%)"
    : "linear-gradient(150deg, rgba(255,255,255,0.55), rgba(255,255,255,0.12) 46%, rgba(255,255,255,0) 72%)";
  const rim = dark
    ? "inset 0 1px 0.5px rgba(255,255,255,0.28), inset 0 0 0 1px rgba(255,255,255,0.12)"
    : "inset 0 1.5px 1px rgba(255,255,255,0.92), inset 0 0 0 1px rgba(255,255,255,0.45)";
  const faceShadow = dark ? "0 8px 20px -4px rgba(0,0,0,0.6)" : "0 8px 20px -5px rgba(0,0,0,0.22)";
  const discBase = dark ? "#2a2d33" : "#e6e9ef";
  const discShadow = dark ? "0 16px 34px -14px rgba(0,0,0,0.6)" : "0 16px 34px -14px rgba(0,0,0,0.28)";
  const CX = 132, CY = 112;
  const P = (r, a) => [CX + r * Math.cos(a * Math.PI / 180), CY + r * Math.sin(a * Math.PI / 180)];

  // one glass-framed real Memoji (Вселенная-style frosted disc: image + sheen + bright rim)
  const glassFace = (m, sz, cx, cy, k) => (
    <div key={k} style={{ position: "absolute", left: cx - sz / 2, top: cy - sz / 2, width: sz, height: sz, borderRadius: "50%", background: discBase, boxShadow: faceShadow }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", backgroundImage: "url(./assets/people/" + m + ".png)", backgroundSize: "cover", backgroundPosition: "center" }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: sheen, boxShadow: rim }} />
    </div>
  );
  // glass thread layer (soft matte core + a pulse that breathes along it)
  const threads = (arr, h) => (
    <svg viewBox={"0 0 264 " + h} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
      <style>{"@keyframes bosLinkPulse{from{stroke-dashoffset:0.2}to{stroke-dashoffset:-1}}"}</style>
      {arr.map((l, i) => (
        <g key={"lk" + i}>
          <line x1={l[0]} y1={l[1]} x2={l[2]} y2={l[3]} stroke={linkCore} strokeWidth="1.4" strokeLinecap="round" />
          <line x1={l[0]} y1={l[1]} x2={l[2]} y2={l[3]} stroke={linkShine} strokeWidth="2.3" strokeLinecap="round" pathLength="1" strokeDasharray="0.2 1" style={{ animation: "bosLinkPulse 3.4s ease-in-out " + (0.2 + i * 0.16).toFixed(2) + "s infinite both" }} />
        </g>
      ))}
    </svg>
  );

  // ── Variant 2: HONEYCOMB of people — the Вселенная сота, just a few faces ────
  if (heroVariant === "honeycomb") {
    const H = 220, RH = 60, fS = 48;
    const ring = [0, 60, 120, 180, 240, 300].map((a) => P(RH, a));
    const FCS = ["m2", "m12", "m9", "m10", "m18", "m4"];
    const links = [];
    ring.forEach((p) => links.push([CX, CY, p[0], p[1]]));
    ring.forEach((p, i) => { const n = ring[(i + 1) % 6]; links.push([p[0], p[1], n[0], n[1]]); });
    return (
      <div style={{ position: "relative", width: 264, height: H, margin: "2px auto 0" }}>
        {threads(links, H)}
        {ring.map((p, i) => glassFace(FCS[i], fS, p[0], p[1], "r" + i))}
        {glassFace("m13", 54, CX, CY, "c")}
      </div>
    );
  }

  // ── GROW (default for app/habit/goal): a people-constellation that GROWS OUTWARD from the
  // centre. Centre → ring1 → ring2 → a faint far crowd; EVERY glass thread draws from its
  // parent (inner) toward the child (outer) so the whole thing radiates out. Ring stagger is
  // SCRAMBLED (jit), not by angle, so the shell blooms radially — no spiral sweep (David). After
  // drawing, threads keep the Вселенная BREATHING pulse. Centre = the SUBJECT: send-icon for the
  // app, the habit/goal image (colour + emoji) for habit/goal — never a random person.
  if (heroVariant === "grow" || heroVariant == null) {
    const H = 246, CYg = 120;
    const Pg = (r, a) => [CX + r * Math.cos(a * Math.PI / 180), CYg + r * Math.sin(a * Math.PI / 180)];
    const POOL = ["m2", "m12", "m9", "m10", "m18", "m4", "m3", "m7", "m16", "m13", "m6", "m1"];
    const nearest = (a, arr) => { let bi = 0, bd = 999; arr.forEach((ia, idx) => { const d = Math.abs(((a - ia + 180) % 360 + 360) % 360 - 180); if (d < bd) { bd = d; bi = idx; } }); return bi; };
    const jit = (n) => { const s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); }; // deterministic 0..1 (scrambles order → no spiral)
    const A1 = [-90, -30, 30, 90, 150, 210];
    const A2 = []; for (let j = 0; j < 10; j++) A2.push(j * 36 + 18);
    const A3 = []; for (let k = 0; k < 15; k++) A3.push(k * 24);
    const r1 = A1.map((a, i) => ({ m: POOL[i % POOL.length], sz: 30, c: Pg(46, a), op: 1, nd: 0.14 + 0.05 * jit(i + 1) }));
    const r2 = A2.map((a, j) => ({ m: POOL[(j + 3) % POOL.length], sz: 22, c: Pg(84, a), op: 1, nd: 0.40 + 0.14 * jit(j + 11) }));
    const r3 = A3.map((a, k) => ({ m: POOL[(k + 7) % POOL.length], sz: 15, c: Pg(114, a), op: 0.58, nd: 0.62 + 0.22 * jit(k + 40) }));
    const L = [];
    r1.forEach((n) => L.push({ p: [CX, CYg, n.c[0], n.c[1]], w: 1.3, o: 1, d: Math.max(0.02, n.nd - 0.12) }));
    r2.forEach((n, j) => { const pr = r1[nearest(A2[j], A1)]; L.push({ p: [pr.c[0], pr.c[1], n.c[0], n.c[1]], w: 1.1, o: 1, d: Math.max(0.1, n.nd - 0.12) }); });
    r3.forEach((n, k) => { const pr = r2[nearest(A3[k], A2)]; L.push({ p: [pr.c[0], pr.c[1], n.c[0], n.c[1]], w: 0.8, o: 0.45, d: Math.max(0.2, n.nd - 0.12) }); });
    const people = r1.concat(r2).concat(r3);
    const emo = (typeof bosDeSF === "function") ? bosDeSF(subject && subject.emoji) : (subject && subject.emoji);
    const cSz = 48;
    return (
      <div style={{ position: "relative", width: 264, height: H, margin: "2px auto 0", overflow: "visible" }}>
        <style>{"@keyframes shareZoom{from{transform:scale(1.5)}to{transform:scale(1)}}@keyframes sharePop{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:scale(1)}}@keyframes sharePopF{from{opacity:0;transform:scale(.4)}to{opacity:.58;transform:scale(1)}}@keyframes bosLinkDraw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}@keyframes bosLinkPulse{from{stroke-dashoffset:0.2}to{stroke-dashoffset:-1}}"}</style>
        <div style={{ position: "absolute", inset: 0, transformOrigin: "50% 50%", animation: "shareZoom 1.25s cubic-bezier(.2,.7,.2,1) both" }}>
          <svg viewBox={"0 0 264 " + H} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
            {L.map((l, i) => (
              <g key={i}>
                <line x1={l.p[0]} y1={l.p[1]} x2={l.p[2]} y2={l.p[3]} stroke={linkCore} strokeWidth={l.w} strokeOpacity={l.o} strokeLinecap="round" pathLength="1" strokeDasharray="1" style={{ animation: "bosLinkDraw 0.42s ease " + l.d.toFixed(2) + "s both" }} />
                <line x1={l.p[0]} y1={l.p[1]} x2={l.p[2]} y2={l.p[3]} stroke={linkShine} strokeWidth={(l.w + 1).toFixed(1)} strokeOpacity={l.o} strokeLinecap="round" pathLength="1" strokeDasharray="0.2 1" style={{ animation: "bosLinkPulse 3.4s ease-in-out " + (l.d + 0.6).toFixed(2) + "s infinite both" }} />
              </g>
            ))}
          </svg>
          {people.map((n, i) => (
            <div key={i} style={{ position: "absolute", left: n.c[0] - n.sz / 2, top: n.c[1] - n.sz / 2, width: n.sz, height: n.sz, borderRadius: "50%", boxShadow: faceShadow, animation: (n.op < 1 ? "sharePopF" : "sharePop") + " 0.46s cubic-bezier(.2,1.3,.4,1) " + n.nd.toFixed(2) + "s both" }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: discBase }} />
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", backgroundImage: "url(./assets/people/" + n.m + ".png)", backgroundSize: "cover", backgroundPosition: "center" }} />
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: sheen, boxShadow: rim }} />
            </div>
          ))}
          <div style={{ position: "absolute", left: CX - cSz / 2, top: CYg - cSz / 2, width: cSz, height: cSz, borderRadius: "50%", zIndex: 2, background: isApp ? (dark ? "#26262b" : "#0a0a0a") : col, display: "grid", placeItems: "center", boxShadow: (isApp && dark ? "inset 0 0 0 1px rgba(255,255,255,0.10), " : "") + discShadow, animation: "sharePop 0.46s cubic-bezier(.2,1.3,.4,1) 0s both" }}>
            {isApp ? <I.Send size={22} color="#fff" /> : <span style={{ fontSize: 26, lineHeight: 1 }}>{emo || "✨"}</span>}
          </div>
        </div>
      </div>
    );
  }

  // ── Variant 1: a small glass WEB — icon centre + 3 glass Memoji ──────────────
  // Asymmetric, varied sizes (one big / one small, like the reference); young clean faces.
  const H = 224;
  const nodes = [
    { m: "m13", sz: 66, o: 80, a: -36 },   // big, upper-right
    { m: "m2", sz: 50, o: 84, a: 152 },    // medium, lower-left
    { m: "m12", sz: 42, o: 94, a: 56 },    // small, lower-right (further orbit)
  ].map((n) => Object.assign({}, n, { c: P(n.o, n.a) }));
  const links = [];
  nodes.forEach((n) => links.push([CX, CY, n.c[0], n.c[1]]));
  links.push([nodes[0].c[0], nodes[0].c[1], nodes[1].c[0], nodes[1].c[1]]);
  links.push([nodes[1].c[0], nodes[1].c[1], nodes[2].c[0], nodes[2].c[1]]);
  links.push([nodes[2].c[0], nodes[2].c[1], nodes[0].c[0], nodes[0].c[1]]);
  let centre;
  if (isApp && appCenter === "name") {
    centre = (
      <div style={{ position: "absolute", left: CX - 42, top: CY - 42, width: 84, height: 84, borderRadius: 24, background: "#FEDE34", display: "grid", placeItems: "center", boxShadow: discShadow }}>
        <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.5px", color: "#0a0a0a" }}>balanceOS</div>
      </div>
    );
  } else if (isApp) {
    centre = (
      <div style={{ position: "absolute", left: CX - 42, top: CY - 42, width: 84, height: 84, borderRadius: "50%", background: dark ? "#26262b" : "#0a0a0a", boxShadow: (dark ? "inset 0 0 0 1px rgba(255,255,255,0.10), " : "") + discShadow, display: "grid", placeItems: "center" }}>
        <I.Send size={34} color="#fff" />
      </div>
    );
  } else {
    const emo = (typeof bosDeSF === "function") ? bosDeSF(subject && subject.emoji) : (subject && subject.emoji);
    centre = (
      <div style={{ position: "absolute", left: CX - 42, top: CY - 42, width: 84, height: 84, borderRadius: "50%", background: col, display: "grid", placeItems: "center", boxShadow: discShadow }}>
        <span style={{ fontSize: 40, lineHeight: 1 }}>{emo || "✨"}</span>
      </div>
    );
  }
  return (
    <div style={{ position: "relative", width: 264, height: H, margin: "2px auto 0" }}>
      {threads(links, H)}
      {centre}
      {nodes.map((n) => glassFace(n.m, n.sz, n.c[0], n.c[1], n.m))}
    </div>
  );
}

function ShareSheetLive({ kind = "app", subject, dark = false, appCenter, heroVariant }) {
  const isApp = kind === "app";
  const sheet = (typeof useSheet === "function") ? useSheet() : null;
  const close = (sheet && sheet.close) || function () {};
  const C = (typeof sheetColors === "function") ? sheetColors(dark)
    : (dark ? { text: "#fff", sub: "rgba(255,255,255,0.55)", btn: "#fff", btnFg: "#0a0a0a" } : { text: "#0a0a0a", sub: "rgba(0,0,0,0.5)", btn: "#0a0a0a", btnFg: "#fff" });
  const [shareUrl, setShareUrl] = React.useState((subject && subject.link) ? subject.link : ((typeof bosInviteLink === "function") ? bosInviteLink(null) : "https://t.me/BalanceOS8_bot"));
  React.useEffect(() => {
    if (!isApp) return;
    let on = true;
    if (window.bosCloud && window.bosCloud.uid) {
      (window.bosCloud.inviteCode ? window.bosCloud.inviteCode() : window.bosCloud.uid()).then((code) => { if (on && code) setShareUrl((typeof bosInviteLink === "function") ? bosInviteLink(code) : ("https://t.me/BalanceOS8_bot?ref=" + code)); }).catch(() => {});
    }
    return () => { on = false; };
  }, []);
  // habit/goal/team pass the referral link via subject.link — it resolves async, so flow it in.
  React.useEffect(() => { if (!isApp && subject && subject.link) setShareUrl(subject.link); }, [subject && subject.link]);
  const nm = (subject && subject.name) || "";
  const COPY = isApp
    ? { kick: "СДЕЛАЕМ ЭТО ВМЕСТЕ?", title: "Позовите близких", sub: "Вместе держать баланс проще · +150 XP за друга", text: "Держим баланс вместе — BalanceOS" }
    : kind === "goal"
      ? { kick: "К ЦЕЛИ ВМЕСТЕ", title: nm || "Ваша цель", sub: "Идите к цели не в одиночку", text: "Идём к цели вместе — «" + nm + "» в BalanceOS ✨" }
      : { kick: "ВМЕСТЕ ЛЕГЧЕ", title: nm || "Ваша привычка", sub: "Позови друга — держите привычку рядом", text: "Ведём привычку вместе — «" + nm + "» в BalanceOS ✨" };
  const doShare = () => {
    if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} }
    if (window.bosShare) { if (!window.bosShare(shareUrl, COPY.text)) { try { navigator.clipboard.writeText(shareUrl); } catch (e) {} } }
    else { try { navigator.clipboard.writeText(shareUrl); } catch (e) {} }
  };
  return (
    <div style={{ padding: "4px 20px 0", color: C.text }}>
      <ShareHeroLive kind={kind} subject={subject} dark={dark} appCenter={appCenter || "send"} heroVariant={heroVariant} />
      <div style={{ textAlign: "center", marginTop: 8 }}>
        <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "1.3px", textTransform: "uppercase", color: C.sub }}>{COPY.kick}</div>
        <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: "-0.5px", marginTop: 8 }}>{COPY.title}</div>
        <div style={{ fontSize: 14, color: C.sub, marginTop: 8, lineHeight: 1.45, maxWidth: 280, marginLeft: "auto", marginRight: "auto" }}>{COPY.sub}</div>
      </div>
      <button onClick={doShare} className="tap" style={{ width: "100%", marginTop: 20, border: 0, borderRadius: 16, padding: "16px", background: C.btn, color: C.btnFg, fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
        <I.Send size={19} /> Поделиться
      </button>
      <button onClick={close} className="tap" style={{ width: "100%", marginTop: 8, border: 0, background: "transparent", color: C.sub, fontSize: 14.5, fontWeight: 600, padding: "9px" }}>Закрыть</button>
      <div style={{ height: "max(6px, var(--tg-bottom-inset, 0px))" }} />
    </div>
  );
}

function ShareAppSheetLive({ dark = false }) {
  // Unified share sheet (v595): the animated «grow» people-constellation for the app invite
  // (core appears → camera pulls back → more people bloom & connect → settles static). The
  // real referral link + native Telegram share (bosShare → t.me/share picker) live inside
  // ShareSheetLive. Replaces the old blue-sphere + XP-card + link-box + two-buttons sheet.
  return <ShareSheetLive kind="app" dark={dark} />;
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
  // Свой uid берём СИНХРОННО (после авторизации cloud._uid уже известен) → фильтр «не я» верен с
  // ПЕРВОГО рендера, и свой аватар НЕ мелькает среди чужих (David: «на секунду появляется мой аватар,
  // лица дёргаются»). Фолбэк — async-догрузка, если авторизация ещё в полёте.
  var uidSt = React.useState(function () {
    if (_bosMyUidCache != null) return _bosMyUidCache;
    var u = (window.bosCloud && window.bosCloud.uidSync) ? window.bosCloud.uidSync() : null;
    if (u) _bosMyUidCache = u;
    return u != null ? u : null;
  });
  var myUid = uidSt[0], setMyUid = uidSt[1];
  React.useEffect(function () {
    if (myUid != null) return;
    if (window.bosCloud && window.bosCloud.enabled() && window.bosCloud.uid) {
      window.bosCloud.uid().then(function (u) { if (u) { _bosMyUidCache = u; setMyUid(u); } }).catch(function () {});
    }
  }, []);
  if (!teamId) return null;
  // Пока свой uid НЕ известен (редко — авторизация ещё в полёте) — лица НЕ показываем: иначе среди
  // чужих мелькнёт свой и потом отфильтруется (дёрганье). Дождёмся uid → покажем уже без себя.
  if (myUid == null) return null;
  var others = (members || []).filter(function (m) { return m.id !== myUid; });
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
    background: "linear-gradient(150deg, var(--disc-a, #eef1f6), var(--disc-b, #dadfe7))",
    boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.07)" };
  if (/^m\d+$/.test(a)) return <div style={Object.assign({}, disc, { background: "url(./assets/people/" + a + ".png) center/cover no-repeat, linear-gradient(150deg, var(--disc-a, #eef1f6), var(--disc-b, #dadfe7))", boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.10)" })} />;
  if (a.indexOf("emoji:") === 0) return <div style={Object.assign({}, disc, { display: "grid", placeItems: "center", fontSize: Math.round(size * 0.54), lineHeight: 1 })}>{a.slice(6)}</div>;
  // No custom avatar → the person's first initial on the SAME grey disc, so it's never a blank
  // circle (David: «густой серый кружочек неприкольно — пиши первый инициал ника»). A real avatar
  // always wins above; this is only the fallback. Muted slate ink, one letter — NOT colourful.
  var initial = ("" + (name || "")).trim().charAt(0).toUpperCase();
  if (!initial) return <div style={disc} />;
  return <div style={Object.assign({}, disc, { display: "grid", placeItems: "center", color: "var(--disc-ink, #5b6473)", fontWeight: 600, fontSize: Math.round(size * 0.44), letterSpacing: "-0.2px", lineHeight: 1, fontFamily: "-apple-system, system-ui, sans-serif" })}>{initial}</div>;
}

/* ── «ТАЙМЛАЙН» (David зовёт его так везде в приложении) — лента дня: кто во сколько отметился.
   Ось = тонкая полоса неба на ПОЛНЫЕ СУТКИ 4:00 → 28:00 (утро начинается в 4-5 утра; всё до
   4 утра — ещё ночь ПРОШЕДШЕГО дня и живёт справа, поэтому в полночь точка «сейчас» честно
   стоит в ночной зоне, а не прыгает в утро). Лица участников ложатся в час своей отметки
   (BuddyFaceLive — тот же атом, что везде); близкие отметки складываются в гроздь ×N; «сейчас» —
   тихая золотая точка (без мигания и без цифр); непрожитая часть дня под матовой вуалью; под
   осью — ТРИ заливные SVG-иконки строго на третях шкалы: утро (16.7%) · день (50%) · ночь (83.3%),
   зоны по 8 часов: утро 4-12, день 12-20, ночь 20-4. Свежая отметка крупнее и в золотом кольце.
   marks = [{id, name, avatar, me, ts:Date}] — по одному на человека (его первая отметка сегодня).
   rest = строка «почему сегодня тихо» (день отдыха по расписанию) → таймлайн дремлет. */
/* Надёжный разбор timestamptz из Supabase для «Таймлайна». Postgres отдаёт МИКРОсекунды
   («…T07:51:34.873423+00:00») — Safari/WebKit на такой дробной части может вернуть Invalid
   Date. Нормализуем: пробел→T, дробная часть до миллисекунд, без зоны = UTC (Supabase всегда UTC). */
function bosParseTs(s) {
  if (s instanceof Date) return s;
  var t = ("" + s).trim().replace(" ", "T").replace(/\.(\d{3})\d+/, ".$1");
  if (!/([zZ]|[+-]\d\d:?\d\d)$/.test(t)) t += "Z";
  var d = new Date(t);
  return isNaN(d.getTime()) ? new Date(s) : d;
}
/* ═══════════ ЕДИНАЯ КАРТОЧКА КРУГА — ОДНА НА ВСЁ ПРИЛОЖЕНИЕ ═══════════
   David 2026-07-15: «карточки не выглядят так, как мы договаривались на макете — а зачем мы
   тогда делали макет? И они должны выглядеть стандартизированно».
   Он прав дважды. Я приделал нить к СТАРОЙ карточке-баннеру вместо того, чтобы собрать
   карточку с макета, — отсюда и «не как договаривались», и разнобой (в кругах одно, на
   главной другое). Теперь это ОДИН компонент, и его рисуют ВСЕ места: главная, Привычки,
   Сообщество, свой круг и чужой. Отличается ровно одним: у чужого есть «Вступить».
   Анатомия — с утверждённого макета «Волна дня»:
     круглый диск эмблемы (центр орбит, BOS_ORB_SHEEN — не «похожий», а тот же)
     имя · «живёт N дней» с огоньком
     НИТЬ ДНЯ (лица при малом круге, волна при большом)
     чипы: обычно в HH:MM · N участ. · N сегодня в деле
     «Вступить» — только если я не внутри
   Данные разные, вид один: свой круг → teamTodayTimes (я участник, вижу ЛИЦА и часы);
   чужой открытый → bos_circle_pulse (только часы и числа, без имён — RLS). */
// Кэш живых данных карточки: клон (превью зажатия) и повторные заходы рисуются сразу.
// ПЕРЕЖИВАЕТ ПЕРЕЗАПУСК (David 2026-07-16: «захожу — ленты дня пустые, потом всё
// подгружается; можно, чтобы сразу?»): последний известный день лежит в localStorage и
// встаёт первым кадром, сеть освежает фоном. Кэш ЧУЖОГО дня не показываем — при первом
// входе в новые сутки нить честно пуста (день и правда ещё пуст), без «схлопывания» вчера.
/* УРОВЕНЬ КРУГА из XP (Э1, выбор David): пороги 75·L·(L−1) — L2=150, L3=450, L4=900,
   L5=1500, L10=6750… Кривая КРУЧЕ личной («круги должно быть качать сложнее, чем себя»). */
function bosCircleLevel(xp) {
  var x = Math.max(0, xp | 0);
  var L = Math.floor((1 + Math.sqrt(1 + 4 * x / 75)) / 2);
  if (L < 1) L = 1;
  var base = 75 * L * (L - 1);
  var next = 75 * (L + 1) * L;
  return { level: L, xp: x, cur: x - base, span: next - base, toNext: next - x, frac: Math.max(0, Math.min(1, (x - base) / (next - base))) };
}
/* ЗАЛЁТЫ КРУГА (David 2026-07-16: «три раза пропустил — вылетаешь автоматически, и это
   должно реально работать»). Залёт = СВОЙ запланированный день круга, прошедший целиком
   без единой отметки. Считаем ПОДРЯД, со вчера назад; любая отметка обнуляет счёт.
   Расписание — по локальным зеркалам привычек круга (маска Пн..Вс); зеркал нет → каждый
   день. Активность = локальные логи зеркал ∪ облачные дни (cloudDays — Set «YYYY-MM-DD»,
   ловит отметки прямо в комнате без зеркала). День знакомства с кругом и раньше не в счёт
   (bos:strikeseen) — новичка не судим за прошлое. Круг без привычек залётов не копит. */
function bosCircleStrikes(team, habits, cloudDays) {
  try {
    if (!team) return null;
    var tid = team.cloudId || team._id;
    if (!tid || typeof bosDayKeyOffset !== "function" || typeof bosTodayKey !== "function") return null;
    var mirrors = (habits || []).filter(function (h) {
      return h && h.teamHabitId && !h.shelved &&
        (h.teamId === tid || h.teamId === team._id ||
          (Array.isArray(team.habits) && team.habits.some(function (x) { return x && x.id === h.teamHabitId; })));
    });
    var hasCloud = !!(cloudDays && cloudDays.size);
    if (!mirrors.length && !(Array.isArray(team.habits) && team.habits.length) && !hasCloud) return null;
    var seenKey = "bos:strikeseen:" + tid, seen = null;
    try { seen = localStorage.getItem(seenKey); } catch (e) {}
    if (!seen) { seen = bosTodayKey(); try { localStorage.setItem(seenKey, seen); } catch (e) {} }
    var miss = 0;
    for (var j = 1; j <= 28; j++) {
      var k = bosDayKeyOffset(j);
      if (k <= seen) break;
      var done = !!(cloudDays && cloudDays.has && cloudDays.has(k));
      var due = mirrors.length === 0;
      for (var i = 0; i < mirrors.length && !done; i++) {
        var h = mirrors[i];
        if (h.log && h.log[k]) { done = true; break; }
        var mask = (typeof bosDaysMask === "function") ? bosDaysMask(h.days) : null;
        if (!mask || mask[bosDowOfKey(k)]) due = true;
      }
      if (done) break;
      if (due) miss++;
    }
    return { miss: miss, out: miss >= 3 };
  } catch (e) { return null; }
}
/* Батч XP кругов: карточки витрины рождаются пачкой — собираем id на один тик и едем
   ОДНИМ rpc bos_team_xp вместо N запросов. */
var _bosXPPending = null;
function bosTeamXPBatch(id) {
  return new Promise(function (resolve) {
    if (!(window.bosCloud && window.bosCloud.teamXP)) { resolve(null); return; }
    if (!_bosXPPending) {
      _bosXPPending = { ids: [], subs: [] };
      setTimeout(function () {
        var p = _bosXPPending; _bosXPPending = null;
        window.bosCloud.teamXP(p.ids).then(function (map) {
          p.subs.forEach(function (s) { s.resolve(map ? map[s.id] : null); });
        }).catch(function () { p.subs.forEach(function (s) { s.resolve(null); }); });
      }, 60);
    }
    if (_bosXPPending.ids.indexOf(id) < 0) _bosXPPending.ids.push(id);
    _bosXPPending.subs.push({ id: id, resolve: resolve });
  });
}
function _bosCardDay() { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
var _bosCircleCardCache = (function () {
  try {
    var v = JSON.parse(localStorage.getItem("bos:cache:cardpulse") || "null");
    if (v && v.day === _bosCardDay() && v.times && v.pulse) { if (!v.xp) v.xp = {}; return v; }
  } catch (e) {}
  return { day: _bosCardDay(), times: {}, pulse: {}, xp: {} };
})();
var _bosCircleCardSaveT = null;
function _bosCircleCardPersist() {
  if (_bosCircleCardSaveT) return;
  _bosCircleCardSaveT = setTimeout(function () {
    _bosCircleCardSaveT = null;
    _bosCircleCardCache.day = _bosCardDay();
    try { localStorage.setItem("bos:cache:cardpulse", JSON.stringify(_bosCircleCardCache)); } catch (e) {}
  }, 400);
}
function BosCircleCardLive({ t, joined, ctx = { mode: false }, onOpen, onJoin, busy, requested }) {
  const app = (typeof useApp === "function") ? useApp() : null;
  const isDark = !!(app && app.themeOverride === "dark");
  const ck = t.cloudId || t.id || null;
  // Число участников СЧИТАЕТСЯ ОДИНАКОВО у своих и чужих (David: «на одной карточке три
  // участника, на другой три сегодня в деле»): у своего t.members — массив и часто ПУСТ,
  // пока не доехал ростер → чип пропадал. Ростер из кэша — самый надёжный источник.
  const _rosterEarly = ((t.cloudId || t.id) && typeof _bosTeamGet === "function") ? _bosTeamGet("roster:" + (t.cloudId || t.id)) : null;
  const memberN = (Array.isArray(_rosterEarly) && _rosterEarly.length) ? _rosterEarly.length
    : (Array.isArray(t.members) ? t.members.length : (t.members || 0));
  const roster = (ck && typeof _bosTeamGet === "function") ? _bosTeamGet("roster:" + ck) : null;
  const people = (Array.isArray(roster) && roster.length) ? roster : (Array.isArray(t.members) ? t.members : []);

  // Свой круг → отметки читаются напрямую (я участник): знаю лица и часы.
  const [times, setTimes] = React.useState(() => (ck && _bosCircleCardCache.times[ck]) || null);
  React.useEffect(() => {
    if (!ck || !joined || !(window.bosCloud && window.bosCloud.enabled() && window.bosCloud.teamTodayTimes)) return;
    let on = true;
    window.bosCloud.teamTodayTimes(ck).then((r) => { if (on && r) { _bosCircleCardCache.times[ck] = r; _bosCircleCardPersist(); setTimes(r); } }).catch(() => {});
    return () => { on = false; };
  }, [ck, joined]);
  // Чужой открытый → анонимный серверный агрегат (иначе RLS молча вернёт 0 и живой круг
  // будет выглядеть мёртвым). Патч не прогнан → null → чипы «час пик»/«сегодня» просто нет.
  const [pulse, setPulse] = React.useState(() => (ck && _bosCircleCardCache.pulse[ck]) || null);
  React.useEffect(() => {
    // Пульс тянем И для своих (не только чужих): иначе у своего круга не было «обычно в
    // HH:MM» — тот самый разнобой чипов. Для приватных сервер вернёт null — чип просто не будет.
    if (!ck || !(window.bosCloud && window.bosCloud.enabled() && window.bosCloud.circlePulse)) return;
    let on = true;
    window.bosCloud.circlePulse(ck).then((p) => { if (on && p) { _bosCircleCardCache.pulse[ck] = p; _bosCircleCardPersist(); setPulse(p); } }).catch(() => {});
    return () => { on = false; };
  }, [ck, joined]);
  // Уровень круга (Э1) и на БОЛЬШОЙ карточке (Главная/Привычки) — David 2026-07-16: «не вижу
  // уровень на своих наружных карточках». Та же грамматика, что у компакт-миниатюры: кольцо
  // прогресса + золотая циферка на диске. «bos:teamxp» = отметка доехала → пересчёт сразу.
  const [cXP, setCXP] = React.useState(() => (ck && _bosCircleCardCache.xp && _bosCircleCardCache.xp[ck] != null) ? _bosCircleCardCache.xp[ck] : null);
  React.useEffect(() => {
    if (!ck || !(window.bosCloud && window.bosCloud.enabled() && window.bosCloud.teamXP)) return;
    let on = true;
    const load = () => bosTeamXPBatch(ck).then((v) => { if (on && v != null) { _bosCircleCardCache.xp[ck] = v; _bosCircleCardPersist(); setCXP(v); } });
    load();
    window.addEventListener("bos:teamxp", load);
    return () => { on = false; window.removeEventListener("bos:teamxp", load); };
  }, [ck]);
  const lvl = (cXP != null && typeof bosCircleLevel === "function") ? bosCircleLevel(cXP) : null;
  // Непрочитанные — только у своих (в чужой чат я не вижу).
  const [unread, setUnread] = React.useState(() => { const c = (ck && typeof bosTeamUnreadCacheGet === "function") ? bosTeamUnreadCacheGet(ck) : null; return c ? c.count : 0; });
  React.useEffect(() => {
    if (!ck || !joined || ctx.mode || typeof bosTeamUnreadPeek !== "function") return;
    let on = true;
    bosTeamUnreadPeek(ck).then((r) => { if (on && r) setUnread(r.count || 0); }).catch(() => {});
    return () => { on = false; };
  }, [ck, joined, ctx.mode]);

  const faces = React.useMemo(() => {
    const map = (times && times.times) || null;
    if (!map) return [];
    return people.filter((m) => m && m.id != null && map[m.id]).map((m) => {
      const d = new Date(map[m.id]);
      return { avatar: m.avatar, name: m.name, hr: d.getHours() + d.getMinutes() / 60 };
    }).filter((f) => !isNaN(f.hr));
  }, [times, people]);
  const hours = React.useMemo(() => ((pulse && pulse.mins) || []).map((m) => bosUtcMinToHour(m)), [pulse]);
  const days = (typeof bosCircleDays === "function") ? bosCircleDays(t.createdAt || (times && times.createdAt)) : null;
  const peak = (pulse && typeof bosPeakLabel === "function") ? bosPeakLabel(pulse.peak) : null;
  const todayN = Math.max(pulse ? (pulse.todayN || 0) : 0, faces.length) || null;
  const disc = {
    background: (typeof BOS_ORB_SHEEN !== "undefined" ? BOS_ORB_SHEEN + ", " : "") + (isDark ? "linear-gradient(160deg,#464c58,#30353f)" : "linear-gradient(160deg, var(--disc-a,#eef1f6), var(--disc-b,#dadfe7))"),
    boxShadow: (typeof bosOrbGlass === "function" ? bosOrbGlass(isDark) : "none"),
  };
  const chip = (node, gold, key) => (
    <span key={key} style={Object.assign({ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: gold ? 700 : 600, borderRadius: 999, padding: "3px 9px", whiteSpace: "nowrap" },
      gold ? { color: "#B4820A", background: "rgba(240,195,10,0.14)" } : Object.assign({ color: "var(--text-2)" }, (typeof bosChipGlass === "function" ? bosChipGlass(isDark) : {})))}>{node}</span>
  );
  return (
    <div className={ctx.mode ? "" : "tap"} onClick={ctx.mode ? undefined : onOpen}
      style={{ position: "relative", background: "var(--card)", borderRadius: 22, padding: "13px 14px", boxShadow: "var(--card-shadow, 0 1px 2px rgba(0,0,0,0.05))",
        pointerEvents: ctx.mode ? "none" : "auto", overflow: "hidden", cursor: ctx.mode ? "default" : "pointer", textAlign: "left" }}>
      {joined && (
        // Значок чата ВСЕГДА на месте (David: «иконка чата должна быть видна всегда — просто
        // видим, появились непрочитанные или нет»). Пустой — тихая стеклянная иконка «чат
        // тут есть»; с непрочитанными — в ней число и полная плотность.
        <span aria-label={unread > 0 ? "новых сообщений: " + unread : "чат круга"} style={Object.assign({ position: "absolute", top: 12, right: 12, zIndex: 3, display: "inline-flex", alignItems: "center", gap: 4, height: 22, padding: unread > 0 ? "0 8px" : "0 6px", borderRadius: 999, fontSize: 11, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: isDark ? "#fff" : "#0a0a0a", opacity: unread > 0 ? 1 : 0.6, pointerEvents: "none" }, (typeof bosGlassChrome === "function" ? bosGlassChrome(isDark) : {}))}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 3.2c5.3 0 9.6 3.4 9.6 7.6s-4.3 7.6-9.6 7.6c-.9 0-1.8-.1-2.6-.3l-4.6 2.3a.55.55 0 0 1-.79-.64l1-3.4C3.1 14.9 2.4 13.1 2.4 10.8 2.4 6.6 6.7 3.2 12 3.2z" /></svg>
          {unread > 0 ? (unread > 99 ? "99+" : unread) : null}
        </span>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {lvl ? (
          <span style={{ position: "relative", width: 46, height: 46, flexShrink: 0 }}>
            <svg viewBox="0 0 36 36" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
              <circle cx="18" cy="18" r="16" fill="none" stroke={isDark ? "rgba(255,255,255,0.13)" : "rgba(10,10,10,0.08)"} strokeWidth="2.6" />
              <circle cx="18" cy="18" r="16" fill="none" stroke={BOS_THREAD_GOLD} strokeWidth="2.6" strokeLinecap="round" strokeDasharray="100.5" strokeDashoffset={(100.5 * (1 - lvl.frac)).toFixed(1)} />
            </svg>
            <span style={Object.assign({ position: "absolute", inset: 4, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 18 }, disc)}>
              {typeof bosIcon === "function" ? bosIcon(t.emblem || "👥", 19, null) : (t.emblem || "👥")}
            </span>
            <span style={{ position: "absolute", right: -4, bottom: -2, minWidth: 16, height: 16, padding: "0 4px", borderRadius: 999, background: isDark ? "#26262b" : "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.22)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#B4820A", lineHeight: 1, zIndex: 2 }}>{lvl.level}</span>
          </span>
        ) : (
        <span style={Object.assign({ width: 42, height: 42, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 21, flexShrink: 0 }, disc)}>
          {typeof bosIcon === "function" ? bosIcon(t.emblem || "👥", 22, null) : (t.emblem || "👥")}
        </span>
        )}
        <div style={{ flex: 1, minWidth: 0, paddingRight: unread > 0 ? 40 : 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
          <div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 1, display: "flex", alignItems: "center", gap: 4 }}>
            {days ? <I.Flame size={11} color="#EF9F14" filled strokeWidth={1.6} /> : null}
            {days ? ("живёт " + days + " " + (typeof bosRuDays === "function" ? bosRuDays(days) : "дн.")) : "Вместе"}
          </div>
        </div>
      </div>
      {/* Нить рисуется ВСЕГДА для облачного круга — слот занят с первого кадра, поэтому карточка
          не подпрыгивает, когда прилетят данные (David). Локальный круг без облака — без нити. */}
      {ck && typeof BosDayThreadLive === "function" && (
        // У СВОЕГО круга нить рисуется ТОЛЬКО из лиц: анонимные часы пульса сюда не идут —
        // иначе пульс (кэш, приходит первым) рисовал ВОЛНУ, а через миг times привозил ЛИЦА,
        // и карточка перещёлкивалась на глазах (David: «очень странно»). Чужой круг лиц не
        // знает (RLS) — ему волна из пульса и положена.
        <div style={{ marginTop: 11 }}><BosDayThreadLive faces={faces} hours={joined ? [] : hours} isDark={isDark} /></div>
      )}
      <div style={{ marginTop: 9, display: "flex", flexWrap: "wrap", gap: 5 }}>
        {peak ? chip(<><I.Clock size={11} color="#EF9F14" strokeWidth={2} />обычно в {peak}</>, true, "p") : null}
        {memberN ? chip(<><I.Users size={11} strokeWidth={2} />{memberN} участ.</>, false, "m") : null}
        {todayN ? chip(<>{todayN} сегодня в деле</>, false, "n") : null}
      </div>
      {!joined && (
        <button onClick={(e) => { e.stopPropagation(); onJoin && onJoin(t); }} disabled={busy || requested} className="tap" data-haptic="selection"
          style={{ marginTop: 10, width: "100%", border: 0, borderRadius: 999, padding: "10px 0", fontSize: 13.5, fontWeight: 700, cursor: "pointer",
            background: (busy || requested) ? "var(--surface-3)" : "var(--cta, #0a0a0a)", color: (busy || requested) ? "var(--text-3)" : "var(--cta-ink, #fff)" }}>
          {requested ? "Заявка отправлена" : busy ? "…" : "Вступить"}
        </button>
      )}
    </div>
  );
}
/* ═══ НИТЬ ДНЯ — ОДИН компонент на всё (David 2026-07-15, выбран вариант «Волна дня»).
   Его смысл — убрать РАЗНОБОЙ: внутри круга орбиты, снаружи циферблат, в привычках третья нить.
   Тут одна нить, и она МЕНЯЕТ ФОРМУ ОТ ДАННЫХ, а не от места:
     • мало отметок  → лица сидят ПРЯМО НА линии в свой час (видно КТО);
     • много         → золотая волна плотности (видно РИТМ толпы: «в 7 утра прошла волна»).
   Это ответ на вопрос David «а если в круге 100-200 человек?»: портреты не масштабируются —
   при 120 участниках лица превращаются в кашу, сколько их ни склеивай в стопки. Волна честнее.
   Палитра строго наша (золото + серое + белое): у старой SkyThreadLive полоса залита радугой
   рассвет→закат→ночь — оранжевые и коричневые тона, из-за них она и читалась «не нашей».
   Шкала 4:00→28:00 — та же, что у SkyThreadLive (ночь уезжает в правый хвост), чтобы у двух
   ниток не разъехалось время, пока они живут рядом. */
var BOS_THREAD_GOLD = "#EF9F14", BOS_THREAD_GOLD_L = "#FEDE34";
function bosThreadPct(hr) { if (hr < 4) hr += 24; return Math.max(1.5, Math.min(98.5, ((hr - 4) / 24) * 100)); }
/* Минуты приходят с сервера в UTC (bos_circle_pulse) — сдвигаем в часовой пояс смотрящего.
   getTimezoneOffset() = UTC минус локаль, поэтому локальное время = min - offset. */
function bosUtcMinToHour(min) {
  var off = new Date().getTimezoneOffset();
  var m = ((min - off) % 1440 + 1440) % 1440;
  return m / 60;
}
/* Волна: считаем отметки по получасам, сглаживаем окном ±2 и рисуем область.
   Сглаживание обязательно — сырые столбики на 48 корзинах читаются забором, а не волной. */
function bosThreadWave(hours, W, H) {
  var B = 48, bins = [], i;
  for (i = 0; i < B; i++) bins.push(0);
  (hours || []).forEach(function (h) {
    var x = h < 4 ? h + 24 : h;
    var k = Math.floor(((x - 4) / 24) * B);
    if (k >= 0 && k < B) bins[k]++;
  });
  var sm = bins.map(function (_, idx) {
    var sum = 0, w = 0;
    for (var d = -2; d <= 2; d++) {
      var j = idx + d; if (j < 0 || j >= B) continue;
      var k = 3 - Math.abs(d); sum += bins[j] * k; w += k;
    }
    return w ? sum / w : 0;
  });
  var mx = Math.max.apply(null, sm) || 1;
  var pts = sm.map(function (v, idx) { return [(idx / (B - 1)) * W, H - (v / mx) * H]; });
  var d = "M0 " + H;
  pts.forEach(function (pt, idx) {
    if (idx === 0) { d += " L" + pt[0].toFixed(1) + " " + pt[1].toFixed(1); return; }
    var q = pts[idx - 1], cx = (q[0] + pt[0]) / 2;
    d += " C" + cx.toFixed(1) + " " + q[1].toFixed(1) + " " + cx.toFixed(1) + " " + pt[1].toFixed(1) + " " + pt[0].toFixed(1) + " " + pt[1].toFixed(1);
  });
  return d + " L" + W + " " + H + " Z";
}
/* Глифы суток — те же рассвет/солнце/луна, что в SkyThreadLive (David: «иконки красивее подписей»). */
function BosThreadGlyph({ kind, left, dark }) {
  var col = dark ? "rgba(255,255,255,0.38)" : "#a8adb8";
  var d = kind === "dawn"
    ? [<path key="a" d="M8 5.5a3.2 3.2 0 0 1 3.2 3.2H4.8A3.2 3.2 0 0 1 8 5.5z" />, <rect key="b" x="1.5" y="9.6" width="13" height="1.4" rx="0.7" />, <path key="c" d="M7.3 1.2h1.4v2.2H7.3zM2.9 3.3l1-1 1.4 1.4-1 1zM12.1 2.3l1 1-1.4 1.4-1-1z" />]
    : kind === "sun"
      ? [<circle key="a" cx="8" cy="8" r="3.1" />, <path key="b" d="M7.3 0.8h1.4v2.4H7.3zM7.3 12.8h1.4v2.4H7.3zM0.8 7.3h2.4v1.4H0.8zM12.8 7.3h2.4v1.4h-2.4zM2.5 3.5l1-1 1.7 1.7-1 1zM10.8 11.8l1-1 1.7 1.7-1 1zM13.5 2.5l1 1-1.7 1.7-1-1zM3.2 10.8l1 1-1.7 1.7-1-1z" />]
      : [<path key="a" d="M13.6 9.8A6 6 0 1 1 6.2 2.4a4.8 4.8 0 0 0 7.4 7.4z" />];
  return (
    <span aria-hidden style={{ position: "absolute", top: 0, left: left + "%", transform: "translateX(-50%)", lineHeight: 0 }}>
      <svg width="13" height="13" viewBox="0 0 16 16" style={{ fill: col }}>{d}</svg>
    </span>
  );
}
/* faces — [{avatar,name,hr}] ИМЕНА (только свой круг: чужие отметки закрыты RLS).
   hours — [часы] БЕЗ имён (чужой открытый круг, из bos_circle_pulse). Одно из двух. */
function BosDayThreadLive({ faces = [], hours = [], isDark = false }) {
  var fs = (faces || []).filter(Boolean).slice().sort(function (a, b) { return a.hr - b.hr; });
  var hrs = fs.length ? fs.map(function (f) { return f.hr; }) : (hours || []);
  var many = hrs.length > 6 || !fs.length;
  // ВЫСОТА НЕ ЗАВИСИТ ОТ ДАННЫХ (David 2026-07-15: «нить подгружается со временем, потом
  // появляется и карточка увеличивается — это бредово»). Дорожка, глифы и точка «сейчас»
  // рисуются СРАЗУ, ещё до ответа сети; лица и волна втекают в готовый слот. Пустая нить —
  // не шум: она честно говорит «день идёт, сегодня пока никто».
  var nowHr = (function () { var d = new Date(); return d.getHours() + d.getMinutes() / 60; })();
  var nowPct = bosThreadPct(nowHr);
  var track = isDark ? "rgba(255,255,255,0.13)" : "rgba(10,10,10,0.10)";
  var ringCol = isDark ? "#1c1c20" : "#fff";
  var LINE = 34;   // y центра линии внутри бокса — лица садятся РОВНО на неё
  return (
    <div>
      <div style={{ position: "relative", height: 44 }}>
        {many && hrs.length > 0 && (
          <svg viewBox={"0 0 330 30"} preserveAspectRatio="none" style={{ position: "absolute", left: 0, right: 0, top: 4, width: "100%", height: 30 }}>
            <defs>
              <linearGradient id="bosThreadWaveG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={BOS_THREAD_GOLD_L} stopOpacity="0.85" />
                <stop offset="100%" stopColor={BOS_THREAD_GOLD} stopOpacity="0.10" />
              </linearGradient>
            </defs>
            <path d={bosThreadWave(hrs, 330, 30)} fill="url(#bosThreadWaveG)" />
          </svg>
        )}
        <div style={{ position: "absolute", left: 0, right: 0, top: LINE, height: 2, borderRadius: 2, background: track }} />
        <div style={{ position: "absolute", left: 0, top: LINE, height: 2, width: nowPct + "%", borderRadius: 2, background: "linear-gradient(90deg," + BOS_THREAD_GOLD_L + "," + BOS_THREAD_GOLD + ")" }} />
        {/* Лица сидят ПО ЦЕНТРУ линии (David: «иконки должны стоять на линии самой, а не над ней» —
            в макете они висели чуть выше, ровно то, за что он ругал прошлый вариант). */}
        {/* Точка «сейчас» — ПОД лицами (zIndex 2 < 3): только что отметился — твоя ава сверху,
            а не жёлтый кружок поверх лица (David 2026-07-16: «ава всегда должна ставиться поверх»). */}
        <span aria-hidden style={{ position: "absolute", left: nowPct + "%", top: LINE + 1, transform: "translate(-50%, -50%)", zIndex: 2, width: 11, height: 11, borderRadius: "50%", background: BOS_THREAD_GOLD, boxShadow: "0 0 0 2.5px " + ringCol + ", 0 0 7px rgba(239,159,20,0.5)" }} />
        {!many && fs.map(function (f, i) {
          return (
            <span key={i} style={{ position: "absolute", left: bosThreadPct(f.hr) + "%", top: LINE + 1, transform: "translate(-50%, -50%)", zIndex: 3, borderRadius: "50%", lineHeight: 0, boxShadow: "0 0 0 2.5px " + ringCol + ", 0 1px 4px rgba(0,0,0,0.18)" }}>
              {typeof BuddyFaceLive === "function" ? <BuddyFaceLive avatar={f.avatar} name={f.name} size={26} /> : null}
            </span>
          );
        })}
      </div>
      <div style={{ position: "relative", height: 13, marginTop: 4 }}>
        <BosThreadGlyph kind="dawn" left={12} dark={isDark} />
        <BosThreadGlyph kind="sun" left={50} dark={isDark} />
        <BosThreadGlyph kind="moon" left={88} dark={isDark} />
      </div>
    </div>
  );
}
/* «обычно в 07:00» — час пик круга. Минута приходит с сервера в UTC за 30 дней. */
function bosPeakLabel(peakMin) {
  if (peakMin == null) return null;
  var h = bosUtcMinToHour(peakMin);
  var hh = Math.floor(h), mm = Math.round((h - hh) * 60 / 15) * 15;
  if (mm === 60) { hh = (hh + 1) % 24; mm = 0; }
  return (hh < 10 ? "0" : "") + hh + ":" + (mm < 10 ? "0" : "") + mm;
}
function SkyThreadLive({ marks = [], total = 0, doneCount = null, chip = null, isDark = false, rest = null, title = "Сегодня" }) {
  var pctOf = function (d) {
    var hr = d.getHours() + d.getMinutes() / 60;
    if (hr < 4) hr += 24; // 0:00–3:59 = хвост ночи, правый край шкалы
    return Math.max(1.5, Math.min(98.5, ((hr - 4) / 24) * 100));
  };
  var nowPct = pctOf(new Date());
  var ms = (marks || []).filter(function (m) { return m && m.ts; }).slice().sort(function (a, b) { return a.ts - b.ts; });
  // Гроздья: лица ближе ~7% оси друг к другу складываются в стопку ×N — никаких наездов.
  var groups = [];
  for (var i = 0; i < ms.length; i++) {
    var p = pctOf(ms[i].ts), g = groups.length ? groups[groups.length - 1] : null;
    if (g && p - g.pct < 7) { g.items.push(ms[i]); g.pct = g.pct + (p - g.pct) / g.items.length; }
    else groups.push({ pct: p, items: [ms[i]] });
  }
  var glCol = isDark ? "rgba(255,255,255,0.38)" : "#a8adb8";
  // ТРИ иконки суток — симметрично, на третях шкалы (центры 8-часовых зон): утро · день · ночь.
  var Glyph = function (kind, left) {
    var d = kind === "dawn"
      ? [<path key="a" d="M8 5.5a3.2 3.2 0 0 1 3.2 3.2H4.8A3.2 3.2 0 0 1 8 5.5z" />, <rect key="b" x="1.5" y="9.6" width="13" height="1.4" rx="0.7" />, <path key="c" d="M7.3 1.2h1.4v2.2H7.3zM2.9 3.3l1-1 1.4 1.4-1 1zM12.1 2.3l1 1-1.4 1.4-1-1z" />]
      : kind === "sun"
        ? [<circle key="a" cx="8" cy="8" r="3.1" />, <path key="b" d="M7.3 0.8h1.4v2.4H7.3zM7.3 12.8h1.4v2.4H7.3zM0.8 7.3h2.4v1.4H0.8zM12.8 7.3h2.4v1.4h-2.4zM2.5 3.5l1-1 1.7 1.7-1 1zM10.8 11.8l1-1 1.7 1.7-1 1zM13.5 2.5l1 1-1.7 1.7-1-1zM3.2 10.8l1 1-1.7 1.7-1-1z" />]
        : [<path key="a" d="M13.6 9.8A6 6 0 1 1 6.2 2.4a4.8 4.8 0 0 0 7.4 7.4z" />];
    return (
      <span key={kind} aria-hidden style={{ position: "absolute", top: 47, left: left + "%", transform: "translateX(-50%)", lineHeight: 0 }}>
        <svg width="15" height="15" viewBox="0 0 16 16" style={{ fill: glCol }}>{d}</svg>
      </span>
    );
  };
  // Все лица в ЕДИНОЙ белой обводке — без золотого кольца у свежего (David: «не надо выделять»).
  // Свежий проклик (m.fresh) прилетает на шкалу с пружинным «pop» + короткая золотая волна вокруг.
  var face = function (m, size, fresh) {
    return (
      <span style={{ position: "relative", display: "inline-block", borderRadius: "50%", border: "2.5px solid " + (isDark ? "#2c2f36" : "#fff"), boxShadow: "0 2px 7px rgba(0,0,0,0.2)", lineHeight: 0, background: isDark ? "#2c2f36" : "#fff", animation: fresh ? "bosSkyPop 0.6s cubic-bezier(0.34,1.56,0.64,1) both" : "none" }}>
        <BuddyFaceLive avatar={m.avatar} name={m.name} size={size} />
        {fresh && <span aria-hidden style={{ position: "absolute", inset: -3, borderRadius: "50%", border: "2px solid rgba(254,222,52,0.9)", animation: "bosSkyRipple 0.7s ease-out 0.08s both", pointerEvents: "none" }} />}
      </span>
    );
  };
  // Градиент совпадает со шкалой 4→28ч, течёт равномерно и НАСЫЩЕННО (David: «бледные цвета»):
  // плотный рассвет → тёплое золото дня → янтарный закат → глубокие сумерки → тёмная ночь.
  var strip = {
    position: "absolute", left: 2, right: 2, top: 26, height: 13, borderRadius: 999,
    background: "linear-gradient(90deg, #ffc873 0%, #ffe3a1 16%, #ffedb8 33%, #ffe29a 50%, #ffb45e 58%, #e88a4a 66%, #b06a4a 73%, #5c3d3e 82%, #241c22 92%, #0a0a0a 100%)",
    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.16)",
  };
  var doneN = doneCount != null ? doneCount : ms.length;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15.5, fontWeight: 700, letterSpacing: "-0.3px", color: "var(--text)" }}>{rest ? "Сегодня — отдых" : title}</div>
          <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2, lineHeight: 1.4 }}>{rest || (doneN + " из " + total + " уже в деле")}</div>
        </div>
        {chip}
      </div>
      <div style={{ position: "relative", height: rest ? 52 : 64, marginTop: 8, filter: rest ? "grayscale(0.55) opacity(0.6)" : "none" }}>
        <div style={strip} />
        {/* Вуаль на будущем: прожитая часть дня яркая, непрожитая — под матовой дымкой. */}
        {!rest && <div style={{ position: "absolute", top: 25, height: 15, left: nowPct + "%", right: 1, borderRadius: "0 999px 999px 0", background: isDark ? "rgba(12,14,18,0.4)" : "rgba(255,255,255,0.32)" }} />}
        {/* «Сейчас» — тихая золотая точка ПОД лицами (zIndex ниже), без мигания и цифр (David). */}
        <span aria-hidden style={{ position: "absolute", left: nowPct + "%", top: 24, width: 16, height: 16, borderRadius: "50%", transform: "translateX(-50%)", zIndex: 1, background: "radial-gradient(circle at 50% 40%, #FEDE34, #EF9F14)", border: "3px solid " + (isDark ? "#2c2f36" : "#fff"), boxShadow: "0 0 8px rgba(239,159,20,0.45)", opacity: rest ? 0.55 : 1 }} />
        {!rest && groups.map(function (g, gi) {
          var lastGroup = gi === groups.length - 1;
          if (g.items.length === 1) {
            var m = g.items[0], big = lastGroup, sz = big ? 30 : 23;
            return (
              <span key={gi} style={{ position: "absolute", left: g.pct + "%", top: big ? 15 : 19, transform: "translateX(-50%)", zIndex: m.fresh ? 3 : 2 }}>
                {face(m, sz, m.fresh)}
              </span>
            );
          }
          return (
            <span key={gi} style={{ position: "absolute", left: g.pct + "%", top: 19, transform: "translateX(-50%)", display: "flex", zIndex: 2 }}>
              <span style={{ position: "absolute", top: -15, left: "50%", transform: "translateX(-50%)", fontSize: 9.5, fontWeight: 800, color: "#7a5b00", background: "rgba(254,222,52,0.4)", borderRadius: 999, padding: "1.5px 7px", whiteSpace: "nowrap" }}>×{g.items.length}</span>
              {g.items.slice(0, 3).map(function (m, mi) {
                return <span key={mi} style={{ marginLeft: mi ? -10 : 0 }}>{face(m, 23, m.fresh)}</span>;
              })}
            </span>
          );
        })}
        {Glyph("dawn", 16.7)}
        {Glyph("sun", 50)}
        {Glyph("moon", 83.3)}
      </div>
    </div>
  );
}

function HabitInviteBannerLive({ amount = 150, habit }) {
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
          <div style={{ fontSize: 12.5, color: inkSub, marginTop: 3, lineHeight: 1.35 }}>когда друг придёт по твоей ссылке</div>
        </div>
      </div>
      <div style={{ position: "relative", marginTop: 13, paddingTop: 12, borderTop: "1px solid rgba(0,0,0,0.10)", fontSize: 12, color: inkSub, lineHeight: 1.4 }}>
        А вести привычку вместе — каждая отметка приносит <b style={{ color: ink }}>+15 XP</b> вместо +10.
      </div>
    </div>
  );
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
  try { return JSON.parse(localStorage.getItem("bos:notifseen:" + (uid || "local")) || "{}") || {}; } catch (e) { return {}; }
}
function bosNotifSeenSet(uid, patch) {
  try {
    const cur = bosNotifSeenGet(uid);
    localStorage.setItem("bos:notifseen:" + (uid || "local"), JSON.stringify(Object.assign(cur, patch)));
  } catch (e) {}
}
/* НАПОМИНАНИЯ ПРИВЫЧЕК (в приложении). Возвращает список привычек, у которых напоминание
   ВКЛ, сегодня активный день, время УЖЕ наступило, и они ЕЩЁ НЕ отмечены — их и показываем
   в шторке + точкой на колокольчике. Пуш в Телеграм (когда приложение закрыто) шлёт отдельная
   серверная функция; это — половина «в приложении», работает без деплоя. Синхронно и дёшево. */
function bosDueRemindersLive(habits) {
  var out = [];
  if (!Array.isArray(habits)) return out;
  var arch = (typeof bosLoadArchived === "function") ? bosLoadArchived() : {};
  var now = new Date();
  var dow = (now.getDay() + 6) % 7;                 // Пн=0 … Вс=6 (как везде в приложении)
  var nowMin = now.getHours() * 60 + now.getMinutes();
  habits.forEach(function (h) {
    if (!h || !h.reminder || !h.reminder.on) return;
    if (h.shelved || bosIsArch(arch, "h", h)) return;   // архив/полка — не напоминаем (v594: стабильный ключ)
    if (h.done) return;                                     // уже сделано сегодня
    if (Array.isArray(h.days) && h.days.length === 7 && !h.days[dow]) return; // не сегодня по расписанию
    var parts = ("" + (h.reminder.time || "09:00")).split(":");
    var tMin = (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
    if (nowMin < tMin) return;                              // время ещё не наступило
    out.push({ habit: h, time: h.reminder.time || "09:00" });
  });
  return out;
}
/* Полный сбор для шторки. Возвращает { requests, joined, invited, accepted, chats, absorb };
   absorb скармливается bosNotifAbsorbLive ПОСЛЕ показа (метит виденное, гасит точку). */
async function bosNotifCollectLive(app) {
  const out = { requests: [], joined: [], invited: [], accepted: [], buddies: [], chats: [], absorb: null };
  if (!(window.bosCloud && window.bosCloud.enabled())) return out;
  let me = null; try { me = await window.bosCloud.uid(); } catch (e) {}
  const seen = bosNotifSeenGet(me);
  const teams = (app?.teams || []).filter((t) => t.cloudId);
  const shHabits = (app?.habits || []).filter((h) => h && h.shareCode);
  const absorb = { inv: [], members: {}, buddies: {} };
  await Promise.all([
    // Заявки — только в круги, где я владелец (создатель, не joined).
    ...teams.filter((t) => !t.joined).map(async (t) => {
      try {
        const reqs = await window.bosCloud.pendingRequests(t.cloudId);
        (reqs || []).forEach((r) => out.requests.push({ team: t, user: r }));
      } catch (e) {}
    }),
    // Новые участники: дифф свежего ростера против «виденных» id.
    ...teams.map(async (t) => {
      try {
        const ms = await window.bosCloud.teamMembers(t.cloudId);
        const real = (ms || []).filter((m) => m && m.role !== "pending");
        const known = seen.members && seen.members[t.cloudId];
        if (Array.isArray(known)) real.forEach((m) => { if (m.id !== me && known.indexOf(m.id) < 0) out.joined.push({ team: t, user: m }); });
        absorb.members[t.cloudId] = real.map((m) => m.id);
      } catch (e) {}
    }),
    // Пришедшие по моей ссылке в приложение.
    (async () => {
      try {
        const inv = await window.bosCloud.invitedPeople();
        const known = seen.inv;
        if (Array.isArray(known)) (inv || []).forEach((p) => { if (known.indexOf(p.id) < 0) out.invited.push({ user: p }); });
        absorb.inv = (inv || []).map((p) => p.id);
      } catch (e) {}
    })(),
    // «Тебя приняли»: стучался (knockedCircles) и уже член → покажем круг.
    (async () => {
      let knocked = {}; try { knocked = JSON.parse(localStorage.getItem("bos:knockedCircles") || "{}") || {}; } catch (e) {}
      const ids = Object.keys(knocked).filter((k) => knocked[k]);
      const mineIds = {}; teams.forEach((t) => { mineIds[t.cloudId] = true; });
      await Promise.all(ids.map(async (id) => {
        if (mineIds[id]) { bosNotifKnockResolved(id); return; } // уже открыл круг сам
        try {
          const ms = await window.bosCloud.teamMembers(id);
          const mine = (ms || []).find((m) => m && m.id === me);
          if (mine && mine.role !== "pending") {
            const row = window.bosCloud.teamById ? await window.bosCloud.teamById(id) : null;
            if (row) out.accepted.push({ row: row });
          }
        } catch (e) {}
      }));
    })(),
    // Совместные ПРИВЫЧКИ (buddy по shareCode): дифф участников против «виденных» —
    // «X теперь ведёт привычку с тобой» (David: друг вступил в привычку — а у обоих тишина).
    ...shHabits.map(async (h) => {
      try {
        if (!window.bosCloud.sharedHabitProgress) return;
        const d = await window.bosCloud.sharedHabitProgress(h.shareCode);
        const ms = (d && d.members) || [];
        const known = seen.buddies && seen.buddies[h.shareCode];
        if (Array.isArray(known)) ms.forEach((m) => { if (m && m.id !== me && known.indexOf(m.id) < 0) out.buddies.push({ habit: h, user: m }); });
        absorb.buddies[h.shareCode] = ms.map((m) => m && m.id).filter(Boolean);
      } catch (e) {}
    }),
    // Непрочитанные чаты. Новый путь — ЛЁГКИЙ count-запрос (cloud.unreadMessages) вместо
    // полной ленты на каждый круг; старый полный fetch остаётся фолбэком.
    ...teams.map(async (t) => {
      try {
        // Марка прочтения хранится как ISO-строка (created_at последнего сообщения) — читать через
        // Date, НЕ Number (Number(ISO)=NaN→эпоха→«непрочитано» горело бы всегда). David: значок
        // должен зажигаться честно, по реальному непрочитанному.
        const _lrRaw = localStorage.getItem("bos:chatread:" + t.cloudId);
        const lastRead = _lrRaw ? new Date(_lrRaw).getTime() : 0;
        if (window.bosCloud.unreadMessages) {
          const u = await window.bosCloud.unreadMessages(t.cloudId, lastRead);
          if (u && u.count) out.chats.push({ team: t, count: u.count, last: u.last });
          if (u) return; // null → облако споткнулось, попробуем фолбэк ниже
        }
        const rows = await window.bosCloud.loadMessages(t.cloudId);
        if (!Array.isArray(rows) || !rows.length) return;
        const unread = rows.filter((r) => r && r.user_id !== me && new Date(r.created_at).getTime() > lastRead);
        if (unread.length) out.chats.push({ team: t, count: unread.length, last: unread[unread.length - 1] });
      } catch (e) {}
    }),
  ]);
  out.absorb = absorb;
  return out;
}
/* Пометить показанное виденным (вступившие + рефералы; заявки и чаты живут по своим
   правилам) и разбудить точку колокольчика. */
function bosNotifAbsorbLive(absorb) {
  if (!absorb) return;
  let me = null; try { me = window.bosCloud && window.bosCloud.uidSync && window.bosCloud.uidSync(); } catch (e) {}
  const cur = bosNotifSeenGet(me);
  const members = Object.assign({}, cur.members || {}, absorb.members || {});
  const buddies = Object.assign({}, cur.buddies || {}, absorb.buddies || {});
  bosNotifSeenSet(me, { inv: absorb.inv || cur.inv || [], members: members, buddies: buddies });
  try { localStorage.removeItem("bos:cache:notifdot:" + (me || "local")); } catch (e) {}
  try { window.dispatchEvent(new Event("bos:notifSeenChanged")); } catch (e) {}
}
/* Разрешить «стук»: заявку приняли и человек открыл круг (или круг уже у него). */
function bosNotifKnockResolved(teamId) {
  try {
    const k = JSON.parse(localStorage.getItem("bos:knockedCircles") || "{}") || {};
    if (k[teamId]) { delete k[teamId]; localStorage.setItem("bos:knockedCircles", JSON.stringify(k)); window.dispatchEvent(new Event("bos:circlesKnocked")); }
  } catch (e) {}
}
/* Точка колокольчика: тот же полный сбор, но с кэшем на 10 минут — главная не дёргает
   облако каждый заход. Сброс кэша — по bos:notifSeenChanged (шторка показала/решила). */
async function bosNotifHasFreshLive(app) {
  if (!(window.bosCloud && window.bosCloud.enabled())) return false;
  let me = null; try { me = window.bosCloud.uidSync && window.bosCloud.uidSync(); } catch (e) {}
  const KEY = "bos:cache:notifdot:" + (me || "local");
  try {
    const c = JSON.parse(localStorage.getItem(KEY) || "null");
    if (c && Date.now() - c.at < 10 * 60 * 1000) return !!c.v;
  } catch (e) {}
  const d = await bosNotifCollectLive(app);
  const has = !!(d.requests.length || d.joined.length || d.invited.length || d.accepted.length || d.buddies.length || d.chats.length);
  try { localStorage.setItem(KEY, JSON.stringify({ v: has, at: Date.now() })); } catch (e) {}
  // Первый взгляд: если «виденных» ещё нет вообще — тихо поглотим базу, чтобы у
  // старожила не вспыхнула точка задним числом на всю историю.
  const seen = bosNotifSeenGet(me);
  if (!Array.isArray(seen.inv) && d.absorb) bosNotifAbsorbLive(d.absorb);
  return has;
}

/* Непрочитанные для ВНЕШНЕЙ плитки круга (David: «значок чата должен гореть и на внешней карточке»).
   Лёгкий count-only HEAD-запрос (cloud.unreadMessages) + кэш 60с в памяти на cloudId, чтобы сетка
   плиток и ре-рендеры не молотили облако. Возвращает { count } или null. Марку прочтения читаем
   через Date (та же база времени, что у сообщений). */
var _bosTeamUnreadCache = {};
function bosTeamUnreadCacheGet(cloudId) { var c = _bosTeamUnreadCache[cloudId]; return (c && Date.now() - c.at < 60000) ? c : null; }
async function bosTeamUnreadPeek(cloudId) {
  if (!cloudId || !(window.bosCloud && window.bosCloud.enabled() && window.bosCloud.unreadMessages)) return null;
  var cached = bosTeamUnreadCacheGet(cloudId);
  if (cached) return cached;
  try {
    var raw = localStorage.getItem("bos:chatread:" + cloudId);
    var since = raw ? new Date(raw).getTime() : 0;
    var u = await window.bosCloud.unreadMessages(cloudId, since);
    if (!u) return _bosTeamUnreadCache[cloudId] || null;
    var rec = { at: Date.now(), count: u.count || 0 };
    _bosTeamUnreadCache[cloudId] = rec;
    return rec;
  } catch (e) { return _bosTeamUnreadCache[cloudId] || null; }
}
/* Когда чат прочитан внутри детали — обнулим кэш плитки, чтобы значок сразу погас и на сетке. */
function bosTeamUnreadClear(cloudId) { if (cloudId) _bosTeamUnreadCache[cloudId] = { at: Date.now(), count: 0 }; }
try { window.addEventListener("bos:notifSeenChanged", function () { _bosTeamUnreadCache = {}; }); } catch (e) {}

/* Welcome modal shown when you open an invite LINK and land in a shared habit / team — so the
   join is never silent (David: «человек не понимает, что его позвали»). Rendered at app root
   from app.pendingJoinWelcome (mirrors AchievementUnlock). Spring-in glass card. LIVE only. */
function JoinWelcomeLive({ info, onClose }) {
  const [open, setOpen] = React.useState(false);
  const closingRef = React.useRef(false);
  const app = (typeof useApp === "function") ? useApp() : null;
  React.useEffect(() => { const t = window.setTimeout(() => setOpen(true), 10); return () => window.clearTimeout(t); }, []);
  if (!info) return null;
  const isDark = !!(typeof document !== "undefined" && document.querySelector(".bos-page.theme-dark"));
  const isTeam = info.kind === "team";
  const isApp = info.kind === "app"; // «X зовёт тебя» — пришёл по ссылке друга просто в приложение
  const isInvite = info.kind === "team-invite"; // превью ДО вступления (brief 2026-07-11): членство только после явного «Вступить»
  const inviter = (info.inviterName || "").trim();
  const close = () => {
    if (closingRef.current) return; closingRef.current = true;
    setOpen(false);
    // свайп-вниз/закрытие превью-приглашения = «не сейчас»: чистим ссылку, ничего не вступаем
    const done = (isInvite && app && app.declineTeamInvite) ? app.declineTeamInvite : onClose;
    window.setTimeout(() => { try { done && done(); } catch (e) {} }, 340);
  };
  const closeThen = (fn) => () => {
    if (closingRef.current) return; closingRef.current = true;
    setOpen(false);
    window.setTimeout(() => { try { fn && fn(); } catch (e) {} }, 340);
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
          {isApp ? (
            // Человек зовёт человека — по центру ЛИЦО зовущего, без служебной плитки.
            <BuddyFaceLive avatar={info.inviterAvatar || "default"} name={inviter} size={76} />
          ) : (
            <div style={{ position: "relative", width: 76, height: 76 }}>
              <div style={{ width: 76, height: 76, borderRadius: 21, background: BOS_TILE_SHEEN + ", " + tileBg, boxShadow: (typeof bosTileGlass === "function" ? bosTileGlass(isDark) : "0 6px 16px rgba(0,0,0,0.10)"), display: "grid", placeItems: "center", fontSize: 37 }}>{glyph}</div>
              {!isTeam && !isInvite && (
                <div style={{ position: "absolute", right: -8, bottom: -6, borderRadius: "50%", boxShadow: "0 0 0 3px var(--card, #fff)" }}>
                  <BuddyFaceLive avatar={info.inviterAvatar || "default"} name={inviter} size={34} />
                </div>
              )}
            </div>
          )}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1.4, fontWeight: 700, marginTop: 14 }}>{isInvite ? "Тебя зовут в круг" : isApp ? "Тебя пригласили" : isTeam ? "Совместная цель" : "Совместная привычка"}</div>
        <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: "-0.5px", color: "var(--text)", marginTop: 3 }}>{info.name}</div>
        <div style={{ fontSize: 13.5, color: "var(--text-3)", marginTop: 8, lineHeight: 1.5, padding: "0 6px", textWrap: "balance" }}>
          {isInvite
            ? ("Вступишь — увидишь людей, общие привычки и чат" + (info.membersN ? (" · сейчас тут " + info.membersN + " " + (info.membersN === 1 ? "человек" : (info.membersN < 5 ? "человека" : "человек"))) : "") + ". Пока ты снаружи, круг о тебе ничего не видит.")
            : isApp
              ? ((inviter || "Друг") + " зовёт вести привычки и цели вместе. Вы уже на одной орбите — начни со своей первой привычки.")
              : isTeam
                ? ((inviter ? inviter + " зовёт вести цель вместе" : "Тебя позвали вести цель вместе") + " — виден прогресс каждого.")
                : ((inviter ? inviter + " зовёт вести вместе" : "Тебя позвали вести вместе") + " — будете видеть отметки друг друга и держать ритм.")}
        </div>
        {!isTeam && !isApp && !isInvite && (
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
        {isInvite ? (
          <React.Fragment>
            <button onClick={closeThen(function () { if (app && app.acceptTeamInvite) app.acceptTeamInvite(info.teamId); })} className="bos-btn" style={{ marginTop: 20 }}>Вступить в круг</button>
            <button onClick={close} className="tap" style={{ width: "100%", marginTop: 8, background: "transparent", color: "var(--text-4)", border: 0, borderRadius: 14, padding: 12, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Не сейчас</button>
          </React.Fragment>
        ) : (
          <button onClick={close} className="bos-btn" style={{ marginTop: 20 }}>{isApp ? "Начали!" : isTeam ? "Отлично!" : "Веду вместе!"}</button>
        )}
      </div>
    </BottomSheet>
  );
}

/* Daily Balance completion — the Apple-Watch-style closure moment, but in BalanceOS language:
   not a score popup, a calm proof that today's small life-system is assembled. Rendered from
   app.pendingDayClose at the app root, after invite welcomes and before achievement sheets. LIVE. */
function DayCloseSheetLive({ info, onClose, navigate }) {
  const [open, setOpen] = React.useState(false);
  const closingRef = React.useRef(false);
  const app = (typeof useApp === "function") ? useApp() : null;
  React.useEffect(() => { const t = window.setTimeout(() => setOpen(true), 10); return () => window.clearTimeout(t); }, []);
  if (!info) return null;
  const isDark = !!(typeof document !== "undefined" && document.querySelector(".bos-page.theme-dark"));
  const bal = info.balance || ((typeof bosDailyBalanceLive === "function") ? bosDailyBalanceLive(app) : null) || {};
  const parts = Array.isArray(bal.parts) ? bal.parts : [];
  const insight = (typeof bosDayCloseInsightLive === "function") ? bosDayCloseInsightLive(app) : "Один честный день важнее идеального плана. Завтра продолжим с малого.";
  const close = () => {
    if (closingRef.current) return; closingRef.current = true;
    setOpen(false);
    window.setTimeout(() => { try { onClose && onClose(); } catch (e) {} }, 340);
  };
  const go = (route, params) => { close(); window.setTimeout(() => { try { navigate && navigate(route, params || {}); } catch (e) {} }, 360); };
  const chipBg = isDark ? "rgba(255,255,255,0.07)" : "#f4f4f6";
  const ink = isDark ? "#fff" : "var(--text)";
  return (
    <BottomSheet open={open} onClose={close} dark={isDark}>
      <div style={{ padding: "6px 22px 24px", color: ink, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ position: "relative", width: 98, height: 98, display: "grid", placeItems: "center" }}>
            <span aria-hidden style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(circle at 50% 45%, rgba(254,222,52,0.55), rgba(239,159,20,0.18) 58%, transparent 74%)", filter: "blur(1px)" }} />
            <svg width="96" height="96" viewBox="0 0 96 96" style={{ position: "absolute", inset: 1, transform: "rotate(-90deg)" }} aria-hidden>
              <circle cx="48" cy="48" r="37" fill="none" stroke={isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"} strokeWidth="7" />
              <circle cx="48" cy="48" r="37" fill="none" stroke="url(#bosDayCloseGold)" strokeWidth="7" strokeLinecap="round" strokeDasharray="232.5" strokeDashoffset="0" />
              <defs><linearGradient id="bosDayCloseGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FEDE34" /><stop offset="1" stopColor="#EF9F14" /></linearGradient></defs>
            </svg>
            <span style={{ position: "relative", fontSize: 34, filter: "drop-shadow(0 3px 7px rgba(0,0,0,0.18))" }}>✓</span>
          </div>
        </div>
        <div style={{ fontSize: 11.5, color: "#C98A00", textTransform: "uppercase", letterSpacing: 1.8, fontWeight: 800, marginTop: 12 }}>Баланс дня</div>
        <div style={{ fontSize: 27, fontWeight: 800, letterSpacing: "-0.6px", lineHeight: 1.08, marginTop: 5 }}>День собран</div>
        <div style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.5, maxWidth: 286, margin: "9px auto 0", textWrap: "balance" }}>Ты заметил состояние, сделал ход и закрепил день. Так, день за днём, собирается ритм.</div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 7, marginTop: 18 }}>
          {parts.map((p) => (
            <div key={p.id} style={{ borderRadius: 16, background: chipBg, padding: "10px 6px", minWidth: 0 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", margin: "0 auto", display: "grid", placeItems: "center", background: "linear-gradient(135deg,#FEDE34,#EF9F14)", color: "#0a0a0a", fontSize: 13, fontWeight: 900 }}>✓</div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text)", marginTop: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.label}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, borderRadius: 18, background: isDark ? "rgba(255,255,255,0.06)" : "#f7f7f8", padding: "13px 15px", textAlign: "left" }}>
          <div style={{ fontSize: 11, color: "var(--text-4)", fontWeight: 800, letterSpacing: 1.1, textTransform: "uppercase" }}>Что стало сильнее</div>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text)", marginTop: 5, lineHeight: 1.35 }}>Ритм возвращения</div>
          <div style={{ fontSize: 12.8, color: "var(--text-3)", marginTop: 4, lineHeight: 1.45 }}>{insight}</div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          <button onClick={() => go("history")} className="tap" style={{ flex: 1, border: 0, borderRadius: 999, padding: "14px 12px", background: isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)", color: "var(--text)", fontSize: 14.5, fontWeight: 700 }}>Неделя</button>
          <button onClick={() => go("ai-chat", { prompt: "Разбери мой закрытый день Balance: что стало сильнее и с чего начать завтра?" })} className="bos-btn" style={{ flex: 1, marginTop: 0 }}>Разобрать с AI</button>
        </div>
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

/* НОВЫЙ УРОВЕНЬ — празднование. Ловится в AppProvider (shell.jsx), приезжает из app.pendingLevelUp.
   Почему круглый ТЁМНЫЙ медальон, а не золотой квадрат ачивки: уровень редок и весит больше, он
   обязан читаться как другой, более редкий предмет — иначе «поздравляем» превращается в шум.
   Ритм текста при этом тот же, что у ачивки (кикер → титул → описание → пилюля → кнопка), поэтому
   штука новая, а язык знакомый. Конфетти стреляет на монтировании — один общий движок (core/confetti). LIVE. */
function LevelUpSheetLive({ info, onClose }) {
  const [open, setOpen] = React.useState(false);
  const closingRef = React.useRef(false);
  React.useEffect(() => { const t = window.setTimeout(() => setOpen(true), 10); return () => window.clearTimeout(t); }, []);
  // Салют — вдогонку за выехавшей шторкой (340мс), иначе конфетти сыплется на пустой экран.
  React.useEffect(() => {
    const t = window.setTimeout(() => {
      if (typeof window.bosCelebrateLevel === "function") window.bosCelebrateLevel();
      if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} }
    }, 420);
    return () => window.clearTimeout(t);
  }, []);
  if (!info) return null;
  const isDark = !!(typeof document !== "undefined" && document.querySelector(".bos-page.theme-dark"));
  const lvl = info.level | 0;
  const unlock = (typeof BOS_LEVEL_UNLOCKS === "object" && BOS_LEVEL_UNLOCKS) ? BOS_LEVEL_UNLOCKS[lvl] : null;
  const close = () => {
    if (closingRef.current) return; closingRef.current = true;
    setOpen(false);
    window.setTimeout(() => { try { onClose && onClose(); } catch (e) {} }, 340);
  };
  return (
    <BottomSheet open={open} onClose={close} dark={isDark}>
      <div style={{ padding: "8px 24px 26px", textAlign: "center", color: "var(--text)" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ position: "relative", width: 108, height: 108, display: "grid", placeItems: "center" }}>
            {/* золотое дыхание позади медальона */}
            <span aria-hidden style={{ position: "absolute", inset: -6, borderRadius: "50%", background: "radial-gradient(circle, rgba(254,222,52,0.30) 0%, rgba(254,222,52,0) 68%)", animation: "bosLvlGlow 0.9s ease-out 0.1s both" }} />
            {/* кольцо обрисовывается по кругу */}
            <svg aria-hidden width="108" height="108" viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
              <circle cx="50" cy="50" r="45" fill="none" stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(10,10,10,0.07)"} strokeWidth="3" />
              <circle cx="50" cy="50" r="45" fill="none" stroke="url(#bosLvlGrad)" strokeWidth="3" strokeLinecap="round"
                strokeDasharray="282.7" style={{ animation: "bosLvlRing 0.9s cubic-bezier(0.22,1,0.36,1) 0.14s both" }} />
              <defs>
                <linearGradient id="bosLvlGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#FFE96A" /><stop offset="100%" stopColor="#EF9F14" />
                </linearGradient>
              </defs>
            </svg>
            {/* тёмный медальон с золотой цифрой */}
            <div style={{ position: "relative", width: 78, height: 78, borderRadius: "50%", background: "linear-gradient(168deg,#1c1c20 0%,#08080a 100%)", display: "grid", placeItems: "center", boxShadow: "inset 0 0 0 0.7px rgba(254,222,52,0.28), 0 8px 20px rgba(0,0,0,0.22)", animation: "achEmblem 0.55s cubic-bezier(0.34,1.56,0.64,1) 0.08s both" }}>
              <span style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-1px", lineHeight: 1, background: "linear-gradient(180deg,#FFE96A,#EF9F14)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>{lvl}</span>
            </div>
          </div>
        </div>
        <div style={{ fontSize: 11.5, color: "#C98A00", textTransform: "uppercase", letterSpacing: 1.8, fontWeight: 800, marginTop: 20 }}>Новый уровень</div>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.6px", color: "var(--text)", marginTop: 6, lineHeight: 1.1 }}>Уровень {lvl}</div>
        <div style={{ fontSize: 14.5, color: "var(--text-3)", lineHeight: 1.5, maxWidth: 270, margin: "10px auto 0", textWrap: "balance" }}>
          {unlock ? "Твои дни сложились в новую ступень." : "Твои дни сложились в новую ступень. Так держать."}
        </div>
        {/* «Открылось» — МАТОВАЯ карточка с золотым значком, а не вторая золотая пилюля во всю ширину:
            иначе под титулом встают две плашки подряд и глаз не понимает, что тут кнопка. Золото
            остаётся ровно там, где награда — в значке. */}
        {unlock ? (
          <div style={{ display: "flex", alignItems: "center", gap: 11, textAlign: "left", background: "var(--card-2)", borderRadius: 16, padding: "10px 12px", maxWidth: 292, margin: "18px auto 0" }}>
            <span style={{ flexShrink: 0, width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(158deg,#FFDC4A 0%,#F4A81E 100%)", display: "grid", placeItems: "center", boxShadow: "inset 0 1px 1px rgba(255,255,255,0.55)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#0a0a0a"><path d="M12 2.2l2.4 7.4 7.4 2.4-7.4 2.4-2.4 7.4-2.4-7.4-7.4-2.4 7.4-2.4z" /></svg>
            </span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 9.5, fontWeight: 800, letterSpacing: 1.2, color: "var(--text-4)" }}>ОТКРЫЛОСЬ</span>
              <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "var(--text)", lineHeight: 1.3, marginTop: 1 }}>{unlock}</span>
            </span>
          </div>
        ) : null}
        <button onClick={close} className="bos-btn" style={{ marginTop: 22 }}>Класс!</button>
      </div>
    </BottomSheet>
  );
}

/* Шторка ЗАЛЁТОВ круга — «швейцар» показывает её при открытии приложения (David 2026-07-16:
   «три раза пропустил — вылетаешь автоматически, но об этом надо сообщать»).
   kind:"warn" — 2 пропуска подряд, честное предупреждение до вылета;
   kind:"out"  — круг отпустил: личная копия привычек и статистика остались, дверь открыта. */
function CircleStrikeSheetLive({ info, onClose, navigate }) {
  const app = (typeof useApp === "function") ? useApp() : null;
  const [open, setOpen] = React.useState(false);
  const closingRef = React.useRef(false);
  React.useEffect(() => { const t = window.setTimeout(() => setOpen(true), 10); return () => window.clearTimeout(t); }, []);
  React.useEffect(() => {
    if (window.tgHaptic) { try { window.tgHaptic(info && info.kind === "out" ? "heavy" : "medium"); } catch (e) {} }
  }, []);
  if (!info) return null;
  const isDark = !!(typeof document !== "undefined" && document.querySelector(".bos-page.theme-dark"));
  const out = info.kind === "out";
  const close = () => {
    if (closingRef.current) return; closingRef.current = true;
    setOpen(false);
    window.setTimeout(() => { try { onClose && onClose(); } catch (e) {} }, 340);
  };
  const others = (Array.isArray(info.names) && info.names.length > 1) ? info.names.slice(1) : [];
  const team = (!out && app && Array.isArray(app.teams) && info.teamCloudId) ? app.teams.find((x) => x && x.cloudId === info.teamCloudId) : null;
  const goRoom = () => { close(); if (team && typeof navigate === "function") window.setTimeout(() => navigate("team-detail", { team: team, from: "home" }), 360); };
  return (
    <BottomSheet open={open} onClose={close} dark={isDark}>
      <div style={{ padding: "8px 24px 26px", textAlign: "center", color: "var(--text)" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", margin: "0 auto 12px", display: "grid", placeItems: "center", fontSize: 30,
          background: (typeof BOS_ORB_SHEEN !== "undefined" ? BOS_ORB_SHEEN + ", " : "") + (isDark ? "linear-gradient(160deg,#464c58,#30353f)" : "linear-gradient(160deg,#eef1f6,#dadfe7)"),
          boxShadow: (typeof bosOrbGlass === "function" ? bosOrbGlass(isDark) : "none") }}>{(typeof bosIcon === "function") ? bosIcon(info.emblem || "👥", 30, null) : (info.emblem || "👥")}</div>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.4px" }}>{out ? "Круг отпустил тебя" : "Ещё один пропуск — и круг отпустит"}</div>
        <div style={{ fontSize: 13.5, color: "var(--text-3)", marginTop: 8, maxWidth: 292, marginInline: "auto", lineHeight: 1.5 }}>
          {out
            ? <React.Fragment>{"В «" + (info.name || "круге") + "» прошло три твоих дня подряд без единой отметки — так работает честное правило круга. Привычки и вся статистика остались с тобой."}{others.length > 0 ? (" То же случилось ещё с " + others.length + " " + (others.length === 1 ? "кругом" : "кругами") + ".") : ""}</React.Fragment>
            : ("В «" + (info.name || "круге") + "» уже два твоих дня подряд без отметок. Три подряд — и выход из круга случится сам. Одна отметка обнуляет счёт.")}
        </div>
        {out && (
          <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 8, maxWidth: 292, marginInline: "auto", lineHeight: 1.5 }}>
            Дверь открыта: вернуться можно из каталога «Общих целей» или по ссылке-приглашению.
          </div>
        )}
        {!out && team && (
          <button onClick={goRoom} className="tap" style={{ width: "100%", marginTop: 18, border: 0, borderRadius: 999, padding: 14, background: isDark ? "#fff" : "#0a0a0a", color: isDark ? "#0a0a0a" : "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Открыть круг</button>
        )}
        <button onClick={close} className="tap" style={{ width: "100%", marginTop: (!out && team) ? 8 : 18, border: 0, borderRadius: 999, padding: 14, background: (!out && team) ? (isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)") : (isDark ? "#fff" : "#0a0a0a"), color: (!out && team) ? "var(--text)" : (isDark ? "#0a0a0a" : "#fff"), fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Понятно</button>
        <div style={{ height: "max(8px, var(--tg-bottom-inset, 0px))" }} />
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
      <div style={{ fontSize: 13.5, color: "var(--text-3)", marginTop: 7, lineHeight: 1.5, textWrap: "balance" }}>«{dupeName}» уже в твоих привычках. Привязать её к общей цели — серия и твоё время сохранятся. Или завести отдельную.</div>
      <button className="bos-btn" style={{ marginTop: 18 }} onClick={() => go(onLink)}>Привязать «{dupeName}»</button>
      <button className="tap" onClick={() => go(onCreate)} style={{ width: "100%", marginTop: 6, background: "transparent", border: 0, color: "var(--text-3)", padding: 13, fontSize: 14.5, fontWeight: 600, cursor: "pointer" }}>Создать новую отдельно</button>
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
  // Спрятанные с доски привычки (shelved = «убрал со страницы») НЕ ведут цель — иначе кольцо
  // считает то, чего пользователь на доске не видит (David: «в привычках 2, на орбите 4»). Архив
  // фильтруется на экране (там есть реестр); shelved — флаг на самой привычке, режем везде.
  var linked = ids.length ? (habits || []).filter(function (h) { return h && ids.indexOf(h.id) >= 0 && !h.shelved; }) : [];
  var fromHabits = linked.length > 0;
  var raw = fromHabits ? linked.reduce(function (a, h) { return a + bosGoalMarks(h); }, 0) : ((goal && goal.current) || 0);
  var current = target > 0 ? Math.min(raw, target) : raw; // кольцо не переполняем
  var pct = target > 0 ? Math.min(1, current / target) : 0;
  return { current: current, target: target, pct: pct, done: target > 0 && current >= target, fromHabits: fromHabits, linked: linked };
}

// ── КОЛЕСО БАЛАНСА (live) ──────────────────────────────────────────────────
// David 2026-07-04: колесо на странице ИИ, и раскладка ДОЛЖНА быть настоящей —
// работать с ЛЮБОЙ кастомной привычкой (отжимания/приседания → Тело), а не только
// с пресетами. Механизм: bosSphereFor смотрит НАЗВАНИЕ + ЭМОДЗИ и относит объект в
// одну из 6 сфер по смыслу, на устройстве, мгновенно. Если у объекта уже есть
// .sphere (ИИ/юзер проставил) — берём её. МИКС (David): база = активность (надёжно,
// офлайн, бесплатно), а строку-контекст сверху добавляет ИИ.
var BOS_SPHERES = [
  { id: "body", e: "💪", l: "Тело" },
  { id: "mind", e: "🧠", l: "Разум" },
  { id: "work", e: "💼", l: "Дело" },
  { id: "bond", e: "❤️", l: "Люди" },
  { id: "soul", e: "✨", l: "Дух" },
  { id: "rest", e: "🌿", l: "Отдых" },
];
// Заливные иконки сфер для колеса «Баланс жизни» (David: эмодзи → SVG). Эмодзи-поля выше
// остаются для матчинга/fallback. Тело→гантель, Разум→лампочка, Дело→портфель, Люди→сердце,
// Дух→искра, Отдых→луна.
var BOS_SPHERE_ICON = { body: "Dumbbell", mind: "Bulb", work: "Briefcase", bond: "Heart", soul: "Sparkles", rest: "Moon" };
// Пресет для «Добавить привычку в сферу» (лупа сферы / опоры): эмодзи + осмысленное имя,
// которое ГАРАНТИРОВАННО классифицируется bosSphereFor обратно в эту же сферу (по корню слова).
var BOS_SPHERE_PRESET = {
  body: { i: "💪", t: "Зарядка" }, mind: { i: "🧠", t: "Чтение" }, work: { i: "💼", t: "Фокус-блок по работе" },
  bond: { i: "❤️", t: "Позвонить близкому" }, soul: { i: "✨", t: "Благодарность" }, rest: { i: "🌿", t: "Отдых 15 минут" },
};
// Мягкое действие-подсказка для слабейшей сферы (золотой чип под колесом): «5 минут … уже поднимут сферу».
var BOS_SPHERE_NUDGE = {
  body: "5 минут зарядки уже поднимут сферу",
  mind: "5 минут чтения уже поднимут сферу",
  work: "один фокус-блок уже поднимет сферу",
  bond: "звонок близкому уже поднимет сферу",
  soul: "5 минут тишины уже поднимут сферу",
  rest: "15 минут отдыха уже поднимут сферу",
};
// Корни слов (нижний регистр). Совпадение — С НАЧАЛА СЛОВА названия (см. bosSphereFor), поэтому
// короткие корни здесь БЕЗОПАСНЫ: «бег» больше не ловит «избегать», «зал» — «залипать».
// Из-за этого же правила пропал смысл у хака «"муж " с пробелом» (он не мог совпасть с началом
// слова никогда) — развёрнут в честные формы.
var BOS_SPHERE_KW = {
  body: ["отжим", "присед", "планк", "турник", "бег", "бега", "пробеж", "зал", "спорт", "трениров", "тренаж", "фитнес", "качал", "штанг", "гантел", "упражн", "йог", "растяж", "гибк", "вода", "воды", "воду", "стакан", "шаг", "ходь", "прогул", "сон", "спать", "выспат", "высып", "душ", "закал", "зарядк", "разминк", "велосип", "плаван", "бассейн", "пресс", "мышц", "похуд", "питани", "завтрак", "сахар", "диет", "витамин", "здоров", "калори", "таблетк", "врач", "зуб", "body", "gym", "run", "walk", "water", "sleep", "step", "workout", "fitness", "yoga"],
  mind: ["медит", "тишин", "дыхан", "чтен", "чита", "книг", "страниц", "учеб", "учи", "язык", "курс", "обучен", "знан", "рефлекс", "мысл", "фокус", "вниман", "концентр", "мозг", "памят", "подкаст", "лекц", "саморазв", "дневник", "англ", "залип", "отвлек", "отвлеч", "испанск", "немецк", "француз", "терап", "психолог", "read", "learn", "study", "meditat", "focus", "mind", "book", "journal", "diary", "english"],
  work: ["работ", "проект", "дедлайн", "задач", "карьер", "бизнес", "клиент", "созвон", "планир", "финанс", "деньг", "бюджет", "накопл", "инвест", "доход", "продаж", "резюме", "навык", "портфолио", "код", "программ", "дизайн", "стартап", "папк", "почт", "отчёт", "отчет", "work", "task", "project", "money", "budget", "career", "code"],
  bond: ["друж", "друз", "друг", "подруг", "семь", "родител", "мам", "пап", "отц", "жена", "жене", "жену", "женой", "супруг", "мужа", "мужу", "муже", "парн", "девушк", "отношен", "звонок", "позвон", "общен", "свидан", "дети", "детей", "детьм", "ребён", "ребен", "близк", "обним", "вместе", "команд", "партнёр", "партнер", "сын", "доч", "брат", "сестр", "бабушк", "дедушк", "внук", "together", "friend", "family", "call", "partner", "relationship", "love"],
  soul: ["благодар", "молитв", "молит", "дух", "смысл", "ценност", "намерен", "аффирмац", "визуализ", "добро", "помога", "волонт", "вера", "осознан", "умиротвор", "spirit", "gratitude", "pray", "purpose", "faith", "kind"],
  rest: ["отдых", "пауз", "хобби", "рису", "живопис", "музык", "гитар", "игр", "гейм", "путешеств", "отпуск", "релакс", "баня", "сауна", "фильм", "сериал", "творч", "танц", "сад", "цвет", "приро", "лес", "море", "пляж", "собак", "выгул", "питомц", "убор", "убра", "rest", "hobby", "relax", "fun", "travel", "nature", "paint", "music", "game"],
};
// Эмодзи-подсказки (fallback, если название ничего не дало).
var BOS_SPHERE_EMO = {
  body: "💪🏃🏋️🚴🧗🤸⚽🏀🎾🏊🚶👟🥗🍎💧😴🛌🚭🥦⛹️🤾🏄🚵🏆🥇🍽️🩺🦵",
  mind: "🧠📖📚✍️📝🎓🧩🔬💡🎧🗒️🧘",
  work: "💼💰📊📈💻⌨️🗂️📂📁📋📅💵🏦📌📎🎯",
  bond: "❤️👨‍👩‍👧👪🤝📞💬🫂💑👫👬👭🥰💞👋🫶",
  soul: "✨🙏🕊️☮️🌟💫🕯️😇🧎",
  rest: "🌿🎨🎵🎮🎸🌳🏖️✈️🛀🍿🌸🎭🌊😌🧺🎬🃏",
};
// БАЗОВЫЙ эмодзи — без тона кожи, пола и вариационного селектора. Прежний матчинг сравнивал
// эмодзи ЦЕЛИКОМ со строкой-таблицей, поэтому 🏃 находился, а 🏃🏼‍♀️ — нет: любой, кто выбрал
// эмодзи с оттенком кожи, терял запасной путь и уезжал в «Разум». Именно такие эмодзи стоят в
// стартовых привычках приложения (🧘🏼‍♀️, 🏃🏼‍♀️, ✍🏼).
function bosBaseEmoji(e) {
  if (!e) return "";
  var s = ("" + e).split("‍")[0];              // ZWJ-связка (…‍♀️) → берём базовую фигуру
  s = s.replace(/[︎️]/g, "");             // вариационный селектор
  try { s = s.replace(/[\u{1F3FB}-\u{1F3FF}]/gu, ""); } catch (e2) {}   // тон кожи
  return s;
}
// Плоская карта «базовый эмодзи → сфера», собирается один раз из таблиц выше.
var BOS_EMO_MAP = (function () {
  var m = {};
  try {
    BOS_SPHERES.forEach(function (s) {
      Array.from(BOS_SPHERE_EMO[s.id] || "").forEach(function (ch) {
        var b = bosBaseEmoji(ch);
        if (b && !m[b]) m[b] = s.id;
      });
    });
  } catch (e) {}
  return m;
})();
// Слова названия: режем по всему, что не буква/цифра.
function bosNameWords(name) {
  return ("" + (name || "")).toLowerCase().split(/[^0-9a-zа-яё]+/).filter(Boolean);
}
function bosSphereFor(item) {
  if (!item) return "mind";
  if (item.sphere && BOS_SPHERE_KW[item.sphere]) return item.sphere; // юзер/ИИ проставил — приоритет
  // 1) По названию. Корень должен совпасть С НАЧАЛА СЛОВА, а не куском внутри него: прежний
  // `name.indexOf(корень)` отправлял «работу с ДЕПРЕССИЕЙ» в Тело (там «пресс»), «изБЕГать» —
  // в Тело («бег»), «заЛИПать» — в Тело («зал»), «сЧИТАть» — в Разум («чита»), а «сМЫСЛ» никогда
  // не доходил до Духа, потому что Разум перехватывал его своим «мысл».
  // Побеждает САМЫЙ ДЛИННЫЙ совпавший корень, а не первая сфера по списку: иначе порядок сфер
  // решал за нас все столкновения и Дух structurally голодал.
  var words = bosNameWords(item.name), best = null, bestLen = 0;
  for (var i = 0; i < BOS_SPHERES.length; i++) {
    var id = BOS_SPHERES[i].id, kws = BOS_SPHERE_KW[id] || [];
    for (var j = 0; j < kws.length; j++) {
      var kw = kws[j];
      if (kw.length <= bestLen) continue;
      for (var w = 0; w < words.length; w++) {
        if (words[w].indexOf(kw) === 0) { best = id; bestLen = kw.length; break; }
      }
    }
  }
  if (best) return best;
  var emo = bosBaseEmoji(item.emoji);                                // 2) по эмодзи (нормализованному)
  if (emo && BOS_EMO_MAP[emo]) return BOS_EMO_MAP[emo];
  return "mind";                                                     // не распознали → «Разум»
}
// ── ЗАТУХАНИЕ «за всё время» (David V2-финал) ────────────────────────────────
// Баланс жизни копится из ВСЕЙ истории ходов, но свежие ходы весят больше: вес
// одного хода = 0.5^(возраст_в_днях / полупериод). Полупериод ~месяц → заброшенная
// сфера медленно бледнеет (а не обнуляется по понедельникам), вернулся — оживает.
var BOS_WHEEL_HALFLIFE = 30;   // дней — полупериод веса одного хода
var BOS_WHEEL_SAT = 10;        // столько «затухшего веса» ходов → привычка налита наполовину
var BOS_WHEEL_TREND_EPS = 1;   // разница ходов (посл.7 дн vs пред.7 дн), чтобы стрелка «повернулась»
// Сумма затухших весов ходов из лога привычки. minAge/maxAge (дней) сужают окно (для трендов);
// по умолчанию — вся история. Ключи лога = "YYYY-MM-DD" (Date.parse → полночь локали).
function bosDecayWeight(log, now, minAge, maxAge) {
  if (!log) return 0;
  var HL = BOS_WHEEL_HALFLIFE, sum = 0;
  for (var k in log) {
    if (!Object.prototype.hasOwnProperty.call(log, k) || !log[k]) continue;
    var t = Date.parse(k); if (isNaN(t)) continue;
    var age = (now - t) / 86400000; if (age < 0) age = 0;
    if (minAge != null && age < minAge) continue;
    if (maxAge != null && age >= maxAge) continue;
    sum += Math.pow(0.5, age / HL);
  }
  return sum;
}
// Сила одной привычки 0..1 — насыщается от затухшего веса ВСЕЙ истории ходов (свежие весомее).
// Существующая привычка без свежих ходов не падает в ноль (структура сферы видна).
function bosHabitStrength(h, now) {
  if (!h) return 0;
  now = now || Date.now();
  var w = bosDecayWeight(h.log, now);
  var s = 1 - Math.pow(0.5, w / BOS_WHEEL_SAT);   // 0 ходов → 0; много свежих → →1
  var seed = (h.log && Object.keys(h.log).length) ? 0.12 : 0.10;
  return Math.max(seed, Math.min(1, s));
}
// Направление сферы за последние дни: ходы посл. 7 дн vs пред. 7 дн (David: стрелка ▲▼—).
function bosSphereTrend(habits, now) {
  var last = 0, prev = 0;
  (habits || []).forEach(function (h) {
    var log = h && h.log; if (!log) return;
    for (var k in log) {
      if (!Object.prototype.hasOwnProperty.call(log, k) || !log[k]) continue;
      var t = Date.parse(k); if (isNaN(t)) continue;
      var age = (now - t) / 86400000; if (age < 0) age = 0;
      if (age < 7) last++; else if (age < 14) prev++;
    }
  });
  if (last - prev >= BOS_WHEEL_TREND_EPS) return "up";
  if (prev - last >= BOS_WHEEL_TREND_EPS) return "dn";
  return "eq";
}
// Данные колеса: сфера тем полнее, чем крепче держишь входящие в неё привычки/цели.
// Сигнатура сохранена: { spheres:[{id,e,l,v,n,items,tr}], overall, filled }. Новое поле tr = тренд.
function bosWheelData(app) {
  var now = Date.now();
  var _archM = bosLoadArchived(); // по cloudId (bosIsArch), не по переиздаваемому числовому id
  var habits = ((app && app.habits) || []).filter(function (h) { return h && !h.shelved && !bosIsArch(_archM, "h", h); });
  var goals = ((app && app.goals) || []).filter(function (g) { return g && !bosIsArch(_archM, "g", g); });
  var strengths = {}, items = {}, hbySph = {}; BOS_SPHERES.forEach(function (s) { strengths[s.id] = []; items[s.id] = []; hbySph[s.id] = []; });
  // hid/gid + manual едут в item, чтобы прямо из аккордеона сферы можно было сказать «нет, это
  // другая категория» — человек видит ошибку именно здесь, здесь же её и чинит (David).
  habits.forEach(function (h) { var id = bosSphereFor(h); strengths[id].push(bosHabitStrength(h, now)); hbySph[id].push(h); items[id].push({ emoji: h.emoji || "•", name: h.name || "Привычка", kind: "habit", hid: h.id, manual: !!h.sphere }); });
  goals.forEach(function (g) {
    var prog = (typeof bosGoalProgress === "function") ? bosGoalProgress(g, (app && app.habits) || []) : { pct: 0, done: false };
    var id = bosSphereFor(g);
    strengths[id].push(Math.max(0.30, Math.min(1, 0.30 + (prog.pct || 0) * 0.62 + (prog.done ? 0.08 : 0))));
    items[id].push({ emoji: g.emoji || "🎯", name: g.name || "Цель", kind: "goal", gid: g.id, manual: !!g.sphere });
  });
  var total = 0, filled = 0;
  var spheres = BOS_SPHERES.map(function (s) {
    var arr = strengths[s.id], v;
    if (!arr.length) v = 0.06;                                        // пустая сфера — почти пусто
    else {
      var avg = arr.reduce(function (a, b) { return a + b; }, 0) / arr.length;
      v = Math.min(1, avg + Math.min(arr.length - 1, 4) * 0.03);      // чуть вознаграждаем широту
      filled++;
    }
    total += v;
    return { id: s.id, e: s.e, l: s.l, v: v, n: arr.length, items: items[s.id], tr: bosSphereTrend(hbySph[s.id], now) };
  });
  return { spheres: spheres, overall: Math.round(total / spheres.length * 100), filled: filled };
}
function bosZoneColor(v) { return v >= 0.70 ? "#34C759" : v >= 0.52 ? "#FFC400" : "#FF8A3D"; }

// ── БАЗОВЫЙ ОПРОС КОЛЕСА ─────────────────────────────────────────────────────
// Человеческий вопрос к каждой сфере + пять пилюль СЛОВАМИ (не цифрами: «7 из 10» ничего не
// значит, «так себе» — значит).
var BOS_BASE_Q = {
  body: "Сколько сейчас сил и здоровья?",
  mind: "Растёшь ли, учишься, думаешь?",
  work: "Как с делом и деньгами?",
  bond: "Насколько ты близок с важными людьми?",
  soul: "Есть ли смысл и опора?",
  rest: "Хватает ли отдыха и радости?",
};
var BOS_BASE_PILLS = ["Совсем плохо", "Слабо", "Нормально", "Хорошо", "Отлично"];

/* Шесть карточек, по сфере на экран. Сверху мини-колесо, и его контур-тень дорисовывается на
   глазах — человек ВИДИТ, как рождается его база, а не заполняет анкету. LIVE. */
function BosBaselineSurveyLive({ app }) {
  const sheet = (typeof useSheet === "function") ? useSheet() : null;
  const isDark = !!(typeof document !== "undefined" && document.querySelector(".bos-page.theme-dark"));
  const SPH = BOS_SPHERES || [];
  const [step, setStep] = React.useState(0);
  const [vals, setVals] = React.useState({});
  const s = SPH[step];
  if (!s) return null;
  const ink = isDark ? "#fff" : "#0a0a0a";
  const pt = (i, v) => {
    const a = (-90 + i * 60) * Math.PI / 180, r = 40 * Math.max(0.05, v);
    return [50 + r * Math.cos(a), 50 + r * Math.sin(a)];
  };
  const ghost = SPH.map((x, i) => pt(i, (vals[x.id] || 0) / 5)).map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const web = SPH.map((x, i) => pt(i, 1)).map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const pick = (n) => {
    const next = Object.assign({}, vals); next[s.id] = n;
    setVals(next);
    if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} }
    if (step + 1 < SPH.length) { window.setTimeout(() => setStep(step + 1), 160); return; }
    // Последняя карточка → сохраняем базу. Дальше колесо открыто навсегда: тень поверх золота.
    try { if (app && app.setBaseline) app.setBaseline(next); } catch (e) {}
    if (typeof window.bosCelebrateLevel === "function") window.bosCelebrateLevel();
    else if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} }
    window.setTimeout(() => { try { if (sheet && sheet.close) sheet.close(); } catch (e) {} }, 320);
  };
  return (
    <div style={{ padding: "2px 22px 18px", color: "var(--text)" }}>
      <div style={{ textAlign: "center", fontSize: 11, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", color: "var(--text-4)" }}>
        Твоя база · {step + 1} из {SPH.length}
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
        <svg width="104" height="104" viewBox="0 0 100 100" aria-hidden>
          <polygon points={web} fill="none" stroke={isDark ? "rgba(255,255,255,0.10)" : "rgba(10,10,10,0.08)"} strokeWidth="1" />
          {SPH.map((x, i) => { const p = pt(i, 1); return <line key={x.id} x1="50" y1="50" x2={p[0]} y2={p[1]} stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(10,10,10,0.06)"} strokeWidth="0.8" />; })}
          {/* тень-контур: дорисовывается точка за точкой по мере ответов */}
          <polygon points={ghost} fill="rgba(254,222,52,0.16)" stroke="#EF9F14" strokeWidth="1.6" strokeLinejoin="round"
            style={{ transition: "all 0.45s cubic-bezier(0.22,1,0.36,1)" }} />
          {SPH.map((x, i) => {
            const p = pt(i, (vals[x.id] || 0) / 5);
            return <circle key={x.id} cx={p[0]} cy={p[1]} r={vals[x.id] ? 2.4 : 0} fill="#FEDE34" stroke="#EF9F14" strokeWidth="0.8"
              style={{ transition: "all 0.45s cubic-bezier(0.22,1,0.36,1)" }} />;
          })}
        </svg>
      </div>
      <div style={{ textAlign: "center", marginTop: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", margin: "0 auto", display: "grid", placeItems: "center", background: isDark ? "rgba(255,255,255,0.07)" : "var(--surface-3)" }}>
          {((typeof bosIconEl === "function") && bosIconEl(BOS_SPHERE_ICON[s.id], { size: 21, color: ink })) || s.e}
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px", marginTop: 10 }}>{s.l}</div>
        <div style={{ fontSize: 14.5, color: "var(--text-3)", marginTop: 5, lineHeight: 1.45, textWrap: "balance" }}>{BOS_BASE_Q[s.id]}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 16 }}>
        {BOS_BASE_PILLS.map((w, i) => (
          <button key={w} className="tap" onClick={() => pick(i + 1)}
            style={{ width: "100%", border: 0, cursor: "pointer", borderRadius: 16, padding: "14px 16px", fontSize: 15.5, fontWeight: 700, fontFamily: "inherit", textAlign: "left",
              background: isDark ? "rgba(255,255,255,0.07)" : "var(--surface-3)", color: "var(--text)" }}>{w}</button>
        ))}
      </div>
      {step > 0 && (
        <button className="tap" onClick={() => setStep(step - 1)} style={{ width: "100%", marginTop: 10, background: "transparent", border: 0, color: "var(--text-4)", padding: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Назад</button>
      )}
    </div>
  );
}

/* «Нет, это другая категория» — перенос привычки/цели в другую сферу прямо из аккордеона колеса.
   Место выбрано намеренно: именно здесь человек ВИДИТ ошибку («почему моя депрессия в Теле?»),
   здесь же её и чинит. Пишет поле sphere → bosSphereFor отдаёт ему приоритет над угадыванием.
   «Авто» снимает ручную метку и возвращает угадывание (оно поедет за переименованием). LIVE. */
function BosSphereMoveSheetLive({ item, cur, app }) {
  const sheet = (typeof useSheet === "function") ? useSheet() : null;
  const isDark = !!(typeof document !== "undefined" && document.querySelector(".bos-page.theme-dark"));
  if (!item) return null;
  const pick = (id) => {
    try {
      if (item.kind === "goal" && app && app.updateGoal) app.updateGoal(item.gid, { sphere: id });
      else if (app && app.updateHabit) app.updateHabit(item.hid, { sphere: id });
    } catch (e) {}
    if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} }
    try { if (sheet && sheet.close) sheet.close(); } catch (e) {}
  };
  return (
    <div style={{ padding: "2px 22px 16px", color: "var(--text)" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 34, lineHeight: 1 }}>{item.emoji}</div>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.3px", marginTop: 8 }}>{item.name}</div>
        <div style={{ fontSize: 13.5, color: "var(--text-3)", marginTop: 6, lineHeight: 1.45, textWrap: "balance" }}>
          {item.manual ? "Сфера выбрана вручную." : "Сферу подобрало приложение по названию."} Переложи, если не туда.
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "center", marginTop: 18 }}>
        {(BOS_SPHERES || []).map((s) => {
          const on = cur === s.id && item.manual;
          return (
            <button key={s.id} className="tap tap-pill" onClick={() => pick(s.id)}
              style={{ border: 0, cursor: "pointer", borderRadius: 999, padding: "9px 14px", fontSize: 14, fontWeight: 700, fontFamily: "inherit",
                background: on ? (isDark ? "#fff" : "#0a0a0a") : (isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)"),
                color: on ? (isDark ? "#0a0a0a" : "#fff") : "var(--text-2)" }}>{s.e} {s.l}</button>
          );
        })}
      </div>
      {item.manual && (
        <button className="tap" onClick={() => pick(null)} style={{ width: "100%", marginTop: 12, background: "transparent", border: 0, color: "var(--text-3)", padding: 12, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Вернуть автоматический выбор
        </button>
      )}
    </div>
  );
}

// Чипы «ИИ заметил» под колесом. David: одна статичная фраза внизу — тупая; лучше живые чипы того,
// что ИИ реально подметил. Если сервер прислал brief.wheelChips (массив коротких строк) — берём их;
// иначе выводим из САМОГО колеса (проседающие/крепкие/пустые сферы) — не бутафория, а реальное
// состояние, и каждый чип тапаемый (→ разбор с ИИ по этой сфере).
function bosWheelChips(data, app) {
  var brief = app && app.aiBrief;
  var fromAI = (brief && Array.isArray(brief.wheelChips)) ? brief.wheelChips.filter(function (x) { return x && ("" + x).trim(); }) : [];
  if (fromAI.length) return fromAI.slice(0, 4).map(function (t) { return { t: "" + t, tone: "ai", prompt: "Подробнее про: " + t }; });
  var SPH = (data && data.spheres) || [];
  if (!data || data.filled === 0) return [{ t: "Заведи первую привычку", tone: "empty", prompt: "С чего начать, чтобы колесо баланса начало заполняться?" }];
  var out = [];
  var lows = SPH.filter(function (s) { return s.n && s.v < 0.45; }).sort(function (a, b) { return a.v - b.v; });
  var tops = SPH.filter(function (s) { return s.n && s.v >= 0.7; }).sort(function (a, b) { return b.v - a.v; });
  var empties = SPH.filter(function (s) { return !s.n; });
  lows.slice(0, 2).forEach(function (s) { out.push({ t: "«" + s.l + "» проседает", tone: "low", prompt: "Сфера «" + s.l + "» проседает. Что сделать, чтобы её подтянуть?" }); });
  if (tops.length) out.push({ t: "«" + tops[0].l + "» держишь крепко", tone: "good", prompt: "«" + tops[0].l + "» у меня в порядке — как удержать и не сбиться?" });
  if (out.length < 3) empties.slice(0, 3 - out.length).forEach(function (s) { out.push({ t: "Пусто в «" + s.l + "»", tone: "empty", prompt: "У меня пусто в сфере «" + s.l + "». Предложи привычку сюда." }); });
  if (!out.length) out.push({ t: "Баланс ровный — так держать", tone: "good", prompt: "Мой баланс ровный. Куда расти дальше?" });
  return out.slice(0, 4);
}

// Мини-версия hero-орба (тот же SiriOrb + живой t + мудовый tint) — для подсказки на колесе
// (David: «орб в подсказке должен быть таким же, как на баннере сверху»). Самоанимируется
// через свой useAIT, чтобы не перерисовывать всё колесо каждый кадр.
function BosHeroOrbMini(props) {
  var tint = props.tint, size = props.size || 28;
  var t = (typeof useAIT === "function") ? useAIT() : ((typeof useT === "function") ? useT() : 0);
  if (typeof SiriOrb !== "function") return null;
  return (
    <svg viewBox="-80 -80 160 160" width={size} height={size} style={{ overflow: "visible", display: "block" }}>
      <SiriOrb r={46} tint={tint} t={t} intensity={1} />
    </svg>
  );
}

// «Из чего сложилась оценка» сферы — ЧЕСТНО из реальных данных (ходы по её привычкам).
// Возвращает массив строк {k, v} + вспомогательные факты для текста лупы.
function bosSphereFacts(app, sphereId, now) {
  now = now || Date.now();
  var _archM = (typeof bosLoadArchived === "function") ? bosLoadArchived() : {};
  var hs = ((app && app.habits) || []).filter(function (h) {
    return h && !h.shelved && !(typeof bosIsArch === "function" && bosIsArch(_archM, "h", h)) && bosSphereFor(h) === sphereId;
  });
  var last7 = 0, prev7 = 0, lastMarkAge = null;
  hs.forEach(function (h) {
    var log = h && h.log; if (!log) return;
    for (var k in log) {
      if (!Object.prototype.hasOwnProperty.call(log, k) || !log[k]) continue;
      var t = Date.parse(k); if (isNaN(t)) continue;
      var age = (now - t) / 86400000; if (age < 0) age = 0;
      if (age < 7) last7++; else if (age < 14) prev7++;
      if (lastMarkAge == null || age < lastMarkAge) lastMarkAge = age;
    }
  });
  var trend = bosSphereTrend(hs, now);
  var rows = [];
  // Ходы по привычкам сферы за неделю (+ квалификатор направления)
  var moveQ = trend === "dn" ? "редеют" : trend === "up" ? "чаще" : "ровно";
  rows.push({ k: "Ходы по привычкам сферы", v: hs.length ? (moveQ + " · " + last7 + " за неделю") : "привычек пока нет" });
  // Свежесть последнего хода
  var freshV = lastMarkAge == null ? "ходов ещё не было" : (lastMarkAge < 1 ? "сегодня" : (Math.round(lastMarkAge) + " дн. назад"));
  rows.push({ k: "Последний ход", v: freshV });
  // Что входит в сферу
  rows.push({ k: "Привычек в сфере", v: hs.length ? (hs.length + " · " + hs.slice(0, 3).map(function (h) { return h.name || "привычка"; }).join(", ") + (hs.length > 3 ? "…" : "")) : "нет" });
  return { rows: rows, habits: hs, last7: last7, prev7: prev7, lastMarkAge: lastMarkAge, trend: trend };
}

// ШТОРКА-ЛУПА СФЕРЫ ЖИЗНИ (David: «тап → разобрать, из чего сложилось + два действия»).
// props: { sphere:{id,l,v,tr}, app, navigate }. Открывается через openSheet(<... />).
function BosSphereLupaSheetLive(props) {
  var sphere = props.sphere || {};
  var app = props.app || (typeof useApp === "function" ? useApp() : {});
  var navigate = props.navigate || function () {};
  var sheet = (typeof useSheet === "function") ? useSheet() : { open: function () {}, close: function () {} };
  var dark = (app && app.themeOverride === "dark");
  var pct = Math.round((sphere.v || 0) * 100);
  var facts = bosSphereFacts(app, sphere.id, Date.now());
  var lbl = sphere.l || "Сфера";
  var preset = (typeof BOS_SPHERE_PRESET !== "undefined" && BOS_SPHERE_PRESET[sphere.id]) || { i: "✨", t: lbl };
  var addHabit = function () {
    if (typeof HabitFormSheetLive === "function") sheet.open(<HabitFormSheetLive mode="create" preset={{ i: preset.i, t: preset.t, sphere: sphere.id }} navigate={navigate} />);
    else if (navigate) navigate("home");
  };
  var askAI = function () { sheet.close(); if (navigate) navigate("ai-chat", { prompt: "Разбери мою сферу «" + lbl + "» — из чего она сложилась и что подтянуть?" }); };
  var isThin = !facts.habits.length || (sphere.v || 0) < 0.25;
  return (
    <div style={{ padding: "0 16px 22px" }}>
      <div style={{ textAlign: "center", fontSize: 19, fontWeight: 800, letterSpacing: "-0.35px", color: "var(--text)", padding: "2px 0 2px" }}>{lbl} · {pct}%</div>
      <div style={{ textAlign: "center", fontSize: 12.5, color: "var(--text-4)", paddingBottom: 12 }}>из чего сложилась оценка</div>
      <div style={{ background: "var(--card)", borderRadius: 20, boxShadow: "var(--card-shadow)", padding: "6px 14px", marginBottom: 10 }}>
        {facts.rows.map(function (r, i) {
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 2px", borderTop: i ? "0.5px solid var(--line)" : "0", fontSize: 13, color: "var(--text-2)" }}>
              <b style={{ color: "var(--text)", fontWeight: 700 }}>{r.k}</b>
              <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "var(--text-3)", textAlign: "right" }}>{r.v}</span>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text-2)", padding: "0 2px 14px" }}>
        {isThin
          ? <span>В сфере «{lbl}» пока мало ходов. Оценка не приговор — она поднимется от первых же регулярных отметок.</span>
          : <span>Оценка «{lbl}» копится за всё время из твоих ходов; свежие весят больше. {facts.trend === "dn" ? "Сейчас ходы редеют — вот почему стрелка вниз." : facts.trend === "up" ? "Сейчас идёшь в рост." : "Держишь ровно."}</span>}
      </div>
      <button onClick={addHabit} className="tap" style={{ width: "100%", border: 0, background: dark ? "#f2f2f5" : "#101828", color: dark ? "#101828" : "#fff", fontSize: 14, fontWeight: 700, borderRadius: 14, padding: 13, cursor: "pointer" }}>Добавить привычку в «{lbl}»</button>
      <button onClick={askAI} className="tap" style={{ width: "100%", border: 0, background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)", color: "var(--text)", fontSize: 14, fontWeight: 700, borderRadius: 14, padding: 13, cursor: "pointer", marginTop: 8 }}>Разобрать с ИИ</button>
    </div>
  );
}

// РАДАР-КОЛЕСО на странице ИИ. props: { app, dark, navigate, tint, openSheet }.
// ЖИВОЕ КОЛЕСО БАЛАНСА (Living Radar). Два жеста:
//  • тап по СФЕРЕ-узлу → аккордеон вниз со списком её привычек/целей;
//  • тап по КОЛЕСУ (радар) → FLIP: радар уезжает ВЛЕВО-вверх маленьким, справа — короткая
//    подсказка Balance AI под твой контекст, а 6 сфер разлетаются в ранжир-список «% ».
// FLIP заякорен на КРУЖКЕ-сфере (.lr-orb), поэтому иконка не прыгает при перестроении.
// Линии радара — non-scaling-stroke: не утоньшаются, когда радар становится маленьким.
/* ЗАМОК на колесе (David): пока не отметил, где ты сейчас, колесо закрыто. Раньше у новичка
   колесо просто НЕ ПОКАЗЫВАЛОСЬ (условие isBlank) — замок не отнимает, а наоборот делает его
   видимым с первого дня и объясняет, зачем оно. Грамматика чёрная плашка + золотой замок — та же,
   что у закрытых карточек «Открытий» (_DiscCard). LIVE. */
function BosWheelLockedLive({ app, dark, openSheet }) {
  var GOLD = "#FEDE34";
  return (
    <div style={{ background: "var(--card)", boxShadow: "var(--card-shadow)", borderRadius: 24, padding: "22px 18px", textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", margin: "0 auto", background: "#0a0a0a", display: "grid", placeItems: "center" }}>
        <I.Lock size={23} color={GOLD} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", color: "var(--text-4)", marginTop: 14 }}>Баланс жизни</div>
      <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.3px", marginTop: 5 }}>Сначала отметь, где ты сейчас</div>
      <div style={{ fontSize: 14, color: "var(--text-3)", marginTop: 7, lineHeight: 1.5, maxWidth: 280, margin: "7px auto 0", textWrap: "balance" }}>
        Шесть коротких вопросов, меньше минуты. Это не заполнит колесо — привычки наполняют его сами. Зато сразу будет видно, куда смотреть.
      </div>
      <button className="tap" onClick={() => { if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} } openSheet(<BosBaselineSurveyLive app={app} />); }}
        style={{ marginTop: 18, border: 0, cursor: "pointer", borderRadius: 999, padding: "13px 22px", fontSize: 15, fontWeight: 800, fontFamily: "inherit",
          background: "linear-gradient(180deg,#FFE96A," + GOLD + ")", color: "#4a3800", boxShadow: "0 4px 14px rgba(254,222,52,0.35)" }}>
        Пройти · 6 вопросов
      </button>
    </div>
  );
}

function BosBalanceWheelLive(props) {
  var app = props.app, dark = !!props.dark, navigate = props.navigate, hideTitle = !!props.hideTitle, bare = !!props.bare;
  var openSheet = props.openSheet || function () {};
  // Замок решает РОДИТЕЛЬ (profile_live), а не этот компонент: ранний возврат отсюда пропустил бы
  // хуки ниже, и в момент прохождения опроса (нет базы → есть база) React упал бы с «хуков стало
  // больше, чем в прошлый раз».
  var uid = React.useMemo(function () { return "bw" + Math.random().toString(36).slice(2, 7); }, []);
  var data = bosWheelData(app);
  var SPH = data.spheres, N = SPH.length;
  var stt = React.useState(null); var selId = stt[0], setSel = stt[1];

  var OUT = 104, R_NODE = 120, TARGET = 0.55, targetPct = Math.round(TARGET * 100);
  var LIST_LEFT = 6, LIST_TOP = 142, ROW_H = 54;
  var pt = function (i, r) { var t = i * Math.PI / 3; return (r * Math.sin(t)).toFixed(1) + "," + (-r * Math.cos(t)).toFixed(1); };
  var hex = function (L) { var a = []; for (var i = 0; i < N; i++) a.push(pt(i, OUT * L)); return a.join(" "); };
  var dataPts = SPH.map(function (s, i) { return pt(i, OUT * Math.max(s.v, 0.05)); }).join(" ");
  // ТЕНЬ — как человек САМ себя оценил в базовом опросе (1..5 → 0..1). Рисуется тонким контуром
  // ПОВЕРХ золотой заливки, но заливка остаётся тем, что он реально ДЕЛАЕТ. Весь смысл — в разрыве
  // между «ценю» и «делаю»: колесо никогда не показывает дела, которых не было.
  var base = (app && app.baseline) || null;
  var basePts = base ? SPH.map(function (s, i) { return pt(i, OUT * Math.max((base[s.id] || 0) / 5, 0.05)); }).join(" ") : null;
  var total = N ? Math.round(SPH.reduce(function (a, s) { return a + (s.v || 0); }, 0) / N * 100) : 0;
  var gridCol = dark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.10)";
  var spokeCol = dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.07)";
  var goldDash = dark ? "rgba(240,200,40,0.50)" : "rgba(216,164,0,0.46)";
  var goldInk = dark ? "#F0C838" : "#C8930A";
  var trackCol = dark ? "rgba(255,255,255,0.13)" : "rgba(0,0,0,0.08)";
  var iconCol = dark ? "#e8e8ea" : "#101828";
  var RC = 2 * Math.PI * 20;

  var weak = null; SPH.forEach(function (s) { if (s.n && (!weak || s.v < weak.v)) weak = s; });
  var strong = null; SPH.forEach(function (s) { if (s.n && (!strong || s.v > strong.v)) strong = s; });
  var emptySph = SPH.filter(function (s) { return !s.n; });
  var cap = function (t) { return t ? t.charAt(0).toUpperCase() + t.slice(1) : t; };
  function hintFor(s) {
    var q = "«" + s.l + "»";
    if (!s.n) return [q + " пока пустует", "Заведи первую привычку — сфера начнёт наполняться."];
    if (weak && s.id === weak.id) return [q + " отстаёт сильнее всех", cap(BOS_SPHERE_NUDGE[s.id] || "небольшой ход уже поднимет сферу") + "."];
    if (s.v >= 0.7) return [q + " — твоя сильная сфера", "Здесь ты на подъёме. Оставь силы на остальные."];
    return [q + " в движении", cap(BOS_SPHERE_NUDGE[s.id] || "небольшой ход уже поднимет сферу") + "."];
  }
  // короткая подсказка ИИ под контекст — для режима списка (справа от маленького радара)
  function insightNode() {
    var filled = SPH.filter(function (s) { return s.n; });
    if (!filled.length) return <span>Заведи первую привычку — <b>Balance AI</b> начнёт собирать твой баланс по сферам.</span>;
    var en = SPH.length - filled.length;
    if (filled.length <= 2 && en >= 3) return <span>Ты вкладываешься в {filled.map(function (s) { return "«" + s.l + "»"; }).join(" и ")}. Ещё {en} {en === 1 ? "сфера ждёт" : (en < 5 ? "сферы ждут" : "сфер ждут")} первого хода.</span>;
    if (strong && weak && strong.id !== weak.id) return <span>Сильнее всего — «{strong.l}». «{weak.l}» просел: {BOS_SPHERE_NUDGE[weak.id] || "небольшой ход поднимет сферу"}.</span>;
    return <span>Сферы держатся ровно — редкий баланс. Так держать.</span>;
  }
  var nudge = null;
  if (weak) nudge = { s: weak, t: "«" + weak.l + "» отстаёт — " + (BOS_SPHERE_NUDGE[weak.id] || "небольшой ход уже поднимет сферу") };
  else if (emptySph.length) nudge = { s: emptySph[0], t: "Заведи первую привычку — колесо начнёт заполняться" };

  var selSphere = null; SPH.forEach(function (s) { if (s.id === selId) selSphere = s; });
  var byV = SPH.slice().sort(function (a, b) { return b.v - a.v; });

  var rootRef = React.useRef(null), radarRef = React.useRef(null), dialRef = React.useRef(null);
  var nodeRefs = React.useRef({}), isListRef = React.useRef(false), animatingRef = React.useRef(false);
  var EASE = "cubic-bezier(.32,.72,0,1)";
  var orbOf = function (id) { var n = nodeRefs.current[id]; return n && n.querySelector(".lr-orb"); };

  function placeWheel() {
    SPH.forEach(function (s, i) {
      var n = nodeRefs.current[s.id]; if (!n) return;
      var t = i * Math.PI / 3;
      n.style.transition = "none";
      n.style.left = "calc(50% + " + (R_NODE * Math.sin(t)).toFixed(1) + "px)";
      n.style.top = (152 - R_NODE * Math.cos(t)).toFixed(1) + "px";
      n.style.transform = "translate(-50%,-50%)";
    });
  }
  React.useLayoutEffect(function () { if (!isListRef.current && !animatingRef.current) placeWheel(); });

  function dialListTransform() {
    var r = radarRef.current.getBoundingClientRect(), d = dialRef.current.getBoundingClientRect();
    var dcx = d.left + d.width / 2, dcy = d.top + d.height / 2;
    var tx = r.left + 56, ty = r.top + 60;                          // маленький радар — ВЛЕВО-вверх
    return "translate(-50%,-50%) translate(" + (tx - dcx).toFixed(1) + "px," + (ty - dcy).toFixed(1) + "px) scale(.58)";
  }
  function flipList(toList) {
    if (animatingRef.current) return; animatingRef.current = true;
    var root = rootRef.current, dial = dialRef.current;
    var order = SPH.map(function (s) { return s.id; });
    var first = {}; order.forEach(function (id) { first[id] = orbOf(id).getBoundingClientRect(); });   // якорь — КРУЖОК
    root.classList.add("flying");                                                                     // прячем имена/полосы, пока летят кружки
    if (toList) {
      // --si = порядковый номер строки сверху вниз: шкалы вырастают каскадом (лёгкая волна),
      // а не все разом (David 2026-07-14). CSS читает var(--si) в transition-delay шкалы.
      byV.forEach(function (s, i) { var n = nodeRefs.current[s.id]; n.style.setProperty("--si", i); n.style.transition = "none"; n.style.left = LIST_LEFT + "px"; n.style.top = (LIST_TOP + i * ROW_H) + "px"; n.style.transform = "translate(0,0)"; });
    } else placeWheel();
    root.classList.toggle("list", toList);
    var from = getComputedStyle(dial).transform, to = toList ? dialListTransform() : "translate(-50%,-50%)";
    dial.getAnimations().forEach(function (a) { a.cancel(); });
    dial.animate([{ transform: from }, { transform: to }], { duration: 560, easing: EASE, fill: "forwards" });
    // якорь — КРУЖОК: смещаем узел так, чтобы кружок стартовал из своей прежней точки (иконка не прыгает)
    var off = {}; order.forEach(function (id) { var lo = orbOf(id).getBoundingClientRect(); off[id] = { dx: first[id].left - lo.left, dy: first[id].top - lo.top }; });
    order.forEach(function (id) { var n = nodeRefs.current[id]; n.style.transform = "translate(" + off[id].dx.toFixed(1) + "px," + off[id].dy.toFixed(1) + "px) " + (toList ? "" : "translate(-50%,-50%)"); });
    void root.offsetWidth;
    order.forEach(function (id) { var n = nodeRefs.current[id]; n.style.transition = "transform .56s " + EASE; n.style.transform = toList ? "translate(0,0)" : "translate(-50%,-50%)"; });
    setTimeout(function () { animatingRef.current = false; root.classList.remove("flying"); }, 580);   // сели → имена/полосы проявляются
    isListRef.current = toList;
  }
  function tapRadar() { if (isListRef.current) flipList(false); else { setSel(null); flipList(true); } }
  // Стандарт: тап по сфере ВЕЗДЕ раскрывает аккордеон (как на «Балансе жизни»). В режиме списка
  // сначала плавно сворачиваем колесо, затем открываем аккордеон — тот же результат, что в колесе.
  function tapNode(s) { if (isListRef.current) { setSel(s.id); flipList(false); } else setSel(s.id === selId ? null : s.id); }

  var strokeFx = { vectorEffect: "non-scaling-stroke" };
  return (
    <div style={bare ? { padding: 0 } : { background: "var(--card)", borderRadius: 24, boxShadow: "var(--card-shadow)", padding: "14px 16px 14px" }}>
      <div className="bosLR" ref={rootRef}>
        <div className="lr-head">
          {!hideTitle ? <span className="lr-title">Баланс жизни</span> : <span />}
          <span className="lr-pill"><b>{total}%</b><span>· цель {targetPct}%</span></span>
        </div>

        <div className="lr-radar" ref={radarRef}>
          <svg className="lr-svg" ref={dialRef} viewBox="-150 -150 300 300" onClick={tapRadar}>
            <defs>
              <radialGradient id={uid} cx="50%" cy="46%" r="62%">
                <stop offset="0%" stopColor="#FFD64A" stopOpacity="0.50" />
                <stop offset="100%" stopColor="#FF9F45" stopOpacity="0.12" />
              </radialGradient>
            </defs>
            <polygon points={hex(1)} fill="none" stroke={gridCol} strokeWidth="1.2" style={strokeFx} />
            <polygon points={hex(0.667)} fill="none" stroke={gridCol} strokeWidth="1.1" opacity="0.75" style={strokeFx} />
            <polygon points={hex(0.333)} fill="none" stroke={gridCol} strokeWidth="1.1" opacity="0.5" style={strokeFx} />
            {SPH.map(function (s, i) { var p = pt(i, OUT).split(","); return <line key={"sp" + i} x1="0" y1="0" x2={p[0]} y2={p[1]} stroke={spokeCol} strokeWidth="1.1" style={strokeFx} />; })}
            <polygon points={hex(TARGET)} fill="none" stroke={goldDash} strokeWidth="1.3" strokeDasharray="3 5" strokeLinecap="round" style={strokeFx} />
            <polygon points={dataPts} fill={"url(#" + uid + ")"} stroke="#EF9F14" strokeWidth="2" strokeLinejoin="round" style={strokeFx} />
            {/* Точки на вершинах САМОЙ оранжевой фигуры (David 2026-07-16: «не хватает точечек
                на оранжевом, аккуратных»): видно, где именно фигура ломается по каждой сфере. */}
            {SPH.map(function (s, i) {
              var p = pt(i, OUT * Math.max(s.v, 0.05)).split(",");
              return (
                <g key={"dpt" + i}>
                  <circle cx={p[0]} cy={p[1]} r="3.4" fill={dark ? "#161619" : "#fff"} style={strokeFx} />
                  <circle cx={p[0]} cy={p[1]} r="2.1" fill="#EF9F14" stroke="#FEDE34" strokeWidth="0.8" style={strokeFx} />
                </g>
              );
            })}
            {/* Тень самооценки — ПОВЕРХ заливки, тонким пунктиром, без заливки: она не «результат»,
                а ориентир. Там, где контур выше золота, — разрыв между «важно» и «делаю». */}
            {basePts && <polygon points={basePts} fill="none" stroke={dark ? "rgba(255,255,255,0.55)" : "rgba(10,10,10,0.42)"} strokeWidth="1.4" strokeDasharray="4 4" strokeLinejoin="round" strokeLinecap="round" style={strokeFx} />}
            {/* Точки-якоря на вершинах осей (David 2026-07-14): «непонятно, к кому какой угол привязан».
                По одной аккуратной точке на конце каждой оси — прямо под своей сферой. Заполненная —
                золотая с ободком, пустая — тихая серая. Небольшие, но заметные; тянутся к иконке сферы. */}
            {SPH.map(function (s, i) {
              var p = pt(i, OUT).split(",");
              var lit = !!s.n;
              return (
                <g key={"vtx" + i}>
                  <circle cx={p[0]} cy={p[1]} r="4.6" fill={dark ? "#161619" : "#fff"} style={strokeFx} />
                  <circle cx={p[0]} cy={p[1]} r="2.8" fill={lit ? "#EF9F14" : gridCol} stroke={lit ? "#FEDE34" : "none"} strokeWidth={lit ? 0.9 : 0} style={strokeFx} />
                </g>
              );
            })}
          </svg>

          {/* подсказка ИИ — видна только в режиме списка, справа от маленького радара */}
          <div className="lr-insight"><span className="t">{insightNode()}</span></div>

          {SPH.map(function (s, i) {
            var fill = s.n ? Math.max(s.v, 0.03) : 0, off = (RC * (1 - fill)).toFixed(1);
            var pct = s.n ? Math.round(s.v * 100) : 0;
            var nm = (typeof BOS_SPHERE_ICON !== "undefined" && BOS_SPHERE_ICON[s.id]) || "Sparkles";
            var on = s.id === selId;
            return (
              <button key={s.id} className={"lr-node" + (on ? " sel" : "")} data-id={s.id} ref={function (el) { nodeRefs.current[s.id] = el; }}
                onClick={function () { tapNode(s); }}>
                <span className="lr-orb">
                  <svg className="lr-ring" viewBox="0 0 46 46">
                    <defs>
                      <linearGradient id={uid + "r" + i} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#EF9F14" /><stop offset="1" stopColor="#FEDE34" /></linearGradient>
                    </defs>
                    <circle cx="23" cy="23" r="20" fill="none" stroke={trackCol} strokeWidth="3" />
                    {fill > 0 ? <circle cx="23" cy="23" r="20" fill="none" stroke={"url(#" + uid + "r" + i + ")"} strokeWidth="3" strokeLinecap="round" strokeDasharray={RC.toFixed(1)} strokeDashoffset={off} transform="rotate(-90 23 23)" style={{ transition: "stroke-dashoffset .7s " + EASE }} /> : null}
                  </svg>
                  <span className="lr-disc">{((typeof bosIconEl === "function") && bosIconEl(nm, { size: 17, color: iconCol })) || s.e}</span>
                </span>
                <span className="lr-nm">{s.l}</span>
                <span className="lr-meta"><span className="lr-bar"><i style={{ "--w": pct + "%" }} /></span><span className="lr-val">{pct}</span></span>
              </button>
            );
          })}
        </div>

        {selSphere ? (function () {
          var s = selSphere, h = hintFor(s), pct = s.n ? Math.round(s.v * 100) : 0;
          var nm = (typeof BOS_SPHERE_ICON !== "undefined" && BOS_SPHERE_ICON[s.id]) || "Sparkles";
          return (
            <div className="lr-panel" key={s.id}>
              <button className="lr-phead" onClick={function () { setSel(null); }}>
                <span className="lr-orb" style={{ width: 40, height: 40, flexShrink: 0 }}>
                  <span className="lr-disc" style={{ width: 40, height: 40 }}>{((typeof bosIconEl === "function") && bosIconEl(nm, { size: 19, color: iconCol })) || s.e}</span>
                </span>
                <span className="h"><b>{h[0]}{s.n ? " · " + pct + "%" : ""}</b><span>{h[1]}</span></span>
                <svg className="lr-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 15l6-6 6 6" /></svg>
              </button>
              {s.items && s.items.length ? (
                <div className="lr-items">
                  {s.items.map(function (it, j) { return (
                    <button className="lr-item tap" key={j} type="button"
                      onClick={function () { if (openSheet) openSheet(<BosSphereMoveSheetLive item={it} cur={s.id} app={app} />); }}
                      style={{ width: "100%", border: 0, background: "transparent", font: "inherit", color: "inherit", textAlign: "left", cursor: "pointer" }}>
                      <span className="ico">{it.emoji}</span><span className="nm">{it.name}</span>
                      <span className="tag">{it.manual ? "вручную" : (it.kind === "goal" ? "цель" : "привычка")}</span>
                    </button>
                  ); })}
                </div>
              ) : (
                <div className="lr-empty">
                  <p>В сфере «{s.l}» пока нет привычек. Заведи первую — и сфера начнёт наполняться.</p>
                  <button className="lr-addbtn" onClick={function (e) { e.stopPropagation(); var pr = (typeof BOS_SPHERE_PRESET !== "undefined" && BOS_SPHERE_PRESET[s.id]) || { i: "✨", t: s.l }; if (typeof HabitFormSheetLive === "function") openSheet(<HabitFormSheetLive mode="create" preset={{ i: pr.i, t: pr.t, sphere: s.id }} navigate={navigate} />); else if (navigate) navigate("home"); }}>{typeof I !== "undefined" && I.Plus ? <I.Plus size={14} /> : "＋"} Добавить привычку</button>
                </div>
              )}
              <div className="lr-ai">
                <span className="lr-aiico"><svg width="13" height="13" viewBox="0 0 24 24" fill={goldInk}><path d="M12 2.2l2.4 7.4 7.4 2.4-7.4 2.4-2.4 7.4-2.4-7.4-7.4-2.4 7.4-2.4z" /></svg></span>
                <span className="s"><b>Balance AI</b> сам раскладывает твои привычки и цели по шести сферам жизни и считает, где ты в балансе — тебе ничего не нужно сортировать вручную.</span>
              </div>
            </div>
          );
        })() : (
          <div className="lr-foot" style={{ marginTop: 2 }}>
            {nudge && (
              <button onClick={function () { setSel(nudge.s.id); }} className="tap" data-no-haptic
                style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", background: dark ? "rgba(240,200,40,0.12)" : "rgba(240,195,10,0.10)", border: "0.5px solid " + (dark ? "rgba(240,200,40,0.30)" : "rgba(216,164,0,0.28)"), borderRadius: 16, padding: "12px 13px", cursor: "pointer", textAlign: "left" }}>
                <span style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", background: dark ? "rgba(240,200,40,0.22)" : "rgba(240,195,10,0.18)" }}>{((typeof bosIconEl === "function") && bosIconEl((typeof BOS_SPHERE_ICON !== "undefined" && BOS_SPHERE_ICON[nudge.s.id]) || "Sparkles", { size: 16, color: goldInk })) || nudge.s.e}</span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: "var(--text)", lineHeight: 1.35 }}>{nudge.t}</span>
                {typeof I !== "undefined" && I.ChevronRight ? <I.ChevronRight size={15} color={goldInk} /> : null}
              </button>
            )}
            <div style={{ display: "flex", gap: 7, alignItems: "flex-start", marginTop: 12, padding: "0 2px" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill={dark ? "#8e8e93" : "#9c9ca3"} style={{ flexShrink: 0, marginTop: 1 }}><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1 5h2v2h-2V7zm0 4h2v6h-2v-6z" /></svg>
              <div style={{ fontSize: 10.5, lineHeight: 1.45, color: "var(--text-5)", fontWeight: 500 }}>Кольцо у сферы — её заполненность. Тап по сфере — что в неё входит; тап по кругу — все сферы в процентах.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
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
  var circleBalanceOn = opts.circleBalanceOn !== false; // «Баланс круга» по умолч. ВКЛ; владелец мог снять
  var linked = (app.habits || []).filter(function (h) { return (goalLike.habitIds || []).indexOf(h.id) >= 0; });
  var teamObj = {
    name: goalLike.name || "Цель", emblem: goalLike.emoji || "🎯", accent: goalLike.color || BOS_GREY, vis: vis,
    goal: (goalLike.target || 0) + " " + (goalLike.unit || ""), type: type,
    target: goalLike.target || 0, current: 0, unit: goalLike.unit || "", stake: stake, circleBalanceOn: circleBalanceOn,
    date: goalLike.deadline || "Этот месяц", progress: 0, members: [],
    habits: linked.map(function (h, i) { return { name: h.name, emoji: h.emoji, isMain: i === 0 }; }),
  };
  if (goalLike.challenge) teamObj.challenge = goalLike.challenge;
  var nt = app.addTeam(teamObj);
  // Личные привычки цели теперь принадлежат кругу: teamId связывает, goalOnly снимаем (пусть видно),
  // goalId чистим (цели больше нет). teamHabitId долетит из облака (миррор отметок в командный лог).
  linked.forEach(function (h) { app.updateHabit(h.id, { teamId: nt._id, goalId: null, goalOnly: false }); });
  if (goalLike.id != null && app.removeGoal) app.removeGoal(goalLike.id); // цель → круг (не остаётся дублем)
  // opts.route — вызывающий может остаться НА СВОЁМ экране (same-route → params-refresh,
  // без перехода): деталь цели передаёт "goal-detail" и блок «Люди» вырастает на месте.
  if (opts.navigate) opts.navigate(opts.route || "team-detail", { team: nt, from: opts.from || "habits" });
  (async function () {
    try {
      if (window.bosCloud && window.bosCloud.enabled()) {
        var row = await window.bosCloud.createTeam({ name: nt.name, emblem: teamObj.emblem, vis: vis, goalKind: nt.goal, goalTarget: nt.target, goal: { type: type, target: nt.target, unit: nt.unit, title: nt.name, stake: stake, accent: teamObj.accent } });
        if (row && row.id) {
          if (app.updateTeam) app.updateTeam(nt._id, { cloudId: row.id });
          // Персистим тумблер «Баланс круга» только когда он ВЫКЛючен (в БД default true = вкл, значит
          // отличие от дефолта = только «выкл»; лишней записи на каждый круг не делаем). Graceful до ALTER.
          if (!circleBalanceOn && window.bosCloud.updateTeam) { try { window.bosCloud.updateTeam(row.id, { circleBalanceOn: false }); } catch (e) {} }
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
/* ПУЛЬС КРУГА (David): орбита — живой индикатор. habits[].done → спутник ЗАГОРАЕТСЯ тоном
   ЦВЕТА ПРИВЫЧКИ (habits[].color, фолбэк — цвет цели); progress (0..1) → тонкое кольцо
   прогресса вокруг центра в цвет цели; people[].active → колечко «сегодня в деле» у лица.
   Одна механика на личную цель И команду: чего нет в данных — просто не рисуется. */
function GoalOrbitMini({ centerEmoji, centerColor, habits = [], people = [], size = 128, dark = false, fade = false, progress = null }) {
  var C = size / 2;
  var cR = Math.round(size * 0.19);            // центр-диск (радиус)
  var r1 = size * 0.315, r2 = size * 0.455;    // радиусы колец (привычки / люди)
  var hbAll = (habits || []).filter(Boolean), ppAll = (people || []).filter(Boolean);
  // «ГОНКА ОРБИТ» (мягкая версия идеи David «кто раньше пришёл — тот ближе к цели»):
  // люди раскладываются по своим кольцам в порядке СЕГОДНЯШНЕГО вклада — лидер дня ближе
  // к центру. Только порядок внутри людских колец: привычки остаются ближними, кольца не
  // перестраиваются, композиция не дёргается.
  ppAll = ppAll.slice().sort(function (a, b) {
    var pa = (typeof a.progress === "number") ? a.progress : (a.active ? 1 : 0);
    var pb = (typeof b.progress === "number") ? b.progress : (b.active ? 1 : 0);
    return pb - pa;
  });
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
  var ringStep = size * 0.16, r0 = Math.max(size * 0.315, progOuter + hSz / 2 + 3);
  // ИЕРАРХИЯ РАЗМЕРОВ (David: «ближе к центру — больше, дальше — чуть меньше, и не
  // пересекаться»): размер спутника плавно убывает с номером кольца (×0.9 за кольцо).
  // Центр остаётся крупнейшим; лица на дальних кольцах автоматически мельче привычек
  // ближних и перестают наезжать.
  var szFor = function (base, k) { return Math.max(14, Math.round(base * Math.pow(0.9, k))); };
  var buildRings = function (items, startK, dSz) {
    var out = [], k = startK, idx = 0;
    while (idx < items.length && k < 9) {
      var R = r0 + k * ringStep;
      var sk = szFor(dSz, k);
      var cap = Math.max(1, Math.floor((2 * Math.PI * R) / (sk * 3.0))); // разреженно (David: 4→1 кольцо, 10→3-4 кольца)
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
  var discBg = sheen + (dark ? "linear-gradient(160deg, #464c58, #30353f)" : "linear-gradient(160deg, var(--disc-a, #eef1f6), var(--disc-b, #dadfe7))");
  var discShadow = (typeof bosTileGlass === "function" ? bosTileGlass(dark) : "0 1px 3px rgba(0,0,0,0.12)");
  // ЦЕНТР живёт внутри кольца прогресса → круглое стекло (блик внутри, тень равномерная):
  // направленный блик выбеливал верх и кольцо казалось несимметричным (David). Спутники на
  // линиях орбит — без охватывающего кольца, их стекло не трогаем (вид устраивает).
  var orbSheen = (typeof BOS_ORB_SHEEN !== "undefined" ? BOS_ORB_SHEEN + ", " : sheen);
  var orbShadow = (typeof bosOrbGlass === "function" ? bosOrbGlass(dark) : discShadow);
  // Центр = ПОДЛОЖКА ИКОНКИ ЦЕЛИ → красится в НАСЫЩЕННЫЙ тон цвета цели (David: «цвет должен влиять на
  // подложку иконки цели»). Реальный цвет → тон + белый глиф; нейтральный → тот же серый диск. Привычки/
  // люди на кольцах остаются серыми (они не цель).
  var cReal = typeof centerColor === "string" && centerColor[0] === "#" && centerColor.length === 7 && centerColor.toLowerCase() !== "#0a0a0a" && centerColor !== BOS_GREY;
  // ТЕМА-ЗАВИСИМАЯ тонировка (David: «цвета с пикера в тёмной должны чуть отличаться»):
  // светлая — осветляем к белому (пастель), тёмная — углубляем к тёмной подложке
  // (насыщенный глубокий тон, без «засветки»).
  var centerBg = cReal
    ? (orbSheen + (dark
        ? ((typeof bosMixHex === "function") ? bosMixHex(centerColor, "#101014", 0.22) : centerColor)
        : ((typeof bosLightenHex === "function") ? bosLightenHex(centerColor, 0.25) : centerColor)))
    : (orbSheen + (dark ? "linear-gradient(160deg, #464c58, #30353f)" : "linear-gradient(160deg, var(--disc-a, #eef1f6), var(--disc-b, #dadfe7))"));
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
    // Скорость = РОВНО КАК ВО ВСЕЛЕННОЙ (David: «сделай как в режиме вселенной»). Вселенная: spinT = 0.7×сек
    // (useUniSpin), OrbitField spin(ring0)=0.06 → 0.042 рад/с → полный оборот ~150с; внешние кольца
    // ×(1+0.18k) медленнее. В CSS-длительность оборота это 150с + 27с/кольцо (было 76 — вдвое быстрее).
    var cw = (k % 2 === 0), dir = cw ? "bosSpin" : "bosSpinR", rev = cw ? "bosSpinR" : "bosSpin", dur = (150 + k * 27) + "s";
    return (
      <React.Fragment key={(isPeople ? "p" : "h") + k}>
        {ring(R)}
        <div style={{ position: "absolute", inset: 0, animation: dir + " " + dur + " linear infinite", willChange: "transform" }}>
          {place(items, R, dSz, k * 0.35, function (it) {
            if (isPeople) {
              // ПУЛЬС 2.0: кольцо человека — ЕГО зона ответственности, заполняется долей
              // закрытых им сегодня привычек круга (progress 0..1 → дуга в цвет цели);
              // центр показывает общий счёт. Нет данных о доле → active-фолбэк: отметился
              // (его «всё» = одна отметка) → полное кольцо. Тот же язык, что кольцо центра.
              var pp = (typeof it.progress === "number" && isFinite(it.progress)) ? Math.max(0, Math.min(1, it.progress)) : (it.active ? 1 : 0);
              return (
                <span style={{ position: "relative", display: "block", width: "100%", height: "100%" }}>
                  {typeof BuddyFaceLive === "function" ? <BuddyFaceLive avatar={it.avatar} name={it.name} size={dSz} /> : null}
                  {pp > 0 && (
                    <span aria-hidden style={{ position: "absolute", inset: -3, borderRadius: "50%", pointerEvents: "none",
                      background: "conic-gradient(" + accent + " " + Math.round(pp * 360) + "deg, " + (dark ? "rgba(255,255,255,0.16)" : "rgba(10,10,10,0.10)") + " 0)",
                      WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1.6px))",
                      mask: "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1.6px))" }} />
                  )}
                </span>
              );
            }
            // ПУЛЬС: привычка ЗАКРЫТА сегодня → спутник загорается тоном СВОЕГО цвета
            // (фолбэк — цвет цели) + мягкое свечение; не закрыта → приглушённый тон цели.
            var hc = (typeof it.color === "string" && it.color[0] === "#" && it.color.length >= 7 && it.color.toLowerCase() !== "#0a0a0a" && it.color !== BOS_GREY) ? it.color : (cReal ? centerColor : null);
            var lit = !!it.done && !!hc;
            var bg = lit ? (sheen + (dark ? bosMixHex(hc, "#101014", 0.2) : bosLightenHex(hc, 0.28))) : hDiscBg;
            var glow = lit ? (discShadow + ", 0 0 10px " + hc + (dark ? "59" : "59")) : discShadow;
            return <span style={{ width: "100%", height: "100%", borderRadius: "50%", background: bg, boxShadow: glow, transition: "background 0.45s ease, box-shadow 0.45s ease", display: "grid", placeItems: "center", fontSize: iconSz, lineHeight: 1 }}>{typeof bosIcon === "function" ? bosIcon(it.emoji, iconSz, null) : (it.emoji || "✨")}</span>;
          }, rev + " " + dur + " linear infinite")}
        </div>
      </React.Fragment>
    );
  };
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }} aria-hidden>
      {hRings.rings.map(function (rg) { var s = szFor(hSz, rg.k); return renderRing(rg.R, rg.k, rg.items, s, Math.round(s * 0.52), false); })}
      {pRings.rings.map(function (rg) { var s = szFor(pSz, rg.k); return renderRing(rg.R, rg.k, rg.items, s, Math.round(s * 0.52), true); })}
      {/* центр = значок цели, СТАТИЧНЫЙ по центру */}
      <span style={{ position: "absolute", left: C - cR, top: C - cR, width: cR * 2, height: cR * 2, borderRadius: "50%", background: centerBg, boxShadow: (progress != null && progress >= 1) ? (orbShadow + ", 0 0 13px " + accent + (dark ? "66" : "4d")) : orbShadow, transition: "box-shadow 0.5s ease", display: "grid", placeItems: "center", fontSize: cIcon, lineHeight: 1 }}>{typeof bosIcon === "function" ? bosIcon(centerEmoji || "🎯", cIcon, centerInk) : (centerEmoji || "🎯")}</span>
      {/* ПУЛЬС: тонкое кольцо прогресса цели вокруг центра (личная цель и команда — одинаково).
          conic-градиент, маской вырезано в кольцо ~2.5px; на 100% центр мягко светится (выше). */}
      {progress != null && (
        <span aria-hidden style={{ position: "absolute", left: C - cR - 5, top: C - cR - 5, width: (cR + 5) * 2, height: (cR + 5) * 2, borderRadius: "50%", pointerEvents: "none",
          background: "conic-gradient(" + accent + " " + Math.round(Math.max(0, Math.min(1, progress)) * 360) + "deg, " + (dark ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.65)") + " 0)",
          WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2.4px))",
          mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2.4px))" }} />
      )}
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
  // Visual = the unified animated ShareSheetLive (centre = this habit's image, people grow around).
  return <ShareSheetLive kind="habit" dark={dark} subject={{ name: habit && habit.name, emoji: habit && habit.emoji, color: habit && habit.color, link: shareUrl }} />;
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
                      {doneToday && <span style={{ fontSize: 11, fontWeight: 700, color: bosReadableInk(accent, isDark) }}>✓ сегодня</span>}
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
            <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 2, lineHeight: 1.4 }}>Новый друг по твоей ссылке — <b style={{ color: "var(--text-2)" }}>+150 XP</b>. А вести привычку вместе — видите отметки друг друга.</div>
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
// ── СОСТОЯНИЕ v3 — НАШ орб + НАШИ цвета (David 2026-07-04, live-фидбек: «графит-золото и плоский
// CSS-орб — не наши; используй наш орб и его цвета: зелёный/синий/фиолетовый/красный/жёлтый; орб не
// должен ездить вверх; это должна быть маленькая ШТОРКА, всплывающая раз в день к вечеру»). Радуга
// онбординга (moodSpectrum) + лица (MOOD_FACES) + слова (MOOD_WORDS), 7 шагов; рендерим НАШИМ StateOrb
// (tintFromMood). dayMoods хранит индекс шага (0..6). Демо НЕ трогаем. См. StateSheetLive (шторка). */
var BOS_STATE = [
  { i: "😣", t: "Тяжело",   c: "#FF5A5F" },
  { i: "😞", t: "Плохо",    c: "#FF884A" },
  { i: "😕", t: "Так себе", c: "#FFB43C" },
  { i: "😐", t: "Нормально", c: "#E7C63C" },
  { i: "🙂", t: "Неплохо",  c: "#7CC24F" },
  { i: "😄", t: "Хорошо",   c: "#34C759" },
  { i: "🤩", t: "Отлично",  c: "#19B6E8" },
];
// ОТТЕНКИ состояния (David 2026-07-07): чипы-грани поверх слайдера-валентности. Слайдер = «насколько
// хорошо» (одно значение), чипы = «что именно чувствуешь» (несколько, мультивыбор). Храним id-шники в
// dayNotes[день].tags (инфраструктура уже была). Орб/чипы красятся ОДНИМ цветом текущей валентности →
// единая связанная структура состояния.
// lo/hi = диапазон валентности (0..6), в котором грань уместна. David 2026-07-09: «Тревога/
// Раздражение не должны висеть при Хорошо». Светлые грани живут вверху шкалы, тяжёлые — внизу,
// спокойные (Спокойствие/Собран) — почти во всём диапазоне. Уже выбранную грань НЕ прячем.
var BOS_FACETS = [
  { id: "energy",   i: "⚡",  t: "Энергия",     lo: 3, hi: 6 },
  { id: "calm",     i: "🌿",  t: "Спокойствие", lo: 2, hi: 6 },
  { id: "joy",      i: "😊",  t: "Радость",     lo: 4, hi: 6 },
  { id: "inspired", i: "✨",  t: "Вдохновение", lo: 4, hi: 6 },
  { id: "focus",    i: "🎯",  t: "Собран",      lo: 3, hi: 6 },
  { id: "tired",    i: "😮‍💨", t: "Усталость",   lo: 0, hi: 3 },
  { id: "anxious",  i: "😣",  t: "Тревога",     lo: 0, hi: 2 },
  { id: "sad",      i: "😔",  t: "Грусть",      lo: 0, hi: 2 },
  { id: "angry",    i: "😤",  t: "Раздражение", lo: 0, hi: 2 },
];
// Грани под текущую валентность (bucket 0..6) + всё, что уже отмечено (чтобы выбор не пропадал при
// сдвиге слайдера). Пустой набор невозможен — Спокойствие/Собран/Усталость покрывают середину.
function bosFacetsForBucket(bucket, tags) {
  var b = Math.max(0, Math.min(6, bucket | 0));
  var sel = Array.isArray(tags) ? tags : [];
  return BOS_FACETS.filter(function (f) {
    return (b >= (f.lo || 0) && b <= (f.hi != null ? f.hi : 6)) || sel.indexOf(f.t) >= 0;
  });
}
// Храним ЯРЛЫК (Энергия…), а не id — так грани естественно ложатся в существующий показ тегов дня
// (журнал: «#Энергия») и в XP-«отмечено». Резолвер по ярлыку добавляет эмодзи для показа в виджете.
function bosFacetByLabel(t) { for (var i = 0; i < BOS_FACETS.length; i++) { if (BOS_FACETS[i].t === t) return BOS_FACETS[i]; } return null; }
// Цвет орба по валентности 0..1 = наша радуга онбординга (красный→…→синий), НАШ tintFromMood.
function bosStateTintForV(v) {
  v = Math.max(0, Math.min(1, (typeof v === "number" && isFinite(v)) ? v : 0.6));
  var hex = (typeof moodSpectrum === "function") ? moodSpectrum(v) : (BOS_STATE[Math.round(v * (BOS_STATE.length - 1))] || BOS_STATE[3]).c;
  return (typeof tintFromMood === "function") ? tintFromMood(hex) : ["#cfe1ff", "#7aa4d0", "#2c4d76"];
}
// Валентность 0..1 → индекс шага (0..6). Использует наш moodBucket (7 корзин), совпадает с MOOD_FACES.
function bosStateStepFromV(v) {
  v = Math.max(0, Math.min(1, (typeof v === "number" && isFinite(v)) ? v : 0.6));
  var n = BOS_STATE.length - 1;
  var i = (typeof moodBucket === "function") ? moodBucket(v) : Math.round(v * n);
  return Math.max(0, Math.min(n, i));
}
// Безопасное чтение шага из dayMoods (клампит старые/чужие индексы — не роняет экран).
function bosStateResolve(idx) {
  idx = idx | 0;
  return BOS_STATE[Math.max(0, Math.min(BOS_STATE.length - 1, idx))] || BOS_STATE[3];
}

// ШТОРКА состояния (David live-фидбек 2026-07-04): маленькая всплывающая шторка «Как ты?», НАШ орб
// (StateOrb) морфится цветом+лицом слайдером (орб НА МЕСТЕ, не ездит), быстрое «Отметить». Всплывает
// по тапу виджета И сама раз в день к вечеру (см. home_live evening-prompt). props: { evening }.
function StateSheetLive(props) {
  const app = (typeof useApp === "function") ? useApp() : null;
  const sheet = (typeof useSheet === "function") ? useSheet() : { close: function () {} };
  const isDark = !!(app && app.themeOverride === "dark");
  const tk = (typeof bosTodayKey === "function") ? bosTodayKey() : new Date().toISOString().slice(0, 10);
  const faces = (typeof MOOD_FACES !== "undefined") ? MOOD_FACES : ["😣", "😞", "😕", "😐", "🙂", "😄", "🤩"];
  const words = (typeof MOOD_WORDS !== "undefined") ? MOOD_WORDS : ["Тяжело", "Плохо", "Так себе", "Нормально", "Неплохо", "Хорошо", "Отлично"];
  const initV = React.useMemo(() => {
    const di = app && app.dayMoods && app.dayMoods[tk];
    if (di != null) { const n = BOS_STATE.length - 1; return n ? Math.max(0, Math.min(1, di / n)) : 0.6; }
    return 0.72;
  }, []);
  const [val, setVal] = React.useState(initV);
  const [note, setNote] = React.useState(() => (app && app.dayNotes && app.dayNotes[tk] && app.dayNotes[tk].note) || "");
  const [tags, setTags] = React.useState(() => { const t0 = app && app.dayNotes && app.dayNotes[tk] && app.dayNotes[tk].tags; return Array.isArray(t0) ? t0.slice() : []; });
  const toggleTag = (id) => { setTags((ts) => (ts.indexOf(id) >= 0 ? ts.filter((x) => x !== id) : ts.concat([id]))); if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} } };
  const [saved, setSaved] = React.useState(false);
  const trackRef = React.useRef(null), dragRef = React.useRef(false), lastB = React.useRef(-1);
  const [t, setT] = React.useState(0);
  React.useEffect(() => { let raf, s = performance.now(); const tick = (n) => { setT((n - s) / 1000); raf = requestAnimationFrame(tick); }; raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf); }, []);
  const breath = 1 + Math.sin(t * 0.8) * 0.03;

  const bucket = bosStateStepFromV(val);
  const tint = bosStateTintForV(val);
  const face = faces[bucket] || "🙂", word = words[bucket] || "Ровно";
  const PAD = 13;

  const setFromX = (clientX) => {
    const el = trackRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    let v = (clientX - r.left - PAD) / Math.max(1, r.width - 2 * PAD);
    v = Math.max(0, Math.min(1, v));
    const b = bosStateStepFromV(v);
    if (b !== lastB.current) { lastB.current = b; if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} } }
    setVal(v);
  };
  const onMark = () => {
    if (app) {
      app.setMood && app.setMood(BOS_STATE[bucket]);
      app.setDayMoods && app.setDayMoods({ ...(app.dayMoods || {}), [tk]: bucket });
      if (app.setDayNotes) { const prev = (app.dayNotes || {})[tk] || {}; app.setDayNotes({ ...(app.dayNotes || {}), [tk]: { tags: tags, note: note.trim() || prev.note || "" } }); }
    }
    if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} }
    setSaved(true);
    setTimeout(() => { try { sheet.close(); } catch (e) {} }, 240);
  };

  const cardText = isDark ? "#fff" : "var(--text)";
  const subMuted = isDark ? "rgba(255,255,255,0.55)" : "var(--text-4)";
  const fieldBg = isDark ? "rgba(255,255,255,0.06)" : "var(--surface-3)";
  const trackBg = isDark ? "rgba(255,255,255,0.10)" : "#e7e7ea";

  return (
    <div style={{ padding: "2px 20px 20px", color: cardText, textAlign: "center" }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase", color: subMuted }}>{props && props.evening ? "Вечерняя отметка" : "Как ты сейчас"}</div>
      <div style={{ position: "relative", width: 128, height: 128, margin: "12px auto 2px", display: "grid", placeItems: "center" }}>
        <div aria-hidden style={{ position: "absolute", inset: -18, borderRadius: "50%", background: "radial-gradient(circle, " + tint[1] + "44 0%, " + tint[1] + "14 45%, transparent 72%)", filter: "blur(14px)" }} />
        <div style={{ transform: "scale(" + breath + ")" }}>
          <StateOrb size={116} tint={tint} intensity={1.2} />
        </div>
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none" }}>
          <span key={bucket} style={{ fontSize: 44, lineHeight: 1, filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.25))", animation: "bosFacePop 0.4s cubic-bezier(0.34,1.56,0.64,1) both" }}>{face}</span>
        </div>
      </div>
      <div style={{ fontFamily: "var(--bos-title-font)", fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px", lineHeight: 1.1, marginTop: 6 }}>{word}</div>

      <div ref={trackRef}
        onPointerDown={(e) => { dragRef.current = true; try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {} setFromX(e.clientX); }}
        onPointerMove={(e) => { if (dragRef.current) setFromX(e.clientX); }}
        onPointerUp={() => { dragRef.current = false; }}
        onPointerCancel={() => { dragRef.current = false; }}
        style={{ position: "relative", height: 28, margin: "18px 4px 0", touchAction: "none", cursor: "pointer" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: "50%", transform: "translateY(-50%)", height: 8, borderRadius: 999, background: trackBg }} />
        <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: "calc(" + PAD + "px + " + val + " * (100% - " + (2 * PAD) + "px))", height: 8, borderRadius: 999, background: "linear-gradient(90deg, " + tint[0] + ", " + tint[1] + ")" }} />
        <div style={{ position: "absolute", top: "50%", left: "calc(" + PAD + "px + " + val + " * (100% - " + (2 * PAD) + "px))", width: 24, height: 24, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%, #fff, #eef0f3)", boxShadow: "0 2px 7px rgba(0,0,0,0.28)", transform: "translate(-50%,-50%)", transition: dragRef.current ? "none" : "left 0.1s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7, padding: "0 2px", fontSize: 10.5, letterSpacing: 0.4, textTransform: "uppercase", color: subMuted, fontWeight: 600 }}>
        <span>тяжело</span><span>отлично</span>
      </div>

      {/* ОТТЕНКИ — мультивыбор граней состояния (David: «чипы, чтобы быстро прокликать несколько»).
          Выбранные красятся цветом текущей валентности → орб+слайдер+чипы = один цвет состояния. */}
      <div style={{ marginTop: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.2, color: subMuted, marginBottom: 9, textAlign: "left" }}>Что ближе — можно несколько</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "flex-start" }}>
          {bosFacetsForBucket(bucket, tags).map((f) => {
            const on = tags.indexOf(f.t) >= 0;
            const selC = (BOS_STATE[bucket] || BOS_STATE[3]).c;
            return (
              <button key={f.id} onClick={() => toggleTag(f.t)} className="tap" data-no-haptic aria-pressed={on}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5, border: 0, cursor: "pointer",
                  borderRadius: 999, padding: "8px 13px", fontSize: 13.5, fontWeight: 600, letterSpacing: "-0.2px",
                  color: on ? "#fff" : cardText,
                  background: on ? selC : fieldBg,
                  boxShadow: on ? ("0 2px 9px " + selC + "55") : (isDark ? "inset 0 0 0 0.7px rgba(255,255,255,0.07)" : "inset 0 0 0 0.7px rgba(0,0,0,0.05)"),
                  transition: "background .16s, color .16s, box-shadow .16s",
                }}>
                <span style={{ fontSize: 14, lineHeight: 1 }}>{f.i}</span><span>{f.t}</span>
              </button>
            );
          })}
        </div>
      </div>

      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Пара слов, если хочешь…"
        style={{ width: "100%", marginTop: 16, background: fieldBg, border: "1px solid var(--line)", borderRadius: 14, padding: "12px 14px", color: cardText, fontSize: 16, fontFamily: "inherit", outline: 0, boxSizing: "border-box", textAlign: "left" }} />

      <button onClick={onMark} className="tap" style={{ width: "100%", marginTop: 12, background: saved ? "#3f7a46" : "#0a0a0a", color: "#fff", border: 0, borderRadius: 999, padding: 15, fontSize: 15, fontWeight: 600, transition: "background 0.2s" }}>
        {saved ? "Отмечено ✓" : "Отметить"}
      </button>
    </div>
  );
}

// Виджет-приглашение на главной, когда состояние сегодня НЕ отмечено (David: «не бейдж — приглашение»):
// наш орб + «Как ты?» → тап открывает ШТОРКУ StateSheetLive (не fullscreen).
function StateInviteLive({ app, isDark, navigate }) {
  var sheet = (typeof useSheet === "function") ? useSheet() : null;
  var bg = isDark ? "linear-gradient(160deg,#1a1a1d,#0d0d10)" : "#ffffff";
  var openState = function () { if (sheet && sheet.open) sheet.open(<StateSheetLive />); else if (navigate) navigate("mood"); };
  return (
    <button onClick={openState} className="tap" data-tour="state"
      style={{ width: "100%", border: 0, textAlign: "left", background: bg, padding: 18, display: "flex", alignItems: "center", gap: 15, cursor: "pointer" }}>
      <span style={{ width: 52, height: 52, flexShrink: 0, display: "grid", placeItems: "center", opacity: 0.96 }}>
        <StateOrb size={50} tint={["#c3cbd9", "#8f9bb0", "#586278"]} intensity={0.78} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 10.5, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: isDark ? "rgba(255,255,255,0.5)" : "var(--text-4)" }}>Как ты сейчас?</span>
        <span style={{ display: "block", fontSize: 17, fontWeight: 700, letterSpacing: "-0.3px", color: isDark ? "#fff" : "var(--text)", marginTop: 3 }}>Отметить состояние</span>
        <span style={{ display: "block", fontSize: 12, color: isDark ? "rgba(255,255,255,0.55)" : "var(--text-4)", marginTop: 3 }}>Одно движение — и день окрашен.</span>
      </span>
      <span style={{ color: "var(--text-5)", fontSize: 22, fontWeight: 300, flexShrink: 0 }}>›</span>
    </button>
  );
}

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
        <div className="bos-reorder-float" style={{
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
function BosReorderGrid({ ids, onReorder, renderItem, onLongPress, ctlRef, cols = 2, gap = 12, spanFull, onAdd, addLabel, onGear }) {
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
      // Передаём и rect прижатой плитки — заякоренное меню Главной ставит превью карточки на её
      // место (iOS-эффект «карточка приподнялась»). Привычки игнорируют 2-й аргумент — безопасно.
      if (onLongPress) { try { var _lpEl = refs.current[id]; onLongPress(id, _lpEl ? _lpEl.getBoundingClientRect() : null); } catch (e2) {} }
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
      {/* «Готово» FLOATS (same portal as BosReorderList — pinned bottom-centre above the tab bar).
          v528: опциональный стеклянный «+» рядом (onAdd) — как у List на главной: добавить
          виджет/вернуть скрытую карточку прямо из режима тряски (iOS-паттерн). */}
      {mode && ReactDOM.createPortal(
        <div className="bos-reorder-float" style={{ position: "absolute", bottom: "calc(var(--bos-safe-bottom, 0px) + 94px)", left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 10, zIndex: 7000, pointerEvents: "none" }}>
          {onAdd && (
            <button onClick={onAdd} className="tap" data-haptic="selection" aria-label={addLabel || "Добавить"} style={{
              pointerEvents: "auto", width: 44, height: 44, borderRadius: "50%", border: 0, display: "grid", placeItems: "center", cursor: "pointer",
              color: (typeof document !== "undefined" && document.querySelector(".bos-page.theme-dark")) ? "#fff" : "var(--text)",
              background: BOS_TILE_SHEEN + ", " + ((typeof document !== "undefined" && document.querySelector(".bos-page.theme-dark")) ? "rgba(64,64,68,0.96)" : "rgba(255,255,255,0.97)"),
              boxShadow: "0 10px 26px rgba(0,0,0,0.30), inset 0 1px 1px rgba(255,255,255,0.9), inset 0 0 0 0.5px rgba(0,0,0,0.08)",
              animation: "bosMenuPop 0.32s cubic-bezier(0.34,1.5,0.4,1) both",
            }}><I.Plus size={20} strokeWidth={2.6} /></button>
          )}
          <button onClick={done} className="tap" data-haptic="selection" aria-label="Готово — выйти из режима перестановки" style={{
            pointerEvents: "auto", border: 0, background: "#0a0a0a", color: "#fff", borderRadius: 999, padding: "11px 22px",
            fontSize: 14, fontWeight: 600, boxShadow: "0 10px 26px rgba(0,0,0,0.36)", cursor: "pointer",
            animation: "bosMenuPop 0.32s cubic-bezier(0.34,1.5,0.4,1) both",
          }}>Готово</button>
          {/* «Оформление» — стеклянная шестерёнка СПРАВА от «Готово» (David: в том же стиле, что плюсик).
              Быстрые визуальные настройки доски (стиль карточек, стекло) прямо из тряски. */}
          {onGear && (
            <button onClick={onGear} className="tap" data-haptic="selection" aria-label="Оформление" style={{
              pointerEvents: "auto", width: 44, height: 44, borderRadius: "50%", border: 0, display: "grid", placeItems: "center", cursor: "pointer",
              color: (typeof document !== "undefined" && document.querySelector(".bos-page.theme-dark")) ? "#fff" : "var(--text)",
              background: BOS_TILE_SHEEN + ", " + ((typeof document !== "undefined" && document.querySelector(".bos-page.theme-dark")) ? "rgba(64,64,68,0.96)" : "rgba(255,255,255,0.97)"),
              boxShadow: "0 10px 26px rgba(0,0,0,0.30), inset 0 1px 1px rgba(255,255,255,0.9), inset 0 0 0 0.5px rgba(0,0,0,0.08)",
              animation: "bosMenuPop 0.32s cubic-bezier(0.34,1.5,0.4,1) both",
            }}><I.Settings size={20} strokeWidth={2} /></button>
          )}
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
// sym — монохромный SVG-символ (sf:) для ЧЁРНО-БЕЛОГО показа иконок виджетов в галерее «+»
// (David: «иконки виджетов, кроме привычек, чёрно-белые, в одном стиле как плюсик»). Сам виджет
// на доске рисуется как прежде; символ используется только в списке добавления.
// Иконка «Состояние» — ОРБ, а не лицо (David 2026-07-11: «иконка состояния — человечек, морда,
// ужасно, целиком заливка выскакивает; замени на адекватное»). Сфера-орб = визуальный язык состояния
// в приложении: круг + мягкий блик-полумесяц сверху. Монохром, принимает {size,color,strokeWidth}.
function BosStateGlyph({ size = 20, color = "currentColor", strokeWidth = 1.8 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8.4" />
      <path d="M7.8 9.2a5.4 5.4 0 0 1 5-1.7" opacity="0.55" />
    </svg>
  );
}

// Icon — МОНОХРОМНАЯ line-иконка из набора I (David 2026-07-11: «во вкладке виджеты все иконки должны
// быть svg одноцветные, эмодзи тут плохо смотрятся»). emoji/sym оставлены как фолбэк.
var BOS_HOME_WIDGETS = [
  { id: "hero",    t: "Подсказки",    d: "ИИ-сводка дня и аватар",   Icon: I.Sparkles,    emoji: "✨" },
  // Лента челленджей. David 2026-07-10: УБРАНА из дефолта главной (челленджи переехали в форму
  // создания привычки + Сообщество). Остаётся обычным opt-in виджетом — включается из галереи «+».
  { id: "quick",   t: "Быстрое добавление", d: "Челленджи с бонусом XP", Icon: I.Bolt,     emoji: "⚡" },
  { id: "week",    t: "Эта неделя",   d: "Недельная активность",     Icon: I.Calendar,    emoji: "📅" },
  // v598: локальный todo-виджет «Дела» — списки-вкладки со своими делами. ВЫКЛ по умолчанию
  // (не в стартовом наборе home_live → у живых людей главная не меняется, пока сами не включат).
  { id: "tasks",   t: "Дела",         d: "Списки задач с вкладками", Icon: I.Check,        emoji: "✅" },
  // «Состояние» — виджет-орб (редизайн 2026-07-04): не отмечено → приглашение StateInviteLive,
  // отмечено → MoodWidgetLive (орб в цвете + след недели). Тап → Момент (жест A, route "mood").
  { id: "mood",    t: "Состояние",    d: "Как ты сейчас — свет орба", Icon: BosStateGlyph, emoji: "☀️" },
  // «Баланс окружения» отложён (2026-07-13, см. _parked/env-balance/) — виджет убран из галереи.
  { id: "team",    t: "Вместе",       d: "Ваши совместные цели",     Icon: I.Users,        emoji: "👥" },
  // v528 (Д): контейнеры «Привычки»/«Цели» УБРАНЫ — плитки привычек и целей теперь СВОБОДНЫЕ
  // элементы сетки главной (homeLayout, ключи h:<id>/g:<id>), их не включают из галереи.
  { id: "invite",  t: "Позови своих", d: "Приглашай друзей — +XP",   Icon: I.Send,         emoji: "📣" },
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

// ── АРХИВ (v545, David: «на минус — удалить или архивировать; архивировать = спрятать, история
//    цела, вернуть можно»). ЛЁГКИЙ клиентский оверлей поверх привычек/целей/кругов — как «hidden»
//    у доски: набор ключей в localStorage, НЕ трогает облако, полностью обратимо. Ключ = "h:"+id /
//    "g:"+id / "t:"+teamKey. Фильтруется везде (доска, списки, галерея). Восстановление — шторка
//    «Архив». Событие bos:archivedChanged → списки перерисовываются.
function bosLoadArchived() { try { var v = JSON.parse(localStorage.getItem("bos:archived") || "null"); return (v && typeof v === "object") ? v : {}; } catch (e) { return {}; } }
function bosIsArchived(key) { return !!bosLoadArchived()[key]; }
function bosSetArchived(key, on) {
  var m = bosLoadArchived();
  if (on) m[key] = 1; else delete m[key];
  try { localStorage.setItem("bos:archived", JSON.stringify(m)); } catch (e) {}
  try { window.dispatchEvent(new Event("bos:archivedChanged")); } catch (e) {}
  return m;
}
// СТАБИЛЬНЫЙ ключ архива (v594, «архив не работает» — David). Локальные id привычек/целей
// раздаются ЗАНОВО при каждом старте (upsert строк в облако выкидывает id), поэтому метка
// "h:"+id протухала за одну перезагрузку: спрятанное возвращалось, шторка «Архив» пустела.
// Ключ = облачный cloudId (вечный); фолбэк на локальный id — для локального режима без облака.
// Читатели проверяют ОБА ключа (старые метки текущей сессии не ломаем).
function bosArchKey(kind, it) { return kind + ":" + ((it && (it.cloudId != null ? it.cloudId : (it._id != null ? it._id : it.id))) || ""); }
function bosIsArch(arch, kind, it) {
  if (!arch || !it) return false;
  // Есть вечный облачный ключ → архивность определяет ТОЛЬКО он. Локальный числовой id (_nid)
  // раздаётся заново 1001,1002… при каждом старте, поэтому матч по нему ЛОЖНО прятал НОВУЮ
  // привычку, чей свежий id совпал со старой архивной меткой «h:1001» (David: «создал — на
  // орбитах есть, а в списке привычек нет»). Фолбэк на локальный id — ТОЛЬКО для чисто
  // локального режима (привычка без cloudId), где иначе архив вообще не сматчить.
  if (it.cloudId != null) return !!arch[kind + ":" + it.cloudId];
  return !!arch[kind + ":" + (it._id != null ? it._id : it.id)];
}
function bosClearArch(kind, it) {
  if (!it) return;
  if (it.cloudId != null) bosSetArchived(kind + ":" + it.cloudId, false);
  bosSetArchived(kind + ":" + (it._id != null ? it._id : it.id), false);
}
// Хук: перерисовать компонент при смене архива.
function useBosArchived() {
  var st = React.useState(bosLoadArchived), m = st[0], setM = st[1];
  React.useEffect(function () { var h = function () { setM(bosLoadArchived()); }; window.addEventListener("bos:archivedChanged", h); return function () { window.removeEventListener("bos:archivedChanged", h); }; }, []);
  return m;
}

// Круглая СТЕКЛЯННАЯ кнопка-иконка в стиле нашего плюсика (David: «в том же стиле круглых стеклянных»).
// danger=true → красная ТОЛЬКО иконка (без обводки кнопки — David: «обводку не делай»).
function BosGlassIconLive({ children, dark, size = 44, danger }) {
  return (
    <span style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center",
      color: danger ? "#FF3B30" : (dark ? "#fff" : "var(--text)"),
      background: BOS_TILE_SHEEN + ", " + (dark ? "rgba(64,64,68,0.96)" : "rgba(255,255,255,0.97)"),
      boxShadow: "0 3px 10px rgba(0,0,0,0.16), inset 0 1px 1px rgba(255,255,255,0.9), inset 0 0 0 0.5px rgba(0,0,0,0.08)" }}>{children}</span>
  );
}

/* ШТОРКА «Архивировать / Удалить» (v545, David) — на минус у привычки/цели/круга. Иконки в стиле
   наших круглых стеклянных кнопок: архив нейтральный, удаление — красная ТОЛЬКО иконка-корзина и
   текст (без красной обводки). Отмена = потянуть вниз/тап мимо (кнопки «Отмена» нет). */
function ArchiveOrDeleteSheetLive({ name, emoji, color, dark = false, onArchive, onDelete, deleteLabel = "Удалить насовсем", deleteHint }) {
  const { close } = (typeof useSheet === "function") ? useSheet() : { close: function () {} };
  const act = (fn) => { close(); if (typeof fn === "function") setTimeout(fn, 20); };
  const archBox = (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="4" rx="1" /><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" /><path d="M10 12h4" /></svg>);
  return (
    <div style={{ padding: "2px 16px 0", color: "var(--text)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "2px 4px 12px" }}>
        <span style={{ width: 40, height: 40, borderRadius: 13, background: BOS_TILE_SHEEN + (color ? ", " + bosCanonColor(color) + "26" : ", var(--surface-3)"), boxShadow: bosTileGlass(dark), display: "grid", placeItems: "center", fontSize: 20, flexShrink: 0 }}>{bosIcon(emoji || "🌿", 22, bosCanonColor(color))}</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 16.5, fontWeight: 700, letterSpacing: "-0.3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>«{name}»</div>
          <div style={{ fontSize: 12.5, color: "var(--text-4)", marginTop: 1 }}>Что с ней сделать?</div>
        </div>
      </div>
      <button onClick={() => act(onArchive)} className="tap" data-haptic="selection" style={{ display: "flex", alignItems: "center", gap: 13, width: "100%", border: 0, borderRadius: 16, padding: 12, background: "var(--surface-3)", textAlign: "left", cursor: "pointer", color: "var(--text)" }}>
        <span style={{ width: 34, display: "grid", placeItems: "center", flexShrink: 0, color: "var(--text-2)" }}>{archBox}</span>
        <span><span style={{ display: "block", fontSize: 15, fontWeight: 600 }}>Архивировать</span><span style={{ display: "block", fontSize: 12, color: "var(--text-4)", marginTop: 2, lineHeight: 1.35 }}>Спрятать с главной. История цела — вернёшь в «Архиве».</span></span>
      </button>
      <button onClick={() => act(onDelete)} className="tap" data-haptic="warning" style={{ display: "flex", alignItems: "center", gap: 13, width: "100%", border: 0, borderRadius: 16, padding: 12, marginTop: 9, background: "var(--surface-3)", textAlign: "left", cursor: "pointer", color: "var(--text)" }}>
        <span style={{ width: 34, display: "grid", placeItems: "center", flexShrink: 0, color: "#FF3B30" }}><I.Trash size={21} strokeWidth={2} /></span>
        <span><span style={{ display: "block", fontSize: 15, fontWeight: 600, color: "#FF3B30" }}>{deleteLabel}</span><span style={{ display: "block", fontSize: 12, color: "#B57A00", marginTop: 2, lineHeight: 1.35 }}>{deleteHint || "Сотрёт вместе со всей историей. Это навсегда."}</span></span>
      </button>
      <div style={{ fontSize: 11.5, color: "var(--text-5)", textAlign: "center", padding: "12px 0 8px" }}>потяни вниз, чтобы отменить</div>
      <div style={{ height: "max(4px, var(--tg-bottom-inset, 0px))" }} />
    </div>
  );
}

/* ШТОРКА «Архив» (v545) — список архивированных привычек/целей/кругов с восстановлением. Читает
   app.habits/goals/teams ∩ архив-набор. Тап «Вернуть» → снять из архива (появится на главной). */
function ArchiveSheetLive({ navigate }) {
  const app = (typeof useApp === "function") ? useApp() : null;
  const dark = app && app.themeOverride === "dark";
  const arch = useBosArchived();
  const rows = [];
  // v594: сверка по СТАБИЛЬНОМУ ключу (cloudId) с фолбэком на локальный — bosIsArch смотрит оба.
  (app && app.habits || []).forEach((h) => { if (bosIsArch(arch, "h", h)) rows.push({ k: bosArchKey("h", h), it: h, kd: "h", name: h.name, emoji: h.emoji || "🌿", color: h.color, kind: "Привычка" }); });
  (app && app.goals || []).forEach((g) => { if (bosIsArch(arch, "g", g)) rows.push({ k: bosArchKey("g", g), it: g, kd: "g", name: g.name, emoji: g.emoji || "🎯", color: g.color, kind: "Цель" }); });
  (app && app.teams || []).forEach((t) => { if (bosIsArch(arch, "t", t)) rows.push({ k: bosArchKey("t", t), it: t, kd: "t", name: t.name, emoji: t.emblem || "👥", color: t.accent || t.color, kind: "Совместная цель" }); });
  return (
    <div style={{ padding: "2px 18px 8px", color: "var(--text)" }}>
      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.3px" }}>Архив</div>
        <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 3 }}>Спрятанное с главной — история цела, вернёшь одним тапом</div>
      </div>
      {rows.length === 0 ? (
        <div style={{ textAlign: "center", padding: "26px 8px", color: "var(--text-4)" }}>
          <div style={{ fontSize: 30 }}>🗄️</div>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text)", marginTop: 8 }}>Архив пуст</div>
          <div style={{ fontSize: 12.5, marginTop: 4, lineHeight: 1.45 }}>Спрятать привычку или цель можно минусом в режиме тряски.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map((r) => (
            <div key={r.k} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--card)", borderRadius: 16, padding: "10px 12px", boxShadow: "var(--card-shadow)" }}>
              <span style={{ width: 38, height: 38, borderRadius: 12, background: BOS_TILE_SHEEN + (r.color ? ", " + bosCanonColor(r.color) + "26" : ", var(--surface-3)"), boxShadow: bosTileGlass(dark), display: "grid", placeItems: "center", fontSize: 19, flexShrink: 0, opacity: 0.85 }}>{bosIcon(r.emoji, 20, bosCanonColor(r.color))}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-4)" }}>{r.kind}</div>
              </div>
              <button onClick={() => { bosClearArch(r.kd, r.it); if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} } }} className="tap" style={{ flexShrink: 0, border: 0, borderRadius: 999, padding: "8px 14px", background: dark ? "rgba(255,255,255,0.10)" : "var(--surface-3)", color: "var(--text)", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}><I.Refresh size={14} strokeWidth={2.2} /> Вернуть</button>
            </div>
          ))}
        </div>
      )}
      <div style={{ height: "max(8px, var(--tg-bottom-inset, 0px))" }} />
    </div>
  );
}

/* ЕДИНАЯ ГАЛЕРЕЯ ГЛАВНОГО ЭКРАНА — полный каталог того, что может жить на доске: виджеты,
   привычки, цели и совместные цели. Одна логика для шторки «+» (AddWidgetSheetLive) и страницы
   настроек «Главный экран» (HomeCustomizeLive) — никакого дрейфа. Правила видимости:
   - виджет включён = "w:<id>" есть в order (виджеты сами на доску не добираются);
   - плитка включена = её ключ НЕ в hidden (добор в home_live сам держит живые плитки на доске).
   Поэтому у плиток тумблер честно показывает «на главной», даже если ключ ещё не персистнут. */
function HomeGalleryContentLive({ dark = false, onStyle = null }) {
  const app = (typeof useApp === "function") ? useApp() : null;
  const layout = (app && app.homeLayout && Array.isArray(app.homeLayout.order)) ? app.homeLayout : { order: [], hidden: [] };
  const hidden = Array.isArray(layout.hidden) ? layout.hidden : [];
  const inOrder = (k) => layout.order.indexOf(k) >= 0;
  const haptic = () => { if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} } };
  const setL = (order, hid) => { if (app && app.setHomeLayout) { app.setHomeLayout({ order, hidden: hid }); haptic(); } };
  const toggleWidget = (id) => {
    const k = "w:" + id;
    // «Быстрое добавление» (quick) больше НЕ добирается само — обычный opt-in виджет (David 2026-07-10):
    // вкл = «w:quick» в order, как остальные виджеты. Убран из дефолта главной, возвращается отсюда.
    if (inOrder(k)) setL(layout.order.filter((x) => x !== k), hidden.indexOf(k) < 0 ? hidden.concat([k]) : hidden);
    else setL(layout.order.concat([k]), hidden.filter((x) => x !== k));
  };
  const widgetOn = (id) => inOrder("w:" + id);
  const tileOn = (k) => hidden.indexOf(k) < 0;
  const toggleTile = (k) => {
    if (tileOn(k)) setL(layout.order.filter((x) => x !== k), hidden.concat([k]));
    else setL(inOrder(k) ? layout.order : layout.order.concat([k]), hidden.filter((x) => x !== k));
  };
  const defs = (typeof BOS_HOME_WIDGETS !== "undefined") ? BOS_HOME_WIDGETS : [];
  // shelved-копии круга (Г) и goalOnly в каталоге доски не участвуют — они спрятаны со страниц.
  // Через bosIsArch (по cloudId), а не bosIsArchived("h:"+id): числовой id переиздаётся и ложно прячет новые.
  const _archM = bosLoadArchived();
  const habits = ((app && app.habits) || []).filter((h) => !h.shelved && !h.goalOnly && !bosIsArch(_archM, "h", h));
  const goals = ((app && app.goals) || []).filter((g) => !bosIsArch(_archM, "g", g));
  const teams = (app && app.teams) || [];
  // Локальный фолбэк для страницы настроек: там доски за шторкой нет, меню стиля
  // открывается прямо по месту (на доске шторка закрывается — это делает onStyle).
  const [styleHere, setStyleHere] = React.useState(false);
  const openStyle = () => { haptic(); if (onStyle) onStyle(); else setStyleHere(true); };
  // Компактная библиотека (David: «прям компактнее, много места в высоту») — строки-миниатюры:
  // одна карточка на секцию, волосяные разделители, малые тумблеры.
  const kicker = (txt) => (
    <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.9, textTransform: "uppercase", color: "var(--text-4)", padding: "12px 4px 5px" }}>{txt}</div>
  );
  const row = ({ key, icon, name, sub, on, onToggle, bare }, i, arr) => (
    <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "6.5px 10px",
      borderTop: i ? ("0.5px solid " + (dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.055)")) : "none" }}>
      {/* bare (David) — системные ч/б иконки виджетов БЕЗ квадрата-подложки, стоят сами по себе. */}
      <span style={{ width: 28, height: 28, borderRadius: 9, display: "grid", placeItems: "center", fontSize: 15, flexShrink: 0,
        background: bare ? "transparent" : (dark ? "rgba(255,255,255,0.08)" : "#fff"), boxShadow: bare ? "none" : bosTileGlass(dark), opacity: on ? 1 : 0.5, transition: "opacity 0.2s" }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0, opacity: on ? 1 : 0.55, transition: "opacity 0.2s", display: "flex", alignItems: "baseline", gap: 6 }}>
        {/* Имя не сжимается — ужимается ПОДПИСЬ (иначе «Быстрое д…» при длинном сабе). */}
        <span style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</span>
        {sub && <span style={{ fontSize: 11.5, color: "var(--text-4)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</span>}
      </div>
      <Switch small on={on} onChange={onToggle} dark={dark} />
    </div>
  );
  // Секции — СТЕКЛЯННО-СЕРЫЕ карточки в стиле приложения (David: «шторка не в наш стиль
  // цветов» — белые карточки на белой шторке сливались; тон = как чипы/плитки, surface-3).
  const card = (items) => (
    <div style={{ background: BOS_TILE_SHEEN + ", " + (dark ? "rgba(255,255,255,0.06)" : "var(--surface-3)"), borderRadius: 14, boxShadow: bosTileGlass(dark), overflow: "hidden" }}>
      {items.map((it, i, arr) => row(it, i, arr))}
    </div>
  );
  return (
    <div style={{ color: "var(--text)" }}>
      {/* «Стиль карточек» отсюда УБРАН (David): визуальные настройки живут в шестерёнке «Оформление»
          в режиме тряски — не дублируем на шторке «+». */}
      {kicker("Виджеты")}
      {/* Иконки виджетов — ЧЁРНО-БЕЛЫЕ (David): монохромный sf-символ вместо цветного эмодзи, единый
          строгий вид как у плюсика. Привычки/цели ниже остаются цветными. */}
      {card(defs.map((o) => ({ key: "w:" + o.id, bare: true, icon: (o.Icon ? React.createElement(o.Icon, { size: 21, color: dark ? "#f2f2f5" : "#1b1b1f", strokeWidth: 1.9 }) : (typeof bosIcon === "function" ? bosIcon(o.sym || o.emoji, 21, dark ? "#f2f2f5" : "#1b1b1f") : o.emoji)), name: o.t, sub: o.d, on: widgetOn(o.id), onToggle: () => toggleWidget(o.id) })))}
      {/* Привычки/цели/совместные цели ОТСЮДА убраны (David: «их же можно спрятать архивом — незачем
          дублировать»). Они появляются на главной сами; спрятать/вернуть — минусом в тряске → «Архив». */}
      <div style={{ fontSize: 12, color: "var(--text-4)", lineHeight: 1.45, padding: "14px 4px 0", textAlign: "center" }}>
        Привычки и цели появляются на главной сами. Спрятать — минусом в режиме тряски, вернуть — в «Архиве».
      </div>
    </div>
  );
}

/* Шторка «+» на главной — тонкая обёртка над единой галереей (см. HomeGalleryContentLive).
   bos-sheet-scroll: каталог длинный (все привычки и цели), тело шторки скроллится само. */
function AddWidgetSheetLive({ defs = [], dark = false, onStyle = null }) {
  return (
    <div className="bos-sheet-scroll" style={{ paddingLeft: 18, paddingRight: 18, paddingBottom: 8, color: "var(--text)" }}>
      <div style={{ textAlign: "center", marginBottom: 2 }}>
        <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.3px" }}>Главный экран</div>
        <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 3 }}>Собери свой: виджеты, привычки и цели</div>
      </div>
      <HomeGalleryContentLive dark={dark} onStyle={onStyle} />
    </div>
  );
}

/* ИКОНКИ-ТРИО создания (David: «чтобы смысл читался — как одно вытекает из другого»). Общий мотив —
   ЗАЛИВНАЯ ТОЧКА, которая растёт: Привычка = точка в петле (повторяю один шаг) → Цель = точка-вершина,
   к которой поднимаешься (иду к результату) → Круг = та же точка в центре, вокруг неё люди (идём вместе).
   Монохром, линия + заливные точки — один язык с нашими SVG. Принимают {size,color,strokeWidth}. */
function BosHabitIcon({ size = 20, color = "currentColor", strokeWidth = 1.8 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19.6 12a7.6 7.6 0 1 1-2.3-5.5" />
      <path d="M19.8 4v3.1h-3.1" />
      <circle cx="12" cy="12" r="2.4" fill={color} stroke="none" />
    </svg>
  );
}
/* Цель = ТА ЖЕ точка (r 2.4, как в привычке), к которой тянется стрелка. David 2026-07-15:
   «точка такого же размера, а стрелочка к ней поменьше, чтобы логика реально считывалась».
   Точка во всём трио — одно и то же: то, ради чего действие. Привычка ходит вокруг неё
   по кругу, цель тянется к ней снизу, в круге вокруг неё стоят люди. Поэтому точка НЕ
   меняет размер от иконки к иконке, а стрелка ужата (плечи 4.4→3.0) — она младше точки. */
function BosGoalIcon({ size = 20, color = "currentColor", strokeWidth = 1.8 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5.4 18.6 14.4 9.6" />
      <path d="M10.6 9.6h3.8v3.8" />
      <circle cx="18.2" cy="5.8" r="2.4" fill={color} stroke="none" />
    </svg>
  );
}
/* КРУГ — точка и кольцо вокруг неё. Больше ничего (David 2026-07-15: «три точки с орбиты
   убери, оставь только точку в центре и кольцо вокруг — всё, это круги»). Так и правильно:
   на 14px (пилюля в Сообществе) точки на кольце всё равно сливались с линией в кашу, а знак
   должен читаться в самом мелком месте, где он живёт. Заодно трио стало честнее: точка —
   то, ради чего действие; привычка ходит ВОКРУГ неё дугой, цель тянется К ней стрелкой,
   круг ЗАМЫКАЕТСЯ вокруг неё кольцом. Один знак — во всех местах: меню «+», пилюли и
   заголовки Сообщества. */
function BosCircleIcon({ size = 20, color = "currentColor", strokeWidth = 1.8 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="2.4" fill={color} stroke="none" />
    </svg>
  );
}

/* «+» (Главная и Привычки) — КЛАССИЧЕСКИЙ стеклянный поповер (David: «нравилась небольшая
   стеклянная менюшка — привычку или цель, не перегружало; верни»). Три пункта: Привычку / Цель / Круг
   (наши формы-шторки; Круг — эхо формы круга). Иконки — смысловое трио BosHabit/Goal/CircleIcon. */
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
    { icon: BosHabitIcon,  label: "Привычку", go: () => _openSheet(<HabitFormSheetLive mode="create" navigate={navigate} />) },
    { icon: BosGoalIcon,   label: "Цель",     go: () => _openSheet(<GoalFormSheetLive mode="create" navigate={navigate} />) },
    // «Круг» (решение David «вариант Г»): третья дверь создания. ЭХО существующего пути круга —
    // открывает ту же форму, которой Сообщество создаёт круг: форма цели с уже включённым тумблером
    // «идти к цели вместе» (circleOn) → при сохранении bosPromoteGoalToCircle делает настоящий круг.
    // Её вопросы поменяет будущий чип «Сообщество-1»; сейчас задача — заметная дверь. Небольшой
    // отступ (i===2 ниже) отделяет личное (привычка/цель) от совместного (круг).
    { icon: BosCircleIcon, label: "Круг", go: () => _openSheet(<GoalFormSheetLive mode="create" circleOn={true} navigate={navigate} />) },
    // «Готовый челлендж» временно убран из меню (David: «убери пока, оставь привычку и цель») —
    // вход в каталог пресетов остаётся ссылкой внутри формы цели. Вернуть = раскомментировать:
    // { icon: I.Bolt,  label: "Готовый челлендж", go: () => { if (typeof CreatePickerSheetLive === "function") _openSheet(<CreatePickerSheetLive navigate={navigate} custom={false} />); } },
  ];
  return ReactDOM.createPortal(
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 8000, background: "rgba(18,22,38,0.16)", animation: "dimIn 0.18s ease both" }}>
      {/* Три ОТДЕЛЬНЫЕ пилюли (David: «вместо цельной менюшки — три кнопки-пилюли, иконки в
          кружочках, а не квадратики»). Выскакивают из-под «+» справа, лёгкий стаггер. */}
      <div onClick={(e) => e.stopPropagation()} style={{ position: "fixed", right: pos.right, top: pos.top, width: 230, display: "flex", flexDirection: "column", alignItems: "stretch", gap: 10 }}>
        {items.map((it, i) => (
          <button key={i} role="menuitem" data-haptic="selection" onClick={() => { onClose(); it.go(); }} className="tap" style={{
            display: "flex", width: "100%", alignItems: "center", justifyContent: "flex-start", gap: 11, whiteSpace: "nowrap",
            padding: "8px 17px 8px 8px", borderRadius: 999, cursor: "pointer",
            marginTop: i === 2 ? 4 : 0, // лёгкий разрыв: «готовое» ≠ «своё»
            background: isDark ? "rgba(28,29,34,0.97)" : "rgba(255,255,255,0.97)",
            WebkitBackdropFilter: "blur(22px) saturate(150%)", backdropFilter: "blur(22px) saturate(150%)",
            border: "0.5px solid " + (isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.06)"),
            boxShadow: "0 12px 32px rgba(0,0,0," + (isDark ? "0.5" : "0.16") + ")",
            fontSize: 15.5, fontWeight: 600, color: isDark ? "#f2f2f5" : "#0a0a0a",
            transformOrigin: "top right", animation: "bosMenuPop 0.32s cubic-bezier(0.34,1.5,0.4,1) both", animationDelay: (i * 0.05) + "s",
          }}>
            <span aria-hidden style={{ width: 34, height: 34, borderRadius: "50%", background: isDark ? "rgba(255,255,255,0.10)" : "rgba(10,10,10,0.05)", display: "grid", placeItems: "center", flexShrink: 0 }}>{React.createElement(it.icon, { size: 18, color: isDark ? "#f2f2f5" : "#0a0a0a", strokeWidth: 1.9 })}</span>
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
  // David 2026-07-10 (стандарт круглых кнопок Apple HIG): 44pt плавающие кружки в шапке формы —
  // отмена СЛЕВА стеклянная, готово СПРАВА чёрная (в тёмной — белая). 38→44, «✓» из стекла в CTA.
  const base = { width: 44, height: 44, borderRadius: "50%", border: 0, display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 };
  const glass = { ...base, color: dark ? "#fff" : "var(--text)", background: BOS_TILE_SHEEN + ", " + (dark ? "rgba(255,255,255,0.10)" : "#fff"), boxShadow: bosTileGlass(dark) };
  const solid = { ...base, color: dark ? "#0a0a0a" : "var(--cta-ink, #fff)", background: dark ? "#fff" : "var(--cta, #0a0a0a)", boxShadow: "0 8px 22px rgba(0,0,0,0.22)" };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "2px 0 8px" }}>
      <button type="button" onClick={onClose} className="tap" data-haptic="selection" aria-label="Закрыть" style={glass}><I.X size={18} strokeWidth={2.2} /></button>
      <div style={{ flex: 1, minWidth: 0, textAlign: "center", fontSize: 18, fontWeight: 700, letterSpacing: "-0.3px", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
      <button type="button" onClick={onDone} className="tap" data-haptic="light" aria-label="Сохранить" style={solid}><I.Check size={19} strokeWidth={2.6} /></button>
    </div>
  );
}

// ─── СТИЛЬ КАРТОЧЕК страницы «Привычки» ───────────────────────────────────────────────────────────
// David: «формы + тоглы внутри». Дефолт = ТЕКУЩИЙ вид (квадрат, неделя, имя+лица) — не меняем, человек
// сам покрутит. Запоминается в localStorage; смена шлёт событие → список перерисовывается вживую.
var BOS_CARD_STYLE_DEFAULT = { form: "rect", name: true, marks: "none", faces: true, cells: "round" };
function bosLoadCardStyle() { try { var s = JSON.parse(localStorage.getItem("bos:cardStyle") || "null"); if (s && typeof s === "object") return Object.assign({}, BOS_CARD_STYLE_DEFAULT, s); } catch (e) {} return Object.assign({}, BOS_CARD_STYLE_DEFAULT); }
function bosSaveCardStyle(s) { try { localStorage.setItem("bos:cardStyle", JSON.stringify(s)); } catch (e) {} try { window.dispatchEvent(new Event("bos:cardStyleChanged")); } catch (e) {} }

// СТИЛЬ ЦЕЛЕЙ — ОТДЕЛЬНЫЙ от привычек (David: «карточки целей и привычек должны отличаться; в
// шестерёнке — стиль привычек И стиль целей, у целей другие пресеты»). База = ВЫСОКИЙ БАННЕР (как
// цель выглядела изначально). form: banner (полноширинный высокий) | square (2-в-ряд минимал).
// orbits = мини-орбита (привычки+люди вокруг цели-превью). name/progress — тоглы. Тот же event.
// orbits ПО УМОЛЧАНИЮ ВЫКЛ (David: «кому нужно — включит тумблером; по дефолту сразу иконки людей»).
/* ВИД КАРТОЧКИ ЦЕЛИ/КРУГА — ЗАМОРОЖЕН НА ОДНОМ СТАНДАРТЕ (David 2026-07-15).
   Было: настройка (баннер/квадрат + тумблеры орбит/прогресса/названия) в CardStyleMenuLive.
   Стало: одна карточка везде — главная, Привычки, Сообщество, свой круг и чужой.
   ПОЧЕМУ. Карточка круга получила нить дня. Пока вид оставался НАСТРОЙКОЙ, на экране
   одновременно жили старое и новое: где-то орбиты, где-то квадрат без нити, где-то баннер
   с нитью. David назвал это кашей — и был прав: стандарт не может быть настройкой.
   НИЧЕГО НЕ УДАЛЕНО: ветки banner/квадрат/orbits в карточках на месте, bosSaveGoalStyle жив,
   выбор человека в localStorage не стёрт. Воскрешение — _parked/goal-card-styles/README.md.
   form:"banner"  — единственная форма, где помещается нить дня (в 146px квадрат не влезает);
   orbits:false   — орбиты остаются ВНУТРИ круга и во «Вселенной», но не на карточке: две
                    картинки про одно и то же («кто») на одной карточке и давали разнобой;
   progress/name  — всегда, это факты, а не украшение. */
var BOS_GOAL_STYLE_DEFAULT = { form: "banner", name: true, orbits: false, progress: true };
function bosLoadGoalStyle() { return Object.assign({}, BOS_GOAL_STYLE_DEFAULT); }
function bosSaveGoalStyle(s) { try { localStorage.setItem("bos:goalStyle", JSON.stringify(s || {})); } catch (e) {} try { window.dispatchEvent(new Event("bos:cardStyleChanged")); } catch (e) {} }
function useBosGoalStyle() { return BOS_GOAL_STYLE_DEFAULT; }
// ─── ОБЩИЕ ПЛИТКИ привычки/цели (David: «унифицировать») ──────────────────────────────────────────
// Плитки вынесены СЮДА из HabitsLive и стали самодостаточными (тема/стиль/хендлеры через хуки), чтобы
// и страница «Привычки», и виджеты ГЛАВНОЙ рисовали ОДНО И ТО ЖЕ и слушали ОДИН стиль. `from` = откуда
// открыт detail (habits/home). ctx.mode — режим перестановки сетки (на «Привычках»); на главной false.
// ВНИМАНИЕ: это хук стиля ПРИВЫЧЕК — он живой и настраиваемый. Заморозили только вид ЦЕЛЕЙ (выше).
// Его снос v760 уронил Главную (home_live:418 зовёт его первым хуком) — не повторять.
function useBosCardStyle() {
  var st = React.useState(bosLoadCardStyle), s = st[0], setS = st[1];
  React.useEffect(function () { var h = function () { setS(bosLoadCardStyle()); }; window.addEventListener("bos:cardStyleChanged", h); return function () { window.removeEventListener("bos:cardStyleChanged", h); }; }, []);
  return s;
}
// Тема-производные плиток — ТЕ ЖЕ значения, что были в HabitsLive (rowBg/cardShadow/iconBg).
function bosTileTheme(isDark) {
  return {
    rowBg: isDark ? "#141414" : "#ffffff",
    cardShadow: isDark ? "none" : "0 1px 2px rgba(0,0,0,0.04)",
    iconBg: isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)",
  };
}
// Красивый срок: ISO-дата → «4 авг» (год, если не текущий); старый терм («Месяц», «14 окт») — как есть.
function bosFmtDeadline(s) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec("" + (s || ""));
  if (!m) return s || "";
  var MS = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  var d = new Date();
  return (+m[3]) + " " + MS[(+m[2]) - 1] + ((+m[1]) !== d.getFullYear() ? " " + m[1] : "");
}
// ЕДИНЫЙ «скин» карточки цели/команды (вынесен из HabitsLive.goalSkin, самодостаточен по isDark).
// tint===false → «тонированный фон» ВЫКЛ: карточка БЕЛАЯ, но цвет остаётся в акцентах (значок, полоса).
function bosGoalSkin(color, isDark, tint) {
  if (typeof bosCanonColor === "function") color = bosCanonColor(color);
  var th = bosTileTheme(isDark);
  var accent = (color && ("" + color).toLowerCase() !== "#0a0a0a" && color !== "#8E8E93") ? color : null;
  if (!accent || tint === false) return {
    hasColor: false, accent: accent || (isDark ? "#e8e8ea" : "#0a0a0a"), bg: th.rowBg, shadow: th.cardShadow,
    txt: "var(--text)", sub: "var(--text-4)", lbl: "var(--text-4)", val: "var(--text-3)",
    track: isDark ? "rgba(255,255,255,0.12)" : "rgba(10,10,10,0.07)", fill: accent || (isDark ? "#e6e6ea" : "#0a0a0a"),
    iconBg: BOS_TILE_SHEEN + ", " + (accent ? accent + "26" : th.iconBg), iconInk: null,
  };
  if (isDark) {
    // СТАНДАРТИЗАЦИЯ ПО ТОНАМ (David: «на превью цвет/градиент чуть отличается от внутреннего»):
    // плитка берёт ТОТ ЖЕ градиент, что hero детали (bosGoalHero) — диагональ 157° + верхний блик,
    // а не плоский тон. Тогда снаружи и внутри — один материал.
    var td1 = (typeof bosMixHex === "function") ? bosMixHex(accent, "#0d0f14", 0.16) : accent;
    var td2 = (typeof bosMixHex === "function") ? bosMixHex(accent, "#0d0f14", 0.30) : accent;
    return {
    hasColor: true, accent: accent,
    bg: "radial-gradient(135% 100% at 50% -12%, rgba(255,255,255,0.16), rgba(255,255,255,0) 58%), linear-gradient(157deg, " + td1 + " 0%, " + td2 + " 100%)",
    shadow: "0 4px 12px rgba(0,0,0,0.45), inset 0 0 0 0.5px rgba(255,255,255,0.10)",
    txt: "#fff", sub: "rgba(255,255,255,0.72)", lbl: "rgba(255,255,255,0.6)", val: "rgba(255,255,255,0.85)",
    track: "rgba(0,0,0,0.35)", fill: (typeof bosLightenHex === "function") ? bosLightenHex(accent, 0.18) : accent,
    iconBg: BOS_TILE_SHEEN + ", " + accent, iconInk: "#fff",
    };
  }
  var soft = (typeof bosLightenHex === "function") ? bosLightenHex(accent, 0.52) : accent;
  var stop = (typeof bosLightenHex === "function") ? bosLightenHex(accent, 0.60) : accent; // верх светлее
  var slow = (typeof bosLightenHex === "function") ? bosLightenHex(accent, 0.45) : accent; // низ глубже
  return {
    hasColor: true, accent: accent,
    bg: "radial-gradient(135% 100% at 50% -12%, rgba(255,255,255,0.5), rgba(255,255,255,0) 60%), linear-gradient(157deg, " + stop + " 0%, " + soft + " 52%, " + slow + " 100%)",
    shadow: "0 4px 11px rgba(50,40,20,0.10), inset 0 0 0 0.5px rgba(255,255,255,0.55)",
    txt: "#1b1b1f", sub: "rgba(27,27,31,0.58)", lbl: "rgba(27,27,31,0.5)", val: "rgba(27,27,31,0.72)",
    track: "rgba(255,255,255,0.55)", fill: accent,
    iconBg: BOS_TILE_SHEEN + ", " + ((typeof bosLightenHex === "function") ? bosLightenHex(accent, 0.25) : accent), iconInk: "#fff",
  };
}
function HabitTileLive({ habit, ctx = { mode: false }, from = "habits" }) {
  const app = (typeof useApp === "function") ? useApp() : null;
  const navigate = ((typeof useNav === "function") ? useNav() : {}).navigate || function () {};
  const isDark = !!(app && app.themeOverride === "dark");
  const cardStyle = useBosCardStyle();
  const th = bosTileTheme(isDark), rowBg = th.rowBg, cardShadow = th.cardShadow;
  const toggle = (app && app.toggleHabit) || function () {};
  const h = habit;
  const hc = (typeof bosCanonColor === "function") ? bosCanonColor(h.color) : h.color;
  const hcNeutral = !hc || hc === "#0a0a0a" || ("" + hc).toLowerCase() === "#8e8e93";
  const rect = cardStyle.form === "rect";
  // Тумблер «Тонировать фон» (cardTint) = весь фон карточки в цвете (как у цели); выкл (по умолч.) → белая.
  // Плитка/дни/чекбокс цветные ВСЕГДА. Нейтраль (Стандарт) не тонируется. Существующие привычки без
  // cardTint → белая карточка (спокойная главная не меняется).
  const _tinted = h.cardTint === true && !hcNeutral && typeof bosGoalSkin === "function";
  const _sk = _tinted ? bosGoalSkin(hc, isDark, true) : null;
  const _cardBg = _tinted ? _sk.bg : rowBg;
  const _cardSh = _tinted ? _sk.shadow : cardShadow;
  const _nameCol = _tinted ? _sk.txt : "var(--text)";
  const onOpen = ctx.mode ? undefined : () => navigate("habit-detail", { habit: h, from: from });
  const control = h.duration > 0 && !(h.goalPerDay > 1)
    ? <HabitTimerCheck habit={h} app={app} xp={10} />
    : h.goalPerDay > 1 ? <HabitCountCheck habit={h} app={app} xp={10} />
    : <HabitCheck done={h.done} onToggle={() => toggle(h.id)} xp={10} float color={hc} dark={isDark} />;
  const ctrl = <span onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>{control}</span>;
  const faces = cardStyle.faces ? <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}><HabitBuddyAvatarsLive habit={h} size={rect ? 16 : 20} max={rect ? 5 : 3} />{typeof CircleFacesLive === "function" && <CircleFacesLive habit={h} size={rect ? 16 : 20} max={rect ? 5 : 3} />}</span> : null;
  const sq = cardStyle.cells === "square";
  const marks = cardStyle.marks === "week" ? <HabitWeekStrip habit={h} fill square={sq} /> : cardStyle.marks === "month" ? <HabitMonthMini habit={h} square={sq} /> : null;
  const icon = <span className="bos-ticon" style={{ width: 38, height: 38, borderRadius: 13, background: _tinted ? _sk.iconBg : (BOS_TILE_SHEEN + ", " + ((hc && !hcNeutral) ? hc + "26" : th.iconBg)), boxShadow: bosTileGlass(isDark), display: "grid", placeItems: "center", fontSize: 19, flexShrink: 0 }}>{bosIcon(h.emoji, 21, hc)}</span>;
  const chip = (typeof ChallengeProgressChip === "function") ? <ChallengeProgressChip habit={h} /> : null;
  if (rect) {
    return (
      <div className={ctx.mode ? "" : "tap"} onClick={onOpen} style={{ background: _cardBg, borderRadius: 18, boxShadow: _cardSh, padding: "11px 14px", display: "flex", alignItems: "center", gap: 13, pointerEvents: ctx.mode ? "none" : "auto", overflow: "hidden" }}>
        {icon}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15.5, fontWeight: 600, color: _nameCol, letterSpacing: "-0.2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.name}</div>
          {chip}
          {marks && <div style={{ marginTop: 8 }}>{marks}</div>}
        </div>
        {faces}{ctrl}
      </div>
    );
  }
  const compact = cardStyle.marks === "none";
  return (
    <div className={ctx.mode ? "" : "tap"} onClick={onOpen} style={{ background: _cardBg, borderRadius: 22, boxShadow: _cardSh, padding: "13px 13px 12px", minHeight: compact ? undefined : 146, display: "flex", flexDirection: "column", pointerEvents: ctx.mode ? "none" : "auto", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        {icon}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>{faces}{ctrl}</div>
      </div>
      {chip}
      {cardStyle.name && <div style={{ marginTop: "auto", paddingTop: 10, fontSize: 15, fontWeight: 600, color: _nameCol, letterSpacing: "-0.2px", lineHeight: 1.25, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{h.name}</div>}
      {marks && <div style={{ marginTop: cardStyle.name ? 7 : "auto", paddingTop: cardStyle.name ? 0 : 12 }}>{marks}</div>}
    </div>
  );
}
/* Стабильный ключ плитки круга для homeLayout: облачный id живёт дольше локального. */
function bosTeamKeyLive(t) {
  if (!t) return "t:";
  const id = (t.cloudId != null && t.cloudId !== "") ? t.cloudId : (t._id != null ? t._id : t.id);
  return "t:" + id;
}

/* ПЛИТКА КРУГА (совместной цели) — вынесена из habits_live в ОБЩИЙ компонент, потому что
   теперь живёт и на ГЛАВНОЙ (ключи t:<id> в homeLayout), не только на «Привычках».
   Та же форма, что плитка цели (goalStyle: баннер/квадрат + орбиты + прогресс), но эмблема,
   ЛИЦА участников и командный счёт; ест stale-while-revalidate кэш детали (_bosTeamGet). */
function TeamTileLive({ team: t, ctx = { mode: false }, from = "habits", big = false }) {
  // David 2026-07-15: «карточки должны выглядеть как на макете и стандартизированно, не важно,
  // на какой странице я это вижу». Раньше тут жили ТРИ вида (баннер/квадрат/орбиты) + нить,
  // приделанная к одному из них, — это и была каша. Теперь плитка круга ВЕЗДЕ одна и та же:
  // BosCircleCardLive (утверждённый макет «Волна дня»). Прежние ветки — в git до v762,
  // настройка вида — в _parked/goal-card-styles/README.md.
  const navigate = ((typeof useNav === "function") ? useNav() : {}).navigate || function () {};
  const onOpen = ctx.mode ? undefined : function () { navigate("team-detail", { team: t, from: from }); };
  return <BosCircleCardLive t={t} joined ctx={ctx} onOpen={onOpen} />;
}

function GoalTileLive({ goal, ctx = { mode: false }, from = "habits" }) {
  const app = (typeof useApp === "function") ? useApp() : null;
  const navigate = ((typeof useNav === "function") ? useNav() : {}).navigate || function () {};
  const isDark = !!(app && app.themeOverride === "dark");
  const goalStyle = useBosGoalStyle();
  const habits = (app && app.habits) || [];
  const g = goal;
  const banner = goalStyle.form === "banner";
  const gp = (typeof bosGoalProgress === "function") ? bosGoalProgress(g, habits) : { pct: g.target > 0 ? Math.min(1, (g.current || 0) / g.target) : 0, current: g.current || 0 };
  const pct = gp.pct;
  const curVal = gp.current;
  const sk = bosGoalSkin(g.color, isDark, g.tint !== false);
  const onOpen = ctx.mode ? undefined : () => navigate("goal-detail", { goal: g, from: from });
  const orbit = (goalStyle.orbits && typeof GoalCardOrbit === "function") ? <GoalCardOrbit goal={g} habits={habits} size={banner ? 132 : 152} dark={isDark} fade progress={pct} /> : null;
  // ГЛАВНЫЙ ЧИП на внешней плитке цели (David: «главные чипы тоже отражены»): достигнуто / срок /
  // сегодня по привычкам. Плавает слева над орбитой; в «плоском» стиле не показываем (там уже иконка).
  let _dLeft = null;
  if (g.deadline) { try { const _ms = new Date(g.deadline).getTime() - Date.now(); if (!isNaN(_ms)) _dLeft = Math.ceil(_ms / 86400000); } catch (e) {} }
  const _linkedT = (gp.linked && gp.linked.length) ? gp.linked : [];
  const _goalChipTxt = pct >= 1 ? "🎉 Готово"
    : (_dLeft === 0 ? "⏳ сегодня"
    : (_dLeft != null && _dLeft > 0 && _dLeft <= 90 ? "⏳ " + _dLeft + " дн"
    : (_linkedT.length ? "✓ " + _linkedT.filter((h) => h.done).length + "/" + _linkedT.length + " сегодня" : null)));
  const _goalFloat = (!ctx.mode && orbit && _goalChipTxt) ? (
    <span style={{ position: "absolute", top: 10, left: 11, zIndex: 3, display: "inline-flex", alignItems: "center", gap: 3, maxWidth: "72%", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", background: isDark ? "rgba(0,0,0,0.24)" : "rgba(255,255,255,0.66)", color: sk.hasColor ? sk.txt : sk.accent, fontSize: 10.5, fontWeight: 700, padding: "3px 8px", borderRadius: 999, backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", pointerEvents: "none" }}>{_goalChipTxt}</span>
  ) : null;
  const pctEl = <span style={{ fontSize: 13, fontWeight: 800, color: sk.hasColor ? sk.txt : sk.accent, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{Math.round(pct * 100)}%</span>;
  const icon = <span className="bos-ticon" style={{ width: 40, height: 40, borderRadius: 13, background: sk.iconBg, boxShadow: bosTileGlass(isDark), display: "grid", placeItems: "center", fontSize: 20, flexShrink: 0 }}>{bosIcon(g.emoji || "🎯", 22, sk.hasColor ? sk.iconInk : g.color)}</span>;
  const progBar = goalStyle.progress ? (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: sk.lbl, textTransform: "uppercase", letterSpacing: 0.7 }}>Цель</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: sk.val, fontVariantNumeric: "tabular-nums" }}>{curVal} / {g.target} {g.unit || ""}</span>
      </div>
      <div style={{ height: 7, borderRadius: 999, background: sk.track, overflow: "hidden" }}>
        <span style={{ display: "block", height: "100%", width: (pct * 100) + "%", borderRadius: 999, background: sk.hasColor ? sk.fill : ("linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0) 72%), " + sk.accent) }} />
      </div>
    </div>
  ) : null;
  if (banner) {
    return (
      <div className={ctx.mode ? "" : "tap"} onClick={onOpen} style={{ background: sk.bg, borderRadius: 22, boxShadow: sk.shadow, padding: 16, display: "flex", alignItems: "center", gap: 14, minHeight: 116, pointerEvents: ctx.mode ? "none" : "auto", overflow: "hidden" }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 11 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {!orbit && icon}
            <div style={{ flex: 1, minWidth: 0 }}>
              {goalStyle.name && <div style={{ fontSize: 16, fontWeight: 700, color: sk.txt, letterSpacing: "-0.3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</div>}
              {g.deadline && <div style={{ fontSize: 11.5, color: sk.sub, marginTop: 1 }}>до {bosFmtDeadline(g.deadline)}</div>}
            </div>
            {!orbit && pctEl}
          </div>
          {progBar}
        </div>
        {orbit}
      </div>
    );
  }
  return (
    <div className={ctx.mode ? "" : "tap"} onClick={onOpen} style={{ background: sk.bg, borderRadius: 22, boxShadow: sk.shadow, padding: "13px 13px 12px", height: orbit ? 146 : undefined, minHeight: 146, boxSizing: "border-box", position: "relative", display: "flex", flexDirection: "column", alignItems: "stretch", justifyContent: "flex-start", textAlign: "left", pointerEvents: ctx.mode ? "none" : "auto", overflow: "hidden" }}>
      {_goalFloat}
      {orbit ? (
        <>
          <div aria-hidden style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", pointerEvents: "none" }}>{orbit}</div>
          <div style={{ marginTop: "auto", position: "relative", display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
            {goalStyle.name ? <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: sk.txt, letterSpacing: "-0.2px", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</div> : <span />}
            {goalStyle.progress && <div style={{ fontSize: 12.5, fontWeight: 800, color: sk.hasColor ? sk.txt : sk.accent, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{Math.round(pct * 100)}%</div>}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>{icon}{pctEl}</div>
          {goalStyle.name && <div style={{ marginTop: 10, fontSize: 15, fontWeight: 600, color: sk.txt, letterSpacing: "-0.2px", lineHeight: 1.25, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{g.name}</div>}
          {progBar && <div style={{ marginTop: "auto", paddingTop: 12 }}>{progBar}</div>}
        </>
      )}
    </div>
  );
}

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
function CardStyleMenuLive({ open, onClose, anchorRef, onArchiveList, placement }) {
  const [pos, setPos] = React.useState(null);
  const [hs, setHs] = React.useState(bosLoadCardStyle);
  // Тёмная тема и Эффект стекла УЕХАЛИ отсюда в «Я → Настройки» (конституция §14: одна настройка —
  // один дом; глобальное не живёт на доске). Здесь остаётся только ВИД доски (стиль привычек/целей)
  // и доступ к Архиву. Тумблеры темы/стекла — единственный дом: Я → Настройки → Предпочтения.
  React.useEffect(() => {
    if (!open) return;
    setHs(bosLoadCardStyle());
    // Из шестерёнки в ТРЯСКЕ (placement="bottom") — по ЦЕНТРУ над панелью «Готово», всплывает снизу
    // (David: «должна открываться по центру над Готово, из шестерёнки»). Иначе — под якорем/справа.
    if (placement === "bottom") { setPos({ mode: "bottom" }); }
    // «bottom-low» — из меню карточки (David 2026-07-11: «оцентрировать и поставить на нижнее меню»):
    // по центру, прижато к таб-бару (там нет панели «Готово», 150px висело бы в воздухе).
    else if (placement === "bottom-low") { setPos({ mode: "bottomLow" }); }
    else if (anchorRef && anchorRef.current) { const r = anchorRef.current.getBoundingClientRect(); setPos({ right: Math.round(window.innerWidth - r.right), top: Math.round(r.bottom + 10) }); }
    else setPos({ right: 12, top: 78 });
  }, [open, placement]);
  if (!open || !pos) return null;
  const setH = (patch) => { const n = Object.assign({}, hs, patch); setHs(n); bosSaveCardStyle(n); };
  // Иконки форм = ОЧЕРТАНИЯ наших реальных блоков (David: «просто формы наших блоков, без подписей»).
  // Квадрат — два блока чуть шире, наше скругление; Строка — два ряда с бóльшим зазором и скруглением
  // (как наша плитка-строка); Баннер — David: «хорошая иконка», оставляем.
  const SQ = (<svg width="38" height="22" viewBox="0 0 34 20" fill="none"><rect x="1.5" y="3" width="14.5" height="14" rx="4" stroke="#0a0a0a" strokeWidth="1.6" /><rect x="18" y="3" width="14.5" height="14" rx="4" stroke="#0a0a0a" strokeWidth="1.6" /></svg>);
  const RC = (<svg width="38" height="22" viewBox="0 0 34 20" fill="none"><rect x="2" y="2" width="30" height="6.5" rx="3.2" stroke="#0a0a0a" strokeWidth="1.6" /><rect x="2" y="11.5" width="30" height="6.5" rx="3.2" stroke="#0a0a0a" strokeWidth="1.6" /></svg>);
  const BN = (<svg width="38" height="22" viewBox="0 0 34 20" fill="none"><rect x="2" y="3" width="30" height="14" rx="3.5" stroke="#0a0a0a" strokeWidth="1.6" /><circle cx="8" cy="10" r="2.4" stroke="#0a0a0a" strokeWidth="1.4" /><rect x="14" y="7" width="15" height="2" rx="1" fill="#0a0a0a" /><rect x="14" y="12" width="10" height="2" rx="1" fill="#0a0a0a" opacity="0.5" /></svg>);
  // Форм-кнопка — ТОЛЬКО иконка (David: «не подписывай строка/квадрат, оставь иконки»).
  const formBtn = (key, icon, cur, onPick) => (
    <button key={key} onClick={() => onPick(key)} className="tap" style={{ flex: 1, display: "grid", placeItems: "center", padding: "13px 6px", borderRadius: 12, border: cur === key ? "1.5px solid #0a0a0a" : "1.5px solid rgba(10,10,10,0.12)", background: cur === key ? "rgba(10,10,10,0.05)" : "transparent", cursor: "pointer" }}>
      {icon}
    </button>
  );
  // Компактный сегмент — СВОЙ (шаренный .tab-pill с padding 18px не влезал в узкую панель).
  const seg = (val, opts, onPick) => (
    <div style={{ display: "flex", gap: 4, background: "rgba(10,10,10,0.05)", borderRadius: 11, padding: 3 }}>
      {opts.map((o) => (
        <button key={o.v} onClick={() => onPick(o.v)} className="tap" style={{ flex: 1, minWidth: 0, border: 0, borderRadius: 8, padding: "5.5px 4px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", background: val === o.v ? "#fff" : "transparent", color: val === o.v ? "#0a0a0a" : "rgba(10,10,10,0.5)", boxShadow: val === o.v ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>{o.l}</button>
      ))}
    </div>
  );
  const toggleRow = (label, on, onCh) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 2px", fontSize: 13.5, fontWeight: 500, color: "#0a0a0a" }}>
      <span>{label}</span><Switch small on={on} onChange={onCh} />
    </div>
  );
  const divider = <div style={{ height: 1, background: "rgba(10,10,10,0.08)", margin: "10px 0 8px" }} />;
  return ReactDOM.createPortal(
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 8000, background: "rgba(18,22,38,0.16)", animation: "dimIn 0.18s ease both" }}>
      <div role="menu" onClick={(e) => e.stopPropagation()} style={{ position: "fixed",
        ...(pos.mode === "bottom"
          ? { left: "calc(50% - 134px)", bottom: "calc(var(--bos-safe-bottom, 0px) + 150px)", transformOrigin: "bottom center" }
          : pos.mode === "bottomLow"
          ? { left: "calc(50% - 134px)", bottom: "calc(var(--bos-safe-bottom, 0px) + 96px)", transformOrigin: "bottom center" }
          : { right: pos.right, top: pos.top, transformOrigin: "top right" }),
        animation: "bosMenuPop 0.34s cubic-bezier(0.34,1.5,0.4,1) both", width: 268, padding: 12, borderRadius: 20,
        // Плотный фон (David: «меню не должно быть прозрачным — сбивает, не видно что выбираешь»):
        // почти непрозрачное, чтобы надписи и тумблеры читались на любой доске.
        background: "rgba(255,255,255,0.98)", WebkitBackdropFilter: "blur(20px) saturate(150%)", backdropFilter: "blur(20px) saturate(150%)", border: "0.5px solid rgba(0,0,0,0.07)", boxShadow: "0 16px 44px rgba(20,30,60,0.22)", color: "#0a0a0a" }}>
        {/* Вкладка «Цели» ОТЛОЖЕНА (David 2026-07-15): вид карточки цели/круга больше не
            настройка, а один стандарт — см. _parked/goal-card-styles/. Сегмент вкладок убран
            за ненадобностью: тело осталось одно. Привычки и Архив — как были. */}
        <div style={{ fontSize: 11.5, fontWeight: 600, marginBottom: 7, color: "rgba(10,10,10,0.5)" }}>Вид привычек</div>
        {/* David: дефолт (строка) СЛЕВА, квадрат справа — «всё дефолтное по сути слева». */}
        <div style={{ display: "flex", gap: 7 }}>{formBtn("rect", RC, hs.form, (k) => setH({ form: k }))}{formBtn("square", SQ, hs.form, (k) => setH({ form: k }))}</div>
        {divider}
        <div style={{ fontSize: 11.5, fontWeight: 600, marginBottom: 6, color: "rgba(10,10,10,0.5)" }}>Отметки</div>
        {seg(hs.marks, [{ v: "none", l: "Нет" }, { v: "week", l: "Неделя" }, { v: "month", l: "Месяц" }], (v) => setH({ marks: v }))}
        {hs.marks !== "none" && <div style={{ marginTop: 8 }}>{seg(hs.cells || "round", [{ v: "round", l: "Кружки" }, { v: "square", l: "Квадраты" }], (v) => setH({ cells: v }))}</div>}
        <div style={{ marginTop: 6 }}>
          {toggleRow("Люди", hs.faces, (v) => setH({ faces: v }))}
          {hs.form === "square" && toggleRow("Название", hs.name, (v) => setH({ name: v }))}
        </div>
        {/* Архив — всегда доступен (тема/стекло уехали в Я → Настройки по §14; здесь остаётся только
            вид доски + доступ к архиву скрытых привычек/целей). */}
        {typeof onArchiveList === "function" && (
          <>
            <div style={{ height: 1, background: "rgba(10,10,10,0.08)", margin: "10px 0 4px" }} />
            <button onClick={() => { onClose(); onArchiveList(); }} className="tap" style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", marginTop: 4, border: 0, borderRadius: 11, padding: "9px 2px", background: "transparent", cursor: "pointer", color: "#0a0a0a", textAlign: "left" }}>
              <span style={{ width: 26, height: 26, display: "grid", placeItems: "center", flexShrink: 0, color: "#0a0a0a" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="4" rx="1" /><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" /><path d="M10 12h4" /></svg>
              </span>
              <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>Архив</span>
              <I.ChevronRight size={15} color="rgba(10,10,10,0.4)" />
            </button>
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
  // Visual = the unified animated ShareSheetLive (centre = this goal's image, people grow around).
  return <ShareSheetLive kind="goal" dark={dark} subject={{ name: goal && goal.name, emoji: goal && goal.emoji, color: goal && goal.color, link: shareUrl }} />;
}

function MoodWidgetLive({ mood, app, isDark, navigate, flush = false }) {
  const _sheet = (typeof useSheet === "function") ? useSheet() : null;
  const _openState = () => { if (_sheet && _sheet.open) _sheet.open(<StateSheetLive />); else if (navigate) navigate("mood"); };
  const _WD = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const _monOff = (new Date().getDay() + 6) % 7; // 0=Пн … 6=Вс — TODAY's slot in the week
  // Rebuilt only when the day-mood map (or today's slot) changes — not on every parent
  // re-render (this widget re-renders on any Home state change).
  const last7 = React.useMemo(() => [0, 1, 2, 3, 4, 5, 6].map(i => {
    const off = _monOff - i; // days ago (negative = a day later this week)
    const key = (typeof bosDayKeyOffset === "function") ? bosDayKeyOffset(off) : "";
    const di = (app?.dayMoods && app.dayMoods[key] != null) ? app.dayMoods[key] : null;
    return { key, today: i === _monOff, future: off < 0, wd: _WD[i], m: (di != null && typeof bosStateResolve === "function") ? bosStateResolve(di) : null };
  }), [app?.dayMoods, _monOff]);
  const logged = last7.filter(d => d.m).length;
  // Today's picked facets (chips from the state sheet) → shown as the sub-line, so the widget
  // reflects the FULL state, not just the valence orb. (David: «орб — единая связанная структура».)
  const _tkW = (typeof bosTodayKey === "function") ? bosTodayKey() : "";
  const _facets = ((app && app.dayNotes && app.dayNotes[_tkW] && app.dayNotes[_tkW].tags) || [])
    .map((t) => ((typeof bosFacetByLabel === "function" && bosFacetByLabel(t)) || { i: "", t: "" + t }));
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
    <button onClick={_openState} className="tap" data-tour="state"
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
          <div style={{ fontFamily: "var(--bos-title-font)", fontSize: 26, fontWeight: 600, lineHeight: 1.1, letterSpacing: "-0.6px", marginTop: 4, color: titleColor }}>{(mood.i ? mood.i + " " : "") + mood.t}</div>
          {_facets.length
            ? <div style={{ fontSize: 12.5, color: subMuted, marginTop: 5, lineHeight: 1.45 }}>{_facets.map((f) => (f.i ? f.i + " " : "") + f.t).join("   ·   ")}</div>
            : <div style={{ fontSize: 12, color: subMuted, marginTop: 4 }}>Отмечай каждый день, добавляй строку — удержишь неделю подряд, получишь бонус.</div>}
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
                <StaticOrb size={22} tint={tintFromMood(d.m.c)} seed={1.2} intensity={0.45} />
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
      background: "linear-gradient(150deg, var(--disc-a, #eef1f6), var(--disc-b, #dadfe7))", boxShadow: "0 2px 7px rgba(0,0,0,0.12)" }}>
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
    <button onClick={() => navigate("profile", { from: "home" })} className="tap" title="Профиль" aria-label="Профиль, орбиты и настройки"
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
// ЕДИНЫЙ шрифт «живой строки ИИ» (v594, David: «такие вещи должны быть стандартизированы
// сквозь всё приложение»). Один источник для hero-баннера главной И блока «Сейчас» на
// странице ИИ — меняешь здесь, меняется везде.
var BOS_AI_TEXT = { fontSize: 13, fontWeight: 400, lineHeight: 1.45, letterSpacing: "-0.1px", color: "var(--text)" };

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
    "Спокойствие": "Спокойствие — время для дела, что требует сосредоточенности.",
    "Тревога":     "Начни с двух минут дыхания — и день станет легче.",
    "Упадок":      "Сделай одно маленькое дело — этого сегодня достаточно.",
    "Усталость":   "Сбавь темп: закрой одну привычку — и довольно.",
  };
  const aiBrief = (totalCount && doneCount >= totalCount)
    ? "Идеальный день — ты в потоке. Так держи ритм."
    : (AI_BRIEF[mood && mood.t] || "Один маленький шаг сегодня — и ритм на твоей стороне.");
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
  // «Баланс дня» на главной НЕ показывается (David 2026-07-09: «оттуда это зачистить») —
  // герой как был: живая ИИ-строка + чипы-подсказки. Сам цикл живёт в shell (bosDailyBalanceLive)
  // и говорит только шторкой «День собран», когда день реально собран.

  const page1 = newbie ? (
    <div key="hints" style={{ position: "relative", padding: 16, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 13, alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div key={_homeSummary} style={{ ...BOS_AI_TEXT, animation: _liveBrief ? "briefFade 0.5s ease both" : undefined }}><span style={{ display: "inline-block", verticalAlign: "-2px", marginRight: 6 }}><I.Sparkles size={13} color="#EF9F14" filled strokeWidth={0} /></span>{_liveBrief ? _homeSummary : "Расскажи о себе — и я подскажу, с каких привычек начать."}</div>
        </div>
        {/* Аватар с кольцом уровня УЕХАЛ в шапку главной (David 2026-07-15) — здесь блок про
            советы ИИ, а не про аккаунт. См. home_live, top bar. */}
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
          }}><span style={{ flexShrink: 0, display: "inline-flex" }}>{bosPillGlyphLive(c, { size: 15, color: "var(--text-2)" })}</span><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.t}</span></button>
        ))}
      </div>
    </div>
  ) : (
    <div key="quote" style={{ position: "relative", padding: 16, boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div key={_homeSummary} style={{ ...BOS_AI_TEXT, animation: "briefFade 0.5s ease both" }}>
            <span style={{ display: "inline-block", verticalAlign: "-2px", marginRight: 6 }}><I.Sparkles size={13} color="#EF9F14" filled strokeWidth={0} /></span>{_homeSummary}
          </div>
        </div>
        {/* Аватар с кольцом уровня УЕХАЛ в шапку главной (David 2026-07-15). */}
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
          }}><span style={{ flexShrink: 0, display: "inline-flex" }}>{bosPillGlyphLive(c, { size: 15, color: "var(--text-2)" })}</span><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{bosPillLabel(c)}</span></button>
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
// Кэш последнего удачного списка открытых кругов (витрина, НЕ поиск) — переживает перемонтаж
// и обрыв сети, чтобы публичный круг не «то появлялся, то исчезал» при каждом заходе на «Круги».
/* Кэш витрины открытых кругов — ПЕРСИСТЕНТНЫЙ (David 2026-07-17: «Общие цели подгружаются
   через 2-4 секунды, а должны быть сразу»): с прошлого визита лежит в localStorage, секции
   стартуют мгновенно, сеть обновляет фоном (SWR). Данные публичные — хранить безопасно. */
var _bosDiscoverCache = (function () {
  try { var v = JSON.parse(localStorage.getItem("bos:cache:discover") || "null"); return Array.isArray(v) ? v : null; } catch (e) { return null; }
})();
function _bosDiscoverCachePut(arr) {
  _bosDiscoverCache = arr;
  try { localStorage.setItem("bos:cache:discover", JSON.stringify((arr || []).slice(0, 30))); } catch (e) {}
}
/* КОМПАКТНАЯ карточка круга — полширины, «волна дня» без лиц (мокап _devcircle2;
   David 2026-07-16: «в Сообществе все цели и круги — всегда компактной карточкой»).
   Данные и персистентный кэш ТЕ ЖЕ, что у большой карточки, — вид миниатюрный:
   диск+имя → мини-волна на линии дня → «N чел · K сегодня» / «Вступить». */
function BosCircleCardCompactLive({ t, joined, onOpen, onJoin, busy, requested }) {
  const app = (typeof useApp === "function") ? useApp() : null;
  const isDark = !!(app && app.themeOverride === "dark");
  const ck = t.cloudId || t.id || null;
  const _roster = (ck && typeof _bosTeamGet === "function") ? _bosTeamGet("roster:" + ck) : null;
  const memberN = (Array.isArray(_roster) && _roster.length) ? _roster.length : (Array.isArray(t.members) ? t.members.length : (t.members || 0));
  const [times, setTimes] = React.useState(() => (ck && _bosCircleCardCache.times[ck]) || null);
  React.useEffect(() => {
    if (!ck || !joined || !(window.bosCloud && window.bosCloud.enabled() && window.bosCloud.teamTodayTimes)) return;
    let on = true;
    window.bosCloud.teamTodayTimes(ck).then((r) => { if (on && r) { _bosCircleCardCache.times[ck] = r; _bosCircleCardPersist(); setTimes(r); } }).catch(() => {});
    return () => { on = false; };
  }, [ck, joined]);
  const [pulse, setPulse] = React.useState(() => (ck && _bosCircleCardCache.pulse[ck]) || null);
  React.useEffect(() => {
    if (!ck || !(window.bosCloud && window.bosCloud.enabled() && window.bosCloud.circlePulse)) return;
    let on = true;
    window.bosCloud.circlePulse(ck).then((p) => { if (on && p) { _bosCircleCardCache.pulse[ck] = p; _bosCircleCardPersist(); setPulse(p); } }).catch(() => {});
    return () => { on = false; };
  }, [ck, joined]);
  // Уровень круга (Э1): кольцо прогресса + золотая циферка на диске — грамматика бейджей
  // людей. До SQL-патча bos_team_xp сервер молчит → диск остаётся обычным (честно).
  const [cXP, setCXP] = React.useState(() => (ck && _bosCircleCardCache.xp && _bosCircleCardCache.xp[ck] != null) ? _bosCircleCardCache.xp[ck] : null);
  React.useEffect(() => {
    if (!ck || !(window.bosCloud && window.bosCloud.enabled() && window.bosCloud.teamXP)) return;
    let on = true;
    const load = () => bosTeamXPBatch(ck).then((v) => { if (on && v != null) { _bosCircleCardCache.xp[ck] = v; _bosCircleCardPersist(); setCXP(v); } });
    load();
    window.addEventListener("bos:teamxp", load);
    return () => { on = false; window.removeEventListener("bos:teamxp", load); };
  }, [ck]);
  const lvl = (cXP != null && typeof bosCircleLevel === "function") ? bosCircleLevel(cXP) : null;
  const _pt = (x) => (typeof bosParseTs === "function" ? bosParseTs(x) : new Date(x));
  let hours = [];
  if (joined && times && times.times) hours = Object.keys(times.times).map((u) => { const d = _pt(times.times[u]); return d.getHours() + d.getMinutes() / 60; });
  else if (pulse && Array.isArray(pulse.mins) && pulse.mins.length) hours = pulse.mins.map((m) => (typeof bosUtcMinToHour === "function" ? bosUtcMinToHour(m) : m / 60));
  const todayN = Math.max(pulse ? (pulse.todayN | 0) : 0, (joined && times && times.times) ? Object.keys(times.times).length : 0);
  const nowPct = bosThreadPct(new Date().getHours() + new Date().getMinutes() / 60);
  const track = isDark ? "rgba(255,255,255,0.13)" : "rgba(10,10,10,0.10)";
  const cap = [];
  // Возраст — первым (David 2026-07-16: человек со стороны хочет видеть, сколько цель живёт).
  const _ageD = t.createdAt ? Math.max(1, Math.floor((Date.now() - new Date(t.createdAt).getTime()) / 86400000) + 1) : 0;
  if (_ageD > 1) cap.push("живёт " + _ageD + " дн");
  if (memberN) cap.push(memberN + " чел");
  if (todayN) cap.push(todayN + " сегодня");
  const body = (
    <React.Fragment>
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        {lvl ? (
          <span style={{ position: "relative", width: 34, height: 34, flexShrink: 0 }}>
            <svg viewBox="0 0 36 36" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
              <circle cx="18" cy="18" r="16" fill="none" stroke={isDark ? "rgba(255,255,255,0.13)" : "rgba(10,10,10,0.08)"} strokeWidth="2.6" />
              <circle cx="18" cy="18" r="16" fill="none" stroke={BOS_THREAD_GOLD} strokeWidth="2.6" strokeLinecap="round" strokeDasharray="100.5" strokeDashoffset={(100.5 * (1 - lvl.frac)).toFixed(1)} />
            </svg>
            <span style={{ position: "absolute", inset: 4, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 13,
              background: (typeof BOS_ORB_SHEEN !== "undefined" ? BOS_ORB_SHEEN + ", " : "") + (isDark ? "linear-gradient(160deg,#464c58,#30353f)" : "linear-gradient(160deg,var(--disc-a,#eef1f6),var(--disc-b,#dadfe7))"),
              boxShadow: (typeof bosOrbGlass === "function" ? bosOrbGlass(isDark) : "none") }}>{bosIcon(t.emblem || "👥", 13, null)}</span>
            <span style={{ position: "absolute", right: -5, bottom: -3, minWidth: 15, height: 15, padding: "0 3px", borderRadius: 999, background: isDark ? "#26262b" : "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 8.5, fontWeight: 800, color: "#B4820A", lineHeight: 1 }}>{lvl.level}</span>
          </span>
        ) : (
          <span style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", fontSize: 15,
            background: (typeof BOS_ORB_SHEEN !== "undefined" ? BOS_ORB_SHEEN + ", " : "") + (isDark ? "linear-gradient(160deg,#464c58,#30353f)" : "linear-gradient(160deg,var(--disc-a,#eef1f6),var(--disc-b,#dadfe7))"),
            boxShadow: (typeof bosOrbGlass === "function" ? bosOrbGlass(isDark) : "none") }}>{bosIcon(t.emblem || "👥", 15, null)}</span>
        )}
        <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.2px", lineHeight: 1.15, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{t.name}</span>
      </div>
      {/* Описание/цель круга (David 2026-07-16: «места хватает — пусть видно описание, если есть»). */}
      {(() => {
        const d = (typeof t.desc === "string" && t.desc) || (typeof t.goal === "string" && t.goal) || (typeof t.goalKind === "string" && t.goalKind) || "";
        return d ? <div style={{ fontSize: 10, color: "var(--text-4)", lineHeight: 1.35, marginTop: 5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{d}</div> : null;
      })()}
      <div style={{ position: "relative", height: 30, marginTop: 8 }}>
        {hours.length > 0 && (
          <svg viewBox="0 0 150 22" preserveAspectRatio="none" style={{ position: "absolute", left: 0, right: 0, bottom: 7, width: "100%", height: 22 }}>
            <defs><linearGradient id="bosCWaveG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BOS_THREAD_GOLD_L} stopOpacity="0.85" /><stop offset="100%" stopColor={BOS_THREAD_GOLD} stopOpacity="0.10" />
            </linearGradient></defs>
            <path d={bosThreadWave(hours, 150, 22)} fill="url(#bosCWaveG)" />
          </svg>
        )}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 8, height: 1.5, borderRadius: 2, background: track }} />
        <div style={{ position: "absolute", left: 0, bottom: 8, height: 1.5, width: nowPct + "%", borderRadius: 2, background: "linear-gradient(90deg," + BOS_THREAD_GOLD_L + "," + BOS_THREAD_GOLD + ")" }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2, minHeight: 24 }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: 10.5, fontWeight: 600, color: "var(--text-4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cap.join(" · ") || " "}</span>
        {!joined && onJoin && (
          <button onClick={(e) => { e.stopPropagation(); if (!busy && !requested) onJoin(t); }} className="tap"
            style={{ border: 0, borderRadius: 999, padding: "5px 11px", fontSize: 10.5, fontWeight: 700, cursor: "pointer", flexShrink: 0,
              background: requested ? (isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)") : (isDark ? "#fff" : "#0a0a0a"),
              color: requested ? "var(--text-3)" : (isDark ? "#0a0a0a" : "#fff"), opacity: busy ? 0.6 : 1 }}>
            {requested ? "Заявка ✓" : "Вступить"}
          </button>
        )}
      </div>
    </React.Fragment>
  );
  const style = { background: "var(--card)", borderRadius: 18, padding: "11px 12px", boxShadow: "var(--card-shadow)", textAlign: "left", minWidth: 0 };
  return onOpen
    ? <div className="tap" onClick={onOpen} style={{ ...style, cursor: "pointer" }}>{body}</div>
    : <div style={style}>{body}</div>;
}

function CloudTeamsDiscoverLive({ app, query, onCount, navigate }) {
  const isDark = app?.themeOverride === "dark";
  const q = ("" + (query || "")).trim();
  const isSearch = !!q;
  // Витрина стартует С КЭША → мгновенно, без мигания в пустоту; поиск всегда с чистого листа.
  const [list, setList] = React.useState(() => (isSearch ? null : _bosDiscoverCache));
  const [busy, setBusy] = React.useState({});
  const [requested, setRequested] = React.useState({});
  React.useEffect(() => {
    let on = true;
    try {
      if (window.bosCloud && window.bosCloud.enabled()) {
        const p = (isSearch && window.bosCloud.searchTeams) ? window.bosCloud.searchTeams(q) : window.bosCloud.discoverTeams();
        p.then((ts) => {
          if (!on) return;
          const arr = Array.isArray(ts) ? ts : [];
          if (!isSearch) _bosDiscoverCachePut(arr);               // обновляем кэш витрины (и localStorage)
          setList(arr); if (onCount) onCount(arr.length);
        }).catch(() => {
          // Обрыв сети/RLS: НЕ гасим витрину в пустоту — держим что было (фикс «то появляется, то исчезает»).
          if (!on) return;
          if (isSearch) { setList([]); if (onCount) onCount(0); }
          else { setList((prev) => prev || _bosDiscoverCache || []); if (onCount) onCount((_bosDiscoverCache || []).length); }
        });
      } else { if (!isSearch) setList((prev) => prev || _bosDiscoverCache || []); else setList([]); if (onCount) onCount(0); }
    } catch (e) { if (isSearch) { setList([]); if (onCount) onCount(0); } }
    return () => { on = false; };
  }, [query]);
  // Круги, где я уже состою (участник/владелец) — по cloudId: их в витрине «Открытые круги» НЕ
  // показываем (они на главной; витрина — чтобы находить ЧУЖОЕ). Владельца отсекает discoverTeams
  // на бэке (owner_id), здесь дочищаем ЧЛЕНСТВО по локальному app.teams (без race).
  const mineById = {}; ((app && app.teams) || []).forEach((t) => { if (t && t.cloudId) mineById[t.cloudId] = t; });
  // David 2026-07-15: «в открытых кругах должны показываться реальные живые круги, и НАШИ, в
  // которые мы вступили, тоже — а сейчас их там нет. И ранжироваться от самого большого
  // количества человек к самому маленькому».
  // Было: свои круги вычищались из витрины и висели отдельной секцией сверху — два списка,
  // два вида, и своих в общем ранге не видно. Стало: ОДИН список. Свои помечены joined —
  // у них нет «Вступить» (я и так внутри), всё остальное одинаково.
  // Слияние по cloudId: круг, где я состою, приходит и из discoverTeams (если владелец не я),
  // и из app.teams — берём ОДНУ запись, иначе он задвоится.
  const _seenIds = {};
  const _merged = [];
  (list || []).forEach((t) => {
    if (!t || !t.id || _seenIds[t.id]) return;
    _seenIds[t.id] = 1;
    const mine = mineById[t.id];
    _merged.push(Object.assign({}, t, mine ? { members: t.members, joined: true } : { joined: false }));
  });
  if (!isSearch) ((app && app.teams) || []).forEach((t) => {
    if (!t || !t.cloudId || _seenIds[t.cloudId] || t.vis !== "public") return;   // приватные — не открытые
    _seenIds[t.cloudId] = 1;
    _merged.push(Object.assign({}, t, { id: t.cloudId, joined: true, members: Array.isArray(t.members) ? t.members.length : (t.members || 0) }));
  });
  // Ранг: больше людей — выше (David). При равенстве — старше круг: возраст честнее алфавита.
  const shownList = _merged.sort((a, b) => {
    const d = (b.members || 0) - (a.members || 0);
    if (d) return d;
    return (Date.parse(a.createdAt || 0) || 0) - (Date.parse(b.createdAt || 0) || 0);
  });
  // МОИ ПУБЛИЧНЫЕ круги (David 2026-07-11): создатель должен ВИДЕТЬ, что его круг открыт для всех —
  // показываем их ВВЕРХУ «Открытых» карточкой Главной (TeamTileLive), без «Вступить» (он и так внутри).
  // Приватные круги сюда не попадают (они не открыты). В поиске — не мешаем (ищем чужое).

  // While LOADING (null) → render nothing (no promissory skeleton that pops then collapses).
  // Once LOADED-EMPTY ([]) → a warm, HONEST invite: «Найти» is the community pulse, so the live
  // section shouldn't read as a dead blank — but we never fabricate circles that don't exist.
  // В режиме поиска пустышка не нужна — родитель показывает общую «ничего не нашлось».
  if (!list) return null;
  if (query && !shownList.length) return null;
  if (!shownList.length) return (
    <div style={{ marginTop: 6 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-4)", padding: "4px 4px 8px", display: "flex", alignItems: "center", gap: 6 }}>{typeof BosCircleIcon === "function" ? <BosCircleIcon size={13} strokeWidth={2} color="var(--text-4)" /> : null}Общие цели</div>
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
  const _dHdr = { fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-4)", padding: "4px 4px 8px", display: "flex", alignItems: "center", gap: 6 };
  // Заголовки носили эмодзи-глобус 🌐 — про «открытость», но не про КРУГ (David 2026-07-15:
  // «там тоже должна быть иконка кругов»). Теперь тот же BosCircleIcon, что на пилюле и в «+».
  const _dHdrIcon = (typeof BosCircleIcon === "function") ? <BosCircleIcon size={13} strokeWidth={2} color="var(--text-4)" /> : null;
  return (
    <div style={{ marginTop: 10 }}>
      {/* Мои открытые круги — карточкой Главной (David: «одна карточка везде», создатель видит, что круг открыт). */}
      {shownList.length > 0 && <div style={_dHdr}>{_dHdrIcon}Общие цели</div>}
      {/* КОМПАКТ-СЕТКА 2 в ряд (David 2026-07-16: «в Сообществе все круги — компактной карточкой»). */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {shownList.map((t) => (
          <BosCircleCardCompactLive key={t.id} t={t} joined={!!t.joined} busy={!!busy[t.id]} requested={!!requested[t.id]} onJoin={join}
            onOpen={t.joined ? function () { navigate && navigate("team-detail", { team: mineById[t.id] || t, from: "community" }); } : undefined} />
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
/* ЗАГОТОВЛЕННЫЕ ОТКРЫТЫЕ КРУГИ (David 2026-07-14): популярные темы трекеров привычек — ЗОЖ и
   чистое питание. Это ШАБЛОНЫ: старт создаёт ТВОЙ ПУБЛИЧНЫЙ круг (vis="public") → он тут же
   виден другим в витрине открытых, к нему можно присоединиться. Без бутафорских участников —
   круг оживает настоящими людьми. Темы подобраны по популярности (вода, питание, движение,
   сон, цифровой детокс, благодарность). Форма как у SEED_CIRCLES → bosStartSeedCircleLive(…, "public"). */
const POPULAR_OPEN_CIRCLES = [
  { id: "open-water",    name: "Вода каждый день", emblem: "💧", goalText: "30 дней", target: 30, unit: "дней", type: "streak",     reward: 300, hook: "Восемь стаканов в день — месяц вместе",   practice: { name: "Стакан воды",     emoji: "💧" } },
  { id: "open-clean",    name: "Чистое питание",   emblem: "🥗", goalText: "21 день", target: 21, unit: "дней", type: "streak",     reward: 250, hook: "Три недели без лишнего сахара",          practice: { name: "Чистая еда",      emoji: "🥗" } },
  { id: "open-run",      name: "Бег по утрам",     emblem: "🏃", goalText: "21 день", target: 21, unit: "дней", type: "collective", reward: 250, hook: "Утренняя пробежка — заряд на весь день", practice: { name: "Пробежка",        emoji: "🏃" } },
  { id: "open-sleep",    name: "Сон до полуночи",  emblem: "🌙", goalText: "14 дней", target: 14, unit: "дней", type: "streak",     reward: 200, hook: "Ложимся вовремя — просыпаемся легко",     practice: { name: "Сон вовремя",     emoji: "🌙" } },
  { id: "open-detox",    name: "Час без экрана",   emblem: "📵", goalText: "14 дней", target: 14, unit: "дней", type: "streak",     reward: 200, hook: "Каждый вечер — час живой жизни",         practice: { name: "Без телефона",    emoji: "📵" } },
  { id: "open-thanks",   name: "Три благодарности", emblem: "🙏", goalText: "30 дней", target: 30, unit: "дней", type: "collective", reward: 300, hook: "Три хороших момента дня — каждый вечер",   practice: { name: "Благодарность",   emoji: "🙏" } },
];
/* Старт челленджа-круга — ОБЩАЯ логика (v526: её зовут и плитки новой мозаики «Найти»,
   и прежняя горизонтальная витрина): круг в «Цели» + практика в «Привычки» + облако. */
function bosStartSeedCircleLive(app, navigate, s, vis) {
  vis = vis || "private";   // «Открытые круги» стартуют публичными (vis="public") → сразу видны другим в витрине
  if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} }
  const existing = (app?.teams || []).find((t) => t.seedId === s.id);
  if (existing) { navigate("team-detail", { team: existing }); return; } // уже начал → просто в круг
  const teamObj = {
    name: s.name, emblem: s.emblem, accent: s.accent, vis: vis, seedId: s.id,
    goal: s.goalText, type: s.type, target: s.target || 0, current: 0, unit: s.unit || "",
    stake: s.reward || 0, date: "", progress: 0, members: [],   // ПРИЗ за финиш = ставка (unlock-only, без списания)
  };
  const nt = app?.addTeam(teamObj);                    // круг → сразу в «Целях» (офлайн-ок)
  const practiceHabit = { name: s.practice.name, emoji: s.practice.emoji, color: null, days: [1, 1, 1, 1, 1, 1, 1], goalPerDay: 1, reminder: { on: false } };
  let opened = false;
  try {
    if (nt && window.bosCloud && window.bosCloud.enabled()) {
      window.bosCloud.createTeam({ name: s.name, emblem: s.emblem, vis: vis, goalKind: s.goalText, goalTarget: s.target || 0, goal: { type: s.type, target: s.target || 0, unit: s.unit || "", stake: s.reward || 0 } })
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
}

/* v526: витрина больше НЕ в ленте «Найти» (её место заняла мозаика CircleTileLive с теми же данными и bosStartSeedCircleLive); компонент оставлен на случай возврата. */
function SeedCirclesShowcaseLive({ app, navigate }) {
  const isDark = app?.themeOverride === "dark";
  const start = (s) => bosStartSeedCircleLive(app, navigate, s);
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
              <span style={{ width: 44, height: 44, borderRadius: 14, background: "linear-gradient(150deg, var(--disc-a, #eef1f6), var(--disc-b, #dadfe7))", boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.06)", display: "grid", placeItems: "center", fontSize: 23, flexShrink: 0 }}>{bosIcon(s.emblem, 23, null)}</span>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.2px", marginTop: 11, lineHeight: 1.25 }}>{s.name}</div>
              <div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 3, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: 31 }}>{s.hook}</div>
              <div style={{ flex: 1, minHeight: 10 }} />
              {/* Срок (условие бонуса) + награда. Duration chip = серое стекло «⏱ N дней»; reward =
                  графит+золото «+N XP» (язык XP-бейджа, David: бейдж был кривой/мутный). Вместе они
                  читаются как «продержись N дней → +N XP за финиш». */}
              <div style={{ alignSelf: "flex-start", display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 4, ...bosChipGlass(isDark), padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 600, color: "var(--text-2)" }}>⏱ {s.goalText}</span>
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

// КАРТА ПАРТНЁРОВ (v543, David: «карта должна быть РЕАЛЬНАЯ Яндекс, а не бутафорская»).
// РЕАЛЬНАЯ Яндекс.Карта (JS API 2.1, ключ из mapkey.js → window.BOS_YANDEX_KEY), лениво грузится
// при показе; пины партнёров (эмодзи), тап → нативная деталь партнёра. Пока город один — Москва.
// РЕЗЕРВ: если Яндекс не загрузился (офлайн / нет ключа / домен) — под картой ЖИВЁТ прежняя
// СТИЛИЗОВАННАЯ карта (парк/река/дороги + пины), так экран НИКОГДА не «сломается».
// Реальные координаты 6 партнёров по центру Москвы (у самих партнёров geo пока нет).
var BOS_PARTNER_PINS = { medit: [19, 47], bachata: [45, 41], box: [73, 43], yoga: [80, 67], coffee: [31, 71], art: [56, 78] };
var BOS_PARTNER_GEO = {
  medit: [55.7658, 37.6384], bachata: [55.7797, 37.6335], box: [55.7770, 37.5890],
  yoga: [55.7304, 37.6017], coffee: [55.7636, 37.5920], art: [55.7415, 37.6100],
};
// Ленивая загрузка Яндекс JS API 2.1 — один общий промис на всё приложение.
function bosLoadYandexMaps() {
  if (typeof window === "undefined") return Promise.reject();
  if (window.__bosYmapsPromise) return window.__bosYmapsPromise;
  var key = window.BOS_YANDEX_KEY;
  if (!key) return (window.__bosYmapsPromise = Promise.reject(new Error("no key")));
  window.__bosYmapsPromise = new Promise(function (resolve, reject) {
    if (window.ymaps && window.ymaps.Map) { resolve(window.ymaps); return; }
    var s = document.getElementById("bos-ymaps");
    if (!s) {
      s = document.createElement("script");
      s.id = "bos-ymaps";
      s.src = "https://api-maps.yandex.ru/2.1/?apikey=" + encodeURIComponent(key) + "&lang=ru_RU";
      s.async = true;
      document.head.appendChild(s);
    }
    s.addEventListener("load", function () { window.ymaps ? window.ymaps.ready(function () { resolve(window.ymaps); }) : reject(new Error("ymaps missing")); });
    s.addEventListener("error", function () { reject(new Error("ymaps load error")); });
  });
  return window.__bosYmapsPromise;
}
function PartnersMapLive({ app, navigate, compact = false, from = "community" }) {
  const isDark = app && app.themeOverride === "dark";
  const H = compact ? 156 : 280; // David: карту крупнее
  const open = (p) => { if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} } navigate("partner-detail", { partner: p, from: from }); };
  const [ready, setReady] = React.useState(false); // Яндекс встал и отрисовался
  const [failed, setFailed] = React.useState(false); // Яндекс не смог (нет ключа/офлайн/домен) → резерв
  const mapRef = React.useRef(null);
  const mapObj = React.useRef(null);
  React.useEffect(function () {
    let alive = true;
    bosLoadYandexMaps().then(function (ymaps) {
      if (!alive || !mapRef.current || mapObj.current) return;
      try {
        var map = new ymaps.Map(mapRef.current, { center: [55.752, 37.615], zoom: compact ? 11 : 12, controls: compact ? [] : ["zoomControl"] },
          { suppressMapOpenBlock: true, yandexMapDisablePoiInteractivity: true });
        map.behaviors.disable("scrollZoom");
        if (compact) map.behaviors.disable(["drag", "multiTouch"]);
        var Pin = ymaps.templateLayoutFactory.createClass(
          '<div style="position:relative;transform:translate(-50%,-100%);width:' + (compact ? 34 : 38) + 'px;height:' + (compact ? 34 : 38) + 'px;border-radius:12px;background:#fff;box-shadow:0 3px 9px rgba(20,30,20,0.30);display:grid;place-items:center;font-size:' + (compact ? 17 : 19) + 'px;">$[properties.emoji]<span style="position:absolute;bottom:-4px;left:50%;transform:translateX(-50%) rotate(45deg);width:9px;height:9px;background:#fff;border-radius:2px;"></span></div>'
        );
        BOS_PARTNERS.forEach(function (p) {
          var g = BOS_PARTNER_GEO[p.id]; if (!g) return;
          var pm = new ymaps.Placemark(g, { emoji: p.emblem, hintContent: p.name }, { iconLayout: Pin, iconShape: { type: "Rectangle", coordinates: [[-18, -38], [18, 2]] } });
          pm.events.add("click", function () { open(p); });
          map.geoObjects.add(pm);
        });
        try { map.setBounds(map.geoObjects.getBounds(), { checkZoomRange: true, zoomMargin: compact ? 24 : 40 }); } catch (e) {}
        mapObj.current = map;
        if (alive) setReady(true);
      } catch (e) { if (alive) setFailed(true); /* карта не построилась → стилизованный резерв */ }
    }).catch(function () { if (alive) setFailed(true); /* нет ключа/офлайн → стилизованный резерв */ });
    return function () { alive = false; try { if (mapObj.current) { mapObj.current.destroy(); mapObj.current = null; } } catch (e) {} };
  }, [compact]);

  const land = isDark ? "radial-gradient(120% 90% at 20% 10%, #1b2430, #141b24 60%, #10151c)" : "radial-gradient(120% 90% at 20% 10%, #f3f6ef, #e9efe6 60%, #e3ebe0)";
  const park = isDark ? "#1e2c22" : "#d7ead0";
  const river = isDark ? "#17293b" : "#bcd8f2";
  const roadA = isDark ? "rgba(255,255,255,0.09)" : "#ffffff";
  const roadB = isDark ? "rgba(255,255,255,0.05)" : "#e7e2d6";
  const bub = isDark ? "#232a33" : "#ffffff";
  const chipBg = isDark ? "rgba(20,27,24,0.6)" : "rgba(255,255,255,0.72)";
  const chipInk = isDark ? "#dfe7dd" : "#2b3a2b";
  const sz = compact ? 32 : 38;
  return (
    <div style={{ borderRadius: 22, overflow: "hidden", boxShadow: "var(--card-shadow)", position: "relative", height: H, background: land }}>
      {/* СТИЛИЗОВАННЫЙ РЕЗЕРВ — теперь ТОЛЬКО когда Яндекс не смог (нет ключа/офлайн/домен). Пока
          грузится — бутафорию НЕ показываем (David: «не нравится затычка»), только крутилку ниже. */}
      {failed && (<>
      <svg viewBox="0 0 366 232" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <path d="M-10 168 Q55 138 120 168 T250 168 Q300 186 262 242 L-10 242 Z" fill={park} />
        <path d="M-10 66 C90 44 120 134 230 112 S360 168 400 134 L400 162 C360 196 320 132 230 145 S90 78 -10 100 Z" fill={river} opacity="0.9" />
        <g stroke={roadA} strokeWidth="6" fill="none" opacity="0.9" strokeLinecap="round">
          <path d="M34 -10 C50 66 26 140 60 250" />
          <path d="M-10 48 C110 66 220 40 400 78" />
          <path d="M-10 182 C120 170 260 198 400 182" />
        </g>
        <g stroke={roadB} strokeWidth="2" fill="none" opacity="0.8"><ellipse cx="183" cy="120" rx="140" ry="86" /></g>
      </svg>
      {BOS_PARTNERS.map((p) => {
        const pos = BOS_PARTNER_PINS[p.id]; if (!pos) return null;
        return (
          <div key={p.id} className="tap" onClick={() => open(p)} aria-label={p.name}
            style={{ position: "absolute", left: pos[0] + "%", top: pos[1] + "%", transform: "translate(-50%,-100%)", cursor: "pointer", zIndex: 2 }}>
            <div style={{ position: "absolute", inset: -2, borderRadius: 14, background: (typeof bosMixHex === "function" && isDark) ? bosMixHex(p.accent, "#101014", 0.42) : p.accent, zIndex: -1 }} />
            <div style={{ width: sz, height: sz, borderRadius: 12, background: bub, display: "grid", placeItems: "center", fontSize: Math.round(sz * 0.52), boxShadow: "0 3px 8px rgba(20,30,20,0.22)" }}>{p.emblem}</div>
          </div>
        );
      })}
      <div style={{ position: "absolute", left: "50%", top: "54%", transform: "translate(-50%,-50%)", zIndex: 2 }}>
        <div style={{ position: "absolute", inset: -11, borderRadius: "50%", background: "rgba(46,124,246,0.18)" }} />
        <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#2E7CF6", border: "2.5px solid #fff", boxShadow: "0 1px 4px rgba(0,0,0,0.25)" }} />
      </div>
      </>)}
      {/* Пока Яндекс грузится (ещё не готов и не упал) — спокойная крутилка на нейтральном фоне. */}
      {!ready && !failed && (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", zIndex: 3, pointerEvents: "none" }}>
          <span className="bos-spin" style={{ width: 26, height: 26, borderRadius: "50%", border: "2.5px solid " + (isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.12)"), borderTopColor: isDark ? "#dfe7dd" : "#2b3a2b" }} />
        </div>
      )}
      {/* РЕАЛЬНАЯ Яндекс.Карта — поверх резерва, проявляется когда встала (иначе виден резерв). */}
      <div ref={mapRef} aria-hidden={!ready} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 2, opacity: ready ? 1 : 0, pointerEvents: ready ? "auto" : "none", transition: "opacity 0.35s ease" }} />
      {/* Чип «Москва» убран из левого-верхнего угла (David); оставляем только счётчик мест справа. */}
      <div style={{ position: "absolute", top: 12, left: 12, right: 12, display: "flex", alignItems: "center", justifyContent: "flex-end", zIndex: 4, pointerEvents: "none" }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: chipInk, background: chipBg, backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", padding: "5px 10px", borderRadius: 999 }}>{BOS_PARTNERS.length} мест поблизости</span>
      </div>
    </div>
  );
}

// Горизонтальная лента партнёров про ТРАТУ XP. Цветные карточки-впечатления (см. ниже). Тап по карточке →
// нативная страница партнёра PartnerDetailLive (описание, адрес, даты, кнопка «Получить»).
function PartnersShowcaseLive({ app, navigate, from = "community", onAll }) {
  const isDarkP = app?.themeOverride === "dark"; // тёмная: глубокие тона карточек (David)
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
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-4)" }}>🎁 Партнёры · потратить XP</span>
        {onAll ? (
          /* Обзор «Все» (v526): правый край = «Все ›» на полный раздел-чип. */
          <button onClick={onAll} className="tap" data-haptic="selection" style={{ border: 0, background: "transparent", padding: 0, fontSize: 12.5, fontWeight: 600, color: "var(--text-3)", display: "inline-flex", alignItems: "center", gap: 1, cursor: "pointer" }}>Все <I.ChevronRight size={13} color="var(--text-4)" /></button>
        ) : (
          <button onClick={() => { if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} } navigate("partners-all", { from: from }); }} className="tap" style={{ border: 0, background: "transparent", padding: 0, fontSize: 11.5, fontWeight: 600, color: "var(--text-3)", display: "inline-flex", alignItems: "center", gap: 3, cursor: "pointer" }}>живое от партнёров <I.ChevronRight size={12} strokeWidth={2.4} /></button>
        )}
      </div>
      {/* padding-bottom 18 — иначе overflow-y (авто из-за overflow-x) СРЕЗАЕТ тень карточек в серую
          полосу «внизу обрезается» (David). Тень мягкая, чтобы не мутить фон.
          Выравнивание (David: «слева вровень с заголовком, справа уходят за экран»): СЛЕВА обычный
          отступ страницы + 4 (первая карточка ровно под кикером), СПРАВА margin -12 → лента режется
          физическим краем экрана. Не bleed с ОБЕИХ сторон (прошлый v540 липнул к левому краю). */}
      <div className="bos-hscroll" style={{ display: "flex", gap: 11, overflowX: "auto", padding: "3px 12px 18px 4px", margin: "0 -12px 0 0", scrollSnapType: "x proximity", WebkitOverflowScrolling: "touch" }}>
        {BOS_PARTNERS.map((p) => {
          const got = !!redeemed[p.id];
          return (
            <div key={p.id} className="tap" onClick={() => openPartner(p)} style={{ flex: "0 0 auto", width: 170, scrollSnapAlign: "start", borderRadius: 22, padding: 15,
              background: isDarkP
                ? "linear-gradient(158deg, rgba(255,255,255,0.10), rgba(255,255,255,0) 58%), " + ((typeof bosMixHex === "function") ? bosMixHex(p.accent, "#101014", 0.52) : p.accent)
                : "linear-gradient(158deg, rgba(255,255,255,0.5), rgba(255,255,255,0) 58%), " + p.accent,
              boxShadow: isDarkP ? "0 4px 12px rgba(0,0,0,0.4), inset 0 0 0 0.5px rgba(255,255,255,0.09)" : "0 4px 11px rgba(50,40,20,0.10), inset 0 0 0 0.5px rgba(255,255,255,0.55)",
              cursor: "pointer", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {/* Человечек-счётчик — В ВЕРХНЕМ углу, не в нижнем ряду (David: там он ужимал
                  пилюлю цены и сам не читался). Тихий, но на свободном воздухе — считывается. */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <span style={{ fontSize: 36, lineHeight: 1 }}>{p.emblem}</span>
                {p.used > 0 && <span title={p.used + " человек посетили"} style={{ display: "inline-flex", alignItems: "center", gap: 3.5, fontSize: 11, fontWeight: 600, color: isDarkP ? "rgba(255,255,255,0.5)" : "rgba(27,27,31,0.48)", paddingTop: 3, whiteSpace: "nowrap" }}><I.Users size={11.5} strokeWidth={2.2} /> посетили {p.used}</span>}
              </div>
              <div style={{ fontSize: 15.5, fontWeight: 700, color: isDarkP ? "#fff" : "#1b1b1f", marginTop: 12, letterSpacing: "-0.2px", lineHeight: 1.2 }}>{p.name}</div>
              <div style={{ fontSize: 11.5, color: isDarkP ? "rgba(255,255,255,0.66)" : "rgba(27,27,31,0.62)", marginTop: 3, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: 31 }}>{p.what}</div>
              <div style={{ flex: 1, minHeight: 12 }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: isDarkP ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.82)", color: isDarkP ? "#fff" : "#0a0a0a", fontWeight: 800, fontSize: 11.5, borderRadius: 999, padding: "4px 10px" }}>🪙 {p.cost}</span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: got ? (isDarkP ? "#7dd89b" : "#1E8E4E") : (isDarkP ? "#fff" : "#0a0a0a"), display: "inline-flex", alignItems: "center", gap: 2 }}>{got ? <I.Check size={14} strokeWidth={3}/> : <>Открыть <I.ChevronRight size={13}/></>}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// СЕТКА ВСЕХ ПАРТНЁРОВ (2-в-ряд) — ОБЩАЯ для страницы «партнёры-все» и чипа «Партнёры»
// в Сообществе (David: «каждой категории место»). Тап → та же деталь партнёра.
function PartnersGridLive({ app, navigate, from = "community" }) {
  const isDark = app && app.themeOverride === "dark";
  const [redeemed, setRedeemed] = React.useState(bosLoadRedeemedPartners);
  React.useEffect(function () {
    var h = function () { setRedeemed(bosLoadRedeemedPartners()); };
    window.addEventListener("bos:partnersChanged", h);
    return function () { window.removeEventListener("bos:partnersChanged", h); };
  }, []);
  const open = (p) => { if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} } navigate("partner-detail", { partner: p, from: from }); };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
      {BOS_PARTNERS.map((p) => {
        const got = !!redeemed[p.id];
        return (
          <div key={p.id} className="tap" onClick={() => open(p)} style={{ borderRadius: 22, padding: 15, minHeight: 172,
            background: isDark
              ? "linear-gradient(158deg, rgba(255,255,255,0.10), rgba(255,255,255,0) 58%), " + ((typeof bosMixHex === "function") ? bosMixHex(p.accent, "#101014", 0.52) : p.accent)
              : "linear-gradient(158deg, rgba(255,255,255,0.5), rgba(255,255,255,0) 58%), " + p.accent,
            boxShadow: isDark ? "0 4px 12px rgba(0,0,0,0.4), inset 0 0 0 0.5px rgba(255,255,255,0.09)" : "0 4px 11px rgba(50,40,20,0.10), inset 0 0 0 0.5px rgba(255,255,255,0.55)",
            cursor: "pointer", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <span style={{ fontSize: 34, lineHeight: 1 }}>{p.emblem}</span>
              {p.used > 0 && <span style={{ display: "inline-flex", alignItems: "center", gap: 3.5, fontSize: 10.5, fontWeight: 600, color: isDark ? "rgba(255,255,255,0.5)" : "rgba(27,27,31,0.48)", paddingTop: 3, whiteSpace: "nowrap" }}><I.Users size={11} strokeWidth={2.2} /> {p.used}</span>}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: isDark ? "#fff" : "#1b1b1f", marginTop: 11, letterSpacing: "-0.2px", lineHeight: 1.2 }}>{p.name}</div>
            <div style={{ fontSize: 11.5, color: isDark ? "rgba(255,255,255,0.66)" : "rgba(27,27,31,0.62)", marginTop: 3, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: 31 }}>{p.what}</div>
            <div style={{ flex: 1, minHeight: 10 }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: isDark ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.82)", color: isDark ? "#fff" : "#0a0a0a", fontWeight: 800, fontSize: 11.5, borderRadius: 999, padding: "4px 10px" }}>🪙 {p.cost}</span>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: got ? (isDark ? "#7dd89b" : "#1E8E4E") : (isDark ? "#fff" : "#0a0a0a"), display: "inline-flex", alignItems: "center", gap: 2 }}>{got ? <I.Check size={14} strokeWidth={3}/> : <>Открыть <I.ChevronRight size={13}/></>}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// СТРАНИЦА «ВСЕ ПАРТНЁРЫ» — вертикальная сетка ВСЕХ живых впечатлений. David: «живое от партнёров»
// намекало на страницу со всеми партнёрами, а её не было (мёртвая ссылка). Тот же вид карточек, что
// в ленте PartnersShowcaseLive, но 2-в-ряд и целиком; тап → та же деталь. Открывается по «живое от партнёров →».
function PartnersAllLive() {
  const { navigate, params } = useNav();
  const app = (typeof useApp === "function") ? useApp() : null;
  const back = (params && params.from) || "community";
  const isDark = app && app.themeOverride === "dark";
  const balance = (typeof bosLiveSpendableXPLive === "function") ? bosLiveSpendableXPLive(app) : 0;
  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader dark={isDark} title="Партнёры" onBack={() => navigate(back)}
        right={<span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700, color: "var(--text)" }}>🪙 {balance}</span>} />
      <div style={{ fontSize: 13, color: "var(--text-4)", padding: "0 2px 14px", lineHeight: 1.45 }}>Живые впечатления от партнёров — трать заработанный XP на то, что происходит вживую.</div>
      <PartnersGridLive app={app} navigate={navigate} from="partners-all" />
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
    if (app && typeof app.spendXP === "function" && app.spendXP(p.cost, "partner:" + p.id, { kind: "spend_partner", name: p.name, cost: p.cost })) {
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
      <div style={{ position: "relative", background: (isDark
          ? "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0) 44%), " + ((typeof bosMixHex === "function") ? bosMixHex(p.accent, "#101014", 0.48) : p.accent)
          : "linear-gradient(180deg, rgba(255,255,255,0.26), rgba(255,255,255,0) 44%), " + p.accent), marginTop: "calc(-1 * max(60px, var(--tg-top-inset, env(safe-area-inset-top, 0px))))", padding: "calc(max(60px, var(--tg-top-inset, env(safe-area-inset-top, 0px))) + 14px) 22px 30px", borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}>
        <button onClick={() => navigate(back)} className="tap" aria-label="Назад" style={{ width: 38, height: 38, borderRadius: "50%", border: 0, background: isDark ? "rgba(0,0,0,0.32)" : "rgba(255,255,255,0.55)", display: "grid", placeItems: "center", cursor: "pointer", color: isDark ? "#fff" : "#1b1b1f" }}>
          <I.ChevronLeft size={20} strokeWidth={2.4} />
        </button>
        <div style={{ fontSize: 60, lineHeight: 1, marginTop: 18 }}>{p.emblem}</div>
        <div style={{ fontSize: 27, fontWeight: 800, color: isDark ? "#fff" : "#161619", letterSpacing: "-0.6px", marginTop: 14, lineHeight: 1.05 }}>{p.name}</div>
        <div style={{ fontSize: 14.5, color: isDark ? "rgba(255,255,255,0.7)" : "rgba(22,22,25,0.62)", marginTop: 5, lineHeight: 1.4 }}>{p.what}</div>
        {/* Чипы = «характеристики» (David: хочу больше и по делу): что развивает (Ум/Покой), ограничение
            мест (👥 exclusivity/urgency), НАГРАДА в приложении (🏅 ачивка) и социальное доказательство
            (серый человечек — сколько людей уже потратили тут свою XP). */}
        <div style={{ display: "flex", gap: 6, marginTop: 13, flexWrap: "wrap" }}>
          {p.tags.map((t, i) => <span key={i} style={{ background: isDark ? "rgba(255,255,255,0.13)" : "rgba(255,255,255,0.6)", borderRadius: 999, padding: "4px 11px", fontSize: 11.5, color: isDark ? "rgba(255,255,255,0.9)" : "#2a2a30", fontWeight: 600 }}>{t}</span>)}
          {/* «посетили N» — понятное слово вместо «уже N» (David: «уже 150 — вообще непонятно»). */}
          {p.used > 0 && <span style={{ background: isDark ? "rgba(255,255,255,0.13)" : "rgba(255,255,255,0.6)", borderRadius: 999, padding: "4px 11px", fontSize: 11.5, color: isDark ? "rgba(255,255,255,0.72)" : "rgba(42,42,48,0.72)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}><I.Users size={12} strokeWidth={2.2} /> посетили {p.used}</span>}
          {p.limit && <span style={{ background: isDark ? "rgba(255,255,255,0.13)" : "rgba(255,255,255,0.6)", borderRadius: 999, padding: "4px 11px", fontSize: 11.5, color: isDark ? "rgba(255,255,255,0.9)" : "#2a2a30", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>👥 {p.limit}</span>}
          {p.perk && <span style={{ background: isDark ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.92)", borderRadius: 999, padding: "4px 11px", fontSize: 11.5, color: isDark ? "#fff" : "#0a0a0a", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4, boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}>🏅 {p.perk}</span>}
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
/* v526: витрина больше НЕ в ленте — пресеты едят плитки мозаики. */
function CircleStartersShowcaseLive({ navigate }) {
  const { open: _openSheet } = (typeof useSheet === "function") ? useSheet() : { open: () => {} };
  const isDark = !!(typeof document !== "undefined" && document.querySelector(".bos-page.theme-dark"));
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
            <span style={{ width: 44, height: 44, borderRadius: 14, background: "linear-gradient(150deg, var(--disc-a, #eef1f6), var(--disc-b, #dadfe7))", boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.06)", display: "grid", placeItems: "center", fontSize: 23, flexShrink: 0 }}>{bosIcon(s.i, 23, null)}</span>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.2px", marginTop: 11, lineHeight: 1.25 }}>{s.t}</div>
            <div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 3, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: 31 }}>{s.hook}</div>
            <div style={{ flex: 1, minHeight: 10 }} />
            <span style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 4, ...bosChipGlass(isDark), padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 600, color: "var(--text-2)" }}>🎯 {s.target} {s.unit}</span>
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
              <button key={f.id} className="tap" onClick={function () { navigate("team-detail", { team: f.team, from: "community" }); }}
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
    since: "2025-10-26", together: { emoji: "🏃", text: "8 400 пробежек вместе" },
    habits: [{ emoji: "🏃", name: "Пробежка" }, { emoji: "🌅", name: "Ранний подъём" }, { emoji: "🧦", name: "Разминка" }],
    preset: { i: "🏃", t: "Утренние пробежки", accent: "#EAEAEF", goalType: "streak", goalTitle: "Бегать по утрам", target: 30, unit: "дней" } },
  { id: "lc-calm", i: "🧘", t: "Тишина по утрам", hook: "5 минут медитации — никто не сходит с дистанции",
    about: "Спокойный круг: пять минут тишины до телефона и новостей. Здесь не соревнуются — просто держат ритм вместе и делятся, что помогает не съезжать.",
    faces: ["m8", "m4", "m12", "m6", "m17", "m10"], total: 24, today: 13,
    since: "2026-01-17", together: { emoji: "🧘", text: "3 100 практик вместе" },
    habits: [{ emoji: "🧘", name: "Медитация" }, { emoji: "📓", name: "Дневник" }],
    preset: { i: "🧘", t: "Тишина по утрам", accent: "#EAEAEF", goalType: "streak", goalTitle: "Медитировать каждый день", target: 21, unit: "дней" } },
  { id: "lc-book", i: "📚", t: "Книжный клуб", hook: "Глава в день и живое обсуждение в чате круга",
    about: "Читают по главе в день — за месяц выходит целая книга. Раз в неделю голосуют за следующую и обсуждают прочитанное. Отставать не страшно: догоняют вместе.",
    faces: ["m5", "m9", "m1", "m14"], total: 11, today: 4,
    since: "2026-03-30", together: { emoji: "📚", text: "7 книг прочитано вместе" },
    habits: [{ emoji: "📖", name: "Глава в день" }, { emoji: "✍️", name: "Заметка о прочитанном" }],
    preset: { i: "📚", t: "Книжный клуб", accent: "#EAEAEF", goalType: "collective", goalTitle: "Прочитать вместе", target: 12, unit: "книг" } },
  { id: "lc-water", i: "💧", t: "Восемь стаканов", hook: "Пьют воду и держат друг друга в тонусе",
    about: "Самый простой круг: восемь стаканов воды в день. Идеален как первый общий ритуал — лёгкий, но каждый день видно, кто в строю.",
    faces: ["m13", "m16", "m2", "m7"], total: 9, today: 6,
    since: "2026-05-24", together: { emoji: "💧", text: "12 000 стаканов вместе" },
    habits: [{ emoji: "💧", name: "Стакан воды" }],
    preset: { i: "💧", t: "Восемь стаканов", accent: "#EAEAEF", goalType: "collective", goalTitle: "Пить воду", target: 30, unit: "дней" } },
];

// «Постучаться» — заявки живут локально (bos:knockedCircles), чтобы кнопка честно помнила
// «Заявка отправлена» между входами. Публичные круги курируются — реальный approve появится
// вместе с настоящими публичными кругами; пока это витрина-пример.
function bosLoadKnockedCircles() { try { return JSON.parse(localStorage.getItem("bos:knockedCircles") || "{}") || {}; } catch (e) { return {}; } }
function bosMarkKnockedCircle(id) { var n = Object.assign({}, bosLoadKnockedCircles(), { [id]: true }); try { localStorage.setItem("bos:knockedCircles", JSON.stringify(n)); } catch (e) {} try { window.dispatchEvent(new Event("bos:circlesKnocked")); } catch (e) {} return n; }

/* ── ЕДИНЫЙ ЯЗЫК КАРТОЧЕК «Найти» (v526, по одобренному макету) ────────────────
   Одна плитка круга для ВСЕХ видов (живой / челлендж / пресет): стекло-плитка эмодзи →
   название → живая мета. Вместо трёх разных горизонтальных лент — вертикальная мозаика
   2 колонки, как на макете. Партнёры сознательно ДРУГИЕ (цветная «карточка-впечатление»). */
function CircleTileLive({ emoji, title, meta, joined, onTap }) {
  const isDark = !!(typeof document !== "undefined" && document.querySelector(".bos-page.theme-dark"));
  return (
    <button onClick={onTap} className="tap" style={{ background: "var(--card)", border: 0, borderRadius: 18, padding: 13, textAlign: "left", color: "var(--text)", boxShadow: "var(--card-shadow)", display: "flex", flexDirection: "column", gap: 9, minWidth: 0, cursor: "pointer" }}>
      <span style={{ width: 40, height: 40, borderRadius: 13, background: BOS_TILE_SHEEN + ", linear-gradient(150deg, var(--disc-a, #eef1f6), var(--disc-b, #dadfe8))", boxShadow: (typeof bosTileGlass === "function") ? bosTileGlass(isDark) : "none", display: "grid", placeItems: "center", fontSize: 20 }}>{typeof bosIcon === "function" ? bosIcon(emoji, 20, null) : emoji}</span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 14, fontWeight: 600, letterSpacing: "-0.2px", lineHeight: 1.25 }}>{title}</span>
        <span style={{ display: "block", fontSize: 11.5, color: joined ? "#34C759" : "var(--text-4)", marginTop: 3, lineHeight: 1.35 }}>{joined ? "Ты в деле ✓" : meta}</span>
      </span>
    </button>
  );
}
/* Мозаика плиток кругов: 2 колонки, опциональный кикер с «Все ›». */
function CirclesMosaicLive({ kicker, onAll, children }) {
  return (
    <div>
      {kicker && (
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "4px 4px 9px" }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-4)" }}>{kicker}</span>
          {onAll && (
            <button onClick={onAll} className="tap" data-haptic="selection" style={{ border: 0, background: "transparent", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 1, fontSize: 12.5, fontWeight: 600, color: "var(--text-3)", padding: 0 }}>
              Все <I.ChevronRight size={13} color="var(--text-4)" />
            </button>
          )}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>{children}</div>
    </div>
  );
}
/* Баннер «Люди» для обзора «Все» — ЗАМЕТНЫЙ (David: «суть нравится, но тоненький и в
   незаметном месте»): глубокая тёмная карточка-космос с заголовком, размытыми строками-
   ОБЕЩАНИЯМИ (описывают будущее «знакомство по делам», НЕ выдуманных людей) и пилюлей-
   замком. Тап → чип «Люди». */
function NetworkPeekLive({ unlocked, onOpen }) {
  const rows = [["🤝", "Похожая структура привычек"], ["🔥", "Такой же ритм — спорт по утрам"], ["🧩", "Знакомство по делам, не по ленте"]];
  return (
    <button onClick={onOpen} className="tap" style={{ position: "relative", width: "100%", border: 0, borderRadius: 22, padding: "17px 16px 15px", textAlign: "left", overflow: "hidden", cursor: "pointer",
      background: "radial-gradient(130% 120% at 82% -10%, rgba(120,140,255,0.28), transparent 52%), radial-gradient(90% 90% at 12% 110%, rgba(55,244,250,0.12), transparent 55%), #0a0a0a",
      boxShadow: "0 10px 26px rgba(10,10,20,0.28), inset 0 0 0 0.5px rgba(255,255,255,0.10)" }}>
      {/* тихие звёзды */}
      {[[14, 22, 2], [62, 12, 1.5], [84, 30, 2], [38, 16, 1.2], [74, 66, 1.6]].map(([x, y, r], i) => (
        <span key={i} aria-hidden style={{ position: "absolute", left: x + "%", top: y + "%", width: r * 2, height: r * 2, borderRadius: "50%", background: "rgba(255,255,255,0.5)", pointerEvents: "none" }} />
      ))}
      <div style={{ position: "relative" }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", color: "rgba(255,255,255,0.55)" }}>🧭 Нетворк · контакты</div>
        <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.4px", color: "#fff", marginTop: 4, lineHeight: 1.2 }}>Люди, с которыми по пути</div>
        <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.62)", marginTop: 4, lineHeight: 1.4, maxWidth: 250 }}>Знакомства по ритму и делам. Открывается уровнем, а часть кругов — тренингами.</div>
        {!unlocked && (
        <div aria-hidden style={{ filter: "blur(3px)", opacity: 0.55, pointerEvents: "none", marginTop: 12, display: "flex", flexDirection: "column", gap: 7 }}>
          {rows.map(([e, t], i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(255,255,255,0.14)", display: "grid", placeItems: "center", fontSize: 13, flexShrink: 0 }}>{e}</span>
              <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.75)" }}>{t}</span>
            </div>
          ))}
        </div>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 13 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, padding: "8px 14px", borderRadius: 999, color: "#fff", background: "rgba(255,255,255,0.12)", boxShadow: "inset 0 0 0 0.5px rgba(255,255,255,0.22)" }}>
            {unlocked ? "✓ Открыт" : "🔒 Откроется с 10 уровня"}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: 12.5, fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>Заглянуть <I.ChevronRight size={14} color="rgba(255,255,255,0.6)" /></span>
        </div>
      </div>
    </button>
  );
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
  var a = n % 10, b = n % 100;
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
function LivingCircleCardLive({ circle: s, onTap, w = null, variant = "chips" }) {
  const isDark = !!(typeof document !== "undefined" && document.querySelector(".bos-page.theme-dark"));
  const people = (s.faces || []).map(function (a) { return { avatar: a, name: "" }; });
  const days = bosCircleDays(s.since);
  const glass = (typeof bosChipGlass === "function") ? bosChipGlass(isDark) : { background: "var(--card-2)" };
  const chipBase = { display: "inline-flex", alignItems: "center", gap: 5, borderRadius: 999, padding: "5px 10px", fontSize: 11.5, fontWeight: 600, whiteSpace: "nowrap" };
  // Живой ЗЕЛЁНЫЙ чип «сегодня N в деле» — пульс круга (вместо сухой строки «18 человек · …»).
  const liveChip = (
    <span style={{ ...chipBase, background: isDark ? "rgba(52,199,89,0.15)" : "#E7F7EC", color: isDark ? "#7dd89b" : "#1E8E4E", boxShadow: isDark ? "none" : "inset 0 0 0 0.5px rgba(30,142,78,0.14)" }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#34C759", boxShadow: "0 0 0 3px rgba(52,199,89,0.16)" }} />сегодня {s.today} в деле
    </span>
  );
  // ЗОЛОТОЙ чип «живёт N дней» — история круга (David: «круг живёт 252 дня»).
  const ageChip = days ? (
    <span style={{ ...chipBase, background: isDark ? "linear-gradient(150deg, rgba(255,214,102,0.16), rgba(239,159,20,0.14))" : "linear-gradient(150deg,#FFF7E6,#FFEFC9)", color: isDark ? "#f0c86a" : "#8a6a00", boxShadow: isDark ? "none" : "inset 0 0 0 0.5px rgba(214,168,40,0.30)" }}>
      📅 живёт {days} {bosRuDays(days)}
    </span>
  ) : null;
  // СТЕКЛЯННЫЙ чип «большое общее» — что круг наработал вместе (David: «большие общие вещи»).
  const togetherChip = s.together ? (
    <span style={{ ...chipBase, ...glass, color: "var(--text-2)" }}>
      <span style={{ fontSize: 12 }}>{typeof bosIcon === "function" ? bosIcon(s.together.emoji, 12, null) : s.together.emoji}</span>{s.together.text}
    </span>
  ) : null;
  const habitChips = (
    <div style={{ display: "flex", gap: 5, marginTop: 8, flexWrap: "wrap" }}>
      {(s.habits || []).slice(0, variant === "orbit" ? 2 : 3).map(function (h, i) {
        return (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4, ...glass, padding: "4px 9px 4px 6px", borderRadius: 999, fontSize: 11, fontWeight: 600, color: "var(--text-2)" }}>
            <span style={{ fontSize: 12 }}>{typeof bosIcon === "function" ? bosIcon(h.emoji, 12, null) : h.emoji}</span>{h.name}
          </span>
        );
      })}
    </div>
  );
  const cardBase = { width: w || "100%", ...(w ? { flex: "0 0 auto", scrollSnapAlign: "start" } : {}), background: "var(--card)", border: 0, borderRadius: 22, padding: 16, boxShadow: "var(--card-shadow)", textAlign: "left", color: "var(--text)", cursor: "pointer", overflow: "hidden" };

  if (variant === "orbit") {
    // Тот же СТАНДАРТНЫЙ размер, но справа — настоящая орбита (привычки + лица кружат вокруг).
    return (
      <button onClick={onTap} className="tap" style={{ ...cardBase, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16.5, fontWeight: 700, letterSpacing: "-0.3px", lineHeight: 1.2 }}>{s.t}</div>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 6, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{s.hook}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 9, flexWrap: "wrap" }}>{liveChip}{ageChip}</div>
        </div>
        <div style={{ width: 108, height: 108, flexShrink: 0, display: "grid", placeItems: "center" }}>
          {typeof GoalOrbitMini === "function"
            ? <GoalOrbitMini centerEmoji={s.i} centerColor={null} habits={s.habits || []} people={people} size={108} dark={isDark} />
            : <span style={{ fontSize: 36 }}>{s.i}</span>}
        </div>
      </button>
    );
  }
  // variant "chips" — лица сверху, вся живая инфа ЧИПАМИ, без орбиты.
  return (
    <button onClick={onTap} className="tap" style={{ ...cardBase, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <span style={{ width: 44, height: 44, borderRadius: 14, background: BOS_TILE_SHEEN + ", linear-gradient(150deg, var(--disc-a, #eef1f6), var(--disc-b, #dadfe8))", boxShadow: (typeof bosTileGlass === "function") ? bosTileGlass(isDark) : "none", display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0 }}>{typeof bosIcon === "function" ? bosIcon(s.i, 22, null) : s.i}</span>
        <div style={{ flex: 1, minWidth: 0, fontSize: 16.5, fontWeight: 700, letterSpacing: "-0.3px", lineHeight: 1.15 }}>{s.t}</div>
        {typeof PeopleStackLive === "function" && <div style={{ flexShrink: 0 }}><PeopleStackLive people={people} size={26} max={3} /></div>}
      </div>
      <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 10, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{s.hook}</div>
      <div style={{ display: "flex", gap: 6, marginTop: 11, flexWrap: "wrap" }}>{liveChip}{ageChip}{togetherChip}</div>
      {habitChips}
    </button>
  );
}

/* ШТОРКА старта челленджа (v527, David: «шторка вступления угрожающая, как удалить — не в
   тему»): ТЁПЛОЕ приглашение вместо confirm-модалки — эмблема в стекле, что получишь
   (круг + ежедневная практика + приз), «Начать» как праздник, «Не сейчас» тихой строкой. */
function ChallengeStartSheetLive({ seed: s, onStart, openCircle }) {
  const sheet = (typeof useSheet === "function") ? useSheet() : null;
  const isDark = !!(typeof document !== "undefined" && document.querySelector(".bos-page.theme-dark"));
  const close = () => { try { if (sheet && sheet.close) sheet.close(); } catch (e) {} };
  const rows = [
    openCircle ? ["🌐", "Открытый круг — другие смогут присоединиться"] : ["🌱", "Круг появится в «Целях» — зови своих"],
    [(s.practice && s.practice.emoji) || "🔥", "Практика «" + ((s.practice && s.practice.name) || "каждый день") + "» — в «Привычках»"],
    ["⚡", "+" + (s.reward || 0) + " XP за финиш — пропуск не сжигает бонус"],
  ];
  return (
    <div style={{ padding: "2px 22px 26px", textAlign: "center", color: "var(--text)" }}>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ width: 76, height: 76, borderRadius: 21, background: BOS_TILE_SHEEN + ", linear-gradient(150deg, var(--disc-a, #eef1f6), var(--disc-b, #dadfe8))", boxShadow: (typeof bosTileGlass === "function") ? bosTileGlass(isDark) : "none", display: "grid", placeItems: "center", fontSize: 37 }}>{typeof bosIcon === "function" ? bosIcon(s.emblem, 37, null) : s.emblem}</div>
      </div>
      <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1.4, fontWeight: 700, marginTop: 14 }}>{openCircle ? "Открытый круг" : "Челлендж"} · {s.goalText}</div>
      <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: "-0.5px", marginTop: 3 }}>{s.name}</div>
      <div style={{ fontSize: 13.5, color: "var(--text-3)", marginTop: 8, lineHeight: 1.5, padding: "0 6px", textWrap: "balance" }}>{s.hook}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 16, textAlign: "left" }}>
        {rows.map(function (r, i) {
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, background: isDark ? "rgba(255,255,255,0.06)" : "#f4f4f6", borderRadius: 15, padding: "11px 13px" }}>
              <span style={{ fontSize: 19, flexShrink: 0 }}>{r[0]}</span>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-2)", lineHeight: 1.35 }}>{r[1]}</span>
            </div>
          );
        })}
      </div>
      <button onClick={function () { close(); onStart(); }} className="bos-btn" style={{ marginTop: 20 }}>Начать</button>
      <button onClick={close} className="tap" style={{ display: "block", margin: "12px auto 0", border: 0, background: "transparent", fontSize: 13.5, fontWeight: 600, color: "var(--text-4)", cursor: "pointer" }}>Не сейчас</button>
    </div>
  );
}


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
    <div className="bos-sheet-scroll" style={{ paddingTop: 2, paddingLeft: 20, paddingRight: 20, textAlign: "center" }}>
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
                <span style={{ width: 46, height: 46, borderRadius: 14, background: "linear-gradient(150deg, var(--disc-a, #eef1f6), var(--disc-b, #dadfe7))", boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.06)", display: "grid", placeItems: "center", fontSize: 24, flexShrink: 0 }}>{bosIcon(s.i, 24, null)}</span>
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
// ПЕРЕЖИВАЕТ ПЕРЕЗАПУСК Telegram (S1 «пустое поле на входе»): последнее поле Вселенной лежит в
// localStorage → вход рисует ПОЛНУЮ соту с первого кадра, сеть обновляет фоном и МОЛЧА (sig-skip
// ниже: state не трогаем, если данные не изменились — никаких пере-раскладок посреди зум-въезда).
var _bosUniStoreMem;
function _bosUniStore() {
  if (_bosUniStoreMem !== undefined) return _bosUniStoreMem;
  try { _bosUniStoreMem = JSON.parse(localStorage.getItem("bos:cache:universe") || "null"); } catch (e) { _bosUniStoreMem = null; }
  return _bosUniStoreMem;
}
function _bosHashU(s) { s = "" + (s || "x"); var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0; } return h; }
function _bosSm(x) { x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); }   // smoothstep 0..1
function _bosLp(a, b, k) { return a + (b - a) * k; }
// Кривая Безье (как CSS cubic-bezier): eased-значение по прогрессу p∈[0..1] (может слегка
// превышать 1 — «перелёт»/пружинка). Ньютон по 5 шагов. Для ЕДИНОГО входа во «Вселенную».
function _bosBezier(p, x1, y1, x2, y2) {
  p = p < 0 ? 0 : p > 1 ? 1 : p; var t = p;
  for (var i = 0; i < 5; i++) { var u = 1 - t, x = 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t, dx = 3 * u * u * x1 + 6 * u * t * (x2 - x1) + 3 * t * t * (1 - x2); if (dx < 1e-5) break; t -= (x - p) / dx; t = t < 0 ? 0 : t > 1 ? 1 : t; }
  var u2 = 1 - t; return 3 * u2 * u2 * t * y1 + 3 * u2 * t * t * y2 + t * t * t;
}
// ВХОД во «Вселенную» = ОДНО непрерывное движение камеры (аддитивно, поверх introK): крупно
// на тебе → медленно, затем с разгоном ОТЪЕЗЖАЕМ; из-за краёв вплывает «масштаб людей вокруг»,
// в конце лёгкая ПРУЖИНКА. Ведём видимое приближение M одной кривой, а z = M/introK → фаза
// introK НЕ даёт отдельного «стыка»/остановки (в calcNode видно только произведение z·introK).
var BOS_UNI_IN_DUR = 2.3;      // сек: длина единого входа (медленный старт → разгон → пружинка)
var BOS_UNI_M0 = 1.34;         // старт: крупно на тебе (= прежний старт introK, стык бесшовный)
var BOS_UNI_M1 = 0.62;         // финал: раскрытие «масштаба людей вокруг» (в пределах _cZ)
// СТАТИЧНЫЙ диск дальней системы (иконка): аватар + одно золотое кольцо уровня + бейдж. БЕЗ часов и
// SVG-орбиты → не крутится, не ре-рендерится на 30fps (главная оптимизация: дальних систем много,
// им не нужна анимация). Вид совпадает со свёрнутым OrbitField → переход бесшовный.
function UniDiscLive({ avatar, level, lvlPct, size, dark }) {
  var av = "" + (avatar || "");
  var isMemoji = /^m\d+$/.test(av), isEmoji = av.indexOf("emoji:") === 0;
  // Блик кружка Вселенной ТЕМА-ЗАВИСИМ (David: «в тёмной кружочки не адаптировались»): в тёмной
  // яркий белый градиент (0.55) выбеливал графитовый диск → приглушаем почти в ноль.
  var SHEEN = dark
    ? "linear-gradient(165deg, rgba(255,255,255,0.14), rgba(255,255,255,0.04) 46%, rgba(255,255,255,0) 72%)"
    : "linear-gradient(165deg, rgba(255,255,255,0.55), rgba(255,255,255,0.12) 46%, rgba(255,255,255,0) 72%)";
  var bg = SHEEN + ", " + (isMemoji ? "url(./assets/people/" + av + ".png) center/cover no-repeat, " : (!isEmoji ? "url(./assets/sphere.png) center/cover no-repeat, " : "")) + "linear-gradient(150deg, var(--disc-a, #eef1f6), var(--disc-b, #dadfe7))";
  // Верхняя белая кромка диска тоже гаснет в тёмной (была 0.9 — резкий блик).
  var discSh = dark
    ? "inset 0 1px 0.5px rgba(255,255,255,0.10), inset 0 0 0 0.6px rgba(255,255,255,0.05), 0 4px 12px rgba(0,0,0,0.30)"
    : "inset 0 1.5px 0.5px rgba(255,255,255,0.9), inset 0 0 0 0.6px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.14)";
  var badge = size * 0.34;
  // Кольцо-прогресс уровня УБРАНО (David: «перегружает») — остаётся только цифра уровня.
  // Inset 0.12 сохранён → размер лица и стык с раскрытой орбитой не изменились.
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <div style={{ position: "absolute", inset: size * 0.12, borderRadius: "50%", background: bg, boxShadow: discSh, display: "grid", placeItems: "center", fontSize: size * 0.42, lineHeight: 1 }}>
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
  // «ЗАМРИ-И-ПРОДОЛЖИ»: тикер отдаёт ГЛОБАЛЬНОЕ время, поэтому раньше при выкл/вкл (порог spinOn
  // пересекается при пане) значение прыгало «сотни радиан ↔ 0» — планеты ТЕЛЕПОРТИРОВАЛИСЬ и орбита
  // читалась как «пересобралась». Теперь держим свой сдвиг: пауза замораживает угол, возобновление
  // продолжает ровно с него. Скорость и вид вращения не тронуты.
  var hold = React.useRef(null);
  if (!hold.current) hold.current = { v: 0, off: null };
  React.useEffect(function () {
    var h = hold.current;
    if (!active) { h.off = null; return; }
    var fn = function (raw) { if (h.off == null) h.off = raw - h.v; h.v = raw - h.off; setV(h.v); };
    _uniSpinSubs.add(fn); _uniSpinStart();
    return function () { _uniSpinSubs.delete(fn); if (!_uniSpinSubs.size) _uniSpinStop(); };
  }, [active]);
  return hold.current.v;
}
// Одна РАСКРЫТАЯ система: подписка на тикер только пока spinOn (глубоко под линзой). open=1 —
// геометрия печётся раз, живое раскрытие едет CSS-переменными (--uK/--uO/--uA) с обёртки.
function UniSpinOrbit({ sp, moodC, isDark, spinOn }) {
  var spin = useUniSpin(spinOn);
  if (!UniOrbitMemo) return null;
  return <UniOrbitMemo avatar={sp.s && sp.s.avatar} name={(sp.s && sp.s.name) || ""} habits={sp.habits} people={sp.people} levelPct={sp.lvlPct} moodC={moodC} dark={isDark} hideLevelArc={true} hideLevelRing={true} editable={false} levelBadge={sp.level} open={1} minimal={true} spinT={spin} />;
}
// РАССТАНОВКА ПО РОДСТВУ (v578): та же honeycomb-геометрия (hexAt в раскладке), но ПОРЯДОК ячеек = по
// семье, а не по активности. Считаем глубину-от-тебя (BFS по рёбрам referredBy, НЕнаправленно: и твои
// приглашённые, и твой пригласивший = глубина 1) и «ломоть неба» (угловой сектор, ширина ∝ размеру
// поддерева → кто привёл больше, у того шире сектор и заметнее ветка). Возвращаем карту id→{d:глубина,
// a:угол 0..1}; раскладка кладёт узел в кольцо=глубина, ячейку — по углу (дети в кольце прямо ЗА
// родителем под тем же углом → нити «Связей» короткие, лучами от центра, без клубка; масштаб держится,
// перегруз кольца аккуратно вытекает наружу). Незнакомцы (не связаны с тобой) — свои мини-деревья в
// дальнем «гало»-поясе (тускло на периферии). Ничего в отрисовке/линзе/LOD не меняем — только КТО где.
function _bosFamilyTree(systems, meId, myRef) {
  var byId = {};
  systems.forEach(function (sp) { if (sp && sp.s && sp.s.id) byId[sp.s.id] = sp; });
  var adj = {};
  function link(a, b) { (adj[a] || (adj[a] = [])).push(b); (adj[b] || (adj[b] = [])).push(a); }
  systems.forEach(function (sp) { var id = sp.s && sp.s.id, rb = sp.s && sp.s.referredBy; if (id && rb && byId[rb]) link(id, rb); });
  var depth = {}, parent = {}, q = [];
  systems.forEach(function (sp) { var id = sp.s && sp.s.id; if (id && meId && sp.s.referredBy === meId && depth[id] == null) { depth[id] = 1; parent[id] = "__me"; q.push(id); } });
  if (myRef && byId[myRef] && depth[myRef] == null) { depth[myRef] = 1; parent[myRef] = "__me"; q.push(myRef); }
  var qi = 0;
  while (qi < q.length) { var cid = q[qi++]; (adj[cid] || []).forEach(function (n) { if (depth[n] == null) { depth[n] = depth[cid] + 1; parent[n] = cid; q.push(n); } }); }
  var maxD = 0, kk; for (kk in depth) { if (depth[kk] > maxD) maxD = depth[kk]; }
  var haloBase = maxD + 2;
  systems.forEach(function (sp) {
    var rid = sp.s && sp.s.id; if (!rid || depth[rid] != null) return;
    depth[rid] = haloBase; parent[rid] = "__halo"; var fq = [rid], fi = 0;
    while (fi < fq.length) { var id = fq[fi++]; (adj[id] || []).forEach(function (n) { if (depth[n] == null) { depth[n] = depth[id] + 1; parent[n] = id; fq.push(n); } }); }
  });
  var kids = {}, all = [];
  systems.forEach(function (sp) { var id = sp.s && sp.s.id; if (id) all.push(id); });
  all.forEach(function (id) { var p = parent[id] || "__me"; (kids[p] || (kids[p] = [])).push(id); if (!kids[id]) kids[id] = []; });
  var subtree = {};
  all.slice().sort(function (a, b) { return depth[b] - depth[a]; }).forEach(function (id) { var s = 1; (kids[id] || []).forEach(function (c) { s += (subtree[c] || 1); }); subtree[id] = s; });
  var angle = {};
  function assign(pid, a0, a1) {
    var ch = (kids[pid] || []).slice().sort(function (x, y) { return (subtree[y] - subtree[x]) || (x < y ? -1 : 1); });
    var tot = 0; ch.forEach(function (c) { tot += subtree[c]; }); if (!tot) return;
    var a = a0;
    ch.forEach(function (c) { var w = (a1 - a0) * (subtree[c] / tot); angle[c] = (a + a + w) / 2; assign(c, a, a + w); a += w; });
  }
  assign("__me", 0, 1);
  assign("__halo", 0, 1);
  var out = {};
  all.forEach(function (id) { out[id] = { d: depth[id] == null ? 9999 : depth[id], a: angle[id] || 0 }; });
  return out;
}
function UniverseFieldLive({ app, people, from, onClose }) {
  var isDark = app && app.themeOverride === "dark";
  var [friends, setFriends] = React.useState(function () { return _bosUniverseCache || (_bosUniStore() || {}).list || null; });
  // Слой «Связи/созвездия» (ДОП-СТЕКЛО ПОВЕРХ): кто кого привёл. myUid = мой id (центр «Я»),
  // myRefId = кто привёл МЕНЯ. Оба нужны только слою линий — механику Вселенной не трогают.
  // Стартуем из кэша (uidSync/диск): раскладка считается сразу с правильными значениями → прилёт
  // тех же значений из сети НЕ дёргает пере-раскладку (React бэйлится на равном state).
  var [myUid, setMyUid] = React.useState(function () { return (window.bosCloud && window.bosCloud.uidSync && window.bosCloud.uidSync()) || (_bosUniStore() || {}).me || null; });
  var [myRefId, setMyRefId] = React.useState(function () { return (_bosUniStore() || {}).ref || null; });
  var [showLinks, setShowLinks] = React.useState(false);
  var edgeEls = React.useRef({});   // ключ ребра → { h: halo-line, c: core-line } (rAF пишет x1/y1/x2/y2)
  // «ДЫХАНИЕ»: 0 = тесная сота (браузинг), 1 = распущенная семейная (связи). Цикл плавно ведёт morphRef
  // к цели (showLinksRef) и интерполирует позиции узлов fxH/fyH↔fx/fy — сота распускается/собирается.
  var morphRef = React.useRef(0);
  var showLinksRef = React.useRef(false);
  React.useEffect(function () {
    var on = true;
    var seed = Array.isArray(people) ? people : [];
    if (!(window.bosCloud && window.bosCloud.enabled())) { setFriends(seed); return; }
    (async function () {
      var out = [];
      // ОДНИМ ЗАЛПОМ (раньше uid → myInviter → allPublic шли ДРУГ ЗА ДРУГОМ — 3-4 похода в сеть
      // подряд: поле пустовало до секунды-двух, а ответы прилетали ПОСРЕДИ 2.3с зум-въезда и
      // дважды перекладывали соту в полёте). Теперь всё параллельно; myInviter ещё и кэширован.
      var res = await Promise.all([
        (window.bosCloud.uid ? window.bosCloud.uid() : Promise.resolve(null)).catch(function () { return null; }),
        (window.bosCloud.myInviter ? window.bosCloud.myInviter() : Promise.resolve(null)).catch(function () { return null; }),
        (window.bosCloud.allPublic ? window.bosCloud.allPublic(240) : Promise.resolve(null)).catch(function () { return null; }),
      ]);
      var myId = res[0], _iv = res[1], all = res[2];
      if (on && myId) setMyUid(myId);                 // null = обрыв uid → держим прежний «центр Я»
      if (on && _iv && _iv.id) setMyRefId(_iv.id);
      // ВСЕ пользователи вселенной: каждый с опубликованной витриной орбиты, АНОНИМНО (аватар+уровень+
      // значки привычек, без имён/связи — David: «показываем всех всем, супер-анонимно»).
      (all || []).forEach(function (p) { if (p && p.id && p.id !== myId) out.push(p); });
      // Фолбэк (нет allPublic / пусто — напр. старый кэш): показать хотя бы своих (приглашённые + круги),
      // тоже анонимно. Дотягиваем их публичные орбиты по id.
      if (!out.length) {
        var seen = {};
        try { if (window.bosCloud.invitedPeople) { var inv = await window.bosCloud.invitedPeople(); (inv || []).forEach(function (p) { if (!p) return; var id = p.id || p.user_id; if (id && id !== myId && !seen[id]) { seen[id] = 1; out.push({ id: id, avatar: p.avatar, name: "" }); } }); } } catch (e) {}
        try { var teams = (app && app.teams || []).filter(function (t) { return t.cloudId; }); for (var i = 0; i < teams.length; i++) { var mem = await window.bosCloud.teamMembers(teams[i].cloudId); (mem || []).forEach(function (m) { if (m && m.id && m.id !== myId && !seen[m.id]) { seen[m.id] = 1; out.push({ id: m.id, avatar: m.avatar, name: "" }); } }); } } catch (e) {}
        try { if (window.bosCloud.profilesPublic && out.length) { var st = await window.bosCloud.profilesPublic(out.map(function (o) { return o.id; })) || {}; out.forEach(function (o) { var s = st[o.id] || {}; o.level = s.level || 0; o.lvlPct = s.lvlPct || 2; o.habits = Array.isArray(s.habits) ? s.habits : []; o.goals = s.goals || 0; o.people = s.people || 0; }); } } catch (e) {}
      }
      if (on) {
        // ЗАЩИТА ОТ «ПУСТО = ПРАВДА»: облачные функции глотают ошибку сети в [] — неотличимо от
        // «честно пусто». В реальной Вселенной всегда есть другие люди, поэтому пустой ответ ПРИ
        // ЖИВОМ КЭШЕ = почти наверняка обрыв → НЕ схлопываем соту и НЕ затираем кэш пустым (иначе
        // поле «исчезает на глазах» на флаки-сети). Сеть до-обновит при следующем удачном заходе.
        var _prevList = (_bosUniStore() || {}).list;
        if (out.length || !(_prevList && _prevList.length)) {
          _bosUniverseCache = out;
          _bosUniStoreMem = { list: out, ref: (_iv && _iv.id) || null, me: myId || null };
          try { localStorage.setItem("bos:cache:universe", JSON.stringify(_bosUniStoreMem)); } catch (e) {}
          // Молчаливое обновление: state (и пере-раскладку соты) дёргаем ТОЛЬКО если данные реально другие.
          setFriends(function (prev) { return JSON.stringify(prev || null) === JSON.stringify(out) ? prev : out; });
        }
      }
    })();
    return function () { on = false; };
  }, []);
  var list = Array.isArray(friends) ? friends : [];
  // Тёмная Вселенная = почти ЧЁРНЫЙ космос (David), с еле заметной глубиной к центру.
  var bg = isDark ? "radial-gradient(125% 95% at 50% 42%, #14161d 0%, #0a0b10 52%, #030304 100%)" : "radial-gradient(125% 95% at 50% 42%, #fbfcff 0%, #eef1f8 52%, #e4e9f2 100%)";
  var titleC = isDark ? "rgba(220,230,255,0.7)" : "rgba(40,52,74,0.55)";
  var subC = isDark ? "rgba(200,215,255,0.5)" : "rgba(40,52,74,0.42)";
  // Нити «Связей» — СВЕТЛО-СЕРОЕ МАТОВОЕ СТЕКЛО (David: не чёрные/синие; лёгкие, полупрозрачные). Ядро
  // тонкое светлое, гало ШИРЕ и бледнее = «фрост»-край (диффузное свечение без filter). Плюс «ДЫХАНИЕ»:
  // мягкая ПУЛЬСАЦИЯ бежит по нити ОТ ЦЕНТРА наружу БЕСКОНЕЧНО, волной по поколениям (не разовый пшик) —
  // паутина из стекла как будто дышит. Без mixBlendMode (обычное наложение, чтобы блик-пульс не гас).
  var linkCore = isDark ? "rgba(214,220,232,0.44)" : "rgba(146,153,167,0.5)";
  var linkHalo = isDark ? "rgba(214,220,232,0.14)" : "rgba(170,177,191,0.16)";
  var linkShine = "rgba(255,255,255,0.62)";

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
    // habits → объекты, которые читает OrbitField (.emoji/.color/.streak/.id); люди → РЕАЛЬНЫЕ лица.
    var habits = hb.slice(0, 12).map(function (h, i) { return { emoji: (h && h.e) || "✨", color: h && h.c, streak: 0, id: "ph" + i }; });
    // David: во Вселенной на ЧУЖИХ системах лица людей НЕ показываем — они уже и свои звёзды, и в слое
    // «Связи» (рёбра «кто кого привёл»); лицо на орбите = тройной повтор. peopleN всё ещё в weight, так
    // что «вес» системы не теряется — просто без лиц. Своя орбита = youSp/youPeople (отдельный путь,
    // ниже) — там лица ОСТАЮТСЯ: David «свою орбиту не трогай».
    var people = [];
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
    // ПОРЯДОК ячеек — по родству (семья у тебя), а не по активности. Геометрия honeycomb ниже — та же.
    var built = list.slice(0, 240).map(function (f) { return buildSystem(f); });
    var da = _bosFamilyTree(built, myUid, myRefId);                  // id → {d: глубина-от-тебя, a: угол-сектор 0..1}
    // СОТА ИЗ СЕМЕЙНЫХ ТЕРРИТОРИЙ (David-«C», v578): та же honeycomb-СЕТКА (плотно, как ты любишь), но
    // ячейки раздаются ПО СЕМЬЯМ. Радиус ≥ поколение-от-тебя (свои — ближний круг), угол = сектор семьи
    // (шире у того, кто привёл больше). Каждый садится в СВОБОДНУЮ ячейку СВОЕГО угла на кольце ≥ своей
    // глубины; при тесноте наследники уходят ГЛУБЖЕ тем же углом (а не в чужой конец кольца) → семья =
    // связная радиальная колонна, нити коротки лучами и почти не режут чужие (замерено: ≤80 чел ~0-2
    // пересечения против 78 у равномерной соты). Сота «бугрится» там, где семья разрослась. Линза/LOD те же.
    var AX = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
    function hexAt(index) {
      if (index <= 0) return { q: 0, r: 0, k: 0 };
      var k = 1; while (index > 3 * k * (k + 1)) k++;
      var idxInRing = index - (3 * (k - 1) * k + 1);
      var q = AX[4][0] * k, r = AX[4][1] * k;
      var side = Math.floor(idxInRing / k), step = idxInRing % k;
      for (var s = 0; s < side; s++) { q += AX[s][0] * k; r += AX[s][1] * k; }
      q += AX[side][0] * step; r += AX[side][1] * step;
      return { q: q, r: r, k: k };
    }
    var MAXR = 20, RINGS = [];                                       // предгенерим ячейки колец 1..MAXR (угол нормирован 0..1)
    for (var rr = 1; rr <= MAXR; rr++) { var cap = 6 * rr, base = 3 * (rr - 1) * rr + 1, cs = []; for (var pp = 0; pp < cap; pp++) { var h = hexAt(base + pp); var cfx = h.q + h.r * 0.5, cfy = h.r * 0.8660254; var ca = Math.atan2(cfy, cfx) / (2 * Math.PI); if (ca < 0) ca += 1; cs.push({ fx: cfx, fy: cfy, a: ca, r: rr, used: false }); } cs.sort(function (x, y) { return x.a - y.a; }); RINGS[rr] = cs; }
    var order = built.slice().sort(function (A, B) { var pa = da[A.s && A.s.id] || { d: 9999 }, pb = da[B.s && B.s.id] || { d: 9999 }; return pa.d - pb.d; });  // мелкие поколения первыми — занимают ближние кольца
    var nodes = [];
    order.forEach(function (sp) {
      var info = da[sp.s && sp.s.id] || { d: 1, a: 0 };
      var d = Math.min(info.d, MAXR), mid = info.a, best = null, bs = 9;
      for (var ri = d; ri <= Math.min(MAXR, d + 12); ri++) {          // свободная ячейка СВОЕГО угла; тесно → глубже тем же углом
        var cells = RINGS[ri];
        for (var ci = 0; ci < cells.length; ci++) { if (cells[ci].used) continue; var dd = Math.abs(cells[ci].a - mid); if (dd > 0.5) dd = 1 - dd; var score = dd + 0.03 * (ri - d); if (score < bs) { bs = score; best = cells[ci]; } }
      }
      if (best) { best.used = true; nodes.push({ sp: sp, fx: best.fx, fy: best.fy, ring: best.r }); }
    });
    // ТЕСНАЯ СОТА (браузинг, связи ВЫКЛ): те же узлы, но плотный hexAt-спираль без дыр (симметричная
    // сота, что ты любишь). Порядок = (кольцо,угол) распущенной → «дыхание» идёт радиально, без хаоса:
    // fxH/fyH = тесная позиция, fx/fy = распущенная. Цикл интерполирует между ними по morphRef.
    var tightOrder = nodes.map(function (nd) { return { nd: nd, d: nd.ring, a: Math.atan2(nd.fy, nd.fx) }; }).sort(function (x, y) { return x.d - y.d || x.a - y.a; });
    tightOrder.forEach(function (o, idx) { var h = hexAt(idx + 1); o.nd.fxH = h.q + h.r * 0.5; o.nd.fyH = h.r * 0.8660254; });
    return { nodes: nodes };
  }, [friends, myUid, myRefId]);

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
  // Одноразовая режиссура камеры входа (см. BOS_UNI_* выше). reduce-motion → сразу «занята»:
  // камеру не двигаем, остаётся текущий вход. Первое касание/колесо тоже освобождает камеру.
  var introCamRef = React.useRef();
  if (!introCamRef.current) { var _rm = false; try { _rm = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); } catch (e) {} introCamRef.current = { taken: _rm }; }
  var nodeEls = React.useRef({});   // key → DOM-обёртка системы (loop пишет transform/vars сюда)
  var nodeSig = React.useRef({});   // key → последние ЗАПИСАННЫЕ числа {h,sx,sy,sc,ov,zi,uA} (null после рендера)
  var lodRef = React.useRef({});    // key → "disc"|"orbit" (гистерезис переключения)
  var nodesRef = React.useRef([]);
  var nodeRefCbs = React.useRef({}); // key → СТАБИЛЬНЫЙ ref-коллбэк (не пересоздаём каждый рендер)
  var frameDirty = React.useRef(true); // React-рендер переписал inline-стили узлов → кадру нельзя «спать»
  function _cZ(z) { return z < 0.3 ? 0.3 : z > 3 ? 3 : z; } // David: дальше отдалять на телефоне (было 0.55) — до «соты» аватарок, как на компе
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
    var lastF = { x: NaN, y: NaN, z: NaN, mt: NaN, ik: NaN }; // подпись прошлого кадра (полный ранний выход)
    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (t0 == null) t0 = now;
      var ip = (now - t0) / 820; if (ip > 1) ip = 1;
      introRef.current = ip;
      // «дыхание» соты: плавно ведём morphRef к цели (связи вкл=1 распущено / выкл=0 тесно), у цели — защёлк.
      var _mtgt = showLinksRef.current ? 1 : 0, _mc = morphRef.current;
      morphRef.current = Math.abs(_mtgt - _mc) < 0.002 ? _mtgt : _mc + (_mtgt - _mc) * 0.1;
      var introK = _bosLp(1.34, 1, _bosSm(ip));       // зум-аут входа: ты крупно → поле «разгорается»
      // ЕДИНЫЙ ВХОД-ОТЪЕЗД (см. BOS_UNI_* выше): ОДНА кривая ведёт видимое приближение M от «крупно
      // на тебе» до раскрытия толпы — медленный старт → разгон → лёгкая пружинка. z = M/introK, чтобы
      // фаза introK не давала отдельной остановки/«стыка». Пишем, пока камеру не взял пользователь
      // (introCamRef.taken → не мешаем жесту). Линза/LOD/раскрытость/жесты/слой «Связи» не тронуты.
      if (!introCamRef.current.taken) {
        var _T = (now - t0) / 1000, _done = _T >= BOS_UNI_IN_DUR;
        var _e = _done ? 1 : _bosBezier(_T / BOS_UNI_IN_DUR, 0.42, 0, 0.6, 1.18);   // медл. старт → разгон → перелёт-пружинка
        var _mz = _cZ(_bosLp(BOS_UNI_M0, BOS_UNI_M1, _e) / introK);
        var _cc = camRef.current; if (_cc.z !== _mz) camRef.current = { x: _cc.x, y: _cc.y, z: _mz };
        if (_done) introCamRef.current.taken = true;
      }
      var cam = camRef.current, _mt = morphRef.current; // тесная(fxH)↔распущенная(fx) по «дыханию»
      // ПОЛНЫЙ РАННИЙ ВЫХОД КАДРА: камера/морф/вход на месте и React не переписывал стили →
      // кадру нечего делать. Раньше «покой» всё равно стоил ~240×(sqrt+atan) + тысячи toFixed
      // и строк-сигнатур на кадр (скипались только ЗАПИСИ) — теперь в покое ноль работы и ноль
      // мусора для GC (меньше микро-фризов, меньше батареи).
      var idle = !frameDirty.current && cam.x === lastF.x && cam.y === lastF.y && cam.z === lastF.z && _mt === lastF.mt && introK === lastF.ik;
      var flipPending = false; // хоть один узел пересёк порог disc↔orbit → нужна структурная пере-сборка
      if (!idle) {
        lastF.x = cam.x; lastF.y = cam.y; lastF.z = cam.z; lastF.mt = _mt; lastF.ik = introK;
        frameDirty.current = false;
        var nodes = nodesRef.current, els = nodeEls.current, sigs = nodeSig.current;
        for (var i = 0; i < nodes.length; i++) {
          var nd = nodes[i], el = els[nd.key];
          if (!el) continue;
          var _fx = nd.fxH + (nd.fx - nd.fxH) * _mt, _fy = nd.fyH + (nd.fy - nd.fyH) * _mt;
          var v = nodeVisual(_fx, _fy, cam, introK);
          var st = sigs[nd.key];                       // {h,...} | null (после React-рендера — не доверяем)
          // visibility, НЕ display: у скрытых CSS-каскад «пыха» ПРОДОЛЖАЕТ идти по своему расписанию →
          // возврат узла в кадр не перезапускает bosSysPop с его задержкой (узел «пропадал» до ~1.15с
          // и потом пыхал заново — то самое моргание при пане в первые секунды входа).
          if (v.off) { if (!(st && st.h)) { el.style.visibility = "hidden"; sigs[nd.key] = { h: true }; } continue; }
          var disc = lodRef.current[nd.key] === "disc"; // (было el.getAttribute — DOM-чтение на узел на кадр)
          // Узел пересёк порог disc↔orbit (та же гистерезис-логика, что в рендере) → нужна пере-сборка.
          if (disc ? (v.openV > 0.14) : (v.openV <= 0.10)) flipPending = true;
          var sc = disc ? v.dscale : v.oscale;
          var wasHidden = !st || st.h;                 // st сброшен рендером (или узел был скрыт)
          // Кадр уже НЕ в покое (иначе весь цикл пропущен ранним выходом выше). При движении ПИШЕМ
          // каждый видимый узел КАЖДЫЙ кадр — без per-node порога: сама линза меняет размер узла у
          // центра, а квантование «скипнуть-если-почти-не-сдвинулось» давало микро-рывок (скип →
          // накопленный скачок) на медленном пане у близкого зума. Записи в стиль дёшевы; дорог
          // только paint (не меняется). zIndex — лишь при реальной смене (не пересортировываем слои зря).
          if (wasHidden) el.style.visibility = "";     // снять возможный stale visibility:hidden
          el.style.transform = "translate(" + v.f.sx.toFixed(1) + "px," + v.f.sy.toFixed(1) + "px) scale(" + sc.toFixed(4) + ")";
          if (wasHidden || v.zi !== st.zi) el.style.zIndex = v.zi;
          if (!disc) {
            el.style.setProperty("--uK", _bosLp(0.3, 1, v.openV).toFixed(4));
            el.style.setProperty("--uO", v.openV.toFixed(3));
            el.style.setProperty("--uA", v.uA.toFixed(4));
          }
          sigs[nd.key] = { h: false, zi: v.zi };       // трекинг только для visibility/zIndex
        }
      }
      // Структурная пере-сборка (LOD disc↔orbit + spinOn) — СОБЫТИЙНО: только когда узел реально
      // пересёк порог (flipPending), а НЕ каждые 160мс по таймеру. Опрос давал периодический спайк
      // React-пере-сборки ~25мс (заметный stutter на десктопе, где culling не режет большой экран, и
      // все ~120 систем пере-собирались каждые 160мс зря — LOD-то не менялся). Троттл 100мс +
      // страховочный опрос раз в 600мс для спина (setCamQ сам бэйлится, если камера не сдвинулась → в
      // покое нет ре-рендера). Плавную позицию/размер пишет rAF-цикл в DOM — она не зависит от этого.
      if (now - lastQ > 160 && (flipPending || now - lastQ > 600)) {
        lastQ = now;
        setCamQ(function (p) { var c = camRef.current; return (p.x === c.x && p.y === c.y && p.z === c.z) ? p : { x: c.x, y: c.y, z: c.z }; });
      }
    }
    raf = requestAnimationFrame(frame);
    return function () { cancelAnimationFrame(raf); };
  }, []);
  React.useEffect(function () { var t = setTimeout(function () { setIntroDone(true); }, 2000); return function () { clearTimeout(t); }; }, []);
  // Пока Вселенная открыта — глушим общий орб-клок страниц (aliases.jsx): страница «Я» под
  // непрозрачным оверлеем продолжала ре-рендерить свою орбиту 30 раз/сек (пылинки, тени) —
  // невидимо и недёшево, ровно когда Вселенной нужен весь бюджет кадра. Закрыли → часы идут дальше.
  React.useEffect(function () { try { window.__bosOrbPause = true; } catch (e) {} return function () { try { window.__bosOrbPause = false; } catch (e) {} }; }, []);
  var vp = React.useRef({ pts: {}, mode: null, sd: 1, ox: 0, oy: 0, oz: 1, sx: 0, sy: 0, moved: 0 });
  function uDown(e) {
    var g = vp.current; introCamRef.current.taken = true; g.pts[e.pointerId] = { x: e.clientX, y: e.clientY }; var ids = Object.keys(g.pts);
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
    var g = vp.current;                                  // тап больше НЕ закрывает — закрытие ТОЛЬКО крестиком (David)
    delete g.pts[e.pointerId]; if (!Object.keys(g.pts).length) g.mode = null;
    var c = camRef.current;
    setCamQ({ x: c.x, y: c.y, z: c.z });               // жест кончился → структура сразу догоняет
  }
  function uWheel(e) { introCamRef.current.taken = true; var c = camRef.current; camRef.current = { x: c.x, y: c.y, z: _cZ(c.z * (1 - (e.deltaY || 0) * 0.0012)) }; }

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
    return [{ sp: youSp, fx: 0, fy: 0, fxH: 0, fyH: 0, you: true, ring: 0, key: "you" }]
      .concat(layout.nodes.map(function (n, j) { return { sp: n.sp, fx: n.fx, fy: n.fy, fxH: n.fxH, fyH: n.fyH, ring: n.ring, key: "o" + j }; }));
  }, [youSp, layout]);
  nodesRef.current = allNodes; // rAF-цикл всегда видит свежий список
  showLinksRef.current = showLinks; // цикл видит текущую цель «дыхания» без своей подписки
  // ── СЛОЙ СВЯЗЕЙ (созвездия): рёбра «пригласивший → приглашённый» ────────────────────────
  // Граф из referredBy КАЖДОГО узла (у чужих — из allPublic; у «Я» — myRefId). Ребро рисуем
  // ТОЛЬКО когда ОБА конца present в поле. Чистая read-only логика: НЕ трогает раскладку/линзу/
  // камеру — лишь читает fx/fy узлов. Строим лишь при включённом тумблере (иначе [] → нет слоя).
  var links = React.useMemo(function () {
    if (!showLinks) return [];
    var byId = {};
    allNodes.forEach(function (nd) { var id = nd.you ? myUid : (nd.sp && nd.sp.s && nd.sp.s.id); if (id) byId[id] = nd; });
    var out = [];
    allNodes.forEach(function (nd) {
      var id = nd.you ? myUid : (nd.sp && nd.sp.s && nd.sp.s.id);
      var rb = nd.you ? myRefId : (nd.sp && nd.sp.s && nd.sp.s.referredBy);
      if (!id || !rb || rb === id) return;             // нет id/пригласившего или самоссылка — пропуск
      var inv = byId[rb];
      if (!inv || inv === nd) return;                  // пригласивший не в поле — нить не рисуем
      out.push({ key: inv.key + "→" + nd.key, a: inv, b: nd, i: out.length });  // a=пригласивший, b=приглашённый
    });
    return out;
  }, [allNodes, myUid, myRefId, showLinks]);
  // Отдельный rAF ТОЛЬКО для эндпоинтов нитей: читает camRef+introRef (те же, что systems-loop),
  // зовёт calcNode для двух концов ребра и пишет x1/y1/x2/y2 прямо в DOM линий. Основной цикл не
  // трогает. Живёт лишь пока связи включены. Э3: (1) ранний выход кадра — в покое ноль записей
  // (раньше 12 атрибутов × нить × 60fps даже без движения = вечная инвалидация SVG-слоя);
  // (2) числовой скип на нить; (3) куллинг — нить целиком за кадром прячется visibility (пульс
  // «дыхания» ПРОДОЛЖАЕТ идти по своей фазе → возврат в кадр не сбивает каскад волны от центра).
  React.useEffect(function () {
    if (!showLinks || !links.length) return;
    var raf, st = {};                                    // key → {x1,y1,x2,y2,hid} — последняя запись
    var lastE = { x: NaN, y: NaN, z: NaN, mt: NaN, ik: NaN };
    function setVis(o, v) { if (o.c) o.c.style.visibility = v; if (o.h) o.h.style.visibility = v; if (o.s) o.s.style.visibility = v; }
    // (Пере)старт эффекта на новом наборе links: у переиспользованных линий мог остаться
    // visibility:hidden от прошлого куллинга (свежий st стартует hid:false и сам бы не снял) → сбрасываем.
    try { var _e0 = edgeEls.current; for (var _k in _e0) { if (_e0[_k]) setVis(_e0[_k], ""); } } catch (e) {}
    function frame() {
      raf = requestAnimationFrame(frame);
      var cam = camRef.current, introK = _bosLp(1.34, 1, _bosSm(introRef.current)), mt = morphRef.current, els = edgeEls.current;
      if (cam.x === lastE.x && cam.y === lastE.y && cam.z === lastE.z && mt === lastE.mt && introK === lastE.ik) return;
      lastE.x = cam.x; lastE.y = cam.y; lastE.z = cam.z; lastE.mt = mt; lastE.ik = introK;
      var M = 90;                                        // запас за краем экрана
      for (var i = 0; i < links.length; i++) {
        var ed = links[i], o = els[ed.key]; if (!o) continue;
        var afx = ed.a.fxH + (ed.a.fx - ed.a.fxH) * mt, afy = ed.a.fyH + (ed.a.fy - ed.a.fyH) * mt;
        var bfx = ed.b.fxH + (ed.b.fx - ed.b.fxH) * mt, bfy = ed.b.fyH + (ed.b.fy - ed.b.fyH) * mt;
        var a = calcNode(afx, afy, cam, introK), b = calcNode(bfx, bfy, cam, introK);
        var s = st[ed.key] || (st[ed.key] = { x1: NaN, y1: NaN, x2: NaN, y2: NaN, hid: false });
        if (Math.max(a.sx, b.sx) < -M || Math.min(a.sx, b.sx) > W + M || Math.max(a.sy, b.sy) < -M || Math.min(a.sy, b.sy) > H + M) {
          if (!s.hid) { s.hid = true; setVis(o, "hidden"); }
          continue;
        }
        if (s.hid) { s.hid = false; setVis(o, ""); }
        if (Math.abs(a.sx - s.x1) < 0.05 && Math.abs(a.sy - s.y1) < 0.05 && Math.abs(b.sx - s.x2) < 0.05 && Math.abs(b.sy - s.y2) < 0.05) continue;
        s.x1 = a.sx; s.y1 = a.sy; s.x2 = b.sx; s.y2 = b.sy;
        var x1 = a.sx.toFixed(1), y1 = a.sy.toFixed(1), x2 = b.sx.toFixed(1), y2 = b.sy.toFixed(1);
        if (o.c) { o.c.setAttribute("x1", x1); o.c.setAttribute("y1", y1); o.c.setAttribute("x2", x2); o.c.setAttribute("y2", y2); }
        if (o.h) { o.h.setAttribute("x1", x1); o.h.setAttribute("y1", y1); o.h.setAttribute("x2", x2); o.h.setAttribute("y2", y2); }
        if (o.s) { o.s.setAttribute("x1", x1); o.s.setAttribute("y1", y1); o.s.setAttribute("x2", x2); o.s.setAttribute("y2", y2); }
      }
    }
    raf = requestAnimationFrame(frame);
    return function () { cancelAnimationFrame(raf); };
  }, [showLinks, links]);
  frameDirty.current = true; // этот рендер перепишет inline-стили узлов (nodeSig → null в map ниже)
  var node = (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, overflow: "hidden", background: bg, animation: "bosUniFade 0.5s ease both" }}>
      <style>{"@keyframes bosUniFade{from{opacity:0}to{opacity:1}}@keyframes bosSysPop{from{opacity:0;transform:scale(0.5)}to{opacity:1;transform:scale(1)}}@keyframes bosLinkIn{from{opacity:0}to{opacity:1}}@keyframes bosLinkDraw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}@keyframes bosLinkPulse{from{stroke-dashoffset:0.18}to{stroke-dashoffset:-1}}"}</style>
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
            var _mt2 = morphRef.current;                 // тесная↔распущенная (совпадает с циклом → без прыжка)
            var _nfx = nd.fxH + (nd.fx - nd.fxH) * _mt2, _nfy = nd.fyH + (nd.fy - nd.fyH) * _mt2;
            // СТРУКТУРА (LOD/вращение) — по ТЕМ ЖЕ морфированным координатам, что и ПОКАЗ. Раньше здесь
            // стояли сырые fx/fy РАСПУЩЕННОЙ (семейной) раскладки: при выключенных «Связях» узел рисуется
            // в fxH тесной соты, а линза судила по fx → орбиты вспыхивали/гасли НЕВПОПАД при пане (главный
            // источник «моргания» с v579). Теперь раскрывается ровно то, что реально под линзой.
            var vq = nodeVisual(_nfx, _nfy, camQ, 1); // (зум сокращается — см. calcNode)
            var prev = lodRef.current[key];
            var lod = vq.openV > (prev === "orbit" ? 0.10 : 0.14) ? "orbit" : "disc";
            lodRef.current[key] = lod;
            var vNow = nodeVisual(_nfx, _nfy, camRef.current, _bosLp(1.34, 1, _bosSm(introRef.current)));
            // VIEWPORT CULLING (David: «рендерить только то, что в видимой области»): после интро НЕ
            // монтируем узлы дальше поля-запаса (~0.8 вьюпорта) за краем экрана. Раньше все 121 систем
            // висели в DOM (при ~11 видимых на близком зуме), React их пересобирал, а rAF-цикл считал
            // математику. Теперь их нет в дереве → меньше DOM/React И цикла (loop пропускает по !el до
            // математики). Во время интро (раскрытие толпы) не куллим; поп после интро = "none" → въезд
            // в кадр без мерцания. Слой «Связи» рисует нити по координатам, не по DOM → не ломается.
            if (introDone) {
              var _cm = Math.max(W, H) * 0.8, _fs = vNow.f.size;
              if (vNow.f.sx < -_fs - _cm || vNow.f.sx > W + _fs + _cm || vNow.f.sy < -_fs - _cm || vNow.f.sy > H + _fs + _cm) return null;
            }
            var delay = Math.min((nd.ring || 0) * 0.14, 1.0) + ((_bosHashU(key) % 100) / 100) * 0.15;
            var pop = introDone ? "none" : ("bosSysPop 0.55s cubic-bezier(0.34,1.35,0.5,1) " + delay.toFixed(2) + "s both");
            var style = {
              position: "absolute", left: 0, top: 0, transformOrigin: "0px 0px", pointerEvents: "none",
              visibility: vNow.off ? "hidden" : undefined, zIndex: vNow.zi,
              transform: "translate(" + vNow.f.sx.toFixed(1) + "px," + vNow.f.sy.toFixed(1) + "px) scale(" + (lod === "disc" ? vNow.dscale : vNow.oscale).toFixed(4) + ")",
            };
            if (lod !== "disc") { style["--uK"] = _bosLp(0.3, 1, vNow.openV).toFixed(4); style["--uO"] = vNow.openV.toFixed(3); style["--uA"] = vNow.uA.toFixed(4); }
            nodeSig.current[key] = null; // рендер переписал inline-стили → цикл обновит сигнатуру заново
            return (
              <div key={key} ref={nodeRefCbs.current[key] || (nodeRefCbs.current[key] = function (el) { if (el) nodeEls.current[key] = el; else { delete nodeEls.current[key]; delete nodeSig.current[key]; } })} data-lod={lod} style={style}>
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
      {/* СЛОЙ СВЯЗЕЙ/СОЗВЕЗДИЙ: ПОД системами (z:10 — нити выходят ИЗ-ПОД дисков-аватарок, аватарки сидят
          поверх → чисто, без резки по лицам). pointerEvents:none → жесты пан/зум проходят СКВОЗЬ. Дальние
          поколения бледнее (op ∝ глубина b.ring) — глаз держится на ближнем круге «своих». Эндпоинты
          гонит отдельный rAF выше; гало+ядро (свечение без filter), прорисовка draw-in, mixBlendMode. */}
      {showLinks && links.length > 0 && (
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10 }}>
          {links.map(function (ed) {
            var iK = _bosLp(1.34, 1, _bosSm(introRef.current));   // те же значения, что читает rAF — без «прыжка» в 1-й кадр
            var mt0 = morphRef.current;                            // концы от распускающихся центров (совпадает с rAF)
            var a0 = calcNode(ed.a.fxH + (ed.a.fx - ed.a.fxH) * mt0, ed.a.fyH + (ed.a.fy - ed.a.fyH) * mt0, camRef.current, iK);
            var b0 = calcNode(ed.b.fxH + (ed.b.fx - ed.b.fxH) * mt0, ed.b.fyH + (ed.b.fy - ed.b.fyH) * mt0, camRef.current, iK);
            var dly = Math.min(ed.i * 0.03, 0.5);                 // лёгкий каскад «загорания» нитей
            var dep = (ed.b && ed.b.ring) || 1;                   // глубина приглашённого → затухание вглубь
            var op = Math.max(0.22, 0.85 - (dep - 1) * 0.1);
            var shineDelay = 0.6 + Math.min((dep - 1) * 0.35, 1.5);    // старт пульса ПОСЛЕ распускания, фаза по поколениям → волна ОТ ЦЕНТРА
            return (
              <g key={ed.key} style={{ animation: "bosLinkIn 0.5s ease " + dly.toFixed(2) + "s both" }}>
                <line ref={function (el) { var o = edgeEls.current[ed.key] || (edgeEls.current[ed.key] = {}); if (el) o.h = el; else delete o.h; }}
                  x1={a0.sx.toFixed(1)} y1={a0.sy.toFixed(1)} x2={b0.sx.toFixed(1)} y2={b0.sy.toFixed(1)}
                  stroke={linkHalo} strokeWidth={3.0} strokeLinecap="round" strokeOpacity={(op * 0.5).toFixed(2)} />
                <line ref={function (el) { var o = edgeEls.current[ed.key] || (edgeEls.current[ed.key] = {}); if (el) o.c = el; else delete o.c; }}
                  x1={a0.sx.toFixed(1)} y1={a0.sy.toFixed(1)} x2={b0.sx.toFixed(1)} y2={b0.sy.toFixed(1)}
                  stroke={linkCore} strokeWidth={1.1} strokeLinecap="round" strokeOpacity={op.toFixed(2)}
                  pathLength="1" strokeDasharray="1" style={{ animation: "bosLinkDraw 0.65s ease " + dly.toFixed(2) + "s both" }} />
                <line ref={function (el) { var o = edgeEls.current[ed.key] || (edgeEls.current[ed.key] = {}); if (el) o.s = el; else delete o.s; }}
                  x1={a0.sx.toFixed(1)} y1={a0.sy.toFixed(1)} x2={b0.sx.toFixed(1)} y2={b0.sy.toFixed(1)}
                  stroke={linkShine} strokeWidth={2.4} strokeLinecap="round"
                  pathLength="1" strokeDasharray="0.18 1" style={{ animation: "bosLinkPulse 3.2s ease-in-out " + shineDelay.toFixed(2) + "s infinite both" }} />
              </g>
            );
          })}
        </svg>
      )}
      {/* David: подпись «Вселенная» + счётчик систем УХОДИЛИ ПОД иконки (у систем z до ~185, у баннера
          не было z). Поднимаем баннер и подсказки НАД полем (z 500) — саму механику не трогаем. */}
      <div style={{ position: "absolute", top: "calc(18px + var(--tg-top-inset, 0px))", left: 20, right: 150, textAlign: "left", pointerEvents: "none", zIndex: 500 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: titleC }}>Вселенная</div>
        {sub ? <div style={{ fontSize: 13, color: subC, marginTop: 3 }}>{sub}</div> : null}
      </div>
      {friends != null && list.length === 0 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: "calc(50% + 96px)", textAlign: "center", padding: "0 44px", color: subC, fontSize: 13.5, lineHeight: 1.5, pointerEvents: "none", zIndex: 500 }}>Позови первых — и рядом с твоей появятся их солнечные системы.</div>
      )}
      <button onClick={onClose} aria-label="Закрыть" className="tap" style={{ position: "absolute", top: "calc(14px + var(--tg-top-inset, 0px))", right: 16, width: 36, height: 36, borderRadius: "50%", border: 0, background: isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.82)", color: isDark ? "#fff" : "var(--text)", display: "grid", placeItems: "center", boxShadow: isDark ? "none" : "0 2px 8px rgba(0,0,0,0.12)", WebkitBackdropFilter: isDark ? "blur(8px)" : "none", backdropFilter: isDark ? "blur(8px)" : "none", zIndex: 500 }}><I.X size={18} /></button>
      {/* Тумблер «✦ Связи» — стекло, СПРАВА ПЕРЕД крестиком (right:60, крестик right:16 шир.36). Вкл =
          слой созвездий (кто кого привёл); подсвечен индиго. Сиблинг НАД полем — жестов не перехватывает. */}
      {list.length > 0 && (
        <button onClick={function () { setShowLinks(function (v) { return !v; }); }} className="tap" aria-label="Связи"
          style={{ position: "absolute", top: "calc(14px + var(--tg-top-inset, 0px))", right: 60, height: 36, padding: "0 15px", borderRadius: 18, border: 0,
            background: showLinks ? (isDark ? "rgba(130,175,255,0.30)" : "rgba(74,108,214,0.16)") : (isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.82)"),
            color: showLinks ? (isDark ? "#dce9ff" : "#3a55c0") : (isDark ? "#fff" : "var(--text)"),
            fontSize: 13.5, fontWeight: 600, letterSpacing: 0.2, display: "flex", alignItems: "center", gap: 6,
            /* blur только когда пилюля полупрозрачна: тёмная (12% белого) или АКТИВНА (16% индиго) — там
               frost виден. В светлой-выкл (82% белого) блюр невидим, но пере-блюрил бы фон каждый кадр пана. */
            boxShadow: isDark ? "none" : "0 2px 8px rgba(0,0,0,0.12)", WebkitBackdropFilter: (isDark || showLinks) ? "blur(8px)" : "none", backdropFilter: (isDark || showLinks) ? "blur(8px)" : "none", zIndex: 500 }}>
          <span style={{ fontSize: 14, lineHeight: 1 }}>✦</span> Связи
        </button>
      )}
    </div>
  );
  // Portal to <body> so position:fixed escapes the page-stack's CSS transform.
  return (typeof ReactDOM !== "undefined" && ReactDOM.createPortal) ? ReactDOM.createPortal(node, document.body) : node;
}

/* ── Привычки-страница: нижняя полоска недели + Apple-палитра (live-only, v235). The
   HOME card stays the compact row — only the Привычки-page card grows this strip.
   Colours = the Apple JOURNAL palette (David found it: «такие же цвета, как в Журнале») —
   muted warm→cool tints, softer & more refined than the raw system colours. ── */
const BOS_APPLE_COLORS = ["#32ADE6", "#007AFF", "#5856D6", "#AF52DE", "#FF2D55", "#FF3B30", "#FF9500", "#FFCC00", "#34C759", "#00C7BE", "#30B0C7", "#A2845E"];
// Миграция старой «журнальной» палитры (v235) → новые системные тона (David: «унифицировать
// сквозь всё, реальные цвета»). Старые привычки/цели сразу читаются в новой палитре, а не остаются
// приглушёнными. Меняются ТОЛЬКО известные старые hex; всё прочее (новые, #0a0a0a, #8E8E93, свой
// цвет) проходит как есть. Применяется в точках-заливках (bosCellFill/Empty/TodayRing/GoalSkin/Hero/плитки).
const BOS_COLOR_MIGRATE = { "#A06A86": "#AF52DE", "#F0564C": "#FF3B30", "#E08AC4": "#FF2D55", "#E59B9B": "#FF2D55", "#CBA98D": "#A2845E", "#F0A24E": "#FF9500", "#19B89B": "#00C7BE", "#54C3E4": "#32ADE6", "#4A6CD6": "#007AFF", "#84A4B8": "#30B0C7", "#7F9AF2": "#5856D6", "#8676E6": "#5856D6",
  "#0A84FF": "#007AFF", "#30D158": "#34C759", "#FF453A": "#FF3B30", "#FF9F0A": "#FF9500", "#FFD60A": "#FFCC00", "#BF5AF2": "#AF52DE", "#FF375F": "#FF2D55", "#64D2FF": "#32ADE6", "#5E5CE6": "#5856D6", "#63E6E2": "#00C7BE", "#40C8E0": "#30B0C7" };
function bosCanonColor(hx) { if (typeof hx !== "string" || hx[0] !== "#") return hx; return BOS_COLOR_MIGRATE[hx.toUpperCase()] || hx; }

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
        // День = стеклянное КОЛЬЦО-заполнение: доля выполненных сегодня привычек (David v660).
        // «Дни недели»: привычка с расписанием в чужой день НЕ входит в знаменатель — кольцо
        // требует только то, что на этот день назначено (отметил в чужой день → всё равно idёт в счёт).
        var due = habits.filter(function (h) {
          var m = (typeof bosDaysMask === "function") ? bosDaysMask(h.days) : null;
          return (h.log && h.log[k]) || !m || !!m[i];
        });
        var doneN = due.length ? due.filter(function (h) { return h.log && h.log[k]; }).length : 0;
        var pct = due.length ? doneN / due.length : 0;
        var isToday = k === todayK;
        return (
          <div key={i} style={{ flex: 1, minWidth: 0, display: "flex", justifyContent: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "8px 7px 6px", borderRadius: 18, background: isToday ? todayCap : "transparent" }}>
              <div style={{ width: 28, height: 28 }}>{bosDayRing(pct, "#0a0a0a", isDark, { sw: 4.9 })}</div>
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
const BOS_APPLE_COLOR_NAMES = { "#32ADE6": "Небесный", "#007AFF": "Синий", "#5856D6": "Индиго", "#AF52DE": "Пурпур", "#FF2D55": "Розовый", "#FF3B30": "Красный", "#FF9500": "Оранжевый", "#FFCC00": "Жёлтый", "#34C759": "Зелёный", "#00C7BE": "Мятный", "#30B0C7": "Бирюзовый", "#A2845E": "Коричневый", "#8E8E93": "Серый",
  /* legacy hues — habits made before the systemic palette still read a name */
  "#A06A86": "Сливовый", "#F0564C": "Коралловый", "#E08AC4": "Орхидея", "#E59B9B": "Лосось", "#CBA98D": "Глина", "#F0A24E": "Оранжевый", "#19B89B": "Мятный", "#54C3E4": "Голубой", "#4A6CD6": "Синий", "#84A4B8": "Грифельный", "#7F9AF2": "Барвинок", "#8676E6": "Индиго", "#0A84FF": "Синий" };

// Neutral DEFAULT colour — a soft grey (David: «дефолтный цвет серый», в духе наших серых стеклянных
// кружков). Lives at the head of the palette next to «Чёрный».
const BOS_GREY = "#8E8E93";
// A glassy colour swatch — a glossy sphere: bright top-left specular + soft bottom inner shadow over
// the colour, so every picker circle reads «в стекле» (David's example). Returns {background,boxShadow};
// `selected` adds the white-gap halo ring in the swatch's own colour. ONE source → identical everywhere.
function bosColorSwatch(hx, selected, isDark) {
  var raw = (typeof bosCanonColor === "function") ? bosCanonColor(hx) : hx;
  if (!(typeof raw === "string" && raw[0] === "#")) raw = "#0a0a0a";
  var low = raw.toLowerCase();
  var isStd = low === "#0a0a0a";
  // Свотч = САМ цвет (ярко — видно, что выбираешь), МАТОВОЕ стекло (BOS_TILE_SHEEN линейный, как у
  // плиток), НЕ радиальный «шар» (David). «Стандарт» → светло-серая нейтраль-плитка. Выбор — ГАЛОЧКОЙ
  // (рисует пикер), без спорной обводки. `ink` = цвет галочки (контраст к тону).
  var tone = isStd ? (isDark ? "rgba(255,255,255,0.14)" : "#E9EBF0") : raw;
  var ink = isStd ? (isDark ? "#eef0f4" : "#3a3d44") : ((typeof bosLum === "function" && bosLum(raw) > 0.62) ? "#141416" : "#ffffff");
  var sheen = (typeof BOS_TILE_SHEEN !== "undefined") ? BOS_TILE_SHEEN : "linear-gradient(165deg, rgba(255,255,255,0.5), rgba(255,255,255,0.1) 46%, rgba(255,255,255,0) 72%)";
  var glass = (typeof bosTileGlass === "function") ? bosTileGlass(!!isDark) : "inset 0 1px 0.5px rgba(255,255,255,0.9), 0 1px 2px rgba(0,0,0,0.06)";
  return { background: sheen + ", " + tone, boxShadow: glass, ink: ink };
}
/* THE colour picker — ONE component for привычки / цели / команды so the choice is pixel-identical
   everywhere (David: «определись с палитрой основной»). Custom wheel + Серый + Чёрный + the Apple
   palette (BOS_APPLE_COLORS — the habit colours David likes), every circle glassy (bosColorSwatch). */
function BosColorPickerLive({ value, onChange }) {
  const app = (typeof useApp === "function") ? useApp() : null;
  const isDark = !!(app && app.themeOverride === "dark");
  const val = (typeof bosCanonColor === "function") ? bosCanonColor(value) : value; // старый цвет → канон, чтобы свотч подсветился
  const isHex = typeof val === "string" && val[0] === "#";
  const custom = isHex && val !== "#0a0a0a" && val !== BOS_GREY && !BOS_APPLE_COLORS.includes(val);
  const sheen = (typeof BOS_ORB_SHEEN !== "undefined") ? BOS_ORB_SHEEN : "linear-gradient(180deg, rgba(255,255,255,0.4), rgba(255,255,255,0.06) 58%, rgba(255,255,255,0) 85%)";
  const glass = (typeof bosOrbGlass === "function") ? bosOrbGlass(isDark) : "inset 0 0 1px rgba(255,255,255,0.7), 0 0 2px rgba(0,0,0,0.1)";
  const base = { width: 32, height: 32, borderRadius: "50%", border: 0, flexShrink: 0, cursor: "pointer", transition: "box-shadow 0.15s", display: "grid", placeItems: "center", padding: 0 };
  // Один свотч = стеклянный кружок + галочка при выборе (David: «галочка на выбранный, без обводки»).
  const swatchBtn = (hx, label) => {
    const sel = val === hx;
    const s = bosColorSwatch(hx, sel, isDark);
    return (
      <button key={hx} type="button" className="tap" data-haptic="selection" onClick={() => onChange(hx)} aria-label={label}
        style={{ ...base, background: s.background, boxShadow: s.boxShadow }}>
        {sel ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke={s.ink} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg> : null}
      </button>
    );
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, overflowX: "auto", overflowY: "hidden", scrollbarWidth: "none", WebkitOverflowScrolling: "touch", padding: "10px 8px" }}>
      <label className="tap" data-haptic="selection" style={{ position: "relative", width: 32, height: 32, borderRadius: "50%", flexShrink: 0, cursor: "pointer",
        background: sheen + ", conic-gradient(from 0deg, #FF3B30, #FF9500, #FFCC00, #34C759, #30B0C7, #007AFF, #AF52DE, #FF2D55, #FF3B30)",
        boxShadow: (custom ? "0 0 0 2px var(--surface-1, #fff), 0 0 0 4px var(--text-3), " : "") + glass }}>
        <input type="color" value={isHex ? val : "#0a0a0a"} onChange={(e) => onChange(e.target.value)} aria-label="Свой цвет"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, border: 0, padding: 0, cursor: "pointer" }} />
      </label>
      <span style={{ width: 1, height: 26, background: "var(--line)", flexShrink: 0 }} />
      {swatchBtn("#0a0a0a", "Стандарт")}
      {BOS_APPLE_COLORS.map((c) => swatchBtn(c, BOS_APPLE_COLOR_NAMES[c] || "Цвет"))}
      {swatchBtn(BOS_GREY, "Серый")}
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

// Legacy SF-symbol → эмодзи. David убрал монохромные «Символы» из пикера (только эмодзи), поэтому
// любую иконку, ранее сохранённую как "sf:<Name>", теперь показываем ближайшим по смыслу эмодзи —
// везде, вживую, НЕ трогая сохранённые данные (при следующем ре-сохранении эмодзи закрепится).
const BOS_SF_TO_EMOJI = {
  Heart: "❤️", Activity: "🏃", Dumbbell: "🏋️", Bicycle: "🚴", Flame: "🔥", Drop: "💧", Bed: "🛏️",
  Pill: "💊", Apple: "🍎", Cup: "☕", Bulb: "💡", Book: "📖", Pencil: "✏️", Music: "🎵",
  Headphones: "🎧", Palette: "🎨", Mic: "🎤", Sun: "☀️", Sunrise: "🌅", Moon: "🌙", Clock: "⏰",
  Bell: "🔔", Calendar: "📅", Target: "🎯", Trophy: "🏆", Flag: "🚩", Sparkles: "✨", Star: "⭐",
  Sprout: "🌱", ChartBar: "📊", Users: "👥", Globe: "🌍", MapPin: "📍", Mountain: "⛰️", Tree: "🌳",
  Camera: "📷", Game: "🎮", Gift: "🎁", Compass: "🧭", Briefcase: "💼", Wallet: "👛", Dollar: "💰",
  Home: "🏠", Phone: "📱", Mail: "✉️", Snowflake: "❄️",
};
function bosDeSF(val) {
  if (typeof val !== "string" || val.slice(0, 3) !== "sf:") return val;   // обычный эмодзи — как есть
  var k = val.slice(3);
  if (BOS_SF_TO_EMOJI[k]) return BOS_SF_TO_EMOJI[k];
  // savePublicStats ОБРЕЗАЕТ эмодзи до 8 симв (cloud.js) → "sf:Bicycle"→"sf:Bicyc", ключ "Bicyc" не
  // матчился точно. Матчим по ПРЕФИКСУ: ищем полное имя, начинающееся с обрезка (Bicyc→Bicycle→🚴).
  if (k) { for (var key in BOS_SF_TO_EMOJI) { if (key.indexOf(k) === 0) return BOS_SF_TO_EMOJI[key]; } }
  return "✨";
}
// Render a habit/goal/team icon — теперь всегда эмодзи-строка (старое "sf:<Name>" → эмодзи через
// bosDeSF). size/color для эмодзи игнорируются; оставлены в сигнатуре для совместимости вызовов.
// Никогда не показывает сырой текст "sf:…".
function bosIcon(val, size, color) {
  return bosDeSF(val) || "";
}

// Все эмодзи ОДНОЙ лентой (David: категории не нравятся — сплошной поток). Дедупим, сохраняя порядок.
const BOS_EMOJI_ALL = (function () { var seen = {}, out = []; BOS_EMOJI_CATS.forEach(function (c) { c.list.forEach(function (e) { if (!seen[e]) { seen[e] = 1; out.push(e); } }); }); return out; })();
function EmojiPickerLive({ onPick, accent = "#0a0a0a", current, embedded = false }) {
  const { close } = useSheet();
  // embedded = живёт ВНУТРИ другой шторки (напр. создание командной привычки) → не закрывать
  // общий sheet-хост на выбор, просто вернуть значок (one-sheet host рендерит одну шторку).
  const pick = (e) => { if (onPick) onPick(e); if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (_) {} } if (!embedded) close(); };
  // David: одна СПЛОШНАЯ лента всех эмодзи — без категорий и без «Символов».
  return (
    <div style={{ padding: "2px 10px 6px", color: "#0a0a0a" }}>
      <div style={{ textAlign: "center", fontSize: 17, fontWeight: 700, marginBottom: 12 }}>Выбери иконку</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 2, maxHeight: 344, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
        {BOS_EMOJI_ALL.map((e, i) => (
          <button key={i} className="tap" data-no-haptic onClick={() => pick(e)} style={{ aspectRatio: "1 / 1", borderRadius: 10, border: 0, background: "transparent", fontSize: 25, cursor: "pointer", padding: 0 }}>{e}</button>
        ))}
      </div>
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
  // Тап прибавляет +1. На ПОЛНОСТЬЮ заполненном (done) тап снимает отметку целиком → день снова
  // чистый, счёт в ноль (David 2026-07-07: «как обычная привычка — а то заполненный счётчик застревал,
  // не прокликивался»). Совпадает с тапом по today-клетке календаря на детальной (h.done ? 0). Тонкая
  // правка на −1 остаётся долгим зажатием (startLP).
  const onClick = (e) => { e.stopPropagation(); if (suppress.current) { suppress.current = false; return; } if (isDone) { apply(0); return; } apply(count + 1); };

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
    : <span className="check-btn unchecked" style={{ width: 30, height: 30 }}><span style={{ color: count > 0 ? bosReadableInk(accent, isDark) : "var(--text-4)", fontSize: 12.5, fontWeight: 700, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{count}</span></span>;

  return (
    <div style={{ position: "relative", flexShrink: 0, width: 30, height: 30, display: "grid", placeItems: "center" }}>
      <XpFloat tick={tick} xp={xp} anchorRef={btnRef} />
      <button ref={btnRef} className="tap hit44" data-no-haptic onClick={onClick}
        onPointerDown={startLP} onPointerUp={endLP} onPointerLeave={endLP} onPointerCancel={endLP}
        aria-label={isDone ? ("Выполнено " + goal + " из " + goal + ", тап — снять отметку") : ("Прогресс " + count + " из " + goal + ", тап +1, удержание −1")}
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
    : <span className="check-btn unchecked" style={{ width: 30, height: 30, color: bosReadableInk(accent, isDark) }}>
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
  // Общий круг/цель = «goal» в единой шторке: центр = эмблема круга, вокруг растут люди.
  const app = (typeof useApp === "function") ? useApp() : null;
  const dark = !!(app && app.themeOverride === "dark");
  const link = (team && team.cloudId && typeof bosTeamInviteLink === "function")
    ? bosTeamInviteLink(team.cloudId)
    : ((typeof bosInviteLink === "function") ? bosInviteLink(null) : "https://t.me/BalanceOS8_bot");
  return <ShareSheetLive kind="goal" dark={dark} subject={{ name: team && team.name, emoji: team && (team.emblem || "✨"), color: team && (team.accent || team.color), link: link }} />;
}

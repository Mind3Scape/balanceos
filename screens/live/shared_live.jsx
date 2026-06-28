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
    <div style={{ background: "#fff", borderRadius: 22, padding: 14, marginTop: 10, boxShadow: "var(--card-shadow)" }}>
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
              style={{ aspectRatio: "1/1", border: 0, borderRadius: ends ? 999 : (mid ? 7 : 10), cursor: past(d) ? "default" : "pointer",
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
  if (!(hx && hx[0] === "#" && hx.length >= 7)) hx = "#FEDE34";
  var bot = 0.30 + 0.55 * Math.max(0, Math.min(1, p));  // bottom alpha — PRESENT, caps ~0.85 (never full)
  var top = bot * 0.6;                                    // lighter top → directional sheen
  var hex = function (a) { return Math.round(a * 255).toString(16).padStart(2, "0"); };
  return "linear-gradient(180deg, " + hx + hex(top) + ", " + hx + hex(bot) + ")";
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
  return isDark
    ? "inset 0 1.5px 0.5px rgba(255,255,255,0.22), inset 0 0 0 0.7px rgba(255,255,255,0.07), 0 1px 2px rgba(0,0,0,0.18)"
    : "inset 0 1.5px 0.5px rgba(255,255,255,0.92), inset 0 0 0 0.7px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.05)";
}
const BOS_TILE_SHEEN = "linear-gradient(165deg, rgba(255,255,255,0.55), rgba(255,255,255,0.12) 46%, rgba(255,255,255,0) 72%)";
// Grey GLASS pill — the «Быстрое добавление» chip look (grey base) + a soft glass sheen + bright
// top edge. ONE source so the home hero pills and the Habits quick-add chips stay identical
// (David: стекло на пилюли + континьюити). Spread into a chip's inline style; pair with border:0.
function bosChipGlass(isDark) {
  return {
    background: BOS_TILE_SHEEN + ", " + (isDark ? "rgba(255,255,255,0.08)" : "#F1F1F5"),
    boxShadow: isDark
      ? "inset 0 0.5px 0.5px rgba(255,255,255,0.12), inset 0 0 0 0.5px rgba(255,255,255,0.05)"
      : "inset 0 1px 0.5px rgba(255,255,255,0.95), inset 0 0 0 0.5px rgba(0,0,0,0.05)",
  };
}
// Number ink for a filled day in «подробно» — contrast over the fill (white on dark hues, ink on
// light hues). Favours dark text when borderline (the top sheen lightens the centre).
function bosCellInk(hx, p, isDark) {
  if (!(hx && hx[0] === "#" && hx.length >= 7)) hx = "#FEDE34";
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
  const aggColor = (people[0] && people[0].color) || "#FEDE34";
  const selColor = selPerson == null ? aggColor : (people[selPerson]?.color || aggColor);
  const todayBg = isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.07)";
  const selRing = isDark ? "rgba(255,255,255,0.42)" : "rgba(0,0,0,0.28)";
  const chipBg = isDark ? "rgba(255,255,255,0.07)" : "var(--surface-3)";
  const chip = (active) => ({ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px 5px 6px", borderRadius: 999, background: active ? (isDark ? "#fff" : "#0a0a0a") : chipBg, color: active ? (isDark ? "#0a0a0a" : "#fff") : "var(--text-2)", border: 0, flexShrink: 0, fontSize: 13, fontWeight: active ? 700 : 500, whiteSpace: "nowrap", cursor: "pointer" });
  const weekday = ["Вс","Пн","Вт","Ср","Чт","Пт","Сб"];
  const cells = [...Array.from({ length: startWeekday }, (_, i) => ({ blank: true, key: "b" + i })), ...Array.from({ length: daysInMonth }, (_, i) => ({ d: i + 1, key: "d" + (i + 1) }))];
  const selActive = future(selDay) ? null : people.filter((_, i) => (pf(i, selDay) ?? 0) >= 0.5).length;
  const selAvg = future(selDay) ? null : Math.round((allFrac(selDay) || 0) * 100);
  const selName = (selPerson != null && people[selPerson]) ? people[selPerson].name : null;

  // Ripple — a wave that radiates from the tapped TODAY cell across the whole grid (David: «как в
  // Ripples — волны расходятся по квадратикам от того, на который тапнул»). Web-Animations API,
  // staggered by grid distance; auto-cleans, no React state churn.
  const gridRef = React.useRef(null);
  const todayIdx = startWeekday + today - 1; // flat index of «today» within `cells`
  const triggerRipple = (originIdx) => {
    const grid = gridRef.current; if (!grid) return;
    const cols = 7, kids = grid.children;
    const or = Math.floor(originIdx / cols), oc = originIdx % cols;
    for (let i = 0; i < kids.length; i++) {
      const el = kids[i]; if (!el || el.getAttribute("aria-hidden")) continue;
      const dist = Math.hypot(Math.floor(i / cols) - or, (i % cols) - oc);
      try {
        el.animate([{ transform: "scale(1)" }, { transform: "scale(1.18)" }, { transform: "scale(1)" }],
          { duration: 430, delay: dist * 42, easing: "cubic-bezier(0.22,0.9,0.3,1.2)" });
      } catch (_) {}
    }
  };
  const fireToday = () => { setSelDay(today); triggerRipple(todayIdx); if (todayTap && todayTap.onTap) todayTap.onTap(); };

  return (
    <>
      <div style={{ background: "var(--card)", borderRadius: 22, padding: 14, boxShadow: "var(--card-shadow)", marginTop: label ? 12 : 0 }}>
        {/* Title + eye toggle live INSIDE the card now (David: «надписи вписаны в блок, не вынесены —
            чтобы блоки читались бум-бум-бум»). «Компактно» = pretty cells ↔ «Подробно» = dates+labels. */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          {label ? <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.2px", color: "var(--text-2)" }}>{label}</div> : <span />}
          <button onClick={() => setCompact((c) => !c)} className="tap" aria-label={compact ? "Подробно" : "Компактно"}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: chipBg, border: 0, borderRadius: 999, padding: "5px 11px", color: "var(--text-2)", fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
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

        {!compact && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button onClick={() => setMIdx((m) => Math.max(0, m - 1))} className="tap" style={{ background: chipBg, border: 0, borderRadius: 999, width: 32, height: 32, display: "grid", placeItems: "center", color: "inherit", opacity: mIdx === 0 ? 0.35 : 1 }}><I.ChevronLeft size={16} /></button>
            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.3px" }}>{MONTHS[mIdx]} {year}</div>
            <button onClick={() => setMIdx((m) => Math.min(11, m + 1))} className="tap" style={{ background: chipBg, border: 0, borderRadius: 999, width: 32, height: 32, display: "grid", placeItems: "center", color: "inherit", opacity: mIdx === 11 ? 0.35 : 1 }}><I.ChevronRight size={16} /></button>
          </div>
        )}

        {!compact && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6, maxWidth: 300, width: "100%", margin: "12px auto 0" }}>
            {weekday.map((w, i) => <div key={i} style={{ textAlign: "center", fontSize: 9.5, fontWeight: 600, letterSpacing: 0.3, color: "var(--text-4)" }}>{w}</div>)}
          </div>
        )}
        {/* Day cells — SQUIRCLES (time = rounded squares; people = circles, the chips above), filled as
            a heat-cell by completion. «Красиво» hides numbers/labels/nav for a glanceable grid. */}
        <div ref={gridRef} style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6, maxWidth: 300, width: "100%", margin: compact ? "0 auto" : "6px auto 0" }}>
          {cells.map((c) => {
            if (c.blank) return <span key={c.key} aria-hidden style={{ aspectRatio: "1/1" }} />;
            const isToday = isCurMonth && c.d === today;
            // TODAY is the single tap-to-mark control now (David removed the bottom button — «тапаешь
            // день, бумс»). Interactive only in YOUR view (solo / «Все» / your own chip) — never on a
            // buddy's filter — and it always shows YOUR state, since the tap marks your check-in.
            const itx = !!(todayTap && isToday && (solo || selPerson == null || (people[selPerson] && people[selPerson].you)));
            const pct = itx ? todayTap.pct : dayPct(c.d);
            const fut = pct == null;
            const isSel = selDay === c.d;
            const hx = (selColor && selColor[0] === "#" && selColor.length >= 7) ? selColor : "#FEDE34";
            const done = !fut && pct >= 1;
            const filled = !fut && pct > 0;
            // Empty interactive today = a faint accent wash + accent ring + «+», so it reads «tap me».
            const bg = fut ? (isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.025)")
              : (pct <= 0 ? (itx ? bosCellFill(hx, 0.14) : track) : bosCellFill(hx, pct));
            // One COHESIVE today-glyph colour (David: «цвет цифры прыгает с чёрного на белый на 4→5 —
            // бред; пусть пока копится и в конце ВСЕГДА белый; „+" пусть остаётся в цвете обводки»).
            // Filled today = ALWAYS white number/✓ (never flips) + soft shadow so it reads on any fill;
            // empty today = accent «+» (harmonises with the ring). Non-today keeps the heat-map ink.
            const ink = fut ? "var(--text-4)" : (pct <= 0 ? (itx ? hx : "var(--text)") : (itx ? "#fff" : bosCellInk(hx, pct, isDark)));
            const todayGlow = (itx && filled) ? "0 0.5px 1.5px rgba(0,0,0,0.55)" : "none";
            const todayRing = itx ? hx : (isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.42)");
            const ring = (!compact && isSel) ? selRing : (isToday ? todayRing : null);
            const ringW = (itx && isToday) ? 2 : 1.6;
            const shadow = [filled ? bosCellGlass(isDark) : "", ring ? ("0 0 0 " + ringW + "px " + ring) : ""].filter(Boolean).join(", ") || "none";
            const onClick = itx ? fireToday : (compact ? undefined : () => setSelDay(c.d));
            return (
              <button key={c.key} {...(itx ? { "data-no-haptic": "" } : {})} onClick={onClick} className="tap" style={{
                aspectRatio: "1/1", border: 0, borderRadius: "30%", padding: 0, display: "grid", placeItems: "center",
                fontSize: 11, fontWeight: isToday ? 700 : 500, cursor: (itx || !compact) ? "pointer" : "default",
                background: bg, boxShadow: shadow, color: ink, position: "relative" }}>
                {itx
                  ? (done
                      ? <I.Check size={15} strokeWidth={3} color={ink} style={{ filter: todayGlow !== "none" ? "drop-shadow(0 0.5px 1px rgba(0,0,0,0.5))" : "none" }} />
                      : <span style={{ fontSize: (todayTap.hint && todayTap.hint.length > 1) ? 12 : 15, fontWeight: 800, lineHeight: 1, color: ink, textShadow: todayGlow, fontVariantNumeric: "tabular-nums" }}>{todayTap.hint}</span>)
                  : (!compact && !fut && <span>{c.d}</span>)}
              </button>
            );
          })}
        </div>

        {!compact && (
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
      i: "🤝", t: "Собери команду",
      d: "Общие привычки с друзьями тоже идут в твой опыт — и так веселее.",
      cta: "Создать команду", action: () => navigate("team-create"),
      meta: "Привычки вместе",
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
var _bosBuddyCache = {};
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
        if (changed) setMembers(d.members);  // swap ONLY when something really changed
      }).catch(function () {});
    };
    load();
    var iv = setInterval(load, 25000);
    return function () { on = false; clearInterval(iv); };
  }, [code]);
  return members;
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
      <div style={{ padding: "2px 22px 26px", textAlign: "center", color: "var(--text)", position: "relative" }}>
        <div aria-hidden style={{ position: "absolute", top: -6, left: 0, right: 0, height: 150, background: "radial-gradient(circle at 50% 0%, " + accent + "30, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ width: 92, height: 92, position: "relative", animation: "achEmblem 0.55s cubic-bezier(0.34,1.56,0.64,1) 0.08s both" }}>
              <div aria-hidden style={{ position: "absolute", inset: -12, borderRadius: "50%", background: "radial-gradient(circle, " + accent + "55, transparent 70%)" }} />
              <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 24, background: "linear-gradient(180deg,#fffdf5,#fff3d3)", display: "grid", placeItems: "center", fontSize: 44, boxShadow: "inset 0 0 0 1.5px " + accent + "66, 0 10px 26px " + accent + "3d" }}>{ach.i}</div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: "#E0A500", textTransform: "uppercase", letterSpacing: 1.4, fontWeight: 800, marginTop: 14 }}>Достижение открыто</div>
          <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: "-0.5px", color: "var(--text)", marginTop: 3 }}>{ach.t}</div>
          {ach.d && <div style={{ fontSize: 13.5, color: "var(--text-3)", marginTop: 8, lineHeight: 1.5, padding: "0 6px", textWrap: "balance" }}>{ach.d}</div>}
          {ach.xp ? <div style={{ display: "inline-block", marginTop: 16, background: "linear-gradient(180deg,#FEDE34,#EF9F14)", color: "#4a3800", fontWeight: 700, fontSize: 14, borderRadius: 999, padding: "7px 16px", boxShadow: "0 4px 12px " + accent + "4d" }}>+{ach.xp} XP</div> : null}
          <button onClick={close} className="bos-btn" style={{ marginTop: 20 }}>Класс!</button>
        </div>
      </div>
    </BottomSheet>
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
  const emptyCell = isDark ? "rgba(255,255,255,0.13)" : "rgba(0,0,0,0.08)";
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
                        <span key={j} style={{ width: 16, height: 16, borderRadius: "30%", background: m.days[k] ? bosCellFill(accent, 1) : emptyCell, boxShadow: m.days[k] ? bosCellGlass(isDark) : "none" }} />
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
  const PAD = 16;                                       // keep the 24px thumb inside the groove

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
        <div style={{ position: "relative", width: 46, height: 46, flexShrink: 0, display: "grid", placeItems: "center" }}>
          <StateOrb size={44} tint={tint} intensity={isDark ? 1.25 : 1.08} />
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none" }}>
            <span key={idx} style={{ fontSize: 21, lineHeight: 1, filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.28))", animation: "bosFacePop 0.4s cubic-bezier(0.34,1.56,0.64,1) both" }}>{face}</span>
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
      <div style={{ marginTop: 10 }}>
        <div ref={trackRef}
          onPointerDown={(e) => { e.stopPropagation(); dragRef.current = true; try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {} setFromX(e.clientX); }}
          onPointerMove={(e) => { if (!dragRef.current) return; e.stopPropagation(); setFromX(e.clientX); }}
          onPointerUp={(e) => { e.stopPropagation(); if (dragRef.current) { dragRef.current = false; commit(); } }}
          onPointerCancel={() => { dragRef.current = false; }}
          style={{ position: "relative", height: 28, borderRadius: 999, background: trackBg, boxShadow: trackGlass, touchAction: "none", cursor: "pointer" }}>
          <div style={{ position: "absolute", top: "50%", left: "calc(" + PAD + "px + " + val + " * (100% - " + (2 * PAD) + "px))", width: 24, height: 24, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%, #fff, #eef0f3)", boxShadow: "0 2px 6px rgba(0,0,0,0.22), inset 0 0 0 0.7px rgba(0,0,0,0.05)", transform: "translate(-50%,-50%)", transition: dragRef.current ? "none" : "left 0.12s ease" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, padding: "0 2px", fontSize: 10.5, letterSpacing: 0.4, textTransform: "uppercase", color: endLabel, fontWeight: 600 }}>
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

  return (
    <>
      {/* «Готово» FLOATS (iOS edit-mode style, David): portal'd into the app viewport box (.page-stack,
          position:absolute inset:0) so it pins to the top-right corner over everything and never pushes
          the list down — it stays glued there through scroll until tapped to leave jiggle. (In-flow
          header + the «перетащи…» hint are gone — the jiggle itself signals the mode, like iOS home.) */}
      {mode && ReactDOM.createPortal(
        <button onClick={done} className="tap" data-haptic="selection" aria-label="Готово — выйти из режима перестановки" style={{
          position: "absolute", top: "max(calc(var(--bos-safe-top, 0px) + 12px), 56px)", right: 14, zIndex: 7000,
          border: 0, background: "#0a0a0a", color: "#fff", borderRadius: 999, padding: "9px 20px",
          fontSize: 14, fontWeight: 600, boxShadow: "0 8px 22px rgba(0,0,0,0.32)", cursor: "pointer",
          animation: "bosMenuPop 0.32s cubic-bezier(0.34,1.5,0.4,1) both",
        }}>Готово</button>,
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
      {/* «+ Добавить» tile — only in edit mode, only when the caller wires onAdd (home widget board).
         Not a draggable item; opens the «available widgets» sheet. */}
      {mode && onAdd && (
        <button onClick={onAdd} className="tap" data-haptic="selection" style={{
          marginTop: gap, width: "100%", borderRadius: 22, padding: "15px 16px",
          border: "1.5px dashed var(--line)", background: "transparent", color: "var(--text-3)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
          fontSize: 14, fontWeight: 600, cursor: "pointer", animation: "dimIn 0.2s ease both",
        }}>
          <span style={{ width: 26, height: 26, borderRadius: "50%", display: "grid", placeItems: "center",
            background: BOS_TILE_SHEEN + ", var(--surface-3)", boxShadow: bosTileGlass(false), color: "var(--text)" }}><I.Plus size={15} strokeWidth={2.5} /></span>
          {addLabel || "Добавить"}
        </button>
      )}
    </>
  );
}

/* The home widget CATALOGUE — one source of truth shared by the board (home_live), the add
   sheet, and the «Виджеты главного» settings screen (home_extra_live). `var` so it's global
   across the built files. id = the widgets[id] visibility flag; order lives in widgets.order. */
var BOS_HOME_WIDGETS = [
  { id: "hero",    t: "Подсказки",    d: "ИИ-сводка дня и аватар",   emoji: "✨" },
  { id: "level",   t: "Уровень",      d: "Прогресс и опыт",          emoji: "🏆" },
  { id: "week",    t: "Эта неделя",   d: "Недельная активность",     emoji: "📅" },
  { id: "team",    t: "Команды",      d: "Твои команды",             emoji: "👥" },
  { id: "mood",    t: "Состояние",    d: "Ежедневный чек-ин",        emoji: "💭" },
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

/* Bottom sheet listing the home widgets that are currently OFF — tap one to put it back on the
   home. Reads app.widgets live, so the list shrinks as you add (multi-add without reopening).
   `defs` = the full board widget catalogue [{ id, t, d, emoji }]; LIVE only. */
function AddWidgetSheetLive({ defs = [], dark = false }) {
  const app = (typeof useApp === "function") ? useApp() : null;
  const widgets = app?.widgets || {};
  const hidden = defs.filter((d) => widgets[d.id] === false);
  const add = (id) => { app?.setWidgets({ ...(app.widgets || {}), [id]: true }); if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (_) {} } };
  return (
    <div style={{ padding: "2px 18px 8px", color: "var(--text)" }}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.3px" }}>Добавить виджет</div>
        <div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 5 }}>Что вернуть на главную</div>
      </div>
      {hidden.length === 0 ? (
        <div style={{ textAlign: "center", padding: "22px 10px 30px", color: "var(--text-4)", fontSize: 13.5 }}>Все виджеты уже на главной 🎉</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {hidden.map((o) => (
            <button key={o.id} className="tap" data-haptic="selection" onClick={() => add(o.id)} style={{
              display: "flex", alignItems: "center", gap: 13, width: "100%", textAlign: "left",
              padding: 12, borderRadius: 18, border: 0, cursor: "pointer",
              background: dark ? "rgba(255,255,255,0.06)" : "var(--surface-3)", color: "var(--text)" }}>
              <span style={{ width: 40, height: 40, borderRadius: 13, display: "grid", placeItems: "center", fontSize: 20, flexShrink: 0,
                background: BOS_TILE_SHEEN + ", " + (dark ? "rgba(255,255,255,0.08)" : "#fff"), boxShadow: bosTileGlass(dark) }}>{o.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15.5, fontWeight: 600 }}>{o.t}</div>
                {o.d && <div style={{ fontSize: 12.5, color: "var(--text-4)", marginTop: 1 }}>{o.d}</div>}
              </div>
              <span style={{ width: 28, height: 28, borderRadius: "50%", display: "grid", placeItems: "center", flexShrink: 0, background: "#0a0a0a", color: "#fff" }}><I.Plus size={15} strokeWidth={2.5} /></span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateMenuLive({ open, onClose, anchorRef, navigate }) {
  const [pos, setPos] = React.useState(null);
  React.useEffect(() => {
    if (open && anchorRef && anchorRef.current) {
      const r = anchorRef.current.getBoundingClientRect();
      setPos({ right: Math.round(window.innerWidth - r.right), top: Math.round(r.bottom + 10) });
    }
  }, [open]);
  if (!open || !pos) return null;
  const items = [
    { emoji: "🌱", label: "Привычку", go: () => navigate("habit-settings", { mode: "create" }) },
    { emoji: "🎯", label: "Цель",     go: () => navigate("goal-settings", { mode: "create" }) },
    { emoji: "🤝", label: "Команду",  go: () => navigate("team-create", {}) },
  ];
  return ReactDOM.createPortal(
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 8000, background: "rgba(18,22,38,0.16)", animation: "dimIn 0.18s ease both" }}>
      <div role="menu" onClick={(e) => e.stopPropagation()} style={{
        position: "fixed", right: pos.right, top: pos.top, transformOrigin: "top right",
        animation: "bosMenuPop 0.34s cubic-bezier(0.34,1.5,0.4,1) both",
        minWidth: 212, padding: 7, borderRadius: 22,
        background: "rgba(255,255,255,0.74)",
        WebkitBackdropFilter: "blur(34px) saturate(180%)", backdropFilter: "blur(34px) saturate(180%)",
        border: "0.5px solid rgba(255,255,255,0.7)", boxShadow: "0 16px 44px rgba(20,30,60,0.26)",
      }}>
        {items.map((it, i) => (
          <button key={i} role="menuitem" data-haptic="selection" onClick={() => { onClose(); it.go(); }} className="tap" style={{
            display: "flex", alignItems: "center", gap: 13, width: "100%",
            padding: "12px 14px", border: 0, background: "transparent", borderRadius: 16,
            fontSize: 16, fontWeight: 600, color: "#0a0a0a", cursor: "pointer", textAlign: "left",
          }}>
            <span aria-hidden style={{ fontSize: 22, width: 26, textAlign: "center", lineHeight: 1 }}>{it.emoji}</span>
            {it.label}
          </button>
        ))}
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
    if (window.bosCloud && window.bosCloud.uid) {
      (window.bosCloud.inviteCode ? window.bosCloud.inviteCode() : window.bosCloud.uid()).then((code) => { if (on && code) setShareUrl((typeof bosInviteLink === "function") ? bosInviteLink(code) : (APP_URL + "?ref=" + code)); }).catch(() => {});
    }
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
function HeroAccountAvatarLive({ navigate, avatar, pct = 0, size = 60, isDark }) {
  const r = size / 2 - 2;              // ring radius (strokeWidth 2.5, ~1.25 margin each side)
  const C = 2 * Math.PI * r;
  const off = C * (1 - (pct || 0) / 100);
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
    </button>
  );
}

/* HomeHeroSwipe → live-only: the real new user's hero — page 1 ONLY (the demo's balance
   wheel / orbit 2nd page was removed). newbie (no habits) → "С чего начать" hints; else →
   AI-brief summary + action pills. The account avatar (XP ring) lives here — the main AI block. */
function HomeHeroSwipeLive({ navigate, doneCount, totalCount, ringPct, isDark }) {
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
    ? _liveBrief.pills.slice(0, 4) : null;
  const _pillsKey = _livePills ? _livePills.map(bosPillLabel).join("|") : "live";
  // XP-to-next-level percent for the minimalist avatar ring (today's progress lives in the
  // «Привычки» card + «Эта неделя», so the ring is freed for level progress — David's call).
  const _heroXp = (typeof bosLiveXPLive === "function") ? bosLiveXPLive(heroApp) : 0;
  const _heroPct = (((typeof bosLevelInfoLive === "function") ? bosLevelInfoLive(_heroXp) : null) || {}).pct || 0;

  const page1 = newbie ? (
    <div key="hints" style={{ position: "relative", padding: 16, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 13, alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div key={_homeSummary} style={{ fontSize: 14.5, fontWeight: 400, color: "var(--text)", lineHeight: 1.5, letterSpacing: "-0.2px", animation: _liveBrief ? "briefFade 0.5s ease both" : undefined }}><span style={{ display: "inline-block", verticalAlign: "-2px", marginRight: 6 }}><I.Sparkles size={14} color="#EF9F14" filled strokeWidth={0} /></span>{_liveBrief ? _homeSummary : "Расскажи о себе — и я подскажу, с каких привычек начать."}</div>
        </div>
        <HeroAccountAvatarLive navigate={navigate} avatar={heroApp?.avatar} pct={_heroPct} size={56} isDark={isDark} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {[
          { i: "🙋", t: "Рассказать о себе", go: () => navigate("ai-chat", { prompt: "Я хочу рассказать о себе — задай мне пару коротких вопросов и подскажи, с каких привычек начать." }) },
          { i: "➕", t: "Создать привычку",  go: () => navigate("habit-settings", { mode: "create" }) },
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
          <div key={_homeSummary} style={{ fontSize: 14.5, fontWeight: 400, color: "var(--text)", lineHeight: 1.5, letterSpacing: "-0.2px", animation: "briefFade 0.5s ease both" }}>
            <span style={{ display: "inline-block", verticalAlign: "-2px", marginRight: 6 }}><I.Sparkles size={14} color="#EF9F14" filled strokeWidth={0} /></span>{_homeSummary}
          </div>
        </div>
        <HeroAccountAvatarLive navigate={navigate} avatar={heroApp?.avatar} pct={_heroPct} size={64} isDark={isDark} />
      </div>
      <div key={_pillsKey} style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
        {(_livePills || [
          { i: "✨", t: "ИИ: спланируй день" },
          { i: "🔮", t: "Познай себя" },
          { i: "🧘🏼‍♀️", t: "Медитация 5 мин" },
          { i: "📖", t: "Открыть дневник" },
        ]).map((c, i) => (
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
  // Loading (null) AND loaded-empty ([]) → render NOTHING. No promissory skeleton, so the
  // section can never pop then collapse — it only ever appears with real teams in it.
  if (!list || !list.length) return null;
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
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-4)", padding: "4px 4px 8px" }}>Открытые команды рядом</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {list.map((t) => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--card)", borderRadius: 22, padding: 14, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
            <span style={{ width: 44, height: 44, borderRadius: 14, background: "var(--card-2)", display: "grid", placeItems: "center", fontSize: 24, flexShrink: 0 }}>{bosIcon(t.emblem || "✨", 24, t.accent)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15.5, fontWeight: 600, color: "var(--text)" }}>{t.name}</div>
              <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 2 }}>🌐 Открытая · {t.members} участ.</div>
            </div>
            <button onClick={() => join(t)} disabled={busy[t.id] || requested[t.id]} className="tap" style={{ flexShrink: 0, background: (busy[t.id] || requested[t.id]) ? "var(--card-2)" : "#0a0a0a", color: (busy[t.id] || requested[t.id]) ? "var(--text-3)" : "#fff", border: 0, borderRadius: 999, padding: "9px 16px", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>{requested[t.id] ? "Заявка отправлена" : busy[t.id] ? "…" : "Вступить"}</button>
          </div>
        ))}
      </div>
    </div>
  );
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
function HabitWeekStrip({ habit }) {
  // Same cell language as the month calendar (Э4 continuity): squircle, FLAT accent when done,
  // neutral track when empty, a subtle ring on today — so the week strip on the card reads as
  // the exact same «day = square» tile as the detail calendar.
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
        try { kids[i].animate([{ transform: "scale(1)" }, { transform: "scale(1.32)" }, { transform: "scale(1)" }], { duration: 440, delay: dist * 55, easing: "cubic-bezier(0.22,0.9,0.3,1.2)" }); } catch (e) {}
      }
    }
    prevDone.current = doneNow;
  }, [doneNow]);
  if (!habit) return null;
  var accent = bosHabitColor(habit);
  var log = habit.log || {};
  var doneFill = bosCellFill(accent, 1);   // SAME soft glossy fill as the month calendar (continuity)
  var empty = isDark ? "rgba(255,255,255,0.13)" : "rgba(0,0,0,0.08)";
  var ringC = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.34)";
  return (
    <div ref={stripRef} aria-hidden style={{ display: "flex", gap: 6 }}>
      {keys.map(function (k, i) {
        var fl = !!log[k];
        var sh = [fl ? bosCellGlass(isDark) : "", (k === todayK) ? ("0 0 0 1.5px " + ringC) : ""].filter(Boolean).join(", ") || "none";
        return <span key={i} style={{ width: 20, height: 20, borderRadius: "30%", flexShrink: 0, background: fl ? doneFill : empty, boxShadow: sh }} />;
      })}
    </div>
  );
}

/* Aggregate «Эта неделя» strip for the HOME — 7 cells Пн→Вс. A cell is filled (the SAME soft
   glass graphite as the per-habit strip) if ANY habit was closed that day; today carries a gold
   ring. Each cell shows weekday + date number. Display-only; reads the real per-habit date-log.
   The parent card taps → history. LIVE only. */
function HomeWeekStripLive({ habits = [], isDark }) {
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
  const col = (typeof hx === "string" && hx[0] === "#") ? hx : BOS_GREY;
  const sheen = "radial-gradient(125% 125% at 30% 24%, rgba(255,255,255,0.62), rgba(255,255,255,0.10) 44%, rgba(255,255,255,0) 62%)";
  const glass = "inset 0 1px 1px rgba(255,255,255,0.5), inset 0 -3px 5px rgba(0,0,0,0.20), 0 1px 2px rgba(0,0,0,0.12)";
  return {
    background: sheen + ", " + col,
    boxShadow: (selected ? "0 0 0 2px #fff, 0 0 0 4px " + col + ", " : "") + glass,
  };
}
/* THE colour picker — ONE component for привычки / цели / команды so the choice is pixel-identical
   everywhere (David: «определись с палитрой основной»). Custom wheel + Серый + Чёрный + the Apple
   palette (BOS_APPLE_COLORS — the habit colours David likes), every circle glassy (bosColorSwatch). */
function BosColorPickerLive({ value, onChange }) {
  const isHex = typeof value === "string" && value[0] === "#";
  const custom = isHex && value !== "#0a0a0a" && value !== BOS_GREY && !BOS_APPLE_COLORS.includes(value);
  const sheen = "radial-gradient(125% 125% at 30% 24%, rgba(255,255,255,0.62), rgba(255,255,255,0.10) 44%, rgba(255,255,255,0) 62%)";
  const glass = "inset 0 1px 1px rgba(255,255,255,0.5), inset 0 -3px 5px rgba(0,0,0,0.20), 0 1px 2px rgba(0,0,0,0.12)";
  const base = { width: 32, height: 32, borderRadius: "50%", border: 0, flexShrink: 0, cursor: "pointer", transition: "box-shadow 0.15s" };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, overflowX: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch", padding: "6px 6px" }}>
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

function EmojiPickerLive({ onPick, accent = "#0a0a0a", current }) {
  const { close } = useSheet();
  const [mode, setMode] = React.useState((typeof current === "string" && current.slice(0, 3) === "sf:") ? "symbol" : "emoji");
  const [cat, setCat] = React.useState(0);
  const pick = (e) => { if (onPick) onPick(e); if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (_) {} } close(); };
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
        <div style={{ width: 64, height: 64, borderRadius: 22, margin: "0 auto 12px", background: team?.accent || "#fef3c7", display: "grid", placeItems: "center", fontSize: 34 }}>{team?.emblem || "✨"}</div>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.3px" }}>Поделиться командой</div>
        <div style={{ fontSize: 13.5, color: "var(--text-3)", marginTop: 6, maxWidth: 290, marginInline: "auto", lineHeight: 1.45 }}>
          Вести привычки вместе — веселее, и за совместные привычки больше XP ✨
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 10, fontSize: 11.5, fontWeight: 600, color: "var(--text-3)", background: "var(--surface-3)", padding: "4px 11px", borderRadius: 999 }}>
          {isPublic ? "🌐 Открытая · ссылка ведёт прямо в команду" : "🔒 Приватная · войдут только по этой ссылке"}
        </div>
      </div>
      <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 10, background: "var(--surface-3)", borderRadius: 14, padding: "11px 8px 11px 14px" }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: "var(--text-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{link}</span>
        <button onClick={copyLink} className="tap" style={{ flexShrink: 0, border: 0, background: "#0a0a0a", color: "#fff", borderRadius: 999, padding: "8px 15px", fontSize: 12.5, fontWeight: 600 }}>{copied ? "Готово" : "Копировать"}</button>
      </div>
      <button onClick={copyLink} className="tap" style={{ width: "100%", marginTop: 12, border: 0, borderRadius: 999, padding: 14, background: "#0a0a0a", color: "#fff", fontSize: 15, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <span style={{ fontSize: 17, lineHeight: 1 }}>🔗</span> {copied ? "Ссылка скопирована" : "Скопировать ссылку"}
      </button>
      <button onClick={shareTelegram} className="tap" style={{ width: "100%", marginTop: 8, border: 0, borderRadius: 999, padding: 14, background: "#229ED9", color: "#fff", fontSize: 15, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <I.Send size={18}/> Поделиться в Telegram
      </button>
      <div style={{ height: "max(8px, var(--tg-bottom-inset, 0px))" }} />
    </div>
  );
}

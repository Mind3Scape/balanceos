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

/* PeopleMonthCalendar → live-only: always the REAL calendar (demo's frozen showcase date gone). */
function PeopleMonthCalendarLive({ people = [], dayFrac, label = "Календарь", granular = false, selPerson: selProp, onSelPerson }) {
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
  const daysInMonth = new Date(year, mIdx + 1, 0).getDate();
  const startWeekday = new Date(year, mIdx, 1).getDay();
  const isCurMonth = mIdx === CUR_M;
  const lastLogged = isCurMonth ? today : (mIdx > CUR_M ? 0 : daysInMonth);
  const future = (d) => mIdx > CUR_M || d > lastLogged;
  const pf = (pi, d) => (future(d) ? null : dayFrac(pi, d, mIdx));
  const allFrac = (d) => { if (future(d)) return null; const v = people.map((_, i) => pf(i, d)); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0; };
  const dayPct = (d) => (selPerson == null ? allFrac(d) : pf(selPerson, d));
  const track = isDark ? "rgba(255,255,255,0.13)" : "rgba(0,0,0,0.09)";
  const selColor = selPerson == null ? "#FEDE34" : (people[selPerson]?.color || "#FEDE34");
  const todayBg = isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.07)";
  const selRing = isDark ? "rgba(255,255,255,0.42)" : "rgba(0,0,0,0.28)";
  const chipBg = isDark ? "rgba(255,255,255,0.07)" : "var(--surface-3)";
  const chip = (active) => ({ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px 5px 6px", borderRadius: 999, background: active ? (isDark ? "#fff" : "#0a0a0a") : chipBg, color: active ? (isDark ? "#0a0a0a" : "#fff") : "var(--text-2)", border: 0, flexShrink: 0, fontSize: 13, fontWeight: active ? 700 : 500, whiteSpace: "nowrap", cursor: "pointer" });
  const weekday = ["Вс","Пн","Вт","Ср","Чт","Пт","Сб"];
  const cells = [...Array.from({ length: startWeekday }, (_, i) => ({ blank: true, key: "b" + i })), ...Array.from({ length: daysInMonth }, (_, i) => ({ d: i + 1, key: "d" + (i + 1) }))];
  const selActive = future(selDay) ? null : people.filter((_, i) => (pf(i, selDay) ?? 0) >= 0.5).length;
  const selAvg = future(selDay) ? null : Math.round((allFrac(selDay) || 0) * 100);
  const selName = (selPerson != null && people[selPerson]) ? people[selPerson].name : null;

  return (
    <>
      {label && <div className="section-label" style={{ marginTop: 22 }}>{label}</div>}
      <div style={{ background: "var(--card)", borderRadius: 22, padding: 16, marginTop: label ? 8 : 0, boxShadow: "var(--card-shadow)" }}>
        {!solo && (
          <div className="screen-scroll" style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 2, marginBottom: 14 }}>
            <button onClick={() => setSelPerson(null)} className="tap" style={chip(selPerson == null)}>
              <span style={{ width: 18, height: 18, borderRadius: "50%", background: isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.1)", display: "grid", placeItems: "center", fontSize: 10 }}>👥</span>
              Все
            </button>
            {people.map((m, i) => (
              <button key={i} onClick={() => setSelPerson(i)} className="tap" style={chip(selPerson === i)}>
                <span style={{ width: 18, height: 18, borderRadius: "50%", background: m.color, display: "grid", placeItems: "center", fontSize: 9, fontWeight: 700, color: "rgba(0,0,0,0.6)" }}>{m.initials}</span>
                {m.you ? "Ты" : (m.name || "").split(" ")[0]}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => setMIdx((m) => Math.max(0, m - 1))} className="tap" style={{ background: chipBg, border: 0, borderRadius: 999, width: 32, height: 32, display: "grid", placeItems: "center", color: "inherit", opacity: mIdx === 0 ? 0.35 : 1 }}><I.ChevronLeft size={16} /></button>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.3px" }}>{MONTHS[mIdx]} {year}</div>
          <button onClick={() => setMIdx((m) => Math.min(11, m + 1))} className="tap" style={{ background: chipBg, border: 0, borderRadius: 999, width: 32, height: 32, display: "grid", placeItems: "center", color: "inherit", opacity: mIdx === 11 ? 0.35 : 1 }}><I.ChevronRight size={16} /></button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginTop: 14 }}>
          {weekday.map((w, i) => <div key={i} style={{ textAlign: "center", fontSize: 10.5, fontWeight: 600, letterSpacing: 0.6, color: "var(--text-4)" }}>{w}</div>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginTop: 6 }}>
          {cells.map((c) => {
            if (c.blank) return <span key={c.key} aria-hidden style={{ aspectRatio: "1/1" }} />;
            const pct = dayPct(c.d);
            const fut = pct == null;
            const isToday = isCurMonth && c.d === today;
            const isSel = selDay === c.d;
            return (
              <button key={c.key} onClick={() => setSelDay(c.d)} className="tap" style={{ aspectRatio: "1/1", border: 0, borderRadius: "50%", padding: 0, display: "grid", placeItems: "center", position: "relative", fontSize: 13, fontWeight: isToday ? 700 : 500, cursor: "pointer", background: "transparent", color: fut ? "var(--text-4)" : (isDark ? "#fff" : "var(--text)") }}>
                {isToday && <span aria-hidden style={{ position: "absolute", width: "62%", aspectRatio: "1/1", borderRadius: "50%", background: todayBg }} />}
                {isSel && !isToday && <span aria-hidden style={{ position: "absolute", width: "66%", aspectRatio: "1/1", borderRadius: "50%", border: "1.5px solid " + selRing }} />}
                {fut ? <span aria-hidden style={{ position: "absolute", inset: "17%", borderRadius: "50%", border: "1px dashed " + (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)") }} />
                  : <TeamRing pct={pct} color={selColor} track={track} glow={pct === 1} />}
                <span style={{ position: "relative", zIndex: 1 }}>{c.d}</span>
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 14, paddingTop: 13, borderTop: "1px solid var(--line)", fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.45 }}>
          {future(selDay) ? `${MONTHS[mIdx]} ${selDay} — ещё впереди`
            : solo
              ? <span><b style={{ color: "var(--text)" }}>{MONTHS[mIdx]} {selDay}</b> · {(dayPct(selDay) || 0) > 0 ? "выполнено ✓" : "пропущено"}</span>
              : selPerson == null
                ? <span><b style={{ color: "var(--text)" }}>{MONTHS[mIdx]} {selDay}</b> · отметилось {selActive} из {people.length}{granular && selAvg != null ? ` · ${selAvg}%` : ""}</span>
                : <span><b style={{ color: "var(--text)" }}>{selName}</b> · {MONTHS[mIdx]} {selDay} · {granular ? `${Math.round((dayPct(selDay) || 0) * 100)}% привычек` : ((dayPct(selDay) || 0) > 0 ? "отмечался ✓" : "пропустил")}</span>}
        </div>
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
        <XPRewardCard amount={150} reason="когда друг начнёт пользоваться приложением" dark={dark} circleNow={friends.length} circleGoal={_nextMile.n} circleBonus={_nextMile.bonus} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.tile, borderRadius: 14, padding: "11px 14px", marginTop: 14 }}>
        <span style={{ fontSize: 16 }}>🔗</span>
        <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
          <div style={{ fontSize: 11, color: C.sub, fontWeight: 600 }}>Твоя личная ссылка</div>
          <div style={{ fontSize: 13.5, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>{("" + shareUrl).replace(/^https?:\/\//, "")}</div>
        </div>
        <button onClick={copyLink} className="tap" style={{ background: copied ? "#34C759" : (dark ? "#fff" : "#0a0a0a"), color: copied ? "#fff" : (dark ? "#0a0a0a" : "#fff"), border: 0, borderRadius: 999, padding: "7px 14px", fontSize: 13, fontWeight: 600, transition: "background 0.2s", whiteSpace: "nowrap" }}>{copied ? "Скопировано ✓" : "Копировать"}</button>
      </div>

      {friends.length > 0 && (<>
      <div style={{ fontSize: 12, color: C.sub, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, margin: "20px 0 12px" }}>Твой круг</div>
      <div style={{ display: "flex", gap: 14, overflowX: "auto", margin: "0 -20px", padding: "0 20px 4px", scrollbarWidth: "none" }}>
        {friends.map((p, i) => (
          <button key={i} onClick={shareLink} className="tap" data-no-haptic style={{ background: "transparent", border: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 7, flexShrink: 0, width: 56, color: C.text }}>
            <span style={{ width: 54, height: 54, borderRadius: "50%", background: p.c, display: "grid", placeItems: "center", fontSize: 19, fontWeight: 700, color: "rgba(0,0,0,0.55)" }}>{p.i}</span>
            <span style={{ fontSize: 12, color: C.sub, maxWidth: 56, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
          </button>
        ))}
      </div>

      <div style={{ height: 1, background: C.line, margin: "18px 0" }} />
      </>)}

      {/* ONE clear, labelled primary action — opens Telegram's native "forward to a
          contact" picker with the bot invite link (was two icon-only circles that read
          as blank black buttons). */}
      <button onClick={shareLink} className="tap" style={{
        width: "100%", marginTop: friends.length > 0 ? 4 : 18, border: 0, borderRadius: 16, padding: "15px 16px",
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
function HabitInviteBannerLive({ amount = 75 }) {
  const ink = "#0a0a0a", inkSub = "rgba(0,0,0,0.62)";
  const faces = [
    { f: "🧑🏻", ang: -68, rad: 54, sz: 27 },
    { f: "👩🏽", ang: -18, rad: 36, sz: 23 },
    { f: "🧔🏾", ang: 26, rad: 57, sz: 25 },
  ];
  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 22, padding: "16px 17px",
      background: "linear-gradient(135deg, #FEDE34, #EF9F14)", color: ink,
      boxShadow: "0 12px 30px rgba(254,222,52,0.34)" }}>
      {/* Orbits + memoji — the «вместе» cue. */}
      <div aria-hidden style={{ position: "absolute", right: -30, top: -34, width: 150, height: 150, pointerEvents: "none" }}>
        <div style={{ position: "absolute", inset: 16, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.4)" }} />
        <div style={{ position: "absolute", inset: 42, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.5)" }} />
        {faces.map((p, i) => {
          const a = p.ang * Math.PI / 180, cx = 75 + p.rad * Math.cos(a), cy = 75 + p.rad * Math.sin(a);
          return (
            <span key={i} style={{ position: "absolute", left: cx - p.sz / 2, top: cy - p.sz / 2, width: p.sz, height: p.sz, borderRadius: "50%",
              background: "rgba(255,255,255,0.94)", display: "grid", placeItems: "center", fontSize: p.sz * 0.62,
              boxShadow: "0 2px 6px rgba(0,0,0,0.16)" }}>{p.f}</span>
          );
        })}
      </div>
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

function ShareHabitSheetLive({ habit, dark = false }) {
  const { close } = useSheet();
  const APP_URL = (typeof bosInviteLink === "function") ? bosInviteLink(null) : "https://t.me/BalanceOS8_bot";
  const [shareUrl, setShareUrl] = React.useState(APP_URL);
  React.useEffect(() => {
    let on = true;
    if (window.bosCloud && window.bosCloud.uid) {
      (window.bosCloud.inviteCode ? window.bosCloud.inviteCode() : window.bosCloud.uid()).then((code) => { if (on && code) setShareUrl((typeof bosInviteLink === "function") ? bosInviteLink(code) : (APP_URL + "?ref=" + code)); }).catch(() => {});
    }
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
  const _FCOLORS = ["#e8c8a8", "#a8b9d4", "#d4b8e8", "#a8d4e8", "#b8e8c8", "#e8b8d4", "#d4c8e8"];
  const [friends, setFriends] = React.useState([]);
  React.useEffect(() => {
    if (!(window.bosCloud && window.bosCloud.enabled())) return;
    let on = true;
    try {
      window.bosCloud.invitedPeople().then((list) => {
        if (!on || !Array.isArray(list)) return;
        setFriends(list.map((p, idx) => {
          const nm = (p && p.username) ? p.username : "Друг";
          return { name: nm, i: nm.charAt(0).toUpperCase(), c: _FCOLORS[idx % _FCOLORS.length], on: false };
        }));
      }).catch(() => {});
    } catch (e) {}
    return () => { on = false; };
  }, []);
  const toggleF = (idx) => setFriends(f => f.map((x, i) => i === idx ? { ...x, on: !x.on } : x));
  const targets = [{ e: "💬", t: "Сообщения" }, { e: "🔗", t: "Ссылка" }];
  return (
    <div style={{ padding: "2px 20px 0", color: C.text }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: C.tile, display: "grid", placeItems: "center", fontSize: 30, margin: "0 auto 10px" }}>{bosIcon(habit?.emoji || "✨", 30, habit?.color)}</div>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.3px" }}>Позови друга</div>
        <div style={{ fontSize: 14, color: C.sub, marginTop: 3, lineHeight: 1.4 }}>«{habit?.name || "Привычка"}» вместе — больше XP. Отправь ссылку, и друг присоединится.</div>
      </div>

      <div style={{ marginTop: 16 }}>
        <HabitInviteBannerLive amount={75} />
      </div>

      <div style={{ fontSize: 12, color: C.sub, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, margin: "22px 0 12px" }}>Делать вместе</div>
      {friends.length === 0 ? (
        <div style={{ fontSize: 13.5, color: C.sub, lineHeight: 1.45, padding: "2px 2px 4px" }}>Пока некого позвать — пригласи друга по ссылке ниже.</div>
      ) : (
      <div style={{ display: "flex", gap: 14, overflowX: "auto", margin: "0 -20px", padding: "0 20px 4px", scrollbarWidth: "none" }}>
        {friends.map((p, i) => (
          <button key={i} className="tap" data-no-haptic onClick={() => toggleF(i)} style={{ background: "transparent", border: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 7, flexShrink: 0, width: 56, color: C.text }}>
            <span style={{ position: "relative", width: 54, height: 54, borderRadius: "50%", background: p.c, display: "grid", placeItems: "center", fontSize: 19, fontWeight: 700, color: "rgba(0,0,0,0.55)", opacity: p.on ? 1 : 0.45, transition: "opacity 0.2s" }}>
              {p.i}
              {p.on && <span style={{ position: "absolute", right: -2, bottom: -2, width: 20, height: 20, borderRadius: "50%", background: "#34c759", border: "2px solid " + C.ring, display: "grid", placeItems: "center" }}><I.Check size={11} strokeWidth={3} color="#fff" /></span>}
            </span>
            <span style={{ fontSize: 12, color: C.sub }}>{p.name}</span>
          </button>
        ))}
        <button className="tap" onClick={shareLink} style={{ background: "transparent", border: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 7, flexShrink: 0, width: 56, color: C.sub }}>
          <span style={{ width: 54, height: 54, borderRadius: "50%", border: "1.5px dashed " + C.sub, display: "grid", placeItems: "center" }}><I.Plus size={20} /></span>
          <span style={{ fontSize: 12 }}>Позвать</span>
        </button>
      </div>
      )}

      <div style={{ height: 1, background: C.line, margin: "18px 0" }} />

      <button onClick={shareLink} className="tap" style={{
        width: "100%", border: 0, borderRadius: 999, padding: 15,
        background: "#229ED9", color: "#fff", fontSize: 15.5, fontWeight: 600,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
      }}>
        <I.Send size={18} /> Поделиться в Telegram
      </button>

      <button className="tap" onClick={close} style={{ width: "100%", marginTop: 22, background: dark ? "#fff" : "#0a0a0a", color: dark ? "#0a0a0a" : "#fff", border: 0, borderRadius: 999, padding: 15, fontSize: 15, fontWeight: 600 }}>Готово</button>
    </div>
  );
}

/* MoodWidget → live-only: real per-day mood trail (Пн→Вс), real streak chip + XP copy.
   No demo numeric-days showcase, no fresh-user empty state (live always has the trail). */
// LIVE daily state CHECK-IN prompt (David: once a day, in-app card — no push).
// Sits ABOVE habits when today's state isn't logged yet; one tap on a mood orb logs
// it (setMood + setDayMoods, keyed by the real day) and the slot flips to the widget.
// Flush (no own margin/radius/shadow) so it drops cleanly into a SwipeRow wrapper.
function StatePromptLive({ app, isDark }) {
  const moods = (typeof MOOD_OPTIONS !== "undefined") ? MOOD_OPTIONS : [];
  const log = (i) => {
    if (!app) return;
    const dayKey = (typeof bosTodayKey === "function") ? bosTodayKey() : new Date().toISOString().slice(0, 10);
    app.setMood && app.setMood(moods[i]);
    app.setDayMoods && app.setDayMoods({ ...(app.dayMoods || {}), [dayKey]: i });
    if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} }
  };
  const bg = isDark ? "linear-gradient(160deg, #1a1a1d 0%, #0d0d10 100%)" : "#ffffff";
  const titleColor = isDark ? "#fff" : "var(--text)";
  const labelMuted = isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.5)";
  const subMuted = isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.55)";
  return (
    <div style={{ width: "100%", background: bg, padding: 18, position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ fontSize: 11, color: labelMuted, textTransform: "uppercase", letterSpacing: 1.4, fontWeight: 600 }}>Отметь состояние</div>
        <span style={{ fontSize: 10, fontWeight: 700, color: isDark ? "#9fd5a8" : "#3f7a46", background: "rgba(90,168,90,0.16)", borderRadius: 999, padding: "2px 8px" }}>+5 XP</span>
      </div>
      <div style={{ fontFamily: "var(--bos-title-font)", fontSize: 23, fontWeight: 600, lineHeight: 1.12, letterSpacing: "-0.5px", marginTop: 5, color: titleColor }}>Как ты сейчас?</div>
      <div style={{ fontSize: 12.5, color: subMuted, marginTop: 4 }}>Один тап — и день записан. Так растёт серия.</div>
      <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "space-between" }}>
        {moods.map((m, i) => (
          <button key={i} className="tap" data-no-haptic onClick={() => log(i)} title={m.t} aria-label={m.t}
            style={{ flex: 1, background: "transparent", border: 0, padding: 0, display: "grid", placeItems: "center", cursor: "pointer" }}>
            <span style={{ position: "relative", width: 46, height: 46, display: "grid", placeItems: "center" }}>
              <MiniOrb size={46} tint={tintFromMood(m.c)} style={{ position: "absolute", inset: 0 }} />
              <span style={{ position: "relative", fontSize: 23, lineHeight: 1, filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,0.22))" }}>{m.i}</span>
            </span>
          </button>
        ))}
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

/* HomeHeroSwipe → live-only: the real new user's hero — page 1 ONLY (the demo's balance
   wheel / orbit 2nd page was removed). newbie (no habits) → "С чего начать" hints; else →
   AI-brief summary + action pills. Avatar ring follows the mood orb. No swipe deck. */
function HomeHeroSwipeLive({ navigate, doneCount, totalCount, ringPct, isDark }) {
  const [ringShown, setRingShown] = React.useState(0);
  React.useEffect(() => { const t = setTimeout(() => setRingShown(ringPct), 80); return () => clearTimeout(t); }, [ringPct]);
  const heroApp = useApp ? useApp() : null;
  const mood = heroApp?.mood;
  const moodTint = (mood && typeof tintFromMood === "function") ? tintFromMood(mood.c) : null;
  // Live newbie = a real Telegram user who just signed in and has no habits yet.
  const newbie = (heroApp?.habits?.length || 0) === 0;
  const chipBg   = isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.85)";
  const chipBd   = isDark ? "0" : "1px solid rgba(0,0,0,0.05)";
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

  const page1 = newbie ? (
    <div key="hints" style={{ position: "relative", padding: 16, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 13, alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1.2, display: "inline-flex", alignItems: "center", gap: 5 }}>
            <I.Sparkles size={12} color="#E0A500" filled strokeWidth={0}/> С чего начать
          </div>
          <div key={_homeSummary} style={{ fontSize: 13.5, color: "var(--text-2)", marginTop: 3, lineHeight: 1.4, letterSpacing: "-0.1px", animation: _liveBrief ? "briefFade 0.5s ease both" : undefined }}>{_liveBrief ? _homeSummary : "Расскажи о себе — и я подскажу, с каких привычек начать."}</div>
        </div>
        <button onClick={() => navigate("profile")} className="tap" title="Открыть профиль"
          style={{ flexShrink: 0, position: "relative", width: 54, height: 54, background: "transparent", border: 0, padding: 0, cursor: "pointer" }}>
          <svg width="54" height="54" viewBox="0 0 54 54" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
            <circle cx="27" cy="27" r="23" stroke={ringBg} strokeWidth="3" fill="none"/>
            <circle cx="27" cy="27" r="23" stroke="#FEDE34" strokeWidth="3" fill="none" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 23} strokeDashoffset={2 * Math.PI * 23 * (1 - ringShown)}
              style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.22,0.61,0.36,1)" }}/>
          </svg>
          <HeroOrbFace avatar={heroApp?.avatar} inset={5} size={44} moodTint={moodTint} />
        </button>
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
            background: chipBg, border: chipBd,
            borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 6,
          }}><span>{c.i}</span>{c.t}</button>
        ))}
      </div>
    </div>
  ) : (
    <div key="quote" style={{ position: "relative", height: "100%", padding: 18, boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1.2, display: "inline-flex", alignItems: "center", gap: 5 }}>
            <I.Sparkles size={12} color="#E0A500" filled strokeWidth={0}/> Подсказки для тебя
          </div>
          <div key={_homeSummary} style={{ fontSize: 14, color: "var(--text-2)", marginTop: 5, lineHeight: 1.42, letterSpacing: "-0.1px", animation: "briefFade 0.5s ease both" }}>
            {_homeSummary}
          </div>
        </div>
        <button onClick={() => navigate("profile")} className="tap" title="Открыть профиль"
          style={{ flexShrink: 0, position: "relative", width: 72, height: 72, background: "transparent", border: 0, padding: 0, cursor: "pointer" }}>
          <svg width="72" height="72" viewBox="0 0 72 72" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
            <circle cx="36" cy="36" r="32" stroke={ringBg} strokeWidth="3.5" fill="none"/>
            <circle cx="36" cy="36" r="32" stroke="#FEDE34" strokeWidth="3.5" fill="none"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 32}
              strokeDashoffset={2 * Math.PI * 32 * (1 - ringShown)}
              style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.22,0.61,0.36,1)" }}/>
          </svg>
          <HeroOrbFace avatar={heroApp?.avatar} inset={6} size={60} moodTint={moodTint} />
          <div style={{
            position: "absolute", bottom: -2, right: -4, background: "#0a0a0a", color: "#FEDE34",
            fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 999, border: "2px solid " + (isDark ? "#0a0a0a" : "#fff"),
          }}>{doneCount}/{totalCount}</div>
        </button>
      </div>
      <div key={_pillsKey} style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: "auto", paddingTop: 12, paddingBottom: 14 }}>
        {(_livePills || [
          { i: "✨", t: "ИИ: спланируй день" },
          { i: "🔮", t: "Познай себя" },
          { i: "🧘🏼‍♀️", t: "Медитация 5 мин" },
          { i: "📖", t: "Открыть дневник" },
        ]).map((c, i) => (
          <button key={i} onClick={() => bosRoutePill(navigate, c)} className="tap" style={{
            padding: "6px 12px", fontSize: 12, color: "var(--text-2)",
            background: chipBg, border: chipBd,
            borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 6,
            animation: _livePills ? ("briefPop 0.45s cubic-bezier(0.22,0.9,0.3,1.2) both " + (i * 0.06) + "s") : undefined,
          }}><span>{bosPillIcon(c)}</span>{bosPillLabel(c)}</button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{
      background: cardBg,
      border: cardBd,
      borderRadius: 22, position: "relative", overflow: "hidden",
      boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
    }}>
      <div style={{ display: "flex", width: "100%", minHeight: 196 }}>
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
  if (!habit) return null;
  var accent = bosHabitColor(habit);
  var log = habit.log || {};
  var keys = bosWeekKeys();
  var fill = "linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0) 72%), " + accent;
  var empty = (accent[0] === "#" && accent.length === 7) ? accent + "1a" : "rgba(120,120,128,0.12)"; // ~10% same hue
  return (
    <div aria-hidden style={{ display: "flex", gap: 6 }}>
      {keys.map(function (k, i) {
        return <span key={i} style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, background: log[k] ? fill : empty }} />;
      })}
    </div>
  );
}

// Names for the live Apple palette (the create-screen picker label). Includes the old
// core #0A84FF so habits made before the v235 palette still read a colour name.
const BOS_APPLE_COLOR_NAMES = { "#A06A86": "Сливовый", "#F0564C": "Коралловый", "#E08AC4": "Орхидея", "#E59B9B": "Лосось", "#CBA98D": "Глина", "#F0A24E": "Оранжевый", "#19B89B": "Мятный", "#54C3E4": "Голубой", "#4A6CD6": "Синий", "#84A4B8": "Грифельный", "#7F9AF2": "Барвинок", "#8676E6": "Индиго",
  /* legacy system hues — kept so habits made before the Journal palette still read a name */
  "#34C759": "Зелёный", "#007AFF": "Синий", "#0A84FF": "Синий", "#FF9500": "Оранжевый", "#AF52DE": "Фиолетовый", "#FF2D55": "Розовый", "#30B0C7": "Бирюзовый", "#5856D6": "Индиго", "#FF3B30": "Красный", "#FFCC00": "Жёлтый" };

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
/* SF-Symbols-style monochrome icon set (our hand-rolled `I` glyphs). Picked by name and
   stored on the habit/goal/team as "sf:<Name>", then rendered via bosIcon() in the chosen
   accent — the Apple-Journal way: a tasteful FIXED set, not an infinite list. David:
   «слева ч/б iOS-символы, справа цветные эмодзи». */
const BOS_SYMBOLS = ["Heart", "Dumbbell", "Foot", "Book", "Moon", "Sparkles", "Target", "Trophy", "Flag", "Bolt", "Bulb", "Mic", "Play", "Compass", "MapPin", "Globe", "Calendar", "Clock", "Bell", "Briefcase", "Wallet", "Users", "Phone", "Mail", "MessageCircle", "Home", "ChartBar", "Eye"];

// Render a habit/goal/team icon. A "sf:<Name>" sentinel → the monochrome glyph in `color`;
// anything else (a normal emoji string) is returned UNCHANGED, so existing data and the
// DEMO stay pixel-identical. Used at every live icon site so a chosen symbol shows up
// everywhere, never as raw "sf:…" text.
function bosIcon(val, size, color) {
  if (typeof val === "string" && val.slice(0, 3) === "sf:") {
    var Cmp = (window.I || {})[val.slice(3)];
    if (Cmp) return React.createElement(Cmp, { size: size || 22, color: color || "currentColor", strokeWidth: 2 });
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
      {/* Toggle — monochrome iOS-style СИМВОЛЫ (left) / colourful ЭМОДЗИ (right), David. */}
      <div style={{ display: "flex", gap: 4, padding: 3, background: "var(--surface-3)", borderRadius: 12, marginBottom: 12 }}>
        {[["symbol", "Символы"], ["emoji", "Эмодзи"]].map((m) => (
          <button key={m[0]} className="tap" data-no-haptic onClick={() => setMode(m[0])}
            style={{ flex: 1, height: 34, borderRadius: 9, border: 0, fontSize: 13.5, fontWeight: 600, cursor: "pointer",
              background: mode === m[0] ? "#fff" : "transparent", color: mode === m[0] ? "#0a0a0a" : "var(--text-3)",
              boxShadow: mode === m[0] ? "0 1px 3px rgba(0,0,0,0.10)" : "none", transition: "background 0.15s" }}>{m[1]}</button>
        ))}
      </div>
      {mode === "symbol" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6, maxHeight: 264, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "2px 0" }}>
          {BOS_SYMBOLS.map((nm, i) => {
            var Cmp = (window.I || {})[nm];
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

  const SIZE = 30, R = 11, CX = SIZE / 2, C = 2 * Math.PI * R;   // == standard .check-btn (30px) so the DONE tick matches every other card (David: «один размер»)
  const track = "rgba(10,10,10,0.10)";
  let body;
  if (isDone) {
    body = (
      <span style={{ width: SIZE, height: SIZE, borderRadius: "50%", background: accent, display: "grid", placeItems: "center" }}>
        <I.Check size={18} strokeWidth={2.6} color="#fff" />
      </span>
    );
  } else if (goal <= 7) {
    const pitch = 360 / goal, gap = Math.min(22, pitch * 0.34);
    const pt = (deg) => { const a = deg * Math.PI / 180; return [(CX + R * Math.cos(a)).toFixed(2), (CX + R * Math.sin(a)).toFixed(2)]; };
    const segs = [];
    for (let i = 0; i < goal; i++) {
      const a0 = -90 + i * pitch + gap / 2, a1 = -90 + (i + 1) * pitch - gap / 2;
      const p0 = pt(a0), p1 = pt(a1);
      segs.push(<path key={i} d={"M " + p0[0] + " " + p0[1] + " A " + R + " " + R + " 0 0 1 " + p1[0] + " " + p1[1]} fill="none" stroke={i < count ? accent : track} strokeWidth="3" strokeLinecap="round" />);
    }
    body = (
      <span style={{ position: "relative", width: SIZE, height: SIZE, display: "grid", placeItems: "center" }}>
        <svg width={SIZE} height={SIZE} viewBox={"0 0 " + SIZE + " " + SIZE} style={{ position: "absolute", inset: 0 }}>{segs}</svg>
        <span style={{ fontSize: 12, fontWeight: 700, color: count > 0 ? accent : "var(--text-4)", fontVariantNumeric: "tabular-nums" }}>{count}</span>
      </span>
    );
  } else {
    body = (
      <span style={{ position: "relative", width: SIZE, height: SIZE, display: "grid", placeItems: "center" }}>
        <svg width={SIZE} height={SIZE} viewBox={"0 0 " + SIZE + " " + SIZE} style={{ position: "absolute", inset: 0 }}>
          <circle cx={CX} cy={CX} r={R} fill="none" stroke={track} strokeWidth="3" />
          <circle cx={CX} cy={CX} r={R} fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" strokeDasharray={C.toFixed(2)} strokeDashoffset={(C * (1 - count / goal)).toFixed(2)} transform={"rotate(-90 " + CX + " " + CX + ")"} />
        </svg>
        <span style={{ fontSize: 12, fontWeight: 700, color: count > 0 ? accent : "var(--text-4)", fontVariantNumeric: "tabular-nums" }}>{count}</span>
      </span>
    );
  }
  return (
    <div style={{ position: "relative", flexShrink: 0, display: "grid", placeItems: "center" }}>
      <XpFloat tick={tick} xp={xp} anchorRef={btnRef} />
      <button ref={btnRef} className="tap hit44" data-no-haptic onClick={onClick}
        onPointerDown={startLP} onPointerUp={endLP} onPointerLeave={endLP} onPointerCancel={endLP}
        aria-label={"Прогресс " + count + " из " + goal + ", тап +1, удержание −1"}
        style={{ border: 0, background: "transparent", padding: 0, display: "grid", placeItems: "center", cursor: "pointer" }}>
        {body}
      </button>
    </div>
  );
}

/* iOS-26 Liquid Glass «Изменить» — one standardised edit pill for habit / goal / team
   detail headers (David: «классная кнопка по стандартам iOS 26»). Frosted translucent
   capsule: backdrop blur + bright specular edge + layered soft shadow. */
function EditGlassButtonLive({ onClick, label = "Изменить" }) {
  return (
    <button onClick={onClick} className="tap" data-haptic="selection" aria-label={label}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: 999,
        border: "0.5px solid rgba(255,255,255,0.85)", background: "rgba(255,255,255,0.62)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)", backdropFilter: "blur(20px) saturate(180%)",
        color: "var(--text)", fontSize: 14, fontWeight: 600, letterSpacing: "-0.2px", lineHeight: 1, cursor: "pointer",
        boxShadow: "0 1px 1px rgba(0,0,0,0.04), 0 6px 16px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.9)",
      }}>
      <I.Pencil size={14} strokeWidth={2} /> {label}
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

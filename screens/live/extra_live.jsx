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
   declarations in this file are exactly: HabitDetailLive, GoalDetailLive, MoodLive,
   JournalLive, AIChatLive. */

/* HABIT DETAIL — LIVE. Real per-habit statistics from the check-in log (h.log =
   {dateKey:true}). Opened by tapping a habit on Home/Habits. Numbers derive from the
   real log so they never flicker; "Изменить" opens the edit form; Back returns to the
   exact tab we came from (params.from). */
function HabitDetailLive() {
  const { navigate, params } = useNav();
  const app = (typeof useApp === "function") ? useApp() : null;
  const { open: openSheet } = (typeof useSheet === "function") ? useSheet() : { open: () => {} };
  const back = params?.from || "habits";
  const seed = params?.habit || { id: 0, emoji: "🏃🏼‍♀️", name: "Утренняя пробежка", streak: 12 };
  // Live copy from the shared store so streak / done reflect taps made elsewhere.
  const h = (app?.habits && app.habits.find((x) => x.id === seed.id)) || seed;
  const isDark = app?.themeOverride === "dark";
  const Count = (typeof CountUp !== "undefined") ? CountUp : ({ value }) => value;

  // Real stats from the check-in log (h.log = {dateKey:true}).
  const _log = h.log || {};
  const _logDays = Object.keys(_log).filter((k) => _log[k] && /^\d{4}-\d{2}-\d{2}$/.test(k)).sort();
  const _bestRun = (days) => { if (!days.length) return 0; let b = 1, c = 1; for (let i = 1; i < days.length; i++) { const diff = Math.round((new Date(days[i] + "T00:00:00") - new Date(days[i - 1] + "T00:00:00")) / 86400000); if (diff === 1) { c++; if (c > b) b = c; } else if (diff > 1) c = 1; } return b; };
  const streak = (typeof bosStreak === "function") ? bosStreak(_log) : (h.streak || 0);
  const best   = Math.max(streak, _bestRun(_logDays));
  const total  = _logDays.length;

  // Neutral by default (cohesive with the gray tiles outside); the habit's own
  // colour only if the user picked one — it tints the tile and fills the grid.
  const tileBg  = h.color ? h.color + "26" : (isDark ? "rgba(255,255,255,0.06)" : "var(--surface-3)");

  // Live has no real per-friend logs client-side → always the solo REAL view (your own
  // log), never invented friend standings. People + per-day completion feed the shared
  // PeopleMonthCalendar (same calendar the team uses → one consistent look).
  const calPeople = [{ name: "Ты", initials: "Я", color: h.color || "#FEDE34", you: true }];
  const _calYear = new Date().getFullYear();
  const habitFrac = (pi, d, mi) => {
    // The REAL calendar — did you actually check this habit on that date (h.log)?
    const k = _calYear + "-" + String(mi + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
    return _log[k] ? 1 : 0;
  };

  const card = isDark
    ? { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }
    : { background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" };

  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader dark={isDark} title="" onBack={() => navigate(back)} right={
        <EditGlassButtonLive onClick={() => navigate("habit-settings", { mode: "edit", habit: h })} />
      } />

      {/* Hero — neutral tile (or the habit's soft colour), like the lists outside */}
      <div style={{ textAlign: "center", padding: "6px 0 22px" }}>
        <div style={{ width: 88, height: 88, borderRadius: 22, margin: "0 auto", background: tileBg, display: "grid", placeItems: "center", boxShadow: isDark ? "inset 0 1px 0 rgba(255,255,255,0.08)" : "inset 0 1px 0 rgba(255,255,255,0.6)" }}>
          <span style={{ fontSize: 44 }}>{bosIcon(h.emoji, 40, h.color)}</span>
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, color: "var(--text)", marginTop: 16, letterSpacing: "-0.5px" }}>{h.name}</div>
        <div style={{ fontSize: 13, color: "var(--text-4)", marginTop: 3 }}>
          Ежедневно{h.duration ? ` · ${h.duration} мин` : ""}{h.done ? " · выполнено сегодня" : ""}
        </div>
      </div>

      {/* Stat cards — count up on open */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[
          { l: "Серия", v: streak, suf: "д", i: "🔥" },
          { l: "Лучшая", v: best, suf: "д", i: "🏆" },
          { l: "Всего", v: total, suf: "", i: "📊" },
        ].map((s, i) => (
          <div key={i} style={{ ...card, borderRadius: 22, padding: "14px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 17 }}>{s.i}</div>
            <div style={{ fontSize: 21, fontWeight: 700, marginTop: 5, letterSpacing: "-0.5px" }}><Count value={s.v} />{s.suf}</div>
            <div style={{ fontSize: 10.5, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, marginTop: 3 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Per-habit calendar — the SAME full month calendar the team uses (paged, dated),
         so the whole app reads one way. Live = your own real days. */}
      <PeopleMonthCalendarLive people={calPeople} dayFrac={habitFrac} label="Календарь привычки" />

      {/* Insight — neutral surface, streak-driven copy */}
      <div className="section-label" style={{ marginTop: 22 }}>Инсайт</div>
      <div style={{ ...card, borderRadius: 22, padding: 14, marginTop: 8, display: "flex", gap: 10 }}>
        <I.Sparkles size={18} color={h.color || (isDark ? "#fff" : "#0a0a0a")} />
        <div style={{ flex: 1, fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>
          {streak >= 7
            ? `Серия уже ${streak} дней — это работает на автопилоте. Не разрывай цепочку сегодня.`
            : `Ещё ${Math.max(1, 7 - streak)} дн. — и привычка станет автоматической. Сейчас самый важный момент.`}
        </div>
      </div>

      {/* Actions */}
      <button onClick={() => app?.toggleHabit && app.toggleHabit(h.id)} className="bos-btn" style={{ marginTop: 22, background: h.done ? (isDark ? "rgba(255,255,255,0.1)" : "var(--surface-3)") : undefined, color: h.done ? "var(--text-2)" : undefined }}>
        {h.done ? "✓ Выполнено сегодня" : "Отметить выполненной"}
      </button>
      {/* Invite a friend — make the habit shared right from INSIDE it, not only from the
          settings menu (David: «удобнее звать друга из самой привычки»). Tinted secondary
          action in the habit's own colour; opens the same ShareHabitSheetLive. */}
      <button onClick={() => openSheet(<ShareHabitSheetLive habit={h} dark={isDark} />)} className="tap" data-haptic="selection"
        style={{ marginTop: 10, width: "100%", background: (h.color || "#0a0a0a") + "14", border: 0, padding: "14px", borderRadius: 16, color: h.color || "var(--text)", fontSize: 15, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <I.Users size={18}/> Позвать друга
      </button>
    </div>
  );
}

/* GOAL DETAIL — LIVE. Progress ring, the habits it's built from (cross-linked into
   their own stats), a pace hint, and a +1 to nudge progress. Linked-habit streaks are
   ALWAYS the real bosStreak(h.log). Back returns to the origin tab (params.from). */
function GoalDetailLive() {
  const { navigate, params } = useNav();
  const app = (typeof useApp === "function") ? useApp() : null;
  const back = params?.from || "habits";
  const seed = params?.goal || { id: 0, emoji: "🎯", name: "Цель", current: 0, target: 1, unit: "", deadline: "" };
  const g = (app?.goals && app.goals.find((x) => x.id === seed.id)) || seed;
  const isDark = app?.themeOverride === "dark";
  const Count = (typeof CountUp !== "undefined") ? CountUp : ({ value }) => value;

  const pct = g.target ? Math.min(1, (g.current || 0) / g.target) : 0;
  const remaining = Math.max(0, (g.target || 0) - (g.current || 0));
  const done = pct >= 1;
  const linked = (app?.habits || []).filter((h) => (g.habitIds || []).includes(h.id));

  const card = isDark
    ? { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }
    : { background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" };
  const ringTrack = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.07)";
  const R = 54, CIRC = 2 * Math.PI * R;
  const goalColor = g.color || "#0a0a0a";  // goal fill = its chosen colour, default black (b&w base)

  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader dark={isDark} title="" onBack={() => navigate(back)} right={
        <EditGlassButtonLive onClick={() => navigate("goal-settings", { mode: "edit", goal: g })} />
      } />

      {/* Hero — progress ring (Apple-Watch style), % counts up on open */}
      <div style={{ textAlign: "center", padding: "6px 0 18px" }}>
        <div style={{ position: "relative", width: 170, height: 170, margin: "0 auto" }}>
          <svg width="170" height="170" viewBox="0 0 140 140" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="70" cy="70" r={R} fill="none" stroke={ringTrack} strokeWidth="13" />
            {pct > 0 && <circle cx="70" cy="70" r={R} fill="none" stroke={goalColor} strokeWidth="13" strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - pct)} style={{ transition: "stroke-dashoffset 0.6s ease", ...(done ? { filter: "drop-shadow(0 0 6px " + goalColor + "80)" } : {}) }} />}
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
            <div>
              <div style={{ fontSize: 34, lineHeight: 1 }}>{bosIcon(g.emoji, 32, g.color)}</div>
              <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4, letterSpacing: "-0.5px" }}><Count value={Math.round(pct * 100)} />%</div>
            </div>
          </div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", marginTop: 14, letterSpacing: "-0.4px" }}>{g.name}</div>
        <div style={{ fontSize: 13, color: "var(--text-4)", marginTop: 3 }}>
          <Count value={g.current || 0} /> из {g.target} {g.unit} · до {g.deadline}
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[
          { l: "Осталось", v: remaining, i: "🎯" },
          { l: "Сделано", v: g.current || 0, i: "✅" },
          { l: "Срок", text: g.deadline, i: "📅" },
        ].map((s, i) => (
          <div key={i} style={{ ...card, borderRadius: 22, padding: "14px 6px", textAlign: "center" }}>
            <div style={{ fontSize: 16 }}>{s.i}</div>
            <div style={{ fontSize: s.text ? 13.5 : 21, fontWeight: 700, marginTop: 6, letterSpacing: "-0.4px" }}>{s.text ? s.text : <Count value={s.v} />}</div>
            <div style={{ fontSize: 10.5, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, marginTop: 3 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Built from these habits — tap drills into the habit's own stats */}
      {linked.length > 0 && (
        <>
          <div className="section-label" style={{ marginTop: 22 }}>Складывается из привычек</div>
          <div style={{ ...card, borderRadius: 22, marginTop: 8, overflow: "hidden" }}>
            {linked.map((h, i) => (
              <div key={h.id}>
                <button className="tap" onClick={() => navigate("habit-detail", { habit: h, from: "goal-detail" })} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "transparent", border: 0, textAlign: "left", color: "var(--text)" }}>
                  <span style={{ width: 38, height: 38, borderRadius: 14, background: h.color ? h.color + "26" : (isDark ? "rgba(255,255,255,0.06)" : "var(--surface-3)"), display: "grid", placeItems: "center", fontSize: 19, flexShrink: 0 }}>{bosIcon(h.emoji, 20, h.color)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, color: "var(--text)", fontWeight: 600 }}>{h.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 1 }}>🔥 {(typeof bosStreak === "function") ? bosStreak(h.log) : (h.streak || 0)}д серия</div>
                  </div>
                  <I.ChevronRight size={17} color="var(--text-4)" />
                </button>
                {i < linked.length - 1 && <div style={{ height: 1, background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)" }} />}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pace hint */}
      <div className="section-label" style={{ marginTop: 22 }}>Подсказка</div>
      <div style={{ ...card, borderRadius: 22, padding: 14, marginTop: 8, display: "flex", gap: 10 }}>
        <I.Sparkles size={18} color={isDark ? "#fff" : "#0a0a0a"} />
        <div style={{ flex: 1, fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>
          {done
            ? `Цель достигнута 🎉 «${g.name}» закрыта — можно поставить новую планку.`
            : pct >= 0.8
              ? `Финишная прямая — осталось ${remaining} ${g.unit}. Не сбавляй до ${g.deadline}.`
              : pct >= 0.5
                ? `Больше половины пути. ${linked[0] ? `Главный двигатель — «${linked[0].name}»: не разрывай серию.` : "Держи темп."}`
                : `${linked[0] ? `Каждая отметка «${linked[0].name}» приближает к цели. ` : "Начало положено. "}Осталось ${remaining} ${g.unit} до ${g.deadline}.`}
        </div>
      </div>

      {/* Action — nudge progress; ring + % update live */}
      <button onClick={() => { if (!done && app?.updateGoal) app.updateGoal(g.id, { current: Math.min(g.target, (g.current || 0) + 1) }); }} className="bos-btn" style={{ marginTop: 22, background: done ? (isDark ? "rgba(255,255,255,0.1)" : "var(--surface-3)") : undefined, color: done ? "var(--text-2)" : undefined }}>
        {done ? "✓ Цель достигнута" : "+1 к прогрессу"}
      </button>
    </div>
  );
}

/* MOOD CHECK-IN — LIVE. Fullscreen state pulse; the check-in ALWAYS keys by the REAL
   date (bosTodayKey()) so marks accumulate per day & pay XP. State is colored orbs (no
   emoji), plus contextual sub-state #hashtags (MOOD_TAGS) and an optional note. */
function MoodLive() {
  const { navigate } = useNav();
  const app = useApp ? useApp() : null;
  const moods = (typeof MOOD_OPTIONS !== "undefined") ? MOOD_OPTIONS : [
    { i: "😌", t: "Спокойствие",      c: "#cfe1ff" },
    { i: "⚡️", t: "Энергия", c: "#fef3c7" },
    { i: "😔", t: "Упадок",       c: "#e3e3e3" },
    { i: "😤", t: "Стресс",  c: "#fde2e2" },
    { i: "🙂", t: "Ровно",    c: "#d6f3df" },
    { i: "🔥", t: "В огне",   c: "#ffe1c8" },
  ];
  const [picked, setPicked] = useM(app?.mood?.t ? moods.findIndex(m => m.t === app.mood.t) : -1);
  const [note, setNote] = useM("");
  const [tags, setTags] = useM([]);

  // Breathing time
  const [t, setT] = useM(0);
  React.useEffect(() => {
    let raf, s = performance.now();
    const tick = (now) => { setT((now - s) / 1000); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  const breath = 1 + Math.sin(t * 0.8) * 0.04;
  const pulse  = 1 + Math.sin(t * 1.3) * 0.06;

  const cur = picked >= 0 ? moods[picked] : null;
  const tint = cur ? cur.c : "#6a7a92";

  const moodTags = cur ? (MOOD_TAGS[cur.t] || []) : [];
  const toggleTag = (tg) => setTags(ts => ts.includes(tg) ? ts.filter(x => x !== tg) : [...ts, tg]);
  const onSave = () => {
    if (picked < 0 || !app) return navigate("home");
    // Key by the REAL date (so check-ins accumulate per day & pay XP).
    const dayKey = (typeof bosTodayKey === "function") ? bosTodayKey() : new Date().toISOString().slice(0, 10);
    app.setMood && app.setMood(moods[picked]);
    app.setDayMoods && app.setDayMoods({ ...(app.dayMoods || {}), [dayKey]: picked });
    if (app.setDayNotes) { const prev = (app.dayNotes || {})[dayKey] || {}; app.setDayNotes({ ...(app.dayNotes || {}), [dayKey]: { tags: (tags && tags.length) ? tags : (prev.tags || []), note: note.trim() || prev.note || "" } }); }
    navigate("home");
  };

  return (
    <div className="mood-fullscreen" style={{
      position: "absolute", inset: 0, color: "var(--text)", overflow: "hidden",
      background: "linear-gradient(180deg, #ffffff 0%, #f2f3f6 100%)",
      display: "flex", flexDirection: "column",
      ["--mood-tint"]: tint,
    }}>
      {/* Aurora vignette — centered glow that fades to pure black at top/bottom */}
      <div aria-hidden style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `radial-gradient(70% 45% at 50% 42%, ${tint}59 0%, ${tint}24 32%, transparent 66%)`,
        transition: "background 0.6s ease",
      }}/>
      {/* Subtle film grain via noise gradient bands — keeps black areas alive */}
      <div aria-hidden style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "linear-gradient(180deg, #ffffff 0%, transparent 18%, transparent 82%, #f2f3f6 100%)",
      }}/>

      {/* Header — sits over the status bar room */}
      <div style={{ position: "relative", zIndex: 2, padding: "60px 20px 0", display: "flex", alignItems: "center" }}>
        {/* Inside Telegram the native Back button (driven from app.jsx's nav stack) already
            shows — hide our in-app chevron so there aren't two "backs". The 40px spacer keeps
            the title centred. PWA/browser keeps the chevron. (Same guard as PageHeader.) */}
        {!(typeof window !== "undefined" && window.__TG) ? (
          <button onClick={() => navigate("home")} className="tap"
            style={{ width: 40, height: 40, borderRadius: 999, background: "rgba(0,0,0,0.05)", border: 0, color: "var(--text)", display: "grid", placeItems: "center", padding: 0 }}>
            <I.ChevronLeft size={18}/>
          </button>
        ) : <span style={{ width: 40 }}/>}
        <div style={{ flex: 1, textAlign: "center", fontSize: 11, letterSpacing: 1.6, textTransform: "uppercase", color: "var(--text-4)", fontWeight: 600 }}>Отметка состояния</div>
        <span style={{ width: 40 }}/>
      </div>

      {/* Hero — pure orb */}
      <div style={{ position: "relative", zIndex: 2, flex: cur ? "0 0 auto" : 1, display: "grid", placeItems: "center", padding: "12px 20px 0", minHeight: cur ? 132 : 220, transition: "min-height 0.4s ease" }}>
        <div style={{ position: "relative", width: cur ? 156 : 220, height: cur ? 156 : 220, display: "grid", placeItems: "center", transition: "width 0.4s ease, height 0.4s ease" }}>
          {/* Outer aurora halo */}
          <div aria-hidden style={{
            position: "absolute", inset: -40, borderRadius: "50%",
            background: `radial-gradient(circle, ${tint}59 0%, ${tint}1f 35%, transparent 70%)`,
            opacity: 0.8 * pulse, filter: "blur(22px)",
            transform: `scale(${pulse})`, transition: "background 0.6s ease",
          }}/>
          {/* Main orb — same glass orb as the rest of the app */}
          <div style={{ transform: `scale(${breath})`, transition: "transform 0.15s" }}>
            <StateOrb size={cur ? 140 : 196} tint={tintFromMood(tint)} intensity={cur ? 1.3 : 0.7} />
          </div>
        </div>
      </div>

      {/* Headline */}
      <div style={{ position: "relative", zIndex: 2, padding: "0 24px", textAlign: "center" }}>
        <div style={{ fontFamily: "var(--bos-title-font)", fontSize: 30, fontWeight: 600, color: "var(--text)", lineHeight: 1.1, letterSpacing: "-0.6px", minHeight: 36 }}>
          {cur ? cur.t : "Как оно ощущается сейчас?"}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 6, lineHeight: 1.5 }}>
          {cur ? "Отметь, что за этим стоит — или просто сохрани." : "Каждый цвет — это состояние. Выбери подходящее."}
        </div>
      </div>

      {/* Orb selector — 6 colored orbs in a row, no emoji */}
      <div style={{ position: "relative", zIndex: 2, padding: cur ? "14px 20px 0" : "26px 20px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
          {moods.map((m, idx) => {
            const active = picked === idx;
            return (
              <button key={idx} onClick={() => { setPicked(idx); setTags([]); setNote(""); }} className="tap hit44" data-haptic="selection" aria-label={m.t} style={{
                background: "transparent", border: 0, padding: "6px 2px 8px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                color: "var(--text)", cursor: "pointer",
              }}>
                <span aria-hidden style={{
                  borderRadius: "50%",
                  boxShadow: active ? `0 0 0 2px #0a0a0a, 0 0 16px ${m.c}99` : "none",
                  transform: active ? "scale(1.08)" : "scale(1)",
                  transition: "transform 0.25s, box-shadow 0.25s",
                }}>
                  <StaticOrb size={38} tint={tintFromMood(m.c)} seed={1.2} intensity={0.3} />
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: 0.3,
                  opacity: active ? 1 : 0.6,
                  textAlign: "center", lineHeight: 1.1,
                }}>{m.t}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Picked → sub-state #hashtags (+ optional note). Not picked → invitation nudge. */}
      {cur ? (
      <div style={{ position: "relative", zIndex: 2, margin: "16px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 11 }}>
          <span style={{ fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--text-4)", fontWeight: 600 }}>Что за этим стоит?</span>
          <span style={{ fontSize: 11, color: "var(--text-5)" }}>по желанию</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {moodTags.map((tg) => {
            const on = tags.includes(tg);
            return (
              <button key={tg} onClick={() => toggleTag(tg)} className="tap" data-no-haptic style={{
                padding: "8px 13px", borderRadius: 999, fontSize: 13, fontWeight: 500, border: 0, cursor: "pointer",
                background: on ? "#0a0a0a" : "var(--surface-3)", color: on ? "#fff" : "var(--text-3)",
                display: "inline-flex", alignItems: "center", gap: 5, transition: "background 0.18s, color 0.18s",
              }}>
                {on && <span style={{ width: 7, height: 7, borderRadius: "50%", background: tint }} />}
                {tg.replace(/_/g, " ")}
              </button>
            );
          })}
        </div>
        {/* Note — always visible (an obvious inset field), so you can't miss that
            you can write your own. No autoFocus → the caret never jumps on open. */}
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Опиши, что чувствуешь сейчас…"
          style={{ width: "100%", marginTop: 12, background: "var(--surface-3)", border: "1px solid var(--line)", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.04)", borderRadius: 14, padding: "12px 14px", color: "var(--text)", fontSize: 16, fontFamily: "inherit", lineHeight: 1.4, outline: 0, minHeight: 50, resize: "none", boxSizing: "border-box", display: "block" }}/>
      </div>
      ) : (
      <div style={{ position: "relative", zIndex: 2, margin: "18px 20px 0", padding: "12px 14px",
        background: "var(--surface-3)", borderRadius: 14,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{ width: 36, height: 36, borderRadius: 999, background: "rgba(254,222,52,0.14)", display: "grid", placeItems: "center", color: "#FEDE34", fontSize: 18 }}>✨</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--text-4)", fontWeight: 600 }}>Дневник состояния</div>
          <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 3, lineHeight: 1.35 }}>
            Выбери состояние — подскажу слова, чтобы отметить, что за ним стоит.
          </div>
        </div>
      </div>
      )}

      {cur && <div aria-hidden style={{ flex: 1, minHeight: 6 }} />}
      {/* Save bar */}
      <div style={{ position: "relative", zIndex: 2, padding: "14px 20px 28px" }}>
        <button onClick={onSave} disabled={picked < 0} className="tap" style={{
          width: "100%",
          background: picked < 0 ? "var(--surface-3)" : "#0a0a0a",
          color: picked < 0 ? "var(--text-4)" : "#fff",
          border: 0, borderRadius: 999, padding: 16, fontSize: 15, fontWeight: 600, letterSpacing: "-0.1px",
          transition: "all 0.2s",
        }}>
          {picked < 0 ? "Выбери состояние" : "Сохранить отметку"}
        </button>
      </div>
    </div>
  );
}

/* JOURNAL / DAILY REFLECTION — LIVE. Real past notes from app.dayNotes (newest first),
   the real header date from the user's clock, and the honest live save (+10 XP only
   when there's text). Drops the frozen demo showcase entries entirely. */
function JournalLive() {
  const { navigate } = useNav();
  const app = (typeof useApp === "function") ? useApp() : null;
  const [a, setA] = useM(""); const [b, setB] = useM(""); const [c, setC] = useM("");

  // REAL past notes from app.dayNotes (any day with a written note or tags), newest
  // first; honest empty state when there are none.
  const livePast = (() => {
    const notes = (app && app.dayNotes) || {};
    return Object.keys(notes)
      .map((k) => ({ key: k, e: notes[k] }))
      .filter(({ e }) => e && ((e.note != null && ("" + e.note).trim()) || (e.tags && e.tags.length)))
      .sort((x, y) => ("" + y.key).localeCompare("" + x.key))
      .map(({ key, e }) => ({ date: journalDateLabel(key), text: ("" + (e.note || "")).trim(), tags: e.tags || [] }));
  })();

  // Header date from the user's real clock.
  const todayKey = (typeof bosTodayKey === "function") ? bosTodayKey() : "";
  const WDAYS = ["Воскресенье","Понедельник","Вторник","Среда","Четверг","Пятница","Суббота"];
  const liveHeader = (() => { try { const d = new Date(); return journalDateLabel(bosTodayKey(d)) + " · " + WDAYS[d.getDay()]; } catch (e) { return ""; } })();

  // Persist into dayNotes[todayKey] as {tags, note} — the SAME shape the XP formula
  // rewards (+10/day for a journal note) and the calendar reads. Keep any tags a mood
  // check-in already logged today, so we don't wipe them.
  const liveSave = () => {
    if (!app || !app.setDayNotes || !todayKey) return navigate("home");
    const parts = [];
    if (a.trim()) parts.push("Хорошо: " + a.trim());
    if (b.trim()) parts.push("Помешало: " + b.trim());
    if (c.trim()) parts.push("Завтра: " + c.trim());
    const note = parts.join("\n");
    if (note) {
      const prev = (app.dayNotes && app.dayNotes[todayKey]) || {};
      app.setDayNotes({ ...(app.dayNotes || {}), [todayKey]: { tags: prev.tags || [], note } });
    }
    navigate("home");
  };

  const hasText = a.trim() || b.trim() || c.trim();
  // Honest XP: a journal note awards +10 XP/day (mood check-in is a separate +5). Only
  // promise XP once there's something to save — an empty save earns nothing.
  const saveLabel = hasText ? "Сохранить · +10 XP" : "Сохранить";
  const past = livePast;

  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title="Ежедневная рефлексия" onBack={() => navigate("home")} />
      <div style={{ background: "#fff", borderRadius: 22, padding: 18, boxShadow: "var(--card-shadow)" }}>
        <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1.4, fontWeight: 600 }}>{liveHeader}</div>
        <div className="section-label" style={{ marginTop: 16, color: "var(--text-2)" }}>Что прошло хорошо?</div>
        <textarea value={a} onChange={e=>setA(e.target.value)} placeholder="Максимум три строки."
          style={{ width: "100%", background: "var(--surface-3)", border: 0, borderRadius: 14, padding: 12, marginTop: 8, fontSize: 14, fontFamily: "inherit", outline: 0, minHeight: 70, resize: "none" }}/>
        <div className="section-label" style={{ marginTop: 16, color: "var(--text-2)" }}>Что помешало?</div>
        <textarea value={b} onChange={e=>setB(e.target.value)} placeholder="Одно честное предложение."
          style={{ width: "100%", background: "var(--surface-3)", border: 0, borderRadius: 14, padding: 12, marginTop: 8, fontSize: 14, fontFamily: "inherit", outline: 0, minHeight: 70, resize: "none" }}/>
        <div className="section-label" style={{ marginTop: 16, color: "var(--text-2)" }}>Одна вещь на завтра</div>
        <textarea value={c} onChange={e=>setC(e.target.value)} placeholder="Чем меньше, тем лучше."
          style={{ width: "100%", background: "var(--surface-3)", border: 0, borderRadius: 14, padding: 12, marginTop: 8, fontSize: 14, fontFamily: "inherit", outline: 0, minHeight: 70, resize: "none" }}/>
      </div>
      <button className="bos-btn" style={{ marginTop: 16 }} onClick={() => liveSave()}>{saveLabel}</button>
      <div className="section-label" style={{ marginTop: 22 }}>Прошлые записи</div>
      {past.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 14, padding: 18, marginTop: 8, boxShadow: "var(--card-shadow)", fontSize: 14, color: "var(--text-4)", textAlign: "center", lineHeight: 1.5 }}>
          Пока нет записей — первая появится здесь.
        </div>
      ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        {past.map((p, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 14, padding: 14, boxShadow: "var(--card-shadow)" }}>
            <div style={{ fontSize: 12, color: "var(--text)", fontWeight: 600 }}>{p.date}</div>
            {p.text && <div style={{ fontSize: 14, marginTop: 6, color: "var(--text-2)", whiteSpace: "pre-line", lineHeight: 1.45 }}>{p.text}</div>}
            {p.tags && p.tags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: p.text ? 8 : 6 }}>
                {p.tags.map((tg, j) => (
                  <span key={j} style={{ fontSize: 12, color: "var(--text-3)", background: "var(--surface-3)", borderRadius: 999, padding: "3px 9px" }}>#{("" + tg).replace(/_/g, " ")}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      )}
    </div>
  );
}

/* AI CHAT — LIVE. The real conversational coach: every reply goes through the proxy
   (aiReply → aiRaw → Edge Function), action-cards are parsed out via bosParseAction,
   and AI_LIVE_FALLBACK is the honest "try again" when the model returns nothing. The
   live chat persists on-device (private). Drops the scripted demo seed + demo time. */
function AIChatLive() {
  const { navigate, params } = useNav();
  const app = (typeof useApp === "function") ? useApp() : null;
  // The mentor's avatar = the orb of your CURRENT state (mood-tinted). Your own
  // avatar sits up top (it's your conversation). Your messages carry no avatar.
  const stateTint = (typeof tintFromMood === "function") ? tintFromMood(app && app.mood && app.mood.c) : null;
  // A real, personal opener: time-of-day greeting + the user's name.
  const _name = (app?.userName || "").trim();
  const _hr = (function () { try { return new Date().getHours(); } catch (e) { return 12; } })();
  const _greet = _hr < 5 ? "Доброй ночи" : _hr < 12 ? "Доброе утро" : _hr < 18 ? "Добрый день" : _hr < 23 ? "Добрый вечер" : "Доброй ночи";
  // The chat date divider — the user's REAL current time, never a hard-coded string.
  const _dateLabel = (function () {
    try { const d = new Date(); const mm = d.getMinutes(); return "Сегодня · " + d.getHours() + ":" + (mm < 10 ? "0" + mm : mm); }
    catch (e) { return "Сегодня"; }
  })();
  const _hello = _greet + (_name ? ", " + _name : "") + ". Я рядом. Расскажи, как ты сейчас или что на уме — и начнём с одного маленького шага.";
  // Resolve current theme from the iOS frame wrapper so this screen looks
  // right under both .theme-light and .theme-dark.
  const wrapRef = React.useRef(null);
  const [isDark, setIsDark] = useM(false);
  React.useEffect(() => {
    const el = wrapRef.current; if (!el) return;
    let n = el.parentElement;
    while (n && !n.classList.contains("theme-light") && !n.classList.contains("theme-dark")) n = n.parentElement;
    setIsDark(!!(n && n.classList.contains("theme-dark")));
  }, []);

  // Theme tokens for chat bubbles & chrome
  const TH = isDark ? {
    bg: "#0a0a0a",
    text: "#fff", muted: "rgba(255,255,255,0.5)", dim: "rgba(255,255,255,0.35)",
    border: "transparent",
    aiBubble: "rgba(255,255,255,0.06)", aiBubbleBorder: "0",
    aiCard: "rgba(255,255,255,0.06)", aiCardBorder: "0",
    cardDivider: "1px solid rgba(255,255,255,0.08)",
    chip: "rgba(255,255,255,0.06)", chipBorder: "0",
    composer: "rgba(255,255,255,0.08)", composerBorder: "0",
    iconBtn: "rgba(255,255,255,0.06)", iconBtnBorder: "0",
    skipBg: "rgba(255,255,255,0.06)", skipBorder: "0",
    typingDot: "rgba(255,255,255,0.7)",
    accentBg: "rgba(255,255,255,0.06)", insightBg: "rgba(255,255,255,0.06)",
    statValue: "#fff",
    primary: "#fff", primaryFg: "#0a0a0a",
    meBubble: "#0a0a0a", meText: "#fff",
  } : {
    bg: "#fafafa",
    text: "var(--text)", muted: "var(--text-4)", dim: "var(--text-5)",
    border: "var(--line)",
    aiBubble: "#fff", aiBubbleBorder: "1px solid var(--line)",
    aiCard: "#fff", aiCardBorder: "1px solid var(--line)",
    cardDivider: "1px solid var(--line)",
    chip: "#fff", chipBorder: "1px solid var(--line)",
    composer: "#fff", composerBorder: "1px solid var(--line)",
    iconBtn: "#fff", iconBtnBorder: "1px solid var(--line)",
    skipBg: "var(--surface-3)", skipBorder: 0,
    typingDot: "rgba(0,0,0,0.45)",
    accentBg: "var(--surface-3)", insightBg: "var(--surface-3)",
    statValue: "var(--text)",
    primary: "#0a0a0a", primaryFg: "#fff",
    meBubble: "#0a0a0a", meText: "#fff",
  };

  // Each message: { who, kind, t, ...cardData }. Live chats persist LOCALLY on the
  // device (private — never leaves the phone), so a real user never loses them.
  const _aiChatKey = "bos:aichat:" + (app?.persistId || "live");
  const [msgs, setMsgs] = useM(function () { try { var raw = localStorage.getItem(_aiChatKey); if (raw) { var arr = JSON.parse(raw); if (arr && arr.length) return arr; } } catch (e) {} return [{ who: "ai", kind: "greeting", t: _hello }]; });
  const [draft, setDraft] = useM("");
  const [typing, setTyping] = useM(false);
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs, typing]);

  // Persist the live AI chat locally so it survives reloads & reopening (on-device, private).
  React.useEffect(() => { try { localStorage.setItem(_aiChatKey, JSON.stringify(msgs)); } catch (e) {} }, [msgs, _aiChatKey]);

  // Split a reply on blank lines into separate human-feeling bubbles, then drop them
  // in one after another with a small stagger (a real person texts in bursts, not one
  // wall). Single-paragraph replies stay a single bubble. Caps at 4 to avoid spam.
  // Returns the ms after which the last bubble lands, so a follow-up action card can
  // be dropped in right after the text (not in the middle of a multi-part reply).
  const appendReply = (reply) => {
    const parts = ("" + reply).split(/\n{2,}/).map((s) => s.trim()).filter(Boolean).slice(0, 4);
    if (parts.length <= 1) { setMsgs((m) => [...m, { who: "ai", kind: "text", t: parts[0] || ("" + reply).trim() }]); return 0; }
    setMsgs((m) => [...m, { who: "ai", kind: "text", t: parts[0] }]);
    parts.slice(1).forEach((p, k) => { window.setTimeout(() => setMsgs((m) => [...m, { who: "ai", kind: "text", t: p }]), (k + 1) * 520); });
    return (parts.length - 1) * 520;
  };

  const send = (text) => {
    if (typing) return;
    const t = (text ?? draft).trim();
    if (!t) return;
    const history = [...msgs, { who: "me", t }];
    setMsgs(history);
    setDraft("");
    setTyping(true);
    aiReplyLive(history, buildAiContextLive(app))
      .then((reply) => {
        setTyping(false);
        const parsed = bosParseAction(reply);
        const body = (parsed.text && parsed.text.trim()) ? parsed.text : (parsed.action ? "" : (reply || AI_LIVE_FALLBACK));
        const after = body ? appendReply(body) : 0;
        if (parsed.action) window.setTimeout(() => setMsgs((m) => [...m, { who: "ai", kind: "actioncard", action: parsed.action, aid: bosAid() }]), after + 360);
      })
      .catch(() => { setTyping(false); setMsgs(m => [...m, { who: "ai", kind: "text", t: AI_LIVE_FALLBACK }]); });
  };

  // Tap a suggestion pill. New contract: kind:"action" → open a real screen (route +
  // params); kind:"chat" → seed the conversation. Legacy {i,t} pills (heuristic chips)
  // have no kind → treated as chat, sending their text.
  const tapPill = (p) => {
    if (p && p.kind === "action" && p.route) { navigate(p.route, p.params || {}); return; }
    send((p && (p.prompt || p.t)) || "");
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
    const primer = params && params.prompt;
    if (!primer) return;
    navigate("ai-chat", {});                 // consume: the priming prompt fires exactly once
    const t = window.setTimeout(() => send(primer), 350);
    return () => window.clearTimeout(t);
  }, []); // eslint-disable-line

  const renderAI = (m, i) => {
    if (m.kind === "greeting") {
      return (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-end", animation: "msgIn 0.4s ease both" }}>
          <StateChatOrb size={28} tint={stateTint}/>
          <div style={{ background: TH.aiBubble, border: TH.aiBubbleBorder, borderRadius: 22, borderBottomLeftRadius: 4, padding: "10px 14px", fontSize: 14, color: TH.text }}>{m.t}</div>
        </div>
      );
    }
    if (m.kind === "text") {
      return (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-end", animation: "msgIn 0.4s ease both" }}>
          <StateChatOrb size={28} tint={stateTint}/>
          <div style={{ maxWidth: "78%", background: TH.aiBubble, border: TH.aiBubbleBorder, borderRadius: 22, borderBottomLeftRadius: 4, padding: "10px 14px", fontSize: 14, color: TH.text, lineHeight: 1.45 }}>{m.t}</div>
        </div>
      );
    }
    if (m.kind === "actioncard") {
      const a = m.action || {};
      if (a.type === "open") {
        return (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", animation: "msgIn 0.4s ease both" }}>
            <StateChatOrb size={28} tint={stateTint}/>
            <button className="tap" onClick={() => navigate(a.route)} style={{ flex: 1, maxWidth: "85%", textAlign: "left", background: TH.aiCard, border: TH.aiCardBorder, borderRadius: 22, borderTopLeftRadius: 4, padding: "13px 16px", color: TH.text, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{a.label || "Открыть"}</span>
              <span style={{ fontSize: 17, color: TH.muted }}>→</span>
            </button>
          </div>
        );
      }
      return (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", animation: "msgIn 0.4s ease both" }}>
          <StateChatOrb size={28} tint={stateTint}/>
          <div style={{ flex: 1, maxWidth: "85%", background: TH.aiCard, border: TH.aiCardBorder, borderRadius: 22, borderTopLeftRadius: 4, padding: 14, color: TH.text }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 40, height: 40, borderRadius: 14, background: a.color ? a.color + "26" : "var(--surface-3)", display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0 }}>{a.emoji || "✨"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10.5, letterSpacing: 1.2, textTransform: "uppercase", color: TH.muted, fontWeight: 600 }}>Новая привычка</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: TH.text, letterSpacing: "-0.3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</div>
              </div>
            </div>
            {a.time && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 11, background: TH.accentBg, borderRadius: 999, padding: "5px 11px", fontSize: 12.5, color: TH.text }}>⏰ напоминание в {a.time}</div>
            )}
            {a.why && <div style={{ fontSize: 13, lineHeight: 1.5, marginTop: 10, color: TH.muted }}>{a.why}</div>}
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button className="tap" onClick={() => navigate("habit-settings", { mode: "create", preset: { i: a.emoji || "✨", t: a.name, color: a.color || null, time: a.time || null } })} style={{ flex: 1, background: TH.primary, color: TH.primaryFg, border: 0, borderRadius: 14, padding: "11px 14px", fontSize: 14, fontWeight: 600 }}>Создать привычку</button>
              <button className="tap" data-no-haptic onClick={() => setMsgs((mm) => mm.filter((x) => x.aid !== m.aid))} style={{ background: TH.skipBg, color: TH.text, border: TH.skipBorder, borderRadius: 14, padding: "11px 14px", fontSize: 14 }}>Не сейчас</button>
            </div>
          </div>
        </div>
      );
    }
    // Rich AI cards (summary / suggestion / insight) — kept for any persisted message of
    // that shape; live replies are plain text + action-cards, but this keeps old/loaded
    // transcripts rendering correctly.
    return (
      <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", animation: "msgIn 0.4s ease both" }}>
        <StateChatOrb size={28} tint={stateTint}/>
        <div style={{
          flex: 1, background: TH.aiCard, border: TH.aiCardBorder,
          borderRadius: 22, borderTopLeftRadius: 4,
          padding: 14, color: TH.text, maxWidth: "85%",
          backdropFilter: "blur(20px)",
        }}>
          {m.kind === "summary" && (
            <>
              <div style={{ fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: TH.muted, fontWeight: 600 }}>{m.title}</div>
              <div style={{ fontSize: 14, lineHeight: 1.5, marginTop: 6 }}>{m.body}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginTop: 12, paddingTop: 10, borderTop: TH.cardDivider }}>
                {m.stats.map((s, j) => (
                  <div key={j} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 600, color: TH.statValue, letterSpacing: "-0.3px" }}>{s.v}</div>
                    <div style={{ fontSize: 10, color: TH.muted, letterSpacing: 0.5 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </>
          )}
          {m.kind === "suggestion" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 24, height: 24, borderRadius: 8, background: TH.accentBg, display: "grid", placeItems: "center", fontSize: 14 }}>💡</span>
                <div style={{ fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: TH.muted, fontWeight: 600 }}>{m.title}</div>
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.5, marginTop: 8 }}>{m.body}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button className="tap" onClick={() => navigate("habits")} style={{ flex: 1, background: TH.primary, color: TH.primaryFg, border: 0, borderRadius: 14, padding: "10px 14px", fontSize: 13, fontWeight: 600 }}>{m.action.label}</button>
                <button className="tap" style={{ background: TH.skipBg, color: TH.text, border: TH.skipBorder, borderRadius: 14, padding: "10px 14px", fontSize: 13 }}>Пропустить</button>
              </div>
            </>
          )}
          {m.kind === "insight" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 24, height: 24, borderRadius: 8, background: TH.insightBg, display: "grid", placeItems: "center", fontSize: 14 }}>📊</span>
                <div style={{ fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: TH.muted, fontWeight: 600 }}>{m.title}</div>
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.5, marginTop: 8 }}>{m.body}</div>
              <MiniBars data={m.chart} color={TH.text} textMuted={TH.muted} barIdle={isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.10)"} />
              <button className="tap" style={{ width: "100%", marginTop: 10, background: TH.skipBg, color: TH.text, border: TH.skipBorder, borderRadius: 14, padding: "10px 14px", fontSize: 13, fontWeight: 500 }}>Перенести понедельники →</button>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderMe = (m, i) => (
    <div key={i} style={{ alignSelf: "flex-end", maxWidth: "78%", animation: "msgIn 0.4s ease both" }}>
      <div style={{ background: TH.meBubble, color: TH.meText, borderRadius: 22, borderBottomRightRadius: 4, padding: "10px 14px", fontSize: 14, lineHeight: 1.45, fontWeight: 500 }}>{m.t}</div>
    </div>
  );

  return (
    <div ref={wrapRef} className="page-in" style={{ height: "calc(100% + 90px)", margin: "-60px 0 -30px", color: TH.text, display: "flex", flexDirection: "column", background: TH.bg }}>
      {/* No in-app back control. Inside Telegram the native Back button shows on every
          pushed Mini-App screen (app.jsx wires tgBackButton → goBack), so an in-screen
          chevron would just DUPLICATE it. We keep a quiet top inset so the first message
          clears the status bar / Telegram header — the conversation itself is the header. */}
      <div style={{ height: 54, flexShrink: 0 }} />

      <div ref={scrollRef} className="screen-scroll" style={{ flex: 1, padding: "16px 14px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ alignSelf: "center", fontSize: 10, letterSpacing: 1.5, color: TH.dim, textTransform: "uppercase" }}>{_dateLabel}</div>

        {msgs.map((m, i) => m.who === "ai" ? renderAI(m, i) : renderMe(m, i))}

        {typing && (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end", animation: "msgIn 0.4s ease both" }}>
            <StateChatOrb size={28} tint={stateTint}/>
            <div style={{ background: TH.aiBubble, border: TH.aiBubbleBorder, borderRadius: 22, borderBottomLeftRadius: 4, padding: "12px 14px", display: "flex", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: TH.typingDot, animation: "typingDot 1.2s 0s ease-in-out infinite" }}/>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: TH.typingDot, animation: "typingDot 1.2s 0.2s ease-in-out infinite" }}/>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: TH.typingDot, animation: "typingDot 1.2s 0.4s ease-in-out infinite" }}/>
            </div>
          </div>
        )}
      </div>

      {/* Quick prompts — the AI login-brief pills (personal) when present, otherwise the
          context-aware heuristic set. */}
      <div style={{ padding: "0 14px 8px", display: "flex", gap: 6, overflowX: "auto" }}>
        {((app && app.aiBrief && Array.isArray(app.aiBrief.pills) && app.aiBrief.pills.length) ? app.aiBrief.pills.slice(0, 4) : buildQuickPrompts(app)).map((s, i) => (
          <button key={i} onClick={() => tapPill(s)} className="tap" data-no-haptic style={{ flexShrink: 0, background: TH.chip, border: TH.chipBorder, borderRadius: 999, padding: "8px 14px", fontSize: 12, color: TH.text, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span>{s.i}</span> {s.label || s.t}
          </button>
        ))}
      </div>

      {/* Composer — flush, no border line */}
      <div style={{ padding: "10px 14px 16px", display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ flex: 1, background: TH.composer, border: TH.composerBorder, borderRadius: 999, padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
          <input value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Напиши сообщение…" style={{ flex: 1, border: 0, outline: 0, background: "transparent", color: TH.text, fontSize: 16 }}/>
        </div>
        <button onClick={() => send()} className="tap" style={{ width: 44, height: 44, borderRadius: "50%", background: TH.primary, border: 0, display: "grid", placeItems: "center" }}>
          <I.Send size={16} color={TH.primaryFg}/>
        </button>
      </div>

      <style>{`
        @keyframes msgIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes typingDot {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-3px); }
        }
      `}</style>
    </div>
  );
}

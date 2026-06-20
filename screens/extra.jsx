/* MORE SCREENS — habit detail, mood check-in, journal, focus timer, level-up modal, AI chat */
const { useState: useM } = React;

/* HABIT DETAIL — per-habit statistics. Opened by tapping a habit on Home or
   Habits (the check-circle there still toggles done; the row drills in here).
   Theme-adaptive; numbers derive deterministically from the habit's streak so
   they never flicker; "Изменить" opens the edit form. Back returns to the exact
   tab we came from (params.from) — no more snapping to the wrong tab. */
function HabitDetailScreen() {
  const { navigate, params } = useNav();
  const app = (typeof useApp === "function") ? useApp() : null;
  const back = params?.from || "habits";
  const seed = params?.habit || { id: 0, emoji: "🏃🏼‍♀️", name: "Утренняя пробежка", streak: 12 };
  // Live copy from the shared store so streak / done reflect taps made elsewhere.
  const h = (app?.habits && app.habits.find((x) => x.id === seed.id)) || seed;
  const isDark = app?.themeOverride === "dark";
  const Count = (typeof CountUp !== "undefined") ? CountUp : ({ value }) => value;

  const streak = h.streak || 0;
  // Deterministic derived stats — stable per habit, never random.
  const best  = Math.max(streak, 27);
  const total = streak * 9 + (h.id || 1) * 7 + 40;
  const rate  = Math.min(98, 58 + streak * 2);

  // Neutral by default (cohesive with the gray tiles outside); the habit's own
  // colour only if the user picked one — it tints the tile and fills the grid.
  const accent  = h.color || (isDark ? "rgba(255,255,255,0.92)" : "#1c1c1e");
  const tileBg  = h.color ? h.color + "26" : (isDark ? "rgba(255,255,255,0.06)" : "var(--surface-3)");
  const emptyBd = isDark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.12)";

  // 5-week grid: most recent `streak` days done; older days a fixed scatter
  // seeded by habit id (stable across renders — no Math.random flicker).
  const cells = Array.from({ length: 35 }, (_, i) => {
    const fromEnd = 34 - i;
    if (fromEnd < streak) return true;
    return ((i * 7 + (h.id || 1) * 13) % 10) > 6;
  });
  const WD = ["П", "В", "С", "Ч", "П", "С", "В"];

  const card = isDark
    ? { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }
    : { background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" };

  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader dark={isDark} title="" onBack={() => navigate(back)} right={
        <button onClick={() => navigate("habit-settings", { mode: "edit", habit: h })} className="tap" style={{ background: "transparent", border: 0, fontSize: 15, fontWeight: 500, color: "var(--text-2)" }}>Изменить</button>
      } />

      {/* Hero — neutral tile (or the habit's soft colour), like the lists outside */}
      <div style={{ textAlign: "center", padding: "6px 0 22px" }}>
        <div style={{ width: 88, height: 88, borderRadius: 24, margin: "0 auto", background: tileBg, display: "grid", placeItems: "center", boxShadow: isDark ? "inset 0 1px 0 rgba(255,255,255,0.08)" : "inset 0 1px 0 rgba(255,255,255,0.6)" }}>
          <span style={{ fontSize: 44 }}>{h.emoji}</span>
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, marginTop: 16, letterSpacing: "-0.5px" }}>{h.name}</div>
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
          <div key={i} style={{ ...card, borderRadius: 18, padding: "14px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 17 }}>{s.i}</div>
            <div style={{ fontSize: 21, fontWeight: 700, marginTop: 5, letterSpacing: "-0.5px" }}><Count value={s.v} />{s.suf}</div>
            <div style={{ fontSize: 10.5, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, marginTop: 3 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Activity grid — filled = done, hollow = missed (unmistakable) */}
      <div className="section-label" style={{ marginTop: 22 }}>Последние 5 недель</div>
      <div style={{ ...card, borderRadius: 18, padding: 14, marginTop: 8 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 5, marginBottom: 5 }}>
          {WD.map((d, i) => <div key={i} style={{ textAlign: "center", fontSize: 9.5, fontWeight: 600, color: "var(--text-4)", letterSpacing: 0.4 }}>{d}</div>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 5 }}>
          {cells.map((done, i) => (
            <span key={i} title={done ? "выполнено" : "пропущено"} style={{ aspectRatio: "1/1", borderRadius: 7, background: done ? accent : "transparent", boxShadow: done ? "none" : `inset 0 0 0 1.5px ${emptyBd}` }} />
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, fontSize: 11, color: "var(--text-4)" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 11 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 11, height: 11, borderRadius: 4, background: accent }} /> выполнено</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 11, height: 11, borderRadius: 4, boxShadow: `inset 0 0 0 1.5px ${emptyBd}` }} /> пропущено</span>
          </span>
          <span>Постоянство <b style={{ color: "var(--text-2)" }}><Count value={rate} />%</b></span>
        </div>
      </div>

      {/* Insight — neutral surface, streak-driven copy */}
      <div className="section-label" style={{ marginTop: 22 }}>Инсайт</div>
      <div style={{ ...card, borderRadius: 18, padding: 14, marginTop: 8, display: "flex", gap: 10 }}>
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
      {h.duration && (
        <button onClick={() => navigate("focus", { habit: h })} className="tap" style={{ marginTop: 10, width: "100%", background: "transparent", border: 0, color: "var(--text-2)", fontSize: 14, fontWeight: 500, padding: 8 }}>
          Начать фокус-сессию →
        </button>
      )}
    </div>
  );
}

/* GOAL DETAIL — progress ring, the habits it's built from (cross-linked into
   their own stats), a pace hint, and a +1 to nudge progress. Opened by tapping
   a goal on Home or Habits. Back returns to the origin tab (params.from). */
function GoalDetailScreen() {
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

  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader dark={isDark} title="" onBack={() => navigate(back)} right={
        <button onClick={() => navigate("goal-settings", { mode: "edit", goal: g })} className="tap" style={{ background: "transparent", border: 0, fontSize: 15, fontWeight: 500, color: "var(--text-2)" }}>Изменить</button>
      } />

      {/* Hero — progress ring (Apple-Watch style), % counts up on open */}
      <div style={{ textAlign: "center", padding: "6px 0 18px" }}>
        <div style={{ position: "relative", width: 170, height: 170, margin: "0 auto" }}>
          <svg width="170" height="170" viewBox="0 0 140 140" style={{ transform: "rotate(-90deg)" }}>
            <defs>
              <linearGradient id="goalGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#FEDE34" /><stop offset="1" stopColor="#EF9F14" />
              </linearGradient>
            </defs>
            <circle cx="70" cy="70" r={R} fill="none" stroke={ringTrack} strokeWidth="13" />
            {pct > 0 && <circle cx="70" cy="70" r={R} fill="none" stroke="url(#goalGrad)" strokeWidth="13" strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - pct)} style={{ transition: "stroke-dashoffset 0.6s ease", ...(done ? { filter: "drop-shadow(0 0 6px rgba(239,159,20,0.5))" } : {}) }} />}
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
            <div>
              <div style={{ fontSize: 34, lineHeight: 1 }}>{g.emoji}</div>
              <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4, letterSpacing: "-0.5px" }}><Count value={Math.round(pct * 100)} />%</div>
            </div>
          </div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, marginTop: 14, letterSpacing: "-0.4px" }}>{g.name}</div>
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
          <div key={i} style={{ ...card, borderRadius: 18, padding: "14px 6px", textAlign: "center" }}>
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
          <div style={{ ...card, borderRadius: 18, marginTop: 8, overflow: "hidden" }}>
            {linked.map((h, i) => (
              <div key={h.id}>
                <button className="tap" onClick={() => navigate("habit-detail", { habit: h, from: "goal-detail" })} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "transparent", border: 0, textAlign: "left", color: "var(--text)" }}>
                  <span style={{ width: 38, height: 38, borderRadius: 11, background: h.color ? h.color + "26" : (isDark ? "rgba(255,255,255,0.06)" : "var(--surface-3)"), display: "grid", placeItems: "center", fontSize: 19, flexShrink: 0 }}>{h.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, color: "var(--text-2)", fontWeight: 500 }}>{h.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 1 }}>🔥 {h.streak || 0}д серия</div>
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
      <div style={{ ...card, borderRadius: 18, padding: 14, marginTop: 8, display: "flex", gap: 10 }}>
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

/* MOOD CHECK-IN — quick state pulse */
/* MOOD CHECK-IN — fullscreen, edge-to-edge black with a centered aurora
   vignette so top/bottom stay pure black. State is represented entirely by
   colored orbs (no emoji). Includes a consistency-streak bonus strip. */
function MoodScreen() {
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

  // Consistency mock — how many recent days had a mood logged
  const streak = (() => {
    if (!app?.dayMoods) return 3;
    return Object.keys(app.dayMoods).length;
  })();
  const bonusXP = streak * 5;
  const sameStateStreak = (() => {
    if (!cur || !app?.dayMoods) return 0;
    const days = Object.entries(app.dayMoods).sort(([a],[b]) => b - a);
    let s = 0;
    for (const [, mi] of days) {
      if (moods[mi]?.t === cur.t) s++; else break;
    }
    return s;
  })();

  const onSave = () => {
    if (picked < 0 || !app) return navigate("home");
    app.setMood && app.setMood(moods[picked]);
    navigate("home");
  };

  return (
    <div className="mood-fullscreen" style={{
      position: "absolute", inset: 0, color: "#fff", overflow: "hidden",
      background: "#000",
      display: "flex", flexDirection: "column",
      ["--mood-tint"]: tint,
    }}>
      {/* Aurora vignette — centered glow that fades to pure black at top/bottom */}
      <div aria-hidden style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `radial-gradient(70% 45% at 50% 42%, ${tint}55 0%, ${tint}22 30%, transparent 65%)`,
        transition: "background 0.6s ease",
      }}/>
      {/* Subtle film grain via noise gradient bands — keeps black areas alive */}
      <div aria-hidden style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "linear-gradient(180deg, #000 0%, transparent 18%, transparent 80%, #000 100%)",
      }}/>

      {/* Header — sits over the status bar room */}
      <div style={{ position: "relative", zIndex: 2, padding: "60px 20px 0", display: "flex", alignItems: "center" }}>
        <button onClick={() => navigate("home")} className="tap"
          style={{ width: 40, height: 40, borderRadius: 999, background: "rgba(255,255,255,0.07)", border: 0, color: "#fff", display: "grid", placeItems: "center", padding: 0 }}>
          <I.ChevronLeft size={18}/>
        </button>
        <div style={{ flex: 1, textAlign: "center", fontSize: 11, letterSpacing: 1.6, textTransform: "uppercase", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Отметка состояния</div>
        <span style={{ width: 40 }}/>
      </div>

      {/* Hero — pure orb */}
      <div style={{ position: "relative", zIndex: 2, flex: 1, display: "grid", placeItems: "center", padding: "20px 20px 0", minHeight: 220 }}>
        <div style={{ position: "relative", width: 220, height: 220, display: "grid", placeItems: "center" }}>
          {/* Outer aurora halo */}
          <div aria-hidden style={{
            position: "absolute", inset: -40, borderRadius: "50%",
            background: `radial-gradient(circle, ${tint}80 0%, ${tint}33 35%, transparent 70%)`,
            opacity: 0.85 * pulse, filter: "blur(20px)",
            transform: `scale(${pulse})`, transition: "background 0.6s ease",
          }}/>
          {/* Main orb — same glass orb as the rest of the app */}
          <div style={{ transform: `scale(${breath})`, transition: "transform 0.15s" }}>
            <StateOrb size={196} tint={tintFromMood(tint)} intensity={cur ? 1.3 : 0.7} />
          </div>
        </div>
      </div>

      {/* Headline */}
      <div style={{ position: "relative", zIndex: 2, padding: "0 24px", textAlign: "center" }}>
        <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Manrope', system-ui, sans-serif", fontSize: 30, fontWeight: 600, lineHeight: 1.1, letterSpacing: "-0.6px", minHeight: 36 }}>
          {cur ? cur.t : "Как оно ощущается\u00A0сейчас?"}
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 6, lineHeight: 1.5 }}>
          {cur ? "Выбери другое или сохрани сферу в её цвете." : "Каждый цвет — это состояние. Выбери подходящее."}
        </div>
      </div>

      {/* Orb selector — 6 colored orbs in a row, no emoji */}
      <div style={{ position: "relative", zIndex: 2, padding: "26px 20px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
          {moods.map((m, idx) => {
            const active = picked === idx;
            return (
              <button key={idx} onClick={() => setPicked(idx)} className="tap" aria-label={m.t} style={{
                background: "transparent", border: 0, padding: "6px 2px 8px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                color: "#fff", cursor: "pointer",
              }}>
                <span aria-hidden style={{
                  borderRadius: "50%",
                  boxShadow: active ? `0 0 0 2px #fff, 0 0 18px ${m.c}aa` : "none",
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

      {/* Consistency bonus strip */}
      <div style={{ position: "relative", zIndex: 2, margin: "18px 20px 0", padding: "12px 14px",
        background: "rgba(255,255,255,0.045)", borderRadius: 16,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{ width: 36, height: 36, borderRadius: 999, background: "rgba(254,222,52,0.14)", display: "grid", placeItems: "center", color: "#FEDE34", fontSize: 18 }}>✨</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>Бонус за постоянство</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 3, lineHeight: 1.35 }}>
            {sameStateStreak >= 2
              ? <>{sameStateStreak} дн. подряд в состоянии <b>{cur?.t}</b> · +{sameStateStreak * 10} XP, если продолжишь.</>
              : <>Серия отметок {streak} дн. · отметься завтра ради +{bonusXP + 10} XP.</>}
          </div>
        </div>
      </div>

      {/* Save bar */}
      <div style={{ position: "relative", zIndex: 2, padding: "14px 20px 28px" }}>
        <button onClick={onSave} disabled={picked < 0} className="tap" style={{
          width: "100%",
          background: picked < 0 ? "rgba(255,255,255,0.08)" : "#fff",
          color: picked < 0 ? "rgba(255,255,255,0.4)" : "#0a0a0a",
          border: 0, borderRadius: 999, padding: 16, fontSize: 15, fontWeight: 600, letterSpacing: "-0.1px",
          transition: "all 0.2s",
        }}>
          {picked < 0 ? "Выбери состояние" : "Сохранить отметку"}
        </button>
      </div>
    </div>
  );
}

/* Darken a hex color by amount (0–1) — used to deepen orb gradients. */
function darken(hex, amt = 0.4) {
  if (!hex || hex[0] !== "#") return "#222";
  let h = hex.slice(1);
  if (h.length === 3) h = h.split("").map(c => c + c).join("");
  const n = parseInt(h, 16);
  const r = Math.max(0, ((n >> 16) & 255) * (1 - amt)) | 0;
  const g = Math.max(0, ((n >> 8) & 255) * (1 - amt)) | 0;
  const b = Math.max(0, (n & 255) * (1 - amt)) | 0;
  return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
}

/* JOURNAL / DAILY REFLECTION */
function JournalScreen() {
  const { navigate } = useNav();
  const [a, setA] = useM(""); const [b, setB] = useM(""); const [c, setC] = useM("");
  const past = [
    { date: "27 апр", w: "Сохранил серию даже после долгого дня.", g: "Не гнать себя во второй половине дня." },
    { date: "26 апр", w: "Помог Нику с пробежкой.", g: "Читать 30 минут перед сном." },
    { date: "25 апр", w: "Заметил, что спокойнее в групповые дни.", g: "Спланировать завтра сегодня вечером." },
  ];
  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title="Ежедневная рефлексия" onBack={() => navigate("home")} />
      <div style={{ background: "#fff", borderRadius: 22, padding: 18, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
        <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1.4, fontWeight: 600 }}>28 апр · Вторник</div>
        <div className="section-label" style={{ marginTop: 16, color: "var(--text-2)" }}>Что прошло хорошо?</div>
        <textarea value={a} onChange={e=>setA(e.target.value)} placeholder="Максимум три строки."
          style={{ width: "100%", background: "var(--surface-3)", border: 0, borderRadius: 12, padding: 12, marginTop: 8, fontSize: 14, fontFamily: "inherit", outline: 0, minHeight: 70, resize: "none" }}/>
        <div className="section-label" style={{ marginTop: 16, color: "var(--text-2)" }}>Что помешало?</div>
        <textarea value={b} onChange={e=>setB(e.target.value)} placeholder="Одно честное предложение."
          style={{ width: "100%", background: "var(--surface-3)", border: 0, borderRadius: 12, padding: 12, marginTop: 8, fontSize: 14, fontFamily: "inherit", outline: 0, minHeight: 70, resize: "none" }}/>
        <div className="section-label" style={{ marginTop: 16, color: "var(--text-2)" }}>Одна вещь на завтра</div>
        <textarea value={c} onChange={e=>setC(e.target.value)} placeholder="Чем меньше, тем лучше."
          style={{ width: "100%", background: "var(--surface-3)", border: 0, borderRadius: 12, padding: 12, marginTop: 8, fontSize: 14, fontFamily: "inherit", outline: 0, minHeight: 70, resize: "none" }}/>
      </div>
      <button className="bos-btn" style={{ marginTop: 16 }} onClick={() => navigate("home")}>Сохранить · +15 XP</button>
      <div className="section-label" style={{ marginTop: 22 }}>Прошлые записи</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        {past.map((p, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 14, padding: 14, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 12, color: "var(--text-4)", fontWeight: 600 }}>{p.date}</div>
            <div style={{ fontSize: 14, marginTop: 6, color: "var(--text-2)" }}><b>Победа:</b> {p.w}</div>
            <div style={{ fontSize: 14, marginTop: 4, color: "var(--text-3)" }}><b>Завтра:</b> {p.g}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* FOCUS SESSION — pomodoro-ish */
function FocusScreen() {
  const { navigate, params } = useNav();
  const h = params?.habit || { emoji: "🧘🏼‍♀️", name: "Медитация" };
  const [secs] = useM(15 * 60);
  const m = Math.floor(secs/60).toString().padStart(2,"0");
  const s = (secs%60).toString().padStart(2,"0");
  return (
    <div className="page-in" style={{ height: "100%", color: "#fff", display: "flex", flexDirection: "column", padding: "0 16px 24px" }}>
      <PageHeader title="" onBack={() => navigate("habits")} dark right={
        <button className="tap" style={{ background: "transparent", border: 0, color: "#9f9fa9", fontSize: 13 }}>Завершить</button>
      }/>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div style={{ fontSize: 50, marginBottom: 30 }}>{h.emoji}</div>
        <div style={{ fontSize: 14, color: "#9f9fa9", marginBottom: 8 }}>{h.name}</div>
        <div style={{ width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,222,52,0.12), transparent 70%)", display: "grid", placeItems: "center", border: "2px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize: 56, fontWeight: 300, letterSpacing: "-2px", fontVariantNumeric: "tabular-nums" }}>{m}:{s}</div>
        </div>
        <div style={{ fontSize: 12, color: "#9f9fa9", marginTop: 24, letterSpacing: 1.2, textTransform: "uppercase", fontWeight: 600 }}>Фокус · 15 мин</div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 20 }}>
        <button className="tap" style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: 0, color: "#fff", display: "grid", placeItems: "center" }}>
          <I.Refresh size={20}/>
        </button>
        <button className="tap" style={{ width: 76, height: 76, borderRadius: "50%", background: "#fff", border: 0, display: "grid", placeItems: "center" }}>
          <I.Play size={28} color="#0a0a0a"/>
        </button>
        <button className="tap" style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: 0, color: "#fff", display: "grid", placeItems: "center" }}>
          <I.Volume size={20}/>
        </button>
      </div>
    </div>
  );
}

/* LEVEL-UP modal screen — celebratory in-app moment */
function LevelUpScreen() {
  const { navigate } = useNav();
  return (
    <div className="page-in" style={{ height: "100%", color: "#fff", display: "flex", flexDirection: "column", padding: 24, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 30%, rgba(255,222,52,0.25), transparent 60%)" }}/>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", position: "relative" }}>
        <div style={{ fontSize: 12, color: "#FEDE34", textTransform: "uppercase", letterSpacing: 2, fontWeight: 700 }}>Новый уровень</div>
        <div style={{ fontSize: 110, fontWeight: 800, letterSpacing: "-4px", lineHeight: 1, marginTop: 6, background: "linear-gradient(135deg,#FEDE34,#EF9F14)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>8</div>
        <div style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>Сосредоточенный</div>
        <div style={{ fontSize: 14, color: "#9f9fa9", marginTop: 14, maxWidth: 280, lineHeight: 1.5 }}>
          Ты заработал <b style={{ color: "#FEDE34" }}>+250 кредитов</b> и открыл новый уровень наград.
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
          {["🔥","🏆","✨"].map((e,i)=>(<span key={i} style={{ width: 50, height: 50, borderRadius: 14, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", display: "grid", placeItems: "center", fontSize: 26 }}>{e}</span>))}
        </div>
      </div>
      <button onClick={() => navigate("levels")} className="tap" style={{ background: "#FEDE34", color: "#0a0a0a", border: 0, borderRadius: 999, padding: 16, fontSize: 16, fontWeight: 600 }}>
        Забрать награды
      </button>
      <button onClick={() => navigate("home")} className="tap" style={{ background: "transparent", color: "#9f9fa9", border: 0, padding: 12, fontSize: 13, marginTop: 6 }}>Продолжить</button>
    </div>
  );
}

/* AI CHAT — rich conversational coach with structured AI replies */

/* Tiny calm sphere — same blue DNA as intro/AI orb. No asset image, no glow. */
function ChatSphere({ size = 28 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "radial-gradient(circle at 32% 28%, #ffffff 0%, #cfe1ff 18%, #8eb0d8 50%, #2c4d76 85%, #0a1424 100%)",
      boxShadow: "inset -2px -3px 5px rgba(0,0,0,0.25)",
    }}/>
  );
}

/* Bar chart used inside an AI insight bubble */
function MiniBars({ data, color = "#0a0a0a", height = 60, textMuted = "rgba(0,0,0,0.5)", barIdle = "rgba(0,0,0,0.12)" }) {
  const max = Math.max(...data.map(d => d.v));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height, marginTop: 10 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{
            width: "100%", borderRadius: 4,
            height: (d.v / max) * (height - 16),
            background: d.h ? color : barIdle,
            transition: "height 0.4s",
          }} />
          <div style={{ fontSize: 9, color: textMuted, letterSpacing: 0.5 }}>{d.l}</div>
        </div>
      ))}
    </div>
  );
}

function AIChatScreen() {
  const { navigate, params } = useNav();
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

  // Each message: { who, kind, t, ...cardData }
  const [msgs, setMsgs] = useM([
    { who: "ai", kind: "greeting", t: "Доброе утро, Тим ☀️" },
    { who: "ai", kind: "summary", title: "Сегодня, пока что", body: "Ты прошёл 60%. Состояние: ⚡ Энергия. Осталась одна привычка до полудня — от неё зависит утренняя серия.",
      stats: [{ l: "Готово",  v: "3/5" }, { l: "Серия", v: "12д" }, { l: "Энергия", v: "+92" }] },
    { who: "me", t: "Сегодня мало энергии. Может, просто пропустить пробежку?" },
    { who: "ai", kind: "text", t: "Пропустить — нормально, но не обязательно выбирать между «всё» и «ничего». Хочешь версию поменьше?" },
    { who: "ai", kind: "suggestion", title: "Попробуй вместо этого",
      body: "Замени «утреннюю пробежку» на 7-минутную прогулку. Серия останется, а вечером ты себе скажешь спасибо.",
      action: { label: "Заменить на сегодня", icon: "swap" } },
    { who: "ai", kind: "insight", title: "Паттерны энергии · 7 дней",
      body: "Дни с низкой энергией чаще всего в понедельники. Три из последних четырёх. Перестроить неделю?",
      chart: [
        { l: "Пн", v: 32, h: true }, { l: "Вт", v: 78 }, { l: "Ср", v: 88 }, { l: "Чт", v: 64 },
        { l: "Пт", v: 92 }, { l: "Сб", v: 70 }, { l: "Вс", v: 58 },
      ]},
  ]);
  const [draft, setDraft] = useM("");
  const [typing, setTyping] = useM(false);
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs, typing]);

  const send = (text) => {
    const t = (text ?? draft).trim();
    if (!t) return;
    setMsgs(m => [...m, { who: "me", t }]);
    setDraft("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs(m => [...m, {
        who: "ai", kind: "text",
        t: "Понял. Дай мне секунду — набросаю план, который учитывает энергию сегодняшнего дня."
      }]);
    }, 1400);
  };

  // A prompt passed in from the AI tab / quick chips → auto-send it on open.
  React.useEffect(() => {
    if (!params?.prompt) return;
    const t = window.setTimeout(() => send(params.prompt), 350);
    return () => window.clearTimeout(t);
  }, []); // eslint-disable-line

  const renderAI = (m, i) => {
    if (m.kind === "greeting") {
      return (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-end", animation: "msgIn 0.4s ease both" }}>
          <ChatSphere size={28}/>
          <div style={{ background: TH.aiBubble, border: TH.aiBubbleBorder, borderRadius: 18, borderBottomLeftRadius: 4, padding: "10px 14px", fontSize: 14, color: TH.text }}>{m.t}</div>
        </div>
      );
    }
    if (m.kind === "text") {
      return (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-end", animation: "msgIn 0.4s ease both" }}>
          <ChatSphere size={28}/>
          <div style={{ maxWidth: "78%", background: TH.aiBubble, border: TH.aiBubbleBorder, borderRadius: 18, borderBottomLeftRadius: 4, padding: "10px 14px", fontSize: 14, color: TH.text, lineHeight: 1.45 }}>{m.t}</div>
        </div>
      );
    }
    return (
      <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", animation: "msgIn 0.4s ease both" }}>
        <ChatSphere size={28}/>
        <div style={{
          flex: 1, background: TH.aiCard, border: TH.aiCardBorder,
          borderRadius: 18, borderTopLeftRadius: 4,
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
                <button className="tap" onClick={() => navigate("focus", { habit: { emoji: "👟", name: "7-минутная прогулка" } })} style={{ flex: 1, background: TH.primary, color: TH.primaryFg, border: 0, borderRadius: 12, padding: "10px 14px", fontSize: 13, fontWeight: 600 }}>{m.action.label}</button>
                <button className="tap" style={{ background: TH.skipBg, color: TH.text, border: TH.skipBorder, borderRadius: 12, padding: "10px 14px", fontSize: 13 }}>Пропустить</button>
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
              <button className="tap" style={{ width: "100%", marginTop: 10, background: TH.skipBg, color: TH.text, border: TH.skipBorder, borderRadius: 12, padding: "10px 14px", fontSize: 13, fontWeight: 500 }}>Перенести понедельники →</button>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderMe = (m, i) => (
    <div key={i} style={{ alignSelf: "flex-end", maxWidth: "78%", animation: "msgIn 0.4s ease both" }}>
      <div style={{ background: TH.meBubble, color: TH.meText, borderRadius: 18, borderBottomRightRadius: 4, padding: "10px 14px", fontSize: 14, lineHeight: 1.45, fontWeight: 500 }}>{m.t}</div>
    </div>
  );

  return (
    <div ref={wrapRef} className="page-in" style={{ height: "calc(100% + 90px)", margin: "-60px 0 -30px", color: TH.text, display: "flex", flexDirection: "column", background: TH.bg }}>
      {/* Header — flush, no detached look. No border line. */}
      <div style={{ padding: "62px 16px 12px", display: "flex", alignItems: "center", gap: 12 }}>
        <button className="tap" onClick={() => navigate("ai")} style={{ width: 36, height: 36, background: TH.iconBtn, border: TH.iconBtnBorder, borderRadius: "50%", color: TH.text, display: "grid", placeItems: "center" }}>
          <I.ChevronLeft size={18}/>
        </button>
        <ChatSphere size={36} static/>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.2px" }}>Balance</div>
          <div style={{ fontSize: 11, color: TH.muted, display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#85e3a8" }}/> Слушаю, мягкий голос
          </div>
        </div>
        <button className="tap" style={{ width: 36, height: 36, background: TH.iconBtn, border: TH.iconBtnBorder, borderRadius: "50%", color: TH.text, display: "grid", placeItems: "center" }}>
          <I.More size={18}/>
        </button>
      </div>

      <div ref={scrollRef} className="screen-scroll" style={{ flex: 1, padding: "16px 14px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ alignSelf: "center", fontSize: 10, letterSpacing: 1.5, color: TH.dim, textTransform: "uppercase" }}>Сегодня · 09:14</div>

        {msgs.map((m, i) => m.who === "ai" ? renderAI(m, i) : renderMe(m, i))}

        {typing && (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <ChatSphere size={28}/>
            <div style={{ background: TH.aiBubble, border: TH.aiBubbleBorder, borderRadius: 18, borderBottomLeftRadius: 4, padding: "12px 14px", display: "flex", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: TH.typingDot, animation: "typingDot 1.2s 0s ease-in-out infinite" }}/>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: TH.typingDot, animation: "typingDot 1.2s 0.2s ease-in-out infinite" }}/>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: TH.typingDot, animation: "typingDot 1.2s 0.4s ease-in-out infinite" }}/>
            </div>
          </div>
        )}
      </div>

      {/* Quick prompts */}
      <div style={{ padding: "0 14px 8px", display: "flex", gap: 6, overflowX: "auto" }}>
        {[
          { i: "🌙", t: "Спланируй вечер" },
          { i: "💤", t: "Почему я устал?" },
          { i: "✨", t: "Предложи привычку" },
          { i: "🔄", t: "Помоги перезагрузиться" },
        ].map((s, i) => (
          <button key={i} onClick={() => send(s.t)} className="tap" data-no-haptic style={{ flexShrink: 0, background: TH.chip, border: TH.chipBorder, borderRadius: 999, padding: "8px 14px", fontSize: 12, color: TH.text, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span>{s.i}</span> {s.t}
          </button>
        ))}
      </div>

      {/* Composer — flush, no border line */}
      <div style={{ padding: "10px 14px 16px", display: "flex", gap: 8, alignItems: "center" }}>
        <button className="tap" style={{ width: 40, height: 40, borderRadius: "50%", background: TH.iconBtn, border: TH.iconBtnBorder, color: TH.text, display: "grid", placeItems: "center" }}>
          <I.Plus size={18}/>
        </button>
        <div style={{ flex: 1, background: TH.composer, border: TH.composerBorder, borderRadius: 999, padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
          <input value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Расскажи Balance, как ты себя чувствуешь…" style={{ flex: 1, border: 0, outline: 0, background: "transparent", color: TH.text, fontSize: 14 }}/>
          <button className="tap" style={{ background: "transparent", border: 0, color: TH.muted, padding: 0, display: "grid", placeItems: "center" }}>
            <I.Mic size={16}/>
          </button>
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

Object.assign(window, { HabitDetailScreen, GoalDetailScreen, MoodScreen, JournalScreen, FocusScreen, LevelUpScreen, AIChatScreen });

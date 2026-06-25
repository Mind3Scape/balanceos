/* HABITS — LIVE-only fork of HabitsScreen (real Telegram user, app.mode === "live"
   is ALWAYS true here). Unlike the HOME screen, this screen KEEPS its own
   «Привычки / Цели» segmented switcher (that toggle is correct here), the
   «Быстрое добавление» quick-add chips and the «Обучение» cards — those are not
   demo-only. The only thing the live fork hard-codes is the iOS-weight primary
   typography: the habit NAME and the goal NAME always render at fontWeight 600 +
   color var(--text) (the `_isLive ? …` ternaries collapse to the live branch).
   Everything else reuses the shared core/ toolkit (EMOJI_CHIPS, HabitRing,
   AvatarStack) + the ShareHabitSheetLive fork (shared_live.jsx) + framework (SwipeRow,
   HabitCheck, I, hooks useApp/useNav/useSheet). The ONLY new top-level
   declaration in this file is `function HabitsLive`. */
function HabitsLive() {
  const { navigate } = useNav();
  const { open: openSheet } = useSheet();
  const app = useApp();
  // Real Telegram user → iOS-weight primary labels are ALWAYS on here.
  const wrapRef = React.useRef(null);
  const [isDark, setIsDark] = React.useState(false);
  React.useEffect(() => {
    const el = wrapRef.current; if (!el) return;
    let n = el.parentElement;
    while (n && !n.classList.contains("theme-light") && !n.classList.contains("theme-dark")) n = n.parentElement;
    setIsDark(!!(n && n.classList.contains("theme-dark")));
  }, []);

  // Theme tokens — solid surfaces, NO borders. Match Home dark style.
  const TH = isDark ? {
    cardBg: "linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
    chipBg: "rgba(255,255,255,0.06)",
    chipBd: "0",
    iconBg: "rgba(255,255,255,0.08)",
    divider: "rgba(255,255,255,0.06)",
    chipText: "var(--text)",
    plusIcon: "rgba(255,255,255,0.5)",
    pillBg: "rgba(255,255,255,0.06)",
    addBtnBg: "#fff", addBtnFg: "#0a0a0a",
    playBtnBg: "#fff", playBtnFg: "#0a0a0a",
  } : {
    cardBg: "#fff",
    chipBg: "#fff",
    chipBd: "1px solid rgba(0,0,0,0.05)",
    iconBg: "var(--surface-3)",
    divider: "var(--line)",
    chipText: "var(--text-2)",
    plusIcon: "#999",
    pillBg: "#e8e8e8",
    addBtnBg: "#0a0a0a", addBtnFg: "#fff",
    playBtnBg: "var(--text-2)", playBtnFg: "#fff",
  };
  const cardShadow = isDark ? "none" : "0 1px 2px rgba(0,0,0,0.04)";

  const [tab, setTab] = React.useState("habits");
  // Shared store — same list the Home screen reads/writes.
  const habits = app?.habits || [];
  const goals = app?.goals || [];
  const toggle = app?.toggleHabit || (() => {});
  const remove = app?.removeHabit || (() => {});
  const rowBg = isDark ? "#141414" : "#ffffff"; // opaque so swipe actions stay hidden until revealed

  return (
    <div ref={wrapRef} className="page-in" style={{ padding: "0 12px 24px" }}>
      {/* Page header removed (experiment) — the «Привычки / Цели» control below
          already names the context; the tab bar shows the section. */}

      {/* Quick add chips — flush, no panel */}
      <div data-tour="presets" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 600, marginBottom: 8, padding: "0 4px" }}>Быстрое добавление</div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch", touchAction: "pan-x", margin: "0 -12px", padding: "0 12px 2px" }}>
          {EMOJI_CHIPS.map((c,i)=>(
            <button key={i} className="tap" data-no-haptic onClick={() => navigate("habit-settings", { mode: "create", preset: c })} style={{
              background: TH.chipBg, borderRadius: 999, padding: "8px 12px", fontSize: 13,
              color: TH.chipText, border: TH.chipBd,
              display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", flexShrink: 0,
              boxShadow: cardShadow,
            }}>
              <span style={{ fontSize: 15, lineHeight: 1 }}>{c.i}</span>
              {c.t} <I.Plus size={12} color={TH.plusIcon}/>
            </button>
          ))}
        </div>
      </div>

      {/* Tabs + Add button */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div className="tab-pill" style={{ background: TH.pillBg, flex: 1 }}>
          <button className={"tap " + (tab === "habits" ? "active" : "")} onClick={() => setTab("habits")}>Привычки</button>
          <button className={"tap " + (tab === "goals" ? "active" : "")} onClick={() => setTab("goals")}>Цели</button>
        </div>
        <button data-tour="add" onClick={() => navigate(tab === "habits" ? "habit-settings" : "goal-settings", { mode: "create" })} className="tap"
          title={tab === "habits" ? "Добавить привычку" : "Добавить цель"}
          style={{ width: 44, height: 44, borderRadius: 999, background: TH.addBtnBg, color: TH.addBtnFg, border: 0, display: "grid", placeItems: "center", boxShadow: isDark ? "none" : "0 4px 14px rgba(0,0,0,0.18)" }}>
          <I.Plus size={18} strokeWidth={2.2}/>
        </button>
      </div>

      {/* Habit / Goal list — unified card with dividers */}
      {tab === "habits" ? (
        habits.length === 0 ? (
          <button className="tap" onClick={() => navigate("habit-settings", { mode: "create" })} style={{ marginTop: 12, width: "100%", background: TH.cardBg, border: 0, borderRadius: 22, padding: "34px 20px", boxShadow: cardShadow, color: "var(--text)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10 }}>
            <span style={{ width: 54, height: 54, borderRadius: 14, background: TH.iconBg, display: "grid", placeItems: "center", fontSize: 27 }}>🌱</span>
            <div style={{ fontSize: 17, fontWeight: 600 }}>Здесь будут твои привычки</div>
            <div style={{ fontSize: 13.5, color: "var(--text-4)", lineHeight: 1.45, maxWidth: 250 }}>Начни с одной маленькой. Её можно делать одному или вместе с друзьями.</div>
            <span style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 6, background: TH.addBtnBg, color: TH.addBtnFg, borderRadius: 999, padding: "10px 18px", fontSize: 14.5, fontWeight: 600 }}><I.Plus size={16} strokeWidth={2.5}/> Создать привычку</span>
          </button>
        ) : (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8, color: "var(--text)" }}>
          {habits.map((h) => (
            <div key={h.id} style={{ borderRadius: 22, overflow: "hidden", boxShadow: cardShadow }}>
              <SwipeRow rowBg={rowBg} dark={isDark} actions={[
                { key: "share", tone: "share", label: "Поделиться", icon: I.Share, onAction: () => openSheet(<ShareHabitSheetLive habit={h} dark={isDark} />) },
                { key: "del", tone: "delete", label: "Удалить", icon: I.Trash, onAction: () => remove(h.id) },
              ]}>
                <div className="tap"
                  onClick={() => navigate("habit-detail", { habit: h, from: "habits" })}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px" }}>
                  <span style={{ width: 40, height: 40, borderRadius: 14, background: h.color ? h.color + "26" : TH.iconBg, display: "grid", placeItems: "center", fontSize: 20, flexShrink: 0 }}>{h.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.2px" }}>{h.name}</div>
                    {(h.friends?.length || h.duration) && (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 3, flexWrap: "wrap", fontSize: 11, color: "var(--text-4)" }}>
                        {h.duration && <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><I.Clock size={11}/> {h.duration} мин</span>}
                        {h.friends?.length > 0 && <AvatarStack people={h.friends} size={16} max={3} label={false}/>}
                        {h.friends?.length > 0 && <span>совместно</span>}
                      </div>
                    )}
                  </div>
                  {h.duration && !h.done && (
                    <HabitRing habit={h} dark={isDark} onComplete={() => { if (!h.done) toggle(h.id); }} />
                  )}
                  <HabitCheck done={h.done} onToggle={() => toggle(h.id)} xp={10} />
                </div>
              </SwipeRow>
            </div>
          ))}
        </div>
        )
      ) : (
        goals.length === 0 ? (
          <button className="tap" onClick={() => navigate("goal-settings", { mode: "create" })} style={{ marginTop: 12, width: "100%", background: TH.cardBg, border: 0, borderRadius: 22, padding: "34px 20px", boxShadow: cardShadow, color: "var(--text)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10 }}>
            <span style={{ width: 54, height: 54, borderRadius: 14, background: TH.iconBg, display: "grid", placeItems: "center", fontSize: 27 }}>🎯</span>
            <div style={{ fontSize: 17, fontWeight: 600 }}>Пока нет целей</div>
            <div style={{ fontSize: 13.5, color: "var(--text-4)", lineHeight: 1.45, maxWidth: 250 }}>Цель — это вершина, к которой ведут твои привычки. Поставь первую.</div>
            <span style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 6, background: TH.addBtnBg, color: TH.addBtnFg, borderRadius: 999, padding: "10px 18px", fontSize: 14.5, fontWeight: 600 }}><I.Plus size={16} strokeWidth={2.5}/> Поставить цель</span>
          </button>
        ) : (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8, color: "var(--text)" }}>
          {goals.map((g) => {
            const pct = g.target > 0 ? g.current / g.target : 0;
            return (
              <div key={g.id} style={{ borderRadius: 22, overflow: "hidden", boxShadow: cardShadow, background: TH.cardBg }}>
                <button className="tap" onClick={() => navigate("goal-detail", { goal: g, from: "habits" })}
                  style={{ width: "100%", background: "transparent", border: 0, padding: "14px 16px", textAlign: "left", color: "var(--text)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ width: 40, height: 40, borderRadius: 14, background: TH.iconBg, display: "grid", placeItems: "center", fontSize: 20, flexShrink: 0 }}>{g.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15.5, color: "var(--text)", letterSpacing: "-0.2px", fontWeight: 600 }}>{g.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 3, display: "flex", gap: 10 }}>
                        <span>{g.current} / {g.target} {g.unit}</span>
                        <span>·</span>
                        <span>до {g.deadline}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-2)", flexShrink: 0 }}>{Math.round(pct * 100)}%</span>
                  </div>
                  <div className="bos-progress" style={{ marginTop: 10 }}><span style={{ width: (Math.min(1, pct) * 100) + "%" }}/></div>
                </button>
              </div>
            );
          })}
        </div>
        )
      )}

      {/* Knowledge cards — clickable */}
      <div className="section-label" style={{ marginTop: 22, padding: "0 4px" }}>Обучение</div>
      <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { topic: "habits-basics", emoji: "🌱", t: "Основы привычек", d: "5 мин", b: "Почему маленькое лучше большого — и как не пропускать дважды." },
          { topic: "goals-101",     emoji: "🎯", t: "Ставь хорошие цели", d: "5 мин", b: "Результат или процесс: что отслеживать и когда." },
        ].map((c, i) => (
          <button key={i} onClick={() => navigate("info", { topic: c.topic })} className="tap"
            style={{
              background: TH.cardBg, border: 0, borderRadius: 22, padding: 16, textAlign: "left",
              boxShadow: cardShadow, position: "relative", overflow: "hidden",
              display: "flex", flexDirection: "column", gap: 8, minHeight: 144, color: "var(--text)",
            }}>
            <div style={{ width: 38, height: 38, borderRadius: 14, background: TH.iconBg, display: "grid", placeItems: "center", fontSize: 20 }}>{c.emoji}</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", lineHeight: 1.2 }}>{c.t}</div>
            <div style={{ fontSize: 12, color: "var(--text-4)", lineHeight: 1.45 }}>{c.b}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", fontSize: 11, color: "var(--text-4)" }}>
              <span>{c.d} чтения</span>
              <I.ChevronRight size={14}/>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

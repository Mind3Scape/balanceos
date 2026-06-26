/* HABITS — LIVE-only fork of HabitsScreen (real Telegram user, app.mode === "live"
   is ALWAYS true here). Unlike the HOME screen, this screen KEEPS its own
   «Привычки / Цели» segmented switcher (that toggle is correct here), the
   «Быстрое добавление» quick-add chips and the «Обучение» cards — those are not
   demo-only. The only thing the live fork hard-codes is the iOS-weight primary
   typography: the habit NAME and the goal NAME always render at fontWeight 600 +
   color var(--text) (the `_isLive ? …` ternaries collapse to the live branch).
   Everything else reuses the shared core/ toolkit (EMOJI_CHIPS, HabitRing,
   AvatarStack) + the shared_live.jsx forks (ShareHabitSheetLive, HabitWeekStrip +
   bosHabitColor/BOS_APPLE_COLORS) + framework (SwipeRow, HabitCheck, I, hooks
   useApp/useNav/useSheet). The ONLY new top-level declaration in this file is
   `function HabitsLive`. */
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

  // «Обучение» cards can be hidden once read (David) — persisted, restorable from Settings.
  const [learnHidden, setLearnHidden] = React.useState(() => (typeof bosLearnHidden === "function" ? bosLearnHidden() : false));
  React.useEffect(() => {
    const sync = () => setLearnHidden(typeof bosLearnHidden === "function" ? bosLearnHidden() : false);
    window.addEventListener("bos:learnchange", sync);
    return () => window.removeEventListener("bos:learnchange", sync);
  }, []);
  const hideLearn = () => { if (typeof bosSetLearnHidden === "function") bosSetLearnHidden(true); setLearnHidden(true); };
  const showLearn = () => { if (typeof bosSetLearnHidden === "function") bosSetLearnHidden(false); setLearnHidden(false); };
  // Shared store — same list the Home screen reads/writes.
  const habits = app?.habits || [];
  const goals = app?.goals || [];
  const toggle = app?.toggleHabit || (() => {});
  const remove = app?.removeHabit || (() => {});
  const removeGoal = app?.removeGoal || (() => {});
  const rowBg = isDark ? "#141414" : "#ffffff"; // opaque so swipe actions stay hidden until revealed
  // The floating «+» is the ONE universal create entry — it opens a small menu (B1).
  const [createOpen, setCreateOpen] = React.useState(false);
  const addBtnRef = React.useRef(null);

  return (
    <div ref={wrapRef} className="page-in" style={{ padding: "0 12px 24px" }}>
      <CreateMenuLive open={createOpen} onClose={() => setCreateOpen(false)} anchorRef={addBtnRef} navigate={navigate} />
      {/* Page header removed (experiment) — the «Привычки / Цели» control below
          already names the context; the tab bar shows the section. */}

      {/* Quick-add «хэштеги» with the primary «+» LIFTED onto the same row. The chips
          scroll sideways and tuck UNDER the floating black «+»: a constant radial mask
          fades anything inside the button's radius to opacity, so the «+» always reads
          crisp on top while the tags slide beneath it (David). The old Привычки/Цели
          switcher is gone — both sections now stack below like on the Home screen. */}
      <div data-tour="presets" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 600, marginBottom: 8, padding: "0 4px" }}>Быстрое добавление</div>
        <div style={{ position: "relative" }}>
          <div style={{
            display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch", touchAction: "pan-x",
            padding: "3px 52px 3px 4px",
            WebkitMaskImage: "radial-gradient(circle at calc(100% - 22px) 50%, transparent 30px, #000 50px)",
            maskImage: "radial-gradient(circle at calc(100% - 22px) 50%, transparent 30px, #000 50px)",
          }}>
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
          {/* The black «+» — primary add (a new habit). Pinned over the right edge of the
              tag row; the radial mask above keeps the chips clear of it as they scroll. */}
          <button ref={addBtnRef} data-tour="add" onClick={() => { setCreateOpen(true); if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} } }} className="tap"
            title="Создать" aria-haspopup="menu" aria-expanded={createOpen}
            style={{ position: "absolute", top: "50%", right: 0, transform: "translateY(-50%)", width: 44, height: 44, borderRadius: 999, background: TH.addBtnBg, color: TH.addBtnFg, border: 0, display: "grid", placeItems: "center", boxShadow: isDark ? "0 2px 10px rgba(0,0,0,0.5)" : "0 3px 10px rgba(0,0,0,0.12)" }}>
            <I.Plus size={18} strokeWidth={2.2} style={{ transition: "transform 0.34s cubic-bezier(0.34,1.5,0.4,1)", transform: createOpen ? "rotate(45deg)" : "none" }}/>
          </button>
        </div>
      </div>

      {/* Привычки — labelled section, always shown. The switcher is gone; both
          sections stack like on Home (David: «сначала привычки, потом цели»). */}
      <div className="section-label" style={{ marginTop: 2, color: "var(--text-3)", padding: "0 4px" }}>Привычки</div>
      {habits.length === 0 ? (
          <button className="tap" onClick={() => navigate("habit-settings", { mode: "create" })} style={{ marginTop: 10, width: "100%", background: TH.cardBg, border: 0, borderRadius: 22, padding: "34px 20px", boxShadow: cardShadow, color: "var(--text)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10 }}>
            <span style={{ width: 54, height: 54, borderRadius: 16, background: TH.iconBg, display: "grid", placeItems: "center", fontSize: 27 }}>🌱</span>
            <div style={{ fontSize: 17, fontWeight: 600 }}>Здесь будут твои привычки</div>
            <div style={{ fontSize: 13.5, color: "var(--text-4)", lineHeight: 1.45, maxWidth: 250 }}>Начни с одной маленькой. Её можно делать одному или вместе с друзьями.</div>
            <span style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 6, background: TH.addBtnBg, color: TH.addBtnFg, borderRadius: 999, padding: "10px 18px", fontSize: 14.5, fontWeight: 600 }}><I.Plus size={16} strokeWidth={2.5}/> Создать привычку</span>
          </button>
      ) : (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8, color: "var(--text)" }}>
          {habits.map((h) => (
            <div key={h.id} style={{ borderRadius: 22, overflow: "hidden", boxShadow: cardShadow }}>
              <SwipeRow rowBg={rowBg} dark={isDark} actions={[
                { key: "share", tone: "share", label: "Поделиться", icon: I.Share, onAction: () => openSheet(<ShareHabitSheetLive habit={h} dark={isDark} />) },
                { key: "del", tone: "delete", label: "Удалить", icon: I.Trash, onAction: () => remove(h.id) },
              ]}>
                <div className="tap"
                  onClick={() => navigate("habit-detail", { habit: h, from: "habits" })}
                  style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ width: 40, height: 40, borderRadius: 14, background: h.color ? h.color + "26" : TH.iconBg, display: "grid", placeItems: "center", fontSize: 20, flexShrink: 0 }}>{bosIcon(h.emoji, 22, h.color)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.2px" }}>{h.name}</div>
                      {(h.friends?.length > 0 || h.duration > 0) && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, fontSize: 11, color: "var(--text-4)" }}>
                          {h.duration > 0 && <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><I.Clock size={11}/> {h.duration} мин</span>}
                          {h.duration > 0 && h.friends?.length > 0 && <span>·</span>}
                          {h.friends?.length > 0 && <span>вместе</span>}
                        </div>
                      )}
                    </div>
                    {h.duration > 0 && !h.done && !(h.goalPerDay > 1) && (
                      <HabitRing habit={h} dark={isDark} onComplete={() => { if (!h.done) toggle(h.id); }} />
                    )}
                    {h.goalPerDay > 1
                      ? <HabitCountCheck habit={h} app={app} xp={10} />
                      : <HabitCheck done={h.done} onToggle={() => toggle(h.id)} xp={10} float />}
                  </div>
                  {/* NEW (v235): week-strip Пн→Вс + co-op avatars. Home card stays compact — this
                      richer bottom row lives only on the Привычки page (David). */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 12 }}>
                    <HabitWeekStrip habit={h} />
                    {h.friends?.length > 0 && <AvatarStack people={h.friends} size={22} max={4} label={false}/>}
                  </div>
                </div>
              </SwipeRow>
            </div>
          ))}
        </div>
      )}

      {/* Цели — labelled section. No own «+»: every create (habit / goal / team) goes
          through the ONE black «+» at the top (CreateMenuLive). David: «всё добавляется
          плюсиком сверху — у целей лишний». The empty-state card below still offers the
          first goal as a full CTA (not a redundant «+»). */}
      <div className="section-label" style={{ marginTop: 16, color: "var(--text-3)", padding: "0 4px" }}>Цели</div>
      {goals.length === 0 ? (
          <button className="tap" onClick={() => navigate("goal-settings", { mode: "create" })} style={{ marginTop: 10, width: "100%", background: TH.cardBg, border: 0, borderRadius: 22, padding: "34px 20px", boxShadow: cardShadow, color: "var(--text)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10 }}>
            <span style={{ width: 54, height: 54, borderRadius: 16, background: TH.iconBg, display: "grid", placeItems: "center", fontSize: 27 }}>🎯</span>
            <div style={{ fontSize: 17, fontWeight: 600 }}>Пока нет целей</div>
            <div style={{ fontSize: 13.5, color: "var(--text-4)", lineHeight: 1.45, maxWidth: 250 }}>Цель — это вершина, к которой ведут твои привычки. Поставь первую.</div>
            <span style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 6, background: TH.addBtnBg, color: TH.addBtnFg, borderRadius: 999, padding: "10px 18px", fontSize: 14.5, fontWeight: 600 }}><I.Plus size={16} strokeWidth={2.5}/> Поставить цель</span>
          </button>
      ) : (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8, color: "var(--text)" }}>
          {goals.map((g) => {
            const pct = g.target > 0 ? g.current / g.target : 0;
            return (
              <div key={g.id} style={{ borderRadius: 22, overflow: "hidden", boxShadow: cardShadow, background: TH.cardBg }}>
                <SwipeRow rowBg={rowBg} dark={isDark} actions={[
                  { key: "share", tone: "share", label: "Поделиться", icon: I.Share, onAction: () => openSheet(<ShareGoalSheetLive goal={g} dark={isDark} />) },
                  { key: "del", tone: "delete", label: "Удалить", icon: I.Trash, onAction: () => removeGoal(g.id) },
                ]}>
                <button className="tap" onClick={() => navigate("goal-detail", { goal: g, from: "habits" })}
                  style={{ width: "100%", background: "transparent", border: 0, padding: "14px 16px", textAlign: "left", color: "var(--text)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ width: 40, height: 40, borderRadius: 14, background: g.color ? g.color + "26" : TH.iconBg, display: "grid", placeItems: "center", fontSize: 20, flexShrink: 0 }}>{bosIcon(g.emoji, 20, g.color)}</span>
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
                  <div className="bos-progress" style={{ marginTop: 10 }}><span style={{ width: (Math.min(1, pct) * 100) + "%", background: "linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0) 72%), " + (g.color || "#0a0a0a") }}/></div>
                </button>
                </SwipeRow>
              </div>
            );
          })}
        </div>
      )}

      {/* Knowledge cards — 3 guides (habits / goals / teams), no reading-time.
          Collapsible: «Скрыть» tucks the cards away but leaves a slim «Раскрыть»
          header so it's one tap to bring them back (David). The Settings toggle
          «Карточки обучения» flips the same flag. */}
      {!learnHidden ? (<>
      <div className="section-label" style={{ marginTop: 16, padding: "0 4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>Обучение</span>
        <button onClick={hideLearn} className="tap" data-no-haptic aria-label="Скрыть обучение"
          style={{ background: "transparent", border: 0, color: "var(--text-4)", fontSize: 13, fontWeight: 600, padding: "2px 2px", textTransform: "none", letterSpacing: 0, lineHeight: 1, display: "inline-flex", alignItems: "center", gap: 4 }}>
          Скрыть <span style={{ display: "inline-flex", transform: "rotate(-90deg)" }}><I.ChevronRight size={13}/></span>
        </button>
      </div>
      <div style={{ display: "flex", gap: 10, overflowX: "auto", margin: "8px -12px 0", padding: "0 28px 4px 16px", scrollbarWidth: "none" }}>
        {[
          { topic: "habits-basics", emoji: "🌱", accent: "#34C759", t: "Основы привычек", b: "Почему маленькое сильнее большого — и как не пропускать дважды." },
          { topic: "goals-101",     emoji: "🎯", accent: "#FF9500", t: "Хорошие цели", b: "Результат или процесс: что отслеживать и когда." },
          { topic: "teams-101",     emoji: "🤝", accent: "#0A84FF", t: "Командные привычки", b: "Один общий якорь, общая серия и поддержка вместо контроля." },
        ].map((c, i) => (
          <button key={i} onClick={() => navigate("info", { topic: c.topic })} className="tap"
            style={{
              flexShrink: 0, width: 168, background: TH.cardBg, border: 0, borderRadius: 22, padding: 16, textAlign: "left",
              boxShadow: cardShadow, position: "relative", overflow: "hidden",
              display: "flex", flexDirection: "column", gap: 8, minHeight: 150, color: "var(--text)",
            }}>
            {/* b&w theme — neutral tile + neutral «Читать», no coloured corner circle (David). */}
            <div style={{ width: 38, height: 38, borderRadius: 14, background: "var(--surface-3)", display: "grid", placeItems: "center", fontSize: 20, position: "relative" }}>{c.emoji}</div>
            <div style={{ fontSize: 15.5, fontWeight: 600, color: "var(--text)", lineHeight: 1.2, position: "relative" }}>{c.t}</div>
            <div style={{ fontSize: 12, color: "var(--text-4)", lineHeight: 1.45, position: "relative" }}>{c.b}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: "auto", fontSize: 12, fontWeight: 600, color: "var(--text-3)", position: "relative" }}>
              Читать <I.ChevronRight size={13}/>
            </div>
          </button>
        ))}
      </div>
      </>) : (
        <button onClick={showLearn} className="tap" data-no-haptic aria-label="Раскрыть обучение"
          style={{ marginTop: 22, width: "100%", background: "transparent", border: 0, padding: "0 4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span className="section-label" style={{ color: "var(--text-3)" }}>Обучение</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--text-4)", fontSize: 13, fontWeight: 600 }}>
            Раскрыть <span style={{ display: "inline-flex", transform: "rotate(90deg)" }}><I.ChevronRight size={13}/></span>
          </span>
        </button>
      )}
    </div>
  );
}

/* HABITS — LIVE-only fork of HabitsScreen (real Telegram user, app.mode === "live"
   is ALWAYS true here). Redesigned (David) so the whole screen reads as ONE block
   language (iOS-26 «всё в блоках»):
     1. «Быстрое добавление» — chips + the black universal «+» wrapped in ONE white
        block (the «+» opens CreateMenuLive → Привычку / Цель / Команду).
     2. A TRIAD segmented switcher «Привычки · Цели · Команды» sits DIRECTLY UNDER
        that block and swaps the page between the three lists. No big duplicate title,
        no «Сегодня» section labels — the triad already names the context (David).
        «Команды» reuses LiveTeamCard (from community_live.jsx) so teams you created /
        joined also live here, not only on the Сообщество tab (coexist for now).
     3. «Обучение» is a THIN disclosure block: a slim header row when collapsed, it
        expands in place into a full block of 3 guide rows. Reuses bosLearnHidden so the
        Settings toggle still flips it.
   The live fork hard-codes the iOS-weight primary typography (habit / goal NAME at
   fontWeight 600 + var(--text)). Everything else reuses the shared core/ toolkit
   (EMOJI_CHIPS, HabitRing, AvatarStack) + shared_live.jsx (CreateMenuLive,
   ShareHabitSheetLive, HabitWeekStrip, bosTileGlass/BOS_TILE_SHEEN, HabitBuddyAvatarsLive)
   + community_live.jsx (LiveTeamCard) + framework (SwipeRow, HabitCheck, I, hooks).
   New top-level names in this file: `function HabitsLive`, `_bosHabitsTab`,
   `_bosSetHabitsTab` (the active-triad-tab memory, survives navigate-in-and-back). */
var _bosHabitsTab = (function () { try { var v = localStorage.getItem("bos:habitsTab") || "habits"; return v === "teams" ? "goals" : v; } catch (e) { return "habits"; } })(); /* «teams»-вкладки больше нет (круги в «Целях») → коэрсим устаревший выбор в goals, иначе пустой экран */
function _bosSetHabitsTab(t) { _bosHabitsTab = t; try { localStorage.setItem("bos:habitsTab", t); } catch (e) {} }

// Quick-add presets per triad tab (David: «при переключении на Цели/Команды всплывают подходящие
// пилюли»). Habits reuse the shared EMOJI_CHIPS; goals & teams get their own context presets.
//   GOAL preset → {i,t,target,unit,deadline} seeds goal-settings.
//   TEAM preset → {i,t,accent,goalType,goalTitle,target,unit} seeds team-create. Three themes:
//   семья · челленджи для друзей · личностный рост.
const GOAL_CHIPS = [
  { i: "🏃", t: "Пробежать марафон", target: 42, unit: "км", deadline: "1 год" },
  { i: "📚", t: "Прочитать 12 книг", target: 12, unit: "книг", deadline: "1 год" },
  { i: "💪", t: "Прийти в форму", target: 12, unit: "недель", deadline: "Месяц" },
  { i: "🧘", t: "100 дней практики", target: 100, unit: "дней", deadline: "Месяц" },
  { i: "🗣️", t: "Выучить язык", target: 6, unit: "месяцев", deadline: "1 год" },
  { i: "💰", t: "Накопить подушку", target: 6, unit: "месяцев", deadline: "1 год" },
  { i: "🚭", t: "Бросить курить", target: 90, unit: "дней", deadline: "Месяц" },
];
const TEAM_CHIPS = [
  // вклад в окружение (David: фокус на вклад, не «семейные дела»)
  { i: "🤝", t: "Вклад в окружение", accent: "#E59B9B", goalType: "collective", goalTitle: "Добрые дела", target: 50, unit: "дел" },
  { i: "🫶", t: "Забота о близких", accent: "#F0A24E", goalType: "collective", goalTitle: "Тёплые дела", target: 30, unit: "дел" },
  // челленджи для друзей
  { i: "🔥", t: "30 дней спорта", accent: "#F0564C", goalType: "streak", goalTitle: "Спорт каждый день", target: 30, unit: "дней" },
  { i: "🏁", t: "Беговой вызов", accent: "#19B89B", goalType: "race", goalTitle: "100 км бега", target: 100, unit: "км" },
  { i: "💧", t: "Без сахара вместе", accent: "#54C3E4", goalType: "streak", goalTitle: "Дни без сахара", target: 21, unit: "дней" },
  // личностный рост
  { i: "🧘", t: "Осознанность", accent: "#7F9AF2", goalType: "collective", goalTitle: "Минуты медитации", target: 1000, unit: "мин" },
  { i: "📖", t: "Книжный клуб", accent: "#8676E6", goalType: "collective", goalTitle: "Прочитано глав", target: 100, unit: "глав" },
];

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
    chipBg: "rgba(255,255,255,0.08)",
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
    chipBg: "#F1F1F5",
    chipBd: "0",
    iconBg: "var(--surface-3)",
    divider: "var(--line)",
    chipText: "var(--text-2)",
    plusIcon: "#aaa",
    pillBg: "#e8e8e8",
    addBtnBg: "#0a0a0a", addBtnFg: "#fff",
    playBtnBg: "var(--text-2)", playBtnFg: "#fff",
  };
  const cardShadow = isDark ? "none" : "0 1px 2px rgba(0,0,0,0.04)";

  // «Обучение» can be collapsed (David) — persisted, also flipped from Settings.
  const [learnHidden, setLearnHidden] = React.useState(() => (typeof bosLearnHidden === "function" ? bosLearnHidden() : false));
  React.useEffect(() => {
    const sync = () => setLearnHidden(typeof bosLearnHidden === "function" ? bosLearnHidden() : false);
    window.addEventListener("bos:learnchange", sync);
    return () => window.removeEventListener("bos:learnchange", sync);
  }, []);
  const toggleLearn = () => {
    const next = !learnHidden;
    if (typeof bosSetLearnHidden === "function") bosSetLearnHidden(next);
    setLearnHidden(next);
    if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} }
  };

  // Shared store — same lists the Home / Community screens read/write.
  const habits = app?.habits || [];
  const goals = app?.goals || [];
  const teams = app?.teams || [];
  const toggle = app?.toggleHabit || (() => {});
  const remove = app?.removeHabit || (() => {});
  const removeGoal = app?.removeGoal || (() => {});
  const rowBg = isDark ? "#141414" : "#ffffff"; // opaque so swipe actions stay hidden until revealed

  // TRIAD — which of Привычки / Цели / Команды is shown. Kept in a module var so it
  // survives navigating into a detail screen and back (the screen remounts).
  const [tab, setTabState] = React.useState(_bosHabitsTab);
  const setTab = (t) => { _bosSetHabitsTab(t); setTabState(t); if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} } };

  // The black «+» is the ONE universal create entry — it opens a small menu (Привычку / Цель / Команду).
  const [createOpen, setCreateOpen] = React.useState(false);
  const addBtnRef = React.useRef(null);

  // «Быстрое добавление» now sits ABOVE the triad (David) and its chips FOLLOW the active tab:
  // Привычки → habit presets, Цели → goal presets, Команды → team presets. The chips re-mount on
  // tab change (key={tab}) so they pop in (briefPop). Each chip routes to the matching create screen
  // with its preset (habit-settings / goal-settings / team-create).
  // Цели = личные цели + круги (бывшие команды) ВМЕСТЕ. Пресеты слиты в один набор: чип-цель →
  // goal-settings, чип-круг (есть goalType) → team-create. Чипы-круги помечены лицами (тихий намёк
  // «совместный»), чтобы слитый набор читался без отдельной вкладки «Команды».
  const QA = tab === "goals"
    ? { chips: GOAL_CHIPS.concat(TEAM_CHIPS), go: (c) => (c && c.goalType) ? navigate("team-create", { preset: c }) : navigate("goal-settings", { mode: "create", preset: c }) }
    : { chips: EMOJI_CHIPS, go: (c) => navigate("habit-settings", { mode: "create", preset: c }) };
  const quickAddBlock = (
    <div style={{ background: TH.cardBg, borderRadius: 20, boxShadow: cardShadow, padding: "12px 13px" }}>
      <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 600, marginBottom: 9, padding: "0 2px" }}>Быстрое добавление</div>
      <div key={tab} style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch", touchAction: "pan-x", padding: "3px 2px" }}>
        {QA.chips.map((c, i) => (
          <button key={i} className="tap" data-no-haptic onClick={() => QA.go(c)} style={{
            ...(typeof bosChipGlass === "function" ? bosChipGlass(isDark) : { background: TH.chipBg }), borderRadius: 999, padding: "8px 12px", fontSize: 13, color: TH.chipText, border: 0,
            display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", flexShrink: 0,
            animation: "briefPop 0.4s cubic-bezier(0.22,0.9,0.3,1.2) both " + (i * 0.035) + "s",
          }}>
            <span style={{ fontSize: 15, lineHeight: 1 }}>{c.i}</span>{c.t} {c.goalType ? <I.Users size={11} color={TH.plusIcon}/> : <I.Plus size={12} color={TH.plusIcon}/>}
          </button>
        ))}
      </div>
    </div>
  );

  // ДИАДА (David): «Команды» исчезли как отдельная вкладка. Круги (бывшие команды) = совместные
  // цели, живут среди «Целей» с лицами. Остаётся Привычки / Цели.
  const TRIAD = [{ id: "habits", t: "Привычки" }, { id: "goals", t: "Цели" }];

  return (
    <div ref={wrapRef} className="page-in" style={{ padding: "0 12px 24px" }}>
      <CreateMenuLive open={createOpen} onClose={() => setCreateOpen(false)} anchorRef={addBtnRef} navigate={navigate} />

      {/* «Быстрое добавление» ABOVE the triad (David) — its chips follow the active tab. */}
      <div style={{ marginBottom: 12 }}>{quickAddBlock}</div>

      {/* TRIAD switcher + the universal «+» on ONE row (David). The «+» opens CreateMenuLive
          (Привычку / Цель / Команду), so it no longer lives on «Быстрое добавление» — that block
          is now a free, draggable card inside the Привычки list. The triad keeps the iOS segmented
          look (defined grey track #E6E6EA + white floating pill); sharing the row with the «+» it
          still fits all three labels on the narrowest phones. */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div className="tab-pill" style={{ flex: 1, marginBottom: 0, background: isDark ? "rgba(255,255,255,0.07)" : "#E6E6EA" }}>
          {TRIAD.map((s) => (
            <button key={s.id} className={"tap " + (tab === s.id ? "active" : "")} onClick={() => setTab(s.id)}
              style={{ fontSize: 14, fontWeight: tab === s.id ? 600 : 500, letterSpacing: "-0.2px", padding: "11px 4px", boxShadow: tab === s.id ? (isDark ? "0 1px 4px rgba(0,0,0,0.45)" : "0 1px 3px rgba(0,0,0,0.14)") : "none" }}>{s.t}</button>
          ))}
        </div>
        <button ref={addBtnRef} data-tour="add" onClick={() => { setCreateOpen(true); if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} } }} className="tap"
          title="Создать" aria-haspopup="menu" aria-expanded={createOpen}
          style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 999, ...(typeof bosChipGlass === "function" ? bosChipGlass(isDark) : { background: TH.chipBg }), color: isDark ? "#fff" : "var(--text)", border: 0, display: "grid", placeItems: "center" }}>
          <I.Plus size={20} strokeWidth={2.2} style={{ transition: "transform 0.34s cubic-bezier(0.34,1.5,0.4,1)", transform: createOpen ? "rotate(45deg)" : "none" }}/>
        </button>
      </div>

      {/* 3 — the active list. No section labels: the triad above names the context. */}
      {tab === "habits" && (
        habits.length === 0 ? (
          <button className="tap" onClick={() => navigate("habit-settings", { mode: "create" })} style={{ width: "100%", background: TH.cardBg, border: 0, borderRadius: 22, padding: "30px 20px", boxShadow: cardShadow, color: "var(--text)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10 }}>
            <span style={{ width: 54, height: 54, borderRadius: 16, background: TH.iconBg, display: "grid", placeItems: "center", fontSize: 27 }}>🌱</span>
            <div style={{ fontSize: 17, fontWeight: 600 }}>Здесь будут твои привычки</div>
            <div style={{ fontSize: 13.5, color: "var(--text-4)", lineHeight: 1.45, maxWidth: 250 }}>Выбери шаблон выше, нажми «+» или создай свою — одному или вместе с друзьями.</div>
          </button>
        ) : (
          <BosReorderList ids={habits.map((h) => h.id)} onReorder={(o) => { if (app && app.reorderHabits) app.reorderHabits(o); }}
            renderItem={(id, ctx) => {
              const h = habits.find((x) => x.id === id); if (!h) return null;
              const inner = (
                <div className={ctx.mode ? "" : "tap"} onClick={ctx.mode ? undefined : () => navigate("habit-detail", { habit: h, from: "habits" })}
                  style={{ padding: "14px 16px", pointerEvents: ctx.mode ? "none" : "auto" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ width: 40, height: 40, borderRadius: 14, background: BOS_TILE_SHEEN + ", " + (h.color ? h.color + "26" : TH.iconBg), boxShadow: bosTileGlass(isDark), display: "grid", placeItems: "center", fontSize: 20, flexShrink: 0 }}>{bosIcon(h.emoji, 22, h.color)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.2px", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.name}</div>
                        {h.teamHabitId && <span title="Командная привычка" style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 700, color: "var(--text-4)", background: "var(--surface-3)", padding: "2px 7px", borderRadius: 999 }}><I.Users size={10}/> Командная</span>}
                      </div>
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
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 12 }}>
                    <HabitWeekStrip habit={h} />
                    <HabitBuddyAvatarsLive habit={h} size={22} max={5} />
                  </div>
                </div>
              );
              if (ctx.mode) return <div style={{ borderRadius: 22, overflow: "hidden", boxShadow: cardShadow, background: rowBg }}>{inner}</div>;
              return (
                <div style={{ borderRadius: 22, overflow: "hidden", boxShadow: cardShadow }}>
                  <SwipeRow rowBg={rowBg} dark={isDark} actions={[
                    { key: "share", tone: "share", label: "Поделиться", icon: I.Share, onAction: () => openSheet(<ShareHabitSheetLive habit={h} dark={isDark} />) },
                    { key: "del", tone: "delete", label: "Удалить", icon: I.X, onAction: () => bosConfirmDelete(openSheet, { title: "Удалить привычку?", message: "«" + h.name + "» и вся история отметок удалятся навсегда.", confirmLabel: "Удалить", onConfirm: () => remove(h.id) }) },
                  ]}>
                    {inner}
                  </SwipeRow>
                </div>
              );
            }} />
        )
      )}

      {tab === "goals" && (
        (goals.length === 0 && teams.length === 0) ? (
          <button className="tap" onClick={() => navigate("goal-settings", { mode: "create" })} style={{ width: "100%", background: TH.cardBg, border: 0, borderRadius: 22, padding: "34px 20px", boxShadow: cardShadow, color: "var(--text)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10 }}>
            <span style={{ width: 54, height: 54, borderRadius: 16, background: TH.iconBg, display: "grid", placeItems: "center", fontSize: 27 }}>🎯</span>
            <div style={{ fontSize: 17, fontWeight: 600 }}>Пока нет целей</div>
            <div style={{ fontSize: 13.5, color: "var(--text-4)", lineHeight: 1.45, maxWidth: 250 }}>Цель — это вершина, к которой ведут твои привычки. Поставь первую.</div>
            <span style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 6, background: TH.addBtnBg, color: TH.addBtnFg, borderRadius: 999, padding: "10px 18px", fontSize: 14.5, fontWeight: 600 }}><I.Plus size={16} strokeWidth={2.5}/> Поставить цель</span>
          </button>
        ) : (
          <>
          {goals.length > 0 && (<BosReorderList ids={goals.map((g) => g.id)} onReorder={(o) => { if (app && app.reorderGoals) app.reorderGoals(o); }}
            renderItem={(id, ctx) => {
              const g = goals.find((x) => x.id === id); if (!g) return null;
              const pct = g.target > 0 ? g.current / g.target : 0;
              const inner = (
                <div className={ctx.mode ? "" : "tap"} onClick={ctx.mode ? undefined : () => navigate("goal-detail", { goal: g, from: "habits" })}
                  style={{ padding: "14px 16px", textAlign: "left", color: "var(--text)", pointerEvents: ctx.mode ? "none" : "auto" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ width: 40, height: 40, borderRadius: 14, background: BOS_TILE_SHEEN + ", " + (g.color ? g.color + "26" : TH.iconBg), boxShadow: bosTileGlass(isDark), display: "grid", placeItems: "center", fontSize: 20, flexShrink: 0 }}>{bosIcon(g.emoji, 20, g.color)}</span>
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
                  {/* Лица круга — общая цель носит те же лица, что и привычка-вместе (единый маркёр). */}
                  {typeof HabitBuddyAvatarsLive === "function" && <div style={{ marginTop: 10 }}><HabitBuddyAvatarsLive habit={g} size={22} max={5} /></div>}
                </div>
              );
              if (ctx.mode) return <div style={{ borderRadius: 22, overflow: "hidden", boxShadow: cardShadow, background: TH.cardBg }}>{inner}</div>;
              return (
                <div style={{ borderRadius: 22, overflow: "hidden", boxShadow: cardShadow, background: TH.cardBg }}>
                  <SwipeRow rowBg={rowBg} dark={isDark} actions={[
                    { key: "share", tone: "share", label: "Поделиться", icon: I.Share, onAction: () => openSheet(<ShareGoalSheetLive goal={g} dark={isDark} />) },
                    { key: "del", tone: "delete", label: "Удалить", icon: I.X, onAction: () => bosConfirmDelete(openSheet, { title: "Удалить цель?", message: "«" + g.name + "» удалится навсегда.", confirmLabel: "Удалить", onConfirm: () => removeGoal(g.id) }) },
                  ]}>
                    {inner}
                  </SwipeRow>
                </div>
              );
            }} />)}
          {/* Круги (бывшие команды) — совместные цели живут ЗДЕСЬ ЖЕ, среди целей, с лицами;
              тап по карточке → комната-орбита круга. Отдельной вкладки «Команды» больше нет. */}
          {teams.length > 0 && (
            <div style={{ marginTop: goals.length ? 12 : 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {teams.map((t) => <LiveTeamCard key={t._id} t={t} navigate={navigate} />)}
            </div>
          )}
          <button onClick={() => navigate("team-create")} className="tap team-new-cta" style={{ marginTop: 12, width: "100%", color: "#fff", border: 0, borderRadius: 22, padding: 18, display: "flex", alignItems: "center", gap: 14, textAlign: "left" }}>
            <span style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,222,52,0.15)", display: "grid", placeItems: "center" }}><I.Plus size={22} color="#FEDE34"/></span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 16 }}>Создать круг</div>
              <div style={{ fontSize: 12, opacity: 0.65, marginTop: 2 }}>Общая цель с друзьями — позови людей, и у цели появятся лица круга.</div>
            </div>
            <I.ChevronRight size={18}/>
          </button>
          </>
        )
      )}

      {/* «Обучение» — a THIN disclosure block: a slim header row when collapsed, it expands
          in place into 3 guide rows. Reuses bosLearnHidden (Settings toggle flips the same flag). */}
      <div style={{ marginTop: 16, background: TH.cardBg, borderRadius: 18, boxShadow: cardShadow, overflow: "hidden" }}>
        <button onClick={toggleLearn} className="tap" data-no-haptic aria-expanded={!learnHidden} aria-label={learnHidden ? "Раскрыть обучение" : "Свернуть обучение"}
          style={{ width: "100%", background: "transparent", border: 0, padding: "13px 15px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 11, fontSize: 14.5, fontWeight: 600, color: "var(--text-2)" }}>
            <span style={{ width: 30, height: 30, borderRadius: 10, background: TH.iconBg, display: "grid", placeItems: "center", fontSize: 16 }}>🎓</span>
            Обучение
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--text-4)", fontSize: 13, fontWeight: 500 }}>
            {learnHidden ? "Раскрыть" : "Свернуть"}
            <span style={{ display: "inline-flex", transform: learnHidden ? "rotate(90deg)" : "rotate(-90deg)", transition: "transform 0.3s cubic-bezier(0.34,1.3,0.4,1)" }}><I.ChevronRight size={14}/></span>
          </span>
        </button>
        {!learnHidden && (
          <div style={{ padding: "0 13px 6px" }}>
            {[
              { topic: "habits-basics", emoji: "🌱", t: "Основы привычек", b: "Почему маленькое сильнее большого — и как не пропускать дважды." },
              { topic: "goals-101",     emoji: "🎯", t: "Хорошие цели", b: "Результат или процесс: что отслеживать и когда." },
              { topic: "teams-101",     emoji: "🤝", t: "Командные привычки", b: "Один общий якорь, общая серия и поддержка вместо контроля." },
            ].map((c, i) => (
              <button key={i} onClick={() => navigate("info", { topic: c.topic })} className="tap"
                style={{ width: "100%", background: "transparent", border: 0, borderTop: i ? "1px solid " + TH.divider : "0", padding: "12px 4px", display: "flex", alignItems: "center", gap: 12, textAlign: "left", color: "var(--text)" }}>
                <span style={{ width: 36, height: 36, borderRadius: 12, background: TH.iconBg, display: "grid", placeItems: "center", fontSize: 18, flexShrink: 0 }}>{c.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text)" }}>{c.t}</div>
                  <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2, lineHeight: 1.4 }}>{c.b}</div>
                </div>
                <I.ChevronRight size={15} color="var(--text-4)"/>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

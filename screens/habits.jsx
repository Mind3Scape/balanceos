/* HABITS & GOALS screen + HABIT SETTINGS (create/edit) */
const { useState: useHS } = React;

const EMOJI_CHIPS = [
  { i: "☀️", t: "Подъём в 5:00" }, { i: "🤸🏼‍♀️", t: "Йога" }, { i: "📖", t: "Чтение" },
  { i: "🙏", t: "Помощь" }, { i: "🧭", t: "Вклад в миссию" }, { i: "⌨️", t: "Кодинг" },
  { i: "🦶", t: "10 000 шагов" }, { i: "🚭", t: "Не курить" }, { i: "🌚", t: "Сон в 21:00" },
  { i: "👟", t: "Бег" }, { i: "🧁", t: "Без сахара" }, { i: "📞", t: "Чаще звонить родителям" },
];

/* Avatar stack — small face pile showing who else is doing this habit */
const AVATAR_PALETTE = ["#a8b9d4","#e8c8a8","#a8d4e8","#d4b8e8","#b8e8c8","#e8b8b8","#c8c8e8"];
function AvatarStack({ people = [], size = 18, max = 3, label = true }) {
  if (!people.length) return null;
  const visible = people.slice(0, max);
  const overflow = people.length - visible.length;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <div style={{ display: "flex" }}>
        {visible.map((p, i) => (
          <div key={i} title={p.name} style={{
            width: size, height: size, borderRadius: "50%",
            background: p.color || AVATAR_PALETTE[i % AVATAR_PALETTE.length],
            border: "1.5px solid #fff", marginLeft: i ? -size*0.35 : 0,
            display: "grid", placeItems: "center",
            fontSize: size * 0.5, fontWeight: 700, color: "rgba(0,0,0,0.55)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
          }}>{p.initials || p.name?.[0]}</div>
        ))}
        {overflow > 0 && (
          <div style={{
            width: size, height: size, borderRadius: "50%",
            background: "var(--surface-3, #e9e9e9)", border: "1.5px solid #fff",
            marginLeft: -size*0.35, display: "grid", placeItems: "center",
            fontSize: size * 0.42, fontWeight: 700, color: "var(--text-3, #555)",
          }}>+{overflow}</div>
        )}
      </div>
      {label && <span style={{ fontSize: 11, color: "var(--text-4, #71717a)" }}>с {people[0].name.split(" ")[0]}{people.length > 1 ? ` +${people.length-1}` : ""}</span>}
    </div>
  );
}

function HabitsScreen() {
  const { navigate } = useNav();
  const wrapRef = React.useRef(null);
  const [isDark, setIsDark] = useHS(false);
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

  const [tab, setTab] = useHS("habits");
  const [habits, setHabits] = useHS([
    { id: 1, emoji: "🙏", name: "Помогать другим", done: true,  friends: [{name:"Анна",initials:"А",color:"#e8c8a8"},{name:"Марк",initials:"М",color:"#a8b9d4"}] },
    { id: 2, emoji: "🧘🏼‍♀️", name: "Медитация", done: true, duration: 10, friends: [{name:"Лена",initials:"Л",color:"#d4b8e8"},{name:"Вик",initials:"В",color:"#a8d4e8"},{name:"Том",initials:"Т",color:"#b8e8c8"}] },
    { id: 3, emoji: "🏃🏼‍♀️", name: "Утренняя пробежка", done: true, duration: 25, friends: [{name:"Анна",initials:"А",color:"#e8c8a8"}] },
    { id: 4, emoji: "📚", name: "Читать книгу", done: false, duration: 20 },
    { id: 5, emoji: "✍🏼", name: "Бумажный дневник", done: false, duration: 5 },
    { id: 6, emoji: "🥊", name: "Бокс", done: true, duration: 30, friends: [{name:"Марк",initials:"М",color:"#a8b9d4"}] },
    { id: 7, emoji: "🥗", name: "Здоровое питание", done: true },
  ]);
  const [goals, setGoals] = useHS([
    { id: 1, emoji: "🥊", name: "100 раундов бокса", current: 62, target: 100, unit: "раундов", deadline: "1 авг" },
    { id: 2, emoji: "📖", name: "Прочитать 24 книги",      current: 8,  target: 24,  unit: "книг",  deadline: "31 дек" },
    { id: 3, emoji: "🎯", name: "Пробежать марафон",     current: 4,  target: 22,  unit: "недель",  deadline: "14 окт" },
    { id: 4, emoji: "🧘🏼‍♀️", name: "300 дней медитации", current: 187, target: 300, unit: "дней", deadline: "в след. году" },
  ]);
  const toggle = id => setHabits(h => h.map(x => x.id === id ? { ...x, done: !x.done } : x));

  return (
    <div ref={wrapRef} className="page-in" style={{ padding: "0 12px 24px" }}>
      {/* Page header */}
      <div style={{ padding: "4px 4px 12px" }}>
        <div style={{ fontSize: 12, color: "var(--text-4)", letterSpacing: 0.4 }}>Твой день</div>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.6px", color: "var(--text)", marginTop: 2, fontFamily: "var(--bos-title-font)" }}>Практика</div>
      </div>

      {/* Quick add chips — flush, no panel */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 600, marginBottom: 8, padding: "0 4px" }}>Быстрое добавление</div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", margin: "0 -12px", padding: "0 12px 2px" }}>
          {EMOJI_CHIPS.map((c,i)=>(
            <button key={i} className="tap" onClick={() => navigate("habit-settings", { mode: "create", preset: c })} style={{
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
        <button onClick={() => navigate(tab === "habits" ? "habit-settings" : "goal-settings", { mode: "create" })} className="tap"
          title={tab === "habits" ? "Добавить привычку" : "Добавить цель"}
          style={{ width: 44, height: 44, borderRadius: 999, background: TH.addBtnBg, color: TH.addBtnFg, border: 0, display: "grid", placeItems: "center", boxShadow: isDark ? "none" : "0 4px 14px rgba(0,0,0,0.18)" }}>
          <I.Plus size={18} strokeWidth={2.2}/>
        </button>
      </div>

      {/* Habit / Goal list — unified card with dividers */}
      {tab === "habits" ? (
        <div style={{ marginTop: 12, background: TH.cardBg, borderRadius: 22, overflow: "hidden", boxShadow: cardShadow, color: "var(--text)" }}>
          {habits.map((h, idx) => (
            <div key={h.id}>
              <div className="tap"
                onClick={() => navigate("habit-settings", { mode: "edit", habit: h })}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px" }}>
                <span style={{ width: 40, height: 40, borderRadius: 12, background: TH.iconBg, display: "grid", placeItems: "center", fontSize: 20, flexShrink: 0 }}>{h.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, color: "var(--text-2)", letterSpacing: "-0.2px" }}>{h.name}</div>
                  {(h.friends?.length || h.duration) && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 3, flexWrap: "wrap", fontSize: 11, color: "var(--text-4)" }}>
                      {h.duration && <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><I.Clock size={11}/> {h.duration} мин</span>}
                      {h.friends?.length > 0 && <AvatarStack people={h.friends} size={16} max={3} label={false}/>}
                      {h.friends?.length > 0 && <span>совместно</span>}
                    </div>
                  )}
                </div>
                {h.duration && !h.done && (
                  <button className="tap" onClick={(e) => { e.stopPropagation(); navigate("focus", { habit: h }); }}
                    style={{ width: 30, height: 30, borderRadius: "50%", background: TH.playBtnBg, border: 0, color: TH.playBtnFg, display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <I.Play size={11}/>
                  </button>
                )}
                <button className={"check-btn " + (h.done ? "" : "unchecked")}
                  onClick={(e) => { e.stopPropagation(); toggle(h.id); }}>
                  {h.done && <I.Check size={18} strokeWidth={2.5} color="#fff" />}
                </button>
              </div>
              {idx < habits.length - 1 && <div style={{ height: 1, background: TH.divider }} />}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ marginTop: 12, background: TH.cardBg, borderRadius: 22, overflow: "hidden", boxShadow: cardShadow, color: "var(--text)" }}>
          {goals.map((g, idx) => {
            const pct = g.current / g.target;
            return (
              <div key={g.id}>
                <button className="tap" onClick={() => navigate("goal-settings", { mode: "edit", goal: g })}
                  style={{ width: "100%", background: "transparent", border: 0, padding: "14px 16px", textAlign: "left", color: "var(--text)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ width: 40, height: 40, borderRadius: 12, background: TH.iconBg, display: "grid", placeItems: "center", fontSize: 20, flexShrink: 0 }}>{g.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15.5, color: "var(--text-2)", letterSpacing: "-0.2px", fontWeight: 500 }}>{g.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 3, display: "flex", gap: 10 }}>
                        <span>{g.current} / {g.target} {g.unit}</span>
                        <span>·</span>
                        <span>до {g.deadline}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-2)", flexShrink: 0 }}>{Math.round(pct * 100)}%</span>
                  </div>
                  <div className="bos-progress" style={{ marginTop: 10 }}><span style={{ width: (pct * 100) + "%" }}/></div>
                </button>
                {idx < goals.length - 1 && <div style={{ height: 1, background: TH.divider }} />}
              </div>
            );
          })}
        </div>
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
            <div style={{ width: 38, height: 38, borderRadius: 12, background: TH.iconBg, display: "grid", placeItems: "center", fontSize: 20 }}>{c.emoji}</div>
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

function HabitSettingsScreen() {
  const { navigate, params } = useNav();
  const editing = params?.mode === "edit";
  const [name, setName] = useHS(editing ? params.habit.name : "Прогулка");
  const [iconPick, setIconPick] = useHS(editing ? params.habit.emoji : "👟");
  const [color, setColor] = useHS("#0a0a0a");
  const [goal, setGoal] = useHS(1);
  const [reminderOn, setReminderOn] = useHS(true);
  const [type, setType] = useHS("build");

  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title={editing ? "Изменить привычку" : "Новая привычка"} onBack={() => navigate("habits")} />
      {/* Name */}
      <div className="section-label">Название</div>
      <input className="bos-input" value={name} onChange={e => setName(e.target.value)} style={{ marginTop: 8 }} />

      {/* Icon and color */}
      <div className="section-label" style={{ marginTop: 22 }}>Иконка и цвет</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
        <button className="tap" onClick={() => navigate("icon-picker", { current: iconPick, onPick: "habit-icon" })}
          style={{ background: "#fff", border: 0, borderRadius: 16, padding: 12, display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          <div style={{ width: 50, height: 50, borderRadius: 12, background: "var(--surface-3)", display: "grid", placeItems: "center", fontSize: 26 }}>{iconPick}</div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontWeight: 500, fontSize: 16 }}>{name || "Привычка"}</div>
            <div style={{ fontSize: 13, color: "var(--text-4)" }}>Иконка</div>
          </div>
        </button>
        <button className="tap" onClick={() => {}}
          style={{ background: "#fff", border: 0, borderRadius: 16, padding: 12, display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          <div style={{ width: 50, height: 50, borderRadius: 12, background: color }} />
          <div style={{ textAlign: "left" }}>
            <div style={{ fontWeight: 500, fontSize: 16 }}>Оникс</div>
            <div style={{ fontSize: 13, color: "var(--text-4)" }}>Цвет</div>
          </div>
        </button>
      </div>

      {/* Goal */}
      <div className="section-label" style={{ marginTop: 22 }}>Цель</div>
      <div style={{ background: "#fff", borderRadius: 18, padding: 16, marginTop: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 600 }}>{goal} {goal === 1 ? "раз" : "раз(а)"}</div>
            <div style={{ fontSize: 13, color: "var(--text-4)" }}>или больше в день</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setGoal(Math.max(1, goal - 1))} className="tap" style={{ width: 32, height: 32, borderRadius: 999, background: "var(--surface-3)", border: 0 }}>−</button>
            <button onClick={() => setGoal(goal + 1)} className="tap" style={{ width: 32, height: 32, borderRadius: 999, background: "var(--surface-3)", border: 0 }}>＋</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <span className="chip"><I.Refresh size={14} /> Ежедневно</span>
          <span className="chip"><I.Calendar size={14} /> Каждый день</span>
        </div>
      </div>

      {/* Reminders */}
      <div className="section-label" style={{ marginTop: 22 }}>Напоминания</div>
      <div style={{ background: "#fff", borderRadius: 18, padding: 16, marginTop: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1, fontSize: 14, color: "var(--text-3)", lineHeight: 1.4 }}>
            Не забудь выделить время на тренировку сегодня.
          </div>
          <Switch on={reminderOn} onChange={setReminderOn} />
        </div>
        {reminderOn && (
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <span className="chip"><I.Clock size={14} /> 09:30</span>
            <span className="chip"><I.Bell size={14} /> Каждый день</span>
          </div>
        )}
      </div>
      <button className="tap" style={{ width: "100%", background: "transparent", border: 0, color: "var(--text-2)", padding: 14, fontSize: 15, fontWeight: 500 }}>
        + Добавить напоминание
      </button>

      {/* Share with friend */}
      <div className="section-label" style={{ marginTop: 8 }}>Поделиться с другом</div>
      <div style={{ background: "#fff", borderRadius: 18, padding: 16, marginTop: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, fontSize: 14, color: "var(--text-2)", lineHeight: 1.4 }}>
            Делать это вместе
            <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2 }}>Друзья видят, когда ты отмечаешься. Они могут поддержать или подтолкнуть.</div>
          </div>
          <Switch on={true} onChange={() => {}} />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          {[
            { name: "Анна",  i: "А", c: "#e8c8a8", on: true },
            { name: "Марк",  i: "М", c: "#a8b9d4", on: true },
            { name: "Лена",  i: "Л", c: "#d4b8e8", on: false },
            { name: "Вик",   i: "В", c: "#a8d4e8", on: false },
          ].map((p, i) => (
            <button key={i} className="tap" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 11px 5px 5px", borderRadius: 999,
              background: p.on ? "#0a0a0a" : "var(--surface-3)",
              color: p.on ? "#fff" : "var(--text-3)",
              border: 0, fontSize: 12, fontWeight: 500,
            }}>
              <span style={{ width: 22, height: 22, borderRadius: "50%", background: p.c, display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, color: "rgba(0,0,0,0.55)" }}>{p.i}</span>
              {p.name}
              {p.on && <I.Check size={12} strokeWidth={3}/>}
            </button>
          ))}
          <button className="tap" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "5px 11px", borderRadius: 999,
            background: "transparent", border: "1px dashed rgba(0,0,0,0.18)",
            color: "var(--text-3)", fontSize: 12, fontWeight: 500,
          }}><I.Plus size={12}/> Пригласить</button>
        </div>
      </div>

      {/* Habit type */}
      <div className="section-label" style={{ marginTop: 22 }}>Тип привычки</div>
      <div style={{ marginTop: 8 }}>
        <Segmented value={type} onChange={setType} options={[{ value: "build", label: "Развивать" }, { value: "quit", label: "Бросить" }]} />
      </div>

      {/* Add */}
      <button className="bos-btn light" style={{ marginTop: 28 }} onClick={() => navigate("habits")}>
        {editing ? "Сохранить" : "Добавить привычку"}
      </button>
      {editing && (
        <button className="tap" style={{ width: "100%", background: "transparent", border: 0, color: "var(--accent-red)", padding: 14, marginTop: 6, fontSize: 15 }}>
          Удалить привычку
        </button>
      )}
    </div>
  );
}

window.HabitsScreen = HabitsScreen;
window.HabitSettingsScreen = HabitSettingsScreen;
window.AvatarStack = AvatarStack;

/* ─── GOAL SETTINGS — create / edit a goal ─────────────────────── */
function GoalSettingsScreen() {
  const { navigate, params } = useNav();
  const editing = params?.mode === "edit";
  const g0 = editing ? params.goal : null;
  const [name, setName] = useHS(g0?.name || "Пробежать марафон");
  const [iconPick, setIconPick] = useHS(g0?.emoji || "🎯");
  const [target, setTarget] = useHS(g0?.target || 22);
  const [unit, setUnit] = useHS(g0?.unit || "недель");
  const [deadline, setDeadline] = useHS(g0?.deadline || "14 окт");
  const [linkHabit, setLinkHabit] = useHS(true);

  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title={editing ? "Изменить цель" : "Новая цель"} onBack={() => navigate("habits")} />

      <div className="section-label">Чего ты хочешь</div>
      <input className="bos-input" value={name} onChange={e => setName(e.target.value)} style={{ marginTop: 8 }} placeholder="напр. Пробежать марафон" />

      <div className="section-label" style={{ marginTop: 22 }}>Иконка</div>
      <button className="tap" onClick={() => navigate("icon-picker", { current: iconPick, onPick: "goal-icon" })}
        style={{ marginTop: 8, width: "100%", background: "#fff", border: 0, borderRadius: 16, padding: 12, display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
        <div style={{ width: 50, height: 50, borderRadius: 12, background: "#e8e8e8", display: "grid", placeItems: "center", fontSize: 26 }}>{iconPick}</div>
        <div style={{ textAlign: "left", flex: 1 }}>
          <div style={{ fontWeight: 500, fontSize: 16 }}>{name || "Цель"}</div>
          <div style={{ fontSize: 13, color: "var(--text-4)" }}>Нажми, чтобы изменить</div>
        </div>
        <I.ChevronRight size={18} color="var(--text-4)"/>
      </button>

      <div className="section-label" style={{ marginTop: 22 }}>Цель (значение)</div>
      <div style={{ background: "#fff", borderRadius: 18, padding: 16, marginTop: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input type="text" inputMode="numeric" pattern="[0-9]*" value={target}
            onChange={e => setTarget(parseInt(e.target.value.replace(/\D/g,"")) || 0)}
            className="goal-num"
            style={{ flex: "0 0 90px", fontSize: 28, fontWeight: 700, color: "var(--text)", border: 0, outline: 0, background: "transparent", padding: 0 }}/>
          <input value={unit} onChange={e => setUnit(e.target.value)}
            style={{ flex: 1, minWidth: 0, fontSize: 18, color: "var(--text-3)", border: 0, outline: 0, background: "transparent", padding: "4px 0" }}/>
        </div>
        <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 6 }}>Это будет знаменателем прогресса на карточке цели.</div>
      </div>

      <div className="section-label" style={{ marginTop: 22 }}>Срок</div>
      <div style={{ background: "#fff", borderRadius: 18, padding: "14px 16px", marginTop: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: 12 }}>
        <I.Calendar size={18} color="var(--text-3)"/>
        <input value={deadline} onChange={e => setDeadline(e.target.value)} placeholder="напр. 14 окт"
          style={{ flex: 1, fontSize: 16, border: 0, outline: 0, background: "transparent" }}/>
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
        {["Эта неделя","Этот месяц","3 месяца","1 год"].map((q,i)=>(
          <button key={i} onClick={() => setDeadline(q)} className="tap"
            style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.05)", borderRadius: 999, padding: "6px 12px", fontSize: 12, color: "var(--text-3)" }}>{q}</button>
        ))}
      </div>

      <div className="section-label" style={{ marginTop: 22 }}>Привязать привычку</div>
      <div style={{ background: "#fff", borderRadius: 18, padding: 16, marginTop: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.4 }}>Подкрепи эту цель ежедневной привычкой</div>
            <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2 }}>Каждая отметка автоматически продвигает цель.</div>
          </div>
          <Switch on={linkHabit} onChange={setLinkHabit}/>
        </div>
        {linkHabit && (
          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            {[
              { e: "🏃🏼‍♀️", n: "утренняя пробежка", on: true },
              { e: "🧘🏼‍♀️", n: "медитация", on: false },
              { e: "📚", n: "читать книгу", on: false },
            ].map((h,i)=>(
              <button key={i} className="tap" style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "5px 11px 5px 5px", borderRadius: 999,
                background: h.on ? "#0a0a0a" : "#e8e8e8",
                color: h.on ? "#fff" : "var(--text-3)",
                border: 0, fontSize: 12, fontWeight: 500,
              }}>
                <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#fff", display: "grid", placeItems: "center", fontSize: 13 }}>{h.e}</span>
                {h.n}
                {h.on && <I.Check size={12} strokeWidth={3}/>}
              </button>
            ))}
            <button className="tap" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 11px", borderRadius: 999,
              background: "transparent", border: "1px dashed rgba(0,0,0,0.18)",
              color: "var(--text-3)", fontSize: 12, fontWeight: 500,
            }}><I.Plus size={12}/> Новая привычка</button>
          </div>
        )}
      </div>

      <button className="bos-btn light" style={{ marginTop: 28 }} onClick={() => navigate("habits")}>
        {editing ? "Сохранить" : "Создать цель"}
      </button>
      {editing && (
        <button className="tap" style={{ width: "100%", background: "transparent", border: 0, color: "var(--accent-red)", padding: 14, marginTop: 6, fontSize: 15 }}>
          Удалить цель
        </button>
      )}
    </div>
  );
}

/* ─── INFO SCREEN — knowledge articles ─────────────────────────── */
const INFO_TOPICS = {
  "habits-basics": {
    emoji: "🌱",
    eyebrow: "5 мин чтения",
    title: "Основы привычек",
    lede: "Привычки — это не о силе воли. Это о снижении сопротивления одному маленькому действию — каждый день — пока мозг не перестанет спрашивать «зачем».",
    sections: [
      { i: "1", h: "Сделай крошечным", b: "Если не можешь сделать это в самый худой день — это слишком большое. Две минуты медитации лучше тридцати раз в неделю. Когда привычка закрепится — её можно растить." },
      { i: "2", h: "Привяжи её", b: "Поставь новую привычку поверх того, что уже делаешь: «После того как налью утренний кофе, я напишу одну строку в дневник». Старая привычка становится пусковым сигналом." },
      { i: "3", h: "Отслеживай, чтобы видеть импульс", b: "Серия — это видимое обещание самому себе. Отмечай привычку даже в самый худой день — даже если сделал только мини-версию. Не рви цепочку." },
      { i: "4", h: "Никогда не пропускай дважды", b: "Один срыв — это восстановление. Два — новый паттерн. Если пропустил день, твоя единственная задача завтра — появиться, хотя бы частично. Восстанавливайся, а не начинай заново." },
      { i: "5", h: "Обустрой пространство", b: "Поставь кроссовки у двери. Убери снеки с глаз долой. Привычки живут в окружении — сделай хорошие очевидными, а плохие — незаметными." },
    ],
    pull: "«Ты не поднимаешься до уровня своих целей. Ты падаешь до уровня своих систем.»",
    next: { topic: "goals-101", t: "Ставь хорошие цели", e: "🎯" },
  },
  "goals-101": {
    emoji: "🎯",
    eyebrow: "5 мин чтения",
    title: "Ставь хорошие цели",
    lede: "Цель — это вопрос, на который отвечают твои привычки. Задай вопрос правильно — и ежедневная работа сама знает, что делать.",
    sections: [
      { i: "1", h: "Результат против процесса", b: "«Пробежать марафон» — это результат. «Бегать 4 раза в неделю» — это процесс. Цель-результат задаёт направление; отслеживай процесс, чтобы реально двигаться." },
      { i: "2", h: "Сделай конкретной", b: "«Быть здоровее» — это желание. «Спать 7,5 часов 6 ночей в неделю к июлю» — это цель. Конкретно значит измеримо, со сроком и честно." },
      { i: "3", h: "Разбей на недели", b: "Цель на 12 недель — это просто 12 недельных целей, сложенных вместе. Раздели гору на холмы, которые можно преодолеть за неделю." },
      { i: "4", h: "Привяжи одну привычку", b: "Каждой цели нужна ежедневная опора. Если не можешь назвать привычку, которая продвигает цель, она будет дрейфовать." },
      { i: "5", h: "Празднуй малое", b: "Половина пути — это настоящий рубеж. Признай это. Мозг, который получает награду за усилия, появляется и завтра." },
    ],
    pull: "«Результаты — это мечты. Привычки — это действие.»",
    next: { topic: "habits-basics", t: "Основы привычек", e: "🌱" },
  },
};
function InfoScreen() {
  const { navigate, params } = useNav();
  const topic = INFO_TOPICS[params?.topic] || INFO_TOPICS["habits-basics"];
  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title={topic.title} onBack={() => navigate("habits")} />
      {/* Hero */}
      <div style={{ background: "#fff", borderRadius: 24, padding: "22px 20px", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "#e8e8e8", display: "grid", placeItems: "center", fontSize: 30, marginBottom: 12 }}>{topic.emoji}</div>
        <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1.4, fontWeight: 600 }}>{topic.eyebrow}</div>
        <div style={{ fontFamily: "ui-serif, 'New York', 'Source Serif 4', serif", fontSize: 28, lineHeight: 1.15, letterSpacing: "-0.5px", marginTop: 4, color: "var(--text)" }}>{topic.title}</div>
        <div style={{ fontSize: 15, color: "var(--text-3)", marginTop: 12, lineHeight: 1.55, letterSpacing: "-0.1px" }}>{topic.lede}</div>
      </div>

      {/* Pull quote */}
      <div style={{ background: "#0a0a0a", color: "#fff", borderRadius: 22, padding: "20px 22px", marginTop: 12, position: "relative", overflow: "hidden" }}>
        <div aria-hidden style={{ position: "absolute", top: -10, right: -10, fontSize: 100, opacity: 0.06, fontFamily: "ui-serif, 'New York', 'Source Serif 4', serif", lineHeight: 1 }}>"</div>
        <div style={{ fontFamily: "ui-serif, 'New York', 'Source Serif 4', serif", fontSize: 18, lineHeight: 1.4, position: "relative" }}>{topic.pull}</div>
      </div>

      {/* Numbered sections */}
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {topic.sections.map((s, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 22, padding: 18, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", display: "flex", gap: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#0a0a0a", color: "#fff", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{s.i}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.2px" }}>{s.h}</div>
              <div style={{ fontSize: 14, color: "var(--text-3)", marginTop: 6, lineHeight: 1.55, textWrap: "pretty" }}>{s.b}</div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button onClick={() => navigate(params?.topic === "goals-101" ? "goal-settings" : "habit-settings", { mode: "create" })} className="tap"
        style={{ width: "100%", background: "#0a0a0a", color: "#fff", border: 0, borderRadius: 999, padding: 16, fontSize: 15, fontWeight: 600, marginTop: 18 }}>
        {params?.topic === "goals-101" ? "Поставить цель" : "Создать привычку"}
      </button>

      {/* Up next */}
      {topic.next && (
        <button onClick={() => navigate("info", { topic: topic.next.topic })} className="tap"
          style={{ marginTop: 12, width: "100%", background: "transparent", border: 0, padding: 0, textAlign: "left" }}>
          <div style={{ background: "#fff", borderRadius: 18, padding: 14, display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: "#e8e8e8", display: "grid", placeItems: "center", fontSize: 20 }}>{topic.next.e}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 600 }}>Далее</div>
              <div style={{ fontSize: 15, fontWeight: 500 }}>{topic.next.t}</div>
            </div>
            <I.ChevronRight size={18} color="var(--text-4)"/>
          </div>
        </button>
      )}
    </div>
  );
}

window.GoalSettingsScreen = GoalSettingsScreen;
window.InfoScreen = InfoScreen;

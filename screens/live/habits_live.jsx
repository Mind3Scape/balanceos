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

// Quick-add presets for the active triad tab. Habits reuse the shared EMOJI_CHIPS; the Цели tab gets
// its own GOAL presets → {i,t,target,unit,deadline} seeds goal-settings. КРУГ-пресеты (семья/тренинги/
// челленджи) ПЕРЕЕХАЛИ во вкладку НАЙТИ (CircleStartersShowcaseLive, David: «их место в Найти, не на
// странице привычек») — здесь больше нет TEAM_CHIPS, «Быстрое добавление» на Целях = чистые цели.
const GOAL_CHIPS = [
  { i: "🏃", t: "Пробежать марафон", target: 42, unit: "км", deadline: "1 год" },
  { i: "📚", t: "Прочитать 12 книг", target: 12, unit: "книг", deadline: "1 год" },
  { i: "💪", t: "Прийти в форму", target: 12, unit: "недель", deadline: "Месяц" },
  { i: "🧘", t: "100 дней практики", target: 100, unit: "дней", deadline: "Месяц" },
  { i: "🗣️", t: "Выучить язык", target: 6, unit: "месяцев", deadline: "1 год" },
  { i: "💰", t: "Накопить подушку", target: 6, unit: "месяцев", deadline: "1 год" },
  { i: "🚭", t: "Бросить курить", target: 90, unit: "дней", deadline: "Месяц" },
];

/* Long-press menu for a habit TILE (David: квадратные плитки 2-в-ряд → горизонтальный свайп
   конфликтует с сеткой, поэтому действия живут в шторке-меню). One sheet, three rows: Поделиться /
   Переставить плитки (entering the grid jiggle-mode) / Удалить. «swap» actions open their own sheet
   so we just let openSheet replace this menu (no down-then-up flicker); «leave» closes first. */
function HabitTileMenuLive({ habit, dark, onShare, onReorder, onDelete, kindLabel = "Привычка" }) {
  const { close } = useSheet();
  const swap = (fn) => () => { if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} } if (fn) fn(); };
  const leave = (fn) => () => { if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} } close(); if (fn) fn(); };
  const Row = ({ icon, label, onClick, danger }) => (
    <button onClick={onClick} className="tap" style={{ width: "100%", border: 0, borderRadius: 16, padding: "14px 15px", background: dark ? "rgba(255,255,255,0.06)" : "var(--surface-2)", color: danger ? "#FF3B30" : "var(--text)", display: "flex", alignItems: "center", gap: 13, fontSize: 15.5, fontWeight: 600, textAlign: "left" }}>
      <span style={{ width: 24, display: "grid", placeItems: "center", flexShrink: 0 }}>{icon}</span>
      {label}
    </button>
  );
  const reorderIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 5v14M7 5L4 8M7 5l3 3M17 19V5M17 19l-3-3M17 19l3-3"/></svg>
  );
  const sheen = (typeof BOS_TILE_SHEEN !== "undefined" ? BOS_TILE_SHEEN + ", " : "");
  return (
    <div style={{ padding: "2px 16px 0", color: "var(--text)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "2px 4px 14px" }}>
        <span style={{ width: 40, height: 40, borderRadius: 13, background: sheen + (habit.color ? habit.color + "26" : "var(--surface-3)"), display: "grid", placeItems: "center", fontSize: 20, flexShrink: 0 }}>{bosIcon(habit.emoji, 22, habit.color)}</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 16.5, fontWeight: 700, letterSpacing: "-0.3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{habit.name}</div>
          <div style={{ fontSize: 12.5, color: "var(--text-4)", marginTop: 1 }}>{kindLabel}</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Row icon={<I.Share size={18} />} label="Поделиться" onClick={swap(onShare)} />
        <Row icon={reorderIcon} label="Переставить плитки" onClick={leave(onReorder)} />
        <Row icon={<I.Trash size={18} />} label="Удалить" onClick={swap(onDelete)} danger />
      </div>
      <button onClick={close} className="tap" style={{ width: "100%", marginTop: 10, border: 0, borderRadius: 999, padding: 14, background: dark ? "rgba(255,255,255,0.06)" : "var(--surface-3)", color: "var(--text)", fontSize: 15.5, fontWeight: 600 }}>Отмена</button>
      <div style={{ height: "max(8px, var(--tg-bottom-inset, 0px))" }} />
    </div>
  );
}

// Один ОБЩИЙ порядок для смешанного списка «привычки + цели» (David: «цели появляются среди привычек,
// человек сам расставляет как хочет»). Храним массив ключей "h<id>"/"g<id>" в localStorage; новые
// элементы (которых ещё нет в сохранённом порядке) дописываются в конец в естественном порядке.
function bosLoadPracticeOrder() { try { return JSON.parse(localStorage.getItem("bos:practiceOrder") || "[]") || []; } catch (e) { return []; } }
function bosSavePracticeOrder(keys) { try { localStorage.setItem("bos:practiceOrder", JSON.stringify(keys || [])); } catch (e) {} }

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

  // Привычки и цели — ОДИН смешанный список плиток (David). Переключателя Привычки/Цели больше нет;
  // тип выбирается при создании («+» → Привычку/Круг), а карточки потом стоят вперемешку. orderTick
  // форсит пересборку общего порядка после перетаскивания.
  const [orderTick, setOrderTick] = React.useState(0);

  // The black «+» is the ONE universal create entry — it opens a small menu (Привычку / Цель / Команду).
  const [createOpen, setCreateOpen] = React.useState(false);
  const addBtnRef = React.useRef(null);

  // Habit TILES (2-per-row grid) — long-press opens the tile menu (Поделиться / Переставить / Удалить);
  // «Переставить» flips the grid into jiggle/drag-reorder via this controller ref (set by BosReorderGrid).
  const gridCtl = React.useRef(null);
  const onTileLongPress = (key) => {
    const openReorder = () => { if (gridCtl.current) gridCtl.current.enterReorder(); };
    if (("" + key)[0] === "g") {
      const g = goals.find((x) => ("g" + x.id) === key); if (!g) return;
      openSheet(
        <HabitTileMenuLive habit={g} dark={isDark} kindLabel="Цель"
          onShare={() => openSheet(<ShareGoalSheetLive goal={g} dark={isDark} />)}
          onReorder={openReorder}
          onDelete={() => bosConfirmDelete(openSheet, { title: "Удалить цель?", message: "«" + g.name + "» удалится навсегда.", confirmLabel: "Удалить", onConfirm: () => removeGoal(g.id) })}
        />
      );
      return;
    }
    const h = habits.find((x) => ("h" + x.id) === key); if (!h) return;
    openSheet(
      <HabitTileMenuLive habit={h} dark={isDark}
        onShare={() => openSheet(<ShareHabitSheetLive habit={h} dark={isDark} />)}
        onReorder={openReorder}
        onDelete={() => bosConfirmDelete(openSheet, { title: "Удалить привычку?", message: "«" + h.name + "» и вся история отметок удалятся навсегда.", confirmLabel: "Удалить", onConfirm: () => remove(h.id) })}
      />
    );
  };

  // Смешанный список: привычки + цели в едином порядке (ключи "h<id>"/"g<id>"), отсортированы по
  // сохранённому порядку перестановки; новые элементы — в конец.
  const entries = React.useMemo(() => {
    const all = habits.map((h) => ({ k: "h" + h.id, type: "h", item: h }))
      .concat(goals.map((g) => ({ k: "g" + g.id, type: "g", item: g })));
    const saved = bosLoadPracticeOrder();
    if (saved && saved.length) {
      const pos = {}; saved.forEach((k, i) => { pos[k] = i; });
      return all.map((e, i) => ({ e: e, i: i }))
        .sort((a, b) => (pos[a.e.k] != null ? pos[a.e.k] : 1000 + a.i) - (pos[b.e.k] != null ? pos[b.e.k] : 1000 + b.i))
        .map((x) => x.e);
    }
    return all;
  }, [habits, goals, orderTick]);

  // ПЛИТКА ПРИВЫЧКИ — сверху иконка + галочка/кольцо/счётчик, имя, лица круга, снизу недельная полоска.
  const habitTile = (h, ctx) => (
    <div className={ctx.mode ? "" : "tap"} onClick={ctx.mode ? undefined : () => navigate("habit-detail", { habit: h, from: "habits" })}
      style={{ background: rowBg, borderRadius: 22, boxShadow: cardShadow, padding: "13px 13px 12px", minHeight: 158, display: "flex", flexDirection: "column", pointerEvents: ctx.mode ? "none" : "auto", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <span style={{ width: 38, height: 38, borderRadius: 13, background: BOS_TILE_SHEEN + ", " + (h.color ? h.color + "26" : TH.iconBg), boxShadow: bosTileGlass(isDark), display: "grid", placeItems: "center", fontSize: 19, flexShrink: 0 }}>{bosIcon(h.emoji, 21, h.color)}</span>
        <span onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {h.duration > 0 && !h.done && !(h.goalPerDay > 1) && (
            <HabitRing habit={h} dark={isDark} onComplete={() => { if (!h.done) toggle(h.id); }} />
          )}
          {h.goalPerDay > 1
            ? <HabitCountCheck habit={h} app={app} xp={10} />
            : <HabitCheck done={h.done} onToggle={() => toggle(h.id)} xp={10} float />}
        </span>
      </div>
      <div style={{ marginTop: 10, fontSize: 15, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.2px", lineHeight: 1.25, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{h.name}</div>
      <div style={{ marginTop: 7, display: "flex", alignItems: "center", gap: 6 }}>
        <HabitBuddyAvatarsLive habit={h} size={19} max={4} />
        {typeof CircleFacesLive === "function" && <CircleFacesLive habit={h} size={19} max={4} />}
      </div>
      <div style={{ marginTop: "auto", paddingTop: 12 }}>
        <HabitWeekStrip habit={h} fill />
      </div>
    </div>
  );

  // ПЛИТКА ЦЕЛИ — та же квадратная плитка (David: «цели тоже плитками, единый вид»). Сверху иконка +
  // процент, имя, лица круга (если цель — круг), СНИЗУ — полоска прогресса к цели (зеркало недельной).
  const goalTile = (g, ctx) => {
    const pct = g.target > 0 ? Math.min(1, (g.current || 0) / g.target) : 0;
    const gc = g.color || "#0a0a0a";
    return (
      <div className={ctx.mode ? "" : "tap"} onClick={ctx.mode ? undefined : () => navigate("goal-detail", { goal: g, from: "habits" })}
        style={{ background: rowBg, borderRadius: 22, boxShadow: cardShadow, padding: "13px 13px 12px", minHeight: 158, display: "flex", flexDirection: "column", pointerEvents: ctx.mode ? "none" : "auto", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <span style={{ width: 38, height: 38, borderRadius: 13, background: BOS_TILE_SHEEN + ", " + (g.color ? g.color + "26" : TH.iconBg), boxShadow: bosTileGlass(isDark), display: "grid", placeItems: "center", fontSize: 19, flexShrink: 0 }}>{bosIcon(g.emoji || "🎯", 21, g.color)}</span>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-3)", fontVariantNumeric: "tabular-nums", paddingTop: 2 }}>{Math.round(pct * 100)}%</span>
        </div>
        <div style={{ marginTop: 10, fontSize: 15, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.2px", lineHeight: 1.25, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{g.name}</div>
        <div style={{ marginTop: 7, display: "flex", alignItems: "center", gap: 6 }}>
          <HabitBuddyAvatarsLive habit={g} size={19} max={4} />
          {typeof CircleFacesLive === "function" && <CircleFacesLive habit={g} size={19} max={4} />}
        </div>
        <div style={{ marginTop: "auto", paddingTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 0.7 }}>Цель</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", fontVariantNumeric: "tabular-nums" }}>{(g.current || 0)} / {g.target} {g.unit || ""}</span>
          </div>
          <div style={{ height: 7, borderRadius: 999, background: "var(--card-track)", overflow: "hidden" }}>
            <span style={{ display: "block", height: "100%", width: (pct * 100) + "%", borderRadius: 999, background: "linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0) 72%), " + gc }} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div ref={wrapRef} className="page-in" style={{ padding: "0 12px 24px" }}>
      <CreateMenuLive open={createOpen} onClose={() => setCreateOpen(false)} anchorRef={addBtnRef} navigate={navigate} />

      {/* Чистая шапка: только «+» (David убрал «Быстрое добавление» и переключатель Привычки/Цели).
          «+» открывает CreateMenuLive → Привычку / Круг. Страница ниже = ОДНА сетка плиток. */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginBottom: 12 }}>
        <button ref={addBtnRef} data-tour="add" onClick={() => { setCreateOpen(true); if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} } }} className="tap"
          title="Создать" aria-haspopup="menu" aria-expanded={createOpen}
          style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 999, ...(typeof bosChipGlass === "function" ? bosChipGlass(isDark) : { background: TH.chipBg }), color: isDark ? "#fff" : "var(--text)", border: 0, display: "grid", placeItems: "center" }}>
          <I.Plus size={20} strokeWidth={2.2} style={{ transition: "transform 0.34s cubic-bezier(0.34,1.5,0.4,1)", transform: createOpen ? "rotate(45deg)" : "none" }}/>
        </button>
      </div>

      {/* ЕДИНАЯ сетка плиток: привычки + цели вперемешку, общий drag-реордер (порядок в bos:practiceOrder). */}
      {entries.length === 0 ? (
        <button className="tap" onClick={() => { setCreateOpen(true); if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} } }} style={{ width: "100%", background: TH.cardBg, border: 0, borderRadius: 22, padding: "30px 20px", boxShadow: cardShadow, color: "var(--text)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10 }}>
          <span style={{ width: 54, height: 54, borderRadius: 16, background: TH.iconBg, display: "grid", placeItems: "center", fontSize: 27 }}>🌱</span>
          <div style={{ fontSize: 17, fontWeight: 600 }}>Здесь будут твои привычки и цели</div>
          <div style={{ fontSize: 13.5, color: "var(--text-4)", lineHeight: 1.45, maxWidth: 260 }}>Нажми «+» вверху — заведи привычку или собери круг. Карточки потом расставишь как удобно.</div>
        </button>
      ) : (
        <BosReorderGrid ids={entries.map((e) => e.k)} onReorder={(keys) => { bosSavePracticeOrder(keys); setOrderTick((t) => t + 1); }}
          onLongPress={onTileLongPress} ctlRef={gridCtl} cols={2} gap={12}
          renderItem={(k, ctx) => { const e = entries.find((x) => x.k === k); if (!e) return null; return e.type === "g" ? goalTile(e.item, ctx) : habitTile(e.item, ctx); }} />
      )}

      {/* Круги-команды (легаси cloud-команды) — пока ниже сетки, если есть. */}
      {teams.length > 0 && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
          {teams.map((t) => <LiveTeamCard key={t._id} t={t} navigate={navigate} />)}
        </div>
      )}

      {/* (Старая отдельная вкладка «Цели» удалена — цели теперь плитками в общей сетке выше.) */}

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

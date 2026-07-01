/* HABITS — LIVE-only fork (real Telegram user, app.mode === "live" is ALWAYS true here).
   ONE block language (iOS-26 «всё в блоках»), as redesigned by David:
     1. Шапка: лента ЧЕЛЛЕНДЖЕЙ (популярные привычка/цель/«вместе»-пресеты с XP-наградой,
        горизонтальный скролл) + универсальный «+» справа (CreateMenuLive → Привычку / Цель;
        круг = тумблер «Идти к цели вместе» внутри цели). «Быстрого добавления» и переключателя
        Привычки/Цели больше НЕТ — их David убрал.
     2. ОДНА сетка квадратных плиток: привычки, цели И КОМАНДЫ (круги) ВПЕРЕМЕШКУ, общий
        drag-реордер (порядок в bos:practiceOrder, ключи "h<id>"/"g<id>"/"t<id>"). Плитка цели
        зеркалит привычку (иконка + %, имя, полоска прогресса снизу вместо недельных точек);
        плитка команды = цель + лица участников + метка «Команда» (teamTile). Долгое нажатие →
        меню плитки (Поделиться / Переставить / Удалить; у команды «Удалить» нет — оно в настройках
        круга). teams больше НЕ рендерятся отдельным блоком под сеткой — они В сетке (David: «команды
        должны двигаться как привычки, между ними и над ними»).
     3. «Обучение» — тонкий disclosure-блок (bosLearnHidden, тот же флаг что в Настройках).
   Reuses shared core/ + shared_live.jsx (CreateMenuLive, ShareHabitSheetLive/ShareGoalSheetLive,
   HabitWeekStrip, BosReorderGrid, bosConfirmDelete, bosTileGlass/BOS_TILE_SHEEN, HabitBuddyAvatarsLive,
   CircleFacesLive) + community_live.jsx (LiveTeamCard) + framework (HabitCheck/HabitCountCheck/
   HabitRing, I, hooks). Top-level names here: HabitTileMenuLive, HabitsLive, bosLoadPracticeOrder,
   bosSavePracticeOrder, CHALLENGE_STARTERS. */

// «ЧЕЛЛЕНДЖИ» — витрина-лента наверху стр. Привычки (David: «не голые пресеты, а самые ПОПУЛЯРНЫЕ
// привычки/цели/„вместе"-челленджи, у каждой виден XP-БОНУС — быстрое добавление ЧЕЛЛЕНДЖЕЙ»). Тап →
// создание заполнено пресетом. `bonus` = РЕАЛЬНЫЙ XP за ЗАВЕРШЕНИЕ челленджа (David: «в конце, когда закрыл
// срок»). Создание метит привычку/цель/команду `challenge {key,bonus,days}`; AppProvider (shell.jsx)
// фиксирует бонус в ПОСТОЯННУЮ копилку claimedChallenges, как только серия привычки достигла `days` ПОДРЯД
// (или цель/команда достигла target) — раз заработал, бонус навсегда (пропуск/удаление его не отбирают).
// bosChallengeBonusXPLive суммирует копилку. kind: habit | goal | together
// (together = цель с тумблером «Идти к цели вместе»). preset-поля совпадают с тем, что читает создание.
const CHALLENGE_STARTERS = [
  { i: "🔥", t: "Холодный душ",    kind: "habit",    key: "cold",    bonus: 50, days: 30, color: "#0a0a0a" },
  { i: "💪", t: "30 дней спорта",   kind: "together", key: "sport30", bonus: 75, target: 30, unit: "дней" },
  { i: "💧", t: "Вода каждый день", kind: "habit",    key: "water",   bonus: 30, days: 21, color: "#34C759" },
  { i: "📚", t: "Книга за месяц",   kind: "goal",     key: "book",    bonus: 40, target: 1, unit: "книга", deadline: "Месяц" },
  { i: "🏃", t: "Бег вместе",       kind: "together", key: "runtog",  bonus: 75, target: 30, unit: "км" },
  { i: "🧘", t: "10 минут тишины",  kind: "habit",    key: "silence", bonus: 30, days: 21, color: "#AF52DE" },
  { i: "🌅", t: "Ранний подъём",    kind: "habit",    key: "wake",    bonus: 40, days: 21, color: "#FF9500" },
  { i: "🚭", t: "Без сахара",       kind: "habit",    key: "nosugar", bonus: 50, days: 30, color: "#FF2D55" },
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
        {onDelete && <Row icon={<I.Trash size={18} />} label="Удалить" onClick={swap(onDelete)} danger />}
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

// Орбита для КАРТОЧКИ цели: резолвит её людей (shareCode-бадди) + привычки (habitIds) и рисует
// статичную GoalOrbitMini. Отдельный компонент — чтобы честно вызвать хук useBuddyMembersLive (в
// goalTile, который зовётся в .map, хук нельзя). habits = полный список (для резолва по id).
function GoalCardOrbit({ goal, habits, size, dark }) {
  const members = (typeof useBuddyMembersLive === "function") ? useBuddyMembersLive(goal && goal.shareCode) : null;
  const people = (members || []).filter((m) => m && !m.me).map((m) => ({ avatar: m.avatar, name: m.name }));
  const linked = ((goal && goal.habitIds) || []).map((id) => (habits || []).find((h) => h.id === id)).filter(Boolean).map((h) => ({ emoji: h.emoji, color: h.color }));
  if (typeof GoalOrbitMini !== "function") return null;
  return <GoalOrbitMini centerEmoji={goal && goal.emoji} centerColor={goal && goal.color} habits={linked} people={people} size={size} dark={dark} />;
}

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

  // Стиль карточек — ОТДЕЛЬНО привычки (cardStyle) и цели (goalStyle). Шестерёнка → меню с 2 вкладками.
  // Дефолты: привычки = текущий вид; цели = высокий БАННЕР (David: вернуть исходный вид цели). Запоминается.
  const [cardStyle, setCardStyle] = React.useState(bosLoadCardStyle);
  const [goalStyle, setGoalStyle] = React.useState(bosLoadGoalStyle);
  const [styleOpen, setStyleOpen] = React.useState(false);
  const gearBtnRef = React.useRef(null);
  React.useEffect(() => { const h = () => { setCardStyle(bosLoadCardStyle()); setGoalStyle(bosLoadGoalStyle()); }; window.addEventListener("bos:cardStyleChanged", h); return () => window.removeEventListener("bos:cardStyleChanged", h); }, []);

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
    if (("" + key)[0] === "t") {
      const t = teams.find((x) => ("t" + (x._id != null ? x._id : x.id)) === key); if (!t) return;
      // Меню для команды: те же «Поделиться / Переставить». «Удалить» тут НЕ даём — удаление круга
      // затрагивает всех участников, это делается в настройках команды. onDelete не передаём → строка скрыта.
      const tHabit = { name: t.name, emoji: t.emblem || "👥", color: t.accent || t.color };
      openSheet(
        <HabitTileMenuLive habit={tHabit} dark={isDark} kindLabel="Команда"
          onShare={() => openSheet(<TeamShareSheet team={t} />)}
          onReorder={openReorder}
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

  // Тап по пилюле-челленджу → создание заполнено пресетом. habit → создание привычки; goal → цель;
  // together → цель с включённым «Идти к цели вместе» (можно сразу звать людей).
  const startChallenge = (c) => {
    if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} }
    // challenge {key,bonus,days} едет в пресет → создание кладёт его на привычку/цель/команду. Бонус
    // фиксируется в копилку (shell.jsx) только когда челлендж ЗАВЕРШЁН: привычка — серия `days` ПОДРЯД;
    // цель/команда — достигнут target. Заработанный бонус остаётся навсегда (David).
    const ch = { key: c.key, bonus: c.bonus, days: c.days };
    if (c.kind === "habit") {
      navigate("habit-settings", { mode: "create", preset: { i: c.i, t: c.t, color: c.color, challenge: ch } });
    } else {
      navigate("goal-settings", { mode: "create", circleOn: c.kind === "together", preset: { i: c.i, t: c.t, target: c.target, unit: c.unit, deadline: c.deadline, goalType: "collective", challenge: ch } });
    }
  };

  // Смешанный список: привычки + цели в едином порядке (ключи "h<id>"/"g<id>"), отсортированы по
  // сохранённому порядку перестановки; новые элементы — в конец.
  const entries = React.useMemo(() => {
    const all = habits.filter((h) => !h.goalOnly).map((h) => ({ k: "h" + h.id, type: "h", item: h }))
      .concat(goals.map((g) => ({ k: "g" + g.id, type: "g", item: g })))
      // Команды (круги/командные цели) живут в ТОЙ ЖЕ сетке — их можно тащить и ставить между
      // привычками/целями, как просил David. Ключ "t<id>" (cloud _id или локальный id).
      .concat(teams.map((t) => ({ k: "t" + (t._id != null ? t._id : t.id), type: "t", item: t })));
    const saved = bosLoadPracticeOrder();
    if (saved && saved.length) {
      const pos = {}; saved.forEach((k, i) => { pos[k] = i; });
      return all.map((e, i) => ({ e: e, i: i }))
        .sort((a, b) => (pos[a.e.k] != null ? pos[a.e.k] : 1000 + a.i) - (pos[b.e.k] != null ? pos[b.e.k] : 1000 + b.i))
        .map((x) => x.e);
    }
    return all;
  }, [habits, goals, teams, orderTick]);

  // ПЛИТКА ПРИВЫЧКИ — форма+тоглы из cardStyle. ЛИЦА переехали в ВЕРХНИЙ ряд к контролу (David: убрать
  // пустое место внизу — все плитки одной высоты). marks: неделя / месяц-грядка / нет. rect = строка.
  const habitTile = (h, ctx) => {
    const rect = cardStyle.form === "rect";
    const onOpen = ctx.mode ? undefined : () => navigate("habit-detail", { habit: h, from: "habits" });
    const control = h.duration > 0 && !(h.goalPerDay > 1)
      ? <HabitTimerCheck habit={h} app={app} xp={10} />
      : h.goalPerDay > 1 ? <HabitCountCheck habit={h} app={app} xp={10} />
      : <HabitCheck done={h.done} onToggle={() => toggle(h.id)} xp={10} float />;
    const ctrl = <span onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>{control}</span>;
    const faces = cardStyle.faces ? <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}><HabitBuddyAvatarsLive habit={h} size={rect ? 16 : 20} max={rect ? 5 : 3} />{typeof CircleFacesLive === "function" && <CircleFacesLive habit={h} size={rect ? 16 : 20} max={rect ? 5 : 3} />}</span> : null;
    const sq = cardStyle.cells === "square";
    const marks = cardStyle.marks === "week" ? <HabitWeekStrip habit={h} fill square={sq} /> : cardStyle.marks === "month" ? <HabitMonthMini habit={h} square={sq} /> : null;
    const icon = <span style={{ width: 38, height: 38, borderRadius: 13, background: BOS_TILE_SHEEN + ", " + (h.color ? h.color + "26" : TH.iconBg), boxShadow: bosTileGlass(isDark), display: "grid", placeItems: "center", fontSize: 19, flexShrink: 0 }}>{bosIcon(h.emoji, 21, h.color)}</span>;
    if (rect) {
      return (
        <div className={ctx.mode ? "" : "tap"} onClick={onOpen} style={{ background: rowBg, borderRadius: 18, boxShadow: cardShadow, padding: "11px 14px", display: "flex", alignItems: "center", gap: 13, pointerEvents: ctx.mode ? "none" : "auto", overflow: "hidden" }}>
          {icon}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15.5, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.name}</div>
            {marks && <div style={{ marginTop: 8 }}>{marks}</div>}
          </div>
          {faces}{ctrl}
        </div>
      );
    }
    const compact = cardStyle.marks === "none";
    return (
      <div className={ctx.mode ? "" : "tap"} onClick={onOpen} style={{ background: rowBg, borderRadius: 22, boxShadow: cardShadow, padding: "13px 13px 12px", minHeight: compact ? undefined : 146, display: "flex", flexDirection: "column", pointerEvents: ctx.mode ? "none" : "auto", overflow: "hidden" }}>
        {/* center — чтобы 30px-кружок-чек шёл ВРОВЕНЬ с 38px-иконкой (David: центры совпадают). gap 10 —
            чтобы кольцо/секции контрола (выступают ~7px) не задевали лица. */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          {icon}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>{faces}{ctrl}</div>
        </div>
        {cardStyle.name && <div style={{ marginTop: 10, fontSize: 15, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.2px", lineHeight: 1.25, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{h.name}</div>}
        {marks && <div style={{ marginTop: "auto", paddingTop: 12 }}>{marks}</div>}
      </div>
    );
  };

  // ПЛИТКА ЦЕЛИ — та же логика форм/тоглов. «Отметки» у цели = полоска прогресса (показываем пока
  // marks ≠ «нет»). Недельной/месячной сетки у цели нет — прогресс её замена. Лица тоже наверх.
  // ЕДИНЫЙ «СКИН» карточки цели/команды (David: дефолт = БЕЛЫЙ/светло-серый; ЦВЕТ, если задан, заливает
  // карточку КАК КАРТОЧКИ ПАРТНЁРОВ — насыщенный accent + белый градиент-блик + тёмный текст). Чёрный
  // (#0a0a0a, старый дефолт) считаем НЕйтральным → белая карточка. Один источник вида для goalTile+teamTile.
  const goalSkin = (color) => {
    // Нейтральные (нет цвета / чёрный / системный серый) → БЕЛАЯ карточка. Реальный цвет → заливка.
    const accent = (color && ("" + color).toLowerCase() !== "#0a0a0a" && color !== "#8E8E93") ? color : null;
    if (!accent) return {
      hasColor: false, accent: isDark ? "#e8e8ea" : "#0a0a0a", bg: rowBg, shadow: cardShadow,
      txt: "var(--text)", sub: "var(--text-4)", lbl: "var(--text-4)", val: "var(--text-3)",
      track: isDark ? "rgba(255,255,255,0.12)" : "rgba(10,10,10,0.07)", fill: isDark ? "#e6e6ea" : "#0a0a0a",
      iconBg: BOS_TILE_SHEEN + ", " + TH.iconBg,
    };
    return {
      hasColor: true, accent,
      bg: "linear-gradient(158deg, rgba(255,255,255,0.5), rgba(255,255,255,0) 58%), " + accent,
      shadow: "0 4px 14px rgba(40,30,15,0.13), inset 0 0 0 0.5px rgba(255,255,255,0.55)",
      txt: "#1b1b1f", sub: "rgba(27,27,31,0.6)", lbl: "rgba(27,27,31,0.5)", val: "rgba(27,27,31,0.72)",
      track: "rgba(255,255,255,0.42)", fill: "rgba(27,27,31,0.82)",
      iconBg: "linear-gradient(160deg, rgba(255,255,255,0.85), rgba(255,255,255,0.55))",
    };
  };

  const goalTile = (g, ctx) => {
    const banner = goalStyle.form === "banner";
    // Прогресс = из привычек цели, если они есть (bosGoalProgress), иначе ручной current.
    const gp = (typeof bosGoalProgress === "function") ? bosGoalProgress(g, habits) : { pct: g.target > 0 ? Math.min(1, (g.current || 0) / g.target) : 0, current: g.current || 0 };
    const pct = gp.pct;
    const curVal = gp.current;
    const sk = goalSkin(g.color);
    const onOpen = ctx.mode ? undefined : () => navigate("goal-detail", { goal: g, from: "habits" });
    const orbit = goalStyle.orbits ? <GoalCardOrbit goal={g} habits={habits} size={banner ? 104 : 116} dark={isDark} /> : null;
    const pctEl = <span style={{ fontSize: 13, fontWeight: 800, color: sk.hasColor ? "#1b1b1f" : sk.accent, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{Math.round(pct * 100)}%</span>;
    const icon = <span style={{ width: 40, height: 40, borderRadius: 13, background: sk.iconBg, boxShadow: bosTileGlass(isDark), display: "grid", placeItems: "center", fontSize: 20, flexShrink: 0 }}>{bosIcon(g.emoji || "🎯", 22, sk.hasColor ? null : g.color)}</span>;
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

    // БАННЕР — высокий полноширинный. Нейтральный = белый; ЦВЕТНОЙ = заливка партнёрского вида.
    if (banner) {
      return (
        <div className={ctx.mode ? "" : "tap"} onClick={onOpen} style={{ background: sk.bg, borderRadius: 22, boxShadow: sk.shadow, padding: 16, display: "flex", alignItems: "center", gap: 14, minHeight: 116, pointerEvents: ctx.mode ? "none" : "auto", overflow: "hidden" }}>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 11 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {icon}
              <div style={{ flex: 1, minWidth: 0 }}>
                {goalStyle.name && <div style={{ fontSize: 16, fontWeight: 700, color: sk.txt, letterSpacing: "-0.3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</div>}
                {g.deadline && <div style={{ fontSize: 11.5, color: sk.sub, marginTop: 1 }}>до {g.deadline}</div>}
              </div>
              {!orbit && pctEl}
            </div>
            {progBar}
          </div>
          {orbit}
        </div>
      );
    }

    // КВАДРАТ — минимал. С орбитами: орбита-герой + имя + доля. Без орбит: иконка + имя + прогресс.
    return (
      <div className={ctx.mode ? "" : "tap"} onClick={onOpen} style={{ background: sk.bg, borderRadius: 22, boxShadow: sk.shadow, padding: "13px 13px 12px", minHeight: 146, display: "flex", flexDirection: "column", alignItems: orbit ? "center" : "stretch", justifyContent: orbit ? "center" : "flex-start", textAlign: orbit ? "center" : "left", pointerEvents: ctx.mode ? "none" : "auto", overflow: "hidden" }}>
        {orbit ? (
          <>
            {orbit}
            {goalStyle.name && <div style={{ marginTop: 10, fontSize: 14, fontWeight: 600, color: sk.txt, letterSpacing: "-0.2px", lineHeight: 1.2, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</div>}
            {goalStyle.progress && <div style={{ marginTop: goalStyle.name ? 3 : 8, fontSize: 12.5, fontWeight: 800, color: sk.hasColor ? "#1b1b1f" : sk.accent, fontVariantNumeric: "tabular-nums" }}>{Math.round(pct * 100)}%</div>}
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
  };

  // ПЛИТКА КОМАНДЫ (круга) — та же форма, что цель, но эмблема + ЛИЦА участников + метка «Команда»
  // (чтобы читалась как «цель с людьми», а не соло-цель). Прогресс = командный (счёт всех / target,
  // либо процент). Тап открывает круг. Живёт в общей сетке → перетаскивается наравне с привычками.
  // КОМАНДА = общая цель → тот же goalStyle (баннер/квадрат + орбиты + прогресс + название). Орбита
  // команды показывает УЧАСТНИКОВ (лица) + командные привычки. Метка «Команда» сохранена в прогрессе.
  const teamTile = (t, ctx) => {
    const banner = goalStyle.form === "banner";
    const tgt = t.target || 0;
    const cur = t.current != null ? t.current : Math.round((t.progress || 0) * tgt);
    const pct = tgt > 0 ? Math.min(1, cur / tgt) : (t.progress || 0);
    const sk = goalSkin(t.accent || t.color);
    const onOpen = ctx.mode ? undefined : () => navigate("team-detail", { team: t, from: "habits" });
    const members = t.members || [];
    const orbit = goalStyle.orbits && typeof GoalOrbitMini === "function"
      ? <GoalOrbitMini centerEmoji={t.emblem || "👥"} centerColor={t.accent || t.color} habits={(t.habits || []).map((h) => ({ emoji: h.emoji }))} people={members} size={banner ? 104 : 116} dark={isDark} />
      : null;
    const faces = !orbit && members.length ? <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}><PeopleStackLive people={members} size={20} max={3} /></span> : null;
    const pctEl = <span style={{ fontSize: 13, fontWeight: 800, color: sk.hasColor ? "#1b1b1f" : sk.accent, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{Math.round(pct * 100)}%</span>;
    const valTxt = t.target ? (cur + " / " + tgt + " " + (t.unit || "")) : (Math.round(pct * 100) + "%");
    const progBar = goalStyle.progress ? (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: sk.lbl, textTransform: "uppercase", letterSpacing: 0.7 }}>Цель</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: sk.val, fontVariantNumeric: "tabular-nums" }}>{valTxt}</span>
        </div>
        <div style={{ height: 7, borderRadius: 999, background: sk.track, overflow: "hidden" }}>
          <span style={{ display: "block", height: "100%", width: (pct * 100) + "%", borderRadius: 999, background: sk.hasColor ? sk.fill : ("linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0) 72%), " + sk.accent) }} />
        </div>
      </div>
    ) : null;
    const icon = <span style={{ width: 40, height: 40, borderRadius: 13, background: sk.iconBg, boxShadow: bosTileGlass(isDark), display: "grid", placeItems: "center", fontSize: 20, flexShrink: 0 }}>{bosIcon(t.emblem || "👥", 22, sk.hasColor ? null : (t.accent || t.color))}</span>;

    if (banner) {
      return (
        <div className={ctx.mode ? "" : "tap"} onClick={onOpen} style={{ background: sk.bg, borderRadius: 22, boxShadow: sk.shadow, padding: 16, display: "flex", alignItems: "center", gap: 14, minHeight: 116, pointerEvents: ctx.mode ? "none" : "auto", overflow: "hidden" }}>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 11 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {icon}
              <div style={{ flex: 1, minWidth: 0 }}>
                {goalStyle.name && <div style={{ fontSize: 16, fontWeight: 700, color: sk.txt, letterSpacing: "-0.3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>}
                <div style={{ fontSize: 11.5, color: sk.sub, marginTop: 1 }}>Вместе{members.length ? " · " + members.length : ""}</div>
              </div>
              {!orbit && (faces || pctEl)}
            </div>
            {progBar}
          </div>
          {orbit}
        </div>
      );
    }
    return (
      <div className={ctx.mode ? "" : "tap"} onClick={onOpen} style={{ background: sk.bg, borderRadius: 22, boxShadow: sk.shadow, padding: "13px 13px 12px", minHeight: 146, display: "flex", flexDirection: "column", alignItems: orbit ? "center" : "stretch", justifyContent: orbit ? "center" : "flex-start", textAlign: orbit ? "center" : "left", pointerEvents: ctx.mode ? "none" : "auto", overflow: "hidden" }}>
        {orbit ? (
          <>
            {orbit}
            {goalStyle.name && <div style={{ marginTop: 10, fontSize: 14, fontWeight: 600, color: sk.txt, letterSpacing: "-0.2px", lineHeight: 1.2, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>}
            {goalStyle.progress && <div style={{ marginTop: goalStyle.name ? 3 : 8, fontSize: 12.5, fontWeight: 800, color: sk.hasColor ? "#1b1b1f" : sk.accent, fontVariantNumeric: "tabular-nums" }}>{Math.round(pct * 100)}%</div>}
          </>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>{icon}<div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>{faces}{pctEl}</div></div>
            {goalStyle.name && <div style={{ marginTop: 10, fontSize: 15, fontWeight: 600, color: sk.txt, letterSpacing: "-0.2px", lineHeight: 1.25, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{t.name}</div>}
            {progBar && <div style={{ marginTop: "auto", paddingTop: 12 }}>{progBar}</div>}
          </>
        )}
      </div>
    );
  };

  return (
    <div ref={wrapRef} className="page-in" style={{ padding: "0 12px 24px" }}>
      <CreateMenuLive open={createOpen} onClose={() => setCreateOpen(false)} anchorRef={addBtnRef} navigate={navigate} />
      {typeof CardStyleMenuLive === "function" && <CardStyleMenuLive open={styleOpen} onClose={() => setStyleOpen(false)} anchorRef={gearBtnRef} />}

      {/* Шапка: ЛЕНТА ЧЕЛЛЕНДЖЕЙ (горизонтальный скролл, уходит за край) + «+» закреплён справа (David:
          «верни пилюли наверх рядом с „+", переработай в челленджи с XP-бонусом»). Тап пилюли → создание
          заполнено; «+» открывает CreateMenuLive → Привычку / Цель. Страница ниже = ОДНА сетка плиток. */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch", touchAction: "pan-x", padding: "2px 1px", WebkitMaskImage: "linear-gradient(90deg, #000 88%, transparent)", maskImage: "linear-gradient(90deg, #000 88%, transparent)" }}>
          {CHALLENGE_STARTERS.map((c, i) => {
            const xp = c.bonus;
            return (
              <button key={i} className="tap" data-no-haptic onClick={() => startChallenge(c)} style={{
                ...(typeof bosChipGlass === "function" ? bosChipGlass(isDark) : { background: TH.chipBg }), borderRadius: 999, padding: "7px 9px 7px 11px", border: 0, flexShrink: 0,
                display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap",
                animation: "briefPop 0.4s cubic-bezier(0.22,0.9,0.3,1.2) both " + (i * 0.03) + "s",
              }}>
                <span style={{ fontSize: 15, lineHeight: 1 }}>{c.i}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: TH.chipText }}>{c.t}</span>
                {c.kind === "together" && <I.Users size={12} color={TH.chipText} style={{ opacity: 0.55, marginLeft: -2 }} />}
                <span style={{ fontSize: 10.5, fontWeight: 800, color: "#9a6800", background: "rgba(245,180,30,0.18)", borderRadius: 999, padding: "2px 6px", letterSpacing: "-0.2px", lineHeight: 1.3 }}>+{xp} XP</span>
              </button>
            );
          })}
        </div>
        {/* «+» слева, шестерёнка справа (David: «намного логичнее — плюсик слева, шестерёнка справа»). */}
        <button ref={addBtnRef} data-tour="add" onClick={() => { setCreateOpen(true); if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} } }} className="tap"
          title="Создать" aria-haspopup="menu" aria-expanded={createOpen}
          style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 999, ...(typeof bosChipGlass === "function" ? bosChipGlass(isDark) : { background: TH.chipBg }), color: isDark ? "#fff" : "var(--text)", border: 0, display: "grid", placeItems: "center" }}>
          <I.Plus size={20} strokeWidth={2.2} style={{ transition: "transform 0.34s cubic-bezier(0.34,1.5,0.4,1)", transform: createOpen ? "rotate(45deg)" : "none" }}/>
        </button>
        <button ref={gearBtnRef} onClick={() => { setStyleOpen(true); if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} } }} className="tap"
          title="Стиль карточек" aria-haspopup="menu" aria-expanded={styleOpen}
          style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 999, ...(typeof bosChipGlass === "function" ? bosChipGlass(isDark) : { background: TH.chipBg }), color: isDark ? "#fff" : "var(--text)", border: 0, display: "grid", placeItems: "center" }}>
          <I.Settings size={19} strokeWidth={2} />
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
          onLongPress={onTileLongPress} ctlRef={gridCtl} cols={cardStyle.form === "rect" ? 1 : 2} gap={12}
          spanFull={(k) => k && (k[0] === "g" || k[0] === "t") && goalStyle.form === "banner"}
          renderItem={(k, ctx) => { const e = entries.find((x) => x.k === k); if (!e) return null; return e.type === "t" ? teamTile(e.item, ctx) : e.type === "g" ? goalTile(e.item, ctx) : habitTile(e.item, ctx); }} />
      )}

      {/* Команды (круги) теперь ВНУТРИ общей сетки выше (teamTile) — их можно перетаскивать наравне
          с привычками и целями (David). Отдельного блока под сеткой больше нет. */}

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

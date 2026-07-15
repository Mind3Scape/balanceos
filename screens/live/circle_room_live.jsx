/* КОМНАТА КРУГА v2 — ОДИН сплошной экран (макеты И·К финала, _devgoal3.html, 2026-07-16).

   Что было: три вкладки (Обзор · Привычки · Чат, v734) — целиком в _parked/circle-tabs-v734/.
   Что стало (сверху вниз, как читается день):
     нить дня → серия круга → [заявки владельцу] → «Мой день» (чекбоксы СПРАВА, дела в том же
     списке с меткой) → «Люди» (грид лиц — решение David 2026-07-16) → «Пульс дня» (отметки,
     пачки «+34 к 08:00», огоньки, ВЕХИ и ЧАТ — одна лента) → композер.

   Три жеста навигации (макет И): КРУЖОК = отметить · СТРОКА = статистика привычки (Л, ступень 3)
   · ЛИЦО = карточка человека (кадр 3). Кабинет ведущего (К) — тихая пилюля-компас в шапке,
   видна только владельцу; красный бейдж = заявки + «теряем» (молчат 3+ дня).

   Решения David 2026-07-16: везде ЧЕКБОКСЫ (никаких «+км»/«держишься» — таких типов у нас нет);
   банк XP остаётся ТОНКО (строка в шапке + веха в пульсе); просьбы и отдельный календарь круга —
   в архив; у человека ОДНА неделя; в карточке человека виден его УРОВЕНЬ. */

var BOS_ROOM_GOLD = "#EF9F14", BOS_ROOM_GOLD_L = "#FEDE34", BOS_ROOM_GOLD_INK = "#B4820A";

// Локальный ключ дня для смещения на n дней назад (тот же формат, что bosTodayKey).
function bosRoomDayKey(offsetBack) {
  var d = new Date(); d.setDate(d.getDate() - (offsetBack || 0));
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function bosRoomHHMM(ts) {
  try { var d = (typeof bosParseTs === "function") ? bosParseTs(ts) : new Date(ts); var m = d.getMinutes(); return d.getHours() + ":" + (m < 10 ? "0" + m : m); } catch (e) { return ""; }
}
function bosRoomPeopleWord(n) { return (n % 10 === 1 && n % 100 !== 11) ? "человек" : ((n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? "человека" : "человек"); }

/* Плоский чекбокс — ЕДИНСТВЕННЫЙ жест отметки в круге (язык v757: заливка чёрным/белым, галка).
   Зона нажатия 42px при видимых 28 — палец, целящийся в кружок, не промахивается в строку
   (промах открывал шторку статистики — David: «с чего у нас шторка открывается?»). */
function BosFlatCheckLive({ on, isDark, onToggle, label }) {
  return (
    <button onClick={onToggle} className="tap" aria-label={label || "Отметить"}
      style={{ width: 42, height: 42, margin: "-7px -7px -7px 0", borderRadius: "50%", flexShrink: 0, border: 0, display: "grid", placeItems: "center", cursor: "pointer", padding: 0, background: "transparent" }}>
      <span style={{ width: 28, height: 28, borderRadius: "50%", display: "grid", placeItems: "center",
        background: on ? (isDark ? "#fff" : "#0a0a0a") : "transparent",
        boxShadow: on ? "none" : "inset 0 0 0 1.5px " + (isDark ? "rgba(255,255,255,0.25)" : "rgba(10,10,10,0.18)"),
        transition: "background .15s" }}>
        {on ? <I.Check size={14} strokeWidth={3} color={isDark ? "#0a0a0a" : "#fff"} /> : null}
      </span>
    </button>
  );
}

/* Лицо участника: цветное — сегодня в деле, серое — ещё нет. gold — золотой ободок (я/сегодня). */
function BosRoomFaceLive({ p, size, active, gold, isDark, onClick }) {
  var ring = "0 0 0 2px " + (isDark ? "#1c1c20" : "#fff") + (gold ? ", 0 0 0 3.4px " + BOS_ROOM_GOLD : "");
  var node = (
    <span style={{ borderRadius: "50%", lineHeight: 0, flexShrink: 0, display: "inline-block", boxShadow: ring,
      filter: active === false ? "grayscale(1)" : "none", opacity: active === false ? 0.45 : 1 }}>
      <BuddyFaceLive avatar={p.avatar} name={p.name} size={size} />
    </span>
  );
  if (!onClick) return node;
  return <button onClick={onClick} className="tap" aria-label={p.name || "Участник"} style={{ border: 0, background: "transparent", padding: 0, lineHeight: 0, cursor: "pointer" }}>{node}</button>;
}

/* Заголовок раздела — тонкая капс-строка (язык макета). */
function BosRoomH2({ children, extra }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "16px 4px 8px" }}>
      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-4)" }}>{children}</span>
      {extra || null}
    </div>
  );
}

/* Строка «Мой день»: привычка или дело. Кружок = отметить, тело строки = статистика (onOpen). */
function CircleDayRowLive({ icon, iconColor, name, tag, sub, subGold, faces, on, onToggle, onOpen, isDark, first, inert }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 2px", borderTop: first ? 0 : "1px solid " + (isDark ? "rgba(255,255,255,0.06)" : "rgba(10,10,10,0.05)") }}>
      <div onClick={onOpen} style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0, cursor: onOpen ? "pointer" : "default" }}>
        <span style={{ width: 34, height: 34, borderRadius: 11, flexShrink: 0, display: "grid", placeItems: "center", fontSize: 16,
          background: iconColor ? iconColor + "26" : (BOS_TILE_SHEEN + ", " + (isDark ? "rgba(255,255,255,0.06)" : "var(--surface-3)")),
          boxShadow: iconColor ? "none" : bosTileGlass(isDark) }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)", display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
            {tag ? <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: 0.6, color: "var(--text-4)", background: isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)", borderRadius: 999, padding: "2px 7px", textTransform: "uppercase", flexShrink: 0 }}>{tag}</span> : null}
          </div>
          {sub ? <div style={{ fontSize: 10, color: subGold ? BOS_ROOM_GOLD_INK : "var(--text-4)", fontWeight: subGold ? 700 : 400, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</div> : null}
        </div>
        {faces && faces.length ? (
          <span style={{ display: "flex", flexShrink: 0 }}>
            {faces.slice(0, 3).map((f, i) => (
              <span key={f.id || i} style={{ marginLeft: i ? -6 : 0, borderRadius: "50%", boxShadow: "0 0 0 2px " + (isDark ? "#1c1c20" : "#fff"), lineHeight: 0 }}>
                <BuddyFaceLive avatar={f.avatar} name={f.name} size={19} />
              </span>
            ))}
          </span>
        ) : null}
      </div>
      {inert
        ? <span aria-hidden style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, boxShadow: "inset 0 0 0 1.5px " + (isDark ? "rgba(255,255,255,0.18)" : "rgba(10,10,10,0.12)") }} />
        : <BosFlatCheckLive on={on} isDark={isDark} onToggle={onToggle} label={"Отметить «" + name + "»"} />}
    </div>
  );
}

/* Золотая строка-веха в пульсе. */
function CircleMileLine({ children }) {
  return <div style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: BOS_ROOM_GOLD_INK, background: "rgba(240,195,10,0.12)", borderRadius: 999, padding: "6px 12px", margin: "2px 0 10px" }}>{children}</div>;
}

/* Выбор владельца: что добавить в «Мой день» — общую привычку или разовое дело. */
function CircleAddSheetLive({ onHabit, onTask, isDark }) {
  const { close } = useSheet();
  const row = (label, sub, icon, fn) => (
    <button onClick={() => { close(); setTimeout(fn, 220); }} className="tap" style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", border: 0, textAlign: "left", cursor: "pointer", background: "var(--card)", borderRadius: 18, padding: "14px 14px", boxShadow: "var(--card-shadow)", marginBottom: 9 }}>
      <span style={{ width: 38, height: 38, borderRadius: 12, display: "grid", placeItems: "center", background: BOS_TILE_SHEEN + ", " + (isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)"), boxShadow: bosTileGlass(isDark), color: "var(--text)" }}>{icon}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{label}</span>
        <span style={{ display: "block", fontSize: 12, color: "var(--text-4)", marginTop: 1 }}>{sub}</span>
      </span>
      <I.ChevronRight size={15} color="var(--text-4)" />
    </button>
  );
  return (
    <div style={{ padding: "4px 2px 8px" }}>
      <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", padding: "0 4px 12px" }}>Добавить в круг</div>
      {row("Общая привычка", "каждый день, у каждого своя отметка", <I.Refresh size={18} strokeWidth={2.2} />, onHabit)}
      {row("Разовое дело", "задание на сегодня-завтра, с меткой «дело»", <I.Flag size={18} strokeWidth={2.2} />, onTask)}
    </div>
  );
}

/* Мини-композер разового дела. */
function CircleTaskComposeSheetLive({ onAdd, isDark }) {
  const { close } = useSheet();
  const [v, setV] = React.useState("");
  return (
    <div style={{ padding: "4px 2px 8px" }}>
      <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", padding: "0 4px 12px" }}>Разовое дело</div>
      <input value={v} autoFocus onChange={(e) => setV(e.target.value)} placeholder="Например: фото завтрака в чат"
        style={{ width: "100%", boxSizing: "border-box", border: 0, outline: 0, background: isDark ? "rgba(255,255,255,0.07)" : "var(--surface-3)", borderRadius: 14, padding: "12px 15px", fontSize: 15.5, color: "var(--text)" }} />
      <button onClick={() => { const tx = v.trim(); if (!tx) return; onAdd(tx); close(); }} className="tap"
        style={{ marginTop: 12, width: "100%", border: 0, borderRadius: 999, padding: "13px 0", fontSize: 14.5, fontWeight: 700, cursor: "pointer", background: v.trim() ? (isDark ? "#fff" : "#0a0a0a") : "var(--surface-3)", color: v.trim() ? (isDark ? "#0a0a0a" : "#fff") : "var(--text-4)" }}>
        Дать кругу
      </button>
    </div>
  );
}

/* «Кто подбодрил» — лица за золотой строкой пульса. */
function CircleWhoSheetLive({ people, title }) {
  return (
    <div style={{ padding: "4px 2px 8px" }}>
      <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", padding: "0 4px 12px" }}>{title || "Тебя подбодрили"}</div>
      {(people || []).map((p, i) => (
        <div key={p.id || i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 4px" }}>
          <BuddyFaceLive avatar={p.avatar} name={p.name} size={30} />
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{p.name}</span>
          <I.Flame size={14} color={BOS_ROOM_GOLD} filled strokeWidth={1.6} style={{ marginLeft: "auto" }} />
        </div>
      ))}
    </div>
  );
}

/* ══════════════════ ЭКРАН КРУГА (макет И) ══════════════════ */
function TeamDetailLive() {
  const { navigate, params } = useNav();
  const app = useApp();
  const { open: openSheet } = useSheet();
  const passed = params?.team || { _id: "seed-1", name: "Круг", emblem: "✨", members: [] };
  const from = params?.from || "community";
  const t = (app?.teams || []).find((x) => x._id === passed._id) || passed;
  const isDark = app?.themeOverride === "dark";
  const _inTG = (typeof window !== "undefined" && window.__TG);

  /* ── подводка данных (перенесена из вкладочной версии, сама механика не менялась) ── */
  const _live = !!(window.bosCloud && window.bosCloud.enabled() && t.cloudId);
  const [meId, setMeId] = React.useState(null);
  const [cloudRoster, setCloudRoster] = React.useState(() => _bosTeamGet("roster:" + t.cloudId));
  const [rosterTick, setRosterTick] = React.useState(0);
  React.useEffect(() => {
    if (!_live) { setMeId(null); return; }
    let on = true;
    window.bosCloud.uid().then((id) => { if (on) setMeId(id || null); }).catch(() => {});
    return () => { on = false; };
  }, [_live, t.cloudId]);
  React.useEffect(() => {
    if (!_live) return;
    let on = true;
    window.bosCloud.teamMembers(t.cloudId).then((mem) => {
      if (!on || !Array.isArray(mem)) return;
      var sorted = mem.slice().sort((a, b) => (a.role === "owner" ? -1 : b.role === "owner" ? 1 : 0));
      setCloudRoster(_bosTeamPut("roster:" + t.cloudId, sorted.map((m, i) => ({ id: m.id, name: m.name || "Участник", avatar: m.avatar, role: m.role, joinedAt: m.joinedAt || null }))));
    }).catch(() => {});
    return () => { on = false; };
  }, [_live, t.cloudId, rosterTick]);
  const members = _live ? (cloudRoster || []) : (t.members?.length ? t.members : []);
  const membersN = members.length;
  const rosterById = {}; members.forEach((m) => { rosterById[m.id] = m; });
  const _meMember = (meId && Array.isArray(cloudRoster)) ? cloudRoster.find((m) => m.id === meId) : null;
  const _isOwner = _meMember ? (_meMember.role === "owner") : !t.joined;

  // Заявки — владелец принимает прямо здесь (не терять людей у двери).
  const [pending, setPending] = React.useState([]);
  React.useEffect(() => {
    if (!(_live && _isOwner) || !window.bosCloud.pendingRequests) return;
    let on = true;
    window.bosCloud.pendingRequests(t.cloudId).then((p) => { if (on) setPending(Array.isArray(p) ? p : []); }).catch(() => {});
    return () => { on = false; };
  }, [_live, _isOwner, t.cloudId, rosterTick]);
  const approveReq = (uid) => { window.bosCloud.approveMember(t.cloudId, uid).then((ok) => { if (ok) { setPending((p) => p.filter((x) => x.id !== uid)); setRosterTick((n) => n + 1); } }); };
  const rejectReq = (uid) => { window.bosCloud.rejectMember(t.cloudId, uid).then((ok) => { if (ok) setPending((p) => p.filter((x) => x.id !== uid)); }); };

  // Привычки круга + отметка (оптимистично, с откатом по отказу сервера — грабли RLS).
  const [liveTeamHabits, setLiveTeamHabits] = React.useState(() => _bosTeamGet("habits:" + t.cloudId));
  const [habitsTick, setHabitsTick] = React.useState(0);
  React.useEffect(() => {
    if (!_live || !window.bosCloud.teamHabitsFull) return;
    let on = true;
    window.bosCloud.teamHabitsFull(t.cloudId).then((hs) => { if (on) setLiveTeamHabits(_bosTeamPut("habits:" + t.cloudId, Array.isArray(hs) ? hs : [])); }).catch(() => {});
    return () => { on = false; };
  }, [_live, t.cloudId, habitsTick]);
  const teamHabits = _live ? (liveTeamHabits || []) : (Array.isArray(t.habits) ? t.habits : []);
  const habitById = {}; teamHabits.forEach((h) => { habitById[h.id] = h; });
  const toggleMyTeamHabit = (h) => {
    if (!h || !h.id) return;
    setLiveTeamHabits((list) => (list || []).map((x) => {
      if (x.id !== h.id) return x;
      const next = !x.doneByMe;
      const cap = Number.isFinite(x.total) ? x.total : (x.doneToday + 1);
      return { ...x, doneByMe: next, doneToday: Math.max(0, Math.min(cap, x.doneToday + (next ? 1 : -1))) };
    }));
    if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} }
    const _wantOn = !h.doneByMe;
    window.bosCloud.toggleTeamHabitToday(h.id, _wantOn).then((ok) => {
      if (ok === false) {
        setLiveTeamHabits((list) => (list || []).map((x) => {
          if (x.id !== h.id) return x;
          const cap = Number.isFinite(x.total) ? x.total : (x.doneToday + 1);
          return { ...x, doneByMe: !_wantOn, doneToday: Math.max(0, Math.min(cap, x.doneToday + (_wantOn ? -1 : 1))) };
        }));
        if (window.tgHaptic) { try { window.tgHaptic("error"); } catch (e) {} }
      }
      setHabitsTick((n) => n + 1);
    });
  };
  // «Прижитая» копия (вести у себя — UI убран, но связки людей живы): отметка идёт через личную.
  const myHabits = app?.habits || [];
  const _todayK = (typeof bosTodayKey === "function") ? bosTodayKey() : new Date().toISOString().slice(0, 10);
  const adoptedFor = (h) => (h && h.id != null) ? myHabits.find((x) => x.teamHabitId === h.id) : null;
  const markAdopted = (h) => { const a = adoptedFor(h); if (!a) return; app?.toggleHabit(a.id); if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} } setHabitsTick((n) => n + 1); };
  const myDone = (h) => { const a = adoptedFor(h); return a ? !!(a.log && a.log[_todayK]) : !!(h && h.doneByMe); };
  const _iDidCircle = teamHabits.some((h) => myDone(h));

  // Правка/создание общей привычки — та же полная форма (без изменений).
  const saveTeamHabit = (data, editId) => {
    if (editId != null) {
      setLiveTeamHabits((list) => (list || []).map((x) => x.id === editId ? Object.assign({}, x, { name: data.name, emoji: data.emoji, color: data.color, goalPerDay: data.goalPerDay, isMain: data.isMain }) : x));
      if (_live && window.bosCloud.updateTeamHabit) {
        window.bosCloud.updateTeamHabit(editId, data).then((ok) => {
          setHabitsTick((n) => n + 1);
          if (!ok && typeof InfoSheet === "function") openSheet(<InfoSheet title="Правка не сохранилась" dark={isDark} cta="Понятно" body="База не приняла изменение общей привычки, поэтому она осталась прежней. Обычно это нехватка прав на правку в круге — сообщи, и мы поправим." />);
        });
      }
      return;
    }
    if (_live) { var first = !(teamHabits && teamHabits.length); window.bosCloud.addTeamHabit(t.cloudId, { ...data, isMain: (data && data.isMain) || first }).then(() => setHabitsTick((n) => n + 1)); }
    else app?.addTeamHabit(t._id, data);
  };
  const removeTeamHabitH = (id) => {
    setLiveTeamHabits((list) => (list || []).filter((x) => x.id !== id));
    if (_live && window.bosCloud.removeTeamHabit) window.bosCloud.removeTeamHabit(id).then(() => setHabitsTick((n) => n + 1));
  };
  const openAddHabit = () => openSheet(<HabitFormSheetLive mode="create" navigate={navigate} teamFor={{ team: t, suggestMain: !(teamHabits && teamHabits.length), onSave: saveTeamHabit, onDelete: removeTeamHabitH }} />);
  const openEditTeamHabit = (h) => openSheet(<HabitFormSheetLive mode="edit" navigate={navigate} habit={{ id: h.id, name: h.name, emoji: h.emoji, color: h.color || null, goalPerDay: h.goalPerDay || 1, duration: 0, isMain: !!h.isMain }} teamFor={{ team: t, onSave: saveTeamHabit, onDelete: removeTeamHabitH }} />);

  // Дела круга (разовые, kind='task') — строки «Моего дня» с меткой. Просьбы Э3 — в архиве.
  const [teamTaskData, setTeamTaskData] = React.useState(() => _bosTeamGet("tasks:" + t.cloudId));
  const [tasksTick, setTasksTick] = React.useState(0);
  React.useEffect(() => {
    if (!_live || !window.bosCloud.teamTasks) return;
    let on = true;
    window.bosCloud.teamTasks(t.cloudId).then((d) => { if (on && d) setTeamTaskData(_bosTeamPut("tasks:" + t.cloudId, d)); }).catch(() => {});
    return () => { on = false; };
  }, [_live, t.cloudId, tasksTick]);
  const _teamTasks = ((teamTaskData && Array.isArray(teamTaskData.tasks)) ? teamTaskData.tasks : []).filter((x) => (x.kind || "task") !== "request");
  const toggleMyTeamTask = (tk) => {
    if (!tk || !tk.id) return;
    const next = !tk.doneByMe;
    setTeamTaskData((d) => (d ? { ...d, tasks: (d.tasks || []).map((x) => (x.id === tk.id ? { ...x, doneByMe: next, doneCount: Math.max(0, (x.doneCount || 0) + (next ? 1 : -1)) } : x)) } : d));
    if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} }
    window.bosCloud.toggleTeamTaskMine(tk.id, next).then((ok) => {
      if (ok === false) { setTeamTaskData((d) => (d ? { ...d, tasks: (d.tasks || []).map((x) => (x.id === tk.id ? { ...x, doneByMe: !next, doneCount: Math.max(0, (x.doneCount || 0) + (next ? -1 : 1)) } : x)) } : d)); if (window.tgHaptic) { try { window.tgHaptic("error"); } catch (e) {} } }
      setTasksTick((n) => n + 1);
    });
  };
  const addTeamTaskCloud = (tx) => { if (!tx || !window.bosCloud.addTeamTask) return; window.bosCloud.addTeamTask(t.cloudId, tx).then(() => setTasksTick((n) => n + 1)); if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} } };

  // Прогресс цели (банк, режимы) — ТОНКО (решение David): строка в шапке + веха в пульсе.
  const [goalProg, setGoalProg] = React.useState(() => _bosTeamGet("goal:" + t.cloudId));
  const [settlements, setSettlements] = React.useState(null);
  const settledRef = React.useRef(false);
  React.useEffect(() => {
    let on = true;
    if (!_live || !t.cloudId || !window.bosCloud.teamGoalProgress) { setGoalProg(null); return; }
    const load = () => window.bosCloud.teamGoalProgress(t.cloudId).then((d) => { if (on && d) setGoalProg(_bosTeamPut("goal:" + t.cloudId, d)); }).catch(() => {});
    load(); const iv = setInterval(load, 25000);
    return () => { on = false; clearInterval(iv); };
  }, [_live, t.cloudId, habitsTick]);
  React.useEffect(() => {
    if (!_live || !t.cloudId || !window.bosCloud.settleTeamGoal) return;
    if (!goalProg || !goalProg.done || !(goalProg.stake > 0)) return;
    let on = true;
    const loadSettle = () => window.bosCloud.teamSettlements(t.cloudId).then((s) => { if (on) setSettlements(s || {}); }).catch(() => {});
    if (settledRef.current) { loadSettle(); }
    else {
      settledRef.current = true;
      window.bosCloud.settleTeamGoal(t.cloudId).then((res) => { if (!on) return; loadSettle(); if (res && res.settled && app && app.refreshTeamGoalXP) app.refreshTeamGoalXP(); }).catch(loadSettle);
    }
    return () => { on = false; };
  }, [_live, t.cloudId, goalProg]);
  const gUnit = (goalProg && goalProg.unit) || t.unit || "";
  const gTgt = (goalProg && goalProg.target) || t.target || 0;
  const gCur = goalProg ? goalProg.current : (t.current != null ? t.current : 0);
  const gDone = gTgt > 0 && gCur >= gTgt;
  const stake = (goalProg && goalProg.stake) || t.stake || 0;
  const bank = (goalProg && goalProg.bank) || (stake * Math.max(1, membersN));

  // Сегодняшние отметки со временем — пульс, нить, «ты в 06:58», пачки.
  const [dayFeedS, setDayFeedS] = React.useState(() => _bosTeamGet("dayfeed:" + t.cloudId));
  React.useEffect(() => {
    let on = true;
    if (!_live || !window.bosCloud.teamDayFeed) { setDayFeedS(null); return; }
    const load = () => window.bosCloud.teamDayFeed(t.cloudId).then((d) => { if (on && d) setDayFeedS(_bosTeamPut("dayfeed:" + t.cloudId, d)); }).catch(() => {});
    load(); const iv = setInterval(load, 25000);
    return () => { on = false; clearInterval(iv); };
  }, [_live, t.cloudId, habitsTick]);
  const dayRows = (dayFeedS && dayFeedS.rows) || [];

  // Логи за месяц — серия круга (и «верхняя треть»).
  const [rangeS, setRangeS] = React.useState(() => _bosTeamGet("range31:" + t.cloudId));
  React.useEffect(() => {
    let on = true;
    if (!_live || !window.bosCloud.teamLogsRange) { setRangeS(null); return; }
    const load = () => window.bosCloud.teamLogsRange(t.cloudId, 31).then((d) => { if (on && d) setRangeS(_bosTeamPut("range31:" + t.cloudId, d)); }).catch(() => {});
    load(); const iv = setInterval(load, 60000);
    return () => { on = false; clearInterval(iv); };
  }, [_live, t.cloudId, habitsTick]);
  const rangeRows = (rangeS && rangeS.rows) || [];

  // Огоньки «подбодрить» — до SQL-патча честно спят (cheers === null → UI скрыт).
  const [cheers, setCheers] = React.useState(() => _bosTeamGet("cheers:" + t.cloudId));
  React.useEffect(() => {
    let on = true;
    if (!_live || !window.bosCloud.teamCheersToday) { setCheers(null); return; }
    const load = () => window.bosCloud.teamCheersToday(t.cloudId).then((d) => { if (on && d) setCheers(_bosTeamPut("cheers:" + t.cloudId, d)); }).catch(() => {});
    load(); const iv = setInterval(load, 30000);
    return () => { on = false; clearInterval(iv); };
  }, [_live, t.cloudId]);
  const cheersOn = !!(cheers && Array.isArray(cheers.rows));
  const myCheered = {}; if (cheersOn) cheers.rows.forEach((r) => { if (r.from === meId) myCheered[r.to] = true; });
  const cheeredMe = cheersOn ? cheers.rows.filter((r) => r.to === meId).map((r) => r.from) : [];
  const sendCheer = (toId) => {
    if (!cheersOn || !toId || toId === meId || myCheered[toId]) return;
    setCheers((c) => c ? { ...c, rows: c.rows.concat([{ from: meId, to: toId, at: new Date().toISOString() }]) } : c);
    if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} }
    window.bosCloud.sendTeamCheer(t.cloudId, toId);
  };

  /* ── ЧАТ, влитый в пульс (реальные сообщения + realtime + фото) ── */
  const memberMapRef = React.useRef({});
  React.useEffect(() => { const map = {}; members.forEach((m) => { map[m.id] = m; }); memberMapRef.current = map; }, [members]);
  const meRef = React.useRef(null);
  React.useEffect(() => { meRef.current = meId; }, [meId]);
  const myName = app?.userName || "Ты";
  const chatKey = "bos:chat:" + (app?.persistId || "live:local") + ":" + (t._id || t.name || "team");
  const [msgs, setMsgs] = React.useState(() => {
    if (_live) { var cc = _bosChatMsgCache[t.cloudId]; return (Array.isArray(cc) && cc.length) ? cc : []; }
    try { var raw = localStorage.getItem(chatKey); if (raw) return JSON.parse(raw); } catch (e) {}
    return [];
  });
  const mapRow = React.useCallback((r) => {
    const mine = r.user_id === meRef.current;
    const prof = memberMapRef.current[r.user_id];
    return { id: r.id, _uid: r.user_id, me: mine, who: mine ? myName : (prof ? prof.name : "Участник"), avatar: prof ? prof.avatar : null,
      t: r.text || undefined, img: r.image_url || undefined, time: bosMsgTime(r.created_at), ts: r.created_at ? new Date(r.created_at).getTime() : Date.now() };
  }, [myName]);
  React.useEffect(() => {
    if (!_live) return;
    let on = true, unsub = function () {};
    window.bosCloud.loadMessages(t.cloudId).then((rows) => { if (on && Array.isArray(rows)) { const mapped = rows.map(mapRow); _bosChatMsgCache[t.cloudId] = mapped; setMsgs(mapped); } });
    unsub = window.bosCloud.subscribeMessages(t.cloudId, (row) => {
      setMsgs((prev) => { const next = prev.some((m) => m.id === row.id) ? prev : prev.concat([mapRow(row)]); _bosChatMsgCache[t.cloudId] = next; return next; });
    });
    return () => { on = false; try { unsub(); } catch (e) {} };
  }, [_live, t.cloudId, mapRow]);
  React.useEffect(() => {
    if (_live) return;
    try { localStorage.setItem(chatKey, JSON.stringify(msgs)); } catch (e) { try { localStorage.setItem(chatKey, JSON.stringify(msgs.filter((m) => !m.img))); } catch (e2) {} }
  }, [msgs, chatKey, _live]);
  // Пульс на экране = чат прочитан: гасим маркер и значок на внешней карточке.
  React.useEffect(() => {
    if (!_live) return;
    try {
      const last = msgs.length ? msgs[msgs.length - 1] : null;
      const iso = last && last.ts ? new Date(last.ts).toISOString() : "";
      localStorage.setItem("bos:chatread:" + t.cloudId, iso);
      if (typeof bosTeamUnreadClear === "function") bosTeamUnreadClear(t.cloudId);
    } catch (e) {}
  }, [_live, t.cloudId, msgs.length]);
  // prefill — «Написать» из кабинета/карточки человека приводит сюда с готовым «@Имя ».
  const [text, setText] = React.useState(() => (params && params.prefill) || "");
  const fileRef = React.useRef(null);
  const composerRef = React.useRef(null);
  const feedBoxRef = React.useRef(null);
  React.useEffect(() => {
    if (params && params.prefill) setTimeout(() => { try { composerRef.current && composerRef.current.focus(); composerRef.current.scrollIntoView({ block: "center" }); } catch (e) {} }, 450);
  }, []);
  // КЛАВИАТУРА: Telegram/iOS ресайзят вьюпорт — при фокусе держим композер видимым
  // (David: «клавиатура не подстраивается — не вижу, что пишу»).
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;
    const vv = window.visualViewport;
    const onVV = () => {
      if (document.activeElement !== composerRef.current) return;
      requestAnimationFrame(() => {
        try { composerRef.current.scrollIntoView({ block: "center" }); } catch (e) {}
        const el = feedBoxRef.current; if (el) el.scrollTop = el.scrollHeight;
      });
    };
    vv.addEventListener("resize", onVV);
    return () => vv.removeEventListener("resize", onVV);
  }, []);
  const absorb = (row) => { if (row) setMsgs((prev) => prev.some((m) => m.id === row.id) ? prev : prev.concat([mapRow(row)])); };
  const send = () => {
    const v = text.trim(); if (!v) return;
    setText("");
    setTimeout(() => { try { composerRef.current && composerRef.current.scrollIntoView({ block: "nearest" }); } catch (e) {} }, 120);
    if (_live) {
      window.bosCloud.sendMessage(t.cloudId, { text: v }).then((row) => {
        if (row) { absorb(row); return; }
        setText((cur) => cur ? cur : v);
        if (window.tgHaptic) { try { window.tgHaptic("error"); } catch (e) {} }
      }).catch(() => { setText((cur) => cur ? cur : v); if (window.tgHaptic) { try { window.tgHaptic("error"); } catch (e) {} } });
    } else setMsgs((list) => list.concat([{ who: myName, me: true, t: v, time: bosRoomHHMM(Date.now()), ts: Date.now() }]));
  };
  const onFile = (e) => {
    const file = e.target.files && e.target.files[0];
    try { e.target.value = ""; } catch (_) {}
    if (!file) return;
    bosCompressImage(file, 1280, 0.72).then((src) => {
      if (_live) {
        fetch(src).then((r) => r.blob()).then((blob) => window.bosCloud.uploadChatPhoto(t.cloudId, blob).then((url) => {
          if (url) window.bosCloud.sendMessage(t.cloudId, { imageUrl: url }).then(absorb);
          else if (window.tgHaptic) { try { window.tgHaptic("error"); } catch (e2) {} }
        })).catch(() => { if (window.tgHaptic) { try { window.tgHaptic("error"); } catch (e2) {} } });
      } else setMsgs((list) => list.concat([{ who: myName, me: true, img: src, time: bosRoomHHMM(Date.now()), ts: Date.now() }]));
    }).catch(() => {});
  };

  /* ── производные дня ── */
  const firstByUser = {};
  dayRows.forEach((r) => { if (!firstByUser[r.u] || r.at < firstByUser[r.u]) firstByUser[r.u] = r.at; });
  const activeSet = {}; dayRows.forEach((r) => { activeSet[r.u] = true; });
  if (meId && _iDidCircle) activeSet[meId] = true;
  const todayN = Object.keys(activeSet).length;
  const _pt = (x) => (typeof bosParseTs === "function" ? bosParseTs(x) : new Date(x));
  const _hr = (x) => { const d = _pt(x); return d.getHours() + d.getMinutes() / 60; };
  // Нить дня: до 6 лиц — лица в свой час; больше — золотая волна (правило карточки круга).
  const threadFaces = members.filter((m) => firstByUser[m.id] || (m.id === meId && _iDidCircle)).map((m) => ({
    avatar: m.avatar, name: m.id === meId ? "Ты" : m.name,
    hr: firstByUser[m.id] ? _hr(firstByUser[m.id]) : (new Date().getHours() + new Date().getMinutes() / 60),
  }));
  const threadOff = t.threadOff === true || (t.goal && typeof t.goal === "object" && t.goal.threadOff === true);

  // Серия круга: день в зачёт, когда в деле все (маленький круг) / ≥80% (большой).
  // Новичка (в круге < 2 дней) в порог НЕ считаем — вступивший вчера не должен
  // обнулять серию, которую круг копил месяц.
  const byDay = {}; rangeRows.forEach((r) => { (byDay[r.day] = byDay[r.day] || {})[r.u] = true; });
  const _freshJoin = (m) => m.joinedAt && (Date.now() - new Date(m.joinedAt).getTime()) < 2 * 86400000;
  const eligibleN = members.filter((m) => !_freshJoin(m)).length;
  const need = eligibleN > 0 ? (eligibleN <= 8 ? eligibleN : Math.ceil(eligibleN * 0.8)) : (membersN || 1);
  const qual = (k) => Object.keys(byDay[k] || {}).length >= need;
  let circleStreak = 0;
  if (membersN > 0 && rangeRows.length) {
    let start = qual(bosRoomDayKey(0)) ? 0 : 1;
    for (let i = start; i < 31; i++) { if (qual(bosRoomDayKey(i))) circleStreak++; else break; }
  }
  const streakCap = circleStreak >= 31 ? "31+" : String(circleStreak);
  // «Ты в верхней трети» — только когда это правда и круг большой (позитивный факт, не рейтинг).
  let topThird = false;
  if (meId && membersN >= 10) {
    const wk = {}; for (let i = 0; i < 7; i++) { const k = bosRoomDayKey(i); Object.keys(byDay[k] || {}).forEach((u) => { wk[u] = (wk[u] || 0) + 1; }); }
    const mine = wk[meId] || 0;
    const better = members.filter((m) => (wk[m.id] || 0) > mine).length;
    topThird = mine > 0 && better <= Math.floor(membersN / 3);
  }

  // Возраст круга — из created_at (v762 несёт createdAt в каждый ряд команд).
  const ageDays = t.createdAt ? Math.max(1, Math.floor((Date.now() - new Date(t.createdAt).getTime()) / 86400000) + 1) : null;

  // Красный счёт для бейджа кабинета: заявки + «теряем» (молчат 3+ дня, не новички).
  const lastByUser = {}; rangeRows.forEach((r) => { if (!lastByUser[r.u] || r.day > lastByUser[r.u]) lastByUser[r.u] = r.day; });
  const silentDays = (m) => {
    const last = lastByUser[m.id]; if (!last) return 31;
    for (let i = 0; i < 31; i++) if (bosRoomDayKey(i) === last) return i;
    return 31;
  };
  const isNewbie = (m) => m.joinedAt && (Date.now() - new Date(m.joinedAt).getTime()) < 3 * 86400000;
  const redCount = _isOwner ? members.filter((m) => m.id !== meId && !isNewbie(m) && silentDays(m) >= 3).length + pending.length : 0;

  // Мой день: отметился ли я и когда (для золотой строки пульса и «ты в HH:MM»).
  const myRows = meId ? dayRows.filter((r) => r.u === meId) : [];
  const myLastRow = myRows.length ? myRows.reduce((a, b) => (a.at > b.at ? a : b)) : null;
  const myTimeFor = (hid) => { const r = myRows.filter((x) => x.h === hid).sort((a, b) => (a.at < b.at ? -1 : 1))[0]; return r ? bosRoomHHMM(r.at) : null; };

  /* ── пульс: сообщения + отметки + огоньки + вехи, одна лента по времени ── */
  const packMode = membersN > 8;
  const feedRows = [];
  msgs.forEach((m, i) => feedRows.push({ k: "msg", ts: m.ts || 0, key: "m" + (m.id != null ? m.id : i), m }));
  const otherMarks = dayRows.filter((r) => r.u !== meId);
  if (!packMode) {
    otherMarks.forEach((r) => {
      const hb = habitById[r.h], p = rosterById[r.u];
      if (!hb || !p) return;
      feedRows.push({ k: "mark", ts: _pt(r.at).getTime(), key: "k" + r.u + "-" + r.h, p, hb, at: r.at });
    });
  } else {
    const buckets = {};
    otherMarks.forEach((r) => {
      const hb = habitById[r.h]; if (!hb) return;
      const d = _pt(r.at); const hourEnd = d.getHours() + 1;
      const bk = r.h + ":" + hourEnd;
      (buckets[bk] = buckets[bk] || { hb, hourEnd, users: [], ts: 0 });
      buckets[bk].users.push(r.u); buckets[bk].ts = Math.max(buckets[bk].ts, d.getTime());
    });
    Object.keys(buckets).forEach((bk) => {
      const b = buckets[bk];
      feedRows.push({ k: "pack", ts: b.ts, key: "p" + bk, hb: b.hb, n: b.users.length, faces: b.users.slice(0, 3).map((u) => rosterById[u]).filter(Boolean), hourEnd: b.hourEnd });
    });
  }
  feedRows.sort((a, b) => (a.ts || 0) - (b.ts || 0));
  // Лента не резиновая: показываем последние 60 событий, о срезе говорим честно.
  const feedCut = feedRows.length > 60;
  const feedShown = feedCut ? feedRows.slice(-60) : feedRows;
  const MILES = [7, 14, 30, 50, 100, 200, 365, 500, 730, 1000];
  const hasMiles = (ageDays && MILES.indexOf(ageDays) >= 0) || (gTgt > 0 && gCur > 0);
  // Лента открыта на СВЕЖЕМ (низ) и докручивается сама, когда прилетает новое, — как мессенджер.
  const _feedNRef = React.useRef(-1);
  React.useLayoutEffect(() => {
    const el = feedBoxRef.current; if (!el) return;
    if (_feedNRef.current === feedShown.length) return;
    _feedNRef.current = feedShown.length;
    el.scrollTop = el.scrollHeight;
  }, [feedShown.length]);

  const openPerson = (p) => {
    if (!p) return;
    openSheet(<CirclePersonSheetLive team={t} person={p} meId={meId} habits={teamHabits} rangeRows={rangeRows} dayRows={dayRows}
      cheersOn={cheersOn} cheered={!!myCheered[p.id]} onCheer={() => sendCheer(p.id)}
      onWrite={(name) => { setText((cur) => cur || ("@" + name + " ")); setTimeout(() => { try { composerRef.current && composerRef.current.focus(); } catch (e) {} }, 380); }}
      isDark={isDark} />);
  };
  const openHabitSheet = (h) => {
    if (typeof HabitStandardSheetLive !== "function") return;
    openSheet(<HabitStandardSheetLive mode="circle" habit={h} team={t} members={members} meId={meId} rangeRows={rangeRows} dayRows={dayRows}
      done={myDone(h)} onToggle={() => (adoptedFor(h) ? markAdopted(h) : toggleMyTeamHabit(h))}
      onEdit={_isOwner ? () => openEditTeamHabit(h) : null} onPerson={openPerson} isDark={isDark} />);
  };

  /* ── праздник закрытого дня круга (механика не менялась) ── */
  const _myDoneCount = teamHabits.filter((h) => myDone(h)).length;
  const _teamDoneRef = React.useRef(null);
  React.useEffect(() => {
    const prev = _teamDoneRef.current;
    _teamDoneRef.current = _myDoneCount;
    if (prev == null) return;
    if (_myDoneCount <= prev) return;
    if (!teamHabits.length || _myDoneCount !== teamHabits.length) return;
    if (typeof window.bosCelebrateScope !== "function") return;
    if (!window.bosCelebrateScope("circle:" + (app?.persistId || "") + ":" + (t.cloudId || t._id || t.id))) return;
    if (app?.grantBonusXP && typeof bosTodayKey === "function") app.grantBonusXP("perfectday:" + bosTodayKey(), 30);
  }, [_myDoneCount, teamHabits.length]);

  /* ── вёрстка ── */
  const glass = bosGlassChrome(isDark);
  const navBtn = { ...glass, width: 38, height: 38, borderRadius: 999, border: 0, display: "grid", placeItems: "center", color: isDark ? "#fff" : "#0a0a0a", cursor: "pointer", flexShrink: 0 };
  const editGoalLike = { _id: t._id, id: t.id, cloudId: t.cloudId, __isTeam: true, __team: t, name: t.name, emoji: t.emblem, color: t.accent, target: t.target, unit: t.unit, deadline: t.date || t.deadline || "", circle: true, type: t.type, vis: t.vis, stake: t.stake, goal: t.goal, desc: (goalProg && goalProg.desc) || t.desc || "", joined: t.joined, threadOff: threadOff, habitIds: [] };
  const subParts = [];
  if (ageDays) subParts.push("живёт " + ageDays + " " + ((ageDays % 10 === 1 && ageDays % 100 !== 11) ? "день" : (ageDays % 10 >= 2 && ageDays % 10 <= 4 && (ageDays % 100 < 12 || ageDays % 100 > 14)) ? "дня" : "дней"));
  if (membersN) subParts.push(membersN + " " + bosRoomPeopleWord(membersN));
  if (t.vis === "public") subParts.push("открытый");
  if (stake > 0) subParts.push("банк " + bank + " XP");
  const card = { background: "var(--card)", borderRadius: 20, boxShadow: "var(--card-shadow)" };
  const bubbleOther = isDark ? "rgba(255,255,255,0.07)" : "#fff";

  const dayList = [];
  teamHabits.forEach((h, i) => {
    const done = myDone(h);
    const facesH = (Array.isArray(h.todayUsers) ? h.todayUsers : []).map((u) => rosterById[u]).filter(Boolean);
    const myT = done ? myTimeFor(h.id) : null;
    const mySuffix = done ? (myT ? " · ты в " + myT : " · ты только что") : "";
    const sub = membersN <= 12
      ? ((h.doneToday || 0) + " из " + (h.total != null ? h.total : membersN) + " сегодня" + mySuffix)
      : ((h.doneToday || 0) + " уже" + mySuffix);
    dayList.push(
      <CircleDayRowLive key={"h" + (h.id || i)} first={dayList.length === 0} isDark={isDark}
        icon={bosIcon(h.emoji, 18, h.color)} iconColor={h.color && h.color !== "#0a0a0a" ? h.color : null}
        name={h.name} sub={sub} subGold={done} faces={facesH}
        on={done} inert={!_live}
        onToggle={() => (adoptedFor(h) ? markAdopted(h) : toggleMyTeamHabit(h))}
        onOpen={() => openHabitSheet(h)} />
    );
  });
  _teamTasks.forEach((tk, i) => {
    const facesT = (Array.isArray(tk.doneUsers) ? tk.doneUsers : []).map((u) => rosterById[u]).filter(Boolean);
    dayList.push(
      <CircleDayRowLive key={"t" + tk.id} first={dayList.length === 0} isDark={isDark}
        icon={<I.Flag size={16} strokeWidth={2.2} color="var(--text-2)" />} name={tk.text} tag="дело"
        sub={(tk.doneCount || 0) + " " + ((tk.doneCount || 0) === 1 ? "сделал" : "сделали")} faces={facesT}
        on={!!tk.doneByMe} inert={!_live}
        onToggle={() => toggleMyTeamTask(tk)} />
    );
  });

  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      {/* ШАПКА (FinHead): назад · эмблема · имя+факты · [компас владельца] · правка · позвать */}
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "2px 0 2px", minHeight: 44 }}>
        {!_inTG && (
          <button onClick={() => navigate(from)} className="tap" aria-label="Назад" style={{ width: 36, height: 36, borderRadius: "50%", border: 0, display: "grid", placeItems: "center", background: "transparent", color: "var(--text)", flexShrink: 0, cursor: "pointer", marginLeft: -6 }}>
            <I.ChevronLeft size={20} strokeWidth={2.4} />
          </button>
        )}
        <span style={{ width: 42, height: 42, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", fontSize: 20,
          background: BOS_ORB_SHEEN + ", " + (isDark ? "linear-gradient(160deg,#464c58,#30353f)" : "linear-gradient(160deg,#eef1f6,#dadfe7)"),
          boxShadow: bosOrbGlass(isDark) }}>{bosIcon(t.emblem || "👥", 20, null)}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
          <div style={{ fontSize: 10.5, color: "var(--text-4)", marginTop: 1, display: "flex", alignItems: "center", gap: 4, overflow: "hidden", whiteSpace: "nowrap" }}>
            {ageDays ? <I.Flame size={10} color={BOS_ROOM_GOLD} filled strokeWidth={1.6} /> : null}
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{subParts.join(" · ")}</span>
          </div>
        </div>
        {_isOwner && _live && (
          <button onClick={() => navigate("team-cabinet", { team: t, from: from })} className="tap" aria-label="Кабинет ведущего" title="Кабинет ведущего"
            style={{ ...glass, height: 36, borderRadius: 999, border: 0, padding: "0 11px", display: "inline-flex", alignItems: "center", gap: 5, color: isDark ? "#fff" : "#0a0a0a", flexShrink: 0, cursor: "pointer" }}>
            <I.Compass size={16} strokeWidth={2} />
            {redCount > 0 && <span style={{ minWidth: 16, height: 16, borderRadius: 999, background: "#E0362B", color: "#fff", fontSize: 9.5, fontWeight: 800, display: "grid", placeItems: "center", padding: "0 4px" }}>{redCount}</span>}
          </button>
        )}
        {/* Карандаш владельца живёт В КАБИНЕТЕ (шапка = как макет FinHead: компас + позвать).
            Только у локального круга без облака кабинета нет — карандаш остаётся тут. */}
        {_isOwner && !_live && (
          <button onClick={() => openSheet(<GoalFormSheetLive mode="edit" circleOn={true} navigate={navigate} returnTo={from} goal={editGoalLike} />)} className="tap" data-haptic="selection" aria-label="Настройки круга" style={{ ...navBtn, width: 36, height: 36 }}><I.Pencil size={15} strokeWidth={2} /></button>
        )}
        <button onClick={() => openSheet(<TeamShareSheetLive team={t} />)} className="tap" data-haptic="selection" aria-label="Позвать в круг" style={{ ...navBtn, width: 36, height: 36 }}><I.Share size={15} strokeWidth={2} /></button>
      </div>

      {/* НИТЬ ДНЯ — лица в свой час; на большом круге — волна. */}
      {!threadOff && _live && (
        <div style={{ marginTop: 6 }}>
          <BosDayThreadLive faces={threadFaces.length <= 6 ? threadFaces : []} hours={threadFaces.length > 6 ? Object.keys(firstByUser).map((u) => _hr(firstByUser[u])) : []} isDark={isDark} />
        </div>
      )}

      {/* СЕРИЯ КРУГА — строка под нитью (финал И, дефект 3). */}
      {_live && (circleStreak > 0 || todayN > 0) && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 4px 0", flexWrap: "wrap" }}>
          {circleStreak > 0 && <I.Flame size={12} color={BOS_ROOM_GOLD} filled strokeWidth={1.6} />}
          {circleStreak > 0 && <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--text)" }}>{streakCap} {circleStreak === 1 ? "день" : circleStreak < 5 ? "дня" : "дней"} круг в ритме</span>}
          <span style={{ fontSize: 10.5, color: "var(--text-4)" }}>{(circleStreak > 0 ? "· " : "") + todayN + "/" + (membersN || "?") + " сегодня" + (topThird ? " · ты в верхней трети" : "")}</span>
        </div>
      )}

      {/* ЗАЯВКИ — владельцу, прямо у двери. */}
      {_isOwner && pending.length > 0 && (
        <div style={{ ...card, marginTop: 10, padding: "11px 13px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase", color: "var(--text-4)", marginBottom: 8 }}>Стучатся в круг · {pending.length}</div>
          {pending.map((p) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "5px 0" }}>
              <BuddyFaceLive avatar={p.avatar} name={p.name || "Гость"} size={28} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name || "Гость"}</span>
              <button onClick={() => approveReq(p.id)} className="tap" style={{ border: 0, borderRadius: 999, padding: "6px 13px", fontSize: 11.5, fontWeight: 700, cursor: "pointer", background: isDark ? "#fff" : "#0a0a0a", color: isDark ? "#0a0a0a" : "#fff" }}>Принять</button>
              <button onClick={() => rejectReq(p.id)} className="tap" style={{ border: 0, borderRadius: 999, padding: "6px 11px", fontSize: 11.5, fontWeight: 700, cursor: "pointer", background: isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)", color: "var(--text-2)" }}>Нет</button>
            </div>
          ))}
        </div>
      )}

      {/* МОЙ ДЕНЬ В КРУГЕ — один список: привычки + дела, чекбоксы справа. */}
      <BosRoomH2 extra={(teamHabits.length + _teamTasks.length) > 0 ? <span style={{ fontSize: 10.5, color: "var(--text-4)" }}>{(_myDoneCount + _teamTasks.filter((x) => x.doneByMe).length) + " из " + (teamHabits.length + _teamTasks.length)}</span> : null}>Привычки</BosRoomH2>
      <div style={{ ...card, padding: "3px 12px" }}>
        {dayList.length ? dayList : (
          <div style={{ padding: "18px 6px", textAlign: "center" }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-2)" }}>{_isOwner ? "Дай кругу первое общее дело" : "Ведущий ещё не добавил привычек"}</div>
            <div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 3 }}>{_isOwner ? "Привычка на каждый день или разовое дело" : "Загляни позже — здесь появится список дня"}</div>
          </div>
        )}
        {_isOwner && (
          <button onClick={() => openSheet(<CircleAddSheetLive isDark={isDark} onHabit={openAddHabit} onTask={() => openSheet(<CircleTaskComposeSheetLive isDark={isDark} onAdd={addTeamTaskCloud} />)} />)}
            className="tap" style={{ width: "100%", border: 0, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, padding: "11px 2px", borderTop: dayList.length ? "1px solid " + (isDark ? "rgba(255,255,255,0.06)" : "rgba(10,10,10,0.05)") : 0, color: "var(--text-3)" }}>
            <span style={{ width: 34, height: 34, borderRadius: 11, display: "grid", placeItems: "center", boxShadow: "inset 0 0 0 1.5px " + (isDark ? "rgba(255,255,255,0.14)" : "rgba(10,10,10,0.10)") }}><I.Plus size={16} strokeWidth={2.4} /></span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Привычка или дело</span>
          </button>
        )}
      </div>

      {/* ЛЮДИ — компактный грид лиц (решение David): молчащих тоже видно, тап — карточка. */}
      {membersN > 0 && (
        <React.Fragment>
          <BosRoomH2 extra={<span style={{ fontSize: 10.5, color: "var(--text-4)" }}>{todayN + " из " + membersN + " сегодня"}</span>}>Люди</BosRoomH2>
          <div style={{ ...card, padding: "13px 12px" }}>
            {/* Сетка как у календаря — 7 колонок на всю ширину, ряды ровные (David: «чтобы
                центрированно смотрелись и занимали всю область карточки»). */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", rowGap: 12, justifyItems: "center", alignItems: "center" }}>
              {members.map((m) => (
                <BosRoomFaceLive key={m.id} p={m} size={36} active={!!activeSet[m.id]} gold={m.id === meId && !!activeSet[m.id]} isDark={isDark} onClick={() => openPerson(m)} />
              ))}
              <button onClick={() => openSheet(<TeamShareSheetLive team={t} />)} className="tap" aria-label="Позвать в круг"
                style={{ width: 36, height: 36, borderRadius: "50%", border: 0, cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-3)", boxShadow: "inset 0 0 0 1.5px " + (isDark ? "rgba(255,255,255,0.14)" : "rgba(10,10,10,0.10)"), background: "transparent" }}>
                <I.Plus size={16} strokeWidth={2.4} />
              </button>
            </div>
          </div>
        </React.Fragment>
      )}

      {/* ПУЛЬС ДНЯ — начинается с тебя; отметки, слова и вехи — одна лента (подписи-аннотации убраны: David «тупая хуйня»). */}
      <BosRoomH2>Пульс дня</BosRoomH2>

      {/* Золотая строка: твоя отметка стала первой строкой ленты. */}
      {_iDidCircle && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9, borderRadius: 14, padding: "8px 11px", background: "rgba(240,195,10,0.12)" }}>
          <span style={{ borderRadius: "50%", lineHeight: 0, boxShadow: "0 0 0 2px " + BOS_ROOM_GOLD }}>
            <BuddyFaceLive avatar={(_meMember && _meMember.avatar) || "default"} name="Ты" size={22} />
          </span>
          <div style={{ flex: 1, fontSize: 11.5, fontWeight: 700, color: BOS_ROOM_GOLD_INK }}>
            {"Ты " + (myLastRow && habitById[myLastRow.h] ? "закрыл(а) «" + habitById[myLastRow.h].name + "»" : "сегодня в деле") + (myLastRow ? " · " + bosRoomHHMM(myLastRow.at) : " · только что")}
          </div>
          {!threadOff && <span style={{ fontSize: 9.5, color: "var(--text-4)", flexShrink: 0 }}>→ на нити ↑</span>}
        </div>
      )}
      {/* Тебя подбодрили — и кто. */}
      {cheeredMe.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9, borderRadius: 14, padding: "8px 11px", background: "rgba(240,195,10,0.10)" }}>
          <I.Flame size={14} color={BOS_ROOM_GOLD} filled strokeWidth={1.6} />
          <span style={{ flex: 1, fontSize: 11.5, fontWeight: 700, color: BOS_ROOM_GOLD_INK }}>Тебя подбодрили — {cheeredMe.length} {bosRoomPeopleWord(cheeredMe.length)}</span>
          <button onClick={() => openSheet(<CircleWhoSheetLive people={cheeredMe.map((u) => rosterById[u]).filter(Boolean)} />)} className="tap"
            style={{ border: 0, borderRadius: 999, padding: "4px 10px", fontSize: 10.5, fontWeight: 700, cursor: "pointer", background: "var(--card)", color: "var(--text-2)" }}>кто?</button>
        </div>
      )}

      {/* ЧАТ-БОКС (David: «пульс не должен тянуться бесконечно вниз»): ограниченная область,
          лента скроллится ВНУТРИ и открыта на свежем, композер приклеен к её дну. */}
      <div style={{ ...card, overflow: "hidden" }}>
      <div ref={feedBoxRef} className="screen-scroll" style={{ height: "min(430px, 56vh)", overflowY: "auto", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain", padding: "12px 12px 4px", display: "flex", flexDirection: "column" }}>
      {feedCut && <div style={{ textAlign: "center", fontSize: 10, color: "var(--text-5, var(--text-4))", margin: "0 0 8px", flexShrink: 0 }}>показаны последние события</div>}
      {feedShown.length === 0 && !hasMiles ? (
        <div style={{ textAlign: "center", padding: "0 24px", margin: "auto" }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-2)", marginBottom: 3 }}>Пока тихо</div>
          <div style={{ fontSize: 12, lineHeight: 1.5, color: "var(--text-4)" }}>Отметь дело дня или напиши кругу — с этого и начинается пульс</div>
        </div>
      ) : feedShown.map((f) => {
        if (f.k === "msg") {
          const m = f.m;
          return m.me ? (
            <div key={f.key} style={{ display: "flex", justifyContent: "flex-end", marginBottom: 9 }}>
              <div style={{ maxWidth: "78%", background: isDark ? "#fff" : "#0a0a0a", color: isDark ? "#0a0a0a" : "#fff", borderRadius: "16px 16px 5px 16px", padding: m.img ? 7 : "8px 12px" }}>
                {m.img ? <img src={m.img} alt="" loading="lazy" style={{ width: 180, maxWidth: "100%", maxHeight: 230, objectFit: "cover", borderRadius: 12, display: "block" }} /> : <div style={{ fontSize: 13.5, lineHeight: 1.4 }}>{m.t}</div>}
                <div style={{ fontSize: 9.5, opacity: 0.55, textAlign: "right", marginTop: 2 }}>{m.time}</div>
              </div>
            </div>
          ) : (
            <div key={f.key} style={{ display: "flex", gap: 8, marginBottom: 9, alignItems: "flex-end" }}>
              {(() => { const p = rosterById[m._uid]; return p ? <BosRoomFaceLive p={p} size={24} isDark={isDark} onClick={() => openPerson(p)} /> : <BuddyFaceLive avatar={m.avatar} name={m.who} size={24} />; })()}
              <div style={{ maxWidth: "78%" }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: "var(--text-4)", margin: "0 0 2px 4px" }}>{m.who + " · " + (m.time || "")}</div>
                <div style={{ background: bubbleOther, borderRadius: "16px 16px 16px 5px", padding: m.img ? 7 : "8px 12px", boxShadow: isDark ? "none" : "0 1px 2px rgba(0,0,0,0.05)" }}>
                  {m.img ? <img src={m.img} alt="" loading="lazy" style={{ width: 180, maxWidth: "100%", maxHeight: 230, objectFit: "cover", borderRadius: 12, display: "block" }} /> : <div style={{ fontSize: 13.5, lineHeight: 1.4, color: "var(--text)" }}>{m.t}</div>}
                </div>
              </div>
            </div>
          );
        }
        if (f.k === "pack") return (
          <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9, background: isDark ? "rgba(255,255,255,0.05)" : "var(--surface-3)", borderRadius: 14, padding: "8px 11px" }}>
            <span style={{ fontSize: 15, lineHeight: 1 }}>{bosIcon(f.hb.emoji, 15, f.hb.color)}</span>
            <div style={{ flex: 1, fontSize: 11.5, fontWeight: 600, color: "var(--text-2)" }}>{"+" + f.n + " закрыли «" + f.hb.name + "» к " + f.hourEnd + ":00"}</div>
            <span style={{ display: "flex" }}>
              {f.faces.map((p, k) => <span key={k} style={{ marginLeft: k ? -6 : 0, borderRadius: "50%", boxShadow: "0 0 0 2px " + (isDark ? "#1c1c20" : "#fff"), lineHeight: 0 }}><BuddyFaceLive avatar={p.avatar} name={p.name} size={18} /></span>)}
            </span>
          </div>
        );
        // отметка человека (маленький круг): лицо → имя закрыл(а) «X» · время · 🔥
        return (
          <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
            <BosRoomFaceLive p={f.p} size={24} isDark={isDark} onClick={() => openPerson(f.p)} />
            <div style={{ flex: 1, minWidth: 0, fontSize: 12, color: "var(--text-2)" }}>
              <b style={{ color: "var(--text)", fontWeight: 700 }}>{f.p.name + " "}</b>
              {"закрыл(а) «" + f.hb.name + "»"}
              <span style={{ color: "var(--text-4)" }}>{" · " + bosRoomHHMM(f.at)}</span>
            </div>
            {cheersOn && f.p.id !== meId && (
              <button onClick={() => sendCheer(f.p.id)} className="tap" aria-label={"Подбодрить " + f.p.name}
                style={{ display: "inline-flex", alignItems: "center", border: 0, borderRadius: 999, padding: "4px 9px", cursor: "pointer", background: myCheered[f.p.id] ? "rgba(240,195,10,0.14)" : (isDark ? "rgba(255,255,255,0.07)" : "var(--surface-3)") }}>
                <I.Flame size={12} color={myCheered[f.p.id] ? BOS_ROOM_GOLD : "var(--text-4)"} filled={!!myCheered[f.p.id]} strokeWidth={2} />
              </button>
            )}
          </div>
        );
      })}

      {/* ВЕХИ — золотые строки в конце ленты (банк/цель — тонко, решение David). */}
      {ageDays && MILES.indexOf(ageDays) >= 0 && <CircleMileLine>{"Кругу " + ageDays + " дней 💛"}</CircleMileLine>}
      {gTgt > 0 && gCur > 0 && (
        <CircleMileLine>{gDone ? ("🎉 Цель достигнута — " + gCur + (gUnit ? " " + gUnit : "")) : ("Круг набрал " + gCur + " из " + gTgt + (gUnit ? " " + gUnit : "") + " 💛")}</CircleMileLine>
      )}
      </div>

      {/* КОМПОЗЕР — на дне чат-бокса, как в мессенджере. */}
      <div style={{ display: "flex", gap: 7, alignItems: "center", padding: "9px 10px", borderTop: "1px solid " + (isDark ? "rgba(255,255,255,0.07)" : "rgba(10,10,10,0.06)") }}>
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
        <button onClick={() => { if (fileRef.current) fileRef.current.click(); }} className="tap" aria-label="Прикрепить фото"
          style={{ width: 36, height: 36, borderRadius: "50%", border: 0, cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0, color: "var(--text-2)", background: isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.6" /><path d="M21 15l-5-5L5 21" /></svg>
        </button>
        <input ref={composerRef} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }} placeholder="Написать кругу…"
          onFocus={() => setTimeout(() => { try { composerRef.current && composerRef.current.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (e) {} }, 250)}
          style={{ flex: 1, minWidth: 0, ...bosChipGlass(isDark), border: 0, outline: 0, borderRadius: 999, padding: "10px 15px", fontSize: 15, color: "var(--text)" }} />
        <button onClick={send} className="tap" aria-label="Отправить"
          style={{ width: 36, height: 36, borderRadius: "50%", border: 0, cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0, background: text.trim() ? (isDark ? "#fff" : "#0a0a0a") : (isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)"), transition: "background .2s" }}>
          <I.Send size={15} color={text.trim() ? (isDark ? "#0a0a0a" : "#fff") : "var(--text-4)"} strokeWidth={2.2} />
        </button>
      </div>
      </div>
    </div>
  );
}

/* ══════════════════ КАРТОЧКА ЧЕЛОВЕКА (кадр 3) ══════════════════
   Те же данные, что видит ведущий, — ничего беднее и ничего больше: одна неделя по каждой
   привычке (David: «недели вполне хватает»), месяц кольцами, УРОВЕНЬ (David 2026-07-16),
   🔥 подбодрить и 💬 написать. Видно только то, что человек делает В ЭТОМ круге. */
function CirclePersonSheetLive({ team, person, meId, habits, rangeRows, dayRows, cheersOn, cheered, onCheer, onWrite, isDark }) {
  const { close } = useSheet();
  const me = person.id === meId;
  const [level, setLevel] = React.useState(null);
  React.useEffect(() => {
    let on = true;
    if (window.bosCloud && window.bosCloud.profilesPublic) {
      window.bosCloud.profilesPublic([person.id]).then((map) => {
        if (on && map && map[person.id] && (map[person.id].level | 0) > 0) setLevel(map[person.id].level | 0);
      }).catch(() => {});
    }
    return () => { on = false; };
  }, [person.id]);
  const [didCheer, setDidCheer] = React.useState(!!cheered);

  const mine = (rangeRows || []).filter((r) => r.u === person.id);
  const mineDays = {}; mine.forEach((r) => { (mineDays[r.day] = mineDays[r.day] || {})[r.h] = true; });
  // Серия: подряд-дни с хотя бы одной отметкой (окно 31 день — дальше честно «31+»).
  let streak = 0;
  {
    let start = mineDays[bosRoomDayKey(0)] ? 0 : 1;
    for (let i = start; i < 31; i++) { if (mineDays[bosRoomDayKey(i)]) streak++; else break; }
  }
  const todayMine = (dayRows || []).filter((r) => r.u === person.id);
  const firstAt = todayMine.length ? todayMine.reduce((a, b) => (a.at < b.at ? a : b)).at : null;
  const weekKeys = []; for (let i = 6; i >= 0; i--) weekKeys.push(bosRoomDayKey(i));
  // «в круге с …»
  const since = person.joinedAt ? new Date(person.joinedAt) : null;
  const MONTHS_RU = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
  const sinceTxt = since ? ("в круге с " + since.getDate() + " " + MONTHS_RU[since.getMonth()]) : null;
  // Месяц кольцами: доля привычек круга, закрытых человеком в тот день.
  const now = new Date();
  const dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthName = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"][now.getMonth()];
  const hN = Math.max(1, (habits || []).length);
  const dayPct = (d) => {
    const k = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
    return Object.keys(mineDays[k] || {}).length / hN;
  };
  const chips = todayMine.slice().sort((a, b) => (a.at < b.at ? -1 : 1)).map((r) => {
    const hb = (habits || []).find((h) => h.id === r.h);
    return hb ? { icon: bosIcon(hb.emoji, 12, hb.color), at: bosRoomHHMM(r.at) } : null;
  }).filter(Boolean);

  return (
    <div style={{ padding: "2px 2px 8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <BosRoomFaceLive p={person} size={44} gold={!!firstAt || me} isDark={isDark} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{me ? "Ты" : person.name}</span>
            {level != null && <span style={{ fontSize: 10, fontWeight: 800, color: BOS_ROOM_GOLD_INK, background: "rgba(240,195,10,0.14)", borderRadius: 999, padding: "3px 8px", flexShrink: 0 }}>{"ур. " + level}</span>}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 1, display: "flex", alignItems: "center", gap: 4, overflow: "hidden", whiteSpace: "nowrap" }}>
            {streak > 0 && <I.Flame size={10} color={BOS_ROOM_GOLD} filled strokeWidth={1.6} />}
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
              {(streak > 0 ? ("серия " + (streak >= 31 ? "31+" : streak)) : (firstAt ? "" : "сегодня ещё не в деле")) + (streak > 0 && sinceTxt ? " · " : "") + (sinceTxt || "")}
            </span>
          </div>
        </div>
        {!me && cheersOn && (
          <button onClick={() => { setDidCheer(true); onCheer && onCheer(); }} className="tap" aria-label="Подбодрить"
            style={{ width: 34, height: 34, borderRadius: "50%", border: 0, cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0, background: didCheer ? "rgba(240,195,10,0.16)" : (isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)") }}>
            <I.Flame size={15} color={didCheer ? BOS_ROOM_GOLD : "var(--text-2)"} filled={didCheer} strokeWidth={2} />
          </button>
        )}
        {!me && onWrite && (
          <button onClick={() => { close(); onWrite(person.name); }} className="tap" aria-label="Написать"
            style={{ width: 34, height: 34, borderRadius: "50%", border: 0, cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0, background: isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)" }}>
            <I.MessageCircle size={15} color="var(--text-2)" strokeWidth={2} />
          </button>
        )}
      </div>

      {firstAt && (
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 10 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: BOS_ROOM_GOLD_INK, background: "rgba(240,195,10,0.14)", borderRadius: 999, padding: "3px 9px" }}>
            <I.Clock size={11} color={BOS_ROOM_GOLD} strokeWidth={2} />{"сегодня с " + bosRoomHHMM(firstAt)}
          </span>
          {chips.slice(0, 3).map((c, i) => (
            <span key={i} style={{ ...bosChipGlass(isDark), display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "var(--text-2)", borderRadius: 999, padding: "3px 9px" }}>{c.icon}{c.at}</span>
          ))}
        </div>
      )}

      <BosRoomH2 extra={<span style={{ fontSize: 10.5, color: "var(--text-4)" }}>по каждой привычке</span>}>{me ? "Твоя неделя" : "Неделя"}</BosRoomH2>
      <div style={{ background: "var(--card)", borderRadius: 18, boxShadow: "var(--card-shadow)", padding: "9px 14px" }}>
        {(habits || []).length ? (habits || []).map((h, i) => (
          <div key={h.id || i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 0", borderTop: i ? "1px solid " + (isDark ? "rgba(255,255,255,0.05)" : "rgba(10,10,10,0.04)") : 0 }}>
            <span style={{ fontSize: 13, width: 22, textAlign: "center", flexShrink: 0 }}>{bosIcon(h.emoji, 15, h.color)}</span>
            <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.name}</span>
            <span style={{ display: "inline-flex", gap: 3, flexShrink: 0 }}>
              {weekKeys.map((k, j) => <span key={j} style={{ width: 5.5, height: 5.5, borderRadius: "50%", background: (mineDays[k] && mineDays[k][h.id]) ? BOS_ROOM_GOLD : (isDark ? "rgba(255,255,255,0.14)" : "rgba(10,10,10,0.12)") }} />)}
            </span>
          </div>
        )) : <div style={{ fontSize: 12, color: "var(--text-4)", padding: "10px 2px" }}>В круге пока нет общих привычек</div>}
      </div>

      <BosRoomH2 extra={<span style={{ fontSize: 10.5, color: "var(--text-4)" }}>кольцо = доля дел дня</span>}>{monthName}</BosRoomH2>
      <div style={{ background: "var(--card)", borderRadius: 18, boxShadow: "var(--card-shadow)", padding: "13px 14px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 5, justifyItems: "center" }}>
          {Array.from({ length: dim }).map((_, i) => (
            <span key={i} style={{ position: "relative", width: 26, height: 26, display: "grid", placeItems: "center" }}>
              <span style={{ position: "absolute", inset: 0 }}>{bosDayRing(dayPct(i + 1), BOS_ROOM_GOLD, isDark, { sw: 3.4 })}</span>
              <span style={{ fontSize: 8, fontWeight: 700, color: "var(--text-4)", position: "relative" }}>{i + 1}</span>
            </span>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 9.5, color: "var(--text-4)", padding: "8px 4px 0", lineHeight: 1.4 }}>
        Видно только то, что человек делает в этом круге. Участник и ведущий видят одно и то же.
      </div>
    </div>
  );
}

/* ══════════════════ КАБИНЕТ ВЕДУЩЕГО (макет К) ══════════════════
   Утро ведущего за 30 секунд: цифры дня → здоровье программы → удержание → журнал по тревоге.
   Прозрачность вместо слежки: тут нет ничего, чего участник не видит о себе сам. */
function CircleCabinetLive() {
  const { navigate, params } = useNav();
  const app = useApp();
  const { open: openSheet } = useSheet();
  const t = params?.team || {};
  const from = params?.from || "community";
  const isDark = app?.themeOverride === "dark";
  const _live = !!(window.bosCloud && window.bosCloud.enabled() && t.cloudId);

  const [meId, setMeId] = React.useState(null);
  const [roster, setRoster] = React.useState(() => _bosTeamGet("roster:" + t.cloudId) || []);
  const [habits, setHabits] = React.useState(() => _bosTeamGet("habits:" + t.cloudId) || []);
  const [rangeS, setRangeS] = React.useState(() => _bosTeamGet("range31:" + t.cloudId));
  const [dayFeedS, setDayFeedS] = React.useState(() => _bosTeamGet("dayfeed:" + t.cloudId));
  const [cheers, setCheers] = React.useState(() => _bosTeamGet("cheers:" + t.cloudId));
  const [pending, setPending] = React.useState([]);
  React.useEffect(() => {
    if (!_live) return;
    let on = true;
    window.bosCloud.uid().then((id) => { if (on) setMeId(id || null); });
    window.bosCloud.teamMembers(t.cloudId).then((mem) => { if (on && Array.isArray(mem)) setRoster(_bosTeamPut("roster:" + t.cloudId, mem.map((m) => ({ id: m.id, name: m.name || "Участник", avatar: m.avatar, role: m.role, joinedAt: m.joinedAt || null })))); });
    window.bosCloud.teamHabitsFull(t.cloudId).then((hs) => { if (on && Array.isArray(hs)) setHabits(_bosTeamPut("habits:" + t.cloudId, hs)); });
    window.bosCloud.teamLogsRange(t.cloudId, 31).then((d) => { if (on && d) setRangeS(_bosTeamPut("range31:" + t.cloudId, d)); });
    window.bosCloud.teamDayFeed(t.cloudId).then((d) => { if (on && d) setDayFeedS(_bosTeamPut("dayfeed:" + t.cloudId, d)); });
    if (window.bosCloud.teamCheersToday) window.bosCloud.teamCheersToday(t.cloudId).then((d) => { if (on && d) setCheers(_bosTeamPut("cheers:" + t.cloudId, d)); });
    if (window.bosCloud.pendingRequests) window.bosCloud.pendingRequests(t.cloudId).then((p) => { if (on) setPending(Array.isArray(p) ? p : []); }).catch(() => {});
    return () => { on = false; };
  }, [_live, t.cloudId]);
  const approveReq = (uid) => { window.bosCloud.approveMember(t.cloudId, uid).then((ok) => { if (ok) setPending((p) => p.filter((x) => x.id !== uid)); }); };
  const rejectReq = (uid) => { window.bosCloud.rejectMember(t.cloudId, uid).then((ok) => { if (ok) setPending((p) => p.filter((x) => x.id !== uid)); }); };

  const rows = (rangeS && rangeS.rows) || [];
  const dayRows = (dayFeedS && dayFeedS.rows) || [];
  const members = (roster || []).filter((m) => m.role !== "pending");
  const N = members.length;
  const cheersOn = !!(cheers && Array.isArray(cheers.rows));
  const myCheered = {}; if (cheersOn && meId) cheers.rows.forEach((r) => { if (r.from === meId) myCheered[r.to] = true; });
  const sendCheer = (toId) => { if (!cheersOn || myCheered[toId] || toId === meId) return; setCheers((c) => c ? { ...c, rows: c.rows.concat([{ from: meId, to: toId, at: new Date().toISOString() }]) } : c); window.bosCloud.sendTeamCheer(t.cloudId, toId); if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} } };

  const byUserDays = {}; rows.forEach((r) => { ((byUserDays[r.u] = byUserDays[r.u] || {})[r.day] = byUserDays[r.u][r.day] || {})[r.h] = true; });
  const todaySet = {}; dayRows.forEach((r) => { todaySet[r.u] = true; });
  const todayN = Object.keys(todaySet).filter((u) => members.some((m) => m.id === u)).length;

  const silentDays = (m) => {
    const dd = byUserDays[m.id]; if (!dd) return 31;
    for (let i = 0; i < 31; i++) if (dd[bosRoomDayKey(i)]) return i;
    return 31;
  };
  const streakOf = (m) => {
    const dd = byUserDays[m.id] || {};
    let s = 0, start = dd[bosRoomDayKey(0)] ? 0 : 1;
    for (let i = start; i < 31; i++) { if (dd[bosRoomDayKey(i)]) s++; else break; }
    return s;
  };
  const isNewbie = (m) => m.joinedAt && (Date.now() - new Date(m.joinedAt).getTime()) < 3 * 86400000;
  const wards = members.filter((m) => m.id !== meId).map((m) => ({ m, silent: silentDays(m), streak: streakOf(m), nb: isNewbie(m), today: !!todaySet[m.id] }));
  const RED = wards.filter((w) => !w.nb && w.silent >= 3);
  const YEL = wards.filter((w) => !w.nb && w.silent > 0 && w.silent < 3);
  const NEW = wards.filter((w) => w.nb);
  const OK = wards.filter((w) => !w.nb && w.silent === 0);

  // Здоровье программы: доля закрытий за 7 дней и сдвиг к прошлой неделе.
  const week = (off) => { const ks = {}; for (let i = off; i < off + 7; i++) ks[bosRoomDayKey(i)] = true; return ks; };
  const wNow = week(0), wPrev = week(7);
  const health = (habits || []).map((h) => {
    let a = 0, b = 0;
    rows.forEach((r) => { if (r.h !== h.id) return; if (wNow[r.day]) a++; else if (wPrev[r.day]) b++; });
    const cap = Math.max(1, N * 7);
    const pct = Math.round((a / cap) * 100), prev = Math.round((b / cap) * 100);
    return { h, pct, delta: pct - prev };
  });
  // Удержание: доля участников с ≥1 отметкой в каждую из 4 недель.
  const reten = [3, 2, 1, 0].map((wk) => {
    const ks = week(wk * 7);
    const act = members.filter((m) => { const dd = byUserDays[m.id]; return dd && Object.keys(dd).some((k) => ks[k]); }).length;
    return N ? Math.round((act / N) * 100) : 0;
  });

  const [sortBy, setSortBy] = React.useState("alarm");
  const [q, setQ] = React.useState("");
  const [openId, setOpenId] = React.useState(null);
  const [showAll, setShowAll] = React.useState(false);
  const sorted = wards.slice().sort((a, b) => {
    if (sortBy === "streak") return b.streak - a.streak;
    if (sortBy === "name") return (a.m.name || "").localeCompare(b.m.name || "", "ru");
    if (sortBy === "old") return b.silent - a.silent;
    return (b.silent - a.silent) || (a.today === b.today ? 0 : a.today ? 1 : -1);
  }).filter((w) => !q.trim() || (w.m.name || "").toLowerCase().includes(q.trim().toLowerCase()));

  const card = { background: "var(--card)", borderRadius: 20, boxShadow: "var(--card-shadow)" };
  const weekKeys = []; for (let i = 6; i >= 0; i--) weekKeys.push(bosRoomDayKey(i));
  // «Написать» из кабинета = комната с готовым «@Имя » в композере (лички в приложении нет).
  const writeTo = (m) => navigate("team-detail", { team: t, from: from, prefill: "@" + ((m.name || "").split(" ")[0] || "друг") + " " });
  const openPerson = (m) => openSheet(<CirclePersonSheetLive team={t} person={m} meId={meId} habits={habits} rangeRows={rows} dayRows={dayRows}
    cheersOn={cheersOn} cheered={!!myCheered[m.id]} onCheer={() => sendCheer(m.id)} onWrite={() => writeTo(m)} isDark={isDark} />);

  const wardRow = (w) => {
    const open = openId === w.m.id;
    const risk = w.silent >= 3 && !w.nb ? ["#E0362B", "молчит " + (w.silent >= 31 ? "31+" : w.silent) + " дн"]
      : w.silent > 0 && !w.nb ? [BOS_ROOM_GOLD_INK, "пропустил(а) " + w.silent + " дн"]
      : w.nb ? [BOS_ROOM_GOLD_INK, "новичок — хрупкое окно"]
      : [null, w.today ? "сегодня ✓" : "сегодня ещё нет"];
    const dd = byUserDays[w.m.id] || {};
    return (
      <div key={w.m.id} style={{ ...card, marginBottom: 7, padding: "10px 12px", boxShadow: w.silent >= 3 && !w.nb ? "var(--card-shadow), inset 0 0 0 1px rgba(224,54,43,0.25)" : "var(--card-shadow)" }}>
        <div onClick={() => setOpenId(open ? null : w.m.id)} style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }}>
          <BosRoomFaceLive p={w.m} size={28} active={w.today} isDark={isDark} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.m.name}</div>
            <div style={{ fontSize: 9.5, color: risk[0] || "var(--text-4)", fontWeight: risk[0] ? 700 : 400 }}>{risk[1]}</div>
          </div>
          <span style={{ display: "inline-flex", gap: 3, flexShrink: 0 }}>
            {weekKeys.map((k, j) => <span key={j} style={{ width: 5, height: 5, borderRadius: "50%", background: dd[k] ? BOS_ROOM_GOLD : (isDark ? "rgba(255,255,255,0.14)" : "rgba(10,10,10,0.12)") }} />)}
          </span>
          {w.streak > 0 && <span style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: 10.5, fontWeight: 800, color: BOS_ROOM_GOLD_INK, flexShrink: 0 }}><I.Flame size={10} color={BOS_ROOM_GOLD} filled strokeWidth={1.6} />{w.streak >= 31 ? "31+" : w.streak}</span>}
          {cheersOn && (
            <button onClick={(e) => { e.stopPropagation(); sendCheer(w.m.id); }} className="tap" aria-label="Подбодрить"
              style={{ width: 28, height: 28, borderRadius: "50%", border: 0, cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0, background: myCheered[w.m.id] ? "rgba(240,195,10,0.16)" : (isDark ? "rgba(255,255,255,0.07)" : "var(--surface-3)") }}>
              <I.Flame size={12} color={myCheered[w.m.id] ? BOS_ROOM_GOLD : "var(--text-3)"} filled={!!myCheered[w.m.id]} strokeWidth={2} />
            </button>
          )}
          <I.ChevronRight size={12} color="var(--text-4)" style={{ transform: open ? "rotate(90deg)" : "none", flexShrink: 0 }} />
        </div>
        {open && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid " + (isDark ? "rgba(255,255,255,0.07)" : "rgba(10,10,10,0.06)") }}>
            {(habits || []).map((h, i) => (
              <div key={h.id || i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 12, width: 20, textAlign: "center" }}>{bosIcon(h.emoji, 14, h.color)}</span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 11, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.name}</span>
                <span style={{ display: "inline-flex", gap: 2.5 }}>
                  {weekKeys.map((k, j) => <span key={j} style={{ width: 4.5, height: 4.5, borderRadius: "50%", background: (dd[k] && dd[k][h.id]) ? BOS_ROOM_GOLD : (isDark ? "rgba(255,255,255,0.14)" : "rgba(10,10,10,0.12)") }} />)}
                </span>
              </div>
            ))}
            <div style={{ display: "flex", gap: 7, marginTop: 6 }}>
              <button onClick={() => writeTo(w.m)} className="tap" style={{ flex: 1, border: 0, borderRadius: 999, padding: "8px 0", fontSize: 11.5, fontWeight: 700, cursor: "pointer", background: isDark ? "#fff" : "#0a0a0a", color: isDark ? "#0a0a0a" : "#fff" }}>Написать</button>
              <button onClick={() => openPerson(w.m)} className="tap" style={{ flex: 1, border: 0, borderRadius: 999, padding: "8px 0", fontSize: 11.5, fontWeight: 700, cursor: "pointer", background: isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)", color: "var(--text)" }}>Карточка</button>
            </div>
          </div>
        )}
      </div>
    );
  };
  const secTitle = (color, txt) => <div style={{ margin: "10px 0 6px", fontSize: 10, fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase", color: color }}>{txt}</div>;
  const _inTG = (typeof window !== "undefined" && window.__TG);
  const W = 300, H = 54;
  const rx = (i) => 10 + i * (W - 20) / 3, ry = (v) => H - 6 - Math.max(0, (v - 40)) / 60 * (H - 14);
  const retPath = reten.map((v, i) => (i ? "L" : "M") + rx(i) + " " + ry(v)).join(" ");

  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "2px 0 4px", minHeight: 44 }}>
        {!_inTG && (
          <button onClick={() => navigate("team-detail", { team: t, from: from })} className="tap" aria-label="Назад" style={{ width: 36, height: 36, borderRadius: "50%", border: 0, display: "grid", placeItems: "center", background: "transparent", color: "var(--text)", cursor: "pointer", marginLeft: -6 }}>
            <I.ChevronLeft size={20} strokeWidth={2.4} />
          </button>
        )}
        <span style={{ width: 38, height: 38, borderRadius: "50%", display: "grid", placeItems: "center", background: "rgba(240,195,10,0.14)", flexShrink: 0 }}>
          <I.Compass size={18} color={BOS_ROOM_GOLD_INK} strokeWidth={2} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>Кабинет ведущего</div>
          <div style={{ fontSize: 10.5, color: "var(--text-4)" }}>{(t.name ? t.name + " · " : "") + "виден только тебе"}</div>
        </div>
        {/* Настройки круга (имя/ставка/видимость) — карандаш переехал сюда из шапки комнаты. */}
        <button onClick={() => openSheet(<GoalFormSheetLive mode="edit" circleOn={true} navigate={navigate} returnTo={from}
          goal={{ _id: t._id, id: t.id, cloudId: t.cloudId, __isTeam: true, __team: t, name: t.name, emoji: t.emblem, color: t.accent, target: t.target, unit: t.unit, deadline: t.date || t.deadline || "", circle: true, type: t.type, vis: t.vis, stake: t.stake, goal: t.goal, desc: t.desc || "", joined: t.joined, threadOff: t.threadOff === true, habitIds: [] }} />)}
          className="tap" data-haptic="selection" aria-label="Настройки круга"
          style={{ ...bosGlassChrome(isDark), width: 36, height: 36, borderRadius: "50%", border: 0, display: "grid", placeItems: "center", color: isDark ? "#fff" : "#0a0a0a", cursor: "pointer", flexShrink: 0 }}>
          <I.Pencil size={15} strokeWidth={2} />
        </button>
      </div>

      {/* Заявки — красный бейдж на компасе считает и их, значит здесь они должны быть видны. */}
      {pending.length > 0 && (
        <div style={{ ...card, marginTop: 6, padding: "11px 13px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase", color: "var(--text-4)", marginBottom: 8 }}>Стучатся в круг · {pending.length}</div>
          {pending.map((p) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "5px 0" }}>
              <BuddyFaceLive avatar={p.avatar} name={p.name || "Гость"} size={28} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name || "Гость"}</span>
              <button onClick={() => approveReq(p.id)} className="tap" style={{ border: 0, borderRadius: 999, padding: "6px 13px", fontSize: 11.5, fontWeight: 700, cursor: "pointer", background: isDark ? "#fff" : "#0a0a0a", color: isDark ? "#0a0a0a" : "#fff" }}>Принять</button>
              <button onClick={() => rejectReq(p.id)} className="tap" style={{ border: 0, borderRadius: 999, padding: "6px 11px", fontSize: 11.5, fontWeight: 700, cursor: "pointer", background: isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)", color: "var(--text-2)" }}>Нет</button>
            </div>
          ))}
        </div>
      )}

      {/* Цифры дня */}
      <div style={{ marginTop: 6, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div style={{ ...card, padding: "12px 8px", textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.5px", fontVariantNumeric: "tabular-nums" }}>{todayN + "/" + (N || "?")}</div>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: "var(--text-4)", letterSpacing: 0.4, marginTop: 2 }}>СЕГОДНЯ В ДЕЛЕ</div>
        </div>
        <div style={{ ...card, padding: "12px 8px", textAlign: "center", boxShadow: RED.length ? "var(--card-shadow), inset 0 0 0 1px rgba(224,54,43,0.2)" : "var(--card-shadow)" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: RED.length ? "#E0362B" : "var(--text)", letterSpacing: "-0.5px", fontVariantNumeric: "tabular-nums" }}>{RED.length}</div>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: "var(--text-4)", letterSpacing: 0.4, marginTop: 2 }}>ТРЕБУЮТ ВНИМАНИЯ</div>
        </div>
      </div>

      {/* Здоровье программы + удержание */}
      {(habits || []).length > 0 && (
        <div style={{ ...card, marginTop: 8, padding: "13px 14px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase", color: "var(--text-4)", marginBottom: 8 }}>Здоровье программы · неделя к неделе</div>
          {health.map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: i < health.length - 1 ? 9 : 0 }}>
              <span style={{ fontSize: 14, width: 22, textAlign: "center", flexShrink: 0 }}>{bosIcon(r.h.emoji, 15, r.h.color)}</span>
              <span style={{ width: 100, fontSize: 11.5, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexShrink: 0 }}>{r.h.name}</span>
              <span style={{ flex: 1, height: 6, borderRadius: 999, background: isDark ? "rgba(255,255,255,0.1)" : "rgba(10,10,10,0.07)", overflow: "hidden" }}>
                <span style={{ display: "block", height: "100%", width: r.pct + "%", borderRadius: 999, background: r.delta >= 0 ? ("linear-gradient(90deg," + BOS_ROOM_GOLD_L + "," + BOS_ROOM_GOLD + ")") : "linear-gradient(90deg,#f0a08e,#E0362B)" }} />
              </span>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: "var(--text-3)", width: 30, textAlign: "right", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{r.pct}%</span>
              <span style={{ fontSize: 9.5, fontWeight: 800, color: r.delta >= 0 ? BOS_ROOM_GOLD_INK : "#E0362B", width: 30, textAlign: "right", flexShrink: 0 }}>{r.delta === 0 ? "" : (r.delta > 0 ? "+" : "−") + Math.abs(r.delta) + "%"}</span>
            </div>
          ))}
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid " + (isDark ? "rgba(255,255,255,0.07)" : "rgba(10,10,10,0.06)") }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase", color: "var(--text-4)", marginBottom: 4 }}>Удержание · 4 недели</div>
            <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", height: H }}>
              <path d={retPath} fill="none" stroke={BOS_ROOM_GOLD} strokeWidth="2" strokeLinecap="round" />
              {reten.map((v, i) => (
                <g key={i}>
                  <circle cx={rx(i)} cy={ry(v)} r="3" fill={BOS_ROOM_GOLD} />
                  <text x={rx(i)} y={ry(v) - 7} textAnchor="middle" style={{ font: "700 9px -apple-system", fill: isDark ? "#f2f2f5" : "#0a0a0a" }}>{v}%</text>
                </g>
              ))}
            </svg>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0 4px" }}>
              {["нед 1", "нед 2", "нед 3", "сейчас"].map((x, i) => <span key={i} style={{ fontSize: 9, color: "var(--text-4)", fontWeight: 700 }}>{x}</span>)}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-4)", lineHeight: 1.45, marginTop: 6 }}>Когда проседает вся группа — дело в программе, а не в людях: смотри, какая привычка просела.</div>
          </div>
        </div>
      )}

      {/* Журнал: сортировка по тревоге, поиск, все люди по одному */}
      <div style={{ margin: "10px 0 0", display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none", padding: 1 }}>
        {[["alarm", "По тревоге"], ["streak", "По серии"], ["name", "По имени"], ["old", "Давно не был"]].map(([v, l]) => (
          <button key={v} onClick={() => setSortBy(v)} className="tap"
            style={{ border: 0, borderRadius: 999, padding: "7px 13px", fontSize: 11.5, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0, cursor: "pointer",
              ...(sortBy === v ? { background: isDark ? "#fff" : "#0a0a0a", color: isDark ? "#0a0a0a" : "#fff" } : { ...bosChipGlass(isDark), color: "var(--text-2)" }) }}>{l}</button>
        ))}
      </div>
      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, ...bosChipGlass(isDark), borderRadius: 999, padding: "8px 13px" }}>
        <I.Search size={12} color="var(--text-4)" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Найти человека…" style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: "transparent", fontSize: 12.5, color: "var(--text)" }} />
      </div>

      {q.trim() ? (
        <div style={{ marginTop: 10 }}>{sorted.map(wardRow)}</div>
      ) : (
        <React.Fragment>
          {RED.length > 0 && secTitle("#E0362B", "Теряем — " + RED.length)}
          {RED.map(wardRow)}
          {NEW.length > 0 && secTitle(BOS_ROOM_GOLD_INK, "Хрупкое окно · первые 3 дня — " + NEW.length)}
          {NEW.map(wardRow)}
          {YEL.length > 0 && secTitle(BOS_ROOM_GOLD_INK, "Шатаются — " + YEL.length)}
          {YEL.map(wardRow)}
          {OK.length > 0 && secTitle("var(--text-4)", "В ритме — " + OK.length)}
          {(showAll ? OK : OK.slice(0, 5)).map(wardRow)}
          {OK.length > 5 && !showAll && (
            <button onClick={() => setShowAll(true)} className="tap" style={{ width: "100%", border: 0, borderRadius: 999, padding: "10px 0", fontSize: 12, fontWeight: 700, cursor: "pointer", background: isDark ? "rgba(255,255,255,0.07)" : "var(--surface-3)", color: "var(--text-2)", marginTop: 4 }}>
              {"Показать всех — " + wards.length}
            </button>
          )}
        </React.Fragment>
      )}

      <div style={{ fontSize: 9.5, color: "var(--text-4)", padding: "10px 4px 0", lineHeight: 1.4 }}>
        Прозрачность вместо слежки: каждый участник видит о себе то же самое. Здесь нет ничего скрытого от людей.
      </div>
    </div>
  );
}

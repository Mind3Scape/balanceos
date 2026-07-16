/* СТАНДАРТ ДЕТАЛЬНОЙ ПРИВЫЧКИ — «лесенка» (макет Л, _devgoal3.html, 2026-07-16).

   ОДНО тело на три ступени: ЛИЧНАЯ → С ДРУЗЬЯМИ (+«Сегодня»-нить, +«Кто со мной») →
   В КРУГЕ (нить стала волной, «Неделя» — гистограммой «где ты», +«Кто уже сегодня»).
   Стандарт держится не декларацией, а фактом: и личная деталь (extra_live), и шторка
   привычки круга (circle_room_live) зовут ОДИН BosHabitStandardBodyLive.

   Из М взято ровно одно — ОТМЕТКА ЧЕКБОКСОМ В ШАПКЕ вместо большой чёрной кнопки
   (решение David «Л, но взять что-то из М» + его же «у нас везде чекбоксы»):
   способ отметить остаётся один, а сделанный день показывает золотой чип «✓ в 07:12».

   «Ритм» — один блок времени вместо трёх календарей (David): пилюля «Неделя ⌄» в
   заголовке справа, тап раскрывает Неделя·Месяц·Год на месте. Год = 12 колец-месяцев
   (ТВОЙ год — и в кругу тоже про тебя), будущие месяцы пригашены. */

/* Последние 7 дней: ключи (старые → сегодня) + буквы дней недели. */
function bosStdWeek() {
  var out = [];
  for (var i = 6; i >= 0; i--) {
    var d = new Date(); d.setDate(d.getDate() - i);
    out.push({
      k: d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"),
      l: ["В", "П", "В", "С", "Ч", "П", "С"][d.getDay()],
      today: i === 0,
    });
  }
  return out;
}
var BOS_STD_MONTHS_SHORT = ["Я", "Ф", "М", "А", "М", "И", "И", "А", "С", "О", "Н", "Д"];
var BOS_STD_MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

/* Кольцо-клетка (язык bosDayRing v660) с подписью внутри/снизу. */
function BosStdRingCell({ pct, size, label, below, accent, isDark, dim, today }) {
  return (
    <span style={{ display: "inline-grid", justifyItems: "center", opacity: dim ? 0.35 : 1 }}>
      <span style={{ position: "relative", width: size, height: size, display: "grid", placeItems: "center" }}>
        <span style={{ position: "absolute", inset: 0 }}>{bosDayRing(pct, accent || BOS_ROOM_GOLD, isDark, { sw: size >= 30 ? 4 : 3.4, today: !!today })}</span>
        {label != null && <span style={{ fontSize: 8, fontWeight: 700, color: "var(--text-4)", position: "relative" }}>{label}</span>}
      </span>
      {below != null && <span style={{ fontSize: 8.5, fontWeight: 700, color: "var(--text-4)", marginTop: 2 }}>{below}</span>}
    </span>
  );
}

/* Гистограмма недели круга: сколько людей сделали 0..7 раз + маркер «ты». */
function BosStdHist({ dist, me, isDark }) {
  var mx = Math.max.apply(null, dist.concat([1]));
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 46 }}>
        {dist.map((v, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 8, fontWeight: 800, color: BOS_ROOM_GOLD_INK, whiteSpace: "nowrap", visibility: i === me ? "visible" : "hidden" }}>ты</span>
            <div style={{ width: "100%", borderRadius: 4, height: Math.max(3, v / mx * 34) + "px", background: i === me ? ("linear-gradient(180deg," + BOS_ROOM_GOLD_L + "," + BOS_ROOM_GOLD + ")") : (isDark ? "rgba(255,255,255,0.14)" : "rgba(10,10,10,0.10)") }} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 3, marginTop: 3 }}>
        {dist.map((_, i) => <span key={i} style={{ flex: 1, textAlign: "center", fontSize: 8, color: "var(--text-4)", fontWeight: 700 }}>{i}</span>)}
      </div>
      <div style={{ textAlign: "center", fontSize: 9, color: "var(--text-4)", marginTop: 2 }}>дней на неделе → сколько людей</div>
    </div>
  );
}

/* «РИТМ» — один блок времени. Пилюля-переключатель в заголовке СПРАВА (компактная, v3):
   свёрнута — один таймфрейм «Неделя ⌄»; тап — три пилюли на месте; выбор схлопывает. */
function BosRhythmBlockLive({ mode, weekCells, hist, monthCells, monthHint, yearMonths, yearHint, onYearOpen, accent, isDark }) {
  const [tab, setTab] = React.useState("week");
  const [open, setOpen] = React.useState(false);
  const LBL = { week: "Неделя", month: "Месяц", year: "Год" };
  React.useEffect(() => { if (tab === "year" && onYearOpen) onYearOpen(); }, [tab]);
  const pill = (id, on, kids) => (
    <button key={id} onClick={() => { if (open) { setTab(id); setOpen(false); } else setOpen(true); }} className="tap"
      style={{ border: 0, borderRadius: 999, padding: "5px 11px", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap",
        ...(on ? { background: isDark ? "#fff" : "#0a0a0a", color: isDark ? "#0a0a0a" : "#fff" } : { ...bosChipGlass(isDark), color: "var(--text-2)" }) }}>{kids}</button>
  );
  const control = open
    ? <span style={{ display: "inline-flex", gap: 4 }}>{["week", "month", "year"].map((id) => pill(id, id === tab, LBL[id]))}</span>
    : pill(tab, false, [LBL[tab], <svg key="v" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>]);
  let body = null;
  if (tab === "week") {
    body = (mode === "circle" && hist)
      ? <BosStdHist dist={hist.dist} me={hist.me} isDark={isDark} />
      : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, justifyItems: "center" }}>
          {(weekCells || []).map((c, i) => <BosStdRingCell key={i} pct={c.pct} size={26} below={c.l} accent={accent} isDark={isDark} dim={c.dim} today={c.today} />)}
        </div>
      );
  } else if (tab === "month") {
    body = (
      <div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, justifyItems: "center" }}>
          {(monthCells || []).map((c, i) => <BosStdRingCell key={i} pct={c.pct} size={24} label={i + 1} accent={accent} isDark={isDark} dim={c.dim} today={c.today} />)}
        </div>
        {monthHint && <div style={{ fontSize: 9, color: "var(--text-4)", textAlign: "right", marginTop: 5 }}>{monthHint}</div>}
      </div>
    );
  } else {
    body = (
      <div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8, justifyItems: "center" }}>
          {(yearMonths || []).map((m, i) => <BosStdRingCell key={i} pct={m.frac} size={30} below={BOS_STD_MONTHS_SHORT[i]} accent={accent} isDark={isDark} dim={m.future} />)}
        </div>
        <div style={{ fontSize: 9, color: "var(--text-4)", textAlign: "right", marginTop: 5 }}>{yearHint || "кольцо месяца = доля дней"}</div>
      </div>
    );
  }
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 4px 8px", minHeight: 27 }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-4)" }}>Ритм</span>
        {control}
      </div>
      <div style={{ background: "var(--card)", borderRadius: 18, boxShadow: "var(--card-shadow)", padding: "13px 14px" }}>{body}</div>
    </div>
  );
}

/* ТЕЛО СТАНДАРТА — общее для личной детали (экран) и шторки привычки круга.
   model = { emoji, color, name, ctx, chips:[{gold,node}], check:<node>, thread:{faces,hours}|null,
             threadHint, rhythm:{...props BosRhythmBlockLive}, peopleTitle, peopleExtra, people:<node>|null } */
function BosHabitStandardBodyLive({ model, isDark }) {
  const m = model;
  const h2 = (txt, extra) => (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "16px 4px 8px" }}>
      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-4)" }}>{txt}</span>
      {extra || null}
    </div>
  );
  return (
    <div>
      {/* Шапка: плитка-иконка + имя + контекст, ОТМЕТКА-ЧЕКБОКС справа (единственный жест).
          headExtra (карандаш владельца и т.п.) живёт В РЯДУ, перед чекбоксом — не поверх него.
          bare (аккордеон в списке привычек круга): шапки нет — имя и чекбокс уже в строке выше. */}
      {!m.bare && <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <span style={{ width: 42, height: 42, borderRadius: 13, flexShrink: 0, display: "grid", placeItems: "center", fontSize: 20,
          background: m.color ? m.color + "26" : (BOS_TILE_SHEEN + ", " + (isDark ? "rgba(255,255,255,0.06)" : "var(--surface-3)")),
          boxShadow: m.color ? "none" : bosTileGlass(isDark) }}>{bosIcon(m.emoji, 20, m.color)}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.3px", lineHeight: 1.15, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{m.name}</div>
          {m.ctx && <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.ctx}</div>}
        </div>
        {m.headExtra || null}
        {m.check}
      </div>}
      {/* Чипы: сделано в · серия · обычно в · N из M. */}
      {m.chips && m.chips.length > 0 && (
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: m.bare ? 2 : 10 }}>
          {m.chips.map((c, i) => c.gold ? (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: BOS_ROOM_GOLD_INK, background: "rgba(240,195,10,0.14)", borderRadius: 999, padding: "3px 9px", whiteSpace: "nowrap" }}>{c.node}</span>
          ) : (
            <span key={i} style={{ ...bosChipGlass(isDark), display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "var(--text-2)", borderRadius: 999, padding: "3px 9px", whiteSpace: "nowrap" }}>{c.node}</span>
          ))}
        </div>
      )}
      {/* «Сегодня» — нить (лица) или волна (толпа); только у общих ступеней. */}
      {m.thread && (
        <React.Fragment>
          {h2("Сегодня", m.threadHint ? <span style={{ fontSize: 10.5, color: "var(--text-4)" }}>{m.threadHint}</span> : null)}
          <div style={{ background: "var(--card)", borderRadius: 18, boxShadow: "var(--card-shadow)", padding: "6px 8px" }}>
            <BosDayThreadLive faces={m.thread.faces || []} hours={m.thread.hours || []} isDark={isDark} />
          </div>
        </React.Fragment>
      )}
      {/* «Ритм» — один блок времени с пилюлей. */}
      {m.rhythm && <BosRhythmBlockLive {...m.rhythm} isDark={isDark} />}
      {/* Люди ступени: «Кто со мной» (друзья) / «Кто уже сегодня» (круг). */}
      {m.people && (
        <React.Fragment>
          {h2(m.peopleTitle || "Кто со мной", m.peopleExtra ? <span style={{ fontSize: 10.5, color: "var(--text-4)" }}>{m.peopleExtra}</span> : null)}
          <div style={{ background: "var(--card)", borderRadius: 18, boxShadow: "var(--card-shadow)", padding: "9px 14px" }}>{m.people}</div>
        </React.Fragment>
      )}
    </div>
  );
}

/* ШТОРКА ПРИВЫЧКИ КРУГА — ступень 3 стандарта (кадр 2 финала И). Один код с личной деталью. */
function HabitStandardSheetLive({ mode, habit, team, members, meId, rangeRows, dayRows, done, onToggle, onEdit, onPerson, isDark, bare }) {
  const h = habit || {};
  const membersN = (members || []).length || 1;
  const [isDone, setIsDone] = React.useState(!!done);
  const [markAt, setMarkAt] = React.useState(null); // «✓ в 07:12» после тапа прямо здесь
  // Правда снаружи (полл/прижитая копия) догоняет оптимистичный тап — синкаем чекбокс.
  React.useEffect(() => { setIsDone(!!done); }, [done]);
  const rosterById = {}; (members || []).forEach((m) => { rosterById[m.id] = m; });

  // Мои отметки этой привычки: серия (окно 31), время сегодня.
  const mineDays = {}; (rangeRows || []).forEach((r) => { if (r.u === meId && r.h === h.id) mineDays[r.day] = true; });
  let myStreak = 0;
  { let s = mineDays[bosRoomDayKey(0)] || isDone ? 0 : 1; for (let i = s; i < 31; i++) { if (mineDays[bosRoomDayKey(i)] || (i === 0 && isDone)) myStreak++; else break; } }
  const myTodayRow = (dayRows || []).filter((r) => r.u === meId && r.h === h.id).sort((a, b) => (a.at < b.at ? -1 : 1))[0];
  const doneAt = markAt || (myTodayRow ? bosRoomHHMM(myTodayRow.at) : null);

  // Сегодня по этой привычке: кто и когда → нить/волна + «кто уже».
  const todays = (dayRows || []).filter((r) => r.h === h.id);
  const byUserAt = {}; todays.forEach((r) => { if (!byUserAt[r.u] || r.at < byUserAt[r.u]) byUserAt[r.u] = r.at; });
  const doneUsers = Object.keys(byUserAt);
  const _pt = (x) => (typeof bosParseTs === "function" ? bosParseTs(x) : new Date(x));
  const _hr = (x) => { const d = _pt(x); return d.getHours() + d.getMinutes() / 60; };
  const facesToday = doneUsers.map((u) => rosterById[u]).filter(Boolean).map((p) => ({ avatar: p.avatar, name: p.id === meId ? "Ты" : p.name, hr: _hr(byUserAt[p.id]) }));
  const thread = facesToday.length <= 6 ? { faces: facesToday } : { hours: doneUsers.map((u) => _hr(byUserAt[u])) };

  // «Обычно в …» — час пик круга за 30 дней из bos_circle_pulse (кэш 2 мин в cloud.js,
  // лишнего запроса при каждом открытии шторки нет). До SQL-патча пульса — честно молчим.
  const [peakMin, setPeakMin] = React.useState(null);
  React.useEffect(() => {
    let on = true;
    if (team && team.cloudId && window.bosCloud && window.bosCloud.circlePulse) {
      window.bosCloud.circlePulse(team.cloudId).then((p) => { if (on && p && p.peak != null) setPeakMin(p.peak); }).catch(() => {});
    }
    return () => { on = false; };
  }, [team && team.cloudId]);

  // Неделя (гистограмма «где ты»): сколько дней из 7 у каждого участника — по ЭТОЙ привычке.
  const wk = {}; const wkeys = {}; for (let i = 0; i < 7; i++) wkeys[bosRoomDayKey(i)] = true;
  (rangeRows || []).forEach((r) => { if (r.h === h.id && wkeys[r.day]) wk[r.u] = (wk[r.u] || 0) + 1; });
  const dist = [0, 0, 0, 0, 0, 0, 0, 0];
  (members || []).forEach((m) => { dist[Math.min(7, wk[m.id] || 0)]++; });
  const hist = { dist, me: Math.min(7, wk[meId] || 0) };

  // Месяц: доля круга в деле по дням текущего месяца.
  const now = new Date();
  const dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const byDayUsers = {}; (rangeRows || []).forEach((r) => { if (r.h === h.id) (byDayUsers[r.day] = byDayUsers[r.day] || {})[r.u] = true; });
  const monthCells = Array.from({ length: dim }).map((_, i) => {
    const k = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(i + 1).padStart(2, "0");
    return { pct: Object.keys(byDayUsers[k] || {}).length / membersN, dim: k > bosRoomDayKey(0), today: k === bosRoomDayKey(0) };
  });

  // Год — ТВОЙ (ленивая догрузка своих строк с 1 января при открытии вкладки).
  const [myYear, setMyYear] = React.useState(null);
  const loadYear = React.useCallback(() => {
    if (myYear || !window.bosCloud || !window.bosCloud.teamMyHabitYear || !h.id) return;
    window.bosCloud.teamMyHabitYear(h.id).then((d) => { if (d) setMyYear(d); }).catch(() => {});
  }, [myYear, h.id]);
  const yearMonths = Array.from({ length: 12 }).map((_, mi) => {
    const future = mi > now.getMonth();
    if (future) return { frac: 0, future: true };
    const dimM = new Date(now.getFullYear(), mi + 1, 0).getDate();
    const den = mi === now.getMonth() ? now.getDate() : dimM;
    let cnt = 0;
    if (myYear) for (let d = 1; d <= dimM; d++) { const k = now.getFullYear() + "-" + String(mi + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0"); if (myYear[k]) cnt++; }
    return { frac: den ? Math.min(1, cnt / den) : 0, future: false };
  });

  const chips = [];
  if (!bare && isDone && doneAt) chips.push({ gold: true, node: [<I.Check key="c" size={11} strokeWidth={3} color={BOS_ROOM_GOLD_INK} />, " в " + doneAt] });
  else if (!bare && isDone) chips.push({ gold: true, node: [<I.Check key="c" size={11} strokeWidth={3} color={BOS_ROOM_GOLD_INK} />, " сделано"] });
  if (myStreak > 0) chips.push({ gold: true, node: [<I.Flame key="f" size={10} color={BOS_ROOM_GOLD} filled strokeWidth={1.6} />, " серия " + (myStreak >= 31 ? "31+" : myStreak)] });
  if (peakMin != null && typeof bosPeakLabel === "function") chips.push({ gold: true, node: [<I.Clock key="p" size={11} color={BOS_ROOM_GOLD} strokeWidth={2} />, " обычно в " + bosPeakLabel(peakMin)] });
  chips.push({ node: doneUsers.length + " из " + membersN + " сегодня" });

  const model = {
    bare: !!bare,
    emoji: h.emoji, color: h.color && h.color !== "#0a0a0a" ? h.color : null, name: h.name,
    ctx: "круг «" + ((team && team.name) || "") + "» · " + membersN + " " + bosRoomPeopleWord(membersN),
    headExtra: onEdit ? (
      <button onClick={onEdit} className="tap" aria-label="Изменить привычку"
        style={{ width: 30, height: 30, borderRadius: "50%", border: 0, cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0, background: isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)", color: "var(--text-3)" }}>
        <I.Pencil size={13} strokeWidth={2} />
      </button>
    ) : null,
    chips,
    check: <BosFlatCheckLive on={isDone} isDark={isDark} label="Отметить сегодня" onToggle={() => {
      const next = !isDone; setIsDone(next);
      setMarkAt(next ? bosRoomHHMM(Date.now()) : null);
      onToggle && onToggle();
    }} />,
    thread: bare ? null : thread,
    rhythm: { mode: "circle", hist, monthCells, monthHint: "кольцо = доля круга", yearMonths, yearHint: "твой год · кольцо месяца = доля дней", onYearOpen: loadYear, accent: h.color },
    peopleTitle: "Кто уже сегодня",
    peopleExtra: doneUsers.length + " " + bosRoomPeopleWord(doneUsers.length),
    people: (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", rowGap: 12, justifyItems: "center", alignItems: "center", padding: "4px 0" }}>
        {doneUsers.slice(0, 20).map((u) => { const p = rosterById[u]; return p ? <BosRoomFaceLive key={u} p={p} size={34} isDark={isDark} onClick={onPerson ? () => onPerson(p) : null} /> : null; })}
        {doneUsers.length > 20 && <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-4)" }}>{"+" + (doneUsers.length - 20)}</span>}
        {!doneUsers.length && <span style={{ gridColumn: "1 / -1", fontSize: 12, color: "var(--text-4)", padding: "4px 2px", justifySelf: "start" }}>Сегодня ещё никого — будь первым(ой)</span>}
      </div>
    ),
  };

  return (
    <div style={{ padding: bare ? 0 : "2px 2px 8px" }}>
      <BosHabitStandardBodyLive model={model} isDark={isDark} />
      {bare && onEdit && (
        <button onClick={onEdit} className="tap" style={{ marginTop: 10, width: "100%", border: 0, borderRadius: 999, padding: "9px 0", fontSize: 11.5, fontWeight: 700, cursor: "pointer", background: isDark ? "rgba(255,255,255,0.07)" : "var(--surface-3)", color: "var(--text-2)", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <I.Pencil size={12} strokeWidth={2} />Изменить привычку
        </button>
      )}
    </div>
  );
}

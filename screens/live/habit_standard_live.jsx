/* СТАНДАРТ ДЕТАЛЬНОЙ ПРИВЫЧКИ — «лесенка» (макет Л, _devgoal3.html, 2026-07-16).

   ОДНО тело на три ступени: ЛИЧНАЯ → С ДРУЗЬЯМИ (+«Сегодня»-нить, +«Кто со мной») →
   В КРУГЕ вместо «Ритма» — «НЕДЕЛЯ» выбранного человека + люди под ней: тап по лицу
   показывает ЕГО неделю, тап ещё раз открывает карточку (David 2026-07-16: «не столбцы,
   а недельный график, а внизу люди»). Месяц/год остались только у личной ступени.
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

/* Кэш «обычно в» по привычке (10 мин): открыл-закрыл аккордеон — без повторного запроса. */
var _bosStdTimesCache = {};

/* Кольцо-клетка (язык bosDayRing v660) с подписью внутри/снизу. */
function BosStdRingCell({ pct, size, label, below, accent, isDark, dim, today, late, gold, sel }) {
  return (
    <span style={{ display: "inline-grid", justifyItems: "center", opacity: dim ? 0.35 : 1 }}>
      <span style={{ position: "relative", width: size, height: size, display: "grid", placeItems: "center" }}>
        <span style={{ position: "absolute", inset: 0 }}>{bosDayRing(pct, accent || BOS_ROOM_GOLD, isDark, { sw: size >= 30 ? 4 : 3.4, today: !!today, late: !!late, gold: !!gold, sel: !!sel })}</span>
        {label != null && <span style={{ fontSize: size >= 30 ? 9 : 8, fontWeight: today ? 800 : 700, color: (gold && pct >= 1) ? "#6b4e00" : (today ? "var(--text)" : "var(--text-4)"), position: "relative" }}>{label}</span>}
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
function BosRhythmBlockLive({ mode, title, titleExtra, weekCells, hist, monthCells, monthHint, yearMonths, yearHint, onYearOpen, accent, isDark, bare, initialTab, single, gold, onDayTap, belowNode }) {
  // single (David 2026-07-22): «уберём неделю и год пока» — один месяц, пилюли нет.
  const [tab, setTab] = React.useState(single ? "month" : (initialTab || "week"));
  const [open, setOpen] = React.useState(false);
  const LBL = { week: "Неделя", month: "Месяц", year: "Год" };
  React.useEffect(() => { if (tab === "year" && onYearOpen) onYearOpen(); }, [tab]);
  const pill = (id, on, kids) => (
    <button key={id} onClick={() => { if (open) { setTab(id); setOpen(false); } else setOpen(true); }} className="tap"
      style={{ border: 0, borderRadius: 999, padding: "5px 11px", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap",
        ...(on ? { background: isDark ? "#fff" : "#0a0a0a", color: isDark ? "#0a0a0a" : "#fff" } : { ...bosChipGlass(isDark), color: "var(--text-2)" }) }}>{kids}</button>
  );
  const control = single ? null : (open
    ? <span style={{ display: "inline-flex", gap: 4 }}>{["week", "month", "year"].map((id) => pill(id, id === tab, LBL[id]))}</span>
    : pill(tab, false, [LBL[tab], <svg key="v" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>]));
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
    // Телепорт в день (David 2026-07-22): тап по ЛЮБОМУ прожитому дню (c.canTap) — не шторка,
    // а возврат в этот день (панель дня и история под календарём). single — клетки крупнее.
    const sz = single ? 31 : 24;
    const cell = (c, i) => <BosStdRingCell pct={c.pct} size={sz} label={i + 1} accent={accent} isDark={isDark} dim={c.dim} today={c.today} late={c.late} gold={gold} sel={c.sel} />;
    body = (
      <div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: single ? 6 : 4, justifyItems: "center" }}>
          {(monthCells || []).map((c, i) => (onDayTap && c.canTap)
            ? <button key={i} onClick={() => onDayTap(c.k)} className="tap" data-haptic="selection" aria-label={"Открыть день " + (i + 1)} style={{ border: 0, background: "transparent", padding: 0, cursor: "pointer", lineHeight: 0 }}>{cell(c, i)}</button>
            : <React.Fragment key={i}>{cell(c, i)}</React.Fragment>)}
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
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-4)" }}>{title || "Ритм"}</span>
        {control || (titleExtra ? <span style={{ fontSize: 10.5, color: "var(--text-4)" }}>{titleExtra}</span> : null)}
      </div>
      {/* bare (аккордеон в белой карточке): блок цвета ЗАДНЕГО ФОНА, не белый-на-белом,
          от которого читалась одна окантовка (David 2026-07-17). belowNode — продолжение
          ВНУТРИ карточки (панель выбранного дня): календарь и день = один рассказ, не два ящика. */}
      <div style={{ background: bare ? (isDark ? "rgba(255,255,255,0.035)" : "rgba(10,10,10,0.028)") : "var(--card)", borderRadius: 18, boxShadow: bare ? "none" : "var(--card-shadow)", padding: "13px 14px" }}>
        {body}
        {belowNode ? <div style={{ marginTop: 12, paddingTop: 11, borderTop: "1px solid " + (isDark ? "rgba(255,255,255,0.08)" : "rgba(10,10,10,0.06)") }}>{belowNode}</div> : null}
      </div>
    </div>
  );
}

/* Русские имена дней/месяцев — для панели дня («Вторник, 15 июля») в детальной привычке. */
var BOS_DOW_RU = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
var BOS_MON_GEN = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

/* ТЕЛО СТАНДАРТА — общее для личной детали (экран) и шторки привычки круга.
   model = { emoji, color, name, ctx, chips:[{gold,node}], check:<node>, thread:{faces,hours}|null,
             threadHint, rhythm:{...props BosRhythmBlockLive}, peopleTitle, peopleExtra, people:<node>|null,
             unified:bool (David: слить привычку+нить+кнопку в один блок), primary:<node> (кнопка-отметка) } */
function BosHabitStandardBodyLive({ model, isDark }) {
  const m = model;
  // В bare-аккордеоне внутренние блоки — цвета заднего фона страницы (серые), иначе они
  // белые внутри белой карточки и видна только окантовка (David 2026-07-17).
  // bare-аккордеон (David 2026-07-22: «серый слишком серее фона — помягче, ненавязчиво»):
  // еле-заметная полупрозрачная заливка вместо плотного var(--bg), которое читалось темнее.
  const blockCard = m.bare
    ? { background: isDark ? "rgba(255,255,255,0.035)" : "rgba(10,10,10,0.028)", borderRadius: 18, boxShadow: "none" }
    : { background: "var(--card)", borderRadius: 18, boxShadow: "var(--card-shadow)" };
  const h2 = (txt, extra) => (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "16px 4px 8px" }}>
      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-4)" }}>{txt}</span>
      {extra || null}
    </div>
  );
  // Общая шапка (плитка + имя + контекст + отметка). Отметка — ТОТ ЖЕ чекбокс, что на
  // внешних карточках (David 2026-07-22: «на внешних всё по-другому» — один язык везде).
  const headInner = !m.bare && (
    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
      <span style={{ width: 42, height: 42, borderRadius: 13, flexShrink: 0, display: "grid", placeItems: "center", fontSize: 20,
        background: m.color ? m.color + "26" : (BOS_TILE_SHEEN + ", " + (isDark ? "rgba(255,255,255,0.06)" : "var(--surface-3)")),
        boxShadow: m.color ? "none" : bosTileGlass(isDark) }}>{bosIconOf(m, 20, m.color)}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.3px", lineHeight: 1.15, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{m.name}</div>
        {m.ctx && <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.ctx}</div>}
      </div>
      {m.headExtra || null}
      {m.check || null}
    </div>
  );
  const chipsNode = (m.chips && m.chips.length > 0) ? (
    <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: m.bare ? 2 : 10 }}>
      {m.chips.map((c, i) => c.gold ? (
        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: BOS_ROOM_GOLD_INK, background: "rgba(240,195,10,0.14)", borderRadius: 999, padding: "3px 9px", whiteSpace: "nowrap" }}>{c.node}</span>
      ) : (
        <span key={i} style={{ ...bosChipGlass(isDark), display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "var(--text-2)", borderRadius: 999, padding: "3px 9px", whiteSpace: "nowrap" }}>{c.node}</span>
      ))}
    </div>
  ) : null;

  // ЕДИНЫЙ БЛОК (David 2026-07-19): привычка + чипы + «Сегодня»-нить + кнопка-отметка в ОДНОЙ
  // карточке (кнопка вместо сливающегося кружка в шапке). Ритм и люди — блоками ниже, как прежде.
  if (m.unified) {
    return (
      <div>
        <div style={{ background: "var(--card)", borderRadius: 22, boxShadow: "var(--card-shadow)", padding: "14px 15px" }}>
          {headInner}
          {chipsNode}
          {m.thread && (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 7 }}>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-4)" }}>Сегодня</span>
                {m.threadHint && <span style={{ fontSize: 10.5, color: "var(--text-4)" }}>{m.threadHint}</span>}
              </div>
              <BosDayThreadLive faces={m.thread.faces || []} hours={m.thread.hours || []} isDark={isDark} />
            </div>
          )}
          {m.primary && <div style={{ marginTop: 14 }}>{m.primary}</div>}
        </div>
        {m.rhythm && <BosRhythmBlockLive {...m.rhythm} bare={m.bare} isDark={isDark} />}
        {m.rhythmBelow || null}
        {m.people && (
          <React.Fragment>
            {h2(m.peopleTitle || "Кто со мной", m.peopleExtra ? <span style={{ fontSize: 10.5, color: "var(--text-4)" }}>{m.peopleExtra}</span> : null)}
            <div style={{ ...blockCard, padding: "9px 14px" }}>{m.people}</div>
          </React.Fragment>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Шапка: плитка-иконка + имя + контекст, ОТМЕТКА-ЧЕКБОКС справа (единственный жест).
          headExtra (карандаш владельца и т.п.) живёт В РЯДУ, перед чекбоксом — не поверх него.
          bare (аккордеон в списке привычек круга): шапки нет — имя и чекбокс уже в строке выше. */}
      {!m.bare && <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <span style={{ width: 42, height: 42, borderRadius: 13, flexShrink: 0, display: "grid", placeItems: "center", fontSize: 20,
          background: m.color ? m.color + "26" : (BOS_TILE_SHEEN + ", " + (isDark ? "rgba(255,255,255,0.06)" : "var(--surface-3)")),
          boxShadow: m.color ? "none" : bosTileGlass(isDark) }}>{bosIconOf(m, 20, m.color)}</span>
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
          <div style={{ ...blockCard, padding: "6px 8px" }}>
            <BosDayThreadLive faces={m.thread.faces || []} hours={m.thread.hours || []} isDark={isDark} />
          </div>
        </React.Fragment>
      )}
      {/* «Ритм» — один блок времени с пилюлей. */}
      {m.rhythm && <BosRhythmBlockLive {...m.rhythm} bare={m.bare} isDark={isDark} />}
      {m.rhythmBelow || null}
      {/* Люди ступени: «Кто со мной» (друзья) / «Кто уже сегодня» (круг). */}
      {m.people && (
        <React.Fragment>
          {h2(m.peopleTitle || "Кто со мной", m.peopleExtra ? <span style={{ fontSize: 10.5, color: "var(--text-4)" }}>{m.peopleExtra}</span> : null)}
          <div style={{ ...blockCard, padding: "9px 14px" }}>{m.people}</div>
        </React.Fragment>
      )}
    </div>
  );
}

/* ШТОРКА ПРИВЫЧКИ КРУГА — ступень 3 стандарта (кадр 2 финала И). Один код с личной деталью. */
function HabitStandardSheetLive({ mode, habit, team, members, meId, levels, rangeRows, dayRows, done, onToggle, onEdit, onPerson, isDark, bare }) {
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

  // «Обычно в …» — медиана времени отметок ЭТОЙ привычки за 14 дней (teamHabitTimes).
  // Раньше чип брал час пик всего круга — у всех привычек было одно время (David: «как
  // такое может быть?»). Мало данных (<5 отметок или <3 дней) — чипа честно нет.
  const [usualMin, setUsualMin] = React.useState(() => { const c0 = _bosStdTimesCache[h.id]; return c0 ? c0.v : null; });
  React.useEffect(() => {
    let on = true;
    const c0 = _bosStdTimesCache[h.id];
    if (c0 && Date.now() - c0.at < 600000) { setUsualMin(c0.v); return; }
    if (!h.id || !window.bosCloud || !window.bosCloud.teamHabitTimes) return;
    window.bosCloud.teamHabitTimes(h.id, 14).then((d) => {
      if (!on || !d) return;
      const rows = d.rows || [];
      const daysSeen = {}; rows.forEach((r) => { if (r.day) daysSeen[r.day] = true; });
      let v = null;
      if (rows.length >= 5 && Object.keys(daysSeen).length >= 3) {
        const mins = rows.map((r) => { const dt = _pt(r.at); return dt.getHours() * 60 + dt.getMinutes(); }).sort((a, b) => a - b);
        v = mins[Math.floor(mins.length / 2)];
      }
      _bosStdTimesCache[h.id] = { at: Date.now(), v };
      setUsualMin(v);
    }).catch(() => {});
    return () => { on = false; };
  }, [h.id]);
  const usualLbl = usualMin == null ? null : (() => { let hh = Math.floor(usualMin / 60), mm = Math.round((usualMin % 60) / 15) * 15; if (mm === 60) { hh = (hh + 1) % 24; mm = 0; } return (hh < 10 ? "0" : "") + hh + ":" + (mm < 10 ? "0" : "") + mm; })();

  // «РИТМ» выбранного человека + люди (David: «недельный график, а внизу люди — тыкнул
  // на человека и видишь его неделю; тап ещё раз — карточка»; v775 вернул пилюлю
  // Неделя·Месяц·Год — «кто-то очень долго живёт в группе»). Стартуешь с себя.
  const [selU, setSelU] = React.useState(meId);
  // meId может доехать ПОЗЖЕ первого рендера (страница открылась, «кто я» ещё грузится) —
  // useState его не догонит сам; догоняем, пока человек не выбран руками.
  React.useEffect(() => { setSelU((s) => (s == null ? meId : s)); }, [meId]);
  const selName = selU === meId ? "ты" : ((rosterById[selU] && rosterById[selU].name) || "");
  const todayK = bosRoomDayKey(0);
  const selDays = {}; (rangeRows || []).forEach((r) => { if (r.h === h.id && r.u === selU) selDays[r.day] = true; });
  if (selU === meId) { if (isDone) selDays[todayK] = true; else delete selDays[todayK]; } // сегодня — за оптимистичным тапом
  // СТАНДАРТ КАЛЕНДАРЯ (David 2026-07-22): один месяц (неделя/год убраны «пока»), золото =
  // наполненность, тап по дню — телепорт в панель дня НИЖЕ (кто из круга отметился в тот день).
  const [selDayK, setSelDayK] = React.useState(todayK);
  const nowD = new Date();
  const dimM = new Date(nowD.getFullYear(), nowD.getMonth() + 1, 0).getDate();
  const monthCells = Array.from({ length: dimM }).map((_, i) => {
    const k = nowD.getFullYear() + "-" + String(nowD.getMonth() + 1).padStart(2, "0") + "-" + String(i + 1).padStart(2, "0");
    return { pct: selDays[k] ? 1 : 0, dim: k > todayK, today: k === todayK, k, canTap: k <= todayK, sel: k === selDayK && k !== todayK };
  });
  // Панель дня круга: кто отметился в выбранный день (rangeRows несёт весь круг за 31 день).
  const _dayUsers = {}; (rangeRows || []).forEach((r) => { if (r.h === h.id && r.day === selDayK) _dayUsers[r.u] = 1; });
  if (selDayK === todayK) doneUsers.forEach((u) => { _dayUsers[u] = 1; });
  const _dayFaces = Object.keys(_dayUsers).map((u) => rosterById[u]).filter(Boolean);
  const _selDate = new Date(+selDayK.slice(0, 4), +selDayK.slice(5, 7) - 1, +selDayK.slice(8, 10));
  const _selLbl = BOS_DOW_RU[_selDate.getDay()] + ", " + _selDate.getDate() + " " + BOS_MON_GEN[_selDate.getMonth()];
  const dayNode = selDayK === todayK ? null : (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{_selLbl}</span>
        <button onClick={() => setSelDayK(todayK)} className="tap" style={{ border: 0, background: "transparent", padding: 0, fontSize: 11, fontWeight: 700, color: "var(--text-4)", cursor: "pointer" }}>сегодня</button>
      </div>
      {_dayFaces.length ? (
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 8, flexWrap: "wrap" }}>
          {_dayFaces.slice(0, 10).map((p) => <BosRoomFaceLive key={p.id} p={p} size={28} active isDark={isDark} />)}
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-2)" }}>{_dayFaces.length + " из " + membersN}</span>
        </div>
      ) : <div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 7 }}>в этот день отметок не было</div>}
    </div>
  );
  // Порядок людей = живой лидерборд, как в «Людях» комнаты (David 2026-07-16): сегодняшние
  // слева, внутри — по дням ЭТОЙ привычки за неделю, молчащие серые — в хвост.
  const wkKeys = (typeof bosWeekKeys === "function") ? bosWeekKeys() : bosStdWeek().map((c) => c.k);
  const _wkH = {};
  { const wkSet = {}; wkKeys.forEach((k) => { wkSet[k] = 1; }); (rangeRows || []).forEach((r) => { if (r.h === h.id && wkSet[r.day]) _wkH[r.u] = (_wkH[r.u] || 0) + 1; }); }
  const _activeOf = (p) => (p.id === meId ? (isDone || !!byUserAt[p.id]) : !!byUserAt[p.id]);
  const gridPeople = (members || []).slice().sort((a, b) => {
    const t0 = (_activeOf(b) ? 1 : 0) - (_activeOf(a) ? 1 : 0); if (t0) return t0;
    return (_wkH[b.id] || 0) - (_wkH[a.id] || 0);
  });
  const peopleGrid = (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", rowGap: 12, justifyItems: "center", alignItems: "center", padding: "4px 0 0" }}>
        {gridPeople.slice(0, 21).map((p) => (
          <BosRoomFaceLive key={p.id} p={p} size={34} isDark={isDark}
            active={p.id === meId ? (isDone || !!byUserAt[p.id]) : !!byUserAt[p.id]}
            gold={p.id === selU} level={(levels && levels[p.id] && (levels[p.id].level | 0)) || 0}
            onClick={() => { if (p.id === selU) { if (onPerson) onPerson(p); } else setSelU(p.id); }} />
        ))}
        {gridPeople.length > 21 && <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-4)" }}>{"+" + (gridPeople.length - 21)}</span>}
      </div>
      <div style={{ fontSize: 9, color: "var(--text-4)", textAlign: "center", marginTop: 9 }}>тап по лицу — его ритм · ещё раз — карточка</div>
    </div>
  );

  const chips = [];
  if (!bare && isDone && doneAt) chips.push({ gold: true, node: [<I.Check key="c" size={11} strokeWidth={3} color={BOS_ROOM_GOLD_INK} />, " в " + doneAt] });
  else if (!bare && isDone) chips.push({ gold: true, node: [<I.Check key="c" size={11} strokeWidth={3} color={BOS_ROOM_GOLD_INK} />, " сделано"] });
  if (myStreak > 0) chips.push({ gold: true, node: [<I.Flame key="f" size={10} color={BOS_ROOM_GOLD} filled strokeWidth={1.6} />, " серия " + (myStreak >= 31 ? "31+" : myStreak)] });
  if (usualLbl) chips.push({ gold: true, node: [<I.Clock key="p" size={11} color={BOS_ROOM_GOLD} strokeWidth={2} />, " обычно в " + usualLbl] });
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
    // Нить «Сегодня» — И в аккордеоне (David 2026-07-16: «не хватает таймлайна активности,
    // как выше, но локально под эту привычку»): лица в свой час / волна на толпе.
    thread: thread,
    rhythm: { title: "Календарь · " + (selName || "ты"), single: true, gold: true, monthCells, onDayTap: (k) => setSelDayK(k), belowNode: dayNode },
    peopleTitle: "Люди",
    peopleExtra: doneUsers.length + " из " + membersN + " сегодня",
    people: peopleGrid,
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

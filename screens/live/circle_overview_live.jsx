/* ═══════════════════════════════════════════════════════════════════════════════════════
   ОБЗОР ГРУППЫ — кадры «Гость / Обзор», «Участник / Обзор», «Админ / Обзор»
   (Неделя · Месяц · День · Участники). Это и есть «другой календарь», про который David.

   Числа сняты с узлов кадра 1351:49928:
     Toolbar        44 (стеклянная кнопка «назад» 44) + крупный заголовок 34/700 lh41 ls0.4
     Date           361×325: шапка 40 (месяц 17/590 + стрелки 20/510, зазор 28),
                    блок с линиями #FFFFFF@0.17, левый жёлоб 55, дни 38×38,
                    число 20/400 lh24 ls-0.45 (выбранный 20/590 на белом круге 34),
                    КОЛЬЦО ДНЯ — полная окружность 40×40 толщиной 1.5:
                      #0EBE65 весь круг · #1CDDBD часть · #8A8A8A никто · #007BFF сегодня
     Сетка часов    361×200: колонка времени 52 (13/590), 7 колонок по 44,
                    6 полос по 33 с линией, внутри точки 8×8 r6
     Строка режима  52: чипы Д · Н · М (37×34, активный белый) и «Сегодня» (89×34)
     Легенда        76: три строки 13/400 с точками 8
     Таблицы        r26, строки 52: «Участники N ›», «История ›» · «Серия», «Вместе»

   ЧЕСТНОСТЬ. Точки в сетке — настоящие отметки привычек круга со временем
   (teamLogTimes). Персональные и общие ЦЕЛИ отдельными цветами в макете есть, но в базе
   события «цель закрыта в такой-то час» пока нет — поэтому такие точки не рисуем, а не
   подкрашиваем часть отметок наугад. Нужен бэкенд: goal_events(user_id, goal_id, kind,
   created_at) — тогда легенда заработает целиком.
   ═══════════════════════════════════════════════════════════════════════════════════════ */
function CircleOverviewLive() {
  const { navigate, params, back } = useNav();
  const app = (typeof useApp === "function") ? useApp() : null;
  const isDark = !!(app && app.themeOverride === "dark");
  const t = (params && params.team) || { name: "Группа" };
  const _live = !!(window.bosCloud && window.bosCloud.enabled() && t.cloudId);

  const [mode, setMode] = React.useState((params && params.mode) || "week");   // day | week | month
  const [sel, setSel] = React.useState(function () { return figDayKey(new Date()); });
  const selDate = React.useMemo(function () { var p = sel.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }, [sel]);
  const [cursor, setCursor] = React.useState(function () { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  React.useEffect(function () { setCursor(new Date(selDate.getFullYear(), selDate.getMonth(), 1)); }, [sel]);

  /* ── ДАННЫЕ ── */
  const [members, setMembers] = React.useState(function () { return (t.members || []).slice(); });
  React.useEffect(function () {
    if (!_live || !window.bosCloud.teamMembers) return;
    var on = true;
    window.bosCloud.teamMembers(t.cloudId).then(function (m) { if (on && m) setMembers(m); }).catch(function () {});
    return function () { on = false; };
  }, [_live, t.cloudId]);
  const membersN = Math.max(1, members.length || t.membersN || 1);

  const [logs, setLogs] = React.useState(null);
  React.useEffect(function () {
    if (!_live || !window.bosCloud.teamLogTimes) { setLogs({ rows: [] }); return; }
    var on = true;
    window.bosCloud.teamLogTimes(t.cloudId, 120).then(function (d) { if (on && d) setLogs(d); }).catch(function () { if (on) setLogs({ rows: [] }); });
    return function () { on = false; };
  }, [_live, t.cloudId]);
  const rows = (logs && logs.rows) || [];

  // День → множество людей, отметившихся в этот день (для колец) и список отметок со временем.
  const byDay = React.useMemo(function () {
    var o = {};
    rows.forEach(function (r) { (o[r.day] || (o[r.day] = { u: {}, marks: [] })); o[r.day].u[r.u] = true; o[r.day].marks.push(r); });
    return o;
  }, [logs]);

  const ringOf = function (key, isToday, future) {
    if (future) return null;
    if (isToday) return "#007BFF";
    var n = Object.keys((byDay[key] && byDay[key].u) || {}).length;
    if (n === 0) return "#8A8A8A";
    return n >= membersN ? "#0EBE65" : "#1CDDBD";
  };

  /* ── СЕРИЯ И «ВМЕСТЕ» — считаем, а не рисуем красивое число ── */
  const streak = React.useMemo(function () {
    var cur = 0, best = 0, run = 0;
    var d = new Date(); d.setHours(0, 0, 0, 0);
    for (var i = 0; i < 120; i++) {
      var k = figDayKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() - i));
      var has = !!byDay[k];
      if (has) { run++; if (run > best) best = run; if (i === run - 1) cur = run; }
      else { if (i === 0) { /* сегодня ещё может закрыться */ } run = 0; }
    }
    return { cur: cur, best: best };
  }, [byDay]);
  const togetherDays = React.useMemo(function () {
    var c = t.createdAt || t.created_at;
    if (!c) return null;
    var d0 = new Date(c); if (isNaN(d0.getTime())) return null;
    return Math.max(1, Math.round((Date.now() - d0.getTime()) / 86400000));
  }, [t.createdAt]);

  /* ── СТРОКИ КАЛЕНДАРЯ по режиму ── */
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const weekRows = React.useMemo(function () {
    var mk = function (base) {
      var start = new Date(base); start.setDate(base.getDate() - base.getDay());
      var out = [];
      for (var i = 0; i < 7; i++) { var d = new Date(start); d.setDate(start.getDate() + i); out.push(d); }
      return out;
    };
    if (mode === "day") return [mk(selDate)];
    if (mode === "week") return [mk(selDate)];
    var first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    var start = new Date(first); start.setDate(first.getDate() - first.getDay());
    var weeks = [];
    for (var w = 0; w < 6; w++) {
      var wk = [];
      for (var i = 0; i < 7; i++) { var d = new Date(start); d.setDate(start.getDate() + w * 7 + i); wk.push(d); }
      weeks.push(wk);
      if (wk[6].getMonth() !== cursor.getMonth() && wk[0].getMonth() !== cursor.getMonth() && w >= 4) break;
    }
    return weeks;
  }, [mode, sel, cursor]);

  /* ── СЕТКА ЧАСОВ: 6 полос по 4 часа × колонки дней ── */
  const gridDays = mode === "day" ? [selDate] : weekRows[0];
  const slotDots = function (d, slot) {
    var k = figDayKey(d);
    var marks = (byDay[k] && byDay[k].marks) || [];
    var out = [];
    marks.forEach(function (m) {
      if (!m.at) return;
      var dt = (typeof bosParseTs === "function") ? bosParseTs(m.at) : new Date(m.at);
      var h = dt.getHours();
      if (Math.floor(h / 4) === slot) out.push(m);
    });
    return out;
  };

  const MON = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  const glass = { background: "rgba(153,153,153,0.17)", WebkitBackdropFilter: "blur(30px) saturate(1.8)", backdropFilter: "blur(30px) saturate(1.8)" };
  const card = { borderRadius: 26, background: "var(--surface)", overflow: "hidden" };

  const shiftPeriod = function (delta) {
    if (mode === "month") { setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1)); return; }
    var step = mode === "day" ? 1 : 7;
    var d = new Date(selDate); d.setDate(selDate.getDate() + delta * step);
    if (d > today) d = new Date(today);
    setSel(figDayKey(d));
    if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} }
  };

  const Row = function (props) {
    return (
      <button onClick={props.onClick} className={props.onClick ? "tap" : undefined}
        style={{ width: "100%", border: 0, background: "transparent", cursor: props.onClick ? "pointer" : "default",
          display: "flex", alignItems: "center", gap: 8, padding: "0 16px", minHeight: 52, textAlign: "left",
          color: "var(--text)", position: "relative" }}>
        {!props.first && <span aria-hidden style={{ position: "absolute", left: 52, right: 0, top: 0, height: 1, background: "var(--line-2)" }} />}
        <span style={{ width: 36, display: "grid", placeItems: "start center", color: "var(--text-2)" }}>{props.icon}</span>
        <span style={{ flex: 1, minWidth: 0, fontSize: 17, lineHeight: "22px", letterSpacing: "-0.43px" }}>{props.title}</span>
        {props.detail != null && <span style={{ fontSize: 17, lineHeight: "22px", letterSpacing: "-0.43px", color: "var(--text-2)", flexShrink: 0 }}>{props.detail}</span>}
        {props.onClick && <I.ChevronRight size={15} strokeWidth={2.6} color="var(--text-3)" style={{ flexShrink: 0 }} />}
      </button>
    );
  };

  return (
    <div className="page-in" style={{ padding: "0 0 24px" }}>
      {/* ШАПКА: стеклянная кнопка «назад» 44 и крупный заголовок «Обзор». */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", height: 44 }}>
        <button onClick={back} className="tap" aria-label="Назад"
          style={{ ...glass, width: 44, height: 44, borderRadius: 999, border: 0, display: "grid", placeItems: "center", cursor: "pointer", color: "var(--text)" }}>
          <I.ChevronRight size={19} strokeWidth={2.6} style={{ transform: "rotate(180deg)" }} />
        </button>
        <span style={{ flex: 1, minWidth: 0, fontSize: 15, color: "var(--text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</span>
      </div>
      <div style={{ padding: "10px 16px 0" }}>
        <div style={{ fontSize: 34, fontWeight: 700, lineHeight: "41px", letterSpacing: "0.4px", color: "var(--text)" }}>Обзор</div>
      </div>

      {/* ── КАЛЕНДАРЬ ── */}
      <div style={{ padding: "0 16px" }}>
        {/* Шапка периода 40 */}
        <div style={{ display: "flex", alignItems: "center", height: 40, padding: "0 6px 0 8px" }}>
          <span style={{ flex: 1, minWidth: 0, fontSize: 17, fontWeight: 590, lineHeight: "22px", letterSpacing: "-0.43px", color: "var(--text)" }}>
            {MON[(mode === "month" ? cursor : selDate).getMonth()] + " " + (mode === "month" ? cursor : selDate).getFullYear()}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <button onClick={function () { shiftPeriod(-1); }} className="tap" aria-label="Назад"
              style={{ border: 0, background: "transparent", padding: 0, cursor: "pointer", width: 15, color: "var(--text)" }}>
              <I.ChevronRight size={17} strokeWidth={2.4} style={{ transform: "rotate(180deg)" }} />
            </button>
            <button onClick={function () { shiftPeriod(1); }} className="tap" aria-label="Вперёд"
              style={{ border: 0, background: "transparent", padding: 0, cursor: "pointer", width: 15, color: "var(--text)" }}>
              <I.ChevronRight size={17} strokeWidth={2.4} />
            </button>
          </span>
        </div>

        {/* Блок дней: линии сверху и снизу, левый жёлоб 55 под колонку часов */}
        <div style={{ borderTop: "1px solid var(--line-2)", borderBottom: "1px solid var(--line-2)", padding: "8px 0 12px 55px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", height: 20, alignItems: "center", marginBottom: 4 }}>
            {["ВС", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"].map(function (n, i) {
              return <span key={n} style={{ textAlign: "center", fontSize: 13, fontWeight: 590, lineHeight: "18px", color: "var(--text-3)",
                opacity: mode === "day" && gridDays[0].getDay() !== i ? 0.35 : 1 }}>{n}</span>;
            })}
          </div>
          <div className="fig-month" key={mode + "-" + sel.slice(0, 7)} style={{ display: "grid", gap: 7 }}>
            {weekRows.map(function (wk, wi) {
              const inPeriod = mode === "week" || (mode === "day");
              return (
                <div key={wi} style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(7, 1fr)", height: 38, alignItems: "center" }}>
                  {/* Подсветка ВЫБРАННОГО ПЕРИОДА: в режиме недели — вся строка таблеткой. */}
                  {mode === "week" && (
                    <span aria-hidden style={{ position: "absolute", left: 0, right: 0, top: 2, height: 34, borderRadius: 999, background: "var(--surface-3)" }} />
                  )}
                  {wk.map(function (d, di) {
                    const k = figDayKey(d);
                    const future = d > today;
                    const isToday = k === figDayKey(today);
                    const isSel = k === sel;
                    const out = mode === "month" && d.getMonth() !== cursor.getMonth();
                    const ring = ringOf(k, isToday, future);
                    const dim = mode === "day" && !isSel;
                    return (
                      <button key={di} onClick={function () { if (!future) { setSel(k); if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} } } }}
                        disabled={future} className={future ? undefined : "tap"} data-no-haptic
                        style={{ position: "relative", border: 0, background: "transparent", padding: 0, cursor: future ? "default" : "pointer",
                          display: "grid", placeItems: "center", height: 38, opacity: (out || dim) ? 0.4 : 1, transition: "opacity .2s" }}>
                        {ring && <svg width="40" height="40" viewBox="0 0 40 40" style={{ position: "absolute" }} aria-hidden>
                          <circle cx="20" cy="20" r="19.25" fill="none" stroke={ring} strokeWidth="1.5" />
                        </svg>}
                        <span style={{ position: "relative", width: 34, height: 34, borderRadius: "50%", display: "grid", placeItems: "center",
                          background: isSel ? "var(--cta)" : "transparent",
                          color: isSel ? "var(--cta-ink)" : (future ? "var(--text-3)" : "var(--text)"),
                          fontSize: 20, fontWeight: isSel ? 590 : 400, lineHeight: "24px", letterSpacing: isSel ? 0 : "-0.45px",
                          transition: "background .2s, color .2s" }}>{d.getDate()}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* СЕТКА ЧАСОВ: слева время, дальше колонки дней по 6 полос в 4 часа. */}
        {mode !== "month" && (
          <div style={{ display: "flex", height: 198 }}>
            {/* Колонка часов: подписи стоят НА ГРАНИЦАХ полос — поэтому сверху пустой
                отступ 18, а дальше пять полос по 33 (в макете 18 + 5×33 + 18 = 201). */}
            <div style={{ width: 52, flexShrink: 0, borderRight: "1px solid var(--line-2)", display: "flex", flexDirection: "column", paddingTop: 18 }}>
              {["04:00", "08:00", "12:00", "16:00", "20:00"].map(function (h) {
                return <span key={h} style={{ height: 33, fontSize: 13, fontWeight: 590, lineHeight: "18px", color: "var(--text-3)" }}>{h}</span>;
              })}
            </div>
            <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(" + gridDays.length + ", 1fr)" }}>
              {gridDays.map(function (d, di) {
                return (
                  <div key={di} style={{ display: "flex", flexDirection: "column" }}>
                    {[0, 1, 2, 3, 4, 5].map(function (slot) {
                      const dots = slotDots(d, slot);
                      return (
                        <span key={slot} style={{ height: 33, borderTop: "1px solid var(--line-2)", borderBottom: slot === 5 ? "1px solid var(--line-2)" : 0,
                          display: "flex", flexWrap: "wrap", alignContent: "center", justifyContent: "center", gap: 2, padding: 2, overflow: "hidden" }}>
                          {dots.slice(0, 8).map(function (m, i) {
                            return <span key={i} style={{ width: 8, height: 8, borderRadius: 6, background: "rgba(120,120,128,0.36)" }} />;
                          })}
                        </span>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Строка режима 52: чипы Д · Н · М и «Сегодня». */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 5, minHeight: 52, borderTop: "1px solid var(--line-2)" }}>
          <span style={{ display: "flex", gap: 8 }}>
            {[["day", "Д"], ["week", "Н"], ["month", "М"]].map(function (m) {
              const on = mode === m[0];
              return (
                <button key={m[0]} onClick={function () { setMode(m[0]); if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} } }}
                  className="tap" style={{ height: 34, minWidth: 37, padding: "0 12px", borderRadius: 999, border: 0, cursor: "pointer",
                    background: on ? "var(--cta)" : "var(--surface-3)", color: on ? "var(--cta-ink)" : "var(--text)",
                    fontSize: 17, lineHeight: "22px", letterSpacing: "-0.43px", transition: "background .18s, color .18s" }}>{m[1]}</button>
              );
            })}
          </span>
          <button onClick={function () { setSel(figDayKey(today)); setCursor(new Date(today.getFullYear(), today.getMonth(), 1)); }}
            className="tap" style={{ height: 34, padding: "0 14px", borderRadius: 999, border: 0, cursor: "pointer",
              background: "var(--surface-3)", color: "var(--text-2)", fontSize: 15, lineHeight: "20px", letterSpacing: "-0.23px" }}>Сегодня</button>
        </div>

        {/* Легенда 76. Про цели говорим честно: их событий в базе пока нет. */}
        <div style={{ padding: "8px 0 6px", display: "grid", gap: 4 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, lineHeight: "18px", letterSpacing: "-0.08px", color: "var(--text-2)" }}>
            <span style={{ width: 8, height: 8, borderRadius: 6, background: "rgba(120,120,128,0.36)" }} />выполненная задача или привычка
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, lineHeight: "18px", letterSpacing: "-0.08px", color: "var(--text-3)" }}>
            <span style={{ width: 8, height: 8, borderRadius: 6, background: "rgba(0,123,255,0.88)", opacity: 0.4 }} />цели — когда включим их события в бэкенде
          </span>
        </div>
      </div>

      {/* ── ТАБЛИЦЫ ── */}
      <div style={{ padding: "10px 16px" }}>
        <div style={card}>
          <Row first icon={<I.Users size={19} strokeWidth={2} />} title="Участники" detail={members.length || t.membersN || null}
            onClick={function () { navigate("team-members", { team: t, from: "team-overview" }); }} />
          <Row icon={<I.Clock size={19} strokeWidth={2} />} title="История"
            onClick={function () { navigate("team-history", { team: t, from: "team-overview" }); }} />
        </div>
      </div>
      <div style={{ padding: "0 16px" }}>
        <div style={card}>
          <Row first icon={<I.Flame size={19} strokeWidth={2} />} title="Серия"
            detail={streak.cur ? (streak.cur + " " + (streak.cur === 1 ? "день" : (streak.cur < 5 ? "дня" : "дней")) + (streak.best > streak.cur ? " · рекорд " + streak.best : "")) : "пока нет"} />
          <Row icon={<I.Calendar size={19} strokeWidth={2} />} title="Вместе"
            detail={togetherDays ? (togetherDays + " " + (togetherDays === 1 ? "день" : (togetherDays % 10 >= 2 && togetherDays % 10 <= 4 && (togetherDays % 100 < 12 || togetherDays % 100 > 14) ? "дня" : "дней"))) : "—"} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════════════
   ИСТОРИЯ ГРУППЫ — кадры «Участник / История» (Все · Привычки · Задачи · Цели + Фильтры).
   Лента событий по дням: кто и что закрыл. Строки той же анатомии, что везде в макетах:
   аватар 44 в кольце уровня · заголовок 17/400 · подпись 15/400 · справа время.

   ЧЕСТНОСТЬ. Настоящие события у нас пока одного рода — отметки привычек круга (у них
   есть автор и время). У дел круга времени нет (в таблице только «кто закрыл»), у целей
   нет и события закрытия. Поэтому вкладки «Задачи» и «Цели» показывают то, что реально
   есть, и прямо говорят, чего не хватает. Нужен бэкенд:
     team_task_done(user_id, task_id, created_at) и goal_events(user_id, goal_id, created_at).
   ═══════════════════════════════════════════════════════════════════════════════════════ */
function CircleHistoryLive() {
  const { navigate, params, back } = useNav();
  const app = (typeof useApp === "function") ? useApp() : null;
  const t = (params && params.team) || { name: "Группа" };
  const _live = !!(window.bosCloud && window.bosCloud.enabled() && t.cloudId);
  const [tab, setTab] = React.useState("all");

  const [members, setMembers] = React.useState(function () { return (t.members || []).slice(); });
  const [habits, setHabits] = React.useState([]);
  const [logs, setLogs] = React.useState(null);
  React.useEffect(function () {
    if (!_live) { setLogs({ rows: [] }); return; }
    var on = true;
    var C = window.bosCloud;
    if (C.teamMembers) C.teamMembers(t.cloudId).then(function (m) { if (on && m) setMembers(m); }).catch(function () {});
    if (C.teamHabitsFull) C.teamHabitsFull(t.cloudId).then(function (h) { if (on && h) setHabits(h); }).catch(function () {});
    if (C.teamLogTimes) C.teamLogTimes(t.cloudId, 120).then(function (d) { if (on && d) setLogs(d); }).catch(function () { if (on) setLogs({ rows: [] }); });
    return function () { on = false; };
  }, [_live, t.cloudId]);

  const byId = {}; members.forEach(function (m) { byId[m.id] = m; });
  const hById = {}; habits.forEach(function (h) { hById[h.id] = h; });

  // События по дням, свежие сверху.
  const days = React.useMemo(function () {
    var rows = (logs && logs.rows) || [];
    var o = {};
    rows.forEach(function (r) { (o[r.day] || (o[r.day] = [])).push(r); });
    return Object.keys(o).sort().reverse().map(function (k) {
      var list = o[k].slice().sort(function (a, b) { return String(b.at || "").localeCompare(String(a.at || "")); });
      return { day: k, rows: list };
    });
  }, [logs]);

  const MON = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
  const dayTitle = function (k) {
    var p = k.split("-"); var d = new Date(+p[0], +p[1] - 1, +p[2]);
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var diff = Math.round((today - d) / 86400000);
    if (diff === 0) return "Сегодня";
    if (diff === 1) return "Вчера";
    return d.getDate() + " " + MON[d.getMonth()];
  };
  const card = { borderRadius: 26, background: "var(--surface)", overflow: "hidden" };
  const glass = { background: "rgba(153,153,153,0.17)", WebkitBackdropFilter: "blur(30px) saturate(1.8)", backdropFilter: "blur(30px) saturate(1.8)" };

  return (
    <div className="page-in" style={{ padding: "0 0 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", height: 44 }}>
        <button onClick={back} className="tap" aria-label="Назад"
          style={{ ...glass, width: 44, height: 44, borderRadius: 999, border: 0, display: "grid", placeItems: "center", cursor: "pointer", color: "var(--text)" }}>
          <I.ChevronRight size={19} strokeWidth={2.6} style={{ transform: "rotate(180deg)" }} />
        </button>
        <span style={{ flex: 1, minWidth: 0, fontSize: 15, color: "var(--text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</span>
      </div>
      <div style={{ padding: "10px 16px 0" }}>
        <div style={{ fontSize: 34, fontWeight: 700, lineHeight: "41px", letterSpacing: "0.4px", color: "var(--text)" }}>История</div>
      </div>

      {typeof FigChips === "function" && (
        <FigChips value={tab} onChange={setTab} style={{ paddingTop: 10 }}
          items={[["all", "Все"], ["habits", "Привычки"], ["tasks", "Задачи"], ["goals", "Цели"]]} />
      )}

      {(tab === "all" || tab === "habits") && (
        <div className="fig-swap" style={{ display: "grid", gap: 10, padding: "0 16px" }}>
          {days.length === 0 && (
            <div style={{ ...card, padding: "28px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, lineHeight: "28px", letterSpacing: "-0.26px", color: "var(--text)" }}>История пуста</div>
              <div style={{ fontSize: 15, lineHeight: "20px", color: "var(--text-2)", marginTop: 6 }}>Как только в группе появятся отметки, они соберутся здесь по дням.</div>
            </div>
          )}
          {days.map(function (d) {
            return (
              <div key={d.day}>
                <div style={{ padding: "10px 0", fontSize: 22, fontWeight: 700, lineHeight: "28px", letterSpacing: "-0.26px", color: "var(--text)" }}>{dayTitle(d.day)}</div>
                <div style={card}>
                  {d.rows.map(function (r, i) {
                    var m = byId[r.u] || { name: "Участник" };
                    var h = hById[r.h] || {};
                    var at = r.at ? ((typeof bosParseTs === "function") ? bosParseTs(r.at) : new Date(r.at)) : null;
                    return (
                      <div key={i} style={{ position: "relative", display: "flex", alignItems: "center", gap: 8, padding: "0 16px", minHeight: 68 }}>
                        {i > 0 && <span aria-hidden style={{ position: "absolute", left: 88, right: 0, top: 0, height: 1, background: "var(--line-2)" }} />}
                        <span style={{ width: 48, display: "grid", placeItems: "center", flexShrink: 0 }}>
                          <BuddyFaceLive avatar={m.avatar} name={m.name} size={44} />
                        </span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: "block", fontSize: 17, lineHeight: "22px", letterSpacing: "-0.43px", color: "var(--text)",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
                          <span style={{ display: "block", fontSize: 15, lineHeight: "20px", letterSpacing: "-0.23px", color: "var(--text-2)",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {(h.emoji ? h.emoji + " " : "") + (h.name || "Привычка круга")}
                          </span>
                        </span>
                        {at && <span style={{ fontSize: 15, lineHeight: "20px", color: "var(--text-2)", flexShrink: 0 }}>
                          {String(at.getHours()).padStart(2, "0") + ":" + String(at.getMinutes()).padStart(2, "0")}
                        </span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "tasks" && (
        <div className="fig-swap" style={{ padding: "0 16px" }}>
          <div style={{ ...card, padding: "28px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700, lineHeight: "28px", letterSpacing: "-0.26px", color: "var(--text)" }}>Дела пока без истории</div>
            <div style={{ fontSize: 15, lineHeight: "20px", color: "var(--text-2)", marginTop: 6 }}>
              У дел круга в базе хранится «кто закрыл», но не когда. Чтобы лента дел показывала время,
              нужен один столбец в бэкенде — тогда вкладка заполнится сама.
            </div>
          </div>
        </div>
      )}
      {tab === "goals" && (
        <div className="fig-swap" style={{ padding: "0 16px" }}>
          <div style={{ ...card, padding: "28px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700, lineHeight: "28px", letterSpacing: "-0.26px", color: "var(--text)" }}>Цели пока без истории</div>
            <div style={{ fontSize: 15, lineHeight: "20px", color: "var(--text-2)", marginTop: 6 }}>
              События «цель закрыта» ещё не записываются. Как только появятся — эта вкладка покажет их
              по дням, как отметки привычек.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════════════
   УЧАСТНИКИ — кадры «Участники» (участник: сегмент «N участников · M друзей» + поиск;
   админ: то же + строка «Добавить администратора» ведёт в управление).
   Заголовок-пилюля по центру 17/590, сегмент 361×32 (жёлоб стеклянный, активный
   #767680@0.24, подпись 13/590), поиск 44 r26, карточка r24 со строками 68.
   «Друзья» у нас = люди, с которыми есть ещё один общий круг, — настоящий признак.
   ═══════════════════════════════════════════════════════════════════════════════════════ */
function CircleMembersLive() {
  const { navigate, params, back } = useNav();
  const app = (typeof useApp === "function") ? useApp() : null;
  const t = (params && params.team) || { name: "Группа" };
  const _live = !!(window.bosCloud && window.bosCloud.enabled() && t.cloudId);
  const [seg, setSeg] = React.useState("all");
  const [q, setQ] = React.useState("");
  const [meId, setMeId] = React.useState(null);
  const [members, setMembers] = React.useState(function () { return (t.members || []).slice(); });
  const [friendIds, setFriendIds] = React.useState({});
  React.useEffect(function () {
    var on = true, C = window.bosCloud;
    if (!_live) return;
    C.uid().then(function (id) { if (on) setMeId(id); });
    C.teamMembers(t.cloudId).then(function (m) { if (on && m) setMembers(m); }).catch(function () {});
    // «Друзья» = вместе ещё хотя бы в одном МОЁМ круге, кроме этого.
    (async function () {
      var mine = (app && app.teams || []).filter(function (x) { return x.cloudId && x.cloudId !== t.cloudId; });
      var out = {};
      for (var i = 0; i < mine.length; i++) {
        try {
          var mm = await C.teamMembers(mine[i].cloudId);
          (mm || []).forEach(function (p) { out[p.id] = true; });
        } catch (e) {}
      }
      if (on) setFriendIds(out);
    })();
    return function () { on = false; };
  }, [_live, t.cloudId]);

  const qq = q.trim().toLowerCase();
  const friends = members.filter(function (m) { return m.id !== meId && friendIds[m.id]; });
  const base = seg === "friends" ? friends : members;
  const list = base.filter(function (m) { return !qq || ("" + m.name).toLowerCase().indexOf(qq) >= 0; });
  const plural = function (n, a, b, c) { var x = n % 10, y = n % 100; return n + " " + ((x === 1 && y !== 11) ? a : (x >= 2 && x <= 4 && (y < 12 || y > 14)) ? b : c); };
  const glass = { background: "rgba(153,153,153,0.17)", WebkitBackdropFilter: "blur(30px) saturate(1.8)", backdropFilter: "blur(30px) saturate(1.8)" };

  return (
    <div className="page-in" style={{ padding: "0 0 24px" }}>
      {/* Шапка: назад-стекло · пилюля «Участники» по центру */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", height: 54 }}>
        <button onClick={back} className="tap" aria-label="Назад"
          style={{ ...glass, width: 44, height: 44, borderRadius: 999, border: 0, display: "grid", placeItems: "center", cursor: "pointer", color: "var(--text)", flexShrink: 0 }}>
          <I.ChevronRight size={19} strokeWidth={2.6} style={{ transform: "rotate(180deg)" }} />
        </button>
        <span style={{ flex: 1, textAlign: "center", fontSize: 17, fontWeight: 590, lineHeight: "22px", letterSpacing: "-0.43px", color: "var(--text)" }}>Участники</span>
        <span style={{ width: 44, flexShrink: 0 }} />
      </div>

      {/* Сегмент 361×32 из макета */}
      <div style={{ padding: "0 16px 10px" }}>
        <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr 1fr", padding: 2, height: 32, boxSizing: "border-box",
          borderRadius: 999, background: "rgba(153,153,153,0.17)", WebkitBackdropFilter: "blur(20px) saturate(180%)", backdropFilter: "blur(20px) saturate(180%)" }}>
          <span aria-hidden style={{ position: "absolute", top: 2, bottom: 2, left: 2, width: "calc((100% - 4px) / 2)", borderRadius: 999,
            background: "rgba(118,118,128,0.24)", transform: "translateX(" + (seg === "friends" ? 100 : 0) + "%)",
            transition: "transform .34s cubic-bezier(0.34,1.4,0.44,1)" }} />
          {[["all", plural(members.length, "участник", "участника", "участников")], ["friends", plural(friends.length, "друг", "друга", "друзей")]].map(function (m) {
            const on = seg === m[0];
            return <button key={m[0]} onClick={function () { setSeg(m[0]); }} className="tap" data-haptic="selection"
              style={{ position: "relative", minWidth: 0, border: 0, borderRadius: 999, height: 28, padding: 0, cursor: "pointer", background: "transparent",
                fontSize: 13, fontWeight: 590, letterSpacing: "-0.08px", color: on ? "var(--text)" : "#8A8A8A", transition: "color .2s" }}>{m[1]}</button>;
          })}
        </div>
      </div>

      {typeof FigSearchField === "function" && <FigSearchField value={q} onChange={setQ} placeholder="Поиск" />}

      <div className="fig-swap" style={{ padding: "0 16px" }}>
        <div style={{ borderRadius: 24, background: "var(--surface)", overflow: "hidden" }}>
          {list.map(function (m, i) {
            const me = m.id === meId;
            return <FigFriendRow key={m.id} first={i === 0}
              person={{ name: me ? "Ты" : m.name, avatar: m.avatar, level: null,
                status: m.role === "owner" ? "Владелец" : (m.role === "admin" ? "Администратор" : (friendIds[m.id] ? "вы вместе ещё в одной группе" : null)) }}
              onOpen={function () { navigate("team-person", { team: t, person: m, from: "team-members" }); }}
              onChat={me ? null : function () { navigate("team-detail", { team: t, from: "team-members", tab: "chat", prefill: "@" + (m.name || "").split(" ")[0] + " " }); }} />;
          })}
          {!list.length && <div style={{ padding: "24px 16px", textAlign: "center", fontSize: 15, color: "var(--text-2)" }}>
            {qq ? "Никого с таким именем." : "Пока никого."}</div>}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════════════
   АДМИНИСТРАТОРЫ — кадр «Администраторы» (владелец): строка «Добавить администратора»
   с подписью «Вы можете назначить администраторов из подписчиков группы», список
   владелец + админы, «…» у админа → снять (алерт «Удаление администратора»).
   Права по способностям из кадра «Права администратора» — тумблеры #30D158.
   Права хранить негде, пока нет столбца, — храним в teams.goal.adminRights через
   updateTeam; сам role='admin' пишем в team_members. Если RLS не пустит — честно
   говорим, что нужен патч БД.
   ═══════════════════════════════════════════════════════════════════════════════════════ */
const BOS_ADMIN_RIGHTS = [
  ["edit",   "Изменение группы"],
  ["habits", "Управление привычками"],
  ["tasks",  "Управление задачами"],
  ["goals",  "Управление целями"],
  ["chat",   "Управление чатом группы"],
  ["admins", "Назначение администраторов"],
  ["block",  "Блокировка пользователей"],
];
function CircleAdminsLive() {
  const { navigate, params, back } = useNav();
  const app = (typeof useApp === "function") ? useApp() : null;
  const t = (params && params.team) || { name: "Группа" };
  const _live = !!(window.bosCloud && window.bosCloud.enabled() && t.cloudId);
  const { open: openSheet, close: closeSheet } = (typeof useSheet === "function") ? useSheet() : { open: function () {}, close: function () {} };
  const [members, setMembers] = React.useState(function () { return (t.members || []).slice(); });
  const [err, setErr] = React.useState("");
  const load = React.useCallback(function () {
    if (!_live) return;
    window.bosCloud.teamMembers(t.cloudId).then(function (m) { if (m) setMembers(m); }).catch(function () {});
  }, [_live, t.cloudId]);
  React.useEffect(function () { load(); }, [load]);

  const admins = members.filter(function (m) { return m.role === "owner" || m.role === "admin"; })
    .sort(function (a, b) { return (a.role === "owner" ? 0 : 1) - (b.role === "owner" ? 0 : 1); });
  const candidates = members.filter(function (m) { return m.role === "member"; });
  const glass = { background: "rgba(153,153,153,0.17)", WebkitBackdropFilter: "blur(30px) saturate(1.8)", backdropFilter: "blur(30px) saturate(1.8)" };
  const card = { borderRadius: 24, background: "var(--surface)", overflow: "hidden" };

  const demote = function (m) {
    openSheet(
      <div style={{ padding: "6px 16px 12px", color: "var(--text)", textAlign: "center" }}>
        <div style={{ fontSize: 17, fontWeight: 590, lineHeight: "22px" }}>Удаление администратора</div>
        <div style={{ fontSize: 17, lineHeight: "22px", marginTop: 10 }}>
          {(m.name || "Участник") + " перестанет быть администратором, и все связанные полномочия будут аннулированы. Удалить администратора?"}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          <button onClick={closeSheet} className="tap" style={{ flex: 1, height: 48, borderRadius: 999, border: 0, cursor: "pointer",
            background: "var(--surface-3)", color: "var(--text)", fontSize: 17, fontWeight: 590 }}>Отмена</button>
          <button onClick={function () {
            window.bosCloud.setMemberRole(t.cloudId, m.id, "member").then(function (ok) {
              closeSheet();
              if (ok) { load(); if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} } }
              else setErr("Не получилось: базе нужен патч прав (RLS не пускает менять роль).");
            });
          }} className="tap" style={{ flex: 1, height: 48, borderRadius: 999, border: 0, cursor: "pointer",
            background: "var(--accent-red)", color: "#fff", fontSize: 17, fontWeight: 590 }}>Удалить</button>
        </div>
      </div>
    );
  };

  return (
    <div className="page-in" style={{ padding: "0 0 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", height: 44 }}>
        <button onClick={back} className="tap" aria-label="Назад"
          style={{ ...glass, width: 44, height: 44, borderRadius: 999, border: 0, display: "grid", placeItems: "center", cursor: "pointer", color: "var(--text)" }}>
          <I.ChevronRight size={19} strokeWidth={2.6} style={{ transform: "rotate(180deg)" }} />
        </button>
      </div>
      <div style={{ padding: "10px 16px 10px" }}>
        <div style={{ fontSize: 34, fontWeight: 700, lineHeight: "41px", letterSpacing: "0.4px", color: "var(--text)" }}>Администраторы</div>
      </div>

      {/* Добавить администратора */}
      <div style={{ padding: "0 16px" }}>
        <div style={card}>
          <button onClick={function () { navigate("team-admin-add", { team: t, from: "team-admins" }); }} className="tap"
            style={{ width: "100%", border: 0, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
              padding: "0 16px", minHeight: 52, textAlign: "left", color: "var(--text)" }}>
            <span style={{ width: 36, display: "grid", placeItems: "center", color: "var(--text-2)" }}><I.UserPlus size={20} strokeWidth={2} /></span>
            <span style={{ flex: 1, fontSize: 17, lineHeight: "22px", letterSpacing: "-0.43px" }}>Добавить администратора</span>
            <I.ChevronRight size={15} strokeWidth={2.6} color="var(--text-3)" />
          </button>
        </div>
        <div style={{ padding: "8px 16px 0", fontSize: 13, lineHeight: "18px", letterSpacing: "-0.08px", color: "var(--text-2)" }}>
          Вы можете назначить администраторов из участников группы.
        </div>
      </div>

      {/* Список */}
      <div style={{ padding: "16px 16px 0" }}>
        <div style={card}>
          {admins.map(function (m, i) {
            return (
              <div key={m.id} style={{ position: "relative", display: "flex", alignItems: "center", gap: 8, padding: "0 16px", minHeight: 68 }}>
                {i > 0 && <span aria-hidden style={{ position: "absolute", left: 88, right: 0, top: 0, height: 1, background: "var(--line-2)" }} />}
                <span style={{ width: 48, display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <BuddyFaceLive avatar={m.avatar} name={m.name} size={44} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 17, lineHeight: "22px", letterSpacing: "-0.43px", color: "var(--text)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
                  <span style={{ display: "block", fontSize: 15, lineHeight: "20px", letterSpacing: "-0.23px", color: "var(--text-2)" }}>
                    {m.role === "owner" ? "Владелец" : "Администратор"}</span>
                </span>
                {m.role === "admin" && (
                  <button onClick={function () { demote(m); }} className="tap" aria-label="Снять администратора"
                    style={{ border: 0, background: "transparent", padding: 6, cursor: "pointer", color: "var(--text-2)", flexShrink: 0 }}>
                    <I.More size={20} strokeWidth={2.2} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {err && <div style={{ padding: "10px 20px 0", fontSize: 13, color: "var(--accent-red)", lineHeight: 1.4 }}>{err}</div>}
      {candidates.length === 0 && admins.length <= 1 && (
        <div style={{ padding: "10px 20px 0", fontSize: 13, color: "var(--text-3)", lineHeight: 1.4 }}>
          Когда в группе появятся участники, их можно будет назначить администраторами.
        </div>
      )}
    </div>
  );
}

/* «Сделать администратором»: список участников → страница прав одного человека. */
function CircleAdminAddLive() {
  const { navigate, params, back } = useNav();
  const t = (params && params.team) || { name: "Группа" };
  const _live = !!(window.bosCloud && window.bosCloud.enabled() && t.cloudId);
  const [members, setMembers] = React.useState([]);
  React.useEffect(function () {
    if (!_live) return;
    window.bosCloud.teamMembers(t.cloudId).then(function (m) { if (m) setMembers(m.filter(function (x) { return x.role === "member"; })); }).catch(function () {});
  }, [_live, t.cloudId]);
  const glass = { background: "rgba(153,153,153,0.17)", WebkitBackdropFilter: "blur(30px) saturate(1.8)", backdropFilter: "blur(30px) saturate(1.8)" };
  return (
    <div className="page-in" style={{ padding: "0 0 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", height: 44 }}>
        <button onClick={back} className="tap" aria-label="Назад"
          style={{ ...glass, width: 44, height: 44, borderRadius: 999, border: 0, display: "grid", placeItems: "center", cursor: "pointer", color: "var(--text)" }}>
          <I.ChevronRight size={19} strokeWidth={2.6} style={{ transform: "rotate(180deg)" }} />
        </button>
      </div>
      <div style={{ padding: "10px 16px 10px" }}>
        <div style={{ fontSize: 34, fontWeight: 700, lineHeight: "41px", letterSpacing: "0.4px", color: "var(--text)" }}>Права администратора</div>
      </div>
      <div style={{ padding: "0 16px" }}>
        <div style={{ borderRadius: 24, background: "var(--surface)", overflow: "hidden" }}>
          {members.map(function (m, i) {
            return <FigFriendRow key={m.id} first={i === 0}
              person={{ name: m.name, avatar: m.avatar, level: null,
                status: m.joinedAt ? ("Участвует с " + new Date(m.joinedAt).toLocaleDateString("ru-RU")) : null }}
              onOpen={function () { navigate("team-admin-rights", { team: t, person: m, from: "team-admin-add" }); }} />;
          })}
          {!members.length && <div style={{ padding: "24px 16px", textAlign: "center", fontSize: 15, color: "var(--text-2)" }}>
            Пока некого назначить — в группе нет других участников.</div>}
        </div>
      </div>
    </div>
  );
}

/* Права одного человека: тумблеры способностей + «Сделать администратором». */
function CircleAdminRightsLive() {
  const { navigate, params, back } = useNav();
  const app = (typeof useApp === "function") ? useApp() : null;
  const t = (params && params.team) || { name: "Группа" };
  const p = (params && params.person) || { name: "Участник" };
  const _live = !!(window.bosCloud && window.bosCloud.enabled() && t.cloudId);
  // Права по умолчанию: всё, кроме назначения админов и блокировок.
  const saved = (t.goal && t.goal.adminRights && t.goal.adminRights[p.id]) || null;
  const [rights, setRights] = React.useState(function () {
    var o = {}; BOS_ADMIN_RIGHTS.forEach(function (r) { o[r[0]] = saved ? !!saved[r[0]] : (r[0] !== "admins" && r[0] !== "block"); });
    return o;
  });
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const glass = { background: "rgba(153,153,153,0.17)", WebkitBackdropFilter: "blur(30px) saturate(1.8)", backdropFilter: "blur(30px) saturate(1.8)" };
  const card = { borderRadius: 24, background: "var(--surface)", overflow: "hidden" };

  const save = function () {
    if (busy) return;
    setBusy(true); setErr("");
    window.bosCloud.setMemberRole(t.cloudId, p.id, "admin").then(function (ok) {
      if (!ok) { setBusy(false); setErr("Не получилось: базе нужен патч прав (RLS не пускает менять роль)."); return; }
      // Права — в карман goal.adminRights (общий JSON настроек группы).
      var goal = Object.assign({}, t.goal || {});
      var ar = Object.assign({}, goal.adminRights || {}); ar[p.id] = rights; goal.adminRights = ar;
      try { window.bosCloud.updateTeam(t.cloudId, { goal: goal }); } catch (e) {}
      try { app && app.updateTeam && app.updateTeam(t._id || t.id, { goal: goal }); } catch (e) {}
      if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} }
      navigate("team-admins", { team: t, from: "team-admin-rights" });
    });
  };

  const Toggle = function (props) {
    return (
      <button onClick={props.onFlip} className="tap" data-no-haptic aria-pressed={props.on}
        style={{ width: 51, height: 31, borderRadius: 999, border: 0, cursor: "pointer", flexShrink: 0, position: "relative",
          background: props.on ? "#30D158" : "var(--surface-3)", transition: "background .2s" }}>
        <span aria-hidden style={{ position: "absolute", top: 2, left: props.on ? 22 : 2, width: 27, height: 27, borderRadius: "50%",
          background: "#fff", boxShadow: "0 2px 6px rgba(0,0,0,0.25)", transition: "left .22s cubic-bezier(0.34,1.3,0.44,1)" }} />
      </button>
    );
  };

  return (
    <div className="page-in" style={{ padding: "0 0 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", height: 44 }}>
        <button onClick={back} className="tap" aria-label="Назад"
          style={{ ...glass, width: 44, height: 44, borderRadius: 999, border: 0, display: "grid", placeItems: "center", cursor: "pointer", color: "var(--text)" }}>
          <I.ChevronRight size={19} strokeWidth={2.6} style={{ transform: "rotate(180deg)" }} />
        </button>
      </div>
      <div style={{ padding: "10px 16px 10px" }}>
        <div style={{ fontSize: 34, fontWeight: 700, lineHeight: "41px", letterSpacing: "0.4px", color: "var(--text)" }}>Права администратора</div>
      </div>

      <div style={{ padding: "0 16px" }}>
        <div style={{ ...card, display: "flex", alignItems: "center", gap: 8, padding: "10px 16px" }}>
          <BuddyFaceLive avatar={p.avatar} name={p.name} size={44} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 17, lineHeight: "22px", letterSpacing: "-0.43px", color: "var(--text)" }}>{p.name}</span>
            {p.joinedAt && <span style={{ display: "block", fontSize: 15, lineHeight: "20px", color: "var(--text-2)" }}>
              {"Участвует с " + new Date(p.joinedAt).toLocaleDateString("ru-RU")}</span>}
          </span>
        </div>
      </div>

      <div style={{ padding: "16px 32px 8px", fontSize: 17, fontWeight: 590, lineHeight: "22px", letterSpacing: "-0.43px", color: "var(--text-2)" }}>Возможности</div>
      <div style={{ padding: "0 16px" }}>
        <div style={card}>
          {BOS_ADMIN_RIGHTS.map(function (r, i) {
            return (
              <div key={r[0]} style={{ position: "relative", display: "flex", alignItems: "center", gap: 10, padding: "0 16px", minHeight: 52 }}>
                {i > 0 && <span aria-hidden style={{ position: "absolute", left: 16, right: 0, top: 0, height: 1, background: "var(--line-2)" }} />}
                <span style={{ flex: 1, fontSize: 17, lineHeight: "22px", letterSpacing: "-0.43px", color: "var(--text)" }}>{r[1]}</span>
                <Toggle on={rights[r[0]]} onFlip={function () {
                  setRights(function (o) { var n = Object.assign({}, o); n[r[0]] = !n[r[0]]; return n; });
                  if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} }
                }} />
              </div>
            );
          })}
        </div>
        <div style={{ padding: "8px 16px 0", fontSize: 13, lineHeight: "18px", letterSpacing: "-0.08px", color: "var(--text-2)" }}>
          Права действуют внутри приложения; жёсткая проверка на сервере появится вместе с патчем БД.
        </div>
      </div>

      <div style={{ padding: "18px 16px 0" }}>
        <button onClick={save} disabled={busy} className="tap"
          style={{ width: "100%", height: 50, borderRadius: 999, border: 0, cursor: "pointer", background: "var(--cta)",
            color: "var(--cta-ink)", fontSize: 17, fontWeight: 590, opacity: busy ? 0.6 : 1 }}>
          {busy ? "Сохраняю…" : "Сделать администратором"}
        </button>
        {err && <div style={{ padding: "10px 4px 0", fontSize: 13, color: "var(--accent-red)", lineHeight: 1.4 }}>{err}</div>}
      </div>
    </div>
  );
}

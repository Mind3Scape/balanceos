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
            onClick={function () { navigate("team-detail", { team: t, from: "team-overview", tab: "people" }); }} />
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

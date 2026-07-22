/* EXTRA — LIVE-only forks of the detail / mood / journal / AI-chat screens (real
   Telegram user, app.mode === "live" is ALWAYS true here). Giving the live user its
   OWN screen files keeps the two demo modes ('demo' / 'fresh') frozen — future live
   edits can never break the showcase. Precedent: screens/live/home_live.jsx (HomeLive),
   screens/live/community_live.jsx (CommunityLive + TeamDetailLive).

   What the demo/fresh branches contributed (all stripped here):
   • HabitDetailLive — drops the fabricated "friendly competition" (isShared roster +
     mkStreak + leaderboard + per-person aggregate rings + the demo calendar scatter).
     Live has no real per-friend logs client-side, so it ALWAYS shows the honest SOLO
     view: real streak/best/total from the check-in log (h.log) and the real per-habit
     month calendar keyed by today's year.
   • GoalDetailLive — identical to the original minus the demo streak fallback: the
     linked-habit streak is ALWAYS the real bosStreak(h.log).
   • MoodLive — the save ALWAYS keys by the REAL date (bosTodayKey()), never the frozen
     demo day (TODAY = 28).
   • JournalLive — drops the frozen showcase entries (demoPast) + the demo header date +
     the demo "+15 XP" save; ALWAYS the real header date, the real saved-notes list
     (app.dayNotes) and the honest live save (+10 XP only when there's text).
   • AIChatLive — drops the scripted demo seed (greeting/summary/suggestion/insight
     sample turns) and the frozen demo time divider. Keeps the REAL proxy path:
     aiReplyLive → bosParseAction action-cards → AI_LIVE_FALLBACK, with the live chat
     persisted on-device.

   Reuses the shared core/ toolkit (AI engine AI_SYSTEM/AI_LIVE_FALLBACK/aiRaw,
   bosParseAction, StateChatOrb, MiniBars, buildQuickPrompts, MOOD_TAGS,
   journalDateLabel) + the live forks in shared_live.jsx (aiReplyLive,
   buildAiContextLive, PeopleMonthCalendarLive) + framework (bos* helpers,
   StateOrb/StaticOrb, CountUp, MOOD_OPTIONS, PageHeader, the icon object I, hooks).
   The ONLY new top-level
   declarations in this file are exactly: StatTrioLive, HabitDetailLive, GoalDetailLive,
   MoodLive, JournalLive, AIChatLive. */

/* One native stat row — three figures sharing a single card under hairline dividers, with
   thin line icons (not emoji) and SF numerals. Replaces the three "boxy" emoji cards that
   read as vibe-coded (David: «три блока серия/лучшая/всего выглядят как вайп-кодинг»). Used by
   BOTH habit + goal detail so the whole app keeps one rhythm. `items`: {icon, l, v, suf?, text?}. */
function StatTrioLive({ items, card, isDark, bare = false, tintInk = null }) {
  const Count = (typeof CountUp !== "undefined") ? CountUp : ({ value }) => value;
  const div = tintInk ? (isDark ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.5)") : (isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.11)");
  const sufStyle = { fontSize: 11, color: "var(--text-4)", fontWeight: 600, marginLeft: 1 };
  // ПОД СТЕКЛО (David: «верхний блок в стекло, чтобы гармонировал с нижним календарём, иконки
  // выразительнее — сейчас нет ощущения разграничения»): тот же sheen+glass-тень, что у иконки-тайла,
  // разделители жирнее. Icon в линию со значением; все значения одного кегля (16px) — ровный низ.
  const glassBg = (typeof BOS_TILE_SHEEN !== "undefined" ? BOS_TILE_SHEEN + ", " : "") + (isDark ? "rgba(255,255,255,0.06)" : "var(--surface-3)");
  return (
    <div style={bare ? { display: "flex", alignItems: "stretch" } : { background: glassBg, boxShadow: (typeof bosTileGlass === "function" ? bosTileGlass(isDark) : (card && card.boxShadow) || "none"), borderRadius: 18, padding: "13px 0", display: "flex", alignItems: "stretch" }}>
      {items.map((s, i) => (
        <div key={i} style={{ flex: 1, minWidth: 0, padding: "0 6px", borderLeft: i > 0 ? ("0.5px solid " + div) : "none",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, color: tintInk || "var(--text)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.3px", lineHeight: 1 }}>
            {s.icon}
            <span style={{ display: "inline-flex", alignItems: "baseline", minWidth: 0 }}>
              {s.text ? s.text : <Count value={s.v} />}
              {(!s.text && s.suf) ? <span style={sufStyle}>{s.suf}</span> : null}
            </span>
          </div>
          <div style={{ fontSize: 9.5, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, lineHeight: 1 }}>{s.l}</div>
        </div>
      ))}
    </div>
  );
}


/* HABIT DETAIL — LIVE = СТАНДАРТ «лесенка» (макет Л, 2026-07-16). Ступень 1 (личная) и
   ступень 2 (с друзьями) ОДНОГО тела BosHabitStandardBodyLive — то же, что открывает
   привычка круга (ступень 3, habit_standard_live.jsx). Прежняя версия (v624/v660 —
   единый блок + PeopleMonthCalendarLive + СерияЛучшаяВсего-трио) — в
   _parked/habit-detail-v660/. Отметка — ЖИВОЙ чекбокс приложения в шапке
   (HabitCheck / счётчик / таймер по типу привычки): один жест, один код с главной. */
function HabitDetailLive() {
  const { navigate, params } = useNav();
  const app = (typeof useApp === "function") ? useApp() : null;
  const { open: openSheet } = (typeof useSheet === "function") ? useSheet() : { open: () => {} };
  const back = params?.from || "habits";
  const seed = params?.habit || { id: 0, emoji: "🏃🏼‍♀️", name: "Утренняя пробежка", streak: 12 };
  const h = (app?.habits && app.habits.find((x) => x.id === seed.id)) || seed;
  const isDark = app?.themeOverride === "dark";

  // Реальная статистика из лога отметок (как раньше — ничего не выдумываем).
  const _log = h.log || {};
  const _logDays = Object.keys(_log).filter((k) => _log[k] && /^\d{4}-\d{2}-\d{2}$/.test(k)).sort();
  const _mask = (typeof bosDaysMask === "function") ? bosDaysMask(h.days) : null;
  const _gapIsRest = (a, diff) => { if (!_mask) return false; for (let dd = 1; dd < diff; dd++) { const t = new Date(a); t.setDate(t.getDate() + dd); if (_mask[(t.getDay() + 6) % 7]) return false; } return true; };
  const _bestRun = (days) => { if (!days.length) return 0; let b = 1, c = 1; for (let i = 1; i < days.length; i++) { const a = new Date(days[i - 1] + "T00:00:00"); const diff = Math.round((new Date(days[i] + "T00:00:00") - a) / 86400000); if (diff === 1 || (diff > 1 && _gapIsRest(a, diff))) { c++; if (c > b) b = c; } else if (diff > 1) c = 1; } return b; };
  const streak = (typeof bosStreak === "function") ? bosStreak(_log, h.days) : (h.streak || 0);
  const best = Math.max(streak, _bestRun(_logDays));
  const total = _logDays.length;
  const _hc = (typeof bosCanonColor === "function") ? bosCanonColor(h.color) : h.color;
  const _hcNeutral = !_hc || _hc === "#0a0a0a" || ("" + _hc).toLowerCase() === "#8e8e93";
  const accent = _hcNeutral ? null : _hc;

  // Совместная (с друзьями): живые дни каждого — как раньше (кэш, без миганий).
  const buddies = useBuddyMembersLive(h.shareCode);
  const _shared = !!(buddies && buddies.length > 1);
  const _isQuant = (h.goalPerDay || 1) > 1;
  const _qGoal = Math.max(1, h.goalPerDay || 1);
  const _todayK = (typeof bosTodayKey === "function") ? bosTodayKey() : new Date().toISOString().slice(0, 10);
  const _qCount = h.done ? _qGoal : ((h.counts && h.counts[_todayK]) || 0);

  // BACKFILL «вместе»: свои прежние дни — в общий лог, чтобы друзья видели всю серию (как раньше).
  React.useEffect(function () {
    if (!h.shareCode || !(window.bosCloud && window.bosCloud.setSharedLogBulk)) return;
    var days = Object.keys(_log).filter(function (k) { return _log[k] && /^\d{4}-\d{2}-\d{2}$/.test(k); });
    if (days.length) { try { window.bosCloud.setSharedLogBulk(h.shareCode, days); } catch (e) {} }
  }, [h.shareCode]);

  // «Сегодня»-нить (ступень 2): лица друзей в свой час; я — мгновенно по локальной галочке.
  const _pt = (x) => (typeof bosParseTs === "function" ? bosParseTs(x) : new Date(x));
  const _hrOf = (x) => { const d = _pt(x); return d.getHours() + d.getMinutes() / 60; };
  let thread = null;
  if (_shared && h.threadOff !== true) {
    const faces = buddies.filter((m) => m.todayAt && !m.me).map((m) => ({ avatar: m.avatar, name: m.name, hr: _hrOf(m.todayAt) }));
    const _iDid = h.done || (_isQuant && _qCount > 0);
    const meB = buddies.find((m) => m.me);
    if (_iDid && meB) faces.push({ avatar: meB.avatar, name: "Ты", hr: meB.todayAt ? _hrOf(meB.todayAt) : (new Date().getHours() + new Date().getMinutes() / 60) });
    thread = { faces };
  }

  // «Календарь» = ОДИН месяц (David 2026-07-22: «уберём неделю и год пока»). Заполнение —
  // золотой градиент (наш стандарт), клетки крупнее. Тап по прожитому дню — ТЕЛЕПОРТ в него.
  const _dayPct = (k) => (h.done && k === _todayK) ? 1 : (_log[k] ? 1 : (_isQuant && h.counts && h.counts[k] ? Math.min(1, h.counts[k] / _qGoal) : 0));
  // Телепорт: выбранный день (по умолчанию сегодня); панель дня и история живут под календарём.
  const [selDay, setSelDay] = React.useState(_todayK);
  const now = new Date();
  const dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const _mk = (d) => now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
  const _maskOk = (mi, d) => !_mask || _mask[(new Date(now.getFullYear(), mi, d).getDay() + 6) % 7];
  const monthCells = Array.from({ length: dim }).map((_, i) => {
    const k = _mk(i + 1);
    const dimC = k > _todayK || !_maskOk(now.getMonth(), i + 1);
    const tdy = k === _todayK;
    const late = !!(h.lateDays && h.lateDays[k]);
    const canTap = k <= _todayK; // телепорт — в любой прожитый день (и в сегодня)
    const sel = k === selDay && !tdy; // сегодня и так в золотом кольце
    if (!_shared) return { pct: _dayPct(k), dim: dimC, today: tdy, k, late, canTap, sel };
    const didN = buddies.filter((m) => (m.me ? (_log[k] || (m.days && m.days[k])) : (m.days && m.days[k]))).length;
    return { pct: didN / buddies.length, dim: dimC, today: tdy, k, late, canTap, sel };
  });

  // ОТМЕТКИ ДНЯ + ИСТОРИЯ (David 2026-07-22: «тыкаю на день — телепортируюсь в него и вижу,
  // кто отмечался; и внизу история отметок — кто во сколько»). Мои времена — локальный журнал
  // bos:marktimes (v791); у друзей время известно только за сегодня (todayAt).
  const _mtStore = React.useMemo(() => {
    try { return JSON.parse(localStorage.getItem("bos:marktimes:" + ((app && app.persistId) || "live")) || "{}"); } catch (e) { return {}; }
  }, [app && app.persistId, h.done, _qCount]);
  const _myMin = (k) => { const d = _mtStore[k] || {}; const v = d["" + (h.cloudId || h.id)]; return v == null ? d["" + h.id] : v; };
  const _fmtMin = (v) => v == null ? null : (Math.floor(v / 60) < 10 ? "0" : "") + Math.floor(v / 60) + ":" + (v % 60 < 10 ? "0" : "") + (v % 60);
  const _entriesFor = (k) => {
    const out = [];
    if (_dayPct(k) > 0) out.push({ who: "Ты", me: true, time: _fmtMin(_myMin(k)), late: !!(h.lateDays && h.lateDays[k]), part: _isQuant && !_log[k] && !(h.done && k === _todayK) ? Math.min(_qGoal, (h.counts && h.counts[k]) || 0) : 0 });
    if (_shared) buddies.forEach((m) => {
      if (m.me || !(m.days && m.days[k])) return;
      out.push({ who: m.name, avatar: m.avatar, time: (k === _todayK && m.todayAt) ? (typeof bosRoomHHMM === "function" ? bosRoomHHMM(m.todayAt) : null) : null });
    });
    return out;
  };
  const _dayLbl = (k, gen) => {
    if (k === _todayK) return "Сегодня";
    const d = new Date(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10));
    return gen ? (d.getDate() + " " + BOS_MON_GEN[d.getMonth()]) : (BOS_DOW_RU[d.getDay()] + ", " + d.getDate() + " " + BOS_MON_GEN[d.getMonth()]);
  };

  // ТЕЛЕПОРТ БЕЗ ДУБЛЯ (David 2026-07-22: «панель дня повторяет историю — перегруз»):
  // тап по дню с отметками ПОДСВЕЧИВАЕТ его строку в истории (скролл + вспышка), никакой
  // отдельной панели. Только пустой прошлый день даёт строку-пилюлю «Отметить · без XP» —
  // это единственный функционал, которого в истории нет.
  const _selD = new Date(+selDay.slice(0, 4), +selDay.slice(5, 7) - 1, +selDay.slice(8, 10));
  const _canBackdate = !!(selDay < _todayK && !_log[selDay] && _maskOk(now.getMonth(), _selD.getDate()) && app && app.markHabitDay);
  const _flashHist = (k) => {
    setTimeout(() => {
      try {
        const el = document.getElementById("bos-hist-" + k);
        if (!el) return;
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.animate([{ background: "rgba(240,195,10,0)" }, { background: "rgba(240,195,10,0.22)" }, { background: "rgba(240,195,10,0)" }],
          { duration: 1100, easing: "ease-in-out" });
      } catch (e) {}
    }, 60);
  };
  const dayNode = _canBackdate ? (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{_dayLbl(selDay)}</span>
      <button onClick={() => { try { app.markHabitDay(h.id, selDay); } catch (e) {} }} className="tap" data-haptic="selection"
        style={{ border: 0, borderRadius: 999, padding: "6px 13px", fontSize: 11.5, fontWeight: 700, cursor: "pointer", color: "#B4820A", background: "rgba(240,195,10,0.13)", display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
        <I.Check size={11} strokeWidth={3} color="#B4820A" />Отметить · без XP
      </button>
    </div>
  ) : null;

  // ИСТОРИЯ — одна тихая строка НА ДЕНЬ («15 июля · Ты 07:12»), новые сверху; тап — телепорт.
  const _histDays = {};
  _logDays.forEach((k) => { _histDays[k] = 1; });
  if (_isQuant && h.counts) Object.keys(h.counts).forEach((k) => { if (h.counts[k] > 0 && /^\d{4}-\d{2}-\d{2}$/.test(k)) _histDays[k] = 1; });
  if (_shared) buddies.forEach((m) => { if (!m.me && m.days) Object.keys(m.days).forEach((k) => { if (m.days[k] && /^\d{4}-\d{2}-\d{2}$/.test(k)) _histDays[k] = 1; }); });
  const _histKeys = Object.keys(_histDays).filter((k) => k <= _todayK).sort().reverse().slice(0, 14);
  const histDays = _histKeys.map((k) => ({ k, sum: _entriesFor(k).map((e) => e.who + (e.late ? " · задним числом" : (e.time ? " · " + e.time : ""))).join("  ·  ") })).filter((d) => d.sum);

  // Чипы — только ЖИВЫЕ золотые («✓ в 07:12», серия); «лучшая/всего» уходят тихой строкой
  // к заголовку календаря (David 2026-07-22: меньше соревнующихся за внимание пилюль).
  const chips = [];
  const _todayMinLbl = _fmtMin(_myMin(_todayK));
  if (h.done || (_isQuant && _qCount >= _qGoal)) chips.push({ gold: true, node: [<I.Check key="c" size={11} strokeWidth={3} color="#B4820A" />, _todayMinLbl ? " в " + _todayMinLbl : " сделано"] });
  if (streak > 0) chips.push({ gold: true, node: [<I.Flame key="f" size={10} color={BOS_ROOM_GOLD} filled strokeWidth={1.6} />, " серия " + streak] });
  const calExtra = [best > 0 ? "лучшая " + best : null, total > 0 ? "всего " + total : null].filter(Boolean).join(" · ") || null;

  // «Кто со мной» (ступень 2) — кружочки ровной сеткой, как люди в целях (David 2026-07-16:
  // «пусть выглядят как в целях люди — просто кружочки, ряды»): сделал сегодня — цветной,
  // ещё нет — серый; я — с золотым ободком. Тап не нужен: вся жизнь друга видна по цвету.
  let people = null, peopleExtra = null;
  if (_shared) {
    const _iDidT = h.done || (_isQuant && _qCount > 0);
    const active = (m) => (m.me ? _iDidT : !!m.todayAt);
    // Порядок = живой лидерборд, как в «Людях» круга (David 2026-07-16: «в совместных
    // привычках тоже должны сортироваться»): сегодняшние слева, дальше по активности
    // за 7 дней, молчащие серые — в хвост. Я ранжируюсь по общим правилам.
    const _wk7of = (m) => {
      const src = m.me ? (h.log || {}) : (m.days || {});
      let n = 0; for (let i = 0; i < 7; i++) if (src[bosRoomDayKey(i)]) n++;
      return n;
    };
    const ranked = buddies.slice().sort((a, b) => {
      const t0 = (active(b) ? 1 : 0) - (active(a) ? 1 : 0); if (t0) return t0;
      return _wk7of(b) - _wk7of(a);
    });
    peopleExtra = buddies.filter(active).length + " из " + buddies.length + " сегодня";
    people = (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", rowGap: 12, justifyItems: "center", alignItems: "center", padding: "4px 0" }}>
        {ranked.map((m, i) => (
          <BosRoomFaceLive key={m.id || i} p={{ avatar: m.avatar, name: m.me ? "Ты" : m.name }} size={34} active={active(m)} gold={!!m.me} isDark={isDark} />
        ))}
      </div>
    );
  }

  // Отметка — АККУРАТНАЯ КНОПКА в едином блоке (David 2026-07-19: круглый чекбокс в шапке
  // сливался с круглыми кнопками навигации сверху). Булева привычка — кнопка-пилюля; счётная/
  // таймер — их живой контрол по центру блока (у них свой жест). XP и празднования — как раньше
  // (детекторы в AppProvider срабатывают на toggleHabit, не на этой кнопке).
  // Отметка = ТОТ ЖЕ живой контрол, что на внешней карточке (HabitCheck / счётчик / таймер) —
  // один язык жеста на всё приложение (David 2026-07-22: «на внешних всё по-другому»).
  const _isTimer = h.duration > 0 && !_isQuant;
  const check = (_isTimer && typeof HabitTimerCheck === "function")
    ? <HabitTimerCheck habit={h} app={app} xp={10} />
    : (_isQuant && typeof HabitCountCheck === "function")
      ? <HabitCountCheck habit={h} app={app} xp={10} />
      : <HabitCheck done={!!h.done} color={accent} dark={isDark} onToggle={() => { if (app && app.toggleHabit) app.toggleHabit(h.id); }} />;

  const model = {
    emoji: h.emoji, color: accent, name: h.name,
    ctx: (_shared ? ("вместе с " + (buddies.length - 1) + (buddies.length - 1 === 1 ? " другом" : " друзьями") + " · ") : "")
      + ((_mask && typeof daysSummary === "function") ? daysSummary(h.days) : "Ежедневно") + (h.duration ? " · " + h.duration + " мин" : ""),
    chips, thread, unified: true, check,
    // Календарь-герой: ОДИН месяц (неделя/год убраны — David 2026-07-22), золотой градиент;
    // тап по дню — телепорт, панель дня живёт ВНУТРИ этой же карточки (belowNode).
    // Тап по дню: пустой прошлый → пилюля «Отметить · без XP» под сеткой; день с отметками →
    // подсветка его строки в ИСТОРИИ (никаких панелей-дублей — David 2026-07-22).
    rhythm: { mode: _shared ? "friends" : "solo", title: "Календарь", titleExtra: calExtra, single: true, gold: true, monthCells, monthHint: _shared ? "кольцо = доля друзей" : null, accent,
      onDayTap: (k) => { setSelDay(k); if (_entriesFor(k).length) _flashHist(k); }, belowNode: dayNode },
    peopleTitle: "Кто со мной", peopleExtra, people,
  };

  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader dark={isDark} title="" onBack={() => navigate(back)} right={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => openSheet(<ShareHabitSheetLive habit={h} dark={isDark} />)} className="tap" data-haptic="selection" aria-label="Вести вместе" title="Вести вместе"
            style={{ width: 40, height: 40, borderRadius: "50%", border: 0, display: "grid", placeItems: "center", cursor: "pointer", color: isDark ? "#fff" : "var(--text)", background: BOS_TILE_SHEEN + ", " + (isDark ? "rgba(255,255,255,0.10)" : "var(--surface-3)"), boxShadow: bosTileGlass(isDark) }}>
            <I.Share size={16} strokeWidth={2} />
          </button>
          <EditGlassButtonLive onClick={() => openSheet(<HabitFormSheetLive mode="edit" habit={h} navigate={navigate} />)} />
        </div>
      } />
      <BosHabitStandardBodyLive model={model} isDark={isDark} />
      {/* История — одна тихая строка на день, тап = телепорт в день (пустая — блока нет). */}
      {histDays.length > 0 && (
        <React.Fragment>
          <div style={{ padding: "16px 4px 8px" }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-4)" }}>История</span>
          </div>
          <div style={{ background: "var(--card)", borderRadius: 18, boxShadow: "var(--card-shadow)", padding: "4px 14px" }}>
            {histDays.map((d, i) => (
              <button key={d.k} id={"bos-hist-" + d.k} onClick={() => setSelDay(d.k)} className="tap" data-haptic="selection"
                style={{ display: "flex", width: "100%", textAlign: "left", alignItems: "center", gap: 10, border: 0, background: "transparent", cursor: "pointer", padding: "9px 0", borderTop: i ? "1px solid " + (isDark ? "rgba(255,255,255,0.06)" : "rgba(10,10,10,0.05)") : "none" }}>
                <span style={{ width: 60, flexShrink: 0, fontSize: 11, fontWeight: 700, color: "var(--text-4)" }}>{_dayLbl(d.k, true)}</span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 600, color: "var(--text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.sum}</span>
              </button>
            ))}
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

/* GOAL DETAIL — LIVE. Progress ring, the habits it's built from (cross-linked into
   their own stats), a pace hint, and a +1 to nudge progress. Linked-habit streaks are
   ALWAYS the real bosStreak(h.log). Back returns to the origin tab (params.from). */
/* ЕДИНАЯ страница цели — ДИСПЕТЧЕР: params.team → командный режим, иначе личная цель.
   «Идти к цели вместе» обновляет параметры ЭТОГО ЖЕ экрана (same-route navigate = только
   params-refresh, БЕЗ перехода/анимации) → блок «Люди» вырастает НА МЕСТЕ (David: «переход
   на такую же страницу — грязный путь»). Диспетчер отдельным компонентом — чтобы наборы
   хуков личной и командной веток не смешивались при смене режима без ремаунта кадра. */
function GoalDetailLive() {
  const { params } = useNav();
  if (params && params.team && typeof TeamDetailLive === "function") return <TeamDetailLive />;
  return <GoalDetailPersonalLive />;
}

function GoalDetailPersonalLive() {
  const { navigate, params } = useNav();
  const app = (typeof useApp === "function") ? useApp() : null;
  const { open: openSheet } = (typeof useSheet === "function") ? useSheet() : { open: () => {} };
  const back = params?.from || "habits";
  const seed = params?.goal || { id: 0, emoji: "🎯", name: "Цель", current: 0, target: 1, unit: "", deadline: "" };
  const g = (app?.goals && app.goals.find((x) => x.id === seed.id)) || seed;
  const isDark = app?.themeOverride === "dark";
  const Count = (typeof CountUp !== "undefined") ? CountUp : ({ value }) => value;
  // Стиль целей: если включены ОРБИТЫ — hero детали = орбита (как в комнате круга), иначе кольцо
  // (David: «личная цель — кольцо, командная — орбиты; дай тумблер»). buddies = люди цели для орбиты.
  const gStyle = (typeof bosLoadGoalStyle === "function") ? bosLoadGoalStyle() : { orbits: false };
  const buddies = (typeof useBuddyMembersLive === "function") ? useBuddyMembersLive(g.shareCode) : null;

  // ЖИВЫЕ привычки = те, что видны на доске: без спрятанных (shelved «убрал со страницы») и без
  // архивных. Иначе цель показывает/считает то, чего в «Привычках» нет (David: «две прогулки в
  // привычках, четыре на орбите»). goalOnly («только внутри цели») ОСТАЮТСЯ — это и есть привычки
  // цели (на общей доске их прячут намеренно). Дедуп по id — на случай задвоенных записей.
  const _arch = (typeof useBosArchived === "function") ? useBosArchived() : null;
  const _liveHabits = (app?.habits || []).filter((h) => h && !h.shelved && !(typeof bosIsArch === "function" && bosIsArch(_arch, "h", h)));
  // Прогресс цели = из её привычек (если привязаны), иначе ручной current. Единый движок bosGoalProgress.
  const prog = (typeof bosGoalProgress === "function") ? bosGoalProgress(g, _liveHabits) : { pct: g.target ? Math.min(1, (g.current || 0) / g.target) : 0, current: g.current || 0, done: (g.current || 0) >= (g.target || 0), fromHabits: false };
  const cur = prog.current;
  const pct = prog.pct;
  const remaining = Math.max(0, (g.target || 0) - cur);
  const done = prog.done;
  const linked = (function () { var seen = {}, out = []; (_liveHabits || []).forEach(function (h) { if ((g.habitIds || []).indexOf(h.id) >= 0 && !seen[h.id]) { seen[h.id] = 1; out.push(h); } }); return out; })();
  // ── ДЕНЬ ЦЕЛИ ЗАКРЫТ → конфетти ─────────────────────────────────────────────
  // Своё событие, а не часть общего «дня»: привычка «только внутри цели» намеренно не попадает на
  // главную доску и в счёт дня, поэтому у того, кто ведёт привычки только в целях, общий салют не
  // случился бы никогда.
  // Празднуем только РОСТ до полного при открытом экране: иначе цель, закрытая утром с Главной,
  // салютовала бы при первом заходе сюда вечером — «конфетти из ниоткуда».
  const _goalDoneRef = React.useRef(null);
  const _goalDoneN = linked.filter((h) => h.done).length;
  React.useEffect(() => {
    const prev = _goalDoneRef.current;
    _goalDoneRef.current = _goalDoneN;
    if (prev == null) return;                                   // первый проход — только запоминаем
    if (_goalDoneN <= prev) return;                             // сняли галочку / ничего не изменилось
    if (!linked.length || _goalDoneN !== linked.length) return; // закрылось не всё
    if (typeof window.bosCelebrateScope !== "function") return;
    if (!window.bosCelebrateScope("goal:" + (app?.persistId || "") + ":" + (g.cloudId || g.id))) return;
    // «+30 идеальный день» — ТЕМ ЖЕ ключом дня, что и у главной доски (David: закрыл привычки в
    // цели — тоже получай +30). grantBonusXP идемпотентен по ключу, поэтому сколько бы досок ты
    // сегодня ни закрыл — цель, круг, главную — подарок ровно один. Фермить, заведя пять целей,
    // не выйдет: ключ один на день.
    if (app?.grantBonusXP && typeof bosTodayKey === "function") app.grantBonusXP("perfectday:" + bosTodayKey(), 30);
  }, [_goalDoneN, linked.length]);

  // ПУЛЬС: active = отметился сегодня → колечко «в деле» на лице.
  const _otk = (typeof bosTodayKey === "function") ? bosTodayKey() : null;
  const orbitPeople = (buddies || []).filter((m) => m && !m.me).map((m) => ({ avatar: m.avatar, name: m.name, active: !!(_otk && m.days && m.days[_otk]) }));
  const orbitsHero = gStyle.orbits && typeof GoalOrbitMini === "function";

  const card = isDark
    ? { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }
    : { background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" };
  const ringTrack = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.07)";
  const R = 54, CIRC = 2 * Math.PI * R;
  const goalColor = g.color || "#0a0a0a";  // goal fill = its chosen colour, default black (b&w base)

  // David: тот же hero-редизайн, что у ОБЩЕЙ цели (TeamDetailLive) — full-bleed шапка до самого
  // верха со скруглённым низом; инфа под орбитой = ЧИПЫ; ОПИСАНИЕ (g.desc) под именем; правка/
  // поделиться стеклом справа. aiChips = 1-2 честных наблюдения по темпу (заменяют блок «Подсказка»).
  const desc = g.desc || "";
  const aiChips = (function () {
    var out = [];
    if (done) { out.push("🎉 Цель достигнута"); return out; }
    if (pct >= 0.8) out.push("💪 финишная прямая");
    else if (pct >= 0.5) out.push("🚀 больше половины");
    else if (cur === 0) out.push("✨ первый шаг");
    else out.push("📈 в пути");
    if (linked[0]) out.push("🔥 двигатель: " + ("" + (linked[0].name || "")).split(" ")[0]);
    return out.slice(0, 2);
  })();
  const _hn = linked.length;
  const _habitWord = (_hn % 10 === 1 && _hn % 100 !== 11) ? "привычка" : ((_hn % 10 >= 2 && _hn % 10 <= 4 && (_hn % 100 < 12 || _hn % 100 > 14)) ? "привычки" : "привычек");
  const teamColor = (g.color && ("" + g.color).toLowerCase() !== "#0a0a0a" && g.color !== "#8E8E93" && g.color !== "#EAEAEF") ? g.color : null;
  const H = bosGoalHero(teamColor, isDark);
  const heroBtn = { width: 38, height: 38, borderRadius: "50%", border: 0, display: "grid", placeItems: "center", cursor: "pointer", background: H.btnBg, color: H.btnInk, flexShrink: 0 };
  const heroChip = { display: "inline-flex", alignItems: "center", gap: 4, background: H.chipBg, borderRadius: 999, padding: "5px 11px", fontSize: 12, fontWeight: 600, color: H.chipInk, whiteSpace: "nowrap" };
  const heroChipAI = Object.assign({}, heroChip, { background: H.chipAiBg, color: H.chipAiInk, boxShadow: H.onDark ? "none" : "0 1px 4px rgba(40,60,110,0.12)" });
  // Календарь личной цели (Stage 3 — единый календарь ВЕЗДЕ): люди=[Ты], доля = сколько привычек
  // цели закрыто в этот день / всего привязанных. Плюс сводки для свёрнутых секций аккордеона.
  const _cyP = new Date().getFullYear();
  const _dkP = (d, mi) => _cyP + "-" + String(mi + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
  const goalDayFrac = (pi, d, mi) => { if (!linked.length) return 0; const k = _dkP(d, mi); let n = 0; linked.forEach((h) => { if (h.log && h.log[k]) n++; }); return n / linked.length; };
  const _calPeople = [{ name: "Ты", you: true, color: goalColor, avatar: app?.avatar }];
  const _habitWordP = (n) => (n % 10 === 1 && n % 100 !== 11) ? "привычка" : ((n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? "привычки" : "привычек");
  // ДЕЛА цели (David: «Дела должны появиться в целях»): конкретные шаги к цели. Хранятся на самой
  // цели (g.tasks = [{id,text,done}]) и правятся через updateGoal → persist локально + облако.
  const _goalTasks = Array.isArray(g.tasks) ? g.tasks : [];
  const [newTask, setNewTask] = React.useState("");
  const _mkTaskId = () => (typeof _uuid === "function" ? _uuid() : "t-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7));
  const _saveTasks = (next) => { if (app && app.updateGoal) app.updateGoal(g.id, { tasks: next }); };
  const _addGoalTask = () => { const tx = newTask.trim(); if (!tx) return; _saveTasks(_goalTasks.concat([{ id: _mkTaskId(), text: tx, done: false }])); setNewTask(""); if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} } };
  const _toggleGoalTask = (id) => { _saveTasks(_goalTasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t))); if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} } };
  const _delGoalTask = (id) => { _saveTasks(_goalTasks.filter((t) => t.id !== id)); };
  const _tasksDone = _goalTasks.filter((t) => t.done).length;
  return (
    <div className="page-in" style={{ paddingBottom: 24 }}>
      {/* HERO — full-bleed до самого верха, снизу радиус 30 (как у общей цели/партнёра): правка+
          поделиться стеклом справа; орбита/кольцо, %, имя, ОПИСАНИЕ; инфа под орбитой = ЧИПЫ + от ИИ. */}
      <div style={{ position: "relative", background: H.bg,
          marginTop: "calc(-1 * max(60px, var(--tg-top-inset, env(safe-area-inset-top, 0px))))",
          padding: "calc(max(60px, var(--tg-top-inset, env(safe-area-inset-top, 0px))) + 10px) 18px 20px",
          borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => navigate(back)} className="tap" aria-label="Назад" style={heroBtn}><I.ChevronLeft size={20} strokeWidth={2.4} /></button>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => openSheet(<ShareGoalSheetLive goal={g} dark={isDark} />)} className="tap" data-haptic="selection" aria-label="Вести вместе" style={heroBtn}><I.Share size={16} strokeWidth={2} /></button>
            <button onClick={() => openSheet(<GoalFormSheetLive mode="edit" goal={g} navigate={navigate} returnTo={back} />)} className="tap" data-haptic="selection" aria-label="Настройки цели" style={heroBtn}><I.Pencil size={16} strokeWidth={2} /></button>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 4 }}>
          {orbitsHero ? (
            <div style={{ width: 172, height: 172, margin: "0 auto", display: "grid", placeItems: "center" }}>
              <GoalOrbitMini centerEmoji={g.emoji} centerColor={g.color} habits={linked.map((h) => ({ emoji: h.emoji, color: h.color, done: !!h.done }))} people={orbitPeople} size={172} dark={isDark} progress={pct} />
            </div>
          ) : (
            <div style={{ position: "relative", width: 150, height: 150, margin: "0 auto" }}>
              <svg width="150" height="150" viewBox="0 0 140 140" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="70" cy="70" r={R} fill="none" stroke={ringTrack} strokeWidth="13" />
                {pct > 0 && <circle cx="70" cy="70" r={R} fill="none" stroke={goalColor} strokeWidth="13" strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - pct)} style={{ transition: "stroke-dashoffset 0.6s ease", ...(done ? { filter: "drop-shadow(0 0 6px " + goalColor + "80)" } : {}) }} />}
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 36, lineHeight: 1 }}>{bosIcon(g.emoji, 34, g.color)}</div>
            </div>
          )}
          <div style={{ fontSize: 30, fontWeight: 800, marginTop: 8, letterSpacing: "-0.5px", color: H.ink }}><Count value={Math.round(pct * 100)} />%</div>
          <div style={{ fontSize: 21, fontWeight: 700, color: H.ink, marginTop: 5, letterSpacing: "-0.4px" }}>{g.name}</div>
          {/* Срок — ТИХОЙ строкой под именем (контекст «когда»), чтобы чипы ниже несли ТОЛЬКО метрики. */}
          {g.deadline ? <div style={{ fontSize: 12.5, fontWeight: 600, color: H.sub, marginTop: 4 }}>📅 до {(typeof bosFmtDeadline === "function") ? bosFmtDeadline(g.deadline) : g.deadline}</div> : null}
          {desc ? <div style={{ fontSize: 13, color: H.sub, marginTop: 7, lineHeight: 1.45, maxWidth: 300, marginLeft: "auto", marginRight: "auto" }}>{desc}</div> : null}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 6, marginTop: 14 }}>
          {g.target > 0 && <span style={heroChip}>🎯 {cur}/{g.target} {g.unit}</span>}
          {g.target > 0 && remaining > 0 && !done && <span style={heroChip}>⏳ осталось {remaining}</span>}
          {linked.length > 0 && <span style={heroChip}>🔁 {linked.length} {_habitWord}</span>}
          {aiChips.map((ch, i) => <span key={"ai" + i} style={heroChipAI}>{ch}</span>)}
        </div>
      </div>

      <div style={{ padding: "8px 16px 0" }}>

      {/* СКЛАДЫВАЕТСЯ ИЗ ПРИВЫЧЕК — цель ведут её привычки: отмечаешь ПРЯМО ТУТ (чек-кружок), кольцо
          растёт. Тап по имени → детали привычки. «+ Привычка для этой цели» заводит новую (можно
          «только внутри цели»). Пусто → мягкий призыв. Ручного «+1» больше нет (David: «нафига оно»). */}
      {/* ЕДИНЫЙ РАСКРЫВАЮЩИЙСЯ БЛОК: Привычки · Календарь (David — как у общей цели). */}
      <BosSectionsAccordionLive dark={isDark} defaultOpen="habits" sections={[
        {
          key: "habits", icon: <I.Flame size={17} color="var(--text-3)" />, title: "Привычки",
          summary: linked.length ? (linked.length + " " + _habitWordP(linked.length) + " · сегодня " + linked.filter((h) => h.done).length + " из " + linked.length) : "Добавь привычку — цель начнёт расти",
          render: () => (<>
        {linked.map((h, i) => (
          <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderTop: i ? "1px solid " + (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)") : 0 }}>
            {/* Аудит #5: count/timer-привычка внутри цели ведётся ТЕМ ЖЕ контролом, что на главной
                (счётчик/таймер), а не закрывается одним тапом. Простая привычка — прежний кружок. */}
            {(typeof HabitCountCheck === "function" && h.goalPerDay > 1) ? (
              <span onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}><HabitCountCheck habit={h} app={app} xp={10} /></span>
            ) : (typeof HabitTimerCheck === "function" && h.duration > 0) ? (
              <span onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}><HabitTimerCheck habit={h} app={app} xp={10} /></span>
            ) : (
            <button onClick={() => { if (app?.toggleHabit) app.toggleHabit(h.id); if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} } }} className="tap" aria-label="Отметить сегодня"
              style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, border: 0, display: "grid", placeItems: "center", cursor: "pointer",
                background: h.done ? (h.color || goalColor) : (isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)"),
                boxShadow: h.done ? "none" : "inset 0 0 0 0.7px " + (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)") }}>
              {h.done && <I.Check size={16} strokeWidth={3} color="#fff" />}
            </button>
            )}
            <button className="tap" onClick={() => navigate("habit-detail", { habit: h, from: "goal-detail" })} style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 12, padding: 0, background: "transparent", border: 0, textAlign: "left", color: "var(--text)" }}>
              <span style={{ width: 34, height: 34, borderRadius: 12, background: h.color ? h.color + "26" : (isDark ? "rgba(255,255,255,0.06)" : "var(--surface-3)"), display: "grid", placeItems: "center", fontSize: 17, flexShrink: 0 }}>{bosIcon(h.emoji, 18, h.color)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, color: "var(--text)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.name}{h.goalOnly && <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-4)", marginLeft: 7 }}>· в цели</span>}</div>
                <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 1 }}>🔥 {(typeof bosStreak === "function") ? bosStreak(h.log, h.days) : (h.streak || 0)}д серия</div>
              </div>
              <I.ChevronRight size={16} color="var(--text-4)" />
            </button>
          </div>
        ))}
        {linked.length === 0 && (
          <div style={{ padding: "14px 14px 2px", fontSize: 13, color: "var(--text-4)", lineHeight: 1.5 }}>Цель наполняют привычки, ведущие к ней. Добавь первую — и кольцо начнёт расти само.</div>
        )}
        <button className="tap" onClick={() => openSheet(<HabitFormSheetLive mode="create" goalFor={{ id: g.id, name: g.name }} navigate={navigate} />)}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderTop: linked.length ? "1px solid " + (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)") : 0, background: "transparent", border: 0, color: "var(--text-2)", cursor: "pointer" }}>
          <span style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", border: "1.5px dashed " + (isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.18)") }}><I.Plus size={15} strokeWidth={2.4} color={isDark ? "#fff" : "var(--text-2)"} /></span>
          <span style={{ fontSize: 14.5, fontWeight: 600 }}>Привычка для этой цели</span>
        </button>
          </>),
        },
        {
          key: "tasks", icon: <I.Check size={17} color="var(--text-3)" />, title: "Дела",
          summary: _goalTasks.length ? (_tasksDone + " из " + _goalTasks.length + " сделано") : "Разбей цель на конкретные шаги",
          render: () => (<>
            {_goalTasks.map((t, i) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderTop: i ? "1px solid " + (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)") : 0 }}>
                <button onClick={() => _toggleGoalTask(t.id)} className={"check-btn" + (t.done ? "" : " unchecked")} aria-label={t.done ? "Снять отметку" : "Отметить сделанным"}
                  style={{ width: 26, height: 26, flexShrink: 0, cursor: "pointer", ...(t.done ? { "--check-color": (g.color || "#0a0a0a") } : {}) }}>
                  {t.done && <I.Check size={14} strokeWidth={3} color="#fff" />}
                </button>
                <span style={{ flex: 1, minWidth: 0, fontSize: 15, color: t.done ? "var(--text-4)" : "var(--text)", textDecoration: t.done ? "line-through" : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.text}</span>
                <button onClick={() => _delGoalTask(t.id)} className="tap" aria-label="Удалить дело" style={{ flexShrink: 0, width: 28, height: 28, borderRadius: "50%", border: 0, background: "transparent", color: "var(--text-5)", cursor: "pointer", display: "grid", placeItems: "center" }}><I.X size={15} /></button>
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderTop: _goalTasks.length ? "1px solid " + (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)") : 0 }}>
              <span style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", border: "1.5px dashed " + (isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.18)") }}><I.Plus size={14} strokeWidth={2.4} color={isDark ? "#fff" : "var(--text-2)"} /></span>
              <input value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); _addGoalTask(); } }} placeholder="Добавить дело…"
                style={{ flex: 1, minWidth: 0, background: "transparent", border: 0, outline: 0, fontSize: 15, color: "var(--text)", fontFamily: "inherit" }} />
              {newTask.trim() && <button onClick={_addGoalTask} className="tap" style={{ flexShrink: 0, border: 0, background: g.color || "#0a0a0a", color: "#fff", borderRadius: 999, padding: "6px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Добавить</button>}
            </div>
          </>),
        },
        {
          key: "calendar", icon: <I.Calendar size={17} color="var(--text-3)" />, title: "Календарь",
          summary: linked.length ? "Дни, когда двигал цель" : "Появится с первой привычкой",
          render: () => (linked.length
            ? <div style={{ padding: "10px 12px 12px" }}><PeopleMonthCalendarLive bare label="" people={_calPeople} dayFrac={goalDayFrac} /></div>
            : <div style={{ fontSize: 13, color: "var(--text-4)", padding: 14, lineHeight: 1.5 }}>Заведи привычку для цели — и здесь появится карта отметок по дням.</div>),
        },
      ]} />

      {/* ИДТИ К ЦЕЛИ ВМЕСТЕ — БЕЗ шторок и подтверждений (David: «просто должен появиться блок
          с людьми, ничего в лицо не пихаем»): тап → цель тихо становится общей, остаёшься на
          ТОЙ ЖЕ (единой) странице, где вырос блок «Люди» с «Позвать людей». Захочет настроить
          режим/ставку — сам зайдёт в карандашик. */}
      <button className="tap" onClick={() => {
        if (typeof bosPromoteGoalToCircle === "function") bosPromoteGoalToCircle(app, g, { navigate, from: back, route: "goal-detail" });
        if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} }
      }}
        style={{ ...card, borderRadius: 22, padding: 14, marginTop: 22, width: "100%", display: "flex", alignItems: "center", gap: 12, border: 0, textAlign: "left", cursor: "pointer", color: "var(--text)" }}>
        <span style={{ width: 38, height: 38, borderRadius: 13, background: g.color ? g.color + "22" : (isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)"), display: "grid", placeItems: "center", flexShrink: 0 }}><I.Users size={19} color={g.color || (isDark ? "#fff" : "#0a0a0a")} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Идти к цели вместе</div>
          <div style={{ fontSize: 12.5, color: "var(--text-4)", marginTop: 1, lineHeight: 1.4 }}>Позвать людей — поведёте цель вместе.</div>
        </div>
        <I.ChevronRight size={17} color="var(--text-4)" />
      </button>

      {/* «Подсказка» свернулась в чипы «от ИИ» в hero-шапке (David-редизайн, как у общей цели). */}

      {/* Достигнута → статичная плашка. Иначе действий тут нет — цель ведут привычки выше. */}
      {done && (
        <button className="bos-btn" style={{ marginTop: 22, background: isDark ? "rgba(255,255,255,0.1)" : "var(--surface-3)", color: "var(--text-2)" }}>✓ Цель достигнута</button>
      )}
      </div>
    </div>
  );
}

/* СОСТОЯНИЕ — LIVE. Отметка = маленькая ШТОРКА StateSheetLive (David live-фидбек: не полноэкранная
   страница). Route "mood" (тап виджета / вход из ИИ) открывает шторку поверх главной; всплывает и
   сама раз в день к вечеру (home_live evening-prompt). */
function MoodLive() {
  const { navigate } = useNav();
  const sheet = (typeof useSheet === "function") ? useSheet() : null;
  React.useEffect(() => {
    navigate("home");
    setTimeout(() => { if (sheet && sheet.open && typeof StateSheetLive === "function") sheet.open(<StateSheetLive navigate={navigate} />); }, 40);
  }, []);
  return null;
}

/* JOURNAL / DAILY REFLECTION — LIVE. Real past notes from app.dayNotes (newest first),
   the real header date from the user's clock, and the honest live save (+10 XP only
   when there's text). Drops the frozen demo showcase entries entirely. */
function JournalLive() {
  const { navigate } = useNav();
  const app = (typeof useApp === "function") ? useApp() : null;
  const [a, setA] = useM(""); const [b, setB] = useM(""); const [c, setC] = useM("");

  // REAL past notes from app.dayNotes (any day with a written note or tags), newest
  // first; honest empty state when there are none.
  const livePast = (() => {
    const notes = (app && app.dayNotes) || {};
    return Object.keys(notes)
      .map((k) => ({ key: k, e: notes[k] }))
      .filter(({ e }) => e && ((e.note != null && ("" + e.note).trim()) || (e.tags && e.tags.length)))
      .sort((x, y) => ("" + y.key).localeCompare("" + x.key))
      .map(({ key, e }) => ({ date: journalDateLabel(key), text: ("" + (e.note || "")).trim(), tags: e.tags || [] }));
  })();

  // Header date from the user's real clock.
  const todayKey = (typeof bosTodayKey === "function") ? bosTodayKey() : "";
  const WDAYS = ["Воскресенье","Понедельник","Вторник","Среда","Четверг","Пятница","Суббота"];
  const liveHeader = (() => { try { const d = new Date(); return journalDateLabel(bosTodayKey(d)) + " · " + WDAYS[d.getDay()]; } catch (e) { return ""; } })();

  // Persist into dayNotes[todayKey] as {tags, note} — the SAME shape the XP formula
  // rewards (+10/day for a journal note) and the calendar reads. Keep any tags a mood
  // check-in already logged today, so we don't wipe them.
  const liveSave = () => {
    if (!app || !app.setDayNotes || !todayKey) return navigate("home");
    const parts = [];
    if (a.trim()) parts.push("Хорошо: " + a.trim());
    if (b.trim()) parts.push("Помешало: " + b.trim());
    if (c.trim()) parts.push("Завтра: " + c.trim());
    const note = parts.join("\n");
    if (note) {
      const prev = (app.dayNotes && app.dayNotes[todayKey]) || {};
      app.setDayNotes({ ...(app.dayNotes || {}), [todayKey]: { tags: prev.tags || [], note } });
    }
    navigate("home");
  };

  const hasText = a.trim() || b.trim() || c.trim();
  // Honest XP: a journal note awards +10 XP/day (mood check-in is a separate +5). Only
  // promise XP once there's something to save — an empty save earns nothing.
  const saveLabel = hasText ? "Сохранить · +10 XP" : "Сохранить";
  const past = livePast;

  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title="Ежедневная рефлексия" onBack={() => navigate("home")} />
      <div style={{ background: "#fff", borderRadius: 22, padding: 18, boxShadow: "var(--card-shadow)" }}>
        <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1.4, fontWeight: 600 }}>{liveHeader}</div>
        <div className="section-label" style={{ marginTop: 16, color: "var(--text-2)" }}>Что прошло хорошо?</div>
        <textarea value={a} onChange={e=>setA(e.target.value)} placeholder="Максимум три строки."
          style={{ width: "100%", background: "var(--surface-3)", border: 0, borderRadius: 14, padding: 12, marginTop: 8, fontSize: 14, fontFamily: "inherit", outline: 0, minHeight: 70, resize: "none" }}/>
        <div className="section-label" style={{ marginTop: 16, color: "var(--text-2)" }}>Что помешало?</div>
        <textarea value={b} onChange={e=>setB(e.target.value)} placeholder="Одно честное предложение."
          style={{ width: "100%", background: "var(--surface-3)", border: 0, borderRadius: 14, padding: 12, marginTop: 8, fontSize: 14, fontFamily: "inherit", outline: 0, minHeight: 70, resize: "none" }}/>
        <div className="section-label" style={{ marginTop: 16, color: "var(--text-2)" }}>Одна вещь на завтра</div>
        <textarea value={c} onChange={e=>setC(e.target.value)} placeholder="Чем меньше, тем лучше."
          style={{ width: "100%", background: "var(--surface-3)", border: 0, borderRadius: 14, padding: 12, marginTop: 8, fontSize: 14, fontFamily: "inherit", outline: 0, minHeight: 70, resize: "none" }}/>
      </div>
      <button className="bos-btn" style={{ marginTop: 16 }} onClick={() => liveSave()}>{saveLabel}</button>
      <div className="section-label" style={{ marginTop: 22 }}>Прошлые записи</div>
      {past.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 14, padding: 18, marginTop: 8, boxShadow: "var(--card-shadow)", fontSize: 14, color: "var(--text-4)", textAlign: "center", lineHeight: 1.5 }}>
          Пока нет записей — первая появится здесь.
        </div>
      ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        {past.map((p, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 14, padding: 14, boxShadow: "var(--card-shadow)" }}>
            <div style={{ fontSize: 12, color: "var(--text)", fontWeight: 600 }}>{p.date}</div>
            {p.text && <div style={{ fontSize: 14, marginTop: 6, color: "var(--text-2)", whiteSpace: "pre-line", lineHeight: 1.45 }}>{p.text}</div>}
            {p.tags && p.tags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: p.text ? 8 : 6 }}>
                {p.tags.map((tg, j) => (
                  <span key={j} style={{ fontSize: 12, color: "var(--text-3)", background: "var(--surface-3)", borderRadius: 999, padding: "3px 9px" }}>#{("" + tg).replace(/_/g, " ")}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      )}
    </div>
  );
}

/* AI CHAT — LIVE. The real conversational coach: every reply goes through the proxy
   (aiReply → aiRaw → Edge Function), action-cards are parsed out via bosParseAction,
   and AI_LIVE_FALLBACK is the honest "try again" when the model returns nothing. The
   live chat persists on-device (private). Drops the scripted demo seed + demo time. */
function AIChatLive() {
  const { navigate, params } = useNav();
  const { open: openSheet } = (typeof useSheet === "function") ? useSheet() : { open: () => {} };
  const app = (typeof useApp === "function") ? useApp() : null;
  // The mentor's avatar = the orb of your CURRENT state (mood-tinted). Your own
  // avatar sits up top (it's your conversation). Your messages carry no avatar.
  // Честный ноль: орб ментора красится СЕГОДНЯШНЕЙ отметкой; без отметки — нейтральный.
  const _tkCh = (typeof bosTodayKey === "function") ? bosTodayKey() : "";
  const _bCh = app && app.dayMoods ? app.dayMoods[_tkCh] : null;
  const _mCh = (_bCh != null && typeof bosStateResolve === "function") ? bosStateResolve(_bCh) : null;
  const stateTint = (typeof tintFromMood === "function") ? tintFromMood(_mCh ? _mCh.c : null) : null;
  // A real, personal opener: time-of-day greeting + the user's name.
  const _name = (app?.userName || "").trim();
  const _hr = (function () { try { return new Date().getHours(); } catch (e) { return 12; } })();
  const _greet = _hr < 5 ? "Доброй ночи" : _hr < 12 ? "Доброе утро" : _hr < 18 ? "Добрый день" : _hr < 23 ? "Добрый вечер" : "Доброй ночи";
  // The chat date divider — the user's REAL current time, never a hard-coded string.
  const _dateLabel = (function () {
    try { const d = new Date(); const mm = d.getMinutes(); return "Сегодня · " + d.getHours() + ":" + (mm < 10 ? "0" + mm : mm); }
    catch (e) { return "Сегодня"; }
  })();
  const _hello = _greet + (_name ? ", " + _name : "") + ". Я рядом. Расскажи, как ты сейчас или что на уме — и начнём с одного маленького шага.";
  // Resolve current theme from the iOS frame wrapper so this screen looks
  // right under both .theme-light and .theme-dark.
  const wrapRef = React.useRef(null);
  const [isDark, setIsDark] = useM(false);
  React.useEffect(() => {
    const el = wrapRef.current; if (!el) return;
    let n = el.parentElement;
    while (n && !n.classList.contains("theme-light") && !n.classList.contains("theme-dark")) n = n.parentElement;
    setIsDark(!!(n && n.classList.contains("theme-dark")));
  }, []);

  // Theme tokens for chat bubbles & chrome
  const TH = isDark ? {
    bg: "#0a0a0a",
    text: "#fff", muted: "rgba(255,255,255,0.5)", dim: "rgba(255,255,255,0.35)",
    border: "transparent",
    aiBubble: "rgba(255,255,255,0.06)", aiBubbleBorder: "0",
    aiCard: "rgba(255,255,255,0.06)", aiCardBorder: "0",
    cardDivider: "1px solid rgba(255,255,255,0.08)",
    chip: "rgba(255,255,255,0.06)", chipBorder: "0",
    composer: "rgba(255,255,255,0.08)", composerBorder: "0",
    iconBtn: "rgba(255,255,255,0.06)", iconBtnBorder: "0",
    skipBg: "rgba(255,255,255,0.06)", skipBorder: "0",
    typingDot: "rgba(255,255,255,0.7)",
    accentBg: "rgba(255,255,255,0.06)", insightBg: "rgba(255,255,255,0.06)",
    statValue: "#fff",
    primary: "#fff", primaryFg: "#0a0a0a",
    meBubble: "#0a0a0a", meText: "#fff",
    bubbleShadow: "none",
  } : {
    // Цветогамма приложения (David): лёгкий СЕРЫЙ фон страницы + БЕЛЫЕ «стеклянные»
    // пузыри с мягкой тенью вместо обводок — как карточки на остальных экранах.
    bg: "var(--bg, #f2f2f4)",
    text: "var(--text)", muted: "var(--text-4)", dim: "var(--text-5)",
    border: "var(--line)",
    aiBubble: "#fff", aiBubbleBorder: "0",
    aiCard: "#fff", aiCardBorder: "0",
    cardDivider: "1px solid var(--line)",
    chip: "#fff", chipBorder: "0",
    composer: "#fff", composerBorder: "0",
    iconBtn: "#fff", iconBtnBorder: "1px solid var(--line)",
    skipBg: "var(--surface-3)", skipBorder: 0,
    typingDot: "rgba(0,0,0,0.45)",
    accentBg: "var(--surface-3)", insightBg: "var(--surface-3)",
    statValue: "var(--text)",
    primary: "#0a0a0a", primaryFg: "#fff",
    meBubble: "#0a0a0a", meText: "#fff",
    bubbleShadow: "var(--card-shadow)",
  };

  // Each message: { who, kind, t, ...cardData }. Live chats persist LOCALLY on the
  // device (private — never leaves the phone), so a real user never loses them.
  const _aiChatKey = "bos:aichat:" + (app?.persistId || "live");
  const [msgs, setMsgs] = useM(function () { try { var raw = localStorage.getItem(_aiChatKey); if (raw) { var arr = JSON.parse(raw); if (arr && arr.length) return arr; } } catch (e) {} return [{ who: "ai", kind: "greeting", t: _hello }]; });
  const [draft, setDraft] = useM("");
  const [typing, setTyping] = useM(false);
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs, typing]);

  // Persist the live AI chat locally so it survives reloads & reopening (on-device, private).
  React.useEffect(() => { try { localStorage.setItem(_aiChatKey, JSON.stringify(msgs)); } catch (e) {} }, [msgs, _aiChatKey]);

  // Split a reply on blank lines into separate human-feeling bubbles, then drop them
  // in one after another with a small stagger (a real person texts in bursts, not one
  // wall). Single-paragraph replies stay a single bubble. Caps at 4 to avoid spam.
  // Returns the ms after which the last bubble lands, so a follow-up action card can
  // be dropped in right after the text (not in the middle of a multi-part reply).
  const appendReply = (reply) => {
    const parts = ("" + reply).split(/\n{2,}/).map((s) => s.trim()).filter(Boolean).slice(0, 4);
    if (parts.length <= 1) { setMsgs((m) => [...m, { who: "ai", kind: "text", t: parts[0] || ("" + reply).trim() }]); return 0; }
    setMsgs((m) => [...m, { who: "ai", kind: "text", t: parts[0] }]);
    parts.slice(1).forEach((p, k) => { window.setTimeout(() => setMsgs((m) => [...m, { who: "ai", kind: "text", t: p }]), (k + 1) * 520); });
    return (parts.length - 1) * 520;
  };

  const send = (text) => {
    if (typing) return;
    const t = (text ?? draft).trim();
    if (!t) return;
    const history = [...msgs, { who: "me", t }];
    setMsgs(history);
    setDraft("");
    setTyping(true);
    aiReplyLive(history, buildAiContextLive(app))
      .then((reply) => {
        setTyping(false);
        const parsed = bosParseAction(reply);
        const body = (parsed.text && parsed.text.trim()) ? parsed.text : (parsed.action ? "" : (reply || AI_LIVE_FALLBACK));
        const after = body ? appendReply(body) : 0;
        if (parsed.action) window.setTimeout(() => setMsgs((m) => [...m, { who: "ai", kind: "actioncard", action: parsed.action, aid: bosAid() }]), after + 360);
      })
      .catch(() => { setTyping(false); setMsgs(m => [...m, { who: "ai", kind: "text", t: AI_LIVE_FALLBACK }]); });
  };

  // Tap a suggestion pill. New contract: kind:"action" → open a real screen (route +
  // params); kind:"chat" → seed the conversation. Legacy {i,t} pills (heuristic chips)
  // have no kind → treated as chat, sending their text.
  const tapPill = (p) => {
    if (p && p.kind === "action" && p.route) { navigate(p.route, p.params || {}); return; }
    send((p && (p.prompt || p.t)) || "");
  };

  // A priming prompt (from a quick pill / profile / the AI hub) auto-sends ONCE when the
  // chat opens, then is CONSUMED so it can never replay. Only the top frame stays mounted,
  // so leaving the chat (tap an action card → mood / journal / habit-settings) and coming
  // BACK re-mounts this screen; without consuming, the same prompt would re-fire on every
  // re-entry and duplicate the message (the canvas-swap-bug family — a mount/effect race).
  // We strip it from THIS frame's params immediately — navigating to the current route just
  // refreshes its params (no transition, no remount) — so any later mount sees no prompt.
  // The thread is already restored from localStorage, so returning shows the real
  // conversation instead of replaying the opener.
  React.useEffect(() => {
    const primer = params && params.prompt;
    if (!primer) return;
    navigate("ai-chat", {});                 // consume: the priming prompt fires exactly once
    const t = window.setTimeout(() => send(primer), 350);
    return () => window.clearTimeout(t);
  }, []); // eslint-disable-line

  const renderAI = (m, i) => {
    if (m.kind === "greeting") {
      return (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-end", animation: "msgIn 0.4s ease both" }}>
          <PlanetOrb size={28} tint={stateTint} />
          <div style={{ background: TH.aiBubble, border: TH.aiBubbleBorder, boxShadow: TH.bubbleShadow, borderRadius: 22, borderBottomLeftRadius: 4, padding: "10px 14px", fontSize: 14, color: TH.text }}>{m.t}</div>
        </div>
      );
    }
    if (m.kind === "text") {
      return (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-end", animation: "msgIn 0.4s ease both" }}>
          <PlanetOrb size={28} tint={stateTint} />
          <div style={{ maxWidth: "78%", background: TH.aiBubble, border: TH.aiBubbleBorder, boxShadow: TH.bubbleShadow, borderRadius: 22, borderBottomLeftRadius: 4, padding: "10px 14px", fontSize: 14, color: TH.text, lineHeight: 1.45 }}>{m.t}</div>
        </div>
      );
    }
    if (m.kind === "actioncard") {
      const a = m.action || {};
      if (a.type === "open") {
        return (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", animation: "msgIn 0.4s ease both" }}>
            <PlanetOrb size={28} tint={stateTint} />
            <button className="tap" onClick={() => navigate(a.route)} style={{ flex: 1, maxWidth: "85%", textAlign: "left", background: TH.aiCard, border: TH.aiCardBorder, boxShadow: TH.bubbleShadow, borderRadius: 22, borderTopLeftRadius: 4, padding: "13px 16px", color: TH.text, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{a.label || "Открыть"}</span>
              <span style={{ fontSize: 17, color: TH.muted }}>→</span>
            </button>
          </div>
        );
      }
      return (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", animation: "msgIn 0.4s ease both" }}>
          <PlanetOrb size={28} tint={stateTint} />
          <div style={{ flex: 1, maxWidth: "85%", background: TH.aiCard, border: TH.aiCardBorder, boxShadow: TH.bubbleShadow, borderRadius: 22, borderTopLeftRadius: 4, padding: 14, color: TH.text }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 40, height: 40, borderRadius: 14, background: a.color ? a.color + "26" : "var(--surface-3)", display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0 }}>{a.emoji || "✨"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10.5, letterSpacing: 1.2, textTransform: "uppercase", color: TH.muted, fontWeight: 600 }}>Новая привычка</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: TH.text, letterSpacing: "-0.3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</div>
              </div>
            </div>
            {a.time && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 11, background: TH.accentBg, borderRadius: 999, padding: "5px 11px", fontSize: 12.5, color: TH.text }}>⏰ напоминание в {a.time}</div>
            )}
            {a.why && <div style={{ fontSize: 13, lineHeight: 1.5, marginTop: 10, color: TH.muted }}>{a.why}</div>}
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button className="tap" onClick={() => openSheet(<HabitFormSheetLive mode="create" preset={{ i: a.emoji || "✨", t: a.name, color: a.color || null, time: a.time || null }} navigate={navigate} />)} style={{ flex: 1, background: TH.primary, color: TH.primaryFg, border: 0, borderRadius: 14, padding: "11px 14px", fontSize: 14, fontWeight: 600 }}>Создать привычку</button>
              <button className="tap" data-no-haptic onClick={() => setMsgs((mm) => mm.filter((x) => x.aid !== m.aid))} style={{ background: TH.skipBg, color: TH.text, border: TH.skipBorder, borderRadius: 14, padding: "11px 14px", fontSize: 14 }}>Не сейчас</button>
            </div>
          </div>
        </div>
      );
    }
    // Rich AI cards (summary / suggestion / insight) — kept for any persisted message of
    // that shape; live replies are plain text + action-cards, but this keeps old/loaded
    // transcripts rendering correctly.
    return (
      <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", animation: "msgIn 0.4s ease both" }}>
        <PlanetOrb size={28} tint={stateTint} />
        <div style={{
          flex: 1, background: TH.aiCard, border: TH.aiCardBorder, boxShadow: TH.bubbleShadow,
          borderRadius: 22, borderTopLeftRadius: 4,
          padding: 14, color: TH.text, maxWidth: "85%",
          backdropFilter: "blur(20px)",
        }}>
          {m.kind === "summary" && (
            <>
              <div style={{ fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: TH.muted, fontWeight: 600 }}>{m.title}</div>
              <div style={{ fontSize: 14, lineHeight: 1.5, marginTop: 6 }}>{m.body}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginTop: 12, paddingTop: 10, borderTop: TH.cardDivider }}>
                {m.stats.map((s, j) => (
                  <div key={j} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 600, color: TH.statValue, letterSpacing: "-0.3px" }}>{s.v}</div>
                    <div style={{ fontSize: 10, color: TH.muted, letterSpacing: 0.5 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </>
          )}
          {m.kind === "suggestion" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 24, height: 24, borderRadius: 8, background: TH.accentBg, display: "grid", placeItems: "center", fontSize: 14 }}>💡</span>
                <div style={{ fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: TH.muted, fontWeight: 600 }}>{m.title}</div>
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.5, marginTop: 8 }}>{m.body}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button className="tap" onClick={() => navigate("habits")} style={{ flex: 1, background: TH.primary, color: TH.primaryFg, border: 0, borderRadius: 14, padding: "10px 14px", fontSize: 13, fontWeight: 600 }}>{m.action.label}</button>
                <button className="tap" style={{ background: TH.skipBg, color: TH.text, border: TH.skipBorder, borderRadius: 14, padding: "10px 14px", fontSize: 13 }}>Пропустить</button>
              </div>
            </>
          )}
          {m.kind === "insight" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 24, height: 24, borderRadius: 8, background: TH.insightBg, display: "grid", placeItems: "center", fontSize: 14 }}>📊</span>
                <div style={{ fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: TH.muted, fontWeight: 600 }}>{m.title}</div>
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.5, marginTop: 8 }}>{m.body}</div>
              <MiniBars data={m.chart} color={TH.text} textMuted={TH.muted} barIdle={isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.10)"} />
              <button className="tap" style={{ width: "100%", marginTop: 10, background: TH.skipBg, color: TH.text, border: TH.skipBorder, borderRadius: 14, padding: "10px 14px", fontSize: 13, fontWeight: 500 }}>Перенести понедельники →</button>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderMe = (m, i) => (
    <div key={i} style={{ alignSelf: "flex-end", maxWidth: "78%", animation: "msgIn 0.4s ease both" }}>
      <div style={{ background: TH.meBubble, color: TH.meText, borderRadius: 22, borderBottomRightRadius: 4, padding: "10px 14px", fontSize: 14, lineHeight: 1.45, fontWeight: 500 }}>{m.t}</div>
    </div>
  );

  return (
    <div ref={wrapRef} className="page-in" style={{ height: "calc(100% + 90px)", margin: "-60px 0 -30px", color: TH.text, display: "flex", flexDirection: "column", background: TH.bg }}>
      {/* No in-app back control. Inside Telegram the native Back button shows on every
          pushed Mini-App screen (app.jsx wires tgBackButton → goBack), so an in-screen
          chevron would just DUPLICATE it. We keep a quiet top inset so the first message
          clears the status bar / Telegram header — the conversation itself is the header. */}
      <div style={{ height: 54, flexShrink: 0 }} />

      <div ref={scrollRef} className="screen-scroll" style={{ flex: 1, padding: "16px 14px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ alignSelf: "center", fontSize: 10, letterSpacing: 1.5, color: TH.dim, textTransform: "uppercase" }}>{_dateLabel}</div>

        {msgs.map((m, i) => m.who === "ai" ? renderAI(m, i) : renderMe(m, i))}

        {typing && (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end", animation: "msgIn 0.4s ease both" }}>
            <PlanetOrb size={28} tint={stateTint} />
            <div style={{ background: TH.aiBubble, border: TH.aiBubbleBorder, boxShadow: TH.bubbleShadow, borderRadius: 22, borderBottomLeftRadius: 4, padding: "12px 14px", display: "flex", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: TH.typingDot, animation: "typingDot 1.2s 0s ease-in-out infinite" }}/>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: TH.typingDot, animation: "typingDot 1.2s 0.2s ease-in-out infinite" }}/>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: TH.typingDot, animation: "typingDot 1.2s 0.4s ease-in-out infinite" }}/>
            </div>
          </div>
        )}
      </div>

      {/* Quick prompts — the AI login-brief pills (personal) when present, otherwise the
          context-aware heuristic set. Микс гарантирован: 1-2 действия + 1-2 разговора. */}
      <div className="bos-hscroll" style={{ padding: "2px 14px 8px", display: "flex", gap: 6, overflowX: "auto" }}>
        {(function () {
          const raw = (app && app.aiBrief && Array.isArray(app.aiBrief.pills) && app.aiBrief.pills.length) ? app.aiBrief.pills.slice(0, 4) : buildQuickPrompts(app);
          return (typeof bosMixPillsLive === "function") ? bosMixPillsLive(raw, app) : raw;
        })().map((s, i) => (
          <button key={i} onClick={() => tapPill(s)} className="tap" data-no-haptic style={{ flexShrink: 0, background: TH.chip, border: TH.chipBorder, boxShadow: TH.bubbleShadow, borderRadius: 999, padding: "8px 14px", fontSize: 12, color: TH.text, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ display: "inline-flex", flexShrink: 0 }}>{typeof bosPillGlyphLive === "function" ? bosPillGlyphLive(s, { size: 15, color: TH.text }) : s.i}</span> {s.label || s.t}
          </button>
        ))}
      </div>

      {/* Composer — flush, no border line */}
      <div style={{ padding: "10px 14px 16px", display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ flex: 1, background: TH.composer, border: TH.composerBorder, boxShadow: TH.bubbleShadow, borderRadius: 999, padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
          <input value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Напиши сообщение…" style={{ flex: 1, border: 0, outline: 0, background: "transparent", color: TH.text, fontSize: 16 }}/>
        </div>
        <button onClick={() => send()} className="tap" style={{ width: 44, height: 44, borderRadius: "50%", background: TH.primary, border: 0, display: "grid", placeItems: "center" }}>
          <I.Send size={16} color={TH.primaryFg}/>
        </button>
      </div>

      <style>{`
        @keyframes msgIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes typingDot {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-3px); }
        }
      `}</style>
    </div>
  );
}

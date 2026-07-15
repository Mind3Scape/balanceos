/* HABIT DETAIL — LIVE. Real per-habit statistics from the check-in log (h.log =
   {dateKey:true}). Opened by tapping a habit on Home/Habits. Numbers derive from the
   real log so they never flicker; "Изменить" opens the edit form; Back returns to the
   exact tab we came from (params.from). */
function HabitDetailLive() {
  const { navigate, params } = useNav();
  const app = (typeof useApp === "function") ? useApp() : null;
  const { open: openSheet } = (typeof useSheet === "function") ? useSheet() : { open: () => {} };
  const back = params?.from || "habits";
  const seed = params?.habit || { id: 0, emoji: "🏃🏼‍♀️", name: "Утренняя пробежка", streak: 12 };
  // Live copy from the shared store so streak / done reflect taps made elsewhere.
  const h = (app?.habits && app.habits.find((x) => x.id === seed.id)) || seed;
  const isDark = app?.themeOverride === "dark";
  const Count = (typeof CountUp !== "undefined") ? CountUp : ({ value }) => value;

  // Real stats from the check-in log (h.log = {dateKey:true}).
  const _log = h.log || {};
  const _logDays = Object.keys(_log).filter((k) => _log[k] && /^\d{4}-\d{2}-\d{2}$/.test(k)).sort();
  // Дни недели: разрыв между отметками не рвёт «Лучшую», если ВСЕ дни в разрыве — чужие
  // (не из расписания привычки). Маска null = каждый день → прежнее поведение.
  const _mask = (typeof bosDaysMask === "function") ? bosDaysMask(h.days) : null;
  const _gapIsRest = (a, diff) => { if (!_mask) return false; for (let dd = 1; dd < diff; dd++) { const t = new Date(a); t.setDate(t.getDate() + dd); if (_mask[(t.getDay() + 6) % 7]) return false; } return true; };
  const _bestRun = (days) => { if (!days.length) return 0; let b = 1, c = 1; for (let i = 1; i < days.length; i++) { const a = new Date(days[i - 1] + "T00:00:00"); const diff = Math.round((new Date(days[i] + "T00:00:00") - a) / 86400000); if (diff === 1 || (diff > 1 && _gapIsRest(a, diff))) { c++; if (c > b) b = c; } else if (diff > 1) c = 1; } return b; };
  const streak = (typeof bosStreak === "function") ? bosStreak(_log, h.days) : (h.streak || 0);
  const best   = Math.max(streak, _bestRun(_logDays));
  const total  = _logDays.length;

  // Neutral by default (cohesive with the gray tiles outside); the habit's own
  // colour only if the user picked one — it tints the tile and fills the grid.
  const _hc = (typeof bosCanonColor === "function") ? bosCanonColor(h.color) : h.color;
  const _hcNeutral = !_hc || _hc === "#0a0a0a" || ("" + _hc).toLowerCase() === "#8e8e93";
  const tileBg  = _hcNeutral ? (isDark ? "rgba(255,255,255,0.06)" : "var(--surface-3)") : (_hc + "20");

  // SHARED habit (buddy): pull BOTH members' real day-maps so the month calendar AND the
  // «Вместе» card show WHO did WHICH day, each in their own colour-coded track (David:
  // «на календаре у кого какой день»). Solo habit → just you. Light poll so a friend's
  // fresh mark turns up. The SAME PeopleMonthCalendar the team uses → one consistent look.
  // Cache-backed (stale-while-revalidate): seeds from the last-known members instantly, so the
  // «Вместе» card + month calendar don't flash/jump on every enter/exit (David: «мигания»).
  const buddies = useBuddyMembersLive(h.shareCode);
  const _shared = !!(buddies && buddies.length > 1);
  const _calYear = new Date().getFullYear();
  const _calKey = (d, mi) => _calYear + "-" + String(mi + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
  const calPeople = _shared
    ? buddies.map((m) => ({ name: m.me ? "Ты" : m.name, initials: m.me ? "Я" : ((m.name || "Д").charAt(0).toUpperCase()), color: _hc || "#0a0a0a", you: !!m.me, avatar: m.avatar }))
    : [{ name: "Ты", initials: "Я", color: _hc || "#0a0a0a", you: true }];
  // For a SHARED habit, YOUR row reads the PERSONAL log (h.log) — the complete source of truth for
  // your own check-ins — while buddies read the cloud shared log. Without this YOUR calendar showed
  // only today (David: «серия 4, а на календаре только сегодня»): check-ins aren't mirrored into
  // shared_habit_logs, so buddies[me].days was empty for your past days even though the streak (from
  // h.log) was right. (Mirroring check-ins so BUDDIES see your days is a separate, deeper fix.)
  const habitFrac = _shared
    ? (pi, d, mi) => { const m = buddies[pi]; if (!m) return 0; const k = _calKey(d, mi); return ((m.me ? (_log[k] || m.days[k]) : m.days[k]) ? 1 : 0); }
    : (pi, d, mi) => (_log[_calKey(d, mi)] ? 1 : 0);

  // Тумблер «Тонировать фон» (cardTint) красит и ВНУТРЕННЮЮ карточку (David: «почему тут не тонирован?»).
  // Календарь+статы кладём на матовую подложку _panelBg, чтобы читались на цвете. Нейтраль не тонируется.
  const _tinted = h.cardTint === true && !_hcNeutral && typeof bosGoalSkin === "function";
  const _sk = _tinted ? bosGoalSkin(_hc, isDark, true) : null;
  const card = _tinted
    ? { background: _sk.bg, boxShadow: _sk.shadow }
    : (isDark
      ? { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }
      : { background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" });

  // Tap-to-mark from the calendar's TODAY cell — the ONE completion control now (David removed the
  // bottom button: «некуда тыкнуть, тапаешь день — бумс»). Quantitative habits (goalPerDay>1) fill
  // tap-by-tap; the FULL count flips done + grants XP (same rule as HabitCountCheck). Haptics:
  // light per step, success at completion.
  const _isQuant = (h.goalPerDay || 1) > 1;
  const _qGoal = Math.max(1, h.goalPerDay || 1);
  const _todayK = (typeof bosTodayKey === "function") ? bosTodayKey() : new Date().toISOString().slice(0, 10);
  const _qCount = h.done ? _qGoal : ((h.counts && h.counts[_todayK]) || 0);
  const _markToday = () => {
    if (!app) return;
    if (_isQuant) {
      const cur = h.done ? _qGoal : ((h.counts && h.counts[_todayK]) || 0);
      const next = h.done ? 0 : Math.min(_qGoal, cur + 1);
      if (next === cur) return;
      const willDone = next >= _qGoal;
      const counts = Object.assign({}, h.counts || {});
      counts[_todayK] = next;
      if (app.updateHabit) app.updateHabit(h.id, { counts });
      if (willDone !== !!h.done && app.toggleHabit) app.toggleHabit(h.id);
      if (window.tgHaptic) { try { window.tgHaptic(willDone ? "success" : "light"); } catch (_) {} }
    } else {
      if (app.toggleHabit) app.toggleHabit(h.id);
      if (window.tgHaptic) { try { window.tgHaptic(h.done ? "light" : "success"); } catch (_) {} }
    }
  };
  const _todayTap = {
    pct: h.done ? 1 : (_isQuant ? Math.max(0, Math.min(1, _qCount / _qGoal)) : 0),
    hint: h.done ? null : (_isQuant ? (_qCount > 0 ? String(_qCount) : "+") : "+"),
    onTap: _markToday,
  };

  // BACKFILL «вместе»: push YOUR existing personal-log days into the shared log so buddies see your
  // WHOLE streak, not just marks made from now on (toggleHabit already mirrors TODAY going forward;
  // older days predate that / never landed). Idempotent (upsert ignoreDuplicates), best-effort, once
  // per shared habit on open. Your buddy's app does the same for their days → you both see everything.
  React.useEffect(function () {
    if (!h.shareCode || !(window.bosCloud && window.bosCloud.setSharedLogBulk)) return;
    var days = Object.keys(_log).filter(function (k) { return _log[k] && /^\d{4}-\d{2}-\d{2}$/.test(k); });
    if (days.length) { try { window.bosCloud.setSharedLogBulk(h.shareCode, days); } catch (e) {} }
  }, [h.shareCode]);

  // ТАЙМЛАЙН — ПЕРВЫМ блоком (David: «этот блок теперь на самый верх»): у совместной привычки по
  // умолчанию, гасится тоглом «Таймлайн» в редакторе (h.threadOff). Те же лица и небо, что в круге;
  // в чужой день по «Дням недели» — дремлет и говорит, когда следующая встреча.
  // МГНОВЕННОСТЬ: свой проклик рисуем СРАЗУ (оптимистично, ts=сейчас, fresh=pop-анимация) — не ждём
  // облачного round-trip'а. Раньше лицо всплывало лишь после выхода-входа (David: «должно сразу же»).
  const _threadBlock = (_shared && h.threadOff !== true && typeof SkyThreadLive === "function") ? (() => {
    const _tk = (typeof bosTodayKey === "function") ? bosTodayKey() : null;
    const _pt = (x) => (typeof bosParseTs === "function" ? bosParseTs(x) : new Date(x));
    // ДРУГИЕ — из облака. МОЁ лицо НЕ берём из облака (оно отстаёт): ведём его локальной галочкой,
    // чтобы снятие чекмарка убирало меня СРАЗУ, а не ждало полла (David: «должно исчезать в реалтайме»).
    const _marks = buddies.filter((m) => m.todayAt && !m.me).map((m) => ({ id: m.id, name: m.name, avatar: m.avatar, me: false, ts: _pt(m.todayAt) }));
    const _iDid = h.done || (_isQuant && _qCount > 0);
    const _meB = buddies.find((m) => m.me);
    if (_iDid && _meB) {
      // Уже есть облачная метка (отметился раньше сегодня) → показываю в её реальное время без «pop».
      // Только что тапнул, облако не доехало → рисую себя СЕЙЧАС с пружинной анимацией.
      const _cloudAt = _meB.todayAt;
      _marks.push({ id: _meB.id, name: "Ты", avatar: _meB.avatar, me: true, ts: _cloudAt ? _pt(_cloudAt) : new Date(), fresh: !_cloudAt });
    }
    const _doneToday = buddies.filter((m) => (m.days && _tk && m.days[_tk]) || (m.me && _iDid)).length;
    let _rest = null;
    if (_mask && _tk && typeof bosDowOfKey === "function" && !_mask[bosDowOfKey(_tk)]) {
      const _wd = ["в понедельник", "во вторник", "в среду", "в четверг", "в пятницу", "в субботу", "в воскресенье"];
      let _next = null; for (let d = 1; d <= 7 && _next == null; d++) { const i = (bosDowOfKey(_tk) + d) % 7; if (_mask[i]) _next = i; }
      _rest = (typeof daysSummary === "function" ? daysSummary(h.days) : "не сегодня") + (_next != null ? " — следующая встреча " + _wd[_next] : "");
    }
    return (
      <div style={{ background: "var(--card, #fff)", borderRadius: 22, padding: 16, marginBottom: 12, boxShadow: "var(--card-shadow)" }}>
        <SkyThreadLive marks={_marks} total={buddies.length} doneCount={_doneToday} isDark={isDark} rest={_rest} />
      </div>
    );
  })() : null;

  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader dark={isDark} title="" onBack={() => navigate(back)} right={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* «Вести вместе» → круглая СТЕКЛЯННАЯ кнопка с иконкой «поделиться», слева от карандашика
              (David: баннер «Веди вместе» убран, приглашение живёт здесь). */}
          <button onClick={() => openSheet(<ShareHabitSheetLive habit={h} dark={isDark} />)} className="tap" data-haptic="selection" aria-label="Вести вместе" title="Вести вместе"
            style={{ width: 40, height: 40, borderRadius: "50%", border: 0, display: "grid", placeItems: "center", cursor: "pointer", color: isDark ? "#fff" : "var(--text)", background: BOS_TILE_SHEEN + ", " + (isDark ? "rgba(255,255,255,0.10)" : "var(--surface-3)"), boxShadow: bosTileGlass(isDark) }}>
            <I.Share size={16} strokeWidth={2} />
          </button>
          {/* Правка НА МЕСТЕ — шторка над деталью (единый паттерн с правкой круга). */}
          <EditGlassButtonLive onClick={() => openSheet(<HabitFormSheetLive mode="edit" habit={h} navigate={navigate} />)} />
        </div>
      } />

      {/* ТАЙМЛАЙН — самым верхним блоком (David). */}
      {_threadBlock}

      {/* ЕДИНЫЙ БЛОК (David: «как на макете — всё внутри одного блока»): герой (иконка+название+отметка)
          → календарь (пилюля справа) → Серия/Лучшая/Всего снизу — всё в одной карточке, не тремя. */}
      <div style={{ ...card, borderRadius: 22, padding: 16, marginTop: 4 }}>

        {/* Верхний ряд: плитка-иконка слева + название, справа НАШ реальный компонент отметки (тот же,
            что на главной — таймер/счётчик/галочка по типу привычки, масштаб 1.8). */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 58, height: 58, borderRadius: 16, flexShrink: 0, display: "grid", placeItems: "center", background: _tinted ? _sk.iconBg : (BOS_TILE_SHEEN + ", " + tileBg), boxShadow: bosTileGlass(isDark) }}>
            <span style={{ fontSize: 30 }}>{bosIcon(h.emoji, 28, _hc)}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: _tinted ? _sk.txt : "var(--text)", letterSpacing: "-0.4px", lineHeight: 1.12, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{h.name}</div>
            <div style={{ fontSize: 13, color: _tinted ? _sk.sub : "var(--text-4)", marginTop: 3 }}>
              {(_mask && typeof daysSummary === "function") ? daysSummary(h.days) : "Ежедневно"}{h.duration ? ` · ${h.duration} мин` : ""}{h.done ? " · выполнено сегодня" : ""}
            </div>
          </div>
          <div style={{ flexShrink: 0, width: 54, height: 54, display: "grid", placeItems: "center" }}>
            <div style={{ transform: "scale(1.45)", transformOrigin: "center" }}>
              {(h.duration > 0 && !((h.goalPerDay || 1) > 1) && typeof HabitTimerCheck === "function")
                ? <HabitTimerCheck habit={h} app={app} xp={10} />
                : ((h.goalPerDay || 1) > 1 && typeof HabitCountCheck === "function")
                  ? <HabitCountCheck habit={h} app={app} xp={10} />
                  : <HabitCheck done={h.done} onToggle={() => { if (app && app.toggleHabit) app.toggleHabit(h.id); }} xp={10} float color={h.color} dark={isDark} />}
            </div>
          </div>
        </div>

        {/* Календарь — ПРЯМО на тонированном фоне, единый тон (David: «как в макете, без подложки»). */}
        <div style={{ marginTop: 18 }}>
          <PeopleMonthCalendarLive people={calPeople} dayFrac={habitFrac} bare todayTap={_todayTap} defaultView="year" tintInk={_tinted ? _sk.txt : null} schedDays={h.days} />
        </div>

        {/* Серия / Лучшая / Всего — снизу; на тоне линия и иконки светлее/в тон. */}
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid " + (_tinted ? (isDark ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.5)") : "var(--line)") }}>
          <StatTrioLive bare isDark={isDark} tintInk={_tinted ? _sk.txt : null} items={[
            { l: "Серия", v: streak, suf: "д", icon: <I.Flame size={16} filled color={_tinted ? _sk.txt : (isDark ? "#fff" : "#0a0a0a")} /> },
            { l: "Лучшая", v: best, suf: "д", icon: <I.Trophy size={16} filled strokeWidth={2} color={_tinted ? _sk.txt : (isDark ? "#fff" : "#0a0a0a")} /> },
            { l: "Всего", v: total, suf: "", icon: <I.ChartBar size={16} strokeWidth={2.8} color={_tinted ? _sk.txt : (isDark ? "#fff" : "#0a0a0a")} /> },
          ]} />
        </div>

      </div>

      {/* СКРЫТО (David: «убери баннеры „Веди вместе“ и „Инсайт“ — может, потом пригодятся»).
          Приглашение переехало в стеклянную кнопку «поделиться» в шапке. Код сохранён:
      <SharedBuddiesLive habit={h} isDark={isDark} members={buddies} />
      <div style={{ ...card, borderRadius: 22, padding: 14, marginTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
          <I.Sparkles size={16} color={h.color || (isDark ? "#fff" : "#0a0a0a")} />
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.2px", color: "var(--text-2)" }}>Инсайт</span>
        </div>
        <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.5 }}>
          {streak >= 7
            ? `Серия уже ${streak} дней — это работает на автопилоте. Не разрывай цепочку сегодня.`
            : `Ещё ${Math.max(1, 7 - streak)} дн. — и привычка станет автоматической. Сейчас самый важный момент.`}
        </div>
      </div>
      */}

      {/* No bottom action button — completion now happens by tapping TODAY in the calendar above
          (David: «убрать нижнюю кнопку, тапаешь день недели — и она отмечается»). */}
    </div>
  );
}

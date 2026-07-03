/* HABIT / GOAL / INFO — LIVE-only forks (real Telegram user, app.mode === "live"
   is ALWAYS true here). These screens get dedicated live copies so the two
   demos (demo & fresh) stay FROZEN on the originals in screens/habits.jsx.
   СОЗДАНИЕ/ПРАВКА привычки и цели = ШТОРКИ (David: «всё такое — всплывающими
   шторками снизу вверх, унифицировано»): HabitFormSheetLive / GoalFormSheetLive
   открываются через openSheet ПОВЕРХ текущего экрана (правка на месте, как
   TeamQuickEditSheetLive), создание и правка — ОДНА и та же шторка. Эмодзи-пикер и
   «Пригласить» — вторые вью ВНУТРИ той же шторки (one-sheet host, без вложенных).
   navigate приходит ПРОПОМ (шторки рендерятся вне NavCtx). Старые роуты
   habit-settings / goal-settings остались ФОЛБЭКОМ: редиректят на «Привычки» и
   поднимают шторку — ни один старый вход не ломается. Everything else reuses the
   shared core/ toolkit (WEEKDAY_LABELS, daysSummary) + the DeadlineCalendarLive fork
   (shared_live.jsx) + framework (Switch, Segmented, I, hooks useApp/useNav/useSheet,
   window.bosCloud, window.tgHaptic). Top-level declarations in this file:
   const INFO_TOPICS_LIVE, function HabitFormSheetLive, function GoalFormSheetLive,
   function HabitSettingsLive, function GoalSettingsLive, function InfoLive. */

function HabitFormSheetLive({ mode = "create", habit = null, preset = null, goalFor: goalForProp = null, navigate }) {
  const { open: openSheet, close } = useSheet();
  const app = useApp();
  const isDark = app?.themeOverride === "dark"; // тёмная тема: инверсия активных пилюль (чёрное→белое)
  const editing = mode === "edit" && !!habit;
  const params = { habit: habit }; // локальный шим: тело формы исторически читает params.habit
  // Создаём привычку ДЛЯ конкретной цели → после сохранения привяжем её к цели (habitIds) и вернёмся
  // в цель. goalOnly = «вести только внутри цели» (не показывать в общем списке привычек) — David: «час
  // рояля не хочу выводить на личную». (Существующая привычка тоже помнит goalOnly при редактировании.)
  const goalFor = goalForProp || null;
  const [view, setView] = useHS("form"); // form | picker | share — вторые вью внутри ОДНОЙ шторки
  const [goalOnly, setGoalOnly] = useHS(editing ? !!params.habit.goalOnly : false);
  const [name, setName] = useHS(editing ? params.habit.name : (preset?.t || "Прогулка"));
  const [iconPick, setIconPick] = useHS(editing ? params.habit.emoji : (preset?.i || "👟"));
  // Icon = the EmojiPickerLive panel (opens straight on emojis). The iOS keyboard can't be
  // forced into emoji mode — it opened on ABC, «непонятно что делать» (David) — so we use
  // our own emoji sheet, opened by tapping the tile below.
  // Every habit carries an Apple colour now (coherent with the week-strip). Old null-colour
  // habits resolve to their stable bosHabitColor when edited.
  const [color, setColor] = useHS(editing ? (params.habit.color ?? (typeof bosHabitColor === "function" ? bosHabitColor(params.habit) : "#0a0a0a")) : (preset?.color ?? BOS_GREY)); // новый = нейтральный «белый» BOS_GREY (David: пикер по дефолту на белом везде)
  const [goal, setGoal] = useHS(editing ? (params.habit.goalPerDay || 1) : 1);
  const [duration, setDuration] = useHS(editing ? (params.habit.duration || 0) : 0); // минуты; 0 = без таймера
  // Как отмечать привычку — ОДИН из трёх ВЗАИМОИСКЛЮЧАЮЩИХ режимов (David: «не выдумывай третий способ,
  // сделай едино»): «Галочка» (одно касание), «Счётчик» (N раз в день), «Таймер» (отсчёт минут). pickMode
  // держит goal/duration согласованными, чтобы в привычку никогда не попали и счётчик, и таймер сразу.
  const [markMode, setMarkMode] = useHS(editing ? ((params.habit.duration > 0) ? "timer" : ((params.habit.goalPerDay > 1) ? "count" : "check")) : "check");
  const pickMode = (m) => { setMarkMode(m); if (m === "check") { setGoal(1); setDuration(0); } else if (m === "count") { setGoal(goal > 1 ? goal : 2); setDuration(0); } else { setDuration(duration > 0 ? duration : 15); setGoal(1); } };
  // Days-of-week schedule — 7-long 0/1 mask, Пн..Вс. Default = every day.
  const [days, setDays] = useHS(editing && Array.isArray(params.habit.days) && params.habit.days.length === 7
    ? params.habit.days.slice()
    : ((preset && Array.isArray(preset.days) && preset.days.length === 7) ? preset.days.slice() : [1, 1, 1, 1, 1, 1, 1]));
  const toggleDay = (i) => setDays(d => d.map((v, j) => j === i ? (v ? 0 : 1) : v));
  // Reminder — a single setting: on/off + a time. Seeded from the habit when editing.
  const [reminderOn, setReminderOn] = useHS(editing ? !!(params.habit.reminder && params.habit.reminder.on) : true);
  const [reminderTime, setReminderTime] = useHS(editing && params.habit.reminder && params.habit.reminder.time ? params.habit.reminder.time : (preset?.time || "09:00"));
  const [shareOn, setShareOn] = useHS(true);
  const [inviteNote, setInviteNote] = useHS(""); // gentle inline note if the invite step can't run
  const [sharedTeam, setSharedTeam] = useHS(null); // the mini-team backing this shared habit (created once)

  // Turn this habit into a SHARED one: a private mini-team + a main team-habit, then
  // hand back the {team, link} so we can open the share sheet. Created at most once
  // (cached in sharedTeam). Returns null + sets a gentle note if the cloud isn't ready.
  const ensureSharedTeam = async () => {
    if (sharedTeam) return sharedTeam;
    const nm = name.trim() || "Новая привычка";
    if (!window.bosCloud || !window.bosCloud.enabled()) {
      setInviteNote("Чтобы звать друзей, войди через Telegram.");
      return null;
    }
    try {
      const team = await window.bosCloud.createTeam({ name: nm, emblem: iconPick, vis: "private" });
      if (!team || !team.id) {
        setInviteNote("Не удалось создать общую привычку — попробуй ещё раз.");
        return null;
      }
      try { await window.bosCloud.addTeamHabit(team.id, { name: nm, emoji: iconPick, isMain: true }); } catch (e) {}
      let ref = "";
      try { ref = (await window.bosCloud.uid()) || ""; } catch (e) {}
      const link = location.origin + location.pathname + "?team=" + team.id + (ref ? "&ref=" + ref : "");
      const made = { team, link };
      setSharedTeam(made); setInviteNote("");
      return made;
    } catch (e) {
      setInviteNote("Не удалось создать общую привычку — попробуй ещё раз.");
      return null;
    }
  };
  // Invite-now (the «Пригласить» button): the gamified ShareHabitSheetLive (real referral
  // link via bosInviteLink) — теперь ВТОРОЙ ВЬЮ внутри этой же шторки (не openSheet, который
  // заменил бы форму и потерял введённое). «Назад» возвращает к форме.
  const inviteFriend = () => {
    if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} }
    setView("share");
  };
  // Soft pastel palette so each real friend chip still gets a pleasant colour.
  const _FCOLORS = ["#e8c8a8", "#a8b9d4", "#d4b8e8", "#a8d4e8", "#b8e8c8", "#e8b8d4", "#d4c8e8"];
  // LIVE: real invited people (referral circle), nothing pre-selected.
  const [shareFriends, setShareFriends] = useHS([]);
  React.useEffect(() => {
    if (!(window.bosCloud && window.bosCloud.enabled())) return;
    let on = true;
    try {
      window.bosCloud.invitedPeople().then((list) => {
        if (!on || !Array.isArray(list)) return;
        setShareFriends(list.map((p, idx) => {
          const nm = (p && p.username) ? p.username : "Друг";
          return { name: nm, avatar: (p && p.avatar) || null, i: nm.charAt(0).toUpperCase(), c: _FCOLORS[idx % _FCOLORS.length], on: false };
        }));
      }).catch(() => {});
    } catch (e) {}
    return () => { on = false; };
  }, []);
  const [type, setType] = useHS("build");

  // СОХРАНЕНИЕ — одна функция для «✓» в шапке и нижней кнопки (David: «галочка справа
  // вверху, чтобы не листать до низа»).
  const saveHabit = () => {
    const nm = name.trim() || "Новая привычка";
    // Persist the full schedule + reminder on the habit. These extra fields ride
    // along into the live snapshot (addHabit/updateHabit spread whatever you pass).
    const base = {
      emoji: iconPick, name: nm, color,
      days: days.slice(),                                  // 7-long Пн..Вс mask
      goalPerDay: markMode === "count" ? Math.max(2, goal) : 1,   // счётчик только в режиме «Счётчик»
      duration: markMode === "timer" ? Math.max(1, duration) : 0, // таймер только в режиме «Таймер»
      reminder: { on: reminderOn, time: reminderTime },
    };
    if (!editing && preset && preset.challenge) base.challenge = preset.challenge; // разовый XP-бонус челленджа (derived)
    // Привычка ДЛЯ цели: несёт goalId (+ goalOnly = скрыть из общего списка). После создания
    // привязываем её к цели (habitIds) — деталь цели под шторкой обновится сама.
    if (goalFor) { base.goalId = goalFor.id; base.goalOnly = goalOnly; }
    const linkToGoal = (nh) => {
      if (!goalFor || !nh) return false;
      const g = (app?.goals || []).find((x) => x.id === goalFor.id);
      const ids = (((g && g.habitIds) || [])).concat(nh.id);
      app?.updateGoal(goalFor.id, { habitIds: ids });
      return true;
    };
    // SHARED habit: if sharing is on, save + swap this sheet for the share sheet
    // (one-sheet host: содержимое шторки меняется, форма уже сохранена).
    if (shareOn && !goalFor) {
      if (editing) app?.updateHabit(params.habit.id, base);
      else app?.addHabit(base);
      openSheet(<ShareHabitSheetLive habit={{ name: nm, emoji: iconPick, color }} />);
      return;
    }
    if (editing) { app?.updateHabit(params.habit.id, base); }
    else { const nh = app?.addHabit(base); if (linkToGoal(nh)) { close(); return; } }
    close();
  };

  // ВТОРОЙ ВЬЮ: эмодзи-пикер внутри той же шторки (как в TeamQuickEditSheetLive) —
  // вложенный openSheet заменил бы форму и потерял ввод.
  if (view === "picker") {
    return (
      <div className="bos-sheet-scroll" style={{ paddingTop: 2, paddingLeft: 16, paddingRight: 16 }}>
        <EmojiPickerLive embedded current={iconPick} accent={color} onPick={(e) => { setIconPick(e); setView("form"); }} />
        <button onClick={() => setView("form")} className="tap" style={{ width: "100%", marginTop: 12, background: "var(--surface-3)", border: 0, borderRadius: 14, padding: "12px", fontSize: 14, fontWeight: 600, color: "var(--text-2)" }}>Назад</button>
      </div>
    );
  }
  // ВТОРОЙ ВЬЮ: «Пригласить» — реальный шаринг, с возвратом к форме.
  if (view === "share") {
    return (
      <div className="bos-sheet-scroll" style={{ paddingTop: 2 }}>
        <ShareHabitSheetLive habit={{ name: name.trim() || "Новая привычка", emoji: iconPick, color }} />
        <button onClick={() => setView("form")} className="tap" style={{ width: "calc(100% - 40px)", margin: "10px 20px 0", background: "transparent", border: 0, padding: "10px", fontSize: 13.5, fontWeight: 600, color: "var(--text-3)" }}>← Назад к привычке</button>
      </div>
    );
  }

  return (
    <div className="bos-sheet-scroll" style={{ paddingTop: 2, paddingLeft: 16, paddingRight: 16 }}>
      {/* Серый фон шторки + белые карточки — как страницы приложения (David). */}
      {typeof SheetGreyBgLive === "function" && <SheetGreyBgLive />}
      {typeof SheetFormHeadLive === "function"
        ? <SheetFormHeadLive title={editing ? "Изменить привычку" : "Новая привычка"} onClose={close} onDone={saveHabit} />
        : <div style={{ textAlign: "center", fontSize: 18, fontWeight: 700, letterSpacing: "-0.3px", marginBottom: 2 }}>{editing ? "Изменить привычку" : "Новая привычка"}</div>}
      {/* Identity — icon (tap → emoji panel), name (tap → type) and colour all in ONE card;
          no separate «Название» field, no preset row (the emoji panel already has every
          emoji). David: «зачем целое отдельное поле… сделай целостно». */}
      <div style={{ background: "var(--card, #fff)", borderRadius: 22, padding: 14, boxShadow: "var(--card-shadow)", marginTop: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Tap the tile → emoji PANEL — второй вью этой же шторки. */}
          <button type="button" data-haptic="selection" onClick={() => setView("picker")}
            style={{ width: 56, height: 56, borderRadius: 16, background: (color && color !== BOS_GREY && ("" + color).toLowerCase() !== "#0a0a0a") ? color + "26" : "var(--surface-3)", display: "grid", placeItems: "center", fontSize: 28, flexShrink: 0, border: 0, cursor: "pointer", transition: "background 0.2s" }}>
            {bosIcon(iconPick, 28, color)}
          </button>
          {/* Name is edited right here — tap to type, no separate field above. */}
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Название привычки" aria-label="Название привычки"
            style={{ flex: 1, minWidth: 0, border: 0, outline: "none", background: "transparent", fontSize: 17, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.2px", padding: "6px 0" }} />
        </div>
        {/* Apple system palette + custom wheel. The selected swatch has a 4px outset ring —
            the row needs padding so an overflow-x scroller doesn't clip it (David: «колечко
            выпирает и обрезается»). 6px all round > the 4px ring. */}
        <BosColorPickerLive value={color} onChange={setColor} />
        {/* Развивать/Бросить — суть привычки, живёт в главном блоке НАВЕРХУ (David: «в самом
            низу его практически не видно, это важно»). Тонкий сегмент, не полноразмерный. */}
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line-2, rgba(0,0,0,0.06))" }}>
          <Segmented small value={type} onChange={setType} options={[{ value: "build", label: "Развивать" }, { value: "quit", label: "Бросить" }]} />
        </div>
      </div>

      {/* Goal — без внешней подписи (David: подписи блоков не несут нагрузки, суть ясна изнутри). */}
      <div style={{ background: "var(--card, #fff)", borderRadius: 22, padding: 16, marginTop: 14, boxShadow: "var(--card-shadow)" }}>
        {/* Как отмечать — ОДИН выбор из трёх (взаимоисключающие). Тонкие пилюли с иконками —
            НЕ второй сегмент (David: «две одинаковые типовые менюшки — некрасиво»), тот же
            язык, что ряд сроков в форме цели. Нужный «шаговик» появляется ниже. */}
        <div style={{ display: "flex", gap: 6 }}>
          {[{ v: "check", l: "Галочка", Ic: I.Check }, { v: "count", l: "Счётчик", Ic: I.Hash }, { v: "timer", l: "Таймер", Ic: I.Clock }].map(({ v, l, Ic }) => {
            const on = markMode === v;
            return (
              <button key={v} onClick={() => pickMode(v)} className="tap" data-no-haptic aria-pressed={on}
                style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5, borderRadius: 999, padding: "8px 4px", fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", border: 0, cursor: "pointer", transition: "background 0.15s, color 0.15s",
                  background: on ? (isDark ? "#f2f2f5" : "#0a0a0a") : "var(--surface-3)", color: on ? (isDark ? "#0a0a0a" : "#fff") : "var(--text-2)" }}>
                <Ic size={13} strokeWidth={2.2} /> {l}
              </button>
            );
          })}
        </div>
        {markMode === "check" && (
          <div style={{ marginTop: 12, fontSize: 13, color: "var(--text-4)", lineHeight: 1.4 }}>Одно касание, когда сделал.</div>
        )}
        {markMode === "count" && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{goal} раз(а)</div>
              <div style={{ fontSize: 13, color: "var(--text-4)" }}>или больше в день</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setGoal(Math.max(2, goal - 1))} className="tap hit44" style={{ width: 32, height: 32, borderRadius: 999, background: "var(--surface-3)", border: 0, display: "grid", placeItems: "center", color: "var(--text-2)" }}><I.Minus size={16} strokeWidth={2.4}/></button>
              <button onClick={() => setGoal(Math.min(20, goal + 1))} className="tap hit44" style={{ width: 32, height: 32, borderRadius: 999, background: "var(--surface-3)", border: 0, display: "grid", placeItems: "center", color: "var(--text-2)" }}><I.Plus size={16} strokeWidth={2.4}/></button>
            </div>
          </div>
        )}
        {markMode === "timer" && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{duration} мин</div>
              <div style={{ fontSize: 13, color: "var(--text-4)" }}>отсчёт времени на выполнение</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setDuration(Math.max(5, duration - 5))} className="tap hit44" style={{ width: 32, height: 32, borderRadius: 999, background: "var(--surface-3)", border: 0, display: "grid", placeItems: "center", color: "var(--text-2)" }}><I.Minus size={16} strokeWidth={2.4}/></button>
              <button onClick={() => setDuration(Math.min(180, duration + 5))} className="tap hit44" style={{ width: 32, height: 32, borderRadius: 999, background: "var(--surface-3)", border: 0, display: "grid", placeItems: "center", color: "var(--text-2)" }}><I.Plus size={16} strokeWidth={2.4}/></button>
            </div>
          </div>
        )}
        {/* Days-of-week — tap a circle to toggle that day. All on = «каждый день». */}
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--line-2, rgba(0,0,0,0.06))" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: "var(--text-3)" }}>Дни недели</span>
            <span style={{ fontSize: 13, color: "var(--text-2)", fontWeight: 600 }}>{daysSummary(days)}</span>
          </div>
          <div style={{ display: "flex", gap: 6, justifyContent: "space-between" }}>
            {WEEKDAY_LABELS.map((w, i) => {
              const on = !!days[i];
              return (
                <button key={i} className="tap" data-no-haptic onClick={() => toggleDay(i)} aria-pressed={on}
                  style={{ flex: 1, aspectRatio: "1/1", maxWidth: 34, borderRadius: "50%", border: 0, cursor: "pointer",
                    fontSize: 11.5, fontWeight: 600, letterSpacing: "-0.2px",
                    background: on ? (isDark ? "#f2f2f5" : "#0a0a0a") : "var(--surface-3)",   // neutral graphite, NOT the habit colour (David: «нафига в днях недели цвет — лишнее»)
                    color: on ? (isDark ? "#0a0a0a" : "#fff") : "var(--text-4)",
                    boxShadow: on ? "0 2px 6px rgba(0,0,0,0.14)" : "none",
                    transform: on ? "scale(1.04)" : "none", transition: "transform 0.12s, background 0.12s, color 0.12s" }}>
                  {w}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reminders — подпись убрана, внутри блока «Напоминать каждый день». */}
      <div style={{ background: "var(--card, #fff)", borderRadius: 22, padding: 16, marginTop: 14, boxShadow: "var(--card-shadow)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1, fontSize: 14, color: "var(--text-2)", lineHeight: 1.4 }}>
            Напоминать каждый день
            <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2 }}>{reminderOn ? "Тихий пуш в выбранное время." : "Без напоминаний — отмечай когда удобно."}</div>
          </div>
          <Switch small on={reminderOn} onChange={setReminderOn} />
        </div>
        {reminderOn && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line-2, rgba(0,0,0,0.06))" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 14, color: "var(--text-2)" }}><I.Clock size={16} color="var(--text-3)" /> Время</span>
            {/* Native iOS time wheel, styled to read as one of the app's pills. Тонкая пилюля,
                цифры не жирные и по центру высоты (David: «жирное, большое, не центрировано»). */}
            <input type="time" value={reminderTime} onChange={e => setReminderTime(e.target.value || "09:00")}
              style={{ border: 0, outline: 0, background: "var(--surface-3)", borderRadius: 999, padding: "0 12px",
                height: 30, lineHeight: "30px", display: "inline-flex", alignItems: "center",
                fontSize: 14.5, fontWeight: 500, color: "var(--text)", fontVariantNumeric: "tabular-nums",
                letterSpacing: "-0.2px", WebkitAppearance: "none", appearance: "none", textAlign: "center" }} />
          </div>
        )}
      </div>

      {/* Share with friend — the most natural referral moment: invite anyone into
          your habit. They join → you earn XP and they're in the app. */}
      <div data-tour="invite-friend" style={{ background: "var(--card, #fff)", borderRadius: 22, padding: 16, marginTop: 14, boxShadow: "var(--card-shadow)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, fontSize: 14, color: "var(--text-2)", lineHeight: 1.4 }}>
            Делать это вместе
            <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2 }}>Друзья видят, когда ты отмечаешься. Они могут поддержать или подтолкнуть.</div>
          </div>
          <Switch small on={shareOn} onChange={setShareOn} />
        </div>
        <div style={{ marginTop: 12, borderRadius: 14, padding: "11px 12px", background: isDark ? "rgba(52,199,89,0.13)" : "#edfaf0", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 30, height: 30, borderRadius: "50%", background: isDark ? "rgba(52,199,89,0.2)" : "#d6f3df", display: "grid", placeItems: "center", flexShrink: 0, fontSize: 15 }}>🤝</span>
          <div style={{ fontSize: 12.5, color: isDark ? "#7dd89b" : "#1a7a3a", lineHeight: 1.4 }}><b>+75 XP</b>, когда друг присоединится. А ведёте вместе — каждый шаг <b>+15</b> вместо +10.</div>
        </div>
        {shareOn && <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap", alignItems: "center" }}>
          {shareFriends.length === 0 && (
            <span style={{ fontSize: 12.5, color: "var(--text-4)", lineHeight: 1.4 }}>Пока некого выбрать — пригласи друга по ссылке.</span>
          )}
          {shareFriends.map((p, i) => (
            <button key={i} onClick={() => setShareFriends(fs => fs.map((x, j) => j === i ? { ...x, on: !x.on } : x))} className="tap" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 11px 5px 5px", borderRadius: 999,
              background: p.on ? (isDark ? "#f2f2f5" : "#0a0a0a") : "var(--surface-3)",
              color: p.on ? (isDark ? "#0a0a0a" : "#fff") : "var(--text-3)",
              border: 0, fontSize: 12, fontWeight: 500,
            }}>
              <BuddyFaceLive avatar={p.avatar} name={p.name} size={22} />
              {p.name}
              {p.on && <I.Check size={12} strokeWidth={3}/>}
            </button>
          ))}
          {/* LIVE: make it REAL — create a shared mini-team + habit and open the share sheet. */}
          <button onClick={() => inviteFriend()} className="tap" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "5px 11px", borderRadius: 999,
            background: "transparent", border: "1px dashed rgba(0,0,0,0.18)",
            color: "var(--text-3)", fontSize: 12, fontWeight: 500,
          }}><I.Plus size={12}/> Пригласить</button>
        </div>}
        {/* Gentle inline note — only when the invite step can't run (no Telegram / cloud off). */}
        {shareOn && inviteNote && (
          <div style={{ marginTop: 12, fontSize: 12.5, color: "var(--text-4)", lineHeight: 1.4, padding: "0 2px" }}>{inviteNote}</div>
        )}
      </div>

      {/* Привычка ДЛЯ цели — тумблер «вести только внутри цели» (скрыть из общего списка). David: рояль. */}
      {goalFor && (
        <div style={{ background: "var(--card, #fff)", borderRadius: 22, padding: 16, marginTop: 14, boxShadow: "var(--card-shadow)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.4 }}>Вести только внутри цели</div>
              <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2 }}>Не показывать в общем списке — привычка живёт внутри «{goalFor.name}».</div>
            </div>
            <Switch small on={goalOnly} onChange={setGoalOnly} />
          </div>
        </div>
      )}

      {/* Нижней кнопки сохранения НЕТ — только «✓» в шапке (David: «оставить только крестик и галочку»). */}
      {editing && (
        <button className="tap" onClick={() => { app?.removeHabit(params.habit.id); close(); if (typeof navigate === "function") navigate("habits"); }}
          style={{ width: "100%", background: "transparent", border: 0, color: "var(--accent-red)", padding: 14, marginTop: 6, fontSize: 15 }}>
          Удалить привычку
        </button>
      )}
    </div>
  );
}

/* Фолбэк-роут: любой оставшийся navigate("habit-settings", …) приводит на «Привычки»
   и поднимает ту же шторку — старые входы не ломаются. */
function HabitSettingsLive() {
  const { navigate, params } = useNav();
  const { open } = useSheet();
  React.useEffect(() => {
    navigate("habits");
    open(<HabitFormSheetLive mode={params?.mode || "create"} habit={params?.habit || null} preset={params?.preset || null} goalFor={params?.goalFor || null} navigate={navigate} />);
  }, []); // eslint-disable-line
  return null;
}

/* ─── GOAL FORM — create / edit a goal, ШТОРКА (LIVE) ──────────────── */
function GoalFormSheetLive({ mode = "create", goal: goalProp = null, preset: presetProp = null, circleOn: circleOnProp = false, navigate, returnTo }) {
  const app = useApp();
  const isDark = app?.themeOverride === "dark"; // тёмная тема: инверсия активных пилюль
  const { open: openSheet, close } = useSheet();
  const editing = mode === "edit" && !!goalProp;
  const g0 = editing ? goalProp : null;
  const [view, setView] = useHS("form"); // form | picker — пикер = второй вью этой же шторки
  // Quick-add goal preset (from the Цели tab chip) → {i,t,target,unit,deadline}. Seeds the form so
  // tapping «Пробежать марафон» lands you on a pre-filled goal, same as habit quick-add presets.
  const preset = (!editing && presetProp) ? presetProp : null;
  const [name, setName] = useHS(g0?.name || preset?.t || "Пробежать марафон");
  const [iconPick, setIconPick] = useHS(g0?.emoji || preset?.i || "🎯");
  // Goals carry a colour exactly like habits — default BLACK (the app's b&w base); the
  // chosen colour fills the goal's progress bar + detail ring (David: «всё один в один»).
  // Дефолт цвета ЦЕЛИ = НЕЙТРАЛЬНЫЙ (null → белая/светло-серая карточка, David). Цвет появляется
  // только если задан пресетом/пикером — тогда карточка заливается им (как партнёрские карточки).
  const [color, setColor] = useHS(g0?.color ?? preset?.color ?? BOS_GREY); // новый = нейтральный «белый» BOS_GREY (единый дефолт с привычками/командами)
  const [target, setTarget] = useHS(g0?.target || preset?.target || 22);
  const [unit, setUnit] = useHS(g0?.unit || preset?.unit || "раз"); // дефолт = режим «Количество» (David: 3 простых режима)
  const [deadline, setDeadline] = useHS(g0?.deadline || preset?.deadline || "Месяц");
  const [showCal, setShowCal] = useHS(false);
  const [linkHabit, setLinkHabit] = useHS(true);
  // КРУГ — «цель + круг = команда»: включаешь круг → цель становится КОМАНДОЙ (один движок —
  // комната-орбита, режимы, вступление по ссылке team_<cloudId>). Тумблер только переключает путь
  // сохранения ниже: вкл → app.addTeam (а не addGoal). David: один механизм, без второго «лёгкого» круга.
  // КРУГ — тумблер «вести вместе». Можно предвключить пропом circleOn (входы «Собери круг» / чипы-круги).
  const [circleOn, setCircleOn] = useHS(g0?.circle === true || circleOnProp === true);
  // Полные КРУГ-настройки (раскрываются при тумблере) — режим/видимость/XP-ставка. Раньше жили в
  // отдельной форме «Создать команду»; теперь это одна форма (David: «круг = цель + тумблер»).
  const [goalType, setGoalType] = useHS(g0?.type || preset?.goalType || "collective"); // collective | streak | race
  const [circleVis, setCircleVis] = useHS(g0?.vis || "private");
  const [stakeOn, setStakeOn] = useHS((g0?.stake || 0) > 0);
  const [stakeAmount, setStakeAmount] = useHS(g0?.stake || 100);
  const CIRCLE_MODES = [
    { id: "collective", e: "🌊", t: "Общий счёт",     d: "Отметки всех складываются в одно число." },
    { id: "streak",     e: "🔥", t: "Серия у каждого", d: "Каждый держит серию — круг проходит, если прошли все." },
    // «Гонка» временно скрыта (David: «может вернём позже») — вернуть = раскомментировать.
    // { id: "race",    e: "🏁", t: "Гонка",           d: "Первый до цели побеждает, остальные получают часть XP." },
  ];
  // REAL — the user's own habits. Несём id (нужно, чтобы сохранить связь цель↔привычка). При
  // редактировании — заранее отмечаем уже привязанные (g0.habitIds). Эти отметки двигают кольцо цели.
  const [linkedHabits, setLinkedHabits] = useHS(() => (app?.habits || []).map((h) => ({ id: h.id, e: h.emoji || "✨", n: h.name, on: !!(g0 && (g0.habitIds || []).includes(h.id)) })));
  const toggleLinked = (i) => setLinkedHabits((hs) => hs.map((h, j) => (j === i ? { ...h, on: !h.on } : h)));
  const QUICK_TERMS = ["Неделя", "Месяц", "1 год"];
  const svoyActive = showCal || (!!deadline && !QUICK_TERMS.includes(deadline)); // custom date/range → highlight «Свой срок»

  // СОХРАНЕНИЕ — одна функция для «✓» в шапке и нижней кнопки.
  const saveGoal = () => {
    const nm = name.trim() || "Новая цель";
    const tgt = Math.max(1, target);
    // КРУГ ВКЛ → ОДИН путь bosPromoteGoalToCircle (shared_live): создаёт настоящий круг, ПЕРЕНОСЯ
    // выбранные привычки как командные; при редактировании цель превращается на месте.
    if (circleOn) {
      const _stake = stakeOn ? Math.max(0, stakeAmount) : 0;
      const habitIds = linkHabit ? linkedHabits.filter((h) => h.on).map((h) => h.id) : [];
      const goalLike = { id: (editing && g0) ? g0.id : undefined, name: nm, emoji: iconPick, color, target: tgt, unit, deadline: deadline || "Этот месяц", habitIds };
      if (preset && preset.challenge) goalLike.challenge = preset.challenge;
      close(); // шторку вниз — helper сам уводит в комнату круга и поднимает шторку приглашения
      if (typeof bosPromoteGoalToCircle === "function") {
        bosPromoteGoalToCircle(app, goalLike, { navigate, from: "habits", vis: circleVis, type: goalType, stake: _stake, onShare: (t) => openSheet(<TeamShareSheetLive team={t} />) });
      }
      return;
    }
    // КРУГ ВЫКЛ → личная цель; habitIds наполняют её кольцо.
    const habitIds = linkHabit ? linkedHabits.filter((h) => h.on).map((h) => h.id) : [];
    const data = { emoji: iconPick, color, name: nm, target: tgt, unit, deadline, circle: false, habitIds };
    if (!editing && preset && preset.challenge) data.challenge = preset.challenge; // разовый XP-бонус челленджа (derived)
    if (editing) app?.updateGoal(g0.id, data);
    else app?.addGoal(data);
    close();
  };

  // ВТОРОЙ ВЬЮ: эмодзи-пикер внутри той же шторки (единая логика с формой привычки).
  if (view === "picker") {
    return (
      <div className="bos-sheet-scroll" style={{ paddingTop: 2, paddingLeft: 16, paddingRight: 16 }}>
        <EmojiPickerLive embedded current={iconPick} accent={color} onPick={(e) => { setIconPick(e); setView("form"); }} />
        <button onClick={() => setView("form")} className="tap" style={{ width: "100%", marginTop: 12, background: "var(--surface-3)", border: 0, borderRadius: 14, padding: "12px", fontSize: 14, fontWeight: 600, color: "var(--text-2)" }}>Назад</button>
      </div>
    );
  }

  return (
    <div className="bos-sheet-scroll" style={{ paddingTop: 2, paddingLeft: 16, paddingRight: 16 }}>
      {/* Серый фон шторки + белые карточки — как страницы приложения (David). */}
      {typeof SheetGreyBgLive === "function" && <SheetGreyBgLive />}
      {typeof SheetFormHeadLive === "function"
        ? <SheetFormHeadLive title={editing ? "Изменить цель" : "Новая цель"} onClose={close} onDone={saveGoal} />
        : <div style={{ textAlign: "center", fontSize: 18, fontWeight: 700, letterSpacing: "-0.3px", marginBottom: 2 }}>{editing ? "Изменить цель" : "Новая цель"}</div>}
      {/* Тихая дорога к ГОТОВЫМ пресетам-челленджам (David: «предложить внутри создания цели,
          не перегружая») — только на создании. */}
      {!editing && typeof CreatePickerSheetLive === "function" && (
        <button onClick={() => openSheet(<CreatePickerSheetLive navigate={navigate} custom={false} />)} className="tap"
          style={{ display: "block", margin: "2px auto 0", background: "transparent", border: 0, padding: "4px 10px", fontSize: 12.5, fontWeight: 600, color: "var(--text-3)", cursor: "pointer" }}>
          или выбери готовый челлендж →
        </button>
      )}

      {/* Identity — icon (tap → emoji panel) + inline name in ONE card, same logic as the
          habit create screen (David: «модифицируй создание целей в той же логике»). */}
      <div style={{ background: "var(--card, #fff)", borderRadius: 22, padding: 14, boxShadow: "var(--card-shadow)", marginTop: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button type="button" data-haptic="selection" onClick={() => setView("picker")}
            style={{ width: 56, height: 56, borderRadius: 16, background: (color && color !== BOS_GREY && ("" + color).toLowerCase() !== "#0a0a0a") ? color + "26" : "var(--surface-3)", display: "grid", placeItems: "center", fontSize: 28, flexShrink: 0, border: 0, cursor: "pointer", transition: "background 0.2s" }}>
            {bosIcon(iconPick, 28, color)}
          </button>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Название цели" aria-label="Название цели"
            style={{ flex: 1, minWidth: 0, border: 0, outline: "none", background: "transparent", fontSize: 17, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.2px", padding: "6px 0" }} />
        </div>
        {/* Цвет цели: дефолт = НЕЙТРАЛЬНЫЙ (белая карточка); выберешь цвет → карточка зальётся им
            (партнёрский вид). David: «выбор цвета вернуть, чтобы редактировать карточку». */}
        {typeof BosColorPickerLive === "function" && <BosColorPickerLive value={color} onChange={setColor} />}
      </div>

      <div style={{ background: "var(--card, #fff)", borderRadius: 22, padding: 16, marginTop: 14, boxShadow: "var(--card-shadow)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, minWidth: 0 }}>
          <input type="text" inputMode="numeric" pattern="[0-9]*" value={target}
            onChange={e => setTarget(parseInt(e.target.value.replace(/\D/g,"")) || 0)}
            className="goal-num"
            style={{ flex: "0 0 auto", width: 72, fontSize: 28, fontWeight: 700, color: "var(--text)", border: 0, outline: 0, background: "transparent", padding: 0, minWidth: 0 }}/>
          {unit && <span style={{ fontSize: 16, fontWeight: 600, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{unit}</span>}
        </div>
        <div style={{ marginTop: 12 }}><BosUnitSelectLive value={unit} onChange={setUnit} /></div>
        <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 10 }}>От этого числа будет считаться прогресс цели.</div>
      </div>

      {/* Срок — ВСЁ в ОДНОМ блоке (David: «не всё в блоках»): поле + кнопки сроков + календарь;
          кнопки на сером стекле, не обводкой (David: «блоки не обводочкой»). */}
      <div style={{ background: "var(--card, #fff)", borderRadius: 22, padding: 14, marginTop: 14, boxShadow: "var(--card-shadow)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "2px 2px 0" }}>
          <I.Calendar size={18} color="var(--text-3)"/>
          <input value={deadline} onChange={e => setDeadline(e.target.value)} placeholder="напр. 14 окт"
            style={{ flex: 1, fontSize: 16, border: 0, outline: 0, background: "transparent" }}/>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
          <button onClick={() => setShowCal(v => !v)} className="tap" data-no-haptic
            style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4, borderRadius: 999, padding: "9px 4px", fontSize: 12.5, whiteSpace: "nowrap", border: 0,
              background: svoyActive ? (isDark ? "#f2f2f5" : "#0a0a0a") : "var(--surface-3)", color: svoyActive ? (isDark ? "#0a0a0a" : "#fff") : "var(--text-2)" }}>
            <I.Calendar size={12}/> Свой срок
          </button>
          {QUICK_TERMS.map((q) => {
            const active = !showCal && deadline === q;
            return (
              <button key={q} onClick={() => { setDeadline(q); setShowCal(false); }} className="tap" data-no-haptic
                style={{ flex: 1, borderRadius: 999, padding: "9px 4px", fontSize: 12.5, whiteSpace: "nowrap", textAlign: "center", border: 0,
                  background: active ? (isDark ? "#f2f2f5" : "#0a0a0a") : "var(--surface-3)", color: active ? (isDark ? "#0a0a0a" : "#fff") : "var(--text-2)" }}>{q}</button>
            );
          })}
        </div>
        {showCal && <DeadlineCalendarLive onPick={(s) => { setDeadline(s); setShowCal(false); }} />}
      </div>

      <div style={{ background: "var(--card, #fff)", borderRadius: 22, padding: 16, marginTop: 14, boxShadow: "var(--card-shadow)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.4 }}>Подкрепи эту цель ежедневной привычкой</div>
            <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2 }}>Каждая отметка приближает к цели.</div>
          </div>
          <Switch small on={linkHabit} onChange={setLinkHabit}/>
        </div>
        {linkHabit && (
          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap", alignItems: "center" }}>
            {linkedHabits.length === 0 && (
              <span style={{ fontSize: 12.5, color: "var(--text-4)", lineHeight: 1.4 }}>Сначала создай привычку — потом привяжешь её к цели.</span>
            )}
            {linkedHabits.map((h,i)=>(
              <button key={i} className="tap" data-no-haptic onClick={() => toggleLinked(i)} style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "5px 11px 5px 5px", borderRadius: 999,
                background: h.on ? (isDark ? "#f2f2f5" : "#0a0a0a") : "var(--surface-3, #e8e8e8)",
                color: h.on ? (isDark ? "#0a0a0a" : "#fff") : "var(--text-3)",
                border: 0, fontSize: 12, fontWeight: 500, transition: "background 0.15s, color 0.15s",
              }}>
                <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#fff", display: "grid", placeItems: "center", fontSize: 13 }}>{bosIcon(h.e, 14, null)}</span>
                {h.n}
                {h.on && <I.Check size={12} strokeWidth={3}/>}
              </button>
            ))}
            <button className="tap" onClick={() => openSheet(<HabitFormSheetLive mode="create" navigate={navigate} />)} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 11px", borderRadius: 999,
              background: "transparent", border: "1px dashed rgba(0,0,0,0.18)",
              color: "var(--text-3)", fontSize: 12, fontWeight: 500,
            }}><I.Plus size={12}/> Новая привычка</button>
          </div>
        )}
      </div>

      {/* КРУГ — «делать вместе»: цель с надетым кругом = «команда». Один тумблер (David). Тот же
          смысл, что у привычки «Поделиться»; вкл → можно позвать людей, цель станет общей. */}
      <div style={{ background: "var(--card, #fff)", borderRadius: 22, padding: 16, marginTop: 14, boxShadow: "var(--card-shadow)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, fontSize: 14, color: "var(--text-2)", lineHeight: 1.4 }}>
            Идти к цели вместе
            <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2 }}>Включи и позови людей — цель станет общей, у каждого появятся лица.</div>
          </div>
          <Switch small on={circleOn} onChange={setCircleOn} />
        </div>
      </div>

      {/* Круг ВКЛ → тут же настройки совместной цели: режим счёта + видимость + XP-ставка (David:
          «эти три нужны, но когда активируешь „вместе" — не гнать человека потом в карандашик»).
          Раскрываются только при тумблере, чтобы соло-цель оставалась простой. */}
      {circleOn && (<>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
          {CIRCLE_MODES.map((m) => {
            const active = goalType === m.id;
            return (
              <button key={m.id} type="button" onClick={() => setGoalType(m.id)} className="tap"
                style={{ background: "var(--card, #fff)", border: active ? ("2px solid " + (isDark ? "#f2f2f5" : "#0a0a0a")) : ("1px solid " + (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)")), borderRadius: 22, padding: 14, display: "flex", alignItems: "center", gap: 12, textAlign: "left", boxShadow: "var(--card-shadow)" }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: active ? (isDark ? "#f2f2f5" : "#0a0a0a") : "var(--surface-3, #e8e8e8)", color: active ? (isDark ? "#0a0a0a" : "#fff") : "var(--text)", display: "grid", placeItems: "center", fontSize: 18, flexShrink: 0 }}>{m.e}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{m.t}</div>
                  <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2, lineHeight: 1.45 }}>{m.d}</div>
                </div>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: active ? (isDark ? "#f2f2f5" : "#0a0a0a") : "transparent", border: active ? "0" : "1.5px solid var(--text-5)", flexShrink: 0, display: "grid", placeItems: "center" }}>{active && <I.Check size={11} color={isDark ? "#0a0a0a" : "#fff"} strokeWidth={3} />}</div>
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 14 }}>
          <Segmented small value={circleVis} onChange={setCircleVis} options={[{ value: "private", label: "Приватная" }, { value: "public", label: "Открытая" }]} />
        </div>

        <div style={{ background: "var(--card, #fff)", borderRadius: 22, padding: 16, marginTop: 14, boxShadow: "var(--card-shadow)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: "var(--text-2)", fontWeight: 500 }}>Поставить XP на финиш</div>
              <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2, lineHeight: 1.5 }}>Дойдёте до цели — банк вернётся каждому. Необязательно, но азартно.</div>
            </div>
            <Switch small on={stakeOn} onChange={setStakeOn} />
          </div>
          {stakeOn && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line)", display: "flex", alignItems: "baseline", gap: 8 }}>
              <input type="text" inputMode="numeric" pattern="[0-9]*" value={stakeAmount} onChange={(e) => setStakeAmount(parseInt(e.target.value.replace(/\D/g, "")) || 0)}
                style={{ flex: "0 0 80px", fontSize: 22, fontWeight: 700, color: "var(--text)", border: 0, outline: 0, background: "transparent", padding: 0, minWidth: 0 }} />
              <span style={{ fontSize: 13, color: "var(--text-4)" }}>XP с каждого</span>
            </div>
          )}
        </div>

        <div style={{ marginTop: 14, borderRadius: 14, padding: "11px 12px", background: isDark ? "rgba(90,140,255,0.13)" : "#eef4ff", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 30, height: 30, borderRadius: "50%", background: isDark ? "rgba(90,140,255,0.2)" : "#dde9ff", display: "grid", placeItems: "center", flexShrink: 0, fontSize: 15 }}>🪐</span>
          <div style={{ fontSize: 12.5, color: isDark ? "#9db8ff" : "#2b5cb8", lineHeight: 1.4 }}>Сохранишь — цель станет общей, и сразу позовёшь людей по ссылке.</div>
        </div>
      </>)}

      {/* Нижней кнопки сохранения НЕТ — только «✓» в шапке (единый язык с формой привычки). */}
      {editing && (
        <button className="tap" onClick={() => { app?.removeGoal(g0.id); close(); if (typeof navigate === "function") navigate(returnTo || "habits"); }}
          style={{ width: "100%", background: "transparent", border: 0, color: "var(--accent-red)", padding: 14, marginTop: 6, fontSize: 15 }}>
          Удалить цель
        </button>
      )}
    </div>
  );
}

/* Фолбэк-роут: любой оставшийся navigate("goal-settings", …) приводит на «Привычки»
   и поднимает ту же шторку — старые входы не ломаются. */
function GoalSettingsLive() {
  const { navigate, params } = useNav();
  const { open } = useSheet();
  React.useEffect(() => {
    navigate("habits");
    open(<GoalFormSheetLive mode={params?.mode || "create"} goal={params?.goal || null} preset={params?.preset || null} circleOn={params?.circleOn === true} navigate={navigate} />);
  }, []); // eslint-disable-line
  return null;
}

/* LIVE knowledge guides — a deepened fork of core INFO_TOPICS. Each topic carries an accent
   colour + a category kicker (NOT a reading time), a richer lede and pull quote, a CTA target,
   and a «next» that loops habits → teams → goals → habits. The teams guide is the new one
   (core never covered командные привычки). Demo keeps reading core INFO_TOPICS untouched. */
const INFO_TOPICS_LIVE = {
  "habits-basics": {
    emoji: "🌱", accent: "#34C759", kicker: "Привычки",
    title: "Основы привычек",
    lede: "Привычки держатся не на силе воли, а на том, чтобы одно маленькое действие давалось почти без усилий — и повторялось каждый день, пока мозг не перестанет спрашивать «зачем». Вот пять опор, на которых стоит любая прижившаяся привычка.",
    sections: [
      { i: "1", h: "Сделай крошечным", b: "Если привычку не вытянуть в самый трудный день — она слишком большая. Две минуты медитации каждый день побеждают полчаса раз в неделю. Сначала закрепи ритуал, потом наращивай — рост придёт сам." },
      { i: "2", h: "Привяжи к якорю", b: "Поставь новую привычку поверх той, что уже есть: «Налил утренний кофе — пишу одну строку в дневник». Старое действие становится спусковым крючком, и не нужно вспоминать — тело само ведёт." },
      { i: "3", h: "Отмечай каждый день", b: "Серия — это видимое обещание самому себе. Отмечай привычку даже в трудный день, пусть по минимуму. Важна не цифра, а непрерывность: пока цепочка цела, ты — тот, кто это делает." },
      { i: "4", h: "Не пропускай дважды", b: "Один пропуск — это просто жизнь. Два подряд — уже новый паттерн. Сорвался? Единственная задача на завтра — появиться, хотя бы в мини-версии. Возвращайся, а не «начинай с понедельника»." },
      { i: "5", h: "Настрой пространство", b: "Кроссовки — у двери. Телефон — в другой комнате. Привычка живёт в окружении: сделай хорошее очевидным и лёгким, а вредное — неудобным и далёким. Среда сильнее мотивации." },
    ],
    pull: "«Ты не поднимаешься до уровня своих целей. Ты падаешь до уровня своих систем.»",
    cta: "Создать привычку",
    next: { topic: "teams-101", t: "Командные привычки", e: "🤝" },
  },
  "goals-101": {
    emoji: "🎯", accent: "#FF9500", kicker: "Цели",
    title: "Ставь хорошие цели",
    lede: "Цель — это вопрос, на который каждый день отвечают твои привычки. Задашь его точно — и ежедневная работа сама знает, что делать. Размытая цель порождает размытые дни.",
    sections: [
      { i: "1", h: "Результат против процесса", b: "«Пробежать марафон» — результат. «Бегать 4 раза в неделю» — процесс. Результат задаёт направление, но двигают тебя процессы. Поставь цель-результат, а отслеживай ежедневный процесс." },
      { i: "2", h: "Сделай измеримой", b: "«Стать здоровее» — желание. «Спать 7,5 часа 6 ночей в неделю к июлю» — цель. Конкретность = измеримо + срок + честно. Если нельзя проверить «достиг или нет» — это ещё не цель." },
      { i: "3", h: "Разбей на недели", b: "Цель на 12 недель — это 12 недельных целей подряд. Гору не пройти одним шагом; раздели её на холмы, каждый из которых берётся за неделю. Близкий рубеж тянет сильнее далёкого." },
      { i: "4", h: "Привяжи одну привычку", b: "У каждой цели должна быть ежедневная опора. Не можешь назвать привычку, что двигает цель вперёд, — цель будет дрейфовать. Привычка — это цель, переведённая на язык сегодняшнего дня." },
      { i: "5", h: "Празднуй половину пути", b: "Середина — настоящий рубеж, а не «ещё столько же». Отметь её. Мозг, получивший награду за усилие, охотнее приходит и завтра. Без маленьких праздников выдыхаются даже большие цели." },
    ],
    pull: "«Результаты — это мечты. Привычки — это действие, у которого есть адрес.»",
    cta: "Поставить цель",
    next: { topic: "habits-basics", t: "Основы привычек", e: "🌱" },
  },
  "teams-101": {
    emoji: "🤝", accent: "#0A84FF", kicker: "Команда",
    title: "Командные привычки",
    lede: "Команда — это маленький круг людей с ОДНОЙ общей привычкой. Разница с личной простая: личную привычку видишь только ты, а командная — часть общей серии, и твою галочку кто-то ждёт. В одиночку легко договориться с собой и пропустить; но когда привычку держит команда, ты приходишь ради других даже в дни, когда не пришёл бы ради себя. Это не про контроль — про то, что рядом кто-то идёт тем же путём.",
    sections: [
      { i: "1", h: "Личная или командная?", b: "Личная привычка — для того, что зависит только от тебя: сон, дневник, утренняя зарядка. Командная — когда результат общий и держаться вместе легче: спорт с семьёй, учёба с друзьями, практики с клиентами тренинга. Правило простое: пропуск задевает только тебя — делай личной; тянете к одной цели вместе — собирай команду." },
      { i: "2", h: "Один якорь на всех", b: "У команды должна быть ОДНА общая главная привычка — то, что каждый делает каждый день. Не десять разных дел, а один общий ритуал. Общий якорь превращает набор людей в команду." },
      { i: "3", h: "Виден каждый", b: "Общая серия показывает, кто сегодня появился. Это мягкая ответственность: не «тебя накажут», а «тебя ждут». Знать, что твоя галочка нужна не только тебе, — сильнее любого будильника." },
      { i: "4", h: "Зови тех, кто рядом по цели", b: "Маленькая команда из тех, кому правда важно, сильнее большой случайной. Зови друзей, которые разделяют именно эту цель. Трое заряженных дадут больше, чем тридцать наблюдателей." },
      { i: "5", h: "Поддержка, не надзор", b: "Чат команды — место подбодрить и порадоваться, а не отчитать. Кто-то сорвался — верни его поддержкой, а не упрёком. Команда, в которую не стыдно вернуться, не разваливается." },
      { i: "6", h: "Победа — общая", b: "Дошли до недельной цели — отметьте это вместе. Общие маленькие победы умножают мотивацию: твой прогресс заряжает других, а их — тебя. Так привычка перестаёт быть обязанностью и становится «нашим делом»." },
    ],
    pull: "«Хочешь идти быстро — иди один. Хочешь идти далеко — идите вместе.»",
    cta: "Создать команду",
    next: { topic: "goals-101", t: "Ставь хорошие цели", e: "🎯" },
  },
};

/* ─── INFO SCREEN — knowledge articles (LIVE) ──────────────────── */
function InfoLive() {
  const { navigate, params } = useNav();
  const { open: openSheet } = useSheet();
  const topic = INFO_TOPICS_LIVE[params?.topic] || INFO_TOPICS_LIVE["habits-basics"];
  const accent = topic.accent || "#0a0a0a";
  const goCta = () => {
    if (params?.topic === "teams-101") return navigate("community");
    if (params?.topic === "goals-101") return openSheet(<GoalFormSheetLive mode="create" navigate={navigate} />);
    return openSheet(<HabitFormSheetLive mode="create" navigate={navigate} />);
  };
  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title={topic.title} onBack={() => navigate("habits")} />
      {/* Hero — accent-tinted, dark-aware */}
      <div style={{ background: "var(--card)", borderRadius: 22, padding: "22px 20px", boxShadow: "var(--card-shadow)", position: "relative", overflow: "hidden" }}>
        <div aria-hidden style={{ position: "absolute", top: -34, right: -26, width: 150, height: 150, borderRadius: "50%", background: accent, opacity: 0.10, pointerEvents: "none" }} />
        <div style={{ width: 56, height: 56, borderRadius: 16, background: accent + "1f", display: "grid", placeItems: "center", fontSize: 30, marginBottom: 12, position: "relative" }}>{topic.emoji}</div>
        <div style={{ fontSize: 11, color: accent, textTransform: "uppercase", letterSpacing: 1.6, fontWeight: 700, position: "relative" }}>{topic.kicker}</div>
        <div style={{ fontFamily: "var(--bos-title-font)", fontSize: 28, lineHeight: 1.15, letterSpacing: "-0.5px", marginTop: 5, color: "var(--text)", position: "relative" }}>{topic.title}</div>
        <div style={{ fontSize: 15, color: "var(--text-3)", marginTop: 12, lineHeight: 1.55, letterSpacing: "-0.1px", position: "relative" }}>{topic.lede}</div>
      </div>

      {/* Pull quote */}
      <div style={{ background: "#0a0a0a", color: "#fff", borderRadius: 22, padding: "20px 22px", marginTop: 12, position: "relative", overflow: "hidden" }}>
        <div aria-hidden style={{ position: "absolute", top: -10, right: -10, fontSize: 100, opacity: 0.06, fontFamily: "var(--bos-title-font)", lineHeight: 1 }}>"</div>
        <div aria-hidden style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: accent }} />
        <div style={{ fontFamily: "var(--bos-title-font)", fontSize: 18, lineHeight: 1.4, position: "relative" }}>{topic.pull}</div>
      </div>

      {/* Numbered sections */}
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {topic.sections.map((s, i) => (
          <div key={i} style={{ background: "var(--card)", borderRadius: 22, padding: 18, boxShadow: "var(--card-shadow)", display: "flex", gap: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: accent, color: "#fff", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{s.i}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.2px" }}>{s.h}</div>
              <div style={{ fontSize: 14, color: "var(--text-3)", marginTop: 6, lineHeight: 1.55, textWrap: "pretty" }}>{s.b}</div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button onClick={goCta} className="tap"
        style={{ width: "100%", background: "#0a0a0a", color: "#fff", border: 0, borderRadius: 999, padding: 16, fontSize: 15, fontWeight: 600, marginTop: 18 }}>
        {topic.cta}
      </button>

      {/* Up next */}
      {topic.next && (
        <button onClick={() => navigate("info", { topic: topic.next.topic })} className="tap"
          style={{ marginTop: 12, width: "100%", background: "transparent", border: 0, padding: 0, textAlign: "left" }}>
          <div style={{ background: "var(--card)", borderRadius: 22, padding: 14, display: "flex", alignItems: "center", gap: 12, boxShadow: "var(--card-shadow)" }}>
            <div style={{ width: 38, height: 38, borderRadius: 14, background: "var(--surface-3)", display: "grid", placeItems: "center", fontSize: 20 }}>{topic.next.e}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 600 }}>Далее</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{topic.next.t}</div>
            </div>
            <I.ChevronRight size={18} color="var(--text-4)"/>
          </div>
        </button>
      )}
    </div>
  );
}

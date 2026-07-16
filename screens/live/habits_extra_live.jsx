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

function HabitFormSheetLive({ mode = "create", habit = null, preset = null, goalFor: goalForProp = null, teamFor = null, navigate }) {
  const { open: openSheet, close } = useSheet();
  const app = useApp();
  const isDark = app?.themeOverride === "dark"; // тёмная тема: инверсия активных пилюль (чёрное→белое)
  const editing = mode === "edit" && !!habit;
  const params = { habit: habit }; // локальный шим: тело формы исторически читает params.habit
  // Создаём привычку ДЛЯ конкретной цели → после сохранения привяжем её к цели (habitIds) и вернёмся
  // в цель. goalOnly = «вести только внутри цели» (не показывать в общем списке привычек) — David: «час
  // рояля не хочу выводить на личную». (Существующая привычка тоже помнит goalOnly при редактировании.)
  const goalFor = goalForProp || null;
  const [view, setView] = useHS("form"); // form | picker | share | challenge — вторые вью ОДНОЙ шторки
  const [challengeC, setChallengeC] = useHS(null); // выбранный челлендж для вью «challenge» (возврат к форме)
  const [goalOnly, setGoalOnly] = useHS(editing ? !!params.habit.goalOnly : false);
  const [name, setName] = useHS(editing ? params.habit.name : (preset?.t || "Прогулка"));
  const [iconPick, setIconPick] = useHS(editing ? (typeof bosDeSF === "function" ? bosDeSF(params.habit.emoji) : params.habit.emoji) : (preset?.i || "👟")); // старые sf:-символы → эмодзи по смыслу
  // Icon = the EmojiPickerLive panel (opens straight on emojis). The iOS keyboard can't be
  // forced into emoji mode — it opened on ABC, «непонятно что делать» (David) — so we use
  // our own emoji sheet, opened by tapping the tile below.
  // Every habit carries an Apple colour now (coherent with the week-strip). Old null-colour
  // habits resolve to their stable bosHabitColor when edited.
  const [color, setColor] = useHS(editing ? (params.habit.color ?? (typeof bosHabitColor === "function" ? bosHabitColor(params.habit) : "#0a0a0a")) : (preset?.color ?? "#0a0a0a")); // новый = «Стандарт» (графит-нейтраль): графит на днях/чекбоксе, светло-серая плитка
  // СФЕРА БАЛАНСА. Раньше её всегда УГАДЫВАЛИ по названию, и намерение юзера терялось: кнопка
  // «+ в эту сферу» передавала preset.sphere, а форма это поле молча выбрасывала. Теперь явный
  // выбор пишется в привычку и побеждает угадывание (bosSphereFor). null = «Авто»: поля нет,
  // угадывание работает как прежде и следует за переименованием.
  const [sphere, setSphere] = useHS(editing ? (params.habit.sphere || null) : (preset?.sphere || null));
  const [goal, setGoal] = useHS(editing ? (params.habit.goalPerDay || 1) : 1);
  const [duration, setDuration] = useHS(editing ? (params.habit.duration || 0) : 0); // минуты; 0 = без таймера
  // Отмечать = просто ГАЛОЧКА по умолчанию. Тумблер «Считать количество» (countOn) раскрывает число +
  // единицу: «раз» (счётчик) или «минут» (таймер). Так три старых режима (галочка/счётчик/таймер тремя
  // кнопками — David: «громоздко») свернулись в один тумблер.
  const [countOn, setCountOn] = useHS(editing ? (params.habit.goalPerDay > 1 || params.habit.duration > 0) : false);
  const [countUnit, setCountUnit] = useHS(editing ? (params.habit.duration > 0 ? "min" : "times") : "times");
  const enableCount = (on) => { setCountOn(on); if (on) { if (countUnit === "min") { if (duration < 5) setDuration(15); } else if (goal < 2) setGoal(2); } };
  const pickUnit = (u) => { setCountUnit(u); if (u === "min") { if (duration < 5) setDuration(15); } else if (goal < 2) setGoal(2); };
  // «Тонированный фон» — плитка залита цветом привычки (по умолч.) или чистая, только значок.
  // Реально читается в HabitTileLive (не бутафория).
  const [cardTint, setCardTint] = useHS(editing ? (params.habit.cardTint === true) : false); // тон ВСЕЙ карточки; деф ВЫКЛ (David: обе белые по умолчанию)
  // Живое превью: карточка «Облик» в форме сама тонируется при cardTint (David: «сама карточка прямо там меняет тон»).
  const _pc = (typeof bosCanonColor === "function") ? bosCanonColor(color) : color;
  const _pTint = cardTint && _pc && _pc !== "#0a0a0a" && ("" + _pc).toLowerCase() !== "#8e8e93" && typeof bosGoalSkin === "function";
  const _pSk = _pTint ? bosGoalSkin(_pc, isDark, true) : null;
  // Days-of-week schedule — 7-long 0/1 mask, Пн..Вс. Default = every day.
  const [days, setDays] = useHS(editing && Array.isArray(params.habit.days) && params.habit.days.length === 7
    ? params.habit.days.slice()
    : ((preset && Array.isArray(preset.days) && preset.days.length === 7) ? preset.days.slice() : [1, 1, 1, 1, 1, 1, 1]));
  const toggleDay = (i) => setDays(d => d.map((v, j) => j === i ? (v ? 0 : 1) : v));
  // Тогл «Дни недели»: включён, если маска РЕАЛЬНО что-то исключает (не все семь дней).
  const [daysOn, setDaysOn] = useHS((typeof bosDaysMask === "function") ? !!bosDaysMask(editing && Array.isArray(params.habit.days) ? params.habit.days : null) : false);
  // «Нить дня» — кто когда отметился, лица на линии дня. По умолчанию ВКЛ; живёт во всём
  // совместном сама, тогл может погасить (David: базовый тогл, не отдельный экран настроек).
  const [threadOn, setThreadOn] = useHS(editing ? params.habit.threadOff !== true : true);
  // Reminder — a single setting: on/off + a time. Seeded from the habit when editing.
  const [reminderOn, setReminderOn] = useHS(editing ? !!(params.habit.reminder && params.habit.reminder.on) : false); // David-редизайн: спокойный минимум — напоминание opt-in (дни живут внутри)
  const [reminderTime, setReminderTime] = useHS(editing && params.habit.reminder && params.habit.reminder.time ? params.habit.reminder.time : (preset?.time || "09:00"));
  const [shareOn, setShareOn] = useHS(false); // David-редизайн: «Делать вместе» по умолчанию свёрнуто/выкл (opt-in)
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
  const [type, setType] = useHS(editing && params.habit.type ? params.habit.type : "build"); // build=Развивать / quit=Бросить
  // Якорь общей цели — только для командной привычки (teamFor). При правке берём из привычки, при
  // создании — подсказку teamFor.suggestMain (первую привычку круга делаем якорем).
  const [isMain, setIsMain] = useHS(teamFor && editing ? !!params.habit.isMain : (teamFor ? !!teamFor.suggestMain : false));

  // СОХРАНЕНИЕ — одна функция для «✓» в шапке и нижней кнопки (David: «галочка справа
  // вверху, чтобы не листать до низа»).
  const saveHabit = () => {
    const nm = name.trim() || "Новая привычка";
    // ОБЩАЯ (командная) привычка — ТА ЖЕ форма, но сохраняем в КОМАНДУ (create/update), не в личное.
    // Личные поля (напоминание/дни/тип/«вместе») для общего определения не пишем — они у каждого свои.
    if (teamFor) {
      const _gpdT = (countOn && countUnit === "times") ? Math.max(2, goal) : 1;
      if (teamFor.onSave) teamFor.onSave({ name: nm, emoji: iconPick, color, cardTint, goalPerDay: _gpdT, isMain: isMain }, editing ? params.habit.id : null);
      close();
      return;
    }
    // Persist the full schedule + reminder on the habit. These extra fields ride
    // along into the live snapshot (addHabit/updateHabit spread whatever you pass).
    const countTimes = countOn && countUnit === "times";
    const countMin = countOn && countUnit === "min";
    const base = {
      emoji: iconPick, name: nm, color, cardTint, type,        // cardTint = тон всей карточки; type = развивать/бросить
      days: days.slice(),                                  // 7-long Пн..Вс mask
      goalPerDay: countTimes ? Math.max(2, goal) : 1,      // счётчик: ≥2 раза (1 раз = обычная галочка); без верхнего потолка
      duration: countMin ? Math.max(5, duration) : 0,      // таймер: минуты
      reminder: { on: reminderOn, time: reminderTime },
      threadOff: !threadOn,                                // «Нить дня»: по умолчанию ВКЛ (false), тогл гасит
      sphere: sphere || null,                              // явная сфера баланса; null = угадывать по названию
    };
    if (!editing && preset && preset.challenge) base.challenge = preset.challenge; // разовый XP-бонус челленджа (derived)
    // Привычка ДЛЯ цели: несёт goalId (+ goalOnly = скрыть из общего списка). После создания
    // привязываем её к цели (habitIds) — деталь цели под шторкой обновится сама.
    if (goalFor) { base.goalId = goalFor.id; base.goalOnly = goalOnly; }
    // Публикуем расписание напоминания в облако (для пуша ботом, когда приложение закрыто). Ключ =
    // стабильный cloudId привычки; свой tz_offset (сервер не знает пояс). Выкл → удаляем строку.
    // Graceful: пока патч habit_reminders не прогнан — тихий no-op, ничего не ломается.
    const _syncReminder = (h) => {
      try {
        if (!(window.bosCloud && window.bosCloud.enabled())) return;
        const key = h && (h.cloudId || h.id);
        if (!key) return;
        if (reminderOn) {
          const tzOffset = -(new Date().getTimezoneOffset()); // Москва UTC+3 → +180
          window.bosCloud.upsertReminder(key, { name: nm, emoji: iconPick, time: reminderTime, days: days.slice(), tzOffset: tzOffset, active: true });
        } else { window.bosCloud.deleteReminder(key); }
      } catch (e) {}
    };
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
      if (editing) { app?.updateHabit(params.habit.id, base); _syncReminder(params.habit); }
      else { const nh = app?.addHabit(base); _syncReminder(nh); }
      openSheet(<ShareHabitSheetLive habit={{ name: nm, emoji: iconPick, color }} />);
      return;
    }
    if (editing) { app?.updateHabit(params.habit.id, base); _syncReminder(params.habit); }
    else { const nh = app?.addHabit(base); _syncReminder(nh); if (linkToGoal(nh)) { close(); return; } }
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
  // ВТОРОЙ ВЬЮ: правила ЧЕЛЛЕНДЖА внутри той же шторки (David: «нажимаю „может позже" — хочу остаться
  // в создании привычки, а не вылетать на главную»). «Начать» создаёт челлендж и закрывает; «Может,
  // позже» → onBack возвращает к форме с сохранённым вводом.
  if (view === "challenge" && challengeC && typeof ChallengeIntroSheet === "function") {
    return (
      <div className="bos-sheet-scroll" style={{ paddingTop: 2 }}>
        <ChallengeIntroSheet c={challengeC} dark={isDark} onStart={() => bosCommitChallenge(app, challengeC, { navigate, openSheet })} onBack={() => setView("form")} />
      </div>
    );
  }

  return (
    <div className="bos-sheet-scroll" style={{ paddingTop: 2, paddingLeft: 16, paddingRight: 16 }}>
      {/* Серый фон шторки + белые карточки — как страницы приложения (David). */}
      {typeof SheetGreyBgLive === "function" && <SheetGreyBgLive />}
      {typeof SheetFormHeadLive === "function"
        ? <SheetFormHeadLive title={teamFor ? (editing ? "Изменить общую привычку" : "Общая привычка") : (editing ? "Изменить привычку" : "Новая привычка")} onClose={close} onDone={saveHabit} />
        : <div style={{ textAlign: "center", fontSize: 18, fontWeight: 700, letterSpacing: "-0.3px", marginBottom: 2 }}>{teamFor ? (editing ? "Изменить общую привычку" : "Общая привычка") : (editing ? "Изменить привычку" : "Новая привычка")}</div>}

      {/* ── ОБЛИК: значок (тап → эмодзи) · имя · цвет · тонированный фон. Всё в одной карточке. ── */}
      <div style={{ background: _pTint ? _pSk.bg : "var(--card, #fff)", borderRadius: 22, padding: 14, boxShadow: _pTint ? _pSk.shadow : "var(--card-shadow)", marginTop: 6, transition: "background 0.25s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button type="button" data-haptic="selection" onClick={() => setView("picker")}
            style={{ width: 56, height: 56, borderRadius: 16, background: _pTint ? _pSk.iconBg : ((color && color !== BOS_GREY && ("" + color).toLowerCase() !== "#0a0a0a") ? color + "26" : "var(--surface-3)"), display: "grid", placeItems: "center", fontSize: 28, flexShrink: 0, border: 0, cursor: "pointer", transition: "background 0.2s" }}>
            {bosIcon(iconPick, 28, color)}
          </button>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Название привычки" aria-label="Название привычки"
            style={{ flex: 1, minWidth: 0, border: 0, outline: "none", background: "transparent", fontSize: 17, fontWeight: 600, color: _pTint ? _pSk.txt : "var(--text)", letterSpacing: "-0.2px", padding: "6px 0" }} />
        </div>
        <BosColorPickerLive value={color} onChange={setColor} />
        {/* Тонированный фон — сразу под цветом (David: «понравился тогл тонированный фон, под цветом»).
            У ОБЩЕЙ привычки скрыт: её плитка тоном не заливается, тумблер ни на что не влиял. */}
        {!teamFor && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid " + (_pTint ? (isDark ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.5)") : "var(--line-2, rgba(0,0,0,0.06))"), display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0, fontSize: 14, color: _pTint ? _pSk.txt : "var(--text-2)" }}>Тонированный фон
            <div style={{ fontSize: 12, color: _pTint ? _pSk.sub : "var(--text-4)", marginTop: 2, lineHeight: 1.4 }}>Вся карточка в цвете. Выключишь — карточка белая, цвет на значке и днях.</div>
          </div>
          <Switch small on={cardTint} onChange={setCardTint} />
        </div>
        )}
      </div>

      {/* ── ИЛИ НАЧНИ С ЧЕЛЛЕНДЖА — строка-скролл под обликом. Чипы В ТОМ ЖЕ СТИЛЕ, что на главной
          (bosQuickChipEl: стекло + SVG-глиф + матовая XP-пилюля — David: «уже разработали, перенеси»).
          Тап → правила ВНУТРИ формы (view «challenge»); «может позже» вернёт сюда. Только при создании
          ЛИЧНОЙ привычки. «Готовый челлендж» в меню «+» НЕ возвращаем. ── */}
      {!editing && !teamFor && !goalFor && typeof CHALLENGE_STARTERS !== "undefined" && typeof bosQuickChipEl === "function" && (
      <React.Fragment>
        <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1.3, color: "var(--text-4)", padding: "16px 4px 8px" }}>ИЛИ НАЧНИ С ЧЕЛЛЕНДЖА</div>
        <div className="bos-hscroll" style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch", margin: "0 -16px", padding: "0 16px 4px" }}>
          {CHALLENGE_STARTERS.map((c, i) => bosQuickChipEl(c, isDark, () => { if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} } setChallengeC(c); setView("challenge"); }, i))}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-4)", padding: "7px 4px 0", lineHeight: 1.4 }}>Челлендж — та же привычка, но с призом за серию. Тап → правила → старт.</div>
      </React.Fragment>
      )}

      {/* ── РАЗВИВАТЬ / БРОСИТЬ — тумблер (по умолч. Развивать). У общей привычки скрыт (не применимо). ── */}
      {!teamFor && (
      <div style={{ background: "var(--card, #fff)", borderRadius: 22, padding: 16, marginTop: 14, boxShadow: "var(--card-shadow)", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 24, display: "grid", placeItems: "center", flexShrink: 0 }}><I.Flame size={20} color="var(--text-3)" /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{type === "build" ? "Развивать" : "Бросить"}</div>
          <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2, lineHeight: 1.4 }}>{type === "build" ? "Отмечаю день, когда сделал." : "Отмечаю день без срыва."}</div>
        </div>
        <Switch small on={type === "build"} onChange={(v) => setType(v ? "build" : "quit")} />
      </div>
      )}

      {/* ── СЧИТАТЬ КОЛИЧЕСТВО — один тумблер вместо галочки/счётчика/таймера. On → число + раз/минут. ── */}
      <div style={{ background: "var(--card, #fff)", borderRadius: 22, padding: 16, marginTop: 14, boxShadow: "var(--card-shadow)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 24, display: "grid", placeItems: "center", flexShrink: 0 }}><I.Hash size={19} color="var(--text-3)" /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>Считать количество</div>
            {!countOn && <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2, lineHeight: 1.4 }}>Обычно — просто галочка. Включи, если считаешь разы или минуты.</div>}
          </div>
          <Switch small on={countOn} onChange={enableCount} />
        </div>
        {countOn && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line-2, rgba(0,0,0,0.06))" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 600 }}>{countUnit === "min" ? duration : goal} <span style={{ fontSize: 15, fontWeight: 500, color: "var(--text-3)" }}>{countUnit === "min" ? "мин" : "раз"}</span></div>
                <div style={{ fontSize: 13, color: "var(--text-4)" }}>{countUnit === "min" ? "отсчёт времени за день" : "или больше в день"}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => countUnit === "min" ? setDuration(Math.max(5, duration - 5)) : setGoal(Math.max(2, goal - 1))} className="tap hit44" style={{ width: 32, height: 32, borderRadius: 999, background: "var(--surface-3)", border: 0, display: "grid", placeItems: "center", color: "var(--text-2)" }}><I.Minus size={16} strokeWidth={2.4} /></button>
                <button onClick={() => countUnit === "min" ? setDuration(duration + 5) : setGoal(goal + 1)} className="tap hit44" style={{ width: 32, height: 32, borderRadius: 999, background: "var(--surface-3)", border: 0, display: "grid", placeItems: "center", color: "var(--text-2)" }}><I.Plus size={16} strokeWidth={2.4} /></button>
              </div>
            </div>
            {/* раз (счётчик) / минут (таймер) — сюда спрятался таймер. */}
            <div style={{ display: "flex", gap: 6, marginTop: 13 }}>
              {[{ v: "times", l: "раз" }, { v: "min", l: "минут" }].map(({ v, l }) => {
                const on = countUnit === v;
                return (
                  <button key={v} onClick={() => pickUnit(v)} className="tap" data-no-haptic aria-pressed={on}
                    style={{ flex: 1, borderRadius: 10, padding: "8px 0", fontSize: 13, fontWeight: 600, border: 0, cursor: "pointer",
                      background: on ? (isDark ? "#f2f2f5" : "#0a0a0a") : "var(--surface-3)", color: on ? (isDark ? "#0a0a0a" : "#fff") : "var(--text-2)" }}>{l}</button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── ЯКОРЬ ЦЕЛИ — только у общей привычки: главная привычка круга, по ней идёт прогресс цели. ── */}
      {teamFor && (
        <div style={{ background: "var(--card, #fff)", borderRadius: 22, padding: 16, marginTop: 14, boxShadow: "var(--card-shadow)", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 24, display: "grid", placeItems: "center", flexShrink: 0 }}><I.Target size={19} color="var(--text-3)" /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>Якорь цели</div>
            <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2, lineHeight: 1.4 }}>Главная привычка круга — по ней считается прогресс общей цели.</div>
          </div>
          <Switch small on={isMain} onChange={setIsMain} />
        </div>
      )}

      {/* ── СФЕРА БАЛАНСА — куда привычка идёт в колесе. «Авто» показывает, что угадало
            приложение, поэтому человек видит ошибку ДО сохранения и может поправить. ── */}
      {!teamFor && (
      <div style={{ background: "var(--card, #fff)", borderRadius: 22, padding: 16, marginTop: 14, boxShadow: "var(--card-shadow)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 24, display: "grid", placeItems: "center", flexShrink: 0 }}><I.Sparkles size={19} color="var(--text-3)" /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>Сфера баланса</div>
            <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2, lineHeight: 1.4 }}>
              {sphere ? "Выбрано вручную" : ("Авто: " + (function () {
                try { var g = bosSphereFor({ name: name, emoji: iconPick }); var s = (BOS_SPHERES || []).find(function (x) { return x.id === g; }); return s ? s.l : "Разум"; } catch (e) { return "Разум"; }
              })())}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line-2, rgba(0,0,0,0.06))", display: "flex", flexWrap: "wrap", gap: 6 }}>
          {[{ id: null, l: "Авто" }].concat(BOS_SPHERES || []).map(function (s) {
            var on = sphere === s.id;
            return (
              <button key={s.id || "auto"} type="button" className="tap tap-pill"
                onClick={() => { setSphere(s.id); if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} } }}
                style={{ border: 0, cursor: "pointer", borderRadius: 999, padding: "8px 13px", fontSize: 13.5, fontWeight: 700, fontFamily: "inherit",
                  background: on ? (isDark ? "#fff" : "#0a0a0a") : (isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)"),
                  color: on ? (isDark ? "#0a0a0a" : "#fff") : "var(--text-2)" }}>
                {s.id ? (s.e + " " + s.l) : s.l}
              </button>
            );
          })}
        </div>
      </div>
      )}

      {/* ── ДНИ НЕДЕЛИ — базовый тогл расписания (David, небо-нить-финал): по умолчанию каждый
            день; включил → выбрал свои дни. Пишет ту же маску days, что и раньше жила только
            внутри «Напоминания» — напоминание автоматически ходит по дням привычки. Пропуск
            чужого дня не рвёт серию (bosStreak), календарь гасит чужие клетки. ── */}
      {!teamFor && (
      <div style={{ background: "var(--card, #fff)", borderRadius: 22, padding: 16, marginTop: 14, boxShadow: "var(--card-shadow)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 24, display: "grid", placeItems: "center", flexShrink: 0 }}><I.Calendar size={19} color="var(--text-3)" /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>Дни недели</div>
            <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2, lineHeight: 1.4 }}>{daysOn ? daysSummary(days) : "Каждый день. Включи и выбери свои."}</div>
          </div>
          <Switch small on={daysOn} onChange={(v) => { setDaysOn(v); if (!v) setDays([1, 1, 1, 1, 1, 1, 1]); }} />
        </div>
        {daysOn && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line-2, rgba(0,0,0,0.06))", display: "flex", gap: 6, justifyContent: "space-between" }}>
            {WEEKDAY_LABELS.map((w, i) => {
              const on = !!days[i];
              return (
                <button key={i} className="tap" data-no-haptic onClick={() => toggleDay(i)} aria-pressed={on}
                  style={{ flex: 1, aspectRatio: "1/1", maxWidth: 34, borderRadius: "50%", border: 0, cursor: "pointer", fontSize: 11.5, fontWeight: 600, letterSpacing: "-0.2px",
                    background: on ? (isDark ? "#f2f2f5" : "#0a0a0a") : "var(--surface-3)", color: on ? (isDark ? "#0a0a0a" : "#fff") : "var(--text-4)",
                    boxShadow: on ? "0 2px 6px rgba(0,0,0,0.14)" : "none", transform: on ? "scale(1.04)" : "none", transition: "transform 0.12s, background 0.12s, color 0.12s" }}>{w}</button>
              );
            })}
          </div>
        )}
      </div>
      )}

      {/* ── НАПОМИНАНИЕ — тумблер → время. Дни переехали в свой ряд «Дни недели» выше — пуш
            ходит по дням привычки. У общей привычки скрыто (у каждого своё). ── */}
      {!teamFor && (
      <div style={{ background: "var(--card, #fff)", borderRadius: 22, padding: 16, marginTop: 14, boxShadow: "var(--card-shadow)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 24, display: "grid", placeItems: "center", flexShrink: 0 }}><I.Bell size={19} color="var(--text-3)" /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>Напоминание</div>
            <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2, lineHeight: 1.4 }}>{reminderOn ? (daysSummary(days) + " · напомним в " + reminderTime) : "Без напоминаний. Пуш придёт по дням привычки."}</div>
          </div>
          <Switch small on={reminderOn} onChange={setReminderOn} />
        </div>
        {reminderOn && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line-2, rgba(0,0,0,0.06))" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 14, color: "var(--text-2)" }}><I.Clock size={16} color="var(--text-3)" /> Время</span>
              <input type="time" value={reminderTime} onChange={e => setReminderTime(e.target.value || "09:00")}
                style={{ border: 0, outline: 0, background: "var(--surface-3)", borderRadius: 999, padding: "0 12px", height: 30, lineHeight: "30px", display: "inline-flex", alignItems: "center", fontSize: 14.5, fontWeight: 500, color: "var(--text)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.2px", WebkitAppearance: "none", appearance: "none", textAlign: "center" }} />
            </div>
          </div>
        )}
      </div>
      )}

      {/* ── ДЕЛАТЬ ВМЕСТЕ — тумблер → XP + друзья (opt-in). У общей привычки скрыто (это уже круг). ── */}
      {!goalFor && !teamFor && (
        <div data-tour="invite-friend" style={{ background: "var(--card, #fff)", borderRadius: 22, padding: 16, marginTop: 14, boxShadow: "var(--card-shadow)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 24, display: "grid", placeItems: "center", flexShrink: 0 }}><I.Users size={19} color="var(--text-3)" /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>Делать вместе</div>
              <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2, lineHeight: 1.4 }}>Позови друга — новый друг по ссылке даёт тебе +150 XP.</div>
            </div>
            <Switch small on={shareOn} onChange={setShareOn} />
          </div>
          {shareOn && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line-2, rgba(0,0,0,0.06))" }}>
              <div style={{ borderRadius: 14, padding: "11px 12px", background: isDark ? "rgba(52,199,89,0.13)" : "#edfaf0", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 30, height: 30, borderRadius: "50%", background: isDark ? "rgba(52,199,89,0.2)" : "#d6f3df", display: "grid", placeItems: "center", flexShrink: 0, fontSize: 15 }}>🤝</span>
                <div style={{ fontSize: 12.5, color: isDark ? "#7dd89b" : "#1a7a3a", lineHeight: 1.4 }}>Новый друг по твоей ссылке = <b>+150 XP</b>. А ведёте привычку вместе — каждая отметка <b>+15 XP</b> вместо +10.</div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap", alignItems: "center" }}>
                {shareFriends.length === 0 && (
                  <span style={{ fontSize: 12.5, color: "var(--text-4)", lineHeight: 1.4 }}>Пока некого выбрать — пригласи друга по ссылке.</span>
                )}
                {shareFriends.map((p, i) => (
                  <button key={i} onClick={() => setShareFriends(fs => fs.map((x, j) => j === i ? { ...x, on: !x.on } : x))} className="tap" style={{
                    display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px 5px 5px", borderRadius: 999,
                    background: p.on ? (isDark ? "#f2f2f5" : "#0a0a0a") : "var(--surface-3)", color: p.on ? (isDark ? "#0a0a0a" : "#fff") : "var(--text-3)", border: 0, fontSize: 12, fontWeight: 500 }}>
                    <BuddyFaceLive avatar={p.avatar} name={p.name} size={22} />{p.name}{p.on && <I.Check size={12} strokeWidth={3} />}
                  </button>
                ))}
                <button onClick={() => inviteFriend()} className="tap" style={{
                  display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 999,
                  background: "transparent", border: "1px dashed rgba(0,0,0,0.18)", color: "var(--text-3)", fontSize: 12, fontWeight: 500 }}><I.Plus size={12} /> Пригласить</button>
              </div>
              {inviteNote && (
                <div style={{ marginTop: 12, fontSize: 12.5, color: "var(--text-4)", lineHeight: 1.4, padding: "0 2px" }}>{inviteNote}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── ТАЙМЛАЙН — базовый тогл (David: «называй его везде таймлайн»): кто когда отметился,
            лица на линии дня. По умолчанию ВКЛ — включается сам, как только привычка совместная. ── */}
      {!teamFor && (
        <div style={{ background: "var(--card, #fff)", borderRadius: 22, padding: 16, marginTop: 14, boxShadow: "var(--card-shadow)", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 24, display: "grid", placeItems: "center", flexShrink: 0 }}><I.Sun size={19} color="var(--text-3)" /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>Таймлайн</div>
            <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2, lineHeight: 1.4 }}>Кто когда отметился — лица на линии дня. Живёт, когда ведёте вместе.</div>
          </div>
          <Switch small on={threadOn} onChange={setThreadOn} />
        </div>
      )}

      {/* Привычка ДЛЯ цели — «вести только внутри цели» (скрыть из общего списка). David: рояль. */}
      {goalFor && (
        <div style={{ background: "var(--card, #fff)", borderRadius: 22, padding: 16, marginTop: 14, boxShadow: "var(--card-shadow)", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 24, display: "grid", placeItems: "center", flexShrink: 0 }}><I.Target size={19} color="var(--text-3)" /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>Вести только внутри цели</div>
            <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2, lineHeight: 1.4 }}>Не в общем списке — привычка живёт внутри «{goalFor.name}».</div>
          </div>
          <Switch small on={goalOnly} onChange={setGoalOnly} />
        </div>
      )}

      {/* Общая привычка круга (правка) → «Удалить общую»; личная копия круга → «Убрать»; обычная → «Удалить». */}
      {teamFor && editing ? (
        <button className="tap" onClick={() => { if (teamFor.onDelete) teamFor.onDelete(params.habit.id); close(); }}
          style={{ width: "100%", background: "transparent", border: 0, color: "var(--accent-red)", padding: 14, marginTop: 6, fontSize: 15 }}>
          Удалить общую привычку
        </button>
      ) : editing && params.habit.teamHabitId ? (
        <React.Fragment>
          <div style={{ background: "var(--card, #fff)", borderRadius: 22, padding: 16, marginTop: 14, boxShadow: "var(--card-shadow)", display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ width: 34, height: 34, borderRadius: 11, background: "var(--surface-3)", display: "grid", placeItems: "center", fontSize: 16, flexShrink: 0 }}>👥</span>
            <div style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.5 }}>
              Это общая привычка круга — её условия задаёт создатель, а ведёте вы все вместе. Значок, цвет и напоминание у себя можешь менять как хочешь.
            </div>
          </div>
          <button className="tap" onClick={() => { app?.updateHabit && app.updateHabit(params.habit.id, { shelved: true }); close(); if (typeof navigate === "function") navigate("habits"); }}
            style={{ width: "100%", background: "transparent", border: 0, color: "var(--text-3)", padding: 14, marginTop: 6, fontSize: 15 }}>
            Убрать с моей страницы
          </button>
        </React.Fragment>
      ) : editing && (
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
  // РЕДАКТИРУЕМ СУЩЕСТВУЮЩИЙ КРУГ (команду), не соло-цель. Открывающий (карандаш в комнате круга)
  // маппит команду в goal-подобный объект с __isTeam=true (+ _id/cloudId/joined/__team). Тогда ЭТА
  // ЖЕ шторка редактирует и цель, и общую цель (David: «унифицировать; лишнюю шторку убрать»):
  // save → app.updateTeam (не promote), delete → выход/удаление круга, + ссылка на участников.
  const isTeamEdit = editing && !!(g0 && g0.__isTeam);
  const [view, setView] = useHS("form"); // form | picker — пикер = второй вью этой же шторки
  // Quick-add goal preset (from the Цели tab chip) → {i,t,target,unit,deadline}. Seeds the form so
  // tapping «Пробежать марафон» lands you on a pre-filled goal, same as habit quick-add presets.
  const preset = (!editing && presetProp) ? presetProp : null;
  const [name, setName] = useHS(g0?.name || preset?.t || "Пробежать марафон");
  const [iconPick, setIconPick] = useHS((typeof bosDeSF === "function" ? bosDeSF(g0?.emoji) : g0?.emoji) || preset?.i || "🎯"); // старые sf:-символы → эмодзи по смыслу
  // Goals carry a colour exactly like habits — default BLACK (the app's b&w base); the
  // chosen colour fills the goal's progress bar + detail ring (David: «всё один в один»).
  // Дефолт цвета ЦЕЛИ = НЕЙТРАЛЬНЫЙ (null → белая/светло-серая карточка, David). Цвет появляется
  // только если задан пресетом/пикером — тогда карточка заливается им (как партнёрские карточки).
  const [color, setColor] = useHS(g0?.color ?? preset?.color ?? "#0a0a0a"); // новый = «Стандарт» (графит-нейтраль), единый дефолт с привычками/командами
  const [tint, setTint] = useHS(g0 ? (g0.tint !== false) : false); // тон всей карточки цели (bosGoalSkin); деф ВЫКЛ (David: обе белые по умолчанию)
  // Живое превью: карточка «Облик» в форме цели тонируется при tint (David: «сама карточка меняет тон»).
  const _gpc = (typeof bosCanonColor === "function") ? bosCanonColor(color) : color;
  const _gTint = tint && _gpc && _gpc !== "#0a0a0a" && ("" + _gpc).toLowerCase() !== "#8e8e93" && typeof bosGoalSkin === "function";
  const _gSk = _gTint ? bosGoalSkin(_gpc, isDark, true) : null;
  const [target, setTarget] = useHS(g0?.target || preset?.target || 1); // старт с 1, без потолка (David: «в целях постоянно 22»)
  const [unit, setUnit] = useHS(g0?.unit || preset?.unit || "раз"); // дефолт = режим «Количество» (David: 3 простых режима)
  const [desc, setDesc] = useHS(g0?.desc || ""); // заметка создателя под целью; у команды синкается через goal.desc всем
  // Срок — храним ISO-дату (yyyy-mm-dd) у новых целей; старые «Месяц»/«14 окт» проходят как есть
  // (bosFmtDeadline красиво форматит и то, и другое). Дефолт = месяц от сегодня. Нативный date-пикер
  // вместо графитовых пилюль (David: «пилюли стрёмно, нужно элегантнее»).
  const _isoOf = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const _addDays = (n) => { var d = new Date(); d.setDate(d.getDate() + n); return d; };
  const _addMonths = (n) => { var d = new Date(); d.setMonth(d.getMonth() + n); return d; };
  const [deadline, setDeadline] = useHS(g0?.deadline || preset?.deadline || _isoOf(_addMonths(1)));
  const [linkHabit, setLinkHabit] = useHS(editing ? ((g0?.habitIds || []).length > 0) : false); // по умолч. свёрнуто/выкл (opt-in) — как в форме привычки
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
  // «Баланс круга» — раздел-аналитика на странице цели (кольцо-состояние круга + темп каждого).
  // По умолчанию ВКЛ; владелец может выключить. Хранится на команде (teams.circle_balance_on).
  const [circleBalanceOn, setCircleBalanceOn] = useHS(g0?.circleBalanceOn !== false);
  // «Нить дня» круга — по умолчанию ВКЛ; живёт в goal-jsonb команды (threadOff), без новой колонки.
  const [threadOn, setThreadOn] = useHS(!(g0?.threadOff === true || (g0?.goal && typeof g0.goal === "object" && g0.goal.threadOff === true)));
  const CIRCLE_MODES = [
    // Иконки режимов — монохромные SVG (David: «все системные модики у нас чёрно-белые SVG»): счёт = столбики, серия = пламя.
    { id: "collective", icon: I.ChartBar, t: "Общий счёт",     d: "Отметки всех складываются в одно число." },
    { id: "streak",     icon: I.Flame,    t: "Серия у каждого", d: "Каждый держит серию — засчитывается, только если прошли все." },
    // «Гонка» временно скрыта (David: «может вернём позже») — вернуть = раскомментировать.
    // { id: "race",    e: "🏁", t: "Гонка",           d: "Первый до цели побеждает, остальные получают часть XP." },
  ];
  // REAL — the user's own habits. Несём id (нужно, чтобы сохранить связь цель↔привычка). При
  // редактировании — заранее отмечаем уже привязанные (g0.habitIds). Эти отметки двигают кольцо цели.
  const [linkedHabits, setLinkedHabits] = useHS(() => (app?.habits || []).map((h) => ({ id: h.id, e: h.emoji || "✨", n: h.name, on: !!(g0 && (g0.habitIds || []).includes(h.id)) })));
  const toggleLinked = (i) => setLinkedHabits((hs) => hs.map((h, j) => (j === i ? { ...h, on: !h.on } : h)));
  // Единицы цели — чистые чипы (David: «в карточке цели что-то типа считать количество»); «своё» = произвольная.
  const GOAL_UNITS = ["раз", "км", "страниц", "минут", "часов", "кг"];
  const [customUnitOn, setCustomUnitOn] = useHS(!!unit && GOAL_UNITS.indexOf(unit) < 0);

  // СОХРАНЕНИЕ — одна функция для «✓» в шапке и нижней кнопки.
  const saveGoal = () => {
    const nm = name.trim() || "Новая цель";
    const tgt = Math.max(1, target);
    // КРУГ ВКЛ → ОДИН путь bosPromoteGoalToCircle (shared_live): создаёт настоящий круг, ПЕРЕНОСЯ
    // выбранные привычки как командные; при редактировании цель превращается на месте.
    if (circleOn) {
      const _stake = stakeOn ? Math.max(0, stakeAmount) : 0;
      const habitIds = linkHabit ? linkedHabits.filter((h) => h.on).map((h) => h.id) : [];
      // РЕДАКТИРОВАНИЕ существующего круга → app.updateTeam + облачный updateTeam (тот же save, что
      // был в удалённой TeamQuickEditSheetLive/TeamSettingsLive), НЕ promote (иначе создался бы второй
      // круг). Шторка над комнатой круга → close() открывает её, комната перечитывает app.teams живьём.
      if (isTeamEdit) {
        // БЕЗОПАСНЫЙ текст цели (David: в Сообществе показывало «[object Object]»): у облачного круга
        // g0.goal — это ОБЪЕКТ {title,target,unit,...}; старое `"" + g0.goal` давало «[object Object]»,
        // и эта строка уходила в облако (goal_kind) и на карточку. Берём title/строку, иначе строим из числа.
        // «[object Object]» из старого бага мог УЖЕ лежать в title/goal_kind в базе — такую
        // строку тоже отбрасываем, иначе мусор самоподдерживается при каждом сохранении
        // (David 2026-07-17: «на карточке появилось object-object»).
        const _san = (s) => (typeof s === "string" && s.trim() && s.indexOf("[object") < 0) ? s.trim() : null;
        const _gRaw = g0.goal;
        const goalText = _san(_gRaw)
          || (_gRaw && typeof _gRaw === "object" ? _san(_gRaw.title) : null)
          || (tgt + (unit ? " " + unit : ""));
        const _desc = (desc || "").trim();
        const patch = { name: nm, emblem: iconPick, accent: color, goal: goalText, vis: circleVis, type: goalType, target: tgt, unit, stake: _stake, deadline, desc: _desc, circleBalanceOn, threadOff: !threadOn };
        app?.updateTeam(g0._id, patch);
        try {
          if (g0.cloudId && window.bosCloud && window.bosCloud.enabled() && window.bosCloud.updateTeam) {
            window.bosCloud.updateTeam(g0.cloudId, { name: nm, emblem: iconPick, accent: color, vis: circleVis, goalKind: goalText, goalTarget: tgt, circleBalanceOn, goal: { type: goalType, target: tgt, unit, title: goalText, stake: _stake, desc: _desc, accent: color, threadOff: !threadOn } });
          }
        } catch (e) {}
        close();
        return;
      }
      const goalLike = { id: (editing && g0) ? g0.id : undefined, name: nm, emoji: iconPick, color, tint, target: tgt, unit, deadline: deadline || "Этот месяц", habitIds };
      if (preset && preset.challenge) goalLike.challenge = preset.challenge;
      close(); // шторку вниз — helper сам уводит в комнату круга и поднимает шторку приглашения
      if (typeof bosPromoteGoalToCircle === "function") {
        bosPromoteGoalToCircle(app, goalLike, { navigate, from: "habits", vis: circleVis, type: goalType, stake: _stake, circleBalanceOn, onShare: (t) => openSheet(<TeamShareSheetLive team={t} />) });
      }
      return;
    }
    // КРУГ ВЫКЛ → личная цель; habitIds наполняют её кольцо.
    const habitIds = linkHabit ? linkedHabits.filter((h) => h.on).map((h) => h.id) : [];
    const data = { emoji: iconPick, color, tint, name: nm, target: tgt, unit, deadline, circle: false, habitIds, desc: (desc || "").trim() };
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

  // Настройки круга — раскрываются ВНУТРИ карточки «Идти к цели вместе» (David: «раскрывается блок,
  // внутри режимы, а не отдельные блоки»). Режимы = лёгкие строки на сером; видимость = простой тумблер.
  const circleSettings = (
    <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line-2, rgba(0,0,0,0.06))" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {CIRCLE_MODES.map((m) => {
          const active = goalType === m.id;
          return (
            <button key={m.id} type="button" onClick={() => setGoalType(m.id)} className="tap" data-no-haptic
              style={{ background: active ? "transparent" : "var(--surface-2, #f2f2f4)", boxShadow: active ? ("inset 0 0 0 2px " + (isDark ? "#f2f2f5" : "#0a0a0a")) : "none", border: 0, borderRadius: 15, padding: 11, display: "flex", alignItems: "center", gap: 11, textAlign: "left", width: "100%", cursor: "pointer" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: active ? (isDark ? "#f2f2f5" : "#0a0a0a") : "#fff", color: active ? (isDark ? "#0a0a0a" : "#fff") : "var(--text)", display: "grid", placeItems: "center", fontSize: 15, flexShrink: 0, boxShadow: active ? "none" : "0 1px 3px rgba(0,0,0,0.08)" }}>{m.icon ? React.createElement(m.icon, { size: 17, color: active ? (isDark ? "#0a0a0a" : "#fff") : (isDark ? "#f2f2f5" : "#0a0a0a"), strokeWidth: 1.9 }) : m.e}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{m.t}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 1, lineHeight: 1.4 }}>{m.d}</div>
              </div>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: active ? (isDark ? "#f2f2f5" : "#0a0a0a") : "transparent", border: active ? "0" : "1.5px solid var(--text-5)", flexShrink: 0, display: "grid", placeItems: "center" }}>{active && <I.Check size={11} color={isDark ? "#0a0a0a" : "#fff"} strokeWidth={3} />}</div>
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Открытый круг</div>
          <div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 2, lineHeight: 1.4 }}>{circleVis === "public" ? "Виден в поиске — войдёт кто угодно." : "Только по личной ссылке-приглашению."}</div>
        </div>
        <Switch small on={circleVis === "public"} onChange={(v) => setCircleVis(v ? "public" : "private")} />
      </div>
      {/* «Таймлайн» круга — тот же базовый тогл, что у привычки (David): по умолчанию ВКЛ. */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Таймлайн</div>
          <div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 2, lineHeight: 1.4 }}>Кто когда отметился — лица на линии дня в комнате круга.</div>
        </div>
        <Switch small on={threadOn} onChange={setThreadOn} />
      </div>
      {/* Тумблер «Баланс круга» отложён 2026-07-13 (см. _parked/env-balance/). Переменная
          circleBalanceOn остаётся = true, протянута в сохранение — бэкенд не тронут. */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line-2, rgba(0,0,0,0.06))" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Поставить XP на финиш</div>
          <div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 2, lineHeight: 1.45 }}>Дойдёте — банк вернётся каждому. Азартно.</div>
        </div>
        <Switch small on={stakeOn} onChange={setStakeOn} />
      </div>
      {stakeOn && (
        <div style={{ marginTop: 12, display: "flex", alignItems: "baseline", gap: 8 }}>
          <input type="text" inputMode="numeric" pattern="[0-9]*" value={stakeAmount} onChange={(e) => setStakeAmount(parseInt(e.target.value.replace(/\D/g, "")) || 0)}
            style={{ flex: "0 0 74px", fontSize: 20, fontWeight: 700, color: "var(--text)", border: 0, outline: 0, background: "var(--surface-3)", borderRadius: 10, padding: "6px 10px", minWidth: 0 }} />
          <span style={{ fontSize: 13, color: "var(--text-4)" }}>XP с каждого</span>
        </div>
      )}
      <div style={{ marginTop: 13, borderRadius: 13, padding: "10px 12px", background: isDark ? "rgba(90,140,255,0.13)" : "#eef4ff", display: "flex", alignItems: "center", gap: 9 }}>
        <span style={{ width: 26, height: 26, borderRadius: "50%", background: isDark ? "rgba(90,140,255,0.2)" : "#dde9ff", display: "grid", placeItems: "center", flexShrink: 0, fontSize: 13 }}>🪐</span>
        <div style={{ fontSize: 12, color: isDark ? "#9db8ff" : "#2b5cb8", lineHeight: 1.4 }}>Сохранишь — цель станет общей, и сразу позовёшь людей по ссылке.</div>
      </div>
    </div>
  );

  return (
    <div className="bos-sheet-scroll" style={{ paddingTop: 2, paddingLeft: 16, paddingRight: 16 }}>
      {/* Серый фон шторки + белые карточки — как страницы приложения (David). */}
      {typeof SheetGreyBgLive === "function" && <SheetGreyBgLive />}
      {typeof SheetFormHeadLive === "function"
        ? <SheetFormHeadLive title={editing ? "Изменить цель" : "Новая цель"} onClose={close} onDone={saveGoal} />
        : <div style={{ textAlign: "center", fontSize: 18, fontWeight: 700, letterSpacing: "-0.3px", marginBottom: 2 }}>{editing ? "Изменить цель" : "Новая цель"}</div>}
      {!editing && typeof CreatePickerSheetLive === "function" && (
        <button onClick={() => openSheet(<CreatePickerSheetLive navigate={navigate} custom={false} />)} className="tap"
          style={{ display: "block", margin: "2px auto 0", background: "transparent", border: 0, padding: "4px 10px", fontSize: 12.5, fontWeight: 600, color: "var(--text-3)", cursor: "pointer" }}>
          или выбери готовый челлендж →
        </button>
      )}

      {/* ── ОБЛИК: значок · имя · цвет · тонированный фон (та же логика, что у привычки) ── */}
      <div style={{ background: _gTint ? _gSk.bg : "var(--card, #fff)", borderRadius: 22, padding: 13, boxShadow: _gTint ? _gSk.shadow : "var(--card-shadow)", marginTop: 6, transition: "background 0.25s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button type="button" data-haptic="selection" onClick={() => setView("picker")}
            style={{ width: 52, height: 52, borderRadius: 15, background: _gTint ? _gSk.iconBg : ((color && color !== BOS_GREY && ("" + color).toLowerCase() !== "#0a0a0a") ? color + "26" : "var(--surface-3)"), display: "grid", placeItems: "center", fontSize: 26, flexShrink: 0, border: 0, cursor: "pointer", transition: "background 0.2s" }}>
            {bosIcon(iconPick, 26, color)}
          </button>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Название цели" aria-label="Название цели"
            style={{ flex: 1, minWidth: 0, border: 0, outline: "none", background: "transparent", fontSize: 17, fontWeight: 600, color: _gTint ? _gSk.txt : "var(--text)", letterSpacing: "-0.2px", padding: "6px 0" }} />
        </div>
        {typeof BosColorPickerLive === "function" && <BosColorPickerLive value={color} onChange={setColor} />}
        <div style={{ marginTop: 11, paddingTop: 11, borderTop: "1px solid " + (_gTint ? (isDark ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.5)") : "var(--line-2, rgba(0,0,0,0.06))"), display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0, fontSize: 14, color: _gTint ? _gSk.txt : "var(--text-2)" }}>Тонированный фон
            <div style={{ fontSize: 12, color: _gTint ? _gSk.sub : "var(--text-4)", marginTop: 2, lineHeight: 1.4 }}>Карточка залита цветом. Выключишь — чистая, цвет в акценте.</div>
          </div>
          <Switch small on={tint} onChange={setTint} />
        </div>
      </div>

      {/* ── ЦЕЛЬ = «считать»: число + единица чипами (David: как счётчик привычки) ── */}
      <div style={{ background: "var(--card, #fff)", borderRadius: 22, padding: 14, marginTop: 12, boxShadow: "var(--card-shadow)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, minWidth: 0 }}>
          <input type="text" inputMode="numeric" pattern="[0-9]*" value={target}
            onChange={e => setTarget(parseInt(e.target.value.replace(/\D/g, "")) || 0)} className="goal-num"
            style={{ flex: "0 0 auto", width: 70, fontSize: 30, fontWeight: 800, letterSpacing: "-1px", color: "var(--text)", border: 0, outline: 0, background: "transparent", padding: 0, minWidth: 0 }} />
          <span style={{ fontSize: 16, fontWeight: 600, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{customUnitOn ? (unit || "своё") : unit}</span>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 11, overflowX: "auto", padding: "1px" }}>
          {GOAL_UNITS.map((u) => {
            const on = !customUnitOn && unit === u;
            return (
              <button key={u} onClick={() => { setUnit(u); setCustomUnitOn(false); }} className="tap" data-no-haptic
                style={{ flexShrink: 0, border: 0, borderRadius: 9, padding: "7px 13px", fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", cursor: "pointer",
                  background: on ? (isDark ? "#f2f2f5" : "#0a0a0a") : "var(--surface-3)", color: on ? (isDark ? "#0a0a0a" : "#fff") : "var(--text-3)" }}>{u}</button>
            );
          })}
          <button onClick={() => { setCustomUnitOn(true); if (GOAL_UNITS.indexOf(unit) >= 0) setUnit(""); }} className="tap" data-no-haptic
            style={{ flexShrink: 0, border: 0, borderRadius: 9, padding: "7px 13px", fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", cursor: "pointer",
              background: customUnitOn ? (isDark ? "#f2f2f5" : "#0a0a0a") : "var(--surface-3)", color: customUnitOn ? (isDark ? "#0a0a0a" : "#fff") : "var(--text-3)" }}>своё</button>
        </div>
        {customUnitOn && (
          <input type="text" value={unit || ""} onChange={e => setUnit(e.target.value)} placeholder="напр. книг, стаканов, кругов" aria-label="Своя единица"
            style={{ width: "100%", boxSizing: "border-box", marginTop: 9, border: 0, outline: 0, background: "var(--surface-3)", borderRadius: 11, padding: "10px 13px", fontSize: 14.5, fontWeight: 600, color: "var(--text)" }} />
        )}
        <div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 9 }}>Прогресс цели считается от этого числа.</div>
      </div>

      {/* ── ОПИСАНИЕ — заметка под целью (David). У команды/круга видят ВСЕ участники (goal.desc синк);
          у личной цели — под целью в её детали (g.desc). Показываем для ЛЮБОЙ цели. ── */}
      <div style={{ background: "var(--card, #fff)", borderRadius: 22, padding: 14, marginTop: 12, boxShadow: "var(--card-shadow)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 24, display: "grid", placeItems: "center", flexShrink: 0, fontSize: 17 }}>📝</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>Описание</div>
            <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2, lineHeight: 1.4 }}>{(isTeamEdit || circleOn) ? "Что важно помнить команде — покажется под целью." : "Короткая заметка — покажется под целью."}</div>
          </div>
        </div>
        <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} maxLength={280}
          placeholder={(isTeamEdit || circleOn) ? "Напр.: отмечаемся каждый вечер, поддерживаем друг друга" : "Зачем эта цель и как её достичь…"}
          style={{ width: "100%", boxSizing: "border-box", marginTop: 11, border: 0, outline: 0, background: "var(--surface-3)", borderRadius: 12, padding: "11px 13px", fontSize: 14, color: "var(--text)", resize: "none", fontFamily: "inherit", lineHeight: 1.45 }} />
      </div>

      {/* ── ИДТИ К ЦЕЛИ ВМЕСТЕ — поднято выше; настройки круга раскрываются ВНУТРИ карточки (David) ── */}
      {!isTeamEdit && (
        <div style={{ background: "var(--card, #fff)", borderRadius: 22, padding: 14, marginTop: 12, boxShadow: "var(--card-shadow)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 24, display: "grid", placeItems: "center", flexShrink: 0 }}><I.Users size={19} color="var(--text-3)" /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>Идти к цели вместе</div>
              <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2, lineHeight: 1.4 }}>Цель станет общей: общий счёт, лица круга, можно позвать по ссылке.</div>
            </div>
            <Switch small on={circleOn} onChange={setCircleOn} />
          </div>
          {circleOn && circleSettings}
        </div>
      )}
      {/* Редактирование существующего круга: настройки без тумблера, с шапкой */}
      {isTeamEdit && (
        <div style={{ background: "var(--card, #fff)", borderRadius: 22, padding: 14, marginTop: 12, boxShadow: "var(--card-shadow)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 24, display: "grid", placeItems: "center", flexShrink: 0 }}><I.Users size={19} color="var(--text-3)" /></span>
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>Настройки круга</div></div>
          </div>
          {circleSettings}
        </div>
      )}

      {/* ── СРОК — элегантно: строка + нативный выбор даты + лёгкие «+неделя» (без графитовых пилюль) ── */}
      <div style={{ background: "var(--card, #fff)", borderRadius: 22, padding: 14, marginTop: 12, boxShadow: "var(--card-shadow)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <span style={{ width: 22, display: "grid", placeItems: "center", flexShrink: 0 }}><I.Calendar size={18} color="var(--text-3)" /></span>
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>Срок</span>
          {/* Пилюля с ЧИТАЕМОЙ датой «4 авг»; прозрачный <input type=date> сверху открывает нативное
              iOS-колёсико по тапу (David: голый date-инпут выглядел ужасно). */}
          <label style={{ marginLeft: "auto", position: "relative", display: "inline-flex", alignItems: "center", background: "var(--surface-3)", borderRadius: 999, padding: "7px 14px", cursor: "pointer" }}>
            <span style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.2px" }}>{(typeof bosFmtDeadline === "function" ? bosFmtDeadline(deadline) : deadline) || "выбрать"}</span>
            <input type="date" value={/^\d{4}-\d{2}-\d{2}$/.test(deadline) ? deadline : ""} onChange={e => setDeadline(e.target.value || deadline)}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, border: 0, margin: 0, padding: 0, cursor: "pointer", WebkitAppearance: "none", appearance: "none" }} />
          </label>
        </div>
        <div style={{ display: "flex", gap: 15, marginTop: 12, paddingLeft: 33 }}>
          {[{ l: "неделя", d: () => _addDays(7) }, { l: "месяц", d: () => _addMonths(1) }, { l: "3 мес", d: () => _addMonths(3) }, { l: "год", d: () => _addMonths(12) }].map((q) => (
            <button key={q.l} onClick={() => setDeadline(_isoOf(q.d()))} className="tap" data-no-haptic
              style={{ border: 0, background: "transparent", padding: 0, cursor: "pointer", fontSize: 12.5, fontWeight: 600, color: "var(--text-4)" }}>
              <span style={{ color: "var(--text-5)" }}>+ </span>{q.l}
            </button>
          ))}
        </div>
      </div>

      {/* ── ПОДКРЕПИТЬ ПРИВЫЧКОЙ — свёрнутый тумблер (opt-in), SVG-иконка ── */}
      {!isTeamEdit && (
        <div style={{ background: "var(--card, #fff)", borderRadius: 22, padding: 14, marginTop: 12, boxShadow: "var(--card-shadow)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 24, display: "grid", placeItems: "center", flexShrink: 0 }}><I.Flame size={19} color="var(--text-3)" /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>Подкрепить привычкой</div>
              <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2, lineHeight: 1.4 }}>Каждая отметка привычки двигает цель.</div>
            </div>
            <Switch small on={linkHabit} onChange={setLinkHabit} />
          </div>
          {linkHabit && (
            <div style={{ display: "flex", gap: 8, marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line-2, rgba(0,0,0,0.06))", flexWrap: "wrap", alignItems: "center" }}>
              {linkedHabits.length === 0 && (
                <span style={{ fontSize: 12.5, color: "var(--text-4)", lineHeight: 1.4 }}>Сначала создай привычку — потом привяжешь её к цели.</span>
              )}
              {linkedHabits.map((h, i) => (
                <button key={i} className="tap" data-no-haptic onClick={() => toggleLinked(i)} style={{
                  display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px 5px 5px", borderRadius: 999,
                  background: h.on ? (isDark ? "#f2f2f5" : "#0a0a0a") : "var(--surface-3, #e8e8e8)", color: h.on ? (isDark ? "#0a0a0a" : "#fff") : "var(--text-3)",
                  border: 0, fontSize: 12, fontWeight: 500, transition: "background 0.15s, color 0.15s" }}>
                  <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#fff", display: "grid", placeItems: "center", fontSize: 13 }}>{bosIcon(h.e, 14, null)}</span>
                  {h.n}{h.on && <I.Check size={12} strokeWidth={3} />}
                </button>
              ))}
              <button className="tap" onClick={() => openSheet(<HabitFormSheetLive mode="create" navigate={navigate} />)} style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 999,
                background: "transparent", border: "1px dashed rgba(0,0,0,0.18)", color: "var(--text-3)", fontSize: 12, fontWeight: 500 }}><I.Plus size={12} /> Новая привычка</button>
            </div>
          )}
        </div>
      )}

      {/* КРУГ (редактирование): участники/роли — в полноэкранной странице. */}
      {isTeamEdit && (
        <button className="tap" onClick={() => { close(); if (typeof navigate === "function") navigate("team-settings", { team: g0.__team || g0, from: returnTo }); }}
          style={{ width: "100%", background: "transparent", border: 0, color: "var(--text-3)", padding: "12px", marginTop: 6, fontSize: 13.5, fontWeight: 600 }}>
          Участники и роли →
        </button>
      )}
      {editing && (
        <button className="tap" onClick={() => {
          if (isTeamEdit) {
            close();
            if (typeof bosConfirmExitTeam === "function") bosConfirmExitTeam({ app, team: g0.__team || g0, isOwner: !(g0.__team || g0).joined, navigate, openSheet, returnTo: returnTo || "habits" });
          } else {
            app?.removeGoal(g0.id); close(); if (typeof navigate === "function") navigate(returnTo || "habits");
          }
        }}
          style={{ width: "100%", background: "transparent", border: 0, color: "var(--accent-red)", padding: 14, marginTop: 6, fontSize: 15 }}>
          {isTeamEdit ? "Удалить совместную цель" : "Удалить цель"}
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
    next: { topic: "teams-101", t: "Совместные привычки", e: "🤝" },
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
    emoji: "🤝", accent: "#0A84FF", kicker: "Вместе",
    title: "Совместные привычки",
    lede: "Совместная цель — это несколько своих людей и ОДНА общая привычка. Разница с личной простая: личную привычку видишь только ты, а общая — часть общей серии, и твою галочку кто-то ждёт. В одиночку легко договориться с собой и пропустить; но когда привычку ведёте вместе, ты приходишь ради других даже в дни, когда не пришёл бы ради себя. Это не про контроль — про то, что рядом кто-то идёт тем же путём.",
    sections: [
      { i: "1", h: "Личная или общая?", b: "Личная привычка — для того, что зависит только от тебя: сон, дневник, утренняя зарядка. Общая — когда результат общий и держаться вместе легче: спорт с семьёй, учёба с друзьями, практики с клиентами тренинга. Правило простое: пропуск задевает только тебя — делай личной; тянете к одной цели вместе — заводи совместную цель." },
      { i: "2", h: "Один якорь на всех", b: "У совместной цели должна быть ОДНА общая главная привычка — то, что каждый делает каждый день. Не десять разных дел, а один общий ритуал. Общий якорь превращает набор людей в своих." },
      { i: "3", h: "Виден каждый", b: "Общая серия показывает, кто сегодня появился. Это мягкая ответственность: не «тебя накажут», а «тебя ждут». Знать, что твоя галочка нужна не только тебе, — сильнее любого будильника." },
      { i: "4", h: "Зови тех, кто рядом по цели", b: "Маленький круг из тех, кому правда важно, сильнее большого случайного. Зови друзей, которые разделяют именно эту цель. Трое заряженных дадут больше, чем тридцать наблюдателей." },
      { i: "5", h: "Поддержка, не надзор", b: "Общий чат — место подбодрить и порадоваться, а не отчитать. Кто-то сорвался — верни его поддержкой, а не упрёком. Круг, в который не стыдно вернуться, не разваливается." },
      { i: "6", h: "Победа — общая", b: "Дошли до недельной цели — отметьте это вместе. Общие маленькие победы умножают мотивацию: твой прогресс заряжает других, а их — тебя. Так привычка перестаёт быть обязанностью и становится «нашим делом»." },
    ],
    pull: "«Хочешь идти быстро — иди один. Хочешь идти далеко — идите вместе.»",
    cta: "Создать совместную цель",
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
      <PageHeader title={topic.title} onBack={() => navigate(params?.from || "habits")} />
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

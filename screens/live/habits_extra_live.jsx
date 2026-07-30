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
  // Дефолт 🚶 (а не 👟): его НЕТ в общей ленте эмодзи, и лента открывалась бы на смайликах,
  // ничего не подсветив. 🚶 в списке есть — лента сразу подъезжает к «людям в движении».
  const [iconPick, setIconPick] = useHS(editing ? (typeof bosDeSF === "function" ? bosDeSF(params.habit.emoji) : params.habit.emoji) : (preset?.i || "🚶")); // старые sf:-символы → эмодзи по смыслу
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
  // Тумблер «Тонированный фон» УБРАН (David 2026-07-29): привычки живут единым белым блоком,
  // цвет — только на значке, днях и чекбоксе. Существующее поле привычки сохраняем как есть
  // (не стираем чужой выбор), но новые/правленые пишутся без тона. Тело тумблера — в git до v816.
  const cardTint = editing ? (params.habit.cardTint === true) : false;
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
  // ⚠️ ХУКИ ТОЛЬКО ЗДЕСЬ, ДО ранних return'ов (view === picker/share/challenge). Один раз уже
  //    поймали React #300 «rendered fewer hooks»: useState/useMemo, объявленные ниже, при уходе
  //    в эмодзи-пикер просто не вызывались — и экран падал в «Что-то сбилось».
  // Какая строка блока «Ещё» раскрыта (сфера / тип) — раскрывается ВНУТРИ своей карточки.
  const [more, setMore] = useHS(null);
  // ЗНАЧОК — ОДНА ЛЕНТА, прокрутка вправо (David 2026-07-29). Было: сетка из 18 «частых», которая
  // ПЕРЕСТРАИВАЛАСЬ на каждый выбор («это тупо»), плюс «Ещё» с отдельной шторкой («вообще
  // неприкольно»). Теперь порядок ФИКСИРОВАННЫЙ, при выборе ничего не двигается, второй шторки нет.
  //
  // ВНИМАНИЕ, ключевое: лента — это список ЭМОДЗИ, а рисуется он кастомными иконками (bosIcon).
  // Так и сохранение, и облако, и сервер пушей продолжают получать ровно эмодзи, как всегда
  // (см. контракт в core/glyphs.jsx). Тут НЕЛЬЗЯ подставить id иконки — сломается всё разом.
  const _emojiBase = (typeof BOS_GLYPH_ORDER !== "undefined" && BOS_GLYPH_ORDER.length)
    ? BOS_GLYPH_ORDER.map(bosGlyphEmoji)
    : ((typeof BOS_EMOJI_ALL !== "undefined" && BOS_EMOJI_ALL.length) ? BOS_EMOJI_ALL : ["🚶", "🏃", "💧", "📖", "🧘", "☀️"]);
  // Значок старой привычки может быть ВНЕ общего списка (легаси, «sf:*»→эмодзи, чужой набор) —
  // тогда в ленте не подсветилось бы ничего и человек не видел бы свой текущий значок. Такой
  // ставим первым. Порядок ленты от этого не «пляшет»: выбор ИЗ ленты всегда уже в списке.
  const _emojiAll = React.useMemo(function () {
    return (iconPick && _emojiBase.indexOf(iconPick) < 0) ? [iconPick].concat(_emojiBase) : _emojiBase;
  }, [iconPick]);
  const _stripRef = React.useRef(null);
  // Подвести ленту к выбранному значку — но ТОЛЬКО при открытии/возврате в форму, не на каждый
  // тап: иначе лента дёргалась бы под пальцем (ровно та беда, что была у перестраивающейся сетки).
  React.useEffect(function () {
    if (view !== "form") return;
    var el = _stripRef.current; if (!el) return;
    var sel = el.querySelector('[data-sel="1"]'); if (!sel) return;
    var want = sel.offsetLeft - el.clientWidth / 2 + sel.offsetWidth / 2;
    if (want > 8) el.scrollLeft = want;
  }, [view]);

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
    // goalCloudId — ВЕЧНАЯ ссылка на цель: локальный goalId умирает при восстановлении из
    // облака (счётчик _nid), и без вечной ссылки привычка-призрак теряла свою цель навсегда.
    if (goalFor) { base.goalId = goalFor.id; base.goalCloudId = goalFor.cloudId || null; base.goalOnly = goalOnly; }
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
      // Вечная ссылка и с этой стороны: цель помнит привычку по cloudId — переживает восстановление.
      const cids = (((g && g.habitCloudIds) || [])).concat(nh.cloudId ? [nh.cloudId] : []);
      app?.updateGoal(goalFor.id, { habitIds: ids, habitCloudIds: cids });
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

  // ВЬЮ «picker» УБРАН (David 2026-07-29: «на „Ещё" вылетает ещё одна шторка — неприкольно»).
  // Все эмодзи теперь живут ЛЕНТОЙ прямо в форме (секция ЗНАЧОК ниже). EmojiPickerLive жив и
  // работает у цели, круга и аватара — это только про форму привычки.
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

  // ── МЕЛКИЕ КИРПИЧИ ФОРМЫ (редизайн 2026-07-29, David: «шторка переусложнённая, хочется проще,
  //    но не потерять функционал»). Было: 8 одинаковых белых карточек «иконка + заголовок + абзац +
  //    тумблер» — всё весит одинаково, глаз не находит главного. Стало: заголовок секции = мелкая
  //    серая СТРОЧКА, выбор из вариантов = СЕГМЕНТ (а не тумблер, за которым прячется второй
  //    вариант), редкое = строки со значением в блоке «Ещё». Макет: design-mockups/2026-07-29-создание-привычки.html
  const _CARD = { background: "var(--card, #fff)", borderRadius: 20, boxShadow: "var(--card-shadow)", padding: "13px 14px" };
  const _CARD_TIGHT = { background: "var(--card, #fff)", borderRadius: 20, boxShadow: "var(--card-shadow)", padding: "2px 14px" };
  const _hair = "1px solid var(--line-2, rgba(0,0,0,0.06))";
  const _accent = (color && color !== BOS_GREY && ("" + color).toLowerCase() !== "#0a0a0a") ? color : null;
  const Lab = ({ children, action, onAction }) => (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "16px 6px 8px" }}>
      <span style={{ flex: 1, fontSize: 10.5, fontWeight: 800, letterSpacing: 1.3, color: "var(--text-4)" }}>{children}</span>
      {action && (
        <button type="button" onClick={onAction} className="tap" data-haptic="selection"
          style={{ border: 0, background: "transparent", padding: 0, fontSize: 12.5, fontWeight: 600, color: "var(--text-3)", cursor: "pointer", fontFamily: "inherit" }}>{action} ›</button>
      )}
    </div>
  );
  // Сегмент в языке iOS — тот же материал, что пилюля круга: серый жёлоб + светлый бегунок.
  const Seg = ({ items, value, onPick }) => (
    <div style={{ display: "flex", gap: 3, borderRadius: 13, padding: 3, background: isDark ? "rgba(255,255,255,0.07)" : "rgba(10,10,10,0.055)" }}>
      {items.map(([v, l]) => {
        const on = value === v;
        return (
          <button key={v} type="button" className="tap" data-haptic="selection" onClick={() => onPick(v)} aria-pressed={on}
            style={{ flex: 1, border: 0, cursor: "pointer", borderRadius: 10, padding: "9px 0", fontSize: 13, fontFamily: "inherit",
              fontWeight: on ? 700 : 600, color: on ? "var(--text)" : "var(--text-3)",
              background: on ? (isDark ? "rgba(255,255,255,0.16)" : "#fff") : "transparent",
              boxShadow: on ? (isDark ? "none" : "0 1px 3px rgba(0,0,0,0.11), 0 0 0 0.5px rgba(0,0,0,0.03)") : "none",
              transition: "background .15s, box-shadow .15s" }}>{l}</button>
        );
      })}
    </div>
  );
  // Строка списка: имя слева, ЗНАЧЕНИЕ справа (его видно не открывая) + шеврон или тумблер.
  const Row = ({ label, sub, value, onTap, right, first }) => {
    const inner = (
      <React.Fragment>
        <span style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
          <span style={{ display: "block", fontSize: 15, fontWeight: 500, color: "var(--text)" }}>{label}</span>
          {sub ? <span style={{ display: "block", fontSize: 12, color: "var(--text-4)", marginTop: 2, lineHeight: 1.35 }}>{sub}</span> : null}
        </span>
        {value != null ? <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-3)", flexShrink: 0 }}>{value}</span> : null}
        {onTap ? <I.ChevronRight size={15} color="var(--text-4)" /> : null}
        {right || null}
      </React.Fragment>
    );
    const st = { display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "12px 0", border: 0, borderTop: first ? 0 : _hair, background: "transparent" };
    return onTap
      ? <button type="button" className="tap" data-haptic="selection" onClick={onTap} style={{ ...st, cursor: "pointer", fontFamily: "inherit" }}>{inner}</button>
      : <div style={st}>{inner}</div>;
  };
  // КАК ОТМЕЧАТЬ = один сегмент вместо тумблера «Считать количество» + строки «раз/минут».
  // Внутри живут те же countOn/countUnit — контракт сохранения не тронут.
  const markMode = !countOn ? "check" : (countUnit === "min" ? "min" : "times");
  const pickMark = (m) => {
    if (m === "check") { setCountOn(false); return; }
    if (!countOn) enableCount(true);
    pickUnit(m === "min" ? "min" : "times");
  };
  const _sphereAuto = (function () {
    try { var g = bosSphereFor({ name: name, emoji: iconPick }); var s2 = (BOS_SPHERES || []).find(function (x) { return x.id === g; }); return s2 ? s2.l : "Разум"; } catch (e) { return "Разум"; }
  })();
  const _sphereVal = sphere ? ((((BOS_SPHERES || []).find(function (x) { return x.id === sphere; })) || {}).l || "Своя") : ("Авто: " + _sphereAuto);

  return (
    <div className="bos-sheet-scroll" style={{ paddingTop: 2, paddingLeft: 16, paddingRight: 16 }}>
      {/* Серый фон шторки + белые карточки — как страницы приложения (David). */}
      {typeof SheetGreyBgLive === "function" && <SheetGreyBgLive />}
      {typeof SheetFormHeadLive === "function"
        ? <SheetFormHeadLive title={teamFor ? (editing ? "Изменить общую привычку" : "Общая привычка") : (editing ? "Изменить привычку" : "Новая привычка")} onClose={close} onDone={saveHabit} />
        : <div style={{ textAlign: "center", fontSize: 18, fontWeight: 700, letterSpacing: "-0.3px", marginBottom: 2 }}>{teamFor ? (editing ? "Изменить общую привычку" : "Общая привычка") : (editing ? "Изменить привычку" : "Новая привычка")}</div>}

      {/* ── ШАПКА: значок + имя. Первое дело — назвать привычку, поэтому оно первой строкой. ── */}
      <div style={{ ..._CARD, marginTop: 6, display: "flex", alignItems: "center", gap: 12 }}>
        <button type="button" data-haptic="selection" className="tap" aria-label="Показать значок в ленте"
          onClick={() => { try { var el = _stripRef.current, sel = el && el.querySelector('[data-sel="1"]'); if (sel) el.scrollTo({ left: Math.max(0, sel.offsetLeft - el.clientWidth / 2 + sel.offsetWidth / 2), behavior: "smooth" }); } catch (e) {} }}
          style={{ width: 52, height: 52, borderRadius: 16, display: "grid", placeItems: "center", fontSize: 27, flexShrink: 0, border: 0, cursor: "pointer", transition: "background 0.2s",
            background: _accent ? _accent + "26" : "var(--surface-3)" }}>
          {bosIcon(iconPick, 27, color)}
        </button>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Название привычки" aria-label="Название привычки"
          style={{ flex: 1, minWidth: 0, border: 0, outline: "none", background: "transparent", fontSize: 17, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.2px", padding: "6px 0" }} />
      </div>

      {/* ── ЗНАЧОК: одна лента всех эмодзи, скролл вправо. Без «Ещё» и второй шторки. ── */}
      <Lab>ЗНАЧОК</Lab>
      <div style={{ ..._CARD, padding: "11px 0" }}>
        {/* ТРИ РЯДА, которые едут вправо ЦЕЛИКОМ (David 2026-07-29: «в один ряд очень долгий скролл»).
            grid-auto-flow: column — значки идут сверху вниз, потом следующая колонка, поэтому порядок
            остаётся сплошным, а длина прокрутки втрое короче. */}
        <div ref={_stripRef} className="bos-hscroll"
          style={{ position: "relative", display: "grid", gridTemplateRows: "repeat(3, auto)", gridAutoFlow: "column", gridAutoColumns: "max-content", gap: 7, overflowX: "auto", overflowY: "hidden", scrollbarWidth: "none", WebkitOverflowScrolling: "touch", touchAction: "pan-x", padding: "0 12px" }}>
          {_emojiAll.map((e, i) => {
            const on = e === iconPick;
            return (
              <button key={e + i} type="button" className="tap" data-no-haptic data-sel={on ? "1" : null} aria-pressed={on}
                onClick={() => { setIconPick(e); if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e2) {} } }}
                style={{ width: 42, height: 42, flexShrink: 0, borderRadius: "50%", border: 0, cursor: "pointer", fontSize: 21, lineHeight: 1, padding: 0,
                  display: "grid", placeItems: "center", color: on ? (_accent || "var(--text)") : "var(--text)",
                  background: on ? (_accent ? _accent + "2b" : (isDark ? "rgba(255,255,255,0.16)" : "#e7e7ec")) : (isDark ? "rgba(255,255,255,0.07)" : "var(--surface-3)"),
                  boxShadow: on ? "inset 0 0 0 2px " + (_accent || "var(--text)") : "none",
                  transition: "background .15s, box-shadow .15s" }}>{bosIcon(e, 21, null)}</button>
            );
          })}
        </div>
      </div>

      {/* ── ЦВЕТ ── */}
      <Lab>ЦВЕТ</Lab>
      <div style={{ ..._CARD, padding: "1px 6px" }}><BosColorPickerLive value={color} onChange={setColor} /></div>

      {/* ── КАК ОТМЕЧАТЬ — сегмент вместо тумблера: второй вариант видно заранее, на тап короче.
            Число со «−/+» раскрывается ВНУТРИ этой же карточки. ── */}
      <Lab>КАК ОТМЕЧАТЬ</Lab>
      <div style={_CARD}>
        <Seg value={markMode} onPick={pickMark} items={[["check", "Галочка"], ["times", "Счётчик"], ["min", "Таймер"]]} />
        {markMode !== "check" && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: _hair, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div>
              <div style={{ fontSize: 21, fontWeight: 600, letterSpacing: "-0.4px" }}>{markMode === "min" ? duration : goal} <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-3)" }}>{markMode === "min" ? "мин" : "раз"}</span></div>
              <div style={{ fontSize: 12.5, color: "var(--text-4)", marginTop: 1 }}>{markMode === "min" ? "отсчёт времени за день" : "или больше в день"}</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button type="button" onClick={() => markMode === "min" ? setDuration(Math.max(5, duration - 5)) : setGoal(Math.max(2, goal - 1))} className="tap hit44" aria-label="Меньше"
                style={{ width: 32, height: 32, borderRadius: 999, background: "var(--surface-3)", border: 0, display: "grid", placeItems: "center", color: "var(--text-2)", cursor: "pointer" }}><I.Minus size={16} strokeWidth={2.4} /></button>
              <button type="button" onClick={() => markMode === "min" ? setDuration(duration + 5) : setGoal(goal + 1)} className="tap hit44" aria-label="Больше"
                style={{ width: 32, height: 32, borderRadius: 999, background: "var(--surface-3)", border: 0, display: "grid", placeItems: "center", color: "var(--text-2)", cursor: "pointer" }}><I.Plus size={16} strokeWidth={2.4} /></button>
            </div>
          </div>
        )}
      </div>

      {/* ── КОГДА — сегмент вместо тумблера «Дни недели». Пишет ту же маску days. ── */}
      {!teamFor && (
      <React.Fragment>
        <Lab>КОГДА</Lab>
        <div style={_CARD}>
          <Seg value={daysOn ? "own" : "every"} onPick={(v) => { const on = v === "own"; setDaysOn(on); if (!on) setDays([1, 1, 1, 1, 1, 1, 1]); }}
            items={[["every", "Каждый день"], ["own", "Свои дни"]]} />
          {daysOn && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: _hair, display: "flex", gap: 6, justifyContent: "space-between" }}>
              {WEEKDAY_LABELS.map((w, i) => {
                const on = !!days[i];
                return (
                  <button key={i} type="button" className="tap" data-no-haptic onClick={() => toggleDay(i)} aria-pressed={on}
                    style={{ flex: 1, aspectRatio: "1/1", maxWidth: 34, borderRadius: "50%", border: 0, cursor: "pointer", fontSize: 11.5, fontWeight: 600, letterSpacing: "-0.2px",
                      background: on ? (isDark ? "#f2f2f5" : "#0a0a0a") : "var(--surface-3)", color: on ? (isDark ? "#0a0a0a" : "#fff") : "var(--text-4)",
                      boxShadow: on ? "0 2px 6px rgba(0,0,0,0.14)" : "none", transform: on ? "scale(1.04)" : "none", transition: "transform 0.12s, background 0.12s, color 0.12s" }}>{w}</button>
                );
              })}
            </div>
          )}
        </div>
      </React.Fragment>
      )}

      {/* ── НАПОМИНАНИЕ — строка-тумблер, под ней строка «Время» (пуш ходит по дням привычки). ── */}
      {!teamFor && (
      <React.Fragment>
        <Lab>НАПОМИНАНИЕ</Lab>
        <div style={_CARD_TIGHT}>
          <Row first label="Напомнить" right={<Switch small on={reminderOn} onChange={setReminderOn} />} />
          {reminderOn && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", borderTop: _hair }}>
              <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: "var(--text)" }}>Время</span>
              <input type="time" value={reminderTime} onChange={e => setReminderTime(e.target.value || "09:00")} aria-label="Время напоминания"
                style={{ border: 0, outline: 0, background: _accent ? _accent + "22" : "var(--surface-3)", color: _accent || "var(--text)", borderRadius: 999, padding: "0 12px", height: 32, lineHeight: "32px", display: "inline-flex", alignItems: "center", fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.2px", WebkitAppearance: "none", appearance: "none", textAlign: "center" }} />
            </div>
          )}
        </div>
        {reminderOn && <div style={{ fontSize: 11.5, color: "var(--text-4)", padding: "7px 8px 0", lineHeight: 1.4 }}>{daysSummary(days) + " · напомним в " + reminderTime}</div>}
      </React.Fragment>
      )}

      {/* ── ЕЩЁ — редкое: строки со ЗНАЧЕНИЕМ (проверить можно не открывая). Сфера и тип
            раскрываются внутри этой же карточки, тумблеры стоят прямо в строке. ── */}
      <Lab>ЕЩЁ</Lab>
      <div style={_CARD_TIGHT}>
        {!teamFor && (
        <React.Fragment>
          <Row first label="Сфера баланса" value={_sphereVal} onTap={() => setMore(more === "sphere" ? null : "sphere")} />
          {more === "sphere" && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "0 0 12px" }}>
              {[{ id: null, l: "Авто" }].concat(BOS_SPHERES || []).map(function (sp) {
                var on = sphere === sp.id;
                return (
                  <button key={sp.id || "auto"} type="button" className="tap tap-pill"
                    onClick={() => { setSphere(sp.id); if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} } }}
                    style={{ border: 0, cursor: "pointer", borderRadius: 999, padding: "8px 13px", fontSize: 13.5, fontWeight: 700, fontFamily: "inherit",
                      background: on ? (isDark ? "#fff" : "#0a0a0a") : (isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)"),
                      color: on ? (isDark ? "#0a0a0a" : "#fff") : "var(--text-2)" }}>
                    {sp.id ? (sp.e + " " + sp.l) : sp.l}
                  </button>
                );
              })}
            </div>
          )}
          <Row label="Тип привычки" value={type === "build" ? "Развивать" : "Бросить"} onTap={() => setMore(more === "type" ? null : "type")} />
          {more === "type" && (
            <div style={{ padding: "0 0 12px" }}>
              <Seg value={type} onPick={setType} items={[["build", "Развивать"], ["quit", "Бросить"]]} />
              <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 8, lineHeight: 1.4 }}>{type === "build" ? "Отмечаю день, когда сделал." : "Отмечаю день без срыва."}</div>
            </div>
          )}
        </React.Fragment>
        )}

        {/* Якорь цели — только у общей привычки круга: по ней идёт прогресс общей цели. */}
        {teamFor && (
          <Row first label="Якорь цели" sub="Главная привычка круга — по ней считается прогресс общей цели." right={<Switch small on={isMain} onChange={setIsMain} />} />
        )}

        {/* Делать вместе — тот же opt-in и тот же экран приглашения. */}
        {!goalFor && !teamFor && (
          <div data-tour="invite-friend">
            <Row label="Делать вместе" sub="Друг по ссылке — тебе +150 XP" right={<Switch small on={shareOn} onChange={setShareOn} />} />
            {shareOn && (
              <div style={{ padding: "0 0 12px" }}>
                <div style={{ borderRadius: 14, padding: "11px 12px", background: isDark ? "rgba(52,199,89,0.13)" : "#edfaf0", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 30, height: 30, borderRadius: "50%", background: isDark ? "rgba(52,199,89,0.2)" : "#d6f3df", display: "grid", placeItems: "center", flexShrink: 0, fontSize: 15 }}>🤝</span>
                  <div style={{ fontSize: 12.5, color: isDark ? "#7dd89b" : "#1a7a3a", lineHeight: 1.4 }}>Новый друг по твоей ссылке = <b>+150 XP</b>. А ведёте привычку вместе — каждая отметка <b>+15 XP</b> вместо +10.</div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
                  {shareFriends.length === 0 && (
                    <span style={{ fontSize: 12.5, color: "var(--text-4)", lineHeight: 1.4 }}>Пока некого выбрать — пригласи друга по ссылке.</span>
                  )}
                  {shareFriends.map((pp, i) => (
                    <button key={i} type="button" onClick={() => setShareFriends(fs => fs.map((x, j) => j === i ? { ...x, on: !x.on } : x))} className="tap" style={{
                      display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px 5px 5px", borderRadius: 999,
                      background: pp.on ? (isDark ? "#f2f2f5" : "#0a0a0a") : "var(--surface-3)", color: pp.on ? (isDark ? "#0a0a0a" : "#fff") : "var(--text-3)", border: 0, fontSize: 12, fontWeight: 500 }}>
                      <BuddyFaceLive avatar={pp.avatar} name={pp.name} size={22} />{pp.name}{pp.on && <I.Check size={12} strokeWidth={3} />}
                    </button>
                  ))}
                  <button type="button" onClick={() => inviteFriend()} className="tap" style={{
                    display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 999,
                    background: "transparent", border: "1px dashed rgba(0,0,0,0.18)", color: "var(--text-3)", fontSize: 12, fontWeight: 500 }}><I.Plus size={12} /> Пригласить</button>
                </div>
                {inviteNote && (
                  <div style={{ marginTop: 10, fontSize: 12.5, color: "var(--text-4)", lineHeight: 1.4, padding: "0 2px" }}>{inviteNote}</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Таймлайн — «нить дня» (по умолчанию ВКЛ, оживает, когда ведёте вместе). */}
        {!teamFor && <Row label="Таймлайн" sub="Кто когда отметился — лица на линии дня" right={<Switch small on={threadOn} onChange={setThreadOn} />} />}

        {/* Привычка ДЛЯ цели — «вести только внутри цели» (David: рояль). */}
        {goalFor && <Row label="Вести только внутри цели" sub={"Не в общем списке — живёт внутри «" + goalFor.name + "»"} right={<Switch small on={goalOnly} onChange={setGoalOnly} />} />}
      </div>

      {/* ── ЧЕЛЛЕНДЖИ — уехали ВНИЗ (David 29.07): раньше лента врезалась между названием и
            настройками и перебивала главное дело. Функция та же: тап → правила → старт. ── */}
      {!editing && !teamFor && !goalFor && typeof CHALLENGE_STARTERS !== "undefined" && typeof bosQuickChipEl === "function" && (
      <React.Fragment>
        <Lab>ИЛИ НАЧНИ С ЧЕЛЛЕНДЖА</Lab>
        <div className="bos-hscroll" style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch", margin: "0 -16px", padding: "0 16px 4px" }}>
          {CHALLENGE_STARTERS.map((c, i) => bosQuickChipEl(c, isDark, () => { if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} } setChallengeC(c); setView("challenge"); }, i))}
        </div>
        <div style={{ fontSize: 11.5, color: "var(--text-4)", padding: "7px 8px 0", lineHeight: 1.4 }}>Челлендж — та же привычка, но с призом за серию.</div>
      </React.Fragment>
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
  const [linkedHabits, setLinkedHabits] = useHS(() => (app?.habits || []).map((h) => ({ id: h.id, cloudId: h.cloudId || null, e: h.emoji || "✨", n: h.name, on: !!(g0 && (g0.habitIds || []).includes(h.id)) })));
  const toggleLinked = (i) => setLinkedHabits((hs) => hs.map((h, j) => (j === i ? { ...h, on: !h.on } : h)));
  // Единицы цели — чистые чипы (David: «в карточке цели что-то типа считать количество»); «своё» = произвольная.
  const GOAL_UNITS = ["раз", "км", "страниц", "минут", "часов", "кг"];
  const [customUnitOn, setCustomUnitOn] = useHS(!!unit && GOAL_UNITS.indexOf(unit) < 0);
  // ⚠️ ХУКИ ТОЛЬКО ЗДЕСЬ, ДО ранних return'ов (вью picker) — иначе React #300, см. форму привычки.
  // Какая строка блока «Ещё» раскрыта: desc | habit | null.
  const [gMore, setGMore] = useHS(null);
  // ЗНАЧОК — та же лента, что в форме привычки: порядок неподвижный, три ряда едут вправо целиком,
  // второй шторки-пикера нет. Список — ЭМОДЗИ, рисуется иконками (контракт в core/glyphs.jsx).
  const _gEmojiBase = (typeof BOS_GLYPH_ORDER !== "undefined" && BOS_GLYPH_ORDER.length)
    ? BOS_GLYPH_ORDER.map(bosGlyphEmoji)
    : ((typeof BOS_EMOJI_ALL !== "undefined" && BOS_EMOJI_ALL.length) ? BOS_EMOJI_ALL : ["🎯", "🏆", "🚩", "⭐", "🌱", "📊"]);
  const _gEmojiAll = React.useMemo(function () {
    return (iconPick && _gEmojiBase.indexOf(iconPick) < 0) ? [iconPick].concat(_gEmojiBase) : _gEmojiBase;
  }, [iconPick]);
  const _gStripRef = React.useRef(null);
  React.useEffect(function () {
    if (view !== "form") return;
    var el = _gStripRef.current; if (!el) return;
    var sel = el.querySelector('[data-sel="1"]'); if (!sel) return;
    var want = sel.offsetLeft - el.clientWidth / 2 + sel.offsetWidth / 2;
    if (want > 8) el.scrollLeft = want;
  }, [view]);

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
    // КРУГ ВЫКЛ → личная цель; habitIds наполняют её кольцо. habitCloudIds — вечная копия
    // связи (локальные id умирают при восстановлении из облака, cloudId — нет).
    const habitIds = linkHabit ? linkedHabits.filter((h) => h.on).map((h) => h.id) : [];
    const habitCloudIds = linkHabit ? linkedHabits.filter((h) => h.on && h.cloudId).map((h) => h.cloudId) : [];
    const data = { emoji: iconPick, color, tint, name: nm, target: tgt, unit, deadline, circle: false, habitIds, habitCloudIds, desc: (desc || "").trim() };
    if (!editing && preset && preset.challenge) data.challenge = preset.challenge; // разовый XP-бонус челленджа (derived)
    if (editing) app?.updateGoal(g0.id, data);
    else app?.addGoal(data);
    close();
  };

  // ВЬЮ «picker» УБРАН (David 2026-07-29) — все эмодзи живут лентой прямо в форме, как у привычки.
  // ── КИРПИЧИ ФОРМЫ — те же, что в форме привычки (макет 2026-07-29): заголовок секции =
  //    мелкая строчка, выбор из двух-трёх = СЕГМЕНТ, редкое = строки со значением в «Ещё».
  const _CARD = { background: "var(--card, #fff)", borderRadius: 20, boxShadow: "var(--card-shadow)", padding: "13px 14px" };
  const _CARD_TIGHT = { background: "var(--card, #fff)", borderRadius: 20, boxShadow: "var(--card-shadow)", padding: "2px 14px" };
  const _hair = "1px solid var(--line-2, rgba(0,0,0,0.06))";
  const _accent = (color && color !== BOS_GREY && ("" + color).toLowerCase() !== "#0a0a0a") ? color : null;
  const Lab = ({ children }) => (
    <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1.3, color: "var(--text-4)", padding: "16px 6px 8px" }}>{children}</div>
  );
  const Hint = ({ children }) => (
    <div style={{ fontSize: 11.5, color: "var(--text-4)", padding: "7px 8px 0", lineHeight: 1.4 }}>{children}</div>
  );
  const Seg = ({ items, value, onPick }) => (
    <div style={{ display: "flex", gap: 3, borderRadius: 13, padding: 3, background: isDark ? "rgba(255,255,255,0.07)" : "rgba(10,10,10,0.055)" }}>
      {items.map(([v, l]) => {
        const on = value === v;
        return (
          <button key={v} type="button" className="tap" data-haptic="selection" onClick={() => onPick(v)} aria-pressed={on}
            style={{ flex: 1, border: 0, cursor: "pointer", borderRadius: 10, padding: "9px 0", fontSize: 13, fontFamily: "inherit",
              fontWeight: on ? 700 : 600, color: on ? "var(--text)" : "var(--text-3)",
              background: on ? (isDark ? "rgba(255,255,255,0.16)" : "#fff") : "transparent",
              boxShadow: on ? (isDark ? "none" : "0 1px 3px rgba(0,0,0,0.11), 0 0 0 0.5px rgba(0,0,0,0.03)") : "none",
              transition: "background .15s, box-shadow .15s" }}>{l}</button>
        );
      })}
    </div>
  );
  const Row = ({ label, sub, value, onTap, right, first }) => {
    const inner = (
      <React.Fragment>
        <span style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
          <span style={{ display: "block", fontSize: 15, fontWeight: 500, color: "var(--text)" }}>{label}</span>
          {sub ? <span style={{ display: "block", fontSize: 12, color: "var(--text-4)", marginTop: 2, lineHeight: 1.35 }}>{sub}</span> : null}
        </span>
        {value != null ? <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-3)", flexShrink: 0 }}>{value}</span> : null}
        {onTap ? <I.ChevronRight size={15} color="var(--text-4)" /> : null}
        {right || null}
      </React.Fragment>
    );
    const st = { display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "12px 0", border: 0, borderTop: first ? 0 : _hair, background: "transparent" };
    return onTap
      ? <button type="button" className="tap" data-haptic="selection" onClick={onTap} style={{ ...st, cursor: "pointer", fontFamily: "inherit" }}>{inner}</button>
      : <div style={st}>{inner}</div>;
  };
  const _modeHint = goalType === "streak"
    ? "Каждый держит серию — засчитывается, только если прошли все."
    : "Отметки всех складываются в одно число.";
  const _linkedOn = linkedHabits.filter((h) => h.on).length;

  return (
    <div className="bos-sheet-scroll" style={{ paddingTop: 2, paddingLeft: 16, paddingRight: 16 }}>
      {/* Серый фон шторки + белые карточки — как страницы приложения (David). */}
      {typeof SheetGreyBgLive === "function" && <SheetGreyBgLive />}
      {/* Заголовок ЧЕСТНО говорит, что получится: включил круг — «Новый круг», а не «Новая цель». */}
      {typeof SheetFormHeadLive === "function"
        ? <SheetFormHeadLive title={isTeamEdit ? "Круг" : (editing ? (circleOn ? "Изменить круг" : "Изменить цель") : (circleOn ? "Новый круг" : "Новая цель"))} onClose={close} onDone={saveGoal} />
        : <div style={{ textAlign: "center", fontSize: 18, fontWeight: 700, letterSpacing: "-0.3px", marginBottom: 2 }}>{editing ? "Изменить цель" : "Новая цель"}</div>}

      {/* ── ШАПКА: значок + имя ── */}
      <div style={{ ..._CARD, marginTop: 6, display: "flex", alignItems: "center", gap: 12 }}>
        <button type="button" data-haptic="selection" className="tap" aria-label="Показать значок в ленте"
          onClick={() => { try { var el = _gStripRef.current, sel = el && el.querySelector('[data-sel="1"]'); if (sel) el.scrollTo({ left: Math.max(0, sel.offsetLeft - el.clientWidth / 2 + sel.offsetWidth / 2), behavior: "smooth" }); } catch (e) {} }}
          style={{ width: 52, height: 52, borderRadius: 16, display: "grid", placeItems: "center", fontSize: 27, flexShrink: 0, border: 0, cursor: "pointer", transition: "background 0.2s",
            background: _accent ? _accent + "26" : "var(--surface-3)" }}>
          {bosIcon(iconPick, 27, color)}
        </button>
        <input value={name} onChange={e => setName(e.target.value)} placeholder={circleOn ? "Название круга" : "Название цели"} aria-label="Название"
          style={{ flex: 1, minWidth: 0, border: 0, outline: "none", background: "transparent", fontSize: 17, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.2px", padding: "6px 0" }} />
      </div>

      {/* ── ЗНАЧОК: та же лента, что у привычки — три ряда, едут вправо целиком ── */}
      <Lab>ЗНАЧОК</Lab>
      <div style={{ ..._CARD, padding: "11px 0" }}>
        <div ref={_gStripRef} className="bos-hscroll"
          style={{ position: "relative", display: "grid", gridTemplateRows: "repeat(3, auto)", gridAutoFlow: "column", gridAutoColumns: "max-content", gap: 7, overflowX: "auto", overflowY: "hidden", scrollbarWidth: "none", WebkitOverflowScrolling: "touch", touchAction: "pan-x", padding: "0 12px" }}>
          {_gEmojiAll.map((e, i) => {
            const on = e === iconPick;
            return (
              <button key={e + i} type="button" className="tap" data-no-haptic data-sel={on ? "1" : null} aria-pressed={on}
                onClick={() => { setIconPick(e); if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e2) {} } }}
                style={{ width: 42, height: 42, flexShrink: 0, borderRadius: "50%", border: 0, cursor: "pointer", fontSize: 21, lineHeight: 1, padding: 0,
                  display: "grid", placeItems: "center", color: on ? (_accent || "var(--text)") : "var(--text)",
                  background: on ? (_accent ? _accent + "2b" : (isDark ? "rgba(255,255,255,0.16)" : "#e7e7ec")) : (isDark ? "rgba(255,255,255,0.07)" : "var(--surface-3)"),
                  boxShadow: on ? "inset 0 0 0 2px " + (_accent || "var(--text)") : "none",
                  transition: "background .15s, box-shadow .15s" }}>{bosIcon(e, 21, null)}</button>
            );
          })}
        </div>
      </div>

      {/* ── ЦВЕТ ── */}
      <Lab>ЦВЕТ</Lab>
      <div style={{ ..._CARD, padding: "1px 6px" }}>{typeof BosColorPickerLive === "function" && <BosColorPickerLive value={color} onChange={setColor} />}</div>

      {/* ── СКОЛЬКО: число + единица. Пояснение — строкой ПОД карточкой. ── */}
      <Lab>СКОЛЬКО</Lab>
      <div style={_CARD}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, minWidth: 0 }}>
          <input type="text" inputMode="numeric" pattern="[0-9]*" value={target}
            onChange={e => setTarget(parseInt(e.target.value.replace(/\D/g, "")) || 0)} className="goal-num" aria-label="Сколько"
            style={{ flex: "0 0 auto", width: 70, fontSize: 30, fontWeight: 800, letterSpacing: "-1px", color: "var(--text)", border: 0, outline: 0, background: "transparent", padding: 0, minWidth: 0 }} />
          <span style={{ fontSize: 16, fontWeight: 600, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{customUnitOn ? (unit || "своё") : unit}</span>
        </div>
        <div className="bos-hscroll" style={{ display: "flex", gap: 6, marginTop: 11, overflowX: "auto", padding: "1px" }}>
          {GOAL_UNITS.map((u) => {
            const on = !customUnitOn && unit === u;
            return (
              <button key={u} type="button" onClick={() => { setUnit(u); setCustomUnitOn(false); }} className="tap" data-no-haptic
                style={{ flexShrink: 0, border: 0, borderRadius: 9, padding: "7px 13px", fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", cursor: "pointer", fontFamily: "inherit",
                  background: on ? (isDark ? "#f2f2f5" : "#0a0a0a") : "var(--surface-3)", color: on ? (isDark ? "#0a0a0a" : "#fff") : "var(--text-3)" }}>{u}</button>
            );
          })}
          <button type="button" onClick={() => { setCustomUnitOn(true); if (GOAL_UNITS.indexOf(unit) >= 0) setUnit(""); }} className="tap" data-no-haptic
            style={{ flexShrink: 0, border: 0, borderRadius: 9, padding: "7px 13px", fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", cursor: "pointer", fontFamily: "inherit",
              background: customUnitOn ? (isDark ? "#f2f2f5" : "#0a0a0a") : "var(--surface-3)", color: customUnitOn ? (isDark ? "#0a0a0a" : "#fff") : "var(--text-3)" }}>своё</button>
        </div>
        {customUnitOn && (
          <input type="text" value={unit || ""} onChange={e => setUnit(e.target.value)} placeholder="напр. книг, стаканов, кругов" aria-label="Своя единица"
            style={{ width: "100%", boxSizing: "border-box", marginTop: 9, border: 0, outline: 0, background: "var(--surface-3)", borderRadius: 11, padding: "10px 13px", fontSize: 14.5, fontWeight: 600, color: "var(--text)" }} />
        )}
      </div>
      <Hint>Прогресс цели считается от этого числа.</Hint>

      {/* ── СРОК — сразу после числа: это вторая по частоте настройка цели, а не подвал. ── */}
      <Lab>СРОК</Lab>
      <div style={_CARD_TIGHT}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0" }}>
          <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: "var(--text)" }}>Дата</span>
          {/* Пилюля с читаемой датой; прозрачный <input type=date> сверху открывает нативное колесо. */}
          <label style={{ position: "relative", display: "inline-flex", alignItems: "center", background: _accent ? _accent + "22" : "var(--surface-3)", borderRadius: 999, padding: "6px 13px", cursor: "pointer" }}>
            <span style={{ fontSize: 14.5, fontWeight: 700, color: _accent || "var(--text)", letterSpacing: "-0.2px" }}>{(typeof bosFmtDeadline === "function" ? bosFmtDeadline(deadline) : deadline) || "выбрать"}</span>
            <input type="date" value={/^\d{4}-\d{2}-\d{2}$/.test(deadline) ? deadline : ""} onChange={e => setDeadline(e.target.value || deadline)} aria-label="Срок цели"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, border: 0, margin: 0, padding: 0, cursor: "pointer", WebkitAppearance: "none", appearance: "none" }} />
          </label>
        </div>
        <div style={{ display: "flex", gap: 15, padding: "0 0 12px" }}>
          {[{ l: "неделя", d: () => _addDays(7) }, { l: "месяц", d: () => _addMonths(1) }, { l: "3 мес", d: () => _addMonths(3) }, { l: "год", d: () => _addMonths(12) }].map((q) => (
            <button key={q.l} type="button" onClick={() => setDeadline(_isoOf(q.d()))} className="tap" data-no-haptic
              style={{ border: 0, background: "transparent", padding: 0, cursor: "pointer", fontSize: 12.5, fontWeight: 600, color: "var(--text-4)", fontFamily: "inherit" }}>
              <span style={{ color: "var(--text-5)" }}>+ </span>{q.l}
            </button>
          ))}
        </div>
      </div>

      {/* ── ВМЕСТЕ — сегмент вместо тумблера: оба пути видно сразу. У живого круга сегмента НЕТ:
            обратно в соло-цель круг не превращается, предлагать это нечестно. ── */}
      <Lab>{isTeamEdit ? "КАК СЧИТАЕМ" : "ВМЕСТЕ"}</Lab>
      <div style={_CARD}>
        {!isTeamEdit && <Seg value={circleOn ? "circle" : "solo"} onPick={(v) => setCircleOn(v === "circle")} items={[["solo", "Сам"], ["circle", "С кругом"]]} />}
        {(circleOn || isTeamEdit) && (
          <div style={isTeamEdit ? undefined : { marginTop: 12, paddingTop: 12, borderTop: _hair }}>
            {!isTeamEdit && <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-3)", paddingBottom: 8 }}>Как считаем</div>}
            <Seg value={goalType} onPick={setGoalType} items={CIRCLE_MODES.map((m) => [m.id, m.t])} />
          </div>
        )}
      </div>
      {(circleOn || isTeamEdit) && <Hint>{_modeHint}</Hint>}

      {/* Строки круга — своей карточкой: открытость, таймлайн, ставка. */}
      {(circleOn || isTeamEdit) && (
        <div style={{ ..._CARD_TIGHT, marginTop: 10 }}>
          {isTeamEdit && (
            <Row first label="Участники и роли" value={(((g0 && (g0.__team || g0)) || {}).members || []).length || null}
              onTap={() => { close(); if (typeof navigate === "function") navigate("team-settings", { team: g0.__team || g0, from: returnTo }); }} />
          )}
          <Row first={!isTeamEdit} label="Открытый круг" sub={circleVis === "public" ? "Виден в поиске — войдёт кто угодно" : "Только по личной ссылке-приглашению"}
            right={<Switch small on={circleVis === "public"} onChange={(v) => setCircleVis(v ? "public" : "private")} />} />
          <Row label="Таймлайн" sub="Лица на линии дня в комнате круга" right={<Switch small on={threadOn} onChange={setThreadOn} />} />
          {/* Ставка — ТОЛЬКО при создании: у живого круга банк уже собран, менять его на ходу нельзя. */}
          {!isTeamEdit && (
            <React.Fragment>
              <Row label="Ставка XP" sub="Дойдёте — банк вернётся каждому" right={<Switch small on={stakeOn} onChange={setStakeOn} />} />
              {stakeOn && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", borderTop: _hair }}>
                  <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: "var(--text)" }}>Сколько с каждого</span>
                  <input type="text" inputMode="numeric" pattern="[0-9]*" value={stakeAmount} onChange={(e) => setStakeAmount(parseInt(e.target.value.replace(/\D/g, "")) || 0)} aria-label="Ставка XP с каждого"
                    style={{ width: 84, textAlign: "center", fontSize: 15, fontWeight: 700, color: "var(--text)", border: 0, outline: 0, background: "var(--surface-3)", borderRadius: 999, padding: "7px 12px" }} />
                </div>
              )}
            </React.Fragment>
          )}
        </div>
      )}
      {circleOn && !isTeamEdit && <Hint>Сохранишь — цель станет общей, и сразу позовёшь людей по ссылке.</Hint>}

      {/* ── ЕЩЁ — редкое: строки со значением, поля раскрываются под своей строкой. ── */}
      <Lab>ЕЩЁ</Lab>
      <div style={_CARD_TIGHT}>
        <Row first label="Описание" value={(desc || "").trim() ? "Есть" : "Нет"} onTap={() => setGMore(gMore === "desc" ? null : "desc")} />
        {gMore === "desc" && (
          <div style={{ padding: "0 0 12px" }}>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} maxLength={280}
              placeholder={(isTeamEdit || circleOn) ? "Напр.: отмечаемся каждый вечер, поддерживаем друг друга" : "Зачем эта цель и как её достичь…"}
              style={{ width: "100%", boxSizing: "border-box", border: 0, outline: 0, background: "var(--surface-3)", borderRadius: 12, padding: "11px 13px", fontSize: 14, color: "var(--text)", resize: "none", fontFamily: "inherit", lineHeight: 1.45 }} />
            <div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 6, lineHeight: 1.4 }}>{(isTeamEdit || circleOn) ? "Что важно помнить команде — покажется под целью." : "Короткая заметка — покажется под целью."}</div>
          </div>
        )}
        {!isTeamEdit && (
          <React.Fragment>
            <Row label="Подкрепить привычкой" sub="Отметка привычки двигает цель" value={linkHabit && _linkedOn ? _linkedOn : null}
              right={<Switch small on={linkHabit} onChange={setLinkHabit} />} />
            {linkHabit && (
              <div style={{ display: "flex", gap: 8, padding: "0 0 12px", flexWrap: "wrap", alignItems: "center" }}>
                {linkedHabits.length === 0 && (
                  <span style={{ fontSize: 12.5, color: "var(--text-4)", lineHeight: 1.4 }}>Сначала создай привычку — потом привяжешь её к цели.</span>
                )}
                {linkedHabits.map((h, i) => (
                  <button key={i} type="button" className="tap" data-no-haptic onClick={() => toggleLinked(i)} style={{
                    display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px 5px 5px", borderRadius: 999,
                    background: h.on ? (isDark ? "#f2f2f5" : "#0a0a0a") : "var(--surface-3, #e8e8e8)", color: h.on ? (isDark ? "#0a0a0a" : "#fff") : "var(--text-3)",
                    border: 0, fontSize: 12, fontWeight: 500, transition: "background 0.15s, color 0.15s" }}>
                    <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#fff", display: "grid", placeItems: "center", fontSize: 13 }}>{bosIcon(h.e, 14, null)}</span>
                    {h.n}{h.on && <I.Check size={12} strokeWidth={3} />}
                  </button>
                ))}
                <button type="button" className="tap" onClick={() => openSheet(<HabitFormSheetLive mode="create" navigate={navigate} />)} style={{
                  display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 999,
                  background: "transparent", border: "1px dashed rgba(0,0,0,0.18)", color: "var(--text-3)", fontSize: 12, fontWeight: 500 }}><I.Plus size={12} /> Новая привычка</button>
              </div>
            )}
            {/* Тонированный фон — украшение, поэтому оно здесь, а не вторым решением после названия. */}
            <Row label="Тонированный фон" sub="Карточка залита цветом" right={<Switch small on={tint} onChange={setTint} />} />
          </React.Fragment>
        )}
      </div>

      {/* ── ГОТОВЫЙ ЧЕЛЛЕНДЖ — ссылкой ВНИЗУ (была между заголовком и названием). ── */}
      {!editing && typeof CreatePickerSheetLive === "function" && (
        <button type="button" onClick={() => openSheet(<CreatePickerSheetLive navigate={navigate} custom={false} />)} className="tap"
          style={{ display: "block", margin: "16px auto 0", background: "transparent", border: 0, padding: "6px 10px", fontSize: 13, fontWeight: 600, color: "var(--text-3)", cursor: "pointer", fontFamily: "inherit" }}>
          или выбери готовый челлендж →
        </button>
      )}

      {/* «Участники и роли» переехали СТРОКОЙ в блок «Ещё» (со счётчиком людей) — дубля внизу нет. */}
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

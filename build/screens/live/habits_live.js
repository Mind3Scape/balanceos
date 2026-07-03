/* HABITS — LIVE-only fork (real Telegram user, app.mode === "live" is ALWAYS true here).
   ONE block language (iOS-26 «всё в блоках»), as redesigned by David:
     1. Шапка: лента ЧЕЛЛЕНДЖЕЙ (популярные привычка/цель/«вместе»-пресеты с XP-наградой,
        горизонтальный скролл) + универсальный «+» справа (CreateMenuLive → Привычку / Цель;
        круг = тумблер «Идти к цели вместе» внутри цели). «Быстрого добавления» и переключателя
        Привычки/Цели больше НЕТ — их David убрал.
     2. ОДНА сетка квадратных плиток: привычки, цели И КОМАНДЫ (круги) ВПЕРЕМЕШКУ, общий
        drag-реордер (порядок в bos:practiceOrder, ключи "h<id>"/"g<id>"/"t<id>"). Плитка цели
        зеркалит привычку (иконка + %, имя, полоска прогресса снизу вместо недельных точек);
        плитка команды = цель + лица участников + метка «Команда» (teamTile). Долгое нажатие →
        меню плитки (Поделиться / Переставить / Удалить; у команды «Удалить» нет — оно в настройках
        круга). teams больше НЕ рендерятся отдельным блоком под сеткой — они В сетке (David: «команды
        должны двигаться как привычки, между ними и над ними»).
     3. «Обучение» — тонкий disclosure-блок (bosLearnHidden, тот же флаг что в Настройках).
   Reuses shared core/ + shared_live.jsx (CreateMenuLive, ShareHabitSheetLive/ShareGoalSheetLive,
   HabitWeekStrip, BosReorderGrid, bosConfirmDelete, bosTileGlass/BOS_TILE_SHEEN, HabitBuddyAvatarsLive,
   CircleFacesLive) + community_live.jsx (LiveTeamCard) + framework (HabitCheck/HabitCountCheck/
   HabitRing, I, hooks). Top-level names here: HabitTileMenuLive, HabitsLive, bosLoadPracticeOrder,
   bosSavePracticeOrder, CHALLENGE_STARTERS, bosDaysWord, ChallengeIntroSheet, ChallengeProgressChip,
   bosCommitChallenge, BOS_CREATE_CATS, CreatePickerSheetLive, GoalCardOrbit. */

// «ЧЕЛЛЕНДЖИ» — витрина-лента наверху стр. Привычки (David: «не голые пресеты, а самые ПОПУЛЯРНЫЕ
// привычки/цели/„вместе"-челленджи, у каждой виден XP-БОНУС — быстрое добавление ЧЕЛЛЕНДЖЕЙ»). Тап →
// создание заполнено пресетом. `bonus` = РЕАЛЬНЫЙ XP за ЗАВЕРШЕНИЕ челленджа (David: «в конце, когда закрыл
// срок»). Создание метит привычку/цель/команду `challenge {key,bonus,days}`; AppProvider (shell.jsx)
// фиксирует бонус в ПОСТОЯННУЮ копилку claimedChallenges, как только серия привычки достигла `days` ПОДРЯД
// (или цель/команда достигла target) — раз заработал, бонус навсегда (пропуск/удаление его не отбирают).
// bosChallengeBonusXPLive суммирует копилку. kind: habit | goal | together
// (together = цель с тумблером «Идти к цели вместе»). preset-поля совпадают с тем, что читает создание.
var CHALLENGE_STARTERS = [{
  i: "🔥",
  t: "Холодный душ",
  kind: "habit",
  key: "cold",
  bonus: 50,
  days: 30,
  color: "#0a0a0a",
  desc: "Каждое утро — холодный душ. Взбадривает тело и закаляет характер."
}, {
  i: "💪",
  t: "30 дней спорта",
  kind: "together",
  key: "sport30",
  bonus: 75,
  target: 30,
  unit: "дней",
  desc: "Месяц движения без пропусков. Вместе с друзьями держать ритм легче."
}, {
  i: "💧",
  t: "Вода каждый день",
  kind: "habit",
  key: "water",
  bonus: 30,
  days: 21,
  color: "#34C759",
  desc: "Стакан за стаканом — приучи себя пить достаточно воды каждый день."
}, {
  i: "📚",
  t: "Книга за месяц",
  kind: "goal",
  key: "book",
  bonus: 40,
  target: 1,
  unit: "книга",
  deadline: "Месяц",
  desc: "Одна книга до конца месяца — маленькими шагами каждый день."
}, {
  i: "🏃",
  t: "Бег вместе",
  kind: "together",
  key: "runtog",
  bonus: 75,
  target: 30,
  unit: "км",
  desc: "Набегайте общий километраж командой — вклад каждого виден всем."
}, {
  i: "🧘",
  t: "10 минут тишины",
  kind: "habit",
  key: "silence",
  bonus: 30,
  days: 21,
  color: "#AF52DE",
  desc: "Десять минут покоя в день — место, где мысли оседают."
}, {
  i: "🌅",
  t: "Ранний подъём",
  kind: "habit",
  key: "wake",
  bonus: 40,
  days: 21,
  color: "#FF9500",
  desc: "Вставай раньше и выигрывай утро, пока все ещё спят."
}, {
  i: "🚭",
  t: "Без сахара",
  kind: "habit",
  key: "nosugar",
  bonus: 50,
  days: 30,
  color: "#FF2D55",
  desc: "Месяц без добавленного сахара — тело скажет спасибо."
}];

// Склонение «день/дня/дней» — правила достаточно простые, отдельная библиотека не нужна.
function bosDaysWord(n) {
  n = Math.abs(n | 0);
  var d10 = n % 10,
    d100 = n % 100;
  if (d10 === 1 && d100 !== 11) return "день";
  if (d10 >= 2 && d10 <= 4 && (d100 < 12 || d100 > 14)) return "дня";
  return "дней";
}

/* СОГЛАСИЛСЯ на челлендж → создаём сразу, БЕЗ формы (David: «подписался — и она сама создаётся,
   редактировать можно потом карандашиком»). ЕДИНЫЙ путь для ленты челленджей на Привычках И
   шторки-каталога «+» (CreatePickerSheetLive) — challenge {key,bonus,days} едет на привычку/цель/круг,
   бонус фиксируется в копилку (shell.jsx), когда челлендж ЗАВЕРШЁН. */
function bosCommitChallenge(app, c, {
  navigate,
  openSheet
}) {
  var ch = {
    key: c.key,
    bonus: c.bonus,
    days: c.days
  };
  if (c.kind === "habit") {
    // Идентична карточке, которую собрала бы форма: все 7 дней, напоминание вкл в 9:00 (дефолт формы).
    app?.addHabit({
      emoji: c.i,
      name: c.t,
      color: c.color || "#0a0a0a",
      days: [1, 1, 1, 1, 1, 1, 1],
      goalPerDay: 1,
      duration: 0,
      reminder: {
        on: true,
        time: "09:00"
      },
      challenge: ch
    });
    if (window.tgHaptic) {
      try {
        window.tgHaptic("success");
      } catch (e) {}
    }
  } else if (c.kind === "goal") {
    app?.addGoal({
      emoji: c.i,
      color: c.color || "#0a0a0a",
      name: c.t,
      target: c.target || 1,
      unit: c.unit || "",
      deadline: c.deadline || "Этот месяц",
      circle: false,
      habitIds: [],
      challenge: ch
    });
    if (window.tgHaptic) {
      try {
        window.tgHaptic("success");
      } catch (e) {}
    }
  } else {
    // «Вместе» → сразу настоящий круг + шторка приглашения (тот же проверенный путь, что у формы).
    var goalLike = {
      name: c.t,
      emoji: c.i,
      color: c.color || "#0a0a0a",
      target: c.target || 1,
      unit: c.unit || "",
      deadline: c.deadline || "Этот месяц",
      habitIds: [],
      challenge: ch
    };
    if (typeof bosPromoteGoalToCircle === "function") {
      bosPromoteGoalToCircle(app, goalLike, {
        navigate,
        from: "habits",
        vis: "private",
        type: "collective",
        stake: 0,
        onShare: t => openSheet(/*#__PURE__*/React.createElement(TeamShareSheetLive, {
          team: t
        }))
      });
    }
  }
}

/* КАТАЛОГ «+» — пресеты ПО КАТЕГОРИЯМ для шторки создания (David: «сначала шторка с пресетами,
   и все уже настроены под челленджи — не просто объект „медитация", а сколько-то продержаться»;
   референс — категории в стороннем трекере). Пересекающиеся пункты НЕСУТ ТЕ ЖЕ key, что лента
   CHALLENGE_STARTERS → копилка claimedChallenges видит их как один челлендж. Категория «Вместе» =
   kind:"together" (цель+круг одним тумблером — наш единый механизм). */
var BOS_CREATE_CATS = [{
  t: "🌿 Здоровье",
  items: [{
    i: "💧",
    t: "Вода каждый день",
    kind: "habit",
    key: "water",
    bonus: 30,
    days: 21,
    color: "#34C759",
    desc: "Стакан за стаканом — приучи себя пить достаточно воды каждый день."
  }, {
    i: "🚭",
    t: "Без сахара",
    kind: "habit",
    key: "nosugar",
    bonus: 50,
    days: 30,
    color: "#FF2D55",
    desc: "Месяц без добавленного сахара — тело скажет спасибо."
  }, {
    i: "😴",
    t: "Сон до полуночи",
    kind: "habit",
    key: "sleep",
    bonus: 30,
    days: 14,
    color: "#5E5CE6",
    desc: "Две недели ложиться до 00:00 — утро перестанет быть врагом."
  }]
}, {
  t: "💪 Тело",
  items: [{
    i: "🔥",
    t: "Холодный душ",
    kind: "habit",
    key: "cold",
    bonus: 50,
    days: 30,
    color: "#0a0a0a",
    desc: "Каждое утро — холодный душ. Взбадривает тело и закаляет характер."
  }, {
    i: "🌅",
    t: "Ранний подъём",
    kind: "habit",
    key: "wake",
    bonus: 40,
    days: 21,
    color: "#FF9500",
    desc: "Вставай раньше и выигрывай утро, пока все ещё спят."
  }, {
    i: "👟",
    t: "10 000 шагов",
    kind: "habit",
    key: "steps",
    bonus: 30,
    days: 14,
    color: "#0A84FF",
    desc: "Две недели по десять тысяч шагов — тело скажет спасибо за движение."
  }]
}, {
  t: "🧠 Разум",
  items: [{
    i: "🧘",
    t: "10 минут тишины",
    kind: "habit",
    key: "silence",
    bonus: 30,
    days: 21,
    color: "#AF52DE",
    desc: "Десять минут покоя в день — место, где мысли оседают."
  }, {
    i: "📖",
    t: "Чтение каждый день",
    kind: "habit",
    key: "read21",
    bonus: 40,
    days: 21,
    color: "#FF9F0A",
    desc: "Хотя бы несколько страниц в день — три недели, и книга сама тебя ждёт."
  }, {
    i: "✍️",
    t: "Дневник перед сном",
    kind: "habit",
    key: "journal",
    bonus: 30,
    days: 14,
    color: "#64D2FF",
    desc: "Пара строк о дне перед сном — голова легче, сон спокойнее."
  }]
}, {
  t: "🎯 Цели",
  items: [{
    i: "📚",
    t: "Книга за месяц",
    kind: "goal",
    key: "book",
    bonus: 40,
    target: 1,
    unit: "книга",
    deadline: "Месяц",
    desc: "Одна книга до конца месяца — маленькими шагами каждый день."
  }, {
    i: "🏃",
    t: "50 км за месяц",
    kind: "goal",
    key: "run50",
    bonus: 50,
    target: 50,
    unit: "км",
    deadline: "Месяц",
    desc: "Пятьдесят километров бега или ходьбы за месяц — в своём темпе."
  }]
}, {
  t: "🤝 Вместе",
  items: [{
    i: "💪",
    t: "30 дней спорта",
    kind: "together",
    key: "sport30",
    bonus: 75,
    target: 30,
    unit: "дней",
    desc: "Месяц движения без пропусков. Вместе с друзьями держать ритм легче."
  }, {
    i: "🏃",
    t: "Бег вместе",
    kind: "together",
    key: "runtog",
    bonus: 75,
    target: 30,
    unit: "км",
    desc: "Набегайте общий километраж командой — вклад каждого виден всем."
  }, {
    i: "🧘",
    t: "Тишина вместе",
    kind: "together",
    key: "medtog",
    bonus: 75,
    target: 21,
    unit: "дней",
    desc: "Три недели медитации всем кругом — никто не сходит с дистанции."
  }]
}];

/* ШТОРКА «+» — первый экран создания (David: «кликаю плюсик — сначала шторка с пресетами по
   категориям, всё уже настроено под челленджи»). Сверху «Своя привычка / Своя цель» (формы с нуля —
   наши шторки), ниже категории готовых челленджей; тап по пресету → ChallengeIntroSheet (правила +
   «Начать») → bosCommitChallenge. Всё в one-sheet host: содержимое шторки меняется, без вложенных. */
function CreatePickerSheetLive({
  navigate,
  custom = true
}) {
  // custom=false — открытие из стеклянного поповера «+» (там «Привычку/Цель» уже есть) или
  // из формы цели: показываем ТОЛЬКО готовые челленджи, без верхних строк «своё».
  var {
    open: openSheet
  } = useSheet();
  var app = typeof useApp === "function" ? useApp() : null;
  var isDark = app?.themeOverride === "dark";
  var sheen = typeof BOS_TILE_SHEEN !== "undefined" ? BOS_TILE_SHEEN + ", " : "";
  var discBg = sheen + (isDark ? "linear-gradient(160deg,#464c58,#30353f)" : "linear-gradient(160deg, var(--disc-a, #eef1f6), var(--disc-b, #dadfe7))");
  var line = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)";
  // БЕЛЫЕ карточки + card-shadow — язык наших форм-шторок (David: серый var(--surface-2)
  // был грубым, серое-на-сером не читалось и выпадало из палитры приложения).
  var tile = isDark ? "rgba(255,255,255,0.06)" : "#fff";
  var tileShadow = isDark ? "none" : "var(--card-shadow)";
  var pick = c => {
    if (window.tgHaptic) {
      try {
        window.tgHaptic("light");
      } catch (e) {}
    }
    openSheet(/*#__PURE__*/React.createElement(ChallengeIntroSheet, {
      c: c,
      dark: isDark,
      onStart: () => bosCommitChallenge(app, c, {
        navigate,
        openSheet
      })
    }));
  };
  var pickCustom = node => {
    if (window.tgHaptic) {
      try {
        window.tgHaptic("light");
      } catch (e) {}
    }
    openSheet(node);
  };
  var sub = c => c.kind === "habit" ? c.days + " " + bosDaysWord(c.days) + " подряд · +" + c.bonus + " XP" : c.target + " " + (c.unit || "") + " · +" + c.bonus + " XP";
  return /*#__PURE__*/React.createElement("div", {
    className: "bos-sheet-scroll",
    style: {
      paddingTop: 2,
      paddingLeft: 16,
      paddingRight: 16,
      color: "var(--text)"
    }
  }, typeof SheetGreyBgLive === "function" && /*#__PURE__*/React.createElement(SheetGreyBgLive, null), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      fontSize: 18,
      fontWeight: 700,
      letterSpacing: "-0.3px"
    }
  }, custom ? "Создать" : "Готовые челленджи"), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      fontSize: 12.5,
      color: "var(--text-4)",
      marginTop: 3,
      lineHeight: 1.4
    }
  }, custom ? "Готовый челлендж с наградой — или своё с нуля" : "Продержись срок — забери награду"), custom && /*#__PURE__*/React.createElement("div", {
    style: {
      background: tile,
      borderRadius: 18,
      marginTop: 14,
      overflow: "hidden",
      boxShadow: tileShadow
    }
  }, [{
    icon: I.Flame,
    t: "Своя привычка",
    d: "форма с нуля — как хочешь",
    go: () => pickCustom(/*#__PURE__*/React.createElement(HabitFormSheetLive, {
      mode: "create",
      navigate: navigate
    }))
  }, {
    icon: I.Flag,
    t: "Своя цель",
    d: "число, срок и привычки к ней",
    go: () => pickCustom(/*#__PURE__*/React.createElement(GoalFormSheetLive, {
      mode: "create",
      navigate: navigate
    }))
  }].map((r, i) => /*#__PURE__*/React.createElement("button", {
    key: r.t,
    onClick: r.go,
    className: "tap",
    style: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: 13,
      background: "transparent",
      border: 0,
      borderTop: i ? "0.5px solid " + line : 0,
      cursor: "pointer",
      textAlign: "left",
      padding: "12px 14px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 12,
      background: discBg,
      boxShadow: typeof bosTileGlass === "function" ? bosTileGlass(isDark) : "none",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, React.createElement(r.icon, {
    size: 18,
    color: "var(--text)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 600
    }
  }, r.t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-4)",
      marginTop: 1
    }
  }, r.d)), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 16,
    color: "var(--text-4)"
  })))), BOS_CREATE_CATS.map(cat => /*#__PURE__*/React.createElement(React.Fragment, {
    key: cat.t
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: "var(--text-4)",
      padding: "16px 4px 7px"
    }
  }, cat.t), /*#__PURE__*/React.createElement("div", {
    style: {
      background: tile,
      borderRadius: 18,
      overflow: "hidden",
      boxShadow: tileShadow
    }
  }, cat.items.map((c, i) => /*#__PURE__*/React.createElement("button", {
    key: c.key,
    onClick: () => pick(c),
    className: "tap",
    "data-no-haptic": true,
    style: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: 13,
      background: "transparent",
      border: 0,
      borderTop: i ? "0.5px solid " + line : 0,
      cursor: "pointer",
      textAlign: "left",
      padding: "11px 14px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 12,
      background: discBg,
      boxShadow: typeof bosTileGlass === "function" ? bosTileGlass(isDark) : "none",
      display: "grid",
      placeItems: "center",
      fontSize: 19,
      flexShrink: 0
    }
  }, bosIcon(c.i, 19, null)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 600
    }
  }, c.t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-4)",
      marginTop: 1
    }
  }, sub(c))), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 16,
    color: "var(--text-4)"
  })))))));
}

/* Шторка-ЗНАКОМСТВО перед стартом челленджа (David: «нелогично, что тап сразу создаёт привычку —
   сначала объясни правила, человек соглашается, и она сама создаётся; редактировать потом можно
   карандашиком»). Открывается через openSheet (хрома-BottomSheet снаружи). Значок + о чём это +
   ПРАВИЛА простым языком: объём (N дней подряд / цель) и награда с честной оговоркой (пропуск
   обнуляет серию, но заработанный бонус не сгорает). Кнопка «Начать» → onStart() создаёт сразу. */
function ChallengeIntroSheet({
  c,
  dark,
  onStart
}) {
  var {
    close
  } = useSheet();
  var [busy, setBusy] = React.useState(false);
  var together = c.kind === "together";
  var isGoalKind = c.kind === "goal" || together;
  var tileInk = dark ? "#e8e8ea" : "#3a3a3e";
  var tileBg = dark ? "linear-gradient(165deg,#3a3a3e,#2a2a2e)" : "linear-gradient(165deg,#f1f1f4,#e1e1e6)";
  var sheen = typeof BOS_TILE_SHEEN !== "undefined" ? BOS_TILE_SHEEN + ", " : "";
  var glyph = typeof bosIcon === "function" ? bosIcon(c.i, 37, tileInk) : c.i;
  var go = async () => {
    if (busy) return;
    setBusy(true);
    if (window.tgHaptic) {
      try {
        window.tgHaptic("medium");
      } catch (e) {}
    }
    try {
      await onStart();
    } catch (e) {}
    close();
  };
  var scopeTitle = isGoalKind ? (c.target || 0) + " " + (c.unit || "") : c.days + " " + bosDaysWord(c.days) + " подряд";
  var scopeSub = together ? "идёте к цели вместе — вклад каждого виден" : isGoalKind ? "двигайся в своём темпе, шаг за шагом" : "заходи и отмечай каждый день";
  var rewardSub = isGoalKind ? together ? "заберёте, когда закроете цель" : "заберёшь, когда закроешь цель" : "пропустишь день — серия начнётся заново, но бонус не сгорает";
  var Row = ({
    icon,
    iconBg,
    title,
    sub
  }) => /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 13,
      background: dark ? "rgba(255,255,255,0.06)" : "#f4f4f6",
      borderRadius: 16,
      padding: "12px 14px",
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 12,
      background: iconBg,
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, icon), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: "var(--text)",
      letterSpacing: "-0.2px"
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-4)",
      marginTop: 2,
      lineHeight: 1.4
    }
  }, sub)));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "2px 20px 0",
      color: "var(--text)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 72,
      height: 72,
      borderRadius: 20,
      margin: "0 auto",
      background: sheen + tileBg,
      boxShadow: typeof bosTileGlass === "function" ? bosTileGlass(dark) : "0 6px 16px rgba(0,0,0,0.10)",
      display: "grid",
      placeItems: "center",
      fontSize: 35
    }
  }, glyph), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1.4,
      fontWeight: 700,
      marginTop: 13
    }
  }, "\u0427\u0435\u043B\u043B\u0435\u043D\u0434\u0436"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 800,
      letterSpacing: "-0.4px",
      marginTop: 3
    }
  }, c.t), c.desc && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: "var(--text-3)",
      marginTop: 7,
      maxWidth: 300,
      marginInline: "auto",
      lineHeight: 1.5,
      textWrap: "balance"
    }
  }, c.desc)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(Row, {
    icon: isGoalKind ? /*#__PURE__*/React.createElement(I.Target, {
      size: 20,
      color: dark ? "#fff" : "#0a0a0a"
    }) : /*#__PURE__*/React.createElement(I.Calendar, {
      size: 20,
      color: dark ? "#fff" : "#0a0a0a"
    }),
    iconBg: dark ? "rgba(255,255,255,0.08)" : "#e8e8ec",
    title: scopeTitle,
    sub: scopeSub
  }), /*#__PURE__*/React.createElement(Row, {
    icon: /*#__PURE__*/React.createElement(I.Bolt, {
      size: 20,
      color: "#fff",
      filled: true
    }),
    iconBg: "linear-gradient(135deg,#FEDE34,#EF9F14)",
    title: "+" + c.bonus + " XP на финише",
    sub: rewardSub
  })), /*#__PURE__*/React.createElement("button", {
    onClick: go,
    disabled: busy,
    className: "bos-btn",
    style: {
      marginTop: 18,
      opacity: busy ? 0.6 : 1
    }
  }, busy ? "Минутку…" : together ? "Начать и позвать" : "Начать челлендж"), /*#__PURE__*/React.createElement("button", {
    onClick: close,
    disabled: busy,
    className: "tap",
    style: {
      width: "100%",
      marginTop: 8,
      border: 0,
      borderRadius: 999,
      padding: 15,
      background: dark ? "rgba(255,255,255,0.06)" : "var(--surface-3)",
      color: "var(--text)",
      fontSize: 15.5,
      fontWeight: 600
    }
  }, "\u041C\u043E\u0436\u0435\u0442, \u043F\u043E\u0437\u0436\u0435"), /*#__PURE__*/React.createElement("div", {
    style: {
      height: "max(8px, var(--tg-bottom-inset, 0px))"
    }
  }));
}

/* Колечко-прогресс челленджа на карточке привычки (David, Этап 2: «аккуратное колечко где-то —
   понимание, сколько дней до окончания челленджа»). Только для привычки-челленджа (h.challenge.days):
   кольцо заполняется серией (серия/days), текст = сколько дней ПОДРЯД осталось до XP-приза. Золотое —
   под цвет награды, чтобы челлендж читался среди обычных привычек. Прошёл (серия ≥ days) → исчезает
   (челлендж завершён, привычка становится обычной). marginTop внутри — чтобы null не оставлял пустоту. */
function ChallengeProgressChip({
  habit
}) {
  var ch = habit && habit.challenge;
  if (!ch || !ch.days) return null;
  var streak = typeof bosStreak === "function" ? bosStreak(habit.log || []) : 0;
  var remaining = ch.days - streak;
  if (remaining <= 0) return null; // приз забран → чистая карточка
  var pct = Math.max(0.06, Math.min(1, streak / ch.days)); // чуть-чуть даже на нуле, чтобы кольцо жило
  var size = 15,
    sw = 2.4,
    r = (size - sw) / 2,
    circ = 2 * Math.PI * r,
    cc = size / 2;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      background: "rgba(245,180,30,0.14)",
      borderRadius: 999,
      padding: "3px 9px 3px 4px",
      marginTop: 8,
      alignSelf: "flex-start",
      maxWidth: "100%"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 " + size + " " + size,
    style: {
      transform: "rotate(-90deg)",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: cc,
    cy: cc,
    r: r,
    fill: "none",
    stroke: "rgba(245,180,30,0.30)",
    strokeWidth: sw
  }), /*#__PURE__*/React.createElement("circle", {
    cx: cc,
    cy: cc,
    r: r,
    fill: "none",
    stroke: "#E8A200",
    strokeWidth: sw,
    strokeLinecap: "round",
    strokeDasharray: circ,
    strokeDashoffset: circ * (1 - pct)
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "#9a6800",
      letterSpacing: "-0.1px",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, remaining, " ", bosDaysWord(remaining), " \u0434\u043E +", ch.bonus, " XP"));
}

/* Long-press menu for a habit TILE (David: квадратные плитки 2-в-ряд → горизонтальный свайп
   конфликтует с сеткой, поэтому действия живут в шторке-меню). One sheet, three rows: Поделиться /
   Переставить плитки (entering the grid jiggle-mode) / Удалить. «swap» actions open their own sheet
   so we just let openSheet replace this menu (no down-then-up flicker); «leave» closes first. */
function HabitTileMenuLive({
  habit,
  dark,
  onShare,
  onReorder,
  onDelete,
  deleteLabel = "Удалить",
  deleteIcon,
  kindLabel = "Привычка"
}) {
  var {
    close
  } = useSheet();
  var swap = fn => () => {
    if (window.tgHaptic) {
      try {
        window.tgHaptic("light");
      } catch (e) {}
    }
    if (fn) fn();
  };
  var leave = fn => () => {
    if (window.tgHaptic) {
      try {
        window.tgHaptic("light");
      } catch (e) {}
    }
    close();
    if (fn) fn();
  };
  var Row = ({
    icon,
    label,
    onClick,
    danger
  }) => /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    className: "tap",
    style: {
      width: "100%",
      border: 0,
      borderRadius: 16,
      padding: "14px 15px",
      background: dark ? "rgba(255,255,255,0.06)" : "var(--surface-2)",
      color: danger ? "#FF3B30" : "var(--text)",
      display: "flex",
      alignItems: "center",
      gap: 13,
      fontSize: 15.5,
      fontWeight: 600,
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 24,
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, icon), label);
  var reorderIcon = /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M7 5v14M7 5L4 8M7 5l3 3M17 19V5M17 19l-3-3M17 19l3-3"
  }));
  var sheen = typeof BOS_TILE_SHEEN !== "undefined" ? BOS_TILE_SHEEN + ", " : "";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "2px 16px 0",
      color: "var(--text)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "2px 4px 14px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 13,
      background: sheen + (habit.color ? habit.color + "26" : "var(--surface-3)"),
      display: "grid",
      placeItems: "center",
      fontSize: 20,
      flexShrink: 0
    }
  }, bosIcon(habit.emoji, 22, habit.color)), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16.5,
      fontWeight: 700,
      letterSpacing: "-0.3px",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, habit.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-4)",
      marginTop: 1
    }
  }, kindLabel))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Row, {
    icon: /*#__PURE__*/React.createElement(I.Share, {
      size: 18
    }),
    label: "\u041F\u043E\u0434\u0435\u043B\u0438\u0442\u044C\u0441\u044F",
    onClick: swap(onShare)
  }), /*#__PURE__*/React.createElement(Row, {
    icon: reorderIcon,
    label: "\u041F\u0435\u0440\u0435\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u043F\u043B\u0438\u0442\u043A\u0438",
    onClick: leave(onReorder)
  }), onDelete && /*#__PURE__*/React.createElement(Row, {
    icon: deleteIcon || /*#__PURE__*/React.createElement(I.Trash, {
      size: 18
    }),
    label: deleteLabel,
    onClick: swap(onDelete),
    danger: true
  })), /*#__PURE__*/React.createElement("button", {
    onClick: close,
    className: "tap",
    style: {
      width: "100%",
      marginTop: 10,
      border: 0,
      borderRadius: 999,
      padding: 14,
      background: dark ? "rgba(255,255,255,0.06)" : "var(--surface-3)",
      color: "var(--text)",
      fontSize: 15.5,
      fontWeight: 600
    }
  }, "\u041E\u0442\u043C\u0435\u043D\u0430"), /*#__PURE__*/React.createElement("div", {
    style: {
      height: "max(8px, var(--tg-bottom-inset, 0px))"
    }
  }));
}

// Один ОБЩИЙ порядок для смешанного списка «привычки + цели» (David: «цели появляются среди привычек,
// человек сам расставляет как хочет»). Храним массив ключей "h<id>"/"g<id>" в localStorage; новые
// элементы (которых ещё нет в сохранённом порядке) дописываются в конец в естественном порядке.
function bosLoadPracticeOrder() {
  try {
    return JSON.parse(localStorage.getItem("bos:practiceOrder") || "[]") || [];
  } catch (e) {
    return [];
  }
}
function bosSavePracticeOrder(keys) {
  try {
    localStorage.setItem("bos:practiceOrder", JSON.stringify(keys || []));
  } catch (e) {}
}

// Орбита для КАРТОЧКИ цели: резолвит её людей (shareCode-бадди) + привычки (habitIds) и рисует
// статичную GoalOrbitMini. Отдельный компонент — чтобы честно вызвать хук useBuddyMembersLive (в
// goalTile, который зовётся в .map, хук нельзя). habits = полный список (для резолва по id).
function GoalCardOrbit({
  goal,
  habits,
  size,
  dark,
  fade,
  progress = null
}) {
  var members = typeof useBuddyMembersLive === "function" ? useBuddyMembersLive(goal && goal.shareCode) : null;
  // Люди на орбите = ВСЕ участники цели (включая себя — David: «вижу большую часть команды на орбитах»).
  // ПУЛЬС: active = отметился СЕГОДНЯ (по карте дней участника) → колечко на лице.
  var _tk = typeof bosTodayKey === "function" ? bosTodayKey() : null;
  var people = (members || []).filter(Boolean).map(m => ({
    avatar: m.avatar,
    name: m.name,
    active: !!(_tk && m.days && m.days[_tk])
  }));
  // Привычки цели: по habitIds И по обратной ссылке h.goalId (David добавлял привычку, а она не
  // появлялась — ловим оба способа привязки), без дублей.
  var ids = {};
  (goal && goal.habitIds || []).forEach(id => {
    ids[id] = 1;
  });
  (habits || []).forEach(h => {
    if (h && goal && h.goalId === goal.id) ids[h.id] = 1;
  });
  // ПУЛЬС: несём done — закрытая сегодня привычка загорается своим цветом на орбите.
  var linked = Object.keys(ids).map(id => (habits || []).find(h => "" + h.id === "" + id)).filter(Boolean).map(h => ({
    emoji: h.emoji,
    color: h.color,
    done: !!h.done
  }));
  if (typeof GoalOrbitMini !== "function") return null;
  return /*#__PURE__*/React.createElement(GoalOrbitMini, {
    centerEmoji: goal && goal.emoji,
    centerColor: goal && goal.color,
    habits: linked,
    people: people,
    size: size,
    dark: dark,
    fade: fade,
    progress: progress
  });
}
function HabitsLive() {
  var {
    navigate
  } = useNav();
  var {
    open: openSheet
  } = useSheet();
  var app = useApp();
  // Real Telegram user → iOS-weight primary labels are ALWAYS on here.
  var wrapRef = React.useRef(null);
  var [isDark, setIsDark] = React.useState(false);
  React.useEffect(() => {
    var el = wrapRef.current;
    if (!el) return;
    var n = el.parentElement;
    while (n && !n.classList.contains("theme-light") && !n.classList.contains("theme-dark")) n = n.parentElement;
    setIsDark(!!(n && n.classList.contains("theme-dark")));
  }, []);
  // Плитка команды ест кэш детали (_bosTeamGet) — деталь дообновила ростер/привычки/счёт →
  // плитка перерисовывается вслед, без своего запроса.
  var [, setTeamCacheTick] = React.useState(0);
  React.useEffect(() => {
    var f = () => setTeamCacheTick(n => n + 1);
    window.addEventListener("bos:teamCacheChanged", f);
    return () => window.removeEventListener("bos:teamCacheChanged", f);
  }, []);

  // Theme tokens — solid surfaces, NO borders. Match Home dark style.
  var TH = isDark ? {
    cardBg: "linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
    chipBg: "rgba(255,255,255,0.08)",
    chipBd: "0",
    iconBg: "rgba(255,255,255,0.08)",
    divider: "rgba(255,255,255,0.06)",
    chipText: "var(--text)",
    plusIcon: "rgba(255,255,255,0.5)",
    pillBg: "rgba(255,255,255,0.06)",
    addBtnBg: "#fff",
    addBtnFg: "#0a0a0a",
    playBtnBg: "#fff",
    playBtnFg: "#0a0a0a"
  } : {
    cardBg: "#fff",
    chipBg: "#F1F1F5",
    chipBd: "0",
    iconBg: "var(--surface-3)",
    divider: "var(--line)",
    chipText: "var(--text-2)",
    plusIcon: "#aaa",
    pillBg: "#e8e8e8",
    addBtnBg: "#0a0a0a",
    addBtnFg: "#fff",
    playBtnBg: "var(--text-2)",
    playBtnFg: "#fff"
  };
  var cardShadow = isDark ? "none" : "0 1px 2px rgba(0,0,0,0.04)";

  // «Обучение» can be collapsed (David) — persisted, also flipped from Settings.
  var [learnHidden, setLearnHidden] = React.useState(() => typeof bosLearnHidden === "function" ? bosLearnHidden() : false);
  React.useEffect(() => {
    var sync = () => setLearnHidden(typeof bosLearnHidden === "function" ? bosLearnHidden() : false);
    window.addEventListener("bos:learnchange", sync);
    return () => window.removeEventListener("bos:learnchange", sync);
  }, []);
  var toggleLearn = () => {
    var next = !learnHidden;
    if (typeof bosSetLearnHidden === "function") bosSetLearnHidden(next);
    setLearnHidden(next);
    if (window.tgHaptic) {
      try {
        window.tgHaptic("light");
      } catch (e) {}
    }
  };

  // Shared store — same lists the Home / Community screens read/write.
  var habits = app?.habits || [];
  var goals = app?.goals || [];
  var teams = app?.teams || [];
  var toggle = app?.toggleHabit || (() => {});
  var remove = app?.removeHabit || (() => {});
  var removeGoal = app?.removeGoal || (() => {});
  var rowBg = isDark ? "#141414" : "#ffffff"; // opaque so swipe actions stay hidden until revealed

  // Привычки и цели — ОДИН смешанный список плиток (David). Переключателя Привычки/Цели больше нет;
  // тип выбирается при создании («+» → Привычку/Круг), а карточки потом стоят вперемешку. orderTick
  // форсит пересборку общего порядка после перетаскивания.
  var [orderTick, setOrderTick] = React.useState(0);

  // The black «+» is the ONE universal create entry — it opens a small menu (Привычку / Цель / Команду).
  var [createOpen, setCreateOpen] = React.useState(false);
  var addBtnRef = React.useRef(null);

  // Стиль карточек — ОТДЕЛЬНО привычки (cardStyle) и цели (goalStyle). Шестерёнка → меню с 2 вкладками.
  // Дефолты: привычки = текущий вид; цели = высокий БАННЕР (David: вернуть исходный вид цели). Запоминается.
  var [cardStyle, setCardStyle] = React.useState(bosLoadCardStyle);
  var [goalStyle, setGoalStyle] = React.useState(bosLoadGoalStyle);
  var [styleOpen, setStyleOpen] = React.useState(false);
  var gearBtnRef = React.useRef(null);
  React.useEffect(() => {
    var h = () => {
      setCardStyle(bosLoadCardStyle());
      setGoalStyle(bosLoadGoalStyle());
    };
    window.addEventListener("bos:cardStyleChanged", h);
    return () => window.removeEventListener("bos:cardStyleChanged", h);
  }, []);

  // Habit TILES (2-per-row grid) — long-press opens the tile menu (Поделиться / Переставить / Удалить);
  // «Переставить» flips the grid into jiggle/drag-reorder via this controller ref (set by BosReorderGrid).
  var gridCtl = React.useRef(null);
  var onTileLongPress = key => {
    var openReorder = () => {
      if (gridCtl.current) gridCtl.current.enterReorder();
    };
    if (("" + key)[0] === "g") {
      var g = goals.find(x => "g" + x.id === key);
      if (!g) return;
      openSheet(/*#__PURE__*/React.createElement(HabitTileMenuLive, {
        habit: g,
        dark: isDark,
        kindLabel: "\u0426\u0435\u043B\u044C",
        onShare: () => openSheet(/*#__PURE__*/React.createElement(ShareGoalSheetLive, {
          goal: g,
          dark: isDark
        })),
        onReorder: openReorder,
        onDelete: () => bosConfirmDelete(openSheet, {
          title: "Удалить цель?",
          message: "«" + g.name + "» удалится навсегда.",
          confirmLabel: "Удалить",
          onConfirm: () => removeGoal(g.id)
        })
      }));
      return;
    }
    if (("" + key)[0] === "t") {
      var t = teams.find(x => "t" + (x._id != null ? x._id : x.id) === key);
      if (!t) return;
      // Меню команды = ПАРИТЕТ с привычками/целями (David: «должно быть одинаково»): помимо
      // «Поделиться / Переставить» даём удаление. Владелец (создатель, ещё не joined) → «Удалить круг»
      // (исчезнет у всех, с явным подтверждением bosConfirmExitTeam); участник → «Покинуть круг». Оба
      // ВОЗВРАЩАЮТ на «Привычки» (returnTo:"habits"), НЕ в «Сообщество» (David: «удаление кидает в Сообщество»).
      var tHabit = {
        name: t.name,
        emoji: t.emblem || "👥",
        color: t.accent || t.color
      };
      var iAmOwner = !t.joined;
      openSheet(/*#__PURE__*/React.createElement(HabitTileMenuLive, {
        habit: tHabit,
        dark: isDark,
        kindLabel: "\u041A\u043E\u043C\u0430\u043D\u0434\u0430",
        onShare: () => openSheet(/*#__PURE__*/React.createElement(TeamShareSheet, {
          team: t
        })),
        onReorder: openReorder,
        deleteLabel: iAmOwner ? "Удалить круг" : "Покинуть круг",
        deleteIcon: iAmOwner ? /*#__PURE__*/React.createElement(I.Trash, {
          size: 18
        }) : /*#__PURE__*/React.createElement(I.Logout, {
          size: 18
        }),
        onDelete: () => bosConfirmExitTeam({
          app,
          team: t,
          isOwner: iAmOwner,
          navigate,
          openSheet,
          returnTo: "habits"
        })
      }));
      return;
    }
    var h = habits.find(x => "h" + x.id === key);
    if (!h) return;
    openSheet(/*#__PURE__*/React.createElement(HabitTileMenuLive, {
      habit: h,
      dark: isDark,
      onShare: () => openSheet(/*#__PURE__*/React.createElement(ShareHabitSheetLive, {
        habit: h,
        dark: isDark
      })),
      onReorder: openReorder,
      onDelete: () => bosConfirmDelete(openSheet, {
        title: "Удалить привычку?",
        message: "«" + h.name + "» и вся история отметок удалятся навсегда.",
        confirmLabel: "Удалить",
        onConfirm: () => remove(h.id)
      })
    }));
  };

  // Тап по пилюле-челленджу → сначала шторка-знакомство с правилами, и только после согласия —
  // создание через ЕДИНЫЙ bosCommitChallenge (тот же путь, что у шторки-каталога «+»).
  var startChallenge = c => {
    if (window.tgHaptic) {
      try {
        window.tgHaptic("light");
      } catch (e) {}
    }
    openSheet(/*#__PURE__*/React.createElement(ChallengeIntroSheet, {
      c: c,
      dark: isDark,
      onStart: () => bosCommitChallenge(app, c, {
        navigate,
        openSheet
      })
    }));
  };

  // Смешанный список: привычки + цели в едином порядке (ключи "h<id>"/"g<id>"), отсортированы по
  // сохранённому порядку перестановки; новые элементы — в конец.
  var entries = React.useMemo(() => {
    var all = habits.filter(h => !h.goalOnly).map(h => ({
      k: "h" + h.id,
      type: "h",
      item: h
    })).concat(goals.map(g => ({
      k: "g" + g.id,
      type: "g",
      item: g
    })))
    // Команды (круги/командные цели) живут в ТОЙ ЖЕ сетке — их можно тащить и ставить между
    // привычками/целями, как просил David. Ключ "t<id>" (cloud _id или локальный id).
    .concat(teams.map(t => ({
      k: "t" + (t._id != null ? t._id : t.id),
      type: "t",
      item: t
    })));
    var saved = bosLoadPracticeOrder();
    if (saved && saved.length) {
      var pos = {};
      saved.forEach((k, i) => {
        pos[k] = i;
      });
      return all.map((e, i) => ({
        e: e,
        i: i
      })).sort((a, b) => (pos[a.e.k] != null ? pos[a.e.k] : 1000 + a.i) - (pos[b.e.k] != null ? pos[b.e.k] : 1000 + b.i)).map(x => x.e);
    }
    return all;
  }, [habits, goals, teams, orderTick]);

  // ПЛИТКА ПРИВЫЧКИ — вынесена в ОБЩИЙ HabitTileLive (shared_live), чтобы страница «Привычки» и виджет
  // главной рисовали одно и то же и слушали один cardStyle (David: «унифицировать»). Тут — тонкая обёртка.
  var habitTile = (h, ctx) => /*#__PURE__*/React.createElement(HabitTileLive, {
    habit: h,
    ctx: ctx,
    from: "habits"
  });

  // ПЛИТКА ЦЕЛИ — та же логика форм/тоглов. «Отметки» у цели = полоска прогресса (показываем пока
  // marks ≠ «нет»). Недельной/месячной сетки у цели нет — прогресс её замена. Лица тоже наверх.
  // ЕДИНЫЙ «СКИН» карточки цели/команды (David: дефолт = БЕЛЫЙ/светло-серый; ЦВЕТ, если задан, заливает
  // карточку КАК КАРТОЧКИ ПАРТНЁРОВ — насыщенный accent + белый градиент-блик + тёмный текст). Чёрный
  // (#0a0a0a, старый дефолт) считаем НЕйтральным → белая карточка. Один источник вида для goalTile+teamTile.
  // ЕДИНЫЙ «скин» карточки цели/команды — вынесен в общий bosGoalSkin (shared_live), тут делегируем
  // (нужен teamTile ниже). Значения идентичны прежним (rowBg/cardShadow/iconBg производятся от isDark).
  var goalSkin = color => bosGoalSkin(color, isDark);

  // ПЛИТКА ЦЕЛИ — вынесена в ОБЩИЙ GoalTileLive (shared_live), тут тонкая обёртка (унификация с главной).
  var goalTile = (g, ctx) => /*#__PURE__*/React.createElement(GoalTileLive, {
    goal: g,
    ctx: ctx,
    from: "habits"
  });

  // ПЛИТКА КОМАНДЫ (круга) — та же форма, что цель, но эмблема + ЛИЦА участников + метка «Команда»
  // (чтобы читалась как «цель с людьми», а не соло-цель). Прогресс = командный (счёт всех / target,
  // либо процент). Тап открывает круг. Живёт в общей сетке → перетаскивается наравне с привычками.
  // КОМАНДА = общая цель → тот же goalStyle (баннер/квадрат + орбиты + прогресс + название). Орбита
  // команды показывает УЧАСТНИКОВ (лица) + командные привычки. Метка «Команда» сохранена в прогрессе.
  var teamTile = (t, ctx) => {
    var banner = goalStyle.form === "banner";
    // ЕДИНЫЙ ИСТОЧНИК с деталью команды (David: «на внешней должно показываться всё то же
    // самое, просто обрезаться»): плитка ест тот же stale-while-revalidate кэш _bosTeamGet
    // (живёт в community_live, persist в localStorage) — ВСЕ привычки круга, живой ростер и
    // облачный счёт цели, а не бедный локальный снапшот (из-за него внутри было два кольца,
    // снаружи одно). Кэша нет (первый вход/оффлайн) → прежние t.habits/t.members.
    var _ck = t.cloudId || null;
    var _cHabits = _ck && typeof _bosTeamGet === "function" ? _bosTeamGet("habits:" + _ck) : null;
    var _cRoster = _ck && typeof _bosTeamGet === "function" ? _bosTeamGet("roster:" + _ck) : null;
    var _cGoal = _ck && typeof _bosTeamGet === "function" ? _bosTeamGet("goal:" + _ck) : null;
    var tHabits = Array.isArray(_cHabits) && _cHabits.length ? _cHabits : Array.isArray(t.habits) ? t.habits : [];
    var tgt = _cGoal && _cGoal.target || t.target || 0;
    var cur = _cGoal && _cGoal.current != null ? _cGoal.current : t.current != null ? t.current : Math.round((t.progress || 0) * tgt);
    var pct = tgt > 0 ? Math.min(1, cur / tgt) : t.progress || 0;
    var sk = goalSkin(t.accent || t.color);
    var onOpen = ctx.mode ? undefined : () => navigate("team-detail", {
      team: t,
      from: "habits"
    });
    // t.members из облачного списка бывает ЧИСЛОМ (count), из снапшота — массивом лиц: guard.
    var members = Array.isArray(_cRoster) && _cRoster.length ? _cRoster : Array.isArray(t.members) ? t.members : [];
    // УНИФИКАЦИЯ с плиткой цели и деталью команды (David: «чуть не унифицировано местами»):
    // пульс и здесь — привычка done горит своим цветом (через МОЮ локальную копию по teamHabitId,
    // id-guard от офлайн-команд без id), кольцо человека = доля закрытых им сегодня привычек
    // круга (todayUsers из кэша детали), фолбэк — отметка дня из снапшота.
    var _tk = typeof bosTodayKey === "function" ? bosTodayKey() : null;
    var orbitHabits = tHabits.map(h => {
      var mine = h && h.id != null ? (habits || []).find(x => x.teamHabitId === h.id) : null;
      return {
        emoji: h && h.emoji,
        color: mine && mine.color || h && h.color || null,
        done: mine ? !!mine.done : !!(h && h.doneByMe)
      };
    });
    var _pt = tHabits.length || 0;
    var _anyTU = tHabits.some(h => h && Array.isArray(h.todayUsers));
    var orbitPeople = members.filter(Boolean).map(m => {
      var progress = null;
      if (_pt && _anyTU && m.id != null) progress = tHabits.filter(h => h && Array.isArray(h.todayUsers) && h.todayUsers.indexOf(m.id) !== -1).length / _pt;
      return {
        avatar: m.avatar,
        name: m.name,
        active: !!(_tk && m.days && m.days[_tk]),
        progress
      };
    });
    var orbit = goalStyle.orbits && typeof GoalOrbitMini === "function" ? /*#__PURE__*/React.createElement(GoalOrbitMini, {
      centerEmoji: t.emblem || "👥",
      centerColor: t.accent || t.color,
      habits: orbitHabits,
      people: orbitPeople,
      size: banner ? 132 : 152,
      dark: isDark,
      fade: true,
      progress: pct
    }) : null;
    var faces = !orbit && members.length ? /*#__PURE__*/React.createElement("span", {
      style: {
        display: "flex",
        alignItems: "center",
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement(PeopleStackLive, {
      people: members,
      size: 20,
      max: 3
    })) : null;
    var pctEl = /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 800,
        color: sk.hasColor ? sk.txt : sk.accent,
        fontVariantNumeric: "tabular-nums",
        flexShrink: 0
      }
    }, Math.round(pct * 100), "%");
    var valTxt = t.target ? cur + " / " + tgt + " " + (t.unit || "") : Math.round(pct * 100) + "%";
    var progBar = goalStyle.progress ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginBottom: 5
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        fontWeight: 700,
        color: sk.lbl,
        textTransform: "uppercase",
        letterSpacing: 0.7
      }
    }, "\u0426\u0435\u043B\u044C"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 600,
        color: sk.val,
        fontVariantNumeric: "tabular-nums"
      }
    }, valTxt)), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 7,
        borderRadius: 999,
        background: sk.track,
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "block",
        height: "100%",
        width: pct * 100 + "%",
        borderRadius: 999,
        background: sk.hasColor ? sk.fill : "linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0) 72%), " + sk.accent
      }
    }))) : null;
    var icon = /*#__PURE__*/React.createElement("span", {
      style: {
        width: 40,
        height: 40,
        borderRadius: 13,
        background: sk.iconBg,
        boxShadow: bosTileGlass(isDark),
        display: "grid",
        placeItems: "center",
        fontSize: 20,
        flexShrink: 0
      }
    }, bosIcon(t.emblem || "👥", 22, sk.hasColor ? sk.iconInk : t.accent || t.color));
    if (banner) {
      return /*#__PURE__*/React.createElement("div", {
        className: ctx.mode ? "" : "tap",
        onClick: onOpen,
        style: {
          background: sk.bg,
          borderRadius: 22,
          boxShadow: sk.shadow,
          padding: 16,
          display: "flex",
          alignItems: "center",
          gap: 14,
          minHeight: 116,
          pointerEvents: ctx.mode ? "none" : "auto",
          overflow: "hidden"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 11
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 12
        }
      }, !orbit && icon, /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1,
          minWidth: 0
        }
      }, goalStyle.name && /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 16,
          fontWeight: 700,
          color: sk.txt,
          letterSpacing: "-0.3px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        }
      }, t.name), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11.5,
          color: sk.sub,
          marginTop: 1
        }
      }, "\u0412\u043C\u0435\u0441\u0442\u0435", members.length ? " · " + members.length : "")), !orbit && (faces || pctEl)), progBar), orbit);
    }
    return /*#__PURE__*/React.createElement("div", {
      className: ctx.mode ? "" : "tap",
      onClick: onOpen,
      style: {
        background: sk.bg,
        borderRadius: 22,
        boxShadow: sk.shadow,
        padding: "13px 13px 12px",
        height: orbit ? 146 : undefined,
        minHeight: 146,
        boxSizing: "border-box",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "flex-start",
        textAlign: "left",
        pointerEvents: ctx.mode ? "none" : "auto",
        overflow: "hidden"
      }
    }, orbit ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      "aria-hidden": true,
      style: {
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none"
      }
    }, orbit), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: "auto",
        position: "relative",
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 8
      }
    }, goalStyle.name ? /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0,
        fontSize: 14,
        fontWeight: 600,
        color: sk.txt,
        letterSpacing: "-0.2px",
        lineHeight: 1.2,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, t.name) : /*#__PURE__*/React.createElement("span", null), goalStyle.progress && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        fontWeight: 800,
        color: sk.hasColor ? sk.txt : sk.accent,
        fontVariantNumeric: "tabular-nums",
        flexShrink: 0
      }
    }, Math.round(pct * 100), "%"))) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8
      }
    }, icon, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexShrink: 0
      }
    }, faces, pctEl)), goalStyle.name && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 10,
        fontSize: 15,
        fontWeight: 600,
        color: sk.txt,
        letterSpacing: "-0.2px",
        lineHeight: 1.25,
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden"
      }
    }, t.name), progBar && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: "auto",
        paddingTop: 12
      }
    }, progBar)));
  };
  return /*#__PURE__*/React.createElement("div", {
    ref: wrapRef,
    className: "page-in",
    style: {
      padding: "0 12px 24px"
    }
  }, /*#__PURE__*/React.createElement(CreateMenuLive, {
    open: createOpen,
    onClose: () => setCreateOpen(false),
    anchorRef: addBtnRef,
    navigate: navigate
  }), typeof CardStyleMenuLive === "function" && /*#__PURE__*/React.createElement(CardStyleMenuLive, {
    open: styleOpen,
    onClose: () => setStyleOpen(false),
    anchorRef: gearBtnRef
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: "flex",
      gap: 8,
      overflowX: "auto",
      scrollbarWidth: "none",
      WebkitOverflowScrolling: "touch",
      touchAction: "pan-x",
      padding: "2px 1px",
      WebkitMaskImage: "linear-gradient(90deg, #000 88%, transparent)",
      maskImage: "linear-gradient(90deg, #000 88%, transparent)"
    }
  }, CHALLENGE_STARTERS.map((c, i) => {
    var xp = c.bonus;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      className: "tap",
      "data-no-haptic": true,
      onClick: () => startChallenge(c),
      style: {
        ...(typeof bosChipGlass === "function" ? bosChipGlass(isDark) : {
          background: TH.chipBg
        }),
        borderRadius: 999,
        padding: "7px 9px 7px 11px",
        border: 0,
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        whiteSpace: "nowrap",
        animation: "briefPop 0.4s cubic-bezier(0.22,0.9,0.3,1.2) both " + i * 0.03 + "s"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 15,
        lineHeight: 1
      }
    }, c.i), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 600,
        color: TH.chipText
      }
    }, c.t), c.kind === "together" && /*#__PURE__*/React.createElement(I.Users, {
      size: 12,
      color: TH.chipText,
      style: {
        opacity: 0.55,
        marginLeft: -2
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10.5,
        fontWeight: 800,
        color: "#9a6800",
        background: "rgba(245,180,30,0.18)",
        borderRadius: 999,
        padding: "2px 6px",
        letterSpacing: "-0.2px",
        lineHeight: 1.3
      }
    }, "+", xp, " XP"));
  })), /*#__PURE__*/React.createElement("button", {
    ref: addBtnRef,
    "data-tour": "add",
    onClick: () => {
      setCreateOpen(true);
      if (window.tgHaptic) {
        try {
          window.tgHaptic("light");
        } catch (e) {}
      }
    },
    className: "tap",
    title: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C",
    "aria-haspopup": "menu",
    "aria-expanded": createOpen,
    style: {
      flexShrink: 0,
      width: 44,
      height: 44,
      borderRadius: 999,
      ...(typeof bosChipGlass === "function" ? bosChipGlass(isDark) : {
        background: TH.chipBg
      }),
      color: isDark ? "#fff" : "var(--text)",
      border: 0,
      display: "grid",
      placeItems: "center"
    }
  }, /*#__PURE__*/React.createElement(I.Plus, {
    size: 20,
    strokeWidth: 2.2,
    style: {
      transition: "transform 0.34s cubic-bezier(0.34,1.5,0.4,1)",
      transform: createOpen ? "rotate(45deg)" : "none"
    }
  })), /*#__PURE__*/React.createElement("button", {
    ref: gearBtnRef,
    onClick: () => {
      setStyleOpen(true);
      if (window.tgHaptic) {
        try {
          window.tgHaptic("light");
        } catch (e) {}
      }
    },
    className: "tap",
    title: "\u0421\u0442\u0438\u043B\u044C \u043A\u0430\u0440\u0442\u043E\u0447\u0435\u043A",
    "aria-haspopup": "menu",
    "aria-expanded": styleOpen,
    style: {
      flexShrink: 0,
      width: 44,
      height: 44,
      borderRadius: 999,
      ...(typeof bosChipGlass === "function" ? bosChipGlass(isDark) : {
        background: TH.chipBg
      }),
      color: isDark ? "#fff" : "var(--text)",
      border: 0,
      display: "grid",
      placeItems: "center"
    }
  }, /*#__PURE__*/React.createElement(I.Settings, {
    size: 19,
    strokeWidth: 2
  }))), entries.length === 0 ? /*#__PURE__*/React.createElement("button", {
    className: "tap",
    onClick: () => {
      setCreateOpen(true);
      if (window.tgHaptic) {
        try {
          window.tgHaptic("light");
        } catch (e) {}
      }
    },
    style: {
      width: "100%",
      background: TH.cardBg,
      border: 0,
      borderRadius: 22,
      padding: "30px 20px",
      boxShadow: cardShadow,
      color: "var(--text)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 54,
      height: 54,
      borderRadius: 16,
      background: TH.iconBg,
      display: "grid",
      placeItems: "center",
      fontSize: 27
    }
  }, "\uD83C\uDF31"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 600
    }
  }, "\u0417\u0434\u0435\u0441\u044C \u0431\u0443\u0434\u0443\u0442 \u0442\u0432\u043E\u0438 \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0438 \u0438 \u0446\u0435\u043B\u0438"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: "var(--text-4)",
      lineHeight: 1.45,
      maxWidth: 260
    }
  }, "\u041D\u0430\u0436\u043C\u0438 \xAB+\xBB \u0432\u0432\u0435\u0440\u0445\u0443 \u2014 \u0437\u0430\u0432\u0435\u0434\u0438 \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0443 \u0438\u043B\u0438 \u0441\u043E\u0431\u0435\u0440\u0438 \u043A\u0440\u0443\u0433. \u041A\u0430\u0440\u0442\u043E\u0447\u043A\u0438 \u043F\u043E\u0442\u043E\u043C \u0440\u0430\u0441\u0441\u0442\u0430\u0432\u0438\u0448\u044C \u043A\u0430\u043A \u0443\u0434\u043E\u0431\u043D\u043E.")) : /*#__PURE__*/React.createElement(BosReorderGrid, {
    ids: entries.map(e => e.k),
    onReorder: keys => {
      bosSavePracticeOrder(keys);
      setOrderTick(t => t + 1);
    },
    onLongPress: onTileLongPress,
    ctlRef: gridCtl,
    cols: 2,
    gap: 12,
    spanFull: k => {
      // Сетка ВСЕГДА 2-колоночная; КАЖДАЯ плитка сама решает ширину по СВОЕЙ форме (David: «квадрат
      // цели должен стать квадратом, даже если привычки строкой»). Строка-привычка и баннер-цель =
      // во всю ширину; квадрат = половина. Раньше колонки зависели от формы привычек → квадрат цели
      // растягивался в 1-колоночной сетке. Теперь формы привычек и целей независимы.
      if (!k) return false;
      if (k[0] === "g" || k[0] === "t") return goalStyle.form === "banner";
      return cardStyle.form === "rect";
    },
    renderItem: (k, ctx) => {
      var e = entries.find(x => x.k === k);
      if (!e) return null;
      return e.type === "t" ? teamTile(e.item, ctx) : e.type === "g" ? goalTile(e.item, ctx) : habitTile(e.item, ctx);
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      background: TH.cardBg,
      borderRadius: 18,
      boxShadow: cardShadow,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: toggleLearn,
    className: "tap",
    "data-no-haptic": true,
    "aria-expanded": !learnHidden,
    "aria-label": learnHidden ? "Раскрыть обучение" : "Свернуть обучение",
    style: {
      width: "100%",
      background: "transparent",
      border: 0,
      padding: "13px 15px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 11,
      fontSize: 14.5,
      fontWeight: 600,
      color: "var(--text-2)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 10,
      background: TH.iconBg,
      display: "grid",
      placeItems: "center",
      fontSize: 16
    }
  }, "\uD83C\uDF93"), "\u041E\u0431\u0443\u0447\u0435\u043D\u0438\u0435"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      color: "var(--text-4)",
      fontSize: 13,
      fontWeight: 500
    }
  }, learnHidden ? "Раскрыть" : "Свернуть", /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      transform: learnHidden ? "rotate(90deg)" : "rotate(-90deg)",
      transition: "transform 0.3s cubic-bezier(0.34,1.3,0.4,1)"
    }
  }, /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 14
  })))), !learnHidden && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "0 13px 6px"
    }
  }, [{
    topic: "habits-basics",
    emoji: "🌱",
    t: "Основы привычек",
    b: "Почему маленькое сильнее большого — и как не пропускать дважды."
  }, {
    topic: "goals-101",
    emoji: "🎯",
    t: "Хорошие цели",
    b: "Результат или процесс: что отслеживать и когда."
  }, {
    topic: "teams-101",
    emoji: "🤝",
    t: "Командные привычки",
    b: "Один общий якорь, общая серия и поддержка вместо контроля."
  }].map((c, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => navigate("info", {
      topic: c.topic
    }),
    className: "tap",
    style: {
      width: "100%",
      background: "transparent",
      border: 0,
      borderTop: i ? "1px solid " + TH.divider : "0",
      padding: "12px 4px",
      display: "flex",
      alignItems: "center",
      gap: 12,
      textAlign: "left",
      color: "var(--text)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 36,
      height: 36,
      borderRadius: 12,
      background: TH.iconBg,
      display: "grid",
      placeItems: "center",
      fontSize: 18,
      flexShrink: 0
    }
  }, c.emoji), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 600,
      color: "var(--text)"
    }
  }, c.t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-4)",
      marginTop: 2,
      lineHeight: 1.4
    }
  }, c.b)), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 15,
    color: "var(--text-4)"
  }))))));
}

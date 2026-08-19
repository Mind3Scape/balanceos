/* КОМНАТА КРУГА v2 — ОДИН сплошной экран (макеты И·К финала, _devgoal3.html, 2026-07-16).

   Что было: три вкладки (Обзор · Привычки · Чат, v734) — целиком в _parked/circle-tabs-v734/.
   Что стало (сверху вниз, как читается день):
     нить дня → серия круга → [заявки владельцу] → «Мой день» (чекбоксы СПРАВА, дела в том же
     списке с меткой) → «Люди» (грид лиц — решение David 2026-07-16) → «Пульс дня» (отметки,
     пачки «+34 к 08:00», огоньки, ВЕХИ и ЧАТ — одна лента) → композер.

   Три жеста навигации (макет И): КРУЖОК = отметить · СТРОКА = статистика привычки (Л, ступень 3)
   · ЛИЦО = карточка человека (кадр 3). Кабинет ведущего (К) — тихая пилюля-компас в шапке,
   видна только владельцу; красный бейдж = заявки + «теряем» (молчат 3+ дня).

   Решения David 2026-07-16: везде ЧЕКБОКСЫ (никаких «+км»/«держишься» — таких типов у нас нет);
   банк XP остаётся ТОНКО (строка в шапке + веха в пульсе); просьбы и отдельный календарь круга —
   в архив; у человека ОДНА неделя; в карточке человека виден его УРОВЕНЬ. */

var BOS_ROOM_GOLD = "#EF9F14", BOS_ROOM_GOLD_L = "#FEDE34", BOS_ROOM_GOLD_INK = "#B4820A";

// Локальный ключ дня для смещения на n дней назад (тот же формат, что bosTodayKey).
function bosRoomDayKey(offsetBack) {
  var d = new Date(); d.setDate(d.getDate() - (offsetBack || 0));
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
// «1 отметка · 2 отметки · 5 отметок» — для подписи под кривой роста, когда у круга
// нет своей единицы (км, страниц, ночей).
function bosRoomMarksWord(n) {
  var a = n % 10, b = n % 100;
  return (a === 1 && b !== 11) ? "отметка" : ((a >= 2 && a <= 4 && (b < 12 || b > 14)) ? "отметки" : "отметок");
}
function bosRoomHHMM(ts) {
  try { var d = (typeof bosParseTs === "function") ? bosParseTs(ts) : new Date(ts); var m = d.getMinutes(); return d.getHours() + ":" + (m < 10 ? "0" + m : m); } catch (e) { return ""; }
}
function bosRoomPeopleWord(n) { return (n % 10 === 1 && n % 100 !== 11) ? "человек" : ((n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? "человека" : "человек"); }
function bosRoomDaysWord(n) { return (n % 10 === 1 && n % 100 !== 11) ? "день" : ((n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? "дня" : "дней"); }
/* «Четверо уже в деле» вместо «4 отметились» (словарь v5: факт вместо отчёта). Собирательные
   числительные бесполые — ими можно говорить и про Марину, и про Игоря. */
var BOS_ROOM_COUNT_WORDS = ["никто", "один", "двое", "трое", "четверо", "пятеро", "шестеро", "семеро", "восьмеро", "девятеро", "десятеро"];
function bosRoomCountWord(n) { return (n >= 0 && n < BOS_ROOM_COUNT_WORDS.length) ? BOS_ROOM_COUNT_WORDS[n] : (n + " " + bosRoomPeopleWord(n)); }
var BOS_ROOM_MON_GEN = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
/* «5 июня» из ISO/даты; год добавляем только если он не текущий. */
function bosRoomDateWord(x) {
  try {
    var d = (typeof bosParseTs === "function" && typeof x === "string") ? bosParseTs(x) : new Date(x);
    if (isNaN(d.getTime())) return "";
    var s = d.getDate() + " " + BOS_ROOM_MON_GEN[d.getMonth()];
    if (d.getFullYear() !== new Date().getFullYear()) s += " " + d.getFullYear();
    return s;
  } catch (e) { return ""; }
}

/* Плоский чекбокс — ЕДИНСТВЕННЫЙ жест отметки в круге (язык v757: заливка чёрным/белым, галка).
   Зона нажатия 42px при видимых 28 — палец, целящийся в кружок, не промахивается в строку
   (промах открывал шторку статистики — David: «с чего у нас шторка открывается?»). */
function BosFlatCheckLive({ on, isDark, onToggle, label }) {
  return (
    <button onClick={onToggle} className="tap" aria-label={label || "Отметить"}
      style={{ width: 42, height: 42, margin: "-7px -7px -7px 0", borderRadius: "50%", flexShrink: 0, border: 0, display: "grid", placeItems: "center", cursor: "pointer", padding: 0, background: "transparent" }}>
      {/* Цвет с токенов, а не прибитыми #fff/#0a0a0a: внутри .fig кружок должен слушаться
          палитры редизайна, снаружи — прежней. Размер 24 (в макете Circle 22; 22 на живом
          экране читается мелко рядом со значком 52, 24 — ближайший, что не рвёт ритм). */}
      <span style={{ width: 24, height: 24, borderRadius: "50%", display: "grid", placeItems: "center",
        background: on ? "var(--accent-blue)" : "transparent",
        boxShadow: on ? "none" : "inset 0 0 0 1.5px " + (isDark ? "rgba(255,255,255,0.25)" : "rgba(10,10,10,0.18)"),
        transition: "background .15s" }}>
        {on ? <I.Check size={13} strokeWidth={3} color="#fff" /> : null}
      </span>
    </button>
  );
}

/* Лицо участника: цветное — сегодня в деле, серое — ещё нет. gold — золотой ободок (я/сегодня). */
function BosRoomFaceLive({ p, size, active, gold, isDark, onClick, level, accent }) {
  // Кольцо «это ты / выбранный» — в цвете привычки/цели/круга (David 2026-08-01: «выделение
  // „Кто со мной" тоже должно быть в цвет, а не оранжевым»). Нейтральный объект → золото.
  var _ringCol = (typeof bosAccentPaint === "function") ? bosAccentPaint(accent, isDark).solid : BOS_ROOM_GOLD;
  var ring = "0 0 0 2px " + (isDark ? "#1c1c20" : "#fff") + (gold ? ", 0 0 0 3.4px " + _ringCol : "");
  // Бейдж уровня — ВНЕ грейскейла молчащих: цифра читается всегда (David: «хочу видеть лвлы»).
  var node = (
    <span style={{ position: "relative", borderRadius: "50%", lineHeight: 0, flexShrink: 0, display: "inline-block", boxShadow: ring }}>
      <span style={{ display: "inline-block", lineHeight: 0, borderRadius: "50%", filter: active === false ? "grayscale(1)" : "none", opacity: active === false ? 0.45 : 1 }}>
        <BuddyFaceLive avatar={p.avatar} name={p.name} size={size} />
      </span>
      {(level | 0) > 0 && (
        <span style={{ position: "absolute", right: -5, bottom: -3, minWidth: 15, height: 15, padding: "0 3px", borderRadius: 999, background: isDark ? "#26262b" : "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 8.5, fontWeight: 800, color: BOS_ROOM_GOLD_INK, lineHeight: 1 }}>{level | 0}</span>
      )}
    </span>
  );
  if (!onClick) return node;
  return <button onClick={onClick} className="tap" aria-label={p.name || "Участник"} style={{ border: 0, background: "transparent", padding: 0, lineHeight: 0, cursor: "pointer" }}>{node}</button>;
}

/* Заголовок раздела — тонкая капс-строка (язык макета). */
function BosRoomH2({ children, extra }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "16px 4px 8px" }}>
      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-4)" }}>{children}</span>
      {extra || null}
    </div>
  );
}

/* ЖАЛОБА — два шага из макета (кадры 719:27255 «Жалоба» и 719:29291 «Пожаловаться»).
   Шаг 1: заголовок 34/700, подпись «Выберите причину», карточка из 11 строк со шевронами.
   Шаг 2: название причины, блок «Запрещается:» списком, поле «Описание жалобы» с счётчиком
   «0 из 200» и КРАСНАЯ кнопка «Отправить жалобу».

   Формулировки причин и текст правил взяты из макета ДОСЛОВНО (вычитаны из кадров и узлов).
   Правила расписаны дизайнерами пока только для первой причины — для остальных блок не
   показываем, вместо него нельзя писать отсебятину.

   Отправка: пишем в таблицу reports, если она уже заведена; если её нет — жалоба не
   исчезает молча, человек видит честное «не удалось отправить». Ничего не имитируем. */
var BOS_REPORT_REASONS = [
  { id: "hate", t: "Ненависть и преследование", head: "Разжигание ненависти словами или действиями", rules: [
    "Разжигание ненависти на основе расы, этнической принадлежности или религии.",
    "Не допускается использование оскорбительных слов и выражений.",
    "Запрещено подстрекательство к насилию или агрессии.",
    "Не разрешается распространение ненавистнических материалов или контента.",
    "Запрещается манипуляция с фактами для разжигания ненависти.",
  ] },
  { id: "members", t: "Неподобающее поведение участников" },
  { id: "virus", t: "Распространение вирусов" },
  { id: "intimidation", t: "Запугивание пользователей" },
  { id: "admins", t: "Некорректное поведение администраторов" },
  { id: "kids", t: "Недопустимое содержание для детей" },
  { id: "fake", t: "Фальшивые новости" },
  { id: "violence", t: "Призывы к насилию" },
  { id: "insult", t: "Оскорбления и ненависть" },
  { id: "copyright", t: "Нарушение авторских прав" },
  { id: "spam", t: "Спам" },
];

function CircleReportSheetLive({ team, isDark }) {
  const { close } = useSheet();
  const [reason, setReason] = React.useState(null);
  const [text, setText] = React.useState("");
  const [state, setState] = React.useState("idle"); // idle | sending | sent | error
  const LIMIT = 200;

  const send = async () => {
    if (state === "sending") return;
    setState("sending");
    let ok = false;
    try {
      if (window.bosCloud && window.bosCloud.enabled() && window.bosCloud.sendReport) {
        ok = await window.bosCloud.sendReport({ kind: "team", targetId: team.cloudId, reason: reason.id, text: text.slice(0, LIMIT) });
      }
    } catch (e) { ok = false; }
    setState(ok ? "sent" : "error");
    if (window.tgHaptic) { try { window.tgHaptic(ok ? "success" : "error"); } catch (e) {} }
    if (ok) setTimeout(close, 900);
  };

  if (!reason) {
    return (
      <div style={{ padding: "2px 0 8px" }}>
        <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.8px", color: "var(--text)", padding: "4px 4px 6px" }}>Жалоба</div>
        <div style={{ fontSize: 17, color: "var(--text-2)", padding: "0 4px 12px" }}>Выберите причину</div>
        <div style={{ background: "var(--surface-2)", borderRadius: 14, overflow: "hidden" }}>
          {BOS_REPORT_REASONS.map((r, i) => (
            <button key={r.id} onClick={() => setReason(r)} className="tap"
              style={{ width: "100%", border: 0, borderTop: i ? "0.5px solid var(--line-2)" : 0, background: "transparent", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", textAlign: "left", color: "var(--text)", fontSize: 17, lineHeight: 1.25 }}>
              <span style={{ flex: 1 }}>{r.t}</span>
              <I.ChevronRight size={17} color="var(--text-3)" style={{ flexShrink: 0 }} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2px 0 8px" }}>
      <button onClick={() => setReason(null)} className="tap" aria-label="Назад"
        style={{ width: 36, height: 36, borderRadius: "50%", border: 0, background: "var(--surface-2)", display: "grid", placeItems: "center", cursor: "pointer", color: "var(--text)", marginBottom: 8 }}>
        <I.ChevronLeft size={20} strokeWidth={2.4} />
      </button>
      <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.8px", color: "var(--text)", padding: "0 4px 10px" }}>Пожаловаться</div>
      <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.4px", color: "var(--text)", padding: "0 4px 8px", lineHeight: 1.25 }}>{reason.head || reason.t}</div>

      {reason.rules && (
        <div style={{ padding: "0 4px 14px" }}>
          <div style={{ fontSize: 17, color: "var(--text-2)", marginBottom: 4 }}>Запрещается:</div>
          {reason.rules.map((x, i) => (
            <div key={i} style={{ display: "flex", gap: 8, fontSize: 17, color: "var(--text-2)", lineHeight: 1.32, padding: "1px 0" }}>
              <span aria-hidden style={{ flexShrink: 0 }}>·</span><span>{x}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ fontSize: 17, fontWeight: 590, color: "var(--text)", padding: "4px 4px 8px" }}>Описание жалобы</div>
      <textarea value={text} onChange={(e) => setText(e.target.value.slice(0, LIMIT))} rows={5}
        placeholder="Расскажите о проблеме подробнее"
        style={{ width: "100%", boxSizing: "border-box", border: 0, outline: "none", resize: "none", borderRadius: 14,
          background: "var(--surface-2)", color: "var(--text)", fontSize: 17, lineHeight: 1.3, padding: "14px 16px", fontFamily: "inherit" }} />
      <div style={{ textAlign: "right", fontSize: 15, color: "var(--text-3)", padding: "6px 4px 0" }}>{text.length + " из " + LIMIT}</div>

      {state === "error" && (
        <div style={{ fontSize: 15, color: "var(--accent-red)", padding: "8px 4px 0", lineHeight: 1.35 }}>
          Не удалось отправить — приём жалоб на сервере ещё не включён. Ничего не потеряно: попробуй позже.
        </div>
      )}

      <button onClick={send} disabled={state === "sending" || state === "sent"} className="tap"
        style={{ width: "100%", marginTop: 16, height: 50, borderRadius: 999, border: 0, cursor: "pointer",
          background: "var(--accent-red)", color: "#fff", fontSize: 17, fontWeight: 590, opacity: state === "sending" ? 0.6 : 1 }}>
        {state === "sent" ? "Жалоба отправлена" : "Отправить жалобу"}
      </button>
    </div>
  );
}

/* МЕНЮ ГРУППЫ — ШТОРКА СНИЗУ (кадры «Группа Меню»: участник 1291:40957, админ 1319:44403,
   гость 1291:41167). Раньше «⋯» открывал выпадающий список у кнопки — в макете это шторка
   с совсем другой раскладкой (David 19.08: «вкладки меню располагаются не так»).

   Анатомия из макета, одинаковая у всех трёх ролей:
     ряд из ТРЁХ крупных действий — значок сверху, подпись 15 снизу, равные колонки;
     карточка обычных строк (значок-контур 24, текст 17, шеврон);
     карточка КРАСНЫХ строк внизу.
   Различия ролей:
     участник — [♥ В избранное][🔔 Уведомления][↗ Поделится] · О группе · Пожаловаться + Выйти
     админ    — те же три · О группе + Редактировать группу · Выйти + Удалить группу
     гость    — [⊞ Вступить][🔔 приглушено][↗ Поделится] · О группе · Пожаловаться

   «В избранное» — местная пометка (bos:favteam:<id>): поля «избранное» у круга в базе нет,
   и заводить его ради галочки не стали; пометка живёт на устройстве, как и задумано в макете
   (это МОЙ список, не общий). */
function CircleMenuSheetLive({ team, role, isDark, unreadN, onAbout, onShare, onNotify, onEdit, onReport, onLeave, onDelete, onJoin }) {
  const { close } = useSheet();
  const favKey = "bos:favteam:" + (team.cloudId || team._id || team.id || "");
  const [fav, setFav] = React.useState(() => { try { return localStorage.getItem(favKey) === "1"; } catch (e) { return false; } });
  const toggleFav = () => {
    const v = !fav; setFav(v);
    try { v ? localStorage.setItem(favKey, "1") : localStorage.removeItem(favKey); } catch (e) {}
    if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} }
  };
  const isGuest = role === "guest", isAdmin = role === "admin";
  const run = (fn) => () => { close(); if (typeof fn === "function") setTimeout(fn, 60); };

  const CARD = { background: "var(--surface-2)", borderRadius: 14, overflow: "hidden" };
  const ROW = { width: "100%", border: 0, background: "transparent", cursor: "pointer", display: "flex",
    alignItems: "center", gap: 12, padding: "14px 16px", textAlign: "left", fontSize: 17 };

  // Верхний ряд: три равные колонки со значком и подписью.
  const big = (icon, label, onClick, muted) => (
    <button onClick={muted ? undefined : onClick} disabled={!!muted} className={muted ? undefined : "tap"}
      style={{ border: 0, background: "transparent", cursor: muted ? "default" : "pointer", padding: "6px 4px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
        color: muted ? "var(--text-3)" : "var(--text)", opacity: muted ? 0.5 : 1 }}>
      {icon}
      <span style={{ fontSize: 15 }}>{label}</span>
    </button>
  );

  return (
    <div style={{ padding: "2px 0 6px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "10px 0 18px" }}>
        {isGuest
          ? big(<I.PlusCircle size={28} />, "Вступить", run(onJoin))
          : big(<I.Heart size={28} filled={fav} color={fav ? "var(--accent-red)" : undefined} />, "В избранное", toggleFav)}
        {big(<I.Bell size={28} />, "Уведомления", run(onNotify), isGuest)}
        {big(<I.Share size={28} />, "Поделиться", run(onShare))}
      </div>

      <div style={CARD}>
        <button onClick={run(onAbout)} className="tap" style={{ ...ROW, color: "var(--text)" }}>
          <I.Info size={24} /><span style={{ flex: 1 }}>О группе</span>
          <I.ChevronRight size={17} color="var(--text-3)" />
        </button>
        {isAdmin && (
          <button onClick={run(onEdit)} className="tap" style={{ ...ROW, color: "var(--text)", borderTop: "0.5px solid var(--line-2)" }}>
            <I.Pencil size={24} strokeWidth={1.7} /><span style={{ flex: 1 }}>Редактировать группу</span>
            <I.ChevronRight size={17} color="var(--text-3)" />
          </button>
        )}
      </div>

      <div style={{ ...CARD, marginTop: 12 }}>
        {!isAdmin && (
          <button onClick={run(onReport)} className="tap" style={{ ...ROW, color: "var(--accent-red)" }}>
            <I.Warning size={24} /><span style={{ flex: 1 }}>Пожаловаться</span>
          </button>
        )}
        {!isGuest && (
          <button onClick={run(onLeave)} className="tap" style={{ ...ROW, color: "var(--accent-red)", borderTop: !isAdmin ? "0.5px solid var(--line-2)" : 0 }}>
            <I.UserMinus size={24} /><span style={{ flex: 1 }}>Выйти из группы</span>
          </button>
        )}
        {isAdmin && (
          <button onClick={run(onDelete)} className="tap" style={{ ...ROW, color: "var(--accent-red)", borderTop: "0.5px solid var(--line-2)" }}>
            <I.Trash size={24} strokeWidth={1.7} /><span style={{ flex: 1 }}>Удалить группу</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* «О группе» — отдельная шторка из макета: описание, место и состав. Показываем только то,
   что у группы правда заполнено. */
function CircleAboutSheetLive({ team, membersN, ageDays, isDark }) {
  const rows = [];
  if (team.desc) rows.push(["Описание", team.desc]);
  if (team.city) rows.push(["Место", team.city]);
  rows.push(["Вид", team.vis === "public" ? "Публичная группа" : "Частная группа"]);
  if (membersN) rows.push(["Участников", String(membersN)]);
  if (ageDays) rows.push(["Вместе", ageDays + " дн."]);
  return (
    <div style={{ padding: "4px 0 8px" }}>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px", color: "var(--text)", padding: "6px 4px 14px" }}>О группе</div>
      <div style={{ background: "var(--surface-2)", borderRadius: 14, overflow: "hidden" }}>
        {rows.map(([k, v], i) => (
          <div key={k} style={{ display: "flex", gap: 14, padding: "13px 16px", borderTop: i ? "0.5px solid var(--line-2)" : 0 }}>
            <span style={{ fontSize: 17, color: "var(--text-2)", flexShrink: 0 }}>{k}</span>
            <span style={{ fontSize: 17, color: "var(--text)", flex: 1, textAlign: "right", lineHeight: 1.3 }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* НЕДЕЛЯ ОДНОЙ ПРИВЫЧКИ — нижняя половина «Group Habit Card» (361×140) из макета.
   Семь кружков календарной недели ВС..СБ; в каждом — число и дуга «сколько круга закрыло
   этот день». Цвета ровно те, что подписаны легендой в макете:
     зелёный  — выполнено (весь круг закрыл день),
     оранжевый — не до конца (закрыла часть),
     красный  — пропуск (свой день по расписанию прошёл, не закрыл никто),
     серый    — день не по расписанию либо ещё впереди.
   Сегодня — залитый серый кружок с синей дугой: день ещё идёт, счёт не окончательный.
   Данные настоящие: rangeRows = team_habit_logs за 31 день, {u, h, day}. */
function CircleHabitWeekLive({ habit, rangeRows, membersN, isDark }) {
  const mask = (typeof bosDaysMask === "function") ? bosDaysMask(habit.days) : null;
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "8px 0 4px" }}>
      {[0, 1, 2, 3, 4, 5, 6].map((dow) => {
        const d = new Date(now); d.setDate(now.getDate() - now.getDay() + dow);
        const back = Math.round((now - d) / 86400000);
        const k = bosRoomDayKey(back);
        const future = back < 0;
        const today = back === 0;
        const users = {};
        (rangeRows || []).forEach((r) => { if (r.h === habit.id && r.day === k) users[r.u] = true; });
        const doneN = Object.keys(users).length;
        const frac = membersN > 0 ? Math.max(0, Math.min(1, doneN / membersN)) : 0;
        const due = !mask || mask[bosDowOfKey(k)];
        let ring = null, ink = "var(--text)";
        if (future) { ink = "var(--text-3)"; }
        else if (today) { ring = frac > 0 ? "var(--accent-blue)" : null; }
        else if (frac >= 1) { ring = "var(--accent)"; ink = "var(--accent)"; }
        else if (frac > 0) { ring = "var(--accent-orange)"; }
        else if (due) { ring = "var(--accent-red)"; ink = "var(--accent-red)"; }
        else { ink = "var(--text-3)"; }
        const R = 17, C = 2 * Math.PI * R;
        return (
          <span key={k} style={{ position: "relative", width: 38, height: 38, justifySelf: "center", display: "grid", placeItems: "center" }}>
            {ring && (
              <svg viewBox="0 0 38 38" width="38" height="38" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }} aria-hidden>
                <circle cx="19" cy="19" r={R} fill="none" stroke={ring} strokeWidth="2.5" strokeLinecap="round"
                  strokeDasharray={C.toFixed(1)} strokeDashoffset={(C * (1 - (today ? frac : Math.max(frac, 0.999)))).toFixed(1)} />
              </svg>
            )}
            {!ring && !future && (
              <span aria-hidden style={{ position: "absolute", inset: 2, borderRadius: "50%", boxShadow: "inset 0 0 0 1.5px var(--line-2)" }} />
            )}
            <span style={{ width: 34, height: 34, borderRadius: "50%", display: "grid", placeItems: "center",
              fontSize: 20, fontWeight: 400, lineHeight: "24px",
              background: today ? "var(--surface-3)" : "transparent", color: ink }}>{d.getDate()}</span>
          </span>
        );
      })}
    </div>
  );
}

/* СТРОКА СПИСКА привычек и дел — по макету Figma («Group Habit Today Row», 361×82).

   Было: значок 34, имя 13.5 полужирным, подпись 10px и стопка лиц справа. Стало по макету:
   значок 52 со скруглением 16, имя 17 обычным начертанием и ДВЕ подписи по 15 —
   «Привычка · 18:00» и «4 из 15 выполнили».

   Лица из строки УБРАНЫ намеренно: макет заменил их числом. Три кружка показывали, что
   кто-то отметился, но не сколько человек всего, — «4 из 15» отвечает на оба вопроса разом
   и не врёт при большом круге. Сами лица никуда не делись: они в аккордеоне под строкой.

   Кружок = отметить; тело строки = аккордеон статистики (onOpen). Шеврона нет намеренно
   (David: рука и так тянется тапнуть) — строка раскрывается сама. */
function CircleDayRowLive({ icon, iconColor, name, tag, time, doneN, totalN, sub, subGold, on, onToggle, onOpen, isDark, first, inert, struck, adopt, onAdopt }) {
  // Вторая подпись: сначала честный счёт по кругу, если он есть; иначе — то, что передали.
  const countLine = (totalN > 0) ? (doneN + " из " + totalN + " выполнили") : (sub || null);
  const metaLine = [tag, time].filter(Boolean).join(" \u00b7 ");
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 8, padding: "10px 0", minHeight: 82, boxSizing: "border-box" }}>
      {/* Разделитель НЕ на всю ширину: в макете он начинается под текстом, за значком
          (значок 52 + зазор 8 = 60). Линия во всю ширину резала бы строку пополам. */}
      {!first && <span aria-hidden style={{ position: "absolute", top: 0, left: 60, right: 0, height: "0.5px", background: "var(--line-2)" }} />}
      <div onClick={onOpen} style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0, cursor: onOpen ? "pointer" : "default" }}>
        <span style={{ width: 52, height: 52, borderRadius: 16, flexShrink: 0, display: "grid", placeItems: "center", fontSize: 26, overflow: "hidden",
          background: iconColor ? iconColor + "26" : (BOS_TILE_SHEEN + ", " + (isDark ? "rgba(255,255,255,0.06)" : "var(--surface-3)")),
          boxShadow: iconColor ? "none" : bosTileGlass(isDark) }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 400, lineHeight: "22px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            color: struck ? "var(--text-3)" : "var(--text)", textDecoration: struck ? "line-through" : "none" }}>{name}</div>
          {metaLine ? <div style={{ fontSize: 15, lineHeight: "20px", color: "var(--text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{metaLine}</div> : null}
          {countLine ? <div style={{ fontSize: 15, lineHeight: "20px", color: subGold ? BOS_ROOM_GOLD_INK : "var(--text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{countLine}</div> : null}
        </div>
      </div>
      {/* Гостю — «взять себе» (галочка с плюсом), как в кадре «Гость»: он не отмечает чужой
          день, он забирает привычку в свой. inert — когда действий нет вовсе (нет облака). */}
      {adopt
        ? <button onClick={onAdopt} className="tap" data-haptic="selection" aria-label={"Взять «" + name + "» себе"}
            style={{ width: 42, height: 42, margin: "-9px -9px -9px 0", borderRadius: "50%", flexShrink: 0, border: 0, background: "transparent", display: "grid", placeItems: "center", cursor: "pointer", color: "var(--text-2)", padding: 0 }}>
            <I.PlusCircle size={24} />
          </button>
        : inert
        ? <span aria-hidden style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, boxShadow: "inset 0 0 0 1.5px " + (isDark ? "rgba(255,255,255,0.18)" : "rgba(10,10,10,0.12)") }} />
        : <BosFlatCheckLive on={on} isDark={isDark} onToggle={onToggle} label={"Отметить «" + name + "»"} />}
    </div>
  );
}

/* Шторка «Уровень круга» — тап по аватарке круга в визитке (David 2026-07-16: «чтобы
   всплывала шторка, объясняющая, как это работает по-настоящему»). Только честные
   правила текущей механики — ничего из отложенного (мест/порогов тут нет). */
function CircleLevelSheetLive({ lvl, todayGain, rhythm, isDark }) {
  const { close } = useSheet();
  const rule = (icon, head, body) => (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 2px" }}>
      <span style={{ width: 30, height: 30, borderRadius: 10, flexShrink: 0, display: "grid", placeItems: "center", fontSize: 14, background: isDark ? "rgba(255,255,255,0.07)" : "var(--surface-3)" }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{head}</div>
        <div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.5, marginTop: 2 }}>{body}</div>
      </div>
    </div>
  );
  return (
    <div style={{ padding: "8px 4px 10px" }}>
      <div style={{ textAlign: "center" }}>
        <span style={{ position: "relative", width: 74, height: 74, display: "inline-block" }}>
          <svg viewBox="0 0 36 36" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
            <circle cx="18" cy="18" r="16" fill="none" stroke={isDark ? "rgba(255,255,255,0.13)" : "rgba(10,10,10,0.08)"} strokeWidth="2.8" />
            <circle cx="18" cy="18" r="16" fill="none" stroke={BOS_ROOM_GOLD} strokeWidth="2.8" strokeLinecap="round" strokeDasharray="100.5" strokeDashoffset={(100.5 * (1 - lvl.frac)).toFixed(1)} />
          </svg>
          <span style={{ position: "absolute", inset: 6, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 24, fontWeight: 800, color: "var(--text)", background: isDark ? "linear-gradient(160deg,#464c58,#30353f)" : "linear-gradient(160deg,#eef1f6,#dadfe7)" }}>{lvl.level}</span>
        </span>
        <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", marginTop: 10, letterSpacing: "-0.3px" }}>{"Уровень круга — " + lvl.level}</div>
        <div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 3 }}>{lvl.xp + " XP · до " + (lvl.level + 1) + "-го — " + lvl.toNext}</div>
        <div style={{ height: 7, borderRadius: 999, background: isDark ? "rgba(255,255,255,0.08)" : "rgba(10,10,10,0.07)", overflow: "hidden", margin: "10px 2px 0" }}>
          <div style={{ height: "100%", width: (lvl.frac * 100).toFixed(1) + "%", borderRadius: 999, background: "linear-gradient(90deg,#FEDE34,#EF9F14)" }} />
        </div>
        {todayGain > 0 && (
          <div style={{ fontSize: 11.5, fontWeight: 700, color: BOS_ROOM_GOLD_INK, marginTop: 8 }}>
            {"Сегодня +" + todayGain + " XP"}{rhythm ? " · круг в ритме, всё ×2" : ""}
          </div>
        )}
      </div>
      <div style={{ background: "var(--card)", borderRadius: 18, boxShadow: "var(--card-shadow)", padding: "4px 12px", marginTop: 14 }}>
        {rule("✓", "День человека = +10 XP кругу", "Отметил хотя бы одну привычку круга за день — положил свои +10 в общий опыт. Больше людей в деле — быстрее рост.")}
        <div style={{ height: 1, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(10,10,10,0.05)" }} />
        {rule("🔥", "День в ритме — всё ×2", "Когда отметились все (в большом круге — 80% состава), каждый день этого дня считается вдвое. Маленький живой круг растёт быстрее большой тишины.")}
        <div style={{ height: 1, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(10,10,10,0.05)" }} />
        {rule("🎁", "Круг вырос — подарок каждому", "Новый уровень приносит конфетти и XP каждому, кто был в деле на этой неделе: уровень × 10.")}
        <div style={{ height: 1, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(10,10,10,0.05)" }} />
        {rule("⛰", "Чем выше — тем дороже шаг", "Пороги растут: 2-й уровень — 150 XP, 5-й — 1 500, 10-й — 6 750. Круг качать сложнее, чем себя, — это общее дело.")}
        <div style={{ height: 1, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(10,10,10,0.05)" }} />
        {rule("👋", "Три пропуска подряд — выход", "Пропустил три своих дня подряд без единой отметки — круг отпускает тебя автоматически. Привычки и статистика остаются с тобой, одна отметка обнуляет счёт, вернуться можно всегда.")}
      </div>
      <button onClick={close} className="tap" style={{ width: "100%", border: 0, borderRadius: 999, padding: "13px 0", fontSize: 14, fontWeight: 800, cursor: "pointer", background: isDark ? "#fff" : "#0a0a0a", color: isDark ? "#0a0a0a" : "#fff", marginTop: 12 }}>Понятно</button>
    </div>
  );
}

/* Шторка «Круг вырос» — праздник апа уровня (Э1): кольцо, уровень, подарок каждому. */
function CircleLevelUpSheetLive({ level, gift, isDark }) {
  const { close } = useSheet();
  return (
    <div style={{ padding: "10px 6px 12px", textAlign: "center" }}>
      <span style={{ position: "relative", width: 72, height: 72, display: "inline-block" }}>
        <svg viewBox="0 0 36 36" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
          <circle cx="18" cy="18" r="16" fill="none" stroke={isDark ? "rgba(255,255,255,0.13)" : "rgba(10,10,10,0.08)"} strokeWidth="2.8" />
          <circle cx="18" cy="18" r="16" fill="none" stroke={BOS_ROOM_GOLD} strokeWidth="2.8" strokeLinecap="round" strokeDasharray="100.5" strokeDashoffset="94" />
        </svg>
        <span style={{ position: "absolute", inset: 6, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 23, fontWeight: 800, color: "var(--text)", background: isDark ? "linear-gradient(160deg,#464c58,#30353f)" : "linear-gradient(160deg,#eef1f6,#dadfe7)" }}>{level}</span>
      </span>
      <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginTop: 12, letterSpacing: "-0.3px" }}>{"Круг вырос — " + level + " уровень"}</div>
      <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 6, lineHeight: 1.5 }}>
        {gift > 0 ? <React.Fragment>{"Ты был(а) в деле на этой неделе — тебе "}<b style={{ color: BOS_ROOM_GOLD_INK }}>{"+" + gift + " XP"}</b></React.Fragment> : "Уровень копят закрытые дни каждого"}
      </div>
      <button onClick={close} className="tap" style={{ width: "100%", border: 0, borderRadius: 999, padding: "13px 0", fontSize: 14, fontWeight: 800, cursor: "pointer", background: isDark ? "#fff" : "#0a0a0a", color: isDark ? "#0a0a0a" : "#fff", marginTop: 16 }}>{"Дальше — к " + (level + 1) + "-му"}</button>
    </div>
  );
}

/* Меню «⋯» шапки комнаты — ЦЕЛЬНЫЙ блок-меню (David 2026-07-17: «не раздельные пилюльки,
   а цельные»): один скруглённый лист из-под кнопки, строки с тонкими разделителями. */
function CircleRoomMenuLive({ open, onClose, anchorRef, items, isDark }) {
  const [pos, setPos] = React.useState(null);
  React.useEffect(() => {
    if (open && anchorRef && anchorRef.current) {
      const r = anchorRef.current.getBoundingClientRect();
      setPos({ right: Math.round(window.innerWidth - r.right), top: Math.round(r.bottom + 10) });
    }
  }, [open]);
  if (!open || !pos) return null;
  return ReactDOM.createPortal(
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 8000, background: "rgba(18,22,38,0.16)", animation: "dimIn 0.18s ease both" }}>
      <div onClick={(e) => e.stopPropagation()} role="menu" style={{ position: "fixed", right: pos.right, top: pos.top, width: 232, borderRadius: 16, overflow: "hidden",
        background: isDark ? "rgba(28,29,34,0.97)" : "rgba(255,255,255,0.97)",
        WebkitBackdropFilter: "blur(22px) saturate(150%)", backdropFilter: "blur(22px) saturate(150%)",
        border: "0.5px solid " + (isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.06)"),
        boxShadow: "0 12px 32px rgba(0,0,0," + (isDark ? "0.5" : "0.16") + ")",
        transformOrigin: "top right", animation: "bosMenuPop 0.32s cubic-bezier(0.34,1.5,0.4,1) both" }}>
        {items.map((it, i) => (
          <React.Fragment key={i}>
            {i > 0 && <div aria-hidden style={{ height: 0.5, background: isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.07)" }} />}
            <button role="menuitem" data-haptic="selection" onClick={() => { onClose(); it.go(); }} className="tap" style={{
              display: "flex", width: "100%", alignItems: "center", gap: 12, whiteSpace: "nowrap",
              padding: "12px 15px", border: 0, background: "transparent", cursor: "pointer", textAlign: "left",
              fontSize: 15, fontWeight: 600, color: isDark ? "#f2f2f5" : "#0a0a0a", fontFamily: "inherit" }}>
              <span aria-hidden style={{ width: 22, display: "grid", placeItems: "center", flexShrink: 0, color: "inherit" }}>{it.icon}</span>
              {it.label}
            </button>
          </React.Fragment>
        ))}
      </div>
    </div>,
    document.body
  );
}

/* Золотая строка-веха в пульсе. */
function CircleMileLine({ children }) {
  return <div style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: BOS_ROOM_GOLD_INK, background: "rgba(240,195,10,0.12)", borderRadius: 999, padding: "6px 12px", margin: "2px 0 10px" }}>{children}</div>;
}

/* Выбор владельца: что добавить в «Мой день» — общую привычку или разовое дело. */
function CircleAddSheetLive({ onHabit, onTask, isDark }) {
  const { close } = useSheet();
  const row = (label, sub, icon, fn) => (
    <button onClick={() => { close(); setTimeout(fn, 220); }} className="tap" style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", border: 0, textAlign: "left", cursor: "pointer", background: "var(--card)", borderRadius: 18, padding: "14px 14px", boxShadow: "var(--card-shadow)", marginBottom: 9 }}>
      <span style={{ width: 38, height: 38, borderRadius: 12, display: "grid", placeItems: "center", background: BOS_TILE_SHEEN + ", " + (isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)"), boxShadow: bosTileGlass(isDark), color: "var(--text)" }}>{icon}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{label}</span>
        <span style={{ display: "block", fontSize: 12, color: "var(--text-4)", marginTop: 1 }}>{sub}</span>
      </span>
      <I.ChevronRight size={15} color="var(--text-4)" />
    </button>
  );
  return (
    <div style={{ padding: "4px 2px 8px" }}>
      <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", padding: "0 4px 12px" }}>Добавить в круг</div>
      {row("Общая привычка", "каждый день, у каждого своя отметка", <I.Refresh size={18} strokeWidth={2.2} />, onHabit)}
      {row("Разовое дело", "задание на сегодня-завтра, с меткой «дело»", <I.Flag size={18} strokeWidth={2.2} />, onTask)}
    </div>
  );
}

/* Мини-композер разового дела. */
function CircleTaskComposeSheetLive({ onAdd, isDark }) {
  const { close } = useSheet();
  const [v, setV] = React.useState("");
  return (
    <div style={{ padding: "4px 2px 8px" }}>
      <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", padding: "0 4px 12px" }}>Разовое дело</div>
      <input value={v} autoFocus onChange={(e) => setV(e.target.value)} placeholder="Например: фото завтрака в чат"
        style={{ width: "100%", boxSizing: "border-box", border: 0, outline: 0, background: isDark ? "rgba(255,255,255,0.07)" : "var(--surface-3)", borderRadius: 14, padding: "12px 15px", fontSize: 15.5, color: "var(--text)" }} />
      <button onClick={() => { const tx = v.trim(); if (!tx) return; onAdd(tx); close(); }} className="tap"
        style={{ marginTop: 12, width: "100%", border: 0, borderRadius: 999, padding: "13px 0", fontSize: 14.5, fontWeight: 700, cursor: "pointer", background: v.trim() ? (isDark ? "#fff" : "#0a0a0a") : "var(--surface-3)", color: v.trim() ? (isDark ? "#0a0a0a" : "#fff") : "var(--text-4)" }}>
        Дать кругу
      </button>
    </div>
  );
}

/* «Кто подбодрил» — лица за золотой строкой пульса. */
function CircleWhoSheetLive({ people, title }) {
  return (
    <div style={{ padding: "4px 2px 8px" }}>
      <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", padding: "0 4px 12px" }}>{title || "Тебя подбодрили"}</div>
      {(people || []).map((p, i) => (
        <div key={p.id || i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 4px" }}>
          <BuddyFaceLive avatar={p.avatar} name={p.name} size={30} />
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{p.name}</span>
          <I.Flame size={14} color={BOS_ROOM_GOLD} filled strokeWidth={1.6} style={{ marginLeft: "auto" }} />
        </div>
      ))}
    </div>
  );
}

/* ══════════════════ ЭКРАН КРУГА (макет И) ══════════════════ */
function TeamDetailLive() {
  const { navigate, params } = useNav();
  const app = useApp();
  const { open: openSheet } = useSheet();
  const passed = params?.team || { _id: "seed-1", name: "Круг", emblem: "✨", members: [] };
  const from = params?.from || "community";
  const t = (app?.teams || []).find((x) => x._id === passed._id) || passed;
  const isDark = app?.themeOverride === "dark";
  const _inTG = (typeof window !== "undefined" && window.__TG);

  /* ── подводка данных (перенесена из вкладочной версии, сама механика не менялась) ── */
  const _live = !!(window.bosCloud && window.bosCloud.enabled() && t.cloudId);
  const [meId, setMeId] = React.useState(null);
  const [cloudRoster, setCloudRoster] = React.useState(() => _bosTeamGet("roster:" + t.cloudId));
  const [rosterTick, setRosterTick] = React.useState(0);
  React.useEffect(() => {
    if (!_live) { setMeId(null); return; }
    let on = true;
    window.bosCloud.uid().then((id) => { if (on) setMeId(id || null); }).catch(() => {});
    return () => { on = false; };
  }, [_live, t.cloudId]);
  React.useEffect(() => {
    if (!_live) return;
    let on = true;
    window.bosCloud.teamMembers(t.cloudId).then((mem) => {
      if (!on || !Array.isArray(mem)) return;
      var sorted = mem.slice().sort((a, b) => (a.role === "owner" ? -1 : b.role === "owner" ? 1 : 0));
      setCloudRoster(_bosTeamPut("roster:" + t.cloudId, sorted.map((m, i) => ({ id: m.id, name: m.name || "Участник", avatar: m.avatar, role: m.role, joinedAt: m.joinedAt || null }))));
    }).catch(() => {});
    return () => { on = false; };
  }, [_live, t.cloudId, rosterTick]);
  const members = _live ? (cloudRoster || []) : (t.members?.length ? t.members : []);
  const membersN = members.length;
  const rosterById = {}; members.forEach((m) => { rosterById[m.id] = m; });
  const _meMember = (meId && Array.isArray(cloudRoster)) ? cloudRoster.find((m) => m.id === meId) : null;
  const _isOwner = _meMember ? (_meMember.role === "owner") : !t.joined;
  // ТРИ РОЛИ ИЗ МАКЕТА: «Админ» (владелец), «Участник» (в составе), «Гость» (ещё не вступил).
  // Раньше экран знал только _isOwner, и гость видел ровно то же, что участник, — включая
  // кружки отметки, которых у него быть не может. Гостем считаем ТОЛЬКО в живом режиме:
  // без облака состава нет, и локальный круг всегда «мой».
  const _amMember = !!_meMember || t.joined === true;
  const _role = _isOwner ? "admin" : (_amMember || !_live ? "member" : "guest");
  const _isGuest = _role === "guest";

  // Заявки — владелец принимает прямо здесь (не терять людей у двери).
  const [pending, setPending] = React.useState([]);
  React.useEffect(() => {
    if (!(_live && _isOwner) || !window.bosCloud.pendingRequests) return;
    let on = true;
    window.bosCloud.pendingRequests(t.cloudId).then((p) => { if (on) setPending(Array.isArray(p) ? p : []); }).catch(() => {});
    return () => { on = false; };
  }, [_live, _isOwner, t.cloudId, rosterTick]);
  const approveReq = (uid) => { window.bosCloud.approveMember(t.cloudId, uid).then((ok) => { if (ok) { setPending((p) => p.filter((x) => x.id !== uid)); setRosterTick((n) => n + 1); } }); };
  const rejectReq = (uid) => { window.bosCloud.rejectMember(t.cloudId, uid).then((ok) => { if (ok) setPending((p) => p.filter((x) => x.id !== uid)); }); };

  // Привычки круга + отметка (оптимистично, с откатом по отказу сервера — грабли RLS).
  const [liveTeamHabits, setLiveTeamHabits] = React.useState(() => _bosTeamGet("habits:" + t.cloudId));
  const [habitsTick, setHabitsTick] = React.useState(0);
  React.useEffect(() => {
    if (!_live || !window.bosCloud.teamHabitsFull) return;
    let on = true;
    window.bosCloud.teamHabitsFull(t.cloudId).then((hs) => { if (on) setLiveTeamHabits(_bosTeamPut("habits:" + t.cloudId, Array.isArray(hs) ? hs : [])); }).catch(() => {});
    return () => { on = false; };
  }, [_live, t.cloudId, habitsTick]);
  const teamHabits = _live ? (liveTeamHabits || []) : (Array.isArray(t.habits) ? t.habits : []);
  const habitById = {}; teamHabits.forEach((h) => { habitById[h.id] = h; });
  const toggleMyTeamHabit = (h) => {
    if (!h || !h.id) return;
    setLiveTeamHabits((list) => (list || []).map((x) => {
      if (x.id !== h.id) return x;
      const next = !x.doneByMe;
      const cap = Number.isFinite(x.total) ? x.total : (x.doneToday + 1);
      return { ...x, doneByMe: next, doneToday: Math.max(0, Math.min(cap, x.doneToday + (next ? 1 : -1))) };
    }));
    if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} }
    const _wantOn = !h.doneByMe;
    window.bosCloud.toggleTeamHabitToday(h.id, _wantOn).then((ok) => {
      if (ok === false) {
        setLiveTeamHabits((list) => (list || []).map((x) => {
          if (x.id !== h.id) return x;
          const cap = Number.isFinite(x.total) ? x.total : (x.doneToday + 1);
          return { ...x, doneByMe: !_wantOn, doneToday: Math.max(0, Math.min(cap, x.doneToday + (_wantOn ? -1 : 1))) };
        }));
        if (window.tgHaptic) { try { window.tgHaptic("error"); } catch (e) {} }
      }
      setHabitsTick((n) => n + 1);
      try { window.dispatchEvent(new Event("bos:teamxp")); } catch (e) {}
    });
  };
  // «Прижитая» копия (вести у себя — UI убран, но связки людей живы): отметка идёт через личную.
  const myHabits = app?.habits || [];
  const _todayK = (typeof bosTodayKey === "function") ? bosTodayKey() : new Date().toISOString().slice(0, 10);
  const adoptedFor = (h) => (h && h.id != null) ? myHabits.find((x) => x.teamHabitId === h.id) : null;
  const markAdopted = (h) => { const a = adoptedFor(h); if (!a) return; app?.toggleHabit(a.id); if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} } setHabitsTick((n) => n + 1); };
  const myDone = (h) => { const a = adoptedFor(h); return a ? !!(a.log && a.log[_todayK]) : !!(h && h.doneByMe); };
  const _iDidCircle = teamHabits.some((h) => myDone(h));

  // Правка/создание общей привычки — та же полная форма (без изменений).
  const saveTeamHabit = (data, editId) => {
    if (editId != null) {
      setLiveTeamHabits((list) => (list || []).map((x) => x.id === editId ? Object.assign({}, x, { name: data.name, emoji: data.emoji, color: data.color, goalPerDay: data.goalPerDay, isMain: data.isMain }) : x));
      if (_live && window.bosCloud.updateTeamHabit) {
        window.bosCloud.updateTeamHabit(editId, data).then((ok) => {
          setHabitsTick((n) => n + 1);
          if (!ok && typeof InfoSheet === "function") openSheet(<InfoSheet title="Правка не сохранилась" dark={isDark} cta="Понятно" body="База не приняла изменение общей привычки, поэтому она осталась прежней. Обычно это нехватка прав на правку в круге — сообщи, и мы поправим." />);
        });
      }
      return;
    }
    if (_live) { var first = !(teamHabits && teamHabits.length); window.bosCloud.addTeamHabit(t.cloudId, { ...data, isMain: (data && data.isMain) || first }).then(() => setHabitsTick((n) => n + 1)); }
    else app?.addTeamHabit(t._id, data);
  };
  const removeTeamHabitH = (id) => {
    setLiveTeamHabits((list) => (list || []).filter((x) => x.id !== id));
    if (_live && window.bosCloud.removeTeamHabit) window.bosCloud.removeTeamHabit(id).then(() => setHabitsTick((n) => n + 1));
  };
  const openAddHabit = () => openSheet(<HabitFormSheetLive mode="create" navigate={navigate} teamFor={{ team: t, suggestMain: !(teamHabits && teamHabits.length), onSave: saveTeamHabit, onDelete: removeTeamHabitH }} />);
  const openEditTeamHabit = (h) => openSheet(<HabitFormSheetLive mode="edit" navigate={navigate} habit={{ id: h.id, name: h.name, emoji: h.emoji, color: h.color || null, goalPerDay: h.goalPerDay || 1, duration: 0, isMain: !!h.isMain }} teamFor={{ team: t, onSave: saveTeamHabit, onDelete: removeTeamHabitH }} />);

  // СВАЙП ВЛЕВО по строке круга (David 2026-07-22: «лонгтап-шторка не прикольно — свайп влево
  // на любой привычке/деле, там кнопки редактировать и удалить»). Владельцу — тот же SwipeRow,
  // что на доске главной; удаление прямое (свайп + тап по красной = осознанный жест).
  const _habitSwipe = (h) => [
    { key: "edit", label: "Изменить", icon: I.Pencil, tone: "share", onAction: () => openEditTeamHabit(h) },
    { key: "del", label: "Удалить", icon: I.Trash, tone: "delete", onAction: () => removeTeamHabitH(h.id) },
  ];
  const _taskSwipe = (tk) => [
    { key: "del", label: "Удалить", icon: I.Trash, tone: "delete", onAction: () => removeTeamTaskCloud(tk) },
  ];

  // Дела круга (разовые, kind='task') — строки «Моего дня» с меткой. Просьбы Э3 — в архиве.
  const [teamTaskData, setTeamTaskData] = React.useState(() => _bosTeamGet("tasks:" + t.cloudId));
  const [tasksTick, setTasksTick] = React.useState(0);
  React.useEffect(() => {
    if (!_live || !window.bosCloud.teamTasks) return;
    let on = true;
    window.bosCloud.teamTasks(t.cloudId).then((d) => { if (on && d) setTeamTaskData(_bosTeamPut("tasks:" + t.cloudId, d)); }).catch(() => {});
    return () => { on = false; };
  }, [_live, t.cloudId, tasksTick]);
  const _teamTasks = ((teamTaskData && Array.isArray(teamTaskData.tasks)) ? teamTaskData.tasks : []).filter((x) => (x.kind || "task") !== "request");
  const toggleMyTeamTask = (tk) => {
    if (!tk || !tk.id) return;
    const next = !tk.doneByMe;
    setTeamTaskData((d) => (d ? { ...d, tasks: (d.tasks || []).map((x) => (x.id === tk.id ? { ...x, doneByMe: next, doneCount: Math.max(0, (x.doneCount || 0) + (next ? 1 : -1)) } : x)) } : d));
    if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} }
    window.bosCloud.toggleTeamTaskMine(tk.id, next).then((ok) => {
      if (ok === false) { setTeamTaskData((d) => (d ? { ...d, tasks: (d.tasks || []).map((x) => (x.id === tk.id ? { ...x, doneByMe: !next, doneCount: Math.max(0, (x.doneCount || 0) + (next ? -1 : 1)) } : x)) } : d)); if (window.tgHaptic) { try { window.tgHaptic("error"); } catch (e) {} } }
      setTasksTick((n) => n + 1);
    });
  };
  const addTeamTaskCloud = (tx) => { if (!tx || !window.bosCloud.addTeamTask) return; window.bosCloud.addTeamTask(t.cloudId, tx).then(() => setTasksTick((n) => n + 1)); if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} } };
  // Удаление дела: оптимистично убираем строку сразу, облако вдогонку; ошибка — перечитка вернёт.
  const removeTeamTaskCloud = (tk) => {
    if (!tk || !tk.id || !window.bosCloud.removeTeamTask) return;
    setTeamTaskData((d) => (d ? { ...d, tasks: (d.tasks || []).filter((x) => x.id !== tk.id) } : d));
    window.bosCloud.removeTeamTask(tk.id).then(() => setTasksTick((n) => n + 1)).catch(() => setTasksTick((n) => n + 1));
  };

  // Прогресс цели (банк, режимы) — ТОНКО (решение David): строка в шапке + веха в пульсе.
  const [goalProg, setGoalProg] = React.useState(() => _bosTeamGet("goal:" + t.cloudId));
  const [settlements, setSettlements] = React.useState(null);
  const settledRef = React.useRef(false);
  React.useEffect(() => {
    let on = true;
    if (!_live || !t.cloudId || !window.bosCloud.teamGoalProgress) { setGoalProg(null); return; }
    const load = () => window.bosCloud.teamGoalProgress(t.cloudId).then((d) => { if (on && d) setGoalProg(_bosTeamPut("goal:" + t.cloudId, d)); }).catch(() => {});
    load(); const iv = setInterval(load, 25000);
    return () => { on = false; clearInterval(iv); };
  }, [_live, t.cloudId, habitsTick]);
  React.useEffect(() => {
    if (!_live || !t.cloudId || !window.bosCloud.settleTeamGoal) return;
    if (!goalProg || !goalProg.done || !(goalProg.stake > 0)) return;
    let on = true;
    const loadSettle = () => window.bosCloud.teamSettlements(t.cloudId).then((s) => { if (on) setSettlements(s || {}); }).catch(() => {});
    if (settledRef.current) { loadSettle(); }
    else {
      settledRef.current = true;
      window.bosCloud.settleTeamGoal(t.cloudId).then((res) => { if (!on) return; loadSettle(); if (res && res.settled && app && app.refreshTeamGoalXP) app.refreshTeamGoalXP(); }).catch(loadSettle);
    }
    return () => { on = false; };
  }, [_live, t.cloudId, goalProg]);
  const gUnit = (goalProg && goalProg.unit) || t.unit || "";
  const gTgt = (goalProg && goalProg.target) || t.target || 0;
  const gCur = goalProg ? goalProg.current : (t.current != null ? t.current : 0);
  const gDone = gTgt > 0 && gCur >= gTgt;
  const stake = (goalProg && goalProg.stake) || t.stake || 0;
  const bank = (goalProg && goalProg.bank) || (stake * Math.max(1, membersN));

  // Сегодняшние отметки со временем — пульс, нить, «ты в 06:58», пачки.
  const [dayFeedS, setDayFeedS] = React.useState(() => _bosTeamGet("dayfeed:" + t.cloudId));
  React.useEffect(() => {
    let on = true;
    if (!_live || !window.bosCloud.teamDayFeed) { setDayFeedS(null); return; }
    const load = () => window.bosCloud.teamDayFeed(t.cloudId).then((d) => { if (on && d) setDayFeedS(_bosTeamPut("dayfeed:" + t.cloudId, d)); }).catch(() => {});
    load(); const iv = setInterval(load, 25000);
    return () => { on = false; clearInterval(iv); };
  }, [_live, t.cloudId, habitsTick]);
  const dayRows = (dayFeedS && dayFeedS.rows) || [];

  // Логи за месяц — серия круга (и «верхняя треть»).
  const [rangeS, setRangeS] = React.useState(() => _bosTeamGet("range31:" + t.cloudId));
  React.useEffect(() => {
    let on = true;
    if (!_live || !window.bosCloud.teamLogsRange) { setRangeS(null); return; }
    const load = () => window.bosCloud.teamLogsRange(t.cloudId, 31).then((d) => { if (on && d) setRangeS(_bosTeamPut("range31:" + t.cloudId, d)); }).catch(() => {});
    load(); const iv = setInterval(load, 60000);
    return () => { on = false; clearInterval(iv); };
  }, [_live, t.cloudId, habitsTick]);
  const rangeRows = (rangeS && rangeS.rows) || [];

  // ГОД КРУГА — только для календаря на «Пути» (v5: «прошлые месяцы листаются, история круга не
  // обрывается»). Тянем ЛЕНИВО, когда вкладку открыли: на «Дне» этот запрос никому не нужен.
  const [yearS, setYearS] = React.useState(() => _bosTeamGet("year:" + t.cloudId));
  const [pathSeen, setPathSeen] = React.useState(false);
  React.useEffect(() => {
    if (!pathSeen || !_live || !window.bosCloud.teamLogsRange) return;
    let on = true;
    window.bosCloud.teamLogsRange(t.cloudId, 366).then((d) => { if (on && d) setYearS(_bosTeamPut("year:" + t.cloudId, d)); }).catch(() => {});
    return () => { on = false; };
  }, [pathSeen, _live, t.cloudId, habitsTick]);
  const yearRows = (yearS && yearS.rows && yearS.rows.length) ? yearS.rows : rangeRows;

  // Огоньки «подбодрить» — до SQL-патча честно спят (cheers === null → UI скрыт).
  const [cheers, setCheers] = React.useState(() => _bosTeamGet("cheers:" + t.cloudId));
  React.useEffect(() => {
    let on = true;
    if (!_live || !window.bosCloud.teamCheersToday) { setCheers(null); return; }
    const load = () => window.bosCloud.teamCheersToday(t.cloudId).then((d) => { if (on && d) setCheers(_bosTeamPut("cheers:" + t.cloudId, d)); }).catch(() => {});
    load(); const iv = setInterval(load, 30000);
    return () => { on = false; clearInterval(iv); };
  }, [_live, t.cloudId]);
  const cheersOn = !!(cheers && Array.isArray(cheers.rows));
  const myCheered = {}; if (cheersOn) cheers.rows.forEach((r) => { if (r.from === meId) myCheered[r.to] = true; });
  const cheeredMe = cheersOn ? cheers.rows.filter((r) => r.to === meId).map((r) => r.from) : [];
  const sendCheer = (toId) => {
    if (!cheersOn || !toId || toId === meId || myCheered[toId]) return;
    setCheers((c) => c ? { ...c, rows: c.rows.concat([{ from: meId, to: toId, at: new Date().toISOString() }]) } : c);
    if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} }
    window.bosCloud.sendTeamCheer(t.cloudId, toId);
  };

  /* ── ЧАТ, влитый в пульс (реальные сообщения + realtime + фото) ── */
  const memberMapRef = React.useRef({});
  React.useEffect(() => { const map = {}; members.forEach((m) => { map[m.id] = m; }); memberMapRef.current = map; }, [members]);
  const meRef = React.useRef(null);
  React.useEffect(() => { meRef.current = meId; }, [meId]);
  const myName = app?.userName || "Ты";
  const chatKey = "bos:chat:" + (app?.persistId || "live:local") + ":" + (t._id || t.name || "team");
  const [msgs, setMsgs] = React.useState(() => {
    if (_live) { var cc = _bosChatMsgCache[t.cloudId]; return (Array.isArray(cc) && cc.length) ? cc : []; }
    try { var raw = localStorage.getItem(chatKey); if (raw) return JSON.parse(raw); } catch (e) {}
    return [];
  });
  // ВКЛАДКИ КОМНАТЫ (макет А, выбор David 2026-07-16): «День круга» и «Чат» — сегменты-
  // иконки под шапкой (точка-в-кольце = круг, пузырь = чат; линейные SVG). Чат больше
  // не в «подвале»: «Написать» из кабинета/карточки человека открывает сразу чат.
  // tab:"chat" — вход сразу на вкладку чата (тап по значку чата на внешней карточке / из
  // уведомления); prefill («Написать @Имя») тоже ведёт в чат.
  // v5: вкладок четыре — День · Разговор · Путь · Люди. «chat» — историческое имя сегмента
  // «Разговор» (по нему приходят внешние ссылки: значок чата на карточке, уведомление, prefill).
  const [roomTab, setRoomTab] = React.useState(() => {
    if (params && params.prefill) return "chat";
    var p = params && params.tab;
    return (p === "chat" || p === "path" || p === "people") ? p : "day";
  });
  // Фото из чата НА ВЕСЬ ЭКРАН (David 2026-07-16: «нажимаю на фотку — не открывается,
  // в уменьшенном виде что толку»): тап по снимку → тёмный просмотр, тап — закрыть.
  const [photoView, setPhotoView] = React.useState(null);
  // Меню «⋯» пилюли шапки (David 2026-07-16: «объединить в одну стеклянную пилюлю»).
  const [menuOpen, setMenuOpen] = React.useState(false);
  const moreRef = React.useRef(null);
  const mapRow = React.useCallback((r) => {
    const mine = r.user_id === meRef.current;
    const prof = memberMapRef.current[r.user_id];
    return { id: r.id, _uid: r.user_id, me: mine, who: mine ? myName : (prof ? prof.name : "Участник"), avatar: prof ? prof.avatar : null,
      t: r.text || undefined, img: r.image_url || undefined, time: bosMsgTime(r.created_at), ts: r.created_at ? new Date(r.created_at).getTime() : Date.now() };
  }, [myName]);
  React.useEffect(() => {
    if (!_live) return;
    let on = true, unsub = function () {};
    window.bosCloud.loadMessages(t.cloudId).then((rows) => { if (on && Array.isArray(rows)) { const mapped = rows.map(mapRow); _bosChatMsgCache[t.cloudId] = mapped; setMsgs(mapped); } });
    unsub = window.bosCloud.subscribeMessages(t.cloudId, (row) => {
      setMsgs((prev) => { const next = prev.some((m) => m.id === row.id) ? prev : prev.concat([mapRow(row)]); _bosChatMsgCache[t.cloudId] = next; return next; });
    });
    return () => { on = false; try { unsub(); } catch (e) {} };
  }, [_live, t.cloudId, mapRow]);
  React.useEffect(() => {
    if (_live) return;
    try { localStorage.setItem(chatKey, JSON.stringify(msgs)); } catch (e) { try { localStorage.setItem(chatKey, JSON.stringify(msgs.filter((m) => !m.img))); } catch (e2) {} }
  }, [msgs, chatKey, _live]);
  // Чат прочитан, только когда ОТКРЫТА вкладка «Чат» (с v774 он за сегментом): гасим
  // маркер и значок на внешней карточке. Просто зайти в комнату — непрочитанное живо.
  React.useEffect(() => {
    if (!_live || roomTab !== "chat") return;
    try {
      const last = msgs.length ? msgs[msgs.length - 1] : null;
      // +1 мс: created_at в базе хранит МИКРОсекунды, JS усекает до мс. Метка «ровно в мс
      // последнего сообщения» на сервере строго МЕНЬШЕ его created_at (…123 < …123456) —
      // и peek вечно возвращал «1 непрочитанное» (фантом на внешней карточке, David 2026-07-16).
      // Округляем вверх — последнее прочитанное больше никогда не считается новым.
      const iso = last && last.ts ? new Date(last.ts + 1).toISOString() : "";
      localStorage.setItem("bos:chatread:" + t.cloudId, iso);
      if (typeof bosTeamUnreadClear === "function") bosTeamUnreadClear(t.cloudId);
    } catch (e) {}
  }, [_live, t.cloudId, msgs.length, roomTab]);
  // prefill — «Написать» из кабинета/карточки человека приводит сюда с готовым «@Имя ».
  const [text, setText] = React.useState(() => (params && params.prefill) || "");
  const fileRef = React.useRef(null);
  const composerRef = React.useRef(null);
  const feedBoxRef = React.useRef(null);
  React.useEffect(() => {
    if (params && params.prefill) setTimeout(() => { try { composerRef.current && composerRef.current.focus(); composerRef.current.scrollIntoView({ block: "center" }); } catch (e) {} }, 450);
  }, []);
  // КЛАВИАТУРА: Telegram/iOS ресайзят вьюпорт — при фокусе держим композер видимым
  // (David: «клавиатура не подстраивается — не вижу, что пишу»).
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;
    const vv = window.visualViewport;
    const onVV = () => {
      if (document.activeElement !== composerRef.current) return;
      requestAnimationFrame(() => {
        try { composerRef.current.scrollIntoView({ block: "center" }); } catch (e) {}
        const el = feedBoxRef.current; if (el) el.scrollTop = el.scrollHeight;
      });
    };
    vv.addEventListener("resize", onVV);
    return () => vv.removeEventListener("resize", onVV);
  }, []);
  const absorb = (row) => { if (row) setMsgs((prev) => prev.some((m) => m.id === row.id) ? prev : prev.concat([mapRow(row)])); };
  const send = () => {
    const v = text.trim(); if (!v) return;
    setText("");
    setTimeout(() => { try { composerRef.current && composerRef.current.scrollIntoView({ block: "nearest" }); } catch (e) {} }, 120);
    if (_live) {
      window.bosCloud.sendMessage(t.cloudId, { text: v }).then((row) => {
        if (row) { absorb(row); return; }
        setText((cur) => cur ? cur : v);
        if (window.tgHaptic) { try { window.tgHaptic("error"); } catch (e) {} }
      }).catch(() => { setText((cur) => cur ? cur : v); if (window.tgHaptic) { try { window.tgHaptic("error"); } catch (e) {} } });
    } else setMsgs((list) => list.concat([{ who: myName, me: true, t: v, time: bosRoomHHMM(Date.now()), ts: Date.now() }]));
  };
  const onFile = (e) => {
    const file = e.target.files && e.target.files[0];
    try { e.target.value = ""; } catch (_) {}
    if (!file) return;
    bosCompressImage(file, 1280, 0.72).then((src) => {
      if (_live) {
        fetch(src).then((r) => r.blob()).then((blob) => window.bosCloud.uploadChatPhoto(t.cloudId, blob).then((url) => {
          if (url) window.bosCloud.sendMessage(t.cloudId, { imageUrl: url }).then(absorb);
          else if (window.tgHaptic) { try { window.tgHaptic("error"); } catch (e2) {} }
        })).catch(() => { if (window.tgHaptic) { try { window.tgHaptic("error"); } catch (e2) {} } });
      } else setMsgs((list) => list.concat([{ who: myName, me: true, img: src, time: bosRoomHHMM(Date.now()), ts: Date.now() }]));
    }).catch(() => {});
  };

  /* ── производные дня ── */
  const firstByUser = {};
  dayRows.forEach((r) => { if (!firstByUser[r.u] || r.at < firstByUser[r.u]) firstByUser[r.u] = r.at; });
  const activeSet = {}; dayRows.forEach((r) => { activeSet[r.u] = true; });
  if (meId && _iDidCircle) activeSet[meId] = true;
  const todayN = Object.keys(activeSet).length;
  const _pt = (x) => (typeof bosParseTs === "function" ? bosParseTs(x) : new Date(x));
  const _hr = (x) => { const d = _pt(x); return d.getHours() + d.getMinutes() / 60; };
  // Нить дня: до 6 лиц — лица в свой час; больше — золотая волна (правило карточки круга).
  const threadFaces = members.filter((m) => firstByUser[m.id] || (m.id === meId && _iDidCircle)).map((m) => ({
    avatar: m.avatar, name: m.id === meId ? "Ты" : m.name,
    hr: firstByUser[m.id] ? _hr(firstByUser[m.id]) : (new Date().getHours() + new Date().getMinutes() / 60),
  }));
  const threadOff = t.threadOff === true || (t.goal && typeof t.goal === "object" && t.goal.threadOff === true);

  // Серия круга: день в зачёт, когда в деле все (маленький круг) / ≥80% (большой).
  // Новичка (в круге < 2 дней) в порог НЕ считаем — вступивший вчера не должен
  // обнулять серию, которую круг копил месяц.
  const byDay = {}; rangeRows.forEach((r) => { (byDay[r.day] = byDay[r.day] || {})[r.u] = true; });
  const _freshJoin = (m) => m.joinedAt && (Date.now() - new Date(m.joinedAt).getTime()) < 2 * 86400000;
  const eligibleN = members.filter((m) => !_freshJoin(m)).length;
  const need = eligibleN > 0 ? (eligibleN <= 8 ? eligibleN : Math.ceil(eligibleN * 0.8)) : (membersN || 1);
  const qual = (k) => Object.keys(byDay[k] || {}).length >= need;
  let circleStreak = 0;
  if (membersN > 0 && rangeRows.length) {
    let start = qual(bosRoomDayKey(0)) ? 0 : 1;
    for (let i = start; i < 31; i++) { if (qual(bosRoomDayKey(i))) circleStreak++; else break; }
  }
  const streakCap = circleStreak >= 31 ? "31+" : String(circleStreak);
  // «Ты в верхней трети» — только когда это правда и круг большой (позитивный факт, не рейтинг).
  let topThird = false;
  if (meId && membersN >= 10) {
    const wk = {}; for (let i = 0; i < 7; i++) { const k = bosRoomDayKey(i); Object.keys(byDay[k] || {}).forEach((u) => { wk[u] = (wk[u] || 0) + 1; }); }
    const mine = wk[meId] || 0;
    const better = members.filter((m) => (wk[m.id] || 0) > mine).length;
    topThird = mine > 0 && better <= Math.floor(membersN / 3);
  }

  // Возраст круга — из created_at (v762 несёт createdAt в каждый ряд команд).
  const ageDays = t.createdAt ? Math.max(1, Math.floor((Date.now() - new Date(t.createdAt).getTime()) / 86400000) + 1) : null;

  // ЛИДЕРБОРД-ПОРЯДОК «Людей» (David 2026-07-16: «слева активные, серые в конец, и чтобы
  // ранжировалось по активности»): сегодня отметился → раньше; внутри — по дням активности
  // за неделю; молчащие серые — в хвост. Серый, который отметился, сам всплывает влево.
  // Считаем ДНИ, а не строки: у круга с тремя привычками старый счёт давал «21 день за неделю»
  // (три отметки в день × семь) — цифра, которой не бывает. Один день человека = один балл.
  const wk7 = {};
  { const wkKeys7 = {}; for (let i = 0; i < 7; i++) wkKeys7[bosRoomDayKey(i)] = true;
    const seen7 = {};
    rangeRows.forEach((r) => {
      if (!wkKeys7[r.day]) return;
      const kk = r.u + "|" + r.day; if (seen7[kk]) return; seen7[kk] = true;
      wk7[r.u] = (wk7[r.u] || 0) + 1;
    }); }
  const membersRanked = members.slice().sort((a, b) => {
    const t0 = (activeSet[b.id] ? 1 : 0) - (activeSet[a.id] ? 1 : 0); if (t0) return t0;
    return (wk7[b.id] || 0) - (wk7[a.id] || 0);
  });

  // Красный счёт для бейджа кабинета: заявки + «теряем» (молчат 3+ дня, не новички).
  const lastByUser = {}; rangeRows.forEach((r) => { if (!lastByUser[r.u] || r.day > lastByUser[r.u]) lastByUser[r.u] = r.day; });
  const silentDays = (m) => {
    const last = lastByUser[m.id]; if (!last) return 31;
    for (let i = 0; i < 31; i++) if (bosRoomDayKey(i) === last) return i;
    return 31;
  };
  const isNewbie = (m) => m.joinedAt && (Date.now() - new Date(m.joinedAt).getTime()) < 3 * 86400000;
  const redCount = _isOwner ? members.filter((m) => m.id !== meId && !isNewbie(m) && silentDays(m) >= 3).length + pending.length : 0;

  // Мой день: отметился ли я и когда («ты в HH:MM» в строке привычки, «Ты» в ленте чата).
  const myRows = meId ? dayRows.filter((r) => r.u === meId) : [];

  /* ══ v5: ФАКТЫ ДНЯ, ПУТИ И ЛЮДЕЙ ══════════════════════════════════════════════
     Всё считается из того, что уже есть в круге: dayRows (сегодня со временем), rangeRows
     (месяц), yearRows (год, если «Путь» открывали). Ничего не выдумываем: нет данных — блока
     нет. Про «кто сейчас в приложении» у нас данных НЕТ, поэтому подпись шапки говорит о том,
     что правда известно, — кто уже в деле сегодня. */
  const _iDone = !!(meId && activeSet[meId]);
  const _waiting = members.filter((m) => !activeSet[m.id] && m.id !== meId);
  const dayTitle = todayN === 0
    ? "Сегодня круг ещё не начинал"
    : (membersN > 1 && todayN >= membersN ? "Все в деле сегодня"
      : (bosRoomCountWord(todayN).charAt(0).toUpperCase() + bosRoomCountWord(todayN).slice(1)) + " уже в деле");
  const daySub = todayN === 0
    ? "Первая отметка запускает день — её видят все"
    : (!_iDone ? "Твоей отметки ещё нет"
      : (_waiting.length === 0 ? ""
        : (_waiting.length === 1 ? "Ждём только " + (_waiting[0].name || "последнего")
          : (_waiting.length <= 3 ? "Ждём: " + _waiting.map((m) => m.name || "участника").join(", ")
            : "Ещё " + _waiting.length + " не отметились"))));

  // Сколько дней в круге тихо (никто не отмечался) и сколько тебя не было.
  let quietDays = 0;
  for (let i = 0; i < 31; i++) { if (Object.keys(byDay[bosRoomDayKey(i)] || {}).length) break; quietDays++; }
  let myGoneDays = 0;
  if (meId) { for (let i = 0; i < 31; i++) { if ((byDay[bosRoomDayKey(i)] || {})[meId]) break; myGoneDays++; } }
  if (_iDidCircle) myGoneDays = 0;

  // «Держат ритм» — доля людей, у кого за неделю 4+ дня (кроме совсем новых).
  const _rhythmPool = members.filter((m) => !_freshJoin(m));
  const keepPct = _rhythmPool.length ? Math.round(100 * _rhythmPool.filter((m) => (wk7[m.id] || 0) >= 4).length / _rhythmPool.length) : 0;

  // Неделя каждого — тот же счёт, что у «Молодцов», но списком без медалей (v5).
  const weekRows = members.map((m) => ({ m, n: wk7[m.id] || 0 })).sort((a, b) => b.n - a.n);

  // Последний ПОЛНЫЙ круг — день, когда отметились все (сегодня не в счёт, он ещё идёт).
  const yearByDay = {}; yearRows.forEach((r) => { (yearByDay[r.day] = yearByDay[r.day] || {})[r.u] = true; });
  let fullDay = null;
  if (membersN >= 2) {
    for (let i = 1; i < 366; i++) {
      const k = bosRoomDayKey(i);
      if (!yearByDay[k]) continue;
      if (Object.keys(yearByDay[k]).length >= membersN) { fullDay = k; break; }
    }
  }
  // Сколько раз круг закрывал дела вместе — за то окно, что реально загружено.
  const marksN = yearRows.length;
  const myMarksN = meId ? yearRows.filter((r) => r.u === meId).length : 0;
  // МОИ ДНИ в круге (не строки отметок): «твой вклад — 12 дней».
  const myDaysN = (function () {
    if (!meId) return 0;
    const seen = {}; let n = 0;
    yearRows.forEach((r) => { if (r.u !== meId) return; if (seen[r.day]) return; seen[r.day] = 1; n++; });
    return n;
  })();
  /* КРИВАЯ РОСТА КРУГА (макет «сообщество-v5», кадр 07 — David: «на макетах был график,
     сколько ночей вместе»). Считается из тех же отметок, что и всё остальное: по дням от
     первого дня с данными до сегодня, накопительно. Ничего не сглаживаем и не выдумываем —
     линия просто показывает, как рос общий счёт круга.
     Меньше трёх дней данных — графика нет: две точки это не история, а отрезок. */
  const pathCurve = React.useMemo(function () {
    if (!yearRows.length) return null;
    const per = {};
    yearRows.forEach(function (r) { per[r.day] = (per[r.day] | 0) + 1; });
    let first = -1;
    for (let i = 365; i >= 0; i--) { if (per[bosRoomDayKey(i)]) { first = i; break; } }
    if (first < 2) return null;
    const raw = []; let acc = 0;
    for (let i = first; i >= 0; i--) { acc += (per[bosRoomDayKey(i)] | 0); raw.push(acc); }
    if (raw.length < 3 || acc < 3) return null;
    // Длинную историю прореживаем до ~60 узлов: на 320px больше точек глазу не нужно,
    // а path из 366 пар координат раздувает разметку на каждый рендер.
    const MAX = 60;
    let pts = raw;
    if (raw.length > MAX) {
      pts = [];
      for (let k = 0; k < MAX; k++) pts.push(raw[Math.round(k * (raw.length - 1) / (MAX - 1))]);
    }
    const W = 317, H = 52, top = 6, bot = H - 5;
    const xy = pts.map(function (v, i) {
      return [+(W * i / (pts.length - 1)).toFixed(1), +(bot - (bot - top) * (v / acc)).toFixed(1)];
    });
    const d = xy.map(function (p, i) { return (i ? "L" : "M") + p[0] + " " + p[1]; }).join(" ");
    const area = d + " L" + W + " " + bot + " L0 " + bot + " Z";
    return { d: d, area: area, total: acc, days: first + 1, last: { y: top } };
  }, [yearRows]);

  // Цель круга бывает ДВУХ смыслов: «серия вместе» (держим ритм) и «общий счёт» (складываем
  // километры/страницы). Для серии цифра «0 из 14 дней» бессмысленна — круг держит ритм N дней,
  // и это и есть его главное число (David 2026-08-02).
  const goalType = (goalProg && goalProg.type) || t.type || (gTgt > 0 ? "collective" : "streak");
  const isCount = gTgt > 0 && goalType !== "streak";
  const marksSince = (yearS && yearS.rows && yearS.rows.length) ? (t.createdAt ? bosRoomDateWord(t.createdAt) : "за год") : "за месяц";

  /* ── чат: сообщения + отметки + огоньки + вехи, одна лента по времени.
     МОИ отметки — в ленте по хронологии, как у всех (David: «не надо приколачивать
     сверху и показывать на нить — человек и так заметит»). ── */
  const packMode = membersN > 8;
  const feedRows = [];
  msgs.forEach((m, i) => feedRows.push({ k: "msg", ts: m.ts || 0, key: "m" + (m.id != null ? m.id : i), m }));
  if (!packMode) {
    dayRows.forEach((r) => {
      const hb = habitById[r.h], p0 = rosterById[r.u];
      if (!hb || !p0) return;
      const p = r.u === meId ? { ...p0, name: "Ты" } : p0;
      feedRows.push({ k: "mark", ts: _pt(r.at).getTime(), key: "k" + r.u + "-" + r.h, p, hb, at: r.at });
    });
    // Тап случился только что — облачная строка ещё едет (полл): локальная правда
    // сразу даёт строку «только что», при следующем полле её заменит настоящая.
    const myCloudMarked = {}; myRows.forEach((r) => { myCloudMarked[r.h] = true; });
    if (meId && rosterById[meId]) teamHabits.forEach((h) => {
      if (myDone(h) && !myCloudMarked[h.id]) feedRows.push({ k: "mark", ts: Date.now(), key: "kme-" + h.id, p: { ...rosterById[meId], name: "Ты" }, hb: h, at: null });
    });
  } else {
    const buckets = {};
    dayRows.forEach((r) => {
      const hb = habitById[r.h]; if (!hb) return;
      const d = _pt(r.at); const hourEnd = d.getHours() + 1;
      const bk = r.h + ":" + hourEnd;
      (buckets[bk] = buckets[bk] || { hb, hourEnd, users: [], ts: 0 });
      buckets[bk].users.push(r.u); buckets[bk].ts = Math.max(buckets[bk].ts, d.getTime());
    });
    Object.keys(buckets).forEach((bk) => {
      const b = buckets[bk];
      feedRows.push({ k: "pack", ts: b.ts, key: "p" + bk, hb: b.hb, n: b.users.length, faces: b.users.slice(0, 3).map((u) => rosterById[u]).filter(Boolean), hourEnd: b.hourEnd });
    });
  }
  feedRows.sort((a, b) => (a.ts || 0) - (b.ts || 0));
  // Лента не резиновая: показываем последние 60 событий, о срезе говорим честно.
  const feedCut = feedRows.length > 60;
  const feedShown = feedCut ? feedRows.slice(-60) : feedRows;
  const MILES = [7, 14, 30, 50, 100, 200, 365, 500, 730, 1000];
  const hasMiles = (ageDays && MILES.indexOf(ageDays) >= 0) || (gTgt > 0 && gCur > 0);
  // Лента открыта на СВЕЖЕМ (низ) и докручивается сама: новое событие ИЛИ переключение
  // на вкладку «Чат» (лента монтируется заново со scrollTop 0) — как мессенджер.
  // ФОТО грузятся ПОЗЖЕ скролла и распирают ленту («чат открывается посередине», David
  // 2026-07-17) → повторные докрутки + докрутка на onLoad картинок (если мы у низа).
  const _scrollFeedBottom = React.useCallback(() => {
    const el = feedBoxRef.current; if (el) el.scrollTop = el.scrollHeight;
  }, []);
  const _feedImgLoaded = React.useCallback(() => {
    const el = feedBoxRef.current; if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 340) el.scrollTop = el.scrollHeight;
  }, []);
  React.useLayoutEffect(() => {
    _scrollFeedBottom();
    if (roomTab !== "chat") return;
    const t1 = setTimeout(_scrollFeedBottom, 260);
    const t2 = setTimeout(_scrollFeedBottom, 750);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [feedShown.length, roomTab]);

  // Человек — ОТДЕЛЬНАЯ СТРАНИЦА (David 2026-07-16: «карточку человека тоже сделай страницей»).
  const openPerson = (p) => { if (p) navigate("team-person", { team: t, person: p, from: from }); };
  // Уровни людей для грида «Люди» и аккордеона (David: «хочу видеть их уровни»).
  const [levels, setLevels] = React.useState(() => { const c = _bosTeamGet("levels:" + t.cloudId); return (c && c.map) || {}; });
  React.useEffect(() => {
    let on = true;
    if (!_live || !window.bosCloud || !window.bosCloud.profilesPublic || !members.length) return;
    window.bosCloud.profilesPublic(members.map((m) => m.id)).then((map) => { if (on && map) setLevels(_bosTeamPut("levels:" + t.cloudId, { map: map }).map); }).catch(() => {});
    return () => { on = false; };
  }, [_live, t.cloudId, members.length]);
  const levelOf = (id) => (levels && levels[id] && (levels[id].level | 0)) || 0;
  // УРОВЕНЬ КРУГА (Э1, выбор David — вариант Б): XP с сервера (bos_team_xp, вся история),
  // до SQL-патча честно спит (null → визитка без кольца и шкалы).
  const [circleXP, setCircleXP] = React.useState(() => {
    try { return (typeof _bosCircleCardCache !== "undefined" && _bosCircleCardCache.xp && _bosCircleCardCache.xp[t.cloudId] != null) ? _bosCircleCardCache.xp[t.cloudId] : null; } catch (e) { return null; }
  });
  React.useEffect(() => {
    if (!_live || !window.bosCloud.teamXP) return;
    let on = true;
    const load = () => window.bosCloud.teamXP([t.cloudId]).then((m) => {
      if (on && m && m[t.cloudId] != null) {
        setCircleXP(m[t.cloudId]);
        try { _bosCircleCardCache.xp[t.cloudId] = m[t.cloudId]; _bosCircleCardPersist(); } catch (e) {}
      }
    }).catch(() => {});
    load();
    const iv = setInterval(load, 90000);
    // «bos:teamxp» — отметка доехала до облака (своя или с Главной): пересчёт сразу.
    window.addEventListener("bos:teamxp", load);
    return () => { on = false; clearInterval(iv); window.removeEventListener("bos:teamxp", load); };
  }, [_live, t.cloudId]);
  const circleLvl = (circleXP != null && typeof bosCircleLevel === "function") ? bosCircleLevel(circleXP) : null;
  const rhythmToday = membersN > 0 && todayN >= need;
  const todayGain = todayN * 10 * (rhythmToday ? 2 : 1);
  const openLevelSheet = () => { if (circleLvl) openSheet(<CircleLevelSheetLive lvl={circleLvl} todayGain={todayGain} rhythm={rhythmToday} isDark={isDark} />); };
  // МОИ ЗАЛЁТЫ в этом круге (David 2026-07-16): честный счётчик «пропуск N из 3» в визитке.
  // Активность = облачные дни (rangeRows, ловит отметки без зеркала) ∪ логи зеркал внутри
  // bosCircleStrikes. Владельца свой круг не отпускает — ему счётчик не рисуем.
  const myStrikes = React.useMemo(() => {
    if (_isOwner || !_live || typeof bosCircleStrikes !== "function") return null;
    const cd = new Set(); (rangeRows || []).forEach((r) => { if (r.u === meId) cd.add(r.day); });
    return bosCircleStrikes(t, app?.habits, cd);
  }, [rangeRows, meId, _isOwner, _live]);
  // ПРАЗДНИК АПА: уровень вырос с прошлого визита → конфетти + шторка + подарок XP
  // каждому активному за неделю (уровень×10; идемпотентно по ключу уровня).
  React.useEffect(() => {
    if (!circleLvl || !t.cloudId) return;
    const lv = circleLvl.level;
    let prev = 0;
    try { prev = parseInt(localStorage.getItem("bos:circlelvl:" + t.cloudId) || "0", 10) || 0; } catch (e) {}
    try { localStorage.setItem("bos:circlelvl:" + t.cloudId, String(lv)); } catch (e) {}
    if (prev > 0 && lv > prev) {
      let active = false;
      for (let i = 0; i < 7 && !active; i++) { const k = bosRoomDayKey(i); active = (rangeRows || []).some((r) => r.u === meId && r.day === k); }
      const gift = active ? lv * 10 : 0;
      if (gift > 0 && app?.grantBonusXP) app.grantBonusXP("circlelvl:" + t.cloudId + ":" + lv, gift);
      if (typeof bosCelebrateBuzz === "function") bosCelebrateBuzz();
      if (typeof bosCelebrateLevel === "function") bosCelebrateLevel();
      openSheet(<CircleLevelUpSheetLive level={lv} gift={gift} isDark={isDark} />);
    }
  }, [circleLvl && circleLvl.level]);
  // Аккордеон привычек (David: строка раскрывается вниз, статистика видна на месте).
  const [openHabit, setOpenHabit] = React.useState(null);
  // Непрочитанное для бейджа сегмента «Чат»: чужие сообщения новее последнего прочтения.
  let unreadN = 0;
  try {
    // Метку читаем через bosChatReadTs — терпит и ISO, и старую эпоху-мс (иначе значок мигал).
    const _readTs = (typeof bosChatReadTs === "function") ? bosChatReadTs(localStorage.getItem("bos:chatread:" + t.cloudId)) : 0;
    unreadN = msgs.filter((m) => !m.me && m.ts && m.ts > _readTs).length;
  } catch (e) {}

  /* ── праздник закрытого дня круга (механика не менялась) ── */
  const _myDoneCount = teamHabits.filter((h) => myDone(h)).length;
  const _teamDoneRef = React.useRef(null);
  React.useEffect(() => {
    const prev = _teamDoneRef.current;
    _teamDoneRef.current = _myDoneCount;
    if (prev == null) return;
    if (_myDoneCount <= prev) return;
    if (!teamHabits.length || _myDoneCount !== teamHabits.length) return;
    if (typeof window.bosCelebrateScope !== "function") return;
    if (!window.bosCelebrateScope("circle:" + (app?.persistId || "") + ":" + (t.cloudId || t._id || t.id))) return;
    if (app?.grantBonusXP && typeof bosTodayKey === "function") app.grantBonusXP("perfectday:" + bosTodayKey(), 30);
  }, [_myDoneCount, teamHabits.length]);

  /* ── вёрстка ── */
  const glass = bosGlassChrome(isDark);
  // Цвет шапки. Свой t.accent → он; иначе устойчивый из палитры кругов по имени, чтобы у
  // каждого круга было СВОЁ лицо и оно не прыгало между заходами. Это не данные, а внешность
  // по умолчанию: в макете у каждой группы своя заливка, и в Figma «Группа» лежит Color Picker.
  const heroTint = React.useMemo(() => {
    if (t.accent) return t.accent;
    const pal = (typeof BOS_TEAM_PALETTE !== "undefined" && BOS_TEAM_PALETTE.length) ? BOS_TEAM_PALETTE : ["#7FB3F2"];
    const key = String(t.cloudId || t.id || t.name || "");
    let h = 0;
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
    return pal[h % pal.length];
  }, [t.accent, t.cloudId, t.id, t.name]);
  const editGoalLike = { _id: t._id, id: t.id, cloudId: t.cloudId, __isTeam: true, __team: t, name: t.name, emoji: t.emblem, color: t.accent, target: t.target, unit: t.unit, deadline: t.date || t.deadline || "", circle: true, type: t.type, vis: t.vis, stake: t.stake, goal: t.goal, desc: (goalProg && goalProg.desc) || t.desc || "", joined: t.joined, threadOff: threadOff, habitIds: [] };
  // Подпись строго по макету: «15 участников · 89 дней вместе». Было «живёт N дней ·
  // M человек · открытый · банк» — четыре факта в строку, в макете их два и в другом
  // порядке: сначала СКОЛЬКО НАС, потом СКОЛЬКО МЫ ВМЕСТЕ. Видимость и банк уехали:
  // видимость видна по кнопке вступления, банк живёт на вкладке «Цели».
  const subParts = [];
  if (membersN) subParts.push(membersN + " " + bosRoomPeopleWord(membersN));
  if (ageDays) subParts.push(ageDays + " " + ((ageDays % 10 === 1 && ageDays % 100 !== 11) ? "день" : (ageDays % 10 >= 2 && ageDays % 10 <= 4 && (ageDays % 100 < 12 || ageDays % 100 > 14)) ? "дня" : "дней") + " вместе");
  const card = { background: "var(--card)", borderRadius: 20, boxShadow: "var(--card-shadow)" };
  const bubbleOther = isDark ? "rgba(255,255,255,0.07)" : "#fff";

  // ПРИВЫЧКИ и ДЕЛА — раздельные вкладки одного блока (David 2026-07-20: «чтобы не
  // смешивалось всё в одно; тогда дела не надо подписывать как дела»). Плюс внизу
  // остаётся универсальным. dayList = строки активной вкладки.
  const [listTab, setListTab] = React.useState("habits");
  const [descOpen, setDescOpen] = React.useState(false);
  // ВСТУПЛЕНИЕ ГОСТЯ. Тот же путь, что в каталоге (requestJoin): закрытая группа отвечает
  // {pending:true} → кнопка становится «Заявка отправлена» (кадр «Заявка отправленна»),
  // открытая пускает сразу → перезагружаем комнату уже участником.
  const [joinState, setJoinState] = React.useState("idle"); // idle | sending | pending
  const openRoomMenu = React.useCallback(() => {
    openSheet(<CircleMenuSheetLive team={t} role={_role} isDark={isDark} unreadN={unreadN}
      onJoin={joinThisCircle}
      onAbout={() => openSheet(<CircleAboutSheetLive team={t} membersN={membersN} ageDays={ageDays} isDark={isDark} />)}
      onShare={() => openSheet(<TeamShareSheetLive team={t} />)}
      /* «Уведомления» из меню — шторка настроек ЭТОЙ группы (кадр «Уведомления»),
          а не общий экран уведомлений. */
      onNotify={() => openSheet(<CircleNotifySheetLive team={t} />)}
      onEdit={() => openSheet(<GoalFormSheetLive mode="edit" circleOn={true} navigate={navigate} returnTo={from} goal={editGoalLike} />)}
      onReport={() => openSheet(<CircleReportSheetLive team={t} isDark={isDark} />)}
      /* Выход и удаление — единый путь по кадрам макета: алерт (частная/публичная свой
          текст) → «что оставить себе» → Undo Bar на 6 секунд. Прежний onLeave звал
          bosConfirmExitTeam с ПОЗИЦИОННЫМИ аргументами при объектной сигнатуре — то есть
          кнопка «Выйти» была сломана и падала. */
      onLeave={() => bosExitFlowLive({ app, team: t, isOwner: false, navigate, openSheet, returnTo: "community" })}
      onDelete={() => bosExitFlowLive({ app, team: t, isOwner: true, navigate, openSheet, returnTo: "community" })}
    />);
  });
  const joinThisCircle = React.useCallback(() => {
    if (!t.cloudId || joinState === "sending" || joinState === "pending") return;
    setJoinState("sending");
    try {
      window.bosCloud.requestJoin(t.cloudId).then((res) => {
        if (!res) { setJoinState("idle"); return; }
        if (res.pending) { setJoinState("pending"); if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} } return; }
        navigate("team-detail", { team: { ...t, joined: true }, from: from });
      }).catch(() => setJoinState("idle"));
    } catch (e) { setJoinState("idle"); }
  }, [t.cloudId, joinState, from]);
  const [goalFilter, setGoalFilter] = React.useState("all");   // Все · Для каждого · Общие
  // ВЫБРАННЫЙ ДЕНЬ недели: 0 = сегодня, N = N дней назад. Раньше неделя была картинкой —
  // тапнуть по дню было нельзя, и это правильно раздражало. Для прошлых дней отметки берём
  // из rangeRows (там {u,h,day} за 31 день); времени отметки там нет — значит и не пишем его.
  const [selBack, setSelBack] = React.useState(0);
  const [actOpen, setActOpen] = React.useState(false);   // «Активность дня» раскрывается
  const [strategyOpen, setStrategyOpen] = React.useState(false);
  // РЕДИЗАЙН (Figma 19.08): «Привычки» и «Задачи» поднялись из подвкладок в ВЕРХНИЕ сегменты,
  // а «Сегодня» показывает и то и другое одним списком — в макете внутри одной таблицы стоят
  // и Group Task Today Row, и Group Habit Today Row. listTab оставлен: по нему всё ещё
  // считается «N из M», и это запасной путь, если сегменты откатим.
  const _showHabits = roomTab === "day" || roomTab === "habits";
  // Дела круга живут БЕЗ ИСТОРИИ (у команды один список, а не список на каждый день).
  // Значит на прошлом дне показывать сегодняшние дела нельзя — это выглядело бы так,
  // будто они были и тогда. На прошлом дне остаются только привычки: у них есть журнал.
  const _showTasks = (roomTab === "day" && selBack === 0) || roomTab === "tasks";
  // ДВА СПИСКА вместо одного — так в макете: сверху карточка с тем, что ещё не сделано,
  // ниже заголовок «Вы выполнили» и вторая карточка с зачёркнутыми строками. Раньше
  // выполненное лежало вперемешку и глаз не находил, что осталось.
  const dayList = [];   // ещё не отмечено
  const doneList = [];  // «Вы выполнили»
  // Время МОЕЙ отметки по конкретной привычке — из сегодняшней ленты логов (u=я, h=привычка).
  const myMarkAt = (habitId) => {
    let best = null;
    dayRows.forEach((r) => { if (r.u === meId && r.h === habitId && (!best || r.at < best)) best = r.at; });
    return best;
  };
  const _selKey = bosRoomDayKey(selBack);
  const _pastDay = selBack > 0;
  // Отметка за ПРОШЛЫЙ день: смотрим в rangeRows (мой id + эта привычка + этот день).
  const _doneOn = (habitId) => rangeRows.some((r) => r.u === meId && r.h === habitId && r.day === _selKey);
  const _doneCountOn = (habitId) => {
    const u = {}; rangeRows.forEach((r) => { if (r.h === habitId && r.day === _selKey) u[r.u] = true; });
    return Object.keys(u).length;
  };
  if (_showHabits) teamHabits.forEach((h, i) => {
    const done = _pastDay ? _doneOn(h.id) : myDone(h);
    const facesH = (Array.isArray(h.todayUsers) ? h.todayUsers : []).map((u) => rosterById[u]).filter(Boolean);
    const opened = openHabit === h.id;
    // Гость ничего не отмечает — у него в макете вместо кружка «взять себе». Значит и
    // делить список на «сделано / не сделано» ему незачем: всё идёт одним списком.
    const _bucket = (_isGuest || roomTab === "habits") ? dayList : (done ? doneList : dayList);
    // Время отметки есть ТОЛЬКО у сегодняшнего дня: журнал прошлых дней хранит дату без
    // часа. Значит на прошлом дне «Выполнено в 6:58» было бы неправдой — пишем просто
    // «Выполнено».
    const _at = (done && !_pastDay) ? myMarkAt(h.id) : null;
    // Подпись строки. На «Привычках» макет показывает РАСПИСАНИЕ («Ежедневно · 18:00»,
    // «Пн-Ср-Пт»), на «Сегодня» — просто «Привычка». Расписание собираем из маски дней.
    const _mask = (typeof bosDaysMask === "function") ? bosDaysMask(h.days) : null;
    const _DOW = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
    const _schedule = _mask ? _DOW.filter((_, i) => _mask[i]).join("-") : "Ежедневно";
    const _tagHabits = [_schedule, h.time].filter(Boolean).join(" \u00b7 ");
    const _hRow = (
      <CircleDayRowLive first={_bucket.length === 0} isDark={isDark}
        icon={bosIconOf(h, 26, h.color)} iconColor={h.color && h.color !== "#0a0a0a" ? h.color : null}
        name={h.name} struck={done && roomTab !== "habits"}
        tag={roomTab === "habits" ? _tagHabits : (done ? ("Выполнено" + (_at ? " в " + bosRoomHHMM(_pt(_at)) : "")) : "Привычка")}
        doneN={_pastDay ? _doneCountOn(h.id) : facesH.length} totalN={membersN}
        on={done} inert={!_live || _pastDay}
        adopt={_isGuest} onAdopt={joinThisCircle}
        onToggle={() => (adoptedFor(h) ? markAdopted(h) : toggleMyTeamHabit(h))}
        onOpen={() => setOpenHabit(opened ? null : h.id)} />
    );
    // Свайп влево (владелец) → «Изменить · Удалить»; остальным — обычная строка.
    _bucket.push(_isOwner
      ? <SwipeRow key={"h" + (h.id || i)} rowBg="var(--card)" dark={isDark} actionWidth={54} actionSize={32} actions={_habitSwipe(h)}>{_hRow}</SwipeRow>
      : <div key={"h" + (h.id || i)}>{_hRow}</div>);
    // Неделя под строкой — только на вкладке «Привычки» (в макете она есть именно там).
    if (roomTab === "habits") _bucket.push(
      <CircleHabitWeekLive key={"hw" + (h.id || i)} habit={h} rangeRows={rangeRows} membersN={membersN} isDark={isDark} />
    );
    // АККОРДЕОН (David 2026-07-16: «не на отдельную вкладку — привычка раскрывается вниз,
    // и видно всё, что в неё входит, как в макетах»): тап по строке → статистика тут же.
    if (opened) _bucket.push(
      <div key={"hx" + (h.id || i)} style={{ padding: "0 2px 13px" }}>
        <HabitStandardSheetLive bare mode="circle" habit={h} team={t} members={members} meId={meId} levels={levels}
          rangeRows={rangeRows} dayRows={dayRows} done={done}
          onToggle={() => (adoptedFor(h) ? markAdopted(h) : toggleMyTeamHabit(h))}
          onEdit={null} onPerson={openPerson} isDark={isDark} />
      </div>
    );
  });
  const taskGroups = [];      // [{key, label, rows: []}] — только для вкладки «Задачи»
  const _taskGroupOf = (tk) => {
    const at = tk.createdAt || tk.created_at;
    const d = at ? (typeof bosParseTs === "function" ? bosParseTs(at) : new Date(at)) : new Date();
    d.setHours(0, 0, 0, 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diff = Math.round((today - d) / 86400000);
    const key = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
    const MON = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
    const label = diff === 0 ? "Сегодня" : diff === 1 ? "Вчера"
      : (d.getDate() + " " + MON[d.getMonth()] + ". " + d.getFullYear());
    return { key: key, label: label, ord: d.getTime() };
  };
  if (_showTasks) _teamTasks.forEach((tk, i) => {
    const facesT = (Array.isArray(tk.doneUsers) ? tk.doneUsers : []).map((u) => rosterById[u]).filter(Boolean);
    const _tDone = !!tk.doneByMe;
    const _tBucket = _tDone ? doneList : dayList;
    const _tRow = (
      <CircleDayRowLive first={_tBucket.length === 0} isDark={isDark}
        icon={<I.Flag size={24} strokeWidth={2} color="var(--text-2)" />} name={tk.text}
        struck={_tDone} tag={_tDone ? "Выполнено" : "Задача"}
        doneN={facesT.length} totalN={membersN}
        on={_tDone} inert={!_live}
        onToggle={() => toggleMyTeamTask(tk)} />
    );
    // На вкладке «Задачи» строка едет в группу своей даты, а не в общий список.
    if (roomTab === "tasks") {
      const g = _taskGroupOf(tk);
      let grp = taskGroups.find((x) => x.key === g.key);
      if (!grp) { grp = { key: g.key, label: g.label, ord: g.ord, rows: [] }; taskGroups.push(grp); }
      const _row = (
        <CircleDayRowLive first={grp.rows.length === 0} isDark={isDark}
          icon={<I.Flag size={24} strokeWidth={2} color="var(--text-2)" />} name={tk.text}
          struck={_tDone} tag={_tDone ? "Выполнено" : null}
          doneN={facesT.length} totalN={membersN}
          on={_tDone} inert={!_live}
          onToggle={() => toggleMyTeamTask(tk)} />
      );
      grp.rows.push(_isOwner
        ? <SwipeRow key={"t" + tk.id} rowBg="var(--card)" dark={isDark} actionWidth={54} actionSize={32} actions={_taskSwipe(tk)}>{_row}</SwipeRow>
        : <div key={"t" + tk.id}>{_row}</div>);
      return;
    }
    // Свайп влево (владелец) → «Удалить» (David: «фото завтрака не удалить»); метки «дело» нет — вкладка сама говорит.
    _tBucket.push(_isOwner
      ? <SwipeRow key={"t" + tk.id} rowBg="var(--card)" dark={isDark} actionWidth={54} actionSize={32} actions={_taskSwipe(tk)}>{_tRow}</SwipeRow>
      : <div key={"t" + tk.id}>{_tRow}</div>);
  });

  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      {/* ШАПКА-ГЕРОЙ (редизайн Figma 19.08, кадр «Группа / Участник»). Была пилюля 44px с
          именем внутри; в макете шапка — блок 476px: цветная подложка с затуханием, аватар 96,
          имя по центру, ряд стеклянных кнопок и описание. Смысл сдвига: комната перестаёт
          читаться как список и начинает читаться как МЕСТО.

          Кнопки: «Чат» текстом (в макете он вышел из сегментов), рядом два кружка — «Люди» и
          «Путь». Ни один сегмент не пропал, все трое переехали сюда. */}
      <div style={{ position: "relative", margin: "0 -16px", padding: "0 16px" }}>
        <div aria-hidden style={{
          position: "absolute", inset: "0 0 auto", height: 400, pointerEvents: "none",
          background: "linear-gradient(180deg, " + heroTint + (isDark ? "8C" : "A6") + " 0%, "
            + heroTint + (isDark ? "3D" : "4D") + " 38%, " + heroTint + "14 62%, transparent 84%)",
        }} />

        {/* Панель сверху: назад слева, компас и «⋯» справа. В Телеграме свой «назад». */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 44, paddingTop: 6 }}>
          {!_inTG ? (
            <button onClick={() => navigate(from)} className="tap" aria-label="Назад"
              style={{ ...glass, width: 36, height: 36, borderRadius: "50%", border: 0, display: "grid", placeItems: "center", color: "var(--text)", cursor: "pointer" }}>
              <I.ChevronLeft size={20} strokeWidth={2.4} />
            </button>
          ) : <span />}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* КАРАНДАШ — только у админа (кадр «Админ»): у участника и гостя его в макете нет.
                Прежний компас «Хозяйство круга» переехал в меню «⋯» — в макете этой кнопки
                на экране нет вовсе, а маршрут терять нельзя. */}
            {_role === "admin" && _live && (
              <button onClick={() => openSheet(<GoalFormSheetLive mode="edit" circleOn={true} navigate={navigate} returnTo={from} goal={editGoalLike} />)} className="tap" aria-label="Редактировать группу"
                style={{ ...glass, position: "relative", width: 36, height: 36, borderRadius: "50%", border: 0, display: "grid", placeItems: "center", color: "var(--text)", cursor: "pointer" }}>
                <I.Pencil size={16} strokeWidth={2} />
                {redCount > 0 && <span style={{ position: "absolute", top: -3, right: -3, minWidth: 16, height: 16, borderRadius: 999, background: "var(--accent-red)", color: "#fff", fontSize: 9.5, fontWeight: 800, display: "grid", placeItems: "center", padding: "0 4px" }}>{redCount}</span>}
              </button>
            )}
            <button ref={moreRef} onClick={openRoomMenu} className="tap" aria-label="Ещё" aria-haspopup="dialog"
              style={{ ...glass, width: 36, height: 36, borderRadius: "50%", border: 0, display: "grid", placeItems: "center", color: "var(--text)", cursor: "pointer" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>
            </button>
          </div>
        </div>

        {/* Аватар 96 с КОЛЬЦОМ УРОВНЯ по контуру и бейджем «Lvl. N» под ним — так в макете.
            Кольцо — не украшение: это доля до следующего уровня круга (circleLvl.frac), тот
            же счёт, что в шторке уровня. Цвет кольца и бейджа — цвет круга, чтобы шапка
            читалась одним пятном. Дуга нарисована с 12 часов по часовой (rotate -90). */}
        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 12, paddingBottom: 24 }}>
          <span style={{ position: "relative", width: 104, height: 104, flexShrink: 0, display: "grid", placeItems: "center" }}>
            {circleLvl && (
              <svg viewBox="0 0 104 104" width="104" height="104" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }} aria-hidden>
                <circle cx="52" cy="52" r="50" fill="none" stroke={isDark ? "rgba(255,255,255,0.10)" : "rgba(10,10,10,0.08)"} strokeWidth="3" />
                <circle cx="52" cy="52" r="50" fill="none" stroke={heroTint} strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={314.16} strokeDashoffset={(314.16 * (1 - circleLvl.frac)).toFixed(1)} />
              </svg>
            )}
            <span style={{ width: 96, height: 96, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 46, overflow: "hidden",
              background: isDark ? "#0d0d10" : "#ffffff", boxShadow: bosOrbGlass(isDark) }}>{bosIconOf(t, 46, null, "\ud83d\udc65")}</span>
          </span>
          {circleLvl && (
            <span onClick={openLevelSheet} className="tap" style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 10, cursor: "pointer" }}>
              <span aria-hidden style={{ width: 14, height: 14, borderRadius: "50%", background: heroTint, display: "inline-block" }} />
              <span style={{ fontSize: 13, fontWeight: 590, color: heroTint }}>{"Lvl. " + circleLvl.level}</span>
            </span>
          )}
          <div style={{ textAlign: "center", maxWidth: 320, marginTop: 6 }}>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px", color: "var(--text)", lineHeight: 1.25 }}>{t.name}</div>
            {/* ПОДПИСЬ по роли: у админа в макете стоит вид группы («Публичная группа»),
                у участника и гостя — «15 участников · 89 дней вместе». */}
            <div style={{ fontSize: 15, lineHeight: "20px", color: "var(--text-2)", marginTop: 2 }}>
              {_role === "admin" ? (t.vis === "public" ? "Публичная группа" : "Частная группа") : subParts.join(" \u00b7 ")}
            </div>
          </div>
        </div>

        {/* РЯД КНОПОК ПО РОЛИ (размеры из макета: широкая 50 в высоту, кружки 50×50, зазор 10).
              гость    → «+ Вступить» БЕЛОЙ первичной + кружки [чат][календарь];
              участник → «Чат» текстом + кружки [добавить][календарь];
              админ    → «+ Создать» + кружки [чат][календарь].
            Разные роли — разное первое действие, и в макете это видно с первого взгляда. */}
        <div style={{ position: "relative", display: "flex", justifyContent: "center", gap: 10, paddingBottom: 24 }}>
          {_isGuest ? (
            <button onClick={joinThisCircle} disabled={joinState === "sending" || joinState === "pending"} className="tap" data-haptic="selection"
              style={{ width: 230, height: 50, borderRadius: 999, border: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                background: joinState === "pending" ? "var(--surface-3)" : "var(--cta)",
                color: joinState === "pending" ? "var(--text-2)" : "var(--cta-ink)",
                fontSize: 17, fontWeight: 590, cursor: joinState === "pending" ? "default" : "pointer", opacity: joinState === "sending" ? 0.6 : 1 }}>
              {joinState === "pending" ? "Заявка отправлена" : (<React.Fragment><I.Plus size={20} strokeWidth={2.4} />Вступить</React.Fragment>)}
            </button>
          ) : _role === "admin" ? (
            <button onClick={() => openSheet(<CircleAddSheetLive isDark={isDark} onHabit={openAddHabit} onTask={() => openSheet(<CircleTaskComposeSheetLive isDark={isDark} onAdd={addTeamTaskCloud} />)} />)}
              className="tap" data-haptic="selection"
              style={{ ...glass, width: 200, height: 50, borderRadius: 999, border: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--text)", fontSize: 17, fontWeight: 590, cursor: "pointer" }}>
              <I.Plus size={20} strokeWidth={2.4} />Создать
            </button>
          ) : (
            <button onClick={() => setRoomTab("chat")} className="tap" data-haptic="selection"
              style={{ ...glass, position: "relative", width: 160, height: 50, borderRadius: 999, border: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--text)", fontSize: 17, fontWeight: 590, cursor: "pointer" }}>
              <I.MessageCircle size={20} strokeWidth={2} />Чат
              {unreadN > 0 && (
                <span style={{ position: "absolute", top: 4, right: 10, minWidth: 18, height: 18, padding: "0 5px", borderRadius: 999, background: "var(--accent-red)", color: "#fff", fontSize: 10.5, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{unreadN > 9 ? "9+" : unreadN}</span>
              )}
            </button>
          )}

          {/* Второй кружок: участнику — «добавить», гостю и админу — «чат» (у админа своя
              широкая «Создать», у гостя добавлять нечего). */}
          {_role === "member" ? (
            <button onClick={() => openSheet(<CircleAddSheetLive isDark={isDark} onHabit={openAddHabit} onTask={() => openSheet(<CircleTaskComposeSheetLive isDark={isDark} onAdd={addTeamTaskCloud} />)} />)}
              className="tap" data-haptic="selection" aria-label="Добавить привычку или дело"
              style={{ ...glass, width: 50, height: 50, borderRadius: "50%", border: 0, display: "grid", placeItems: "center", color: "var(--text)", cursor: "pointer" }}>
              <I.Plus size={22} strokeWidth={2.2} />
            </button>
          ) : (
            <button onClick={() => setRoomTab("chat")} className="tap" data-haptic="selection" aria-label="Чат группы"
              style={{ ...glass, position: "relative", width: 50, height: 50, borderRadius: "50%", border: 0, display: "grid", placeItems: "center", color: "var(--text)", cursor: "pointer" }}>
              <I.MessageCircle size={20} strokeWidth={2} />
              {unreadN > 0 && <span style={{ position: "absolute", top: -2, right: -2, minWidth: 18, height: 18, padding: "0 5px", borderRadius: 999, background: "var(--accent-red)", color: "#fff", fontSize: 10.5, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{unreadN > 9 ? "9+" : unreadN}</span>}
            </button>
          )}

          {/* Календарь в шапке ведёт в «Обзор» — отдельную страницу с календарём Д·Н·М и
              сеткой часов (кадры «… / Обзор»). Раньше он просто переключал вкладку «Путь». */}
          <button onClick={() => navigate("team-overview", { team: t, from: "team-detail" })} className="tap" data-haptic="selection" aria-label="Обзор группы"
            style={{ ...glass, width: 50, height: 50, borderRadius: "50%", border: 0, display: "grid", placeItems: "center", color: "var(--text)", cursor: "pointer" }}>
            <I.Calendar size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Описание с «Ещё» и строка места — блок Content из макета (2 строки, потом обрез). */}
        {t.desc && (
          <div style={{ position: "relative", paddingBottom: 24, textAlign: "center" }}>
            <div style={{ fontSize: 15, lineHeight: 1.33, color: "var(--text-2)", display: "-webkit-box", WebkitLineClamp: descOpen ? 99 : 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{t.desc}</div>
            {t.desc.length > 90 && (
              <button onClick={() => setDescOpen(!descOpen)} className="tap"
                style={{ border: 0, background: "transparent", color: "var(--text)", fontSize: 15, fontWeight: 590, cursor: "pointer", padding: "2px 0 0" }}>{descOpen ? "Свернуть" : "Ещё"}</button>
            )}
          </div>
        )}
      </div>

      {/* КАРТОЧКА СОСТАВА — только у админа (кадр «Админ»): две строки со счётом и стрелкой.
          Числа настоящие: участники из состава, администраторы — те, у кого роль owner/admin. */}
      {_role === "admin" && (
        <div style={{ background: "var(--card)", borderRadius: 16, overflow: "hidden", marginTop: 4 }}>
          <button onClick={() => navigate("team-members", { team: t, from: from })} className="tap"
            style={{ width: "100%", border: 0, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", color: "var(--text)" }}>
            <I.Users size={22} strokeWidth={1.9} />
            <span style={{ flex: 1, textAlign: "left", fontSize: 17 }}>Участники</span>
            <span style={{ fontSize: 17, color: "var(--text-2)" }}>{membersN}</span>
            <I.ChevronRight size={17} color="var(--text-3)" />
          </button>
          <button onClick={() => navigate("team-admins", { team: t, from: from })} className="tap"
            style={{ width: "100%", border: 0, borderTop: "0.5px solid var(--line-2)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", color: "var(--text)" }}>
            <I.Star size={22} strokeWidth={1.9} />
            <span style={{ flex: 1, textAlign: "left", fontSize: 17 }}>Администраторы</span>
            <span style={{ fontSize: 17, color: "var(--text-2)" }}>{members.filter((m) => m.role === "owner" || m.role === "admin").length || 1}</span>
            <I.ChevronRight size={17} color="var(--text-3)" />
          </button>
        </div>
      )}

      {/* СЕГМЕНТЫ ПО МАКЕТУ: Сегодня · Привычки · Задачи · Цели. Чат, Путь и Люди ушли в
          кнопки шапки — сегментов снова четыре, но теперь они про СОДЕРЖИМОЕ круга, а не про
          способ на него посмотреть.
          Материал: жёлоб высотой 32 с внутренним полем 2 (в макете Segmented control 361×32,
          padding 2) — стандартный сегмент iOS вместо нашей прежней карточки 34. */}
      {/* Замеры из узла «Segmented control» (393×42, жёлоб 361×32, поле 2, элемент 89×28):
            жёлоб  — СКРУГЛЁН ПОЛНОСТЬЮ (r=1000 в макете), заливка #999999 @17 %, стекло;
            активный — таблетка #767680 @24 %, текст #FFFFFF;
            прочие  — без заливки, текст #8A8A8A;
            начертание 13/590 У ВСЕХ (не 590/400, как я сделал сначала).
          Бегунок ЕДЕТ: отдельный слой с translateX и пружиной — в прежней версии активный
          сегмент просто перекрашивался, и переключение читалось как подмена, а не движение. */}
      <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", padding: 2, marginTop: 8,
        height: 32, boxSizing: "border-box", borderRadius: 999,
        background: "rgba(153,153,153,0.17)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)", backdropFilter: "blur(20px) saturate(180%)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.10)" }}>
        <span aria-hidden style={{ position: "absolute", top: 2, bottom: 2, left: 2, width: "calc((100% - 4px) / 4)",
          borderRadius: 999, background: "rgba(118,118,128,0.24)",
          transform: "translateX(" + (["day", "habits", "tasks", "goals"].indexOf(roomTab) < 0 ? 0 : ["day", "habits", "tasks", "goals"].indexOf(roomTab)) * 100 + "%)",
          transition: "transform .34s cubic-bezier(0.34,1.4,0.44,1)" }} />
        {[["day", "Сегодня"], ["habits", "Привычки"], ["tasks", "Задачи"], ["goals", "Цели"]].map(([id, label]) => {
          const on = roomTab === id;
          return (
            <button key={id} onClick={() => { setRoomTab(id); if (id === "habits" || id === "tasks") setListTab(id); try { window.scrollTo(0, 0); } catch (e) {} }} className="tap" data-haptic="selection"
              style={{ position: "relative", minWidth: 0, border: 0, borderRadius: 999, height: 28, padding: 0, cursor: "pointer",
                background: "transparent", fontSize: 13, fontWeight: 590, letterSpacing: "-0.1px",
                color: on ? "#FFFFFF" : "#8A8A8A", transition: "color .2s" }}>
              {label}
            </button>
          );
        })}
      </div>

      {/* Выпадающее меню у кнопки УБРАНО: в макете это шторка снизу (CircleMenuSheetLive),
          она открывается прямо из обработчика «⋯». */}

      {(roomTab === "day" || roomTab === "habits" || roomTab === "tasks") && (<div key={"tab-" + roomTab} className="fig-swap">
      {/* ДЕНЬ (v5, кадр 05): здесь остаётся ТОЛЬКО сегодняшнее действие. Уровень, счёт и
          календарь уехали в «Путь», список людей — в «Люди», имя круга живёт в шапке. Первым —
          факт дня словами, под ним нить: кто и в котором часу уже закрыл своё. */}
      {/* НЕДЕЛЯ ДНЕЙ — в макете идёт сразу под сегментами: ВС..СБ и числа, у каждого дня
          кольцо-доля «сколько круга отметилось в тот день», сегодня — залитый круг.
          Данные настоящие: rangeRows (логи за 31 день) уже собраны в byDay выше. */}
      {roomTab === "day" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "6px 0 10px" }}>
          {/* Неделя КАЛЕНДАРНАЯ: ВС..СБ той недели, в которой сегодня — в макете «сегодня»
              стоит четвёртым (среда), а не последним. «Последние 7 дней» давали бы сегодня
              всегда справа и неделя никогда не читалась бы как неделя. */}
          {[0, 1, 2, 3, 4, 5, 6].map((dow) => {
            const now = new Date(); now.setHours(0, 0, 0, 0);
            // Неделя строится вокруг ВЫБРАННОГО дня: выбрал 5 августа в календаре — лента
            // переехала на ту неделю. Иначе календарь и лента показывали бы разные недели.
            const piv = new Date(now); piv.setDate(now.getDate() - selBack);
            const d = new Date(piv); d.setDate(piv.getDate() - piv.getDay() + dow);
            const back = Math.round((now - d) / 86400000);
            const k = bosRoomDayKey(back);
            const dowName = ["ВС", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"][dow];
            const doneN = back >= 0 ? Object.keys(byDay[k] || {}).length : 0;
            const frac = membersN > 0 ? Math.max(0, Math.min(1, doneN / membersN)) : 0;
            const today = back === 0;
            const future = back < 0;
            const sel = back === selBack;   // залит ВЫБРАННЫЙ день, а не всегда сегодня
            /* КОЛЬЦО ДНЯ — по узлу макета это ПОЛНАЯ окружность 40×40 толщиной 1.5,
               окрашенная состоянием, а не дуга-прогресс (я сначала рисовал дугу — «примерно»):
                 #0EBE65 зелёный — отметился весь круг
                 #1CDDBD бирюза  — отметилась часть
                 #8A8A8A серый   — в этот день никто
                 #007BFF синий   — сегодня (день ещё идёт, счёт не окончательный) */
            const ring = today ? "var(--accent-blue)"
              : (doneN === 0 ? "#8A8A8A" : (frac >= 1 ? "var(--accent)" : "var(--accent-teal)"));
            const R = 19.25;
            return (
              <button key={k} onClick={() => { if (!future) { setSelBack(back); if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} } } }}
                disabled={future} className={future ? undefined : "tap"}
                style={{ border: 0, background: "transparent", padding: 0, cursor: future ? "default" : "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-3)", letterSpacing: "0.2px" }}>{dowName}</span>
                <span style={{ position: "relative", width: 38, height: 38, display: "grid", placeItems: "center" }}>
                  {!future && (
                    <svg viewBox="0 0 40 40" width="40" height="40" style={{ position: "absolute", inset: -1 }} aria-hidden>
                      <circle cx="20" cy="20" r={R} fill="none" stroke={ring} strokeWidth="1.5" />
                    </svg>
                  )}
                  <span style={{ width: 34, height: 34, borderRadius: "50%", display: "grid", placeItems: "center",
                    fontSize: 20, fontWeight: (today || sel) ? 590 : 400, lineHeight: "24px", letterSpacing: (today || sel) ? 0 : "-0.45px",
                    background: sel ? "var(--cta)" : "transparent",
                    color: sel ? "var(--cta-ink)" : (future ? "var(--text-3)" : "var(--text)"),
                    transition: "background .2s, color .2s" }}>{d.getDate()}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* АКТИВНОСТЬ ДНЯ — карточка из макета вместо прежнего «Четверо уже в деле» + нити.
          Лента суток разбита на 4 отрезка по 6 часов; в отрезке — лица тех, чья ПЕРВАЯ
          сегодняшняя отметка попала в него, и «+N», если не влезли. Под лентой — часовая
          шкала, ниже слева «N отметились», справа «последняя HH:MM».
          Ничего не выдумано: firstByUser собран из team_habit_logs за сегодня. */}
      {/* АКТИВНОСТЬ ДНЯ. Слушается ВЫБРАННОГО дня недели и РАСКРЫВАЕТСЯ по тапу —
          обоих взаимодействий раньше не было, карточка была картинкой.

          Сегодня: лента суток по часам (есть время первой отметки), метка «сейчас»,
                   в раскрытом виде — кто и во сколько.
          Прошлый день: времени в данных нет (rangeRows хранит только день), поэтому
                   ленту не рисуем и время НЕ ВЫДУМЫВАЕМ — показываем, сколько человек
                   закрыло день, а в раскрытом виде их поимённо. */}
      {roomTab === "day" && !threadOff && (() => {
        const selKey = bosRoomDayKey(selBack);
        /* ТОЧКИ КАЛЕНДАРЯ. По каждому дню считаем, СКОЛЬКО ЧЕЛОВЕК отметилось хотя бы раз:
             все участники → зелёная · часть → оранжевая · никто, но день был по расписанию →
             красная · нечего было делать → пусто. Расписание берём из масок привычек круга,
             поэтому выходной круга не красится «пропуском». */
        const calMarks = (() => {
          const byDayU = {};
          yearRows.forEach((r) => { (byDayU[r.day] || (byDayU[r.day] = {}))[r.u] = true; });
          const masks = teamHabits.map((h) => (typeof bosDaysMask === "function" ? bosDaysMask(h.days) : null));
          const out = {};
          const t0 = new Date(); t0.setHours(0, 0, 0, 0);
          for (let i = 0; i < 366; i++) {
            const d = new Date(t0); d.setDate(t0.getDate() - i);
            const k = bosRoomDayKey(i);
            const n = Object.keys(byDayU[k] || {}).length;
            if (n > 0) { out[k] = n >= Math.max(1, membersN) ? "full" : "part"; continue; }
            const dow = (typeof bosDowOfKey === "function") ? bosDowOfKey(k) : d.getDay();
            const due = masks.some((m) => !m || m[dow]);
            if (due && teamHabits.length && i > 0) out[k] = "miss";
          }
          return out;
        })();
        const isToday = selBack === 0;
        const selDate = new Date(); selDate.setHours(0, 0, 0, 0); selDate.setDate(selDate.getDate() - selBack);
        const MON = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
        const marks = isToday
          ? members.filter((m) => firstByUser[m.id])
              .map((m) => ({ id: m.id, name: m.id === meId ? "Ты" : m.name, avatar: m.avatar, hr: _hr(firstByUser[m.id]), at: firstByUser[m.id] }))
              .sort((a, b) => a.hr - b.hr)
          : Object.keys(byDay[selKey] || {}).map((u) => rosterById[u]).filter(Boolean)
              .map((m) => ({ id: m.id, name: m.id === meId ? "Ты" : m.name, avatar: m.avatar, hr: null, at: null }));
        const slots = [0, 1, 2, 3].map((i) => marks.filter((x) => x.hr != null && x.hr >= i * 6 && x.hr < (i + 1) * 6));
        const lastAt = isToday && marks.length ? marks[marks.length - 1].at : null;
        return (
          <div style={{ ...card, padding: "14px 16px 12px", marginTop: 4 }}>
            <button onClick={() => { const nx = !actOpen; setActOpen(nx); if (nx) setPathSeen(true); }} className="tap" data-haptic="selection"
              style={{ width: "100%", border: 0, background: "transparent", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 8, color: "var(--text)" }}>
              {/* Заголовок карточки в узле — 17/590, не 20/700. */}
              <span style={{ flex: 1, textAlign: "left", fontSize: 17, fontWeight: 590, lineHeight: "22px", letterSpacing: "-0.43px" }}>
                {isToday ? "Активность дня" : ("Активность " + selDate.getDate() + " " + MON[selDate.getMonth()])}
              </span>
              <I.ChevronRight size={18} color="var(--text-3)"
                style={{ transform: actOpen ? "rotate(90deg)" : "none", transition: "transform .24s cubic-bezier(0.34,1.4,0.44,1)" }} />
            </button>

            {/* ЛЕНТА СУТОК — по узлу «Daily activity»: 4 полосы 34 с линиями 0.5, лица 17
                парой с «+N» 12/590, «сейчас» — синий чип 20×20 #007BFF@0.10 в текущей полосе,
                под лентой подписи часов 13/590 @0.30. */}
            {isToday && (
              <React.Fragment>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", marginTop: 8,
                  border: "0.5px solid var(--line-2)", borderRadius: 8, height: 34, boxSizing: "border-box" }}>
                  {slots.map((people, i) => {
                    const nowSlot = Math.floor(new Date().getHours() / 6) === i;
                    return (
                      <span key={i} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2,
                        borderLeft: i ? "0.5px solid var(--line-2)" : 0, padding: "0 4px", overflow: "hidden" }}>
                        {nowSlot && (
                          <span aria-hidden style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, display: "grid", placeItems: "center",
                            background: "rgba(0,123,255,0.10)" }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-blue)" }} />
                          </span>
                        )}
                        {people.slice(0, 2).map((p, j) => (
                          <span key={p.id} style={{ marginLeft: j ? -7 : 0, borderRadius: "50%", boxShadow: "0 0 0 2px var(--card)", lineHeight: 0 }}>
                            <BuddyFaceLive avatar={p.avatar} name={p.name} size={17} />
                          </span>
                        ))}
                        {people.length > 2 && <span style={{ fontSize: 12, fontWeight: 590, color: "var(--text-2)", marginLeft: 2 }}>{"+" + (people.length - 2)}</span>}
                      </span>
                    );
                  })}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0 0" }}>
                  {["00:00", "06:00", "12:00", "18:00", "00:00"].map((h, i) => (
                    <span key={i} style={{ fontSize: 13, fontWeight: 590, lineHeight: "18px", color: "var(--text-3)" }}>{h}</span>
                  ))}
                </div>
              </React.Fragment>
            )}

            {/* Подпись 13/400 из узла: «N отметились · последняя HH:MM». */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, lineHeight: "18px", letterSpacing: "-0.08px", color: "var(--text-2)" }}>
                <I.Users size={13} strokeWidth={2} />{marks.length + " " + (marks.length === 1 ? "отметился" : "отметились")}
              </span>
              {lastAt && <span style={{ fontSize: 13, lineHeight: "18px", letterSpacing: "-0.08px", color: "var(--text-2)" }}>{"последняя " + bosRoomHHMM(_pt(lastAt))}</span>}
            </div>

            {/* РАСКРЫТИЕ = КАЛЕНДАРЬ (David: «нажал на активность дня — она должна раскрыться
                в календаре»). Сначала месяц с честной точкой под каждым днём, под ним — кто
                отметился в выбранный день. Тап по числу переносит весь экран на этот день.
                Для сегодня время есть, для прошлых дней в данных его нет — и мы его не выдумываем. */}
            {actOpen && (
              <div className="fig-expand" style={{ marginTop: 10, paddingTop: 8, borderTop: "0.5px solid var(--line-2)" }}>
                {typeof FigMonthCalendar === "function" && (
                  <FigMonthCalendar value={selKey} marks={calMarks}
                    onPick={(k) => {
                      const p = k.split("-");
                      const d = new Date(+p[0], +p[1] - 1, +p[2]);
                      const t0 = new Date(); t0.setHours(0, 0, 0, 0);
                      setSelBack(Math.max(0, Math.round((t0 - d) / 86400000)));
                    }}
                    footer={<React.Fragment>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-2)" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: 3, background: "var(--accent)" }} />все</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: 3, background: "var(--accent-orange)" }} />часть</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: 3, background: "var(--accent-red)" }} />пропуск</span>
                      </span>
                      {selBack > 0 && (
                        <button onClick={() => setSelBack(0)} className="tap"
                          style={{ border: 0, background: "transparent", cursor: "pointer", fontSize: 15, fontWeight: 590, color: "var(--text)", padding: 0 }}>Сегодня</button>
                      )}
                    </React.Fragment>} />
                )}
                <div style={{ height: 8 }} />
                {marks.length === 0 && <div style={{ fontSize: 15, color: "var(--text-3)", padding: "4px 0" }}>В этот день круг не отмечался.</div>}
                {marks.map((p) => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0" }}>
                    <BuddyFaceLive avatar={p.avatar} name={p.name} size={28} />
                    <span style={{ flex: 1, minWidth: 0, fontSize: 17, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                    {p.at && <span style={{ fontSize: 15, color: "var(--text-2)" }}>{bosRoomHHMM(_pt(p.at))}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* ЗАЯВКИ — владельцу, прямо у двери. */}
      {_isOwner && pending.length > 0 && (
        <div style={{ ...card, marginTop: 10, padding: "11px 13px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase", color: "var(--text-4)", marginBottom: 8 }}>Стучатся в круг · {pending.length}</div>
          {pending.map((p) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "5px 0" }}>
              <BuddyFaceLive avatar={p.avatar} name={p.name || "Гость"} size={28} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name || "Гость"}</span>
              <button onClick={() => approveReq(p.id)} className="tap" style={{ border: 0, borderRadius: 999, padding: "6px 13px", fontSize: 11.5, fontWeight: 700, cursor: "pointer", background: isDark ? "#fff" : "#0a0a0a", color: isDark ? "#0a0a0a" : "#fff" }}>Принять</button>
              <button onClick={() => rejectReq(p.id)} className="tap" style={{ border: 0, borderRadius: 999, padding: "6px 11px", fontSize: 11.5, fontWeight: 700, cursor: "pointer", background: isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)", color: "var(--text-2)" }}>Нет</button>
            </div>
          ))}
        </div>
      )}

      {roomTab === "day" && selBack > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "12px 4px 0" }}>
          <span style={{ fontSize: 15, color: "var(--text-2)" }}>Прошедший день — только посмотреть</span>
          <button onClick={() => { setSelBack(0); setActOpen(false); }} className="tap"
            style={{ border: 0, background: "transparent", cursor: "pointer", fontSize: 15, fontWeight: 590, color: "var(--text)", padding: 0 }}>К сегодня</button>
        </div>
      )}

      {/* Заголовка «Сегодня N из M» здесь НЕТ: в макете первая карточка идёт сразу под
          «Активностью дня», а счёт живёт в самих строках («4 из 15 выполнили»). Лишняя
          подпись только повторяла то, что и так написано в каждой строке. */}

      {/* Шапка дней недели над карточкой — только на «Привычках», как в макете: недели
          лежат под каждой строкой, и одна общая подпись сверху объясняет все семь колонок. */}
      {roomTab === "habits" && teamHabits.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "4px 12px 6px" }}>
          {["ВС", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"].map((n) => (
            <span key={n} style={{ fontSize: 12, color: "var(--text-3)", textAlign: "center", letterSpacing: "0.2px" }}>{n}</span>
          ))}
        </div>
      )}
      {/* ЗАДАЧИ идут группами по датам — заголовок даты, под ним карточка (кадр «Задачи»). */}
      {roomTab === "tasks" && taskGroups.length > 0 && (
        <React.Fragment>
          {taskGroups.sort((a, b) => b.ord - a.ord).map((g) => (
            <React.Fragment key={g.key}>
              <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.4px", color: "var(--text)", padding: "16px 4px 8px" }}>{g.label}</div>
              <div style={{ ...card, padding: "3px 12px" }}>{g.rows}</div>
            </React.Fragment>
          ))}
        </React.Fragment>
      )}

      {!(roomTab === "tasks" && taskGroups.length > 0) && (
      <div style={{ ...card, padding: "3px 12px" }}>
        {dayList.length ? dayList : (
          /* Пустое состояние — заголовок 20/590 из кадра «Пустое». */
          <div style={{ padding: "20px 6px 18px", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 590, lineHeight: "25px", letterSpacing: "-0.45px", color: "var(--text)" }}>Тут пока ничего нет</div>
            <div style={{ fontSize: 15, lineHeight: "20px", letterSpacing: "-0.23px", color: "var(--text-2)", marginTop: 4 }}>
              {roomTab !== "tasks"
                ? (_isOwner ? "Дай группе первую привычку — общий ритм начинается с неё." : "Ведущий ещё не добавил привычек — загляни позже.")
                : (_isOwner ? "Дело — разовый шаг: сделал, отметил, готово." : "Ведущий может дать группе разовое дело.")}
            </div>
          </div>
        )}
        {_isOwner && (
          <button onClick={() => openSheet(<CircleAddSheetLive isDark={isDark} onHabit={openAddHabit} onTask={() => openSheet(<CircleTaskComposeSheetLive isDark={isDark} onAdd={addTeamTaskCloud} />)} />)}
            className="tap" style={{ width: "100%", border: 0, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, padding: "11px 2px", borderTop: dayList.length ? "1px solid " + (isDark ? "rgba(255,255,255,0.06)" : "rgba(10,10,10,0.05)") : 0, color: "var(--text-3)" }}>
            <span style={{ width: 34, height: 34, borderRadius: 11, display: "grid", placeItems: "center", boxShadow: "inset 0 0 0 1.5px " + (isDark ? "rgba(255,255,255,0.14)" : "rgba(10,10,10,0.10)") }}><I.Plus size={16} strokeWidth={2.4} /></span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Привычка или дело</span>
          </button>
        )}
      </div>
      )}

      {/* Легенда цветов — в макете стоит под карточкой «Привычек» и расшифровывает кольца. */}
      {roomTab === "habits" && teamHabits.length > 0 && (
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", padding: "10px 4px 0" }}>
          {[["var(--accent-red)", "пропуск"], ["var(--accent-orange)", "не до конца"], ["var(--accent)", "выполнено"]].map(([c, l]) => (
            <span key={l} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--text-2)" }}>
              <span aria-hidden style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />{l}
            </span>
          ))}
        </div>
      )}

      {/* ВЫ ВЫПОЛНИЛИ — вторая карточка из макета. Заголовок 20/700, строки зачёркнуты,
          галочка синяя залитая. Пусто — секции нет. */}
      {doneList.length > 0 && (
        <React.Fragment>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.4px", color: "var(--text)", padding: "18px 4px 8px" }}>Вы выполнили</div>
          <div style={{ ...card, padding: "3px 12px" }}>{doneList}</div>
        </React.Fragment>
      )}

      {/* Подвал из макета — объясняет связь комнаты с Главной. */}
      <div style={{ padding: "12px 4px 0", fontSize: 13, lineHeight: 1.35, color: "var(--text-3)" }}>
        На главной странице отображаются задачи, привычки и цели, которые вы принимаете
      </div>

      {/* КОГДА ВСЁ НЕ ТАК (кадр 09): три состояния, в которых человек уходит навсегда, — в
          живом приложении ни одно не было оформлено, экран просто пустел. Ни одной фразы вины,
          сохранённый смысл и один понятный выход. Показываем только то, что правда сейчас. */}
      {_live && membersN === 1 && (
        <div style={{ ...card, padding: "15px 14px", marginTop: 10 }}>
          <div style={{ fontSize: 15.5, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.3px" }}>Пока в круге только ты</div>
          <div style={{ fontSize: 12.5, lineHeight: 1.45, color: "var(--text-3)", marginTop: 4 }}>Это нормально в первые дни. Круг оживает со вторым человеком — позови одного, с кем это правда по пути.</div>
          <button onClick={() => openSheet(<TeamShareSheetLive team={t} />)} className="tap"
            style={{ marginTop: 12, width: "100%", border: 0, borderRadius: 15, padding: "12px 14px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", background: isDark ? "#fff" : "#0a0a0a", color: isDark ? "#0a0a0a" : "#fff" }}>Позвать по ссылке</button>
        </div>
      )}
      {_live && membersN > 1 && quietDays >= 2 && (
        <div style={{ ...card, padding: "15px 14px", marginTop: 10 }}>
          <div style={{ fontSize: 15.5, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.3px" }}>{"В круге тихо " + quietDays + " " + bosRoomDaysWord(quietDays)}</div>
          <div style={{ fontSize: 12.5, lineHeight: 1.45, color: "var(--text-3)", marginTop: 4 }}>Так бывает у всех кругов. Обычно всё возвращается, когда отмечается один человек.</div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={() => { const h0 = teamHabits.filter((x) => !myDone(x))[0]; if (h0) { adoptedFor(h0) ? markAdopted(h0) : toggleMyTeamHabit(h0); } }} className="tap"
              disabled={!teamHabits.filter((x) => !myDone(x)).length}
              style={{ flex: 1, border: 0, borderRadius: 15, padding: "12px 10px", fontSize: 13, fontWeight: 700, cursor: "pointer", background: isDark ? "#fff" : "#0a0a0a", color: isDark ? "#0a0a0a" : "#fff", opacity: teamHabits.filter((x) => !myDone(x)).length ? 1 : 0.4 }}>Отметиться первым</button>
            <button onClick={() => setRoomTab("chat")} className="tap"
              style={{ border: 0, borderRadius: 15, padding: "12px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", background: isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)", color: "var(--text-2)" }}>Написать своим</button>
          </div>
        </div>
      )}
      {_live && membersN > 1 && quietDays < 2 && myGoneDays >= 3 && (
        <div style={{ ...card, padding: "15px 14px", marginTop: 10 }}>
          <div style={{ fontSize: 15.5, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.3px" }}>{"Тебя не было " + myGoneDays + " " + bosRoomDaysWord(myGoneDays)}</div>
          <div style={{ fontSize: 12.5, lineHeight: 1.45, color: "var(--text-3)", marginTop: 4 }}>
            {myMarksN > 0
              ? ("Серия сбросилась — но " + myMarksN + " отметок, которые ты уже принёс кругу, никуда не делись. Начать заново можно прямо сейчас.")
              : "Серия сбросилась — это не долг. Начать заново можно прямо сейчас, с одной отметки."}
          </div>
        </div>
      )}
      </div>)}

      {/* ЦЕЛИ — кадр «Группа / Участник / Цели» (1205:45515).

          Анатомия карточки взята из макета целиком: строка цели (значок 52, имя 17,
          «Для каждого · До чт, 13 авг», «15 участвуют», кружок справа) → блок СТАВКИ
          (серая плашка: слева «Ставка ⓘ», справа число; ниже «за завершение цели» и
          зелёный «+200XP») → блок ПРОГРЕССА («Осталось N», полоса, «200 / 20 000») →
          раскрывашка «— Стратегия ⌄» со вложенными привычками и делами.

          В ДАННЫХ у круга цель ОДНА (goalProg / t.target) — список целей не выдумываем.
          Верхние чипы «Все · Для каждого · Общие» из макета оставлены: они настоящие,
          просто пока фильтруют одну цель. */}
      {roomTab === "goals" && (<div key="tab-goals" className="fig-swap">
        {(() => {
          const hasGoal = gTgt > 0 || t.goal || stake > 0;
          const kind = goalType === "collective" ? "Общая" : "Для каждого";
          const shown = hasGoal && (goalFilter === "all"
            || (goalFilter === "each" && kind === "Для каждого")
            || (goalFilter === "common" && kind === "Общая"));
          const left = gTgt > 0 ? Math.max(0, gTgt - gCur) : 0;
          return (
            <React.Fragment>
              {/* Чипы-фильтры под сегментами — в макете отдельная строка. */}
              <div style={{ display: "flex", gap: 8, padding: "8px 2px 4px" }}>
                {[["all", "Все"], ["each", "Для каждого"], ["common", "Общие"]].map(([id, label]) => {
                  const on = goalFilter === id;
                  return (
                    <button key={id} onClick={() => setGoalFilter(id)} className="tap" data-haptic="selection"
                      style={{ border: 0, cursor: "pointer", borderRadius: 999, height: 32, padding: "0 14px",
                        fontSize: 15, fontWeight: on ? 590 : 400,
                        background: on ? "var(--cta)" : "transparent", color: on ? "var(--cta-ink)" : "var(--text-2)" }}>{label}</button>
                  );
                })}
              </div>

              {shown ? (
                <div style={{ ...card, padding: "4px 16px 14px" }}>
                  {/* Строка цели */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "12px 0 8px" }}>
                    <span style={{ width: 52, height: 52, borderRadius: 16, flexShrink: 0, display: "grid", placeItems: "center", fontSize: 26, overflow: "hidden",
                      background: heroTint + "26" }}>{bosIconOf(t, 26, null, "\ud83c\udfaf")}</span>
                    <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
                      <div style={{ fontSize: 17, lineHeight: "22px", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.goal || t.name}</div>
                      <div style={{ fontSize: 15, lineHeight: "20px", color: "var(--text-2)" }}>
                        {[kind, (t.date || t.deadline) ? ("До " + (t.date || t.deadline)) : "Бессрочная"].join(" \u00b7 ")}
                      </div>
                      {membersN > 0 && <div style={{ fontSize: 15, lineHeight: "20px", color: "var(--text-2)" }}>{membersN + " участвуют"}</div>}
                    </div>
                    <span aria-hidden style={{ width: 24, height: 24, marginTop: 14, borderRadius: "50%", flexShrink: 0,
                      boxShadow: "inset 0 0 0 1.5px " + (isDark ? "rgba(255,255,255,0.25)" : "rgba(10,10,10,0.18)") }} />
                  </div>

                  {/* СТАВКА — серая плашка из макета. Зелёным только начисление. */}
                  {stake > 0 && (
                    <div style={{ borderRadius: 12, padding: "10px 12px", background: "var(--surface-3)" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 17, color: "var(--text)" }}>
                          Ставка
                          <span onClick={openLevelSheet} className="tap" aria-label="Что такое ставка"
                            style={{ width: 17, height: 17, borderRadius: "50%", display: "inline-grid", placeItems: "center", cursor: "pointer",
                              boxShadow: "inset 0 0 0 1.2px var(--text-3)", fontSize: 11, color: "var(--text-3)" }}>i</span>
                        </span>
                        <span style={{ fontSize: 17, color: "var(--text)" }}>{stake + "XP"}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
                        <span style={{ fontSize: 15, color: "var(--text-2)" }}>за завершение цели</span>
                        <span style={{ fontSize: 15, color: "var(--accent)" }}>{"+ " + bank + "XP"}</span>
                      </div>
                    </div>
                  )}

                  {/* ПРОГРЕСС — «Осталось N», полоса, границы. Только когда цель числовая. */}
                  {gTgt > 0 && (
                    <div style={{ borderRadius: 12, padding: "10px 12px", background: "var(--surface-3)", marginTop: 10 }}>
                      <div style={{ fontSize: 17, color: "var(--text)" }}>{"Осталось " + left + (gUnit ? " " + gUnit : "")}</div>
                      <div style={{ height: 6, borderRadius: 999, background: isDark ? "rgba(255,255,255,0.12)" : "rgba(10,10,10,0.10)", overflow: "hidden", marginTop: 8 }}>
                        <div style={{ height: "100%", width: Math.max(0, Math.min(100, (gCur / gTgt) * 100)) + "%", background: "var(--accent)", borderRadius: 999, transition: "width .3s" }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 15, color: "var(--text-2)" }}>
                        <span>{gCur}</span><span>{gTgt}</span>
                      </div>
                    </div>
                  )}

                  {/* СТРАТЕГИЯ — раскрывашка со вложенными привычками и делами. */}
                  {(teamHabits.length > 0 || _teamTasks.length > 0) && (
                    <React.Fragment>
                      {strategyOpen && (
                        <div style={{ paddingTop: 6 }}>
                          {teamHabits.concat(_teamTasks.map((x) => ({ id: "t" + x.id, name: x.text, __task: true }))).map((x, i) => (
                            <div key={x.id || i} style={{ position: "relative", display: "flex", alignItems: "center", gap: 8, padding: "9px 0" }}>
                              {i > 0 && <span aria-hidden style={{ position: "absolute", top: 0, left: 40, right: 0, height: "0.5px", background: "var(--line-2)" }} />}
                              <span style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, display: "grid", placeItems: "center", fontSize: 17, overflow: "hidden", background: "var(--surface-3)" }}>
                                {x.__task ? <I.Flag size={16} strokeWidth={2} color="var(--text-2)" /> : bosIconOf(x, 17, x.color)}
                              </span>
                              <span style={{ flex: 1, minWidth: 0 }}>
                                <span style={{ display: "block", fontSize: 17, lineHeight: "22px", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{x.name}</span>
                                <span style={{ display: "block", fontSize: 15, lineHeight: "20px", color: "var(--text-2)" }}>{x.__task ? "Задача" : "Привычка"}</span>
                              </span>
                              <span aria-hidden style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                                boxShadow: "inset 0 0 0 1.5px " + (isDark ? "rgba(255,255,255,0.25)" : "rgba(10,10,10,0.18)") }} />
                            </div>
                          ))}
                        </div>
                      )}
                      <button onClick={() => setStrategyOpen(!strategyOpen)} className="tap" data-haptic="selection"
                        style={{ display: "flex", alignItems: "center", gap: 10, border: 0, background: "transparent", cursor: "pointer",
                          padding: "12px 0 2px", color: "var(--text-2)", fontSize: 17 }}>
                        <span aria-hidden style={{ width: 28, height: 1, background: "var(--line)" }} />
                        {strategyOpen ? "Скрыть" : "Стратегия"}
                        <I.ChevronRight size={16} style={{ transform: strategyOpen ? "rotate(-90deg)" : "rotate(90deg)", transition: "transform .2s" }} />
                      </button>
                    </React.Fragment>
                  )}
                </div>
              ) : (
                <div style={{ ...card, padding: "28px 20px", textAlign: "center" }}>
                  <div style={{ fontSize: 17, fontWeight: 590, color: "var(--text)" }}>
                    {hasGoal ? "В этом разрезе целей нет" : (_isOwner ? "У круга пока нет цели" : "Ведущий ещё не поставил цель")}
                  </div>
                  <div style={{ fontSize: 15, color: "var(--text-2)", marginTop: 4, lineHeight: 1.35 }}>
                    {hasGoal ? "Переключи фильтр наверху." : (_isOwner ? "Цель — то, куда круг идёт вместе, а привычки — шаги к ней." : "Когда появится — она будет здесь.")}
                  </div>
                  {!hasGoal && _isOwner && (
                    <button onClick={() => openSheet(<GoalFormSheetLive mode="edit" circleOn={true} navigate={navigate} returnTo={from} goal={editGoalLike} />)} className="tap"
                      style={{ marginTop: 16, border: 0, borderRadius: 999, padding: "13px 22px", fontSize: 17, fontWeight: 590, cursor: "pointer", background: "var(--cta)", color: "var(--cta-ink)" }}>Поставить цель</button>
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })()}
        <div style={{ padding: "12px 4px 0", fontSize: 13, lineHeight: 1.35, color: "var(--text-3)" }}>
          На главной странице отображаются задачи, привычки и цели, которые вы принимаете
        </div>
      </div>)}

      {/* ПУТЬ — читается сверху вниз одной историей: ГДЕ круг сейчас → КАК он держится →
          КАК шёл (календарь) → КТО как. Уровень живёт отдельной строкой: он валюта, а не
          статистика, и золото на экране одно. */}
      {roomTab === "path" && (<React.Fragment>

      {/* 1 · ГЛАВНОЕ ЧИСЛО КРУГА. Круг «на серии» — сколько дней он держится (это и есть его
          смысл: «круг держит сон до полуночи уже 14 дней»). Круг со счётом — сколько набрали
          вместе и сколько осталось. «0 из 14 дней» больше не показывается никогда: у серии
          цель не копится, она держится. */}
      <div style={{ ...card, padding: "15px 14px 13px", marginTop: 10 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 7, flexWrap: "wrap" }}>
          <span style={{ fontSize: 32, fontWeight: 800, color: "var(--text)", letterSpacing: "-1.3px", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{isCount ? gCur : streakCap}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-3)" }}>
            {isCount ? ("из " + gTgt + (gUnit ? " " + gUnit : "")) : (bosRoomDaysWord(circleStreak) + " круг держится вместе")}
          </span>
        </div>
        {isCount && (
          <div style={{ marginTop: 11 }}>
            <div style={{ height: 6, borderRadius: 999, background: isDark ? "rgba(255,255,255,0.09)" : "rgba(10,10,10,0.07)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: Math.max(2, Math.min(100, Math.round(100 * gCur / gTgt))) + "%", borderRadius: 999, background: bosAccentPaint(t.accent || null, isDark).solid }} />
            </div>
            <div style={{ fontSize: 10.5, color: "var(--text-4)", marginTop: 6 }}>{gDone ? "цель взята" : ("осталось " + (gTgt - gCur) + (gUnit ? " " + gUnit : ""))}</div>
          </div>
        )}
        {!isCount && circleStreak === 0 && (
          <div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 5, lineHeight: 1.4 }}>Серия начинается в день, когда весь круг в деле. Сегодня ещё можно.</div>
        )}
        {/* КРИВАЯ РОСТА — то, чего не хватало верхней части «Пути»: одно число говорит, где мы
            сейчас, а линия — как мы сюда пришли. Красится цветом круга (цвет = выбор человека),
            без золота: это факт, а не награда. */}
        {pathCurve && (
          <div style={{ marginTop: isCount ? 13 : 11 }}>
            <svg viewBox="0 0 317 52" preserveAspectRatio="none" style={{ display: "block", width: "100%", height: 52, overflow: "visible" }} aria-hidden>
              <path d={pathCurve.area} fill={bosAccentPaint(t.accent || null, isDark).solid} opacity={isDark ? 0.14 : 0.10} />
              <path d={pathCurve.d} fill="none" stroke={bosAccentPaint(t.accent || null, isDark).solid} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              <circle cx="317" cy={pathCurve.last.y} r="3.6" fill={bosAccentPaint(t.accent || null, isDark).solid} />
            </svg>
            <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 6, lineHeight: 1.45 }}>
              {pathCurve.total + (gUnit ? " " + gUnit : " " + bosRoomMarksWord(pathCurve.total)) + " вместе"}
              {myMarksN > 0 ? " · твоих из них " + myMarksN : ""}
            </div>
          </div>
        )}
        {/* Паспорт круга одной строкой: с какого дня вместе, сколько людей, открыт ли, банк. */}
        <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: pathCurve ? 4 : (isCount ? 9 : 6), lineHeight: 1.45 }}>
          {(t.createdAt ? "вместе с " + bosRoomDateWord(t.createdAt) : (subParts[0] || ""))}
          {subParts.length > 1 ? " · " + subParts.slice(1).join(" · ") : ""}
        </div>
      </div>

      {/* 1б · ТВОЯ НЕДЕЛЯ — одной строкой. Раньше здесь была карточка в две колонки, но её
          левая половина («N дней твоего вклада») теперь стоит подписью под кривой роста, и
          верх «Пути» дважды говорил одно и то же. Осталась неделя — единственный факт,
          которого в карточке счёта нет. */}
      {meId && (myDaysN > 0 || myMarksN > 0) && (
        <div style={{ ...card, padding: "11px 14px", marginTop: 9, display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.3px", flexShrink: 0 }}>{(wk7[meId] || 0) + " из 7"}</span>
          <span style={{ fontSize: 11.5, color: "var(--text-4)", minWidth: 0 }}>твоя неделя{teamHabits.length > 1 ? " · привычек в круге " + teamHabits.length : ""}</span>
        </div>
      )}

      {/* 2 · КАК ДЕРЖАТСЯ ЛЮДИ — уже не про круг целиком, а про тех, кто в нём. */}
      <BosRoomH2>Как держатся люди</BosRoomH2>
      <div style={{ ...card, padding: "13px 14px", display: "flex", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.6px", lineHeight: 1.1 }}>{keepPct + "%"}</div>
          <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 3 }}>держат ритм — 4+ дня за неделю</div>
        </div>
        <div style={{ width: 1, background: isDark ? "rgba(255,255,255,0.07)" : "rgba(10,10,10,0.06)" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.6px", lineHeight: 1.1 }}>{todayN + " из " + membersN}</div>
          <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 3 }}>в деле сегодня</div>
        </div>
      </div>

      {/* Мои залёты: тихо на 1-м, тревожно на 2-м; на 3-м человека тут уже нет. */}
      {myStrikes && myStrikes.miss > 0 && (
        <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginTop: 9, borderRadius: 14, padding: "9px 12px", background: myStrikes.miss >= 2 ? "rgba(224,54,43,0.09)" : "rgba(240,195,10,0.10)" }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: myStrikes.miss >= 2 ? "#C03428" : BOS_ROOM_GOLD_INK, flexShrink: 0 }}>{"Пропуск " + Math.min(myStrikes.miss, 3) + " из 3"}</span>
          <span style={{ fontSize: 10.5, color: "var(--text-4)", minWidth: 0 }}>{myStrikes.miss >= 2 ? "ещё один — и круг отпустит · отметка обнуляет" : "три подряд — выход из круга · отметка обнуляет"}</span>
        </div>
      )}

      {/* 3 · УРОВЕНЬ — одна строка и единственное золото на экране (валюта, не статистика). */}
      {circleLvl && (
        <button onClick={openLevelSheet} className="tap" data-haptic="selection"
          style={{ ...card, width: "100%", border: 0, cursor: "pointer", textAlign: "left", marginTop: 9, padding: "11px 13px", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ position: "relative", width: 38, height: 38, flexShrink: 0 }}>
            <svg viewBox="0 0 36 36" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
              <circle cx="18" cy="18" r="16" fill="none" stroke={isDark ? "rgba(255,255,255,0.13)" : "rgba(10,10,10,0.08)"} strokeWidth="2.8" />
              <circle cx="18" cy="18" r="16" fill="none" stroke={BOS_ROOM_GOLD} strokeWidth="2.8" strokeLinecap="round" strokeDasharray="100.5" strokeDashoffset={(100.5 * (1 - circleLvl.frac)).toFixed(1)} />
            </svg>
            <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 13, fontWeight: 800, color: "var(--text)" }}>{circleLvl.level}</span>
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>{circleLvl.level + " уровень круга"}</span>
            <span style={{ display: "block", fontSize: 11, color: "var(--text-4)", marginTop: 1 }}>
              {"до " + (circleLvl.level + 1) + "-го — " + circleLvl.toNext + " · сегодня +" + todayGain + " XP"}
              {rhythmToday ? " ×2" : ""}
            </span>
          </span>
          <I.ChevronRight size={16} color="var(--text-4)" />
        </button>
      )}

      {/* 4 · КАК ШЛИ — общий календарь приложения (месяц числами · год грядкой). */}
      {_live && (
        <React.Fragment>
          <BosRoomH2>Календарь круга</BosRoomH2>
          <div style={{ ...card, padding: "13px 13px 11px" }}>
            <BosFieldCalendarLive isDark={isDark} accent={t.accent || null}
              pctOf={(k) => { const n = Object.keys(yearByDay[k] || {}).length; return membersN ? Math.min(1, n / membersN) : 0; }} />
            {/* Подпись держит ОБА вида: год рисует клетками, месяц — кольцами. */}
            <div style={{ fontSize: 10.5, color: "var(--text-4)", marginTop: 9, lineHeight: 1.4 }}>
              Чем плотнее день, тем больше людей его закрыли.
              {fullDay ? " Последний полный круг — " + bosRoomDateWord(bosFieldDate(fullDay)) + "." : ""}
            </div>
          </div>
        </React.Fragment>
      )}

      {/* КАК ПРОШЛА НЕДЕЛЯ — тот же счёт, что раньше давал медали, но списком и про всех:
          круг видит себя целиком, а не только троих лучших. */}
      {membersN >= 2 && weekRows.some((x) => x.n > 0) && (
        <React.Fragment>
          <BosRoomH2 extra={<span style={{ fontSize: 10.5, color: "var(--text-4)" }}>дни за 7 дней</span>}>Как прошла неделя</BosRoomH2>
          <div style={{ ...card, padding: "5px 12px" }}>
            {weekRows.map((x, i) => (
              <button key={x.m.id} onClick={() => openPerson(x.m)} className="tap" style={{
                width: "100%", border: 0, background: "transparent", cursor: "pointer", textAlign: "left",
                display: "flex", alignItems: "center", gap: 11, padding: "9px 2px",
                borderTop: i ? ("1px solid " + (isDark ? "rgba(255,255,255,0.06)" : "rgba(10,10,10,0.05)")) : 0,
              }}>
                <BosRoomFaceLive p={x.m} size={30} active={!!activeSet[x.m.id]} level={levelOf(x.m.id)} isDark={isDark} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {x.m.id === meId ? "Ты" : (x.m.name || "Без имени")}
                  </span>
                  <span style={{ display: "block", fontSize: 10.5, color: "var(--text-4)", marginTop: 1 }}>
                    {x.n === 7 ? "ни одного пропуска" : (x.n === 0 ? "на этой неделе пусто" : "пропусков: " + (7 - x.n))}
                  </span>
                </span>
                <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, color: "var(--text-2)", fontVariantNumeric: "tabular-nums" }}>{x.n + " из 7"}</span>
              </button>
            ))}
          </div>
        </React.Fragment>
      )}
      </React.Fragment>)}

      {/* ЛЮДИ (v5, кадр 08): список, а не грид, — у каждого своя строка фактов: кто ведёт круг,
          кто когда пришёл, кто пропал. Ушедшему сразу дано действие, а не молчание. */}
      {roomTab === "people" && (<React.Fragment>
      <div style={{ ...card, padding: "5px 12px", marginTop: 10 }}>
        {membersRanked.map((m, i) => {
          const _sd = silentDays(m);
          const _gone = _sd >= 3 && !isNewbie(m);
          const parts = [];
          if (m.role === "owner") parts.push("ведёт круг");
          else if (m.joinedAt) parts.push("здесь с " + bosRoomDateWord(m.joinedAt));
          if (_gone) parts.push(lastByUser[m.id] ? "не отмечается с " + bosRoomDateWord(bosFieldDate(lastByUser[m.id])) : "отметок пока нет");
          else if (wk7[m.id]) parts.push(wk7[m.id] + " из 7 за неделю");
          else parts.push("на этой неделе пусто");
          const lv = levelOf(m.id);
          return (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 2px", borderTop: i ? ("1px solid " + (isDark ? "rgba(255,255,255,0.06)" : "rgba(10,10,10,0.05)")) : 0 }}>
              <button onClick={() => openPerson(m)} className="tap" style={{ display: "flex", alignItems: "center", gap: 11, flex: 1, minWidth: 0, border: 0, background: "transparent", padding: 0, textAlign: "left", cursor: "pointer" }}>
                <span style={{ opacity: _gone ? 0.5 : 1, lineHeight: 0, flexShrink: 0 }}>
                  <BosRoomFaceLive p={m} size={36} active={!!activeSet[m.id]} gold={m.id === meId && !!activeSet[m.id]} level={lv} isDark={isDark} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14, fontWeight: 650, color: _gone ? "var(--text-3)" : "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {m.id === meId ? "Ты" : (m.name || "Участник")}
                  </span>
                  <span style={{ display: "block", fontSize: 10.5, color: "var(--text-4)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{parts.join(" · ")}</span>
                </span>
              </button>
              {_gone && m.id !== meId && (
                <button onClick={() => { setText("@" + (m.name || "") + ", "); setRoomTab("chat"); }} className="tap"
                  style={{ flexShrink: 0, border: 0, borderRadius: 999, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", background: isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)", color: "var(--text-2)" }}>позвать</button>
              )}
            </div>
          );
        })}
        <button onClick={() => openSheet(<TeamShareSheetLive team={t} />)} className="tap"
          style={{ width: "100%", border: 0, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 11, padding: "11px 2px", borderTop: "1px solid " + (isDark ? "rgba(255,255,255,0.06)" : "rgba(10,10,10,0.05)"), color: "var(--text-3)" }}>
          <span style={{ width: 36, height: 36, borderRadius: "50%", display: "grid", placeItems: "center", boxShadow: "inset 0 0 0 1.5px " + (isDark ? "rgba(255,255,255,0.14)" : "rgba(10,10,10,0.10)") }}><I.Plus size={16} strokeWidth={2.4} /></span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Позвать в круг</span>
        </button>
      </div>
      </React.Fragment>)}

      {roomTab === "chat" && (<React.Fragment>
      {/* Имя круга больше не дублируется: оно живёт в шапке-пилюле и видно на всех вкладках. */}
      {/* Тебя подбодрили — и кто. */}
      {cheeredMe.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "7px 0 9px", borderRadius: 14, padding: "8px 11px", background: "rgba(240,195,10,0.10)" }}>
          <I.Flame size={14} color={BOS_ROOM_GOLD} filled strokeWidth={1.6} />
          <span style={{ flex: 1, fontSize: 11.5, fontWeight: 700, color: BOS_ROOM_GOLD_INK }}>Тебя подбодрили — {cheeredMe.length} {bosRoomPeopleWord(cheeredMe.length)}</span>
          <button onClick={() => openSheet(<CircleWhoSheetLive people={cheeredMe.map((u) => rosterById[u]).filter(Boolean)} />)} className="tap"
            style={{ border: 0, borderRadius: 999, padding: "4px 10px", fontSize: 10.5, fontWeight: 700, cursor: "pointer", background: "var(--card)", color: "var(--text-2)" }}>кто?</button>
        </div>
      )}

      {/* ЧАТ-БОКС: лента скроллится ВНУТРИ и открыта на свежем. С v5 композер уехал из коробки
          в закреплённую строку внизу комнаты — она одна на все четыре вкладки. */}
      {/* Чат занимает ОГРАНИЧЕННУЮ высоту экрана, лента скроллится внутри, композер приклеен к её
          дну: страница под ним не едет (David 2026-08-02: «как раньше в чате было удобнее»). */}
      <div style={{ ...card, overflow: "hidden", marginTop: cheeredMe.length > 0 ? 0 : 10 }}>
      <div ref={feedBoxRef} className="screen-scroll" style={{ height: "calc(100vh - " + (cheeredMe.length > 0 ? 366 : 324) + "px)", minHeight: 320, overflowY: "auto", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain", padding: "12px 12px 4px", display: "flex", flexDirection: "column" }}>
      {feedCut && <div style={{ textAlign: "center", fontSize: 10, color: "var(--text-5, var(--text-4))", margin: "0 0 8px", flexShrink: 0 }}>показаны последние события</div>}
      {feedShown.length === 0 && !hasMiles ? (
        <div style={{ textAlign: "center", padding: "0 24px", margin: "auto" }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-2)", marginBottom: 3 }}>Пока тихо</div>
          <div style={{ fontSize: 12, lineHeight: 1.5, color: "var(--text-4)" }}>Отметь дело дня или напиши кругу — с этого начинается разговор</div>
        </div>
      ) : feedShown.map((f) => {
        if (f.k === "msg") {
          const m = f.m;
          return m.me ? (
            <div key={f.key} style={{ display: "flex", justifyContent: "flex-end", marginBottom: 9 }}>
              <div style={{ maxWidth: "78%", background: isDark ? "#fff" : "#0a0a0a", color: isDark ? "#0a0a0a" : "#fff", borderRadius: "16px 16px 5px 16px", padding: m.img ? 7 : "8px 12px" }}>
                {m.img ? <img src={m.img} alt="" loading="lazy" onLoad={_feedImgLoaded} onClick={() => setPhotoView(m.img)} style={{ width: 180, maxWidth: "100%", maxHeight: 230, objectFit: "cover", borderRadius: 12, display: "block", cursor: "zoom-in" }} /> : <div style={{ fontSize: 13.5, lineHeight: 1.4 }}>{m.t}</div>}
                <div style={{ fontSize: 9.5, opacity: 0.55, textAlign: "right", marginTop: 2 }}>{m.time}</div>
              </div>
            </div>
          ) : (
            <div key={f.key} style={{ display: "flex", gap: 8, marginBottom: 9, alignItems: "flex-end" }}>
              {(() => { const p = rosterById[m._uid]; return p ? <BosRoomFaceLive p={p} size={24} isDark={isDark} onClick={() => openPerson(p)} /> : <BuddyFaceLive avatar={m.avatar} name={m.who} size={24} />; })()}
              <div style={{ maxWidth: "78%" }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: "var(--text-4)", margin: "0 0 2px 4px" }}>{m.who + " · " + (m.time || "")}</div>
                <div style={{ background: bubbleOther, borderRadius: "16px 16px 16px 5px", padding: m.img ? 7 : "8px 12px", boxShadow: isDark ? "none" : "0 1px 2px rgba(0,0,0,0.05)" }}>
                  {m.img ? <img src={m.img} alt="" loading="lazy" onLoad={_feedImgLoaded} onClick={() => setPhotoView(m.img)} style={{ width: 180, maxWidth: "100%", maxHeight: 230, objectFit: "cover", borderRadius: 12, display: "block", cursor: "zoom-in" }} /> : <div style={{ fontSize: 13.5, lineHeight: 1.4, color: "var(--text)" }}>{m.t}</div>}
                </div>
              </div>
            </div>
          );
        }
        if (f.k === "pack") return (
          <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9, background: isDark ? "rgba(255,255,255,0.05)" : "var(--surface-3)", borderRadius: 14, padding: "8px 11px" }}>
            <span style={{ fontSize: 15, lineHeight: 1 }}>{bosIconOf(f.hb, 15, f.hb.color)}</span>
            <div style={{ flex: 1, fontSize: 11.5, fontWeight: 600, color: "var(--text-2)" }}>{"+" + f.n + " закрыли «" + f.hb.name + "» к " + f.hourEnd + ":00"}</div>
            <span style={{ display: "flex" }}>
              {f.faces.map((p, k) => <span key={k} style={{ marginLeft: k ? -6 : 0, borderRadius: "50%", boxShadow: "0 0 0 2px " + (isDark ? "#1c1c20" : "#fff"), lineHeight: 0 }}><BuddyFaceLive avatar={p.avatar} name={p.name} size={18} /></span>)}
            </span>
          </div>
        );
        // отметка человека (маленький круг): лицо → имя закрыл(а) «X» · время · 🔥
        return (
          <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
            <BosRoomFaceLive p={f.p} size={24} isDark={isDark} onClick={() => openPerson(f.p)} />
            <div style={{ flex: 1, minWidth: 0, fontSize: 12, color: "var(--text-2)" }}>
              <b style={{ color: "var(--text)", fontWeight: 700 }}>{f.p.name + " "}</b>
              {"закрыл(а) «" + f.hb.name + "»"}
              <span style={{ color: "var(--text-4)" }}>{f.at ? " · " + bosRoomHHMM(f.at) : " · только что"}</span>
            </div>
            {cheersOn && f.p.id !== meId && (
              <button onClick={() => sendCheer(f.p.id)} className="tap" aria-label={"Подбодрить " + f.p.name}
                style={{ display: "inline-flex", alignItems: "center", border: 0, borderRadius: 999, padding: "4px 9px", cursor: "pointer", background: myCheered[f.p.id] ? "rgba(240,195,10,0.14)" : (isDark ? "rgba(255,255,255,0.07)" : "var(--surface-3)") }}>
                <I.Flame size={12} color={myCheered[f.p.id] ? BOS_ROOM_GOLD : "var(--text-4)"} filled={!!myCheered[f.p.id]} strokeWidth={2} />
              </button>
            )}
          </div>
        );
      })}

      {/* ВЕХИ — золотые строки в конце ленты (банк/цель — тонко, решение David). */}
      {ageDays && MILES.indexOf(ageDays) >= 0 && <CircleMileLine>{"Кругу " + ageDays + " дней 💛"}</CircleMileLine>}
      {gTgt > 0 && gCur > 0 && (
        <CircleMileLine>{gDone ? ("🎉 Цель достигнута — " + gCur + (gUnit ? " " + gUnit : "")) : ("Круг набрал " + gCur + " из " + gTgt + (gUnit ? " " + gUnit : "") + " 💛")}</CircleMileLine>
      )}
      </div>

      {/* КОМПОЗЕР — на дне чат-коробки, как в мессенджере (David 2026-08-02: закреплённая внизу
          строка «Написать кругу» на всех вкладках не нужна — для разговора есть своя вкладка,
          а бегущая за экраном строка неудобна). Скролл живёт ВНУТРИ ленты. */}
      <div style={{ display: "flex", gap: 7, alignItems: "center", padding: "9px 10px", borderTop: "1px solid " + (isDark ? "rgba(255,255,255,0.07)" : "rgba(10,10,10,0.06)") }}>
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
        <button onClick={() => { if (fileRef.current) fileRef.current.click(); }} className="tap" aria-label="Прикрепить фото"
          style={{ width: 36, height: 36, borderRadius: "50%", border: 0, cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0, color: "var(--text-2)", background: isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.6" /><path d="M21 15l-5-5L5 21" /></svg>
        </button>
        <input ref={composerRef} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }} placeholder="Написать кругу…"
          onFocus={() => setTimeout(() => { try { composerRef.current && composerRef.current.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (e) {} }, 250)}
          style={{ flex: 1, minWidth: 0, ...bosChipGlass(isDark), border: 0, outline: 0, borderRadius: 999, padding: "10px 15px", fontSize: 15, color: "var(--text)" }} />
        <button onClick={send} className="tap" aria-label="Отправить"
          style={{ width: 36, height: 36, borderRadius: "50%", border: 0, cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0, background: text.trim() ? (isDark ? "#fff" : "#0a0a0a") : (isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)"), transition: "background .2s" }}>
          <I.Send size={15} color={text.trim() ? (isDark ? "#0a0a0a" : "#fff") : "var(--text-4)"} strokeWidth={2.2} />
        </button>
      </div>
      </div>
      </React.Fragment>)}

      {/* ПРОСМОТР ФОТО — на весь экран, поверх всего; тап в любом месте закрывает. */}
      {photoView && (
        <div onClick={() => setPhotoView(null)} style={{ position: "fixed", inset: 0, zIndex: 9200, background: "rgba(4,4,6,0.93)", WebkitBackdropFilter: "blur(6px)", backdropFilter: "blur(6px)", display: "grid", placeItems: "center", animation: "dimIn .16s ease both", cursor: "zoom-out" }}>
          <img src={photoView} alt="" style={{ maxWidth: "96vw", maxHeight: "90vh", objectFit: "contain", borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }} />
          <button onClick={() => setPhotoView(null)} className="tap" aria-label="Закрыть"
            style={{ position: "absolute", top: "calc(env(safe-area-inset-top, 0px) + 14px)", right: 14, width: 38, height: 38, borderRadius: "50%", border: 0, cursor: "pointer", display: "grid", placeItems: "center", background: "rgba(255,255,255,0.16)", color: "#fff" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════ КАРТОЧКА ЧЕЛОВЕКА (кадр 3) ══════════════════
   Те же данные, что видит ведущий, — ничего беднее и ничего больше: одна неделя по каждой
   привычке (David: «недели вполне хватает»), месяц кольцами, УРОВЕНЬ (David 2026-07-16),
   🔥 подбодрить и 💬 написать. Видно только то, что человек делает В ЭТОМ круге. */
function CirclePersonSheetLive({ team, person, meId, habits, rangeRows, dayRows, cheersOn, cheered, onCheer, onWrite, isDark }) {
  const { close } = useSheet();
  const me = person.id === meId;
  const [level, setLevel] = React.useState(null);
  React.useEffect(() => {
    let on = true;
    if (window.bosCloud && window.bosCloud.profilesPublic) {
      window.bosCloud.profilesPublic([person.id]).then((map) => {
        if (on && map && map[person.id] && (map[person.id].level | 0) > 0) setLevel(map[person.id].level | 0);
      }).catch(() => {});
    }
    return () => { on = false; };
  }, [person.id]);
  const [didCheer, setDidCheer] = React.useState(!!cheered);

  const mine = (rangeRows || []).filter((r) => r.u === person.id);
  const mineDays = {}; mine.forEach((r) => { (mineDays[r.day] = mineDays[r.day] || {})[r.h] = true; });
  // Серия: подряд-дни с хотя бы одной отметкой (окно 31 день — дальше честно «31+»).
  let streak = 0;
  {
    let start = mineDays[bosRoomDayKey(0)] ? 0 : 1;
    for (let i = start; i < 31; i++) { if (mineDays[bosRoomDayKey(i)]) streak++; else break; }
  }
  const todayMine = (dayRows || []).filter((r) => r.u === person.id);
  const firstAt = todayMine.length ? todayMine.reduce((a, b) => (a.at < b.at ? a : b)).at : null;
  const weekKeys = []; for (let i = 6; i >= 0; i--) weekKeys.push(bosRoomDayKey(i));
  // «в круге с …»
  const since = person.joinedAt ? new Date(person.joinedAt) : null;
  const MONTHS_RU = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
  const sinceTxt = since ? ("в круге с " + since.getDate() + " " + MONTHS_RU[since.getMonth()]) : null;
  // Месяц кольцами: доля привычек круга, закрытых человеком в тот день.
  const now = new Date();
  const dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthName = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"][now.getMonth()];
  const hN = Math.max(1, (habits || []).length);
  const dayPct = (d) => {
    const k = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
    return Object.keys(mineDays[k] || {}).length / hN;
  };
  const chips = todayMine.slice().sort((a, b) => (a.at < b.at ? -1 : 1)).map((r) => {
    const hb = (habits || []).find((h) => h.id === r.h);
    return hb ? { icon: bosIconOf(hb, 12, hb.color), at: bosRoomHHMM(r.at) } : null;
  }).filter(Boolean);

  return (
    <div style={{ padding: "2px 2px 8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <BosRoomFaceLive p={person} size={44} gold={!!firstAt || me} isDark={isDark} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{me ? "Ты" : person.name}</span>
            {level != null && <span style={{ fontSize: 10, fontWeight: 800, color: BOS_ROOM_GOLD_INK, background: "rgba(240,195,10,0.14)", borderRadius: 999, padding: "3px 8px", flexShrink: 0 }}>{"ур. " + level}</span>}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 1, display: "flex", alignItems: "center", gap: 4, overflow: "hidden", whiteSpace: "nowrap" }}>
            {streak > 0 && <I.Flame size={10} color={BOS_ROOM_GOLD} filled strokeWidth={1.6} />}
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
              {(streak > 0 ? ("серия " + (streak >= 31 ? "31+" : streak)) : (firstAt ? "" : "сегодня ещё не в деле")) + (streak > 0 && sinceTxt ? " · " : "") + (sinceTxt || "")}
            </span>
          </div>
        </div>
        {!me && cheersOn && (
          <button onClick={() => { setDidCheer(true); onCheer && onCheer(); }} className="tap" aria-label="Подбодрить"
            style={{ width: 34, height: 34, borderRadius: "50%", border: 0, cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0, background: didCheer ? "rgba(240,195,10,0.16)" : (isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)") }}>
            <I.Flame size={15} color={didCheer ? BOS_ROOM_GOLD : "var(--text-2)"} filled={didCheer} strokeWidth={2} />
          </button>
        )}
        {!me && onWrite && (
          <button onClick={() => { close(); onWrite(person.name); }} className="tap" aria-label="Написать"
            style={{ width: 34, height: 34, borderRadius: "50%", border: 0, cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0, background: isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)" }}>
            <I.MessageCircle size={15} color="var(--text-2)" strokeWidth={2} />
          </button>
        )}
      </div>

      {firstAt && (
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 10 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: BOS_ROOM_GOLD_INK, background: "rgba(240,195,10,0.14)", borderRadius: 999, padding: "3px 9px" }}>
            <I.Clock size={11} color={BOS_ROOM_GOLD} strokeWidth={2} />{"сегодня с " + bosRoomHHMM(firstAt)}
          </span>
          {chips.slice(0, 3).map((c, i) => (
            <span key={i} style={{ ...bosChipGlass(isDark), display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "var(--text-2)", borderRadius: 999, padding: "3px 9px" }}>{c.icon}{c.at}</span>
          ))}
        </div>
      )}

      <BosRoomH2 extra={<span style={{ fontSize: 10.5, color: "var(--text-4)" }}>по каждой привычке</span>}>{me ? "Твоя неделя" : "Неделя"}</BosRoomH2>
      <div style={{ background: "var(--card)", borderRadius: 18, boxShadow: "var(--card-shadow)", padding: "9px 14px" }}>
        {(habits || []).length ? (habits || []).map((h, i) => (
          <div key={h.id || i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 0", borderTop: i ? "1px solid " + (isDark ? "rgba(255,255,255,0.05)" : "rgba(10,10,10,0.04)") : 0 }}>
            <span style={{ fontSize: 13, width: 22, textAlign: "center", flexShrink: 0 }}>{bosIconOf(h, 15, h.color)}</span>
            <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.name}</span>
            <span style={{ display: "inline-flex", gap: 3, flexShrink: 0 }}>
              {weekKeys.map((k, j) => <span key={j} style={{ width: 5.5, height: 5.5, borderRadius: "50%", background: (mineDays[k] && mineDays[k][h.id]) ? BOS_ROOM_GOLD : (isDark ? "rgba(255,255,255,0.14)" : "rgba(10,10,10,0.12)") }} />)}
            </span>
          </div>
        )) : <div style={{ fontSize: 12, color: "var(--text-4)", padding: "10px 2px" }}>В круге пока нет общих привычек</div>}
      </div>

      <BosRoomH2 extra={<span style={{ fontSize: 10.5, color: "var(--text-4)" }}>золото = доля дел дня</span>}>{monthName}</BosRoomH2>
      <div style={{ background: "var(--card)", borderRadius: 18, boxShadow: "var(--card-shadow)", padding: "13px 14px" }}>
        {/* СТАНДАРТ календаря (David 2026-07-22): золото = наполненность, «сегодня» — серая заливка. */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 5, justifyItems: "center" }}>
          {Array.from({ length: dim }).map((_, i) => {
            const _tdy = i + 1 === now.getDate();
            const _fut = i + 1 > now.getDate();
            const _pct = _fut ? 0 : dayPct(i + 1);
            return (
              <span key={i} style={{ position: "relative", width: 26, height: 26, display: "grid", placeItems: "center", opacity: _fut ? 0.35 : 1 }}>
                <span style={{ position: "absolute", inset: 0 }}>{bosDayRing(_pct, BOS_ROOM_GOLD, isDark, { sw: 3.4, gold: true, today: _tdy })}</span>
                <span style={{ fontSize: 8, fontWeight: _tdy ? 800 : 700, color: _pct >= 1 ? "#6b4e00" : (_tdy ? "var(--text)" : "var(--text-4)"), position: "relative" }}>{i + 1}</span>
              </span>
            );
          })}
        </div>
      </div>

      <div style={{ fontSize: 9.5, color: "var(--text-4)", padding: "8px 4px 0", lineHeight: 1.4 }}>
        Видно только то, что человек делает в этом круге. Участник и ведущий видят одно и то же.
      </div>
    </div>
  );
}

/* ══════════════════ КАБИНЕТ ВЕДУЩЕГО (макет К) ══════════════════
   Утро ведущего за 30 секунд: цифры дня → здоровье программы → удержание → журнал по тревоге.
   Прозрачность вместо слежки: тут нет ничего, чего участник не видит о себе сам. */
function CircleCabinetLive() {
  const { navigate, params } = useNav();
  const app = useApp();
  const { open: openSheet } = useSheet();
  const t = params?.team || {};
  const from = params?.from || "community";
  const isDark = app?.themeOverride === "dark";
  const _live = !!(window.bosCloud && window.bosCloud.enabled() && t.cloudId);

  const [meId, setMeId] = React.useState(null);
  const [roster, setRoster] = React.useState(() => _bosTeamGet("roster:" + t.cloudId) || []);
  const [habits, setHabits] = React.useState(() => _bosTeamGet("habits:" + t.cloudId) || []);
  const [rangeS, setRangeS] = React.useState(() => _bosTeamGet("range31:" + t.cloudId));
  const [dayFeedS, setDayFeedS] = React.useState(() => _bosTeamGet("dayfeed:" + t.cloudId));
  const [cheers, setCheers] = React.useState(() => _bosTeamGet("cheers:" + t.cloudId));
  const [pending, setPending] = React.useState([]);
  React.useEffect(() => {
    if (!_live) return;
    let on = true;
    window.bosCloud.uid().then((id) => { if (on) setMeId(id || null); });
    window.bosCloud.teamMembers(t.cloudId).then((mem) => { if (on && Array.isArray(mem)) setRoster(_bosTeamPut("roster:" + t.cloudId, mem.map((m) => ({ id: m.id, name: m.name || "Участник", avatar: m.avatar, role: m.role, joinedAt: m.joinedAt || null })))); });
    window.bosCloud.teamHabitsFull(t.cloudId).then((hs) => { if (on && Array.isArray(hs)) setHabits(_bosTeamPut("habits:" + t.cloudId, hs)); });
    window.bosCloud.teamLogsRange(t.cloudId, 31).then((d) => { if (on && d) setRangeS(_bosTeamPut("range31:" + t.cloudId, d)); });
    window.bosCloud.teamDayFeed(t.cloudId).then((d) => { if (on && d) setDayFeedS(_bosTeamPut("dayfeed:" + t.cloudId, d)); });
    if (window.bosCloud.teamCheersToday) window.bosCloud.teamCheersToday(t.cloudId).then((d) => { if (on && d) setCheers(_bosTeamPut("cheers:" + t.cloudId, d)); });
    if (window.bosCloud.pendingRequests) window.bosCloud.pendingRequests(t.cloudId).then((p) => { if (on) setPending(Array.isArray(p) ? p : []); }).catch(() => {});
    return () => { on = false; };
  }, [_live, t.cloudId]);
  const approveReq = (uid) => { window.bosCloud.approveMember(t.cloudId, uid).then((ok) => { if (ok) setPending((p) => p.filter((x) => x.id !== uid)); }); };
  const rejectReq = (uid) => { window.bosCloud.rejectMember(t.cloudId, uid).then((ok) => { if (ok) setPending((p) => p.filter((x) => x.id !== uid)); }); };

  const rows = (rangeS && rangeS.rows) || [];
  const dayRows = (dayFeedS && dayFeedS.rows) || [];
  const members = (roster || []).filter((m) => m.role !== "pending");
  const N = members.length;
  const cheersOn = !!(cheers && Array.isArray(cheers.rows));
  const myCheered = {}; if (cheersOn && meId) cheers.rows.forEach((r) => { if (r.from === meId) myCheered[r.to] = true; });
  const sendCheer = (toId) => { if (!cheersOn || myCheered[toId] || toId === meId) return; setCheers((c) => c ? { ...c, rows: c.rows.concat([{ from: meId, to: toId, at: new Date().toISOString() }]) } : c); window.bosCloud.sendTeamCheer(t.cloudId, toId); if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} } };

  const byUserDays = {}; rows.forEach((r) => { ((byUserDays[r.u] = byUserDays[r.u] || {})[r.day] = byUserDays[r.u][r.day] || {})[r.h] = true; });
  const todaySet = {}; dayRows.forEach((r) => { todaySet[r.u] = true; });
  const todayN = Object.keys(todaySet).filter((u) => members.some((m) => m.id === u)).length;

  const silentDays = (m) => {
    const dd = byUserDays[m.id]; if (!dd) return 31;
    for (let i = 0; i < 31; i++) if (dd[bosRoomDayKey(i)]) return i;
    return 31;
  };
  const streakOf = (m) => {
    const dd = byUserDays[m.id] || {};
    let s = 0, start = dd[bosRoomDayKey(0)] ? 0 : 1;
    for (let i = start; i < 31; i++) { if (dd[bosRoomDayKey(i)]) s++; else break; }
    return s;
  };
  const isNewbie = (m) => m.joinedAt && (Date.now() - new Date(m.joinedAt).getTime()) < 3 * 86400000;
  const wards = members.filter((m) => m.id !== meId).map((m) => ({ m, silent: silentDays(m), streak: streakOf(m), nb: isNewbie(m), today: !!todaySet[m.id] }));
  const RED = wards.filter((w) => !w.nb && w.silent >= 3);
  const YEL = wards.filter((w) => !w.nb && w.silent > 0 && w.silent < 3);
  const NEW = wards.filter((w) => w.nb);
  const OK = wards.filter((w) => !w.nb && w.silent === 0);

  // Здоровье программы: доля закрытий за 7 дней и сдвиг к прошлой неделе.
  const week = (off) => { const ks = {}; for (let i = off; i < off + 7; i++) ks[bosRoomDayKey(i)] = true; return ks; };
  const wNow = week(0), wPrev = week(7);
  const health = (habits || []).map((h) => {
    let a = 0, b = 0;
    rows.forEach((r) => { if (r.h !== h.id) return; if (wNow[r.day]) a++; else if (wPrev[r.day]) b++; });
    const cap = Math.max(1, N * 7);
    const pct = Math.round((a / cap) * 100), prev = Math.round((b / cap) * 100);
    return { h, pct, delta: pct - prev };
  });
  // Удержание: доля участников с ≥1 отметкой в каждую из 4 недель.
  const reten = [3, 2, 1, 0].map((wk) => {
    const ks = week(wk * 7);
    const act = members.filter((m) => { const dd = byUserDays[m.id]; return dd && Object.keys(dd).some((k) => ks[k]); }).length;
    return N ? Math.round((act / N) * 100) : 0;
  });

  const [sortBy, setSortBy] = React.useState("alarm");
  const [q, setQ] = React.useState("");
  const [openId, setOpenId] = React.useState(null);
  const [showAll, setShowAll] = React.useState(false);
  const sorted = wards.slice().sort((a, b) => {
    if (sortBy === "streak") return b.streak - a.streak;
    if (sortBy === "name") return (a.m.name || "").localeCompare(b.m.name || "", "ru");
    if (sortBy === "old") return b.silent - a.silent;
    return (b.silent - a.silent) || (a.today === b.today ? 0 : a.today ? 1 : -1);
  }).filter((w) => !q.trim() || (w.m.name || "").toLowerCase().includes(q.trim().toLowerCase()));

  const card = { background: "var(--card)", borderRadius: 20, boxShadow: "var(--card-shadow)" };
  const weekKeys = []; for (let i = 6; i >= 0; i--) weekKeys.push(bosRoomDayKey(i));
  // «Написать» из кабинета = комната с готовым «@Имя » в композере (лички в приложении нет).
  const writeTo = (m) => navigate("team-detail", { team: t, from: from, prefill: "@" + ((m.name || "").split(" ")[0] || "друг") + " " });
  const openPerson = (m) => navigate("team-person", { team: t, person: m, from: from, backRoute: "team-cabinet", backParams: { team: t, from: from } });

  const wardRow = (w) => {
    const open = openId === w.m.id;
    const risk = w.silent >= 3 && !w.nb ? ["#E0362B", "молчит " + (w.silent >= 31 ? "31+" : w.silent) + " дн"]
      : w.silent > 0 && !w.nb ? [BOS_ROOM_GOLD_INK, "пропустил(а) " + w.silent + " дн"]
      : w.nb ? [BOS_ROOM_GOLD_INK, "новичок — хрупкое окно"]
      : [null, w.today ? "сегодня ✓" : "сегодня ещё нет"];
    const dd = byUserDays[w.m.id] || {};
    return (
      <div key={w.m.id} style={{ ...card, marginBottom: 7, padding: "10px 12px", boxShadow: w.silent >= 3 && !w.nb ? "var(--card-shadow), inset 0 0 0 1px rgba(224,54,43,0.25)" : "var(--card-shadow)" }}>
        <div onClick={() => setOpenId(open ? null : w.m.id)} style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }}>
          <BosRoomFaceLive p={w.m} size={28} active={w.today} isDark={isDark} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.m.name}</div>
            <div style={{ fontSize: 9.5, color: risk[0] || "var(--text-4)", fontWeight: risk[0] ? 700 : 400 }}>{risk[1]}</div>
          </div>
          <span style={{ display: "inline-flex", gap: 3, flexShrink: 0 }}>
            {weekKeys.map((k, j) => <span key={j} style={{ width: 5, height: 5, borderRadius: "50%", background: dd[k] ? BOS_ROOM_GOLD : (isDark ? "rgba(255,255,255,0.14)" : "rgba(10,10,10,0.12)") }} />)}
          </span>
          {w.streak > 0 && <span style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: 10.5, fontWeight: 800, color: BOS_ROOM_GOLD_INK, flexShrink: 0 }}><I.Flame size={10} color={BOS_ROOM_GOLD} filled strokeWidth={1.6} />{w.streak >= 31 ? "31+" : w.streak}</span>}
          {cheersOn && (
            <button onClick={(e) => { e.stopPropagation(); sendCheer(w.m.id); }} className="tap" aria-label="Подбодрить"
              style={{ width: 28, height: 28, borderRadius: "50%", border: 0, cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0, background: myCheered[w.m.id] ? "rgba(240,195,10,0.16)" : (isDark ? "rgba(255,255,255,0.07)" : "var(--surface-3)") }}>
              <I.Flame size={12} color={myCheered[w.m.id] ? BOS_ROOM_GOLD : "var(--text-3)"} filled={!!myCheered[w.m.id]} strokeWidth={2} />
            </button>
          )}
          <I.ChevronRight size={12} color="var(--text-4)" style={{ transform: open ? "rotate(90deg)" : "none", flexShrink: 0 }} />
        </div>
        {open && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid " + (isDark ? "rgba(255,255,255,0.07)" : "rgba(10,10,10,0.06)") }}>
            {(habits || []).map((h, i) => (
              <div key={h.id || i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 12, width: 20, textAlign: "center" }}>{bosIconOf(h, 14, h.color)}</span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 11, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.name}</span>
                <span style={{ display: "inline-flex", gap: 2.5 }}>
                  {weekKeys.map((k, j) => <span key={j} style={{ width: 4.5, height: 4.5, borderRadius: "50%", background: (dd[k] && dd[k][h.id]) ? BOS_ROOM_GOLD : (isDark ? "rgba(255,255,255,0.14)" : "rgba(10,10,10,0.12)") }} />)}
                </span>
              </div>
            ))}
            <div style={{ display: "flex", gap: 7, marginTop: 6 }}>
              <button onClick={() => writeTo(w.m)} className="tap" style={{ flex: 1, border: 0, borderRadius: 999, padding: "8px 0", fontSize: 11.5, fontWeight: 700, cursor: "pointer", background: isDark ? "#fff" : "#0a0a0a", color: isDark ? "#0a0a0a" : "#fff" }}>Написать</button>
              <button onClick={() => openPerson(w.m)} className="tap" style={{ flex: 1, border: 0, borderRadius: 999, padding: "8px 0", fontSize: 11.5, fontWeight: 700, cursor: "pointer", background: isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)", color: "var(--text)" }}>Карточка</button>
            </div>
          </div>
        )}
      </div>
    );
  };
  const secTitle = (color, txt) => <div style={{ margin: "10px 0 6px", fontSize: 10, fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase", color: color }}>{txt}</div>;
  const _inTG = (typeof window !== "undefined" && window.__TG);
  const W = 300, H = 54;
  const rx = (i) => 10 + i * (W - 20) / 3, ry = (v) => H - 6 - Math.max(0, (v - 40)) / 60 * (H - 14);
  const retPath = reten.map((v, i) => (i ? "L" : "M") + rx(i) + " " + ry(v)).join(" ");

  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "2px 0 4px", minHeight: 44 }}>
        {!_inTG && (
          <button onClick={() => navigate("team-detail", { team: t, from: from })} className="tap" aria-label="Назад" style={{ width: 36, height: 36, borderRadius: "50%", border: 0, display: "grid", placeItems: "center", background: "transparent", color: "var(--text)", cursor: "pointer", marginLeft: -6 }}>
            <I.ChevronLeft size={20} strokeWidth={2.4} />
          </button>
        )}
        <span style={{ width: 38, height: 38, borderRadius: "50%", display: "grid", placeItems: "center", background: "rgba(240,195,10,0.14)", flexShrink: 0 }}>
          <I.Compass size={18} color={BOS_ROOM_GOLD_INK} strokeWidth={2} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>Кабинет ведущего</div>
          <div style={{ fontSize: 10.5, color: "var(--text-4)" }}>{(t.name ? t.name + " · " : "") + "виден только тебе"}</div>
        </div>
        {/* Настройки круга (имя/ставка/видимость) — карандаш переехал сюда из шапки комнаты. */}
        <button onClick={() => openSheet(<GoalFormSheetLive mode="edit" circleOn={true} navigate={navigate} returnTo={from}
          goal={{ _id: t._id, id: t.id, cloudId: t.cloudId, __isTeam: true, __team: t, name: t.name, emoji: t.emblem, color: t.accent, target: t.target, unit: t.unit, deadline: t.date || t.deadline || "", circle: true, type: t.type, vis: t.vis, stake: t.stake, goal: t.goal, desc: t.desc || "", joined: t.joined, threadOff: t.threadOff === true, habitIds: [] }} />)}
          className="tap" data-haptic="selection" aria-label="Настройки круга"
          style={{ ...bosGlassChrome(isDark), width: 36, height: 36, borderRadius: "50%", border: 0, display: "grid", placeItems: "center", color: isDark ? "#fff" : "#0a0a0a", cursor: "pointer", flexShrink: 0 }}>
          <I.Pencil size={15} strokeWidth={2} />
        </button>
      </div>

      {/* Заявки — красный бейдж на компасе считает и их, значит здесь они должны быть видны. */}
      {pending.length > 0 && (
        <div style={{ ...card, marginTop: 6, padding: "11px 13px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase", color: "var(--text-4)", marginBottom: 8 }}>Стучатся в круг · {pending.length}</div>
          {pending.map((p) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "5px 0" }}>
              <BuddyFaceLive avatar={p.avatar} name={p.name || "Гость"} size={28} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name || "Гость"}</span>
              <button onClick={() => approveReq(p.id)} className="tap" style={{ border: 0, borderRadius: 999, padding: "6px 13px", fontSize: 11.5, fontWeight: 700, cursor: "pointer", background: isDark ? "#fff" : "#0a0a0a", color: isDark ? "#0a0a0a" : "#fff" }}>Принять</button>
              <button onClick={() => rejectReq(p.id)} className="tap" style={{ border: 0, borderRadius: 999, padding: "6px 11px", fontSize: 11.5, fontWeight: 700, cursor: "pointer", background: isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)", color: "var(--text-2)" }}>Нет</button>
            </div>
          ))}
        </div>
      )}

      {/* Цифры дня */}
      <div style={{ marginTop: 6, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div style={{ ...card, padding: "12px 8px", textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.5px", fontVariantNumeric: "tabular-nums" }}>{todayN + "/" + (N || "?")}</div>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: "var(--text-4)", letterSpacing: 0.4, marginTop: 2 }}>СЕГОДНЯ В ДЕЛЕ</div>
        </div>
        <div style={{ ...card, padding: "12px 8px", textAlign: "center", boxShadow: RED.length ? "var(--card-shadow), inset 0 0 0 1px rgba(224,54,43,0.2)" : "var(--card-shadow)" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: RED.length ? "#E0362B" : "var(--text)", letterSpacing: "-0.5px", fontVariantNumeric: "tabular-nums" }}>{RED.length}</div>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: "var(--text-4)", letterSpacing: 0.4, marginTop: 2 }}>ТРЕБУЮТ ВНИМАНИЯ</div>
        </div>
      </div>

      {/* Здоровье программы + удержание */}
      {(habits || []).length > 0 && (
        <div style={{ ...card, marginTop: 8, padding: "13px 14px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase", color: "var(--text-4)", marginBottom: 8 }}>Здоровье программы · неделя к неделе</div>
          {health.map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: i < health.length - 1 ? 9 : 0 }}>
              <span style={{ fontSize: 14, width: 22, textAlign: "center", flexShrink: 0 }}>{bosIconOf(r.h, 15, r.h.color)}</span>
              <span style={{ width: 100, fontSize: 11.5, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexShrink: 0 }}>{r.h.name}</span>
              <span style={{ flex: 1, height: 6, borderRadius: 999, background: isDark ? "rgba(255,255,255,0.1)" : "rgba(10,10,10,0.07)", overflow: "hidden" }}>
                <span style={{ display: "block", height: "100%", width: r.pct + "%", borderRadius: 999, background: r.delta >= 0 ? ("linear-gradient(90deg," + BOS_ROOM_GOLD_L + "," + BOS_ROOM_GOLD + ")") : "linear-gradient(90deg,#f0a08e,#E0362B)" }} />
              </span>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: "var(--text-3)", width: 30, textAlign: "right", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{r.pct}%</span>
              <span style={{ fontSize: 9.5, fontWeight: 800, color: r.delta >= 0 ? BOS_ROOM_GOLD_INK : "#E0362B", width: 30, textAlign: "right", flexShrink: 0 }}>{r.delta === 0 ? "" : (r.delta > 0 ? "+" : "−") + Math.abs(r.delta) + "%"}</span>
            </div>
          ))}
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid " + (isDark ? "rgba(255,255,255,0.07)" : "rgba(10,10,10,0.06)") }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase", color: "var(--text-4)", marginBottom: 4 }}>Удержание · 4 недели</div>
            <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", height: H }}>
              <path d={retPath} fill="none" stroke={BOS_ROOM_GOLD} strokeWidth="2" strokeLinecap="round" />
              {reten.map((v, i) => (
                <g key={i}>
                  <circle cx={rx(i)} cy={ry(v)} r="3" fill={BOS_ROOM_GOLD} />
                  <text x={rx(i)} y={ry(v) - 7} textAnchor="middle" style={{ font: "700 9px -apple-system", fill: isDark ? "#f2f2f5" : "#0a0a0a" }}>{v}%</text>
                </g>
              ))}
            </svg>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0 4px" }}>
              {["нед 1", "нед 2", "нед 3", "сейчас"].map((x, i) => <span key={i} style={{ fontSize: 9, color: "var(--text-4)", fontWeight: 700 }}>{x}</span>)}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-4)", lineHeight: 1.45, marginTop: 6 }}>Когда проседает вся группа — дело в программе, а не в людях: смотри, какая привычка просела.</div>
          </div>
        </div>
      )}

      {/* Журнал: сортировка по тревоге, поиск, все люди по одному */}
      <div style={{ margin: "10px 0 0", display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none", padding: 1 }}>
        {[["alarm", "По тревоге"], ["streak", "По серии"], ["name", "По имени"], ["old", "Давно не был"]].map(([v, l]) => (
          <button key={v} onClick={() => setSortBy(v)} className="tap"
            style={{ border: 0, borderRadius: 999, padding: "7px 13px", fontSize: 11.5, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0, cursor: "pointer",
              ...(sortBy === v ? { background: isDark ? "#fff" : "#0a0a0a", color: isDark ? "#0a0a0a" : "#fff" } : { ...bosChipGlass(isDark), color: "var(--text-2)" }) }}>{l}</button>
        ))}
      </div>
      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, ...bosChipGlass(isDark), borderRadius: 999, padding: "8px 13px" }}>
        <I.Search size={12} color="var(--text-4)" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Найти человека…" style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: "transparent", fontSize: 12.5, color: "var(--text)" }} />
      </div>

      {q.trim() ? (
        <div style={{ marginTop: 10 }}>{sorted.map(wardRow)}</div>
      ) : (
        <React.Fragment>
          {RED.length > 0 && secTitle("#E0362B", "Теряем — " + RED.length)}
          {RED.map(wardRow)}
          {NEW.length > 0 && secTitle(BOS_ROOM_GOLD_INK, "Хрупкое окно · первые 3 дня — " + NEW.length)}
          {NEW.map(wardRow)}
          {YEL.length > 0 && secTitle(BOS_ROOM_GOLD_INK, "Шатаются — " + YEL.length)}
          {YEL.map(wardRow)}
          {OK.length > 0 && secTitle("var(--text-4)", "В ритме — " + OK.length)}
          {(showAll ? OK : OK.slice(0, 5)).map(wardRow)}
          {OK.length > 5 && !showAll && (
            <button onClick={() => setShowAll(true)} className="tap" style={{ width: "100%", border: 0, borderRadius: 999, padding: "10px 0", fontSize: 12, fontWeight: 700, cursor: "pointer", background: isDark ? "rgba(255,255,255,0.07)" : "var(--surface-3)", color: "var(--text-2)", marginTop: 4 }}>
              {"Показать всех — " + wards.length}
            </button>
          )}
        </React.Fragment>
      )}

      <div style={{ fontSize: 9.5, color: "var(--text-4)", padding: "10px 4px 0", lineHeight: 1.4 }}>
        Прозрачность вместо слежки: каждый участник видит о себе то же самое. Здесь нет ничего скрытого от людей.
      </div>
    </div>
  );
}

/* ══════════════════ СТРАНИЦА ПРИВЫЧКИ КРУГА (ступень 3 стандарта) ══════════════════
   ОТДЕЛЬНАЯ СТРАНИЦА, как у личной привычки (David 2026-07-16: «у нас же была отдельная
   стандартизированная страница — почему шторка?»). Тело — тот же стандарт-лесенка
   (HabitStandardSheetLive — это просто вёрстка, не шторка); данные встают МГНОВЕННО из
   персистентных кэшей комнаты (_bosTeamGet) и освежаются фоном своим поллом. */
function CircleHabitDetailLive() {
  const { navigate, params } = useNav();
  const app = useApp();
  const { open: openSheet } = useSheet();
  const t = params?.team || {};
  const from = params?.from || "community";
  const isDark = app?.themeOverride === "dark";
  const _live = !!(window.bosCloud && window.bosCloud.enabled() && t.cloudId);
  const hSeed = params?.habit || {};

  const [meId, setMeId] = React.useState(null);
  const [habits, setHabits] = React.useState(() => _bosTeamGet("habits:" + t.cloudId) || []);
  const [roster, setRoster] = React.useState(() => _bosTeamGet("roster:" + t.cloudId) || []);
  const [rangeS, setRangeS] = React.useState(() => _bosTeamGet("range31:" + t.cloudId));
  const [dayFeedS, setDayFeedS] = React.useState(() => _bosTeamGet("dayfeed:" + t.cloudId));
  const [cheers, setCheers] = React.useState(() => _bosTeamGet("cheers:" + t.cloudId));
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    if (!_live) return;
    let on = true;
    window.bosCloud.uid().then((id) => { if (on) setMeId(id || null); });
    window.bosCloud.teamHabitsFull(t.cloudId).then((hs) => { if (on && Array.isArray(hs)) setHabits(_bosTeamPut("habits:" + t.cloudId, hs)); });
    window.bosCloud.teamMembers(t.cloudId).then((mem) => { if (on && Array.isArray(mem)) setRoster(_bosTeamPut("roster:" + t.cloudId, mem.map((m) => ({ id: m.id, name: m.name || "Участник", avatar: m.avatar, role: m.role, joinedAt: m.joinedAt || null })))); });
    window.bosCloud.teamDayFeed(t.cloudId).then((d) => { if (on && d) setDayFeedS(_bosTeamPut("dayfeed:" + t.cloudId, d)); });
    window.bosCloud.teamLogsRange(t.cloudId, 31).then((d) => { if (on && d) setRangeS(_bosTeamPut("range31:" + t.cloudId, d)); });
    if (window.bosCloud.teamCheersToday) window.bosCloud.teamCheersToday(t.cloudId).then((d) => { if (on && d) setCheers(_bosTeamPut("cheers:" + t.cloudId, d)); });
    return () => { on = false; };
  }, [_live, t.cloudId, tick]);

  const h = (habits || []).find((x) => x.id === hSeed.id) || hSeed;
  const members = roster || [];
  const _meMember = meId ? members.find((m) => m.id === meId) : null;
  const _isOwner = !!(_meMember && _meMember.role === "owner");

  // Отметка: «прижитая» личная копия главнее (единый источник правды), иначе прямой командный лог.
  const myHabits = app?.habits || [];
  const _todayK = (typeof bosTodayKey === "function") ? bosTodayKey() : new Date().toISOString().slice(0, 10);
  const adopted = (h && h.id != null) ? myHabits.find((x) => x.teamHabitId === h.id) : null;
  const done = adopted ? !!(adopted.log && adopted.log[_todayK]) : !!h.doneByMe;
  const toggle = () => {
    if (adopted) { app?.toggleHabit(adopted.id); setTick((n) => n + 1); if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} } return; }
    if (!h || !h.id || !_live) return;
    const want = !h.doneByMe;
    setHabits((list) => _bosTeamPut("habits:" + t.cloudId, (list || []).map((x) => x.id === h.id ? { ...x, doneByMe: want, doneToday: Math.max(0, (x.doneToday || 0) + (want ? 1 : -1)) } : x)));
    if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} }
    window.bosCloud.toggleTeamHabitToday(h.id, want).then(() => setTick((n) => n + 1));
  };
  const cheersOn = !!(cheers && Array.isArray(cheers.rows));
  const myCheered = {}; if (cheersOn && meId) cheers.rows.forEach((r) => { if (r.from === meId) myCheered[r.to] = true; });
  const sendCheer = (toId) => { if (!cheersOn || myCheered[toId] || toId === meId) return; setCheers((c) => c ? { ...c, rows: c.rows.concat([{ from: meId, to: toId, at: new Date().toISOString() }]) } : c); window.bosCloud.sendTeamCheer(t.cloudId, toId); if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} } };
  const openPerson = (p) => navigate("team-person", { team: t, person: p, from: from, backRoute: "team-habit", backParams: { team: t, habit: h, from: from } });
  const onEdit = _isOwner ? () => openSheet(<HabitFormSheetLive mode="edit" navigate={navigate}
    habit={{ id: h.id, name: h.name, emoji: h.emoji, color: h.color || null, goalPerDay: h.goalPerDay || 1, duration: 0, isMain: !!h.isMain }}
    teamFor={{ team: t,
      onSave: (data, editId) => {
        setHabits((list) => _bosTeamPut("habits:" + t.cloudId, (list || []).map((x) => x.id === editId ? { ...x, name: data.name, emoji: data.emoji, color: data.color, goalPerDay: data.goalPerDay, isMain: data.isMain } : x)));
        if (window.bosCloud.updateTeamHabit) window.bosCloud.updateTeamHabit(editId, data).then((ok) => {
          setTick((n) => n + 1);
          if (!ok && typeof InfoSheet === "function") openSheet(<InfoSheet title="Правка не сохранилась" dark={isDark} cta="Понятно" body="База не приняла изменение общей привычки, поэтому она осталась прежней. Обычно это нехватка прав на правку в круге — сообщи, и мы поправим." />);
        });
      },
      onDelete: (id) => {
        if (window.bosCloud.removeTeamHabit) window.bosCloud.removeTeamHabit(id);
        setHabits((list) => _bosTeamPut("habits:" + t.cloudId, (list || []).filter((x) => x.id !== id)));
        navigate("team-detail", { team: t, from: from });
      } }} />) : null;

  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader dark={isDark} title="" onBack={() => navigate("team-detail", { team: t, from: from })}
        right={onEdit ? <EditGlassButtonLive onClick={onEdit} /> : null} />
      <HabitStandardSheetLive mode="circle" habit={h} team={t} members={members} meId={meId}
        rangeRows={(rangeS && rangeS.rows) || []} dayRows={(dayFeedS && dayFeedS.rows) || []}
        done={done} onToggle={toggle} onEdit={null} onPerson={openPerson} isDark={isDark} />
    </div>
  );
}

/* ══════════════════ СТРАНИЦА ЧЕЛОВЕКА В КРУГЕ (кадр 3) ══════════════════
   ОТДЕЛЬНАЯ СТРАНИЦА (David 2026-07-16: «карточку человека тоже сделай страницей»).
   Тело — тот же CirclePersonSheetLive (это просто вёрстка); данные мгновенно из
   персистентных кэшей комнаты, свежесть — фоновым поллом. Назад — откуда пришли
   (комната / кабинет / страница привычки — backRoute+backParams). */
function CirclePersonDetailLive() {
  const { navigate, params } = useNav();
  const app = useApp();
  const t = params?.team || {};
  const person = params?.person || {};
  const from = params?.from || "community";
  const backRoute = params?.backRoute || "team-detail";
  const backParams = params?.backParams || { team: t, from: from };
  const isDark = app?.themeOverride === "dark";
  const _live = !!(window.bosCloud && window.bosCloud.enabled() && t.cloudId);

  const [meId, setMeId] = React.useState(null);
  const [habits, setHabits] = React.useState(() => _bosTeamGet("habits:" + t.cloudId) || []);
  const [rangeS, setRangeS] = React.useState(() => _bosTeamGet("range31:" + t.cloudId));
  const [dayFeedS, setDayFeedS] = React.useState(() => _bosTeamGet("dayfeed:" + t.cloudId));
  const [cheers, setCheers] = React.useState(() => _bosTeamGet("cheers:" + t.cloudId));
  React.useEffect(() => {
    if (!_live) return;
    let on = true;
    window.bosCloud.uid().then((id) => { if (on) setMeId(id || null); });
    window.bosCloud.teamHabitsFull(t.cloudId).then((hs) => { if (on && Array.isArray(hs)) setHabits(_bosTeamPut("habits:" + t.cloudId, hs)); });
    window.bosCloud.teamDayFeed(t.cloudId).then((d) => { if (on && d) setDayFeedS(_bosTeamPut("dayfeed:" + t.cloudId, d)); });
    window.bosCloud.teamLogsRange(t.cloudId, 31).then((d) => { if (on && d) setRangeS(_bosTeamPut("range31:" + t.cloudId, d)); });
    if (window.bosCloud.teamCheersToday) window.bosCloud.teamCheersToday(t.cloudId).then((d) => { if (on && d) setCheers(_bosTeamPut("cheers:" + t.cloudId, d)); });
    return () => { on = false; };
  }, [_live, t.cloudId]);

  const cheersOn = !!(cheers && Array.isArray(cheers.rows));
  const myCheered = {}; if (cheersOn && meId) cheers.rows.forEach((r) => { if (r.from === meId) myCheered[r.to] = true; });
  const sendCheer = () => {
    if (!cheersOn || myCheered[person.id] || person.id === meId) return;
    setCheers((c) => c ? { ...c, rows: c.rows.concat([{ from: meId, to: person.id, at: new Date().toISOString() }]) } : c);
    window.bosCloud.sendTeamCheer(t.cloudId, person.id);
    if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} }
  };

  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader dark={isDark} title="" onBack={() => navigate(backRoute, backParams)} />
      <CirclePersonSheetLive team={t} person={person} meId={meId} habits={habits}
        rangeRows={(rangeS && rangeS.rows) || []} dayRows={(dayFeedS && dayFeedS.rows) || []}
        cheersOn={cheersOn} cheered={!!myCheered[person.id]} onCheer={sendCheer}
        onWrite={(name) => navigate("team-detail", { team: t, from: from, prefill: "@" + (((name || "").split(" ")[0]) || "друг") + " " })}
        isDark={isDark} />
    </div>
  );
}

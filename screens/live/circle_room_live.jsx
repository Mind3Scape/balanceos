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
function bosRoomHHMM(ts) {
  try { var d = (typeof bosParseTs === "function") ? bosParseTs(ts) : new Date(ts); var m = d.getMinutes(); return d.getHours() + ":" + (m < 10 ? "0" + m : m); } catch (e) { return ""; }
}
function bosRoomPeopleWord(n) { return (n % 10 === 1 && n % 100 !== 11) ? "человек" : ((n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? "человека" : "человек"); }

/* Плоский чекбокс — ЕДИНСТВЕННЫЙ жест отметки в круге (язык v757: заливка чёрным/белым, галка).
   Зона нажатия 42px при видимых 28 — палец, целящийся в кружок, не промахивается в строку
   (промах открывал шторку статистики — David: «с чего у нас шторка открывается?»). */
function BosFlatCheckLive({ on, isDark, onToggle, label }) {
  return (
    <button onClick={onToggle} className="tap" aria-label={label || "Отметить"}
      style={{ width: 42, height: 42, margin: "-7px -7px -7px 0", borderRadius: "50%", flexShrink: 0, border: 0, display: "grid", placeItems: "center", cursor: "pointer", padding: 0, background: "transparent" }}>
      <span style={{ width: 28, height: 28, borderRadius: "50%", display: "grid", placeItems: "center",
        background: on ? (isDark ? "#fff" : "#0a0a0a") : "transparent",
        boxShadow: on ? "none" : "inset 0 0 0 1.5px " + (isDark ? "rgba(255,255,255,0.25)" : "rgba(10,10,10,0.18)"),
        transition: "background .15s" }}>
        {on ? <I.Check size={14} strokeWidth={3} color={isDark ? "#0a0a0a" : "#fff"} /> : null}
      </span>
    </button>
  );
}

/* Лицо участника: цветное — сегодня в деле, серое — ещё нет. gold — золотой ободок (я/сегодня). */
function BosRoomFaceLive({ p, size, active, gold, isDark, onClick, level }) {
  var ring = "0 0 0 2px " + (isDark ? "#1c1c20" : "#fff") + (gold ? ", 0 0 0 3.4px " + BOS_ROOM_GOLD : "");
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

/* Строка списка привычек/дел. Кружок = отметить; тело строки = аккордеон статистики (onOpen).
   Шеврона нет намеренно (David: рука и так тянется тапнуть) — строка раскрывается сама. */
function CircleDayRowLive({ icon, iconColor, name, tag, sub, subGold, faces, on, onToggle, onOpen, isDark, first, inert }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 2px", borderTop: first ? 0 : "1px solid " + (isDark ? "rgba(255,255,255,0.06)" : "rgba(10,10,10,0.05)") }}>
      <div onClick={onOpen} style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0, cursor: onOpen ? "pointer" : "default" }}>
        <span style={{ width: 34, height: 34, borderRadius: 11, flexShrink: 0, display: "grid", placeItems: "center", fontSize: 16,
          background: iconColor ? iconColor + "26" : (BOS_TILE_SHEEN + ", " + (isDark ? "rgba(255,255,255,0.06)" : "var(--surface-3)")),
          boxShadow: iconColor ? "none" : bosTileGlass(isDark) }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)", display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
            {tag ? <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: 0.6, color: "var(--text-4)", background: isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)", borderRadius: 999, padding: "2px 7px", textTransform: "uppercase", flexShrink: 0 }}>{tag}</span> : null}
          </div>
          {sub ? <div style={{ fontSize: 10, color: subGold ? BOS_ROOM_GOLD_INK : "var(--text-4)", fontWeight: subGold ? 700 : 400, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</div> : null}
        </div>
        {faces && faces.length ? (
          <span style={{ display: "flex", flexShrink: 0 }}>
            {faces.slice(0, 3).map((f, i) => (
              <span key={f.id || i} style={{ marginLeft: i ? -6 : 0, borderRadius: "50%", boxShadow: "0 0 0 2px " + (isDark ? "#1c1c20" : "#fff"), lineHeight: 0 }}>
                <BuddyFaceLive avatar={f.avatar} name={f.name} size={19} />
              </span>
            ))}
          </span>
        ) : null}
      </div>
      {inert
        ? <span aria-hidden style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, boxShadow: "inset 0 0 0 1.5px " + (isDark ? "rgba(255,255,255,0.18)" : "rgba(10,10,10,0.12)") }} />
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
  const [roomTab, setRoomTab] = React.useState(() => (params && (params.tab === "chat" || params.prefill) ? "chat" : "day"));
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
  const wk7 = {};
  { const wkKeys7 = {}; for (let i = 0; i < 7; i++) wkKeys7[bosRoomDayKey(i)] = true; rangeRows.forEach((r) => { if (wkKeys7[r.day]) wk7[r.u] = (wk7[r.u] || 0) + 1; }); }
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
  const editGoalLike = { _id: t._id, id: t.id, cloudId: t.cloudId, __isTeam: true, __team: t, name: t.name, emoji: t.emblem, color: t.accent, target: t.target, unit: t.unit, deadline: t.date || t.deadline || "", circle: true, type: t.type, vis: t.vis, stake: t.stake, goal: t.goal, desc: (goalProg && goalProg.desc) || t.desc || "", joined: t.joined, threadOff: threadOff, habitIds: [] };
  const subParts = [];
  if (ageDays) subParts.push("живёт " + ageDays + " " + ((ageDays % 10 === 1 && ageDays % 100 !== 11) ? "день" : (ageDays % 10 >= 2 && ageDays % 10 <= 4 && (ageDays % 100 < 12 || ageDays % 100 > 14)) ? "дня" : "дней"));
  if (membersN) subParts.push(membersN + " " + bosRoomPeopleWord(membersN));
  if (t.vis === "public") subParts.push("открытый");
  if (stake > 0) subParts.push("банк " + bank + " XP");
  const card = { background: "var(--card)", borderRadius: 20, boxShadow: "var(--card-shadow)" };
  const bubbleOther = isDark ? "rgba(255,255,255,0.07)" : "#fff";

  // ПРИВЫЧКИ и ДЕЛА — раздельные вкладки одного блока (David 2026-07-20: «чтобы не
  // смешивалось всё в одно; тогда дела не надо подписывать как дела»). Плюс внизу
  // остаётся универсальным. dayList = строки активной вкладки.
  const [listTab, setListTab] = React.useState("habits");
  const dayList = [];
  // Строки БЕЗ подписей «N из M · ты в 12:52» (David 2026-07-16: «грязь, захламляет» —
  // лица уже показывают, кто прокликал, а раскрытие даёт подробности).
  if (listTab === "habits") teamHabits.forEach((h, i) => {
    const done = myDone(h);
    const facesH = (Array.isArray(h.todayUsers) ? h.todayUsers : []).map((u) => rosterById[u]).filter(Boolean);
    const opened = openHabit === h.id;
    const _hRow = (
      <CircleDayRowLive first={dayList.length === 0} isDark={isDark}
        icon={bosIconOf(h, 18, h.color)} iconColor={h.color && h.color !== "#0a0a0a" ? h.color : null}
        name={h.name} faces={facesH}
        on={done} inert={!_live}
        onToggle={() => (adoptedFor(h) ? markAdopted(h) : toggleMyTeamHabit(h))}
        onOpen={() => setOpenHabit(opened ? null : h.id)} />
    );
    // Свайп влево (владелец) → «Изменить · Удалить»; остальным — обычная строка.
    dayList.push(_isOwner
      ? <SwipeRow key={"h" + (h.id || i)} rowBg="var(--card)" dark={isDark} actionWidth={54} actionSize={32} actions={_habitSwipe(h)}>{_hRow}</SwipeRow>
      : <div key={"h" + (h.id || i)}>{_hRow}</div>);
    // АККОРДЕОН (David 2026-07-16: «не на отдельную вкладку — привычка раскрывается вниз,
    // и видно всё, что в неё входит, как в макетах»): тап по строке → статистика тут же.
    if (opened) dayList.push(
      <div key={"hx" + (h.id || i)} style={{ padding: "0 2px 13px" }}>
        <HabitStandardSheetLive bare mode="circle" habit={h} team={t} members={members} meId={meId} levels={levels}
          rangeRows={rangeRows} dayRows={dayRows} done={done}
          onToggle={() => (adoptedFor(h) ? markAdopted(h) : toggleMyTeamHabit(h))}
          onEdit={null} onPerson={openPerson} isDark={isDark} />
      </div>
    );
  });
  if (listTab === "tasks") _teamTasks.forEach((tk, i) => {
    const facesT = (Array.isArray(tk.doneUsers) ? tk.doneUsers : []).map((u) => rosterById[u]).filter(Boolean);
    const _tRow = (
      <CircleDayRowLive first={dayList.length === 0} isDark={isDark}
        icon={<I.Flag size={16} strokeWidth={2.2} color="var(--text-2)" />} name={tk.text}
        faces={facesT}
        on={!!tk.doneByMe} inert={!_live}
        onToggle={() => toggleMyTeamTask(tk)} />
    );
    // Свайп влево (владелец) → «Удалить» (David: «фото завтрака не удалить»); метки «дело» нет — вкладка сама говорит.
    dayList.push(_isOwner
      ? <SwipeRow key={"t" + tk.id} rowBg="var(--card)" dark={isDark} actionWidth={54} actionSize={32} actions={_taskSwipe(tk)}>{_tRow}</SwipeRow>
      : <div key={"t" + tk.id}>{_tRow}</div>);
  });

  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      {/* ШАПКА (David 2026-07-16: «как на главной — одна стеклянная пилюля: слева компас с
          цифрой, справа три точки с подменю; переключатель поднять для симметрии»): назад ·
          сегменты по центру (абсолютом — центр не гуляет от ширины краёв) · пилюля справа.
          Всё, что не поместилось (позвать, уровень, настройки), живёт за «⋯». */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", padding: "2px 0 2px", minHeight: 46 }}>
        {!_inTG && (
          <button onClick={() => navigate(from)} className="tap" aria-label="Назад" style={{ width: 36, height: 36, borderRadius: "50%", border: 0, display: "grid", placeItems: "center", background: "transparent", color: "var(--text)", flexShrink: 0, cursor: "pointer", marginLeft: -6 }}>
            <I.ChevronLeft size={20} strokeWidth={2.4} />
          </button>
        )}
        {/* СЕГМЕНТЫ (макет А): точка-в-кольце = «День круга», пузырь = «Чат»; золотой бейдж
            непрочитанного. Теперь в шапке, по центру. */}
        {/* Переключатель — ТО ЖЕ стекло и та же высота 40, что у пилюли справа (David
            2026-07-17: «одним целым с правым блоком»). */}
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
          <div style={{ display: "inline-flex", alignItems: "center", height: 40, boxSizing: "border-box", borderRadius: 999, padding: 3, ...glass }}>
            {["day", "chat"].map((id) => {
              const on = roomTab === id;
              return (
                <button key={id} onClick={() => { setRoomTab(id); if (id === "chat") { try { window.scrollTo(0, 0); } catch (e) {} } }} className="tap" data-haptic="selection"
                  aria-label={id === "day" ? "День круга" : "Чат"}
                  style={{ position: "relative", border: 0, borderRadius: 999, height: 34, padding: "0 22px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
                    background: on ? (isDark ? "#fff" : "#0a0a0a") : "transparent", color: on ? (isDark ? "#0a0a0a" : "#fff") : "var(--text-3)", transition: "background .15s, color .15s" }}>
                  {id === "day" ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="8.4" /><circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" /></svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 12.5 3h.5a8.5 8.5 0 0 1 8 8v.5z" /></svg>
                  )}
                  {id === "chat" && !on && unreadN > 0 && (
                    <span style={{ position: "absolute", top: -3, right: 6, minWidth: 15, height: 15, padding: "0 4px", borderRadius: 999, background: "linear-gradient(135deg,#FEDE34,#EF9F14)", color: "#5a4104", fontSize: 8.5, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{unreadN > 9 ? "9+" : unreadN}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        {/* Пилюля: стекло варится один раз на контейнере (урок пилюли Главной), кнопки
            внутри прозрачные, каждая держит свою зону касания. */}
        <div style={{ display: "flex", alignItems: "center", height: 40, borderRadius: 999, flexShrink: 0, overflow: "hidden", ...glass }}>
          {_isOwner && _live && (
            <button onClick={() => navigate("team-cabinet", { team: t, from: from })} className="tap" aria-label="Кабинет ведущего" title="Кабинет ведущего"
              style={{ height: 40, border: 0, padding: "0 5px 0 13px", display: "inline-flex", alignItems: "center", gap: 4, background: "transparent", color: isDark ? "#fff" : "#0a0a0a", cursor: "pointer", flexShrink: 0 }}>
              <I.Compass size={17} strokeWidth={2} />
              {redCount > 0 && <span style={{ minWidth: 16, height: 16, borderRadius: 999, background: "#E0362B", color: "#fff", fontSize: 9.5, fontWeight: 800, display: "grid", placeItems: "center", padding: "0 4px" }}>{redCount}</span>}
            </button>
          )}
          <button ref={moreRef} onClick={() => setMenuOpen(true)} className="tap" aria-label="Ещё" aria-haspopup="menu" aria-expanded={menuOpen}
            style={{ width: _isOwner && _live ? 42 : 46, height: 40, border: 0, background: "transparent", color: isDark ? "#fff" : "#0a0a0a", cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>
          </button>
        </div>
      </div>
      {/* «Редактировать» — ПЕРВЫМ и для владельца ЛЮБОГО круга (David 2026-07-17: «исчезло
          редактирование целей»): та же форма __isTeam, что в кабинете (save=updateTeam). */}
      <CircleRoomMenuLive open={menuOpen} onClose={() => setMenuOpen(false)} anchorRef={moreRef} isDark={isDark} items={[
        _isOwner ? { icon: <I.Pencil size={17} strokeWidth={1.9} />, label: "Редактировать", go: () => openSheet(<GoalFormSheetLive mode="edit" circleOn={true} navigate={navigate} returnTo={from} goal={editGoalLike} />) } : null,
        { icon: <I.Share size={18} strokeWidth={1.9} />, label: "Позвать в круг", go: () => openSheet(<TeamShareSheetLive team={t} />) },
        circleLvl ? { icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><circle cx="12" cy="12" r="8.4" strokeDasharray="39 14" transform="rotate(-90 12 12)" /><circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" /></svg>
        ), label: "Уровень круга — " + circleLvl.level, go: openLevelSheet } : null,
      ].filter(Boolean)} />

      {roomTab === "day" && (<React.Fragment>
      {/* ВИЗИТКА КРУГА (вариант Б): диск с кольцом-уровнем · имя · факты · XP-шкала · серия —
          одна карточка без заголовка, это сам круг. Нить живёт НИЖЕ, в блоке «Сегодня». */}
      <div style={{ ...card, padding: "13px 13px 11px", marginTop: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          {circleLvl ? (
            <button onClick={openLevelSheet} className="tap" data-haptic="selection" aria-label="Уровень круга"
              style={{ position: "relative", width: 48, height: 48, flexShrink: 0, border: 0, background: "transparent", padding: 0, cursor: "pointer" }}>
              <svg viewBox="0 0 36 36" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
                <circle cx="18" cy="18" r="16" fill="none" stroke={isDark ? "rgba(255,255,255,0.13)" : "rgba(10,10,10,0.08)"} strokeWidth="2.6" />
                <circle cx="18" cy="18" r="16" fill="none" stroke={BOS_ROOM_GOLD} strokeWidth="2.6" strokeLinecap="round" strokeDasharray="100.5" strokeDashoffset={(100.5 * (1 - circleLvl.frac)).toFixed(1)} />
              </svg>
              <span style={{ position: "absolute", inset: 5, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 19,
                background: BOS_ORB_SHEEN + ", " + (isDark ? "linear-gradient(160deg,#464c58,#30353f)" : "linear-gradient(160deg,#eef1f6,#dadfe7)"),
                boxShadow: bosOrbGlass(isDark) }}>{bosIconOf(t, 19, null, "👥")}</span>
              <span style={{ position: "absolute", right: -4, bottom: -2, minWidth: 16, height: 16, padding: "0 4px", borderRadius: 999, background: isDark ? "#26262b" : "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.22)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: BOS_ROOM_GOLD_INK, lineHeight: 1, zIndex: 2 }}>{circleLvl.level}</span>
            </button>
          ) : (
            <span style={{ width: 46, height: 46, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", fontSize: 20,
              background: BOS_ORB_SHEEN + ", " + (isDark ? "linear-gradient(160deg,#464c58,#30353f)" : "linear-gradient(160deg,#eef1f6,#dadfe7)"),
              boxShadow: bosOrbGlass(isDark) }}>{bosIconOf(t, 20, null, "👥")}</span>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
            <div style={{ fontSize: 10.5, color: "var(--text-4)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{subParts.join(" · ")}</div>
          </div>
        </div>
        {circleLvl && (
          <React.Fragment>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 11 }}>
              <span style={{ fontSize: 10.5, color: "var(--text-2)", fontWeight: 600 }}>
                {"Сегодня +" + todayGain + " XP"}
                {rhythmToday && <span style={{ fontSize: 9, color: BOS_ROOM_GOLD_INK, fontWeight: 800, background: "rgba(240,195,10,0.13)", borderRadius: 999, padding: "2px 6px", marginLeft: 4 }}>в ритме ×2</span>}
              </span>
              <span style={{ fontSize: 10, color: "var(--text-4)" }}>{"до " + (circleLvl.level + 1) + " ур. — " + circleLvl.toNext}</span>
            </div>
            {/* Полоса-шкала УБРАНА (David 2026-07-17: «заполнение уровня видим только на
                кружочке») — прогресс живёт в кольце вокруг диска, тут остаётся строка цифр. */}
          </React.Fragment>
        )}
        {/* Мои залёты: тихо на 1-м, тревожно на 2-м; на 3-м человека тут уже нет. */}
        {myStrikes && myStrikes.miss > 0 && (
          <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginTop: 10, borderRadius: 12, padding: "7px 10px", background: myStrikes.miss >= 2 ? "rgba(224,54,43,0.09)" : "rgba(240,195,10,0.10)" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: myStrikes.miss >= 2 ? "#C03428" : BOS_ROOM_GOLD_INK, flexShrink: 0 }}>{"Пропуск " + Math.min(myStrikes.miss, 3) + " из 3"}</span>
            <span style={{ fontSize: 10.5, color: "var(--text-4)", minWidth: 0 }}>{myStrikes.miss >= 2 ? "ещё один — и круг отпустит · отметка обнуляет" : "три подряд — выход из круга · отметка обнуляет"}</span>
          </div>
        )}
        {/* «N/M сегодня» УБРАНО из шапки (David 2026-07-17: «фигня, дубль» — та же цифра живёт
            у секции «Сегодня» строкой «N из M в деле»). Осталась серия + «ты в верхней трети». */}
        {_live && (circleStreak > 0 || topThird) && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 10, paddingTop: 9, borderTop: "1px solid " + (isDark ? "rgba(255,255,255,0.06)" : "rgba(10,10,10,0.05)") }}>
            {circleStreak > 0 && <I.Flame size={12} color={BOS_ROOM_GOLD} filled strokeWidth={1.6} />}
            {circleStreak > 0 && <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--text)" }}>{streakCap} {circleStreak === 1 ? "день" : circleStreak < 5 ? "дня" : "дней"} круг в ритме</span>}
            {topThird && <span style={{ fontSize: 10.5, color: "var(--text-4)" }}>{(circleStreak > 0 ? "· " : "") + "ты в верхней трети"}</span>}
          </div>
        )}
      </div>

      {/* «СЕГОДНЯ» — нить дня в своём блоке (лица в свой час; на большом круге — волна). */}
      {!threadOff && _live && (
        <React.Fragment>
          <BosRoomH2 extra={<span style={{ fontSize: 10.5, color: "var(--text-4)" }}>{todayN + " из " + membersN + " в деле"}</span>}>Сегодня</BosRoomH2>
          {/* Нить БЕЗ белой подложки — прямо на фоне страницы (David 2026-07-17). */}
          <div style={{ padding: "2px 6px" }}>
            <BosDayThreadLive faces={threadFaces.length <= 6 ? threadFaces : []} hours={threadFaces.length > 6 ? Object.keys(firstByUser).map((u) => _hr(firstByUser[u])) : []} isDark={isDark} />
          </div>
        </React.Fragment>
      )}

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

      {/* МОЙ ДЕНЬ В КРУГЕ — вкладки «Привычки · Дела» (David 2026-07-20: «не смешивать в одно;
          переключатель посимпатичней»): пилюля-сегмент в языке шапки комнаты (активный сегмент =
          чёрная/белая таблетка, как «День/Чат»); счётчик справа — по активной вкладке. */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0 9px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", borderRadius: 999, padding: 3, background: isDark ? "rgba(255,255,255,0.07)" : "rgba(10,10,10,0.05)" }}>
          {[["habits", "Привычки"], ["tasks", "Дела"]].map(([id, label]) => {
            const on = listTab === id;
            return (
              <button key={id} onClick={() => setListTab(id)} className="tap" data-haptic="selection"
                style={{ border: 0, borderRadius: 999, padding: "6px 15px", fontSize: 12.5, fontWeight: 700, letterSpacing: "-0.1px", cursor: "pointer",
                  background: on ? (isDark ? "#fff" : "#0a0a0a") : "transparent", color: on ? (isDark ? "#0a0a0a" : "#fff") : "var(--text-3)",
                  boxShadow: on ? "0 1px 3px rgba(0,0,0,0.14)" : "none", transition: "background .15s, color .15s" }}>{label}</button>
            );
          })}
        </div>
        {listTab === "habits" && teamHabits.length > 0 && <span style={{ fontSize: 10.5, color: "var(--text-4)", paddingRight: 4 }}>{_myDoneCount + " из " + teamHabits.length}</span>}
        {listTab === "tasks" && _teamTasks.length > 0 && <span style={{ fontSize: 10.5, color: "var(--text-4)", paddingRight: 4 }}>{_teamTasks.filter((x) => x.doneByMe).length + " из " + _teamTasks.length}</span>}
      </div>
      <div style={{ ...card, padding: "3px 12px" }}>
        {dayList.length ? dayList : (
          <div style={{ padding: "18px 6px", textAlign: "center" }}>
            {listTab === "habits" ? (
              <React.Fragment>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-2)" }}>{_isOwner ? "Дай кругу первую привычку" : "Ведущий ещё не добавил привычек"}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 3 }}>{_isOwner ? "Общий ритм — то, что круг делает каждый день" : "Загляни позже — здесь появится список дня"}</div>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-2)" }}>{_isOwner ? "Разовых дел пока нет" : "Дел пока нет"}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 3 }}>{_isOwner ? "Дело — разовый шаг: сделал, отметил, готово" : "Ведущий может дать кругу разовое дело"}</div>
              </React.Fragment>
            )}
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

      {/* ЛЮДИ — компактный грид лиц (решение David): молчащих тоже видно, тап — карточка. */}
      {membersN > 0 && (
        <React.Fragment>
          <BosRoomH2 extra={<span style={{ fontSize: 10.5, color: "var(--text-4)" }}>{todayN + " из " + membersN + " сегодня"}</span>}>Люди</BosRoomH2>
          <div style={{ ...card, padding: "13px 12px" }}>
            {/* Сетка как у календаря — 7 колонок на всю ширину, ряды ровные (David: «чтобы
                центрированно смотрелись и занимали всю область карточки»). */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", rowGap: 12, justifyItems: "center", alignItems: "center" }}>
              {membersRanked.map((m) => (
                <BosRoomFaceLive key={m.id} p={m} size={36} active={!!activeSet[m.id]} gold={m.id === meId && !!activeSet[m.id]} level={levelOf(m.id)} isDark={isDark} onClick={() => openPerson(m)} />
              ))}
              <button onClick={() => openSheet(<TeamShareSheetLive team={t} />)} className="tap" aria-label="Позвать в круг"
                style={{ width: 36, height: 36, borderRadius: "50%", border: 0, cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-3)", boxShadow: "inset 0 0 0 1.5px " + (isDark ? "rgba(255,255,255,0.14)" : "rgba(10,10,10,0.10)"), background: "transparent" }}>
                <I.Plus size={16} strokeWidth={2.4} />
              </button>
            </div>
          </div>
        </React.Fragment>
      )}

      {/* МОЛОДЦЫ НЕДЕЛИ — лидерборд (David 2026-07-16: «хочется, чтобы кого-то хвалили»).
          Метрика уже посчитана: wk7 = закрытые дни за 7 дней (тот же порядок, что сортирует
          «Людей»). Топ-3; в кругах от 8 человек — топ-5, от 20 — топ-10 (задел под большие
          группы). Показываем только когда есть кого хвалить (2+ людей и хоть один день). */}
      {membersN >= 2 && (() => {
        const _lbN = membersN >= 20 ? 10 : (membersN >= 8 ? 5 : 3);
        const _lb = members
          .map((m) => ({ m, n: wk7[m.id] || 0 }))
          .filter((x) => x.n > 0)
          .sort((a, b) => (b.n - a.n) || ((activeSet[b.m.id] ? 1 : 0) - (activeSet[a.m.id] ? 1 : 0)))
          .slice(0, _lbN);
        if (!_lb.length) return null;
        const _meIn = _lb.some((x) => x.m.id === meId);
        const _medal = (i) => i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
        return (
          <React.Fragment>
            <BosRoomH2 extra={_meIn
              ? <span style={{ fontSize: 10.5, fontWeight: 700, color: BOS_ROOM_GOLD_INK, background: "rgba(240,195,10,0.14)", borderRadius: 999, padding: "3px 9px" }}>ты в лидерах ✦</span>
              : <span style={{ fontSize: 10.5, color: "var(--text-4)" }}>дни за неделю</span>}>Молодцы недели</BosRoomH2>
            <div style={{ ...card, padding: "5px 12px" }}>
              {_lb.map((x, i) => (
                <button key={x.m.id} onClick={() => openPerson(x.m)} className="tap" style={{
                  width: "100%", border: 0, background: "transparent", cursor: "pointer", textAlign: "left",
                  display: "flex", alignItems: "center", gap: 11, padding: "9px 2px",
                  borderTop: i ? ("1px solid " + (isDark ? "rgba(255,255,255,0.06)" : "rgba(10,10,10,0.05)")) : 0,
                }}>
                  <span style={{ width: 24, textAlign: "center", fontSize: _medal(i) ? 17 : 12.5, fontWeight: 800, color: "var(--text-4)", flexShrink: 0 }}>{_medal(i) || (i + 1)}</span>
                  <BosRoomFaceLive p={x.m} size={32} active={!!activeSet[x.m.id]} gold={i === 0} level={levelOf(x.m.id)} isDark={isDark} />
                  <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {x.m.name || "Без имени"}{x.m.id === meId && <span style={{ color: "var(--text-4)", fontWeight: 500 }}> · ты</span>}
                  </span>
                  {activeSet[x.m.id] && <span aria-label="сегодня в деле" style={{ fontSize: 12, flexShrink: 0 }}>🔥</span>}
                  <span style={{ flexShrink: 0, fontSize: 11.5, fontWeight: 700, borderRadius: 999, padding: "4px 10px",
                    background: i === 0 ? "rgba(240,195,10,0.16)" : (isDark ? "rgba(255,255,255,0.07)" : "rgba(10,10,10,0.05)"),
                    color: i === 0 ? BOS_ROOM_GOLD_INK : "var(--text-2)" }}>
                    {x.n} {x.n === 1 ? "день" : (x.n <= 4 ? "дня" : "дней")}
                  </span>
                </button>
              ))}
            </div>
          </React.Fragment>
        );
      })()}
      </React.Fragment>)}

      {/* ЧАТ — своя сторона комнаты (сегмент): отметки, слова и вехи, одна лента по
          времени; свои отметки ВНУТРИ ленты, не приколочены сверху (David 2026-07-16). */}
      {roomTab === "chat" && (<React.Fragment>
      {/* Имя круга — теперь тут (шапка отдана пилюле и сегментам): экран разговора не безымянный. */}
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 2px 0" }}>
        <span style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", fontSize: 15,
          background: BOS_ORB_SHEEN + ", " + (isDark ? "linear-gradient(160deg,#464c58,#30353f)" : "linear-gradient(160deg,#eef1f6,#dadfe7)"),
          boxShadow: bosOrbGlass(isDark) }}>{bosIconOf(t, 15, null, "👥")}</span>
        <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</span>
        {membersN > 0 && <span style={{ fontSize: 10.5, color: "var(--text-4)", flexShrink: 0 }}>{membersN + " " + bosRoomPeopleWord(membersN)}</span>}
      </div>
      {/* Тебя подбодрили — и кто. */}
      {cheeredMe.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "7px 0 9px", borderRadius: 14, padding: "8px 11px", background: "rgba(240,195,10,0.10)" }}>
          <I.Flame size={14} color={BOS_ROOM_GOLD} filled strokeWidth={1.6} />
          <span style={{ flex: 1, fontSize: 11.5, fontWeight: 700, color: BOS_ROOM_GOLD_INK }}>Тебя подбодрили — {cheeredMe.length} {bosRoomPeopleWord(cheeredMe.length)}</span>
          <button onClick={() => openSheet(<CircleWhoSheetLive people={cheeredMe.map((u) => rosterById[u]).filter(Boolean)} />)} className="tap"
            style={{ border: 0, borderRadius: 999, padding: "4px 10px", fontSize: 10.5, fontWeight: 700, cursor: "pointer", background: "var(--card)", color: "var(--text-2)" }}>кто?</button>
        </div>
      )}

      {/* ЧАТ-БОКС: лента скроллится ВНУТРИ и открыта на свежем, композер приклеен к её
          дну. С v774 чат — своя вкладка, поэтому бокс занимает почти весь экран. */}
      <div style={{ ...card, overflow: "hidden", marginTop: cheeredMe.length > 0 ? 0 : 7 }}>
      <div ref={feedBoxRef} className="screen-scroll" style={{ height: "calc(100vh - " + (cheeredMe.length > 0 ? 357 : 315) + "px)", minHeight: 340, overflowY: "auto", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain", padding: "12px 12px 4px", display: "flex", flexDirection: "column" }}>
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

      {/* КОМПОЗЕР — на дне чат-бокса, как в мессенджере. */}
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

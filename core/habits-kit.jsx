/* core/habits-kit.jsx — NEUTRAL shared toolkit extracted from screens/habits.jsx (v196 live/demo/core split).
   No product (demo/live) branching — one copy, used by BOTH demos and the live app.
   Moved bricks: AvatarStack, EMOJI_CHIPS, HABIT_COLORS, HABIT_COLOR_NAMES, HABIT_ICONS, HabitInviteShareSheet, HabitRing, INFO_TOPICS, WEEKDAY_LABELS, daysSummary */
const EMOJI_CHIPS = [
  { i: "☀️", t: "Подъём в 5:00" }, { i: "🤸🏼‍♀️", t: "Йога" }, { i: "📖", t: "Чтение" },
  { i: "🙏", t: "Помощь" }, { i: "🧭", t: "Вклад в миссию" }, { i: "⌨️", t: "Кодинг" },
  { i: "🦶", t: "10 000 шагов" }, { i: "🚭", t: "Не курить" }, { i: "🌚", t: "Сон в 21:00" },
  { i: "👟", t: "Бег" }, { i: "🧁", t: "Без сахара" }, { i: "📞", t: "Чаще звонить родителям" },
];

/* Avatar stack — small face pile showing who else is doing this habit.
   Soft pastels with enough saturation to read as real colours (the old set
   was so pale it looked grey). Dark initials still sit readably on top, and
   these same hues drive the shared-habit calendar rings so each person is
   recognisable at a glance — blue = Марк, peach = Анна, etc. */
const HABIT_COLORS = [
  { id: "base", val: null }, { id: "blue", val: "#0A84FF" }, { id: "green", val: "#34C759" },
  { id: "amber", val: "#FF9500" }, { id: "purple", val: "#AF52DE" }, { id: "pink", val: "#FF2D55" }, { id: "teal", val: "#30B0C7" },
];
const HABIT_COLOR_NAMES = { "#0A84FF": "Океан", "#34C759": "Лес", "#FF9500": "Янтарь", "#AF52DE": "Аметист", "#FF2D55": "Маджента", "#30B0C7": "Бирюза" };

/* ── Inline habit timer ───────────────────────────────────────────────────────
   A segmented "bezel" ring that ticks in place — replaces the old solid play
   button AND the separate dark focus screen. Tap to start a real countdown right
   in the row (хопс — пошло), tap again to pause (хопс — стоп). The bezel is N
   segments (≈ a chunk of the duration each); they light up as the timer fills,
   and on completion the habit auto-checks. Same radial-tick DNA as the mood dial,
   liquid-glass and iOS-native. */
function HabitRing({ habit, dark, onComplete }) {
  const total = Math.max(1, Math.round(habit?.duration || 1)) * 60;   // seconds
  const [running, setRunning] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  const done = elapsed >= total;

  React.useEffect(() => {
    if (!running) return;
    const base = elapsed, start = Date.now();           // timestamp-based → no drift
    const id = setInterval(() => {
      const e = base + (Date.now() - start) / 1000;
      if (e >= total) {
        setElapsed(total); setRunning(false); ringHaptic("success");
        onComplete && onComplete();
      } else setElapsed(e);
    }, 200);
    return () => clearInterval(id);
  }, [running]);

  const frac = Math.min(1, elapsed / total);
  const toggle = (e) => { e.stopPropagation(); ringHaptic("light"); setRunning((r) => !r); };

  // segmented "dashed ring": SEG arcs along the circle with small gaps, lighting
  // up as the timer fills (segment 0 lights the instant you start → immediate feel)
  const SEG = Math.min(12, Math.max(5, Math.round(habit?.duration || 6)));
  const size = 38, cx = size / 2, cy = size / 2, R = 14.5;
  const accent = habit?.color || (dark ? "#ffffff" : "#0a0a0a");
  const dim = dark ? "rgba(255,255,255,0.20)" : "rgba(10,10,10,0.14)";
  const pitch = 360 / SEG, gap = pitch * 0.36;
  const arc = (a0, a1) => {
    const p = (d) => { const a = (d * Math.PI) / 180; return [(cx + R * Math.cos(a)).toFixed(2), (cy + R * Math.sin(a)).toFixed(2)]; };
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    return "M " + x0 + " " + y0 + " A " + R + " " + R + " 0 " + (a1 - a0 > 180 ? 1 : 0) + " 1 " + x1 + " " + y1;
  };
  // live fill: every segment has a dim base; an accent overlay covers exactly the
  // elapsed share — whole for passed segments, PARTIAL for the current one, so you
  // literally watch it fill with time (no pulse, no guessing).
  const pos = frac * SEG;
  const base = [], fill = [];
  for (let i = 0; i < SEG; i++) {
    const a0 = -90 + i * pitch + gap / 2, a1 = -90 + (i + 1) * pitch - gap / 2;
    base.push(<path key={"b" + i} d={arc(a0, a1)} fill="none" stroke={dim} strokeWidth="2.4" strokeLinecap="round" />);
    const f = Math.max(0, Math.min(1, pos - i));
    if (f > 0.001) fill.push(<path key={"f" + i} d={arc(a0, a0 + (a1 - a0) * f)} fill="none" stroke={accent} strokeWidth="2.4" strokeLinecap="round" />);
  }

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
      {(running || (elapsed > 0 && !done)) && (
        <span style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.3px", color: "var(--text-3)" }}>{fmtClock(total - elapsed)}</span>
      )}
      <button onClick={toggle} className="tap" data-no-haptic aria-label={running ? "Пауза" : "Старт"}
        style={{ position: "relative", width: size, height: size, borderRadius: "50%", background: "transparent", border: 0, padding: 0, flexShrink: 0, display: "grid", placeItems: "center", color: accent }}>
        <svg width={size} height={size} viewBox={"0 0 " + size + " " + size} style={{ position: "absolute", inset: 0 }}>
          <circle cx={cx} cy={cy} r={R - 4.5} fill={dark ? "rgba(255,255,255,0.06)" : "rgba(10,10,10,0.045)"} />
          {base}
          {fill}
        </svg>
        <span style={{ position: "relative", display: "grid", placeItems: "center", transform: running || done ? "none" : "translateX(0.5px)" }}>
          {done ? <I.Check size={14} strokeWidth={3} /> : running ? <I.Pause size={13} /> : <I.Play size={12} />}
        </span>
      </button>
    </div>
  );
}

function AvatarStack({ people = [], size = 18, max = 3, label = true }) {
  if (!people.length) return null;
  const visible = people.slice(0, max);
  const overflow = people.length - visible.length;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <div style={{ display: "flex" }}>
        {visible.map((p, i) => (
          // Real avatar (the Memoji/Emoji the person chose) when they have one — so faces
          // stay consistent everywhere; initials disc only as a fallback.
          (p.avatar && typeof BosAvatar === "function") ? (
            <BosAvatar key={i} avatar={p.avatar} size={size} style={{
              border: "1.5px solid #fff", marginLeft: i ? -size*0.35 : 0, boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
            }} />
          ) : (
          <div key={i} title={p.name} style={{
            width: size, height: size, borderRadius: "50%",
            background: p.color || AVATAR_PALETTE[i % AVATAR_PALETTE.length],
            border: "1.5px solid #fff", marginLeft: i ? -size*0.35 : 0,
            display: "grid", placeItems: "center",
            fontSize: size * 0.5, fontWeight: 700, color: "rgba(0,0,0,0.55)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
          }}>{p.initials || p.name?.[0]}</div>
          )
        ))}
        {overflow > 0 && (
          <div style={{
            width: size, height: size, borderRadius: "50%",
            background: "var(--surface-3, #e9e9e9)", border: "1.5px solid #fff",
            marginLeft: -size*0.35, display: "grid", placeItems: "center",
            fontSize: size * 0.42, fontWeight: 700, color: "var(--text-3, #555)",
          }}>+{overflow}</div>
        )}
      </div>
      {label && <span style={{ fontSize: 11, color: "var(--text-4, #71717a)" }}>с {people[0].name.split(" ")[0]}{people.length > 1 ? ` +${people.length-1}` : ""}</span>}
    </div>
  );
}

/* ── Share-a-habit sheet (slides up from a row's swipe "Поделиться") ───────── */
const HABIT_ICONS = ["🏃","🚶","🚴","🏊","💪","🧘","🤸","🧗","📖","📚","✍️","🎨","🎵","🎸","💻","🧠","🙏","🧊","💧","🥗","🍎","☕","🚭","😴","☀️","🌙","🔥","🌱","⭐","🎯","❤️","🧭"];

/* Weekday model — index 0..6 = Пн..Вс. `days` on a habit is a 7-long 0/1 mask;
   all-1 means «каждый день». Helpers below summarise it for the UI. */
const WEEKDAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
function daysSummary(days) {
  const on = days.filter(Boolean).length;
  if (on === 7) return "Каждый день";
  if (on === 0) return "Не выбрано";
  if (on === 5 && days[0] && days[1] && days[2] && days[3] && days[4]) return "По будням";
  if (on === 2 && days[5] && days[6]) return "По выходным";
  return WEEKDAY_LABELS.filter((_, i) => days[i]).join(", ");
}

/* Invite share sheet for a freshly-created SHARED habit — same shape as community's
   TeamShareSheet (copy + OS share), but the link carries both ?team= (so a friend
   joins the mini-team on open) and &ref= (so they're credited as your referral). */
function HabitInviteShareSheet({ habit, link }) {
  const [copied, setCopied] = useHS(false);
  const copyLink = () => { try { navigator.clipboard.writeText(link); } catch (e) {} setCopied(true); setTimeout(() => setCopied(false), 1600); if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} } };
  const shareLink = () => { if (window.bosShare ? !window.bosShare(link, "Делаем привычку «" + (habit?.name || "") + "» вместе в BalanceOS") : true) copyLink(); };
  return (
    <div style={{ padding: "2px 20px 0", color: "var(--text)" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 22, margin: "0 auto 12px", background: (habit?.color && habit?.tint !== false) ? habit.color + "26" : "var(--surface-3)", display: "grid", placeItems: "center", fontSize: 34 }}>{habit?.emoji || "✨"}</div>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.3px" }}>Зовите друга</div>
        <div style={{ fontSize: 13.5, color: "var(--text-3)", marginTop: 4, maxWidth: 290, marginInline: "auto", lineHeight: 1.45 }}>«{habit?.name || "Привычка"}» теперь совместная — отправь ссылку, и друг присоединится.</div>
      </div>
      <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 10, background: "var(--surface-3)", borderRadius: 14, padding: "11px 8px 11px 14px" }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: "var(--text-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{link}</span>
        <button onClick={copyLink} className="tap" style={{ flexShrink: 0, border: 0, background: "var(--text)", color: "var(--card)", borderRadius: 999, padding: "8px 15px", fontSize: 12.5, fontWeight: 600 }}>{copied ? "Готово" : "Копировать"}</button>
      </div>
      <button onClick={shareLink} className="tap" style={{ width: "100%", marginTop: 12, border: 0, borderRadius: 999, padding: 14, background: "var(--text)", color: "var(--card)", fontSize: 15, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <I.Share size={18}/> Поделиться
      </button>
      <div style={{ height: "max(8px, var(--tg-bottom-inset, 0px))" }} />
    </div>
  );
}

const INFO_TOPICS = {
  "habits-basics": {
    emoji: "🌱",
    eyebrow: "5 мин чтения",
    title: "Основы привычек",
    lede: "Привычки держатся не на силе воли. Они держатся на том, чтобы одно маленькое действие давалось почти без усилий — и так каждый день, пока мозг не перестанет спрашивать «зачем».",
    sections: [
      { i: "1", h: "Сделай крошечным", b: "Если не вытянешь её в самый трудный день — она слишком большая. Две минуты медитации каждый день лучше, чем полчаса раз в неделю. Закрепится — будешь растить." },
      { i: "2", h: "Привяжи её", b: "Поставь новую привычку поверх того, что уже делаешь: «После того как налью утренний кофе, я напишу одну строку в дневник». Старая привычка становится пусковым сигналом." },
      { i: "3", h: "Отмечай, чтобы видеть движение", b: "Серия — это твоё обещание самому себе, и его видно. Отмечай привычку даже в трудный день — пусть даже по минимуму. Не рви цепочку." },
      { i: "4", h: "Никогда не пропускай дважды", b: "Один срыв — это восстановление. Два — новый паттерн. Если пропустил день, твоя единственная задача завтра — появиться, хотя бы частично. Восстанавливайся, а не начинай заново." },
      { i: "5", h: "Обустрой пространство", b: "Поставь кроссовки у двери. Убери снеки с глаз долой. Привычки живут в окружении — сделай хорошие очевидными, а плохие — незаметными." },
    ],
    pull: "«Ты не поднимаешься до уровня своих целей. Ты падаешь до уровня своих систем.»",
    next: { topic: "goals-101", t: "Ставь хорошие цели", e: "🎯" },
  },
  "goals-101": {
    emoji: "🎯",
    eyebrow: "5 мин чтения",
    title: "Ставь хорошие цели",
    lede: "Цель — это вопрос, на который отвечают твои привычки. Задай вопрос правильно — и ежедневная работа сама знает, что делать.",
    sections: [
      { i: "1", h: "Результат против процесса", b: "«Пробежать марафон» — это результат. «Бегать 4 раза в неделю» — это процесс. Цель-результат задаёт направление; отслеживай процесс, чтобы реально двигаться." },
      { i: "2", h: "Сделай конкретной", b: "«Быть здоровее» — это желание. «Спать 7,5 часов 6 ночей в неделю к июлю» — это цель. Конкретно значит измеримо, со сроком и честно." },
      { i: "3", h: "Разбей на недели", b: "Цель на 12 недель — это просто 12 недельных целей, сложенных вместе. Раздели гору на холмы, которые можно преодолеть за неделю." },
      { i: "4", h: "Привяжи одну привычку", b: "Каждой цели нужна ежедневная опора. Если не можешь назвать привычку, которая продвигает цель, она будет дрейфовать." },
      { i: "5", h: "Празднуй малое", b: "Половина пути — это настоящий рубеж. Признай это. Мозг, который получает награду за усилия, появляется и завтра." },
    ],
    pull: "«Результаты — это мечты. Привычки — это действие.»",
    next: { topic: "habits-basics", t: "Основы привычек", e: "🌱" },
  },
};

/* ── v197: deeper deps for the moved bricks (ringHaptic, fmtClock, AVATAR_PALETTE) ── */
const AVATAR_PALETTE = ["#7FB3F2","#F4A574","#76D3A0","#B89AF0","#F291AC","#74CFE0","#F5C56B"];

/* Per-habit accent. `null` = base (neutral gray, the project default); a value
   softly tints the icon tile everywhere and fills the stats grid. Kept to calm
   iOS-system hues so coloured habits still read cohesive with the gray ones. */
function fmtClock(sec) {
  const s = Math.max(0, Math.ceil(sec));
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
}
function ringHaptic(kind) {
  try { if (window.tgHaptic) window.tgHaptic(kind); else if (navigator.vibrate) navigator.vibrate(kind === "success" ? [10, 40, 12] : 7); } catch (_) {}
}

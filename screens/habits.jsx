/* HABITS & GOALS screen + HABIT SETTINGS (create/edit) */
const { useState: useHS } = React;

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
const AVATAR_PALETTE = ["#7FB3F2","#F4A574","#76D3A0","#B89AF0","#F291AC","#74CFE0","#F5C56B"];

/* Per-habit accent. `null` = base (neutral gray, the project default); a value
   softly tints the icon tile everywhere and fills the stats grid. Kept to calm
   iOS-system hues so coloured habits still read cohesive with the gray ones. */
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
function fmtClock(sec) {
  const s = Math.max(0, Math.ceil(sec));
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
}
function ringHaptic(kind) {
  try { if (window.tgHaptic) window.tgHaptic(kind); else if (navigator.vibrate) navigator.vibrate(kind === "success" ? [10, 40, 12] : 7); } catch (_) {}
}
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
function ShareHabitSheet({ habit, dark = false }) {
  const { close } = useSheet();
  const app = (typeof useApp === "function") ? useApp() : null;
  const _isLive = app?.mode === "live";
  // The real, live web app — same invite link the «Поделиться приложением» sheet uses.
  const APP_URL = "https://mind3scape.github.io/balanceos";
  const shareLink = async () => {
    try { if (navigator.share) { await navigator.share({ title: "BalanceOS", text: "Делаем привычку «" + (habit?.name || "") + "» вместе в BalanceOS", url: APP_URL }); return; } } catch (e) { return; }
    try { navigator.clipboard.writeText(APP_URL); } catch (e) {}
    if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} }
  };
  const C = dark
    ? { text: "#fff", sub: "rgba(255,255,255,0.5)", tile: "rgba(255,255,255,0.08)", line: "rgba(255,255,255,0.09)", ring: "#1c1c1e" }
    : { text: "#0a0a0a", sub: "rgba(0,0,0,0.5)", tile: "#f1f1f3", line: "rgba(0,0,0,0.06)", ring: "#fff" };
  // Soft pastel palette so each real friend chip still gets a pleasant colour.
  const _FCOLORS = ["#e8c8a8", "#a8b9d4", "#d4b8e8", "#a8d4e8", "#b8e8c8", "#e8b8d4", "#d4c8e8"];
  const _demoFriends = [
    { name: "Анна", i: "А", c: "#e8c8a8", on: true },
    { name: "Марк", i: "М", c: "#a8b9d4", on: true },
    { name: "Лена", i: "Л", c: "#d4b8e8", on: false },
    { name: "Вик",  i: "В", c: "#a8d4e8", on: false },
    { name: "Том",  i: "Т", c: "#b8e8c8", on: false },
  ];
  // LIVE: the user's REAL invited people (referral circle). Demo keeps the 5 faces.
  const [friends, setFriends] = useHS(_isLive ? [] : _demoFriends);
  React.useEffect(() => {
    if (!_isLive || !(window.bosCloud && window.bosCloud.enabled())) return;
    let on = true;
    try {
      window.bosCloud.invitedPeople().then((list) => {
        if (!on || !Array.isArray(list)) return;
        setFriends(list.map((p, idx) => {
          const nm = (p && p.username) ? p.username : "Друг";
          return { name: nm, i: nm.charAt(0).toUpperCase(), c: _FCOLORS[idx % _FCOLORS.length], on: false };
        }));
      }).catch(() => {});
    } catch (e) {}
    return () => { on = false; };
  }, [_isLive]);
  const toggleF = (idx) => setFriends(f => f.map((x, i) => i === idx ? { ...x, on: !x.on } : x));
  // LIVE share targets: only the two that map to a REAL action (OS share sheet /
  // clipboard copy of the invite link). Demo keeps the full curated row.
  const targets = _isLive
    ? [{ e: "💬", t: "Сообщения" }, { e: "🔗", t: "Ссылка" }]
    : [{ e: "💬", t: "Сообщения" }, { e: "🔗", t: "Ссылка" }, { e: "📷", t: "Истории" }, { e: "•••", t: "Ещё" }];
  return (
    <div style={{ padding: "2px 20px 0", color: C.text }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: C.tile, display: "grid", placeItems: "center", fontSize: 30, margin: "0 auto 10px" }}>{habit?.emoji || "✨"}</div>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.3px" }}>Поделиться привычкой</div>
        <div style={{ fontSize: 14, color: C.sub, marginTop: 3 }}>«{habit?.name || "Привычка"}» — зовите друзей делать вместе</div>
      </div>

      {/* Reward hero — the eye lands on what you earn + the influence multiplier */}
      <div style={{ marginTop: 16 }}>
        <XPRewardCard amount={75} reason="когда друг присоединится к этой привычке" mode="habit" dark={dark} />
      </div>

      <div style={{ fontSize: 12, color: C.sub, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, margin: "22px 0 12px" }}>Делать вместе</div>
      {_isLive && friends.length === 0 ? (
        <div style={{ fontSize: 13.5, color: C.sub, lineHeight: 1.45, padding: "2px 2px 4px" }}>Пока некого позвать — пригласи друга по ссылке ниже.</div>
      ) : (
      <div style={{ display: "flex", gap: 14, overflowX: "auto", margin: "0 -20px", padding: "0 20px 4px", scrollbarWidth: "none" }}>
        {friends.map((p, i) => (
          <button key={i} className="tap" data-no-haptic onClick={() => toggleF(i)} style={{ background: "transparent", border: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 7, flexShrink: 0, width: 56, color: C.text }}>
            <span style={{ position: "relative", width: 54, height: 54, borderRadius: "50%", background: p.c, display: "grid", placeItems: "center", fontSize: 19, fontWeight: 700, color: "rgba(0,0,0,0.55)", opacity: p.on ? 1 : 0.45, transition: "opacity 0.2s" }}>
              {p.i}
              {p.on && <span style={{ position: "absolute", right: -2, bottom: -2, width: 20, height: 20, borderRadius: "50%", background: "#34c759", border: "2px solid " + C.ring, display: "grid", placeItems: "center" }}><I.Check size={11} strokeWidth={3} color="#fff" /></span>}
            </span>
            <span style={{ fontSize: 12, color: C.sub }}>{p.name}</span>
          </button>
        ))}
        <button className="tap" onClick={shareLink} style={{ background: "transparent", border: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 7, flexShrink: 0, width: 56, color: C.sub }}>
          <span style={{ width: 54, height: 54, borderRadius: "50%", border: "1.5px dashed " + C.sub, display: "grid", placeItems: "center" }}><I.Plus size={20} /></span>
          <span style={{ fontSize: 12 }}>Позвать</span>
        </button>
      </div>
      )}

      <div style={{ height: 1, background: C.line, margin: "18px 0" }} />

      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        {targets.map((t, i) => (
          <button key={i} onClick={shareLink} className="tap" style={{ flex: 1, background: "transparent", border: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 7, color: C.text }}>
            <span style={{ width: 54, height: 54, borderRadius: "50%", background: C.tile, display: "grid", placeItems: "center", fontSize: 22 }}>{t.e}</span>
            <span style={{ fontSize: 11, color: C.sub }}>{t.t}</span>
          </button>
        ))}
      </div>

      <button className="tap" onClick={close} style={{ width: "100%", marginTop: 22, background: dark ? "#fff" : "#0a0a0a", color: dark ? "#0a0a0a" : "#fff", border: 0, borderRadius: 999, padding: 15, fontSize: 15, fontWeight: 600 }}>Готово</button>
    </div>
  );
}

function HabitsScreen() {
  const { navigate } = useNav();
  const { open: openSheet } = useSheet();
  const app = useApp();
  const wrapRef = React.useRef(null);
  const [isDark, setIsDark] = useHS(false);
  React.useEffect(() => {
    const el = wrapRef.current; if (!el) return;
    let n = el.parentElement;
    while (n && !n.classList.contains("theme-light") && !n.classList.contains("theme-dark")) n = n.parentElement;
    setIsDark(!!(n && n.classList.contains("theme-dark")));
  }, []);

  // Theme tokens — solid surfaces, NO borders. Match Home dark style.
  const TH = isDark ? {
    cardBg: "linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
    chipBg: "rgba(255,255,255,0.06)",
    chipBd: "0",
    iconBg: "rgba(255,255,255,0.08)",
    divider: "rgba(255,255,255,0.06)",
    chipText: "var(--text)",
    plusIcon: "rgba(255,255,255,0.5)",
    pillBg: "rgba(255,255,255,0.06)",
    addBtnBg: "#fff", addBtnFg: "#0a0a0a",
    playBtnBg: "#fff", playBtnFg: "#0a0a0a",
  } : {
    cardBg: "#fff",
    chipBg: "#fff",
    chipBd: "1px solid rgba(0,0,0,0.05)",
    iconBg: "var(--surface-3)",
    divider: "var(--line)",
    chipText: "var(--text-2)",
    plusIcon: "#999",
    pillBg: "#e8e8e8",
    addBtnBg: "#0a0a0a", addBtnFg: "#fff",
    playBtnBg: "var(--text-2)", playBtnFg: "#fff",
  };
  const cardShadow = isDark ? "none" : "0 1px 2px rgba(0,0,0,0.04)";

  const [tab, setTab] = useHS("habits");
  // Shared store — same list the Home screen reads/writes.
  const habits = app?.habits || [];
  const goals = app?.goals || [];
  const toggle = app?.toggleHabit || (() => {});
  const remove = app?.removeHabit || (() => {});
  const rowBg = isDark ? "#141414" : "#ffffff"; // opaque so swipe actions stay hidden until revealed

  return (
    <div ref={wrapRef} className="page-in" style={{ padding: "0 12px 24px" }}>
      {/* Page header removed (experiment) — the «Привычки / Цели» control below
          already names the context; the tab bar shows the section. */}

      {/* Quick add chips — flush, no panel */}
      <div data-tour="presets" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 600, marginBottom: 8, padding: "0 4px" }}>Быстрое добавление</div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch", touchAction: "pan-x", margin: "0 -12px", padding: "0 12px 2px" }}>
          {EMOJI_CHIPS.map((c,i)=>(
            <button key={i} className="tap" data-no-haptic onClick={() => navigate("habit-settings", { mode: "create", preset: c })} style={{
              background: TH.chipBg, borderRadius: 999, padding: "8px 12px", fontSize: 13,
              color: TH.chipText, border: TH.chipBd,
              display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", flexShrink: 0,
              boxShadow: cardShadow,
            }}>
              <span style={{ fontSize: 15, lineHeight: 1 }}>{c.i}</span>
              {c.t} <I.Plus size={12} color={TH.plusIcon}/>
            </button>
          ))}
        </div>
      </div>

      {/* Tabs + Add button */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div className="tab-pill" style={{ background: TH.pillBg, flex: 1 }}>
          <button className={"tap " + (tab === "habits" ? "active" : "")} onClick={() => setTab("habits")}>Привычки</button>
          <button className={"tap " + (tab === "goals" ? "active" : "")} onClick={() => setTab("goals")}>Цели</button>
        </div>
        <button data-tour="add" onClick={() => navigate(tab === "habits" ? "habit-settings" : "goal-settings", { mode: "create" })} className="tap"
          title={tab === "habits" ? "Добавить привычку" : "Добавить цель"}
          style={{ width: 44, height: 44, borderRadius: 999, background: TH.addBtnBg, color: TH.addBtnFg, border: 0, display: "grid", placeItems: "center", boxShadow: isDark ? "none" : "0 4px 14px rgba(0,0,0,0.18)" }}>
          <I.Plus size={18} strokeWidth={2.2}/>
        </button>
      </div>

      {/* Habit / Goal list — unified card with dividers */}
      {tab === "habits" ? (
        habits.length === 0 ? (
          <button className="tap" onClick={() => navigate("habit-settings", { mode: "create" })} style={{ marginTop: 12, width: "100%", background: TH.cardBg, border: 0, borderRadius: 22, padding: "34px 20px", boxShadow: cardShadow, color: "var(--text)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10 }}>
            <span style={{ width: 54, height: 54, borderRadius: 16, background: TH.iconBg, display: "grid", placeItems: "center", fontSize: 27 }}>🌱</span>
            <div style={{ fontSize: 17, fontWeight: 600 }}>Здесь будут твои привычки</div>
            <div style={{ fontSize: 13.5, color: "var(--text-4)", lineHeight: 1.45, maxWidth: 250 }}>Начни с одной маленькой. Её можно делать одному или вместе с друзьями.</div>
            <span style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 6, background: TH.addBtnBg, color: TH.addBtnFg, borderRadius: 999, padding: "10px 18px", fontSize: 14.5, fontWeight: 600 }}><I.Plus size={16} strokeWidth={2.5}/> Создать привычку</span>
          </button>
        ) : (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8, color: "var(--text)" }}>
          {habits.map((h) => (
            <div key={h.id} style={{ borderRadius: 18, overflow: "hidden", boxShadow: cardShadow }}>
              <SwipeRow rowBg={rowBg} dark={isDark} actions={[
                { key: "share", tone: "share", label: "Поделиться", icon: I.Share, onAction: () => openSheet(<ShareHabitSheet habit={h} dark={isDark} />) },
                { key: "del", tone: "delete", label: "Удалить", icon: I.Trash, onAction: () => remove(h.id) },
              ]}>
                <div className="tap"
                  onClick={() => navigate("habit-detail", { habit: h, from: "habits" })}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px" }}>
                  <span style={{ width: 40, height: 40, borderRadius: 12, background: h.color ? h.color + "26" : TH.iconBg, display: "grid", placeItems: "center", fontSize: 20, flexShrink: 0 }}>{h.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, color: "var(--text-2)", letterSpacing: "-0.2px" }}>{h.name}</div>
                    {(h.friends?.length || h.duration) && (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 3, flexWrap: "wrap", fontSize: 11, color: "var(--text-4)" }}>
                        {h.duration && <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><I.Clock size={11}/> {h.duration} мин</span>}
                        {h.friends?.length > 0 && <AvatarStack people={h.friends} size={16} max={3} label={false}/>}
                        {h.friends?.length > 0 && <span>совместно</span>}
                      </div>
                    )}
                  </div>
                  {h.duration && !h.done && (
                    <HabitRing habit={h} dark={isDark} onComplete={() => { if (!h.done) toggle(h.id); }} />
                  )}
                  <HabitCheck done={h.done} onToggle={() => toggle(h.id)} xp={10} />
                </div>
              </SwipeRow>
            </div>
          ))}
        </div>
        )
      ) : (
        goals.length === 0 ? (
          <button className="tap" onClick={() => navigate("goal-settings", { mode: "create" })} style={{ marginTop: 12, width: "100%", background: TH.cardBg, border: 0, borderRadius: 22, padding: "34px 20px", boxShadow: cardShadow, color: "var(--text)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10 }}>
            <span style={{ width: 54, height: 54, borderRadius: 16, background: TH.iconBg, display: "grid", placeItems: "center", fontSize: 27 }}>🎯</span>
            <div style={{ fontSize: 17, fontWeight: 600 }}>Пока нет целей</div>
            <div style={{ fontSize: 13.5, color: "var(--text-4)", lineHeight: 1.45, maxWidth: 250 }}>Цель — это вершина, к которой ведут твои привычки. Поставь первую.</div>
            <span style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 6, background: TH.addBtnBg, color: TH.addBtnFg, borderRadius: 999, padding: "10px 18px", fontSize: 14.5, fontWeight: 600 }}><I.Plus size={16} strokeWidth={2.5}/> Поставить цель</span>
          </button>
        ) : (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8, color: "var(--text)" }}>
          {goals.map((g) => {
            const pct = g.current / g.target;
            return (
              <div key={g.id} style={{ borderRadius: 18, overflow: "hidden", boxShadow: cardShadow, background: TH.cardBg }}>
                <button className="tap" onClick={() => navigate("goal-detail", { goal: g, from: "habits" })}
                  style={{ width: "100%", background: "transparent", border: 0, padding: "14px 16px", textAlign: "left", color: "var(--text)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ width: 40, height: 40, borderRadius: 12, background: TH.iconBg, display: "grid", placeItems: "center", fontSize: 20, flexShrink: 0 }}>{g.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15.5, color: "var(--text-2)", letterSpacing: "-0.2px", fontWeight: 500 }}>{g.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 3, display: "flex", gap: 10 }}>
                        <span>{g.current} / {g.target} {g.unit}</span>
                        <span>·</span>
                        <span>до {g.deadline}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-2)", flexShrink: 0 }}>{Math.round(pct * 100)}%</span>
                  </div>
                  <div className="bos-progress" style={{ marginTop: 10 }}><span style={{ width: (pct * 100) + "%" }}/></div>
                </button>
              </div>
            );
          })}
        </div>
        )
      )}

      {/* Knowledge cards — clickable */}
      <div className="section-label" style={{ marginTop: 22, padding: "0 4px" }}>Обучение</div>
      <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { topic: "habits-basics", emoji: "🌱", t: "Основы привычек", d: "5 мин", b: "Почему маленькое лучше большого — и как не пропускать дважды." },
          { topic: "goals-101",     emoji: "🎯", t: "Ставь хорошие цели", d: "5 мин", b: "Результат или процесс: что отслеживать и когда." },
        ].map((c, i) => (
          <button key={i} onClick={() => navigate("info", { topic: c.topic })} className="tap"
            style={{
              background: TH.cardBg, border: 0, borderRadius: 22, padding: 16, textAlign: "left",
              boxShadow: cardShadow, position: "relative", overflow: "hidden",
              display: "flex", flexDirection: "column", gap: 8, minHeight: 144, color: "var(--text)",
            }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: TH.iconBg, display: "grid", placeItems: "center", fontSize: 20 }}>{c.emoji}</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", lineHeight: 1.2 }}>{c.t}</div>
            <div style={{ fontSize: 12, color: "var(--text-4)", lineHeight: 1.45 }}>{c.b}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", fontSize: 11, color: "var(--text-4)" }}>
              <span>{c.d} чтения</span>
              <I.ChevronRight size={14}/>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* Clean, Apple-style emoji set for habit / goal icons — single-glyph, no skin-
   tone or gender modifiers so they read consistently across the grid. */
const HABIT_ICONS = ["🏃","🚶","🚴","🏊","💪","🧘","🤸","🧗","📖","📚","✍️","🎨","🎵","🎸","💻","🧠","🙏","🧊","💧","🥗","🍎","☕","🚭","😴","☀️","🌙","🔥","🌱","⭐","🎯","❤️","🧭"];

function HabitSettingsScreen() {
  const { navigate, params } = useNav();
  const app = useApp();
  const editing = params?.mode === "edit";
  const preset = params?.preset; // quick-add chip → {i: emoji, t: label}
  const [name, setName] = useHS(editing ? params.habit.name : (preset?.t || "Прогулка"));
  const [iconPick, setIconPick] = useHS(editing ? params.habit.emoji : (preset?.i || "👟"));
  const [showIcons, setShowIcons] = useHS(false);
  const [color, setColor] = useHS(editing ? (params.habit.color ?? null) : null);
  const [goal, setGoal] = useHS(1);
  const [reminderOn, setReminderOn] = useHS(true);
  const [shareOn, setShareOn] = useHS(true);
  const _isLive = app?.mode === "live";
  // Soft pastel palette so each real friend chip still gets a pleasant colour.
  const _FCOLORS = ["#e8c8a8", "#a8b9d4", "#d4b8e8", "#a8d4e8", "#b8e8c8", "#e8b8d4", "#d4c8e8"];
  // LIVE: real invited people (referral circle), nothing pre-selected. Demo keeps the 4 faces.
  const [shareFriends, setShareFriends] = useHS(_isLive ? [] : [
    { name: "Анна", i: "А", c: "#e8c8a8", on: true },
    { name: "Марк", i: "М", c: "#a8b9d4", on: true },
    { name: "Лена", i: "Л", c: "#d4b8e8", on: false },
    { name: "Вик",  i: "В", c: "#a8d4e8", on: false },
  ]);
  React.useEffect(() => {
    if (!_isLive || !(window.bosCloud && window.bosCloud.enabled())) return;
    let on = true;
    try {
      window.bosCloud.invitedPeople().then((list) => {
        if (!on || !Array.isArray(list)) return;
        setShareFriends(list.map((p, idx) => {
          const nm = (p && p.username) ? p.username : "Друг";
          return { name: nm, i: nm.charAt(0).toUpperCase(), c: _FCOLORS[idx % _FCOLORS.length], on: false };
        }));
      }).catch(() => {});
    } catch (e) {}
    return () => { on = false; };
  }, [_isLive]);
  const [type, setType] = useHS("build");

  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title={editing ? "Изменить привычку" : "Новая привычка"} onBack={() => navigate("habits")} />
      {/* Name */}
      <div className="section-label">Название</div>
      <input className="bos-input" value={name} onChange={e => setName(e.target.value)} style={{ marginTop: 8 }} />

      {/* Icon + colour — neutral by default; tap a swatch to tint it */}
      <div className="section-label" style={{ marginTop: 22 }}>Иконка и цвет</div>
      <button className="tap" data-no-haptic onClick={() => setShowIcons(v => !v)}
        style={{ width: "100%", background: "#fff", border: 0, borderRadius: 16, padding: 12, display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", marginTop: 8 }}>
        <div style={{ width: 50, height: 50, borderRadius: 12, background: color ? color + "26" : "var(--surface-3)", display: "grid", placeItems: "center", fontSize: 26, transition: "background 0.2s" }}>{iconPick}</div>
        <div style={{ textAlign: "left", flex: 1 }}>
          <div style={{ fontWeight: 500, fontSize: 16 }}>{name || "Привычка"}</div>
          <div style={{ fontSize: 13, color: "var(--text-4)" }}>{color ? HABIT_COLOR_NAMES[color] : "Базовый"} · {showIcons ? "выбери иконку" : "сменить иконку"}</div>
        </div>
        <I.ChevronRight size={18} color="var(--text-4)" style={{ transform: showIcons ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
      </button>
      {showIcons && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8, marginTop: 10 }}>
          {HABIT_ICONS.map((e) => {
            const on = e === iconPick;
            return (
              <button key={e} className="tap" data-no-haptic onClick={() => { setIconPick(e); setShowIcons(false); }}
                style={{ aspectRatio: "1/1", borderRadius: 14, fontSize: 24, border: 0, cursor: "pointer",
                  background: on ? (color || "#0a0a0a") : "var(--surface-3)",
                  boxShadow: on ? "0 3px 10px rgba(0,0,0,0.18)" : "none",
                  transform: on ? "scale(1.06)" : "none", transition: "transform 0.12s, background 0.12s" }}>
                {e}
              </button>
            );
          })}
        </div>
      )}
      <div style={{ display: "flex", gap: 10, marginTop: 12, padding: "2px 2px 0", flexWrap: "wrap" }}>
        {HABIT_COLORS.map((c) => (
          <button key={c.id} className="tap" data-no-haptic onClick={() => setColor(c.val)}
            style={{ width: 34, height: 34, borderRadius: "50%", background: c.val || "var(--surface-3)", border: 0, display: "grid", placeItems: "center", cursor: "pointer",
              boxShadow: color === c.val ? "0 0 0 2px var(--bg), 0 0 0 4px var(--text)" : (c.val ? "none" : "inset 0 0 0 1px rgba(0,0,0,0.12)") }}>
            {color === c.val && <I.Check size={15} strokeWidth={3} color={c.val ? "#fff" : "var(--text-2)"} />}
          </button>
        ))}
      </div>

      {/* Goal */}
      <div className="section-label" style={{ marginTop: 22 }}>Цель</div>
      <div style={{ background: "#fff", borderRadius: 18, padding: 16, marginTop: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 600 }}>{goal} {goal === 1 ? "раз" : "раз(а)"}</div>
            <div style={{ fontSize: 13, color: "var(--text-4)" }}>или больше в день</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setGoal(Math.max(1, goal - 1))} className="tap" style={{ width: 32, height: 32, borderRadius: 999, background: "var(--surface-3)", border: 0 }}>−</button>
            <button onClick={() => setGoal(goal + 1)} className="tap" style={{ width: 32, height: 32, borderRadius: 999, background: "var(--surface-3)", border: 0 }}>＋</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <span className="chip"><I.Refresh size={14} /> Ежедневно</span>
          <span className="chip"><I.Calendar size={14} /> Каждый день</span>
        </div>
      </div>

      {/* Reminders */}
      <div className="section-label" style={{ marginTop: 22 }}>Напоминания</div>
      <div style={{ background: "#fff", borderRadius: 18, padding: 16, marginTop: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1, fontSize: 14, color: "var(--text-3)", lineHeight: 1.4 }}>
            Не забудь выделить время на тренировку сегодня.
          </div>
          <Switch on={reminderOn} onChange={setReminderOn} />
        </div>
        {reminderOn && (
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <span className="chip"><I.Clock size={14} /> 09:30</span>
            <span className="chip"><I.Bell size={14} /> Каждый день</span>
          </div>
        )}
      </div>

      {/* Share with friend — the most natural referral moment: invite anyone into
          your habit. They join → you earn XP and they're in the app. */}
      <div className="section-label" style={{ marginTop: 8 }}>Поделиться с другом</div>
      <div data-tour="invite-friend" style={{ background: "#fff", borderRadius: 18, padding: 16, marginTop: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, fontSize: 14, color: "var(--text-2)", lineHeight: 1.4 }}>
            Делать это вместе
            <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2 }}>Друзья видят, когда ты отмечаешься. Они могут поддержать или подтолкнуть.</div>
          </div>
          <Switch on={shareOn} onChange={setShareOn} />
        </div>
        <div style={{ marginTop: 12, borderRadius: 14, padding: "11px 12px", background: "#edfaf0", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 30, height: 30, borderRadius: "50%", background: "#d6f3df", display: "grid", placeItems: "center", flexShrink: 0, fontSize: 15 }}>🤝</span>
          <div style={{ fontSize: 12.5, color: "#1a7a3a", lineHeight: 1.4 }}><b>+75 XP</b>, когда друг присоединится. А ведёте вместе — каждый шаг <b>+15</b> вместо +10.</div>
        </div>
        {shareOn && <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap", alignItems: "center" }}>
          {_isLive && shareFriends.length === 0 && (
            <span style={{ fontSize: 12.5, color: "var(--text-4)", lineHeight: 1.4 }}>Пока некого выбрать — пригласи друга по ссылке.</span>
          )}
          {shareFriends.map((p, i) => (
            <button key={i} onClick={() => setShareFriends(fs => fs.map((x, j) => j === i ? { ...x, on: !x.on } : x))} className="tap" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 11px 5px 5px", borderRadius: 999,
              background: p.on ? "#0a0a0a" : "var(--surface-3)",
              color: p.on ? "#fff" : "var(--text-3)",
              border: 0, fontSize: 12, fontWeight: 500,
            }}>
              <span style={{ width: 22, height: 22, borderRadius: "50%", background: p.c, display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, color: "rgba(0,0,0,0.55)" }}>{p.i}</span>
              {p.name}
              {p.on && <I.Check size={12} strokeWidth={3}/>}
            </button>
          ))}
          <button onClick={() => {
            // LIVE: invite a real person via the OS share sheet / link copy (no fake pool).
            if (_isLive) {
              const APP_URL = "https://mind3scape.github.io/balanceos";
              (async () => {
                try { if (navigator.share) { await navigator.share({ title: "BalanceOS", text: "Делаем привычку вместе в BalanceOS", url: APP_URL }); return; } } catch (e) { return; }
                try { navigator.clipboard.writeText(APP_URL); } catch (e) {}
                if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} }
              })();
              return;
            }
            // DEMO: cycle through the sample pool so the showcase stays lively.
            setShareFriends(fs => {
              const pool = [{ name: "Соня", i: "С", c: "#e8b8d4" }, { name: "Дима", i: "Д", c: "#a8c0e8" }, { name: "Аля", i: "А", c: "#d4c8e8" }];
              const next = pool.find(p => !fs.some(f => f.name === p.name));
              return next ? [...fs, { ...next, on: true }] : fs;
            });
          }} className="tap" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "5px 11px", borderRadius: 999,
            background: "transparent", border: "1px dashed rgba(0,0,0,0.18)",
            color: "var(--text-3)", fontSize: 12, fontWeight: 500,
          }}><I.Plus size={12}/> Пригласить</button>
        </div>}
      </div>

      {/* Habit type */}
      <div className="section-label" style={{ marginTop: 22 }}>Тип привычки</div>
      <div style={{ marginTop: 8 }}>
        <Segmented value={type} onChange={setType} options={[{ value: "build", label: "Развивать" }, { value: "quit", label: "Бросить" }]} />
      </div>

      {/* Add */}
      <button className="bos-btn" style={{ marginTop: 20 }} onClick={() => {
        const nm = name.trim() || "Новая привычка";
        if (editing) app?.updateHabit(params.habit.id, { emoji: iconPick, name: nm, color });
        else app?.addHabit({ emoji: iconPick, name: nm, color });
        navigate("habits");
      }}>
        {editing ? "Сохранить" : "Добавить привычку"}
      </button>
      {editing && (
        <button className="tap" onClick={() => { app?.removeHabit(params.habit.id); navigate("habits"); }}
          style={{ width: "100%", background: "transparent", border: 0, color: "var(--accent-red)", padding: 14, marginTop: 6, fontSize: 15 }}>
          Удалить привычку
        </button>
      )}
    </div>
  );
}

window.HabitsScreen = HabitsScreen;
window.HabitSettingsScreen = HabitSettingsScreen;
window.AvatarStack = AvatarStack;
window.ShareHabitSheet = ShareHabitSheet;

/* Inline month calendar in the app's style — pick a goal PERIOD by tapping a
   start day, then an end day (like a booking date range). The distance between
   them is the goal's срок. Returns "14 окт – 21 ноя". 2026 demo year. */
function DeadlineCalendar({ onPick, isLive = false }) {
  const MON_SHORT = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  const MON_TITLE = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  const DAYS_IN = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  // LIVE: real calendar anchored to today. DEMO: frozen "today" = 28 апр 2026 (the showcase date).
  const _now = new Date();
  const TODAY_M = isLive ? _now.getMonth() : 3, TODAY_D = isLive ? _now.getDate() : 28, YEAR = isLive ? _now.getFullYear() : 2026;
  const [m, setM] = useHS(TODAY_M);
  const [start, setStart] = useHS(null); // { m, d }
  const [end, setEnd] = useHS(null);
  const startWeekday = (m * 3 + 3) % 7; // same synthetic alignment the app's other calendars use
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= DAYS_IN[m]; d++) cells.push(d);
  const idx = (p) => p.m * 40 + p.d;                 // monotonic, for ordering
  const doy = (p) => DAYS_IN.slice(0, p.m).reduce((a, b) => a + b, 0) + p.d; // day-of-year, for duration
  const past = (d) => m === TODAY_M && d < TODAY_D;
  const eqp = (p, d) => p && p.m === m && p.d === d;
  const inRange = (d) => start && end && idx({ m, d }) > idx(start) && idx({ m, d }) < idx(end);
  const fmt = (p) => `${p.d} ${MON_SHORT[p.m]}`;
  const pick = (d) => {
    const p = { m, d };
    if (!start || end) { setStart(p); setEnd(null); return; }     // begin a fresh range
    if (idx(p) <= idx(start)) { setStart(p); setEnd(null); return; } // tapped before start → restart
    setEnd(p);                                                     // complete the range
  };
  const span = start && end ? doy(end) - doy(start) : 0;
  const durTxt = span <= 0 ? "" : span < 14 ? `${span} дн.` : span < 60 ? `${Math.round(span / 7)} нед.` : `${Math.round(span / 30)} мес.`;
  const hint = !start ? "Выберите начало срока" : !end ? "Теперь — дату окончания" : `${fmt(start)} – ${fmt(end)} · ${durTxt}`;
  const pager = (dir) => (
    <button className="tap" data-no-haptic disabled={dir < 0 ? m <= TODAY_M : m >= 11} onClick={() => setM(Math.max(TODAY_M, Math.min(11, m + dir)))}
      style={{ width: 30, height: 30, borderRadius: 999, border: 0, background: "var(--surface-3)", opacity: (dir < 0 ? m <= TODAY_M : m >= 11) ? 0.3 : 1, display: "grid", placeItems: "center" }}><I.ChevronRight size={16} style={dir < 0 ? { transform: "rotate(180deg)" } : undefined} /></button>
  );
  return (
    <div style={{ background: "#fff", borderRadius: 18, padding: 14, marginTop: 10, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        {pager(-1)}
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{MON_TITLE[m]} {YEAR}</div>
        {pager(1)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, marginBottom: 4 }}>
        {["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"].map((w) => (
          <div key={w} style={{ textAlign: "center", fontSize: 10.5, color: "var(--text-4)", fontWeight: 600 }}>{w}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const ends = eqp(start, d) || eqp(end, d);
          const mid = inRange(d);
          const today = m === TODAY_M && d === TODAY_D;
          return (
            <button key={i} className="tap" data-no-haptic disabled={past(d)} onClick={() => pick(d)}
              style={{ aspectRatio: "1/1", border: 0, borderRadius: ends ? 999 : (mid ? 7 : 10), cursor: past(d) ? "default" : "pointer",
                background: ends ? "#0a0a0a" : (mid ? "rgba(10,10,10,0.08)" : "transparent"),
                color: ends ? "#fff" : "var(--text)", opacity: past(d) ? 0.3 : 1,
                fontSize: 13.5, fontWeight: (ends || today) ? 700 : 400,
                boxShadow: (today && !ends) ? "inset 0 0 0 1.5px rgba(0,0,0,0.16)" : "none" }}>{d}</button>
          );
        })}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 12, paddingTop: 11, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 12.5, color: (start && end) ? "var(--text)" : "var(--text-4)", fontWeight: (start && end) ? 600 : 400, minWidth: 0 }}>{hint}</div>
        <button className="tap" disabled={!(start && end)} onClick={() => onPick(`${fmt(start)} – ${fmt(end)}`)}
          style={{ flexShrink: 0, background: (start && end) ? "#0a0a0a" : "var(--surface-3)", color: (start && end) ? "#fff" : "var(--text-4)", border: 0, borderRadius: 999, padding: "8px 16px", fontSize: 13, fontWeight: 600 }}>Готово</button>
      </div>
    </div>
  );
}

/* ─── GOAL SETTINGS — create / edit a goal ─────────────────────── */
function GoalSettingsScreen() {
  const { navigate, params } = useNav();
  const app = useApp();
  const editing = params?.mode === "edit";
  const g0 = editing ? params.goal : null;
  const [name, setName] = useHS(g0?.name || "Пробежать марафон");
  const [iconPick, setIconPick] = useHS(g0?.emoji || "🎯");
  const [showIcons, setShowIcons] = useHS(false);
  const [target, setTarget] = useHS(g0?.target || 22);
  const [unit, setUnit] = useHS(g0?.unit || "недель");
  const [deadline, setDeadline] = useHS(g0?.deadline || "Месяц");
  const [showCal, setShowCal] = useHS(false);
  const [linkHabit, setLinkHabit] = useHS(true);
  // REAL for every mode — the user's own habits, none pre-selected. Demo's store is
  // already seeded with sample habits, so the showcase still reads.
  const [linkedHabits, setLinkedHabits] = useHS(() => (app?.habits || []).map((h) => ({ e: h.emoji || "✨", n: h.name, on: false })));
  const toggleLinked = (i) => setLinkedHabits((hs) => hs.map((h, j) => (j === i ? { ...h, on: !h.on } : h)));
  const QUICK_TERMS = ["Неделя", "Месяц", "1 год"];
  const svoyActive = showCal || (!!deadline && !QUICK_TERMS.includes(deadline)); // custom date/range → highlight «Свой срок»

  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title={editing ? "Изменить цель" : "Новая цель"} onBack={() => navigate("habits")} />

      <div className="section-label">Чего ты хочешь</div>
      <input className="bos-input" value={name} onChange={e => setName(e.target.value)} style={{ marginTop: 8 }} placeholder="напр. Пробежать марафон" />

      <div className="section-label" style={{ marginTop: 22 }}>Иконка</div>
      <button className="tap" data-no-haptic onClick={() => setShowIcons(v => !v)}
        style={{ marginTop: 8, width: "100%", background: "#fff", border: 0, borderRadius: 16, padding: 12, display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
        <div style={{ width: 50, height: 50, borderRadius: 12, background: "#e8e8e8", display: "grid", placeItems: "center", fontSize: 26 }}>{iconPick}</div>
        <div style={{ textAlign: "left", flex: 1 }}>
          <div style={{ fontWeight: 500, fontSize: 16 }}>{name || "Цель"}</div>
          <div style={{ fontSize: 13, color: "var(--text-4)" }}>{showIcons ? "выбери иконку" : "нажми, чтобы изменить"}</div>
        </div>
        <I.ChevronRight size={18} color="var(--text-4)" style={{ transform: showIcons ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}/>
      </button>
      {showIcons && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8, marginTop: 10 }}>
          {HABIT_ICONS.map((e) => {
            const on = e === iconPick;
            return (
              <button key={e} className="tap" data-no-haptic onClick={() => { setIconPick(e); setShowIcons(false); }}
                style={{ aspectRatio: "1/1", borderRadius: 14, fontSize: 24, border: 0, cursor: "pointer",
                  background: on ? "#0a0a0a" : "var(--surface-3)",
                  boxShadow: on ? "0 3px 10px rgba(0,0,0,0.18)" : "none",
                  transform: on ? "scale(1.06)" : "none", transition: "transform 0.12s, background 0.12s" }}>
                {e}
              </button>
            );
          })}
        </div>
      )}

      <div className="section-label" style={{ marginTop: 22 }}>Цель (значение)</div>
      <div style={{ background: "#fff", borderRadius: 18, padding: 16, marginTop: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input type="text" inputMode="numeric" pattern="[0-9]*" value={target}
            onChange={e => setTarget(parseInt(e.target.value.replace(/\D/g,"")) || 0)}
            className="goal-num"
            style={{ flex: "0 0 90px", fontSize: 28, fontWeight: 700, color: "var(--text)", border: 0, outline: 0, background: "transparent", padding: 0 }}/>
          <input value={unit} onChange={e => setUnit(e.target.value)}
            style={{ flex: 1, minWidth: 0, fontSize: 18, color: "var(--text-3)", border: 0, outline: 0, background: "transparent", padding: "4px 0" }}/>
        </div>
        <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 6 }}>От этого числа будет считаться прогресс цели.</div>
      </div>

      <div className="section-label" style={{ marginTop: 22 }}>Срок</div>
      <div style={{ background: "#fff", borderRadius: 18, padding: "14px 16px", marginTop: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: 12 }}>
        <I.Calendar size={18} color="var(--text-3)"/>
        <input value={deadline} onChange={e => setDeadline(e.target.value)} placeholder="напр. 14 окт"
          style={{ flex: 1, fontSize: 16, border: 0, outline: 0, background: "transparent" }}/>
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <button onClick={() => setShowCal(v => !v)} className="tap" data-no-haptic
          style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4, borderRadius: 999, padding: "8px 4px", fontSize: 12.5, whiteSpace: "nowrap",
            background: svoyActive ? "#0a0a0a" : "#fff", color: svoyActive ? "#fff" : "var(--text-3)", border: svoyActive ? "0" : "1px solid rgba(0,0,0,0.06)" }}>
          <I.Calendar size={12}/> Свой срок
        </button>
        {QUICK_TERMS.map((q) => {
          const active = !showCal && deadline === q;
          return (
            <button key={q} onClick={() => { setDeadline(q); setShowCal(false); }} className="tap" data-no-haptic
              style={{ flex: 1, borderRadius: 999, padding: "8px 4px", fontSize: 12.5, whiteSpace: "nowrap", textAlign: "center",
                background: active ? "#0a0a0a" : "#fff", color: active ? "#fff" : "var(--text-3)", border: active ? "0" : "1px solid rgba(0,0,0,0.06)" }}>{q}</button>
          );
        })}
      </div>
      {showCal && <DeadlineCalendar isLive={app?.mode === "live"} onPick={(s) => { setDeadline(s); setShowCal(false); }} />}

      <div className="section-label" style={{ marginTop: 22 }}>Привязать привычку</div>
      <div style={{ background: "#fff", borderRadius: 18, padding: 16, marginTop: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.4 }}>Подкрепи эту цель ежедневной привычкой</div>
            <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2 }}>Каждая отметка приближает к цели.</div>
          </div>
          <Switch on={linkHabit} onChange={setLinkHabit}/>
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
                background: h.on ? "#0a0a0a" : "#e8e8e8",
                color: h.on ? "#fff" : "var(--text-3)",
                border: 0, fontSize: 12, fontWeight: 500, transition: "background 0.15s, color 0.15s",
              }}>
                <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#fff", display: "grid", placeItems: "center", fontSize: 13 }}>{h.e}</span>
                {h.n}
                {h.on && <I.Check size={12} strokeWidth={3}/>}
              </button>
            ))}
            <button className="tap" onClick={() => navigate("habit-settings", { mode: "create" })} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 11px", borderRadius: 999,
              background: "transparent", border: "1px dashed rgba(0,0,0,0.18)",
              color: "var(--text-3)", fontSize: 12, fontWeight: 500,
            }}><I.Plus size={12}/> Новая привычка</button>
          </div>
        )}
      </div>

      <button className="bos-btn" style={{ marginTop: 20 }} onClick={() => {
        const data = { emoji: iconPick, name: name.trim() || "Новая цель", target, unit, deadline };
        if (editing) app?.updateGoal(g0.id, data);
        else app?.addGoal(data);
        navigate("habits");
      }}>
        {editing ? "Сохранить" : "Создать цель"}
      </button>
      {editing && (
        <button className="tap" onClick={() => { app?.removeGoal(g0.id); navigate("habits"); }}
          style={{ width: "100%", background: "transparent", border: 0, color: "var(--accent-red)", padding: 14, marginTop: 6, fontSize: 15 }}>
          Удалить цель
        </button>
      )}
    </div>
  );
}

/* ─── INFO SCREEN — knowledge articles ─────────────────────────── */
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
function InfoScreen() {
  const { navigate, params } = useNav();
  const topic = INFO_TOPICS[params?.topic] || INFO_TOPICS["habits-basics"];
  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title={topic.title} onBack={() => navigate("habits")} />
      {/* Hero */}
      <div style={{ background: "#fff", borderRadius: 24, padding: "22px 20px", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "#e8e8e8", display: "grid", placeItems: "center", fontSize: 30, marginBottom: 12 }}>{topic.emoji}</div>
        <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1.4, fontWeight: 600 }}>{topic.eyebrow}</div>
        <div style={{ fontFamily: "var(--bos-title-font)", fontSize: 28, lineHeight: 1.15, letterSpacing: "-0.5px", marginTop: 4, color: "var(--text)" }}>{topic.title}</div>
        <div style={{ fontSize: 15, color: "var(--text-3)", marginTop: 12, lineHeight: 1.55, letterSpacing: "-0.1px" }}>{topic.lede}</div>
      </div>

      {/* Pull quote */}
      <div style={{ background: "#0a0a0a", color: "#fff", borderRadius: 22, padding: "20px 22px", marginTop: 12, position: "relative", overflow: "hidden" }}>
        <div aria-hidden style={{ position: "absolute", top: -10, right: -10, fontSize: 100, opacity: 0.06, fontFamily: "var(--bos-title-font)", lineHeight: 1 }}>"</div>
        <div style={{ fontFamily: "var(--bos-title-font)", fontSize: 18, lineHeight: 1.4, position: "relative" }}>{topic.pull}</div>
      </div>

      {/* Numbered sections */}
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {topic.sections.map((s, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 22, padding: 18, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", display: "flex", gap: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#0a0a0a", color: "#fff", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{s.i}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.2px" }}>{s.h}</div>
              <div style={{ fontSize: 14, color: "var(--text-3)", marginTop: 6, lineHeight: 1.55, textWrap: "pretty" }}>{s.b}</div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button onClick={() => navigate(params?.topic === "goals-101" ? "goal-settings" : "habit-settings", { mode: "create" })} className="tap"
        style={{ width: "100%", background: "#0a0a0a", color: "#fff", border: 0, borderRadius: 999, padding: 16, fontSize: 15, fontWeight: 600, marginTop: 18 }}>
        {params?.topic === "goals-101" ? "Поставить цель" : "Создать привычку"}
      </button>

      {/* Up next */}
      {topic.next && (
        <button onClick={() => navigate("info", { topic: topic.next.topic })} className="tap"
          style={{ marginTop: 12, width: "100%", background: "transparent", border: 0, padding: 0, textAlign: "left" }}>
          <div style={{ background: "#fff", borderRadius: 18, padding: 14, display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: "#e8e8e8", display: "grid", placeItems: "center", fontSize: 20 }}>{topic.next.e}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 600 }}>Далее</div>
              <div style={{ fontSize: 15, fontWeight: 500 }}>{topic.next.t}</div>
            </div>
            <I.ChevronRight size={18} color="var(--text-4)"/>
          </div>
        </button>
      )}
    </div>
  );
}

window.GoalSettingsScreen = GoalSettingsScreen;
window.InfoScreen = InfoScreen;

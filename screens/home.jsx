/* HOME — theme-aware. Streaks, AI bell, customizable widgets, deeper hierarchy */
const { useState: useHomeState } = React;

/* Detect dark/light theme from wrapper class */
function useThemeFlag(ref) {
  const [isDark, setIsDark] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current; if (!el) return;
    let n = el.parentElement;
    while (n && !n.classList.contains("theme-light") && !n.classList.contains("theme-dark")) n = n.parentElement;
    setIsDark(!!(n && n.classList.contains("theme-dark")));
  }, []);
  return isDark;
}

/* Habit checkmark with a floating "+XP" pop on completion — the same reward beat
   as the day-close celebration, but right ON the checkmark so it's always visible
   (even when the top of the screen is scrolled off). Shared by Home + Habits. */
function HabitCheck({ done, onToggle, xp = 10 }) {
  const [tick, setTick] = React.useState(0);
  const onClick = (e) => {
    e.stopPropagation();
    const willComplete = !done;
    onToggle();
    if (willComplete) {
      setTick((t) => t + 1);
      if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (_) {} }
    }
  };
  return (
    <div style={{ position: "relative", flexShrink: 0, display: "grid", placeItems: "center" }}>
      {tick > 0 && (
        <span aria-hidden style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", zIndex: 6, pointerEvents: "none" }}>
          <span key={tick} style={{
            display: "inline-flex", alignItems: "center", gap: 3, whiteSpace: "nowrap",
            background: "#0a0a0a", color: "#FEDE34", fontSize: 11.5, fontWeight: 800,
            padding: "3px 9px", borderRadius: 999, boxShadow: "0 4px 12px rgba(0,0,0,0.28)",
            animation: "bosXpTick 1.2s cubic-bezier(0.22,1,0.36,1) forwards",
          }}>+{xp} XP</span>
        </span>
      )}
      <button className={"check-btn " + (done ? "" : "unchecked")} data-no-haptic onClick={onClick}>
        {done && <I.Check size={18} strokeWidth={2.5} color="#fff" />}
      </button>
    </div>
  );
}
window.HabitCheck = HabitCheck;

/* Balance Wheel — 8-axis radar of life areas with iOS-style icons + zone colors */
function zoneColor(v) {
  if (v >= 0.70) return "#34C759";   // зелёная зона — в балансе
  if (v >= 0.52) return "#FFC400";   // нейтрально
  return "#FF8A3D";                  // оранжевая зона — дефицит, выпирает
}
function BalanceWheel({ size = 122, isDark = false }) {
  const uid = React.useMemo(() => "bw" + Math.random().toString(36).slice(2, 7), []);
  const app = useApp ? useApp() : null;
  const enabled = (app?.wheelSpheres && app.wheelSpheres.length >= 3) ? app.wheelSpheres : (window.DEFAULT_SPHERES || []);
  const axes = (window.ALL_SPHERES || []).filter(s => enabled.includes(s.id));
  const cx = size / 2, cy = size / 2, r = size * 0.40;
  const pad = 30;
  const W = size + pad * 2;
  const ang = (i) => (i / axes.length) * Math.PI * 2 - Math.PI / 2;
  const pt = (i, v, rad = r) => [cx + Math.cos(ang(i)) * rad * v, cy + Math.sin(ang(i)) * rad * v];
  const poly = axes.map((a, i) => { const [x, y] = pt(i, a.v); return (i ? "L" : "M") + x.toFixed(1) + "," + y.toFixed(1); }).join(" ") + "Z";
  const grid = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.055)";
  const chipFill = isDark ? "#1d1d20" : "#ffffff";

  return (
    <svg width={W} height={W} viewBox={`${-pad} ${-pad} ${W} ${W}`} style={{ overflow: "visible", display: "block" }}>
      <defs>
        {/* single warm gradient — clean, not a muddy multi-colour blob */}
        <radialGradient id={uid + "-fill"} cx="50%" cy="46%" r="60%">
          <stop offset="0%"   stopColor="#FFD64A" stopOpacity="0.46"/>
          <stop offset="100%" stopColor="#FF9F45" stopOpacity="0.12"/>
        </radialGradient>
      </defs>
      {/* two quiet rings: the outer bound + a dashed "balance goal" at 0.70.
          No spokes / inner rings — keeps it calm and Apple-clean. */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={grid} strokeWidth="1"/>
      <circle cx={cx} cy={cy} r={r * 0.7} fill="none" stroke={isDark ? "rgba(52,199,89,0.38)" : "rgba(52,199,89,0.34)"} strokeWidth="1" strokeDasharray="2.5 4.5"/>
      {/* the balance shape */}
      <path d={poly} fill={`url(#${uid}-fill)`} stroke="#FFB020" strokeWidth="1.7" strokeLinejoin="round"/>
      {/* vertex dots, colored by zone (green/amber/red) */}
      {axes.map((a, i) => { const [x, y] = pt(i, a.v); return <circle key={i} cx={x} cy={y} r="2.5" fill={zoneColor(a.v)} stroke={chipFill} strokeWidth="1.2"/>; })}
      {/* emoji at the tips */}
      {axes.map((a, i) => {
        const [ox, oy] = pt(i, 1.26);
        return <text key={i} x={ox} y={oy} fontSize="14" textAnchor="middle" dominantBaseline="central">{a.e}</text>;
      })}
    </svg>
  );
}

/* Hero swipe deck — page 1: today's reading, page 2: Balance Wheel */
function HomeHeroSwipe({ navigate, doneCount, totalCount, ringPct, isDark }) {
  const [page, setPage] = useHomeState(0);
  // Ring grows from 0 on appear (and eases to its new value on change).
  const [ringShown, setRingShown] = useHomeState(0);
  React.useEffect(() => { const t = setTimeout(() => setRingShown(ringPct), 80); return () => clearTimeout(t); }, [ringPct]);
  // Stable global handle so the guided tour can flip this deck (e.g. to the
  // balance wheel) — always calls the latest setPage via a ref.
  const setPageRef = React.useRef(setPage); setPageRef.current = setPage;
  React.useEffect(() => { window.__bosHeroPage = (p) => setPageRef.current(p); return () => { if (window.__bosHeroPage) window.__bosHeroPage = null; }; }, []);
  const heroApp = useApp ? useApp() : null;
  // The avatar ring + the glow under it follow the current state orb's colour.
  const mood = heroApp?.mood;
  const moodTint = (mood && typeof tintFromMood === "function") ? tintFromMood(mood.c) : null;
  // "Newbie" = a brand-new account with nothing yet: the demo's fresh showcase OR
  // a real Telegram user (mode "live") who just signed in and has no habits. Both
  // get the warm get-started hero — not the demo's mood brief + balance wheel.
  const newbie = heroApp?.mode === "fresh" || (heroApp?.mode === "live" && (heroApp?.habits?.length || 0) === 0);
  const enabledW = (heroApp?.wheelSpheres && heroApp.wheelSpheres.length >= 3) ? heroApp.wheelSpheres : (window.DEFAULT_SPHERES || []);
  const wAxes = (window.ALL_SPHERES || []).filter(s => enabledW.includes(s.id));
  const avgBalance = wAxes.length ? Math.round(wAxes.reduce((s, a) => s + a.v, 0) / wAxes.length * 100) : 0;
  const weakSpheres = [...wAxes].sort((a, b) => a.v - b.v).slice(0, 2);
  const startX = React.useRef(null);
  const onTouchStart = (e) => { startX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (startX.current == null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (dx < -40 && page < 1) setPage(page + 1);
    if (dx >  40 && page > 0) setPage(page - 1);
    startX.current = null;
  };
  const chipBg   = isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.85)";
  const chipBd   = isDark ? "0" : "1px solid rgba(0,0,0,0.05)";
  const cardBg   = isDark
    ? "linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)"
    : "linear-gradient(160deg, #ffffff 0%, #f5f5f5 100%)";
  const cardBd   = isDark ? "0" : "1px solid rgba(0,0,0,0.04)";
  const ringBg   = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const dotIdle  = isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.18)";
  const dotActive= isDark ? "#fff" : "#0a0a0a";
  // Demo "Balance AI" daily brief — one short line that follows the user's
  // current state (like the orb) + the day's progress. Replaces the old quote.
  const AI_BRIEF = {
    "Энергия":     "Энергии много — берись за самое важное сейчас.",
    "Радость":     "Ты в ресурсе — отличный день, чтобы закрыть серию.",
    "Спокойствие": "Спокойствие — твоё время для глубокого чтения.",
    "Тревога":     "Начни с двух минут дыхания — и день станет легче.",
    "Упадок":      "Сделай одно маленькое дело — этого сегодня достаточно.",
    "Усталость":   "Сбавь темп: закрой одну привычку — и довольно.",
  };
  const aiBrief = (totalCount && doneCount >= totalCount)
    ? "День закрыт — ты в потоке. Так держи ритм."
    : (AI_BRIEF[mood && mood.t] || "Чтение легче даётся вечером — оставь его на потом.");
  // L2 — for LIVE users the summary + pills come from the AI login brief (refreshed
  // at login). Demo keeps its scripted line/chips. The brief always has a heuristic
  // fallback, so this is never empty.
  const _liveBrief = (heroApp?.mode === "live") ? heroApp?.aiBrief : null;
  const _homeSummary = (_liveBrief && _liveBrief.summary) || aiBrief;
  const _livePills = (_liveBrief && Array.isArray(_liveBrief.pills) && _liveBrief.pills.length)
    ? _liveBrief.pills.slice(0, 4) : null;
  const _pillsKey = _livePills ? _livePills.map((p) => p.t).join("|") : "demo"; // change → re-animate
  const _pages = [
    /* Page 1: fresh → compact AI-hints + avatar; demo → quote + avatar + chips */
    newbie ? (
    <div key="hints" style={{ position: "relative", padding: 16, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 13, alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1.2 }}>{_liveBrief ? "Тебе сегодня" : "С чего начать"}</div>
          <div key={_homeSummary} style={{ fontSize: 13.5, color: "var(--text-2)", marginTop: 3, lineHeight: 1.4, letterSpacing: "-0.1px", animation: _liveBrief ? "briefFade 0.5s ease both" : undefined }}>{_liveBrief ? _homeSummary : "Расскажи о себе — и я подскажу, с каких привычек начать."}</div>
        </div>
        <button onClick={() => navigate("profile")} className="tap" title="Открыть профиль"
          style={{ flexShrink: 0, position: "relative", width: 54, height: 54, background: "transparent", border: 0, padding: 0, cursor: "pointer" }}>
          <svg width="54" height="54" viewBox="0 0 54 54" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
            <circle cx="27" cy="27" r="23" stroke={ringBg} strokeWidth="3" fill="none"/>
            <circle cx="27" cy="27" r="23" stroke="#FEDE34" strokeWidth="3" fill="none" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 23} strokeDashoffset={2 * Math.PI * 23 * (1 - ringShown)}
              style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.22,0.61,0.36,1)" }}/>
          </svg>
          {heroApp?.avatar
            ? <div style={{ position: "absolute", inset: 5, borderRadius: "50%", overflow: "hidden", boxShadow: `inset -3px -5px 12px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.08)${moodTint ? `, 0 0 13px ${moodTint[1]}55` : ""}` }}><BosAvatar avatar={heroApp.avatar} size={44}/></div>
            : <div style={{ position: "absolute", inset: 5, borderRadius: "50%",
                background: `url(./assets/sphere.png) center/cover no-repeat, radial-gradient(circle at 30% 30%, ${moodTint ? moodTint[0] : "#ffd97a"}, ${moodTint ? moodTint[2] : "#d97757"})`,
                boxShadow: `inset -3px -5px 12px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.08)${moodTint ? `, 0 0 13px ${moodTint[1]}55` : ""}` }}/>}
        </button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {[
          { i: "🙋", t: "Рассказать о себе", go: () => navigate("ai-chat", { prompt: "Я хочу рассказать о себе — задай мне пару коротких вопросов и подскажи, с каких привычек начать." }) },
          { i: "➕", t: "Создать привычку",  go: () => navigate("habit-settings", { mode: "create" }) },
          { i: "🧭", t: "Как всё устроено",  go: () => navigate("guide") },
          { i: "✨", t: "Спросить ИИ",        go: () => navigate("ai-chat") },
        ].map((c, i) => (
          <button key={i} onClick={c.go} className="tap" style={{
            padding: "6px 12px", fontSize: 12, color: "var(--text-2)",
            background: chipBg, border: chipBd,
            borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 6,
          }}><span>{c.i}</span>{c.t}</button>
        ))}
      </div>
    </div>
    ) : (
    <div key="quote" style={{ position: "relative", height: "100%", padding: 18, boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1.2, display: "inline-flex", alignItems: "center", gap: 5 }}>
            <span style={{ color: "#E0A500" }}>✦</span> {_liveBrief ? "Тебе сегодня" : "Совет дня"}
          </div>
          <div key={_homeSummary} style={{ fontSize: 14, color: "var(--text-2)", marginTop: 5, lineHeight: 1.42, letterSpacing: "-0.1px", animation: "briefFade 0.5s ease both" }}>
            {_homeSummary}
          </div>
        </div>
        <button onClick={() => navigate("profile")} className="tap" title="Открыть профиль"
          style={{ flexShrink: 0, position: "relative", width: 72, height: 72, background: "transparent", border: 0, padding: 0, cursor: "pointer" }}>
          <svg width="72" height="72" viewBox="0 0 72 72" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
            <circle cx="36" cy="36" r="32" stroke={ringBg} strokeWidth="3.5" fill="none"/>
            {/* The fill ring keeps its gold colour (it tracks completed habits);
                only the disc + glow UNDER the avatar follow the mood (below). */}
            <circle cx="36" cy="36" r="32" stroke="#FEDE34" strokeWidth="3.5" fill="none"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 32}
              strokeDashoffset={2 * Math.PI * 32 * (1 - ringShown)}
              style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.22,0.61,0.36,1)" }}/>
          </svg>
          {heroApp?.avatar
            ? <div style={{ position: "absolute", inset: 6, borderRadius: "50%", overflow: "hidden", boxShadow: `inset -3px -5px 12px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.08)${moodTint ? `, 0 0 13px ${moodTint[1]}55` : ""}` }}><BosAvatar avatar={heroApp.avatar} size={60}/></div>
            : <div style={{
                position: "absolute", inset: 6, borderRadius: "50%",
                background: `url(./assets/sphere.png) center/cover no-repeat, radial-gradient(circle at 30% 30%, ${moodTint ? moodTint[0] : "#ffd97a"}, ${moodTint ? moodTint[2] : "#d97757"})`,
                boxShadow: `inset -3px -5px 12px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.08)${moodTint ? `, 0 0 13px ${moodTint[1]}55` : ""}`,
              }}/>}
          <div style={{
            position: "absolute", bottom: -2, right: -4, background: "#0a0a0a", color: "#FEDE34",
            fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 999, border: "2px solid " + (isDark ? "#0a0a0a" : "#fff"),
          }}>{doneCount}/{totalCount}</div>
        </button>
      </div>
      <div key={_pillsKey} style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: "auto", paddingTop: 12, paddingBottom: 14 }}>
        {(_livePills || [
          { i: "✨", t: "ИИ: спланируй день" },
          { i: "🔮", t: "Познай себя" },
          { i: "🧘🏼‍♀️", t: "Медитация 5 мин" },
          { i: "📖", t: "Открыть дневник" },
        ]).map((c, i) => (
          <button key={i} onClick={() => navigate("ai-chat", { prompt: c.t })} className="tap" style={{
            padding: "6px 12px", fontSize: 12, color: "var(--text-2)",
            background: chipBg, border: chipBd,
            borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 6,
            animation: _livePills ? ("briefPop 0.45s cubic-bezier(0.22,0.9,0.3,1.2) both " + (i * 0.06) + "s") : undefined,
          }}><span>{c.i}</span>{c.t}</button>
        ))}
      </div>
    </div>
    ),
    /* Page 2: Balance — clean radar (kept) + per-sphere breakdown that fills the
       space and shows what each sphere is + its % level. Original card height. */
    <div key="wheel" data-tour="balance-wheel" style={{ position: "relative", height: "100%", padding: "14px 16px 14px 8px", boxSizing: "border-box", display: "flex", gap: 6, alignItems: "center" }}>
      <div style={{ flexShrink: 0 }}><BalanceWheel size={112} isDark={isDark} /></div>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1.2 }}>Баланс жизни</span>
          <span style={{ fontSize: 20, color: "var(--text)", fontWeight: 700, letterSpacing: "-0.6px", lineHeight: 1 }}><CountUp value={avgBalance}/><span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-4)" }}>%</span></span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {wAxes.map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontSize: 12, width: 15, textAlign: "center", flexShrink: 0 }}>{a.e}</span>
              <span style={{ fontSize: 11, color: "var(--text-3)", width: 48, flexShrink: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.l}</span>
              <span style={{ flex: 1, height: 5, borderRadius: 999, background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.055)", overflow: "hidden" }}>
                <span style={{ display: "block", height: "100%", width: Math.round(a.v * 100) + "%", borderRadius: 999, background: zoneColor(a.v) }}/>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>,
  ];
  // Newbie: only the get-started page (no balance wheel until there's data).
  const pages = newbie ? _pages.slice(0, 1) : _pages;
  return (
    <div style={{
      background: cardBg,
      border: cardBd,
      borderRadius: 28, position: "relative", overflow: "hidden",
      boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
    }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div style={{ display: "flex", width: "200%", transform: `translateX(${-page * 50}%)`, transition: "transform 0.45s cubic-bezier(0.22,0.61,0.36,1)", minHeight: newbie ? 128 : 196 }}>
        {pages.map((p, i) => <div key={i} style={{ width: "50%", flexShrink: 0 }}>{p}</div>)}
      </div>
      {pages.length > 1 && (
      <div style={{ position: "absolute", bottom: 14, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 5 }}>
        {pages.map((_, i) => (
          <button key={i} onClick={() => setPage(i)} className="tap" style={{
            width: i === page ? 18 : 6, height: 6, borderRadius: 999,
            background: i === page ? dotActive : dotIdle,
            border: 0, transition: "all 0.3s", padding: 0,
          }}/>
        ))}
      </div>
      )}
    </div>
  );
}

function HomeScreen() {
  const { navigate } = useNav();
  const { open: openSheet } = useSheet();
  const app = useApp();
  const widgets = app?.widgets || {};
  const mood = app?.mood;
  const wrapRef = React.useRef(null);
  const isDark = useThemeFlag(wrapRef);
  const [tab, setTab] = useHomeState("habits");
  // Habits + goals come from the shared app store, so a check here shows up
  // on the Habits tab too (and vice versa).
  const habits = app?.habits || [];
  const goals = app?.goals || [];
  const teams = app?.teams || [];
  const userName = app?.userName ?? "";
  // Greeting follows the user's OWN local clock — real morning for whoever opens
  // it in the morning, evening in the evening. No server sync needed: each device
  // already knows its local time.
  const _hr = new Date().getHours();
  const greeting = _hr < 5 ? "Доброй ночи" : _hr < 12 ? "Доброе утро" : _hr < 18 ? "Добрый день" : _hr < 23 ? "Добрый вечер" : "Доброй ночи";
  // Date line under the greeting. LIVE → the device's REAL current date in Russian
  // ("Вторник · 28 апреля"); demo keeps its frozen showcase string.
  let _todayLabel = "Вторник · 28 апреля";
  let _calLabel = "28 апр"; // short form for the Calendar card
  if (app?.mode === "live") {
    try {
      const _wd = new Intl.DateTimeFormat("ru-RU", { weekday: "long" }).format(new Date());
      const _dm = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(new Date());
      _todayLabel = _wd.charAt(0).toUpperCase() + _wd.slice(1) + " · " + _dm;
      _calLabel = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(new Date()).replace(".", "");
    } catch (e) {}
  }
  // A brand-new account (the fresh demo, or a real Telegram user with no habits yet):
  // gets the get-started hero + an engaging level BANNER instead of the dense stat strip.
  const isNewbie = app?.mode === "fresh" || (app?.mode === "live" && ((app?.habits?.length) || 0) === 0);
  const toggle = app?.toggleHabit || (() => {});
  const remove = app?.removeHabit || (() => {});
  const doneCount = habits.filter(h => h.done).length;
  const totalCount = habits.length;
  const ringPct = totalCount ? doneCount / totalCount : 0;
  // Daily XP — real and legible: each habit is +10, closing the whole day adds
  // the +30 "ideal day" bonus. Show what's earned vs. what's still on the table.
  const XP_PER_HABIT = 10, XP_IDEAL_DAY = 30;
  const leftCount = Math.max(0, totalCount - doneCount);
  const dayAllDone = totalCount > 0 && leftCount === 0;
  const xpEarnedToday = doneCount * XP_PER_HABIT + (dayAllDone ? XP_IDEAL_DAY : 0);
  const ruHab = (n) => { const m = n % 10, h = n % 100; return (m === 1 && h !== 11) ? "привычку" : (m >= 2 && m <= 4 && (h < 10 || h >= 20)) ? "привычки" : "привычек"; };
  const ruTeam = (n) => { const m = n % 10, h = n % 100; return (m === 1 && h !== 11) ? "команда" : (m >= 2 && m <= 4 && (h < 10 || h >= 20)) ? "команды" : "команд"; };
  // Live profiles get REAL numbers from the date-keyed habit model (T0.2); demo stays a
  // curated showcase (level 7 / 1240 XP / 27-day streak); a fresh demo shows blanks.
  const _isLive = app?.mode === "live";
  const _liveXP = _isLive ? bosLiveXP(app) : 0;
  const _lvl = bosLevelInfo(_liveXP);
  const dayStreak = app?.mode === "demo" ? 27 : (_isLive ? bosMaxStreak(habits) : 0);

  // Bell red dot. Demo always shows it (scripted alert). LIVE: only light it when
  // there are REAL unread team-chat messages — same signal NotificationsScreen uses
  // (loadMessages per cloud team vs. the per-team "bos:chatread:" timestamp). If the
  // cloud is off or nothing's unread, the dot stays hidden (no fake alert).
  const [hasUnread, setHasUnread] = React.useState(false);
  React.useEffect(() => {
    if (!_isLive || !(window.bosCloud && window.bosCloud.enabled())) { setHasUnread(false); return; }
    let on = true;
    (async () => {
      try {
        const me = await window.bosCloud.uid();
        const cloudTeams = (app?.teams || []).filter((t) => t.cloudId);
        for (const t of cloudTeams) {
          const rows = await window.bosCloud.loadMessages(t.cloudId);
          if (!Array.isArray(rows) || !rows.length) continue;
          const lastRead = Number(localStorage.getItem("bos:chatread:" + t.cloudId) || 0);
          if (rows.some((r) => r && r.user_id !== me && new Date(r.created_at).getTime() > lastRead)) {
            if (on) setHasUnread(true);
            return;
          }
        }
        if (on) setHasUnread(false);
      } catch (e) { if (on) setHasUnread(false); }
    })();
    return () => { on = false; };
  }, [_isLive, teams]);
  const showBellDot = app?.mode === "demo" || hasUnread;

  // Celebration when a habit gets completed: float +XP near the avatar ring,
  // sparkle burst when the whole day closes (doneCount reaches total).
  const [celebrate, setCelebrate] = React.useState(null);
  const prevDoneRef = React.useRef(doneCount);
  React.useEffect(() => {
    if (doneCount > prevDoneRef.current) {
      const full = totalCount > 0 && doneCount === totalCount;
      // Per-habit XP now pops on the checkmark (HabitCheck); the big top-of-screen
      // celebration is reserved for the DAY-CLOSE moment so it never double-pops.
      if (full) {
        setCelebrate({ xp: totalCount * 10 + 30, full: true, key: Date.now() + ":" + doneCount });
        if (window.tgHaptic) { try { window.tgHaptic("heavy"); } catch (e) {} }
        const t = window.setTimeout(() => setCelebrate(null), 2000);
        prevDoneRef.current = doneCount;
        return () => window.clearTimeout(t);
      }
    }
    prevDoneRef.current = doneCount;
  }, [doneCount, totalCount]);

  // Theme tokens
  const cardBg     = isDark ? "rgba(39,39,42,0.55)" : "#fff";
  const cardBorder = "0";
  const chipBg     = isDark ? "rgba(255,255,255,0.06)" : "var(--surface-3)";
  const iconBg     = isDark ? "rgba(255,255,255,0.06)" : "var(--surface-3)";
  const bellIcon   = isDark ? "#fff" : "#0a0a0a";
  const dividerLn  = isDark ? "rgba(255,255,255,0.06)" : "var(--line)";
  const moodGrad   = (c) => isDark
    ? `linear-gradient(135deg, ${c}66 0%, ${c}22 60%, rgba(255,255,255,0.02) 100%)`
    : `linear-gradient(135deg, ${c} 0%, ${c}66 60%, var(--card-fade) 100%)`;
  const cardShadow = isDark ? "none" : "0 1px 2px rgba(0,0,0,0.04)";
  const rowBg = isDark ? "#1b1b1e" : "#ffffff"; // opaque so swipe actions stay hidden until revealed

  return (
    <div ref={wrapRef} className="page-in" style={{ padding: "0 12px 24px" }}>
      {/* Top bar — greeting + bell */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 4px 12px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: "var(--text-4)", letterSpacing: 0.4 }}>{_todayLabel}</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.6px", marginTop: 2, fontFamily: "var(--bos-title-font)" }}>{userName ? greeting + ", " + userName : greeting + " 👋"}</div>
        </div>
        <button onClick={() => navigate("notifications", { from: "home" })} className="tap"
          style={{ width: 42, height: 42, borderRadius: 14, background: iconBg, border: 0, display: "grid", placeItems: "center", position: "relative" }}>
          <I.Bell size={18} color={bellIcon}/>
          {showBellDot && (
          <span style={{ position: "absolute", top: 8, right: 10, width: 8, height: 8, borderRadius: "50%", background: "var(--accent-red)", border: "2px solid " + (isDark ? "#0a0a0a" : "#fff") }} />
          )}
        </button>
      </div>

      <div data-tour="aihints" style={{ position: "relative" }}>
        <HomeHeroSwipe navigate={navigate} doneCount={doneCount} totalCount={totalCount} ringPct={ringPct} isDark={isDark} />
        {celebrate && (
          <div key={celebrate.key} aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 6, overflow: "visible" }}>
            <div style={{ position: "absolute", top: 66, right: 16, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 5,
              background: "#0a0a0a", color: "#FEDE34", fontSize: celebrate.full ? 13 : 12, fontWeight: 800,
              padding: celebrate.full ? "7px 12px" : "5px 10px", borderRadius: 999, boxShadow: "0 8px 22px rgba(0,0,0,0.3)",
              animation: "bosXpPop 1.15s cubic-bezier(0.22,1,0.36,1) forwards" }}>
              ✦ +{celebrate.xp} XP{celebrate.full ? " · день закрыт" : ""}
            </div>
            {celebrate.full && [0,1,2,3,4,5,6,7].map(i => {
              const a = (i / 8) * Math.PI * 2;
              return <span key={i} style={{ position: "absolute", top: 52, right: 52, width: 5, height: 5, borderRadius: "50%",
                background: "#FEDE34", boxShadow: "0 0 6px #FEDE34", animation: "bosSpark 0.9s ease-out forwards",
                ["--sx"]: Math.cos(a) * 44 + "px", ["--sy"]: Math.sin(a) * 44 + "px" }}/>;
            })}
          </div>
        )}
      </div>

      {/* New user: an engaging gold LEVEL banner right under "С чего начать" — turns
          the bare stat into a hook ("every habit is XP — learn how to grow"). */}
      {isNewbie && (
        <button onClick={() => navigate("levels")} className="tap" style={{
          marginTop: 12, width: "100%", border: 0, borderRadius: 22, padding: "15px 17px",
          background: "linear-gradient(135deg,#FEDE34,#EF9F14)", color: "#0a0a0a",
          display: "flex", alignItems: "center", gap: 13, textAlign: "left", boxShadow: "0 10px 26px rgba(239,159,20,0.30)",
        }}>
          <span style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(255,255,255,0.5)", display: "grid", placeItems: "center", flexShrink: 0, fontSize: 22 }}>🏆</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 15.5, fontWeight: 700, letterSpacing: "-0.2px" }}>Уровень 1</span>
              <span style={{ fontSize: 11.5, fontWeight: 700, opacity: 0.55 }}>0 XP</span>
            </div>
            <div style={{ fontSize: 12.5, color: "rgba(0,0,0,0.62)", marginTop: 2, lineHeight: 1.35 }}>Каждая привычка — это опыт. Узнай, как расти →</div>
            <span style={{ display: "block", height: 5, borderRadius: 999, background: "rgba(0,0,0,0.14)", overflow: "hidden", marginTop: 8 }}>
              <span style={{ display: "block", height: "100%", width: "4%", borderRadius: 999, background: "rgba(0,0,0,0.82)" }}/>
            </span>
          </div>
          <I.ChevronRight size={20} color="rgba(0,0,0,0.45)" />
        </button>
      )}

      {/* MOOD WIDGET — living card with breathing orb + last-7-days mood trail */}
      {widgets.mood !== false && mood && <MoodWidget mood={mood} app={app} isDark={isDark} navigate={navigate} />}

      {/* Stat strip — full strip for demo / users with data. A newbie gets the
          engaging level banner above instead (no bare "Сегодня 0/0" to deflate them). */}
      {!isNewbie && (widgets.streak !== false || widgets.level !== false) && (
      <div style={{ display: "grid", gridTemplateColumns: widgets.streak !== false && widgets.level !== false ? "1.2fr 1fr 1fr" : (widgets.streak !== false || widgets.level !== false ? "1fr 1fr" : "1fr"), gap: 8, marginTop: 12 }}>
        {widgets.streak !== false && (
        <button onClick={() => navigate("history")} className="tap" style={{ background: cardBg, border: cardBorder, borderRadius: 18, padding: "12px 14px", textAlign: "left", display: "flex", flexDirection: "column", gap: 6, boxShadow: cardShadow, color: "var(--text)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 16 }}>🔥</span>
            <span style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Серия</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.5px" }}><CountUp value={dayStreak}/><span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-4)" }}> дн.</span></div>
        </button>
        )}
        <div style={{ background: cardBg, border: cardBorder, borderRadius: 18, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6, boxShadow: cardShadow, color: "var(--text)" }}>
          <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Сегодня</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px" }}><CountUp value={doneCount}/></span>
            <span style={{ fontSize: 13, color: "var(--text-4)" }}>/ {totalCount}</span>
          </div>
        </div>
        {widgets.level !== false && (
        <button data-tour="level" onClick={() => navigate("levels")} className="tap" style={{ background: "linear-gradient(135deg,#FEDE34,#EF9F14)", border: 0, borderRadius: 18, padding: "12px 14px", textAlign: "left", display: "flex", flexDirection: "column", gap: 6, color: "#0a0a0a" }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, opacity: 0.7 }}>Уровень</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
            <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px" }}><CountUp value={app?.mode === "demo" ? 7 : (_isLive ? _lvl.level : 1)}/></span>
            <span style={{ fontSize: 10.5, opacity: 0.62, fontWeight: 700 }}>{app?.mode === "demo" ? "1 240 XP" : (_isLive ? (_liveXP + " XP") : "0 XP")}</span>
          </div>
          <span style={{ display: "block", height: 4, borderRadius: 999, background: "rgba(0,0,0,0.16)", overflow: "hidden", marginTop: 1 }}>
            <span style={{ display: "block", height: "100%", width: (app?.mode === "demo" ? 83 : (_isLive ? _lvl.pct : 4)) + "%", borderRadius: 999, background: "rgba(0,0,0,0.82)" }}/>
          </span>
        </button>
        )}
      </div>
      )}

      {/* Calendar + Community */}
      {(widgets.calendar !== false || widgets.team !== false) && (
      <div style={{ display: "grid", gridTemplateColumns: widgets.calendar !== false && widgets.team !== false ? "1fr 1fr" : "1fr", gap: 8, marginTop: 8 }}>
        {widgets.calendar !== false && (
        <button className="tap" onClick={() => navigate("history")}
          style={{ background: cardBg, border: cardBorder, borderRadius: 18, padding: "14px 14px 12px", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: cardShadow, color: "var(--text)" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Календарь</div>
            <div style={{ fontSize: 14, color: "var(--text-2)", marginTop: 4, fontWeight: 500 }}>{_calLabel}</div>
          </div>
          <I.Calendar size={28} color={isDark ? "rgba(255,255,255,0.7)" : "#787878"} strokeWidth={1.5} />
        </button>
        )}
        {widgets.team !== false && (
        <button className="tap" onClick={() => navigate("community")}
          style={{ background: cardBg, border: cardBorder, borderRadius: 18, padding: "14px 14px 12px", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: cardShadow, color: "var(--text)" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Команды</div>
            <div style={{ fontSize: 14, color: "var(--text-2)", marginTop: 4, fontWeight: 500 }}>{teams.length ? teams.length + " " + ruTeam(teams.length) : "Создай команду"}</div>
          </div>
          {teams.length > 0 ? (
          <div style={{ display: "flex" }}>
            {teams.slice(0, 4).map((t, i) => (
              <span key={t._id || i} title={t.name} style={{ width: 28, height: 28, borderRadius: "50%", background: t.accent || "var(--surface-3)", border: "2px solid " + (isDark ? "#0a0a0a" : "#fff"), marginLeft: i ? -10 : 0, display: "grid", placeItems: "center", fontSize: 14, lineHeight: 1 }}>{t.emblem || "👥"}</span>
            ))}
          </div>
          ) : (
          <span style={{ width: 30, height: 30, borderRadius: "50%", background: isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)", display: "grid", placeItems: "center", color: "var(--text-3)" }}><I.Plus size={16}/></span>
          )}
        </button>
        )}
      </div>
      )}

      {/* Habits / Goals tabs — adding lives on the Habits page (its own "+"), so
         the home screen stays calm and uncluttered (no duplicate create button). */}
      <div style={{ marginTop: 14 }}>
        <div className="tab-pill" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "#e8e8e8" }}>
          <button className={"tap " + (tab === "habits" ? "active" : "")} onClick={() => setTab("habits")}>Привычки</button>
          <button className={"tap " + (tab === "goals" ? "active" : "")} onClick={() => setTab("goals")}>Цели</button>
        </div>
      </div>

      {/* Habit/goal list */}
      {tab === "habits" ? (
        habits.length === 0 ? (
          <button className="tap" onClick={() => navigate("habit-settings", { mode: "create" })} style={{ marginTop: 10, width: "100%", background: cardBg, border: cardBorder, borderRadius: 22, padding: "30px 20px", boxShadow: cardShadow, color: "var(--text)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10 }}>
            <span style={{ width: 52, height: 52, borderRadius: 16, background: iconBg, display: "grid", placeItems: "center", fontSize: 26 }}>🌱</span>
            <div style={{ fontSize: 16, fontWeight: 600 }}>Здесь будут твои привычки</div>
            <div style={{ fontSize: 13, color: "var(--text-4)", lineHeight: 1.45, maxWidth: 235 }}>Начни с одной маленькой — например, стакан воды утром.</div>
            <span style={{ marginTop: 4, display: "inline-flex", alignItems: "center", gap: 6, background: isDark ? "#fff" : "#0a0a0a", color: isDark ? "#0a0a0a" : "#fff", borderRadius: 999, padding: "9px 16px", fontSize: 14, fontWeight: 600 }}><I.Plus size={15} strokeWidth={2.5}/> Создать привычку</span>
          </button>
        ) : (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8, color: "var(--text)" }}>
          {habits.map((h) => (
            <div key={h.id} style={{ borderRadius: 18, overflow: "hidden", boxShadow: cardShadow }}>
              <SwipeRow rowBg={rowBg} dark={isDark} actions={[
                { key: "share", tone: "share", label: "Поделиться", icon: I.Share, onAction: () => openSheet(<ShareHabitSheet habit={h} dark={isDark} />) },
                { key: "del", tone: "delete", label: "Удалить", icon: I.Trash, onAction: () => remove(h.id) },
              ]}>
                <div className="tap" onClick={() => navigate("habit-detail", { habit: h, from: "home" })} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px" }}>
                  <span style={{ width: 40, height: 40, borderRadius: 12, background: h.color ? h.color + "26" : iconBg, display: "grid", placeItems: "center", fontSize: 20, flexShrink: 0 }}>{h.emoji}</span>
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
                  <HabitCheck done={h.done} onToggle={() => toggle(h.id)} xp={XP_PER_HABIT} />
                </div>
              </SwipeRow>
            </div>
          ))}
        </div>
        )
      ) : (
        goals.length === 0 ? (
          <button className="tap" onClick={() => navigate("goal-settings", { mode: "create" })} style={{ marginTop: 10, width: "100%", background: cardBg, border: cardBorder, borderRadius: 22, padding: "30px 20px", boxShadow: cardShadow, color: "var(--text)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10 }}>
            <span style={{ width: 52, height: 52, borderRadius: 16, background: iconBg, display: "grid", placeItems: "center", fontSize: 26 }}>🎯</span>
            <div style={{ fontSize: 16, fontWeight: 600 }}>Пока нет целей</div>
            <div style={{ fontSize: 13, color: "var(--text-4)", lineHeight: 1.45, maxWidth: 235 }}>Большая цель — это маленькие привычки, сложенные вместе.</div>
            <span style={{ marginTop: 4, display: "inline-flex", alignItems: "center", gap: 6, background: isDark ? "#fff" : "#0a0a0a", color: isDark ? "#0a0a0a" : "#fff", borderRadius: 999, padding: "9px 16px", fontSize: 14, fontWeight: 600 }}><I.Plus size={15} strokeWidth={2.5}/> Поставить цель</span>
          </button>
        ) : (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          {goals.map(g => {
            const pct = g.target ? g.current / g.target : 0;
            return (
            <div key={g.id} className="tap" onClick={() => navigate("goal-detail", { goal: g, from: "home" })} style={{ background: cardBg, border: cardBorder, borderRadius: 18, padding: 14, boxShadow: cardShadow, color: "var(--text)", cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <span style={{ width: 38, height: 38, borderRadius: 11, background: iconBg, display: "grid", placeItems: "center", fontSize: 18 }}>{g.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, color: "var(--text-2)", fontWeight: 500 }}>{g.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-4)" }}>{g.current} / {g.target} {g.unit}</div>
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-2)" }}>{Math.round(pct*100)}%</span>
              </div>
              <div className="bos-progress"><span style={{ width: (pct*100) + "%" }} /></div>
            </div>
            );
          })}
        </div>
        )
      )}

      {/* New-user "what's next" banner — opens the single "О приложении" page:
         the whole product on one calm screen, so the first run can stay tiny. */}
      {app?.mode === "fresh" && (
        <button onClick={() => navigate("guide")} className="tap" data-no-haptic
          style={{ marginTop: 12, width: "100%", textAlign: "left", border: isDark ? "0" : "1px solid rgba(70,120,190,0.14)", borderRadius: 22, padding: "15px 16px",
            background: isDark ? "linear-gradient(135deg, rgba(122,164,208,0.20), rgba(122,164,208,0.05))" : "linear-gradient(135deg, #eef3fc 0%, #dfe9f8 100%)",
            color: "var(--text)", display: "flex", alignItems: "center", gap: 13 }}>
          <span style={{ width: 44, height: 44, borderRadius: 14, background: isDark ? "rgba(255,255,255,0.08)" : "#fff", display: "grid", placeItems: "center", flexShrink: 0, fontSize: 22, boxShadow: isDark ? "none" : "0 2px 8px rgba(120,150,200,0.2)" }}>🧭</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15.5, fontWeight: 600, letterSpacing: "-0.2px" }}>Что дальше?</div>
            <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 2, lineHeight: 1.4 }}>Команды, тренинги, цели — обо всём коротко на одной странице</div>
          </div>
          <I.ChevronRight size={20} color="var(--text-4)" />
        </button>
      )}


      {/* Invite / share the app — a focused dark CTA (stands apart from the white
         habit cards above) that ties sharing to the reward loop: friend → XP → level. */}
      <button data-tour="share-app" className="tap" onClick={() => openSheet(<ShareAppSheet dark={isDark} />)}
        style={{ marginTop: 12, width: "100%", borderRadius: 22, padding: "16px 18px", border: 0, position: "relative", overflow: "hidden",
          background: "linear-gradient(135deg, #34508c 0%, #1d2c4d 100%)", boxShadow: "0 10px 26px rgba(20,40,80,0.28)",
          color: "#fff", display: "flex", alignItems: "center", gap: 14, textAlign: "left" }}>
        <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 86% 10%, rgba(255,255,255,0.16) 0%, transparent 52%)", pointerEvents: "none" }} />
        <span style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(255,255,255,0.14)", display: "grid", placeItems: "center", flexShrink: 0, color: "#fff", position: "relative" }}>
          <I.Share size={20} />
        </span>
        <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ fontSize: 15.5, fontWeight: 700, color: "#fff", letterSpacing: "-0.2px" }}>Позови своих</div>
            <span style={{ display: "inline-flex", alignItems: "center", fontSize: 10.5, fontWeight: 800, color: "#0a0a0a", background: "linear-gradient(135deg, #FEDE34, #EF9F14)", padding: "2px 8px", borderRadius: 999, flexShrink: 0 }}>+XP</span>
          </div>
          <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.74)", marginTop: 3, lineHeight: 1.35 }}>Вместе легче — и за каждого друга XP к новому уровню</div>
        </div>
        {/* Demo shows sample faces (Catя/Вика/Лёша) as a teaser. A LIVE user has no
            such people yet, so we show a neutral "add people" glyph — never fake names. */}
        <div style={{ display: "flex", flexShrink: 0, position: "relative" }}>
          {app?.mode === "live" ? (
            <span style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.16)", border: "2px solid rgba(255,255,255,0.3)", display: "grid", placeItems: "center", color: "#fff" }}><I.Plus size={16} strokeWidth={2.5} /></span>
          ) : (
            [{ c: "#e8c8a8", i: "А" }, { c: "#a8d4e8", i: "В" }, { c: "#d4b8e8", i: "Л" }].map((p, idx) => (
              <span key={idx} style={{ width: 30, height: 30, borderRadius: "50%", background: p.c, border: "2px solid #fff", marginLeft: idx ? -10 : 0, display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700, color: "rgba(0,0,0,0.55)" }}>{p.i}</span>
            ))
          )}
        </div>
      </button>
    </div>
  );
}

/* ── Share-the-app sheet (slides up from the home "Поделиться приложением") ── */
function ShareAppSheet({ dark = false }) {
  const { close } = useSheet();
  const app = (typeof useApp === "function") ? useApp() : null;
  const invited = app?.mode === "demo" ? 2 : 0; // demo: 1 away from the 3-milestone
  const [copied, setCopied] = useHomeState(false);
  // The real, live web app — works on any phone, also opens fine from Telegram.
  const APP_URL = "https://mind3scape.github.io/balanceos";
  const copyLink = () => {
    try { navigator.clipboard.writeText(APP_URL); } catch (e) {}
    setCopied(true); window.setTimeout(() => setCopied(false), 1600);
    if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} }
  };
  const shareLink = async () => {
    try { if (navigator.share) { await navigator.share({ title: "BalanceOS", text: "Держим баланс вместе — BalanceOS", url: APP_URL }); return; } } catch (e) { return; }
    copyLink();
  };
  const C = dark
    ? { text: "#fff", sub: "rgba(255,255,255,0.5)", tile: "rgba(255,255,255,0.08)", line: "rgba(255,255,255,0.09)" }
    : { text: "#0a0a0a", sub: "rgba(0,0,0,0.5)", tile: "#f1f1f3", line: "rgba(0,0,0,0.06)" };
  const _isLive = app?.mode === "live";
  // Soft pastel palette so each real friend chip still gets a pleasant colour.
  const _FCOLORS = ["#f0c8a8", "#a8c0e8", "#e8b8d4", "#b8e8c8", "#d4c8e8", "#a8d4e8", "#e8d0a8"];
  const _demoFriends = [
    { name: "Катя", i: "К", c: "#f0c8a8" }, { name: "Дима", i: "Д", c: "#a8c0e8" },
    { name: "Соня", i: "С", c: "#e8b8d4" }, { name: "Ник", i: "Н", c: "#b8e8c8" }, { name: "Аля", i: "А", c: "#d4c8e8" },
  ];
  // LIVE: the user's REAL invited people (referral circle). Demo keeps the 5 faces.
  const [liveFriends, setLiveFriends] = React.useState([]);
  React.useEffect(() => {
    if (!_isLive || !(window.bosCloud && window.bosCloud.enabled())) return;
    let on = true;
    try {
      window.bosCloud.invitedPeople().then((list) => {
        if (!on || !Array.isArray(list)) return;
        setLiveFriends(list.map((p, idx) => {
          const nm = (p && p.username) ? p.username : "Друг";
          return { name: nm, i: nm.charAt(0).toUpperCase(), c: _FCOLORS[idx % _FCOLORS.length] };
        }));
      }).catch(() => {});
    } catch (e) {}
    return () => { on = false; };
  }, [_isLive]);
  const friends = _isLive ? liveFriends : _demoFriends;
  // LIVE share targets: only the two that map to a REAL action (the OS share sheet /
  // clipboard copy of the invite link). Demo keeps the full curated row.
  const targets = _isLive
    ? [{ e: "💬", t: "Сообщения" }, { e: "🔗", t: "Ссылка" }]
    : [{ e: "💬", t: "Сообщения" }, { e: "🔗", t: "Ссылка" }, { e: "📷", t: "Истории" }, { e: "•••", t: "Ещё" }];
  return (
    <div style={{ padding: "2px 20px 0", color: C.text }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", margin: "0 auto 12px",
          background: "radial-gradient(circle at 37% 29%, #ffffff 0%, #dbe6f6 14%, #7aa4d0 46%, #3f5f86 72%, #243b5c 100%)",
          boxShadow: "0 8px 24px rgba(122,164,208,0.42)" }} />
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.3px" }}>Поделиться BalanceOS</div>
        <div style={{ fontSize: 14, color: C.sub, marginTop: 3 }}>Вместе держать баланс проще — позови друга</div>
      </div>

      {/* Reward hero — the first thing the eye lands on: what you earn + the multiplier */}
      <div style={{ marginTop: 18 }}>
        <XPRewardCard amount={150} reason="когда друг начнёт пользоваться приложением" dark={dark} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.tile, borderRadius: 14, padding: "11px 14px", marginTop: 14 }}>
        <span style={{ fontSize: 16 }}>🔗</span>
        <div style={{ flex: 1, fontSize: 14, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>mind3scape.github.io/balanceos</div>
        <button onClick={copyLink} className="tap" style={{ background: copied ? "#34C759" : (dark ? "#fff" : "#0a0a0a"), color: copied ? "#fff" : (dark ? "#0a0a0a" : "#fff"), border: 0, borderRadius: 999, padding: "7px 14px", fontSize: 13, fontWeight: 600, transition: "background 0.2s", whiteSpace: "nowrap" }}>{copied ? "Скопировано ✓" : "Копировать"}</button>
      </div>

      {/* Friends row — demo shows sample faces; live shows the real referral circle.
          Hidden entirely for a live user who hasn't invited anyone yet (only the
          invite-link + share targets remain). */}
      {friends.length > 0 && (<>
      <div style={{ fontSize: 12, color: C.sub, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, margin: "20px 0 12px" }}>{_isLive ? "Твой круг" : "Предложить друзьям"}</div>
      <div style={{ display: "flex", gap: 14, overflowX: "auto", margin: "0 -20px", padding: "0 20px 4px", scrollbarWidth: "none" }}>
        {friends.map((p, i) => (
          <button key={i} onClick={_isLive ? shareLink : undefined} className="tap" data-no-haptic style={{ background: "transparent", border: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 7, flexShrink: 0, width: 56, color: C.text }}>
            <span style={{ width: 54, height: 54, borderRadius: "50%", background: p.c, display: "grid", placeItems: "center", fontSize: 19, fontWeight: 700, color: "rgba(0,0,0,0.55)" }}>{p.i}</span>
            <span style={{ fontSize: 12, color: C.sub, maxWidth: 56, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
          </button>
        ))}
      </div>

      <div style={{ height: 1, background: C.line, margin: "18px 0" }} />
      </>)}

      <div style={{ display: "flex", justifyContent: targets.length >= 4 ? "space-between" : "flex-start", gap: targets.length >= 4 ? 8 : 18, marginTop: friends.length > 0 ? 0 : 18 }}>
        {targets.map((t, i) => (
          <button key={i} onClick={shareLink} className="tap" style={{ flex: targets.length >= 4 ? 1 : "0 0 auto", width: targets.length >= 4 ? undefined : 64, background: "transparent", border: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 7, color: C.text }}>
            <span style={{ width: 54, height: 54, borderRadius: "50%", background: C.tile, display: "grid", placeItems: "center", fontSize: 22 }}>{t.e}</span>
            <span style={{ fontSize: 11, color: C.sub }}>{t.t}</span>
          </button>
        ))}
      </div>

      <button className="tap" onClick={close} style={{ width: "100%", marginTop: 22, background: dark ? "#fff" : "#0a0a0a", color: dark ? "#0a0a0a" : "#fff", border: 0, borderRadius: 999, padding: 15, fontSize: 15, fontWeight: 600 }}>Готово</button>
    </div>
  );
}

/* Home customization screen — pick widgets (wired to global app.widgets) */
function HomeCustomizeScreen() {
  const { navigate } = useNav();
  const app = useApp();
  const widgets = app?.widgets || {};
  const isDark = app?.themeOverride === "dark";
  const setOne = (id, v) => app?.setWidgets({ ...widgets, [id]: v });
  // Only widgets that REALLY exist and are wired into the home render. The old
  // quote/ai/weather/books toggles did nothing — removed so every switch works.
  const opts = [
    { id: "mood",     i: "💭", t: "Состояние", d: "Твоё самочувствие — нажми, чтобы обновить" },
    { id: "streak",   i: "🔥", t: "Счётчик серии", d: "Дней подряд" },
    { id: "level",    i: "🏆", t: "Уровень и опыт", d: "Прогресс и награды" },
    { id: "calendar", i: "📅", t: "Календарь", d: "Сегодняшняя дата" },
    { id: "team",     i: "👥", t: "Команды", d: "Активные команды" },
  ];
  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title="Виджеты главного" onBack={() => navigate("settings")} />
      <div className="bos-sys-text-3" style={{ fontSize: 13, marginBottom: 14, lineHeight: 1.5, padding: "0 2px" }}>
        Включай и выключай карточки на главном. Сводка и аватар сверху — всегда на месте.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {opts.map(o => (
          <div key={o.id} className="bos-sys-card" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
            <span className="bos-sys-chip-bg" style={{ width: 38, height: 38, borderRadius: 11, display: "grid", placeItems: "center", fontSize: 18, flexShrink: 0 }}>{o.i}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 500 }}>{o.t}</div>
              <div className="bos-sys-text-3" style={{ fontSize: 12 }}>{o.d}</div>
            </div>
            <Switch on={widgets[o.id] !== false} onChange={(v) => setOne(o.id, v)} dark={isDark} />
          </div>
        ))}
      </div>
    </div>
  );
}

window.HomeScreen = HomeScreen;
window.HomeCustomizeScreen = HomeCustomizeScreen;

/* MoodWidget — breathing aurora orb + last-7-days mood trail.
   Theme-aware: in dark, deeper inky background with luminous orb;
   in light, soft pastel band with the same orb. */
function MoodWidget({ mood, app, isDark, navigate }) {
  // Last 7 days. Live → REAL date keys (so state marks accumulate per real day);
  // demo → curated numeric days. Each item carries its own weekday letter.
  const _WD = ["В", "П", "В", "С", "Ч", "П", "С"];
  const _liveTrail = app?.mode === "live";
  const last7 = _liveTrail
    ? [6, 5, 4, 3, 2, 1, 0].map(off => {
        const key = (typeof bosDayKeyOffset === "function") ? bosDayKeyOffset(off) : "" + (28 - off);
        const di = (app?.dayMoods && app.dayMoods[key] != null) ? app.dayMoods[key] : null;
        let wd = ""; try { wd = _WD[new Date(key + "T00:00:00").getDay()]; } catch (e) {}
        return { key, today: off === 0, wd, m: di != null ? MOOD_OPTIONS[di] : null };
      })
    : [22, 23, 24, 25, 26, 27, 28].map(d => ({
        d, today: d === 28, wd: _WD[(d - 22 + 1) % 7],
        m: (app?.dayMoods && app.dayMoods[d] != null) ? MOOD_OPTIONS[app.dayMoods[d]] : null,
      }));
  const logged = last7.filter(d => d.m).length;
  const sameAsToday = last7.filter(d => d.m && d.m.t === mood.t).length;

  // hex deepener for orb gradients
  const deep = (hex, amt = 0.45) => {
    if (!hex || hex[0] !== "#") return "#222";
    let h = hex.slice(1); if (h.length === 3) h = h.split("").map(c => c + c).join("");
    const n = parseInt(h, 16);
    const r = Math.max(0, ((n >> 16) & 255) * (1 - amt)) | 0;
    const g = Math.max(0, ((n >> 8) & 255) * (1 - amt)) | 0;
    const b = Math.max(0, (n & 255) * (1 - amt)) | 0;
    return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
  };

  const bg = isDark
    ? `linear-gradient(160deg, #1a1a1d 0%, #0d0d10 100%)`
    : `#ffffff`;
  const border = isDark ? "0" : "1px solid rgba(0,0,0,0.04)";
  const labelMuted = isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.50)";
  const subMuted   = isDark ? "rgba(255,255,255,0.60)" : "rgba(0,0,0,0.55)";
  const titleColor = isDark ? "#fff" : "var(--text)";
  const trailIdle  = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const trailRing  = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.28)"; // soft grey, not a harsh black ring
  const chipBg     = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)";
  const fresh = app?.mode === "fresh";
  const live = app?.mode === "live"; // L3 — real users earn XP for checking in / journaling

  return (
    <button onClick={() => navigate("mood")} className="tap" data-tour="state"
      style={{
        marginTop: 12, width: "100%", border, textAlign: "left",
        background: bg,
        borderRadius: 22, padding: 18,
        position: "relative", overflow: "hidden",
        boxShadow: isDark ? "none" : "0 1px 2px rgba(0,0,0,0.04)",
        display: "block",
      }}>
      {/* Top row: pure orb + labels */}
      <div style={{ display: "flex", gap: 16, alignItems: "center", position: "relative" }}>
        <div style={{ position: "relative", flexShrink: 0, width: 72, height: 72, display: "grid", placeItems: "center" }}>
          <StateOrb size={72} tint={tintFromMood(mood.c)} intensity={isDark ? 1.25 : 1.05} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ fontSize: 11, color: labelMuted, textTransform: "uppercase", letterSpacing: 1.4, fontWeight: 600 }}>Состояние · сейчас</div>
            {sameAsToday >= 2 && (
              <span style={{ fontSize: 10, fontWeight: 700, color: isDark ? "#FEDE34" : "#8a6a00", background: isDark ? "rgba(254,222,52,0.14)" : "rgba(254,222,52,0.35)", borderRadius: 999, padding: "2px 7px", letterSpacing: 0.4, whiteSpace: "nowrap" }}>
                ✨ +{sameAsToday * 10} XP
              </span>
            )}
          </div>
          <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif", fontSize: 26, fontWeight: 600, lineHeight: 1.1, letterSpacing: "-0.6px", marginTop: 4, color: titleColor }}>{fresh ? "Как ты сейчас?" : mood.t}</div>
          <div style={{ fontSize: 12, color: subMuted, marginTop: 4 }}>{
            live
              ? (fresh ? "Отметь первое состояние — и начни копить опыт. +5 XP." : "Отмечай каждый день — это опыт: +5 XP за отметку, +10 со строкой в дневник.")
              : (fresh ? "Нажми, чтобы отметить первое состояние." : "Нажми, чтобы обновить — сфера следует за твоим состоянием.")
          }</div>
        </div>
      </div>

      {/* Last 7 days trail — hidden for a fresh user (no marks yet) */}
      {!fresh && (
      <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid " + (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"), display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        {last7.map((d, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            {d.m ? (
              <span aria-label={d.m.t} style={{
                width: 22, height: 22, borderRadius: "50%", display: "block",
                boxShadow: d.today ? `0 0 0 2px ${trailRing}` : "none",
              }}>
                <StaticOrb size={22} tint={tintFromMood(d.m.c)} seed={1.2} intensity={0.25} />
              </span>
            ) : (
              <span style={{
                width: 22, height: 22, borderRadius: "50%",
                background: trailIdle,
                boxShadow: d.today ? `0 0 0 2px ${trailRing}` : "none",
              }}/>
            )}
            <span style={{ fontSize: 9, color: labelMuted, fontWeight: 600 }}>{d.wd}</span>
          </div>
        ))}
        <span style={{
          fontSize: 10, fontWeight: 600, letterSpacing: 0.3,
          color: subMuted, background: chipBg, borderRadius: 999, padding: "4px 9px",
          flexShrink: 0,
        }}>
          {logged}/7 отмечено
        </span>
      </div>
      )}
    </button>
  );
}

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
  const heroApp = useApp ? useApp() : null;
  // The avatar ring + the glow under it follow the current state orb's colour.
  const mood = heroApp?.mood;
  const moodTint = (mood && typeof tintFromMood === "function") ? tintFromMood(mood.c) : null;
  const fresh = heroApp?.mode === "fresh";
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
  const _pages = [
    /* Page 1: fresh → compact AI-hints + avatar; demo → quote + avatar + chips */
    fresh ? (
    <div key="hints" style={{ position: "relative", padding: 16, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 13, alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1.2 }}>Подсказки ИИ</div>
          <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 3, lineHeight: 1.4, letterSpacing: "-0.1px" }}>Подсказки станут точнее, когда расскажешь о себе.</div>
        </div>
        <button onClick={() => navigate("profile")} className="tap" title="Открыть профиль"
          style={{ flexShrink: 0, position: "relative", width: 54, height: 54, background: "transparent", border: 0, padding: 0, cursor: "pointer" }}>
          <svg width="54" height="54" viewBox="0 0 54 54" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
            <circle cx="27" cy="27" r="23" stroke={ringBg} strokeWidth="3" fill="none"/>
            <circle cx="27" cy="27" r="23" stroke="#FEDE34" strokeWidth="3" fill="none" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 23} strokeDashoffset={2 * Math.PI * 23 * (1 - ringShown)}
              style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.22,0.61,0.36,1)" }}/>
          </svg>
          <div style={{ position: "absolute", inset: 5, borderRadius: "50%",
            background: `url(./assets/sphere.png) center/cover no-repeat, radial-gradient(circle at 30% 30%, ${moodTint ? moodTint[0] : "#ffd97a"}, ${moodTint ? moodTint[2] : "#d97757"})`,
            boxShadow: `inset -3px -5px 12px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.08)${moodTint ? `, 0 0 13px ${moodTint[1]}55` : ""}` }}/>
        </button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {[
          { i: "✨", t: "ИИ: спланируй день" },
          { i: "🧭", t: "С чего начать" },
          { i: "🧘🏼‍♀️", t: "Медитация 5 мин" },
          { i: "🩺", t: "Связать здоровье" },
        ].map((c, i) => (
          <button key={i} onClick={() => navigate("ai")} className="tap" style={{
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
            <span style={{ color: "#E0A500" }}>✦</span> Совет дня
          </div>
          <div style={{ fontSize: 14, color: "var(--text-2)", marginTop: 5, lineHeight: 1.42, letterSpacing: "-0.1px" }}>
            {aiBrief}
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
          <div style={{
            position: "absolute", inset: 6, borderRadius: "50%",
            background: `url(./assets/sphere.png) center/cover no-repeat, radial-gradient(circle at 30% 30%, ${moodTint ? moodTint[0] : "#ffd97a"}, ${moodTint ? moodTint[2] : "#d97757"})`,
            boxShadow: `inset -3px -5px 12px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.08)${moodTint ? `, 0 0 13px ${moodTint[1]}55` : ""}`,
          }}/>
          <div style={{
            position: "absolute", bottom: -2, right: -4, background: "#0a0a0a", color: "#FEDE34",
            fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 999, border: "2px solid " + (isDark ? "#0a0a0a" : "#fff"),
          }}>{doneCount}/{totalCount}</div>
        </button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: "auto", paddingTop: 12, paddingBottom: 14 }}>
        {[
          { i: "✨", t: "ИИ: спланируй день" },
          { i: "🔮", t: "Познай себя" },
          { i: "🧘🏼‍♀️", t: "Медитация 5 мин" },
          { i: "📖", t: "Открыть дневник" },
        ].map((c, i) => (
          <button key={i} onClick={() => navigate("ai")} className="tap" style={{
            padding: "6px 12px", fontSize: 12, color: "var(--text-2)",
            background: chipBg, border: chipBd,
            borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 6,
          }}><span>{c.i}</span>{c.t}</button>
        ))}
      </div>
    </div>
    ),
    /* Page 2: Balance — clean radar (kept) + per-sphere breakdown that fills the
       space and shows what each sphere is + its % level. Original card height. */
    <div key="wheel" style={{ position: "relative", height: "100%", padding: "14px 16px 14px 8px", boxSizing: "border-box", display: "flex", gap: 6, alignItems: "center" }}>
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
  // Fresh new user: only the quote/avatar page (no balance wheel until there's data).
  const pages = fresh ? _pages.slice(0, 1) : _pages;
  return (
    <div style={{
      background: cardBg,
      border: cardBd,
      borderRadius: 28, position: "relative", overflow: "hidden",
      boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
    }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div style={{ display: "flex", width: "200%", transform: `translateX(${-page * 50}%)`, transition: "transform 0.45s cubic-bezier(0.22,0.61,0.36,1)", minHeight: fresh ? 128 : 196 }}>
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
  const toggle = app?.toggleHabit || (() => {});
  const remove = app?.removeHabit || (() => {});
  const doneCount = habits.filter(h => h.done).length;
  const totalCount = habits.length;
  const ringPct = totalCount ? doneCount / totalCount : 0;
  const dayStreak = app?.mode === "fresh" ? 0 : 27;

  // Celebration when a habit gets completed: float +XP near the avatar ring,
  // sparkle burst when the whole day closes (doneCount reaches total).
  const [celebrate, setCelebrate] = React.useState(null);
  const prevDoneRef = React.useRef(doneCount);
  React.useEffect(() => {
    if (doneCount > prevDoneRef.current) {
      const full = totalCount > 0 && doneCount === totalCount;
      setCelebrate({ xp: full ? 100 : 15, full, key: Date.now() + ":" + doneCount });
      if (window.tgHaptic) { try { window.tgHaptic(full ? "heavy" : "light"); } catch (e) {} }
      const t = window.setTimeout(() => setCelebrate(null), full ? 2000 : 1200);
      prevDoneRef.current = doneCount;
      return () => window.clearTimeout(t);
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
          <div style={{ fontSize: 12, color: "var(--text-4)", letterSpacing: 0.4 }}>Вторник · 28 апреля</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.6px", marginTop: 2, fontFamily: "var(--bos-title-font)" }}>{userName ? "Доброе утро, " + userName : "Доброе утро 👋"}</div>
        </div>
        <button onClick={() => navigate("notifications", { from: "home" })} className="tap"
          style={{ width: 42, height: 42, borderRadius: 14, background: iconBg, border: 0, display: "grid", placeItems: "center", position: "relative" }}>
          <I.Bell size={18} color={bellIcon}/>
          <span style={{ position: "absolute", top: 8, right: 10, width: 8, height: 8, borderRadius: "50%", background: "var(--accent-red)", border: "2px solid " + (isDark ? "#0a0a0a" : "#fff") }} />
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

      {/* MOOD WIDGET — living card with breathing orb + last-7-days mood trail */}
      {widgets.mood !== false && mood && <MoodWidget mood={mood} app={app} isDark={isDark} navigate={navigate} />}

      {/* Stat strip */}
      {(widgets.streak !== false || widgets.level !== false) && (
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
            <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px" }}><CountUp value={app?.mode === "fresh" ? 1 : 7}/></span>
            <span style={{ fontSize: 10.5, opacity: 0.62, fontWeight: 700 }}>{app?.mode === "fresh" ? "0 XP" : "1 240 XP"}</span>
          </div>
          <span style={{ display: "block", height: 4, borderRadius: 999, background: "rgba(0,0,0,0.16)", overflow: "hidden", marginTop: 1 }}>
            <span style={{ display: "block", height: "100%", width: (app?.mode === "fresh" ? 4 : 83) + "%", borderRadius: 999, background: "rgba(0,0,0,0.82)" }}/>
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
            <div style={{ fontSize: 14, color: "var(--text-2)", marginTop: 4, fontWeight: 500 }}>28 апр</div>
          </div>
          <I.Calendar size={28} color={isDark ? "rgba(255,255,255,0.7)" : "#787878"} strokeWidth={1.5} />
        </button>
        )}
        {widgets.team !== false && (
        <button className="tap" onClick={() => navigate("community")}
          style={{ background: cardBg, border: cardBorder, borderRadius: 18, padding: "14px 14px 12px", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: cardShadow, color: "var(--text)" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Команда</div>
            <div style={{ fontSize: 14, color: "var(--text-2)", marginTop: 4, fontWeight: 500 }}>{teams.length ? teams.length + " активны" : "Создай команду"}</div>
          </div>
          {teams.length > 0 ? (
          <div style={{ display: "flex" }}>
            <span style={{ width: 28, height: 28, borderRadius: "50%", background: "#e8a8a8", border: "2px solid " + (isDark ? "#0a0a0a" : "#fff") }} />
            <span style={{ width: 28, height: 28, borderRadius: "50%", background: "#a8d4a8", border: "2px solid " + (isDark ? "#0a0a0a" : "#fff"), marginLeft: -10 }} />
            <span style={{ width: 28, height: 28, borderRadius: "50%", background: "#c8b9e8", border: "2px solid " + (isDark ? "#0a0a0a" : "#fff"), marginLeft: -10 }} />
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
        <div style={{ marginTop: 10, background: cardBg, border: cardBorder, borderRadius: 22, overflow: "hidden", boxShadow: cardShadow, color: "var(--text)" }}>
          {habits.map((h, idx) => (
            <div key={h.id}>
              <SwipeRow rowBg={rowBg} dark={isDark} actions={[
                { key: "share", tone: "share", label: "Поделиться", icon: I.Share, onAction: () => openSheet(<ShareHabitSheet habit={h} dark={isDark} />) },
                { key: "del", tone: "delete", label: "Удалить", icon: I.Trash, onAction: () => remove(h.id) },
              ]}>
              <div className="tap" onClick={() => navigate("habit-detail", { habit: h, from: "home" })} style={{
                display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
              }}>
                <span style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: h.color ? h.color + "26" : iconBg, display: "grid", placeItems: "center",
                  fontSize: 20, flexShrink: 0,
                }}>{h.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, color: "var(--text-2)", letterSpacing: "-0.2px" }}>{h.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "var(--text-4)", marginTop: 2, flexWrap: "wrap" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>🔥 {h.streak}д</span>
                    {h.duration && <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><I.Clock size={11}/>{h.duration}м</span>}
                    {h.friends?.length > 0 && <AvatarStack people={h.friends} size={16} max={3} label={false}/>}
                  </div>
                </div>
                {h.duration && !h.done && (
                  <button className="tap" data-no-haptic onClick={(e) => { e.stopPropagation(); navigate("focus", { habit: h }); }}
                    style={{ width: 30, height: 30, borderRadius: "50%", background: isDark ? "#fff" : "var(--text-2)", border: 0, color: isDark ? "#0a0a0a" : "#fff", display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <I.Play size={11}/>
                  </button>
                )}
                <button className={"check-btn " + (h.done ? "" : "unchecked")} data-no-haptic
                  onClick={(e) => { e.stopPropagation(); toggle(h.id); }}>
                  {h.done && <I.Check size={18} strokeWidth={2.5} color="#fff" />}
                </button>
              </div>
              </SwipeRow>
              {idx < habits.length - 1 && <div style={{ height: 1, background: dividerLn }} />}
            </div>
          ))}
          <div style={{ padding: "10px 16px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid " + dividerLn }}>
            <span style={{ fontSize: 12, color: "var(--text-4)" }}>{doneCount} из {totalCount} сегодня · {Math.round(ringPct*100)}%</span>
            <button className="tap" onClick={() => navigate("habits")} style={{ background: "transparent", border: 0, color: "var(--text-2)", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
              Все <I.ChevronRight size={14} />
            </button>
          </div>
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

      {/* New-user "what's next" banner — the deep dive (teams, levels, mentors)
         lives here as an inviting opt-in, so the first-run guide can stay tiny. */}
      {app?.mode === "fresh" && (
        <button onClick={() => app?.startTour?.("explore")} className="tap" data-no-haptic
          style={{ marginTop: 12, width: "100%", textAlign: "left", border: isDark ? "0" : "1px solid rgba(70,120,190,0.14)", borderRadius: 22, padding: "15px 16px",
            background: isDark ? "linear-gradient(135deg, rgba(122,164,208,0.20), rgba(122,164,208,0.05))" : "linear-gradient(135deg, #eef3fc 0%, #dfe9f8 100%)",
            color: "var(--text)", display: "flex", alignItems: "center", gap: 13 }}>
          <span style={{ width: 44, height: 44, borderRadius: 14, background: isDark ? "rgba(255,255,255,0.08)" : "#fff", display: "grid", placeItems: "center", flexShrink: 0, fontSize: 22, boxShadow: isDark ? "none" : "0 2px 8px rgba(120,150,200,0.2)" }}>🧭</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15.5, fontWeight: 600, letterSpacing: "-0.2px" }}>Что дальше?</div>
            <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 2, lineHeight: 1.4 }}>Команды, уровни, наставники — загляни, куда можно расти</div>
          </div>
          <I.ChevronRight size={20} color="var(--text-4)" />
        </button>
      )}

      {/* Today's energy — always dark card, looks intentional in both themes */}
      {widgets.energy !== false && (
      <div style={{
        marginTop: 12, padding: 18,
        background: "linear-gradient(135deg, #1a1a1d 0%, #0a0a0a 100%)",
        borderRadius: 22, color: "#fff", position: "relative", overflow: "hidden",
      }}>
        <div aria-hidden style={{ position: "absolute", top: -14, right: -14, opacity: 0.85 }}>
          <StaticOrb size={120} tint={tintFromMood("#5FA8FF")} seed={1.2} intensity={0.4} />
        </div>
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: 1.2, textTransform: "uppercase", fontWeight: 600 }}>Энергия сегодня</div>
          <div style={{ fontSize: 32, fontWeight: 700, marginTop: 4, letterSpacing: "-0.5px" }}>+<CountUp value={Math.round(ringPct * 92)}/> очк.</div>
          <div style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.5, marginTop: 6, maxWidth: "75%" }}>
            {totalCount === 0 ? "Отметь первую привычку — и счёт пойдёт." : <>Ты прошёл {Math.round(ringPct * 100)}%. Команда рассчитывает на тебя.</>}
          </div>
        </div>
      </div>
      )}

      {/* Invite / share the app — friendly card with an avatar pile */}
      <button className="tap" onClick={() => openSheet(<ShareAppSheet dark={isDark} />)}
        style={{ marginTop: 12, width: "100%", background: cardBg, border: cardBorder, borderRadius: 22, padding: "16px 18px", boxShadow: cardShadow, color: "var(--text)", display: "flex", alignItems: "center", gap: 14, textAlign: "left" }}>
        <span style={{ width: 44, height: 44, borderRadius: 14, background: iconBg, display: "grid", placeItems: "center", flexShrink: 0, color: "var(--text-2)" }}>
          <I.Share size={20} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15.5, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.2px" }}>Поделиться приложением</div>
          <div style={{ fontSize: 12.5, color: "var(--text-4)", marginTop: 2 }}>Позови друзей — вместе в балансе</div>
        </div>
        <div style={{ display: "flex", flexShrink: 0 }}>
          {[{ c: "#e8c8a8", i: "А" }, { c: "#a8d4e8", i: "В" }, { c: "#d4b8e8", i: "Л" }].map((p, idx) => (
            <span key={idx} style={{ width: 30, height: 30, borderRadius: "50%", background: p.c, border: "2px solid " + (isDark ? "#0a0a0a" : "#fff"), marginLeft: idx ? -10 : 0, display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700, color: "rgba(0,0,0,0.55)" }}>{p.i}</span>
          ))}
        </div>
      </button>
    </div>
  );
}

/* ── Share-the-app sheet (slides up from the home "Поделиться приложением") ── */
function ShareAppSheet({ dark = false }) {
  const { close } = useSheet();
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
  const friends = [
    { name: "Катя", i: "К", c: "#f0c8a8" }, { name: "Дима", i: "Д", c: "#a8c0e8" },
    { name: "Соня", i: "С", c: "#e8b8d4" }, { name: "Ник", i: "Н", c: "#b8e8c8" }, { name: "Аля", i: "А", c: "#d4c8e8" },
  ];
  const targets = [{ e: "💬", t: "Сообщения" }, { e: "🔗", t: "Ссылка" }, { e: "📷", t: "Истории" }, { e: "•••", t: "Ещё" }];
  return (
    <div style={{ padding: "2px 20px 0", color: C.text }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", margin: "0 auto 12px",
          background: "radial-gradient(circle at 37% 29%, #ffffff 0%, #dbe6f6 14%, #7aa4d0 46%, #3f5f86 72%, #243b5c 100%)",
          boxShadow: "0 8px 24px rgba(122,164,208,0.42)" }} />
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.3px" }}>Поделиться BalanceOS</div>
        <div style={{ fontSize: 14, color: C.sub, marginTop: 3 }}>Вместе держать баланс проще — позови друга</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.tile, borderRadius: 14, padding: "11px 14px", marginTop: 20 }}>
        <span style={{ fontSize: 16 }}>🔗</span>
        <div style={{ flex: 1, fontSize: 14, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>mind3scape.github.io/balanceos</div>
        <button onClick={copyLink} className="tap" style={{ background: copied ? "#34C759" : (dark ? "#fff" : "#0a0a0a"), color: copied ? "#fff" : (dark ? "#0a0a0a" : "#fff"), border: 0, borderRadius: 999, padding: "7px 14px", fontSize: 13, fontWeight: 600, transition: "background 0.2s", whiteSpace: "nowrap" }}>{copied ? "Скопировано ✓" : "Копировать"}</button>
      </div>

      <div style={{ fontSize: 12, color: C.sub, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, margin: "20px 0 12px" }}>Предложить друзьям</div>
      <div style={{ display: "flex", gap: 14, overflowX: "auto", margin: "0 -20px", padding: "0 20px 4px", scrollbarWidth: "none" }}>
        {friends.map((p, i) => (
          <button key={i} className="tap" data-no-haptic style={{ background: "transparent", border: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 7, flexShrink: 0, width: 56, color: C.text }}>
            <span style={{ width: 54, height: 54, borderRadius: "50%", background: p.c, display: "grid", placeItems: "center", fontSize: 19, fontWeight: 700, color: "rgba(0,0,0,0.55)" }}>{p.i}</span>
            <span style={{ fontSize: 12, color: C.sub }}>{p.name}</span>
          </button>
        ))}
      </div>

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
    { id: "energy",   i: "⚡", t: "Энергия дня", d: "Итог дня" },
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
  // Last 7 days (mock); use real app.dayMoods if present
  const today = 28;
  const last7 = [22, 23, 24, 25, 26, 27, 28].map(d => ({
    d,
    m: (app?.dayMoods && app.dayMoods[d] != null)
      ? MOOD_OPTIONS[app.dayMoods[d]]
      : null,
    today: d === today,
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
  const trailRing  = isDark ? "rgba(255,255,255,0.85)" : "#0a0a0a";
  const chipBg     = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)";
  const fresh = app?.mode === "fresh";

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
          <div style={{ fontSize: 12, color: subMuted, marginTop: 4 }}>{fresh ? "Нажми, чтобы отметить первое состояние." : "Нажми, чтобы обновить — сфера следует за твоим состоянием."}</div>
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
            <span style={{ fontSize: 9, color: labelMuted, fontWeight: 600 }}>{["В","П","В","С","Ч","П","С"][(d.d - 22 + 1) % 7]}</span>
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

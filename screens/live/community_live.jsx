/* COMMUNITY — LIVE-only fork of CommunityScreen + TeamDetailScreen (real Telegram
   user, app.mode === "live" is ALWAYS true here). Giving the live user its OWN
   screen files keeps the two demo modes ('demo' / 'fresh') frozen — future live
   edits can never break the showcase.

   What the demo/fresh branches contributed (all stripped here):
   • CommunityLive — drops the fabricated Нетворк people list (YourImpactCard +
     the curated `network` array + their message/booking buttons) and the demo-only
     Партнёры marketplace tab + its `partners` array. Live Нетворк ALWAYS shows the
     honest NetworkLockedLive banner (real XP paths, no fake people); the secondary
     scope bar is just Нетворк + Курсы. Курсы are real (kept), with live cohort
     windows computed from today. Teams + cloud "Открытые команды рядом" discovery
     are kept.
   • TeamDetailLive — drops the demo team calendar, demo activity feed, demo chat
     line, the fabricated leaderboard (contribution %, 👑 leader, expandable
     per-member habit chips) and the DEFAULT_TEAM_HABITS seed. Live keeps the REAL
     cloud roster (window.bosCloud.teamMembers → BOS_TEAM_PALETTE colours + dark
     initials), real team habits (teamHabitsFull / toggleTeamHabitToday), owner
     join-request approvals, leave/delete, and the share-link sheet.

   Everything else reuses the shared core/ toolkit (BOS_TEAM_PALETTE, AvatarStack,
   ConfirmActionSheet, TeamShareSheet, TeamHabitSheet, TeamRing) +
   the live forks in shared_live.jsx (NetworkLockedLive, PeopleMonthCalendarLive,
   CloudTeamsDiscoverLive) +
   framework (BosAvatar, PageHeader, the icon object I, the bos* helpers, window.bosCloud,
   hooks useApp/useNav/useSheet, and useCS = React.useState). The ONLY new top-level
   declarations in this file are `function CommunityLive` and `function TeamDetailLive`. */

// LIVE team card — shows the REAL cloud roster (member count + real avatars) for a team you're
// in, not the stale local t.members (that mismatch was «3 снаружи / 0 внутри»). AvatarStack
// already caps at 5 faces + a «+N» overflow chip (iOS-style) and uses each member's real
// avatar. Local-only teams fall back to their own members; empty cloud team = honest «ты один».
function LiveTeamCard({ t, navigate }) {
  // Светло-серое СТЕКЛО по умолчанию (David): чёрный/непокрашенный/демо-жёлтый accent → светло-серый;
  // реальный выбранный цвет показывается как есть.
  const cardAccent = (t.accent && t.accent !== "#0a0a0a" && t.accent !== "#fef3c7") ? t.accent : "#C7C7CC";
  const tgt = t.target || 0;
  const cur = t.current != null ? t.current : Math.round((t.progress || 0) * tgt);
  const gp = tgt > 0 ? Math.min(1, cur / tgt) : (t.progress || 0);
  const palette = (typeof BOS_TEAM_PALETTE !== "undefined") ? BOS_TEAM_PALETTE : ["#7FB3F2"];
  const _cloud = !!(t.cloudId && window.bosCloud && window.bosCloud.enabled() && window.bosCloud.teamMembers);
  const [roster, setRoster] = React.useState(null); // null = not loaded yet
  React.useEffect(() => {
    if (!_cloud) return;
    let on = true;
    window.bosCloud.teamMembers(t.cloudId).then((mem) => {
      if (!on || !Array.isArray(mem)) return;
      setRoster(mem.map((m, j) => ({ name: m.name || "Участник", avatar: m.avatar, initials: (m.name || "У").slice(0, 1).toUpperCase(), color: palette[j % palette.length] })));
    }).catch(() => { if (on) setRoster([]); });
    return () => { on = false; };
  }, [t.cloudId]);
  const _loading = _cloud && roster === null; // cloud roster not back yet → skeleton, never «ты один»
  const members = _cloud ? (roster || []) : (t.members || []);
  const count = members.length;
  const ruPart = (n) => { const m = n % 10, h = n % 100; return (m === 1 && h !== 11) ? "участник" : (m >= 2 && m <= 4 && (h < 10 || h >= 20)) ? "участника" : "участников"; };
  return (
    <div className="team-card" style={{ ["--team-accent"]: cardAccent, borderRadius: 22, padding: 18, position: "relative", overflow: "hidden" }}>
      <div aria-hidden className="team-card__emblem" style={{ position: "absolute", top: -10, right: -6, fontSize: 110, lineHeight: 1, pointerEvents: "none", transform: "rotate(8deg)" }}>{bosIcon(t.emblem, 88, t.accent)}</div>
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 18, color: "var(--text)", letterSpacing: "-0.4px" }}>{t.name}</div>
          <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 600, color: "var(--text-3)", background: "var(--card-track)", padding: "2px 8px", borderRadius: 999 }}>{t.vis === "public" ? "🌐 Открытая" : "🔒 Приватная"}</span>
        </div>
        <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 6, fontWeight: 500 }}>🎯 {t.goal}</div>
        <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2, minHeight: 16 }}>{t.date}{_loading ? "" : " · " + count + " " + ruPart(count)}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>
          <span>{t.target ? "К цели" : "Прогресс команды"}</span>
          <span style={{ color: "var(--text)" }}>{t.target ? (cur + " / " + tgt + " " + (t.unit || "")) : Math.round(gp * 100) + "%"}</span>
        </div>
        <div style={{ marginTop: 6, height: 8, borderRadius: 999, background: "var(--card-track)", overflow: "hidden" }}>
          <span className="team-card__fill" style={{ display: "block", height: "100%", width: (gp * 100) + "%", borderRadius: 999 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", marginTop: 14, gap: 8 }}>
          {_loading
            ? <div style={{ display: "flex" }}>{[0, 1, 2].map((i) => (<span key={i} className="bos-skel" style={{ width: 28, height: 28, borderRadius: "50%", marginLeft: i ? -10 : 0, border: "2px solid var(--card)" }} />))}</div>
            : count > 0 ? <PeopleStackLive people={members} size={28} max={5} /> : <span style={{ fontSize: 12, color: "var(--text-4)" }}>Пока ты один — позови друзей</span>}
          <button onClick={() => navigate("team-detail", { team: t })} className="tap team-card__cta" style={{ marginLeft: "auto", border: 0, borderRadius: 999, padding: "11px 18px", fontSize: 13.5, fontWeight: 600 }}>
            Открыть круг
          </button>
        </div>
      </div>
    </div>
  );
}

function CommunityLive() {
  const { navigate } = useNav();
  const app = useApp();
  // View-state (section / sub-tabs / network unlock) lives in the shared store so
  // it survives navigating into a detail screen and back (the screen remounts).
  const cv = app?.communityView || { section: "discover", discTab: "teams", commTab: "network", networkUnlocked: false };
  const { section, discTab, commTab } = cv;
  const setView = (patch) => app?.setCommunityView(patch);
  const resolve = (v, cur) => (typeof v === "function" ? v(cur) : v);
  const setSection = (v) => setView({ section: resolve(v, section) });
  const setCommTab = (v) => setView({ commTab: resolve(v, commTab) });

  // LIVE has no Партнёры tab — if a stale view left commTab on "partners" (e.g. it was
  // selected before, or carried from another mode), fall back to "network" so the
  // content area is never blank.
  const commTabEff = (commTab === "partners") ? "network" : commTab;

  // Real level for the live user — never the demo's curated 8/1240/2000. The
  // typeof guard keeps this safe if the XP helpers aren't loaded yet.
  const _commLvl = (typeof bosLiveXPLive === "function" && typeof bosLevelInfoLive === "function") ? bosLevelInfoLive(bosLiveXPLive(app)) : null;
  const userLevel = _commLvl ? _commLvl.level : 1;
  const xpInLevel = _commLvl ? _commLvl.into : 0;
  const xpForNext = _commLvl ? _commLvl.span : 2000;
  const levelsLeft = Math.max(0, 10 - userLevel);
  const weeksToUnlock = Math.max(1, levelsLeft);

  const teams = app?.teams || []; // shared store — "Создать команду" adds here

  // Upcoming cohort window: a "D — D MMM" range that starts `startIn` days from the
  // REAL today and runs `days` long, so dates are never stale.
  const _ruMon = ["янв","фев","мар","апр","мая","июн","июл","авг","сен","окт","ноя","дек"];
  const _cohortWindow = (startIn, days) => {
    const a = new Date(); a.setHours(0, 0, 0, 0); a.setDate(a.getDate() + startIn);
    const b = new Date(a); b.setDate(b.getDate() + (days - 1));
    return a.getMonth() === b.getMonth()
      ? a.getDate() + " — " + b.getDate() + " " + _ruMon[b.getMonth()]
      : a.getDate() + " " + _ruMon[a.getMonth()] + " — " + b.getDate() + " " + _ruMon[b.getMonth()];
  };
  const courses = [
    { id: "overload",     i: "⚡",    accent: "#fef3c7", t: "Перегрузка",      d: "Перенастрой мышление и очисти негативные убеждения.", price: "110 000 ₽", lvl: "Интенсив",   length: "3 дня", cohort: _cohortWindow(12, 3) },
    { id: "breakthrough", i: "🚀",    accent: "#dbe9ff", t: "Прорыв",  d: "Открой новые пути и преодолей пределы.",            price: "110 000 ₽", lvl: "Продвинутый",    length: "7 дней", cohort: _cohortWindow(33, 7) },
    { id: "marathon",     i: "🏃🏼‍♀️", accent: "#d6f3df", t: "Марафон",      d: "21-дневная программа устойчивых привычек.",                price: "110 000 ₽", lvl: "Базовый",  length: "21 день", cohort: _cohortWindow(54, 21) },
  ];

  return (
    <div className="page-in" style={{ padding: "0 12px 24px" }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 4px 12px" }}>
        <div style={{ flex: 1, fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px", color: "var(--text)" }}>Сообщество</div>
        {/* «Новая команда» убрана: круги создаются на вкладке Привычки → «+». Сообщество = только найти/расти. */}
      </div>

      {/* Primary section — pill */}
      <div className="tab-pill" style={{ background: "var(--card-2)" }}>
        <button className={"tap " + (section === "discover" ? "active" : "")} onClick={() => setSection("discover")}>Найти</button>
        <button className={"tap " + (section === "community" ? "active" : "")} onClick={() => setSection("community")}>Сообщество</button>
      </div>

      {/* Secondary scope bar — a thinner pill segmented control (same family as the
          Команды/Сообщество pill above), only inside «Сообщество». «Команды» stands alone.
          LIVE: Нетворк + Курсы only (the 3 courses are real). Партнёры is hidden until
          real partners exist. */}
      {section === "community" && (
        <div className="tab-pill tab-pill-sm" style={{ background: "var(--card-2)", marginTop: 10, marginBottom: 14 }}>
          {[{ id: "network", t: "Нетворк" }, { id: "courses", t: "Курсы" }].map(tb => (
            <button key={tb.id} className={"tap " + (commTabEff === tb.id ? "active" : "")} data-tour={tb.id === "network" ? "network" : undefined} onClick={() => setCommTab(tb.id)}>{tb.t}</button>
          ))}
        </div>
      )}

      {section === "discover" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
          {/* НАЙТИ — только ЧУЖИЕ круги/цели, в которые можно вступить (дискавери). «Твои круги»
              отсюда УБРАНЫ — они живут на вкладке Привычки → Цели (с лицами). Дубля больше нет.
              Создание круга — на Привычки → «+». */}
          <div style={{ textAlign: "center", padding: "6px 18px 2px", color: "var(--text-4)", fontSize: 13.5, lineHeight: 1.5 }}>
            Найди круг или челлендж, к которому хочешь примкнуть — вступишь, и он появится у тебя в «Целях».
          </div>
          {/* Курируемая ВИТРИНА челленджей — засев до запуска (без неё «Найти» пустует). */}
          {typeof SeedCirclesShowcaseLive === "function" && <SeedCirclesShowcaseLive app={app} navigate={navigate} />}
          {/* Открытые круги из облака, в которые можно вступить. */}
          <CloudTeamsDiscoverLive app={app} />
        </div>
      )}

      {section === "community" && commTabEff === "network" && (
        // The unlocked Network body (a curated people list + booking buttons) is
        // FABRICATED content — demo-only. The live user gets the honest locked banner
        // instead (real XP paths, no fabricated people), until a real network exists.
        <div style={{ marginTop: 2 }}>
          <NetworkLockedLive
            navigate={navigate}
            live={true}
            level={userLevel}
            xp={xpInLevel}
            xpMax={xpForNext}
            levelsLeft={levelsLeft}
            weeks={weeksToUnlock}
            onUnlock={() => {}}
            onSwitchToCommunity={() => { setSection("community"); setCommTab("courses"); }}
          />
        </div>
      )}

      {section === "community" && commTabEff === "courses" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
          {/* Gold "why courses" banner — the hook (esp. for a newcomer): a course is
              the fastest level-up — a whole level + an achievement that opens new
              circles of people + a big XP boost. Same gold as the level badge. */}
          <div style={{ position: "relative", overflow: "hidden", borderRadius: 22, padding: "16px 18px",
            background: "linear-gradient(135deg, #FEDE34, #EF9F14)",
            boxShadow: "0 8px 22px rgba(239,159,20,0.32)" }}>
            <div aria-hidden style={{ position: "absolute", top: -46, right: -28, width: 168, height: 168, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.5), transparent 66%)", pointerEvents: "none" }} />
            <div aria-hidden style={{ position: "absolute", top: 15, right: 17, fontSize: 38, lineHeight: 1, pointerEvents: "none" }}>🏆</div>
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", color: "rgba(58,42,0,0.6)" }}>Зачем проходить курсы</div>
              <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.4px", color: "#3a2a00", marginTop: 4, maxWidth: 220, lineHeight: 1.2 }}>Каждый курс — целый уровень</div>
              <div style={{ fontSize: 13, color: "rgba(58,42,0,0.8)", marginTop: 6, lineHeight: 1.42, maxWidth: 244 }}>Ачивка, большой опыт и доступ к новым людям. Самый быстрый рост.</div>
              <div style={{ display: "flex", gap: 7, marginTop: 13, flexWrap: "wrap" }}>
                {[["🏆", "+Уровень"], ["🎖️", "Ачивка"], ["⚡", "+2000 XP"]].map(([e, l], i) => (
                  <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.55)", borderRadius: 999, padding: "6px 11px", fontSize: 12.5, fontWeight: 700, color: "#3a2a00" }}>
                    <span style={{ fontSize: 13, lineHeight: 1 }}>{e}</span>{l}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {courses.map((c, i) => (
            <button key={i} data-tour={i === 0 ? "course" : undefined} onClick={() => navigate("course-detail", { course: c })} className="tap"
              style={{ background: "var(--card)", borderRadius: 22, padding: 16, boxShadow: "var(--card-shadow)", border: 0, textAlign: "left", color: "var(--text)", display: "block", width: "100%" }}>
              {/* Name + meta left, coloured emblem on the RIGHT — matches the Partners card */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: 17, color: "var(--text)", letterSpacing: "-0.3px" }}>{c.t}</span>
                    <span style={{ fontSize: 10, padding: "2px 8px", background: "var(--card-2)", borderRadius: 999, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600 }}>{c.lvl}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 6, lineHeight: 1.45 }}>{c.d}</div>
                  <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 6, display: "flex", gap: 10 }}>
                    <span>⏱ {c.length}</span>
                    <span>·</span>
                    <span>📅 {c.cohort}</span>
                  </div>
                </div>
                <div style={{ width: 46, height: 46, borderRadius: "50%", background: c.accent, display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0 }}>{c.i}</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--line)", paddingTop: 12, marginTop: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Стоимость</div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2, color: "var(--text)" }}>{c.price}</div>
                </div>
                <span style={{ background: "#0a0a0a", color: "#fff", borderRadius: 999, padding: "10px 18px", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500 }}>
                  О курсе <I.ChevronRight size={14} />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* Per-team stale-while-revalidate cache (roster / habits / anchor-progress / goal) so
   re-opening a team renders INSTANTLY from the last-known data instead of flashing through
   a skeleton every time (David: «каждый раз вижу обновление экрана, дёргать не нравится»).
   Keyed by cloudId; the effects below still revalidate in the background. */
var _bosTeamCache = {};
function _bosTeamGet(k) { return (k && _bosTeamCache[k] !== undefined) ? _bosTeamCache[k] : null; }
function _bosTeamPut(k, v) { if (k) { _bosTeamCache[k] = v; } return v; }

/* ОРБИТА КРУГА — герой комнаты команды. Общая звезда (эмблема) в центре, люди-планеты
   вокруг на двух кольцах; планета ЗАГОРАЕТСЯ (полная + ✓), если человек сегодня в потоке,
   иначе приглушена. Переиспользует BuddyFaceLive + стеклянные хелперы — один язык со всем
   приложением, наш космос-стиль (но НЕ трогает экраны с орбитами на «Я»). */
function TeamOrbitLive({ emblem, accent, faces, isDark }) {
  var W = 260, H = 178, cx = W / 2, cy = H / 2, FS = 30, rIn = 50, rOut = 84;
  var list = Array.isArray(faces) ? faces : [];
  var cap = 7, shown = list.slice(0, cap), extra = list.length - shown.length;
  var planets = shown.map(function (f) { return { face: f }; });
  if (extra > 0) planets.push({ plus: extra });
  var innerN = Math.min(3, planets.length);
  var inner = planets.slice(0, innerN), outer = planets.slice(innerN);
  var ring = function (d) { return { position: "absolute", left: "50%", top: "50%", width: d, height: d, transform: "translate(-50%,-50%)", borderRadius: "50%", border: "0.7px dashed rgba(0,0,0,0.14)" }; };
  var place = function (arr, r, off) {
    return arr.map(function (p, i) {
      var ang = (-90 + off + i * (360 / Math.max(1, arr.length))) * Math.PI / 180;
      var st = { position: "absolute", left: cx + r * Math.cos(ang), top: cy + r * Math.sin(ang), transform: "translate(-50%,-50%)" };
      if (p.plus) return <span key={"x" + r + i} style={Object.assign({}, st, { width: FS, height: FS, borderRadius: "50%", background: "rgba(0,0,0,0.18)", color: "var(--text)", fontSize: 11, fontWeight: 800, display: "grid", placeItems: "center" })}>+{p.plus}</span>;
      var f = p.face;
      return (
        <span key={(f.id || i) + "-" + r} style={Object.assign({}, st, { display: "block", opacity: f.done ? 1 : 0.42 })}>
          <BuddyFaceLive avatar={f.avatar} name={f.name} size={FS} />
          {f.done && <span style={{ position: "absolute", right: -1, bottom: -1, width: 13, height: 13, borderRadius: "50%", background: "#0a0a0a", color: "#fff", fontSize: 8, fontWeight: 800, display: "grid", placeItems: "center", boxShadow: "0 0 0 1.5px var(--card)" }}>✓</span>}
        </span>
      );
    });
  };
  return (
    <div style={{ position: "relative", width: W, height: H, margin: "0 auto" }}>
      <div style={ring(rOut * 2)} />
      <div style={ring(rIn * 2)} />
      <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 54, height: 54, borderRadius: "50%", background: BOS_TILE_SHEEN + ", rgba(255,255,255,0.55)", boxShadow: bosTileGlass(isDark), display: "grid", placeItems: "center" }}>{bosIcon(emblem || "✨", 28, accent)}</div>
      {place(inner, rIn, 0)}
      {place(outer, rOut, 28)}
    </div>
  );
}

function TeamDetailLive() {
  const { navigate, params } = useNav();
  const app = useApp();
  const { open: openSheet } = useSheet();
  const passed = params?.team || { _id: "seed-1", name: "Команда создателей", emblem: "✨", accent: "#fef3c7", goal: "50 добрых дел за месяц", date: "1 — 31 дек", progress: 0, members: [] };
  // Read the LIVE team from the store so a just-added habit appears immediately.
  const t = (app?.teams || []).find(x => x._id === passed._id) || passed;
  // Светло-серое СТЕКЛО по умолчанию (David): чёрный/демо-жёлтый/непокрашенный → светло-серый; реальный цвет показывается.
  const accent = (t.accent && t.accent !== "#0a0a0a" && t.accent !== "#fef3c7") ? t.accent : "#C7C7CC";
  const isDark = app?.themeOverride === "dark";
  // The goal MODE — shown as a chip so the team's rule (общий счёт / серия / гонка) is ALWAYS
  // visible, not hidden behind the async cloud progress (David: «не вижу их отражение»).
  const teamModeMeta = ({ collective: { e: "🌊", t: "Общий счёт" }, streak: { e: "🔥", t: "Серия у каждого" }, race: { e: "🏁", t: "Гонка" } })[t.type || "collective"];
  // LIVE = real user: honest data or empty, NEVER fake standings/activity/calendar —
  // even for a team without a cloud link yet.

  // Real team-chat preview + unread badge for LIVE cloud teams. Guarded on the cloud
  // being enabled AND the team having a cloudId — a freshly-created local team has
  // neither yet, so this stays inert until it syncs.
  const _chatLive = !!(window.bosCloud && window.bosCloud.enabled() && t.cloudId);
  const _readKey = t.cloudId ? "bos:chatread:" + t.cloudId : null;
  const [chatPeek, setChatPeek] = React.useState(null); // { last, unread } for live teams
  React.useEffect(() => {
    if (!_chatLive) return;
    let on = true;
    (async () => {
      try {
        const me = await window.bosCloud.uid();
        const rows = await window.bosCloud.loadMessages(t.cloudId);
        if (!on || !Array.isArray(rows)) return;
        // Compare each message's server created_at to the stored read-marker created_at —
        // SAME time base on both sides (a device clock drifts vs the server, so on skewed
        // phones a Date.now() compare would stick or never show the badge).
        const lastReadRaw = (_readKey && localStorage.getItem(_readKey)) || 0;
        const lastReadMs = lastReadRaw ? new Date(lastReadRaw).getTime() : 0;
        const last = rows.length ? rows[rows.length - 1] : null;
        const lastText = last ? (last.text || (last.image_url ? "📷 Фото" : "")) : "";
        const unread = rows.filter((r) => r && r.user_id !== me && new Date(r.created_at).getTime() > lastReadMs).length;
        // Carry the last message's created_at so markChatRead can store it as the read marker
        // (same time base as messages). No messages yet → null → everything counts as read.
        setChatPeek({ last: lastText, unread: unread, lastAt: last ? last.created_at : null });
      } catch (e) {}
    })();
    return () => { on = false; };
  }, [_chatLive, t.cloudId]);
  const markChatRead = () => {
    // Store the LAST loaded message's created_at (server time base) — NOT Date.now() (device
    // clock). If nothing was loaded yet, store "" so the next compare treats all as read.
    try { if (_readKey) localStorage.setItem(_readKey, (chatPeek && chatPeek.lastAt) ? String(chatPeek.lastAt) : ""); } catch (e) {}
    setChatPeek((p) => p ? { ...p, unread: 0 } : p);
  };

  // LIVE teams: load the REAL roster (real names + avatars + roles) from the cloud, so the
  // member list is honest — real teammates, no fabricated standings until real progress exists.
  const _rosterLive = !!(window.bosCloud && window.bosCloud.enabled() && t.cloudId);
  const [cloudRoster, setCloudRoster] = React.useState(() => _bosTeamGet("roster:" + t.cloudId));
  const [meId, setMeId] = React.useState(null); // current user's cloud id — to find myself in the roster
  const [rosterTick, setRosterTick] = React.useState(0);
  React.useEffect(() => {
    if (!_rosterLive) { setMeId(null); return; }
    let on = true;
    window.bosCloud.uid().then((id) => { if (on) setMeId(id || null); }).catch(() => {});
    return () => { on = false; };
  }, [_rosterLive, t.cloudId]);
  React.useEffect(() => {
    if (!_rosterLive) return;
    let on = true;
    window.bosCloud.teamMembers(t.cloudId).then((mem) => {
      if (!on || !Array.isArray(mem)) return;
      var palette = BOS_TEAM_PALETTE;
      // owner first, then members, in join order
      var sorted = mem.slice().sort((a, b) => (a.role === "owner" ? -1 : b.role === "owner" ? 1 : 0));
      setCloudRoster(_bosTeamPut("roster:" + t.cloudId, sorted.map((m, i) => ({ id: m.id, name: m.name || "Участник", avatar: m.avatar, role: m.role, initials: (m.name || "У").slice(0, 1).toUpperCase(), color: palette[i % palette.length] }))));
    }).catch(() => {});
    return () => { on = false; };
  }, [_rosterLive, t.cloudId, rosterTick]);
  // E: the CREATOR sees pending join requests here and approves / rejects them.
  // Derive ownership from the REAL roster role, so a creator opening their team on a
  // second device (where t.joined may be truthy after cloud hydration) still gets the
  // gear + approval panel. Fall back to the old !t.joined heuristic only until the
  // roster + my id have loaded.
  const _meMember = (meId && Array.isArray(cloudRoster)) ? cloudRoster.find((m) => m.id === meId) : null;
  const _isOwner = _meMember ? (_meMember.role === "owner") : !t.joined;
  const [pending, setPending] = React.useState([]);
  React.useEffect(() => {
    if (!(_rosterLive && _isOwner) || !window.bosCloud.pendingRequests) return;
    let on = true;
    window.bosCloud.pendingRequests(t.cloudId).then((p) => { if (on) setPending(Array.isArray(p) ? p : []); }).catch(() => {});
    return () => { on = false; };
  }, [_rosterLive, _isOwner, t.cloudId, rosterTick]);
  const approveReq = (uid) => { window.bosCloud.approveMember(t.cloudId, uid).then((ok) => { if (ok) { setPending((p) => p.filter((x) => x.id !== uid)); setRosterTick((n) => n + 1); } }); };
  const rejectReq = (uid) => { window.bosCloud.rejectMember(t.cloudId, uid).then((ok) => { if (ok) setPending((p) => p.filter((x) => x.id !== uid)); }); };

  // REAL shared team habits for live teams (from the cloud): real names + per-member completion.
  const [liveTeamHabits, setLiveTeamHabits] = React.useState(() => _bosTeamGet("habits:" + t.cloudId));
  const [habitsTick, setHabitsTick] = React.useState(0);
  const [mainProg, setMainProg] = React.useState(() => _bosTeamGet("mainprog:" + t.cloudId)); // per-member day-map for the anchor habit (who did which day)
  const [goalProg, setGoalProg] = React.useState(() => _bosTeamGet("goal:" + t.cloudId)); // team-goal progress COMPUTED from habit marks (current + per-member contribution)
  const [settlements, setSettlements] = React.useState(null); // { user_id: {xp, won} } — team-goal XP payouts (cloud ledger)
  const settledRef = React.useRef(false);                      // settle-once guard (per mount per reached goal)
  React.useEffect(() => {
    if (!_rosterLive || !window.bosCloud.teamHabitsFull) return;
    let on = true;
    window.bosCloud.teamHabitsFull(t.cloudId).then((hs) => { if (on) setLiveTeamHabits(_bosTeamPut("habits:" + t.cloudId, Array.isArray(hs) ? hs : [])); }).catch(() => {});
    return () => { on = false; };
  }, [_rosterLive, t.cloudId, habitsTick]);
  const toggleMyTeamHabit = (h) => {
    if (!h || !h.id) return;
    // Derive the next state INSIDE the updater from the CURRENT item x (not the captured
    // outer h) so a fast double-tap can't double-count, and clamp doneToday to [0, total].
    setLiveTeamHabits((list) => (list || []).map((x) => {
      if (x.id !== h.id) return x;
      const next = !x.doneByMe;
      const cap = Number.isFinite(x.total) ? x.total : (x.doneToday + 1);
      const doneToday = Math.max(0, Math.min(cap, x.doneToday + (next ? 1 : -1)));
      return { ...x, doneByMe: next, doneToday: doneToday };
    }));
    if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} }
    window.bosCloud.toggleTeamHabitToday(h.id, !h.doneByMe).then(() => setHabitsTick((n) => n + 1));
  };
  const addTeamHabitCloud = (h) => { var first = !(liveTeamHabits && liveTeamHabits.length); window.bosCloud.addTeamHabit(t.cloudId, { ...h, isMain: (h && h.isMain) || first }).then(() => setHabitsTick((n) => n + 1)); };
  // A CLOUD team's roster lives in the cloud; the passed-in t.members is a STALE local
  // cache (the «3 снаружи / 0 внутри» mismatch). Until the real roster loads we show a
  // skeleton — NEVER the stale members, which used to flash phantom people for a beat
  // (David: «проскакивает заполненный демо-вариант»). Mirrors the teamHabits gate below.
  const _rosterLoading = _rosterLive && cloudRoster === null;
  const members = _rosterLive ? (cloudRoster || []) : (t.members?.length ? t.members : []);
  const ranked = members; // live: roster order (owner first), no contribution sort
  // Live: real cloud habits when synced, else the team's own habits, else empty.
  const teamHabits = _rosterLive ? (liveTeamHabits || []) : (Array.isArray(t.habits) ? t.habits : []);
  const main = teamHabits.find(h => h.isMain);
  const others = teamHabits.filter(h => !h.isMain);
  // ADOPT — «приходит как личная» (David): командная привычка становится твоей ЛИЧНОЙ (своё
  // время/значок), отмечаешь её на «Привычки», отметка зеркалится в командный счёт (toggleHabit →
  // toggleTeamHabitToday). Линк = поле teamHabitId. ЭТАП 2: дедуп — если уже ведёшь такую, предложить
  // ПРИВЯЗАТЬ существующую (без дубля, серия/время сохранятся). ЕДИНАЯ отметка: адаптированная
  // привычка отмечается через её личную копию (один источник) — никакого прямого team-write.
  const myHabits = app?.habits || [];
  const _todayK = new Date().toISOString().slice(0, 10);
  const adoptedFor = (h) => h && myHabits.find((x) => x.teamHabitId === h.id);
  const _dupeFor = (h) => h && myHabits.find((x) => !x.teamHabitId && (x.name || "").trim().toLowerCase() === (h.name || "").trim().toLowerCase());
  const _createLinkedHabit = (h) => { app?.addHabit({ name: h.name, emoji: h.emoji, color: h.color || null, teamId: t.cloudId, teamHabitId: h.id, log: {}, days: [1, 1, 1, 1, 1, 1, 1], goalPerDay: (h.goalPerDay || 1), reminder: { on: false, time: "09:00" } }); if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} } };
  const adoptTeamHabit = (h) => {
    if (!h || !h.id || adoptedFor(h)) return;
    const dupe = _dupeFor(h);
    if (dupe) {
      openSheet(<TeamAdoptChoiceLive dupeName={(dupe.name || "").trim()}
        onLink={() => { app?.updateHabit(dupe.id, { teamId: t.cloudId, teamHabitId: h.id }); }}
        onCreate={() => _createLinkedHabit(h)} />);
    } else { _createLinkedHabit(h); }
  };
  // Mark an ADOPTED team habit = toggle its personal copy (single source → mirrors to team_habit_logs).
  const markAdopted = (h) => { const a = adoptedFor(h); if (!a) return; app?.toggleHabit(a.id); if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} } setHabitsTick((n) => n + 1); };
  const myDone = (h) => { const a = adoptedFor(h); return a ? !!(a.log && a.log[_todayK]) : !!(h && h.doneByMe); };
  // Per-person "who did which day" for the team ANCHOR habit → feeds the SAME month calendar
  // the personal/shared habits use (data already per-user in team_habit_logs). Light poll.
  const _tCalKey = (d, mi) => { const y = new Date().getFullYear(); return y + "-" + String(mi + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0"); };
  const _mainId = main && main.id;
  React.useEffect(() => {
    let on = true;
    if (!_rosterLive || !_mainId || !window.bosCloud.teamHabitProgress) { setMainProg(null); return; }
    const load = () => window.bosCloud.teamHabitProgress(t.cloudId, _mainId).then((d) => { if (on && d && d.members) setMainProg(_bosTeamPut("mainprog:" + t.cloudId, d.members)); }).catch(() => {});
    load(); const iv = setInterval(load, 20000);
    return () => { on = false; clearInterval(iv); };
  }, [_rosterLive, t.cloudId, _mainId, habitsTick]);
  // Team GOAL progress — computed from the habit marks per mode (collective/streak/race).
  React.useEffect(() => {
    let on = true;
    if (!_rosterLive || !t.cloudId || !window.bosCloud.teamGoalProgress) { setGoalProg(null); return; }
    const load = () => window.bosCloud.teamGoalProgress(t.cloudId).then((d) => { if (on && d) setGoalProg(_bosTeamPut("goal:" + t.cloudId, d)); }).catch(() => {});
    load(); const iv = setInterval(load, 20000);
    return () => { on = false; clearInterval(iv); };
  }, [_rosterLive, t.cloudId, habitsTick]);
  // PAYOUT — when a STAKED goal is reached, OPEN the bank: idempotently settle MY row (co-op:
  // +stake; race: leader +bank), refresh the global team-goal XP so the level lifts, then read
  // everyone's payouts for the card. Settle runs once per mount (settledRef); the read re-runs on
  // each goalProg poll so other members' payouts appear as they open the team. Unlock-only —
  // nothing is ever deducted, so missing the goal just means the bank never opened.
  React.useEffect(() => {
    if (!_rosterLive || !t.cloudId || !window.bosCloud.settleTeamGoal) return;
    if (!goalProg || !goalProg.done || !(goalProg.stake > 0)) return;
    let on = true;
    const loadSettle = () => window.bosCloud.teamSettlements(t.cloudId).then((s) => { if (on) setSettlements(s || {}); }).catch(() => {});
    if (settledRef.current) { loadSettle(); }
    else {
      settledRef.current = true;
      window.bosCloud.settleTeamGoal(t.cloudId).then((res) => { if (!on) return; loadSettle(); if (res && res.settled && app && app.refreshTeamGoalXP) app.refreshTeamGoalXP(); }).catch(loadSettle);
    }
    return () => { on = false; };
  }, [_rosterLive, t.cloudId, goalProg]);
  const openAddHabit = () => openSheet(<TeamHabitSheetLive team={t} members={members} onAdd={(h) => { if (_rosterLive) addTeamHabitCloud(h); else app?.addTeamHabit(t._id, h); }} />);
  // КТО СЕГОДНЯ В ПОТОКЕ — отметившие якорь сегодня (per-member из mainProg) + я, если отметил.
  // Кормит орбиту (планеты загораются) и честный стат «Сегодня».
  const flowSet = {}; (mainProg || []).forEach((m) => { if (m.days && m.days[_todayK]) flowSet[m.id] = true; });
  if (meId && main && main.doneByMe) flowSet[meId] = true;
  const orbitFaces = (Array.isArray(members) ? members : []).map((m) => ({ id: m.id, avatar: m.avatar, name: m.name, done: !!flowSet[m.id] }));
  const inFlowToday = (Array.isArray(members) ? members : []).filter((m) => flowSet[m.id]).length;
  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title="Команда" onBack={() => navigate("community")} right={
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Правка НА МЕСТЕ — карандаш открывает шторку правки прямо над комнатой (не уводит
              на отдельный экран). _isOwner = роль из ростера, фолбэк !t.joined. «Поделиться»
              ушло вниз в тихие чипы («Позвать»), чтобы шапка не выбивалась. */}
          {_isOwner && <EditGlassButtonLive onClick={() => openSheet(<TeamQuickEditSheetLive team={t} navigate={navigate} />)} />}
        </div>
      }/>
      <div style={{ background: `linear-gradient(165deg, rgba(255,255,255,0.5), rgba(255,255,255,0.1) 46%, rgba(255,255,255,0) 72%), linear-gradient(135deg, ${accent} 0%, ${accent}66 60%, var(--card-fade) 100%)`, color: "var(--text)", borderRadius: 22, padding: 20, position: "relative", overflow: "hidden", boxShadow: "inset 0 1px 0.5px rgba(255,255,255,0.7), inset 0 0 0 0.7px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.06)", transform: "translateZ(0)" }}>
        <div style={{ position: "relative" }}>
          {/* Орбита круга — общая звезда в центре, люди-планеты загораются за сегодня */}
          <TeamOrbitLive emblem={t.emblem} accent={accent} faces={orbitFaces} isDark={isDark} />
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px", color: "var(--text)", textAlign: "center", marginTop: 2 }}>{t.name}</div>
          <div style={{ fontSize: 14, color: "var(--text-2)", marginTop: 6, fontWeight: 500, textAlign: "center" }}>🎯 {t.goal}</div>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2, textAlign: "center" }}>{t.date}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 9, justifyContent: "center" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 600, color: "var(--text-2)", background: "rgba(255,255,255,0.5)", padding: "4px 10px", borderRadius: 999 }}>
              {t.vis === "public" ? "🌐 Открытая · видна всем" : "🔒 Приватная · по приглашению"}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 600, color: "var(--text-2)", background: "rgba(255,255,255,0.5)", padding: "4px 10px", borderRadius: 999 }}>
              {teamModeMeta.e} {teamModeMeta.t}
            </span>
          </div>
          {/* The GOAL — the team's destination. Real progress toward the target
             (not the weekly habit aggregate), and it COMPLETES at target. */}
          {(() => {
            // Goal progress is COMPUTED FROM THE HABIT MARKS (David) via teamGoalProgress —
            // current + each member's contribution. Falls back to the local team fields until
            // it loads (or pre-SQL). Mode-aware label: общий счёт / серия у каждого / гонка.
            const gpd = goalProg;
            const unit = (gpd && gpd.unit) || t.unit || "";
            const tgt = (gpd && gpd.target) || t.target || 0;
            const cur = gpd ? gpd.current : (t.current != null ? t.current : Math.round((t.progress || 0) * tgt));
            const done = tgt > 0 && cur >= tgt;
            const gp = tgt > 0 ? Math.min(1, cur / tgt) : (t.progress || 0);
            const gType = (gpd && gpd.type) || t.type || "collective";
            const modeLabel = ({ streak: "Серия у каждого", race: "Гонка — лидер", collective: "Общий счёт" })[gType] || "Общий счёт";
            const contrib = (gpd && Array.isArray(gpd.members)) ? gpd.members : [];
            // Optional XP STAKE → bank. Unlock-only: reaching the goal OPENS the payout (co-op: each
            // gets stake; race: the leader takes the whole bank). Per-member payout = ledger truth if
            // settled, else the rule (contrib[0] is the race leader — sorted by value desc).
            const isRace = gType === "race";
            const stake = (gpd && gpd.stake) || t.stake || 0;
            const bank = (gpd && gpd.bank) || (stake * Math.max(1, contrib.length || members.length));
            const payFor = (m, i) => {
              if (!done || stake <= 0) return 0;
              if (settlements && settlements[m.id]) return settlements[m.id].xp || 0;
              return isRace ? (i === 0 ? bank : 0) : stake;
            };
            const myPay = (done && stake > 0) ? contrib.reduce((acc, m, i) => acc + (m.me ? payFor(m, i) : 0), 0) : 0;
            return (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>{done ? "Цель достигнута 🎉" : modeLabel}</span>
                  {tgt > 0 && <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{cur} / {tgt} {unit}</span>}
                </div>
                <div style={{ height: 9, background: "rgba(255,255,255,0.55)", borderRadius: 999, overflow: "hidden", marginTop: 6 }}>
                  <span style={{ display: "block", height: "100%", width: (gp * 100) + "%", background: done ? "linear-gradient(90deg,#FEDE34,#EF9F14)" : "var(--card-fill)", borderRadius: 999, transition: "width 0.6s ease" }} />
                </div>
                {tgt > 0 && !done && <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 6 }}>Осталось {Math.max(0, tgt - cur)} {unit} — закроем вместе</div>}
                {/* The XP STAKE while the goal is still open — what's in the pot + how it pays. */}
                {stake > 0 && !done && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: 11.5, fontWeight: 600, color: "var(--text-2)", background: "rgba(255,255,255,0.5)", padding: "4px 11px", borderRadius: 999 }}>
                    <span>🪙 Банк {bank} XP</span>
                    <span style={{ color: "var(--text-3)", fontWeight: 500 }}>· {isRace ? "лидер забирает всё" : `дойдём — каждому +${stake}`}</span>
                  </div>
                )}
                {/* PAYOUT — a real moment: the bank opens, XP lands. Mode-aware. */}
                {done && stake > 0 && (
                  <div style={{ marginTop: 11, padding: "11px 13px", borderRadius: 16, background: "linear-gradient(135deg,#FEDE34,#EF9F14)", color: "#0a0a0a" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.2px" }}>🎉 Цель достигнута!</div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 3, lineHeight: 1.4 }}>
                      {isRace
                        ? (myPay > 0 ? `Ты лидер гонки — весь банк твой: +${myPay} XP 👑` : `Банк ${bank} XP забрал лидер гонки`)
                        : `Банк раскрыт — тебе +${myPay || stake} XP, и столько же каждому`}
                    </div>
                  </div>
                )}
                {/* Вклад каждого — кто сколько внёс (из их отметок), с реальным аватаром + выплата. */}
                {contrib.length > 0 && (
                  <div style={{ display: "flex", gap: 7, marginTop: 11, flexWrap: "wrap" }}>
                    {contrib.map((m, i) => {
                      const pay = payFor(m, i);
                      return (
                        <span key={m.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.55)", borderRadius: 999, padding: "3px 10px 3px 3px" }}>
                          <BuddyFaceLive avatar={m.avatar} name={m.name} size={20} />
                          <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-2)" }}>{m.me ? "Ты" : (m.name || "").split(" ")[0]} · {m.value}</span>
                          {pay > 0 && <span style={{ fontSize: 10, fontWeight: 800, color: "#7a5300", background: "rgba(254,222,52,0.95)", borderRadius: 999, padding: "1px 6px" }}>+{pay}{isRace ? " 👑" : ""}</span>}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Stat band — the SAME unified plaque as Habits/Goals detail (StatTrioLive). Team streak stays
          «—» (no honest cross-member streak yet). */}
      <StatTrioLive isDark={isDark} card={{ background: "var(--card)", boxShadow: "var(--card-shadow)", marginTop: 12, transform: "translateZ(0)" }} items={[
        { l: "Привычки", v: teamHabits.length, suf: "", icon: <I.ChartBar size={14} color="var(--text-4)" /> },
        { l: "Участники", v: _rosterLoading ? 0 : members.length, suf: "", icon: <I.Users size={14} color="var(--text-4)" /> },
        { l: "Сегодня", v: _rosterLoading ? 0 : inFlowToday, suf: "", icon: <I.Flame size={14} color="var(--text-4)" /> },
      ]} />

      {/* Чат уехал вниз в тихие чипы (см. конец комнаты) — David: чат нужен в основном тренеру,
          не должен доминировать; у семьи/друзей он просто тихий. */}

      <div className="section-label" style={{ marginTop: 22 }}>Сегодня вместе</div>
      {main && (<>
      {/* Main habit — featured card (якорь команды) */}
      <div style={{ background: BOS_TILE_SHEEN + ", var(--card)", borderRadius: 22, padding: 18, marginTop: 8, color: "var(--text)", position: "relative", overflow: "hidden", boxShadow: bosTileGlass(isDark) + ", var(--card-shadow)", transform: "translateZ(0)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ width: 48, height: 48, borderRadius: 14, background: BOS_TILE_SHEEN + ", " + (main.color ? main.color + "26" : "var(--surface-3)"), boxShadow: bosTileGlass(isDark), display: "grid", placeItems: "center", fontSize: 26, flexShrink: 0 }}>{bosIcon(main.emoji, 26, main.color)}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.4, color: "var(--text-4)", display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#EF9F14" }}/>Якорь команды</div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.4px", marginTop: 3, color: "var(--text)" }}>{main.name}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>Сегодня</span>
          <span style={{ fontSize: 13, color: "var(--text-3)" }}>{main.doneToday} из {main.total} участников ✓</span>
        </div>
        {/* Guard against a desynced doneByMe / total: clamp the bar to [0,100%]. */}
        {(() => { const denom = main.total || 1; return (
        <div style={{ height: 8, background: "var(--surface-3)", borderRadius: 999, overflow: "hidden", marginTop: 6 }}>
          <span style={{ display: "block", height: "100%", width: Math.min(100, (main.doneToday/denom*100))+"%", background: bosCellFill("#0a0a0a", 1), borderRadius: 999 }} />
        </div>
        ); })()}
        {/* Member faces — REAL avatars (BuddyFaceLive), dimmed until they check in today. Anonymous
            dots only while the roster loads. */}
        {(() => {
          const todayK = new Date().toISOString().slice(0, 10);
          const doneSet = {}; (mainProg || []).forEach((m) => { if (m.days && m.days[todayK]) doneSet[m.id] = true; });
          const faces = (Array.isArray(members) && members.length) ? members : null;
          if (!faces) return (
            <div style={{ display: "flex", gap: 5, marginTop: 12, flexWrap: "wrap" }}>
              {Array.from({ length: Math.max(0, main.total) }).map((_, i) => (
                <span key={i} style={{ width: 22, height: 22, borderRadius: "50%", background: i < main.doneToday ? "#0a0a0a" : "var(--surface-3)", display: "grid", placeItems: "center", color: "#fff", fontSize: 11, fontWeight: 700 }}>{i < main.doneToday ? "✓" : ""}</span>
              ))}
            </div>
          );
          const FCAP = 10; // full-width card fits ~10 faces, then a «+N» disc for the rest
          const fShown = faces.slice(0, FCAP), fExtra = faces.length - fShown.length;
          return (
            <div style={{ display: "flex", gap: 7, marginTop: 12, flexWrap: "wrap" }}>
              {fShown.map((m) => {
                const did = !!doneSet[m.id] || (m.id === meId && main.doneByMe);
                return (
                  <span key={m.id} style={{ position: "relative", display: "block", opacity: did ? 1 : 0.4 }}>
                    <BuddyFaceLive avatar={m.avatar} name={m.name} size={28} />
                    {did && <span style={{ position: "absolute", right: -1, bottom: -1, width: 13, height: 13, borderRadius: "50%", background: "#0a0a0a", color: "#fff", fontSize: 8, fontWeight: 800, display: "grid", placeItems: "center", boxShadow: "0 0 0 1.5px var(--card)" }}>✓</span>}
                  </span>
                );
              })}
              {fExtra > 0 && <span style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.16)", color: "var(--text)", fontSize: 11, fontWeight: 800, letterSpacing: "-0.5px", display: "grid", placeItems: "center" }}>+{fExtra}</span>}
            </div>
          );
        })()}
        {/* Adopted → отметка идёт через ЛИЧНУЮ копию (единый источник). Не адаптирована → «Вести у себя». */}
        {_rosterLive && (adoptedFor(main)
          ? <button onClick={() => markAdopted(main)} className="tap" style={{ width: "100%", marginTop: 14, border: myDone(main) ? "1.5px solid var(--line)" : 0, borderRadius: 999, padding: "11px 14px", fontSize: 14, fontWeight: 600, background: myDone(main) ? "transparent" : "#0a0a0a", color: myDone(main) ? "var(--text-2)" : "#fff" }}>
              {myDone(main) ? "✓ Сделано сегодня" : "Отметить сегодня"}
            </button>
          : <button onClick={() => adoptTeamHabit(main)} className="tap" style={{ width: "100%", marginTop: 14, background: "transparent", border: "1px dashed rgba(0,0,0,0.18)", borderRadius: 999, padding: "11px 14px", fontSize: 14, fontWeight: 600, color: "var(--text-2)", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}><I.Plus size={15} /> Вести у себя</button>
        )}
      </div>
      </>)}

      {/* WHO did WHICH day — per-person month calendar for the team anchor habit (the SAME
          calendar the personal/shared habits use, real avatars on the chips). David: «у кого
          какой день на календаре — и в командах должно работать». */}
      {_rosterLive && main && mainProg && mainProg.length > 0 && (
        <PeopleMonthCalendarLive
          people={mainProg.map((m) => ({ name: m.me ? "Ты" : m.name, initials: m.me ? "Я" : ((m.name || "У").charAt(0).toUpperCase()), color: accent, you: !!m.me, avatar: m.avatar }))}
          dayFrac={(pi, d, mi) => (mainProg[pi] && mainProg[pi].days[_tCalKey(d, mi)] ? 1 : 0)}
          label={"Кто отметил «" + main.name + "»"}
        />
      )}

      <div className="section-label" style={{ marginTop: 22 }}>Привычки команды ({others.length})</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        {teamHabits.length === 0 && (
          <div style={{ fontSize: 13, color: "var(--text-4)", padding: "4px 2px 8px", lineHeight: 1.5 }}>Пока нет общих привычек. Добавь первую — она станет якорем команды.</div>
        )}
        {others.map((h, i) => (
          <div key={i} style={{ background: "var(--card)", borderRadius: 22, padding: 14, display: "flex", alignItems: "center", gap: 12, boxShadow: "var(--card-shadow)" }}>
            <span style={{ width: 40, height: 40, borderRadius: 14, background: BOS_TILE_SHEEN + ", " + (h.color ? h.color + "26" : "var(--surface-3)"), boxShadow: bosTileGlass(isDark), display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0 }}>{bosIcon(h.emoji, 22, h.color)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{h.name}</div>
              {/* Aggregate weekly consistency — the day-by-day view lives in the calendar above */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 7 }}>
                <div style={{ flex: 1, maxWidth: 110, height: 5, borderRadius: 999, background: "var(--surface-3)", overflow: "hidden" }}>
                  <span style={{ display: "block", height: "100%", width: Math.round((h.weekPct || 0) * 100) + "%", background: "#0a0a0a", borderRadius: 999 }} />
                </div>
                <span style={{ fontSize: 11.5, color: "var(--text-4)" }}>{Math.round((h.weekPct || 0) * 100)}% за неделю</span>
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{h.doneToday}/{h.total}</div>
              <div style={{ fontSize: 10, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1 }}>сегодня</div>
            </div>
            {_rosterLive && (adoptedFor(h)
              ? <button onClick={() => markAdopted(h)} className={"check-btn tap " + (myDone(h) ? "" : "unchecked")} aria-label="Отметить" style={{ flexShrink: 0, width: 34, height: 34, "--check-color": "#0a0a0a" }}>{myDone(h) && <I.Check size={16} color="#fff" strokeWidth={3} />}</button>
              : <button onClick={() => adoptTeamHabit(h)} className="tap" aria-label="Вести у себя" title="Вести у себя" style={{ flexShrink: 0, height: 34, padding: "0 12px", borderRadius: 999, border: "1px dashed rgba(0,0,0,0.18)", background: "transparent", color: "var(--text-2)", fontSize: 12.5, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}><I.Plus size={13} /> У себя</button>
            )}
          </div>
        ))}
        <button onClick={openAddHabit} className="tap" style={{ background: "transparent", border: "1px dashed rgba(0,0,0,0.18)", borderRadius: 22, padding: 14, color: "var(--text-3)", fontSize: 14, fontWeight: 500 }}>
          + Добавить привычку команды
        </button>
      </div>

      {_isOwner && pending.length > 0 && (<>
        <div className="section-label" style={{ marginTop: 22 }}>Заявки на вступление ({pending.length})</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
          {pending.map((p, pi) => (
            <div key={p.id} style={{ background: "var(--card)", borderRadius: 22, boxShadow: "var(--card-shadow)", padding: 12, display: "flex", alignItems: "center", gap: 12 }}>
              <BuddyFaceLive avatar={p.avatar} name={p.name} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{p.name || "Гость"}</div>
                <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 1 }}>хочет вступить</div>
              </div>
              <button onClick={() => approveReq(p.id)} className="tap" style={{ flexShrink: 0, background: "#0a0a0a", color: "#fff", border: 0, borderRadius: 999, padding: "8px 14px", fontSize: 13, fontWeight: 600 }}>Принять</button>
              <button onClick={() => rejectReq(p.id)} className="tap" aria-label="Отклонить" style={{ flexShrink: 0, background: "var(--surface-3)", color: "var(--text-3)", border: 0, borderRadius: 999, width: 34, height: 34, fontSize: 16, lineHeight: 1 }}>✕</button>
            </div>
          ))}
        </div>
      </>)}
      <div className="section-label" style={{ marginTop: 22 }}>Наши{_rosterLoading ? "" : " · " + members.length}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        {_rosterLoading && [0, 1].map((i) => (
          <div key={"sk" + i} style={{ background: "var(--card)", borderRadius: 22, boxShadow: "var(--card-shadow)" }}>
            <div style={{ padding: 12, display: "flex", alignItems: "center", gap: 12 }}>
              <span className="bos-skel" style={{ width: 40, height: 40, borderRadius: "50%" }} />
              <div style={{ flex: 1 }}>
                <span className="bos-skel" style={{ display: "block", width: "42%", height: 12, borderRadius: 6 }} />
                <span className="bos-skel" style={{ display: "block", width: "26%", height: 10, borderRadius: 6, marginTop: 7 }} />
              </div>
            </div>
          </div>
        ))}
        {!_rosterLoading && ranked.map((m,i)=>{
          return (
          <div key={i} style={{ background: "var(--card)", borderRadius: 22, boxShadow: "var(--card-shadow)", overflow: "hidden" }}>
            <div style={{ width: "100%", padding: 12, display: "flex", alignItems: "center", gap: 12, textAlign: "left", color: "var(--text)" }}>
              <BuddyFaceLive avatar={m.avatar} name={m.name} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{m.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2 }}>{m.role === "owner" ? "Создатель команды" : "Участник"}</div>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {/* Тихое — чат и приглашение спокойными стеклянными чипами внизу комнаты. Чат живёт здесь
          (не доминирует сверху); счётчик непрочитанных остаётся. «Позвать» = бывшая шара из шапки. */}
      <div style={{ display: "flex", gap: 8, marginTop: 22 }}>
        <button onClick={() => { markChatRead(); navigate("team-chat", { team: t }); }} className="tap" style={{ flex: 1, position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, background: BOS_TILE_SHEEN + ", var(--surface-3)", boxShadow: bosTileGlass(isDark), border: 0, borderRadius: 16, padding: "12px 10px", fontSize: 13.5, fontWeight: 600, color: "var(--text-2)" }}>
          <span style={{ fontSize: 16, lineHeight: 1 }}>💬</span> Чат
          {_chatLive && chatPeek && chatPeek.unread > 0 && <span style={{ position: "absolute", top: 7, right: 12, background: "#FF3B30", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 999, minWidth: 16, height: 16, padding: "0 4px", display: "grid", placeItems: "center" }}>{chatPeek.unread > 99 ? "99+" : chatPeek.unread}</span>}
        </button>
        <button onClick={() => openSheet(<TeamShareSheetLive team={t} />)} className="tap" style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, background: BOS_TILE_SHEEN + ", var(--surface-3)", boxShadow: bosTileGlass(isDark), border: 0, borderRadius: 16, padding: "12px 10px", fontSize: 13.5, fontWeight: 600, color: "var(--text-2)" }}>
          <I.Share size={16}/> Позвать
        </button>
      </div>

      {/* ПОКИНУТЬ — только участник (у него нет карандаша). Владелец УДАЛЯЕТ круг со шторки правки
          (карандаш) — David: «удалить никчему на главной внутри круга». */}
      {!_isOwner && (
        <button onClick={() => bosConfirmExitTeam({ app, team: t, isOwner: false, navigate, openSheet })} className="tap"
          style={{ width: "100%", marginTop: 26, background: "transparent", border: 0, color: "var(--accent-red)", padding: 14, fontSize: 15, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
          <I.Logout size={17}/> Покинуть круг
        </button>
      )}
    </div>
  );
}

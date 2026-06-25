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
   CloudTeamsDiscover, ConfirmActionSheet, TeamShareSheet, TeamHabitSheet, TeamRing) +
   the live forks in shared_live.jsx (NetworkLockedLive, PeopleMonthCalendarLive) +
   framework (BosAvatar, PageHeader, the icon object I, the bos* helpers, window.bosCloud,
   hooks useApp/useNav/useSheet, and useCS = React.useState). The ONLY new top-level
   declarations in this file are `function CommunityLive` and `function TeamDetailLive`. */

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
  const _commLvl = (typeof bosLiveXP === "function" && typeof bosLevelInfo === "function") ? bosLevelInfo(bosLiveXP(app)) : null;
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
        <button onClick={() => navigate("team-create")} className="tap" style={{ background: "#0a0a0a", color: "#fff", border: 0, borderRadius: 999, padding: "10px 14px", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, boxShadow: "0 4px 14px rgba(0,0,0,0.18)" }}>
          <I.Plus size={16}/> Новая команда
        </button>
      </div>

      {/* Primary section — pill */}
      <div className="tab-pill" style={{ background: "var(--card-2)" }}>
        <button className={"tap " + (section === "discover" ? "active" : "")} onClick={() => setSection("discover")}>Команды</button>
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
          {teams.map((t, i) => {
            const tgt = t.target || 0;
            const cur = t.current != null ? t.current : Math.round((t.progress || 0) * tgt);
            const gp = tgt > 0 ? Math.min(1, cur / tgt) : (t.progress || 0);
            return (
            <div key={i} className="team-card" style={{ ["--team-accent"]: t.accent, borderRadius: 22, padding: 18, position: "relative", overflow: "hidden" }}>
              {/* soft pastel card + faded emblem watermark — the calmer earlier look (no glow) */}
              <div aria-hidden className="team-card__emblem" style={{ position: "absolute", top: -10, right: -6, fontSize: 110, lineHeight: 1, pointerEvents: "none", transform: "rotate(8deg)" }}>{t.emblem}</div>
              <div style={{ position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 18, color: "var(--text)", letterSpacing: "-0.4px" }}>{t.name}</div>
                  <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 600, color: "var(--text-3)", background: "var(--card-track)", padding: "2px 8px", borderRadius: 999 }}>{t.vis === "public" ? "🌐 Открытая" : "🔒 Приватная"}</span>
                </div>
                <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 6, fontWeight: 500 }}>🎯 {t.goal}</div>
                <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{t.date} · {t.members.length} участников</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>
                  <span>{t.target ? "К цели" : "Прогресс команды"}</span>
                  <span style={{ color: "var(--text)" }}>{t.target ? `${cur} / ${tgt} ${t.unit || ""}` : Math.round(gp * 100) + "%"}</span>
                </div>
                <div style={{ marginTop: 6, height: 8, borderRadius: 999, background: "var(--card-track)", overflow: "hidden" }}>
                  <span className="team-card__fill" style={{ display: "block", height: "100%", width: (gp * 100) + "%", borderRadius: 999 }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", marginTop: 14, gap: 8 }}>
                  <AvatarStack people={t.members} size={28} max={5} label={false}/>
                  <button onClick={() => navigate("team-detail", { team: t })} className="tap team-card__cta" style={{ marginLeft: "auto", border: 0, borderRadius: 999, padding: "11px 18px", fontSize: 13.5, fontWeight: 600 }}>
                    Открыть команду
                  </button>
                </div>
              </div>
            </div>
            );
          })}
          {teams.length === 0 && (
            <div style={{ textAlign: "center", padding: "8px 18px 2px", color: "var(--text-4)", fontSize: 13.5, lineHeight: 1.5 }}>
              Команды — это привычки вместе с друзьями. Создай первую или дождись приглашения.
            </div>
          )}
          <button data-tour="make-team" onClick={() => navigate("team-create")} className="tap team-new-cta" style={{ color: "#fff", border: 0, borderRadius: 22, padding: 18, display: "flex", alignItems: "center", gap: 14, textAlign: "left" }}>
            <span style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,222,52,0.15)", display: "grid", placeItems: "center" }}>
              <I.Plus size={22} color="#FEDE34"/>
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 16 }}>Создать команду</div>
              <div style={{ fontSize: 12, opacity: 0.65, marginTop: 2 }}>Пригласи друзей, поставь общую цель, выстраивайте серии вместе.</div>
            </div>
            <I.ChevronRight size={18}/>
          </button>
          {/* D3 — open teams from the cloud you can join (live user, always shown when
              the cloud surfaces joinable teams). */}
          <CloudTeamsDiscover app={app} />
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

function TeamDetailLive() {
  const { navigate, params } = useNav();
  const app = useApp();
  const { open: openSheet } = useSheet();
  const passed = params?.team || { _id: "seed-1", name: "Команда создателей", emblem: "✨", accent: "#fef3c7", goal: "50 добрых дел за месяц", date: "1 — 31 дек", progress: 0, members: [] };
  // Read the LIVE team from the store so a just-added habit appears immediately.
  const t = (app?.teams || []).find(x => x._id === passed._id) || passed;
  const accent = t.accent || "#fef3c7";
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
  const [cloudRoster, setCloudRoster] = React.useState(null);
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
      setCloudRoster(sorted.map((m, i) => ({ id: m.id, name: m.name || "Участник", avatar: m.avatar, role: m.role, initials: (m.name || "У").slice(0, 1).toUpperCase(), color: palette[i % palette.length] })));
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
  const [liveTeamHabits, setLiveTeamHabits] = React.useState(null);
  const [habitsTick, setHabitsTick] = React.useState(0);
  React.useEffect(() => {
    if (!_rosterLive || !window.bosCloud.teamHabitsFull) return;
    let on = true;
    window.bosCloud.teamHabitsFull(t.cloudId).then((hs) => { if (on) setLiveTeamHabits(Array.isArray(hs) ? hs : []); }).catch(() => {});
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
  const liveRoster = _rosterLive && cloudRoster;
  // Live: real cloud roster when synced, else the team's own member list, else empty.
  // NEVER fabricate a member.
  const members = liveRoster ? cloudRoster : (t.members?.length ? t.members : []);
  const ranked = members; // live: roster order (owner first), no contribution sort
  // Live: real cloud habits when synced, else the team's own habits, else empty.
  const teamHabits = _rosterLive ? (liveTeamHabits || []) : (Array.isArray(t.habits) ? t.habits : []);
  const main = teamHabits.find(h => h.isMain);
  const others = teamHabits.filter(h => !h.isMain);
  const openAddHabit = () => openSheet(<TeamHabitSheet team={t} members={members} onAdd={(h) => { if (_rosterLive) addTeamHabitCloud(h); else app?.addTeamHabit(t._id, h); }} />);
  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title="Команда" onBack={() => navigate("community")} right={
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => openSheet(<TeamShareSheet team={t} />)} className="tap" title="Поделиться командой" style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--surface-3)", border: 0, display: "grid", placeItems: "center" }}>
            <I.Share size={18}/>
          </button>
          {/* E — only the team's CREATOR sees the gear. _isOwner reads the real roster role
              (so a creator on a second device still gets it), falling back to !t.joined. */}
          {_isOwner && (
          <button onClick={() => navigate("team-settings", { team: t })} className="tap" style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--surface-3)", border: 0, display: "grid", placeItems: "center" }}>
            <I.Settings size={18}/>
          </button>
          )}
        </div>
      }/>
      <div style={{ background: `linear-gradient(135deg, ${accent} 0%, ${accent}66 60%, var(--card-fade) 100%)`, color: "var(--text)", borderRadius: 22, padding: 20, position: "relative", overflow: "hidden" }}>
        <div aria-hidden style={{ position: "absolute", top: -14, right: -10, fontSize: 150, lineHeight: 1, opacity: 0.28, pointerEvents: "none", filter: "saturate(0.9)", transform: "rotate(8deg)" }}>{t.emblem || "✨"}</div>
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px", color: "var(--text)" }}>{t.name}</div>
          <div style={{ fontSize: 14, color: "var(--text-2)", marginTop: 6, fontWeight: 500 }}>🎯 {t.goal}</div>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{t.date}</div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 9, fontSize: 11.5, fontWeight: 600, color: "var(--text-2)", background: "rgba(255,255,255,0.5)", padding: "4px 10px", borderRadius: 999 }}>
            {t.vis === "public" ? "🌐 Открытая · видна всем" : "🔒 Приватная · по приглашению"}
          </span>
          {/* The GOAL — the team's destination. Real progress toward the target
             (not the weekly habit aggregate), and it COMPLETES at target. */}
          {(() => {
            const tgt = t.target || 0;
            const cur = t.current != null ? t.current : Math.round((t.progress || 0) * tgt);
            const done = tgt > 0 && cur >= tgt;
            const gp = tgt > 0 ? Math.min(1, cur / tgt) : (t.progress || 0);
            return (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>{done ? "Цель достигнута 🎉" : "До цели вместе"}</span>
                  {tgt > 0 && <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{cur} / {tgt} {t.unit || ""}</span>}
                </div>
                <div style={{ height: 9, background: "rgba(255,255,255,0.55)", borderRadius: 999, overflow: "hidden", marginTop: 6 }}>
                  <span style={{ display: "block", height: "100%", width: (gp * 100) + "%", background: done ? "linear-gradient(90deg,#FEDE34,#EF9F14)" : "var(--card-fill)", borderRadius: 999, transition: "width 0.6s ease" }} />
                </div>
                {tgt > 0 && !done && <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 6 }}>Осталось {tgt - cur} {t.unit || ""} — закроем вместе</div>}
              </div>
            );
          })()}
          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            <div><div style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>Привычки</div><div style={{ fontSize: 18, fontWeight: 700, marginTop: 2, color: "var(--text)" }}>{teamHabits.length}</div></div>
            <div><div style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>Участники</div><div style={{ fontSize: 18, fontWeight: 700, marginTop: 2, color: "var(--text)" }}>{members.length}</div></div>
            {/* Team streak is fabricated standing — no honest cross-member streak yet, so live shows «—». */}
            <div><div style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>Серия</div><div style={{ fontSize: 18, fontWeight: 700, marginTop: 2, color: "var(--text)" }}>—</div></div>
          </div>
        </div>
      </div>

      {/* Team chat — one shared space for the whole team. Live preview comes from the
          cloud; before sync it shows the neutral empty hint. */}
      <button data-tour="team-chat" onClick={() => { markChatRead(); navigate("team-chat", { team: t }); }} className="tap" style={{ width: "100%", marginTop: 12, background: "var(--card)", border: 0, borderRadius: 22, padding: 14, boxShadow: "var(--card-shadow)", display: "flex", alignItems: "center", gap: 13, textAlign: "left", color: "var(--text)" }}>
        <span style={{ width: 44, height: 44, borderRadius: 14, background: "var(--surface-3)", display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0 }}>💬</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15.5, fontWeight: 600 }}>Чат команды</div>
          <div style={{ fontSize: 12.5, color: "var(--text-4)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{_chatLive ? (chatPeek ? (chatPeek.last || "Пока пусто — напишите первыми") : "…") : "Пока пусто — напишите первыми"}</div>
        </div>
        {_chatLive && chatPeek && chatPeek.unread > 0
          ? <span style={{ background: "#FF3B30", color: "#fff", fontSize: 11, fontWeight: 700, borderRadius: 999, minWidth: 20, height: 20, padding: "0 6px", display: "grid", placeItems: "center", flexShrink: 0 }}>{chatPeek.unread > 99 ? "99+" : chatPeek.unread}</span>
          : null}
        <I.ChevronRight size={18} color="var(--text-4)"/>
      </button>

      {main && (<>
      {/* Main habit — featured card */}
      <div className="section-label" style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FEDE34" }}/> Главная привычка
      </div>
      <div style={{ background: "linear-gradient(135deg,#FEDE34,#EF9F14)", borderRadius: 22, padding: 18, marginTop: 8, color: "#0a0a0a", position: "relative", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 38 }}>{main.emoji}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.4, opacity: 0.6 }}>Якорь команды</div>
            <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.4px", marginTop: 2 }}>{main.name}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Сегодня</span>
          <span style={{ fontSize: 13 }}>{main.doneToday} из {main.total} участников ✓</span>
        </div>
        {/* Guard against a desynced doneByMe / total: never let the bar exceed 100% or
            divide by zero, and never render a negative number of member dots. */}
        {(() => { const denom = main.total || 1; return (
        <div style={{ height: 8, background: "rgba(0,0,0,0.12)", borderRadius: 999, overflow: "hidden", marginTop: 6 }}>
          <span style={{ display: "block", height: "100%", width: Math.min(100, (main.doneToday/denom*100))+"%", background: "#0a0a0a" }} />
        </div>
        ); })()}
        {/* Member dots */}
        <div style={{ display: "flex", gap: 4, marginTop: 12, flexWrap: "wrap" }}>
          {Array.from({length: Math.max(0, main.total)}).map((_, i) => (
            <span key={i} style={{
              width: 22, height: 22, borderRadius: "50%",
              background: i < main.doneToday ? "#0a0a0a" : "rgba(0,0,0,0.15)",
              display: "grid", placeItems: "center", color: "#FEDE34", fontSize: 11, fontWeight: 700,
            }}>{i < main.doneToday ? "✓" : ""}</span>
          ))}
        </div>
        {_rosterLive && (
          <button onClick={() => toggleMyTeamHabit(main)} className="tap" style={{ width: "100%", marginTop: 14, border: 0, borderRadius: 999, padding: "11px 14px", fontSize: 14, fontWeight: 700, background: main.doneByMe ? "rgba(0,0,0,0.12)" : "#0a0a0a", color: main.doneByMe ? "#0a0a0a" : "#FEDE34" }}>
            {main.doneByMe ? "✓ Сделано сегодня" : "Отметить сегодня"}
          </button>
        )}
      </div>
      </>)}

      <div className="section-label" style={{ marginTop: 22 }}>Привычки команды ({others.length})</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        {teamHabits.length === 0 && (
          <div style={{ fontSize: 13, color: "var(--text-4)", padding: "4px 2px 8px", lineHeight: 1.5 }}>Пока нет общих привычек. Добавь первую — она станет якорем команды.</div>
        )}
        {others.map((h, i) => (
          <div key={i} style={{ background: "var(--card)", borderRadius: 22, padding: 14, display: "flex", alignItems: "center", gap: 12, boxShadow: "var(--card-shadow)" }}>
            <span style={{ width: 40, height: 40, borderRadius: 14, background: "var(--surface-3)", display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0 }}>{h.emoji}</span>
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
            {_rosterLive && (
              <button onClick={() => toggleMyTeamHabit(h)} className="tap" aria-label="Отметить" style={{ flexShrink: 0, width: 34, height: 34, borderRadius: "50%", border: h.doneByMe ? "0" : "2px solid var(--surface-3)", background: h.doneByMe ? "#0a0a0a" : "transparent", color: "#fff", display: "grid", placeItems: "center", fontSize: 15, padding: 0 }}>{h.doneByMe ? "✓" : ""}</button>
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
              <span style={{ position: "relative", width: 40, height: 40, borderRadius: "50%", background: BOS_TEAM_PALETTE[pi % BOS_TEAM_PALETTE.length], display: "grid", placeItems: "center", color: "rgba(0,0,0,0.6)", fontWeight: 700, flexShrink: 0, overflow: "hidden" }}>
                {p.avatar && typeof BosAvatar === "function" ? <BosAvatar avatar={p.avatar} size={40} style={{ position: "absolute", inset: 0, borderRadius: "50%" }} /> : (p.name || "?").slice(0, 1)}
              </span>
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
      <div className="section-label" style={{ marginTop: 22 }}>Участники ({members.length})</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        {ranked.map((m,i)=>{
          return (
          <div key={i} style={{ background: "var(--card)", borderRadius: 22, boxShadow: "var(--card-shadow)", overflow: "hidden" }}>
            <div style={{ width: "100%", padding: 12, display: "flex", alignItems: "center", gap: 12, textAlign: "left", color: "var(--text)" }}>
              <span style={{ position: "relative", width: 40, height: 40, borderRadius: "50%", background: m.color, display: "grid", placeItems: "center", color: "rgba(0,0,0,0.6)", fontWeight: 700, flexShrink: 0 }}>
                {m.avatar && typeof BosAvatar === "function" ? <BosAvatar avatar={m.avatar} size={40} style={{ position: "absolute", inset: 0, borderRadius: "50%" }} /> : m.initials}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{m.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2 }}>{m.role === "owner" ? "Создатель команды" : "Участник"}</div>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {/* Leave / delete — always shown for the live user. The owner deletes the whole
          team (cloud deleteTeam); a member leaves (cloud leaveTeam). Both confirm first and
          go back to the list. bosExitTeam guards a not-yet-synced local team (no cloudId). */}
      <button onClick={() => bosConfirmExitTeam({ app, team: t, isOwner: _isOwner, navigate, openSheet })} className="tap"
        style={{ width: "100%", marginTop: 26, background: "transparent", border: 0, color: "var(--accent-red)", padding: 14, fontSize: 15, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
        {_isOwner ? <><I.Trash size={17}/> Удалить команду</> : <><I.Logout size={17}/> Покинуть команду</>}
      </button>
    </div>
  );
}

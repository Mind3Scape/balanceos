/* HOME — LIVE-only fork of HomeScreen (real Telegram user, app.mode === "live"
   is ALWAYS true here). The demo/fresh branches are stripped: no segmented
   Привычки/Цели toggle, no demo balance-wheel / demo stat strip / demo MoodWidget,
   no fresh «Что дальше?» banner. Everything else reuses the shared core/ toolkit
   (HeroOrbFace, HabitCheck, HabitRing, AvatarStack, bosPill* helpers) + the live
   forks in screens/live/shared_live.jsx (HomeHeroSwipeLive, MoodWidgetLive,
   ShareAppSheetLive, ShareHabitSheetLive) + framework (SwipeRow, BosOrbFace, I,
   hooks, the bos* helpers). The ONLY new top-level
   declaration in this file is `function HomeLive`. */
function HomeLive() {
  const { navigate } = useNav();
  const { open: openSheet } = useSheet();
  const app = useApp();
  const widgets = app?.widgets || {};
  const mood = app?.mood;
  const wrapRef = React.useRef(null);
  const isDark = useThemeFlag(wrapRef);
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
  // Date line under the greeting — the device's REAL current date in Russian
  // ("Вторник · 28 апреля"). Live always shows the real date.
  let _todayLabel = "Вторник · 28 апреля";
  let _calLabel = "28 апр"; // short form for the Calendar card
  try {
    const _wd = new Intl.DateTimeFormat("ru-RU", { weekday: "long" }).format(new Date());
    const _dm = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(new Date());
    _todayLabel = _wd.charAt(0).toUpperCase() + _wd.slice(1) + " · " + _dm;
    _calLabel = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(new Date()).replace(".", "");
  } catch (e) {}
  // A real Telegram user with no habits yet gets the get-started hero + an engaging
  // level BANNER instead of the dense stat strip.
  const isNewbie = (habits.length === 0);
  const toggle = app?.toggleHabit || (() => {});
  const remove = app?.removeHabit || (() => {});
  const removeGoal = app?.removeGoal || (() => {});
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
  // Live profiles get REAL numbers from the date-keyed habit model.
  const _liveXP = bosLiveXPLive(app);
  const _lvl = bosLevelInfoLive(_liveXP);
  // The gold level banner is the live home's XP hero — on by default, but the user can
  // swipe it away (David: "я всё понял про уровни, хочу только привычки") → widgets.level
  // = false; re-addable in «Виджеты главного».
  const _showLevelBanner = widgets.level !== false;
  const dayStreak = bosMaxStreak(habits);
  // FOMO invite copy — the REAL next reward you're leaving on the table (honest: real XP, real
  // proximity to the next circle milestone; no fake countdowns).
  const _invited = app?.invitedCount || 0;
  const _inviteMiles = [{ n: 3, b: 300 }, { n: 7, b: 700 }, { n: 15, b: 1500 }, { n: 30, b: 3000 }];
  const _nextInviteMile = _inviteMiles.find(m => m.n > _invited);
  const _inviteFomo = _invited === 0
    ? "Первый друг = +150 XP, трое = +300 сверху. Не упусти 🔥"
    : _nextInviteMile
      ? "Ещё " + (_nextInviteMile.n - _invited) + " до +" + _nextInviteMile.b + " XP бонусом 🔥"
      : "+150 XP за каждого нового друга";

  // Bell red dot — only light it when there are REAL unread team-chat messages —
  // same signal NotificationsScreen uses (loadMessages per cloud team vs. the
  // per-team "bos:chatread:" timestamp). If the cloud is off or nothing's unread,
  // the dot stays hidden (no fake alert).
  const [hasUnread, setHasUnread] = React.useState(false);
  React.useEffect(() => {
    if (!(window.bosCloud && window.bosCloud.enabled())) { setHasUnread(false); return; }
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
  }, [teams]);
  const showBellDot = hasUnread;

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
          <span style={{ position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: "50%", background: "var(--accent-red)", border: "2px solid " + (isDark ? "#0a0a0a" : "#fff") }} />
          )}
        </button>
      </div>

      <div data-tour="aihints" style={{ position: "relative" }}>
        <HomeHeroSwipeLive navigate={navigate} doneCount={doneCount} totalCount={totalCount} ringPct={ringPct} isDark={isDark} />
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

      {/* Gold LEVEL banner right under "С чего начать" — turns the bare stat into a
          hook ("every habit is XP — learn how to grow"). Always shown for live. */}
      {_showLevelBanner && (
        <div style={{ marginTop: 12, borderRadius: 22, overflow: "hidden", boxShadow: "0 10px 26px rgba(239,159,20,0.30)" }}>
          {/* rowBg carries the gradient (not a solid) so the peeling edge has ONE surface —
              a solid backing under the gradient showed a thin lighter seam at the rounded clip. */}
          <SwipeRow rowBg="linear-gradient(135deg,#FEDE34,#EF9F14)" dark={isDark} actions={[
            { key: "hide", tone: "delete", label: "Убрать", icon: I.Trash, onAction: () => app.setWidgets({ ...widgets, level: false }) },
          ]}>
        <button onClick={() => navigate("levels")} className="tap" style={{
          width: "100%", border: 0, padding: "15px 17px",
          background: "transparent", color: "#0a0a0a",
          display: "flex", alignItems: "center", gap: 13, textAlign: "left",
        }}>
          <span style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(255,255,255,0.5)", display: "grid", placeItems: "center", flexShrink: 0, fontSize: 22 }}>🏆</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 15.5, fontWeight: 700, letterSpacing: "-0.2px" }}>Уровень {_lvl.level}</span>
              <span style={{ fontSize: 11.5, fontWeight: 700, opacity: 0.55 }}>{_liveXP} XP</span>
            </div>
            <div style={{ fontSize: 12.5, color: "rgba(0,0,0,0.62)", marginTop: 2, lineHeight: 1.35 }}>Каждая привычка — это опыт. Узнай, как расти →</div>
            <span style={{ display: "block", height: 5, borderRadius: 999, background: "rgba(0,0,0,0.14)", overflow: "hidden", marginTop: 8 }}>
              <span style={{ display: "block", height: "100%", width: _lvl.pct + "%", borderRadius: 999, background: "rgba(0,0,0,0.82)" }}/>
            </span>
          </div>
          <I.ChevronRight size={20} color="rgba(0,0,0,0.45)" />
        </button>
          </SwipeRow>
        </div>
      )}

      {/* Calendar + Community */}
      {(widgets.calendar !== false || widgets.team !== false) && (
      <div style={{ display: "grid", gridTemplateColumns: widgets.calendar !== false && widgets.team !== false ? "1fr 1fr" : "1fr", gap: 8, marginTop: 8 }}>
        {widgets.calendar !== false && (
        <button className="tap" onClick={() => navigate("history")}
          style={{ background: cardBg, border: cardBorder, borderRadius: 22, padding: "14px 14px 12px", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: cardShadow, color: "var(--text)" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Календарь</div>
            <div style={{ fontSize: 14, color: "var(--text-2)", marginTop: 4, fontWeight: 500 }}>{_calLabel}</div>
          </div>
          <I.Calendar size={28} color={isDark ? "rgba(255,255,255,0.7)" : "#787878"} strokeWidth={1.5} />
        </button>
        )}
        {widgets.team !== false && (
        <button className="tap" onClick={() => navigate("community")}
          style={{ background: cardBg, border: cardBorder, borderRadius: 22, padding: "14px 14px 12px", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: cardShadow, color: "var(--text)" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Команды</div>
            <div style={{ fontSize: 14, color: "var(--text-2)", marginTop: 4, fontWeight: 500 }}>{teams.length ? teams.length + " " + ruTeam(teams.length) : "Создай команду"}</div>
          </div>
          {teams.length > 0 ? (
          <div style={{ display: "flex" }}>
            {teams.slice(0, 4).map((t, i) => (
              <span key={t._id || i} title={t.name} style={{ width: 28, height: 28, borderRadius: "50%", background: t.accent || "var(--surface-3)", border: "2px solid " + (isDark ? "#0a0a0a" : "#fff"), marginLeft: i ? -10 : 0, display: "grid", placeItems: "center", fontSize: 14, lineHeight: 1 }}>{bosIcon(t.emblem || "👥", 14, t.accent)}</span>
            ))}
          </div>
          ) : (
          <span style={{ width: 30, height: 30, borderRadius: "50%", background: isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)", display: "grid", placeItems: "center", color: "var(--text-3)" }}><I.Plus size={16}/></span>
          )}
        </button>
        )}
      </div>
      )}

      {/* State slot — ABOVE habits (David's call). Honors the `mood` widget toggle and is
         swipe-to-dismiss (re-add in «Виджеты главного»). Not logged today → the once-a-day
         check-in prompt; logged + ≥2 days of marks → the streak widget. */}
      {widgets.mood !== false && (() => {
        const _tk = (typeof bosTodayKey === "function") ? bosTodayKey() : "";
        const _loggedToday = !!(app?.dayMoods && app.dayMoods[_tk] != null);
        const _hideAction = [{ key: "hide", tone: "delete", label: "Убрать", icon: I.Trash, onAction: () => app.setWidgets({ ...widgets, mood: false }) }];
        if (!_loggedToday) {
          return (
            <div style={{ marginTop: 16, borderRadius: 22, overflow: "hidden", boxShadow: cardShadow }}>
              <SwipeRow rowBg={rowBg} dark={isDark} actions={_hideAction}><StatePromptLive app={app} isDark={isDark} /></SwipeRow>
            </div>
          );
        }
        if (mood && typeof bosMoodDays === "function" && bosMoodDays(app?.dayMoods) >= 2) {
          return (
            <div style={{ marginTop: 16, borderRadius: 22, overflow: "hidden", boxShadow: cardShadow }}>
              <SwipeRow rowBg={rowBg} dark={isDark} actions={_hideAction}><MoodWidgetLive mood={mood} app={app} isDark={isDark} navigate={navigate} flush={true} /></SwipeRow>
            </div>
          );
        }
        return null;
      })()}

      {/* Habits — a labelled section, always shown (the LIVE home drops the
         segmented Привычки/Цели switcher and stacks both sections with labels). */}
      <div className="section-label" style={{ marginTop: 16, color: "var(--text-3)", padding: "0 4px" }}>Привычки</div>
      {habits.length === 0 ? (
          <button className="tap" onClick={() => navigate("habit-settings", { mode: "create" })} style={{ marginTop: 10, width: "100%", background: cardBg, border: cardBorder, borderRadius: 22, padding: "30px 20px", boxShadow: cardShadow, color: "var(--text)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10 }}>
            <span style={{ width: 52, height: 52, borderRadius: 16, background: iconBg, display: "grid", placeItems: "center", fontSize: 26 }}>🌱</span>
            <div style={{ fontSize: 16, fontWeight: 600 }}>Здесь будут твои привычки</div>
            <div style={{ fontSize: 13, color: "var(--text-4)", lineHeight: 1.45, maxWidth: 235 }}>Начни с одной маленькой — например, стакан воды утром.</div>
            <span style={{ marginTop: 4, display: "inline-flex", alignItems: "center", gap: 6, background: isDark ? "#fff" : "#0a0a0a", color: isDark ? "#0a0a0a" : "#fff", borderRadius: 999, padding: "9px 16px", fontSize: 14, fontWeight: 600 }}><I.Plus size={15} strokeWidth={2.5}/> Создать привычку</span>
          </button>
      ) : (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8, color: "var(--text)" }}>
          {habits.map((h) => (
            <div key={h.id} style={{ borderRadius: 22, overflow: "hidden", boxShadow: cardShadow }}>
              <SwipeRow rowBg={rowBg} dark={isDark} actions={[
                { key: "share", tone: "share", label: "Поделиться", icon: I.Share, onAction: () => openSheet(<ShareHabitSheetLive habit={h} dark={isDark} />) },
                { key: "del", tone: "delete", label: "Удалить", icon: I.Trash, onAction: () => remove(h.id) },
              ]}>
                <div className="tap" onClick={() => navigate("habit-detail", { habit: h, from: "home" })} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px" }}>
                  <span style={{ width: 40, height: 40, borderRadius: 14, background: h.color ? h.color + "26" : iconBg, display: "grid", placeItems: "center", fontSize: 20, flexShrink: 0 }}>{bosIcon(h.emoji, 22, h.color)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.2px" }}>{h.name}</div>
                    {(h.shareCode || h.duration > 0) && (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 3, flexWrap: "wrap", fontSize: 11, color: "var(--text-4)" }}>
                        {h.duration > 0 && <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><I.Clock size={11}/> {h.duration} мин</span>}
                        <HabitBuddyAvatarsLive habit={h} size={16} max={3} />
                      </div>
                    )}
                  </div>
                  {h.duration > 0 && !h.done && !(h.goalPerDay > 1) && (
                    <HabitRing habit={h} dark={isDark} onComplete={() => { if (!h.done) toggle(h.id); }} />
                  )}
                  {h.goalPerDay > 1
                    ? <HabitCountCheck habit={h} app={app} xp={XP_PER_HABIT} />
                    : <HabitCheck done={h.done} onToggle={() => toggle(h.id)} xp={XP_PER_HABIT} float />}
                </div>
              </SwipeRow>
            </div>
          ))}
        </div>
      )}

      {/* Goals — a labelled section, always shown. */}
      <div className="section-label" style={{ marginTop: 16, color: "var(--text-3)", padding: "0 4px" }}>Цели</div>
      {goals.length === 0 ? (
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
            <div key={g.id} style={{ borderRadius: 22, overflow: "hidden", boxShadow: cardShadow }}>
              <SwipeRow rowBg={rowBg} dark={isDark} actions={[
                { key: "share", tone: "share", label: "Поделиться", icon: I.Share, onAction: () => openSheet(<ShareGoalSheetLive goal={g} dark={isDark} />) },
                { key: "del", tone: "delete", label: "Удалить", icon: I.Trash, onAction: () => removeGoal(g.id) },
              ]}>
                <div className="tap" onClick={() => navigate("goal-detail", { goal: g, from: "home" })} style={{ background: cardBg, border: cardBorder, padding: 14, color: "var(--text)", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <span style={{ width: 38, height: 38, borderRadius: 14, background: g.color ? g.color + "26" : iconBg, display: "grid", placeItems: "center", fontSize: 18 }}>{bosIcon(g.emoji, 20, g.color)}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15.5, color: "var(--text)", fontWeight: 600 }}>{g.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-4)" }}>{g.current} / {g.target} {g.unit}</div>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-2)" }}>{Math.round(pct*100)}%</span>
                  </div>
                  <div className="bos-progress"><span style={{ width: (pct*100) + "%", background: "linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0) 72%), " + (g.color || "#0a0a0a") }} /></div>
                </div>
              </SwipeRow>
            </div>
            );
          })}
        </div>
      )}

      {/* Invite / share the app — a focused dark CTA (stands apart from the white
         habit cards above) that ties sharing to the reward loop: friend → XP → level. */}
      {widgets.invite !== false && (
      <div style={{ marginTop: 12, borderRadius: 22, overflow: "hidden", boxShadow: "0 10px 26px rgba(20,40,80,0.28)" }}>
        <SwipeRow rowBg="linear-gradient(135deg, #34508c 0%, #1d2c4d 100%)" dark={isDark} actions={[
          { key: "hide", tone: "delete", label: "Убрать", icon: I.Trash, onAction: () => app.setWidgets({ ...widgets, invite: false }) },
        ]}>
      {/* No overflow:hidden here: the SwipeRow row + outer wrapper already clip to the rounded
          shape. A second clip layer on this button left a thin seam at the peeling rounded edge
          (the radial sheen below is bounded by inset:0, so it needs no clip of its own). */}
      <button data-tour="share-app" className="tap" onClick={() => openSheet(<ShareAppSheetLive dark={isDark} />)}
        style={{ width: "100%", padding: "16px 18px", border: 0, position: "relative",
          background: "transparent",
          color: "#fff", display: "flex", alignItems: "center", gap: 14, textAlign: "left" }}>
        <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 86% 10%, rgba(255,255,255,0.16) 0%, transparent 52%)", pointerEvents: "none" }} />
        <span style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(255,255,255,0.14)", display: "grid", placeItems: "center", flexShrink: 0, color: "#fff", position: "relative" }}>
          <I.Share size={20} />
        </span>
        <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ fontSize: 15.5, fontWeight: 700, color: "#fff", letterSpacing: "-0.2px" }}>Позови своих</div>
            <span style={{ display: "inline-flex", alignItems: "center", fontSize: 10.5, fontWeight: 800, color: "#0a0a0a", background: "linear-gradient(135deg, #FEDE34, #EF9F14)", padding: "2px 8px", borderRadius: 999, flexShrink: 0 }}>+150 XP</span>
          </div>
          <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.85)", marginTop: 3, lineHeight: 1.35, fontWeight: 500 }}>{_inviteFomo}</div>
        </div>
        {/* A LIVE user has no sample people yet, so we show a neutral "add people"
            glyph — never fake names. */}
        <div style={{ display: "flex", flexShrink: 0, position: "relative" }}>
          <span style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.16)", border: "2px solid rgba(255,255,255,0.3)", display: "grid", placeItems: "center", color: "#fff" }}><I.Plus size={16} strokeWidth={2.5} /></span>
        </div>
      </button>
        </SwipeRow>
      </div>
      )}
    </div>
  );
}

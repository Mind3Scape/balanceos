/* HOME — LIVE-only fork of HomeScreen (real Telegram user, app.mode === "live"
   is ALWAYS true here). The demo/fresh branches are stripped: no segmented
   Привычки/Цели toggle, no demo balance-wheel / demo stat strip / demo MoodWidget,
   no fresh «Что дальше?» banner. Everything else reuses the shared core/ toolkit
   (HeroOrbFace, HabitCheck, HabitRing, AvatarStack, bosPill* helpers) + the live
   forks in screens/live/shared_live.jsx (HomeHeroSwipeLive, MoodWidgetLive,
   ShareAppSheetLive, ShareHabitSheetLive) + framework (SwipeRow, BosOrbFace, I,
   hooks, the bos* helpers).

   The home is a CUSTOMIZABLE WIDGET BOARD: every block under the greeting is a widget
   rendered through BosReorderList — long-press → jiggle → drag to reorder (order saved
   in widgets.order, which already syncs to the cloud), a glass «−» badge removes a widget,
   and a «+» tile opens the «available widgets» sheet to add one back. Visibility is a single
   per-id flag (widgets[id] !== false); removing just flips it to false and the widget
   reappears in the «+» sheet — nothing is ever deleted. The ONLY new top-level declaration
   in this file is `function HomeLive`. */
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
  // Универсальная кнопка «+» в шапке главной (David: «нужна явная кнопка создать привычку») —
  // открывает то же меню Привычку/Цель/Команду, что и «+» на странице Привычки. Плюс простой
  // СТАРТ для нового юзера ниже (0 привычек/целей/команд → один понятный шаг).
  const [createOpen, setCreateOpen] = React.useState(false);
  const addBtnRef = React.useRef(null);
  const trulyNew = habits.length === 0 && goals.length === 0 && teams.length === 0;
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
  const dayStreak = bosMaxStreak(habits);
  // Витрина для «Вселенной»: при каждом заходе на Главную (открывается каждую сессию) пишем свой
  // ПУБЛИЧНЫЙ уровень + ЗНАЧКИ привычек (эмодзи+цвет, БЕЗ названий) → у друзей в их Вселенной
  // светятся твои РЕАЛЬНЫЕ планеты. `people` НЕ шлём — его знает экран «Я» (invitedPeople), а
  // cloud.js мержит с последней витриной, так что оно не затрётся. habits обязан быть МАССИВОМ
  // объектов {e,c}: число (как было) склад молча превращал в пустую орбиту и стирал витрину «Я».
  React.useEffect(() => {
    if (!(window.bosCloud && window.bosCloud.enabled() && window.bosCloud.savePublicStats)) return;
    const t = setTimeout(() => {
      try { window.bosCloud.savePublicStats({ level: _lvl.level, lvlPct: _lvl.pct, habits: (app?.habits || []).map((h) => ({ e: h.emoji, c: h.color })), goals: (app?.goals || []).length }); } catch (e) {}
    }, 1200);
    return () => clearTimeout(t);
  }, [_lvl.level, (app?.habits || []).length, (app?.goals || []).length]);
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

  // ── Widget board plumbing ────────────────────────────────────────────────────
  const DEFAULT_ORDER = BOS_HOME_WIDGETS.map((w) => w.id);
  // «invite» (Позови своих) is OFF by default on the home board (David: «убираем с главной / скрой
  // по дефолту») — the invite path lives in «Найти». Still re-addable via the widget sheet (opt-in:
  // needs widgets.invite === true). Every other widget: on unless explicitly hidden.
  const isWidgetOn = (id) => (id === "invite") ? (widgets.invite === true) : (widgets[id] !== false);
  const hideWidget = (id) => app.setWidgets({ ...widgets, [id]: false });

  // Each widget's content. Returns null when a widget is ON but has nothing to show
  // right now (e.g. mood logged today with <2 days of history) — it then drops off the
  // board but stays «on» (not offered in the add sheet). No per-widget marginTop: the
  // board's gap owns the spacing.
  const nodeOf = (id) => {
    if (id === "hero") {
      return (
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
      );
    }

    if (id === "level") {
      // Gold LEVEL banner — turns the bare stat into a hook ("every habit is XP — learn how to grow").
      return (
        <div style={{ borderRadius: 22, overflow: "hidden", transform: "translateZ(0)", boxShadow: "0 10px 26px rgba(239,159,20,0.30)" }}>
          {/* rowBg carries the gradient (not a solid) so the peeling edge has ONE surface. */}
          <SwipeRow rowBg="linear-gradient(135deg,#FEDE34,#EF9F14)" dark={isDark} actions={[
            { key: "hide", tone: "delete", label: "Убрать", icon: I.X, onAction: () => hideWidget("level") },
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
      );
    }

    if (id === "week") {
      // «Эта неделя» replaces the old date card (the date already shows in the greeting). A 7-day
      // activity strip; tap → history. Title lives INSIDE the card («всё внутри блоков»).
      const _wk = (typeof bosWeekKeys === "function") ? bosWeekKeys() : [];
      const _active = habits.length ? _wk.filter((k) => habits.some((h) => h.log && h.log[k])).length : 0;
      return (
        <button className="tap" onClick={() => navigate("history")}
          style={{ width: "100%", background: cardBg, border: cardBorder, borderRadius: 22, padding: "14px 15px", textAlign: "left", boxShadow: cardShadow, color: "var(--text)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: "-0.2px" }}>Эта неделя</span>
            <span style={{ fontSize: 12, color: "var(--text-4)", fontWeight: 500 }}>{_active} из 7 ›</span>
          </div>
          <HomeWeekStripLive habits={habits} isDark={isDark} />
        </button>
      );
    }

    if (id === "team") {
      // «Команды» — its own full-width widget (David picked variant A: teams separate). Glass tile
      // + standard grey glass discs for emblems; tap → community.
      return (
        <button className="tap" onClick={() => navigate("community")}
          style={{ width: "100%", background: cardBg, border: cardBorder, borderRadius: 22, padding: "14px 15px", textAlign: "left", display: "flex", alignItems: "center", gap: 12, boxShadow: cardShadow, color: "var(--text)" }}>
          <span style={{ width: 40, height: 40, borderRadius: 13, background: BOS_TILE_SHEEN + ", " + iconBg, boxShadow: bosTileGlass(isDark), display: "grid", placeItems: "center", fontSize: 20, flexShrink: 0 }}>👥</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.2px" }}>Команды</div>
            <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 1 }}>{teams.length ? teams.length + " " + ruTeam(teams.length) + " · ведёте вместе" : "Создай свою первую"}</div>
          </div>
          {teams.length > 0 ? (
            <div style={{ display: "flex", flexShrink: 0 }}>
              {teams.slice(0, 4).map((t, i) => (
                <span key={t._id || i} title={t.name} style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(150deg, var(--disc-a, #eef1f6), var(--disc-b, #dadfe7))", boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.08), 0 0 0 2px " + (isDark ? "#0a0a0a" : "#fff"), marginLeft: i ? -9 : 0, display: "grid", placeItems: "center", fontSize: 15, lineHeight: 1 }}>{bosIcon(t.emblem || "👥", 15, t.accent)}</span>
              ))}
            </div>
          ) : (
            <span style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--cta, #0a0a0a)", color: "var(--cta-ink, #fff)", display: "grid", placeItems: "center", flexShrink: 0 }}><I.Plus size={16}/></span>
          )}
        </button>
      );
    }

    if (id === "mood") {
      // State check-in (not logged today) → the once-a-day slider; logged + ≥2 days → streak widget.
      const _tk = (typeof bosTodayKey === "function") ? bosTodayKey() : "";
      const _loggedToday = !!(app?.dayMoods && app.dayMoods[_tk] != null);
      const _hideAction = [{ key: "hide", tone: "delete", label: "Убрать", icon: I.X, onAction: () => hideWidget("mood") }];
      if (!_loggedToday) {
        return (
          <div style={{ borderRadius: 22, overflow: "hidden", boxShadow: cardShadow, transform: "translateZ(0)" }}>
            <SwipeRow rowBg={rowBg} dark={isDark} actions={_hideAction}><StateSliderLive app={app} isDark={isDark} /></SwipeRow>
          </div>
        );
      }
      if (mood && typeof bosMoodDays === "function" && bosMoodDays(app?.dayMoods) >= 2) {
        return (
          <div style={{ borderRadius: 22, overflow: "hidden", boxShadow: cardShadow, transform: "translateZ(0)" }}>
            <SwipeRow rowBg={rowBg} dark={isDark} actions={_hideAction}><MoodWidgetLive mood={mood} app={app} isDark={isDark} navigate={navigate} flush={true} /></SwipeRow>
          </div>
        );
      }
      return null;
    }

    if (id === "habits") {
      // «Всё внутри блоков» (David): the «Привычки» title lives INSIDE one grouped card, with the
      // habit rows stacked below it (hairline dividers, per-row swipe kept). HOME ONLY — the
      // Habits tab keeps its fuller separate-card view untouched.
      return (
        <div style={{ background: cardBg, border: cardBorder, borderRadius: 22, boxShadow: cardShadow, overflow: "hidden", color: "var(--text)", transform: "translateZ(0)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 15px 11px" }}>
            <span style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: "-0.2px" }}>Привычки</span>
            {habits.length > 0 && <span style={{ fontSize: 12, color: "var(--text-4)", fontWeight: 500 }}>{doneCount} из {totalCount}</span>}
          </div>
          {habits.length === 0 ? (
            <button className="tap" onClick={() => openSheet(<HabitFormSheetLive mode="create" navigate={navigate} />)} style={{ width: "100%", background: "transparent", border: 0, padding: "6px 20px 26px", color: "var(--text)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10 }}>
              <span style={{ width: 52, height: 52, borderRadius: 16, background: iconBg, display: "grid", placeItems: "center", fontSize: 26 }}>🌱</span>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Здесь будут твои привычки</div>
              <div style={{ fontSize: 12.5, color: "var(--text-4)", lineHeight: 1.45, maxWidth: 235 }}>Начни с одной маленькой — например, стакан воды утром.</div>
              <span style={{ marginTop: 4, display: "inline-flex", alignItems: "center", gap: 6, background: isDark ? "#fff" : "#0a0a0a", color: isDark ? "#0a0a0a" : "#fff", borderRadius: 999, padding: "9px 16px", fontSize: 14, fontWeight: 600 }}><I.Plus size={15} strokeWidth={2.5}/> Создать привычку</span>
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {habits.map((h, hi) => (
                <div key={h.id} style={{ borderTop: hi ? "1px solid " + dividerLn : "0" }}>
                  <SwipeRow rowBg={rowBg} dark={isDark} actions={[
                    { key: "share", tone: "share", label: "Поделиться", icon: I.Share, onAction: () => openSheet(<ShareHabitSheetLive habit={h} dark={isDark} />) },
                    { key: "del", tone: "delete", label: "Удалить", icon: I.X, onAction: () => bosConfirmDelete(openSheet, { title: "Удалить привычку?", message: "«" + h.name + "» и вся история отметок удалятся навсегда.", confirmLabel: "Удалить", onConfirm: () => remove(h.id) }) },
                  ]}>
                    <div className="tap" onClick={() => navigate("habit-detail", { habit: h, from: "home" })} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 15px" }}>
                      <span style={{ width: 38, height: 38, borderRadius: 13, background: BOS_TILE_SHEEN + ", " + (h.color ? h.color + "26" : iconBg), boxShadow: bosTileGlass(isDark), display: "grid", placeItems: "center", fontSize: 19, flexShrink: 0 }}>{bosIcon(h.emoji, 21, h.color)}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15.5, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.2px" }}>{h.name}</div>
                        {(h.shareCode || h.duration > 0) && (
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 3, flexWrap: "wrap", fontSize: 11, color: "var(--text-4)" }}>
                            {h.duration > 0 && <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><I.Clock size={11}/> {h.duration} мин</span>}
                            <HabitBuddyAvatarsLive habit={h} size={16} max={5} />
                            {typeof CircleFacesLive === "function" && <CircleFacesLive habit={h} size={16} max={5} />}
                          </div>
                        )}
                      </div>
                      {/* ОДИН контрол: таймер (▶ + секции) ИЛИ счётчик (кольцо) ИЛИ галочка — не два рядом. */}
                      {h.duration > 0 && !(h.goalPerDay > 1)
                        ? <HabitTimerCheck habit={h} app={app} xp={XP_PER_HABIT} />
                        : h.goalPerDay > 1
                          ? <HabitCountCheck habit={h} app={app} xp={XP_PER_HABIT} />
                          : <HabitCheck done={h.done} onToggle={() => toggle(h.id)} xp={XP_PER_HABIT} float color={h.color} dark={isDark} />}
                    </div>
                  </SwipeRow>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (id === "goals") {
      // Grouped «Цели» card — title INSIDE, goal rows below (hairline dividers). HOME ONLY.
      return (
        <div style={{ background: cardBg, border: cardBorder, borderRadius: 22, boxShadow: cardShadow, overflow: "hidden", color: "var(--text)", transform: "translateZ(0)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 15px 11px" }}>
            <span style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: "-0.2px" }}>Цели</span>
            {goals.length > 0 && <span style={{ fontSize: 12, color: "var(--text-4)", fontWeight: 500 }}>{goals.length}</span>}
          </div>
          {goals.length === 0 ? (
            <button className="tap" onClick={() => openSheet(<GoalFormSheetLive mode="create" navigate={navigate} />)} style={{ width: "100%", background: "transparent", border: 0, padding: "6px 20px 26px", color: "var(--text)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10 }}>
              <span style={{ width: 52, height: 52, borderRadius: 16, background: iconBg, display: "grid", placeItems: "center", fontSize: 26 }}>🎯</span>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Пока нет целей</div>
              <div style={{ fontSize: 12.5, color: "var(--text-4)", lineHeight: 1.45, maxWidth: 235 }}>Большая цель — это маленькие привычки, сложенные вместе.</div>
              <span style={{ marginTop: 4, display: "inline-flex", alignItems: "center", gap: 6, background: isDark ? "#fff" : "#0a0a0a", color: isDark ? "#0a0a0a" : "#fff", borderRadius: 999, padding: "9px 16px", fontSize: 14, fontWeight: 600 }}><I.Plus size={15} strokeWidth={2.5}/> Поставить цель</span>
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {goals.map((g, gi) => {
                const pct = g.target ? ((g.current || 0) / g.target) : 0; // ||0 — цель без current не должна давать NaN%
                return (
                  <div key={g.id} style={{ borderTop: gi ? "1px solid " + dividerLn : "0" }}>
                    <SwipeRow rowBg={rowBg} dark={isDark} actions={[
                      { key: "share", tone: "share", label: "Поделиться", icon: I.Share, onAction: () => openSheet(<ShareGoalSheetLive goal={g} dark={isDark} />) },
                      { key: "del", tone: "delete", label: "Удалить", icon: I.X, onAction: () => bosConfirmDelete(openSheet, { title: "Удалить цель?", message: "«" + g.name + "» удалится навсегда.", confirmLabel: "Удалить", onConfirm: () => removeGoal(g.id) }) },
                    ]}>
                      <div className="tap" onClick={() => navigate("goal-detail", { goal: g, from: "home" })} style={{ padding: "13px 15px", color: "var(--text)", cursor: "pointer" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                          <span style={{ width: 36, height: 36, borderRadius: 13, background: BOS_TILE_SHEEN + ", " + (g.color ? g.color + "26" : iconBg), boxShadow: bosTileGlass(isDark), display: "grid", placeItems: "center", fontSize: 18 }}>{bosIcon(g.emoji, 20, g.color)}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 15.5, color: "var(--text)", fontWeight: 600 }}>{g.name}</div>
                            <div style={{ fontSize: 11, color: "var(--text-4)" }}>{g.current || 0} / {g.target} {g.unit}</div>
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-2)" }}>{Math.round(pct*100)}%</span>
                        </div>
                        <div className="bos-progress"><span style={{ width: (pct*100) + "%", background: "linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0) 72%), " + (g.color || "#0a0a0a") }} /></div>
                        {/* Личная цель лиц НЕ носит — круг = команда (показывается как LiveTeamCard с лицами). */}
                      </div>
                    </SwipeRow>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    if (id === "invite") {
      // Invite / share — GOLD banner (David: «как баннер уровня»): same reward-gold language as the
      // level banner, dark ink on gold. The «+150 XP» badge flips to a dark pill for contrast on gold.
      return (
        <div style={{ borderRadius: 22, overflow: "hidden", transform: "translateZ(0)", boxShadow: "0 10px 26px rgba(239,159,20,0.30)" }}>
          <SwipeRow rowBg="linear-gradient(135deg,#FEDE34,#EF9F14)" dark={isDark} actions={[
            { key: "hide", tone: "delete", label: "Убрать", icon: I.X, onAction: () => hideWidget("invite") },
          ]}>
            <button data-tour="share-app" className="tap" onClick={() => openSheet(<ShareAppSheetLive dark={isDark} />)}
              style={{ width: "100%", padding: "15px 17px", border: 0, position: "relative",
                background: "transparent",
                color: "#0a0a0a", display: "flex", alignItems: "center", gap: 13, textAlign: "left" }}>
              <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 86% 8%, rgba(255,255,255,0.4) 0%, transparent 55%)", pointerEvents: "none" }} />
              <span style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(255,255,255,0.5)", display: "grid", placeItems: "center", flexShrink: 0, color: "#0a0a0a", position: "relative" }}>
                <I.Share size={20} />
              </span>
              <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ fontSize: 15.5, fontWeight: 700, color: "#0a0a0a", letterSpacing: "-0.2px" }}>Позови своих</div>
                  <span style={{ display: "inline-flex", alignItems: "center", fontSize: 10.5, fontWeight: 800, color: "#FEDE34", background: "#0a0a0a", padding: "2px 8px", borderRadius: 999, flexShrink: 0 }}>+150 XP</span>
                </div>
                <div style={{ fontSize: 12.5, color: "rgba(0,0,0,0.62)", marginTop: 3, lineHeight: 1.35, fontWeight: 500 }}>{_inviteFomo}</div>
              </div>
              <div style={{ display: "flex", flexShrink: 0, position: "relative" }}>
                <span style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.55)", border: "2px solid rgba(255,255,255,0.6)", display: "grid", placeItems: "center", color: "#0a0a0a" }}><I.Plus size={16} strokeWidth={2.5} /></span>
              </div>
            </button>
          </SwipeRow>
        </div>
      );
    }

    return null;
  };

  // Saved order (only known ids), with any new/missing widget ids appended so they still appear.
  const savedOrder = (Array.isArray(widgets.order) ? widgets.order : []).filter((id) => DEFAULT_ORDER.includes(id));
  const fullOrder = [...savedOrder, ...DEFAULT_ORDER.filter((id) => !savedOrder.includes(id))];
  const nodes = {};
  // Предохранитель: упавший виджет просто не показывается — остальная главная живёт.
  fullOrder.forEach((id) => { if (isWidgetOn(id)) { try { const n = nodeOf(id); if (n != null) nodes[id] = n; } catch (e) {} } });
  const visibleIds = fullOrder.filter((id) => nodes[id] != null);

  // Reorder commits the new VISIBLE order back into the full order, keeping any hidden ids in
  // place — so a removed-then-re-added widget returns to roughly where it was.
  const onReorderWidgets = (newVisible) => {
    let vi = 0;
    const merged = fullOrder.map((id) => (visibleIds.indexOf(id) >= 0 ? newVisible[vi++] : id));
    app.setWidgets({ ...widgets, order: merged });
  };
  const openAddSheet = () => openSheet(<AddWidgetSheetLive defs={BOS_HOME_WIDGETS} dark={isDark} />);

  return (
    <div ref={wrapRef} className="page-in" style={{ padding: "0 12px 24px" }}>
      {/* Top bar — greeting + bell (PINNED, never a widget) */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 4px 12px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: "var(--text-4)", letterSpacing: 0.4 }}>{_todayLabel}</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.6px", marginTop: 2, fontFamily: "var(--bos-title-font)" }}>{userName ? greeting + ", " + userName : greeting + " 👋"}</div>
        </div>
        {/* «+» — явная кнопка СОЗДАТЬ (привычку/цель/круг), всегда под рукой на главной (David). Тот
            же CreateMenuLive, что на странице Привычки; стеклянный круг, «+» крутится при открытии. */}
        <button ref={addBtnRef} onClick={() => { setCreateOpen(true); if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} } }} className="tap hit44" aria-label="Создать" aria-haspopup="menu" aria-expanded={createOpen} title="Создать"
          style={{ width: 40, height: 40, borderRadius: 999, ...(typeof bosChipGlass === "function" ? bosChipGlass(isDark) : { background: "var(--surface-3)" }), color: isDark ? "#fff" : "var(--text)", border: 0, display: "grid", placeItems: "center", flexShrink: 0, cursor: "pointer" }}>
          <I.Plus size={20} strokeWidth={2.4} style={{ transition: "transform 0.34s cubic-bezier(0.34,1.5,0.4,1)", transform: createOpen ? "rotate(45deg)" : "none" }} />
        </button>
        {/* Notifications — СТЕКЛЯННЫЙ КРУГ, симметрично «+» слева (David: «колокольчик тоже
            в кружочек»). Красная точка едет на верхнем правом крае колокольчика. */}
        <button onClick={() => navigate("notifications", { from: "home" })} className="tap hit44" aria-label="Уведомления"
          style={{ width: 40, height: 40, borderRadius: 999, ...(typeof bosChipGlass === "function" ? bosChipGlass(isDark) : { background: "var(--surface-3)" }), border: 0, padding: 0, display: "grid", placeItems: "center", flexShrink: 0, cursor: "pointer" }}>
          <span style={{ position: "relative", display: "grid", placeItems: "center" }}>
            <I.Bell size={20} strokeWidth={2} color={bellIcon}/>
            {showBellDot && (
            <span style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: "50%", background: "var(--accent-red)", border: "2px solid " + (isDark ? "#0a0a0a" : "#fff") }} />
            )}
          </span>
        </button>
      </div>

      <CreateMenuLive open={createOpen} onClose={() => setCreateOpen(false)} anchorRef={addBtnRef} navigate={navigate} />

      {/* Новому юзеру (0 привычек/целей/команд) — ПРОСТОЙ старт = ОДИН hero-блок: ИИ-сводка + пилюли
          (там уже есть «➕ Создать привычку» + мягкий ИИ-старт «Рассказать о себе»). Прежнюю большую
          карточку «Создай первую привычку» убрал — она дублировала пилюлю и занимала пол-экрана
          (David: «нету смысла показывать на пол-экрана, в пилюлях уже есть»). Доска — с первой привычкой. */}
      {trulyNew ? (
        nodes["hero"] || null
      ) : visibleIds.length > 0 ? (
        <BosReorderList
          ids={visibleIds}
          gap={12}
          onReorder={onReorderWidgets}
          onAdd={openAddSheet}
          addLabel="Добавить виджет"
          renderItem={(id, { mode }) => (
            <div style={{ position: "relative" }}>
              <div style={{ pointerEvents: mode ? "none" : "auto" }}>{nodes[id]}</div>
              {mode && <WidgetMinusLive onRemove={() => hideWidget(id)} />}
            </div>
          )}
        />
      ) : (
        <button onClick={openAddSheet} className="tap" style={{
          marginTop: 40, width: "100%", borderRadius: 22, padding: "28px 16px",
          border: "1.5px dashed var(--line)", background: "transparent", color: "var(--text-3)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 600, cursor: "pointer",
        }}>
          <span style={{ width: 46, height: 46, borderRadius: "50%", display: "grid", placeItems: "center",
            background: BOS_TILE_SHEEN + ", var(--surface-3)", boxShadow: bosTileGlass(isDark), color: "var(--text)" }}><I.Plus size={20} strokeWidth={2.5} /></span>
          Добавить виджеты на главную
        </button>
      )}
    </div>
  );
}

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
/* Один упавший виджет НЕ роняет всю главную (день наплыва): тихо схлопывается. */
class WidgetBoundaryLive extends React.Component {
  constructor(p) { super(p); this.state = { dead: false }; }
  static getDerivedStateFromError() { return { dead: true }; }
  componentDidCatch(e) { try { console.error("widget crash:", this.props.wid, e); } catch (e2) {} }
  render() { return this.state.dead ? null : this.props.children; }
}

function HomeLive() {
  const { navigate } = useNav();
  const { open: openSheet } = useSheet();
  const app = useApp();
  const widgets = app?.widgets || {};
  const mood = app?.mood;
  const wrapRef = React.useRef(null);
  const isDark = useThemeFlag(wrapRef);
  // Habits + goals come from the shared app store, so a check here shows up
  // on the Habits tab too (and vice versa). Скрытые с личных страниц копии привычек круга
  // (shelved, Г) и «только внутри цели» (goalOnly) на доску и в счёт дня не попадают.
  const habits = (app?.habits || []).filter((h) => !h.shelved && !h.goalOnly);
  const goals = app?.goals || [];
  // David: «унифицировать» — виджеты привычек/целей на главной = ТЕ ЖЕ плитки, что на «Привычках», и
  // слушают ТОТ ЖЕ стиль (форма/тоглы из шестерёнки). Хуки → главная перерисовывается при смене стиля.
  const cardStyle = useBosCardStyle();
  const goalStyle = useBosGoalStyle();
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
  const ruTeam = (n) => { const m = n % 10, h = n % 100; return (m === 1 && h !== 11) ? "цель" : (m >= 2 && m <= 4 && (h < 10 || h >= 20)) ? "цели" : "целей"; };
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
      try { window.bosCloud.savePublicStats({ level: _lvl.level, lvlPct: _lvl.pct, habits: habits.map((h) => ({ e: h.emoji, c: h.color })), goals: (app?.goals || []).length }); } catch (e) {}
    }, 1200);
    return () => clearTimeout(t);
  }, [_lvl.level, habits.length, (app?.goals || []).length]);
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

  // Bell red dot — REAL events only (секция Б): заявки в мои круги, новые участники,
  // пришедшие по моей ссылке, «тебя приняли», непрочитанные чаты. Один общий сборщик
  // bosNotifHasFreshLive (shared_live, кэш 10 мин); погас/зажёгся — по событию
  // bos:notifSeenChanged из шторки уведомлений. Облако выключено → точки нет.
  const [hasUnread, setHasUnread] = React.useState(false);
  const [notifTick, setNotifTick] = React.useState(0);
  React.useEffect(() => {
    const f = () => setNotifTick((t) => t + 1);
    window.addEventListener("bos:notifSeenChanged", f);
    return () => window.removeEventListener("bos:notifSeenChanged", f);
  }, []);
  React.useEffect(() => {
    if (!(window.bosCloud && window.bosCloud.enabled()) || typeof bosNotifHasFreshLive !== "function") { setHasUnread(false); return; }
    let on = true;
    bosNotifHasFreshLive(app).then((v) => { if (on) setHasUnread(!!v); }).catch(() => { if (on) setHasUnread(false); });
    return () => { on = false; };
  }, [teams, notifTick]);
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

  // ── v528 (секция Д): СВОБОДНАЯ сетка — виджеты и плитки привычек/целей ВПЕРЕМЕШКУ
  // (iOS-паттерн). Раскладка = app.homeLayout { order: ["w:hero","h:<id>","g:<id>",...],
  // hidden: [...] }; видимость решает ПРИСУТСТВИЕ в order (widgets{} больше не источник).
  // Первый вход без раскладки → миграция из старых widgets{} (контейнеры «Привычки»/«Цели»
  // раскрываются в плитки на своих местах).
  const DEFAULT_ORDER = BOS_HOME_WIDGETS.map((w) => w.id);
  const isWidgetOn = (id) => (id === "invite") ? (widgets.invite === true) : (widgets[id] !== false);
  const layoutObj = app?.homeLayout;
  const buildMigratedOrder = () => {
    const out = [];
    const savedW = (Array.isArray(widgets.order) ? widgets.order : []).filter((id) => DEFAULT_ORDER.includes(id) || id === "habits" || id === "goals");
    const wOrder = [...savedW, ...["hero", "week", "habits", "goals", "team", "invite"].filter((id) => !savedW.includes(id))];
    wOrder.forEach((id) => {
      if (id === "habits") { habits.forEach((h) => out.push("h:" + h.id)); return; }
      if (id === "goals") { goals.forEach((g) => out.push("g:" + g.id)); return; }
      if (isWidgetOn(id)) out.push("w:" + id);
    });
    return out;
  };
  const teamKey = (t) => (typeof bosTeamKeyLive === "function") ? bosTeamKeyLive(t) : ("t:" + (t.cloudId || t._id || t.id));
  const effLayout = React.useMemo(() => {
    const base = (layoutObj && Array.isArray(layoutObj.order)) ? layoutObj : { order: buildMigratedOrder(), hidden: [] };
    const hidden = Array.isArray(base.hidden) ? base.hidden : [];
    const seen = {};
    const alive = (k) => {
      if (k.startsWith("h:")) return habits.some((h) => "h:" + h.id === k);
      if (k.startsWith("g:")) return goals.some((g) => "g:" + g.id === k);
      if (k.startsWith("t:")) return teams.some((t) => teamKey(t) === k);
      if (k.startsWith("w:")) return BOS_HOME_WIDGETS.some((w) => "w:" + w.id === k);
      return false;
    };
    const order = base.order.filter((k) => { if (seen[k] || !alive(k)) return false; seen[k] = 1; return true; });
    // Добор НОВЫХ привычек/целей/кругов: сразу на главную — после последней плитки своего вида.
    const insertAfterLast = (pref, key) => { let at = -1; order.forEach((k, i) => { if (k.indexOf(pref) === 0) at = i; }); if (at >= 0) order.splice(at + 1, 0, key); else order.push(key); };
    habits.forEach((h) => { const k = "h:" + h.id; if (!seen[k] && hidden.indexOf(k) < 0) { insertAfterLast("h:", k); seen[k] = 1; } });
    goals.forEach((g) => { const k = "g:" + g.id; if (!seen[k] && hidden.indexOf(k) < 0) { insertAfterLast("g:", k); seen[k] = 1; } });
    // Совместные цели — тоже ПЛИТКАМИ на доске (David: «захочу цель на главной»); прежний
    // авто-виджет «Вместе» больше не добавляем сами — он остался в галерее как сводка по желанию.
    teams.forEach((t) => { const k = teamKey(t); if (!seen[k] && hidden.indexOf(k) < 0) { insertAfterLast("t:", k); seen[k] = 1; } });
    return { order, hidden };
  }, [layoutObj, habits, goals, teams, widgets]);
  const saveLayout = (patch) => { if (app?.setHomeLayout) app.setHomeLayout({ ...effLayout, ...patch }); };
  // Миграция фиксируется ОДИН раз (иначе шторка «+» видела бы пустой layout). Гидрация из
  // облака позже спокойно перекроет это своим сохранённым homeLayout.
  React.useEffect(() => { if (!layoutObj && !trulyNew && app?.setHomeLayout) app.setHomeLayout(effLayout); }, [!!layoutObj, trulyNew]);
  const hideKey = (k) => saveLayout({ order: effLayout.order.filter((x) => x !== k), hidden: effLayout.hidden.indexOf(k) < 0 ? effLayout.hidden.concat([k]) : effLayout.hidden });

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
            { key: "hide", tone: "delete", label: "Убрать", icon: I.X, onAction: () => hideKey("w:level") },
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
            <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.2px" }}>Вместе</div>
            <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 1 }}>{teams.length ? teams.length + " " + ruTeam(teams.length) + " · ведёте вместе" : "Создай первую совместную цель"}</div>
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
      const _hideAction = [{ key: "hide", tone: "delete", label: "Убрать", icon: I.X, onAction: () => hideKey("w:mood") }];
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

    if (id === "invite") {
      // Invite / share — GOLD banner (David: «как баннер уровня»): same reward-gold language as the
      // level banner, dark ink on gold. The «+150 XP» badge flips to a dark pill for contrast on gold.
      return (
        <div style={{ borderRadius: 22, overflow: "hidden", transform: "translateZ(0)", boxShadow: "0 10px 26px rgba(239,159,20,0.30)" }}>
          <SwipeRow rowBg="linear-gradient(135deg,#FEDE34,#EF9F14)" dark={isDark} actions={[
            { key: "hide", tone: "delete", label: "Убрать", icon: I.X, onAction: () => hideKey("w:invite") },
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

  // Виджеты рендерим по layout; упавший/пустой (nodeOf → null, напр. mood без истории) просто
  // не показывается, но МЕСТО в order держит — вернётся сам, когда появится контент.
  const nodes = {};
  effLayout.order.forEach((k) => {
    if (k.indexOf("w:") !== 0) return;
    const id = k.slice(2);
    try { const n = nodeOf(id); if (n != null) nodes[id] = n; } catch (e) {}
  });
  const keyVisible = (k) => (k.indexOf("w:") === 0 ? nodes[k.slice(2)] != null : true);
  const visibleKeys = effLayout.order.filter(keyVisible);
  const onReorderKeys = (newVisible) => {
    let vi = 0;
    const merged = effLayout.order.map((k) => (keyVisible(k) ? newVisible[vi++] : k));
    saveLayout({ order: merged });
  };
  const gridCtl = React.useRef(null);
  const openAddSheet = () => openSheet(<AddWidgetSheetLive defs={BOS_HOME_WIDGETS} dark={isDark} />);
  // Плитка/виджет по ключу. Плитки — ГОЛЫЕ (те же HabitTileLive/GoalTileLive, что на
  // «Привычках»); long-press ловит сетка → меню (Поделиться / Переставить / Убрать с главной).
  const tileFor = (k) => {
    if (k.indexOf("w:") === 0) { const id = k.slice(2); return nodes[id] ? <WidgetBoundaryLive wid={id}>{nodes[id]}</WidgetBoundaryLive> : null; }
    if (k.indexOf("h:") === 0) { const h = habits.find((x) => "h:" + x.id === k); return h ? <HabitTileLive habit={h} from="home" /> : null; }
    if (k.indexOf("g:") === 0) { const g = goals.find((x) => "g:" + x.id === k); return g ? <GoalTileLive goal={g} from="home" /> : null; }
    if (k.indexOf("t:") === 0) { const t = teams.find((x) => teamKey(x) === k); return t && typeof TeamTileLive === "function" ? <TeamTileLive team={t} from="home" /> : null; }
    return null;
  };
  const onCellLongPress = (k) => {
    const enterRe = () => { if (gridCtl.current && gridCtl.current.enterReorder) gridCtl.current.enterReorder(); };
    if (k.indexOf("w:") === 0) { enterRe(); return; } // виджет: зажал → сразу тряска (iOS)
    if (k.indexOf("h:") === 0) {
      const h = habits.find((x) => "h:" + x.id === k); if (!h) { enterRe(); return; }
      openSheet(<HabitTileMenuLive habit={h} dark={isDark}
        onShare={() => openSheet(<ShareHabitSheetLive habit={h} dark={isDark} />)}
        onReorder={enterRe}
        deleteIcon={<I.X size={18} />} deleteLabel="Убрать с главной" onDelete={() => hideKey(k)} />);
      return;
    }
    if (k.indexOf("g:") === 0) {
      const g = goals.find((x) => "g:" + x.id === k); if (!g) { enterRe(); return; }
      openSheet(<HabitTileMenuLive habit={g} dark={isDark} kindLabel="Цель"
        onShare={() => openSheet(<ShareGoalSheetLive goal={g} dark={isDark} />)}
        onReorder={enterRe}
        deleteIcon={<I.X size={18} />} deleteLabel="Убрать с главной" onDelete={() => hideKey(k)} />);
      return;
    }
    if (k.indexOf("t:") === 0) {
      // Круг: то же меню; «Убрать с главной» прячет ПЛИТКУ (сам круг живёт на «Привычках»
      // и в «Сообществе»), «Поделиться» — та же шторка-приглашение, что на странице Привычки.
      const t = teams.find((x) => teamKey(x) === k); if (!t) { enterRe(); return; }
      openSheet(<HabitTileMenuLive habit={{ name: t.name, emoji: t.emblem || "👥", color: t.accent || t.color }} dark={isDark} kindLabel="Совместная цель"
        onShare={() => openSheet(<TeamShareSheet team={t} />)}
        onReorder={enterRe}
        deleteIcon={<I.X size={18} />} deleteLabel="Убрать с главной" onDelete={() => hideKey(k)} />);
    }
  };

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
        <WidgetBoundaryLive wid="hero">{(() => { try { return nodeOf("hero"); } catch (e) { return null; } })()}</WidgetBoundaryLive>
      ) : visibleKeys.length > 0 ? (
        <BosReorderGrid
          ids={visibleKeys}
          cols={2}
          gap={12}
          ctlRef={gridCtl}
          onReorder={onReorderKeys}
          onLongPress={onCellLongPress}
          onAdd={openAddSheet}
          addLabel="Добавить на главную"
          spanFull={(k) => {
            // Виджеты — во всю ширину; плитки решают сами по своей форме (как на «Привычках»).
            if (!k || k.indexOf("w:") === 0) return true;
            if (k.indexOf("g:") === 0 || k.indexOf("t:") === 0) return goalStyle.form === "banner";
            return cardStyle.form === "rect";
          }}
          renderItem={(k, { mode }) => (
            <div style={{ position: "relative", height: "100%" }}>
              <div style={{ pointerEvents: mode ? "none" : "auto", height: "100%" }}>{tileFor(k)}</div>
              {mode && <WidgetMinusLive onRemove={() => hideKey(k)} />}
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

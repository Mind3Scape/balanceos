/* economy_live.jsx — the LIVE gamification economy (XP · levels · achievements).
   ============================================================================
   This is the live product's OWN copy of the economy, forked off the shared one
   that still lives in components/shell.jsx (which from now on serves the DEMO only).
   Every name carries a `Live` suffix (bosLiveXP → bosLiveXPLive,
   BOS_ACHIEVEMENTS → BOS_ACHIEVEMENTS_LIVE) so the two economies can NEVER collide
   as globals.

   At the moment of the fork the behaviour is IDENTICAL to the demo's — this is a
   clean split, not a change. From here the live rules can diverge freely (new XP
   amounts, a new ladder, a new curve) WITHOUT any risk to the frozen demo showcase:
   they are physically different functions now. This file is the seed of the new
   live economy — change the rules HERE, the demo never feels it.

   Shared, neutral date/streak helpers (bosDayKeyOffset, bosMoodStreak, bosMaxStreak)
   stay in the framework and are reused as-is — like React, they belong to neither
   product.

   Consumed by: the live screens (home/profile/community/…_live.jsx) for DISPLAY, and
   by the live-only achievement-celebration detector in AppProvider (components/shell.jsx),
   which looks bosEarnedAchIdsLive / bosAchByIdLive up via typeof guards. */

// Bonus XP for HOLDING the state streak: every full 7-day run of consecutive check-ins pays
// +50 ("удержал неделю — бонус"). Scans ~1y of history; stable & monotonic with the data.
function bosMoodStreakBonusXPLive(dayMoods) {
  if (!dayMoods) return 0;
  var weeks = 0, run = 0;
  for (var i = 0; i < 400; i++) {
    if (dayMoods[bosDayKeyOffset(i)] != null) run++;
    else { weeks += Math.floor(run / 7); run = 0; }
  }
  weeks += Math.floor(run / 7);
  return weeks * 50;
}
// Total earned XP for a live profile. Every habit completion is +10 XP. Engagement also
// pays: +5 per day you check in your state, +10 per day you write a journal line — so
// the orb/journal "pay" XP, which the app communicates. Monotonic (just counts of entries).
function bosTotalXPLive(habits, extras) {
  var n = 0;
  (habits || []).forEach(function (h) { if (h && h.log) n += Object.keys(h.log).length; });
  var xp = n * 10;
  if (extras) {
    xp += Object.keys(extras.moods || {}).length * 5;              // +5 за отметку состояния
    xp += bosMoodStreakBonusXPLive(extras.moods);                  // +50 за каждую удержанную неделю состояния
    var notes = extras.notes || {};
    Object.keys(notes).forEach(function (k) {                       // +10 за запись в дневник
      var e = notes[k];
      if (e && (((e.note != null) && ("" + e.note).trim()) || (e.tags && e.tags.length))) xp += 10;
    });
  }
  return xp;
}
// Referral XP — the real reward for bringing people in (David: «в этом весь смысл реферальной
// программы»). +150 per REGISTERED invitee + cumulative circle-milestone bonuses (3/7/15/30 →
// 300/700/1500/3000). `invitedCount` is the cloud-loaded count of profiles referred by you, so
// this only ever pays for people who actually signed up via your link.
function bosReferralXPLive(app) {
  var n = (app && (app.invitedCount || app.friendsCount)) || 0;
  if (n <= 0) return 0;
  var xp = n * 150;
  var miles = [{ n: 3, b: 300 }, { n: 7, b: 700 }, { n: 15, b: 1500 }, { n: 30, b: 3000 }];
  for (var i = 0; i < miles.length; i++) { if (n >= miles[i].n) xp += miles[i].b; }
  return xp;
}
// BASE live XP = real ACTIONS only (habits + state + journal + state-week bonus). Achievement
// conditions use this, so neither badge XP nor referral XP feeds back into "reach level N".
function bosBaseXPLive(app) { return app ? bosTotalXPLive(app.habits, { moods: app.dayMoods, notes: app.dayNotes }) : 0; }
// Team-goal winnings — bonus XP UNLOCKED when a staked team goal is reached (co-op: your stake;
// race: the leader's bank). Loaded from the cloud settlement ledger into app.teamGoalXP on
// enterLive (mirrors invitedCount). Rides on TOP of base, like referral/badge XP — so finishing a
// team goal really lifts your level, but never silently unlocks a "reach level N" badge.
function bosTeamGoalXPLive(app) { return (app && app.teamGoalXP) || 0; }
// Displayed live XP = base + achievement bonus + REFERRAL XP + TEAM-GOAL XP. Used everywhere a
// level/XP total is SHOWN, so badges, bringing people in, AND winning team goals all push your
// level forward — each riding on top of base (never feeding "reach level N").
function bosLiveXPLive(app) {
  return bosBaseXPLive(app)
    + (typeof bosAchievementBonusXPLive === "function" ? bosAchievementBonusXPLive(app) : 0)
    + (typeof bosReferralXPLive === "function" ? bosReferralXPLive(app) : 0)
    + (typeof bosTeamGoalXPLive === "function" ? bosTeamGoalXPLive(app) : 0)
    + (typeof bosChallengeBonusXPLive === "function" ? bosChallengeBonusXPLive(app) : 0);
}
// XP-бонус за ЗАВЕРШЁННЫЕ челленджи = сумма ПОСТОЯННОЙ копилки app.claimedChallenges {key:bonus} (David:
// «заработал бонус — он навсегда в копилке, дальше хоть пропусти день, хоть удали привычку»). Фиксация
// происходит в AppProvider (shell.jsx): как только серия привычки достигла срока `days` (или цель/команда
// достигла target), ключ кладётся в claimedChallenges НАВСЕГДА. Здесь просто суммируем — не пересчитываем
// из текущего состояния, поэтому бонус не отбирается при обрыве серии/удалении.
function bosChallengeBonusXPLive(app) {
  if (!app || !app.claimedChallenges) return 0;
  var sum = 0, c = app.claimedChallenges;
  for (var k in c) { if (Object.prototype.hasOwnProperty.call(c, k)) sum += (c[k] | 0); }
  return sum;
}
// XP-КОШЕЛЁК (сколько можно потратить) = ВСЁ заработанное − уже потрачено. Отдельно от уровня: уровень
// считается от bosLiveXPLive (всё заработанное) и трата его НЕ трогает (David: «трата не обнуляет уровень»).
// Никогда не отрицательный. spentXP приходит из AppProvider и синхронизируется в облаке вместе с копилкой.
function bosLiveSpendableXPLive(app) {
  return Math.max(0, bosLiveXPLive(app) - ((app && app.spentXP) | 0));
}
// XP → level. Each level costs a little more than the last (100, 150, 200…): a gentle curve
// so the first wins come fast and later levels feel earned.
function bosLevelInfoLive(xp) {
  xp = xp || 0;
  var L = 1, floor = 0, step = 100;
  while (xp >= floor + step) { floor += step; L++; step += 50; }
  return { level: L, xp: xp, floor: floor, next: floor + step, into: xp - floor, span: step, pct: Math.max(2, Math.round(((xp - floor) / step) * 100)) };
}

/* ── Achievements (LIVE) ──────────────────────────────────────────────────────
   Real, persisted milestone badges for LIVE users — earned from real signals, each
   pays bonus XP, and a freshly-unlocked one pops a celebration. Conditions use BASE
   xp (bosBaseXPLive), so a badge's XP can never cascade-unlock the next "reach level N".
   Paced against the real XP→time curve so there's always a next thing, never too often. */
function bosCareDaysLive(app) {
  var days = {}, k;
  var dm = (app && app.dayMoods) || {};
  for (k in dm) { if (dm[k] != null && /^\d{4}-\d{2}-\d{2}$/.test(k)) days[k] = 1; }
  var dn = (app && app.dayNotes) || {};
  for (k in dn) { var e = dn[k]; if (/^\d{4}-\d{2}-\d{2}$/.test(k) && e && (((e.note != null) && ("" + e.note).trim()) || (e.tags && e.tags.length))) days[k] = 1; }
  return Object.keys(days).length;
}
var BOS_ACHIEVEMENTS_LIVE = [
  { id: "first_habit", i: "🌱", t: "Первый шаг",        d: "Создал первую привычку",                       xp: 30,   accent: "#7FB37F", how: "Создай первую привычку",                  test: function (c) { return c.habits >= 1; } },
  { id: "week_state",  i: "🔥", t: "Неделя с собой",     d: "7 дней подряд отмечал состояние",               xp: 60,   accent: "#FF8A5B", how: "Отмечай состояние 7 дней подряд",         test: function (c) { return c.moodStreak >= 7; } },
  { id: "lvl5",        i: "⚡", t: "Разогрев",           d: "Достиг 5 уровня",                              xp: 75,   accent: "#FEDE34", how: "Дойди до 5 уровня",                       test: function (c) { return c.level >= 5; } },
  { id: "habit21",     i: "📿", t: "Привычка прижилась", d: "Держал привычку 21 день подряд",               xp: 120,  accent: "#9BCBA0", how: "Держи привычку 21 день подряд",           test: function (c) { return c.habitStreak >= 21; } },
  { id: "care30",      i: "🧠", t: "Месяц с собой",      d: "30 дней наблюдал состояние или вёл дневник",    xp: 120,  accent: "#7FB5FF", how: "30 дней отмечай состояние или пиши дневник", test: function (c) { return c.careDays >= 30; } },
  { id: "team",        i: "🤝", t: "Не один",            d: "Собрал своих или позвал друга",              xp: 100,  accent: "#5FA8FF", how: "Создай совместную цель или пригласи друга",       test: function (c) { return c.teams >= 1 || c.friends >= 1; } },
  { id: "lvl10",       i: "🏅", t: "Уверенный",          d: "Достиг 10 уровня",                             xp: 150,  accent: "#FEDE34", how: "Дойди до 10 уровня",                      test: function (c) { return c.level >= 10; } },
  { id: "care100",     i: "🗓️", t: "100 дней пути",      d: "100 дней заботы о себе",                       xp: 250,  accent: "#7FB5FF", how: "100 дней отмечай состояние или дневник",  test: function (c) { return c.careDays >= 100; } },
  { id: "habit60",     i: "💎", t: "Несгибаемый",        d: "Держал привычку 60 дней подряд",               xp: 300,  accent: "#9BD0FF", how: "Держи привычку 60 дней подряд",           test: function (c) { return c.habitStreak >= 60; } },
  { id: "goal",        i: "🎯", t: "Цель достигнута",    d: "Довёл цель до конца",                          xp: 200,  accent: "#FF8A5B", how: "Заверши хотя бы одну цель",               test: function (c) { return c.goalsDone >= 1; } },
  { id: "lvl15",       i: "🌟", t: "Глубже",             d: "Достиг 15 уровня",                             xp: 350,  accent: "#FEDE34", how: "Дойди до 15 уровня",                      test: function (c) { return c.level >= 15; } },
  { id: "care180",     i: "🏔️", t: "Полгода роста",      d: "180 дней заботы о себе",                       xp: 450,  accent: "#A8E0E8", how: "Полгода отмечай состояние или дневник",   test: function (c) { return c.careDays >= 180; } },
  { id: "lvl20",       i: "🌍", t: "Вершина",            d: "Достиг 20 уровня",                             xp: 600,  accent: "#FEDE34", how: "Дойди до 20 уровня",                      test: function (c) { return c.level >= 20; } },
  { id: "year",        i: "👑", t: "Год пути",           d: "365 дней заботы о себе",                       xp: 800,  accent: "#E8C86A", how: "Год отмечай состояние или дневник",       test: function (c) { return c.careDays >= 365; } },
  { id: "lvl25",       i: "⭐", t: "Только начало",      d: "Достиг 25 уровня — для кого-то это лишь старт", xp: 1000, accent: "#C9B8FF", how: "Дойди до 25 уровня",                      test: function (c) { return c.level >= 25; } },
];
function bosAchContextLive(app) {
  var habits = (app && app.habits) || [];
  var teams = ((app && app.teams) || []).filter(function (t) { return t && (t.joined || t.cloudId); }).length;
  var goalsDone = ((app && app.goals) || []).filter(function (g) { return g && g.target && (g.current || 0) >= g.target; }).length;
  var friends = 0; try { friends = (app && (app.invitedCount || app.friendsCount)) || 0; } catch (e) {}
  return {
    level: bosLevelInfoLive(bosBaseXPLive(app)).level,
    careDays: bosCareDaysLive(app),
    moodStreak: bosMoodStreak(app && app.dayMoods),
    habitStreak: bosMaxStreak(habits),
    habits: habits.length, teams: teams, friends: friends, goalsDone: goalsDone,
  };
}
// Full ladder with each badge's .earned for the current live profile.
function bosEarnedAchievementsLive(app) {
  var c = bosAchContextLive(app);
  return BOS_ACHIEVEMENTS_LIVE.map(function (a) { return Object.assign({}, a, { earned: !!a.test(c) }); });
}
// Total bonus XP from unlocked achievements — added on top of base XP for the shown level.
function bosAchievementBonusXPLive(app) {
  var c = bosAchContextLive(app), sum = 0;
  for (var i = 0; i < BOS_ACHIEVEMENTS_LIVE.length; i++) { if (BOS_ACHIEVEMENTS_LIVE[i].test(c)) sum += BOS_ACHIEVEMENTS_LIVE[i].xp || 0; }
  return sum;
}
function bosEarnedAchIdsLive(app) {
  var c = bosAchContextLive(app), ids = [];
  for (var i = 0; i < BOS_ACHIEVEMENTS_LIVE.length; i++) { if (BOS_ACHIEVEMENTS_LIVE[i].test(c)) ids.push(BOS_ACHIEVEMENTS_LIVE[i].id); }
  return ids;
}
function bosAchByIdLive(id) { for (var i = 0; i < BOS_ACHIEVEMENTS_LIVE.length; i++) { if (BOS_ACHIEVEMENTS_LIVE[i].id === id) return BOS_ACHIEVEMENTS_LIVE[i]; } return null; }

/* ── ГИД «Как устроен Balance» (v531, David: «гид-мануал как в игре, с картинками и механиками,
   от максимально локальной идеи до максимально масштабной») — LIVE-переопределение маршрута
   guide (демо-GuideScreen «О приложении» не тронут). Шесть глав-лестница: отметка → опыт и
   уровень → вместе (настоящая GoalOrbitMini как иллюстрация) → партнёры (билет) → нетворк
   (замок 10 уровня) → Вселенная. Все цифры НАСТОЯЩИЕ (+10/+30/+150 — те же, что в экономике).
   Иллюстрации — рисунки мануала (подписи не выдают их за живые данные). */
function GuideLive() {
  var nav = (typeof useNav === "function") ? useNav() : {};
  var navigate = nav.navigate || function () {};
  var params = nav.params || {};
  var app = (typeof useApp === "function") ? useApp() : null;
  var isDark = !!(app && app.themeOverride === "dark");
  var back = function () { navigate(params.from || "profile"); };
  var sheen = (typeof BOS_TILE_SHEEN !== "undefined") ? BOS_TILE_SHEEN + ", " : "";
  var glass = (typeof bosTileGlass === "function") ? bosTileGlass(isDark) : "none";
  var chipBg = sheen + (isDark ? "rgba(255,255,255,0.08)" : "#fff");
  var cardStyle = { background: "var(--card)", borderRadius: 22, boxShadow: "var(--card-shadow)", overflow: "hidden" };
  var kicker = function (n, t) {
    return (
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "0 4px", marginTop: 26, marginBottom: 8 }}>
        <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-1px", color: "var(--text-4)", opacity: 0.45, fontVariantNumeric: "tabular-nums", fontFamily: "var(--bos-title-font)" }}>{n}</span>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--text-4)" }}>{t}</span>
      </div>
    );
  };
  var body = function (title, text) {
    return (
      <div style={{ padding: "14px 16px 16px" }}>
        <div style={{ fontSize: 17.5, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.3px", fontFamily: "var(--bos-title-font)" }}>{title}</div>
        <div style={{ fontSize: 13.5, color: "var(--text-3)", marginTop: 6, lineHeight: 1.55 }}>{text}</div>
      </div>
    );
  };
  var goldPill = function (txt) {
    return <span style={{ display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 800, color: "#0a0a0a", background: "linear-gradient(135deg,#FEDE34,#EF9F14)", padding: "3px 9px", borderRadius: 999, boxShadow: "0 4px 12px rgba(239,159,20,0.35)" }}>{txt}</span>;
  };
  // Кольцо уровня для иллюстраций (та же математика, что на «Я»).
  var ring = function (size, pctv, inner) {
    var r = (size - 4) / 2, c = 2 * Math.PI * r;
    return (
      <span style={{ position: "relative", width: size, height: size, display: "grid", placeItems: "center" }}>
        <svg width={size} height={size} viewBox={"0 0 " + size + " " + size} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }} aria-hidden>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.09)"} strokeWidth="3" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#bosGdRing)" strokeWidth="3" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pctv)} />
          <defs><linearGradient id="bosGdRing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FEDE34" /><stop offset="1" stopColor="#EF9F14" /></linearGradient></defs>
        </svg>
        {inner}
      </span>
    );
  };
  return (
    <div className="page-in" style={{ padding: "0 16px 28px" }}>
      <PageHeader title="Как устроен Balance" onBack={back} />
      <div style={{ padding: "2px 4px 0" }}>
        <div style={{ fontFamily: "var(--bos-title-font)", fontSize: 25, fontWeight: 800, letterSpacing: "-0.6px", color: "var(--text)", lineHeight: 1.15 }}>Одна отметка — целая вселенная</div>
        <div style={{ fontSize: 14, color: "var(--text-3)", marginTop: 8, lineHeight: 1.5 }}>Пара минут — и ты знаешь все механики: от маленького шага до карты всех людей.</div>
      </div>

      {kicker("01", "Самое маленькое")}
      <div style={cardStyle}>
        <div style={{ padding: "18px 16px 4px", display: "flex", justifyContent: "center" }}>
          <div style={{ position: "relative", width: "100%", maxWidth: 300 }}>
            <div style={{ background: isDark ? "rgba(255,255,255,0.05)" : "var(--surface-3)", borderRadius: 18, padding: "13px 14px", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 40, height: 40, borderRadius: 13, background: chipBg, boxShadow: glass, display: "grid", placeItems: "center", fontSize: 20 }}>🤸</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>Зарядка</div>
                <div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 1 }}>сегодня · сделано</div>
              </div>
              <span style={{ width: 30, height: 30, borderRadius: "50%", background: "#34C759", display: "grid", placeItems: "center", color: "#fff", boxShadow: "0 4px 12px rgba(52,199,89,0.4)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
              </span>
            </div>
            <span style={{ position: "absolute", top: -10, right: 6 }}>{goldPill("✦ +10 XP")}</span>
          </div>
        </div>
        {body("Отметка", "Сделал дело — коснулся плитки. Каждая отметка даёт +10 XP, закрыл весь день — ещё +30 сверху. Ничего не сгорает: пропустил день — просто продолжаешь.")}
      </div>

      {kicker("02", "Твой след")}
      <div style={cardStyle}>
        <div style={{ padding: "20px 16px 6px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          {ring(88, 0.72, (
            <span style={{ position: "relative", width: 68, height: 68, borderRadius: "50%", background: chipBg, boxShadow: glass, display: "grid", placeItems: "center", fontSize: 32 }}>
              🙂
              <span style={{ position: "absolute", right: -4, bottom: -2, minWidth: 22, height: 22, borderRadius: 999, background: "linear-gradient(135deg,#FEDE34,#EF9F14)", color: "#0a0a0a", fontSize: 12, fontWeight: 800, display: "grid", placeItems: "center", padding: "0 5px", boxShadow: "0 0 0 2.5px var(--card)" }}>5</span>
            </span>
          ))}
          <div style={{ fontSize: 11.5, color: "var(--text-4)", fontWeight: 600 }}>кольцо заполняется → уровень растёт</div>
        </div>
        {body("Опыт и уровень", "XP поднимает уровень — золотое кольцо вокруг твоего лица. Уровень не обнуляется и не «сгорает по понедельникам»: это след пути, а не счётчик вины. Разовые ачивки дают XP пачками.")}
      </div>

      {kicker("03", "Сильнее вместе")}
      <div style={cardStyle}>
        <div style={{ padding: "12px 16px 0", display: "flex", justifyContent: "center" }}>
          {(typeof GoalOrbitMini === "function") ? (
            <GoalOrbitMini centerEmoji="🌅" centerColor={null}
              habits={[{ emoji: "🤸", color: "#34C759", done: true }, { emoji: "📖", color: "#0A84FF" }, { emoji: "💧", color: "#5AC8FA" }]}
              people={[{ avatar: "emoji:🐱", name: "" }, { avatar: "emoji:🦊", name: "" }, { avatar: "emoji:🙂", name: "" }]}
              size={158} dark={isDark} />
          ) : <span style={{ fontSize: 44 }}>🌅</span>}
        </div>
        {body("Совместные цели и привычки", "Любую привычку или цель можно вести вместе: общий круг, лица на одной орбите, общий счёт и чат. За каждого, кто придёт по твоей ссылке, — +150 XP, а на вехах — бонусы больше.")}
      </div>

      {kicker("04", "Куда тратить")}
      <div style={cardStyle}>
        <div style={{ padding: "18px 16px 2px", display: "flex", justifyContent: "center" }}>
          <div style={{ position: "relative", width: "100%", maxWidth: 300, borderRadius: 18, overflow: "hidden", background: "linear-gradient(135deg,#FEDE34,#EF9F14)", boxShadow: "0 10px 26px rgba(239,159,20,0.35)", padding: "14px 16px", color: "#0a0a0a" }}>
            <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 85% 10%, rgba(255,255,255,0.45) 0%, transparent 55%)", pointerEvents: "none" }} />
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", opacity: 0.6 }}>Партнёрский билет</div>
                <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.3px", marginTop: 3, fontVariantNumeric: "tabular-nums" }}>✦ BAL-2481</div>
              </div>
              <span style={{ fontSize: 10.5, fontWeight: 800, background: "rgba(10,10,10,0.85)", color: "#FEDE34", borderRadius: 999, padding: "4px 9px" }}>скоро</span>
            </div>
            <div aria-hidden style={{ position: "relative", borderTop: "2px dashed rgba(10,10,10,0.25)", margin: "12px -16px 0" }} />
            <div style={{ position: "relative", fontSize: 11.5, fontWeight: 600, marginTop: 9, opacity: 0.75 }}>предъяви код — получи живое</div>
          </div>
        </div>
        {body("Партнёры", "XP и уровень — не просто цифры. В «Найти» партнёры меняют их на реальное: программы, разборы, скидки. Партнёром может вырасти любой — это уровень, а не должность.")}
      </div>

      {kicker("05", "Люди по делам")}
      <div style={cardStyle}>
        <div style={{ padding: "18px 16px 2px" }}>
          <div style={{ position: "relative", borderRadius: 18, background: isDark ? "rgba(255,255,255,0.05)" : "var(--surface-3)", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 9 }}>
            {[["🤝", "Похожая структура привычек"], ["🔥", "Такой же ритм — спорт по утрам"]].map(function (r, i) {
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, filter: "blur(3.5px)", opacity: 0.6 }}>
                  <span style={{ width: 34, height: 34, borderRadius: "50%", background: chipBg, boxShadow: glass, display: "grid", placeItems: "center", fontSize: 16 }}>{r[0]}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>{r[1]}</span>
                </div>
              );
            })}
            <span style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", display: "inline-flex", alignItems: "center", gap: 6, background: isDark ? "rgba(28,28,30,0.92)" : "rgba(255,255,255,0.95)", boxShadow: "0 8px 24px rgba(0,0,0,0.18)", borderRadius: 999, padding: "8px 14px", fontSize: 12.5, fontWeight: 700, color: "var(--text)" }}>🔒 Откроется с 10 уровня</span>
          </div>
        </div>
        {body("Нетворк", "С 10 уровня открываются «Люди» — нетворк по делам: кто чем живёт, у кого какой ритм, к кому идти за помощью. Уровень — твой пропуск, его не купить.")}
      </div>

      {kicker("06", "Самое большое")}
      <div style={cardStyle}>
        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ position: "relative", borderRadius: 18, overflow: "hidden", background: "linear-gradient(160deg, #0e1a2e 0%, #0a1424 100%)", height: 150 }}>
            {[[12, 18, 2.5], [30, 64, 2], [48, 30, 3], [66, 74, 2], [82, 22, 2.5], [90, 58, 2], [22, 82, 2], [58, 12, 2], [74, 44, 2.5], [8, 52, 2], [40, 90, 2], [95, 86, 2]].map(function (d, i) {
              return <span key={i} aria-hidden style={{ position: "absolute", left: d[0] + "%", top: d[1] + "%", width: d[2], height: d[2], borderRadius: "50%", background: "rgba(190,215,255,0.85)", boxShadow: "0 0 6px rgba(160,200,255,0.8)" }} />;
            })}
            {[[24, 34, 34, "🙂"], [56, 58, 42, "😎"], [78, 26, 30, "🐱"]].map(function (d, i) {
              return (
                <span key={"d" + i} style={{ position: "absolute", left: d[0] + "%", top: d[1] + "%", width: d[2], height: d[2], borderRadius: "50%", background: "linear-gradient(165deg, rgba(255,255,255,0.35), rgba(255,255,255,0.08) 55%), rgba(255,255,255,0.14)", boxShadow: "inset 0 1px 0.5px rgba(255,255,255,0.4), 0 6px 18px rgba(0,0,0,0.35)", display: "grid", placeItems: "center", fontSize: d[2] * 0.5 }}>{d[3]}</span>
              );
            })}
            <span style={{ position: "absolute", left: 12, bottom: 10, fontSize: 10.5, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "rgba(190,215,255,0.75)" }}>Вселенная · все системы</span>
          </div>
        </div>
        {body("Вселенная", "Каждый здесь — своя система: человек в центре, привычки — планеты на орбитах. «Вселенная» на странице «Я» показывает всех — анонимно, как огни ночного города. Ты уже один из них.")}
      </div>

      <button onClick={back} className="tap" style={{ width: "100%", marginTop: 22, border: 0, borderRadius: 999, padding: 16, background: "var(--cta, #0a0a0a)", color: "var(--cta-ink, #fff)", fontSize: 15.5, fontWeight: 700, cursor: "pointer" }}>Начали!</button>
      <div style={{ textAlign: "center", fontSize: 12, color: "var(--text-4)", marginTop: 12, lineHeight: 1.5 }}>Остались вопросы — Balance AI на соседней вкладке.</div>
    </div>
  );
}

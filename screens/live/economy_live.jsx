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
  // Отметка привычки = +10; СОВМЕСТНАЯ привычка (buddy по shareCode) платит +15/отметку — вести
  // вместе реально выгоднее (David: «начисляй как обещали»). Идеальный день (+30) капает отдельно
  // в копилку claimedChallenges при закрытии дня (shell), суммируется в bosChallengeBonusXPLive.
  var xp = 0;
  (habits || []).forEach(function (h) { if (h && h.log) xp += Object.keys(h.log).length * (h.shareCode ? 15 : 10); });
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

// «Баланс дня» = главный ежедневный цикл live-приложения. Чисто производная: ничего не
// пишет, не начисляет и не ходит в облако. Три части сознательно отделяют завершённость
// от очков: состояние → ход → смысл/связь. Пока у человека нет своих, третья часть —
// смысл (заметка/ярлык дня); появились общие привычки или круги — она становится связью.
function bosDailyBalanceLive(app) {
  var today = (typeof bosTodayKey === "function") ? bosTodayKey() : new Date().toISOString().slice(0, 10);
  var habits = ((app && app.habits) || []).filter(function (h) { return h && !h.shelved && !h.goalOnly; });
  var notes = (app && app.dayNotes && app.dayNotes[today]) || null;
  var teams = (app && app.teams) || [];
  var hasSharedHabit = habits.some(function (h) { return h && (h.shareCode || h.teamHabitId); });
  var hasTeams = !!(teams.length || hasSharedHabit);

  var stateDone = !!(app && app.dayMoods && app.dayMoods[today] != null);
  var moveDone = habits.some(function (h) { return !!(h && h.log && h.log[today]); });
  var linkedHabitDone = habits.some(function (h) { return !!(h && (h.shareCode || h.teamHabitId) && h.log && h.log[today]); });
  var reflectionDone = !!(notes && (((notes.note != null) && ("" + notes.note).trim()) || (Array.isArray(notes.tags) && notes.tags.length)));
  var linkDone = hasTeams ? linkedHabitDone : reflectionDone;

  var parts = [
    { id: "state", label: "Состояние", done: stateDone, icon: "🌤", cta: "Отметить состояние", route: "state" },
    { id: "move", label: "Ход", done: moveDone, icon: "✅", cta: habits.length ? "Сделать ход" : "Создать привычку", route: habits.length ? "habits" : "create-habit" },
    { id: "link", label: hasTeams ? "Связь" : "Смысл", done: linkDone, icon: hasTeams ? "🤝" : "✍️", cta: hasTeams ? "Отметиться вместе" : "Добавить смысл", route: hasTeams ? "community" : "state" },
  ];
  var done = parts.filter(function (p) { return p.done; }).length;
  var required = parts.length;
  return {
    today: today,
    parts: parts,
    done: done,
    required: required,
    complete: done >= required,
    pct: required ? done / required : 0,
    next: parts.find(function (p) { return !p.done; }) || null,
    hasTeams: hasTeams,
    habitsToday: habits.filter(function (h) { return h && h.log && h.log[today]; }).length,
  };
}

function bosDayCloseInsightLive(app) {
  var db = (typeof bosDailyBalanceLive === "function") ? bosDailyBalanceLive(app) : null;
  if (!db) return "Ты заметил состояние, сделал ход и закрепил день. Это и есть ритм.";
  if (db.habitsToday >= 2) return "Сегодня не один чек — ты собрал несколько реальных ходов.";
  if (db.hasTeams) return "Ты не просто отметил день — ты оставил след в общем ритме.";
  return "Один честный день важнее идеального плана. Завтра продолжим с малого.";
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

/* ── ГИД «Как устроен Balance» 3.0 — капитальный редизайн (worldview v2 + мастер-план §8).
   ЧЕТЫРЕ акта-лестницы: День → Рост → Свои → Мир, в языке VISION (звезда/планеты/орбиты/
   город). В КАЖДОМ акте — живая сцена из НАСТОЯЩИХ атомов приложения (плитка привычки,
   кольцо уровня, орбита, билет): человек трогает механику, не выходя из рассказа. Пилюли
   собирают прогресс прочтения; финал — единственный выход «Сделать первый ход». Ни одной
   ссылки наружу до финала. Все цифры честные (мастер-план §4): отметка +10 · вместе +15 ·
   состояние +5 · неделя +50 · дневник +10 · идеальный день +30 · друг +150 · вехи 3/7/15/30
   · челлендж +30…75 · достижения разово. Серия обнуляется при пропуске — уровень и XP нет. */
function GuideLive() {
  var nav = (typeof useNav === "function") ? useNav() : {};
  var navigate = nav.navigate || function () {};
  var params = nav.params || {};
  var app = (typeof useApp === "function") ? useApp() : null;
  var isDark = !!(app && app.themeOverride === "dark");
  var back = function () { navigate(params.from || "profile"); };
  var haptic = function (k) { if (window.tgHaptic) { try { window.tgHaptic(k || "selection"); } catch (e) {} } };
  var _oi = React.useState(params.tab && params.tab !== "suti" ? params.tab : null);
  var openId = _oi[0], setOpenId = _oi[1];
  // Прогресс прочтения: акт «зачтён», как только человек его открыл или потрогал сцену.
  var _seen = React.useState({});
  var seen = _seen[0], setSeen = _seen[1];
  var markSeen = function (id) { setSeen(function (s) { if (s[id]) return s; var n = Object.assign({}, s); n[id] = true; return n; }); };
  var _xp = React.useState(false), xpOpen = _xp[0], setXpOpen = _xp[1];   // свёртка «Точные цифры»
  // Состояние живых сцен — каждая реагирует на касание.
  var _sd = React.useState(false), dayTapped = _sd[0], setDayTapped = _sd[1];   // День: плитка отмечена
  var _sl = React.useState(false), levelUp = _sl[0], setLevelUp = _sl[1];       // Рост: кольцо докручено до L2
  var _si = React.useState(false), invited = _si[0], setInvited = _si[1];       // Свои: позвал
  var _sw = React.useState(false), stamped = _sw[0], setStamped = _sw[1];       // Мир: билет погашен
  var ACTS = ["day", "level", "together", "world"];
  var seenCount = ACTS.filter(function (k) { return seen[k]; }).length;
  var allSeen = seenCount >= ACTS.length;
  var hasHabits = !!(app && (app.habits || []).some(function (h) { return h && !h.shelved && !h.goalOnly; }));
  var secRefs = React.useRef({});
  var sheen = (typeof BOS_TILE_SHEEN !== "undefined") ? BOS_TILE_SHEEN + ", " : "";
  var glass = (typeof bosTileGlass === "function") ? bosTileGlass(isDark) : "none";
  var chipBg = sheen + (isDark ? "rgba(255,255,255,0.08)" : "#fff");
  var softBg = isDark ? "rgba(255,255,255,0.05)" : "var(--surface-3)";
  var cardStyle = { background: "var(--card)", borderRadius: 22, boxShadow: "var(--card-shadow)", overflow: "hidden" };
  var part = function (roman, title, sub) {
    return (
      <div style={{ marginTop: 34, padding: "0 4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.4, color: "#EF9F14" }}>{roman}</span>
          <span style={{ flex: 1, height: 1, background: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)" }} />
        </div>
        <div style={{ fontFamily: "var(--bos-title-font)", fontSize: 21, fontWeight: 800, letterSpacing: "-0.4px", color: "var(--text)", marginTop: 8 }}>{title}</div>
        {sub && <div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 4, lineHeight: 1.5 }}>{sub}</div>}
      </div>
    );
  };
  var kicker = function (n, t) {
    return (
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "0 4px", marginTop: 20, marginBottom: 8 }}>
        <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-1px", color: "var(--text-4)", opacity: 0.45, fontVariantNumeric: "tabular-nums", fontFamily: "var(--bos-title-font)" }}>{n}</span>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.2, color: "var(--text-4)" }}>{t}</span>
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
    return <span style={{ display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 800, color: "#0a0a0a", background: "linear-gradient(135deg,#FEDE34,#EF9F14)", padding: "3px 9px", borderRadius: 999, boxShadow: "0 4px 12px rgba(239,159,20,0.35)", whiteSpace: "nowrap" }}>{txt}</span>;
  };
  var ring = function (size, pctv, inner) {
    var r = (size - 4) / 2, c = 2 * Math.PI * r;
    return (
      <span style={{ position: "relative", width: size, height: size, display: "grid", placeItems: "center" }}>
        <svg width={size} height={size} viewBox={"0 0 " + size + " " + size} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }} aria-hidden>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.09)"} strokeWidth="3" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#bosGdRing)" strokeWidth="3" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pctv)} style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.2,0.7,0.2,1)" }} />
          <defs><linearGradient id="bosGdRing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FEDE34" /><stop offset="1" stopColor="#EF9F14" /></linearGradient></defs>
        </svg>
        {inner}
      </span>
    );
  };
  var visWrap = function (children, pad) {
    return <div style={{ padding: pad || "18px 16px 4px", display: "flex", justifyContent: "center" }}>{children}</div>;
  };
  var tabIntro = function (title, sub, big) {
    return (
      <div style={{ padding: "6px 4px 2px", marginTop: 6 }}>
        <div style={{ fontFamily: "var(--bos-title-font)", fontSize: big ? 25 : 19, fontWeight: 800, letterSpacing: "-0.5px", color: "var(--text)", lineHeight: 1.16 }}>{title}</div>
        {sub && <div style={{ fontSize: big ? 14 : 13, color: "var(--text-3)", marginTop: 6, lineHeight: 1.5 }}>{sub}</div>}
      </div>
    );
  };
  var pathLoop = function () {
    // Настоящие иконки приложения (window.I) в родных цветах, не эмодзи-заглушки:
    // день = зелёная отметка · ритм = огонёк серии · свои = орбита людей · места = пин.
    var steps = [
      { node: <I.Check size={20} color="var(--text-2)" strokeWidth={2.2} />, t: "День", s: "собран" },
      { node: <I.Flame size={20} color="var(--text-2)" strokeWidth={1.8} />, t: "Ритм", s: "держится" },
      { node: <I.OrbitPeople size={21} color="var(--text-2)" strokeWidth={1.7} />, t: "Свои", s: "рядом" },
      { node: <I.MapPin size={20} color="var(--text-2)" strokeWidth={1.8} />, t: "Места", s: "вживую" },
    ];
    return (
      <div style={{ width: "100%", maxWidth: 360, borderRadius: 20, padding: "13px 12px", background: softBg, boxShadow: glass }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 0.2, color: "var(--text-4)", marginBottom: 10 }}>как это течёт</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 6 }}>
          {steps.map(function (s, i) {
            return (
              <div key={s.t} style={{ position: "relative", minWidth: 0, borderRadius: 15, padding: "10px 5px 8px", background: chipBg, boxShadow: glass, textAlign: "center" }}>
                {i < steps.length - 1 && <span aria-hidden style={{ position: "absolute", right: -7, top: 27, color: "var(--text-4)", opacity: 0.5, fontSize: 12, zIndex: 2 }}>→</span>}
                <div style={{ height: 22, display: "grid", placeItems: "center" }}>{s.node}</div>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: "var(--text)", marginTop: 6, letterSpacing: "-0.15px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.t}</div>
                <div style={{ fontSize: 9.5, color: "var(--text-4)", marginTop: 2, lineHeight: 1.18 }}>{s.s}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  var guideAction = function (emoji, title, sub, route, params, strong) {
    return (
      <button onClick={function () { if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} } navigate(route, params || {}); }} className="tap"
        style={{ width: "100%", border: 0, cursor: "pointer", textAlign: "left", borderRadius: 18, padding: "12px 13px", display: "flex", alignItems: "center", gap: 11,
          background: strong ? "linear-gradient(135deg,#FEDE34,#EF9F14)" : softBg, color: strong ? "#0a0a0a" : "var(--text)", boxShadow: strong ? "0 8px 18px rgba(239,159,20,0.28)" : glass }}>
        <span style={{ width: 34, height: 34, borderRadius: 12, display: "grid", placeItems: "center", background: strong ? "rgba(255,255,255,0.35)" : chipBg, boxShadow: strong ? "inset 0 0 0 0.5px rgba(255,255,255,0.45)" : glass, fontSize: 17 }}>{emoji}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 13.5, fontWeight: 800, letterSpacing: "-0.15px" }}>{title}</span>
          {sub && <span style={{ display: "block", fontSize: 11.5, marginTop: 2, lineHeight: 1.3, color: strong ? "rgba(10,10,10,0.62)" : "var(--text-4)" }}>{sub}</span>}
        </span>
        <span aria-hidden style={{ fontSize: 16, opacity: 0.55 }}>›</span>
      </button>
    );
  };
  var goTo = function (id) {
    if (id !== "suti") { setOpenId(id); markSeen(id); }
    setTimeout(function () { var el = secRefs.current[id]; if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "start" }); }, 70);
  };
  // Свёрнутый заголовок этапа-«уровня»: номер-чип + название + подзаголовок + шеврон.
  var stageHeader = function (id, n, title, sub) {
    var open = openId === id;
    return (
      <button onClick={function () { var willOpen = !open; setOpenId(willOpen ? id : null); if (willOpen) { markSeen(id); setTimeout(function () { var el = secRefs.current[id]; if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "start" }); }, 70); } }}
        className="tap" data-haptic="selection"
        style={{ width: "100%", border: 0, cursor: "pointer", textAlign: "left", background: "var(--card)", borderRadius: 22, boxShadow: "var(--card-shadow)", padding: "15px 16px", display: "flex", alignItems: "center", gap: 13 }}>
        <span style={{ width: 32, height: 32, borderRadius: 11, flexShrink: 0, display: "grid", placeItems: "center", fontSize: 14, fontWeight: 800, fontVariantNumeric: "tabular-nums", background: open ? "linear-gradient(135deg,#FEDE34,#EF9F14)" : softBg, color: open ? "#0a0a0a" : "var(--text-3)", boxShadow: open ? "0 4px 12px rgba(239,159,20,0.35)" : "none" }}>{n}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", fontFamily: "var(--bos-title-font)", letterSpacing: "-0.3px" }}>{title}</div>
          <div style={{ fontSize: 12.5, color: "var(--text-4)", marginTop: 2, lineHeight: 1.4 }}>{sub}</div>
        </div>
        <span aria-hidden style={{ flexShrink: 0, color: "var(--text-4)", display: "grid", placeItems: "center", transition: "transform 0.22s", transform: open ? "rotate(90deg)" : "none" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
        </span>
      </button>
    );
  };
  return (
    <div className="page-in" style={{ padding: "0 16px 28px" }}>
      <PageHeader title="Как устроен Balance" onBack={back} />
      {/* Липкое быстрое меню-прыжок (David: «наверху меню из пилюль, скролл по категориям»).
          Тап = раскрыть этап + доскроллить к нему. Матовое стекло, чтобы не спорить с фоном. */}
      <div style={{ position: "sticky", top: 0, zIndex: 6, margin: "2px -16px 4px", padding: "8px 16px", background: isDark ? "rgba(18,18,20,0.72)" : "rgba(244,244,247,0.72)", backdropFilter: "saturate(180%) blur(18px)", WebkitBackdropFilter: "saturate(180%) blur(18px)" }}>
        <div className="bos-hscroll" style={{ display: "flex", gap: 7, overflowX: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch", touchAction: "pan-x" }}>
          {[["suti", "Суть"], ["day", "День"], ["level", "Рост"], ["together", "Свои"], ["world", "Мир"]].map(function (p) {
            var on = openId ? (openId === p[0]) : (p[0] === "suti");
            var g = (!on && typeof bosChipGlass === "function") ? bosChipGlass(isDark) : {};
            var done = p[0] !== "suti" && seen[p[0]];
            return (
              <button key={p[0]} onClick={function () { goTo(p[0]); }} className="tap" data-haptic="selection"
                style={{ border: 0, cursor: "pointer", borderRadius: 999, padding: "8px 13px", fontSize: 13.5, fontWeight: 600, flexShrink: 0, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 6, transition: "background 0.2s, color 0.2s", ...g, background: on ? "var(--cta, #0a0a0a)" : g.background, color: on ? "var(--cta-ink, #fff)" : "var(--text-2)" }}>
                {p[1]}
                {done && <span aria-hidden style={{ width: 15, height: 15, borderRadius: 999, background: "linear-gradient(135deg,#FEDE34,#EF9F14)", color: "#0a0a0a", display: "grid", placeItems: "center", fontSize: 9, fontWeight: 900, boxShadow: "0 1px 4px rgba(239,159,20,0.5)" }}>✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── СУТЬ — всегда открыта: формула пути + как всё течёт, дальше раскрываются акты. */}
      <div ref={function (el) { secRefs.current["suti"] = el; }} style={{ scrollMarginTop: 64 }}>
          {tabIntro("От дня — к своим", "Balance начинается как привычки, а оказывается системой, которая возвращает тебя в твою жизнь — и связывает со своими людьми и настоящими местами рядом.", true)}

          {/* Человеческая формула пути — четыре шага, крупно (worldview §1). */}
          <div style={{ ...cardStyle, marginTop: 14, padding: "4px 4px" }}>
            {[
              ["Собери себя", "состояние, привычка, день"],
              ["Найди своих", "круги и общие привычки"],
              ["Стань полезен", "помощь своим за опыт"],
              ["Выйди в жизнь", "практики и места рядом"],
            ].map(function (r, i) {
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 13, padding: "12px 12px", borderTop: i ? ("1px solid " + (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)")) : "none" }}>
                  <span style={{ width: 26, height: 26, borderRadius: 999, flexShrink: 0, display: "grid", placeItems: "center", fontSize: 12, fontWeight: 800, fontVariantNumeric: "tabular-nums", background: softBg, color: "var(--text-3)", boxShadow: glass }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16.5, fontWeight: 800, letterSpacing: "-0.3px", color: "var(--text)", fontFamily: "var(--bos-title-font)" }}>{r[0]}.</div>
                    <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 1 }}>{r[1]}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ ...cardStyle, marginTop: 12 }}>
            {visWrap(pathLoop(), "18px 14px 4px")}
            {body("Сначала — свой ритм", "Balance не начинается с ленты или рейтинга. Система собирает твой день, держит ритм — и только потом связывает его со своими, кругами и местами рядом.")}
          </div>

          <button onClick={function () { haptic("selection"); navigate("manifest", { from: "guide" }); }} className="tap"
            style={{ width: "100%", border: 0, cursor: "pointer", textAlign: "left", marginTop: 12, borderRadius: 16, padding: "13px 15px", background: softBg, boxShadow: glass, color: "var(--text-2)", fontSize: 13.5, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><I.Sparkles size={15} color="#EF9F14" strokeWidth={1.7} /> Зачем всё это — прочитать манифест</span>
            <span aria-hidden style={{ opacity: 0.5 }}>›</span>
          </button>
      </div>

      {/* ── ЭТАП 1: КАЖДЫЙ ДЕНЬ (свёрнут по умолчанию) */}
      <div ref={function (el) { secRefs.current["day"] = el; }} style={{ scrollMarginTop: 64, marginTop: 12 }}>
        {stageHeader("day", "1", "День", "Состояние, привычка, дневник — первый ход.")}
        {openId === "day" && (
          <React.Fragment>

      {kicker("01", "Первый ход")}
      <div style={cardStyle}>
        {visWrap(
          <div style={{ position: "relative", width: "100%", maxWidth: 300 }}>
            <button onClick={function () { if (!dayTapped) { haptic("impact"); setDayTapped(true); markSeen("day"); } }} className="tap"
              style={{ width: "100%", border: 0, cursor: "pointer", textAlign: "left", background: softBg, borderRadius: 18, padding: "13px 14px", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 40, height: 40, borderRadius: 13, background: chipBg, boxShadow: glass, display: "grid", placeItems: "center", fontSize: 20 }}>🚶</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>Прогулка</div>
                <div style={{ fontSize: 11.5, marginTop: 1, fontWeight: dayTapped ? 700 : 400, color: dayTapped ? "var(--text-3)" : "var(--text-4)" }}>{dayTapped ? "сегодня · сделано" : "коснись — отметь"}</div>
              </div>
              <span style={{ position: "relative", width: 32, height: 32, display: "grid", placeItems: "center", flexShrink: 0 }}>
                {dayTapped && <span aria-hidden style={{ position: "absolute", inset: 1, borderRadius: "50%", border: "2px solid #EF9F14", animation: "bosGuideWave 0.7s ease-out forwards" }} />}
                <span style={{ width: 30, height: 30, borderRadius: "50%", display: "grid", placeItems: "center", color: "#0a0a0a", transition: "background 0.3s, box-shadow 0.3s",
                  background: dayTapped ? "linear-gradient(135deg,#FEDE34,#EF9F14)" : "transparent",
                  boxShadow: dayTapped ? "0 4px 12px rgba(239,159,20,0.4)" : "inset 0 0 0 2px " + (isDark ? "rgba(255,255,255,0.22)" : "rgba(10,10,10,0.18)") }}>
                  {dayTapped && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
                </span>
              </span>
            </button>
            {dayTapped && <span key="p10" style={{ position: "absolute", top: -12, right: 6, animation: "bosXpPop 2.4s ease forwards" }}>{goldPill("✦ +10 XP")}</span>}
          </div>
        )}
        {body("Отметка", "Сделал дело — коснись плитки, вот и вся церемония. Каждая отметка — +10 XP. Отметить можно где угодно: на главной, в «Привычках», внутри цели или круга — это один и тот же журнал.")}
      </div>

      {kicker("02", "Ритм недели")}
      <div style={cardStyle}>
        {visWrap(
          <div style={{ width: "100%", maxWidth: 300 }}>
            <div style={{ background: softBg, borderRadius: 18, padding: "13px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Эта неделя</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 700, color: "#EF9F14" }}><I.Flame size={13} color="#EF9F14" strokeWidth={1.9} /> серия 6 дн.</span>
              </div>
              <div style={{ display: "flex", gap: 6, justifyContent: "space-between" }}>
                {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map(function (d, i) {
                  var on = i < 4;
                  return (
                    <div key={d} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 26, height: 26, borderRadius: "50%", background: on ? "linear-gradient(135deg,#FEDE34,#EF9F14)" : (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"), boxShadow: on ? "0 3px 8px rgba(239,159,20,0.35)" : "none" }} />
                      <span style={{ fontSize: 9.5, color: "var(--text-4)", fontWeight: 600 }}>{d}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>{goldPill("✦ идеальный день · +30 XP")}</div>
          </div>
        )}
        {body("Серия и идеальный день", "Отмечаешься день за днём — на плитке растёт огонёк серии 🔥. Закрыл ВСЕ привычки дня — это идеальный день, сверху падает +30 XP. И главное правило: пропуск НИЧЕГО не сжигает — ни уровень, ни опыт. Просто продолжай со следующего дня.")}
      </div>

      {kicker("03", "Как ты?")}
      <div style={cardStyle}>
        {visWrap(
          <div style={{ width: "100%", maxWidth: 300, background: softBg, borderRadius: 18, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.2, color: "var(--text-4)" }}>Сейчас · ровно</div>
            <div style={{ position: "relative", height: 10, borderRadius: 999, marginTop: 12, background: "linear-gradient(90deg, rgba(140,140,150,0.4), #EF9F14)" }}>
              <span style={{ position: "absolute", left: "58%", top: "50%", transform: "translate(-50%,-50%)", width: 22, height: 22, borderRadius: "50%", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.25), inset 0 0 0 0.5px rgba(0,0,0,0.06)" }} />
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 10, lineHeight: 1.45 }}>…и одна строка в дневник: «успел до работы, доволен собой»</div>
          </div>
        )}
        {body("Состояние и дневник", "Раз в день — один свайп «как ты?» и, если хочется, пара слов в дневник. Это твой личный срез дня: по нему ИИ подстраивает подсказки, а календарь показывает, как состояние связано с привычками.")}
      </div>

      {kicker("04", "День собран")}
      <div style={cardStyle}>
        {visWrap(
          <div style={{ width: "100%", maxWidth: 300 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              {[["Состояние", <I.Smile size={16} color="#0a0a0a" strokeWidth={2} />], ["Ход", <I.Check size={16} color="#0a0a0a" strokeWidth={2.6} />], ["Смысл", <I.Sparkles size={15} color="#0a0a0a" filled />]].map(function (r, i) {
                return (
                  <div key={i} style={{ borderRadius: 16, background: softBg, padding: "11px 6px", textAlign: "center", boxShadow: glass }}>
                    <span style={{ width: 30, height: 30, borderRadius: "50%", margin: "0 auto", display: "grid", placeItems: "center", background: "linear-gradient(135deg,#FEDE34,#EF9F14)", boxShadow: "0 4px 12px rgba(239,159,20,0.3)" }}>{r[1]}</span>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text)", marginTop: 7, whiteSpace: "nowrap" }}>{r[0]}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "center", marginTop: 11 }}>{goldPill("✦ День собран")}</div>
          </div>
        )}
        {body("День собран", "В конце дня три вещи складываются в одну: ты заметил состояние, сделал ход и добавил смысл (а когда рядом свои — отметился вместе). Это «День собран» — маленькая церемония завершённости, а не счётчик. Пропуск ничего не жжёт: завтра собираешь заново.")}
      </div>

          </React.Fragment>
        )}
      </div>

      {/* ── ЭТАП 2: ОПЫТ И УРОВНИ */}
      <div ref={function (el) { secRefs.current["level"] = el; }} style={{ scrollMarginTop: 64, marginTop: 12 }}>
        {stageHeader("level", "2", "Рост", "Как действия становятся уровнем, копилкой и достижениями.")}
        {openId === "level" && (
          <React.Fragment>

      {kicker("01", "Твой след")}
      <div style={cardStyle}>
        <div style={{ padding: "20px 16px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <button onClick={function () { if (!levelUp) { haptic("impact"); setLevelUp(true); markSeen("level"); } }} className="tap"
            style={{ border: 0, background: "transparent", cursor: "pointer", padding: 4 }}>
            {ring(96, levelUp ? 1 : (dayTapped ? 0.86 : 0.74), (
              <span style={{ position: "relative", width: 68, height: 68, borderRadius: "50%", background: chipBg, boxShadow: glass, display: "grid", placeItems: "center", fontSize: 32 }}>
                🙂
                <span key={levelUp ? "l2" : "l1"} style={{ position: "absolute", right: -4, bottom: -2, minWidth: 22, height: 22, borderRadius: 999, background: "linear-gradient(135deg,#FEDE34,#EF9F14)", color: "#0a0a0a", fontSize: 12, fontWeight: 800, display: "grid", placeItems: "center", padding: "0 5px", boxShadow: "0 0 0 2.5px var(--card)", animation: "bosMenuPop 0.3s ease" }}>{levelUp ? 2 : 1}</span>
              </span>
            ))}
          </button>
          <div style={{ fontSize: 11.5, color: "var(--text-4)", fontWeight: 600, textAlign: "center", minHeight: 15 }}>
            {levelUp ? "уровень вырос — навсегда" : (dayTapped ? "твои +10 уже в кольце — докрути до конца" : "коснись — заполни кольцо")}
          </div>
        </div>
        {body("Опыт и уровень", "Каждое действие — след того, что ты возвращаешься. Весь опыт стекается в золотое кольцо вокруг твоего лица: заполнилось — уровень вырос, навсегда. Он не обнуляется и не «сгорает по понедельникам». Уровень видят свои, а с 10 уровня он открывает «Людей». Партнёры не заперты — рады тебе с первого дня.")}
      </div>

      {kicker("02", "Две роли опыта")}
      <div style={cardStyle}>
        {visWrap(
          <div style={{ width: "100%", maxWidth: 300, display: "flex", gap: 10 }}>
            <div style={{ flex: 1, borderRadius: 16, background: softBg, padding: "13px 12px", boxShadow: glass }}>
              <div style={{ height: 26, display: "flex", alignItems: "center" }}><I.PersonRing size={24} color="#EF9F14" strokeWidth={1.7} /></div>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text)", marginTop: 6 }}>Уровень</div>
              <div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 3, lineHeight: 1.4 }}>путь — только растёт, не купить</div>
            </div>
            <div style={{ flex: 1, borderRadius: 16, background: softBg, padding: "13px 12px", boxShadow: glass }}>
              <div style={{ height: 26, display: "flex", alignItems: "center" }}><I.Wallet size={24} color="#EF9F14" strokeWidth={1.7} /></div>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text)", marginTop: 6 }}>Копилка</div>
              <div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 3, lineHeight: 1.4 }}>топливо — тратишь на настоящее</div>
            </div>
          </div>
        )}
        {body("Уровень и копилка", "У опыта две роли. Уровень — путь: сколько ты возвращался; он только растёт, его не купить — только прожить. Копилка — топливо: та часть опыта, что тратится на настоящее рядом и на помощь своих. Тратишь — копилка пустеет, а уровень стоит на месте и не падает.")}
      </div>

      {kicker("03", "След на пути")}
      <div style={cardStyle}>
        {visWrap(
          <div style={{ display: "flex", gap: 10 }}>
            {[["🌱", "Первый шаг", "#EF9F14"], ["🔥", "Неделя с собой", "#EF9F14"], ["🤝", "Не один", "#EF9F14"]].map(function (m, i) {
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 54, height: 54, borderRadius: "50%", background: "linear-gradient(160deg, " + m[2] + "33, " + m[2] + "14)", boxShadow: "inset 0 0 0 1.5px " + m[2] + "59, 0 6px 14px " + m[2] + "26", display: "grid", placeItems: "center", fontSize: 25 }}>{m[0]}</span>
                  <span style={{ fontSize: 10.5, color: "var(--text-4)", fontWeight: 600 }}>{m[1]}</span>
                </div>
              );
            })}
          </div>
        )}
        {body("Достижения", "Отмечают настоящие вехи: первую привычку, неделю с собой, первого рядом. Каждое — разовый бонус опыта и след на странице «Я». Коллекция — в «Я» → «Достижения».")}
      </div>

      {kicker("04", "Быстрый старт с бонусом")}
      <div style={cardStyle}>
        {visWrap(
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7, borderRadius: 999, padding: "8px 12px", background: chipBg, boxShadow: glass }}>
              <span style={{ fontSize: 15 }}>🚿</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Холодный душ · 7 дней</span>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: "#9a6800", background: "rgba(245,180,30,0.18)", borderRadius: 999, padding: "2px 6px" }}>+50 XP</span>
            </span>
            <span style={{ fontSize: 11.5, color: "var(--text-4)", fontWeight: 600 }}>лента челленджей — над «Привычками» и в «Найти»</span>
          </div>
        )}
        {body("Челленджи", "Готовые вызовы на несколько дней: тап — привычка создана, серия пошла. Дотянул до финиша — сверху бонус (+30…75 опыта). Пропустил день — бонус не сгорает: правило «ничего не жжётся» работает и тут.")}
      </div>

      {/* Точные цифры — свёрнутая полная таблица опыта (единственный канон, мастер-план §4). */}
      <button onClick={function () { haptic("selection"); setXpOpen(!xpOpen); }} className="tap" data-haptic="selection"
        style={{ width: "100%", border: 0, cursor: "pointer", textAlign: "left", marginTop: 16, borderRadius: 16, padding: "13px 15px", background: softBg, boxShadow: glass, color: "var(--text-2)", fontSize: 13.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>Точные цифры — вся таблица опыта</span>
        <span aria-hidden style={{ display: "grid", placeItems: "center", transition: "transform 0.22s", transform: xpOpen ? "rotate(90deg)" : "none" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
        </span>
      </button>
      {xpOpen && (
        <div style={{ ...cardStyle, marginTop: 8 }} className="bos-acc-in">
          <div style={{ padding: "14px 14px 4px", display: "flex", flexDirection: "column", gap: 7 }}>
            {[
              [<I.Check size={16} color="var(--text-2)" strokeWidth={2.3} />, "Отметка привычки · вместе", "+10 · +15"],
              [<I.Smile size={17} color="var(--text-2)" strokeWidth={1.7} />, "Состояние: отметка · неделя подряд", "+5 · +50"],
              [<I.Pencil size={15} color="var(--text-2)" strokeWidth={1.8} />, "Пара слов в дневник", "+10"],
              [<I.Sun size={16} color="#EF9F14" strokeWidth={1.8} />, "Идеальный день — все привычки", "+30"],
              [<I.Bolt size={16} color="#EF9F14" strokeWidth={1.7} />, "Финиш челленджа", "+30…75"],
              [<I.Trophy size={16} color="#EF9F14" strokeWidth={1.7} />, "Достижение", "разово"],
              [<I.Group size={17} color="var(--text-2)" strokeWidth={1.7} />, "Друг пришёл по ссылке", "+150"],
              [<I.Flag size={16} color="#EF9F14" strokeWidth={1.9} />, "Вехи своих · 3 / 7 / 15 / 30", "+300…3000"],
            ].map(function (r, i) {
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, background: softBg, borderRadius: 14, padding: "9px 11px" }}>
                  <span style={{ width: 30, height: 30, borderRadius: 10, background: chipBg, boxShadow: glass, display: "grid", placeItems: "center", flexShrink: 0 }}>{r[0]}</span>
                  <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: "var(--text)" }}>{r[1]}</span>
                  {goldPill(r[2] === "разово" ? "разово" : (r[2] + " XP"))}
                </div>
              );
            })}
          </div>
          {body("Всё честно", "Тот же список чисел, что в самой игре — без скрытых умножителей. Самое ценное здесь — свои: позвать своего даёт больше, чем неделя отметок, потому что вместе вы удержитесь оба.")}
        </div>
      )}

          </React.Fragment>
        )}
      </div>

      {/* ── ЭТАП 3: ВМЕСТЕ */}
      <div ref={function (el) { secRefs.current["together"] = el; }} style={{ scrollMarginTop: 64, marginTop: 12 }}>
        {stageHeader("together", "3", "Свои", "Круги, свои и общие привычки — чтобы не тянуть одному.")}
        {openId === "together" && (
          <React.Fragment>

      {kicker("01", "Одна орбита")}
      <div style={cardStyle}>
        <div style={{ padding: "12px 16px 0", display: "flex", justifyContent: "center" }}>
          <div style={{ position: "relative" }}>
            {(typeof GoalOrbitMini === "function") ? (
              <GoalOrbitMini centerEmoji="🌅" centerColor={null}
                habits={[{ emoji: "🤸", color: "#EF9F14", done: true }, { emoji: "📖", color: "#8E8E93" }]}
                people={invited
                  ? [{ avatar: "emoji:🦊", name: "", active: true }, { avatar: "emoji:🐱", name: "", active: true }]
                  : [{ avatar: "emoji:🦊", name: "", active: true }]}
                size={168} dark={isDark} />
            ) : <span style={{ fontSize: 44 }}>🌅</span>}
            {invited && <span style={{ position: "absolute", top: -2, right: -6, animation: "bosXpPop 2.6s ease forwards" }}>{goldPill("✦ +15 вместе")}</span>}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 16px 0" }}>
          {!invited
            ? <button onClick={function () { haptic("impact"); setInvited(true); markSeen("together"); }} className="tap" data-haptic="selection"
                style={{ border: 0, cursor: "pointer", borderRadius: 999, padding: "9px 16px", background: chipBg, boxShadow: glass, fontSize: 13, fontWeight: 700, color: "var(--text)" }}>👋 Позвать своего</button>
            : <span style={{ fontSize: 12, color: "var(--text-4)", fontWeight: 600 }}>второй на орбите — вместе +15 за отметку</span>}
        </div>
        {body("Совместные цели и привычки", "Любую привычку можно вести вдвоём — вы видите отметки друг друга. А цель — целым кругом: общий счёт, лица на одной орбите. Привычка круга приходит к тебе как личная: отметка где угодно попадает в общий журнал.")}
      </div>

      {kicker("02", "Правила круга")}
      <div style={cardStyle}>
        <div style={{ padding: "16px 16px 2px", display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            [<I.Person filled size={17} color="var(--text-2)" strokeWidth={1.7} />, "Условия задаёт создатель", "Привычки круга — его правила игры; участник их не удаляет."],
            [<I.Minus size={18} color="var(--text-2)" strokeWidth={2} />, "«Убрать с моей страницы»", "Не хочешь вести у себя — убери; история и опыт целы, в круге всё остаётся."],
            [<I.Refresh size={16} color="var(--text-2)" strokeWidth={1.8} />, "«Вернуть к себе»", "Передумал — на странице круга одна кнопка возвращает привычку."],
          ].map(function (r, i) {
            return (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", background: softBg, borderRadius: 16, padding: "11px 12px" }}>
                <span style={{ width: 34, height: 34, borderRadius: 11, background: chipBg, boxShadow: glass, display: "grid", placeItems: "center", flexShrink: 0 }}>{r[0]}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>{r[1]}</div>
                  <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2, lineHeight: 1.45 }}>{r[2]}</div>
                </div>
              </div>
            );
          })}
        </div>
        {body("Кто за что отвечает", "Круг — как поход с тренером: маршрут задаёт ведущий, а идёте вы все вместе. Выйти из круга можно всегда — это отдельное действие на его плитке, и твоя история остаётся с тобой.")}
      </div>

      {kicker("03", "Живой пульс круга")}
      <div style={cardStyle}>
        {visWrap(
          <div style={{ width: "100%", maxWidth: 300, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <span style={{ width: 28, height: 28, borderRadius: "50%", background: chipBg, boxShadow: glass, display: "grid", placeItems: "center", fontSize: 14, flexShrink: 0 }}>🦊</span>
              <span style={{ background: softBg, borderRadius: "16px 16px 16px 5px", padding: "9px 12px", fontSize: 13, color: "var(--text)", maxWidth: "75%" }}>Я сегодня успел до работы! 💪</span>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <span style={{ background: isDark ? "#f2f2f5" : "#0a0a0a", color: isDark ? "#0a0a0a" : "#fff", borderRadius: "16px 16px 5px 16px", padding: "9px 12px", fontSize: 13, maxWidth: "75%" }}>Горжусь! Я вечером 🌙</span>
            </div>
            <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
              <span style={{ position: "relative", width: 38, height: 38, borderRadius: "50%", background: chipBg, boxShadow: glass, display: "grid", placeItems: "center" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10 21a2 2 0 0 0 4 0" /></svg>
                <span style={{ position: "absolute", top: 2, right: 2, width: 9, height: 9, borderRadius: "50%", background: "#FF3B30", border: "2px solid var(--card)" }} />
              </span>
            </div>
          </div>
        )}
        {body("Чат и уведомления", "В каждом круге — живой чат: сообщения долетают мгновенно, можно кидать фото. А колокольчик на главной собирает всё важное: заявки в твои круги, «друг присоединился к привычке», новые сообщения. Внутри приложения — и никакого спама в Telegram.")}
      </div>

      {kicker("04", "Твои люди")}
      <div style={cardStyle}>
        {visWrap(
          <div style={{ width: "100%", maxWidth: 300, background: "linear-gradient(135deg,#FEDE34,#EF9F14)", borderRadius: 18, padding: "13px 14px", color: "#0a0a0a", boxShadow: "0 8px 22px rgba(239,159,20,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 7 }}>
              <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.3, opacity: 0.62 }}>Веха · +300 XP бонусом</span>
              <span style={{ fontSize: 11.5, fontWeight: 700, opacity: 0.8 }}>2 из 3</span>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {[0, 1, 2].map(function (j) { return <span key={j} style={{ flex: 1, height: 6, borderRadius: 999, background: j < 2 ? "#0a0a0a" : "rgba(10,10,10,0.18)" }} />; })}
            </div>
          </div>
        )}
        {body("Друзья и вехи", "Каждый, кто придёт по твоей ссылке, встаёт на твою орбиту на «Я» — и приносит +150 XP. А вехи добавляют сверху: 3 друга → +300, 7 → +700, 15 → +1500, 30 → +3000. В «Друзьях» видно живой прогресс до следующей.")}
      </div>

          </React.Fragment>
        )}
      </div>

      {/* ── ЭТАП 4: МИР */}
      <div ref={function (el) { secRefs.current["world"] = el; }} style={{ scrollMarginTop: 64, marginTop: 12 }}>
        {stageHeader("world", "4", "Мир", "Партнёры, Люди и места — куда ведёт твой ритм.")}
        {openId === "world" && (
          <React.Fragment>

      {kicker("01", "Куда тратить")}
      <div style={cardStyle}>
        {visWrap(
          <button onClick={function () { if (!stamped) { haptic("impact"); setStamped(true); markSeen("world"); } }} className="tap"
            style={{ position: "relative", width: "100%", maxWidth: 300, borderRadius: 18, overflow: "hidden", border: 0, cursor: "pointer", textAlign: "left", background: "linear-gradient(135deg,#FEDE34,#EF9F14)", boxShadow: "0 10px 26px rgba(239,159,20,0.35)", padding: "14px 16px", color: "#0a0a0a" }}>
            <span aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 85% 10%, rgba(255,255,255,0.45) 0%, transparent 55%)", pointerEvents: "none" }} />
            {stamped && <span aria-hidden style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 55, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.75), transparent)", animation: "bosShine 1.1s ease-out forwards", pointerEvents: "none" }} />}
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.4, color: "rgba(10,10,10,0.62)" }}>Партнёрский билет</div>
                <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.3px", marginTop: 3 }}>100 XP → тренировка</div>
              </div>
              <span style={{ fontSize: 10.5, fontWeight: 800, background: "rgba(10,10,10,0.85)", color: "#FEDE34", borderRadius: 999, padding: "4px 9px" }}>{stamped ? "готово" : "скоро"}</span>
            </div>
            <div aria-hidden style={{ position: "relative", borderTop: "2px dashed rgba(10,10,10,0.25)", margin: "12px -16px 0" }} />
            <div style={{ position: "relative", fontSize: 11.5, fontWeight: 600, marginTop: 9, color: "rgba(10,10,10,0.72)" }}>{stamped ? "код BAL-2481 — предъяви в зале" : "коснись — обменяй копилку на живое"}</div>
          </button>
        )}
        {body("Партнёры", "Опыт — не просто цифры: копилка меняется на настоящее рядом — тренировки, разборы, практики. С первого дня, и уровень от траты не падает. Это главная история Balance: «сходил на бокс за привычки». Партнёром может стать любой — это уровень и доверие, а не должность. Билет с кодом уже в работе.")}
      </div>

      {kicker("02", "Люди по делам")}
      <div style={cardStyle}>
        <div style={{ padding: "18px 16px 2px" }}>
          <div style={{ position: "relative", borderRadius: 18, background: softBg, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 9 }}>
            {[[<I.Group size={17} color="var(--text-2)" strokeWidth={1.7} />, "Похожая структура привычек"], [<I.Flame size={16} color="var(--text-2)" strokeWidth={1.8} />, "Такой же ритм — спорт по утрам"]].map(function (r, i) {
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, filter: "blur(3.5px)", opacity: 0.6 }}>
                  <span style={{ width: 34, height: 34, borderRadius: "50%", background: chipBg, boxShadow: glass, display: "grid", placeItems: "center" }}>{r[0]}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>{r[1]}</span>
                </div>
              );
            })}
            <span style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", display: "inline-flex", alignItems: "center", gap: 6, background: isDark ? "rgba(28,28,30,0.92)" : "rgba(255,255,255,0.95)", boxShadow: "0 8px 24px rgba(0,0,0,0.18)", borderRadius: 999, padding: "8px 14px", fontSize: 12.5, fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap" }}><I.Lock size={13} color="var(--text)" strokeWidth={1.8} /> Откроется с 10 уровня</span>
          </div>
        </div>
        {body("Люди", "С 10 уровня открываются «Люди» — помощь по делам: кто чем живёт, у кого какой ритм, к кому пойти за практикой или разбором. XP здесь — знак намерения, не деньги: записался — опыт уходит из копилки, но уровень не падает. Уровень не купить — только прожить.")}
      </div>

      {kicker("03", "Самое большое")}
      <div style={cardStyle}>
        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ position: "relative", borderRadius: 18, overflow: "hidden", background: "linear-gradient(160deg, #16161c 0%, #0a0a0c 100%)", height: 150 }}>
            {[[12, 18, 2.5], [30, 64, 2], [48, 30, 3], [66, 74, 2], [82, 22, 2.5], [90, 58, 2], [22, 82, 2], [58, 12, 2], [74, 44, 2.5], [8, 52, 2], [40, 90, 2], [95, 86, 2]].map(function (d, i) {
              var gold = i % 3 === 0;
              return <span key={i} aria-hidden style={{ position: "absolute", left: d[0] + "%", top: d[1] + "%", width: d[2], height: d[2], borderRadius: "50%", background: gold ? "#FEDE34" : "rgba(255,255,255,0.85)", boxShadow: gold ? "0 0 6px rgba(254,222,52,0.85)" : "0 0 5px rgba(255,255,255,0.6)" }} />;
            })}
            {[[24, 34, 34, "🙂"], [56, 58, 42, "😎"], [78, 26, 30, "🐱"]].map(function (d, i) {
              return (
                <span key={"d" + i} style={{ position: "absolute", left: d[0] + "%", top: d[1] + "%", width: d[2], height: d[2], borderRadius: "50%", background: "linear-gradient(165deg, rgba(255,255,255,0.35), rgba(255,255,255,0.08) 55%), rgba(255,255,255,0.14)", boxShadow: "inset 0 1px 0.5px rgba(255,255,255,0.4), 0 6px 18px rgba(0,0,0,0.35)", display: "grid", placeItems: "center", fontSize: d[2] * 0.5 }}>{d[3]}</span>
              );
            })}
            <span style={{ position: "absolute", left: 12, bottom: 10, fontSize: 11, fontWeight: 700, letterSpacing: 0.3, color: "rgba(255,255,255,0.72)" }}>Вселенная · все системы</span>
          </div>
        </div>
        {body("Вселенная", "Каждый в Balance — своя система: человек в центре, привычки — планеты на орбитах. «Вселенная» на странице «Я» показывает всех — анонимно, как звёзды ночного неба: имён не видно, но видно, сколько вокруг живого. Ты уже среди этих звёзд.")}
      </div>

          </React.Fragment>
        )}
      </div>

      <div style={{ marginTop: 26 }}>
        {allSeen ? (
          <div style={{ ...cardStyle, padding: "22px 18px 20px", textAlign: "center", position: "relative" }} className="bos-acc-in">
            <span aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#FEDE34,#EF9F14)" }} />
            <div style={{ display: "flex", justifyContent: "center", lineHeight: 1 }}><I.Sparkles size={34} color="#EF9F14" filled strokeWidth={1.4} /></div>
            <div style={{ fontFamily: "var(--bos-title-font)", fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", color: "var(--text)", marginTop: 8 }}>Ты знаешь, как устроен Balance</div>
            <div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 6, lineHeight: 1.5, maxWidth: 300, margin: "6px auto 0" }}>Собрал день, нашёл своих, увидел живой мир вокруг. Дальше — не читать, а сделать. С малого.</div>
          </div>
        ) : (
          <div style={{ ...cardStyle, padding: "18px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>Собираешь картину · {seenCount} из 4</div>
            <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 11 }}>
              {ACTS.map(function (k) { return <span key={k} style={{ width: 22, height: 6, borderRadius: 999, background: seen[k] ? "linear-gradient(135deg,#FEDE34,#EF9F14)" : (isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)") }} />; })}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 11, lineHeight: 1.45 }}>Открой каждый раздел и потрогай, как он живёт — внизу появится первый ход.</div>
          </div>
        )}
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          {allSeen && guideAction(<I.Check size={17} color="#0a0a0a" strokeWidth={2.4} />, "Сделать первый ход", hasHabits ? "на «Привычки» — отметить сегодня" : "создать первую привычку", "habits", null, true)}
          <button onClick={function () { navigate("ai-chat", { prompt: "Объясни, как устроен Balance и с чего мне лучше начать" }); }} className="tap" style={{ width: "100%", border: 0, borderRadius: 999, padding: 15, background: softBg, color: "var(--text-2)", fontSize: 13.5, fontWeight: 700, cursor: "pointer", boxShadow: glass }}><span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}><I.Sparkles size={15} color="var(--text-3)" strokeWidth={1.7} /> Остались вопросы — спроси Balance AI ›</span></button>
        </div>
      </div>
    </div>
  );
}

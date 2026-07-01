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
// XP-бонус за ЗАВЕРШЕНИЕ курируемого челленджа (David: «бонус в конце, когда закрыл срок, не на старте»).
// Привычка/цель/команда, созданная из челленджа, несёт метку challenge {key,bonus,days}. Начисляем бонус
// УНИКАЛЬНОГО ключа ТОЛЬКО когда челлендж закрыт: привычка — набрано `days` отметок (устойчиво к пропуску,
// не как current-серия); цель/команда — достигнут target. Дедуп по key (нельзя нафармить пересозданием).
// Derived, как весь XP — но пока срок не закрыт, бонуса нет. Значения задаёт CHALLENGE_STARTERS.
function bosChallengeBonusXPLive(app) {
  if (!app) return 0;
  var byKey = {};
  function note(c, done) { if (!c || !c.key) return; if (!byKey[c.key]) byKey[c.key] = { bonus: c.bonus | 0, done: false }; if (done) byKey[c.key].done = true; }
  (app.habits || []).forEach(function (h) {
    var c = h && h.challenge; if (!c) return;
    var need = c.days | 0, got = 0, log = h.log || {};
    for (var d in log) { if (log[d]) got++; }
    note(c, need > 0 ? (got >= need) : !!h.done);
  });
  (app.goals || []).forEach(function (g) { var c = g && g.challenge; note(c, !!(c && g.target > 0 && (g.current || 0) >= g.target)); });
  (app.teams || []).forEach(function (t) { var c = t && t.challenge; note(c, !!(c && t.target > 0 && (t.current || 0) >= t.target)); });
  var sum = 0; for (var k in byKey) { if (byKey[k].done) sum += byKey[k].bonus; }
  return sum;
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
  { id: "team",        i: "🤝", t: "Не один",            d: "Собрал команду или позвал друга",              xp: 100,  accent: "#5FA8FF", how: "Создай команду или пригласи друга",       test: function (c) { return c.teams >= 1 || c.friends >= 1; } },
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

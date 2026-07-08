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

/* ── ГИД «Как устроен Balance» 2.0 (v535, David: «глубже, больше и ещё интереснее — много
   функционала не успевает проявиться») — LIVE-переопределение маршрута guide (демо цело).
   12 глав в ЧЕТЫРЁХ разделах-лестнице: Каждый день → Рост → Вместе → Мир. Все цифры
   НАСТОЯЩИЕ (+10/+30/+150, вехи 3/7/15/30, пороги 10/15 ур.) — это те же числа, что в
   экономике. Иллюстрации — рисунки мануала в языке приложения (орбиты, стекло, золото). */
function GuideLive() {
  var nav = (typeof useNav === "function") ? useNav() : {};
  var navigate = nav.navigate || function () {};
  var params = nav.params || {};
  var app = (typeof useApp === "function") ? useApp() : null;
  var isDark = !!(app && app.themeOverride === "dark");
  var back = function () { navigate(params.from || "profile"); };
  var sheen = (typeof BOS_TILE_SHEEN !== "undefined") ? BOS_TILE_SHEEN + ", " : "";
  var glass = (typeof bosTileGlass === "function") ? bosTileGlass(isDark) : "none";
  var softBg = isDark ? "rgba(255,255,255,0.055)" : "rgba(255,255,255,0.72)";
  var quietBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.035)";
  var border = isDark ? "rgba(255,255,255,0.10)" : "rgba(10,14,24,0.07)";
  var muted = "var(--text-3)";
  var faint = "var(--text-4)";
  var titleFont = "var(--bos-title-font)";
  var card = { background: "var(--card)", borderRadius: 26, boxShadow: "var(--card-shadow)", overflow: "hidden" };
  var sectionLabel = function (t) {
    return <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.25, textTransform: "uppercase", color: faint, marginBottom: 8 }}>{t}</div>;
  };
  var copyBlock = function (title, text, compact) {
    return (
      <div style={{ padding: compact ? "0" : "16px 16px 0" }}>
        <div style={{ fontFamily: titleFont, fontSize: compact ? 18 : 20, fontWeight: 800, letterSpacing: "-0.45px", lineHeight: 1.12, color: "var(--text)" }}>{title}</div>
        <div style={{ marginTop: 7, fontSize: compact ? 13 : 13.5, lineHeight: 1.55, color: muted }}>{text}</div>
      </div>
    );
  };
  var steps = [
    ["01", "Собери день", "Отметь состояние и закрой одно реальное действие: привычку, цель или короткую запись. Этого достаточно, чтобы система поняла твой сегодняшний ритм."],
    ["02", "Удержи ритм", "Повтор нужен не ради идеального календаря. Он помогает видеть, что возвращает тебя к себе без вины и давления."],
    ["03", "Найди своих", "Когда появляется ритм, проще понять, какие круги, люди и форматы тебе подходят: спорт, восстановление, обучение, дела."],
    ["04", "Выходи в жизнь", "Сообщество и партнёры — не отдельная лента. Это слой вокруг твоего ритма: практики, места и помощь, которые можно применить в реальности."],
  ];
  var detail = [
    ["Первый ход", "Состояние + одно действие. Не надо изучать всё приложение, чтобы начать."],
    ["Прогресс", "XP — видимый след. Уровень показывает устойчивость, но не заменяет смысл."],
    ["Люди", "Круги помогают держаться дольше, чем в одиночку, без публичной гонки."],
    ["Мир", "Практики, места и партнёры появляются там, где уже есть ритм и доверие."],
  ];
  var stepCard = function (s, i) {
    var last = i === steps.length - 1;
    return (
      <div key={s[0]} style={{ position: "relative", display: "flex", gap: 14, padding: last ? "0 0 2px" : "0 0 18px" }}>
        {!last && <span aria-hidden style={{ position: "absolute", left: 20, top: 44, bottom: -2, width: 1, background: isDark ? "rgba(255,255,255,0.10)" : "rgba(10,14,24,0.08)" }} />}
        <span style={{ position: "relative", zIndex: 1, width: 40, height: 40, borderRadius: 15, display: "grid", placeItems: "center", flexShrink: 0, background: i === 0 ? "linear-gradient(135deg,#FEDE34,#EF9F14)" : softBg, color: i === 0 ? "#111" : "var(--text)", boxShadow: i === 0 ? "0 9px 22px rgba(239,159,20,0.25)" : glass, fontSize: 12, fontWeight: 850, fontVariantNumeric: "tabular-nums" }}>{s[0]}</span>
        <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
          <div style={{ fontFamily: titleFont, fontSize: 18, fontWeight: 800, letterSpacing: "-0.35px", color: "var(--text)", lineHeight: 1.16 }}>{s[1]}</div>
          <div style={{ marginTop: 5, fontSize: 13.3, lineHeight: 1.52, color: muted }}>{s[2]}</div>
        </div>
      </div>
    );
  };
  var detailCard = function (d) {
    return (
      <div key={d[0]} style={{ borderRadius: 20, padding: "13px 14px", background: quietBg, boxShadow: "inset 0 0 0 1px " + border }}>
        <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.15px", color: "var(--text)" }}>{d[0]}</div>
        <div style={{ marginTop: 4, fontSize: 12.7, lineHeight: 1.45, color: faint }}>{d[1]}</div>
      </div>
    );
  };
  var finishButton = function (label, sub, onClick, strong) {
    return (
      <button onClick={onClick} className="tap" data-haptic="selection"
        style={{ width: "100%", border: 0, cursor: "pointer", textAlign: "left", borderRadius: 20, padding: "14px 15px", display: "flex", alignItems: "center", gap: 12,
          background: strong ? "var(--cta, #0a0a0a)" : quietBg, color: strong ? "var(--cta-ink, #fff)" : "var(--text)", boxShadow: strong ? "0 10px 26px rgba(0,0,0,0.14)" : "inset 0 0 0 1px " + border }}>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 14, fontWeight: 800, letterSpacing: "-0.1px" }}>{label}</span>
          {sub && <span style={{ display: "block", marginTop: 3, fontSize: 12, lineHeight: 1.35, color: strong ? "rgba(255,255,255,0.68)" : faint }}>{sub}</span>}
        </span>
        <span aria-hidden style={{ fontSize: 18, opacity: 0.55 }}>›</span>
      </button>
    );
  };
  return (
    <div className="page-in" style={{ padding: "0 16px 28px" }}>
      <PageHeader title="Как работает Balance" onBack={back} />

      <section style={{ ...card, position: "relative", marginTop: 8, padding: "22px 18px 20px", background: isDark ? "linear-gradient(160deg,#111827 0%,#090d16 100%)" : "linear-gradient(160deg,#ffffff 0%,#f7f3e7 100%)" }}>
        <div aria-hidden style={{ position: "absolute", right: -44, top: -54, width: 156, height: 156, borderRadius: "50%", background: "radial-gradient(circle,rgba(254,222,52,0.42),rgba(254,222,52,0.10) 45%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, borderRadius: 999, padding: "6px 10px", background: quietBg, boxShadow: "inset 0 0 0 1px " + border, color: faint, fontSize: 11.5, fontWeight: 800, letterSpacing: 0.7, textTransform: "uppercase" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#7ED2A8", boxShadow: "0 0 10px rgba(126,210,168,0.75)" }} />
            гайд за 2 минуты
          </div>
          <div style={{ marginTop: 16, maxWidth: 470 }}>
            <div style={{ fontFamily: titleFont, fontSize: 31, lineHeight: 1.02, fontWeight: 900, letterSpacing: "-1.05px", color: "var(--text)" }}>Сначала день — потом свои</div>
            <div style={{ marginTop: 10, fontSize: 14.5, lineHeight: 1.52, color: muted }}>Balance не заставляет изучать все разделы сразу. Он показывает один понятный путь: собрать день, удержать ритм и постепенно найти людей, практики и места рядом.</div>
          </div>
          <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 6 }}>
            {["День", "Ритм", "Свои", "Места"].map(function (t, i) {
              return <div key={t} style={{ borderRadius: 16, padding: "9px 6px", textAlign: "center", background: i === 0 ? "rgba(254,222,52,0.28)" : quietBg, boxShadow: "inset 0 0 0 1px " + border }}><div style={{ fontSize: 11.5, fontWeight: 850, color: "var(--text)" }}>{t}</div></div>;
            })}
          </div>
        </div>
      </section>

      <section style={{ ...card, marginTop: 12, padding: "18px 16px 16px" }}>
        {sectionLabel("суть")}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {steps.map(stepCard)}
        </div>
      </section>

      <section style={{ ...card, marginTop: 12, padding: "17px 16px" }}>
        {copyBlock("Сначала смысл — потом действие", "Все переходы собраны в конце. Можно спокойно дочитать систему, не теряя место и не проваливаясь в другой раздел.", true)}
      </section>

      <section style={{ marginTop: 22 }}>
        <div style={{ padding: "0 4px 10px" }}>
          {sectionLabel("если хочется подробнее")}
          <div style={{ fontFamily: titleFont, fontSize: 22, fontWeight: 850, letterSpacing: "-0.55px", color: "var(--text)" }}>Четыре слоя системы</div>
          <div style={{ marginTop: 6, fontSize: 13.2, lineHeight: 1.5, color: muted }}>Это не меню и не обязательный маршрут. Просто короткая карта: что в приложении за что отвечает.</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {detail.map(detailCard)}
        </div>
      </section>

      <section style={{ ...card, marginTop: 22, padding: "18px 16px 16px" }}>
        {sectionLabel("дальше")}
        <div style={{ fontFamily: titleFont, fontSize: 22, fontWeight: 850, letterSpacing: "-0.55px", color: "var(--text)", lineHeight: 1.12 }}>Теперь можно вернуться</div>
        <div style={{ marginTop: 7, fontSize: 13.2, lineHeight: 1.5, color: muted }}>Когда захочешь действовать — начни с одного дня. Гайд останется здесь, его не нужно дочитывать заново.</div>
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          {finishButton("Готово — вернуться", params.from === "community" ? "назад в Сообщество" : "назад в приложение", back, true)}
          {finishButton("Спросить Balance AI", "если хочется, чтобы он объяснил с твоего контекста", function () { navigate("ai-chat", { prompt: "Объясни, как устроен Balance и с чего мне лучше начать" }); }, false)}
        </div>
      </section>
    </div>
  );
}

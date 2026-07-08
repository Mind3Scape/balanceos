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
  var _oi = React.useState(params.tab && params.tab !== "suti" ? params.tab : null);
  var openId = _oi[0], setOpenId = _oi[1];
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
    return <span style={{ display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 800, color: "#0a0a0a", background: "linear-gradient(135deg,#FEDE34,#EF9F14)", padding: "3px 9px", borderRadius: 999, boxShadow: "0 4px 12px rgba(239,159,20,0.35)", whiteSpace: "nowrap" }}>{txt}</span>;
  };
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
    var steps = [["✓", "День", "собран"], ["🔁", "Ритм", "держится"], ["👥", "Свои", "рядом"], ["📍", "Места", "вживую"]];
    return (
      <div style={{ width: "100%", maxWidth: 360, borderRadius: 20, padding: "13px 12px", background: softBg, boxShadow: glass }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1.1, textTransform: "uppercase", color: "var(--text-4)", marginBottom: 10 }}>основной путь</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 6 }}>
          {steps.map(function (s, i) {
            return (
              <div key={s[1]} style={{ position: "relative", minWidth: 0, borderRadius: 15, padding: "9px 5px 8px", background: chipBg, boxShadow: glass, textAlign: "center" }}>
                {i < steps.length - 1 && <span aria-hidden style={{ position: "absolute", right: -7, top: 27, color: "var(--text-4)", opacity: 0.5, fontSize: 12, zIndex: 2 }}>→</span>}
                <div style={{ fontSize: 19, lineHeight: 1 }}>{s[0]}</div>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: "var(--text)", marginTop: 6, letterSpacing: "-0.15px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s[1]}</div>
                <div style={{ fontSize: 9.5, color: "var(--text-4)", marginTop: 2, lineHeight: 1.18 }}>{s[2]}</div>
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
    if (id !== "suti") setOpenId(id);
    setTimeout(function () { var el = secRefs.current[id]; if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "start" }); }, 70);
  };
  // Свёрнутый заголовок этапа-«уровня»: номер-чип + название + подзаголовок + шеврон.
  var stageHeader = function (id, n, title, sub) {
    var open = openId === id;
    return (
      <button onClick={function () { var willOpen = !open; setOpenId(willOpen ? id : null); if (willOpen) setTimeout(function () { var el = secRefs.current[id]; if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "start" }); }, 70); }}
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
      <PageHeader title="Как работает Balance" onBack={back} />
      {/* Липкое быстрое меню-прыжок (David: «наверху меню из пилюль, скролл по категориям»).
          Тап = раскрыть этап + доскроллить к нему. Матовое стекло, чтобы не спорить с фоном. */}
      <div style={{ position: "sticky", top: 0, zIndex: 6, margin: "2px -16px 4px", padding: "8px 16px", background: isDark ? "rgba(18,18,20,0.72)" : "rgba(244,244,247,0.72)", backdropFilter: "saturate(180%) blur(18px)", WebkitBackdropFilter: "saturate(180%) blur(18px)" }}>
        <div className="bos-hscroll" style={{ display: "flex", gap: 7, overflowX: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch", touchAction: "pan-x" }}>
          {[["suti", "Старт"], ["day", "Ход"], ["level", "Прогресс"], ["together", "Люди"], ["world", "Мир"]].map(function (p) {
            var on = openId ? (openId === p[0]) : (p[0] === "suti");
            var g = (!on && typeof bosChipGlass === "function") ? bosChipGlass(isDark) : {};
            return (
              <button key={p[0]} onClick={function () { goTo(p[0]); }} className="tap" data-haptic="selection"
                style={{ border: 0, cursor: "pointer", borderRadius: 999, padding: "8px 14px", fontSize: 13.5, fontWeight: 600, flexShrink: 0, whiteSpace: "nowrap", transition: "background 0.2s, color 0.2s", ...g, background: on ? "var(--cta, #0a0a0a)" : g.background, color: on ? "var(--cta-ink, #fff)" : "var(--text-2)" }}>{p[1]}</button>
            );
          })}
        </div>
      </div>

      {/* ── СУТЬ — всегда открыта: объясняем путь от собранного дня к людям и местам. */}
      <div ref={function (el) { secRefs.current["suti"] = el; }} style={{ scrollMarginTop: 64 }}>
          {tabIntro("От дня к своим", "Сначала ты собираешь день: отмечаешь состояние, закрываешь привычку или цель. Так появляется ритм. По ритму Balance подсказывает круги, людей, практики и места рядом.", true)}

          <div style={{ ...cardStyle, marginTop: 14 }}>
            {visWrap(pathLoop(), "18px 14px 4px")}
            {body("Сначала — собрать день", "Не нужно проходить всё приложение. Отметь состояние, закрой одно действие или цель — этого достаточно, чтобы увидеть следующий шаг: круг, практику или место рядом.")}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
            {guideAction("◎", "Отметить состояние", "первый шаг", "home", null, true)}
            {guideAction("✅", "К привычкам", "создать или отметить", "habits", null, false)}
          </div>

          {kicker("01", "Что делать")}
          <div style={cardStyle}>
            <div style={{ padding: "16px 16px 2px", display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                ["◎", "Отметь состояние", "Понять, с чего начинать день."],
                ["✅", "Закрой одно действие", "Привычка или цель превращают план в ритм."],
                ["👥", "Найди своих", "Круги помогают держаться дольше, чем в одиночку."],
                ["📍", "Выходи в жизнь", "Практики и места появляются там, где есть ритм."],
              ].map(function (r, i) {
                return (
                  <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", background: softBg, borderRadius: 16, padding: "11px 12px" }}>
                    <span style={{ width: 34, height: 34, borderRadius: 11, background: chipBg, boxShadow: glass, display: "grid", placeItems: "center", fontSize: 16, flexShrink: 0 }}>{r[0]}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>{r[1]}</div>
                      <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2, lineHeight: 1.45 }}>{r[2]}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            {body("Без давления", "Пауза не ломает прогресс. Balance просто помогает вернуться к дню, ритму и людям, с которыми легче продолжать.")}
          </div>

          {kicker("02", "Как всё связано")}
          <div style={cardStyle}>
            {visWrap(pathLoop(), "18px 14px 4px")}
            {body("XP — только след", "XP показывает, что ты возвращаешься к системе. Главное — ритм: он помогает открыть круги, практики и людей, которые подходят твоему дню.")}
          </div>
      </div>

      {/* ── ЭТАП 1: КАЖДЫЙ ДЕНЬ (свёрнут по умолчанию) */}
      <div ref={function (el) { secRefs.current["day"] = el; }} style={{ scrollMarginTop: 64, marginTop: 12 }}>
        {stageHeader("day", "1", "Первый ход", "Что делать сегодня: состояние, привычка, серия.")}
        {openId === "day" && (
          <React.Fragment>

      {kicker("01", "Самое маленькое")}
      <div style={cardStyle}>
        {visWrap(
          <div style={{ position: "relative", width: "100%", maxWidth: 300 }}>
            <div style={{ background: softBg, borderRadius: 18, padding: "13px 14px", display: "flex", alignItems: "center", gap: 12 }}>
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
        )}
        {body("Отметка", "Сделал дело — коснулся плитки, вот и вся церемония. Каждая отметка даёт +10 XP. Отметить можно где угодно: на главной, на «Привычках», внутри цели или круга — это ОДИН и тот же журнал.")}
      </div>

      {kicker("02", "Ритм недели")}
      <div style={cardStyle}>
        {visWrap(
          <div style={{ width: "100%", maxWidth: 300 }}>
            <div style={{ background: softBg, borderRadius: 18, padding: "13px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Эта неделя</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 700, color: "#E8590C" }}>🔥 серия 6 дн.</span>
              </div>
              <div style={{ display: "flex", gap: 6, justifyContent: "space-between" }}>
                {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map(function (d, i) {
                  var on = i < 4;
                  return (
                    <div key={d} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 26, height: 26, borderRadius: "50%", background: on ? "#34C759" : (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"), boxShadow: on ? "0 3px 8px rgba(52,199,89,0.35)" : "none" }} />
                      <span style={{ fontSize: 9.5, color: "var(--text-4)", fontWeight: 600 }}>{d}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>{goldPill("✦ весь день закрыт · +30 XP")}</div>
          </div>
        )}
        {body("Серия и «день закрыт»", "Отмечаешься день за днём — на плитке растёт огонёк серии 🔥. Закрыл ВСЕ привычки дня — сверху падает +30 XP. И главное правило: пропуск НИЧЕГО не сжигает — ни уровень, ни опыт. Просто продолжай со следующего дня.")}
      </div>

      {kicker("03", "Как ты?")}
      <div style={cardStyle}>
        {visWrap(
          <div style={{ width: "100%", maxWidth: 300, background: softBg, borderRadius: 18, padding: "14px 16px" }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1.1, textTransform: "uppercase", color: "var(--text-4)" }}>Сейчас · ◎ ровно</div>
            <div style={{ position: "relative", height: 10, borderRadius: 999, marginTop: 12, background: "linear-gradient(90deg,#8FB4E8,#7ED2A8,#FEDE6B,#F5A46B)" }}>
              <span style={{ position: "absolute", left: "58%", top: "50%", transform: "translate(-50%,-50%)", width: 22, height: 22, borderRadius: "50%", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.25), inset 0 0 0 0.5px rgba(0,0,0,0.06)" }} />
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 10, lineHeight: 1.45 }}>…и одна строка в дневник: «успел до работы, доволен собой»</div>
          </div>
        )}
        {body("Состояние и дневник", "Раз в день — один свайп «как ты?» и, если хочется, пара слов в дневник. Это твой личный срез дня: по нему ИИ подстраивает подсказки, а календарь показывает, как состояние связано с привычками.")}
      </div>

          </React.Fragment>
        )}
      </div>

      {/* ── ЭТАП 2: ОПЫТ И УРОВНИ */}
      <div ref={function (el) { secRefs.current["level"] = el; }} style={{ scrollMarginTop: 64, marginTop: 12 }}>
        {stageHeader("level", "2", "XP и уровни", "Видимый след пути: опыт, награды и двери дальше.")}
        {openId === "level" && (
          <React.Fragment>

      {kicker("01", "Твой след")}
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
        {body("Опыт и уровень", "Весь XP стекается в одно место — золотое кольцо вокруг твоего лица. Кольцо заполнилось — уровень вырос, навсегда: он не обнуляется и не «сгорает по понедельникам». Уровень видят друзья, и именно он открывает двери дальше — к партнёрам и нетворку.")}
      </div>

      {kicker("02", "Откуда капает XP")}
      <div style={cardStyle}>
        <div style={{ padding: "16px 16px 2px", display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            ["✅", "Отметка привычки", "+10"],
            ["🌅", "Весь день закрыт", "+30"],
            ["🤝", "Друг пришёл по твоей ссылке", "+150"],
            ["🏁", "Вехи друзей · 3 / 7 / 15 / 30", "+300…3000"],
            ["⚡", "Финиш челленджа", "+40…100"],
            ["🏆", "Достижения", "разово"],
          ].map(function (r, i) {
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: softBg, borderRadius: 16, padding: "10px 12px" }}>
                <span style={{ width: 34, height: 34, borderRadius: 11, background: chipBg, boxShadow: glass, display: "grid", placeItems: "center", fontSize: 16, flexShrink: 0 }}>{r[0]}</span>
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>{r[1]}</span>
                {goldPill("✦ " + r[2] + " XP")}
              </div>
            );
          })}
        </div>
        {body("Экономика опыта", "Это весь прайс — честный и открытый. Никаких скрытых умножителей: самое ценное здесь — люди. Позвать друга даёт больше, чем неделя отметок, потому что вместе вы удержитесь оба.")}
      </div>

      {kicker("03", "Медали за путь")}
      <div style={cardStyle}>
        {visWrap(
          <div style={{ display: "flex", gap: 10 }}>
            {[["🌱", "Первый шаг"], ["🔥", "Серия 7"], ["🤝", "Не один"]].map(function (m, i) {
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 54, height: 54, borderRadius: 16, background: chipBg, boxShadow: glass, display: "grid", placeItems: "center", fontSize: 26 }}>{m[0]}</span>
                  <span style={{ fontSize: 10.5, color: "var(--text-4)", fontWeight: 600 }}>{m[1]}</span>
                </div>
              );
            })}
          </div>
        )}
        {body("Достижения", "Медали выдаются за настоящие вехи: первую привычку, серию, первого человека рядом. Каждая — разовый бонус XP и след на странице «Я». Коллекция — в «Я» → «Достижения».")}
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
        {body("Челленджи", "Готовые вызовы на несколько дней: тапнул — привычка создана, серия пошла. Дотянул до финиша — бонус XP сверху. Пропустил день — бонус НЕ сгорает: правило «ничего не сжигается» работает и тут.")}
      </div>

          </React.Fragment>
        )}
      </div>

      {/* ── ЭТАП 3: ВМЕСТЕ */}
      <div ref={function (el) { secRefs.current["together"] = el; }} style={{ scrollMarginTop: 64, marginTop: 12 }}>
        {stageHeader("together", "3", "Люди рядом", "Круги, друзья и общие привычки — чтобы не тянуть одному.")}
        {openId === "together" && (
          <React.Fragment>

      {kicker("01", "Одна орбита")}
      <div style={cardStyle}>
        <div style={{ padding: "12px 16px 0", display: "flex", justifyContent: "center" }}>
          {(typeof GoalOrbitMini === "function") ? (
            <GoalOrbitMini centerEmoji="🌅" centerColor={null}
              habits={[{ emoji: "🤸", color: "#34C759", done: true }, { emoji: "📖", color: "#0A84FF" }, { emoji: "💧", color: "#5AC8FA" }]}
              people={[{ avatar: "emoji:🐱", name: "" }, { avatar: "emoji:🦊", name: "" }, { avatar: "emoji:🙂", name: "" }]}
              size={158} dark={isDark} />
          ) : <span style={{ fontSize: 44 }}>🌅</span>}
        </div>
        {body("Совместные цели и привычки", "Любую привычку можно вести вдвоём (вы видите отметки друг друга), а цель — целым кругом: общий счёт, лица на одной орбите. Привычка круга приходит к тебе как личная — отметка где угодно попадает в общий журнал.")}
      </div>

      {kicker("02", "Правила круга")}
      <div style={cardStyle}>
        <div style={{ padding: "16px 16px 2px", display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            ["👑", "Условия задаёт создатель", "Привычки круга — его правила игры; участник их не удаляет."],
            ["🧳", "«Убрать с моей страницы»", "Не хочешь вести у себя — убери; история и опыт целы, в круге всё остаётся."],
            ["↩️", "«Вернуть к себе»", "Передумал — на странице круга одна кнопка возвращает привычку."],
          ].map(function (r, i) {
            return (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", background: softBg, borderRadius: 16, padding: "11px 12px" }}>
                <span style={{ width: 34, height: 34, borderRadius: 11, background: chipBg, boxShadow: glass, display: "grid", placeItems: "center", fontSize: 16, flexShrink: 0 }}>{r[0]}</span>
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
              <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.7, textTransform: "uppercase", opacity: 0.6 }}>Веха · +300 XP бонусом</span>
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
        {stageHeader("world", "4", "Мир Balance", "Партнёры, нетворк и Вселенная: зачем растёт уровень.")}
        {openId === "world" && (
          <React.Fragment>

      {kicker("01", "Куда тратить")}
      <div style={cardStyle}>
        {visWrap(
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
        )}
        {body("Партнёры", "XP и уровень — не просто цифры: в «Найти» партнёры меняют их на реальное — программы, разборы, скидки. И партнёром может вырасти ЛЮБОЙ пользователь: это уровень и доверие, а не должность. Билет с кодом уже в работе.")}
      </div>

      {kicker("02", "Люди по делам")}
      <div style={cardStyle}>
        <div style={{ padding: "18px 16px 2px" }}>
          <div style={{ position: "relative", borderRadius: 18, background: softBg, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 9 }}>
            {[["🤝", "Похожая структура привычек"], ["🔥", "Такой же ритм — спорт по утрам"]].map(function (r, i) {
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, filter: "blur(3.5px)", opacity: 0.6 }}>
                  <span style={{ width: 34, height: 34, borderRadius: "50%", background: chipBg, boxShadow: glass, display: "grid", placeItems: "center", fontSize: 16 }}>{r[0]}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>{r[1]}</span>
                </div>
              );
            })}
            <span style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", display: "inline-flex", alignItems: "center", gap: 6, background: isDark ? "rgba(28,28,30,0.92)" : "rgba(255,255,255,0.95)", boxShadow: "0 8px 24px rgba(0,0,0,0.18)", borderRadius: 999, padding: "8px 14px", fontSize: 12.5, fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap" }}>🔒 Откроется с 10 уровня</span>
          </div>
        </div>
        {body("Нетворк", "С 10 уровня открываются «Люди» — нетворк по делам: кто чем живёт, у кого какой ритм, к кому идти за помощью или партнёрством. Уровень — твой пропуск, и его не купить: только прожить. А часть кругов открывается иначе — ачивкой за пройденный тренинг, сразу.")}
      </div>

      {kicker("03", "Самое большое")}
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
        {body("Вселенная", "Каждый в Balance — своя система: человек в центре, привычки — планеты на орбитах. «Вселенная» на странице «Я» показывает всех — анонимно, как огни ночного города: имён не видно, но видно, что город живой. Ты уже один из этих огней.")}
      </div>

          </React.Fragment>
        )}
      </div>

      <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ padding: "0 4px 2px" }}>
          <div style={{ fontFamily: "var(--bos-title-font)", fontSize: 19, fontWeight: 800, letterSpacing: "-0.35px", color: "var(--text)" }}>Выбери следующий ход</div>
          <div style={{ fontSize: 12.5, color: "var(--text-4)", lineHeight: 1.45, marginTop: 3 }}>Гайд работает лучше, когда сразу ведёт в действие — маленькое, но настоящее.</div>
        </div>
        {guideAction("✅", "Перейти к привычкам", "создать или отметить свой первый ритуал", "habits", null, true)}
        {guideAction("🤝", "Посмотреть круги и людей", "найти, с кем держаться дольше", "community", null, false)}
        <button onClick={function () { navigate("ai-chat", { prompt: "Объясни, как устроен Balance и с чего мне лучше начать" }); }} className="tap" style={{ width: "100%", border: 0, borderRadius: 999, padding: 15, background: softBg, color: "var(--text-2)", fontSize: 13.5, fontWeight: 700, cursor: "pointer", boxShadow: glass }}>Остались вопросы — спроси Balance AI ›</button>
      </div>
    </div>
  );
}
